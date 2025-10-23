import {
	assert,
	clone,
	decodeBase64,
	deepEqual,
	downcast,
	filterInt,
	findAllAndRemove,
	freezeMap,
	getFirstOrThrow,
	getFromMap,
	getStartOfDay,
	incrementDate,
	insertIntoSortedArray,
	isNotEmpty,
	isNotNull,
	isSameDayOfDate,
	isValidDate,
	memoized,
	neverNull,
	TIMESTAMP_ZERO_YEAR,
} from "@tutao/tutanota-utils"
import { BIRTHDAY_CALENDAR_BASE_ID, EndType, EventTextTimeOption, RepeatPeriod, TimeFormat } from "../../api/common/TutanotaConstants"
import { DateTime, DurationLikeObject, FixedOffsetZone, IANAZone, MonthNumbers, WeekdayNumbers } from "luxon"
import {
	AdvancedRepeatRule,
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarRepeatRule,
	createCalendarEvent,
	createCalendarRepeatRule,
	GroupSettings,
	UserSettingsGroupRoot,
} from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventTimes, DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent, isAllDayEventByTimes } from "../../api/common/utils/CommonCalendarUtils"
import { CalendarAdvancedRepeatRule, createDateWrapper, DateWrapper, RepeatRule, User } from "../../api/entities/sys/TypeRefs.js"
import { isSameId, StrippedEntity } from "../../api/common/utils/EntityUtils"
import { Time } from "./Time.js"
import { CalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel"
import { DateProvider } from "../../api/common/DateProvider"
import { EntityClient } from "../../api/common/EntityClient.js"
import { CalendarEventUidIndexEntry } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { LoginController } from "../../api/main/LoginController.js"
import { BirthdayEventRegistry } from "./CalendarEventsRepository.js"
import type { TranslationKey } from "../../misc/LanguageViewModel.js"
import { isoDateToBirthday } from "../../api/common/utils/BirthdayUtils"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"

export type CalendarTimeRange = {
	start: number
	end: number
}

export function eventStartsBefore(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventStart(event, zone).getTime() < currentDate.getTime()
}

export function eventEndsBefore(date: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() < date.getTime()
}

export function eventStartsAfter(date: Date, zone: string, event: CalendarEvent): boolean {
	return getEventStart(event, zone).getTime() > date.getTime()
}

export function eventEndsAfterDay(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() > getStartOfNextDayWithZone(currentDate, zone).getTime()
}

export function eventEndsAfterOrOn(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() >= getStartOfNextDayWithZone(currentDate, zone).getTime()
}

export function generateUid(groupId: Id, timestamp: number): string {
	return `${groupId}${timestamp}@tuta.com`
}

export function isBirthdayEvent(uid?: string | null) {
	return uid?.includes(BIRTHDAY_CALENDAR_BASE_ID) ?? false
}

/** get the timestamps of the start date and end date of the month the given date is in. */
export function getMonthRange(date: Date, zone: string): CalendarTimeRange {
	const startDateTime = DateTime.fromJSDate(date, {
		zone,
	}).set({
		day: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
	})
	const start = startDateTime.toJSDate().getTime()
	const end = startDateTime
		.plus({
			month: 1,
		})
		.toJSDate()
		.getTime()
	return {
		start,
		end,
	}
}

export function getDayRange(date: Date, zone: string): CalendarTimeRange {
	const startDateTime = DateTime.fromJSDate(date, {
		zone,
	}).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
	})
	const start = startDateTime.toJSDate().getTime()
	const end = startDateTime
		.plus({
			day: 1,
		})
		.toJSDate()
		.getTime()
	return {
		start,
		end,
	}
}

/**
 * @param date a date object representing a calendar date (like 1st of May 2023 15:15) in {@param zone}
 * @param zone the time zone to calculate which calendar date {@param date} represents.
 * @returns a date object representing the beginning of the given day in local time, like 1st of May 2023 00:00)
 */
export function getStartOfDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate()
}

/** @param date a date object representing some time on some calendar date (like 1st of May 2023) in {@param zone}
 * @param zone the time zone for which to calculate the calendar date that {@param date} represents
 * @returns a date object representing the start of the next calendar date (2nd of May 2023 00:00) in {@param zone} */
export function getStartOfNextDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone })
		.set({
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
		})
		.plus({ day: 1 })
		.toJSDate()
}

export function getEndOfDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).toJSDate()
}

export function calculateAlarmTime(date: Date, interval: AlarmInterval, ianaTimeZone?: string): Date {
	const diff = alarmIntervalToLuxonDurationLikeObject(interval)

	return DateTime.fromJSDate(date, {
		zone: ianaTimeZone,
	})
		.minus(diff)
		.toJSDate()
}

/** takes a date which encodes the day in UTC and produces a date that encodes the same date but in local time zone. All times must be 0. */
export function getAllDayDateForTimezone(utcDate: Date, zone: string): Date {
	return DateTime.fromJSDate(utcDate, { zone: "utc" })
		.setZone(zone, { keepLocalTime: true })
		.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
		.toJSDate()
}

/**
 * Objecting representing Luxon's DateTime values for {@link WeekdayNumbers}
 */
const DATETIME_WEEKDAY = {
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6,
	SU: 7,
} as Record<string, WeekdayNumbers>

function expandByDayRuleForWeeklyEvents(
	targetWeekDay: WeekdayNumbers | null | undefined,
	baseDate: DateTime,
	wkst: WeekdayNumbers,
	validMonths: number[],
	newDates: DateTime[],
) {
	// BYMONTH => BYDAY(expand)
	if (!targetWeekDay) {
		return
	}

	// Go back to week start, so we don't miss any events
	let intervalStart = clone(baseDate)
	while (intervalStart.weekday !== wkst) {
		intervalStart = intervalStart.minus({ day: 1 })
	}

	// Move forward until we reach the target day
	let newPotentialDate = clone(intervalStart)
	while (newPotentialDate.weekday !== targetWeekDay) {
		newPotentialDate = newPotentialDate.plus({ day: 1 })
	}
	if (newPotentialDate.toMillis() >= intervalStart.plus({ week: 1 }).toMillis()) {
		// The event is actually next week, so discard
		return
	}

	// Calculate next event to avoid creating events too ahead in the future
	const nextEvent = baseDate.plus({ week: 1 }).toMillis()
	if (
		newPotentialDate.toMillis() >= nextEvent ||
		(wkst !== DATETIME_WEEKDAY.MO && newPotentialDate.toMillis() >= intervalStart.plus({ weeks: 1 }).toMillis())
	) {
		// We calculated an event after the first event of this expansion, or the calculated event happens on the next interval week
		return
	}

	if (validMonths.length === 0 || validMonths.includes(newPotentialDate.month)) {
		newDates.push(newPotentialDate)
	}
}

function expandByDayRuleForMonthlyEvents(
	targetWeekDay: WeekdayNumbers | null | undefined,
	leadingValue: number | null,
	date: DateTime,
	monthDays: number[] | undefined,
	newDates: DateTime[],
	validMonths: number[],
) {
	if (!targetWeekDay) {
		return
	}

	const allowedDays: number[] = []
	const weekChange = leadingValue ?? 0
	const stopCondition = date.plus({ month: 1 }).set({ day: 1 })
	const baseDate = date.set({ day: 1 })

	// Calculate allowed days parsing negative values
	// to valid days in the month. e.g -1 to 31 in JAN
	for (const allowedDay of monthDays ?? []) {
		if (allowedDay > 0) {
			allowedDays.push(allowedDay)
			continue
		}

		const day = baseDate.daysInMonth! - Math.abs(allowedDay) + 1
		allowedDays.push(day)
	}

	// Simply checks if there's a list with allowed day and check if it includes a given day
	const isAllowedInMonthDayRule = (day: number) => {
		return allowedDays.length === 0 ? true : allowedDays.includes(day)
	}

	// If there's a leading value in the rule we have to change the week.
	// e.g. 2TH means second thursday, consequently, second week of the month
	if (weekChange !== 0) {
		let dt = baseDate

		// Check for negative week changes e.g -1TH last thursday
		if (weekChange < 0) {
			dt = dt.set({ day: dt.daysInMonth })

			let weeksToChange = Math.abs(weekChange)
			while (weeksToChange > 0) {
				if (dt.weekday === targetWeekDay) {
					weeksToChange -= 1
				}

				if (weeksToChange === 0) {
					break
				}

				dt = dt.minus({ day: 1 })
			}

			if (dt.month !== baseDate.month) {
				return
			}
		} else {
			while (dt.weekday !== targetWeekDay) {
				dt = dt.plus({ day: 1 })
			}
			dt = dt.plus({ week: weekChange - 1 })
		}

		if (dt.toMillis() >= baseDate.toMillis() && dt.toMillis() < stopCondition.toMillis() && isAllowedInMonthDayRule(dt.day)) {
			newDates.push(dt)
		}
	} else {
		// If there's no week change, just iterate to the target day
		let currentDate = baseDate
		while (currentDate < stopCondition) {
			const dt = currentDate.set({ weekday: targetWeekDay })
			if (dt.toMillis() >= baseDate.toMillis() && isAllowedInMonthDayRule(dt.day)) {
				if (validMonths.length > 0 && validMonths.includes(dt.month)) {
					newDates.push(dt)
				} else if (validMonths.length === 0) {
					newDates.push(dt)
				}
			}
			currentDate = dt.plus({ week: 1 })
		}
	}
}

