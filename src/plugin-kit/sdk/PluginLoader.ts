import { MessageToPluginFromHostApiCommandNames, objToError, PluginApi } from "./PluginApi"
import { assertNotNull, downcast } from "@tutao/utils"
import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { Request, Response } from "../../app-kit/native-bridge/shared/MessageTypes"

self.onmessage = function (msg): void {
	console.log(">>> plugin loader first message :)")

	const data = msg.data
	const methodName: MessageToPluginFromHostApiCommandNames = data.requestType
	const args: Array<any> = data.args
	if (methodName === "load") {
		Promise.resolve().then(async () => {
			const pluginUrl = args[0]
			const customerConfig = args[1]
			await new PluginWorkerImpl(self as DedicatedWorkerGlobalScope).init(pluginUrl, customerConfig)
		})
		const response = new Response(data.id, {})
		self.postMessage(response)
	} else {
		debugger
	}
}

class PluginWorkerImpl {
	private readonly _scope: DedicatedWorkerGlobalScope
	private _dispatcher: MessageDispatcher<keyof PluginHostApi, keyof PluginApi> | null

	constructor(self: DedicatedWorkerGlobalScope) {
		this._scope = self
		this._dispatcher = null
	}

	public async init(pluginUrl: string, customerConfig: string) {
		const pluginHostProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return async (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginHostApi>(property)
						self.postMessage(new Request(methodName, args))
					}
				},
			},
		)
		const pluginHost = downcast<PluginHostApi>(pluginHostProxy)

		const loadedPluginModule = await import(pluginUrl)
		const pluginClass = assertNotNull(loadedPluginModule.Plugin, "All plugin should have a public constructor for class `Plugin`")

		const pluginApi: PluginApi = new pluginClass(pluginHost)
		await pluginApi.load(pluginUrl, customerConfig)

		this._dispatcher = new MessageDispatcher<keyof PluginHostApi, keyof PluginApi>(
			new WebWorkerTransport(this._scope),
			{
				load: async () => pluginApi.load,
				unload: async () => pluginApi.unload,
				getMetadata: async () => pluginApi.getMetadata,
			},
			"plugin-worker-main",
			objToError,
		)
	}
}
