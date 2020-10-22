//@flow
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {
	assignEventId,
	filterInt,
	findPrivateCalendar,
	getAllDayDateForTimezone,
	getAllDayDateUTCFromZone,
	getDiffInDays,
	getEventEnd,
	getEventStart,
	getStartOfDayWithZone,
	getTimeZone,
	isLongEvent,
	isSameEvent
} from "./CalendarUtils"
import {isToday} from "../api/common/utils/DateUtils"
import {getFromMap} from "../api/common/utils/MapUtils"
import type {DeferredObject} from "../api/common/utils/Utils"
import {assertNotNull, clone, defer, downcast, noOp} from "../api/common/utils/Utils"
import type {AlarmIntervalEnum, EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, CalendarMethod, EndType, FeatureType, GroupType, OperationType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {DateTime, FixedOffsetZone, IANAZone} from "luxon"
import {isAllDayEvent, isAllDayEventByTimes} from "../api/common/utils/CommonCalendarUtils"
import {Notifications} from "../gui/Notifications"
import type {EntityUpdateData} from "../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../api/main/EventController"
import {WorkerClient} from "../api/main/WorkerClient"
import {locator} from "../api/main/MainLocator"
import {_eraseEntity, _loadEntity, elementIdPart, getElementId, HttpMethod, isSameId, listIdPart} from "../api/common/EntityFunctions"
import {erase, load, loadAll, loadMultipleList, serviceRequestVoid} from "../api/main/Entity"
import type {UserAlarmInfo} from "../api/entities/sys/UserAlarmInfo"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {formatDateWithWeekdayAndTime, formatTime} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {isApp} from "../api/Env"
import type {LoginController} from "../api/main/LoginController"
import {logins} from "../api/main/LoginController"
import {LockedError, NotAuthorizedError, NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {client} from "../misc/ClientDetector"
import {insertIntoSortedArray} from "../api/common/utils/ArrayUtils"
import m from "mithril"
import type {User} from "../api/entities/sys/User"
import {UserTypeRef} from "../api/entities/sys/User"
import type {CalendarGroupRoot} from "../api/entities/tutanota/CalendarGroupRoot"
import {CalendarGroupRootTypeRef} from "../api/entities/tutanota/CalendarGroupRoot"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import type {CalendarInfo} from "./CalendarView"
import {FileTypeRef} from "../api/entities/tutanota/File"
import type {ParsedCalendarData} from "./CalendarImporter"
import {parseCalendarFile} from "./CalendarImporter"
import type {CalendarEventUpdate} from "../api/entities/tutanota/CalendarEventUpdate"
import {CalendarEventUpdateTypeRef} from "../api/entities/tutanota/CalendarEventUpdate"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {createMembershipRemoveData} from "../api/entities/sys/MembershipRemoveData"
import {SysService} from "../api/entities/sys/Services"
import {GroupTypeRef} from "../api/entities/sys/Group"
import type {AlarmInfo} from "../api/entities/sys/AlarmInfo"
import type {CalendarRepeatRule} from "../api/entities/tutanota/CalendarRepeatRule"
import {ParserError} from "../misc/parsing"


function eventComparator(l: CalendarEvent, r: CalendarEvent): number {
	return l.startTime.getTime() - r.startTime.getTime()
}

export function addDaysForEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                zone: string = getTimeZone()) {
	const eventStart = getEventStart(event, zone)
	let calculationDate = getStartOfDayWithZone(eventStart, zone)
	const eventEndDate = getEventEnd(event, zone);

	// only add events when the start time is inside this month
	if (eventStart.getTime() < month.start.getTime() || eventStart.getTime() >= month.end.getTime()) {
		return
	}

	// if start time is in current month then also add events for subsequent months until event ends
	while (calculationDate.getTime() < eventEndDate.getTime()) {
		if (eventEndDate.getTime() >= month.start.getTime()) {
			insertIntoSortedArray(event, getFromMap(events, calculationDate.getTime(), () => []), eventComparator, isSameEvent)
		}
		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
	}
}

export function addDaysForRecurringEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                         timeZone: string) {
	const repeatRule = event.repeatRule
	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}
	const frequency: RepeatPeriodEnum = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	const isLong = isLongEvent(event, timeZone)
	let eventStartTime = new Date(getEventStart(event, timeZone))
	let eventEndTime = new Date(getEventEnd(event, timeZone))
	// Loop by the frequency step
	let repeatEndTime = null
	let endOccurrences = null
	const allDay = isAllDayEvent(event)
	// For all-day events we should rely on the local time zone or at least we must use the same zone as in getAllDayDateUTCFromZone
	// below. If they are not in sync, then daylight saving shifts may cause us to extract wrong UTC date (day in repeat rule zone and in
	// local zone may be different).
	const repeatTimeZone = allDay ? timeZone : getValidTimeZone(repeatRule.timeZone)
	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		// See CalendarEventDialog for an explanation why it's needed
		if (allDay) {
			repeatEndTime = getAllDayDateForTimezone(new Date(Number(repeatRule.endValue)), timeZone)
		} else {
			repeatEndTime = new Date(Number(repeatRule.endValue))
		}
	}
	let calcStartTime = eventStartTime
	const calcDuration = allDay ? getDiffInDays(eventEndTime, eventStartTime) : eventEndTime - eventStartTime
	let calcEndTime = eventEndTime
	let iteration = 1
	while ((endOccurrences == null || iteration <= endOccurrences)
	&& (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime)
	&& calcStartTime.getTime() < month.end.getTime()) {
		if (calcEndTime.getTime() >= month.start.getTime()) {
			const eventClone = clone(event)
			if (allDay) {
				eventClone.startTime = getAllDayDateUTCFromZone(calcStartTime, timeZone)
				eventClone.endTime = getAllDayDateUTCFromZone(calcEndTime, timeZone)
			} else {
				eventClone.startTime = new Date(calcStartTime)
				eventClone.endTime = new Date(calcEndTime)
			}
			if (isLong) {
				addDaysForLongEvent(events, eventClone, month, timeZone)
			} else {
				addDaysForEvent(events, eventClone, month, timeZone)
			}
		}
		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatTimeZone)
		calcEndTime = allDay
			? incrementByRepeatPeriod(calcStartTime, RepeatPeriod.DAILY, calcDuration, repeatTimeZone)
			: DateTime.fromJSDate(calcStartTime).plus(calcDuration).toJSDate()
		iteration++
	}
}

