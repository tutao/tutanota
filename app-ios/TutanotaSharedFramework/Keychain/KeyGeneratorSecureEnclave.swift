import Foundation
import LocalAuthentication

/// Secure enclave and also CryptoTokenKit are unavailable in the simulator. We need to conditionally compile based on the target environment
/// otherwise the app will crash in the simulator when it tries to load the dynamic lib
public class KeyGenerator {
	public init() {}

	func generateKey(tag: String, accessControl: SecAccessControl) throws -> SecKey {
		var attributes: [String: Any] = [
			kSecAttrKeyType as String: kSecAttrKeyTypeEC, kSecAttrKeySizeInBits as String: 256, kSecAttrAccessControl as String: accessControl,
			kSecPrivateKeyAttrs as String: [kSecAttrIsPermanent as String: true, kSecAttrApplicationTag as String: tag],
		]
		#if !targetEnvironment(simulator)
			attributes[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
		#endif

		var error: Unmanaged<CFError>?
		guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
			let e = error!.takeRetainedValue() as Error as NSError
			let tutanotaError = TUTErrorFactory.wrapNativeError(withDomain: TUT_ERROR_DOMAIN, message: "Failed to generate data key for \(tag)", error: e)
			throw tutanotaError
		}
		return privateKey

	}
}
