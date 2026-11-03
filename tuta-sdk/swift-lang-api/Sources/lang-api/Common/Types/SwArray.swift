public final class SwArray<T>: @unchecked Sendable {
  private var inner: [T]

  public init(_ items: [T]) {
    self.inner = items
  }

  public init(_ items: T...) {
    self.inner = items
  }

  public static func from(_ items: T...) -> SwArray<T> {
    return SwArray(items)
  }

  public var length: SwInt {
    return SwInt(Int32(self.inner.count))
  }

  public func find(_ predicate: (T, SwInt, SwArray<T>) -> Bool) -> Nullable<T> {
    for (index, value) in self.inner.enumerated() {
      if predicate(value, SwInt(Int32(index)), self) {
        return value
      }
    }
    return nil
  }

  public func indexOf(_ searchElement: T, from: SwInt = SwInt(0)) -> SwInt {
    return SwInt(-1)
  }

  public func push(_ item: T) -> SwInt {
    self.inner.append(item)
    return self.length
  }

  public func map<U>(_ callback: (T) -> U) -> SwArray<U> {
    return SwArray<U>(self.inner.map { item in callback(item) })
  }
}

public typealias TsReadonlyArray<T> = SwArray<T>
public typealias TsArray<T> = SwArray<T>
public typealias SwList<T> = SwArray<T>
public typealias TsList<T> = SwArray<T>
