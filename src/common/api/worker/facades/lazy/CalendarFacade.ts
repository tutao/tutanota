import {assertWorkerOrNode} from "../../../common/Env.js"
import {
    AlarmInfo,
    AlarmNotification,
    AlarmNotificationTypeRef,
    createAlarmInfo,
    createAlarmNotification,
    createAlarmServicePost,
    createCalendarEventRef,
    createDateWrapper,
    createNotificationSessionKey,
    createRepeatRule,
    createUserAlarmInfo,
    Group,
    PushIdentifier,
    PushIdentifierTypeRef,
    RepeatRule,
    User,
    UserAlarmInfo,
    UserAlarmInfoTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import {
    assertNotNull,
    DAY_IN_MILLIS,
    flatMap,
    getFromMap,
    groupBy,
    groupByAndMapUniquely,
    isNotNull,
    neverNull,
    ofClass,
    promiseMap,
    Require,
    stringToUtf8Uint8Array,
    uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import {CryptoFacade} from "../../crypto/CryptoFacade.js"
import {GroupType, OperationType} from "../../../common/TutanotaConstants.js"
import type {
    CalendarEvent,
    CalendarEventUidIndex,
    CalendarRepeatRule,
    UserSettingsGroupRoot
} from "../../../entities/tutanota/TypeRefs.js"
import {
    CalendarEventTypeRef,
    CalendarEventUidIndexTypeRef,
    CalendarGroupRootTypeRef,
    createCalendarDeleteData
} from "../../../entities/tutanota/TypeRefs.js"
import {DefaultEntityRestCache} from "../../rest/DefaultEntityRestCache.js"
import {
    ConnectionError,
    NotAuthorizedError,
    NotFoundError,
    PayloadTooLargeError
} from "../../../common/error/RestError.js"
import {EntityClient, loadMultipleFromLists} from "../../../common/EntityClient.js"
import {
    elementIdPart,
    getLetId,
    getListId,
    isSameId,
    listIdPart,
    uint8arrayToCustomId
} from "../../../common/utils/EntityUtils.js"
import {GroupManagementFacade} from "./GroupManagementFacade.js"
import {SetupMultipleError} from "../../../common/error/SetupMultipleError.js"
import {ImportError} from "../../../common/error/ImportError.js"
import {aes256RandomKey, AesKey, bitArrayToUint8Array, encryptKey, sha256Hash} from "@tutao/tutanota-crypto"
import {TutanotaError} from "@tutao/tutanota-error"
import {IServiceExecutor} from "../../../common/ServiceRequest.js"
import {AlarmService} from "../../../entities/sys/Services.js"
import {CalendarService} from "../../../entities/tutanota/Services.js"
import {UserFacade} from "../UserFacade.js"
import {NativePushFacade} from "../../../../native/common/generatedipc/NativePushFacade.js"
import {ExposedOperationProgressTracker, OperationId} from "../../../main/OperationProgressTracker.js"
import {InfoMessageHandler} from "../../../../gui/InfoMessageHandler.js"
import {ProgrammingError} from "../../../common/error/ProgrammingError.js"
import {
    addDaysForEventInstance,
    addDaysForRecurringEvent,
    CalendarTimeRange,
    generateCalendarInstancesInRange,
    isBirthdayCalendar,
    isLongEvent,
} from "../../../../calendar/date/CalendarUtils.js"
import {CalendarInfo} from "../../../../../calendar-app/calendar/model/CalendarModel.js"
import {geEventElementMaxId, getEventElementMinId} from "../../../common/utils/CommonCalendarUtils.js"
import {DaysToEvents} from "../../../../calendar/date/CalendarEventsRepository.js"
import {isOfflineError} from "../../../common/utils/ErrorUtils.js"
import type {EventAlarmsTuple} from "../../../../calendar/gui/ImportExportUtils.js"
import {InstancePipeline} from "../../crypto/InstancePipeline"
import {AttributeModel} from "../../../common/AttributeModel"
import {ClientModelUntypedInstance} from "../../../common/EntityTypes"
import {EventWrapper} from "../../../../../calendar-app/calendar/view/CalendarViewModel.js"

assertWorkerOrNode()

type AlarmNotificationsPerEvent = {
    event: CalendarEvent
    alarmInfoIds: IdTuple[]
    alarmNotifications: AlarmNotification[]
}

/** event that is a part of an event series and references another event via its recurrenceId and uid */
export type CalendarEventAlteredInstance = Require<"recurrenceId" | "uid", CalendarEvent> & { repeatRule: null }
/** events that has a uid, but no recurrenceId exist on their own and may define a series. events that do not repeat are also progenitors. */
export type CalendarEventProgenitor = Require<"uid", CalendarEvent> & { recurrenceId: null }
export type CalendarEventInstance = CalendarEventAlteredInstance | CalendarEventProgenitor
/** index entry that bundles all the events with the same uid in the ownerGroup. */
export type CalendarEventUidIndexEntry = {
    ownerGroup: NonNullable<CalendarEvent["_ownerGroup"]>
    progenitor: CalendarEventProgenitor | null
    alteredInstances: Array<CalendarEventAlteredInstance>
}

export class CalendarFacade {
    constructor(
        private readonly userFacade: UserFacade,
        private readonly groupManagementFacade: GroupManagementFacade,
        // We inject cache directly because we need to delete user from it for a hack
        private readonly entityRestCache: DefaultEntityRestCache,
        private readonly noncachingEntityClient: EntityClient,
        private readonly nativePushFacade: NativePushFacade,
        private readonly operationProgressTracker: ExposedOperationProgressTracker,
        private readonly serviceExecutor: IServiceExecutor,
        private readonly cryptoFacade: CryptoFacade,
        private readonly infoMessageHandler: InfoMessageHandler,
        private readonly instancePipeline: InstancePipeline,
        // visible for testing
        public readonly cachingEntityClient: EntityClient,
    ) {
    }

    async saveImportedCalendarEvents(eventWrappers: Array<EventAlarmsTuple>, operationId: OperationId): Promise<void> {
        // it is safe to assume that all event uids are set at this time
        return this.saveCalendarEvents(eventWrappers, (percent) => this.operationProgressTracker.onProgress(operationId, percent))
    }

    /**
     * extend or one month of the given daysToEvents map
     *
     * @param month only update events that intersect days in this month
     * @param calendarInfos update events contained in these calendars
     * @param daysToEvents the old version of the map
     * @param zone the time zone to consider the event times under
     * @returns a new daysToEventsMap where the given month is updated.
     */
    async updateEventMap(
        month: CalendarTimeRange,
        calendarInfos: ReadonlyMap<Id, CalendarInfo>,
        daysToEvents: DaysToEvents,
        zone: string,
    ): Promise<DaysToEvents> {
        // Because of the timezones and all day events, we might not load an event which we need to display.
        // So we add a margin on 24 hours to be sure we load everything we need. We will filter matching
        // events anyway.
        const startId = getEventElementMinId(month.start - DAY_IN_MILLIS)
        const endId = geEventElementMaxId(month.end + DAY_IN_MILLIS)

        // We collect events from all calendars together and then replace map synchronously.
        // This is important to replace the map synchronously to not get race conditions because we load different months in parallel.
        // We could replace map more often instead of aggregating events but this would mean creating even more (cals * months) maps.
        //
        // Note: there may be issues if we get entity update before other calendars finish loading but the chance is low and we do not
        // take care of this now.

        const calendars: Array<{ long: EventWrapper[]; short: EventWrapper[] }> = []

        for (const {groupRoot, color} of calendarInfos.values()) {
            const shortEventsResult = await
                this.cachingEntityClient.loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, 200)
                const longEventsResult = await this.cachingEntityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents)

			const pendingEventListId = groupRoot.pendingEvents?.list
			let pendingEventsResult: Array<CalendarEvent> = []
			if (pendingEventListId) {
				pendingEventsResult = await this.cachingEntityClient.loadAll(CalendarEventTypeRef, pendingEventListId)
            }

            const shortEvents: Array<EventWrapper> = shortEventsResult.elements.map((e) => ({
                event: e,
                isGhost: false,
                isFeatured: false,
                isConflict: false,
                color
            }))
            const longEvents: Array<EventWrapper> = longEventsResult.map((e) => ({
                event: e,
                isGhost: false,
                isFeatured: false,
                isConflict: false,
                color
            }))
            const pendingEvents: Array<EventWrapper> = pendingEventsResult.map((e) => ({
                event: e,
                isGhost: true,
                isFeatured: false,
                isConflict: false,
                color
            }))

            for (const ev of pendingEvents) {
                const isLongEvents = isLongEvent(ev.event, zone)
                if (isLongEvents) {
                    longEvents.push(ev)
                } else {
                    shortEvents.push(ev)
                }
            }

            calendars.push({
                short: shortEvents,
                long: longEvents,
            })
        }
        const newEvents = new Map<number, Array<EventWrapper>>(Array.from(daysToEvents.entries()).map(([day, events]) => [day, events.slice()]))

        // Generate events occurrences per calendar to avoid calendars flashing in the screen
        for (const calendar of calendars) {
            this.generateEventOccurrences(newEvents, calendar.short, month, zone, true)
            this.generateEventOccurrences(newEvents, calendar.long, month, zone, false)
        }

        return newEvents
    }

    private generateEventOccurrences(
        eventMap: Map<number, EventWrapper[]>,
        events: EventWrapper[],
        range: CalendarTimeRange,
        zone: string,
        overwriteRange: boolean,
    ) {
        for (const e of events) {
            // Overrides end of range to prevent events from being truncated. Generating them until the end of the event
            // instead of the original end guarantees that the event will be fully displayed. This WILL NOT end in an
            // endless loop, because short events last a maximum of two weeks.
            const generationRange = overwriteRange ? {...range, end: e.event.endTime.getTime()} : range

            if (e.event.repeatRule) {
                addDaysForRecurringEvent(eventMap, e, generationRange, zone)
            } else {
                addDaysForEventInstance(eventMap, e, generationRange, zone)
            }
        }
    }

    /**
     * We try to create as many events as possible and only throw the error at the end.
     * If alarmNotifications are created for an event that will later fail to be created we ignore them.
     * This function does not perform any checks on the event so it should only be called internally when
     * we can be sure that those checks have already been performed.
     * @param eventsWrapper the events and alarmNotifications to be created.
     * @param onProgress
     */
    private async saveCalendarEvents(eventsWrapper: Array<EventAlarmsTuple>, onProgress: (percent: number) => Promise<void>): Promise<void> {
        let currentProgress = 10
        await onProgress(currentProgress)

        for (const {event} of eventsWrapper) {
            event.hashedUid = hashUid(assertNotNull(event.uid, "tried to save calendar event without uid."))
        }

        let eventsWithAlarms = await this.setupEventAlarms(eventsWrapper)
        currentProgress = 33
        await onProgress(currentProgress)

        const eventsWithAlarmsByEventListId = groupBy(eventsWithAlarms, (eventWrapper) => getListId(eventWrapper.event))
        let collectedAlarmNotifications: AlarmNotification[] = []
        //we have different lists for short and long events so this is 1 or 2
        const size = eventsWithAlarmsByEventListId.size
        let failed = 0
        let errors = [] as Array<TutanotaError>
        for (const [listId, eventsWithAlarmsOfOneList] of eventsWithAlarmsByEventListId) {
            let successfulEvents = eventsWithAlarmsOfOneList
            await this.cachingEntityClient
                .setupMultipleEntities(
                    listId,
                    eventsWithAlarmsOfOneList.map((e) => e.event),
                )
                .catch(
                    ofClass(SetupMultipleError, (e) => {
                        failed += e.failedInstances.length
                        errors = errors.concat(e.errors)
                        console.log(e.errors)
                        successfulEvents = eventsWithAlarmsOfOneList.filter(({event}) => !e.failedInstances.includes(event))
                    }),
                )
            const allAlarmNotificationsOfListId = successfulEvents.map((event) => event.alarmNotifications).flat()
            collectedAlarmNotifications = collectedAlarmNotifications.concat(allAlarmNotificationsOfListId)
            currentProgress += Math.floor(56 / size)
            await onProgress(currentProgress)
        }

        const pushIdentifierList = await this.cachingEntityClient.loadAll(
            PushIdentifierTypeRef,
            neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list,
        )

        if (collectedAlarmNotifications.length > 0 && pushIdentifierList.length > 0) {
            await this.sendAlarmNotifications(collectedAlarmNotifications, pushIdentifierList)
        }

        await onProgress(100)

        if (failed !== 0) {
            if (errors.some(isOfflineError)) {
                //In this case the user will not be informed about the number of failed events. We considered this is okay because it is not actionable anyways.
                throw new ConnectionError("Connection lost while saving events")
            } else {
                console.log("Could not save events. Number of failed imports: ", failed)
                throw new ImportError(errors[0], "Could not save events.", failed)
            }
        }
    }

    private async setupEventAlarms(eventsWrapper: Array<EventAlarmsTuple>) {
        const numEvents = eventsWrapper.length
        let eventsWithAlarms: Array<AlarmNotificationsPerEvent> = []
        try {
            const user = this.userFacade.getLoggedInUser()
            eventsWithAlarms = await this.saveMultipleAlarms(user, eventsWrapper)
        } catch (e) {
            if (e instanceof SetupMultipleError) {
                console.log("Saving alarms failed.", e)
                throw new ImportError(e.errors[0], "Could not save alarms.", numEvents)
            }
            throw e
        }
        for (const {event, alarmInfoIds} of eventsWithAlarms) {
            event.alarmInfos = alarmInfoIds
        }
        return eventsWithAlarms
    }

    async saveCalendarEvent(event: CalendarEvent, alarmInfos: ReadonlyArray<AlarmInfoTemplate>, oldEvent: CalendarEvent | null): Promise<void> {
        if (event._id == null) throw new Error("No id set on the event")
        if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event")
        if (event.uid == null) throw new Error("no uid set on the event")
        event.hashedUid = hashUid(event.uid)

        if (oldEvent) {
            await this.cachingEntityClient.erase(oldEvent).catch(ofClass(NotFoundError, () => console.log("could not delete old event when saving new one")))
        }

        return await this.saveCalendarEvents(
            [
                {
                    event,
                    alarms: alarmInfos,
                },
            ],
            () => Promise.resolve(),
        )
    }

    async updateCalendarEvent(event: CalendarEvent, newAlarms: ReadonlyArray<AlarmInfoTemplate>, existingEvent: CalendarEvent): Promise<void> {
        event._id = existingEvent._id
        event._ownerEncSessionKey = existingEvent._ownerEncSessionKey
        event._ownerKeyVersion = existingEvent._ownerKeyVersion
        event._permissions = existingEvent._permissions
        if (existingEvent.uid == null) throw new Error("no uid set on the existing event")
        event.uid = existingEvent.uid
        event.hashedUid = hashUid(existingEvent.uid)

        const user = this.userFacade.getLoggedInUser()

        const userAlarmIdsWithAlarmNotificationsPerEvent = await this.saveMultipleAlarms(user, [
            {
                event,
                alarms: newAlarms,
            },
        ])
        const {alarmInfoIds, alarmNotifications} = userAlarmIdsWithAlarmNotificationsPerEvent[0]
        const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
        // Remove all alarms which belongs to the current user. We need to be careful about other users' alarms.
        // Server takes care of the removed alarms,
        event.alarmInfos = existingEvent.alarmInfos.filter((a) => !isSameId(listIdPart(a), userAlarmInfoListId)).concat(alarmInfoIds)
        await this.cachingEntityClient.update(event)

        if (alarmNotifications.length > 0) {
            const pushIdentifierList = await this.cachingEntityClient.loadAll(
                PushIdentifierTypeRef,
                neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list,
            )
            await this.sendAlarmNotifications(alarmNotifications, pushIdentifierList)
        }
    }

    /**
     * get all the calendar event instances in the given time range that are generated by the given progenitor Ids
     */
    async reifyCalendarSearchResult(start: number, end: number, results: Array<IdTuple>): Promise<Array<CalendarEvent>> {
        const filteredEvents = results.filter(([calendarId, eventId]) => !isBirthdayCalendar(calendarId))
        const progenitors = await loadMultipleFromLists(CalendarEventTypeRef, this.cachingEntityClient, filteredEvents)
        const range: CalendarTimeRange = {start, end}
        return generateCalendarInstancesInRange(progenitors, range)
    }

    async addCalendar(name: string): Promise<{ user: User; group: Group }> {
        return await this.groupManagementFacade.createCalendar(name)
    }

    async deleteCalendar(groupRootId: Id): Promise<void> {
        await this.serviceExecutor.delete(CalendarService, createCalendarDeleteData({groupRootId}))
    }

    async setCalendarAsDefault(groupRootId: Id, userSettingsGroupRoot: UserSettingsGroupRoot): Promise<void> {
        userSettingsGroupRoot.defaultCalendar = groupRootId
        await this.entityRestCache.update(userSettingsGroupRoot)
    }

    async scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
        const user = this.userFacade.getLoggedInUser()

        const eventsWithAlarmInfos = await this.loadAlarmEvents()
        const alarmNotifications = flatMap(eventsWithAlarmInfos, ({event, userAlarmInfos}) =>
            userAlarmInfos.map((userAlarmInfo) => createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)),
        )

        const sessionKey = aes256RandomKey()
        await this.encryptNotificationKeyForDevices(sessionKey, alarmNotifications, [pushIdentifier])

        const encryptedNotificationsWireFormat = JSON.stringify(
            await Promise.all(
                alarmNotifications.map(async (an) => {
                    const untypedInstance = await this.instancePipeline.mapAndEncrypt(AlarmNotificationTypeRef, an, sessionKey)
                    return AttributeModel.removeNetworkDebuggingInfoIfNeeded<ClientModelUntypedInstance>(untypedInstance)
                }),
            ),
        )

        await this.nativePushFacade.scheduleAlarms(encryptedNotificationsWireFormat, uint8ArrayToBase64(bitArrayToUint8Array(sessionKey)))
    }

    /**
     * Load all events that have an alarm assigned.
     * @return: Map from concatenated ListId of an event to list of UserAlarmInfos for that event
     */
    async loadAlarmEvents(): Promise<Array<EventWithUserAlarmInfos>> {
        const alarmInfoList = this.userFacade.getLoggedInUser().alarmInfoList

        if (!alarmInfoList) {
            console.warn("No alarmInfo list on user")
            return []
        }

        const userAlarmInfos = await this.cachingEntityClient.loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms)
        // Group referenced event ids by list id so we can load events of one list in one request.
        const listIdToElementIds = groupByAndMapUniquely(
            userAlarmInfos,
            (userAlarmInfo) => userAlarmInfo.alarmInfo.calendarRef.listId,
            (userAlarmInfo) => userAlarmInfo.alarmInfo.calendarRef.elementId,
        )
        // we group by the full concatenated list id
        // because there might be collisions between event element ids due to being custom ids
        const eventIdToAlarmInfos = groupBy(userAlarmInfos, (userAlarmInfo) => getEventIdFromUserAlarmInfo(userAlarmInfo).join(""))
        const calendarEvents = await promiseMap(listIdToElementIds.entries(), ([listId, elementIds]) => {
            return this.cachingEntityClient.loadMultiple(CalendarEventTypeRef, listId, Array.from(elementIds)).catch((error) => {
                // handle NotAuthorized here because user could have been removed from group.
                if (error instanceof NotAuthorizedError) {
                    console.warn("NotAuthorized when downloading alarm events", error)
                    return []
                }

                throw error
            })
        })
        return calendarEvents.flat().map((event) => {
            return {
                event,
                userAlarmInfos: getFromMap(eventIdToAlarmInfos, getLetId(event).join(""), () => []),
            }
        })
    }

    /**
     * Queries the events using the uid index. The index is stored per calendar, so we have to go through all calendars
     * to find the matching events. We currently only need this for calendar event updates and for that we don't want to
     * look into shared calendars.
     *
     * @returns {CalendarEventUidIndexEntry}
     */
    async getEventsByUid(uid: string, cacheMode: CachingMode = CachingMode.Cached): Promise<CalendarEventUidIndexEntry | null> {
        const {memberships} = this.userFacade.getLoggedInUser()
        const entityClient = this.getEntityClient(cacheMode)
        for (const membership of memberships) {
            if (membership.groupType !== GroupType.Calendar) continue
            try {
                const groupRoot = await this.cachingEntityClient.load(CalendarGroupRootTypeRef, membership.group)
                if (groupRoot.index == null) {
                    continue
                }

                const indexEntry: CalendarEventUidIndex = await entityClient.load<CalendarEventUidIndex>(CalendarEventUidIndexTypeRef, [
                    groupRoot.index.list,
                    uint8arrayToCustomId(hashUid(uid)),
                ])

                const progenitor: CalendarEventProgenitor | null = await loadProgenitorFromIndexEntry(entityClient, indexEntry)
                const alteredInstances: Array<CalendarEventAlteredInstance> = await loadAlteredInstancesFromIndexEntry(entityClient, indexEntry)
                return {
                    progenitor,
                    alteredInstances,
                    ownerGroup: assertNotNull(indexEntry._ownerGroup, "ownergroup on index entry was null!"),
                }
            } catch (e) {
                if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
                    continue
                }
                throw e
            }
        }

        return null
    }

    private async sendAlarmNotifications(alarmNotifications: Array<AlarmNotification>, pushIdentifierList: Array<PushIdentifier>): Promise<void> {
        const notificationSessionKey = aes256RandomKey()
        return this.encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList).then(async () => {
            const requestEntity = createAlarmServicePost({
                alarmNotifications,
            })
            try {
                await this.serviceExecutor.post(AlarmService, requestEntity, {sessionKey: notificationSessionKey})
            } catch (e) {
                if (e instanceof PayloadTooLargeError) {
                    return this.infoMessageHandler.onInfoMessage({
                        translationKey: "calendarAlarmsTooBigError_msg",
                        args: {},
                    })
                } else {
                    throw e
                }
            }
        })
    }

    private async encryptNotificationKeyForDevices(
        notificationSessionKey: AesKey,
        alarmNotifications: Array<AlarmNotification>,
        pushIdentifierList: Array<PushIdentifier>,
    ): Promise<void> {
        // PushID SK ->* Notification SK -> alarm fields
        const maybeEncSessionKeys = await promiseMap(pushIdentifierList, async (identifier) => {
            const pushIdentifierSk = await this.cryptoFacade.resolveSessionKey(identifier)
            if (pushIdentifierSk) {
                const pushIdentifierSessionEncSessionKey = encryptKey(pushIdentifierSk, notificationSessionKey)
                return {
                    identifierId: identifier._id,
                    pushIdentifierSessionEncSessionKey,
                }
            } else {
                return null
            }
        }) // rate limiting against blocking while resolving session keys (neccessary)
        const encSessionKeys = maybeEncSessionKeys.filter(isNotNull)

        for (let notification of alarmNotifications) {
            notification.notificationSessionKeys = encSessionKeys.map((esk) => {
                return createNotificationSessionKey({
                    pushIdentifier: esk.identifierId,
                    pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey,
                })
            })
        }
    }

    private async saveMultipleAlarms(
        user: User,
        eventsWrapper: Array<{
            event: CalendarEvent
            alarms: ReadonlyArray<AlarmInfoTemplate>
        }>,
    ): Promise<Array<AlarmNotificationsPerEvent>> {
        const userAlarmInfosAndNotificationsPerEvent: Array<{
            event: CalendarEvent
            userAlarmInfoAndNotification: Array<{
                alarm: UserAlarmInfo
                alarmNotification: AlarmNotification
            }>
        }> = []
        const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
        const ownerGroup = user.userGroup.group

        for (const {event, alarms} of eventsWrapper) {
            const userAlarmInfoAndNotification: Array<{
                alarm: UserAlarmInfo
                alarmNotification: AlarmNotification
            }> = []
            const calendarRef = createCalendarEventRef({
                listId: listIdPart(event._id),
                elementId: elementIdPart(event._id),
            })

            for (const alarmInfo of alarms) {
                const userAlarmInfo = createUserAlarmInfo({
                    _ownerGroup: ownerGroup,
                    alarmInfo: createAlarmInfo({
                        alarmIdentifier: alarmInfo.alarmIdentifier,
                        trigger: alarmInfo.trigger,
                        calendarRef: calendarRef,
                    }),
                })

                const alarmNotification = createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)
                userAlarmInfoAndNotification.push({
                    alarm: userAlarmInfo,
                    alarmNotification,
                })
            }

            userAlarmInfosAndNotificationsPerEvent.push({
                event,
                userAlarmInfoAndNotification,
            })
        }

        const allAlarms = userAlarmInfosAndNotificationsPerEvent.flatMap(({userAlarmInfoAndNotification}) =>
            userAlarmInfoAndNotification.map(({alarm}) => alarm),
        )

        const alarmIds: Array<Id> = await this.cachingEntityClient.setupMultipleEntities(userAlarmInfoListId, allAlarms)
        let currentIndex = 0
        return userAlarmInfosAndNotificationsPerEvent.map(({event, userAlarmInfoAndNotification}) => {
            return {
                event,
                alarmInfoIds: userAlarmInfoAndNotification.map(() => [userAlarmInfoListId, alarmIds[currentIndex++]]),
                alarmNotifications: userAlarmInfoAndNotification.map(({alarmNotification}) => alarmNotification),
            }
        })
    }

    private getEntityClient(cacheMode: CachingMode): EntityClient {
        if (cacheMode === CachingMode.Cached) {
            return this.cachingEntityClient
        } else {
            return this.noncachingEntityClient
        }
    }

    removeEventFromCache(listId: Id, eventId: Id): Promise<void> {
        return this.entityRestCache.deleteFromCacheIfExists(CalendarEventTypeRef, listId, eventId)
    }
}

