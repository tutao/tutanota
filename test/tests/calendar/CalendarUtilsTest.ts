import o from "ospec"
import type { AlarmOccurrence, CalendarMonth } from "../../../src/calendar/date/CalendarUtils.js"
import {
	calendarEventHasMoreThanOneOccurrencesLeft,
	CalendarEventValidity,
	checkEventValidity,
	eventEndsBefore,
	eventStartsAfter,
	findNextAlarmOccurrence,
	getAllDayDateForTimezone,
	getAllDayDateUTCFromZone,
	getCalendarMonth,
	getDiffIn24hIntervals,
	getDiffIn60mIntervals,
	getEventType,
	getStartOfDayWithZone,
	getStartOfWeek,
	getTimeZone,
	getWeekNumber,
	isEventBetweenDays,
	prepareCalendarDescription,
} from "../../../src/calendar/date/CalendarUtils.js"
import { lang } from "../../../src/misc/LanguageViewModel.js"
import { createDateWrapper, createGroup, createGroupMembership, createUser, User } from "../../../src/api/entities/sys/TypeRefs.js"
import { AccountType, AlarmInterval, EndType, GroupType, RepeatPeriod, ShareCapability } from "../../../src/api/common/TutanotaConstants.js"
import { timeStringFromParts } from "../../../src/misc/Formatter.js"
import { DateTime } from "luxon"
import { getAllDayDateUTC } from "../../../src/api/common/utils/CommonCalendarUtils.js"
import { hasCapabilityOnGroup } from "../../../src/sharing/GroupUtils.js"
import type { CalendarEvent } from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarRepeatRule,
	createEncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import { identity, lastThrow, neverNull } from "@tutao/tutanota-utils"
import { Time } from "../../../src/calendar/date/Time.js"
import { EventType } from "../../../src/calendar/date/eventeditor/CalendarEventModel.js"
import { CalendarInfo } from "../../../src/calendar/model/CalendarModel.js"
import { object, replace } from "testdouble"

const zone = "Europe/Berlin"

