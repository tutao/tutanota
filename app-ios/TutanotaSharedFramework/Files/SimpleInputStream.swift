import os

/// Stateful byte stream.
///
/// Offers only synchronous read. Unfortunately async data handling is not so simple in Swift:
///   - Old `NSStream` is not sendable and is not compatible with async. It is generally hard to use.
///   - Async sequences like `FileHandle.AsyncBytes` and friends work on a byte at a time and you are at a mercy of an optimizer.
///   - Swift NIO is its own world and is not trivial to use either
///
///	It would be possible to wrap DispatchIO (see https://losingfight.com/blog/2024/04/22/reading-and-writing-files-in-swift-asyncawait/)
///	which we can do if there is a need.
protocol SimpleInputStream: Sendable {
	/// Read up to the specified number of bytes.
	/// It will block if the data is not available to read yet.
	///
	/// - Returns: requested data or `nil` if the stream is empty
	mutating func read(upToBytes: Int) throws -> Data?
}

extension SimpleInputStream { mutating func readUntilEnd() throws -> Data? { try read(upToBytes: Int.max) } }

// It is a class because position value should be shared
final class DataSimpleInputStream: SimpleInputStream {
	private let data: Data
	private let pos: OSAllocatedUnfairLock<Int> = OSAllocatedUnfairLock(initialState: 0)
	init(data: Data) { self.data = data }
	func read(upToBytes: Int) throws -> Data? {
		// Lock for the whole duration of read.
		// For basic thread safety it would be enough to lock on read/write separately, but
		// it makes sense to block on the previous read and not read the same data twice.
		self.pos.withLock { pos in
			if pos == data.count { return nil }
			let canReadBytes = data.count - pos
			let shouldReadBytes = min(canReadBytes, upToBytes)
			let slice = data.subdata(in: pos..<pos + shouldReadBytes)
			pos += shouldReadBytes
			return slice
		}
	}
}

struct FileHandleSimpleInputStream: SimpleInputStream {
	private let fileHandle: FileHandle
	init(fileHandle: FileHandle) { self.fileHandle = fileHandle }
	mutating func read(upToBytes: Int) throws -> Data? { try fileHandle.read(upToCount: upToBytes) }
}
