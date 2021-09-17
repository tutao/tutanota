import Foundation

typealias AlarmIterationCallback = (Int, Date) -> Void

class AlarmModel {
  static func iterateRepeatingAlarm(
    eventStart: Date,
    eventEnd: Date,
    repeatRule: RepeatRule,
    now: Date,
    localTimeZone: TimeZone,
    scheduleAhead: Int,
    block:AlarmIterationCallback
  ) {
    var ocurrences = 0
    var ocurrencesAfterNow = 0
    var cal = Calendar.current
    let calendarUnit = Self.calendarUnit(for: repeatRule.frequency)
    
    let isAllDayEvent = Self.isAllDayEvent(startTime: eventStart, endTime: eventEnd)
    let calcEventStart = isAllDayEvent ? Self.allDayDateLocal(dateUTC: eventStart) : eventStart
    let endDate: Date?
    switch repeatRule.endCondition {
    case let .untilDate(valueDate):
      if (isAllDayEvent) {
        endDate = allDayDateLocal(dateUTC: valueDate)
      } else {
        endDate = valueDate
      }
    default:
      endDate = nil
    }
    
    cal.timeZone = isAllDayEvent ? localTimeZone : TimeZone(identifier: repeatRule.timeZone) ?? localTimeZone
    
    while ocurrencesAfterNow < scheduleAhead {
      if case let .count(n) = repeatRule.endCondition, ocurrences >= n {
        break
      }
      let ocurrenceDate = cal.date(
        byAdding: calendarUnit,
        value: repeatRule.interval * ocurrences,
        to: calcEventStart
      )!
      if let endDate = endDate, ocurrenceDate >= endDate  {
        break
      } else if ocurrenceDate >= now {
        block(ocurrences, ocurrenceDate)
        ocurrencesAfterNow += 1
      }
      ocurrences += 1
    }
  }
  
  static func alarmTime(trigger: String, eventTime: Date) -> Date {
    let cal = Calendar.current
    switch trigger {
    case "5M":
      return cal.date(byAdding: .minute, value: -5, to: eventTime)!
    case "10M":
      return cal.date(byAdding: .minute, value: -10, to: eventTime)!
    case "30M":
      return cal.date(byAdding: .minute, value: -30, to: eventTime)!
    case "1H":
      return cal.date(byAdding: .hour, value: -1, to: eventTime)!
    case "1D":
      return cal.date(byAdding: .day, value: -1, to: eventTime)!
    case "2D":
      return cal.date(byAdding: .day, value: -2, to: eventTime)!
    case "3D":
      return cal.date(byAdding: .day, value: -3, to: eventTime)!
    case "1W":
      return cal.date(byAdding: .weekOfYear, value: -1, to: eventTime)!
    default:
      return cal.date(byAdding: .minute, value: -5, to: eventTime)!
    }
  }
  
  static func allDayDateUTC(date: Date) -> Date {
    let calendar = Calendar.current
    var localComponents = calendar.dateComponents([.year, .month, .day], from: date)
    let timeZone = TimeZone(identifier: "UTC")!
    localComponents.timeZone = timeZone
    return calendar.date(from: localComponents)!
  }
  
  static func allDayDateLocal(dateUTC: Date) -> Date {
    var calendar = Calendar.current
    let timeZone = TimeZone(identifier: "UTC")!
    calendar.timeZone = timeZone
    let components = calendar.dateComponents([.year, .month, .day], from: dateUTC)
    calendar.timeZone = TimeZone.current
    return calendar.date(from: components)!
  }
  
  private static func calendarUnit(for repeatPeriod: RepeatPeriod) -> Calendar.Component {
    switch (repeatPeriod) {
    case .daily:
      return .day
    case .weekly:
      return .weekOfYear
    case .monthly:
      return .month
    case .annually:
      return .year
    }
  }
  
  private static func isAllDayEvent(startTime: Date, endTime: Date) -> Bool {
    var calendar = Calendar.current
    calendar.timeZone = TimeZone(abbreviation: "UTC")!
    
    let startComponents = calendar.dateComponents([.hour, .minute, .second], from: startTime)
    let passesStart = startComponents.hour == 0
    && startComponents.minute == 0
    && startComponents.second == 0
    
    let endCompoents = calendar.dateComponents([.hour, .minute,.second], from: endTime)
    let passesEnd = endCompoents.hour == 0
    && endCompoents.minute == 0
    && endCompoents.second == 0
    
    return passesStart && passesEnd
  }
}
