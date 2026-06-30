import { CalendarEventTimes, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import {
	eventEndsAfterDay,
	eventStartsBefore,
	getEndOfDayWithZone,
	getEventEnd,
	getEventStart,
	incrementByRepeatPeriod,
} from "../../../common/calendar/date/CalendarUtils"
import { EventTextTimeOption, ProgrammingError, RepeatPeriod } from "@tutao/app-env"
import { isSameDay, isSameDayOfDate } from "@tutao/utils"
import { formatDateTime, formatDateWithMonth, formatTime } from "../../../../ui/utils/Formatter"

export type TextFormatterTimezones = {
	startTimeZone?: string
	endTimeZone?: string
	calendarTimeZone: string
}

function formatAllDayDurationText(event: CalendarEventTimes, startTimeZone: string, endTimeZone: string) {
	const startTime = getEventStart(event, startTimeZone)
	const startString = formatDateWithMonth(startTime)
	const endTime = incrementByRepeatPeriod(getEventEnd(event, endTimeZone), RepeatPeriod.DAILY, -1, endTimeZone)

	if (isSameDayOfDate(startTime, endTime)) {
		return `${lang.get("allDay_label")}, ${startString}`
	} else {
		return `${lang.get("allDay_label")}, ${startString} - ${formatDateWithMonth(endTime)}`
	}
}

function formatNormalEventDurationText(event: CalendarEventTimes, includeTimezone: boolean, startTimeZone: string, endTimeZone: string) {
	const startAndEndIsSameDay = isSameDay(event.startTime, event.endTime)

	const startString = formatDateTime(event.startTime, startTimeZone)

	let endString = startAndEndIsSameDay ? formatTime(event.endTime, endTimeZone) : formatDateTime(event.endTime, endTimeZone)

	// IANA always has a / in it so we can use ! here
	const startZoneFormatted = "(" + startTimeZone.split("/").at(-1)!.replace("_", " ") + ")"
	const endZoneFormatted = "(" + endTimeZone.split("/").at(-1)!.replace("_", " ") + ")"

	return `${startString} ${includeTimezone ? startZoneFormatted : ""} - ${endString} ${includeTimezone ? endZoneFormatted : ""}`
}

export function formatEventDuration(
	event: CalendarEventTimes,
	{ startTimeZone, endTimeZone, calendarTimeZone }: TextFormatterTimezones,
	includeTimezone: boolean,
): string {
	if (isAllDayEvent(event)) {
		return formatAllDayDurationText(event, calendarTimeZone, calendarTimeZone)
	} else {
		return formatNormalEventDurationText(event, includeTimezone, startTimeZone ?? calendarTimeZone, endTimeZone ?? startTimeZone ?? calendarTimeZone)
	}
}

export function formatTimeWithZoneInfo({ endTime, startTime }: CalendarEventTimes, showTime: EventTextTimeOption, formatterTimezones: TextFormatterTimezones) {
	const startTimeZone = formatterTimezones.startTimeZone ?? formatterTimezones.calendarTimeZone
	const startTimezoneCity = startTimeZone.split("/").at(-1)!.replaceAll("_", " ")

	const endTimeZone = formatterTimezones.endTimeZone ?? startTimeZone
	const endTimezoneCity = endTimeZone.split("/").at(-1)!.replaceAll("_", " ")

	const isSameTimeZone = startTimeZone === endTimeZone

	const startTimeText = `${startTimezoneCity} ${formatTime(startTime, startTimeZone)}`
	const endTimeText = `${isSameTimeZone && showTime !== EventTextTimeOption.END_TIME ? "" : ` ${endTimezoneCity}`} ${formatTime(endTime, endTimeZone)}`

	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return startTimeText

		case EventTextTimeOption.END_TIME:
			return ` - ${endTimeText}`

		case EventTextTimeOption.START_END_TIME:
			return `${startTimeText} - ${endTimeText}`
	}
}

