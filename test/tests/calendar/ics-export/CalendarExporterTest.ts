import o from "@tutao/otest"
import {
	formatDateTimeUTC,
	serializeDTProperty,
	serializeEvent,
	serializeExcludedDates,
	serializeRepeatRule,
	serializeTrigger,
} from "../../../../src/applications/calendar-app/calendar/export/CalendarExporter.js"

import { DateObjectUnits, DateTime } from "luxon"
import { EndType, RepeatPeriod } from "../../../../src/platform-kit/app-env"
import { getAllDayDateUTC } from "../../../../src/applications/common/api/common/utils/CommonCalendarUtils.js"
import { createTestEntity } from "../../TestUtils.js"

import { CalendarEventTypeRef, CalendarRepeatRuleTypeRef } from "@tutao/entities/tutanota"

import { AlarmInfoTypeRef, DateWrapperTypeRef, RepeatRuleTypeRef, UserAlarmInfoTypeRef } from "@tutao/entities/sys"

const calendarTimeZone = "Europe/Berlin"
const now = new Date("2019-08-13T14:01:00.630Z")

o.spec("CalendarExporter", function () {
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
							{ zone: calendarTimeZone },
						).toJSDate(),
						endTime: DateTime.fromObject(
							{
								year: 2019,
								month: 9,
								day: 13,
								hour: 5,
								minute: 6,
							},
							{ zone: calendarTimeZone },
						).toJSDate(),
						description: "Descr \\ ;, \n",
						uid: "test@tuta.com",
						location: "Some location",
					}),
					[],
					now,
					calendarTimeZone,
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
							{ zone: calendarTimeZone },
						).toJSDate(),
						endTime: DateTime.fromObject(
							{
								year: 2019,
								month: 9,
								day: 13,
								hour: 5,
								minute: 6,
							},
							{ zone: calendarTimeZone },
						).toJSDate(),
						description: "Descr \\ ; \n",
					}),
					[alarmOne, alarmTwo],
					now,
					calendarTimeZone,
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
								{ zone: calendarTimeZone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone: calendarTimeZone },
							).toJSDate(),
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
								endType: EndType.Never,
								interval: "3",
								frequency: RepeatPeriod.WEEKLY,
								timeZone: calendarTimeZone,
								endValue: null,
							}),
						}),
						[],
						now,
						calendarTimeZone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${calendarTimeZone}:20190813T050600`,
					`DTEND;TZID=${calendarTimeZone}:20190913T050600`,
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
								{ zone: calendarTimeZone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone: calendarTimeZone },
							).toJSDate(),
							repeatRule: createTestEntity(RepeatRuleTypeRef, {
								endType: EndType.Count,
								interval: "3",
								frequency: RepeatPeriod.DAILY,
								endValue: "100",
								timeZone: calendarTimeZone,
							}),
						}),
						[],
						now,
						calendarTimeZone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${calendarTimeZone}:20190813T050600`,
					`DTEND;TZID=${calendarTimeZone}:20190913T050600`,
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
								{ zone: calendarTimeZone },
							).toJSDate(),
							endTime: DateTime.fromObject(
								{
									year: 2019,
									month: 9,
									day: 13,
									hour: 5,
									minute: 6,
								},
								{ zone: calendarTimeZone },
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
										{ zone: calendarTimeZone },
									).toMillis(),
								),
								timeZone: calendarTimeZone,
							}),
						}),
						[],
						now,
						calendarTimeZone,
					),
				).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART;TZID=${calendarTimeZone}:20190813T050600`,
					`DTEND;TZID=${calendarTimeZone}:20190913T050600`,
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
								timeZone: calendarTimeZone,
							}),
						}),
						[],
						now,
						calendarTimeZone,
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
					{ zone: calendarTimeZone },
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
					calendarTimeZone,
				)

				o.check(serializedEvent).deepEquals([
					"BEGIN:VEVENT",
					`DTSTART:${formatDateTimeUTC(alteredInstanceStartTime)}`,
					`DTEND:${formatDateTimeUTC(alteredInstanceEndTime)}`,
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					`RECURRENCE-ID;VALUE=DATE-TIME:${formatDateTimeUTC(originalStartTime)}`,
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
				const serializedEvent = serializeEvent(calendarEvent, [], now, calendarTimeZone)

				o.check(serializedEvent).deepEquals([
					"BEGIN:VEVENT",
					"DTSTART;VALUE=DATE:20190814",
					"DTEND;VALUE=DATE:20190815",
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Word \\\\ \\; \\n",
					`RECURRENCE-ID;VALUE=DATE-TIME:${formatDateTimeUTC(originalAlldayStartTime)}`,
					"DESCRIPTION:Descr \\\\ \\;\\, \\n",
					"LOCATION:Some location",
					"END:VEVENT",
				])
			})
		})

		o.spec("Events with timeZones", function () {
			const saoPauloTimeZone = "America/Sao_Paulo"
			const tokyoTimeZone = "Asia/Tokyo"

			o.test("Event with the same start and end timezones", function () {
				const calendarEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "Very long flight",
					startTime: DateTime.fromObject(
						{
							year: 2019,
							month: 8,
							day: 13,
							hour: 5,
							minute: 6,
						},
						{ zone: saoPauloTimeZone },
					).toJSDate(),
					endTime: DateTime.fromObject(
						{
							year: 2019,
							month: 9,
							day: 13,
							hour: 10,
							minute: 6,
						},
						{ zone: saoPauloTimeZone },
					).toJSDate(),
					uid: "test@tuta.com",
					startTimeZone: saoPauloTimeZone,
					endTimeZone: saoPauloTimeZone,
				})

				const expectedSerializedEventLines = [
					"BEGIN:VEVENT",
					"DTSTART;TZID=America/Sao_Paulo:20190813T050600",
					"DTEND;TZID=America/Sao_Paulo:20190913T100600",
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Very long flight",
					"END:VEVENT",
				]

				const serializedEvent = serializeEvent(calendarEvent, [], now, calendarTimeZone)

				o.check(serializedEvent).deepEquals(expectedSerializedEventLines)
			})

			o.test("Event with different start and end timezones", function () {
				const calendarEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "Very long flight",
					startTime: DateTime.fromObject(
						{
							year: 2019,
							month: 8,
							day: 13,
							hour: 5,
							minute: 6,
						},
						{ zone: saoPauloTimeZone },
					).toJSDate(),
					endTime: DateTime.fromObject(
						{
							year: 2019,
							month: 9,
							day: 13,
							hour: 5,
							minute: 6,
						},
						{ zone: tokyoTimeZone },
					).toJSDate(),
					uid: "test@tuta.com",
					startTimeZone: saoPauloTimeZone,
					endTimeZone: tokyoTimeZone,
				})

				const expectedSerializedEventLines = [
					"BEGIN:VEVENT",
					"DTSTART;TZID=America/Sao_Paulo:20190813T050600",
					"DTEND;TZID=Asia/Tokyo:20190913T050600",
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Very long flight",
					"END:VEVENT",
				]

				const serializedEvent = serializeEvent(calendarEvent, [], now, calendarTimeZone)

				o.check(serializedEvent).deepEquals(expectedSerializedEventLines)
			})

			o.test("Repeating event with different timezones should have both TZID serialized", function () {
				const calendarEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "Very long flight",
					startTime: DateTime.fromObject(
						{
							year: 2019,
							month: 8,
							day: 13,
							hour: 5,
							minute: 6,
						},
						{ zone: saoPauloTimeZone },
					).toJSDate(),
					endTime: DateTime.fromObject(
						{
							year: 2019,
							month: 9,
							day: 13,
							hour: 5,
							minute: 6,
						},
						{ zone: tokyoTimeZone },
					).toJSDate(),
					uid: "test@tuta.com",
					startTimeZone: saoPauloTimeZone,
					endTimeZone: tokyoTimeZone,
					repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
						endType: EndType.Never,
						interval: "1",
						frequency: RepeatPeriod.DAILY,
						timeZone: saoPauloTimeZone,
					}),
				})

				const expectedSerializedEventLines = [
					"BEGIN:VEVENT",
					"DTSTART;TZID=America/Sao_Paulo:20190813T050600",
					"DTEND;TZID=Asia/Tokyo:20190913T050600",
					`DTSTAMP:20190813T140100Z`,
					"UID:test@tuta.com",
					"SEQUENCE:0",
					"SUMMARY:Very long flight",
					"RRULE:FREQ=DAILY;INTERVAL=1",
					"END:VEVENT",
				]

				const serializedEvent = serializeEvent(calendarEvent, [], now, calendarTimeZone)

				o.check(serializedEvent).deepEquals(expectedSerializedEventLines)
			})
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

	o.spec("serializeDTProperty", () => {
		const testDateComponents: Pick<DateObjectUnits, "year" | "month" | "day"> = {
			year: 2026,
			month: 7,
			day: 15,
		}

		o.test("All-day event serializes as VALUE=DATE", function () {
			const eventStartDate = createDateInZone("UTC", 0, 0)

			const expectedString = "DTSTART;VALUE=DATE:20260715"

			const result = serializeDTProperty("DTSTART", true, eventStartDate, calendarTimeZone, null, calendarTimeZone)
			o.check(result).equals(expectedString)
		})

		o.test("Timed event uses event timezone", function () {
			const eventTimeZone = "America/Sao_Paulo"
			const eventStartDate = createDateInZone(eventTimeZone, 13, 30)

			const expectedString = `DTSTART;TZID=${eventTimeZone}:20260715T133000`

			const result = serializeDTProperty("DTSTART", false, eventStartDate, eventTimeZone, null, calendarTimeZone)
			o.check(result).equals(expectedString)
		})

		o.test("Timed event falls back to repeat rule timezone when event timezone is unavailable (incomplete calendar event state)", function () {
			const eventTimeZone = null
			const eventRepeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				timeZone: "America/Sao_Paulo",
			})
			const eventStartDate = createDateInZone(eventRepeatRule.timeZone, 13, 30)

			const expectedString = `DTSTART;TZID=${eventRepeatRule.timeZone}:20260715T133000`

			const result = serializeDTProperty("DTSTART", false, eventStartDate, eventTimeZone, eventRepeatRule, calendarTimeZone)
			o.check(result).equals(expectedString)
		})

		o.test("Timed event serializes in UTC when no timezone is available", function () {
			const eventStartDate = createDateInZone("UTC", 13, 30)

			const expectedString = `DTSTART:20260715T133000Z`

			const result = serializeDTProperty("DTSTART", false, eventStartDate, null, null, calendarTimeZone)

			o.check(result).equals(expectedString)
		})

		o.test("Event timezone takes precedence over repeat rule timezone", function () {
			const eventTimeZone = "America/Buenos_Aires"
			const eventRepeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				timeZone: "America/Sao_Paulo",
			})
			const eventStartDate = createDateInZone(eventRepeatRule.timeZone, 13, 30)

			const expectedString = `DTSTART;TZID=${eventTimeZone}:20260715T133000`

			const result = serializeDTProperty("DTSTART", false, eventStartDate, eventTimeZone, eventRepeatRule, calendarTimeZone)
			o.check(result).equals(expectedString)
		})

		o.test("Serializes DTEND property", function () {
			const eventStartDate = createDateInZone("UTC", 13, 30)

			const expectedString = `DTEND:20260715T133000Z`

			const result = serializeDTProperty("DTEND", false, eventStartDate, null, null, calendarTimeZone)

			o.check(result).equals(expectedString)
		})

		function createDateInZone(zone: string, hour?: number, minute?: number): Date {
			return DateTime.fromObject(
				{
					...testDateComponents,
					hour,
					minute,
				},
				{ zone },
			).toJSDate()
		}
	})
})
