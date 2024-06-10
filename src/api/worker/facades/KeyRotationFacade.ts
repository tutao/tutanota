import { EntityClient } from "../../common/EntityClient.js"
import {
	AdminGroupKeyRotationPostIn,
	createAdminGroupKeyRotationPostIn,
	createGroupKeyRotationData,
	createGroupKeyRotationPostIn,
	createGroupKeyUpdateData,
	createGroupMembershipKeyData,
	createKeyPair,
	createMembershipPutIn,
	createPubEncKeyData,
	createRecoverCodeData,
	createUserGroupKeyRotationData,
	Group,
	GroupInfoTypeRef,
	GroupKeyRotationData,
	GroupKeyUpdate,
	GroupKeyUpdateData,
	GroupKeyUpdateTypeRef,
	GroupMember,
	GroupMembershipKeyData,
	GroupMemberTypeRef,
	GroupTypeRef,
	KeyPair,
	KeyRotation,
	KeyRotationTypeRef,
	RecoverCodeData,
	SentGroupInvitationTypeRef,
	User,
	UserGroupRootTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { GroupKeyRotationType, GroupType } from "../../common/TutanotaConstants.js"
import { assertNotNull, defer, DeferredObject, downcast, getFirstOrThrow, groupBy, isEmpty, isSameTypeRef, lazyAsync, promiseMap } from "@tutao/tutanota-utils"
import { elementIdPart, isSameId, listIdPart } from "../../common/utils/EntityUtils.js"
import { KeyLoaderFacade } from "./KeyLoaderFacade.js"
import {
	Aes256Key,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	getKeyLengthBytes,
	KEY_LENGTH_BYTES_AES_256,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { PQFacade } from "./PQFacade.js"
import { AdminGroupKeyRotationService, GroupKeyRotationInfoService, GroupKeyRotationService, MembershipService } from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { CryptoFacade, VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { CryptoWrapper } from "../crypto/CryptoWrapper.js"
import { getUserGroupMemberships } from "../../common/utils/GroupUtils.js"
import { RecoverCodeFacade, RecoverData } from "./lazy/RecoverCodeFacade.js"
import { UserFacade } from "./UserFacade.js"
import { GroupInvitationPostData, type InternalRecipientKeyData, InternalRecipientKeyDataTypeRef } from "../../entities/tutanota/TypeRefs.js"
import { ShareFacade } from "./lazy/ShareFacade.js"
import { GroupManagementFacade } from "./lazy/GroupManagementFacade.js"
import { RecipientsNotFoundError } from "../../common/error/RecipientsNotFoundError.js"

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

type PreparedUserAreaGroupKeyRotation = {
	groupKeyRotationData: GroupKeyRotationData
	preparedReInvitations: GroupInvitationPostData[]
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
	/**
	 * @VisibleForTesting
	 */
	pendingKeyRotations: PendingKeyRotation
	private readonly facadeInitializedDeferredObject: DeferredObject<void>
	private pendingGroupKeyUpdateIds: IdTuple[] // already rotated groups for which we need to update the memberships (GroupKeyUpdateIds all in one list)

	constructor(
		private readonly entityClient: EntityClient,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly pqFacade: PQFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly recoverCodeFacade: lazyAsync<RecoverCodeFacade>,
		private readonly userFacade: UserFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly shareFacade: lazyAsync<ShareFacade>,
		private readonly groupManagementFacade: lazyAsync<GroupManagementFacade>,
	) {
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			userAreaGroupsKeyRotation: [],
		}
		this.facadeInitializedDeferredObject = defer<void>()
		this.pendingGroupKeyUpdateIds = []
	}

	/**
	 * Initialize the facade with the data it needs to perform rotations later.
	 * Needs to be called during login when the password key is still available.
	 * @param pwKey the user's passphrase key. May or may not be kept in memory, depending on whether a UserGroup key rotation is scheduled.
	 * @param modernKdfType true if argon2id. no admin or user key rotation should be executed if false.
	 */
	public async initialize(pwKey: Aes256Key, modernKdfType: boolean) {
		const result = await this.serviceExecutor.get(GroupKeyRotationInfoService, null)
		if (result.userOrAdminGroupKeyRotationScheduled && modernKdfType) {
			// If we have not migrated to argon2 we postpone key rotation until next login.
			this.pendingKeyRotations.pwKey = pwKey
		}
		this.pendingGroupKeyUpdateIds = result.groupKeyUpdates
		this.facadeInitializedDeferredObject.resolve()
	}

	/**
	 * Processes pending key rotations and performs follow-up tasks such as updating memberships for groups rotated by another user.
	 * @param user
	 */
	async processPendingKeyRotationsAndUpdates(user: User): Promise<void> {
		try {
			await this.loadPendingKeyRotations(user)
			await this.processPendingKeyRotation(user)
		} finally {
			// we still try updating memberships if there was an error with rotations
			await this.updateGroupMemberships(this.pendingGroupKeyUpdateIds)
		}
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
		let preparedReInvites: GroupInvitationPostData[] = []
		for (const keyRotation of this.pendingKeyRotations.userAreaGroupsKeyRotation) {
			const { groupKeyRotationData, preparedReInvitations } = await this.prepareKeyRotationForAreaGroup(
				keyRotation,
				currentUserGroupKey,
				currentAdminGroupKey,
			)
			serviceData.groupKeyUpdates.push(groupKeyRotationData)
			preparedReInvites = preparedReInvites.concat(preparedReInvitations)
		}
		if (serviceData.groupKeyUpdates.length <= 0) {
			return
		}
		await this.serviceExecutor.post(GroupKeyRotationService, serviceData)
		const shareFacade = await this.shareFacade()
		await promiseMap(preparedReInvites, (preparedInvite) => shareFacade.sendGroupInvitationRequest(preparedInvite))
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
			groupKeyUpdatesForMembers: [], // we only rotated for admin groups with only one member
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
	): Promise<PreparedUserAreaGroupKeyRotation> {
		const targetGroupId = this.getTargetGroupId(keyRotation)
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId)
		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId)

		const newGroupKeys = await this.generateGroupKeys(targetGroup)
		const encryptedGroupKeys = this.encryptGroupKeys(targetGroup, currentGroupKey, newGroupKeys, currentUserGroupKey, currentAdminGroupKey)
		const preparedReInvitations = await this.handlePendingInvitations(targetGroup, newGroupKeys.symGroupKey)

		const groupKeyUpdatesForMembers = await this.createGroupKeyUpdatesForMembers(targetGroup, newGroupKeys.symGroupKey)

		const groupKeyRotationData = createGroupKeyRotationData({
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
			groupKeyUpdatesForMembers,
		})
		return {
			groupKeyRotationData,
			preparedReInvitations,
		}
	}

	private async handlePendingInvitations(targetGroup: Group, newTargetGroupKey: VersionedKey) {
		const preparedReInvitations: Array<GroupInvitationPostData> = []
		const targetGroupInfo = await this.entityClient.load(GroupInfoTypeRef, targetGroup.groupInfo)
		const pendingInvitations = await this.entityClient.loadAll(SentGroupInvitationTypeRef, targetGroup.invitations)
		const sentInvitationsByCapability = groupBy(pendingInvitations, (invitation) => invitation.capability)
		const shareFacade = await this.shareFacade()
		for (const [capability, sentInvitations] of sentInvitationsByCapability) {
			const inviteeMailAddresses = sentInvitations.map((invite) => invite.inviteeMailAddress)
			const prepareGroupReInvites = async (mailAddresses: string[]) => {
				const preparedInvitation = await shareFacade.prepareGroupInvitation(newTargetGroupKey, targetGroupInfo, mailAddresses, downcast(capability))
				preparedReInvitations.push(preparedInvitation)
			}
			try {
				await prepareGroupReInvites(inviteeMailAddresses)
			} catch (e) {
				// we accept removing pending invitations that we cannot send again (e.g. because the user was deactivated)
				if (e instanceof RecipientsNotFoundError) {
					const notFoundRecipients = e.message.split("\n")
					const reducedInviteeAddresses = inviteeMailAddresses.filter((address) => !notFoundRecipients.includes(address))
					if (reducedInviteeAddresses.length) {
						await prepareGroupReInvites(reducedInviteeAddresses)
					}
				} else {
					throw e
				}
			}
		}
		return preparedReInvitations
	}

	private async createGroupKeyUpdatesForMembers(group: Group, newGroupKey: VersionedKey): Promise<Array<GroupKeyUpdateData>> {
		const members = await this.entityClient.loadAll(GroupMemberTypeRef, group.members)
		const otherMembers = members.filter((member) => member.user != this.userFacade.getUser()?._id)
		return await this.tryCreatingGroupKeyUpdatesForMembers(group._id, otherMembers, newGroupKey)
	}

	private async tryCreatingGroupKeyUpdatesForMembers(groupId: Id, otherMembers: GroupMember[], newGroupKey: VersionedKey): Promise<GroupKeyUpdateData[]> {
		const groupKeyUpdates = new Array<GroupKeyUpdateData>()
		// try to reduce the amount of requests
		const groupedMembers = groupBy(otherMembers, (member) => listIdPart(member.userGroupInfo))
		const notFoundRecipients: Array<string> = []
		const membersToRemove = new Array<GroupMember>()
		for (const [listId, members] of groupedMembers) {
			const userGroupInfos = await this.entityClient.loadMultiple(
				GroupInfoTypeRef,
				listId,
				members.map((member) => elementIdPart(member.userGroupInfo)),
			)
			for (const member of members) {
				const userGroupInfoForMember = userGroupInfos.find((ugi) => isSameId(ugi._id, member.userGroupInfo))
				const memberMailAddress = assertNotNull(userGroupInfoForMember?.mailAddress) // user group info must always have a mail address
				const bucketKey = this.cryptoWrapper.aes256RandomKey()
				const sessionKey = this.cryptoWrapper.aes256RandomKey()
				const recipientKeyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(
					this.userFacade.getUserGroupId(),
					bucketKey,
					memberMailAddress,
					notFoundRecipients,
				)
				if (recipientKeyData != null && isSameTypeRef(recipientKeyData._type, InternalRecipientKeyDataTypeRef)) {
					const keyData = recipientKeyData as InternalRecipientKeyData
					const pubEncKeyData = createPubEncKeyData({
						mailAddress: keyData.mailAddress,
						pubEncBucketKey: keyData.pubEncBucketKey,
						recipientKeyVersion: keyData.recipientKeyVersion,
						senderKeyVersion: keyData.senderKeyVersion,
						protocolVersion: keyData.protocolVersion,
					})
					const groupKeyUpdateData = createGroupKeyUpdateData({
						sessionKeyEncGroupKey: this.cryptoWrapper.encryptBytes(sessionKey, bitArrayToUint8Array(newGroupKey.object)),
						sessionKeyEncGroupKeyVersion: String(newGroupKey.version),
						bucketKeyEncSessionKey: this.cryptoWrapper.encryptKey(bucketKey, sessionKey),
						pubEncBucketKeyData: pubEncKeyData,
					})
					groupKeyUpdates.push(groupKeyUpdateData)
				} else {
					membersToRemove.push(member)
				}
			}
		}
		const groupManagementFacade = await this.groupManagementFacade()
		if (membersToRemove.length !== 0) {
			// must be in sync with length of notFoundRecipients
			for (const member of membersToRemove) {
				await groupManagementFacade.removeUserFromGroup(member.user, groupId)
			}
			const reducedMembers = otherMembers.filter((member) => !membersToRemove.includes(member))
			// retry without the removed members
			return this.tryCreatingGroupKeyUpdatesForMembers(groupId, reducedMembers, newGroupKey)
		} else {
			return groupKeyUpdates
		}
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

	/**
	 *
	 * @param groupKeyUpdateIds MUST be in the same list
	 */
	async updateGroupMemberships(groupKeyUpdateIds: IdTuple[]): Promise<void> {
		if (groupKeyUpdateIds.length < 1) return
		console.log("handling group key update for groups: ", groupKeyUpdateIds)
		const groupKeyUpdateInstances = await this.entityClient.loadMultiple(
			GroupKeyUpdateTypeRef,
			listIdPart(groupKeyUpdateIds[0]),
			groupKeyUpdateIds.map((id) => elementIdPart(id)),
		)
		const groupKeyUpdates = groupKeyUpdateInstances.map((update) => this.prepareGroupMembershipUpdate(update))
		const membershipPutIn = createMembershipPutIn({
			groupKeyUpdates,
		})
		return this.serviceExecutor.put(MembershipService, membershipPutIn)
	}

	private prepareGroupMembershipUpdate(groupKeyUpdate: GroupKeyUpdate): GroupMembershipKeyData {
		const userGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const symEncGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, uint8ArrayToKey(groupKeyUpdate.groupKey))
		return createGroupMembershipKeyData({
			group: elementIdPart(groupKeyUpdate._id),
			symEncGKey: symEncGroupKey.key,
			groupKeyVersion: groupKeyUpdate.groupKeyVersion,
			symKeyVersion: String(userGroupKey.version),
		})
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
