import { ConfigurationAdapter, PluginConfigJson, PluginConfigurationOwner } from "../../../plugin-kit/plugin-manager/PluginHost"
import { assert, assertNotNull, base64UrlCustomIdToString, isNotNull, Nullable, ofClass, stringToBase64UrlCustomId } from "@tutao/utils"
import { createPluginConfiguration, PluginConfiguration, PluginConfigurationTypeRef } from "@tutao/entities/sys"
import { elementIdPart, idToElementId, isSameId, ListElementId } from "@tutao/meta"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction"
import { EnabledPlugin, PluginManager } from "../../../plugin-kit/plugin-manager/PluginManager"
import { LoginController } from "../api/main/LoginController"
import { PluginId, pluginIdFromString } from "../../../plugin-kit/sdk/PluginId"
import { isNull } from "../../../platform-kit/utils/Utils"

export class PluginConfigurationProvider implements ConfigurationAdapter, PostLoginAction {
	private userPluginListId: Id = null!
	private customerPluginConfigsList: Id = null!
	private userOwnerGroup: Id = null!
	private customerGroup: Id = null!
	private pluginManager: Nullable<PluginManager> = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {}

	getConfigOwner(configListId: Id): PluginConfigurationOwner {
		if (configListId === this.userPluginListId) {
			return PluginConfigurationOwner.User
		} else if (configListId === this.customerPluginConfigsList) {
			return PluginConfigurationOwner.Customer
		} else {
			throw new Error(`Neither user nor customer? configListId is not a listID of ${PluginConfigurationTypeRef.toString()}?`)
		}
	}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		const loggedInUser = this.logins.getUserController().user
		assert(isSameId(loggedInUser._id, idToElementId(loggedInEvent.userId)), "UserId mismatch in loggedIn event and loggedInUser")

		this.userOwnerGroup = assertNotNull(loggedInUser._ownerGroup)
		this.userPluginListId = assertNotNull(loggedInUser.plugins).pluginConfigs

		const customer = this.logins.getUserController().getCustomer()
		if (isNotNull(customer) && isNotNull(customer.plugins)) {
			this.customerPluginConfigsList = customer.plugins.pluginConfigs
			this.customerGroup = assertNotNull(customer.customerGroup)
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
		const existingPluginConfig = await this.fetchUserConfig(pluginId)
		if (isNotNull(existingPluginConfig)) {
			existingPluginConfig.configJson = configJson
			return await this.entityClient.update(existingPluginConfig)
		} else {
			const newPluginConfig = createPluginConfiguration({ configJson })
			newPluginConfig._id = [this.userPluginListId, stringToBase64UrlCustomId(pluginId)]
			newPluginConfig._ownerGroup = this.userOwnerGroup
			await this.entityClient.setup(this.userPluginListId, newPluginConfig)
		}
	}

	async getUserConfig(pluginId: PluginId): Promise<Nullable<string>> {
		const pluginConfig = await this.fetchUserConfig(pluginId)
		return pluginConfig?.configJson ?? null
	}

	async fetchUserConfig(pluginId: PluginId): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.userPluginListId, stringToBase64UrlCustomId(pluginId)]
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

		const mappedConfigs = configs.map((pc) => {
			const pluginId = pluginIdFromString(base64UrlCustomIdToString(elementIdPart(pc._id)))
			return [pluginId, pc.configJson] as const
		})
		return new Map(mappedConfigs)
	}

	async storeCustomerConfig(pluginId: PluginId, configJson: string): Promise<void> {
		assert(isNotNull(this.customerPluginConfigsList), "Current user dont have a customer")

		const existingPluginConfig = await this.fetchCustomerConfig(pluginId)
		if (isNotNull(existingPluginConfig)) {
			existingPluginConfig.configJson = configJson
			return await this.entityClient.update(existingPluginConfig)
		} else {
			const newPluginConfig = createPluginConfiguration({ configJson })
			newPluginConfig._id = [this.customerPluginConfigsList, stringToBase64UrlCustomId(pluginId)]
			newPluginConfig._ownerGroup = this.customerGroup
			await this.entityClient.setup(this.customerPluginConfigsList, newPluginConfig)
		}
	}

	async removeCustomerPluginConfig(pluginId: PluginId): Promise<void> {
		const customer = await this.logins.getUserController().reloadCustomer()
		if (isNull(customer.plugins)) {
			return
		}
		const existing = await this.entityClient
			.load(PluginConfigurationTypeRef, [customer.plugins.pluginConfigs, stringToBase64UrlCustomId(pluginId)])
			.catch(ofClass(NotFoundError, () => null))
		if (isNotNull(existing)) {
			await this.entityClient.erase(existing)
		}
	}
}
