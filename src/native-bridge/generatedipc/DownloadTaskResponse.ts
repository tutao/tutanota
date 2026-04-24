/* generated file, don't edit. */

/**
 * Result of the download operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
export interface DownloadTaskResponse {
	readonly statusCode: number
	readonly errorId: string | null
	readonly precondition: string | null
	readonly suspensionTime: string | null
	readonly encryptedFileUri: string | null
}
