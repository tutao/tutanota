import Foundation

/// High-level cryptographic operations API
/// Is an actor because we want to have serial execution for all the cryptogaphic operations, doing them in parallel is usually too
/// much for the device.
actor IosNativeCryptoFacade: NativeCryptoFacade {

  private let crypto: TUTCrypto = TUTCrypto()

  func aesEncryptFile(_ key: DataWrapper, _ fileUri: String, _ iv: DataWrapper) async throws -> EncryptedFileInfo {

    if !FileUtils.fileExists(atPath: fileUri) {
      throw CryptoError(message: "File to encrypt does not exist \(fileUri)")
    }
    let encryptedFolder = try FileUtils.getEncryptedFolder()
    let fileName = (fileUri as NSString).lastPathComponent
    let encryptedFilePath = (encryptedFolder as NSString).appendingPathComponent(fileName)
    let plainTextData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
    let outputData = try TUTAes128Facade.encrypt(plainTextData, withKey: key.data, withIv: iv.data, withMac: true)
    let result = EncryptedFileInfo(uri: encryptedFilePath, unencryptedSize: plainTextData.count)

    try outputData.write(to: URL(fileURLWithPath: encryptedFilePath))

    return result
  }

  func aesDecryptFile(_ key: DataWrapper, _ fileUri: String) async throws -> String {
    if !FileUtils.fileExists(atPath: fileUri) {
      throw CryptoError(message: "File to decrypt does not exist")
    }

    let encryptedData = try Data(contentsOf: URL(fileURLWithPath: fileUri))
    let plaintextData = try TUTAes128Facade.decrypt(encryptedData, withKey: key.data)

    let decryptedFolder = try FileUtils.getDecryptedFolder()
    let fileName = (fileUri as NSString).lastPathComponent
    let plaintextPath = (decryptedFolder as NSString).appendingPathComponent(fileName)
    try plaintextData.write(to: URL(fileURLWithPath: plaintextPath), options: .atomic)

    return plaintextPath
  }

  func generateRsaKey(_ seed: DataWrapper) async throws -> RsaKeyPair {
    let tutKeyPair = try self.crypto.generateRsaKey(withSeed: seed.data)
    return RsaKeyPair(tutKeyPair)
  }

  func rsaEncrypt(
    _ publicKey: RsaPublicKey,
    _ data: DataWrapper,
    _ seed: DataWrapper
  ) async throws -> DataWrapper {
      return try self.crypto.rsaEncrypt(
        with: publicKey.toObjcKey(),
        data: data.data,
        seed: seed.data
      ).wrap()
    }

  func rsaDecrypt(
    _ privateKey: RsaPrivateKey,
    _ data: DataWrapper
  ) async throws -> DataWrapper {
      return try self.crypto.rsaDecrypt(
        with: privateKey.toObjcKey(),
        data: data.data
      ).wrap()
    }
}

private func CryptoError(message: String) -> Error {
  return TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: message)
}
