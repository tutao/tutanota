import Foundation

/** corresponds to the DataFile in typescript */
public struct DataFile: Codable {
	public let name: String
	public let mimeType: String
	public let size: Int
	public let data: DataWrapper
	private let _type: String = "DataFile"

	public init(name: String, mimeType: String, size: Int, data: DataWrapper) {
		self.name = name
		self.mimeType = mimeType
		self.size = size
		self.data = data
	}

	// make it shut up about the _type
	enum CodingKeys: String, CodingKey {
		case name
		case mimeType
		case size
		case data
		case _type
	}
}
