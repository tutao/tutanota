// @flow
import type {NativeImage, WebContentsEvent} from "electron"
import {lang} from "../misc/LanguageViewModel"
import type {WindowManager} from "./DesktopWindowManager.js"
import {defer, objToError} from '../api/common/utils/Utils.js'
import type {DeferredObject} from "../api/common/utils/Utils"
import {downcast, neverNull, noOp} from "../api/common/utils/Utils"
import {errorToObj} from "../api/common/WorkerProtocol"
import type {DesktopConfig} from "./config/DesktopConfig"
import type {DesktopSseClient} from './sse/DesktopSseClient.js'
import type {DesktopNotifier} from "./DesktopNotifier"
import type {Socketeer} from "./Socketeer"
import type {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import type {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {SseInfo} from "./sse/DesktopSseClient"
import {base64ToUint8Array} from "../api/common/utils/Encoding"
import type {ElectronUpdater} from "./ElectronUpdater"
import {DesktopConfigKey} from "./config/ConfigKeys";
import {log} from "./DesktopLog";
import type {DesktopUtils} from "./DesktopUtils"
import type {DesktopErrorHandler} from "./DesktopErrorHandler"
import type {DesktopIntegrator} from "./integration/DesktopIntegrator"
import {getExportDirectoryPath, mailIdToFileName, makeMsgFile, msgFileExists, writeFile, writeFiles} from "./DesktopFileExport"
import type {Mail} from "../api/entities/tutanota/Mail"
import {fileExists} from "./PathUtils"
import {mapAndFilterNullAsync} from "../api/common/utils/ArrayUtils"
import path from "path"

/**
 * node-side endpoint for communication between the renderer threads and the node thread
 */
export class IPC {
	_conf: DesktopConfig;
	_sse: DesktopSseClient;
	_wm: WindowManager;
	_notifier: DesktopNotifier;
	_sock: Socketeer;
	_alarmStorage: DesktopAlarmStorage;
	_crypto: DesktopCryptoFacade;
	_dl: DesktopDownloadManager;
	_initialized: Array<DeferredObject<void>>;
	_requestId: number = 0;
	_queue: {[string]: Function};
	_updater: ?ElectronUpdater;
	_electron: $Exports<"electron">;
	_desktopUtils: DesktopUtils;
	_err: DesktopErrorHandler;
	_integrator: DesktopIntegrator;
	_dragIcon: NativeImage

	constructor(
		conf: DesktopConfig,
		notifier: DesktopNotifier,
		sse: DesktopSseClient,
		wm: WindowManager,
		sock: Socketeer,
		alarmStorage: DesktopAlarmStorage,
		desktopCryptoFacade: DesktopCryptoFacade,
		dl: DesktopDownloadManager,
		updater: ?ElectronUpdater,
		electron: $Exports<"electron">,
		desktopUtils: DesktopUtils,
		errorHandler: DesktopErrorHandler,
		integrator: DesktopIntegrator,
	) {
		this._conf = conf
		this._sse = sse
		this._wm = wm
		this._notifier = notifier
		this._sock = sock
		this._alarmStorage = alarmStorage
		this._crypto = desktopCryptoFacade
		this._dl = dl
		this._updater = updater
		this._electron = electron
		this._desktopUtils = desktopUtils
		this._err = errorHandler
		this._integrator = integrator
		if (!!this._updater) {
			this._updater.setUpdateDownloadedListener(() => {
				this._wm.getAll().forEach(w => this.sendRequest(w.id, 'appUpdateDownloaded', []))
			})
		}

		this._initialized = []
		this._queue = {}
		this._err = errorHandler
		this._electron.ipcMain.handle('to-main', (ev: WebContentsEvent, request: any) => {
			const senderWindow = this._wm.getEventSender(ev)
			if (!senderWindow) return // no one is listening anymore
			const windowId = senderWindow.id
			if (request.type === "response") {
				this._queue[request.id](null, request.value);
			} else if (request.type === "requestError") {
				this._queue[request.id](objToError((request: any).error), null)
				delete this._queue[request.id]
			} else {
				this._invokeMethod(windowId, request.type, request.args)
				    .then(result => {
					    const response = {
						    id: request.id,
						    type: "response",
						    value: result,
					    }
					    const w = this._wm.get(windowId)
					    if (w) w.sendMessageToWebContents(response)
				    })
				    .catch((e) => {
					    const response = {
						    id: request.id,
						    type: "requestError",
						    error: errorToObj(e),
					    }
					    const w = this._wm.get(windowId)
					    if (w) w.sendMessageToWebContents(response)
				    })
			}
		})
		this._dragIcon = this._electron.nativeImage.createFromDataURL("data:image/png;base64,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")
	}

	async _invokeMethod(windowId: number, method: NativeRequestType, args: Array<Object>): any {
		const TMP_DIR = this._electron.app.getPath("temp")
		switch (method) {
			case 'init':
				this._initialized[windowId].resolve()
				return Promise.resolve(process.platform)
			case 'findInPage':
				return this.initialized(windowId).then(() => {
					const w = this._wm.get(windowId)
					if (w) {
						// findInPage might reject if requests come too quickly
						// if it's rejecting for another reason we'll have logs
						return w.findInPage(args)
						        .catch(e => log.debug("findInPage reject:", args, e))
					} else {
						return {numberOfMatches: 0, currentMatch: 0}
					}
				})
			case 'stopFindInPage':
				return this.initialized(windowId).then(() => {
					const w = this._wm.get(windowId)
					if (w) {
						w.stopFindInPage()
					}
				}).catch(noOp)
			case 'setSearchOverlayState': {
				const w = this._wm.get(windowId)
				if (w) {
					const state: boolean = downcast(args[0])
					const force: boolean = downcast(args[1])
					w.setSearchOverlayState(state, force)
				}
				return Promise.resolve()
			}
			case 'registerMailto':
				return this._desktopUtils.registerAsMailtoHandler(true)
			case 'unregisterMailto':
				return this._desktopUtils.unregisterAsMailtoHandler(true)
			case 'integrateDesktop':
				return this._integrator.integrate()
			case 'unIntegrateDesktop':
				return this._integrator.unintegrate()
			case 'sendDesktopConfig':
				return Promise.all([
					this._desktopUtils.checkIsMailtoHandler(),
					this._integrator.isAutoLaunchEnabled(),
					this._integrator.isIntegrated()
				]).then(([isMailtoHandler, autoLaunchEnabled, isIntegrated]) => {
					const config = this._conf.getVar()
					config.isMailtoHandler = isMailtoHandler
					config.runOnStartup = autoLaunchEnabled
					config.isIntegrated = isIntegrated
					config.updateInfo = !!this._updater
						? this._updater.updateInfo
						: null
					return config
				})
			case 'openFileChooser':
				if (args[1]) { // open folder dialog
					return this._electron.dialog.showOpenDialog(null, {properties: ['openDirectory']}).then(({filePaths}) => filePaths)
				} else { // open file
					return Promise.resolve([])
				}
			case 'open':
				// itemPath, mimeType
				const itemPath = args[0].toString()
				return this._dl.open(itemPath)
			case 'download':
				// sourceUrl, filename, headers
				return this._dl.downloadNative(...args.slice(0, 3))
			case 'saveBlob':
				// args: [data.name, uint8ArrayToBase64(data.data)]
				const filename: string = downcast(args[0])
				const data: Uint8Array = base64ToUint8Array(downcast(args[1]))
				return this._dl.saveBlob(filename, data, neverNull(this._wm.get(windowId)))
			case "aesDecryptFile":
				// key, path
				return this._crypto.aesDecryptFile(...args.slice(0, 2))
			case 'updateDesktopConfig':
				return this._conf.setVar('any', args[0])
			case 'openNewWindow':
				this._wm.newWindow(true)
				return Promise.resolve()
			case 'enableAutoLaunch':
				return this._integrator.enableAutoLaunch()
			case 'disableAutoLaunch':
				return this._integrator.disableAutoLaunch()
			case 'getPushIdentifier':
				const uInfo = {
					userId: args[0].toString(),
					mailAddress: args[1].toString()
				}
				// we know there's a logged in window
				// first, send error report if there is one
				return this._err.sendErrorReport(windowId)
				           .then(() => {
					           const w = this._wm.get(windowId)
					           if (!w) return
					           w.setUserInfo(uInfo)
					           if (!w.isHidden()) {
						           this._notifier.resolveGroupedNotification(uInfo.userId)
					           }
					           const sseInfo = this._sse.getPushIdentifier()
					           return sseInfo && sseInfo.identifier
				           })
			case 'storePushIdentifierLocally':
				return Promise.all([
					this._sse.storePushIdentifier(
						args[0].toString(),
						args[1].toString(),
						args[2].toString()
					),
					this._alarmStorage.storePushIdentifierSessionKey(
						args[3].toString(),
						args[4].toString()
					)
				]).then(() => {})
			case 'initPushNotifications':
				// Nothing to do here because sse connection is opened when starting the native part.
				return Promise.resolve()
			case 'closePushNotifications':
				// only gets called in the app
				// the desktop client closes notifications on window focus
				return Promise.resolve()
			case 'sendSocketMessage':
				// for admin client integration
				this._sock.sendSocketMessage(args[0])
				return Promise.resolve()
			case 'getLog':
				return Promise.resolve(global.logger.getEntries())
			case 'changeLanguage':
				return lang.setLanguage(args[0])
			case 'manualUpdate':
				return !!this._updater
					? this._updater.manualUpdate()
					: Promise.resolve(false)
			case 'isUpdateAvailable':
				return !!this._updater
					? Promise.resolve(this._updater.updateInfo)
					: Promise.resolve(null)
			case 'saveBundleAsMsg': {
				const bundle = args[0]
				return getExportDirectoryPath(TMP_DIR)
					.then(dir => makeMsgFile(bundle)
						.then(file => writeFile(dir, file)))
			}
			case 'queryAvailableMsgs': {
				const mails: Array<Mail> = args[0]
				// return all mails that havent already been exported
				return mapAndFilterNullAsync(mails, mail => msgFileExists(mail._id, TMP_DIR)
					.then(exists => exists ? null : mail))
			}
			case 'dragExportedMails': {
				const ids: Array<IdTuple> = args[0]
				const getExportPath = id => getExportDirectoryPath(TMP_DIR).then(p => path.join(p, mailIdToFileName(id, "msg")))
				return Promise.all(ids.map(getExportPath))
				              .then(files => files.filter(fileExists))
				              .then(files => {
					              this._wm.get(windowId)?._browserWindow.webContents.startDrag({
						              files,
						              icon: this._dragIcon
					              })
				              })
			}
			case 'focusApplicationWindow': {
				this._wm.get(windowId)?.browserWindow.focus()
				return Promise.resolve()
			}
			default:
				return Promise.reject(new Error(`Invalid Method invocation: ${method}`))
		}
	}

	sendRequest(windowId: number, type: JsRequestType, args: Array<any>): Promise<Object> {
		return this.initialized(windowId).then(() => {
			const requestId = this._createRequestId();
			const request = {
				id: requestId,
				type: type,
				args: args,
			}
			const w = this._wm.get(windowId)
			if (w) {
				w.sendMessageToWebContents(request)
			}
			return new Promise((resolve, reject) => {
				this._queue[requestId] = (err, result) => err ? reject(err) : resolve(result)
			})
		})
	}

	_createRequestId(): string {
		if (this._requestId >= Number.MAX_SAFE_INTEGER) {
			this._requestId = 0
		}
		return "desktop" + this._requestId++
	}

	initialized(windowId: number): Promise<void> {
		if (this._initialized[windowId]) {
			return this._initialized[windowId].promise
		} else {
			return Promise.reject(new Error("Tried to call ipc function on nonexistent window"))
		}
	}

	addWindow(id: number) {
		this._initialized[id] = defer()

		const sseValueListener = (value: ?SseInfo) => {
			if (value && value.userIds.length === 0) {
				log.debug("invalidating alarms for window", id)
				this.sendRequest(id, "invalidateAlarms", [])
				    .catch((e) => {
					    log.debug("Could not invalidate alarms for window ", id, e)
					    this._conf.removeListener(DesktopConfigKey.pushIdentifier, sseValueListener)
				    })
			}
		}
		this._conf.on(DesktopConfigKey.pushIdentifier, sseValueListener, true)
	}

	removeWindow(id: number) {
		delete this._initialized[id]
	}
}
