import Foundation

public typealias ResponseCallback<T> = @Sendable (Result<T, any Error>) -> Void
