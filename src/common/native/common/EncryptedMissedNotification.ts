import { ServerModelUntypedInstance, TypeModel } from "../../api/common/EntityTypes"
import {
	AlarmNotificationTypeRef,
	createNotificationSessionKey,
	MissedNotificationTypeRef,
	NotificationSessionKey,
	NotificationSessionKeyTypeRef,
} from "../../api/entities/sys/TypeRefs"
import { AttributeModel } from "../../api/common/AttributeModel"
import { Base64, base64ToUint8Array } from "@tutao/tutanota-utils"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { ClientTypeModelResolver } from "../../api/common/EntityFunctions"

export class EncryptedMissedNotification {
	private constructor(
		public readonly notification: ServerModelUntypedInstance,
		private readonly missedNotificationTypeModel: TypeModel,
		private readonly alarmNotificationTypeModel: TypeModel,
		private readonly notificationSessionKeyTypeModel: TypeModel,
	) {}

	public static async from(untypedInstance: ServerModelUntypedInstance, typeModelResolver: ClientTypeModelResolver): Promise<EncryptedMissedNotification> {
		const missedNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(MissedNotificationTypeRef)
		const alarmNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await typeModelResolver.resolveClientTypeReference(NotificationSessionKeyTypeRef)

		const sanitizedUntypedInstance = await AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(untypedInstance)

		return new EncryptedMissedNotification(
			sanitizedUntypedInstance,
			missedNotificationTypeModel,
			alarmNotificationTypeModel,
			notificationSessionKeyTypeModel,
		)
	}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const alarmNotifications = AttributeModel.getAttribute<ServerModelUntypedInstance[]>(
			this.notification,
			"alarmNotifications",
			this.missedNotificationTypeModel,
		)
		for (const alarmNotification of alarmNotifications) {
			// all alarm notifications share the same keys (see CalendarFacade#encryptNotificationKeyForDevices)
			const notificationSessionKeys = AttributeModel.getAttribute<ServerModelUntypedInstance[]>(
				alarmNotification,
				"notificationSessionKeys",
				this.alarmNotificationTypeModel,
			)
			if (notificationSessionKeys.length > 0) {
				return notificationSessionKeys.map((nsk) => {
					return createNotificationSessionKey({
						pushIdentifier: AttributeModel.getAttribute<IdTuple[]>(nsk, "pushIdentifier", this.notificationSessionKeyTypeModel)[0],
						pushIdentifierSessionEncSessionKey: base64ToUint8Array(
							AttributeModel.getAttribute<Base64>(nsk, "pushIdentifierSessionEncSessionKey", this.notificationSessionKeyTypeModel),
						),
					})
				})
			}
		}
		return []
	}

	get lastProcessedNotificationId(): Nullable<Id> {
		return AttributeModel.getAttributeorNull<Id>(this.notification, "lastProcessedNotificationId", this.missedNotificationTypeModel)
	}

	get notificationInfos(): ServerModelUntypedInstance[] {
		return AttributeModel.getAttribute<ServerModelUntypedInstance[]>(this.notification, "notificationInfos", this.missedNotificationTypeModel)
	}

	get alarmNotifications(): ServerModelUntypedInstance[] {
		return AttributeModel.getAttribute<ServerModelUntypedInstance[]>(this.notification, "alarmNotifications", this.missedNotificationTypeModel)
	}
}
