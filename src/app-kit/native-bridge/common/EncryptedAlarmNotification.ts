import { base64ToUint8Array } from "../../../platform-kit/utils"
import { AttributeModel } from "../../../platform-kit/meta"
import { TypeModel, UntypedInstance } from "../../../platform-kit/meta/EntityTypes"
import { ClientTypeModelResolver } from "../../../platform-kit/instance-pipeline/EntityFunctions"
import {
	AlarmInfoTypeRef,
	AlarmNotificationTypeRef,
	createNotificationSessionKey,
	NotificationSessionKey,
	NotificationSessionKeyTypeRef,
} from "@tutao/entities/sys"

export class EncryptedAlarmNotification {
	private constructor(
		public readonly untypedInstance: UntypedInstance,
		private alarmNotificationTypeModel: TypeModel,
		private notificationSessionKeyTypeModel: TypeModel,
		private alarmInfoTypeModel: TypeModel,
	) {}

	public static async from(untypedInstance: UntypedInstance, typeModelResolver: ClientTypeModelResolver): Promise<EncryptedAlarmNotification> {
		const alarmNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await typeModelResolver.resolveClientTypeReference(NotificationSessionKeyTypeRef)
		const alarmInfoTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmInfoTypeRef)

		const sanitizedUntypedInstance = AttributeModel.removeNetworkDebuggingInfoIfNeededFromServerResponse(untypedInstance)
		return new EncryptedAlarmNotification(sanitizedUntypedInstance, alarmNotificationTypeModel, notificationSessionKeyTypeModel, alarmInfoTypeModel)
	}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const notificationSessionKeys = AttributeModel.getAttributeOnServerInstance(
			this.untypedInstance,
			"notificationSessionKeys",
			this.alarmNotificationTypeModel,
		)
			.asArray()
			.map((a) => a.asNestedObj())
		return notificationSessionKeys.map((nsk) => {
			return createNotificationSessionKey({
				pushIdentifier: AttributeModel.getAttributeOnServerInstance(nsk, "pushIdentifier", this.notificationSessionKeyTypeModel)
					.asArray()[0]
					.asIdTuple(),
				pushIdentifierSessionEncSessionKey: base64ToUint8Array(
					AttributeModel.getAttributeOnServerInstance(nsk, "pushIdentifierSessionEncSessionKey", this.notificationSessionKeyTypeModel).asString(),
				),
			})
		})
	}

	getAlarmId(): Id {
		const alarmInfo = AttributeModel.getAttributeOnServerInstance(this.untypedInstance, "alarmInfo", this.alarmNotificationTypeModel)
			.asArray()[0]
			.asNestedObj()
		return AttributeModel.getAttributeOnServerInstance(alarmInfo, "alarmIdentifier", this.alarmInfoTypeModel).asString()
	}

	getOperation() {
		return AttributeModel.getAttributeOnServerInstance(this.untypedInstance, "operation", this.alarmNotificationTypeModel).asArray()[0].asIdTuple()
	}

	getUser(): Id {
		return AttributeModel.getAttributeOnServerInstance(this.untypedInstance, "user", this.alarmNotificationTypeModel).asArray()[0].asString()
	}
}
