import { createPublicKeyGetIn, PubDistributionKey, PublicKeyGetOut, PublicKeySignature, type SystemKeysReturn } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { parseKeyVersion } from "./KeyLoaderFacade.js"
import { lazyAsync, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"
import { InvalidDataError } from "../../common/error/RestError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import {
	bytesToKyberPublicKey,
	EncryptedPqKeyPairs,
	hexToRsaPublicKey,
	isVersionedPqPublicKey,
	isVersionedRsaOrRsaX25519PublicKey,
	KeyPairType,
	PQPublicKeys,
	PublicKey,
	RsaX25519PublicKey,
} from "@tutao/tutanota-crypto"
import { KeyVerificationFacade, VerifiedPublicEncryptionKey } from "./lazy/KeyVerificationFacade"

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}

export type PublicKeyRawData = {
	pubKeyVersion: NumberString
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
}

export type MaybeSignedPublicKey = { publicKey: Versioned<PublicKey>; signature: PublicKeySignature | null }

/**
 * Load public encryption keys.
 *
 * Verifies authenticity of the encryption keys and return the respective verification state alongside the encryption key.
 * Handle key versioning.
 *
 * This should be the only source of public keys (except for groups that belong to the user/admin).
 */
export class PublicEncryptionKeyProvider {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly lazyKeyVerificationFacade: lazyAsync<KeyVerificationFacade>,
	) {}

	async loadCurrentPublicEncryptionKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<VerifiedPublicEncryptionKey> {
		return this.loadPublicEncryptionKey(pubKeyIdentifier, null)
	}

	/**
	 * Loads a public encryption key for the given identifier. Ensures that key verification is executed when
	 * identifier type is MAIL_ADDRESS. Existing signatures on public keys are verified against the local trust database.
	 * Implements TOFU transparently.
	 *
	 * @param pubKeyIdentifier
	 * @param version
	 * @throws KeyVerificationMismatchError in case of key verification failure
	 */
	async loadPublicEncryptionKey(pubKeyIdentifier: PublicKeyIdentifier, version: KeyVersion | null): Promise<VerifiedPublicEncryptionKey> {
		const requestData = createPublicKeyGetIn({
			version: version != null ? String(version) : null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, requestData)
		const publicEncryptionKey = this.convertFromPublicKeyGetOut(publicKeyGetOut)
		this.enforceRsaKeyVersionConstraint(publicEncryptionKey.publicKey)
		if (version != null && publicEncryptionKey.publicKey.version !== version) {
			throw new InvalidDataError("the server returned a key version that was not requested")
		}

		const keyVerificationFacade = await this.lazyKeyVerificationFacade()
		return keyVerificationFacade.verify(pubKeyIdentifier, publicEncryptionKey)
	}

	/**
	 * RSA keys were only created before introducing key versions, i.e. they always have version 0.
	 *
	 * Receiving a higher version would indicate a protocol downgrade/ MITM attack, and we reject such keys.
	 */
	private enforceRsaKeyVersionConstraint(pubKeys: Versioned<PublicKey>) {
		if (pubKeys.version !== 0 && isVersionedRsaOrRsaX25519PublicKey(pubKeys)) {
			throw new CryptoError("rsa key in a version that is not 0")
		}
	}

	public convertFromPublicKeyGetOut(publicKeyGetOut: PublicKeyGetOut): MaybeSignedPublicKey {
		const publicEncryptionKey = this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeyGetOut.pubRsaKey,
			pubEccKey: publicKeyGetOut.pubEccKey,
			pubKyberKey: publicKeyGetOut.pubKyberKey,
			pubKeyVersion: publicKeyGetOut.pubKeyVersion,
		})
		return {
			signature: publicKeyGetOut.signature,
			publicKey: publicEncryptionKey,
		}
	}

	public convertFromSystemKeysReturn(publicKeys: SystemKeysReturn): Versioned<PublicKey> {
		return this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeys.systemAdminPubRsaKey,
			pubEccKey: publicKeys.systemAdminPubEccKey,
			pubKyberKey: publicKeys.systemAdminPubKyberKey,
			pubKeyVersion: publicKeys.systemAdminPubKeyVersion,
		})
	}

	/**
	 * Converts some form of public PQ keys to the PQPublicKeys type. Assumes pubEccKey and pubKyberKey exist.
	 * @param kp
	 * @param pubKeyVersion
	 */
	public convertFromEncryptedPqKeyPairs(kp: EncryptedPqKeyPairs, pubKeyVersion: KeyVersion): Versioned<PQPublicKeys> {
		const publicKey = this.convertFromPublicKeyRawData({
			pubRsaKey: null,
			pubEccKey: kp.pubEccKey,
			pubKyberKey: kp.pubKyberKey,
			pubKeyVersion: pubKeyVersion.toString(),
		})
		if (isVersionedPqPublicKey(publicKey)) {
			return publicKey
		} else {
			throw new Error("Cannot convert EncryptedPqKeyPairs to PQPublicKeys")
		}
	}

	/**
	 * Converts some form of public PQ keys to the PQPublicKeys type. Assumes pubEccKey and pubKyberKey exist.
	 * @param pubDistributionKey
	 */
	public convertFromPubDistributionKey(pubDistributionKey: PubDistributionKey): Versioned<PQPublicKeys> {
		const publicKey = this.convertFromPublicKeyRawData({
			pubRsaKey: null,
			pubEccKey: pubDistributionKey.pubEccKey,
			pubKyberKey: pubDistributionKey.pubKyberKey,
			pubKeyVersion: "0", // for distribution keys the version is always 0 because they are only used for the rotation and never rotated.
		})
		if (isVersionedPqPublicKey(publicKey)) {
			return publicKey
		} else {
			throw new Error("Cannot convert PubDistributionKey to PQPublicKeys")
		}
	}

	private convertFromPublicKeyRawData(publicKeys: PublicKeyRawData): Versioned<PublicKey> {
		const version = parseKeyVersion(publicKeys.pubKeyVersion)
		// const version = Number(publicKeys.pubKeyVersion)
		if (publicKeys.pubRsaKey) {
			if (publicKeys.pubEccKey) {
				const eccPublicKey = publicKeys.pubEccKey
				const rsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey))
				const rsaEccPublicKey: RsaX25519PublicKey = Object.assign(rsaPublicKey, {
					keyPairType: KeyPairType.RSA_AND_X25519,
					publicEccKey: eccPublicKey,
				})
				return {
					version,
					object: rsaEccPublicKey,
				}
			} else {
				return {
					version,
					object: hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey)),
				}
			}
		} else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
			const eccPublicKey = publicKeys.pubEccKey
			const kyberPublicKey = bytesToKyberPublicKey(publicKeys.pubKyberKey)
			const pqPublicKey: PQPublicKeys = {
				keyPairType: KeyPairType.TUTA_CRYPT,
				x25519PublicKey: eccPublicKey,
				kyberPublicKey,
			}
			return {
				version,
				object: pqPublicKey,
			}
		} else {
			throw new Error("Inconsistent public key")
		}
	}
}
