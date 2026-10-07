open class TutanotaError: Error, @unchecked Sendable {
  private let _name: String
  private let _message: String

  public var name: SwString {
    return SwString(self._name)
  }
  public var message: SwString {
    return SwString(self._message)
  }

  public init(_ name: SwString, _ message: SwString) {
    self._name = name.asPrimitiveString()
    self._message = message.asPrimitiveString()
  }
}

open class ProgrammingError: TutanotaError, @unchecked Sendable {
  public init(_ m: Nullable<SwString> = nil) {
    if let m {
      super.init(SwString("ProgrammingError"), m)
    } else {
      super.init(SwString("ProgrammingError"), SwString("Unknown Programming error"))
    }
  }
}
