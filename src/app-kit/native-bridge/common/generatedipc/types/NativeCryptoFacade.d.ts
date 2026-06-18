/* generated file, don't edit. */

import { RsaPublicKey } from "../types/RsaPublicKey"
import { RsaPrivateKey } from "../types/RsaPrivateKey"
import { EncryptedFileInfo } from "../types/EncryptedFileInfo"
import { KyberKeyPair } from "../types/KyberKeyPair"
import { KyberPublicKey } from "../types/KyberPublicKey"
import { KyberEncapsulation } from "../types/KyberEncapsulation"
import { KyberPrivateKey } from "../types/KyberPrivateKey"
import { IPCEd25519KeyPair } from "../types/IPCEd25519KeyPair"
import { IPCEd25519PrivateKey } from "../types/IPCEd25519PrivateKey"
import { IPCEd25519Signature } from "../types/IPCEd25519Signature"
import { IPCEd25519PublicKey } from "../types/IPCEd25519PublicKey"
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
