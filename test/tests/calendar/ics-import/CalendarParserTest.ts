import o from "@tutao/otest"
import { createTestEntity } from "../../TestUtils"
import { EndType, RepeatPeriod } from "../../../../src/platform-kit/app-env"
import { DateTime } from "luxon"
import {
	parseCalendarEvents,
	parseCalendarStringData,
	ParsedCalendarData,
	ParsedEventAlarmTuple,
	parseDuration,
	parseExDates,
	parseICalendar,
	parseProperty,
	parsePropertyKeyValue,
	parseRecurrenceId,
	parseTime,
	parseUntilRruleTime,
	propertySequenceParser,
	triggerToAlarmInterval,
} from "../../../../src/applications/calendar-app/calendar/export/CalendarParser"
import { AlarmInfo, AlarmInfoTypeRef, createDateWrapper, createRepeatRule, UserAlarmInfo, UserAlarmInfoTypeRef } from "@tutao/entities/sys"
import { serializeCalendar, serializeEvent } from "../../../../src/applications/calendar-app/calendar/export/CalendarExporter"
import { CalendarEvent, CalendarEventTypeRef, createCalendarEventAttendee, createEncryptedMailAddress } from "@tutao/entities/tutanota"
import { CalendarAttendeeStatus } from "../../../../src/entities/tutanota/Utils"
import { AlarmIntervalUnit, getAllDayDateUTCFromZone } from "../../../../src/applications/common/calendar/date/CalendarUtils"
import { makeCalendarEventFromIcsCalendarEvent } from "../../../../src/applications/common/calendar/import/ImportExportUtils"
import { getAllDayDateUTC } from "../../../../src/applications/common/api/common/utils/CommonCalendarUtils"
import { ParserError, StringIterator } from "../../../../src/applications/common/misc/parsing/ParserCombinator"
import { getDateInUTC } from "../CalendarTestUtils"