export function formatEventTime(
	{ endTime, startTime }: CalendarEventTimes,
	showTime: EventTextTimeOption,
	includeTimeZone: boolean,
	formatterTimezones: TextFormatterTimezones,
): string {
	const timeZoneInfo = includeTimeZone ? ` (${formatTimeWithZoneInfo({ endTime, startTime }, showTime, formatterTimezones)})` : ""

	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return formatTime(startTime) + timeZoneInfo

		case EventTextTimeOption.END_TIME:
			return ` - ${formatTime(endTime)} ${timeZoneInfo}`

		case EventTextTimeOption.START_END_TIME:
			return `${formatTime(startTime)} - ${formatTime(endTime)}` + timeZoneInfo

		default:
			throw new ProgrammingError(`Unknown time option: ${showTime}`)
	}
}

export function formatEventTimesAtDate(day: Date, event: CalendarEvent, includeTimeZone: boolean, formatterTimezones: TextFormatterTimezones): string {
	if (isAllDayEvent(event)) {
		return lang.get("allDay_label")
	} else {
		const startsBefore = eventStartsBefore(day, formatterTimezones.calendarTimeZone, event)
		const endsAfter = eventEndsAfterDay(day, formatterTimezones.calendarTimeZone, event)
		if (startsBefore && endsAfter) {
			return lang.get("allDay_label")
		} else {
			const startTime: Date = startsBefore ? day : event.startTime
			const endTime: Date = endsAfter ? getEndOfDayWithZone(day, formatterTimezones.calendarTimeZone) : event.endTime
			return formatEventTime({ startTime, endTime }, EventTextTimeOption.START_END_TIME, includeTimeZone, formatterTimezones)
		}
	}
}

export function shouldShowTimeZones(calendarTimeZone: string, startTimeZone: string | null, endTimeZone: string | null) {
	if (startTimeZone === null && endTimeZone === null) {
		return false
	}

	if (startTimeZone !== null && startTimeZone === calendarTimeZone && endTimeZone === null) {
		return false
	}

	if (endTimeZone !== null && endTimeZone === calendarTimeZone && startTimeZone === null) {
		return false
	}

	if (startTimeZone === endTimeZone && startTimeZone === calendarTimeZone) {
		return false
	}

	return true
}

export function getTextFormatterTimeZones(event: Omit<CalendarEvent, "description">, calendarTimeZone: string) {
	const timeZones: TextFormatterTimezones = {
		calendarTimeZone,
	}
	if (event.startTimeZone) {
		timeZones.startTimeZone = event.startTimeZone
	}
	if (event.endTimeZone) {
		timeZones.endTimeZone = event.endTimeZone
	}

	return timeZones
}

export function getTimeZoneLongName(date: Date, timeZone: string) {
	const dateTimeFormat = new Intl.DateTimeFormat(lang.languageTag, { timeZoneName: "long", timeZone })

	let longName = ""
	for (const part of dateTimeFormat.formatToParts(date)) {
		if (part.type === "timeZoneName") {
			longName = part.value
		}
	}
	return longName
}

export function getTimeZoneOffset(date: Date, timeZone: string) {
	const dateTimeFormat = new Intl.DateTimeFormat(lang.languageTag, { timeZoneName: "short", timeZone })
	let offsetString = ""
	for (const part of dateTimeFormat.formatToParts(date)) {
		if (part.type === "timeZoneName") {
			offsetString = part.value
		}
	}
	return offsetString
}

