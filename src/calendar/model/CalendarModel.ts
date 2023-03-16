import type { DeferredObject } from "@tutao/tutanota-utils"
import { assertNotNull, clone, defer, downcast, filterInt, getFromMap, LazyLoaded, noOp } from "@tutao/tutanota-utils"
import { CalendarMethod, FeatureType, GroupType, OperationType } from "../../api/common/TutanotaConstants"
import type { EntityUpdateData } from "../../api/main/EventController"
import { EventController, isUpdateForTypeRef } from "../../api/main/EventController"
import type { AlarmInfo, DateWrapper, Group, GroupInfo, User, UserAlarmInfo } from "../../api/entities/sys/TypeRefs.js"
import { createMembershipRemoveData, GroupInfoTypeRef, GroupMembership, GroupTypeRef, UserAlarmInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarEventUpdate,
	CalendarEventUpdateTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	CalendarRepeatRule,
	createGroupSettings,
	FileTypeRef,
} from "../../api/entities/tutanota/TypeRefs.js"
import { isApp, isDesktop } from "../../api/common/Env"
import type { LoginController } from "../../api/main/LoginController"
import { LockedError, NotAuthorizedError, NotFoundError, PreconditionFailedError } from "../../api/common/error/RestError"
import type { ParsedCalendarData } from "../export/CalendarImporter"
import { ParserError } from "../../misc/parsing/ParserCombinator"
import { ProgressTracker } from "../../api/main/ProgressTracker"
import type { IProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import { EntityClient } from "../../api/common/EntityClient"
import type { MailModel } from "../../mail/model/MailModel"
import { elementIdPart, getElementId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import type { AlarmScheduler } from "../date/AlarmScheduler"
import type { Notifications } from "../../gui/Notifications"
import m from "mithril"
import type { CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { IServiceExecutor } from "../../api/common/ServiceRequest"
import { MembershipService } from "../../api/entities/sys/Services"
import { FileController } from "../../file/FileController"
import { findAttendeeInAddresses } from "../../api/common/utils/CommonCalendarUtils.js"

const TAG = "[CalendarModel]"

export type CalendarInfo = {
	groupRoot: CalendarGroupRoot
	// We use LazyLoaded so that we don't get races for loading these events which is
	// 1. Good because loading them twice is not optimal
	// 2. Event identity is required by some functions (e.g. when determining week events)
	longEvents: LazyLoaded<Array<CalendarEvent>>
	groupInfo: GroupInfo
	group: Group
	shared: boolean
}

export class CalendarModel {
	/** Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event */
	private pendingAlarmRequests: Map<string, DeferredObject<void>> = new Map()
	private readonly userAlarmToAlarmInfo: Map<string, string> = new Map()

	constructor(
		private readonly notifications: Notifications,
		private readonly alarmScheduler: () => Promise<AlarmScheduler>,
		eventController: EventController,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly logins: LoginController,
		private readonly progressTracker: ProgressTracker,
		private readonly entityClient: EntityClient,
		private readonly mailModel: MailModel,
		private readonly calendarFacade: CalendarFacade,
		private readonly fileController: FileController,
	) {
		if (isApp()) return
		eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	}

	async createEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, zone: string, groupRoot: CalendarGroupRoot): Promise<void> {
		await this.doCreate(event, zone, groupRoot, alarmInfos)
	}

	/** Update existing event when time did not change */
	async updateEvent(
		newEvent: CalendarEvent,
		newAlarms: Array<AlarmInfo>,
		zone: string,
		groupRoot: CalendarGroupRoot,
		existingEvent: CalendarEvent,
	): Promise<CalendarEvent> {
		if (existingEvent._id == null) {
			throw new Error("Invalid existing event: no id")
		}

		if (
			existingEvent._ownerGroup !== groupRoot._id ||
			newEvent.startTime.getTime() !== existingEvent.startTime.getTime() ||
			!repeatRulesEqual(newEvent.repeatRule, existingEvent.repeatRule)
		) {
			// We should reload the instance here because session key and permissions are updated when we recreate event.
			await this.doCreate(newEvent, zone, groupRoot, newAlarms, existingEvent)
			return await this.entityClient.load<CalendarEvent>(CalendarEventTypeRef, newEvent._id)
		} else {
			newEvent._ownerGroup = groupRoot._id
			// We can't load updated event here because cache is not updated yet. We also shouldn't need to load it, we have the latest
			// version
			await this.calendarFacade.updateCalendarEvent(newEvent, newAlarms, existingEvent)
			return newEvent
		}
	}

	/** Load map from group/groupRoot ID to the calendar info */
	async loadCalendarInfos(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>> {
		const user = this.logins.getUserController().user

		const calendarMemberships = user.memberships.filter((m) => m.groupType === GroupType.Calendar)
		const notFoundMemberships: GroupMembership[] = []
		const groupInstances: Array<[CalendarGroupRoot, GroupInfo, Group]> = []
		for (const membership of calendarMemberships) {
			try {
				const result = await Promise.all([
					this.entityClient.load(CalendarGroupRootTypeRef, membership.group),
					this.entityClient.load(GroupInfoTypeRef, membership.groupInfo),
					this.entityClient.load(GroupTypeRef, membership.group),
				])
				groupInstances.push(result)
			} catch (e) {
				if (e instanceof NotFoundError) {
					notFoundMemberships.push(membership)
				} else {
					throw e
				}
			}
			progressMonitor.workDone(3)
		}

		const calendarInfos: Map<Id, CalendarInfo> = new Map()
		for (const [groupRoot, groupInfo, group] of groupInstances) {
			calendarInfos.set(groupRoot._id, {
				groupRoot,
				groupInfo,
				longEvents: new LazyLoaded(() => this.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents), []),
				group: group,
				shared: !isSameId(group.user, user._id),
			})
		}

		// cleanup inconsistent memberships
		for (const mship of notFoundMemberships) {
			// noinspection ES6MissingAwait
			this.serviceExecutor.delete(MembershipService, createMembershipRemoveData({ user: user._id, group: mship.group }))
		}
		return calendarInfos
	}

	async loadOrCreateCalendarInfo(progressMonitor: IProgressMonitor): Promise<Map<Id, CalendarInfo>> {
		const { findPrivateCalendar } = await import("../date/CalendarUtils")
		const calendarInfo = await this.loadCalendarInfos(progressMonitor)

		if (!this.logins.isInternalUserLoggedIn() || findPrivateCalendar(calendarInfo)) {
			return calendarInfo
		} else {
			await this.createCalendar("", null)
			return await this.loadCalendarInfos(progressMonitor)
		}
	}

	async createCalendar(name: string, color: string | null): Promise<void> {
		// when a calendar group is added, a group membership is added to the user. we might miss this websocket event
		// during startup if the websocket is not connected fast enough. Therefore, we explicitly update the user
		// this should be removed once we handle missed events during startup
		const { user, group } = await this.calendarFacade.addCalendar(name)
		this.logins.getUserController().user = user

		if (color != null) {
			const { userSettingsGroupRoot } = this.logins.getUserController()

			const newGroupSettings = Object.assign(createGroupSettings(), {
				group: group._id,
				color: color,
			})
			userSettingsGroupRoot.groupSettings.push(newGroupSettings)
			await this.entityClient.update(userSettingsGroupRoot)
		}
	}

	private async doCreate(
		event: CalendarEvent,
		zone: string,
		groupRoot: CalendarGroupRoot,
		alarmInfos: Array<AlarmInfo>,
		existingEvent?: CalendarEvent,
	): Promise<void> {
		const { assignEventId } = await import("../date/CalendarUtils")
		// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
		// one.
		assignEventId(event, zone, groupRoot)
		// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
		event._ownerEncSessionKey = null
		// FIXME: wtf
		event?.repeatRule?.excludedDates.forEach((dw) => (downcast(dw)._finalEncrypted_date = null))
		// Reset permissions because server will assign them
		downcast(event)._permissions = null
		event._ownerGroup = groupRoot._id
		return await this.calendarFacade.saveCalendarEvent(event, alarmInfos, existingEvent ?? null)
	}

	async deleteEvent(event: CalendarEvent): Promise<void> {
		return await this.entityClient.erase(event)
	}

	private async loadAndProcessCalendarUpdates(): Promise<void> {
		const { mailboxGroupRoot } = await this.mailModel.getUserMailboxDetails()
		const { calendarEventUpdates } = mailboxGroupRoot
		if (calendarEventUpdates == null) return

		const invites = await this.entityClient.loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list)
		for (const invite of invites) {
			// noinspection ES6MissingAwait
			this.handleCalendarEventUpdate(invite)
		}
	}

	private async getCalendarDataForUpdate(fileId: IdTuple): Promise<ParsedCalendarData | null> {
		try {
			const file = await this.entityClient.load(FileTypeRef, fileId)
			const dataFile = await this.fileController.getAsDataFile(file)
			const { parseCalendarFile } = await import("../export/CalendarImporter")
			return parseCalendarFile(dataFile)
		} catch (e) {
			if (e instanceof ParserError || e instanceof NotFoundError) {
				console.warn(TAG, "could not get calendar update data", e)
				return null
			}
			throw e
		}
	}

	private async handleCalendarEventUpdate(update: CalendarEventUpdate): Promise<void> {
		try {
			const parsedCalendarData = await this.getCalendarDataForUpdate(update.file)
			if (parsedCalendarData != null) {
				await this.processCalendarUpdate(update.sender, parsedCalendarData)
			}
			await this.entityClient.erase(update)
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				console.warn(TAG, "could not process calendar update: not authorized", e)
			} else if (e instanceof PreconditionFailedError) {
				console.warn(TAG, "could not process calendar update: precondition failed", e)
			} else if (e instanceof LockedError) {
				console.warn(TAG, "could not process calendar update: locked", e)
			} else if (e instanceof NotFoundError) {
				console.warn(TAG, "could not process calendar update: not found", e)
			} else {
				throw e
			}
		}
	}

	/**
	 * Processing calendar update - bring events in calendar up-to-date with updates sent via email.
	 * Calendar updates are currently processed for REPLY, REQUEST and CANCEL calendar types. For REQUEST type the update is only processed
	 * if there is an existing event.
	 * For REPLY we update attendee status, for REQUEST we update event and for CANCEL we delete existing event.
	 *
	 * public for testing
	 */
	async processCalendarUpdate(sender: string, calendarData: ParsedCalendarData): Promise<void> {
		if (calendarData.contents.length !== 1) {
			console.log(TAG, `Calendar update with ${calendarData.contents.length} events, ignoring`)
			return
		}

		const { event } = calendarData.contents[0]

		if (event == null || event.uid == null) {
			console.log(TAG, "Invalid event: ", event)
			return
		}

		const dbEvent = await this.calendarFacade.getEventByUid(event.uid)
		if (dbEvent == null) {
			// event was not found
			return
		}

		if (calendarData.method === CalendarMethod.REPLY) {
			// first check if the sender of the email is in the attendee list
			const replyAttendee = findAttendeeInAddresses(event.attendees, [sender])

			if (replyAttendee == null) {
				console.log(TAG, "Sender is not among attendees, ignoring", replyAttendee)
				return
			}

			const newEvent = clone(dbEvent)
			// check if the attendee is still in the attendee list of the latest event
			const dbAttendee = findAttendeeInAddresses(newEvent.attendees, [replyAttendee.address.address])

			if (dbAttendee == null) {
				console.log(TAG, "Attendee was not found", dbEvent._id, replyAttendee)
				return
			}

			dbAttendee.status = replyAttendee.status
			await this.doUpdateEvent(dbEvent, newEvent)
		} else if (calendarData.method === CalendarMethod.REQUEST) {
			// Either initial invite or update
			// then it's an update
			if (dbEvent.organizer == null || dbEvent.organizer.address !== sender) {
				console.log(TAG, "REQUEST sent not by organizer, ignoring")
				return
			}

			if (filterInt(dbEvent.sequence) < filterInt(event.sequence)) {
				await this.updateEventWithExternal(dbEvent, event).then(noOp)
				return
			}
		} else if (calendarData.method === CalendarMethod.CANCEL) {
			if (dbEvent.organizer == null || dbEvent.organizer.address !== sender) {
				console.log(TAG, "CANCEL sent not by organizer, ignoring")
				return
			}
			await this.entityClient.erase(dbEvent)
			return
		}
	}

	/**
	 * Update {@param dbEvent} stored on the server with {@param event} from the ics file.
	 */
	async updateEventWithExternal(dbEvent: CalendarEvent, event: CalendarEvent): Promise<CalendarEvent> {
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
		return await this.doUpdateEvent(dbEvent, newEvent)
	}

	async doUpdateEvent(dbEvent: CalendarEvent, newEvent: CalendarEvent): Promise<CalendarEvent> {
		const [alarms, groupRoot] = await Promise.all([
			this.loadAlarms(dbEvent.alarmInfos, this.logins.getUserController().user),
			this.entityClient.load<CalendarGroupRoot>(CalendarGroupRootTypeRef, assertNotNull(dbEvent._ownerGroup)),
		])
		const alarmInfos = alarms.map((a) => a.alarmInfo)
		return await this.updateEvent(newEvent, alarmInfos, "", groupRoot, dbEvent)
	}

	async init(): Promise<void> {
		await this.scheduleAlarmsLocally()
		await this.loadAndProcessCalendarUpdates()
	}

	async scheduleAlarmsLocally(): Promise<void> {
		if (!this.localAlarmsEnabled()) return
		const eventsWithInfos = await this.calendarFacade.loadAlarmEvents()
		const scheduler: AlarmScheduler = await this.alarmScheduler()
		for (let { event, userAlarmInfos } of eventsWithInfos) {
			for (let userAlarmInfo of userAlarmInfos) {
				this.scheduleUserAlarmInfo(event, userAlarmInfo, scheduler)
			}
		}
	}

	async loadAlarms(alarmInfos: Array<IdTuple>, user: User): Promise<Array<UserAlarmInfo>> {
		const { alarmInfoList } = user

		if (alarmInfoList == null) {
			return []
		}

		const ids = alarmInfos.filter((alarmInfoId) => isSameId(listIdPart(alarmInfoId), alarmInfoList.alarms))

		if (ids.length === 0) {
			return []
		}

		return this.entityClient.loadMultiple(UserAlarmInfoTypeRef, listIdPart(ids[0]), ids.map(elementIdPart))
	}

	async deleteCalendar(calendar: CalendarInfo): Promise<void> {
		await this.calendarFacade.deleteCalendar(calendar.groupRoot._id)
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const entityEventData of updates) {
			if (isUpdateForTypeRef(UserAlarmInfoTypeRef, entityEventData)) {
				if (entityEventData.operation === OperationType.CREATE) {
					// Updates for UserAlarmInfo and CalendarEvent come in a
					// separate batches and there's a race between loading of the
					// UserAlarmInfo and creation of the event.
					// We try to load UserAlarmInfo. Then we wait until the
					// CalendarEvent is there (which might already be true)
					// and load it.
					try {
						const userAlarmInfo = await this.entityClient.load(UserAlarmInfoTypeRef, [entityEventData.instanceListId, entityEventData.instanceId])

						const { listId, elementId } = userAlarmInfo.alarmInfo.calendarRef
						const deferredEvent = getFromMap(this.pendingAlarmRequests, elementId, defer)
						// Don't wait for the deferred event promise because it can lead to a deadlock.
						// Since issue #2264 we process event batches sequentially and the
						// deferred event can never be resolved until the calendar event update is received.
						deferredEvent.promise = deferredEvent.promise.then(async () => {
							const calendarEvent = await this.entityClient.load(CalendarEventTypeRef, [listId, elementId])
							const scheduler = await this.alarmScheduler()
							try {
								this.scheduleUserAlarmInfo(calendarEvent, userAlarmInfo, scheduler)
							} catch (e) {
								if (e instanceof NotFoundError) {
									console.log(TAG, "event not found", [listId, elementId])
								} else {
									throw e
								}
							}
						})
						return
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log(TAG, e, "Event or alarm were not found: ", entityEventData, e)
						} else {
							throw e
						}
					}
				} else if (entityEventData.operation === OperationType.DELETE) {
					return await this.cancelUserAlarmInfo(entityEventData.instanceId)
				}
			} else if (
				isUpdateForTypeRef(CalendarEventTypeRef, entityEventData) &&
				(entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE)
			) {
				const deferredEvent = getFromMap(this.pendingAlarmRequests, entityEventData.instanceId, defer)
				deferredEvent.resolve(undefined)
				await deferredEvent.promise
			} else if (isUpdateForTypeRef(CalendarEventUpdateTypeRef, entityEventData) && entityEventData.operation === OperationType.CREATE) {
				try {
					const invite = await this.entityClient.load(CalendarEventUpdateTypeRef, [entityEventData.instanceListId, entityEventData.instanceId])
					await this.handleCalendarEventUpdate(invite)
				} catch (e) {
					if (e instanceof NotFoundError) {
						console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e)
					} else {
						throw e
					}
				}
			}
		}
	}

	private localAlarmsEnabled(): boolean {
		return !isApp() && !isDesktop() && this.logins.isInternalUserLoggedIn() && !this.logins.isEnabled(FeatureType.DisableCalendar)
	}

	private scheduleUserAlarmInfo(event: CalendarEvent, userAlarmInfo: UserAlarmInfo, scheduler: AlarmScheduler): void {
		this.userAlarmToAlarmInfo.set(getElementId(userAlarmInfo), userAlarmInfo.alarmInfo.alarmIdentifier)

		scheduler.scheduleAlarm(event, userAlarmInfo.alarmInfo, event.repeatRule, (title, body) => {
			this.notifications.showNotification(
				title,
				{
					body,
				},
				() => m.route.set("/calendar"),
			)
		})
	}

	private async cancelUserAlarmInfo(userAlarmInfoId: Id): Promise<any> {
		const identifier = this.userAlarmToAlarmInfo.get(userAlarmInfoId)

		if (identifier) {
			const alarmScheduler = await this.alarmScheduler()
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
function repeatRulesEqual(repeatRule: CalendarRepeatRule | null, repeatRule2: CalendarRepeatRule | null): boolean {
	return (
		(repeatRule == null && repeatRule2 == null) ||
		(repeatRule != null &&
			repeatRule2 != null &&
			repeatRule.endType === repeatRule2.endType &&
			repeatRule.endValue === repeatRule2.endValue &&
			repeatRule.frequency === repeatRule2.frequency &&
			repeatRule.interval === repeatRule2.interval &&
			repeatRule.timeZone === repeatRule2.timeZone &&
			isSameExclusions(repeatRule.excludedDates, repeatRule2.excludedDates))
	)
}

/**
 * compare two lists of dateWrappers
 * @param dates sorted list of dateWrappers from earliest to latest
 * @param dates2 sorted list of dateWrappers from earliest to latest
 */
function isSameExclusions(dates: ReadonlyArray<DateWrapper>, dates2: ReadonlyArray<DateWrapper>): boolean {
	if (dates.length !== dates2.length) return false
	for (let i = 0; i < dates.length; i++) {
		const { date: a } = dates[i]
		const { date: b } = dates2[i]
		if (a.getTime() !== b.getTime()) return false
	}
	return true
}
