import Foundation

/// This wrapper is needed at the moment to aid js part of line protocol in serialization.
/// When DataWrapper is serialized it writes an object like
/// ```json
///     {
///     	"data": "AA==",
///     	"marker": "__bytes",
///     }
/// ```
public final class DataWrapper: Sendable {
	public let data: Data

	enum CodingKeys: String, CodingKey {
		case data
		case marker
	}

	public required init(from decoder: any Decoder) throws { self.data = try decoder.container(keyedBy: Self.CodingKeys.self).decode(Data.self, forKey: .data) }

	public init(data: Data) { self.data = data }
}

extension DataWrapper: Codable {
	public func encode(to encoder: any Encoder) throws {
		var container = encoder.container(keyedBy: Self.CodingKeys.self)
		try container.encode(self.data, forKey: .data)
		try container.encode("__bytes", forKey: .marker)
	}
}

extension Data { public func wrap() -> DataWrapper { DataWrapper(data: self) } }
