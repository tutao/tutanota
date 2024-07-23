/**
 * Utility to sign the desktop installers of the app for all platforms.
 * The following environment variables are useful when developing:
 * * DEBUG_SIGN - path to a folder containing either a self-signed certificate for signing the desktop client (test.p12) or a private key in PEM format (test.key)
 * More Info in Wiki -> Desktop Updater Test & Development
 */
import fs from "node:fs"
import path from "node:path"
import { fileExists } from "./buildUtils.js"
import { sign } from "./installerSigner.js"

console.log("Sign Desktop Clients")

signDesktopClients()
	.then(() => process.exit())
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})

if (process.env.DEBUG_SIGN) {
	const certPath = path.join(process.env.DEBUG_SIGN, "test.p12")
	const keyPath = path.join(process.env.DEBUG_SIGN, "test.key")
	if (!fs.existsSync(certPath) && !fs.existsSync(keyPath)) {
		console.error("ERROR:\nPlease make sure your DEBUG_SIGN test certificate authority is set up properly!\n\n")
		process.exit(1)
	}
}

async function signDesktopClients() {
	const MAC_ZIP_SIGNATURE_FILE = "mac-sig-zip.bin"
	const MAC_DMG_SIGNATURE_FILE = "mac-sig-dmg.bin"
	const WIN_SIGNATURE_FILE = "win-sig.bin"
	const LINUX_SIGNATURE_FILE = "linux-sig.bin"

	const MAC_YML_FILE = "latest-mac.yml"
	const WIN_YML_FILE = "latest.yml"
	const LINUX_YML_FILE = "latest-linux.yml"

	let filesSigned = 0
	const signIfExists = async (fileName, sigName, ymlName) => {
		if (await fileExists(fileName)) {
			console.log("signing", fileName)
			await sign(fileName, sigName, ymlName)
			filesSigned = filesSigned + 1
		}
	}

	await signIfExists("./build/desktop/tutanota-desktop-mac.zip", MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
	await signIfExists("./build/desktop/tutanota-desktop-mac.dmg", MAC_DMG_SIGNATURE_FILE, null)
	await signIfExists("./build/desktop/tutanota-desktop-win.exe", WIN_SIGNATURE_FILE, WIN_YML_FILE)
	await signIfExists("./build/desktop/tutanota-desktop-linux.AppImage", LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

	await signIfExists("./build/desktop-test/tutanota-desktop-test-mac.zip", MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
	await signIfExists("./build/desktop-test/tutanota-desktop-test-mac.dmg", MAC_DMG_SIGNATURE_FILE, null)
	await signIfExists("./build/desktop-test/tutanota-desktop-test-win.exe", WIN_SIGNATURE_FILE, WIN_YML_FILE)
	await signIfExists("./build/desktop-test/tutanota-desktop-test-linux.AppImage", LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

	await signIfExists("./build/desktop-snapshot/tutanota-desktop-snapshot-mac.zip", MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
	await signIfExists("./build/desktop-snapshot/tutanota-desktop-snapshot-mac.dmg", MAC_DMG_SIGNATURE_FILE, null)
	await signIfExists("./build/desktop-snapshot/tutanota-desktop-snapshot-win.exe", WIN_SIGNATURE_FILE, WIN_YML_FILE)
	await signIfExists("./build/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage", LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

	if (filesSigned === 0) {
		console.log("Error: no files were signed!")
		process.exit(1)
	} else {
		console.log(`Signed ${filesSigned} files!`)
	}
}
