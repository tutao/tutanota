import Foundation

func encodableToNSOjbect<T: Encodable>(value: T) -> Any {
  // This is not very efficient but hopefully we only need it temporarily
  let data = try! JSONEncoder().encode(value)
  return try! JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed])
}

func nsobjectToEncodable<T: Decodable>(value: NSObject) -> T {
  let data = try! JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed])
  return try! JSONDecoder().decode(T.self, from: data)
}
