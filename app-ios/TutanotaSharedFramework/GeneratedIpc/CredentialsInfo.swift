/* generated file, don't edit. */


/**
 * Key definition for shortcuts.
 */
public struct CredentialsInfo : Codable {
	public init(
		login: String,
		userId: String,
		type: CredentialType
	) {
		self.login = login
		self.userId = userId
		self.type = type
	}
	public let login: String
	public let userId: String
	public let type: CredentialType
}