function expandByDayRuleForAnnuallyEvents(
	leadingValue: number | null,
	hasWeekNo: boolean | undefined,
	targetWeekDay: any,
	date: DateTime,
	newDates: DateTime[],
	wkst: WeekdayNumbers,
	hasByMonthRule: boolean | undefined,
) {
	const weekChangeValue = leadingValue ?? 0
	if (hasWeekNo && weekChangeValue !== 0) {
		console.warn("Invalid repeat rule, can't use BYWEEKNO with Week Offset on BYDAY")
		return
	}

	if (weekChangeValue !== 0 && !hasWeekNo) {
		// If there's no target week day, we just set the day of the year.
		if (!targetWeekDay) {
			let dt: DateTime
			if (weekChangeValue > 0) {
				dt = date.set({ day: 1, month: 1 }).plus({ day: weekChangeValue - 1 })
			} else {
				dt = date.set({ day: 31, month: 12 }).minus({ day: Math.abs(weekChangeValue) - 1 })
			}

			// The event is in the past so it should be moved to next year
			if (dt.toMillis() < date.toMillis()) {
				newDates.push(dt.plus({ year: 1 }))
			} else {
				newDates.push(dt)
			}
		} else {
			// There's a target week day so the weekChangeValue indicates the week of the year
			// that the event will happen
			let dt = date
			if (!hasByMonthRule) {
				if (weekChangeValue > 0) {
					dt = date.set({ day: 1, month: 1 }).plus({ week: weekChangeValue - 1 })

					while (date.weekday !== targetWeekDay) {
						dt = dt.plus({ day: 1 })
					}
				} else {
					dt = date.set({ day: 31, month: 12 }).minus({ week: weekChangeValue - 1 })

					while (date.weekday !== targetWeekDay) {
						dt = dt.minus({ day: 1 })
					}
				}
			} else {
				// There's a target week day and a byMonthRule so the weekChangeValue indicates the week within the month
				const absWeeks = weekChangeValue > 0 ? weekChangeValue : Math.ceil(date.daysInMonth! / 7) - Math.abs(weekChangeValue) + 1

				dt = date.set({ day: 1 })
				let weekCount = dt.weekday === targetWeekDay ? 1 : 0

				while (weekCount < absWeeks) {
					dt = dt.plus({ day: 1 })
					if (dt.weekday === targetWeekDay) {
						weekCount++
					}
				}
			}

			newDates.push(dt)
		}
	} else if (hasWeekNo) {
		if (!targetWeekDay) {
			return
		}
		const dt = date.set({ weekday: targetWeekDay })
		const intervalStart = date.set({ weekday: wkst })
		if (dt.toMillis() > intervalStart.plus({ week: 1 }).toMillis() || dt.toMillis() < date.toMillis()) {
			// Too ahead in the future or before progenitor
		} else if (dt.toMillis() < intervalStart.toMillis()) {
			newDates.push(intervalStart.plus({ week: 1 }))
		} else {
			newDates.push(dt)
		}
	} else if (!hasWeekNo && weekChangeValue === 0) {
		// There's no week number or occurrenceNumber, so it will happen on all
		// weekdays that are the same as targetWeekDay
		if (!targetWeekDay) {
			return
		}

		const stopCondition = date.set({ day: 1 }).plus({ year: 1 })
		let currentDate = date.set({ day: 1, weekday: targetWeekDay })

		if (currentDate.toMillis() >= date.set({ day: 1 }).toMillis()) {
			newDates.push(currentDate)
		}

		currentDate = currentDate.plus({ week: 1 })

		while (currentDate.toMillis() < stopCondition.toMillis()) {
			newDates.push(currentDate)
			currentDate = currentDate.plus({ week: 1 })
		}
	}
}

function applyByDayRules(
	dates: DateTime[],
	parsedRules: CalendarAdvancedRepeatRule[],
	frequency: RepeatPeriod,
	validMonths: number[],
	wkst: WeekdayNumbers,
	hasWeekNo?: boolean,
	monthDays?: number[],
	yearDays?: number[],
	hasByMonthRules?: boolean,
) {
	if (parsedRules.length === 0) {
		return dates
	}

	// Gets the nth number and the day of the week for a given rule value
	// e.g. 312TH would return ["312TH", "312", "TH"]
	const ruleRegex = /^([-+]?\d{0,3})([a-zA-Z]{2})?$/g

	const newDates: DateTime[] = []
	for (const rule of parsedRules) {
		for (const date of dates) {
			if (!date.isValid) {
				console.warn("Invalid date", date)
				continue
			}
			const parsedRuleValue = Array.from(rule.interval.matchAll(ruleRegex)).flat()

			if (!parsedRuleValue) {
				console.error(`Invalid interval ${rule.interval}`)
				continue
			}

			const targetWeekDay = parsedRuleValue[2] !== "" ? DATETIME_WEEKDAY[parsedRuleValue[2]] : null
			const leadingValue = parsedRuleValue[1] !== "" ? Number.parseInt(parsedRuleValue[1]) : null

			if (frequency === RepeatPeriod.DAILY) {
				// Only filters weekdays that don't match the rule
				if (date.weekday !== targetWeekDay) {
					continue
				}
				newDates.push(date)
			} else if (frequency === RepeatPeriod.WEEKLY) {
				expandByDayRuleForWeeklyEvents(targetWeekDay, date, wkst, validMonths, newDates)
			} else if (frequency === RepeatPeriod.MONTHLY) {
				expandByDayRuleForMonthlyEvents(targetWeekDay, leadingValue, date, monthDays, newDates, validMonths)
			} else if (frequency === RepeatPeriod.ANNUALLY) {
				expandByDayRuleForAnnuallyEvents(leadingValue, hasWeekNo, targetWeekDay, date, newDates, wkst, hasByMonthRules)
			}
		}
	}

	if (frequency === RepeatPeriod.ANNUALLY) {
		const getValidDaysInYear = memoized((year: number): number[] => {
			const daysInYear = DateTime.fromObject({ year, month: 1, day: 1 }).daysInYear
			const allowedDays: number[] = []
			for (const allowedDay of yearDays ?? []) {
				if (allowedDay > 0) {
					allowedDays.push(allowedDay)
					continue
				}

				const day = daysInYear - Math.abs(allowedDay) + 1
				allowedDays.push(day)
			}

			return allowedDays
		})

		const convertDateToDayOfYear = memoized((date: Date) => {
			return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000
		})

		const isValidDay = (date: DateTime) => {
			const validDays = getValidDaysInYear(date.year)

			if (validDays.length === 0) {
				return true
			}

			const dayInYear = convertDateToDayOfYear(date.toJSDate())

			return validDays.includes(dayInYear)
		}

		return newDates.filter((date) => isValidDay(date))
	}

	return newDates
}

