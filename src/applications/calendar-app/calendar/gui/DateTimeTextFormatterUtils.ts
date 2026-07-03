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
import { DateTime } from "luxon"

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

export function getTimeZoneOffsetString(dateTime: DateTime) {
	let offsetInMinutes = dateTime.offset

	let result: string
	if (offsetInMinutes < 0) {
		offsetInMinutes = -offsetInMinutes
		result = "-"
	} else {
		result = "+"
	}

	const hours = Math.floor(offsetInMinutes / 60)
	const minutes = offsetInMinutes % 60

	result += hours.toString()
	if (minutes) {
		result += ":" + minutes.toString().padStart(2, "0")
	}

	return result
}

const tzLists: { [k: string]: string[] } = {
	"from script": [
		"Africa/Abidjan",
		"Africa/Accra",
		"Africa/Addis_Ababa",
		"Africa/Algiers",
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
		"America/Cambridge_Bay",
		"America/Campo_Grande",
		"America/Cancun",
		"America/Caracas",
		"America/Cayenne",
		"America/Cayman",
		"America/Chicago",
		"America/Chihuahua",
		"America/Ciudad_Juarez",
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
		"America/Inuvik",
		"America/Iqaluit",
		"America/Jamaica",
		"America/Juneau",
		"America/Kentucky/Monticello",
		"America/Kralendijk",
		"America/La_Paz",
		"America/Lima",
		"America/Los_Angeles",
		"America/Lower_Princes",
		"America/Maceio",
		"America/Managua",
		"America/Manaus",
		"America/Marigot",
		"America/Martinique",
		"America/Matamoros",
		"America/Mazatlan",
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
		"Asia/Riyadh",
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
		"Pacific/Port_Moresby",
		"Pacific/Rarotonga",
		"Pacific/Saipan",
		"Pacific/Tahiti",
		"Pacific/Tarawa",
		"Pacific/Tongatapu",
		"Pacific/Wake",
		"Pacific/Wallis",
		"America/Argentina/Buenos_Aires",
		"America/Argentina/Catamarca",
		"America/Argentina/Cordoba",
		"America/Argentina/Jujuy",
		"America/Argentina/Mendoza",
	].sort(),
	"in tzdb": [
		"Africa/Algiers",
		"Atlantic/Cape_Verde",
		"Africa/Ndjamena",
		"Africa/Abidjan",
		"Africa/Cairo",
		"Africa/Bissau",
		"Africa/Nairobi",
		"Africa/Monrovia",
		"Africa/Tripoli",
		"Indian/Mauritius",
		"Africa/Casablanca",
		"Africa/El_Aaiun",
		"Africa/Maputo",
		"Africa/Windhoek",
		"Africa/Lagos",
		"Africa/Sao_Tome",
		"Africa/Johannesburg",
		"Africa/Khartoum",
		"Africa/Juba",
		"Africa/Tunis",
		"Antarctica/Casey",
		"Antarctica/Davis",
		"Antarctica/Mawson",
		"Antarctica/Troll",
		"Antarctica/Vostok",
		"Antarctica/Rothera",
		"Asia/Kabul",
		"Asia/Yerevan",
		"Asia/Baku",
		"Asia/Dhaka",
		"Asia/Thimphu",
		"Indian/Chagos",
		"Asia/Yangon",
		"Asia/Shanghai",
		"Asia/Urumqi",
		"Asia/Hong_Kong",
		"Asia/Taipei",
		"Asia/Macau",
		"Asia/Nicosia",
		"Asia/Famagusta",
		"Asia/Tbilisi",
		"Asia/Dili",
		"Asia/Kolkata",
		"Asia/Jakarta",
		"Asia/Pontianak",
		"Asia/Makassar",
		"Asia/Jayapura",
		"Asia/Tehran",
		"Asia/Baghdad",
		"Asia/Jerusalem",
		"Asia/Tokyo",
		"Asia/Amman",
		"Asia/Almaty",
		"Asia/Qyzylorda",
		"Asia/Qostanay",
		"Asia/Aqtobe",
		"Asia/Aqtau",
		"Asia/Atyrau",
		"Asia/Oral",
		"Asia/Bishkek",
		"Asia/Seoul",
		"Asia/Pyongyang",
		"Asia/Beirut",
		"Asia/Kuching",
		"Indian/Maldives",
		"Asia/Hovd",
		"Asia/Ulaanbaatar",
		"Asia/Kathmandu",
		"Asia/Karachi",
		"Asia/Gaza",
		"Asia/Hebron",
		"Asia/Manila",
		"Asia/Qatar",
		"Asia/Riyadh",
		"Asia/Singapore",
		"Asia/Colombo",
		"Asia/Damascus",
		"Asia/Dushanbe",
		"Asia/Bangkok",
		"Asia/Ashgabat",
		"Asia/Dubai",
		"Asia/Samarkand",
		"Asia/Tashkent",
		"Asia/Ho_Chi_Minh",
		"Australia/Darwin",
		"Australia/Perth",
		"Australia/Eucla",
		"Australia/Brisbane",
		"Australia/Lindeman",
		"Australia/Adelaide",
		"Australia/Hobart",
		"Australia/Melbourne",
		"Australia/Sydney",
		"Australia/Broken_Hill",
		"Australia/Lord_Howe",
		"Antarctica/Macquarie",
		"Pacific/Fiji",
		"Pacific/Gambier",
		"Pacific/Marquesas",
		"Pacific/Tahiti",
		"Pacific/Guam",
		"Pacific/Tarawa",
		"Pacific/Kanton",
		"Pacific/Kiritimati",
		"Pacific/Kwajalein",
		"Pacific/Kosrae",
		"Pacific/Nauru",
		"Pacific/Noumea",
		"Pacific/Auckland",
		"Pacific/Chatham",
		"Pacific/Rarotonga",
		"Pacific/Niue",
		"Pacific/Norfolk",
		"Pacific/Palau",
		"Pacific/Port_Moresby",
		"Pacific/Bougainville",
		"Pacific/Pitcairn",
		"Pacific/Pago_Pago",
		"Pacific/Apia",
		"Pacific/Guadalcanal",
		"Pacific/Fakaofo",
		"Pacific/Tongatapu",
		"Pacific/Efate",
		"Europe/London",
		"Europe/Dublin",
		"Europe/Tirane",
		"Europe/Andorra",
		"Europe/Vienna",
		"Europe/Minsk",
		"Europe/Brussels",
		"Europe/Sofia",
		"Europe/Prague",
		"Atlantic/Faroe",
		"America/Danmarkshavn",
		"America/Scoresbysund",
		"America/Nuuk",
		"America/Thule",
		"Europe/Tallinn",
		"Europe/Helsinki",
		"Europe/Paris",
		"Europe/Berlin",
		"Europe/Gibraltar",
		"Europe/Athens",
		"Europe/Budapest",
		"Europe/Rome",
		"Europe/Riga",
		"Europe/Vilnius",
		"Europe/Malta",
		"Europe/Chisinau",
		"Europe/Warsaw",
		"Europe/Lisbon",
		"Atlantic/Azores",
		"Atlantic/Madeira",
		"Europe/Bucharest",
		"Europe/Kaliningrad",
		"Europe/Moscow",
		"Europe/Simferopol",
		"Europe/Astrakhan",
		"Europe/Volgograd",
		"Europe/Saratov",
		"Europe/Kirov",
		"Europe/Samara",
		"Europe/Ulyanovsk",
		"Asia/Yekaterinburg",
		"Asia/Omsk",
		"Asia/Barnaul",
		"Asia/Novosibirsk",
		"Asia/Tomsk",
		"Asia/Novokuznetsk",
		"Asia/Krasnoyarsk",
		"Asia/Irkutsk",
		"Asia/Chita",
		"Asia/Yakutsk",
		"Asia/Vladivostok",
		"Asia/Khandyga",
		"Asia/Sakhalin",
		"Asia/Magadan",
		"Asia/Srednekolymsk",
		"Asia/Ust-Nera",
		"Asia/Kamchatka",
		"Asia/Anadyr",
		"Europe/Belgrade",
		"Europe/Madrid",
		"Africa/Ceuta",
		"Atlantic/Canary",
		"Europe/Zurich",
		"Europe/Istanbul",
		"Europe/Kyiv",
		"America/New_York",
		"America/Chicago",
		"America/North_Dakota/Center",
		"America/North_Dakota/New_Salem",
		"America/North_Dakota/Beulah",
		"America/Denver",
		"America/Los_Angeles",
		"America/Juneau",
		"America/Sitka",
		"America/Metlakatla",
		"America/Yakutat",
		"America/Anchorage",
		"America/Nome",
		"America/Adak",
		"Pacific/Honolulu",
		"America/Phoenix",
		"America/Boise",
		"America/Indiana/Indianapolis",
		"America/Indiana/Marengo",
		"America/Indiana/Vincennes",
		"America/Indiana/Tell_City",
		"America/Indiana/Petersburg",
		"America/Indiana/Knox",
		"America/Indiana/Winamac",
		"America/Indiana/Vevay",
		"America/Kentucky/Louisville",
		"America/Kentucky/Monticello",
		"America/Detroit",
		"America/Menominee",
		"America/St_Johns",
		"America/Goose_Bay",
		"America/Halifax",
		"America/Glace_Bay",
		"America/Moncton",
		"America/Toronto",
		"America/Winnipeg",
		"America/Regina",
		"America/Swift_Current",
		"America/Edmonton",
		"America/Vancouver",
		"America/Dawson_Creek",
		"America/Fort_Nelson",
		"America/Iqaluit",
		"America/Resolute",
		"America/Rankin_Inlet",
		"America/Cambridge_Bay",
		"America/Inuvik",
		"America/Whitehorse",
		"America/Dawson",
		"America/Cancun",
		"America/Merida",
		"America/Matamoros",
		"America/Monterrey",
		"America/Mexico_City",
		"America/Ciudad_Juarez",
		"America/Ojinaga",
		"America/Chihuahua",
		"America/Hermosillo",
		"America/Mazatlan",
		"America/Bahia_Banderas",
		"America/Tijuana",
		"America/Barbados",
		"America/Belize",
		"Atlantic/Bermuda",
		"America/Costa_Rica",
		"America/Havana",
		"America/Santo_Domingo",
		"America/El_Salvador",
		"America/Guatemala",
		"America/Port-au-Prince",
		"America/Tegucigalpa",
		"America/Jamaica",
		"America/Martinique",
		"America/Managua",
		"America/Panama",
		"America/Puerto_Rico",
		"America/Miquelon",
		"America/Grand_Turk",
		"America/Argentina/Buenos_Aires",
		"America/Argentina/Cordoba",
		"America/Argentina/Salta",
		"America/Argentina/Tucuman",
		"America/Argentina/La_Rioja",
		"America/Argentina/San_Juan",
		"America/Argentina/Jujuy",
		"America/Argentina/Catamarca",
		"America/Argentina/Mendoza",
		"America/Argentina/San_Luis",
		"America/Argentina/Rio_Gallegos",
		"America/Argentina/Ushuaia",
		"America/La_Paz",
		"America/Noronha",
		"America/Belem",
		"America/Santarem",
		"America/Fortaleza",
		"America/Recife",
		"America/Araguaina",
		"America/Maceio",
		"America/Bahia",
		"America/Sao_Paulo",
		"America/Campo_Grande",
		"America/Cuiaba",
		"America/Porto_Velho",
		"America/Boa_Vista",
		"America/Manaus",
		"America/Eirunepe",
		"America/Rio_Branco",
		"America/Santiago",
		"America/Coyhaique",
		"America/Punta_Arenas",
		"Pacific/Easter",
		"Antarctica/Palmer",
		"America/Bogota",
		"America/Guayaquil",
		"Pacific/Galapagos",
		"Atlantic/Stanley",
		"America/Cayenne",
		"America/Guyana",
		"America/Asuncion",
		"America/Lima",
		"Atlantic/South_Georgia",
		"America/Paramaribo",
		"America/Montevideo",
		"America/Caracas",
	].sort(),
}

