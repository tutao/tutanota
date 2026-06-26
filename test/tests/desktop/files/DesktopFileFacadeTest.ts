import o, { assertThrows } from "@tutao/otest"

import { DesktopFileFacade, getMimeTypeForFile, readStreamToBuffer } from "../../../../src/applications/common/desktop/files/DesktopFileFacade.js"
import { ApplicationWindow } from "../../../../src/applications/common/desktop/ApplicationWindow.js"
import { func, matchers, object, verify, when } from "testdouble"
import { ElectronExports, FsExports, PathExports } from "../../../../src/applications/common/desktop/ElectronExportTypes.js"
import * as restError from "../../../../src/platform-kit/rest-client/error"
import { HttpMethod } from "../../../../src/platform-kit/rest-client/types"
import type fs from "node:fs"
import { DateProvider, stringToUtf8Uint8Array } from "../../../../src/platform-kit/utils"
import { DesktopConfig } from "../../../../src/applications/common/desktop/config/DesktopConfig.js"
import { TempFs } from "../../../../src/applications/common/desktop/files/TempFs.js"
import { BuildConfigKey, DesktopConfigKey, ProgrammingError } from "../../../../src/platform-kit/app-env"
import { FetchImpl, FetchResult } from "../../../../src/applications/common/desktop/net/NetAgent"
import { CommandExecutor } from "../../../../src/applications/common/desktop/CommandExecutor"
import stream from "node:stream"
import nodePath from "node:path"
import { createDataFile } from "../../../../src/applications/common/api/worker/utils/DataFile.js"
import { mockFsReadStream } from "../desktopTestUtils"

const DEFAULT_DOWNLOAD_PATH = "/a/download/path/"
const USER_DATA_PATH = "/path/to/user/data"

type Writable<T> = {
	-readonly [P in keyof T]: T[P]
}

