import {assertWorkerOrNode} from "../../common/Env"
import type {AlarmInfo, AlarmNotification, Group, PushIdentifier, RepeatRule, User, UserAlarmInfo} from "../../entities/sys/TypeRefs.js"
import {
	AlarmServicePostTypeRef,
	createAlarmInfo,
	createAlarmNotification,
	createAlarmServicePost,
	createCalendarEventRef,
	createNotificationSessionKey,
	createRepeatRule,
	createUserAlarmInfo,
	GroupTypeRef,
	PushIdentifierTypeRef,
	UserAlarmInfoTypeRef,
	UserTypeRef
} from "../../entities/sys/TypeRefs.js"
import type {LoginFacadeImpl} from "./LoginFacade"
import {
	asyncFindAndMap,
	downcast,
	flat,
	flatMap,
	getFromMap,
	groupBy,
	groupByAndMapUniquely,
	isNotNull,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	stringToUtf8Uint8Array,
} from "@tutao/tutanota-utils"
import {CryptoFacade} from "../crypto/CryptoFacade"
import {GroupType, OperationType} from "../../common/TutanotaConstants"
import type {CalendarEvent, CalendarEventUidIndex, CalendarRepeatRule} from "../../entities/tutanota/TypeRefs.js"
import {
	CalendarEventTypeRef,
	CalendarEventUidIndexTypeRef,
	CalendarGroupRootTypeRef,
	createCalendarDeleteData,
	createUserAreaGroupPostData
} from "../../entities/tutanota/TypeRefs.js"
import {EntityRestCache} from "../rest/EntityRestCache"
import {ConnectionError, NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {EntityClient} from "../../common/EntityClient"
import {elementIdPart, getLetId, getListId, isSameId, listIdPart, uint8arrayToCustomId} from "../../common/utils/EntityUtils"
import {Request} from "../../common/MessageDispatcher"
import {GroupManagementFacadeImpl} from "./GroupManagementFacade"
import type {NativeInterface} from "../../../native/common/NativeInterface"
import type {WorkerImpl} from "../WorkerImpl"
import {SetupMultipleError} from "../../common/error/SetupMultipleError"
import {ImportError} from "../../common/error/ImportError"
import {aes128RandomKey, encryptKey, sha256Hash} from "@tutao/tutanota-crypto"
import {InstanceMapper} from "../crypto/InstanceMapper"
import {TutanotaError} from "../../common/error/TutanotaError"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {AlarmService} from "../../entities/sys/Services"
import {CalendarService} from "../../entities/tutanota/Services"
import {resolveTypeReference} from "../../common/EntityFunctions"

assertWorkerOrNode()

function hashUid(uid: string): Uint8Array {
	return sha256Hash(stringToUtf8Uint8Array(uid))
}

type AlarmNotificationsPerEvent = {
	event: CalendarEvent
	alarmInfoIds: IdTuple[]
	alarmNotifications: AlarmNotification[]
}

export class CalendarFacade {
	_loginFacade: LoginFacadeImpl
	_groupManagementFacade: GroupManagementFacadeImpl
	_entityRestCache: EntityRestCache
	_entityClient: EntityClient
	_worker: WorkerImpl
	_native: NativeInterface
	_instanceMapper: InstanceMapper

	constructor(
		loginFacade: LoginFacadeImpl,
		groupManagementFacade: GroupManagementFacadeImpl,
		entityRestCache: EntityRestCache,
		native: NativeInterface,
		worker: WorkerImpl,
		instanceMapper: InstanceMapper,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
	) {
		this._loginFacade = loginFacade
		this._groupManagementFacade = groupManagementFacade
		this._entityRestCache = entityRestCache
		this._entityClient = new EntityClient(entityRestCache)
		this._native = native
		this._worker = worker
		this._instanceMapper = instanceMapper
	}

	hashEventUid(event: CalendarEvent) {
		event.hashedUid = event.uid ? hashUid(event.uid) : null
	}

	async saveImportedCalendarEvents(
		eventsWrapper: Array<{
			event: CalendarEvent
			alarms: Array<AlarmInfo>
		}>,
	): Promise<void> {
		// it is safe to assume that all event uids are set here
		eventsWrapper.forEach(({event}) => this.hashEventUid(event))
		return this._saveCalendarEvents(eventsWrapper)
	}

	/**
	 * We try to create as many events as possible and only throw the error at the end.
	 * If alarmNotifications are created for an event that will later fail to be created we ignore them.
	 * This function does not perform any checks on the event so it should only be called internally when
	 * we can be sure that those checks have already been performed.
	 * @param eventsWrapper the events and alarmNotifications to be created.
	 */
	async _saveCalendarEvents(
		eventsWrapper: Array<{
			event: CalendarEvent
			alarms: Array<AlarmInfo>
		}>,
	): Promise<void> {
		let currentProgress = 10
		await this._worker.sendProgress(currentProgress)

		const user = this._loginFacade.getLoggedInUser()

		const numEvents = eventsWrapper.length
		const eventsWithAlarms: Array<AlarmNotificationsPerEvent> = await this._saveMultipleAlarms(user, eventsWrapper).catch(
			ofClass(SetupMultipleError, e => {
				if (e.errors.some(error => error instanceof ConnectionError)) {
					//In this case the user will not be informed about the number of failed alarms. We considered this is okay because it is not actionable anyways.
					throw new ConnectionError("Connection lost while saving alarms")
				} else {
					throw new ImportError("Could not save alarms.", numEvents)
				}
			}),
		)
		eventsWithAlarms.forEach(({event, alarmInfoIds}) => (event.alarmInfos = alarmInfoIds))
		currentProgress = 33
		await this._worker.sendProgress(currentProgress)
		const eventsWithAlarmsByEventListId = groupBy(eventsWithAlarms, eventWrapper => getListId(eventWrapper.event))
		let collectedAlarmNotifications: AlarmNotification[] = []
		//we have different lists for short and long events so this is 1 or 2
		const size = eventsWithAlarmsByEventListId.size
		let failed = 0
		let errors = [] as Array<TutanotaError>

		for (const [listId, eventsWithAlarmsOfOneList] of eventsWithAlarmsByEventListId) {
			let successfulEvents = eventsWithAlarmsOfOneList
			await this._entityClient
					  .setupMultipleEntities(
						  listId,
						  eventsWithAlarmsOfOneList.map(e => e.event),
					  )
					  .catch(
						  ofClass(SetupMultipleError, e => {
							  failed += e.failedInstances.length
							  errors = errors.concat(e.errors)
							  successfulEvents = eventsWithAlarmsOfOneList.filter(({event}) => !e.failedInstances.includes(event))
						  }),
					  )
			const allAlarmNotificationsOfListId = flat(successfulEvents.map(event => event.alarmNotifications))
			collectedAlarmNotifications = collectedAlarmNotifications.concat(allAlarmNotificationsOfListId)
			currentProgress += Math.floor(56 / size)
			await this._worker.sendProgress(currentProgress)
		}

		const pushIdentifierList = await this._entityClient.loadAll(
			PushIdentifierTypeRef,
			neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list,
		)

		if (collectedAlarmNotifications.length > 0 && pushIdentifierList.length > 0) {
			await this._sendAlarmNotifications(collectedAlarmNotifications, pushIdentifierList)
		}

		await this._worker.sendProgress(100)

		if (failed !== 0) {
			if (errors.some(error => error instanceof ConnectionError)) {
				//In this case the user will not be informed about the number of failed events. We considered this is okay because it is not actionable anyways.
				throw new ConnectionError("Connection lost while saving events")
			} else {
				throw new ImportError("Could not save events.", failed)
			}
		}
	}

	async saveCalendarEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, oldEvent: CalendarEvent | null): Promise<void> {
		if (event._id == null) throw new Error("No id set on the event")
		if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event")
		if (event.uid == null) throw new Error("no uid set on the event")
		this.hashEventUid(event)

		if (oldEvent) {
			await this._entityClient.erase(oldEvent).catch(ofClass(NotFoundError, noOp))
		}

		return await this._saveCalendarEvents([
			{
				event,
				alarms: alarmInfos,
			},
		])
	}

	async updateCalendarEvent(event: CalendarEvent, newAlarms: Array<AlarmInfo>, existingEvent: CalendarEvent): Promise<void> {
		event._id = existingEvent._id
		event._ownerEncSessionKey = existingEvent._ownerEncSessionKey
		event._permissions = existingEvent._permissions

		const user = this._loginFacade.getLoggedInUser()

		const userAlarmIdsWithAlarmNotificationsPerEvent = await this._saveMultipleAlarms(user, [
			{
				event,
				alarms: newAlarms,
			},
		])
		const {alarmInfoIds, alarmNotifications} = userAlarmIdsWithAlarmNotificationsPerEvent[0]
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
		// Remove all alarms which belongs to the current user. We need to be careful about other users' alarms.
		// Server takes care of the removed alarms,
		event.alarmInfos = existingEvent.alarmInfos.filter(a => !isSameId(listIdPart(a), userAlarmInfoListId)).concat(alarmInfoIds)
		await this._entityClient.update(event)

		if (alarmNotifications.length > 0) {
			const pushIdentifierList = await this._entityClient.loadAll(
				PushIdentifierTypeRef,
				neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list,
			)
			await this._sendAlarmNotifications(alarmNotifications, pushIdentifierList)
		}
	}

	_sendAlarmNotifications(alarmNotifications: Array<AlarmNotification>, pushIdentifierList: Array<PushIdentifier>): Promise<void> {
		const notificationSessionKey = aes128RandomKey()
		return this._encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList).then(() => {
			const requestEntity = createAlarmServicePost({
				alarmNotifications,
			})
			return this.serviceExecutor.post(AlarmService, requestEntity, {sessionKey: notificationSessionKey})
		})
	}

	_encryptNotificationKeyForDevices(
		notificationSessionKey: Aes128Key,
		alarmNotifications: Array<AlarmNotification>,
		pushIdentifierList: Array<PushIdentifier>,
	): Promise<void> {
		// PushID SK ->* Notification SK -> alarm fields
		return promiseMap(pushIdentifierList, async identifier => {
			return this.cryptoFacade.resolveSessionKeyForInstance(identifier).then(pushIdentifierSk => {
				if (pushIdentifierSk) {
					const pushIdentifierSessionEncSessionKey = encryptKey(pushIdentifierSk, notificationSessionKey)
					return {
						identifierId: identifier._id,
						pushIdentifierSessionEncSessionKey,
					}
				} else {
					return null
				}
			})
		}) // rate limiting against blocking while resolving session keys (neccessary)
			.then(maybeEncSessionKeys => {
				const encSessionKeys = maybeEncSessionKeys.filter(isNotNull)

				for (let notification of alarmNotifications) {
					notification.notificationSessionKeys = encSessionKeys.map(esk => {
						return createNotificationSessionKey({
							pushIdentifier: esk.identifierId,
							pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey,
						})
					})
				}
			})
	}

	async addCalendar(name: string,): Promise<{user: User, group: Group}> {
		const groupData = await this._groupManagementFacade.generateUserAreaGroupData(name)
		const postData = createUserAreaGroupPostData({
			groupData,
		})
		const returnData = await this.serviceExecutor.post(CalendarService, postData)
		const group = await this._entityClient.load(GroupTypeRef, returnData.group)
		// remove the user from the cache before loading it again to make sure we get the latest version.
		// otherwise we might not see the new calendar in case it is created at login and the websocket is not connected yet
		const userId = this._loginFacade.getLoggedInUser()._id

		await this._entityRestCache.deleteFromCacheIfExists(UserTypeRef, null, userId)

		const user = await this._entityClient.load(UserTypeRef, userId)
		this._loginFacade._user = user
		return {
			user,
			group,
		}
	}

	async deleteCalendar(groupRootId: Id): Promise<void> {
		await this.serviceExecutor.delete(CalendarService, createCalendarDeleteData({groupRootId}))
	}

	async scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
		const user = this._loginFacade.getLoggedInUser()

		const eventsWithAlarmInfos = await this.loadAlarmEvents()
		const alarmNotifications = flatMap(eventsWithAlarmInfos, ({event, userAlarmInfos}) =>
			userAlarmInfos.map(userAlarmInfo => createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)),
		)
		// Theoretically we don't need to encrypt anything if we are sending things locally but we use already encrypted data on the client
		// to store alarms securely.
		const notificationKey = aes128RandomKey()
		await this._encryptNotificationKeyForDevices(notificationKey, alarmNotifications, [pushIdentifier])
		const requestEntity = createAlarmServicePost({
			alarmNotifications,
		})
		const AlarmServicePostTypeModel = await resolveTypeReference(AlarmServicePostTypeRef)
		const encEntity = await this._instanceMapper.encryptAndMapToLiteral(AlarmServicePostTypeModel, requestEntity, notificationKey)
		return this._native.invokeNative(new Request("scheduleAlarms", [downcast(encEntity).alarmNotifications]))
	}

	/**
	 * Load all events that have an alarm assigned.
	 * @return: Map from concatenated ListId of an event to list of UserAlarmInfos for that event
	 */
	async loadAlarmEvents(): Promise<Array<EventWithAlarmInfos>> {
		const alarmInfoList = this._loginFacade.getLoggedInUser().alarmInfoList

		if (!alarmInfoList) {
			console.warn("No alarmInfo list on user")
			return []
		}

		const userAlarmInfos = await this._entityClient.loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms)
		// Group referenced event ids by list id so we can load events of one list in one request.
		const listIdToElementIds = groupByAndMapUniquely(
			userAlarmInfos,
			userAlarmInfo => userAlarmInfo.alarmInfo.calendarRef.listId,
			userAlarmInfo => userAlarmInfo.alarmInfo.calendarRef.elementId,
		)
		// we group by the full concatenated list id
		// because there might be collisions between event element ids due to being custom ids
		const eventIdToAlarmInfos = groupBy(userAlarmInfos, userAlarmInfo => getEventIdFromUserAlarmInfo(userAlarmInfo).join(""))
		const calendarEvents = await promiseMap(listIdToElementIds.entries(), ([listId, elementIds]) => {
			return this._entityClient.loadMultiple(CalendarEventTypeRef, listId, Array.from(elementIds)).catch(error => {
				// handle NotAuthorized here because user could have been removed from group.
				if (error instanceof NotAuthorizedError) {
					console.warn("NotAuthorized when downloading alarm events", error)
					return []
				}

				throw error
			})
		})
		return flat(calendarEvents).map(event => {
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
	getEventByUid(uid: string): Promise<CalendarEvent | null> {
		const calendarMemberships = this._loginFacade.getLoggedInUser().memberships.filter(m => m.groupType === GroupType.Calendar && m.capability == null)

		return asyncFindAndMap(calendarMemberships, membership => {
			return this._entityClient
					   .load(CalendarGroupRootTypeRef, membership.group)
					   .then(
						   groupRoot =>
							   groupRoot.index &&
							   this._entityClient.load<CalendarEventUidIndex>(CalendarEventUidIndexTypeRef, [
								   groupRoot.index.list,
								   uint8arrayToCustomId(hashUid(uid)),
							   ]),
					   )
					   .catch(ofClass(NotFoundError, () => null))
					   .catch(ofClass(NotAuthorizedError, () => null))
		}).then(indexEntry => {
			if (indexEntry) {
				return this._entityClient.load<CalendarEvent>(CalendarEventTypeRef, indexEntry.calendarEvent).catch(ofClass(NotFoundError, () => null))
			} else {
				return null
			}
		})
	}

	async _saveMultipleAlarms(
		user: User,
		eventsWrapper: Array<{
			event: CalendarEvent
			alarms: Array<AlarmInfo>
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
			userAlarmInfosAndNotificationsPerEvent.map(({userAlarmInfoAndNotification}) => userAlarmInfoAndNotification.map(({alarm}) => alarm)),
		)
		const alarmIds = await this._entityClient.setupMultipleEntities(userAlarmInfoListId, allAlarms)
		let currentIndex = 0
		return userAlarmInfosAndNotificationsPerEvent.map(({event, userAlarmInfoAndNotification}) => {
			return {
				event,
				alarmInfoIds: userAlarmInfoAndNotification.map(() => [userAlarmInfoListId, alarmIds[currentIndex++]]),
				alarmNotifications: userAlarmInfoAndNotification.map(({alarmNotification}) => alarmNotification),
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
	})
}

function getEventIdFromUserAlarmInfo(userAlarmInfo: UserAlarmInfo): IdTuple {
	return [userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId]
}