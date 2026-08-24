import { EntityClient } from "../../network/EntityClient"
import { base64UrlCustomIdToString, KeyVersion, Nullable, stringToBase64UrlCustomId } from "@tutao/utils"
import { assert256BitVersionedKey, decryptKey, VersionedAes256Key, VersionedKey } from "@tutao/crypto"
import { cryptoUtils } from "../../../platform-kit/crypto"
import { GroupKey, GroupKeyTypeRef, InstanceKey, InstanceKeyTypeRef } from "@tutao/entities/sys"
import { getElementId, isSameSingleId, isSameTypeRef, ListElementEntity, TypeRef } from "@tutao/meta"
import { ProgrammingError } from "@tutao/app-env"

export function convertCustomIdToKeyVersion(customId: Id): KeyVersion {
	return cryptoUtils.parseKeyVersion(base64UrlCustomIdToString(customId))
}

export function convertKeyVersionToCustomId(version: KeyVersion): Id {
	return stringToBase64UrlCustomId(String(version))
}

/**
 * Resolves symmetric former key instances for different types such as InstanceKey and GroupKey.
 */
export class FormerKeyResolver {
	constructor(private readonly entityClient: EntityClient) {}

	async findFormerInstanceKey(formerInstanceKeysList: Id, currentInstanceKey: VersionedAes256Key, targetKeyVersion: KeyVersion): Promise<VersionedAes256Key> {
		return assert256BitVersionedKey(
			(await this.findFormerKeyImpl(InstanceKeyTypeRef, formerInstanceKeysList, currentInstanceKey, targetKeyVersion)).versionedKey,
		)
	}

	async findFormerGroupKey(
		formerKeysList: Id,
		currentGroupKey: VersionedKey,
		targetKeyVersion: KeyVersion,
	): Promise<{ versionedKey: VersionedKey; keyInstance: GroupKey }> {
		return this.findFormerKeyImpl(GroupKeyTypeRef, formerKeysList, currentGroupKey, targetKeyVersion)
	}

	/**
	 *
	 * @param typeRef should be union of GroupKeyTypeRef and InstanceKeyTypeRef
	 * @param formerKeysList
	 * @param currentKey
	 * @param targetKeyVersion
	 */
	private async findFormerKeyImpl<FormerKeyType extends ListElementEntity>(
		typeRef: TypeRef<FormerKeyType>,
		formerKeysList: Id,
		currentKey: VersionedKey,
		targetKeyVersion: KeyVersion,
	): Promise<{ versionedKey: VersionedKey; keyInstance: FormerKeyType }> {
		if (targetKeyVersion === currentKey.version) {
			throw new ProgrammingError("target key version is the same as current key version")
		}
		// start id is not included in the result of the range request, so we need to start at current version.
		const startId = convertKeyVersionToCustomId(currentKey.version)
		const amountOfKeysIncludingTarget = currentKey.version - targetKeyVersion

		let formerKeys: FormerKeyType[] = await this.entityClient.loadRange(typeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true)
		if (amountOfKeysIncludingTarget > formerKeys.length) {
			formerKeys = await this.fixOutdatedCache(typeRef, amountOfKeysIncludingTarget, formerKeys, currentKey, formerKeysList, startId)
		}

		let lastKey = currentKey
		let lastKeyInstance: Nullable<FormerKeyType> = null

		for (const formerKey of formerKeys) {
			const formerKeyVersion = convertCustomIdToKeyVersion(getElementId(formerKey))
			if (formerKeyVersion + 1 === lastKey.version) {
				lastKey = {
					object: decryptKey(lastKey.object, this.getEncryptedFormerKeyBytes(typeRef, formerKey)),
					version: formerKeyVersion,
				}
				lastKeyInstance = formerKey
				if (lastKey.version <= targetKeyVersion) {
					break
				}
			} else if (formerKeyVersion + 1 < lastKey.version) {
				throw new Error(`unexpected version ${formerKeyVersion}; expected ${lastKey.version}`)
			}
		}

		if (lastKey.version !== targetKeyVersion || lastKeyInstance == null) {
			throw new Error(`could not get version (last version is ${lastKey.version} of ${formerKeys.length} key(s) loaded from list ${formerKeysList})`)
		}

		return { versionedKey: lastKey, keyInstance: lastKeyInstance }
	}

	private getEncryptedFormerKeyBytes<FormerKeyType extends ListElementEntity>(
		typeRef: TypeRef<FormerKeyType>,
		formerKey: FormerKeyType,
	): Uint8Array<ArrayBuffer> {
		if (isSameTypeRef(typeRef, InstanceKeyTypeRef)) {
			return (formerKey as unknown as InstanceKey).symEncInstanceKey
		}
		if (isSameTypeRef(typeRef, GroupKeyTypeRef)) {
			return (formerKey as unknown as GroupKey).ownerEncGKey
		}
		throw new ProgrammingError("can only call this with a former key type")
	}

	/**
	 * Try reloading missing former key instances in a cached range.
	 *
	 * This can be necessary due to a race condition when processing entity event updates after a key rotation,
	 * when the cache is not yet up to date.
	 */
	private async fixOutdatedCache<FormerKeyType extends ListElementEntity>(
		typeRef: TypeRef<FormerKeyType>,
		amountOfKeysIncludingTarget: number,
		formerKeys: FormerKeyType[],
		currentKey: VersionedKey,
		formerKeysList: Id,
		startId: Id,
	): Promise<FormerKeyType[]> {
		const missingKeyIds: Id[] = []
		for (let i = 1; i <= amountOfKeysIncludingTarget; i++) {
			const versionToCheck = convertKeyVersionToCustomId(cryptoUtils.checkKeyVersionConstraints(currentKey.version - i))
			if (!formerKeys.some((formerKey) => isSameSingleId(getElementId(formerKey), versionToCheck))) {
				missingKeyIds.push(versionToCheck)
			}
		}
		await this.entityClient.loadMultiple(typeRef, formerKeysList, missingKeyIds)
		return await this.entityClient.loadRange(typeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true)
	}
}
