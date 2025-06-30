/* generated file, don't edit. */

import { RsaPublicKey } from "./RsaPublicKey.js"
import { RsaPrivateKey } from "./RsaPrivateKey.js"
import { EncryptedFileInfo } from "./EncryptedFileInfo.js"
import { KyberKeyPair } from "./KyberKeyPair.js"
import { KyberPublicKey } from "./KyberPublicKey.js"
import { KyberEncapsulation } from "./KyberEncapsulation.js"
import { KyberPrivateKey } from "./KyberPrivateKey.js"
import { IPCEd25519KeyPair } from "./IPCEd25519KeyPair.js"
import { IPCEd25519PrivateKey } from "./IPCEd25519PrivateKey.js"
import { IPCEd25519Signature } from "./IPCEd25519Signature.js"
import { IPCEd25519PublicKey } from "./IPCEd25519PublicKey.js"
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
