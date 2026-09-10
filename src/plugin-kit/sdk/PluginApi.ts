import { ButtonConfiguration, ButtonRef, PluginHostApi } from "./PluginHostApi"

export abstract class PluginApi {
	public readonly mainButton: ButtonConfiguration | null = null

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
