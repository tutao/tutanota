import Foundation

enum Operation: String, SimpleStringDecodable, Codable {
  case Create = "0"
  case Update = "1"
  case Delete = "2"
}
