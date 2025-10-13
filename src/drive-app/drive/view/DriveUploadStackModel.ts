type FileUploadCallback = () => void

export interface DriveUploadState {
	filename: string
	isPaused: boolean
	isFinished: boolean
	uploadedSize: number // bytes
	totalSize: number // bytes
	onPause: FileUploadCallback
	onResume: FileUploadCallback
	onCancel: FileUploadCallback
}

type FilenameId = string

type InternalMapState = Record<FilenameId, DriveUploadState>

export class DriveUploadStackModel {
	state: InternalMapState = {}

	addUpload(fileNameId: FilenameId, totalSize: number, onPause: FileUploadCallback, onResume: FileUploadCallback, onCancel: FileUploadCallback) {
		this.state[fileNameId] = {
			filename: fileNameId,
			isPaused: false,
			isFinished: false,
			uploadedSize: 0,
			totalSize,
			onPause,
			onResume,
			onCancel,
		}
	}

	async onChunkUploaded(fileNameId: FilenameId, uploadedSizeDelta: number): Promise<void> {
		const stateForThisFile = this.state[fileNameId]
		stateForThisFile.uploadedSize += uploadedSizeDelta

		if (stateForThisFile.uploadedSize >= stateForThisFile.totalSize) {
			console.log("finished uploading")
			stateForThisFile.isFinished = true
		}
	}

	async pauseUpload(fileNameId: FilenameId): Promise<void> {
		const stateForThisFile = this.state[fileNameId]
		stateForThisFile.isPaused = true
		stateForThisFile.onPause()
	}

	async resumeUpload(fileNameId: FilenameId): Promise<void> {
		const stateForThisFile = this.state[fileNameId]
		stateForThisFile.isPaused = false
		stateForThisFile.onResume()
	}

	async cancelUpload(fileNameId: FilenameId): Promise<void> {
		const stateForThisFile = this.state[fileNameId]
		stateForThisFile.onCancel()

		delete this.state[fileNameId]
	}
}
