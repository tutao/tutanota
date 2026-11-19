import Foundation

public protocol ToString {
    func toString() -> SwString
}

public final class SwString: Sendable, Equatable, Hashable, ToString {
  internal let inner: String

  public required init(_ string: String) {
    self.inner = string
  }

  public required init<T: ToString>(_ object: T) {
    self.inner = object.toString().inner
  }

  public var length: SwInt {
    return SwInt(self.inner.count)
  }

  private var utf16: String.UTF16View {
    inner.utf16
  }

  private func codeUnit(at index: Int) -> UInt16? {
    guard index >= 0 && index < self.utf16.count else {
      return nil
    }
    return self.utf16[self.utf16.index(self.utf16.startIndex, offsetBy: index)]
  }

  public func hash(into hasher: inout Hasher) {
    hasher.combine(self.inner)
  }

  public func toString() -> SwString {
    return self
  }

  public func at(_ index: SwInt) -> Nullable<SwString> {
    let actualIndex = index.inner < 0 ? self.utf16.count + index.inner : index.inner
    guard let unit = self.codeUnit(at: actualIndex) else {
      return nil
    }
    return SwString(String(decoding: [unit], as: UTF16.self))
  }

  public func charAt(_ index: SwInt) -> SwString {
    guard let unit = self.codeUnit(at: index.inner) else {
        return SwString("")
    }
    return SwString(String(decoding: [unit], as: UTF16.self))
  }

  public func charCodeAt(_ index: SwInt) throws -> Nullable<SwInt> {
      guard let unit = self.codeUnit(at: index.inner) else {
          return nil
      }
      return SwInt(Int(unit))
  }

  public func codePointAt(_ index: SwInt) throws -> Nullable<SwInt> {
    guard let first = codeUnit(at: index.inner) else {
      return nil
    }
    guard
        (0xD800...0xDBFF).contains(first),
        let second = codeUnit(at: index.inner + 1),
        (0xDC00...0xDFFF).contains(second) else {
      return SwInt(Int(first))
    }
    return SwInt(Int(0x10000 + ((UInt32(first) - 0xD800) << 10) + (UInt32(second) - 0xDC00)))
  }

  public func concat(_ str: any ToString...) -> SwString {
      return SwString(self.inner + str.map{ $0.toString().inner }.joined())
  }

  public func endsWith(_ searchString: SwString) throws -> Bool {
    return try self.endsWith(searchString, self.length)
  }

  public func endsWith(_ searchString: SwString, _ endPosition: SwInt) throws -> Bool {
      fatalError("not yet implemented")
  }

  public func padStart(_ start: SwInt, _ pad: SwString) throws -> SwString {
    fatalError("not yet implemented")
  }

  public func replaceAll(_ f: SwString, _ with: SwString) throws -> SwString {
    fatalError("not yet implemented")
  }

  public func toLowerCase() throws -> SwString {
    fatalError("not yet implemented")
  }

  public func trim() throws -> SwString {
    return try self.trimStart().trimEnd()
  }

  public func trimStart() throws -> SwString {
    fatalError("not yet implemented")
  }

  public func trimEnd() throws -> SwString {
    fatalError("not yet implemented")
  }

  public func replaceAll(_ f: SwRegex, _ with: SwString) throws -> SwString {
    fatalError("not yet implemented")
  }

  public func split(_ s: SwString) throws -> SwArray<SwString> {
    return SwArray()
  }

  public func join(_ other: SwString) throws -> SwString {
    fatalError("Not yet implemented")
  }

  public func indexOf(_ hay: SwString, _ from: SwInt = SwInt(0)) throws -> SwInt {
    let haystack = self.inner as NSString
    let start = max(0, min(Int(from.asPrimitive()), haystack.length))
    let range = haystack.range(
      of: hay.inner, range: NSRange(location: start, length: haystack.length - start))
    return range.location == NSNotFound ? SwInt(-1) : SwInt(Int(range.location))
  }

  public func substring(_ start: SwInt, _ end: Nullable<SwInt> = nil) -> SwString {
    let nsString = self.inner as NSString
    let from = max(0, min(Int(start.asPrimitive()), nsString.length))
    let to = end.map { max(0, min(Int($0.asPrimitive()), nsString.length)) } ?? nsString.length
    guard from < to else {
      return SwString("")
    }
    return SwString(nsString.substring(with: NSRange(location: from, length: to - from)))
  }

  public func match(_ other: SwRegex) throws -> Nullable<SwString> {
    return other.firstMatch(in: self)
  }

  public func replace(_ pattern: SwRegex, _ replacement: SwString) throws -> SwString {
    return SwString(pattern.replace(in: self.inner, with: replacement.inner))
  }

  public func includes(_ substring: SwString) throws -> Bool {
    return self.inner.contains(substring.inner)
  }

  public func startsWith(_ substring: SwString) throws -> Bool {
    fatalError("not yet implemented!")
  }

  public func replace(_ pattern: SwString, _ replacement: SwString) -> SwString {
    guard let range = self.inner.range(of: pattern.inner) else {
      return self
    }
    return SwString(
      self.inner.replacingCharacters(in: range, with: replacement.inner))
  }

  public static func fromCharCode(_ nums: SwInt...) -> SwString {
    let utf16Array = Array(nums.map({ UInt16($0.inner % 65536) }))
    return SwString(String(utf16CodeUnits: utf16Array, count: utf16Array.count))
  }

  public static func fromCodePoint(_ nums: SwInt...) -> SwString {
    return SwString(String(String.UnicodeScalarView(nums.compactMap({ UnicodeScalar($0.inner) }))))
  }

  // I don't even know what the signature should be
  // public static func raw()

  public static func + (_ left: SwString, _ right: SwString) -> SwString {
    return SwString(left.inner + right.inner)
  }

  public static func == (lhs: SwString, rhs: SwString) -> Bool {
    return lhs.inner == rhs.inner
  }
}

public typealias TsString = SwString
