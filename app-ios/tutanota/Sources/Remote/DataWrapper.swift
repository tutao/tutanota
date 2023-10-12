import Foundation

public struct DataWrapper {
  let data: Data
}

extension DataWrapper: Codable {
  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: Self.CodingKeys)
    try container.encode(self.data, forKey: .data)
    try container.encode("__bytes", forKey: .marker)
  }
  
  public init(from decoder: Decoder) throws {
    self.data = try decoder.container(keyedBy: Self.CodingKeys).decode(Data.self, forKey: .data)
  }
  
  enum CodingKeys: String, CodingKey {
      case data
      case marker
  }
}

extension Data {
  public func wrap() -> DataWrapper {
    return DataWrapper(data: self)
  }
}
