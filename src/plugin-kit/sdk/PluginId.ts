export const KNOWN_PLUGINS = ["nextcloud"] as const
export type PluginId = (typeof KNOWN_PLUGINS)[number]
export function pluginIdFromString(pluginId: string): PluginId {
	const castedPluginId = pluginId as PluginId
	if (KNOWN_PLUGINS.includes(castedPluginId)) {
		return castedPluginId
	}
	throw new Error(`PluginId: ${pluginId} is not a known PluginId`)
}
