public typealias Nullable<T> = T?
public typealias TsBoolean = Bool

public class TypeChecks {
  public static func isString(_ obj: Any) -> Bool {
    return true
  }
  public static func isNumber(_ obj: Any) -> Bool {
    return true
  }
  public static func isBoolean(_ obj: Any) -> Bool {
    return true
  }
  public static func isFunction(_ obj: Any) -> Bool {
    return false
  }
  public static func isObject(_ obj: Any) -> Bool {
    return true
  }
  public static func hasProperty(_ propertyName: SwString, parentObj: Any? = nil) -> Bool {
    if parentObj == nil {
      return propertyName.asPrimitiveString() == "env"
    }
    return false
  }
  public static func getTypeOf(_ obj: Any) -> SwString {
    if isString(obj) {
      return SwString("string")
    }
    if isNumber(obj) {
      return SwString("number")
    }
    if isBoolean(obj) {
      return SwString("boolean")
    }
    return SwString("object")
  }
}
