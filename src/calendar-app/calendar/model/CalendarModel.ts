import {
	$Promisable,
	assertNotNull,
	clone,
	deepEqual,
	defer,
	DeferredObject,
	delay,
	downcast,
	filterInt,
	getFromMap,
	isNotEmpty,
	isSameDay,
	LazyLoaded,
	Require,
	splitInChunks,
	symmetricDifference,
} from "@tutao/tutanota-utils"
import {
	BIRTHDAY_CALENDAR_BASE_ID,
	CalendarMethod,
	DEFAULT_BIRTHDAY_CALENDAR_COLOR,
	defaultCalendarColor,
	EXTERNAL_CALENDAR_SYNC_INTERVAL,
	FeatureType,
	OperationType,
} from "../../../common/api/common/TutanotaConstants"
import { EventController } from "../../../common/api/main/EventController"
import {
	createDateWrapper,
	createMembershipRemoveData,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMembership,
	GroupTypeRef,
	User,
	UserAlarmInfo,
	UserAlarmInfoTypeRef,
} from "../../../common/api/entities/sys/TypeRefs.js"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarEventUpdate,
	CalendarEventUpdateTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	createDefaultAlarmInfo,
	createGroupSettings,
	FileTypeRef,
	GroupSettings,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import type { LoginController } from "../../../common/api/main/LoginController"
