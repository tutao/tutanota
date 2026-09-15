import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { default as ncAxios } from "@nextcloud/axios"
import { assert, assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { isNull } from "../../../platform-kit/utils/Utils"

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
export class Plugin extends PluginApi implements AttachmentButtonExtension {
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

	async load(): Promise<void> {
		await this.reloadUserConfig()
		await this.reloadCustomerConfig()

		let saveAttachmentBtnConfig: ButtonConfiguration = {
			extensionPoint: ButtonExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
		}
		this.pluginHost.registerButton(saveAttachmentBtnConfig)
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

	private async reloadCustomerConfig(): Promise<void> {
		// FIXME:
		this.customerConfig = { nextCloudUrl: "http://nextcloud.local" }
	}

	private async updateConfig(): Promise<void> {
		assert(isNotNull(this.userConfig), "Tried to set config to null?")
		await this.pluginHost.storeUserConfig(JSON.stringify(this.userConfig))
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
