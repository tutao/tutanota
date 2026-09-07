import { elementIdPart, GENERATED_MAX_ID, GENERATED_MIN_ID, idToElementId, isSameSingleId, isSameTypeRef, PersistentEntity, TypeRef } from "@tutao/meta"
import {
	cryptoUtils,
	CryptoWrapper,
	deriveInstanceKey,
	KdfNonce,
	PublicKeyIdentifier,
	PublicKeyIdentifierType,
	VersionedAes256Key,
	VersionedKey,
} from "@tutao/crypto"
import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { GroupKeyRotationType, isAdminClient, ProgrammingError, SessionType } from "@tutao/app-env"
import { createAndSetOrGetKdfNonce } from "../../network/EntityRestClient"
import { TypeModelResolver } from "@tutao/instance-pipeline"
import {
	AccountingInfoTypeRef,
	createFormerInstanceKeyData,
	createInstanceKeyInstanceData,
	createInstanceKeyPermissionData,
	createInstanceKeyPermissionServiceGetIn,
	createInstanceKeyPermissionServicePostIn,
	createInstanceReferenceData,
	createTypeInfo,
	Customer,
	CustomerTypeRef,
	FormerInstanceKeyData,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupRootTypeRef,
	GroupTypeRef,
	InstanceKey,
	InstanceKeyInstanceData,
	InstanceKeyPermissionData,
	InstanceKeyPermissionService,
	InstanceKeysRef,
	InstanceKeyTypeRef,
	InstanceReferenceData,
	KeyRotation,
	KeyRotationTypeRef,
	Permission,
	PermissionTypeRef,
	SentGroupInvitationTypeRef,
	User,
	UserGroupRootTypeRef,
} from "@tutao/entities/sys"
import { assertNotNull, groupBy, KeyVersion, Nullable } from "@tutao/utils"
import { EntityClient } from "../../network/EntityClient"
import { AccountType, GroupType, isShareableGroupType } from "../../../entities/sys/Utils"
import { CryptoFacade } from "./CryptoFacade"
import { AdminKeyLoaderFacade } from "./AdminKeyLoaderFacade"
import { IServiceExecutor } from "../../network/ServiceRequest"
import { RolloutAction } from "../facades/RolloutFacade"
import { UserFacade } from "../facades/UserFacade"

export class InstanceKeyFacade {
	constructor(
		private readonly adminKeyLoaderFacade: AdminKeyLoaderFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly entityClient: EntityClient,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly serviceExecutor: IServiceExecutor,
	) {}

	async getCurrentInstanceKey(instance: PersistentEntity): Promise<VersionedAes256Key> {
		return this.getInstanceKeyImpl(instance, null)
	}

	async getInstanceKey(instance: PersistentEntity, version: KeyVersion): Promise<VersionedAes256Key> {
		return this.getInstanceKeyImpl(instance, version)
	}

	private async getInstanceKeyImpl(instance: PersistentEntity, version: Nullable<KeyVersion>): Promise<VersionedAes256Key> {
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		// we may have to create the kdfNonce here if we are sharing an old instance that has not been updated in a while
		const kdfNonce = await createAndSetOrGetKdfNonce(this.typeModelResolver, this.cryptoFacade, instance)

		let groupKey: VersionedKey
		if (version == null) {
			//also works for non-admin
			groupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(instance._ownerGroup)
		} else {
			groupKey = { object: await this.adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(instance._ownerGroup, version), version }
		}
		return this.deriveInstanceKey(groupKey, kdfNonce)
	}

	deriveInstanceKey(groupKey: VersionedKey, kdfNonce: KdfNonce): VersionedAes256Key {
		return deriveInstanceKey(groupKey, kdfNonce)
	}

