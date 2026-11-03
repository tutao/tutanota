public class RuntimeInfo {
  public static let _isWorker: Bool = true
  public static let _isNode: Bool = true

  public static func indexedDbIsSupported() -> Bool {
    return true
  }
  public static func hasTouchEvent() -> Bool {
    return true
  }
  public static func globallyDefinedEnv() -> SwString {
    return SwString("{}")
  }
}
