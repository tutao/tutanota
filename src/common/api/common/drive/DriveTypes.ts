export type ChunkedUploadInfo = {
	fileId: UploadId
	uploadedBytes: number
	totalBytes: number
}

export type ChunkedDownloadInfo = {
	fileId: Id
	downloadedBytes: number
}

export type UploadId = string & { readonly __brand__: unique symbol }
