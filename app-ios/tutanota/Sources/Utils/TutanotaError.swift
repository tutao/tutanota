import Foundation

class TutanotaError : Error {
  let message: String
  let underlyingError: Error?
  
  init(message: String, underlyingError: Error?) {
    self.message = message
    self.underlyingError = underlyingError
  }
  
  convenience init(message: String) {
    self.init(message: message, underlyingError: nil)
  }
  
  var name: String {
    get {
      return TUT_ERROR_DOMAIN
    }
  }
  
  var localizedDescription: String {
    get {
      return message
    }
  }
}
