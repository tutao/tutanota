import o from "ospec"
import {ArchiveDataType} from "../../../src/api/common/TutanotaConstants"
import {FileController} from "../../../src/file/FileController"
import {BlobFacade} from "../../../src/api/worker/facades/BlobFacade"
import {FileFacade} from "../../../src/api/worker/facades/FileFacade"
import {NativeFileApp} from "../../../src/native/common/FileApp"
import {matchers, object, verify, when} from "testdouble"
import {FileReference} from "../../../src/api/common/utils/FileUtils"
import {neverNull} from "@tutao/tutanota-utils"
import {DataFile} from "../../../src/api/common/DataFile"
import {createBlob} from "../../../src/api/entities/sys/TypeRefs"
import {createFile} from "../../../src/api/entities/tutanota/TypeRefs.js"

const {anything, captor} = matchers


o.spec("FileControllerTest", function () {
	let blobFacadeMock: BlobFacade
	let fileFacadeMock: FileFacade
	let fileAppMock: NativeFileApp
	let fileController: FileController


	o.beforeEach(function () {
		fileAppMock = object<NativeFileApp>()
		blobFacadeMock = object<BlobFacade>()
		fileFacadeMock = object<FileFacade>()
		fileController = new FileController(fileAppMock, blobFacadeMock, fileFacadeMock)
	})

	o("downloadAndDecryptNative blobs", async function () {
		const blobs = [createBlob()]
		const file = createFile({blobs: blobs, name: "test.txt", mimeType: "plain/text"})
		const fileReference = object<FileReference>()
		when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything(), anything()))
			.thenResolve(fileReference)
		const result = await fileController.downloadAndDecryptNative(file)
		verify(blobFacadeMock.downloadAndDecryptNative(ArchiveDataType.Attachments, blobs, file, file.name, neverNull(file.mimeType)))
		o(result).equals(fileReference)
	})

	o("downloadAndDecryptNative fileData", async function () {
		const file = createFile({data: "ID", name: "test.txt", mimeType: "plain/text"})
		const fileReference = object<FileReference>()
		when(fileFacadeMock.downloadFileContentNative(anything()))
			.thenResolve(fileReference)
		const result = await fileController.downloadAndDecryptNative(file)
		verify(fileFacadeMock.downloadFileContentNative(file))
		o(result).equals(fileReference)
	})

	o("downloadAndDecryptBrowser blobs", async function () {
		const blobs = [createBlob()]
		const file = createFile({blobs: blobs, name: "test.txt", mimeType: "plain/text"})
		const data = new Uint8Array([1, 2, 3])
		when(blobFacadeMock.downloadAndDecrypt(anything(), anything(), anything()))
			.thenResolve(data)
		const result = await fileController.downloadAndDecryptBrowser(file)
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

	o("downloadAndDecryptBrowser fileData", async function () {
		const file = createFile({data: "ID", name: "test.txt", mimeType: "plain/text"})
		const dataFile = object<DataFile>()
		when(fileFacadeMock.downloadFileContent(anything()))
			.thenResolve(dataFile)
		const result = await fileController.downloadAndDecryptBrowser(file)
		verify(fileFacadeMock.downloadFileContent(file))
		o(result).equals(dataFile)
	})

})