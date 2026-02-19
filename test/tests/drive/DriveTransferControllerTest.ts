import o from "@tutao/otest"
import { DriveTransferController, DriveTransferState, FINISHED_TRANSFER_RETAIN_TIMEOUT_MS } from "../../../src/drive-app/drive/view/DriveTransferController"
import { DriveFacade } from "../../../src/common/api/worker/facades/lazy/DriveFacade"
import { BlobFacade } from "../../../src/common/api/worker/facades/lazy/BlobFacade"
import { FileController } from "../../../src/common/file/FileController"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { matchers, object, when } from "testdouble"
import { createTestEntity, SchedulerMock } from "../TestUtils"
import { verify } from "@tutao/tutanota-test-utils"
import { TransferId } from "../../../src/common/api/common/drive/DriveTypes"
import { DriveFile, DriveFileTypeRef } from "../../../src/common/api/entities/drive/TypeRefs"
import { ArchiveDataType } from "../../../src/common/api/common/TutanotaConstants"
import { CancelledError } from "../../../src/common/api/common/error/CancelledError"
import { ConnectionError } from "../../../src/common/api/common/error/RestError"
import { getElementId } from "../../../src/common/api/common/utils/EntityUtils"

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
			when(driveFacade.generateUploadId()).thenResolve(fileId)
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
			when(driveFacade.generateUploadId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.jpg",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.jpg",
				size: 1024,
			} as File
			const uploadDeferred1 = defer<DriveFile>()
			const uploadDeferred2 = defer<DriveFile>()
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
			uploadDeferred2.resolve(createTestEntity(DriveFileTypeRef))
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
			when(driveFacade.generateUploadId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.jpg",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.jpg",
				size: 1024,
			} as File
			const uploadDeferred1 = defer<DriveFile>()
			const uploadDeferred2 = defer<DriveFile>()
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

			uploadDeferred2.resolve(createTestEntity(DriveFileTypeRef))
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
			when(driveFacade.generateUploadId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<DriveFile>()
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

			deferredUpload1.resolve(createTestEntity(DriveFileTypeRef))
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

			deferredUpload2.resolve(createTestEntity(DriveFileTypeRef))

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
			when(driveFacade.generateUploadId()).thenResolve(fileId1)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)

			await transferController.upload(file1, "filename", ["listId", "elementId"])
			await transferController.cancelTransfer(fileId1)
			verify(driveFacade.cancelCurrentUpload(fileId1))
		})

		o.test("cancel cancels waiting upload", async function () {
			const fileId1 = "fileId1" as TransferId
			const fileId2 = "fileId2" as TransferId
			when(driveFacade.generateUploadId()).thenResolve(fileId1, fileId2)
			const file1 = {
				name: "file1.txt",
				size: 1024,
			} as File
			const file2 = {
				name: "file2.txt",
				size: 1024,
			} as File
			const deferredUpload1 = defer<DriveFile>()
			when(driveFacade.uploadFile(file1, fileId1, matchers.anything(), matchers.anything())).thenReturn(deferredUpload1.promise)
			const deferredUpload2 = defer<DriveFile>()
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
			const file = createTestEntity(DriveFileTypeRef, { _id: ["fileId", "elementId"], name: "downloadFile", size: "1024" })
			await transferController.download(file)
			verify(fileController.open(file, ArchiveDataType.DriveFile))
			const expectedTransferState: DriveTransferState = {
				id: "elementId" as TransferId,
				type: "download",
				filename: "downloadFile",
				state: "finished",
				transferredSize: 0,
				totalSize: 1024,
			}
			o.check(transferController.state).deepEquals([expectedTransferState])
		})
		o.test("when a download is cancelled, it is taken out from the queue and the next download is processed", async function () {
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile)).thenReturn(deferredDownload1.promise)
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile)).thenReturn(deferredDownload2.promise)
			transferController.download(file1)
			transferController.download(file2)
			deferredDownload1.reject(new CancelledError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: "elementId2" as TransferId,
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
					id: "elementId2" as TransferId,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
		})
		o.test("when a download is failed, it is put into failed state and the next download is processed", async function () {
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile)).thenReturn(deferredDownload1.promise)
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile)).thenReturn(deferredDownload2.promise)
			transferController.download(file1)
			transferController.download(file2)
			deferredDownload1.reject(new ConnectionError("download failed"))
			await waitForUiUpdate()
			o.check(transferController.state).deepEquals([
				{
					id: "elementId1" as TransferId,
					type: "download",
					filename: "downloadFile1",
					state: "failed",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: "elementId2" as TransferId,
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
					id: "elementId2" as TransferId,
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
					id: "elementId2" as TransferId,
					type: "download",
					filename: "downloadFile2",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
			])
		})

		o.test("when downloading multiple files, they must be queued after one another", async function () {
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile)).thenReturn(deferredDownload1.promise)
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile)).thenReturn(deferredDownload2.promise)

			transferController.download(file1)
			transferController.download(file2)
			o.check(transferController.state).deepEquals([
				{
					id: "elementId1" as TransferId,
					type: "download",
					filename: "downloadFile1",
					state: "active",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: "elementId2" as TransferId,
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
					id: "elementId1" as TransferId,
					type: "download",
					filename: "downloadFile1",
					state: "finished",
					transferredSize: 0,
					totalSize: 1024,
				},
				{
					id: "elementId2" as TransferId,
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
					id: "elementId2" as TransferId,
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
					id: "elementId2" as TransferId,
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
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile)).thenReturn(deferredDownload1.promise)
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile)).thenReturn(deferredDownload2.promise)

			transferController.download(file1)
			transferController.download(file2)

			await transferController.cancelTransfer(getElementId(file1) as TransferId)
			verify(blobFacade.cancelDownload(getElementId(file1) as TransferId))
		})
		o.test("cancel download cancels waiting download", async function () {
			const file1 = createTestEntity(DriveFileTypeRef, { _id: ["folderId1", "elementId1"], name: "downloadFile1", size: "1024" })
			const file2 = createTestEntity(DriveFileTypeRef, { _id: ["folderId2", "elementId2"], name: "downloadFile2", size: "1024" })
			const deferredDownload1 = defer<void>()
			when(fileController.open(file1, ArchiveDataType.DriveFile)).thenReturn(deferredDownload1.promise)
			const deferredDownload2 = defer<void>()
			when(fileController.open(file2, ArchiveDataType.DriveFile)).thenReturn(deferredDownload2.promise)

			transferController.download(file1)
			transferController.download(file2)

			await transferController.cancelTransfer(getElementId(file2) as TransferId)
			o.check(transferController.state).deepEquals([
				{
					id: "elementId1" as TransferId,
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
