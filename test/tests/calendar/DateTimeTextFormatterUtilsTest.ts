import o from "@tutao/otest"
import { IANATimeZonesList } from "../../../src/applications/calendar-app/calendar/gui/DateTimeTextFormatterUtils"

o.spec("DateTimeTextFormatterUtils", function () {
	o("IANATimeZonesList is in sync with Intl.supportedValuesOf('timeZone')", function () {
		// Please regenerate the list if it's out-of-sync -> see comment above list in file. Thanks :)
		o(IANATimeZonesList as unknown as string[]).deepEquals(Intl.supportedValuesOf("timeZone"))
	})
})
