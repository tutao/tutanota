import { OfflineMigration } from "../OfflineStorageMigrator.js"
import { OfflineStorage } from "../OfflineStorage.js"
import { SqlCipherFacade } from "../../../../native/common/generatedipc/SqlCipherFacade.js"
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
	PermissionTypeRef,
	PushIdentifierTypeRef,
	ReceivedGroupInvitationTypeRef,
	SessionTypeRef,
	UserAlarmInfoTypeRef,
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
	renameAttribute,
} from "../StandardMigrations.js"
import { ElementEntity, ListElementEntity, SomeEntity } from "../../../common/EntityTypes.js"
import { TypeRef } from "@tutao/tutanota-utils"

export const sys96: OfflineMigration = {
	app: "sys",
	version: 96,
	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		const encryptedElementTypes: Array<TypeRef<ElementEntity>> = [
			AccountingInfoTypeRef,
			CustomerServerPropertiesTypeRef,
			InvoiceTypeRef,
			MissedNotificationTypeRef,
		]
		const encryptedListElementTypes: Array<TypeRef<ListElementEntity>> = [
			GroupInfoTypeRef,
			AuditLogEntryTypeRef,
			SessionTypeRef,
			WhitelabelChildTypeRef,
			OrderProcessingAgreementTypeRef,
			UserAlarmInfoTypeRef,
			ReceivedGroupInvitationTypeRef,
			GiftCardTypeRef,
			PushIdentifierTypeRef,
			PermissionTypeRef,
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
			addValue("groupKeyVersion", 0),
			addAdminGroupKeyVersion(),
		])

		await migrateAllElements(UserTypeRef, storage, [addVersionsToGroupMemberships()])

		await migrateAllListElements(ReceivedGroupInvitationTypeRef, storage, [addValue("sharedGroupKeyVersion", 0)])
	},
}

function addVersionsToGroupMemberships<T extends SomeEntity>(): Migration<T> {
	return function (entity) {
		const userGroupMembership = entity["userGroup"]
		userGroupMembership["groupKeyVersion"] = 0
		userGroupMembership["symKeyVersion"] = 0
		for (const membership of entity["memberships"]) {
			membership["groupKeyVersion"] = 0
			membership["symKeyVersion"] = 0
		}
		return entity
	}
}

function addAdminGroupKeyVersion<T extends SomeEntity>(): Migration<T> {
	return function (entity) {
		entity["adminGroupKeyVersion"] = entity["adminGroupEncGKey"] == null ? null : 0
		return entity
	}
}

function removeKeyPairVersion<T extends SomeEntity>(): Migration<T> {
	return function (entity) {
		const currentKeys = entity["currentKeys"]
		delete currentKeys["version"]
		return entity
	}
}
