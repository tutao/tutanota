import type { DesktopNotifier } from "./DesktopNotifier"
import { NotificationResult } from "./DesktopNotifier"
import { lang } from "../misc/LanguageViewModel"
import type { DesktopConfig } from "./config/DesktopConfig"
import { assertNotNull, delay, downcast, neverNull } from "@tutao/tutanota-utils"
import { DesktopNativeCryptoFacade } from "./DesktopNativeCryptoFacade"
import type { App, NativeImage } from "electron"
import type { UpdaterWrapper } from "./UpdaterWrapper"
import type { UpdateDownloadedEvent, UpdateInfo } from "electron-updater"
import { BuildConfigKey, DesktopConfigKey } from "./config/ConfigKeys"
import { FsExports } from "./ElectronExportTypes.js"

/**
 * Wraps electron-updater for Tutanota Desktop
 *
 * To test:
 * run local server to serve updates
 * run 'node dist -l local' to build initial client
 * run 'cp ./build/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage ~/tutanota-desktop-snapshot-linux.AppImage'
 * run '~/tutanota-desktop-snapshot-linux.AppImage'
 * run 'node dist -el local' to build an update when it's needed (takes about 20s)
 *
 */

const TAG = "[ElectronUpdater]"

type LoggerFn = (_: string, ...args: any) => void
type UpdaterLogger = { debug: LoggerFn; info: LoggerFn; warn: LoggerFn; error: LoggerFn; silly: LoggerFn; verbose: LoggerFn }
/** we add the signature to the UpdateInfo when building the client */
type TutanotaUpdateInfo = UpdateInfo & { signature: string }
type IntervalID = ReturnType<typeof setTimeout>

// re-do the type as opposed to doing typeof because it doesn't work otherwise
export type IntervalSetter = (fn: (...arr: Array<unknown>) => unknown, time?: number) => IntervalID

export class ElectronUpdater {
	private updatePollInterval: IntervalID | null = null
	private checkUpdateSignature: boolean = false
	private errorCount: number = 0
	private readonly logger: UpdaterLogger
	private _updateInfo: TutanotaUpdateInfo | null = null

	readonly enableAutoUpdateListener = () => {
		this.start()
	}

	get updateInfo(): TutanotaUpdateInfo | null {
		return this._updateInfo
	}

