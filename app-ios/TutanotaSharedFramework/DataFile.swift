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
}
