import Foundation

enum RepeatPeriod: Int, SimpleStringDecodable {
  case daily = 0
  case weekly
  case monthly
  case annually
}

enum EndType: Int, SimpleStringDecodable {
  case never = 0
  case count
  case untilDate
}

enum RepeatEndCondition : Equatable {
  case never
  case count(times: Int64)
  case untilDate(date: Date)

  init(endType: EndType, endValue: Int64) {
    switch endType {
    case .never:
      self = .never
    case .count:
      self = .count(times: endValue)
    case .untilDate:
      let seconds = Double(endValue) / 1000
      self = .untilDate(date: Date(timeIntervalSince1970: seconds))
    }
  }
}

struct EncryptedDateWrapper: Codable, Hashable {
  let date: Base64
}

struct EncryptedRepeatRule : Codable, Hashable {
  let frequency: Base64
  let interval: Base64
  let timeZone: Base64
  let endType: Base64
  let endValue: Base64?
  let excludedDates: [EncryptedDateWrapper]

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

    if let endValue = try container.decodeIfPresent((Base64?).self, forKey: .endValue) {
      self.endValue = endValue
    } else {
      self.endValue = nil
    }
  }
}

struct RepeatRule : Equatable {
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
    let endValue: Int64? = try encrypted.endValue.map { endValue in
      return try decrypt(base64: endValue, key: sessionKey)
    }
    self.endCondition = RepeatEndCondition(endType: endType, endValue: endValue ?? 0)
    let decryptedExclusions: [Date] = try encrypted.excludedDates.map { try decrypt(base64: $0.date, key: sessionKey) }
    self.excludedDates  = decryptedExclusions
  }
}
