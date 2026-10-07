public final class Promise<T> {
  public func await() -> T {
    fatalError("not implemented")
  }

  public func then<R>(_ action: (T) -> R) -> Promise<R> {
    fatalError("not implemented")
  }

  public func `catch`<R>(_ action: (TutanotaError) -> R) -> Promise<R> {
    fatalError("not implemented")
  }
}
