import { PluginId } from "./PluginId"

export type PluginVersion = { major: number; minor: number; patch: number }
export type InitialCustomerConfigFields = Array<{ fieldId: string; defaultValue: string }>
export type PluginManifest = Readonly<{
	id: PluginId
	name: string
	description: string
	logoSvgUrl: string
	tags: Array<string>
	homePage: string
	version: PluginVersion
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
	initialCustomerConfigFields: InitialCustomerConfigFields
}>
