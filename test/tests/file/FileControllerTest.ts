import o from "@tutao/otest"
import { ArchiveDataType } from "../../../src/api/common/TutanotaConstants.js"
import { BlobFacade } from "../../../src/api/worker/facades/lazy/BlobFacade.js"
import { FileFacade } from "../../../src/api/worker/facades/lazy/FileFacade.js"
import { NativeFileApp } from "../../../src/native/common/FileApp.js"
import { matchers, object, verify, when } from "testdouble"
import { FileReference } from "../../../src/api/common/utils/FileUtils.js"
import { neverNull } from "@tutao/tutanota-utils"
import { DataFile } from "../../../src/api/common/DataFile.js"
import { createBlob } from "../../../src/api/entities/sys/TypeRefs.js"
import { createFile } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { FileControllerNative } from "../../../src/file/FileControllerNative.js"
import { FileControllerBrowser } from "../../../src/file/FileControllerBrowser.js"
import { ConnectionError } from "../../../src/api/common/error/RestError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { Mode } from "../../../src/api/common/Env.js"
import Stream from "mithril/stream"

const { anything, argThat } = matchers
const guiDownload = async function (somePromise: Promise<void>, progress?: Stream<number>) {
	return somePromise
}

o.spec("FileControllerTest", function () {
	let blobFacadeMock: BlobFacade
	let fileFacadeMock: FileFacade

	o.beforeEach(function () {
		blobFacadeMock = object()
		fileFacadeMock = object()
	})

	o.spec("native", function () {
		let fileAppMock: NativeFileApp
		let fileController: FileControllerNative
		let oldEnv: typeof env

		o.beforeEach(function () {
			fileAppMock = object()
			fileController = new FileControllerNative(blobFacadeMock, fileFacadeMock, guiDownload, fileAppMock)
			oldEnv = globalThis.env
			globalThis.env = { mode: Mode.App, platformId: "android" } as typeof env
		})

		o.afterEach(function () {
			globalThis.env = oldEnv
		})

		o("should download non-legacy file natively using the blob service", async function () {
			const blobs = [createBlob()]
			const file = createFile({ blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
			const fileReference = object<FileReference>()
			when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything())).thenResolve(fileReference)
			const result = await fileController.downloadAndDecrypt(file)
			verify(
				blobFacadeMock.downloadAndDecryptNative(
					ArchiveDataType.Attachments,
					argThat((referencingInstance) => {
						return referencingInstance.entity === file
					}),
					file.name,
					neverNull(file.mimeType),
				),
			)
			o(result).equals(fileReference)
		})

		o("should download legacy file natively using the file data service", async function () {
			const file = createFile({ data: "ID", name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
			const fileReference = object<FileReference>()
			when(fileFacadeMock.downloadFileContentNative(anything())).thenResolve(fileReference)
			const result = await fileController.downloadAndDecrypt(file)
			verify(fileFacadeMock.downloadFileContentNative(file))
			o(result).equals(fileReference)
		})

		o.spec("download with connection errors", function () {
			o("immediately no connection", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, fileFacadeMock, guiDownload, fileAppMock)
				const blobs = [createBlob()]
				const file = createFile({ blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything())).thenReject(new ConnectionError("no connection"))
				await assertThrows(ConnectionError, async () => await testableFileController.download(file))
				verify(fileAppMock.deleteFile(anything()), { times: 0 }) // mock for cleanup
			})
			o("connection lost after 1 already downloaded attachment- already downloaded attachments are processed", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, fileFacadeMock, guiDownload, fileAppMock)
				const blobs = [createBlob()]
				const fileWorks = createFile({ blobs: blobs, name: "works.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
				const fileNotWorks = createFile({ blobs: blobs, name: "broken.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
				const fileReferenceWorks: FileReference = {
					name: "works.txt",
					mimeType: "plain/text",
					location: "somepath/works.txt",
					size: 512,
					_type: "FileReference",
				}
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), "works.txt", anything())).thenResolve(fileReferenceWorks)
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), "broken.txt", anything())).thenReject(new ConnectionError("no connection"))
				await assertThrows(ConnectionError, async () => await testableFileController.downloadAll([fileWorks, fileNotWorks]))
				verify(fileAppMock.deleteFile(anything()), { times: 1 }) // mock for cleanup
			})
		})
	})

	o.spec("browser", function () {
		let fileController: FileControllerBrowser

		o.beforeEach(function () {
			fileController = new FileControllerBrowser(blobFacadeMock, fileFacadeMock, guiDownload)
		})

		o("should download non-legacy file non-natively using the blob service", async function () {
			const blobs = [createBlob()]
			const file = createFile({ blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
			const data = new Uint8Array([1, 2, 3])
			when(blobFacadeMock.downloadAndDecrypt(anything(), anything())).thenResolve(data)
			const result = await fileController.downloadAndDecrypt(file)
			verify(
				blobFacadeMock.downloadAndDecrypt(
					ArchiveDataType.Attachments,
					argThat((referencingInstance) => referencingInstance.entity === file),
				),
			)
			o(result).deepEquals({
				_type: "DataFile",
				name: file.name,
				mimeType: neverNull(file.mimeType),
				data: data,
				size: data.byteLength,
				id: file._id,
				cid: undefined,
			})
		})

		o("should download legacy file non-natively using the file data service", async function () {
			const file = createFile({ data: "ID", name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
			const dataFile = object<DataFile>()
			when(fileFacadeMock.downloadFileContent(anything())).thenResolve(dataFile)
			const result = await fileController.downloadAndDecrypt(file)
			verify(fileFacadeMock.downloadFileContent(file))
			o(result).equals(dataFile)
		})
	})
})
