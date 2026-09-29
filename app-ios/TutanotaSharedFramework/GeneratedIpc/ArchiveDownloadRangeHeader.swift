/* generated file, don't edit. */


/**
 * FIXME
 */
public struct ArchiveDownloadRangeHeader : Codable, Sendable {
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
