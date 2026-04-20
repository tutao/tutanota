import o, { assertThrows } from "@tutao/otest"
import { ArchiveDataType, Mode } from "../../../src/app-env"
import { BlobFacade } from "../../../src/common/api/worker/facades/lazy/BlobFacade.js"
import { NativeFileApp } from "../../../src/common/native/common/FileApp.js"
import { matchers, object, verify, when } from "testdouble"
import { FileReference } from "../../../src/common/api/common/utils/FileUtils.js"
import { neverNull } from "@tutao/utils"
import { DataFile } from "../../../src/common/api/common/DataFile.js"
import { FileControllerNative } from "../../../src/common/file/FileControllerNative.js"
import { FileControllerBrowser } from "../../../src/common/file/FileControllerBrowser.js"
import * as restError from "@tutao/rest-client/error"
import { createTestEntity, withOverriddenEnv } from "../TestUtils.js"
import { TransferId } from "../../../src/common/api/common/drive/DriveTypes"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"

const { anything, argThat } = matchers

o.spec("FileControllerTest", function () {
	let blobFacadeMock: BlobFacade

	o.beforeEach(function () {
		blobFacadeMock = object()
	})

	o.spec("native", function () {
		const androidEnv: Partial<typeof env> = { mode: Mode.App, platformId: "android" }
		let fileAppMock: NativeFileApp
		let fileController: FileControllerNative

		o.beforeEach(function () {
			fileAppMock = object()
			fileController = new FileControllerNative(blobFacadeMock, fileAppMock)
		})

		o("should download non-legacy file natively using the blob service", async function () {
			const transferId = "abcd" as TransferId
			const blobs = [createTestEntity(sysTypeRefs.BlobTypeRef)]
			const file = createTestEntity(tutanotaTypeRefs.FileTypeRef, {
				blobs: blobs,
				name: "test.txt",
				mimeType: "plain/text",
				_id: ["fileListId", "fileElementId"],
			})
			const fileReference = object<FileReference>()
			when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything(), transferId)).thenResolve(fileReference)
			const result = await withOverriddenEnv(androidEnv, () => fileController.downloadAndDecrypt(file, transferId, ArchiveDataType.Attachments))
			verify(
				blobFacadeMock.downloadAndDecryptNative(
					ArchiveDataType.Attachments,
					argThat((referencingInstance) => {
						return referencingInstance.entity === file
					}),
					file.name,
					neverNull(file.mimeType),
					transferId,
				),
			)
			o(result).equals(fileReference)
		})

		o.spec("download with connection errors", function () {
			o("immediately no connection", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, fileAppMock)
				const blobs = [createTestEntity(sysTypeRefs.BlobTypeRef)]
				const file = createTestEntity(tutanotaTypeRefs.FileTypeRef, {
					blobs: blobs,
					name: "test.txt",
					mimeType: "plain/text",
					_id: ["fileListId", "fileElementId"],
				})
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), anything(), anything(), anything())).thenReject(
					new restError.ConnectionError("no connection"),
				)
				await assertThrows(
					restError.ConnectionError,
					async () => await withOverriddenEnv(androidEnv, async () => await (await testableFileController.download(file)).promise),
				)
				verify(fileAppMock.deleteFile(anything()), { times: 0 }) // mock for cleanup
			})
			o("connection lost after 1 already downloaded attachment- already downloaded attachments are processed", async function () {
				const testableFileController = new FileControllerNative(blobFacadeMock, fileAppMock)
				const blobs = [createTestEntity(sysTypeRefs.BlobTypeRef)]
				const fileWorks = createTestEntity(tutanotaTypeRefs.FileTypeRef, {
					blobs: blobs,
					name: "works.txt",
					mimeType: "plain/text",
					_id: ["fileListId", "fileElementId"],
				})
				const fileNotWorks = createTestEntity(tutanotaTypeRefs.FileTypeRef, {
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
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), "works.txt", anything(), anything())).thenResolve(fileReferenceWorks)
				when(blobFacadeMock.downloadAndDecryptNative(anything(), anything(), "broken.txt", anything(), anything())).thenReject(
					new restError.ConnectionError("no connection"),
				)
				await assertThrows(
					restError.ConnectionError,
					async () =>
						await withOverriddenEnv(
							androidEnv,
							async () => await (await testableFileController.downloadAll([fileWorks, fileNotWorks], ArchiveDataType.Attachments)).promise,
						),
				)
				verify(fileAppMock.deleteFile(anything()), { times: 1 }) // mock for cleanup
			})
		})
	})

	o.spec("browser", function () {
		let fileController: FileControllerBrowser

		o.beforeEach(function () {
			fileController = new FileControllerBrowser(blobFacadeMock)
		})

		o("should download non-legacy file non-natively using the blob service", async function () {
			const blobs = [createTestEntity(sysTypeRefs.BlobTypeRef)]
			const file = createTestEntity(tutanotaTypeRefs.FileTypeRef, {
				blobs: blobs,
				name: "test.txt",
				mimeType: "plain/text",
				_id: ["fileListId", "fileElementId"],
			})
			const transferId = "abcd" as TransferId
			const data = new Uint8Array([1, 2, 3])
			when(blobFacadeMock.downloadAndDecrypt(anything(), anything(), transferId)).thenResolve(data)
			const result = await fileController.downloadAndDecrypt(file, transferId, ArchiveDataType.Attachments)
			verify(
				blobFacadeMock.downloadAndDecrypt(
					ArchiveDataType.Attachments,
					argThat((referencingInstance) => referencingInstance.entity === file),
					transferId,
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
