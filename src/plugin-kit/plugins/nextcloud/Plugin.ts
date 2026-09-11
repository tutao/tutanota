import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"
import { default as ncAxios } from "@nextcloud/axios"
import { DownloadReturn } from "../../../applications/common/file/FileController"
import { TransferId } from "../../../entities/drive/Utils"
import { Dialog } from "../../../ui/base/Dialog"
import { LanguageViewModel } from "../../../ui/utils/LanguageViewModel"

export class Plugin extends PluginApi implements AttachmentButtonExtension {
	public readonly attachmentButton: ButtonConfiguration

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
		console.log("data file " + dataFile.name)

		const davFileName = `dav/files/admin/tuta/${dataFile.name}`
		const url = `http://nextcloud.tuta/remote.php/${davFileName}`

		const { transferIds, promise } = makePutRequestToNextcloud(url, dataFile.data)
		await promise
		console.log("uploaded to nextcloud?")
	}
}

function makePutRequestToNextcloud(saveDirUri: string, fileContent: Uint8Array): DownloadReturn {
	const loginName = "admin"
	const appPassword = "APP_PASSWORD" // The generated Nextcloud App Password
	const token = btoa(`${loginName}:${appPassword}`)
	console.log(token)
	const filePutHeaders = {
		headers: {
			"If-None-Match": "*", // do not override already existing files,
			Authorization: `Basic ${token}`,
		},
	}
	const transferIds: TransferId[] = []
	const promise = ncAxios
		.put(saveDirUri, fileContent, filePutHeaders)
		.then((_) => {
			Dialog.message(LanguageViewModel.makeTranslation("nextcloud-ok-msg", "Your attachment is saved to nextcloud"))
		})
		.catch((err) => {
			Dialog.message(LanguageViewModel.makeTranslation("nextcloud-err-msg", "You attachment could not be saved to nextcloud"))
		})
	return { transferIds, promise }
}
