/// Carries values across the `Task` boundary. Like in JS, transpiled code doesn't track which values are `Sendable`.
private struct UncheckedSendable<V>: @unchecked Sendable {
  let value: V
}

public protocol PromiseProtocol {
  associatedtype Value
  func await() async throws -> Value
}

/// A JS-like promise, backed by a `Task`.
///
/// The body of a transpiled async function runs inside `Promise.async` (`return Promise.async { () async throws -> T in ... }`),
/// and `await p` is transpiled to `try await p.await()`. Functions returning a promise are not `async` themselves,
/// so they can be called from synchronous code (e.g. `ids.map(...)`), just like in JS.
public final class Promise<T>: @unchecked Sendable, PromiseProtocol {
  public typealias Value = T
  private let task: Task<UncheckedSendable<T>, Error>

  private init(task: Task<UncheckedSendable<T>, Error>) {
    self.task = task
  }

  public init<P: PromiseProtocol>(_ block: @escaping () async throws -> P) where P.Value == T {
    let body = UncheckedSendable(value: block)
    self.task = Task { UncheckedSendable(value: try await (try await body.value()).await()) }
  }

  public init(_ block: @escaping () async throws -> T) {
    let body = UncheckedSendable(value: block)
    self.task = Task { UncheckedSendable(value: try await body.value()) }
  }

  public static func `async`(_ block: @escaping () async throws -> T) -> Promise<T.Value> where T: PromiseProtocol {
    return Promise<T.Value>(block)
  }

  public static func `async`(_ block: @escaping () async throws -> T) -> Promise<T> {
    return Promise(block)
  }

  @discardableResult
  public func await() async throws -> T {
    return try await task.value.value
  }

  public func then<P: PromiseProtocol>(_ action: @escaping (T) throws -> P) throws -> Promise<P.Value> {
    return Promise<P.Value>{ try action(try await self.await()) }
  }

  public func then<R>(_ action: @escaping (T) throws -> R) throws -> Promise<R> {
    return Promise<R>{ try action(try await self.await()) }
  }

  public func `catch`<R>(_ action: @escaping (TutanotaError) throws -> R) throws -> Promise<R> {
    fatalError("not implemented")
  }

  public func finally(_ action: @escaping () throws -> Void) throws -> Promise<T> {
    return Promise.async {
      let value: T
      do {
        value = try await self.await()
      } catch {
        try action()
        throw error
      }
      try action()
      return value
    }
  }

  public static func resolve(_ value: T) -> Promise<T.Value> where T: PromiseProtocol {
    return Promise<T.Value>{ value }
  }

  public static func resolve(_ value: T) -> Promise<T> {
    let resolved = UncheckedSendable(value: value)
    return Promise(task: Task { resolved })
  }
}

extension Promise<Void> {
  public static func resolve() -> Promise<Void> {
    return Promise.resolve(())
  }
}
