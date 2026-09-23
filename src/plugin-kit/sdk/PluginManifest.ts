import { PluginId } from "./PluginId"

export type PluginManifest = {
	id: PluginId
	name: string
	description: string
	tags: Array<string>
	homePage: string
	version: { major: number; minor: number; patch: number }
	permissions: {
		/*
		 * only these domain + current domain is allowed to be passed to HostApi.openWindow
		 */
		windowOpen: { allowedDomains: Array<string> }
		/**
		 * Weather plugin can execute HostApi.getHost method
		 */
		getHost: boolean
	}
}
