import Foundation

protocol DateProvider {
	var now: Date { get }
	var timeZone: TimeZone { get }
}

class SystemDateProvider: DateProvider {
	var now: Date { get { Date() } }

	var timeZone: TimeZone { get { TimeZone.current } }
}
