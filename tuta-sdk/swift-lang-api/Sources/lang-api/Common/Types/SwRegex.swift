import Foundation

public final class SwRegex {
  private let regex: NSRegularExpression

  public init(_ pattern: String) {
    do {
      self.regex = try NSRegularExpression(pattern: pattern)
    } catch {
      fatalError("Cannot create regexp from string pattern: \(pattern)")
    }
  }

  public func test(_ item: SwString) -> Bool {
    return self.firstMatch(in: item) != nil
  }

  public func firstMatch(in value: SwString) -> Nullable<SwString> {
    let str = value.asPrimitiveString()
    let range = NSRange(str.startIndex..., in: str)
    guard let match = regex.firstMatch(in: str, range: range),
      let matchRange = Range(match.range, in: str)
    else {
      return nil
    }
    return SwString(String(str[matchRange]))
  }

  func replace(in value: String, with replacement: String) -> String {
    let range = NSRange(value.startIndex..., in: value)
    return regex.stringByReplacingMatches(in: value, range: range, withTemplate: replacement)
  }
}

public typealias TsRegex = SwRegex
