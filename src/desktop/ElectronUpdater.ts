import type {DesktopNotifier} from "./DesktopNotifier"
import {NotificationResult} from "./DesktopNotifier";
import {lang} from '../misc/LanguageViewModel'
import type {DesktopConfig} from './config/DesktopConfig'
import {downcast, neverNull} from "@tutao/tutanota-utils"
import {Mode} from "../api/common/Env"
import {log} from "./DesktopLog";
import {DesktopNativeCryptoFacade} from "./DesktopNativeCryptoFacade"
import type {App, NativeImage} from "electron"
import type {UpdaterWrapper} from "./UpdaterWrapper"
import {UpdateInfo} from "electron-updater";
import {BuildConfigKey, DesktopConfigKey} from "./config/ConfigKeys";


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

type LoggerFn = (_: string, ...args: any) => void
type UpdaterLogger = {debug: LoggerFn, info: LoggerFn, warn: LoggerFn, error: LoggerFn, silly: LoggerFn, verbose: LoggerFn}

type IntervalID = ReturnType<typeof setTimeout>

// re-do the type as opposed to doing typeof because it doesn't work otherwise
export type IntervalSetter = (fn: (...arr: Array<unknown>) => unknown, time?: number) => IntervalID

export class ElectronUpdater {
	private updatePollInterval: IntervalID | null = null
	private checkUpdateSignature: boolean = false
	private errorCount: number = 0
	private readonly logger: UpdaterLogger
	private _updateInfo: UpdateInfo | null = null

	readonly enableAutoUpdateListener = () => {
		this.start()
	}

	get updateInfo(): UpdateInfo | null {
		return this._updateInfo
	}

	constructor(
		private readonly conf: DesktopConfig,
		private readonly notifier: DesktopNotifier,
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly app: App,
		private readonly icon: NativeImage,
		private readonly updater: UpdaterWrapper,
		private readonly scheduler: IntervalSetter = setInterval
	) {
		this.logger = env.mode === Mode.Test
			? {
				info: (m: string, ...args: any) => {
				},
				warn: (m: string, ...args: any) => {
				},
				error: (m: string, ...args: any) => {
				},
				verbose: (m: string, ...args: any) => {
				},
				debug: (m: string, ...args: any) => {
				},
				silly: (m: string, ...args: any) => {
				},
			}
			: {
				info: (m: string, ...args: any) => log.debug.apply(console, ["autoUpdater info:\n", m].concat(args)),
				warn: (m: string, ...args: any) => console.warn.apply(console, ["autoUpdater warn:\n", m].concat(args)),
				error: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater error:\n", m].concat(args)),
				verbose: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
				debug: (m: string, ...args: any) => log.debug.apply(console, ["autoUpdater debug:\n", m].concat(args)),
				silly: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
			}
		this.updater.electronUpdater.then((autoUpdater) => {
			autoUpdater.logger = this.logger
			// default behaviour is to just dl the update as soon as found, but we want to check the signature
			// before telling the updater to get the file.
			autoUpdater.autoDownload = false
			autoUpdater.autoInstallOnAppQuit = false
			autoUpdater.on('checking-for-update', () => {
				this.logger.info("checking-for-update")
			}).on('update-available', async updateInfo => {
				this.logger.info("update-available")
				this.stopPolling()
				const publicKeys: string[] = await this.conf.getConst(BuildConfigKey.pubKeys)
				const verified = publicKeys.some(pk => this.verifySignature(pk, downcast(updateInfo)))
				if (verified) {
					this.downloadUpdate()
						.then(p => log.debug("dl'd update files: ", p))
				} else {
					this.logger.warn("all signatures invalid, could not update")
				}
			}).on('update-not-available', info => {
				this.logger.info("update not available:", info)
			}).on("download-progress", (prg) => {
				log.debug('update dl progress:', prg)
			}).on('update-downloaded', info => {
				this._updateInfo = downcast({version: info.version})
				this.logger.info("update-downloaded")
				this.stopPolling()
				this.notifyAndInstall(downcast(info))
			}).on('error', e => {
				this.stopPolling()
				this.errorCount += 1
				const messageEvent: {message: string} = downcast(e)
				if (this.errorCount >= 5) {
					this.logger.error(`Auto Update Error ${this.errorCount}, shutting down updater:\n${messageEvent.message}`)
					autoUpdater.removeAllListeners('update-available')
					autoUpdater.removeAllListeners('update-downloaded')
					autoUpdater.removeAllListeners('checking-for-update')
					autoUpdater.removeAllListeners('error')
					this.notifyUpdateError()
					this.logger.error(`Update failed multiple times. Last error:\n${messageEvent.message}`)
				} else {
					this.logger.error(`Auto Update Error ${this.errorCount}, continuing polling:\n${messageEvent.message}`)
					this.startPolling()
				}
			})
		})

		/**
		 * this replaces the autoInstallOnAppQuit feature of autoUpdater,
		 * which causes the app to uninstall itself if it is installed for
		 * all users on a windows system.
		 *
		 * should be removed once https://github.com/electron-userland/electron-builder/issues/4815
		 * is resolved.
		 */
		this.app.once('before-quit', ev => {
			if (this._updateInfo) {
				ev.preventDefault()
				this._updateInfo = null
				if (process.platform !== "win32") {
					// We don't do auto-update on close on Windows because it launches the installer which is pretty annoying.
					// We have to start the installer wizard (first argument to install being "false") because without it update for
					// system-wide installation does not work.
					// see https://github.com/tutao/tutanota/issues/1413#issuecomment-796737959
					// see c4b12e9
					this.updater.electronUpdater.then((autoUpdater) => {
						// quitAndInstall takes two arguments which are only used for windows and linux updater.
						// isSilent and isForceRunAfter. If the first one is set to false then the second one is set to true implicitly.
						// we want a silent install on quit anyway (as we disabled update on quit for windows) and no restart of the application.
						autoUpdater.quitAndInstall(true, false)
					})
				}

			}
		})
	}

