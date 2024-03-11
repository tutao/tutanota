import Combine
import Foundation
import TutanotaSharedFramework

enum InitState {
	case waitingForInit
	case initReceived
}

class IosCommonSystemFacade: CommonSystemFacade {

	private let viewController: ViewController
	private var initialized = CurrentValueSubject<InitState, Never>(.waitingForInit)
	// according to the docs the return value of sink should be held
	// because otherwise the stream will be canceled
	private var cancellables: [AnyCancellable] = []
	init(viewController: ViewController) { self.viewController = viewController }

	func initializeRemoteBridge() async throws { self.initialized.send(.initReceived) }

	func reload(_ query: [String: String]) async throws {
		self.initialized = CurrentValueSubject(.waitingForInit)
		await self.viewController.loadMainPage(params: query)
	}

	func getLog() async throws -> String {
		let entries = TUTLogger.sharedInstance().entries()
		return entries.joined(separator: "\n")
	}

	func awaitForInit() async {
		/// awaiting for the first and hopefully only void object in this publisher
		/// could be simpler but .values is iOS > 15
		if self.initialized.value == .initReceived { return }
		await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
			// first will end the subscription after the first match so we don't need to cancel manually
			// (it is anyway hard to do as .sink() is called sync right away before we get subscription)
			let cancellable = self.initialized.first { $0 == .initReceived }.sink { _ in continuation.resume() }

			self.cancellables.append(cancellable)
		}
	}
}
