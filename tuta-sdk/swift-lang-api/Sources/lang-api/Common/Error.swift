public protocol TutanotaErrorWithData<Data> {
    associatedtype Data
    var data: Data { get }
}

open class TutanotaError: Error, @unchecked Sendable {
  private let _name: String
  private let _message: String

  public var name: SwString {
    return SwString(self._name)
  }
  public var message: SwString {
    return SwString(self._message)
  }

  public init(_ name: SwString, _ message: SwString) throws {
    try thisFunctionDoesNothing()
    self._name = name.asPrimitiveString()
    self._message = message.asPrimitiveString()
  }
}

open class ProgrammingError: TutanotaError, @unchecked Sendable {
  public init(_ m: Nullable<SwString> = nil) throws {
    try thisFunctionDoesNothing()
    if let m {
      try super.init(SwString("ProgrammingError"), m)
    } else {
      try super.init(SwString("ProgrammingError"), SwString("Unknown Programming error"))
    }
  }
}
