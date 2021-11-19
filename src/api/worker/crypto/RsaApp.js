// @flow
import {LazyLoaded} from "@tutao/tutanota-utils"
import {generateRsaKeySync, random, rsaDecryptSync, rsaEncryptSync} from "@tutao/tutanota-crypto"
import {Mode} from "../../common/Env"
import type {PrivateKey, PublicKey, RsaKeyPair} from "@tutao/tutanota-crypto"


const jsRsaApp = {
	generateRsaKey: () => Promise.resolve(generateRsaKeySync()),
	rsaEncrypt: (publicKey, bytes, seed) => rsaEncryptSync(publicKey, bytes, seed),
	rsaDecrypt: (privateKey, bytes) => rsaDecryptSync(privateKey, bytes),
}

/**
 * This is a hack to avoid loading things we don't need and we should re-structure to avoid it
 */
const rsaApp = new LazyLoaded<typeof jsRsaApp>(() => {
	if (env.mode === Mode.App) {
		return import("../../../native/worker/RsaApp").then((m) => {
			const app = m.rsaApp
			return {
				generateRsaKey: () => app.generateRsaKey(random.generateRandomData(512)),
				rsaEncrypt: app.rsaEncrypt,
				rsaDecrypt: app.rsaDecrypt,
			}
		})
	} else {
		return Promise.resolve(jsRsaApp)
	}
})

/**
 * Returns the newly generated key
 * @param keyLength
 * @return resolves to the the generated keypair
 */
export function generateRsaKey(): Promise<RsaKeyPair> {
	return rsaApp.getAsync().then((app) => app.generateRsaKey())
}

/**
 * Encrypt bytes with the provided publicKey
 * @param publicKey
 * @param bytes
 * @return returns the encrypted bytes.
 */
export function rsaEncrypt(publicKey: PublicKey, bytes: Uint8Array): Promise<Uint8Array> {
	let seed = random.generateRandomData(32)
	return rsaApp.getAsync().then((app) => app.rsaEncrypt(publicKey, bytes, seed))
}

/**
 * Decrypt bytes with the provided privateKey
 * @param privateKey
 * @param bytes
 * @return returns the decrypted bytes.
 */
export function rsaDecrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
	return rsaApp.getAsync().then((app) => app.rsaDecrypt(privateKey, bytes))
}
