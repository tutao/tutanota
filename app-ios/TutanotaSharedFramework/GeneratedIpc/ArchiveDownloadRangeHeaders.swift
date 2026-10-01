/* generated file, don't edit. */


/**
 * HTTP range request headers used to resume archive download.
 */
public struct ArchiveDownloadRangeHeaders : Codable, Sendable {
	public init(
		rangeStart: Int,
		reprDigest: String
	) {
		self.rangeStart = rangeStart
		self.reprDigest = reprDigest
	}
	public let rangeStart: Int
	public let reprDigest: String
}
