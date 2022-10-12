import Foundation

/**
 * Type tags for values being passed to SQL statements
 */
public enum SqlType: String {
  case Null = "SqlNull"
  case Number = "SqlNum"
  case SqlString = "SqlStr"
  case Bytes = "SqlBytes"
}

public enum TaggedSqlValue: Codable {
  case Null
  case Number(value: Int)
  case SqlString(value: String)
  case Bytes(value: DataWrapper) // Uint8Array
  
  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: Self.CodingKeys)
    
    switch self {
    case .Null:
      try container.encode(SqlType.Null.rawValue, forKey: .type)
      try container.encode(self, forKey: .value)
    case .Number(let value):
      try container.encode(SqlType.Number.rawValue, forKey: .type)
      try container.encode(value, forKey: .value)
    case .SqlString(let value):
      try container.encode(SqlType.SqlString.rawValue, forKey: .type)
      try container.encode(value, forKey: .value)
    case .Bytes(let value):
      try container.encode(SqlType.Bytes.rawValue, forKey: .type)
      try container.encode(value, forKey: .value)
    }
  }
  
  public init(from decoder: Decoder) throws {
    let type = try decoder.container(keyedBy: Self.CodingKeys)
      .decode(String.self, forKey: .type)
    switch type {
    case SqlType.Null.rawValue:
      self = .Null
    case SqlType.SqlString.rawValue:
      let value: String = try decoder.container(keyedBy: Self.CodingKeys)
        .decode(String.self, forKey: .value)
      self = .SqlString(value: value)
    case SqlType.Number.rawValue:
      let value: Int = try decoder.container(keyedBy: Self.CodingKeys)
        .decode(Int.self, forKey: .value)
      self = .Number(value: value)
    case SqlType.Bytes.rawValue:
      let value: DataWrapper = try decoder.container(keyedBy: Self.CodingKeys)
        .decode(DataWrapper.self, forKey: .value)
      self = .Bytes(value: value)
    default:
      fatalError("unknown sql type \(type), can't decode")
    }
  }
  
  private enum CodingKeys: String, CodingKey {
    case type
    case value
  }
}
