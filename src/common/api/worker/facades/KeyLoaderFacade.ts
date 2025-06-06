import { EntityClient } from "../../common/EntityClient.js"
import { AesKey, AsymmetricKeyPair, decryptKey, decryptKeyPair, EncryptedKeyPairs, isRsaOrRsaX25519KeyPair } from "@tutao/tutanota-crypto"
import { Group, GroupKey, GroupKeyTypeRef, GroupTypeRef, KeyPair } from "../../entities/sys/TypeRefs.js"
import { isKeyVersion, KeyVersion, Versioned } from "@tutao/tutanota-utils/dist/Utils.js"
import { UserFacade } from "./UserFacade.js"
import { NotFoundError } from "../../common/error/RestError.js"
import { customIdToString, getElementId, isSameId, stringToCustomId } from "../../common/utils/EntityUtils.js"
import { KeyCache } from "./KeyCache.js"
import { assertNotNull, lazyAsync } from "@tutao/tutanota-utils"
import { CacheManagementFacade } from "./lazy/CacheManagementFacade.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { VersionedKey } from "../crypto/CryptoWrapper.js"
import { TypeId } from "../../common/EntityTypes"

/**
 * Load symmetric and asymmetric keys and decrypt them.
 * Handle group key versioning.
 */
export class KeyLoaderFacade {
	constructor(
		private readonly keyCache: KeyCache,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly cacheManagementFacade: lazyAsync<CacheManagementFacade>,
	) {}

	/**
	 * Load the symmetric group key for the groupId with the provided requestedVersion.
	 * @param groupId the id of the group
	 * @param requestedVersion the requestedVersion of the key to be loaded
	 * @param currentGroupKey needs to be set if the user is not a member of the group (e.g. an admin)
	 */
	async loadSymGroupKey(groupId: Id, requestedVersion: KeyVersion, currentGroupKey?: VersionedKey): Promise<AesKey> {
		if (currentGroupKey != null && currentGroupKey.version < requestedVersion) {
			// we might not have the membership for this group. so the caller needs to handle it by refreshing the cache
			throw new Error(
				`Provided current group key is too old (${currentGroupKey.version}) to load the requested version ${requestedVersion} for group ${groupId}`,
			)
		}
		const groupKey = currentGroupKey ?? (await this.getCurrentSymGroupKey(groupId))

		if (groupKey.version === requestedVersion) {
			return groupKey.object
		} else if (groupKey.version < requestedVersion) {
			// the latest key is not cached, so we update the user and try again
			// this can still fail as we might be too slow with processing some update e.g. a GroupKeyUpdate
			// (we are member of a shared group rotated by someone else and the new membership is not yet on the user)
			await (await this.cacheManagementFacade()).refreshKeyCache(groupId)
			// There is no point in re-trying with the outdated current group key
			const refreshedGroupKey = await this.getCurrentSymGroupKey(groupId) // we pass the currentGroupKey to break the recursion
			return this.loadSymGroupKey(groupId, requestedVersion, refreshedGroupKey)
		} else {
			// we load a former key as the cached one is newer: groupKey.requestedVersion > requestedVersion
			const group = await this.entityClient.load(GroupTypeRef, groupId)
			const { symmetricGroupKey } = await this.findFormerGroupKey(group, groupKey, requestedVersion)
			return symmetricGroupKey
		}
	}

