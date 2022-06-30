import o from "ospec"
import {ArchiveDataType} from "../../../src/api/common/TutanotaConstants.js"
import {BlobFacade} from "../../../src/api/worker/facades/BlobFacade.js"
import {FileFacade} from "../../../src/api/worker/facades/FileFacade.js"
import {NativeFileApp} from "../../../src/native/common/FileApp.js"
import {matchers, object, verify, when} from "testdouble"
import {FileReference} from "../../../src/api/common/utils/FileUtils.js"
import {neverNull} from "@tutao/tutanota-utils"
import {DataFile} from "../../../src/api/common/DataFile.js"
import {createBlob} from "../../../src/api/entities/sys/TypeRefs.js"
import {createFile} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {FileControllerNative} from "../../../src/file/FileControllerNative.js"
import {FileControllerBrowser} from "../../../src/file/FileControllerBrowser.js"

const {anything} = matchers


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

		o.beforeEach(function () {
			fileAppMock = object()
			fileController = new FileControllerNative(fileAppMock, blobFacadeMock, fileFacadeMock)
		})

		o("should download non-legacy file file natively using the blob service", async function () {
			const blobs = [createBlob()]
			const file = createFile({blobs: blobs, name: "test.txt", mimeType: "plain/text"})
			const fileReference = object<FileReference>()
			when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything(), anything()))
				.thenResolve(fileReference)
			const result = await fileController.downloadAndDecryptInNative(file)
			verify(blobFacadeMock.downloadAndDecryptNative(ArchiveDataType.Attachments, blobs, file, file.name, neverNull(file.mimeType)))
			o(result).equals(fileReference)
		})

		o("should download legacy file natively using the file data service", async function () {
			const file = createFile({data: "ID", name: "test.txt", mimeType: "plain/text"})
			const fileReference = object<FileReference>()
			when(fileFacadeMock.downloadFileContentNative(anything()))
				.thenResolve(fileReference)
			const result = await fileController.downloadAndDecryptInNative(file)
			verify(fileFacadeMock.downloadFileContentNative(file))
			o(result).equals(fileReference)
		})
	})

	o.spec("browser", function () {
		let fileController: FileControllerBrowser

		o.beforeEach(function () {
			fileController = new FileControllerBrowser(blobFacadeMock, fileFacadeMock)
		})

		o("should download non-legacy file non-natively using the blob service", async function () {
			const blobs = [createBlob()]
			const file = createFile({blobs: blobs, name: "test.txt", mimeType: "plain/text"})
			const data = new Uint8Array([1, 2, 3])
			when(blobFacadeMock.downloadAndDecrypt(anything(), anything(), anything()))
				.thenResolve(data)
			const result = await fileController.downloadAndDecrypt(file)
			verify(blobFacadeMock.downloadAndDecrypt(ArchiveDataType.Attachments, blobs, file))
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
			const file = createFile({data: "ID", name: "test.txt", mimeType: "plain/text"})
			const dataFile = object<DataFile>()
			when(fileFacadeMock.downloadFileContent(anything()))
				.thenResolve(dataFile)
			const result = await fileController.downloadAndDecrypt(file)
			verify(fileFacadeMock.downloadFileContent(file))
			o(result).equals(dataFile)
		})
	})
})