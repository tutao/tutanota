export type PluginConfigFieldDef = {
	key: string
	// kept as a plain string (rather than TranslationKeyType) so this manifest doesn't pull the ui/ project
	// into plugin-kit/plugins' isolated build graph; consumers in applications/ cast it back to TranslationKeyType.
	label: string
	type: "text"
}

export type PluginRegistryEntry = {
	/** matches the pluginId encoded into the customer-level PluginConfiguration's element id */
	id: string
	name: string
	description: string
	logoSvg: string
	configFields: ReadonlyArray<PluginConfigFieldDef>
}

const NEXTCLOUD_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#0082C9" d="M12 4a5 5 0 0 0-4.9 4.06A4.5 4.5 0 0 0 5 16.5V17a1 1 0 0 0 1 1h12a4.5 4.5 0 0 0 1.5-8.74A5 5 0 0 0 12 4Zm0 2a3 3 0 0 1 2.83 2A3 3 0 0 0 12 11a3 3 0 0 0-2.83-3A3 3 0 0 1 12 6Z"/></svg>`

/**
 * Static, synchronous manifest of plugins that can be enabled/configured from the admin Plugins settings page.
 * Kept independent of PluginManager/dynamic import() - the Settings page must list plugins that are
 * *available to enable*, including disabled ones, without pulling in plugin runtime bundles just to
 * render a name/description/logo.
 */
export const PLUGIN_REGISTRY: ReadonlyArray<PluginRegistryEntry> = [
	{
		id: "nextcloud",
		name: "Nextcloud",
		description: "Save email attachments directly to your Nextcloud server.",
		logoSvg: NEXTCLOUD_LOGO_SVG,
		configFields: [
			{
				key: "serverUrl",
				label: "pluginNextcloudServerUrl_label",
				type: "text",
			},
		],
	},
]
