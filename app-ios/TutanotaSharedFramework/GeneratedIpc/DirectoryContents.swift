/* generated file, don't edit. */


public struct DirectoryContents : Codable, Sendable {
	public init(
		name: String,
		path: String,
		files: [String],
		folders: [String]
	) {
		self.name = name
		self.path = path
		self.files = files
		self.folders = folders
	}
	public let name: String
	public let path: String
	public let files: [String]
	public let folders: [String]
}
