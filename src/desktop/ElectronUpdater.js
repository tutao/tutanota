// @flow
import {autoUpdater} from 'electron-updater'
import {app} from "electron"
import forge from 'node-forge'
import type {DesktopNotifier} from "./DesktopNotifier"
import {NotificationResult} from './DesktopConstants'
import {lang} from '../misc/LanguageViewModel'
import type {DesktopConfig} from './config/DesktopConfig'
import {downcast, neverNull} from "../api/common/utils/Utils"
import {UpdateError} from "../api/common/error/UpdateError"
import {DesktopTray} from "./tray/DesktopTray"
import fs from 'fs-extra'
import path from 'path'

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

export class ElectronUpdater {
	_conf: DesktopConfig;
	_notifier: DesktopNotifier;
	_updatePollInterval: ?IntervalID;
	_checkUpdateSignature: boolean;
	_errorCount: number;
	_fallbackPollInterval: number = 15 * 60 * 1000;
	_updateInfo: ?UpdateInfo = null;
	_logger: {info(string, ...args: any): void, warn(string, ...args: any): void, error(string, ...args: any): void};

	get updateInfo(): ?UpdateInfo {
		return this._updateInfo
	}

	constructor(conf: DesktopConfig, notifier: DesktopNotifier, fallbackPollInterval: ?number) {
		this._conf = conf
		this._notifier = notifier
		this._errorCount = 0
		if (fallbackPollInterval) {
			this._fallbackPollInterval = fallbackPollInterval
		}

		this._logger = {
			info: (m: string, ...args: any) => console.log.apply(console, ["autoUpdater info:\n", m].concat(args)),
			warn: (m: string, ...args: any) => console.warn.apply(console, ["autoUpdater warn:\n", m].concat(args)),
			error: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater error:\n", m].concat(args)),
			verbose: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
			debug: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater debug:\n", m].concat(args)),
			silly: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater:\n", m].concat(args)),
		}
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
			Promise
				.any(this._conf.getConst("pubKeys").map(pk => this._verifySignature(pk, downcast(updateInfo))))
				.then(() => this._downloadUpdate())
				.then(p => console.log("dl'd update files: ", p))
				.catch(UpdateError, e => {
					this._logger.warn("invalid signature, could not update", e)
				})
		}).on('update-not-available', info => {
			this._logger.info("update not available:", info)
		}).on("download-progress", (prg: DownloadProgressInfo) => {
			console.log('update dl progress:', prg)
		}).on('update-downloaded', info => {
			this._updateInfo = downcast({version: info.version})
			this._logger.info("update-downloaded")
			this._stopPolling()
			this._notifyAndInstall(downcast(info))
		}).on('error', e => {
			const ee: any = e
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

		/**
		 * this replaces the autoInstallOnAppQuit feature of autoUpdater,
		 * which causes the app to uninstall itself if it is installed for
		 * all users on a windows system.
		 *
		 * should be removed once https://github.com/electron-userland/electron-builder/issues/4815
		 * is resolved.
		 */
		app.once('before-quit', ev => {
			if (this._updateInfo) {
				ev.preventDefault()
				this._updateInfo = null
				// TODO: this may restart the app after install
				// TODO: which may be annoying if quit not via notification or 'install now'
				autoUpdater.quitAndInstall(false, false)
			}
		})
	}

	+_enableAutoUpdateListener: (() => void) = () => this.start()

	start() {
		try {
			const basepath = process.platform === "darwin"
				? path.join(path.dirname(app.getPath('exe')), "..")
				: path.dirname(app.getPath('exe'))
			const appUpdateYmlPath = path.join(basepath, 'resources', 'app-update.yml')
			fs.accessSync(appUpdateYmlPath, fs.constants.R_OK)
		} catch (e) {
			console.log("no update info on disk, disabling updater.")
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

	_verifySignature(pubKey: string, updateInfo: UpdateInfo): Promise<void> {
		return !this._checkUpdateSignature
			? Promise.resolve()
			: Promise.resolve().then(() => {
				try {
					let hash = Buffer.from(updateInfo.sha512, 'base64').toString('binary')
					let signature = Buffer.from(updateInfo.signature, 'base64').toString('binary')
					let publicKey = forge.pki.publicKeyFromPem(pubKey)

					if (publicKey.verify(hash, signature)) {
						this._logger.info('Signature verification successful, downloading update')
						return
					}
				} catch (e) {
					throw new UpdateError(e.message)
				}
				throw new UpdateError('Signature verification failed, skipping update')
			})
	}

	setUpdateDownloadedListener(listener: ()=>void): void {
		autoUpdater.on('update-downloaded', listener)
	}

	_startPolling() {
		if (!this._updatePollInterval) {
			// sets the poll interval at a random multiple of (base value)
			// between (base value) and (base value) * 2^(errorCount)
			const multiplier = Math.floor(Math.random() * Math.pow(2, this._errorCount)) + 1
			const interval = (this._conf.getConst("pollingInterval") || this._fallbackPollInterval)
			this._updatePollInterval = setInterval(() => this._checkUpdate(), interval * multiplier)
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
	_checkUpdate(): Promise<boolean> {
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
		console.log("downloading")
		return autoUpdater
			.downloadUpdate()
			.catch(e => {
				this._logger.error("Update Download failed,", e.message)
				// no files have been dl'd
				return []
			})
	}

	_notifyAndInstall(info: UpdateInfo): void {
		console.log("notifying for update")
		this._notifier
		    .showOneShot({
			    title: lang.get('updateAvailable_label', {"{version}": info.version}),
			    body: lang.get('clickToUpdate_msg'),
			    icon: DesktopTray.getIcon(this._conf.getConst('iconName'))
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
		console.log("installing")
		//the window manager enables force-quit on the app-quit event,
		// which is not emitted for quitAndInstall
		// so we enable force-quit manually with a custom event
		app.emit('enable-force-quit')
		this._updateInfo = null
		autoUpdater.quitAndInstall(false, true)
	}

	_notifyUpdateError() {
		this._notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
			icon: DesktopTray.getIcon(this._conf.getConst('iconName'))
		}).catch(e => this._logger.error("Error Notification failed,", e.message))
	}
}
