import Foundation

typealias Base64 = String

struct EncryptedAlarmNotification : Codable {
  let operation: Operation
  let summary: Base64
  let eventStart: Base64
  let eventEnd: Base64
  let alarmInfo: EncryptedAlarmInfo
  let repeatRule: EncryptedRepeatRule?
  let notificationSessionKeys: [NotificationSessionKey]
  let user: Base64
}

extension EncryptedAlarmNotification: Equatable {
  static func == (lhs: EncryptedAlarmNotification, rhs: EncryptedAlarmNotification) -> Bool {
    return lhs.alarmInfo.alarmIdentifier == rhs.alarmInfo.alarmIdentifier
  }
}

extension EncryptedAlarmNotification: Hashable {
  func hash(into hasher: inout Hasher) {
    self.alarmInfo.alarmIdentifier.hash(into: &hasher)
  }
}

struct AlarmNotification {
  let operation: Operation
  let summary: String
  let eventStart: Date
  let eventEnd: Date
  let alarmInfo: AlarmInfo
  let repeatRule: RepeatRule?
  let user: String
}

extension AlarmNotification {
  init(encrypted: EncryptedAlarmNotification, sessionKey: Key) throws {
    let repeatRule: RepeatRule?
    if let encRepeatRule = encrypted.repeatRule {
      repeatRule = try RepeatRule(encrypted: encRepeatRule, sessionKey: sessionKey)
    } else {
      repeatRule = nil
    }
    self.init(
      operation: encrypted.operation,
      summary: try decrypt(base64: encrypted.summary, key: sessionKey),
      eventStart: try decrypt(base64: encrypted.eventStart, key: sessionKey),
      eventEnd: try decrypt(base64: encrypted.eventEnd, key: sessionKey),
      alarmInfo: try AlarmInfo(encrypted: encrypted.alarmInfo, sessionKey: sessionKey),
      repeatRule: repeatRule,
      user: encrypted.user
    )
  }
}
