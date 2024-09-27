import Foundation

public protocol DateProvider {
	var now: Date { get }
	var timeZone: TimeZone { get }
}

public class SystemDateProvider: DateProvider {
	public init() {}
	public var now: Date { get { Date() } }

	public var timeZone: TimeZone { get { TimeZone.current } }
}
