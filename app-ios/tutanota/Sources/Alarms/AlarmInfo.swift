import Foundation

struct EncryptedAlarmInfo : Codable {
  let alarmIdentifier: String
  let trigger: Base64
}

struct AlarmInfo {
  let alarmIdentifer: String
  let trigger: String
}

extension AlarmInfo {
  init(encrypted: EncryptedAlarmInfo, sessionKey: Key) throws {
    self.alarmIdentifer = encrypted.alarmIdentifier
    self.trigger = try decrypt(base64: encrypted.trigger, key: sessionKey)
  }
}
