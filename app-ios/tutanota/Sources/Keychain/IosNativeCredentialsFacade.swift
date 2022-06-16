import Foundation
import LocalAuthentication

public enum CredentialEncryptionMode: String, Codable {
  case deviceLock = "DEVICE_LOCK"
  case systemPassword = "SYSTEM_PASSWORD"
  case biometrics = "BIOMETRICS"
}

class IosNativeCredentialsFacade : NativeCredentialsFacade {
  private let keychainManager: KeychainManager
  
  init(keychainManager: KeychainManager) {
    self.keychainManager = keychainManager
  }
  
  func encryptUsingKeychain(_ data: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
    let encryptedData = try self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data.data)
    return DataWrapper(data: encryptedData)
  }
  
  func decryptUsingKeychain(_ encryptedData: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
    let data = try self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData.data)
    return DataWrapper(data: data)
  }
  
  func getSupportedEncryptionModes() async -> [CredentialEncryptionMode] {
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
