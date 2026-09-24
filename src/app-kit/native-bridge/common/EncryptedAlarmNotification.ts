import { createNotificationSessionKey, NotificationSessionKey } from "@tutao/entities/sys"

import { EncryptedParsedInstance } from "@tutao/instance-pipeline"
import { KdfNonce, validateKdfNonceLength } from "@tutao/crypto"
import { Nullable } from "@tutao/utils"

export class EncryptedAlarmNotification {
	public constructor(public readonly encryptedInstance: EncryptedParsedInstance) {}

	getNotificationSessionKeys(): Array<NotificationSessionKey> {
		const notificationSessionKeys = this.encryptedInstance.getAttributeByName("notificationSessionKeys").asNestedObjList()
		return notificationSessionKeys.map((nsk) => {
			return createNotificationSessionKey({
				pushIdentifier: nsk.getAttributeByName("pushIdentifier").asIdTupleList()[0],
				pushIdentifierSessionEncSessionKey: nsk.getAttributeByName("pushIdentifierSessionEncSessionKey").asByteArray(),
			})
		})
	}

	getAlarmId(): Id {
		return this.encryptedInstance.getAttributeByName("alarmInfo").asNestedObjList()[0].getAttributeByName("alarmIdentifier").asId()
	}

	getOperation(): NumberString {
		return this.encryptedInstance.getAttributeByName("operation").asString()
	}

	getUser(): Id {
		return this.encryptedInstance.getAttributeByName("user").asIdList()[0]
	}

	getId(): Id {
		return this.encryptedInstance.getAttributeByName("_id").asId()
	}

	getNotificationKdfNonce(): Nullable<KdfNonce> {
		const kdfNonce = this.encryptedInstance.getAttributeByName("notificationKdfNonce")
		if (kdfNonce.isNull()) return null
		return validateKdfNonceLength(kdfNonce.asByteArray())
	}

	getNotificationOwnerGroup(): Nullable<Id> {
		const ownerGroup = this.encryptedInstance.getAttributeByName("notificationOwnerGroup")
		if (ownerGroup.isNull()) return null
		return ownerGroup.asId()
	}
}
