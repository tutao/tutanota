import { PluginHostApi } from "../../sdk/hostApi/PluginHostApi"
import { assertNotNull, isNotNull, Nullable } from "../../../platform-kit/utils"
import { PluginFileReference } from "../../sdk/FileImportExtensionPoint"
import { PluginDataFile } from "../../sdk/PluginDataFile"
import { NextcloudPlugin } from "./NextcloudPlugin"
import { isNull } from "../../../platform-kit/utils/Utils"
import { CustomerConfigPluginError, GeneralPluginError } from "../../sdk/PluginError"
import { PluginVersion } from "../../sdk/PluginManifest"
import { HttpClient, HttpClientJavascript, HttpMethod, HttpResponse, MediaType, RestBinaryBody } from "../../../platform-kit/http-client"
import { EnvProvider, TimeConstants } from "../../../platform-kit/app-env"

export type NextcloudCredentials = {
	appPassword: string
	loginName: string
	server: string
}

export class NextcloudApi {
	private static httpClient: HttpClient = new HttpClientJavascript(TimeConstants.secondsToMillis(5))
	private nextCloudCredentials: Nullable<NextcloudCredentials>

	public constructor(
		private nextCloudUrl: Readonly<string>,
		private readonly hostApi: PluginHostApi,
		private readonly host: Readonly<string>,
		private readonly nextcloudPlugin: NextcloudPlugin,
	) {
		this.nextCloudCredentials = null
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

		// always proxy login flow in order to be able to define the device name displayed
		// in http://nextcloud.local/index.php/settings/user/security
		const loginUrl = this.proxy(`/index.php/login/v2`)
		const nextcloudResponse = await NextcloudApi.httpClient.request(
			loginUrl,
			HttpMethod.POST,
			null,
			{
				"OCS-APIRequest": "true",
			},
			MediaType.Json,
			EnvProvider.get().getTimeOutValue(),
			null,
			null,
			null,
			null,
		)
		if (nextcloudResponse.status !== 200) {
			throw new Error("Nextcloud login flow failed.")
		}
		// the body is only populated for successful responses, so it must not be read before the status check
		const responseData = nextcloudResponse.getJsonBody<any>()
		const poll = responseData.poll
		const userLoginUrl = responseData.login
		const windowId = await this.hostApi.openWindow(userLoginUrl)
		if (isNull(windowId)) {
			throw new Error("Failed to open the Nextcloud login page")
		}

		while (true) {
			const pollResponse = await NextcloudApi.httpClient.request(
				this.proxy(`/index.php/login/v2/poll?token=${poll.token}`),
				HttpMethod.POST,
				null,
				{
					"OCS-APIRequest": "true",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				MediaType.Json,
				EnvProvider.get().getTimeOutValue(),
				null,
				null,
				null,
				null,
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
			const pollResponseData = pollResponse.getJsonBody<any>()
			this.nextCloudCredentials = {
				loginName: assertNotNull(pollResponseData.loginName),
				server: assertNotNull(pollResponseData.server),
				appPassword: assertNotNull(pollResponseData.appPassword),
			}
			await this.nextcloudPlugin.credentialsUpdated(this.nextCloudCredentials)
			return
		}
	}

	async downloadFile(fileReference: PluginFileReference): Promise<PluginDataFile> {
		await this.loginAndCreateAppToken()
		const davPath = fileReference.path.replace(/^\/+/, "")
		const davUrl = this.proxyIfNeeded(`/remote.php/dav/files/${assertNotNull(this.nextCloudCredentials).loginName}/${davPath}`)
		const name = davUrl.split("/").pop()!
		const authToken = await this.getAuthToken()

		const headers = {
			Authorization: `Basic ${authToken}`,
			"OCS-APIRequest": "true",
		}

		let response: HttpResponse
		try {
			response = await NextcloudApi.httpClient.request(
				davUrl,
				HttpMethod.GET,
				null,
				headers,
				MediaType.Binary,
				EnvProvider.get().getTimeOutValue(),
				null,
				null,
				null,
				null,
			)
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
		const contentType = response.getResponseHeader("Content-Type")
		const responseData = response.getBinaryBody()

		const mimeType = typeof contentType === "string" ? contentType : "application/octet-stream"
		const data = new Uint8Array(assertNotNull(responseData, "Got no content of files"))
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
		const davUrl = this.proxyIfNeeded(`/remote.php/dav/files/${assertNotNull(this.nextCloudCredentials).loginName}/${targetFolder}/${dataFile.name}`)
		const authToken = await this.getAuthToken()

		const putHeaders = {
			"If-None-Match": "*", // do not override already existing files,
			"X-NC-WebDAV-Auto-Mkcol": 1, // auto create parent folder
			Authorization: `Basic ${authToken}`,
			"OCS-APIRequest": "true",
		}

		try {
			const putResponse = await NextcloudApi.httpClient.request(
				davUrl,
				HttpMethod.PUT,
				new RestBinaryBody(dataFile.data),
				putHeaders,
				MediaType.Json,
				EnvProvider.get().getTimeOutValue(),
				null,
				null,
				null,
				null,
			)
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
		const postHeaders = {
			"OCS-APIRequest": "true",
			Accept: "application/json",
			Authorization: `Basic ${authToken}`,
		}

		const roomCreationUrl = this.proxyIfNeeded(`/ocs/v2.php/apps/spreed/api/v4/room?roomType=3&roomName=${roomName}`)
		try {
			const postResponse = await NextcloudApi.httpClient.request(
				roomCreationUrl,
				HttpMethod.POST,
				null,
				postHeaders,
				MediaType.Json,
				EnvProvider.get().getTimeOutValue(),
				null,
				null,
				null,
				null,
			)
			if (postResponse.status === 401) {
				this.nextCloudCredentials = null
				return await this.createTalkRoom(roomName)
			}

			this.throwErrorIfNotOk(postResponse, `While creating room: "${roomName}"`)

			const joinToken: string = assertNotNull(postResponse.getJsonBody<any>()?.ocs?.data?.token ?? null, "Did not found token after creating talk room")
			return {
				joinUrl: `${this.nextCloudUrl}/index.php/call/${joinToken}`,
			}
		} catch (err) {
			console.error(`Error while creating meeting room:....`)
			console.error(err)
			throw err
		}
	}

	private throwErrorIfNotOk(response: HttpResponse, context: string) {
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

	private proxyIfNeeded(targetUrl: string): string {
		if (["app.tuta.com", "app.test.tuta.com", "app.local.tuta.com", "localhost"].includes(this.host)) {
			return `${this.nextCloudUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
		} else {
			return `${this.nextCloudUrl}${targetUrl}`
		}
	}

	private proxy(targetUrl: string): string {
		return `${this.nextCloudUrl}/index.php/apps/tutamail/api/v1/proxy${targetUrl}`
	}

	public static async getInstalledVersion(newUrl: string): Promise<PluginVersion> {
		let versionResponse: HttpResponse
		try {
			versionResponse = await NextcloudApi.httpClient.request(
				`${newUrl}/ocs/v2.php/apps/tutamail/api/v1/version`,
				HttpMethod.GET,
				null,
				{},
				MediaType.Json,
				EnvProvider.get().getTimeOutValue(),
				null,
				null,
				null,
				null,
			)
		} catch (e) {
			throw new CustomerConfigPluginError(`Nextcloud URL is wrong: "${newUrl}"`)
		}

		if (versionResponse.status === 200) {
			return versionResponse.getJsonBody<PluginVersion>()
		} else {
			throw new CustomerConfigPluginError(`Tutamail app is not installed on Nextcloud instance: "${newUrl}"`)
		}
	}
}
