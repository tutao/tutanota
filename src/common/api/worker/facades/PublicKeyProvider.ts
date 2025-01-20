import { createPublicKeyGetIn, PublicKeyGetOut } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { parseKeyVersion } from "./KeyLoaderFacade.js"
import { Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"
import { InvalidDataError } from "../../common/error/RestError.js"

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}
export type PublicKeys = {
	pubRsaKey: null | Uint8Array
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
}

/**
 * Load public keys.
 * Handle key versioning.
 */
export class PublicKeyProvider {
	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	async loadCurrentPubKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<Versioned<PublicKeys>> {
		return this.loadPubKey(pubKeyIdentifier, null)
	}

	async loadVersionedPubKey(pubKeyIdentifier: PublicKeyIdentifier, version: KeyVersion): Promise<PublicKeys> {
		return (await this.loadPubKey(pubKeyIdentifier, version)).object
	}

	private async loadPubKey(pubKeyIdentifier: PublicKeyIdentifier, version: KeyVersion | null): Promise<Versioned<PublicKeys>> {
		const requestData = createPublicKeyGetIn({
			version: version ? String(version) : null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, requestData)
		const pubKeys = convertToVersionedPublicKeys(publicKeyGetOut)
		if (version != null && pubKeys.version !== version) {
			throw new InvalidDataError("the server returned a key version that was not requested")
		}
		return pubKeys
	}
}

export function convertToVersionedPublicKeys(publicKeyGetOut: PublicKeyGetOut): Versioned<PublicKeys> {
	return {
		object: {
			pubRsaKey: publicKeyGetOut.pubRsaKey,
			pubKyberKey: publicKeyGetOut.pubKyberKey,
			pubEccKey: publicKeyGetOut.pubEccKey,
		},
		version: parseKeyVersion(publicKeyGetOut.pubKeyVersion),
	}
}
