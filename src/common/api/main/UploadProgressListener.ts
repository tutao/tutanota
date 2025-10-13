import { ChunkedUploadInfo } from "../common/drive/DriveTypes"

export const DRIVE_UPLOAD_PROGRESS_EVENT = "DRIVE_UPLOAD_PROGRESS_EVENT"

export class UploadProgressListener {
	private eventTarget: EventTarget

	constructor() {
		this.eventTarget = new EventTarget()
	}

	public addListener(onChunkUploaded: (info: ChunkedUploadInfo) => Promise<void>) {
		this.eventTarget = new EventTarget() // hack, something is wrong with the rendering... why so many re-render and constructor being called

		const callback = (ev: CustomEvent) => {
			onChunkUploaded(ev.detail as ChunkedUploadInfo)
		}

		// itś because of Henri and his stupid idea I am a victim
		this.eventTarget.addEventListener(DRIVE_UPLOAD_PROGRESS_EVENT, callback)
	}

	onChunkUploaded(info: ChunkedUploadInfo) {
		console.log("onChunkUploaded: ", info.uploadedBytes, "/", info.totalBytes)

		// fire event here
		this.eventTarget.dispatchEvent(new CustomEvent(DRIVE_UPLOAD_PROGRESS_EVENT, { detail: info }))
	}
}
