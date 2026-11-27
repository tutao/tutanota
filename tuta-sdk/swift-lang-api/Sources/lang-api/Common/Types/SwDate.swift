import Foundation

public final class SwDate: Sendable {
  private let inner: Date

  private init(_ date: Date) {
    self.inner = date
  }

  public convenience init() {
    self.init(Date.now)
  }

  public convenience init(_ value: SwNumber) {
    self.init(Date(timeIntervalSince1970: Double(value.inner) / 1_000))
  }

  public func getTime() -> SwNumber {
    return SwNumber(Int(self.inner.timeIntervalSince1970 * 1_000))
  }

  public static func now() -> SwNumber {
    return SwDate().getTime()
  }
}

public typealias TsDate = SwDate
