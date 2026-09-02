import { elementIdPart, GENERATED_MIN_ID, idToElementId, isSameSingleId, isSameTypeRef, PersistentEntity, TypeRef } from "@tutao/meta"
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
import { ProgrammingError } from "@tutao/app-env"
import { createAndSetOrGetKdfNonce } from "../../network/EntityRestClient"
import { TypeModelResolver } from "@tutao/instance-pipeline"
import {
	AccountingInfoTypeRef,
	createFormerInstanceKeyData,
	createInstanceKeyInstanceData,
	createInstanceKeyPermissionData,
	createInstanceKeyPermissionServicePostIn,
	createTypeInfo,
	Customer,
	CustomerTypeRef,
	FormerInstanceKeyData,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupRootTypeRef,
	GroupTypeRef,
	InstanceKeyInstanceData,
	InstanceKeyPermissionData,
	InstanceKeyPermissionService,
	Permission,
	PermissionTypeRef,
	SentGroupInvitationTypeRef,
	User,
} from "@tutao/entities/sys"
import { assertNotNull, KeyVersion, Nullable } from "@tutao/utils"
import { EntityClient } from "../../network/EntityClient"
import { GroupType, isShareableGroupType } from "../../../entities/sys/Utils"
import { CryptoFacade } from "./CryptoFacade"
import { AdminKeyLoaderFacade } from "./AdminKeyLoaderFacade"
import { IServiceExecutor } from "../../network/ServiceRequest"

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

	async postInstanceKeysForSharedInstances(instances: PersistentEntity[]) {
		const permissionDataPerInstanceList: InstanceKeyInstanceData[] = []
		for (const instance of instances) {
			const instanceKeyInstanceData = await this.prepareInstanceKeysForSharedInstance(instance)
			permissionDataPerInstanceList.push(instanceKeyInstanceData)
		}
		if (permissionDataPerInstanceList.length > 0) {
			return this.serviceExecutor.post(
				InstanceKeyPermissionService,
				createInstanceKeyPermissionServicePostIn({ permissionDataPerInstance: permissionDataPerInstanceList }),
				null,
			)
		}
	}

	async prepareInstanceKeysForSharedInstance(instance: PersistentEntity): Promise<InstanceKeyInstanceData> {
		// TODO ignore instances of a type that is not shared (_formerInstanceKeys)
		// TODO also enforce this on the server

		// TODO filter for instances that are already migrated

		let sharedInstanceListId: Nullable<Id> = null
		let sharedInstanceElementId: Id
		if (instance._id instanceof Array) {
			sharedInstanceListId = instance._id[0]
			sharedInstanceElementId = instance._id[1]
		} else {
			sharedInstanceElementId = instance._id
		}
		const application = instance._type.app
		const typeId = instance._type.typeId.toString()
		const typeInfo = createTypeInfo({ application, typeId })

		const permissionData: InstanceKeyPermissionData[] = []
		const formerInstanceKeys: FormerInstanceKeyData[] = []
		const instanceKeyInstanceData = createInstanceKeyInstanceData({
			sharedInstanceElementId,
			sharedInstanceListId,
			typeInfo,
			formerInstanceKeys,
			permissionData,
		})
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		if (instance._permissions == null) {
			throw new ProgrammingError("permissions missing for instance.")
		}
		const ownerGroup = await this.entityClient.load(GroupTypeRef, idToElementId(instance._ownerGroup))
		let currentInstanceKey = await this.getCurrentInstanceKey(instance)
		await this.addFormerInstanceKeys(currentInstanceKey, cryptoUtils.parseKeyVersion(ownerGroup.groupKeyVersion), instance, formerInstanceKeys)
		// TODO check default resource, because we only return filtered permissions?!
		//  we need a way to load all. option: implement a GET on InstanceKeyPermissionService?
		const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)

		for (const permission of permissions) {
			let permissionOwnerGroupId = permission._ownerGroup ?? elementIdPart(permission._id)
			let permissionOwnerGroupKey: Nullable<VersionedKey> = null
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

	async shareInstanceKeysWithExternalUsers(user: User) {
		// external [user|mail] groupInfos are owned by the internal mail group and instance keys will change and might need to be re-shared
		const externalGroupInfos = []
		const groupRoot = await this.entityClient.loadRoot(GroupRootTypeRef, user.userGroup.group)
		const externalUserGroupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, groupRoot.externalGroupInfos)
		const externalMailGroupInfos = (await this.entityClient.loadAll(GroupInfoTypeRef, assertNotNull(groupRoot.externalUserAreaGroupInfos).list)).filter(
			(groupInfo) => groupInfo.groupType === GroupType.Mail,
		)
		externalGroupInfos.push(...externalUserGroupInfos, ...externalMailGroupInfos)
		await this.postInstanceKeysForSharedInstances(externalGroupInfos)
	}

	async shareInstanceKeysForInternalGroupInfos(user: User, afterCustomerGroupKeyRotation: boolean) {
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
		await this.postInstanceKeysForSharedInstances(groupInfos)
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
	) {
		let succeedingInstanceKey = currentInstanceKey
		for (let i = currentGroupKeyVersion - 1; i >= 0; i--) {
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
}
