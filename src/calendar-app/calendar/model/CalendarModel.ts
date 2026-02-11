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
	findAndRemove,
	getFromMap,
	isNotEmpty,
	isSameDay,
	LazyLoaded,
	splitInChunks,
	symmetricDifference,
} from "@tutao/tutanota-utils"
import {
	BIRTHDAY_CALENDAR_BASE_ID,
	CalendarAttendeeStatus,
	CalendarMethod,
	DEFAULT_BIRTHDAY_CALENDAR_COLOR,
	DEFAULT_CALENDAR_COLOR,
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
	CalendarEventAttendee,
	CalendarEventTypeRef,
	CalendarEventUpdate,
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
import {
	AlarmInfoTemplate,
	CachingMode,
	CalendarEventAlteredInstance,
	CalendarEventInstance,
	CalendarEventProgenitor,
	CalendarEventUidIndexEntry,
	CalendarFacade,
} from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { IServiceExecutor } from "../../../common/api/common/ServiceRequest"
import { MembershipService } from "../../../common/api/entities/sys/Services"
import { FileController } from "../../../common/file/FileController"
import { findAttendeeInAddresses, serializeAlarmInterval } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { SessionKeyNotFoundError } from "../../../common/api/common/error/SessionKeyNotFoundError.js"
import Stream from "mithril/stream"
import { ObservableLazyLoaded } from "../../../common/api/common/utils/ObservableLazyLoaded.js"
import { UserController } from "../../../common/api/main/UserController.js"
import { formatDateWithWeekdayAndTime, formatTime } from "../../../common/misc/Formatter.js"
import { EntityUpdateData, isUpdateFor, isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import {
	AlarmInterval,
	assignEventId,
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
	EventAlarmsTuple,
	eventHasSameFields,
	EventImportRejectionReason,
	IcsCalendarEvent,
	makeCalendarEventFromIcsCalendarEvent,
	normalizeCalendarUrl,
	parseCalendarStringData,
	ParsedCalendarData,
	ParsedEvent,
	shallowIsSameEvent,
	sortOutParsedEvents,
	SyncStatus,
} from "../../../common/calendar/gui/ImportExportUtils.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { LanguageViewModel } from "../../../common/misc/LanguageViewModel.js"
import { NativePushServiceApp } from "../../../common/native/main/NativePushServiceApp.js"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker.js"
import { CacheMode } from "../../../common/api/worker/rest/EntityRestClient"
import { TutanotaError } from "@tutao/tutanota-error"
import { getEnabledMailAddressesForGroupInfo } from "../../../common/api/common/utils/GroupUtils"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"

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
	private externalCalendarSyncIntervalId: TimeoutID | null = null
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
		private readonly contactModel: ContactModel,
		private readonly zone: string,
		private readonly externalCalendarFacade: ExternalCalendarFacade | null,
		private readonly deviceConfig: DeviceConfig,
		private readonly pushService: NativePushServiceApp | null,
		private readonly syncTracker: SyncTracker,
		private readonly requestWidgetRefresh: () => void,
		private readonly lang: LanguageViewModel,
	) {
		this.readProgressMonitor = oneShotProgressMonitorGenerator(progressTracker, logins.getUserController())
		eventController.addEntityListener({
			onEntityUpdatesReceived: (updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId),
			priority: OnEntityUpdateReceivedPriority.NORMAL,
		})

		syncTracker.addSyncDoneListener({
			onSyncDone: async () => this.requestWidgetRefresh(),
			priority: SyncDonePriority.HIGH,
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

	/**
	 * Provides public access to this.doCreate, so it can be used by Strategies.
	 */
	async createEvent(event: CalendarEvent, alarmInfos: ReadonlyArray<AlarmInfoTemplate>, zone: string, groupRoot: CalendarGroupRoot): Promise<void> {
		await this.doCreate(event, zone, groupRoot, alarmInfos)
	}

	/**
	 * Process an update to an CalendarEvent entity.
	 * Event will be deleted & remade if there is a change to event start time, ownerGroup, or long/short list.
	 *
	 * @param newEvent
	 * @param newAlarms
	 * @param zone
	 * @param groupRoot
	 * @param existingEvent
	 */
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

		newEvent.pendingInvitation = this.isPendingInvitation(newEvent)

		// in cases where start time or calendar changed, we need to change the event id and so need to delete/recreate.
		// it's also possible that the event has to be moved from the long event list to the short event list or vice versa.
		if (
			existingEvent._ownerGroup !== groupRoot._id ||
			newEvent.startTime.getTime() !== existingEvent.startTime.getTime() ||
			(await didLongStateChange(newEvent, existingEvent, zone))
		) {
			await this.replaceEvent(existingEvent, newEvent, zone, groupRoot, newAlarms)

			this.requestWidgetRefresh()
			// We should reload the instance here because session key and permissions are updated when we recreate event.
			return await this.entityClient.load<CalendarEvent>(CalendarEventTypeRef, newEvent._id)
		} else {
			newEvent._ownerGroup = groupRoot._id
			// We can't load updated event here because cache is not updated yet. We also shouldn't need to load it, we have the latest version
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
				.catch(() => console.log("error cleaning up membership for group: ", membership.group))
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
		const color = groupSettings?.color ?? DEFAULT_CALENDAR_COLOR
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
		if (this.externalCalendarSyncIntervalId) {
			clearInterval(this.externalCalendarSyncIntervalId)
		}
		this.externalCalendarSyncIntervalId = setInterval(() => {
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
		if (!this.externalCalendarFacade || !locator.logins.isFullyLoggedIn() || !this.syncTracker.isSyncDone) {
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
				console.log("failed to sync external calendar", error)
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
				(existingEvent) => !parsedExternalEvents.some((externalEvent) => shallowIsSameEvent(externalEvent.icsCalendarEvent, existingEvent)),
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
		eventsForCreation: Array<EventAlarmsTuple>,
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

		const firstPrivateCalendar = findFirstPrivateCalendar(calendarInfos)
		const isInternalUser = this.logins.isInternalUserLoggedIn()

		if (!isInternalUser || firstPrivateCalendar) {
			return calendarInfos
		}

		await this.createCalendar("", null, [], null)

		// Reload calendar infos to include the newly created calendar
		return await this.loadCalendarInfos(progressMonitor)
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

	/**
	 * Creates a brand new CalendarEvent entity.
	 *
	 * @param event
	 * @param zone
	 * @param groupRoot
	 * @param alarmInfos
	 * @private
	 */
	private async doCreate(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot, alarmInfos: ReadonlyArray<AlarmInfoTemplate>): Promise<void> {
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

		event.pendingInvitation = this.isPendingInvitation(event)

		// Reset permissions because server will assign them
		downcast(event)._permissions = null
		event._ownerGroup = groupRoot._id

		await this.calendarFacade.createCalendarEvent(event, alarmInfos ?? null)
		return this.requestWidgetRefresh()
	}

	private async replaceEvent(
		oldEvent: CalendarEvent,
		newEvent: CalendarEvent,
		zone: string,
		groupRoot: CalendarGroupRoot,
		alarmInfos: ReadonlyArray<AlarmInfoTemplate>,
	): Promise<void> {
		// If the event was copied it might still carry some fields for re-encryption. We can't reuse them.
		removeTechnicalFields(newEvent)
		const { assignEventId } = await import("../../../common/calendar/date/CalendarUtils")
		// if values of the existing events have changed that influence the alarm time then delete the old event and create a new
		// one.
		assignEventId(newEvent, zone, groupRoot)
		// Reset ownerEncSessionKey because it cannot be set for new entity, it will be assigned by the CryptoFacade
		newEvent._ownerEncSessionKey = null
		if (newEvent.repeatRule != null) {
			newEvent.repeatRule.excludedDates = newEvent.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }))
		}

		newEvent.pendingInvitation = this.isPendingInvitation(newEvent)
		// Reset permissions because server will assign them
		downcast(newEvent)._permissions = null
		newEvent._ownerGroup = groupRoot._id

		await this.calendarFacade.replaceCalendarEvent(oldEvent, newEvent, alarmInfos ?? null)
		return this.requestWidgetRefresh()
	}

	isPendingInvitation(event: CalendarEvent) {
		const ownMailAddresses = getEnabledMailAddressesForGroupInfo(this.logins.getUserController().userGroupInfo)
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(event.attendees, ownMailAddresses)

		return ownAttendee?.status === CalendarAttendeeStatus.NEEDS_ACTION || ownAttendee?.status === CalendarAttendeeStatus.ADDED
	}

	async deleteEvent(event: CalendarEvent): Promise<void> {
		await this.entityClient.erase(event)
		return this.requestWidgetRefresh()
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

	/**
	 * Handles ics files received via email entities by downloading the associated ics file attachment.
	 * The function parses the content of the ics files and creates or updates  calendar event entities.
	 *
	 * @param update The calendar event data received via email.
	 * @throws NoOwnerEncSessionKeyForCalendarEventError when the session key for the ics file cannot be resolved.
	 */
	public async handleCalendarEventUpdate(update: CalendarEventUpdate): Promise<void> {
		// we want to delete the CalendarEventUpdate after we are done, even, in some cases, if something went wrong.
		try {
			const parsedCalendarData = await this.getCalendarDataForUpdate(update.file)
			if (parsedCalendarData != null) {
				await this.processParsedCalendarDataFromIcs(update.sender, parsedCalendarData)
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
				// re-throw error with deleting the CalendarEventUpdate entity, so we can process it later when resolving session key is possible.
				throw e
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
		const entry = await this.calendarFacade.getEventsByUid(uid, CachingMode.Cached, false)
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

	/** process a calendar update retrieved from the server automatically. will not apply updates to event series that do not
	 *  exist on the server yet (that's being done by calling processCalendarEventMessage manually)
	 *
	 * @VisibleForTesting
	 */
	async processParsedCalendarDataFromIcs(sender: string, parsedCalendarData: ParsedCalendarData): Promise<void> {
		if (parsedCalendarData.contents.length === 0) {
			console.log(TAG, `CalendarEventUpdate with no events, ignoring`)
			return
		}

		if (parsedCalendarData.contents[0].icsCalendarEvent.uid == null) {
			console.log(TAG, "Invalid CalendarEventUpdate without UID, ignoring.")
			return
		}

		// we can have multiple cases here:
		// 1. parsedCalendarData has one event and it's the progenitor
		// 2. parsedCalendarData has one event and it's an altered occurrence
		// 3. it's both (thunderbird sends ical files with multiple events)

		// Load the events bypassing the cache because we might have already processed some updates and they might have changed the events we are about to load.
		// We want to operate on the latest events only, otherwise we might lose some data.
		const latestPersistedEventsIndexEntry = await this.calendarFacade.getEventsByUid(
			parsedCalendarData.contents[0].icsCalendarEvent.uid,
			CachingMode.Bypass,
			true,
		)

		const icsEventRecurrenceIdTimestamp = parsedCalendarData.contents[0].icsCalendarEvent.recurrenceId?.getTime()
		const resolvedPersistedCalendarEvent = !icsEventRecurrenceIdTimestamp
			? latestPersistedEventsIndexEntry?.progenitor
			: latestPersistedEventsIndexEntry?.alteredInstances.find((e) => e.recurrenceId.getTime() === icsEventRecurrenceIdTimestamp)

		const senderContact = await this.contactModel.searchForContact(sender)
		if (!resolvedPersistedCalendarEvent && !senderContact) {
			console.log(TAG, `CalendarEventUpdate sent from a untrusted sender, ignoring.`)
			return
		}

		if (resolvedPersistedCalendarEvent) {
			const method = parsedCalendarData.method
			for (const content of parsedCalendarData.contents) {
				const updateAlarms = content.alarms
				const updateEvent = content.icsCalendarEvent
				// this automatically applies REQUESTs for creating parts of the existing event series that do not exist yet
				// like accepting another altered instance invite or accepting the progenitor after accepting only an altered instance.
				await this.handleExistingCalendarEventInvitationFromIcs(
					sender,
					method,
					updateEvent,
					resolvedPersistedCalendarEvent,
					latestPersistedEventsIndexEntry!,
				)
			}
		} else {
			return await this.handleNewCalendarEventInvitationFromIcs(sender, parsedCalendarData, latestPersistedEventsIndexEntry)
		}
	}

	/**
	 * Handles new Calendar Invitations. The server takes care of inserting an index entry into CalendarEventUidIndexTypeRef
	 */
	async handleNewCalendarEventInvitationFromIcs(sender: string, calendarData: ParsedCalendarData, uidIndexEntry: CalendarEventUidIndexEntry | null) {
		if (calendarData.method !== CalendarMethod.REQUEST) {
			console.log(TAG, `got something that's not a REQUEST for nonexistent server event on uid: `, calendarData.method)
			return // We don't handle anything different from an invitation
		}

		// we got a REQUEST for which we do not have a saved version of the particular instance (progenitor or altered)
		// it may be
		// - a single-instance update that created a brand new altered instance
		// - the user got the progenitor invite for a series. it's possible that there's
		//   already altered instances of this series on the server.
		const eventsPromises = calendarData.contents.map((parsed) => {
			const calendarEvent: CalendarEvent = makeCalendarEventFromIcsCalendarEvent(parsed.icsCalendarEvent)
			calendarEvent.sender = sender

			const promisses: Promise<void>[] = []

			if (uidIndexEntry?.progenitor?.repeatRule != null && calendarEvent.recurrenceId != null && calendarData.method === CalendarMethod.CANCEL) {
				// some calendaring apps send a cancellation for an altered instance with a RECURRENCE-ID when
				// users delete a single instance from a series even though that instance was never published as altered.
				// we can just add the exclusion to the progenitor. this would be another argument for marking
				// altered-instance-exclusions in some way distinct from "normal" exclusions
				uidIndexEntry.alteredInstances.push(calendarEvent as CalendarEventAlteredInstance)
				// this will now modify the progenitor to have the required exclusions
				promisses.push(this.processUpdateToCalendarEventFromIcs(uidIndexEntry, uidIndexEntry.progenitor, uidIndexEntry.progenitor))
			}

			promisses.push(this.processNewAlteredInstanceOrNewEvent(uidIndexEntry, calendarEvent, sender))

			return promisses
		})

		await Promise.all(eventsPromises.flat())
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
	 * @param icsCalendarEvent the actual instance that needs to be updated
	 * @param parsedCalendarDataAlarms
	 * @param uidIndexEntry either the existing event to update or the calendar group Id to create the event in in case of a new event.
	 */
	async handleExistingCalendarEventInvitationFromIcs(
		sender: string,
		method: string,
		icsCalendarEvent: IcsCalendarEvent,
		resolvedPersistedCalendarEvent: CalendarEventInstance,
		uidIndexEntry: CalendarEventUidIndexEntry,
	): Promise<void> {
		const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
		const sentByOrganizer: boolean = resolvedPersistedCalendarEvent.organizer != null && resolvedPersistedCalendarEvent.organizer.address === sender
		if (method === CalendarMethod.REPLY) {
			return this.processCalendarReply(sender, resolvedPersistedCalendarEvent, calendarEvent) // TODO: why are alarms NOT passed in here
		} else if (sentByOrganizer && method === CalendarMethod.REQUEST) {
			return await this.processUpdateToCalendarEventFromIcs(uidIndexEntry, resolvedPersistedCalendarEvent, calendarEvent)
		} else if (sentByOrganizer && method === CalendarMethod.CANCEL) {
			return await this.processCalendarCancel(uidIndexEntry, resolvedPersistedCalendarEvent)
		} else {
			console.log(TAG, `${method} update sent not by organizer, ignoring.`)
		}
	}

	private async processCalendarCancel(target: CalendarEventUidIndexEntry, targetDbEvent: CalendarEventInstance) {
		const progenitor = target.progenitor
		const shouldRemoveAlteredIntanceFromProgenitorExcludedDates = progenitor && progenitor.repeatRule?.excludedDates
		if (shouldRemoveAlteredIntanceFromProgenitorExcludedDates) {
			const newProgenitor = clone(progenitor)
			const exclusionDateRemoved = findAndRemove(
				newProgenitor.repeatRule!.excludedDates,
				(dateWrapper) => dateWrapper.date.getTime() === targetDbEvent.recurrenceId?.getTime(),
			)
			if (exclusionDateRemoved) {
				await this.doUpdateEvent(progenitor, newProgenitor)
			}
		}
		return await this.deletePersistedEvents(targetDbEvent)
	}

	/** process either a request for an existing progenitor or an existing altered instance.
	 * @param dbTarget the uid entry containing the other events that are known to us that belong to this event series.
	 * @param dbEvent the version of updateEvent stored on the server. must be identical to dbTarget.progenitor or one of dbTarget.alteredInstances
	 * @param updateEvent the event that contains the new version of dbEvent. */
	public async processUpdateToCalendarEventFromIcs(
		dbTarget: CalendarEventUidIndexEntry,
		dbEvent: CalendarEventInstance,
		updateEvent: CalendarEvent,
	): Promise<void> {
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
			const alteredInstances = dbTarget.alteredInstances.map((r) => r.recurrenceId)
			if (dbEvent.repeatRule?._id) {
				updateEvent.repeatRule._id = dbEvent.repeatRule?._id // ensures the progenitor's repeat rule gets updated instead of replaced
			}
			updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(updateEvent, alteredInstances, this.zone)
		}
		const calendarEvent = await this.updateEventWithExternal(dbEvent, updateEvent)

		// If the update is for the altered occurrence, we do not need to update the progenitor, it already has the exclusion.
		// If we get into this function we already have the altered occurrence in db.
		// write the progenitor back to the uid index entry so that the subsequent updates from the same file get the updated instance

		if (calendarEvent.recurrenceId == null) {
			dbTarget.progenitor = calendarEvent as CalendarEventProgenitor
		}
	}

	/**
	 * Cases to handle:
	 * - update progenitor
	 *   - progenitor is does not repeat
	 *   - progenitor repeats
	 * - update alteredInstance
	 */

	/**
	 * do not call this for anything but a REQUEST
	 * @param dbTarget the progenitor that must have a repeat rule and an exclusion for this event to be accepted, the known altered instances and the ownergroup.
	 * @param updateEvent the event to create
	 * @param alarms alarms to set up for this user/event
	 * @param sender email address that the event request was received from
	 */
	private async processNewAlteredInstanceOrNewEvent(dbTarget: CalendarEventUidIndexEntry | null, updateEvent: CalendarEvent, sender: string): Promise<void> {
		const { repeatRuleWithExcludedAlteredInstances } = await import("../gui/eventeditor-model/CalendarEventWhenModel.js")

		let ownerGroup = dbTarget?.ownerGroup
		if (ownerGroup == null) {
			const calendarInfos = await this.getCalendarInfos()
			ownerGroup = findFirstPrivateCalendar(calendarInfos)?.groupRoot._id
			assertNotNull(ownerGroup, "Missing private calendar")
		}

		if (dbTarget) {
			const isAlteredInstance = updateEvent.recurrenceId != null
			if (isAlteredInstance && dbTarget.progenitor != null && dbTarget.progenitor.repeatRule != null) {
				// request for a new altered instance. we'll try adding the exclusion for this instance to the progenitor if possible
				// since not all calendar apps add altered instances to the list of exclusions.

				const updatedProgenitor = clone(dbTarget.progenitor)
				updatedProgenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(updatedProgenitor, [updateEvent.recurrenceId!], this.zone)
				dbTarget.progenitor = (await this.doUpdateEvent(dbTarget.progenitor, updatedProgenitor)) as CalendarEventProgenitor
			} else if (!isAlteredInstance && updateEvent.repeatRule != null && dbTarget.alteredInstances.length > 0) {
				// request to add the progenitor to the calendar. we have to exclude all altered instances that are known to us from it.
				updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(
					updateEvent,
					dbTarget.alteredInstances.map((r) => r.recurrenceId),
					this.zone,
				)
			}
		}

		updateEvent.sender = sender

		let calendarGroupRoot
		try {
			calendarGroupRoot = await this.entityClient.load(CalendarGroupRootTypeRef, ownerGroup!)
		} catch (e) {
			if (!(e instanceof NotFoundError) && !(e instanceof NotAuthorizedError)) throw e
			console.log(TAG, "tried to create new progenitor or got new altered instance for progenitor in nonexistent/inaccessible calendar, ignoring")
			return
		}
		return await this.doCreate(updateEvent, "", calendarGroupRoot, [])
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

	/** delete an event in case of cancellation or guest declining - either the whole series (progenitor got cancelled)
	 * or the altered occurrence. */
	private async deletePersistedEvents(dbEvent: CalendarEventInstance): Promise<void> {
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

		// do not take pendingInvitation status from icsEvent, as it will never be part of the ics file.
		return await this.doUpdateEvent(dbEvent, newEvent)
	}

	/**
	 * Gets alarms from server for an event that is being updated
	 * (so they can be reapplied to the event if there is a deletion and recreation)
	 *
	 * Updates the new event and returns it.
	 *
	 * @param dbEvent
	 * @param newEvent
	 *
	 * @return Promise<CalendarEvent> - A promise with the newly updated event
	 */
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

	/**
	 * Load a user's alarms for a given event.
	 *
	 * @param alarmInfos - Array of IdTuples representing the alarms on a calendar event. (from CalendarEvent.alarmInfos)
	 * @param user - A User entity.
	 *
	 * @return Promise<Array<UserAlarmInfo>>
	 */
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

	async getEventsByUid(uid: string, fetchOnlyPrivateCalendars: boolean = false): Promise<CalendarEventUidIndexEntry | null> {
		return this.calendarFacade.getEventsByUid(uid, CachingMode.Cached, fetchOnlyPrivateCalendars)
	}

	// Visible for testing
	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
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
export class NoOwnerEncSessionKeyForCalendarEventError extends TutanotaError {
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