	async postInstanceKeysForSharedInstances(instances: PersistentEntity[], instanceKeySharingType: Nullable<GroupKeyRotationType>) {
		const permissionDataPerInstanceList: InstanceKeyInstanceData[] = []
		//Filter for instances that actually need migration
		const instanceReferenceDataList: InstanceReferenceData[] = []
		for (const instance of instances) {
			instanceReferenceDataList.push(this.getInstanceReferenceData(instance))
		}
		const getReturn = await this.serviceExecutor.get(
			InstanceKeyPermissionService,
			createInstanceKeyPermissionServiceGetIn({ potentialInstancesToMigrate: instanceReferenceDataList, keyRotationType: instanceKeySharingType }),
			null,
		)
		const instancesToMigrate = instances.filter((i) => getReturn.confirmedInstancesToMigrate.indexOf(this.getInstanceReferenceData(i)) >= 0)

		for (const instance of instancesToMigrate) {
			const instanceKeyInstanceData = await this.prepareInstanceKeysForSharedInstance(instance)
			permissionDataPerInstanceList.push(instanceKeyInstanceData)
		}
		if (permissionDataPerInstanceList.length > 0) {
			return this.serviceExecutor.post(
				InstanceKeyPermissionService,
				createInstanceKeyPermissionServicePostIn({ permissionDataPerInstance: permissionDataPerInstanceList, keyRotationType: instanceKeySharingType }),
				null,
			)
		}
	}

	getInstanceReferenceData(instance: PersistentEntity) {
		let instanceListId: Nullable<Id> = null
		let instanceElementId: Id
		if (instance._id instanceof Array) {
			instanceListId = instance._id[0]
			instanceElementId = instance._id[1]
		} else {
			instanceElementId = instance._id
		}
		const application = instance._type.app
		const typeId = instance._type.typeId.toString()
		const typeInfo = createTypeInfo({ application, typeId })
		return createInstanceReferenceData({ instanceElementId, instanceListId, typeInfo })
	}
	async prepareInstanceKeysForSharedInstance(instance: PersistentEntity): Promise<InstanceKeyInstanceData> {
		const sharedInstanceReferenceData = this.getInstanceReferenceData(instance)

		const permissionData: InstanceKeyPermissionData[] = []
		const formerInstanceKeys: FormerInstanceKeyData[] = []

		const instanceKeyInstanceData = createInstanceKeyInstanceData({
			sharedInstanceReferenceData,
			formerInstanceKeys,
			permissionData,
		})

		let formerInstanceKeysProperty = "_formerInstanceKeys"
		if (!Object.hasOwn(instance, formerInstanceKeysProperty)) {
			throw new ProgrammingError("instance is of type that is not shared.")
		}
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		if (instance._permissions == null) {
			throw new ProgrammingError("permissions missing for instance.")
		}
		const ownerGroup = await this.entityClient.load(GroupTypeRef, idToElementId(instance._ownerGroup))
		let currentInstanceKey = await this.getCurrentInstanceKey(instance)
		let currentGroupKeyVersion = cryptoUtils.parseKeyVersion(ownerGroup.groupKeyVersion)

		// TODO maybe avoid loading if initial migration is set?!
		//TODO is it okay to ignore?
		// @ts-ignore
		const formerInstanceKeysRef: InstanceKeysRef = instance[formerInstanceKeysProperty]
		let numberOfExistingFormerInstanceKeys = 0
		if (formerInstanceKeysRef != null) {
			let listOfLastFormerKey: InstanceKey[] = await this.entityClient.loadRange(
				InstanceKeyTypeRef,
				formerInstanceKeysRef.list,
				GENERATED_MAX_ID,
				1,
				true,
			)
			numberOfExistingFormerInstanceKeys = listOfLastFormerKey.length === 0 ? 0 : cryptoUtils.parseKeyVersion(listOfLastFormerKey[0].symKeyVersion)
		}
		await this.addFormerInstanceKeys(currentInstanceKey, currentGroupKeyVersion, instance, formerInstanceKeys, numberOfExistingFormerInstanceKeys)
		// TODO check default resource, because we only return filtered permissions?!
		//  we need a way to load all. option: implement a GET on InstanceKeyPermissionService?
		const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)

