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
import {Logger} from "../../api/common/Logger.js"
import {getExportDirectoryPath, makeMsgFile, writeFile} from "../DesktopFileExport.js"
import {DataFile} from "../../api/common/DataFile.js"
import {fileExists} from "../PathUtils.js"
import path from "path"
import {DesktopUtils} from "../DesktopUtils.js"
import {Socketeer} from "../Socketeer.js"
import {InterWindowEventSender} from "../../native/common/InterWindowEventBus.js"
import {InterWindowEventTypes} from "../../native/common/InterWindowEventTypes.js"
import {DesktopSearchTextInAppFacade} from "../DesktopSearchTextInAppFacade.js"
import {SettingsFacade} from "../../native/common/generatedipc/SettingsFacade.js"

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
		private readonly desktopUtils: DesktopUtils,
		private readonly sock: Socketeer,
		private readonly webDialogController: WebDialogController,
		private readonly notifier: DesktopNotifier,
		private readonly nativeCredentialsFacade: NativeCredentialsFacade,
		private readonly desktopCrypto: NativeCryptoFacade,
		private readonly pushFacade: NativePushFacade,
		private readonly settingsFacade: SettingsFacade,
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
			this.settingsFacade,
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
			"readDataFile": ({args}) => {
				const location = args[0]
				return this.desktopUtils.readDataFile(location)
			},

			"openNewWindow": ({args}) => {
				this.wm.newWindow(true)
				return Promise.resolve()
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