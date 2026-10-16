import Foundation

public final class SwSet<T: Hashable>: @unchecked Sendable {
  private var inner: Set<T>

  private init(_ inner: Set<T>) {
      self.inner = inner
  }

  public required init(_ items: T...) {
    self.inner = Set(minimumCapacity: items.count)
    for item in items {
      self.inner.insert(item)
    }
  }

  public var size: SwInt {
      get {
          return SwInt(self.inner.count)
      }
  }

  public func add(_ value: T) -> SwSet<T> {
      self.inner.insert(value)
      return self
  }

  public func clear() -> Void {
      self.inner.removeAll()
  }

  public func delete(_ value: T) -> Bool {
      return self.inner.remove(value) != nil
  }

  public func difference(_ other: SwSet<T>) -> SwSet<T> {
      return SwSet(self.inner.subtracting(other.inner))
  }

  // public func entries() -> SwIterator<SwArray<T>> {
    // TODO
  // }

  public func forEach(_ callback: (_ value: T, _ key: T, _ set: SwSet<T>) -> Void) -> Void {
      self.inner.forEach { value in
          callback(value, value, self)
      }
  }

  public func has(_ value: T) -> Bool {
      return self.inner.contains(value)
  }

  public func intersection(_ other: SwSet<T>) -> SwSet<T> {
      return SwSet(self.inner.intersection(other.inner))
  }

  public func isDisjointFrom(_ other: SwSet<T>) -> Bool {
      return self.inner.isDisjoint(with: other.inner)
  }

  public func isSubsetOf(_ other: SwSet<T>) -> Bool {
      return self.inner.isSubset(of: other.inner)
  }

  public func isSupersetOf(_ other: SwSet<T>) -> Bool {
      return self.inner.isSuperset(of: other.inner)
  }

  // public func keys() -> SwIterator<T> {
    // return self.values()
  // }

  public func symmetricDifference(_ other: SwSet<T>) -> SwSet<T> {
      return SwSet(self.inner.symmetricDifference(other.inner))
  }

  public func union(_ other: SwSet<T>) -> SwSet<T> {
      return SwSet(self.inner.union(other.inner))
  }

  // public func values() -> SwIterator<T> {
    // TODO
  //}
}
