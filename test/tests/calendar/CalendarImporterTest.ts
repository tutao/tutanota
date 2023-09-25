import o from "@tutao/otest"
import {
	parseCalendarStringData,
	serializeCalendar,
	serializeEvent,
	serializeExcludedDates,
	serializeRepeatRule,
	serializeTrigger,
} from "../../../src/calendar/export/CalendarImporter.js"
import {
	CalendarEvent,
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarGroupRoot,
	createEncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import { DateTime } from "luxon"
import { createAlarmInfo, createDateWrapper, createRepeatRule, createUserAlarmInfo } from "../../../src/api/entities/sys/TypeRefs.js"
import { CalendarAttendeeStatus, EndType, RepeatPeriod } from "../../../src/api/common/TutanotaConstants.js"
import { getAllDayDateUTC } from "../../../src/api/common/utils/CommonCalendarUtils.js"
import { getAllDayDateUTCFromZone } from "../../../src/calendar/date/CalendarUtils.js"
import { EventImportRejectionReason, sortOutParsedEvents } from "../../../src/calendar/export/CalendarImporterDialog.js"
import { getDateInZone } from "./CalendarTestUtils.js"
import { Require } from "@tutao/tutanota-utils"

const zone = "Europe/Berlin"
const now = new Date("2019-08-13T14:01:00.630Z")

function jsonEquals(actual: unknown, expected: unknown, message): { pass: boolean; message: string } {
	// necessary because o(Uint8Array.from([])).deepEquals(Uint8Array.from([])) does not pass
	const firstJson = JSON.stringify(actual)
	const secondJson = JSON.stringify(expected)
	const isEqual = firstJson === secondJson
	if (isEqual) {
		return { pass: true, message: "okay" }
	} else {
		let firstDiff = 0
		while (firstJson[firstDiff] === secondJson[firstDiff]) firstDiff++
		firstDiff = Math.max(firstDiff - 25, 0)
		return {
			pass: false,
			message: `${message}:\nfirst diff in json serialization around \nact: ...${firstJson.substring(
				firstDiff,
				firstDiff + 50,
			)}... vs. \nexp: ...${secondJson.substring(firstDiff, firstDiff + 50)}...`,
		}
	}
}

function testEventEquality(actual: unknown, expected: unknown, message: string = ""): void {
	o(actual).satisfies((a) => jsonEquals(a, expected, message))
}

o.spec("CalendarImporterTest", function () {
	o.spec("serializeEvent", function () {
		o("simple one", function () {
			o(
				serializeEvent(
					createCalendarEvent({
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
				"DESCRIPTION:Descr \\\\ \\; \\n",
				"LOCATION:Some location",
				"END:VEVENT",
			])
		})
		o("all day", function () {
			const zone = "utc"
			o(
				serializeEvent(
					createCalendarEvent({
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
					createCalendarEvent({
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
			const alarmOne = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					alarmIdentifier: "123",
					trigger: "1D",
				}),
			})
			const alarmTwo = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					alarmIdentifier: "102",
					trigger: "30M",
				}),
			})
			o(
				serializeEvent(
					createCalendarEvent({
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

		o("with repeat rule (never ends)", function () {
			o(
				serializeEvent(
					createCalendarEvent({
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
						repeatRule: createRepeatRule({
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
					createCalendarEvent({
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
						repeatRule: createRepeatRule({
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
					createCalendarEvent({
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
					createCalendarEvent({
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
						repeatRule: createRepeatRule({
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
	o.spec("import", function () {
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
					"SUMMARY:Word \\\\ \\; \\n",
					"RRULE:FREQ=WEEKLY;INTERVAL=3",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"),
				zone,
			)
			const expected = {
				method: "PUBLISH",
				contents: [
					{
						event: createCalendarEvent({
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
							hashedUid: null,
							repeatRule: createRepeatRule({
								endType: EndType.Never,
								interval: "3",
								frequency: RepeatPeriod.WEEKLY,
								timeZone: zone,
							}),
						}),
						alarms: [],
					},
				],
			}
			testEventEquality(actual, expected)
		})
		o("with attendee", async function () {
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
			const expected = {
				method: "PUBLISH",
				contents: [
					{
						event: createCalendarEvent({
							summary: "s",
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
							organizer: createEncryptedMailAddress({
								name: "",
								address: "organizer@tuta.com",
							}),
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										name: "",
										address: "test@example.com",
									}),
									status: CalendarAttendeeStatus.NEEDS_ACTION,
								}),
							],
						}),
						alarms: [],
					},
				],
			}
			testEventEquality(parsedEvent, expected)
		})
		o("with attendee uppercase mailto", async function () {
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
			const expected = {
				method: "PUBLISH",
				contents: [
					{
						event: createCalendarEvent({
							summary: "s",
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
							organizer: createEncryptedMailAddress({
								name: "",
								address: "organizer@tuta.com",
							}),
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										name: "",
										address: "test@example.com",
									}),
									status: CalendarAttendeeStatus.NEEDS_ACTION,
								}),
							],
						}),
						alarms: [],
					},
				],
			}
			testEventEquality(parsedEvent, expected)
		})
		o("with attendee without PARTSTAT", async function () {
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
			const expected = {
				method: "PUBLISH",
				contents: [
					{
						event: createCalendarEvent({
							summary: "s",
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
							organizer: createEncryptedMailAddress({
								name: "",
								address: "organizer@tuta.com",
							}),
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										name: "",
										address: "test@example.com",
									}),
									status: CalendarAttendeeStatus.NEEDS_ACTION,
								}),
							],
						}),
						alarms: [],
					},
				],
			}
			testEventEquality(parsedEvent, expected)
		})
		o("all-day event", async function () {
			testEventEquality(
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
				{
					event: createCalendarEvent({
						summary: "Labor Day / May Day",
						startTime: getAllDayDateUTCFromZone(
							DateTime.fromObject(
								{
									year: 2020,
									month: 5,
									day: 1,
								},
								{ zone },
							).toJSDate(),
							zone,
						),
						endTime: getAllDayDateUTCFromZone(
							DateTime.fromObject(
								{
									year: 2020,
									month: 5,
									day: 2,
								},
								{ zone },
							).toJSDate(),
							zone,
						),
						uid: "5e528f277e20e1582468903@calendarlabs.com",
						hashedUid: null,
						description: "Some description",
						location: "Brazil",
					}),
					alarms: [],
				},
			)
		})
		o("recurrence id on event without UID will be deleted", async function () {
			const expected = {
				event: createCalendarEvent({
					startTime: new Date("2023-07-04T15:00:00.000Z"),
					endTime: new Date("2023-07-04T15:30:00.000Z"),
					sequence: "1",
					summary: "bkbkbkb",
					recurrenceId: null,
				}),
				alarms: [],
			}
			const parsed = parseCalendarStringData(
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
					"SUMMARY:bkbkbkb",
					"RECURRENCE-ID:20230704T170000",
					"END:VEVENT",
					"END:VCALENDAR",
				].join("\r\n"),
				zone,
			).contents[0]
			o(parsed.event.uid).notEquals(null)
			// @ts-ignore we want to test that the other fields are the same.
			parsed.event.uid = null
			testEventEquality(parsed, expected)
		})
		o("all-day event with invalid DTEND", async function () {
			testEventEquality(
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
				{
					event: createCalendarEvent({
						summary: "Labor Day / May Day",
						startTime: getAllDayDateUTCFromZone(
							DateTime.fromObject(
								{
									year: 2020,
									month: 5,
									day: 1,
								},
								{ zone },
							).toJSDate(),
							zone,
						),
						endTime: getAllDayDateUTCFromZone(
							DateTime.fromObject(
								{
									year: 2020,
									month: 5,
									day: 2,
								},
								{ zone },
							).toJSDate(),
							zone,
						),
						uid: "5e528f277e20e1582468903@calendarlabs.com",
						hashedUid: null,
						description: "Some description",
						location: "Brazil",
					}),
					alarms: [],
				},
			)
		})
		o("with relative non-standard alarm", async function () {
			testEventEquality(
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
						"TRIGGER:-P15D",
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
							event: createCalendarEvent({
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
								hashedUid: null,
								repeatRule: null,
							}),
							alarms: [
								createAlarmInfo({
									trigger: "15D",
								}),
							],
						},
					],
				},
			)
		})
		o("with absolute alarm", async function () {
			testEventEquality(
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
						// 20190813T050600 Europe/Berlin is 20190813T030600 in UTC
						// 1H and 6M before
						"TRIGGER;VALUE=DATE-TIME:20190813T020000Z",
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
							event: createCalendarEvent({
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
								hashedUid: null,
								repeatRule: null,
							}),
							alarms: [
								createAlarmInfo({
									trigger: "66M",
								}),
							],
						},
					],
				},
			)
		})
		o("with alarm in the future", async function () {
			testEventEquality(
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
							event: createCalendarEvent({
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
								hashedUid: null,
								repeatRule: null,
							}),
							alarms: [],
						},
					],
				},
			)
		})
		o("roundtrip export -> import", async function () {
			const alarmOne = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					trigger: "1D",
				}),
			})
			const alarmTwo = createUserAlarmInfo({
				alarmInfo: createAlarmInfo({
					trigger: "30M",
				}),
			})
			const events = [
				{
					event: createCalendarEvent({
						_id: ["123", "456"],
						summary: "Word \\ ; \n simple",
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
						_id: ["123", "456"],
						_ownerGroup: "ownerId",
						summary: "Word \\ ; \n alarms",
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
						}),
					}),
					alarms: [],
				},
				{
					event: createCalendarEvent({
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
						}),
					}),
					alarms: [],
				},
			]
			const versionNumber = "3.57.6"
			const serialized = serializeCalendar(versionNumber, events, now, zone)
			const eventsWithoutIds = events.map(({ event, alarms }) => {
				return {
					event: Object.assign({}, event, {
						_id: null,
						uid: event.uid,
						hashedUid: event.hashedUid,
						_ownerGroup: null,
					}),
					alarms: alarms.map((a) => a.alarmInfo),
				}
			})
			const parsed = parseCalendarStringData(serialized, zone)
			o(parsed.method).equals("PUBLISH")("wrong method")
			for (const i in eventsWithoutIds) {
				testEventEquality(parsed.contents[i], eventsWithoutIds[i], `failed for event ${i}`)
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
				parsed.contents.map(({ event, alarms }) => {
					return {
						event: Object.assign({}, event, {
							_id: ["123", "456"],
						}),
						alarms: alarms.map((alarmInfo) =>
							createUserAlarmInfo({
								alarmInfo,
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
	o.spec("sortOutParsedEvents", function () {
		o("repeated progenitors are skipped", function () {
			const progenitor1 = createCalendarEvent({ uid: "hello", startTime: getDateInZone("2023-01-02T13:00") }) as Require<"uid", CalendarEvent>
			const progenitor2 = createCalendarEvent({ uid: "hello", startTime: getDateInZone("2023-01-01T13:00") }) as Require<"uid", CalendarEvent>
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(
				[
					{ event: progenitor1, alarms: [] },
					{
						event: progenitor2,
						alarms: [],
					},
				],
				[],
				createCalendarGroupRoot(),
				zone,
			)
			o(eventsForCreation[0].event).equals(progenitor1)
			o(rejectedEvents.get(EventImportRejectionReason.Duplicate)?.[0]).equals(progenitor2)
		})
		o("imported altered instances are added as exclusions", function () {
			const progenitor = createCalendarEvent({
				uid: "hello",
				startTime: getDateInZone("2023-01-02T13:00"),
				repeatRule: createRepeatRule(),
			}) as Require<"uid", CalendarEvent>
			const altered = createCalendarEvent({
				uid: "hello",
				startTime: getDateInZone("2023-01-02T14:00"),
				recurrenceId: getDateInZone("2023-01-02T13:00"),
			}) as Require<"uid", CalendarEvent>
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(
				[
					{ event: progenitor, alarms: [] },
					{ event: altered, alarms: [] },
				],
				[],
				createCalendarGroupRoot(),
				zone,
			)
			o(rejectedEvents.size).equals(0)
			o(eventsForCreation[0].event.repeatRule?.excludedDates[0].date.getTime()).equals(altered.recurrenceId?.getTime())
		})
	})

	o.spec("serializeRepeatRule", function () {
		o("when RRULE is UNTIL and not all date the timestamp of the end of last day is written", function () {
			const repeatRule = createRepeatRule({
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
			o(serializeExcludedDates([createDateWrapper({ date: new Date("2023-01-14T22:00:00Z") })], "Europe/Berlin")).deepEquals([
				"EXDATE;TZID=Europe/Berlin:20230114T230000",
			])
		})

		o("more than one excluded date", function () {
			o(
				serializeExcludedDates(
					[createDateWrapper({ date: new Date("2023-01-14T22:00:00Z") }), createDateWrapper({ date: new Date("2023-01-21T22:00:00Z") })],
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
})
