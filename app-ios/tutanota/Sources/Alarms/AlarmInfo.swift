import Foundation

struct EncryptedAlarmInfo : Codable {
  let alarmIdentifier: String
  let trigger: Base64
}

struct AlarmInfo : Equatable {
  /// Unique identifier of the alarm
  let alarmIdentifer: String
  /// How long before the event should alarm fire.
  /// Contains values like in ical spec (e.g. 5M or 3D) but we only support certain subset of it
  let trigger: String
}

extension AlarmInfo {
  init(encrypted: EncryptedAlarmInfo, sessionKey: Key) throws {
    self.alarmIdentifer = encrypted.alarmIdentifier
    self.trigger = try decrypt(base64: encrypted.trigger, key: sessionKey)
  }
}
