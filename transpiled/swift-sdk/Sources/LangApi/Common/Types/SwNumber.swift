public typealias TsInt = SwInt
public final class SwInt: Sendable {
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
}

public typealias TsDouble = SwDouble
public final class SwDouble: Sendable {
  private let inner: Double

  public init(_ value: Double) {
    self.inner = value
  }

  public static func from(_ value: SwInt) -> TsDouble {
    return SwDouble(Double(value.asPrimitive()))
  }
}
