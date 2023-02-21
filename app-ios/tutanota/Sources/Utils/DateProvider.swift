import Foundation

protocol DateProvider {
  var now: Date { get }
  var timeZone: TimeZone { get }
}

class SystemDateProvider : DateProvider {
  var now: Date {
    get {
      return Date()
    }
  }
  
  var timeZone: TimeZone {
    get {
      return TimeZone.current
    }
  }
}
