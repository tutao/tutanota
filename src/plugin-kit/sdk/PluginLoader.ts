import { objToError, PluginApi } from "./PluginApi"
import { assert, assertNotNull, downcast } from "@tutao/utils"
import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"

export type PluginFactoryParams = {
	pluginHost: PluginHostApi
}
export type PluginFactory = (pluginHost: PluginFactoryParams) => PluginApi
;(globalThis as any).tutaPluginWorkerImpl = null
export function initTutaPluginWorker(pluginId: string, pluginFactory: PluginFactory) {
	if ((globalThis as any).tutaPluginWorkerImpl != null) {
		const errMessage = "Tried to initialize plugin twice?"
		console.log(errMessage)
		throw new Error(errMessage)
	}
	;(globalThis as any).tutaPluginWorkerImpl = new PluginWorkerImpl(self as DedicatedWorkerGlobalScope, pluginId, pluginFactory)
}

class PluginWorkerImpl {
	private readonly _scope: DedicatedWorkerGlobalScope
	private _dispatcher: MessageDispatcher<keyof PluginHostApi, keyof PluginApi> | null

	constructor(self: DedicatedWorkerGlobalScope, pluginId: string, pluginFactory: PluginFactory) {
		this._scope = self

		const pluginApi = this.getPluginApiRedirector(pluginFactory)

		this._dispatcher = new MessageDispatcher<keyof PluginHostApi, keyof PluginApi>(
			new WebWorkerTransport(this._scope),
			downcast<Commands<keyof PluginApi>>(pluginApi),
			`plugin:${pluginId}:`,
			objToError,
		)
	}

	private getPluginHostApiProxy(): PluginHostApi {
		const pluginHostProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginHostApi>(property)
						return assertNotNull(this._dispatcher).postRequest(new Request(methodName, args))
					}
				},
			},
		)
		return downcast<PluginHostApi>(pluginHostProxy)
	}

	private getPluginApiRedirector(pluginFactory: PluginFactory): PluginApi {
		const factoryParams: PluginFactoryParams = {
			pluginHost: this.getPluginHostApiProxy(),
		}
		const pluginApi = pluginFactory(factoryParams)

		const proxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return (messageArgs: Request<keyof PluginApi>): Promise<any> => {
						assert(property === messageArgs.requestType, `For request type: ${messageArgs.requestType}. Calling ${property} might be a mistake`)
						const targetMethod = pluginApi[messageArgs.requestType] as (...args: any) => Promise<any>
						const bindedMethod = targetMethod.bind(pluginApi)
						return bindedMethod(...messageArgs.args)
					}
				},
			},
		)
		return downcast<PluginApi>(proxy)
	}
}
