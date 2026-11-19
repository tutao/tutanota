import Foundation

let fPow: @Sendable (Decimal, Int) -> Decimal = pow

public typealias TsMath = SwMath
public class SwMath {
  public static func pow(_ base: SwInt, _ power: SwInt) throws -> SwInt {
    let value = NSDecimalNumber(
      decimal: fPow(Decimal(base.asPrimitive()), Int(power.asPrimitive()))
    ).intValue
    return SwInt(value)
  }
}
