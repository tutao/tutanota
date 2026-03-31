import { remove } from "@tutao/utils"
import { DownloadProgressInfo, UploadProgressInfo } from "../common/drive/DriveTypes"

export type UploadListener = (info: UploadProgressInfo) => unknown
export type DownloadListener = (info: DownloadProgressInfo) => unknown

/**
 * Listen to/dispatch upload/download progress events.
 */
export class TransferProgressDispatcher {
	private readonly uploadListeners: UploadListener[] = []
	private readonly downloadListeners: DownloadListener[] = []

	/** IPC: Should only be called from the same context as UploadProgressListener */
	addUploadListener(listener: UploadListener) {
		this.uploadListeners.push(listener)
	}

	/** IPC: Should only be called from the same context as UploadProgressListener */
	addDownloadListener(listener: DownloadListener) {
		this.downloadListeners.push(listener)
	}

	/** IPC: Should only be called from the same context as UploadProgressListener */
	removeUploadListener(listener: UploadListener) {
		remove(this.uploadListeners, listener)
	}

	/** IPC: Should only be called from the same context as UploadProgressListener */
	removeDownloadListener(listener: DownloadListener) {
		remove(this.downloadListeners, listener)
	}

	/** IPC: safe to call from different context */
	onChunkUploaded(info: UploadProgressInfo) {
		for (const listener of this.uploadListeners) {
			listener(info)
		}
	}

	/** IPC: safe to call from different context */
	onChunkDownloaded(info: DownloadProgressInfo) {
		for (const listener of this.downloadListeners) {
			listener(info)
		}
	}
}
