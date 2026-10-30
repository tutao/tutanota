public final class Promise<T> {
  public let value: Nullable<T>

  public init(value: T) {
    self.value = value
  }
  public func await() async -> T {
    fatalError("not implemented")
  }

  public func then<R>(_ action: (T) -> R) -> Promise<R> {
    fatalError("not implemented")
  }

  public func `catch`<R>(_ action: (TutanotaError) -> R) -> Promise<R> {
    fatalError("not implemented")
  }

  public static func resolve(_ value: Promise<T>) -> Promise<T> {
    return value
  }

  public static func resolve(_ value: T) -> Promise<T> {
    return Promise(value: value)
  }
}
