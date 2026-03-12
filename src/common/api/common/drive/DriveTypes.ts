export type UploadProgressInfo = {
	transferId: TransferId
	/** bytes downloaded so far for the transfer */
	uploadedBytes: number
	totalBytes: number
}

export type DownloadProgressInfo = {
	transferId: TransferId
	/** bytes downloaded so far for the transfer */
	downloadedBytes: number
}

export type TransferId = string & { readonly __brand__: unique symbol }
