import Foundation

/**
 * Type tags for values being passed to SQL statements
 */
public enum SqlType: String {
	case null = "SqlNull"
	case number = "SqlNum"
	case string = "SqlStr"
	case bytes = "SqlBytes"
}

public enum TaggedSqlValue: Codable {
	case null
	case number(value: Int)
	case string(value: String)
	case bytes(value: DataWrapper)  // Uint8Array

	public func encode(to encoder: Encoder) throws {
		var container = encoder.container(keyedBy: CodingKeys.self)

		switch self {
		case .null:
			try container.encode(SqlType.null.rawValue, forKey: .type)
			try container.encode(self, forKey: .value)
		case .number(let value):
			try container.encode(SqlType.number.rawValue, forKey: .type)
			try container.encode(value, forKey: .value)
		case .string(let value):
			try container.encode(SqlType.string.rawValue, forKey: .type)
			try container.encode(value, forKey: .value)
		case .bytes(let value):
			try container.encode(SqlType.bytes.rawValue, forKey: .type)
			try container.encode(value, forKey: .value)
		}
	}

	public init(from decoder: Decoder) throws {
		let typeString = try decoder.container(keyedBy: CodingKeys.self).decode(String.self, forKey: .type)
		guard let type = SqlType(rawValue: typeString) else { fatalError("unknown sql type \(typeString), can't decode") }
		switch type {
		case .null: self = .null
		case .string:
			let value: String = try decoder.container(keyedBy: CodingKeys.self).decode(String.self, forKey: .value)
			self = .string(value: value)
		case .number:
			let value: Int = try decoder.container(keyedBy: CodingKeys.self).decode(Int.self, forKey: .value)
			self = .number(value: value)
		case .bytes:
			let value: DataWrapper = try decoder.container(keyedBy: CodingKeys.self).decode(DataWrapper.self, forKey: .value)
			self = .bytes(value: value)
		}
	}

	private enum CodingKeys: String, CodingKey {
		case type
		case value
	}
}
