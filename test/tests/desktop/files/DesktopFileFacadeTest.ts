import o from "@tutao/otest"
import { createDataFile } from "../../../../src/common/api/common/DataFile.js"
import { DesktopFileFacade } from "../../../../src/common/desktop/files/DesktopFileFacade.js"
import { ApplicationWindow } from "../../../../src/common/desktop/ApplicationWindow.js"
import { matchers, object, verify, when } from "testdouble"
import { DesktopNetworkClient } from "../../../../src/common/desktop/net/DesktopNetworkClient.js"
import { ElectronExports, FsExports } from "../../../../src/common/desktop/ElectronExportTypes.js"
import { PreconditionFailedError, TooManyRequestsError } from "../../../../src/common/api/common/error/RestError.js"
import type http from "node:http"
import type fs from "node:fs"
import { assertThrows } from "@tutao/tutanota-test-utils"
import n from "../../nodemocker.js"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { DesktopUtils } from "../../../../src/common/desktop/DesktopUtils.js"
import { DateProvider } from "../../../../src/common/api/common/DateProvider.js"
import { TempFs } from "../../../../src/common/desktop/files/TempFs.js"
import { BuildConfigKey, DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"

const DEFAULT_DOWNLOAD_PATH = "/a/download/path/"

o.spec("DesktopFileFacade", function () {
	let win: ApplicationWindow
	let conf: DesktopConfig
	let du: DesktopUtils
	let dp: DateProvider
	let net: DesktopNetworkClient
	let electron: ElectronExports
	let fs: FsExports
	let tfs: TempFs
	let ff: DesktopFileFacade

	o.beforeEach(function () {
		win = object()
		net = object()
		fs = object()
		tfs = object()
		fs.promises = object()
		electron = object()
		// @ts-ignore read-only prop
		electron.shell = object()
		// @ts-ignore read-only prop
		electron.dialog = object()

		conf = object()
		du = object()
		dp = object()

		ff = new DesktopFileFacade(win, conf, dp, net, electron, tfs, fs)
	})
	o.spec("saveDataFile", function () {
		o("when there's no existing file it will be simply written", async function () {
			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			when(fs.promises.readdir(matchers.anything())).thenResolve(["somethingelse"])
			when(fs.promises.mkdir("/tutanota/tmp/path/download", { recursive: true })).thenResolve(undefined)
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob", dataFile.data)).thenResolve()
			await ff.writeDataFile(dataFile)
		})

		o("with default download path but file exists -> nonclobbering name is chosen", async function () {
			const e = new Error() as any
			e.code = "EEXISTS"
			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob", matchers.anything())).thenReject(e)
			when(fs.promises.readdir(matchers.anything())).thenResolve(["blob"])
			when(fs.promises.mkdir("/tutanota/tmp/path/download", { recursive: true })).thenResolve(undefined)
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob-1", dataFile.data)).thenResolve()
			await ff.writeDataFile(dataFile)
		})
	})

	o.spec("download", function () {
		o("no error", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const expectedFilePath = "/tutanota/tmp/path/encrypted/nativelyDownloadedFile"
			const response: http.IncomingMessage = object() // new mocks.netMock.Response(200)
			response.statusCode = 200
			response.headers = {}
			// @ts-ignore callback omit
			when(response.on("finish")).thenCallback(undefined, undefined)
			const ws: fs.WriteStream = mockWriteStream(response)
			when(fs.createWriteStream(expectedFilePath, { emitClose: true })).thenReturn(ws)
			const sourceUrl = when(
				net.executeRequest(urlMatches(new URL("some://url/file")), {
					method: "GET",
					headers,
					timeout: 20000,
				}),
			).thenResolve(response)
			// @ts-ignore callback omit
			when(ws.on("finish")).thenCallback(undefined, undefined)
			when(tfs.ensureEncryptedDir()).thenResolve("/tutanota/tmp/path/encrypted")

			const downloadResult = await ff.download("some://url/file", "nativelyDownloadedFile", headers)
			o(downloadResult.statusCode).equals(200)
			o(downloadResult.encryptedFileUri).equals(expectedFilePath)
		})

		o("404 error gets returned", async function () {
			const headers = {
				v: "foo",
				accessToken: "bar",
			}

			const response: http.IncomingMessage = object()
			response.statusCode = 404
			const errorId = "123"
			response.headers = {}
			response.headers["error-id"] = errorId
			when(net.executeRequest(matchers.anything(), matchers.anything())).thenResolve(response)
			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers)

			o(result).deepEquals({
				statusCode: 404,
				errorId,
				precondition: null,
				suspensionTime: null,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("retry-after", async function () {
			const response: http.IncomingMessage = object()
			const errorId = "123"
			response.headers = {}
			response.headers["error-id"] = errorId
			const retryAfter = "20"
			response.headers["retry-after"] = retryAfter
			response.statusCode = TooManyRequestsError.CODE
			when(net.executeRequest(matchers.anything(), matchers.anything())).thenResolve(response)

			const headers = { v: "foo", accessToken: "bar" }
			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers)

			o(result).deepEquals({
				statusCode: TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAfter,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("suspension", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const response: http.IncomingMessage = object()
			response.statusCode = TooManyRequestsError.CODE
			response.headers = {}
			const errorId = "123"
			response.headers["error-id"] = errorId
			const retryAfter = "20"
			response.headers["suspension-time"] = retryAfter
			when(net.executeRequest(matchers.anything(), matchers.anything())).thenResolve(response)

			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers)

			o(result).deepEquals({
				statusCode: TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAfter,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("precondition", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const response: http.IncomingMessage = object()
			response.statusCode = PreconditionFailedError.CODE
			response.headers = {}
			const errorId = "123"
			response.headers["error-id"] = errorId
			const precondition = "a.2"
			response.headers["precondition"] = precondition
			when(net.executeRequest(matchers.anything(), matchers.anything())).thenResolve(response)

			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers)

			o(result).deepEquals({
				statusCode: PreconditionFailedError.CODE,
				errorId,
				precondition,
				suspensionTime: null,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("IO error during download", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const response: http.IncomingMessage = object()
			response.statusCode = 200
			when(net.executeRequest(matchers.anything(), matchers.anything())).thenResolve(response)
			const error = new Error("Test! I/O error")
			const ws = mockWriteStream()
			when(fs.createWriteStream(matchers.anything(), matchers.anything())).thenReturn(ws)
			when(response.pipe(matchers.anything())).thenThrow(error)
			when(tfs.ensureEncryptedDir()).thenResolve("/tutanota/tmp/path/encrypted")

			const e = await assertThrows(Error, () => ff.download("some://url/file", "nativelyDownloadedFile", headers))
			o(e).equals(error)
			verify(fs.promises.unlink("/tutanota/tmp/path/encrypted/nativelyDownloadedFile"), { times: 1 })
		})
	})

	o.spec("upload", function () {
		const fileToUploadPath = "/tutnaota/tmp/path/encrypted/toUpload.txt"
		const targetUrl = "https://test.tutanota.com/rest/for/a/bit"

		function mockResponse(statusCode: number, resOpts: { responseBody?: Uint8Array; responseHeaders?: Record<string, string> }): http.IncomingMessage {
			const { responseBody, responseHeaders } = resOpts
			const response: http.IncomingMessage = object()
			response.statusCode = statusCode
			response.headers = responseHeaders ?? {}
			// @ts-ignore thenCallback allows not mentioning the cb?
			when(response.on("finish")).thenCallback(undefined, undefined)
			if (responseBody) {
				// @ts-ignore thenCallback allows not mentioning the cb?
				when(response.on("data")).thenCallback(responseBody)
			} else {
				when(response.on("data", matchers.anything)).thenReturn(response)
			}

			// @ts-ignore thenCallback allows not mentioning the cb?
			when(response.on("end")).thenCallback(undefined, undefined)
			return response
		}

		o("when there's no error it uploads correct data and returns the right result", async function () {
			const body = stringToUtf8Uint8Array("BODY")
			const response = mockResponse(200, { responseBody: body })
			const headers = {
				blobAccessToken: "1236",
			}
			const fileStreamMock = mockReadStream()
			when(fs.createReadStream(fileToUploadPath)).thenReturn(fileStreamMock)
			when(net.executeRequest(urlMatches(new URL(targetUrl)), { method: "POST", headers, timeout: 20000 }, fileStreamMock)).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, "POST", headers)

			o(uploadResult.statusCode).equals(200)
			o(uploadResult.errorId).equals(null)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals(Array.from(body))
		})

		o("when 404 is returned it returns correct result", async function () {
			const errorId = "123"
			const response = mockResponse(404, { responseHeaders: { "error-id": errorId } })
			when(net.executeRequest(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, "POST", {})
			o(uploadResult.statusCode).equals(404)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when retry-after is returned, it is propagated", async function () {
			const retryAFter = "20"
			const errorId = "123"
			const response = mockResponse(TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"retry-after": retryAFter,
				},
			})
			when(net.executeRequest(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(response)

			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, "POST", {})

			o(uploadResult.statusCode).equals(TooManyRequestsError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(retryAFter)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when suspension-time is returned, it is propagated", async function () {
			const retryAFter = "20"
			const errorId = "123"
			const response = mockResponse(TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"suspension-time": retryAFter,
				},
			})
			when(net.executeRequest(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, "POST", {})

			o(uploadResult.statusCode).equals(TooManyRequestsError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(retryAFter)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when precondition-time is returned, it is propagated", async function () {
			const precondition = "a.2"
			const errorId = "123"
			const response = mockResponse(PreconditionFailedError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					precondition: precondition,
				},
			})
			when(net.executeRequest(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(response)

			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, "POST", {})

			o(uploadResult.statusCode).equals(PreconditionFailedError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(precondition)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})
	})

	o.spec("open", function () {
		o("open valid", async function () {
			when(electron.shell.openPath("/some/folder/file")).thenResolve("")
			await ff.open("/some/folder/file")
		})

		o("open invalid", async () => {
			await assertThrows(Error, () => ff.open("invalid"))
			verify(electron.shell.openPath("invalid"), { times: 1 })
		})

		o("open on windows", async function () {
			n.setPlatform("win32")
			when(electron.dialog.showMessageBox(matchers.anything())).thenReturn(Promise.resolve({ response: 1, checkboxChecked: false }))
			await ff.open("exec.exe")
			verify(electron.shell.openPath(matchers.anything()), { times: 0 })
		})
	})

	o.spec("join", function () {
		o("join a single file", async function () {
			const ws: fs.WriteStream = mockWriteStream()
			const rs: fs.ReadStream = mockReadStream(ws)
			when(fs.createWriteStream(matchers.anything(), matchers.anything())).thenReturn(ws)
			when(fs.createReadStream(matchers.anything())).thenReturn(rs)
			// @ts-ignore callback omit
			when(rs.on("end")).thenCallback(undefined, undefined)
			when(fs.promises.readdir("/tutanota/tmp/path/unencrypted")).thenResolve(["folderContents"])
			when(tfs.ensureUnencrytpedDir()).thenResolve("/tutanota/tmp/path/unencrypted")
			const joinedFilePath = await ff.joinFiles("fileName.pdf", ["/file1"])
			o(joinedFilePath).equals("/tutanota/tmp/path/unencrypted/fileName.pdf")
		})
	})

	o.spec("splitFile", function () {
		o("returns one slice for a small file", async function () {
			// fs mock returns file name as the content
			const filename = "/tutanota/tmp/path/download/small.txt"
			const fileContent = stringToUtf8Uint8Array(filename)
			const filenameHash = "9ca089f82e397e9e860daa312ac25def39f2da0e066f0de94ffc02aa7b3a6250"
			const expectedChunkPath = `/tutanota/tmp/path/unencrypted/${filenameHash}.0.blob`
			when(tfs.ensureUnencrytpedDir()).thenResolve("/tutanota/tmp/path/unencrypted")
			when(fs.promises.writeFile(expectedChunkPath, fileContent)).thenResolve()
			when(fs.promises.readFile(filename)).thenResolve(Buffer.from(fileContent))
			const chunks = await ff.splitFile(filename, 1024)
			o(chunks).deepEquals([expectedChunkPath])("only one chunk")
		})

		o("returns multiple slices for a bigger file", async function () {
			// fs mock returns file name as the content
			const filename = "/tutanota/tmp/path/download/big.txt"
			// length 37
			const fileContent = stringToUtf8Uint8Array(filename)
			const filenameHash = "c24646a4738a92d624cd03134f26c371d8a2950d2b3bbce7921c288de9a56fd3"
			const expectedChunkPath0 = `/tutanota/tmp/path/unencrypted/${filenameHash}.0.blob`
			const expectedChunkPath1 = `/tutanota/tmp/path/unencrypted/${filenameHash}.1.blob`

			when(tfs.ensureUnencrytpedDir()).thenResolve("/tutanota/tmp/path/unencrypted")
			when(fs.promises.writeFile(expectedChunkPath0, fileContent.slice(0, 30))).thenResolve()
			when(fs.promises.writeFile(expectedChunkPath1, fileContent.slice(30))).thenResolve()
			when(fs.promises.readFile(filename)).thenResolve(Buffer.from(fileContent))
			const chunks = await ff.splitFile(filename, 30)
			o(chunks).deepEquals([expectedChunkPath0, expectedChunkPath1])("both written files are in the returned array")
		})
	})

	o.spec("showInFileExplorer", function () {
		o("two downloads, open two filemanagers", async function () {
			const dir = "/path/to"
			const p = dir + "/file.txt"
			await ff.showInFileExplorer(p)
			verify(electron.shell.openPath(dir), { times: 1 })
		})

		o("two downloads, open two filemanagers after a pause", async function () {
			const time = 1629115820468
			const dir = "/path/to"
			const p = dir + "/file.txt"
			await ff.showInFileExplorer(p)
			when(dp.now()).thenReturn(time)
			when(conf.getConst(BuildConfigKey.fileManagerTimeout)).thenResolve(2)
			verify(electron.shell.openPath(dir), { times: 1 })
			when(dp.now()).thenReturn(time + 10)
			await ff.showInFileExplorer(p)
			verify(electron.shell.openPath(dir), { times: 2 })
		})
	})

	o.spec("putFileIntoDownloadsFolder", function () {
		o("putFileIntoDownloadsFolder", async function () {
			const src = "/path/random.pdf"
			const filename = "fileName.pdf"
			when(conf.getVar(DesktopConfigKey.defaultDownloadPath)).thenResolve(DEFAULT_DOWNLOAD_PATH)
			when(fs.promises.readdir(matchers.anything())).thenResolve([])
			const copiedFileUri = await ff.putFileIntoDownloadsFolder(src, filename)
			verify(fs.promises.copyFile(src, DEFAULT_DOWNLOAD_PATH + "fileName.pdf"))
			o(copiedFileUri).equals(DEFAULT_DOWNLOAD_PATH + "fileName.pdf")
		})
	})

	o.spec("size", function () {
		o("size", async function () {
			when(fs.promises.stat(matchers.anything())).thenResolve({ size: 33 })
			o(await ff.getSize("/file1")).equals(33)
		})
	})

	o.spec("hash", function () {
		o("hash", async function () {
			when(fs.promises.readFile("/file1")).thenResolve(new Uint8Array([0, 1, 2, 3]) as Buffer)
			o(await ff.hashFile("/file1")).equals("BU7ewdAh")
		})
	})
})

function mockWriteStream(response?: http.IncomingMessage): fs.WriteStream {
	const ws: fs.WriteStream = object()
	if (response != null) {
		when(response.pipe(ws)).thenReturn(ws)
	}
	const closeCapturer = matchers.captor()
	when(ws.on("close", closeCapturer.capture())).thenReturn(ws)
	when(ws.close()).thenDo(() => closeCapturer.value())
	return ws
}

function mockReadStream(ws?: fs.WriteStream): fs.ReadStream {
	const rs: fs.ReadStream = object()
	if (ws != null) {
		when(rs.pipe(ws, { end: false })).thenReturn(ws)
	}

	return rs
}

const urlMatches = matchers.create({
	name: "urlMatches",
	matches(matcherArgs: any[], actual: any): boolean {
		return (actual as URL).toString() === (matcherArgs[0] as URL).toString()
	},
})
