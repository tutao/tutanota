/**
 * Utility to codesign the finished Installers.
 * This enables the App to verify the authenticity of the Updates, and
 * enables the User to verify the authenticity of their manually downloaded
 * Installer with the openssl utility.
 *
 * ATTENTION MAC USERS: Safari started to automatically unpack zip files and then delete them,
 * so you'll have to look in your trash to get the original file.
 * once we switch to dmg this won't be necessary anymore, but:
 * https://github.com/electron-userland/electron-builder/issues/2199
 *
 * The installer signatures are created in the following files:
 * https://app.tuta.com/desktop/win-sig.bin (for Windows)
 * https://app.tuta.com/desktop/mac-sig-dmg.bin (for Mac .dmg installer)
 * https://app.tuta.com/desktop/mac-sig-zip.bin (for Mac .zip update file)
 * https://app.tuta.com/desktop/linux-sig.bin (for Linux)
 *
 * They allow verifying the initial download via
 *
 *      # get public key from github
 *      wget https://raw.githubusercontent.com/tutao/tutanota/master/tutao-pub.pem
 *          or
 *      curl https://raw.githubusercontent.com/tutao/tutanota/master/tutao-pub.pem > tutao-pub.pem
 *      # validate the signature against public key
 *      openssl dgst -sha512 -verify tutao-pub.pem -signature signature.bin tutanota.installer.ext
 *
 * openssl should Print 'Verified OK' after the second command if the signature matches the certificate
 *
 * This prevents an attacker from getting forged Installers/updates installed/applied
 *
 * get pem cert from pfx:
 * openssl pkcs12 -in comodo-codesign.pfx -clcerts -nokeys -out tutao-cert.pem
 *
 * get private key from pfx:
 * openssl pkcs12 -in comodo-codesign.pfx -nocerts -out tutao.pem
 *
 * get public key from pem cert:
 * openssl x509 -pubkey -noout -in tutao-cert.pem > tutao-pub.pem
 * */

import path from "node:path"
import fs from "node:fs"
import { spawnSync } from "node:child_process"
import jsyaml from "js-yaml"
import crypto from "node:crypto"
import { base64ToUint8Array } from "@tutao/tutanota-utils"

const SIG_ALGO = "RSASSA-PKCS1-v1_5"
const DIGEST = "SHA-512"

/**
 * Creates a signature on the given application file, writes it to signatureFileName and adds the signature to the yaml file.
 * Requires environment variable HSM_USER_PIN to be set to the HSM user pin.
 *
 * if the env var DEBUG_SIGN is set to the path to a directory containing a non-encrypted PEM-encoded private key (filename test.key) and the
 * matching PEM-encoded public key (test.pubkey), it will be used instead of the HSM.
 *
 * @param filePath The application file to sign. Needs to be the full path to the file.
 * @param signatureFileName The signature will be written to that file. Must not contain any path.
 * @param ymlFileName This yaml file will be adapted to include the signature. Must not contain any path.
 */
export async function sign(filePath, signatureFileName, ymlFileName) {
	console.log("Signing", path.basename(filePath), "...")
	const dir = path.dirname(filePath)

	const sigOutPath = process.env.DEBUG_SIGN
		? await signWithOwnPrivateKey(filePath, path.join(process.env.DEBUG_SIGN, "test.key"), signatureFileName, dir)
		: await signWithHSM(filePath, signatureFileName, dir)

	if (ymlFileName) {
		console.log(`attaching signature to yml...`, ymlFileName)
		const ymlPath = path.join(dir, ymlFileName)
		let yml = jsyaml.load(fs.readFileSync(ymlPath, "utf8"))
		const signatureContent = fs.readFileSync(sigOutPath)
		yml.signature = signatureContent.toString("base64")
		fs.writeFileSync(ymlPath, jsyaml.dump(yml), "utf8")
		console.log("signing done")
	} else {
		console.log("Not attaching signature to yml")
	}
}

async function signWithHSM(filePath, signatureFileName, dir) {
	console.log("sign with HSM")
	const result = spawnSync(
		"/usr/bin/pkcs11-tool",
		[
			"-s",
			"-m",
			"SHA512-RSA-PKCS",
			"--token-label",
			"SmartCard-HSM (UserPIN)",
			"--id",
			"10", // this is the index of the installer verification key
			"--pin",
			"env:HSM_USER_PIN",
			"-i",
			path.basename(filePath),
			"-o",
			signatureFileName,
		],
		{
			cwd: dir,
			stdio: [process.stdin, process.stdout, process.stderr],
		},
	)

	if (result.status !== 0) {
		throw new Error("error during hsm signing process" + JSON.stringify(result))
	}
	return path.join(dir, signatureFileName)
}

/**
 * takes a pem-encoded private key and returns the raw der-encoded data
 * @param key {string} private key pem
 * @returns {ArrayBuffer} raw binary der-encoded private key
 */

function pemToBinaryDer(key) {
	const pemContentsB64 = key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "")
	return base64ToUint8Array(pemContentsB64).buffer
}

/**
 * import a key from a pem-string and import it as a WebCrypto CryptoKey
 * that can be used for signing
 * @param pem
 * @returns {Promise<CryptoKey>}
 */
async function importPrivateKey(pem) {
	return crypto.webcrypto.subtle.importKey("pkcs8", pemToBinaryDer(pem), { name: SIG_ALGO, hash: DIGEST }, true, ["sign"])
}

/**
 * sign the contents of a file with a private key available in PEM format.
 *
 * a private key to use here can be created with:
 * import crypto from "node:crypto"
 *
 * 	const {privateKey, publicKey} = await crypto.webcrypto.subtle.generateKey({
 * 		name: 'RSASSA-PKCS1-v1_5',
 * 		modulusLength: 4096,
 * 		publicExponent: new Uint8Array([1, 0, 1]),
 * 		hash: "SHA-512",
 * 	}, true, ['sign', 'verify'])
 *
 * returns the full path to a file containing the signature in binary format
 */
async function signWithOwnPrivateKey(fileToSign, privateKeyPemFile, signatureOutFileName, dir) {
	console.log("sign with private key")
	const sigOutPath = path.join(dir, signatureOutFileName)

	try {
		const fileData = fs.readFileSync(fileToSign) // buffer
		const privateKeyPem = fs.readFileSync(privateKeyPemFile, { encoding: "utf-8" })
		const cryptoKey = await importPrivateKey(privateKeyPem)
		const sig = await crypto.webcrypto.subtle.sign({ name: SIG_ALGO, hash: DIGEST }, cryptoKey, fileData)
		fs.writeFileSync(sigOutPath, Buffer.from(sig), null)
	} catch (e) {
		console.log(`Error signing ${fileToSign}:`, e.message, e.stack)
		process.exit(1)
	}
	return sigOutPath
}
