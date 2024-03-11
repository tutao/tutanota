/* generated file, don't edit. */


/**
 * Search-in-page result by Electron.
 */
public struct ElectronResult : Codable {
	public init(
		matches: Int,
		activeMatchOrdinal: Int
	) {
		self.matches = matches
		self.activeMatchOrdinal = activeMatchOrdinal
	}
	public let matches: Int
	public let activeMatchOrdinal: Int
}
