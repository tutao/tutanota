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
	notificationSessionKeys: Array<NotificationSessionKey>
	alarmInfo: EncryptedAlarmInfo
	user: Id
}
