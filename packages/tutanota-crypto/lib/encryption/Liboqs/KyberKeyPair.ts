export type KyberKeyPair = {
	publicKey: KyberPublicKey
	privateKey: KyberPrivateKey
}
export type KyberPrivateKey = {
	raw: Uint8Array
}
export type KyberPublicKey = {
	raw: Uint8Array
}

export type KyberEncapsulation = {
	ciphertext: Uint8Array
	sharedSecret: Uint8Array
}
