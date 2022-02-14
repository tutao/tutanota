/**
 * Utility to sign the desktop installers of the app for all platforms.
 * The following environment variables are useful when developing:
 * DEBUG_SIGN - path to a folder containing a self-signed certificate for signing the desktop client. More Info in Wiki -> Desktop Updater Test & Development
 */
import fs from "fs-extra"
import path from "path"
import options from "commander"

signDesktopClients()
	.then(process.exit())
	.catch(process.exit(1))


if (process.env.DEBUG_SIGN && !fs.existsSync(path.join(process.env.DEBUG_SIGN, "test.p12"))) {
	options.outputHelp(a => "ERROR:\nPlease make sure your DEBUG_SIGN test certificate authority is set up properly!\n\n" + a)
	process.exit(1)
}

async function signDesktopClients() {
	const MAC_ZIP_SIGNATURE_FILE = 'mac-sig-zip.bin'
	const MAC_DMG_SIGNATURE_FILE = 'mac-sig-dmg.bin'
	const WIN_SIGNATURE_FILE = 'win-sig.bin'
	const LINUX_SIGNATURE_FILE = 'linux-sig.bin'

	const MAC_YML_FILE = 'latest-mac.yml'
	const WIN_YML_FILE = 'latest.yml'
	const LINUX_YML_FILE = 'latest-linux.yml'


	if (doSignDesktopClients()) {
		// We import `sign` asynchronously because it uses node-forge, which is unavailable during the f-droid build and causes it to fail
		// For some reason we call signDesktopClients always in the build process.
		const {sign} = await import("./installerSigner.js")
		const signIfExists = async (fileName, sigName, ymlName) => {
			if (await fileExists(fileName)) {
				console.log("signing", fileName)
				sign(fileName, sigName, ymlName)
			}
		}

		await signIfExists('./build/desktop/tutanota-desktop-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop/tutanota-desktop-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop/tutanota-desktop-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop/tutanota-desktop-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

		await signIfExists('./build/desktop-test/tutanota-desktop-test-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)
	}
}

async function fileExists(filePath) {
	return fs.stat(filePath)
			 .then(stats => stats.isFile())
			 .catch(() => false)
}