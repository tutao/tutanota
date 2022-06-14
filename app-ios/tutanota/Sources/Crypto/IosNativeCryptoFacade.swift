import Foundation

/// High-level cryptographic operations API
/// Is an actor because we want to have serial execution for all the cryptogaphic operations, doing them in parallel is usually too
/// much for the device.
actor IosNativeCryptoFacade: NativeCryptoFacade {

  private let crypto: TUTCrypto = TUTCrypto()

  func aesEncryptFile(_ key: Base64, _ fileUri: String, _ iv: String) async throws -> EncryptedFileInfo {
    guard let keyData = Data(base64Encoded: key) else {
      throw CryptoError(message: "Invalid key data")
    }

    if !FileUtils.fileExists(atPath: fileUri) {
      throw CryptoError(message: "File to encrypt does not exist \(fileUri)")
    }
    let encryptedFolder = try FileUtils.getEncryptedFolder()
    let fileName = (fileUri as NSString).lastPathComponent
    let encryptedFilePath = (encryptedFolder as NSString).appendingPathComponent(fileName)
    let ivData = Data(base64Encoded: iv)
    let plainTextData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
    let outputData = try TUTAes128Facade.encrypt(plainTextData, withKey: keyData, withIv: ivData!, withMac: true)
    let result = EncryptedFileInfo(uri: encryptedFilePath, unencryptedSize: plainTextData.count)

    try outputData.write(to: URL(fileURLWithPath: encryptedFilePath))

    return result
  }

  func aesDecryptFile(_ key: Base64, _ fileUri: String) async throws -> String {
    guard let key = Data(base64Encoded: key) else {
      throw CryptoError(message: "Invalid key data")
    }
    if !FileUtils.fileExists(atPath: fileUri) {
      throw CryptoError(message: "File to decrypt does not exist")
    }

    let encryptedData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
    let plaintextData = try TUTAes128Facade.decrypt(encryptedData, withKey: key)

    let decryptedFolder = try FileUtils.getDecryptedFolder()
    let fileName = (fileUri as NSString).lastPathComponent
    let plaintextPath = (decryptedFolder as NSString).appendingPathComponent(fileName)
    try plaintextData.write(to: URL(fileURLWithPath: plaintextPath), options: .atomic)

    return plaintextPath
  }

  func generateRsaKey(_ seed: Base64) async throws -> RsaKeyPair {
    let tutKeyPair = try self.crypto.generateRsaKey(withSeed: seed)
    return RsaKeyPair(tutKeyPair)
  }

  func rsaEncrypt(
    _ publicKey: PublicKey,
    _ base64Data: Base64,
    _ base64Seed: Base64
  ) async throws -> String {
      return try self.crypto.rsaEncrypt(
        with: publicKey.toObjcKey(),
        base64Data: base64Data,
        base64Seed: base64Seed
      )
    }

  func rsaDecrypt(
    _ privateKey: PrivateKey,
    _ base64Data: Base64
  ) async throws -> String {
      return try self.crypto.rsaDecrypt(
        with: privateKey.toObjcKey(),
        base64Data: base64Data
      )
    }
}

private func CryptoError(message: String) -> Error {
  return TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: message)
}
