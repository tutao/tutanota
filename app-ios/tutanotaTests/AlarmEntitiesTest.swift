import XCTest

@testable import TutanotaSharedFramework

class AlarmEntitiesTest: XCTestCase {
	func testParsingAlarmInterval() {
		XCTAssertEqual(AlarmInterval(string: "3M"), AlarmInterval(unit: .minute, value: 3))
		XCTAssertEqual(AlarmInterval(string: "4H"), AlarmInterval(unit: .hour, value: 4))
		XCTAssertEqual(AlarmInterval(string: "11D"), AlarmInterval(unit: .day, value: 11))
		XCTAssertEqual(AlarmInterval(string: "22W"), AlarmInterval(unit: .week, value: 22))
	}
}