		for (const permission of permissions) {
			if (permission.instanceKeyVersion != null && cryptoUtils.parseKeyVersion(permission.instanceKeyVersion) === currentGroupKeyVersion) {
				continue //there's nothing to do
			}
			let permissionOwnerGroupId = permission._ownerGroup ?? elementIdPart(permission._id)
			let permissionOwnerGroupKey: Nullable<VersionedKey> = null
			//TODO do we want to keep this?
			if (isSameTypeRef(instance._type, AccountingInfoTypeRef)) {
				// the system customer has a permission to decrypt the accounting info, but we do not have access to the symmetric system customer group key
				// so we use asymmetric encryption to provide access to new instance keys.
				await this.addAsymmetricPermissionData(instance._ownerGroup, currentInstanceKey, permissionOwnerGroupId, permission, permissionData)
				continue
			}
			// we just try getting the symmetric key:
			// 1. a) regular group membership
			// 1. b) via adminEncGKey
			// 2. as the internal user to which an external user or mail group info belongs
			// if we still do not have the symmetric group key we fall back to asymmetric encryption
			try {
				//also works as non-admin
				permissionOwnerGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(permissionOwnerGroupId)
			} catch (e) {
				permissionOwnerGroupKey = await this.tryGettingPermissionOwnerGroupKeyForExternalGroupInfo(instance._type, permissionOwnerGroupId)
			}
			if (permissionOwnerGroupKey != null) {
				await this.addSymmetricPermissionData(permissionOwnerGroupKey, currentInstanceKey, instance, permission, permissionData)
			} else {
				// known cases should be handled in the first if statement above (see AccountingInfo)
				await this.addAsymmetricPermissionData(instance._ownerGroup, currentInstanceKey, permissionOwnerGroupId, permission, permissionData)
			}
		}

