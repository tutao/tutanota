public class console {
  private static func write(_ items: Any...) {
    print(items.map { "\($0)" }.joined(separator: " "))
  }

  public static func log(_ items: Any...) {
    write(items)
  }

  public static func warn(_ items: Any...) {
    write(["W"] + items)
  }

  public static func error(_ items: Any...) {
    write(["E"] + items)
  }

  public static func debug(_ items: Any...) {
    write(["D"] + items)
  }

  public static func trace(_ items: Any...) {
    write(["T"] + items)
  }
}
