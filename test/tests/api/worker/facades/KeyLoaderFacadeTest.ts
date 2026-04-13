import o, { assertThrows } from "@tutao/otest"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import {
	aes256RandomKey,
	aesEncrypt,
	AesKey,
	encryptKey,
	encryptRsaKey,
	encryptX25519Key,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	PQKeyPairs,
	RsaKeyPair,
	rsaPublicKeyToHex,
} from "@tutao/crypto"
import { stringToCustomId } from "@tutao/utils"
import { createTestEntity } from "../../../TestUtils.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { matchers, object, reset, verify, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { cryptoUtils } from "@tutao/crypto"
import { freshVersioned, hexToUint8Array, KeyVersion } from "@tutao/utils"
import { KeyCache } from "../../../../../src/common/api/worker/facades/KeyCache.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { CryptoWrapper, VersionedKey } from "@tutao/instancePipeline"
import { CryptoError } from "@tutao/crypto/error"
import { RSA_TEST_KEYPAIR } from "./RsaPqPerformanceTest.js"
import { loadLibOQSWASM } from "../../../crypto/WebAssemblyTestUtils"
import { sysTypeRefs } from "@tutao/typeRefs"

o.spec("KeyLoaderFacadeTest", function () {
	let keyCache: KeyCache
	let userFacade: UserFacade
	let entityClient: EntityClient
	let cacheManagementFacade: CacheManagementFacade
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade

	let group: sysTypeRefs.Group
	let userGroup: sysTypeRefs.Group
	let currentKeys: sysTypeRefs.KeyPair | null = null
	let formerKeys: sysTypeRefs.GroupKey[]
	let formerKeysDecrypted: AesKey[]
	let currentGroupKey: VersionedKey
	let userGroupKey: VersionedKey
	let currentGroupKeyVersion: KeyVersion
	let formerKeyPairsDecrypted: PQKeyPairs[]
	const FORMER_KEYS_LENGTH = 2
	let currentKeyPair: PQKeyPairs
	let membership: sysTypeRefs.GroupMembership
	let cryptoWrapper: CryptoWrapper

	o.beforeEach(async () => {
		keyCache = new KeyCache()
		userFacade = object()
		entityClient = object()
		cacheManagementFacade = object()
		pqFacade = new PQFacade(new WASMKyberFacade(await loadLibOQSWASM()))
		cryptoWrapper = object()
		keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, async () => cacheManagementFacade, cryptoWrapper)

		formerKeys = []
		formerKeyPairsDecrypted = []
		formerKeysDecrypted = []
		for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
			formerKeysDecrypted.push(aes256RandomKey())
			formerKeyPairsDecrypted.push(await pqFacade.generateKeyPairs())
		}

		currentGroupKeyVersion = formerKeysDecrypted.length as KeyVersion
		currentGroupKey = { object: aes256RandomKey(), version: currentGroupKeyVersion }

		let lastKey = currentGroupKey.object

		for (let i = formerKeysDecrypted.length - 1; i >= 0; i--) {
			const key: sysTypeRefs.GroupKey = createTestEntity(sysTypeRefs.GroupKeyTypeRef)
			key._id = ["list", stringToCustomId(i.toString())]
			key.ownerEncGKey = encryptKey(lastKey, formerKeysDecrypted[i])
			const pqKeyPair = formerKeyPairsDecrypted[i]

			key.keyPair = createTestEntity(sysTypeRefs.KeyPairTypeRef, {
				pubEccKey: pqKeyPair.x25519KeyPair.publicKey,
				pubKyberKey: kyberPublicKeyToBytes(pqKeyPair.kyberKeyPair.publicKey),
				symEncPrivEccKey: encryptX25519Key(formerKeysDecrypted[i], pqKeyPair.x25519KeyPair.privateKey),
				symEncPrivKyberKey: aesEncrypt(formerKeysDecrypted[i], kyberPrivateKeyToBytes(pqKeyPair.kyberKeyPair.privateKey)),
			})
			lastKey = formerKeysDecrypted[i]
			formerKeys.unshift(key)
		}
		currentKeyPair = await pqFacade.generateKeyPairs()

		currentKeys = createTestEntity(sysTypeRefs.KeyPairTypeRef, {
			pubEccKey: currentKeyPair.x25519KeyPair.publicKey,
			symEncPrivEccKey: encryptX25519Key(currentGroupKey.object, currentKeyPair.x25519KeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(currentKeyPair.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(currentGroupKey.object, kyberPrivateKeyToBytes(currentKeyPair.kyberKeyPair.privateKey)),
			pubRsaKey: null,
			symEncPrivRsaKey: null,
		})
		group = createTestEntity(sysTypeRefs.GroupTypeRef, {
			_id: "my group",
			currentKeys,
			formerGroupKeys: createTestEntity(sysTypeRefs.GroupKeysRefTypeRef, { list: "list" }),
			groupKeyVersion: String(currentGroupKeyVersion),
		})
		userGroupKey = freshVersioned(aes256RandomKey())
		userGroup = createTestEntity(sysTypeRefs.GroupTypeRef, {
			_id: "my userGroup",
			groupKeyVersion: String(userGroupKey.version),
			formerGroupKeys: createTestEntity(sysTypeRefs.GroupKeysRefTypeRef),
			identityKeyPair: null,
		})

		membership = createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
			group: group._id,
			symKeyVersion: String(userGroupKey.version),
			symEncGKey: encryptKey(userGroupKey.object, currentGroupKey.object),
			groupKeyVersion: String(currentGroupKey.version),
		})
		when(userFacade.getCurrentUserGroupKey()).thenReturn(userGroupKey)
		when(userFacade.getMembership(group._id)).thenReturn(membership)
		when(userFacade.getUserGroupId()).thenReturn(userGroup._id)
		when(entityClient.load(sysTypeRefs.GroupTypeRef, group._id)).thenResolve(group)
		for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
			when(
				entityClient.loadRange(
					sysTypeRefs.GroupKeyTypeRef,
					group.formerGroupKeys!.list,
					stringToCustomId(String(currentGroupKeyVersion)),
					FORMER_KEYS_LENGTH - i,
					true,
				),
			).thenDo(() => formerKeys.slice(i).reverse()) // create a fresh copy because we modify in place
		}
	})

	o.spec("getCurrentSymGroupKey", function () {
		o("getting userGroup key", async function () {
			const currentUserGroupKey = await keyLoaderFacade.getCurrentSymGroupKey(userGroup._id)
			o(currentUserGroupKey.version).equals(cryptoUtils.parseKeyVersion(userGroup.groupKeyVersion))
			o(currentUserGroupKey.object).deepEquals(userGroupKey.object)
			verify(userFacade.getMembership(matchers.anything()), { times: 0 })
			await keyLoaderFacade.getCurrentSymGroupKey(userGroup._id)
			verify(userFacade.getCurrentUserGroupKey(), { times: 2 }) // should not be cached
		})

		o("getting non-userGroup key", async function () {
			const groupKey = await keyLoaderFacade.getCurrentSymGroupKey(group._id)
			o(groupKey.version).equals(cryptoUtils.parseKeyVersion(group.groupKeyVersion))
			o(groupKey.object).deepEquals(currentGroupKey.object)
			verify(userFacade.getMembership(group._id))
			reset()
			// the key is now cached -> no need to get the membership
			await keyLoaderFacade.getCurrentSymGroupKey(group._id)
			verify(userFacade.getMembership(matchers.anything()), { times: 0 })
		})
	})

	o.spec("load all former key pairs", function () {
		o.beforeEach(function () {
			when(entityClient.loadAll(sysTypeRefs.GroupKeyTypeRef, group.formerGroupKeys.list)).thenResolve(formerKeys)
		})
		o("success as user", async function () {
			const keyPairs = await keyLoaderFacade.loadAllFormerKeyPairs(group)
			o(keyPairs.length).equals(FORMER_KEYS_LENGTH)
			for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
				o(keyPairs[i]).deepEquals({
					object: formerKeyPairsDecrypted[i],
					version: cryptoUtils.checkKeyVersionConstraints(i),
				})
			}
		})
		o("success as admin", async function () {
			keyCache.reset()
			when(userFacade.getMembership(group._id)).thenThrow(new Error("should not be called"))
			const keyPairs = await keyLoaderFacade.loadAllFormerKeyPairs(group, currentGroupKey)
			o(keyPairs.length).equals(FORMER_KEYS_LENGTH)
			for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
				o(keyPairs[i]).deepEquals({
					object: formerKeyPairsDecrypted[i],
					version: cryptoUtils.checkKeyVersionConstraints(i),
				})
			}
		})
	})

	o.spec("loadKeyPair", function () {
		o("loads current key.", async function (): Promise<void> {
			for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, currentGroupKeyVersion)) as PQKeyPairs
				o(keypair).deepEquals(currentKeyPair)
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("loads former key.", async function (): Promise<void> {
			for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, i as KeyVersion)) as PQKeyPairs
				o(keypair).deepEquals(formerKeyPairsDecrypted[i])
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("load key pair when group is updated in cache but key cache still has the old sym key", async function () {
			const requestedVersion = cryptoUtils.checkKeyVersionConstraints(currentGroupKeyVersion - 1)
			when(entityClient.load(sysTypeRefs.GroupKeyTypeRef, [group.formerGroupKeys.list, stringToCustomId(String(requestedVersion))])).thenResolve(
				formerKeys[requestedVersion],
			)
			await keyCache.getCurrentGroupKey(group._id, () =>
				Promise.resolve({
					version: requestedVersion,
					object: formerKeysDecrypted[requestedVersion],
				}),
			)
			const keypair = (await keyLoaderFacade.loadKeypair(group._id, requestedVersion)) as PQKeyPairs
			o(keypair).deepEquals(formerKeyPairsDecrypted[requestedVersion])
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("rsa key pair in version > 0 is rejected", async function () {
			currentGroupKey.version = 1
			group.groupKeyVersion = String(currentGroupKey.version)
			group.currentKeys = sysTypeRefs.createKeyPair({
				pubEccKey: currentKeyPair.x25519KeyPair.publicKey,
				symEncPrivEccKey: encryptX25519Key(currentGroupKey.object, currentKeyPair.x25519KeyPair.privateKey),
				pubKyberKey: null,
				symEncPrivKyberKey: null,
				symEncPrivRsaKey: encryptRsaKey(currentGroupKey.object, RSA_TEST_KEYPAIR.privateKey),
				pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
				signature: null,
			})
			keyCache = object()
			keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, async () => cacheManagementFacade, cryptoWrapper)
			when(entityClient.load(sysTypeRefs.GroupTypeRef, group._id)).thenResolve(group)
			when(keyCache.getCurrentGroupKey(group._id, matchers.anything())).thenResolve(currentGroupKey)

			await assertThrows(CryptoError, async () => keyLoaderFacade.loadKeypair(group._id, currentGroupKey.version))
		})

		o("rsa key pair in version  0 is loaded", async function () {
			currentGroupKey.version = 0
			group.groupKeyVersion = String(currentGroupKey.version)
			group.currentKeys = sysTypeRefs.createKeyPair({
				pubEccKey: currentKeyPair.x25519KeyPair.publicKey,
				symEncPrivEccKey: encryptX25519Key(currentGroupKey.object, currentKeyPair.x25519KeyPair.privateKey),
				pubKyberKey: null,
				symEncPrivKyberKey: null,
				symEncPrivRsaKey: encryptRsaKey(currentGroupKey.object, RSA_TEST_KEYPAIR.privateKey),
				pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
				signature: null,
			})
			keyCache = object()
			keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, async () => cacheManagementFacade, cryptoWrapper)
			when(entityClient.load(sysTypeRefs.GroupTypeRef, group._id)).thenResolve(group)
			when(keyCache.getCurrentGroupKey(group._id, matchers.anything())).thenResolve(currentGroupKey)

			const loadedKeypair: RsaKeyPair = (await keyLoaderFacade.loadKeypair(group._id, currentGroupKey.version)) as RsaKeyPair
			o(loadedKeypair.publicKey).deepEquals(RSA_TEST_KEYPAIR.publicKey)
			o(loadedKeypair.privateKey).deepEquals(RSA_TEST_KEYPAIR.privateKey)
		})
	})

	o.spec("loadCurrentKeyPair", function () {
		o("loadCurrentKeyPair success", async function () {
			const loadedCurrentKeyPair = await keyLoaderFacade.loadCurrentKeyPair(group._id)
			o(loadedCurrentKeyPair.object).deepEquals(currentKeyPair)
			o(loadedCurrentKeyPair.version).equals(currentGroupKeyVersion)
		})

		o("rsa key pair in version > 0 is rejected", async function () {
			currentGroupKey.version = 1
			group.groupKeyVersion = String(currentGroupKey.version)
			group.currentKeys = sysTypeRefs.createKeyPair({
				pubEccKey: currentKeyPair.x25519KeyPair.publicKey,
				symEncPrivEccKey: encryptX25519Key(currentGroupKey.object, currentKeyPair.x25519KeyPair.privateKey),
				pubKyberKey: null,
				symEncPrivKyberKey: null,
				symEncPrivRsaKey: encryptRsaKey(currentGroupKey.object, RSA_TEST_KEYPAIR.privateKey),
				pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
				signature: null,
			})
			keyCache = object()
			keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, async () => cacheManagementFacade, cryptoWrapper)
			when(entityClient.load(sysTypeRefs.GroupTypeRef, group._id)).thenResolve(group)
			when(keyCache.getCurrentGroupKey(group._id, matchers.anything())).thenResolve(currentGroupKey)

			await assertThrows(CryptoError, async () => keyLoaderFacade.loadCurrentKeyPair(group._id))
		})
	})

	o.spec("loadSymGroupKey", function () {
		o("loads and decrypts former keys.", async function () {
			for (let i = 0; i < FORMER_KEYS_LENGTH; i++) {
				const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, i as KeyVersion)
				o(loadedGroupKey).deepEquals(formerKeysDecrypted[i])
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("loads and decrypts the current key", async function () {
			const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion)
			o(loadedGroupKey).deepEquals(currentGroupKey.object)
		})

		o("outdated currentGroupKey throws", async function () {
			const outdatedCurrentGroupKeyVersion = cryptoUtils.checkKeyVersionConstraints(currentGroupKeyVersion - 1)
			await assertThrows(Error, () =>
				keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion, {
					object: formerKeysDecrypted[outdatedCurrentGroupKeyVersion],
					version: outdatedCurrentGroupKeyVersion,
				}),
			)
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("reloading in case of outdated range cache works", async function () {
			const groupKey: VersionedKey = { object: formerKeysDecrypted[1], version: 1 }
			const requestedVersion: KeyVersion = 0
			when(
				entityClient.loadRange(
					sysTypeRefs.GroupKeyTypeRef,
					group.formerGroupKeys.list,
					stringToCustomId(groupKey.version.toString()),
					groupKey.version - requestedVersion,
					true,
				),
			).thenResolve([], [formerKeys[0]])

			const result = await keyLoaderFacade.loadSymGroupKey(group._id, requestedVersion, groupKey)

			o(result).deepEquals(formerKeysDecrypted[0])
			verify(entityClient.loadMultiple(sysTypeRefs.GroupKeyTypeRef, group.formerGroupKeys.list, [stringToCustomId(requestedVersion.toString())]))
		})
	})

	o.spec("loadSymUserGroupKey", function () {
		o("key cache is outdated and refreshes", async function () {
			const requestedGroupKeyVersion = cryptoUtils.checkKeyVersionConstraints(Number(userGroup.groupKeyVersion) + 1)
			const refreshedUserGroupKey = { version: requestedGroupKeyVersion, object: aes256RandomKey() }
			when(cacheManagementFacade.refreshKeyCache(userGroup._id)).thenDo(() => {
				// cached key version is less than the requested one, but we can refresh successfully
				when(userFacade.getCurrentUserGroupKey()).thenReturn(refreshedUserGroupKey)
				return { user: object(), group }
			})

			const loadedUserGroupKey = await keyLoaderFacade.loadSymUserGroupKey(requestedGroupKeyVersion)

			o(loadedUserGroupKey).deepEquals(refreshedUserGroupKey.object)
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 1 })
		})
	})

	o.spec("retries recursively", function () {
		let outOfDateMembership: sysTypeRefs.GroupMembership

		o.beforeEach(function () {
			outOfDateMembership = createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: group._id,
				symKeyVersion: String(userGroupKey.version),
				symEncGKey: encryptKey(userGroupKey.object, formerKeysDecrypted[currentGroupKeyVersion - 1]),
				groupKeyVersion: String(currentGroupKeyVersion - 1),
			})
		})

		o.spec("updates the user and group if out-of-date", function () {
			let user: sysTypeRefs.User
			o.beforeEach(function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership)
				const userGroupMembership = createTestEntity(sysTypeRefs.GroupMembershipTypeRef)
				user = createTestEntity(sysTypeRefs.UserTypeRef, {
					_id: "userId",
					memberships: [membership],
					userGroup: userGroupMembership,
				})
				when(cacheManagementFacade.refreshKeyCache(group._id)).thenDo(async () => {
					when(userFacade.getMembership(group._id)).thenReturn(membership)
					await keyCache.removeOutdatedGroupKeys(user)
					return { user, group }
				})
				keyCache.setCurrentUserGroupKey(userGroupKey)
			})

			o("loadSymGroupKey", async function () {
				const loadedKey = await keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion)

				o(loadedKey).deepEquals(currentGroupKey.object)
				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})

			o("loadCurrentKeyPair", async function () {
				const loadedKeyPair = await keyLoaderFacade.loadCurrentKeyPair(group._id)

				o(loadedKeyPair.object).deepEquals(currentKeyPair)
				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})

			o("loadKeyPair - user out-of-date", async function () {
				const loadedKeyPair = await keyLoaderFacade.loadKeypair(group._id, cryptoUtils.parseKeyVersion(membership.groupKeyVersion))

				o(loadedKeyPair).deepEquals(currentKeyPair)
				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})

			o("loadKeyPair - group out-of-date ", async function () {
				// make sure the user is up-to-date
				when(userFacade.getMembership(group._id)).thenReturn(membership)

				const outOfDateGroup = createTestEntity(sysTypeRefs.GroupTypeRef, {
					...group,
					groupKeyVersion: String(cryptoUtils.parseKeyVersion(group.groupKeyVersion) - 1),
				})
				when(entityClient.load(sysTypeRefs.GroupTypeRef, group._id)).thenResolve(outOfDateGroup)

				const loadedKeyPair = await keyLoaderFacade.loadKeypair(group._id, cryptoUtils.parseKeyVersion(membership.groupKeyVersion))

				o(loadedKeyPair).deepEquals(currentKeyPair)
				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})
		})

		o.spec("does not recurse infinitely", function () {
			let user: sysTypeRefs.User
			o.beforeEach(function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership)
				user = createTestEntity(sysTypeRefs.UserTypeRef, {
					_id: "userId",
					memberships: [outOfDateMembership],
				})
			})

			o("loadSymGroupKey", async function () {
				await assertThrows(Error, () => keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion))

				verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 1 })
			})

			o("loadCurrentKeyPair", async function () {
				await assertThrows(Error, () => keyLoaderFacade.loadCurrentKeyPair(group._id))

				verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 1 })
			})

			o("loadKeyPair", async function () {
				await assertThrows(Error, () => keyLoaderFacade.loadKeypair(group._id, cryptoUtils.parseKeyVersion(membership.groupKeyVersion)))

				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})
		})
	})
})

o.spec("checkKeyVersionConstraints", function () {
	o("is an integer", function () {
		o(cryptoUtils.checkKeyVersionConstraints(0)).equals(0)
	})
	o("is negative", function () {
		o(() => cryptoUtils.checkKeyVersionConstraints(-1)).throws(CryptoError)
	})
	o("is not an integer", function () {
		o(() => cryptoUtils.checkKeyVersionConstraints(1.5)).throws(CryptoError)
	})
})
