import {lang} from "../misc/LanguageViewModel"
import type {WindowManager} from "./DesktopWindowManager"
import {objToError} from "../api/common/utils/Utils"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {base64ToUint8Array, defer, downcast, getFromMap, noOp} from "@tutao/tutanota-utils"
import {Request, RequestError, Response} from "../api/common/MessageDispatcher"
import type {DesktopConfig} from "./config/DesktopConfig"
import type {DesktopSseClient} from "./sse/DesktopSseClient"
import type {DesktopNotifier} from "./DesktopNotifier"
import type {Socketeer} from "./Socketeer"
import type {DesktopAlarmStorage} from "./sse/DesktopAlarmStorage"
import type {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {ElectronUpdater} from "./ElectronUpdater"
import {log} from "./DesktopLog"
import type {DesktopUtils} from "./DesktopUtils"
import type {DesktopErrorHandler} from "./DesktopErrorHandler"
import type {DesktopIntegrator} from "./integration/DesktopIntegrator"
import {getExportDirectoryPath, makeMsgFile, writeFile} from "./DesktopFileExport"
import {fileExists} from "./PathUtils"
import path from "path"
import {DesktopAlarmScheduler} from "./sse/DesktopAlarmScheduler"
import {ElectronExports, WebContentsEvent} from "./ElectronExportTypes";
import {DataFile} from "../api/common/DataFile";
import {Logger} from "../api/common/Logger"
import {DesktopGlobalDispatcher} from "../native/common/generatedipc/DesktopGlobalDispatcher"
import {DektopCredentialsEncryption} from "./credentials/DektopCredentialsEncryption"
import {exposeLocal} from "../api/common/WorkerProxy"
import {ExposedNativeInterface, NativeInterface} from "../native/common/NativeInterface"
import {FileUri} from "../native/common/FileApp"
import {DesktopFacadeSendDispatcher} from "../native/common/generatedipc/DesktopFacadeSendDispatcher.js"

type FacadeHandler = (message: Request<"facade">) => Promise<any>

/**
 * node-side endpoint for communication between the renderer threads and the node thread
 */
export class IPC {
	readonly _conf: DesktopConfig
	readonly _sse: DesktopSseClient
	readonly _wm: WindowManager
	readonly _notifier: DesktopNotifier
	readonly _sock: Socketeer
	readonly _alarmStorage: DesktopAlarmStorage
	readonly _alarmScheduler: DesktopAlarmScheduler
	readonly _crypto: DesktopCryptoFacade
	readonly _dl: DesktopDownloadManager
	readonly _updater: ElectronUpdater | null
	readonly _electron: ElectronExports
	readonly _desktopUtils: DesktopUtils
	readonly _err: DesktopErrorHandler
	readonly _integrator: DesktopIntegrator
	readonly _credentialsEncryption: DektopCredentialsEncryption
	_initialized: Array<DeferredObject<void>>
	_requestId: number = 0
	readonly _queue: Record<string, (...args: Array<any>) => any>
	private readonly facadeHandlerPerWindow: Map<number, FacadeHandler> = new Map()

	constructor(
		conf: DesktopConfig,
		notifier: DesktopNotifier,
		sse: DesktopSseClient,
		wm: WindowManager,
		sock: Socketeer,
		alarmStorage: DesktopAlarmStorage,
		desktopCryptoFacade: DesktopCryptoFacade,
		dl: DesktopDownloadManager,
		updater: ElectronUpdater | null,
		electron: ElectronExports,
		desktopUtils: DesktopUtils,
		errorHandler: DesktopErrorHandler,
		integrator: DesktopIntegrator,
		alarmScheduler: DesktopAlarmScheduler,
		credentialsEncryption: DektopCredentialsEncryption,
		private readonly exposedInterfaceFactory: (windowId: number, ipc: IPC) => ExposedNativeInterface,
		private readonly dispatcher: DesktopGlobalDispatcher,
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
		this._alarmScheduler = alarmScheduler
		this._credentialsEncryption = credentialsEncryption

		if (!!this._updater) {
			this._updater.setUpdateDownloadedListener(() => {
				for (let applicationWindow of this._wm.getAll()) {
					new DesktopFacadeSendDispatcher(this.getNativeInterfaceForWindow(applicationWindow.id)).appUpdateDownloaded()
				}
			})
		}

		this._initialized = []
		this._queue = {}
		this._err = errorHandler

		this._electron.ipcMain.handle("to-main", (ev: WebContentsEvent, request: any) => {
			const senderWindow = this._wm.getEventSender(ev)

			if (!senderWindow) return // no one is listening anymore

			const windowId = senderWindow.id

			if (request.type === "response") {
				this._queue[request.id](null, request.value)
			} else if (request.type === "requestError") {
				this._queue[request.id](objToError((request as any).error), null)

				delete this._queue[request.id]
			} else {
				this._invokeMethod(windowId, request.requestType, request.args)
					.then(result => {
						const response = new Response(request.id, result)

						const w = this._wm.get(windowId)

						if (w) w.sendMessageToWebContents(response)
					})
					.catch(e => {
						const response = new RequestError(request.id, e)

						const w = this._wm.get(windowId)
						if (w) w.sendMessageToWebContents(response)
					})
			}
		})
	}

	async _invokeMethod(windowId: number, method: NativeRequestType, args: Array<any>): Promise<any> {
		switch (method) {
			case "init":
				// Mark ourselves as initialized *after* we answer.
				// This simplifies some cases e.g. testing.
				Promise.resolve().then(() => this._initialized[windowId].resolve())
				return null
			case "findInPage":
				return this.initialized(windowId).then(() => {
					const w = this._wm.get(windowId)

					return w != null ? w.findInPage(downcast(args)) : null
				})

			case "stopFindInPage":
				return this.initialized(windowId)
						   .then(() => {
							   const w = this._wm.get(windowId)

							   if (w) {
								   w.stopFindInPage()
							   }
						   })
						   .catch(noOp)

			case "setSearchOverlayState": {
				const w = this._wm.get(windowId)

				if (w) {
					const state: boolean = downcast(args[0])
					const force: boolean = downcast(args[1])
					w.setSearchOverlayState(state, force)
				}

				return Promise.resolve()
			}

			case "registerMailto":
				return this._desktopUtils.registerAsMailtoHandler()

			case "unregisterMailto":
				return this._desktopUtils.unregisterAsMailtoHandler()

			case "integrateDesktop":
				return this._integrator.integrate()

			case "unIntegrateDesktop":
				return this._integrator.unintegrate()

			case "getConfigValue":
				return this._conf.getVar(args[0])

			case "getSpellcheckLanguages": {
				const ses = this._electron.session.defaultSession
				return Promise.resolve(ses.availableSpellCheckerLanguages)
			}

			case "getIntegrationInfo":
				const [isMailtoHandler, isAutoLaunchEnabled, isIntegrated, isUpdateAvailable] = await Promise.all([
					this._desktopUtils.checkIsMailtoHandler(),
					this._integrator.isAutoLaunchEnabled(),
					this._integrator.isIntegrated(),
					Boolean(this._updater && this._updater.updateInfo),
				])
				return {
					isMailtoHandler,
					isAutoLaunchEnabled,
					isIntegrated,
					isUpdateAvailable,
				}

			case "openFileChooser":
				const openFolderDialog = args[1]
				if (openFolderDialog) {
					// open folder dialog
					return this._electron.dialog
							   .showOpenDialog({
								   properties: ["openDirectory"],
							   })
							   .then(({filePaths}) => filePaths)
				} else {
					// open file
					return Promise.resolve([])
				}

			case "readDataFile": {
				const location = args[0]
				return this._desktopUtils.readDataFile(location)
			}

			case "saveDataFile": {
				// args: [data.name, uint8ArrayToBase64(data.data)]
				const filename: string = downcast(args[0])
				const data: Uint8Array = base64ToUint8Array(downcast(args[1]))
				return this._dl.saveDataFile(filename, data)
			}

			case "aesDecryptFile": {
				const encodedKey: string = args[0]
				const fileUri: FileUri = args[1]
				const targetDir = this._desktopUtils.getTutanotaTempPath("decrypted")
				return this._crypto.aesDecryptFile(encodedKey, fileUri, targetDir)
			}

			case "setConfigValue": {
				const [key, value] = args.slice(0, 2)
				return this._conf.setVar(key, value)
			}
			case "openNewWindow": {
				this._wm.newWindow(true)

				return Promise.resolve()
			}
			case "enableAutoLaunch": {
				return this._integrator.enableAutoLaunch().catch(e => {
					log.debug("could not enable auto launch:", e)
				})
			}
			case "disableAutoLaunch": {
				return this._integrator.disableAutoLaunch().catch(e => {
					log.debug("could not disable auto launch:", e)
				})
			}
			case "getPushIdentifier": {
				const uInfo = {
					userId: args[0].toString(),
					mailAddress: args[1].toString(),
				}
				// we know there's a logged in window
				// first, send error report if there is one
				return this._err.sendErrorReport(windowId).then(async () => {
					const w = this._wm.get(windowId)

					if (!w) return
					w.setUserInfo(uInfo)

					if (!w.isHidden()) {
						this._notifier.resolveGroupedNotification(uInfo.userId)
					}

					const sseInfo = await this._sse.getSseInfo()
					return sseInfo && sseInfo.identifier
				})
			}
			case "storePushIdentifierLocally": {
				return Promise.all([
					this._sse.storePushIdentifier(args[0].toString(), args[1].toString(), args[2].toString()),
					this._alarmStorage.storePushIdentifierSessionKey(args[3].toString(), args[4].toString()),
				]).then(() => {
				})
			}
			case "initPushNotifications": {
				// Nothing to do here because sse connection is opened when starting the native part.
				return Promise.resolve()
			}
			case "closePushNotifications": {
				// only gets called in the app
				// the desktop client closes notifications on window focus
				return Promise.resolve()
			}
			case "sendSocketMessage": {
				// for admin client integration
				this._sock.sendSocketMessage(args[0])

				return Promise.resolve()
			}
			case "getLog": {
				// @ts-ignore
				const logger: Logger = global.logger
				return Promise.resolve(logger.getEntries())
			}
			case "changeLanguage": {
				return lang.setLanguage(args[0])
			}
			case "manualUpdate": {
				return !!this._updater ? this._updater.manualUpdate() : Promise.resolve(false)
			}
			case "isUpdateAvailable": {
				return !!this._updater ? Promise.resolve(this._updater.updateInfo) : Promise.resolve(null)
			}
			case "mailToMsg": {
				const bundle = args[0]
				const fileName = args[1]
				return makeMsgFile(bundle, fileName)
			}

			case "saveToExportDir": {
				const file: DataFile = args[0]
				const exportDir = await getExportDirectoryPath(this._dl)
				return writeFile(exportDir, file)
			}

			case "startNativeDrag": {
				const filenames = args[0]
				await this._wm.startNativeDrag(filenames, windowId)
				return Promise.resolve()
			}

			case "focusApplicationWindow": {
				const window = this._wm.get(windowId)

				window && window.focus()
				return Promise.resolve()
			}

			case "checkFileExistsInExportDirectory": {
				const fileName = args[0]
				return fileExists(path.join(await getExportDirectoryPath(this._dl), fileName))
			}

			case "scheduleAlarms": {
				const alarms = args[0]

				for (const alarm of alarms) {
					await this._alarmScheduler.handleAlarmNotification(alarm)
				}

				return
			}

			case "reload": {
				// Response to this message will come to the web but it won't have a handler for it. We accept it for now.
				this.removeWindow(windowId)

				const window = this._wm.get(windowId)

				if (window) {
					this.addWindow(windowId)
					window.reload(args[0])
				}

				return
			}

			case "encryptUsingKeychain": {
				const [mode, decryptedKey] = args
				return this._credentialsEncryption.encryptUsingKeychain(decryptedKey, mode)
			}

			case "decryptUsingKeychain": {
				const [mode, encryptedKey] = args
				return this._credentialsEncryption.decryptUsingKeychain(encryptedKey, mode)
			}

			case "getSupportedEncryptionModes": {
				return this._credentialsEncryption.getSupportedEncryptionModes()
			}

			case 'getSize': {
				const file: FileUri = args[0]
				return this._dl.getSize(file)
			}

			case "facade": {
				return this.getHandlerForWindow(windowId)(new Request(method, args))
			}
			case "ipc": {
				const [facade, method, ...methodArgs] = args
				return this.dispatcher.dispatch(facade, method, methodArgs)
			}
			default: {
				return Promise.reject(new Error(`Invalid Method invocation: ${method}`))
			}
		}
	}

	private getHandlerForWindow(windowId: number): FacadeHandler {
		return getFromMap(this.facadeHandlerPerWindow, windowId, () => exposeLocal(this.exposedInterfaceFactory(windowId, this)))
	}

	async sendRequest(windowId: number, type: JsRequestType, args: ReadonlyArray<any>): Promise<Record<string, any>> {
		await this.initialized(windowId)
		const requestId = this._createRequestId()

		const request = new Request(type, args, requestId)

		const w = this._wm.get(windowId)

		w?.sendMessageToWebContents(request)

		return new Promise((resolve, reject) => {
			this._queue[requestId] = (err, result) => (err ? reject(err) : resolve(result))
		})
	}

	getNativeInterfaceForWindow(windowId: number): NativeInterface {
		return {
			invokeNative: (requestType: string, args: ReadonlyArray<unknown>): Promise<any> => {
				return this.sendRequest(windowId, requestType as JsRequestType, args)
			}
		}
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
	}

	removeWindow(id: number) {
		delete this._initialized[id]
		this.facadeHandlerPerWindow.delete(id)
	}
}