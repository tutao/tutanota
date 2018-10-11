const path = require('path')
const fs = require("fs-extra")
const spawn = require('child_process').spawn

function hook() {
	console.log("builderHook: ", arguments);

	let command = "/usr/bin/tree"
	let commandArguments = [arguments['0'].outDir]

	let child = spawn(command, commandArguments, {
		detached: false,
		stdio: ['ignore', 'inherit', 'inherit'],
	})
}

module.exports = hook