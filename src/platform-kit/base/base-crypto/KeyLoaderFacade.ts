import { EntityClient } from "../../network/EntityClient.js"
import {
	AeadCipherVersion,
	AesKey,
	AsymmetricKeyPair,
	cryptoUtils,
	CryptoWrapper,
	Ed25519PrivateKey,
	EncryptedKeyPairs,
	EncryptedPqKeyPairs,
	EncryptedRsaKeyPairs,
	EncryptedRsaX25519KeyPairs,
	isRsaOrRsaX25519KeyPair,
	KeyEncryption,
	SessionKeyDecryptor,
	VersionedKey,
} from "@tutao/crypto"
import { assertNotNull, downcast, isNotNull, KeyVersion, lazyAsync, Nullable, promiseMap, Versioned } from "@tutao/utils"
import { UserFacade } from "../facades/UserFacade.js"
import { NotFoundError } from "@tutao/rest-client/error"
import { elementIdToId, Entity, getElementId, idToElementId, isSameSingleId } from "../../meta"
import { KeyCache } from "./persistence/KeyCache.js"
import { CryptoError } from "@tutao/crypto/error"
import { SymmetricGroupKeyLoader } from "@tutao/instance-pipeline"
import { createKeyPair, Group, GroupKey, GroupKeyTypeRef, GroupTypeRef, KeyPair } from "@tutao/entities/sys"
import { GroupType } from "../../../entities/sys/Utils"
import { ProgrammingError } from "@tutao/app-env"
import { CacheManager } from "./persistence/CacheManager"
import { TypeId } from "../../meta/EntityConstants"
import { convertCustomIdToKeyVersion, convertKeyVersionToCustomId, FormerKeyResolver } from "./FormerKeyResolver"
import { ServiceEncryptionParams } from "../../instance-pipeline/RestClientOptions"

export type ExternalGroupKeys = { currentExternalUserGroupKey: VersionedKey; currentExternalMailGroupKey: VersionedKey }

/**
 * Load symmetric and asymmetric keys and decrypt them.
 * Handle group key versioning.
 */
export class KeyLoaderFacade implements SymmetricGroupKeyLoader {
	constructor(
		private readonly keyCache: KeyCache,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly cacheManagementFacade: lazyAsync<CacheManager>,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly formerKeyResolver: FormerKeyResolver,
		private readonly keyEncryption: KeyEncryption,
	) {}

	/**
	 * Load the symmetric group key for the groupId with the provided requestedVersion.
	 * @param groupId the id of the group
	 * @param requestedVersion the requestedVersion of the key to be loaded
	 * @param currentGroupKey needs to be set if the user is not a member of the group (e.g. an admin)
	 */
	async loadSymGroupKey(groupId: Id, requestedVersion: KeyVersion, currentGroupKey: Nullable<VersionedKey> = null): Promise<AesKey> {
		if (isNotNull(currentGroupKey) && currentGroupKey.version < requestedVersion) {
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
			// we load a former key as the cached one is newer: groupKey.version > requestedVersion
			const group = await this.entityClient.load(GroupTypeRef, idToElementId(groupId))
			const { versionedKey } = await this.formerKeyResolver.findFormerGroupKey(group.formerGroupKeys.list, groupKey, requestedVersion)
			return versionedKey.object
		}
	}

	async getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		// The current user group key should not be included in the map of current keys, because we only keep a copy in userFacade
		if (isSameSingleId(groupId, this.userFacade.getUserGroupId())) {
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
		let group = await this.entityClient.load(GroupTypeRef, idToElementId(keyPairGroupId))
		let currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId)

