import Foundation

extension NSURLQueryItem {
  public static func from(dict: Dictionary<String, String>) -> Array<URLQueryItem> {
    var result: Array<URLQueryItem> = []
    for (key, value) in dict {
      result.append(URLQueryItem(name: key, value: value))
    }
    return result
  }
}
