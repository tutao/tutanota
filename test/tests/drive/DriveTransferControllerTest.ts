import o, { verify } from "@tutao/otest"
import { DriveTransferController, DriveTransferState } from "../../../src/applications/drive-app/drive/view/DriveTransferController"
import { DriveFacade } from "../../../src/applications/common/api/worker/facades/lazy/DriveFacade"
import { BlobFacade } from "../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { FileController } from "../../../src/applications/common/file/FileController"
import { defer, DeferredObject } from "../../../src/platform-kit/utils"
import { matchers, object, when } from "testdouble"
import { createTestEntity } from "../TestUtils"
import { CancelledError } from "../../../src/platform-kit/app-env"
import * as restError from "../../../src/platform-kit/rest-client/error"
import { WebFile } from "../../../src/entities/tutanota/Utils"
import { TransferId } from "../../../src/entities/drive/Utils"
import { DriveFile, DriveFileTypeRef } from "@tutao/entities/drive"
import { ArchiveDataType } from "../../../src/entities/sys/Utils"

o.spec("DriveTransferController", function () {
	let transferController: DriveTransferController
	let driveFacade: DriveFacade
	let blobFacade: BlobFacade
	let fileController: FileController
	let uiUpdate: DeferredObject<void>

	function waitForUiUpdate() {
		return uiUpdate.promise
	}

	o.beforeEach(async function () {
		driveFacade = object()
		blobFacade = object()
		fileController = object()

		uiUpdate = defer()
		function updateUi() {
			uiUpdate.resolve()
			uiUpdate = defer()
		}

		transferController = new DriveTransferController(driveFacade, blobFacade, updateUi, fileController)
	})
	o.spec("uploads", function () {
		o.test("when uploading a single file, it is uploaded immediately", async function () {
			const fileId = "fileId" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId)
			const file = {
				_type: "WebFile",
				file: {
					name: "file.jpg",
					size: 1024,
				},
			} as WebFile
			await transferController.upload(file, "uploadFile", ["listId", "folderElementId"])
			verify(driveFacade.uploadFile(file, fileId, "uploadFile", ["listId", "folderElementId"]))
			o.check(transferController.state.allTransfers).deepEquals([
				{ id: fileId, type: "upload", filename: "uploadFile", state: "finished", transferredBytes: 0, totalBytes: 1024, timeRemainingSec: 0 },
			])
		})

		o.test("when upload is cancelled it is removed from the queue and the next upload is processed", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				_type: "WebFile",
				file: {
					name: "file1.jpg",
					size: 1024,
				},
			} as WebFile

			const file2 = {
				_type: "WebFile",
				file: {
					name: "file2.jpg",
					size: 1024,
				},
			} as WebFile

			const uploadDeferred1 = defer<DriveFile>()
			const uploadDeferred2 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, "uploadFile1", ["listId", "elementId"])).thenReturn(uploadDeferred1.promise)
			when(driveFacade.uploadFile(file2, fileId2, "uploadFile2", ["listId", "elementId"])).thenReturn(uploadDeferred2.promise)
			await transferController.upload(file1, "uploadFile1", ["listId", "elementId"])
			await transferController.upload(file2, "uploadFile2", ["listId", "elementId"])
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalBytes: 1024,
					filename: "uploadFile1",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])
			uploadDeferred1.reject(new CancelledError("upload failed"))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])
			uploadDeferred2.resolve(createTestEntity(DriveFileTypeRef))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])
		})

		o.test("when upload fails it is put into failed state and the next upload is processed", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				_type: "WebFile",
				file: {
					name: "file1.jpg",
					size: 1024,
				},
			} as WebFile
			const file2 = {
				_type: "WebFile",
				file: {
					name: "file2.jpg",
					size: 1024,
				},
			} as WebFile
			const uploadDeferred1 = defer<DriveFile>()
			const uploadDeferred2 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, "uploadFile1", ["listId", "elementId"])).thenReturn(uploadDeferred1.promise)
			when(driveFacade.uploadFile(file2, fileId2, "uploadFile2", ["listId", "elementId"])).thenReturn(uploadDeferred2.promise)
			await transferController.upload(file1, "uploadFile1", ["listId", "elementId"])
			await transferController.upload(file2, "uploadFile2", ["listId", "elementId"])
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalBytes: 1024,
					filename: "uploadFile1",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])
			uploadDeferred1.reject(new restError.ConnectionError("upload failed"))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "failed",
					totalBytes: 1024,
					filename: "uploadFile1",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])

			uploadDeferred2.resolve(createTestEntity(DriveFileTypeRef))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "failed",
					totalBytes: 1024,
					filename: "uploadFile1",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalBytes: 1024,
					filename: "uploadFile2",
					transferredBytes: 0,
					timeRemainingSec: 0,
				},
			])
		})

		o.test("when uploading multiple files, they are queued after one another", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				_type: "WebFile",
				file: {
					name: "file1.txt",
					size: 1024,
				},
			} as WebFile
			const file2 = {
				_type: "WebFile",
				file: {
					name: "file2.txt",
					size: 1024,
				},
			} as WebFile
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<DriveFile>()
			when(driveFacade.uploadFile(file2, fileId2, matchers.anything(), matchers.anything())).thenReturn(deferredUpload2.promise)

			await transferController.upload(file1, "file1.txt", ["listId1", "elementId1"])
			await transferController.upload(file2, "file2.txt", ["listId2", "elementId2"])

			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalBytes: file1.file.size,
					transferredBytes: 0,
					timeRemainingSec: 0,
					filename: "file1.txt",
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalBytes: file2.file.size,
					transferredBytes: 0,
					filename: "file2.txt",
					timeRemainingSec: 0,
				},
			])

			deferredUpload1.resolve(createTestEntity(DriveFileTypeRef))
			await waitForUiUpdate()

			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "finished",
					totalBytes: file1.file.size,
					transferredBytes: 0,
					filename: "file1.txt",
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalBytes: file2.file.size,
					transferredBytes: 0,
					filename: "file2.txt",
					timeRemainingSec: 0,
				},
			])

			deferredUpload2.resolve(createTestEntity(DriveFileTypeRef))

			await waitForUiUpdate()

			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "finished",
					totalBytes: file1.file.size,
					transferredBytes: 0,
					filename: "file1.txt",
					timeRemainingSec: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalBytes: file2.file.size,
					transferredBytes: 0,
					filename: "file2.txt",
					timeRemainingSec: 0,
				},
			])
		})

		o.test("cancel cancels active upload", async function () {
			const fileId1 = "fileId1" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1)
			const file1 = {
				_type: "WebFile",
				file: {
					name: "file1.jpg",
					size: 1024,
				},
			} as WebFile
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)

			await transferController.upload(file1, "filename", ["listId", "elementId"])
			await transferController.cancelTransfer(fileId1)
			verify(blobFacade.abortUpload(fileId1))
		})

		o.test("cancel cancels waiting upload", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				_type: "WebFile",
				file: {
					name: "file1.txt",
					size: 1024,
				},
			} as WebFile
			const file2 = {
				_type: "WebFile",
				file: {
					name: "file2.txt",
					size: 1024,
				},
			} as WebFile
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<DriveFile>()
			when(driveFacade.uploadFile(file2, fileId2, matchers.anything(), matchers.anything())).thenReturn(deferredUpload2.promise)

			await transferController.upload(file1, "file1.txt", ["listId1", "elementId1"])
			await transferController.upload(file2, "file2.txt", ["listId2", "elementId2"])

			await transferController.cancelTransfer(fileId2)
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalBytes: file1.file.size,
					transferredBytes: 0,
					filename: "file1.txt",
					timeRemainingSec: 0,
				},
			])
		})
	})
	o.spec("downloads", function () {
		o.test("when downloading a single file, it is downloaded immediately", async function () {
			const transferId = "abcde" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId)

			const file = createTestEntity(DriveFileTypeRef, { _id: ["fileId", "elementId"], name: "downloadFile", size: "1024" })

			const deferredDownload = defer<void>()
			when(fileController.open(file, ArchiveDataType.DriveFile, transferId)).thenResolve({
				promise: deferredDownload.promise,
				transferIds: [transferId],
			})

			await transferController.download(file, "open")
			verify(fileController.open(file, ArchiveDataType.DriveFile, transferId))
			const expectedTransferState: DriveTransferState = {
				id: transferId,
				type: "download",
				filename: "downloadFile",
				state: "finished",
				transferredBytes: 0,
				totalBytes: 1024,
				timeRemainingSec: 0,
			}
			deferredDownload.resolve()
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([expectedTransferState])
		})
		o.test("when a download is cancelled, it is taken out from the queue and the next download is processed", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile, transferId1)).thenResolve({
				promise: deferredDownload1.promise,
				transferIds: [transferId1],
			})
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile, transferId2)).thenResolve({
				promise: deferredDownload2.promise,
				transferIds: [transferId2],
			})
			await transferController.download(file1, "open")
			await transferController.download(file2, "open")
			deferredDownload1.reject(new CancelledError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
		})
		o.test("when a download is failed, it is put into failed state and the next download is processed", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile, transferId1)).thenResolve({
				promise: deferredDownload1.promise,
				transferIds: [transferId1],
			})
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile, transferId2)).thenResolve({
				promise: deferredDownload2.promise,
				transferIds: [transferId2],
			})
			await transferController.download(file1, "open")
			await transferController.download(file2, "open")
			deferredDownload1.reject(new restError.ConnectionError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "failed",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])

			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "failed",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
		})

		o.test("when downloading multiple files, they must be queued after one another", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile, transferId1)).thenResolve({
				promise: deferredDownload1.promise,
				transferIds: [transferId1],
			})
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile, transferId2)).thenResolve({
				promise: deferredDownload2.promise,
				transferIds: [transferId2],
			})

			await transferController.download(file1, "open")
			await transferController.download(file2, "open")
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "active",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "waiting",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
			deferredDownload1.resolve()
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "finished",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])

			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "finished",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
		})
		o.test("cancel download cancels active download", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile, transferId1)).thenResolve({
				promise: deferredDownload1.promise,
				transferIds: [transferId1],
			})
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile, transferId2)).thenResolve({
				promise: deferredDownload2.promise,
				transferIds: [transferId2],
			})

			await transferController.download(file1, "open")
			await transferController.download(file2, "open")

			await transferController.cancelTransfer(transferId1)
			verify(blobFacade.abortDownload(transferId1))
		})
		o.test("cancel download cancels waiting download", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile, transferId1)).thenResolve({
				promise: deferredDownload1.promise,
				transferIds: [transferId1],
			})
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile, transferId2)).thenResolve({
				promise: deferredDownload2.promise,
				transferIds: [transferId2],
			})

			await transferController.download(file1, "open")
			await transferController.download(file2, "open")

			await transferController.cancelTransfer(transferId2)
			o.check(transferController.state.allTransfers).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "active",
					transferredBytes: 0,
					totalBytes: 1024,
					timeRemainingSec: 0,
				},
			])
		})
	})
})
