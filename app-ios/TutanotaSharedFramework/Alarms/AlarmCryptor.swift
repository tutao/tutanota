import Foundation

public protocol AlarmCryptor {
	func decrypt(alarm: EncryptedAlarmNotification) throws -> AlarmNotification
	func storeNewDeviceSessionKey(pushIdentifierId: String, sessionKey: Key) throws
}

public class KeychainAlarmCryptor: AlarmCryptor {
	private let keychainManager: KeychainManager

	public init(keychainManager: KeychainManager) { self.keychainManager = keychainManager }

	public func decrypt(alarm encAlarmNotification: EncryptedAlarmNotification) throws -> AlarmNotification {
		let sessionKey = self.resolveSessionkey(alarmNotification: encAlarmNotification)
		guard let sessionKey else { throw TUTErrorFactory.createError("Cannot resolve session key") }
		return try AlarmNotification(encrypted: encAlarmNotification, sessionKey: sessionKey)
	}

	private func resolveSessionkey(alarmNotification: EncryptedAlarmNotification) -> Key? {
		var lastError: Error?
		for notificationSessionKey in alarmNotification.notificationSessionKeys {
			do {
				let pushIdentifierSessionKey = try self.keychainManager.getKey(keyId: notificationSessionKey.getPushIdentifier().elementId)
				guard let pushIdentifierSessionKey else { continue }
				let encSessionKey = Data(base64Encoded: notificationSessionKey.pushIdentifierSessionEncSessionKey)!
				return try aesDecryptKey(encSessionKey, withKey: pushIdentifierSessionKey)
			} catch {
				TUTSLog("Failed to decrypt key \(notificationSessionKey.getPushIdentifier().elementId) \(error)")
				lastError = error
			}
		}
		TUTSLog("Failed to resolve session key \(alarmNotification.getAlarmInfo().alarmIdentifier), last error: \(String(describing: lastError))")
		return nil
	}
	public func storeNewDeviceSessionKey(pushIdentifierId: String, sessionKey: Key) throws {
		try self.keychainManager.storeKey(sessionKey, withId: pushIdentifierId)
	}
}
