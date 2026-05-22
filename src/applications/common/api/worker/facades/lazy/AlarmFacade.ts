import { aes256RandomKey, AesKey, CryptoWrapper, keyToBase64, VersionedKey } from "@tutao/crypto"
import type { EventAlarmInfoTemplatesTuple } from "../../../../calendar/gui/ImportExportUtils"
import { AttributeModel, ClientModelUntypedInstance, elementIdPart, listIdPart, OperationType } from "@tutao/meta"
import * as restError from "@tutao/rest-client/error"
import { EventWithUserAlarmInfos } from "./CalendarFacade"
import { flatMap, isNotNull, promiseMap } from "@tutao/utils"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { InfoMessageHandler } from "../../../../gui/InfoMessageHandler"
import { UserFacade } from "../../../../../../platform-kits/base/facades/UserFacade"
import { IServiceExecutor } from "../../../../../../platform-kits/network/ServiceRequest"
import { CryptoFacade } from "../../../../../../platform-kits/base/crypto/CryptoFacade"
import { AlarmNotification, NativePushFacade } from "@tutao/native-bridge/generatedIpc/types"
import {
	AlarmInfo,
	AlarmNotificationTypeRef,
	AlarmService,
	AlarmServicePost,
	createAlarmInfo,
	createAlarmNotification,
	createAlarmServicePost,
	createCalendarEventRef,
	createDateWrapper,
	createNotificationSessionKey,
	createRepeatRule,
	createUserAlarmInfoData,
	PushIdentifier,
	RepeatRule,
	User,
} from "@tutao/entities/sys"
import { CalendarEvent, CalendarRepeatRule } from "@tutao/entities/tutanota"

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

	public async createAlarms(loggedInUser: User, eventAlarmsTuples: EventAlarmInfoTemplatesTuple[], pushIdentifiers: PushIdentifier[]): Promise<void> {
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

	public async scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier, eventsWithAlarmInfos: Array<EventWithUserAlarmInfos>): Promise<void> {
		const user = this.userFacade.getLoggedInUser()

		const alarmNotifications = flatMap(eventsWithAlarmInfos, ({ event, userAlarmInfos }) =>
			userAlarmInfos.map((userAlarmInfo) => this.createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)),
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

		await this.nativePushFacade.scheduleAlarms(encryptedNotificationsWireFormat, keyToBase64(sessionKey))
	}

	private async prepareAlarmServicePostData(
		userId: Id,
		ownerGroup: Id,
		userGroupKey: VersionedKey,
		eventAlarmTuples: Array<EventAlarmInfoTemplatesTuple>,
		pushIdentifiers: PushIdentifier[],
		notificationSessionKey: AesKey,
	): Promise<AlarmServicePost> {
		const alarmServicePost = createAlarmServicePost({ alarmNotifications: [], userAlarmInfoData: [] })

		for (const { event, alarmInfoTemplates } of eventAlarmTuples) {
			const eventRef = createCalendarEventRef({
				listId: listIdPart(event._id),
				elementId: elementIdPart(event._id),
			})

			for (const alarmInfoTemplate of alarmInfoTemplates) {
				const userAlarmInfoSessionKey = aes256RandomKey()
				const userAlarmInfoData = createUserAlarmInfoData({
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

				const alarmNotification = createAlarmNotification({
					alarmInfo: createAlarmInfo({ ...alarmInfoTemplate, calendarRef: eventRef }),
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

	private async postAlarmServiceRequest(notificationSessionKey: AesKey, alarmServicePostData: AlarmServicePost): Promise<void> {
		try {
			await this.serviceExecutor.post(AlarmService, alarmServicePostData, { sessionKey: notificationSessionKey })
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
		alarmNotifications: Array<AlarmNotification>,
		pushIdentifierList: Array<PushIdentifier>,
	): Promise<void> {
		// Makes copies of the notification SKs, each encrypted by a different push identifier SK
		// PushID SK ->* Notification SK -> alarm fields
		const maybeEncSessionKeys = await this.encryptNotificationSKWithPushIdentifierSKs(pushIdentifierList, notificationSessionKey)

		// rate limiting against blocking while resolving session keys (necessary)
		const encSessionKeys = maybeEncSessionKeys.filter(isNotNull)

		// Each alarmNotification contains ALL push identifiers & each pushIdentifierSessionEncryptedSessionKey.  Why?
		for (let notification of alarmNotifications) {
			notification.notificationSessionKeys = encSessionKeys.map((esk) => {
				return createNotificationSessionKey({
					pushIdentifier: esk.identifierId,
					pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey,
				})
			})
		}
	}

	private encryptNotificationSKWithPushIdentifierSKs(pushIdentifierList: Array<PushIdentifier>, notificationSessionKey: AesKey) {
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

	private createAlarmNotificationForEvent(event: CalendarEvent, alarmInfo: AlarmInfo, userId: Id): AlarmNotification {
		return createAlarmNotification({
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

	private cloneAlarmInfo(alarmInfo: AlarmInfo): AlarmInfo {
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

	private createRepeatRuleForCalendarRepeatRule(calendarRepeatRule: CalendarRepeatRule): RepeatRule {
		return createRepeatRule({
			endType: calendarRepeatRule.endType,
			endValue: calendarRepeatRule.endValue,
			frequency: calendarRepeatRule.frequency,
			interval: calendarRepeatRule.interval,
			timeZone: calendarRepeatRule.timeZone,
			excludedDates: calendarRepeatRule.excludedDates.map(({ date }) => createDateWrapper({ date })),
			advancedRules: calendarRepeatRule.advancedRules,
		})
	}
}
