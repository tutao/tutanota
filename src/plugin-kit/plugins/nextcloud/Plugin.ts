import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { default as ncAxios } from "@nextcloud/axios"
import { isNotNull } from "../../../platform-kit/utils"
import { TransferId } from "../../../entities/drive/Utils"
import { DownloadReturn } from "../../../applications/common/file/FileController"

type NextcloudCredentials = {
	appPassword: string
	loginName: string
	server: string
}
export class Plugin extends PluginApi implements AttachmentButtonExtension {
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
		let saveAttachmentBtnConfig: ButtonConfiguration = {
			extensionPoint: ButtonExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
		}
		this.pluginHost.registerButton(saveAttachmentBtnConfig)
	}

	async unload(): Promise<void> {}

	async attachmentButtonClicked(dataFile: PluginDataFile): Promise<void> {
		//FIXME get the server url from somewhere
		const url = "http://nextcloud.local"
		console.log("data file " + dataFile.name)

		let config = await this.pluginHost.getUserConfig()
		console.log("CONFIG", config)
		config += "M"
		await this.pluginHost.storeUserConfig(config)

		const nextcloudCredentials = await loginToNextcloud(url)
		if (isNotNull(nextcloudCredentials)) {
			const davFileName = `dav/files/${nextcloudCredentials.loginName}/tuta/${dataFile.name}`
			const davUrl = proxiedUrl(url, `/remote.php/${davFileName}`)
			const token = btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
			const { transferIds, promise } = await makePutRequestToNextcloud(davUrl, dataFile.data, token)
			await promise
		} else {
			// await  Dialog.message("nextcloudLoginError_msg")
		}
	}
}

async function loginToNextcloud(nextcloudServerUrl: string): Promise<NextcloudCredentials | null> {
	const nextcloudResponse = await ncAxios.post(proxiedUrl(nextcloudServerUrl, "/index.php/login/v2"), undefined, {
		headers: {
			"OCS-APIRequest": "true",
		},
	})
	const poll = nextcloudResponse.data.poll

	const userLoginUrl = nextcloudResponse.data.login

	window.open(userLoginUrl)

	while (true) {
		const pollResponse = await fetch(proxiedUrl(nextcloudServerUrl, "/index.php/login/v2/poll"), {
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

async function makePutRequestToNextcloud(saveDirUri: string, fileContent: Uint8Array, authToken: string): Promise<DownloadReturn> {
	const filePutHeaders = {
		headers: {
			// "If-None-Match": "*", // do not override already existing files,
			"OCS-APIRequest": "true",
			Authorization: `Basic ${authToken}`,
		},
	}
	const transferIds: TransferId[] = []
	const promise = ncAxios
		.put(saveDirUri, fileContent, filePutHeaders)
		.then((_) => {
			// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-ok-msg", "Your attachment is saved to nextcloud"))
		})
		.catch((err) => {
			// Dialog.message(LanguageViewModel.makeTranslation("nextcloud-err-msg", "You attachment could not be saved to nextcloud"))
		})
	return { transferIds, promise }
}

function proxiedUrl(nextcloudServerUrl: string, targetUrl: string): string {
	return `${nextcloudServerUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
}
