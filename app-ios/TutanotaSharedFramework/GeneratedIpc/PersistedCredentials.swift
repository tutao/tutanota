/* generated file, don't edit. */


/**
 * Key definition for shortcuts.
 */
public struct PersistedCredentials : Codable {
	public init(
		credentialInfo: CredentialsInfo,
		accessToken: DataWrapper,
		databaseKey: DataWrapper?,
		encryptedPassword: String
	) {
		self.credentialInfo = credentialInfo
		self.accessToken = accessToken
		self.databaseKey = databaseKey
		self.encryptedPassword = encryptedPassword
	}
	public let credentialInfo: CredentialsInfo
	public let accessToken: DataWrapper
	public let databaseKey: DataWrapper?
	public let encryptedPassword: String
}
