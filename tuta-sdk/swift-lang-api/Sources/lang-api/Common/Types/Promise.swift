public final class Promise<T> {
  public let value: Nullable<T>

  public init(value: T) {
    self.value = value
  }
  public func await() async -> T {
    fatalError("not implemented")
  }

  public func then<R>(_ action: (T) throws -> R) rethrows -> Promise<R> {
    fatalError("not implemented")
  }

  public func `catch`<R>(_ action: (TutanotaError) throws -> R) rethrows -> Promise<R> {
    fatalError("not implemented")
  }

  public static func resolve(_ value: Promise<T>) -> Promise<T> {
    return value
  }

  public static func resolve(_ value: T) -> Promise<T> {
    return Promise(value: value)
  }

  public func finally(_ action: () throws -> Void) rethrows -> Promise<T>{
    fatalError("not implemented")
  }
}
