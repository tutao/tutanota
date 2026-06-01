import { AesKey, VersionedEncryptedKey, VersionedKey } from "@tutao/crypto"
import { ClientTypeModel, Entity } from "../meta/EntityTypes"

export interface CryptoNetworkHelper {
	setNewOwnerEncSessionKey(clientTypeModel: ClientTypeModel, instance: Entity, keyToEncryptSessionKey: VersionedKey | null): Promise<AesKey | null>

	setOwnerEncSessionKey(instance: Entity, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup: Id | null): void

	decryptSessionKey(ownerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey>
}
