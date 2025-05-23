import { assertWorkerOrNode } from "../../common/Env.js"
import { Ed25519Facade, EncodedEd25519Signature, SigningPublicKey } from "./Ed25519Facade"
import { IdentityKeyPair, KeyPair } from "../../entities/sys/TypeRefs"
import { assertNotNull, byteArraysToBytes, bytesToByteArrays, KeyVersion, Versioned } from "@tutao/tutanota-utils"
import { InvalidDataError } from "../../common/error/RestError"
import { asPublicKeySignatureType, PublicKeySignatureType } from "../../common/TutanotaConstants"
import { assertNull } from "@tutao/tutanota-utils/dist/Utils"
import { checkKeyVersionConstraints } from "./KeyLoaderFacade"
import { bytesToEd25519PublicKey, Ed25519PrivateKey } from "@tutao/tutanota-crypto"
import type { PublicKeyRawData } from "./PublicKeyProvider"

assertWorkerOrNode()

export type DeserializedPublicKeyForSigning = {
	encryptionKeyPairVersion: KeyVersion
	signatureType: PublicKeySignatureType
	pubEccKey: Uint8Array | null
	pubKyberKey: Uint8Array | null
	pubRsaKey: Uint8Array | null
}

/**
 * Helper class to encode/decode key pairs in order to sign and verify public encryption keys with identity keys.
 */
export class PublicKeySignatureFacade {
	constructor(private readonly ed25519Facade: Ed25519Facade) {}

	/*
	 * Returns the public keys canonicalized in the following order:
	 * | SignatureType | PublicKeyVersion | PubEccKey | PubRsaKey or PubKyberKey |
	 * Throws for invalid key pair types or key pair version that do not fit into a byte or are not integers
	 * @VisibleForTesting
	 */
	serializePublicKeyForSigning(encryptionKeyPair: KeyPair, keyPairVersion: KeyVersion): Uint8Array {
		let firstPubKeyComponent: Uint8Array
		let secondPubKeyComponent: Uint8Array
		let signatureType: PublicKeySignatureType
		if (encryptionKeyPair.pubRsaKey != null) {
			assertNull(encryptionKeyPair.pubKyberKey, "Must either have a public kyber or an rsa key")
			secondPubKeyComponent = encryptionKeyPair.pubRsaKey
			if (encryptionKeyPair.pubEccKey != null) {
				firstPubKeyComponent = encryptionKeyPair.pubEccKey
				signatureType = PublicKeySignatureType.RsaEcc
			} else {
				firstPubKeyComponent = new Uint8Array(0)
				signatureType = PublicKeySignatureType.RsaFormerGroupKey
			}
		} else {
			firstPubKeyComponent = assertNotNull(encryptionKeyPair.pubEccKey, "Must have a public ecc key if no rsa key is present")
			secondPubKeyComponent = assertNotNull(encryptionKeyPair.pubKyberKey, "Must have a public kyber key if no rsa key is present")
			signatureType = PublicKeySignatureType.TutaCrypt
		}
		const keyPairVersionAsBytes = new Uint8Array(1)
		const signatureTypeAsBytes = new Uint8Array(1)
		if (keyPairVersion > 255) {
			throw new InvalidDataError("currently not possible to parse key pair versions that do not fit into one byte")
		}
		keyPairVersionAsBytes[0] = keyPairVersion

		const signatureTypeEnumValue = parseInt(signatureType)
		if (signatureTypeEnumValue > 255) {
			throw new InvalidDataError("currently not possible to parse signature types that do not fit into one byte")
		}
		signatureTypeAsBytes[0] = signatureTypeEnumValue

		return byteArraysToBytes([signatureTypeAsBytes, keyPairVersionAsBytes, firstPubKeyComponent, secondPubKeyComponent])
	}

	/**
	 * @VisibleForTesting
	 */
	deserializePublicKeyForSigning(serializedPublicKey: Uint8Array): DeserializedPublicKeyForSigning {
		const byteArrays = bytesToByteArrays(serializedPublicKey, 4)

		if (byteArrays[0].length != 1) {
			throw new InvalidDataError("signature types greater than one byte are not yet supported")
		}
		if (byteArrays[1].length != 1) {
			throw new InvalidDataError("key pair versions greater than one byte are not yet supported")
		}
		const signatureType: PublicKeySignatureType = asPublicKeySignatureType(byteArrays[0][0].toString())
		const encryptionKeyPairVersion = checkKeyVersionConstraints(byteArrays[1][0])
		const pubEccKey = byteArrays[2]
		const secondPubKeyComponent = byteArrays[3]
		switch (signatureType) {
			case PublicKeySignatureType.RsaEcc:
				return {
					encryptionKeyPairVersion,
					signatureType,
					pubEccKey,
					pubKyberKey: null,
					pubRsaKey: secondPubKeyComponent,
				}
			case PublicKeySignatureType.TutaCrypt:
				return {
					encryptionKeyPairVersion,
					signatureType,
					pubEccKey,
					pubKyberKey: secondPubKeyComponent,
					pubRsaKey: null,
				}
			case PublicKeySignatureType.RsaFormerGroupKey:
				return {
					encryptionKeyPairVersion,
					signatureType,
					pubEccKey: null,
					pubKyberKey: null,
					pubRsaKey: secondPubKeyComponent,
				}
			default:
				throw new Error(`PublicKeySignatureType ${signatureType} not implemented`)
		}
	}

	async signPublicKey(encryptionKeyPair: KeyPair, privateIdentityKey: Ed25519PrivateKey, keyPairVersion: KeyVersion): Promise<EncodedEd25519Signature> {
		const encodedKeyPairForSigning = this.serializePublicKeyForSigning(encryptionKeyPair, keyPairVersion)
		return this.ed25519Facade.sign(privateIdentityKey, encodedKeyPairForSigning)
	}

	async verifyPublicKeySignature(
		encryptionKeyPair: KeyPair,
		identityKeyPair: IdentityKeyPair,
		keyPairVersion: KeyVersion,
		signatureBytes: EncodedEd25519Signature,
	): Promise<boolean> {
		const encodedKeyPairForSigning = this.serializePublicKeyForSigning(encryptionKeyPair, keyPairVersion)
		const publicIdentityKey = bytesToEd25519PublicKey(identityKeyPair.publicEd25519Key)
		return this.ed25519Facade.verifySignature(publicIdentityKey, signatureBytes, encodedKeyPairForSigning)
	}

	async verifyPublicEncryptionKeySignature(
		identityKeyPair: Versioned<SigningPublicKey>,
		encryptionKeyPair: PublicKeyRawData,
		signatureBytes: EncodedEd25519Signature,
	): Promise<boolean> {
		// TODO: Implement verification using a public key.
		return false
	}
}
