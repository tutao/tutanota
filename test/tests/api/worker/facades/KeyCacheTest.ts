import o from "@tutao/otest"
import { GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { KeyCache } from "../../../../../src/common/api/worker/facades/KeyCache.js"
import { createTestEntity } from "../../../TestUtils.js"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { NotAuthorizedError } from "../../../../../src/common/api/common/error/RestError.js"
import { object } from "testdouble"
import { KeyVersion } from "@tutao/tutanota-utils"
import { VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

o.spec("KeyCacheTest", function () {
	let keyCache: KeyCache

	o.beforeEach(function () {
		keyCache = new KeyCache()
	})

	o.spec("removeOutdatedGroupKeys", function () {
		o.beforeEach(function () {
			keyCache.setCurrentUserGroupKey({ version: 0, object: aes256RandomKey() })
		})

		o("new group key version for cached key", async function () {
			let groupId = "groupId"
			const user = createTestEntity(UserTypeRef, {
				userGroup: createTestEntity(GroupMembershipTypeRef),
				memberships: [createTestEntity(GroupMembershipTypeRef, { group: groupId, groupKeyVersion: "1" })],
			})
			// add version 0 tp cache
			await keyCache.getCurrentGroupKey(groupId, () => Promise.resolve({ version: 0, object: aes256RandomKey() }))

			await keyCache.removeOutdatedGroupKeys(user)
			const cachedKey = await keyCache.getCurrentGroupKey(groupId, async () => {
				return { version: 1, object: aes256RandomKey() }
			})
			o(cachedKey.version).equals(1)
		})

		o("no version update for cached key", async function () {
			let groupId = "groupId"
			const user = createTestEntity(UserTypeRef, {
				userGroup: createTestEntity(GroupMembershipTypeRef),
				memberships: [createTestEntity(GroupMembershipTypeRef, { group: groupId, groupKeyVersion: "0" })],
			})
			await keyCache.getCurrentGroupKey(groupId, () => Promise.resolve({ version: 0, object: aes256RandomKey() }))

			await keyCache.removeOutdatedGroupKeys(user)
			const cachedKey = await keyCache.getCurrentGroupKey(groupId, async () => {
				throw new Error("unexpected call to key loader")
			})
			o(cachedKey.version).equals(0)
		})

		o("removed membership for cached key", async function () {
			let groupId = "groupId"
			const user = createTestEntity(UserTypeRef, {
				userGroup: createTestEntity(GroupMembershipTypeRef),
				memberships: [],
			})
			await keyCache.getCurrentGroupKey(groupId, () => Promise.resolve({ version: 0, object: aes256RandomKey() }))

			await keyCache.removeOutdatedGroupKeys(user)

			// We expect that there is no cached entry for that group id and therefore the key loader will be invoked.
			o(async () =>
				keyCache.getCurrentGroupKey(groupId, async () => {
					throw new NotAuthorizedError("unexpected call to key loader")
				}),
			).asyncThrows(NotAuthorizedError)
		})

		o("ignore user group key update", async function () {
			let groupId = "groupId"
			const user = createTestEntity(UserTypeRef, {
				userGroup: createTestEntity(GroupMembershipTypeRef, { group: "userGroupId", groupKeyVersion: "1" }),
				memberships: [createTestEntity(GroupMembershipTypeRef, { group: groupId, groupKeyVersion: "0" })],
			})

			await keyCache.removeOutdatedGroupKeys(user)
			const cachedUserGroupKey = keyCache.getCurrentUserGroupKey()
			// @ts-ignore
			o(cachedUserGroupKey.version).equals(0)
		})
	})

	o.spec("enforce version constraints", function () {
		const groupId = "groupId"
		const invalidVersionedKey: VersionedKey = { version: -1 as KeyVersion, object: object() }

		o("setCurrentUserGroupKey", function () {
			o(() => keyCache.setCurrentUserGroupKey(invalidVersionedKey)).throws(CryptoError)
		})

		o("getCurrentGroupKey", async function () {
			await assertThrows(CryptoError, async () => keyCache.getCurrentGroupKey(groupId, async () => invalidVersionedKey))
		})
	})
})
