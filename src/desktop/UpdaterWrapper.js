//@flow
/**
 * This is a little wrapper around electron-updater to decouple logic.
 */
import {noOp} from "../api/common/utils/Utils"
import path from "path"
import fs from "fs"
import {app} from "electron"

export interface UpdaterWrapper {
	updatesEnabledInBuild(): boolean,

	electronUpdater: Promise<AutoUpdater>,
}

export class UpdaterWrapperImpl implements UpdaterWrapper {
	updatesEnabledInBuild(): boolean {
		try {
			const basepath = process.platform === "darwin"
				? path.join(path.dirname(app.getPath('exe')), "..")
				: path.dirname(app.getPath('exe'))
			const appUpdateYmlPath = path.join(basepath, 'resources', 'app-update.yml')
			fs.accessSync(appUpdateYmlPath, fs.constants.R_OK)
			return true
		} catch (e) {
			return false
		}
	}

	electronUpdater: Promise<AutoUpdater> = env.dist
		? import("electron-updater").then((m) => m.autoUpdater)
		: Promise.resolve(fakeAutoUpdater)
}

const fakeAutoUpdater: $Shape<AutoUpdater> = {
	on() {
		return this
	},
	once() {
		return this
	},
	removeListener() {
		return this
	},
	downloadUpdate() {
		return Promise.resolve([])
	},
	quitAndInstall() {},
	checkForUpdates() {
		// Never resolved, return type is too complex
		return new Promise(noOp)
	},
}
