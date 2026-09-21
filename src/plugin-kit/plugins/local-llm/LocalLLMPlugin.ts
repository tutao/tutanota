import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ConfigFieldExtension } from "../../sdk/ConfigFieldExtensionPoint"
import { PluginHostApi } from "../../sdk/PluginHostApi"
import { initTutaPluginWorker, PluginFactory } from "../../sdk/PluginLoader"
import { Nullable, isNotNull } from "../../../platform-kit/utils"

type UserPluginConfig = {
	credentials: Nullable<UserCredentials>
}

type UserCredentials = {
	apiKey: string
}

export class LocalLLMPlugin extends PluginApi implements ConfigFieldExtension {
	public static readonly PLUGIN_ID: string = "local-llm"
	private userConfig: UserPluginConfig = null!

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
	}

	getMetadata(): PluginMetadata {
		return {
			name: "Local LMM",
			description: "Summarize a mail body using a local LMM",
			version: "1.0.0",
		}
	}

	async load(customerConfigJson: string): Promise<void> {
		// TODO() load from config
		const apiEndpoint = "https://api.local.lmm.org"
		console.log("Loading local LMMP API...", apiEndpoint)
	}
	// private async loadOrCreateEmptyConfig() {
	// 	await this.loadUserConfig()
	//
	// 	if (isNull(this.userConfig)) {
	// 		this.userConfig = { credentials: null }
	// 	}
	// }
	//
	// protected async loadUserConfig(): Promise<void> {
	// 	const configString = await this.pluginHost.getUserConfig()
	// 	this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	// }

	protected async loadUserConfig(): Promise<void> {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	unload(): Promise<void> {
		return Promise.resolve(undefined)
	}

	updateCustomerConfig(globalConfigJson: string): void {
		console.log("updated Config")
	}

	protected updateUserConfig(): Promise<void> {
		return Promise.resolve(undefined)
	}
}

// const pluginFactory: PluginFactory = (factoryParams) => new LocalLLMPlugin(factoryParams.pluginHost)
// initTutaPluginWorker(LocalLLMPlugin.PLUGIN_ID, pluginFactory)
