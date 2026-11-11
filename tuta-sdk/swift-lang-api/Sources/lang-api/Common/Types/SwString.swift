import Foundation

public final class SwString: Sendable, Equatable, Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(self.inner)
    }

  private let inner: String

  public required init(_ val: String) {
    self.inner = val
  }

  public var length: SwInt {
    return SwInt(self.inner.count)
  }

  public func asPrimitiveString() -> String {
    return self.inner
  }

  public func asString() throws -> SwString {
    return self
  }

  public func charCodeAt(_ index: SwInt) throws -> SwInt {
    fatalError("not yet implemented!")
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
    try self.trimStart()
    try self.trimEnd()
    return self
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
      of: hay.asPrimitiveString(), range: NSRange(location: start, length: haystack.length - start))
    return range.location == NSNotFound ? SwInt(-1) : SwInt(Int(range.location))
  }

  public func charAt(_ loc: SwInt) -> SwString {
    let nsString = self.inner as NSString
    let index = Int(loc.asPrimitive())
    guard index >= 0, index < nsString.length else {
      return SwString("")
    }
    return SwString(nsString.substring(with: NSRange(location: index, length: 1)))
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
    return SwString(pattern.replace(in: self.inner, with: replacement.asPrimitiveString()))
  }

  public func includes(_ substring: SwString) throws -> Bool {
    return self.inner.contains(substring.inner)
  }

  public func endsWith(_ substring: SwString) throws -> Bool {
    fatalError("not yet implemented!")
  }

  public func startsWith(_ substring: SwString) throws -> Bool {
    fatalError("not yet implemented!")
  }

  public func replace(_ pattern: SwString, _ replacement: SwString) -> SwString {
    guard let range = self.inner.range(of: pattern.asPrimitiveString()) else {
      return self
    }
    return SwString(
      self.inner.replacingCharacters(in: range, with: replacement.asPrimitiveString()))
  }

  public static func + (_ left: SwString, _ right: SwString) -> SwString {
    return SwString(left.inner + right.inner)
  }

  public static func == (lhs: SwString, rhs: SwString) -> Bool {
    return lhs.inner == rhs.inner
  }
}

public typealias TsString = SwString
