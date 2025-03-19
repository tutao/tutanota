import o from "@tutao/otest"
import { AttributeModel, resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import { ImportMailGetInTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../../TestUtils"
import { assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper"
import { BucketKeyTypeRef, GroupInfoTypeRef, GroupTypeRef, PermissionTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { InstanceWrapper } from "../../../../../src/common/api/worker/crypto/InstanceWrapper"
import { VersionedEncryptedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { PermissionType } from "../../../../../src/common/api/common/TutanotaConstants"
import { EncryptedParsedInstance, ParsedInstance, UntypedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { aes256RandomKey } from "@tutao/tutanota-crypto"

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

	o.test("set _ownerEncSessionKey", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const ownerEncSk: VersionedEncryptedKey = {
			encryptingKeyVersion: 99,
			key: new Uint8Array([1, 2, 3]),
		}

		const ownerEncSessionKeyFieldId = assertNotNull(AttributeModel.getAttributeId(mailModel, "_ownerEncSessionKey"))?.toString()
		const ownerEncSessionKeyVersionFieldId = assertNotNull(AttributeModel.getAttributeId(mailModel, "_ownerEncSessionKeyVersion"))?.toString()

		o(instanceWrapper.ownerEncSessionKey).equals(null)
		o(instanceWrapper.instance[ownerEncSessionKeyFieldId]).equals(null)
		o(instanceWrapper.instance[ownerEncSessionKeyVersionFieldId]).equals(null)

		instanceWrapper.set_ownerEncSessionKey(ownerEncSk)

		o(instanceWrapper.ownerEncSessionKey).equals(ownerEncSk)
		o(instanceWrapper.instance[ownerEncSessionKeyFieldId]).equals(ownerEncSk.key)
		o(instanceWrapper.instance[ownerEncSessionKeyVersionFieldId]).equals(ownerEncSk.encryptingKeyVersion.toString())
	})

	o.test("set _ownerGroup", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)

		const ownerGroupId = "ownerGroupId"

		const ownerGroupFieldId = assertNotNull(AttributeModel.getAttributeId(mailModel, "_ownerGroup"))?.toString()

		o(instanceWrapper._ownerGroup).equals(null)
		o(instanceWrapper.instance[ownerGroupFieldId]).equals(null)

		instanceWrapper.set_ownerGroup(ownerGroupId)

		o(instanceWrapper._ownerGroup).equals(ownerGroupId)
		o(instanceWrapper.instance[ownerGroupFieldId]).equals(ownerGroupId)
	})

	o.test("toWireFormat roundtrip", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {
			_ownerGroup: "ownerGroupId",
		})
		const sk = aes256RandomKey()

		const mailParsed = await instanceMapper.applyAttrIds(mail)
		const instanceWrapperFromInstance = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsed)
		instanceWrapperFromInstance.setResolvedSessionKey(sk)
		const wireFormatFromInstance = await instanceWrapperFromInstance.toWireFormat()

		const untyptedInstance: UntypedInstance = JSON.parse(wireFormatFromInstance)
		const encryptedParsedInstance: EncryptedParsedInstance = instanceMapper.applyJsTypes(untyptedInstance, mailModel)
		const instanceWrapperFromEncParsed = await InstanceWrapper.fromEncryptedParsedInstance(instanceMapper, mailModel, encryptedParsedInstance)
		instanceWrapperFromEncParsed.setResolvedSessionKey(sk)
		const wireFormatFromEncParsed = await instanceWrapperFromEncParsed.toWireFormat()

		o(wireFormatFromInstance).deepEquals(wireFormatFromEncParsed)

		o(await instanceWrapperFromEncParsed.provideDecryptedInstance()).deepEquals(mail)
	})

	o.test("update ServerPath for ElementType", async () => {
		const groupModel = await resolveTypeReference(GroupTypeRef)
		const group = createTestEntity(GroupTypeRef, { _id: "groupId" })

		const groupParsedInstance: ParsedInstance = await instanceMapper.applyServerModel(group)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, groupModel, groupParsedInstance)

		const serverPath = await instanceWrapper.getInstanceUpdateServerPath()
		o(serverPath).equals(`/rest/sys/group/groupId`)
	})

	o.test("update ServerPath for ListElementType", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)
		const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "mailId"] })

		const mailParsedInstance: ParsedInstance = await instanceMapper.applyServerModel(mail)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(instanceMapper, mailModel, mailParsedInstance)

		const serverPath = await instanceWrapper.getInstanceUpdateServerPath()
		o(serverPath).equals(`/rest/tutanota/mail/mailListId/mailId`)
	})
})