function applyByMonth(dates: DateTime[], parsedRules: CalendarAdvancedRepeatRule[], repeatPeriod: RepeatPeriod) {
	if (parsedRules.length === 0) {
		return dates
	}

	const newDates: DateTime[] = []
	for (const rule of parsedRules) {
		for (const date of dates) {
			if (!date.isValid) {
				console.warn("Invalid date", date)
				continue
			}

			const targetMonth = Number.parseInt(rule.interval)

			if (repeatPeriod === RepeatPeriod.WEEKLY) {
				const weekStart = date.set({ weekday: 1 })
				const weekEnd = date.set({ weekday: 7 })

				if (weekStart.year === weekEnd.year && weekStart.month < weekEnd.month && (weekEnd.month === targetMonth || weekStart.month === targetMonth)) {
					newDates.push(date)
					continue
				} else if (weekStart.year < weekEnd.year && (weekEnd.month === targetMonth || weekStart.month === targetMonth)) {
					newDates.push(date)
					continue
				}
			} else if (repeatPeriod === RepeatPeriod.ANNUALLY) {
				const dt = date.set({ month: targetMonth })
				const yearOffset: number = date.year === dt.year && date.month > dt.month ? 1 : 0

				newDates.push(dt.plus({ year: yearOffset }))
				continue
			}

			if (date.month === targetMonth) {
				newDates.push(date)
			}
		}
	}

	return newDates
}

function applyByMonthDay(dates: DateTime[], parsedRules: CalendarAdvancedRepeatRule[], isDailyEvent: boolean = false) {
	if (parsedRules.length === 0) {
		return dates
	}

	const newDates: DateTime[] = []
	for (const rule of parsedRules) {
		for (const date of dates) {
			if (!date.isValid) {
				console.warn("Invalid event date", date)
				continue
			}
			const targetDay = Number.parseInt(rule.interval)

			if (Number.isNaN(targetDay)) {
				console.warn("Invalid BYMONTHDAY rule for date", date)
				continue
			}

			if (isDailyEvent) {
				if (targetDay > 0 && date.day === targetDay) {
					newDates.push(date)
				} else if (targetDay < 0) {
					const daysDiff = date.daysInMonth! - Math.abs(targetDay) + 1

					if (daysDiff > 0 && daysDiff === date.day) {
						newDates.push(date)
					}
				}
			} else {
				// Monthly or Yearly
				if (targetDay >= 0) {
					const dt = date.set({ day: targetDay })
					if (targetDay <= date.daysInMonth!) {
						newDates.push(dt)
					}
					continue
				}

				const daysDiff = date.daysInMonth! - Math.abs(targetDay) + 1
				if (daysDiff > 0) {
					const dt = date.set({ day: daysDiff })
					if (daysDiff <= date.daysInMonth!) {
						newDates.push(dt)
					}
				}
			}
		}
	}

	return newDates
}

function applyWeekNo(dates: DateTime[], parsedRules: CalendarAdvancedRepeatRule[], wkst: WeekdayNumbers): DateTime[] {
	if (parsedRules.length === 0) {
		return dates
	}

	const newDates: DateTime[] = []
	for (const rule of parsedRules) {
		for (const date of dates) {
			if (!date.isValid) {
				console.warn("Invalid date", date)
				continue
			}

			const parsedWeekNumber = Number.parseInt(rule.interval)
			let newDt: DateTime = date
			let weekNumber
			if (parsedWeekNumber < 0) {
				weekNumber = date.weeksInWeekYear - Math.abs(parsedWeekNumber) + 1
				// I don't get why when I don't set this here it doesn't work for only YEARLY!!!
				// But if I set here and re-set the week later, it works????
				// Also, it starts expanding for next week when the offset is -50?
				// Is that a problem for negative only?
				// newDt = date.set({ weekNumber: date.weeksInWeekYear - Math.abs(parsedWeekNumber) + 1 })
			} else {
				newDt = date.set({ weekNumber: parsedWeekNumber })
				weekNumber = parsedWeekNumber
			}

			const yearOffset = newDt.toMillis() < date.toMillis() ? 1 : 0
			newDt = newDt.plus({ year: yearOffset }).set({ weekNumber }).set({ weekday: wkst })
			for (let i = 0; i < 7; i++) {
				const finalDate = newDt.plus({ day: i })
				if (finalDate.year > newDt.year) {
					break
				}
				newDates.push(finalDate)
			}
		}
	}

	return newDates
}

function applyYearDay(dates: DateTime[], parsedRules: CalendarAdvancedRepeatRule[], evaluateSameWeek: boolean, evaluateSameMonth: boolean) {
	if (parsedRules.length === 0) {
		return dates
	}

	const newDates: DateTime[] = []
	for (const rule of parsedRules) {
		for (const date of dates) {
			if (!date.isValid) {
				console.warn("Invalid date", date)
				continue
			}

			const targetDay = Number.parseInt(rule.interval)

			let dt: DateTime
			if (targetDay < 0) {
				dt = date.set({ day: 31, month: 12 }).minus({ day: Math.abs(targetDay) - 1 })
			} else {
				dt = date.set({ day: 1, month: 1 }).plus({ day: targetDay - 1 })
			}

			const yearOffset = dt.toMillis() < date.toMillis() ? 1 : 0
			dt = dt.plus({ year: yearOffset })

			if ((evaluateSameWeek && date.weekNumber !== dt.weekNumber) || (evaluateSameMonth && date.month !== dt.month)) {
				continue
			}

			newDates.push(dt)
		}
	}

	return newDates
}

/*
 * Order generated events by date, avoiding an early stop and filter out events that doesn't respect BYMONTH rule
 * @param dates Generated DateTime objects from BYRULEs
 * @param validMonths List of months allowed by BYMONTH rules, should be empty in case no BYMONTH is specified
 */
function finishByRules(dates: DateTime[], validMonths: MonthNumbers[], progenitorStartDate?: Date) {
	let cleanDates = validMonths.length > 0 ? dates.filter((dt) => validMonths.includes(dt.month as MonthNumbers)) : dates

	if (progenitorStartDate) {
		cleanDates = cleanDates.filter((dt) => dt.toMillis() >= progenitorStartDate.getTime())
	}

	return cleanDates.sort((a, b) => a.toMillis() - b.toMillis())
}

export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriod, interval: number, ianaTimeZone: string): Date {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					days: interval,
				})
				.toJSDate()

		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					weeks: interval,
				})
				.toJSDate()

		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					months: interval,
				})
				.toJSDate()

		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					years: interval,
				})
				.toJSDate()

		default:
			throw new Error("Unknown repeat period")
	}
}

export function getValidTimeZone(zone: string, fallback?: string): string {
	if (IANAZone.isValidZone(zone)) {
		return zone
	} else {
		if (fallback && IANAZone.isValidZone(fallback)) {
			console.warn(`Time zone ${zone} is not valid, falling back to ${fallback}`)
			return fallback
		} else {
			const actualFallback = FixedOffsetZone.instance(new Date().getTimezoneOffset()).name
			console.warn(`Fallback time zone ${zone} is not valid, falling back to ${actualFallback}`)
			return actualFallback
		}
	}
}

export function getTimeZone(): string {
	return DateTime.local().zoneName
}

export class DefaultDateProvider implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		return getTimeZone()
	}
}

export function createRepeatRuleWithValues(frequency: RepeatPeriod, interval: number, timeZone: string = getTimeZone()): CalendarRepeatRule {
	return createCalendarRepeatRule({
		timeZone: timeZone,
		frequency: frequency,
		interval: String(interval),
		endValue: null,
		endType: "0",
		excludedDates: [],
		advancedRules: [],
	})
}

/**
 * difference in whole 24-hour-intervals between two dates, not anticommutative.
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffIn24hIntervals(a: Date, b: Date, zone?: string): number {
	return Math.floor(DateTime.fromJSDate(b, { zone }).diff(DateTime.fromJSDate(a, { zone }), "day").days)
}

/**
 * difference in whole 60 minute intervals between two dates
 * result is 0 if the diff is less than 60 minutes, otherwise
 * positive if b is after a, otherwise negative.
 *
 * not anticommutative.
 */
export function getDiffIn60mIntervals(a: Date, b: Date): number {
	return Math.floor(DateTime.fromJSDate(b).diff(DateTime.fromJSDate(a), "hours").hours)
}

