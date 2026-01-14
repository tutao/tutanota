import { remove } from "@tutao/tutanota-utils"
import { ChunkedDownloadInfo, ChunkedUploadInfo } from "../common/drive/DriveTypes"

export type UploadListener = (info: ChunkedUploadInfo) => unknown
export type DownloadListener = (info: ChunkedDownloadInfo) => unknown

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
	onChunkUploaded(info: ChunkedUploadInfo) {
		for (const listener of this.uploadListeners) {
			listener(info)
		}
	}

	/** IPC: safe to call from different context */
	onChunkDownloaded(info: ChunkedDownloadInfo) {
		for (const listener of this.downloadListeners) {
			listener(info)
		}
	}
}
