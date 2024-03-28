import { EntityClient } from "../../common/EntityClient.js"
import { AesKey, AsymmetricKeyPair, decryptKey, decryptKeyPair, isPqKeyPairs, PQKeyPairs, RsaEccKeyPair, RsaKeyPair } from "@tutao/tutanota-crypto"
import { Group, GroupKey, GroupKeyTypeRef, GroupTypeRef } from "../../entities/sys/TypeRefs.js"
import { Versioned } from "@tutao/tutanota-utils/dist/Utils.js"
import { UserFacade } from "./UserFacade.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { NotFoundError } from "../../common/error/RestError.js"
import { customIdToString, getElementId, stringToCustomId } from "../../common/utils/EntityUtils.js"
import { VersionedKey } from "../crypto/CryptoFacade.js"

export class KeyLoaderFacade {
	constructor(private readonly userFacade: UserFacade, private readonly entityClient: EntityClient) {}

	async loadSymGroupKey(groupId: Id, version: number, currentGroupKey?: VersionedKey): Promise<AesKey> {
		const groupKey = currentGroupKey ?? this.userFacade.getGroupKey(groupId)

		if (groupKey.version === version) {
			return groupKey.object
		}
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const { symmetricGroupKey } = await this.findFormerGroupKey(group, groupKey, version)

		return symmetricGroupKey
	}

	async loadSymUserGroupKey(userGroupKeyVersion: number): Promise<AesKey> {
		return this.loadSymGroupKey(this.userFacade.getUserGroupId(), userGroupKeyVersion)
	}

	getCurrentUserGroupKey(): VersionedKey {
		return this.userFacade.getUserGroupKey()
	}

	async loadKeypair(keyPairGroupId: Id, groupKeyVersion: number): Promise<AsymmetricKeyPair> {
		const group = await this.entityClient.load(GroupTypeRef, keyPairGroupId)
		const groupKey = this.userFacade.getGroupKey(group._id)

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

	async loadCurrentKeyPair(groupId: Id): Promise<Versioned<RsaKeyPair | RsaEccKeyPair | PQKeyPairs>> {
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const groupKey = this.userFacade.getGroupKey(group._id)

		const result = this.getAndDecryptKeyPair(group, groupKey.object)
		if (isPqKeyPairs(result)) {
			return { object: result, version: Number(group.groupKeyVersion) }
		} else {
			return { object: result, version: 0 }
		}
	}

	private async findFormerGroupKey(
		group: Group,
		currentGroupKey: VersionedKey,
		targetKeyVersion: number,
	): Promise<{ symmetricGroupKey: AesKey; groupKeyInstance: GroupKey }> {
		const formerKeysList = assertNotNull(
			group.formerGroupKeys,
			"no former group keys, current key version: " + group.groupKeyVersion + " target key version: " + targetKeyVersion,
		).list
		const startId = stringToCustomId(String(currentGroupKey.version - 1))
		const amountOfKeysIncludingTarget = currentGroupKey.version - targetKeyVersion
		const formerKeys: GroupKey[] = await this.entityClient.loadRange(GroupKeyTypeRef, formerKeysList, startId, amountOfKeysIncludingTarget, true)

		let lastVersion = currentGroupKey.version
		let lastOwnerGroupKey = currentGroupKey.object
		let lastGroupKey: GroupKey | null = null

		for (const encryptedKey of formerKeys) {
			const version = this.decodeGroupKeyVersion(getElementId(encryptedKey))
			if (version + 1 > lastVersion) {
				continue
			} else if (version + 1 === lastVersion) {
				lastOwnerGroupKey = decryptKey(lastOwnerGroupKey, encryptedKey.ownerEncGKey)
				lastVersion = version
				lastGroupKey = encryptedKey
				if (lastVersion <= targetKeyVersion) {
					break
				}
			} else {
				throw new Error(`unexpected version ${version}; expected ${lastVersion}`)
			}
		}

		if (lastVersion !== targetKeyVersion || !lastGroupKey) {
			throw new Error(`could not get version (last version is ${lastVersion} of ${formerKeys.length} key(s) loaded from list ${formerKeysList})`)
		}

		return { symmetricGroupKey: lastOwnerGroupKey, groupKeyInstance: lastGroupKey }
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
