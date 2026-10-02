import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { NextcloudApi } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudApi"
import { NextcloudPlugin } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudPlugin"
import { PluginHostApi } from "../../../../../src/plugin-kit/sdk/hostApi/PluginHostApi"
import { CustomerConfigPluginError, GeneralPluginError } from "../../../../../src/plugin-kit/sdk/PluginError"
import { PluginFileReference } from "../../../../../src/plugin-kit/sdk/FileImportExtensionPoint"
import { PluginDataFile } from "../../../../../src/plugin-kit/sdk/PluginDataFile"
import { HttpClient, HttpMethod, HttpResponse, MediaType, RestBinaryBody, RestTextBody } from "../../../../../src/platform-kit/http-client"

const LOGIN_URL = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/index.php/login/v2"
const POLL_URL_PREFIX = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/index.php/login/v2/poll?token="
const LOGIN_UI_URL = "https://nc.example.com/login-ui"
const EXPECTED_AUTH_HEADER = `Basic ${btoa("u:p")}`

function jsonResponse(status: number, body: unknown, statusText: string = "OK"): HttpResponse {
	return new HttpResponse(status, statusText, new RestTextBody(JSON.stringify(body)), new Map())
}

/** the http client lower-cases response header names, so fixtures have to do the same */
function binaryResponse(status: number, data: Uint8Array<ArrayBuffer>, headers: Record<string, string> = {}, statusText: string = "OK"): HttpResponse {
	return new HttpResponse(status, statusText, new RestBinaryBody(data), new Map(Object.entries(headers)))
}

/** the http client only populates the body for successful responses, so error fixtures must not have one */
function emptyResponse(status: number, statusText: string): HttpResponse {
	return new HttpResponse(status, statusText, null, new Map())
}

