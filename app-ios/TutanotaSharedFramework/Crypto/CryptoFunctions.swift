/// Wrapper for common crypto operations to aid injection/testing
public class CryptoFunctions {
	public init() {}

	public func aesGenerateKey() -> Data { TutanotaSharedFramework.aesGenerateKey() }

	public func aesDecryptData(_ data: Data, withKey key: Data) throws -> Data { try TutanotaSharedFramework.aesDecryptData(data, withKey: key) }

	public func aesDecryptKey(_ encryptedKey: Data, withKey key: Data) throws -> Data { try TutanotaSharedFramework.aesDecryptKey(encryptedKey, withKey: key) }

	public func aesEncryptData(_ data: Data, withKey key: Data, withIV iv: Data = TutanotaSharedFramework.aesGenerateIV()) throws -> Data {
		try TutanotaSharedFramework.aesEncryptData(data, withKey: key, withIV: iv)
	}

	public func aesEncryptKey(_ keyToBeEncrypted: Data, withKey key: Data) throws -> Data {
		try TutanotaSharedFramework.aesEncryptKey(keyToBeEncrypted, withKey: key)
	}
}
