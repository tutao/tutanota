import o from "@tutao/otest"
import { ImportMailGetInTypeRef, MailAddressTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver } from "../../../TestUtils"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { BucketKey, BucketKeyTypeRef, GroupInfoTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { EntityAdapter } from "../../../../../src/common/api/worker/crypto/EntityAdapter"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("EntityAdapter", () => {
	let typeModelResolver: TypeModelResolver
	let instancePipeline: InstancePipeline

	o.beforeEach(() => {
		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
	})

	o.test("can create local mapped/decrypted instance - GroupInfo", async () => {
		const groupModel = await typeModelResolver.resolveClientTypeReference(GroupInfoTypeRef)

		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_id: undefined,
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			_listEncSessionKey: stringToUtf8Uint8Array("listEncSessionKey"),
			group: "somegroup",
		})
		const groupInfoParsed = await instancePipeline.modelMapper.mapToClientModelParsedInstance(GroupInfoTypeRef, groupInfo)
		const entityAdapter = await EntityAdapter.from(groupModel, groupInfoParsed, instancePipeline)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(groupInfo._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter._listEncSessionKey).deepEquals(stringToUtf8Uint8Array("listEncSessionKey"))
	})

	o.test("can create local mapped/decrypted instance - Mail", async () => {
		const mailModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {
			_id: undefined,
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			bucketKey: createTestEntity(BucketKeyTypeRef, {
				_id: "bucketKey",
			}),
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})

		const mailParsed = await instancePipeline.modelMapper.mapToClientModelParsedInstance(MailTypeRef, mail)
		const mailBucketKey = await instancePipeline.modelMapper.mapToInstance(BucketKeyTypeRef, mailParsed["1310"]![0])
		const entityAdapter = await EntityAdapter.from(mailModel, mailParsed, instancePipeline)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(mail._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter.bucketKey).deepEquals(mailBucketKey as BucketKey)
	})

	o.test("can create local mapped/decrypted data transfer instance", async () => {
		const importMailGetInModel = await typeModelResolver.resolveClientTypeReference(ImportMailGetInTypeRef)

		const importMailGetIn = createTestEntity(ImportMailGetInTypeRef, {
			ownerGroup: "ownerGroupId", // ownerGroupId is currently not used as MailGroup is hardcoded in CryptoFacade#resolveSessionKey
			targetMailFolder: ["folderlist", "folderId"],
			ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			ownerKeyVersion: "99",
		})
		const importMailGetInParsed = await instancePipeline.modelMapper.mapToClientModelParsedInstance(ImportMailGetInTypeRef, importMailGetIn)
		const entityAdapter = await EntityAdapter.from(importMailGetInModel, importMailGetInParsed, instancePipeline)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter.ownerEncSessionKey).equals(importMailGetIn.ownerEncSessionKey!)
		o(entityAdapter.ownerKeyVersion).equals("99")
	})

	o.test("set _ownerEncSessionKey", async () => {
		const mailModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})

		const mailParsed = await instancePipeline.modelMapper.mapToClientModelParsedInstance(MailTypeRef, mail)
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
		const mailModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})
		const mailParsed = await instancePipeline.modelMapper.mapToClientModelParsedInstance(MailTypeRef, mail)
		const entityAdapter = await EntityAdapter.from(mailModel, mailParsed, instancePipeline)

		const ownerGroupId = "ownerGroupId"
		o(entityAdapter._ownerGroup).equals(null)
		entityAdapter._ownerGroup = ownerGroupId

		o(entityAdapter._ownerGroup).equals(ownerGroupId)
	})
})
