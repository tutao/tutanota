/* generated file, don't edit. */

import { RsaPublicKey } from "../types/RsaPublicKey"
import { RsaPrivateKey } from "../types/RsaPrivateKey"
import { KyberPublicKey } from "../types/KyberPublicKey"
import { KyberPrivateKey } from "../types/KyberPrivateKey"
import { IPCEd25519PrivateKey } from "../types/IPCEd25519PrivateKey"
import { IPCEd25519PublicKey } from "../types/IPCEd25519PublicKey"
import { IPCEd25519Signature } from "../types/IPCEd25519Signature"
import { NativeCryptoFacade } from "@tutao/native-bridge/generatedIpc/types"
import { InitializationVector } from "@tutao/crypto"

export class NativeCryptoFacadeReceiveDispatcher {
	constructor(private readonly facade: NativeCryptoFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "rsaEncrypt": {
				const publicKey: RsaPublicKey = arg[0]
				const data: Uint8Array = arg[1]
				const seed: Uint8Array = arg[2]
				return this.facade.rsaEncrypt(publicKey, data, seed)
			}
			case "rsaDecrypt": {
				const privateKey: RsaPrivateKey = arg[0]
				const data: Uint8Array = arg[1]
				return this.facade.rsaDecrypt(privateKey, data)
			}
			case "aesEncryptFile": {
				const key: Uint8Array = arg[0]
				const fileUri: string = arg[1]
				const initializationVector: InitializationVector = arg[2]
				return this.facade.aesEncryptFile(key, fileUri, initializationVector)
			}
			case "aesDecryptFile": {
				const key: Uint8Array = arg[0]
				const fileUri: string = arg[1]
				return this.facade.aesDecryptFile(key, fileUri)
			}
			case "argon2idGeneratePassphraseKey": {
				const passphrase: string = arg[0]
				const salt: Uint8Array = arg[1]
				return this.facade.argon2idGeneratePassphraseKey(passphrase, salt)
			}
			case "generateKyberKeypair": {
				const seed: Uint8Array = arg[0]
				return this.facade.generateKyberKeypair(seed)
			}
			case "kyberEncapsulate": {
				const publicKey: KyberPublicKey = arg[0]
				const seed: Uint8Array = arg[1]
				return this.facade.kyberEncapsulate(publicKey, seed)
			}
			case "kyberDecapsulate": {
				const privateKey: KyberPrivateKey = arg[0]
				const ciphertext: Uint8Array = arg[1]
				return this.facade.kyberDecapsulate(privateKey, ciphertext)
			}
			case "generateEd25519Keypair": {
				return this.facade.generateEd25519Keypair()
			}
			case "ed25519Sign": {
				const privateKey: IPCEd25519PrivateKey = arg[0]
				const data: Uint8Array = arg[1]
				return this.facade.ed25519Sign(privateKey, data)
			}
			case "ed25519Verify": {
				const publicKey: IPCEd25519PublicKey = arg[0]
				const data: Uint8Array = arg[1]
				const signature: IPCEd25519Signature = arg[2]
				return this.facade.ed25519Verify(publicKey, data, signature)
			}
		}
	}
}
