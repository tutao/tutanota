export interface IWorkerApi {
	getMetadata(): PluginMetadata
	load(): Promise<void>
	unload(): Promise<void>
}

export type PluginMetadata = {
	name: string
	description: string
	version: string
	pluginCapabilities: PluginCapabilities
}

export enum PluginCapabilities {
	FilesystemAccess = "FilesystemAccess",
	MailDataAccess = "MailDataAccess",
	None = "None",
}
