import { createPublicKeyGetIn, PubDistributionKey, PublicKeyGetOut, PublicKeySignature, type SystemKeysReturn } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { parseKeyVersion } from "./KeyLoaderFacade.js"
import { lazyAsync, uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { EncryptionKeyVerificationState, PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
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
import { KeyVerificationFacade } from "./lazy/KeyVerificationFacade"
import { KeyVerificationMismatchError } from "../../common/error/KeyVerificationMismatchError"

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}

export type PublicKeyRawData = {
	pubKeyVersion: NumberString
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
	signature: null | PublicKeySignature
}

export type LoadedPublicEncryptionKey = {
	publicEncryptionKey: Versioned<PublicKey>
	verificationState: EncryptionKeyVerificationState
}

export type MaybeSignedPublicKey = { publicKey: PublicKey; signature: PublicKeySignature | null }

/**
 * Load public encryption keys.
 * Handle key versioning.
 */
export class PublicEncryptionKeyProvider {
	constructor(private readonly serviceExecutor: IServiceExecutor, private readonly lazyKeyVerificationFacade: lazyAsync<KeyVerificationFacade>) {}

	async loadCurrentPubKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<LoadedPublicEncryptionKey> {
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
	async loadPublicEncryptionKey(pubKeyIdentifier: PublicKeyIdentifier, version: KeyVersion | null): Promise<LoadedPublicEncryptionKey> {
		const requestData = createPublicKeyGetIn({
			version: version ? String(version) : null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, requestData)
		const publicEncryptionKey = this.convertFromPublicKeyGetOut(publicKeyGetOut) // TODO also parse the signature
		this.enforceRsaKeyVersionConstraint(publicEncryptionKey)
		if (version != null && publicEncryptionKey.version !== version) {
			throw new InvalidDataError("the server returned a key version that was not requested")
		}

		// TODO move this logic to keyVerificationFacade and only call:
		// keyVerificationFacade.verify() which provides a verification state and public encryption key
		const keyVerificationFacade = await this.lazyKeyVerificationFacade()
		// if (pubKeyIdentifier.identifierType === PublicKeyIdentifierType.MAIL_ADDRESS) {
		// 	const mailAddress = pubKeyIdentifier.identifier

		const encodedPublicEncryptionKeySignature = publicKeyGetOut.signature ? publicKeyGetOut.signature : null
		const maybeSignedPublicEncryptionKey: Versioned<MaybeSignedPublicKey> = {
			version: publicEncryptionKey.version,
			object: { publicKey: publicEncryptionKey.object, signature: encodedPublicEncryptionKeySignature },
		}
		let verificationState = await keyVerificationFacade.verify(pubKeyIdentifier, maybeSignedPublicEncryptionKey)

		// if (verificationState === EncryptionKeyVerificationState.NO_ENTRY) {
		// 	// TOFU: identity key is not yet in the trust database. Load and add it now.
		// 	const tofuIdentityKey = await this.loadPublicIdentityKey(pubKeyIdentifier)
		// 	if (tofuIdentityKey == null) {
		// 		if (publicKeyGetOut.signature) {
		// 			throw new KeyVerificationMismatchError("no identity key for: " + mailAddress)
		// 		} else {
		// 			// For now, we want to accept a public key not having a signature IF there is
		// 			// also no identity key. This is for backwards compatbility.
		// 			return {
		// 				verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		// 				publicEncryptionKey: publicEncryptionKey,
		// 			}
		// 		}
		// 	}
		//
		// 	await keyVerificationFacade.trust(mailAddress, tofuIdentityKey, IdentityKeySourceOfTrust.TOFU)
		// 	verificationState = await keyVerificationFacade.verify(mailAddress, publicEncryptionKey, encodedPublicEncryptionKeySignature)
		// }

		return {
			verificationState: verificationState,
			publicEncryptionKey: publicEncryptionKey,
		}
		// } else {
		// 	// if identifier type has not been MAIL_ADDRESS or key verification is not supported
		// 	return {
		// 		verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		// 		publicEncryptionKey: publicEncryptionKey,
		// 	}
		// }
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

	/// Public key converter

	public convertFromPublicKeyGetOut(publicKeys: PublicKeyGetOut): Versioned<PublicKey> {
		return this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeys.pubRsaKey,
			pubEccKey: publicKeys.pubEccKey,
			pubKyberKey: publicKeys.pubKyberKey,
			pubKeyVersion: publicKeys.pubKeyVersion,
			signature: publicKeys.signature,
		})
	}

	public convertFromSystemKeysReturn(publicKeys: SystemKeysReturn): Versioned<PublicKey> {
		return this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeys.systemAdminPubRsaKey,
			pubEccKey: publicKeys.systemAdminPubEccKey,
			pubKyberKey: publicKeys.systemAdminPubKyberKey,
			pubKeyVersion: publicKeys.systemAdminPubKeyVersion,
			signature: null,
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
			signature: null,
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
			signature: null,
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
