import o, { assertThrows } from "@tutao/otest"

import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver } from "../TestUtils"
import { stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import { EntityAdapter, InstancePipeline, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"

import { ImportMailGetInTypeRef, MailAddressTypeRef, MailTypeRef } from "@tutao/entities/tutanota"

import { BucketKey, BucketKeyTypeRef, GroupInfoTypeRef } from "@tutao/entities/sys"

o.spec("EntityAdapter", () => {
	let typeModelResolver: TypeModelResolver
	let instancePipeline: InstancePipeline

	o.beforeEach(() => {
		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
	})

	o.test("can create local mapped/decrypted instance - GroupInfo", async () => {
		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_id: undefined,
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			_kdfNonce: null,
			_listEncSessionKey: stringToUtf8Uint8Array("listEncSessionKey"),
			group: "someGroup",
		})
		const groupInfoParsed = await instancePipeline.mapAndEncryptToParsedInstance(GroupInfoTypeRef, groupInfo, null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(groupInfoParsed, instancePipeline.modelMapper, instancePipeline.cryptoMapper)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(groupInfo._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._kdfNonce).equals(groupInfo._kdfNonce!)
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter._listEncSessionKey).deepEquals(stringToUtf8Uint8Array("listEncSessionKey"))
	})

	o.test("can create local mapped/decrypted instance - Mail", async () => {
		const mail = createTestEntity(MailTypeRef, {
			_id: undefined,
			_ownerGroup: "ownerGroupId",
			_permissions: "permissionListId",
			_ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			_ownerKeyVersion: "99",
			_kdfNonce: null,
			bucketKey: createTestEntity(BucketKeyTypeRef, {
				_id: "bucketKey",
			}),
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})

		const mailParsed = await instancePipeline.mapAndEncryptToParsedInstance(MailTypeRef, mail, null)
		const mailBucketKey = await instancePipeline.decryptAndMapEncryptedInstance<BucketKey>(mailParsed.getAttributeById(1310).asNestedObjList()[0], null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(mailParsed, instancePipeline.modelMapper, instancePipeline.cryptoMapper)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter._ownerGroup).equals("ownerGroupId")
		o(entityAdapter._ownerEncSessionKey).equals(mail._ownerEncSessionKey!)
		o(entityAdapter._ownerKeyVersion).equals("99")
		o(entityAdapter._kdfNonce).equals(mail._kdfNonce!)
		o(entityAdapter._permissions).equals("permissionListId")
		o(entityAdapter.bucketKey).deepEquals(mailBucketKey as BucketKey)
	})

	o.test("can create local mapped/decrypted data transfer instance", async () => {
		const importMailGetIn = createTestEntity(ImportMailGetInTypeRef, {
			ownerGroup: "ownerGroupId", // ownerGroupId is currently not used as MailGroup is hardcoded in CryptoFacade#resolveSessionKey
			targetMailFolder: ["folderList", "folderId"],
			ownerEncSessionKey: stringToUtf8Uint8Array("ownerEncSessionKey"),
			ownerKeyVersion: "99",
		})
		const importMailGetInParsed = await instancePipeline.mapAndEncryptToParsedInstance(ImportMailGetInTypeRef, importMailGetIn, null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(
			importMailGetInParsed,
			instancePipeline.modelMapper,
			instancePipeline.cryptoMapper,
		)

		await assertThrows(Error, () => Promise.resolve(entityAdapter._id))
		o(entityAdapter.ownerEncSessionKey).equals(importMailGetIn.ownerEncSessionKey!)
		o(entityAdapter.ownerKeyVersion).equals("99")
	})

	o.test("set _ownerEncSessionKey", async () => {
		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})

		const mailParsed = await instancePipeline.mapAndEncryptToParsedInstance(MailTypeRef, mail, null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(mailParsed, instancePipeline.modelMapper, instancePipeline.cryptoMapper)

		const ownerEncSk: Uint8Array = new Uint8Array([1, 2, 3])

		o(entityAdapter._ownerEncSessionKey).equals(null)
		o(entityAdapter._ownerKeyVersion).equals(null)

		entityAdapter._ownerEncSessionKey = ownerEncSk
		entityAdapter._ownerKeyVersion = "99"

		o(entityAdapter._ownerEncSessionKey).equals(ownerEncSk)
		o(entityAdapter._ownerKeyVersion).equals("99")
	})

	o.test("set _kdfNonce", async () => {
		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})

		const mailParsed = await instancePipeline.mapAndEncryptToParsedInstance(MailTypeRef, mail, null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(mailParsed, instancePipeline.modelMapper, instancePipeline.cryptoMapper)

		const kdfNonce: Uint8Array = new Uint8Array([3, 4, 5])

		o(entityAdapter._kdfNonce).equals(null)

		entityAdapter._kdfNonce = kdfNonce

		o(entityAdapter._kdfNonce).equals(kdfNonce)
	})

	o.test("set _ownerGroup", async () => {
		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, { name: "a", address: "a@a.a" }),
			conversationEntry: ["list", "element"],
		})
		const mailParsed = await instancePipeline.mapAndEncryptToParsedInstance(MailTypeRef, mail, null)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(mailParsed, instancePipeline.modelMapper, instancePipeline.cryptoMapper)

		const ownerGroupId = "ownerGroupId"
		o(entityAdapter._ownerGroup).equals(null)
		entityAdapter._ownerGroup = ownerGroupId

		o(entityAdapter._ownerGroup).equals(ownerGroupId)
	})
})
