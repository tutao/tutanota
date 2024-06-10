import { EntityClient } from "../../common/EntityClient.js"
import { AesKey, AsymmetricKeyPair, decryptKey, decryptKeyPair } from "@tutao/tutanota-crypto"
import { Group, GroupKey, GroupKeyTypeRef, GroupTypeRef, UserTypeRef } from "../../entities/sys/TypeRefs.js"
import { Versioned } from "@tutao/tutanota-utils/dist/Utils.js"
import { UserFacade } from "./UserFacade.js"
import { NotFoundError } from "../../common/error/RestError.js"
import { customIdToString, getElementId, isSameId, stringToCustomId } from "../../common/utils/EntityUtils.js"
import { VersionedKey } from "../crypto/CryptoFacade.js"
import { KeyCache } from "./KeyCache.js"
import { assertNotNull } from "@tutao/tutanota-utils"

/**
 * Load symmetric and asymmetric keys and decrypt them.
 * Handle group key versioning.
 */
export class KeyLoaderFacade {
	constructor(
		private readonly keyCache: KeyCache,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly nonCachingEntityClient: EntityClient,
	) {}

	/**
	 * Load the symmetric group key for the groupId with the provided version.
	 * @param groupId the id of the group
	 * @param version the version of the key to be loaded
	 * @param currentGroupKey needs to be set if the user is not a member of the group (e.g. an admin)
	 * @param attempts how many times should we try reloading the user. This is mainly to prevent infinite recursions
	 */
	async loadSymGroupKey(groupId: Id, version: number, currentGroupKey?: VersionedKey, attempts: number = 1): Promise<AesKey> {
		const groupKey = currentGroupKey ?? (await this.getCurrentSymGroupKey(groupId))

		if (groupKey.version === version) {
			return groupKey.object
		} else if (groupKey.version < version) {
			// user doesn't have the newest key, so we update the user and try again
			if (attempts < 1) {
				throw new Error("Too many recursive attempts to load group key")
			}
			const loggedInUser = this.userFacade.getLoggedInUser()
			const user = await this.nonCachingEntityClient.load(UserTypeRef, loggedInUser._id)
			await this.userFacade.updateUser(user)
			return this.loadSymGroupKey(groupId, version, currentGroupKey, attempts - 1)
		}
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const { symmetricGroupKey } = await this.findFormerGroupKey(group, groupKey, version)

		return symmetricGroupKey
	}

	async getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey> {
		// The current user group key should not be included in the map of current keys, because we only keep a copy in userFacade
		if (isSameId(groupId, this.userFacade.getUserGroupId())) {
			return this.getCurrentSymUserGroupKey()
		}
		return this.keyCache.getCurrentGroupKey(groupId, () => this.loadAndDecryptCurrentSymGroupKey(groupId))
	}

	/**
	 *
	 * @param groupId MUST NOT be the user group id!
	 * @private
	 */
	private async loadAndDecryptCurrentSymGroupKey(groupId: Id) {
		const groupMembership = this.userFacade.getMembership(groupId)
		const requiredUserGroupKey = await this.loadSymUserGroupKey(Number(groupMembership.symKeyVersion))
		return {
			version: Number(groupMembership.groupKeyVersion),
			object: decryptKey(requiredUserGroupKey, groupMembership.symEncGKey),
		}
	}

	async loadSymUserGroupKey(userGroupKeyVersion: number): Promise<AesKey> {
		// we provide the current user group key to break a possibly infinite recursion
		return this.loadSymGroupKey(this.userFacade.getUserGroupId(), userGroupKeyVersion, this.userFacade.getCurrentUserGroupKey())
	}

	getCurrentSymUserGroupKey(): VersionedKey {
		return this.userFacade.getCurrentUserGroupKey()
	}

	async loadKeypair(keyPairGroupId: Id, groupKeyVersion: number): Promise<AsymmetricKeyPair> {
		const group = await this.entityClient.load(GroupTypeRef, keyPairGroupId)
		const groupKey = await this.getCurrentSymGroupKey(group._id)

		if (groupKey.version === groupKeyVersion) {
			return this.getAndDecryptKeyPair(group, groupKey.object)
		}
		const {
			symmetricGroupKey,
			groupKeyInstance: { keyPair },
		} = await this.findFormerGroupKey(group, groupKey, groupKeyVersion)

		if (keyPair == null) {
			throw new Error(`key pair not found for group ${keyPairGroupId} and version ${groupKeyVersion}`)
		}

		try {
			return decryptKeyPair(symmetricGroupKey, keyPair)
		} catch (e) {
			console.log("failed to decrypt keypair for group with id " + group._id)
			throw e
		}
	}

	async loadCurrentKeyPair(groupId: Id): Promise<Versioned<AsymmetricKeyPair>> {
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const groupKey = await this.getCurrentSymGroupKey(group._id)

		const result = this.getAndDecryptKeyPair(group, groupKey.object)
		return { object: result, version: Number(group.groupKeyVersion) }
	}

	private async findFormerGroupKey(
		group: Group,
		currentGroupKey: VersionedKey,
		targetKeyVersion: number,
	): Promise<{ symmetricGroupKey: AesKey; groupKeyInstance: GroupKey }> {
		let formerKeysList: string
		if (group.formerGroupKeys == null) {
			console.log(
				`No former group keys, current key version from group ${group._id}: ${group.groupKeyVersion}, current version in group key: ${currentGroupKey.version}, target key version: ${targetKeyVersion}.` +
					"\nDownloading fresh group instance from server...",
			)
			// It is possible that we are dealing with a group that has just been updated on the server, but we have not processed the entity update yet.
			const newGroup = await this.nonCachingEntityClient.load(GroupTypeRef, group._id)

			formerKeysList = assertNotNull(newGroup.formerGroupKeys, `freshly downloaded group has no formerGroupKeys reference either`).list
		} else {
			formerKeysList = group.formerGroupKeys.list
		}

		// start id is not included in the result of the range request, so we need to start at current version.
		const startId = stringToCustomId(String(currentGroupKey.version))
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

	private decodeGroupKeyVersion(id: Id): number {
		return Number(customIdToString(id))
	}

	private getAndDecryptKeyPair(group: Group, groupKey: AesKey) {
		if (group.currentKeys == null) {
			throw new NotFoundError(`no key pair on group ${group._id}`)
		}
		return decryptKeyPair(groupKey, group.currentKeys)
	}
}
