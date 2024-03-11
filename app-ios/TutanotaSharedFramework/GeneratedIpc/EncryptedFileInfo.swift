/* generated file, don't edit. */


/**
 * Result of the `encryptFile()` operation.
 */
public struct EncryptedFileInfo : Codable {
	public init(
		uri: String,
		unencryptedSize: Int
	) {
		self.uri = uri
		self.unencryptedSize = unencryptedSize
	}
	public let uri: String
	public let unencryptedSize: Int
}
