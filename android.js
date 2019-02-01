const options = require('commander')
const {execFileSync} = require('child_process')

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
	.option('-w --webclient <client>', 'choose web client build', /^(build|dist)$/i, 'dist')
	.parse(process.argv)
options.host = options.args[0] || 'prod'

const BUILD_TOOLS_V = "27.0.3"
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

execFileSync('node', [options.webclient, `${options.host}`], {
	stdio: [null, process.stdout, process.stderr]
})


try {
	execFileSync("rm", ["-r", "build/app-android"], {stdio: 'ignore'})
} catch (e) {
	// Ignoring the error if the folder is not there
}

log("Starting", options.buildtype)

execFileSync('./gradlew', [`assemble${options.buildtype}`], {
	cwd: './app-android/',
})

const getEnv = (name) => {
	if (!(name in process.env)) {
		throw new Error(`${name} is not set`)
	}
	return process.env[name]
}


execFileSync("mkdir", ["-p", "build/app-android"])
const version = require('./package.json').version
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
	execFileSync('jarsigner', [
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
	execFileSync(`${androidHome}/build-tools/${BUILD_TOOLS_V}/zipalign`, [
		'4',
		'app-android/' + apkPath,
		outPath
	])
} else {
	execFileSync('mv', ['app-android/' + apkPath, outPath])
}

log(`APK was moved to\n${outPath}`)

