import { ConfigurationAdapter } from "../../../plugin-kit/plugin-manager/PluginHost"
import { assertNotNull, base64UrlCustomIdToString, isNotNull, Nullable, ofClass, stringToBase64UrlCustomId } from "@tutao/utils"
import { createPluginConfiguration, PluginConfiguration, PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { elementIdPart, ListElementId } from "@tutao/meta"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction"
import { EnabledPlugin, PluginManager } from "../../../plugin-kit/plugin-manager/PluginManager"
import { LoginController } from "../api/main/LoginController"

export class PluginConfigurationProvider implements ConfigurationAdapter, PostLoginAction {
	private pluginListId: Id = null!
	private userOwnerGroup: Id = null!
	private pluginManager: Nullable<PluginManager> = null
	private globalPluginConfigsList: Nullable<Id> = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {}
	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		return this.init(loggedInEvent.userId)
	}

	setPluginManager(pm: PluginManager): void {
		this.pluginManager = pm
	}

	public async init(userId: Id): Promise<void> {
		const loggedInUser = this.logins.getUserController().user
		this.userOwnerGroup = assertNotNull(loggedInUser._ownerGroup)
		this.pluginListId = assertNotNull(loggedInUser.plugins).pluginConfigs

		const customer = this.logins.getUserController().getCustomer()
		if (customer && customer.plugins) {
			this.globalPluginConfigsList = customer.plugins.pluginConfigs
			const pluginConfigs = await this.entityClient.loadAll(PluginConfigurationTypeRef, this.globalPluginConfigsList)

			const enabledPlugins = pluginConfigs.map((pc) => {
				const pluginId = base64UrlCustomIdToString(elementIdPart(pc._id))
				const globalConfigJson = pc.configJson
				return { pluginId, globalConfigJson } as EnabledPlugin
			})

			await assertNotNull(this.pluginManager).loadPlugins(enabledPlugins)
		}
	}

	async storeUserConfig(pluginId: string, configJson: string): Promise<void> {
		let pluginConfig = await this.fetchConfig(pluginId)
		if (isNotNull(pluginConfig)) {
			pluginConfig.configJson = configJson
			return await this.entityClient.update(pluginConfig)
		} else {
			pluginConfig = createPluginConfiguration({ configJson })
			pluginConfig._id = [this.pluginListId, stringToBase64UrlCustomId(pluginId)]
			pluginConfig._ownerGroup = this.userOwnerGroup
			await this.entityClient.setup(this.pluginListId, pluginConfig)
		}
	}
	async getUserConfig(pluginId: string): Promise<string> {
		const pluginConfig = await this.fetchConfig(pluginId)
		return isNotNull(pluginConfig) ? pluginConfig.configJson : ""
	}

	async fetchConfig(pluginId: string): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.pluginListId, stringToBase64UrlCustomId(pluginId)]
		return await this.entityClient.load(PluginConfigurationTypeRef, userPluginConfigId).catch(ofClass(NotFoundError, () => null))
	}

	/**
	 * Customer-scoped (org-wide) plugin configuration, used by the admin Plugins settings page.
	 * Distinct from storeConfig/getConfig/fetchConfig above, which remain per-user (used by PluginHostApi at runtime).
	 */
	async loadCustomerPluginConfigs(): Promise<Map<string, PluginConfiguration>> {
		const globalPluginConfigsList = assertNotNull(this.globalPluginConfigsList, "globalPluginConfigsList not initialized")
		const configs = await this.entityClient.loadAll(PluginConfigurationTypeRef, globalPluginConfigsList)
		return new Map(configs.map((pc) => [base64UrlCustomIdToString(elementIdPart(pc._id)), pc]))
	}

	async setCustomerPluginConfig(pluginId: string, configJson: string): Promise<void> {
		const globalPluginConfigsList = assertNotNull(this.globalPluginConfigsList, "globalPluginConfigsList not initialized")
		const existing = await this.entityClient.load(PluginConfigurationTypeRef, [globalPluginConfigsList, stringToBase64UrlCustomId(pluginId)]).catch(
			ofClass(NotFoundError, async () => {
				const pluginConfig = createPluginConfiguration({ configJson })
				pluginConfig._id = [globalPluginConfigsList, stringToBase64UrlCustomId(pluginId)]
				pluginConfig._ownerGroup = assertNotNull(this.logins.getUserController().getCustomer(), "customer not loaded").customerGroup
				await this.entityClient.setup(globalPluginConfigsList, pluginConfig)
				return pluginConfig
			}),
		)
		existing.configJson = configJson
		await this.entityClient.update(existing)
	}

	async removeCustomerPluginConfig(pluginId: string): Promise<void> {
		const customer = await this.logins.getUserController().reloadCustomer()
		if (!customer.plugins) return
		const existing = await this.entityClient
			.load(PluginConfigurationTypeRef, [customer.plugins.pluginConfigs, stringToBase64UrlCustomId(pluginId)])
			.catch(ofClass(NotFoundError, () => null))
		if (isNotNull(existing)) await this.entityClient.erase(existing)
	}
}
