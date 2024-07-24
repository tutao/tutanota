import Foundation
import LocalAuthentication

public class AppLockHandler {
	private let context = LAContext()

	public func showAppLockPrompt(_ method: AppLockMethod) async throws {
		var evaluateResult: Bool
		do {
			switch method {
			case .biometrics:

				evaluateResult = try await context.evaluatePolicy(
					.deviceOwnerAuthenticationWithBiometrics,
					localizedReason: translate("TutaoUnlockCredentialsAction", default: "Unlock credentials")
				)
			case .system_pass_or_biometrics:
				evaluateResult = try await context.evaluatePolicy(
					.deviceOwnerAuthentication,
					localizedReason: translate("TutaoUnlockCredentialsAction", default: "Unlock credentials")
				)
			default: return
			}
		} catch {
			if let laError = error as? LAError {
				switch LAError.Code(rawValue: laError.errorCode) {
				case LAError.appCancel, LAError.systemCancel, LAError.userCancel:
					throw CancelledError(message: "Permission for biometrics denied, cancelled by user, or incorrect.")
				default: throw CredentialAuthenticationError(underlyingError: laError)
				}
			} else {
				throw CredentialAuthenticationError(message: "Unknown error during app lock", underlyingError: error)
			}
		}
		if !evaluateResult { throw CancelledError(message: "Permission for biometrics denied, cancelled by user, or incorrect.") }
	}

	public func isSystemPasswordSupported() -> Bool { context.canEvaluatePolicy(.deviceOwnerAuthentication) }
	public func isBiometricsSupported() -> Bool { context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics) }
}

fileprivate extension LAContext {
	func canEvaluatePolicy(_ policy: LAPolicy) -> Bool {
		var error: NSError?
		let supported = self.canEvaluatePolicy(policy, error: &error)
		if let error { TUTSLog("Cannot evaluate policy \(policy): \(error.debugDescription)") }
		return supported
	}
}
