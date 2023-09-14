import Foundation
import XCTest
@testable import tutanota

// used for testing Swift code
class CompatibilityTestSwift: XCTestCase {
  var testData: [String: Any]?
  
  override func setUp() async throws {
    try await super.setUp()
    
    let jsonUrl = Bundle(for: self.classForCoder).url(forResource: "CompatibilityTestData", withExtension: "json")!
    let jsonData = try Data.init(contentsOf: jsonUrl)
    self.testData = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any]
  }
  
  func testArgon2id() {
    let ARGON2ID_HASH_LENGTH: Int = 32
    let ARGON2ID_ITERATIONS: UInt = 4
    let ARGON2ID_PARALLELISM: UInt = 1
    let ARGON2ID_MEMORY_COST: UInt = 32 * 1024
    
    let tests = (testData!["argon2idTests"] as? [[String: String]])!
    for test in tests {
      let password = TUTEncodingConverter.string(toBytes: test["password"]!)
      let expectedHash = TUTEncodingConverter.hex(toBytes: test["keyHex"]!)
      let salt = TUTEncodingConverter.hex(toBytes: test["saltHex"]!)
      let result = try! generateArgon2idHash(ofPassword: password, ofHashLength: ARGON2ID_HASH_LENGTH, withSalt: salt, withIterations: ARGON2ID_ITERATIONS, withParallelism: ARGON2ID_PARALLELISM, withMemoryCost: ARGON2ID_MEMORY_COST)
      
      XCTAssertEqual(expectedHash, result)
    }
  }
}
