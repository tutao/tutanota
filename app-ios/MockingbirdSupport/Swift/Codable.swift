public protocol Encodable { func encode(to encoder: Encoder) throws }

public protocol Decodable { @objc(mkb_implicit) init(from decoder: Decoder) throws }

public typealias Codable = Decodable & Encodable
