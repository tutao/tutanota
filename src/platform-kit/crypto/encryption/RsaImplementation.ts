import { RsaPrivateKey, RsaPublicKey } from "./RsaKeyPair"

export interface RsaImplementation {
	encrypt(publicKey: RsaPublicKey, bytes: Uint8Array): Promise<Uint8Array>

	decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Promise<Uint8Array>
}
