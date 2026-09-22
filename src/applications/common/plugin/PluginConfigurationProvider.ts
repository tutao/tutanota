import { ConfigurationAdapter } from "../../../plugin-kit/plugin-manager/PluginHost"
import { assertNotNull, isNotNull, Nullable, ofClass, stringToBase64 } from "@tutao/utils"
import { createPluginConfiguration, PluginConfiguration, PluginConfigurationTypeRef, UserTypeRef } from "@tutao/entities/sys"
import { idToElementId, ListElementId } from "@tutao/meta"
import { NotFoundError } from "@tutao/rest-client/error"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { LoggedInEvent, PostLoginAction } from "../../../app-kit/native-bridge/common/PostLoginAction"

export class PluginConfigurationProvider implements ConfigurationAdapter, PostLoginAction {
	private pluginListId: Id = null!
	private userOwnerGroup: Id = null!

	constructor(private readonly entityRestClient: EntityClient) {}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		return this.init(loggedInEvent.userId)
	}
	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		return this.init(loggedInEvent.userId)
	}

	public async init(userId: Id): Promise<void> {
		const loggedInUser = await this.entityRestClient.load(UserTypeRef, idToElementId(userId))
		this.userOwnerGroup = assertNotNull(loggedInUser._ownerGroup)
		this.pluginListId = assertNotNull(loggedInUser.plugins).pluginConfigs
	}

	async storeConfig(pluginId: string, configJson: string): Promise<void> {
		let pluginConfig = await this.fetchConfig(pluginId)
		if (isNotNull(pluginConfig)) {
			pluginConfig.configJson = configJson
			return await this.entityRestClient.update(pluginConfig)
		} else {
			pluginConfig = createPluginConfiguration({ configJson })
			pluginConfig._id = [this.pluginListId, stringToBase64(pluginId)]
			pluginConfig._ownerGroup = this.userOwnerGroup
			await this.entityRestClient.setup(this.pluginListId, pluginConfig)
		}
	}
	async getConfig(pluginId: string): Promise<string> {
		const pluginConfig = await this.fetchConfig(pluginId)
		return isNotNull(pluginConfig) ? pluginConfig.configJson : ""
	}

	async fetchConfig(pluginId: string): Promise<Nullable<PluginConfiguration>> {
		const userPluginConfigId: ListElementId = [this.pluginListId, stringToBase64(pluginId)]
		return await this.entityRestClient.load(PluginConfigurationTypeRef, userPluginConfigId).catch(ofClass(NotFoundError, () => null))
	}
}
