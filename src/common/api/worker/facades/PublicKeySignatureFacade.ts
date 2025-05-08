import { assertWorkerOrNode } from "../../common/Env.js"
import { Ed25519Facade } from "./Ed25519Facade"
import { IdentityKeyPair, KeyPair } from "../../entities/sys/TypeRefs"
import { assertNotNull, byteArraysToBytes, KeyVersion } from "@tutao/tutanota-utils"
import { InvalidDataError } from "../../common/error/RestError"
import { PublicKeySignatureType } from "../../common/TutanotaConstants"
import { assertNull } from "@tutao/tutanota-utils/dist/Utils"
import { bytesToEd25519PublicKey } from "../../../../../packages/tutanota-crypto/lib"

assertWorkerOrNode()

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
		if (encryptionKeyPair.pubEccKey == null) {
			throw new InvalidDataError("pubEccKey is required")
		}
		let secondPubKeyComponent: Uint8Array
		let signatureType: PublicKeySignatureType
		if (encryptionKeyPair.pubRsaKey != null) {
			assertNull(encryptionKeyPair.pubKyberKey, "Must either have a public kyber or an rsa key")
			secondPubKeyComponent = encryptionKeyPair.pubRsaKey
			signatureType = PublicKeySignatureType.RsaEcc
		} else {
			secondPubKeyComponent = assertNotNull(encryptionKeyPair.pubKyberKey, "Must have a public kyber key if no rsa key is present")
			signatureType = PublicKeySignatureType.TutaCrypt
		}
		const keyPairVersionAsBytes = new Uint8Array(4)
		const signatureTypeAsBytes = new Uint8Array(4)
		if (keyPairVersion > 127) {
			throw new InvalidDataError("currently not possible to parse key pair versions that do not fit into one byte")
		}
		keyPairVersionAsBytes[3] = keyPairVersion

		const signatureTypeEnumValue = parseInt(signatureType)
		if (signatureTypeEnumValue > 255) {
			throw new InvalidDataError("currently not possible to parse signature types that do not fit into one byte")
		}
		signatureTypeAsBytes[3] = signatureTypeEnumValue

		return byteArraysToBytes([signatureTypeAsBytes, keyPairVersionAsBytes, encryptionKeyPair.pubEccKey, secondPubKeyComponent])
	}

	// 	@VisibleForTesting
	// 	public DeserializedPublicKeyForSigning deserializePublicKeyForSigning(byte[] serializedPublicKey) {
	// 	List<byte[]> byteArrays = EncodingConverter.bytesToByteArrays(serializedPublicKey, 4);
	// 	PublicKeySignatureType signatureType = Objects.requireNonNull(EnumUtils.get(PublicKeySignatureType.class, ByteBuffer.wrap(byteArrays.get(0)).getInt()));
	// 	Assert.equals(1, byteArrays.get(1).length, "key pair versions higher than one byte are not yet supported");
	// 	var encryptionKeyPairVersion = BigDecimal.valueOf(byteArrays.get(1)[0]);
	// 	var pubEccKey = byteArrays.get(2);
	// 	var secondPubKeyComponent = byteArrays.get(3);
	// 	return switch (signatureType) {
	// 	case RsaEcc -> new DeserializedPublicKeyForSigning(encryptionKeyPairVersion, signatureType, pubEccKey, null, secondPubKeyComponent);
	// 	case TutaCrypt -> new DeserializedPublicKeyForSigning(encryptionKeyPairVersion, signatureType, pubEccKey, secondPubKeyComponent, null);
	// 	};
	// }

	// @VisibleForTesting
	// public byte[] signPublicKey(KeyPair encryptionKeyPair, Ed25519Facade.Ed25519PrivateKey privateIdentityKey, BigDecimal keyPairVersion) {
	// 	var encodedKeyPairForSigning = serializePublicKeyForSigning(encryptionKeyPair, keyPairVersion);
	// 	return ed25519Facade.sign(privateIdentityKey, encodedKeyPairForSigning).raw();
	// }

	async verifyPublicKeySignature(
		encryptionKeyPair: KeyPair,
		identityKeyPair: IdentityKeyPair,
		keyPairVersion: KeyVersion,
		signatureBytes: Uint8Array,
	): Promise<boolean> {
		const encodedKeyPairForSigning = this.serializePublicKeyForSigning(encryptionKeyPair, keyPairVersion)
		const publicIdentityKey = bytesToEd25519PublicKey(identityKeyPair.publicEd25519Key)
		return this.ed25519Facade.verify(publicIdentityKey, encodedKeyPairForSigning, signatureBytes)
	}
}
