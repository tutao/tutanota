import o, { assertThrows } from "@tutao/otest"
import { Mode } from "../../../src/platform-kit/app-env"
import { BlobFacade } from "../../../src/applications/common/api/worker/facades/lazy/BlobFacade.js"
import { NativeFileApp } from "../../../src/app-kit/native-bridge/common/FileApp.js"
import { matchers, object, verify, when } from "testdouble"
import { FileTypeRef } from "@tutao/entities/tutanota"
import { neverNull } from "../../../src/platform-kit/utils"
import { FileControllerNative } from "../../../src/applications/common/file/FileControllerNative.js"
import { FileControllerBrowser } from "../../../src/applications/common/file/FileControllerBrowser.js"
import * as restError from "../../../src/platform-kit/rest-client/error"
import { createTestEntity, withOverriddenEnv } from "../TestUtils.js"
import { ArchiveDataType } from "../../../src/entities/sys/Utils"
import { TransferId } from "../../../src/entities/drive/Utils"
import { BlobTypeRef } from "@tutao/entities/sys"
import { FileReference } from "../../../src/entities/tutanota/Utils"
import { buildDirectoryStructure } from "../../../src/applications/common/file/FileController"

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
			const blobs = [createTestEntity(BlobTypeRef)]
			const file = createTestEntity(FileTypeRef, {
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
				const blobs = [createTestEntity(BlobTypeRef)]
				const file = createTestEntity(FileTypeRef, {
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
			const blobs = [createTestEntity(BlobTypeRef)]
			const file = createTestEntity(FileTypeRef, {
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

	o.spec("buildDirectoryStructure", function () {
		o.test("it returns one folder for flat structure", function () {
			const file1 = { name: "file1", webkitRelativePath: "A/file1" } as File
			const file2 = { name: "file2", webkitRelativePath: "A/file2" } as File
			const result = buildDirectoryStructure([file1, file2])
			o(result).deepEquals([
				{
					name: "A",
					folders: [],
					files: [
						{ _type: "WebFile", file: file1 },
						{ _type: "WebFile", file: file2 },
					],
				},
			])
		})
		o.test("it returns nested folders for 1 level nested structure", function () {
			const file1 = { name: "file1", webkitRelativePath: "A/file1" } as File
			const file2 = { name: "file2", webkitRelativePath: "A/file2" } as File
			const file3 = { name: "file3", webkitRelativePath: "A/B/file3" } as File
			const result = buildDirectoryStructure([file1, file2, file3])
			o(result).deepEquals([
				{
					name: "A",
					folders: [{ name: "B", folders: [], files: [{ _type: "WebFile", file: file3 }] }],
					files: [
						{ _type: "WebFile", file: file1 },
						{ _type: "WebFile", file: file2 },
					],
				},
			])
		})
		o.test("it returns nested folder for 2 level nested structure", function () {
			const file1 = { name: "file1", webkitRelativePath: "A/file1" } as File
			const file2 = { name: "file2", webkitRelativePath: "A/file2" } as File
			const file3 = { name: "file3", webkitRelativePath: "A/B/file3" } as File
			const file4 = { name: "file4", webkitRelativePath: "A/B/C/file4" } as File
			const result = buildDirectoryStructure([file1, file2, file3, file4])
			o(result).deepEquals([
				{
					name: "A",
					folders: [
						{
							name: "B",
							folders: [
								{
									name: "C",
									folders: [],
									files: [
										{
											_type: "WebFile",
											file: file4,
										},
									],
								},
							],
							files: [{ _type: "WebFile", file: file3 }],
						},
					],
					files: [
						{ _type: "WebFile", file: file1 },
						{ _type: "WebFile", file: file2 },
					],
				},
			])
		})
		o.test("it returns nested folders having a folder with no files in it", function () {
			const file1 = { name: "file1", webkitRelativePath: "A/file1" } as File
			const file2 = { name: "file2", webkitRelativePath: "A/file2" } as File
			const file3 = { name: "file3", webkitRelativePath: "A/B/C/file3" } as File
			const result = buildDirectoryStructure([file1, file2, file3])
			o(result).deepEquals([
				{
					name: "A",
					folders: [
						{
							name: "B",
							folders: [
								{
									name: "C",
									folders: [],
									files: [
										{
											_type: "WebFile",
											file: file3,
										},
									],
								},
							],
							files: [],
						},
					],
					files: [
						{ _type: "WebFile", file: file1 },
						{ _type: "WebFile", file: file2 },
					],
				},
			])
		})
	})
})
