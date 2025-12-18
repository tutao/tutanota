import { DriveFacade, UploadGuid } from "../../../common/api/worker/facades/DriveFacade"

export interface DriveUploadState {
	filename: string
	isPaused: boolean
	isFinished: boolean
	uploadedSize: number // bytes
	totalSize: number // bytes
}

type FileId = UploadGuid

export class DriveUploadStackModel {
	private _state: Map<FileId, DriveUploadState> = new Map()

	get state(): ReadonlyMap<FileId, DriveUploadState> {
		return this._state
	}

	constructor(
		private readonly driveFacade: DriveFacade,
		private readonly updateUi: () => unknown,
	) {}

	addUpload(fileId: FileId, filename: string, totalSize: number) {
		this._state.set(fileId, {
			filename,
			isPaused: false,
			isFinished: false,
			uploadedSize: 0,
			totalSize,
		})
	}

	async onChunkUploaded(fileId: FileId, uploadedSizeDelta: number): Promise<void> {
		const stateForThisFile = this._state.get(fileId)
		if (stateForThisFile) {
			stateForThisFile.uploadedSize += uploadedSizeDelta

			if (stateForThisFile.uploadedSize >= stateForThisFile.totalSize) {
				stateForThisFile.isFinished = true
				setTimeout(() => {
					this._state.delete(fileId)
					this.updateUi()
				}, 2000)
			}
		} else {
			console.debug(`${fileId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	async cancelUpload(fileId: FileId): Promise<void> {
		await this.driveFacade.cancelCurrentUpload(fileId)
		this._state.delete(fileId)
	}

	uploadStateFor(fileId: FileId): DriveUploadState | null {
		return this._state.get(fileId) ?? null
	}
}
