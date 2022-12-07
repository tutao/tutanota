import Foundation
import AuthenticationServices

class IosWebauthnFacade:WebAuthnFacade {

  private let viewController: ViewController
  private weak var currentSession: ASWebAuthenticationSession?

  init(viewController: ViewController) {
    self.viewController = viewController
  }

  @MainActor
  func register(_ challenge: WebAuthnRegistrationChallenge) async throws -> WebAuthnRegistrationResult {
    let url = try await sendRequest(challengeDomain: challenge.domain, challengeJson: toJson(challenge), actionType: "register")

    let result: TaggedWebauthnResult<WebAuthnRegistrationResult> = try self.parseResult(url: url)
    switch (result) {
    case let .success(value):
      return value
    case let .error(_, stack):
      throw TUTErrorFactory.createError(withDomain: "webauthn", message: stack)
    }
  }

  @MainActor
  func sign(_ challenge: WebAuthnSignChallenge) async throws -> WebAuthnSignResult {
    let url = try await sendRequest(challengeDomain: challenge.domain, challengeJson: toJson(challenge), actionType: "sign")

    let result: TaggedWebauthnResult<WebAuthnSignResult> = try self.parseResult(url: url)
    switch (result) {
    case let .success(value):
      return value
    case let .error(_, stack):
      throw TUTErrorFactory.createError(withDomain: "webauthn", message: stack)
    }
  }
  
  @MainActor
  private func sendRequest(challengeDomain: String, challengeJson: String, actionType: String) async throws -> URL {
    return try await withCheckedThrowingContinuation { continuation in
      var urlComponents = URLComponents(string: challengeDomain + "/webauthnmobile")!
      urlComponents.queryItems = [
        URLQueryItem(name: "action", value: actionType),
        URLQueryItem(name: "challenge", value: challengeJson),
        URLQueryItem(name: "cbUrl", value: "tutanota://{result}")
      ]
      let session = ASWebAuthenticationSession(url: urlComponents.url!, callbackURLScheme: "tutanota") { url, error in
        if let url = url {
          continuation.resume(returning: url)
        } else {
          continuation.resume(throwing: error!)
        }
      }
      session.prefersEphemeralWebBrowserSession = true
      session.presentationContextProvider = viewController
      self.currentSession = session
      session.start()
    }
  }
  
  private func parseResult<T: Decodable>(url: URL) throws -> T {
    guard let base64String = url.host,
          let base64Data = base64String.data(using: .utf8),
          let jsonData = Data(base64Encoded: base64Data) else {
      throw TUTErrorFactory.createError("Could not parse webauthn result")
    }
    let result = try JSONDecoder().decode(T.self, from: jsonData)
    return result
  }

  @MainActor
  func abortCurrentOperation() async throws {
    self.currentSession?.cancel()
  }

  func isSupported() async throws -> Bool {
    return true
  }

  func canAttemptChallengeForRpId(_ rpId: String) async throws -> Bool {
    return true
  }

  func canAttemptChallengeForU2FAppId(_ appId: String) async throws -> Bool {
    return true
  }
}


enum TaggedWebauthnResult<T: Decodable> : Decodable {
  case success(value: T)
  case error(name: String, stack: String)

  enum CodingKeys: CodingKey {
    case type
    case name
    case stack
    case value
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let type = try container.decode(String.self, forKey: .type)
    switch type {
    case "success":
      let value = try container.decode(T.self, forKey: .value)
      self = .success(value: value)
    case "error":
      let name = try container.decode(String.self, forKey: .name)
      let stack = try container.decode(String.self, forKey: .stack)
      self = .error(name: name, stack: stack)
    default:
      throw TutanotaError(message: "Invalid type: \(type)")
    }
  }
}
