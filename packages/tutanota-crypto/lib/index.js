// @flow


export {
	aes256RandomKey,
	generateIV,
	aes256Encrypt,
	aes256Decrypt,
	aes128RandomKey,
	aes128Encrypt,
	aes128Decrypt,
	ENABLE_MAC,
	IV_BYTE_LENGTH,
} from "./encryption/Aes"

export {
	generateRandomSalt,
	generateKeyFromPassphrase
} from "./hashes/Bcrypt"

export {
	CryptoError
} from "./misc/CryptoError"

export {
	KeyLength,
} from "./misc/Constants"

export type {
	KeyLengthEnum,
	EntropySource
} from "./misc/Constants"

export {
	encryptKey,
	decryptKey,
	encrypt256Key,
	aes256EncryptKey,
	aes256DecryptKey,
	decrypt256Key,
	encryptRsaKey,
	decryptRsaKey,
} from "./encryption/KeyEncryption"

export {
	Randomizer,
	random
} from "./random/Randomizer"

export {
	sign,
	encode,
	generateRsaKeySync,
	verifySignature,
	hexToPublicKey,
	rsaDecryptSync,
	hexToPrivateKey,
	privateKeyToHex,
	publicKeyToHex,
	rsaEncryptSync,
} from "./encryption/Rsa"

export type {
	RsaKeyPair,
	PrivateKey,
	PublicKey,
} from "./encryption/RsaKeyPair"

export {sha1Hash} from "./hashes/Sha1"
export {sha256Hash} from "./hashes/Sha256"
export {sha512Hash} from "./hashes/Sha512"

export {
	TotpVerifier
} from "./misc/TotpVerifier"

export type {
	TotpSecret,
} from "./misc/TotpVerifier"

export {
	createAuthVerifier,
	fixedIv,
	keyToBase64,
	base64ToKey,
	createAuthVerifierAsBase64Url,
	uint8ArrayToBitArray,
	padAes,
	bitArrayToUint8Array,
	unpadAes,
	checkIs128BitKey,
	keyToUint8Array,
	uint8ArrayToKey,
} from "./misc/Utils"

export { murmurHash } from "./hashes/MurmurHash"