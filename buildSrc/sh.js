import { spawn } from "node:child_process"
import { $ } from "zx"

/**
 * A little helper that runs the command. Unlike zx stdio is set to "inherit" and we don't pipe output.
 */
export async function sh(pieces, ...args) {
	// If you need this function, but you can't use zx copy it from here
	// https://github.com/google/zx/blob/a7417430013445592bcd1b512e1f3080a87fdade/src/guards.mjs
	// (or more up-to-date version)
	const fullCommand = formatCommand(pieces, args)
	console.log(`$ ${fullCommand}`)
	const child = spawn(fullCommand, { shell: true, stdio: "inherit" })
	return new Promise((resolve, reject) => {
		child.on("close", (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error("Process failed with " + code))
			}
		})
		child.on("error", (error) => {
			reject(`Failed to spawn child: ${error}`)
		})
	})
}

function formatCommand(pieces, args) {
	// Pieces are parts between arguments
	// So if you have incvcation sh`command ${myArg} something ${myArg2}`
	// then pieces will be ["command ", " something "]
	// and the args will be [(valueOfMyArg1), (valueOfMyArg2)]
	// There are always args.length + 1 pieces (if command ends with argument then the last piece is an empty string).
	let fullCommand = pieces[0]
	for (let i = 0; i < args.length; i++) {
		fullCommand += $.quote(args[i]) + pieces[i + 1]
	}
	return fullCommand
}
