import o from "@tutao/otest"
import {
	formatDateTimeUTC,
	serializeCalendar,
	serializeEvent,
	serializeExcludedDates,
	serializeRepeatRule,
	serializeTrigger,
} from "../../../src/calendar-app/calendar/export/CalendarExporter.js"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarGroupRootTypeRef,
	createCalendarEvent,
	createCalendarEventAttendee,
	createEncryptedMailAddress,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { DateTime } from "luxon"
import {
	AlarmInfo,
	AlarmInfoTypeRef,
	createRepeatRule,
	DateWrapperTypeRef,
	RepeatRuleTypeRef,
	type UserAlarmInfo,
	UserAlarmInfoTypeRef,
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { CalendarAttendeeStatus, EndType, RepeatPeriod } from "../../../src/common/api/common/TutanotaConstants.js"
import { getAllDayDateUTC } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { getDateInZone } from "./CalendarTestUtils.js"
import { getFirstOrThrow, Require } from "@tutao/tutanota-utils"
import { createTestEntity } from "../TestUtils.js"
import { getAllDayDateUTCFromZone } from "../../../src/common/calendar/date/CalendarUtils.js"
import {
	checkURLString,
	EventImportRejectionReason,
	IcsCalendarEvent,
	makeCalendarEventFromIcsCalendarEvent,
	normalizeCalendarUrl,
	parseCalendarStringData,
	ParsedCalendarData,
	ParsedEvent,
	sortOutParsedEvents,
} from "../../../src/common/calendar/gui/ImportExportUtils.js"

const zone = "Europe/Berlin"
const now = new Date("2019-08-13T14:01:00.630Z")

function testParsedCalendarDataEquality(actual: ParsedCalendarData, expected: ParsedCalendarData, message?: string): void {
	o.check(actual).deepEquals(expected)(message ?? "")
}

function testParsedEventEquality(actual: ParsedEvent, expected: ParsedEvent, message?: string): void {
	o.check(actual).deepEquals(expected)(message ?? "")
}

o.spec("CalendarImporter", function () {
	o.spec("serializeEvent", function () {
		o("simple one", function () {
			o(
				serializeEvent(
					createTestEntity(CalendarEventTypeRef, {
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
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
						description: "Descr \\ ;, \n",
						uid: "test@tuta.com",
						location: "Some location",
					}),
					[],
					now,
					zone,
				),
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				"UID:test@tuta.com",
				"SEQUENCE:0",
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\;\\, \\n",
				"LOCATION:Some location",
				"END:VEVENT",
			])
		})
		o("all day", function () {
			const zone = "utc"
			o(
				serializeEvent(
					createTestEntity(CalendarEventTypeRef, {
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
						summary: "Word \\ ; \n",
						startTime: DateTime.fromObject(
							{
								year: 2019,
								month: 8,
								day: 13,
							},
							{ zone },
						).toJSDate(),
						endTime: DateTime.fromObject(
							{
								year: 2019,
								month: 9,
								day: 14,
							},
							{ zone },
						).toJSDate(),
						description: "Descr \\ ; \n",
					}),
					[],
					now,
					zone,
				),
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;VALUE=DATE:20190813`,
				`DTEND;VALUE=DATE:20190914`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tuta.com`,
				"SEQUENCE:0",
				"SUMMARY:Word \\\\ \\; \\n",
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"END:VEVENT",
			])
		})
		o("all day west of UTC", function () {
			// Event though we try to set it to New York, it's not really possible to check without changing system time because of how
			// js Date works.
			const zone = "America/New_York"
			o(
				serializeEvent(
					createTestEntity(CalendarEventTypeRef, {
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
						summary: "s",
						startTime: getAllDayDateUTC(
							DateTime.fromObject({
								year: 2020,
								month: 7,
								day: 31,
							}).toJSDate(),
						),
						endTime: getAllDayDateUTC(
							DateTime.fromObject({
								year: 2020,
								month: 8,
								day: 1,
							}).toJSDate(),
						),
						description: "d",
					}),
					[],
					now,
					zone,
				),
			).deepEquals([
				"BEGIN:VEVENT",
				`DTSTART;VALUE=DATE:20200731`,
				`DTEND;VALUE=DATE:20200801`,
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tuta.com`,
				"SEQUENCE:0",
				"SUMMARY:s",
				"DESCRIPTION:d",
				"END:VEVENT",
			])
		})
		o("with alarms", function () {
			const alarmOne = createTestEntity(UserAlarmInfoTypeRef, {
				alarmInfo: createTestEntity(AlarmInfoTypeRef, {
					alarmIdentifier: "123",
					trigger: "1D",
				}),
			})
			const alarmTwo = createTestEntity(UserAlarmInfoTypeRef, {
				alarmInfo: createTestEntity(AlarmInfoTypeRef, {
					alarmIdentifier: "102",
					trigger: "30M",
				}),
			})
			o(
				serializeEvent(
					createTestEntity(CalendarEventTypeRef, {
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
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
						description: "Descr \\ ; \n",
					}),
					[alarmOne, alarmTwo],
					now,
					zone,
				),
			).deepEquals([
				"BEGIN:VEVENT",
				"DTSTART:20190813T030600Z",
				"DTEND:20190913T030600Z",
				`DTSTAMP:20190813T140100Z`,
				`UID:ownerId${now.getTime()}@tuta.com`,
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
				"END:VEVENT",
			])
		})
		o.spec("Repeat rule", function () {
			o("with repeat rule (never ends)", function () {
				o(
					serializeEvent(
						createTestEntity(CalendarEventTypeRef, {
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
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
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
								endType: EndType.Never,
								interval: "3",
								frequency: RepeatPeriod.WEEKLY,
								timeZone: zone,
							}),
						}),
						[],
						now,
						zone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${zone}:20190813T050600`,
					`DTEND;TZID=${zone}:20190913T050600`,
					`DTSTAMP:20190813T140100Z`,
					`UID:ownerId${now.getTime()}@tuta.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=WEEKLY;INTERVAL=3",
					"END:VEVENT",
				])
			})
			o("with repeat rule (ends after occurrences)", function () {
				o(
					serializeEvent(
						createTestEntity(CalendarEventTypeRef, {
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
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
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
								endType: EndType.Count,
								interval: "3",
								frequency: RepeatPeriod.DAILY,
								endValue: "100",
								timeZone: zone,
							}),
						}),
						[],
						now,
						zone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${zone}:20190813T050600`,
					`DTEND;TZID=${zone}:20190913T050600`,
					`DTSTAMP:20190813T140100Z`,
					`UID:ownerId${now.getTime()}@tuta.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=DAILY;INTERVAL=3;COUNT=100",
					"END:VEVENT",
				])
			})
			o("with repeat rule (ends on a date)", function () {
				o(
					serializeEvent(
						createTestEntity(CalendarEventTypeRef, {
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
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
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
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
							}),
						}),
						[],
						now,
						zone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${zone}:20190813T050600`,
					`DTEND;TZID=${zone}:20190913T050600`,
					`DTSTAMP:20190813T140100Z`,
					`UID:ownerId${now.getTime()}@tuta.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919T215959Z",
					"END:VEVENT",
				])
			})
			o("with repeat rule (ends on a date, all-day)", function () {
				o(
					serializeEvent(
						createTestEntity(CalendarEventTypeRef, {
							_id: ["123", "456"],
							_ownerGroup: "ownerId",
							summary: "Word \\ ; \n",
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
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
								endType: EndType.UntilDate,
								interval: "3",
								frequency: RepeatPeriod.MONTHLY,
								// Beginning of 20th will be displayed to the user as 19th
								endValue: String(
									getAllDayDateUTC(
										DateTime.fromObject({
											year: 2019,
											month: 9,
											day: 20,
										}).toJSDate(),
									).getTime(),
								),
								timeZone: zone,
							}),
						}),
						[],
						now,
						zone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;VALUE=DATE:20190813`,
					`DTEND;VALUE=DATE:20190815`,
					`DTSTAMP:20190813T140100Z`,
					`UID:ownerId${now.getTime()}@tuta.com`,
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919",
					"END:VEVENT",
				])
			})
		})
		o.spec("Altered instance", function () {
			o.test("Simple event", function () {
				const originalStartTime = DateTime.fromObject(
					{
						year: 2019,
						month: 8,
						day: 13,
						hour: 5,
						minute: 6,
					},
					{ zone },
				).toJSDate()
				const alteredInstanceStartTime = DateTime.fromJSDate(originalStartTime).plus({ day: 1 }).toJSDate()
				const alteredInstanceEndTime = DateTime.fromJSDate(originalStartTime).plus({ day: 2 }).toJSDate()
				const serializedEvent = serializeEvent(
					createTestEntity(CalendarEventTypeRef, {
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
						summary: "Word \\ ; \n",
						startTime: alteredInstanceStartTime,
						endTime: alteredInstanceEndTime,
						description: "Descr \\ ;, \n",
						uid: "test@tuta.com",
						location: "Some location",
						recurrenceId: originalStartTime,
					}),
					[],
					now,
					zone,
				)

				o.check(serializedEvent).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART:${formatDateTimeUTC(alteredInstanceStartTime)}`,
					`DTEND:${formatDateTimeUTC(alteredInstanceEndTime)}`,
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					`RECURRENCE-ID;VALUE=DATETIME:${formatDateTimeUTC(originalStartTime)}`,
					"DESCRIPTION:Descr \\\\ \\;\\, \\n",
					"LOCATION:Some location",
					"END:VEVENT",
				])
			})

			o.test("All-day event", function () {
				const originalAlldayStartTime = DateTime.fromObject(
					{
						year: 2019,
						month: 8,
						day: 13,
						hour: 0,
						minute: 0,
						second: 0,
					},
					{ zone: "UTC" },
				).toJSDate()
				const alteredInstanceStartTime = DateTime.fromJSDate(originalAlldayStartTime).plus({ day: 1 }).toJSDate()
				const alteredInstanceEndTime = DateTime.fromJSDate(originalAlldayStartTime).plus({ day: 2 }).toJSDate()
				const calendarEvent = createTestEntity(CalendarEventTypeRef, {
					_id: ["123", "456"],
					_ownerGroup: "ownerId",
					summary: "Word \\ ; \n",
					startTime: alteredInstanceStartTime,
					endTime: alteredInstanceEndTime,
					description: "Descr \\ ;, \n",
					uid: "test@tuta.com",
					location: "Some location",
					recurrenceId: originalAlldayStartTime,
				})
				const serializedEvent = serializeEvent(calendarEvent, [], now, zone)

				o.check(serializedEvent).deepEquals([
					"BEGIN:VEVENT",
					"DTSTART;VALUE=DATE:20190814",
					"DTEND;VALUE=DATE:20190815",
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					`RECURRENCE-ID;VALUE=DATETIME:${formatDateTimeUTC(originalAlldayStartTime)}`,
					"DESCRIPTION:Descr \\\\ \\;\\, \\n",
					"LOCATION:Some location",
					"END:VEVENT",
				])
			})
		})
	})

	o.spec("import", function () {
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
								},
								alarms: [],
							},
						],
					},
				)
			})
		})

		o.spec("Interaction with export operations", function () {
			o("import and re-export descriptions exported from outlook", async function () {
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
			o("roundtrip export -> import", async function () {
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
						event: createCalendarEvent({
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
						}),
						alarms: [],
					},
					{
						event: createCalendarEvent({
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
						}),
						alarms: [alarmOne, alarmTwo],
					},
					{
						event: createCalendarEvent({
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
						}),
						alarms: [],
					},
					{
						event: createCalendarEvent({
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
						}),
						alarms: [],
					},
				]
				const versionNumber = "3.57.6"
				const serializedEvents = serializeCalendar(versionNumber, events, now, zone)

				const actualImportedEvents = parseCalendarStringData(serializedEvents, zone)
				const expectedImportedEvents: Array<ParsedEvent> = events.map(({ event, alarms }) => {
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
			o("roundtrip import -> export", async function () {
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

	o.spec("sortOutParsedEvents", function () {
		o("repeated progenitors are skipped", function () {
			const progenitor1: IcsCalendarEvent = {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
			}
			const progenitor2: IcsCalendarEvent = {
				uid: "hello",
				startTime: getDateInZone("2023-01-01T13:00"),
				endTime: getDateInZone("2023-01-01T13:05"),
				summary: "",
				description: "",
				location: "",
				sequence: "0",
				recurrenceId: null,
				repeatRule: null,
				attendees: null,
				organizer: null,
			}
			const calendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef)
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(
				[
					{ icsCalendarEvent: progenitor1, alarms: [] },
					{ icsCalendarEvent: progenitor2, alarms: [] },
				],
				[],
				calendarGroupRoot,
				zone,
			)

			const expectedProgenitor1 = makeCalendarEventFromIcsCalendarEvent(progenitor1)
			expectedProgenitor1._ownerGroup = calendarGroupRoot._id
			expectedProgenitor1._id = eventsForCreation[0].event._id
			o(eventsForCreation[0].event).deepEquals(expectedProgenitor1)

			const expectedProgenitor2 = makeCalendarEventFromIcsCalendarEvent(progenitor2)
			o(rejectedEvents.get(EventImportRejectionReason.Duplicate)?.[0]).deepEquals(expectedProgenitor2)
		})
		o("imported altered instances are added as exclusions", function () {
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				repeatRule: createTestEntity(RepeatRuleTypeRef),
			}) as Require<"uid", CalendarEvent>
			const altered = createTestEntity(CalendarEventTypeRef, {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T14:00"),
				endTime: getDateInZone("2023-01-02T14:05"),
				recurrenceId: getDateInZone("2023-01-02T13:00"),
			}) as Require<"uid", CalendarEvent>
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(
				[
					{ icsCalendarEvent: progenitor, alarms: [] },
					{ icsCalendarEvent: altered, alarms: [] },
				],
				[],
				createTestEntity(CalendarGroupRootTypeRef),
				zone,
			)
			o(rejectedEvents.size).equals(0)
			o(eventsForCreation[0].event.repeatRule?.excludedDates[0].date.getTime()).equals(altered.recurrenceId?.getTime())
		})
		o("sync calendar with altered instances are added as exclusions", function () {
			const rrule = createTestEntity(RepeatRuleTypeRef)
			const parsedProgenitor: IcsCalendarEvent = {
				summary: "s",
				description: "",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				location: "",
				uid: "hello",
				sequence: "0",
				recurrenceId: null,
				repeatRule: rrule,
				attendees: [],
				organizer: null,
			}

			const existingProgenitor = createTestEntity(CalendarEventTypeRef, {
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				endTime: getDateInZone("2023-01-02T13:05"),
				repeatRule: {
					...rrule,
				},
			})

			const altered: IcsCalendarEvent = {
				summary: "s",
				description: "",
				startTime: getDateInZone("2023-01-02T14:00"),
				endTime: getDateInZone("2023-01-02T14:05"),
				location: "",
				uid: "hello",
				sequence: "0",
				recurrenceId: getDateInZone("2023-01-02T13:00"),
				repeatRule: null,
				attendees: [],
				organizer: null,
			}

			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(
				[
					{ icsCalendarEvent: parsedProgenitor, alarms: [] },
					{ icsCalendarEvent: altered, alarms: [] },
				],
				[existingProgenitor],
				createTestEntity(CalendarGroupRootTypeRef),
				zone,
			)

			o(rejectedEvents.size).equals(1)
			o(eventsForCreation[0].event.recurrenceId?.getTime()).equals(altered.recurrenceId?.getTime())
			const duplicates = rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? []
			o(getFirstOrThrow(duplicates).repeatRule?.excludedDates[0].date.getTime()).equals(altered.recurrenceId?.getTime())
		})
	})

	o.spec("serializeRepeatRule", function () {
		o("when RRULE is UNTIL and not all date the timestamp of the end of last day is written", function () {
			const repeatRule = createTestEntity(RepeatRuleTypeRef, {
				endType: EndType.UntilDate,
				endValue: String(DateTime.fromObject({ year: 2019, month: 9, day: 20 }, { zone: "UTC" }).toMillis()),
				frequency: RepeatPeriod.MONTHLY,
				interval: "3",
			})
			o(serializeRepeatRule(repeatRule, false, "Asia/Krasnoyarsk")).deepEquals(["RRULE:FREQ=MONTHLY;INTERVAL=3;UNTIL=20190919T235959Z"])
		})
	})

	o.spec("serializeExcludedDates", function () {
		o("no excluded dates", function () {
			o(serializeExcludedDates([], "Europe/Berlin")).deepEquals([])
		})

		o("one excluded date", function () {
			o(serializeExcludedDates([createTestEntity(DateWrapperTypeRef, { date: new Date("2023-01-14T22:00:00Z") })], "Europe/Berlin")).deepEquals([
				"EXDATE;TZID=Europe/Berlin:20230114T230000",
			])
		})

		o("more than one excluded date", function () {
			o(
				serializeExcludedDates(
					[
						createTestEntity(DateWrapperTypeRef, { date: new Date("2023-01-14T22:00:00Z") }),
						createTestEntity(DateWrapperTypeRef, { date: new Date("2023-01-21T22:00:00Z") }),
					],
					"Europe/Berlin",
				),
			).deepEquals(["EXDATE;TZID=Europe/Berlin:20230114T230000,20230121T230000"])
		})
	})

	o("serializeTrigger", () => {
		o(serializeTrigger("5M")).equals("-PT5M")
		o(serializeTrigger("3H")).equals("-PT3H")
		o(serializeTrigger("30H")).equals("-PT30H")
		o(serializeTrigger("1D")).equals("-P1D")
		o(serializeTrigger("10D")).equals("-P10D")
		o(serializeTrigger("5W")).equals("-P5W")
		o(serializeTrigger("50W")).equals("-P50W")
	})

	o.spec("normalizeCalendarUrl", function () {
		o("converts webcal:// to https://", function () {
			o(normalizeCalendarUrl("webcal://example.com/calendar.ics")).equals("https://example.com/calendar.ics")
		})

		o("converts webcals:// to https://", function () {
			o(normalizeCalendarUrl("webcals://example.com/calendar.ics")).equals("https://example.com/calendar.ics")
		})

		o("leaves https:// unchanged", function () {
			o(normalizeCalendarUrl("https://example.com/calendar.ics")).equals("https://example.com/calendar.ics")
		})

		o("leaves http:// unchanged", function () {
			o(normalizeCalendarUrl("http://example.com/calendar.ics")).equals("http://example.com/calendar.ics")
		})
	})

	o.spec("checkURLString", function () {
		o("accepts https:// protocol", function () {
			const result = checkURLString("https://example.com/calendar.ics")
			o(result instanceof URL).equals(true)
			o((result as URL).protocol).equals("https:")
		})

		o("accepts webcal:// protocol", function () {
			const result = checkURLString("webcal://example.com/calendar.ics")
			o(result instanceof URL).equals(true)
			o((result as URL).protocol).equals("webcal:")
		})

		o("accepts webcals:// protocol", function () {
			const result = checkURLString("webcals://example.com/calendar.ics")
			o(result instanceof URL).equals(true)
			o((result as URL).protocol).equals("webcals:")
		})

		o("rejects http:// protocol", function () {
			const result = checkURLString("http://example.com/calendar.ics")
			o(result).equals("invalidURLProtocol_msg")
		})

		o("rejects invalid URLs", function () {
			const result = checkURLString("not a url")
			o(result).equals("invalidURL_msg")
		})
	})
})
