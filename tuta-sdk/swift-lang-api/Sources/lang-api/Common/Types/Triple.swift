public struct Triple<First, Second, Third> {
  private let _first: First
  private let _second: Second
  private let _third: Third

  public init(_ first: First, _ second: Second, _ third: Third) {
    self._first = first
    self._second = second
    self._third = third
  }

  public func first() -> First {
    return self._first
  }

  public func second() -> Second {
    return self._second
  }

  public func third() -> Third {
    return self._third
  }
}
