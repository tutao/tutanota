import { ConfigHostApi } from "../../sdk/hostApi/ConfigHostApi"
import { Nullable } from "@tutao/utils"
import { ConfigurationAdapter } from "./PluginHost"
import { PluginId } from "../../sdk/PluginId"

export class ConfigHost implements ConfigHostApi {
	constructor(
		private readonly pluginId: PluginId,
		private readonly configurationAdapter: ConfigurationAdapter,
	) {}

	async storeUserConfig(configJson: string): Promise<void> {
		await this.configurationAdapter.storeUserConfig(this.pluginId, configJson)
	}

	async storeCustomerConfig(configJson: string): Promise<void> {
		await this.configurationAdapter.storeCustomerConfig(this.pluginId, configJson)
	}

	async getUserConfig(): Promise<Nullable<string>> {
		return await this.configurationAdapter.getUserConfig(this.pluginId)
	}

	async getCustomerConfig(): Promise<Nullable<string>> {
		return await this.configurationAdapter.getCustomerConfig(this.pluginId)
	}
}
