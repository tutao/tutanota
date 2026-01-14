import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { TransferId } from "../../../common/api/common/drive/DriveTypes"

type DriveTransferType = "upload" | "download"

export interface DriveTransferState {
	type: DriveTransferType
	filename: string
	isPaused: boolean
	isFinished: boolean
	transferredSize: number // bytes
	totalSize: number // bytes
}

type FileId = TransferId

export class DriveUploadStackModel {
	private _state: Map<FileId, DriveTransferState> = new Map()

	get state(): ReadonlyMap<FileId, DriveTransferState> {
		return this._state
	}

	constructor(
		private readonly driveFacade: DriveFacade,
		private readonly updateUi: () => unknown,
	) {}

	addUpload(fileId: FileId, filename: string, totalSize: number) {
		this._state.set(fileId, {
			type: "upload",
			filename,
			isPaused: false,
			isFinished: false,
			transferredSize: 0,
			totalSize,
		})
	}

	async onChunkUploaded(fileId: FileId, uploadedSizeDelta: number): Promise<void> {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.transferredSize += uploadedSizeDelta
		} else {
			console.debug(`${fileId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	async cancelUpload(fileId: FileId): Promise<void> {
		await this.driveFacade.cancelCurrentUpload(fileId)
		this._state.delete(fileId)
	}

	finishUpload(fileId: FileId) {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.isFinished = true
			setTimeout(() => {
				this._state.delete(fileId)
				this.updateUi()
			}, 2000)
		}
	}

	uploadStateFor(fileId: FileId): DriveTransferState | null {
		return this._state.get(fileId) ?? null
	}

	addDownload(fileId: TransferId, filename: string, totalSize: number) {
		this._state.set(fileId, {
			type: "download",
			filename,
			isFinished: false,
			transferredSize: 0,
			isPaused: false,
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
			stateForThisFile.isFinished = true
			setTimeout(() => {
				this._state.delete(fileId)
				this.updateUi()
			}, 2000)
		}
	}
}
