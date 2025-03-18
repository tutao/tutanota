import o from "@tutao/otest"
import { AttributeModel, resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import { ImportMailGetInTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { SomeEntity } from "../../../../../src/common/api/common/EntityTypes"
import { createTestEntity } from "../../../TestUtils"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper"
import { BucketKeyTypeRef, GroupInfoTypeRef, PermissionTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { InstanceWrapper } from "../../../../../src/common/api/worker/crypto/InstanceWrapper"
import { VersionedEncryptedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { PermissionType } from "../../../../../src/common/api/common/TutanotaConstants"

o.spec("InstanceWrapperTest", () => {
	const instanceMapper = new InstanceMapper()

	o.test("can create local mapped/decrypted instance - GroupInfo", async () => {
		const groupModel = await resolveTypeReference(GroupInfoTypeRef)

		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			_listEncSessionKey: stringToUtf8Uint8Array("listEncSessionKey"),
		})
		const groupInfoParsed = await instanceMapper.applyAttrIds(groupInfo)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, groupModel, groupInfoParsed)

		o(instanceWrapper.id).equals(null)
		o(instanceWrapper._ownerGroup).equals("ownerGroupId")
		o(instanceWrapper._ownerEncSessionKey).deepEquals({
			key: groupInfo._ownerEncSessionKey!,
			encryptingKeyVersion: 99,
		} satisfies VersionedEncryptedKey)
		o(instanceWrapper.permissionId).equals("permissionListId")
		o(instanceWrapper.listEncSessionKey).deepEquals(stringToUtf8Uint8Array("listEncSessionKey"))
	})

	o.test("can create local mapped/decrypted instance - Mail", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			bucketKey: createTestEntity(BucketKeyTypeRef, { _id: "bucketKey" }),
		})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		o(instanceWrapper.id).equals(null)
		o(instanceWrapper._ownerGroup).equals("ownerGroupId")
		o(instanceWrapper._ownerEncSessionKey).deepEquals({
			key: mail._ownerEncSessionKey!,
			encryptingKeyVersion: 99,
		} satisfies VersionedEncryptedKey)
		o(instanceWrapper.permissionId).equals("permissionListId")
		o(instanceWrapper.bucketKey).deepEquals(mail.bucketKey)
	})

	o.test("can create local mapped/decrypted data transfer instance", async () => {
		const importMailGetInModel = await resolveTypeReference(ImportMailGetInTypeRef)

		const importMailGetIn = createTestEntity(ImportMailGetInTypeRef, {
			// ownerGroup: "ownerGroupId", ownerGroupId is currently not used as MailGroup is hardcoded in CryptoFacade#resolveSessionKey
			ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			ownerKeyVersion: "99",
		})
		const importMailGetInParsed = await instanceMapper.applyAttrIds(importMailGetIn)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, importMailGetInModel, importMailGetInParsed)

		o(instanceWrapper.id).equals(null)
		o(instanceWrapper.ownerEncSessionKey).deepEquals({
			key: importMailGetIn.ownerEncSessionKey!,
			encryptingKeyVersion: 99,
		} satisfies VersionedEncryptedKey)
	})

	o.test("update permission public", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const pubPermission = createTestEntity(PermissionTypeRef, {
			type: PermissionType.Public,
		})

		instanceWrapper.updatePermission([pubPermission])
		o(instanceWrapper.publicOrExternalPermission).equals(pubPermission)
		o(instanceWrapper.symmetricOrPublicSymmetricPermission).equals(null)
	})

	o.test("update permission external", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const extPermission = createTestEntity(PermissionTypeRef, {
			type: PermissionType.External,
		})

		instanceWrapper.updatePermission([extPermission])
		o(instanceWrapper.publicOrExternalPermission).equals(extPermission)
		o(instanceWrapper.symmetricOrPublicSymmetricPermission).equals(null)
	})

	o.test("update permission symmetric", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const symPermission = createTestEntity(PermissionTypeRef, {
			type: PermissionType.Symmetric,
		})

		instanceWrapper.updatePermission([symPermission])
		o(instanceWrapper.publicOrExternalPermission).equals(null)
		o(instanceWrapper.symmetricOrPublicSymmetricPermission).equals(symPermission)
	})

	o.test("update permission public symmetric", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const pubSymPermission = createTestEntity(PermissionTypeRef, {
			type: PermissionType.Public_Symmetric,
		})

		instanceWrapper.updatePermission([pubSymPermission])
		o(instanceWrapper.publicOrExternalPermission).equals(null)
		o(instanceWrapper.symmetricOrPublicSymmetricPermission).equals(pubSymPermission)
	})
})
