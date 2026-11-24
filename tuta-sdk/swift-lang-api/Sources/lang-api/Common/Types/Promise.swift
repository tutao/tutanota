public protocol PromiseProtocol {
  associatedtype Value
  func await() async throws -> Value
}

/// A JS-like promise, backed by a `Task`.
///
/// The body of a transpiled async function runs inside `Promise.async` (`return Promise.async { () async throws -> T in ... }`),
/// and `await p` is transpiled to `try await p.await()`. Functions returning a promise are not `async` themselves,
/// so they can be called from synchronous code (e.g. `ids.map(...)`), just like in JS.
public final class Promise<T: Sendable>: Sendable, PromiseProtocol {
  public typealias Value = T
  private let task: Task<T, Error>

  private init(task: Task<T, Error>) {
    self.task = task
  }

  public init<P: PromiseProtocol>(_ asyncFunc: @Sendable @escaping () async throws -> P)
  where P.Value == T {
    self.task = Task { try await asyncFunc().await() }
  }

  public init(_ asyncFunc: @Sendable @escaping () async throws -> T) {
    self.task = Task { try await asyncFunc() }
  }

  @discardableResult
  public func await() async throws -> T {
    return try await task.value
  }

  public func then<P: PromiseProtocol>(_ action: @Sendable @escaping (T) throws -> P) throws
    -> Promise<P.Value>
  {
    return Promise<P.Value> { try action(try await self.await()) }
  }

  public func then<R>(_ action: @Sendable @escaping (T) throws -> R) throws -> Promise<R> {
    return Promise<R> { try action(try await self.await()) }
  }

  public func `catch`<R>(_ action: @escaping (TutanotaError) throws -> R) throws -> Promise<R> {
    fatalError("not implemented")
  }

  public func finally(_ action: @Sendable @escaping () throws -> Void) throws -> Promise<T> {
    return Promise({ () async throws -> T in
      let value: T
      do {
        value = try await self.await()
      } catch {
        try action()
        throw error
      }
      try action()
      return value
    })
  }

  public static func resolve(_ value: T) -> Promise<T.Value> where T: PromiseProtocol {
    return Promise<T.Value> { value }
  }

  public static func resolve(_ value: T) -> Promise<T> {
    return Promise(task: Task { value })
  }
}

extension Promise<Void> {
  public static func resolve() -> Promise<Void> {
    return Promise.resolve(())
  }
}
