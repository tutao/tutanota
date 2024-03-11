import Foundation

/// A key that encrypt the fields for a given notification
public struct NotificationSessionKey: Codable {
	public let pushIdentifier: IdTuple
	public let pushIdentifierSessionEncSessionKey: String
}
