public final class SwString: Sendable {
  private let inner: String

  public required init(_ val: String) {
    self.inner = val
  }
}
