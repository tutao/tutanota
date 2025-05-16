import { ServerModelUntypedInstance, TypeModel, UntypedInstance } from "../../api/common/EntityTypes"
import {
	AlarmInfoTypeRef,
	AlarmNotificationTypeRef,
	createNotificationSessionKey,
	NotificationSessionKey,
	NotificationSessionKeyTypeRef,
} from "../../api/entities/sys/TypeRefs"
import { AttributeModel } from "../../api/common/AttributeModel"
import { isSameId } from "../../api/common/utils/EntityUtils"
import { assertNotNull, Base64, base64ToUint8Array } from "@tutao/tutanota-utils"
import { ClientTypeModelResolver, TypeModelResolver } from "../../api/common/EntityFunctions"

export class EncryptedAlarmNotification {
	private constructor(
		public readonly untypedInstance: ServerModelUntypedInstance,
		private alarmNotificationTypeModel: TypeModel,
		private notificationSessionKeyTypeModel: TypeModel,
		private alarmInfoTypeModel: TypeModel,
	) {}

	public static async from(untypedInstance: ServerModelUntypedInstance, typeModelResolver: ClientTypeModelResolver): Promise<EncryptedAlarmNotification> {
		const alarmNotificationTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await typeModelResolver.resolveClientTypeReference(NotificationSessionKeyTypeRef)
		const alarmInfoTypeModel = await typeModelResolver.resolveClientTypeReference(AlarmInfoTypeRef)

		const sanitizedUntypedInstance = await AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(untypedInstance)
		return new EncryptedAlarmNotification(sanitizedUntypedInstance, alarmNotificationTypeModel, notificationSessionKeyTypeModel, alarmInfoTypeModel)
	}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const notificationSessionKeys = AttributeModel.getAttribute<UntypedInstance[]>(
			this.untypedInstance,
			"notificationSessionKeys",
			this.alarmNotificationTypeModel,
		)
		return notificationSessionKeys.map((nsk) => {
			return createNotificationSessionKey({
				pushIdentifier: AttributeModel.getAttribute<IdTuple[]>(nsk, "pushIdentifier", this.notificationSessionKeyTypeModel)[0],
				pushIdentifierSessionEncSessionKey: base64ToUint8Array(
					AttributeModel.getAttribute<Base64>(nsk, "pushIdentifierSessionEncSessionKey", this.notificationSessionKeyTypeModel),
				),
			})
		})
	}

	getAlarmId(): Id {
		const alarmInfo = AttributeModel.getAttribute<UntypedInstance[]>(this.untypedInstance, "alarmInfo", this.alarmNotificationTypeModel)[0]
		return AttributeModel.getAttribute(alarmInfo, "alarmIdentifier", this.alarmInfoTypeModel)
	}

	getOperation() {
		return AttributeModel.getAttribute<NumberString[]>(this.untypedInstance, "operation", this.alarmNotificationTypeModel)[0]
	}

	getUser(): Id {
		return AttributeModel.getAttribute<Id[]>(this.untypedInstance, "user", this.alarmNotificationTypeModel)[0]
	}

	discardOtherNotificationSessionKeys(pushId: IdTuple) {
		const nskAttrId = assertNotNull(AttributeModel.getAttributeId(this.alarmNotificationTypeModel, "notificationSessionKeys"))
		const notificationSessionKeys = AttributeModel.getAttribute<UntypedInstance[]>(
			this.untypedInstance,
			"notificationSessionKeys",
			this.alarmNotificationTypeModel,
		)
		this.untypedInstance[nskAttrId] = notificationSessionKeys.filter((nsk) => {
			const currentPushId = AttributeModel.getAttribute<IdTuple[]>(nsk, "pushIdentifier", this.notificationSessionKeyTypeModel)[0]
			return isSameId(currentPushId, pushId)
		})
	}
}
