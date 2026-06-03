import { AttributeModel, elementIdPart, isSameTypeRef, TypeRef } from "../meta"
import { aes256RandomKey, AesKey, cryptoUtils, CryptoWrapper, decryptKey, VersionedEncryptedKey, VersionedKey } from "@tutao/crypto"
import { EntityAdapter, InstancePipeline, LoggedInUserProvider, SymmetricGroupKeyLoader, typeModelToRestPath } from "@tutao/instance-pipeline"
import { assertNotNull, downcast, ofClass, uint8ArrayToBase64 } from "@tutao/utils"
import { SessionKeyNotFoundError } from "@tutao/crypto/error"
import { HttpMethod, RestClientInterface } from "../rest-client/types"
import { EntityClient } from "./EntityClient"
import { IServiceExecutor } from "./ServiceRequest"
import { TypeModelResolver } from "../instance-pipeline/EntityFunctions"
import { ClientTypeModel, Entity } from "../meta/EntityTypes"
import {
	createPatch,
	createPatchList,
	createUpdateKdfNoncePostIn,
	GroupInfoTypeRef,
	GroupMembership,
	InstanceKdfNonce,
	PatchListTypeRef,
	PermissionTypeRef,
	PushIdentifierTypeRef,
	UpdateKdfNoncePostOut,
	UpdateKdfNonceService,
} from "@tutao/entities/sys"
import { GroupType } from "../../entities/sys/Utils"
import { createEncryptTutanotaPropertiesData, EncryptTutanotaPropertiesService, TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { PatchOperationType } from "../instance-pipeline/PatchGenerator"
import { PayloadTooLargeError } from "@tutao/rest-client/error"

export class CryptoNetworkHelper {
	constructor(
		protected readonly cryptoWrapper: CryptoWrapper,
		protected readonly loggedInUserProvider: LoggedInUserProvider,
		protected readonly symGroupKeyLoader: SymmetricGroupKeyLoader,
		protected readonly entityClient: EntityClient,
		protected readonly serviceExecutor: IServiceExecutor,
		protected readonly typeModelResolver: TypeModelResolver,
		protected readonly instancePipeline: InstancePipeline,
		protected readonly restClient: RestClientInterface,
	) {}

	async getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		return await this.symGroupKeyLoader.getCurrentSymGroupKey(groupId)
	}

	/**
	 * Creates a new _ownerEncSessionKey and assigns it to the provided entity
	 * the entity must already have an _ownerGroup
	 * @returns the generated key
	 */
	async setNewOwnerEncSessionKey(clientTypeModel: ClientTypeModel, instance: Entity, keyToEncryptSessionKey?: VersionedKey): Promise<AesKey | null> {
		if (!instance._ownerGroup) {
			throw new Error(`no owner group set  ${JSON.stringify(instance)}`)
		}

		if (clientTypeModel.encrypted) {
			if (instance._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set ${JSON.stringify(instance)}`)
			}
			const sessionKey = aes256RandomKey()
			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? (await this.symGroupKeyLoader.getCurrentSymGroupKey(instance._ownerGroup))
			const encryptedSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(effectiveKeyToEncryptSessionKey, sessionKey)

			this.setOwnerEncSessionKey(instance, encryptedSessionKey)
			return sessionKey
		}
		return null
	}

	public setOwnerEncSessionKey(instance: Entity, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup?: Id) {
		instance._ownerEncSessionKey = ownerEncSessionKey.key
		instance._ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		if (ownerGroup) {
			instance._ownerGroup = ownerGroup
		}
	}

	async decryptSessionKey(ownerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey> {
		const gk = await this.symGroupKeyLoader.loadSymGroupKey(ownerGroup, ownerEncSessionKey.encryptingKeyVersion)
		return decryptKey(gk, ownerEncSessionKey.key)
	}

	/**
	 * Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	 * @param typeRef
	 * @param data
	 * @return the unmapped and still encrypted instance
	 */
	async applyMigrations(typeRef: TypeRef<Entity>, data: EntityAdapter): Promise<EntityAdapter> {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
			return this.applyCustomerGroupOwnershipToGroupInfo(data)
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) {
			return this.encryptTutanotaProperties(data)
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) {
			return this.addSessionKeyToPushIdentifier(data)
		} else {
			return data
		}
	}

	private async applyCustomerGroupOwnershipToGroupInfo(data: EntityAdapter): Promise<EntityAdapter> {
		const customerGroupMembership = assertNotNull(
			this.loggedInUserProvider.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer),
		)
		const listPermissions = await this.entityClient.loadAll(PermissionTypeRef, data._id[0])
		const customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group)

		if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
		const customerGroupKeyVersion = cryptoUtils.parseKeyVersion(customerGroupPermission.symKeyVersion ?? "0")
		const customerGroupKey = await this.symGroupKeyLoader.loadSymGroupKey(customerGroupMembership.group, customerGroupKeyVersion)
		const versionedCustomerGroupKey = { object: customerGroupKey, version: customerGroupKeyVersion }
		const listKey = decryptKey(customerGroupKey, assertNotNull(customerGroupPermission.symEncSessionKey))
		const groupInfoSk = decryptKey(listKey, assertNotNull(data._listEncSessionKey))

		this.setOwnerEncSessionKey(data, this.cryptoWrapper.encryptKeyWithVersionedKey(versionedCustomerGroupKey, groupInfoSk), customerGroupMembership.group)
		return data
	}

	private async addSessionKeyToPushIdentifier(instance: EntityAdapter): Promise<EntityAdapter> {
		const userGroupKey = this.loggedInUserProvider.getCurrentUserGroupKey()

		// set sessionKey for allowing encryption when old instance (< v43) is updated
		await this.updateOwnerEncSessionKey(instance, userGroupKey, aes256RandomKey())
		return instance
	}

	private async encryptTutanotaProperties(instance: EntityAdapter): Promise<EntityAdapter> {
		const userGroupKey = this.loggedInUserProvider.getCurrentUserGroupKey()

		// EncryptTutanotaPropertiesService could be removed and replaced with a Migration that writes the key
		const groupEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, aes256RandomKey())
		this.setOwnerEncSessionKey(instance, groupEncSessionKey, this.loggedInUserProvider.getUserGroupId())
		const migrationData = createEncryptTutanotaPropertiesData({
			properties: elementIdPart(downcast<IdTuple>(instance._id)),
			symKeyVersion: String(groupEncSessionKey.encryptingKeyVersion),
			symEncSessionKey: groupEncSessionKey.key,
		})
		await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData)
		return instance
	}

	async postUpdateKdfNonceService(instanceKdfNonce: InstanceKdfNonce): Promise<UpdateKdfNoncePostOut> {
		const input = createUpdateKdfNoncePostIn({ instanceKdfNonce: instanceKdfNonce })
		return await this.serviceExecutor.post(UpdateKdfNonceService, input)
	}
	async updateOwnerEncSessionKey(instance: EntityAdapter, ownerGroupKey: VersionedKey, resolvedSessionKey: AesKey) {
		const newOwnerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, resolvedSessionKey)
		this.setOwnerEncSessionKey(instance, newOwnerEncSessionKey)

		const id = instance._id
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(instance._type)
		const path = typeModelToRestPath(typeModel) + "/" + (id instanceof Array ? id.join("/") : id)
		const headers = this.loggedInUserProvider.createAuthHeaders()
		headers.v = String(instance.typeModel.version)

		let ownerEncSessionKeyAttributeIdStr = assertNotNull(AttributeModel.getAttributeId(typeModel, "_ownerEncSessionKey")).toString()
		let ownerKeyVersionAttributeIdStr = assertNotNull(AttributeModel.getAttributeId(typeModel, "_ownerKeyVersion")).toString()
		if (env.networkDebugging) {
			ownerEncSessionKeyAttributeIdStr += ":_ownerEncSessionKey"
			ownerKeyVersionAttributeIdStr += ":_ownerKeyVersion"
		}

		const patchList = createPatchList({
			patches: [
				createPatch({
					patchOperation: PatchOperationType.REPLACE,
					value: uint8ArrayToBase64(newOwnerEncSessionKey.key),
					attributePath: ownerEncSessionKeyAttributeIdStr,
				}),
				createPatch({
					patchOperation: PatchOperationType.REPLACE,
					value: newOwnerEncSessionKey.encryptingKeyVersion.toString(),
					attributePath: ownerKeyVersionAttributeIdStr,
				}),
			],
		})

		const patchPayload = await this.instancePipeline.mapAndEncrypt(PatchListTypeRef, patchList, null)

		await this.restClient
			.request(path, HttpMethod.PATCH, {
				headers,
				body: JSON.stringify(patchPayload),
				queryParams: { updateOwnerEncSessionKey: "true" },
			})
			.catch(
				ofClass(PayloadTooLargeError, (e) => {
					console.log("Could not update owner enc session key - PayloadTooLargeError", e)
				}),
			)
	}
}
