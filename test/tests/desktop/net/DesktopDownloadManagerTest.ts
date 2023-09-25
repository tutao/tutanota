import o from "@tutao/otest"
import n, { Mocked } from "../../nodemocker.js"
import { DesktopDownloadManager } from "../../../../src/desktop/net/DesktopDownloadManager.js"
import { assertThrows, spy } from "@tutao/tutanota-test-utils"
import { DesktopNetworkClient } from "../../../../src/desktop/net/DesktopNetworkClient.js"
import { PreconditionFailedError, TooManyRequestsError } from "../../../../src/api/common/error/RestError.js"
import type * as fs from "node:fs"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { createDataFile } from "../../../../src/api/common/DataFile.js"

const DEFAULT_DOWNLOAD_PATH = "/a/download/path/"

o.spec("DesktopDownloadManagerTest", function () {
	let conf
	let session
	let item
	let WriteStream: Mocked<fs.WriteStream>
	let ReadStream: Mocked<fs.ReadStream>
	let fs
	let dateProvider
	let time = 1629115820468

	const standardMocks = () => {
		conf = {
			removeListener: (key: string, cb: () => void) => n.spyify(conf),
			on: (key: string) => n.spyify(conf),
			getVar: (key: string) => {
				switch (key) {
					case "defaultDownloadPath":
						return DEFAULT_DOWNLOAD_PATH

					default:
						throw new Error(`unexpected getVar key ${key}`)
				}
			},
			setVar: (key: string, val: any) => {},
			getConst: (key: string) => {
				switch (key) {
					case "fileManagerTimeout":
						return 30

					default:
						throw new Error(`unexpected getConst key ${key}`)
				}
			},
		}
		const electron = {
			dialog: {
				showMessageBox: () =>
					Promise.resolve({
						response: 1,
					}),
				showSaveDialog: () =>
					Promise.resolve({
						filePath: "parentDir/resultFilePath",
					}),
			},
			shell: {
				openPath: (path) => Promise.resolve(path !== "invalid" ? "" : "invalid path"),
			},
			app: {
				getPath: () => "/some/path/",
			},
		}
		session = {
			callbacks: {},
			removeAllListeners: function () {
				this.callbacks = {}
				return this
			},
			setSpellCheckerDictionaryDownloadURL: () => {},
			on: function (ev, cb) {
				this.callbacks[ev] = cb
				return this
			},
		}
		const net = {
			async executeRequest(url, opts) {
				console.log("net.Response", net.Response, typeof net.Response)
				const r = new net.Response(200)
				console.log("net.Response()", r, typeof r)
				return r
			},
			Response: n.classify({
				prototype: {
					constructor: function (statusCode) {
						this.statusCode = statusCode
					},
					callbacks: {},
					on: function (ev, cb) {
						this.callbacks[ev] = cb
						return this
					},
					setEncoding: function (enc) {},
					destroy: function (e) {
						this.callbacks["error"](e)
					},
					pipe: function () {
						return this
					},
					headers: {},
				},
				statics: {},
			}),
		} as const
		item = {
			callbacks: {},
			savePath: "NOT SET!",
			on: function (ev, cb) {
				this.callbacks[ev] = cb
				return this
			},
			getFilename: () => "/this/is/a-file?.name",
		}
		WriteStream = n.classify({
			prototype: {
				callbacks: {},
				on: function (ev, cb) {
					this.callbacks[ev] = cb
					return this
				},
				close: function () {
					this.callbacks["close"]()
				},
				removeAllListeners: function (ev) {
					this.callbacks[ev] = () => {}

					return this
				},
				end: function (resolve) {
					if (this.callbacks["finish"]) {
						this.callbacks["finish"]()
					}
					resolve()
				},
			},
			statics: {},
		})
		ReadStream = n.classify({
			prototype: {
				callbacks: {},
				on: function (ev, cb) {
					this.callbacks[ev] = cb
					return this
				},
				close: function () {
					this.callbacks["close"]()
				},
				removeAllListeners: function (ev) {
					this.callbacks[ev] = () => {}

					return this
				},
				end: function () {
					this.callbacks["finish"]()
				},
				pipe: function () {
					this.callbacks["end"]()
				},
			},
			statics: {},
		})
		fs = {
			closeSync: () => {},
			openSync: () => {},
			createWriteStream: () => new WriteStream(),
			createReadStream: () => new ReadStream(),
			existsSync: (path) => path === DEFAULT_DOWNLOAD_PATH,
			mkdirSync: () => {},

			promises: {
				unlink: () => Promise.resolve(),
				mkdir: () => Promise.resolve(),
				writeFile: () => Promise.resolve(),
				copyFile: () => Promise.resolve(),
				readdir: () => Promise.resolve([]),
				stat: () => {
					return { size: 33 }
				},
				readFile: (fileName) => Promise.resolve(stringToUtf8Uint8Array(fileName)),
			},
		}
		const lang = {
			get: (key) => key,
		}
		const desktopUtils = {
			touch: (path) => {},
			getTutanotaTempPath: (...subdirs) => "/tutanota/tmp/path/" + subdirs.join("/"),
		}
		dateProvider = {
			now: () => time,
		}
		return {
			netMock: n.mock<typeof DesktopNetworkClient & Writeable<typeof net>>("__net", net).set(),
			confMock: n.mock("__conf", conf).set(),
			electronMock: n.mock<typeof import("electron")>("electron", electron).set(),
			fsMock: n.mock<typeof import("fs")>("fs-extra", fs).set(),
			desktopUtilsMock: n.mock("./DesktopUtils", desktopUtils).set(),
			langMock: n.mock("../misc/LanguageViewModel", lang).set(),
			dateProviderMock: n.mock("__dateProvider", dateProvider).set(),
		}
	}

	function makeMockedDownloadManager({ electronMock, desktopUtilsMock, confMock, netMock, fsMock, dateProviderMock }) {
		return new DesktopDownloadManager(confMock, netMock, desktopUtilsMock, dateProviderMock, fsMock, electronMock)
	}

	o.spec("saveDataFile", function () {
		o("when there's no existing file it will be simply written", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			await dl.writeDataFile(dataFile)
			o(mocks.fsMock.promises.mkdir.args).deepEquals([
				"/tutanota/tmp/path/download",
				{
					recursive: true,
				},
			])
			o(mocks.fsMock.promises.writeFile.args[0]).equals("/tutanota/tmp/path/download/blob")
		})

		o("with default download path but file exists", async function () {
			const mocks = standardMocks()
			mocks.fsMock.promises.writeFile = spy(async (path) => {
				if (path === "/tutanota/tmp/path/download/blob") {
					const e = new Error() as any
					e.code = "EEXISTS"
					throw e
				}
			})
			const dl = makeMockedDownloadManager(mocks)

			mocks.fsMock.promises.readdir = () => Promise.resolve(["blob"] as any)

			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			await dl.writeDataFile(dataFile)
			o(mocks.fsMock.promises.mkdir.args).deepEquals([
				"/tutanota/tmp/path/download",
				{
					recursive: true,
				},
			])
			o(mocks.fsMock.promises.writeFile.args[0]).equals("/tutanota/tmp/path/download/blob-1")
		})
	})

	o.spec("showInFileExplorer", function () {
		o("two downloads, open two filemanagers", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			await dl.showInFileExplorer("/path/to/file.txt")
			o(mocks.electronMock.shell.openPath.callCount).equals(1)
			await dl.showInFileExplorer("/path/to/file.txt")
			o(mocks.electronMock.shell.openPath.callCount).equals(1)
		})

		o("two downloads, open two filemanagers after a pause", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			await dl.showInFileExplorer("/path/to/file.txt")
			o(mocks.electronMock.shell.openPath.callCount).equals(1)
			time += 1000 * 60
			await dl.showInFileExplorer("/path/to/file.txt")
			o(mocks.electronMock.shell.openPath.callCount).equals(2)
		})
	})

	o.spec("downloadNative", async function () {
		o("no error", async function () {
			const mocks = standardMocks()
			const response = new mocks.netMock.Response(200)
			response.on = (eventName, cb) => {
				if (eventName === "finish") cb()
			}
			mocks.netMock.executeRequest = spy(() => response)

			const expectedFilePath = "/tutanota/tmp/path/encrypted/nativelyDownloadedFile"

			const dl = makeMockedDownloadManager(mocks)
			const downloadResult = await dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
				v: "foo",
				accessToken: "bar",
			})
			o(downloadResult).deepEquals({
				statusCode: 200,
				errorId: null,
				precondition: null,
				suspensionTime: null,
				encryptedFileUri: expectedFilePath,
			})

			const ws = WriteStream.mockedInstances[0]

			o(mocks.netMock.executeRequest.args).deepEquals([
				"some://url/file",
				{
					method: "GET",
					headers: {
						v: "foo",
						accessToken: "bar",
					},
					timeout: 20000,
				},
			])

			o(mocks.fsMock.createWriteStream.callCount).equals(1)
			o(mocks.fsMock.createWriteStream.args).deepEquals([expectedFilePath, { emitClose: true }])

			o(response.pipe.callCount).equals(1)
			o(response.pipe.args[0]).deepEquals(ws)
			o(ws.close.callCount).equals(1)
		})

		o("404 error gets returned", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const res = new mocks.netMock.Response(404)
			const errorId = "123"
			res.headers["error-id"] = errorId
			mocks.netMock.executeRequest = () => res

			const result = await dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
				v: "foo",
				accessToken: "bar",
			})

			o(result).deepEquals({
				statusCode: 404,
				errorId,
				precondition: null,
				suspensionTime: null,
				encryptedFileUri: null,
			})
			o(mocks.fsMock.createWriteStream.callCount).equals(0)("createStream calls")
		})

		o("retry-after", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const res = new mocks.netMock.Response(TooManyRequestsError.CODE)
			const errorId = "123"
			res.headers["error-id"] = errorId
			const retryAFter = "20"
			res.headers["retry-after"] = retryAFter
			mocks.netMock.executeRequest = () => res

			const result = await dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
				v: "foo",
				accessToken: "bar",
			})

			o(result).deepEquals({
				statusCode: TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAFter,
				encryptedFileUri: null,
			})
			o(mocks.fsMock.createWriteStream.callCount).equals(0)("createStream calls")
		})

		o("suspension", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const res = new mocks.netMock.Response(TooManyRequestsError.CODE)
			const errorId = "123"
			res.headers["error-id"] = errorId
			const retryAFter = "20"
			res.headers["suspension-time"] = retryAFter
			mocks.netMock.executeRequest = () => res

			const result = await dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
				v: "foo",
				accessToken: "bar",
			})

			o(result).deepEquals({
				statusCode: TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAFter,
				encryptedFileUri: null,
			})
			o(mocks.fsMock.createWriteStream.callCount).equals(0)("createStream calls")
		})

		o("precondition", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const res = new mocks.netMock.Response(PreconditionFailedError.CODE)
			const errorId = "123"
			res.headers["error-id"] = errorId
			const precondition = "a.2"
			res.headers["precondition"] = precondition
			mocks.netMock.executeRequest = () => res

			const result = await dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
				v: "foo",
				accessToken: "bar",
			})

			o(result).deepEquals({
				statusCode: PreconditionFailedError.CODE,
				errorId,
				precondition: precondition,
				suspensionTime: null,
				encryptedFileUri: null,
			})
			o(mocks.fsMock.createWriteStream.callCount).equals(0)("createStream calls")
		})

		o("IO error during downlaod", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const res = new mocks.netMock.Response(200)
			mocks.netMock.executeRequest = () => res
			const error = new Error("Test! I/O error")

			res.on = function (eventName, callback) {
				if (eventName === "error") {
					callback(error)
				}
				return this
			}

			const returnedError = await assertThrows(Error, () =>
				dl.downloadNative("some://url/file", "nativelyDownloadedFile", {
					v: "foo",
					accessToken: "bar",
				}),
			)
			o(returnedError).equals(error)

			o(mocks.fsMock.createWriteStream.callCount).equals(1)("createStream calls")
			const ws = WriteStream.mockedInstances[0]
			o(ws.close.callCount).equals(1)("stream is closed")
			o(mocks.fsMock.promises.unlink.calls).deepEquals([["/tutanota/tmp/path/encrypted/nativelyDownloadedFile"]])("unlink")
		})
	})

	o.spec("upload", async function () {
		const fileToUploadPath = "/tutnaota/tmp/path/encrypted/toUpload.txt"
		const targetUrl = "https://test.tuta.com/rest/for/a/bit"
		let mocks
		let dl

		function mockResponse(statusCode: number, resOpts: { responseBody?: Uint8Array; responseHeaders?: Record<string, string> }) {
			const { responseBody, responseHeaders } = resOpts
			const response = new mocks.netMock.Response(statusCode)
			response.headers = responseHeaders ?? {}
			response.on = (eventName, cb) => {
				switch (eventName) {
					case "finish":
						cb()
						break
					case "data":
						if (responseBody) {
							cb(responseBody)
						}
						break
					case "end":
						cb()
						break
				}
			}
			return response
		}

		o.beforeEach(function () {
			mocks = standardMocks()
			dl = makeMockedDownloadManager(mocks)
		})

		o("when there's no error it uploads correct data and returns the right result", async function () {
			const body = stringToUtf8Uint8Array("BODY")
			const response = mockResponse(200, { responseBody: body })
			mocks.netMock.executeRequest = spy(() => response)
			const headers = {
				blobAccessToken: "1236",
			}
			const fileStreamMock = {}
			mocks.fsMock.createReadStream = (path) => {
				if (path === fileToUploadPath) {
					return fileStreamMock
				} else {
					throw new Error(`Invalid dest path ${path}`)
				}
			}

			const uploadResult = await dl.upload(fileToUploadPath, targetUrl, "POST", headers)

			o(mocks.netMock.executeRequest.args).deepEquals([targetUrl, { method: "POST", headers, timeout: 20000 }, fileStreamMock])

			o(uploadResult.statusCode).equals(200)
			o(uploadResult.errorId).equals(null)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(null)

			o(Array.from(uploadResult.responseBody)).deepEquals(Array.from(body))
		})

		o("when 404 is returned it returns correct result", async function () {
			const errorId = "123"
			const response = mockResponse(404, { responseHeaders: { "error-id": errorId } })
			mocks.netMock.executeRequest = spy(() => response)

			const uploadResult = await dl.upload(fileToUploadPath, targetUrl, "POST", {})

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
			mocks.netMock.executeRequest = spy(() => response)

			const uploadResult = await dl.upload(fileToUploadPath, targetUrl, "POST", {})

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
			mocks.netMock.executeRequest = spy(() => response)

			const uploadResult = await dl.upload(fileToUploadPath, targetUrl, "POST", {})

			o(uploadResult.statusCode).equals(TooManyRequestsError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(retryAFter)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when precondition-time is returned, it is propagated", async function () {
			const precondition = "a.2"
			const retryAFter = "20"
			const errorId = "123"
			const response = mockResponse(PreconditionFailedError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					precondition: precondition,
				},
			})
			mocks.netMock.executeRequest = spy(() => response)

			const uploadResult = await dl.upload(fileToUploadPath, targetUrl, "POST", {})

			o(uploadResult.statusCode).equals(PreconditionFailedError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(precondition)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		// there could have been tests for IO errors during upload but it's more of a test for executeRequest()
	})

	o.spec("open", function () {
		o("open valid", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			await dl.open("/some/folder/file")
			o(mocks.electronMock.shell.openPath.callCount).equals(1)
			o(mocks.electronMock.shell.openPath.args.length).equals(1)
			o(mocks.electronMock.shell.openPath.args[0]).equals("/some/folder/file")
		})
		o("open invalid", async () => {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			await o(() => dl.open("invalid")).asyncThrows(Error)
			o(mocks.electronMock.shell.openPath.callCount).equals(1)
			o(mocks.electronMock.shell.openPath.args.length).equals(1)
			o(mocks.electronMock.shell.openPath.args[0]).equals("invalid")
		})
		o("open on windows", async function () {
			n.setPlatform("win32")
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			await dl.open("exec.exe")
			o(mocks.electronMock.dialog.showMessageBox.callCount).equals(1)
			o(mocks.electronMock.shell.openPath.callCount).equals(0)
		})
	})

	o.spec("join", function () {
		o("join", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const joinedFile = await dl.joinFiles("fileName.pdf", ["/file1"])
			o(mocks.fsMock.createWriteStream.callCount).equals(1)("createStream calls")
			const ws = WriteStream.mockedInstances[0]

			o(mocks.fsMock.createReadStream.callCount).equals(1)("createStream calls")
			const rs = ReadStream.mockedInstances[0]
			o(rs.pipe.callCount).equals(1)("stream was piped")
			o(rs.pipe.args).deepEquals([ws, { end: false }])
			o(ws.close.callCount).equals(1)

			o(joinedFile).equals("/tutanota/tmp/path/download/fileName.pdf")
		})
	})

	o.spec("splitFile", function () {
		o("returns one slice for a small file", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			// fs mock returns file name as the content
			const filename = "/tutanota/tmp/path/download/small.txt"
			const fileContent = stringToUtf8Uint8Array(filename)

			const chunks = await dl.splitFile(filename, 1024)

			const filenameHash = "9ca089f82e397e9e860daa312ac25def39f2da0e066f0de94ffc02aa7b3a6250"
			const expectedChunkPath = `/tutanota/tmp/path/download/${filenameHash}.0.blob`
			o(chunks).deepEquals([expectedChunkPath])
			o(mocks.fsMock.promises.writeFile.args[0]).equals(expectedChunkPath)
			o(Array.from(mocks.fsMock.promises.writeFile.args[1])).deepEquals(Array.from(fileContent))
		})

		o("returns multiple slices for a bigger file", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			// fs mock returns file name as the content
			const filename = "/tutanota/tmp/path/download/small.txt"
			// length 37
			const fileContent = stringToUtf8Uint8Array(filename)

			const chunks = await dl.splitFile(filename, 30)

			const filenameHash = "9ca089f82e397e9e860daa312ac25def39f2da0e066f0de94ffc02aa7b3a6250"
			const expectedChunkPath0 = `/tutanota/tmp/path/download/${filenameHash}.0.blob`
			const expectedChunkPath1 = `/tutanota/tmp/path/download/${filenameHash}.1.blob`
			o(chunks).deepEquals([expectedChunkPath0, expectedChunkPath1])

			o(mocks.fsMock.promises.writeFile.calls[0][0]).equals(expectedChunkPath0)
			o(Array.from(mocks.fsMock.promises.writeFile.calls[0][1])).deepEquals(Array.from(fileContent.slice(0, 30)))
			o(mocks.fsMock.promises.writeFile.calls[1][0]).equals(expectedChunkPath1)
			o(Array.from(mocks.fsMock.promises.writeFile.calls[1][1])).deepEquals(Array.from(fileContent.slice(30)))
		})
	})

	o.spec("putFileIntoDownloadsFolder", function () {
		o("putFileIntoDownloadsFolder", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const copiedFileUri = await dl.putFileIntoDownloadsFolder("/path/fileName.pdf")
			o(mocks.fsMock.promises.copyFile.callCount).equals(1)("copy file to downloads folder")

			o(copiedFileUri).equals(DEFAULT_DOWNLOAD_PATH + "fileName.pdf")
		})
	})

	o.spec("size", function () {
		o("size", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const size = await dl.getSize("/file1")
			o(size).equals(33)
		})
	})

	o.spec("hash", function () {
		o("hash", async function () {
			const mocks = standardMocks()
			const dl = makeMockedDownloadManager(mocks)
			const fileHash = await dl.blobHashFile("/file1")
			o(fileHash).equals("fJ1mrFfJ")
		})
	})
})
