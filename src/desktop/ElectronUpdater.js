// @flow
import {autoUpdater} from 'electron-updater'
import {app} from 'electron'
import forge from 'node-forge'
import type {DesktopNotifier} from "./DesktopNotifier"
import {NotificationResult} from './DesktopConstants'
import {lang} from '../misc/LanguageViewModel'
import type {DesktopConfigHandler} from './DesktopConfigHandler'
import {neverNull} from "../api/common/utils/Utils"
import {UpdateError} from "../api/common/error/UpdateError"
import {DesktopTray} from "./DesktopTray"

export class ElectronUpdater {
	_conf: DesktopConfigHandler;
	_notifier: DesktopNotifier;
	_updatePollInterval: ?IntervalID;
	_checkUpdateSignature: boolean;
	_errorCount: number;
	_fallbackPollInterval: number = 15 * 60 * 1000;
	_logger: {info(string, ...args: any): void, warn(string, ...args: any): void, error(string, ...args: any): void}

	constructor(conf: DesktopConfigHandler, notifier: DesktopNotifier, fallbackPollInterval: ?number) {
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
		autoUpdater.on('update-available', updateInfo => {
			this._logger.info("update-available")
			this._stopPolling()
			Promise
				.any(this._conf.get("pubKeys").map(pk => this._verifySignature(pk, updateInfo)))
				.then(() => this._downloadUpdate())
				.catch(UpdateError, e => {
					this._logger.warn("invalid signature, could not update", e)
				})
		}).on('update-not-available', info => {
			this._logger.info("update not available:", info)
		}).on('update-downloaded', info => {
			this._logger.info("update-downloaded")
			this._stopPolling()
			this._notifyAndInstall(info)
		}).on('checking-for-update', () => {
			this._logger.info("checking-for-update")
		}).on('error', e => {
			this._stopPolling()
			this._errorCount += 1
			if (this._errorCount >= 5) {
				this._logger.error(`Auto Update Error ${this._errorCount}, shutting down updater:\n${e.message}`)
				autoUpdater.removeAllListeners('update-available')
				autoUpdater.removeAllListeners('update-downloaded')
				autoUpdater.removeAllListeners('checking-for-update')
				autoUpdater.removeAllListeners('error')
				throw new UpdateError(`Update failed multiple times. Last error:\n${e.message}`)
			} else {
				this._logger.error(`Auto Update Error ${this._errorCount}, continuing polling:\n${e.message}`)
				this._notifyUpdateError()
				setTimeout(() => this._startPolling(), this._fallbackPollInterval)
			}
		})
	}

	+_enableAutoUpdateListener = () => this.start()

	start() {
		// if user changes auto update setting, we want to know
		this._conf.removeListener('enableAutoUpdate', this._enableAutoUpdateListener)
		    .on('enableAutoUpdate', this._enableAutoUpdateListener)

		if (!this._conf.getDesktopConfig("enableAutoUpdate")) {
			this._stopPolling()
			return
		}
		if (this._updatePollInterval) { //already running
			// TODO: reset any other fields?
			return
		}

		this._checkUpdateSignature = this._conf.get('checkUpdateSignature')
		autoUpdater.autoDownload = !this._checkUpdateSignature
		this._startPolling()
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
			this._updatePollInterval = setInterval(() => this._checkUpdate(), this._conf.get("pollingInterval")
				|| this._fallbackPollInterval)
			this._checkUpdate()
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
				this._notifyUpdateError()
			})
	}

	_downloadUpdate(): void {
		autoUpdater
			.downloadUpdate()
			.catch(e => {
				this._logger.error("Update Download failed,", e.message)
				this._notifyUpdateError()
			})
	}

	_notifyAndInstall(info: UpdateInfo): void {
		this._notifier
		    .showOneShot({
			    title: lang.get('updateAvailable_label', {"{version}": info.version}),
			    body: lang.get('clickToUpdate_msg'),
			    icon: DesktopTray.getIcon(this._conf.get('iconName'))
		    })
		    .then((res) => {
			    if (res === NotificationResult.Click) {
				    //the window manager enables force-quit on the app-quit event,
				    // which is not emitted for quitAndInstall
				    // so we enable force-quit manually with a custom event
				    app.emit('enable-force-quit')
				    autoUpdater.quitAndInstall(false, true)
			    }
		    })
		    .catch((e: Error) => this._logger.error("Notification failed,", e.message))
	}

	_notifyUpdateError() {
		this._notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
			icon: DesktopTray.getIcon(this._conf.get('iconName'))
		}).catch(e => this._logger.error("Notification failed,", e.message))
	}
}
