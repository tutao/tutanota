public struct Tuple<First, Second> {
  private let _first: First
  private let _second: Second

  public init(_ first: First, _ second: Second) {
    self._first = first
    self._second = second
  }

  public func first() -> First {
    return self._first
  }

  public func second() -> Second {
    return self._second
  }
}
