import Foundation

let KYBER_PUBLIC_KEY_LENGTH = Int(OQS_KEM_kyber_1024_length_public_key)
let KYBER_PRIVATE_KEY_LENGTH = Int(OQS_KEM_kyber_1024_length_secret_key)
let KYBER_CIPHER_TEXT_LENGTH = Int(OQS_KEM_kyber_1024_length_ciphertext)
let KYBER_SHARED_SECRET_LENGTH = Int(OQS_KEM_kyber_1024_length_shared_secret)

/// Generate a keypair for Kyber
///
/// - parameters:
///   - withSeed: random bytes to use for generating keys
func generateKyberKeypair(withSeed seed: Data) -> KyberKeyPair {
  injectEntropy(seed: seed)

  let kem = KEM(method: OQS_KEM_alg_kyber_1024)

  var publicKeyBytes = [UInt8](repeating: 0, count: KYBER_PUBLIC_KEY_LENGTH)
  var privateKeyBytes = [UInt8](repeating: 0, count: KYBER_PRIVATE_KEY_LENGTH)

  let result = OQS_KEM_keypair(kem.kem, &publicKeyBytes, &privateKeyBytes)
  guard result == OQS_SUCCESS else {
    fatalError("OQS_KEM_keypair failed to generate a key: \(result)")
  }

  let publicKey = KyberPublicKey(raw: Data(publicKeyBytes).wrap())
  let privateKey = KyberPrivateKey(raw: Data(privateKeyBytes).wrap())

  return KyberKeyPair(publicKey: publicKey, privateKey: privateKey)
}

/// Derive a shared secret and a ciphertext from the public key and seed
///
/// - parameters:
///   - publicKey: public key to encrypt the secret
///   - withSeed: random bytes to use for generating the secret
func kyberEncapsulate(publicKey: KyberPublicKey, withSeed seed: Data) throws -> KyberEncapsulation {
  try assertCorrectLength(of: publicKey.raw.data, withName: "public key", expectingLength: KYBER_PUBLIC_KEY_LENGTH)

  injectEntropy(seed: seed)

  let kem = KEM(method: OQS_KEM_alg_kyber_1024)

  var cipherTextBytes = [UInt8](repeating: 0, count: KYBER_CIPHER_TEXT_LENGTH)
  var sharedSecretBytes = [UInt8](repeating: 0, count: KYBER_SHARED_SECRET_LENGTH)

  let result = publicKey.raw.data.withUnsafeBytes{publicKey in OQS_KEM_encaps(kem.kem, &cipherTextBytes, &sharedSecretBytes, publicKey.baseAddress)}
  guard result == OQS_SUCCESS else {
    throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "OQS_KEM_encaps failed to derive a shared secret and ciphertext: \(result)")
  }

  return KyberEncapsulation(ciphertext: Data(cipherTextBytes).wrap(), sharedSecret: Data(sharedSecretBytes).wrap())
}

/// Decrypt the ciphertext with the private key to get the shared secret
///
/// - parameters:
///   - ciphertext: ciphertext to decrypt
///   - withPrivateKey: private key to derive the secret from the ciphertext
func kyberDecapsulate(ciphertext: Data, withPrivateKey privateKey: KyberPrivateKey) throws -> DataWrapper {
  try assertCorrectLength(of: privateKey.raw.data, withName: "private key", expectingLength: KYBER_PRIVATE_KEY_LENGTH)
  try assertCorrectLength(of: ciphertext, withName: "cipher text", expectingLength: KYBER_CIPHER_TEXT_LENGTH)

  let kem = KEM(method: OQS_KEM_alg_kyber_1024)

  var sharedSecretBytes = [UInt8](repeating: 0, count: KYBER_SHARED_SECRET_LENGTH)

  let result = privateKey.raw.data.withUnsafeBytes{privateKey in
    ciphertext.withUnsafeBytes{ciphertext in
        OQS_KEM_decaps(kem.kem, &sharedSecretBytes, ciphertext.baseAddress, privateKey.baseAddress)}}

  guard result == OQS_SUCCESS else {
    throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "OQS_KEM_encaps failed to derive a shared secret from ciphertext and private key: \(result)")
  }

  return Data(sharedSecretBytes).wrap()
}

private class KEM {
  let kem: UnsafeMutablePointer<OQS_KEM>
  init(method: String) {
    guard let result = OQS_KEM_new(method) else {
      fatalError("could not create OQS_KEM_new with OQS_KEM_alg_kyber_1024")
    }
    self.kem = result
  }
  deinit {
    OQS_KEM_free(self.kem)
  }
}

private func injectEntropy(seed: Data) {
  let result = seed.withUnsafeBytes{seed in TUTA_inject_entropy(seed.baseAddress, seed.count)}
  if result < 0 {
    NSLog("TUTA_inject_entropy injected too much entropy (%d returned)", result)
  }
}

private func assertCorrectLength(of data: Data, withName name: String, expectingLength: Int) throws {
  if data.count != expectingLength {
    throw TUTErrorFactory.createError(withDomain: TUT_CRYPTO_ERROR, message: "Incorrect \(name) length: \(expectingLength) expected, got \(data.count) instead")
  }
}
