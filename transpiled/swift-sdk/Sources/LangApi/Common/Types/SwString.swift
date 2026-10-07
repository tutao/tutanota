import Foundation

public final class SwString: Sendable {
  private let inner: String

  public required init(_ val: String) {
    self.inner = val
  }

  public var length: SwInt {
    return SwInt(Int32(self.inner.count))
  }

  public func asPrimitiveString() -> String {
    return self.inner
  }

  public func asString() -> SwString {
    return self
  }

  public func indexOf(_ hay: SwString, _ from: SwInt = SwInt(0)) -> SwInt {
    let haystack = self.inner as NSString
    let start = max(0, min(Int(from.asPrimitive()), haystack.length))
    let range = haystack.range(
      of: hay.asPrimitiveString(), range: NSRange(location: start, length: haystack.length - start))
    return range.location == NSNotFound ? SwInt(-1) : SwInt(Int32(range.location))
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

  public func match(_ other: SwRegex) -> Nullable<SwString> {
    return other.firstMatch(in: self)
  }

  public func replace(_ pattern: SwRegex, _ replacement: SwString) -> SwString {
    return SwString(pattern.replace(in: self.inner, with: replacement.asPrimitiveString()))
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
}

public typealias TsString = SwString
