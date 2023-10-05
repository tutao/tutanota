// Taken from https://swiftrocks.com/thread-safety-in-swift
// Replace with OSAllocatedUnfairLock() when targeting iOS 16

// Read http://www.russbishop.net/the-law for more information on why this is necessary
final class UnfairLock {
  private var _lock: UnsafeMutablePointer<os_unfair_lock>

  init() {
    _lock = UnsafeMutablePointer<os_unfair_lock>.allocate(capacity: 1)
    _lock.initialize(to: os_unfair_lock())
  }

  deinit {
    _lock.deallocate()
  }

  @discardableResult
  func locked<ReturnValue>(_ f: () throws -> ReturnValue) rethrows -> ReturnValue {
    os_unfair_lock_lock(_lock)
    defer { os_unfair_lock_unlock(_lock) }
    return try f()
  }
}