export function getStartOfWeek(date: Date, firstDayOfWeekFromOffset: number): Date {
	let firstDay

	if (firstDayOfWeekFromOffset > date.getDay()) {
		firstDay = date.getDay() + 7 - firstDayOfWeekFromOffset
	} else {
		firstDay = date.getDay() - firstDayOfWeekFromOffset
	}

	return incrementDate(getStartOfDay(date), -firstDay)
}

export function getRangeOfDays(startDay: Date, numDays: number): Array<Date> {
	let calculationDate = startDay
	const days: Date[] = []

	for (let i = 0; i < numDays; i++) {
		days.push(calculationDate)
		calculationDate = incrementDate(new Date(calculationDate), 1)
	}

	return days
}

export function getTimeFormatForUser(userSettingsGroupRoot: UserSettingsGroupRoot): TimeFormat {
	// it's saved as a string, but is a const enum.
	return userSettingsGroupRoot.timeFormat as TimeFormat
}

export function getWeekNumber(startOfTheWeek: Date): number {
	// Currently it doesn't support US-based week numbering system with partial weeks.
	return DateTime.fromJSDate(startOfTheWeek).weekNumber
}

export function getEventEnd(event: CalendarEventTimes, timeZone: string): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateForTimezone(event.endTime, timeZone)
	} else {
		return event.endTime
	}
}

export function getEventStart({ startTime, endTime }: CalendarEventTimes, timeZone: string): Date {
	return getEventStartByTimes(startTime, endTime, timeZone)
}

export function getEventStartByTimes(startTime: Date, endTime: Date, timeZone: string): Date {
	if (isAllDayEventByTimes(startTime, endTime)) {
		return getAllDayDateForTimezone(startTime, timeZone)
	} else {
		return startTime
	}
}

/** @param date encodes some calendar date in {@param zone} (like the 1st of May 2023)
 * @returns {Date} encodes the same calendar date in UTC */
export function getAllDayDateUTCFromZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone })
		.setZone("utc", { keepLocalTime: true })
		.set({
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
		})
		.toJSDate()
}

export function isLongEvent(event: CalendarEvent, zone: string): boolean {
	// long events are longer than the event ID randomization range. we need to distinguish them
	// to be able to still load and display the ones overlapping the query range even though their
	// id might not be contained in the query timerange +- randomization range.
	// this also applies to events that repeat.
	return event.repeatRule != null || getEventEnd(event, zone).getTime() - getEventStart(event, zone).getTime() > DAYS_SHIFTED_MS
}

/** create an event id depending on the calendar it is in and on its length */
export function assignEventId(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot): void {
	const listId = isLongEvent(event, zone) ? groupRoot.longEvents : groupRoot.shortEvents
	event._id = [listId, generateEventElementId(event.startTime.getTime())]
}

/** create an pending event id depending on the calendar it is */
export function assignPendingEventId(event: CalendarEvent, groupRoot: CalendarGroupRoot): void {
	if (!groupRoot.pendingEvents?.list) {
		throw Error(`Group ${groupRoot._id} is missing its pending list`)
	}
	event._id = [groupRoot.pendingEvents.list, generateEventElementId(event.startTime.getTime())]
}

/** predicate that tells us if two CalendarEvent objects refer to the same instance or different ones.*/
export function isSameEventInstance(left: EventWrapper, right: EventWrapper): boolean {
	// in addition to the id we compare the start time equality to be able to distinguish repeating events. They have the same id but different start time.
	// altered events with recurrenceId never have the same Id as another event instance, but might start at the same time.
	return isSameId(left.event._id, right.event._id) && left.event.startTime.getTime() === right.event.startTime.getTime()
}

export function hasAlarmsForTheUser(user: User, event: CalendarEvent): boolean {
	const useAlarmList = neverNull(user.alarmInfoList).alarms
	return event.alarmInfos.some(([listId]) => isSameId(listId, useAlarmList))
}

export function eventComparator(l: EventWrapper, r: EventWrapper): number {
	return l.event.startTime.getTime() - r.event.startTime.getTime()
}

function assertDateIsValid(date: Date) {
	if (!isValidDate(date)) {
		throw new Error("Date is invalid!")
	}
}

/**
 * we don't want to deal with some calendar event edge cases,
 * like pre-1970 events that would have negative timestamps.
 * during import, we can also get faulty events that are
 * impossible to create through the interface.
 */
export const enum CalendarEventValidity {
	InvalidContainsInvalidDate,
	InvalidEndBeforeStart,
	InvalidPre1970,
	Valid,
}

/**
 * check if a given event should be allowed to be created in a tutanota calendar.
 * @param event
 * @returns Enum describing the reason to reject the event, if any.
 */
export function checkEventValidity(event: CalendarEvent): CalendarEventValidity {
	if (!isValidDate(event.startTime) || !isValidDate(event.endTime)) {
		return CalendarEventValidity.InvalidContainsInvalidDate
	} else if (event.endTime.getTime() <= event.startTime.getTime()) {
		return CalendarEventValidity.InvalidEndBeforeStart
	} else if (event.startTime.getTime() < TIMESTAMP_ZERO_YEAR) {
		return CalendarEventValidity.InvalidPre1970
	}
	return CalendarEventValidity.Valid
}

const MAX_EVENT_ITERATIONS = 10000

/**
 * add the days the given {@param event} is happening on during the given {@param range} to {@param daysToEvents}.
 *
 * ignores repeat rules.
 * @param daysToEvents
 * @param eventWrapper
 * @param range
 * @param zone
 */
export function addDaysForEventInstance(daysToEvents: Map<number, Array<EventWrapper>>, eventWrapper: EventWrapper, range: CalendarTimeRange, zone: string) {
	const { start: rangeStart, end: rangeEnd } = range
	const clippedRange = clipRanges(getEventStart(eventWrapper.event, zone).getTime(), getEventEnd(eventWrapper.event, zone).getTime(), rangeStart, rangeEnd)
	// the event and range do not intersect
	if (clippedRange == null) return
	const { start: eventStartInRange, end: eventEndInRange } = clippedRange
	let calculationDate = getStartOfDayWithZone(new Date(eventStartInRange), zone)
	let calculationTime = calculationDate.getTime()
	let iterations = 0

	while (calculationTime < rangeEnd) {
		assertDateIsValid(calculationDate)
		assert(iterations <= MAX_EVENT_ITERATIONS, "Run into the infinite loop, addDaysForEvent")
		if (calculationTime < eventEndInRange) {
			const eventsForCalculationDate = getFromMap(daysToEvents, calculationTime, () => [])
			insertIntoSortedArray(eventWrapper, eventsForCalculationDate, eventComparator, isSameEventInstance)
		} else {
			// If the duration of the original event instance was reduced, we also have to delete the remaining days of the previous event instance.
			const removed = findAllAndRemove(daysToEvents.get(calculationTime) ?? [], (e) => isSameEventInstance(e, eventWrapper))
			if (!removed) {
				// no further days this event instance occurred on
				break
			}
		}

		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
		calculationTime = calculationDate.getTime()
		iterations++
	}
}

function filterEventOccurancesBySetPos(posRulesValues: string[], frequency: RepeatPeriod, eventCount: number, allEvents: DateTime[]) {
	const negativeValues: string[] = []
	const positiveValues: string[] = []

	for (const posRulesValue of posRulesValues) {
		if (Number(posRulesValue) < 0) {
			negativeValues.push(posRulesValue)
		} else {
			positiveValues.push(posRulesValue)
		}
	}

	// Filter events according to its occurence number and
	// event frequency
	switch (frequency) {
		case RepeatPeriod.DAILY:
			if (
				negativeValues.some((value) => Number(value) < -366) ||
				positiveValues.some((value) => Number(value) > 366) ||
				positiveValues.includes(eventCount.toString())
			) {
				return true
			}
			break
		case RepeatPeriod.ANNUALLY:
			if (
				negativeValues.some((value) => Number(value) < -366) ||
				positiveValues.some((value) => Number(value) > 366) ||
				positiveValues.includes(eventCount.toString())
			) {
				return true
			}
			break
		case RepeatPeriod.WEEKLY:
			if (
				negativeValues.some((value) => Number(value) < -7) ||
				positiveValues.some((value) => Number(value) > 7) ||
				positiveValues.includes(eventCount.toString())
			) {
				return true
			}
			break
		case RepeatPeriod.MONTHLY:
			if (
				negativeValues.some((value) => Number(value) < -31) ||
				positiveValues.some((value) => Number(value) > 31) ||
				positiveValues.includes(eventCount.toString())
			) {
				return true
			}
			break
	}
	for (const negativeValue of negativeValues) {
		if (allEvents.length - Math.abs(Number(negativeValue)) + 1 === eventCount) {
			return true
		}
	}
	return false
}

