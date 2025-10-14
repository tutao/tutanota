import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"

export interface DriveUploadState {
	filename: string
	isPaused: boolean
	isFinished: boolean
	uploadedSize: number // bytes
	totalSize: number // bytes
}

type FilenameId = string

type InternalMapState = Record<FilenameId, DriveUploadState>

export class DriveUploadStackModel {
	state: InternalMapState = {}

	constructor(private readonly driveFacade: DriveFacade) {}

	addUpload(fileNameId: FilenameId, totalSize: number) {
		this.state[fileNameId] = {
			filename: fileNameId,
			isPaused: false,
			isFinished: false,
			uploadedSize: 0,
			totalSize,
		}
	}

	async onChunkUploaded(fileNameId: FilenameId, uploadedSizeDelta: number): Promise<void> {
		const stateForThisFile = this.state[fileNameId]
		if (stateForThisFile) {
			stateForThisFile.uploadedSize += uploadedSizeDelta

			if (stateForThisFile.uploadedSize >= stateForThisFile.totalSize) {
				console.log("finished uploading")
				stateForThisFile.isFinished = true
			}
		} else {
			console.log(`${fileNameId} is not part of the state. This can be due to an upload being canceled`)
		}
	}

	async cancelUpload(fileNameId: FilenameId): Promise<void> {
		await this.driveFacade.cancelCurrentUpload()

		const stateForThisFile = this.state[fileNameId]

		delete this.state[fileNameId]
	}
}
