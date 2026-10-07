public protocol NumberBasedEnum {
  var __tsValue: SwInt { get }
}

public protocol StringBasedEnum {
  var __tsValue: SwString { get }
}

public final class LangApiEnum {
  public static func getStringEnumValue<E: StringBasedEnum>(_ value: E) -> SwString {
    return value.__tsValue
  }

  public static func getNumericEnumValue<E: NumberBasedEnum>(_ value: E) -> SwInt {
    return value.__tsValue
  }
}
