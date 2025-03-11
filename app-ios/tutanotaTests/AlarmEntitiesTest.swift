import Testing

@testable import TutanotaSharedFramework

struct AlarmEntitiesTest {
	@Test func testParsingAlarmInterval() {
		#expect(AlarmInterval(string: "3M") == AlarmInterval(unit: .minute, value: 3))
		#expect(AlarmInterval(string: "4H") == AlarmInterval(unit: .hour, value: 4))
		#expect(AlarmInterval(string: "11D") == AlarmInterval(unit: .day, value: 11))
		#expect(AlarmInterval(string: "22W") == AlarmInterval(unit: .week, value: 22))
	}
}
