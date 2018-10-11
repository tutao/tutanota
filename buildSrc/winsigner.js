const Promise = require('bluebird')
const chalk = require('chalk')
const path = require('path')
const fs = Promise.promisifyAll(require("fs-extra"))
const spawn = require('child_process').spawn

function signer(args) {
	const certificateFile = process.env["WIN_CSC_LINK"]
	const certificatePassword = process.env["WIN_CSC_KEY_PASSWORD"]
	const extension = "." + args.path.split(".").pop()
	const unsignedFileName = args.path.replace(extension, "-unsigned" + extension)
	const command = "/usr/bin/osslsigncode"
	const commandArguments = [
		"-in", unsignedFileName,
		"-out", args.path,
		"-pkcs12", certificateFile,
		"-pass", certificatePassword,
		"-h", args.hash ? args.hash : "sha256",
		"-t", "http://timestamp.comodoca.com?td=" + args.hash ? args.hash : "sha256",
		"-n", "tutanota-desktop"
	]

	if (!(certificateFile && certificatePassword && fs.existsSync(command))) {
		console.log(`  ${chalk.yellow("• ")}"` + args.path.split(path.sep).pop() + "\" not signed:")
		console.log("\t• install osslsigncode")
		console.log("\t• set WIN_CSC_LINK and WIN_CSC_KEY_PASSWORD env vars")
		return Promise.resolve(args.path)
	}
	console.log(`  ${chalk.blue("• ")} signing "` + args.path.split(path.sep).pop() + "\"")
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