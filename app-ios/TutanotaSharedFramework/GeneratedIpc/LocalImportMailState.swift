/* generated file, don't edit. */


/**
 * Local import mail state, to show progress during an mail import.
 */
public struct LocalImportMailState : Codable {
	public init(
		importMailStateElementId: String,
		successfulMails: Int,
		failedMails: Int,
		status: Int
	) {
		self.importMailStateElementId = importMailStateElementId
		self.successfulMails = successfulMails
		self.failedMails = failedMails
		self.status = status
	}
	public let importMailStateElementId: String
	public let successfulMails: Int
	public let failedMails: Int
	public let status: Int
}
