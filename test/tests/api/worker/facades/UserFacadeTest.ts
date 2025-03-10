import o from "@tutao/otest"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { User, UserGroupKeyDistributionTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { KeyCache } from "../../../../../src/common/api/worker/facades/KeyCache.js"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import { aes256RandomKey, encryptKey } from "@tutao/tutanota-crypto"

o.spec("UserFacadeTest", function () {
	let keyCache: KeyCache
	let facade: UserFacade

	o.beforeEach(function () {
		keyCache = object()
		facade = new UserFacade(keyCache, object())
	})

	o("a fresh UserFacade doesn't think it's logged or partially logged in", function () {
		o(facade.isPartiallyLoggedIn()).equals(false)
		o(facade.isFullyLoggedIn()).equals(false)
	})

	o("a user facade doesn't think it's logged in after receiving an accessToken but no user or groupKeys", function () {
		facade.setAccessToken("hello.")
		o(facade.isPartiallyLoggedIn()).equals(false)
		o(facade.isFullyLoggedIn()).equals(false)
	})

	o("a user facade doesn't think it's logged in fully after receiving a user but no groupKeys", function () {
		facade.setAccessToken("hello.")
		facade.setUser({} as User)
		o(facade.isPartiallyLoggedIn()).equals(true)
		o(facade.isFullyLoggedIn()).equals(false)
	})

	o("updateUserGroupKey - successfull", function () {
		const distributionKey = aes256RandomKey()
		const newUserGroupKey = aes256RandomKey()
		const distributionEncUserGroupKey = encryptKey(distributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: "userGroupId",
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey({ version: 1, object: newUserGroupKey }))
	})

	o("updateUserGroupKey - ignore missing distribution key ", function () {
		const distributionKey = aes256RandomKey()
		const newUserGroupKey = aes256RandomKey()
		const distributionEncUserGroupKey = encryptKey(distributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: "userGroupId",
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(null)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey(matchers.anything()), { times: 0 })
	})

	o("updateUserGroupKey - ignore decryption error", function () {
		const distributionKey = aes256RandomKey()
		const newUserGroupKey = aes256RandomKey()
		const distributionEncUserGroupKey = encryptKey(newUserGroupKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: "userGroupId",
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey(matchers.anything()), { times: 0 })
	})

	o("updateUserGroupKey - fall back to legacy user distribution key if regular one fails to decrypt", function () {
		const legacyDistributionKey = aes256RandomKey()
		const distributionKey = aes256RandomKey()
		const newUserGroupKey = aes256RandomKey()

		const legacyDistributionEncUserGroupKey = encryptKey(legacyDistributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: "userGroupId",
			distributionEncUserGroupKey: legacyDistributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.getLegacyUserDistKey(), { times: 1 })
	})

	o("updateUserGroupKey - do not fall back to legacy user distribution key if regular one is able to decrypt", function () {
		const distributionKey = aes256RandomKey()
		const newUserGroupKey = aes256RandomKey()

		const distributionEncUserGroupKey = encryptKey(distributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: "userGroupId",
			distributionEncUserGroupKey: distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.getLegacyUserDistKey(), { times: 0 })

		// make sure we reach the end of the function and do not return earlier
		verify(keyCache.setCurrentUserGroupKey(matchers.anything()))
	})
})