export function addDaysForLongEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                    zone: string = getTimeZone()) {
	// for long running events we create events for the month only

	// first start of event is inside month
	const eventStart = getEventStart(event, zone).getTime()
	const eventEnd = getEventEnd(event, zone).getTime()

	let calculationDate
	let eventEndInMonth

	if (eventStart >= month.start.getTime() && eventStart < month.end.getTime()) { // first: start of event is inside month
		calculationDate = getStartOfDayWithZone(new Date(eventStart), zone)
	} else if (eventStart < month.start.getTime()) { // start is before month
		calculationDate = new Date(month.start)
	} else {
		return // start date is after month end
	}

	if (eventEnd > month.start.getTime() && eventEnd <= month.end.getTime()) { //end is inside month
		eventEndInMonth = new Date(eventEnd)
	} else if (eventEnd > month.end.getTime()) { // end is after month end
		eventEndInMonth = new Date(month.end)
	} else {
		return // end is before start of month
	}

	let iterations = 0
	while (calculationDate.getTime() < eventEndInMonth) {
		insertIntoSortedArray(event, getFromMap(events, calculationDate.getTime(), () => []), eventComparator, isSameEvent)
		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
		if (iterations++ > 10000) {
			throw new Error("Run into the infinite loop, addDaysForLongEvent")
		}
	}
}


export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriodEnum, interval: number, ianaTimeZone: string): Date {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({days: interval}).toJSDate()
		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({weeks: interval}).toJSDate()
		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({months: interval}).toJSDate()
		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({years: interval}).toJSDate()
		default:
			throw new Error("Unknown repeat period")
	}
}

