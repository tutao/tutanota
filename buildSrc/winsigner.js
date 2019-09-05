const Promise = require('bluebird')
const chalk = require('chalk')
const path = require('path')
const fs = Promise.promisifyAll(require("fs-extra"))
const spawn = require('child_process').spawn

function signer(args) {
	const certificateFile = process.env["WIN_CSC_LINK"]
	const hsmPin = process.env["HSM_USER_PIN"]
	const extension = "." + args.path.split(".").pop()
	const unsignedFileName = args.path.replace(extension, "-unsigned" + extension)
	const command = "/opt/osslsigncode/osslsigncode"

	//  Timestamping:
	//  1. The client application creates a hashed value of the data to the timestamp server.
	// 	2. the timestamp server combines the hash and other information, including the authoritative time.
	// 	    The result is digitally signed with the TSA’s private key, creating a timestamp token which is sent back to the client.
	// 	    The timestamp token contains the information the client application will need to verify the timestamp later.
	// 	3. The timestamp token is received by the client application and recorded within the document or code signature.
	//  other timestamping services:
	//  http://timestamp.globalsign.com/scripts/timstamp.dll
	//  http://timestamp.comodoca.com/authenticode
	//  http://www.startssl.com/timestamp

	const commandArguments = [
		"-in", unsignedFileName,
		"-out", args.path,
		"-pkcs11engine", "/usr/lib/x86_64-linux-gnu/openssl-1.0.2/engines/pkcs11.so",
		"-pkcs11module", "/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so",
		"-certs", certificateFile,
		"-key", "10",
		"-pass", "${HSM_USER_PIN}", //hsmPin,
		"-h", args.hash ? args.hash : "sha256",
		"-t", "http://timestamp.comodoca.com/authenticode",
		"-n", "tutanota-desktop"
	]

	if (!(certificateFile && hsmPin && fs.existsSync(command))) {
		console.log(`  ${chalk.red("• ERROR: ")}"` + args.path.split(path.sep).pop() + "\" not signed! The NSIS installer may not work.")
		console.log("\t• install osslsigncode")
		console.log("\t• set WIN_CSC_LINK and HSM_USER_PIN env vars")
		return Promise.resolve(args.path)
	}
	fs.renameSync(args.path, unsignedFileName)
	console.log(`spawning "${command}"`)
	// only for testing, would print certificate password to logs, otherwise
	//console.log(`spawning "${command} ${commandArguments.join(" ")}"`)
	let child = spawn(command, commandArguments, {
		detached: false,
		stdio: ['ignore', 'inherit', 'inherit'],
	})

	return Promise.fromCallback(cb => {
		child.on('close', (e) => {
			if (e !== 0) {
				cb(e)
			} else {
				fs.removeSync(unsignedFileName)
				cb(null, args.path)
			}
		})
	})
}

module.exports = signer
