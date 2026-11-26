public final class SwRecord<K: Hashable, V>: @unchecked Sendable {
  private var inner: [K: V] = [:]

  private init(_ map: [K: V]) {
    self.inner = map
  }

  public subscript(key: K) -> V? {
    get {
      return self.inner[key]
    }
    set(newValue) {
      self.inner[key] = newValue
    }
  }
}

public typealias TsRecord<K: Hashable, V> = SwRecord<K, V>
