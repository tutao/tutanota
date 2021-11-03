import Foundation
import DictionaryCoding

extension Decodable {
  static func arrayFrom(nsArray: NSArray) throws -> [Self] {
    // DictionaryCoding works only with NSDictionary so if we want to use some other Foundation type we have to
    // wrap it into dictionary.
    let dict: NSDictionary = ["value": nsArray]
    let decoded: DecodableValueWrapper<[Self]> = try DictionaryDecoder().decode(DecodableValueWrapper.self, from: dict)
    return decoded.value
  }
}

fileprivate struct DecodableValueWrapper<T : Decodable> : Decodable {
  let value: T
}
