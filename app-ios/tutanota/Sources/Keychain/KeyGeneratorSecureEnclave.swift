import Foundation
#if !targetEnvironment(simulator)
import CryptoTokenKit
#endif
import LocalAuthentication

/// Secure enclave and also CryptoTokenKit are unavailable in the simulator. We need to conditionally compile based on the target environment
/// otherwise the app will crash in the simulator when it tries to load the dynamic lib
class KeyGenerator {
  func generateKey(tag: String, accessControl: SecAccessControl) throws -> SecKey {
    var attributes: [String : Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeEC,
      kSecAttrKeySizeInBits as String: 256,
      kSecAttrAccessControl as String: accessControl,
      kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: tag,
      ]
    ]
    #if !targetEnvironment(simulator)
    attributes[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
    #endif

    var error: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
      let e = error!.takeRetainedValue() as Error as NSError
      let tutanotaError = TUTErrorFactory.wrapNativeError(
        withDomain: TUT_ERROR_DOMAIN,
        message: "Failed to generate data key for \(tag)",
        error: e
      )
      throw tutanotaError
    }
    return privateKey

  }
 
  func parseKeychainError(_ error: Unmanaged<CFError>) -> KeychainError {
    let e = error.takeRetainedValue() as Error as NSError
    
    #if !targetEnvironment(simulator)
    if e.domain == TKError.errorDomain && e.code == TKError.Code.corruptedData.rawValue {
      return .keyPermanentlyInvalidated(error: e)
    }
    #endif
    
    if e.domain == LAError.errorDomain && (e.code == LAError.Code.systemCancel.rawValue || e.code == LAError.Code.userCancel.rawValue) {
      return .authFailure(error: e)
    }
    
    return .unknown(error: e)
  }
}

internal enum KeychainError {
  case authFailure(error: NSError)
  case keyPermanentlyInvalidated(error: NSError)
  case unknown(error: NSError)
}
