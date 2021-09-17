import Foundation

struct EncryptedFileInfo {
  let uri: String
  let unencSize: Int64
}
extension EncryptedFileInfo : Codable {}

/// High-level cryptographic operations API
class CryptoFacade {
  /// Serial queue for executing crypto tasks
  private let queue = DispatchQueue(
    label: "de.tutao.encryption",
    qos: .userInitiated
  )
  private let crypto: TUTCrypto = TUTCrypto()
  
  func encryptFile(key: Base64, atPath filePath: String, completion: @escaping ResponseCallback<EncryptedFileInfo>) {
    self.run(completion) {
      return try self.encryptFileSync(key: key, filePath: filePath)
    }
  }
  
  func decryptFile(key: Base64, atPath filePath: String, completion: @escaping ResponseCallback<String>) {
    self.run(completion) {
      return try self.decryptFileSync(key: key, atPath: filePath)
    }
  }
  
  func generateRsaKey(seed: Base64, completion: @escaping ResponseCallback<KeyPair>) {
    self.run(completion) {
      let tutKeyPair = try self.crypto.generateRsaKey(withSeed: seed)
      return KeyPair(tutKeyPair)
    }
  }
  
  func rsaEncrypt(
    publicKey: PublicKey,
    base64Data: String,
    base64Seed: String,
    completion: @escaping ResponseCallback<String>
  ) {
    self.run(completion) {
      return try self.crypto.rsaEncrypt(
        with: publicKey.toObjcKey(),
        base64Data: base64Data,
        base64Seed: base64Seed
      )
    }
  }
  
  func rsaDecrypt(
    privateKey: PrivateKey,
    base64Data: String,
    completion: @escaping ResponseCallback<String>
  ) {
    self.run(completion) {
      return try self.crypto.rsaDecrypt(with: privateKey.toObjcKey(),
                                        base64Data: base64Data
      )
    }
  }
  
  private func encryptFileSync(key: Base64, filePath: String) throws -> EncryptedFileInfo {
    guard let keyData = Data(base64Encoded: key) else {
      throw CryptoError(message: "Invalid key data")
    }
    
    if !FileUtils.fileExists(atPath: filePath) {
      throw CryptoError(message: "File to encrypt does not exist \(filePath)")
    }
    let encryptedFolder = try FileUtils.getEncryptedFolder()
    let fileName = (filePath as NSString).lastPathComponent
    let encryptedFilePath = (encryptedFolder as NSString).appendingPathComponent(fileName)
    let iv = self.generateIv()
    let plainTextData = try Data(contentsOf: FileUtils.urlFromPath(path: filePath))
    let outputData = try TUTAes128Facade.encrypt(plainTextData, withKey: keyData, withIv: iv, withMac: true)
    let result = EncryptedFileInfo(uri: encryptedFilePath, unencSize: Int64(plainTextData.count))
    
    try outputData.write(to: FileUtils.urlFromPath(path: encryptedFilePath))
    
    return result
  }
  
  private func decryptFileSync(key: Base64, atPath filePath: String) throws -> String {
    guard let key = Data(base64Encoded: key) else {
      throw CryptoError(message: "Invalid key data")
    }
    if !FileUtils.fileExists(atPath: filePath) {
      throw CryptoError(message: "File to decrypt does not exist")
    }
    
    let encryptedData = try Data(contentsOf: FileUtils.urlFromPath(path: filePath))
    let plaintextData = try TUTAes128Facade.decrypt(encryptedData, withKey: key)
    
    let decryptedFolder = try FileUtils.getDecryptedFolder()
    let fileName = (filePath as NSString).lastPathComponent
    let plaintextPath = (decryptedFolder as NSString).appendingPathComponent(fileName)
    try plaintextData.write(to: FileUtils.urlFromPath(path: plaintextPath), options: .atomic)
    
    return plaintextPath
  }
  
  private func generateIv() -> Data {
    return TUTCrypto.generateIv()
  }
  
  private func run<T>(_ completion: @escaping ResponseCallback<T>, call: @escaping () throws -> T) {
    self.queue.async {
      let result = Result(catching: call)
      completion(result)
    }
  }
}

private func CryptoError(message: String) -> Error {
  return TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: message)
}
