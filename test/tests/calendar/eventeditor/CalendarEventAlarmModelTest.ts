import o from "@tutao/otest"
import { CalendarEventAlarmModel } from "../../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventAlarmModel.js"
import { lang } from "../../../../src/common/misc/LanguageViewModel.js"
import en from "../../../../src/mail-app/translations/en.js"
import { EventType } from "../../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { object, when } from "testdouble"
import { DateProvider } from "../../../../src/common/api/common/DateProvider.js"
import { AlarmIntervalUnit, StandardAlarmInterval } from "../../../../src/common/calendar/date/CalendarUtils.js"
import { createTestEntity } from "../../TestUtils"
import { DefaultAlarmInfoTypeRef, GroupSettingsTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { serializeAlarmInterval } from "../../../../src/common/api/common/utils/CommonCalendarUtils"

const dateProvider: DateProvider = object()
when(dateProvider.now()).thenReturn(42)

o.spec("CalendarEventAlarmModel", function () {
	const languageTag = "en"
	o.before(async function () {
		await lang.init(en)
		await lang.setLanguage({
			code: languageTag,
			languageTag: languageTag,
		})
	})
	o.spec("alarm trigger sets", function () {
		o("alarm initialization works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [StandardAlarmInterval.ONE_HOUR], dateProvider)
			o(model.alarms).deepEquals([StandardAlarmInterval.ONE_HOUR])
			o(model.result.alarms.map(({ trigger }) => trigger)).deepEquals(["1H"])
		})

		o("adding alarms works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [StandardAlarmInterval.ONE_HOUR], dateProvider)

			model.addAlarm(StandardAlarmInterval.ONE_DAY)
			o(model.alarms).deepEquals([StandardAlarmInterval.ONE_HOUR, StandardAlarmInterval.ONE_DAY])
			const { alarms } = model.result
			o(alarms.map(({ trigger }) => trigger)).deepEquals(["1H", "1D"])
		})

		o("removing an alarm works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [StandardAlarmInterval.ONE_HOUR], dateProvider)
			model.removeAlarm(StandardAlarmInterval.ONE_HOUR)
			model.removeAlarm(StandardAlarmInterval.ONE_DAY)
			o(model.alarms).deepEquals([])
			const { alarms } = model.result
			o(alarms).deepEquals([])
		})

		o("editing capability", function () {
			o(new CalendarEventAlarmModel(EventType.SHARED_RO, [], dateProvider).canEditReminders).equals(false)
			o(new CalendarEventAlarmModel(EventType.EXTERNAL, [], dateProvider).canEditReminders).equals(false)

			o(new CalendarEventAlarmModel(EventType.LOCKED, [], dateProvider).canEditReminders).equals(true)
			o(new CalendarEventAlarmModel(EventType.SHARED_RW, [], dateProvider).canEditReminders).equals(true)
			o(new CalendarEventAlarmModel(EventType.INVITE, [], dateProvider).canEditReminders).equals(true)
			o(new CalendarEventAlarmModel(EventType.OWN, [], dateProvider).canEditReminders).equals(true)
		})
	})

	o.spec("isEqualAlarms", function () {
		o("two equal alarms", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [StandardAlarmInterval.ONE_HOUR], dateProvider)
			o(
				model.isEqualAlarms(StandardAlarmInterval.ONE_HOUR, {
					value: 60,
					unit: AlarmIntervalUnit.MINUTE,
				}),
			).equals(true)
		})

		o("two different alarms", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [StandardAlarmInterval.ONE_HOUR], dateProvider)
			o(
				model.isEqualAlarms(StandardAlarmInterval.ONE_HOUR, {
					value: 1,
					unit: AlarmIntervalUnit.DAY,
				}),
			).equals(false)
		})
	})

	o.spec("removeCalendarDefaultAlarms", function () {
		const defaultAlarms = [StandardAlarmInterval.FIVE_MINUTES]
		const calendarId = "calendarTest"
		const groupSettings = [
			createTestEntity(GroupSettingsTypeRef, {
				group: calendarId,
				defaultAlarmsList: defaultAlarms.map((alarm) => createTestEntity(DefaultAlarmInfoTypeRef, { trigger: serializeAlarmInterval(alarm) })),
			}),
		]

		o.test("event has only default alarms", async function () {
			// Arrange
			const model = new CalendarEventAlarmModel(EventType.OWN, defaultAlarms, dateProvider)
			// Act
			await model.removeCalendarDefaultAlarms(calendarId, groupSettings)
			// Assert
			o.check(model.alarms.length).equals(0)
		})

		o.test("event has default alarms + custom alarms", async function () {
			// Arrange
			const model = new CalendarEventAlarmModel(EventType.OWN, [...defaultAlarms, StandardAlarmInterval.ONE_HOUR], dateProvider)
			// Act
			await model.removeCalendarDefaultAlarms(calendarId, groupSettings)
			// Assert
			o.check(model.alarms.length).equals(1)
			o.check(model.alarms.at(0)).deepEquals(StandardAlarmInterval.ONE_HOUR)
		})
	})
})
