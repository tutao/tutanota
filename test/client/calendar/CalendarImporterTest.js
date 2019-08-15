//@flow
import o from "ospec/ospec.js"
import {parseCalendarStringData, serializeCalendar, serializeEvent} from "../../../src/calendar/CalendarImporter"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {DateTime} from "luxon"
import {createAlarmInfo} from "../../../src/api/entities/sys/AlarmInfo"
import {createUserAlarmInfo} from "../../../src/api/entities/sys/UserAlarmInfo"
import {AlarmInterval, EndType, RepeatPeriod} from "../../../src/api/common/TutanotaConstants"
import {createRepeatRule} from "../../../src/api/entities/sys/RepeatRule"
import {getAllDayDateUTC} from "../../../src/calendar/CalendarUtils"

const zone = "Europe/Berlin"
const now = new Date(1565704860630)
o.spec("CalendarImporterTest", function () {

	o.spec("serializeEvent", function () {
		o("simple one", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					description: "Descr \\ ; \n",
					uid: "test@tutanota.com",
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				"UID:test@tutanota.com",
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"END:VEVENT"
			])
		})

		o("all day", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, zone: "UTC"}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 14, zone: "UTC"}).toJSDate(),
					description: "Descr \\ ; \n",
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART:20190813`,
				`DTEND:20190914`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"END:VEVENT"
			])
		})

		o("with alarms", function () {
			const alarmOne = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					alarmIdentifier: "123",
					trigger: AlarmInterval.ONE_DAY,
				})
			})
			const alarmTwo = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					alarmIdentifier: "102",
					trigger: AlarmInterval.THIRTY_MINUTES,
				})
			})

			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					description: "Descr \\ ; \n",
				}), [alarmOne, alarmTwo], now)
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",

				"BEGIN:VALARM",
				"ACTION:DISPLAY",
				"DESCRIPTION:This is an event reminder",
				"TRIGGER:-P1D",
				"END:VALARM",

				"BEGIN:VALARM",
				"ACTION:DISPLAY",
				"DESCRIPTION:This is an event reminder",
				"TRIGGER:-PT30M",
				"END:VALARM",

				"END:VEVENT"
			])
		})

		o("with repeat rule (never ends)", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					repeatRule: createRepeatRule({
						endType: EndType.Never,
						interval: "3",
						frequency: RepeatPeriod.WEEKLY,
						timeZone: zone,
					}),
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=WEEKLY;INTERVAL=3",
				"END:VEVENT"
			])
		})

		o("with repeat rule (ends after occurrences)", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					repeatRule: createRepeatRule({
						endType: EndType.Count,
						interval: "3",
						frequency: RepeatPeriod.DAILY,
						endValue: "100",
						timeZone: zone,
					}),
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=DAILY;INTERVAL=3;COUNT=100",
				"END:VEVENT"
			])
		})

		o("with repeat rule (ends on a date)", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					repeatRule: createRepeatRule({
						endType: EndType.UntilDate,
						interval: "3",
						frequency: RepeatPeriod.MONTHLY,
						endValue: String(DateTime.fromObject({year: 2019, month: 9, day: 20, zone}).toMillis()),
						timeZone: zone,
					}),
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919T215959Z",
				"END:VEVENT"
			])
		})

		o("with repeat rule (ends on a date, all-day)", function () {
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 13, zone}).toJSDate()),
					endTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 15, zone}).toJSDate()),
					repeatRule: createRepeatRule({
						endType: EndType.UntilDate,
						interval: "3",
						frequency: RepeatPeriod.MONTHLY,
						// Beginning of 20th will be displayed to the user as 19th
						endValue: String(getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 9, day: 20, zone}).toJSDate()).getTime()),
						timeZone: zone,
					}),
				}), [], now)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART:20190813`,
				`DTEND:20190815`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919",
				"END:VEVENT"
			])
		})

	})

	o("importer", function () {
		o(parseCalendarStringData([
				"BEGIN:VCALENDAR",
				"PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN",
				"VERSION:2.0",
				"CALSCALE:GREGORIAN",
				"METHOD:PUBLISH",
				"BEGIN:VEVENT",
				`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
				`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:test@tutanota.com`,
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=WEEKLY;INTERVAL=3",
				"END:VEVENT",
				"END:VCALENDAR"
			].join("\r\n"))[0]
		).deepEquals([
			{
				event: createCalendarEvent({
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					uid: "test@tutanota.com",
					repeatRule: createRepeatRule({
						endType: EndType.Never,
						interval: "3",
						frequency: RepeatPeriod.WEEKLY,
						timeZone: zone,
					})
				}),
				alarms: []
			},

		][0])
	})

	o("roundtrip export -> import", function () {
		const alarmOne = createUserAlarmInfo({
			alarmInfo: createAlarmInfo({
				trigger: AlarmInterval.ONE_DAY,
			})
		})
		const alarmTwo = createUserAlarmInfo({
			alarmInfo: createAlarmInfo({
				trigger: AlarmInterval.THIRTY_MINUTES,
			})
		})

		const events = [
			{
				event: createCalendarEvent({
					_id: ["123", "456"],
					summary: "Word \\ ; \n simple",
					startTime: DateTime.fromObject({year: 2019, month: 1, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					description: "Descr \\ ; \n",
					uid: "test@tutanota.com",
				}),
				alarms: []
			},
			{
				event: createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n alarms",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
				}),
				alarms: [alarmOne, alarmTwo]
			},
			{
				event: createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
					repeatRule: createRepeatRule({
						endType: EndType.UntilDate,
						interval: "3",
						frequency: RepeatPeriod.MONTHLY,
						endValue: String(DateTime.fromObject({year: 2019, month: 9, day: 20, zone}).toMillis()),
						timeZone: zone,
					}),
				}),
				alarms: []
			},
			{
				event: createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 13, zone}).toJSDate()),
					endTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 15, zone}).toJSDate()),
					uid: "b64lookingValue==",
					repeatRule: createRepeatRule({
						endType: EndType.UntilDate,
						interval: "3",
						frequency: RepeatPeriod.MONTHLY,
						// Beginning of 20th will be displayed to the user as 19th
						endValue: String(getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 9, day: 20, zone}).toJSDate()).getTime()),
					}),
				}),
				alarms: []
			}
		]
		const versionNumber = "3.57.6"
		const serialized = serializeCalendar(versionNumber, events, now)
		const eventsWithoutIds = events.map(({event, alarms}) => {
			return {
				event: Object.assign({}, event, {_id: null, uid: event.uid || `ownerId${now.getTime()}@tutanota.com`, _ownerGroup: null}),
				alarms: alarms.map(a => a.alarmInfo),
			}
		})
		const parsed = parseCalendarStringData(serialized)
		o(parsed).deepEquals(eventsWithoutIds)
	})

	o("roundtrip import -> export", function () {
		const text = `BEGIN:VCALENDAR
PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20190813T030600Z
DTEND:20190913T030600Z
DTSTAMP:20190813T140100Z
UID:test@tutanota.com
SUMMARY:Word \\\\ \\; \\n simple
DESCRIPTION:Descr \\\\ \\; \\n
END:VEVENT
BEGIN:VEVENT
DTSTART:20190813T030600Z
DTEND:20190913T030600Z
DTSTAMP:20190813T140100Z
UID:123456@tutanota.com
SUMMARY:Word \\\\ \\; \\n alarms
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:This is an event reminder
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:This is an event reminder
TRIGGER:-PT30M
END:VALARM
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Berlin:20190813T050600
DTEND;TZID=Europe/Berlin:20190913T050600
DTSTAMP:20190813T140100Z
UID:123456@tutanota.com
SUMMARY:Word \\\\ \\; \\n repeating
RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919T215959Z
END:VEVENT
BEGIN:VEVENT
DTSTART:20190813
DTEND:20190815
DTSTAMP:20190813T140100Z
UID:b64lookingValue==
SUMMARY:Word \\\\ \\; \\n
RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919
END:VEVENT
END:VCALENDAR`
			.split("\n").join("\r\n")

		const versionNumber = "3.57.6"
		const parsed = parseCalendarStringData(text)
		const serialized = serializeCalendar(versionNumber, parsed.map(({event, alarms}) => {
			return {
				event: Object.assign({}, event, {_id: ["123", "456"]}),
				alarms: alarms.map(alarmInfo => createUserAlarmInfo({alarmInfo}))
			}
		}), now)

		o(serialized).deepEquals(text)
	})
})


