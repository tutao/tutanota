public typealias TsInt = SwInt
public final class SwInt: Sendable, EquitableIsStructural, Hashable, Comparable {
  private let inner: Int32

  public init(_ value: Int32) {
    self.inner = value
  }

  public static func fromFloat(_ value: Float) -> SwInt {
    return SwInt(Int32(value))
  }

  public static func parseInt(_ str: SwString) -> SwInt {
    return SwInt(Int32(str.asPrimitiveString()) ?? 0)
  }

  public static func isNaN(_ num: SwInt) -> Bool {
    return false
  }

  public func asPrimitive() -> Int32 {
    return self.inner
  }

  public static func + (lhs: SwInt, rhs: SwInt) -> SwInt {
    return SwInt(lhs.inner + rhs.inner)
  }

  public static func - (lhs: SwInt, rhs: SwInt) -> SwInt {
    return SwInt(lhs.inner - rhs.inner)
  }

  public static func * (lhs: SwInt, rhs: SwInt) -> SwInt {
    return SwInt(lhs.inner * rhs.inner)
  }

  public static prefix func - (value: SwInt) -> SwInt {
    return SwInt(-value.inner)
  }

  public static func < (lhs: SwInt, rhs: SwInt) -> Bool {
    return lhs.inner < rhs.inner
  }

  public static func == (lhs: SwInt, rhs: SwInt) -> Bool {
    return lhs.inner == rhs.inner
  }

  public static func += (lhs: inout SwInt, rhs: SwInt) -> SwInt {
    let sum = lhs.inner + rhs.inner
    lhs = SwInt(sum)
    return lhs
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }
}

public typealias TsDouble = SwDouble
public final class SwDouble: Sendable, EquitableIsStructural, Hashable, Comparable {
  private let inner: Double

  public init(_ value: Double) {
    self.inner = value
  }

  public static func from(_ value: SwInt) -> TsDouble {
    return SwDouble(Double(value.asPrimitive()))
  }

  public static func from(_ value: Double) -> TsDouble {
    return SwDouble(value)
  }

  public static func parseDouble(_ str: SwString) -> SwDouble {
    return SwDouble(Double(str.asPrimitiveString()) ?? Double.nan)
  }

  public func asPrimitive() -> Double {
    return self.inner
  }

  public static func < (lhs: SwDouble, rhs: SwDouble) -> Bool {
    return lhs.inner < rhs.inner
  }

  public static func < (lhs: SwDouble, rhs: SwInt) -> Bool {
    return lhs.inner < Double(rhs.asPrimitive())
  }

  public static func == (lhs: SwDouble, rhs: SwDouble) -> Bool {
    return lhs.inner == rhs.inner
  }

  public static func == (lhs: SwDouble, rhs: SwInt) -> Bool {
    return lhs.inner == Double(rhs.asPrimitive())
  }

  public static func <= (lhs: SwDouble, rhs: SwInt) -> Bool {
    return lhs.inner <= Double(rhs.asPrimitive())
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }
}
