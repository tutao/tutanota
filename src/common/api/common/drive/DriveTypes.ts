export type ChunkedUploadInfo = {
	fileId: TransferId
	uploadedBytes: number
	totalBytes: number
}

export type ChunkedDownloadInfo = {
	fileId: TransferId
	downloadedBytes: number
}

export type TransferId = string & { readonly __brand__: unique symbol }
