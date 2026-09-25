import { Axios, AxiosResponse } from "axios"
import { PluginHostApi } from "../../sdk/hostApi/PluginHostApi"
import { assertNotNull, isNotNull, Nullable } from "../../../platform-kit/utils"
import { PluginFileReference } from "../../sdk/FileImportExtensionPoint"
import { PluginDataFile } from "../../sdk/PluginDataFile"
import { NextcloudPlugin } from "./NextcloudPlugin"
import { isNull } from "../../../platform-kit/utils/Utils"
import { CustomerConfigPluginError, GeneralPluginError } from "../../sdk/PluginError"
import { PluginVersion } from "../../sdk/PluginManifest"

export type NextcloudCredentials = {
	appPassword: string
	loginName: string
	server: string
}

export class NextcloudApi {
	private static axiosClient: Axios = new Axios()
	private nextCloudCredentials: Nullable<NextcloudCredentials>

	private static initializeAxiosClient() {
		// to convert all `.data` in response to json
		this.axiosClient.interceptors.response.use((response) => {
			if (
				typeof response.data === "string" &&
				(response.data.startsWith("{") || response.data.startsWith("[")) &&
				(response.data.endsWith("}") || response.data.startsWith("]"))
			) {
				response.data = JSON.parse(response.data)
			}
			return response
		}, null)
	}

	public constructor(
		private nextCloudUrl: Readonly<string>,
		private readonly hostApi: PluginHostApi,
		private readonly host: Readonly<string>,
		private readonly nextcloudPlugin: NextcloudPlugin,
	) {
		this.nextCloudCredentials = null
		NextcloudApi.initializeAxiosClient()
	}

	public setNextcloudCredentials(nextcloudCredentials: NextcloudCredentials): this {
		this.nextCloudCredentials = nextcloudCredentials
		return this
	}

	public setNextcloudUrl(nextcloudUrl: string): this {
		this.nextCloudUrl = nextcloudUrl
		return this
	}

