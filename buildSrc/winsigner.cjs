const Promise = require('bluebird')
const path = require('path')
const fs = Promise.promisifyAll(require("fs-extra"))
const spawn = require('child_process').spawn

function signer(args) {
	const certificateFile = process.env["WIN_CSC_FILE"]
	const hsmPin = process.env["HSM_USER_PIN"]
	const extension = "." + args.path.split(".").pop()
	const unsignedFileName = args.path.replace(extension, "-unsigned" + extension)
	const command = "/usr/bin/osslsigncode"

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

	if (!certificateFile) {
		console.error("ERROR: " + args.path.split(path.sep).pop() + "\" not signed! The NSIS installer may not work.")
		console.log("\t• set WIN_CSC_FILE env var")
		return Promise.reject(new Error(args.path))
	}

	if (!hsmPin) {
		console.log("ERROR: " + args.path.split(path.sep).pop() + "\" not signed! The NSIS installer may not work.")
		console.log("\t• set  HSM_USER_PIN env var")
		return Promise.reject(new Error(args.path))
	}

	if (!fs.existsSync(command)) {
		console.log("ERROR: " + args.path.split(path.sep).pop() + "\" not signed! The NSIS installer may not work.")
		console.log("\t• install osslsigncode")
		return Promise.reject(new Error(args.path))
	}

	const commandArguments = [
		"-in", unsignedFileName,
		"-out", args.path,
		"-pkcs11engine", "/usr/lib/x86_64-linux-gnu/engines-1.1/pkcs11.so",
		"-pkcs11module", "/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so",
		"-certs", certificateFile,
		"-key", "10",
		"-pass", hsmPin,
		"-h", args.hash ? args.hash : "sha256",
		"-t", "http://timestamp.comodoca.com",
		"-n", "tutanota-desktop"
	]

	fs.renameSync(args.path, unsignedFileName)
	console.log(`spawning "${command}" -h ${args.hash}`)
	// only for testing, would print certificate password to logs, otherwise
	//console.log(`spawning "${command} ${commandArguments.join(" ")}"`)
	let child = spawn(command, commandArguments, {
		detached: false,
		stdio: ['ignore', 'inherit', 'inherit'],
	})

	return Promise.fromCallback(cb => {
		child.on('close', (exitCode) => {
			if (exitCode !== 0) {
				cb(exitCode)
			} else {
				fs.removeSync(unsignedFileName)
				cb(null, args.path)
			}
		})
	})
}

module.exports = signer
