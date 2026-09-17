import { MessageToPluginFromHostApiCommandNames, objToError, PluginApi } from "./PluginApi"
import { assertNotNull, downcast } from "@tutao/utils"
import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { Commands, Request, RequestError, Response } from "../../app-kit/native-bridge/shared/MessageTypes"

self.onmessage = function (msg): void {
	const data = msg.data
	const methodName: MessageToPluginFromHostApiCommandNames = data.requestType
	const args: Array<any> = data.args
	if (methodName === "load") {
		const pluginUrl = args[0]
		const customerConfig = args[1]
		new PluginWorkerImpl(self as DedicatedWorkerGlobalScope).init(pluginUrl, customerConfig).then(
			() => self.postMessage(new Response(data.id, {})),
			(error) => self.postMessage(new RequestError(data.id, error)),
		)
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
		// the loaded plugin instance is only available once `pluginApi.load()` below has been called;
		// the commands proxy captures it by reference so calls arriving after load() are dispatched correctly.
		let pluginApi: PluginApi | null = null

		// Outgoing (plugin -> host) calls now go through the dispatcher's postRequest, so they are properly
		// id-correlated to their Response/RequestError instead of firing a bare postMessage with id: null.
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
		const pluginHost = downcast<PluginHostApi>(pluginHostProxy)

		// Incoming (host -> plugin) calls are dispatched generically to whatever method exists on the
		// loaded pluginApi instance, instead of a hardcoded load/unload/getMetadata map, so extension
		// points like attachmentButtonClicked/eventLocationButtonClicked/receiveFileReference reach the plugin.
		const commands = downcast<Commands<keyof PluginApi>>(
			new Proxy(
				{},
				{
					get: (_: object, property: string) => {
						return async (message: Request<keyof PluginApi>): Promise<any> => {
							const method = (pluginApi as any)?.[property]
							if (typeof method !== "function") {
								throw new Error(`unsupported plugin api method: ${String(property)}`)
							}
							return method.apply(pluginApi, message.args)
						}
					},
				},
			),
		)

		// Built BEFORE pluginApi.load() runs (unlike before), so host calls made from inside load()
		// (registerButton, getUserConfig, storeUserConfig, registerConfigField) have a real dispatcher/
		// transport to correlate their responses against.
		this._dispatcher = new MessageDispatcher<keyof PluginHostApi, keyof PluginApi>(
			new WebWorkerTransport(this._scope),
			commands,
			"plugin-worker-main",
			objToError,
		)

		const loadedPluginModule = await import(pluginUrl)
		const pluginClass = assertNotNull(loadedPluginModule.Plugin, "All plugin should have a public constructor for class `Plugin`")

		const loadedPluginApi: PluginApi = new pluginClass(pluginHost)
		pluginApi = loadedPluginApi
		await loadedPluginApi.load(pluginUrl, customerConfig)
	}
}
