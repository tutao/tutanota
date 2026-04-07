import Foundation
public import Mockable

@Mockable public protocol DateProvider: Sendable {
	var now: Date { get }
	var timeZone: TimeZone { get }
}

public final class SystemDateProvider: DateProvider {
	public init() {}
	public var now: Date { get { Date() } }

	public var timeZone: TimeZone { get { TimeZone.current } }
}
