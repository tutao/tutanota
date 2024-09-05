import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import {
	AccountingInfoTypeRef,
	AuditLogEntryTypeRef,
	CustomerServerPropertiesTypeRef,
	GiftCardTypeRef,
	GroupInfoTypeRef,
	GroupTypeRef,
	InvoiceTypeRef,
	MissedNotificationTypeRef,
	OrderProcessingAgreementTypeRef,
	PushIdentifierTypeRef,
	ReceivedGroupInvitationTypeRef,
	RecoverCodeTypeRef,
	UserAlarmInfoTypeRef,
	UserGroupRootTypeRef,
	UserTypeRef,
	WhitelabelChildTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import {
	addOwnerKeyVersion,
	addValue,
	changeCardinalityFromAnyToZeroOrOne,
	migrateAllElements,
	migrateAllListElements,
	Migration,
	removeValue,
	renameAttribute,
} from "../StandardMigrations.js"
import { ElementEntity, ListElementEntity } from "../../../common/EntityTypes.js"
import { TypeRef } from "@tutao/tutanota-utils"

export const sys96: OfflineMigration = {
	app: "sys",
	version: 96,
	async migrate(storage: OfflineStorage) {
		const encryptedElementTypes: Array<TypeRef<ElementEntity>> = [
			AccountingInfoTypeRef,
			CustomerServerPropertiesTypeRef,
			InvoiceTypeRef,
			MissedNotificationTypeRef,
		]
		const encryptedListElementTypes: Array<TypeRef<ListElementEntity>> = [
			GroupInfoTypeRef,
			AuditLogEntryTypeRef,
			WhitelabelChildTypeRef,
			OrderProcessingAgreementTypeRef,
			UserAlarmInfoTypeRef,
			ReceivedGroupInvitationTypeRef,
			GiftCardTypeRef,
			PushIdentifierTypeRef,
		]

		for (const type of encryptedElementTypes) {
			await migrateAllElements(type, storage, [addOwnerKeyVersion()])
		}
		for (const type of encryptedListElementTypes) {
			await migrateAllListElements(type, storage, [addOwnerKeyVersion()])
		}

		await migrateAllElements(GroupTypeRef, storage, [
			renameAttribute("keys", "currentKeys"),
			changeCardinalityFromAnyToZeroOrOne("currentKeys"),
			removeKeyPairVersion(),
			addValue("formerGroupKeys", null),
			addValue("pubAdminGroupEncGKey", null),
			addValue("groupKeyVersion", "0"),
			addAdminGroupKeyVersion(),
		])

		await migrateAllElements(UserTypeRef, storage, [addVersionsToGroupMemberships(), removeValue("userEncClientKey")])
		await migrateAllListElements(ReceivedGroupInvitationTypeRef, storage, [addValue("sharedGroupKeyVersion", "0")])
		await migrateAllElements(RecoverCodeTypeRef, storage, [addValue("userKeyVersion", "0")])
		await migrateAllElements(UserGroupRootTypeRef, storage, [addValue("keyRotations", null)])
	},
}

function addVersionsToGroupMemberships(): Migration {
	return function (entity) {
		const userGroupMembership = entity["userGroup"]
		userGroupMembership["groupKeyVersion"] = "0"
		userGroupMembership["symKeyVersion"] = "0"
		for (const membership of entity["memberships"]) {
			membership["groupKeyVersion"] = "0"
			membership["symKeyVersion"] = "0"
		}
		return entity
	}
}

function addAdminGroupKeyVersion(): Migration {
	return function (entity) {
		entity["adminGroupKeyVersion"] = entity["adminGroupEncGKey"] == null ? null : "0"
		return entity
	}
}

function removeKeyPairVersion(): Migration {
	return function (entity) {
		const currentKeys = entity["currentKeys"]
		if (currentKeys) {
			delete currentKeys["version"]
		}
		return entity
	}
}
