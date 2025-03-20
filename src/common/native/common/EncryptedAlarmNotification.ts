import { OperationType } from "../../api/common/TutanotaConstants.js"

export type NotificationSessionKey = {
	pushIdentifierSessionEncSessionKey: string
	pushIdentifier: IdTuple
}

export type EncryptedAlarmInfo = {
	alarmIdentifier: string
}

export type EncryptedAlarmNotification = {
	operation: OperationType
	alarmInfo: EncryptedAlarmInfo
	userId: Id
	notificationSessionKeys: Array<NotificationSessionKey>
}
