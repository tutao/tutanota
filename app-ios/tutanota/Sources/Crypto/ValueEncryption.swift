// Helper functions for writing decryption of structures.

import Foundation

typealias Key = Data

func decrypt<T>(base64: Base64, key: Key) throws -> T where T: AesDecryptable {
  return try T.aesDecrypt(base64: base64, key: key)
}

protocol AesDecryptable {
  static func aesDecrypt(base64: Base64, key: Key) throws -> Self
}

protocol SimpleStringDecodable: AesDecryptable {
  init?(string: String)
}

extension SimpleStringDecodable {
  static func aesDecrypt(base64: Base64, key: Key) throws -> Self {
    let decValue = try TUTAes128Facade.decryptBase64String(base64, encryptionKey: key)
    if let value = Self.init(string: decValue) {
      return value
    } else {
      throw TUTErrorFactory.createError("Invalid string representation: \(decValue)")
    }
  }
}

extension Int : SimpleStringDecodable {
  init?(string: String) {
    self.init(string)
  }
}

extension Int64 : SimpleStringDecodable {
  init?(string: String) {
    self.init(string)
  }
}

extension Date : SimpleStringDecodable {
  init?(string: String) {
    guard let milliseconds = Int64(string: string) else {
      return nil
    }
    let seconds = Double(milliseconds) / 1000
    self.init(timeIntervalSince1970: seconds)
  }
}

extension String : SimpleStringDecodable {
  init?(string: String) {
    self.init(string)
  }
}

// Must still manually opt into it
extension SimpleStringDecodable where Self: RawRepresentable, Self.RawValue == Int {
  init?(string: String) {
    guard let intValue = Int(string) else {
      return nil
    }
    self.init(rawValue: intValue)
  }
}

// Must still manually opt into it
extension SimpleStringDecodable where Self: RawRepresentable, Self.RawValue == String {
  init?(string: String) {
    self.init(rawValue: string)
  }
}
