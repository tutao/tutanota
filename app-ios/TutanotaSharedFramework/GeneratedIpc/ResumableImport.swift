/* generated file, don't edit. */


/**
 * State Id and number of remaining mails of resumable import
 */
public struct ResumableImport : Codable {
	public init(
		remoteStateId: IdTuple,
		remainingEmlCount: Int
	) {
		self.remoteStateId = remoteStateId
		self.remainingEmlCount = remainingEmlCount
	}
	public let remoteStateId: IdTuple
	public let remainingEmlCount: Int
}
