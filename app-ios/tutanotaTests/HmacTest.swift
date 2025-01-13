import Foundation
import XCTest

@testable import TutanotaSharedFramework

class HmacTest: XCTestCase {
	private func prepareTestData() async -> (IosNativeCryptoFacade, ((DataWrapper, DataWrapper), DataWrapper)) {
		let facade = IosNativeCryptoFacade()
		let rawKey = secureRandomBytes(ofLength: 32)
		let rawData = secureRandomBytes(ofLength: 256)
		let key = DataWrapper(data: Data(bytes: rawKey, count: rawKey.count))
		let data = DataWrapper(data: Data(bytes: rawData, count: rawData.count))
		let computedTag = await facade.hmacSha256(key, data)
		// Swift does not want tuples to exceed two items. So we respect that.
		// Feel free to define a struct for this if these nested tuples bother you.
		return (facade, ((key, data), computedTag))
	}
	func testRoundTrip() async throws {
		let (facade, ((key, data), computedTag)) = await prepareTestData()
		try await facade.verifyHmacSha256(key, data, computedTag)
	}
	func testBadKey() async throws {
		let (facade, ((key, data), computedTag)) = await prepareTestData()
		let rawBadKey = secureRandomBytes(ofLength: 32)
		let badKey = DataWrapper(data: Data(bytes: rawBadKey, count: rawBadKey.count))
		await TUTAssertThrowsErrorAsync(try await facade.verifyHmacSha256(badKey, data, computedTag))
	}
	func testBadData() async throws {
		let (facade, ((key, data), computedTag)) = await prepareTestData()
		let rawBadData = secureRandomBytes(ofLength: 256)
		let badData = DataWrapper(data: Data(bytes: rawBadData, count: rawBadData.count))
		await TUTAssertThrowsErrorAsync(try await facade.verifyHmacSha256(key, badData, computedTag))
	}
}
