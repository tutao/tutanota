import { PluginHostApi } from "./PluginHostApi"

export abstract class PluginApi {
	constructor(public readonly pluginHost: PluginHostApi) {}

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
