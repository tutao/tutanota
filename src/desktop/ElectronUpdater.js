// @flow
import type {DesktopNotifier} from "./DesktopNotifier"
import {NotificationResult} from './DesktopConstants'
import {lang} from '../misc/LanguageViewModel'
import type {DesktopConfig} from './config/DesktopConfig'
import {downcast, neverNull} from "../api/common/utils/Utils"
import type {DesktopTray} from "./tray/DesktopTray"
import {Mode} from "../api/common/Env"
import {log} from "./DesktopLog";
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import type {App} from "electron"
import type {UpdaterWrapper} from "./UpdaterWrapper"


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

type LoggerFn = (string, ...args: any) => void
type UpdaterLogger = {debug: LoggerFn, info: LoggerFn, warn: LoggerFn, error: LoggerFn, silly: LoggerFn, verbose: LoggerFn}

export class ElectronUpdater {
	_conf: DesktopConfig;
	_notifier: DesktopNotifier;
	_crypto: DesktopCryptoFacade;
	_updatePollInterval: ?IntervalID;
	_checkUpdateSignature: boolean;
	_errorCount: number;
	_setInterval: typeof setInterval;
	_updateInfo: ?UpdateInfo = null;
	_logger: UpdaterLogger;
	_app: App;
	_tray: DesktopTray
	_updater: UpdaterWrapper

	get updateInfo(): ?UpdateInfo {
		return this._updateInfo
	}

