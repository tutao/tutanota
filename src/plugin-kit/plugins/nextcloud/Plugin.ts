import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { default as ncAxios } from "@nextcloud/axios"

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
		const url = "http://nextcloud.tuta"
		console.log("data file " + dataFile.name)

		let config = await this.pluginHost.getConfig()
		console.log("CONFIG", config)
		config += "M"
		await this.pluginHost.storeConfig(config)

		// const davFileName = `dav/files/admin/tuta/${dataFile.name}`
		// const davUrl = `http://nextcloud.tuta/remote.php/${davFileName}`
		//
		// const nextcloudCredentials = await loginToNextcloud(url)
		// if (isNotNull(nextcloudCredentials)) {
		// 	const token = btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
		// 	const { transferIds, promise } = await makePutRequestToNextcloud(url, dataFile.data, token)
		// 	await promise
		// } else {
		// 	await Dialog.message("nextcloudLoginError_msg")
		// }
	}
}

async function loginToNextcloud(nextcloudServerUrl: string): Promise<NextcloudCredentials | null> {
	const url = `${nextcloudServerUrl}/index.php/login/v2`

	const nextcloudResponse = await ncAxios.post(url)
	const poll = nextcloudResponse.data.poll

	const userLoginUrl = nextcloudResponse.data.login

	window.open(userLoginUrl)

	while (true) {
		const pollResponse = await fetch(poll.endpoint, {
			method: "POST",
			headers: {
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

// async function makePutRequestToNextcloud(saveDirUri: string, fileContent: Uint8Array, authToken: string): Promise<DownloadReturn> {
// 	const filePutHeaders = {
// 		headers: {
// 			"If-None-Match": "*", // do not override already existing files,
// 			"OCS-APIRequest": "true",
// 			Authorization: `Basic ${authToken}`,
// 		},
// 	}
// 	const transferIds: TransferId[] = []
// 	const promise = ncAxios
// 		.put(saveDirUri, fileContent, filePutHeaders)
// 		.then((_) => {
// 			Dialog.message(LanguageViewModel.makeTranslation("nextcloud-ok-msg", "Your attachment is saved to nextcloud"))
// 		})
// 		.catch((err) => {
// 			Dialog.message(LanguageViewModel.makeTranslation("nextcloud-err-msg", "You attachment could not be saved to nextcloud"))
// 		})
// 	return { transferIds, promise }
// }
