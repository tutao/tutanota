import Foundation

public final class SwRegExp: ToString {
  private let regex: NSRegularExpression
  public let source: SwString
  public let hasIndices: Bool
  public let global: Bool  // TODO
  public let ignoreCase: Bool
  public let multiline: Bool
  public let dotAll: Bool
  public let unicode: Bool
  public let unicodeSets: Bool
  public let sticky: Bool

  public var flags: SwString {
    var flags = ""
    if self.hasIndices {
      flags += "d"
    }
    if self.global {
      flags += "g"
    }
    if self.ignoreCase {
      flags += "i"
    }
    if self.multiline {
      flags += "m"
    }
    if self.dotAll {
      flags += "s"
    }
    if self.unicode {
      flags += "u"
    }
    if self.unicodeSets {
      flags += "v"
    }
    if self.sticky {
      flags += "y"
    }
    return SwString(flags)
  }

  public init(_ pattern: String, _ flags: String = "") {
    var regexOptions: NSRegularExpression.Options = []
    self.source = SwString(pattern)
    self.hasIndices = flags.contains("d")
    self.global = flags.contains("g")
    self.ignoreCase = flags.contains("i")
    if self.ignoreCase {
      regexOptions.insert([.caseInsensitive])
    }
    self.multiline = flags.contains("m")
    if self.multiline {
      regexOptions.insert([.anchorsMatchLines])
    }
    self.dotAll = flags.contains("s")
    if self.dotAll {
      regexOptions.insert([.dotMatchesLineSeparators])
    }
    self.unicode = flags.contains("u")
    self.unicodeSets = flags.contains("v")
    self.sticky = flags.contains("y")
    if self.hasIndices || self.unicode || self.unicodeSets || self.sticky {
      fatalError("unsupported regex flag in /\(pattern)/\(flags)")
    }
    do {
      self.regex = try NSRegularExpression(pattern: pattern, options: regexOptions)
    } catch {
      fatalError("Cannot create regexp from string pattern: \(pattern)")
    }
  }

  public convenience init(_ pattern: SwString, _ flags: SwString = SwString("")) {
    self.init(pattern.inner, flags.inner)
  }

  public func toString() -> SwString {
    return SwString("/\(self.source)/\(self.flags)")
  }

  public func test(_ item: SwString) -> Bool {
    return self.firstMatch(in: item) != nil
  }

  internal func firstMatch(in value: SwString) -> Nullable<SwString> {
    let str = value.inner
    let range = NSRange(str.startIndex..., in: str)
    guard let match = regex.firstMatch(in: str, range: range),
      let matchRange = Range(match.range, in: str)
    else {
      return nil
    }
    return SwString(String(str[matchRange]))
  }

  internal func replace(in value: String, with replacement: String) -> String {
    let range = NSRange(value.startIndex..., in: value)
    guard let firstMatch = regex.firstMatch(in: value, range: range) else {
      return value
    }
    return regex.stringByReplacingMatches(
      in: value, range: firstMatch.range, withTemplate: replacement)
  }

  internal func replaceAll(in value: String, with replacement: String) -> String {
    let range = NSRange(value.startIndex..., in: value)
    return regex.stringByReplacingMatches(in: value, range: range, withTemplate: replacement)
  }

  public static func escape(_ string: SwString) -> SwString {
    return SwString(NSRegularExpression.escapedPattern(for: string.inner))
  }
}

public typealias TsRegex = SwRegExp
