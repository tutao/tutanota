public typealias Base64 = String

/// Alarm notification as received from the server. Also peristed.
/// Contains both signaling about the event (opeartion) and the payload itself
public struct EncryptedAlarmNotification: Codable {
	public let operation: Operation
	public let summary: Base64
	public let eventStart: Base64
	public let eventEnd: Base64
	public let alarmInfo: EncryptedAlarmInfo
	public let repeatRule: EncryptedRepeatRule?
	public let notificationSessionKeys: [NotificationSessionKey]
	public let user: Base64
}

extension EncryptedAlarmNotification: Equatable {
	public static func == (lhs: EncryptedAlarmNotification, rhs: EncryptedAlarmNotification) -> Bool {
		lhs.alarmInfo.alarmIdentifier == rhs.alarmInfo.alarmIdentifier
	}
}

extension EncryptedAlarmNotification: Hashable { public func hash(into hasher: inout Hasher) { self.alarmInfo.alarmIdentifier.hash(into: &hasher) } }
