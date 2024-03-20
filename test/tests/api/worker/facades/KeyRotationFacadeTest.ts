import o from "@tutao/otest"
import { KeyRotationFacade } from "../../../../../src/api/worker/facades/KeyRotationFacade.js"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { instance, matchers, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import {
	GroupMembershipTypeRef,
	KeyRotation,
	KeyRotationsRefTypeRef,
	KeyRotationTypeRef,
	User,
	UserGroupRoot,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs.js"
import { createAuthVerifier, encryptKey, KEY_LENGTH_BYTES_AES_256, sha256Hash, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { isEmpty } from "@tutao/tutanota-utils"

const { anything, argThat } = matchers
o.spec("KeyRotationFacade", function () {
	let entityClientMock: EntityClient
	let keyRotationFacade: KeyRotationFacade
	const keyRotationsList = "keyRotationsList"
	let user: User
	const pwKey = uint8ArrayToBitArray(new Uint8Array(Array(KEY_LENGTH_BYTES_AES_256).keys()))

	o.before(async () => {
		entityClientMock = instance(EntityClient)

		keyRotationFacade = new KeyRotationFacade(entityClientMock)
		user = await makeUser("userId", pwKey)
	})
	o.beforeEach(async () => {
		when(entityClientMock.load(UserGroupRootTypeRef, anything())).thenResolve(await makeUserGroupRoot(keyRotationsList))
	})
	o("When a key rotation for the admin group exists on the server, the pending key rotation and the password key are saved in the facade", async function () {
		when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(await makeKeyRotation(keyRotationsList, "1"))
		await keyRotationFacade.loadPendingKeyRotations(user, pwKey)
		o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).notEquals(null)
		o(keyRotationFacade.pendingKeyRotations.pwKey).notEquals(null)
	})
	o("After processing a key rotation for the admin group the key rotation and the password key are deleted from the facade.", async function () {
		when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(await makeKeyRotation(keyRotationsList, "1"))
		await keyRotationFacade.loadPendingKeyRotations(user, pwKey)
		o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).notEquals(null)
		o(keyRotationFacade.pendingKeyRotations.pwKey).notEquals(null)
		await keyRotationFacade.processPendingKeyRotation()
		o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
		o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
	})
	o(
		"When a key rotation for a user area group exists on the server, the pending key rotation is saved in the facade, but not the password key",
		async function () {
			when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(await makeKeyRotation(keyRotationsList, "9"))
			await keyRotationFacade.loadPendingKeyRotations(user, pwKey)
			o(keyRotationFacade.pendingKeyRotations.otherGroupsKeyRotation).notEquals(null)
			o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
		},
	)
	o("After processing a key rotation for a user area group the key rotation is deleted from the facade.", async function () {
		when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(await makeKeyRotation(keyRotationsList, "9"))
		await keyRotationFacade.loadPendingKeyRotations(user, pwKey)
		o(keyRotationFacade.pendingKeyRotations.otherGroupsKeyRotation).notEquals(null)
		o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
		await keyRotationFacade.processPendingKeyRotation()
		o(isEmpty(keyRotationFacade.pendingKeyRotations.otherGroupsKeyRotation)).equals(true)
	})
})

async function makeUser(userId: Id, userPassphraseKey: Aes128Key | Aes256Key): Promise<User> {
	const groupKey = encryptKey(userPassphraseKey, [3229306880, 2716953871, 4072167920, 3901332676])

	return createTestEntity(UserTypeRef, {
		_id: userId,
		verifier: sha256Hash(createAuthVerifier(userPassphraseKey)),
		userGroup: createTestEntity(GroupMembershipTypeRef, {
			group: "groupId",
			symEncGKey: groupKey,
			groupInfo: ["groupInfoListId", "groupInfoElId"],
		}),
	})
}

async function makeKeyRotation(keyRotationsList: Id, groupType: string): Promise<Array<KeyRotation>> {
	return [
		createTestEntity(KeyRotationTypeRef, {
			_id: ["id", keyRotationsList],
			groupType: groupType,
			targetKeyVersion: "1",
		}),
	]
}

async function makeUserGroupRoot(keyRotationsList: Id): Promise<UserGroupRoot> {
	return createTestEntity(UserGroupRootTypeRef, {
		keyRotations: createTestEntity(KeyRotationsRefTypeRef, {
			_id: "testId",
			list: keyRotationsList,
		}),
	})
}
