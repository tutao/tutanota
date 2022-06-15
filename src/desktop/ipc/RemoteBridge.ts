import * as electron from "electron"
import {DesktopFacade} from "../../native/common/generatedipc/DesktopFacade.js"
import {CommonNativeFacade} from "../../native/common/generatedipc/CommonNativeFacade.js"
import {ApplicationWindow} from "../ApplicationWindow.js"
import {exposeLocal, exposeRemote} from "../../api/common/WorkerProxy.js"
import {ExposedNativeInterface} from "../../native/common/NativeInterface.js"
import {DesktopWebauthn} from "../2fa/DesktopWebauthn.js"
import {DesktopInterWindowEventSender} from "./DesktopInterWindowEventSender.js"
import {DesktopPostLoginActions} from "../DesktopPostLoginActions.js"
import {err} from "../DesktopErrorHandler.js"
import {ElectronWebContentsTransport} from "./ElectronWebContentsTransport.js"
import {DesktopGlobalDispatcher} from "../../native/common/generatedipc/DesktopGlobalDispatcher.js"
import {DesktopFileFacade} from "../DesktopFileFacade.js"
import fs from "fs"
import {defer} from "@tutao/tutanota-utils"
import {MessageDispatcher, Request} from "../../api/common/MessageDispatcher.js"
import {DesktopFacadeSendDispatcher} from "../../native/common/generatedipc/DesktopFacadeSendDispatcher.js"
import {CommonNativeFacadeSendDispatcher} from "../../native/common/generatedipc/CommonNativeFacadeSendDispatcher.js"
import {CentralIpcHandler, IpcConfig} from "./CentralIpcHandler.js"
import {OfflineDbFacade} from "../db/OfflineDbFacade.js"
import {WindowManager} from "../DesktopWindowManager.js"
import {DesktopDownloadManager} from "../DesktopDownloadManager.js"
import {WebDialogController} from "../WebDialog.js"
import {DesktopNotifier} from "../DesktopNotifier.js"
import {NativeCredentialsFacade} from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import {NativeCryptoFacade} from "../../native/common/generatedipc/NativeCryptoFacade.js"
import {NativePushFacade} from "../../native/common/generatedipc/NativePushFacade.js"
import {ThemeFacade} from "../../native/common/generatedipc/ThemeFacade.js"
import {DesktopConfig} from "../config/DesktopConfig.js"
import {ElectronUpdater} from "../ElectronUpdater.js"
import {log} from "../DesktopLog.js"
import {Logger} from "../../api/common/Logger.js"
import {lang} from "../../misc/LanguageViewModel.js"
import {getExportDirectoryPath, makeMsgFile, writeFile} from "../DesktopFileExport.js"
import {DataFile} from "../../api/common/DataFile.js"
import {fileExists} from "../PathUtils.js"
import path from "path"
import {DesktopUtils} from "../DesktopUtils.js"
import {DesktopIntegrator} from "../integration/DesktopIntegrator.js"
import {Socketeer} from "../Socketeer.js"
import {InterWindowEventSender} from "../../native/common/InterWindowEventBus.js"
import {InterWindowEventTypes} from "../../native/common/InterWindowEventTypes.js"
import {DesktopSearchTextInAppFacade} from "../DesktopSearchTextInAppFacade.js"

export interface SendingFacades {
	desktopFacade: DesktopFacade
	commonNativeFacade: CommonNativeFacade
	interWindowEventSender: InterWindowEventSender<InterWindowEventTypes>
}


const primaryIpcConfig: IpcConfig<"to-main", "to-renderer"> = {
	renderToMainEvent: "to-main",
	mainToRenderEvent: "to-renderer",
} as const
// Must be created only once
const primaryIpcHandler = new CentralIpcHandler(electron.ipcMain, primaryIpcConfig)
export type PrimaryIpcHandler = typeof primaryIpcHandler

export class RemoteBridge {

	constructor(
		private readonly offlineDbFacade: OfflineDbFacade,
		private readonly wm: WindowManager,
		private readonly dl: DesktopDownloadManager,
		private readonly conf: DesktopConfig,
		private readonly updater: ElectronUpdater,
		private readonly desktopUtils: DesktopUtils,
		private readonly integrator: DesktopIntegrator,
		private readonly sock: Socketeer,
		private readonly webDialogController: WebDialogController,
		private readonly notifier: DesktopNotifier,
		private readonly nativeCredentialsFacade: NativeCredentialsFacade,
		private readonly desktopCrypto: NativeCryptoFacade,
		private readonly pushFacade: NativePushFacade,
		private readonly themeFacade: ThemeFacade,
	) {
	}

