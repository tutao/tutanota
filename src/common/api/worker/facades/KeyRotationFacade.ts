import { EntityClient } from "../../common/EntityClient.js"
import {
	AdminGroupKeyAuthenticationData,
	AdminGroupKeyRotationPostIn,
	createAdminGroupKeyAuthenticationData,
	createAdminGroupKeyRotationPostIn,
	createGroupKeyRotationData,
	createGroupKeyRotationPostIn,
	createGroupKeyUpdateData,
	createGroupMembershipKeyData,
	createGroupMembershipUpdateData,
	createKeyPair,
	createMembershipPutIn,
	createPubEncKeyData,
	createPublicKeyGetIn,
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
	KeyPair,
	KeyRotation,
	KeyRotationTypeRef,
	PubEncKeyData,
	PublicKeyGetOut,
	RecoverCodeData,
	SentGroupInvitationTypeRef,
	User,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { assertEnumValue, GroupKeyRotationType, GroupType, PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import {
	arrayEquals,
	assertNotNull,
	concat,
	defer,
	DeferredObject,
	downcast,
	getFirstOrThrow,
	groupBy,
	isEmpty,
	isNotNull,
	isSameTypeRef,
	lazyAsync,
	promiseMap,
	Versioned,
} from "@tutao/tutanota-utils"
import { customIdToUint8array, elementIdPart, isSameId, listIdPart } from "../../common/utils/EntityUtils.js"
import { KeyLoaderFacade } from "./KeyLoaderFacade.js"
import {
	Aes256Key,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	EncryptedPqKeyPairs,
	getKeyLengthBytes,
	KEY_LENGTH_BYTES_AES_256,
	PQKeyPairs,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { PQFacade } from "./PQFacade.js"
import {
	AdminGroupKeyRotationService,
	GroupKeyRotationInfoService,
	GroupKeyRotationService,
	MembershipService,
	PublicKeyService,
	UserGroupKeyRotationService,
} from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { CryptoFacade, PublicKeys } from "../crypto/CryptoFacade.js"
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

assertWorkerOrNode()

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
	) {
		this.pendingKeyRotations = {
			pwKey: null,
			adminOrUserGroupKeyRotation: null,
			teamOrCustomerGroupKeyRotations: [],
			userAreaGroupsKeyRotations: [],
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
			try {
				await this.loadPendingKeyRotations(user)
				await this.processPendingKeyRotation(user)
			} finally {
				// we still try updating memberships if there was an error with rotations
				await this.updateGroupMemberships(this.pendingGroupKeyUpdateIds)
			}
		} catch (e) {
			if (e instanceof LockedError) {
				// we catch here so that we also catch errors in the finally block
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
						console.log("Rotating the admin group with multiple members is not yet implemented")
						break
					case GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount:
					case GroupKeyRotationType.AdminGroupKeyRotationMultipleUserAccount:
						await this.rotateAdminGroupKeys(user, this.pendingKeyRotations.pwKey, this.pendingKeyRotations.adminOrUserGroupKeyRotation)
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

		if (!isEmpty(invitationData)) {
			const shareFacade = await this.shareFacade()
			await promiseMap(invitationData, (preparedInvite) => shareFacade.sendGroupInvitationRequest(preparedInvite))
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
		const adminKeyPair = assertNotNull(newAdminGroupKeys.encryptedKeyPair)
		const pubEccKey = assertNotNull(adminKeyPair.pubEccKey)
		const pubKyberKey = assertNotNull(adminKeyPair.pubKyberKey)
		const adminGroupKeyAuthenticationDataList = await this.generateEncryptedKeyHashes(
			pubEccKey,
			pubKyberKey,
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
		})

		return createAdminGroupKeyRotationPostIn({ adminGroupKeyData, userGroupKeyData, adminGroupKeyAuthenticationDataList })
	}

	private async generateEncryptedKeyHashes(
		pubEccKey: Uint8Array,
		pubKyberKey: Uint8Array,
		adminGroupKeyVersion: number,
		adminGroupId: Id,
		customerId: Id,
		groupToExclude: Id,
	): Promise<Array<AdminGroupKeyAuthenticationData>> {
		const keyHash = this.generateKeyHash(adminGroupKeyVersion, adminGroupId, pubEccKey, pubKyberKey)
		const keyHashes: AdminGroupKeyAuthenticationData[] = []

		const customer = await this.entityClient.load(CustomerTypeRef, customerId)
		const userGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)

		for (const userGroupInfo of userGroupInfos) {
			if (isSameId(userGroupInfo.group, groupToExclude)) continue
			let gmf = await this.groupManagementFacade()
			const userGroupKey = await gmf.getCurrentGroupKeyViaAdminEncGKey(userGroupInfo.group)
			const authKey = this.deriveRotationHashKey(userGroupInfo.group, userGroupKey)
			const encryptedKeyHash = this.cryptoWrapper.aesEncrypt(authKey, keyHash)
			const publicKeyHash = createAdminGroupKeyAuthenticationData({
				userGroup: userGroupInfo.group,
				authKeyEncAdminRotationHash: encryptedKeyHash,
				version: String(adminGroupKeyVersion),
			})
			keyHashes.push(publicKeyHash)
		}

		return keyHashes
	}

	private deriveRotationHashKey(userGroupId: Id, userGroupKey: VersionedKey) {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: userGroupId,
			key: userGroupKey.object,
			context: "adminGroupKeyRotationHash",
		})
	}

	private generateKeyHash(adminGroupKeyVersion: number, adminGroupId: string, pubEccKey: Uint8Array, pubKyberKey: Uint8Array) {
		const versionByte = Uint8Array.from([0])
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion])
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)])
		const identifier = customIdToUint8array(adminGroupId) // also works for generated IDs
		//Format:  versionbyte, pubEccKey, pubKyberKey, groupKeyVersion, identifier, identifierType
		const hashData = concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType)
		return this.cryptoWrapper.sha256Hash(hashData)
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
			adminGroupEncGroupKey: null, // for user area groups we do not have an adminGroupEncGroupKey so we set it always to null.
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
		let currentGroupKey = await this.getCurrentGroupKey(targetGroupId, targetGroup)
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

	private async getCurrentGroupKey(targetGroupId: string, targetGroup: Group): Promise<VersionedKey> {
		try {
			return await this.keyLoaderFacade.getCurrentSymGroupKey(targetGroupId)
		} catch (e) {
			//if we cannot get/decrypt the group key via membership we try via adminEncGroupKey
			const groupManagementFacade = await this.groupManagementFacade()
			const currentKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(targetGroupId, Number(targetGroup.groupKeyVersion))
			return { object: currentKey, version: Number(targetGroup.groupKeyVersion) }
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
		const versionedPassphraseKey = {
			object: passphraseKey,
			version: 0, // dummy
		}
		const membershipSymEncNewGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(versionedPassphraseKey, newUserGroupKeys.symGroupKey.object)
		const userGroupKeyDistributionKey = this.userFacade.deriveUserGroupKeyDistributionKey(userGroup._id, passphraseKey)
		const distributionKeyEncNewUserGroupKey = this.cryptoWrapper.encryptKey(userGroupKeyDistributionKey, newUserGroupKeys.symGroupKey.object)
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
				const memberMailAddress = assertNotNull(userGroupInfoForMember?.mailAddress) // user group info must always have a mail address
				const bucketKey = this.cryptoWrapper.aes256RandomKey()
				const sessionKey = this.cryptoWrapper.aes256RandomKey()
				// always pass an empty list because we don't want the encryption to be skipped in case other recipients weren't found
				// recipients that are not found will be null anyway, and added to membersToRemove
				const notFoundRecipients: Array<string> = []
				const recipientKeyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(
					this.userFacade.getUserGroupId(),
					bucketKey,
					memberMailAddress,
					notFoundRecipients,
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
		const userGroupKey = await groupManagementFacade.getGroupKeyViaAdminEncGKey(user.userGroup.group, Number(user.userGroup.groupKeyVersion))
		const encrypteNewGroupKey = this.cryptoWrapper.encryptKey(userGroupKey, newGroupKey.object)
		return { key: encrypteNewGroupKey, encryptingKeyVersion: Number(user.userGroup.groupKeyVersion) }
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
	private async createNewKeyPairValue(groupToRotate: Group, newSymmetricGroupKey: Aes256Key): Promise<EncryptedPqKeyPairs | null> {
		if (groupToRotate.currentKeys) {
			const newPqPairs = await this.pqFacade.generateKeyPairs()
			return {
				pubRsaKey: null,
				symEncPrivRsaKey: null,
				pubEccKey: newPqPairs.eccKeyPair.publicKey,
				symEncPrivEccKey: this.cryptoWrapper.encryptEccKey(newSymmetricGroupKey, newPqPairs.eccKeyPair.privateKey),
				pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(newPqPairs.kyberKeyPair.publicKey),
				symEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(newSymmetricGroupKey, newPqPairs.kyberKeyPair.privateKey),
			}
		} else {
			return null
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
		// check hashes
		if (userGroupKeyRotation.adminGroupKeyAuthenticationData == null) {
			throw new Error("The hash encrypted by admin is not present in the user group key rotation !")
		}
		const { version: adminGroupKeyVersion, authKeyEncAdminRotationHash } = userGroupKeyRotation.adminGroupKeyAuthenticationData

		const authKey = this.deriveRotationHashKey(userGroupId, currentUserGroupKey)
		const decryptedAdminHash = this.cryptoWrapper.aesDecrypt(authKey, authKeyEncAdminRotationHash, true)

		const userGroup: Group = await this.entityClient.load(GroupTypeRef, userGroupId)

		// get admin group public keys
		const adminGroupId = assertNotNull(userGroup.admin)
		const adminPublicKeyGetIn = createPublicKeyGetIn({
			identifier: adminGroupId,
			identifierType: PublicKeyIdentifierType.GROUP_ID,
			version: null,
		})
		const adminPublicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, adminPublicKeyGetIn)
		const { pubEccKey, pubKyberKey } = adminPublicKeyGetOut
		if (pubEccKey == null) {
			throw new Error("tried to generate a keyhash when rotating but received an empty public ecc key!")
		}
		if (pubKyberKey == null) {
			throw new Error("tried to generate a keyhash when rotating but received an empty public kyber key!")
		}
		const clientGeneratedKeyHash = this.generateKeyHash(Number(adminGroupKeyVersion), adminGroupId, pubEccKey, pubKyberKey)
		// at this point the decrypted admin key hash MUST equal the one that we generated for this key rotation
		if (!arrayEquals(decryptedAdminHash, clientGeneratedKeyHash)) {
			throw new Error("mismatch between client generated hash and encrypted admin hash, aborting rotation")
		}
		const newUserGroupKeys = await this.generateGroupKeys(userGroup)

		const { membershipSymEncNewGroupKey, distributionKeyEncNewUserGroupKey, authVerifier, newGroupKeyEncCurrentGroupKey } = this.encryptUserGroupKeyForUser(
			pwKey,
			newUserGroupKeys,
			userGroup,
			currentUserGroupKey,
		)
		const recoverCodeData = await this.reencryptRecoverCodeIfExists(user, pwKey, newUserGroupKeys)

		const pubAdminGroupEncUserGroupKey = await this.encryptUserGroupKeyForAdmin(newUserGroupKeys, adminPublicKeyGetOut, adminGroupId)

		const userGroupKeyData = createUserGroupKeyRotationData({
			userGroupKeyVersion: String(newUserGroupKeys.symGroupKey.version),
			userGroupEncPreviousGroupKey: newGroupKeyEncCurrentGroupKey.key,
			passphraseEncUserGroupKey: membershipSymEncNewGroupKey.key,
			group: userGroupId,
			distributionKeyEncUserGroupKey: distributionKeyEncNewUserGroupKey,
			keyPair: assertNotNull(makeKeyPair(newUserGroupKeys.encryptedKeyPair)),
			authVerifier,
			adminGroupKeyVersion: pubAdminGroupEncUserGroupKey.recipientKeyVersion,
			pubAdminGroupEncUserGroupKey,
			adminGroupEncUserGroupKey: null,
			recoverCodeData: recoverCodeData,
		})

		await this.serviceExecutor.post(UserGroupKeyRotationService, createUserGroupKeyRotationPostIn({ userGroupKeyData }))
	}

	private async encryptUserGroupKeyForAdmin(
		newUserGroupKeys: GeneratedGroupKeys,
		publicKeyGetOut: PublicKeyGetOut,
		adminGroupId: Id,
	): Promise<PubEncKeyData> {
		const adminPubKeys: Versioned<PublicKeys> = {
			version: Number(publicKeyGetOut.pubKeyVersion),
			object: {
				pubEccKey: publicKeyGetOut.pubEccKey,
				pubKyberKey: publicKeyGetOut.pubKyberKey,
				pubRsaKey: null,
			},
		}

		// we want to authenticate with new sender key pair. so we just decrypt it again
		const pqKeyPair: PQKeyPairs = this.cryptoWrapper.decryptKeyPair(newUserGroupKeys.symGroupKey.object, assertNotNull(newUserGroupKeys.encryptedKeyPair))

		const pubEncSymKey = await this.asymmetricCryptoFacade.tutaCryptEncryptSymKey(newUserGroupKeys.symGroupKey.object, adminPubKeys, {
			version: newUserGroupKeys.symGroupKey.version,
			object: pqKeyPair.eccKeyPair,
		})

		return createPubEncKeyData({
			recipientIdentifier: adminGroupId,
			recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			pubEncSymKey: pubEncSymKey.pubEncSymKeyBytes,
			protocolVersion: pubEncSymKey.cryptoProtocolVersion,
			senderKeyVersion: pubEncSymKey.senderKeyVersion != null ? pubEncSymKey.senderKeyVersion.toString() : null,
			recipientKeyVersion: pubEncSymKey.recipientKeyVersion.toString(),
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

function makeKeyPair(keyPair: EncryptedPqKeyPairs | null): KeyPair | null {
	return keyPair != null ? createKeyPair(keyPair) : null
}
