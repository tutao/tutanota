import o from "@tutao/otest"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { loadLibOQSWASM } from "../WASMTestUtils.js"
import {
	aes256RandomKey,
	aesEncrypt,
	AesKey,
	encryptEccKey,
	encryptKey,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	PQKeyPairs,
} from "@tutao/tutanota-crypto"
import {
	Group,
	GroupKey,
	GroupKeysRefTypeRef,
	GroupKeyTypeRef,
	GroupMembership,
	GroupMembershipTypeRef,
	GroupTypeRef,
	KeyPair,
	KeyPairTypeRef,
	User,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { matchers, object, reset, verify, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { stringToCustomId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { assertNotNull, freshVersioned } from "@tutao/tutanota-utils"
import { KeyCache } from "../../../../../src/common/api/worker/facades/KeyCache.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"

o.spec("KeyLoaderFacadeTest", function () {
	let keyCache: KeyCache
	let userFacade: UserFacade
	let entityClient: EntityClient
	let cacheManagementFacade: CacheManagementFacade
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade

	let group: Group
	let userGroup: Group
	let currentKeys: KeyPair | null = null
	let formerKeys: GroupKey[]
	let formerKeysDecrypted: AesKey[]
	let currentGroupKey: VersionedKey
	let userGroupKey: VersionedKey
	let currentGroupKeyVersion: number
	let formerKeyPairsDecrypted: PQKeyPairs[]
	const FORMER_KEYS = 2
	let currentKeyPair: PQKeyPairs
	let membership: GroupMembership

	o.beforeEach(async () => {
		keyCache = new KeyCache()
		userFacade = object()
		entityClient = object()
		cacheManagementFacade = object()
		pqFacade = new PQFacade(new WASMKyberFacade(await loadLibOQSWASM()))
		keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, async () => cacheManagementFacade)

		formerKeys = []
		formerKeyPairsDecrypted = []
		formerKeysDecrypted = []
		for (let i = 0; i < FORMER_KEYS; i++) {
			formerKeysDecrypted.push(aes256RandomKey())
			formerKeyPairsDecrypted.push(await pqFacade.generateKeyPairs())
		}

		currentGroupKeyVersion = formerKeysDecrypted.length
		currentGroupKey = { object: aes256RandomKey(), version: Number(currentGroupKeyVersion) }

		let lastKey = currentGroupKey.object

		for (let i = formerKeysDecrypted.length - 1; i >= 0; i--) {
			const key: GroupKey = createTestEntity(GroupKeyTypeRef)
			key._id = ["list", stringToCustomId(i.toString())]
			key.ownerEncGKey = encryptKey(lastKey, formerKeysDecrypted[i])
			const pqKeyPair = formerKeyPairsDecrypted[i]

			key.keyPair = createTestEntity(KeyPairTypeRef, {
				pubEccKey: pqKeyPair.eccKeyPair.publicKey,
				pubKyberKey: kyberPublicKeyToBytes(pqKeyPair.kyberKeyPair.publicKey),
				symEncPrivEccKey: encryptEccKey(formerKeysDecrypted[i], pqKeyPair.eccKeyPair.privateKey),
				symEncPrivKyberKey: aesEncrypt(formerKeysDecrypted[i], kyberPrivateKeyToBytes(pqKeyPair.kyberKeyPair.privateKey)),
			})
			lastKey = formerKeysDecrypted[i]
			formerKeys.unshift(key)
		}
		currentKeyPair = await pqFacade.generateKeyPairs()

		currentKeys = createTestEntity(KeyPairTypeRef, {
			pubEccKey: currentKeyPair.eccKeyPair.publicKey,
			symEncPrivEccKey: encryptEccKey(currentGroupKey.object, currentKeyPair.eccKeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(currentKeyPair.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(currentGroupKey.object, kyberPrivateKeyToBytes(currentKeyPair.kyberKeyPair.privateKey)),
			pubRsaKey: null,
			symEncPrivRsaKey: null,
		})
		group = createTestEntity(GroupTypeRef, {
			_id: "my group",
			currentKeys,
			formerGroupKeys: createTestEntity(GroupKeysRefTypeRef, { list: "list" }),
			groupKeyVersion: String(currentGroupKeyVersion),
		})
		userGroupKey = freshVersioned(aes256RandomKey())
		userGroup = createTestEntity(GroupTypeRef, {
			_id: "my userGroup",
			groupKeyVersion: String(userGroupKey.version),
			formerGroupKeys: null,
		})

		membership = createTestEntity(GroupMembershipTypeRef, {
			group: group._id,
			symKeyVersion: String(userGroupKey.version),
			symEncGKey: encryptKey(userGroupKey.object, currentGroupKey.object),
			groupKeyVersion: String(currentGroupKey.version),
		})
		when(userFacade.getCurrentUserGroupKey()).thenReturn(userGroupKey)
		when(userFacade.getMembership(group._id)).thenReturn(membership)
		when(userFacade.getUserGroupId()).thenReturn(userGroup._id)
		when(entityClient.load(GroupTypeRef, group._id)).thenResolve(group)
		for (let i = 0; i < FORMER_KEYS; i++) {
			when(
				entityClient.loadRange(GroupKeyTypeRef, group.formerGroupKeys!.list, stringToCustomId(String(currentGroupKeyVersion)), FORMER_KEYS - i, true),
			).thenDo(() => formerKeys.slice(i).reverse()) // create a fresh copy because we modify in place
		}
	})

	o.spec("getCurrentSymGroupKey", function () {
		o("getting userGroup key", async function () {
			const currentUserGroupKey = await keyLoaderFacade.getCurrentSymGroupKey(userGroup._id)
			o(currentUserGroupKey.version).equals(Number(userGroup.groupKeyVersion))
			o(currentUserGroupKey.object).deepEquals(userGroupKey.object)
			verify(userFacade.getMembership(matchers.anything()), { times: 0 })
			await keyLoaderFacade.getCurrentSymGroupKey(userGroup._id)
			verify(userFacade.getCurrentUserGroupKey(), { times: 2 }) // should not be cached
		})

		o("getting non-userGroup key", async function () {
			const groupKey = await keyLoaderFacade.getCurrentSymGroupKey(group._id)
			o(groupKey.version).equals(Number(group.groupKeyVersion))
			o(groupKey.object).deepEquals(currentGroupKey.object)
			verify(userFacade.getMembership(group._id))
			reset()
			// the key is now cached -> no need to get the membership
			await keyLoaderFacade.getCurrentSymGroupKey(group._id)
			verify(userFacade.getMembership(matchers.anything()), { times: 0 })
		})
	})

	o.spec("loadKeyPair", function () {
		o("loads current key.", async function (): Promise<void> {
			for (let i = 0; i < FORMER_KEYS; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, currentGroupKeyVersion)) as PQKeyPairs
				o(keypair).deepEquals(currentKeyPair)
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("loads former key.", async function (): Promise<void> {
			for (let i = 0; i < FORMER_KEYS; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, i)) as PQKeyPairs
				o(keypair).deepEquals(formerKeyPairsDecrypted[i])
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("load key pair when group is updated in cache but key cache still has the old sym key", async function () {
			const requestedVersion = currentGroupKeyVersion - 1
			when(entityClient.load(GroupKeyTypeRef, [assertNotNull(group.formerGroupKeys).list, stringToCustomId(String(requestedVersion))])).thenResolve(
				formerKeys[requestedVersion],
			)
			await keyCache.getCurrentGroupKey(group._id, () => Promise.resolve({ version: requestedVersion, object: formerKeysDecrypted[requestedVersion] }))
			const keypair = (await keyLoaderFacade.loadKeypair(group._id, requestedVersion)) as PQKeyPairs
			o(keypair).deepEquals(formerKeyPairsDecrypted[requestedVersion])
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})
	})

	o.spec("loadCurrentKeyPair", function () {
		o("loadCurrentKeyPair success", async function () {
			const loadedCurrentKeyPair = await keyLoaderFacade.loadCurrentKeyPair(group._id)
			o(loadedCurrentKeyPair.object).deepEquals(currentKeyPair)
			o(loadedCurrentKeyPair.version).equals(currentGroupKeyVersion)
		})
	})

	o.spec("loadSymGroupKey", function () {
		o("loads and decrypts former keys.", async function () {
			for (let i = 0; i < FORMER_KEYS; i++) {
				const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, i)
				o(loadedGroupKey).deepEquals(formerKeysDecrypted[i])
			}
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})

		o("loads and decrypts the current key", async function () {
			const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion)
			o(loadedGroupKey).deepEquals(currentGroupKey.object)
		})

		o("outdated currentGroupKey throws", async function () {
			const outdatedCurrentGroupKeyVersion = currentGroupKeyVersion - 1
			await assertThrows(Error, () =>
				keyLoaderFacade.loadSymGroupKey(group._id, currentGroupKeyVersion, {
					object: formerKeysDecrypted[outdatedCurrentGroupKeyVersion],
					version: outdatedCurrentGroupKeyVersion,
				}),
			)
			verify(cacheManagementFacade.refreshKeyCache(matchers.anything()), { times: 0 })
		})
	})

	o.spec("loadSymUserGroupKey", function () {
		o("key cache is outdated and refreshes", async function () {
			const requestedGroupKeyVersion = Number(userGroup.groupKeyVersion) + 1
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
		let outOfDateMembership: GroupMembership

		o.beforeEach(function () {
			outOfDateMembership = createTestEntity(GroupMembershipTypeRef, {
				group: group._id,
				symKeyVersion: String(userGroupKey.version),
				symEncGKey: encryptKey(userGroupKey.object, formerKeysDecrypted[currentGroupKeyVersion - 1]),
				groupKeyVersion: String(currentGroupKeyVersion - 1),
			})
		})

		o.spec("updates the user if out-of-date", function () {
			let user: User
			o.beforeEach(function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership)
				const userGroupMembership = createTestEntity(GroupMembershipTypeRef)
				user = createTestEntity(UserTypeRef, {
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

			o("loadKeyPair", async function () {
				const loadedKeyPair = await keyLoaderFacade.loadKeypair(group._id, Number(membership.groupKeyVersion))

				o(loadedKeyPair).deepEquals(currentKeyPair)
				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})
		})

		o.spec("does not recurse infinitely", function () {
			let user: User
			o.beforeEach(function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership)
				user = createTestEntity(UserTypeRef, {
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
				await assertThrows(Error, () => keyLoaderFacade.loadKeypair(group._id, Number(membership.groupKeyVersion)))

				verify(cacheManagementFacade.refreshKeyCache(group._id), { times: 1 })
			})
		})
	})
})
