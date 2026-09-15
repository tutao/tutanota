import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ConfigFieldConfiguration, ExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../../sdk/EventLocationButtonExtensionPoint"
import { default as ncAxios } from "@nextcloud/axios"
import { assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { isNull } from "../../../platform-kit/utils/Utils"
import { ConfigFieldExtension } from "../../sdk/ConfigFieldExtensionPoint"

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
export class Plugin extends PluginApi implements AttachmentButtonExtension, ConfigFieldExtension, EventLocationButtonExtension {
	private userConfig: Nullable<UserPluginConfig> = null
	private customerConfig: CustomerPluginConfig = null!
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
		await this.reloadUserConfig()

		const configFieldConfig: ConfigFieldConfiguration = {
			extensionPoint: ExtensionPoint.ConfigField,
			configFieldId: "nextCloudUrl",
			text: { en: "Nextcloud instance URI" },
		}
		this.pluginHost.registerConfigField(configFieldConfig)

		let saveAttachmentBtnConfig: ButtonConfiguration = {
			extensionPoint: ExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
		}
		this.pluginHost.registerButton(saveAttachmentBtnConfig)

		let eventLocationBtnConfig: ButtonConfiguration = {
			extensionPoint: ExtensionPoint.EventLocationButton,
			text: { en: "Start Nextcloud Talk meeting", de: "Nextcloud Talk Meeting starten" },
		}
		this.pluginHost.registerButton(eventLocationBtnConfig)
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
		const response = await ncAxios.post(
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
		}

		return this.userConfig
	}

	private async loginToNextcloud(): Promise<NextcloudCredentials | null> {
		const nextcloudResponse = await ncAxios.post(this.proxiedUrl("/index.php/login/v2"), undefined, {
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

	private async reloadUserConfig(): Promise<void> {
		const configString = await this.pluginHost.getUserConfig()
		this.userConfig = isNotNull(configString) ? JSON.parse(configString) : null
	}

	private proxiedUrl(targetUrl: string): string {
		return `${this.customerConfig.nextCloudUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
	}

	makePutRequestToNextcloud(saveDirUri: string, fileContent: Uint8Array, authToken: string): Promise<void> {
		const filePutHeaders = {
			headers: {
				// "If-None-Match": "*", // do not override already existing files,
				"OCS-APIRequest": "true",
				Authorization: `Basic ${authToken}`,
			},
		}

		return ncAxios
			.put(saveDirUri, fileContent, filePutHeaders)
			.then((_) => {
				// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-ok-msg", "Your attachment is saved to nextcloud"))
			})
			.catch((err) => {
				// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-err-msg", "You attachment could not be saved to nextcloud"))
			})
	}
}