	createBridge(window: ApplicationWindow): SendingFacades {
		const webContents = window._browserWindow.webContents
		const windowId = window.id
		const facadeHandler = exposeLocal<ExposedNativeInterface, "facade">({
			webauthn: new DesktopWebauthn(windowId, this.webDialogController),
			offlineDbFacade: this.offlineDbFacade,
			interWindowEventSender: new DesktopInterWindowEventSender(this.wm, windowId),
			postLoginActions: new DesktopPostLoginActions(this.wm, err, this.notifier, windowId)
		})

		const transport = new ElectronWebContentsTransport<typeof primaryIpcConfig, JsRequestType, NativeRequestType>(webContents, primaryIpcHandler)
		const dispatcher = new DesktopGlobalDispatcher(
			new DesktopFileFacade(this.dl, electron, fs),
			this.nativeCredentialsFacade,
			this.desktopCrypto,
			this.pushFacade,
			new DesktopSearchTextInAppFacade(window),
			this.themeFacade
		)
		let initDefer = defer()
		const NOT_IMPLEMENTED = async () => {
			throw new Error("Not implemented!")
		}
		const messageDispatcher = new MessageDispatcher<JsRequestType, NativeRequestType>(transport, {
			"init": async () => {
				initDefer.resolve(null)
				return "desktop"
			},
			"facade": facadeHandler,
			"ipc": async ({args}) => {
				const [facade, method, ...methodArgs] = args
				await initDefer
				return dispatcher.dispatch(facade, method, methodArgs)
			},
			"getConfigValue": async ({args}) => {
				return this.conf.getVar(args[0])
			},
			"setConfigValue": async ({args}) => {
				const [key, value] = args.slice(0, 2)
				return this.conf.setVar(key, value)
			},
			"isUpdateAvailable": async () => {
				return !!this.updater ? Promise.resolve(this.updater.updateInfo) : Promise.resolve(null)
			},
			"registerMailto": ({args}) => {
				return this.desktopUtils.registerAsMailtoHandler()
			},

			"unregisterMailto": ({args}) => {
				return this.desktopUtils.unregisterAsMailtoHandler()
			},

			"integrateDesktop": ({args}) => {
				return this.integrator.integrate()
			},

			"unIntegrateDesktop": ({args}) => {
				return this.integrator.unintegrate()
			},

			"getSpellcheckLanguages": ({args}) => {
				const ses = electron.session.defaultSession
				return Promise.resolve(ses.availableSpellCheckerLanguages)
			},
			"getIntegrationInfo": async ({args}) => {
				const [isMailtoHandler, isAutoLaunchEnabled, isIntegrated, isUpdateAvailable] = await Promise.all([
					this.desktopUtils.checkIsMailtoHandler(),
					this.integrator.isAutoLaunchEnabled(),
					this.integrator.isIntegrated(),
					Boolean(this.updater && this.updater.updateInfo),
				])

				return {
					isMailtoHandler,
					isAutoLaunchEnabled,
					isIntegrated,
					isUpdateAvailable,
				}
			},

			"readDataFile": ({args}) => {
				const location = args[0]
				return this.desktopUtils.readDataFile(location)
			},

			"openNewWindow": ({args}) => {
				this.wm.newWindow(true)
				return Promise.resolve()
			},
			"enableAutoLaunch": ({args}) => {
				return this.integrator.enableAutoLaunch().catch(e => {
					log.debug("could not enable auto launch:", e)
				})
			},
			"disableAutoLaunch": ({args}) => {
				return this.integrator.disableAutoLaunch().catch(e => {
					log.debug("could not disable auto launch:", e)
				})
			},
			"sendSocketMessage": ({args}) => {
				// for admin client integration
				this.sock.sendSocketMessage(args[0])
				return Promise.resolve()
			},
			"getLog": ({args}) => {
				// @ts-ignore
				const logger: Logger = global.logger
				return Promise.resolve(logger.getEntries())
			},
			"changeLanguage": ({args}) => {
				return lang.setLanguage(args[0])
			},
			"manualUpdate": ({args}) => {
				return !!this.updater ? this.updater.manualUpdate() : Promise.resolve(false)
			},

			"mailToMsg": ({args}) => {
				const bundle = args[0]
				const fileName = args[1]
				return makeMsgFile(bundle, fileName)
			},

			"saveToExportDir": async ({args}) => {
				const file: DataFile = args[0]
				const exportDir = await getExportDirectoryPath(this.dl)
				return writeFile(exportDir, file)
			},
			"startNativeDrag": async ({args}) => {
				const filenames = args[0]
				await this.wm.startNativeDrag(filenames, windowId)
				return Promise.resolve()
			},
			"focusApplicationWindow": ({args}) => {
				const window = this.wm.get(windowId)

				window && window.focus()
				return Promise.resolve()
			},

			"checkFileExistsInExportDirectory": async ({args}) => {
				const fileName = args[0]
				return fileExists(path.join(await getExportDirectoryPath(this.dl), fileName))
			},
			"reload": async ({args}) => {
				// Response to this message will come to the web but it won't have a handler for it. We accept it for now.
				initDefer = defer()
				window.reload(args[0])
			},
			shareText: NOT_IMPLEMENTED,
			openLink: NOT_IMPLEMENTED,
			findSuggestions: NOT_IMPLEMENTED,
			getDeviceLog: NOT_IMPLEMENTED,
			putFileIntoDownloads: NOT_IMPLEMENTED,
		})
		const nativeInterface = {
			invokeNative: (requestType: string, args: ReadonlyArray<unknown>): Promise<any> => {
				return messageDispatcher.postRequest(new Request(requestType as JsRequestType, args))
			}
		}
		const exposedNativeInterface = exposeRemote<ExposedNativeInterface>((message) => messageDispatcher.postRequest(message))
		return {
			desktopFacade: new DesktopFacadeSendDispatcher(nativeInterface),
			commonNativeFacade: new CommonNativeFacadeSendDispatcher(nativeInterface),
			interWindowEventSender: exposedNativeInterface.interWindowEventSender
		}
	}

	destroyBridge(window: ApplicationWindow) {
		primaryIpcHandler.removeHandler(window._browserWindow.webContents.id)
	}
}