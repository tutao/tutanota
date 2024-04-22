import { EntityClient } from "../../common/EntityClient.js"
import { KeyRotation, KeyRotationTypeRef, User, UserGroupRootTypeRef } from "../../entities/sys/TypeRefs.js"
import { GroupKeyRotationType, GroupType } from "../../common/TutanotaConstants.js"
import { isEmpty } from "@tutao/tutanota-utils"

/**
 * Type to keep a pending key rotation and the password key in memory as long as the key rotation has not been processed.
 */
type PendingKeyRotation = {
	pwKey: Aes256Key | null
	//If we rotate the admin group we always want to rotate the user group for the admin user.
	// Therefore, we do not need to save two different key rotations for this case.
	adminOrUserGroupKeyRotation: KeyRotation | null
	otherGroupsKeyRotation: Array<KeyRotation>
}

/**
 * Facade to handle key rotation requests. Maintains and processes @PendingKeyRotation
 */
export class KeyRotationFacade {
	pendingKeyRotations: PendingKeyRotation

	constructor(private readonly entityClient: EntityClient) {
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			otherGroupsKeyRotation: [],
		}
	}

	/**
	 * Queries the server for pending key rotations for a given user and saves them and optionally the given password key (in case an admin or user group needs to be rotated).
	 * Needs to be called during login when the password key is still available.
	 *
	 * Note that this function currently makes 2 server requests to load the key rotation list and check if a key rotation is needed.
	 * This routine should be optimized in the future by saving a flag on the user to determine whether a key rotation is required or not.
	 */
	public async loadPendingKeyRotations(user: User, pwKey: Aes256Key) {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, user.userGroup.group)
		if (userGroupRoot.keyRotations != null) {
			const pendingKeyRotations = await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list)
			const adminOrUserGroupRotation = pendingKeyRotations.find(
				(keyRotation) =>
					keyRotation.groupKeyRotationType === GroupKeyRotationType.Admin || keyRotation.groupKeyRotationType === GroupKeyRotationType.User,
			)
			this.pendingKeyRotations = {
				pwKey: adminOrUserGroupRotation ? pwKey : null,
				adminOrUserGroupKeyRotation: adminOrUserGroupRotation || null,
				otherGroupsKeyRotation: pendingKeyRotations.filter(
					(keyRotation) =>
						keyRotation.groupKeyRotationType !== GroupKeyRotationType.User && keyRotation.groupKeyRotationType !== GroupKeyRotationType.Admin,
				),
			}
		}
	}

	/**
	 * Processes the internal list of @PendingKeyRotation. Key rotations and (if existent) password keys are deleted after processing.
	 */
	public async processPendingKeyRotation() {
		// first admin, then user and then user area
		if (this.pendingKeyRotations.adminOrUserGroupKeyRotation && this.pendingKeyRotations.pwKey) {
			if (this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType == GroupKeyRotationType.Admin) {
				await this.rotateAdminGroup(this.pendingKeyRotations.pwKey)
			} else if (this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType == GroupKeyRotationType.User) {
				await this.rotateUserGroup(this.pendingKeyRotations.pwKey)
			}
			this.pendingKeyRotations.adminOrUserGroupKeyRotation = null
			this.pendingKeyRotations.pwKey = null
		}
		if (!isEmpty(this.pendingKeyRotations.otherGroupsKeyRotation)) {
			await this.rotateOtherGroups()
			this.pendingKeyRotations.otherGroupsKeyRotation = []
		}
	}

	async rotateAdminGroup(pwKey: Aes256Key) {
		console.log("TODO Rotating the admin group key")
	}

	async rotateUserGroup(pwKey: Aes256Key) {
		console.log("TODO Rotating the user group key")
	}

	async rotateOtherGroups() {
		console.log("TODO Rotating other group keys")
	}
}