	constructor(conf: DesktopConfig, notifier: DesktopNotifier, crypto: DesktopCryptoFacade, app: App, tray: DesktopTray,
	            updater: UpdaterWrapper, scheduler: typeof setInterval = setInterval) {
		this._conf = conf
		this._notifier = notifier
		this._errorCount = 0
		this._crypto = crypto
		this._app = app
		this._tray = tray
		this._updater = updater
		this._setInterval = scheduler

		this._logger = env.mode === Mode.Test
			? {
				info: (m: string, ...args: any) => {},
				warn: (m: string, ...args: any) => {},
				error: (m: string, ...args: any) => {},
				verbose: (m: string, ...args: any) => {},
				debug: (m: string, ...args: any) => {},
				silly: (m: string, ...args: any) => {},
			}
			: {
				info: (m: string, ...args: any) => log.debug.apply(console, ["autoUpdater info:\n", m].concat(args)),
				warn: (m: string, ...args: any) => console.warn.apply(console, ["autoUpdater warn:\n", m].concat(args)),
				error: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater error:\n", m].concat(args)),
				verbose: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
				debug: (m: string, ...args: any) => log.debug.apply(console, ["autoUpdater debug:\n", m].concat(args)),
				silly: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
			}
		this._updater.electronUpdater.then((autoUpdater) => {
			autoUpdater.logger = this._logger
			// default behaviour is to just dl the update as soon as found, but we want to check the signature
			// before telling the updater to get the file.
			autoUpdater.autoDownload = false
			autoUpdater.autoInstallOnAppQuit = false
			autoUpdater.on('checking-for-update', () => {
				this._logger.info("checking-for-update")
			}).on('update-available', updateInfo => {
				this._logger.info("update-available")
				this._stopPolling()
				const verified = this._conf.getConst("pubKeys").some(pk => this._verifySignature(pk, downcast(updateInfo)))
				if (verified) {
					this._downloadUpdate()
					    .then(p => log.debug("dl'd update files: ", p))
				} else {
					this._logger.warn("all signatures invalid, could not update")
				}
			}).on('update-not-available', info => {
				this._logger.info("update not available:", info)
			}).on("download-progress", (prg: DownloadProgressInfo) => {
				log.debug('update dl progress:', prg)
			}).on('update-downloaded', info => {
				this._updateInfo = downcast({version: info.version})
				this._logger.info("update-downloaded")
				this._stopPolling()
				this._notifyAndInstall(downcast(info))
			}).on('error', e => {
				this._stopPolling()
				this._errorCount += 1
				const messageEvent: {message: string} = downcast(e)
				if (this._errorCount >= 5) {
					this._logger.error(`Auto Update Error ${this._errorCount}, shutting down updater:\n${messageEvent.message}`)
					autoUpdater.removeAllListeners('update-available')
					autoUpdater.removeAllListeners('update-downloaded')
					autoUpdater.removeAllListeners('checking-for-update')
					autoUpdater.removeAllListeners('error')
					this._notifyUpdateError()
					this._logger.error(`Update failed multiple times. Last error:\n${messageEvent.message}`)
				} else {
					this._logger.error(`Auto Update Error ${this._errorCount}, continuing polling:\n${messageEvent.message}`)
					this._startPolling()
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
		this._app.once('before-quit', ev => {
			if (this._updateInfo) {
				ev.preventDefault()
				this._updateInfo = null
				// TODO: this may restart the app after install
				// TODO: which may be annoying if quit not via notification or 'install now'
				this._updater.electronUpdater.then((autoUpdater) => autoUpdater.quitAndInstall(false, false))
			}
		})
	}

	+_enableAutoUpdateListener: (() => void) = () => this.start()

	start() {
		if (!this._updater.updatesEnabledInBuild()) {
			log.debug("no update info on disk, disabling updater.")
			this._conf.setVar('showAutoUpdateOption', false)
			return
		}

		// if we got here, we could theoretically download updates.
		// show the option in the settings menu
		this._conf.setVar('showAutoUpdateOption', true)

		// if user changes auto update setting, we want to know
		this._conf.removeListener('enableAutoUpdate', this._enableAutoUpdateListener)
		    .on('enableAutoUpdate', this._enableAutoUpdateListener)

		if (!this._conf.getVar("enableAutoUpdate")) {
			this._stopPolling()
			return
		}
		if (this._updatePollInterval) { //already running
			// TODO: reset any other fields?
			return
		}

		this._checkUpdateSignature = this._conf.getConst('checkUpdateSignature')
		this._startPolling()
		// the first check is immediate, all others are done with a delay
		// and random exponential backoff
		this._checkUpdate()
	}

	_verifySignature(pubKey: string, updateInfo: UpdateInfo): boolean {
		if (!this._checkUpdateSignature) {
			return true
		} else {
			try {
				let hash = Buffer.from(updateInfo.sha512, 'base64').toString('binary')
				let signature = Buffer.from(updateInfo.signature, 'base64').toString('binary')
				let publicKey = this._crypto.publicKeyFromPem(pubKey)

				if (publicKey.verify(hash, signature)) {
					this._logger.info('Signature verification successful, downloading update')
					return true
				}
			} catch (e) {
				log.error("Failed to verify update signature", e)
				return false
			}
			return false
		}
	}

	setUpdateDownloadedListener(listener: ()=>void): void {
		this._updater.electronUpdater.then((autoUpdater) => autoUpdater.on('update-downloaded', listener))
	}

	_startPolling() {
		if (!this._updatePollInterval) {
			// sets the poll interval at a random multiple of (base value)
			// between (base value) and (base value) * 2^(errorCount)
			const multiplier = Math.floor(Math.random() * Math.pow(2, this._errorCount)) + 1
			const interval = this._conf.getConst("pollingInterval")
			this._updatePollInterval = this._setInterval(() => this._checkUpdate(), interval * multiplier)
		}
	}

	_stopPolling() {
		clearInterval(neverNull(this._updatePollInterval))
		this._updatePollInterval = null
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
	async _checkUpdate(): Promise<boolean> {
		const autoUpdater = await this._updater.electronUpdater
		return new Promise(resolve => {
			let cleanup = hasUpdate => {
				cleanup = hasUpdate => {}
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
					this._logger.error("Update check failed,", e.message)
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
		if (this._errorCount >= 5) return Promise.reject(new Error("Update failed 5 times"))
		if (!this.updateInfo) {
			return this._checkUpdate()
		}
		this.installUpdate()
		return Promise.resolve(false)
	}

	_downloadUpdate(): Promise<Array<string>> {
		log.debug("downloading")
		return this._updater.electronUpdater
		           .then((autoUpdater) => autoUpdater.downloadUpdate())
		           .catch(e => {
			           this._logger.error("Update Download failed,", e.message)
			           // no files have been dl'd
			           return []
		           })
	}

	_notifyAndInstall(info: UpdateInfo): void {
		log.debug("notifying for update")
		this._notifier
		    .showOneShot({
			    title: lang.get('updateAvailable_label', {"{version}": info.version}),
			    body: lang.get('clickToUpdate_msg'),
			    icon: this._tray.getIconByName(this._conf.getConst('iconName'))
		    })
		    .then((res) => {
			    if (res === NotificationResult.Click) {
				    this.installUpdate()
			    }
		    })
		    .catch((e: Error) => this._logger.error("Notification failed,", e.message))
	}

	/**
	 * TODO: this is the only place that should call quitAndInstall
	 * TODO: to prevent the app from restarting immediately when the user
	 * TODO: closed it not via the notification or the 'install now' button
	 */
	installUpdate() {
		log.debug("installing")
		//the window manager enables force-quit on the app-quit event,
		// which is not emitted for quitAndInstall
		// so we enable force-quit manually with a custom event
		this._app.emit('enable-force-quit')
		this._updateInfo = null
		this._updater.electronUpdater.then((autoUpdater) => autoUpdater.quitAndInstall(false, true))
	}

	_notifyUpdateError() {
		this._notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
			icon: this._tray.getIconByName(this._conf.getConst('iconName'))
		}).catch(e => this._logger.error("Error Notification failed,", e.message))
	}
}
