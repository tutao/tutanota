/* generated file, don't edit. */


/**
 * When the error happens in the native we serialize it via this structure.
 */
public struct ErrorInfo : Codable {
	let name: String?
	let message: String?
	let stack: String?
}
