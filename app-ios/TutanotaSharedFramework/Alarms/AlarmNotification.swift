public struct AlarmNotification: Equatable {
	let operation: TutanotaSharedFramework.Operation
	let summary: String
	let eventStart: Date
	let eventEnd: Date
	let alarmInfo: AlarmInfo
	let repeatRule: RepeatRule?
	let user: String
}

public extension AlarmNotification {
	var identifier: String { get { alarmInfo.alarmIdentifer } }

	init(encrypted: EncryptedAlarmNotification, sessionKey: Key) throws {
		let repeatRule: RepeatRule?
		if let encRepeatRule = encrypted.repeatRule { repeatRule = try RepeatRule(encrypted: encRepeatRule, sessionKey: sessionKey) } else { repeatRule = nil }
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
