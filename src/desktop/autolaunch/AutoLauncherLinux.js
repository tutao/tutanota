// @flow
import {promisify} from "util"
import fs from "fs"
import {app} from "electron"
import path from "path"

const linuxDesktopPath = path.join(app.getPath('home'), `.config/autostart/${app.getName()}.desktop`)
const autoStartPath = process.env.APPIMAGE ? process.env.APPIMAGE : process.execPath

export function isAutoLaunchEnabled(): Promise<boolean> {
	return promisify(fs.exists)(linuxDesktopPath)
		.catch(e => {
			console.error("could not check .desktop files:", e)
			return false
		})
}

export function enableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (enabled) {
			return
		}
		const desktopEntry = `[Desktop Entry]
	Type=Application
	Version=${app.getVersion()}
	Name=${app.getName()}
	Comment=${app.getName()} startup script
	Exec=${autoStartPath} -a
	StartupNotify=false
	Terminal=false`

		fs.writeFileSync(linuxDesktopPath, desktopEntry, {encoding: 'utf-8'})
	})
}

export function disableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (!enabled) {
			return
		}
		return promisify(fs.unlink)(linuxDesktopPath)
	})
}