import { AesKey, VersionedEncryptedKey, VersionedKey } from "@tutao/crypto"
import { ClientTypeModel, Entity } from "../meta/EntityTypes"
import { InstanceKdfNonce, UpdateKdfNoncePostOut } from "@tutao/entities/sys"
import { Nullable } from "@tutao/utils"

export interface CryptoNetworkHelper {
	setNewOwnerEncSessionKey<T extends Entity<T>>(
		clientTypeModel: ClientTypeModel,
		instance: T,
		keyToEncryptSessionKey: Nullable<VersionedKey>,
	): Promise<AesKey | null>

	setOwnerEncSessionKey<T extends Entity<T>>(instance: Entity<T>, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup: Nullable<Id>): void

	decryptSessionKey(ownerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey>

	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey>

	postUpdateKdfNonceService(instanceKdfNonce: InstanceKdfNonce): Promise<UpdateKdfNoncePostOut>
}