o.spec("DesktopFileFacade", function () {
	let win: ApplicationWindow
	let conf: DesktopConfig
	let dp: DateProvider
	let fetch: FetchImpl
	let electron: Writable<ElectronExports>
	let fs: FsExports
	let tfs: TempFs
	let ff: DesktopFileFacade
	let path: Writable<PathExports>
	let executor: CommandExecutor
	let process: Writeable<Partial<NodeJS.Process>>

	o.beforeEach(function () {
		win = object()
		fetch = func() as FetchImpl
		fs = object()
		tfs = object()
		path = object()
		fs.promises = object()
		process = {
			env: {},
		}
		when(fs.promises.stat(matchers.anything())).thenResolve({ size: 42 })
		electron = object()
		electron["shell"] = object()
		electron["dialog"] = object()
		electron.app = object()
		when(electron.app.getPath("userData")).thenReturn(USER_DATA_PATH)
		process.platform = "linux"
		path.sep = "/"
		when(path.resolve(), { ignoreExtraArgs: true }).thenDo((...args) => nodePath.resolve(...args))
		when(path.join(), { ignoreExtraArgs: true }).thenDo((...args) => args.join("/"))

		conf = object()
		dp = object()
		executor = object()

		ff = new DesktopFileFacade(win, conf, dp, fetch, electron, tfs, fs, path, executor, process as NodeJS.Process, {
			downloadProgress: async () => {},
			uploadProgress: async () => {},
		})
	})
	o.spec("saveDataFile", function () {
		o("when there's no existing file it will be simply written", async function () {
			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			when(fs.promises.readdir(matchers.anything())).thenResolve(["somethingelse"])
			when(fs.promises.mkdir("/tutanota/tmp/path/download", { recursive: true })).thenResolve(undefined)
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob", dataFile.data)).thenResolve()
			await ff.writeTempDataFile(dataFile)
		})

		o("with default download path but file exists -> nonclobbering name is chosen", async function () {
			const e = new Error() as any
			e.code = "EEXISTS"
			const dataFile = createDataFile("blob", "application/octet-stream", new Uint8Array([1]))
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob", matchers.anything())).thenReject(e)
			when(fs.promises.readdir(matchers.anything())).thenResolve(["blob"])
			when(fs.promises.mkdir("/tutanota/tmp/path/download", { recursive: true })).thenResolve(undefined)
			when(fs.promises.writeFile("/tutanota/tmp/path/download/blob-1", dataFile.data)).thenResolve()
			await ff.writeTempDataFile(dataFile)
		})
	})

	o.spec("download", function () {
		o("no error", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const expectedFileUrl = "file:///tutanota/tmp/path/encrypted/nativelyDownloadedFile"
			const fileBody = new Uint8Array([3, 4, 6, 9])
			const response: FetchResult = mockResponse(200, { responseBody: fileBody })
			const ws: BufferWritableStream = mockWriteStream() satisfies stream.Writable
			const fws = ws as unknown as fs.WriteStream
			when(fs.createWriteStream(urlLike(expectedFileUrl), { emitClose: true })).thenReturn(fws)
			when(
				fetch(urlMatches(new URL("some://url/file")), {
					method: "GET",
					headers,
					signal: matchers.anything(),
				}),
			).thenResolve(response)
			when(tfs.ensureEncryptedDir()).thenResolve("/tutanota/tmp/path/encrypted")

			const downloadResult = await ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId")
			o(downloadResult.statusCode).equals(200)
			o(downloadResult.encryptedFileUri).equals(expectedFileUrl)
			o(ws.result()).deepEquals(fileBody)
		})

		o("404 error gets returned", async function () {
			const headers = {
				v: "foo",
				accessToken: "bar",
			}

			const errorId = "123"
			const response: FetchResult = mockResponse(restError.NotFoundError.CODE, {
				responseHeaders: {
					"error-id": errorId,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)
			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId")

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
			const retryAfter = "20"
			const errorId = "123"

			const response: FetchResult = mockResponse(restError.TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"retry-after": retryAfter,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)

			const headers = { v: "foo", accessToken: "bar" }
			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId")

			o(result).deepEquals({
				statusCode: restError.TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAfter,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("suspension", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const errorId = "123"
			const retryAfter = "20"
			const response: FetchResult = mockResponse(restError.TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"suspension-time": retryAfter,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)

			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId")

			o(result).deepEquals({
				statusCode: restError.TooManyRequestsError.CODE,
				errorId,
				precondition: null,
				suspensionTime: retryAfter,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("precondition", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const errorId = "123"
			const precondition = "a.2"
			const response: FetchResult = mockResponse(restError.PreconditionFailedError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					precondition: precondition,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)

			const result = await ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId")

			o(result).deepEquals({
				statusCode: restError.PreconditionFailedError.CODE,
				errorId,
				precondition,
				suspensionTime: null,
				encryptedFileUri: null,
			})
			verify(fs.createWriteStream(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("IO error during download leads to cleanup and error is thrown", async function () {
			const headers = { v: "foo", accessToken: "bar" }
			const response: FetchResult = mockResponse(200, { responseBody: new Uint8Array([1, 2, 3, 4, 5]) })
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)
			const error = new Error("Test! I/O error")
			const ws = mockWriteStream({ error })
			when(fs.createWriteStream(matchers.anything(), matchers.anything())).thenReturn(ws as unknown as fs.WriteStream)
			when(tfs.ensureEncryptedDir()).thenResolve("/tutanota/tmp/path/encrypted")

			const e = await assertThrows(Error, () => ff.download("some://url/file", "nativelyDownloadedFile", headers, "fileId"))
			o(e).equals(error)
			verify(fs.promises.unlink(urlLike("file:///tutanota/tmp/path/encrypted/nativelyDownloadedFile")), { times: 1 })
		})
	})

	o.spec("upload", function () {
		const fileToUploadPath = "/tutnaota/tmp/path/encrypted/toUpload.txt"
		const targetUrl = "https://test.tutanota.com/rest/for/a/bit"

		o("when there's no error it uploads correct data and returns the right result", async function () {
			const body = stringToUtf8Uint8Array("BODY")
			const response = mockResponse(200, { responseBody: body })
			const headers = {
				blobAccessToken: "1236",
			}
			const fileStreamMock = mockFsReadStream(new Buffer([1, 2, 3, 4]))
			when(tfs.fileStream(fileToUploadPath)).thenReturn(fileStreamMock)
			when(
				fetch(urlMatches(new URL(targetUrl)), {
					method: HttpMethod.POST,
					headers,
					body: matchers.anything(),
					signal: matchers.anything(),
				}),
			).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, HttpMethod.POST, headers, "abc")

			o(uploadResult.statusCode).equals(200)
			o(uploadResult.errorId).equals(null)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals(Array.from(body))
		})

		o("when 404 is returned it returns correct result", async function () {
			const errorId = "123"
			const fileStreamMock = mockFsReadStream(new Buffer([1, 2, 3, 4]))
			when(tfs.fileStream(fileToUploadPath)).thenReturn(fileStreamMock)
			const response = mockResponse(404, { responseHeaders: { "error-id": errorId } })
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, HttpMethod.POST, {}, "abc")
			o(uploadResult.statusCode).equals(404)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when retry-after is returned, it is propagated", async function () {
			const retryAFter = "20"
			const errorId = "123"
			const fileStreamMock = mockFsReadStream(new Buffer([1, 2, 3, 4]))
			when(tfs.fileStream(fileToUploadPath)).thenReturn(fileStreamMock)
			const response = mockResponse(restError.TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"retry-after": retryAFter,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)

			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, HttpMethod.POST, {}, "abc")

			o(uploadResult.statusCode).equals(restError.TooManyRequestsError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(retryAFter)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when suspension-time is returned, it is propagated", async function () {
			const retryAFter = "20"
			const errorId = "123"
			const fileStreamMock = mockFsReadStream(new Buffer([1, 2, 3, 4]))
			when(tfs.fileStream(fileToUploadPath)).thenReturn(fileStreamMock)
			const response = mockResponse(restError.TooManyRequestsError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					"suspension-time": retryAFter,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)
			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, HttpMethod.POST, {}, "abc")

			o(uploadResult.statusCode).equals(restError.TooManyRequestsError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(null)
			o(uploadResult.suspensionTime).equals(retryAFter)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})

		o("when precondition-time is returned, it is propagated", async function () {
			const precondition = "a.2"
			const errorId = "123"
			const fileStreamMock = mockFsReadStream(new Buffer([1, 2, 3, 4]))
			when(tfs.fileStream(fileToUploadPath)).thenReturn(fileStreamMock)
			const response = mockResponse(restError.PreconditionFailedError.CODE, {
				responseHeaders: {
					"error-id": errorId,
					precondition: precondition,
				},
			})
			when(fetch(matchers.anything(), matchers.anything())).thenResolve(response)

			const uploadResult = await ff.upload(fileToUploadPath, targetUrl, HttpMethod.POST, {}, "abc")

			o(uploadResult.statusCode).equals(restError.PreconditionFailedError.CODE)
			o(uploadResult.errorId).equals(errorId)
			o(uploadResult.precondition).equals(precondition)
			o(uploadResult.suspensionTime).equals(null)
			o(Array.from(uploadResult.responseBody)).deepEquals([])
		})
	})

	o.spec("open", function () {
		o.spec("open on linux", () => {
			o.test("open on ubuntu", async function () {
				when(electron.shell.openPath("/some/folder/file")).thenReject(new Error("wrong function"))
				when(executor.run(matchers.anything())).thenResolve({})
				process.env!.ORIGINAL_XDG_CURRENT_DESKTOP = "original ;)"
				process.env!.SOMETHING_ELSE = "something else!"
				await ff.open("file:///some/folder/file")

				verify(
					executor.run({
						executable: "xdg-open",
						args: ["/some/folder/file"],
						env: {
							XDG_CURRENT_DESKTOP: "original ;)",
							ORIGINAL_XDG_CURRENT_DESKTOP: "original ;)",
							SOMETHING_ELSE: "something else!",
						},
					}),
				)
				verify(tfs.assertInTmpDir("file:///some/folder/file"))
			})
			o.test("open on non ubuntu", async function () {
				when(electron.shell.openPath("/some/folder/file")).thenReject(new Error("wrong function"))
				when(executor.run(matchers.anything())).thenResolve({})
				process.env!.ORIGINAL_XDG_CURRENT_DESKTOP = undefined
				process.env!.SOMETHING_ELSE = "something else!"
				await ff.open("file:///some/folder/file")

				verify(
					executor.run({
						executable: "xdg-open",
						args: ["/some/folder/file"],
						env: undefined,
					}),
				)
			})
		})

		o.test("open on windows", async function () {
			process.platform = "win32"
			when(electron.dialog.showMessageBox(matchers.anything())).thenReturn(
				Promise.resolve({
					response: 1,
					checkboxChecked: false,
				}),
			)
			await ff.open("file:///exec.exe")
			verify(electron.shell.openPath(matchers.anything()), { times: 0 })
		})
	})

	o.spec("join", function () {
		o("join a single file", async function () {
			const ws: fs.WriteStream = mockWriteStream()
			const rs: fs.ReadStream = mockFsReadStream(new Buffer([10, 2, 3, 4]))
			when(fs.createWriteStream(matchers.anything(), matchers.anything())).thenReturn(ws)
			when(fs.createReadStream(matchers.anything())).thenReturn(rs)
			when(fs.promises.readdir("/tutanota/tmp/path/unencrypted")).thenResolve(["folderContents"])
			when(tfs.ensureUnencrytpedDir()).thenResolve("/tutanota/tmp/path/unencrypted")
			const joinedFilePath = await ff.joinFiles("fileName.pdf", ["/file1"])
			o(joinedFilePath).equals("file:///tutanota/tmp/path/unencrypted/fileName.pdf")
			verify(tfs.assertInTmpDir("/file1"))
		})
	})

	o.spec("readStreamToBuffer", function () {
		o.test("reads up to stream end correctly", async function () {
			const inputBuffer = Buffer.alloc(16)
			const stream = mockFsReadStream(inputBuffer)
			const outputBuffer = await readStreamToBuffer(stream, 30)
			o.check(Buffer.alloc(16) as Uint8Array).deepEquals(outputBuffer)
		})

		o.test("reads less than stream end correctly", async function () {
			const inputBuffer = Buffer.alloc(32)
			const stream = mockFsReadStream(inputBuffer)
			const outputBuffer = await readStreamToBuffer(stream, 16)
			o.check(Buffer.alloc(16) as Uint8Array).deepEquals(outputBuffer)
		})

		o.test("reads more than one chunk correctly", async function () {
			const inputBuffer = Buffer.alloc(1024 * 1024 * 3)
			const stream = mockFsReadStream(inputBuffer)
			const outputBuffer = await readStreamToBuffer(stream, 1024 * 1024 + 256)
			o.check(Buffer.alloc(1024 * 1024 + 256) as Uint8Array).deepEquals(outputBuffer)
		})
	})

	o.spec("showInFileExplorer", function () {
		o("two downloads, open two filemanagers", async function () {
			await ff.showInFileExplorer(new URL("file:///path/to/file.txt"))
			verify(electron.shell.showItemInFolder("/path/to/file.txt"), { times: 1 })
		})

		o("two downloads, open two filemanagers after a pause", async function () {
			const time = 1629115820468
			await ff.showInFileExplorer(new URL("file:///path/to/file.txt"))
			when(dp.now()).thenReturn(time)
			when(conf.getConst(BuildConfigKey.fileManagerTimeout)).thenResolve(2)
			verify(electron.shell.showItemInFolder("/path/to/file.txt"), { times: 1 })
			when(dp.now()).thenReturn(time + 10)
			await ff.showInFileExplorer(new URL("file:///path/to/file.txt"))
			verify(electron.shell.showItemInFolder("/path/to/file.txt"), { times: 2 })
		})
	})

	o.spec("putFileIntoDownloadsFolder", function () {
		o("putFileIntoDownloadsFolder", async function () {
			const src = "file:///path/random.pdf"
			when(tfs.assertInTmpDir(src)).thenReturn(new URL(src))
			const filename = "fileName.pdf"
			const defaultDownloadPath = "/some/downloads"
			when(conf.getVar(DesktopConfigKey.defaultDownloadPath)).thenResolve(defaultDownloadPath)
			when(fs.promises.readdir(matchers.anything())).thenResolve([])
			const copiedFileUri = await ff.putFileIntoDownloadsFolder(src, filename)
			verify(fs.promises.copyFile(urlLike(src), urlLike("file:///some/downloads/fileName.pdf")))
			o(copiedFileUri).equals("file:///some/downloads/fileName.pdf")
			verify(tfs.assertInTmpDir(src))
		})
	})

	o.spec("size", function () {
		o("size", async function () {
			when(tfs.getFileSize("/file1")).thenResolve(33)
			o(await ff.getSize("/file1")).equals(33)
		})
	})

	o.spec("hash", function () {
		o("hash", async function () {
			const fileContent = Buffer.from([0, 1, 2, 3])
			when(tfs.fileStream("/file1")).thenReturn(mockFsReadStream(fileContent))
			o(await ff.hashFile("/file1")).equals("BU7ewdAh")
		})
	})

	o.spec("getMimeTypeForFile", function () {
		o.test("given lowercased four-letter extension it returns the correct mime type", async function () {
			o.check(await getMimeTypeForFile(new URL("file:///tmp/picture.jpg"))).equals("image/jpeg")
		})

		o.test("given uppercased four-letter extension it returns the correct mime type", async function () {
			o.check(await getMimeTypeForFile(new URL("file:///tmp/picture.JPEG"))).equals("image/jpeg")
		})

		o.test("given nonexisting extension it returns default fallback", async function () {
			o.check(await getMimeTypeForFile(new URL("file:///tmp/picture.nonsense"))).equals("application/octet-stream")
		})
	})

	o.spec("writeToAppDir", function () {
		o.test("writes to a correct file normally", async function () {
			const data = new Uint8Array([1, 2, 3])
			await ff.writeToAppDir(data, "name.dat")
			verify(fs.writeFileSync(`${USER_DATA_PATH}/name.dat`, data))
		})

		o.test("fails if outside the app dir", async function () {
			const data = new Uint8Array([1, 2, 3])
			await o.check(() => ff.writeToAppDir(data, "../name.dat")).asyncThrows(ProgrammingError)
		})
	})

	o.spec("readFromAppDir", function () {
		o.test("reads a correct file normally", async function () {
			const data = new Uint8Array([1, 2, 3])
			when(fs.readFileSync(`${USER_DATA_PATH}/name.dat`)).thenReturn(Buffer.from(data))
			o.check(await ff.readFromAppDir("name.dat")).deepEquals(data)
		})

		o.test("fails if outside the app dir", async function () {
			await o.check(() => ff.readFromAppDir("../name.dat")).asyncThrows(ProgrammingError)
		})
	})

	o.spec("deleteFromAppDir", function () {
		o.test("deletes correct file normally", async function () {
			await ff.deleteFromAppDir("name.dat")
			o.check(fs.promises.unlink(`${USER_DATA_PATH}/name.dat`))
		})

		o.test("fails if outside the app dir", async function () {
			await o.check(() => ff.deleteFromAppDir("../name.dat")).asyncThrows(ProgrammingError)
		})
	})
})

const urlMatches = matchers.create({
	name: "urlMatches",
	matches(matcherArgs: any[], actual: any): boolean {
		return (actual as URL).toString() === (matcherArgs[0] as URL).toString()
	},
})

class BufferWritableStream extends stream.Writable {
	readonly chunks: Buffer[] = []

	constructor(readonly error: Error | null = null) {
		super()
	}

	_write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
		if (this.error) {
			callback(this.error)
		} else {
			this.chunks.push(chunk)
			callback()
		}
	}

	close() {
		// no-op, exists to pretend we are fs.WriteStream
		this.emit("close")
	}

	result(): Uint8Array {
		return Buffer.concat(this.chunks)
	}
}

function mockWriteStream({ error }: { error?: Error } = {}): BufferWritableStream & fs.WriteStream {
	return new BufferWritableStream(error ?? null) as BufferWritableStream & fs.WriteStream
}

function mockResponse(
	statusCode: number,
	resOpts: {
		responseBody?: Uint8Array
		responseHeaders?: Record<string, string>
	},
): FetchResult {
	const { responseBody, responseHeaders } = resOpts
	return new global.Response(responseBody, {
		status: statusCode,
		headers: new Headers(responseHeaders),
	}) as FetchResult
}

const urlLike = matchers.create({
	name: `url like`,
	matches: (matcherArgs: any[], actual: any) => {
		return matcherArgs[0] === actual.toString()
	},
})