import { LockedError, NotAuthorizedError, NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError"
import type { ParsedCalendarData, ParsedEvent } from "../../../common/calendar/gui/CalendarImporter.js"
import { ParserError } from "../../../common/misc/parsing/ParserCombinator"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker"
import type { IProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor"
import { NoopProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor"
import { EntityClient } from "../../../common/api/common/EntityClient"
import type { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import {
	DELETE_MULTIPLE_LIMIT,
	elementIdPart,
	getElementId,
	isSameId,
	listIdPart,
	POST_MULTIPLE_LIMIT,
	removeTechnicalFields,
} from "../../../common/api/common/utils/EntityUtils"
import type { AlarmScheduler } from "../../../common/calendar/date/AlarmScheduler.js"
import { Notifications, NotificationType } from "../../../common/gui/Notifications"
import m from "mithril"
import type { CalendarEventInstance, CalendarEventProgenitor, CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import {
	AlarmInfoTemplate,
	CachingMode,
	CalendarEventAlteredInstance,
	CalendarEventUidIndexEntry,
} from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { IServiceExecutor } from "../../../common/api/common/ServiceRequest"
import { MembershipService } from "../../../common/api/entities/sys/Services"
import { FileController } from "../../../common/file/FileController"
import { findAttendeeInAddresses, isBefore, serializeAlarmInterval } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { SessionKeyNotFoundError } from "../../../common/api/common/error/SessionKeyNotFoundError.js"
import Stream from "mithril/stream"
import { ObservableLazyLoaded } from "../../../common/api/common/utils/ObservableLazyLoaded.js"
import { UserController } from "../../../common/api/main/UserController.js"
import { formatDateWithWeekdayAndTime, formatTime } from "../../../common/misc/Formatter.js"
import { EntityUpdateData, isUpdateFor, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import {
	AlarmInterval,
	assignEventId,
	assignPendingEventId,
	CalendarEventValidity,
	CalendarType,
	checkEventValidity,
	findFirstPrivateCalendar,
	getCalendarType,
	getTimeZone,
	hasSourceUrl,
	isBirthdayCalendar,
} from "../../../common/calendar/date/CalendarUtils.js"
import { getSharedGroupName, isSharedGroupOwner, loadGroupMembers } from "../../../common/sharing/GroupUtils.js"
import { ExternalCalendarFacade } from "../../../common/native/common/generatedipc/ExternalCalendarFacade.js"
import { DeviceConfig } from "../../../common/misc/DeviceConfig.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import {
	eventHasSameFields,
	EventImportRejectionReason,
	EventWrapper,
	normalizeCalendarUrl,
	parseCalendarStringData,
	shallowIsSameEvent,
	sortOutParsedEvents,
	SyncStatus,
} from "../../../common/calendar/gui/ImportExportUtils.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { LanguageViewModel } from "../../../common/misc/LanguageViewModel.js"
import { NativePushServiceApp } from "../../../common/native/main/NativePushServiceApp.js"
import { SyncTracker } from "../../../common/api/main/SyncTracker.js"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient"

const TAG = "[CalendarModel]"
const EXTERNAL_CALENDAR_RETRY_LIMIT = 3
const EXTERNAL_CALENDAR_RETRY_DELAY_MS = 1000

export type CalendarInfoBase = {
	id: string
	name: string
	color: string
	type: CalendarType
}

export type CalendarInfo = CalendarInfoBase & {
	groupRoot: CalendarGroupRoot
	groupInfo: GroupInfo
	group: Group
	hasMultipleMembers: boolean
	userIsOwner: boolean
	isExternal: boolean
}

export function isBirthdayCalendarInfo(calendarInfoBase: CalendarInfoBase): boolean {
	return calendarInfoBase.type === CalendarType.Birthday
}

export function isCalendarInfo(calendarInfoBase: CalendarInfoBase): calendarInfoBase is CalendarInfo {
	return calendarInfoBase.type !== CalendarType.Birthday
}

type ExternalCalendarQueueItem = {
	url: string
	group: string
	name: string | null
}

export function assertEventValidity(event: CalendarEvent) {
	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate:
			throw new UserError("invalidDate_msg")
		case CalendarEventValidity.InvalidEndBeforeStart:
			throw new UserError("startAfterEnd_label")
		case CalendarEventValidity.InvalidPre1970:
			// shouldn't happen while the check in setStartDate is still there, resetting the date each time
			throw new UserError("pre1970Start_msg")
		case CalendarEventValidity.Valid:
		// event is valid, nothing to do
	}
}

export class CalendarModel {
	/**
	 * Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event. We need to do that because
	 * entity updates for CalendarEvent and UserAlarmInfo come in different batches and we need to wait for the event when we want to process new alarm.
	 *
	 * We use the counter to remove the pending request from map when all alarms are processed. We want to do that in case the event gets updated and we need
	 * to wait for the new version of the event.
	 */
	private pendingAlarmRequests: Map<
		string,
		{
			pendingAlarmCounter: number
			deferred: DeferredObject<void>
		}
	> = new Map()
	private readonly userAlarmToAlarmInfo: Map<string, string> = new Map()
	private readonly fileIdToSkippedCalendarEventUpdates: Map<Id, CalendarEventUpdate> = new Map()

	private readProgressMonitor: Generator<IProgressMonitor>

	/**
	 * Map from group id to CalendarInfo
	 */
	private readonly calendarInfos = new ObservableLazyLoaded<ReadonlyMap<Id, CalendarInfo>>(() => {
		const monitor: IProgressMonitor = this.readProgressMonitor.next().value
		const calendarInfoPromise = this.loadOrCreateCalendarInfo(monitor)
		monitor.completed()
		return calendarInfoPromise
	}, new Map())

	private readonly userHasNewPaidPlan: LazyLoaded<boolean> = new LazyLoaded<boolean>(async () => {
		return await this.logins.getUserController().isNewPaidPlan()
	}, false)

	/**
	 * Stores the queued calendars to be synchronized
	 */
	private externalCalendarSyncQueue: ExternalCalendarQueueItem[] = []
	private externalCalendarRetryCount: Map<Id, number> = new Map()

	private birthdayCalendarInfo: CalendarInfoBase

	constructor(
		private readonly notifications: Notifications,
		private readonly alarmScheduler: () => Promise<AlarmScheduler>,
		eventController: EventController,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly logins: LoginController,
		private readonly progressTracker: ProgressTracker,
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
		private readonly calendarFacade: CalendarFacade,
		private readonly fileController: FileController,
		private readonly zone: string,
		private readonly externalCalendarFacade: ExternalCalendarFacade | null,
		private readonly deviceConfig: DeviceConfig,
		private readonly pushService: NativePushServiceApp | null,
		private readonly syncTracker: SyncTracker,
		private readonly requestWidgetRefresh: () => void,
		private readonly lang: LanguageViewModel,
	) {
		this.readProgressMonitor = oneShotProgressMonitorGenerator(progressTracker, logins.getUserController())
		eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId))

		let syncStatus: Stream<void> | undefined = undefined
		syncStatus = syncTracker.isSyncDone.map((isDone) => {
			if (isDone) {
				this.requestWidgetRefresh()
				syncStatus?.end()
			}
		})
		this.birthdayCalendarInfo = this.createBirthdayCalendarInfo()
		if (logins.isInternalUserLoggedIn()) {
			this.userHasNewPaidPlan.getAsync().then(m.redraw)
		}
	}

	private createBirthdayCalendarInfo(): CalendarInfoBase {
		return {
			id: `${this.logins.getUserController().userId}#${BIRTHDAY_CALENDAR_BASE_ID}`,
			name: this.lang.get("birthdayCalendar_label"),
			color: this.logins.getUserController().userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR,
			type: CalendarType.Birthday,
		}
	}

	getBirthdayCalendarInfo(): CalendarInfoBase {
		return this.birthdayCalendarInfo
	}

	getCalendarInfos(): Promise<ReadonlyMap<Id, CalendarInfo>> {
		return this.calendarInfos.getAsync()
	}

	getCalendarInfosStream(): Stream<ReadonlyMap<Id, CalendarInfo>> {
		return this.calendarInfos.stream
	}

	getAvailableCalendars(includesBirthday: boolean = false): ReadonlyArray<CalendarInfoBase> {
		if (this.calendarInfos.isLoaded()) {
			// Load user's calendar list
			const calendarInfos: Array<CalendarInfoBase> = Array.from(this.calendarInfos.getLoaded().values())
			if (this.userHasNewPaidPlan.getSync() && includesBirthday) {
				const birthdayCalendarInfo = this.getBirthdayCalendarInfo()
				calendarInfos.push(birthdayCalendarInfo)
			}
			return calendarInfos
		} else {
			return []
		}
	}

	async getCalendarInfo(calendarId: Id): Promise<CalendarInfoBase | undefined> {
		if (isBirthdayCalendar(calendarId)) {
			return this.birthdayCalendarInfo
		}
		const calendars = await this.getCalendarInfos()
		return calendars.get(calendarId)
	}

	async createEvent(event: CalendarEvent, alarmInfos: ReadonlyArray<AlarmInfoTemplate>, zone: string, groupRoot: CalendarGroupRoot): Promise<void> {
		await this.doCreate(event, zone, groupRoot, alarmInfos)
	}

	/** Update existing event when time did not change */
	async updateEvent(
		newEvent: CalendarEvent,
		newAlarms: ReadonlyArray<AlarmInfoTemplate>,
		zone: string,
		groupRoot: CalendarGroupRoot,
		existingEvent: CalendarEvent,
	): Promise<CalendarEvent> {
		if (existingEvent._id == null) {
			throw new Error("Invalid existing event for update: no id")
		}

		if (existingEvent.uid != null && newEvent.uid !== existingEvent.uid) {
			throw new Error("Invalid existing event for update: mismatched uids.")
		}

		// in cases where start time or calendar changed, we need to change the event id and so need to delete/recreate.
		// it's also possible that the event has to be moved from the long event list to the short event list or vice versa.
		if (
			existingEvent._ownerGroup !== groupRoot._id ||
			newEvent.startTime.getTime() !== existingEvent.startTime.getTime() ||
			(await didLongStateChange(newEvent, existingEvent, zone))
		) {
			const defaultCalendarGroupRootId = this.logins.getUserController().userSettingsGroupRoot.defaultCalendar
			if (groupRoot._id === defaultCalendarGroupRootId && listIdPart(existingEvent._id) === groupRoot.pendingEvents?.list) {
				await this.createPendingEvent(newEvent, groupRoot, newAlarms, existingEvent)
			} else {
				await this.doCreate(newEvent, zone, groupRoot, newAlarms, existingEvent)
			}

			// We should reload the instance here because session key and permissions are updated when we recreate event.
			return await this.entityClient.load<CalendarEvent>(CalendarEventTypeRef, newEvent._id)
		} else {
			newEvent._ownerGroup = groupRoot._id
			// We can't load updated event here because cache is not updated yet. We also shouldn't need to load it, we have the latest
			// version
			await this.calendarFacade.updateCalendarEvent(newEvent, newAlarms, existingEvent)
			this.requestWidgetRefresh()
			return newEvent
		}
	}

	/** Load map from group/groupRoot ID to the calendar info */
	private async loadCalendarInfos(progressMonitor: IProgressMonitor): Promise<ReadonlyMap<Id, CalendarInfo>> {
		const userController = this.logins.getUserController()

		const notFoundMemberships: GroupMembership[] = []
		const groupInstances: Array<[CalendarGroupRoot, GroupInfo, Group]> = []
		for (const membership of userController.getCalendarMemberships()) {
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
			try {
				const calendarInfo = await this.makeCalendarInfo(userController.userId, group, userController.userSettingsGroupRoot, groupRoot, groupInfo)
				calendarInfos.set(groupRoot._id, calendarInfo)
			} catch (e) {
				if (e instanceof NotAuthorizedError) {
					console.log("NotAuthorizedError when initializing calendar. Calendar has been removed ")
				} else {
					throw e
				}
			}
		}

		// cleanup inconsistent memberships
		for (const membership of notFoundMemberships) {
			// noinspection ES6MissingAwait
			this.serviceExecutor
				.delete(
					MembershipService,
					createMembershipRemoveData({
						user: userController.userId,
						group: membership.group,
					}),
				)
				.catch((e) => console.log("error cleaning up membership for group: ", membership.group))
		}
		return calendarInfos
	}

	private async makeCalendarInfo(
		userId: Id,
		group: Group,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		groupRoot: CalendarGroupRoot,
		groupInfo: GroupInfo,
	): Promise<CalendarInfo> {
		const groupMembers = await loadGroupMembers(group, this.entityClient)
		const shared = groupMembers.length > 1
		const userIsOwner = !shared || isSharedGroupOwner(group, userId)
		const groupSettings = userSettingsGroupRoot.groupSettings.find((groupSettings) => groupSettings.group === group._id)
		const isExternal = hasSourceUrl(groupSettings)
		const calendarId = groupRoot._id
		const color = groupSettings?.color ?? defaultCalendarColor
		const sharedGroupName = getSharedGroupName(groupInfo, userSettingsGroupRoot, shared)
		const calendarType = getCalendarType({
			calendarId: calendarId,
			isExternalCalendar: isExternal,
			isUserOwner: userIsOwner,
		})
		return {
			id: groupRoot._id,
			name: sharedGroupName,
			color: color,
			type: calendarType,
			groupRoot,
			groupInfo,
			group: group,
			hasMultipleMembers: shared,
			userIsOwner,
			isExternal,
		}
	}

	public async fetchExternalCalendar(url: string): Promise<string> {
		if (!this.externalCalendarFacade) throw new Error(`externalCalendarFacade is ${typeof this.externalCalendarFacade} at CalendarModel`)
		const normalizedUrl = normalizeCalendarUrl(url)
		const calendarStr = await this.externalCalendarFacade?.fetchExternalCalendar(normalizedUrl)
		return calendarStr ?? ""
	}

	public scheduleExternalCalendarSync() {
		setInterval(() => {
			this.syncExternalCalendars().catch((e) => console.error(e.message))
		}, EXTERNAL_CALENDAR_SYNC_INTERVAL)
	}

	private async collectExternalCalendarsToSync(groupSettings: GroupSettings[] | null = null) {
		const userController = this.logins.getUserController()
		let existingGroupSettings = groupSettings

		if (!existingGroupSettings) {
			const { groupSettings: gSettings } = await locator.entityClient.load(UserSettingsGroupRootTypeRef, userController.user.userGroup.group)
			existingGroupSettings = gSettings
		}

		for (const { sourceUrl, group, name } of existingGroupSettings) {
			if (!sourceUrl) continue

			const calendar: ExternalCalendarQueueItem = { url: sourceUrl, group, name }
			if (this.externalCalendarSyncQueue.some((queueItem) => deepEqual(calendar, queueItem))) continue

			this.externalCalendarSyncQueue.push(calendar)
		}
	}

	public async syncExternalCalendars(
		groupSettings: GroupSettings[] | null = null,
		syncInterval: number = EXTERNAL_CALENDAR_SYNC_INTERVAL,
		longErrorMessage: boolean = false,
		forceSync: boolean = false,
	) {
		if (!this.externalCalendarFacade || !locator.logins.isFullyLoggedIn() || !this.syncTracker.isSyncDone()) {
			return
		}

		await this.collectExternalCalendarsToSync(groupSettings)
		return this.processExternalCalendarQueue(forceSync, syncInterval, longErrorMessage)
	}

	private async processExternalCalendarQueue(forceSync: boolean, syncInterval: number, longErrorMessage: boolean) {
		const skippedCalendars: Map<Id, { calendarName: string; error: Error }> = new Map()

		while (this.externalCalendarSyncQueue.length > 0) {
			const calendar = this.externalCalendarSyncQueue.shift()
			if (!calendar) break

			const retryCount = this.externalCalendarRetryCount.get(calendar.group) ?? 0

			await delay(retryCount * EXTERNAL_CALENDAR_RETRY_DELAY_MS)

			const userController = this.logins.getUserController()
			const groupRootsPromises: Promise<CalendarGroupRoot>[] = []
			let calendarGroupRootsList: CalendarGroupRoot[] = []
			for (const membership of userController.getCalendarMemberships()) {
				groupRootsPromises.push(this.entityClient.load(CalendarGroupRootTypeRef, membership.group))
			}
			calendarGroupRootsList = await Promise.all(groupRootsPromises)

			const lastSyncEntry = this.deviceConfig.getLastExternalCalendarSync().get(calendar.group)
			const offset = 1000 // Add an offset to account for cpu speed when storing or generating timestamps
			const shouldSkipSync =
				!forceSync &&
				lastSyncEntry?.lastSyncStatus === SyncStatus.Success &&
				lastSyncEntry.lastSuccessfulSync &&
				Date.now() + offset - lastSyncEntry.lastSuccessfulSync < syncInterval
			if (shouldSkipSync) continue

			const currentCalendarGroupRoot = calendarGroupRootsList.find((calendarGroupRoot) => isSameId(calendarGroupRoot._id, calendar.group)) ?? null
			if (!currentCalendarGroupRoot) {
				console.error(`Trying to sync a calendar the user isn't subscribed to anymore: ${calendar.group}`)
				continue
			}

			let parsedExternalEvents: ParsedEvent[] = []
			try {
				const externalCalendar = await this.fetchExternalCalendar(calendar.url)
				parsedExternalEvents = parseCalendarStringData(externalCalendar, getTimeZone()).contents
			} catch (error) {
				let calendarName = calendar.name
				if (!calendarName) {
					const calendars = await this.getCalendarInfos()
					calendarName = calendars.get(calendar.group)?.groupInfo.name!
				}
				skippedCalendars.set(calendar.group, { calendarName, error })
				continue
			}

			const existingEventList = await loadAllEvents(currentCalendarGroupRoot)

			/**
			 * Sync strategy
			 * - Deduplicate events with same UID
			 * - Remove duplicated and not imported events
			 * - Update existing events
			 * - Add new
			 */
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(parsedExternalEvents, existingEventList, currentCalendarGroupRoot, getTimeZone())
			const duplicates = rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? []
			const eventsToUpdate = duplicates.filter((event) => {
				const existingEvent = existingEventList.find((existing) => shallowIsSameEvent(event, existing))

				if (!existingEvent) {
					console.warn("Found a duplicate without an existing event!")
					return false
				}

				return !eventHasSameFields(event, existingEvent)
			})

			const eventsToRemove = existingEventList.filter(
				(existingEvent) => !parsedExternalEvents.some((externalEvent) => shallowIsSameEvent(externalEvent.event, existingEvent)),
			)
			eventsToRemove.push(...this.findDuplicatedEvents(existingEventList))

			const creationRequests = Math.ceil(eventsForCreation.length / POST_MULTIPLE_LIMIT)
			const totalRequests = creationRequests + eventsToRemove.length + eventsToUpdate.length

			try {
				await this.processExternalCalendarOperations(
					eventsToRemove,
					eventsToUpdate,
					existingEventList,
					duplicates.length,
					eventsForCreation,
					currentCalendarGroupRoot,
					totalRequests > 50,
				)

				this.deviceConfig.updateLastSync(calendar.group)
			} catch (err) {
				this.externalCalendarRetryCount.set(calendar.group, retryCount + 1)

				if (retryCount >= EXTERNAL_CALENDAR_RETRY_LIMIT) {
					if (!(err instanceof NotFoundError)) {
						throw err
					}
				} else {
					this.externalCalendarSyncQueue.push(calendar)
				}
			}
		}

		if (skippedCalendars.size) {
			let errorMessage = this.lang.get("iCalSync_error") + (longErrorMessage ? "\n\n" : "")
			for (const [group, details] of skippedCalendars.entries()) {
				if (longErrorMessage) errorMessage += `${details.calendarName} - ${details.error.message}\n`
				this.deviceConfig.updateLastSync(group, SyncStatus.Failed)
			}
			throw new Error(errorMessage)
		}
	}

	private findDuplicatedEvents(events: CalendarEvent[]): CalendarEvent[] {
		const duplicatedEvents: CalendarEvent[] = []

		// The last item don't have anything to be compared with, so length - 2
		for (let index = 0; index < events.length - 2; index++) {
			const event = events[index]
			const isDuplicate = events.slice(index + 1).some((it) => shallowIsSameEvent(event, it))
			if (isDuplicate) {
				duplicatedEvents.push(event)
			}
		}

		console.log(`[CalendarModel] Found ${duplicatedEvents.length} events duplicated`)
		return duplicatedEvents
	}

	private async processExternalCalendarOperations(
		eventsToRemove: CalendarEvent[],
		eventsToUpdate: CalendarEvent[],
		existingEventList: Array<CalendarEvent>,
		duplicatesCount: number,
		eventsForCreation: Array<EventWrapper>,
		currentCalendarGroupRoot: CalendarGroupRoot,
		wipeCalendar: boolean,
	) {
		const operationsLog: {
			skipped: number
			updated: number
			created: number
			deleted: number
		} = {
			skipped: 0,
			updated: 0,
			created: 0,
			deleted: 0,
		}

		if (wipeCalendar && eventsToRemove.length > 0) {
			const listId = listIdPart(eventsToRemove[0]._id)
			await this.wipeCalendar(listId, eventsToRemove)

			operationsLog.deleted += eventsToRemove.length
		} else {
			// Remove events that are not going to be updated
			for (const event of eventsToRemove) {
				await this.deleteEvent(event).catch((err) => {
					if (err instanceof NotFoundError) {
						console.log(`Already deleted event, removing from cache`, event._id)
						return this.calendarFacade.removeEventFromCache(listIdPart(event._id), elementIdPart(event._id))
					}

					throw err
				})
				operationsLog.deleted++
			}
		}
		console.log(TAG, `${operationsLog.deleted} events removed`)

		// Replacing duplicates with changes
		for (const duplicatedEvent of eventsToUpdate) {
			const existingEvent = existingEventList.find((event) => shallowIsSameEvent(event, duplicatedEvent))
			if (!existingEvent) {
				console.warn("Found a duplicate without an existing event after filtering!")
				continue
			}

			if (eventHasSameFields(duplicatedEvent, existingEvent)) {
				continue
			}
			await this.updateEventWithExternal(existingEvent, duplicatedEvent)
			operationsLog.updated++
		}
		operationsLog.skipped = duplicatesCount - operationsLog.updated
		console.log(TAG, `${operationsLog.skipped} events skipped (same UID without changes)`)
		console.log(TAG, `${operationsLog.updated} events updated (same UID with changes)`)

		// Add new event
		for (const { event } of eventsForCreation) {
			assignEventId(event, getTimeZone(), currentCalendarGroupRoot)
			// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
			event._ownerEncSessionKey = null

			if (event.repeatRule != null) {
				event.repeatRule.excludedDates = event.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }))
			}
			// Reset permissions because server will assign them
			downcast(event)._permissions = null
			event._ownerGroup = currentCalendarGroupRoot._id
			assertEventValidity(event)
			operationsLog.created++
		}
		if (isNotEmpty(eventsForCreation)) {
			await this.calendarFacade.saveImportedCalendarEvents(eventsForCreation, 0)
		}
		console.log(TAG, `${operationsLog.created} events created`)
	}

	private async loadOrCreateCalendarInfo(progressMonitor: IProgressMonitor): Promise<ReadonlyMap<Id, CalendarInfo>> {
		const { findFirstPrivateCalendar } = await import("../../../common/calendar/date/CalendarUtils.js")
		const calendarInfos = await this.loadCalendarInfos(progressMonitor)

		if (!this.logins.isInternalUserLoggedIn() || findFirstPrivateCalendar(calendarInfos)) {
			return calendarInfos
		} else {
			const group = await this.createCalendar("", null, [], null)
			await this.calendarFacade.setCalendarAsDefault(group._id, this.logins.getUserController().userSettingsGroupRoot)
			return await this.loadCalendarInfos(progressMonitor)
		}
	}

	async createCalendar(name: string, color: string | null, alarms: AlarmInterval[], sourceUrl: string | null): Promise<Group> {
		// when a calendar group is added, a group membership is added to the user. we might miss this websocket event
		// during startup if the websocket is not connected fast enough. Therefore, we explicitly update the user
		// this should be removed once we handle missed events during startup
		const { user, group } = await this.calendarFacade.addCalendar(name)
		this.logins.getUserController().user = user

		const serializedAlarms = alarms.map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) }))
		if (color != null) {
			const { userSettingsGroupRoot } = this.logins.getUserController()
			const newGroupSettings = createGroupSettings({
				group: group._id,
				color: color,
				name: null,
				defaultAlarmsList: serializedAlarms,
				sourceUrl,
			})

			userSettingsGroupRoot.groupSettings.push(newGroupSettings)
			await this.entityClient.update(userSettingsGroupRoot)
		}

		return group
	}

	private async doCreate(
		event: CalendarEvent,
		zone: string,
		groupRoot: CalendarGroupRoot,
		alarmInfos: ReadonlyArray<AlarmInfoTemplate>,
		existingEvent?: CalendarEvent,
	): Promise<void> {
		// If the event was copied it might still carry some fields for re-encryption. We can't reuse them.
		removeTechnicalFields(event)
		const { assignEventId } = await import("../../../common/calendar/date/CalendarUtils")
		// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
		// one.
		assignEventId(event, zone, groupRoot)
		// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
		event._ownerEncSessionKey = null
		if (event.repeatRule != null) {
			event.repeatRule.excludedDates = event.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }))
		}
		// Reset permissions because server will assign them
		downcast(event)._permissions = null
		event._ownerGroup = groupRoot._id
		return await this.calendarFacade.saveCalendarEvent(event, alarmInfos, existingEvent ?? null).then(this.requestWidgetRefresh)
	}

	private async createPendingEvent(
		event: CalendarEvent,
		groupRoot: CalendarGroupRoot,
		alarmInfos: ReadonlyArray<AlarmInfoTemplate>,
		existingEvent: CalendarEvent | null = null,
	): Promise<void> {
		// If the event was copied it might still carry some fields for re-encryption. We can't reuse them.
		removeTechnicalFields(event)

		const { assignPendingEventId } = await import("../../../common/calendar/date/CalendarUtils")
		// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
		// one.
		assignPendingEventId(event, groupRoot)

		// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
		event._ownerEncSessionKey = null
		if (event.repeatRule != null) {
			event.repeatRule.excludedDates = event.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }))
		}

		// Reset permissions because server will assign them
		downcast(event)._permissions = null
		event._ownerGroup = groupRoot._id

		return await this.calendarFacade.saveCalendarEvent(event, alarmInfos, existingEvent)
	}

	async deleteEvent(event: CalendarEvent): Promise<void> {
		return await this.entityClient.erase(event).then(this.requestWidgetRefresh)
	}

	async wipeCalendar(listId: Id, events: CalendarEvent[]): Promise<void> {
		const chunks = splitInChunks(DELETE_MULTIPLE_LIMIT, events)
		let chunksCompleted = 0

		try {
			for (const chunk of chunks) {
				await this.entityClient.eraseMultiple(listId, chunk)
				chunksCompleted++
			}
		} catch (e) {
			console.error("Chunks: ", { chunksCompleted, total: chunks.length }, e.message)
			throw e
		}

		return this.requestWidgetRefresh()
	}

	/**
	 * get the "primary" event of a series - the one that contains the repeat rule and is not a repeated or a rescheduled instance.
	 *
	 * note about recurrenceId in event series https://stackoverflow.com/questions/11456406/recurrence-id-in-icalendar-rfc-5545
	 */
	async resolveCalendarEventProgenitor({ uid }: Pick<CalendarEvent, "uid">): Promise<CalendarEvent | null> {
		return (await this.getEventsByUid(assertNotNull(uid, "could not resolve progenitor: no uid")))?.progenitor ?? null
	}

	/**
	 * Handles updates to event invitations
	 * @private
	 */
	private async loadAndProcessCalendarEventInvitesUpdates(): Promise<void> {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		const { calendarEventUpdates } = mailboxGroupRoot
		if (calendarEventUpdates == null) return

		console.log("CalendarModel - loadAndProcessCalendarEventInvitesUpdates")
		const invites = await this.entityClient.loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list)
		for (const invite of invites) {
			await this.handleCalendarEventUpdate(invite)
		}
	}

	/**
	 * Get calendar infos, creating a new calendar info if none exist
	 * Not async because we want to return the result directly if it is available when called
	 * otherwise we return a promise
	 */
	getCalendarInfosCreateIfNeeded(): $Promisable<ReadonlyMap<Id, CalendarInfo>> {
		if (this.calendarInfos.isLoaded() && this.calendarInfos.getLoaded().size > 0) {
			return this.calendarInfos.getLoaded()
		}

		return Promise.resolve().then(async () => {
			const calendars = await this.calendarInfos.getAsync()

			if (calendars.size > 0) {
				return calendars
			} else {
				await this.createCalendar("", null, [], null)
				return this.calendarInfos.reload()
			}
		})
	}

	private async getCalendarDataForUpdate(fileId: IdTuple): Promise<ParsedCalendarData | null> {
		try {
			// We are not supposed to load files without the key provider, but we hope that the key
			// was already resolved and the entity updated.
			const file = await this.entityClient.load(FileTypeRef, fileId, { cacheMode: CacheMode.WriteOnly })
			// const file = await this.entityClient.load(FileTypeRef, fileId)
			const dataFile = await this.fileController.getAsDataFile(file)
			const { parseCalendarFile } = await import("../../../common/calendar/gui/CalendarImporter.js")
			return await parseCalendarFile(dataFile)
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) {
				// owner enc session key not updated yet - see NoOwnerEncSessionKeyForCalendarEventError's comment
				throw new NoOwnerEncSessionKeyForCalendarEventError("no owner enc session key found on the calendar data's file")
			}
			if (e instanceof ParserError || e instanceof NotFoundError) {
				console.warn(TAG, "could not get calendar update data", e)
				return null
			}
			throw e
		}
	}

	private async handleCalendarEventUpdate(update: CalendarEventUpdate): Promise<void> {
		// we want to delete the CalendarEventUpdate after we are done, even, in some cases, if something went wrong.
		try {
			const parsedCalendarData = await this.getCalendarDataForUpdate(update.file)
			if (parsedCalendarData != null) {
				await this.processCalendarData(update.sender, parsedCalendarData)
			}
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				// we might be authorized in the near future if some permission is delayed, unlikely to be permanent.
				console.warn(TAG, "could not process calendar update: not authorized", e)
				return
			} else if (e instanceof PreconditionFailedError) {
				// unclear where precon would be thrown, probably in the blob store?
				console.warn(TAG, "could not process calendar update: precondition failed", e)
				return
			} else if (e instanceof LockedError) {
				// we can try again after the lock is released
				console.warn(TAG, "could not process calendar update: locked", e)
				return
			} else if (e instanceof NotFoundError) {
				// either the updated event(s) or the file data could not be found,
				// so we should try to delete since the update itself is obsolete.
				console.warn(TAG, "could not process calendar update: not found", e)
			} else if (e instanceof NoOwnerEncSessionKeyForCalendarEventError) {
				// we will get an update with the mail and sk soon, then we'll be able to finish this.
				// we will re-enter this function and erase it then.
				this.fileIdToSkippedCalendarEventUpdates.set(elementIdPart(update.file), update)
				console.warn(TAG, `could not process calendar update: ${e.message}`, e)
				return
			} else {
				// unknown error that may lead to permanently stuck update if not cleared
				// this includes CryptoErrors due to #5753 that we want to still monitor
				// but now they only occur once
				console.warn(TAG, "could not process calendar update:", e)
				await this.eraseUpdate(update)
				throw e
			}
		}

		await this.eraseUpdate(update)
	}

	/**
	 * try to delete a calendar update from the server, ignoring errors
	 * @param update the update to erase
	 * @private
	 */
	private async eraseUpdate(update: CalendarEventUpdate): Promise<void> {
		try {
			await this.entityClient.erase(update)
		} catch (e) {
			console.log(TAG, "failed to delete update:", e.name)
		}
	}

	/** whether the operation could be performed or not */
	async deleteEventsByUid(uid: string): Promise<void> {
		const entry = await this.calendarFacade.getEventsByUid(uid)
		if (entry == null) {
			console.log("could not find an uid index entry to delete event")
			return
		}
		// not doing this in parallel because we would get locked errors
		for (const e of entry.alteredInstances) {
			await this.deleteEvent(e)
		}
		if (entry.progenitor) {
			await this.deleteEvent(entry.progenitor)
		}
	}

	/** Delete altered instances that starts after a given date */
	async deleteInstancesAfterDate(uid: string, date: Date): Promise<void> {
		const entry = await this.calendarFacade.getEventsByUid(uid)
		if (entry == null) {
			console.log("could not find an uid index entry to delete event")
			return
		}

		for (const ai of entry.alteredInstances) {
			if (isBefore(ai.startTime, date, "date")) {
				continue
			}
			await this.deleteEvent(ai)
		}
	}

	/** process a calendar update retrieved from the server automatically. will not apply updates to event series that do not
	 *  exist on the server yet (that's being done by calling processCalendarEventMessage manually)
	 * public for testing */
	async processCalendarData(sender: string, calendarData: ParsedCalendarData): Promise<void> {
		if (calendarData.contents.length === 0) {
			console.log(TAG, `Calendar update with no events, ignoring`)
			return
		}

		if (calendarData.contents[0].event.uid == null) {
			console.log(TAG, "invalid event update without UID, ignoring.")
			return
		}

		// we can have multiple cases here:
		// 1. calendarData has one event and it's the progenitor
		// 2. calendarData has one event and it's an altered occurrence
		// 3. it's both (thunderbird sends ical files with multiple events)

		// Load the events bypassing the cache because we might have already processed some updates and they might have changed the events we are about to load.
		// We want to operate on the latest events only, otherwise we might lose some data.
		const dbEvents = await this.calendarFacade.getEventsByUid(calendarData.contents[0].event.uid, CachingMode.Bypass)

		const defaultCalendarGroupRoot = await this.getDefaultCalendarGroupRoot()
		if (dbEvents == null) {
			return await this.handleNewCalendarInvitation(sender, calendarData, defaultCalendarGroupRoot)
		}

		const method = calendarData.method
		for (const content of calendarData.contents) {
			const updateAlarms = content.alarms
			const updateEvent = content.event
			// this automatically applies REQUESTs for creating parts of the existing event series that do not exist yet
			// like accepting another altered instance invite or accepting the progenitor after accepting only an altered instance.
			await this.processCalendarEventMessage(sender, method, updateEvent, updateAlarms, dbEvents)
		}
	}

	/* Fetches all calendars and filter out external calendars; Tries to find the default one by the field default;
	 * Defaults to the oldest calendar if no calendar is marked as default;
	 *
	 * Throws an error if it fails to find a valid calendar after a set number of retries
	 *
	 * @return {CalendarGroupRoot}
	 * @throws if can not create a default calendar when needed
	 */
	async getDefaultCalendarGroupRoot(): Promise<CalendarGroupRoot> {
		const storedDefaultCalendarGroupRoot = this.logins.getUserController().userSettingsGroupRoot.defaultCalendar
		if (storedDefaultCalendarGroupRoot) {
			return await this.entityClient.load(CalendarGroupRootTypeRef, storedDefaultCalendarGroupRoot)
		}

		const calendarInfos = await this.loadOrCreateCalendarInfo(this.readProgressMonitor.next().value)
		const firstCalendar = findFirstPrivateCalendar(calendarInfos)

		if (!firstCalendar) {
			console.warn("No non-external calendar available, creating default one...")
			throw new Error(`Could not create an default calendar for user ${this.logins.getUserController().user._id}`)
		}

		// If there is no default calendar, we assume the "oldest" calendar as default
		return firstCalendar.groupRoot
	}

	/** Handles new Calendar Invitations, creating an entry for them inside the pendingEvents of the default CalendarGroupRoot
	 * and also inserts an index entry into CalendarEventUidIndexTypeRef
	 */
	async handleNewCalendarInvitation(sender: string, calendarData: ParsedCalendarData, defaultCalendarGroupRoot: CalendarGroupRoot) {
		if (calendarData.method !== CalendarMethod.REQUEST) {
			return // We don't handle anything different form an invitation
		}

		const eventsPromises = calendarData.contents.map((parsed) => {
			const fullEvent = {
				...parsed.event,
				sender,
			}

			return this.createPendingEvent(fullEvent, defaultCalendarGroupRoot, parsed.alarms)
		})

		await Promise.all(eventsPromises)
	}

	/**
	 * Processing calendar update - bring events in calendar up-to-date with ical data sent via email.
	 * calendar data are currently processed for
	 * - REQUEST: here we have two cases:
	 *     - there is an existing event: we apply the update to that event and do the necessary changes to the other parts of the series that may already exist
	 *     - there is no existing event: create the event as received, and do the necessary changes to the other parts of the series that may already exist
	 * - REPLY: update attendee status,
	 * - CANCEL: we delete existing event instance
	 *
	 * @param sender
	 * @param method
	 * @param updateEvent the actual instance that needs to be updated
	 * @param updateAlarms
	 * @param target either the existing event to update or the calendar group Id to create the event in in case of a new event.
	 */
	async processCalendarEventMessage(
		sender: string,
		method: string,
		updateEvent: Require<"uid", CalendarEvent>,
		updateAlarms: Array<AlarmInfoTemplate>,
		target: CalendarEventUidIndexEntry,
	): Promise<void> {
		const updateEventTime = updateEvent.recurrenceId?.getTime()
		const targetDbEvent = updateEventTime == null ? target.progenitor : target.alteredInstances.find((e) => e.recurrenceId.getTime() === updateEventTime)
		if (targetDbEvent == null) {
			if (method === CalendarMethod.REQUEST) {
				// we got a REQUEST for which we do not have a saved version of the particular instance (progenitor or altered)
				// it may be
				// - a single-instance update that created this altered instance
				// - the user got the progenitor invite for a series. it's possible that there's
				//   already altered instances of this series on the server.
				return await this.processCalendarAccept(target, updateEvent, updateAlarms)
			} else if (target.progenitor?.repeatRule != null && updateEvent.recurrenceId != null && method === CalendarMethod.CANCEL) {
				// some calendaring apps send a cancellation for an altered instance with a RECURRENCE-ID when
				// users delete a single instance from a series even though that instance was never published as altered.
				// we can just add the exclusion to the progenitor. this would be another argument for marking
				// altered-instance-exclusions in some way distinct from "normal" exclusions
				target.alteredInstances.push(updateEvent as CalendarEventAlteredInstance)
				// this will now modify the progenitor to have the required exclusions
				return await this.processCalendarUpdate(target, target.progenitor, target.progenitor)
			} else {
				console.log(TAG, `got something that's not a REQUEST for nonexistent server event on uid:`, method)
				return
			}
		}

		const sentByOrganizer: boolean = targetDbEvent.organizer != null && targetDbEvent.organizer.address === sender
		if (method === CalendarMethod.REPLY) {
			return this.processCalendarReply(sender, targetDbEvent, updateEvent)
		} else if (sentByOrganizer && method === CalendarMethod.REQUEST) {
			return await this.processCalendarUpdate(target, targetDbEvent, updateEvent)
		} else if (sentByOrganizer && method === CalendarMethod.CANCEL) {
			return await this.processCalendarCancellation(targetDbEvent)
		} else {
			console.log(TAG, `${method} update sent not by organizer, ignoring.`)
		}
	}

	/** process either a request for an existing progenitor or an existing altered instance.
	 * @param dbTarget the uid entry containing the other events that are known to us that belong to this event series.
	 * @param dbEvent the version of updateEvent stored on the server. must be identical to dbTarget.progenitor or one of dbTarget.alteredInstances
	 * @param updateEvent the event that contains the new version of dbEvent. */
	private async processCalendarUpdate(dbTarget: CalendarEventUidIndexEntry, dbEvent: CalendarEventInstance, updateEvent: CalendarEvent): Promise<void> {
		console.log(TAG, "processing request for existing event instance")
		const { repeatRuleWithExcludedAlteredInstances } = await import("../gui/eventeditor-model/CalendarEventWhenModel.js")
		// some providers do not increment the sequence for all edit operations (like google when changing the summary)
		// we'd rather apply the same update too often than miss some, and this enables us to update our own status easily
		// without having to increment the sequence.
		if (filterInt(dbEvent.sequence) > filterInt(updateEvent.sequence)) {
			console.log(TAG, "got update for outdated event version, ignoring.")
			return
		}
		if (updateEvent.recurrenceId == null && updateEvent.repeatRule != null) {
			// the update is for a repeating progenitor. we need to exclude all known altered instances from its repeat rule.
			updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(
				updateEvent,
				dbTarget.alteredInstances.map((r) => r.recurrenceId),
				this.zone,
			)
		}
		// If the update is for the altered occurrence, we do not need to update the progenitor, it already has the exclusion.
		// If we get into this function we already have the altered occurrence in db.

		// write the progenitor back to the uid index entry so that the subsequent updates from the same file get the updated instance
		dbTarget.progenitor = (await this.updateEventWithExternal(dbEvent, updateEvent)) as CalendarEventProgenitor
	}

	/**
	 * do not call this for anything but a REQUEST
	 * @param dbTarget the progenitor that must have a repeat rule and an exclusion for this event to be accepted, the known altered instances and the ownergroup.
	 * @param updateEvent the event to create
	 * @param alarms alarms to set up for this user/event
	 */
	private async processCalendarAccept(
		dbTarget: CalendarEventUidIndexEntry,
		updateEvent: Require<"uid", CalendarEvent>,
		alarms: Array<AlarmInfoTemplate>,
	): Promise<void> {
		console.log(TAG, "processing new instance request")
		const { repeatRuleWithExcludedAlteredInstances } = await import("../gui/eventeditor-model/CalendarEventWhenModel.js")
		if (updateEvent.recurrenceId != null && dbTarget.progenitor != null && dbTarget.progenitor.repeatRule != null) {
			// request for a new altered instance. we'll try adding the exclusion for this instance to the progenitor if possible
			// since not all calendar apps add altered instances to the list of exclusions.
			const updatedProgenitor = clone(dbTarget.progenitor)
			updatedProgenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(updatedProgenitor, [updateEvent.recurrenceId], this.zone)
			dbTarget.progenitor = (await this.doUpdateEvent(dbTarget.progenitor, updatedProgenitor)) as CalendarEventProgenitor
		} else if (updateEvent.recurrenceId == null && updateEvent.repeatRule != null && dbTarget.alteredInstances.length > 0) {
			// request to add the progenitor to the calendar. we have to exclude all altered instances that are known to us from it.
			updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(
				updateEvent,
				dbTarget.alteredInstances.map((r) => r.recurrenceId),
				this.zone,
			)
		}
		let calendarGroupRoot
		try {
			calendarGroupRoot = await this.entityClient.load(CalendarGroupRootTypeRef, dbTarget.ownerGroup)
		} catch (e) {
			if (!(e instanceof NotFoundError) && !(e instanceof NotAuthorizedError)) throw e
			console.log(TAG, "tried to create new progenitor or got new altered instance for progenitor in nonexistent/inaccessible calendar, ignoring")
			return
		}
		return await this.doCreate(updateEvent, "", calendarGroupRoot, alarms)
	}

	/** Someone replied whether they attend an event or not. this MUST be applied to all instances in our
	 * model since we keep attendee lists in sync for now. */
	private async processCalendarReply(sender: string, dbEvent: CalendarEvent, updateEvent: CalendarEvent): Promise<void> {
		console.log("processing calendar reply")
		// first check if the sender of the email is in the attendee list
		const replyAttendee = findAttendeeInAddresses(updateEvent.attendees, [sender])

		if (replyAttendee == null) {
			console.log(TAG, "Sender is not among attendees, ignoring", replyAttendee)
			return
		}

		const newEvent = clone(dbEvent)
		// check if the attendee is still in the attendee list of the latest event
		const dbAttendee = findAttendeeInAddresses(newEvent.attendees, [replyAttendee.address.address])

		if (dbAttendee == null) {
			console.log(TAG, "attendee was not found", dbEvent._id, replyAttendee)
			return
		}

		dbAttendee.status = replyAttendee.status
		await this.doUpdateEvent(dbEvent, newEvent)
	}

	/** handle an event cancellation - either the whole series (progenitor got cancelled)
	 * or the altered occurrence. */
	private async processCalendarCancellation(dbEvent: CalendarEventInstance): Promise<void> {
		console.log(TAG, "processing cancellation")
		// not having UID is technically an error, but we'll do our best (the event came from the server after all)
		if (dbEvent.recurrenceId == null && dbEvent.uid != null) {
			return await this.deleteEventsByUid(dbEvent.uid)
		} else {
			// either this has a recurrenceId and we only delete that instance
			// or we don't have a uid to get all instances.
			return await this.entityClient.erase(dbEvent)
		}
	}

	/**
	 * Update {@param dbEvent} stored on the server with {@param icsEvent} from the ics file.
	 */
	async updateEventWithExternal(dbEvent: CalendarEvent, icsEvent: CalendarEvent): Promise<CalendarEvent> {
		const newEvent = clone(dbEvent)
		newEvent.startTime = icsEvent.startTime
		newEvent.endTime = icsEvent.endTime
		newEvent.attendees = icsEvent.attendees
		newEvent.summary = icsEvent.summary
		newEvent.sequence = icsEvent.sequence
		newEvent.location = icsEvent.location
		newEvent.description = icsEvent.description
		newEvent.organizer = icsEvent.organizer
		newEvent.repeatRule = icsEvent.repeatRule
		newEvent.recurrenceId = icsEvent.recurrenceId

		return await this.doUpdateEvent(dbEvent, newEvent)
	}

	async doUpdateEvent(dbEvent: CalendarEvent, newEvent: CalendarEvent): Promise<CalendarEvent> {
		const [alarms, groupRoot] = await Promise.all([
			this.loadAlarms(dbEvent.alarmInfos, this.logins.getUserController().user),
			this.entityClient.load<CalendarGroupRoot>(CalendarGroupRootTypeRef, assertNotNull(dbEvent._ownerGroup)),
		])
		const alarmInfos = alarms.map((a) => a.alarmInfo)
		const event = await this.updateEvent(newEvent, alarmInfos, "", groupRoot, dbEvent)

		this.requestWidgetRefresh()

		return event
	}

	async init(): Promise<void> {
		await this.scheduleAlarmsLocally()
		await this.loadAndProcessCalendarEventInvitesUpdates()
	}

	/**
	 * Schedule alarms for Webapp and Desktop client by loading all info using {@link loadAlarmEvents} and scheduling with {@link scheduleUserAlarmInfo}
	 */
	async scheduleAlarmsLocally(): Promise<void> {
		if (!this.localAlarmsEnabled()) return

		const pushIdentifier = this.pushService?.getLoadedPushIdentifier()
		if (pushIdentifier && pushIdentifier.disabled) {
			return console.log("Push identifier disabled. Skipping alarm schedule")
		}

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
		this.deviceConfig.removeLastSync(calendar.group._id)
	}

	async getEventsByUid(uid: string): Promise<CalendarEventUidIndexEntry | null> {
		return this.calendarFacade.getEventsByUid(uid)
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		const calendarInfos = await this.calendarInfos.getAsync()
		// We iterate over the alarms twice: once to collect them and to set the counter correctly and the second time to actually process them.
		const alarmEventsToProcess: UserAlarmInfo[] = []
		for (const entityEventData of updates) {
			// apps handle alarms natively. this code is a candidate to move into
			// a generic web/native alarm handler
			if (isUpdateForTypeRef(UserAlarmInfoTypeRef, entityEventData) && !isApp()) {
				if (entityEventData.operation === OperationType.CREATE) {
					// Updates for UserAlarmInfo and CalendarEvent come in a
					// separate batches and there's a race between loading of the
					// UserAlarmInfo and creation of the event.
					// We try to load UserAlarmInfo. Then we wait until the
					// CalendarEvent is there (which might already be true)
					// and load it.
					// All alarms for the same event come in the same batch so
					try {
						const userAlarmInfo = await this.entityClient.load(UserAlarmInfoTypeRef, [entityEventData.instanceListId, entityEventData.instanceId])
						alarmEventsToProcess.push(userAlarmInfo)
						const deferredEvent = this.getPendingAlarmRequest(userAlarmInfo.alarmInfo.calendarRef.elementId)
						deferredEvent.pendingAlarmCounter++
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log(TAG, e, "Event or alarm were not found: ", entityEventData, e)
						} else {
							throw e
						}
					}
				} else if (entityEventData.operation === OperationType.DELETE && !isApp()) {
					await this.cancelUserAlarmInfo(entityEventData.instanceId)
				}
			} else if (isUpdateForTypeRef(CalendarEventTypeRef, entityEventData)) {
				if (entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE) {
					const deferredEvent = this.getPendingAlarmRequest(entityEventData.instanceId)
					deferredEvent.deferred.resolve(undefined)
				}
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
			} else if (isUpdateForTypeRef(FileTypeRef, entityEventData)) {
				// with a file update, the owner enc session key should be present now so we can try to process any skipped calendar event updates
				// (see NoOwnerEncSessionKeyForCalendarEventError's comment)
				const skippedCalendarEventUpdate = this.fileIdToSkippedCalendarEventUpdates.get(entityEventData.instanceId)
				if (skippedCalendarEventUpdate) {
					try {
						await this.handleCalendarEventUpdate(skippedCalendarEventUpdate)
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e)
						} else {
							throw e
						}
					} finally {
						this.fileIdToSkippedCalendarEventUpdates.delete(entityEventData.instanceId)
					}
				}
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(entityEventData, eventOwnerGroupId)) {
				const calendarMemberships = this.logins.getUserController().getCalendarMemberships()
				const oldGroupIds = new Set(calendarInfos.keys())
				const newGroupIds = new Set(calendarMemberships.map((m) => m.group))
				const diff = symmetricDifference(oldGroupIds, newGroupIds)

				if (diff.size !== 0) {
					this.calendarInfos.reload()
				}
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, entityEventData)) {
				// the batch does not belong to that group so we need to find if we actually care about the related GroupInfo
				for (const { groupInfo } of calendarInfos.values()) {
					if (isUpdateFor(groupInfo, entityEventData)) {
						this.calendarInfos.reload()
						break
					}
				}
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, entityEventData)) {
				// Usually this type of update comes alone after all other calendar updates,
				// and user might have subscribed to a new calendar, so we must reload
				// calendar infos to make sure that the calendar has been put in the correct section
				this.birthdayCalendarInfo = this.createBirthdayCalendarInfo()
				this.calendarInfos.reload()
				this.userHasNewPaidPlan.reload()
			}
		}

		if (!isApp()) {
			const pushIdentifier = this.pushService?.getLoadedPushIdentifier()
			if (pushIdentifier && pushIdentifier.disabled) {
				return console.log("Push identifier disabled. Skipping alarm schedule")
			}
		}

		// in the apps, this array is guaranteed to be empty.
		for (const userAlarmInfo of alarmEventsToProcess) {
			const { listId, elementId } = userAlarmInfo.alarmInfo.calendarRef
			const deferredEvent = this.getPendingAlarmRequest(elementId)
			// Don't wait for the deferred event promise because it can lead to a deadlock.
			// Since issue #2264 we process event batches sequentially and the
			// deferred event can never be resolved until the calendar event update is received.
			deferredEvent.deferred.promise = deferredEvent.deferred.promise.then(async () => {
				deferredEvent.pendingAlarmCounter--
				if (deferredEvent.pendingAlarmCounter === 0) {
					this.pendingAlarmRequests.delete(elementId)
				}
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
		}
	}

	private getPendingAlarmRequest(elementId: string) {
		return getFromMap(this.pendingAlarmRequests, elementId, () => ({ pendingAlarmCounter: 0, deferred: defer() }))
	}

	private localAlarmsEnabled(): boolean {
		return !isApp() && !isDesktop() && this.logins.isInternalUserLoggedIn() && !this.logins.isEnabled(FeatureType.DisableCalendar)
	}

	/**
	 * Schedule an alarm from its {@link UserAlarmInfo}
	 * @param event - Event the alarm is being schedule for
	 * @param userAlarmInfo - UserAlarmInfo for this alarm
	 * @param scheduler - An instance of {@link AlarmScheduler}
	 * @private
	 */
	private scheduleUserAlarmInfo(event: CalendarEvent, userAlarmInfo: UserAlarmInfo, scheduler: AlarmScheduler): void {
		this.userAlarmToAlarmInfo.set(getElementId(userAlarmInfo), userAlarmInfo.alarmInfo.alarmIdentifier)

		scheduler.scheduleAlarm(event, userAlarmInfo.alarmInfo, event.repeatRule, (eventTime, summary) => {
			const { title, body } = formatNotificationForDisplay(eventTime, summary)
			this.notifications.showNotification(
				NotificationType.Calendar,
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

	// VisibleForTesting
	getFileIdToSkippedCalendarEventUpdates(): Map<Id, CalendarEventUpdate> {
		return this.fileIdToSkippedCalendarEventUpdates
	}

	getBirthdayEventTitle(contactName: string) {
		return this.lang.get("birthdayEvent_title", {
			"{name}": contactName,
		})
	}

	getAgeString(age: number) {
		return this.lang.get("birthdayEventAge_title", { "{age}": age })
	}

	getGroupSettings(): GroupSettings[] {
		return this.logins.getUserController().userSettingsGroupRoot.groupSettings
	}
}

/** return false when the given events (representing the new and old version of the same event) are both long events
 * or both short events, true otherwise */
async function didLongStateChange(newEvent: CalendarEvent, existingEvent: CalendarEvent, zone: string): Promise<boolean> {
	const { isLongEvent } = await import("../../../common/calendar/date/CalendarUtils.js")
	return isLongEvent(newEvent, zone) !== isLongEvent(existingEvent, zone)
}

/**
 * This is used due us receiving calendar events before updateOwnerEncSessionKey gets triggered, and thus we can't load calendar data attachments. This is
 * required due to our permission system and the fact that bucket keys are not immediately accessible from File, only Mail.
 *
 * This is a limitation that should be addressed in the future.
 */
class NoOwnerEncSessionKeyForCalendarEventError extends TutanotaError {
	constructor(message: string) {
		super("NoOwnerEncSessionKeyForCalendarEventError", message)
	}
}

/**
 * yield the given monitor one time and then switch to noOp monitors forever
 */
function* oneShotProgressMonitorGenerator(progressTracker: ProgressTracker, userController: UserController): Generator<IProgressMonitor> {
	// load all calendars. if there is no calendar yet, create one
	// we load three instances per calendar / CalendarGroupRoot / GroupInfo / Group
	const workPerCalendar = 3
	const totalWork = userController.getCalendarMemberships().length * workPerCalendar
	// the first time we want a real progress monitor but any time we would reload we don't need it
	const realMonitorId = progressTracker.registerMonitorSync(totalWork)
	const realMonitor = assertNotNull(progressTracker.getMonitor(realMonitorId))
	yield realMonitor
	while (true) {
		yield new NoopProgressMonitor()
	}
}

export function formatNotificationForDisplay(eventTime: Date, summary: string): { title: string; body: string } {
	let dateString: string

	if (isSameDay(eventTime, new Date())) {
		dateString = formatTime(eventTime)
	} else {
		dateString = formatDateWithWeekdayAndTime(eventTime)
	}

	const body = `${dateString} ${summary}`

	return { body, title: body }
}

async function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return Promise.all([
		locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents),
		locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents),
	]).then((results) => results.flat())
}
