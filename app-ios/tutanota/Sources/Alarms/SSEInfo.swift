import Foundation

struct SSEInfo {
  var pushIdentifier: String
  var sseOrigin: String
  var userIds: [String]
}

extension SSEInfo : Codable {}
