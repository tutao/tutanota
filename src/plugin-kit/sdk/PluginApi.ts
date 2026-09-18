import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"
import { assert, downcast } from "@tutao/utils"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { EnvProvider } from "@tutao/app-env"

// FIXME: resuse from threading/WebTransport
export function objToError(o: Record<string, any>): Error {
	let e = new Error(o.message) as any
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
		const pluginFilePath = `${EnvProvider.get().getPathPrefix()}/plugin-kit/plugins/${pluginId}.js`
		const pluginAsWorker = new Worker(pluginFilePath, { type: "module", name: `plugin:${pluginId}` })
		pluginAsWorker.onerror = (e: any) => {
			const msg = `could not setup plugin ${pluginId} worker: ${e.name} ${e.stack} ${e.message} ${e}`
			console.error(msg)
			throw new Error(msg)
		}

		const pluginHostApiRedirector = downcast<PluginHostApi>(
			new Proxy(
				{},
				{
					get: (_: object, property: string) => {
						return (messageArgs: Request<keyof PluginHostApi>): Promise<any> => {
							assert(property === messageArgs.requestType, `For request type: ${messageArgs.requestType}. Calling ${property} might be a mistake`)
							const targetMethod = pluginHost[messageArgs.requestType] as (...args: any) => Promise<any>
							const bindedMethod = targetMethod.bind(pluginHost)
							return bindedMethod(...messageArgs.args)
						}
					},
				},
			),
		)

		const dispatchToHostApi = new MessageDispatcher<keyof PluginApi, keyof PluginHostApi>(
			new WebWorkerTransport(pluginAsWorker),
			downcast<Commands<keyof PluginHostApi>>(pluginHostApiRedirector),
			`plugin:${pluginId}:`,
			objToError,
		)

		const pluginApiAsProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginApi>(property)
						return dispatchToHostApi.postRequest(new Request(methodName, args))
					}
				},
			},
		)

		return downcast<PluginApi>(pluginApiAsProxy)
	}

	abstract getMetadata(): PluginMetadata
	abstract load(customerConfigJson: string): Promise<void>
	abstract unload(): Promise<void>
	protected abstract loadUserConfig(): Promise<void>
	protected abstract storeUserConfig(): Promise<void>
}

export type PluginMetadata = {
	name: string
	description: string
	version: string
}
