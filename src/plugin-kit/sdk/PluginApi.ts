import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"
import { downcast } from "@tutao/utils"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"

// FIXME: resuse from threading/WebTransport
export function objToError(o: Record<string, any>): Error {
	// @ts-ignore
	let errorType = ErrorNameToType[o.name]
	let e = (errorType != null ? new errorType(o.message) : new Error(o.message)) as any
	e.name = o.name
	e.stack = o.stack || e.stack
	e.data = o.data
	return e
}

export type MessageToPluginFromHostApiCommandNames = keyof PluginApi
export type MessageToHostApiFromPluginCommandNames = keyof PluginHostApi
export type PluginApiMessageDispatcher = MessageDispatcher<MessageToPluginFromHostApiCommandNames, MessageToHostApiFromPluginCommandNames>

export abstract class PluginApi {
	protected constructor(protected readonly pluginHost: PluginHostApi) {}

	public static newPluginFromFile(pluginId: string, pluginHost: PluginHostApi): PluginApi {
		const pluginLoader = "/plugin-loader.js"
		const pluginAsWorker = new Worker(pluginLoader, { type: "module", name: `plugin:${pluginId}` })
		pluginAsWorker.onerror = (e: any) => {
			const msg = `could not setup plugin ${pluginId} worker: ${e.name} ${e.stack} ${e.message} ${e}`
			console.error(msg)
			throw new Error(msg)
		}

		const commands: Commands<keyof PluginHostApi> = {
			getCustomerConfig: (message) => pluginHost.getCustomerConfig(),
			getUserConfig: (message) => pluginHost.getUserConfig(),
			registerConfigField: (message) => pluginHost.registerConfigField(message.args[0]),
			storeUserConfig: (message) => pluginHost.storeUserConfig(message.args[0]),
			registerButton: (message) => pluginHost.registerButton(message.args[0]),
		}

		const pluginMessageDispatcher = new MessageDispatcher<keyof PluginApi, keyof PluginHostApi>(
			new WebWorkerTransport(pluginAsWorker),
			commands,
			"",
			objToError,
		)

		const pluginApiAsProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginApi>(property)
						return pluginMessageDispatcher.postRequest(new Request(methodName, args))
					}
				},
			},
		)

		return downcast<PluginApi>(pluginApiAsProxy)
	}

	abstract getMetadata(): PluginMetadata
	abstract load(pluginUrl: string, customerConfigJson: string): Promise<void>
	abstract unload(): Promise<void>
	protected abstract loadUserConfig(): Promise<void>
	protected abstract storeUserConfig(): Promise<void>
}

export type PluginMetadata = {
	name: string
	description: string
	version: string
}
