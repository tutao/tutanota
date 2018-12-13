const options = require('commander')
const spawnSync = require('child_process').spawnSync

options
	.usage('[options] [test|prod|URL] ')
	.arguments('<targetUrl>')
	.option('-b, --buildtype <type>', 'gradle build type', /^(debugDist|debug|release|releaseTest)$/i, 'release')
	.option('-w --webclient <client>', 'choose web client build', /^(build|dist)$/i, 'dist')
	.parse(process.argv)
options.host = options.args[0] || 'prod'

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

let {error} = spawnSync('node', [options.webclient, `${options.host}`], {
	stdio: [null, process.stdout, process.stderr]
})

if (error) {
	console.log("Error during ", options.webclient, error)
	process.exit(1)
}

console.log("Starting", options.buildtype)

error = spawnSync('./gradlew', [`assemble${options.buildtype}`], {
	cwd: './app-android/',
	stdio: [null, process.stdout, process.stderr]
}).error

if (error) {
	console.log("Gradle Error:", error)
	process.exit(1)
}


const getEnv = (name) => {
	if (!(name in process.env)) {
		throw new Error(`${name} is not set`)
	}
	return process.env[name]
}


spawnSync("rm", ["-r", "build/app-android"])
spawnSync("mkdir", ["-p", "build/app-android"])
const version = require('./package.json').version
const outPath = `./build/app-android/tutanota-${version}-${options.buildtype}.apk`

if (options.buildtype === 'release' || options.buildtype === 'releaseTest') {
	const keyAlias = getEnv('APK_SIGN_ALIAS')
	const storePass = getEnv('APK_SIGN_STORE_PASS')
	const keyPass = getEnv('APK_SIGN_KEY_PASS')
	const keyStore = getEnv('APK_SIGN_STORE')
	const androidHome = getEnv('ANDROID_HOME')

	console.log("starting signing")
	// see https://developer.android.com/studio/publish/app-signing#signing-manually

	// jarsigner must be run before zipalign
	error = spawnSync('jarsigner', [
		'-verbose',
		'-keystore', keyStore,
		'-storepass', storePass,
		'-keypass', keyPass,
		'./app-android/' + apkPath,
		keyAlias
	], {
		stdio: [null, null, process.stderr]
	}).error

	if (error) {
		console.log('Signing Error:', error)
		process.exit(1)
	}

	console.log("started zipalign")

	// Android requires all resources to be aligned for mmap. Must be done.
	error = spawnSync(`${androidHome}/build-tools/27.0.3/zipalign`, [
		'4',
		'app-android/' + apkPath,
		outPath
	], {
		stdio: [null, process.stdout, process.stderr]
	}).error

	if (error) {
		console.log("Zipalign Error", error)
		process.exit(1)
	}
} else {
	error = spawnSync('mv', ['app-android/' + apkPath, outPath]).error

	if (error) {
		console.log("mv Error", error.output.toString(), error)
		process.exit(1)
	}
}

console.log(`APK was moved to\n${outPath}`)

