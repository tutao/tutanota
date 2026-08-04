import { RsaPrivateKey, RsaPublicKey } from "./RsaKeyPair"

export interface RsaImplementation {
	encrypt(publicKey: RsaPublicKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>>

	decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>>
}