	public async loginAndCreateAppToken(): Promise<void> {
		if (isNotNull(this.nextCloudCredentials)) {
			return
		}

		const nextcloudResponse = await NextcloudApi.axiosClient.post(this.proxiedUrl("/index.php/login/v2"), undefined, {
			headers: {
				"OCS-APIRequest": "true",
			},
		})

		const poll = nextcloudResponse.data.poll
		const userLoginUrl = nextcloudResponse.data.login
		const windowId = await this.hostApi.openWindow(userLoginUrl)
		if (isNull(windowId)) {
			throw new Error("Failed to open the Nextcloud login page")
		}

		while (true) {
			const pollResponse = await NextcloudApi.axiosClient.post(
				this.proxiedUrl(`/index.php/login/v2/poll?token=${poll.token}`),
				new URLSearchParams({
					token: poll.token,
				}),
				{
					headers: {
						"OCS-APIRequest": "true",
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
			)

			if (pollResponse.status === 404) {
				if (await this.hostApi.isWindowOpen(windowId)) {
					await new Promise((resolve) => setTimeout(resolve, 2000))
					console.log("Waiting for user to finish Nextcloud login")
					continue
				} else {
					console.error("Nextcloud login flow is not completed")
					throw new Error("Nextcloud login flow is not completed")
				}
			}

			await this.hostApi.closeWindow(windowId)
			this.throwErrorIfNotOk(pollResponse, "During login flow")
			this.nextCloudCredentials = {
				loginName: assertNotNull(pollResponse.data.loginName),
				server: assertNotNull(pollResponse.data.server),
				appPassword: assertNotNull(pollResponse.data.appPassword),
			}
			await this.ensureCredentialsIsOfExpectedUrl()
			await this.nextcloudPlugin.credentialsUpdated(this.nextCloudCredentials)
			return
		}
	}

	private async ensureCredentialsIsOfExpectedUrl() {
		await this.loginAndCreateAppToken()
		if (assertNotNull(this.nextCloudCredentials).server !== this.nextCloudUrl) {
			this.nextCloudCredentials = null
			throw new Error("Nextcloud url mismatch")
		}
	}

	async downloadFile(fileReference: PluginFileReference): Promise<PluginDataFile> {
		await this.loginAndCreateAppToken()
		const davPath = fileReference.path.replace(/^\/+/, "")
		const davUrl = this.proxiedUrl(`/remote.php/dav/files/${assertNotNull(this.nextCloudCredentials).loginName}/${davPath}`)
		const name = davUrl.split("/").pop()!
		const authToken = await this.getAuthToken()

		const getOptions = {
			headers: {
				Authorization: `Basic ${authToken}`,
				"OCS-APIRequest": "true",
			},
			responseType: "arraybuffer" as const,
		}

		let response: AxiosResponse
		try {
			response = await NextcloudApi.axiosClient.get(davUrl, getOptions)
			if (response.status === 401) {
				this.nextCloudCredentials = null
				return await this.downloadFile(fileReference)
			}
			this.throwErrorIfNotOk(response, `While downloading file: "${name}"`)
		} catch (err) {
			console.error(`Error while downloading file file:....`)
			console.error(err)
			throw err
		}
		const contentType = response.headers["Content-Type"]

		const mimeType = typeof contentType === "string" ? contentType : "application/octet-stream"
		const data = new Uint8Array(assertNotNull(response.data, "Got no content of files"))
		const size = data.byteLength

		return {
			name,
			size,
			data,
			mimeType,
		}
	}

	async uploadFile(dataFile: PluginDataFile, targetFolder: string): Promise<{ filesUiUrl: string }> {
		await this.loginAndCreateAppToken()
		const davUrl = this.proxiedUrl(`/remote.php/dav/files/${assertNotNull(this.nextCloudCredentials).loginName}/${targetFolder}/${dataFile.name}`)
		const authToken = await this.getAuthToken()

		const putOptions = {
			headers: {
				"If-None-Match": "*", // do not override already existing files,
				"X-NC-WebDAV-Auto-Mkcol": 1, // auto create parent folder
				Authorization: `Basic ${authToken}`,
				"OCS-APIRequest": "true",
			},
		}

		try {
			const putResponse = await NextcloudApi.axiosClient.put(davUrl, dataFile.data, putOptions)
			if (putResponse.status === 401) {
				this.nextCloudCredentials = null
				return await this.uploadFile(dataFile, targetFolder)
			} else if (putResponse.status === 412) {
				throw new GeneralPluginError(`File with name: "${dataFile.name}" already exists in directory: "${targetFolder}"`)
			}
			this.throwErrorIfNotOk(putResponse, `While uploading file: "${dataFile.name}"`)
		} catch (err) {
			console.error(`Error while uploading file:....`)
			console.error(err)
			throw err
		}

		return { filesUiUrl: `${this.nextCloudUrl}/index.php/apps/files/files?dir=${targetFolder}` }
	}

	public async createTalkRoom(roomName: string): Promise<{ joinUrl: string }> {
		const authToken = await this.getAuthToken()
		const postOptions = {
			headers: {
				"OCS-APIRequest": "true",
				Accept: "application/json",
				Authorization: `Basic ${authToken}`,
			},
		}

		const roomCreationUrl = this.proxiedUrl("/ocs/v2.php/apps/spreed/api/v4/room")
		try {
			const postResponse = await NextcloudApi.axiosClient.post(
				roomCreationUrl,
				new URLSearchParams({
					roomName,
					roomType: "3", // public conversation, so external event guests without a Nextcloud account can join via the link
				}),
				postOptions,
			)
			if (postResponse.status === 401) {
				this.nextCloudCredentials = null
				return await this.createTalkRoom(roomName)
			}

			this.throwErrorIfNotOk(postResponse, `While creating room: "${roomName}"`)

			const joinToken: string = assertNotNull(postResponse.data?.ocs?.data?.token ?? null, "Did not found token after creating talk room")
			return {
				joinUrl: `${this.nextCloudUrl}/index.php/call/${joinToken}`,
			}

			// response.data.ocs.data.token
		} catch (err) {
			console.error(`Error while creating meeting room:....`)
			console.error(err)
			throw err
		}
	}

	private throwErrorIfNotOk(response: AxiosResponse, context: string) {
		const isOkStatus = response.status >= 200 && response.status < 300
		if (!isOkStatus) {
			const msg = `${context}: ${response.status}(${response.statusText})`
			console.error(msg)
			console.error(response)
			throw new Error(msg)
		}
	}

	private async getAuthToken(): Promise<string> {
		await this.loginAndCreateAppToken()
		const nextcloudCredentials = assertNotNull(this.nextCloudCredentials)
		return btoa(`${nextcloudCredentials.loginName}:${nextcloudCredentials.appPassword}`)
	}

	private proxiedUrl(targetUrl: string): string {
		if (["app.tuta.com", "app.test.tuta.com", "app.local.tuta.com", "localhost"].includes(this.host)) {
			return `${this.nextCloudUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
		} else {
			return `${this.nextCloudUrl}${targetUrl}`
		}
	}

	public static async getInstalledVersion(newUrl: string): Promise<PluginVersion> {
		let versionResponse: AxiosResponse
		try {
			versionResponse = await NextcloudApi.axiosClient.get(`${newUrl}/ocs/v2.php/apps/tutamail/api/v1/version`)
		} catch (e) {
			throw new CustomerConfigPluginError(`Nextcloud URL is wrong: "${newUrl}"`)
		}

		if (versionResponse.status === 200) {
			return versionResponse.data
		} else {
			throw new CustomerConfigPluginError(`Tutamail app is not installed on Nextcloud instance: "${newUrl}"`)
		}
	}
}
