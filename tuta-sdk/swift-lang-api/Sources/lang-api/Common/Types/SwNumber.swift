public typealias TsNumber = SwNumber
public final class SwNumber: @unchecked Sendable, EquitableIsStructural, Hashable, Comparable,
  ToString
{
  internal var inner: Double

  internal var int: Int {
    return Int(self.inner)
  }

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

  public static prefix func - (value: SwNumber) -> SwNumber {
    return SwNumber(-value.inner)
  }

  public static func + (lhs: SwNumber, rhs: SwNumber) -> SwNumber {
    return SwNumber(lhs.inner + rhs.inner)
  }

  public static func - (lhs: SwNumber, rhs: SwNumber) -> SwNumber {
    return SwNumber(lhs.inner - rhs.inner)
  }

  public static func * (lhs: SwNumber, rhs: SwNumber) -> SwNumber {
    return SwNumber(lhs.inner * rhs.inner)
  }

  public static func / (lhs: SwNumber, rhs: SwNumber) -> SwNumber {
    return SwNumber(lhs.inner / rhs.inner)
  }

  public static func += (lhs: inout SwNumber, rhs: SwNumber) {
    lhs.inner += rhs.inner
    return
  }

  public static func -= (lhs: inout SwNumber, rhs: SwNumber) {
    lhs.inner -= rhs.inner
    return
  }

  public static func *= (lhs: inout SwNumber, rhs: SwNumber) {
    lhs.inner *= rhs.inner
    return
  }

  public static func /= (lhs: inout SwNumber, rhs: SwNumber) {
    lhs.inner /= rhs.inner
    return
  }

  @discardableResult
  public static prefix func ++ (value: inout SwNumber) -> SwNumber {
    value.inner += 1
    return value
  }

  @discardableResult
  public static postfix func ++ (value: inout SwNumber) -> SwNumber {
    let oldValue = value
    value.inner += 1
    return oldValue
  }

  @discardableResult
  public static prefix func -- (value: inout SwNumber) -> SwNumber {
    value.inner -= 1
    return value
  }

  @discardableResult
  public static postfix func -- (value: inout SwNumber) -> SwNumber {
    let oldValue = value
    value.inner -= 1
    return oldValue
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }

  public func toString() -> SwString {
    return SwString(String(self.inner))
  }

  public func toOurString() -> SwString {
    return toString()
  }
}
