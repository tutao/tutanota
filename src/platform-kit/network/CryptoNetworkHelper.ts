import { AesKey, VersionedEncryptedKey, VersionedKey } from "@tutao/crypto"
import { ClientTypeModel, Entity } from "../meta/EntityTypes"
import { InstanceKdfNonce, UpdateKdfNoncePostOut } from "@tutao/entities/sys"

export interface CryptoNetworkHelper {
	setNewOwnerEncSessionKey(clientTypeModel: ClientTypeModel, instance: Entity, keyToEncryptSessionKey?: VersionedKey): Promise<AesKey | null>

	setOwnerEncSessionKey(instance: Entity, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup?: Id): void

	decryptSessionKey(ownerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey>

	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey>

	postUpdateKdfNonceService(instanceKdfNonce: InstanceKdfNonce): Promise<UpdateKdfNoncePostOut>
}
