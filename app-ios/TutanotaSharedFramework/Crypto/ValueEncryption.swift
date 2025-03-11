/// Helper functions for writing decryption of structures.

import Foundation

public typealias Key = Data

public func decrypt<T>(base64: Base64, key: Key) throws -> T where T: AesDecryptable { try T.aesDecrypt(base64: base64, key: key) }

public protocol AesDecryptable { static func aesDecrypt(base64: Base64, key: Key) throws -> Self }

public protocol SimpleStringDecodable: AesDecryptable { init?(string: String) }

extension SimpleStringDecodable {
	public static func aesDecrypt(base64: Base64, key: Key) throws -> Self {
		guard let decoded = Data(base64Encoded: base64) else { throw TutanotaError(message: "Could not convert BASE64 value to data for \(Self.self)") }
		let decrypted = try aesDecryptData(decoded, withKey: key)
		guard let decValue = String(data: decrypted, encoding: .utf8) else {
			throw TutanotaError(message: "Cound not convert decrypted data to string for \(Self.self)")
		}
		if let value = Self.init(string: decValue) {
			return value
		} else {
			throw TutanotaError(message: "Invalid string representation for \(Self.self): \(decValue)")
		}
	}
}

extension Int: SimpleStringDecodable { public init?(string: String) { self.init(string) } }

extension Int64: SimpleStringDecodable { public init?(string: String) { self.init(string) } }

extension Date: SimpleStringDecodable {
	public init?(string: String) {
		guard let milliseconds = Int64(string: string) else { return nil }
		let seconds = Double(milliseconds) / 1000
		self.init(timeIntervalSince1970: seconds)
	}
}

extension String: SimpleStringDecodable { public init?(string: String) { self.init(string) } }

// Must still manually opt into it
public extension SimpleStringDecodable where Self: RawRepresentable, Self.RawValue == Int {
	init?(string: String) {
		guard let intValue = Int(string) else { return nil }
		self.init(rawValue: intValue)
	}
}

// Must still manually opt into it
extension SimpleStringDecodable where Self: RawRepresentable, Self.RawValue == String { public init?(string: String) { self.init(rawValue: string) } }
