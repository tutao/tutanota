import o, { assertThrows } from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { NextcloudApi } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudApi"
import { NextcloudPlugin } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudPlugin"
import { PluginHostApi } from "../../../../../src/plugin-kit/sdk/hostApi/PluginHostApi"
import { CustomerConfigPluginError, GeneralPluginError } from "../../../../../src/plugin-kit/sdk/PluginError"
import { PluginFileReference } from "../../../../../src/plugin-kit/sdk/FileImportExtensionPoint"
import { PluginDataFile } from "../../../../../src/plugin-kit/sdk/PluginDataFile"

const LOGIN_URL = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/index.php/login/v2"
const POLL_URL_PREFIX = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/index.php/login/v2/poll?token="

o.spec("NextcloudApiTest", () => {
	let fakeAxios: any
	let hostApi: PluginHostApi
	let nextcloudPlugin: NextcloudPlugin
	let api: NextcloudApi

	o.beforeEach(() => {
		fakeAxios = {
			get: func(),
			post: func(),
			put: func(),
			interceptors: { response: { use: () => {} } },
		}
		;(NextcloudApi as any).axiosClient = fakeAxios
		hostApi = object<PluginHostApi>()
		nextcloudPlugin = object<NextcloudPlugin>()
		api = new NextcloudApi("https://nc.example.com", hostApi, "app.tuta.com", nextcloudPlugin)
	})

	function stubSuccessfulLogin(windowId: number, loginName: string, server: string, appPassword: string) {
		when(fakeAxios.post(LOGIN_URL, undefined, matchers.anything())).thenResolve({
			status: 200,
			data: { poll: { token: "poll-token" }, login: "https://nc.example.com/login-ui" },
		})
		when(hostApi.openWindow("https://nc.example.com/login-ui")).thenResolve(windowId)
		when(
			fakeAxios.post(
				matchers.argThat((url: string) => url.startsWith(POLL_URL_PREFIX)),
				matchers.anything(),
				matchers.anything(),
			),
		).thenResolve({
			status: 200,
			data: { loginName, server, appPassword },
		})
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
			verify(fakeAxios.post(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("happy path: logs in, closes the window, stores credentials, notifies the plugin", async () => {
			stubSuccessfulLogin(7, "u", "s", "p")

			await api.loginAndCreateAppToken()

			verify(hostApi.closeWindow(7))
			o.check((api as any).nextCloudCredentials).deepEquals({ loginName: "u", server: "s", appPassword: "p" })
			verify(nextcloudPlugin.credentialsUpdated({ loginName: "u", server: "s", appPassword: "p" }))
		})

		o.test("throws when the login POST does not return 200", async () => {
			when(fakeAxios.post(LOGIN_URL, undefined, matchers.anything())).thenResolve({ status: 500, data: {} })

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Nextcloud login flow failed.")
		})

		o.test("throws when hostApi.openWindow returns null", async () => {
			when(fakeAxios.post(LOGIN_URL, undefined, matchers.anything())).thenResolve({
				status: 200,
				data: { poll: { token: "poll-token" }, login: "https://nc.example.com/login-ui" },
			})
			when(hostApi.openWindow("https://nc.example.com/login-ui")).thenResolve(null)

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Failed to open the Nextcloud login page")
		})

		o.test("throws when polling 404s and the login window was closed by the user", async () => {
			when(fakeAxios.post(LOGIN_URL, undefined, matchers.anything())).thenResolve({
				status: 200,
				data: { poll: { token: "poll-token" }, login: "https://nc.example.com/login-ui" },
			})
			when(hostApi.openWindow("https://nc.example.com/login-ui")).thenResolve(7)
			when(
				fakeAxios.post(
					matchers.argThat((url: string) => url.startsWith(POLL_URL_PREFIX)),
					matchers.anything(),
					matchers.anything(),
				),
			).thenResolve({
				status: 404,
				data: {},
			})
			when(hostApi.isWindowOpen(7)).thenResolve(false)

			const err = await assertThrows(Error, () => api.loginAndCreateAppToken())
			o.check(err.message).equals("Nextcloud login flow is not completed")
		})
	})

	o.spec("downloadFile", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		const fileReference: PluginFileReference = { path: "/Docs/f.pdf" }
		const davUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/remote.php/dav/files/u/Docs/f.pdf"

		o.test("happy path returns the file with name/mimeType/size/data derived from the response", async () => {
			when(fakeAxios.get(davUrl, matchers.anything())).thenResolve({
				status: 200,
				data: [1, 2, 3, 4],
				headers: { "Content-Type": "application/pdf" },
			})

			const result = await api.downloadFile(fileReference)

			o.check(result.name).equals("f.pdf")
			o.check(result.mimeType).equals("application/pdf")
			o.check(result.size).equals(4)
			o.check(result.data).deepEquals(new Uint8Array([1, 2, 3, 4]))
		})

		o.test("collapses multiple leading slashes in the file path into a single dav path segment", async () => {
			const multiSlashReference: PluginFileReference = { path: "///Docs/f.pdf" }
			when(fakeAxios.get(davUrl, matchers.anything())).thenResolve({
				status: 200,
				data: [1],
				headers: { "Content-Type": "application/pdf" },
			})

			await api.downloadFile(multiSlashReference)

			verify(fakeAxios.get(davUrl, matchers.anything()))
		})

		o.test("defaults mimeType to application/octet-stream when Content-Type is missing", async () => {
			when(fakeAxios.get(davUrl, matchers.anything())).thenResolve({ status: 200, data: [1], headers: {} })

			const result = await api.downloadFile(fileReference)

			o.check(result.mimeType).equals("application/octet-stream")
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(9, "u", "s", "p")
			when(fakeAxios.get(davUrl, matchers.anything())).thenResolve(
				{ status: 401, data: {}, headers: {} },
				{ status: 200, data: [9], headers: { "Content-Type": "text/plain" } },
			)

			const result = await api.downloadFile(fileReference)

			o.check(result.data).deepEquals(new Uint8Array([9]))
			verify(fakeAxios.get(davUrl, matchers.anything()), { times: 2 })
		})

		o.test("throws for a non-2xx, non-401 response", async () => {
			when(fakeAxios.get(davUrl, matchers.anything())).thenResolve({ status: 500, data: {}, headers: {}, statusText: "Server Error" })

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
			when(fakeAxios.put(davUrl, dataFile.data, matchers.anything())).thenResolve({ status: 200 })

			const result = await api.uploadFile(dataFile, "Att")

			o.check(result).deepEquals({ filesUiUrl: "https://nc.example.com/index.php/apps/files/files?dir=Att" })
		})

		o.test("throws GeneralPluginError on a 412 (file already exists)", async () => {
			when(fakeAxios.put(davUrl, dataFile.data, matchers.anything())).thenResolve({ status: 412 })

			const err = await assertThrows(GeneralPluginError, () => api.uploadFile(dataFile, "Att"))
			o.check(err.message).equals('File with name: "report.pdf" already exists in directory: "Att"')
		})

		o.test("throws for a non-2xx, non-401, non-412 response", async () => {
			when(fakeAxios.put(davUrl, dataFile.data, matchers.anything())).thenResolve({ status: 500, statusText: "Server Error" })

			const err = await assertThrows(Error, () => api.uploadFile(dataFile, "Att"))
			o.check(err.message).equals('While uploading file: "report.pdf": 500(Server Error)')
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(11, "u", "s", "p")
			when(fakeAxios.put(davUrl, dataFile.data, matchers.anything())).thenResolve({ status: 401 }, { status: 200 })

			const result = await api.uploadFile(dataFile, "Att")

			o.check(result).deepEquals({ filesUiUrl: "https://nc.example.com/index.php/apps/files/files?dir=Att" })
			verify(fakeAxios.put(davUrl, dataFile.data, matchers.anything()), { times: 2 })
		})
	})

	o.spec("createTalkRoom", () => {
		o.beforeEach(() => {
			;(api as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
		})

		const roomUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/ocs/v2.php/apps/spreed/api/v4/room"

		o.test("happy path extracts the joinUrl from the nested ocs.data.token", async () => {
			when(fakeAxios.post(roomUrl, matchers.anything(), matchers.anything())).thenResolve({
				status: 200,
				data: { ocs: { data: { token: "tok123" } } },
			})

			const result = await api.createTalkRoom("Room 1")

			o.check(result).deepEquals({ joinUrl: "https://nc.example.com/index.php/call/tok123" })
		})

		o.test("throws when the token is missing from the response", async () => {
			when(fakeAxios.post(roomUrl, matchers.anything(), matchers.anything())).thenResolve({ status: 200, data: { ocs: { data: {} } } })

			const err = await assertThrows(Error, () => api.createTalkRoom("Room 1"))
			o.check(err.message).equals("AssertNotNull failed: Did not found token after creating talk room")
		})

		o.test("throws for a non-2xx, non-401 response", async () => {
			when(fakeAxios.post(roomUrl, matchers.anything(), matchers.anything())).thenResolve({ status: 500, statusText: "Server Error" })

			const err = await assertThrows(Error, () => api.createTalkRoom("Room 1"))
			o.check(err.message).equals('While creating room: "Room 1": 500(Server Error)')
		})

		o.test("retries once after nulling credentials on a 401", async () => {
			stubSuccessfulLogin(13, "u", "s", "p")
			when(fakeAxios.post(roomUrl, matchers.anything(), matchers.anything())).thenResolve(
				{ status: 401 },
				{ status: 200, data: { ocs: { data: { token: "tok456" } } } },
			)

			const result = await api.createTalkRoom("Room 1")

			o.check(result).deepEquals({ joinUrl: "https://nc.example.com/index.php/call/tok456" })
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
				const expectedUrl = "https://nc.example.com/index.php/apps/tutamail/api/v1/proxy/ocs/v2.php/apps/spreed/api/v4/room"
				when(fakeAxios.post(expectedUrl, matchers.anything(), matchers.anything())).thenResolve({
					status: 200,
					data: { ocs: { data: { token: "t" } } },
				})

				await proxiedApi.createTalkRoom("Room 1")

				verify(fakeAxios.post(expectedUrl, matchers.anything(), matchers.anything()))
			})
		}

		o.test("does not proxy the request for an unrecognized host", async () => {
			const directApi = new NextcloudApi("https://nc.example.com", hostApi, "other.example.com", nextcloudPlugin)
			;(directApi as any).nextCloudCredentials = { loginName: "u", server: "s", appPassword: "p" }
			const expectedUrl = "https://nc.example.com/ocs/v2.php/apps/spreed/api/v4/room"
			when(fakeAxios.post(expectedUrl, matchers.anything(), matchers.anything())).thenResolve({
				status: 200,
				data: { ocs: { data: { token: "t" } } },
			})

			await directApi.createTalkRoom("Room 1")

			verify(fakeAxios.post(expectedUrl, matchers.anything(), matchers.anything()))
		})
	})

	o.spec("getInstalledVersion", () => {
		const url = "https://nc.example.com"
		const versionUrl = `${url}/ocs/v2.php/apps/tutamail/api/v1/version`

		o.test("returns the parsed version on success", async () => {
			when(fakeAxios.get(versionUrl)).thenResolve({ status: 200, data: { major: 1, minor: 2, patch: 3 } })

			const version = await NextcloudApi.getInstalledVersion(url)

			o.check(version).deepEquals({ major: 1, minor: 2, patch: 3 })
		})

		o.test("throws CustomerConfigPluginError when the tutamail app is not installed", async () => {
			when(fakeAxios.get(versionUrl)).thenResolve({ status: 404, data: {} })

			const err = await assertThrows(CustomerConfigPluginError, () => NextcloudApi.getInstalledVersion(url))
			o.check(err.message).equals(`Tutamail app is not installed on Nextcloud instance: "${url}"`)
		})

		o.test("throws CustomerConfigPluginError when the request itself fails", async () => {
			when(fakeAxios.get(versionUrl)).thenReject(new Error("network down"))

			const err = await assertThrows(CustomerConfigPluginError, () => NextcloudApi.getInstalledVersion(url))
			o.check(err.message).equals(`Nextcloud URL is wrong: "${url}"`)
		})
	})
})
