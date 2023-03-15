import Foundation

/// A key that encrypt the fields for a given notification
struct NotificationSessionKey : Codable {
  let pushIdentifier: IdTuple
  let pushIdentifierSessionEncSessionKey: String
}
