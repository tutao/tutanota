import Foundation

/// Structure to exchange messages remotely
enum RemoteMessage : Encodable {
  case request(id: String, type: String, args: [Encodable])
  case response(id: String, value: Encodable)
  case requestError(id: String, error: ResponseError)
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: Self.CodingKeys)
    switch self {
    case let .request(id, type, args):
      try container.encode(id, forKey: .id)
      try container.encode(type, forKey: .type)
      var argsContainer = container.nestedUnkeyedContainer(forKey: .args)
      for arg in args {
        try arg.openEncode(into: &argsContainer)
      }
    case let .response(id, value):
      try container.encode(id, forKey: .id)
      try container.encode("response", forKey: .type)
      try value.openEncode(into: &container, forKey: .value)
    case let .requestError(id, error):
      try container.encode(id, forKey: .id)
      try container.encode("requestError", forKey: .type)
      try container.encode(error, forKey: .error)
    }
  }
  
  // We could customize this even more by message type
  enum CodingKeys: String, CodingKey {
    case id
    case type
    case value
    case error
    case args
  }
}

struct ResponseError : Codable {
  let name: String
  let message: String
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
  func openEncode(into encoder: Encoder) throws {
    try self.encode(to: encoder)
  }
  
  func openEncode(into unkeyedContainer: inout UnkeyedEncodingContainer) throws {
    try unkeyedContainer.encode(self)
  }

  func openEncode<C: KeyedEncodingContainerProtocol>(into container: inout C, forKey key: C.Key) throws {
    try container.encode(self, forKey: key)
  }
}