		if (requestedVersion > currentGroupKey.version || requestedVersion > cryptoUtils.parseKeyVersion(group.groupKeyVersion)) {
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(keyPairGroupId)).group
			currentGroupKey = await this.getCurrentSymGroupKey(keyPairGroupId)
		}
		return await this.loadKeyPairImpl(group, requestedVersion, currentGroupKey, forTypeId)
	}

	async loadCurrentKeyPair(groupId: Id, currentGroupKey: Nullable<VersionedKey> = null): Promise<Versioned<AsymmetricKeyPair>> {
		let group = await this.entityClient.load(GroupTypeRef, idToElementId(groupId))
		if (isNull(currentGroupKey)) {
			currentGroupKey = await this.getCurrentSymGroupKey(groupId)
		}
		if (cryptoUtils.parseKeyVersion(group.groupKeyVersion) !== currentGroupKey.version) {
			// There is a race condition after rotating the group key were the group entity in the cache is not in sync with current key version in the key cache.
			// group.groupKeyVersion might be newer than currentGroupKey.version.
			// We reload group and user and refresh entity and key cache to synchronize both caches.
			group = (await (await this.cacheManagementFacade()).refreshKeyCache(groupId)).group
			currentGroupKey = await this.getCurrentSymGroupKey(groupId)
			if (cryptoUtils.parseKeyVersion(group.groupKeyVersion) !== currentGroupKey.version) {
				// we still do not have the proper state to get the current key pair
				throw new Error(`inconsistent key version state in cache and key cache for group ${groupId}`)
			}
		}
		return {
			object: this.validateAndDecryptKeyPair(group.currentKeys, groupId, currentGroupKey),
			version: cryptoUtils.parseKeyVersion(group.groupKeyVersion),
		}
	}

	private async loadKeyPairImpl(group: Group, requestedVersion: KeyVersion, currentGroupKey: VersionedKey, forTypeId: TypeId): Promise<AsymmetricKeyPair> {
		const keyPairGroupId = elementIdToId(group._id)
		let keyPair: KeyPair | null
		let symGroupKey: VersionedKey
		console.log(
			`KeyLoaderFacade - loadKeyPairImpl for group:${group._id}. group.groupKeyVersion:${group.groupKeyVersion}, requestedVersion: ${requestedVersion}, currentGroupKey.version:${currentGroupKey.version}, forTypeId:${forTypeId}`,
		)

		if (requestedVersion > currentGroupKey.version) {
			throw new Error(`Not possible to get newer key version than is cached for group ${keyPairGroupId}`)
		} else if (requestedVersion === currentGroupKey.version) {
			symGroupKey = currentGroupKey
			if (cryptoUtils.parseKeyVersion(group.groupKeyVersion) === currentGroupKey.version) {
				keyPair = group.currentKeys
			} else {
				if (cryptoUtils.parseKeyVersion(group.groupKeyVersion) < currentGroupKey.version) {
					// this should not happen we want to find out where we actually call this from
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
			const { versionedKey, keyInstance } = await this.formerKeyResolver.findFormerGroupKey(group.formerGroupKeys.list, currentGroupKey, requestedVersion)
			keyPair = keyInstance.keyPair
			symGroupKey = versionedKey
		}
		return this.validateAndDecryptKeyPair(keyPair, keyPairGroupId, symGroupKey)
	}

	async decryptPrivateIdentityKey(group: Group): Promise<Versioned<Ed25519PrivateKey>> {
		if (isNull(group.identityKeyPair)) {
			throw new Error(`Group ${group._id} does not have identity key pair`)
		}
		let encryptingGroupId: Id
		if (group.type === GroupType.User) {
			encryptingGroupId = elementIdToId(group._id)
		} else if (group.type === GroupType.Mail && isNull(group.user)) {
			//shared mail group
			if (isNull(group.admin)) {
				throw new Error("Admin group not set on shared mail group")
			}
			encryptingGroupId = group.admin
		} else {
			throw new Error(`Group ${group._id} should not have identity key.`)
		}
		const decryptionKey = await this.loadSymGroupKey(encryptingGroupId, cryptoUtils.parseKeyVersion(group.identityKeyPair.encryptingKeyVersion))
		return this.cryptoWrapper.decryptEd25519PrivateKey(group.identityKeyPair, decryptionKey)
	}

	/**
	 * Loads all former key pairs for a group
	 * @param group The group's former keys must have a keypair otherwise an exception is thrown
	 */
	async loadAllFormerKeyPairs(group: Group, currentGroupKey: Nullable<VersionedKey> = null): Promise<Versioned<AsymmetricKeyPair>[]> {
		const currentKey = currentGroupKey ?? (await this.getCurrentSymGroupKey(elementIdToId(group._id)))
		// this request makes sure everything is cached
		// decryption and parsing will be inefficient if there are many former keys
		const formerKeys = await this.entityClient.loadAll(GroupKeyTypeRef, group.formerGroupKeys.list)
		return promiseMap(formerKeys, async (groupKey) => {
			const requestedVersion = convertCustomIdToKeyVersion(getElementId(groupKey))
			return {
				object: await this.loadKeyPairImpl(group, requestedVersion, currentKey, -1),
				version: requestedVersion,
			}
		})
	}

	async loadFormerGroupKeyInstance(group: Group, version: KeyVersion): Promise<GroupKey> {
		const formerKeysList = group.formerGroupKeys.list
		return await this.entityClient.load(GroupKeyTypeRef, [formerKeysList, convertKeyVersionToCustomId(version)])
	}

	/**
	 *
	 * @param groupId MUST NOT be the user group id!
	 * @private
	 */
	private async loadAndDecryptCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		if (isSameSingleId(groupId, this.userFacade.getUserGroupId())) {
			throw new ProgrammingError("Must not add the user group to the regular group key cache")
		}
		const groupMembership = this.userFacade.getMembership(groupId)
		const requiredUserGroupKey = await this.loadSymUserGroupKey(cryptoUtils.parseKeyVersion(groupMembership.symKeyVersion))
		return {
			version: cryptoUtils.parseKeyVersion(groupMembership.groupKeyVersion),
			object: this.cryptoWrapper.decryptKey(requiredUserGroupKey, groupMembership.symEncGKey),
		}
	}

	private validateAndDecryptKeyPair(keyPair: KeyPair | null, groupId: Id, groupKey: VersionedKey): AsymmetricKeyPair {
		if (isNull(keyPair)) {
			throw new NotFoundError(`no key pair on group ${groupId}`)
		}
		// this cast is acceptable as those are the constraints we have on KeyPair. we just cannot know which one we have statically
		const decryptedKeyPair = this.cryptoWrapper.decryptKeyPair(groupKey.object, toEncryptedKeyPairs(keyPair))
		if (groupKey.version !== 0 && isRsaOrRsaX25519KeyPair(decryptedKeyPair)) {
			throw new CryptoError("received an rsa key pair in a version other than 0: " + groupKey.version)
		}
		return decryptedKeyPair
	}

	async getCurrentExternalGroupKeys(externalMailGroupId: Id, externalUserGroupId: Id): Promise<ExternalGroupKeys> {
		const currentExternalUserGroupKey = await this.getCurrentExternalUserGroupKey(externalUserGroupId)
		const currentExternalMailGroupKey = await this.getCurrentExternalMailGroupKey(externalMailGroupId, externalUserGroupId, currentExternalUserGroupKey)
		return {
			currentExternalUserGroupKey,
			currentExternalMailGroupKey,
		}
	}

	async getCurrentExternalUserGroupKey(externalUserGroupId: Id): Promise<VersionedKey> {
		const externalUserGroup = await this.entityClient.load(GroupTypeRef, idToElementId(externalUserGroupId))
		const requiredInternalUserGroupKeyVersion = cryptoUtils.parseKeyVersion(externalUserGroup.adminGroupKeyVersion ?? "0")
		const internalUserEncExternalUserKey = assertNotNull(externalUserGroup.adminGroupEncGKey, "no adminGroupEncGKey on external user group")
		const requiredInternalUserGroupKey = await this.loadSymGroupKey(this.userFacade.getUserGroupId(), requiredInternalUserGroupKeyVersion)
		return {
			object: this.cryptoWrapper.decryptKey(requiredInternalUserGroupKey, internalUserEncExternalUserKey),
			version: cryptoUtils.parseKeyVersion(externalUserGroup.groupKeyVersion),
		}
	}

	private async getCurrentExternalMailGroupKey(
		externalMailGroupId: Id,
		externalUserGroupId: Id,
		currentExternalUserGroupKey: VersionedKey,
	): Promise<VersionedKey> {
		const externalMailGroup = await this.entityClient.load(GroupTypeRef, idToElementId(externalMailGroupId))
		const requiredExternalUserGroupKeyVersion = cryptoUtils.parseKeyVersion(externalMailGroup.adminGroupKeyVersion ?? "0")
		const externalUserEncExternalMailKey = assertNotNull(externalMailGroup.adminGroupEncGKey, "no adminGroupEncGKey on external mail group")
		const requiredExternalUserGroupKey = await this.loadSymGroupKey(externalUserGroupId, requiredExternalUserGroupKeyVersion, currentExternalUserGroupKey)
		return {
			object: this.cryptoWrapper.decryptKey(requiredExternalUserGroupKey, externalUserEncExternalMailKey),
			version: cryptoUtils.parseKeyVersion(externalMailGroup.groupKeyVersion),
		}
	}

	public async assembleServiceEncryptionParamsForPut(
		ownerGroup: string,
		entity: Entity,
		aeadCipherVersion: AeadCipherVersion = AeadCipherVersion.WithInstanceKey,
	): Promise<ServiceEncryptionParams> {
		const ownerKeyVersion: KeyVersion = cryptoUtils.parseKeyVersion(entity._ownerKeyVersion ?? "0")
		const ownerKeyToDecryptSessionKey = {
			object: await this.loadSymGroupKey(ownerGroup, ownerKeyVersion),
			version: ownerKeyVersion,
		}

		let currentOwnerKey: Nullable<VersionedKey> = null
		if (aeadCipherVersion === AeadCipherVersion.WithInstanceKey) {
			currentOwnerKey = await this.getCurrentSymGroupKey(ownerGroup)
		}

		const sessionKeyDecryptor = new SessionKeyDecryptor(ownerKeyToDecryptSessionKey, this.keyEncryption)
		return { ownerKey: currentOwnerKey, sessionKeyDecryptor, aeadCipherVersion }
	}

	public async assembleServiceEncryptionParamsForPost(
		ownerGroup: string,
		aeadCipherVersion: AeadCipherVersion = AeadCipherVersion.WithInstanceKey,
	): Promise<ServiceEncryptionParams> {
		const ownerKeyToDecryptSessionKey = await this.getCurrentSymGroupKey(ownerGroup)

		let currentOwnerKey: Nullable<VersionedKey> = null
		if (aeadCipherVersion === AeadCipherVersion.WithInstanceKey) {
			currentOwnerKey = ownerKeyToDecryptSessionKey
		}

		const sessionKeyDecryptor = new SessionKeyDecryptor(ownerKeyToDecryptSessionKey, this.keyEncryption)
		return { ownerKey: currentOwnerKey, sessionKeyDecryptor, aeadCipherVersion }
	}
}

