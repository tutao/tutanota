import { elementIdPart, GENERATED_MAX_ID, idToElementId, isSameTypeRef, ITypeInfo, PersistentEntity, TypeRef } from "@tutao/meta"
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
import { GroupKeyRotationType, ProgrammingError } from "@tutao/app-env"
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
	FormerInstanceKeyData,
	GroupInfoTypeRef,
	GroupTypeRef,
	InstanceKey,
	InstanceKeyInstanceData,
	InstanceKeyPermissionData,
	InstanceKeyPermissionService,
	InstanceKeysRef,
	InstanceKeyTypeRef,
	InstanceReferenceData,
	KeyRotationTypeRef,
	Permission,
	PermissionTypeRef,
	User,
	UserGroupRootTypeRef,
} from "@tutao/entities/sys"
import { assertNotNull, groupBy, KeyVersion, Nullable } from "@tutao/utils"
import { EntityClient } from "../../network/EntityClient"
import { GroupType } from "../../../entities/sys/Utils"
import { CryptoFacade } from "./CryptoFacade"
import { AdminKeyLoaderFacade } from "./AdminKeyLoaderFacade"
import { IServiceExecutor } from "../../network/ServiceRequest"

const formerInstanceKeysProperty = "_formerInstanceKeys"

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

	async loadAndProcessPendingInstanceKeySharing(user: User) {
		const pendingInstanceKeySharing = await this.loadPendingInstanceKeySharing(user)
		await this.processPendingInstanceKeySharing(pendingInstanceKeySharing)
	}

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

	async confirmAndPostInstanceKeysForSharedInstances(instances: PersistentEntity[]) {
		const instanceReferenceDataList: InstanceReferenceData[] = []
		for (const instance of instances) {
			instanceReferenceDataList.push(this.getInstanceReferenceData(instance))
		}
		const confirmedInstancesToMigrate = await this.confirmInstancesForInstanceKeySharing(instanceReferenceDataList)
		//Filter for instances that actually need migration
		const instancesToMigrate = instances.filter((instance) => confirmedInstancesToMigrate.includes(this.getInstanceReferenceData(instance)))
		return await this.migrateConfirmedInstances(instancesToMigrate, null)
	}

	async executeInstanceKeySharing(instanceKeySharingType: GroupKeyRotationType) {
		const instancesToMigrateReferenceData = await this.requestInstancesForInstanceKeySharing(instanceKeySharingType)
		const groupedReferenceData = groupBy(instancesToMigrateReferenceData, (referenceData) => {
			const groupingKey = [referenceData.typeInfo.application, referenceData.typeInfo.typeId]
			if (referenceData.instanceListId != null) {
				groupingKey.push(referenceData.instanceListId)
			}
			return groupingKey.join("/")
		})
		const instancesForMigration: PersistentEntity[] = []
		for (const [_, instanceReferenceDataList] of groupedReferenceData) {
			const firstInstanceReferenceData = instanceReferenceDataList[0]
			const instances = await this.entityClient.loadMultiple(
				typeInfoModelToTypeRef(firstInstanceReferenceData.typeInfo) as TypeRef<PersistentEntity>, // TODOis this ok?
				firstInstanceReferenceData.instanceListId,
				instanceReferenceDataList.map((ird) => ird.instanceElementId),
			)
			instancesForMigration.push(...instances)
		}
		return await this.migrateConfirmedInstances(instancesForMigration, instanceKeySharingType)
	}

	private async requestInstancesForInstanceKeySharing(instanceKeySharingType: GroupKeyRotationType): Promise<InstanceReferenceData[]> {
		return (
			await this.serviceExecutor.get(
				InstanceKeyPermissionService,
				createInstanceKeyPermissionServiceGetIn({
					potentialInstancesToMigrate: [],
					keyRotationType: instanceKeySharingType,
				}),
				null,
			)
		).confirmedInstancesToMigrate
	}

	private async confirmInstancesForInstanceKeySharing(instanceReferenceDataList: InstanceReferenceData[]): Promise<InstanceReferenceData[]> {
		return (
			await this.serviceExecutor.get(
				InstanceKeyPermissionService,
				createInstanceKeyPermissionServiceGetIn({
					potentialInstancesToMigrate: instanceReferenceDataList,
					keyRotationType: null,
				}),
				null,
			)
		).confirmedInstancesToMigrate
	}

	private async migrateConfirmedInstances(instancesToMigrate: PersistentEntity[], instanceKeySharingType: Nullable<GroupKeyRotationType>) {
		const permissionDataPerInstanceList: InstanceKeyInstanceData[] = []
		for (const instance of instancesToMigrate) {
			const instanceKeyInstanceData = await this.prepareInstanceKeysForSharedInstance(instance)
			permissionDataPerInstanceList.push(instanceKeyInstanceData)
		}
		if (permissionDataPerInstanceList.length > 0) {
			return this.serviceExecutor.post(
				InstanceKeyPermissionService,
				createInstanceKeyPermissionServicePostIn({
					permissionDataPerInstance: permissionDataPerInstanceList,
					keyRotationType: instanceKeySharingType,
				}),
				null,
			)
		}
	}

	private getInstanceReferenceData(instance: PersistentEntity) {
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

	/**
	 * @VisibleForTesting
	 */
	async prepareInstanceKeysForSharedInstance(instance: PersistentEntity): Promise<InstanceKeyInstanceData> {
		const sharedInstanceReferenceData = this.getInstanceReferenceData(instance)

		const permissionData: InstanceKeyPermissionData[] = []
		const formerInstanceKeys: FormerInstanceKeyData[] = []

		const instanceKeyInstanceData = createInstanceKeyInstanceData({
			sharedInstanceReferenceData,
			formerInstanceKeys,
			permissionData,
		})

		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(instance._type)
		if (!Object.values(clientTypeModel.associations).some((a) => a.name === formerInstanceKeysProperty)) {
			throw new ProgrammingError("instance is of type that is not shared.")
		}
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		if (instance._permissions == null) {
			throw new ProgrammingError("permissions missing for instance.")
		}
		const ownerGroup = await this.entityClient.load(GroupTypeRef, idToElementId(instance._ownerGroup))
		const currentInstanceKey = await this.getCurrentInstanceKey(instance)
		const currentGroupKeyVersion = cryptoUtils.parseKeyVersion(ownerGroup.groupKeyVersion)

		// TODO maybe avoid loading if initial migration is set?!
		const numberOfExistingFormerInstanceKeys = await this.getNumberOfExistingInstanceKeys(instance)
		await this.addFormerInstanceKeys(currentInstanceKey, currentGroupKeyVersion, instance, formerInstanceKeys, numberOfExistingFormerInstanceKeys)
		// TODO check default resource, because we only return filtered permissions?!
		//  we need a way to load all. option: implement a GET on InstanceKeyPermissionService?
		const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)

		for (const permission of permissions) {
			if (permission.instanceKeyVersion != null && cryptoUtils.parseKeyVersion(permission.instanceKeyVersion) === currentGroupKeyVersion) {
				continue //there's nothing to do
			}
			const permissionOwnerGroupId = permission._ownerGroup ?? elementIdPart(permission._id)
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

	private async getNumberOfExistingInstanceKeys(instance: PersistentEntity) {
		// @ts-ignore
		const formerInstanceKeysRef: Nullable<InstanceKeysRef> = (instance[formerInstanceKeysProperty] as InstanceKeysRef) ?? null
		let numberOfExistingFormerInstanceKeys = 0
		if (formerInstanceKeysRef != null) {
			const listOfLastFormerKey: InstanceKey[] = await this.entityClient.loadRange(
				InstanceKeyTypeRef,
				formerInstanceKeysRef.list,
				GENERATED_MAX_ID,
				1,
				true,
			)
			// symKeyVersion = instanceKeyVersion + 1; versions start with 0
			numberOfExistingFormerInstanceKeys = listOfLastFormerKey.length === 0 ? 0 : cryptoUtils.parseKeyVersion(listOfLastFormerKey[0].symKeyVersion)
		}
		return numberOfExistingFormerInstanceKeys
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

	private async loadPendingInstanceKeySharing(user: User): Promise<GroupKeyRotationType[]> {
		const userGroupRoot = await this.entityClient.load(UserGroupRootTypeRef, idToElementId(user.userGroup.group))
		return (await this.entityClient.loadAll(KeyRotationTypeRef, userGroupRoot.keyRotations.list))
			.filter((kr) =>
				[
					GroupKeyRotationType.InstanceKeySharingAfterCustomerGroupRotation,
					GroupKeyRotationType.InstanceKeySharingAfterInternalMailGroupRotation,
				].includes(kr.groupKeyRotationType as GroupKeyRotationType),
			)
			.map((keyRotation) => keyRotation.groupKeyRotationType as GroupKeyRotationType)
	}

	private async processPendingInstanceKeySharing(pendingInstanceKeySharing: GroupKeyRotationType[]) {
		for (const instanceKeySharingType of pendingInstanceKeySharing) {
			await this.executeInstanceKeySharing(instanceKeySharingType)
		}
	}
}

function typeInfoModelToTypeRef<T>(typeInfo: ITypeInfo): TypeRef<T> {
	return new TypeRef(typeInfo.application, Number(typeInfo.typeId))
}
