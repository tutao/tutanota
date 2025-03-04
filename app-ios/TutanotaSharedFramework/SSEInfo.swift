import Foundation

/// Info persisted on disk for dealing with notifications
public struct SSEInfo {
	/// Identifier of the device
	public var pushIdentifier: String
	/// What server to connect to
	public var sseOrigin: String
	/// What users we are handling
	public var userIds: [String]

	public init(pushIdentifier: String, sseOrigin: String, userIds: [String]) {
		self.pushIdentifier = pushIdentifier
		self.sseOrigin = sseOrigin
		self.userIds = userIds
	}
}

extension SSEInfo: Codable {}
