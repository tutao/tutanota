struct RepeatRule: Equatable {
	let frequency: RepeatPeriod
	let interval: Int
	let timeZone: String
	let endCondition: RepeatEndCondition
	let excludedDates: [Date]
}

extension RepeatRule {
	init(encrypted: EncryptedRepeatRule, sessionKey: Key) throws {
		self.frequency = try decrypt(base64: encrypted.frequency, key: sessionKey)
		self.interval = try decrypt(base64: encrypted.interval, key: sessionKey)
		self.timeZone = try decrypt(base64: encrypted.timeZone, key: sessionKey)
		let endType: EndType = try decrypt(base64: encrypted.endType, key: sessionKey)
		let endValue: Int64? = try encrypted.endValue.map { endValue in try decrypt(base64: endValue, key: sessionKey) }
		self.endCondition = RepeatEndCondition(endType: endType, endValue: endValue ?? 0)
		let decryptedExclusions: [Date] = try encrypted.excludedDates.map { try decrypt(base64: $0.date, key: sessionKey) }
		self.excludedDates = decryptedExclusions
	}
}
