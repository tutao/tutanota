import Foundation

let fPow: @Sendable (Decimal, Int) -> Decimal = pow

public typealias TsMath = SwMath
public class SwMath {
  public static func pow(_ base: SwNumber, _ power: SwNumber) throws -> SwNumber {
    let value = NSDecimalNumber(
      decimal: fPow(Decimal(base.inner), Int(power.inner))
    ).intValue
    return SwNumber(value)
  }
}
