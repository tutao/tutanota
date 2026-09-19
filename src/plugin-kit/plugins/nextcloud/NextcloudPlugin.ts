import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../../sdk/EventLocationButtonExtensionPoint"
import type { Axios } from "axios"
import { isNotNull, Nullable } from "../../../platform-kit/utils"
import { isNull } from "../../../platform-kit/utils/Utils"
import { ConfigFieldExtension } from "../../sdk/ConfigFieldExtensionPoint"
import { FileImportExtension, PluginFileReference } from "../../sdk/FileImportExtensionPoint"
import { initTutaPluginWorker, PluginFactory } from "../../sdk/PluginLoader"
import { NextcloudApi } from "./NextcloudApi"

type UserPluginConfig = {
	credentials: Nullable<NextcloudCredentials>
}

type CustomerPluginConfig = {
	nextCloudUrl: string
}

type NextcloudCredentials = {
	appPassword: string
	loginName: string
	server: string
}

export class NextcloudPlugin extends PluginApi implements AttachmentButtonExtension, ConfigFieldExtension, EventLocationButtonExtension, FileImportExtension {
	public static readonly PLUGIN_ID: string = "nextcloud"
	private userConfig: UserPluginConfig = null!
	private customerConfig: CustomerPluginConfig = null!
	private axiosClient: Axios = null!
	private nextcloudApi: NextcloudApi = null!

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
	}

	getMetadata(): PluginMetadata {
		return {
			name: "Nextcloud Plugin",
			description: "Save attachments to your Nextcloud server",
			version: "1",
		}
	}

	async load(customerConfigJson: string): Promise<void> {
		this.customerConfig = JSON.parse(customerConfigJson)
		await this.loadOrCreateEmptyConfig()
		await this.applyConfigExtensionPoints()
		await this.applyAppExtensionPoints()

		this.nextcloudApi = new NextcloudApi(this.customerConfig.nextCloudUrl, this.pluginHost)
		if (isNotNull(this.userConfig.credentials)) {
			this.nextcloudApi.setNextcloudCredentials(this.userConfig.credentials)
		}
	}

	private async updateCredsConfigIfNeeded() {
		const needToUpdateCreds =
			// 1) if config had no creds
			isNull(this.userConfig.credentials) ||
			// 2) if config had old one
			(await this.nextcloudApi.credentialsHasChanged(this.userConfig.credentials))
		if (needToUpdateCreds) {
			this.userConfig.credentials = await this.nextcloudApi.getNextcloudCredentials()
			await this.updateUserConfig()
		}
	}

	private async applyConfigExtensionPoints() {
		const configFieldConfig: ConfigFieldConfiguration = {
			extensionPoint: ExtensionPoint.ConfigField,
			configFieldId: "nextCloudUrl",
			text: { en: "Nextcloud instance URI" },
		}
		await this.pluginHost.registerConfigField(configFieldConfig)
	}

	private async applyAppExtensionPoints() {
		let saveAttachmentBtnConfig: ButtonConfiguration = {
			extensionPoint: ExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
		}
		await this.pluginHost.registerButton(saveAttachmentBtnConfig)

		let eventLocationBtnConfig: ButtonConfiguration = {
			extensionPoint: ExtensionPoint.EventLocationButton,
			text: { en: "Start Nextcloud Talk meeting", de: "Nextcloud Talk Meeting starten" },
		}
		await this.pluginHost.registerButton(eventLocationBtnConfig)
	}

	async unload(): Promise<void> {}

	async attachmentButtonClicked(dataFile: PluginDataFile): Promise<void> {
		await this.updateCredsConfigIfNeeded()

		const { filesUiUrl } = await this.nextcloudApi.uploadFile(dataFile)
		await this.pluginHost.openWindow(filesUiUrl)
	}

	async receiveFileReference(fileReference: PluginFileReference): Promise<void> {
		await this.updateCredsConfigIfNeeded()

		const downloadedFile = await this.nextcloudApi.downloadFile(fileReference)
		await this.pluginHost.openMailEditor(downloadedFile)
	}

	async eventLocationButtonClicked(): Promise<string> {
		await this.updateCredsConfigIfNeeded()

		const { joinUrl } = await this.nextcloudApi.createTalkRoom("TutaRoom")

		return joinUrl
	}

	private async loadOrCreateEmptyConfig() {
		await this.loadUserConfig()

		if (isNull(this.userConfig)) {
			this.userConfig = { credentials: null }
		}
	}

	protected async loadUserConfig(): Promise<void> {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	updateCustomerConfig(globalConfigJson: string): void {
		console.log("updated Config")
	}

	protected async updateUserConfig(): Promise<void> {
		await this.pluginHost.storeUserConfig(JSON.stringify(this.userConfig))
	}
}

const pluginFactory: PluginFactory = (factoryParams) => new NextcloudPlugin(factoryParams.pluginHost)
initTutaPluginWorker(NextcloudPlugin.PLUGIN_ID, pluginFactory)
