public protocol Comparable: Equatable {
	static func < (lhs: Self, rhs: Self) -> Bool
	static func <= (lhs: Self, rhs: Self) -> Bool
	static func >= (lhs: Self, rhs: Self) -> Bool
	static func > (lhs: Self, rhs: Self) -> Bool
}
