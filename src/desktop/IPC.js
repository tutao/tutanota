// @flow
import {dialog, ipcMain, nativeImage} from 'electron'
import {lang} from "../misc/LanguageViewModel"
import type {WindowManager} from "./DesktopWindowManager.js"
import {err} from './DesktopErrorHandler.js'
import {defer} from '../api/common/utils/Utils.js'
import type {DeferredObject} from "../api/common/utils/Utils"
import {downcast, noOp} from "../api/common/utils/Utils"
import {errorToObj, objToError} from "../api/common/WorkerProtocol"
import DesktopUtils from "../desktop/DesktopUtils"
import type {DesktopConfig} from "./config/DesktopConfig"
import {DesktopConfigKey} from "./config/DesktopConfig"
import {
	disableAutoLaunch,
	enableAutoLaunch,
	integrate,
	isAutoLaunchEnabled,
	isIntegrated,
	unintegrate
} from "./integration/DesktopIntegrator"
import type {DesktopSseClient} from './sse/DesktopSseClient.js'
import type {DesktopNotifier} from "./DesktopNotifier"
import type {Socketeer} from "./Socketeer"
import type {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import type {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {SseInfo} from "./sse/DesktopSseClient"
import {base64ToUint8Array} from "../api/common/utils/Encoding"
import type {ElectronUpdater} from "./ElectronUpdater"

/**
 * node-side endpoint for communication between the renderer thread and the node thread
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

	constructor(
		conf: DesktopConfig,
		notifier: DesktopNotifier,
		sse: DesktopSseClient,
		wm: WindowManager,
		sock: Socketeer,
		alarmStorage: DesktopAlarmStorage,
		desktopCryptoFacade: DesktopCryptoFacade,
		dl: DesktopDownloadManager,
		updater: ?ElectronUpdater
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
		if (!!this._updater) {
			this._updater.setUpdateDownloadedListener(() => {
				this._wm.getAll().forEach(w => this.sendRequest(w.id, 'appUpdateDownloaded', []))
			})
		}

		this._initialized = []
		this._queue = {}
	}

	_invokeMethod(windowId: number, method: NativeRequestType, args: Array<Object>): Promise<any> {

		switch (method) {
			case 'init':
				if (!this.initialized(windowId).isFulfilled()) {
					this._initialized[windowId].resolve()
				}
				return Promise.resolve(process.platform)
			case 'findInPage':
				return this.initialized(windowId).then(() => {
					const w = this._wm.get(windowId)
					if (w) {
						return w.findInPage(args)
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
				return DesktopUtils.registerAsMailtoHandler(true)
			case 'unregisterMailto':
				return DesktopUtils.unregisterAsMailtoHandler(true)
			case 'integrateDesktop':
				return integrate()
			case 'unIntegrateDesktop':
				return unintegrate()
			case 'sendDesktopConfig':
				return Promise.join(
					DesktopUtils.checkIsMailtoHandler(),
					isAutoLaunchEnabled(),
					isIntegrated(),
					(isMailtoHandler, autoLaunchEnabled, isIntegrated) => {
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
					return dialog.showOpenDialog(null, {properties: ['openDirectory']}).then(({filePaths}) => filePaths)
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
				return this._dl.saveBlob(filename, data, this._wm.get(windowId))
			case "aesDecryptFile":
				// key, path
				return this._crypto.aesDecryptFile(...args.slice(0, 2))
			case 'updateDesktopConfig':
				return this._conf.setVar('any', args[0])
			case 'openNewWindow':
				this._wm.newWindow(true)
				return Promise.resolve()
			case 'showWindow':
				return this.initialized(windowId).then(() => {
					const w = this._wm.get(windowId)
					if (w) {
						w.show()
					}
				})
			case 'enableAutoLaunch':
				return enableAutoLaunch()
			case 'disableAutoLaunch':
				return disableAutoLaunch()
			case 'getPushIdentifier':
				const uInfo = {
					userId: args[0].toString(),
					mailAddress: args[1].toString()
				}
				// we know there's a logged in window
				// first, send error report if there is one
				return err.sendErrorReport(windowId)
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
				]).return()
			case 'initPushNotifications':
				this._sse.connect()
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
			case 'unload':
				// On reloading the page reset window state to non-initialized because render process starts from scratch.
				this.removeWindow(windowId)
				this.addWindow(windowId)
				return Promise.resolve()
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
			case 'dragExport': {
				const w = this._wm.get(windowId)
				if (w) {
					return DesktopUtils.writeFilesToTmp(args).then(files => w.startDrag({
						files,
						icon: nativeImage.createEmpty()
					}))
				}
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
				w.sendMessageToWebContents(windowId, request)
			}
			return Promise.fromCallback(cb => {
				this._queue[requestId] = cb
			});
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
		ipcMain.on(String(id), (ev: Event, msg: string) => {
			const request = JSON.parse(msg)
			if (request.type === "response") {
				this._queue[request.id](null, request.value);
			} else if (request.type === "requestError") {
				this._queue[request.id](objToError((request: any).error), null)
				delete this._queue[request.id]
			} else {
				const w = this._wm.get(id)
				this._invokeMethod(id, request.type, request.args)
				    .then(result => {
					    const response = {
						    id: request.id,
						    type: "response",
						    value: result,
					    }
					    if (w) w.sendMessageToWebContents(id, response)
				    })
				    .catch((e) => {
					    const response = {
						    id: request.id,
						    type: "requestError",
						    error: errorToObj(e),
					    }
					    if (w) w.sendMessageToWebContents(id, response)
				    })
			}
		})

		const sseValueListener = (value: ?SseInfo) => {
			if (value && value.userIds.length === 0) {
				console.log("invalidating alarms for window", id)
				this.sendRequest(id, "invalidateAlarms", [])
				    .catch((e) => {
					    console.log("Could not invalidate alarms for window ", id, e)
					    this._conf.removeListener(DesktopConfigKey.pushIdentifier, sseValueListener)
				    })
			}
		}
		this._conf.on(DesktopConfigKey.pushIdentifier, sseValueListener, true)
	}

	removeWindow(id: number) {
		ipcMain.removeAllListeners(`${id}`)
		delete this._initialized[id]
	}
}
