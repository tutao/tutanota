import { assertWorkerOrNode } from "../../../common/Env.js"
import type { AlarmInfo, AlarmNotification, Group, PushIdentifier, RepeatRule, User, UserAlarmInfo } from "../../../entities/sys/TypeRefs.js"
import {
	AlarmServicePostTypeRef,
	createAlarmInfo,
	createAlarmNotification,
	createAlarmServicePost,
	createCalendarEventRef,
	createDateWrapper,
	createNotificationSessionKey,
	createRepeatRule,
	createUserAlarmInfo,
	GroupTypeRef,
	PushIdentifierTypeRef,
	UserAlarmInfoTypeRef,
	UserTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import {
	assertNotNull,
	downcast,
	flat,
	flatMap,
	getFromMap,
	groupBy,
	groupByAndMapUniquely,
	isNotNull,
	neverNull,
	ofClass,
	promiseMap,
	stringToUtf8Uint8Array,
} from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { GroupType, OperationType } from "../../../common/TutanotaConstants.js"
import type { CalendarEvent, CalendarEventUidIndex, CalendarRepeatRule } from "../../../entities/tutanota/TypeRefs.js"
import {
	CalendarEventTypeRef,
	CalendarEventUidIndexTypeRef,
	CalendarGroupRootTypeRef,
	createCalendarDeleteData,
	createUserAreaGroupPostData,
} from "../../../entities/tutanota/TypeRefs.js"
import { DefaultEntityRestCache } from "../../rest/DefaultEntityRestCache.js"
import { ConnectionError, NotAuthorizedError, NotFoundError, PayloadTooLargeError } from "../../../common/error/RestError.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { elementIdPart, getLetId, getListId, isSameId, listIdPart, uint8arrayToCustomId } from "../../../common/utils/EntityUtils.js"
import { GroupManagementFacade } from "./GroupManagementFacade.js"
import { SetupMultipleError } from "../../../common/error/SetupMultipleError.js"
import { ImportError } from "../../../common/error/ImportError.js"
import { aes128RandomKey, encryptKey, sha256Hash } from "@tutao/tutanota-crypto"
import { InstanceMapper } from "../../crypto/InstanceMapper.js"
import { TutanotaError } from "../../../common/error/TutanotaError.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { AlarmService } from "../../../entities/sys/Services.js"
import { CalendarService } from "../../../entities/tutanota/Services.js"
import { resolveTypeReference } from "../../../common/EntityFunctions.js"
import { UserFacade } from "../UserFacade.js"
import { isOfflineError } from "../../../common/utils/ErrorCheckUtils.js"
import { EncryptedAlarmNotification } from "../../../../native/common/EncryptedAlarmNotification.js"
import { NativePushFacade } from "../../../../native/common/generatedipc/NativePushFacade.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../../../../gui/InfoMessageHandler.js"

assertWorkerOrNode()

type AlarmNotificationsPerEvent = {
	event: CalendarEvent
	alarmInfoIds: IdTuple[]
	alarmNotifications: AlarmNotification[]
}

export class CalendarFacade {
	// visible for testing
	readonly entityClient: EntityClient

	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagementFacade: GroupManagementFacade,
		// We inject cache directly because we need to delete user from it for a hack
		private readonly entityRestCache: DefaultEntityRestCache,
		private readonly nativePushFacade: NativePushFacade,
		private readonly operationProgressTracker: ExposedOperationProgressTracker,
		private readonly instanceMapper: InstanceMapper,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly infoMessageHandler: InfoMessageHandler,
	) {
		this.entityClient = new EntityClient(this.entityRestCache)
	}

	async saveImportedCalendarEvents(
		eventsWrapper: Array<{
			event: CalendarEvent
			alarms: Array<AlarmInfo>
		}>,
		operationId: OperationId,
	): Promise<void> {
		// it is safe to assume that all event uids are set here
		return this.saveCalendarEvents(eventsWrapper, (percent) => this.operationProgressTracker.onProgress(operationId, percent))
	}

	/**
	 * We try to create as many events as possible and only throw the error at the end.
	 * If alarmNotifications are created for an event that will later fail to be created we ignore them.
	 * This function does not perform any checks on the event so it should only be called internally when
	 * we can be sure that those checks have already been performed.
	 * @param eventsWrapper the events and alarmNotifications to be created.
	 * @param onProgress
	 */
	private async saveCalendarEvents(
		eventsWrapper: Array<{
			event: CalendarEvent
			alarms: ReadonlyArray<AlarmInfo>
		}>,
		onProgress: (percent: number) => Promise<void>,
	): Promise<void> {
		let currentProgress = 10
		await onProgress(currentProgress)

		for (const { event } of eventsWrapper) {
			event.hashedUid = hashUid(assertNotNull(event.uid, "tried to save calendar event without uid."))
		}

		const user = this.userFacade.getLoggedInUser()

		const numEvents = eventsWrapper.length
		let eventsWithAlarms: Array<AlarmNotificationsPerEvent>
		try {
			eventsWithAlarms = await this.saveMultipleAlarms(user, eventsWrapper)
		} catch (e) {
			if (e instanceof SetupMultipleError) {
				console.log("Saving alarms failed.", e)
				throw new ImportError(e.errors[0], "Could not save alarms.", numEvents)
			}
			throw e
		}
		eventsWithAlarms.forEach(({ event, alarmInfoIds }) => (event.alarmInfos = alarmInfoIds))
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
			await this.entityClient
				.setupMultipleEntities(
					listId,
					eventsWithAlarmsOfOneList.map((e) => e.event),
				)
				.catch(
					ofClass(SetupMultipleError, (e) => {
						failed += e.failedInstances.length
						errors = errors.concat(e.errors)
						console.log(e.errors)
						successfulEvents = eventsWithAlarmsOfOneList.filter(({ event }) => !e.failedInstances.includes(event))
					}),
				)
			const allAlarmNotificationsOfListId = flat(successfulEvents.map((event) => event.alarmNotifications))
			collectedAlarmNotifications = collectedAlarmNotifications.concat(allAlarmNotificationsOfListId)
			currentProgress += Math.floor(56 / size)
			await onProgress(currentProgress)
		}

		const pushIdentifierList = await this.entityClient.loadAll(PushIdentifierTypeRef, neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list)

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

	async saveCalendarEvent(event: CalendarEvent, alarmInfos: ReadonlyArray<AlarmInfo>, oldEvent: CalendarEvent | null): Promise<void> {
		if (event._id == null) throw new Error("No id set on the event")
		if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event")
		if (event.uid == null) throw new Error("no uid set on the event")
		event.hashedUid = hashUid(event.uid)

		if (oldEvent) {
			await this.entityClient.erase(oldEvent).catch(ofClass(NotFoundError, () => console.log("could not delete old event when saving new one")))
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

	async updateCalendarEvent(event: CalendarEvent, newAlarms: ReadonlyArray<AlarmInfo>, existingEvent: CalendarEvent): Promise<void> {
		event._id = existingEvent._id
		event._ownerEncSessionKey = existingEvent._ownerEncSessionKey
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
		const { alarmInfoIds, alarmNotifications } = userAlarmIdsWithAlarmNotificationsPerEvent[0]
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
		// Remove all alarms which belongs to the current user. We need to be careful about other users' alarms.
		// Server takes care of the removed alarms,
		event.alarmInfos = existingEvent.alarmInfos.filter((a) => !isSameId(listIdPart(a), userAlarmInfoListId)).concat(alarmInfoIds)
		await this.entityClient.update(event)

		if (alarmNotifications.length > 0) {
			const pushIdentifierList = await this.entityClient.loadAll(
				PushIdentifierTypeRef,
				neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list,
			)
			await this.sendAlarmNotifications(alarmNotifications, pushIdentifierList)
		}
	}

	async addCalendar(name: string): Promise<{ user: User; group: Group }> {
		const groupData = await this.groupManagementFacade.generateUserAreaGroupData(name)
		const postData = createUserAreaGroupPostData({
			groupData,
		})
		const returnData = await this.serviceExecutor.post(CalendarService, postData)
		const group = await this.entityClient.load(GroupTypeRef, returnData.group)
		// remove the user from the cache before loading it again to make sure we get the latest version.
		// otherwise we might not see the new calendar in case it is created at login and the websocket is not connected yet
		const userId = this.userFacade.getLoggedInUser()._id

		await this.entityRestCache.deleteFromCacheIfExists(UserTypeRef, null, userId)

		const user = await this.entityClient.load(UserTypeRef, userId)
		this.userFacade.updateUser(user)
		return {
			user,
			group,
		}
	}

	async deleteCalendar(groupRootId: Id): Promise<void> {
		await this.serviceExecutor.delete(CalendarService, createCalendarDeleteData({ groupRootId }))
	}

	async scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
		const user = this.userFacade.getLoggedInUser()

		const eventsWithAlarmInfos = await this.loadAlarmEvents()
		const alarmNotifications = flatMap(eventsWithAlarmInfos, ({ event, userAlarmInfos }) =>
			userAlarmInfos.map((userAlarmInfo) => createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)),
		)
		// Theoretically we don't need to encrypt anything if we are sending things locally but we use already encrypted data on the client
		// to store alarms securely.
		const notificationKey = aes128RandomKey()
		await this.encryptNotificationKeyForDevices(notificationKey, alarmNotifications, [pushIdentifier])
		const requestEntity = createAlarmServicePost({
			alarmNotifications,
		})
		const AlarmServicePostTypeModel = await resolveTypeReference(AlarmServicePostTypeRef)
		const encEntity = await this.instanceMapper.encryptAndMapToLiteral(AlarmServicePostTypeModel, requestEntity, notificationKey)
		const encryptedAlarms: EncryptedAlarmNotification[] = downcast(encEntity).alarmNotifications
		await this.nativePushFacade.scheduleAlarms(encryptedAlarms)
	}

	/**
	 * Load all events that have an alarm assigned.
	 * @return: Map from concatenated ListId of an event to list of UserAlarmInfos for that event
	 */
	async loadAlarmEvents(): Promise<Array<EventWithAlarmInfos>> {
		const alarmInfoList = this.userFacade.getLoggedInUser().alarmInfoList

		if (!alarmInfoList) {
			console.warn("No alarmInfo list on user")
			return []
		}

		const userAlarmInfos = await this.entityClient.loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms)
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
			return this.entityClient.loadMultiple(CalendarEventTypeRef, listId, Array.from(elementIds)).catch((error) => {
				// handle NotAuthorized here because user could have been removed from group.
				if (error instanceof NotAuthorizedError) {
					console.warn("NotAuthorized when downloading alarm events", error)
					return []
				}

				throw error
			})
		})
		return flat(calendarEvents).map((event) => {
			return {
				event,
				userAlarmInfos: getFromMap(eventIdToAlarmInfos, getLetId(event).join(""), () => []),
			}
		})
	}

	/**
	 * Queries the event using the uid index. The index is stored per calendar so we have to go through all calendars to find matching event.
	 * We currently only need this for calendar event updates and for that we don't want to look into shared calendars.
	 */
	async getEventByUid(uid: string): Promise<CalendarEvent | null> {
		const calendarMemberships = this.userFacade.getLoggedInUser().memberships.filter((m) => m.groupType === GroupType.Calendar && m.capability == null)
		for (const membership of calendarMemberships) {
			let indexEntry
			try {
				const groupRoot = await this.entityClient.load(CalendarGroupRootTypeRef, membership.group)
				if (groupRoot.index == null) {
					continue
				}
				indexEntry = await this.entityClient.load<CalendarEventUidIndex>(CalendarEventUidIndexTypeRef, [
					groupRoot.index.list,
					uint8arrayToCustomId(hashUid(uid)),
				])
				return await this.entityClient.load<CalendarEvent>(CalendarEventTypeRef, indexEntry.calendarEvent)
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
		const notificationSessionKey = aes128RandomKey()
		return this.encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList).then(async () => {
			const requestEntity = createAlarmServicePost({
				alarmNotifications,
			})
			try {
				await this.serviceExecutor.post(AlarmService, requestEntity, { sessionKey: notificationSessionKey })
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
		notificationSessionKey: Aes128Key,
		alarmNotifications: Array<AlarmNotification>,
		pushIdentifierList: Array<PushIdentifier>,
	): Promise<void> {
		// PushID SK ->* Notification SK -> alarm fields
		const maybeEncSessionKeys = await promiseMap(pushIdentifierList, async (identifier) => {
			const pushIdentifierSk = await this.cryptoFacade.resolveSessionKeyForInstance(identifier)
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
			alarms: ReadonlyArray<AlarmInfo>
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

		for (const { event, alarms } of eventsWrapper) {
			const userAlarmInfoAndNotification: Array<{
				alarm: UserAlarmInfo
				alarmNotification: AlarmNotification
			}> = []
			const calendarRef = createCalendarEventRef({
				listId: listIdPart(event._id),
				elementId: elementIdPart(event._id),
			})

			for (const alarmInfo of alarms) {
				const userAlarmInfo = createUserAlarmInfo()
				userAlarmInfo._ownerGroup = ownerGroup
				userAlarmInfo.alarmInfo = createAlarmInfo()
				userAlarmInfo.alarmInfo.alarmIdentifier = alarmInfo.alarmIdentifier
				userAlarmInfo.alarmInfo.trigger = alarmInfo.trigger
				userAlarmInfo.alarmInfo.calendarRef = calendarRef
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

		const allAlarms = flat(
			userAlarmInfosAndNotificationsPerEvent.map(({ userAlarmInfoAndNotification }) => userAlarmInfoAndNotification.map(({ alarm }) => alarm)),
		)

		const alarmIds: Array<Id> = await this.entityClient.setupMultipleEntities(userAlarmInfoListId, allAlarms)
		let currentIndex = 0
		return userAlarmInfosAndNotificationsPerEvent.map(({ event, userAlarmInfoAndNotification }) => {
			return {
				event,
				alarmInfoIds: userAlarmInfoAndNotification.map(() => [userAlarmInfoListId, alarmIds[currentIndex++]]),
				alarmNotifications: userAlarmInfoAndNotification.map(({ alarmNotification }) => alarmNotification),
			}
		})
	}
}

export type EventWithAlarmInfos = {
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
	const calendarRef = Object.assign(createCalendarEventRef(), {
		elementId: alarmInfo.calendarRef.elementId,
		listId: alarmInfo.calendarRef.listId,
	})
	return Object.assign(createAlarmInfo(), {
		alarmIdentifier: alarmInfo.alarmIdentifier,
		trigger: alarmInfo.trigger,
		calendarRef,
	})
}

function createRepeatRuleForCalendarRepeatRule(calendarRepeatRule: CalendarRepeatRule): RepeatRule {
	return Object.assign(createRepeatRule(), {
		endType: calendarRepeatRule.endType,
		endValue: calendarRepeatRule.endValue,
		frequency: calendarRepeatRule.frequency,
		interval: calendarRepeatRule.interval,
		timeZone: calendarRepeatRule.timeZone,
		excludedDates: calendarRepeatRule.excludedDates.map(({ date }) => createDateWrapper({ date })),
	})
}

function getEventIdFromUserAlarmInfo(userAlarmInfo: UserAlarmInfo): IdTuple {
	return [userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId]
}

/** to make lookup on the encrypted event uid possible, we hash it and use that value as a key. */
function hashUid(uid: string): Uint8Array {
	return sha256Hash(stringToUtf8Uint8Array(uid))
}