export function toEncryptedKeyPairs(keyPair: KeyPair): EncryptedKeyPairs {
	if (isNotNull(keyPair.pubRsaKey)) {
		if (isNotNull(keyPair.pubEccKey) && isNotNull(keyPair.symEncPrivEccKey) && isNotNull(keyPair.symEncPrivRsaKey)) {
			return new EncryptedRsaX25519KeyPairs(keyPair.pubEccKey, keyPair.pubRsaKey, keyPair.symEncPrivEccKey, keyPair.symEncPrivRsaKey, keyPair.signature)
		} else if (isNotNull(keyPair.symEncPrivRsaKey)) {
			return new EncryptedRsaKeyPairs(keyPair.pubRsaKey, keyPair.symEncPrivRsaKey, keyPair.signature)
		}
	}
	if (isNotNull(keyPair.pubKyberKey) && isNotNull(keyPair.symEncPrivKyberKey) && isNotNull(keyPair.pubEccKey) && isNotNull(keyPair.symEncPrivEccKey)) {
		return new EncryptedPqKeyPairs(keyPair.pubEccKey, keyPair.pubKyberKey, keyPair.symEncPrivEccKey, keyPair.symEncPrivKyberKey, keyPair.signature)
	}
	throw new CryptoError("Invalid key pair")
}

