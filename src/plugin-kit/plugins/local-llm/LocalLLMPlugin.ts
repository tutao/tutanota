import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ConfigFieldExtension } from "../../sdk/ConfigFieldExtensionPoint"
import { ButtonConfiguration, ExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { initTutaPluginWorker, PluginFactory } from "../../sdk/PluginLoader"
import { Nullable, isNotNull } from "../../../platform-kit/utils"
import { MailButtonExtension } from "../../sdk/MailButtonExtensionPoint"
import { PluginMail } from "../../sdk/PluginMail"

type UserPluginConfig = {
	credentials: Nullable<UserCredentials>
}

type UserCredentials = {
	apiKey: string
}

export class LocalLLMPlugin extends PluginApi implements ConfigFieldExtension, MailButtonExtension {
	async onConfigChange(configs: { customerConfig: string; userConfig: string }): Promise<void> {
		console.log("TODO")
	}
	public static readonly PLUGIN_ID: string = "local-llm"
	private userConfig: UserPluginConfig = null!

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
	}
	mailButtonClicked(mail: PluginMail): void {
		console.log("Mail received: ", mail.body)
	}

	getMetadata(): PluginMetadata {
		return {
			name: "Local LMM",
			description: "Summarize a mail body using a local LMM",
			version: "1.0.0",
		}
	}

	async load(customerConfigJson: string): Promise<void> {
		console.log("Loading Plugin")
		await this.applyAppExtensionPoints()
	}

	protected async loadUserConfig(): Promise<void> {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	async unload(): Promise<void> {
		console.log("TODO")
	}

	updateCustomerConfig(globalConfigJson: string): void {
		console.log("updated Config")
	}

	protected async updateUserConfig(): Promise<void> {
		console.log("TODO")
	}

	private async applyAppExtensionPoints() {
		let mailBtnConfig: ButtonConfiguration = {
			extensionPoint: ExtensionPoint.MailButton,
			text: { de: "Summarize body" },
		}
		await this.pluginHost.registerButton(mailBtnConfig)
	}
}

const pluginFactory: PluginFactory = (factoryParams) => new LocalLLMPlugin(factoryParams.pluginHost)
initTutaPluginWorker(LocalLLMPlugin.PLUGIN_ID, pluginFactory)
