//@flow

import {erase, serviceRequest, setup} from "../EntityWorker"
import {assertWorkerOrNode} from "../../Env"
import {createUserAlarmInfo, UserAlarmInfoTypeRef} from "../../entities/sys/UserAlarmInfo"
import type {LoginFacade} from "./LoginFacade"
import {neverNull, noOp} from "../../common/utils/Utils"
import {findAllAndRemove} from "../../common/utils/ArrayUtils"
import {elementIdPart, HttpMethod, isSameId, listIdPart, uint8arrayToCustomId} from "../../common/EntityFunctions"
import {generateEventElementId, isLongEvent} from "../../common/utils/CommonCalendarUtils"
import {load, loadAll, serviceRequestVoid} from "../../worker/EntityWorker"
import {_TypeModel as PushIdentifierTypeModel, PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {encryptKey, resolveSessionKey} from "../crypto/CryptoFacade"
import {createAlarmServicePost} from "../../entities/sys/AlarmServicePost"
import {SysService} from "../../entities/sys/Services"
import {aes128RandomKey} from "../crypto/Aes"
import {createAlarmNotification} from "../../entities/sys/AlarmNotification"
import {createAlarmInfo} from "../../entities/sys/AlarmInfo"
import {createRepeatRule} from "../../entities/sys/RepeatRule"
import {GroupType, OperationType} from "../../common/TutanotaConstants"
import {createNotificationSessionKey} from "../../entities/sys/NotificationSessionKey"
import {createCalendarPostData} from "../../entities/tutanota/CalendarPostData"
import {UserManagementFacade} from "./UserManagementFacade"
import {TutanotaService} from "../../entities/tutanota/Services"
import {GroupTypeRef} from "../../entities/sys/Group"
import {CalendarEventTypeRef} from "../../entities/tutanota/CalendarEvent"
import {createCalendarEventRef} from "../../entities/sys/CalendarEventRef"
import {UserTypeRef} from "../../entities/sys/User"
import {EntityRestCache} from "../rest/EntityRestCache"
import {NotFoundError} from "../../common/error/RestError"
import {createCalendarDeleteData} from "../../entities/tutanota/CalendarDeleteData"
import {CalendarPostReturnTypeRef} from "../../entities/tutanota/CalendarPostReturn"
import {CalendarGroupRootTypeRef} from "../../entities/tutanota/CalendarGroupRoot"
import {CalendarEventUidIndexTypeRef} from "../../entities/tutanota/CalendarEventUidIndex"
import {hash} from "../crypto/Sha256"
import {base64ToBase64Url, int8ArrayToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64} from "../../common/utils/Encoding"

assertWorkerOrNode()

function hashUid(uid: string): Uint8Array {
	return hash(stringToUtf8Uint8Array(uid))
}


export class CalendarFacade {

	_loginFacade: LoginFacade;
	_userManagementFacade: UserManagementFacade;
	_entityRestCache: EntityRestCache

	constructor(loginFacade: LoginFacade, userManagementFacade: UserManagementFacade, entityRestCache: EntityRestCache) {
		this._loginFacade = loginFacade
		this._userManagementFacade = userManagementFacade
		this._entityRestCache = entityRestCache
	}

	createCalendarEvent(event: CalendarEvent, alarmInfos: Array<AlarmInfo>, oldEvent: ?CalendarEvent): Promise<void> {
		return Promise
			.resolve()
			.then(() => {
				if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event")
				if (event.uid == null) throw new Error("no uid set on the event")
				event.hashedUid = hashUid(event.uid)
				if (oldEvent) {
					return erase(oldEvent).catch(NotFoundError, noOp)
				}
			})
			.then(() => load(CalendarGroupRootTypeRef, neverNull(event._ownerGroup)))
			.then((groupRoot) => {
				const listId = event.repeatRule || isLongEvent(event) ? groupRoot.longEvents : groupRoot.shortEvents
				event._id = [listId, generateEventElementId(event.startTime.getTime())]
				const user = this._loginFacade.getLoggedInUser()
				const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
				const alarmNotifications: Array<AlarmNotification> = []
				return Promise
					.map(alarmInfos, (alarmInfo) => {
						const newAlarm = createUserAlarmInfo()
						newAlarm._ownerGroup = user.userGroup.group
						newAlarm.alarmInfo = alarmInfo
						newAlarm.alarmInfo.calendarRef = Object.assign(createCalendarEventRef(), {
							listId,
							elementId: elementIdPart(event._id)
						})
						const alarmNotification = createAlarmNotificationForEvent(event, alarmInfo, user._id)
						alarmNotifications.push(alarmNotification)
						return setup(userAlarmInfoListId, newAlarm)
					})
					.then(newUserAlarmElementIds => {
						findAllAndRemove(event.alarmInfos, (userAlarmInfoId) => isSameId(userAlarmInfoListId, listIdPart(userAlarmInfoId)))
						newUserAlarmElementIds.forEach((id) => {
							event.alarmInfos.push([userAlarmInfoListId, id])
						})


						return setup(listId, event)
					})
					.then(() => {
						if (alarmNotifications.length > 0) {
							return loadAll(PushIdentifierTypeRef, neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list)
								.then((pushIdentifierList) => this._sendAlarmNotifications(alarmNotifications, pushIdentifierList))
						}
					})
			})
	}

	_sendAlarmNotifications(alarmNotifications: Array<AlarmNotification>, pushIdentifierList: Array<PushIdentifier>): Promise<void> {
		const notificationSessionKey = aes128RandomKey()
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
			})
			.then(maybeEncSessionKeys => {
				const encSessionKeys = maybeEncSessionKeys.filter(Boolean)
				for (let notification of alarmNotifications) {
					notification.notificationSessionKeys = encSessionKeys.map(esk => {
						return Object.assign(createNotificationSessionKey(), {
							pushIdentifier: esk.identifierId,
							pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey
						})
					})
				}

				const requestEntity = createAlarmServicePost()
				requestEntity.alarmNotifications = alarmNotifications
				return serviceRequestVoid(SysService.AlarmService, HttpMethod.POST, requestEntity, null, notificationSessionKey)
			})
	}


	addCalendar(name: string): Promise<{user: User, group: Group}> {
		return load(GroupTypeRef, this._loginFacade.getUserGroupId()).then(userGroup => {
			const adminGroupId = neverNull(userGroup.admin) // user group has always admin group
			let adminGroupKey = null
			if (this._loginFacade.getAllGroupIds().indexOf(adminGroupId) !== -1) { // getGroupKey throws an if user is not member of that group - so check first
				adminGroupKey = this._loginFacade.getGroupKey(adminGroupId)
			}
			const customerGroupKey = this._loginFacade.getGroupKey(this._loginFacade.getGroupId(GroupType.Customer))
			const userGroupKey = this._loginFacade.getUserGroupKey()
			const calendarData = this._userManagementFacade.generateCalendarGroupData(adminGroupId, adminGroupKey, customerGroupKey, userGroupKey, name)
			const postData = Object.assign(createCalendarPostData(), {calendarData})
			return serviceRequest(TutanotaService.CalendarService, HttpMethod.POST, postData, CalendarPostReturnTypeRef)
				.then((returnData) => load(GroupTypeRef, returnData.group))
				.then((group) => {
					// remove the user from the cache before loading it again to make sure we get the latest version.
					// otherwise we might not see the new calendar in case it is created at login and the websocket is not connected yet
					this._entityRestCache._tryRemoveFromCache(UserTypeRef, null, neverNull(userGroup.user))
					return load(UserTypeRef, neverNull(userGroup.user))
						.then(user => {
							this._loginFacade._user = user
							return {user, group}
						})
				})
		})
	}

	deleteCalendar(groupRootId: Id): Promise<void> {
		return serviceRequestVoid(TutanotaService.CalendarService, HttpMethod.DELETE, Object.assign(createCalendarDeleteData(), {groupRootId}))
	}

	scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
		const user = this._loginFacade.getLoggedInUser()
		return this.loadAlarmEvents()
		           .then((eventsWithAlarmInfo) => {
			           const alarmNotifications = eventsWithAlarmInfo.map(({event, userAlarmInfo}) => createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id))
			           return this._sendAlarmNotifications(alarmNotifications, [pushIdentifier])
		           })
	}

	loadAlarmEvents(): Promise<Array<EventWithAlarmInfo>> {
		const user = this._loginFacade.getLoggedInUser()
		const alarmInfoList = user.alarmInfoList
		if (alarmInfoList) {
			return loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms)
				.then((userAlarmInfos) =>
					Promise
						.map(userAlarmInfos, (userAlarmInfo) =>
							load(CalendarEventTypeRef, [
								userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId
							])
								.then((event) => {
									return {event, userAlarmInfo}
								})
								.catch(NotFoundError, () => {
									// We do not allow to delete userAlarmInfos currently but when we update the server we should do that
									//erase(userAlarmInfo).catch(noOp)
									return null
								}))
						.filter(Boolean) // filter out orphan alarms
				)
		} else {
			console.warn("No alarmInfo list on user")
			return Promise.resolve([])
		}
	}

	getEventByUid(uid: string): Promise<?CalendarEvent> {
		const calendarMemberships = this._loginFacade.getLoggedInUser().memberships.filter(m => m.groupType === GroupType.Calendar)
		return Promise
			.reduce(calendarMemberships, (acc, membership) => {
				// short-circuit if we find the thing
				return acc || load(CalendarGroupRootTypeRef, membership.group)
					.then((groupRoot) =>
						load(CalendarEventUidIndexTypeRef, [
							neverNull(groupRoot.index).list,
							uint8arrayToCustomId(hashUid(uid))
						]))
					.catch(NotFoundError, () => null)
			}, null)
			.then((indexEntry) => {
				if (indexEntry) {
					return load(CalendarEventTypeRef, indexEntry.calendarEvent)
				}
			})
	}
}

export type EventWithAlarmInfo = {
	event: CalendarEvent,
	userAlarmInfo: UserAlarmInfo
}

function createAlarmNotificationForEvent(event: CalendarEvent, alarmInfo: AlarmInfo, userId: Id): AlarmNotification {
	return Object.assign(createAlarmNotification(), {
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



