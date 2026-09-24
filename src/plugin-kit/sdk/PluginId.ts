export const KNOWN_PLUGINS = ["nextcloud"] as const
export type PluginId = (typeof KNOWN_PLUGINS)[number]
export type UnknownPluginId = string
export function pluginIdFromString(pluginId: UnknownPluginId): PluginId {
	const castedPluginId = pluginId as PluginId
	if (KNOWN_PLUGINS.includes(castedPluginId)) {
		return castedPluginId
	}
	throw new Error(`PluginId: ${pluginId} is not a known PluginId`)
}
