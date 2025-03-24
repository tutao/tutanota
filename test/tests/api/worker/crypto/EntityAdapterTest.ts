import o from "@tutao/otest"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import { ImportMailGetInTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../../TestUtils"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { BucketKeyTypeRef, GroupInfoTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { EntityAdapter } from "../../../../../src/common/api/worker/crypto/EntityAdapter"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"

o.spec("EntityAdapter", () => {
	const instancePipeline = new InstancePipeline(resolveTypeReference, resolveTypeReference)

	o.test("can create local mapped/decrypted instance - GroupInfo", async () => {
		const groupModel = await resolveTypeReference(GroupInfoTypeRef)

		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			_listEncSessionKey: stringToUtf8Uint8Array("listEncSessionKey"),
		})
		const groupInfoParsed = await instancePipeline.modelMapper.applyServerModel(GroupInfoTypeRef, groupInfo)
		const entityAdapter = await EntityAdapter.from(groupModel, groupInfoParsed, instancePipeline)

		o(entityAdapter._id).equals(null)
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(groupInfo._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter._listEncSessionKey).deepEquals(stringToUtf8Uint8Array("listEncSessionKey"))
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

		const mailParsed = await instancePipeline.modelMapper.applyServerModel(MailTypeRef, mail)
		const entityAdapter = await EntityAdapter.from(mailModel, mailParsed, instancePipeline)

		o(entityAdapter._id).equals(null)
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(mail._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter.bucketKey).deepEquals(mail.bucketKey)
	})

	o.test("can create local mapped/decrypted data transfer instance", async () => {
		const importMailGetInModel = await resolveTypeReference(ImportMailGetInTypeRef)

		const importMailGetIn = createTestEntity(ImportMailGetInTypeRef, {
			// ownerGroup: "ownerGroupId", ownerGroupId is currently not used as MailGroup is hardcoded in CryptoFacade#resolveSessionKey
			ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			ownerKeyVersion: "99",
		})
		const importMailGetInParsed = await instancePipeline.modelMapper.applyServerModel(ImportMailGetInTypeRef, importMailGetIn)
		const entityAdapter = await EntityAdapter.from(importMailGetInModel, importMailGetInParsed, instancePipeline)
		o(entityAdapter._id).equals(null)
		o(entityAdapter._ownerEncSessionKey).equals(importMailGetIn.ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
	})

	o.test("set _ownerEncSessionKey", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})

		const mailParsed = await instancePipeline.modelMapper.applyServerModel(MailTypeRef, mail)
		const entityAdapter = await EntityAdapter.from(mailModel, mailParsed, instancePipeline)

		const ownerEncSk: Uint8Array = new Uint8Array([1, 2, 3])

		o(entityAdapter._ownerEncSessionKey).equals(null)
		o(entityAdapter._ownerKeyVersion).equals(null)

		entityAdapter._ownerEncSessionKey = ownerEncSk
		entityAdapter._ownerKeyVersion = "99"

		o(entityAdapter._ownerEncSessionKey).equals(ownerEncSk)
		o(entityAdapter._ownerKeyVersion).equals("99")
	})

	o.test("set _ownerGroup", async () => {
		const mailModel = await resolveTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {})
		const mailParsed = await instancePipeline.modelMapper.applyServerModel(MailTypeRef, mail)
		const entityAdapter = await EntityAdapter.from(mailModel, mailParsed, instancePipeline)

		const ownerGroupId = "ownerGroupId"
		o(entityAdapter._ownerGroup).equals(null)
		entityAdapter._ownerGroup = ownerGroupId

		o(entityAdapter._ownerGroup).equals(ownerGroupId)
	})
})
