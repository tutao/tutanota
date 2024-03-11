public protocol Hashable: Equatable {
	var hashValue: Int { get }
	func hash(into hasher: inout Hasher)
}
