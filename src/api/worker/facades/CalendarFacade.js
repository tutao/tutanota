//@flow

import {serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {assertWorkerOrNode} from "../../common/Env"
import type {UserAlarmInfo} from "../../entities/sys/UserAlarmInfo"
import {createUserAlarmInfo, UserAlarmInfoTypeRef} from "../../entities/sys/UserAlarmInfo"
import type {LoginFacade} from "./LoginFacade"
import {downcast, neverNull, noOp} from "../../common/utils/Utils"
import {HttpMethod} from "../../common/EntityFunctions"
import type {PushIdentifier} from "../../entities/sys/PushIdentifier"
import {_TypeModel as PushIdentifierTypeModel, PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {encryptAndMapToLiteral, encryptKey, resolveSessionKey} from "../crypto/CryptoFacade"
import {_TypeModel as AlarmServicePostTypeModel, createAlarmServicePost} from "../../entities/sys/AlarmServicePost"
import {SysService} from "../../entities/sys/Services"
import {aes128RandomKey} from "../crypto/Aes"
import type {AlarmNotification} from "../../entities/sys/AlarmNotification"
import {createAlarmNotification} from "../../entities/sys/AlarmNotification"
import type {AlarmInfo} from "../../entities/sys/AlarmInfo"
import {createAlarmInfo} from "../../entities/sys/AlarmInfo"
import type {RepeatRule} from "../../entities/sys/RepeatRule"
import {createRepeatRule} from "../../entities/sys/RepeatRule"
import {GroupType, OperationType} from "../../common/TutanotaConstants"
import {createNotificationSessionKey} from "../../entities/sys/NotificationSessionKey"
import {UserManagementFacade} from "./UserManagementFacade"
import {TutanotaService} from "../../entities/tutanota/Services"
import type {Group} from "../../entities/sys/Group"
import {GroupTypeRef} from "../../entities/sys/Group"
import type {CalendarEvent} from "../../entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef} from "../../entities/tutanota/CalendarEvent"
import {createCalendarEventRef} from "../../entities/sys/CalendarEventRef"
import type {User} from "../../entities/sys/User"
import {UserTypeRef} from "../../entities/sys/User"
import {EntityRestCache} from "../rest/EntityRestCache"
import {LockedError, NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {createCalendarDeleteData} from "../../entities/tutanota/CalendarDeleteData"
import {CalendarGroupRootTypeRef} from "../../entities/tutanota/CalendarGroupRoot"
import {CalendarEventUidIndexTypeRef} from "../../entities/tutanota/CalendarEventUidIndex"
import {hash} from "../crypto/Sha256"
import {stringToUtf8Uint8Array} from "../../common/utils/Encoding"
import type {CalendarRepeatRule} from "../../entities/tutanota/CalendarRepeatRule"
import {EntityClient} from "../../common/EntityClient"
import {elementIdPart, getListId, isSameId, listIdPart, uint8arrayToCustomId} from "../../common/utils/EntityUtils";
import {Request} from "../../common/WorkerProtocol"
import {CreateGroupPostReturnTypeRef} from "../../entities/tutanota/CreateGroupPostReturn"
import {GroupManagementFacade} from "./GroupManagementFacade"
import {createUserAreaGroupPostData} from "../../entities/tutanota/UserAreaGroupPostData"

assertWorkerOrNode()

function hashUid(uid: string): Uint8Array {
	return hash(stringToUtf8Uint8Array(uid))
}


export class CalendarFacade {

	_loginFacade: LoginFacade;
	_groupManagementFacade: GroupManagementFacade;
	_entityRestCache: EntityRestCache
	_entity: EntityClient

	constructor(loginFacade: LoginFacade, groupManagementFacade: GroupManagementFacade, entityRestCache: EntityRestCache) {
		this._loginFacade = loginFacade
		this._groupManagementFacade = groupManagementFacade
		this._entityRestCache = entityRestCache
		this._entity = new EntityClient(entityRestCache)
	}

	createCalendarEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, oldEvent: ?CalendarEvent): Promise<void> {
		const user = this._loginFacade.getLoggedInUser()
		return Promise
			.resolve()
			.then(() => {
				if (event._id == null) throw new Error("No id set on the event")
				if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event")
				if (event.uid == null) throw new Error("no uid set on the event")
				event.hashedUid = hashUid(event.uid)
				if (oldEvent) {
					return this._entity.erase(oldEvent)
					           .catch(NotFoundError, noOp)
					           .catch(LockedError, noOp)
				}
			})
			.then(() =>
				this._createAlarms(user, event, alarmInfos)
				    .then(userAlarmIdsWithAlarmNotifications => {
					    event.alarmInfos.length = 0
					    userAlarmIdsWithAlarmNotifications.forEach(([id]) => {
						    event.alarmInfos.push(id)
					    })
					    return this._entity.setup(getListId(event), event)
					               .then(() => {
						               if (userAlarmIdsWithAlarmNotifications.length > 0) {
							               const alarmNotifications = userAlarmIdsWithAlarmNotifications
								               .map(([_, alarm]) => alarm)
							               return this._entity.loadAll(
								               PushIdentifierTypeRef,
								               neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list
							               ).then((pushIdentifierList) =>
								               this._sendAlarmNotifications(alarmNotifications, pushIdentifierList))
						               }
					               })
				    }))
	}

	updateCalendarEvent(newEvent: CalendarEvent, newAlarms: Array<AlarmInfo>, existingEvent: CalendarEvent): Promise<void> {
		newEvent._id = existingEvent._id
		newEvent._ownerEncSessionKey = existingEvent._ownerEncSessionKey
		newEvent._permissions = existingEvent._permissions
		const user = this._loginFacade.getLoggedInUser()
		return Promise
			.resolve()
			.then(() => this._createAlarms(user, newEvent, newAlarms))
			.then(userAlarmIdsWithAlarmNotifications => {
				const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
				// Remove all alarms which belongs to the current user. We need to be careful about other users' alarms.
				// Server takes care of the removed alarms,
				newEvent.alarmInfos = existingEvent.alarmInfos.filter((a) => !isSameId(listIdPart(a), userAlarmInfoListId))
				if (userAlarmIdsWithAlarmNotifications) {
					newEvent.alarmInfos.push(...userAlarmIdsWithAlarmNotifications.map(([id]) => id))
				}
				return this._entity.update(newEvent)
				           .then(() => {
					           if (userAlarmIdsWithAlarmNotifications) {
						           const alarmNotifications = userAlarmIdsWithAlarmNotifications
							           .map(([_id, alarmNotification]) => alarmNotification)
						           if (alarmNotifications.length > 0) {
							           return this._entity.loadAll(PushIdentifierTypeRef, neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list)
							                      .then((pushIdentifierList) => this._sendAlarmNotifications(alarmNotifications, pushIdentifierList))
						           }
					           }
				           })
			})
	}

	_createAlarms(user: User, event: CalendarEvent, alarmInfos: Array<AlarmInfo>): Promise<Array<[IdTuple, AlarmNotification]>> {
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
		return Promise
			.map(alarmInfos, (alarmInfo) => {
				const newAlarm = createUserAlarmInfo()
				newAlarm._ownerGroup = user.userGroup.group
				newAlarm.alarmInfo = createAlarmInfo()
				newAlarm.alarmInfo.alarmIdentifier = alarmInfo.alarmIdentifier
				newAlarm.alarmInfo.trigger = alarmInfo.trigger
				newAlarm.alarmInfo.calendarRef = createCalendarEventRef({
					listId: listIdPart(event._id),
					elementId: elementIdPart(event._id)
				})
				const alarmNotification = createAlarmNotificationForEvent(event, newAlarm.alarmInfo, user._id)
				return this._entity.setup(userAlarmInfoListId, newAlarm).then((id) => ([
					[userAlarmInfoListId, id], alarmNotification
				]))
			}, {concurrency: 1}) // sequentially to avoid rate limiting
	}

	_sendAlarmNotifications(alarmNotifications: Array<AlarmNotification>, pushIdentifierList: Array<PushIdentifier>): Promise<void> {
		const notificationSessionKey = aes128RandomKey()
		return this._encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList).then(() => {
			const requestEntity = createAlarmServicePost({alarmNotifications})
			return serviceRequestVoid(SysService.AlarmService, HttpMethod.POST, requestEntity, null, notificationSessionKey)
		})
	}

	_encryptNotificationKeyForDevices(notificationSessionKey: Aes128Key, alarmNotifications: Array<AlarmNotification>,
	                                  pushIdentifierList: Array<PushIdentifier>
	): Promise<void> {
		// PushID SK ->* Notification SK -> alarm fields
		return Promise
			.map(pushIdentifierList, identifier => {
				return resolveSessionKey(PushIdentifierTypeModel, identifier).then(pushIdentifierSk => {
					if (pushIdentifierSk) {
						const pushIdentifierSessionEncSessionKey = encryptKey(pushIdentifierSk, notificationSessionKey)
						return {identifierId: identifier._id, pushIdentifierSessionEncSessionKey}
					} else {
						return null
					}
				})
			}, {concurrency: 1}) // rate limiting against blocking while resolving session keys (neccessary)
			.then(maybeEncSessionKeys => {
				const encSessionKeys = maybeEncSessionKeys.filter(Boolean)
				for (let notification of alarmNotifications) {
					notification.notificationSessionKeys = encSessionKeys.map(esk => {
						return createNotificationSessionKey({
							pushIdentifier: esk.identifierId,
							pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey
						})
					})
				}
			})
	}


	addCalendar(name: string): Promise<{user: User, group: Group}> {
		return this._groupManagementFacade.generateUserAreaGroupData(name)
		           .then(groupData => {
				           const postData = createUserAreaGroupPostData({groupData})
				           return serviceRequest(TutanotaService.CalendarService, HttpMethod.POST, postData, CreateGroupPostReturnTypeRef)
					           .then((returnData) => this._entity.load(GroupTypeRef, returnData.group))
					           .then((group) => {
						           // remove the user from the cache before loading it again to make sure we get the latest version.
						           // otherwise we might not see the new calendar in case it is created at login and the websocket is not connected yet
						           const userId = this._loginFacade.getLoggedInUser()._id
						           this._entityRestCache._tryRemoveFromCache(UserTypeRef, null, userId)
						           return this._entity.load(UserTypeRef, userId)
						                      .then(user => {
							                      this._loginFacade._user = user
							                      return {user, group}
						                      })
					           })
			           }
		           )
	}

	deleteCalendar(groupRootId: Id): Promise<void> {
		return serviceRequestVoid(TutanotaService.CalendarService, HttpMethod.DELETE, Object.assign(createCalendarDeleteData(), {groupRootId}))
	}

	scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
		const user = this._loginFacade.getLoggedInUser()
		return this.loadAlarmEvents().then((eventsWithAlarmInfo) => {
			const alarmNotifications = eventsWithAlarmInfo.map(({event, userAlarmInfo}) =>
				createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id))
			// Theoretically we don't need to encrypt anything if we are sending things locally but we use already encrypted data on the client
			// to store alarms securely.
			const notificationKey = aes128RandomKey()
			return this._encryptNotificationKeyForDevices(notificationKey, alarmNotifications, [pushIdentifier]).then(() => {
				const requestEntity = createAlarmServicePost({alarmNotifications})
				return Promise
					.all([
						encryptAndMapToLiteral(AlarmServicePostTypeModel, requestEntity, notificationKey),
						import("../../../native/common/NativeWrapper")
					])
					.then(([encEntity, {nativeApp}]) => {
						return nativeApp.invokeNative(new Request("scheduleAlarms", [downcast(encEntity).alarmNotifications]))
					})
			})
		})
	}

	loadAlarmEvents(): Promise<Array<EventWithAlarmInfo>> {
		const user = this._loginFacade.getLoggedInUser()
		const alarmInfoList = user.alarmInfoList
		if (alarmInfoList) {
			return this._entity.loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms)
			           .then((userAlarmInfos) =>
				           Promise
					           .mapSeries(userAlarmInfos, (userAlarmInfo) =>
						           this._entity.load(CalendarEventTypeRef, [
							           userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId
						           ])
						               .then((event) => {
							               return {event, userAlarmInfo}
						               })
						               .catch(NotFoundError, () => {
							               // We do not allow to delete userAlarmInfos currently but when we update the server we should do that
							               //erase(userAlarmInfo).catch(noOp)
							               return null
						               })
						               .catch(NotAuthorizedError, (e) => {
							               // Should not happen normally but could happen when user is removed from the calendar
							               console.warn("NotAuthorized when downloading alarm event", e)
							               return null
						               }))
					           .then((alarms) => alarms.filter(Boolean)) // filter out orphan alarms
			           )
		} else {
			console.warn("No alarmInfo list on user")
			return Promise.resolve([])
		}
	}

	/**
	 * Queries the event using the uid index. The index is stored per calendar so we have to go through all calendars to find matching event.
	 * We currently only need this for calendar event updates and for that we don't want to look into shared calendars.
	 */
	getEventByUid(uid: string): Promise<?CalendarEvent> {
		const calendarMemberships = this._loginFacade.getLoggedInUser().memberships
		                                .filter(m => m.groupType === GroupType.Calendar && m.capability == null)
		return Promise
			.reduce(calendarMemberships, (acc, membership) => {
				// short-circuit if we've already found the event
				if (acc) {
					return acc
				}
				return this._entity.load(CalendarGroupRootTypeRef, membership.group)
				           .then((groupRoot) =>
					           groupRoot.index && this._entity.load(CalendarEventUidIndexTypeRef, [
						           groupRoot.index.list,
						           uint8arrayToCustomId(hashUid(uid))
					           ]))
				           .catch(NotFoundError, () => null)
				           .catch(NotAuthorizedError, () => null)
			}, null)
			.then((indexEntry) => {
				if (indexEntry) {
					return this._entity.load(CalendarEventTypeRef, indexEntry.calendarEvent)
					           .catch(NotFoundError, () => null)
				}
			})
	}
}

export type EventWithAlarmInfo = {
	event: CalendarEvent,
	userAlarmInfo: UserAlarmInfo
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
		user: userId
	})
}

function createAlarmInfoForAlarmInfo(alarmInfo: AlarmInfo): AlarmInfo {
	const calendarRef = Object.assign(createCalendarEventRef(), {
		elementId: alarmInfo.calendarRef.elementId,
		listId: alarmInfo.calendarRef.listId
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
		timeZone: calendarRepeatRule.timeZone
	})
}
