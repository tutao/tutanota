import Foundation
import XCTest

@testable import TutanotaSharedFramework

class KyberTest: XCTestCase {
	func testRoundTrip() async throws {
		let facade = IosNativeCryptoFacade()
		let ignoredSeed = generateRandomNumbers(count: 64).wrap()
		let keypair = try await facade.generateKyberKeypair(ignoredSeed)
		let encaps = try await facade.kyberEncapsulate(keypair.publicKey, ignoredSeed)
		let decaps = try await facade.kyberDecapsulate(keypair.privateKey, encaps.ciphertext)
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
