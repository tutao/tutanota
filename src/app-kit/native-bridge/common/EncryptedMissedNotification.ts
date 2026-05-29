import { assertNotNull, Nullable } from "@tutao/utils"
import { createNotificationSessionKey, NotificationSessionKey } from "@tutao/entities/sys"

import { EncryptedParsedInstance } from "@tutao/instance-pipeline"

export class EncryptedMissedNotification {
	constructor(public readonly notification: EncryptedParsedInstance) {}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		// associations are never null
		const alarmNotifications = assertNotNull(this.notification.getAttributeByNameOrNull("alarmNotifications")).asNestedObjList()
		for (const alarmNotification of alarmNotifications) {
			// all alarm notifications share the same keys (see CalendarFacade#encryptNotificationKeyForDevices)
			const notificationSessionKeys = assertNotNull(alarmNotification.getAttributeByNameOrNull("notificationSessionKeys")).asNestedObjList()
			if (notificationSessionKeys.length > 0) {
				return notificationSessionKeys.map((nsk) => {
					return createNotificationSessionKey({
						pushIdentifier: assertNotNull(nsk.getAttributeByNameOrNull("pushIdentifier")).asIdTupleList()[0],
						pushIdentifierSessionEncSessionKey: assertNotNull(nsk.getAttributeByNameOrNull("pushIdentifierSessionEncSessionKey")).asByteArray(),
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