/** add the days a repeating {@param event} occurs on during {@param range} to {@param daysToEvents} by calling addDaysForEventInstance() for each of its
 * non-excluded instances.
 * @param timeZone
 */
export function addDaysForRecurringEvent(
	daysToEvents: Map<number, Array<EventWrapper>>,
	baseEvent: EventWrapper,
	range: CalendarTimeRange,
	timeZone: string = getTimeZone(),
) {
	const repeatRule = baseEvent.event.repeatRule

	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(baseEvent))
	}
	const allDay = isAllDayEvent(baseEvent.event)
	const exclusions = allDay
		? repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) }))
		: repeatRule.excludedDates
	const generatedEvents = eventOccurencesGenerator(baseEvent.event, timeZone, new Date(range.end))

	for (const { startTime, endTime } of generatedEvents) {
		if (startTime.getTime() > range.end) break
		if (endTime.getTime() < range.start) continue
		if (isExcludedDate(startTime, exclusions)) {
			const eventsOnExcludedDay = daysToEvents.get(getStartOfDayWithZone(startTime, timeZone).getTime())
			if (!eventsOnExcludedDay) continue
		} else {
			const eventCloneWrapper = clone(baseEvent)
			if (allDay) {
				eventCloneWrapper.event.startTime = getAllDayDateUTCFromZone(startTime, timeZone)
				eventCloneWrapper.event.endTime = getAllDayDateUTCFromZone(endTime, timeZone)
			} else {
				eventCloneWrapper.event.startTime = new Date(startTime)
				eventCloneWrapper.event.endTime = new Date(endTime)
			}

			addDaysForEventInstance(daysToEvents, eventCloneWrapper, range, timeZone)
		}
	}
}

/**
 * get all instances of all series in a list of event series progenitors that intersect with the given range.
 * will return a sorted array of instances (by start time), interleaving the series if necessary.
 *
 */
export function generateCalendarInstancesInRange(
	progenitors: ReadonlyArray<CalendarEvent>,
	range: CalendarTimeRange,
	max: number = Infinity,
	timeZone: string = getTimeZone(),
): Array<CalendarEvent> {
	const ret: Array<CalendarEvent> = []

	const getNextCandidate = (
		previousCandidate: CalendarEvent,
		generator: Generator<{
			startTime: Date
			endTime: Date
		}>,
		excludedDates: Array<DateWrapper>,
	) => {
		const allDay = isAllDayEvent(previousCandidate)
		const exclusions = allDay ? excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) })) : excludedDates
		let current

		// not using for-of because that automatically closes the generator
		// when breaking or returning, and we want to suspend and resume iteration.
		while (ret.length < max) {
			current = generator.next()

			if (current.done) break

			let { startTime, endTime } = current.value
			if (startTime.getTime() > range.end) break
			// using "<=" because an all-day-event that lasts n days spans n+1 days,
			// ending at midnight utc on the day after. So they seem to intersect
			// the range if it starts on the day after the event ends.
			if (endTime.getTime() <= range.start) continue

			if (!isExcludedDate(startTime, exclusions)) {
				const nextCandidate = clone(previousCandidate)
				if (allDay) {
					nextCandidate.startTime = getAllDayDateUTCFromZone(startTime, timeZone)
					nextCandidate.endTime = getAllDayDateUTCFromZone(endTime, timeZone)
				} else {
					nextCandidate.startTime = new Date(startTime)
					nextCandidate.endTime = new Date(endTime)
				}
				return nextCandidate
			}
		}

		return null
	}

	// we need to have one candidate for each series and then check which one gets added first.
	// if we added one, we advance the generator that generated it to the next candidate and repeat.
	const generators: Array<{
		generator: Generator<{ startTime: Date; endTime: Date }>
		excludedDates: Array<DateWrapper>
		nextCandidate: CalendarEvent
	}> = progenitors
		.map((p) => {
			const generator = eventOccurencesGenerator(p, timeZone, new Date(range.end))
			const excludedDates = p.repeatRule?.excludedDates ?? []
			const nextCandidate = getNextCandidate(p, generator, excludedDates)
			if (nextCandidate == null) return null
			return {
				excludedDates,
				generator,
				nextCandidate,
			}
		})
		.filter(isNotNull)

	while (generators.length > 0) {
		// performance: put the smallest nextCandidate in front. we only change the first item in each iteration, so this should be quick to re-sort.
		// still O(n²) in the best case >:(
		// we might improve runtime here by re-inserting the new nextCandidate into the list manually using a linear or binary search instead of invoking
		// sort.
		// we can then also maintain an index to the first still-open generator instead of splicing out the first generator when it stops yielding instances.
		generators.sort((a, b) => (a.nextCandidate?.startTime.getTime() ?? 0) - (b.nextCandidate?.startTime.getTime() ?? 0))
		const first = getFirstOrThrow(generators)
		const newNext = getNextCandidate(first.nextCandidate, first.generator, first.excludedDates)

		ret.push(first.nextCandidate)

		if (newNext == null) {
			generators.splice(0, 1)
			continue
		}

		first.nextCandidate = newNext
	}
	return ret
}

/**
 * Returns the end date of a repeating rule that can be used to display in the ui.
 *
 * The actual end date that is stored on the repeat rule is always one day behind the displayed end date:
 * * for all-day events:
 *   - displayed end date: 2023-05-18
 *   - last occurrence can be: 2023-05-18
 *   - exported end date: 2023-05-18
 *   - actual timestamp on the entity: Midnight UTC 2023-05-19 (start of day)
 * * normal events behave the same except:
 *   - actual timestamp on the entity is Midnight local timezone 2023-05-19 (start of day)
 * @returns {Date}
 */
export function getRepeatEndTimeForDisplay(repeatRule: RepeatRule, isAllDay: boolean, timeZone: string): Date {
	if (repeatRule.endType !== EndType.UntilDate) {
		throw new Error("Event has no repeat rule end type is not UntilDate: " + JSON.stringify(repeatRule))
	}

	const rawEndDate = new Date(filterInt(repeatRule.endValue ?? "0"))
	const localDate = isAllDay ? getAllDayDateForTimezone(rawEndDate, timeZone) : rawEndDate
	// Shown date is one day behind the actual end (but it is still excluded)
	return incrementByRepeatPeriod(localDate, RepeatPeriod.DAILY, -1, timeZone)
}

/**
 * generates all event occurrences in chronological order, including the progenitor.
 * terminates once the end condition of the repeat rule is hit.
 * @param event the event to iterate occurrences on.
 * @param timeZone
 * @param maxDate
 */
