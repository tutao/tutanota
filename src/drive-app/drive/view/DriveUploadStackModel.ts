import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"
import { SECOND_IN_MILLIS } from "@tutao/tutanota-utils"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"

type DriveTransferType = "upload" | "download"

export interface DriveTransferState {
	type: DriveTransferType
	filename: string
	state: "finished" | "failed" | "active" | "waiting"
	transferredSize: number // bytes
	totalSize: number // bytes
}

type FileId = TransferId

const FINISHED_TRANSFER_RETAIN_TIMEOUT_MS = 4 * SECOND_IN_MILLIS

export class DriveUploadStackModel {
	private _state: Map<FileId, DriveTransferState> = new Map()

	get state(): ReadonlyMap<FileId, DriveTransferState> {
		return this._state
	}

	constructor(
		private readonly driveFacade: DriveFacade,
		private readonly blobFacade: BlobFacade,
		private readonly updateUi: () => unknown,
	) {}

	addUpload(fileId: FileId, filename: string, totalSize: number) {
		this._state.set(fileId, {
			type: "upload",
			filename,
			state: "waiting",
			transferredSize: 0,
			totalSize,
		})
	}

	startUpload(fileId: FileId) {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "active"
		}
	}

	async onChunkUploaded(fileId: FileId, uploadedBytesSoFar: number): Promise<void> {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.transferredSize = uploadedBytesSoFar
		} else {
			console.debug(`${fileId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	async cancelTransfer(fileId: FileId): Promise<void> {
		const state = this._state.get(fileId)
		if (state?.type === "upload") {
			await this.driveFacade.cancelCurrentUpload(fileId)
		} else if (state?.type === "download") {
			await this.blobFacade.cancelDownload(fileId)
		}

		this._state.delete(fileId)
		this.updateUi()
	}

	finishUpload(fileId: FileId) {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "finished"
			this.updateUi()
			this.cleanupTransfer(fileId)
		}
	}

	transferFailed(fileId: FileId) {
		const fileState = this._state.get(fileId)
		if (fileState) {
			fileState.state = "failed"
			this.updateUi()
			this.cleanupTransfer(fileId)
		}
	}

	uploadStateFor(fileId: FileId): DriveTransferState | null {
		return this._state.get(fileId) ?? null
	}

	addDownload(fileId: TransferId, filename: string, totalSize: number) {
		this._state.set(fileId, {
			type: "download",
			filename,
			state: "active",
			transferredSize: 0,
			totalSize,
		})
	}

	async onChunkDownloaded(fileId: TransferId, completedBytes: number): Promise<void> {
		const fileState = this._state.get(fileId)
		if (fileState != null) {
			fileState.transferredSize = completedBytes
		}
	}

	finishDownload(fileId: FileId) {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.state = "finished"
			this.updateUi()
			this.cleanupTransfer(fileId)
		}
	}

	private cleanupTransfer(fileId: FileId) {
		setTimeout(() => {
			this._state.delete(fileId)
			this.updateUi()
		}, FINISHED_TRANSFER_RETAIN_TIMEOUT_MS)
	}
}
