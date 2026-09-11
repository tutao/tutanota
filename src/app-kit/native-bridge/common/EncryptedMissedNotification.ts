import { Nullable } from "@tutao/utils"

import { EncryptedParsedInstance } from "@tutao/instance-pipeline"

export class EncryptedMissedNotification {
	constructor(public readonly notification: EncryptedParsedInstance) {}

	get lastProcessedNotificationId(): Nullable<Id> {
		return this.notification.getAttributeByNameOrNull("lastProcessedNotificationId")?.getNullWhenNull()?.asId() ?? null
	}

	get notificationInfos(): Array<EncryptedParsedInstance> {
		return this.notification.getAttributeByNameOrNull("notificationInfos")?.getNullWhenNull()?.asNestedObjList() ?? []
	}

	get alarmNotifications(): Array<EncryptedParsedInstance> {
		return this.notification.getAttributeByNameOrNull("alarmNotifications")?.getNullWhenNull()?.asNestedObjList() ?? []
	}
}
