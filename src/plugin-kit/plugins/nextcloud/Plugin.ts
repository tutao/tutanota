import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"

export class Plugin extends PluginApi {
	getMetadata(): PluginMetadata {
		return {
			name: "Nextcloud Plugin",
			description: "Save attachments to your Nextcloud server",
			version: "1",
		}
	}

	load(): Promise<void> {
		return Promise.resolve(undefined)
	}

	unload(): Promise<void> {
		return Promise.resolve(undefined)
	}
}
