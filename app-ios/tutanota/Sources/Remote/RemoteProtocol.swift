import Foundation

/// Structure to exchange messages remotely
struct RemoteMessage : Encodable {
  let id: String
  let type: RemoteMessageType
  let value: Encodable?
  let error: ResponseError?
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(type, forKey: .type)
    try value?.openEncode(into: &container, forKey: .value)
    try container.encodeIfPresent(error, forKey: .error)
  }
  
  enum CodingKeys: String, CodingKey {
    case id
    case type
    case value
    case error
  }
}

struct ResponseError : Codable {
  let name: String
  let message: String
}

enum RemoteMessageType {
  case request(value: String)
  case response
  case requestError
}

extension RemoteMessageType : Decodable {
  init(from decoder: Decoder) throws {
    let value = try String(from: decoder)
    switch value {
    case "response":
      self = .response
    case "requestError":
      self = .requestError
    default:
      self = .request(value: value)
    }
  }
}

extension RemoteMessageType : Encodable {
  func encode(to encoder: Encoder) throws {
    switch self {
    case .response:
      try "response".encode(to: encoder)
    case .requestError:
      try "requestError".encode(to: encoder)
    case let .request(value: value):
      try value.encode(to: encoder)
    }
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
  func openEncode(into encoder: Encoder) throws {
    try self.encode(to: encoder)
  }
  
  func openEncode<C: KeyedEncodingContainerProtocol>(into container: inout C, forKey key: C.Key) throws {
    try container.encode(self, forKey: key)
  }
}
