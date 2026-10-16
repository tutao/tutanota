public final class SwRecord<Key, Value>: Sendable {
  public func keys() -> [Key] {
    fatalError("not implemented")
  }

  public func values() -> [Value] {
    fatalError("not implemented")
  }

  public func entries() -> [(Key, Value)] {
    fatalError("not implemented")
  }
}

public typealias TsRecord<Key, Value> = SwRecord<Key, Value>
