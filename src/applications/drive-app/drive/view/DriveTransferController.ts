import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { assertNotNull, filterInt } from "@tutao/utils"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"
import { CancelledError } from "@tutao/app-env"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { FileController } from "../../../common/file/FileController"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"
import { isOfflineError } from "@tutao/rest-client/error"
import { DriveFile } from "@tutao/entities/drive"
import { TransferId } from "../../../../entities/drive/Utils"
import { ArchiveDataType } from "../../../../entities/sys/Utils"
import { FileTooLargeError } from "../../../common/api/common/error/FileTooLargeError"
import { UserError } from "../../../common/api/main/UserError"

export type DriveTransferType = "upload" | "download"

export interface DriveTransferState {
	id: TransferId
	type: DriveTransferType
	filename: string
	state: "finished" | "failed" | "active" | "waiting"
	transferredBytes: number
	totalBytes: number
	timeRemainingSec: number | undefined
}

type QueuedTransfer =
	| {
			id: TransferId
			state: "waiting" | "active" | "finished" | "failed"
			file: DriveFile
			type: "download"
			transferredBytes: number
			startTime: Date | null
			lastChunkUpdateTime: Date | null
			filename: string
			intent: "download" | "open"
	  }
	| {
			id: TransferId
			state: "waiting" | "active" | "finished" | "failed"
			file: WebFile | FileReference
			type: "upload"
			transferredBytes: number
			startTime: Date | null
			lastChunkUpdateTime: Date | null
			filename: string
			targetFolderId: IdTuple
	  }

export interface DriveTransfers {
	/** All the transfers: current batch and the ones from finished batches */
	allTransfers: readonly DriveTransferState[]
	/**
	 * Transfers from the current batch. Newly queued transfers are going here. Some of them can be finished.
	 * Current transfer batch is emptied once all the transfers in it finish or fail.
	 */
	currentTransfers: readonly DriveTransferState[]
	timeRemainingSec: number | null
}

type FileId = TransferId

export class DriveTransferController {
	private queue: QueuedTransfer[] = []
	private finishedTransfers: DriveTransferState[] = []
	get state(): DriveTransfers {
		const currentTransfers = this.queue.map(queuedTransferToState)
		const allTransfers = [...this.finishedTransfers, ...currentTransfers]
		const timeRemaining = this.remainingTime()

		return { allTransfers, currentTransfers, timeRemainingSec: timeRemaining }
	}

	private remainingTime(): number | null {
		let numberOfActiveTransfers: number = 0
		let totalTransferSpeed: number = 0
		for (const queuedTransfer of this.queue) {
			if (queuedTransfer.state === "active") {
				numberOfActiveTransfers++
			}
			const avgSpeed = averageTransferSpeed(queuedTransfer)
			if (avgSpeed) {
				totalTransferSpeed += avgSpeed
			}
		}
		if (numberOfActiveTransfers === 0) {
			return null
		}
		const speed = totalTransferSpeed / numberOfActiveTransfers
		const currentBatchTotalSize = this.queue.reduce((acc, curr) => BigInt(transferSize(curr)) + acc, 0n)
		const currentBatchTransferredSize = this.queue.reduce((acc, curr) => BigInt(curr.transferredBytes) + acc, 0n)

		return speed !== 0 ? Number((currentBatchTotalSize - currentBatchTransferredSize) / BigInt(Math.round(speed))) : null
	}

	constructor(
		private readonly driveFacade: DriveFacade,
		private readonly blobFacade: BlobFacade,
		private readonly updateUi: () => unknown,
		private readonly fileController: FileController,
	) {}

