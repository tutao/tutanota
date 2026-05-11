import { aes256RandomKey, AesKey, CryptoWrapper, keyToBase64, VersionedKey } from "@tutao/crypto"
import type { EventAlarmInfoTemplatesTuple } from "../../../../calendar/gui/ImportExportUtils"
import { AttributeModel, ClientModelUntypedInstance, elementIdPart, listIdPart, sysServices, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { OperationType } from "@tutao/app-env"
import * as restError from "@tutao/rest-client/error"
import { UserFacade } from "../UserFacade"
import { EventWithUserAlarmInfos } from "./CalendarFacade"
import { flatMap, isNotNull, promiseMap } from "@tutao/utils"
import { CryptoFacade } from "../../crypto/CryptoFacade"
import { NativePushFacade } from "../../../../native/common/generatedipc/NativePushFacade"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { InfoMessageHandler } from "../../../../gui/InfoMessageHandler"
import { IServiceExecutor } from "../../../common/ServiceRequest"

export class AlarmFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly cryptoFacade: CryptoFacade,
		private readonly nativePushFacade: NativePushFacade,
		private readonly instancePipeline: InstancePipeline,
		private readonly infoMessageHandler: InfoMessageHandler,
	) {}

	public async saveAlarms(
		loggedInUser: sysTypeRefs.User,
		eventAlarmsTuples: EventAlarmInfoTemplatesTuple[],
		pushIdentifiers: sysTypeRefs.PushIdentifier[],
	): Promise<void> {
		const notificationSessionKey = aes256RandomKey()
		const alarmServicePostRequestData = await this.prepareAlarmServicePostData(
			loggedInUser._id,
			this.userFacade.getUserGroupId(),
			this.userFacade.getCurrentUserGroupKey(),
			eventAlarmsTuples,
			pushIdentifiers,
			notificationSessionKey,
		)
		await this.postAlarmServiceRequest(notificationSessionKey, alarmServicePostRequestData)
	}

	public async scheduleAlarmsForNewDevice(pushIdentifier: sysTypeRefs.PushIdentifier, eventsWithAlarmInfos: Array<EventWithUserAlarmInfos>): Promise<void> {
		const user = this.userFacade.getLoggedInUser()

		const alarmNotifications = flatMap(eventsWithAlarmInfos, ({ event, userAlarmInfos }) =>
			userAlarmInfos.map((userAlarmInfo) => this.createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)),
		)

		const sessionKey = aes256RandomKey()
		await this.encryptNotificationKeyForDevices(sessionKey, alarmNotifications, [pushIdentifier])

		const encryptedNotificationsWireFormat = JSON.stringify(
			await Promise.all(
				alarmNotifications.map(async (an) => {
					const untypedInstance = await this.instancePipeline.mapAndEncrypt(sysTypeRefs.AlarmNotificationTypeRef, an, sessionKey)
					return AttributeModel.removeNetworkDebuggingInfoIfNeeded<ClientModelUntypedInstance>(untypedInstance)
				}),
			),
		)

		await this.nativePushFacade.scheduleAlarms(encryptedNotificationsWireFormat, keyToBase64(sessionKey))
	}

	private async prepareAlarmServicePostData(
		userId: Id,
		ownerGroup: Id,
		userGroupKey: VersionedKey,
		eventAlarmTuples: Array<EventAlarmInfoTemplatesTuple>,
		pushIdentifiers: sysTypeRefs.PushIdentifier[],
		notificationSessionKey: AesKey,
	): Promise<sysTypeRefs.AlarmServicePost> {
		const alarmServicePost = sysTypeRefs.createAlarmServicePost({ alarmNotifications: [], userAlarmInfoData: [] })

		for (const { event, alarmInfoTemplates } of eventAlarmTuples) {
			const eventRef = sysTypeRefs.createCalendarEventRef({
				listId: listIdPart(event._id),
				elementId: elementIdPart(event._id),
			})

			for (const alarmInfoTemplate of alarmInfoTemplates) {
				const userAlarmInfoSessionKey = aes256RandomKey()
				const userAlarmInfoData = sysTypeRefs.createUserAlarmInfoData({
					ownerEncSessionKey: this.cryptoWrapper.encryptKey(userGroupKey.object, userAlarmInfoSessionKey),
					ownerKeyVersion: userGroupKey.version.toString(),
					encryptedTrigger: this.cryptoWrapper.encryptString(userAlarmInfoSessionKey, alarmInfoTemplate.trigger),
					alarmIdentifier: alarmInfoTemplate.alarmIdentifier,
					ownerGroup: ownerGroup,
					calendarEventRef: eventRef,
				})
				alarmServicePost.userAlarmInfoData.push(userAlarmInfoData)

				// one session key is used for all notifications of a single alarmInfo, but is encrypted separately for each device.
				// (Doesn't this mean that if you decrypt one key, you can decrypt all notifications on all devices? What security does this add?
				// Does it mean that you can't brute force faster if you gain access to notifications from multiple devices?)

				const alarmNotification = sysTypeRefs.createAlarmNotification({
					alarmInfo: sysTypeRefs.createAlarmInfo({ ...alarmInfoTemplate, calendarRef: eventRef }),
					repeatRule: event.repeatRule && this.createRepeatRuleForCalendarRepeatRule(event.repeatRule),
					notificationSessionKeys: [],
					operation: OperationType.CREATE,
					summary: event.summary,
					eventStart: event.startTime,
					eventEnd: event.endTime,
					user: userId,
				})
				alarmServicePost.alarmNotifications.push(alarmNotification)
			}
		}

		await this.encryptNotificationKeyForDevices(notificationSessionKey, alarmServicePost.alarmNotifications, pushIdentifiers)

		return alarmServicePost
	}

	private async postAlarmServiceRequest(notificationSessionKey: AesKey, alarmServicePostData: sysTypeRefs.AlarmServicePost): Promise<void> {
		try {
			await this.serviceExecutor.post(sysServices.AlarmService, alarmServicePostData, { sessionKey: notificationSessionKey })
		} catch (e) {
			if (e instanceof restError.TooManyRequestsError) {
				return this.infoMessageHandler.onInfoMessage({
					translationKey: "calendarAlarmsTooBigError_msg",
					args: {},
				})
			} else {
				throw e
			}
		}
	}

	/**
	 * Encrypts {@link notificationSessionKey} for every alarmNotification with the sessionKey of each pushIdentifier.
	 */
	private async encryptNotificationKeyForDevices(
		notificationSessionKey: AesKey,
		alarmNotifications: Array<sysTypeRefs.AlarmNotification>,
		pushIdentifierList: Array<sysTypeRefs.PushIdentifier>,
	): Promise<void> {
		// Makes copies of the notification SKs, each encrypted by a different push identifier SK
		// PushID SK ->* Notification SK -> alarm fields
		const maybeEncSessionKeys = await this.encryptNotificationSKWithPushIdentifierSKs(pushIdentifierList, notificationSessionKey)

		// rate limiting against blocking while resolving session keys (necessary)
		const encSessionKeys = maybeEncSessionKeys.filter(isNotNull)

		// Each alarmNotification contains ALL push identifiers & each pushIdentifierSessionEncryptedSessionKey.  Why?
		for (let notification of alarmNotifications) {
			notification.notificationSessionKeys = encSessionKeys.map((esk) => {
				return sysTypeRefs.createNotificationSessionKey({
					pushIdentifier: esk.identifierId,
					pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey,
				})
			})
		}
	}

	private encryptNotificationSKWithPushIdentifierSKs(pushIdentifierList: Array<sysTypeRefs.PushIdentifier>, notificationSessionKey: AesKey) {
		return promiseMap(pushIdentifierList, async (identifier) => {
			const pushIdentifierSk = await this.cryptoFacade.resolveSessionKey(identifier)
			if (pushIdentifierSk) {
				const pushIdentifierSessionEncSessionKey = this.cryptoWrapper.encryptKey(pushIdentifierSk, notificationSessionKey)
				return {
					identifierId: identifier._id,
					pushIdentifierSessionEncSessionKey,
				}
			} else {
				return null
			}
		})
	}

	private createAlarmNotificationForEvent(
		event: tutanotaTypeRefs.CalendarEvent,
		alarmInfo: sysTypeRefs.AlarmInfo,
		userId: Id,
	): sysTypeRefs.AlarmNotification {
		return sysTypeRefs.createAlarmNotification({
			alarmInfo: this.cloneAlarmInfo(alarmInfo),
			repeatRule: event.repeatRule && this.createRepeatRuleForCalendarRepeatRule(event.repeatRule),
			notificationSessionKeys: [],
			operation: OperationType.CREATE,
			summary: event.summary,
			eventStart: event.startTime,
			eventEnd: event.endTime,
			user: userId,
		})
	}

	private cloneAlarmInfo(alarmInfo: sysTypeRefs.AlarmInfo): sysTypeRefs.AlarmInfo {
		const calendarRef = sysTypeRefs.createCalendarEventRef({
			elementId: alarmInfo.calendarRef.elementId,
			listId: alarmInfo.calendarRef.listId,
		})
		return sysTypeRefs.createAlarmInfo({
			alarmIdentifier: alarmInfo.alarmIdentifier,
			trigger: alarmInfo.trigger,
			calendarRef,
		})
	}

	private createRepeatRuleForCalendarRepeatRule(calendarRepeatRule: tutanotaTypeRefs.CalendarRepeatRule): sysTypeRefs.RepeatRule {
		return sysTypeRefs.createRepeatRule({
			endType: calendarRepeatRule.endType,
			endValue: calendarRepeatRule.endValue,
			frequency: calendarRepeatRule.frequency,
			interval: calendarRepeatRule.interval,
			timeZone: calendarRepeatRule.timeZone,
			excludedDates: calendarRepeatRule.excludedDates.map(({ date }) => sysTypeRefs.createDateWrapper({ date })),
			advancedRules: calendarRepeatRule.advancedRules,
		})
	}
}
