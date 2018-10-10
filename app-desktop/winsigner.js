const Promise = require('bluebird')
const fs = Promise.promisifyAll(require("fs-extra"))
const spawn = require('child_process').spawn

function signer(args) {
	let unsignedFileName = args.path.replace(".exe", "-unsigned.exe")
	fs.renameSync(args.path, unsignedFileName)
	let command = "/usr/bin/osslsigncode"
	let commandArguments = [
		"-in", unsignedFileName, "-out", args.path, "-pkcs12", args.cscInfo.file, "-h", "sha256", "-n", "tutanota-desktop", "-pass", args.cscInfo.password
	]
	console.log(`spawning "${command}"`)
	// only for testing, would print certificate password to logs, otherwise
	//console.log(`spawning "${command} ${commandArguments.join(" ")}"`)
	let child = spawn(command, commandArguments, {
		detached: false
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