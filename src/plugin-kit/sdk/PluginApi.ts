import { PluginHostApi } from "./PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"
import { assert, downcast, ofClass } from "@tutao/utils"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { EnvProvider, TutanotaError } from "@tutao/app-env"
import { CustomerConfigPluginError, GeneralPluginError, HostApiPermissionDenied } from "./PluginError"
import { PluginManifest } from "./PluginManifest"
import { PluginId } from "./PluginId"

const ErrorNameToType = {
	GeneralPluginError,
	HostApiPermissionDenied,
	CustomerConfigPluginError,
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

type PluginWorker = {
	pluginApi: PluginApi
	pluginAsWorker: Worker
}

export interface DialogAdapter {
	showDialog(message: string): Promise<void>
}

export abstract class PluginApi {
	protected constructor(protected readonly pluginHost: PluginHostApi) {}

	public static newPluginFromFile(pluginId: PluginId, pluginHost: PluginHostApi, dialogAdapter: DialogAdapter): PluginWorker {
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

		const showDialogWithMessage = (e: TutanotaError) => dialogAdapter.showDialog(e.message)

		const pluginApiAsProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return async (...args: Array<any>): Promise<any> => {
						const methodName = downcast<keyof PluginApi>(property)
						return dispatchToHostApi
							.postRequest(new Request(methodName, args))
							.catch(ofClass(GeneralPluginError, showDialogWithMessage))
							.catch(ofClass(HostApiPermissionDenied, showDialogWithMessage))
							.catch((e) => {
								if (e instanceof CustomerConfigPluginError) {
									throw e // handled by PluginConfigurationProvider
								} else {
									dialogAdapter.showDialog(`An unhandled error occured while Plugin '${pluginId}' was executed: ${e.message}`)
								}
							})
					}
				},
			},
		)
		const pluginApi = downcast<PluginApi>(pluginApiAsProxy)

		return {
			pluginApi,
			pluginAsWorker,
		}
	}

	abstract getManifest(): Promise<Readonly<PluginManifest>>

	abstract load(customerConfigJson: string): Promise<void>

	abstract unload(): Promise<void>

	abstract verifyCustomerConfiguration(newCustomerConfig: string): Promise<void>
	abstract onUserConfigChange(): Promise<void>
	abstract onCustomerChange(): Promise<void>
}