o.spec("NextcloudApiTest", () => {
	const originalHttpClient = (NextcloudApi as any).httpClient
	let httpClient: HttpClient
	let hostApi: PluginHostApi
	let nextcloudPlugin: NextcloudPlugin
	let api: NextcloudApi

	o.beforeEach(() => {
		httpClient = object<HttpClient>()
		;(NextcloudApi as any).httpClient = httpClient
		hostApi = object<PluginHostApi>()
		nextcloudPlugin = object<NextcloudPlugin>()
		api = new NextcloudApi("https://nc.example.com", hostApi, "app.tuta.com", nextcloudPlugin)
	})

	o.afterEach(() => {
		// the client is a static field, restore it so the rest of the suite does not see our double
		;(NextcloudApi as any).httpClient = originalHttpClient
	})

	function requestOf(url: string, method: HttpMethod): Promise<HttpResponse> {
		const anything = matchers.anything
		return httpClient.request(url, method, anything(), anything(), anything(), anything(), anything(), anything(), anything(), anything())
	}

	function stubLoginFlowStart(windowId: number | null) {
		when(requestOf(LOGIN_URL, HttpMethod.POST)).thenResolve(jsonResponse(200, { poll: { token: "poll-token" }, login: LOGIN_UI_URL }))
		when(hostApi.openWindow(LOGIN_UI_URL)).thenResolve(windowId)
	}

	function stubPollResponses(first: HttpResponse, ...rest: HttpResponse[]) {
		const pollUrl = matchers.argThat((url: string) => url.startsWith(POLL_URL_PREFIX))
		when(requestOf(pollUrl, HttpMethod.POST)).thenResolve(first, ...rest)
	}

	function stubSuccessfulLogin(windowId: number, loginName: string, server: string, appPassword: string) {
		stubLoginFlowStart(windowId)
		stubPollResponses(jsonResponse(200, { loginName, server, appPassword }))
		when(hostApi.closeWindow(windowId)).thenResolve(undefined)
	}

	o.spec("setNextcloudUrl / setNextcloudCredentials", () => {
		o.test("are chainable and mutate state", () => {
			const returnedFromCreds = api.setNextcloudCredentials({ loginName: "u", server: "s", appPassword: "p" })
			o.check(returnedFromCreds).equals(api)
			o.check((api as any).nextCloudCredentials).deepEquals({ loginName: "u", server: "s", appPassword: "p" })

			const returnedFromUrl = api.setNextcloudUrl("https://other.example.com")
			o.check(returnedFromUrl).equals(api)
			o.check((api as any).nextCloudUrl).equals("https://other.example.com")
		})
	})

	o.spec("loginAndCreateAppToken", () => {
		o.test("short-circuits when credentials are already set", async () => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
			await api.loginAndCreateAppToken()
			verify(requestOf(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("happy path: logs in, closes the window, stores credentials, notifies the plugin", async () => {
			stubSuccessfulLogin(7, "u", "s", "p")

			await api.loginAndCreateAppToken()

			verify(hostApi.closeWindow(7))
			o.check((api as any).nextCloudCredentials).deepEquals({ loginName: "u", server: "s", appPassword: "p" })
			verify(nextcloudPlugin.credentialsUpdated({ loginName: "u", server: "s", appPassword: "p" }))
		})

		o.test("always proxies the login request and asks for a json response", async () => {
			stubSuccessfulLogin(7, "u", "s", "p")

			await api.loginAndCreateAppToken()

			verify(
				httpClient.request(
					LOGIN_URL,
					HttpMethod.POST,
					null,
					{ "OCS-APIRequest": "true" },
					MediaType.Json,
					matchers.isA(Number),
					null,
					null,
					null,
					null,
				),
			)
		})

		o.test("throws when the login POST does not return 200", async () => {
			when(requestOf(LOGIN_URL, HttpMethod.POST)).thenResolve(emptyResponse(500, "Server Error"))

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Nextcloud login flow failed.")
		})

		o.test("throws when hostApi.openWindow returns null", async () => {
			stubLoginFlowStart(null)

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Failed to open the Nextcloud login page")
		})

		o.test("throws when polling 404s and the login window was closed by the user", async () => {
			stubLoginFlowStart(7)
			stubPollResponses(emptyResponse(404, "Not Found"))
			when(hostApi.isWindowOpen(7)).thenResolve(false)

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Nextcloud login flow is not completed")
		})

		o.test("closes the window and throws with the status when polling fails", async () => {
			stubLoginFlowStart(7)
			stubPollResponses(emptyResponse(500, "Server Error"))

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("During login flow: 500(Server Error)")
			verify(hostApi.closeWindow(7))
		})
	})

	o.spec("downloadFile", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		const fileReference: PluginFileReference = { path: "/Docs/f.pdf" }
		const davUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/remote.php/dav/files/u/Docs/f.pdf"

		o.test("happy path returns the file with name/mimeType/size/data derived from the response", async () => {
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(binaryResponse(200, new Uint8Array([1, 2, 3, 4]), { "content-type": "application/pdf" }))

			const result = await api.downloadFile(fileReference)

			o.check(result.name).equals("f.pdf")
			o.check(result.mimeType).equals("application/pdf")
			o.check(result.size).equals(4)
			o.check(result.data).deepEquals(new Uint8Array([1, 2, 3, 4]))
		})

		o.test("sends basic auth and asks for a binary response", async () => {
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(binaryResponse(200, new Uint8Array([1])))

			await api.downloadFile(fileReference)

			verify(
				httpClient.request(
					davUrl,
					HttpMethod.GET,
					null,
					{ Authorization: EXPECTED_AUTH_HEADER, "OCS-APIRequest": "true" },
					MediaType.Binary,
					matchers.isA(Number),
					null,
					null,
					null,
					null,
				),
			)
		})

		o.test("collapses multiple leading slashes in the file path into a single dav path segment", async () => {
			const multiSlashReference: PluginFileReference = { path: "///Docs/f.pdf" }
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(binaryResponse(200, new Uint8Array([1]), { "content-type": "application/pdf" }))

			await api.downloadFile(multiSlashReference)

			verify(requestOf(davUrl, HttpMethod.GET))
		})

		o.test("defaults mimeType to application/octet-stream when Content-Type is missing", async () => {
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(binaryResponse(200, new Uint8Array([1])))

			const result = await api.downloadFile(fileReference)

			o.check(result.mimeType).equals("application/octet-stream")
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(9, "u", "s", "p")
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(
				emptyResponse(401, "Unauthorized"),
				binaryResponse(200, new Uint8Array([9]), { "content-type": "text/plain" }),
			)

			const result = await api.downloadFile(fileReference)

			o.check(result.data).deepEquals(new Uint8Array([9]))
			verify(requestOf(davUrl, HttpMethod.GET), { times: 2 })
		})

		o.test("throws for a non-2xx, non-401 response", async () => {
			when(requestOf(davUrl, HttpMethod.GET)).thenResolve(emptyResponse(500, "Server Error"))

			const err = await assertThrows(Error, () => api.downloadFile(fileReference))
			o.check(err.message).equals('While downloading file: "f.pdf": 500(Server Error)')
		})
	})

	o.spec("uploadFile", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		const dataFile: PluginDataFile = { name: "report.pdf", mimeType: "application/pdf", data: new Uint8Array([1, 2]), size: 2 }
		const davUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/remote.php/dav/files/u/Att/report.pdf"

		o.test("happy path returns the expected filesUiUrl", async () => {
			when(requestOf(davUrl, HttpMethod.PUT)).thenResolve(jsonResponse(200, {}))

			const result = await api.uploadFile(dataFile, "Att")

			o.check(result).deepEquals({ filesUiUrl: "https://nc.example.com/index.php/apps/files/files?dir=Att" })
		})

		o.test("sends the file bytes as a binary body together with the no-override and auto-mkcol headers", async () => {
			when(requestOf(davUrl, HttpMethod.PUT)).thenResolve(jsonResponse(200, {}))

			await api.uploadFile(dataFile, "Att")

			const bodyCaptor = matchers.captor()
			const headersCaptor = matchers.captor()
			const anything = matchers.anything
			verify(
				httpClient.request(
					davUrl,
					HttpMethod.PUT,
					bodyCaptor.capture(),
					headersCaptor.capture(),
					anything(),
					anything(),
					anything(),
					anything(),
					anything(),
					anything(),
				),
			)
			o.check(bodyCaptor.value instanceof RestBinaryBody).equals(true)
			o.check(bodyCaptor.value.payload).deepEquals(dataFile.data)
			o.check(headersCaptor.value).deepEquals({
				"If-None-Match": "*",
				"X-NC-WebDAV-Auto-Mkcol": 1,
				Authorization: EXPECTED_AUTH_HEADER,
				"OCS-APIRequest": "true",
			})
		})

		o.test("throws GeneralPluginError on a 412 (file already exists)", async () => {
			when(requestOf(davUrl, HttpMethod.PUT)).thenResolve(emptyResponse(412, "Precondition Failed"))

			const err = await assertThrows(GeneralPluginError, () => api.uploadFile(dataFile, "Att"))
			o.check(err.message).equals('File with name: "report.pdf" already exists in directory: "Att"')
		})

		o.test("throws for a non-2xx, non-401, non-412 response", async () => {
			when(requestOf(davUrl, HttpMethod.PUT)).thenResolve(emptyResponse(500, "Server Error"))

			const err = await assertThrows(Error, () => api.uploadFile(dataFile, "Att"))
			o.check(err.message).equals('While uploading file: "report.pdf": 500(Server Error)')
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(11, "u", "s", "p")
			when(requestOf(davUrl, HttpMethod.PUT)).thenResolve(emptyResponse(401, "Unauthorized"), jsonResponse(200, {}))

			const result = await api.uploadFile(dataFile, "Att")

			o.check(result).deepEquals({ filesUiUrl: "https://nc.example.com/index.php/apps/files/files?dir=Att" })
			verify(requestOf(davUrl, HttpMethod.PUT), { times: 2 })
		})
	})

	o.spec("createTalkRoom", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		// the room name is interpolated into the query string as-is by NextcloudApi
		const roomUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/ocs/v2.php/apps/spreed/api/v4/room?roomType=3&roomName=Room 1"

		o.test("happy path extracts the joinUrl from the nested ocs.data.token", async () => {
			when(requestOf(roomUrl, HttpMethod.POST)).thenResolve(jsonResponse(200, { ocs: { data: { token: "tok123" } } }))

			const result = await api.createTalkRoom("Room 1")

			o.check(result).deepEquals({ joinUrl: "https://nc.example.com/index.php/call/tok123" })
		})

		o.test("posts without a body and asks for a json response", async () => {
			when(requestOf(roomUrl, HttpMethod.POST)).thenResolve(jsonResponse(200, { ocs: { data: { token: "tok123" } } }))

			await api.createTalkRoom("Room 1")

			verify(
				httpClient.request(
					roomUrl,
					HttpMethod.POST,
					null,
					{ "OCS-APIRequest": "true", Accept: "application/json", Authorization: EXPECTED_AUTH_HEADER },
					MediaType.Json,
					matchers.isA(Number),
					null,
					null,
					null,
					null,
				),
			)
		})

		o.test("throws when the token is missing from the response", async () => {
			when(requestOf(roomUrl, HttpMethod.POST)).thenResolve(jsonResponse(200, { ocs: { data: {} } }))

			const err = await assertThrows(Error, () => api.createTalkRoom("Room 1"))
			o.check(err.message).equals("AssertNotNull failed: Did not found token after creating talk room")
		})

		o.test("throws for a non-2xx, non-401 response", async () => {
			when(requestOf(roomUrl, HttpMethod.POST)).thenResolve(emptyResponse(500, "Server Error"))

			const err = await assertThrows(Error, () => api.createTalkRoom("Room 1"))
			o.check(err.message).equals('While creating room: "Room 1": 500(Server Error)')
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(13, "u", "s", "p")
			when(requestOf(roomUrl, HttpMethod.POST)).thenResolve(emptyResponse(401, "Unauthorized"), jsonResponse(200, { ocs: { data: { token: "tok456" } } }))

			const result = await api.createTalkRoom("Room 1")

			o.check(result).deepEquals({ joinUrl: "https://nc.example.com/index.php/call/tok456" })
			verify(requestOf(roomUrl, HttpMethod.POST), { times: 2 })
		})
	})

	o.spec("proxyIfNeeded (exercised via createTalkRoom's request url)", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		for (const proxiedHost of ["app.tuta.com", "app.test.tuta.com", "app.local.tuta.com", "localhost"]) {
			o.test(`proxies the request for host "${proxiedHost}"`, async () => {
				const proxiedApi = new NextcloudApi("https://nc.example.com", hostApi, proxiedHost, nextcloudPlugin)
				;(proxiedApi as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
				const expectedUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/ocs/v2.php/apps/spreed/api/v4/room?roomType=3&roomName=Room 1"
				when(requestOf(expectedUrl, HttpMethod.POST)).thenResolve(jsonResponse(200, { ocs: { data: { token: "t" } } }))

				await proxiedApi.createTalkRoom("Room 1")

				verify(requestOf(expectedUrl, HttpMethod.POST))
			})
		}

		o.test("does not proxy the request for an unrecognized host", async () => {
			const directApi = new NextcloudApi("https://nc.example.com", hostApi, "other.example.com", nextcloudPlugin)
			;(directApi as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
			const expectedUrl = "https://nc.example.com/ocs/v2.php/apps/spreed/api/v4/room?roomType=3&roomName=Room 1"
			when(requestOf(expectedUrl, HttpMethod.POST)).thenResolve(jsonResponse(200, { ocs: { data: { token: "t" } } }))

			await directApi.createTalkRoom("Room 1")

			verify(requestOf(expectedUrl, HttpMethod.POST))
		})
	})

	o.spec("getInstalledVersion", () => {
		const url = "https://nc.example.com"
		const versionUrl = `${url}/ocs/v2.php/apps/tutamail/api/v1/version`

		o.test("returns the parsed version on success", async () => {
			when(requestOf(versionUrl, HttpMethod.GET)).thenResolve(jsonResponse(200, { major: 1, minor: 2, patch: 3 }))

			const version = await NextcloudApi.getInstalledVersion(url)

			o.check(version).deepEquals({ major: 1, minor: 2, patch: 3 })
			verify(httpClient.request(versionUrl, HttpMethod.GET, null, {}, MediaType.Json, matchers.isA(Number), null, null, null, null))
		})

		o.test("throws CustomerConfigPluginError when the tutamail app is not installed", async () => {
			when(requestOf(versionUrl, HttpMethod.GET)).thenResolve(emptyResponse(404, "Not Found"))

			const err = await assertThrows(CustomerConfigPluginError, () => NextcloudApi.getInstalledVersion(url))
			o.check(err.message).equals(`Tutamail app is not installed on Nextcloud instance: "${url}"`)
		})

		o.test("throws CustomerConfigPluginError when the request itself fails", async () => {
			when(requestOf(versionUrl, HttpMethod.GET)).thenReject(new Error("network down"))

			const err = await assertThrows(CustomerConfigPluginError, () => NextcloudApi.getInstalledVersion(url))
			o.check(err.message).equals(`Nextcloud URL is wrong: "${url}"`)
		})
	})
})
