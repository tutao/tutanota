// @flow
import {promisify} from "util"
import fs from "fs-extra"
import {app, dialog} from "electron"
import path from "path"
import {lang} from "../../misc/LanguageViewModel"
import {exec} from "child_process"

const DATA_HOME = process.env.XDG_DATA_HOME || path.join(app.getPath('home'), ".local/share")
const CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(app.getPath('home'), ".config")

const executablePath = process.execPath
const packagePath = process.env.APPIMAGE ? process.env.APPIMAGE : process.execPath
const autoLaunchPath = path.join(CONFIG_HOME, `autostart/${app.name}.desktop`)
const desktopFilePath = path.join(DATA_HOME, `applications/${app.name}.desktop`)
const iconTargetPath64 = path.join(DATA_HOME, `icons/hicolor/64x64/apps/${app.name}.png`)
const iconTargetPath512 = path.join(DATA_HOME, `icons/hicolor/512x512/apps/${app.name}.png`)
const iconSourcePath64 = path.join(path.dirname(executablePath), `resources/icons/logo-solo-red-small.png`)
const iconSourcePath512 = path.join(path.dirname(executablePath), `resources/icons/logo-solo-red.png`)
const nointegrationpath = path.join(CONFIG_HOME, 'tuta_integration/no_integration')

fs.access(iconSourcePath512, fs.constants.F_OK)
  .catch(() => console.error("icon logo-solo-red.png not found, has the file name changed?"))

export function isAutoLaunchEnabled(): Promise<boolean> {
	return checkFileIsThere(autoLaunchPath)
}

export function isIntegrated(): Promise<boolean> {
	return checkFileIsThere(desktopFilePath)
}

function checkFileIsThere(pathToCheck: string): Promise<boolean> {
	return fs.access(
		pathToCheck,
		fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK
	).then(() => true).catch(() => false)
}

export function enableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (enabled) return
		const autoLaunchDesktopEntry = `[Desktop Entry]
	Type=Application
	Version=${app.getVersion()}
	Name=${app.name}
	Comment=${app.name} startup script
	Exec=${packagePath} -a
	StartupNotify=false
	Terminal=false`
		fs.ensureDirSync(path.dirname(autoLaunchPath))
		fs.writeFileSync(autoLaunchPath, autoLaunchDesktopEntry, {encoding: 'utf-8'})
	})
}

export function disableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled()
		.then(enabled => enabled ? promisify(fs.unlink)(autoLaunchPath) : Promise.resolve())
		.catch(e => {
			// don't throw if file not found
			if (e.code !== 'ENOENT') e.throw()
		})
}

export function runIntegration() {
	if (executablePath.includes("node_modules/electron/dist/electron")) return;
	console.log(`checking for ${desktopFilePath} ...`)
	isIntegrated().then(integrated => {
		if (integrated) {
			console.log(`desktop file exists, checking version...`)
			const desktopEntryVersion = getDesktopEntryVersion()
			if (desktopEntryVersion !== app.getVersion()) {
				console.log("version mismatch, reintegrating...")
				integrate()
			}
		} else {
			console.log(`${desktopFilePath} does not exist, checking for permission to ask for permission...`)
			checkFileIsThere(nointegrationpath).then(isThere => {
				if (isThere) {
					const forbiddenPaths = fs.readFileSync(nointegrationpath, {encoding: 'utf8', flag: 'r'})
					                         .trim()
					                         .split('\n')
					if (!forbiddenPaths.includes(packagePath)) {
						askPermission()
					}
				} else {
					askPermission()
				}
			})
		}
	})
}

/**
 * returns the version number from the desktop file
 * @returns {*}
 */
function getDesktopEntryVersion(): string {
	const versionLine = fs
		.readFileSync(desktopFilePath, 'utf8')
		.split('\n')
		.find(s => s.includes("X-Tutanota-Version")) || "=0.0.0"
	return versionLine.split("=")[1]
}

export function integrate(): void {
	const prefix = app.name.includes("test") ? "test " : ""
	try {
		createDesktopEntry(prefix)
	} catch (e) {
		// no errors we can do anything about here
		// "Desktop Integration" Setting will reset to "deactivated"
		console.warn("could not integrate: ", e.message)
	}
	try {
		copyIcons()
	} catch (e) {
		console.warn("could not copy icons: ", e.message)
	}

}

export function unintegrate(): void {
	try {
		fs.unlinkSync(desktopFilePath)
	} catch (e) {
		// there are no errors we could or should care about here
		console.warn("could not unintegrate: ", e.message)
	}
	try {
		fs.unlinkSync(iconTargetPath64)
	} catch (e) {
		// there are no errors we could or should care about here
		console.warn("could not delete icon: ", e.message)
	}
	try {
		fs.unlinkSync(iconTargetPath512)
	} catch (e) {
		// there are no errors we could or should care about here
		console.warn("could not delete icon: ", e.message)
	}
}

function createDesktopEntry(prefix: string): void {
	const desktopEntry = `[Desktop Entry]
Name=${prefix}Tutanota Desktop
Comment=The desktop client for Tutanota, the secure e-mail service.
Exec="${packagePath}" %U
Terminal=false
Type=Application
Icon=${app.name}.png
StartupWMClass=de.tutao.${app.name}
MimeType=x-scheme-handler/mailto;
Categories=Network;
X-Tutanota-Version=${app.getVersion()}
TryExec=${packagePath}`
	fs.ensureDirSync(path.dirname(desktopFilePath))
	fs.writeFileSync(desktopFilePath, desktopEntry, {encoding: 'utf-8'})
}

function copyIcons(): void {
	console.log("copy icons:", iconSourcePath64, "->", iconTargetPath64)
	console.log("copy icons:", iconSourcePath512, "->", iconTargetPath512)
	fs.copyFileSync(iconSourcePath64, iconTargetPath64)
	fs.copyFileSync(iconSourcePath512, iconTargetPath512)
	// hopefully refresh icon cache (update last modified timestamp)
	exec(`touch "${path.join(app.getPath('home'), ".local/share/icons/hicolor")}"`)
}

/**
 * asks the user for permission to integrate.
 * also gives the option to opt-out indefinitely, which
 * records the current path to the appImage in
 * ~/.config/tuta_integration/no_integration
 */
function askPermission() {
	dialog.showMessageBox(null, {
		title: lang.get('desktopIntegration_label'),
		buttons: [lang.get('no_label'), lang.get('yes_label')],
		defaultId: 1,
		message: lang.get('desktopIntegration_msg'),
		checkboxLabel: lang.get("doNotAskAgain_label"),
		checkboxChecked: false,
		type: 'question'
	}).then(({response, checkboxChecked}) => {
		if (checkboxChecked) {
			console.log("updating no_integration blacklist...")
			fs.ensureDirSync(path.dirname(nointegrationpath))
			fs.writeFileSync(nointegrationpath, packagePath + '\n', {encoding: 'utf-8', flag: 'a'})
		}
		if (response === 1) { // clicked yes
			integrate()
		}
	})
}