import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../../sdk/EventLocationButtonExtensionPoint"
import type { Axios } from "axios"
import { assertNotNull, isNotNull } from "../../../platform-kit/utils"
import { isNull } from "../../../platform-kit/utils/Utils"
import { ConfigFieldExtension } from "../../sdk/ConfigFieldExtensionPoint"
import { FileImportExtension, PluginFileReference } from "../../sdk/FileImportExtensionPoint"
import { initTutaPluginWorker, PluginFactory } from "../../sdk/PluginLoader"

type UserPluginConfig = {
	credentials: NextcloudCredentials
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
		await this.loadAxiosClient()
		await this.loadUserConfig()
		await this.applyConfigExtensionPoints()
		await this.applyAppExtensionPoints()
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
		console.log("data file " + dataFile.name)

		const { credentials: nextcloudCredentials } = await this.getOrMakeUserConfig()
		const davFileName = `dav/files/${nextcloudCredentials.loginName}/tuta/${dataFile.name}`
		const davUrl = this.proxiedUrl(`/remote.php/${davFileName}`)
		const token = btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
		await this.makePutRequestToNextcloud(davUrl, dataFile.data, token)
	}

	async receiveFileReference(fileReference: PluginFileReference): Promise<void> {
		const { credentials: nextcloudCredentials } = await this.getOrMakeUserConfig()
		const davPath = fileReference.path.replace(/^\/+/, "")
		const davUrl = this.proxiedUrl(`/remote.php/dav/files/${nextcloudCredentials.loginName}/${davPath}`)
		const token = btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
		const fileName = davPath.split("/").pop() ?? "attachment"
		const dataFile = await this.makeGetRequestToNextcloud(davUrl, token, fileName)
		await this.pluginHost.openMailEditor(dataFile)
	}

	updateCustomerConfig(globalConfigJson: string): void {
		console.log("updated Config")
	}

	async eventLocationButtonClicked(): Promise<string> {
		const { credentials: nextcloudCredentials } = await this.getOrMakeUserConfig()
		const token = await this.createTalkRoom(nextcloudCredentials)
		return `${this.customerConfig.nextCloudUrl}/index.php/call/${token}`
	}

	private async createTalkRoom(nextcloudCredentials: NextcloudCredentials): Promise<string> {
		const authToken = btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
		const response = await this.axiosClient.post(
			this.proxiedUrl("/ocs/v2.php/apps/spreed/api/v4/room"),
			new URLSearchParams({
				roomType: "3", // public conversation, so external event guests without a Nextcloud account can join via the link
				roomName: "Tuta Meeting",
			}),
			{
				headers: {
					"OCS-APIRequest": "true",
					Accept: "application/json",
					Authorization: `Basic ${authToken}`,
				},
			},
		)
		return response.data.ocs.data.token
	}

	private async getOrMakeUserConfig(): Promise<UserPluginConfig> {
		if (isNull(this.userConfig)) {
			const credentials = await this.loginToNextcloud()
			this.userConfig = { credentials: assertNotNull(credentials, "Failed to obtain nextcloud credentials") }
			await this.storeUserConfig()
		}

		return this.userConfig
	}

	private async loginToNextcloud(): Promise<NextcloudCredentials | null> {
		// TODO:
		// we do not need to do this when we are inside the nextcloud window?

		const nextcloudResponse = await this.axiosClient.post(this.proxiedUrl("/index.php/login/v2"), undefined, {
			headers: {
				"OCS-APIRequest": "true",
			},
		})
		const poll = nextcloudResponse.data.poll

		const userLoginUrl = nextcloudResponse.data.login

		window.open(userLoginUrl)

		while (true) {
			const pollResponse = await fetch(this.proxiedUrl("/index.php/login/v2/poll"), {
				method: "POST",
				headers: {
					"OCS-APIRequest": "true",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					token: poll.token,
				}),
			})

			if (pollResponse.status === 404) {
				await new Promise((resolve) => setTimeout(resolve, 2000))
				console.log("Waiting for user to finish Nextcloud login")
				continue
			}

			if (!pollResponse.ok) {
				console.error(`Error in Nextcloud login flow. Response code: ${pollResponse.status}`)
				console.error(pollResponse.body)
				return null
			}

			return await pollResponse.json()
		}
	}

	protected async loadUserConfig(): Promise<void> {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	protected async storeUserConfig(): Promise<void> {
		await this.pluginHost.storeUserConfig(JSON.stringify(this.userConfig))
	}

	private proxiedUrl(targetUrl: string): string {
		return `${this.customerConfig.nextCloudUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
	}

	private async loadAxiosClient() {
		// when tuta is running inside nextcloud, we will not spawn thread for plugin
		// then we can use @nextcloud/axios client, which handles the authentication for us
		// when not, we will always have an authentaciation token when needed.
		if (typeof window !== "undefined") {
			this.axiosClient = (await import("@nextcloud/axios")).default
		} else {
			this.axiosClient = new (await import("axios")).Axios()
		}
	}

	private async makeGetRequestToNextcloud(fileUri: string, authToken: string, fileName: string): Promise<PluginDataFile> {
		const fileGetHeaders = {
			headers: {
				"OCS-APIRequest": "true",
				Authorization: `Basic ${authToken}`,
			},
			responseType: "arraybuffer" as const,
		}

		const response = await this.axiosClient.get(fileUri, fileGetHeaders)
		const data = new Uint8Array(response.data)
		const contentType = response.headers["content-type"]
		return {
			name: fileName,
			mimeType: typeof contentType === "string" ? contentType : "application/octet-stream",
			data,
			size: data.byteLength,
		}
	}

	async makePutRequestToNextcloud(saveDirUri: string, fileContent: Uint8Array, authToken: string): Promise<void> {
		const filePutHeaders = {
			headers: {
				// "If-None-Match": "*", // do not override already existing files,
				"OCS-APIRequest": "true",
				Authorization: `Basic ${authToken}`,
			},
		}

		return this.axiosClient
			.put(saveDirUri, fileContent, filePutHeaders)
			.then((_: any) => {
				// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-ok-msg", "Your attachment is saved to nextcloud"))
			})
			.catch((err: any) => {
				// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-err-msg", "You attachment could not be saved to nextcloud"))
			})
	}
}

const pluginFactory: PluginFactory = (factoryParams) => new NextcloudPlugin(factoryParams.pluginHost)
initTutaPluginWorker(NextcloudPlugin.PLUGIN_ID, pluginFactory)