	constructor(
		private readonly conf: DesktopConfig,
		private readonly notifier: DesktopNotifier,
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly app: App,
		private readonly icon: NativeImage,
		private readonly updater: UpdaterWrapper,
		private readonly fs: FsExports,
		private readonly scheduler: IntervalSetter = setInterval,
	) {
		this.logger = {
			info: (m: string, ...args: any) => console.log.apply(console, [TAG, "INFO:", m].concat(args)),
			warn: (m: string, ...args: any) => console.warn.apply(console, [TAG, "WARN:", m].concat(args)),
			error: (m: string, ...args: any) => console.error.apply(console, [TAG, "ERROR:", m].concat(args)),
			verbose: (m: string, ...args: any) => console.log.apply(console, [TAG, ":", m].concat(args)),
			debug: (m: string, ...args: any) => console.log.apply(console, [TAG, "DEBUG:", m].concat(args)),
			silly: (m: string, ...args: any) => console.log.apply(console, [TAG, "DEBUG:", m].concat(args)),
		}
		const autoUpdater = this.updater.electronUpdater
		autoUpdater.logger = this.logger
		// default behaviour is to just dl the update as soon as found, but we want to check the signature
		// before telling the updater to get the file.
		autoUpdater.autoDownload = false
		autoUpdater.autoInstallOnAppQuit = false
		autoUpdater
			.on("checking-for-update", () => {
				this.logger.info("checking-for-update")
			})
			.on("update-available", () => {
				this.logger.info("update-available")
				this.stopPolling()
				this.downloadUpdate()
			})
			.on("update-not-available", (info) => {
				this.logger.info("update not available:", info)
			})
			.on("download-progress", (prg) => {
				this.logger.debug("update dl progress:", prg)
			})
			.on("update-downloaded", async (info: UpdateDownloadedEvent & { signature: string }) => {
				this._updateInfo = info
				this.logger.info(`update-downloaded: ${JSON.stringify(info)}`)
				this.stopPolling()

				const data = await this.fs.promises.readFile(info.downloadedFile)
				const publicKeys: string[] = await this.conf.getConst(BuildConfigKey.pubKeys)
				const verified = publicKeys.some((pk) => this.verifySignature(pk, assertNotNull(info), data))

				if (verified) {
					this.notifyAndInstall(info)
				} else {
					this._updateInfo = null
					this.logger.warn(`all signatures invalid, could not update. Deleting ${info.downloadedFile}.`)
					this.fs.promises.unlink(info.downloadedFile)
				}
			})
			.on("error", (e) => {
				this.stopPolling()
				this.errorCount += 1
				const messageEvent: { message: string } = downcast(e)
				if (this.errorCount >= 5) {
					this.logger.error(`Auto Update Error ${this.errorCount}, polling is stopped:\n${messageEvent.message}`)

					// Avoid spamming the notification to the user
					if (this.errorCount === 5) this.notifyUpdateError()

					this.logger.error(`Update failed multiple times. Last error:\n${messageEvent.message}`)
				} else {
					this.logger.error(`Auto Update Error ${this.errorCount}, continuing polling:\n${messageEvent.message}`)
					this.startPolling()
				}
			})

		/**
		 * this replaces the autoInstallOnAppQuit feature of autoUpdater,
		 * which causes the app to uninstall itself if it is installed for
		 * all users on a windows system.
		 *
		 * should be removed once https://github.com/electron-userland/electron-builder/issues/4815
		 * is resolved.
		 */
		this.app.once("before-quit", (ev) => {
			if (this._updateInfo) {
				ev.preventDefault()
				this._updateInfo = null
				if (process.platform !== "win32") {
					// We don't do auto-update on close on Windows because it launches the installer which is pretty annoying.
					// We have to start the installer wizard (first argument to install being "false") because without it update for
					// system-wide installation does not work.
					// see https://github.com/tutao/tutanota/issues/1413#issuecomment-796737959
					// see c4b12e9

					// quitAndInstall takes two arguments which are only used for windows and linux updater.
					// isSilent and isForceRunAfter. If the first one is set to false then the second one is set to true implicitly.
					// we want a silent install on quit anyway (as we disabled update on quit for windows) and no restart of the application.
					this.updater.electronUpdater.quitAndInstall(true, false)
				}
			}
		})
	}

	async start() {
		if (!this.updater.updatesEnabledInBuild()) {
			this.logger.debug("no update info on disk, disabling updater.")
			this.conf.setVar(DesktopConfigKey.showAutoUpdateOption, false)
			return
		}

		// if we got here, we could theoretically download updates.
		// show the option in the settings menu
		this.conf.setVar(DesktopConfigKey.showAutoUpdateOption, true)

		// if user changes auto update setting, we want to know
		this.conf
			.removeListener(DesktopConfigKey.enableAutoUpdate, this.enableAutoUpdateListener)
			.on(DesktopConfigKey.enableAutoUpdate, this.enableAutoUpdateListener)

		if (!(await this.conf.getVar(DesktopConfigKey.enableAutoUpdate))) {
			this.stopPolling()
			return
		}
		if (this.updatePollInterval) {
			//already running
			// TODO: reset any other fields?
			return
		}

		this.checkUpdateSignature = await this.conf.getConst(BuildConfigKey.checkUpdateSignature)
		this.startPolling()
		// the first check is immediate, all others are done with a delay
		// and random exponential backoff
		this.checkUpdate()
	}

	private verifySignature(pubKey: string, updateInfo: TutanotaUpdateInfo, data: Uint8Array): boolean {
		if (!this.checkUpdateSignature) {
			return true
		}
		try {
			const signature = Buffer.from(updateInfo.signature, "base64")

			if (this.crypto.verifySignature(pubKey, data, signature)) {
				this.logger.info("Signature verification successful, installing update")
				return true
			}
		} catch (e) {
			this.logger.error("Failed to verify update signature", e)
			return false
		}
		return false
	}

	setUpdateDownloadedListener(listener: () => void): void {
		this.updater.electronUpdater.on("update-downloaded", listener)
	}

