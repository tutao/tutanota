import { TypeModel, UntypedInstance } from "../../api/common/EntityTypes"
import { resolveTypeReference } from "../../api/common/EntityFunctions"
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

export class EncryptedMissedNotification {
	private constructor(
		public readonly notification: UntypedInstance,
		private readonly missedNotificationTypeModel: TypeModel,
		private readonly alarmNotificationTypeModel: TypeModel,
		private readonly notificationSessionKeyTypeModel: TypeModel,
	) {}

	public static async from(untypedInstance: UntypedInstance): Promise<EncryptedMissedNotification> {
		const missedNotificationTypeModel = await resolveTypeReference(MissedNotificationTypeRef)
		const alarmNotificationTypeModel = await resolveTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await resolveTypeReference(NotificationSessionKeyTypeRef)

		return new EncryptedMissedNotification(untypedInstance, missedNotificationTypeModel, alarmNotificationTypeModel, notificationSessionKeyTypeModel)
	}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const alarmNotifications = AttributeModel.getAttribute<UntypedInstance[]>(this.notification, "alarmNotifications", this.missedNotificationTypeModel)
		for (const alarmNotification of alarmNotifications) {
			// all alarm notification share the same keys (see CalendarFacade#encryptNotificationKeyForDevices)
			const notificationSessionKeys = AttributeModel.getAttribute<UntypedInstance[]>(
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

	get notificationInfos(): UntypedInstance[] {
		return AttributeModel.getAttribute<UntypedInstance[]>(this.notification, "notificationInfos", this.missedNotificationTypeModel)
	}

	get alarmNotifications(): UntypedInstance[] {
		return AttributeModel.getAttribute<UntypedInstance[]>(this.notification, "alarmNotifications", this.missedNotificationTypeModel)
	}
}
