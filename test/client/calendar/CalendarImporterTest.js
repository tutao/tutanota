//@flow
import o from "ospec"
import {parseCalendarStringData, serializeCalendar, serializeEvent} from "../../../src/calendar/export/CalendarImporter"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {DateTime} from "luxon"
import {createAlarmInfo} from "../../../src/api/entities/sys/AlarmInfo"
import {createUserAlarmInfo} from "../../../src/api/entities/sys/UserAlarmInfo"
import {AlarmInterval, CalendarAttendeeStatus, EndType, RepeatPeriod} from "../../../src/api/common/TutanotaConstants"
import {createRepeatRule} from "../../../src/api/entities/sys/RepeatRule"
import {getAllDayDateUTC} from "../../../src/api/common/utils/CommonCalendarUtils"
import {getAllDayDateUTCFromZone} from "../../../src/calendar/date/CalendarUtils"
import {createCalendarEventAttendee} from "../../../src/api/entities/tutanota/CalendarEventAttendee"
import {createEncryptedMailAddress} from "../../../src/api/entities/tutanota/EncryptedMailAddress"

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
					location: "Some location",
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				"UID:test@tutanota.com",
				"SEQUENCE:0",
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"LOCATION:Some location",
				"END:VEVENT"
			])
		})

		o("all day", function () {
			const zone = 'utc'
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, zone}).toJSDate(),
					endTime: DateTime.fromObject({year: 2019, month: 9, day: 14, zone}).toJSDate(),
					description: "Descr \\ ; \n",
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;VALUE=DATE:20190813`,
				`DTEND;VALUE=DATE:20190914`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"END:VEVENT"
			])
		})

		o("all day west of UTC", function () {
			// Event though we try to set it to New York, it's not really possible to check without changing system time because of how
			// js Date works.
			const zone = "America/New_York"
			o(serializeEvent(createCalendarEvent({
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "s",
					startTime: getAllDayDateUTC(DateTime.fromObject({year: 2020, month: 7, day: 31}).toJSDate()),
					endTime: getAllDayDateUTC(DateTime.fromObject({year: 2020, month: 8, day: 1}).toJSDate()),
					description: "d"
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;VALUE=DATE:20200731`,
				`DTEND;VALUE=DATE:20200801`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:s",
				"DESCRIPTION:d",
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
				}), [alarmOne, alarmTwo], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
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
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
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
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
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
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;TZID=${zone}:20190813T050600`,
				`DTEND;TZID=${zone}:20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
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
					startTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 13}).toJSDate()),
					endTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 15}).toJSDate()),
					repeatRule: createRepeatRule({
						endType: EndType.UntilDate,
						interval: "3",
						frequency: RepeatPeriod.MONTHLY,
						// Beginning of 20th will be displayed to the user as 19th
						endValue: String(getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 9, day: 20}).toJSDate()).getTime()),
						timeZone: zone,
					}),
				}), [], now, zone)
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;VALUE=DATE:20190813`,
				`DTEND;VALUE=DATE:20190815`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:Word \\\\ \\; \\n",
				"RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919",
				"END:VEVENT"
			])
		})
	})

	o.spec("import", function () {
		o("regular event", function () {
			o(parseCalendarStringData([
					"BEGIN:VCALENDAR",
					"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
					"VERSION:2.0",
					"CALSCALE:GREGORIAN",
					"METHOD:PUBLISH",
					"BEGIN:VEVENT",
					`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
					`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
					`DTSTAMP:20190813T140100Z`,
					`UID:test@tutanota.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=WEEKLY;INTERVAL=3",
					"END:VEVENT",
					"END:VCALENDAR"
				].join("\r\n"), zone)
			).deepEquals(
				{
					method: "PUBLISH",
					contents: [
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

					]
				})
		})

		o("with attendee", function () {
			const parsedEvent = parseCalendarStringData([
				"BEGIN:VCALENDAR",
				"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
				"VERSION:2.0",
				"CALSCALE:GREGORIAN",
				"METHOD:PUBLISH",
				"BEGIN:VEVENT",
				`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
				`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:test@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:s",
				"ORGANIZER:mailto:organizer@tutanota.com",
				"ATTENDEE;PARTSTAT=NEEDS-ACTION:mailto:test@example.com",
				"END:VEVENT",
				"END:VCALENDAR"
			].join("\r\n"), zone)
			o(parsedEvent).deepEquals(
				{
					method: "PUBLISH",
					contents: [
						{
							event: createCalendarEvent({
								summary: "s",
								startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								uid: "test@tutanota.com",
								organizer: createEncryptedMailAddress({name: "", address: "organizer@tutanota.com"}),
								attendees: [
									createCalendarEventAttendee({
										address: createEncryptedMailAddress({name: "", address: "test@example.com"}),
										status: CalendarAttendeeStatus.NEEDS_ACTION,
									})
								]
							}),
							alarms: []
						},
					]
				})
		})

		o("with attendee uppercase mailto", function () {
			// GMX does this

			const parsedEvent = parseCalendarStringData([
				"BEGIN:VCALENDAR",
				"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
				"VERSION:2.0",
				"CALSCALE:GREGORIAN",
				"METHOD:PUBLISH",
				"BEGIN:VEVENT",
				`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
				`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:test@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:s",
				"ORGANIZER:MAILTO:organizer@tutanota.com",
				"ATTENDEE;PARTSTAT=NEEDS-ACTION:MAILTO:test@example.com",
				"END:VEVENT",
				"END:VCALENDAR"
			].join("\r\n"), zone)
			o(parsedEvent).deepEquals(
				{
					method: "PUBLISH",
					contents: [
						{
							event: createCalendarEvent({
								summary: "s",
								startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								uid: "test@tutanota.com",
								organizer: createEncryptedMailAddress({name: "", address: "organizer@tutanota.com"}),
								attendees: [
									createCalendarEventAttendee({
										address: createEncryptedMailAddress({name: "", address: "test@example.com",}),
										status: CalendarAttendeeStatus.NEEDS_ACTION,
									})
								]
							}),
							alarms: []
						},
					]
				})
		})

		o("with attendee without PARTSTAT", function () {
			// Outlook 16 does this
			// RFC says NEEDS-ACTION is default
			// https://tools.ietf.org/html/rfc5545#section-3.2.12
			const parsedEvent = parseCalendarStringData([
				"BEGIN:VCALENDAR",
				"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
				"VERSION:2.0",
				"CALSCALE:GREGORIAN",
				"METHOD:PUBLISH",
				"BEGIN:VEVENT",
				`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
				`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
				`DTSTAMP:20190813T140100Z`,
				`UID:test@tutanota.com`,
				"SEQUENCE:0",
				"SUMMARY:s",
				"ORGANIZER:MAILTO:organizer@tutanota.com",
				"ATTENDEE:mailto:test@example.com",
				"END:VEVENT",
				"END:VCALENDAR"
			].join("\r\n"), zone)
			o(parsedEvent).deepEquals(
				{
					method: "PUBLISH",
					contents: [
						{
							event: createCalendarEvent({
								summary: "s",
								startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
								uid: "test@tutanota.com",
								organizer: createEncryptedMailAddress({name: "", address: "organizer@tutanota.com"}),
								attendees: [
									createCalendarEventAttendee({
										address: createEncryptedMailAddress({name: "", address: "test@example.com",}),
										status: CalendarAttendeeStatus.NEEDS_ACTION,
									})
								]
							}),
							alarms: []
						},
					]
				})
		})

		o("all-day event", function () {
			o(parseCalendarStringData([
					"BEGIN:VCALENDAR",
					"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
					"VERSION:2.0",
					"CALSCALE:GREGORIAN",
					"METHOD:PUBLISH",
					"BEGIN:VEVENT",
					"SUMMARY:Labor Day / May Day",
					"DTSTART;VALUE=DATE:20200501",
					"DTEND;VALUE=DATE:20200502",
					"LOCATION:Brazil",
					"DESCRIPTION:Some description",
					"UID:5e528f277e20e1582468903@calendarlabs.com",
					"DTSTAMP:20200223T144143Z",
					"STATUS:CONFIRMED",
					"TRANSP:TRANSPARENT",
					"SEQUENCE:0",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"), zone).contents[0]
			).deepEquals(
				{
					event: createCalendarEvent({
						summary: "Labor Day / May Day",
						startTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 1, zone}).toJSDate(), zone),
						endTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 2, zone}).toJSDate(), zone),
						uid: "5e528f277e20e1582468903@calendarlabs.com",
						description: "Some description",
						location: "Brazil",
					}),
					alarms: []
				},
			)
		})

		o("all-day event with invalid DTEND", function () {
			o(parseCalendarStringData([
					"BEGIN:VCALENDAR",
					"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
					"VERSION:2.0",
					"CALSCALE:GREGORIAN",
					"METHOD:PUBLISH",
					"BEGIN:VEVENT",
					"SUMMARY:Labor Day / May Day",
					"DTSTART;VALUE=DATE:20200501",
					"DTEND;VALUE=DATE:20200501",
					"LOCATION:Brazil",
					"DESCRIPTION:Some description",
					"UID:5e528f277e20e1582468903@calendarlabs.com",
					"DTSTAMP:20200223T144143Z",
					"STATUS:CONFIRMED",
					"TRANSP:TRANSPARENT",
					"SEQUENCE:0",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"), zone).contents[0]
			).deepEquals(
				{
					event: createCalendarEvent({
						summary: "Labor Day / May Day",
						startTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 1, zone}).toJSDate(), zone),
						endTime: getAllDayDateUTCFromZone(DateTime.fromObject({year: 2020, month: 5, day: 2, zone}).toJSDate(), zone),
						uid: "5e528f277e20e1582468903@calendarlabs.com",
						description: "Some description",
						location: "Brazil",
					}),
					alarms: []
				},
			)
		})

		o("with alarm in the future", function () {
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
					"BEGIN:VALARM",
					"ACTION:DISPLAY",
					"TRIGGER:P1D",
					"END:VALARM",
					"END:VEVENT",
					"END:VCALENDAR"
				].join("\r\n"), zone)
			).deepEquals({
				method: "PUBLISH",
				contents: [
					{
						event: createCalendarEvent({
							summary: "Word \\ ; \n",
							startTime: DateTime.fromObject({year: 2019, month: 8, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
							endTime: DateTime.fromObject({year: 2019, month: 9, day: 13, hour: 5, minute: 6, zone}).toJSDate(),
							uid: "test@tutanota.com",
							repeatRule: null,
						}),
						alarms: []
					},

				]
			})
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
						sequence: "1",
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
						sequence: "2",
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
						startTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 13}).toJSDate()),
						endTime: getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 8, day: 15}).toJSDate()),
						uid: "b64lookingValue==",
						repeatRule: createRepeatRule({
							endType: EndType.UntilDate,
							interval: "3",
							frequency: RepeatPeriod.MONTHLY,
							// Beginning of 20th will be displayed to the user as 19th
							endValue: String(getAllDayDateUTC(DateTime.fromObject({
								year: 2019,
								month: 9,
								day: 20,
								zone
							}).toJSDate()).getTime()),
						}),
					}),
					alarms: []
				}
			]
			const versionNumber = "3.57.6"
			const serialized = serializeCalendar(versionNumber, events, now, zone)
			const eventsWithoutIds = events.map(({event, alarms}) => {
				return {
					event: Object.assign({}, event, {
						_id: null,
						uid: event.uid || `ownerId${now.getTime()}@tutanota.com`,
						_ownerGroup: null
					}),
					alarms: alarms.map(a => a.alarmInfo),
				}
			})
			const parsed = parseCalendarStringData(serialized, zone)
			o(parsed).deepEquals({
				method: "PUBLISH",
				contents: eventsWithoutIds,
			})
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
SEQUENCE:1
SUMMARY:Word \\\\ \\; \\n simple
DESCRIPTION:Descr \\\\ \\; \\n
END:VEVENT
BEGIN:VEVENT
DTSTART:20190813T030600Z
DTEND:20190913T030600Z
DTSTAMP:20190813T140100Z
UID:123456@tutanota.com
SEQUENCE:0
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
SEQUENCE:2
SUMMARY:Word \\\\ \\; \\n repeating
RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919T215959Z
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20190813
DTEND;VALUE=DATE:20190815
DTSTAMP:20190813T140100Z
UID:b64lookingValue==
SEQUENCE:0
SUMMARY:Word \\\\ \\; \\n
RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919
END:VEVENT
END:VCALENDAR`
				.split("\n").join("\r\n")

			const zone = "Europe/Berlin"
			const versionNumber = "3.57.6"
			const parsed = parseCalendarStringData(text, zone)
			const serialized = serializeCalendar(versionNumber, parsed.contents.map(({event, alarms}) => {
				return {
					event: Object.assign({}, event, {_id: ["123", "456"]}),
					alarms: alarms.map(alarmInfo => createUserAlarmInfo({alarmInfo}))
				}
			}), now, zone)

			o(serialized).deepEquals(text)
		})
	})
})