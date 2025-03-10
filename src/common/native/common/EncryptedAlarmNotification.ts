import { ServerModelUntypedInstance, TypeModel, UntypedInstance } from "../../api/common/EntityTypes"
import { resolveClientTypeReference } from "../../api/common/EntityFunctions"
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

export class EncryptedAlarmNotification {
	public readonly untypedInstance: ServerModelUntypedInstance
	private alarmNotificationTypeModel: TypeModel
	private notificationSessionKeyTypeModel: TypeModel
	private alarmInfoTypeModel: TypeModel

	private constructor(
		notification: ServerModelUntypedInstance,
		alarmNotificationTypeModel: TypeModel,
		notificationSessionKeyTypeModel: TypeModel,
		alarmInfoTypeModel: TypeModel,
	) {
		this.untypedInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded(notification)
		this.alarmNotificationTypeModel = alarmNotificationTypeModel
		this.notificationSessionKeyTypeModel = notificationSessionKeyTypeModel
		this.alarmInfoTypeModel = alarmInfoTypeModel
	}

	public static async from(untypedInstance: ServerModelUntypedInstance): Promise<EncryptedAlarmNotification> {
		const alarmNotificationTypeModel = await resolveClientTypeReference(AlarmNotificationTypeRef)
		const notificationSessionKeyTypeModel = await resolveClientTypeReference(NotificationSessionKeyTypeRef)
		const alarmInfoTypeModel = await resolveClientTypeReference(AlarmInfoTypeRef)

		return new EncryptedAlarmNotification(untypedInstance, alarmNotificationTypeModel, notificationSessionKeyTypeModel, alarmInfoTypeModel)
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
