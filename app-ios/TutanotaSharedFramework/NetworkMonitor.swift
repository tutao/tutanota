import Foundation
import Network
import os

public final class NetworkMonitor: Sendable {

	private let callback: OSAllocatedUnfairLock<(@Sendable (_ isMetered: Bool) -> Void)?> = OSAllocatedUnfairLock(initialState: { _ in })

	private let monitor = NWPathMonitor()
	private let queue = DispatchQueue(label: "Network Monitor")

	public init() {
		monitor.pathUpdateHandler = { [weak self] path in
			self?.callback.withLock { callback in if callback != nil { callback!(path.isExpensive || path.isConstrained) } }
		}
		monitor.start(queue: queue)
	}

	private func isMetered() -> Bool { self.monitor.currentPath.isExpensive || self.monitor.currentPath.isConstrained }

	public func setCallback(callback: (@Sendable @escaping (_ isMetered: Bool) -> Void)) { self.callback.withLock { $0 = callback } }

	public func check() { self.callback.withLock { $0?(self.isMetered()) } }
}
