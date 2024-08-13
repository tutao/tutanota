import o from "@tutao/otest"
import {
	addDaysForEventInstance,
	addDaysForRecurringEvent,
	AlarmInterval,
	AlarmIntervalUnit,
	AlarmOccurrence,
	calendarEventHasMoreThanOneOccurrencesLeft,
	CalendarEventValidity,
	CalendarMonth,
	checkEventValidity,
	createRepeatRuleWithValues,
	eventEndsBefore,
	eventStartsAfter,
	findNextAlarmOccurrence,
	getAllDayDateForTimezone,
	getAllDayDateUTCFromZone,
	getDiffIn24hIntervals,
	getDiffIn60mIntervals,
	getMonthRange,
	getStartOfDayWithZone,
	getStartOfWeek,
	getTimeZone,
	getWeekNumber,
	isEventBetweenDays,
	parseAlarmInterval,
	prepareCalendarDescription,
	StandardAlarmInterval,
} from "../../../src/common/calendar/date/CalendarUtils.js"
import { lang } from "../../../src/common/misc/LanguageViewModel.js"
import { DateWrapperTypeRef, GroupMembershipTypeRef, GroupTypeRef, User, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { AccountType, EndType, GroupType, RepeatPeriod, ShareCapability } from "../../../src/common/api/common/TutanotaConstants.js"
import { timeStringFromParts } from "../../../src/common/misc/Formatter.js"
import { DateTime } from "luxon"
import { generateEventElementId, getAllDayDateUTC, serializeAlarmInterval } from "../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { hasCapabilityOnGroup } from "../../../src/common/sharing/GroupUtils.js"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarRepeatRuleTypeRef,
	createCalendarRepeatRule,
	EncryptedMailAddressTypeRef,
	UserSettingsGroupRootTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clone, getStartOfDay, identity, lastThrow, neverNull } from "@tutao/tutanota-utils"
import { object, replace } from "testdouble"
import { CalendarEventAlteredInstance, CalendarEventProgenitor } from "../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { getDateInUTC, getDateInZone, makeUserController } from "./CalendarTestUtils.js"
import { ParserError } from "../../../src/common/misc/parsing/ParserCombinator.js"
import { createTestEntity } from "../TestUtils.js"

import { getCalendarMonth, getEventType } from "../../../src/calendar-app/calendar/gui/CalendarGuiUtils.js"
import { EventType } from "../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarInfo } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { Time } from "../../../src/common/calendar/date/Time.js"
import type { UserController } from "../../../src/common/api/main/UserController.js"

const zone = "Europe/Berlin"

