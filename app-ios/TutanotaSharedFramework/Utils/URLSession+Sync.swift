import Foundation

public extension URLSession {
	func synchronousDataTask(with url: URL) throws -> (Data, URLResponse) {
		var data: Data?
		var response: URLResponse?
		var error: Error?

		let semaphore = DispatchSemaphore(value: 0)

		let dataTask = self.dataTask(with: url) {
			data = $0
			response = $1
			error = $2

			semaphore.signal()
		}
		dataTask.resume()

		_ = semaphore.wait(timeout: .distantFuture)

		if let error { throw error }

		return (data!, response!)
	}
}
