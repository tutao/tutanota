import { ButtonConfiguration, ConfigFieldConfiguration, PluginHostApiCollection } from "../../sdk/hostApi/PluginHostApi"
import { isNotNull, Nullable } from "@tutao/utils"
import { PluginManager } from "../PluginManager"
import { PluginDataFile } from "../../sdk/PluginDataFile"
import { PluginId, UnknownPluginId } from "../../sdk/PluginId"
import { PluginManifest } from "../../sdk/PluginManifest"
import { ConfigHost } from "./ConfigHost"
import { MailEditorHost } from "./MailEditorHost"
import { UiHost } from "./UiHost"
import { WindowHost } from "./WindowHost"

export type ButtonExtension = {
	config: ButtonConfiguration
	pluginId: PluginId
}

export type ConfigExtension = {
	config: ConfigFieldConfiguration
	pluginId: PluginId
}

export const enum PluginConfigurationOwner {
	Customer,
	User,
}
export interface ConfigurationAdapter {
	storeUserConfig(pluginId: PluginId, configJson: string): Promise<void>
	storeCustomerConfig(pluginId: PluginId, configJson: string): Promise<boolean>

	getUserConfig(pluginId: PluginId): Promise<Nullable<string>>
	getCustomerConfig(pluginId: PluginId): Promise<Nullable<string>>
	getEnabledPluginIdsForCustomer(): Promise<Array<UnknownPluginId>>

	getConfigOwner(configListId: Id): PluginConfigurationOwner
}

export interface MailIntegrationAdapter {
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
}

export class PluginHost implements PluginHostApiCollection {
	public readonly config: ConfigHost
	public readonly mailEditor: Nullable<MailEditorHost>
	public readonly ui: UiHost
	public readonly window: WindowHost = null!

	public pluginManifest: PluginManifest = null!

	constructor(pluginManager: PluginManager, pluginId: PluginId) {
		this.config = new ConfigHost(pluginId, pluginManager.configurationAdapter)
		this.mailEditor = isNotNull(pluginManager.mailIntegrationAdapter) ? new MailEditorHost(pluginManager.mailIntegrationAdapter) : null
		this.ui = new UiHost(pluginId, pluginManager)
	}
	public initialize(pluginManifest: PluginManifest) {
		this.pluginManifest = pluginManifest
		;(this.window as WindowHost) = new WindowHost(this.pluginManifest)
	}
}