function* eventOccurencesGenerator(
	event: CalendarEvent,
	timeZone: string,
	maxDate: Date,
): Generator<{
	startTime: Date
	endTime: Date
}> {
	const { repeatRule } = event

	if (repeatRule == null) {
		yield event
		return
	}

	const frequency: RepeatPeriod = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	let eventStartTime = getEventStart(event, timeZone)
	let eventEndTime = getEventEnd(event, timeZone)
	// Loop by the frequency step
	let repeatEndTime: Date | null = null
	let endOccurrences: number | null = null
	const allDay = isAllDayEvent(event)
	// For all-day events we should rely on the local time zone or at least we must use the same zone as in getAllDayDateUTCFromZone
	// below. If they are not in sync, then daylight saving shifts may cause us to extract wrong UTC date (day in repeat rule zone and in
	// local zone may be different).
	const repeatTimeZone = allDay ? timeZone : getValidTimeZone(repeatRule.timeZone)

	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		// See CalendarEventDialog for an explanation why it's needed
		if (allDay) {
			repeatEndTime = getAllDayDateForTimezone(new Date(Number(repeatRule.endValue)), timeZone)
		} else {
			repeatEndTime = new Date(Number(repeatRule.endValue))
		}
	}

	let calcStartTime = eventStartTime
	const calcDuration = allDay ? getDiffIn24hIntervals(eventStartTime, eventEndTime, timeZone) : eventEndTime.getTime() - eventStartTime.getTime()
	let calcEndTime = eventEndTime
	let iteration = 1

	assertDateIsValid(calcStartTime)
	assertDateIsValid(calcEndTime)
	yield { startTime: calcStartTime, endTime: calcEndTime }

	while ((endOccurrences == null || iteration <= endOccurrences) && (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime.getTime())) {
		const byMonthRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYMONTH)
		const byDayRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYDAY)
		const byMonthDayRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYMONTHDAY)
		const byYearDayRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYYEARDAY)
		const byWeekNoRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYWEEKNO)
		const weekStartRule = repeatRule.advancedRules.find((rule) => rule.ruleType === ByRule.WKST)?.interval
		const validMonths = byMonthRules.map((rule) => Number.parseInt(rule.interval))
		const validYearDays = byYearDayRules.map((rule) => Number.parseInt(rule.interval))
		const monthAppliedEvents = applyByMonth([DateTime.fromJSDate(calcStartTime, { zone: repeatTimeZone })], byMonthRules, frequency)
		const validMonthDays = byMonthDayRules.map((rule) => Number.parseInt(rule.interval))

		// RFC explicit says to not apply when freq != Annually
		const weekNoAppliedEvents =
			frequency === RepeatPeriod.ANNUALLY
				? applyWeekNo(monthAppliedEvents, byWeekNoRules, weekStartRule ? DATETIME_WEEKDAY[weekStartRule] : DATETIME_WEEKDAY.MO)
				: monthAppliedEvents
		const yearDayAppliedEvents =
			frequency === RepeatPeriod.ANNUALLY
				? applyYearDay(weekNoAppliedEvents, byYearDayRules, byWeekNoRules.length > 0, byMonthRules.length > 0)
				: weekNoAppliedEvents

		const monthDayAppliedEvents = applyByMonthDay(yearDayAppliedEvents, byMonthDayRules, frequency === RepeatPeriod.DAILY)

		const events = finishByRules(
			applyByDayRules(
				monthDayAppliedEvents,
				byDayRules,
				frequency,
				validMonths,
				weekStartRule ? DATETIME_WEEKDAY[weekStartRule] : DATETIME_WEEKDAY.MO,
				byWeekNoRules.length > 0,
				validMonthDays,
				validYearDays,
				byMonthRules.length > 0,
			),
			validMonths as MonthNumbers[],
			eventStartTime,
		).sort((a, b) => a.toMillis() - b.toMillis())

		const setPosRules = repeatRule.advancedRules.filter((rule) => rule.ruleType === ByRule.BYSETPOS)
		const setPosRulesValues = setPosRules.map((rule) => rule.interval)
		const shouldApplySetPos = isNotEmpty(setPosRules) && setPosRules.length < repeatRule.advancedRules.length
		let eventCount = 0

		// We reached our range end, no need to continue generating/evaluating events
		if (calcStartTime.getTime() > maxDate.getTime() && events.length === 0) {
			return
		}

		for (const generatedEvent of events) {
			const newStartTime = generatedEvent.toJSDate()

			// We reached our range end, no need to continue generating/evaluating events
			if (newStartTime.getTime() > maxDate.getTime()) {
				return
			}

			if (iteration === 1 && generatedEvent.toJSDate().getTime() === eventStartTime.getTime()) {
				// Already yielded
				continue
			}

			const newEndTime = allDay
				? incrementByRepeatPeriod(newStartTime, RepeatPeriod.DAILY, calcDuration, repeatTimeZone)
				: DateTime.fromJSDate(newStartTime).plus(calcDuration).toJSDate()

			if (shouldApplySetPos && !filterEventOccurancesBySetPos(setPosRulesValues, downcast(repeatRule?.frequency), ++eventCount, events)) {
				continue
			}

			assertDateIsValid(newStartTime)
			assertDateIsValid(newEndTime)

			if (newStartTime.getTime() < event.startTime.getTime()) {
				continue // We have an instance before the original progenitor
			}

			yield { startTime: newStartTime, endTime: newEndTime }
		}

		calcStartTime = incrementByRepeatPeriod(eventStartTime, downcast(repeatRule.frequency), interval * iteration, repeatTimeZone)
		iteration++
	}
}

/**
 * return true if an event has more than one visible occurrence according to its repeat rule and excluded dates
 *
 * will compare exclusion time stamps with the exact date-time value of the occurrences startTime
 *
 * @param event the calendar event to check. to get correct results, this must be the progenitor.
 */
export function calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, alteredInstances }: CalendarEventUidIndexEntry): boolean {
	if (progenitor == null) {
		// this may happen if we accept multiple invites to altered instances without ever getting the progenitor.
		return alteredInstances.length > 1
	}
	const { repeatRule } = progenitor
	if (repeatRule == null) {
		return false
	}

	const { endType, endValue, excludedDates } = repeatRule
	if (endType === EndType.Never) {
		// there are infinite occurrences
		return true
	} else if (endType === EndType.Count && Number(endValue ?? "0") + alteredInstances.length > excludedDates.length + 1) {
		// if there are not enough exclusions to delete all but one occurrence, we can return true
		return true
	} else if (alteredInstances.length > 1) {
		return true
	} else {
		// we need to count occurrences and match them up against altered instances & exclusions.
		const excludedTimestamps = excludedDates.map(({ date }) => date.getTime()).sort()
		let i = 0
		// in our model, we have an extra exclusion for each altered instance. this code
		// assumes that this invariant is upheld here and does not match each recurrenceId
		// against an exclusion, but only tallies them up.

		// The only two possible endTypes here are EndType === Count || EndType === Date
		let maxDate: Date
		if (endType === EndType.Count) {
			maxDate = new Date(progenitor.startTime.getTime() * Number(endValue ?? 1))
		} else {
			const millis = endValue && Number(endValue) > 0 ? endValue : progenitor.startTime.getTime()
			maxDate = new Date(millis)
		}

		let occurrencesFound = alteredInstances.length

		for (const { startTime } of eventOccurencesGenerator(progenitor, getTimeZone(), maxDate)) {
			const startTimestamp = startTime.getTime()
			while (i < excludedTimestamps.length && startTimestamp > excludedTimestamps[i]) {
				// exclusions are sorted
				i++
			}

			if (startTimestamp !== excludedTimestamps[i]) {
				// we found the place in the array where the startTimestamp would
				// be if it were in the array
				occurrencesFound += 1
				if (occurrencesFound > 1) return true
			}
		}

		return false
	}
}

/**
 * find out if a given date is in a list of excluded dates
 * @param currentDate the date to check
 * @param excludedDates a sorted list of excluded dates, earliest to latest
 */
function isExcludedDate(currentDate: Date, excludedDates: ReadonlyArray<DateWrapper> = []): boolean {
	return excludedDates.some((dw) => dw.date.getTime() === currentDate.getTime())
}

export type AlarmOccurrence = {
	alarmTime: Date
	occurrenceNumber: number
	eventTime: Date
}

export function findNextAlarmOccurrence(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	alarmTrigger: AlarmInterval,
	localTimeZone: string,
	repeatRule: RepeatRule,
): AlarmOccurrence | null {
	let occurrenceNumber = 0
	const isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
	const exclusions = repeatRule.excludedDates.map(({ date }) => date)
	let calcEventStart = isAllDayEvent ? getAllDayDateForTimezone(eventStart, localTimeZone) : eventStart
	assertDateIsValid(calcEventStart)

	const endDate =
		repeatRule.endType === EndType.UntilDate
			? isAllDayEvent
				? getAllDayDateForTimezone(new Date(Number(repeatRule.endValue)), localTimeZone)
				: new Date(Number(repeatRule.endValue))
			: null

	while (repeatRule.endType !== EndType.Count || occurrenceNumber < Number(repeatRule.endValue)) {
		const maxDate = incrementByRepeatPeriod(
			calcEventStart,
			downcast(repeatRule.frequency),
			Number(repeatRule.interval) * (occurrenceNumber + 1),
			isAllDayEvent ? localTimeZone : timeZone,
		)

		if (endDate && maxDate.getTime() >= endDate.getTime()) {
			return null
		}

		const eventGenerator = eventOccurencesGenerator(
			createCalendarEvent({
				startTime: eventStart,
				endTime: eventEnd,
				repeatRule,
			} as StrippedEntity<CalendarEvent>),
			localTimeZone,
			maxDate,
		)

		for (const { startTime, endTime } of eventGenerator) {
			if (!exclusions.some((d) => d.getTime() === startTime.getTime())) {
				const alarmTime = calculateAlarmTime(startTime, alarmTrigger, localTimeZone)

				if (alarmTime >= now) {
					return {
						alarmTime,
						occurrenceNumber: occurrenceNumber,
						eventTime: startTime,
					}
				}
			}
			occurrenceNumber++
		}
	}
	return null
}

