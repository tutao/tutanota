import { ConfigurationAdapter } from "../../../plugin-kit/plugin-manager/PluginHost"
import { assertNotNull, base64UrlCustomIdToString, isNotNull, Nullable, ofClass, stringToBase64UrlCustomId } from "@tutao/utils"
import { createPluginConfiguration, PluginConfiguration, PluginConfigurationTypeRef, UserTypeRef } from "@tutao/entities/sys"
import { elementIdPart, idToElementId, ListElementId } from "@tutao/meta"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction"
import { EnabledPlugin, PluginManager } from "../../../plugin-kit/plugin-manager/PluginManager"
import { LoginController } from "../api/main/LoginController"

export class PluginConfigurationProvider implements ConfigurationAdapter, PostLoginAction {
	private pluginListId: Id = null!
	private userOwnerGroup: Id = null!
	private pluginManager: Nullable<PluginManager> = null

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
		const loggedInUser = await this.entityClient.load(UserTypeRef, idToElementId(userId))
		this.userOwnerGroup = assertNotNull(loggedInUser._ownerGroup)
		this.pluginListId = assertNotNull(loggedInUser.plugins).pluginConfigs

		const customer = this.logins.getUserController().getCustomer()
		if (customer && customer.plugins) {
			const pluginConfigs = await this.entityClient.loadAll(PluginConfigurationTypeRef, customer.plugins.pluginConfigs)

			const enabledPlugins = pluginConfigs.map((pc) => {
				const pluginId = base64UrlCustomIdToString(elementIdPart(pc._id))
				const globalConfigJson = pc.configJson
				return { pluginId, globalConfigJson } as EnabledPlugin
			})

			await assertNotNull(this.pluginManager).loadPlugins(enabledPlugins)
		}
	}

	async storeConfig(pluginId: string, configJson: string): Promise<void> {
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
	async getConfig(pluginId: string): Promise<string> {
		const pluginConfig = await this.fetchConfig(pluginId)
		return isNotNull(pluginConfig) ? pluginConfig.configJson : ""
	}

	async fetchConfig(pluginId: string): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.pluginListId, stringToBase64UrlCustomId(pluginId)]
		return await this.entityClient.load(PluginConfigurationTypeRef, userPluginConfigId).catch(ofClass(NotFoundError, () => null))
	}
}