export function toKeyPair(keyPair: EncryptedKeyPairs): KeyPair {
	if (keyPair instanceof EncryptedRsaX25519KeyPairs) {
		const { pubEccKey, pubRsaKey, symEncPrivEccKey, symEncPrivRsaKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey: null,
			symEncPrivKyberKey: null,
			pubEccKey,
			pubRsaKey,
			symEncPrivEccKey,
			symEncPrivRsaKey,
			signature: downcast(signature),
		})
	} else if (keyPair instanceof EncryptedRsaKeyPairs) {
		const { pubRsaKey, symEncPrivRsaKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey: null,
			symEncPrivKyberKey: null,
			pubEccKey: null,
			symEncPrivEccKey: null,
			pubRsaKey,
			symEncPrivRsaKey,
			signature: downcast(signature),
		})
	} else if (keyPair instanceof EncryptedPqKeyPairs) {
		const { pubEccKey, pubKyberKey, symEncPrivEccKey, symEncPrivKyberKey, signature } = keyPair
		return createKeyPair({
			pubKyberKey,
			symEncPrivKyberKey,
			pubEccKey,
			symEncPrivEccKey,
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			signature: downcast(signature),
		})
	}
	throw new CryptoError("Invalid key pair")
}

export function isEncryptedPqKeyPairs(keyPair: KeyPair): boolean {
	return (
		isNotNull(keyPair.pubEccKey) &&
		isNotNull(keyPair.pubKyberKey) &&
		isNotNull(keyPair.symEncPrivEccKey) &&
		isNotNull(keyPair.symEncPrivKyberKey) &&
		isNull(keyPair.pubRsaKey) &&
		isNull(keyPair.symEncPrivRsaKey)
	)
}
