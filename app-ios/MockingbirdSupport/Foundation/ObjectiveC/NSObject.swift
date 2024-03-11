import ObjectiveC

public protocol NSObjectProtocol {}

open class NSObject: NSObjectProtocol { public init() {} }

public protocol NSCopying { func copy(with zone: NSZone?) -> Any }

public protocol NSMutableCopying { func mutableCopy(with zone: NSZone?) -> Any }

public protocol NSCoding {
	func encode(with coder: NSCoder)
	init?(coder: NSCoder)
}