	async getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		// The current user group key should not be included in the map of current keys, because we only keep a copy in userFacade
		if (isSameId(groupId, this.userFacade.getUserGroupId())) {
			return this.getCurrentSymUserGroupKey()
		}
		return this.keyCache.getCurrentGroupKey(groupId, () => this.loadAndDecryptCurrentSymGroupKey(groupId))
	}

	async loadSymUserGroupKey(requestedVersion: KeyVersion): Promise<AesKey> {
		// we provide the current user group key to break a possibly infinite recursion
		let currentUserGroupKey = this.getCurrentSymUserGroupKey()
		if (currentUserGroupKey.version < requestedVersion) {
			await (await this.cacheManagementFacade()).refreshKeyCache(this.userFacade.getUserGroupId())
			currentUserGroupKey = this.getCurrentSymUserGroupKey()
			// if the key is still outdated loadSymGroupKey will throw - we tried our best.
		}
		return this.loadSymGroupKey(this.userFacade.getUserGroupId(), requestedVersion, currentUserGroupKey)
	}

	getCurrentSymUserGroupKey(): VersionedKey {
		return this.userFacade.getCurrentUserGroupKey()
	}

	async loadKeypair(keyPairGroupId: Id, requestedVersion: KeyVersion, forTypeId: TypeId = -1): Promise<AsymmetricKeyPair> {
		let group = await this.entityClient.load(GroupTypeRef, keyPairGroupId)
		let currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId)

		if (requestedVersion > currentGroupKey.version) {
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(keyPairGroupId)).group
			currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId)
		}
		return await this.loadKeyPairImpl(group, requestedVersion, currentGroupKey, forTypeId)
	}

	async loadCurrentKeyPair(groupId: Id): Promise<Versioned<AsymmetricKeyPair>> {
		let group = await this.entityClient.load(GroupTypeRef, groupId)

		let currentGroupKey = await this.getCurrentSymGroupKey(groupId)
		if (parseKeyVersion(group.groupKeyVersion) !== currentGroupKey.version) {
			// There is a race condition after rotating the group key were the group entity in the cache is not in sync with current key version in the key cache.
			// group.groupKeyVersion might be newer than currentGroupKey.version.
			// We reload group and user and refresh entity and key cache to synchronize both caches.
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(groupId)).group
			currentGroupKey = await this.getCurrentSymGroupKey(groupId)
			if (parseKeyVersion(group.groupKeyVersion) !== currentGroupKey.version) {
				// we still do not have the proper state to get the current key pair
				throw new Error(`inconsistent key version state in cache and key cache for group ${groupId}`)
			}
		}
		return {
			object: this.validateAndDecryptKeyPair(group.currentKeys, groupId, currentGroupKey),
			version: parseKeyVersion(group.groupKeyVersion),
		}
	}

	private async loadKeyPairImpl(group: Group, requestedVersion: KeyVersion, currentGroupKey: VersionedKey, forTypeId: TypeId) {
		const keyPairGroupId = group._id
		let keyPair: KeyPair | null
		let symGroupKey: VersionedKey
		console.log(
			`KeyLoaderFacade - loadKeyPairImpl for group:${group._id}. group.groupKeyVersion:${group.groupKeyVersion}, requestedVersion: ${requestedVersion}, currentGroupKey.version:${currentGroupKey.version}, forTypeId:${forTypeId}`,
		)

		if (requestedVersion > currentGroupKey.version) {
			throw new Error(`Not possible to get newer key version than is cached for group ${keyPairGroupId}`)
		} else if (requestedVersion === currentGroupKey.version) {
			symGroupKey = currentGroupKey
			if (parseKeyVersion(group.groupKeyVersion) === currentGroupKey.version) {
				keyPair = group.currentKeys
			} else {
				if (parseKeyVersion(group.groupKeyVersion) < currentGroupKey.version) {
					// this should not happen we want to find out where we actuall call this from
					try {
						throw new Error()
					} catch (e) {
						console.log("get stack", e)
					}
				}
				// we load by the version and thus can be sure that we are able to decrypt this key
				const formerGroupKey = await this.loadFormerGroupKeyInstance(group, currentGroupKey.version)
				keyPair = formerGroupKey.keyPair
			}
		} else {
			// load a former key pair: groupKeyVersion < groupKey.version
			const { symmetricGroupKey, groupKeyInstance } = await this.findFormerGroupKey(group, currentGroupKey, requestedVersion)
			keyPair = groupKeyInstance.keyPair
			symGroupKey = { object: symmetricGroupKey, version: requestedVersion }
		}
		return this.validateAndDecryptKeyPair(keyPair, keyPairGroupId, symGroupKey)
	}

	async loadFormerGroupKeyInstance(group: Group, version: KeyVersion): Promise<GroupKey> {
		const formerKeysList = assertNotNull(group.formerGroupKeys).list
		return await this.entityClient.load(GroupKeyTypeRef, [formerKeysList, convertKeyVersionToCustomId(version)])
	}

	/**
	 *
	 * @param groupId MUST NOT be the user group id!
	 * @private
	 */
	private async loadAndDecryptCurrentSymGroupKey(groupId: Id) {
		if (isSameId(groupId, this.userFacade.getUserGroupId())) {
			throw new ProgrammingError("Must not add the user group to the regular group key cache")
		}
		const groupMembership = this.userFacade.getMembership(groupId)
		const requiredUserGroupKey = await this.loadSymUserGroupKey(parseKeyVersion(groupMembership.symKeyVersion))
		return {
			version: parseKeyVersion(groupMembership.groupKeyVersion),
			object: decryptKey(requiredUserGroupKey, groupMembership.symEncGKey),
		}
	}

	private async findFormerGroupKey(
		group: Group,
		currentGroupKey: VersionedKey,
		targetKeyVersion: KeyVersion,
	): Promise<{ symmetricGroupKey: AesKey; groupKeyInstance: GroupKey }> {
		const formerKeysList = assertNotNull(group.formerGroupKeys).list
		// start id is not included in the result of the range request, so we need to start at current version.
		const startId = convertKeyVersionToCustomId(currentGroupKey.version)
		const amountOfKeysIncludingTarget = currentGroupKey.version - targetKeyVersion

		const formerKeys: GroupKey[] = await this.entityClient.loadRange(GroupKeyTypeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true)

		let lastVersion = currentGroupKey.version
		let lastGroupKey = currentGroupKey.object
		let lastGroupKeyInstance: GroupKey | null = null

		for (const formerKey of formerKeys) {
			const version = this.decodeGroupKeyVersion(getElementId(formerKey))
			if (version + 1 > lastVersion) {
				continue
			} else if (version + 1 === lastVersion) {
				lastGroupKey = decryptKey(lastGroupKey, formerKey.ownerEncGKey)
				lastVersion = version
				lastGroupKeyInstance = formerKey
				if (lastVersion <= targetKeyVersion) {
					break
				}
			} else {
				throw new Error(`unexpected version ${version}; expected ${lastVersion}`)
			}
		}

		if (lastVersion !== targetKeyVersion || !lastGroupKeyInstance) {
			throw new Error(`could not get version (last version is ${lastVersion} of ${formerKeys.length} key(s) loaded from list ${formerKeysList})`)
		}

		return { symmetricGroupKey: lastGroupKey, groupKeyInstance: lastGroupKeyInstance }
	}

	private decodeGroupKeyVersion(id: Id): KeyVersion {
		return parseKeyVersion(customIdToString(id))
	}

	private validateAndDecryptKeyPair(keyPair: KeyPair | null, groupId: Id, groupKey: VersionedKey) {
		if (keyPair == null) {
			throw new NotFoundError(`no key pair on group ${groupId}`)
		}
		// this cast is acceptable as those are the constraints we have on KeyPair. we just cannot know which one we have statically
		const decryptedKeyPair = decryptKeyPair(groupKey.object, keyPair as EncryptedKeyPairs)
		if (groupKey.version !== 0 && isRsaOrRsaX25519KeyPair(decryptedKeyPair)) {
			throw new CryptoError("received an rsa key pair in a version other than 0: " + groupKey.version)
		}
		return decryptedKeyPair
	}
}

function convertKeyVersionToCustomId(version: KeyVersion) {
	return stringToCustomId(String(version))
}

export function parseKeyVersion(version: NumberString): KeyVersion {
	const versionAsNumber = Number(version)
	return checkKeyVersionConstraints(versionAsNumber)
}

export function checkKeyVersionConstraints(version: number): KeyVersion {
	if (!isKeyVersion(version)) {
		throw new CryptoError("key version is not a non-negative integer")
	}
	return version
}