const OCCURRENCES_SCHEDULED_AHEAD = 10

export function iterateEventOccurrences(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	frequency: RepeatPeriodEnum,
	interval: number,
	endType: EndTypeEnum,
	endValue: number,
	alarmTrigger: AlarmIntervalEnum,
	localTimeZone: string,
	callback: (time: Date, occurrence: number) => mixed) {


	let occurrences = 0
	let futureOccurrences = 0

	const isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
	const calcEventStart = isAllDayEvent ? getAllDayDateForTimezone(eventStart, localTimeZone) : eventStart
	const endDate = endType === EndType.UntilDate
		? isAllDayEvent
			? getAllDayDateForTimezone(new Date(endValue), localTimeZone)
			: new Date(endValue)
		: null

	while (futureOccurrences < OCCURRENCES_SCHEDULED_AHEAD && (endType !== EndType.Count || occurrences < endValue)) {
		const occurrenceDate = incrementByRepeatPeriod(calcEventStart, frequency, interval
			* occurrences, isAllDayEvent ? localTimeZone : timeZone);

		if (endDate && occurrenceDate.getTime() >= endDate.getTime()) {
			break;
		}

		const alarmTime = calculateAlarmTime(occurrenceDate, alarmTrigger, localTimeZone);

		if (alarmTime >= now) {
			callback(alarmTime, occurrences);
			futureOccurrences++;
		}
		occurrences++;
	}
}

export function calculateAlarmTime(date: Date, interval: AlarmIntervalEnum, ianaTimeZone?: string): Date {
	let diff
	switch (interval) {
		case AlarmInterval.FIVE_MINUTES:
			diff = {minutes: 5}
			break
		case AlarmInterval.TEN_MINUTES:
			diff = {minutes: 10}
			break
		case AlarmInterval.THIRTY_MINUTES:
			diff = {minutes: 30}
			break
		case AlarmInterval.ONE_HOUR:
			diff = {hours: 1}
			break
		case AlarmInterval.ONE_DAY:
			diff = {days: 1}
			break
		case AlarmInterval.TWO_DAYS:
			diff = {days: 2}
			break
		case AlarmInterval.THREE_DAYS:
			diff = {days: 3}
			break
		case AlarmInterval.ONE_WEEK:
			diff = {weeks: 1}
			break
		default:
			diff = {minutes: 5}
	}
	return DateTime.fromJSDate(date, {zone: ianaTimeZone}).minus(diff).toJSDate()
}

function getValidTimeZone(zone: string, fallback: ?string): string {
	if (IANAZone.isValidZone(zone)) {
		return zone
	} else {
		if (fallback && IANAZone.isValidZone(fallback)) {
			console.warn(`Time zone ${zone} is not valid, falling back to ${fallback}`)
			return fallback
		} else {
			const actualFallback = FixedOffsetZone.instance(new Date().getTimezoneOffset()).name
			console.warn(`Fallback time zone ${zone} is not valid, falling back to ${actualFallback}`)
			return actualFallback
		}
	}
}

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
	loadCalendarInfos(): Promise<Map<Id, CalendarInfo>>;

	loadOrCreateCalendarInfo(): Promise<Map<Id, CalendarInfo>>;

	/**
	 * Update {@param dbEvent} stored on the server with {@param event} from the ics file.
	 */
	updateEventWithExternal(dbEvent: CalendarEvent, event: CalendarEvent): Promise<CalendarEvent>;
}

export class CalendarModelImpl implements CalendarModel {
	_notifications: Notifications;
	_worker: WorkerClient;
	_scheduledNotifications: Map<string, TimeoutID>;
	/** Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event */
	_pendingAlarmRequests: Map<string, DeferredObject<void>>;
	_logins: LoginController

