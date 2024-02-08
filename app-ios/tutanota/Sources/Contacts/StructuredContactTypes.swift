import Contacts

enum ContactAddressType: String, Codable {
  case _private = "0"
  case work = "1"
  case other = "2"
  case custom = "3"
}

enum ContactPhoneNumberType: String, Codable {
  case _private = "0"
  case work = "1"
  case mobile = "2"
  case fax = "3"
  case other = "4"
  case custom = "5"
}
