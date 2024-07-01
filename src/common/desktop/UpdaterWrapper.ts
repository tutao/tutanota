/**
 * This is a little wrapper around electron-updater to decouple logic.
 */
import { downcast, noOp } from "@tutao/tutanota-utils"
import path from "node:path"
import fs from "node:fs"
import { app } from "electron"
import electronUpdater, { AppUpdater } from "electron-updater"

const { autoUpdater } = electronUpdater

export class UpdaterWrapper {
	updatesEnabledInBuild(): boolean {
		try {
			const basepath = process.platform === "darwin" ? path.join(path.dirname(app.getPath("exe")), "..") : path.dirname(app.getPath("exe"))
			const appUpdateYmlPath = path.join(basepath, "resources", "app-update.yml")
			fs.accessSync(appUpdateYmlPath, fs.constants.R_OK)
			return true
		} catch (e) {
			return false
		}
	}

	electronUpdater: AppUpdater = env.dist ? autoUpdater : downcast<AppUpdater>(fakeAutoUpdater)
}

const fakeAutoUpdater = new (class {
	on(): this {
		return this
	}

	once(): this {
		return this
	}

	removeListener(): this {
		return this
	}

	downloadUpdate() {
		return Promise.resolve([])
	}

	quitAndInstall() {}

	checkForUpdates() {
		// Never resolved, return type is too complex
		return new Promise(noOp)
	}
})()
