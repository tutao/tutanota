import Foundation

public enum RepeatPeriod: Int, SimpleStringDecodable {
	case daily = 0
	case weekly
	case monthly
	case annually
}

public enum EndType: Int, SimpleStringDecodable {
	case never = 0
	case count
	case untilDate
}

public enum RepeatEndCondition: Equatable {
	case never
	case count(times: Int64)
	case untilDate(date: Date)

	public init(endType: EndType, endValue: Int64) {
		switch endType {
		case .never: self = .never
		case .count: self = .count(times: endValue)
		case .untilDate:
			let seconds = Double(endValue) / 1000
			self = .untilDate(date: Date(timeIntervalSince1970: seconds))
		}
	}
}

public struct EncryptedDateWrapper: Codable, Hashable { public let date: Base64 }

public struct EncryptedRepeatRule: Codable, Hashable {
	public let frequency: Base64
	public let interval: Base64
	public let timeZone: Base64
	public let endType: Base64
	public let endValue: Base64?
	public let excludedDates: [EncryptedDateWrapper]

	public init(from decoder: Decoder) throws {
		let container = try decoder.container(keyedBy: CodingKeys.self)
		if let excludedDates = try container.decodeIfPresent([EncryptedDateWrapper].self, forKey: .excludedDates) {
			self.excludedDates = excludedDates
		} else {
			self.excludedDates = [EncryptedDateWrapper]()
		}

		self.frequency = try container.decode(Base64.self, forKey: .frequency)
		self.interval = try container.decode(Base64.self, forKey: .interval)
		self.timeZone = try container.decode(Base64.self, forKey: .timeZone)
		self.endType = try container.decode(Base64.self, forKey: .endType)

		if let endValue = try container.decodeIfPresent((Base64?).self, forKey: .endValue) { self.endValue = endValue } else { self.endValue = nil }
	}
}
