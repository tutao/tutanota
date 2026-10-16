open class TutanotaError<T>: Error, @unchecked Sendable {
  private let _name: String
  private let _message: String
  public let data: T

  public var name: SwString {
    return SwString(self._name)
  }
  public var message: SwString {
    return SwString(self._message)
  }

  public init(_ name: SwString, _ message: SwString, _ data: T) {
    self._name = name.asPrimitiveString()
    self._message = message.asPrimitiveString()
    self.data = data
  }
}

open class ProgrammingError: TutanotaError<Nullable<Never>>, @unchecked Sendable {
  public init(_ m: Nullable<SwString> = nil) {
    if let m {
      super.init(SwString("ProgrammingError"), m, nil)
    } else {
      super.init(SwString("ProgrammingError"), SwString("Unknown Programming error"), nil)
    }
  }
}
