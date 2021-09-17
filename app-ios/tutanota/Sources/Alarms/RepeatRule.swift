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

enum RepeatEndCondition {
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

struct EncryptedRepeatRule : Codable, Hashable {
  let frequency: String
  let interval: String
  let timeZone: String
  let endType: String
  let endValue: String?
}

struct RepeatRule {
  let frequency: RepeatPeriod
  let interval: Int
  let timeZone: String
  let endCondition: RepeatEndCondition
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
  }
}
