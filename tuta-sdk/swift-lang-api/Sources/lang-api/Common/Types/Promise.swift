/// Carries values across the `Task` boundary. Like in JS, transpiled code doesn't track which values are `Sendable`.
private struct UncheckedSendable<V>: @unchecked Sendable {
  let value: V
}

/// A JS-like promise, backed by a `Task`.
///
/// The body of a transpiled async function runs inside `Promise.async` (`return Promise.async { () async throws -> T in ... }`),
/// and `await p` is transpiled to `try await p.await()`. Functions returning a promise are not `async` themselves,
/// so they can be called from synchronous code (e.g. `ids.map(...)`), just like in JS.
public final class Promise<T>: @unchecked Sendable {
  private let task: Task<UncheckedSendable<T>, Error>

  private init(task: Task<UncheckedSendable<T>, Error>) {
    self.task = task
  }

  /// Runs `block` as the body of an async function. An error thrown by `block` rejects the promise
  /// and is rethrown by `await()`.
  public static func async(_ block: @escaping () async throws -> T) -> Promise<T> {
    let body = UncheckedSendable(value: block)
    return Promise(task: Task { UncheckedSendable(value: try await body.value()) })
  }

  @discardableResult
  public func await() async throws -> T {
    return try await task.value.value
  }

  public func then<R>(_ action: @escaping (T) throws -> R) throws -> Promise<R> {
    return Promise<R>.async { try action(try await self.await()) }
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

  public static func resolve(_ value: Promise<T>) -> Promise<T> {
    return value
  }

  public static func resolve(_ value: T) -> Promise<T> {
    let resolved = UncheckedSendable(value: value)
    return Promise(task: Task { resolved })
  }
}

extension Promise<Void> {
  public static func resolve() -> Promise<Void> {
    return Promise<Void>.resolve(())
  }
}