export type EventWithUserAlarmInfos = {
    event: CalendarEvent
    userAlarmInfos: Array<UserAlarmInfo>
}

function createAlarmNotificationForEvent(event: CalendarEvent, alarmInfo: AlarmInfo, userId: Id): AlarmNotification {
    return createAlarmNotification({
        alarmInfo: createAlarmInfoForAlarmInfo(alarmInfo),
        repeatRule: event.repeatRule && createRepeatRuleForCalendarRepeatRule(event.repeatRule),
        notificationSessionKeys: [],
        operation: OperationType.CREATE,
        summary: event.summary,
        eventStart: event.startTime,
        eventEnd: event.endTime,
        user: userId,
    })
}

function createAlarmInfoForAlarmInfo(alarmInfo: AlarmInfo): AlarmInfo {
    const calendarRef = createCalendarEventRef({
        elementId: alarmInfo.calendarRef.elementId,
        listId: alarmInfo.calendarRef.listId,
    })
    return createAlarmInfo({
        alarmIdentifier: alarmInfo.alarmIdentifier,
        trigger: alarmInfo.trigger,
        calendarRef,
    })
}

function createRepeatRuleForCalendarRepeatRule(calendarRepeatRule: CalendarRepeatRule): RepeatRule {
    return createRepeatRule({
        endType: calendarRepeatRule.endType,
        endValue: calendarRepeatRule.endValue,
        frequency: calendarRepeatRule.frequency,
        interval: calendarRepeatRule.interval,
        timeZone: calendarRepeatRule.timeZone,
        excludedDates: calendarRepeatRule.excludedDates.map(({date}) => createDateWrapper({date})),
        advancedRules: calendarRepeatRule.advancedRules,
    })
}

