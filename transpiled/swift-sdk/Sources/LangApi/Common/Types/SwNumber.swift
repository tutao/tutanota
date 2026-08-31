public typealias TsInt = SwInt
public final class SwInt: Sendable, EquitableIsStructural, Hashable {
  private let inner: Int32

  public init(_ value: Int32) {
    self.inner = value
  }

  public static func * (lhs: SwInt, rhs: SwInt) -> SwInt {
    return SwInt(lhs.inner * rhs.inner)
  }

  public static func - (_ left: SwInt, _ right: SwInt) -> SwInt {
    return SwInt(left.inner - right.inner)
  }
  public func asPrimitive() -> Int32 {
    return self.inner
  }

  public static func == (lhs: SwInt, rhs: SwInt) -> Bool {
    return lhs.inner == rhs.inner
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }
}

public typealias TsDouble = SwDouble
public final class SwDouble: Sendable, EquitableIsStructural, Hashable {
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

  public static func == (lhs: SwDouble, rhs: SwDouble) -> Bool {
    return lhs.inner == rhs.inner
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }
}
