import o from "@tutao/otest"
import {
	ConfigurationDatabase,
	ConfigurationMetaDataOS,
	encryptItem,
	initializeDb,
	loadEncryptionMetadata,
	updateEncryptionMetadata,
} from "../../../../../src/common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { downcast } from "@tutao/tutanota-utils"
import { DbStub } from "../search/DbStub.js"
import { ExternalImageRule } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { aes256RandomKey, aesDecrypt, aesEncrypt, AesKey, bitArrayToUint8Array, encryptKey, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { DbFacade, DbTransaction } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { Metadata } from "../../../../../src/common/api/worker/search/IndexTables.js"

import { VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"

o.spec("ConfigurationDbTest", function () {
	let keyLoaderFacade: KeyLoaderFacade

	o.beforeEach(function () {
		keyLoaderFacade = object()
	})

	function makeMocks(
		allowListTable: Array<{
			address: string
			rule?: ExternalImageRule
		}>,
	) {
		const key = aes256RandomKey()
		const iv = random.generateRandomData(IV_BYTE_LENGTH)
		const logins = downcast({
			getLoggedInUser() {
				return createTestEntity(UserTypeRef)
			},

			getUserGroupKey() {},
		})
		const loadDb = downcast(async function (user, keyLoaderFacade) {
			const stub = new DbStub()
			stub.addObjectStore("ExternalAllowListOS", false, "address")

			for (let entry of allowListTable) {
				const transaction = stub.createTransaction()
				const encryptedAddress = await encryptItem(entry.address, key, iv)
				await transaction.put("ExternalAllowListOS", null, {
					address: encryptedAddress,
					rule: entry.rule,
				})
			}

			return {
				db: stub,
				metaData: {
					key,
					iv,
				},
			}
		})
		return {
			logins,
			loadDb,
		}
	}

	o.spec("V1: External image allow list only", function () {
		o("read", async function () {
			const { logins, loadDb } = makeMocks([
				{
					address: "fomo@server.com",
				},
			])
			const configDb = new ConfigurationDatabase(keyLoaderFacade, logins, loadDb)
			const shouldBeAllow = await configDb.getExternalImageRule("fomo@server.com")
			o(shouldBeAllow).equals(ExternalImageRule.Allow)
			const shouldBeDefault = await configDb.getExternalImageRule("notinthere@neverseen.biz")
			o(shouldBeDefault).equals(ExternalImageRule.None)
		})
		o("write", async function () {
			const { logins, loadDb } = makeMocks([])
			const configDb = new ConfigurationDatabase(keyLoaderFacade, logins, loadDb)
			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Allow)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Allow)
			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.None)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.None)
		})
	})
	o.spec("V2: External image rules list", function () {
		o("read", async function () {
			const { logins, loadDb } = makeMocks([
				{
					address: "fomo@server.com",
					rule: ExternalImageRule.Allow,
				},
				{
					address: "lomo@server.com",
					rule: ExternalImageRule.Block,
				},
			])
			const configDb = new ConfigurationDatabase(keyLoaderFacade, logins, loadDb)
			const shouldBeAllow = await configDb.getExternalImageRule("fomo@server.com")
			o(shouldBeAllow).equals(ExternalImageRule.Allow)
			const shouldBeBlock = await configDb.getExternalImageRule("lomo@server.com")
			o(shouldBeBlock).equals(ExternalImageRule.Block)
			const shouldBeDefault = await configDb.getExternalImageRule("notinthere@neverseen.biz")
			o(shouldBeDefault).equals(ExternalImageRule.None)
		})
		o("write", async function () {
			const { logins, loadDb } = makeMocks([])
			const configDb = new ConfigurationDatabase(keyLoaderFacade, logins, loadDb)
			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Block)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Block)
			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.Allow)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.Allow)
			await configDb.addExternalImageRule("fomo@server.com", ExternalImageRule.None)
			o(await configDb.getExternalImageRule("fomo@server.com")).equals(ExternalImageRule.None)
		})
	})

	o.spec("Group key version in meta data", function () {
		let userFacade: UserFacade
		let dbFacade: DbFacade
		let transaction: DbTransaction
		let currentUserGroupKey: VersionedKey
		let dbKey: AesKey
		let iv: Uint8Array
		let encIv: Uint8Array

		o.beforeEach(function () {
			userFacade = object()
			dbFacade = object()
			transaction = object()
			when(dbFacade.createTransaction(matchers.anything(), matchers.anything())).thenResolve(transaction)
			currentUserGroupKey = { version: 42, object: aes256RandomKey() }
			when(keyLoaderFacade.getCurrentSymUserGroupKey()).thenReturn(currentUserGroupKey)
			dbKey = aes256RandomKey()
			iv = random.generateRandomData(16)
			encIv = aesEncrypt(dbKey, iv, undefined, true, true)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.encDbIv)).thenResolve(encIv)
		})

		o("write group key version when initializing", async function () {
			when(dbFacade.deleteDatabase(matchers.anything())).thenResolve()
			const transaction: DbTransaction = object()
			when(dbFacade.createTransaction(matchers.anything(), matchers.anything())).thenResolve(transaction)

			await initializeDb(dbFacade, "dbId", keyLoaderFacade, ConfigurationMetaDataOS)

			verify(keyLoaderFacade.getCurrentSymUserGroupKey())
			verify(transaction.put(ConfigurationMetaDataOS, Metadata.userGroupKeyVersion, currentUserGroupKey.version))
		})

		o("read group key version when opening database", async function () {
			const groupKeyVersion = 6
			const groupKey = aes256RandomKey()

			const encDBKey = aesEncrypt(groupKey, bitArrayToUint8Array(dbKey), iv, false, true)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userGroupKeyVersion)).thenResolve(groupKeyVersion)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userEncDbKey)).thenResolve(encDBKey)
			when(keyLoaderFacade.loadSymUserGroupKey(groupKeyVersion)).thenResolve(groupKey)

			const encryptionMetadata = await loadEncryptionMetadata(dbFacade, "dbId", keyLoaderFacade, ConfigurationMetaDataOS)

			verify(keyLoaderFacade.loadSymUserGroupKey(groupKeyVersion))
			o(encryptionMetadata?.key).deepEquals(dbKey)
			o(encryptionMetadata?.iv).deepEquals(iv)
		})

		o("write group key version when updating database", async function () {
			const oldGroupKey = { version: currentUserGroupKey.version - 1, object: aes256RandomKey() }
			when(keyLoaderFacade.loadSymUserGroupKey(oldGroupKey.version)).thenResolve(oldGroupKey.object)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userGroupKeyVersion)).thenResolve(oldGroupKey.version)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userEncDbKey)).thenResolve(encryptKey(oldGroupKey.object, dbKey))

			await updateEncryptionMetadata(dbFacade, keyLoaderFacade, ConfigurationMetaDataOS)

			verify(keyLoaderFacade.getCurrentSymUserGroupKey())
			verify(transaction.put(ConfigurationMetaDataOS, Metadata.userGroupKeyVersion, currentUserGroupKey.version))
			const encDbKeyCaptor = matchers.captor()
			verify(transaction.put(ConfigurationMetaDataOS, Metadata.userEncDbKey, encDbKeyCaptor.capture()))
			const capturedDbKey = aesDecrypt(currentUserGroupKey.object, encDbKeyCaptor.value, false)
			o(capturedDbKey).deepEquals(bitArrayToUint8Array(dbKey))
		})

		o("read group key version when without meta data entry", async function () {
			const groupKeyVersion = 0
			const groupKey = aes256RandomKey()

			const encDBKey = aesEncrypt(groupKey, bitArrayToUint8Array(dbKey), iv, false, true)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userGroupKeyVersion)).thenResolve(undefined)
			when(transaction.get(ConfigurationMetaDataOS, Metadata.userEncDbKey)).thenResolve(encDBKey)
			when(keyLoaderFacade.loadSymUserGroupKey(groupKeyVersion)).thenResolve(groupKey)

			const encryptionMetadata = await loadEncryptionMetadata(dbFacade, "dbId", keyLoaderFacade, ConfigurationMetaDataOS)
			verify(keyLoaderFacade.loadSymUserGroupKey(groupKeyVersion))
			o(encryptionMetadata?.key).deepEquals(dbKey)
			o(encryptionMetadata?.iv).deepEquals(iv)
		})
	})
})
