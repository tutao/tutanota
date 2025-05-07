import Foundation

@frozen public enum SqlValue: Codable {
	case null
	case number(value: Int)
	case string(value: String)
	case bytes(value: Data)
}
