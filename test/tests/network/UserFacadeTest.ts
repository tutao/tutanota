import o from "@tutao/otest"
import { UserFacade } from "../../../src/platform-kit/base/facades/UserFacade.js"
import { KeyCache } from "../../../src/platform-kit/base/base-crypto/persistence/KeyCache.js"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../TestUtils.js"

import { User, UserGroupKeyDistributionTypeRef } from "@tutao/entities/sys"
import { idToElementId } from "../../../src/platform-kit/meta"
import { SymmetricCipherUtils } from "@tutao/crypto/symmetric-cipher-utils"
import { Aes, AesCbcFacade, KeyEncryption, random, SymmetricCipherFacade } from "../../../src/platform-kit/crypto"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"

o.spec("UserFacadeTest", function () {
	let symmetricCipherUtils: SymmetricCipherUtils
	let keyEncryption: KeyEncryption
	let keyCache: KeyCache
	let facade: UserFacade

	o.beforeEach(function () {
		symmetricCipherUtils = new SymmetricCipherUtils(random)
		const symmetricCipherFacade = new SymmetricCipherFacade(
			new AesCbcFacade(),
			new AeadFacade(symmetricCipherUtils),
			new SymmetricKeyDeriver(),
			symmetricCipherUtils,
		)
		keyEncryption = new KeyEncryption(symmetricCipherFacade, new Aes(symmetricCipherFacade))
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

	o("updateUserGroupKey - successful", function () {
		const distributionKey = symmetricCipherUtils.aes256RandomKey()
		const newUserGroupKey = symmetricCipherUtils.aes256RandomKey()
		const distributionEncUserGroupKey = keyEncryption.encryptKey(distributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: idToElementId("userGroupId"),
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey({ version: 1, object: newUserGroupKey }))
	})

	o("updateUserGroupKey - ignore missing distribution key ", function () {
		const distributionKey = symmetricCipherUtils.aes256RandomKey()
		const newUserGroupKey = symmetricCipherUtils.aes256RandomKey()
		const distributionEncUserGroupKey = keyEncryption.encryptKey(distributionKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: idToElementId("userGroupId"),
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(null)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey(matchers.anything()), { times: 0 })
	})

	o("updateUserGroupKey - ignore decryption error", function () {
		const distributionKey = symmetricCipherUtils.aes256RandomKey()
		const newUserGroupKey = symmetricCipherUtils.aes256RandomKey()
		const distributionEncUserGroupKey = keyEncryption.encryptKey(newUserGroupKey, newUserGroupKey)
		const distributionUpdate = createTestEntity(UserGroupKeyDistributionTypeRef, {
			_id: idToElementId("userGroupId"),
			distributionEncUserGroupKey,
			userGroupKeyVersion: "1",
		})
		when(keyCache.getUserDistKey()).thenReturn(distributionKey)
		facade.updateUserGroupKey(distributionUpdate)
		verify(keyCache.setCurrentUserGroupKey(matchers.anything()), { times: 0 })
	})
})
