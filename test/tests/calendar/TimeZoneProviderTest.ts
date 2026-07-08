import o from "@tutao/otest"
import { TimeZoneProvider } from "../../../src/applications/common/calendar/TimeZoneProvider"
import { DateTimeFormatterWrapper } from "../../../src/applications/common/calendar/DateTimeFormatterWrapper"
import { matchers, object, verify, when } from "testdouble"
import { DateTime } from "luxon"

o.spec("TimeZoneProvider", () => {
	let dateTimeFormatterWrapperMock: DateTimeFormatterWrapper
	let provider: TimeZoneProvider
	o.before(function () {
		dateTimeFormatterWrapperMock = object()
		provider = new TimeZoneProvider(dateTimeFormatterWrapperMock)
	})

	o.spec("resolveTimeZoneForImport", () => {
		o.test("Primary IANA time zone resolves to same identifier", function () {
			o(provider.resolveTimeZoneForImport("Europe/Berlin")).equals("Europe/Berlin")
		})
		o.test("IANA time zone alias (referred to as Links in tzdb) resolves to same identifier", () => {
			o(provider.resolveTimeZoneForImport("Europe/Stockholm")).equals("Europe/Stockholm")
		})
		o.test("IANA time zone with 2 slashes resolves to time zone our Intl.DateTimeFormatter wrapper", function () {
			//
			// Test Chrome-like behaviour, were time zones with 2 slashes resolve to an alias with 1 slash
			//
			when(dateTimeFormatterWrapperMock.resolveTimezone("America/Argentina/Buenos_Aires")).thenReturn("America/Buenos_Aires")
			when(dateTimeFormatterWrapperMock.resolveTimezone("America/Buenos_Aires")).thenReturn("America/Buenos_Aires")

			o(provider.resolveTimeZoneForImport("America/Argentina/Buenos_Aires")).equals("America/Buenos_Aires")
			o(provider.resolveTimeZoneForImport("America/Buenos_Aires")).equals("America/Buenos_Aires")

			verify(dateTimeFormatterWrapperMock.resolveTimezone("America/Argentina/Buenos_Aires"), { times: 1 })

			//
			// Test Firefox-like behaviour, were time zones with 1 slash may resolve to an alias with 2 slashes
			//
			when(dateTimeFormatterWrapperMock.resolveTimezone("America/Argentina/Buenos_Aires")).thenReturn("America/Argentina/Buenos_Aires")
			when(dateTimeFormatterWrapperMock.resolveTimezone("America/Buenos_Aires")).thenReturn("America/Argentina/Buenos_Aires")

			o(provider.resolveTimeZoneForImport("America/Argentina/Buenos_Aires")).equals("America/Argentina/Buenos_Aires")
			o(provider.resolveTimeZoneForImport("America/Buenos_Aires")).equals("America/Buenos_Aires")

			verify(dateTimeFormatterWrapperMock.resolveTimezone("America/Argentina/Buenos_Aires"), { times: 2 })
		})
		o.test("Handles Windows time zones", function () {
			o(provider.resolveTimeZoneForImport("Central Europe Standard Time")).equals("Europe/Budapest")
			o(provider.resolveTimeZoneForImport("Argentina Standard Time")).equals("America/Buenos_Aires")
		})
		o.test("Handles UTC-<offset> Windows time zones", function () {
			// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
			// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
			o(provider.resolveTimeZoneForImport("UTC-02")).equals("Etc/GMT+2")
		})
		o.test("Handles null-return from DateTimeFormatterWrapper", function () {
			when(dateTimeFormatterWrapperMock.resolveTimezone(matchers.anything())).thenReturn(null)

			o(provider.resolveTimeZoneForImport("bogus")).equals(null)

			verify(dateTimeFormatterWrapperMock.resolveTimezone("bogus"), { times: 1 })
		})
	})
	o.spec("createTimeZoneStrings", () => {
		o.test("Returns correct strings for Europe/Berlin during daylight saving time", () => {
			const timeZone = "Europe/Berlin"
			const dateTime = DateTime.fromISO("2026-07-07T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime)).deepEquals({
				timeZone: "Europe/Berlin",
				name: "Europe/Berlin",
				offsetLongName: "Central European Summer Time",
				gmtOffset: "GMT+2",
			})
		})
		o.test("Returns correct strings for Europe/Berlin during standard time", () => {
			const timeZone = "Europe/Berlin"
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime)).deepEquals({
				timeZone: "Europe/Berlin",
				name: "Europe/Berlin",
				offsetLongName: "Central European Standard Time",
				gmtOffset: "GMT+1",
			})
		})
		o.test("Replaces underscores with spaces in name", () => {
			const timeZone = "America/Buenos_Aires"
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime).name).deepEquals("America/Buenos Aires")
		})
		o.test("Handles 'UTC' time zone", () => {
			const timeZone = "UTC"
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime)).deepEquals({
				timeZone: "UTC",
				name: "UTC",
				offsetLongName: "UTC",
				gmtOffset: "GMT+0",
			})
		})
		o.test("Handles 'Etc/GMT+11' time zone", () => {
			const timeZone = "Etc/GMT+11"
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime)).deepEquals({
				timeZone: "Etc/GMT+11",
				name: "Etc/GMT+11",
				// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
				// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
				offsetLongName: "GMT-11:00",
				gmtOffset: "GMT-11",
			})
		})
		o.test("Handles time zones with 2 slashes", () => {
			const timeZone = "America/Argentina/Buenos_Aires"
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00", { zone: "UTC" })
			o(provider.createTimeZoneStrings(timeZone, dateTime)).deepEquals({
				timeZone: "America/Argentina/Buenos_Aires",
				name: "America/Argentina/Buenos Aires",
				offsetLongName: "Argentina Standard Time",
				gmtOffset: "GMT-3",
			})
		})
	})
})
