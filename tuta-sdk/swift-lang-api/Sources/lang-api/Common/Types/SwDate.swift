import Foundation

public final class SwDate: Sendable {
  private let inner: Date

  public required init(_ timeInMillis: TsDate) {
    self.inner = Date()
  }

  public static func now() throws -> SwDate {
    fatalError("not yet implemented!")
  }

  public static func getTime() -> TsInt {
    fatalError("not yet implemented!")
  }
}

public typealias TsDate = SwDate
