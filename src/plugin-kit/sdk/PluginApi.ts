import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"
import { assert, downcast } from "@tutao/utils"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { EnvProvider } from "@tutao/app-env"
import { GeneralPluginError } from "./PluginError"

const ErrorNameToType = {
	GeneralPluginError,
}

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

type PluginWorker = {
	pluginApi: PluginApi
	pluginAsWorker: Worker
}

export interface DialogAdapter {
	showDialog(message: string): Promise<void>
}

export abstract class PluginApi {
	protected constructor(protected readonly pluginHost: PluginHostApi) {}

	public static newPluginFromFile(pluginId: string, pluginHost: PluginHostApi, dialogAdapter: DialogAdapter): PluginWorker {
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
					return async (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginApi>(property)
						try {
							return dispatchToHostApi.postRequest(new Request(methodName, args))
						} catch (e) {
							if (e instanceof GeneralPluginError) {
								await dialogAdapter.showDialog(e.message)
							} else {
								await dialogAdapter.showDialog(e.message)
							}
						}
					}
				},
			},
		)

		return {
			pluginApi: downcast<PluginApi>(pluginApiAsProxy),
			pluginAsWorker,
		}
	}

	abstract getMetadata(): PluginMetadata

	abstract load(customerConfigJson: string): Promise<void>

	abstract unload(): Promise<void>

	abstract onConfigChange(): Promise<void>
}

export type PluginMetadata = {
	name: string
	description: string
	version: string
}
