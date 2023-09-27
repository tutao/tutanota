import Foundation
import XCTest
@testable import tutanota

class KyberTest : XCTestCase {
  func testRoundTrip() throws {
    let keypair = generateKyberKeypair(withSeed: generateRandomNumbers(count: 64))
    let encaps = try kyberEncapsulate(publicKey: keypair.publicKey, withSeed: generateRandomNumbers(count: 64))
    let decaps = try kyberDecapsulate(ciphertext: encaps.ciphertext.data, withPrivateKey: keypair.privateKey)
    XCTAssertEqual(decaps.data, encaps.sharedSecret.data)
  }
  
  private func generateRandomNumbers(count: Int) -> Data {
    var output = Data()
    output.reserveCapacity(count)
  
    var rng = SystemRandomNumberGenerator()
    
    while output.count < count {
      var random = rng.next()
      let asBytes: [UInt8] = withUnsafeBytes(of: &random, Array.init)
      output.append(contentsOf: asBytes)
    }
    
    output.count = count
    return output
  }
}
