public protocol PromiseProtocol {
  associatedtype Value
  func await() async throws -> Value
}

public final class Promise<T: Sendable>: Sendable, PromiseProtocol {
  public typealias Value = T
  private let task: Task<T, Error>

  private init(task: Task<T, Error>) {
    self.task = task
  }

  public convenience init(_ asyncFunc: @Sendable @escaping () async throws -> Promise<T>) {
    self.init(task: Task { return try await asyncFunc().await() })
  }

  public convenience init(_ value: T) {
    self.init(task: Task { return value })
  }

  @discardableResult
  public func await() async throws -> T {
    return try await task.value
  }

  public func then<P: Sendable>(_ asyncAction: @Sendable @escaping (T) async throws -> Promise<P>)
    throws -> Promise<P>
  {
    return Promise<P>(
      task: Task {
        let res = try await self.await()
        return try await asyncAction(res).await()
      })
  }

  public func then<P: Sendable>(_ syncAction: @Sendable @escaping (T) throws -> P)
    throws -> Promise<P>
  {
      fatalError()
  }


  public func `catch`(_ action: @Sendable @escaping (TutanotaError) async throws -> Promise<T>) throws -> Promise<T>
  {
    fatalError("not implemented")
  }

  public func `catch`(_ action: @Sendable @escaping (TutanotaError) throws -> T) throws -> Promise<T>
  {
    fatalError("not implemented")
  }

  public func finally(_ action: @Sendable @escaping () async throws -> Promise<Void>) throws -> Promise<T> {
    return Promise({
      let value: T
      do {
        value = try await self.await()
      } catch {
        let _ = try await action()
        throw error
      }

      let _ =  try await action()
      return Promise.resolve(value)
    })
  }

  public func finally(_ action: @Sendable @escaping () throws -> Void) throws -> Promise<T> {
    return Promise({ () async throws in
      let value: T
      do {
        value = try await self.await()
      } catch {
        let _ = try action()
        throw error
      }

      let _ =  try action()
      return Promise.resolve(value)
    })
  }

  public static func resolve(_ value: T) -> Promise<T> {
    return Promise<T> { value }
  }
}

extension Promise<Void> {
  public static func resolve() -> Promise<Void> {
    return Promise.resolve(())
  }
}
