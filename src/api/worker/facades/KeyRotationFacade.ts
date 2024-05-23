import { EntityClient } from "../../common/EntityClient.js"
import {
	createGroupKeyRotationData,
	createGroupKeyRotationPostIn,
	createKeyPair,
	Group,
	GroupKeyRotationData,
	GroupMembership,
	GroupTypeRef,
	KeyRotation,
	KeyRotationTypeRef,
	User,
	UserGroupRootTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { GroupKeyRotationType } from "../../common/TutanotaConstants.js"
import { defer, DeferredObject, isEmpty } from "@tutao/tutanota-utils"
import { elementIdPart } from "../../common/utils/EntityUtils.js"
import { KeyLoaderFacade } from "./KeyLoaderFacade.js"
import { AesKey, getKeyLengthBytes, KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto"
import { PQFacade } from "./PQFacade.js"
import { GroupKeyRotationInfoService, GroupKeyRotationService } from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { VersionedKey } from "../crypto/CryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { CryptoWrapper } from "../crypto/CryptoWrapper.js"

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
		if (this.pendingKeyRotations.adminOrUserGroupKeyRotation && this.pendingKeyRotations.pwKey) {
			switch (this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType) {
				// Currently we only support updating user area groups, so we ignore these,
				// but we leave the instances in place in case another client supports them.
				case GroupKeyRotationType.Admin:
					console.log("Rotating the admin group is not yet implemented")
					break
				case GroupKeyRotationType.User:
					console.log("Rotating the user group is not yet implemented")
					break
			}
			this.pendingKeyRotations.adminOrUserGroupKeyRotation = null
		}

		this.pendingKeyRotations.pwKey = null

		if (!isEmpty(this.pendingKeyRotations.userAreaGroupsKeyRotation)) {
			await this.rotateUserAreaGroupKeys(user)
			this.pendingKeyRotations.userAreaGroupsKeyRotation = []
		}
	}

	//We assume that the logged-in user is an admin user and the only member of the group
	async rotateUserAreaGroupKeys(user: User) {
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
		const currentAdminGroupKey = this.cryptoWrapper.decryptKey(currentUserGroupKey.object, adminGroupMembership.symEncGKey)
		if (hasNonQuantumSafeKeys(currentUserGroupKey.object, currentAdminGroupKey)) {
			// admin group key rotation should be scheduled first on the server, so this should not happen
			console.log("Keys cannot be rotated as the encrypting keys are not pq secure")
			return
		}

		const serviceData = createGroupKeyRotationPostIn({ groupKeyUpdates: [] })
		for (const keyRotation of this.pendingKeyRotations.userAreaGroupsKeyRotation) {
			const groupKeyRotationData = await this.prepareKeyRotationForAreaGroup(keyRotation, currentUserGroupKey, currentAdminGroupKey, adminGroupMembership)
			serviceData.groupKeyUpdates.push(groupKeyRotationData)
		}
		if (serviceData.groupKeyUpdates.length <= 0) {
			return
		}
		await this.serviceExecutor.post(GroupKeyRotationService, serviceData)
	}

	private async prepareKeyRotationForAreaGroup(
		keyRotation: KeyRotation,
		currentUserGroupKey: VersionedKey,
		currentAdminGroupKey: AesKey,
		adminGroupMembership: GroupMembership,
	): Promise<GroupKeyRotationData> {
		const targetGroupId = this.getTargetGroupId(keyRotation)
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId)
		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId)

		// * new symmetric group key is generated and encrypted
		const newSymmetricGroupKey = this.cryptoWrapper.aes256RandomKey()
		const userGroupEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(currentUserGroupKey, newSymmetricGroupKey)
		const newGroupKeyEncFormerGroupKey = this.cryptoWrapper.encryptKey(newSymmetricGroupKey, currentGroupKey.object)

		// only encrypt with admin key if exists
		const { updatedAdminGroupEncGKey, adminGroupKeyVersion } = this.getAdminValues(
			targetGroup,
			currentAdminGroupKey,
			newSymmetricGroupKey,
			adminGroupMembership,
		)

		// * new asymmetric key pair is generated, when group already has asymmetric key pair
		const keyPair = await this.getKeyPairValue(targetGroup, newSymmetricGroupKey)

		return createGroupKeyRotationData({
			userEncGroupKey: userGroupEncNewGroupKey.key,
			userKeyVersion: String(currentUserGroupKey.version),
			adminGroupEncGroupKey: updatedAdminGroupEncGKey,
			adminGroupKeyVersion: adminGroupKeyVersion,
			group: targetGroupId,
			groupKeyVersion: keyRotation.targetKeyVersion,
			groupEncPreviousGroupKey: newGroupKeyEncFormerGroupKey,
			keyPair: keyPair,
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

	/**
	 * Not all groups have key pairs, but if they do we need to rotate them as well.
	 */
	private async getKeyPairValue(groupToRotate: Group, newSymmetricGroupKey: Aes256Key) {
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

	/**
	 * Not all groups have the group key encrypted for the admin, but if they do, we need to update those values too.
	 */
	private getAdminValues(groupToRotate: Group, currentAdminGroupKey: AesKey, newSymmetricGroupKey: Aes256Key, adminGroupMembership: GroupMembership) {
		let updatedAdminGroupEncGKey: Uint8Array | null = null
		let adminGroupKeyVersion: NumberString | null = null
		if (this.hasAdminEncGKey(groupToRotate)) {
			updatedAdminGroupEncGKey = this.cryptoWrapper.encryptKey(currentAdminGroupKey, newSymmetricGroupKey)
			adminGroupKeyVersion = adminGroupMembership.groupKeyVersion
		}
		return { updatedAdminGroupEncGKey, adminGroupKeyVersion }
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
