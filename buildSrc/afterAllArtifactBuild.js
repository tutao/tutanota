const signer = require('./installerSigner.js')

/**
 *  gets executed after all installers are ready but before latest.yml gets created
 * @param args
 */

const MAC_EXTENSION = process.platform === "darwin"
	? "dmg"
	: "zip"

function hook(args) {
	console.log("AfterAllArtifactBuild hook...")

	const exePath = args.artifactPaths.find(path => path.endsWith('.exe'))
	const appImagePath = args.artifactPaths.find(path => path.endsWith('AppImage'))
	const dmgPath = args.artifactPaths.find(path => path.endsWith(MAC_EXTENSION))

	console.log('artifacts:')

	if (appImagePath !== undefined && process.env.LINUX_CSC_LINK) {
		console.log(appImagePath)
		signer(appImagePath, 'linux')
	}

	if (exePath !== undefined && process.env.WIN_CSC_LINK) {
		console.log(exePath)
		signer(exePath, 'win')
	}

	if (dmgPath !== undefined && process.env.MAC_CSC_LINK) {
		console.log(dmgPath)
		signer(dmgPath, 'mac')
	}
}

module.exports = hook
