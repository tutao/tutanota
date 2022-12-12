class CancelledError : TutanotaError {
  init(message: String, underlyingError: Error) {
    super.init(message: message, underlyingError: underlyingError)
  }

  override var name: String {
    get {
      return "de.tutao.tutanota.CancelledError"
    }
  }
}
