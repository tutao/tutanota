import o from "@tutao/otest"
import { InstanceSessionKeyTypeRef, TypeInfoTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils"
import { InstanceSessionKeysCache } from "../../../../../src/common/api/worker/facades/InstanceSessionKeysCache"
import { Mail, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"

o.spec("InstanceSessionKeysCacheTest", function () {
	let instanceSessionKeysCache: InstanceSessionKeysCache
	let testMail: Mail

	o.beforeEach(function () {
		instanceSessionKeysCache = new InstanceSessionKeysCache()
		testMail = createTestEntity(MailTypeRef, { _id: ["mailBagMailListId", "mailElementId"] })
	})

	o.spec("put and get", function () {
		o("get - not present returns null", async function () {
			o(instanceSessionKeysCache.get(testMail)).equals(null)
		})

		o("put and get success", async function () {
			const mailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			instanceSessionKeysCache.put(testMail, mailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(mailInstanceSessionKeys)
		})

		o("delete works", async function () {
			const mailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			instanceSessionKeysCache.put(testMail, mailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(mailInstanceSessionKeys)
			instanceSessionKeysCache.delete(testMail)
			o(instanceSessionKeysCache.get(testMail)).equals(null)
		})

		o("put does update existing key", async function () {
			const mailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			instanceSessionKeysCache.put(testMail, mailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(mailInstanceSessionKeys)

			const updatedMailInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3, 4, 5]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([6, 7, 8, 9, 10]),
				}),
			]

			instanceSessionKeysCache.put(testMail, updatedMailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(updatedMailInstanceSessionKeys)
		})
	})
})
