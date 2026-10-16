public final class SwArray<T>: @unchecked Sendable, Sequence {
  public typealias Element = T
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

  public subscript(_ index: SwInt) -> T {
    get {
      fatalError("not yet implemented!")
    }
    set {
      fatalError("not yet implemented")
    }
  }

  public var length: SwInt {
    return SwInt(self.inner.count)
  }

  public func at(_ index: SwInt) throws -> Nullable<T> {
    if index.asPrimitive() > self.inner.count {
      return nil
    }
    return self.inner[index.asPrimitive()]
  }

  public func first() throws -> T {
    return self.inner[0]
  }
  public func second() throws -> T {
    return self.inner[1]
  }
  public func third() throws -> T {
    return self.inner[2]
  }

  public func atUnchecked(_ index: SwInt) -> T {
    return self.inner[0]
  }

  public func find(_ predicate: (T, SwInt, SwArray<T>) throws -> Bool) rethrows -> Nullable<T> {
    for (index, value) in self.inner.enumerated() {
      if try predicate(value, SwInt(index), self) {
        return value
      }
    }
    return nil
  }

  public func find(_ predicate: (T, SwInt) throws -> Bool) rethrows -> Nullable<T> {
    return try self.find({ (_ value, _ index, _ array) throws in try predicate(value, index) })
  }

  public func find(_ predicate: (T) throws -> Bool) rethrows -> Nullable<T> {
    return try self.find({ (_ value, _ index, _ array) throws in try predicate(value) })
  }

  public func includes(_ hay: SwString) throws -> Bool {
    fatalError("not yet implemented!")
  }

  public func indexOf(_ searchElement: T, from: SwInt = SwInt(0)) -> SwInt {
    return SwInt(-1)
  }

  public func makeIterator() -> IndexingIterator<[Element]> {
    self.inner.makeIterator()
  }

  public func push(_ item: T) -> SwInt {
    self.inner.append(item)
    return self.length
  }

  public func map<R>(_ mapper: (T) throws -> R) rethrows -> SwArray<R> {
    return SwArray<R>(try self.inner.map(mapper))
  }

  public func flatMap<R>(_ mapper: (T) throws -> SwArray<R>) rethrows -> SwArray<R> {
    return SwArray<R>(try self.inner.flatMap(mapper))
  }

  public func filter(_ predicate: (T) throws -> Bool) rethrows -> SwArray<T> {
    return SwArray<T>(try self.inner.filter(predicate))
  }

  public func some(_ predicate: (T) throws -> Bool) rethrows -> Bool {
    return try self.inner.contains(where: predicate)
  }

  public func every(_ predicate: (T) throws -> Bool) rethrows -> Bool {
    fatalError("not yet implemented")
  }

  public func findIndex(_ predicate: (T) throws -> Bool) rethrows -> SwInt {
    fatalError("not yet implemented")
  }

  public func slice(_ start: SwInt, _ count: Nullable<SwInt> = nil) throws -> SwArray<T> {
    fatalError("not yet implemented")
  }

  public func splice(_ start: SwInt, _ deleteCound: Nullable<SwInt> = nil, _ itemsToAdd: T...)
    throws -> SwArray<T>
  {
    // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    fatalError("not yet implemented")
  }

  public func join(_ s: SwString) throws -> SwString {
    fatalError("not yet implemented")
  }

  public func concat(_ other: SwArray<T>) -> SwArray<T> {
    fatalError("not yet implemented!")
  }

  public func shift() throws -> Nullable<T> {
    fatalError("not yet implemented!")
  }

  public func pop() throws -> Nullable<T> {
    fatalError("not yet implemented!")
  }

  public func sort(_ sortingFn: (T, T) throws -> SwInt) rethrows -> SwArray<T> {
    fatalError("not yet implemented!")
  }

  public func reverse() -> SwArray {
    fatalError("not yet implemented!")
  }
}

public typealias TsReadonlyArray<T> = SwArray<T>
public typealias TsArray<T> = SwArray<T>
public typealias SwList<T> = SwArray<T>
public typealias TsList<T> = SwArray<T>
