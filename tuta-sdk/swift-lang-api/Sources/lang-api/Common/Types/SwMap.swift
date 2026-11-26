public final class SwMap<K: Hashable, V>: @unchecked Sendable {
  private var storage: [K: V] = [:]

  public init() {}

  public var size: Int {
    storage.count
  }

  public func set_notTheKeyword(_ key: K, _ value: V) {
    storage[key] = value
  }

  public func get_notTheKeyword(_ key: K) -> Nullable<V> {
    storage[key]
  }

  public func has(_ key: K) -> Bool {
    storage[key] != nil
  }

  @discardableResult
  public func delete(_ key: K) -> Bool {
    storage.removeValue(forKey: key) != nil
  }

  public func clear() {
    storage.removeAll()
  }
}
