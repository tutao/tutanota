import { PersistentEntity } from "@tutao/meta"
import { deriveInstanceKey, KdfNonce, VersionedAes256Key, VersionedKey } from "@tutao/crypto"
import { KeyLoaderFacade } from "./KeyLoaderFacade"
import { ProgrammingError } from "@tutao/app-env"
import { CryptoNetworkHelper } from "../../network/CryptoNetworkHelper"
import { createAndSetOrGetKdfNonce } from "../../network/EntityRestClient"
import { TypeModelResolver } from "@tutao/instance-pipeline"

export class InstanceKeyFacade {
	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoNetworkHelper: CryptoNetworkHelper,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	async getCurrentInstanceKey(instance: PersistentEntity): Promise<VersionedAes256Key> {
		if (instance._ownerGroup == null) {
			throw new ProgrammingError("owner group missing for instance.")
		}
		// we may have to create the kdfNonce here if we are sharing an old instance that has not been updated in a while
		const kdfNonce = await createAndSetOrGetKdfNonce(this.typeModelResolver, this.cryptoNetworkHelper, instance)

		const currentGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(instance._ownerGroup)
		return this.deriveInstanceKey(currentGroupKey, kdfNonce)
	}

	deriveInstanceKey(groupKey: VersionedKey, kdfNonce: KdfNonce): VersionedAes256Key {
		return deriveInstanceKey(groupKey, kdfNonce)
	}
}
