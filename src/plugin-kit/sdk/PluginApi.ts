import { PluginHostApi, PluginHostApiCollection } from "./hostApi/PluginHostApi"
import { MessageDispatcher } from "../../app-kit/native-bridge/shared/MessageDispatcher"
import { Commands, Request } from "../../app-kit/native-bridge/shared/MessageTypes"
import { assert, downcast, isNotNull, ofClass } from "@tutao/utils"
import { WebWorkerTransport } from "../../app-kit/native-bridge/common/threading/WebTransport"
import { TutanotaError } from "@tutao/app-env"
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
export type MessageDispatcherToHostApiFromPlugin = MessageDispatcher<MessageToPluginFromHostApiCommandNames, MessageToHostApiFromPluginCommandNames>

type PluginWorker = {
	pluginApi: PluginApi
	pluginAsWorker: Worker
}

export interface DialogAdapter {
	showDialog(message: string): Promise<void>
}

export abstract class PluginApi {
	protected constructor(protected readonly pluginHost: PluginHostApi) {}

	public static newPluginFromFile(
		pluginId: PluginId,
		pluginHost: PluginHostApiCollection,
		dialogAdapter: DialogAdapter,
		pluginSourceHostServer: string,
	): PluginWorker {
		const pluginFilePath = `${pluginSourceHostServer}/${pluginId}.js`
		const pluginAsWorker = new Worker(pluginFilePath, { type: "module", name: `plugin:${pluginId}` })
		pluginAsWorker.onerror = (e: any) => {
			const msg = `could not setup plugin ${pluginId} worker: ${e.name} ${e.stack} ${e.message} ${e}`
			console.error(msg)
			throw new Error(msg)
		}

		const pluginHostApiRedirector = this.getPluginHostApiProxy(pluginHost)

		const dispatchToHostApi: MessageDispatcherToHostApiFromPlugin = new MessageDispatcher(
			new WebWorkerTransport(pluginAsWorker),
			downcast<Commands<MessageToHostApiFromPluginCommandNames>>(pluginHostApiRedirector),
			`plugin:${pluginId}:`,
			objToError,
		)

		const showDialogWithMessage = (e: TutanotaError) => dialogAdapter.showDialog(e.message)

		const pluginApiAsProxy = new Proxy(
			{},
			{
				get: (_: object, property: string) => {
					return async (...args: Array<any>): Promise<any> => {
						const methodName = downcast<MessageToPluginFromHostApiCommandNames>(property)
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

	private static getPluginHostApiProxy(pluginHost: PluginHostApiCollection): PluginHostApi {
		type PluginHostApiMethod = (...args: any) => Promise<any>

		const findMethodInPluginHost = (methodName: string): PluginHostApiMethod => {
			const allHostApi = Object.values(pluginHost).filter(isNotNull)

			for (const hostApi of allHostApi) {
				if (methodName in hostApi) {
					const method = Reflect.get(hostApi, methodName)
					if (typeof method === "function") {
						return method.bind(hostApi)
					}
				}
			}

			return (...args: any[]) => {
				const methodNotMemberMsg = `Method: ${methodName} is not member of pluginHostApi?`
				console.error(methodNotMemberMsg)
				console.error("available hostApi: ", pluginHost)
				throw new Error(methodNotMemberMsg)
			}
		}

		return new Proxy(downcast<PluginHostApi>({}), {
			get: (_: PluginHostApi, methodName: string) => {
				return (messageArgs: Request<MessageToHostApiFromPluginCommandNames>): Promise<any> => {
					assert(
						methodName === messageArgs.requestType,
						`For request type: ${String(messageArgs.requestType)}. Calling ${methodName} might be a mistake`,
					)
					const targetMethod = findMethodInPluginHost(methodName)
					return targetMethod(...messageArgs.args)
				}
			},
		})
	}

	abstract getManifest(): Promise<PluginManifest>

	abstract load(customerConfigJson: string): Promise<void>

	abstract unload(): Promise<void>

	abstract verifyCustomerConfiguration(newCustomerConfig: string): Promise<void>
	abstract onUserConfigChange(): Promise<void>
	abstract onCustomerConfigChange(): Promise<void>
}