function getEventIdFromUserAlarmInfo(userAlarmInfo: UserAlarmInfo): IdTuple {
    return [userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId]
}

/** to make lookup on the encrypted event uid possible, we hash it and use that value as a key. */
function hashUid(uid: string): Uint8Array {
    return sha256Hash(stringToUtf8Uint8Array(uid))
}

/**
 * sort a list of events by recurrence id, sorting events without a recurrence id to the front.
 * @param arr the array of events to sort
 * exported for testing.
 */
export function sortByRecurrenceId(arr: Array<CalendarEventAlteredInstance>): void {
    arr.sort((a, b) => (a.recurrenceId.getTime() < b.recurrenceId.getTime() ? -1 : 1))
}

async function loadAlteredInstancesFromIndexEntry(entityClient: EntityClient, indexEntry: CalendarEventUidIndex): Promise<Array<CalendarEventAlteredInstance>> {
    if (indexEntry.alteredInstances.length === 0) return []
    const isAlteredInstance = (e: CalendarEventAlteredInstance): e is CalendarEventAlteredInstance => e.recurrenceId != null && e.uid != null
    const indexedEvents = await loadMultipleFromLists(CalendarEventTypeRef, entityClient, indexEntry.alteredInstances)
    const alteredInstances: Array<CalendarEventAlteredInstance> = indexedEvents.filter(isAlteredInstance)
    if (indexedEvents.length > alteredInstances.length) {
        console.warn("there were altered instances indexed that do not have a recurrence Id or uid!")
    }
    sortByRecurrenceId(alteredInstances)
    return alteredInstances
}

async function loadProgenitorFromIndexEntry(entityClient: EntityClient, indexEntry: CalendarEventUidIndex): Promise<CalendarEventProgenitor | null> {
    if (indexEntry.progenitor == null) return null
    const loadedProgenitor = await entityClient.load<CalendarEvent>(CalendarEventTypeRef, indexEntry.progenitor)
    if (loadedProgenitor.recurrenceId != null) {
        throw new ProgrammingError(`loaded progenitor has a recurrence Id! ${loadedProgenitor.recurrenceId.toISOString()}`)
    }
    assertNotNull(loadedProgenitor.uid, "loaded progenitor has no UID")
    return loadedProgenitor as CalendarEventProgenitor
}

export const enum CachingMode {
    Cached,
    Bypass,
}

export type AlarmInfoTemplate = Pick<AlarmInfo, "alarmIdentifier" | "trigger">
