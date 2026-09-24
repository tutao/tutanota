import { PluginApi } from "../../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint, PluginHostApi } from "../../sdk/hostApi/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../../sdk/EventLocationButtonExtensionPoint"
import { isNotNull, Nullable } from "../../../platform-kit/utils"
import { isNull } from "../../../platform-kit/utils/Utils"
import { FileImportExtension, PluginFileReference } from "../../sdk/FileImportExtensionPoint"
import { initTutaPluginWorker, PluginFactory } from "../../sdk/PluginLoader"
import { NextcloudApi } from "./NextcloudApi"
import { PluginId } from "../../sdk/PluginId"
import { PluginManifest } from "../../sdk/PluginManifest"
import { NEXTCLOUD_PLUGIN_MANIFEST } from "./manifest"
import { CustomerConfigPluginError } from "../../sdk/PluginError"

type UserPluginConfig = {
	credentials: Nullable<NextcloudCredentials>
}

type CustomerPluginConfig = {
	nextCloudUrl: string
	targetAttachmentFolder: string
}

type NextcloudCredentials = {
	appPassword: string
	loginName: string
	server: string
}

export class NextcloudPlugin extends PluginApi implements AttachmentButtonExtension, EventLocationButtonExtension, FileImportExtension {
	public static readonly PLUGIN_ID: PluginId = "nextcloud"
	private userConfig: UserPluginConfig = null!
	private customerConfig: CustomerPluginConfig = null!
	private nextcloudApi: NextcloudApi = null!

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
	}

	override getManifest(): Promise<PluginManifest> {
		return Promise.resolve(NEXTCLOUD_PLUGIN_MANIFEST)
	}

	override async load(customerConfigJson: string): Promise<void> {
		this.customerConfig = JSON.parse(customerConfigJson)
		await this.loadUserConfig()
		await this.applyConfigExtensionPoints()
		await this.applyAppExtensionPoints()

		this.nextcloudApi = new NextcloudApi(this.customerConfig.nextCloudUrl, this.pluginHost, await this.pluginHost.getHost(), this)
		if (isNotNull(this.userConfig.credentials)) {
			this.nextcloudApi.setNextcloudCredentials(this.userConfig.credentials)
		}
	}

	public async credentialsUpdated(updatedCredentials: NextcloudCredentials) {
		this.userConfig.credentials = updatedCredentials
		await this.updateUserConfig()
	}

	private async applyConfigExtensionPoints() {
		const configFieldConfig: ConfigFieldConfiguration = {
			extensionPoint: ExtensionPoint.ConfigField,
			configFieldId: "nextCloudUrl",
			text: { en: "Nextcloud instance URI" },
		}

		const defaultFolderConfig: ConfigFieldConfiguration = {
			configFieldId: "targetAttachmentFolder",
			extensionPoint: ExtensionPoint.ConfigField,
			text: { en: "Folder to store attachments" },
		}
		await this.pluginHost.registerConfigFields([configFieldConfig, defaultFolderConfig])
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

	override async unload(): Promise<void> {}

	async attachmentButtonClicked(dataFile: PluginDataFile): Promise<void> {
		const targetFolder = this.customerConfig.targetAttachmentFolder

		const { filesUiUrl } = await this.nextcloudApi.uploadFile(dataFile, targetFolder)
		await this.pluginHost.openWindow(filesUiUrl)
	}

	async receiveFileReference(fileReference: PluginFileReference): Promise<void> {
		const downloadedFile = await this.nextcloudApi.downloadFile(fileReference)
		await this.pluginHost.openMailEditor(downloadedFile)
	}

	async eventLocationButtonClicked(roomName: string): Promise<string> {
		const { joinUrl } = await this.nextcloudApi.createTalkRoom(roomName)

		return joinUrl
	}

	private async loadUserConfig() {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null

		if (isNull(this.userConfig)) {
			this.userConfig = { credentials: null }
		}
	}

	private async loadCustomerConfig(): Promise<void> {
		const configString = await this.pluginHost.getCustomerConfig()
		if (isNull(configString)) {
			throw new Error("Deletion of customer plugin config should have unloaded the plugin")
		}
		this.customerConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	private async updateUserConfig(): Promise<void> {
		await this.pluginHost.storeUserConfig(JSON.stringify(this.userConfig))
	}

	override async onCustomerConfigChange(): Promise<void> {
		await this.loadCustomerConfig()
		this.nextcloudApi.setNextcloudUrl(this.customerConfig.nextCloudUrl)
	}

	override async verifyCustomerConfiguration(newCustomerConfig: string): Promise<void> {
		const customerConfig: CustomerPluginConfig = JSON.parse(newCustomerConfig)

		const newUrl = customerConfig.nextCloudUrl
		const installedVersion = await this.nextcloudApi.getInstalledVersion(newUrl)
		if (installedVersion.major > NEXTCLOUD_PLUGIN_MANIFEST.version.major) {
			throw new CustomerConfigPluginError(
				`Tuta plugin installed in Nextcloud is too old. Try updating tuta app in nexcloud to version: ${NEXTCLOUD_PLUGIN_MANIFEST.version.major}`,
			)
		}

		if (customerConfig.targetAttachmentFolder.trim().length === 0) {
			throw new CustomerConfigPluginError(`Need a non-empty folder name`)
		}
	}

	override async onUserConfigChange(): Promise<void> {
		await this.loadUserConfig()
		if (isNotNull(this.userConfig.credentials)) {
			this.nextcloudApi.setNextcloudCredentials(this.userConfig.credentials)
		}
	}
}

const pluginFactory: PluginFactory = (factoryParams) => new NextcloudPlugin(factoryParams.pluginHost)
initTutaPluginWorker(NextcloudPlugin.PLUGIN_ID, pluginFactory)