	private async startPolling() {
		if (!this.updatePollInterval) {
			// sets the poll interval at a random multiple of (base value)
			// between (base value) and (base value) * 2^(errorCount)
			const multiplier = Math.floor(Math.random() * Math.pow(2, this.errorCount)) + 1
			const interval = await this.conf.getConst(BuildConfigKey.pollingInterval)
			this.updatePollInterval = this.scheduler(() => this.checkUpdate(), interval * multiplier)
		}
	}

	private async checkUpdateThrottleTime() {
		// After 5 unsuccessful attempts to update, we start throttling the user
		// to avoid too many calls to our servers
		if (this.errorCount >= 5) {
			// Half of a second * errorCount
			const throttleTime = 500 * this.errorCount
			this.logger.debug(`Auto Update: throttling manual update attempt # ${this.errorCount} by ${throttleTime}`)
			await delay(throttleTime)
		}
	}

	private stopPolling() {
		clearInterval(neverNull(this.updatePollInterval))
		this.updatePollInterval = null
	}

	/**
	 * try to get the update:
	 * check update availability,
	 * check signatures
	 * try to download
	 *
	 * if the signature check is successful, further handling of the update
	 * will be done by the 'update-downloaded' callback set up in the constructor
	 * @returns {Promise} true if an update was downloaded, false otherwise
	 */
	private async checkUpdate(): Promise<boolean> {
		const autoUpdater = await this.updater.electronUpdater
		return new Promise((resolve) => {
			let cleanup = (hasUpdate: boolean) => {
				cleanup = (hasUpdate) => {}
				resolve(hasUpdate)
				autoUpdater.removeListener("update-not-available", updateNotAvailable)
				autoUpdater.removeListener("update-downloaded", updateDownloaded)
				autoUpdater.removeListener("error", updateNotAvailable)
			}
			const updateNotAvailable = () => cleanup(false)
			const updateDownloaded = () => cleanup(true)
			autoUpdater.checkForUpdates().catch((e: Error) => {
				this.logger.error("Update check failed,", e.message)
				cleanup(false)
			})

			autoUpdater.once("update-not-available", updateNotAvailable).once("update-downloaded", updateDownloaded).once("error", updateNotAvailable)
		})
	}

	/**
	 * check for update if none is currently available,
	 * quit and install otherwise
	 * @returns {Promise<boolean>} True if an update is available and the next call will install it, false otherwise.
	 */
	manualUpdate(): Promise<boolean> {
		return this.checkUpdateThrottleTime().then(() => {
			if (!this.updateInfo) {
				return this.checkUpdate()
			}
			this.installUpdate()
			return Promise.resolve(false)
		})
	}

	private async downloadUpdate(): Promise<Array<string>> {
		this.logger.debug("downloading")
		try {
			return await this.updater.electronUpdater.downloadUpdate()
		} catch (e) {
			this.logger.error("Update Download failed,", e.message)
			// no files have been dl'd
			return []
		}
	}

	private async notifyAndInstall(info: TutanotaUpdateInfo): Promise<void> {
		this.logger.debug("notifying for update")
		this.notifier
			.showOneShot({
				title: lang.get("updateAvailable_label", { "{version}": info.version }),
				body: lang.get("clickToUpdate_msg"),
				icon: this.icon,
			})
			.then((res) => {
				if (res === NotificationResult.Click) {
					this.installUpdate()
				}
			})
			.catch((e: Error) => this.logger.error("Notification failed, error message:", e?.message))
	}

	installUpdate() {
		this.logger.debug("installing update")
		//the window manager enables force-quit on the app-quit event,
		// which is not emitted for quitAndInstall
		// so we enable force-quit manually with a custom event
		this.app.emit("enable-force-quit")
		this._updateInfo = null
		// first argument: isSilent Boolean - windows-only Runs the installer in silent mode. Defaults to false.
		// second argument: isForceRunAfter Boolean - Run the app after finish even on silent install. Not applicable for macOS.
		//  Ignored if isSilent is set to false.
		// https://www.electron.build/auto-update#appupdater-eventemitter
		// As this is triggered by user we want to restart afterwards and don't mind showing the wizard either.
		this.updater.electronUpdater.quitAndInstall(false, true)
	}

	private async notifyUpdateError() {
		this.notifier
			.showOneShot({
				title: lang.get("errorReport_label"),
				body: lang.get("errorDuringUpdate_msg"),
				icon: this.icon,
			})
			.catch((e) => this.logger.error("Error Notification failed, error message:", e?.message))
	}
}
