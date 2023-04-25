import o from "ospec"
import { AlarmInterval } from "../../../../src/api/common/TutanotaConstants.js"
import { CalendarEventAlarmModel } from "../../../../src/calendar/date/eventeditor/CalendarEventAlarmModel.js"
import { createAlarmIntervalItems } from "../../../../src/calendar/date/CalendarUtils.js"
import { lang } from "../../../../src/misc/LanguageViewModel.js"
import en from "../../../../src/translations/en.js"
import { EventType } from "../../../../src/calendar/date/eventeditor/CalendarEventModel.js"
import { object, when } from "testdouble"
import { DateProvider } from "../../../../src/api/common/DateProvider.js"

const dateProvider: DateProvider = object()
when(dateProvider.now()).thenReturn(42)

o.spec("CalendarEventAlarmModel", function () {
	o.before(async function () {
		await lang.init(en)
		await lang.setLanguage({
			code: "en",
			languageTag: "en",
		})
	})
	o.spec("alarm trigger sets", function () {
		o("alarm initialization works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [AlarmInterval.ONE_HOUR], dateProvider)
			o(model.splitTriggers(createAlarmIntervalItems(), (i) => i.value).taken.map((i) => i.value)).deepEquals([AlarmInterval.ONE_HOUR])
			o(model.result.alarms.map(({ trigger }) => trigger)).deepEquals([AlarmInterval.ONE_HOUR])
		})

		o("setting an alarm with the same trigger multiple times does not change the result", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [], dateProvider)

			model.addAlarm(AlarmInterval.ONE_HOUR)
			model.addAlarm(AlarmInterval.ONE_HOUR)
			o(model.splitTriggers(createAlarmIntervalItems(), (i) => i.value).taken.map((i) => i.value)).deepEquals([AlarmInterval.ONE_HOUR])
			o(model.result.alarms.map(({ trigger }) => trigger)).deepEquals([AlarmInterval.ONE_HOUR])
		})

		o("adding alarms works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [AlarmInterval.ONE_HOUR], dateProvider)

			model.addAlarm(AlarmInterval.ONE_DAY)
			o(model.splitTriggers(createAlarmIntervalItems(), (i) => i.value).taken.map((i) => i.value)).deepEquals([
				AlarmInterval.ONE_HOUR,
				AlarmInterval.ONE_DAY,
			])
			const { alarms } = model.result
			o(alarms.map(({ trigger }) => trigger)).deepEquals([AlarmInterval.ONE_HOUR, AlarmInterval.ONE_DAY])
		})

		o("removing an alarm works", function () {
			const model = new CalendarEventAlarmModel(EventType.OWN, [AlarmInterval.ONE_HOUR], dateProvider)
			model.removeAlarm(AlarmInterval.ONE_HOUR)
			model.removeAlarm(AlarmInterval.ONE_DAY)
			o(model.splitTriggers(createAlarmIntervalItems(), (i) => i.value).taken.map((i) => i.value)).deepEquals([])
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
})