		return instanceKeyInstanceData
	}

	async shareInstanceKeysWithExternalUsers(user: User, instanceKeySharingType: Nullable<GroupKeyRotationType>) {
		// external [user|mail] groupInfos are owned by the internal mail group and instance keys will change and might need to be re-shared
		const externalGroupInfos = []
		const groupRoot = await this.entityClient.loadRoot(GroupRootTypeRef, user.userGroup.group)
		const externalUserGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, groupRoot.externalGroupInfos)
		const externalMailGroupInfos = (await this.entityClient.loadAll(GroupInfoTypeRef, assertNotNull(groupRoot.externalUserAreaGroupInfos).list)).filter(
			(groupInfo) => groupInfo.groupType === GroupType.Mail,
		)
		externalGroupInfos.push(...externalUserGroupInfos, ...externalMailGroupInfos)
		await this.postInstanceKeysForSharedInstances(externalGroupInfos, instanceKeySharingType)
	}

	async shareInstanceKeysForInternalGroupInfos(user: User, afterCustomerGroupKeyRotation: boolean, instanceKeySharingType: Nullable<GroupKeyRotationType>) {
		const groupInfos: GroupInfo[] = []
		const customerId = assertNotNull(user.customer)
		const customer = await this.entityClient.load(CustomerTypeRef, idToElementId(customerId))
		if (afterCustomerGroupKeyRotation) {
			const allInternalUserGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
			groupInfos.push(...allInternalUserGroupInfos)
		} else {
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
			groupInfos.push(userGroupInfo)
		}
		const sharedUserAreaGroupInfos = await this.prepareSharedAreaGroupInfosUserIsMemberOf(user, customer)
		groupInfos.push(...sharedUserAreaGroupInfos)
		await this.postInstanceKeysForSharedInstances(groupInfos, instanceKeySharingType)
	}

	private async prepareSharedAreaGroupInfosUserIsMemberOf(user: User, customer: Customer) {
		const userAreaGroupIdsFromMemberships: Id[] = user.memberships
			.filter((m) => isShareableGroupType(m.groupType as GroupType) && isSameSingleId(m.groupInfo[0], assertNotNull(customer.userAreaGroups).list))
			.map((m) => m.group)
		if (userAreaGroupIdsFromMemberships.length < 1) {
			return []
		}
		const userAreaGroupsFromMemberships = await this.entityClient.loadMultiple(GroupTypeRef, null, userAreaGroupIdsFromMemberships)
		const sharedUserAreaGroups = userAreaGroupsFromMemberships.filter(async (group) => {
			const members = await this.entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 2, false)
			if (members.length > 1) {
				return true
			} else {
				const pendingInvitations = await this.entityClient.loadRange(SentGroupInvitationTypeRef, group.invitations, GENERATED_MIN_ID, 1, false)
				return pendingInvitations.length > 0
			}
		})

		return await this.entityClient.loadMultiple(
			GroupInfoTypeRef,
			assertNotNull(customer.userAreaGroups).list,
			sharedUserAreaGroups.map((group) => group.groupInfo[1]),
		)
	}

	private async addAsymmetricPermissionData(
		instanceOwnerGroupId: Id, // used as sender group. must have a key pair
		currentInstanceKey: VersionedAes256Key,
		permissionOwnerGroupId: Id,
		permission: Permission,
		permissionData: InstanceKeyPermissionData[],
	) {
		const bucketKey = this.cryptoWrapper.aes256RandomKey()
		const bucketEncInstanceKey = this.cryptoWrapper.encryptKey(bucketKey, currentInstanceKey.object)

		const recipientIdentifier: PublicKeyIdentifier = { identifier: permissionOwnerGroupId, identifierType: PublicKeyIdentifierType.GROUP_ID }
		const recipientKeyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(
			instanceOwnerGroupId,
			bucketKey,
			recipientIdentifier,
			[], // errors will be handled if recipientKeyData is null
			[],
		)
		if (recipientKeyData != null && recipientKeyData.pubEncRecipientKeyData != null) {
			permissionData.push(
				createInstanceKeyPermissionData({
					instanceKeyVersion: String(currentInstanceKey.version),
					symEncInstanceKey: bucketEncInstanceKey,
					symKeyVersion: null,
					pubEncKeyData: recipientKeyData.pubEncRecipientKeyData,
					sharingPermission: permission._id,
					symEncSessionKey: null,
				}),
			)
		} else {
			throw new ProgrammingError(`could not encrypt for recipient ${recipientIdentifier.identifier}`)
		}
	}

	private async addSymmetricPermissionData(
		permissionOwnerGroupKey: VersionedKey,
		currentInstanceKey: VersionedAes256Key,
		instance: PersistentEntity,
		permission: Permission,
		permissionData: InstanceKeyPermissionData[],
	) {
		const symEncInstanceKey = this.cryptoWrapper.encryptKeyWithVersionedKey(permissionOwnerGroupKey, currentInstanceKey.object)
		const sessionKey = await this.cryptoFacade.resolveSessionKey(instance)
		// at some point we will only use instance keys
		const symEncSessionKey = sessionKey == null ? null : this.cryptoWrapper.encryptKey(permissionOwnerGroupKey.object, sessionKey)
		permissionData.push(
			createInstanceKeyPermissionData({
				instanceKeyVersion: String(currentInstanceKey.version),
				symEncInstanceKey: symEncInstanceKey.key,
				symKeyVersion: String(symEncInstanceKey.encryptingKeyVersion),
				pubEncKeyData: null,
				sharingPermission: permission._id,
				symEncSessionKey,
			}),
		)
	}

	private async tryGettingPermissionOwnerGroupKeyForExternalGroupInfo<T>(
		instanceTypeRef: TypeRef<T>,
		permissionOwnerGroupId: string,
	): Promise<Nullable<VersionedKey>> {
		if (isSameTypeRef(GroupInfoTypeRef, instanceTypeRef)) {
			const permissionOwnerGroup = await this.entityClient.load(GroupTypeRef, idToElementId(permissionOwnerGroupId))
			if (permissionOwnerGroup.external) {
				if (permissionOwnerGroup.type === GroupType.User) {
					return this.keyLoaderFacade.getCurrentExternalUserGroupKey(permissionOwnerGroupId)
				} else if (permissionOwnerGroup.type === GroupType.Mail) {
					return (await this.keyLoaderFacade.getCurrentExternalGroupKeys(permissionOwnerGroupId, assertNotNull(permissionOwnerGroup.admin)))
						.currentExternalMailGroupKey
				}
			}
		}
		return null
	}

	private async addFormerInstanceKeys(
		currentInstanceKey: VersionedAes256Key,
		currentGroupKeyVersion: KeyVersion,
		instance: PersistentEntity,
		formerInstanceKeys: FormerInstanceKeyData[],
		numberOfExistingFormerInstanceKeys: number,
	) {
		let succeedingInstanceKey = currentInstanceKey
		for (let i = currentGroupKeyVersion - 1; i >= numberOfExistingFormerInstanceKeys; i--) {
			const instanceKey = await this.getInstanceKey(instance, cryptoUtils.checkKeyVersionConstraints(i))
			const successorEncInstanceKey = this.cryptoWrapper.encryptKeyWithVersionedKey(succeedingInstanceKey, instanceKey.object)
			formerInstanceKeys.push(
				createFormerInstanceKeyData({
					instanceKeyVersion: String(instanceKey.version),
					symEncInstanceKey: successorEncInstanceKey.key,
					symKeyVersion: String(successorEncInstanceKey.encryptingKeyVersion),
				}),
			)
			succeedingInstanceKey = instanceKey
		}
	}

	async loadAndProcessPendingInstanceKeySharing(user: User) {
		const pendingInstanceKeySharing = await this.loadPendingInstanceKeySharing(user)
		await this.processPendingInstanceKeySharing(pendingInstanceKeySharing, user)
	}

	private async loadPendingInstanceKeySharing(user: User) {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, idToElementId(user.userGroup.group))
		const pendingInstanceKeySharing = await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list)
		return groupBy(pendingInstanceKeySharing, (keyRotation) => keyRotation.groupKeyRotationType)
	}

	private async processPendingInstanceKeySharing(pendingInstanceKeySharing: Map<string, Array<KeyRotation>>, user: User) {
		const pendingInstanceKeySharingAfterCustomerKeyRotation =
			pendingInstanceKeySharing.get(GroupKeyRotationType.InstanceKeySharingAfterCustomerGroupRotation) || []
		const pendingInstanceKeySharingAfterInternalMailGroupRotation =
			pendingInstanceKeySharing.get(GroupKeyRotationType.InstanceKeySharingAfterInternalMailGroupRotation) || []
		//TODO any validation here?
		if (pendingInstanceKeySharingAfterCustomerKeyRotation.length > 0) {
			await this.shareInstanceKeysForInternalGroupInfos(user, false, GroupKeyRotationType.InstanceKeySharingAfterCustomerGroupRotation)
		}
		if (pendingInstanceKeySharingAfterInternalMailGroupRotation.length > 0) {
			await this.shareInstanceKeysWithExternalUsers(user, GroupKeyRotationType.InstanceKeySharingAfterInternalMailGroupRotation)
		}
	}
}

/**
 * Explicit RolloutAction to trigger instance key sharing.
 *
 * It is easier to test this as a concrete class than it is to capture and execute lambdas getting passed around.
 */
export class InstanceKeySharingRolloutAction implements RolloutAction {
	constructor(
		private readonly instanceKeyFacade: InstanceKeyFacade,
		private readonly userFacade: UserFacade,
		private readonly modernKdfType: boolean,
		private readonly sessionType: SessionType,
	) {}

	public async execute() {
		// If we have not migrated to argon2 we postpone the migration.
		if (!isAdminClient() && this.sessionType !== SessionType.Temporary && this.modernKdfType) {
			const user = this.userFacade.getUser()
			if (user && user.accountType !== AccountType.EXTERNAL) {
				await this.instanceKeyFacade.loadAndProcessPendingInstanceKeySharing(user)
			}
		}
	}
}
