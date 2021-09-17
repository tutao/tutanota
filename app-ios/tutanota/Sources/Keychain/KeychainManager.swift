import Foundation

private let TAG = "de.tutao.tutanota.notificationkey."

class KeychainManager : NSObject {
  func storeKey(_ key: Data, withId keyId: String) throws {
    let keyTag = self.keyTagFromKeyId(keyId: keyId)
    
    let existingKey = try? self.getKey(keyId: keyId)
    
    let status: OSStatus
    
    if let key = existingKey {
      let updateQuery: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: keyTag
      ]
      let updateFields: [String: Any] = [
        kSecValueData as String: key,
        kSecAttrAccessible as String: kSecAttrAccessibleAlwaysThisDeviceOnly
      ]
      status = SecItemUpdate(updateQuery as CFDictionary, updateFields as CFDictionary)
    } else {
      let addQuery: [String: Any] = [
        kSecValueData as String: key,
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: keyTag,
        kSecAttrAccessible as String: kSecAttrAccessibleAlwaysThisDeviceOnly
      ]
      status = SecItemAdd(addQuery as CFDictionary, nil)
    }
    if status != errSecSuccess {
      throw TUTErrorFactory.createError("Could not store the key, status: \(status)")
    }
  }
  
  func getKey(keyId: String) throws -> Data? {
    let keyTag = self.keyTagFromKeyId(keyId: keyId)
    let getQuery: [String : Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTag,
      kSecReturnData as String: true
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(getQuery as CFDictionary, &item)
    if (status != errSecSuccess) {
      throw TUTErrorFactory.createError("Failed to get key \(keyId). status: \(status)") as NSError
    } else if let item = item {
      return (item as! Data)
    } else {
      return nil
    }
  }
  
  func removePushIdentifierKeys() throws {
    let deleteQuery: [String: Any] = [
      kSecClass as String: kSecClassKey
    ]
    let status = SecItemDelete(deleteQuery as CFDictionary)
    if status != errSecSuccess {
      throw TUTErrorFactory .createError("Could not delete the keys, status: \(status)")
    }
  }
  
  private func keyTagFromKeyId(keyId: String) -> Data {
    let keyTag = TAG + keyId
    return keyTag.data(using: .utf8)!
  }
}
