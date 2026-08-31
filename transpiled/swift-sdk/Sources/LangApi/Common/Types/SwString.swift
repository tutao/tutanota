public final class SwString: Sendable {
  private let inner: String

  public required init(_ val: String) {
    self.inner = val
  }

  public func asPrimitiveString() -> String {
    return self.inner
  }
}

public typealias TsString = SwString