	async start() {
		if (!this.updater.updatesEnabledInBuild()) {
			log.debug("no update info on disk, disabling updater.")
			this.conf.setVar(DesktopConfigKey.showAutoUpdateOption, false)
			return
		}

		// if we got here, we could theoretically download updates.
		// show the option in the settings menu
		this.conf.setVar(DesktopConfigKey.showAutoUpdateOption, true)

		// if user changes auto update setting, we want to know
		this.conf.removeListener(DesktopConfigKey.enableAutoUpdate, this.enableAutoUpdateListener)
			.on(DesktopConfigKey.enableAutoUpdate, this.enableAutoUpdateListener)

		if (!(await this.conf.getVar(DesktopConfigKey.enableAutoUpdate))) {
			this.stopPolling()
			return
		}
		if (this.updatePollInterval) { //already running
			// TODO: reset any other fields?
			return
		}

		this.checkUpdateSignature = await this.conf.getConst(BuildConfigKey.checkUpdateSignature)
		this.startPolling()
		// the first check is immediate, all others are done with a delay
		// and random exponential backoff
		this.checkUpdate()
	}

	private verifySignature(pubKey: string, updateInfo: UpdateInfo): boolean {
		if (!this.checkUpdateSignature) {
			return true
		} else {
			try {
				let hash = Buffer.from(updateInfo.sha512, 'base64').toString('binary')
				// @ts-ignore Where does signature come from?
				let signature = Buffer.from(updateInfo.signature, 'base64').toString('binary')
				let publicKey = this.crypto.publicKeyFromPem(pubKey)

				if (publicKey.verify(hash, signature)) {
					this.logger.info('Signature verification successful, downloading update')
					return true
				}
			} catch (e) {
				log.error("Failed to verify update signature", e)
				return false
			}
			return false
		}
	}

	setUpdateDownloadedListener(listener: () => void): void {
		this.updater.electronUpdater.then((autoUpdater) => autoUpdater.on('update-downloaded', listener))
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
		return new Promise(resolve => {
			let cleanup = (hasUpdate: boolean) => {
				cleanup = hasUpdate => {
				}
				resolve(hasUpdate)
				autoUpdater.removeListener('update-not-available', updateNotAvailable)
				autoUpdater.removeListener('update-downloaded', updateDownloaded)
				autoUpdater.removeListener('error', updateNotAvailable)
			}
			const updateNotAvailable = () => cleanup(false)
			const updateDownloaded = () => cleanup(true)
			autoUpdater
				.checkForUpdates()
				.catch((e: Error) => {
					this.logger.error("Update check failed,", e.message)
					cleanup(false)
				})

			autoUpdater.once('update-not-available', updateNotAvailable)
					   .once('update-downloaded', updateDownloaded)
					   .once('error', updateNotAvailable)
		})
	}

	/**
	 * check for update if none is currently available,
	 * quit and install otherwise
	 * @returns {Promise<boolean>} True if an update is available and the next call will install it, false otherwise.
	 */
	manualUpdate(): Promise<boolean> {
		if (this.errorCount >= 5) return Promise.reject(new Error("Update failed 5 times"))
		if (!this.updateInfo) {
			return this.checkUpdate()
		}
		this.installUpdate()
		return Promise.resolve(false)
	}

	private downloadUpdate(): Promise<Array<string>> {
		log.debug("downloading")
		return this.updater.electronUpdater
				   .then((autoUpdater) => autoUpdater.downloadUpdate())
				   .catch(e => {
					   this.logger.error("Update Download failed,", e.message)
					   // no files have been dl'd
					   return []
				   })
	}

	private async notifyAndInstall(info: UpdateInfo): Promise<void> {
		log.debug("notifying for update")
		this.notifier
			.showOneShot({
				title: lang.get('updateAvailable_label', {"{version}": info.version}),
				body: lang.get('clickToUpdate_msg'),
				icon: this.icon
			})
			.then((res) => {
				if (res === NotificationResult.Click) {
					this.installUpdate()
				}
			})
			.catch((e: Error) => this.logger.error("Notification failed,", e.message))
	}

	installUpdate() {
		log.debug("installing update")
		//the window manager enables force-quit on the app-quit event,
		// which is not emitted for quitAndInstall
		// so we enable force-quit manually with a custom event
		this.app.emit('enable-force-quit')
		this._updateInfo = null
		// first argument: isSilent Boolean - windows-only Runs the installer in silent mode. Defaults to false.
		// second argument: isForceRunAfter Boolean - Run the app after finish even on silent install. Not applicable for macOS.
		//  Ignored if isSilent is set to false.
		// https://www.electron.build/auto-update#appupdater-eventemitter
		// As this is triggered by user we want to restart afterwards and don't mind showing the wizard either.
		this.updater.electronUpdater.then((autoUpdater) => autoUpdater.quitAndInstall(false, true))
	}

	private async notifyUpdateError() {
		this.notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
			icon: this.icon
		}).catch(e => this.logger.error("Error Notification failed,", e.message))
	}
}
