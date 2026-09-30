import { HttpClient, HttpMethod, MediaType, RestBodyType, RestTextBody } from "@tutao/http-client"
import { DomainConfigProvider } from "../api/common/DomainConfigProvider"
import { PluginManifestFetcher } from "../../../plugin-kit/plugin-manager/PluginManager"
import { PluginId } from "../../../plugin-kit/sdk/PluginId"
import { PluginManifest } from "../../../plugin-kit/sdk/PluginManifest"
import { TimeConstants } from "@tutao/app-env"
import { downcast } from "@tutao/utils"

export class PluginManifestProvider implements PluginManifestFetcher {
	constructor(
		private readonly httpClient: HttpClient,
		private domainConfigProvider: DomainConfigProvider,
	) {}

	async fetchManifestJson(pluginId: PluginId): Promise<PluginManifest> {
		const pluginManifestUrl = `${this.domainConfigProvider.getCurrentDomainConfig().apiUrl}/plugin-kit/plugins/${pluginId}/manifest.json`
		const manifestResponse = await this.httpClient.request(
			pluginManifestUrl,
			HttpMethod.GET,
			null,
			{},
			MediaType.Json,
			TimeConstants.secondsToMillis(5),
			null,
			true,
			null,
			null,
		)
		if (manifestResponse.status !== 200) {
			throw new Error(`Could not fetch manifest file: ${manifestResponse.status}`)
		}

		if (manifestResponse.body?.bodyType === RestBodyType.Text) {
			return JSON.parse(downcast<RestTextBody>(manifestResponse.body).payload)
		} else {
			throw new Error("Received non text response")
		}
	}
}
