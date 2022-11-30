import Foundation
import CryptoKit

/// given a vcard, extract the value of the mandatory formatted name (FN) field or return a default of "contact"
func extractFNfrom(vcard: String) -> String {
  let fnRegex = try! NSRegularExpression(pattern: "^\\s*FN:(.*)$", options: .anchorsMatchLines.union(.caseInsensitive))
  let match = fnRegex.firstMatch(in: vcard, range: NSMakeRange(0, (vcard as NSString).length))
  if match != nil {
    let swiftRange = Range(match!.range(at: 1), in: vcard)!
    let vcardName = String(vcard[swiftRange])
    return vcardName.replacingOccurrences(of:"[^0-9a-zA-Z]", with: "_", options: .regularExpression)
  }
  return "contact"
}

/// generate a file name for a blob of image data we got shared so we can share it as an image file
func generateImageFileName(imageData: Data) -> String {
  let digest = SHA256.hash(data: imageData)
  let hashStr = digest.compactMap { String(format: "%02x", $0) }.joined()
  let sliceIndex = hashStr.index(hashStr.startIndex, offsetBy: 12)
  return "image-".appending(hashStr[..<sliceIndex]).appending(".jpeg")
}