	async upload(file: WebFile | FileReference, filename: string, targetFolderId: IdTuple) {
		const transferId = await this.blobFacade.generateTransferId()
		this.queue.push({
			id: transferId,
			state: "waiting",
			file,
			filename,
			type: "upload",
			transferredBytes: 0,
			startTime: null,
			lastChunkUpdateTime: null,
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
					if (e instanceof FileTooLargeError) {
						handleUncaughtError(new UserError("nativeFileUploadTooLarge_msg"))
					} else if (!isOfflineError(e)) {
						handleUncaughtError(e)
					}
				}
			} finally {
				this.drainQueue("upload")
			}
		} else {
			const { id, file, intent } = transfer
			this.startDownload(transfer.id)
			try {
				if (intent === "open") {
					await (
						await this.fileController.open(file, ArchiveDataType.DriveFile, transfer.id)
					).promise
				} else {
					await (
						await this.fileController.download(file, ArchiveDataType.DriveFile, transfer.id)
					).promise
				}
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
		transfer.startTime = new Date()
		this.updateUi()
	}

	async onChunkUploaded(transferId: FileId, uploadedBytesSoFar: number): Promise<void> {
		const stateForThisFile = this.transferForId(transferId)
		if (stateForThisFile) {
			stateForThisFile.transferredBytes = uploadedBytesSoFar
			stateForThisFile.lastChunkUpdateTime = new Date()
		} else {
			console.debug(`${transferId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	private transferForId(fileId: TransferId) {
		return this.queue.find((item) => item.id === fileId)
	}

	async cancelTransfer(transferId: TransferId): Promise<void> {
		const state = this.transferForId(transferId)
		if (state?.state === "active") {
			if (state.type === "upload") {
				await this.blobFacade.abortUpload(transferId)
			} else if (state.type === "download") {
				await this.blobFacade.abortDownload(transferId)
			}
		} else if (state?.state === "waiting") {
			this.removeTransfer(transferId)
		}
	}

	async flush() {
		const activeTransfers = this.queue.filter((transfer) => transfer.state === "active" || transfer.state === "waiting")
		this.queue.splice(0, this.queue.length, ...activeTransfers)
		this.finishedTransfers.splice(0)
	}

	private finishUpload(fileId: FileId) {
		this.finalizeTransfer(fileId, "finished")
	}

	private transferFailed(fileId: FileId) {
		this.finalizeTransfer(fileId, "failed")
	}

	async download(file: DriveFile, intent: "download" | "open") {
		const transferId = await this.blobFacade.generateTransferId()
		this.queue.push({
			id: transferId,
			state: "waiting",
			file: file,
			type: "download",
			transferredBytes: 0,
			startTime: null,
			lastChunkUpdateTime: null,
			filename: file.name,
			intent: intent,
		})
		this.drainQueue("download")
	}

	private startDownload(fileId: TransferId) {
		const stateForThisFile = this.transferForId(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "active"
			stateForThisFile.startTime = new Date()
			this.updateUi()
		}
	}

	async onChunkDownloaded(transferId: TransferId, completedBytes: number): Promise<void> {
		const fileState = this.transferForId(transferId)
		if (fileState != null) {
			fileState.transferredBytes = completedBytes
			fileState.lastChunkUpdateTime = new Date()
			this.updateUi()
		}
	}

	private finishDownload(transferId: TransferId) {
		this.finalizeTransfer(transferId, "finished")
	}

	private removeTransfer(fileId: TransferId) {
		const index = this.queue.findIndex((item) => item.id === fileId)
		if (index !== -1) {
			this.queue.splice(index, 1)
		}
		this.updateUi()
	}

	private finalizeTransfer(transferId: TransferId, newState: "finished" | "failed") {
		const stateForThisFile = this.transferForId(transferId)
		if (stateForThisFile) {
			stateForThisFile.state = newState
			// once all transfers are done move them to the finished, which are not used for progress
			const allTransfersDone: boolean = this.queue.every((transfer) => transfer.state === "finished" || transfer.state === "failed")
			if (allTransfersDone) {
				this.finishedTransfers.push(...this.queue.splice(0).map(queuedTransferToState))
			}
			this.updateUi()
		}
	}
}

function transferSize(transfer: QueuedTransfer): number {
	if (transfer.file._type === "WebFile") {
		return transfer.file.file.size
	} else if (transfer.file._type === "FileReference") {
		return transfer.file.size
	} else {
		let file: DriveFile = transfer.file // assert that this is a DriveFile
		return filterInt(file.size)
	}
}

function queuedTransferToState(transfer: QueuedTransfer): DriveTransferState {
	return {
		id: transfer.id,
		state: transfer.state,
		type: transfer.type,
		filename: transfer.filename,
		totalBytes: transferSize(transfer),
		transferredBytes: transfer.transferredBytes,
		timeRemainingSec: calculateRemainingTimeSec(transfer),
	}
}

function averageTransferSpeed(queuedTransfer: QueuedTransfer): number | undefined {
	if (queuedTransfer.lastChunkUpdateTime == null) {
		return undefined
	} else {
		return (
			queuedTransfer.transferredBytes /
			((assertNotNull(queuedTransfer.lastChunkUpdateTime).getTime() - assertNotNull(queuedTransfer.startTime).getTime()) / 1000)
		)
	}
}

function calculateRemainingTimeSec(queuedTransfer: QueuedTransfer): number | undefined {
	const speed = averageTransferSpeed(queuedTransfer)

	return speed ? (transferSize(queuedTransfer) - queuedTransfer.transferredBytes) / speed : undefined
}
