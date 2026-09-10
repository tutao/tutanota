import { ButtonRef } from "./PluginHostApi"

export abstract class PluginApi {
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
