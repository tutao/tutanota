import { ConfigurationAdapter, PluginConfigJson } from "../../../plugin-kit/plugin-manager/PluginHost"
import { assert, assertNotNull, base64UrlCustomIdToString, isNotNull, Nullable, ofClass, stringToBase64UrlCustomId } from "@tutao/utils"
import { createPluginConfiguration, PluginConfiguration, PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { elementIdPart, idToElementId, isSameId, ListElementId } from "@tutao/meta"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction"
import { EnabledPlugin, PluginManager } from "../../../plugin-kit/plugin-manager/PluginManager"
import { LoginController } from "../api/main/LoginController"
import { PluginId, pluginIdFromString } from "../../../plugin-kit/sdk/PluginId"

export class PluginConfigurationProvider implements ConfigurationAdapter, PostLoginAction {
	private pluginListId: Id = null!
	private userOwnerGroup: Id = null!
	private customerPluginConfigsList: Id = null!
	private customerGroup: Id = null!
	private pluginManager: Nullable<PluginManager> = null
	private customerPluginConfigs: Nullable<Map<PluginId, PluginConfigJson>> = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		const loggedInUser = this.logins.getUserController().user
		assert(isSameId(loggedInUser._id, idToElementId(loggedInEvent.userId)), "UserId mismatch in loggedIn event and loggedInUser")

		this.userOwnerGroup = assertNotNull(loggedInUser._ownerGroup)
		this.pluginListId = assertNotNull(loggedInUser.plugins).pluginConfigs

		const customer = this.logins.getUserController().getCustomer()
		if (isNotNull(customer) && isNotNull(customer.plugins)) {
			this.customerPluginConfigsList = customer.plugins.pluginConfigs
			this.customerGroup = assertNotNull(loggedInUser._ownerGroup)
			const pluginConfigs = await this.entityClient.loadAll(PluginConfigurationTypeRef, this.customerPluginConfigsList)

			const enabledPlugins = pluginConfigs.map((pc) => {
				const pluginId = base64UrlCustomIdToString(elementIdPart(pc._id))
				const globalConfigJson = pc.configJson
				return { pluginId, customerConfigJson: globalConfigJson } as EnabledPlugin
			})

			await assertNotNull(this.pluginManager).loadPlugins(enabledPlugins)
		}
	}

	setPluginManager(pm: PluginManager): void {
		this.pluginManager = pm
	}

	async storeUserConfig(pluginId: PluginId, configJson: string): Promise<void> {
		let pluginConfig = await this.fetchUserConfig(pluginId)
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

	async getUserConfig(pluginId: PluginId): Promise<Nullable<string>> {
		const pluginConfig = await this.fetchUserConfig(pluginId)
		return pluginConfig?.configJson ?? null
	}

	async fetchUserConfig(pluginId: PluginId): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.pluginListId, stringToBase64UrlCustomId(pluginId)]
		return await this.entityClient.load(PluginConfigurationTypeRef, userPluginConfigId).catch(ofClass(NotFoundError, () => null))
	}

	async fetchCustomerConfig(pluginId: PluginId): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.customerPluginConfigsList, stringToBase64UrlCustomId(pluginId)]
		return await this.entityClient.load(PluginConfigurationTypeRef, userPluginConfigId).catch(ofClass(NotFoundError, () => null))
	}

	/**
	 * Customer-scoped plugin configuration used by the plugin settings page.
	 */
	async getCustomerPluginConfigs(): Promise<Map<PluginId, PluginConfigJson>> {
		const globalPluginConfigsList = assertNotNull(this.customerPluginConfigsList, "customerPluginConfigsList not initialized")
		const configs = await this.entityClient.loadAll(PluginConfigurationTypeRef, globalPluginConfigsList)
		this.customerPluginConfigs = new Map(configs.map((pc) => [pluginIdFromString(base64UrlCustomIdToString(elementIdPart(pc._id))), pc.configJson]))
		return this.customerPluginConfigs
	}

	async storeCustomerConfig(pluginId: PluginId, configJson: string): Promise<void> {
		assert(isNotNull(this.customerPluginConfigsList), "Current user dont have a customer")

		let pluginConfig = await this.fetchCustomerConfig(pluginId)
		if (isNotNull(pluginConfig)) {
			pluginConfig.configJson = configJson
			return await this.entityClient.update(pluginConfig)
		} else {
			pluginConfig = createPluginConfiguration({ configJson })
			// FIXME: do we need to set smth else?
			pluginConfig._id = [this.customerPluginConfigsList, stringToBase64UrlCustomId(pluginId)]
			pluginConfig._ownerGroup = this.customerGroup
			await this.entityClient.setup(this.pluginListId, pluginConfig)
		}
	}

	async removeCustomerPluginConfig(pluginId: PluginId): Promise<void> {
		const customer = await this.logins.getUserController().reloadCustomer()
		if (!customer.plugins) return
		const existing = await this.entityClient
			.load(PluginConfigurationTypeRef, [customer.plugins.pluginConfigs, stringToBase64UrlCustomId(pluginId)])
			.catch(ofClass(NotFoundError, () => null))
		if (isNotNull(existing)) await this.entityClient.erase(existing)
	}
}
