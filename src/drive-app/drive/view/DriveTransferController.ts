import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"
import { filterInt, SECOND_IN_MILLIS } from "@tutao/tutanota-utils"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"
import { CancelledError } from "../../../common/api/common/error/CancelledError"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { DriveFile } from "../../../common/api/entities/drive/TypeRefs"
import { ArchiveDataType } from "../../../common/api/common/TutanotaConstants"
import { FileController } from "../../../common/file/FileController"
import { Scheduler } from "../../../common/api/common/utils/Scheduler"

type DriveTransferType = "upload" | "download"

export interface DriveTransferState {
	id: TransferId
	type: DriveTransferType
	filename: string
	state: "finished" | "failed" | "active" | "waiting"
	transferredSize: number // bytes
	totalSize: number // bytes
}

type QueuedTransfer =
	| {
			id: TransferId
			state: "waiting" | "active" | "finished" | "failed"
			file: DriveFile
			type: "download"
			transferredSize: number // bytes
			filename: string
	  }
	| {
			id: TransferId
			state: "waiting" | "active" | "finished" | "failed"
			file: File
			type: "upload"
			transferredSize: number // bytes
			filename: string
			targetFolderId: IdTuple
	  }

type FileId = TransferId

/** @private visibleForTesting */
export const FINISHED_TRANSFER_RETAIN_TIMEOUT_MS = 4 * SECOND_IN_MILLIS

export class DriveTransferController {
	private queue: QueuedTransfer[] = []

	get state(): DriveTransferState[] {
		return this.queue.map((transfer) => {
			return {
				id: transfer.id,
				state: transfer.state,
				type: transfer.type,
				filename: transfer.filename,
				totalSize: typeof transfer.file.size === "string" ? filterInt(transfer.file.size) : transfer.file.size,
				transferredSize: transfer.transferredSize,
			}
		})
	}
	constructor(
		private readonly driveFacade: DriveFacade,
		private readonly blobFacade: BlobFacade,
		private readonly updateUi: () => unknown,
		private readonly fileController: FileController,
		private readonly scheduler: Scheduler,
	) {}

	async upload(file: File, filename: string, targetFolderId: IdTuple) {
		const transferId = await this.driveFacade.generateUploadId()
		this.queue.push({
			id: transferId,
			state: "waiting",
			file,
			filename,
			type: "upload",
			transferredSize: 0,
			targetFolderId,
		})
		this.drainQueue("upload")
	}

	private drainQueue(transferType: "upload" | "download") {
		if (this.queue.some((item) => item.type === transferType && item.state === "active")) {
			// if there's already an active operation we don't do anything
			return
		}
		const waitingItem = this.queue.find((item) => item.type === transferType && item.state === "waiting")
		if (waitingItem == null) {
			// if there isn't a waiting item we don't do anything
			return
		}
		this.doQueueOperation(waitingItem)
	}

	private async doQueueOperation(transfer: QueuedTransfer) {
		if (transfer.type === "upload") {
			const { id, file, filename, targetFolderId } = transfer
			this.startUpload(transfer)
			try {
				await this.driveFacade.uploadFile(file, id, filename, targetFolderId)
				this.finishUpload(id)
			} catch (e) {
				if (e instanceof CancelledError) {
					this.removeTransfer(transfer.id)
				} else {
					this.transferFailed(id)
					if (!isOfflineError(e)) {
						handleUncaughtError(e)
					}
				}
			} finally {
				this.drainQueue("upload")
			}
		} else {
			const { id, file } = transfer
			this.startDownload(transfer.id)
			try {
				await this.fileController.open(file, ArchiveDataType.DriveFile)
				this.finishDownload(transfer.id)
			} catch (e) {
				if (e instanceof CancelledError) {
					this.removeTransfer(transfer.id)
				} else {
					this.transferFailed(id)
					if (!isOfflineError(e)) {
						handleUncaughtError(e)
					}
				}
			} finally {
				this.drainQueue("download")
			}
		}
	}

	private startUpload(transfer: QueuedTransfer) {
		transfer.state = "active"
		this.updateUi()
	}

	async onChunkUploaded(fileId: FileId, uploadedBytesSoFar: number): Promise<void> {
		const stateForThisFile = this.transferForId(fileId)
		if (stateForThisFile) {
			stateForThisFile.transferredSize = uploadedBytesSoFar
		} else {
			console.debug(`${fileId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	private transferForId(fileId: TransferId) {
		return this.queue.find((item) => item.id === fileId)
	}

	async cancelTransfer(fileId: FileId): Promise<void> {
		const state = this.transferForId(fileId)
		if (state?.state === "active") {
			if (state.type === "upload") {
				await this.driveFacade.cancelCurrentUpload(fileId)
			} else if (state.type === "download") {
				await this.blobFacade.cancelDownload(fileId)
			}
		} else if (state?.state === "waiting") {
			this.removeTransfer(fileId)
		}
	}

	private finishUpload(fileId: FileId) {
		const stateForThisFile = this.transferForId(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "finished"
			this.updateUi()
			this.cleanupTransfer(fileId)
		}
	}

	private transferFailed(fileId: FileId) {
		const fileState = this.transferForId(fileId)
		if (fileState) {
			fileState.state = "failed"
			this.updateUi()
			this.cleanupTransfer(fileId)
		}
	}

	download(file: DriveFile) {
		const transferId = getElementId(file) as TransferId
		this.queue.push({
			id: transferId,
			state: "waiting",
			file: file,
			type: "download",
			transferredSize: 0,
			filename: file.name,
		})
		this.drainQueue("download")
	}

	private startDownload(fileId: TransferId) {
		const stateForThisFile = this.transferForId(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "active"
			this.updateUi()
		}
	}

	async onChunkDownloaded(fileId: TransferId, completedBytes: number): Promise<void> {
		const fileState = this.transferForId(fileId)
		if (fileState != null) {
			fileState.transferredSize = completedBytes
			this.updateUi()
		}
	}

	private finishDownload(transferId: TransferId) {
		const stateForThisFile = this.transferForId(transferId)
		if (stateForThisFile) {
			stateForThisFile.state = "finished"
			this.updateUi()
			this.cleanupTransfer(transferId)
		}
	}

	private cleanupTransfer(transferId: TransferId) {
		this.scheduler.scheduleAfter(() => this.removeTransfer(transferId), FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)
	}
	private removeTransfer(fileId: TransferId) {
		const index = this.queue.findIndex((item) => item.id === fileId)
		if (index !== -1) {
			this.queue.splice(index, 1)
		}
		this.updateUi()
	}
}
