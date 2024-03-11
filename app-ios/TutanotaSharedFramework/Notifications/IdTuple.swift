import Foundation

/// Id which includes list and element Id.
/// In JSON represented as an array tuple but structure is easier to use so we manually implement coding.
public struct IdTuple {
	public let listId: String
	public let elementId: String
}

extension IdTuple: Encodable {
	public func encode(to encoder: Encoder) throws {
		var container = encoder.unkeyedContainer()
		try container.encode(self.listId)
		try container.encode(self.elementId)
	}
}

extension IdTuple: Decodable {
	public init(from decoder: Decoder) throws {
		var values = try decoder.unkeyedContainer()
		let listId = try values.decode(String.self)
		let elementId = try values.decode(String.self)

		self.init(listId: listId, elementId: elementId)
	}
}