o.spec("calendar utils tests", function () {
	function iso(strings: TemplateStringsArray, ...dates: number[]) {
		let result = ""

		dates.forEach((d, i) => {
			const s = strings[i]
			result += s
			result += `(${d}) ${DateTime.fromMillis(d).toISO({ format: "extended", includeOffset: true })}`
		})
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
			group = createGroup({
				_id: "g1",
				type: GroupType.Calendar,
				user: "groupOwner",
			})
			groupMembership = createGroupMembership({
				group: group._id,
			})
			groupOwnerMembership = createGroupMembership({
				group: group._id,
			})
			ownerUser = createUser({
				_id: "groupOwner",
				memberships: [groupOwnerMembership],
			})
			user = createUser({
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
				AlarmInterval.ONE_HOUR,
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
				AlarmInterval.ONE_DAY,
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
			return createCalendarEvent({
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
					createCalendarEvent({
						startTime: new Date("nan"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1991"),
						endTime: new Date("nan"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("nan"),
						endTime: new Date("nan"),
					}),
				),
			).equals(CalendarEventValidity.InvalidContainsInvalidDate)
		})
		o("events with start date not before end date are detected", function () {
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1990"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1990"),
						endTime: new Date("1980"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
		})
		o("events with date before 1970 are detected", function () {
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1969"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.InvalidPre1970)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1960"),
						endTime: new Date("1966"),
					}),
				),
			).equals(CalendarEventValidity.InvalidPre1970)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1970"),
						endTime: new Date("1966"),
					}),
				),
			).equals(CalendarEventValidity.InvalidEndBeforeStart)
		})
		o("valid events are detected", function () {
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1970"),
						endTime: new Date("1990"),
					}),
				),
			).equals(CalendarEventValidity.Valid)
			o(
				checkEventValidity(
					createCalendarEvent({
						startTime: new Date("1971"),
						endTime: new Date("2022"),
					}),
				),
			).equals(CalendarEventValidity.Valid)
		})
	})

	o.spec("calendarEventHasMoreThanOneOccurrencesLeft", function () {
		o("event without end condition has more than one occurrence", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Never,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
			})
			const event = createCalendarEvent({ startTime: new Date(), endTime: new Date(), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(true)
		})

		o("event without repeat rule has less than two occurrences", function () {
			const event = createCalendarEvent({ startTime: new Date(), endTime: new Date(), repeatRule: null })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
		})

		o("event with higher count than exclusions+1 has more left", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [createDateWrapper({ date: new Date("2023-03-03T22:00:00Z") })],
				timeZone: zone,
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(true)
		})

		o("event with count and enough exclusions has less than two left", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [createDateWrapper({ date: new Date("2023-03-03T22:00:00Z") }), createDateWrapper({ date: new Date("2023-03-04T22:00:00Z") })],
				timeZone: zone,
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
		})

		o("event with count and enough exclusions has less than two left, first is excluded", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "3",
				excludedDates: [createDateWrapper({ date: new Date("2023-03-02T22:00:00Z") }), createDateWrapper({ date: new Date("2023-03-04T22:00:00Z") })],
				timeZone: zone,
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
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
				excludedDates: [createDateWrapper({ date: new Date("2023-03-02T22:00:00Z") }), createDateWrapper({ date: new Date("2023-03-04T22:00:00Z") })],
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
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
				excludedDates: [createDateWrapper({ date: new Date("2023-03-02T22:00:00Z") }), createDateWrapper({ date: new Date("2023-03-04T22:00:00Z") })],
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(true)
		})

		o("event with exclusions that are not occurrences", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "2",
				endValue: "2",
				timeZone: zone,
				excludedDates: [createDateWrapper({ date: new Date("2023-03-03T22:00:00Z") })],
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(true)
		})

		o("event with one occurrence (count), no exclusions", function () {
			const repeatRule = createCalendarRepeatRule({
				endType: EndType.Count,
				frequency: RepeatPeriod.DAILY,
				interval: "1",
				endValue: "1",
				timeZone: zone,
				excludedDates: [],
			})
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
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
			const event = createCalendarEvent({ startTime: new Date("2023-03-02T22:00:00Z"), endTime: new Date("2023-03-02T23:00:00Z"), repeatRule })
			o(calendarEventHasMoreThanOneOccurrencesLeft(event)).equals(false)
		})
	})
	o.spec("getEventType", function () {
		o("external gets EXTERNAL", function () {
			const event = {}
			const calendars: Map<string, CalendarInfo> = new Map()
			const ownMailAddresses = []
			const user: User = object()
			user.accountType = AccountType.EXTERNAL
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.EXTERNAL)
		})

		o("if no ownergroup but organizer, gets OWN", function () {
			const event: Partial<CalendarEvent> = { organizer: createEncryptedMailAddress({ address: "my@address.to", name: "my" }) }
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.OWN)
		})

		o("if no ownergroup and not organizer, gets INVITE", function () {
			const event: Partial<CalendarEvent> = { organizer: createEncryptedMailAddress({ address: "no@address.to", name: "my" }) }
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.INVITE)
		})

		o("event in not any of our calendars gets SHARED_RO", function () {
			const event: Partial<CalendarEvent> = { organizer: createEncryptedMailAddress({ address: "no@address.to", name: "my" }), _ownerGroup: "ownergroup" }
			const calendars = new Map()
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.SHARED_RO)
		})

		o("event in rw-shared calendar w/o attendees gets SHARED_RW", function () {
			const event: Partial<CalendarEvent> = { organizer: createEncryptedMailAddress({ address: "no@address.to", name: "my" }), _ownerGroup: "ownergroup" }
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: true,
				group: createGroup({
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "otherUser",
				}),
			})
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			user.memberships = [
				createGroupMembership({
					group: "calendarGroup",
					capability: ShareCapability.Write,
				}),
			]
			replace(user, "_id", ["userList", "userId"])
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.SHARED_RW)
		})

		o("event in rw-shared calendar w attendees gets LOCKED", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createEncryptedMailAddress({ address: "no@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
				attendees: [createCalendarEventAttendee({ address: createEncryptedMailAddress({ address: "bla", name: "blabla" }) })],
			}
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: true,
				group: createGroup({
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "otherUser",
				}),
			})
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			user.memberships = [
				createGroupMembership({
					group: "calendarGroup",
					capability: ShareCapability.Write,
				}),
			]
			replace(user, "_id", ["userList", "userId"])
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.LOCKED)
		})

		o("event with ownergroup in own calendar where we're organizer gets OWN", function () {
			const event: Partial<CalendarEvent> = {
				organizer: createEncryptedMailAddress({ address: "my@address.to", name: "my" }),
				_ownerGroup: "ownergroup",
				attendees: [createCalendarEventAttendee({ address: createEncryptedMailAddress({ address: "bla", name: "blabla" }) })],
			}
			const calendars = new Map()
			calendars.set("ownergroup", {
				shared: false,
				group: createGroup({
					_id: "calendarGroup",
					type: GroupType.Calendar,
					user: "userId",
				}),
			})
			const ownMailAddresses = ["my@address.to"]
			const user: User = object()
			user.accountType = AccountType.PAID
			user.memberships = []
			replace(user, "_id", ["userList", "userId"])
			o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.OWN)
		})
	})

	o("event with ownergroup in ro-shared calendar gets shared_ro", function () {
		const event: Partial<CalendarEvent> = {
			organizer: createEncryptedMailAddress({ address: "no@address.to", name: "my" }),
			_ownerGroup: "ownergroup",
			attendees: [createCalendarEventAttendee({ address: createEncryptedMailAddress({ address: "bla", name: "blabla" }) })],
		}
		const calendars = new Map()
		calendars.set("ownergroup", {
			shared: true,
			group: createGroup({
				_id: "calendarGroup",
				type: GroupType.Calendar,
				user: "otherUser",
			}),
		})
		const ownMailAddresses = ["my@address.to"]
		const user: User = object()
		user.accountType = AccountType.PAID
		user.memberships = [
			createGroupMembership({
				group: "calendarGroup",
				capability: ShareCapability.Read,
			}),
		]
		replace(user, "_id", ["userList", "userId"])
		o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.SHARED_RO)
	})

	o("event with ownergroup in own calendar and a different organizer gets INVITE", function () {
		const event: Partial<CalendarEvent> = {
			organizer: createEncryptedMailAddress({ address: "other@address.to", name: "other" }),
			_ownerGroup: "ownergroup",
			attendees: [createCalendarEventAttendee({ address: createEncryptedMailAddress({ address: "bla", name: "blabla" }) })],
		}
		const calendars = new Map()
		calendars.set("ownergroup", {
			shared: false,
			group: createGroup({
				_id: "calendarGroup",
				type: GroupType.Calendar,
				user: "userId",
			}),
		})
		const ownMailAddresses = ["my@address.to"]
		const user: User = object()
		user.accountType = AccountType.PAID
		user.memberships = []
		replace(user, "_id", ["userList", "userId"])
		o(getEventType(event, calendars, ownMailAddresses, user)).equals(EventType.INVITE)
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
