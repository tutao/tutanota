//@flow
import {getFromMap} from "../../api/common/utils/MapUtils"
import type {DeferredObject} from "../../api/common/utils/Utils"
import {assertNotNull, clone, defer, downcast, filterInt, noOp} from "../../api/common/utils/Utils"
import {CalendarMethod, FeatureType, GroupType, OperationType} from "../../api/common/TutanotaConstants"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {_eraseEntity, _loadEntity, HttpMethod} from "../../api/common/EntityFunctions"
import type {UserAlarmInfo} from "../../api/entities/sys/UserAlarmInfo"
import {UserAlarmInfoTypeRef} from "../../api/entities/sys/UserAlarmInfo"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../../api/entities/tutanota/CalendarEvent"
import {isApp} from "../../api/common/Env"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import {LockedError, NotAuthorizedError, NotFoundError, PreconditionFailedError} from "../../api/common/error/RestError"
import {client} from "../../misc/ClientDetector"
import type {User} from "../../api/entities/sys/User"
import type {CalendarGroupRoot} from "../../api/entities/tutanota/CalendarGroupRoot"
import {CalendarGroupRootTypeRef} from "../../api/entities/tutanota/CalendarGroupRoot"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import type {CalendarInfo} from "../view/CalendarView"
import type {ParsedCalendarData} from "../export/CalendarImporter"
import type {CalendarEventUpdate} from "../../api/entities/tutanota/CalendarEventUpdate"
import {CalendarEventUpdateTypeRef} from "../../api/entities/tutanota/CalendarEventUpdate"
import {LazyLoaded} from "../../api/common/utils/LazyLoaded"
import {createMembershipRemoveData} from "../../api/entities/sys/MembershipRemoveData"
import {SysService} from "../../api/entities/sys/Services"
import {GroupTypeRef} from "../../api/entities/sys/Group"
import type {AlarmInfo} from "../../api/entities/sys/AlarmInfo"
import type {CalendarRepeatRule} from "../../api/entities/tutanota/CalendarRepeatRule"
import {ParserError} from "../../misc/parsing/ParserCombinator"
import {ProgressTracker} from "../../api/main/ProgressTracker"
import type {IProgressMonitor} from "../../api/common/utils/ProgressMonitor"
import {EntityClient} from "../../api/common/EntityClient"
import type {MailModel} from "../../mail/model/MailModel"
import {elementIdPart, getElementId, isSameId, listIdPart} from "../../api/common/utils/EntityUtils";
import {FileTypeRef} from "../../api/entities/tutanota/File"
import type {AlarmScheduler} from "../date/AlarmScheduler"
import type {Notifications} from "../../gui/Notifications"
import m from "mithril"


// Complete as needed
export interface CalendarModel {
	init(): Promise<void>;

	createEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, zone: string, groupRoot: CalendarGroupRoot): Promise<void>;

	/** Update existing event when time did not change */
	updateEvent(newEvent: CalendarEvent, newAlarms: Array<AlarmInfo>, zone: string, groupRoot: CalendarGroupRoot,
	            existingEvent: CalendarEvent
	): Promise<CalendarEvent>;

	deleteEvent(event: CalendarEvent): Promise<void>;

	loadAlarms(alarmInfos: Array<IdTuple>, user: User): Promise<Array<UserAlarmInfo>>;

	/** Load map from group/groupRoot ID to the calendar info */
	loadCalendarInfos(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>>;

	loadOrCreateCalendarInfo(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>>;

	/**
	 * Update {@param dbEvent} stored on the server with {@param event} from the ics file.
	 */
	updateEventWithExternal(dbEvent: CalendarEvent, event: CalendarEvent): Promise<CalendarEvent>;
}

export class CalendarModelImpl implements CalendarModel {
	_worker: WorkerClient;
	_scheduledNotifications: Map<string, TimeoutID>;
	_notifications: Notifications
	/** Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event */
	_pendingAlarmRequests: Map<string, DeferredObject<void>>;
	_progressTracker: ProgressTracker
	_logins: LoginController;
	_entityClient: EntityClient;
	_mailModel: MailModel;
	_alarmScheduler: () => Promise<AlarmScheduler>;
	+_userAlarmToAlarmInfo: Map<string, string>

	constructor(notifications: Notifications, alarmScheduler: () => Promise<AlarmScheduler>, eventController: EventController, worker: WorkerClient,
	            logins: LoginController, progressTracker: ProgressTracker, entityClient: EntityClient, mailModel: MailModel
	) {
		this._notifications = notifications
		this._alarmScheduler = alarmScheduler
		this._logins = logins
		this._worker = worker
		this._scheduledNotifications = new Map()
		this._pendingAlarmRequests = new Map()
		this._progressTracker = progressTracker
		this._entityClient = entityClient
		this._mailModel = mailModel
		this._userAlarmToAlarmInfo = new Map()
		if (!isApp()) {
			eventController.addEntityListener((updates: $ReadOnlyArray<EntityUpdateData>) => {
				return this._entityEventsReceived(updates)
			})
		}
	}

	createEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, zone: string, groupRoot: CalendarGroupRoot): Promise<void> {
		return this._doCreate(event, zone, groupRoot, alarmInfos)
	}

	/**
	 * Update existing event.
	 * @param newAlarms - current state of alarms belonging to the user.
	 * */
	updateEvent(newEvent: CalendarEvent, newAlarms: Array<AlarmInfo>, zone: string, groupRoot: CalendarGroupRoot,
	            existingEvent: CalendarEvent
	): Promise<CalendarEvent> {
		if (existingEvent._id == null) {
			throw new Error("Invalid existing event: no id")
		}
		if (existingEvent._ownerGroup !== groupRoot._id || newEvent.startTime.getTime() !== existingEvent.startTime.getTime()
			|| !repeatRulesEqual(newEvent.repeatRule, existingEvent.repeatRule)
		) {
			// We should reload the instance here because session key and permissions are updated when we recreate event.
			return this._doCreate(newEvent, zone, groupRoot, newAlarms, existingEvent)
			           .then(() => _loadEntity(CalendarEventTypeRef, newEvent._id, null, this._worker))
		} else {
			newEvent._ownerGroup = groupRoot._id
			// We can't load updated event here because cache is not updated yet. We also shouldn't need to load it, we have the latest
			// version
			return this._worker.updateCalendarEvent(newEvent, newAlarms, existingEvent)
			           .return(newEvent)
		}
	}

	loadCalendarInfos(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>> {
		const user = this._logins.getUserController().user
		const calendarMemberships = user.memberships.filter(m => m.groupType === GroupType.Calendar);
		const notFoundMemberships = []
		return Promise
			.mapSeries(calendarMemberships, (membership) => Promise
				.all([
					this._entityClient.load(CalendarGroupRootTypeRef, membership.group).tap(() => progressMonitor.workDone(1)),
					this._entityClient.load(GroupInfoTypeRef, membership.groupInfo).tap(() => progressMonitor.workDone(1)),
					this._entityClient.load(GroupTypeRef, membership.group).tap(() => progressMonitor.workDone(1))
				])
				.catch(NotFoundError, () => {
					notFoundMemberships.push(membership)
					progressMonitor.workDone(3)
					return null
				})
			)
			.then((groupInstances) => {
				const calendarInfos: Map<Id, CalendarInfo> = new Map()
				const filtered = groupInstances.filter(Boolean)
				progressMonitor.workDone(groupInstances.length - filtered.length) // say we completed all the ones that we wont have to load
				filtered.forEach(([groupRoot, groupInfo, group]) => {
					calendarInfos.set(groupRoot._id, {
						groupRoot,
						groupInfo,
						shortEvents: [],
						longEvents: new LazyLoaded(() => this._entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents), []),
						group: group,
						shared: !isSameId(group.user, user._id)
					})
				})

				// cleanup inconsistent memberships
				Promise.each(notFoundMemberships, (notFoundMembership) => {
					const data = createMembershipRemoveData({user: user._id, group: notFoundMembership.group})
					return this._worker.serviceRequest(SysService.MembershipService, HttpMethod.DELETE, data)
				})
				return calendarInfos
			})
	}

	loadOrCreateCalendarInfo(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>> {
		return import("../date/CalendarUtils")
			.then(({findPrivateCalendar}) => {
				return this.loadCalendarInfos(progressMonitor)
				           .then((calendarInfo) => (!this._logins.isInternalUserLoggedIn() || findPrivateCalendar(calendarInfo))
					           ? calendarInfo
					           : this._worker.addCalendar("").then(() => this.loadCalendarInfos(progressMonitor)))
			})
	}

	_doCreate(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot, alarmInfos: Array<AlarmInfo>,
	          existingEvent: ?CalendarEvent
	): Promise<void> {
		return import("../date/CalendarUtils").then(({assignEventId}) => {
			// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
			// one.
			assignEventId(event, zone, groupRoot)
			// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
			event._ownerEncSessionKey = null
			// Reset permissions because server will assign them
			downcast(event)._permissions = null
			event._ownerGroup = groupRoot._id

			return this._worker.createCalendarEvent(event, alarmInfos, existingEvent)
		})
	}

	deleteEvent(event: CalendarEvent): Promise<void> {
		return this._entityClient.erase(event)
	}

	_loadAndProcessCalendarUpdates(): Promise<void> {
		return this._mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			const {calendarEventUpdates} = mailboxDetails.mailboxGroupRoot
			if (calendarEventUpdates == null) return
			this._entityClient.loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list)
			    .then((invites) => {
				    return Promise.each(invites, (invite) => {
					    return this._handleCalendarEventUpdate(invite)
				    })
			    })
		})
	}

	_handleCalendarEventUpdate(update: CalendarEventUpdate): Promise<void> {
		return this._entityClient.load(FileTypeRef, update.file)
		           .then((file) => this._worker.downloadFileContent(file))
		           .then((dataFile: DataFile) =>
			           import("../export/CalendarImporter.js").then(({parseCalendarFile}) => parseCalendarFile(dataFile)))
		           .then((parsedCalendarData) => this.processCalendarUpdate(update.sender, parsedCalendarData))
		           .catch((e) => e instanceof ParserError || e instanceof NotFoundError,
			           (e) => console.warn("Error while parsing calendar update", e))
		           .then(() => this._entityClient.erase(update))
		           .catch(NotAuthorizedError, (e) => console.warn("Error during processing of calendar update", e))
		           .catch(PreconditionFailedError, (e) => console.warn("Precondition error when processing calendar update", e))
		           .catch(LockedError, noOp)
	}

	/**
	 * Processing calendar update - bring events in calendar up-to-date with updates sent via email.
	 * Calendar updates are currently processed for REPLY, REQUEST and CANCEL calendar types. For REQUEST type the update is only processed
	 * if there is an existing event.
	 * For REPLY we update attendee status, for REQUEST we update event and for CANCEL we delete existing event.
	 */
	processCalendarUpdate(sender: string, calendarData: ParsedCalendarData): Promise<void> {
		if (calendarData.contents.length !== 1) {
			console.log(`Calendar update with ${calendarData.contents.length} events, ignoring`)
			return Promise.resolve()
		}
		const {event} = calendarData.contents[0]
		if (event == null || event.uid == null) {
			console.log("Invalid event: ", event)
			return Promise.resolve()
		}
		const uid = event.uid

		if (calendarData.method === CalendarMethod.REPLY) {
			// Process it
			return this._worker.getEventByUid(uid).then((dbEvent) => {
				if (dbEvent == null) {
					// event was not found
					return
				}
				// first check if the sender of the email is in the attendee list
				const replyAttendee = event.attendees.find((a) => a.address.address === sender)
				if (replyAttendee == null) {
					console.log("Sender is not among attendees, ignoring", replyAttendee)
					return
				}

				const newEvent = clone(dbEvent)
				// check if the attendee is still in the attendee list of the latest event
				const dbAttendee = newEvent.attendees.find((a) =>
					replyAttendee.address.address === a.address.address)
				if (dbAttendee == null) {
					console.log("Attendee was not found", dbEvent._id, replyAttendee)
					return
				}
				dbAttendee.status = replyAttendee.status
				return this._updateEvent(dbEvent, newEvent).return()
			})
		} else if (calendarData.method === CalendarMethod.REQUEST) { // Either initial invite or update
			return this._worker.getEventByUid(uid).then((dbEvent) => {
				if (dbEvent) {
					// then it's an update
					if (dbEvent.organizer == null || dbEvent.organizer.address !== sender) {
						console.log("REQUEST sent not by organizer, ignoring")
						return
					}
					if (filterInt(dbEvent.sequence) < filterInt(event.sequence)) {
						return this.updateEventWithExternal(dbEvent, event).return()
					}
				}
			})
		} else if (calendarData.method === CalendarMethod.CANCEL) {
			return this._worker.getEventByUid(uid).then((dbEvent) => {
				if (dbEvent != null) {
					if (dbEvent.organizer == null || dbEvent.organizer.address !== sender) {
						console.log("CANCEL sent not by organizer, ignoring")
						return
					}
					//console.log("Deleting cancelled event", uid, dbEvent._id)
					return _eraseEntity(dbEvent, this._worker)
				}
			})
		} else {
			return Promise.resolve()
		}
	}

	updateEventWithExternal(dbEvent: CalendarEvent, event: CalendarEvent): Promise<CalendarEvent> {
		const newEvent = clone(dbEvent)
		newEvent.startTime = event.startTime
		newEvent.endTime = event.endTime
		newEvent.attendees = event.attendees
		newEvent.summary = event.summary
		newEvent.sequence = event.sequence
		newEvent.location = event.location
		newEvent.description = event.description
		newEvent.organizer = event.organizer
		newEvent.repeatRule = event.repeatRule
		return this._updateEvent(dbEvent, newEvent)
	}

	_updateEvent(dbEvent: CalendarEvent, newEvent: CalendarEvent): Promise<CalendarEvent> {
		return Promise.all([
			this.loadAlarms(dbEvent.alarmInfos, this._logins.getUserController().user),
			_loadEntity(CalendarGroupRootTypeRef, assertNotNull(dbEvent._ownerGroup), null, this._worker)
		]).then(([alarms, groupRoot]) => {
			const alarmInfos = alarms.map((a) => a.alarmInfo)
			return this.updateEvent(newEvent, alarmInfos, "", groupRoot, dbEvent)
		})
	}

	init(): Promise<void> {
		return this.scheduleAlarmsLocally()
		           .then(() => this._loadAndProcessCalendarUpdates())
	}

	scheduleAlarmsLocally(): Promise<void> {
		if (this._localAlarmsEnabled()) {
			return this._worker.loadAlarmEvents()
			           .then((eventsWithInfos) => {
				           eventsWithInfos.forEach(({event, userAlarmInfo}) => {
					           this._scheduleUserAlarmInfo(event, userAlarmInfo)
				           })
			           })
		} else {
			return Promise.resolve()
		}
	}

	loadAlarms(alarmInfos: Array<IdTuple>, user: User): Promise<Array<UserAlarmInfo>> {
		const {alarmInfoList} = user
		if (alarmInfoList == null) {
			return Promise.resolve([])
		}
		const ids = alarmInfos
			.filter((alarmInfoId) => isSameId(listIdPart(alarmInfoId), alarmInfoList.alarms))
		if (ids.length === 0) {
			return Promise.resolve([])
		}
		return this._entityClient.loadMultipleEntities(UserAlarmInfoTypeRef, listIdPart(ids[0]), ids.map(elementIdPart))
	}

	_entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return Promise.each(updates, entityEventData => {
			if (isUpdateForTypeRef(UserAlarmInfoTypeRef, entityEventData)) {
				if (entityEventData.operation === OperationType.CREATE) {
					const userAlarmInfoId = [entityEventData.instanceListId, entityEventData.instanceId]
					// Updates for UserAlarmInfo and CalendarEvent come in a
					// separate batches and there's a race between loading of the
					// UserAlarmInfo and creation of the event.
					// We try to load UserAlarmInfo. Then we wait until the
					// CalendarEvent is there (which might already be true)
					// and load it.
					return this._entityClient.load(UserAlarmInfoTypeRef, userAlarmInfoId).then((userAlarmInfo) => {
						const {listId, elementId} = userAlarmInfo.alarmInfo.calendarRef
						const deferredEvent = getFromMap(this._pendingAlarmRequests, elementId, defer)
						// Don't wait for the deferred event promise because it can lead to a deadlock.
						// Since issue #2264 we process event batches sequentially and the
						// deferred event can never be resolved until the calendar event update is received.
						deferredEvent.promise.then(() => {
							return this._entityClient.load(CalendarEventTypeRef, [listId, elementId])
							           .then(calendarEvent => {
								           return this._scheduleUserAlarmInfo(calendarEvent, userAlarmInfo)
							           })
							           .catch(NotFoundError, () => {
								           console.log("event not found", [listId, elementId])
							           })
						})
						return Promise.resolve()
					}).catch(NotFoundError, (e) => console.log(e, "Event or alarm were not found: ", entityEventData, e))
				} else if (entityEventData.operation === OperationType.DELETE) {
					return this._cancelUserAlarmInfo(entityEventData.instanceId)
				}
			} else if (isUpdateForTypeRef(CalendarEventTypeRef, entityEventData)
				&& (entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE)) {
				return getFromMap(this._pendingAlarmRequests, entityEventData.instanceId, defer).resolve()
			} else if (isUpdateForTypeRef(CalendarEventUpdateTypeRef, entityEventData)
				&& entityEventData.operation === OperationType.CREATE) {
				return this._entityClient.load(CalendarEventUpdateTypeRef, [entityEventData.instanceListId, entityEventData.instanceId])
				           .then((invite) => this._handleCalendarEventUpdate(invite))
				           .catch(NotFoundError, (e) => {
					           console.log("invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e)
				           })
			}
		}).return()
	}

	_localAlarmsEnabled(): boolean {
		return !isApp() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar) && client.calendarSupported()
	}


	async _scheduleUserAlarmInfo(event: CalendarEvent, userAlarmInfo: UserAlarmInfo): Promise<*> {
		const scheduler: AlarmScheduler = await this._alarmScheduler()
		this._userAlarmToAlarmInfo.set(getElementId(userAlarmInfo), userAlarmInfo.alarmInfo.alarmIdentifier)
		await scheduler.scheduleAlarm(event, userAlarmInfo.alarmInfo, event.repeatRule, (title, body) => {
			this._notifications.showNotification(title, {body}, () => m.route.set("/calendar"))
		})
	}

	async _cancelUserAlarmInfo(userAlarmInfoId: Id): Promise<*> {
		const identifier = this._userAlarmToAlarmInfo.get(userAlarmInfoId)
		if (identifier) {
			const alarmScheduler = await this._alarmScheduler()
			alarmScheduler.cancelAlarm(identifier)
		}
	}
}

// allDay event consists of full UTC days. It always starts at 00:00:00.00 of its start day in UTC and ends at
// 0 of the next day in UTC. Full day event time is relative to the local timezone. So startTime and endTime of
// allDay event just points us to the correct date.
// e.g. there's an allDay event in Europe/Berlin at 2nd of may. We encode it as:
// {startTime: new Date(Date.UTC(2019, 04, 2, 0, 0, 0, 0)), {endTime: new Date(Date.UTC(2019, 04, 3, 0, 0, 0, 0))}}
// We check the condition with time == 0 and take a UTC date (which is [2-3) so full day on the 2nd of May). We
function repeatRulesEqual(repeatRule: ?CalendarRepeatRule, repeatRule2: ?CalendarRepeatRule): boolean {
	return (repeatRule == null && repeatRule2 == null) ||
		(repeatRule != null && repeatRule2 != null &&
			repeatRule.endType === repeatRule2.endType &&
			repeatRule.endValue === repeatRule2.endValue &&
			repeatRule.frequency === repeatRule2.frequency &&
			repeatRule.interval === repeatRule2.interval &&
			repeatRule.timeZone === repeatRule2.timeZone)
}
