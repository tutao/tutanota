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
    return SwInt(self.utf16.count)
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

  public func charCodeAt(_ index: SwInt) -> Nullable<SwInt> {
    guard let unit = self.codeUnit(at: index.inner) else {
      return nil
    }
    return SwInt(Int(unit))
  }

  public func codePointAt(_ index: SwInt) -> Nullable<SwInt> {
    guard let first = codeUnit(at: index.inner) else {
      return nil
    }
    guard
      (0xD800...0xDBFF).contains(first),
      let second = codeUnit(at: index.inner + 1),
      (0xDC00...0xDFFF).contains(second)
    else {
      return SwInt(Int(first))
    }
    return SwInt(Int(0x10000 + ((UInt32(first) - 0xD800) << 10) + (UInt32(second) - 0xDC00)))
  }

  public func concat(_ str: any ToString...) -> SwString {
    return SwString(self.inner + str.map { $0.toString().inner }.joined())
  }

  public func endsWith(_ searchString: SwString, _ endPosition: SwInt? = nil) -> Bool {
    let source = self.utf16
    let search = searchString.utf16
    let end = min(max(endPosition?.inner ?? source.count, 0), source.count)

    guard search.count <= end else {
      return false
    }

    return source.prefix(end).suffix(search.count).elementsEqual(search)
  }

  public func includes(_ searchString: SwString, _ position: SwInt = SwInt(0)) -> Bool {
    let source = self.utf16
    let startIndex = source.index(source.startIndex, offsetBy: position.inner)

    return source.suffix(from: startIndex).contains(searchString.utf16)
  }

  public func indexOf(_ searchString: SwString, _ position: SwInt = SwInt(0)) -> SwInt {
    let source = self.utf16
    let search = searchString.utf16

    var position = position
    if position < SwInt(0) {
      position = SwInt(0)
    }

    guard position.inner + search.count <= source.count else {
      return SwInt(-1)
    }

    let startIndex = source.index(source.startIndex, offsetBy: position.inner)
    var candidate = startIndex
    let lastCandidate = source.index(source.endIndex, offsetBy: -search.count)

    while candidate <= lastCandidate {
      let matchEnd = source.index(candidate, offsetBy: search.count)
      if source[candidate..<matchEnd].elementsEqual(search) {
        return position + SwInt(source.distance(from: startIndex, to: candidate))
      }
      source.formIndex(after: &candidate)
    }

    return SwInt(-1)
  }

  public func isWellFormed() -> Bool {
    // Swift strings cannot represent non-well-formed strings. If we want to support that we need to switch to arrays of unsigned 16-bit integers instead.
    return true
  }

  public func lastIndexOf(_ searchString: SwString, _ position: SwInt = SwInt(0)) -> SwInt {
    let source = self.utf16
    let search = searchString.utf16

    var position = position
    if position < SwInt(0) {
      position = SwInt(0)
    }

    guard position.inner + search.count <= source.count else {
      return SwInt(-1)
    }

    let startIndex = source.index(source.startIndex, offsetBy: position.inner)
    let lastCandidate = startIndex
    var candidate = source.index(source.endIndex, offsetBy: -search.count)

    while candidate <= lastCandidate {
      let matchEnd = source.index(candidate, offsetBy: search.count)
      if source[candidate..<matchEnd].elementsEqual(search) {
        return position + SwInt(source.distance(from: startIndex, to: candidate))
      }
      source.formIndex(before: &candidate)
    }

    return SwInt(-1)
  }

  // public func localeCompare(_ compareString: SwString, _ locales: SwString? = nil, options: Any? = nil) -> SwInt {}

  // public func match(_ regexp: Any) -> SwArray<SwString>? { }

  // public func match(_ regexp: Any) -> Iterator<SwString> {}

  // public func normalize(_ form: SwString) -> SwString {}

  // public func padEnd(_ targetLength: SwInt, _padString: SwString = SwString(" ")) -> SwString { }

  public func padStart(_ targetLength: SwInt, _ padString: SwString = SwString(" ")) -> SwString {
    let missing = max(targetLength.inner - self.length.inner, 0)
    let repetitions = padString.length.inner / missing
    let remainder = padString.length.inner % missing

    return padString.repeat(SwInt(repetitions)) + padString.slice(SwInt(0), SwInt(remainder)) + self
  }

  public func `repeat`(_ count: SwInt) -> SwString {
    return SwString(String(repeating: self.inner, count: count.inner))
  }

  public func replace(_ pattern: SwRegex, _ replacement: SwString) -> SwString {
    return SwString(pattern.replace(in: self.inner, with: replacement.inner))
  }

  public func replace(_ pattern: SwString, _ replacement: SwString) -> SwString {
    guard let range = self.inner.range(of: pattern.inner) else {
      return self
    }
    return SwString(self.inner.replacingCharacters(in: range, with: replacement.inner))
  }

  // public func replaceAll(_ f: SwString, _ with: SwString) -> SwString { }

  // public func replaceAll(_ f: SwRegex, _ with: SwString) -> SwString { }

  // search()

  public func slice(_ indexStart: SwInt, _ indexEnd: SwInt? = nil) -> SwString {
    let indexEnd = indexEnd ?? self.length
    let startIndex = self.utf16.index(self.utf16.startIndex, offsetBy: indexStart.inner)
    let endIndex = self.utf16.index(self.utf16.startIndex, offsetBy: indexEnd.inner)

    return SwString(String(self.utf16[startIndex..<endIndex]) ?? "")
  }

  // public func split(_ separator: SwString, _ limit: SwInt? = nil) -> SwArray<SwString> { }

  // public func startsWith(_ substring: SwString)  -> Bool { }

  public func substring(_ start: SwInt, _ end: Nullable<SwInt> = nil) -> SwString {
    let nsString = self.inner as NSString
    let from = max(0, min(Int(start.asPrimitive()), nsString.length))
    let to = end.map { max(0, min(Int($0.asPrimitive()), nsString.length)) } ?? nsString.length
    guard from < to else {
      return SwString("")
    }
    return SwString(nsString.substring(with: NSRange(location: from, length: to - from)))
  }

  // toLocaleLowerCase()

  // toLocaleUpperCase()

  public func toLowerCase() -> SwString {
    return SwString(self.inner.lowercased())
  }

  public func toString() -> SwString {
    return self
  }

  public func toUpperCase() -> SwString {
    return SwString(self.inner.uppercased())
  }

  public func toWellFormerd() -> SwString {
    return self
  }

  public func trim() -> SwString {
    return self.trimStart().trimEnd()
  }

  public func trimEnd() -> SwString {
    let x = self.inner
      .reversed()
      .trimmingPrefix(while: SwString.isWhitespace)
      .reversed()
    return SwString(String(x))
  }

  public func trimStart() -> SwString {
    return SwString(String(self.inner.trimmingPrefix(while: SwString.isWhitespace)))
  }

  private static func isWhitespace(_ character: Character) -> Bool {
    // Swift's Character.isWhitespace behaves differently on characters like 0x0089 and 0xFEFF
    let u = character.utf16.first
    return u == 0x0009 || u == 0x000B || u == 0x000C || u == 0x0020 || u == 0x00A0 || u == 0xFEFF
      || u == 0x1680 || u == 0x2000 || u == 0x2001 || u == 0x2002 || u == 0x2003 || u == 0x2004
      || u == 0x2005 || u == 0x2006 || u == 0x2007 || u == 0x2008 || u == 0x2009 || u == 0x200A
      || u == 0x202F || u == 0x205F || u == 0x3000 || u == 0x000A || u == 0x000D || u == 0x2028
      || u == 0x2029
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
