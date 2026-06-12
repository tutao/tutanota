import { base64ToUint8Array, Nullable } from "../../../platform-kit/utils"
import { ServerModelUntypedInstance, TypeModel, UntypedInstance } from "../../../platform-kit/meta/EntityTypes"
import { ClientTypeModelResolver } from "../../../platform-kit/instance-pipeline/EntityFunctions"
import { AttributeModel } from "../../../platform-kit/meta"
import {
	AlarmNotificationTypeRef,
	createNotificationSessionKey,
	MissedNotificationTypeRef,
	NotificationSessionKey,
	NotificationSessionKeyTypeRef,
} from "@tutao/entities/sys"

export class EncryptedMissedNotification {
	private constructor(
		public readonly notification: UntypedInstance,
		private readonly missedNotificationTypeModel: TypeModel,
		private readonly alarmNotificationTypeModel: TypeModel,
		private readonly notificationSessionKeyTypeModel: TypeModel,
	) {}

	public static async from(untypedInstance: ServerModelUntypedInstance, typeModelResolver: ClientTypeModelResolver): Promise<EncryptedMissedNotification> {
		const missedNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(MissedNotificationTypeRef)
		const alarmNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await typeModelResolver.resolveClientTypeReference(NotificationSessionKeyTypeRef)

		const sanitizedUntypedInstance = AttributeModel.removeNetworkDebuggingInfoIfNeededFromServerResponse(untypedInstance)

		return new EncryptedMissedNotification(
			sanitizedUntypedInstance,
			missedNotificationTypeModel,
			alarmNotificationTypeModel,
			notificationSessionKeyTypeModel,
		)
	}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const alarmNotifications = AttributeModel.getAttributeOnServerInstance(this.notification, "alarmNotifications", this.missedNotificationTypeModel)
			.asArray()
			.map((a) => a.asNestedObj())
		for (const alarmNotification of alarmNotifications) {
			// all alarm notifications share the same keys (see CalendarFacade#encryptNotificationKeyForDevices)
			const notificationSessionKeys = AttributeModel.getAttributeOnServerInstance(
				alarmNotification,
				"notificationSessionKeys",
				this.alarmNotificationTypeModel,
			)
				.asArray()
				.map((a) => a.asNestedObj())
			if (notificationSessionKeys.length > 0) {
				return notificationSessionKeys.map((nsk) => {
					return createNotificationSessionKey({
						pushIdentifier: AttributeModel.getAttributeOnServerInstance(nsk, "pushIdentifier", this.notificationSessionKeyTypeModel)
							.asArray()[0]
							.asIdTuple(),
						pushIdentifierSessionEncSessionKey: base64ToUint8Array(
							AttributeModel.getAttributeOnServerInstance(
								nsk,
								"pushIdentifierSessionEncSessionKey",
								this.notificationSessionKeyTypeModel,
							).asString(),
						),
					})
				})
			}
		}
		return []
	}

	get lastProcessedNotificationId(): Nullable<Id> {
		return AttributeModel.getAttributeOrNullOnServerInstance(this.notification, "lastProcessedNotificationId", this.missedNotificationTypeModel).asString()
	}

	get notificationInfos(): ServerModelUntypedInstance[] {
		return AttributeModel.getAttributeOnServerInstance(this.notification, "notificationInfos", this.missedNotificationTypeModel)
			.asArray()
			.map((a) => a.asNestedObj())
	}

	get alarmNotifications(): ServerModelUntypedInstance[] {
		return AttributeModel.getAttributeOnServerInstance(this.notification, "alarmNotifications", this.missedNotificationTypeModel)
			.asArray()
			.map((a) => a.asNestedObj())
	}
}
