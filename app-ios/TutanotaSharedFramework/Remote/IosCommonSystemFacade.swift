import Combine
import Foundation

enum InitState {
	case waitingForInit
	case initReceived
}

public protocol MainPageLoader { func loadMainPage(params: [String: String]) async }

// actor to make access to the init data safe
public actor IosCommonSystemFacade: CommonSystemFacade {
	@MainActor private let viewController: any MainPageLoader
	private let urlSession: URLSession
	private var initialized = CurrentValueSubject<InitState, Never>(.waitingForInit)
	// according to the docs the return value of sink should be held
	// because otherwise the stream will be canceled
	private var cancellables: [AnyCancellable] = []
	@MainActor public init(viewController: any MainPageLoader, urlSession: URLSession) {
		self.viewController = viewController
		self.urlSession = urlSession
	}

	public func initializeRemoteBridge() async throws { self.initialized.send(.initReceived) }

	public func reload(_ query: [String: String]) async throws {
		self.initialized = CurrentValueSubject(.waitingForInit)
		await Task { @MainActor in await self.viewController.loadMainPage(params: query) }.value
	}

	public func getLog() async throws -> String { getLogs() }

	public func awaitForInit() async {
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

	public func executePostRequest(_ postUrl: String, _ body: String) async throws -> Bool {
		let httpClient = URLSessionHttpClient(session: self.urlSession)
		var request = URLRequest(url: URL(string: postUrl)!)
		request.httpBody = body.data(using: .utf8)
		request.setValue("text/plain", forHTTPHeaderField: "Content-Type")
		request.setValue("\(body.lengthOfBytes(using: .utf8))", forHTTPHeaderField: "Content-Length")
		let (_, httpResponse) = try await httpClient.fetch(
			url: request.url!,
			method: HttpMethod.post,
			headers: request.allHTTPHeaderFields!,
			body: request.httpBody
		)
		return httpResponse.statusCode >= 200 && httpResponse.statusCode < 300
	}
}
