public typealias TsNumber = SwNumber
public final class SwNumber: Sendable, EquitableIsStructural, Hashable, Comparable {
  internal let inner: Double

  public init(_ value: Double) {
    self.inner = value
  }

  public init(_ value: Int) {
    self.inner = Double(value)
  }

  public static func < (lhs: SwNumber, rhs: SwNumber) -> Bool {
    return lhs.inner < rhs.inner
  }

  public static func == (lhs: SwNumber, rhs: SwNumber) -> Bool {
    return lhs.inner == rhs.inner
  }

  public static func * (lhs: SwNumber, rhs: SwNumber) -> SwNumber {
    return SwNumber(lhs.inner * rhs.inner)
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }
}
