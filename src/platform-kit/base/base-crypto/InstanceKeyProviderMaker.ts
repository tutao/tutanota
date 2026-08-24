import { UserFacade } from "../facades/UserFacade"
import { EntityClient } from "../../network/EntityClient"
import { EntityAdapter, InstanceKeyProviderMakerInterface, SymmetricGroupKeyLoader, TypeModelResolver } from "@tutao/instance-pipeline"
import { AesKeyLength, cryptoUtils, decryptKey, EncryptedKeyWithVersions, InstanceKeyProvider, VersionedAes256Key } from "@tutao/crypto"
import { assertNotNull, KeyVersion, Nullable } from "@tutao/utils"
import { PersistentEntity } from "@tutao/meta"
import { Permission, PermissionTypeRef } from "@tutao/entities/sys"
import { PermissionType } from "../../../entities/sys/Utils"
import { FormerKeyResolver } from "./FormerKeyResolver"

export class InstanceKeyProviderMaker implements InstanceKeyProviderMakerInterface {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly symGroupKeyLoader: SymmetricGroupKeyLoader,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly formerKeyResolver: FormerKeyResolver,
	) {}

	/**
	 * Returns an instance key provider for the instance or null.
	 *
	 * We only want to create an instance key provider if it is really necessary.
	 * Therefore, we return null if we can also use an ownerKeyProvider (e.g. we are member of the owner group)
	 * or if the instance is not shared.
	 * We also return null, if we already know that there is no way to get an instance key from permissions for the given instance.
	 */
	async makeInstanceKeyProvider(instance: PersistentEntity): Promise<Nullable<InstanceKeyProvider>> {
		const ownerGroupId = instance._ownerGroup
		if (ownerGroupId == null || instance._permissions == null) {
			return null
		}
		if (this.userFacade.hasGroup(ownerGroupId)) {
			return null // ownerKeyProvider
		}
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(instance._type)
		const formerInstanceKeysProperty = "_formerInstanceKeys"
		if (!Object.values(clientTypeModel.associations).some((a) => a.name === formerInstanceKeysProperty)) {
			return null
		}
		let formerInstanceKeysList: Nullable<Id>
		if (instance instanceof EntityAdapter) {
			formerInstanceKeysList =
				instance
					.getWrappedEncryptedInstance()
					?.getAttributeByNameOrNull(formerInstanceKeysProperty)
					?.getNullWhenNull()
					?.asArray()[0]
					?.asNestedObj()
					?.getAttributeByName("list")
					?.getNullWhenNull()
					?.asArray()[0]
					?.asId() ?? null
		} else {
			// we do not expect to reach this code path, but are not entirely sure :-)
			console.log(`makeInstanceKeyProvider: instance of type ${typeof instance}`)
			// @ts-ignore
			formerInstanceKeysList = instance[formerInstanceKeysProperty]?.list ?? null
		}
		if (formerInstanceKeysList == null) {
			return null
		}
		const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)
		let symmetricPermission: Nullable<Permission> =
			permissions.find(
				(p) =>
					// public permissions are not yet supported for decryption
					(p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) &&
					p._ownerGroup &&
					this.userFacade.hasGroup(p._ownerGroup),
			) ?? null

		if (symmetricPermission == null || symmetricPermission.symKeyVersion == null || symmetricPermission.symEncInstanceKey == null) {
			return null
		}

		const symEncInstanceKeyFromPermission: EncryptedKeyWithVersions = {
			bytes: symmetricPermission.symEncInstanceKey,
			encryptingKeyVersion: cryptoUtils.parseKeyVersion(symmetricPermission.symKeyVersion),
			encryptedKeyVersion: cryptoUtils.parseKeyVersion(assertNotNull(symmetricPermission.instanceKeyVersion)),
		}
		const permissionOwnerGroup = assertNotNull(symmetricPermission._ownerGroup)

		const symGroupKeyLoader = this.symGroupKeyLoader
		const formerKeyResolver = this.formerKeyResolver
		return async function (requestedInstanceKeyVersion: KeyVersion): Promise<VersionedAes256Key> {
			const permissionOwnerGroupKey = await symGroupKeyLoader.loadSymGroupKey(permissionOwnerGroup, symEncInstanceKeyFromPermission.encryptingKeyVersion)
			const decryptedInstanceKey = {
				object: decryptKey(permissionOwnerGroupKey, symEncInstanceKeyFromPermission.bytes, AesKeyLength.Aes256),
				version: symEncInstanceKeyFromPermission.encryptedKeyVersion,
			}

			if (decryptedInstanceKey.version === requestedInstanceKeyVersion) return decryptedInstanceKey
			if (decryptedInstanceKey.version < requestedInstanceKeyVersion)
				throw new Error(
					`instance key on the permission (version ${decryptedInstanceKey.version}) is older than the requested one (version ${requestedInstanceKeyVersion})`,
				)

			return await formerKeyResolver.findFormerInstanceKey(formerInstanceKeysList, decryptedInstanceKey, requestedInstanceKeyVersion)
		}
	}
}
