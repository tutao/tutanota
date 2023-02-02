import { DesktopFacade } from "../../native/common/generatedipc/DesktopFacade.js"
import { CommonNativeFacade } from "../../native/common/generatedipc/CommonNativeFacade.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { ElectronWebContentsTransport, IpcConfig } from "./ElectronWebContentsTransport.js"
import { DesktopGlobalDispatcher } from "../../native/common/generatedipc/DesktopGlobalDispatcher.js"
import { MessageDispatcher, Request } from "../../api/common/MessageDispatcher.js"
import { DesktopFacadeSendDispatcher } from "../../native/common/generatedipc/DesktopFacadeSendDispatcher.js"
import { CommonNativeFacadeSendDispatcher } from "../../native/common/generatedipc/CommonNativeFacadeSendDispatcher.js"
import { DesktopCommonSystemFacade } from "../DesktopCommonSystemFacade.js"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { ImapImportFacade } from "../../native/common/generatedipc/ImapImportFacade.js"
import { ImapImportFacadeSendDispatcher } from "../../native/common/generatedipc/ImapImportFacadeSendDispatcher.js"

export interface SendingFacades {
	desktopFacade: DesktopFacade
	commonNativeFacade: CommonNativeFacade
	interWindowEventSender: InterWindowEventFacadeSendDispatcher
	imapImportFacade: ImapImportFacade
}

const primaryIpcConfig: IpcConfig<"to-main", "to-renderer"> = {
	renderToMainEvent: "to-main",
	mainToRenderEvent: "to-renderer",
} as const

export type DispatcherFactory = (window: ApplicationWindow) => { desktopCommonSystemFacade: DesktopCommonSystemFacade; dispatcher: DesktopGlobalDispatcher }
export type FacadeHandler = (message: Request<"facade">) => Promise<any>
export type FacadeHandlerFactory = (window: ApplicationWindow) => FacadeHandler

export class RemoteBridge {
	constructor(private readonly dispatcherFactory: DispatcherFactory, private readonly facadeHandlerFactory: FacadeHandlerFactory) {}

	createBridge(window: ApplicationWindow): SendingFacades {
		const webContents = window._browserWindow.webContents
		const { desktopCommonSystemFacade, dispatcher } = this.dispatcherFactory(window)
		const facadeHandler = this.facadeHandlerFactory(window)

		const transport = new ElectronWebContentsTransport<typeof primaryIpcConfig, JsRequestType, NativeRequestType>(webContents, primaryIpcConfig)
		const messageDispatcher = new MessageDispatcher<JsRequestType, NativeRequestType>(transport, {
			facade: facadeHandler,
			ipc: async ({ args }) => {
				const [facade, method, ...methodArgs] = args
				return await dispatcher.dispatch(facade, method, methodArgs)
			},
		})
		const nativeInterface = {
			invokeNative: async (requestType: string, args: ReadonlyArray<unknown>): Promise<any> => {
				await desktopCommonSystemFacade.awaitForInit()
				return messageDispatcher.postRequest(new Request(requestType as JsRequestType, args))
			},
		}
		return {
			desktopFacade: new DesktopFacadeSendDispatcher(nativeInterface),
			commonNativeFacade: new CommonNativeFacadeSendDispatcher(nativeInterface),
			interWindowEventSender: new InterWindowEventFacadeSendDispatcher(nativeInterface),
			imapImportFacade: new ImapImportFacadeSendDispatcher(nativeInterface),
		}
	}

	unsubscribe(ipc: { removeHandler: (channel: string) => void }) {
		ipc.removeHandler(primaryIpcConfig.renderToMainEvent)
	}
}
