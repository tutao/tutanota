// @flow
import o from "ospec"
import type {CalendarMonth} from "../../../src/calendar/date/CalendarUtils";
import {
	findNextAlarmOccurrence,
	getCalendarMonth,
	getStartOfWeek,
	getWeekNumber,

	prepareCalendarDescription
} from "../../../src/calendar/date/CalendarUtils"
import {lang} from "../../../src/misc/LanguageViewModel"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createUser} from "../../../src/api/entities/sys/User"
import type {AlarmIntervalEnum, EndTypeEnum, RepeatPeriodEnum} from "../../../src/api/common/TutanotaConstants"
import {AlarmInterval, EndType, GroupType, RepeatPeriod, ShareCapability} from "../../../src/api/common/TutanotaConstants"
import {parseTime, timeStringFromParts} from "../../../src/misc/Formatter";
import {DateTime} from "luxon"
import {getAllDayDateUTC} from "../../../src/api/common/utils/CommonCalendarUtils"
import {hasCapabilityOnGroup} from "../../../src/sharing/GroupUtils"

o.spec("calendar utils tests", function () {
	o.spec("getCalendarMonth", function () {
		o.before(function () {
			lang.init({})
			lang.setLanguage({code: "en", languageTag: "en"})
		})

		o("getCalendarMonth starting on sunday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 0, false))
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "26,27,28,29,30,31,1\n"
				+ "2,3,4,5,6,7,8\n"
				+ "9,10,11,12,13,14,15\n"
				+ "16,17,18,19,20,21,22\n"
				+ "23,24,25,26,27,28,29\n"
				+ "30,1,2,3,4,5,6")
		})

		o("getCalendarMonth starting on monday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "27,28,29,30,31,1,2\n"
				+ "3,4,5,6,7,8,9\n"
				+ "10,11,12,13,14,15,16\n"
				+ "17,18,19,20,21,22,23\n"
				+ "24,25,26,27,28,29,30\n"
				+ "1,2,3,4,5,6,7")
		})

		o("getCalendarMonth starting on saturday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12")
		})

		o("getCalendarMonth starting on sunday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 0, false)) // september
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12")
		})

		o("getCalendarMonth starting on monday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "26,27,28,29,30,31,1\n"
				+ "2,3,4,5,6,7,8\n"
				+ "9,10,11,12,13,14,15\n"
				+ "16,17,18,19,20,21,22\n"
				+ "23,24,25,26,27,28,29\n"
				+ "30,1,2,3,4,5,6")
		})

		o("getCalendarMonth starting on saturday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "31,1,2,3,4,5,6\n"
				+ "7,8,9,10,11,12,13\n"
				+ "14,15,16,17,18,19,20\n"
				+ "21,22,23,24,25,26,27\n"
				+ "28,29,30,1,2,3,4\n"
				+ "5,6,7,8,9,10,11")
		})


		o("getCalendarMonth starting on sunday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 0, false)) // july
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "30,1,2,3,4,5,6\n"
				+ "7,8,9,10,11,12,13\n"
				+ "14,15,16,17,18,19,20\n"
				+ "21,22,23,24,25,26,27\n"
				+ "28,29,30,31,1,2,3\n"
				+ "4,5,6,7,8,9,10")
		})

		o("getCalendarMonth starting on monday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,31,1,2,3,4\n"
				+ "5,6,7,8,9,10,11")
		})

		o("getCalendarMonth starting on saturday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12\n"
				+ "13,14,15,16,17,18,19\n"
				+ "20,21,22,23,24,25,26\n"
				+ "27,28,29,30,31,1,2\n"
				+ "3,4,5,6,7,8,9")
		})
	})

	o.spec("parseTimeTo", function () {
		o("parses full 24H time", function () {
			o(parseTime("12:45")).deepEquals({hours: 12, minutes: 45})
			o(parseTime("1245")).deepEquals({hours: 12, minutes: 45})
			o(parseTime("2359")).deepEquals({hours: 23, minutes: 59})
			o(parseTime("0000")).deepEquals({hours: 0, minutes: 0})
			o(parseTime("0623")).deepEquals({hours: 6, minutes: 23})
			o(parseTime("08:09")).deepEquals({hours: 8, minutes: 9})
		})

		o("parses partial 24H time", function () {
			o(parseTime("12")).deepEquals({hours: 12, minutes: 0})
			o(parseTime("1:2")).deepEquals({hours: 1, minutes: 2})
			o(parseTime("102")).deepEquals({hours: 1, minutes: 2})
			o(parseTime("17")).deepEquals({hours: 17, minutes: 0})
			o(parseTime("6")).deepEquals({hours: 6, minutes: 0})
			o(parseTime("955")).deepEquals({hours: 9, minutes: 55})
			o(parseTime("12:3")).deepEquals({hours: 12, minutes: 3})
			o(parseTime("809")).deepEquals({hours: 8, minutes: 9})
		})

		o("not parses incorrect time", function () {
			o(parseTime("12:3m")).deepEquals(null)
			o(parseTime("A:3")).deepEquals(null)
			o(parseTime("")).deepEquals(null)
			o(parseTime(":2")).deepEquals(null)
			o(parseTime("25:03")).deepEquals(null)
			o(parseTime("22:93")).deepEquals(null)
			o(parseTime("24")).deepEquals(null)
			o(parseTime("13pm")).deepEquals(null)
			o(parseTime("263PM")).deepEquals(null)
			o(parseTime("1403PM")).deepEquals(null)
			o(parseTime("14:03:33PM")).deepEquals(null)
			o(parseTime("9:37 acme")).deepEquals(null)
		})

		o("parses AM/PM time", function () {
			o(parseTime("7PM")).deepEquals({hours: 19, minutes: 0})
			o(parseTime("11PM")).deepEquals({hours: 23, minutes: 0})
			o(parseTime("12PM")).deepEquals({hours: 12, minutes: 0})
			o(parseTime("11:30PM")).deepEquals({hours: 23, minutes: 30})
			o(parseTime("12AM")).deepEquals({hours: 0, minutes: 0})
			o(parseTime("12:30AM")).deepEquals({hours: 0, minutes: 30})
			o(parseTime("3:30AM")).deepEquals({hours: 3, minutes: 30})
			o(parseTime("3:30PM")).deepEquals({hours: 15, minutes: 30})
			o(parseTime("9:37am")).deepEquals({hours: 9, minutes: 37})
			o(parseTime("1:59pm")).deepEquals({hours: 13, minutes: 59})
			o(parseTime("3:30 AM")).deepEquals({hours: 3, minutes: 30})
			o(parseTime("3:30 PM")).deepEquals({hours: 15, minutes: 30})
			o(parseTime("9:37 am")).deepEquals({hours: 9, minutes: 37})
			o(parseTime("1:59 pm")).deepEquals({hours: 13, minutes: 59})
			o(parseTime("9:37 a.m.")).deepEquals({hours: 9, minutes: 37})
			o(parseTime("1:59 p.m.")).deepEquals({hours: 13, minutes: 59})
			o(parseTime("1052 P.M.")).deepEquals({hours: 22, minutes: 52})
			o(parseTime("1052 A.M.")).deepEquals({hours: 10, minutes: 52})
			o(parseTime("948 P.M.")).deepEquals({hours: 21, minutes: 48})
			o(parseTime("948 A.M.")).deepEquals({hours: 9, minutes: 48})
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
		let user;
		let ownerUser;
		let group;
		let groupMembership;
		let groupOwnerMembership;
		o.before(function () {
			group = createGroup({_id: "g1", type: GroupType.Calendar, user: "groupOwner"})
			groupMembership = createGroupMembership({group: group._id})
			groupOwnerMembership = createGroupMembership({group: group._id})
			ownerUser = createUser({_id: "groupOwner", memberships: [groupOwnerMembership]})
			user = createUser({_id: "groupMember", memberships: [groupMembership]})
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
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path>"))
				.equals(`JoinBlahBlah<a href="https://the-link.com/path">https://the-link.com/path</a>`)
		})

		o("normal HTML link is not touched", function () {
			o(prepareCalendarDescription(`JoinBlahBlah<a href="https://the-link.com/path">a link</a>`))
				.equals(`JoinBlahBlah<a href="https://the-link.com/path">a link</a>`)
		})

		o("non-HTTP/HTTPS link is not allowed", function () {
			o(prepareCalendarDescription(`JoinBlahBlah<protocol://the-link.com/path>`))
				.equals(`JoinBlahBlah<protocol://the-link.com/path>`)
		})

		o("link with additional text is not allowed", function () {
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path and some other text>"))
				.equals(`JoinBlahBlah<https://the-link.com/path and some other text>`)
		})

		o("non-closed tag is not allowed", function () {
			o(prepareCalendarDescription("JoinBlahBlah<https://the-link.com/path and some other text"))
				.equals(`JoinBlahBlah<https://the-link.com/path and some other text`)
		})
	})

	o.spec("findNextAlarmOccurrence", function () {
		const timeZone = 'Europe/Berlin'
		o("weekly never ends", function () {
			const now = DateTime.fromObject({year: 2019, month: 5, day: 2, zone: timeZone}).toJSDate()
			const eventStart = DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 12, zone: timeZone}).toJSDate()
			const eventEnd = DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 14, zone: timeZone}).toJSDate()
			const occurrences = iterateAlarmOccurrences(now, timeZone, eventStart, eventEnd, RepeatPeriod.WEEKLY, 1, EndType.Never,
				0, AlarmInterval.ONE_HOUR, timeZone, 10)

			o(occurrences.slice(0, 4)).deepEquals([
				DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 9, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 16, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 23, hour: 11, zone: timeZone}).toJSDate()
			])
		})

		o("ends for all-day event correctly", function () {
			const repeatRuleTimeZone = "Asia/Anadyr" // +12

			const now = DateTime.fromObject({year: 2019, month: 5, day: 1, zone: timeZone}).toJSDate()
			// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
			const eventStart = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 2}).toJSDate())
			const eventEnd = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 3}).toJSDate())
			const repeatEnd = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 4}).toJSDate())
			const occurrences = iterateAlarmOccurrences(now, repeatRuleTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY, 1,
				EndType.UntilDate, repeatEnd.getTime(), AlarmInterval.ONE_DAY, timeZone, 10)

			o(occurrences).deepEquals([
				DateTime.fromObject({year: 2019, month: 5, day: 1, hour: 0, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 0, zone: timeZone}).toJSDate(),
			])
		})
	})
})

function toCalendarString(calenderMonth: CalendarMonth) {
	return calenderMonth.weekdays.join(",") + "\n"
		+ calenderMonth.weeks.map(w => w.map(d => d.day).join(",")).join("\n")
}

function iterateAlarmOccurrences(now: Date, timeZone: string, eventStart: Date, eventEnd: Date, repeatPeriod: RepeatPeriodEnum,
                                 interval: number, endType: EndTypeEnum, endValue: number, alarmInterval: AlarmIntervalEnum,
                                 calculationZone: string, maxOccurrences: number,
) {
	const occurrences = []
	while (occurrences.length < maxOccurrences) {
		const next = findNextAlarmOccurrence(now, timeZone, eventStart, eventEnd, repeatPeriod, interval, endType, endValue,
			alarmInterval, calculationZone)
		if (next) {
			occurrences.push(next.alarmTime)
			now = new Date(next.eventTime.getTime())
		} else {
			break
		}
	}
	return occurrences
}