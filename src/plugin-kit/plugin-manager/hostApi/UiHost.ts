import { UiHostApi } from "../../sdk/hostApi/UiHostApi"
import { ButtonConfiguration, ButtonRef, ConfigFieldConfiguration } from "../../sdk/hostApi/PluginHostApi"
import { PluginManager } from "../PluginManager"
import { PluginId } from "../../sdk/PluginId"

export class UiHost implements UiHostApi {
	constructor(
		private readonly pluginId: PluginId,
		private readonly pluginManager: PluginManager,
	) {}

	async registerConfigFields(configs: ConfigFieldConfiguration[]): Promise<void> {
		for (const config of configs) {
			this.pluginManager.registerConfigField(this.pluginId, config)
		}
	}

	async registerButton(config: ButtonConfiguration): Promise<ButtonRef> {
		this.pluginManager.registerButton(this.pluginId, config)
		return { id: this.pluginId }
	}
}
