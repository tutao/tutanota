public class RuntimeInfo {

  public static func indexedDbIsSupported() -> Bool {
    return true
  }
  public static func hasTouchEvent() -> Bool {
    return true
  }
  public static func globallyDefinedEnv<E>() -> Nullable<E> {
    return nil
  }
}
