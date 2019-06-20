//@flow

import {erase, setup} from "../EntityWorker"
import {assertWorkerOrNode} from "../../Env"
import {createUserAlarmInfo} from "../../entities/sys/UserAlarmInfo"
import type {LoginFacade} from "./LoginFacade"
import {neverNull} from "../../common/utils/Utils"
import {findAllAndRemove} from "../../common/utils/ArrayUtils"
import {HttpMethod, isSameId, listIdPart} from "../../common/EntityFunctions"
import {generateEventElementId, isLongEvent} from "../../common/utils/CommonCalendarUtils"
import {load, loadAll, serviceRequestVoid} from "../../worker/EntityWorker"
import {_TypeModel as PushIdentifierTypeModel, PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {encryptKey, resolveSessionKey} from "../crypto/CryptoFacade"
import {createAlarmServicePost} from "../../entities/sys/AlarmServicePost"
import {SysService} from "../../entities/sys/Services"
import {aes128RandomKey} from "../crypto/Aes"
import {createAlarmNotification} from "../../entities/sys/AlarmNotification"
import {GroupType, OperationType} from "../../common/TutanotaConstants"
import {createNotificationSessionKey} from "../../entities/sys/NotificationSessionKey"
import {createCalendarPostData} from "../../entities/tutanota/CalendarPostData"
import {UserManagementFacade} from "./UserManagementFacade"
import {TutanotaService} from "../../entities/tutanota/Services"
import {GroupTypeRef} from "../../entities/sys/Group"

assertWorkerOrNode()

export class CalendarFacade {

	_loginFacade: LoginFacade;
	_userManagementFacade: UserManagementFacade;

	constructor(loginFacade: LoginFacade, userManagementFacade: UserManagementFacade) {
		this._loginFacade = loginFacade
		this._userManagementFacade = userManagementFacade
	}

	createCalendarEvent(groupRoot: CalendarGroupRoot, event: CalendarEvent, alarmInfo: ?AlarmInfo, oldEvent: ?CalendarEvent): Promise<void> {
		const user = this._loginFacade.getLoggedInUser()
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms
		let p = Promise.resolve()
		const alarmNotifications: Array<AlarmNotification> = []
		// delete old calendar event
		if (oldEvent) {
			p = erase(oldEvent)
		}
		return p
			.then(() => {
				if (alarmInfo) {
					const newAlarm = createUserAlarmInfo()
					newAlarm._ownerGroup = user.userGroup.group
					newAlarm.alarmInfo = alarmInfo
					const alarmNotification = Object.assign(createAlarmNotification(), {
						alarmInfo,
						repeatRule: event.repeatRule,
						notificationSessionKeys: [],
						operation: OperationType.CREATE,
						summary: event.summary,
						eventStart: event.startTime
					})
					alarmNotifications.push(alarmNotification)
					return setup(userAlarmInfoListId, newAlarm)
				}
			})
			.then(newUserAlarmElementId => {
				findAllAndRemove(event.alarmInfos, (userAlarmInfoId) => isSameId(userAlarmInfoListId, listIdPart(userAlarmInfoId)))
				if (newUserAlarmElementId) {
					event.alarmInfos.push([userAlarmInfoListId, newUserAlarmElementId])
				}
				const listId = event.repeatRule || isLongEvent(event) ? groupRoot.longEvents : groupRoot.shortEvents
				event._id = [listId, generateEventElementId(event.startTime.getTime())]
				return setup(listId, event)
			})
			.then(() => this._sendAlarmNotifications(alarmNotifications))
	}

	_sendAlarmNotifications(alarmNotifications: Array<AlarmNotification>): Promise<void> {
		return loadAll(PushIdentifierTypeRef, neverNull(this._loginFacade.getLoggedInUser().pushIdentifierList).list)
			.then((pushIdentifierList) => {
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
			})
	}


	addCalendar(): Promise<void> {
		return load(GroupTypeRef, this._loginFacade.getUserGroupId()).then(userGroup => {
			const adminGroupId = neverNull(userGroup.admin) // user group has always admin group
			let adminGroupKey = null
			if (this._loginFacade.getAllGroupIds().indexOf(adminGroupId) != -1) { // getGroupKey throws an if user is not member of that group - so check first
				adminGroupKey = this._loginFacade.getGroupKey(adminGroupId)
			}
			const customerGroupKey = this._loginFacade.getGroupKey(this._loginFacade.getGroupId(GroupType.Customer))
			const userGroupKey = this._loginFacade.getUserGroupKey()
			const calendarData = this._userManagementFacade.generateCalendarGroupData(adminGroupId, adminGroupKey, customerGroupKey, userGroupKey)
			const postData = Object.assign(createCalendarPostData(), {calendarData})
			return serviceRequestVoid(TutanotaService.CalendarService, HttpMethod.POST, postData)
		})
	}
}

