import Foundation

/// Info persisted on disk for dealing with notifications
struct SSEInfo {
  /// Identifier of the device
  var pushIdentifier: String
  /// What server to connect to
  var sseOrigin: String
  /// What users we are handling
  var userIds: [String]
}

extension SSEInfo : Codable {}
