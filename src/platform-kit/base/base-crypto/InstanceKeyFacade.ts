import { PersistentEntity } from "@tutao/meta"
import { deriveInstanceKey, KdfNonce, VersionedAes256Key, VersionedKey } from "@tutao/crypto"
import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { ProgrammingError } from "@tutao/app-env"
import { EntityClient } from "../../network/EntityClient"

export class InstanceKeyFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly entityClient: EntityClient,
	) {}

	async getCurrentInstanceKey(instance: PersistentEntity): Promise<VersionedAes256Key> {
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		// we may have to create the kdfNonce here if we are sharing an old instance that has not been updated in a while
		const kdfNonce = await this.entityClient.ensureKdfNonce(instance)

		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(instance._ownerGroup)
		return this.deriveInstanceKey(currentGroupKey, kdfNonce)
	}

	deriveInstanceKey(groupKey: VersionedKey, kdfNonce: KdfNonce): VersionedAes256Key {
		return deriveInstanceKey(groupKey, kdfNonce)
	}
}