// Run `console.log(Intl.supportedValuesOf("timeZone").map(tz => `"${tz}"`).join(",\n"))` to regenerate
export const IANATimeZonesList = [
	"Africa/Abidjan",
	"Africa/Accra",
	"Africa/Addis_Ababa",
	"Africa/Algiers",
	"Africa/Asmera",
	"Africa/Bamako",
	"Africa/Bangui",
	"Africa/Banjul",
	"Africa/Bissau",
	"Africa/Blantyre",
	"Africa/Brazzaville",
	"Africa/Bujumbura",
	"Africa/Cairo",
	"Africa/Casablanca",
	"Africa/Ceuta",
	"Africa/Conakry",
	"Africa/Dakar",
	"Africa/Dar_es_Salaam",
	"Africa/Djibouti",
	"Africa/Douala",
	"Africa/El_Aaiun",
	"Africa/Freetown",
	"Africa/Gaborone",
	"Africa/Harare",
	"Africa/Johannesburg",
	"Africa/Juba",
	"Africa/Kampala",
	"Africa/Khartoum",
	"Africa/Kigali",
	"Africa/Kinshasa",
	"Africa/Lagos",
	"Africa/Libreville",
	"Africa/Lome",
	"Africa/Luanda",
	"Africa/Lubumbashi",
	"Africa/Lusaka",
	"Africa/Malabo",
	"Africa/Maputo",
	"Africa/Maseru",
	"Africa/Mbabane",
	"Africa/Mogadishu",
	"Africa/Monrovia",
	"Africa/Nairobi",
	"Africa/Ndjamena",
	"Africa/Niamey",
	"Africa/Nouakchott",
	"Africa/Ouagadougou",
	"Africa/Porto-Novo",
	"Africa/Sao_Tome",
	"Africa/Tripoli",
	"Africa/Tunis",
	"Africa/Windhoek",
	"America/Adak",
	"America/Anchorage",
	"America/Anguilla",
	"America/Antigua",
	"America/Araguaina",
	"America/Argentina/La_Rioja",
	"America/Argentina/Rio_Gallegos",
	"America/Argentina/Salta",
	"America/Argentina/San_Juan",
	"America/Argentina/San_Luis",
	"America/Argentina/Tucuman",
	"America/Argentina/Ushuaia",
	"America/Aruba",
	"America/Asuncion",
	"America/Bahia",
	"America/Bahia_Banderas",
	"America/Barbados",
	"America/Belem",
	"America/Belize",
	"America/Blanc-Sablon",
	"America/Boa_Vista",
	"America/Bogota",
	"America/Boise",
	"America/Buenos_Aires",
	"America/Cambridge_Bay",
	"America/Campo_Grande",
	"America/Cancun",
	"America/Caracas",
	"America/Catamarca",
	"America/Cayenne",
	"America/Cayman",
	"America/Chicago",
	"America/Chihuahua",
	"America/Ciudad_Juarez",
	"America/Coral_Harbour",
	"America/Cordoba",
	"America/Costa_Rica",
	"America/Coyhaique",
	"America/Creston",
	"America/Cuiaba",
	"America/Curacao",
	"America/Danmarkshavn",
	"America/Dawson",
	"America/Dawson_Creek",
	"America/Denver",
	"America/Detroit",
	"America/Dominica",
	"America/Edmonton",
	"America/Eirunepe",
	"America/El_Salvador",
	"America/Fort_Nelson",
	"America/Fortaleza",
	"America/Glace_Bay",
	"America/Godthab",
	"America/Goose_Bay",
	"America/Grand_Turk",
	"America/Grenada",
	"America/Guadeloupe",
	"America/Guatemala",
	"America/Guayaquil",
	"America/Guyana",
	"America/Halifax",
	"America/Havana",
	"America/Hermosillo",
	"America/Indiana/Knox",
	"America/Indiana/Marengo",
	"America/Indiana/Petersburg",
	"America/Indiana/Tell_City",
	"America/Indiana/Vevay",
	"America/Indiana/Vincennes",
	"America/Indiana/Winamac",
	"America/Indianapolis",
	"America/Inuvik",
	"America/Iqaluit",
	"America/Jamaica",
	"America/Jujuy",
	"America/Juneau",
	"America/Kentucky/Monticello",
	"America/Kralendijk",
	"America/La_Paz",
	"America/Lima",
	"America/Los_Angeles",
	"America/Louisville",
	"America/Lower_Princes",
	"America/Maceio",
	"America/Managua",
	"America/Manaus",
	"America/Marigot",
	"America/Martinique",
	"America/Matamoros",
	"America/Mazatlan",
	"America/Mendoza",
	"America/Menominee",
	"America/Merida",
	"America/Metlakatla",
	"America/Mexico_City",
	"America/Miquelon",
	"America/Moncton",
	"America/Monterrey",
	"America/Montevideo",
	"America/Montserrat",
	"America/Nassau",
	"America/New_York",
	"America/Nome",
	"America/Noronha",
	"America/North_Dakota/Beulah",
	"America/North_Dakota/Center",
	"America/North_Dakota/New_Salem",
	"America/Ojinaga",
	"America/Panama",
	"America/Paramaribo",
	"America/Phoenix",
	"America/Port-au-Prince",
	"America/Port_of_Spain",
	"America/Porto_Velho",
	"America/Puerto_Rico",
	"America/Punta_Arenas",
	"America/Rankin_Inlet",
	"America/Recife",
	"America/Regina",
	"America/Resolute",
	"America/Rio_Branco",
	"America/Santarem",
	"America/Santiago",
	"America/Santo_Domingo",
	"America/Sao_Paulo",
	"America/Scoresbysund",
	"America/Sitka",
	"America/St_Barthelemy",
	"America/St_Johns",
	"America/St_Kitts",
	"America/St_Lucia",
	"America/St_Thomas",
	"America/St_Vincent",
	"America/Swift_Current",
	"America/Tegucigalpa",
	"America/Thule",
	"America/Tijuana",
	"America/Toronto",
	"America/Tortola",
	"America/Vancouver",
	"America/Whitehorse",
	"America/Winnipeg",
	"America/Yakutat",
	"Antarctica/Casey",
	"Antarctica/Davis",
	"Antarctica/DumontDUrville",
	"Antarctica/Macquarie",
	"Antarctica/Mawson",
	"Antarctica/McMurdo",
	"Antarctica/Palmer",
	"Antarctica/Rothera",
	"Antarctica/Syowa",
	"Antarctica/Troll",
	"Antarctica/Vostok",
	"Arctic/Longyearbyen",
	"Asia/Aden",
	"Asia/Almaty",
	"Asia/Amman",
	"Asia/Anadyr",
	"Asia/Aqtau",
	"Asia/Aqtobe",
	"Asia/Ashgabat",
	"Asia/Atyrau",
	"Asia/Baghdad",
	"Asia/Bahrain",
	"Asia/Baku",
	"Asia/Bangkok",
	"Asia/Barnaul",
	"Asia/Beirut",
	"Asia/Bishkek",
	"Asia/Brunei",
	"Asia/Calcutta",
	"Asia/Chita",
	"Asia/Colombo",
	"Asia/Damascus",
	"Asia/Dhaka",
	"Asia/Dili",
	"Asia/Dubai",
	"Asia/Dushanbe",
	"Asia/Famagusta",
	"Asia/Gaza",
	"Asia/Hebron",
	"Asia/Hong_Kong",
	"Asia/Hovd",
	"Asia/Irkutsk",
	"Asia/Jakarta",
	"Asia/Jayapura",
	"Asia/Jerusalem",
	"Asia/Kabul",
	"Asia/Kamchatka",
	"Asia/Karachi",
	"Asia/Katmandu",
	"Asia/Khandyga",
	"Asia/Krasnoyarsk",
	"Asia/Kuala_Lumpur",
	"Asia/Kuching",
	"Asia/Kuwait",
	"Asia/Macau",
	"Asia/Magadan",
	"Asia/Makassar",
	"Asia/Manila",
	"Asia/Muscat",
	"Asia/Nicosia",
	"Asia/Novokuznetsk",
	"Asia/Novosibirsk",
	"Asia/Omsk",
	"Asia/Oral",
	"Asia/Phnom_Penh",
	"Asia/Pontianak",
	"Asia/Pyongyang",
	"Asia/Qatar",
	"Asia/Qostanay",
	"Asia/Qyzylorda",
	"Asia/Rangoon",
	"Asia/Riyadh",
	"Asia/Saigon",
	"Asia/Sakhalin",
	"Asia/Samarkand",
	"Asia/Seoul",
	"Asia/Shanghai",
	"Asia/Singapore",
	"Asia/Srednekolymsk",
	"Asia/Taipei",
	"Asia/Tashkent",
	"Asia/Tbilisi",
	"Asia/Tehran",
	"Asia/Thimphu",
	"Asia/Tokyo",
	"Asia/Tomsk",
	"Asia/Ulaanbaatar",
	"Asia/Urumqi",
	"Asia/Ust-Nera",
	"Asia/Vientiane",
	"Asia/Vladivostok",
	"Asia/Yakutsk",
	"Asia/Yekaterinburg",
	"Asia/Yerevan",
	"Atlantic/Azores",
	"Atlantic/Bermuda",
	"Atlantic/Canary",
	"Atlantic/Cape_Verde",
	"Atlantic/Faeroe",
	"Atlantic/Madeira",
	"Atlantic/Reykjavik",
	"Atlantic/South_Georgia",
	"Atlantic/St_Helena",
	"Atlantic/Stanley",
	"Australia/Adelaide",
	"Australia/Brisbane",
	"Australia/Broken_Hill",
	"Australia/Darwin",
	"Australia/Eucla",
	"Australia/Hobart",
	"Australia/Lindeman",
	"Australia/Lord_Howe",
	"Australia/Melbourne",
	"Australia/Perth",
	"Australia/Sydney",
	"Europe/Amsterdam",
	"Europe/Andorra",
	"Europe/Astrakhan",
	"Europe/Athens",
	"Europe/Belgrade",
	"Europe/Berlin",
	"Europe/Bratislava",
	"Europe/Brussels",
	"Europe/Bucharest",
	"Europe/Budapest",
	"Europe/Busingen",
	"Europe/Chisinau",
	"Europe/Copenhagen",
	"Europe/Dublin",
	"Europe/Gibraltar",
	"Europe/Guernsey",
	"Europe/Helsinki",
	"Europe/Isle_of_Man",
	"Europe/Istanbul",
	"Europe/Jersey",
	"Europe/Kaliningrad",
	"Europe/Kiev",
	"Europe/Kirov",
	"Europe/Lisbon",
	"Europe/Ljubljana",
	"Europe/London",
	"Europe/Luxembourg",
	"Europe/Madrid",
	"Europe/Malta",
	"Europe/Mariehamn",
	"Europe/Minsk",
	"Europe/Monaco",
	"Europe/Moscow",
	"Europe/Oslo",
	"Europe/Paris",
	"Europe/Podgorica",
	"Europe/Prague",
	"Europe/Riga",
	"Europe/Rome",
	"Europe/Samara",
	"Europe/San_Marino",
	"Europe/Sarajevo",
	"Europe/Saratov",
	"Europe/Simferopol",
	"Europe/Skopje",
	"Europe/Sofia",
	"Europe/Stockholm",
	"Europe/Tallinn",
	"Europe/Tirane",
	"Europe/Ulyanovsk",
	"Europe/Vaduz",
	"Europe/Vatican",
	"Europe/Vienna",
	"Europe/Vilnius",
	"Europe/Volgograd",
	"Europe/Warsaw",
	"Europe/Zagreb",
	"Europe/Zurich",
	"Indian/Antananarivo",
	"Indian/Chagos",
	"Indian/Christmas",
	"Indian/Cocos",
	"Indian/Comoro",
	"Indian/Kerguelen",
	"Indian/Mahe",
	"Indian/Maldives",
	"Indian/Mauritius",
	"Indian/Mayotte",
	"Indian/Reunion",
	"Pacific/Apia",
	"Pacific/Auckland",
	"Pacific/Bougainville",
	"Pacific/Chatham",
	"Pacific/Easter",
	"Pacific/Efate",
	"Pacific/Enderbury",
	"Pacific/Fakaofo",
	"Pacific/Fiji",
	"Pacific/Funafuti",
	"Pacific/Galapagos",
	"Pacific/Gambier",
	"Pacific/Guadalcanal",
	"Pacific/Guam",
	"Pacific/Honolulu",
	"Pacific/Kiritimati",
	"Pacific/Kosrae",
	"Pacific/Kwajalein",
	"Pacific/Majuro",
	"Pacific/Marquesas",
	"Pacific/Midway",
	"Pacific/Nauru",
	"Pacific/Niue",
	"Pacific/Norfolk",
	"Pacific/Noumea",
	"Pacific/Pago_Pago",
	"Pacific/Palau",
	"Pacific/Pitcairn",
	"Pacific/Ponape",
	"Pacific/Port_Moresby",
	"Pacific/Rarotonga",
	"Pacific/Saipan",
	"Pacific/Tahiti",
	"Pacific/Tarawa",
	"Pacific/Tongatapu",
	"Pacific/Truk",
	"Pacific/Wake",
	"Pacific/Wallis",
] as const

export type IANATimeZone = (typeof IANATimeZonesList)[number]

const IANATimeZonesSet = new Set(IANATimeZonesList)

/** Checks whether a string is an IANA time zone ID.
 * @param candidate The string to check */
export function isIANATimeZone(candidate: string): candidate is IANATimeZone {
	return (IANATimeZonesSet as Set<string>).has(candidate)
}

export function assertIANATimeZone(candidate: string): asserts candidate is IANATimeZone {
	if (!isIANATimeZone(candidate)) {
		throw new Error(`"${candidate}" is not a IANA time zone identifier!`)
	}
}
