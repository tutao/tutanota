import { UserFacade } from "../facades/UserFacade"
import { EntityClient } from "../../network/EntityClient"
import { EntityAdapter, InstanceKeyProviderMakerInterface, SymmetricGroupKeyLoader, TypeModelResolver } from "@tutao/instance-pipeline"
import { AesKeyLength, cryptoUtils, decryptKey, EncryptedKeyWithVersions, InstanceKeyProvider, VersionedAes256Key } from "@tutao/crypto"
import { assertNotNull, KeyVersion, Nullable } from "@tutao/utils"
import { getElementId, isSameSingleId, PersistentEntity } from "@tutao/meta"
import { InstanceKey, InstanceKeyTypeRef, Permission, PermissionTypeRef } from "@tutao/entities/sys"
import { PermissionType } from "../../../entities/sys/Utils"
import { convertCustomIdToKeyVersion, convertKeyVersionToCustomId } from "./KeyLoaderFacade"

export class InstanceKeyProviderMaker implements InstanceKeyProviderMakerInterface {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly symGroupKeyLoader: SymmetricGroupKeyLoader,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	async makeInstanceKeyProvider(instance: PersistentEntity): Promise<Nullable<InstanceKeyProvider>> {
		const ownerGroupId = instance._ownerGroup
		if (ownerGroupId == null) return null
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
		if (instance._permissions == null || formerInstanceKeysList == null) {
			return null
		}

		if (this.userFacade.hasGroup(ownerGroupId)) {
			return null // ownerKeyProvider
		} else {
			const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)
			let symmetricPermission: Nullable<Permission> =
				permissions.find(
					(p) =>
						// public permissions are not yet supported for decryption
						(p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) &&
						p._ownerGroup &&
						this.userFacade.hasGroup(p._ownerGroup),
				) ?? null

			if (symmetricPermission == null || symmetricPermission.symKeyVersion == null || symmetricPermission.symEncInstanceKey == null) return null

			const symEncInstanceKeyFromPermission: EncryptedKeyWithVersions = {
				bytes: symmetricPermission.symEncInstanceKey,
				encryptingKeyVersion: cryptoUtils.parseKeyVersion(symmetricPermission.symKeyVersion),
				encryptedKeyVersion: cryptoUtils.parseKeyVersion(assertNotNull(symmetricPermission.instanceKeyVersion)),
			}
			const permissionOwnerGroup = assertNotNull(symmetricPermission._ownerGroup)

			// TODO find something better for these closure variables?
			const symGroupKeyLoader = this.symGroupKeyLoader
			const findFormerInstanceKey = this.findFormerInstanceKey
			return async function (requestedInstanceKeyVersion: KeyVersion): Promise<VersionedAes256Key> {
				const permissionOwnerGroupKey = await symGroupKeyLoader.loadSymGroupKey(
					permissionOwnerGroup,
					symEncInstanceKeyFromPermission.encryptingKeyVersion,
				)
				const decryptedInstanceKey = {
					object: decryptKey(permissionOwnerGroupKey, symEncInstanceKeyFromPermission.bytes, AesKeyLength.Aes256),
					version: symEncInstanceKeyFromPermission.encryptedKeyVersion,
				}

				if (decryptedInstanceKey.version === requestedInstanceKeyVersion) return decryptedInstanceKey
				if (decryptedInstanceKey.version < requestedInstanceKeyVersion)
					throw new Error(
						`instance key on the permission (version ${decryptedInstanceKey.version}) is older than the requested one (version ${requestedInstanceKeyVersion})`,
					)

				return await findFormerInstanceKey(formerInstanceKeysList, decryptedInstanceKey, requestedInstanceKeyVersion)
			}
		}
	}

	private async findFormerInstanceKey(
		formerInstanceKeysList: Id,
		currentInstanceKey: VersionedAes256Key,
		targetKeyVersion: KeyVersion,
	): Promise<VersionedAes256Key> {
		// start id is not included in the result of the range request, so we need to start at current version.
		const startId = convertKeyVersionToCustomId(currentInstanceKey.version)
		const amountOfKeysIncludingTarget = currentInstanceKey.version - targetKeyVersion

		let formerKeys: InstanceKey[] = await this.entityClient.loadRange(
			InstanceKeyTypeRef,
			formerInstanceKeysList,
			startId,
			amountOfKeysIncludingTarget,
			true,
		)
		if (amountOfKeysIncludingTarget > formerKeys.length) {
			formerKeys = await this.fixOutdatedCache(amountOfKeysIncludingTarget, formerKeys, currentInstanceKey, formerInstanceKeysList, startId)
		}

		let lastInstanceKey = currentInstanceKey

		for (const formerKey of formerKeys) {
			const formerKeyVersion = convertCustomIdToKeyVersion(getElementId(formerKey))
			if (formerKeyVersion + 1 === lastInstanceKey.version) {
				lastInstanceKey = { object: decryptKey(lastInstanceKey.object, formerKey.symEncInstanceKey, AesKeyLength.Aes256), version: formerKeyVersion }
				if (lastInstanceKey.version <= targetKeyVersion) {
					break
				}
			} else if (formerKeyVersion + 1 < lastInstanceKey.version) {
				throw new Error(`unexpected version ${formerKeyVersion}; expected ${lastInstanceKey.version}`)
			}
		}

		if (lastInstanceKey.version !== targetKeyVersion) {
			throw new Error(
				`could not get version (last version is ${lastInstanceKey.version} of ${formerKeys.length} key(s) loaded from list ${formerInstanceKeysList})`,
			)
		}

		return lastInstanceKey
	}

	/**
	 * Try reloading missing InstanceKey instances in a cached range.
	 *
	 * This can be necessary due to a race condition when processing entity event updates,
	 * when the cache is not yet up to date.
	 */
	private async fixOutdatedCache(
		amountOfKeysIncludingTarget: number,
		formerKeys: InstanceKey[],
		currentInstanceKey: VersionedAes256Key,
		formerKeysList: string,
		startId: string,
	): Promise<InstanceKey[]> {
		const missingInstanceKeyIds: Id[] = []
		for (let i = 1; i <= amountOfKeysIncludingTarget; i++) {
			const versionToCheck = convertKeyVersionToCustomId(cryptoUtils.checkKeyVersionConstraints(currentInstanceKey.version - i))
			if (!formerKeys.some((formerKey) => isSameSingleId(getElementId(formerKey), versionToCheck))) {
				missingInstanceKeyIds.push(versionToCheck)
			}
		}
		await this.entityClient.loadMultiple(InstanceKeyTypeRef, formerKeysList, missingInstanceKeyIds)
		return await this.entityClient.loadRange(InstanceKeyTypeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true)
	}
}
