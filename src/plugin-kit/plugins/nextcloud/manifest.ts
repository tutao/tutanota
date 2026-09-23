import { PluginManifest } from "../../sdk/PluginManifest"

export const NEXTCLOUD_PLUGIN_MANIFEST: PluginManifest = {
	id: "nextcloud",
	name: "Nextcloud",
	version: { major: 0, minor: 1, patch: 0 },
	description: `Allows you to save email attachment to nextcloud files and
	allows you to create a talk room from tuta calendar`,
	homePage: "https://tuta.com",
	tags: ["email", "encrypted", "virtual meeting"],

	permissions: {
		windowOpen: { allowedDomains: [] },
		getHost: true,
	},
}
