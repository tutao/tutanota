import { assertWorkerOrNode } from "../../common/Env.js"
import { Ed25519Facade, EncodedEd25519Signature } from "./Ed25519Facade"
import { createPublicKeySignature, PublicKeySignature } from "../../entities/sys/TypeRefs"
import { byteArraysToBytes, bytesToByteArrays, KeyVersion, Versioned } from "@tutao/tutanota-utils"
import { InvalidDataError } from "../../common/error/RestError"
import { asPublicKeySignatureType, PublicKeySignatureType } from "../../common/TutanotaConstants"
import { checkKeyVersionConstraints } from "./KeyLoaderFacade"
import {
	AsymmetricKeyPair,
	Ed25519PrivateKey,
	Ed25519PublicKey,
	isPqKeyPairs,
	isPqPublicKey,
	isRsaOrRsaX25519KeyPair,
	isRsaPublicKey,
	isRsaX25519KeyPair,
	isRsaX25519PublicKey,
	KeyPairType,
	kyberPublicKeyToBytes,
	PublicKey,
	rsaPublicKeyToBytes,
} from "@tutao/tutanota-crypto"
import { CryptoWrapper } from "../crypto/CryptoWrapper"

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
	constructor(
		private readonly ed25519Facade: Ed25519Facade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	/*
	 * Returns the public keys canonicalized in the following order:
	 * | SignatureType | PublicKeyVersion | PubEccKey | PubRsaKey or PubKyberKey |
	 * Throws for invalid key pair types or key pair version that do not fit into a byte or are not integers
	 * @VisibleForTesting
	 */
	serializePublicKeyForSigning(versionedPublicKey: Versioned<PublicKey>): {
		encodedKeyPairForSigning: Uint8Array
		signatureType: PublicKeySignatureType
	} {
		const publicKey = versionedPublicKey.object
		let firstPubKeyComponent: Uint8Array
		let secondPubKeyComponent: Uint8Array
		let signatureType: PublicKeySignatureType
		if (isPqPublicKey(publicKey)) {
			firstPubKeyComponent = publicKey.x25519PublicKey
			secondPubKeyComponent = kyberPublicKeyToBytes(publicKey.kyberPublicKey)
			signatureType = PublicKeySignatureType.TutaCrypt
		} else if (isRsaX25519PublicKey(publicKey)) {
			firstPubKeyComponent = publicKey.publicEccKey
			secondPubKeyComponent = rsaPublicKeyToBytes(publicKey)
			signatureType = PublicKeySignatureType.RsaEcc
		} else if (isRsaPublicKey(publicKey)) {
			firstPubKeyComponent = new Uint8Array(0)
			secondPubKeyComponent = rsaPublicKeyToBytes(publicKey)
			signatureType = PublicKeySignatureType.RsaFormerGroupKey
		} else {
			throw new Error("invalid key pair type")
		}

		const keyPairVersionAsBytes = new Uint8Array(1)
		const signatureTypeAsBytes = new Uint8Array(1)
		if (versionedPublicKey.version > 255) {
			throw new InvalidDataError("currently not possible to parse key pair versions that do not fit into one byte")
		}
		keyPairVersionAsBytes[0] = versionedPublicKey.version

		const signatureTypeEnumValue = parseInt(signatureType)
		if (signatureTypeEnumValue > 255) {
			throw new InvalidDataError("currently not possible to parse signature types that do not fit into one byte")
		}
		signatureTypeAsBytes[0] = signatureTypeEnumValue

		return {
			encodedKeyPairForSigning: byteArraysToBytes([signatureTypeAsBytes, keyPairVersionAsBytes, firstPubKeyComponent, secondPubKeyComponent]),
			signatureType,
		}
	}

	/**
	 * @VisibleForTesting
	 */
	deserializePublicKeyForSigning(serializedPublicKey: Uint8Array): DeserializedPublicKeyForSigning {
		const byteArrays = bytesToByteArrays(serializedPublicKey, 4)

		if (byteArrays[0].length !== 1) {
			throw new InvalidDataError("signature types greater than one byte are not yet supported")
		}
		if (byteArrays[1].length !== 1) {
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

	async signPublicKey(
		versionedEncryptionKeyPair: Versioned<AsymmetricKeyPair>,
		privateIdentityKey: Versioned<Ed25519PrivateKey>,
	): Promise<PublicKeySignature> {
		const encryptionKeyPair = versionedEncryptionKeyPair.object
		let publicEncryptionKey = this.extractAndValidatePublicKey(encryptionKeyPair)
		const { encodedKeyPairForSigning, signatureType } = this.serializePublicKeyForSigning({
			object: publicEncryptionKey,
			version: versionedEncryptionKeyPair.version,
		})
		const signatureBytes = await this.ed25519Facade.sign(privateIdentityKey.object, encodedKeyPairForSigning)
		return createPublicKeySignature({
			signature: signatureBytes,
			signingKeyVersion: privateIdentityKey.version.toString(),
			signatureType,
			publicKeyVersion: versionedEncryptionKeyPair.version.toString(),
		})
	}

	async verifyPublicKeySignature(
		publicEncryptionKey: Versioned<PublicKey>,
		publicIdentityKey: Ed25519PublicKey,
		signatureBytes: EncodedEd25519Signature,
	): Promise<boolean> {
		const { encodedKeyPairForSigning } = this.serializePublicKeyForSigning(publicEncryptionKey)
		return this.ed25519Facade.verifySignature(publicIdentityKey, signatureBytes, encodedKeyPairForSigning)
	}

	/**
	 * Public keys are saved without authentication on the server. Therefore, we extract them from the private key to make sure, that the server delivered the correct one.
	 * @param encryptionKeyPair
	 * @private
	 */
	private extractAndValidatePublicKey(encryptionKeyPair: AsymmetricKeyPair) {
		if (isPqKeyPairs(encryptionKeyPair)) {
			const x25519PublicKey = this.cryptoWrapper.verifyPublicX25519Key(encryptionKeyPair.x25519KeyPair)
			const kyberPublicKey = this.cryptoWrapper.verifyKyberPublicKey(encryptionKeyPair.kyberKeyPair)
			return { kyberPublicKey, x25519PublicKey, keyPairType: KeyPairType.TUTA_CRYPT }
		} else if (isRsaOrRsaX25519KeyPair(encryptionKeyPair)) {
			const rsaPublicKey = this.cryptoWrapper.verifyRsaPublicKey(encryptionKeyPair)
			if (isRsaX25519KeyPair(encryptionKeyPair)) {
				const x25519PublicKey = this.cryptoWrapper.verifyPublicX25519Key({
					publicKey: encryptionKeyPair.publicEccKey,
					privateKey: encryptionKeyPair.privateEccKey,
				})
				return {
					...rsaPublicKey,
					publicEccKey: x25519PublicKey,
					keyPairType: KeyPairType.RSA_AND_X25519,
				}
			} else {
				return { ...rsaPublicKey, keyPairType: KeyPairType.RSA }
			}
		} else {
			throw new Error("invalid key pair type")
		}
	}
}
