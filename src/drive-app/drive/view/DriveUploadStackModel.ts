import { DriveFacade, UploadGuid } from "../../../common/api/worker/facades/DriveFacade"

export interface DriveUploadState {
	filename: string
	isPaused: boolean
	isFinished: boolean
	uploadedSize: number // bytes
	totalSize: number // bytes
}

type FileId = UploadGuid

type InternalMapState = Record<FileId, DriveUploadState>

export class DriveUploadStackModel {
	state: InternalMapState = {}

	constructor(private readonly driveFacade: DriveFacade) {}

	addUpload(fileId: FileId, filename: string, totalSize: number) {
		this.state[fileId] = {
			filename,
			isPaused: false,
			isFinished: false,
			uploadedSize: 0,
			totalSize,
		}
	}

	async onChunkUploaded(fileId: FileId, uploadedSizeDelta: number): Promise<void> {
		const stateForThisFile = this.state[fileId]
		if (stateForThisFile) {
			stateForThisFile.uploadedSize += uploadedSizeDelta

			if (stateForThisFile.uploadedSize >= stateForThisFile.totalSize) {
				stateForThisFile.isFinished = true
			}
		} else {
			console.debug(`${fileId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	async cancelUpload(fileId: FileId): Promise<void> {
		await this.driveFacade.cancelCurrentUpload(fileId)

		const stateForThisFile = this.state[fileId]

		delete this.state[fileId]
	}
}