o.spec("calendar utils tests", function () {
	function iso(strings: TemplateStringsArray, ...dates: number[]) {
		let result = ""

		for (const [i, d] of dates.entries()) {
			const s = strings[i]
			result += s
			result += `(${d}) ${DateTime.fromMillis(d).toISO({ format: "extended", includeOffset: true })}`
		}
		result += lastThrow(strings)
		return result
	}

	o.spec("getAllDayDateUTCFromZone", function () {
		o("it produces a date with the same day in UTC", function () {
			// DateTime.fromObject({year: 2023, month: 1, day: 30}, {zone: "Asia/Krasnoyarsk"}).toMillis()
			const date = new Date("2023-01-29T17:00:00.000Z")
			// DateTime.fromObject({year: 2023, month: 1, day: 30}, {zone:"UTC"}).toMillis()
			const expected = "2023-01-30T00:00:00.000Z"
			const result = getAllDayDateUTCFromZone(date, "Asia/Krasnoyarsk").toISOString()
			o(result).equals(expected)(`${result} vs. ${expected}`)
		})
	})

	o.spec("getStartOfDayWithZone", function () {
		o("it produces a date at the start of the day according to the time zone", function () {
			const date = new Date("2023-01-29T22:30:00.000Z")
			const expected = "2023-01-29T17:00:00.000Z"
			const result = getStartOfDayWithZone(date, "Asia/Krasnoyarsk")
			o(result.toISOString()).equals(expected)(`${result.toISOString()} vs ${expected}`)
		})
		o("when given a date that's already start of day, that date is returned", function () {
			const date = new Date("2023-01-29T00:00:00.000Z")
			const expected = "2023-01-29T00:00:00.000Z"
			const result = getStartOfDayWithZone(date, "utc")
			o(result.toISOString()).equals(expected)("the utc date was not kept the same")
		})
	})

	o.spec("getAllDayDateForTimezone", function () {
		o("converts UTC all-day date into a local one", function () {
			// DateTime.fromObject({year: 2023, month: 1, day: 30}, {zone: "UTC"}).toMillis()
			const date = new Date(1675036800000)
			// DateTime.fromObject({year: 2023, month: 1, day: 30}, {zone: "Asia/Krasnoyarsk"}).toMillis()
			const expected = 1675011600000
			const result = getAllDayDateForTimezone(date, "Asia/Krasnoyarsk")
			o(result.getTime()).equals(expected)(iso`${result.getTime()} vs ${expected}`)
		})
	})

	o.spec("getCalendarMonth", function () {
		o.before(function () {
			lang.init({})
			lang.setLanguage({
				code: "en",
				languageTag: "en",
			})
		})
		o("getCalendarMonth starting on sunday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 0, false))
			//console.log(result)
			o(result).equals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n" +
					"26,27,28,29,30,31,1\n" +
					"2,3,4,5,6,7,8\n" +
					"9,10,11,12,13,14,15\n" +
					"16,17,18,19,20,21,22\n" +
					"23,24,25,26,27,28,29\n" +
					"30,1,2,3,4,5,6",
			)
		})
		o("getCalendarMonth starting on monday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 1, false))
			//console.log(result)
			o(result).equals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n" +
					"27,28,29,30,31,1,2\n" +
					"3,4,5,6,7,8,9\n" +
					"10,11,12,13,14,15,16\n" +
					"17,18,19,20,21,22,23\n" +
					"24,25,26,27,28,29,30\n" +
					"1,2,3,4,5,6,7",
			)
		})
		o("getCalendarMonth starting on saturday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 6, false))
			//console.log(result)
			o(result).equals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n" +
					"1,2,3,4,5,6,7\n" +
					"8,9,10,11,12,13,14\n" +
					"15,16,17,18,19,20,21\n" +
					"22,23,24,25,26,27,28\n" +
					"29,30,1,2,3,4,5\n" +
					"6,7,8,9,10,11,12",
			)
		})
		o("getCalendarMonth starting on sunday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 0, false)) // september

			//console.log(result)
			o(result).equals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n" +
					"1,2,3,4,5,6,7\n" +
					"8,9,10,11,12,13,14\n" +
					"15,16,17,18,19,20,21\n" +
					"22,23,24,25,26,27,28\n" +
					"29,30,1,2,3,4,5\n" +
					"6,7,8,9,10,11,12",
			)
		})
		o("getCalendarMonth starting on monday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 1, false))
			//console.log(result)
			o(result).equals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n" +
					"26,27,28,29,30,31,1\n" +
					"2,3,4,5,6,7,8\n" +
					"9,10,11,12,13,14,15\n" +
					"16,17,18,19,20,21,22\n" +
					"23,24,25,26,27,28,29\n" +
					"30,1,2,3,4,5,6",
			)
		})
		o("getCalendarMonth starting on saturday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 6, false))
			//console.log(result)
			o(result).equals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n" +
					"31,1,2,3,4,5,6\n" +
					"7,8,9,10,11,12,13\n" +
					"14,15,16,17,18,19,20\n" +
					"21,22,23,24,25,26,27\n" +
					"28,29,30,1,2,3,4\n" +
					"5,6,7,8,9,10,11",
			)
		})
		o("getCalendarMonth starting on sunday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 0, false)) // july

			//console.log(result)
			o(result).equals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n" +
					"30,1,2,3,4,5,6\n" +
					"7,8,9,10,11,12,13\n" +
					"14,15,16,17,18,19,20\n" +
					"21,22,23,24,25,26,27\n" +
					"28,29,30,31,1,2,3\n" +
					"4,5,6,7,8,9,10",
			)
		})
		o("getCalendarMonth starting on monday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 1, false))
			//console.log(result)
			o(result).equals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n" +
					"1,2,3,4,5,6,7\n" +
					"8,9,10,11,12,13,14\n" +
					"15,16,17,18,19,20,21\n" +
					"22,23,24,25,26,27,28\n" +
					"29,30,31,1,2,3,4\n" +
					"5,6,7,8,9,10,11",
			)
		})
		o("getCalendarMonth starting on saturday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 6, false))
			//console.log(result)
			o(result).equals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n" +
					"29,30,1,2,3,4,5\n" +
					"6,7,8,9,10,11,12\n" +
					"13,14,15,16,17,18,19\n" +
					"20,21,22,23,24,25,26\n" +
					"27,28,29,30,31,1,2\n" +
					"3,4,5,6,7,8,9",
			)
		})
	})
	o.spec("parseTimeTo", function () {
		function parseTimeString(timeString: string): { hours: number; minutes: number } {
			return neverNull(Time.parseFromString(timeString)?.toObject() ?? null)
		}

		o("parses full 24H time", function () {
			o(parseTimeString("12:45")).deepEquals({
				hours: 12,
				minutes: 45,
			})
			o(parseTimeString("1245")).deepEquals({
				hours: 12,
				minutes: 45,
			})
			o(parseTimeString("2359")).deepEquals({
				hours: 23,
				minutes: 59,
			})
			o(parseTimeString("0000")).deepEquals({
				hours: 0,
				minutes: 0,
			})
			o(parseTimeString("0623")).deepEquals({
				hours: 6,
				minutes: 23,
			})
			o(parseTimeString("08:09")).deepEquals({
				hours: 8,
				minutes: 9,
			})
		})
		o("parses partial 24H time", function () {
			o(parseTimeString("12")).deepEquals({
				hours: 12,
				minutes: 0,
			})
			o(parseTimeString("1:2")).deepEquals({
				hours: 1,
				minutes: 2,
			})
			o(parseTimeString("102")).deepEquals({
				hours: 1,
				minutes: 2,
			})
			o(parseTimeString("17")).deepEquals({
				hours: 17,
				minutes: 0,
			})
			o(parseTimeString("6")).deepEquals({
				hours: 6,
				minutes: 0,
			})
			o(parseTimeString("955")).deepEquals({
				hours: 9,
				minutes: 55,
			})
			o(parseTimeString("12:3")).deepEquals({
				hours: 12,
				minutes: 3,
			})
			o(parseTimeString("809")).deepEquals({
				hours: 8,
				minutes: 9,
			})
		})
		o("not parses incorrect time", function () {
			o(parseTimeString("12:3m")).equals(null)
			o(parseTimeString("A:3")).equals(null)
			o(parseTimeString("")).equals(null)
			o(parseTimeString(":2")).equals(null)
			o(parseTimeString("25:03")).equals(null)
			o(parseTimeString("22:93")).equals(null)
			o(parseTimeString("24")).equals(null)
			o(parseTimeString("13pm")).equals(null)
			o(parseTimeString("263PM")).equals(null)
			o(parseTimeString("1403PM")).equals(null)
			o(parseTimeString("14:03:33PM")).equals(null)
			o(parseTimeString("9:37 acme")).equals(null)
		})
		o("parses AM/PM time", function () {
			o(parseTimeString("7PM")).deepEquals({
				hours: 19,
				minutes: 0,
			})
			o(parseTimeString("11PM")).deepEquals({
				hours: 23,
				minutes: 0,
			})
			o(parseTimeString("12PM")).deepEquals({
				hours: 12,
				minutes: 0,
			})
			o(parseTimeString("11:30PM")).deepEquals({
				hours: 23,
				minutes: 30,
			})
			o(parseTimeString("12AM")).deepEquals({
				hours: 0,
				minutes: 0,
			})
			o(parseTimeString("12:30AM")).deepEquals({
				hours: 0,
				minutes: 30,
			})
			o(parseTimeString("3:30AM")).deepEquals({
				hours: 3,
				minutes: 30,
			})
			o(parseTimeString("3:30PM")).deepEquals({
				hours: 15,
				minutes: 30,
			})
			o(parseTimeString("9:37am")).deepEquals({
				hours: 9,
				minutes: 37,
			})
			o(parseTimeString("1:59pm")).deepEquals({
				hours: 13,
				minutes: 59,
			})
			o(parseTimeString("3:30 AM")).deepEquals({
				hours: 3,
				minutes: 30,
			})
			o(parseTimeString("3:30 PM")).deepEquals({
				hours: 15,
				minutes: 30,
			})
			o(parseTimeString("9:37 am")).deepEquals({
				hours: 9,
				minutes: 37,
			})
			o(parseTimeString("1:59 pm")).deepEquals({
				hours: 13,
				minutes: 59,
			})
			o(parseTimeString("9:37 a.m.")).deepEquals({
				hours: 9,
				minutes: 37,
			})
			o(parseTimeString("1:59 p.m.")).deepEquals({
				hours: 13,
				minutes: 59,
			})
			o(parseTimeString("1052 P.M.")).deepEquals({
				hours: 22,
				minutes: 52,
			})
			o(parseTimeString("1052 A.M.")).deepEquals({
				hours: 10,
				minutes: 52,
			})
			o(parseTimeString("948 P.M.")).deepEquals({
				hours: 21,
				minutes: 48,
			})
			o(parseTimeString("948 A.M.")).deepEquals({
				hours: 9,
				minutes: 48,
			})
		})
	})
	o.spec("timeStringFromParts", function () {
		o("works", function () {
			o(timeStringFromParts(0, 0, true)).equals("12:00 am")
			o(timeStringFromParts(12, 0, true)).equals("12:00 pm")
			o(timeStringFromParts(10, 55, true)).equals("10:55 am")
			o(timeStringFromParts(10, 55, false)).equals("10:55")
			o(timeStringFromParts(22, 55, true)).equals("10:55 pm")
			o(timeStringFromParts(22, 55, false)).equals("22:55")
		})
	})
	o.spec("getStartOfWeek", function () {
		o("works", function () {
			o(getStartOfWeek(new Date(2019, 6, 7), 0).toISOString()).equals(new Date(2019, 6, 7).toISOString())
			o(getStartOfWeek(new Date(2019, 6, 7), 1).toISOString()).equals(new Date(2019, 6, 1).toISOString())
			o(getStartOfWeek(new Date(2019, 6, 7, 3, 4, 5), 1).toISOString()).equals(new Date(2019, 6, 1).toISOString())
		})
	})
	o.spec("getWeekNumber", function () {
		o("works", function () {
			o(getWeekNumber(new Date(2019, 7, 5))).equals(32)
			o(getWeekNumber(new Date(2019, 7, 4))).equals(31)
			o(getWeekNumber(new Date(2017, 11, 25))).equals(52)
			o(getWeekNumber(new Date(2018, 0, 1))).equals(1)
		})
	})
	o.spec("capability", function () {
		let user
		let ownerUser
		let group
		let groupMembership
		let groupOwnerMembership
		o.before(function () {
			// @ts-ignore
			group = createTestEntity(GroupTypeRef, {
				_id: "g1",
				type: GroupType.Calendar,
				user: "groupOwner",
			})
			groupMembership = createTestEntity(GroupMembershipTypeRef, {
				group: group._id,
			})
			groupOwnerMembership = createTestEntity(GroupMembershipTypeRef, {
				group: group._id,
			})
			ownerUser = createTestEntity(UserTypeRef, {
				_id: "groupOwner",
				memberships: [groupOwnerMembership],
			})
			user = createTestEntity(UserTypeRef, {
				_id: "groupMember",
				memberships: [groupMembership],
			})
		})
		o("hasCapability - Invite", function () {
			groupMembership.capability = ShareCapability.Invite
			o(hasCapabilityOnGroup(user, group, ShareCapability.Invite)).equals(true)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Write)).equals(true)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Read)).equals(true)
		})
		o("hasCapability - Write", function () {
			groupMembership.capability = ShareCapability.Write
			o(hasCapabilityOnGroup(user, group, ShareCapability.Invite)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Write)).equals(true)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Read)).equals(true)
		})
		o("hasCapability - Read", function () {
			groupMembership.capability = ShareCapability.Read
			o(hasCapabilityOnGroup(user, group, ShareCapability.Invite)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Write)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Read)).equals(true)
		})
		o("hasCapability - Null", function () {
			groupMembership.capability = null
			o(hasCapabilityOnGroup(user, group, ShareCapability.Invite)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Write)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Read)).equals(false)
		})
		o("hasCapability - Owner", function () {
			groupMembership.capability = null
			o(hasCapabilityOnGroup(ownerUser, group, ShareCapability.Invite)).equals(true)
			o(hasCapabilityOnGroup(ownerUser, group, ShareCapability.Write)).equals(true)
			o(hasCapabilityOnGroup(ownerUser, group, ShareCapability.Read)).equals(true)
		})
		o("hasCapability - no membership", function () {
			user.memberships = []
			o(hasCapabilityOnGroup(user, group, ShareCapability.Invite)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Write)).equals(false)
			o(hasCapabilityOnGroup(user, group, ShareCapability.Read)).equals(false)
		})
	})
	o.spec("prepareCalendarDescription", function () {
		o("angled link replaced with a proper link", function () {
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path>", identity)).equals(
				`JoinBlahBlah<a href="https://the-link.com/path">https://the-link.com/path</a>`,
			)
		})
		o("normal HTML link is not touched", function () {
			o(prepareCalendarDescription(`JoinBlahBlah<a href="https://the-link.com/path">a link</a>`, identity)).equals(
				`JoinBlahBlah<a href="https://the-link.com/path">a link</a>`,
			)
		})
		o("non-HTTP/HTTPS link is not allowed", function () {
			o(prepareCalendarDescription(`JoinBlahBlah<protocol://the-link.com/path>`, identity)).equals(`JoinBlahBlah<protocol://the-link.com/path>`)
		})
		o("link with additional text is not allowed", function () {
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path and some other text>", identity)).equals(
				`JoinBlahBlah<https://the-link.com/path and some other text>`,
			)
		})
		o("non-closed tag is not allowed", function () {
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path and some other text", identity)).equals(
				`JoinBlahBlah<https://the-link.com/path and some other text`,
			)
		})
	})
	o.spec("findNextAlarmOccurrence", function () {
		const timeZone = "Europe/Berlin"
		o("weekly never ends", function () {
			const now = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 2,
				},
				{ zone: timeZone },
			).toJSDate()
			const eventStart = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 2,
					hour: 12,
				},
				{ zone: timeZone },
			).toJSDate()
			const eventEnd = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 2,
					hour: 14,
				},
				{ zone: timeZone },
			).toJSDate()
			const occurrences = iterateAlarmOccurrences(
				now,
				timeZone,
				eventStart,
				eventEnd,
				RepeatPeriod.WEEKLY,
				1,
				EndType.Never,
				0,
				[],
				StandardAlarmInterval.ONE_HOUR,
				timeZone,
				10,
			)
			o(occurrences.slice(0, 4)).deepEquals([
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 2,
						hour: 11,
					},
					{ zone: timeZone },
				).toJSDate(),
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 9,
						hour: 11,
					},
					{ zone: timeZone },
				).toJSDate(),
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 16,
						hour: 11,
					},
					{ zone: timeZone },
				).toJSDate(),
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 23,
						hour: 11,
					},
					{ zone: timeZone },
				).toJSDate(),
			])
		})
		o("ends for all-day event correctly", function () {
			const repeatRuleTimeZone = "Asia/Anadyr" // +12

			const now = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 1,
				},
				{ zone: timeZone },
			).toJSDate()
			// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
			const eventStart = getAllDayDateUTC(
				DateTime.fromObject({
					year: 2019,
					month: 5,
					day: 2,
				}).toJSDate(),
			)
			const eventEnd = getAllDayDateUTC(
				DateTime.fromObject({
					year: 2019,
					month: 5,
					day: 3,
				}).toJSDate(),
			)
			const repeatEnd = getAllDayDateUTC(
				DateTime.fromObject({
					year: 2019,
					month: 5,
					day: 4,
				}).toJSDate(),
			)
			const occurrences = iterateAlarmOccurrences(
				now,
				repeatRuleTimeZone,
				eventStart,
				eventEnd,
				RepeatPeriod.DAILY,
				1,
				EndType.UntilDate,
				repeatEnd.getTime(),
				[],
				StandardAlarmInterval.ONE_DAY,
				timeZone,
				10,
			)
			o(occurrences).deepEquals([
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 1,
						hour: 0,
					},
					{ zone: timeZone },
				).toJSDate(),
				DateTime.fromObject(
					{
						year: 2019,
						month: 5,
						day: 2,
						hour: 0,
					},
					{ zone: timeZone },
				).toJSDate(),
			])
		})
	})
	o.spec("Diff between events", function () {
		o("getDiffIn60mIntervals", function () {
			o(getDiffIn60mIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2021-01-01T23:00:00.000Z"))).equals(24)
			o(getDiffIn60mIntervals(new Date("2021-01-01T23:00:00.000Z"), new Date("2020-12-31T23:00:00.000Z"))).equals(-24)
			o(getDiffIn60mIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2020-12-31T23:30:00.000Z"))).equals(0)
			o(getDiffIn60mIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2021-01-01T00:00:00.000Z"))).equals(1)
		})
		o("getDiffIn24hIntervals", function () {
			o(getDiffIn24hIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2021-01-01T23:00:00.000Z"))).equals(1)
			o(getDiffIn24hIntervals(new Date("2021-01-01T23:00:00.000Z"), new Date("2020-12-31T23:00:00.000Z"))).equals(-1)
			o(getDiffIn24hIntervals(new Date("2021-01-01T00:01:00.000Z"), new Date("2020-12-30T23:59:00.000Z"))).equals(-2)("less than 2*24, but gives -2?")
			o(getDiffIn24hIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2020-12-31T23:30:00.000Z"))).equals(0)
			o(getDiffIn24hIntervals(new Date("2020-12-31T23:00:00.000Z"), new Date("2021-01-01T00:00:00.000Z"))).equals(0)
		})
	})
	o.spec("Event start and end time comparison", function () {
		const zone = getTimeZone()

		function eventOn(start: Date, end: Date): CalendarEvent {
			return createTestEntity(CalendarEventTypeRef, {
				startTime: start,
				endTime: end,
			})
		}

		o("starts after", function () {
			o(eventStartsAfter(new Date(2021, 0, 1), zone, eventOn(new Date(2021, 0, 1), new Date(2021, 0, 1)))).equals(false)(`starts same day`)
			o(eventStartsAfter(new Date(2021, 0, 1), zone, eventOn(new Date(2020, 11, 31), new Date(2021, 0, 1)))).equals(false)(`starts before`)
			o(eventStartsAfter(new Date(2021, 0, 1), zone, eventOn(new Date(2021, 0, 2), new Date(2021, 0, 2)))).equals(true)(`starts after`)
		})
		o("ends before", function () {
			o(eventEndsBefore(new Date(2021, 0, 1), zone, eventOn(new Date(2020, 11, 31), new Date(2021, 0, 1)))).equals(false)(`ends same day`)
			o(eventEndsBefore(new Date(2021, 0, 1), zone, eventOn(new Date(2020, 11, 31), new Date(2021, 0, 2)))).equals(false)(`ends after`)
			o(eventEndsBefore(new Date(2021, 0, 1), zone, eventOn(new Date(2020, 11, 30), new Date(2020, 11, 31)))).equals(true)(`ends before`)
		})
		o("event is in week", function () {
			const firstDayOfWeek = new Date(2021, 8, 6)
			const lastDayOfWeek = new Date(2021, 8, 12)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 5, 13, 30), new Date(2021, 8, 6, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts before, ends first day`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 5, 13, 30), new Date(2021, 8, 12, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts before, ends last day`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 6, 13, 30), new Date(2021, 8, 6, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts first day, ends first day`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 6, 13, 30), new Date(2021, 8, 12, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts first day, ends last day`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 6, 13, 30), new Date(2021, 8, 13, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts first day, ends after`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 12, 13, 30), new Date(2021, 8, 12, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts last day, ends last day`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 12, 13, 30), new Date(2021, 8, 13, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts last day, ends after`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 5, 13, 30), new Date(2021, 8, 13, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(true)(
				`starts before, ends after`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 5, 13, 30), new Date(2021, 8, 5, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(false)(
				`starts before, ends before`,
			)
			o(isEventBetweenDays(eventOn(new Date(2021, 8, 13, 13, 30), new Date(2021, 8, 13, 13, 30)), firstDayOfWeek, lastDayOfWeek, zone)).equals(false)(
				`starts after, ends after`,
			) // Cases not mentioned are UB
		})
	})
	o.spec("check event validity", function () {
		o("events with invalid dates are detected", function () {
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("nan"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1991"),
						endTime: new Date("nan"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("nan"),
						endTime: new Date("nan"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
		})
		o("events with start date not before end date are detected", function () {
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1990"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1990"),
						endTime: new Date("1980"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
		})
		o("events with date before 1970 are detected", function () {
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1969"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidPre1970)
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1960"),
						endTime: new Date("1966"),
					}),
				),
			).equals(CalendarEventValidity.InvalidPre1970)
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: new Date("1970"),
						endTime: new Date("1966"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
		})
		o("valid events are detected", function () {
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: getDateInUTC("1970"),
						endTime: getDateInUTC("1990"),
					}),
				),
			).equals(CalendarEventValidity.Valid)("events on the cusp of 1970 UTC are valid")
			o(
				checkEventValidity(
					createTestEntity(CalendarEventTypeRef, {
						startTime: getDateInZone("1971"),
						endTime: getDateInZone("2022"),
					}),
				),
			).equals(CalendarEventValidity.Valid)
		})
	})
	o.spec("addDaysForEventInstance", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("short event same month", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)
			addDaysForEventInstance(eventsForDays, event, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("short event prev month", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const prevMonth = getMonthRange(getDateInZone("2019-04-01"), zone)
			addDaysForEventInstance(eventsForDays, event, prevMonth, zone)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			// @ts-ignore
			o(eventsForDay).deepEquals(undefined)
		})
		o("short event next month", function () {
			const krsk = "Asia/Krasnoyarsk"
			const event = createEvent(getDateInZone("2019-05-01T08:00", krsk), getDateInZone("2019-05-01T10:00", krsk))
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), krsk)
			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			// @ts-ignore
			o(eventsForDay).deepEquals(undefined)
		})
		o("short event multiple days", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-04T10:00"))
			const thisMonth = getMonthRange(getDateInZone("2019-05-01"), zone)
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), zone)
			// the event is not in june, duh
			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(0)

			addDaysForEventInstance(eventsForDays, event, thisMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-04").getTime())).deepEquals([event])
		})
		o("short event multiple days spans next month", function () {
			const event = createEvent(getDateInZone("2019-05-29T08:00"), getDateInZone("2019-06-02T10:00"))
			const thisMonth = getMonthRange(getDateInZone("2019-05-01"), zone)
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), zone)

			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])

			addDaysForEventInstance(eventsForDays, event, thisMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(2 + 3)
			o(eventsForDays.get(getDateInZone("2019-05-29").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
		o("all day event", function () {
			// all day event of one day
			const event = createEvent(getDateInUTC("2019-05-01"), getDateInUTC("2019-05-02"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("all day event two days", function () {
			const event = createEvent(getDateInUTC("2019-04-30"), getDateInUTC("2019-05-02"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)

			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-04-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
			o(eventsForDays.get(getDateInZone("2019-04-30").getTime())).deepEquals([event])
		})
		o("add same event", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)
			addDaysForEventInstance(eventsForDays, event, month, zone)
			const secondEvent = clone(event)
			addDaysForEventInstance(eventsForDays, secondEvent, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("event became shorter", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-05T12:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)

			// add for may
			addDaysForEventInstance(eventsForDays, event, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([event])("Original event is added")
			const shorterEvent = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-03T12:00"))
			shorterEvent._id = event._id

			// add for may again, but with fewer days.
			addDaysForEventInstance(eventsForDays, shorterEvent, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([])("Original event is removed")
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([shorterEvent])("New event is added")
		})
	})
	o.spec("addDaysForRecurringEvent", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("recurring event - short with time ", function () {
			// event that goes on for 2 hours and repeats weekly
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
			o(eventsForDays.get(getDateInZone("2019-06-06").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-06T10:00"), getDateInZone("2019-06-06T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-13").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-13T10:00"), getDateInZone("2019-06-13T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-20").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-20T10:00"), getDateInZone("2019-06-20T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4 + 5)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-09T10:00"), getDateInZone("2019-05-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-16T10:00"), getDateInZone("2019-05-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-23T10:00"), getDateInZone("2019-05-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00")),
			])
		})
		o("recurring event - short with time & day interval", function () {
			// two hour event that happens every fourth day
			const event = createEvent(getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 4, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-03T10:00"), getDateInZone("2019-06-03T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-07").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-07T10:00"), getDateInZone("2019-06-07T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-11").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-11T10:00"), getDateInZone("2019-06-11T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-15").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-15T10:00"), getDateInZone("2019-06-15T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-19").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-19T10:00"), getDateInZone("2019-06-19T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-23T10:00"), getDateInZone("2019-06-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(7)
		})
		o("recurring event - short with time & monthly", function () {
			const event = createEvent(getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			const expectedForMay = [cloneEventWithNewTime(event, getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))]
			const expectedForJune = [cloneEventWithNewTime(event, getDateInZone("2019-06-30T10:00"), getDateInZone("2019-06-30T12:00"))]
			const expectedForJuly = [cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00"))]
			const expectedForFebruary = [cloneEventWithNewTime(event, getDateInZone("2020-02-29T10:00"), getDateInZone("2020-02-29T12:00"))]

			// add for may
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(countDaysWithEvents(eventsForDays)).equals(1)

			// add for june
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(countDaysWithEvents(eventsForDays)).equals(2)

			// add for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals(expectedForJuly)
			o(countDaysWithEvents(eventsForDays)).equals(3)

			// add for february 2020
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-02-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals(expectedForJuly)
			o(eventsForDays.get(getDateInZone("2020-02-29").getTime())).deepEquals(expectedForFebruary)
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("recurring event - short with time & monthly interval", function () {
			const event = createEvent(getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 2, zone)
			// add for june
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(0)("does not occur in june")

			// add for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is added")
			o(countDaysWithEvents(eventsForDays)).equals(1)

			// add for august
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-08-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still there")
			o(countDaysWithEvents(eventsForDays)).equals(1)("nothing added for august")

			// add for september
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-09-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still still there")
			o(eventsForDays.get(getDateInZone("2019-09-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-09-30T10:00"), getDateInZone("2019-09-30T12:00")),
			])("event instance in september was added ")
			o(countDaysWithEvents(eventsForDays)).equals(2)("only september was added")

			// add for november
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-11-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still still still there")
			o(eventsForDays.get(getDateInZone("2019-11-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-11-30T10:00"), getDateInZone("2019-11-30T12:00")),
			])("event instance in november was added")
			o(countDaysWithEvents(eventsForDays)).deepEquals(3)
		})
		o("recurring event - short multiple days ", function () {
			const event = createEvent(getDateInZone("2019-05-03T10:00"), getDateInZone("2019-05-05T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			/**
			 *       May 2019
			 * So Mo Di Mi Do Fr Sa
			 *           1  2  3  4
			 *  5  6  7  8  9 10 11
			 * 12 13 14 15 16 17 18
			 * 19 20 21 22 23 24 25
			 * 26 27 28 29 30 31
			 *
			 *     June 2019
			 * So Mo Di Mi Do Fr Sa
			 *                    1
			 *  2  3  4  5  6  7  8
			 *  9 10 11 12 13 14 15
			 * 16 17 18 19 20 21 22
			 * 23 24 25 26 27 28 29
			 * 30
			 *
			 *      July 2019
			 * So Mo Di Mi Do Fr Sa
			 *     1  2  3  4  5  6
			 *  7  8  9 10 11 12 13
			 * 14 15 16 17 18 19 20
			 * 21 22 23 24 25 26 27
			 * 28 29 30 31
			 */
			// the last occurrence in May leaks into June
			const zerothjuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-31T10:00"), getDateInZone("2019-06-02T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([zerothjuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([zerothjuneOccurrence])
			const firstJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-07T10:00"), getDateInZone("2019-06-09T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-07").getTime())).deepEquals([firstJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-08").getTime())).deepEquals([firstJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([firstJuneOccurrence])
			const secondJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-14T10:00"), getDateInZone("2019-06-16T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-14").getTime())).deepEquals([secondJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-15").getTime())).deepEquals([secondJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-16").getTime())).deepEquals([secondJuneOccurrence])
			const thirdJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-21T10:00"), getDateInZone("2019-06-23T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-21").getTime())).deepEquals([thirdJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-22").getTime())).deepEquals([thirdJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([thirdJuneOccurrence])
			const fourthJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-28T10:00"), getDateInZone("2019-06-30T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-28").getTime())).deepEquals([fourthJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-29").getTime())).deepEquals([fourthJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals([fourthJuneOccurrence])
			o(countDaysWithEvents(eventsForDays)).equals(14)

			const firstMayOccurrence = event
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([firstMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-04").getTime())).deepEquals([firstMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([firstMayOccurrence])
			const secondMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-10T10:00"), getDateInZone("2019-05-12T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-10").getTime())).deepEquals([secondMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-11").getTime())).deepEquals([secondMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-12").getTime())).deepEquals([secondMayOccurrence])
			const thirdMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-17T10:00"), getDateInZone("2019-05-19T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-17").getTime())).deepEquals([thirdMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-18").getTime())).deepEquals([thirdMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-19").getTime())).deepEquals([thirdMayOccurrence])
			const fourthMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-24T10:00"), getDateInZone("2019-05-26T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-24").getTime())).deepEquals([fourthMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-25").getTime())).deepEquals([fourthMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-26").getTime())).deepEquals([fourthMayOccurrence])

			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([zerothjuneOccurrence])
			o(countDaysWithEvents(eventsForDays)).equals(14 + 13)
		})
		o("weekly all-day with DST in another time zone", function () {
			// This test checks that when there is a daylight saving change in UTC-m time zone all-day events in UTC+n still work like they
			// should
			const krsk = "Asia/Krasnoyarsk"
			// all-day event with a length of 1 day
			const event = createEvent(getDateInUTC("2020-02-12"), getDateInUTC("2020-02-13"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			event.repeatRule.timeZone = "America/Los_angeles"
			const month = getMonthRange(getDateInZone("2020-03-01", krsk), krsk)
			addDaysForRecurringEvent(eventsForDays, event, month, krsk)
			o(eventsForDays.get(getDateInZone("2020-03-04", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-04"), getDateInUTC("2020-03-05")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-11", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-11"), getDateInUTC("2020-03-12")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-18", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-18"), getDateInUTC("2020-03-19")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-25", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-25"), getDateInUTC("2020-03-26")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("end count", function () {
			const event = createEvent(getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			repeatRule.endType = EndType.Count
			repeatRule.endValue = "2"
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-09T10:00"), getDateInZone("2019-06-09T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(2)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
		})
		o("end on date", function () {
			const event = createEvent(getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(getDateInZone("2019-06-29").getTime())
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-09T10:00"), getDateInZone("2019-06-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-16T10:00"), getDateInZone("2019-06-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-23T10:00"), getDateInZone("2019-06-23T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("end on date - all day", function () {
			// all-day event of length 1 day
			const event = createEvent(getDateInUTC("2019-06-02"), getDateInUTC("2019-06-03"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 1)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(getDateInUTC("2019-06-04").getTime())
			event.repeatRule = repeatRule
			event.repeatRule.timeZone = "Asia/Anadyr" // +12

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2019-06-02"), getDateInUTC("2019-06-03")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([
				// there are two in here?
				cloneEventWithNewTime(event, getDateInUTC("2019-06-03"), getDateInUTC("2019-06-04")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(2)
		})
		o("add same recurring event", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			const monthDate = getDateInZone("2019-06-01")
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(monthDate, zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-06").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-06T10:00"), getDateInZone("2019-06-06T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-13").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-13T10:00"), getDateInZone("2019-06-13T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-20").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-20T10:00"), getDateInZone("2019-06-20T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			const eventClone = clone(event)
			addDaysForRecurringEvent(eventsForDays, eventClone, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-09T10:00"), getDateInZone("2019-05-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-16T10:00"), getDateInZone("2019-05-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-23T10:00"), getDateInZone("2019-05-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(9)
		})
		o("monthly with shorter month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be shortened by a few
			// days (see #1786).
			// all-day, 3 days (march 29th, 30th, 31st)
			const event = createEvent(getDateInUTC("2020-03-29"), getDateInUTC("2020-04-01"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule
			// 2nd occurrence happens on april 29th, 30th, may 1st
			const occurrence = cloneEventWithNewTime(event, getDateInUTC("2020-04-29"), getDateInUTC("2020-05-02"))

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-03-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2020-03-29").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-03-30").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-03-31").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-04-01").getTime())).deepEquals(undefined)
			o(countDaysWithEvents(eventsForDays)).equals(3)

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-04-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2020-04-29").getTime())).deepEquals([occurrence])("29th is 1st day of the occurrence")
			o(eventsForDays.get(getDateInZone("2020-04-30").getTime())).deepEquals([occurrence])("30. is 2. day of 2nd occurrence")
			o(eventsForDays.get(getDateInZone("2020-05-01").getTime())).deepEquals(undefined)("outside range")
			o(countDaysWithEvents(eventsForDays)).equals(5)
		})
		o("monthly with longer month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be stretched by a few
			// days (see #1786).
			// all-day on the feb 29th, march 1st
			const event = createEvent(getDateInZone("2020-02-29", "utc"), getDateInZone("2020-03-01", "utc"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-02-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2020-02-29").getTime())).deepEquals([event])("the 29th of feb is in the map")
			o(countDaysWithEvents(eventsForDays)).equals(1)("only the last day of february is in the map")
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-03-01"), zone), zone)
			const occurrence = cloneEventWithNewTime(event, getDateInZone("2020-03-29", "utc"), getDateInZone("2020-03-30", "utc"))
			o(eventsForDays.get(getDateInZone("2020-03-29").getTime())).deepEquals([occurrence])("the 29th of march is in the map")
		})
		o("adding a progenitor while there are altered instances does not remove the altered instance", function () {
			const event = createEvent(getDateInZone("2023-07-13T13:00"), getDateInZone("2023-07-13T13:30"))
			event.summary = "summary"
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			repeatRule.excludedDates = [createTestEntity(DateWrapperTypeRef, { date: event.startTime })]
			event.repeatRule = repeatRule
			const alteredEvent = clone(event)
			alteredEvent._id = ["shortEvents", generateEventElementId(alteredEvent.startTime.getTime())]
			alteredEvent.repeatRule = null
			alteredEvent.recurrenceId = alteredEvent.startTime
			alteredEvent.summary = "another summary"

			addDaysForEventInstance(eventsForDays, alteredEvent, getMonthRange(getDateInZone("2023-07-01"), zone), zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2023-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2023-07-13").getTime())).deepEquals([alteredEvent])(
				"altered instance is on the day it occurs, but event is excluded",
			)
			const eventsOn14th = eventsForDays.get(getDateInZone("2023-07-14").getTime()) ?? []
			o(eventsOn14th.length).equals(1)("one event on 14th")
			o(eventsOn14th[0].summary).equals("summary")("occurrence of original series on 14th")
		})
	})
	o.spec("addDaysForEvent for long events", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("longer than a month", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.size).equals(3)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([])
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.size).equals(2 + 31)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).equals(undefined)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
		o("longer than a month all day", function () {
			// all-day event that has a last day on 2019-06-03
			const event = createEvent(getDateInUTC("2019-05-02"), getDateInUTC("2019-06-04"))
			// add for june
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), "Europe/Berlin")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])("there on the first")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([event])("also there on the 3rd")
			o(countDaysWithEvents(eventsForDays)).equals(3)("no more days added")

			// also add for may
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), "Europe/Berlin")
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			// previous entries + each day of may minus one (31 - 1)
			o(countDaysWithEvents(eventsForDays)).equals(3 + 30)
		})
		o("multiple months", function () {
			// event goes from april to june
			const event = createEvent(getDateInZone("2019-04-02T10:00"), getDateInZone("2019-06-02T12:00"))
			// first, only add for june
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])("there on the 1st")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([])("not there on the 3rd")
			o(eventsForDays.size).equals(3)("no more days added for this call")

			// now also add for may
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])("there on the 1st")
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])("there on the 31st")
			o(eventsForDays.size).equals(3 + 31)("added for each day of may but no more")

			// also add for april
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-04-01"), zone), zone)
			o(eventsForDays.size).equals(3 + 31 + 29)("now it's there for june, may, april")
			o(eventsForDays.get(getDateInZone("2019-04-01").getTime())).deepEquals(undefined)("1st of april is not touched")
			o(eventsForDays.get(getDateInZone("2019-04-02").getTime())).deepEquals([event])("2nd it's there")
			o(eventsForDays.get(getDateInZone("2019-04-03").getTime())).deepEquals([event])("3rd it's there")
		})

		o("longer than a month repeating", function () {
			const event = createEvent(new Date("2019-05-02T08:00:00.000Z"), new Date("2019-06-02T10:00:00.000Z"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			const startingInMay = cloneEventWithNewTime(event, getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const startingInJune = cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-07-03T12:00"))
			const startingInJuly = cloneEventWithNewTime(event, getDateInZone("2019-07-02T10:00"), getDateInZone("2019-08-02T12:00"))

			// invoke for june only
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(undefined)("nothing added for the 31st of may")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([startingInMay])("but may instance is still going on at start of june")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([startingInMay, startingInJune])
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(getDateInZone("2019-07-01").getTime())).deepEquals(undefined)("we're not caring about july")
			o(eventsForDays.size).equals(30)

			// now also invoke for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-01").getTime())).deepEquals([startingInJune])("june instance still going on")
			o(eventsForDays.get(getDateInZone("2019-07-03").getTime())).deepEquals([startingInJune, startingInJuly])("july instance added as well")
			o(eventsForDays.get(getDateInZone("2019-07-04").getTime())).deepEquals([startingInJuly])("june instance now ended.")
			o(eventsForDays.get(getDateInZone("2019-07-30").getTime())).deepEquals([startingInJuly])("only starting in july at end of july")
			o(eventsForDays.get(getDateInZone("2019-08-01").getTime())).deepEquals(undefined)("nothing in august")
			o(eventsForDays.size).equals(31 + 30) // previous plus all of july
		})
		o("add same event does not increase number of days with events", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			addDaysForEventInstance(eventsForDays, clone(event), getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)("days with events after adding june twice")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([]) // there's one empty day
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			addDaysForEventInstance(eventsForDays, clone(event), getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			// 2 in june plus everything in may except for the first (event starts on the 2nd)
			o(countDaysWithEvents(eventsForDays)).equals(32)("days with events after adding may twice")
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime()) == null).equals(true)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
	})
	o.spec("calendarEventHasMoreThanOneOccurrencesLeft", function () {
		o("event without end condition has more than one occurrence", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Never,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, { startTime: new Date(), endTime: new Date(), repeatRule }) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(true)
		})

		o("event without repeat rule has less than two occurrences", function () {
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date(),
				endTime: new Date(),
				repeatRule: null,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})

		o("event with higher count than exclusions+1 has more left", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-03T22:00:00Z") })],
				timeZone: zone,
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(true)
		})

		o("event with count and enough exclusions has less than two left", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-03T22:00:00Z") }),
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-04T22:00:00Z") }),
				],
				timeZone: zone,
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})

		o("event with count and enough exclusions has less than two left, first is excluded", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T22:00:00Z") }),
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-04T22:00:00Z") }),
				],
				timeZone: zone,
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})

		o("event with end date and enough exclusions has less than two left, first is excluded", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.UntilDate,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: String(
					DateTime.fromObject(
						{
							year: 2023,
							month: 3,
							day: 5,
						},
						{ zone },
					).toMillis(),
				),
				timeZone: zone,
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T22:00:00Z") }),
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-04T22:00:00Z") }),
				],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})

		o("event with end date and enough exclusions has more than two left, first is excluded", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.UntilDate,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: String(
					DateTime.fromObject(
						{
							year: 2023,
							month: 3,
							day: 6,
						},
						{ zone },
					).toMillis(),
				),
				timeZone: zone,
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T22:00:00Z") }),
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-04T22:00:00Z") }),
				],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(true)
		})

		o("event with end date and enough exclusions has more than two left, first is excluded", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.UntilDate,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: String(
					DateTime.fromObject(
						{
							year: 2023,
							month: 3,
							day: 8,
						},
						{ zone },
					).toMillis(),
				),
				timeZone: zone,
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T22:00:00Z") }),
					// 2023-03-03T22:00:00Z not excluded
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-04T22:00:00Z") }),
					createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-05T22:00:00Z") }),
					// 2023-03-06T22:00:00Z not excluded
					// 2023-03-07T22:00:00Z not excluded
				],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(
				calendarEventHasMoreThanOneOccurrencesLeft({
					progenitor,
					ownerGroup: "",
					alteredInstances: [{ recurrenceId: new Date("2023-03-05T22:00:00Z") } as CalendarEventAlteredInstance],
				}),
			).equals(true)
		})

		o("event with end date after 2 occurrences and an altered instance is considered to have more than one occurrence", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.UntilDate,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: getDateInUTC("2023-03-04").getTime().toString(),
				timeZone: zone,
				excludedDates: [
					createTestEntity(DateWrapperTypeRef, { date: getDateInZone("2023-03-02T22:00") }),
					// 2023-03-03T22:00:00Z not excluded
				],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: getDateInZone("2023-03-02T22:00"),
				endTime: getDateInZone("2023-03-02T23:00"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(
				calendarEventHasMoreThanOneOccurrencesLeft({
					progenitor,
					ownerGroup: "",
					alteredInstances: [{ recurrenceId: getDateInZone("2023-03-02T22:00") } as CalendarEventAlteredInstance],
				}),
			).equals(true)
		})

		o("event with exclusions that are not occurrences", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "2",
				endValue: "2",
				timeZone: zone,
				excludedDates: [createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-03T22:00:00Z") })],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(true)
		})

		o("event with one occurrence (count), no exclusions", function () {
			const repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "1",
				timeZone: zone,
				excludedDates: [],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})

		o("event with one occurrence (untilDate), no exclusions", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.UntilDate,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: String(
					DateTime.fromObject(
						{
							year: 2023,
							month: 3,
							day: 3,
						},
						{ zone },
					).toMillis(),
				),
				timeZone: zone,
				excludedDates: [],
			})
			const progenitor = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-02T22:00:00Z"),
				endTime: new Date("2023-03-02T23:00:00Z"),
				repeatRule,
			}) as CalendarEventProgenitor
			o(calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, ownerGroup: "", alteredInstances: [] })).equals(false)
		})
	})
	o.spec("getEventType", function () {
		let userController: UserController
		o.beforeEach(() => {
			const user = createTestEntity(UserTypeRef, { _id: "user-id" })
			const userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef, { groupSettings: [] })
			userController = makeUserController([], AccountType.PAID, undefined, false, false, user, userSettingsGroupRoot)
		})
		o("external gets EXTERNAL", function () {
			const event = {}
			const calendars: Map<string, CalendarInfo> = new Map()
			const ownMailAddresses = []
			replace(userController.user, "accountType", AccountType.EXTERNAL)
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.EXTERNAL)
		})

		o("if no ownergroup but organizer, gets OWN", function () {
			const event: Partial<CalendarEvent> = { organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "my@address.to", name: "my" }) }
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.OWN)
		})

		o("if no ownergroup and not organizer, gets INVITE", function () {
			const event: Partial<CalendarEvent> = { organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "no@address.to", name: "my" }) }
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.INVITE)
		})

		o("event in not any of our calendars gets SHARED_RO", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "no@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
			}
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.SHARED_RO)
		})

		o("event in rw-shared calendar w/o attendees gets SHARED_RW", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "no@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
			}
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: true,
				group: createTestEntity(GroupTypeRef, {
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "otherUser",
				}),
			})
			const ownMailAddresses = ["my@address.to"]
			replace(userController.user, "_id", ["userList", "userId"])
			replace(userController.user, "memberships", [
				createTestEntity(GroupMembershipTypeRef, {
					group: "calendarGroup",
					capability: ShareCapability.Write,
				}),
			])
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.SHARED_RW)
		})

		o("event in rw-shared calendar w attendees gets LOCKED", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "no@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, { address: "bla", name: "blabla" }),
					}),
				],
			}
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: true,
				group: createTestEntity(GroupTypeRef, {
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "otherUser",
				}),
			})
			const ownMailAddresses = ["my@address.to"]

			replace(userController.user, "_id", ["userList", "userId"])
			replace(userController.user, "memberships", [
				createTestEntity(GroupMembershipTypeRef, {
					group: "calendarGroup",
					capability: ShareCapability.Write,
				}),
			])
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.LOCKED)
		})

		o("event with ownergroup in own calendar where we're organizer gets OWN", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "my@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, { address: "bla", name: "blabla" }),
					}),
				],
			}
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: false,
				group: createTestEntity(GroupTypeRef, {
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "userId",
				}),
			})
			const ownMailAddresses = ["my@address.to"]
			replace(userController.user, "_id", ["userList", "userId"])
			o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.OWN)
		})
	})

	o("event with ownergroup in ro-shared calendar gets shared_ro", function () {
		const event: Partial<CalendarEvent> = {
			organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "no@address.to", name: "my" }),
			_ownerGroup: "ownergroup",
			attendees: [
				createTestEntity(CalendarEventAttendeeTypeRef, { address: createTestEntity(EncryptedMailAddressTypeRef, { address: "bla", name: "blabla" }) }),
			],
		}
		const calendars = new Map()
		calendars.set("ownergroup", {
			shared: true,
			group: createTestEntity(GroupTypeRef, {
				_id: "calendarGroup",
				type: GroupType.Calendar,
				user: "otherUser",
			}),
		})
		const ownMailAddresses = ["my@address.to"]
		const user = createTestEntity(UserTypeRef, {
			_id: "user-id",
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					group: "calendarGroup",
					capability: ShareCapability.Read,
				}),
			],
		})
		replace(user, "_id", ["userList", "userId"])
		const userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef, { groupSettings: [] })
		const userController = makeUserController([], AccountType.PAID, undefined, false, false, user, userSettingsGroupRoot)
		o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.SHARED_RO)
	})

	o("event with ownergroup in own calendar and a different organizer gets INVITE", function () {
		const event: Partial<CalendarEvent> = {
			organizer: createTestEntity(EncryptedMailAddressTypeRef, { address: "other@address.to", name: "other" }),
			_ownerGroup: "ownergroup",
			attendees: [
				createTestEntity(CalendarEventAttendeeTypeRef, { address: createTestEntity(EncryptedMailAddressTypeRef, { address: "bla", name: "blabla" }) }),
			],
		}
		const calendars = new Map()
		calendars.set("ownergroup", {
			shared: false,
			group: createTestEntity(GroupTypeRef, {
				_id: "calendarGroup",
				type: GroupType.Calendar,
				user: "userId",
			}),
		})
		const ownMailAddresses = ["my@address.to"]
		const user = createTestEntity(UserTypeRef, {
			_id: "user-id",
		})
		replace(user, "_id", ["userList", "userId"])
		const userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef, { groupSettings: [] })
		const userController = makeUserController([], AccountType.PAID, undefined, false, false, user, userSettingsGroupRoot)
		o(getEventType(event, calendars, ownMailAddresses, userController)).equals(EventType.INVITE)
	})

	o.spec("parseAlarmInterval", () => {
		o("accepts valid values", () => {
			o(parseAlarmInterval("1M")).deepEquals({ unit: AlarmIntervalUnit.MINUTE, value: 1 })
			o(parseAlarmInterval("10M")).deepEquals({ unit: AlarmIntervalUnit.MINUTE, value: 10 })
			o(parseAlarmInterval("42H")).deepEquals({ unit: AlarmIntervalUnit.HOUR, value: 42 })
			o(parseAlarmInterval("35D")).deepEquals({ unit: AlarmIntervalUnit.DAY, value: 35 })
			o(parseAlarmInterval("6W")).deepEquals({ unit: AlarmIntervalUnit.WEEK, value: 6 })
		})

		o("does not accept invalid values", () => {
			// it does accept values like "05M". should it tho?
			for (const value of ["-1M", "M", "3G", "3", "H5"]) {
				o(() => parseAlarmInterval(value)).throws(ParserError)(`Should throw on ${value}`)
			}
		})
	})

	o("serializeAlarmInterval", () => {
		o(serializeAlarmInterval({ value: 2, unit: AlarmIntervalUnit.MINUTE })).equals("2M")
		o(serializeAlarmInterval({ value: 2, unit: AlarmIntervalUnit.HOUR })).equals("2H")
		o(serializeAlarmInterval({ value: 35, unit: AlarmIntervalUnit.DAY })).equals("35D")
		o(serializeAlarmInterval({ value: 2, unit: AlarmIntervalUnit.WEEK })).equals("2W")
	})
})

function toCalendarString(calenderMonth: CalendarMonth) {
	return calenderMonth.weekdays.join(",") + "\n" + calenderMonth.weeks.map((w) => w.map((d) => d.day).join(",")).join("\n")
}

function iterateAlarmOccurrences(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	repeatPeriod: RepeatPeriod,
	interval: number,
	endType: EndType,
	endValue: number,
	exclusions: Array<Date>,
	alarmInterval: AlarmInterval,
	calculationZone: string,
	maxOccurrences: number,
): Date[] {
	const occurrences: Date[] = []

	while (occurrences.length < maxOccurrences) {
		const next: AlarmOccurrence = neverNull(
			findNextAlarmOccurrence(now, timeZone, eventStart, eventEnd, repeatPeriod, interval, endType, endValue, exclusions, alarmInterval, calculationZone),
		)

		if (next) {
			occurrences.push(next.alarmTime)
			now = new Date(next.eventTime.getTime())
		} else {
			break
		}
	}

	return occurrences
}

function createEvent(startTime: Date, endTime: Date): CalendarEvent {
	const event = createTestEntity(CalendarEventTypeRef)
	event.startTime = startTime // 1 May 8:00

	event.endTime = endTime
	event._id = ["listId", generateEventElementId(event.startTime.getTime())]
	return event
}

function countDaysWithEvents(eventsForDays: Map<number, Array<CalendarEvent>>) {
	return Array.from(eventsForDays).filter(([_, events]) => events.length).length
}

function cloneEventWithNewTime(event: CalendarEvent, startTime: Date, endTime: Date): CalendarEvent {
	const clonedEvent = clone(event)
	clonedEvent.startTime = startTime
	clonedEvent.endTime = endTime
	return clonedEvent
}
