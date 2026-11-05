import Foundation

public final class SwSet<T: Hashable>: @unchecked Sendable {
  private var inner: Set<T>

  public required init(_ items: T...) {
    self.inner = Set(minimumCapacity: items.count)
    for item in items {
      self.inner.insert(item)
    }
  }
}
