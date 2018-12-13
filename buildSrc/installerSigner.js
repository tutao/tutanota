/**
 * Utility to codesign the finished Installers.
 * This enables the App to verify the authenticity of the Updates, and
 * enables the User to verify the authenticity of their manually downloaded
 * Installer with the openssl utility.
 *
 *  Should the location of the public key change, we can leave the URL to
 *  the new location in place of the key
 *  (in the format :NEWURL: https://new.com/pub.pem :NEWURL:, to protect against format changes
 *  we don't control).
 *  the verifier will follow the links until it gets a response body
 *  that starts with '-----BEGIN PUBLIC KEY-----'
 *  or throw an error if it can't find the next step
 *
 *  the Installer signature is provided as a separate file (here: signature.bin) to the User
 *  to verify the initial download via
 *
 *      # get public key from github
 *      wget https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem
 *          or
 *      curl https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem > tutao-pub.pem
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

const forge = require('node-forge')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

/**
 *
 * @param args.filePath path to the file to sign
 * @param args.privateKeyPath path to private key file in PEM format
 * @param args.passPhrase pass phrase to the private key
 *
 * @return object with paths to the generated files
 */
function signer(filePath, target) {
	console.log("Signing", path.basename(filePath), '...')
	if (!['win', 'linux', 'mac'].includes(target)) {
		throw new Error('invalid signing target: ' + target)
	}
	const dir = path.dirname(filePath)
	let filename = path.basename(filePath).split('.')
	filename.splice(-1, 1)
	filename = filename.join('.')
	try {
		const fileData = fs.readFileSync(filePath) //binary format
		const sigOutPath = path.join(dir, filename + '-sig.bin')
		const lnk = process.env[target.toUpperCase() + "_CSC_LINK"]
		const pass = process.env[target.toUpperCase() + "_CSC_KEY_PASSWORD"]
		const privateKey = getPrivateKey(lnk, pass)
		const md = forge.md.sha512.create()
		md.update(fileData.toString('binary'))
		const sig = Buffer.from(privateKey.sign(md), 'binary')
		fs.writeFileSync(sigOutPath, sig, null)
	} catch (e) {
		console.log('Error:', e.message)
	}

}

function getPrivateKey(lnk, pass) {
	if (!lnk || !pass) {
		throw new Error("can't sign client, missing [TARGET]_CSC_LINK or [TARGET]_CSC_KEY_PASSWORD env vars")
	}
	const p12b64 = fs.readFileSync(lnk).toString('base64')
	const p12Der = forge.util.decode64(p12b64)
	const p12Asn1 = forge.asn1.fromDer(p12Der)
	const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pass)
	/**
	 * localKeyId was found by exporting the certificate via
	 *      openssl pkcs12 -in comodo-codesign.pfx -clcerts -nokeys -out tutao-cert.pem
	 *  and inspecting the resulting file.
	 *  could use friendlyName as a key as well:
	 *      p12.getBags({friendlyName: 'yada yada'})["friendlyName"]
	 *  but that one contains funny characters.
	 *  TODO: revise on cert renewal
	 */
	const bag = p12.getBags({localKeyIdHex: '6FEFEE4A93634B95DD82977143D69665CA9180D2'})["localKeyId"]
	return bag[0].key
}

module.exports = signer