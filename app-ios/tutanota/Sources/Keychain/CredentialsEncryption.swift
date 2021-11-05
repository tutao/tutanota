import Foundation
import LocalAuthentication

enum CredentialEncryptionMode: String, Encodable {
  case deviceLock = "DEVICE_LOCK"
  case systemPassword = "SYSTEM_PASSWORD"
  case biometrics = "BIOMETRICS"
}

class CredentialsEncryption {
  private let keychainManager: KeychainManager
  
  init(keychainManager: KeychainManager) {
    self.keychainManager = keychainManager
  }
  
  func encryptUsingKeychain(data base64Data: Base64, encryptionMode: CredentialEncryptionMode, completion: @escaping ResponseCallback<Base64>) {
    DispatchQueue.global(qos: .default).async {
      let data = Data(base64Encoded: base64Data)!
      
      let result: Result<Base64, Error> = Result {
        let encryptedData = try self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data)
        return encryptedData.base64EncodedString()
      }
      completion(result)
    }
  }
  
  func decryptUsingKeychain(encryptedData encryptedBase64Data: Base64, encryptionMode: CredentialEncryptionMode, completion: @escaping ResponseCallback<Base64>) {
    DispatchQueue.global(qos: .default).async {
      let encryptedData = Data(base64Encoded: encryptedBase64Data)!
      
      let result: Result<Base64, Error> = Result {
        let data = try self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData)
        return data.base64EncodedString()
      }
      completion(result)
    }
  }
  
  func getSupportedEncryptionModes(completion: ResponseCallback<[CredentialEncryptionMode]>) {
    let result = Result { try self.doGetSupportedEncryptionModes() }
    completion(result)
  }
  
  private func doGetSupportedEncryptionModes() throws -> [CredentialEncryptionMode] {
    var supportedModes = [CredentialEncryptionMode.deviceLock]
    let context = LAContext()
    
    let systemPasswordSupported = context.canEvaluatePolicy(.deviceOwnerAuthentication)
    if systemPasswordSupported {
      supportedModes.append(.systemPassword)
    }
    let biometricsSupported = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)
    if biometricsSupported {
      supportedModes.append(.biometrics)
    }
    return supportedModes
  }
}


fileprivate extension LAContext {
  func canEvaluatePolicy(_ policy: LAPolicy) -> Bool {
    var error: NSError?
    let supported = self.canEvaluatePolicy(policy, error: &error)
    if let error = error {
      TUTSLog("Cannot evaluate policy \(policy): \(error.debugDescription)")
    }
    return supported
  }
}
