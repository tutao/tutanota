//
//  MurmurHash3.swift
//  MurmurHash
//
//  Created by Daisuke T on 2019/02/06.
//  Copyright © 2019 MurmurHash. All rights reserved.
//
//
//The MIT License (MIT)
//
//Copyright (c) 2019 Daisuke T
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//SOFTWARE.

import Foundation

public struct MurmurHash3 {}

extension MurmurHash3 {
	/// MurmurHash3 x86_32 class
	public class FourBytesHash {
		// MARK: - Enum, Const
		static private let c1: UInt32 = 0xcc9e2d51
		static private let c2: UInt32 = 0x1b873593
		// MARK: - Property
		private let endian = Common.endian()
		private var state = State()
		public var seed: UInt32 { didSet { reset() } }
		// MARK: - Life cycle

		/// Creates a new instance with the seed.
		///
		/// - Parameter seed: A seed for generate digest. Default is 0.
		public init(_ seed: UInt32 = 0) {
			self.seed = seed
			reset()
		}
	}
}

// MARK: - State
extension MurmurHash3.FourBytesHash {
	private struct State {
		var totalLen: Int = 0
		var mem = [UInt8](repeating: 0, count: 3)
		var memSize: Int = 0
		var tail = MurmurHash3Tail(3)
		var h1: UInt32 = 0
	}
}

// MARK: - Utility
extension MurmurHash3.FourBytesHash {
	static private func body(_ h: UInt32, array: [UInt8]) -> UInt32 {
		let nblocks = array.count / 4
		var h1 = h
		for i in 0..<nblocks {
			var k1: UInt32 = Common.UInt8ArrayToUInt(array, index: i, endian: Common.endian())
			k1 &*= c1
			k1 = Common.rotl(k1, r: 15)
			k1 &*= c2
			h1 ^= k1
			h1 = Common.rotl(h1, r: 13)
			h1 = h1 &* 5 &+ 0xe6546b64
		}
		return h1
	}
	static private func tailAndFinalize(_ h1: UInt32, tail: [UInt8], len: Int) -> UInt32 {
		var k1: UInt32 = 0
		var h2 = h1
		// swiftlint:disable fallthrough
		/**
		 * tail
		 */
		switch len & 3 {
		case 3:
			k1 ^= UInt32(tail[2]) << 16
			fallthrough
		case 2:
			k1 ^= UInt32(tail[1]) << 8
			fallthrough
		case 1:
			k1 ^= UInt32(tail[0])
			k1 &*= c1
			k1 = Common.rotl(k1, r: 15)
			k1 &*= c2
			h2 ^= k1
		default: break
		}
		// swiftlint:enable fallthrough
		/**
		 * finalization
		 */
		h2 ^= UInt32(len)
		h2 = Common.fmix32(h2)
		return h2
	}
}

// MARK: - Digest(One-shot)
extension MurmurHash3.FourBytesHash {
	/// Generate digest(One-shot)
	///
	/// - Parameters:
	///   - array: A source data for hash.
	///   - seed: A seed for generate digest. Default is 0.
	/// - Returns: A generated digest.
	static public func digest(_ array: [UInt8], seed: UInt32 = 0) -> UInt32 {
		var h1 = seed
		/**
		 * body
		 */
		h1 = body(h1, array: array)
		/**
		 * tail and finalize
		 */
		let nblocks = array.count / 4
		let tail = MurmurHash3Tail(3)
		for i in 0..<array.count % 4 { tail.add(array[nblocks * 4 + i]) }
		h1 = tailAndFinalize(h1, tail: tail.rawArray(), len: array.count)
		return h1
	}
	/// Overload func for "digest(_ array: [UInt8], seed: UInt32 = 0)".
	static public func digest(_ string: String, seed: UInt32 = 0) -> UInt32 { digest(Array(string.utf8), seed: seed) }
	/// Overload func for "digest(_ array: [UInt8], seed: UInt32 = 0)".
	static public func digest(_ data: Data, seed: UInt32 = 0) -> UInt32 { digest([UInt8](data), seed: seed) }
	/// Generate digest's hex string(One-shot)
	///
	/// - Parameters:
	///   - array: A source data for hash.
	///   - seed: A seed for generate digest. Default is 0.
	/// - Returns: A generated digest's hex string.
	static public func digestHex(_ array: [UInt8], seed: UInt32 = 0) -> String {
		let h = digest(array, seed: seed)
		return Common.UInt32ArrayToHex([h])
	}
	/// Overload func for "digestHex(_ array: [UInt8], seed: UInt32 = 0)".
	static public func digestHex(_ string: String, seed: UInt32 = 0) -> String {
		let h = digest(string, seed: seed)
		return Common.UInt32ArrayToHex([h])
	}
	/// Overload func for "digestHex(_ array: [UInt8], seed: UInt32 = 0)".
	static public func digestHex(_ data: Data, seed: UInt32 = 0) -> String {
		let h = digest(data, seed: seed)
		return Common.UInt32ArrayToHex([h])
	}
}

