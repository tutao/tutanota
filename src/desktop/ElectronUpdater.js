// @flow
import {autoUpdater} from 'electron-updater'
import {net} from 'electron'
import forge from 'node-forge'
import {NotificationResult} from './DesktopNotifier.js'
import {lang} from './DesktopLocalizationProvider.js'
import type {DesktopConfigHandler} from './DesktopConfigHandler'
import type {DeferredObject} from "../api/common/utils/Utils"
import {defer, neverNull} from "../api/common/utils/Utils"
import {handleRestError} from "../api/common/error/RestError"
import {UpdateError} from "../api/common/error/UpdateError"
import {DesktopTray} from "./DesktopTray.js"
import type {DesktopNotifier} from "./DesktopNotifier"

export class ElectronUpdater {
	_conf: DesktopConfigHandler;
	_notifier: DesktopNotifier;

	_updatePollInterval: ?IntervalID;
	_keyRetrievalTimeout: ?TimeoutID;
	_foundKey: DeferredObject<void>;
	_checkUpdateSignature: boolean;
	_pubKey: string;
	_logger: {info(string, ...args: any): void, warn(string, ...args: any): void, error(string, ...args: any): void}

	constructor(conf: DesktopConfigHandler, notifier: DesktopNotifier) {
		this._conf = conf
		this._notifier = notifier

		this._logger = {
			info: (m: string, ...args: any) => console.log.apply(console, ["autoUpdater info:\n", m].concat(args)),
			warn: (m: string, ...args: any) => console.log.apply(console, ["autoUpdater warn:\n", m].concat(args)),
			error: (m: string, ...args: any) => console.error.apply(console, ["autoUpdater error:\n", m].concat(args)),
		}
		this._foundKey = defer()
		autoUpdater.logger = null
		autoUpdater.on('update-available', updateInfo => {
			this._stopPolling()
			this._foundKey.promise
			    .then(() => this._verifySignature(updateInfo))
			    .then(() => this._downloadUpdate())
		}).on('update-downloaded', info => {
			this._stopPolling()
			this._notifyAndInstall(info)
		}).on('error', e => {
			this._logger.error(`Auto Update Error, continuing polling:\n${e.message}`)
			this._notifyUpdateError()
			this._startPolling()
		})
	}

	start() {
		this._conf.removeListener('enableAutoUpdate', this.start)
		    .on('enableAutoUpdate', this.start)
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
		if (this._checkUpdateSignature) {
			this._trackPublicKey(this._conf.get("pubKeyUrl"))
		} else {
			this._foundKey.resolve()
		}
		this._foundKey.promise
		    .then(() => this._startPolling())
		    .catch((e: Error) => {
			    this._logger.error("ElectronUpdater.start() failed,", e.message)
		    })
	}

	_verifySignature(updateInfo: UpdateInfo): Promise<void> {
		return !this._checkUpdateSignature
			? Promise.resolve()
			: new Promise((resolve, reject) => {
				let hash = Buffer.from(updateInfo.sha512, 'base64').toString('binary')
				let signature = Buffer.from(updateInfo.signature, 'base64').toString('binary')
				let publicKey = forge.pki.publicKeyFromPem(this._pubKey)
				try {
					hash = Buffer.from(updateInfo.sha512, 'base64').toString('binary')
					signature = Buffer.from(updateInfo.signature, 'base64').toString('binary')
					publicKey = forge.pki.publicKeyFromPem(this._pubKey)
				} catch (e) {
					reject(new UpdateError(e.message))
				}

				if (publicKey.verify(hash, signature)) {
					this._logger.info('Signature verification successful, downloading update')
					resolve()
				} else {
					reject(new UpdateError('Signature verification failed, skipping update'))
				}
			})
	}

	// tries to find the public key. will retry on failure.
	_trackPublicKey(url: string): void {
		this._logger.info("trying to retrieve public key from", url)
		if (!url.startsWith('https://')) {
			this._logger.error('invalid public key URL')
			this._retryKeyRetrieval(this._conf.get("pollingInterval"))
			return
		}
		this._requestFile(url).then((result) => {
			if (!result.startsWith('-----BEGIN PUBLIC KEY-----')) {
				const newUrl = result
					.split(':NEWURL:')
					.find(part => part.startsWith(' https://'))
				if (newUrl === undefined) { // nonsense, try again in a few hours
					this._retryKeyRetrieval(this._conf.get("pollingInterval"))
				} else { // key moved to a new location
					this._trackPublicKey(newUrl.trim())
				}
			} else {
				this._logger.info("found public key")
				this._pubKey = result
				this._foundKey.resolve()
			}
		}).catch(e => {
			this._logger.error("public key retrieval failed:", e)
			this._retryKeyRetrieval(this._conf.get("pollingInterval"))
		})
	}

	_requestFile(url: string): Promise<string> {
		let buf: Buffer = Buffer.alloc(0)
		return new Promise((resolve, reject) => {
			net.request(url)
			   .on('error', err => reject(err))
			   .on('response', response => {
				   if (response.statusCode > 399) {
					   reject(handleRestError(response.statusCode, `The request to ${url} failed: ${response.statusCode}`))
					   return
				   }
				   response
					   .on('error', err => reject(err))
					   .on('data', chunk => buf = Buffer.concat([buf, chunk]))
					   .on('end', () => resolve(buf.toString('utf-8')))
			   })
			   .end()
		})
	}

	_retryKeyRetrieval(when: ?number) {
		this._logger.info("retrying key retrieval in", when)
		clearTimeout(neverNull(this._keyRetrievalTimeout))
		this._keyRetrievalTimeout = setTimeout(() => this._trackPublicKey(this._conf.get("pubKeyUrl")), when || 1000000)
	}

	_startPolling() {
		if (!this._updatePollInterval) {
			this._checkUpdate()
			this._updatePollInterval = setInterval(() => this._checkUpdate(), this._conf.get("pollingInterval") || 1000000)
		}
	}

	_stopPolling() {
		clearInterval(neverNull(this._updatePollInterval))
		this._updatePollInterval = null
	}

	_checkUpdate(): void {
		autoUpdater
			.checkForUpdates()
			.catch((e: Error) => this._logger.error("Update check failed,", e.message))
	}

	_downloadUpdate(): void {
		autoUpdater
			.downloadUpdate()
			.catch(e => {
				this._logger.error("Update Download failed,", e.message)
				this._notifyUpdateError()
				this._startPolling()
			})
	}

	_notifyAndInstall(info: UpdateInfo): void {
		this._notifier
		    .showOneShot({
			    title: lang.get('updateAvailable_label', {"{version}": info.version}),
			    body: lang.get('clickToUpdate_msg'),
			    icon: DesktopTray.getIcon()
		    })
		    .then((res) => {
			    if (res === NotificationResult.Click) {
				    autoUpdater.quitAndInstall(false, true)
			    }
		    })
		    .catch((e: Error) => this._logger.error("Notification failed,", e.message))
	}

	_notifyUpdateError() {
		this._notifier.showOneShot({
			title: lang.get("errorReport_label"),
			body: lang.get("errorDuringUpdate_msg"),
		}).catch(e => this._logger.error("Notification failed,", e.message))
	}
}
