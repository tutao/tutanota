import { Nullable } from "@tutao/utils"
import { createNotificationSessionKey, NotificationSessionKey } from "@tutao/entities/sys"

import { EncryptedParsedInstance } from "@tutao/instance-pipeline"

export class EncryptedMissedNotification {
	constructor(public readonly notification: EncryptedParsedInstance) {}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const alarmNotifications = this.notification.getAttributeByName("alarmNotifications").asNestedObjList()
		for (const alarmNotification of alarmNotifications) {
			// all alarm notifications share the same keys (see CalendarFacade#encryptNotificationKeyForDevices)
			const notificationSessionKeys = alarmNotification.getAttributeByName("notificationSessionKeys").asNestedObjList()
			if (notificationSessionKeys.length > 0) {
				return notificationSessionKeys.map((nsk) => {
					return createNotificationSessionKey({
						pushIdentifier: nsk.getAttributeByName("pushIdentifier").asIdTupleList()[0],
						pushIdentifierSessionEncSessionKey: nsk.getAttributeByName("pushIdentifierSessionEncSessionKey").asByteArray(),
					})
				})
			}
		}
		return []
	}

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
