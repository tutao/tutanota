public class TutanotaError: Error {
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
