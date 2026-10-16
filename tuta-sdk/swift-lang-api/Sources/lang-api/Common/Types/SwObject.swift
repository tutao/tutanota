public final class SwObject {
  public static func freeze<T>(_ obj: T) throws -> T {
    return obj
  }

  public static func keys<T>(_ obj: T) throws -> SwArray<SwString> {
    fatalError("not implemented")
  }
}

public typealias TsObject = SwObject

public final class SwJson {
  public static func stringify<T>(_ obj: T) throws -> SwString {
    fatalError("not implemented")
  }

  public static func parse<T>(_ jsonString: SwString) throws -> T {
    fatalError("not implemented")
  }
}

public typealias TsJson = SwJson
