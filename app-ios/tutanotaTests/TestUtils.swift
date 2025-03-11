import Foundation

class CompatibilityTestData {
	static func load<T>() -> T where T: Decodable {
		let jsonUrl = Bundle(for: Self.self).url(forResource: "CompatibilityTestData", withExtension: "json")!
		let jsonData = try! Data(contentsOf: jsonUrl)
		return try! JSONDecoder().decode(T.self, from: jsonData)
	}
}
