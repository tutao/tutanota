public final class SwObject {
  public static func freeze<T>(_ obj: T) -> T {
    return obj
  }

  public static func keys<T>(_ obj: T) -> SwArray<SwString> {
    fatalError("not implemented")
  }
}

public typealias TsObject = SwObject

public final class SwJson {
  public static func stringify<T>(_ obj: T) -> SwString {
    fatalError("not implemented")
  }

  public static func parse<T>(_ jsonString: SwString) -> T {
    fatalError("not implemented")
  }
}

public typealias TsJson = SwJson
