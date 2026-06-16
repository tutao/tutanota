/* generated file, don't edit. */


/**
 * file's creation time and last modification time in milliseconds since epoch
 */
public struct FileTimestamps : Codable, Sendable {
	public init(
		created: Int,
		modified: Int
	) {
		self.created = created
		self.modified = modified
	}
	public let created: Int
	public let modified: Int
}
