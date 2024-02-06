import Contacts

enum ContactAddressType: String {
  case _private = "0"
  case work = "1"
  case other = "2"
  case custom = "3"

  func toCNLabel() -> String {
    switch self {
    case ._private: return CNLabelHome
    case .work: return CNLabelWork
    default: return CNLabelOther
    }
  }
}

enum ContactPhoneNumberType: String {
  case _private = "0"
  case work = "1"
  case mobile = "2"
  case fax = "3"
  case other = "4"
  case custom = "5"

  func toCNLabel() -> String {
    switch self {
    case ._private: return CNLabelHome
    case .work: return CNLabelWork
    case .mobile: return CNLabelPhoneNumberMobile
    case .fax: return CNLabelPhoneNumberOtherFax
    default: return CNLabelOther
    }
  }
}

extension ContactAddressType: Codable {
  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(self)
  }
}

extension ContactPhoneNumberType: Codable {
  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(self)
  }
}
