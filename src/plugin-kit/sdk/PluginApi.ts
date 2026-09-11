import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "./PluginHostApi"

export abstract class PluginApi {
	constructor(public readonly pluginHost: PluginHostApi) {}

	abstract getMetadata(): PluginMetadata
	abstract load(): Promise<void>
	abstract unload(): Promise<void>
	buttonClicked(button: ButtonRef): void {}
}

export type PluginMetadata = {
	name: string
	description: string
	version: string
}