/** */
export type CalendarDay = {
	date: Date
	year: number
	month: number
	day: number
	/** days that are technically not part of the current month, but are shown to fill the grid. */
	isPaddingDay: boolean
}

export type CalendarMonth = {
	weekdays: ReadonlyArray<string>
	weeks: ReadonlyArray<ReadonlyArray<CalendarDay>>
	/** the 1st of the month, might not be the first date in {@link weeks} because of the padding days. */
	beginningOfMonth: Date
}

/**
 *
 * https://www.kanzaki.com/docs/ical/sequence.html
 * The "Organizer" includes this property in an iCalendar object that it sends to an
 * "Attendee" to specify the current version of the calendar component.
 *
 * The "Attendee" includes this property in an iCalendar object that it sends to the "Organizer"
 * to specify the version of the calendar component that the "Attendee" is referring to.
 *
 * @param sequence
 */
export function incrementSequence(sequence: string): string {
	const current = filterInt(sequence) || 0
	// Only the organizer should increase sequence numbers
	return String(current + 1)
}

export function findFirstPrivateCalendar(calendarInfo: ReadonlyMap<Id, CalendarInfo>): CalendarInfo | null {
	for (const calendar of calendarInfo.values()) {
		if (calendar.userIsOwner && !calendar.isExternal) return calendar
	}
	return null
}

export const DEFAULT_HOUR_OF_DAY = 6

/** Get CSS class for the date element. */
export function getDateIndicator(day: Date, selectedDate: Date | null): string {
	if (isSameDayOfDate(day, selectedDate)) {
		return ".accent-bg.circle"
	} else {
		return ""
	}
}

/**
 * Determine what format the time of an event should be rendered in given a surrounding time period
 */
export function getTimeTextFormatForLongEvent(ev: CalendarEvent, startDay: Date, endDay: Date, zone: string): EventTextTimeOption | null {
	const startsBefore = eventStartsBefore(startDay, zone, ev)
	const endsAfter = eventEndsAfterOrOn(endDay, zone, ev)

	if ((startsBefore && endsAfter) || isAllDayEvent(ev)) {
		return null
	} else if (startsBefore && !endsAfter) {
		return EventTextTimeOption.END_TIME
	} else if (!startsBefore && endsAfter) {
		return EventTextTimeOption.START_TIME
	} else {
		return EventTextTimeOption.START_END_TIME
	}
}

/**
 * Creates a new date with the year, month and day from the Date and the hours and minutes from the Time
 * @param date
 * @param time
 */
export function combineDateWithTime(date: Date, time: Time): Date {
	const newDate = new Date(date)
	newDate.setHours(time.hour)
	newDate.setMinutes(time.minute)
	return newDate
}

/**
 * Check if an event occurs during some time period of days, either partially or entirely
 * Expects that firstDayOfWeek is before lastDayOfWeek, and that event starts before it ends, otherwise result is invalid
 */
export function isEventBetweenDays(event: CalendarEvent, firstDay: Date, lastDay: Date, zone: string): boolean {
	const endOfDay = DateTime.fromJSDate(lastDay, { zone }).endOf("day").toJSDate()
	return !(eventEndsBefore(firstDay, zone, event) || eventStartsAfter(endOfDay, zone, event))
}

export function getFirstDayOfMonth(d: Date): Date {
	const date = new Date(d)
	date.setDate(1)
	return date
}

/**
 * get the "primary" event of a series - the one that contains the repeat rule and is not a repeated or a rescheduled instance.
 * @param calendarEvent
 * @param entityClient
 */
export async function resolveCalendarEventProgenitor(calendarEvent: CalendarEvent, entityClient: EntityClient): Promise<CalendarEvent> {
	return calendarEvent.repeatRule ? await entityClient.load(CalendarEventTypeRef, calendarEvent._id) : calendarEvent
}

/** clip the range start-end to the range given by min-max. if the result would have length 0, null is returned. */
export function clipRanges(start: number, end: number, min: number, max: number): CalendarTimeRange | null {
	const res = {
		start: Math.max(start, min),
		end: Math.min(end, max),
	}
	return res.start < res.end ? res : null
}

export enum AlarmIntervalUnit {
	MINUTE = "M",
	HOUR = "H",
	DAY = "D",
	WEEK = "W",
}

export const StandardAlarmInterval = Object.freeze({
	ZERO_MINUTES: { value: 0, unit: AlarmIntervalUnit.MINUTE },
	FIVE_MINUTES: { value: 5, unit: AlarmIntervalUnit.MINUTE },
	TEN_MINUTES: { value: 10, unit: AlarmIntervalUnit.MINUTE },
	THIRTY_MINUTES: { value: 30, unit: AlarmIntervalUnit.MINUTE },
	ONE_HOUR: { value: 1, unit: AlarmIntervalUnit.HOUR },
	ONE_DAY: { value: 1, unit: AlarmIntervalUnit.DAY },
	TWO_DAYS: { value: 2, unit: AlarmIntervalUnit.DAY },
	THREE_DAYS: { value: 3, unit: AlarmIntervalUnit.DAY },
	ONE_WEEK: { value: 1, unit: AlarmIntervalUnit.WEEK },
} as const satisfies Record<string, AlarmInterval>)

/**
 * Runtime representation of an alarm interval/alarm trigger.
 * Unlike iCal we only support one unit and alarms in the past
 * (represented here as non-negative numbers).
 */
export type AlarmInterval = Readonly<{
	unit: AlarmIntervalUnit
	value: number
}>

export function alarmIntervalToLuxonDurationLikeObject(alarmInterval: AlarmInterval): DurationLikeObject {
	switch (alarmInterval.unit) {
		case AlarmIntervalUnit.MINUTE:
			return { minutes: alarmInterval.value }
		case AlarmIntervalUnit.HOUR:
			return { hours: alarmInterval.value }
		case AlarmIntervalUnit.DAY:
			return { days: alarmInterval.value }
		case AlarmIntervalUnit.WEEK:
			return { weeks: alarmInterval.value }
		default:
			throw new Error(`Unknown alarm unit: ${alarmInterval.unit}`)
	}
}

/**
 * compare two lists of dates that are sorted from earliest to latest. return true if they are equivalent.
 */
export function areExcludedDatesEqual(e1: ReadonlyArray<DateWrapper>, e2: ReadonlyArray<DateWrapper>): boolean {
	if (e1.length !== e2.length) return false
	return e1.every(({ date }, i) => e2[i].date.getTime() === date.getTime())
}

export function areRepeatRulesEqual(r1: CalendarRepeatRule | null, r2: CalendarRepeatRule | null): boolean {
	return (
		r1 === r2 ||
		(r1?.endType === r2?.endType &&
			r1?.endValue === r2?.endValue &&
			r1?.frequency === r2?.frequency &&
			r1?.interval === r2?.interval &&
			/** r1?.timeZone === r2?.timeZone && we're ignoring time zone because it's not an observable change. */
			areExcludedDatesEqual(r1?.excludedDates ?? [], r2?.excludedDates ?? []) &&
			deepEqual(r1?.advancedRules, r2?.advancedRules))
	)
}

/*
 * Checks if all Advanced Rules whithin a set are valid. Return true if we support all rules present in the array
 */
