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

  public var length: SwNumber {
    return SwNumber(self.utf16.count)
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

  public func at(_ index: SwNumber) -> Nullable<SwString> {
    let actualIndex = index.inner < 0 ? self.utf16.count + index.inner : index.inner
    guard let unit = self.codeUnit(at: actualIndex) else {
      return nil
    }
    return SwString(String(decoding: [unit], as: UTF16.self))
  }

  public func charAt(_ index: SwNumber) -> SwString {
    guard let unit = self.codeUnit(at: index.inner) else {
      return SwString("")
    }
    return SwString(String(decoding: [unit], as: UTF16.self))
  }

  public func charCodeAt(_ index: SwNumber) -> SwNumber {
    guard let unit = self.codeUnit(at: index.inner) else {
      return SwNumber(Double.nan)
    }
    return SwNumber(Double(Int(unit)))
  }

  public func codePointAt(_ index: SwNumber) -> Nullable<SwNumber> {
    guard let first = codeUnit(at: index.inner) else {
      return nil
    }
    guard
      (0xD800...0xDBFF).contains(first),
      let second = codeUnit(at: index.inner + 1),
      (0xDC00...0xDFFF).contains(second)
    else {
      return SwNumber(Int(first))
    }
    return SwNumber(Int(0x10000 + ((UInt32(first) - 0xD800) << 10) + (UInt32(second) - 0xDC00)))
  }

  public func concat(_ str: any ToString...) -> SwString {
    return SwString(self.inner + str.map { $0.toString().inner }.joined())
  }

  public func endsWith(_ searchString: SwString, _ endPosition: SwNumber? = nil) -> Bool {
    let source = self.utf16
    let search = searchString.utf16
    let end = min(max(endPosition?.inner ?? source.count, 0), source.count)

    guard search.count <= end else {
      return false
    }

    return source.prefix(end).suffix(search.count).elementsEqual(search)
  }

  public func includes(_ searchString: SwString, _ position: SwNumber = SwNumber(0)) -> Bool {
    let source = self.utf16
    let startIndex = source.index(source.startIndex, offsetBy: position.inner)

    return source.suffix(from: startIndex).contains(searchString.utf16)
  }

  public func indexOf(_ searchString: SwString, _ position: SwNumber = SwNumber(0)) -> SwNumber {
    let source = self.utf16
    let search = searchString.utf16

    var position = position
    if position < SwNumber(0) {
      position = SwNumber(0)
    }

    guard position.inner + search.count <= source.count else {
      return SwNumber(-1)
    }

    let startIndex = source.index(source.startIndex, offsetBy: position.inner)
    var candidate = startIndex
    let lastCandidate = source.index(source.endIndex, offsetBy: -search.count)

    while candidate <= lastCandidate {
      let matchEnd = source.index(candidate, offsetBy: search.count)
      if source[candidate..<matchEnd].elementsEqual(search) {
        return position + SwNumber(source.distance(from: startIndex, to: candidate))
      }
      source.formIndex(after: &candidate)
    }

    return SwNumber(-1)
  }

  public func isWellFormed() -> Bool {
    // Swift strings cannot represent non-well-formed strings. If we want to support that we need to switch to arrays of unsigned 16-bit integers instead.
    return true
  }

  public func lastIndexOf(_ searchString: SwString, _ position: SwNumber = SwNumber(0)) -> SwNumber
  {
    let source = self.utf16
    let search = searchString.utf16

    var position = position
    if position < SwNumber(0) {
      position = SwNumber(0)
    }

    guard position.inner + search.count <= source.count else {
      return SwNumber(-1)
    }

    let startIndex = source.index(source.startIndex, offsetBy: position.inner)
    let lastCandidate = startIndex
    var candidate = source.index(source.endIndex, offsetBy: -search.count)

    while candidate <= lastCandidate {
      let matchEnd = source.index(candidate, offsetBy: search.count)
      if source[candidate..<matchEnd].elementsEqual(search) {
        return position + SwNumber(source.distance(from: startIndex, to: candidate))
      }
      source.formIndex(before: &candidate)
    }

    return SwNumber(-1)
  }

  // public func localeCompare(_ compareString: SwString, _ locales: SwString? = nil, options: Any? = nil) -> SwNumber {}

  // public func match(_ regexp: Any) -> SwArray<SwString>? { }

  // public func match(_ regexp: Any) -> Iterator<SwString> {}

  // public func normalize(_ form: SwString) -> SwString {}

  // public func padEnd(_ targetLength: SwNumber, _padString: SwString = SwString(" ")) -> SwString { }

  public func padStart(_ targetLength: SwNumber, _ padString: SwString = SwString(" ")) -> SwString
  {
    let missing = max(targetLength.inner - self.length.inner, 0)
    let repetitions = padString.length.inner / missing
    let remainder = padString.length.inner % missing

    return padString.repeat(SwNumber(repetitions))
      + padString.slice(SwNumber(0), SwNumber(remainder)) + self
  }

  public func `repeat`(_ count: SwNumber) -> SwString {
    return SwString(String(repeating: self.inner, count: count.inner))
  }

  public func replace(_ pattern: SwRegExp, _ replacement: SwString) -> SwString {
    if replacement.includes(SwString("$")) {
      fatalError("RegExp replacement patterns ($) are not supported")
    }
    if pattern.global {
      return SwString(pattern.replaceAll(in: self.inner, with: replacement.inner))
    } else {
      return SwString(pattern.replace(in: self.inner, with: replacement.inner))
    }
  }

  public func replace(_ pattern: SwString, _ replacement: SwString) -> SwString {
    return self.replace(SwRegExp(SwRegExp.escape(pattern)), replacement)
  }

  public func replaceAll(_ pattern: SwRegExp, _ replacement: SwString) -> SwString {
    return self.replace(pattern, replacement)
  }

  public func replaceAll(_ pattern: SwString, _ replacement: SwString) -> SwString {
    return self.replace(SwRegExp(SwRegExp.escape(pattern), SwString("g")), replacement)
  }

  // search()

  public func slice(_ indexStart: SwNumber, _ indexEnd: SwNumber? = nil) -> SwString {
    let indexEnd = indexEnd ?? self.length
    let startIndex = self.utf16.index(self.utf16.startIndex, offsetBy: indexStart.inner)
    let endIndex = self.utf16.index(self.utf16.startIndex, offsetBy: indexEnd.inner)

    return SwString(String(self.utf16[startIndex..<endIndex]) ?? "")
  }

  public func split(_ separator: SwString, _ limit: SwNumber = SwNumber(-1)) -> SwArray<SwString> {
    guard limit != SwNumber(0) else {
      return SwArray()
    }
    let limit = max(limit, SwNumber(-1))
    let index = self.indexOf(separator)
    guard index >= SwNumber(0) else {
      return SwArray([self])
    }
    let before = self.substring(SwNumber(0), index)
    let rest = self.substring(index + separator.length)
    return SwArray([before] + rest.split(separator, limit - SwNumber(1)))
  }

  public func startsWith(_ substring: SwString) -> Bool {
    return self.indexOf(substring) == SwNumber(0)
  }

  public func substring(_ indexStart: SwNumber, _ indexEnd: Nullable<SwNumber> = nil) -> SwString {
    let indexStart = min(max(indexStart, SwNumber(0)), self.length)
    let indexEnd = indexEnd != nil ? min(max(indexEnd!, SwNumber(0)), self.length) : self.length
    let start = min(indexStart, indexEnd)
    let end = max(indexStart, indexEnd)

    return self.slice(start, end)
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

  public static func fromCharCode(_ nums: SwNumber...) -> SwString {
    let utf16Array = Array(nums.map({ UInt16($0.inner % 65536) }))
    return SwString(String(utf16CodeUnits: utf16Array, count: utf16Array.count))
  }

  public static func fromCodePoint(_ nums: SwNumber...) -> SwString {
    return SwString(String(String.UnicodeScalarView(nums.compactMap({ UnicodeScalar($0.inner) }))))
  }

  // I don't even know what the signature should be
  // public static func raw()

  public static func + (_ left: SwString, _ right: any ToString) -> SwString {
    return SwString(left.inner + right.toString().inner)
  }

  public static func == (lhs: SwString, rhs: SwString) -> Bool {
    return lhs.inner == rhs.inner
  }
}

public typealias TsString = SwString