o.spec("CalendarParser", function () {
	const zone = "Europe/Berlin"
	const now = new Date("2019-08-13T14:01:00.630Z")

	o.spec("propertySequenceParser", function () {
		o("simple value", function () {
			o(propertySequenceParser(new StringIterator("DTSTART:20190531T083000Z"))).deepEquals(["DTSTART", null, ":", "20190531T083000Z"])
		})

		o("simple value, property parameter", function () {
			o(propertySequenceParser(new StringIterator("DTSTART;VALUE=DATE:20190607"))).deepEquals([
				"DTSTART",
				[";", [["VALUE", "=", "DATE"]]],
				":",
				"20190607",
			])
		})

		o("simple value, multiple property parameters", function () {
			o(propertySequenceParser(new StringIterator('DTSTART;VALUE=DATE;ANOTHER=VALUE;QUOTED="IN ; QUOTES":20190607'))).deepEquals([
				"DTSTART",
				[
					";",
					[
						["VALUE", "=", "DATE"],
						["ANOTHER", "=", "VALUE"],
						["QUOTED", "=", "IN ; QUOTES"],
					],
				],
				":",
				"20190607",
			])
		})

		o("key-value value", function () {
			o(propertySequenceParser(new StringIterator("RRULE:FREQ=WEEKLY;BYDAY=SA"))).deepEquals(["RRULE", null, ":", "FREQ=WEEKLY;BYDAY=SA"])
		})
	})

	o.spec("parseProperty", function () {
		o("simple value", function () {
			o(parseProperty("DTSTART:20190531T083000Z")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "20190531T083000Z",
			})
		})
		o("simple value, property parameter", function () {
			o(parseProperty("DTSTART;VALUE=DATE:20190607")).deepEquals({
				name: "DTSTART",
				params: {
					VALUE: "DATE",
				},
				value: "20190607",
			})
		})
		o("value with colon", function () {
			o(parseProperty("DTSTART:https://stuff")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "https://stuff",
			})
		})
		o("value with semicolon", function () {
			o(parseProperty("DTSTART:some\\;things")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "some;things",
			})
		})
		o("accept malformed custom property", function () {
			o(parseProperty("CUSTOM_PROP:some value")).deepEquals({
				name: "CUSTOM_PROP",
				params: {},
				value: "some value",
			})
		})
	})

	o("parsePropertyKeyValue", function () {
		o(parsePropertyKeyValue("KEY=VALUE")).deepEquals({
			KEY: "VALUE",
		})
		o(parsePropertyKeyValue("KEY=VALUE;ANOTHERKEY=ANOTHERVALUE")).deepEquals({
			KEY: "VALUE",
			ANOTHERKEY: "ANOTHERVALUE",
		})
	})

	o("parseDuration", function () {
		o(parseDuration("P")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P8W")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: 8,
		})
		o(parseDuration("-P11W6D")).deepEquals({
			positive: false,
			day: 6,
			hour: undefined,
			minute: undefined,
			week: 11,
		})
		o(parseDuration("P36WT21H")).deepEquals({
			positive: true,
			day: undefined,
			hour: 21,
			minute: undefined,
			week: 36,
		})
		o(parseDuration("P1WT1M")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: 1,
			week: 1,
		})
		o(parseDuration("-P11W6DT15H")).deepEquals({
			positive: false,
			day: 6,
			hour: 15,
			minute: undefined,
			week: 11,
		})
		o(parseDuration("P2W5DT30M")).deepEquals({
			positive: true,
			day: 5,
			hour: undefined,
			minute: 30,
			week: 2,
		})
		o(parseDuration("-P11WT15H15M")).deepEquals({
			positive: false,
			day: undefined,
			hour: 15,
			minute: 15,
			week: 11,
		})
		o(parseDuration("-P5W4DT3H18M")).deepEquals({
			positive: false,
			day: 4,
			hour: 3,
			minute: 18,
			week: 5,
		})
		o(parseDuration("P3D")).deepEquals({
			positive: true,
			day: 3,
			hour: undefined,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P22DT60H")).deepEquals({
			positive: true,
			day: 22,
			hour: 60,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P4DT20M")).deepEquals({
			positive: true,
			day: 4,
			hour: undefined,
			minute: 20,
			week: undefined,
		})
		o(parseDuration("P40DT60H120M")).deepEquals({
			positive: true,
			day: 40,
			hour: 60,
			minute: 120,
			week: undefined,
		})
		o(parseDuration("-PT4H")).deepEquals({
			positive: false,
			day: undefined,
			hour: 4,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("PT3H15M")).deepEquals({
			positive: true,
			day: undefined,
			hour: 3,
			minute: 15,
			week: undefined,
		})
		o(parseDuration("PT18M")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: 18,
			week: undefined,
		})
		o(parseDuration("P60DT15M05S")).deepEquals({
			positive: true,
			day: 60,
			hour: undefined,
			minute: 15,
			week: undefined,
		})
		o(() => parseDuration("P8W15M")).throws(Error)
	})

	o("triggerToAlarmInterval", function () {
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H30M")).deepEquals({
			unit: AlarmIntervalUnit.MINUTE,
			value: 5 * 60 + 30,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H30M20S")).deepEquals({
			unit: AlarmIntervalUnit.MINUTE,
			value: 5 * 60 + 30,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H0M")).deepEquals({
			unit: AlarmIntervalUnit.HOUR,
			value: 5,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-P1DT5H0M")).deepEquals({
			unit: AlarmIntervalUnit.HOUR,
			value: 29,
		})
	})

	o.spec("parseTime", function () {
		o.test("time with UTC indicator", function () {
			o(parseTime("20180115T214000Z", null)).deepEquals({
				date: new Date(Date.UTC(2018, 0, 15, 21, 40, 0)),
				allDay: false,
			})
		})

		o.test("time with timezone", function () {
			o(parseTime("20180115T214000", zone)).deepEquals({
				date: new Date(Date.UTC(2018, 0, 15, 20, 40, 0)),
				allDay: false,
			})
		})

		o.test("Edge-case, RFC non-compliant, time with UTC indicator and timezone throws ParserError", function () {
			o.check(() => parseTime("20260617T214000Z", zone)).throws(ParserError)
		})

		o.test("All day event doens't care about timezones", function () {
			o(parseTime("20180115T", zone)).deepEquals({
				date: new Date(Date.UTC(2018, 0, 15, 0, 0, 0)),
				allDay: true,
			})
		})

		o.test("Invalid month throws error", function () {
			o(() => parseTime("20180015T214000Z", "Europe/Berlin")).throws(ParserError)
		})
	})

	o.spec("parseCalendarEvents: fix illegal end times", function () {
		const makeEvent = ({ start, end }) =>
			parseICalendar(
				"BEGIN:VCALENDAR\n" +
					"VERSION:2.0\n" +
					"BEGIN:VEVENT\n" +
					"UID:0c838926-f826-43c9-9f17-4836c565eece\n" +
					"DTSTAMP:20220106T214416Z\n" +
					"SUMMARY;LANGUAGE=de:Gelber Sack\n" +
					`DTSTART:${start}\n` +
					`DTEND:${end}\n` +
					"DESCRIPTION:Gelber Sack\n" +
					"LOCATION:test\n" +
					"END:VEVENT\n" +
					"END:VCALENDAR",
			)

		const testParseIllegalCalendarEvents = ({ start, end, expect }) => {
			const event = makeEvent({ start, end })
			const { icsCalendarEvent } = parseCalendarEvents(event, "Europe/Berlin").contents[0]
			o(icsCalendarEvent.endTime.getTime()).equals(expect)
		}

		o("allday equal", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220315T", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})
		o("allday flipped", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220314T", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})
		o("allday with an endTime that has hours/minutes/seconds", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220314T225915Z", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})

		o("endTime equal", function () {
			testParseIllegalCalendarEvents({ start: "20220315T225900Z", end: "20220315T225900Z", expect: new Date("2022-03-15T22:59:01.000Z").getTime() })
		})
		o("endTime flipped", function () {
			testParseIllegalCalendarEvents({ start: "20220315T225900Z", end: "20220315T225800Z", expect: new Date("2022-03-15T22:59:01.000Z").getTime() })
		})
	})

	o.spec("parseUntilRruleTime", function () {
		o("when given full UTC date it gives the beginning of the next day", function () {
			// will take start of the next date because that's how we do it internally: end range is "exclusive" while it's questionable how it for ical but
			// mostly "inclusive"
			const zone = "Asia/Krasnoyarsk"
			o(parseUntilRruleTime("20190919T235959Z", zone)).deepEquals(DateTime.fromObject({ year: 2019, month: 9, day: 20 }, { zone: zone }).toJSDate())
		})
	})

	o.spec("parseExcludedDates", function () {
		o("are excluded dates deduplicated", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: {}, value: "20230308T230000Z,20230308T230000Z,20230309T230000Z" }])
			o(parsedDates).deepEquals([
				createDateWrapper({ date: new Date("2023-03-08T23:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("are excluded dates sorted", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: {}, value: "20230313T230000Z,20230309T230000Z" }])
			o(parsedDates).deepEquals([
				createDateWrapper({ date: new Date("2023-03-09T23:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-13T23:00:00Z") }),
			])
		})
		o("multiple exdates in separate lines are parsed", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: {}, value: "20230309T230000Z" },
				{
					name: "EXDATES",
					params: {},
					value: "20230203T230000Z",
				},
			])
			o(parsedDates).deepEquals([
				createDateWrapper({ date: new Date("2023-02-03T23:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("deduplication over multiple lines works", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: {}, value: "20230309T230000Z,20230302T230000Z" },
				{
					name: "EXDATES",
					params: {},
					value: "20230309T230000Z,20230114T230000Z",
				},
			])
			o(parsedDates).deepEquals([
				createDateWrapper({ date: new Date("2023-01-14T23:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-02T23:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("is timezone parsed", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: { TZID: "Europe/Berlin" }, value: "20230309T230000,20230302T230000" }])
			o(parsedDates).deepEquals([
				createDateWrapper({ date: new Date("2023-03-02T22:00:00Z") }),
				createDateWrapper({ date: new Date("2023-03-09T22:00:00Z") }),
			])
		})
		o(" deduplication over different timezones", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: { TZID: "Europe/Berlin" }, value: "20230309T230000" },
				{ name: "EXDATES", params: { TZID: "Europe/Sofia" }, value: "20230310T000000" },
			])
			o(parsedDates).deepEquals([createDateWrapper({ date: new Date("2023-03-09T22:00:00Z") })])
		})
	})

	o.spec("parseRecurrenceId", function () {
		o("it uses UTC for absolute time", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME" }, value: "20230809T060000Z" }, zone)
			o(parsedId).deepEquals(getDateInUTC("2023-08-09T06:00"))
		})

		o("it uses TZID from param for relative time", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME", TZID: "Europe/Sofia" }, value: "20230310T000000" }, zone)
			o(parsedId).deepEquals(getDateInUTC("2023-03-09T22:00:00Z"))
		})

		o("it uses TZID from param when none are in the value", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME" }, value: "20230310T000000" }, "Europe/Sofia")
			o(parsedId).deepEquals(getDateInUTC("2023-03-09T22:00:00Z"))
		})
	})

	o.spec("parseICalendar - line folding", function () {
		o("handles empty lines between tags correctly", function () {
			const calendar =
				"BEGIN:VCALENDAR\n" +
				"VERSION:2.0\n" +
				"BEGIN:VEVENT\n" +
				"UID:test-123\n" +
				"DTSTART:20250110T100000Z\n" +
				"DTEND:20250110T110000Z\n" +
				"SUMMARY:Test Event\n" +
				"END:VEVENT\n" +
				"\n" + // Empty line before END:VCALENDAR
				"END:VCALENDAR"

			const result = parseICalendar(calendar)
			o(result.type).equals("VCALENDAR")
			o(result.children.length).equals(1)
			o(result.children[0].type).equals("VEVENT")
		})

		o("handles properly folded lines", function () {
			const calendar =
				"BEGIN:VCALENDAR\n" +
				"VERSION:2.0\n" +
				"BEGIN:VEVENT\n" +
				"UID:test-123\n" +
				"DTSTART:20250110T100000Z\n" +
				"DTEND:20250110T110000Z\n" +
				"SUMMARY:This is a very long summary that is folded across multiple li\n" +
				" nes according to RFC 5545\n" + // Space at beginning indicates continuation
				"END:VEVENT\n" +
				"END:VCALENDAR"

			const result = parseICalendar(calendar)
			o(result.type).equals("VCALENDAR")
			const summary = result.children[0].properties.find((p) => p.name === "SUMMARY")
			o(summary?.value).equals("This is a very long summary that is folded across multiple lines according to RFC 5545")
		})
	})

	o.spec("parseCalendarStringData", function () {
		let expectedParsedCalendarData: ParsedCalendarData

		o.beforeEach(function () {
			expectedParsedCalendarData = {
				method: "PUBLISH",
				contents: [
					{
						icsCalendarEvent: {
							summary: "s",
							description: "",
							startTime: DateTime.fromObject(
								{
									year: 2019,
									month: 8,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							location: "",
							uid: "test@tuta.com",
							sequence: "0",
							recurrenceId: null,
							repeatRule: null,
							attendees: [],
							organizer: null,
							startTimeZone: null,
							endTimeZone: null,
						},
						alarms: [],
					},
				],
			}
		})

		o("regular event", async function () {
			const actual = await parseCalendarStringData(
				[
					"BEGIN:VCALENDAR",
					"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
					"VERSION:2.0",
					"CALSCALE:GREGORIAN",
					"METHOD:PUBLISH",
					"BEGIN:VEVENT",
					`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
					`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
					`DTSTAMP:20190813T140100Z`,
					`UID:test@tuta.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\N \\\\ \\;\\, \\n",
					"RRULE:FREQ=WEEKLY;INTERVAL=3",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"),
				zone,
			)

			expectedParsedCalendarData.contents[0].icsCalendarEvent.summary = "Word \n \\ ;, \n"
			expectedParsedCalendarData.contents[0].icsCalendarEvent.repeatRule = createRepeatRule({
				endType: EndType.Never,
				interval: "3",
				frequency: RepeatPeriod.WEEKLY,
				timeZone: zone,
				advancedRules: [],
				excludedDates: [],
				endValue: null,
			})
			expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
			expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

			testParsedCalendarDataEquality(actual, expectedParsedCalendarData)
		})

		o("recurrence id on event without UID will be deleted", async function () {
			const parsedEvent = parseCalendarStringData(
				[
					"BEGIN:VCALENDAR",
					"PRODID:-//Tutao GmbH//Tutanota 3.115.0//EN",
					"VERSION:2.0",
					"CALSCALE:GREGORIAN",
					"METHOD:PUBLISH",
					"BEGIN:VEVENT",
					"DTSTART:20230704T150000Z",
					"DTEND:20230704T153000Z",
					"DTSTAMP:20230712T142825Z",
					"SEQUENCE:1",
					"SUMMARY:s",
					"RECURRENCE-ID:20230704T170000",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"),
				zone,
			).contents[0]

			const icsCalendarEvent = expectedParsedCalendarData.contents[0].icsCalendarEvent
			icsCalendarEvent.sequence = "1"
			icsCalendarEvent.startTime = new Date("2023-07-04T15:00:00.000Z")
			icsCalendarEvent.endTime = new Date("2023-07-04T15:30:00.000Z")

			o(parsedEvent.icsCalendarEvent.uid).notEquals(null)
			// assigning uid so we can test that the other fields are the same.
			parsedEvent.icsCalendarEvent.uid = "test@tuta.com"
			testParsedEventEquality(parsedEvent, expectedParsedCalendarData.contents[0])
		})

		o.spec("With attendee", function () {
			o("simple case", async function () {
				const parsedEvent = parseCalendarStringData(
					[
						"BEGIN:VCALENDAR",
						"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
						"VERSION:2.0",
						"CALSCALE:GREGORIAN",
						"METHOD:PUBLISH",
						"BEGIN:VEVENT",
						`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
						`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
						`DTSTAMP:20190813T140100Z`,
						`UID:test@tuta.com`,
						"SEQUENCE:0",
						"SUMMARY:s",
						"ORGANIZER:mailto:organizer@tuta.com",
						"ATTENDEE;PARTSTAT=NEEDS-ACTION:mailto:test@example.com",
						"END:VEVENT",
						"END:VCALENDAR",
					].join("\r\n"),
					zone,
				)
				expectedParsedCalendarData.contents[0].icsCalendarEvent.organizer = createEncryptedMailAddress({
					name: "",
					address: "organizer@tuta.com",
				})
				expectedParsedCalendarData.contents[0].icsCalendarEvent.attendees = [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							name: "",
							address: "test@example.com",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				]
				expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
				expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

				testParsedCalendarDataEquality(parsedEvent, expectedParsedCalendarData)
			})
			o("uppercase mailto", async function () {
				// GMX does this
				const parsedEvent = parseCalendarStringData(
					[
						"BEGIN:VCALENDAR",
						"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
						"VERSION:2.0",
						"CALSCALE:GREGORIAN",
						"METHOD:PUBLISH",
						"BEGIN:VEVENT",
						`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
						`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
						`DTSTAMP:20190813T140100Z`,
						`UID:test@tuta.com`,
						"SEQUENCE:0",
						"SUMMARY:s",
						"ORGANIZER:MAILTO:organizer@tuta.com",
						"ATTENDEE;PARTSTAT=NEEDS-ACTION:MAILTO:test@example.com",
						"END:VEVENT",
						"END:VCALENDAR",
					].join("\r\n"),
					zone,
				)
				expectedParsedCalendarData.contents[0].icsCalendarEvent.organizer = createEncryptedMailAddress({
					name: "",
					address: "organizer@tuta.com",
				})
				expectedParsedCalendarData.contents[0].icsCalendarEvent.attendees = [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							name: "",
							address: "test@example.com",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				]
				expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
				expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

				testParsedCalendarDataEquality(parsedEvent, expectedParsedCalendarData)
			})
			o("without PARTSTAT", async function () {
				// Outlook 16 does this
				// RFC says NEEDS-ACTION is default
				// https://tools.ietf.org/html/rfc5545#section-3.2.12
				const parsedEvent = parseCalendarStringData(
					[
						"BEGIN:VCALENDAR",
						"PRODID:-//Tutao GmbH//Tutanota 3.57.6Yup//EN",
						"VERSION:2.0",
						"CALSCALE:GREGORIAN",
						"METHOD:PUBLISH",
						"BEGIN:VEVENT",
						`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
						`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
						`DTSTAMP:20190813T140100Z`,
						`UID:test@tuta.com`,
						"SEQUENCE:0",
						"SUMMARY:s",
						"ORGANIZER:MAILTO:organizer@tuta.com",
						"ATTENDEE:mailto:test@example.com",
						"END:VEVENT",
						"END:VCALENDAR",
					].join("\r\n"),
					zone,
				)
				expectedParsedCalendarData.contents[0].icsCalendarEvent.organizer = createEncryptedMailAddress({
					name: "",
					address: "organizer@tuta.com",
				})
				expectedParsedCalendarData.contents[0].icsCalendarEvent.attendees = [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							name: "",
							address: "test@example.com",
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				]

				expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
				expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

				testParsedCalendarDataEquality(parsedEvent, expectedParsedCalendarData)
			})
		})

		o.spec("All day events", function () {
			o.beforeEach(function () {
				const icsCalendarEvent = expectedParsedCalendarData.contents[0].icsCalendarEvent
				icsCalendarEvent.summary = "Labor Day / May Day"
				icsCalendarEvent.startTime = getAllDayDateUTCFromZone(
					DateTime.fromObject(
						{
							year: 2020,
							month: 5,
							day: 1,
						},
						{ zone },
					).toJSDate(),
					zone,
				)
				icsCalendarEvent.endTime = getAllDayDateUTCFromZone(
					DateTime.fromObject(
						{
							year: 2020,
							month: 5,
							day: 2,
						},
						{ zone },
					).toJSDate(),
					zone,
				)
				icsCalendarEvent.uid = "5e528f277e20e1582468903@calendarlabs.com"
				icsCalendarEvent.description = "Some description"
				icsCalendarEvent.location = "Brazil"
			})
			o("simple event", async function () {
				testParsedEventEquality(
					parseCalendarStringData(
						[
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
						].join("\r\n"),
						zone,
					).contents[0],
					expectedParsedCalendarData.contents[0],
				)
			})
			o("with invalid DTEND is assumed to lasts a day", async function () {
				testParsedEventEquality(
					parseCalendarStringData(
						[
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
						].join("\r\n"),
						zone,
					).contents[0],
					expectedParsedCalendarData.contents[0],
				)
			})
		})

		o.spec("With alarms", function () {
			o("with relative non-standard alarm", async function () {
				expectedParsedCalendarData.contents[0].alarms = [
					{
						trigger: "15D",
						alarmIdentifier: "",
					},
				]
				expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
				expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

				testParsedCalendarDataEquality(
					parseCalendarStringData(
						[
							"BEGIN:VCALENDAR",
							"PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN",
							"VERSION:2.0",
							"CALSCALE:GREGORIAN",
							"METHOD:PUBLISH",
							"BEGIN:VEVENT",
							`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
							`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
							`DTSTAMP:20190813T140100Z`,
							`UID:test@tuta.com`,
							"SUMMARY:s",
							"BEGIN:VALARM",
							"ACTION:DISPLAY",
							"TRIGGER:-P15D",
							"END:VALARM",
							"END:VEVENT",
							"END:VCALENDAR",
						].join("\r\n"),
						zone,
					),
					expectedParsedCalendarData,
				)
			})
			o("with absolute alarm", async function () {
				expectedParsedCalendarData.contents[0].alarms = [
					{
						trigger: "66M",
						alarmIdentifier: "",
					},
				]
				expectedParsedCalendarData.contents[0].icsCalendarEvent.startTimeZone = zone
				expectedParsedCalendarData.contents[0].icsCalendarEvent.endTimeZone = zone

				testParsedCalendarDataEquality(
					parseCalendarStringData(
						[
							"BEGIN:VCALENDAR",
							"PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN",
							"VERSION:2.0",
							"CALSCALE:GREGORIAN",
							"METHOD:PUBLISH",
							"BEGIN:VEVENT",
							`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
							`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
							`DTSTAMP:20190813T140100Z`,
							`UID:test@tuta.com`,
							"SUMMARY:s",
							"BEGIN:VALARM",
							"ACTION:DISPLAY",
							// 20190813T050600 Europe/Berlin is 20190813T030600 in UTC
							// 1H and 6M before
							"TRIGGER;VALUE=DATE-TIME:20190813T020000Z",
							"END:VALARM",
							"END:VEVENT",
							"END:VCALENDAR",
						].join("\r\n"),
						zone,
					),
					expectedParsedCalendarData,
				)
			})
			o("with alarm in the future", async function () {
				testParsedCalendarDataEquality(
					parseCalendarStringData(
						[
							"BEGIN:VCALENDAR",
							"PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN",
							"VERSION:2.0",
							"CALSCALE:GREGORIAN",
							"METHOD:PUBLISH",
							"BEGIN:VEVENT",
							`DTSTART;TZID="W. Europe Standard Time":20190813T050600`,
							`DTEND;TZID="W. Europe Standard Time":20190913T050600`,
							`DTSTAMP:20190813T140100Z`,
							`UID:test@tuta.com`,
							"SUMMARY:Word \\\\ \\; \\n",
							"BEGIN:VALARM",
							"ACTION:DISPLAY",
							"TRIGGER:P1D",
							"END:VALARM",
							"END:VEVENT",
							"END:VCALENDAR",
						].join("\r\n"),
						zone,
					),
					{
						method: "PUBLISH",
						contents: [
							{
								icsCalendarEvent: {
									recurrenceId: null,
									description: "",
									sequence: "0",
									location: "",
									organizer: null,
									attendees: [],
									summary: "Word \\ ; \n",
									startTime: DateTime.fromObject(
										{
											year: 2019,
											month: 8,
											day: 13,
											hour: 5,
											minute: 6,
										},
										{ zone },
									).toJSDate(),
									endTime: DateTime.fromObject(
										{
											year: 2019,
											month: 9,
											day: 13,
											hour: 5,
											minute: 6,
										},
										{ zone },
									).toJSDate(),
									uid: "test@tuta.com",
									repeatRule: null,
									startTimeZone: zone,
									endTimeZone: zone,
								},
								alarms: [],
							},
						],
					},
				)
			})
		})

		o.spec("Interaction with export operations", function () {
			o("ics-import and re-export descriptions exported from outlook", async function () {
				const text = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REPLY
BEGIN:VEVENT
DTSTART:20221026T210000Z
DTEND:20221026T220000Z
DTSTAMP:20221018T202558Z
UID:040000008200E00074C5B7101A82E00800000000B073543805E3D801000000000000000010000000EA368AA63E095848BAEEE25C239F56C6
SEQUENCE:0
SUMMARY:App Feedback Session
DESCRIPTION:\\n________________________________________________________________________________\\nMicrosoft Teams meeting\\nJoin on your computer\\, mobile app or room device\\nUnited States\\, Minneapolis\\nPhone Conference ID: 000 000 000
LOCATION:Microsoft Teams Meeting
ORGANIZER;EMAIL=Mary.Doe@example.com:mailto:Mary.Doe@example.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE;CN="Dack";EMAIL=dack@example.com:mailto:dack@example.com
END:VEVENT
END:VCALENDAR`

				const parsed = parseCalendarStringData(text, zone)
				const calendarEvent = makeCalendarEventFromIcsCalendarEvent(parsed.contents[0].icsCalendarEvent)
				const serialized = [
					"BEGIN:VCALENDAR",
					`VERSION:2.0`,
					`CALSCALE:GREGORIAN`,
					`METHOD:REPLY`,
					...serializeEvent(calendarEvent, [], new Date(), zone),
					"END:VCALENDAR",
				].join("\n")
				const parsedAgain = parseCalendarStringData(serialized, zone)
				o(parsedAgain.contents[0].icsCalendarEvent.description).equals(
					"\n________________________________________________________________________________\nMicrosoft Teams meeting\nJoin on your computer, mobile app or room device\nUnited States, Minneapolis\nPhone Conference ID: 000 000 000",
				)
			})
			o("roundtrip export -> ics-import", async function () {
				const alarmOne = createTestEntity(UserAlarmInfoTypeRef, {
					alarmInfo: createTestEntity(AlarmInfoTypeRef, {
						trigger: "1D",
					}),
				})
				const alarmTwo = createTestEntity(UserAlarmInfoTypeRef, {
					alarmInfo: createTestEntity(AlarmInfoTypeRef, {
						trigger: "30M",
					}),
				})
				const events: Array<{
					event: CalendarEvent
					alarms: Array<UserAlarmInfo>
				}> = [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							attendees: [],
							organizer: null,
							repeatRule: null,
							recurrenceId: null,
							location: "",
							alarmInfos: [],
							invitedConfidentially: null,
							_id: ["123", "456"],
							summary: "Word \\ ; \n simple",
							pendingInvitation: null,
							sender: null,
							startTime: DateTime.fromObject(
								{
									year: 2019,
									month: 1,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							description: "Descr \\ ; \n",
							uid: "test@tuta.com",
							hashedUid: null,
							sequence: "1",
							startTimeZone: null,
							endTimeZone: null,
						}),
						alarms: [],
					},
					{
						event: createTestEntity(CalendarEventTypeRef, {
							attendees: [],
							organizer: null,
							repeatRule: null,
							recurrenceId: null,
							location: "",
							alarmInfos: [],
							invitedConfidentially: null,
							description: "",
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
							summary: "Word \\ ; \n alarms",
							pendingInvitation: null,
							sender: null,
							startTime: DateTime.fromObject(
								{
									year: 2019,
									month: 8,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							sequence: "2",
							uid: "test@tuta.com",
							hashedUid: null,
							startTimeZone: null,
							endTimeZone: null,
						}),
						alarms: [alarmOne, alarmTwo],
					},
					{
						event: createTestEntity(CalendarEventTypeRef, {
							attendees: [],
							organizer: null,
							recurrenceId: null,
							location: "",
							alarmInfos: [],
							invitedConfidentially: null,
							description: "",
							sequence: "0",
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
							summary: "Word \\ ; \n",
							pendingInvitation: null,
							sender: null,
							startTime: DateTime.fromObject(
								{
									year: 2019,
									month: 8,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone },
							).toJSDate(),
							uid: "test@tuta.com",
							hashedUid: null,
							repeatRule: createRepeatRule({
								endType: EndType.UntilDate,
								interval: "3",
								frequency: RepeatPeriod.MONTHLY,
								endValue: String(
									DateTime.fromObject(
										{
											year: 2019,
											month: 9,
											day: 20,
										},
										{ zone },
									).toMillis(),
								),
								timeZone: zone,
								excludedDates: [],
								advancedRules: [],
							}),
							startTimeZone: zone,
							endTimeZone: zone,
						}),
						alarms: [],
					},
					{
						event: createTestEntity(CalendarEventTypeRef, {
							attendees: [],
							organizer: null,
							recurrenceId: null,
							location: "",
							alarmInfos: [],
							invitedConfidentially: null,
							sequence: "0",
							description: "",
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
							summary: "Word \\ ; \n",
							pendingInvitation: null,
							sender: null,
							startTime: getAllDayDateUTC(
								DateTime.fromObject({
									year: 2019,
									month: 8,
									day: 13,
								}).toJSDate(),
							),
							endTime: getAllDayDateUTC(
								DateTime.fromObject({
									year: 2019,
									month: 8,
									day: 15,
								}).toJSDate(),
							),
							uid: "b64lookingValue==",
							hashedUid: null,
							repeatRule: createRepeatRule({
								endType: EndType.UntilDate,
								interval: "3",
								frequency: RepeatPeriod.MONTHLY,
								// Beginning of 20th will be displayed to the user as 19th
								endValue: String(
									getAllDayDateUTC(
										DateTime.fromObject(
											{
												year: 2019,
												month: 9,
												day: 20,
											},
											{ zone },
										).toJSDate(),
									).getTime(),
								),
								advancedRules: [],
								timeZone: "",
								excludedDates: [],
							}),
							startTimeZone: null,
							endTimeZone: null,
						}),
						alarms: [],
					},
				]
				const versionNumber = "3.57.6"
				const serializedEvents = serializeCalendar(versionNumber, events, now, zone)

				const actualImportedEvents = parseCalendarStringData(serializedEvents, zone)
				const expectedImportedEvents: Array<ParsedEventAlarmTuple> = events.map(({ event, alarms }) => {
					return {
						icsCalendarEvent: {
							summary: event.summary,
							description: event.description,
							startTime: event.startTime,
							endTime: event.endTime,
							location: event.location,
							uid: event.uid!,
							sequence: event.sequence,
							recurrenceId: event.recurrenceId,
							repeatRule: event.repeatRule,
							attendees: event.attendees,
							organizer: event.organizer,
							startTimeZone: event.startTimeZone,
							endTimeZone: event.endTimeZone,
						},
						alarms: alarms.map((a) => ({
							trigger: a.alarmInfo.trigger,
							alarmIdentifier: a.alarmInfo.alarmIdentifier,
						})),
					}
				})

				o(actualImportedEvents.method).equals("PUBLISH")("wrong method")
				for (const i in expectedImportedEvents) {
					testParsedEventEquality(actualImportedEvents.contents[i], expectedImportedEvents[i], `event ${i}`)
				}
			})
			o("roundtrip ics-import -> export", async function () {
				const text = `BEGIN:VCALENDAR
PRODID:-//Tutao GmbH//Tutanota 3.57.6//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20190813T030600Z
DTEND:20190913T030600Z
DTSTAMP:20190813T140100Z
UID:test@tuta.com
SEQUENCE:1
SUMMARY:Word \\\\ \\; \\n simple
DESCRIPTION:Descr \\\\ \\; \\n
END:VEVENT
BEGIN:VEVENT
DTSTART:20190813T030600Z
DTEND:20190913T030600Z
DTSTAMP:20190813T140100Z
UID:123456@tuta.com
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
UID:123456@tuta.com
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
					.split("\n")
					.join("\r\n")
				const zone = "Europe/Berlin"
				const versionNumber = "3.57.6"
				const parsed = parseCalendarStringData(text, zone)
				const serialized = serializeCalendar(
					versionNumber,
					parsed.contents.map(({ icsCalendarEvent, alarms }) => {
						const calendarEvent = makeCalendarEventFromIcsCalendarEvent(icsCalendarEvent)
						return {
							event: Object.assign({}, calendarEvent, {
								_id: ["123", "456"],
							}),
							alarms: alarms.map((alarmInfo) =>
								createTestEntity(UserAlarmInfoTypeRef, {
									alarmInfo: alarmInfo as AlarmInfo,
								}),
							),
						}
					}),
					now,
					zone,
				)
				o(serialized).equals(text)
			})
		})
	})

	o.spec("Handles TZID property parameter", () => {
		o.test("Handles valid time zones", () => {
			for (const [tzIdValue, expectedTimeZone] of [
				// Valid IANA time zones and/or alias (so-called "Links" in the tzdb)
				["Europe/Berlin", "Europe/Berlin"],
				["Europe/Stockholm", "Europe/Stockholm"],
				["America/Buenos_Aires", "America/Buenos_Aires"],
				["America/Argentina/Buenos_Aires", "America/Buenos_Aires"],

				// Windows time zones
				["Argentina Standard Time", "America/Buenos_Aires"],
				["Central Europe Standard Time", "Europe/Budapest"],

				// Windows UTC[+-]<offset> time zones.
				//
				//    Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
				//    in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
				["UTC-02", "Etc/GMT+2"],
			]) {
				const calendar =
					"BEGIN:VCALENDAR\n" +
					"VERSION:2.0\n" +
					"BEGIN:VEVENT\n" +
					"UID:test-123\n" +
					`DTSTART;TZID=${tzIdValue}:20260101T120000\n` +
					"DTEND:20260101T123000\n" +
					"SUMMARY:Test TZID\n" +
					"END:VEVENT\n" +
					"END:VCALENDAR"
				const result = parseCalendarStringData(calendar, zone)
				const calendarEvent = result.contents[0].icsCalendarEvent
				o(calendarEvent.startTimeZone).equals(expectedTimeZone)
			}
		})
		o.test("Throw error on invalid time zone", () => {
			const calendar =
				"BEGIN:VCALENDAR\n" +
				"VERSION:2.0\n" +
				"BEGIN:VEVENT\n" +
				"UID:test-123\n" +
				"DTSTART;TZID=Bogus/Time_Zone:20260101T120000\n" +
				"DTEND:20260101T123000\n" +
				"SUMMARY:Test TZID\n" +
				"END:VEVENT\n" +
				"END:VCALENDAR"
			o.check(() => parseCalendarStringData(calendar, zone)).throws(ParserError)
		})
	})
})

function testParsedCalendarDataEquality(actual: ParsedCalendarData, expected: ParsedCalendarData, message?: string): void {
	o.check(actual).deepEquals(expected)(message ?? "")
}

function testParsedEventEquality(actual: ParsedEventAlarmTuple, expected: ParsedEventAlarmTuple, message?: string): void {
	o.check(actual).deepEquals(expected)(message ?? "")
}
