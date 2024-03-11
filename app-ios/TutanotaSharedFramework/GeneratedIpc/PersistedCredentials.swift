/* generated file, don't edit. */


/**
 * Key definition for shortcuts.
 */
public struct PersistedCredentials : Codable {
	public init(
		credentialsInfo: CredentialsInfo,
		accessToken: String,
		databaseKey: String?,
		encryptedPassword: String
	) {
		self.credentialsInfo = credentialsInfo
		self.accessToken = accessToken
		self.databaseKey = databaseKey
		self.encryptedPassword = encryptedPassword
	}
	public let credentialsInfo: CredentialsInfo
	public let accessToken: String
	public let databaseKey: String?
	public let encryptedPassword: String
}
