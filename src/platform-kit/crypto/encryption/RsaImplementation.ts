import type { RsaPrivateKey, RsaPublicKey } from "@tutao/crypto"

export interface RsaImplementation {
	encrypt(publicKey: RsaPublicKey, bytes: Uint8Array): Promise<Uint8Array>

	decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Promise<Uint8Array>
}
