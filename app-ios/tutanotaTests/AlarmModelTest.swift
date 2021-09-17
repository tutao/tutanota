import Foundation
import XCTest
@testable import tutanota

class AlarmModelTest : XCTestCase {
  func testIteratedRepeatAlarm() {
    let timeZone = "Europe/Berlin"
    let now = date(2019, 6, 2, 12, timeZone)
    let eventStart = date(2019, 6, 2, 12, timeZone)
    let eventEnd = date(2019, 6, 2, 12, timeZone)
    
    let repeatRule = RepeatRule(
      frequency: .weekly,
      interval: 1,
      timeZone: timeZone,
      endCondition: .never
    )
    
    var occurrences = [Date]()
    AlarmModel.iterateRepeatingAlarm(
      eventStart: eventStart,
      eventEnd: eventEnd,
      repeatRule: repeatRule,
      now: now,
      localTimeZone: TimeZone(identifier: timeZone)!,
      scheduleAhead: 4) { _, ocurrenceTime in
        occurrences.append(ocurrenceTime)
      }
    let expected = [
      date(2019, 6, 2, 12, timeZone),
      date(2019, 6, 9, 12, timeZone),
      date(2019, 6, 16, 12, timeZone),
      date(2019, 6, 23, 12, timeZone)
    ]
    XCTAssertEqual(occurrences, expected)
  }
  
  func testIteratesAlLDayeventWithEnd() {
    let timeZone = "Europe/Berlin"
    let repeatRuleTimeZone = "Asia/Anadyr"
    let now = date(2019, 5, 1, 0, timeZone)
    let eventStart = AlarmModel.allDayDateUTC(date: date(2019, 5, 1, 0, timeZone))
    let eventEnd = AlarmModel.allDayDateUTC(date: date(2019, 5, 2, 0, timeZone))
    let repeatEnd = AlarmModel.allDayDateUTC(date: date(2019, 5, 3, 0, timeZone))
    let repeatRule = RepeatRule(
      frequency: .daily,
      interval: 1,
      timeZone: repeatRuleTimeZone,
      endCondition: .untilDate(date: repeatEnd))
    
    var ocurrences = [Date]()
    AlarmModel.iterateRepeatingAlarm(
      eventStart: eventStart,
      eventEnd: eventEnd,
      repeatRule: repeatRule,
      now: now,
      localTimeZone: TimeZone(identifier: timeZone)!,
      scheduleAhead: 4) { _, occurrenceTime in
        ocurrences.append(occurrenceTime)
      }
    let expected = [
      date(2019, 5, 1, 0, timeZone),
      date(2019, 5, 2, 0, timeZone)
    ]
    XCTAssertEqual(ocurrences, expected)
  }
}

private func date(_ year: Int, _ month: Int, _ dayOfMonth: Int, _ hour: Int, _ timeZoneName: String) -> Date {
  let calendar = Calendar.current
  let timeZone = TimeZone(identifier: timeZoneName)
  var components = DateComponents()
  components.year = year
  components.month = month
  components.day = dayOfMonth
  components.hour = hour
  components.timeZone = timeZone
  
  return calendar.date(from: components)!
}