	constructor(notifications: Notifications, eventController: EventController, worker: WorkerClient, logins: LoginController) {
		this._logins = logins
		this._notifications = notifications
		this._worker = worker
		this._scheduledNotifications = new Map()
		this._pendingAlarmRequests = new Map()
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

	loadCalendarInfos(): Promise<Map<Id, CalendarInfo>> {
		const userId = this._logins.getUserController().user._id
		return load(UserTypeRef, userId)
			.then(user => {
				const calendarMemberships = user.memberships.filter(m => m.groupType === GroupType.Calendar);
				const notFoundMemberships = []
				return Promise
					.map(calendarMemberships, (membership) => Promise
						.all([
							load(CalendarGroupRootTypeRef, membership.group),
							load(GroupInfoTypeRef, membership.groupInfo),
							load(GroupTypeRef, membership.group)
						])
						.catch(NotFoundError, () => {
							notFoundMemberships.push(membership)
							return null
						})
					)
					.then((groupInstances) => {
						const calendarInfos: Map<Id, CalendarInfo> = new Map()
						groupInstances.filter(Boolean)
						              .forEach(([groupRoot, groupInfo, group]) => {
							              calendarInfos.set(groupRoot._id, {
								              groupRoot,
								              groupInfo,
								              shortEvents: [],
								              longEvents: new LazyLoaded(() => loadAll(CalendarEventTypeRef, groupRoot.longEvents), []),
								              group: group,
								              shared: !isSameId(group.user, userId)
							              })
						              })

						// cleanup inconsistent memberships
						Promise.each(notFoundMemberships, (notFoundMembership) => {
							const data = createMembershipRemoveData({user: userId, group: notFoundMembership.group})
							return serviceRequestVoid(SysService.MembershipService, HttpMethod.DELETE, data)
						})
						return calendarInfos
					})
			})
	}

	loadOrCreateCalendarInfo(): Promise<Map<Id, CalendarInfo>> {
		return this.loadCalendarInfos()
		           .then((calendarInfo) => (!this._logins.isInternalUserLoggedIn() || findPrivateCalendar(calendarInfo))
			           ? calendarInfo
			           : this._worker.addCalendar("").then(() => this.loadCalendarInfos()))
	}

	_doCreate(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot, alarmInfos: Array<AlarmInfo>,
	          existingEvent: ?CalendarEvent
	): Promise<void> {
		// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
		// one.
		assignEventId(event, zone, groupRoot)
		// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
		event._ownerEncSessionKey = null
		// Reset permissions because server will assign them
		downcast(event)._permissions = null
		event._ownerGroup = groupRoot._id

		return this._worker.createCalendarEvent(event, alarmInfos, existingEvent)
	}

	deleteEvent(event: CalendarEvent): Promise<void> {
		return erase(event)
	}

	_loadAndProcessCalendarUpdates(): Promise<void> {
		return locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			const {calendarEventUpdates} = mailboxDetails.mailboxGroupRoot
			if (calendarEventUpdates == null) return
			loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list)
				.then((invites) => {
					return Promise.each(invites, (invite) => {
						return this._handleCalendarEventUpdate(invite)
					})
				})
		})
	}

	_handleCalendarEventUpdate(update: CalendarEventUpdate): Promise<void> {
		return load(FileTypeRef, update.file)
			.then((file) => this._worker.downloadFileContent(file))
			.then((dataFile: DataFile) => parseCalendarFile(dataFile))
			.then((parsedCalendarData) => this.processCalendarUpdate(update.sender, parsedCalendarData))
			.catch((e) => e instanceof ParserError || e instanceof NotFoundError,
				(e) => console.warn("Error while parsing calendar update", e))
			.then(() => erase(update))
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
					           this.scheduleUserAlarmInfo(event, userAlarmInfo)
				           })
			           })
		} else {
			return Promise.resolve()
		}
	}

	scheduleUserAlarmInfo(event: CalendarEvent, userAlarmInfo: UserAlarmInfo) {
		const repeatRule = event.repeatRule
		const localZone = getTimeZone()
		if (repeatRule) {
			let repeatTimeZone = getValidTimeZone(repeatRule.timeZone, localZone)

			let calculationLocalZone = getValidTimeZone(localZone, null)
			iterateEventOccurrences(new Date(),
				repeatTimeZone,
				event.startTime,
				event.endTime,
				downcast(repeatRule.frequency),
				Number(repeatRule.interval),
				downcast(repeatRule.endType) || EndType.Never,
				Number(repeatRule.endValue),
				downcast(userAlarmInfo.alarmInfo.trigger),
				calculationLocalZone,
				(time, occurrence) => {
					this._scheduleNotification(getElementId(userAlarmInfo) + occurrence, event, time)
				})
		} else {
			if (getEventStart(event, localZone).getTime() > Date.now()) {
				this._scheduleNotification(getElementId(userAlarmInfo), event, calculateAlarmTime(event.startTime, downcast(userAlarmInfo.alarmInfo.trigger)))
			}
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
		return loadMultipleList(UserAlarmInfoTypeRef, listIdPart(ids[0]), ids.map(elementIdPart), this._worker)
	}

	_scheduleNotification(identifier: string, event: CalendarEvent, time: Date) {
		this._runAtDate(time, identifier, () => {
			const title = lang.get("reminder_label")
			const eventStart = getEventStart(event, getTimeZone())
			let dateString: string
			if (isToday(eventStart)) {
				dateString = formatTime(eventStart)
			} else {
				dateString = formatDateWithWeekdayAndTime(eventStart)
			}
			const body = `${dateString} ${event.summary}`
			return this._notifications.showNotification(title, {body}, () => {
				m.route.set("/calendar/agenda")
			})
		})
	}

	_runAtDate(date: Date, identifier: string, func: () => mixed) {
		const now = Date.now()
		const then = date.getTime()
		const diff = Math.max((then - now), 0)
		const timeoutId = diff > 0x7FFFFFFF // setTimeout limit is MAX_INT32=(2^31-1)
			? setTimeout(() => this._runAtDate(date, identifier, func), 0x7FFFFFFF)
			: setTimeout(func, diff)
		this._scheduledNotifications.set(identifier, timeoutId)
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
					return load(UserAlarmInfoTypeRef, userAlarmInfoId).then((userAlarmInfo) => {
						const {listId, elementId} = userAlarmInfo.alarmInfo.calendarRef
						const deferredEvent = getFromMap(this._pendingAlarmRequests, elementId, defer)
						// Don't wait for the deferred event promise because it can lead to a deadlock.
						// Since issue #2264 we process event batches sequentially and the
						// deferred event can never be resolved until the calendar event update is received.
						deferredEvent.promise.then(() => {
							return load(CalendarEventTypeRef, [listId, elementId])
								.then(calendarEvent => {
									this.scheduleUserAlarmInfo(calendarEvent, userAlarmInfo)
								})
								.catch(NotFoundError, () => {
									console.log("event not found", [listId, elementId])
								})
						})
						return Promise.resolve()
					}).catch(NotFoundError, (e) => console.log(e, "Event or alarm were not found: ", entityEventData, e))
				} else if (entityEventData.operation === OperationType.DELETE) {
					this._scheduledNotifications.forEach((value, key) => {
						if (key.startsWith(entityEventData.instanceId)) {
							this._scheduledNotifications.delete(key)
							clearTimeout(value)
						}
					})
					return Promise.resolve()
				}
			} else if (isUpdateForTypeRef(CalendarEventTypeRef, entityEventData)
				&& (entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE)) {
				return getFromMap(this._pendingAlarmRequests, entityEventData.instanceId, defer).resolve()
			} else if (isUpdateForTypeRef(CalendarEventUpdateTypeRef, entityEventData)
				&& entityEventData.operation === OperationType.CREATE) {
				return load(CalendarEventUpdateTypeRef, [entityEventData.instanceListId, entityEventData.instanceId])
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


// if (replaced) {
// 	Object.assign(calendarModel, replaced.calendarModel)
// }

