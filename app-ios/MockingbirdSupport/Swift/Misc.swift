public protocol AnyObject {}

public typealias `class` = AnyObject

public typealias AnyClass = AnyObject.Type

public protocol CustomStringConvertible { var description: String { get } }

public protocol CustomDebugStringConvertible { var debugDescription: String { get } }
