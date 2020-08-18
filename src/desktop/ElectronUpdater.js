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

export class ElectronUpdater {
	_conf: DesktopConfig;
	_notifier: DesktopNotifier;
	_updatePollInterval: ?IntervalID;
	_checkUpdateSignature: boolean;
	_errorCount: number;
	_fallbackPollInterval: number = 15 * 60 * 1000;
	_installOnQuit = false;
	_logger: {info(string, ...args: any): void, warn(string, ...args: any): void, error(string, ...args: any): void}

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
		}
		autoUpdater.logger = null
		// default behaviour is to just dl the update as soon as found, but we want to check the signature
		// before doing telling the updater to get the file.
		autoUpdater.autoDownload = false
		autoUpdater.autoInstallOnAppQuit = false
		autoUpdater.on('update-available', updateInfo => {
			this._logger.info("update-available")
			this._stopPolling()
			Promise
				.any(this._conf.getConst("pubKeys").map(pk => this._verifySignature(pk, downcast(updateInfo))))
				.then(() => this._downloadUpdate())
				.catch(UpdateError, e => {
					this._logger.warn("invalid signature, could not update", e)
				})
		}).on('update-not-available', info => {
			this._logger.info("update not available:", info)
		}).on('update-downloaded', info => {
			this._logger.info("update-downloaded")
			this._stopPolling()
			this._installOnQuit = true
			this._notifyAndInstall(downcast(info))
		}).on('checking-for-update', () => {
			this._logger.info("checking-for-update")
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
				throw new UpdateError(`Update failed multiple times. Last error:\n${messageEvent.message}`)
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
			if (this._installOnQuit) {
				ev.preventDefault()
				this._installOnQuit = false
				autoUpdater.quitAndInstall(false, false)
			}
		})
	}

	+_enableAutoUpdateListener = () => this.start()

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

	_checkUpdate(): void {
		autoUpdater
			.checkForUpdates()
			.catch((e: Error) => {
				this._logger.error("Update check failed,", e.message)
			})
	}

	_downloadUpdate(): void {
		autoUpdater
			.downloadUpdate()
			.catch(e => {
				this._logger.error("Update Download failed,", e.message)
			})
	}

	_notifyAndInstall(info: UpdateInfo): void {
		this._notifier
		    .showOneShot({
			    title: lang.get('updateAvailable_label', {"{version}": info.version}),
			    body: lang.get('clickToUpdate_msg'),
			    icon: DesktopTray.getIcon(this._conf.getConst('iconName'))
		    })
		    .then((res) => {
			    if (res === NotificationResult.Click) {
				    //the window manager enables force-quit on the app-quit event,
				    // which is not emitted for quitAndInstall
				    // so we enable force-quit manually with a custom event
				    app.emit('enable-force-quit')
				    this._installOnQuit = false
				    autoUpdater.quitAndInstall(false, true)
			    }
		    })
		    .catch((e: Error) => this._logger.error("Notification failed,", e.message))
	}

	_notifyUpdateError() {
		this._notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
			icon: DesktopTray.getIcon(this._conf.getConst('iconName'))
		}).catch(e => this._logger.error("Error Notification failed,", e.message))
	}
}