window.checkTzLists = function checkTzList() {
	const fullySupportedLists: string[] = []
	for (let listDesc in tzLists) {
		const tzList = tzLists[listDesc]

		const timeZonesCausingErrors = []
		const aliasedTimeZones: Record<string, string> = {}
		for (const tz of tzList) {
			try {
				const fmt = Intl.DateTimeFormat("en-US", { timeZone: tz })
				const alias = fmt.resolvedOptions().timeZone
				if (alias !== tz) {
					if (aliasedTimeZones[tz]) {
						throw new Error("Multiple aliases for same time zone")
					}
					aliasedTimeZones[tz] = alias
				}
			} catch (e) {
				if (e instanceof RangeError) {
					timeZonesCausingErrors.push(tz)
				} else {
					throw e
				}
			}
		}
		if (timeZonesCausingErrors.length || Object.keys(aliasedTimeZones).length) {
			console.log(`Problematic time zones ${listDesc}`)
			if (timeZonesCausingErrors.length) {
				console.log(`    Causing errors ${listDesc}: ${JSON.stringify(timeZonesCausingErrors)}`)
			}
			if (Object.keys(aliasedTimeZones).length) {
				console.log(
					`    Aliased time zones ${listDesc}: ${Object.entries(aliasedTimeZones)
						.map(([tz, alias]) => `${tz} => ${alias}`)
						.join(", ")}`,
				)
			}
		} else {
			fullySupportedLists.push(listDesc)
		}
	}
	if (fullySupportedLists.length) {
		console.log(`The time zone list ${fullySupportedLists.join(", ")} are fully supported`)
	}
}

export const timeZoneList = tzLists.tzdb
export const timeZoneSet = new Set(timeZoneList)

export function resolveTimeZone(timeZone: string): string {
	if (timeZoneSet.has(timeZone)) {
		return timeZone
	}

	try {
		const resolvedTimeZone = Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions().timeZone
		if (!timeZoneSet.has(resolvedTimeZone)) {
			console.error(`resolveTimeZone("${timeZone}") produced a result="${resolvedTimeZone}" that is inconsistent with the values in timeZoneList!`)
		}
		return resolvedTimeZone
	} catch (e) {
		if (e instanceof RangeError) {
			console.error(`resolveTimeZone received invalid time zone '${timeZone}'!`)
			return ""
		}
		throw e
	}
}
