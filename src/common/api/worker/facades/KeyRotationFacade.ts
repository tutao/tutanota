import { EntityClient } from "../../common/EntityClient.js"
import {
	AdminGroupKeyDistributionElement,
	createAdminGroupKeyDistributionElement,
	createAdminGroupKeyRotationPostIn,
	createAdminGroupKeyRotationPutIn,
	createGroupKeyRotationData,
	createGroupKeyRotationPostIn,
	createGroupKeyUpdateData,
	createGroupMembershipKeyData,
	createGroupMembershipUpdateData,
	createKeyMac,
	createKeyPair,
	createMembershipPutIn,
	createPubEncKeyData,
	createRecoverCodeData,
	createUserGroupKeyRotationData,
	createUserGroupKeyRotationPostIn,
	CustomerTypeRef,
	Group,
	GroupInfoTypeRef,
	GroupKeyRotationData,
	GroupKeyUpdate,
	GroupKeyUpdateData,
	GroupKeyUpdateTypeRef,
	GroupMember,
	GroupMembershipKeyData,
	GroupMembershipUpdateData,
	GroupMemberTypeRef,
	GroupTypeRef,
	KeyMac,
	KeyPair,
	KeyRotation,
	KeyRotationTypeRef,
	PubDistributionKey,
	PubEncKeyData,
	RecoverCodeData,
	SentGroupInvitationTypeRef,
	User,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../entities/sys/TypeRefs.js"
import {
	asPublicKeyIdentifier,
	assertEnumValue,
	CryptoProtocolVersion,
	GroupKeyRotationType,
	GroupType,
	PublicKeyIdentifierType,
} from "../../common/TutanotaConstants.js"
import {
	assertNotNull,
	defer,
	DeferredObject,
	downcast,
	getFirstOrThrow,
	groupBy,
	isEmpty,
	isNotNull,
	isSameTypeRef,
	KeyVersion,
	lazyAsync,
	promiseMap,
	Versioned,
} from "@tutao/tutanota-utils"
import { elementIdPart, getElementId, isSameId, listIdPart } from "../../common/utils/EntityUtils.js"
import { checkKeyVersionConstraints, KeyLoaderFacade, parseKeyVersion } from "./KeyLoaderFacade.js"
import {
	Aes256Key,
	AesKey,
	PublicKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	EccKeyPair,
	EncryptedPqKeyPairs,
	getKeyLengthBytes,
	isEncryptedPqKeyPairs,
	isVersionedPqPublicKey,
	KEY_LENGTH_BYTES_AES_256,
	PQKeyPairs,
	PQPublicKeys,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { PQFacade } from "./PQFacade.js"
import {
	AdminGroupKeyRotationService,
	GroupKeyRotationInfoService,
	GroupKeyRotationService,
	MembershipService,
	UserGroupKeyRotationService,
} from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { CryptoFacade } from "../crypto/CryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoWrapper.js"
import { getUserGroupMemberships } from "../../common/utils/GroupUtils.js"
import { RecoverCodeFacade } from "./lazy/RecoverCodeFacade.js"
import { UserFacade } from "./UserFacade.js"
import { GroupInvitationPostData, type InternalRecipientKeyData, InternalRecipientKeyDataTypeRef } from "../../entities/tutanota/TypeRefs.js"
import { ShareFacade } from "./lazy/ShareFacade.js"
import { GroupManagementFacade } from "./lazy/GroupManagementFacade.js"
import { RecipientsNotFoundError } from "../../common/error/RecipientsNotFoundError.js"
import { LockedError } from "../../common/error/RestError.js"
import { AsymmetricCryptoFacade } from "../crypto/AsymmetricCryptoFacade.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { brandKeyMac, KeyAuthenticationFacade } from "./KeyAuthenticationFacade.js"
import { PublicKeyProvider } from "./PublicKeyProvider.js"

assertWorkerOrNode()

export enum MultiAdminGroupKeyAdminActionPath {
	WAIT_FOR_OTHER_ADMINS,
	CREATE_DISTRIBUTION_KEYS,
	PERFORM_KEY_ROTATION,
	IMPOSSIBLE_STATE,
}

/**
 * Type to keep a pending key rotation and the password key in memory as long as the key rotation has not been processed.
 */
type PendingKeyRotation = {
	pwKey: Aes256Key | null
	//If we rotate the admin group we always want to rotate the user group for the admin user.
	// Therefore, we do not need to save two different key rotations for this case.
	adminOrUserGroupKeyRotation: KeyRotation | null
	teamOrCustomerGroupKeyRotations: Array<KeyRotation>
	userAreaGroupsKeyRotations: Array<KeyRotation>
}

type PreparedUserAreaGroupKeyRotation = {
	groupKeyRotationData: GroupKeyRotationData
	preparedReInvitations: GroupInvitationPostData[]
}

type GeneratedGroupKeys = {
	symGroupKey: VersionedKey
	encryptedKeyPair: EncryptedPqKeyPairs | null
}

type EncryptedGroupKeys = {
	newGroupKeyEncCurrentGroupKey: VersionedEncryptedKey
	keyPair: EncryptedPqKeyPairs | null
	adminGroupKeyEncNewGroupKey: VersionedEncryptedKey | null
}

type EncryptedUserGroupKeys = {
	newUserGroupKeyEncCurrentGroupKey: VersionedEncryptedKey
	passphraseKeyEncNewUserGroupKey: VersionedEncryptedKey
	keyPair: KeyPair
	recoverCodeData: RecoverCodeData | null
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
	/**
	 * Keeps track of which User and Team groups have performed Key Rotation (only for the current session).
	 * Other group types may be included, but it is not guaranteed.
	 * @private
	 */
	private groupIdsThatPerformedKeyRotations: Set<Id>
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
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
		private readonly publicKeyProvider: PublicKeyProvider,
	) {
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			teamOrCustomerGroupKeyRotations: [],
			userAreaGroupsKeyRotations: [],
		}
		this.facadeInitializedDeferredObject = defer<void>()
		this.pendingGroupKeyUpdateIds = []
		this.groupIdsThatPerformedKeyRotations = new Set<Id>()
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
			try {
				await this.loadPendingKeyRotations(user)
				await this.processPendingKeyRotation(user)
			} finally {
				// we still try updating memberships if there was an error with rotations
				await this.updateGroupMemberships(this.pendingGroupKeyUpdateIds)
			}
		} catch (e) {
			if (e instanceof LockedError) {
				// we catch here so that we also catch errors in the `finally` block
				console.log("error when processing key rotation or group key update", e)
			} else {
				throw e
			}
		}
	}

	/**
	 * Queries the server for pending key rotations for a given user and saves them and optionally the given password key (in case an admin or user group needs to be rotated).
	 *
	 * Note that this function currently makes 2 server requests to load the key rotation list and check if a key rotation is needed.
	 * This routine should be optimized in the future by saving a flag on the user to determine whether a key rotation is required or not.
	 * @VisibleForTesting
	 */
	async loadPendingKeyRotations(user: User) {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, user.userGroup.group)
		if (userGroupRoot.keyRotations != null) {
			const pendingKeyRotations = await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list)
			const keyRotationsByType = groupBy(pendingKeyRotations, (keyRotation) => keyRotation.groupKeyRotationType)
			let adminOrUserGroupKeyRotationArray: Array<KeyRotation> = [
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount),
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationMultipleUserAccount),
				keyRotationsByType.get(GroupKeyRotationType.AdminGroupKeyRotationMultipleAdminAccount),
				keyRotationsByType.get(GroupKeyRotationType.User),
			]
				.flat()
				.filter(isNotNull)
			let customerGroupKeyRotationArray = keyRotationsByType.get(GroupKeyRotationType.Customer) || []
			const adminOrUserGroupKeyRotation = adminOrUserGroupKeyRotationArray[0]
			this.pendingKeyRotations = {
				pwKey: this.pendingKeyRotations.pwKey,
				adminOrUserGroupKeyRotation: adminOrUserGroupKeyRotation ? adminOrUserGroupKeyRotation : null,
				teamOrCustomerGroupKeyRotations: customerGroupKeyRotationArray.concat(keyRotationsByType.get(GroupKeyRotationType.Team) || []),
				userAreaGroupsKeyRotations: keyRotationsByType.get(GroupKeyRotationType.UserArea) || [],
			}
		}
	}

	/**
	 * Processes the internal list of @PendingKeyRotation. Key rotations and (if existent) password keys are deleted after processing.
	 * @VisibleForTesting
	 */
	async processPendingKeyRotation(user: User) {
		await this.facadeInitializedDeferredObject.promise
		// first admin, then user and then user area
		try {
			if (this.pendingKeyRotations.adminOrUserGroupKeyRotation && this.pendingKeyRotations.pwKey) {
				const groupKeyRotationType = assertEnumValue(GroupKeyRotationType, this.pendingKeyRotations.adminOrUserGroupKeyRotation.groupKeyRotationType)
				switch (groupKeyRotationType) {
					case GroupKeyRotationType.AdminGroupKeyRotationMultipleAdminAccount:
						await this.rotateMultipleAdminsGroupKeys(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation)
						break
					case GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount:
					case GroupKeyRotationType.AdminGroupKeyRotationMultipleUserAccount:
						await this.rotateSingleAdminGroupKeys(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation)
						break
					case GroupKeyRotationType.User:
						await this.rotateUserGroupKey(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation)
						break
				}
				this.pendingKeyRotations.adminOrUserGroupKeyRotation = null
			}
		} finally {
			this.pendingKeyRotations.pwKey = null
		}

		//user area, team and customer key rotations are send in a single request, so that they can be processed in parallel
		const serviceData = createGroupKeyRotationPostIn({ groupKeyUpdates: [] })
		if (!isEmpty(this.pendingKeyRotations.teamOrCustomerGroupKeyRotations)) {
			const groupKeyRotationData = await this.rotateCustomerOrTeamGroupKeys(user)
			if (groupKeyRotationData != null) {
				serviceData.groupKeyUpdates = groupKeyRotationData
			}
			this.pendingKeyRotations.teamOrCustomerGroupKeyRotations = []
		}

		let invitationData: GroupInvitationPostData[] = []
		if (!isEmpty(this.pendingKeyRotations.userAreaGroupsKeyRotations)) {
			const { groupKeyRotationData, preparedReInvites } = await this.rotateUserAreaGroupKeys(user)
			invitationData = preparedReInvites
			if (groupKeyRotationData != null) {
				serviceData.groupKeyUpdates = serviceData.groupKeyUpdates.concat(groupKeyRotationData)
			}
			this.pendingKeyRotations.userAreaGroupsKeyRotations = []
		}
		if (serviceData.groupKeyUpdates.length <= 0) {
			return
		}
		await this.serviceExecutor.post(GroupKeyRotationService, serviceData)

		for (const groupKeyUpdate of serviceData.groupKeyUpdates) {
			this.groupIdsThatPerformedKeyRotations.add(groupKeyUpdate.group)
		}

		if (!isEmpty(invitationData)) {
			const shareFacade = await this.shareFacade()
			await promiseMap(invitationData, (preparedInvite) => shareFacade.sendGroupInvitationRequest(preparedInvite))
		}
	}

	/**
	 * @VisibleForTesting
	 */
	async rotateSingleAdminGroupKeys(user: User, passphraseKey: Aes256Key, keyRotation: KeyRotation) {
		if (hasNonQuantumSafeKeys(passphraseKey)) {
			console.log("Not allowed to rotate admin group keys with a bcrypt password key")
			return
		}
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const adminGroupMembership = getFirstOrThrow(getUserGroupMemberships(user, GroupType.Admin))
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group)
		const adminKeyRotationData = await this.prepareKeyRotationForSingleAdmin(keyRotation, user, currentUserGroupKey, currentAdminGroupKey, passphraseKey)

		await this.serviceExecutor.post(AdminGroupKeyRotationService, adminKeyRotationData.keyRotationData)
		this.groupIdsThatPerformedKeyRotations.add(user.userGroup.group)
	}

	//We assume that the logged-in user is an admin user and that the key encrypting the group key are already pq secure
	private async rotateUserAreaGroupKeys(user: User): Promise<{
		groupKeyRotationData: GroupKeyRotationData[]
		preparedReInvites: GroupInvitationPostData[]
	}> {
		// * the encrypting keys are 128-bit keys. (user group key)
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		if (hasNonQuantumSafeKeys(currentUserGroupKey.object)) {
			// user or admin group key rotation should be scheduled first on the server, so this should not happen
			console.log("Keys cannot be rotated as the encrypting keys are not pq secure")
			return { groupKeyRotationData: [], preparedReInvites: [] }
		}

		const groupKeyUpdates = new Array<GroupKeyRotationData>()
		let preparedReInvites: GroupInvitationPostData[] = []
		for (const keyRotation of this.pendingKeyRotations.userAreaGroupsKeyRotations) {
			const { groupKeyRotationData, preparedReInvitations } = await this.prepareKeyRotationForAreaGroup(keyRotation, currentUserGroupKey, user)
			groupKeyUpdates.push(groupKeyRotationData)
			preparedReInvites = preparedReInvites.concat(preparedReInvitations)
		}

		return { groupKeyRotationData: groupKeyUpdates, preparedReInvites }
	}

	//We assume that the logged-in user is an admin user and that the key encrypting the group key are already pq secure
	private async rotateCustomerOrTeamGroupKeys(user: User) {
		//group key rotation is skipped if
		// * user is not an admin user
		const adminGroupMembership = user.memberships.find((m) => m.groupType === GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount)
		if (adminGroupMembership == null) {
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

		const groupKeyUpdates = new Array<GroupKeyRotationData>()
		for (const keyRotation of this.pendingKeyRotations.teamOrCustomerGroupKeyRotations) {
			const groupKeyRotationData = await this.prepareKeyRotationForCustomerOrTeamGroup(keyRotation, currentUserGroupKey, currentAdminGroupKey, user)
			groupKeyUpdates.push(groupKeyRotationData)
		}
		return groupKeyUpdates
	}

	private async prepareKeyRotationForSingleAdmin(
		keyRotation: KeyRotation,
		user: User,
		currentUserGroupKey: VersionedKey,
		currentAdminGroupKey: VersionedKey,
		passphraseKey: Aes256Key,
	) {
		const adminGroupId = this.getTargetGroupId(keyRotation)
		const userGroupMembership = user.userGroup
		const userGroupId = userGroupMembership.group
		console.log(`KeyRotationFacade: rotate key for group: ${adminGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)

		const adminGroup = await this.entityClient.load(GroupTypeRef, adminGroupId)
		const userGroup = await this.entityClient.load(GroupTypeRef, userGroupId)

		const newAdminGroupKeys = await this.generateGroupKeys(adminGroup)
		const adminKeyPair = assertNotNull(newAdminGroupKeys.encryptedKeyPair)
		const adminPubKey = this.publicKeyProvider.convertFromEncryptedPqKeyPairs(adminKeyPair, newAdminGroupKeys.symGroupKey.version)
		const adminPubKeyMacList = await this.generatePubKeyTagsForNonAdminUsers(
			adminPubKey.object,
			newAdminGroupKeys.symGroupKey.version,
			adminGroupId,
			assertNotNull(user.customer),
			userGroupId,
		)

		const newUserGroupKeys = await this.generateGroupKeys(userGroup)
		const encryptedAdminKeys = await this.encryptGroupKeys(adminGroup, currentAdminGroupKey, newAdminGroupKeys, newAdminGroupKeys.symGroupKey)
		const encryptedUserKeys = await this.encryptUserGroupKey(userGroup, currentUserGroupKey, newUserGroupKeys, passphraseKey, newAdminGroupKeys, user)
		const membershipEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newUserGroupKeys.symGroupKey, newAdminGroupKeys.symGroupKey.object)

		const adminGroupKeyData = createGroupKeyRotationData({
			adminGroupEncGroupKey: assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).key,
			adminGroupKeyVersion: String(assertNotNull(encryptedAdminKeys.adminGroupKeyEncNewGroupKey).encryptingKeyVersion),
			groupEncPreviousGroupKey: encryptedAdminKeys.newGroupKeyEncCurrentGroupKey.key,
			groupKeyVersion: String(newAdminGroupKeys.symGroupKey.version),
			group: adminGroup._id,
			keyPair: makeKeyPair(encryptedAdminKeys.keyPair),
			groupKeyUpdatesForMembers: [], // we only rotated for admin groups with only one member,
			groupMembershipUpdateData: [
				createGroupMembershipUpdateData({
					userId: user._id,
					userEncGroupKey: membershipEncNewGroupKey.key,
					userKeyVersion: String(membershipEncNewGroupKey.encryptingKeyVersion),
				}),
			],
		})

		const userGroupKeyData = createUserGroupKeyRotationData({
			recoverCodeData: encryptedUserKeys.recoverCodeData,
			distributionKeyEncUserGroupKey: encryptedUserKeys.distributionKeyEncNewUserGroupKey,
			authVerifier: encryptedUserKeys.authVerifier,
			group: userGroup._id,
			userGroupEncPreviousGroupKey: encryptedUserKeys.newUserGroupKeyEncCurrentGroupKey.key,
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			keyPair: encryptedUserKeys.keyPair,
			adminGroupEncUserGroupKey: encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.key,
			adminGroupKeyVersion: String(encryptedUserKeys.newAdminGroupKeyEncNewUserGroupKey.encryptingKeyVersion),
			passphraseEncUserGroupKey: encryptedUserKeys.passphraseKeyEncNewUserGroupKey.key,
			pubAdminGroupEncUserGroupKey: null,
			userGroupEncAdminGroupKey: null,
		})

		return {
			keyRotationData: createAdminGroupKeyRotationPostIn({
				adminGroupKeyData,
				userGroupKeyData,
				adminPubKeyMacList,
				distribution: [],
			}),
			newAdminGroupKeys,
			newUserGroupKeys,
		}
	}

	private async generatePubKeyTagsForNonAdminUsers(
		newAdminPubKey: PQPublicKeys,
		newAdminGroupKeyVersion: KeyVersion,
		adminGroupId: Id,
		customerId: Id,
		groupToExclude: Id,
	): Promise<Array<KeyMac>> {
		const keyTags: KeyMac[] = []

		const customer = await this.entityClient.load(CustomerTypeRef, customerId)
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)

		let groupManagementFacade = await this.groupManagementFacade()

		for (const userGroupInfo of userGroupInfos) {
			if (isSameId(userGroupInfo.group, groupToExclude)) continue

			const currentUserGroupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(userGroupInfo.group)
			const tag = this.keyAuthenticationFacade.computeTag({
				tagType: "NEW_ADMIN_PUB_KEY_TAG",
				sourceOfTrust: { receivingUserGroupKey: currentUserGroupKey.object },
				untrustedKey: { newAdminPubKey },
				bindingData: {
					userGroupId: userGroupInfo.group,
					adminGroupId,
					currentReceivingUserGroupKeyVersion: currentUserGroupKey.version,
					newAdminGroupKeyVersion,
				},
			})

			const publicKeyTag = createKeyMac({
				taggingGroup: userGroupInfo.group,
				tag,
				taggedKeyVersion: String(newAdminGroupKeyVersion),
				taggingKeyVersion: String(currentUserGroupKey.version),
			})
			keyTags.push(publicKeyTag)
		}

		return keyTags
	}

	private deriveAdminGroupDistributionKeyPairEncryptionKey(
		adminGroupId: Id,
		userGroupId: Id,
		currentAdminGroupKeyVersion: KeyVersion,
		currentUserGroupKeyVersion: number,
		pwKey: Aes256Key,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, currentAdminGroupKeyVersion: ${currentAdminGroupKeyVersion}`,
			key: pwKey,
			context: "adminGroupDistributionKeyPairEncryptionKey",
		})
	}

	private async prepareKeyRotationForAreaGroup(
		keyRotation: KeyRotation,
		currentUserGroupKey: VersionedKey,
		user: User,
	): Promise<PreparedUserAreaGroupKeyRotation> {
		const targetGroupId = this.getTargetGroupId(keyRotation)
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId)
		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId)

		const newGroupKeys = await this.generateGroupKeys(targetGroup)
		const groupEncPreviousGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newGroupKeys.symGroupKey, currentGroupKey.object)
		const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(currentUserGroupKey, newGroupKeys.symGroupKey.object)
		const preparedReInvitations = await this.handlePendingInvitations(targetGroup, newGroupKeys.symGroupKey)

		const groupKeyUpdatesForMembers = await this.createGroupKeyUpdatesForMembers(targetGroup, newGroupKeys.symGroupKey)

		const groupKeyRotationData = createGroupKeyRotationData({
			adminGroupEncGroupKey: null, // for user area groups we do not have an adminGroupEncGroupKey, so we set it always to null.
			adminGroupKeyVersion: null,
			group: targetGroupId,
			groupKeyVersion: String(newGroupKeys.symGroupKey.version),
			groupEncPreviousGroupKey: groupEncPreviousGroupKey.key,
			keyPair: makeKeyPair(newGroupKeys.encryptedKeyPair),
			groupKeyUpdatesForMembers,
			groupMembershipUpdateData: [
				createGroupMembershipUpdateData({
					userId: user._id,
					userEncGroupKey: membershipSymEncNewGroupKey.key,
					userKeyVersion: String(currentUserGroupKey.version),
				}),
			],
		})
		return {
			groupKeyRotationData,
			preparedReInvitations,
		}
	}

	private async prepareKeyRotationForCustomerOrTeamGroup(
		keyRotation: KeyRotation,
		currentUserGroupKey: VersionedKey,
		currentAdminGroupKey: VersionedKey,
		user: User,
	) {
		const targetGroupId = this.getTargetGroupId(keyRotation)
		console.log(`KeyRotationFacade: rotate key for group: ${targetGroupId}, groupKeyRotationType: ${keyRotation.groupKeyRotationType}`)
		const targetGroup = await this.entityClient.load(GroupTypeRef, targetGroupId)

		const members = await this.entityClient.loadAll(GroupMemberTypeRef, targetGroup.members)
		const ownMember = members.find((member) => member.user == user._id)
		const otherMembers = members.filter((member) => member.user != user._id)
		let currentGroupKey = await this.getCurrentGroupKey(targetGroup)
		const newGroupKeys = await this.generateGroupKeys(targetGroup)
		const encryptedGroupKeys = await this.encryptGroupKeys(targetGroup, currentGroupKey, newGroupKeys, currentAdminGroupKey)

		const groupMembershipUpdateData = new Array<GroupMembershipUpdateData>()

		//for team groups the admin user might not be a member of the group
		if (ownMember) {
			const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(currentUserGroupKey, newGroupKeys.symGroupKey.object)
			groupMembershipUpdateData.push(
				createGroupMembershipUpdateData({
					userId: user._id,
					userEncGroupKey: membershipSymEncNewGroupKey.key,
					userKeyVersion: String(currentUserGroupKey.version),
				}),
			)
		}
		for (const member of otherMembers) {
			const userEncNewGroupKey: VersionedEncryptedKey = await this.encryptGroupKeyForOtherUsers(member.user, newGroupKeys.symGroupKey)
			let groupMembershipUpdate = createGroupMembershipUpdateData({
				userId: member.user,
				userEncGroupKey: userEncNewGroupKey.key,
				userKeyVersion: String(userEncNewGroupKey.encryptingKeyVersion),
			})
			groupMembershipUpdateData.push(groupMembershipUpdate)
		}

		return createGroupKeyRotationData({
			adminGroupEncGroupKey: encryptedGroupKeys.adminGroupKeyEncNewGroupKey ? encryptedGroupKeys.adminGroupKeyEncNewGroupKey.key : null,
			adminGroupKeyVersion: encryptedGroupKeys.adminGroupKeyEncNewGroupKey
				? String(encryptedGroupKeys.adminGroupKeyEncNewGroupKey.encryptingKeyVersion)
				: null,
			group: targetGroupId,
			groupKeyVersion: String(newGroupKeys.symGroupKey.version),
			groupEncPreviousGroupKey: encryptedGroupKeys.newGroupKeyEncCurrentGroupKey.key,
			keyPair: makeKeyPair(encryptedGroupKeys.keyPair),
			groupKeyUpdatesForMembers: [],
			groupMembershipUpdateData: groupMembershipUpdateData,
		})
	}

	private async getCurrentGroupKey(targetGroup: Group): Promise<VersionedKey> {
		try {
			return await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroup._id)
		} catch (e) {
			//if we cannot get/decrypt the group key via membership we try via adminEncGroupKey
			const groupManagementFacade = await this.groupManagementFacade()
			const currentKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(targetGroup._id, parseKeyVersion(targetGroup.groupKeyVersion))
			return { object: currentKey, version: parseKeyVersion(targetGroup.groupKeyVersion) }
		}
	}

	private async encryptUserGroupKey(
		userGroup: Group,
		currentUserGroupKey: VersionedKey,
		newUserGroupKeys: GeneratedGroupKeys,
		passphraseKey: Aes256Key,
		newAdminGroupKeys: GeneratedGroupKeys,
		user: User,
	): Promise<EncryptedUserGroupKeys> {
		const { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier } = this.encryptUserGroupKeyForUser(
			passphraseKey,
			newUserGroupKeys,
			userGroup,
			currentUserGroupKey,
		)

		const encryptedUserKeys = await this.encryptGroupKeys(userGroup, currentUserGroupKey, newUserGroupKeys, newAdminGroupKeys.symGroupKey)
		const recoverCodeData = await this.reencryptRecoverCodeIfExists(user, passphraseKey, newUserGroupKeys)

		return {
			newUserGroupKeyEncCurrentGroupKey: encryptedUserKeys.newGroupKeyEncCurrentGroupKey,
			newAdminGroupKeyEncNewUserGroupKey: assertNotNull(encryptedUserKeys.adminGroupKeyEncNewGroupKey),
			keyPair: assertNotNull(makeKeyPair(encryptedUserKeys.keyPair)),
			passphraseKeyEncNewUserGroupKey: membershipSymEncNewGroupKey,
			recoverCodeData,
			distributionKeyEncNewUserGroupKey,
			authVerifier,
		}
	}

	private async reencryptRecoverCodeIfExists(user: User, passphraseKey: AesKey, newUserGroupKeys: GeneratedGroupKeys): Promise<RecoverCodeData | null> {
		let recoverCodeData: RecoverCodeData | null = null
		if (user.auth?.recoverCode != null) {
			const recoverCodeFacade = await this.recoverCodeFacade()
			const recoverCode = await recoverCodeFacade.getRawRecoverCode(passphraseKey)
			const recoverData = recoverCodeFacade.encryptRecoveryCode(recoverCode, newUserGroupKeys.symGroupKey)
			recoverCodeData = createRecoverCodeData({
				recoveryCodeVerifier: recoverData.recoveryCodeVerifier,
				userEncRecoveryCode: recoverData.userEncRecoverCode,
				userKeyVersion: String(recoverData.userKeyVersion),
				recoveryCodeEncUserGroupKey: recoverData.recoverCodeEncUserGroupKey,
			})
		}
		return recoverCodeData
	}

	private encryptUserGroupKeyForUser(passphraseKey: AesKey, newUserGroupKeys: GeneratedGroupKeys, userGroup: Group, currentGroupKey: VersionedKey) {
		const versionedPassphraseKey: VersionedKey = {
			object: passphraseKey,
			version: 0, // dummy
		}
		const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(versionedPassphraseKey, newUserGroupKeys.symGroupKey.object)
		const legacyUserDistKey = this.userFacade.deriveLegacyUserDistKey(userGroup._id, passphraseKey)
		const distributionKeyEncNewUserGroupKey = this.cryptoWrapper.encryptKey(legacyUserDistKey, newUserGroupKeys.symGroupKey.object)
		const authVerifier = createAuthVerifier(passphraseKey)
		const newGroupKeyEncCurrentGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newUserGroupKeys.symGroupKey, currentGroupKey.object)
		return { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier, newGroupKeyEncCurrentGroupKey }
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
		const membersToRemove = new Array<GroupMember>()
		for (const [listId, members] of groupedMembers) {
			const userGroupInfos = await this.entityClient.loadMultiple(
				GroupInfoTypeRef,
				listId,
				members.map((member) => elementIdPart(member.userGroupInfo)),
			)
			for (const member of members) {
				const userGroupInfoForMember = userGroupInfos.find((ugi) => isSameId(ugi._id, member.userGroupInfo))
				if (userGroupInfoForMember?.deleted) {
					membersToRemove.push(member)
					continue
				}
				const memberMailAddress = assertNotNull(userGroupInfoForMember?.mailAddress) // user group info must always have a mail address
				const bucketKey = this.cryptoWrapper.aes256RandomKey()
				const sessionKey = this.cryptoWrapper.aes256RandomKey()
				// always pass an empty list because we don't want the encryption to be skipped in case other recipients weren't found
				// recipients that are not found will be null anyway, and added to membersToRemove
				const notFoundRecipients: Array<string> = []
				const keyVerificationMismatchRecipients: Array<string> = []

				const senderGroupId = this.userFacade.getUserGroupId()
				const recipientKeyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(
					senderGroupId,
					bucketKey,
					memberMailAddress,
					notFoundRecipients,
					keyVerificationMismatchRecipients,
				)
				if (recipientKeyData != null && isSameTypeRef(recipientKeyData._type, InternalRecipientKeyDataTypeRef)) {
					const keyData = recipientKeyData as InternalRecipientKeyData
					const pubEncKeyData = createPubEncKeyData({
						recipientIdentifier: keyData.mailAddress,
						recipientIdentifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
						pubEncSymKey: keyData.pubEncBucketKey,
						recipientKeyVersion: keyData.recipientKeyVersion,
						senderKeyVersion: keyData.senderKeyVersion,
						protocolVersion: keyData.protocolVersion,
						senderIdentifier: senderGroupId,
						senderIdentifierType: PublicKeyIdentifierType.GROUP_ID,
						symKeyMac: null,
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

	private async encryptGroupKeys(
		group: Group,
		currentGroupKey: VersionedKey,
		newKeys: GeneratedGroupKeys,
		adminGroupKeys: VersionedKey,
	): Promise<EncryptedGroupKeys> {
		const newGroupKeyEncCurrentGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newKeys.symGroupKey, currentGroupKey.object)
		const adminGroupKeyEncNewGroupKey = (await this.groupManagementFacade()).hasAdminEncGKey(group)
			? this.cryptoWrapper.encryptKeyWithVersionedKey(adminGroupKeys, newKeys.symGroupKey.object)
			: null

		return {
			newGroupKeyEncCurrentGroupKey: newGroupKeyEncCurrentGroupKey,
			keyPair: newKeys.encryptedKeyPair,
			adminGroupKeyEncNewGroupKey: adminGroupKeyEncNewGroupKey,
		}
	}

	/*
	Gets the userGroupKey for the given userId via the adminEncGKey and symmetrically encrypts the given newGroupKey with it. Note that the logged-in user needs
	 to be the admin of the same customer that the uer with userId belongs to.
	 */
	private async encryptGroupKeyForOtherUsers(userId: Id, newGroupKey: VersionedKey): Promise<VersionedEncryptedKey> {
		const groupManagementFacade = await this.groupManagementFacade()
		const user = await this.entityClient.load(UserTypeRef, userId)
		const userGroupKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(user.userGroup.group, parseKeyVersion(user.userGroup.groupKeyVersion))
		const encrypteNewGroupKey = this.cryptoWrapper.encryptKey(userGroupKey, newGroupKey.object)
		return { key: encrypteNewGroupKey, encryptingKeyVersion: parseKeyVersion(user.userGroup.groupKeyVersion) }
	}

	private async generateGroupKeys(group: Group): Promise<GeneratedGroupKeys> {
		const symGroupKeyBytes = this.cryptoWrapper.aes256RandomKey()
		const keyPair = await this.createNewKeyPairValue(group, symGroupKeyBytes)
		return {
			symGroupKey: {
				object: symGroupKeyBytes,
				version: checkKeyVersionConstraints(parseKeyVersion(group.groupKeyVersion) + 1),
			},
			encryptedKeyPair: keyPair,
		}
	}

	/**
	 * Not all groups have key pairs, but if they do we need to rotate them as well.
	 */
	private async createNewKeyPairValue(groupToRotate: Group, newSymmetricGroupKey: Aes256Key): Promise<EncryptedPqKeyPairs | null> {
		if (groupToRotate.currentKeys) {
			return this.generateAndEncryptPqKeyPairs(newSymmetricGroupKey)
		} else {
			return null
		}
	}

	private async generateAndEncryptPqKeyPairs(symmmetricEncryptionKey: Aes256Key): Promise<EncryptedPqKeyPairs> {
		const newPqPairs = await this.pqFacade.generateKeyPairs()
		return {
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			pubEccKey: newPqPairs.eccKeyPair.publicKey,
			symEncPrivEccKey: this.cryptoWrapper.encryptEccKey(symmmetricEncryptionKey, newPqPairs.eccKeyPair.privateKey),
			pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(newPqPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(symmmetricEncryptionKey, newPqPairs.kyberKeyPair.privateKey),
		}
	}

	/**
	 * @VisibleForTesting
	 * @private
	 */
	setPendingKeyRotations(pendingKeyRotations: PendingKeyRotation) {
		this.pendingKeyRotations = pendingKeyRotations
		this.facadeInitializedDeferredObject.resolve()
	}

	async reset() {
		await this.facadeInitializedDeferredObject.promise
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			teamOrCustomerGroupKeyRotations: [],
			userAreaGroupsKeyRotations: [],
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

	/**
	 * This function is responsible for upgrading the encryption keys of any user according to a GroupKeyRotation object
	 * Before rotating the keys the user will check that the admin hash created by the admin and encrypted with this user
	 * group key matches the hash generated by the user for this rotation.
	 *
	 * @param user
	 * @param pwKey
	 * @param userGroupKeyRotation
	 * @private
	 */
	private async rotateUserGroupKey(user: User, pwKey: AesKey, userGroupKeyRotation: KeyRotation) {
		const userGroupMembership = user.userGroup
		const userGroupId = userGroupMembership.group
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		console.log(`KeyRotationFacade: rotate key for group: ${userGroupId}, groupKeyRotationType: ${userGroupKeyRotation.groupKeyRotationType}`)

		const userGroup: Group = await this.entityClient.load(GroupTypeRef, userGroupId)

		const adminGroupId = assertNotNull(userGroup.admin)

		const newUserGroupKeys = await this.generateGroupKeys(userGroup)

		const { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier, newGroupKeyEncCurrentGroupKey } = this.encryptUserGroupKeyForUser(
			pwKey,
			newUserGroupKeys,
			userGroup,
			currentUserGroupKey,
		)
		const recoverCodeData = await this.reencryptRecoverCodeIfExists(user, pwKey, newUserGroupKeys)

		let pubAdminGroupEncUserGroupKey: null | PubEncKeyData = null
		let adminGroupEncUserGroupKey: null | Uint8Array = null
		let userGroupEncAdminGroupKey: null | Uint8Array = null
		let adminGroupKeyVersion: NumberString
		//optionally decrypt new admin group key
		if (userGroupKeyRotation.distEncAdminGroupSymKey != null) {
			const encryptedKeysForAdmin = await this.handleUserGroupKeyRotationAsAdmin(
				userGroupKeyRotation,
				adminGroupId,
				pwKey,
				userGroupId,
				currentUserGroupKey,
				newUserGroupKeys,
			)
			adminGroupEncUserGroupKey = encryptedKeysForAdmin.adminGroupEncUserGroupKey
			adminGroupKeyVersion = encryptedKeysForAdmin.adminGroupKeyVersion
			userGroupEncAdminGroupKey = encryptedKeysForAdmin.userGroupEncAdminGroupKey
		} else {
			const encryptedKeysForUser = await this.handleUserGroupKeyRotationAsUser(
				userGroupKeyRotation,
				currentUserGroupKey,
				userGroupId,
				adminGroupId,
				newUserGroupKeys,
			)
			pubAdminGroupEncUserGroupKey = encryptedKeysForUser.pubAdminGroupEncUserGroupKey
			adminGroupKeyVersion = String(encryptedKeysForUser.adminGroupKeyVersion)
		}

		const userGroupKeyData = createUserGroupKeyRotationData({
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			userGroupEncPreviousGroupKey: newGroupKeyEncCurrentGroupKey.key,
			passphraseEncUserGroupKey: membershipSymEncNewGroupKey.key,
			group: userGroupId,
			distributionKeyEncUserGroupKey: distributionKeyEncNewUserGroupKey,
			keyPair: assertNotNull(makeKeyPair(newUserGroupKeys.encryptedKeyPair)),
			authVerifier,
			adminGroupKeyVersion,
			pubAdminGroupEncUserGroupKey,
			adminGroupEncUserGroupKey,
			recoverCodeData,
			userGroupEncAdminGroupKey,
		})

		await this.serviceExecutor.post(
			UserGroupKeyRotationService,
			createUserGroupKeyRotationPostIn({
				userGroupKeyData,
			}),
		)
		this.groupIdsThatPerformedKeyRotations.add(userGroupId)
	}

	private async handleUserGroupKeyRotationAsUser(
		userGroupKeyRotation: KeyRotation,
		currentUserGroupKey: VersionedKey,
		userGroupId: Id,
		adminGroupId: Id,
		newUserGroupKeys: GeneratedGroupKeys,
	) {
		if (userGroupKeyRotation.adminPubKeyMac == null) {
			throw new Error("The hash encrypted by admin is not present in the user group key rotation !")
		}

		const { taggedKeyVersion, tag, taggingKeyVersion } = brandKeyMac(userGroupKeyRotation.adminPubKeyMac)
		if (parseKeyVersion(taggingKeyVersion) !== currentUserGroupKey.version) {
			throw new Error(
				`the encrypting key version in the userEncAdminPubKeyHash does not match hash: ${taggingKeyVersion} current user group key:${currentUserGroupKey.version}`,
			)
		}

		// get admin group public keys
		const currentAdminPubKeys = await this.publicKeyProvider.loadCurrentPubKey({
			identifier: adminGroupId,
			identifierType: PublicKeyIdentifierType.GROUP_ID,
		})
		const adminGroupKeyVersion = parseKeyVersion(taggedKeyVersion)
		if (currentAdminPubKeys.version !== adminGroupKeyVersion) {
			throw new Error("the public key service did not return the tagged key version to verify the admin public key")
		}

		if (!isVersionedPqPublicKey(currentAdminPubKeys)) {
			throw new Error("the public key is not a pq public key")
		}

		this.keyAuthenticationFacade.verifyTag(
			{
				tagType: "NEW_ADMIN_PUB_KEY_TAG",
				sourceOfTrust: { receivingUserGroupKey: currentUserGroupKey.object },
				untrustedKey: { newAdminPubKey: currentAdminPubKeys.object },
				bindingData: {
					userGroupId,
					adminGroupId,
					newAdminGroupKeyVersion: adminGroupKeyVersion,
					currentReceivingUserGroupKeyVersion: currentUserGroupKey.version,
				},
			},
			tag,
		)

		const pubAdminGroupEncUserGroupKey = await this.encryptUserGroupKeyForAdminAsymmetrically(
			userGroupId,
			newUserGroupKeys,
			currentAdminPubKeys,
			adminGroupId,
			currentUserGroupKey,
		)
		return { pubAdminGroupEncUserGroupKey, adminGroupKeyVersion: currentAdminPubKeys.version }
	}

	private async handleUserGroupKeyRotationAsAdmin(
		userGroupKeyRotation: KeyRotation,
		adminGroupId: Id,
		pwKey: Aes256Key,
		userGroupId: Id,
		currentUserGroupKey: VersionedKey,
		newUserGroupKeys: GeneratedGroupKeys,
	) {
		const distEncAdminGroupSymKey = assertNotNull(userGroupKeyRotation.distEncAdminGroupSymKey, "missing new admin group key")
		const pubAdminEncGKeyAuthHash = brandKeyMac(assertNotNull(distEncAdminGroupSymKey.symKeyMac, "missing new admin group key encrypted hash"))
		if (userGroupKeyRotation.adminDistKeyPair == null || !isEncryptedPqKeyPairs(userGroupKeyRotation.adminDistKeyPair)) {
			throw new Error("missing some required parameters for a user group key rotation as admin")
		}
		//derive adminDistKeyPairDistributionKey
		const currentAdminGroupKeyFromMembership = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId) // get admin group key from the membership (not yet rotated)
		const adminGroupKeyDistributionKeyPairKey = this.deriveAdminGroupDistributionKeyPairEncryptionKey(
			adminGroupId,
			userGroupId,
			currentAdminGroupKeyFromMembership.version,
			currentUserGroupKey.version,
			pwKey,
		)

		// decrypt his private distribution key
		const adminGroupDistKeyPair = this.cryptoWrapper.decryptKeyPair(adminGroupKeyDistributionKeyPairKey, userGroupKeyRotation.adminDistKeyPair)
		//decrypt new symmetric admin group key
		const senderIdentifier = {
			identifier: assertNotNull(distEncAdminGroupSymKey.senderIdentifier),
			identifierType: asPublicKeyIdentifier(assertNotNull(distEncAdminGroupSymKey.senderIdentifierType)),
		}
		const decapsulatedNewAdminGroupKey = await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(
			adminGroupDistKeyPair,
			distEncAdminGroupSymKey,
			senderIdentifier,
		)
		const versionedNewAdminGroupKey = {
			object: decapsulatedNewAdminGroupKey.decryptedAesKey,
			version: parseKeyVersion(pubAdminEncGKeyAuthHash.taggedKeyVersion),
		}

		this.keyAuthenticationFacade.verifyTag(
			{
				tagType: "ADMIN_SYM_KEY_TAG",
				sourceOfTrust: { currentReceivingUserGroupKey: currentUserGroupKey.object },
				untrustedKey: { newAdminGroupKey: versionedNewAdminGroupKey.object },
				bindingData: {
					currentReceivingUserGroupKeyVersion: currentUserGroupKey.version,
					adminGroupId,
					userGroupId,
					newAdminGroupKeyVersion: versionedNewAdminGroupKey.version,
				},
			},
			pubAdminEncGKeyAuthHash.tag,
		)

		const adminGroupEncUserGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(versionedNewAdminGroupKey, newUserGroupKeys.symGroupKey.object).key
		const userGroupEncAdminGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(newUserGroupKeys.symGroupKey, versionedNewAdminGroupKey.object).key
		const adminGroupKeyVersion = String(versionedNewAdminGroupKey.version)
		return { adminGroupEncUserGroupKey, userGroupEncAdminGroupKey, adminGroupKeyVersion }
	}

	private async encryptUserGroupKeyForAdminAsymmetrically(
		userGroupId: Id,
		newUserGroupKeys: GeneratedGroupKeys,
		adminPubKeys: Versioned<PublicKey>,
		adminGroupId: Id,
		currentUserGroupKey: VersionedKey,
	): Promise<PubEncKeyData> {
		// we want to authenticate with new sender key pair. so we just decrypt it again
		const pqKeyPair: PQKeyPairs = this.cryptoWrapper.decryptKeyPair(newUserGroupKeys.symGroupKey.object, assertNotNull(newUserGroupKeys.encryptedKeyPair))

		const pubEncSymKey = await this.asymmetricCryptoFacade.tutaCryptEncryptSymKey(newUserGroupKeys.symGroupKey.object, adminPubKeys, {
			version: newUserGroupKeys.symGroupKey.version,
			object: pqKeyPair.eccKeyPair,
		})

		const tag = this.keyAuthenticationFacade.computeTag({
			tagType: "USER_GROUP_KEY_TAG",
			untrustedKey: {
				newUserGroupKey: newUserGroupKeys.symGroupKey.object,
			},
			sourceOfTrust: {
				currentUserGroupKey: currentUserGroupKey.object,
			},
			bindingData: {
				userGroupId,
				adminGroupId,
				newAdminGroupKeyVersion: adminPubKeys.version,
				currentUserGroupKeyVersion: currentUserGroupKey.version,
				newUserGroupKeyVersion: newUserGroupKeys.symGroupKey.version,
			},
		})

		const symKeyMac = createKeyMac({
			taggingGroup: userGroupId,
			tag,
			taggedKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			taggingKeyVersion: String(currentUserGroupKey.version),
		})

		return createPubEncKeyData({
			recipientIdentifier: adminGroupId,
			recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			pubEncSymKey: pubEncSymKey.pubEncSymKeyBytes,
			protocolVersion: pubEncSymKey.cryptoProtocolVersion,
			senderKeyVersion: pubEncSymKey.senderKeyVersion != null ? pubEncSymKey.senderKeyVersion.toString() : null,
			recipientKeyVersion: pubEncSymKey.recipientKeyVersion.toString(),
			senderIdentifier: userGroupId,
			senderIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			symKeyMac,
		})
	}

	private async createDistributionKeyPair(pwKey: Aes256Key, multiAdminKeyRotation: KeyRotation) {
		let adminGroupId = getElementId(multiAdminKeyRotation)
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const userGroupId = this.userFacade.getUserGroupId()
		const userGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const adminDistKeyPairDistributionKey = this.deriveAdminGroupDistributionKeyPairEncryptionKey(
			adminGroupId,
			userGroupId,
			currentAdminGroupKey.version,
			userGroupKey.version,
			pwKey,
		)
		const adminDistributionKeyPair = await this.generateAndEncryptPqKeyPairs(adminDistKeyPairDistributionKey)
		const adminDistPublicKey = this.publicKeyProvider.convertFromEncryptedPqKeyPairs(adminDistributionKeyPair, 0)

		const tag = this.keyAuthenticationFacade.computeTag({
			tagType: "PUB_DIST_KEY_TAG",
			sourceOfTrust: { currentAdminGroupKey: currentAdminGroupKey.object },
			untrustedKey: {
				distPubKey: adminDistPublicKey.object,
			},
			bindingData: {
				userGroupId,
				adminGroupId,
				currentUserGroupKeyVersion: currentUserGroupKey.version,
				currentAdminGroupKeyVersion: currentAdminGroupKey.version,
			},
		})

		const putDistributionKeyPairsOnKeyRotation = createAdminGroupKeyRotationPutIn({
			adminDistKeyPair: assertNotNull(makeKeyPair(adminDistributionKeyPair)),
			distKeyMac: createKeyMac({
				tag,
				taggedKeyVersion: "0", // dummy value because this is only used for the rotation and does not have a version
				taggingGroup: adminGroupId,
				taggingKeyVersion: currentAdminGroupKey.version.toString(),
			}),
		})
		await this.serviceExecutor.put(AdminGroupKeyRotationService, putDistributionKeyPairsOnKeyRotation)
	}

	async rotateMultipleAdminsGroupKeys(user: User, passphraseKey: Aes256Key, keyRotation: KeyRotation) {
		// first get all admin members' available distribution keys
		const { distributionKeys, userGroupIdsMissingDistributionKeys } = await this.serviceExecutor.get(AdminGroupKeyRotationService, null)

		switch (this.decideMultiAdminGroupKeyRotationNextPathOfAction(userGroupIdsMissingDistributionKeys, user, distributionKeys)) {
			case MultiAdminGroupKeyAdminActionPath.WAIT_FOR_OTHER_ADMINS:
				break
			case MultiAdminGroupKeyAdminActionPath.CREATE_DISTRIBUTION_KEYS:
				await this.createDistributionKeyPair(passphraseKey, keyRotation)
				break
			case MultiAdminGroupKeyAdminActionPath.PERFORM_KEY_ROTATION:
				await this.performMultiAdminKeyRotation(keyRotation, user, passphraseKey, distributionKeys)
				break
			case MultiAdminGroupKeyAdminActionPath.IMPOSSIBLE_STATE:
				throw new TutanotaError(
					"MultiAdminGroupKeyAdminActionPathImpossibleStateMetError",
					"Impossible state met while performing multi admin key rotation",
				)
		}
	}

	private async performMultiAdminKeyRotation(keyRotation: KeyRotation, user: User, passphraseKey: number[], distributionKeys: PubDistributionKey[]) {
		const adminGroupId = this.getTargetGroupId(keyRotation)

		// load current admin group key
		const currentAdminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)

		// creation of a new admin group key
		const currentUserGroupKey = this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const { keyRotationData, newAdminGroupKeys, newUserGroupKeys } = await this.prepareKeyRotationForSingleAdmin(
			keyRotation,
			user,
			currentUserGroupKey,
			currentAdminGroupKey,
			passphraseKey,
		)
		const newSymAdminGroupKey = newAdminGroupKeys.symGroupKey

		const { symGroupKey: symUserGroupKey, encryptedKeyPair: encryptedUserKeyPair } = newUserGroupKeys
		const generatedPrivateEccKey = this.cryptoWrapper.aesDecrypt(symUserGroupKey.object, assertNotNull(encryptedUserKeyPair?.symEncPrivEccKey), true)
		const generatedPublicEccKey = assertNotNull(encryptedUserKeyPair?.pubEccKey)
		const generatedEccKeyPair: Versioned<EccKeyPair> = {
			version: symUserGroupKey.version,
			object: {
				privateKey: generatedPrivateEccKey,
				publicKey: generatedPublicEccKey,
			},
		}

		const groupManagementFacade = await this.groupManagementFacade()

		// distribution for all other admins using their distribution keys
		for (const distributionKey of distributionKeys) {
			// we do not distribute for ourselves
			if (isSameId(distributionKey.userGroupId, user.userGroup.group)) continue
			// verify authenticity of this distribution key
			// reproduce hash

			const userGroupId = distributionKey.userGroupId
			const targetUserGroupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(userGroupId)
			const givenTag = brandKeyMac(distributionKey.pubKeyMac).tag

			const distributionPublicKey = this.publicKeyProvider.convertFromPubDistributionKey(distributionKey)
			this.keyAuthenticationFacade.verifyTag(
				{
					tagType: "PUB_DIST_KEY_TAG",
					sourceOfTrust: { currentAdminGroupKey: currentAdminGroupKey.object },
					untrustedKey: {
						distPubKey: distributionPublicKey.object,
					},
					bindingData: {
						userGroupId,
						adminGroupId,
						currentUserGroupKeyVersion: targetUserGroupKey.version,
						currentAdminGroupKeyVersion: currentAdminGroupKey.version,
					},
				},
				givenTag,
			)

			const encryptedAdminGroupKeyForThisAdmin = await this.asymmetricCryptoFacade.tutaCryptEncryptSymKey(
				newSymAdminGroupKey.object,
				distributionPublicKey,
				generatedEccKeyPair,
			)

			const adminSymKeyTag = this.keyAuthenticationFacade.computeTag({
				tagType: "ADMIN_SYM_KEY_TAG",
				sourceOfTrust: { currentReceivingUserGroupKey: targetUserGroupKey.object },
				untrustedKey: { newAdminGroupKey: newSymAdminGroupKey.object },
				bindingData: {
					adminGroupId,
					userGroupId,
					currentReceivingUserGroupKeyVersion: currentUserGroupKey.version,
					newAdminGroupKeyVersion: newSymAdminGroupKey.version,
				},
			})

			const symKeyMac = createKeyMac({
				taggingGroup: adminGroupId,
				taggedKeyVersion: String(newSymAdminGroupKey.version),
				taggingKeyVersion: String(currentAdminGroupKey.version),
				tag: adminSymKeyTag,
			})

			const pubEncKeyData = createPubEncKeyData({
				recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
				recipientIdentifier: "dummy",
				recipientKeyVersion: "0",
				pubEncSymKey: encryptedAdminGroupKeyForThisAdmin.pubEncSymKeyBytes,
				senderIdentifierType: PublicKeyIdentifierType.GROUP_ID,
				senderIdentifier: user.userGroup.group,
				senderKeyVersion: String(generatedEccKeyPair.version),
				protocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
				symKeyMac,
			})
			const thisAdminDistributionElement: AdminGroupKeyDistributionElement = createAdminGroupKeyDistributionElement({
				userGroupId: distributionKey.userGroupId,
				distEncAdminGroupKey: pubEncKeyData,
			})

			keyRotationData.distribution.push(thisAdminDistributionElement)
		}

		// call service
		await this.serviceExecutor.post(AdminGroupKeyRotationService, keyRotationData)
		this.groupIdsThatPerformedKeyRotations.add(user.userGroup.group)
	}

	/**
	 * Context: multi admin group key rotation
	 *
	 * This utility function determines the action a given admin must take in a multi admin group key rotation scenario
	 * This action can be one of these three
	 * - the admin should wait for the other to create their distribution keys
	 * - the admin should create their distribution keys
	 * - the admin should perform the key rotation and distribute the new keys to other admins
	 *
	 * @param userGroupIdsMissingDistributionKeys all admin member ids that currently don't have distribution keys
	 * @param adminUser the current logged-in admin user
	 * @param distributionKeys the distribution keys already created (include the admins user keys)
	 *
	 */
	public decideMultiAdminGroupKeyRotationNextPathOfAction(
		userGroupIdsMissingDistributionKeys: Id[],
		adminUser: User,
		distributionKeys: PubDistributionKey[],
	): MultiAdminGroupKeyAdminActionPath {
		const everyoneHasDistributionKeys = userGroupIdsMissingDistributionKeys.length === 0
		const everyoneElseHasDistributionKeysButMe =
			userGroupIdsMissingDistributionKeys.length === 1 && isSameId(userGroupIdsMissingDistributionKeys[0], adminUser.userGroup.group)
		const iHaveDistributionKeys = distributionKeys.some((dk) => isSameId(dk.userGroupId, adminUser.userGroup.group))

		// check order is important
		if (everyoneElseHasDistributionKeysButMe || everyoneHasDistributionKeys) {
			return MultiAdminGroupKeyAdminActionPath.PERFORM_KEY_ROTATION
		} else if (!everyoneHasDistributionKeys && iHaveDistributionKeys) {
			return MultiAdminGroupKeyAdminActionPath.WAIT_FOR_OTHER_ADMINS
		} else if (!everyoneElseHasDistributionKeysButMe && !iHaveDistributionKeys) {
			return MultiAdminGroupKeyAdminActionPath.CREATE_DISTRIBUTION_KEYS
		} else {
			return MultiAdminGroupKeyAdminActionPath.IMPOSSIBLE_STATE
		}
	}

	/**
	 * Gets a list of the groups for which we have rotated keys in the session, so far.
	 */
	public async getGroupIdsThatPerformedKeyRotations(): Promise<Array<Id>> {
		return Array.from(this.groupIdsThatPerformedKeyRotations.values())
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

function makeKeyPair(keyPair: EncryptedPqKeyPairs | null): KeyPair | null {
	return keyPair != null ? createKeyPair(keyPair) : null
}