export function areAllAdvancedRepeatRulesValid(advancedRules: AdvancedRepeatRule[], repeatPeriod: RepeatPeriod | null) {
	const isDailyOrYearly = repeatPeriod === RepeatPeriod.ANNUALLY || repeatPeriod === RepeatPeriod.DAILY

	if (repeatPeriod == null && isNotEmpty(advancedRules)) return false
	else if (isDailyOrYearly && isNotEmpty(advancedRules)) return false
	else if (advancedRules.some((rule) => rule.ruleType !== ByRule.BYDAY)) return false

	return true
}

/**
 * Converts db representation of alarm to a runtime one.
 * Deserializes an alarm interval string (e.g. "5M") into an AlarmInterval object.
 *
 * @example
 * parseAlarmInterval("5M") // => { value: 5, unit: AlarmIntervalUnit.MINUTE }
 *
 * @param serialized - The alarm interval string in the format (\d+)([MHDW])
 * @returns An {@link AlarmInterval} object with numeric value and unit as {@link AlarmIntervalUnit}
 *
 * @throws {ParserError} If the string does not match the expected format
 *
 * @see {@link serializeAlarmInterval} - The inverse operation
 */
export function parseAlarmInterval(serialized: string): AlarmInterval {
	const matched = serialized.match(/^(\d+)([MHDW])$/)

	if (!matched) {
		throw new ParserError(`Invalid alarm interval: ${serialized} - Uknown format`)
	}

	const [_, digits, unit] = matched
	const value = filterInt(digits)
	if (isNaN(value)) {
		throw new ParserError(`Invalid alarm interval: ${serialized} - NaN value`)
	}

	return { value, unit: unit as AlarmIntervalUnit }
}

export enum CalendarType {
	Private,
	Shared,
	External,
	Birthday,
}

export const CALENDAR_TYPE_TRANSLATION_MAP: ReadonlyMap<CalendarType, TranslationKey> = freezeMap(
	new Map([
		[CalendarType.Private, "yourCalendars_label"],
		[CalendarType.External, "calendarSubscriptions_label"],
		[CalendarType.Shared, "calendarShared_label"],
	]),
)

type CalendarTypeInfo = {
	calendarId: string
	isExternalCalendar: boolean
	isUserOwner: boolean
}

export function getCalendarType(calendarTypeInfo: CalendarTypeInfo): CalendarType {
	if (isBirthdayCalendar(calendarTypeInfo.calendarId)) return CalendarType.Birthday
	if (isPrivateRenderType(calendarTypeInfo)) return CalendarType.Private
	if (isSharedRenderType(calendarTypeInfo)) return CalendarType.Shared
	if (isExternalRenderType(calendarTypeInfo)) return CalendarType.External
	throw new Error("Unknown calendar Render Type")
}

function isPrivateRenderType(calendarTypeInfo: CalendarTypeInfo) {
	return calendarTypeInfo.isUserOwner && !calendarTypeInfo.isExternalCalendar && !isBirthdayCalendar(calendarTypeInfo.calendarId)
}

function isSharedRenderType(calendarTypeInfo: CalendarTypeInfo) {
	return !calendarTypeInfo.isUserOwner
}

function isExternalRenderType(calendarTypeInfo: CalendarTypeInfo) {
	return calendarTypeInfo.isUserOwner && calendarTypeInfo.isExternalCalendar
}

export function isBirthdayCalendar(calendarId: Id) {
	return calendarId.includes(BIRTHDAY_CALENDAR_BASE_ID)
}

export function hasSourceUrl(groupSettings: GroupSettings | null | undefined) {
	return isNotNull(groupSettings?.sourceUrl) && groupSettings?.sourceUrl !== ""
}

export function extractYearFromBirthday(birthday: string | null): number | null {
	if (!birthday) {
		return null
	}

	const dateParts = birthday.split("-")
	const partsLength = dateParts.length

	// A valid ISO date should contain 3 parts:
	// YYYY-mm-dd => [yyyy, mm, dd]
	if (partsLength !== 3) {
		return null
	}

	return Number.parseInt(dateParts[0])
}

export async function retrieveBirthdayEventsForUser(
	logins: LoginController,
	searchResultEventIds: IdTuple[],
	birthdayEventsByMonth: Map<number, BirthdayEventRegistry[]>,
) {
	if (!(await logins.getUserController().isNewPaidPlan())) {
		return []
	}

	const birthdayEventsFromSearchResult = searchResultEventIds.filter(([calendarId, _]) => isBirthdayCalendar(calendarId))
	const birthdayEventIdsString = birthdayEventsFromSearchResult.flatMap((eventId) => eventId.join("/"))
	const retrievedEvents: CalendarEvent[] = []

	const allBirthdayEvents = Array.from(birthdayEventsByMonth.values()).flat()
	for (const event of allBirthdayEvents) {
		if (birthdayEventIdsString.includes(event.event._id.join("/"))) {
			retrievedEvents.push(event.event)
		}
	}

	return retrievedEvents
}

export function calculateContactsAge(birthYear: number | null, currentYear: number): number | null {
	if (!birthYear) {
		return null
	}

	return currentYear - birthYear
}

export function extractContactIdFromEvent(id: string | null | undefined): string | null {
	if (id == null) {
		return null
	}

	return decodeBase64("utf-8", id)
}

/**
 * Converts a birthday ISO string into UTC start and end dates
 * representing a full-day event in the given time zone.
 *
 * This is useful for recurring dates like birthdays where you want the
 * "all-day" event range in UTC that corresponds to the local calendar day.
 *
 * @param {string} isoDateString - The desired date as an ISO date string (e.g., "1999-05-12").
 * @param {string} zone - The IANA time zone identifier (e.g., "Europe/Berlin", "America/New_York").
 * @returns {{ startDate: Date; endDate: Date }} An object containing:
 * - `startDate`: The UTC `Date` representing the start of the day (00:00 UTC converted to local time).
 * - `endDate`: The UTC `Date` representing the end of the day (00:00 UTC of the following day converted to local time).
 *
 * @example
 * // For a birthday on May 12 in Berlin time
 * const { startDate, endDate } = getAllDayDatesUTCFromIso("1999-05-12", "Europe/Berlin");
 * console.log(startDate); // 1999-05-11T22:00:00.000Z (depending on DST)
 * console.log(endDate);   // 1999-05-12T22:00:00.000Z (depending on DST)
 */
export function getAllDayDatesUTCFromIso(isoDateString: string, zone: string): { startDate: Date; endDate: Date } {
	const birthday = isoDateToBirthday(isoDateString)
	// We use Luxon to create a JsDate in the same day as the ISO string but in the specified timezone
	const birthdayDateInTimezone = DateTime.fromObject(
		{
			year: parseInt(birthday.year ?? "1970"),
			month: parseInt(birthday.month),
			day: parseInt(birthday.day),
		},
		{ zone },
	).toJSDate()

	const startDateUtc = getAllDayDateUTCFromZone(birthdayDateInTimezone, zone)
	const endDateUtc = getAllDayDateUTCFromZone(getStartOfNextDayWithZone(birthdayDateInTimezone, zone), zone)
	return {
		startDate: startDateUtc,
		endDate: endDateUtc,
	}
}

export enum ByRule {
	BYMINUTE = "0",
	BYHOUR = "1",
	BYDAY = "2",
	BYMONTHDAY = "3",
	BYYEARDAY = "4",
	BYWEEKNO = "5",
	BYMONTH = "6",
	BYSETPOS = "7",
	WKST = "8",
}

export const BYRULE_MAP = freezeMap(
	new Map([
		["BYMINUTE", ByRule.BYMINUTE],
		["BYHOUR", ByRule.BYHOUR],
		["BYDAY", ByRule.BYDAY],
		["BYMONTHDAY", ByRule.BYMONTHDAY],
		["BYYEARDAY", ByRule.BYYEARDAY],
		["BYWEEKNO", ByRule.BYWEEKNO],
		["BYMONTH", ByRule.BYMONTH],
		["BYSETPOS", ByRule.BYSETPOS],
		["WKST", ByRule.WKST],
	]),
)

export function getTimeFromClickInteraction(e: MouseEvent, time: Time): Time {
	const rect = (e.target as HTMLElement).getBoundingClientRect()
	const mousePositionRelativeToRectHeight = Math.abs(rect.top - e.clientY)
	if (mousePositionRelativeToRectHeight > rect.height / 2) return new Time(time.hour, time.minute + 30)
	return time
}
