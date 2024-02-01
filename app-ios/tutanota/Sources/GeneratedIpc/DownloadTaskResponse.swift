/* generated file, don't edit. */


/**
 * Result of the download operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
public struct DownloadTaskResponse : Codable {
	let statusCode: Int
	let errorId: String?
	let precondition: String?
	let suspensionTime: String?
	let encryptedFileUri: String?
}
