import o from "@tutao/otest"
import { UserFacade } from "../../../../../src/api/worker/facades/UserFacade.js"
import { PQFacade } from "../../../../../src/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/api/worker/facades/KyberFacade.js"
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
	UserTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { matchers, object, reset, verify, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/api/worker/facades/KeyLoaderFacade.js"
import { stringToCustomId } from "../../../../../src/api/common/utils/EntityUtils.js"
import { VersionedKey } from "../../../../../src/api/worker/crypto/CryptoFacade.js"
import { freshVersioned } from "@tutao/tutanota-utils"
import { KeyCache } from "../../../../../src/api/worker/facades/KeyCache.js"
import { assertThrows } from "@tutao/tutanota-test-utils"

o.spec("KeyLoaderFacadeTest", function () {
	let keyCache: KeyCache
	let userFacade: UserFacade
	let entityClient: EntityClient
	let nonCachingEntityClient: EntityClient
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
		nonCachingEntityClient = object()
		pqFacade = new PQFacade(new WASMKyberFacade(await loadLibOQSWASM()))
		keyLoaderFacade = new KeyLoaderFacade(keyCache, userFacade, entityClient, nonCachingEntityClient)

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
		o("loads former key.", async function (): Promise<void> {
			for (let i = 0; i < FORMER_KEYS; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, i)) as PQKeyPairs
				o(keypair).deepEquals(formerKeyPairsDecrypted[i])
			}
			verify(nonCachingEntityClient.load(matchers.anything(), matchers.anything()), { times: 0 })
		})
		o("loads former key when reference is missing in cache", async function (): Promise<void> {
			const cachedGroup = createTestEntity(GroupTypeRef, {
				_id: "my group",
				currentKeys,
				formerGroupKeys: null,
				groupKeyVersion: String(currentGroupKeyVersion),
			})
			when(entityClient.load(GroupTypeRef, group._id)).thenResolve(cachedGroup)
			when(nonCachingEntityClient.load(GroupTypeRef, group._id)).thenResolve(group)

			for (let i = 0; i < FORMER_KEYS; i++) {
				const keypair = (await keyLoaderFacade.loadKeypair(group._id, i)) as PQKeyPairs
				verify(nonCachingEntityClient.load(GroupTypeRef, group._id))
			}
		})
	})

	o("loadCurrentKeyPair", async function () {
		const loadedCurrentKeyPair = await keyLoaderFacade.loadCurrentKeyPair(group._id)
		o(loadedCurrentKeyPair.object).deepEquals(currentKeyPair)
		o(loadedCurrentKeyPair.version).equals(FORMER_KEYS)
	})

	o.spec("loadSymGroupKey", function () {
		o("loads and decrypts former keys.", async function () {
			for (let i = 0; i < FORMER_KEYS; i++) {
				const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, i)
				o(loadedGroupKey).deepEquals(formerKeysDecrypted[i])
			}
			verify(nonCachingEntityClient.load(matchers.anything(), matchers.anything()), { times: 0 })
		})
		o("loads and decrypts former keys when reference is missing in cache", async function () {
			const cachedGroup = createTestEntity(GroupTypeRef, {
				_id: "my group",
				currentKeys,
				formerGroupKeys: null,
				groupKeyVersion: String(currentGroupKeyVersion),
			})
			when(entityClient.load(GroupTypeRef, group._id)).thenResolve(cachedGroup)
			when(nonCachingEntityClient.load(GroupTypeRef, group._id)).thenResolve(group)

			for (let i = 0; i < FORMER_KEYS; i++) {
				const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, i)
				verify(nonCachingEntityClient.load(GroupTypeRef, group._id))
			}
		})

		o("loads and decrypts the current key", async function () {
			const loadedGroupKey = await keyLoaderFacade.loadSymGroupKey(group._id, FORMER_KEYS)
			o(loadedGroupKey).deepEquals(currentGroupKey.object)
		})

		o.spec("retries recursively", function () {
			let outOfDateMembership: GroupMembership

			o.beforeEach(function () {
				outOfDateMembership = createTestEntity(GroupMembershipTypeRef, {
					group: group._id,
					symKeyVersion: String(userGroupKey.version),
					symEncGKey: encryptKey(userGroupKey.object, aes256RandomKey()),
					groupKeyVersion: String(0),
				})
			})

			o("updates the user if out-of-date", async function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership, membership)
				const userGroupMembership = createTestEntity(GroupMembershipTypeRef)
				const user = createTestEntity(UserTypeRef, {
					_id: "userId",
					memberships: [membership],
					userGroup: userGroupMembership,
				})
				when(userFacade.getLoggedInUser()).thenReturn(user)
				when(nonCachingEntityClient.load(UserTypeRef, user._id)).thenResolve(user)
				keyCache.setCurrentUserGroupKey(userGroupKey)
				when(userFacade.updateUser(user)).thenDo(async () => {
					when(userFacade.getMembership(group._id)).thenReturn(membership)
					await keyCache.removeOutdatedGroupKeys(user)
				})

				await keyLoaderFacade.loadSymGroupKey(group._id, FORMER_KEYS)

				verify(nonCachingEntityClient.load(UserTypeRef, "userId"))
				verify(userFacade.updateUser(user))
			})

			o("does not recurse infinitely", async function () {
				when(userFacade.getMembership(group._id)).thenReturn(outOfDateMembership)
				const user = createTestEntity(UserTypeRef, {
					_id: "userId",
					memberships: [outOfDateMembership],
				})
				when(userFacade.getLoggedInUser()).thenReturn(user)
				when(nonCachingEntityClient.load(UserTypeRef, user._id)).thenResolve(user)

				await assertThrows(Error, () => keyLoaderFacade.loadSymGroupKey(group._id, FORMER_KEYS))

				verify(nonCachingEntityClient.load(UserTypeRef, "userId"), { times: 1 })
				verify(userFacade.updateUser(user), { times: 1 })
			})
		})
	})
})
