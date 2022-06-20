/* generated file, don't edit. */


/**
 * Result of the file upload operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
public struct UploadTaskResponse : Codable {
	let statusCode: Int
	let errorId: String?
	let precondition: String?
	let suspensionTime: String?
	let responseBody: DataWrapper
}
