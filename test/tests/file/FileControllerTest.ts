import o from "@tutao/otest"
import { ArchiveDataType } from "../../../src/common/api/common/TutanotaConstants.js"
import { BlobFacade } from "../../../src/common/api/worker/facades/lazy/BlobFacade.js"
import { NativeFileApp } from "../../../src/common/native/common/FileApp.js"
import { matchers, object, verify, when } from "testdouble"
import { FileReference } from "../../../src/common/api/common/utils/FileUtils.js"
import { neverNull } from "@tutao/tutanota-utils"
import { DataFile } from "../../../src/common/api/common/DataFile.js"
import { BlobTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { FileTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { FileControllerNative } from "../../../src/common/file/FileControllerNative.js"
import { FileControllerBrowser } from "../../../src/common/file/FileControllerBrowser.js"
import { ConnectionError } from "../../../src/common/api/common/error/RestError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { Mode } from "../../../src/common/api/common/Env.js"
import Stream from "mithril/stream"
import { createTestEntity } from "../TestUtils.js"

const { anything, argThat } = matchers
const guiDownload = async function (somePromise: Promise<void>, progress?: Stream<number>) {
	return somePromise
}

o.spec("FileControllerTest", function () {
	let blobFacadeMock: BlobFacade

	o.beforeEach(function () {
		blobFacadeMock = object()
	})

	o.spec("native", function () {
		let fileAppMock: NativeFileApp
		let fileController: FileControllerNative
		let oldEnv: typeof env

		o.beforeEach(function () {
			fileAppMock = object()
			fileController = new FileControllerNative(blobFacadeMock, guiDownload, fileAppMock)
			oldEnv = globalThis.env
			globalThis.env = { mode: Mode.App, platformId: "android" } as typeof env
		})

		o.afterEach(function () {
			globalThis.env = oldEnv
		})

		o("should download non-legacy file natively using the blob service", async function () {
			const blobs = [createTestEntity(BlobTypeRef)]
			const file = createTestEntity(FileTypeRef, { blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
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

		o.spec("download with connection errors", function () {
			o("immediately no connection", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, guiDownload, fileAppMock)
				const blobs = [createTestEntity(BlobTypeRef)]
				const file = createTestEntity(FileTypeRef, { blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything())).thenReject(new ConnectionError("no connection"))
				await assertThrows(ConnectionError, async () => await testableFileController.download(file))
				verify(fileAppMock.deleteFile(anything()), { times: 0 }) // mock for cleanup
			})
			o("connection lost after 1 already downloaded attachment- already downloaded attachments are processed", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, guiDownload, fileAppMock)
				const blobs = [createTestEntity(BlobTypeRef)]
				const fileWorks = createTestEntity(FileTypeRef, {
					blobs: blobs,
					name: "works.txt",
					mimeType: "plain/text",
					_id: ["fileListId", "fileElementId"],
				})
				const fileNotWorks = createTestEntity(FileTypeRef, {
					blobs: blobs,
					name: "broken.txt",
					mimeType: "plain/text",
					_id: ["fileListId", "fileElementId"],
				})
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
			fileController = new FileControllerBrowser(blobFacadeMock, guiDownload)
		})

		o("should download non-legacy file non-natively using the blob service", async function () {
			const blobs = [createTestEntity(BlobTypeRef)]
			const file = createTestEntity(FileTypeRef, { blobs: blobs, name: "test.txt", mimeType: "plain/text", _id: ["fileListId", "fileElementId"] })
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
	})
})
