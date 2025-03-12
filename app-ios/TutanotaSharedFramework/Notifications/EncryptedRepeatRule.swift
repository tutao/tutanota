import Foundation
import tutasdk

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

public enum ByRuleType: String, Codable, Equatable, SimpleStringDecodable {
	case byminute
	case byhour
	case byday
	case bymonthday
	case byyearday
	case byweekno
	case bymonth
	case bysetpos
	case wkst

	public init(value: String) throws {
		switch value {
		case "0": self = .byminute
		case "1": self = .byhour
		case "2": self = .byday
		case "3": self = .bymonthday
		case "4": self = .byyearday
		case "5": self = .byweekno
		case "6": self = .bymonth
		case "7": self = .bysetpos
		case "8": self = .wkst
		default: throw TUTErrorFactory.createError("Invalid ByRuleType")
		}
	}
}

public struct EncryptedDateWrapper: Codable, Hashable {
    public let date: Base64

    enum CodingKeys: String, CodingKey {
        case date = "2075"
    }
}
public struct EncryptedAdvancedRuleWrapper: Codable, Hashable {
	public let ruleType: String
	public let interval: String

	enum CodingKeys: String, CodingKey {
        case interval = "2524"
        case ruleType = "2523"
    }
}
public struct AdvancedRule: Codable, Hashable {
	public let ruleType: ByRuleType
	public let interval: String

	public func toSDKRule() -> ByRule { ByRule(byRule: self.ruleType.toSDKType(), interval: self.interval) }
}

extension ByRuleType {
	func toSDKType() -> tutasdk.ByRuleType {
		switch self {
		case .byminute: return tutasdk.ByRuleType.byMinute
		case .byhour: return tutasdk.ByRuleType.byHour
		case .byday: return tutasdk.ByRuleType.byDay
		case .bymonth: return tutasdk.ByRuleType.byMonth
		case .bymonthday: return tutasdk.ByRuleType.byMonthday
		case .byyearday: return tutasdk.ByRuleType.byYearDay
		case .byweekno: return tutasdk.ByRuleType.byWeekNo
		case .bysetpos: return tutasdk.ByRuleType.bySetPos
		case .wkst: return tutasdk.ByRuleType.wkst
		}
	}
}

public struct EncryptedRepeatRule: Codable, Hashable {
	public let frequency: Base64
	public let interval: Base64
	public let timeZone: Base64
	public let endType: Base64
	public let endValue: Base64?
	public let excludedDates: [EncryptedDateWrapper]
	public let advancedRules: [EncryptedAdvancedRuleWrapper]

	public init(from decoder: Decoder) throws {
		let container = try decoder.container(keyedBy: CodingKeys.self)
		if let excludedDates = try container.decodeIfPresent([EncryptedDateWrapper].self, forKey: .excludedDates) {
			self.excludedDates = excludedDates
		} else {
			self.excludedDates = [EncryptedDateWrapper]()
		}

		if let advancedRules = try container.decodeIfPresent([EncryptedAdvancedRuleWrapper].self, forKey: .advancedRules) {
			self.advancedRules = advancedRules
		} else {
			self.advancedRules = [EncryptedAdvancedRuleWrapper]()
		}

		self.frequency = try container.decode(Base64.self, forKey: .frequency)
		self.interval = try container.decode(Base64.self, forKey: .interval)
		self.timeZone = try container.decode(Base64.self, forKey: .timeZone)
		self.endType = try container.decode(Base64.self, forKey: .endType)

		if let endValue = try container.decodeIfPresent((Base64?).self, forKey: .endValue) { self.endValue = endValue } else { self.endValue = nil }
	}


    enum CodingKeys: String, CodingKey {
        case frequency = "1559"
        case interval = "1562"
        case timeZone = "1563"
        case endType = "1560"
        case endValue = "1561"
        case excludedDates = "2076"
        case advancedRules = "2525"
    }
}
