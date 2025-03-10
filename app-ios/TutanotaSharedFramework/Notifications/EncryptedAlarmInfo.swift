public struct EncryptedAlarmInfo: Codable {
	public let alarmIdentifier: String
	public let trigger: Base64

	public init(alarmIdentifier: String, trigger: Base64) {
		self.alarmIdentifier = alarmIdentifier
		self.trigger = trigger
	}

    enum CodingKeys: String, CodingKey {
        case alarmIdentifier = "1539"
        case trigger = "1538"
    }
}
