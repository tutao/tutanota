import options from "commander"

import {execFileSync} from "child_process"
import {prepareFiles} from "./buildSrc/prepareMobileBuild.js"
import fs from "fs"


/**
 * Besides options below this script may require signing parameters passed as environment variables:
 * 'APK_SIGN_ALIAS'
 * 'APK_SIGN_STORE_PASS'
 * 'APK_SIGN_KEY_PASS'
 * 'APK_SIGN_STORE'
 * 'ANDROID_HOME'
 */

options
	.usage('[options] [test|prod|URL] ')
	.arguments('<targetUrl>')
	.option('-b, --buildtype <type>', 'gradle build type', /^(debugDist|debug|release|releaseTest)$/i, 'release')
	.option('-w --webclient <client>', 'choose web client build', /^(make|dist)$/i, 'dist')
	.parse(process.argv)
options.host = options.args[0] || 'prod'

const BUILD_TOOLS_V = "28.0.3"
const log = (...messages) => console.log("\nBUILD: ", ...messages, "\n")

log(`Starting build with buildtype: ${options.buildtype}, webclient: ${options.webclient}, host: ${options.host}`)

let apkPath

switch (options.buildtype) {
	case 'debugDist':
		apkPath = 'app/build/outputs/apk/debugDist/app-debugDist.apk'
		break;
	case 'debug':
		apkPath = 'app/build/outputs/apk/debug/app-debug.apk'
		break;
	case 'releaseTest':
		apkPath = 'app/build/outputs/apk/releaseTest/app-releaseTest-unsigned.apk'
		break
	default:
		apkPath = 'app/build/outputs/apk/release/app-release-unsigned.apk'
}

exec('node', [options.webclient, `${options.host}`], {
	stdio: [null, process.stdout, process.stderr]
})

// execFileSync('node', ["buildSrc/prepareMobileBuild.js", options.webclient], {
// 	stdio: [null, process.stdout, process.stderr],
// })

prepareFiles(options.webclient)

try {
	exec("rm", ["-r", "build/app-android"], {stdio: 'ignore'})
} catch (e) {
	// Ignoring the error if the folder is not there
}

log("Starting", options.buildtype)

exec('./gradlew', [`assemble${options.buildtype}`], {
	cwd: './app-android/',
})

const getEnv = (name) => {
	if (!(name in process.env)) {
		throw new Error(`${name} is not set`)
	}
	return process.env[name]
}

signAndroidApp()
	.catch(e => {
		console.error("Error:", e)
		process.exit(1)
	})

async function signAndroidApp() {
	const {version} = JSON.parse(await fs.promises.readFile("package.json", "utf8"))
	exec("mkdir", ["-p", "build/app-android"])
	const outPath = `./build/app-android/tutanota-${version}-${options.buildtype}.apk`

	if (options.buildtype === 'release' || options.buildtype === 'releaseTest') {
		const keyAlias = getEnv('APK_SIGN_ALIAS')
		const storePass = getEnv('APK_SIGN_STORE_PASS')
		const keyPass = getEnv('APK_SIGN_KEY_PASS')
		const keyStore = getEnv('APK_SIGN_STORE')
		const androidHome = getEnv('ANDROID_HOME')

		log("starting signing")
		// see https://developer.android.com/studio/publish/app-signing#signing-manually

		// jarsigner must be run before zipalign
		exec('/opt/jdk1.8.0_112/bin/jarsigner', [
			'-verbose',
			'-strict',
			'-keystore', keyStore,
			'-storepass', storePass,
			'-keypass', keyPass,
			'./app-android/' + apkPath,
			keyAlias
		])

		log("started zipalign")

		// Android requires all resources to be aligned for mmap. Must be done.
		exec(`${androidHome}/build-tools/${BUILD_TOOLS_V}/zipalign`, [
			'4',
			'app-android/' + apkPath,
			outPath
		])
	} else {
		exec('mv', ['app-android/' + apkPath, outPath])
	}
	log(`APK was moved to\n${outPath}`)
}

function exec(...args) {
	try {
		return execFileSync(...args)
	} catch (e) {
		throw {
			code: e.status,
			stdout: new Buffer(e.stdout).toString(),
			stderr: new Buffer(e.stderr).toString()
		}
	}
}
