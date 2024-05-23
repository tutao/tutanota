import { EntityClient } from "../../common/EntityClient.js"
import {
	AdminGroupKeyRotationPostIn,
	createAdminGroupKeyRotationPostIn,
	createGroupKeyRotationData,
	createGroupKeyRotationPostIn,
	createKeyPair,
	createRecoverCodeData,
	createUserGroupKeyRotationData,
	Group,
	GroupKeyRotationData,
	GroupTypeRef,
	KeyPair,
	KeyRotation,
	KeyRotationTypeRef,
	RecoverCodeData,
	User,
	UserGroupRootTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { GroupKeyRotationType, GroupType } from "../../common/TutanotaConstants.js"
import { assertNotNull, defer, DeferredObject, getFirstOrThrow, isEmpty, lazyAsync } from "@tutao/tutanota-utils"
import { elementIdPart } from "../../common/utils/EntityUtils.js"
import { KeyLoaderFacade } from "./KeyLoaderFacade.js"
import { Aes256Key, AesKey, createAuthVerifier, getKeyLengthBytes, KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto"
import { PQFacade } from "./PQFacade.js"
import { AdminGroupKeyRotationService, GroupKeyRotationInfoService, GroupKeyRotationService } from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { CryptoWrapper } from "../crypto/CryptoWrapper.js"
import { getUserGroupMemberships } from "../../common/utils/GroupUtils.js"
import { RecoverCodeFacade, RecoverData } from "./lazy/RecoverCodeFacade.js"
import { UserFacade } from "./UserFacade.js"

assertWorkerOrNode()

/**
 * Type to keep a pending key rotation and the password key in memory as long as the key rotation has not been processed.
 */
type PendingKeyRotation = {
	pwKey: Aes256Key | null
	//If we rotate the admin group we always want to rotate the user group for the admin user.
	// Therefore, we do not need to save two different key rotations for this case.
	adminOrUserGroupKeyRotation: KeyRotation | null
	userAreaGroupsKeyRotation: Array<KeyRotation>
}

type GeneratedGroupKeys = {
	symGroupKey: VersionedKey
	encryptedKeyPair: KeyPair | null
}

type EncryptedGroupKeys = {
	newGroupKeyEncCurrentGroupKey: VersionedEncryptedKey
	membershipSymEncNewGroupKey: VersionedEncryptedKey
	keyPair: KeyPair | null
	adminGroupKeyEncNewGroupKey: VersionedEncryptedKey | null
}

type EncryptedUserGroupKeys = {
	newUserGroupKeyEncCurrentGroupKey: VersionedEncryptedKey
	passphraseKeyEncNewUserGroupKey: VersionedEncryptedKey
	keyPair: KeyPair
	recoverCodeWrapper: RecoverData | null
	newAdminGroupKeyEncNewUserGroupKey: VersionedEncryptedKey
	distributionKeyEncNewUserGroupKey: Uint8Array
	authVerifier: Uint8Array
}

/**
 * Facade to handle key rotation requests. Maintains and processes @PendingKeyRotation
 */
export class KeyRotationFacade {
	pendingKeyRotations: PendingKeyRotation
	private readonly facadeInitializedDeferredObject: DeferredObject<void>

	constructor(
		private readonly entityClient: EntityClient,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly pqFacade: PQFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly recoverCodeFacade: lazyAsync<RecoverCodeFacade>,
		private readonly userFacade: UserFacade,
	) {
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			userAreaGroupsKeyRotation: [],
		}
		this.facadeInitializedDeferredObject = defer<void>()
	}

	/**
	 * Initialize the facade with the data it needs to perform rotations later.
	 * Needs to be called during login when the password key is still available.
	 * @param pwKey the user's passphrase key. May or may not be kept in memory, depending on whether a UserGroup key rotation is scheduled.
	 */
	public async initialize(pwKey: Aes256Key) {
		const result = await this.serviceExecutor.get(GroupKeyRotationInfoService, null)
		if (result.userOrAdminGroupKeyRotationScheduled) {
			this.pendingKeyRotations.pwKey = pwKey
		}
		this.facadeInitializedDeferredObject.resolve()
	}

	public async loadAndProcessPendingKeyRotations(user: User) {
		await this.loadPendingKeyRotations(user)
		await this.processPendingKeyRotation(user)
	}

	/**
	 * Queries the server for pending key rotations for a given user and saves them and optionally the given password key (in case an admin or user group needs to be rotated).
	 *
	 * Note that this function currently makes 2 server requests to load the key rotation list and check if a key rotation is needed.
	 * This routine should be optimized in the future by saving a flag on the user to determine whether a key rotation is required or not.
	 */
	public async loadPendingKeyRotations(user: User) {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, user.userGroup.group)
		if (userGroupRoot.keyRotations != null) {
			const pendingKeyRotations = await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list)
			const adminOrUserGroupRotation = pendingKeyRotations.find(
				(keyRotation) =>
					keyRotation.groupKeyRotationType === GroupKeyRotationType.Admin || keyRotation.groupKeyRotationType === GroupKeyRotationType.User,
			)
			this.pendingKeyRotations = {
				pwKey: this.pendingKeyRotations.pwKey,
				adminOrUserGroupKeyRotation: adminOrUserGroupRotation || null,
				userAreaGroupsKeyRotation: pendingKeyRotations.filter((keyRotation) => keyRotation.groupKeyRotationType === GroupKeyRotationType.UserArea),
			}
		}
	}

	/**
	 * Processes the internal list of @PendingKeyRotation. Key rotations and (if existent) password keys are deleted after processing.
	 */
	public async processPendingKeyRotation(user: User) {
		await this.facadeInitializedDeferredObject.promise
		// first admin, then user and then user area
		try {
			if (this.pendingKeyRotations.adminOrUserGroupKeyRotation && this.pendingKeyRotations.pwKey) {
				switch (this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType) {
					// Currently we only support updating user area groups, so we ignore these,
					// but we leave the instances in place in case another client supports them.
					case GroupKeyRotationType.Admin:
						await this.rotateAdminGroupKeys(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation)
						break
					case GroupKeyRotationType.User:
						console.log("Rotating the user group is not yet implemented")
						break
				}
				this.pendingKeyRotations.adminOrUserGroupKeyRotation = null
			}
		} finally {
			this.pendingKeyRotations.pwKey = null
		}

		if (!isEmpty(this.pendingKeyRotations.userAreaGroupsKeyRotation)) {
			await this.rotateUserAreaGroupKeys(user)
			this.pendingKeyRotations.userAreaGroupsKeyRotation = []
		}
	}

	/**
	 * @VisibleForTesting
	 */
	async rotateAdminGroupKeys(user: User, passphraseKey: Aes256Key, keyRotation: KeyRotation) {
		if (hasNonQuantumSafeKeys(passphraseKey)) {
			console.log("Not allowed to rotate admin group keys with a bcrypt password key")
			return
		}
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const adminGroupMembership = getFirstOrThrow(getUserGroupMemberships(user, GroupType.Admin))
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group)
		const adminKeyRotationData = await this.prepareKeyRotationForAdminGroup(keyRotation, user, currentUserGroupKey, currentAdminGroupKey, passphraseKey)
		return this.serviceExecutor.post(AdminGroupKeyRotationService, adminKeyRotationData)
	}

	//We assume that the logged-in user is an admin user and the only member of the group
	private async rotateUserAreaGroupKeys(user: User) {
		//group key rotation is skipped if
		// * user is not an admin user
		const adminGroupMembership = user.memberships.find((m) => m.groupType === GroupKeyRotationType.Admin)
		if (adminGroupMembership == null) {
			// group key rotations are currently only scheduled for single user customers, so this user must be an admin
			console.log("Only admin user can rotate the group")
			return
		}

		// * the encrypting keys are 128-bit keys. (user group key, admin group key)
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group)
		if (hasNonQuantumSafeKeys(currentUserGroupKey.object, currentAdminGroupKey.object)) {
			// admin group key rotation should be scheduled first on the server, so this should not happen
			console.log("Keys cannot be rotated as the encrypting keys are not pq secure")
			return
		}

		const serviceData = createGroupKeyRotationPostIn({ groupKeyUpdates: [] })
		for (const keyRotation of this.pendingKeyRotations.userAreaGroupsKeyRotation) {
			const groupKeyRotationData = await this.prepareKeyRotationForAreaGroup(keyRotation, currentUserGroupKey, currentAdminGroupKey)
			serviceData.groupKeyUpdates.push(groupKeyRotationData)
		}
		if (serviceData.groupKeyUpdates.length <= 0) {
			return
		}
		await this.serviceExecutor.post(GroupKeyRotationService, serviceData)
	}

	private async prepareKeyRotationForAdminGroup(
		keyRotation: KeyRotation,
		user: User,
		currentUserGroupKey: VersionedKey,
		currentAdminGroupKey: VersionedKey,
		passphraseKey: Aes256Key,
	): Promise<AdminGroupKeyRotationPostIn> {
		const adminGroupId = this.getTargetGroupId(keyRotation)
		const userGroupMembership = user.userGroup
		const userGroupId = userGroupMembership.group
		console.log(`KeyRotationFacade: rotate key for group: ${adminGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)

		const adminGroup = await this.entityClient.load(GroupTypeRef, adminGroupId)
		const userGroup = await this.entityClient.load(GroupTypeRef, userGroupId)

		const newAdminGroupKeys = await this.generateGroupKeys(adminGroup)
		const newUserGroupKeys = await this.generateGroupKeys(userGroup)
		const encryptedAdminKeys = this.encryptGroupKeys(
			adminGroup,
			currentAdminGroupKey,
			newAdminGroupKeys,
			newUserGroupKeys.symGroupKey,
			newAdminGroupKeys.symGroupKey,
		)
		const encryptedUserKeys = await this.encryptUserGroupKey(userGroup, currentUserGroupKey, newUserGroupKeys, passphraseKey, newAdminGroupKeys, user)

		const adminGroupKeyData = createGroupKeyRotationData({
			adminGroupEncGroupKey: assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).key,
			adminGroupKeyVersion: String(assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).encryptingKeyVersion),
			groupEncPreviousGroupKey: encryptedAdminKeys.newGroupKeyEncCurrentGroupKey.key,
			groupKeyVersion: String(newAdminGroupKeys.symGroupKey.version),
			userEncGroupKey: encryptedAdminKeys.membershipSymEncNewGroupKey.key,
			userKeyVersion: String(encryptedAdminKeys.membershipSymEncNewGroupKey.encryptingKeyVersion),
			group: adminGroup._id,
			keyPair: encryptedAdminKeys.keyPair,
		})
		const recoverCodeWrapper = encryptedUserKeys.recoverCodeWrapper
		let recoverCodeData: RecoverCodeData | null = null
		if (recoverCodeWrapper != null) {
			recoverCodeData = createRecoverCodeData({
				recoveryCodeVerifier: recoverCodeWrapper.recoveryCodeVerifier,
				userEncRecoveryCode: recoverCodeWrapper.userEncRecoverCode,
				userKeyVersion: String(recoverCodeWrapper.userKeyVersion),
				recoveryCodeEncUserGroupKey: recoverCodeWrapper.recoverCodeEncUserGroupKey,
			})
		}

		const userGroupKeyData = createUserGroupKeyRotationData({
			recoverCodeData,
			distributionKeyEncUserGroupKey: encryptedUserKeys.distributionKeyEncNewUserGroupKey,
			authVerifier: encryptedUserKeys.authVerifier,
			group: userGroup._id,
			userGroupEncPreviousGroupKey: encryptedUserKeys.newUserGroupKeyEncCurrentGroupKey.key,
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			keyPair: encryptedUserKeys.keyPair,
			adminGroupEncUserGroupKey: encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.key,
			adminGroupKeyVersion: String(encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.encryptingKeyVersion),
			passphraseEncUserGroupKey: encryptedUserKeys.passphraseKeyEncNewUserGroupKey.key,
		})
		return createAdminGroupKeyRotationPostIn({ adminGroupKeyData, userGroupKeyData })
	}

	private async encryptUserGroupKey(
		userGroup: Group,
		currentUserGroupKey: VersionedKey,
		newUserGroupKeys: GeneratedGroupKeys,
		passphraseKey: Aes256Key,
		newAdminGroupKeys: GeneratedGroupKeys,
		user: User,
	): Promise<EncryptedUserGroupKeys> {
		const versionedPassphraseKey = {
			object: passphraseKey,
			version: 0, // dummy
		}
		const encryptedUserKeys = this.encryptGroupKeys(userGroup, currentUserGroupKey, newUserGroupKeys, versionedPassphraseKey, newAdminGroupKeys.symGroupKey)

		let recoverCodeWrapper: RecoverData | null = null
		if (user.auth?.recoverCode != null) {
			const recoverCodeFacade = await this.recoverCodeFacade()
			const recoverCode = await recoverCodeFacade.getRawRecoverCode(passphraseKey)
			recoverCodeWrapper = recoverCodeFacade.encryptRecoveryCode(recoverCode, newUserGroupKeys.symGroupKey)
		}

		const userGroupKeyDistributionKey = this.userFacade.deriveUserGroupKeyDistributionKey(userGroup._id, passphraseKey)
		const distributionKeyEncNewUserGroupKey = this.cryptoWrapper.encryptKey(userGroupKeyDistributionKey, newUserGroupKeys.symGroupKey.object)
		const authVerifier = createAuthVerifier(passphraseKey)

		return {
			newUserGroupKeyEncCurrentGroupKey: encryptedUserKeys.newGroupKeyEncCurrentGroupKey,
			newAdminGroupKeyEncNewUserGroupKey: assertNotNull(encryptedUserKeys.adminGroupKeyEncNewGroupKey),
			keyPair: assertNotNull(encryptedUserKeys.keyPair),
			passphraseKeyEncNewUserGroupKey: encryptedUserKeys.membershipSymEncNewGroupKey,
			recoverCodeWrapper,
			distributionKeyEncNewUserGroupKey,
			authVerifier,
		}
	}

	private async prepareKeyRotationForAreaGroup(
		keyRotation: KeyRotation,
		currentUserGroupKey: VersionedKey,
		currentAdminGroupKey: VersionedKey,
	): Promise<GroupKeyRotationData> {
		const targetGroupId = this.getTargetGroupId(keyRotation)
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId)
		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId)

		const newGroupKeys = await this.generateGroupKeys(targetGroup)
		const encryptedGroupKeys = this.encryptGroupKeys(targetGroup, currentGroupKey, newGroupKeys, currentUserGroupKey, currentAdminGroupKey)

		return createGroupKeyRotationData({
			userEncGroupKey: encryptedGroupKeys.membershipSymEncNewGroupKey.key,
			userKeyVersion: String(currentUserGroupKey.version),
			adminGroupEncGroupKey: encryptedGroupKeys.adminGroupKeyEncNewGroupKey ? encryptedGroupKeys.adminGroupKeyEncNewGroupKey.key : null,
			adminGroupKeyVersion: encryptedGroupKeys.adminGroupKeyEncNewGroupKey
				? String(encryptedGroupKeys.adminGroupKeyEncNewGroupKey.encryptingKeyVersion)
				: null,
			group: targetGroupId,
			groupKeyVersion: String(newGroupKeys.symGroupKey.version),
			groupEncPreviousGroupKey: encryptedGroupKeys.newGroupKeyEncCurrentGroupKey.key,
			keyPair: encryptedGroupKeys.keyPair,
		})
	}

	/**
	 * Get the ID of the group we want to rotate the keys for.
	 */
	private getTargetGroupId(keyRotation: KeyRotation) {
		// The KeyRotation is a list element type whose list element ID part is the target group ID,
		// i.e., an indirect reference to Group.
		return elementIdPart(keyRotation._id)
	}

	private encryptGroupKeys(
		group: Group,
		currentGroupKey: VersionedKey,
		newKeys: GeneratedGroupKeys,
		groupMembershipKey: VersionedKey,
		adminGroupKeys: VersionedKey,
	): EncryptedGroupKeys {
		const newGroupKeyEncCurrentGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newKeys.symGroupKey, currentGroupKey.object)
		const membershipEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(groupMembershipKey, newKeys.symGroupKey.object)
		const adminGroupKeyEncNewGroupKey = this.hasAdminEncGKey(group)
			? this.cryptoWrapper.encryptKeyWithVersionedKey(adminGroupKeys, newKeys.symGroupKey.object)
			: null

		return {
			newGroupKeyEncCurrentGroupKey: newGroupKeyEncCurrentGroupKey,
			membershipSymEncNewGroupKey: membershipEncNewGroupKey,
			keyPair: newKeys.encryptedKeyPair,
			adminGroupKeyEncNewGroupKey: adminGroupKeyEncNewGroupKey,
		}
	}

	private async generateGroupKeys(group: Group): Promise<GeneratedGroupKeys> {
		const symGroupKeyBytes = this.cryptoWrapper.aes256RandomKey()
		const keyPair = await this.createNewKeyPairValue(group, symGroupKeyBytes)
		return {
			symGroupKey: {
				object: symGroupKeyBytes,
				version: Number(group.groupKeyVersion) + 1,
			},
			encryptedKeyPair: keyPair,
		}
	}

	/**
	 * Not all groups have key pairs, but if they do we need to rotate them as well.
	 */
	private async createNewKeyPairValue(groupToRotate: Group, newSymmetricGroupKey: Aes256Key): Promise<KeyPair | null> {
		if (groupToRotate.currentKeys) {
			const newPqPairs = await this.pqFacade.generateKeyPairs()
			return createKeyPair({
				pubRsaKey: null,
				symEncPrivRsaKey: null,
				pubEccKey: newPqPairs.eccKeyPair.publicKey,
				symEncPrivEccKey: this.cryptoWrapper.encryptEccKey(newSymmetricGroupKey, newPqPairs.eccKeyPair.privateKey),
				pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(newPqPairs.kyberKeyPair.publicKey),
				symEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(newSymmetricGroupKey, newPqPairs.kyberKeyPair.privateKey),
			})
		} else {
			return null
		}
	}

	private hasAdminEncGKey(groupToRotate: Group) {
		return groupToRotate.adminGroupEncGKey != null && groupToRotate.adminGroupEncGKey.length !== 0
	}

	/**
	 * visible for testing
	 * @private
	 */
	public setPendingKeyRotations(pendingKeyRotations: PendingKeyRotation) {
		this.pendingKeyRotations = pendingKeyRotations
		this.facadeInitializedDeferredObject.resolve()
	}

	public async reset() {
		await this.facadeInitializedDeferredObject.promise
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			userAreaGroupsKeyRotation: [],
		}
	}
}

/**
 * We require AES keys to be 256-bit long to be quantum-safe because of Grover's algorithm.
 */
function isQuantumSafe(key: AesKey) {
	return getKeyLengthBytes(key) === KEY_LENGTH_BYTES_AES_256
}

function hasNonQuantumSafeKeys(...keys: AesKey[]) {
	return keys.some((key) => !isQuantumSafe(key))
}
