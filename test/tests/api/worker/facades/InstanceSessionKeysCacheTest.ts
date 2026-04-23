import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils"
import { InstanceSessionKeysCache } from "../../../../../src/crypto/app-support/InstanceSessionKeysCache"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"

o.spec("InstanceSessionKeysCacheTest", function () {
	let instanceSessionKeysCache: InstanceSessionKeysCache
	let testMail: tutanotaTypeRefs.Mail

	o.beforeEach(function () {
		instanceSessionKeysCache = new InstanceSessionKeysCache()
		testMail = createTestEntity(tutanotaTypeRefs.MailTypeRef, { _id: ["mailBagMailListId", "mailElementId"] })
	})

	o.spec("put and get", function () {
		o("get - not present returns null", async function () {
			o(instanceSessionKeysCache.get(testMail)).equals(null)
		})

		o("put and get success", async function () {
			const mailInstanceSessionKeys = [
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			instanceSessionKeysCache.put(testMail, mailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(mailInstanceSessionKeys)
		})

		o("delete works", async function () {
			const mailInstanceSessionKeys = [
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
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
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			instanceSessionKeysCache.put(testMail, mailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(mailInstanceSessionKeys)

			const updatedMailInstanceSessionKeys = [
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3, 4, 5]),
				}),
				createTestEntity(sysTypeRefs.InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(sysTypeRefs.TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([6, 7, 8, 9, 10]),
				}),
			]

			instanceSessionKeysCache.put(testMail, updatedMailInstanceSessionKeys)
			o(instanceSessionKeysCache.get(testMail)).deepEquals(updatedMailInstanceSessionKeys)
		})
	})
})
