import o, { verify } from "@tutao/otest"
import { DriveTransferController, DriveTransferState, FINISHED_TRANSFER_RETAIN_TIMEOUT_MS } from "../../../src/drive-app/drive/view/DriveTransferController"
import { DriveFacade } from "../../../src/common/api/worker/facades/lazy/DriveFacade"
import { BlobFacade } from "../../../src/common/api/worker/facades/lazy/BlobFacade"
import { FileController } from "../../../src/common/file/FileController"
import { defer, DeferredObject } from "@tutao/utils"
import { matchers, object, when } from "testdouble"
import { createTestEntity, SchedulerMock } from "../TestUtils"
import { TransferId } from "../../../src/common/api/common/drive/DriveTypes"
import { driveTypeRefs } from "@tutao/typeRefs"
import { ArchiveDataType } from "@tutao/appEnv"
import { CancelledError } from "../../../src/common/api/common/error/CancelledError"
import { ConnectionError } from "../../../src/common/api/common/error/RestError"

o.spec("DriveTransferController", function () {
	let transferController: DriveTransferController
	let driveFacade: DriveFacade
	let blobFacade: BlobFacade
	let fileController: FileController
	let scheduler: SchedulerMock
	let uiUpdate: DeferredObject<void>

	function waitForUiUpdate() {
		return uiUpdate.promise
	}

	o.beforeEach(async function () {
		driveFacade = object()
		blobFacade = object()
		fileController = object()
		scheduler = new SchedulerMock()

		uiUpdate = defer()
		function updateUi() {
			uiUpdate.resolve()
			uiUpdate = defer()
		}

		transferController = new DriveTransferController(driveFacade, blobFacade, updateUi, fileController, scheduler)
	})
	o.spec("uploads", function () {
		o.test("when uploading a single file, it is uploaded immediately", async function () {
			const fileId = "fileId" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId)
			const file = {
				name: "file.jpg",
				size: 1024,
			} as File
			await transferController.upload(file, "uploadFile", ["listId", "folderElementId"])
			verify(driveFacade.uploadFile(file, fileId, "uploadFile", ["listId", "folderElementId"]))
			o.check(transferController.state).deepEquals([
				{ id: fileId, type: "upload", filename: "uploadFile", state: "finished", transferredSize: 0, totalSize: 1024 },
			])
		})

		o.test("when upload is cancelled it is removed from the queue and the next upload is processed", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.jpg",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.jpg",
				size: 1024,
			} as File
			const uploadDeferred1 = defer<driveTypeRefs.DriveFile>()
			const uploadDeferred2 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, "uploadFile1", ["listId", "elementId"])).thenReturn(uploadDeferred1.promise)
			when(driveFacade.uploadFile(file2, fileId2, "uploadFile2", ["listId", "elementId"])).thenReturn(uploadDeferred2.promise)
			await transferController.upload(file1, "uploadFile1", ["listId", "elementId"])
			await transferController.upload(file2, "uploadFile2", ["listId", "elementId"])
			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalSize: 1024,
					filename: "uploadFile1",
					transferredSize: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
			uploadDeferred1.reject(new CancelledError("upload failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
			uploadDeferred2.resolve(createTestEntity(driveTypeRefs.DriveFileTypeRef))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
		})

		o.test("when upload fails it is put into failed state and the next upload is processed", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.jpg",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.jpg",
				size: 1024,
			} as File
			const uploadDeferred1 = defer<driveTypeRefs.DriveFile>()
			const uploadDeferred2 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, "uploadFile1", ["listId", "elementId"])).thenReturn(uploadDeferred1.promise)
			when(driveFacade.uploadFile(file2, fileId2, "uploadFile2", ["listId", "elementId"])).thenReturn(uploadDeferred2.promise)
			await transferController.upload(file1, "uploadFile1", ["listId", "elementId"])
			await transferController.upload(file2, "uploadFile2", ["listId", "elementId"])
			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalSize: 1024,
					filename: "uploadFile1",
					transferredSize: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
			uploadDeferred1.reject(new ConnectionError("upload failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "failed",
					totalSize: 1024,
					filename: "uploadFile1",
					transferredSize: 0,
				},
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()
			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])

			uploadDeferred2.resolve(createTestEntity(driveTypeRefs.DriveFileTypeRef))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalSize: 1024,
					filename: "uploadFile2",
					transferredSize: 0,
				},
			])
		})

		o.test("when uploading multiple files, they are queued after one another", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file2, fileId2, matchers.anything(), matchers.anything())).thenReturn(deferredUpload2.promise)

			await transferController.upload(file1, "file1.txt", ["listId1", "elementId1"])
			await transferController.upload(file2, "file2.txt", ["listId2", "elementId2"])

			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalSize: file1.size,
					transferredSize: 0,
					filename: "file1.txt",
				},
				{
					id: fileId2,
					type: "upload",
					state: "waiting",
					totalSize: file2.size,
					transferredSize: 0,
					filename: "file2.txt",
				},
			])

			deferredUpload1.resolve(createTestEntity(driveTypeRefs.DriveFileTypeRef))
			await waitForUiUpdate()

			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "finished",
					totalSize: file1.size,
					transferredSize: 0,
					filename: "file1.txt",
				},
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalSize: file2.size,
					transferredSize: 0,
					filename: "file2.txt",
				},
			])

			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()

			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "active",
					totalSize: file2.size,
					transferredSize: 0,
					filename: "file2.txt",
				},
			])

			deferredUpload2.resolve(createTestEntity(driveTypeRefs.DriveFileTypeRef))

			await waitForUiUpdate()

			o.check(transferController.state).deepEquals([
				{
					id: fileId2,
					type: "upload",
					state: "finished",
					totalSize: file2.size,
					transferredSize: 0,
					filename: "file2.txt",
				},
			])

			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()
			o.check(transferController.state).deepEquals([])
		})

		o.test("cancel cancels active upload", async function () {
			const fileId1 = "fileId1" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)

			await transferController.upload(file1, "filename", ["listId", "elementId"])
			await transferController.cancelTransfer(fileId1)
			verify(driveFacade.cancelCurrentUpload(fileId1))
		})

		o.test("cancel cancels waiting upload", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<driveTypeRefs.DriveFile>()
			when(driveFacade.uploadFile(file2, fileId2, matchers.anything(), matchers.anything())).thenReturn(deferredUpload2.promise)

			await transferController.upload(file1, "file1.txt", ["listId1", "elementId1"])
			await transferController.upload(file2, "file2.txt", ["listId2", "elementId2"])

			await transferController.cancelTransfer(fileId2)
			o.check(transferController.state).deepEquals([
				{
					id: fileId1,
					type: "upload",
					state: "active",
					totalSize: file1.size,
					transferredSize: 0,
					filename: "file1.txt",
				},
			])
		})
	})
	o.spec("downloads", function () {
		o.test("when downloading a single file, it is downloaded immediately", async function () {
			const transferId = "abcde" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId)

			const file = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["fileId", "elementId"], name: "downloadFile", size: "1024" })

			const deferredDownload = defer<void>()
			when(fileController.open(file, ArchiveDataType.DriveFile, transferId)).thenResolve({
				promise: deferredDownload.promise,
				transferIds: [transferId],
			})

			await transferController.download(file)
			verify(fileController.open(file, ArchiveDataType.DriveFile, transferId))
			const expectedTransferState: DriveTransferState = {
				id: transferId,
				type: "download",
				filename: "downloadFile",
				state: "finished",
				transferredSize: 0,
				totalSize: 1024,
			}
			deferredDownload.resolve()
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([expectedTransferState])
		})
		o.test("when a download is cancelled, it is taken out from the queue and the next download is processed", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
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
			await transferController.download(file1)
			await transferController.download(file2)
			deferredDownload1.reject(new CancelledError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
		})
		o.test("when a download is failed, it is put into failed state and the next download is processed", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
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
			await transferController.download(file1)
			await transferController.download(file2)
			deferredDownload1.reject(new ConnectionError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "failed",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()

			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
		})

		o.test("when downloading multiple files, they must be queued after one another", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)
			const file1 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
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

			await transferController.download(file1)
			await transferController.download(file2)
			o.check(transferController.state).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "waiting",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			deferredDownload1.resolve()
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()
			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			deferredDownload2.resolve()
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: transferId2,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
			scheduler.getThunkAfter(FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)()
			o.check(transferController.state).deepEquals([])
		})
		o.test("cancel download cancels active download", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
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

			await transferController.download(file1)
			await transferController.download(file2)

			await transferController.cancelTransfer(transferId1)
			verify(blobFacade.cancelDownload(transferId1))
		})
		o.test("cancel download cancels waiting download", async function () {
			const transferId1 = "transfer id 1" as TransferId
			const transferId2 = "transfer id 2" as TransferId
			when(blobFacade.generateTransferId()).thenResolve(transferId1, transferId2)

			const file1 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(driveTypeRefs.DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
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

			await transferController.download(file1)
			await transferController.download(file2)

			await transferController.cancelTransfer(transferId2)
			o.check(transferController.state).deepEquals([
				{
					id: transferId1,
					type: "download",
					filename: "downloadFile1",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
		})
	})
})
