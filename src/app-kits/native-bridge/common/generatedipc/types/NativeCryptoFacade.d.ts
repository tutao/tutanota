/* generated file, don't edit. */

import {
	EncryptedFileInfo,
	IPCEd25519KeyPair,
	IPCEd25519PrivateKey,
	IPCEd25519PublicKey,
	IPCEd25519Signature,
	KyberEncapsulation,
	KyberKeyPair,
	KyberPrivateKey,
	KyberPublicKey,
	RsaPrivateKey,
	RsaPublicKey,
} from "./index"

export interface NativeCryptoFacade {
	rsaEncrypt(publicKey: RsaPublicKey, data: Uint8Array, seed: Uint8Array): Promise<Uint8Array>

	rsaDecrypt(privateKey: RsaPrivateKey, data: Uint8Array): Promise<Uint8Array>

	/**
	 * Encrypt file specified by the `fileUri`. Returns URI of the encrypted file.
	 */
	aesEncryptFile(key: Uint8Array, fileUri: string, iv: Uint8Array): Promise<EncryptedFileInfo>

	/**
	 * Decrypt file specified by the `fileUri`. Returns URI of the decrypted file.
	 */
	aesDecryptFile(key: Uint8Array, fileUri: string): Promise<string>

	argon2idGeneratePassphraseKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array>

	generateKyberKeypair(seed: Uint8Array): Promise<KyberKeyPair>

	kyberEncapsulate(publicKey: KyberPublicKey, seed: Uint8Array): Promise<KyberEncapsulation>

	kyberDecapsulate(privateKey: KyberPrivateKey, ciphertext: Uint8Array): Promise<Uint8Array>

	generateEd25519Keypair(): Promise<IPCEd25519KeyPair>

	ed25519Sign(privateKey: IPCEd25519PrivateKey, data: Uint8Array): Promise<IPCEd25519Signature>

	ed25519Verify(publicKey: IPCEd25519PublicKey, data: Uint8Array, signature: IPCEd25519Signature): Promise<boolean>
}
