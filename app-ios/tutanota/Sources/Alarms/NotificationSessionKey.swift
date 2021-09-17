import Foundation

struct NotificationSessionKey : Codable {
  let pushIdentifier: IdTuple
  let pushIdentifierSessionEncSessionKey: String
}
