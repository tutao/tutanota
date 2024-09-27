import Foundation

extension NSURLQueryItem {
	public static func from(dict: [String: String]) -> [URLQueryItem] {
		var result: [URLQueryItem] = []
		for (key, value) in dict { result.append(URLQueryItem(name: key, value: value)) }
		return result
	}
}
