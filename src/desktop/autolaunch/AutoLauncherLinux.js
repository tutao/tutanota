// @flow
import {promisify} from "util"
import fs from "fs-extra"
import {app} from "electron"
import path from "path"

const linuxDesktopPath = path.join(app.getPath('home'), `.config/autostart/${app.name}.desktop`)
const autoStartPath = process.env.APPIMAGE ? process.env.APPIMAGE : process.execPath

export function isAutoLaunchEnabled(): Promise<boolean> {
	return promisify(fs.access)(
		linuxDesktopPath,
		fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK
	).then(() => true).catch(() => false)
}

export function enableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (enabled) return
		const desktopEntry = `[Desktop Entry]
	Type=Application
	Version=${app.getVersion()}
	Name=${app.name}
	Comment=${app.name} startup script
	Exec=${autoStartPath} -a
	StartupNotify=false
	Terminal=false`
		fs.ensureDirSync(path.dirname(linuxDesktopPath))
		fs.writeFileSync(linuxDesktopPath, desktopEntry, {encoding: 'utf-8'})
	})
}

export function disableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled()
		.then(enabled => enabled ? promisify(fs.unlink)(linuxDesktopPath) : Promise.resolve())
		.catch(e => {
			// don't throw if file not found
			if (e.code !== 'ENOENT') e.throw()
		})
}