// MARK: - Digest(Streaming)
extension MurmurHash3.FourBytesHash {
	/// Reset current streaming state to initial.
	public func reset() {
		state = MurmurHash3.FourBytesHash.State()
		state.h1 = self.seed
	}
	/// Update streaming state.
	///
	/// - Parameter array: A source data for hash.
	public func update(_ array: [UInt8]) {
		let len = array.count
		state.totalLen += len
		if state.memSize + len < 4 {
			// fill in tmp buffer
			state.mem.replaceSubrange(state.memSize..<state.memSize + len, with: array)
			state.memSize += len
			for i in 0..<len { state.tail.add(array[i]) }
			return
		}
		/**
		 * body
		 */
		let array2 = Array(state.mem[0..<state.memSize]) + array
		state.h1 = MurmurHash3.FourBytesHash.body(state.h1, array: array2)
		// fill in tmp buffer
		state.memSize = array2.count % 4
		state.mem.replaceSubrange(0..<state.memSize, with: array2[array2.count - state.memSize..<array2.count])
		for i in 0..<3 { state.tail.add(array2[array2.count - (3 - i)]) }
	}
	/// Overload func for "update(_ array: [UInt8])".
	public func update(_ string: String) { update(Array(string.utf8)) }
	/// Overload func for "update(_ array: [UInt8])".
	public func update(_ data: Data) { update([UInt8](data)) }
	/// Generate digest(Streaming)
	///
	/// - Returns: A generated digest from current streaming state.
	public func digest() -> UInt32 {
		/**
		 * tail and finalize
		 */
		var tail2 = Array(state.tail.rawArray())
		tail2.removeFirst(tail2.count - state.totalLen % 4)
		let h1 = MurmurHash3.FourBytesHash.tailAndFinalize(state.h1, tail: tail2, len: state.totalLen)
		return h1
	}
	/// Generate digest's hex string(Streaming)
	///
	/// - Returns: A generated digest's hex string from current streaming state.
	public func digestHex() -> String {
		let h = digest()
		return Common.UInt32ArrayToHex([h])
	}
}

final class Common {
	// MARK: - Enum, Const
	enum Endian {
		case little
		case big
	}
}

// MARK: - Utility
extension Common {
	static func endian() -> Endian {
		if CFByteOrderGetCurrent() == Int(CFByteOrderLittleEndian.rawValue) { return Endian.little }
		return Endian.big
	}
	static func rotl<T: FixedWidthInteger>(_ x: T, r: Int) -> T { (x << r) | (x >> (T.bitWidth - r)) }
}

// MARK: - Utility(Swap)
extension Common {
	static func swap<T: FixedWidthInteger>(_ x: T) -> T {
		var res: T = 0
		var mask: T = 0xff
		var bit = 0
		bit = (MemoryLayout<T>.size - 1) * 8
		for _ in 0..<MemoryLayout<T>.size / 2 {
			res |= (x & mask) << bit
			mask = mask << 8
			bit -= 16
		}
		bit = 8
		for _ in 0..<MemoryLayout<T>.size / 2 {
			res |= (x & mask) >> bit
			mask = mask << 8
			bit += 16
		}
		return res
	}
}

// MARK: - Utility(Convert)
extension Common {
	static private func UInt8ArrayToUInt<T: FixedWidthInteger>(_ array: [UInt8], index: Int) -> T {
		var block: T = 0
		for i in 0..<MemoryLayout<T>.size { block |= T(array[index * MemoryLayout<T>.size + i]) << (i * 8) }
		return block
	}
	static func UInt8ArrayToUInt<T: FixedWidthInteger>(_ array: [UInt8], index: Int, endian: Common.Endian) -> T {
		var block: T = UInt8ArrayToUInt(array, index: index)
		if endian == Common.Endian.little { return block }
		// Big Endian
		block = swap(block)
		return block
	}
	static func UInt32ArrayToHex(_ array: [UInt32]) -> String {
		var hex = ""
		for val in array { hex += String.init(format: "%08x", val) }
		return hex
	}
	static func UInt64ArrayToHex(_ array: [UInt64]) -> String {
		var hex = ""
		for val in array { hex += String.init(format: "%016lx", val) }
		return hex
	}
}

// MARK: - Utility(Mix)
extension Common {
	static func fmix32(_ h: UInt32) -> UInt32 {
		var h2 = h
		h2 ^= h2 >> 16
		h2 &*= 0x85ebca6b
		h2 ^= h2 >> 13
		h2 &*= 0xc2b2ae35
		h2 ^= h2 >> 16
		return h2
	}
	static func fmix64(_ k: UInt64) -> UInt64 {
		var k2 = k
		k2 ^= k2 >> 33
		k2 &*= 0xff51afd7ed558ccd
		k2 ^= k2 >> 33
		k2 &*= 0xc4ceb9fe1a85ec53
		k2 ^= k2 >> 33
		return k2
	}
}

final class MurmurHash3Tail {
	// MARK: - Property
	private var array: [UInt8]
	private var max: Int
	// MARK: - Life cycle
	public init(_ max: Int) {
		self.max = max
		array = [UInt8]()
	}
}

// MARK: - Operation
extension MurmurHash3Tail {
	func add(_ newElement: UInt8) {
		if array.count >= max {
			array.replaceSubrange(0..<max - 1, with: Array(array[1..<max]))
			array.removeLast()
		}
		array.append(newElement)
	}
	func rawArray() -> [UInt8] { Array(array) }
}
