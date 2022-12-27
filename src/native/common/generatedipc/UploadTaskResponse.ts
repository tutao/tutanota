/* generated file, don't edit. */

/**
 * Result of the file upload operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
export interface UploadTaskResponse {
	readonly statusCode: number
	readonly errorId: string | null
	readonly precondition: string | null
	readonly suspensionTime: string | null
	readonly responseBody: Uint8Array
}
