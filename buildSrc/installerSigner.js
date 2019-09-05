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
 * https://mail.tutanota.com/desktop/tutanota-desktop-win-sig.bin (for Windows)
 * https://mail.tutanota.com/desktop/tutanota-desktop-mac-sig.bin (for Mac)
 * https://mail.tutanota.com/desktop/tutanota-desktop-linux-sig.bin (for Linux)
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

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const path = require('path')
const spawnSync = require('child_process').spawnSync
const jsyaml = require('js-yaml')

/**
 * Creates a signature on the given application file, writes it to signatureFileName and adds the signature to the yaml file.
 * Requires environment variable HSM_USER_PIN to be set to the HSM user pin.
 * @param filePath The application file to sign. Needs to be the full path to the file.
 * @param signatureFileName The signature will be written to that file. Must not contain any path.
 * @param ymlFileName This yaml file will be adapted to include the signature. Must not contain any path.
 */
function signer(filePath, signatureFileName, ymlFileName) {
	console.log("Signing", path.basename(filePath), '...')
	const dir = path.dirname(filePath)
	const sigOutPath = path.join(dir, signatureFileName)
	const result = spawnSync("/usr/bin/pkcs11-tool", [
		"-s",
		"-m", "SHA512-RSA-PKCS",
		"--id", "10",
		"--pin", "env:HSM_USER_PIN",
		"-i", path.basename(filePath),
		"-o", signatureFileName
	], {
		cwd: dir,
		stdio: [process.stdin, process.stdout, process.stderr]
	})
	if (result.status !== 0) {
		throw new Error("error invoking process" + JSON.stringify(result))
	}

	console.log(`attaching signature to yml...`)
	const ymlPath = path.join(dir, ymlFileName)
	let yml = jsyaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'))
	const signatureContent = fs.readFileSync(sigOutPath)
	yml.signature = signatureContent.toString('base64')
	fs.writeFileSync(ymlPath, jsyaml.safeDump(yml), 'utf8')
}

module.exports = signer
