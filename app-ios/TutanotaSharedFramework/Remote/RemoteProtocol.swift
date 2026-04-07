import Foundation

/// Do you want to encode erased Encodable but Swift doesn't let you?
/// Use this one weird hack!
public struct ExistentialEncodable: Encodable {
	let value: any Encodable

	public func encode(to encoder: any Encoder) throws { try self.value.openEncode(into: encoder) }
}

public struct ResponseError: Codable {
	public let name: String
	public let message: String
	public let stack: String
	public init(name: String, message: String, stack: String) {
		self.name = name
		self.message = message
		self.stack = stack
	}
}

/// Swift magic
/// Swift does not allow protocol to conform to itself, even when it's fine so we can't pass erased Encodable variable into
/// a function that accepts encodable. But we can call methods on such a thing and Swift will make a trampoline for us
/// (basically a boxed value with dynamic dispatch).
///
/// see https://stackoverflow.com/a/54968959
/// see https://stackoverflow.com/a/43408193
/// see https://github.com/apple/swift/blob/main/docs/GenericsManifesto.md#opening-existentials
fileprivate extension Encodable {
	func openEncode(into encoder: any Encoder) throws { try self.encode(to: encoder) }

	func openEncode(into unkeyedContainer: inout any UnkeyedEncodingContainer) throws { try unkeyedContainer.encode(self) }

	func openEncode<C: KeyedEncodingContainerProtocol>(into container: inout C, forKey key: C.Key) throws { try container.encode(self, forKey: key) }
}
