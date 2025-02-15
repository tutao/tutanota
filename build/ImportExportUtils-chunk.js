import { DAY_IN_MILLIS, assertValidURL, filterInt, freezeMap, getFromMap, groupBy, insertIntoSortedArray, neverNull } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { CalendarAttendeeStatus, CalendarMethod, EndType, RepeatPeriod, reverse } from "./TutanotaConstants-chunk.js";
import { DateTime, Duration, IANAZone } from "./luxon-chunk.js";
import { createCalendarEvent, createCalendarEventAttendee, createEncryptedMailAddress } from "./TypeRefs-chunk.js";
import { generateEventElementId, serializeAlarmInterval } from "./CommonCalendarUtils-chunk.js";
import { createCalendarAdvancedRepeatRule, createDateWrapper, createRepeatRule } from "./TypeRefs2-chunk.js";
import { ParserError, StringIterator, combineParsers, makeCharacterParser, makeEitherParser, makeNotCharacterParser, makeSeparatedByParser, makeZeroOrMoreParser, mapParser, maybeParse, numberParser } from "./ParserCombinator-chunk.js";
import { AlarmIntervalUnit, CalendarEventValidity, assignEventId, checkEventValidity, getTimeZone } from "./CalendarUtils-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";

//#region src/calendar-app/calendar/export/WindowsZones.ts
var WindowsZones_default = {
	"Afghanistan Standard Time": "Asia/Kabul",
	"Alaskan Standard Time": "America/Anchorage",
	"Aleutian Standard Time": "America/Adak",
	"Altai Standard Time": "Asia/Barnaul",
	"Arab Standard Time": "Asia/Riyadh",
	"Arabian Standard Time": "Asia/Dubai",
	"Arabic Standard Time": "Asia/Baghdad",
	"Argentina Standard Time": "America/Buenos_Aires",
	"Astrakhan Standard Time": "Europe/Astrakhan",
	"Atlantic Standard Time": "America/Halifax",
	"AUS Central Standard Time": "Australia/Darwin",
	"Aus Central W. Standard Time": "Australia/Eucla",
	"AUS Eastern Standard Time": "Australia/Sydney",
	"Azerbaijan Standard Time": "Asia/Baku",
	"Azores Standard Time": "Atlantic/Azores",
	"Bahia Standard Time": "America/Bahia",
	"Bangladesh Standard Time": "Asia/Dhaka",
	"Belarus Standard Time": "Europe/Minsk",
	"Bougainville Standard Time": "Pacific/Bougainville",
	"Canada Central Standard Time": "America/Regina",
	"Cape Verde Standard Time": "Atlantic/Cape_Verde",
	"Caucasus Standard Time": "Asia/Yerevan",
	"Cen. Australia Standard Time": "Australia/Adelaide",
	"Central America Standard Time": "America/Guatemala",
	"Central Asia Standard Time": "Asia/Almaty",
	"Central Brazilian Standard Time": "America/Cuiaba",
	"Central Europe Standard Time": "Europe/Budapest",
	"Central European Standard Time": "Europe/Warsaw",
	"Central Pacific Standard Time": "Pacific/Guadalcanal",
	"Central Standard Time": "America/Chicago",
	"Central Standard Time (Mexico)": "America/Mexico_City",
	"Chatham Islands Standard Time": "Pacific/Chatham",
	"China Standard Time": "Asia/Shanghai",
	"Cuba Standard Time": "America/Havana",
	"Dateline Standard Time": "Etc/GMT+12",
	"E. Africa Standard Time": "Africa/Nairobi",
	"E. Australia Standard Time": "Australia/Brisbane",
	"E. Europe Standard Time": "Europe/Chisinau",
	"E. South America Standard Time": "America/Sao_Paulo",
	"Easter Island Standard Time": "Pacific/Easter",
	"Eastern Standard Time": "America/New_York",
	"Eastern Standard Time (Mexico)": "America/Cancun",
	"Egypt Standard Time": "Africa/Cairo",
	"Ekaterinburg Standard Time": "Asia/Yekaterinburg",
	"Fiji Standard Time": "Pacific/Fiji",
	"FLE Standard Time": "Europe/Kiev",
	"Georgian Standard Time": "Asia/Tbilisi",
	"GMT Standard Time": "Europe/London",
	"Greenland Standard Time": "America/Godthab",
	"Greenwich Standard Time": "Atlantic/Reykjavik",
	"GTB Standard Time": "Europe/Bucharest",
	"Haiti Standard Time": "America/Port-au-Prince",
	"Hawaiian Standard Time": "Pacific/Honolulu",
	"India Standard Time": "Asia/Calcutta",
	"Iran Standard Time": "Asia/Tehran",
	"Israel Standard Time": "Asia/Jerusalem",
	"Jordan Standard Time": "Asia/Amman",
	"Kaliningrad Standard Time": "Europe/Kaliningrad",
	"Korea Standard Time": "Asia/Seoul",
	"Libya Standard Time": "Africa/Tripoli",
	"Line Islands Standard Time": "Pacific/Kiritimati",
	"Lord Howe Standard Time": "Australia/Lord_Howe",
	"Magadan Standard Time": "Asia/Magadan",
	"Magallanes Standard Time": "America/Punta_Arenas",
	"Marquesas Standard Time": "Pacific/Marquesas",
	"Mauritius Standard Time": "Indian/Mauritius",
	"Middle East Standard Time": "Asia/Beirut",
	"Montevideo Standard Time": "America/Montevideo",
	"Morocco Standard Time": "Africa/Casablanca",
	"Mountain Standard Time": "America/Denver",
	"Mountain Standard Time (Mexico)": "America/Chihuahua",
	"Myanmar Standard Time": "Asia/Rangoon",
	"N. Central Asia Standard Time": "Asia/Novosibirsk",
	"Namibia Standard Time": "Africa/Windhoek",
	"Nepal Standard Time": "Asia/Katmandu",
	"New Zealand Standard Time": "Pacific/Auckland",
	"Newfoundland Standard Time": "America/St_Johns",
	"Norfolk Standard Time": "Pacific/Norfolk",
	"North Asia East Standard Time": "Asia/Irkutsk",
	"North Asia Standard Time": "Asia/Krasnoyarsk",
	"North Korea Standard Time": "Asia/Pyongyang",
	"Omsk Standard Time": "Asia/Omsk",
	"Pacific SA Standard Time": "America/Santiago",
	"Pacific Standard Time": "America/Los_Angeles",
	"Pacific Standard Time (Mexico)": "America/Tijuana",
	"Pakistan Standard Time": "Asia/Karachi",
	"Paraguay Standard Time": "America/Asuncion",
	"Romance Standard Time": "Europe/Paris",
	"Russia Time Zone 3": "Europe/Samara",
	"Russia Time Zone 10": "Asia/Srednekolymsk",
	"Russia Time Zone 11": "Asia/Kamchatka",
	"Russian Standard Time": "Europe/Moscow",
	"SA Eastern Standard Time": "America/Cayenne",
	"SA Pacific Standard Time": "America/Bogota",
	"SA Western Standard Time": "America/La_Paz",
	"Saint Pierre Standard Time": "America/Miquelon",
	"Sakhalin Standard Time": "Asia/Sakhalin",
	"Samoa Standard Time": "Pacific/Apia",
	"Sao Tome Standard Time": "Africa/Sao_Tome",
	"Saratov Standard Time": "Europe/Saratov",
	"SE Asia Standard Time": "Asia/Bangkok",
	"Singapore Standard Time": "Asia/Singapore",
	"South Africa Standard Time": "Africa/Johannesburg",
	"Sri Lanka Standard Time": "Asia/Colombo",
	"Sudan Standard Time": "Africa/Khartoum",
	"Syria Standard Time": "Asia/Damascus",
	"Taipei Standard Time": "Asia/Taipei",
	"Tasmania Standard Time": "Australia/Hobart",
	"Tocantins Standard Time": "America/Araguaina",
	"Tokyo Standard Time": "Asia/Tokyo",
	"Tomsk Standard Time": "Asia/Tomsk",
	"Tonga Standard Time": "Pacific/Tongatapu",
	"Transbaikal Standard Time": "Asia/Chita",
	"Turkey Standard Time": "Europe/Istanbul",
	"Turks And Caicos Standard Time": "America/Grand_Turk",
	"Ulaanbaatar Standard Time": "Asia/Ulaanbaatar",
	"US Eastern Standard Time": "America/Indianapolis",
	"US Mountain Standard Time": "America/Phoenix",
	UTC: "Etc/GMT",
	"UTC-02": "Etc/GMT+2",
	"UTC-08": "Etc/GMT+8",
	"UTC-09": "Etc/GMT+9",
	"UTC-11": "Etc/GMT+11",
	"UTC+12": "Etc/GMT-12",
	"UTC+13": "Etc/GMT-13",
	"Venezuela Standard Time": "America/Caracas",
	"Vladivostok Standard Time": "Asia/Vladivostok",
	"W. Australia Standard Time": "Australia/Perth",
	"W. Central Africa Standard Time": "Africa/Lagos",
	"W. Europe Standard Time": "Europe/Berlin",
	"W. Mongolia Standard Time": "Asia/Hovd",
	"West Asia Standard Time": "Asia/Tashkent",
	"West Bank Standard Time": "Asia/Hebron",
	"West Pacific Standard Time": "Pacific/Port_Moresby",
	"Yakutsk Standard Time": "Asia/Yakutsk"
};

//#endregion
//#region src/calendar-app/calendar/export/CalendarParser.ts
function parseDateString(dateString) {
	const year = parseInt(dateString.slice(0, 4));
	const month = parseInt(dateString.slice(4, 6));
	const day = parseInt(dateString.slice(6, 8));
	return {
		year,
		month,
		day
	};
}
function getProp(obj, tag, optional) {
	const prop = obj.properties.find((p) => p.name === tag);
	if (!optional && prop == null) throw new ParserError(`Missing prop ${tag}`);
	return prop;
}
function getPropStringValue(obj, tag, optional) {
	const prop = getProp(obj, tag, optional);
	if (!optional && typeof prop?.value !== "string") throw new ParserError(`value of ${tag} is not of type string, got ${JSON.stringify(prop)}`);
	return prop?.value;
}
const parameterStringValueParser = (iterator) => {
	let value = "";
	let next;
	while ((next = iterator.peek()) && /[:;,]/.test(next) === false) value += neverNull(iterator.next().value);
	return value;
};
const escapedStringValueParser = (iterator) => {
	if (iterator.next().value !== "\"") throw new ParserError("Not a quoted value");
	let value = "";
	while (iterator.peek() && iterator.peek() !== "\"") value += neverNull(iterator.next().value);
	if (!(iterator.peek() === "\"")) throw new Error("Not a quoted value, does not end with quote: " + value);
	iterator.next();
	return value;
};
const propertyParametersKeyValueParser = combineParsers(parsePropertyName, makeCharacterParser("="), makeEitherParser(escapedStringValueParser, parameterStringValueParser));
const parsePropertyParameters = combineParsers(makeCharacterParser(";"), makeSeparatedByParser(
	/*separator*/
	makeCharacterParser(";"),
	/*value*/
	propertyParametersKeyValueParser
));
const iCalReplacements = {
	"\\": "\\\\",
	";": "\\;",
	",": "\\,",
	"\n": "\\n"
};
const revICalReplacements = reverse(iCalReplacements);
/**
* Parses everything until the end of the string and unescapes what it should
*/
const anyStringUnescapeParser = (iterator) => {
	let value = "";
	let lastCharacter = null;
	while (iterator.peek()) {
		lastCharacter = iterator.next().value;
		if (lastCharacter === "\\") {
			const next = iterator.peek();
			if (next != null && next in iCalReplacements) continue;
else if (iterator.peek() === "n") {
				iterator.next();
				value += "\n";
				continue;
			}
		}
		value += neverNull(lastCharacter);
	}
	return value;
};
/**
* Parses everything until the semicolon character
*/
const propertyStringValueParser = (iterator) => {
	let value = "";
	let next;
	while ((next = iterator.peek()) && /[;]/.test(next) === false) value += neverNull(iterator.next().value);
	return value;
};
/**
* Parses values separated by commas
*/
const separatedByCommaParser = makeSeparatedByParser(makeCharacterParser(","), mapParser(makeZeroOrMoreParser(makeNotCharacterParser(",")), (arr) => arr.join("")));
const propertySequenceParser = combineParsers(parsePropertyName, maybeParse(parsePropertyParameters), makeCharacterParser(":"), anyStringUnescapeParser);
function parseProperty(data) {
	try {
		const sequence = propertySequenceParser(new StringIterator(data));
		const name = sequence[0];
		const params = {};
		if (sequence[1]) for (const [name$1, _eq, value$1] of sequence[1][1]) params[name$1] = value$1;
		const value = sequence[3];
		return {
			name,
			params,
			value
		};
	} catch (e) {
		return null;
	}
}
/**
* Parses single key=value pair on the right side of the semicolon (value side)
*/
const propertyKeyValueParser = combineParsers(parsePropertyName, makeCharacterParser("="), propertyStringValueParser);
/**
* Parses multiple key=value pair on the right side of the semicolon (value side)
*/
const valuesSeparatedBySemicolonParser = makeSeparatedByParser(makeCharacterParser(";"), propertyKeyValueParser);
function parsePropertyKeyValue(data) {
	const values = valuesSeparatedBySemicolonParser(new StringIterator(data));
	const result = {};
	for (const [key, _eq, value] of values) result[key] = value;
	return result;
}
function parseIcalObject(tag, iterator) {
	let iteration = iterator.next();
	let properties = [];
	let children = [];
	while (!iteration.done && iteration.value) {
		const property = parseProperty(iteration.value);
		if (!property) {
			iteration = iterator.next();
			continue;
		}
		if (property.name === "END" && property.value === tag) return {
			type: tag,
			properties,
			children
		};
		if (property.name === "BEGIN") {
			if (typeof property.value !== "string") throw new ParserError("BEGIN with array value");
			children.push(parseIcalObject(property.value, iterator));
		} else properties.push(property);
		iteration = iterator.next();
	}
	throw new ParserError("no end for tag " + tag);
}
function parseICalendar(stringData) {
	const withFoldedLines = stringData.replace(/\r?\n\s/g, "").split(/\r?\n/).filter((e) => e !== "");
	const iterator = withFoldedLines.values();
	const firstLine = iterator.next();
	if (firstLine.value !== "BEGIN:VCALENDAR") throw new ParserError("Not a VCALENDAR: " + String(firstLine.value));
	return parseIcalObject("VCALENDAR", iterator);
}
function parseAlarm(alarmObject, startTime) {
	const triggerValue = getPropStringValue(alarmObject, "TRIGGER", false);
	const alarmInterval = triggerToAlarmInterval(startTime, triggerValue);
	return alarmInterval != null ? {
		trigger: serializeAlarmInterval(alarmInterval),
		alarmIdentifier: ""
	} : null;
}
function triggerToAlarmInterval(eventStart, triggerValue) {
	if (triggerValue.endsWith("Z")) {
		const triggerTime = parseTime(triggerValue).date;
		const tillEvent = eventStart.getTime() - triggerTime.getTime();
		const minutes = Duration.fromMillis(tillEvent).as("minutes");
		return {
			unit: AlarmIntervalUnit.MINUTE,
			value: minutes
		};
	} else {
		const duration = parseDuration(triggerValue);
		if (duration.positive) return null;
		let smallestUnit = AlarmIntervalUnit.MINUTE;
		if (duration.week) smallestUnit = AlarmIntervalUnit.WEEK;
		if (duration.day) smallestUnit = AlarmIntervalUnit.DAY;
		if (duration.hour) smallestUnit = AlarmIntervalUnit.HOUR;
		if (duration.minute) smallestUnit = AlarmIntervalUnit.MINUTE;
		const luxonDuration = {
			week: duration.week,
			day: duration.day,
			minute: duration.minute,
			hour: duration.hour
		};
		let value;
		switch (smallestUnit) {
			case AlarmIntervalUnit.WEEK:
				value = Duration.fromObject(luxonDuration).as("weeks");
				break;
			case AlarmIntervalUnit.DAY:
				value = Duration.fromObject(luxonDuration).as("days");
				break;
			case AlarmIntervalUnit.HOUR:
				value = Duration.fromObject(luxonDuration).as("hours");
				break;
			case AlarmIntervalUnit.MINUTE:
				value = Duration.fromObject(luxonDuration).as("minutes");
				break;
		}
		return {
			unit: smallestUnit,
			value
		};
	}
}
function parseRrule(rawRruleValue, tzId) {
	let rruleValue;
	try {
		rruleValue = parsePropertyKeyValue(rawRruleValue);
	} catch (e) {
		if (e instanceof ParserError) throw new ParserError("RRULE is not an object " + e.message);
else throw e;
	}
	const frequency = icalFrequencyToRepeatPeriod(rruleValue["FREQ"]);
	const until = rruleValue["UNTIL"] ? parseUntilRruleTime(rruleValue["UNTIL"], tzId) : null;
	const count = rruleValue["COUNT"] ? parseInt(rruleValue["COUNT"]) : null;
	const endType = until != null ? EndType.UntilDate : count != null ? EndType.Count : EndType.Never;
	const interval = rruleValue["INTERVAL"] ? parseInt(rruleValue["INTERVAL"]) : 1;
	const repeatRule = createRepeatRule({
		endValue: until ? String(until.getTime()) : count ? String(count) : null,
		endType,
		interval: String(interval),
		frequency,
		excludedDates: [],
		timeZone: "",
		advancedRules: parseAdvancedRule(rruleValue)
	});
	if (typeof tzId === "string") repeatRule.timeZone = tzId;
	return repeatRule;
}
function parseAdvancedRule(rrule) {
	const advancedRepeatRules = [];
	for (const rruleKey in rrule) {
		if (!BYRULE_MAP.has(rruleKey)) continue;
		for (const interval of rrule[rruleKey].split(",")) {
			if (interval === "") continue;
			advancedRepeatRules.push(createCalendarAdvancedRepeatRule({
				ruleType: BYRULE_MAP.get(rruleKey).toString(),
				interval
			}));
		}
	}
	return advancedRepeatRules;
}
function parseExDates(excludedDatesProps) {
	const allExDates = new Map();
	for (let excludedDatesProp of excludedDatesProps) {
		const tzId = getTzId(excludedDatesProp);
		const values = separatedByCommaParser(new StringIterator(excludedDatesProp.value));
		for (let value of values) {
			const { date: exDate } = parseTime(value, tzId ?? undefined);
			allExDates.set(exDate.getTime(), createDateWrapper({ date: exDate }));
		}
	}
	return [...allExDates.values()].sort((dateWrapper1, dateWrapper2) => dateWrapper1.date.getTime() - dateWrapper2.date.getTime());
}
function parseRecurrenceId(recurrenceIdProp, tzId) {
	const components = parseTimeIntoComponents(recurrenceIdProp.value);
	const filledComponents = components;
	const allDay = !("minute" in components);
	const effectiveZone = allDay ? "UTC" : components.zone ?? getTzId(recurrenceIdProp) ?? tzId ?? undefined;
	delete filledComponents["zone"];
	const luxonDate = DateTime.fromObject(filledComponents, { zone: effectiveZone });
	return toValidJSDate(luxonDate, recurrenceIdProp.value, tzId);
}
/**
* @returns new end time
*/
function parseEventDuration(durationValue, startTime) {
	const duration = parseDuration(durationValue);
	let durationInMillis = 0;
	if (duration.week) durationInMillis += DAY_IN_MILLIS * 7 * duration.week;
	if (duration.day) durationInMillis += DAY_IN_MILLIS * duration.day;
	if (duration.hour) durationInMillis += 36e5 * duration.hour;
	if (duration.minute) durationInMillis += 6e4 * duration.minute;
	return new Date(startTime.getTime() + durationInMillis);
}
function getTzId(prop) {
	let tzId = null;
	const tzIdValue = prop.params["TZID"];
	if (tzIdValue) {
		if (IANAZone.isValidZone(tzIdValue)) tzId = tzIdValue;
else if (tzIdValue in WindowsZones_default) tzId = WindowsZones_default[tzIdValue];
	}
	return tzId;
}
function oneDayDurationEnd(startTime, allDay, tzId, zone) {
	return DateTime.fromJSDate(startTime, { zone: allDay ? "UTC" : tzId || zone }).plus({ day: 1 }).toJSDate();
}
const MAILTO_PREFIX_REGEX = /^mailto:(.*)/i;
function parseMailtoValue(value) {
	const match = value.match(MAILTO_PREFIX_REGEX);
	return match && match[1];
}
const calendarAttendeeStatusToParstat = {
	[CalendarAttendeeStatus.ADDED]: "NEEDS-ACTION",
	[CalendarAttendeeStatus.NEEDS_ACTION]: "NEEDS-ACTION",
	[CalendarAttendeeStatus.ACCEPTED]: "ACCEPTED",
	[CalendarAttendeeStatus.DECLINED]: "DECLINED",
	[CalendarAttendeeStatus.TENTATIVE]: "TENTATIVE"
};
const parstatToCalendarAttendeeStatus = reverse(calendarAttendeeStatusToParstat);
function parseCalendarEvents(icalObject, zone) {
	const methodProp = getProp(icalObject, "METHOD", true);
	const method = methodProp ? methodProp.value : CalendarMethod.PUBLISH;
	const eventObjects = icalObject.children.filter((obj) => obj.type === "VEVENT");
	const contents = getContents(eventObjects, zone);
	return {
		method,
		contents
	};
}
function getContents(eventObjects, zone) {
	return eventObjects.map((eventObj, index) => {
		const startProp = getProp(eventObj, "DTSTART", false);
		const tzId = getTzId(startProp);
		const { date: startTime, allDay } = parseTime(startProp.value, tzId ?? undefined);
		let hasValidUid = false;
		let uid = null;
		try {
			uid = getPropStringValue(eventObj, "UID", false);
			hasValidUid = true;
		} catch (e) {
			if (e instanceof ParserError) uid = `import-${Date.now()}-${index}@tuta.com`;
else throw e;
		}
		const recurrenceIdProp = getProp(eventObj, "RECURRENCE-ID", true);
		let recurrenceId = null;
		if (recurrenceIdProp != null && hasValidUid) recurrenceId = parseRecurrenceId(recurrenceIdProp, tzId);
		const endTime = parseEndTime(eventObj, allDay, startTime, tzId, zone);
		let summary = "";
		const maybeSummary = parseICalText(eventObj, "SUMMARY");
		if (maybeSummary) summary = maybeSummary;
		let location = "";
		const maybeLocation = parseICalText(eventObj, "LOCATION");
		if (maybeLocation) location = maybeLocation;
		const rruleProp = getPropStringValue(eventObj, "RRULE", true);
		const excludedDateProps = eventObj.properties.filter((p) => p.name === "EXDATE");
		let repeatRule = null;
		if (rruleProp != null) {
			repeatRule = parseRrule(rruleProp, tzId);
			repeatRule.excludedDates = parseExDates(excludedDateProps);
		}
		const description = parseICalText(eventObj, "DESCRIPTION") ?? "";
		const sequenceProp = getProp(eventObj, "SEQUENCE", true);
		let sequence = "0";
		if (sequenceProp) {
			const sequenceNumber = filterInt(sequenceProp.value);
			if (Number.isNaN(sequenceNumber)) throw new ParserError("SEQUENCE value is not a number");
			sequence = String(sequenceNumber);
		}
		const attendees = getAttendees(eventObj);
		const organizerProp = getProp(eventObj, "ORGANIZER", true);
		let organizer = null;
		if (organizerProp) {
			const organizerAddress = parseMailtoValue(organizerProp.value);
			if (organizerAddress && isMailAddress(organizerAddress, false)) organizer = createEncryptedMailAddress({
				address: organizerAddress,
				name: organizerProp.params["name"] || ""
			});
else console.log("organizer has no address or address is invalid, ignoring: ", organizerAddress);
		}
		const event = createCalendarEvent({
			description,
			startTime,
			endTime,
			uid,
			recurrenceId,
			summary,
			location,
			repeatRule,
			sequence,
			attendees,
			organizer,
			hashedUid: null,
			invitedConfidentially: null,
			alarmInfos: []
		});
		let alarms = [];
		try {
			alarms = getAlarms(eventObj, startTime);
		} catch (e) {
			console.log("alarm is invalid for event: ", event.summary, event.startTime);
		}
		return {
			event,
			alarms
		};
	});
}
function getAttendees(eventObj) {
	let attendees = [];
	for (const property of eventObj.properties) if (property.name === "ATTENDEE") {
		const attendeeAddress = parseMailtoValue(property.value);
		if (!attendeeAddress || !isMailAddress(attendeeAddress, false)) {
			console.log("attendee has no address or address is invalid, ignoring: ", attendeeAddress);
			continue;
		}
		const partStatString = property.params["PARTSTAT"];
		const status = partStatString ? parstatToCalendarAttendeeStatus[partStatString] : CalendarAttendeeStatus.NEEDS_ACTION;
		if (!status) {
			console.log(`attendee has invalid partsat: ${partStatString}, ignoring`);
			continue;
		}
		attendees.push(createCalendarEventAttendee({
			address: createEncryptedMailAddress({
				address: attendeeAddress,
				name: property.params["CN"] || ""
			}),
			status
		}));
	}
	return attendees;
}
function getAlarms(eventObj, startTime) {
	const alarms = [];
	for (const alarmChild of eventObj.children) if (alarmChild.type === "VALARM") {
		const newAlarm = parseAlarm(alarmChild, startTime);
		if (newAlarm) alarms.push(newAlarm);
	}
	return alarms;
}
/**
* Parses text properties according to the iCal standard.
* https://icalendar.org/iCalendar-RFC-5545/3-3-11-text.html
* @param eventObj
* @param tag
*/
function parseICalText(eventObj, tag) {
	let text = getPropStringValue(eventObj, tag, true);
	for (const rawEscape in revICalReplacements) {
		if (rawEscape === "\\n") text = text?.replace("\\N", revICalReplacements[rawEscape]);
		text = text?.replace(rawEscape, revICalReplacements[rawEscape]);
	}
	return text;
}
function parseEndTime(eventObj, allDay, startTime, tzId, zone) {
	const endProp = getProp(eventObj, "DTEND", true);
	if (endProp) {
		if (typeof endProp.value !== "string") throw new ParserError("DTEND value is not a string");
		const endTzId = getTzId(endProp);
		const parsedEndTime = parseTime(endProp.value, typeof endTzId === "string" ? endTzId : undefined);
		const endTime = parsedEndTime.date;
		if (endTime > startTime) return endTime;
		if (allDay) return DateTime.fromJSDate(startTime).plus({ day: 1 }).toJSDate();
else return DateTime.fromJSDate(startTime).plus({ second: 1 }).toJSDate();
	} else {
		const durationValue = getPropStringValue(eventObj, "DURATION", true);
		if (durationValue) return parseEventDuration(durationValue, startTime);
else return oneDayDurationEnd(startTime, allDay, tzId, zone);
	}
}
function icalFrequencyToRepeatPeriod(value) {
	const convertedValue = {
		DAILY: RepeatPeriod.DAILY,
		WEEKLY: RepeatPeriod.WEEKLY,
		MONTHLY: RepeatPeriod.MONTHLY,
		YEARLY: RepeatPeriod.ANNUALLY
	}[value];
	if (convertedValue == null) throw new ParserError("Invalid frequency: " + value);
	return convertedValue;
}
function repeatPeriodToIcalFrequency(repeatPeriod) {
	const mapping = {
		[RepeatPeriod.DAILY]: "DAILY",
		[RepeatPeriod.WEEKLY]: "WEEKLY",
		[RepeatPeriod.MONTHLY]: "MONTHLY",
		[RepeatPeriod.ANNUALLY]: "YEARLY"
	};
	return mapping[repeatPeriod];
}
function parseTimeIntoComponents(value) {
	const trimmedValue = value.trim();
	if (/[0-9]{8}T[0-9]{6}Z/.test(trimmedValue)) {
		const { year, month, day } = parseDateString(trimmedValue);
		const hour = parseInt(trimmedValue.slice(9, 11));
		const minute = parseInt(trimmedValue.slice(11, 13));
		return {
			year,
			month,
			day,
			hour,
			minute,
			zone: "UTC"
		};
	} else if (/[0-9]{8}T[0-9]{6}/.test(trimmedValue)) {
		const { year, month, day } = parseDateString(trimmedValue);
		const hour = parseInt(trimmedValue.slice(9, 11));
		const minute = parseInt(trimmedValue.slice(11, 13));
		return {
			year,
			month,
			day,
			hour,
			minute
		};
	} else if (/[0-9]{8}/.test(trimmedValue)) return Object.assign({}, parseDateString(trimmedValue));
else throw new ParserError("Failed to parse time: " + trimmedValue);
}
function parseUntilRruleTime(value, zone) {
	const components = parseTimeIntoComponents(value);
	const filledComponents = components;
	const allDay = !("minute" in components);
	const effectiveZone = allDay ? "UTC" : zone ?? undefined;
	delete filledComponents["zone"];
	const luxonDate = DateTime.fromObject(filledComponents, { zone: effectiveZone });
	const startOfNextDay = luxonDate.plus({ day: 1 }).startOf("day");
	return toValidJSDate(startOfNextDay, value, zone);
}
function parseTime(value, zone) {
	const components = parseTimeIntoComponents(value);
	const allDay = !("minute" in components);
	const effectiveZone = allDay ? "UTC" : components.zone ?? zone;
	delete components["zone"];
	const filledComponents = Object.assign({}, allDay ? {
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	} : {}, components);
	try {
		const dateTime = DateTime.fromObject(filledComponents, { zone: effectiveZone });
		return {
			date: toValidJSDate(dateTime, value, zone ?? null),
			allDay
		};
	} catch (e) {
		if (e instanceof ParserError) throw e;
		throw new ParserError(`failed to parse time from ${value} to ${JSON.stringify(filledComponents)}, effectiveZone: ${effectiveZone}, original error: ${e.message}`);
	}
}
function toValidJSDate(dateTime, value, zone) {
	if (!dateTime.isValid) throw new ParserError(`Date value ${value} is invalid in zone ${String(zone)}`);
	return dateTime.toJSDate();
}
function parsePropertyName(iterator) {
	let text = "";
	let next;
	while ((next = iterator.peek()) && /[a-zA-Z0-9-_]/.test(next)) text += neverNull(iterator.next().value);
	if (text === "") throw new ParserError("could not parse property name: " + iterator.peek());
	return text;
}
const secondDurationParser = combineParsers(numberParser, makeCharacterParser("S"));
const minuteDurationParser = combineParsers(numberParser, makeCharacterParser("M"));
const hourDurationParser = combineParsers(numberParser, makeCharacterParser("H"));
const durationTimeParser = mapParser(combineParsers(makeCharacterParser("T"), maybeParse(hourDurationParser), maybeParse(minuteDurationParser), maybeParse(secondDurationParser)), (parsed) => {
	let hour, minute;
	if (parsed[1]) hour = parsed[1][0];
	if (parsed[2]) minute = parsed[2][0];
	return {
		hour,
		minute
	};
});
const durationDayParser = combineParsers(numberParser, makeCharacterParser("D"));
const durationWeekParser = combineParsers(numberParser, makeCharacterParser("W"));
const durationParser = mapParser(combineParsers(maybeParse(makeEitherParser(makeCharacterParser("+"), makeCharacterParser("-"))), makeCharacterParser("P"), maybeParse(durationWeekParser), maybeParse(durationDayParser), maybeParse(durationTimeParser)), (parsed) => {
	const positive = parsed[0] !== "-";
	let week, day, hour, minute;
	if (parsed[2]) week = parsed[2][0];
	if (parsed[3]) day = parsed[3][0];
	return {
		positive,
		week,
		day,
		hour: parsed[4]?.hour,
		minute: parsed[4]?.minute
	};
});
function parseDuration(value) {
	const iterator = new StringIterator(value);
	const duration = durationParser(iterator);
	if (iterator.peek()) throw new ParserError("Could not parse duration completely");
	return duration;
}

//#endregion
//#region src/common/calendar/import/ImportExportUtils.ts
let EventImportRejectionReason = function(EventImportRejectionReason$1) {
	EventImportRejectionReason$1[EventImportRejectionReason$1["Pre1970"] = 0] = "Pre1970";
	EventImportRejectionReason$1[EventImportRejectionReason$1["Inversed"] = 1] = "Inversed";
	EventImportRejectionReason$1[EventImportRejectionReason$1["InvalidDate"] = 2] = "InvalidDate";
	EventImportRejectionReason$1[EventImportRejectionReason$1["Duplicate"] = 3] = "Duplicate";
	return EventImportRejectionReason$1;
}({});
/** check if the event should be skipped because it's invalid or already imported. if not, add it to the map. */
function shouldBeSkipped(event, instanceIdentifierToEventMap) {
	if (!event.uid) throw new Error("Uid is not set for imported event");
	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate: return EventImportRejectionReason.InvalidDate;
		case CalendarEventValidity.InvalidEndBeforeStart: return EventImportRejectionReason.Inversed;
		case CalendarEventValidity.InvalidPre1970: return EventImportRejectionReason.Pre1970;
	}
	const instanceIdentifier = makeInstanceIdentifier(event);
	if (!instanceIdentifierToEventMap.has(instanceIdentifier)) {
		instanceIdentifierToEventMap.set(instanceIdentifier, event);
		return null;
	} else return EventImportRejectionReason.Duplicate;
}
/** we try to enforce that each calendar only contains each uid once, but we need to take into consideration
* that altered instances have the same uid as their progenitor.*/
function makeInstanceIdentifier(event) {
	return `${event.uid}-${event.recurrenceId?.getTime() ?? "progenitor"}`;
}
function sortOutParsedEvents(parsedEvents, existingEvents, calendarGroupRoot, zone) {
	const instanceIdentifierToEventMap = new Map();
	for (const existingEvent of existingEvents) {
		if (existingEvent.uid == null) continue;
		instanceIdentifierToEventMap.set(makeInstanceIdentifier(existingEvent), existingEvent);
	}
	const rejectedEvents = new Map();
	const eventsForCreation = [];
	for (const [_, flatParsedEvents] of groupBy(parsedEvents, (e) => e.event.uid)) {
		let progenitor = null;
		let alteredInstances = [];
		for (const { event, alarms } of flatParsedEvents) {
			if (flatParsedEvents.length > 1) console.warn("[ImportExportUtils] Found events with same uid: flatParsedEvents with more than one entry", { flatParsedEvents });
			const rejectionReason = shouldBeSkipped(event, instanceIdentifierToEventMap);
			if (rejectionReason != null) {
				getFromMap(rejectedEvents, rejectionReason, () => []).push(event);
				continue;
			}
			const repeatRule = event.repeatRule;
			event._ownerGroup = calendarGroupRoot._id;
			if (repeatRule != null && repeatRule.timeZone === "") repeatRule.timeZone = getTimeZone();
			for (let alarmInfo of alarms) alarmInfo.alarmIdentifier = generateEventElementId(Date.now());
			assignEventId(event, zone, calendarGroupRoot);
			if (event.recurrenceId == null) progenitor = {
				event,
				alarms
			};
else {
				if (progenitor?.event.repeatRule != null) insertIntoSortedArray(createDateWrapper({ date: event.recurrenceId }), progenitor.event.repeatRule.excludedDates, (left, right) => left.date.getTime() - right.date.getTime(), () => true);
				alteredInstances.push({
					event,
					alarms
				});
			}
		}
		if (progenitor != null) eventsForCreation.push(progenitor);
		eventsForCreation.push(...alteredInstances);
	}
	return {
		rejectedEvents,
		eventsForCreation
	};
}
function parseCalendarStringData(value, zone) {
	const tree = parseICalendar(value);
	return parseCalendarEvents(tree, zone);
}
function isIcal(iCalStr) {
	return iCalStr.trimStart().split(/\r?\n/, 1)[0] === "BEGIN:VCALENDAR";
}
function getExternalCalendarName(iCalStr) {
	let calName = iCalStr.match(/X-WR-CALNAME:(.*)\r?\n/);
	const name = calName ? calName[1] : iCalStr.match(/PRODID:-\/\/(.*)\/\//)?.[1];
	return name ?? lang.get("noTitle_label");
}
let SyncStatus = function(SyncStatus$1) {
	SyncStatus$1["Failed"] = "Failed";
	SyncStatus$1["Success"] = "Success";
	return SyncStatus$1;
}({});
function checkURLString(url) {
	const assertResult = assertValidURL(url);
	if (!assertResult) return "invalidURL_msg";
	if (!hasValidProtocol(assertResult, ["https:"])) return "invalidURLProtocol_msg";
	return assertResult;
}
function hasValidProtocol(url, validProtocols) {
	return validProtocols.includes(url.protocol);
}
let ByRule = function(ByRule$1) {
	ByRule$1[ByRule$1["BYMINUTE"] = 0] = "BYMINUTE";
	ByRule$1[ByRule$1["BYHOUR"] = 1] = "BYHOUR";
	ByRule$1[ByRule$1["BYDAY"] = 2] = "BYDAY";
	ByRule$1[ByRule$1["BYMONTHDAY"] = 3] = "BYMONTHDAY";
	ByRule$1[ByRule$1["BYYEARDAY"] = 4] = "BYYEARDAY";
	ByRule$1[ByRule$1["BYWEEKNO"] = 5] = "BYWEEKNO";
	ByRule$1[ByRule$1["BYMONTH"] = 6] = "BYMONTH";
	ByRule$1[ByRule$1["BYSETPOS"] = 7] = "BYSETPOS";
	ByRule$1[ByRule$1["WKST"] = 8] = "WKST";
	return ByRule$1;
}({});
const BYRULE_MAP = freezeMap(new Map([
	["BYMINUTE", ByRule.BYMINUTE],
	["BYHOUR", ByRule.BYHOUR],
	["BYDAY", ByRule.BYDAY],
	["BYMONTHDAY", ByRule.BYMONTHDAY],
	["BYYEARDAY", ByRule.BYYEARDAY],
	["BYWEEKNO", ByRule.BYWEEKNO],
	["BYMONTH", ByRule.BYMONTH],
	["BYSETPOS", ByRule.BYSETPOS],
	["WKST", ByRule.WKST]
]));

//#endregion
export { EventImportRejectionReason, SyncStatus, calendarAttendeeStatusToParstat, checkURLString, getExternalCalendarName, iCalReplacements, isIcal, parseCalendarStringData, repeatPeriodToIcalFrequency, sortOutParsedEvents };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW1wb3J0RXhwb3J0VXRpbHMtY2h1bmsuanMiLCJuYW1lcyI6WyJkYXRlU3RyaW5nOiBzdHJpbmciLCJvYmo6IElDYWxPYmplY3QiLCJ0YWc6IHN0cmluZyIsIm9wdGlvbmFsOiBib29sZWFuIiwicGFyYW1ldGVyU3RyaW5nVmFsdWVQYXJzZXI6IFBhcnNlcjxzdHJpbmc+IiwiZXNjYXBlZFN0cmluZ1ZhbHVlUGFyc2VyOiBQYXJzZXI8c3RyaW5nPiIsIml0ZXJhdG9yOiBTdHJpbmdJdGVyYXRvciIsInByb3BlcnR5UGFyYW1ldGVyc0tleVZhbHVlUGFyc2VyOiBQYXJzZXI8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPiIsImFueVN0cmluZ1VuZXNjYXBlUGFyc2VyOiBQYXJzZXI8c3RyaW5nPiIsImxhc3RDaGFyYWN0ZXI6IHN0cmluZyB8IG51bGwiLCJwcm9wZXJ0eVN0cmluZ1ZhbHVlUGFyc2VyOiBQYXJzZXI8c3RyaW5nPiIsInNlcGFyYXRlZEJ5Q29tbWFQYXJzZXI6IFBhcnNlcjxBcnJheTxzdHJpbmc+PiIsInByb3BlcnR5U2VxdWVuY2VQYXJzZXI6IFBhcnNlcjxbc3RyaW5nLCBbc3RyaW5nLCBBcnJheTxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ10+XSB8IG51bGwsIHN0cmluZywgc3RyaW5nXT4iLCJkYXRhOiBzdHJpbmciLCJwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4iLCJuYW1lIiwidmFsdWUiLCJwcm9wZXJ0eUtleVZhbHVlUGFyc2VyOiBQYXJzZXI8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPiIsInZhbHVlc1NlcGFyYXRlZEJ5U2VtaWNvbG9uUGFyc2VyOiBQYXJzZXI8QXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPj4iLCJyZXN1bHQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4iLCJpdGVyYXRvcjogSXRlcmF0b3I8c3RyaW5nPiIsInByb3BlcnRpZXM6IFByb3BlcnR5W10iLCJjaGlsZHJlbjogSUNhbE9iamVjdFtdIiwic3RyaW5nRGF0YTogc3RyaW5nIiwiYWxhcm1PYmplY3Q6IElDYWxPYmplY3QiLCJzdGFydFRpbWU6IERhdGUiLCJhbGFybUludGVydmFsOiBBbGFybUludGVydmFsIHwgbnVsbCIsImV2ZW50U3RhcnQ6IERhdGUiLCJ0cmlnZ2VyVmFsdWU6IHN0cmluZyIsInNtYWxsZXN0VW5pdDogQWxhcm1JbnRlcnZhbFVuaXQiLCJyYXdScnVsZVZhbHVlOiBzdHJpbmciLCJ0eklkOiBzdHJpbmcgfCBudWxsIiwiZW5kVHlwZTogRW5kVHlwZSIsInJydWxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IiwiYWR2YW5jZWRSZXBlYXRSdWxlczogQ2FsZW5kYXJBZHZhbmNlZFJlcGVhdFJ1bGVbXSIsImV4Y2x1ZGVkRGF0ZXNQcm9wczogUHJvcGVydHlbXSIsImFsbEV4RGF0ZXM6IE1hcDxudW1iZXIsIERhdGVXcmFwcGVyPiIsInJlY3VycmVuY2VJZFByb3A6IFByb3BlcnR5IiwiZHVyYXRpb25WYWx1ZTogc3RyaW5nIiwicHJvcDogUHJvcGVydHkiLCJXaW5kb3dzWm9uZXMiLCJhbGxEYXk6IGJvb2xlYW4iLCJ6b25lOiBzdHJpbmciLCJ2YWx1ZTogc3RyaW5nIiwiY2FsZW5kYXJBdHRlbmRlZVN0YXR1c1RvUGFyc3RhdDogUmVjb3JkPENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsIHN0cmluZz4iLCJwYXJzdGF0VG9DYWxlbmRhckF0dGVuZGVlU3RhdHVzOiBSZWNvcmQ8c3RyaW5nLCBDYWxlbmRhckF0dGVuZGVlU3RhdHVzPiIsImljYWxPYmplY3Q6IElDYWxPYmplY3QiLCJldmVudE9iamVjdHM6IElDYWxPYmplY3RbXSIsInVpZDogc3RyaW5nIHwgbnVsbCIsInJlY3VycmVuY2VJZDogRGF0ZSB8IG51bGwiLCJzdW1tYXJ5OiBzdHJpbmciLCJsb2NhdGlvbjogc3RyaW5nIiwicmVwZWF0UnVsZTogUmVwZWF0UnVsZSB8IG51bGwiLCJzZXF1ZW5jZTogc3RyaW5nIiwib3JnYW5pemVyOiBFbmNyeXB0ZWRNYWlsQWRkcmVzcyB8IG51bGwiLCJhbGFybXM6IEFsYXJtSW5mb1RlbXBsYXRlW10iLCJldmVudE9iajogSUNhbE9iamVjdCIsImF0dGVuZGVlczogQ2FsZW5kYXJFdmVudEF0dGVuZGVlW10iLCJyZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCIsIm1hcHBpbmc6IFJlY29yZDxSZXBlYXRQZXJpb2QsIHN0cmluZz4iLCJ6b25lOiBzdHJpbmcgfCBudWxsIiwiem9uZT86IHN0cmluZyIsImRhdGVUaW1lOiBEYXRlVGltZSIsInNlY29uZER1cmF0aW9uUGFyc2VyOiBQYXJzZXI8W251bWJlciwgc3RyaW5nXT4iLCJtaW51dGVEdXJhdGlvblBhcnNlcjogUGFyc2VyPFtudW1iZXIsIHN0cmluZ10+IiwiaG91ckR1cmF0aW9uUGFyc2VyOiBQYXJzZXI8W251bWJlciwgc3RyaW5nXT4iLCJkdXJhdGlvbkRheVBhcnNlcjogUGFyc2VyPFtudW1iZXIsIHN0cmluZ10+IiwiZHVyYXRpb25XZWVrUGFyc2VyOiBQYXJzZXI8W251bWJlciwgc3RyaW5nXT4iLCJldmVudDogQ2FsZW5kYXJFdmVudCIsImluc3RhbmNlSWRlbnRpZmllclRvRXZlbnRNYXA6IE1hcDxzdHJpbmcsIENhbGVuZGFyRXZlbnQ+IiwicGFyc2VkRXZlbnRzOiBQYXJzZWRFdmVudFtdIiwiZXhpc3RpbmdFdmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+IiwiY2FsZW5kYXJHcm91cFJvb3Q6IENhbGVuZGFyR3JvdXBSb290Iiwiem9uZTogc3RyaW5nIiwicmVqZWN0ZWRFdmVudHM6IFJlamVjdGVkRXZlbnRzIiwiZXZlbnRzRm9yQ3JlYXRpb246IEFycmF5PHsgZXZlbnQ6IENhbGVuZGFyRXZlbnQ7IGFsYXJtczogQXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+IH0+IiwicHJvZ2VuaXRvcjogeyBldmVudDogQ2FsZW5kYXJFdmVudDsgYWxhcm1zOiBBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4gfSB8IG51bGwiLCJhbHRlcmVkSW5zdGFuY2VzOiBBcnJheTx7IGV2ZW50OiBDYWxlbmRhckV2ZW50OyBhbGFybXM6IEFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPiB9PiIsInZhbHVlOiBzdHJpbmciLCJpQ2FsU3RyOiBzdHJpbmciLCJ1cmw6IHN0cmluZyIsInVybDogVVJMIiwidmFsaWRQcm90b2NvbHM6IHN0cmluZ1tdIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9leHBvcnQvV2luZG93c1pvbmVzLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9leHBvcnQvQ2FsZW5kYXJQYXJzZXIudHMiLCIuLi9zcmMvY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9JbXBvcnRFeHBvcnRVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBdXRvZ2VuZXJhdGVkIGZpbGUgd2l0aCBtYXBwaW5nIGZyb20gV2luZG93cyB6b25lcyB0byBJQU5BIHpvbmVzXG4vLyBTZWUgVW5pY29kZSBDTERSIHByb2plY3RcbmV4cG9ydCBkZWZhdWx0IHtcblx0XCJBZmdoYW5pc3RhbiBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9LYWJ1bFwiLFxuXHRcIkFsYXNrYW4gU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvQW5jaG9yYWdlXCIsXG5cdFwiQWxldXRpYW4gU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvQWRha1wiLFxuXHRcIkFsdGFpIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0Jhcm5hdWxcIixcblx0XCJBcmFiIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL1JpeWFkaFwiLFxuXHRcIkFyYWJpYW4gU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvRHViYWlcIixcblx0XCJBcmFiaWMgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvQmFnaGRhZFwiLFxuXHRcIkFyZ2VudGluYSBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9CdWVub3NfQWlyZXNcIixcblx0XCJBc3RyYWtoYW4gU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9Bc3RyYWtoYW5cIixcblx0XCJBdGxhbnRpYyBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9IYWxpZmF4XCIsXG5cdFwiQVVTIENlbnRyYWwgU3RhbmRhcmQgVGltZVwiOiBcIkF1c3RyYWxpYS9EYXJ3aW5cIixcblx0XCJBdXMgQ2VudHJhbCBXLiBTdGFuZGFyZCBUaW1lXCI6IFwiQXVzdHJhbGlhL0V1Y2xhXCIsXG5cdFwiQVVTIEVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiOiBcIkF1c3RyYWxpYS9TeWRuZXlcIixcblx0XCJBemVyYmFpamFuIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0Jha3VcIixcblx0XCJBem9yZXMgU3RhbmRhcmQgVGltZVwiOiBcIkF0bGFudGljL0F6b3Jlc1wiLFxuXHRcIkJhaGlhIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL0JhaGlhXCIsXG5cdFwiQmFuZ2xhZGVzaCBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9EaGFrYVwiLFxuXHRcIkJlbGFydXMgU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9NaW5za1wiLFxuXHRcIkJvdWdhaW52aWxsZSBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9Cb3VnYWludmlsbGVcIixcblx0XCJDYW5hZGEgQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9SZWdpbmFcIixcblx0XCJDYXBlIFZlcmRlIFN0YW5kYXJkIFRpbWVcIjogXCJBdGxhbnRpYy9DYXBlX1ZlcmRlXCIsXG5cdFwiQ2F1Y2FzdXMgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvWWVyZXZhblwiLFxuXHRcIkNlbi4gQXVzdHJhbGlhIFN0YW5kYXJkIFRpbWVcIjogXCJBdXN0cmFsaWEvQWRlbGFpZGVcIixcblx0XCJDZW50cmFsIEFtZXJpY2EgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvR3VhdGVtYWxhXCIsXG5cdFwiQ2VudHJhbCBBc2lhIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0FsbWF0eVwiLFxuXHRcIkNlbnRyYWwgQnJhemlsaWFuIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL0N1aWFiYVwiLFxuXHRcIkNlbnRyYWwgRXVyb3BlIFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvQnVkYXBlc3RcIixcblx0XCJDZW50cmFsIEV1cm9wZWFuIFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvV2Fyc2F3XCIsXG5cdFwiQ2VudHJhbCBQYWNpZmljIFN0YW5kYXJkIFRpbWVcIjogXCJQYWNpZmljL0d1YWRhbGNhbmFsXCIsXG5cdFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9DaGljYWdvXCIsXG5cdFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lIChNZXhpY28pXCI6IFwiQW1lcmljYS9NZXhpY29fQ2l0eVwiLFxuXHRcIkNoYXRoYW0gSXNsYW5kcyBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9DaGF0aGFtXCIsXG5cdFwiQ2hpbmEgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvU2hhbmdoYWlcIixcblx0XCJDdWJhIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL0hhdmFuYVwiLFxuXHRcIkRhdGVsaW5lIFN0YW5kYXJkIFRpbWVcIjogXCJFdGMvR01UKzEyXCIsXG5cdFwiRS4gQWZyaWNhIFN0YW5kYXJkIFRpbWVcIjogXCJBZnJpY2EvTmFpcm9iaVwiLFxuXHRcIkUuIEF1c3RyYWxpYSBTdGFuZGFyZCBUaW1lXCI6IFwiQXVzdHJhbGlhL0JyaXNiYW5lXCIsXG5cdFwiRS4gRXVyb3BlIFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvQ2hpc2luYXVcIixcblx0XCJFLiBTb3V0aCBBbWVyaWNhIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL1Nhb19QYXVsb1wiLFxuXHRcIkVhc3RlciBJc2xhbmQgU3RhbmRhcmQgVGltZVwiOiBcIlBhY2lmaWMvRWFzdGVyXCIsXG5cdFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9OZXdfWW9ya1wiLFxuXHRcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZSAoTWV4aWNvKVwiOiBcIkFtZXJpY2EvQ2FuY3VuXCIsXG5cdFwiRWd5cHQgU3RhbmRhcmQgVGltZVwiOiBcIkFmcmljYS9DYWlyb1wiLFxuXHRcIkVrYXRlcmluYnVyZyBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9ZZWthdGVyaW5idXJnXCIsXG5cdFwiRmlqaSBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9GaWppXCIsXG5cdFwiRkxFIFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvS2lldlwiLFxuXHRcIkdlb3JnaWFuIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL1RiaWxpc2lcIixcblx0XCJHTVQgU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9Mb25kb25cIixcblx0XCJHcmVlbmxhbmQgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvR29kdGhhYlwiLFxuXHRcIkdyZWVud2ljaCBTdGFuZGFyZCBUaW1lXCI6IFwiQXRsYW50aWMvUmV5a2phdmlrXCIsXG5cdFwiR1RCIFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvQnVjaGFyZXN0XCIsXG5cdFwiSGFpdGkgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvUG9ydC1hdS1QcmluY2VcIixcblx0XCJIYXdhaWlhbiBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9Ib25vbHVsdVwiLFxuXHRcIkluZGlhIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0NhbGN1dHRhXCIsXG5cdFwiSXJhbiBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9UZWhyYW5cIixcblx0XCJJc3JhZWwgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvSmVydXNhbGVtXCIsXG5cdFwiSm9yZGFuIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0FtbWFuXCIsXG5cdFwiS2FsaW5pbmdyYWQgU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9LYWxpbmluZ3JhZFwiLFxuXHRcIktvcmVhIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL1Nlb3VsXCIsXG5cdFwiTGlieWEgU3RhbmRhcmQgVGltZVwiOiBcIkFmcmljYS9Ucmlwb2xpXCIsXG5cdFwiTGluZSBJc2xhbmRzIFN0YW5kYXJkIFRpbWVcIjogXCJQYWNpZmljL0tpcml0aW1hdGlcIixcblx0XCJMb3JkIEhvd2UgU3RhbmRhcmQgVGltZVwiOiBcIkF1c3RyYWxpYS9Mb3JkX0hvd2VcIixcblx0XCJNYWdhZGFuIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL01hZ2FkYW5cIixcblx0XCJNYWdhbGxhbmVzIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL1B1bnRhX0FyZW5hc1wiLFxuXHRcIk1hcnF1ZXNhcyBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9NYXJxdWVzYXNcIixcblx0XCJNYXVyaXRpdXMgU3RhbmRhcmQgVGltZVwiOiBcIkluZGlhbi9NYXVyaXRpdXNcIixcblx0XCJNaWRkbGUgRWFzdCBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9CZWlydXRcIixcblx0XCJNb250ZXZpZGVvIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL01vbnRldmlkZW9cIixcblx0XCJNb3JvY2NvIFN0YW5kYXJkIFRpbWVcIjogXCJBZnJpY2EvQ2FzYWJsYW5jYVwiLFxuXHRcIk1vdW50YWluIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL0RlbnZlclwiLFxuXHRcIk1vdW50YWluIFN0YW5kYXJkIFRpbWUgKE1leGljbylcIjogXCJBbWVyaWNhL0NoaWh1YWh1YVwiLFxuXHRcIk15YW5tYXIgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvUmFuZ29vblwiLFxuXHRcIk4uIENlbnRyYWwgQXNpYSBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9Ob3Zvc2liaXJza1wiLFxuXHRcIk5hbWliaWEgU3RhbmRhcmQgVGltZVwiOiBcIkFmcmljYS9XaW5kaG9la1wiLFxuXHRcIk5lcGFsIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0thdG1hbmR1XCIsXG5cdFwiTmV3IFplYWxhbmQgU3RhbmRhcmQgVGltZVwiOiBcIlBhY2lmaWMvQXVja2xhbmRcIixcblx0XCJOZXdmb3VuZGxhbmQgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvU3RfSm9obnNcIixcblx0XCJOb3Jmb2xrIFN0YW5kYXJkIFRpbWVcIjogXCJQYWNpZmljL05vcmZvbGtcIixcblx0XCJOb3J0aCBBc2lhIEVhc3QgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvSXJrdXRza1wiLFxuXHRcIk5vcnRoIEFzaWEgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvS3Jhc25veWFyc2tcIixcblx0XCJOb3J0aCBLb3JlYSBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9QeW9uZ3lhbmdcIixcblx0XCJPbXNrIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL09tc2tcIixcblx0XCJQYWNpZmljIFNBIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL1NhbnRpYWdvXCIsXG5cdFwiUGFjaWZpYyBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9Mb3NfQW5nZWxlc1wiLFxuXHRcIlBhY2lmaWMgU3RhbmRhcmQgVGltZSAoTWV4aWNvKVwiOiBcIkFtZXJpY2EvVGlqdWFuYVwiLFxuXHRcIlBha2lzdGFuIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0thcmFjaGlcIixcblx0XCJQYXJhZ3VheSBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9Bc3VuY2lvblwiLFxuXHRcIlJvbWFuY2UgU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9QYXJpc1wiLFxuXHRcIlJ1c3NpYSBUaW1lIFpvbmUgM1wiOiBcIkV1cm9wZS9TYW1hcmFcIixcblx0XCJSdXNzaWEgVGltZSBab25lIDEwXCI6IFwiQXNpYS9TcmVkbmVrb2x5bXNrXCIsXG5cdFwiUnVzc2lhIFRpbWUgWm9uZSAxMVwiOiBcIkFzaWEvS2FtY2hhdGthXCIsXG5cdFwiUnVzc2lhbiBTdGFuZGFyZCBUaW1lXCI6IFwiRXVyb3BlL01vc2Nvd1wiLFxuXHRcIlNBIEVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvQ2F5ZW5uZVwiLFxuXHRcIlNBIFBhY2lmaWMgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvQm9nb3RhXCIsXG5cdFwiU0EgV2VzdGVybiBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9MYV9QYXpcIixcblx0XCJTYWludCBQaWVycmUgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvTWlxdWVsb25cIixcblx0XCJTYWtoYWxpbiBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9TYWtoYWxpblwiLFxuXHRcIlNhbW9hIFN0YW5kYXJkIFRpbWVcIjogXCJQYWNpZmljL0FwaWFcIixcblx0XCJTYW8gVG9tZSBTdGFuZGFyZCBUaW1lXCI6IFwiQWZyaWNhL1Nhb19Ub21lXCIsXG5cdFwiU2FyYXRvdiBTdGFuZGFyZCBUaW1lXCI6IFwiRXVyb3BlL1NhcmF0b3ZcIixcblx0XCJTRSBBc2lhIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0Jhbmdrb2tcIixcblx0XCJTaW5nYXBvcmUgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvU2luZ2Fwb3JlXCIsXG5cdFwiU291dGggQWZyaWNhIFN0YW5kYXJkIFRpbWVcIjogXCJBZnJpY2EvSm9oYW5uZXNidXJnXCIsXG5cdFwiU3JpIExhbmthIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0NvbG9tYm9cIixcblx0XCJTdWRhbiBTdGFuZGFyZCBUaW1lXCI6IFwiQWZyaWNhL0toYXJ0b3VtXCIsXG5cdFwiU3lyaWEgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvRGFtYXNjdXNcIixcblx0XCJUYWlwZWkgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvVGFpcGVpXCIsXG5cdFwiVGFzbWFuaWEgU3RhbmRhcmQgVGltZVwiOiBcIkF1c3RyYWxpYS9Ib2JhcnRcIixcblx0XCJUb2NhbnRpbnMgU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvQXJhZ3VhaW5hXCIsXG5cdFwiVG9reW8gU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvVG9reW9cIixcblx0XCJUb21zayBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9Ub21za1wiLFxuXHRcIlRvbmdhIFN0YW5kYXJkIFRpbWVcIjogXCJQYWNpZmljL1RvbmdhdGFwdVwiLFxuXHRcIlRyYW5zYmFpa2FsIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0NoaXRhXCIsXG5cdFwiVHVya2V5IFN0YW5kYXJkIFRpbWVcIjogXCJFdXJvcGUvSXN0YW5idWxcIixcblx0XCJUdXJrcyBBbmQgQ2FpY29zIFN0YW5kYXJkIFRpbWVcIjogXCJBbWVyaWNhL0dyYW5kX1R1cmtcIixcblx0XCJVbGFhbmJhYXRhciBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9VbGFhbmJhYXRhclwiLFxuXHRcIlVTIEVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvSW5kaWFuYXBvbGlzXCIsXG5cdFwiVVMgTW91bnRhaW4gU3RhbmRhcmQgVGltZVwiOiBcIkFtZXJpY2EvUGhvZW5peFwiLFxuXHRVVEM6IFwiRXRjL0dNVFwiLFxuXHRcIlVUQy0wMlwiOiBcIkV0Yy9HTVQrMlwiLFxuXHRcIlVUQy0wOFwiOiBcIkV0Yy9HTVQrOFwiLFxuXHRcIlVUQy0wOVwiOiBcIkV0Yy9HTVQrOVwiLFxuXHRcIlVUQy0xMVwiOiBcIkV0Yy9HTVQrMTFcIixcblx0XCJVVEMrMTJcIjogXCJFdGMvR01ULTEyXCIsXG5cdFwiVVRDKzEzXCI6IFwiRXRjL0dNVC0xM1wiLFxuXHRcIlZlbmV6dWVsYSBTdGFuZGFyZCBUaW1lXCI6IFwiQW1lcmljYS9DYXJhY2FzXCIsXG5cdFwiVmxhZGl2b3N0b2sgU3RhbmRhcmQgVGltZVwiOiBcIkFzaWEvVmxhZGl2b3N0b2tcIixcblx0XCJXLiBBdXN0cmFsaWEgU3RhbmRhcmQgVGltZVwiOiBcIkF1c3RyYWxpYS9QZXJ0aFwiLFxuXHRcIlcuIENlbnRyYWwgQWZyaWNhIFN0YW5kYXJkIFRpbWVcIjogXCJBZnJpY2EvTGFnb3NcIixcblx0XCJXLiBFdXJvcGUgU3RhbmRhcmQgVGltZVwiOiBcIkV1cm9wZS9CZXJsaW5cIixcblx0XCJXLiBNb25nb2xpYSBTdGFuZGFyZCBUaW1lXCI6IFwiQXNpYS9Ib3ZkXCIsXG5cdFwiV2VzdCBBc2lhIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL1Rhc2hrZW50XCIsXG5cdFwiV2VzdCBCYW5rIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL0hlYnJvblwiLFxuXHRcIldlc3QgUGFjaWZpYyBTdGFuZGFyZCBUaW1lXCI6IFwiUGFjaWZpYy9Qb3J0X01vcmVzYnlcIixcblx0XCJZYWt1dHNrIFN0YW5kYXJkIFRpbWVcIjogXCJBc2lhL1lha3V0c2tcIixcbn1cbiIsImltcG9ydCB7IERBWV9JTl9NSUxMSVMsIGZpbHRlckludCwgbmV2ZXJOdWxsLCBSZXF1aXJlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBEYXRlVGltZSwgRHVyYXRpb24sIElBTkFab25lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7XG5cdENhbGVuZGFyRXZlbnQsXG5cdENhbGVuZGFyRXZlbnRBdHRlbmRlZSxcblx0Y3JlYXRlQ2FsZW5kYXJFdmVudCxcblx0Y3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlLFxuXHRjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyxcblx0RW5jcnlwdGVkTWFpbEFkZHJlc3MsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyQWR2YW5jZWRSZXBlYXRSdWxlLCBjcmVhdGVDYWxlbmRhckFkdmFuY2VkUmVwZWF0UnVsZSwgRGF0ZVdyYXBwZXIsIFJlcGVhdFJ1bGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlRGF0ZVdyYXBwZXIsIGNyZWF0ZVJlcGVhdFJ1bGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBQYXJzZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvcGFyc2luZy9QYXJzZXJDb21iaW5hdG9yXCJcbmltcG9ydCB7XG5cdGNvbWJpbmVQYXJzZXJzLFxuXHRtYWtlQ2hhcmFjdGVyUGFyc2VyLFxuXHRtYWtlRWl0aGVyUGFyc2VyLFxuXHRtYWtlTm90Q2hhcmFjdGVyUGFyc2VyLFxuXHRtYWtlU2VwYXJhdGVkQnlQYXJzZXIsXG5cdG1ha2VaZXJvT3JNb3JlUGFyc2VyLFxuXHRtYXBQYXJzZXIsXG5cdG1heWJlUGFyc2UsXG5cdG51bWJlclBhcnNlcixcblx0UGFyc2VyRXJyb3IsXG5cdFN0cmluZ0l0ZXJhdG9yLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvcGFyc2luZy9QYXJzZXJDb21iaW5hdG9yXCJcbmltcG9ydCBXaW5kb3dzWm9uZXMgZnJvbSBcIi4vV2luZG93c1pvbmVzXCJcbmltcG9ydCB0eXBlIHsgUGFyc2VkQ2FsZW5kYXJEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9pbXBvcnQvQ2FsZW5kYXJJbXBvcnRlci5qc1wiXG5pbXBvcnQgeyBpc01haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdFZhbGlkYXRvclwiXG5pbXBvcnQgeyBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLCBDYWxlbmRhck1ldGhvZCwgRW5kVHlwZSwgUmVwZWF0UGVyaW9kLCByZXZlcnNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IEFsYXJtSW50ZXJ2YWwsIEFsYXJtSW50ZXJ2YWxVbml0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgQWxhcm1JbmZvVGVtcGxhdGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7IHNlcmlhbGl6ZUFsYXJtSW50ZXJ2YWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBCWVJVTEVfTUFQIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9pbXBvcnQvSW1wb3J0RXhwb3J0VXRpbHMuanNcIlxuXG5mdW5jdGlvbiBwYXJzZURhdGVTdHJpbmcoZGF0ZVN0cmluZzogc3RyaW5nKToge1xuXHR5ZWFyOiBudW1iZXJcblx0bW9udGg6IG51bWJlclxuXHRkYXk6IG51bWJlclxufSB7XG5cdGNvbnN0IHllYXIgPSBwYXJzZUludChkYXRlU3RyaW5nLnNsaWNlKDAsIDQpKVxuXHRjb25zdCBtb250aCA9IHBhcnNlSW50KGRhdGVTdHJpbmcuc2xpY2UoNCwgNikpXG5cdGNvbnN0IGRheSA9IHBhcnNlSW50KGRhdGVTdHJpbmcuc2xpY2UoNiwgOCkpXG5cdHJldHVybiB7XG5cdFx0eWVhcixcblx0XHRtb250aCxcblx0XHRkYXksXG5cdH1cbn1cblxudHlwZSBQcm9wZXJ0eVBhcmFtVmFsdWUgPSBzdHJpbmdcbnR5cGUgUHJvcGVydHkgPSB7XG5cdG5hbWU6IHN0cmluZ1xuXHRwYXJhbXM6IFJlY29yZDxzdHJpbmcsIFByb3BlcnR5UGFyYW1WYWx1ZT5cblx0dmFsdWU6IHN0cmluZ1xufVxudHlwZSBJQ2FsT2JqZWN0ID0ge1xuXHR0eXBlOiBzdHJpbmdcblx0cHJvcGVydGllczogQXJyYXk8UHJvcGVydHk+XG5cdGNoaWxkcmVuOiBBcnJheTxJQ2FsT2JqZWN0PlxufVxuXG5mdW5jdGlvbiBnZXRQcm9wKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiBmYWxzZSk6IFByb3BlcnR5XG5mdW5jdGlvbiBnZXRQcm9wKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiB0cnVlKTogUHJvcGVydHkgfCBudWxsIHwgdW5kZWZpbmVkXG5mdW5jdGlvbiBnZXRQcm9wKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiBib29sZWFuKTogUHJvcGVydHkgfCBudWxsIHwgdW5kZWZpbmVkXG5mdW5jdGlvbiBnZXRQcm9wKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiBib29sZWFuKTogUHJvcGVydHkgfCBudWxsIHwgdW5kZWZpbmVkIHtcblx0Y29uc3QgcHJvcCA9IG9iai5wcm9wZXJ0aWVzLmZpbmQoKHApID0+IHAubmFtZSA9PT0gdGFnKVxuXHRpZiAoIW9wdGlvbmFsICYmIHByb3AgPT0gbnVsbCkgdGhyb3cgbmV3IFBhcnNlckVycm9yKGBNaXNzaW5nIHByb3AgJHt0YWd9YClcblx0cmV0dXJuIHByb3Bcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcFN0cmluZ1ZhbHVlKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiBmYWxzZSk6IHN0cmluZ1xuZnVuY3Rpb24gZ2V0UHJvcFN0cmluZ1ZhbHVlKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiB0cnVlKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZFxuZnVuY3Rpb24gZ2V0UHJvcFN0cmluZ1ZhbHVlKG9iajogSUNhbE9iamVjdCwgdGFnOiBzdHJpbmcsIG9wdGlvbmFsOiBib29sZWFuKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG5cdGNvbnN0IHByb3AgPSBnZXRQcm9wKG9iaiwgdGFnLCBvcHRpb25hbClcblx0aWYgKCFvcHRpb25hbCAmJiB0eXBlb2YgcHJvcD8udmFsdWUgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBQYXJzZXJFcnJvcihgdmFsdWUgb2YgJHt0YWd9IGlzIG5vdCBvZiB0eXBlIHN0cmluZywgZ290ICR7SlNPTi5zdHJpbmdpZnkocHJvcCl9YClcblx0cmV0dXJuIHByb3A/LnZhbHVlXG59XG5cbi8vIExlZnQgc2lkZSBvZiB0aGUgc2VtaWNvbG9uXG5jb25zdCBwYXJhbWV0ZXJTdHJpbmdWYWx1ZVBhcnNlcjogUGFyc2VyPHN0cmluZz4gPSAoaXRlcmF0b3IpID0+IHtcblx0bGV0IHZhbHVlID0gXCJcIlxuXG5cdGxldCBuZXh0XG5cdHdoaWxlICgobmV4dCA9IGl0ZXJhdG9yLnBlZWsoKSkgJiYgL1s6OyxdLy50ZXN0KG5leHQpID09PSBmYWxzZSkge1xuXHRcdHZhbHVlICs9IG5ldmVyTnVsbChpdGVyYXRvci5uZXh0KCkudmFsdWUpXG5cdH1cblxuXHRyZXR1cm4gdmFsdWVcbn1cblxuY29uc3QgZXNjYXBlZFN0cmluZ1ZhbHVlUGFyc2VyOiBQYXJzZXI8c3RyaW5nPiA9IChpdGVyYXRvcjogU3RyaW5nSXRlcmF0b3IpID0+IHtcblx0aWYgKGl0ZXJhdG9yLm5leHQoKS52YWx1ZSAhPT0gJ1wiJykge1xuXHRcdHRocm93IG5ldyBQYXJzZXJFcnJvcihcIk5vdCBhIHF1b3RlZCB2YWx1ZVwiKVxuXHR9XG5cblx0bGV0IHZhbHVlID0gXCJcIlxuXG5cdHdoaWxlIChpdGVyYXRvci5wZWVrKCkgJiYgaXRlcmF0b3IucGVlaygpICE9PSAnXCInKSB7XG5cdFx0dmFsdWUgKz0gbmV2ZXJOdWxsKGl0ZXJhdG9yLm5leHQoKS52YWx1ZSlcblx0fVxuXG5cdGlmICghKGl0ZXJhdG9yLnBlZWsoKSA9PT0gJ1wiJykpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBxdW90ZWQgdmFsdWUsIGRvZXMgbm90IGVuZCB3aXRoIHF1b3RlOiBcIiArIHZhbHVlKVxuXHR9XG5cblx0aXRlcmF0b3IubmV4dCgpXG5cdHJldHVybiB2YWx1ZVxufVxuXG5jb25zdCBwcm9wZXJ0eVBhcmFtZXRlcnNLZXlWYWx1ZVBhcnNlcjogUGFyc2VyPFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXT4gPSBjb21iaW5lUGFyc2Vycyhcblx0cGFyc2VQcm9wZXJ0eU5hbWUsXG5cdG1ha2VDaGFyYWN0ZXJQYXJzZXIoXCI9XCIpLFxuXHRtYWtlRWl0aGVyUGFyc2VyKGVzY2FwZWRTdHJpbmdWYWx1ZVBhcnNlciwgcGFyYW1ldGVyU3RyaW5nVmFsdWVQYXJzZXIpLFxuKVxuXG5jb25zdCBwYXJzZVByb3BlcnR5UGFyYW1ldGVycyA9IGNvbWJpbmVQYXJzZXJzKFxuXHRtYWtlQ2hhcmFjdGVyUGFyc2VyKFwiO1wiKSxcblx0bWFrZVNlcGFyYXRlZEJ5UGFyc2VyKC8qc2VwYXJhdG9yKi8gbWFrZUNoYXJhY3RlclBhcnNlcihcIjtcIiksIC8qdmFsdWUqLyBwcm9wZXJ0eVBhcmFtZXRlcnNLZXlWYWx1ZVBhcnNlciksXG4pXG5cbi8vIG1ha2Ugc3VyZSB0aGUgc2xhc2hlcyBhcmUgX2Fsd2F5c18gcmVwbGFjZWQgZmlyc3Rcbi8vIHVubGVzcyB5b3UncmUgdXNpbmcgYW4gYWN0dWFsIHBhcnNlciBmb3IgdGhpcy5cbi8vIG90aGVyd2lzZSB3ZSBnZXQgZnVuIHN0dWZmIGxpa2UgXCI7XFxcIiAtPiBcIlxcO1xcXCIgLT4gXCJcXFxcO1xcXFxcIlxuLy8gaW5zdGVhZCBvZiBcIjtcXFwiIC0+IFwiO1xcXFxcIiAtPiBcIlxcO1xcXFxcIlxuZXhwb3J0IGNvbnN0IGlDYWxSZXBsYWNlbWVudHMgPSB7XG5cdFwiXFxcXFwiOiBcIlxcXFxcXFxcXCIsXG5cdFwiO1wiOiBcIlxcXFw7XCIsXG5cdFwiLFwiOiBcIlxcXFwsXCIsXG5cdFwiXFxuXCI6IFwiXFxcXG5cIixcbn1cblxuY29uc3QgcmV2SUNhbFJlcGxhY2VtZW50cyA9IHJldmVyc2UoaUNhbFJlcGxhY2VtZW50cylcblxuLy8gUmlnaHQgc2lkZSBvZiB0aGUgc2VtaWNvbG9uXG5cbi8qKlxuICogUGFyc2VzIGV2ZXJ5dGhpbmcgdW50aWwgdGhlIGVuZCBvZiB0aGUgc3RyaW5nIGFuZCB1bmVzY2FwZXMgd2hhdCBpdCBzaG91bGRcbiAqL1xuY29uc3QgYW55U3RyaW5nVW5lc2NhcGVQYXJzZXI6IFBhcnNlcjxzdHJpbmc+ID0gKGl0ZXJhdG9yKSA9PiB7XG5cdGxldCB2YWx1ZSA9IFwiXCJcblx0bGV0IGxhc3RDaGFyYWN0ZXI6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cblx0d2hpbGUgKGl0ZXJhdG9yLnBlZWsoKSkge1xuXHRcdGxhc3RDaGFyYWN0ZXIgPSBpdGVyYXRvci5uZXh0KCkudmFsdWVcblxuXHRcdGlmIChsYXN0Q2hhcmFjdGVyID09PSBcIlxcXFxcIikge1xuXHRcdFx0Y29uc3QgbmV4dCA9IGl0ZXJhdG9yLnBlZWsoKVxuXHRcdFx0aWYgKG5leHQgIT0gbnVsbCAmJiBuZXh0IGluIGlDYWxSZXBsYWNlbWVudHMpIHtcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH0gZWxzZSBpZiAoaXRlcmF0b3IucGVlaygpID09PSBcIm5cIikge1xuXHRcdFx0XHRpdGVyYXRvci5uZXh0KClcblx0XHRcdFx0dmFsdWUgKz0gXCJcXG5cIlxuXHRcdFx0XHRjb250aW51ZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhbHVlICs9IG5ldmVyTnVsbChsYXN0Q2hhcmFjdGVyKVxuXHR9XG5cblx0cmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogUGFyc2VzIGV2ZXJ5dGhpbmcgdW50aWwgdGhlIHNlbWljb2xvbiBjaGFyYWN0ZXJcbiAqL1xuY29uc3QgcHJvcGVydHlTdHJpbmdWYWx1ZVBhcnNlcjogUGFyc2VyPHN0cmluZz4gPSAoaXRlcmF0b3IpID0+IHtcblx0bGV0IHZhbHVlID0gXCJcIlxuXG5cdGxldCBuZXh0XG5cdHdoaWxlICgobmV4dCA9IGl0ZXJhdG9yLnBlZWsoKSkgJiYgL1s7XS8udGVzdChuZXh0KSA9PT0gZmFsc2UpIHtcblx0XHR2YWx1ZSArPSBuZXZlck51bGwoaXRlcmF0b3IubmV4dCgpLnZhbHVlKVxuXHR9XG5cblx0cmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogUGFyc2VzIHZhbHVlcyBzZXBhcmF0ZWQgYnkgY29tbWFzXG4gKi9cbmNvbnN0IHNlcGFyYXRlZEJ5Q29tbWFQYXJzZXI6IFBhcnNlcjxBcnJheTxzdHJpbmc+PiA9IG1ha2VTZXBhcmF0ZWRCeVBhcnNlcihcblx0bWFrZUNoYXJhY3RlclBhcnNlcihcIixcIiksXG5cdG1hcFBhcnNlcihtYWtlWmVyb09yTW9yZVBhcnNlcihtYWtlTm90Q2hhcmFjdGVyUGFyc2VyKFwiLFwiKSksIChhcnIpID0+IGFyci5qb2luKFwiXCIpKSxcbilcblxuLyoqXG4gKiBQYXJzZXMgdGhlIHdob2xlIHByb3BlcnR5IChib3RoIHNpZGVzKVxuICovXG5leHBvcnQgY29uc3QgcHJvcGVydHlTZXF1ZW5jZVBhcnNlcjogUGFyc2VyPFtzdHJpbmcsIFtzdHJpbmcsIEFycmF5PFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXT5dIHwgbnVsbCwgc3RyaW5nLCBzdHJpbmddPiA9IGNvbWJpbmVQYXJzZXJzKFxuXHRwYXJzZVByb3BlcnR5TmFtZSxcblx0bWF5YmVQYXJzZShwYXJzZVByb3BlcnR5UGFyYW1ldGVycyksXG5cdG1ha2VDaGFyYWN0ZXJQYXJzZXIoXCI6XCIpLFxuXHRhbnlTdHJpbmdVbmVzY2FwZVBhcnNlcixcbilcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJvcGVydHkoZGF0YTogc3RyaW5nKTogUHJvcGVydHkgfCBudWxsIHtcblx0dHJ5IHtcblx0XHRjb25zdCBzZXF1ZW5jZSA9IHByb3BlcnR5U2VxdWVuY2VQYXJzZXIobmV3IFN0cmluZ0l0ZXJhdG9yKGRhdGEpKVxuXHRcdGNvbnN0IG5hbWUgPSBzZXF1ZW5jZVswXVxuXHRcdGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9XG5cblx0XHRpZiAoc2VxdWVuY2VbMV0pIHtcblx0XHRcdGZvciAoY29uc3QgW25hbWUsIF9lcSwgdmFsdWVdIG9mIHNlcXVlbmNlWzFdWzFdKSB7XG5cdFx0XHRcdHBhcmFtc1tuYW1lXSA9IHZhbHVlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmFsdWUgPSBzZXF1ZW5jZVszXVxuXHRcdHJldHVybiB7XG5cdFx0XHRuYW1lLFxuXHRcdFx0cGFyYW1zLFxuXHRcdFx0dmFsdWUsXG5cdFx0fVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIG51bGwgLy8gUmV0dXJuaW5nIG51bGwgdG8gYXZvaWQgcmFpc2luZyBwYXJzZXIgZXJyb3JzIHNvIHdlIGNhbiBpZ25vcmUgdGhlIGN1cnJlbnQgYnJva2VuIGRhdGEvcHJvcGVydHlcblx0fVxufVxuXG4vKipcbiAqIFBhcnNlcyBzaW5nbGUga2V5PXZhbHVlIHBhaXIgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHNlbWljb2xvbiAodmFsdWUgc2lkZSlcbiAqL1xuY29uc3QgcHJvcGVydHlLZXlWYWx1ZVBhcnNlcjogUGFyc2VyPFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXT4gPSBjb21iaW5lUGFyc2VycyhwYXJzZVByb3BlcnR5TmFtZSwgbWFrZUNoYXJhY3RlclBhcnNlcihcIj1cIiksIHByb3BlcnR5U3RyaW5nVmFsdWVQYXJzZXIpXG5cbi8qKlxuICogUGFyc2VzIG11bHRpcGxlIGtleT12YWx1ZSBwYWlyIG9uIHRoZSByaWdodCBzaWRlIG9mIHRoZSBzZW1pY29sb24gKHZhbHVlIHNpZGUpXG4gKi9cbmNvbnN0IHZhbHVlc1NlcGFyYXRlZEJ5U2VtaWNvbG9uUGFyc2VyOiBQYXJzZXI8QXJyYXk8W3N0cmluZywgc3RyaW5nLCBzdHJpbmddPj4gPSBtYWtlU2VwYXJhdGVkQnlQYXJzZXIobWFrZUNoYXJhY3RlclBhcnNlcihcIjtcIiksIHByb3BlcnR5S2V5VmFsdWVQYXJzZXIpXG5cbi8qKlxuICogUGFyc2VzIG11bHRpcGxlIGtleT12YWx1ZSBwYWlyIG9uIHRoZSByaWdodCBzaWRlIG9mIHRoZSBzZW1pY29sb24gKHZhbHVlIHNpZGUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVByb3BlcnR5S2V5VmFsdWUoZGF0YTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG5cdGNvbnN0IHZhbHVlcyA9IHZhbHVlc1NlcGFyYXRlZEJ5U2VtaWNvbG9uUGFyc2VyKG5ldyBTdHJpbmdJdGVyYXRvcihkYXRhKSlcblx0Y29uc3QgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cblx0Zm9yIChjb25zdCBba2V5LCBfZXEsIHZhbHVlXSBvZiB2YWx1ZXMpIHtcblx0XHRyZXN1bHRba2V5XSA9IHZhbHVlXG5cdH1cblx0cmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBwYXJzZUljYWxPYmplY3QodGFnOiBzdHJpbmcsIGl0ZXJhdG9yOiBJdGVyYXRvcjxzdHJpbmc+KTogSUNhbE9iamVjdCB7XG5cdGxldCBpdGVyYXRpb24gPSBpdGVyYXRvci5uZXh0KClcblx0bGV0IHByb3BlcnRpZXM6IFByb3BlcnR5W10gPSBbXVxuXHRsZXQgY2hpbGRyZW46IElDYWxPYmplY3RbXSA9IFtdXG5cblx0d2hpbGUgKCFpdGVyYXRpb24uZG9uZSAmJiBpdGVyYXRpb24udmFsdWUpIHtcblx0XHRjb25zdCBwcm9wZXJ0eSA9IHBhcnNlUHJvcGVydHkoaXRlcmF0aW9uLnZhbHVlKVxuXG5cdFx0aWYgKCFwcm9wZXJ0eSkge1xuXHRcdFx0Ly8gSWdub3JpbmcgYnJva2VuIHByb3BlcnRpZXMsIGlmIHRoZXJlIGlzIGFueSBtYW5kYXRvcnkgcHJvcGVydGllcyBtaXNzaW5nIHRoZSBmdW5jdGlvbiBnZXRDb250ZW50cyB3aWxsIHJhaXNlIGFuIGVycm9yIGxhdGVyXG5cdFx0XHRpdGVyYXRpb24gPSBpdGVyYXRvci5uZXh0KClcblx0XHRcdGNvbnRpbnVlXG5cdFx0fVxuXG5cdFx0aWYgKHByb3BlcnR5Lm5hbWUgPT09IFwiRU5EXCIgJiYgcHJvcGVydHkudmFsdWUgPT09IHRhZykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZTogdGFnLFxuXHRcdFx0XHRwcm9wZXJ0aWVzLFxuXHRcdFx0XHRjaGlsZHJlbixcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocHJvcGVydHkubmFtZSA9PT0gXCJCRUdJTlwiKSB7XG5cdFx0XHRpZiAodHlwZW9mIHByb3BlcnR5LnZhbHVlICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXCJCRUdJTiB3aXRoIGFycmF5IHZhbHVlXCIpXG5cdFx0XHRjaGlsZHJlbi5wdXNoKHBhcnNlSWNhbE9iamVjdChwcm9wZXJ0eS52YWx1ZSwgaXRlcmF0b3IpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpXG5cdFx0fVxuXG5cdFx0aXRlcmF0aW9uID0gaXRlcmF0b3IubmV4dCgpXG5cdH1cblxuXHR0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXCJubyBlbmQgZm9yIHRhZyBcIiArIHRhZylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSUNhbGVuZGFyKHN0cmluZ0RhdGE6IHN0cmluZyk6IElDYWxPYmplY3Qge1xuXHRjb25zdCB3aXRoRm9sZGVkTGluZXMgPSBzdHJpbmdEYXRhXG5cdFx0LnJlcGxhY2UoL1xccj9cXG5cXHMvZywgXCJcIilcblx0XHQuc3BsaXQoL1xccj9cXG4vKVxuXHRcdC5maWx0ZXIoKGUpID0+IGUgIT09IFwiXCIpXG5cdGNvbnN0IGl0ZXJhdG9yID0gd2l0aEZvbGRlZExpbmVzLnZhbHVlcygpXG5cdGNvbnN0IGZpcnN0TGluZSA9IGl0ZXJhdG9yLm5leHQoKVxuXG5cdGlmIChmaXJzdExpbmUudmFsdWUgIT09IFwiQkVHSU46VkNBTEVOREFSXCIpIHtcblx0XHR0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXCJOb3QgYSBWQ0FMRU5EQVI6IFwiICsgU3RyaW5nKGZpcnN0TGluZS52YWx1ZSkpXG5cdH1cblxuXHRyZXR1cm4gcGFyc2VJY2FsT2JqZWN0KFwiVkNBTEVOREFSXCIsIGl0ZXJhdG9yKVxufVxuXG5mdW5jdGlvbiBwYXJzZUFsYXJtKGFsYXJtT2JqZWN0OiBJQ2FsT2JqZWN0LCBzdGFydFRpbWU6IERhdGUpOiBBbGFybUluZm9UZW1wbGF0ZSB8IG51bGwge1xuXHRjb25zdCB0cmlnZ2VyVmFsdWUgPSBnZXRQcm9wU3RyaW5nVmFsdWUoYWxhcm1PYmplY3QsIFwiVFJJR0dFUlwiLCBmYWxzZSlcblx0Y29uc3QgYWxhcm1JbnRlcnZhbDogQWxhcm1JbnRlcnZhbCB8IG51bGwgPSB0cmlnZ2VyVG9BbGFybUludGVydmFsKHN0YXJ0VGltZSwgdHJpZ2dlclZhbHVlKVxuXHRyZXR1cm4gYWxhcm1JbnRlcnZhbCAhPSBudWxsXG5cdFx0PyB7XG5cdFx0XHRcdHRyaWdnZXI6IHNlcmlhbGl6ZUFsYXJtSW50ZXJ2YWwoYWxhcm1JbnRlcnZhbCksXG5cdFx0XHRcdGFsYXJtSWRlbnRpZmllcjogXCJcIixcblx0XHQgIH1cblx0XHQ6IG51bGxcbn1cblxuLyoqIHZpc2libGUgZm9yIHRlc3RpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyVG9BbGFybUludGVydmFsKGV2ZW50U3RhcnQ6IERhdGUsIHRyaWdnZXJWYWx1ZTogc3RyaW5nKTogQWxhcm1JbnRlcnZhbCB8IG51bGwge1xuXHQvLyBBYnNvbHV0ZSB0aW1lXG5cdGlmICh0cmlnZ2VyVmFsdWUuZW5kc1dpdGgoXCJaXCIpKSB7XG5cdFx0Ly8gRm9yIGFic29sdXRlIHRpbWUgd2UganVzdCBjb252ZXJ0IHRoZSB0cmlnZ2VyIHRvIG1pbnV0ZXMuIFRoZXJlIG1pZ2h0IGJlIGEgYmlnZ2VyIHVuaXQgdGhhdCBjYW4gZXhwcmVzcyBpdCBidXQgd2UgZG9uJ3QgaGF2ZSB0byB0YWtlIGNhcmUgYWJvdXQgdGltZVxuXHRcdC8vIHpvbmVzIG9yIGRheWxpZ2h0IHNhdmluZyBpbiB0aGlzIGNhc2UgYW5kIGl0J3Mgc2ltcGxlciB0aGlzIHdheS5cblx0XHRjb25zdCB0cmlnZ2VyVGltZSA9IHBhcnNlVGltZSh0cmlnZ2VyVmFsdWUpLmRhdGVcblx0XHRjb25zdCB0aWxsRXZlbnQgPSBldmVudFN0YXJ0LmdldFRpbWUoKSAtIHRyaWdnZXJUaW1lLmdldFRpbWUoKVxuXHRcdGNvbnN0IG1pbnV0ZXMgPSBEdXJhdGlvbi5mcm9tTWlsbGlzKHRpbGxFdmVudCkuYXMoXCJtaW51dGVzXCIpXG5cdFx0cmV0dXJuIHsgdW5pdDogQWxhcm1JbnRlcnZhbFVuaXQuTUlOVVRFLCB2YWx1ZTogbWludXRlcyB9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gSWYgd2UgaGF2ZSByZWxhdGl2ZSB0cmlnZ2VyIGV4cHJlc3NlZCBpbiB1bml0cyB3ZSB3YW50IHRvIGZpbmQgdGhlIHNtYWxsZXN0IHVuaXQgdGhhdCB3aWxsIGZpdC4gVW5saWtlIGlDYWwgd2UgZG8gbm90IHN1cHBvcnQgbXVsdGlwbGUgdW5pdHMgc29cblx0XHQvLyB3ZSBoYXZlIHRvIHBpY2sgb25lLlxuXHRcdGNvbnN0IGR1cmF0aW9uID0gcGFyc2VEdXJhdGlvbih0cmlnZ2VyVmFsdWUpXG5cblx0XHRpZiAoZHVyYXRpb24ucG9zaXRpdmUpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0bGV0IHNtYWxsZXN0VW5pdDogQWxhcm1JbnRlcnZhbFVuaXQgPSBBbGFybUludGVydmFsVW5pdC5NSU5VVEVcblx0XHRpZiAoZHVyYXRpb24ud2Vlaykge1xuXHRcdFx0c21hbGxlc3RVbml0ID0gQWxhcm1JbnRlcnZhbFVuaXQuV0VFS1xuXHRcdH1cblx0XHRpZiAoZHVyYXRpb24uZGF5KSB7XG5cdFx0XHRzbWFsbGVzdFVuaXQgPSBBbGFybUludGVydmFsVW5pdC5EQVlcblx0XHR9XG5cdFx0aWYgKGR1cmF0aW9uLmhvdXIpIHtcblx0XHRcdHNtYWxsZXN0VW5pdCA9IEFsYXJtSW50ZXJ2YWxVbml0LkhPVVJcblx0XHR9XG5cdFx0aWYgKGR1cmF0aW9uLm1pbnV0ZSkge1xuXHRcdFx0c21hbGxlc3RVbml0ID0gQWxhcm1JbnRlcnZhbFVuaXQuTUlOVVRFXG5cdFx0fVxuXHRcdGNvbnN0IGx1eG9uRHVyYXRpb24gPSB7IHdlZWs6IGR1cmF0aW9uLndlZWssIGRheTogZHVyYXRpb24uZGF5LCBtaW51dGU6IGR1cmF0aW9uLm1pbnV0ZSwgaG91cjogZHVyYXRpb24uaG91ciB9XG5cdFx0bGV0IHZhbHVlXG5cdFx0c3dpdGNoIChzbWFsbGVzdFVuaXQpIHtcblx0XHRcdGNhc2UgQWxhcm1JbnRlcnZhbFVuaXQuV0VFSzpcblx0XHRcdFx0dmFsdWUgPSBEdXJhdGlvbi5mcm9tT2JqZWN0KGx1eG9uRHVyYXRpb24pLmFzKFwid2Vla3NcIilcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgQWxhcm1JbnRlcnZhbFVuaXQuREFZOlxuXHRcdFx0XHR2YWx1ZSA9IER1cmF0aW9uLmZyb21PYmplY3QobHV4b25EdXJhdGlvbikuYXMoXCJkYXlzXCIpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIEFsYXJtSW50ZXJ2YWxVbml0LkhPVVI6XG5cdFx0XHRcdHZhbHVlID0gRHVyYXRpb24uZnJvbU9iamVjdChsdXhvbkR1cmF0aW9uKS5hcyhcImhvdXJzXCIpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIEFsYXJtSW50ZXJ2YWxVbml0Lk1JTlVURTpcblx0XHRcdFx0dmFsdWUgPSBEdXJhdGlvbi5mcm9tT2JqZWN0KGx1eG9uRHVyYXRpb24pLmFzKFwibWludXRlc1wiKVxuXHRcdFx0XHRicmVha1xuXHRcdH1cblx0XHRyZXR1cm4geyB1bml0OiBzbWFsbGVzdFVuaXQsIHZhbHVlIH1cblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VScnVsZShyYXdScnVsZVZhbHVlOiBzdHJpbmcsIHR6SWQ6IHN0cmluZyB8IG51bGwpOiBSZXBlYXRSdWxlIHtcblx0bGV0IHJydWxlVmFsdWVcblxuXHR0cnkge1xuXHRcdHJydWxlVmFsdWUgPSBwYXJzZVByb3BlcnR5S2V5VmFsdWUocmF3UnJ1bGVWYWx1ZSlcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmIChlIGluc3RhbmNlb2YgUGFyc2VyRXJyb3IpIHtcblx0XHRcdHRocm93IG5ldyBQYXJzZXJFcnJvcihcIlJSVUxFIGlzIG5vdCBhbiBvYmplY3QgXCIgKyBlLm1lc3NhZ2UpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IGVcblx0XHR9XG5cdH1cblxuXHRjb25zdCBmcmVxdWVuY3kgPSBpY2FsRnJlcXVlbmN5VG9SZXBlYXRQZXJpb2QocnJ1bGVWYWx1ZVtcIkZSRVFcIl0pXG5cdGNvbnN0IHVudGlsID0gcnJ1bGVWYWx1ZVtcIlVOVElMXCJdID8gcGFyc2VVbnRpbFJydWxlVGltZShycnVsZVZhbHVlW1wiVU5USUxcIl0sIHR6SWQpIDogbnVsbFxuXHRjb25zdCBjb3VudCA9IHJydWxlVmFsdWVbXCJDT1VOVFwiXSA/IHBhcnNlSW50KHJydWxlVmFsdWVbXCJDT1VOVFwiXSkgOiBudWxsXG5cdGNvbnN0IGVuZFR5cGU6IEVuZFR5cGUgPSB1bnRpbCAhPSBudWxsID8gRW5kVHlwZS5VbnRpbERhdGUgOiBjb3VudCAhPSBudWxsID8gRW5kVHlwZS5Db3VudCA6IEVuZFR5cGUuTmV2ZXJcblx0Y29uc3QgaW50ZXJ2YWwgPSBycnVsZVZhbHVlW1wiSU5URVJWQUxcIl0gPyBwYXJzZUludChycnVsZVZhbHVlW1wiSU5URVJWQUxcIl0pIDogMVxuXHRjb25zdCByZXBlYXRSdWxlID0gY3JlYXRlUmVwZWF0UnVsZSh7XG5cdFx0ZW5kVmFsdWU6IHVudGlsID8gU3RyaW5nKHVudGlsLmdldFRpbWUoKSkgOiBjb3VudCA/IFN0cmluZyhjb3VudCkgOiBudWxsLFxuXHRcdGVuZFR5cGU6IGVuZFR5cGUsXG5cdFx0aW50ZXJ2YWw6IFN0cmluZyhpbnRlcnZhbCksXG5cdFx0ZnJlcXVlbmN5OiBmcmVxdWVuY3ksXG5cdFx0ZXhjbHVkZWREYXRlczogW10sXG5cdFx0dGltZVpvbmU6IFwiXCIsXG5cdFx0YWR2YW5jZWRSdWxlczogcGFyc2VBZHZhbmNlZFJ1bGUocnJ1bGVWYWx1ZSksXG5cdH0pXG5cblx0aWYgKHR5cGVvZiB0eklkID09PSBcInN0cmluZ1wiKSB7XG5cdFx0cmVwZWF0UnVsZS50aW1lWm9uZSA9IHR6SWRcblx0fVxuXG5cdHJldHVybiByZXBlYXRSdWxlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFkdmFuY2VkUnVsZShycnVsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IENhbGVuZGFyQWR2YW5jZWRSZXBlYXRSdWxlW10ge1xuXHRjb25zdCBhZHZhbmNlZFJlcGVhdFJ1bGVzOiBDYWxlbmRhckFkdmFuY2VkUmVwZWF0UnVsZVtdID0gW11cblx0Zm9yIChjb25zdCBycnVsZUtleSBpbiBycnVsZSkge1xuXHRcdGlmICghQllSVUxFX01BUC5oYXMocnJ1bGVLZXkpKSB7XG5cdFx0XHRjb250aW51ZVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgaW50ZXJ2YWwgb2YgcnJ1bGVbcnJ1bGVLZXldLnNwbGl0KFwiLFwiKSkge1xuXHRcdFx0aWYgKGludGVydmFsID09PSBcIlwiKSB7XG5cdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHR9XG5cblx0XHRcdGFkdmFuY2VkUmVwZWF0UnVsZXMucHVzaChcblx0XHRcdFx0Y3JlYXRlQ2FsZW5kYXJBZHZhbmNlZFJlcGVhdFJ1bGUoe1xuXHRcdFx0XHRcdHJ1bGVUeXBlOiBCWVJVTEVfTUFQLmdldChycnVsZUtleSkhLnRvU3RyaW5nKCksXG5cdFx0XHRcdFx0aW50ZXJ2YWwsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gYWR2YW5jZWRSZXBlYXRSdWxlc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VFeERhdGVzKGV4Y2x1ZGVkRGF0ZXNQcm9wczogUHJvcGVydHlbXSk6IERhdGVXcmFwcGVyW10ge1xuXHQvLyBpdCdzIHBvc3NpYmxlIHRoYXQgd2UgaGF2ZSBkdXBsaWNhdGVkIGVudHJpZXMgc2luY2UgdGhpcyBkYXRhIGNvbWVzIGZyb20gd2hlcmVldmVyLCB0aGlzIGRlZHVwbGljYXRlcyBpdC5cblx0Y29uc3QgYWxsRXhEYXRlczogTWFwPG51bWJlciwgRGF0ZVdyYXBwZXI+ID0gbmV3IE1hcDxudW1iZXIsIERhdGVXcmFwcGVyPigpXG5cdGZvciAobGV0IGV4Y2x1ZGVkRGF0ZXNQcm9wIG9mIGV4Y2x1ZGVkRGF0ZXNQcm9wcykge1xuXHRcdGNvbnN0IHR6SWQgPSBnZXRUeklkKGV4Y2x1ZGVkRGF0ZXNQcm9wKVxuXHRcdGNvbnN0IHZhbHVlcyA9IHNlcGFyYXRlZEJ5Q29tbWFQYXJzZXIobmV3IFN0cmluZ0l0ZXJhdG9yKGV4Y2x1ZGVkRGF0ZXNQcm9wLnZhbHVlKSlcblx0XHRmb3IgKGxldCB2YWx1ZSBvZiB2YWx1ZXMpIHtcblx0XHRcdGNvbnN0IHsgZGF0ZTogZXhEYXRlIH0gPSBwYXJzZVRpbWUodmFsdWUsIHR6SWQgPz8gdW5kZWZpbmVkKVxuXHRcdFx0YWxsRXhEYXRlcy5zZXQoZXhEYXRlLmdldFRpbWUoKSwgY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlOiBleERhdGUgfSkpXG5cdFx0fVxuXHR9XG5cdHJldHVybiBbLi4uYWxsRXhEYXRlcy52YWx1ZXMoKV0uc29ydCgoZGF0ZVdyYXBwZXIxLCBkYXRlV3JhcHBlcjIpID0+IGRhdGVXcmFwcGVyMS5kYXRlLmdldFRpbWUoKSAtIGRhdGVXcmFwcGVyMi5kYXRlLmdldFRpbWUoKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUmVjdXJyZW5jZUlkKHJlY3VycmVuY2VJZFByb3A6IFByb3BlcnR5LCB0eklkOiBzdHJpbmcgfCBudWxsKTogRGF0ZSB7XG5cdGNvbnN0IGNvbXBvbmVudHMgPSBwYXJzZVRpbWVJbnRvQ29tcG9uZW50cyhyZWN1cnJlbmNlSWRQcm9wLnZhbHVlKVxuXHQvLyBycnVsZSB1bnRpbCBpcyBpbmNsdXNpdmUgaW4gaWNhbCBidXQgZXhjbHVzaXZlIGluIFR1dGFub3RhXG5cdGNvbnN0IGZpbGxlZENvbXBvbmVudHMgPSBjb21wb25lbnRzXG5cdC8vIGlmIG1pbnV0ZSBpcyBub3QgcHJvdmlkZWQgaXQgaXMgYW4gYWxsIGRheSBkYXRlIFlZWVlNTUREXG5cdGNvbnN0IGFsbERheSA9ICEoXCJtaW51dGVcIiBpbiBjb21wb25lbnRzKVxuXHQvLyBXZSBkb24ndCB1c2UgdGhlIHpvbmUgZnJvbSB0aGUgY29tcG9uZW50cyAoUlJVTEUpIGJ1dCB0aGUgb25lIGZyb20gc3RhcnQgdGltZSBpZiBpdCB3YXMgZ2l2ZW4uXG5cdC8vIERvbid0IGFzayBtZSB3aHkgYnV0IHRoYXQncyBob3cgaXQgaXMuXG5cdGNvbnN0IGVmZmVjdGl2ZVpvbmUgPSBhbGxEYXkgPyBcIlVUQ1wiIDogY29tcG9uZW50cy56b25lID8/IGdldFR6SWQocmVjdXJyZW5jZUlkUHJvcCkgPz8gdHpJZCA/PyB1bmRlZmluZWRcblx0ZGVsZXRlIGZpbGxlZENvbXBvbmVudHNbXCJ6b25lXCJdXG5cdGNvbnN0IGx1eG9uRGF0ZSA9IERhdGVUaW1lLmZyb21PYmplY3QoZmlsbGVkQ29tcG9uZW50cywgeyB6b25lOiBlZmZlY3RpdmVab25lIH0pXG5cdHJldHVybiB0b1ZhbGlkSlNEYXRlKGx1eG9uRGF0ZSwgcmVjdXJyZW5jZUlkUHJvcC52YWx1ZSwgdHpJZClcbn1cblxuLyoqXG4gKiBAcmV0dXJucyBuZXcgZW5kIHRpbWVcbiAqL1xuZnVuY3Rpb24gcGFyc2VFdmVudER1cmF0aW9uKGR1cmF0aW9uVmFsdWU6IHN0cmluZywgc3RhcnRUaW1lOiBEYXRlKTogRGF0ZSB7XG5cdGNvbnN0IGR1cmF0aW9uID0gcGFyc2VEdXJhdGlvbihkdXJhdGlvblZhbHVlKVxuXHRsZXQgZHVyYXRpb25Jbk1pbGxpcyA9IDBcblxuXHRpZiAoZHVyYXRpb24ud2Vlaykge1xuXHRcdGR1cmF0aW9uSW5NaWxsaXMgKz0gREFZX0lOX01JTExJUyAqIDcgKiBkdXJhdGlvbi53ZWVrXG5cdH1cblxuXHRpZiAoZHVyYXRpb24uZGF5KSB7XG5cdFx0ZHVyYXRpb25Jbk1pbGxpcyArPSBEQVlfSU5fTUlMTElTICogZHVyYXRpb24uZGF5XG5cdH1cblxuXHRpZiAoZHVyYXRpb24uaG91cikge1xuXHRcdGR1cmF0aW9uSW5NaWxsaXMgKz0gMTAwMCAqIDYwICogNjAgKiBkdXJhdGlvbi5ob3VyXG5cdH1cblxuXHRpZiAoZHVyYXRpb24ubWludXRlKSB7XG5cdFx0ZHVyYXRpb25Jbk1pbGxpcyArPSAxMDAwICogNjAgKiBkdXJhdGlvbi5taW51dGVcblx0fVxuXG5cdHJldHVybiBuZXcgRGF0ZShzdGFydFRpbWUuZ2V0VGltZSgpICsgZHVyYXRpb25Jbk1pbGxpcylcbn1cblxuZnVuY3Rpb24gZ2V0VHpJZChwcm9wOiBQcm9wZXJ0eSk6IHN0cmluZyB8IG51bGwge1xuXHRsZXQgdHpJZDogc3RyaW5nIHwgbnVsbCA9IG51bGxcblx0Y29uc3QgdHpJZFZhbHVlID0gcHJvcC5wYXJhbXNbXCJUWklEXCJdXG5cblx0aWYgKHR6SWRWYWx1ZSkge1xuXHRcdGlmIChJQU5BWm9uZS5pc1ZhbGlkWm9uZSh0eklkVmFsdWUpKSB7XG5cdFx0XHR0eklkID0gdHpJZFZhbHVlXG5cdFx0fSBlbHNlIGlmICh0eklkVmFsdWUgaW4gV2luZG93c1pvbmVzKSB7XG5cdFx0XHR0eklkID0gV2luZG93c1pvbmVzW3R6SWRWYWx1ZSBhcyBrZXlvZiB0eXBlb2YgV2luZG93c1pvbmVzXVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0eklkXG59XG5cbmZ1bmN0aW9uIG9uZURheUR1cmF0aW9uRW5kKHN0YXJ0VGltZTogRGF0ZSwgYWxsRGF5OiBib29sZWFuLCB0eklkOiBzdHJpbmcgfCBudWxsLCB6b25lOiBzdHJpbmcpOiBEYXRlIHtcblx0cmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUoc3RhcnRUaW1lLCB7XG5cdFx0em9uZTogYWxsRGF5ID8gXCJVVENcIiA6IHR6SWQgfHwgem9uZSxcblx0fSlcblx0XHQucGx1cyh7XG5cdFx0XHRkYXk6IDEsXG5cdFx0fSlcblx0XHQudG9KU0RhdGUoKVxufVxuXG5jb25zdCBNQUlMVE9fUFJFRklYX1JFR0VYID0gL15tYWlsdG86KC4qKS9pXG5cbmZ1bmN0aW9uIHBhcnNlTWFpbHRvVmFsdWUodmFsdWU6IHN0cmluZykge1xuXHRjb25zdCBtYXRjaCA9IHZhbHVlLm1hdGNoKE1BSUxUT19QUkVGSVhfUkVHRVgpXG5cdHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXVxufVxuXG5leHBvcnQgY29uc3QgY2FsZW5kYXJBdHRlbmRlZVN0YXR1c1RvUGFyc3RhdDogUmVjb3JkPENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsIHN0cmluZz4gPSB7XG5cdC8vIFdFIG1hcCBBRERFRCB0byBORUVEUy1BQ1RJT04gZm9yIHNlbmRpbmcgb3V0IGludml0ZXNcblx0W0NhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuQURERURdOiBcIk5FRURTLUFDVElPTlwiLFxuXHRbQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5ORUVEU19BQ1RJT05dOiBcIk5FRURTLUFDVElPTlwiLFxuXHRbQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5BQ0NFUFRFRF06IFwiQUNDRVBURURcIixcblx0W0NhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuREVDTElORURdOiBcIkRFQ0xJTkVEXCIsXG5cdFtDYWxlbmRhckF0dGVuZGVlU3RhdHVzLlRFTlRBVElWRV06IFwiVEVOVEFUSVZFXCIsXG59XG5jb25zdCBwYXJzdGF0VG9DYWxlbmRhckF0dGVuZGVlU3RhdHVzOiBSZWNvcmQ8c3RyaW5nLCBDYWxlbmRhckF0dGVuZGVlU3RhdHVzPiA9IHJldmVyc2UoY2FsZW5kYXJBdHRlbmRlZVN0YXR1c1RvUGFyc3RhdClcblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ2FsZW5kYXJFdmVudHMoaWNhbE9iamVjdDogSUNhbE9iamVjdCwgem9uZTogc3RyaW5nKTogUGFyc2VkQ2FsZW5kYXJEYXRhIHtcblx0Y29uc3QgbWV0aG9kUHJvcCA9IGdldFByb3AoaWNhbE9iamVjdCwgXCJNRVRIT0RcIiwgdHJ1ZSlcblx0Y29uc3QgbWV0aG9kID0gbWV0aG9kUHJvcCA/IG1ldGhvZFByb3AudmFsdWUgOiBDYWxlbmRhck1ldGhvZC5QVUJMSVNIXG5cdGNvbnN0IGV2ZW50T2JqZWN0cyA9IGljYWxPYmplY3QuY2hpbGRyZW4uZmlsdGVyKChvYmopID0+IG9iai50eXBlID09PSBcIlZFVkVOVFwiKVxuXHRjb25zdCBjb250ZW50cyA9IGdldENvbnRlbnRzKGV2ZW50T2JqZWN0cywgem9uZSlcblxuXHRyZXR1cm4ge1xuXHRcdG1ldGhvZCxcblx0XHRjb250ZW50cyxcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRDb250ZW50cyhldmVudE9iamVjdHM6IElDYWxPYmplY3RbXSwgem9uZTogc3RyaW5nKSB7XG5cdHJldHVybiBldmVudE9iamVjdHMubWFwKChldmVudE9iaiwgaW5kZXgpID0+IHtcblx0XHRjb25zdCBzdGFydFByb3AgPSBnZXRQcm9wKGV2ZW50T2JqLCBcIkRUU1RBUlRcIiwgZmFsc2UpXG5cdFx0Y29uc3QgdHpJZCA9IGdldFR6SWQoc3RhcnRQcm9wKVxuXHRcdGNvbnN0IHsgZGF0ZTogc3RhcnRUaW1lLCBhbGxEYXkgfSA9IHBhcnNlVGltZShzdGFydFByb3AudmFsdWUsIHR6SWQgPz8gdW5kZWZpbmVkKVxuXG5cdFx0Ly8gc3RhcnQgdGltZSBhbmQgdHppZCBpcyBzb3J0ZWQsIHNvIHdlIGNhbiB3b3JyeSBhYm91dCBldmVudCBpZGVudGl0eSBub3cgYmVmb3JlIHByb2NlZWRpbmcuLi5cblx0XHRsZXQgaGFzVmFsaWRVaWQgPSBmYWxzZVxuXHRcdGxldCB1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cdFx0dHJ5IHtcblx0XHRcdHVpZCA9IGdldFByb3BTdHJpbmdWYWx1ZShldmVudE9iaiwgXCJVSURcIiwgZmFsc2UpXG5cdFx0XHRoYXNWYWxpZFVpZCA9IHRydWVcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBhcnNlckVycm9yKSB7XG5cdFx0XHRcdC8vIEFsc28gcGFyc2UgZXZlbnQgYW5kIGNyZWF0ZSBuZXcgVUlEIGlmIG5vbmUgaXMgc2V0XG5cdFx0XHRcdHVpZCA9IGBpbXBvcnQtJHtEYXRlLm5vdygpfS0ke2luZGV4fUB0dXRhLmNvbWBcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZWN1cnJlbmNlSWRQcm9wID0gZ2V0UHJvcChldmVudE9iaiwgXCJSRUNVUlJFTkNFLUlEXCIsIHRydWUpXG5cdFx0bGV0IHJlY3VycmVuY2VJZDogRGF0ZSB8IG51bGwgPSBudWxsXG5cdFx0aWYgKHJlY3VycmVuY2VJZFByb3AgIT0gbnVsbCAmJiBoYXNWYWxpZFVpZCkge1xuXHRcdFx0Ly8gaWYgd2UgZ2VuZXJhdGVkIHRoZSBVSUQsIHdlIGhhdmUgbm8gd2F5IG9mIGtub3dpbmcgd2hpY2ggZXZlbnQgc2VyaWVzIHRoaXMgcmVjdXJyZW5jZUlkIHJlZmVycyB0by5cblx0XHRcdC8vIGluIHRoYXQgY2FzZSwgd2UganVzdCBkb24ndCBhZGQgdGhlIHJlY3VycmVuY2VJZCBhbmQgaW1wb3J0IHRoZSBldmVudCBhcyBhIHN0YW5kYWxvbmUuXG5cdFx0XHRyZWN1cnJlbmNlSWQgPSBwYXJzZVJlY3VycmVuY2VJZChyZWN1cnJlbmNlSWRQcm9wLCB0eklkKVxuXHRcdH1cblxuXHRcdGNvbnN0IGVuZFRpbWUgPSBwYXJzZUVuZFRpbWUoZXZlbnRPYmosIGFsbERheSwgc3RhcnRUaW1lLCB0eklkLCB6b25lKVxuXG5cdFx0bGV0IHN1bW1hcnk6IHN0cmluZyA9IFwiXCJcblx0XHRjb25zdCBtYXliZVN1bW1hcnkgPSBwYXJzZUlDYWxUZXh0KGV2ZW50T2JqLCBcIlNVTU1BUllcIilcblx0XHRpZiAobWF5YmVTdW1tYXJ5KSBzdW1tYXJ5ID0gbWF5YmVTdW1tYXJ5XG5cblx0XHRsZXQgbG9jYXRpb246IHN0cmluZyA9IFwiXCJcblx0XHRjb25zdCBtYXliZUxvY2F0aW9uID0gcGFyc2VJQ2FsVGV4dChldmVudE9iaiwgXCJMT0NBVElPTlwiKVxuXHRcdGlmIChtYXliZUxvY2F0aW9uKSBsb2NhdGlvbiA9IG1heWJlTG9jYXRpb25cblxuXHRcdGNvbnN0IHJydWxlUHJvcCA9IGdldFByb3BTdHJpbmdWYWx1ZShldmVudE9iaiwgXCJSUlVMRVwiLCB0cnVlKVxuXHRcdGNvbnN0IGV4Y2x1ZGVkRGF0ZVByb3BzID0gZXZlbnRPYmoucHJvcGVydGllcy5maWx0ZXIoKHApID0+IHAubmFtZSA9PT0gXCJFWERBVEVcIilcblxuXHRcdGxldCByZXBlYXRSdWxlOiBSZXBlYXRSdWxlIHwgbnVsbCA9IG51bGxcblx0XHRpZiAocnJ1bGVQcm9wICE9IG51bGwpIHtcblx0XHRcdHJlcGVhdFJ1bGUgPSBwYXJzZVJydWxlKHJydWxlUHJvcCwgdHpJZClcblx0XHRcdHJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlcyA9IHBhcnNlRXhEYXRlcyhleGNsdWRlZERhdGVQcm9wcylcblx0XHR9XG5cblx0XHRjb25zdCBkZXNjcmlwdGlvbiA9IHBhcnNlSUNhbFRleHQoZXZlbnRPYmosIFwiREVTQ1JJUFRJT05cIikgPz8gXCJcIlxuXG5cdFx0Y29uc3Qgc2VxdWVuY2VQcm9wID0gZ2V0UHJvcChldmVudE9iaiwgXCJTRVFVRU5DRVwiLCB0cnVlKVxuXHRcdGxldCBzZXF1ZW5jZTogc3RyaW5nID0gXCIwXCJcblx0XHRpZiAoc2VxdWVuY2VQcm9wKSB7XG5cdFx0XHRjb25zdCBzZXF1ZW5jZU51bWJlciA9IGZpbHRlckludChzZXF1ZW5jZVByb3AudmFsdWUpXG5cblx0XHRcdGlmIChOdW1iZXIuaXNOYU4oc2VxdWVuY2VOdW1iZXIpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBQYXJzZXJFcnJvcihcIlNFUVVFTkNFIHZhbHVlIGlzIG5vdCBhIG51bWJlclwiKVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb252ZXJ0IGl0IGJhY2sgdG8gTnVtYmVyU3RyaW5nLiBDb3VsZCB1c2Ugb3JpZ2luYWwgb25lIGJ1dCB0aGlzIGZlZWxzIG1vcmUgcm9idXN0LlxuXHRcdFx0c2VxdWVuY2UgPSBTdHJpbmcoc2VxdWVuY2VOdW1iZXIpXG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0ZW5kZWVzID0gZ2V0QXR0ZW5kZWVzKGV2ZW50T2JqKVxuXG5cdFx0Y29uc3Qgb3JnYW5pemVyUHJvcCA9IGdldFByb3AoZXZlbnRPYmosIFwiT1JHQU5JWkVSXCIsIHRydWUpXG5cdFx0bGV0IG9yZ2FuaXplcjogRW5jcnlwdGVkTWFpbEFkZHJlc3MgfCBudWxsID0gbnVsbFxuXHRcdGlmIChvcmdhbml6ZXJQcm9wKSB7XG5cdFx0XHRjb25zdCBvcmdhbml6ZXJBZGRyZXNzID0gcGFyc2VNYWlsdG9WYWx1ZShvcmdhbml6ZXJQcm9wLnZhbHVlKVxuXG5cdFx0XHRpZiAob3JnYW5pemVyQWRkcmVzcyAmJiBpc01haWxBZGRyZXNzKG9yZ2FuaXplckFkZHJlc3MsIGZhbHNlKSkge1xuXHRcdFx0XHRvcmdhbml6ZXIgPSBjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0XHRcdFx0YWRkcmVzczogb3JnYW5pemVyQWRkcmVzcyxcblx0XHRcdFx0XHRuYW1lOiBvcmdhbml6ZXJQcm9wLnBhcmFtc1tcIm5hbWVcIl0gfHwgXCJcIixcblx0XHRcdFx0fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwib3JnYW5pemVyIGhhcyBubyBhZGRyZXNzIG9yIGFkZHJlc3MgaXMgaW52YWxpZCwgaWdub3Jpbmc6IFwiLCBvcmdhbml6ZXJBZGRyZXNzKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGV2ZW50ID0gY3JlYXRlQ2FsZW5kYXJFdmVudCh7XG5cdFx0XHRkZXNjcmlwdGlvbixcblx0XHRcdHN0YXJ0VGltZSxcblx0XHRcdGVuZFRpbWUsXG5cdFx0XHR1aWQsXG5cdFx0XHRyZWN1cnJlbmNlSWQsXG5cdFx0XHRzdW1tYXJ5LFxuXHRcdFx0bG9jYXRpb24sXG5cdFx0XHRyZXBlYXRSdWxlLFxuXHRcdFx0c2VxdWVuY2UsXG5cdFx0XHRhdHRlbmRlZXMsXG5cdFx0XHRvcmdhbml6ZXIsXG5cdFx0XHRoYXNoZWRVaWQ6IG51bGwsXG5cdFx0XHRpbnZpdGVkQ29uZmlkZW50aWFsbHk6IG51bGwsXG5cdFx0XHRhbGFybUluZm9zOiBbXSxcblx0XHR9KSBhcyBSZXF1aXJlPFwidWlkXCIsIENhbGVuZGFyRXZlbnQ+XG5cblx0XHRsZXQgYWxhcm1zOiBBbGFybUluZm9UZW1wbGF0ZVtdID0gW11cblxuXHRcdHRyeSB7XG5cdFx0XHRhbGFybXMgPSBnZXRBbGFybXMoZXZlbnRPYmosIHN0YXJ0VGltZSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImFsYXJtIGlzIGludmFsaWQgZm9yIGV2ZW50OiBcIiwgZXZlbnQuc3VtbWFyeSwgZXZlbnQuc3RhcnRUaW1lKVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRldmVudCxcblx0XHRcdGFsYXJtcyxcblx0XHR9XG5cdH0pXG59XG5cbmZ1bmN0aW9uIGdldEF0dGVuZGVlcyhldmVudE9iajogSUNhbE9iamVjdCkge1xuXHRsZXQgYXR0ZW5kZWVzOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWVbXSA9IFtdXG5cdGZvciAoY29uc3QgcHJvcGVydHkgb2YgZXZlbnRPYmoucHJvcGVydGllcykge1xuXHRcdGlmIChwcm9wZXJ0eS5uYW1lID09PSBcIkFUVEVOREVFXCIpIHtcblx0XHRcdGNvbnN0IGF0dGVuZGVlQWRkcmVzcyA9IHBhcnNlTWFpbHRvVmFsdWUocHJvcGVydHkudmFsdWUpXG5cblx0XHRcdGlmICghYXR0ZW5kZWVBZGRyZXNzIHx8ICFpc01haWxBZGRyZXNzKGF0dGVuZGVlQWRkcmVzcywgZmFsc2UpKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiYXR0ZW5kZWUgaGFzIG5vIGFkZHJlc3Mgb3IgYWRkcmVzcyBpcyBpbnZhbGlkLCBpZ25vcmluZzogXCIsIGF0dGVuZGVlQWRkcmVzcylcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgcGFydFN0YXRTdHJpbmcgPSBwcm9wZXJ0eS5wYXJhbXNbXCJQQVJUU1RBVFwiXVxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gcGFydFN0YXRTdHJpbmcgPyBwYXJzdGF0VG9DYWxlbmRhckF0dGVuZGVlU3RhdHVzW3BhcnRTdGF0U3RyaW5nXSA6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMuTkVFRFNfQUNUSU9OXG5cblx0XHRcdGlmICghc3RhdHVzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBhdHRlbmRlZSBoYXMgaW52YWxpZCBwYXJ0c2F0OiAke3BhcnRTdGF0U3RyaW5nfSwgaWdub3JpbmdgKVxuXHRcdFx0XHRjb250aW51ZVxuXHRcdFx0fVxuXG5cdFx0XHRhdHRlbmRlZXMucHVzaChcblx0XHRcdFx0Y3JlYXRlQ2FsZW5kYXJFdmVudEF0dGVuZGVlKHtcblx0XHRcdFx0XHRhZGRyZXNzOiBjcmVhdGVFbmNyeXB0ZWRNYWlsQWRkcmVzcyh7XG5cdFx0XHRcdFx0XHRhZGRyZXNzOiBhdHRlbmRlZUFkZHJlc3MsXG5cdFx0XHRcdFx0XHRuYW1lOiBwcm9wZXJ0eS5wYXJhbXNbXCJDTlwiXSB8fCBcIlwiLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdHN0YXR1cyxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cdHJldHVybiBhdHRlbmRlZXNcbn1cblxuZnVuY3Rpb24gZ2V0QWxhcm1zKGV2ZW50T2JqOiBJQ2FsT2JqZWN0LCBzdGFydFRpbWU6IERhdGUpOiBBbGFybUluZm9UZW1wbGF0ZVtdIHtcblx0Y29uc3QgYWxhcm1zOiBBbGFybUluZm9UZW1wbGF0ZVtdID0gW11cblx0Zm9yIChjb25zdCBhbGFybUNoaWxkIG9mIGV2ZW50T2JqLmNoaWxkcmVuKSB7XG5cdFx0aWYgKGFsYXJtQ2hpbGQudHlwZSA9PT0gXCJWQUxBUk1cIikge1xuXHRcdFx0Y29uc3QgbmV3QWxhcm0gPSBwYXJzZUFsYXJtKGFsYXJtQ2hpbGQsIHN0YXJ0VGltZSlcblx0XHRcdGlmIChuZXdBbGFybSkgYWxhcm1zLnB1c2gobmV3QWxhcm0pXG5cdFx0fVxuXHR9XG5cdHJldHVybiBhbGFybXNcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBwcm9wZXJ0aWVzIGFjY29yZGluZyB0byB0aGUgaUNhbCBzdGFuZGFyZC5cbiAqIGh0dHBzOi8vaWNhbGVuZGFyLm9yZy9pQ2FsZW5kYXItUkZDLTU1NDUvMy0zLTExLXRleHQuaHRtbFxuICogQHBhcmFtIGV2ZW50T2JqXG4gKiBAcGFyYW0gdGFnXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNhbFRleHQoZXZlbnRPYmo6IElDYWxPYmplY3QsIHRhZzogc3RyaW5nKSB7XG5cdGxldCB0ZXh0ID0gZ2V0UHJvcFN0cmluZ1ZhbHVlKGV2ZW50T2JqLCB0YWcsIHRydWUpXG5cdGZvciAoY29uc3QgcmF3RXNjYXBlIGluIHJldklDYWxSZXBsYWNlbWVudHMpIHtcblx0XHRpZiAocmF3RXNjYXBlID09PSBcIlxcXFxuXCIpIHtcblx0XHRcdHRleHQgPSB0ZXh0Py5yZXBsYWNlKFwiXFxcXE5cIiwgcmV2SUNhbFJlcGxhY2VtZW50c1tyYXdFc2NhcGVdKVxuXHRcdH1cblx0XHR0ZXh0ID0gdGV4dD8ucmVwbGFjZShyYXdFc2NhcGUsIHJldklDYWxSZXBsYWNlbWVudHNbcmF3RXNjYXBlXSlcblx0fVxuXHRyZXR1cm4gdGV4dFxufVxuXG5mdW5jdGlvbiBwYXJzZUVuZFRpbWUoZXZlbnRPYmo6IElDYWxPYmplY3QsIGFsbERheTogYm9vbGVhbiwgc3RhcnRUaW1lOiBEYXRlLCB0eklkOiBzdHJpbmcgfCBudWxsLCB6b25lOiBzdHJpbmcpOiBEYXRlIHtcblx0Y29uc3QgZW5kUHJvcCA9IGdldFByb3AoZXZlbnRPYmosIFwiRFRFTkRcIiwgdHJ1ZSlcblxuXHRpZiAoZW5kUHJvcCkge1xuXHRcdGlmICh0eXBlb2YgZW5kUHJvcC52YWx1ZSAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IFBhcnNlckVycm9yKFwiRFRFTkQgdmFsdWUgaXMgbm90IGEgc3RyaW5nXCIpXG5cdFx0Y29uc3QgZW5kVHpJZCA9IGdldFR6SWQoZW5kUHJvcClcblx0XHRjb25zdCBwYXJzZWRFbmRUaW1lID0gcGFyc2VUaW1lKGVuZFByb3AudmFsdWUsIHR5cGVvZiBlbmRUeklkID09PSBcInN0cmluZ1wiID8gZW5kVHpJZCA6IHVuZGVmaW5lZClcblx0XHRjb25zdCBlbmRUaW1lID0gcGFyc2VkRW5kVGltZS5kYXRlXG5cdFx0aWYgKGVuZFRpbWUgPiBzdGFydFRpbWUpIHJldHVybiBlbmRUaW1lXG5cblx0XHQvLyBhcyBwZXIgUkZDLCB0aGVzZSBhcmUgX3RlY2huaWNhbGx5XyBpbGxlZ2FsOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNTU0NSNzZWN0aW9uLTMuOC4yLjJcblx0XHRpZiAoYWxsRGF5KSB7XG5cdFx0XHQvLyBpZiB0aGUgc3RhcnRUaW1lIGluZGljYXRlcyBhbiBhbGwtZGF5IGV2ZW50LCB3ZSB3YW50IHRvIHByZXNlcnZlIHRoYXQuXG5cdFx0XHQvLyB3ZSdsbCBhc3N1bWUgYSAxLWRheSBkdXJhdGlvbi5cblx0XHRcdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKHN0YXJ0VGltZSkucGx1cyh7IGRheTogMSB9KS50b0pTRGF0ZSgpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHdlIG1ha2UgYSBiZXN0IGVmZm9ydCB0byBkZWxpdmVyIGFsYXJtcyBhdCB0aGUgc2V0IGludGVydmFsIGJlZm9yZSBzdGFydFRpbWUgYW5kIHNldCB0aGVcblx0XHRcdC8vIGV2ZW50IGR1cmF0aW9uIHRvIGJlIDEgc2Vjb25kXG5cdFx0XHQvLyBhcyBvZiBub3c6XG5cdFx0XHQvLyAqIHRoaXMgZGlzcGxheXMgYXMgZW5kaW5nIHRoZSBzYW1lIG1pbnV0ZSBpdCBzdGFydHMgaW4gdGhlIHR1dGFub3RhIGNhbGVuZGFyXG5cdFx0XHQvLyAqIGdldHMgZXhwb3J0ZWQgd2l0aCBhIGR1cmF0aW9uIG9mIDEgc2Vjb25kXG5cdFx0XHRyZXR1cm4gRGF0ZVRpbWUuZnJvbUpTRGF0ZShzdGFydFRpbWUpLnBsdXMoeyBzZWNvbmQ6IDEgfSkudG9KU0RhdGUoKVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRjb25zdCBkdXJhdGlvblZhbHVlID0gZ2V0UHJvcFN0cmluZ1ZhbHVlKGV2ZW50T2JqLCBcIkRVUkFUSU9OXCIsIHRydWUpXG5cblx0XHRpZiAoZHVyYXRpb25WYWx1ZSkge1xuXHRcdFx0cmV0dXJuIHBhcnNlRXZlbnREdXJhdGlvbihkdXJhdGlvblZhbHVlLCBzdGFydFRpbWUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vID5Gb3IgY2FzZXMgd2hlcmUgYSBcIlZFVkVOVFwiIGNhbGVuZGFyIGNvbXBvbmVudCBzcGVjaWZpZXMgYSBcIkRUU1RBUlRcIiBwcm9wZXJ0eSB3aXRoIGEgREFURSB2YWx1ZSB0eXBlIGJ1dCBubyBcIkRURU5EXCIgbm9yXG5cdFx0XHQvLyBcIkRVUkFUSU9OXCIgcHJvcGVydHksIHRoZSBldmVudCdzIGR1cmF0aW9uIGlzIHRha2VuIHRvIGJlIG9uZSBkYXkuXG5cdFx0XHQvL1xuXHRcdFx0Ly8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzU1NDUjc2VjdGlvbi0zLjYuMVxuXHRcdFx0cmV0dXJuIG9uZURheUR1cmF0aW9uRW5kKHN0YXJ0VGltZSwgYWxsRGF5LCB0eklkLCB6b25lKVxuXHRcdH1cblx0fVxufVxuXG50eXBlIElDYWxEdXJhdGlvbiA9IHtcblx0cG9zaXRpdmU6IGJvb2xlYW5cblx0ZGF5PzogbnVtYmVyXG5cdHdlZWs/OiBudW1iZXJcblx0aG91cj86IG51bWJlclxuXHRtaW51dGU/OiBudW1iZXJcbn1cblxuZnVuY3Rpb24gaWNhbEZyZXF1ZW5jeVRvUmVwZWF0UGVyaW9kKHZhbHVlOiBzdHJpbmcpOiBSZXBlYXRQZXJpb2Qge1xuXHRjb25zdCBjb252ZXJ0ZWRWYWx1ZSA9IHtcblx0XHREQUlMWTogUmVwZWF0UGVyaW9kLkRBSUxZLFxuXHRcdFdFRUtMWTogUmVwZWF0UGVyaW9kLldFRUtMWSxcblx0XHRNT05USExZOiBSZXBlYXRQZXJpb2QuTU9OVEhMWSxcblx0XHRZRUFSTFk6IFJlcGVhdFBlcmlvZC5BTk5VQUxMWSxcblx0fVt2YWx1ZV1cblx0aWYgKGNvbnZlcnRlZFZhbHVlID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXCJJbnZhbGlkIGZyZXF1ZW5jeTogXCIgKyB2YWx1ZSlcblx0fVxuXHRyZXR1cm4gY29udmVydGVkVmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdFBlcmlvZFRvSWNhbEZyZXF1ZW5jeShyZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCkge1xuXHQvLyBTZXBhcmF0ZSB2YXJpYWJsZSB0byBkZWNsYXJlIG1hcHBpbmcgdHlwZVxuXHRjb25zdCBtYXBwaW5nOiBSZWNvcmQ8UmVwZWF0UGVyaW9kLCBzdHJpbmc+ID0ge1xuXHRcdFtSZXBlYXRQZXJpb2QuREFJTFldOiBcIkRBSUxZXCIsXG5cdFx0W1JlcGVhdFBlcmlvZC5XRUVLTFldOiBcIldFRUtMWVwiLFxuXHRcdFtSZXBlYXRQZXJpb2QuTU9OVEhMWV06IFwiTU9OVEhMWVwiLFxuXHRcdFtSZXBlYXRQZXJpb2QuQU5OVUFMTFldOiBcIllFQVJMWVwiLFxuXHR9XG5cdHJldHVybiBtYXBwaW5nW3JlcGVhdFBlcmlvZF1cbn1cblxudHlwZSBEYXRlQ29tcG9uZW50cyA9IHtcblx0eWVhcjogbnVtYmVyXG5cdG1vbnRoOiBudW1iZXJcblx0ZGF5OiBudW1iZXJcblx0em9uZT86IHN0cmluZ1xufVxudHlwZSBUaW1lQ29tcG9uZW50cyA9IHtcblx0aG91cjogbnVtYmVyXG5cdG1pbnV0ZTogbnVtYmVyXG59XG50eXBlIERhdGVUaW1lQ29tcG9uZW50cyA9IERhdGVDb21wb25lbnRzICYgVGltZUNvbXBvbmVudHNcblxuLyoqIHBhcnNlIGEgdGltZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGltZUludG9Db21wb25lbnRzKHZhbHVlOiBzdHJpbmcpOiBEYXRlQ29tcG9uZW50cyB8IERhdGVUaW1lQ29tcG9uZW50cyB7XG5cdGNvbnN0IHRyaW1tZWRWYWx1ZSA9IHZhbHVlLnRyaW0oKVxuXG5cdGlmICgvWzAtOV17OH1UWzAtOV17Nn1aLy50ZXN0KHRyaW1tZWRWYWx1ZSkpIHtcblx0XHQvLyBkYXRlIHdpdGggdGltZSBpbiBVVENcblx0XHRjb25zdCB7IHllYXIsIG1vbnRoLCBkYXkgfSA9IHBhcnNlRGF0ZVN0cmluZyh0cmltbWVkVmFsdWUpXG5cdFx0Y29uc3QgaG91ciA9IHBhcnNlSW50KHRyaW1tZWRWYWx1ZS5zbGljZSg5LCAxMSkpXG5cdFx0Y29uc3QgbWludXRlID0gcGFyc2VJbnQodHJpbW1lZFZhbHVlLnNsaWNlKDExLCAxMykpXG5cdFx0cmV0dXJuIHtcblx0XHRcdHllYXIsXG5cdFx0XHRtb250aCxcblx0XHRcdGRheSxcblx0XHRcdGhvdXIsXG5cdFx0XHRtaW51dGUsXG5cdFx0XHR6b25lOiBcIlVUQ1wiLFxuXHRcdH1cblx0fSBlbHNlIGlmICgvWzAtOV17OH1UWzAtOV17Nn0vLnRlc3QodHJpbW1lZFZhbHVlKSkge1xuXHRcdC8vIGRhdGUgd2l0aCB0aW1lIGluIGxvY2FsIHRpbWV6b25lXG5cdFx0Y29uc3QgeyB5ZWFyLCBtb250aCwgZGF5IH0gPSBwYXJzZURhdGVTdHJpbmcodHJpbW1lZFZhbHVlKVxuXHRcdGNvbnN0IGhvdXIgPSBwYXJzZUludCh0cmltbWVkVmFsdWUuc2xpY2UoOSwgMTEpKVxuXHRcdGNvbnN0IG1pbnV0ZSA9IHBhcnNlSW50KHRyaW1tZWRWYWx1ZS5zbGljZSgxMSwgMTMpKVxuXHRcdHJldHVybiB7XG5cdFx0XHR5ZWFyLFxuXHRcdFx0bW9udGgsXG5cdFx0XHRkYXksXG5cdFx0XHRob3VyLFxuXHRcdFx0bWludXRlLFxuXHRcdH1cblx0fSBlbHNlIGlmICgvWzAtOV17OH0vLnRlc3QodHJpbW1lZFZhbHVlKSkge1xuXHRcdC8vIGFsbCBkYXkgZXZlbnRzXG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHBhcnNlRGF0ZVN0cmluZyh0cmltbWVkVmFsdWUpKVxuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBQYXJzZXJFcnJvcihcIkZhaWxlZCB0byBwYXJzZSB0aW1lOiBcIiArIHRyaW1tZWRWYWx1ZSlcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VVbnRpbFJydWxlVGltZSh2YWx1ZTogc3RyaW5nLCB6b25lOiBzdHJpbmcgfCBudWxsKTogRGF0ZSB7XG5cdGNvbnN0IGNvbXBvbmVudHMgPSBwYXJzZVRpbWVJbnRvQ29tcG9uZW50cyh2YWx1ZSlcblx0Ly8gcnJ1bGUgdW50aWwgaXMgaW5jbHVzaXZlIGluIGljYWwgYnV0IGV4Y2x1c2l2ZSBpbiBUdXRhbm90YVxuXHRjb25zdCBmaWxsZWRDb21wb25lbnRzID0gY29tcG9uZW50c1xuXHQvLyBpZiBtaW51dGUgaXMgbm90IHByb3ZpZGVkIGl0IGlzIGFuIGFsbCBkYXkgZGF0ZSBZWVlZTU1ERFxuXHRjb25zdCBhbGxEYXkgPSAhKFwibWludXRlXCIgaW4gY29tcG9uZW50cylcblx0Ly8gV2UgZG9uJ3QgdXNlIHRoZSB6b25lIGZyb20gdGhlIGNvbXBvbmVudHMgKFJSVUxFKSBidXQgdGhlIG9uZSBmcm9tIHN0YXJ0IHRpbWUgaWYgaXQgd2FzIGdpdmVuLlxuXHQvLyBEb24ndCBhc2sgbWUgd2h5IGJ1dCB0aGF0J3MgaG93IGl0IGlzLlxuXHRjb25zdCBlZmZlY3RpdmVab25lID0gYWxsRGF5ID8gXCJVVENcIiA6IHpvbmUgPz8gdW5kZWZpbmVkXG5cdGRlbGV0ZSBmaWxsZWRDb21wb25lbnRzW1wiem9uZVwiXVxuXHRjb25zdCBsdXhvbkRhdGUgPSBEYXRlVGltZS5mcm9tT2JqZWN0KGZpbGxlZENvbXBvbmVudHMsIHsgem9uZTogZWZmZWN0aXZlWm9uZSB9KVxuXHRjb25zdCBzdGFydE9mTmV4dERheSA9IGx1eG9uRGF0ZVxuXHRcdC5wbHVzKHtcblx0XHRcdGRheTogMSxcblx0XHR9KVxuXHRcdC5zdGFydE9mKFwiZGF5XCIpXG5cdHJldHVybiB0b1ZhbGlkSlNEYXRlKHN0YXJ0T2ZOZXh0RGF5LCB2YWx1ZSwgem9uZSlcbn1cblxuLyoqXG4gKiBwYXJzZSBhIGljYWwgdGltZSBzdHJpbmcgYW5kIHJldHVybiBhIEpTIERhdGUgb2JqZWN0IGFsb25nIHdpdGggYSBmbGFnIHRoYXQgZGV0ZXJtaW5lc1xuICogd2hldGhlciB0aGUgdGltZSBzaG91bGQgYmUgY29uc2lkZXJlZCBwYXJ0IG9mIGFuIGFsbC1kYXkgZXZlbnRcbiAqIEBwYXJhbSB2YWx1ZSB7c3RyaW5nfSB0aGUgdGltZSBzdHJpbmcgdG8gYmUgcGFyc2VkXG4gKiBAcGFyYW0gem9uZSB7c3RyaW5nfSB0aGUgdGltZSB6b25lIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUaW1lKFxuXHR2YWx1ZTogc3RyaW5nLFxuXHR6b25lPzogc3RyaW5nLFxuKToge1xuXHRkYXRlOiBEYXRlXG5cdGFsbERheTogYm9vbGVhblxufSB7XG5cdGNvbnN0IGNvbXBvbmVudHMgPSBwYXJzZVRpbWVJbnRvQ29tcG9uZW50cyh2YWx1ZSlcblx0Ly8gaWYgbWludXRlIGlzIG5vdCBwcm92aWRlZCBpdCBpcyBhbiBhbGwgZGF5IGRhdGUgWVlZWU1NRERcblx0Y29uc3QgYWxsRGF5ID0gIShcIm1pbnV0ZVwiIGluIGNvbXBvbmVudHMpXG5cdGNvbnN0IGVmZmVjdGl2ZVpvbmUgPSBhbGxEYXkgPyBcIlVUQ1wiIDogY29tcG9uZW50cy56b25lID8/IHpvbmVcblx0ZGVsZXRlIGNvbXBvbmVudHNbXCJ6b25lXCJdXG5cdGNvbnN0IGZpbGxlZENvbXBvbmVudHMgPSBPYmplY3QuYXNzaWduKFxuXHRcdHt9LFxuXHRcdGFsbERheVxuXHRcdFx0PyB7XG5cdFx0XHRcdFx0aG91cjogMCxcblx0XHRcdFx0XHRtaW51dGU6IDAsXG5cdFx0XHRcdFx0c2Vjb25kOiAwLFxuXHRcdFx0XHRcdG1pbGxpc2Vjb25kOiAwLFxuXHRcdFx0ICB9XG5cdFx0XHQ6IHt9LFxuXHRcdGNvbXBvbmVudHMsXG5cdClcblxuXHR0cnkge1xuXHRcdGNvbnN0IGRhdGVUaW1lID0gRGF0ZVRpbWUuZnJvbU9iamVjdChmaWxsZWRDb21wb25lbnRzLCB7IHpvbmU6IGVmZmVjdGl2ZVpvbmUgfSlcblx0XHRyZXR1cm4geyBkYXRlOiB0b1ZhbGlkSlNEYXRlKGRhdGVUaW1lLCB2YWx1ZSwgem9uZSA/PyBudWxsKSwgYWxsRGF5IH1cblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmIChlIGluc3RhbmNlb2YgUGFyc2VyRXJyb3IpIHtcblx0XHRcdHRocm93IGVcblx0XHR9XG5cdFx0dGhyb3cgbmV3IFBhcnNlckVycm9yKFxuXHRcdFx0YGZhaWxlZCB0byBwYXJzZSB0aW1lIGZyb20gJHt2YWx1ZX0gdG8gJHtKU09OLnN0cmluZ2lmeShmaWxsZWRDb21wb25lbnRzKX0sIGVmZmVjdGl2ZVpvbmU6ICR7ZWZmZWN0aXZlWm9uZX0sIG9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gLFxuXHRcdClcblx0fVxufVxuXG5mdW5jdGlvbiB0b1ZhbGlkSlNEYXRlKGRhdGVUaW1lOiBEYXRlVGltZSwgdmFsdWU6IHN0cmluZywgem9uZTogc3RyaW5nIHwgbnVsbCk6IERhdGUge1xuXHRpZiAoIWRhdGVUaW1lLmlzVmFsaWQpIHtcblx0XHR0aHJvdyBuZXcgUGFyc2VyRXJyb3IoYERhdGUgdmFsdWUgJHt2YWx1ZX0gaXMgaW52YWxpZCBpbiB6b25lICR7U3RyaW5nKHpvbmUpfWApXG5cdH1cblxuXHRyZXR1cm4gZGF0ZVRpbWUudG9KU0RhdGUoKVxufVxuXG5mdW5jdGlvbiBwYXJzZVByb3BlcnR5TmFtZShpdGVyYXRvcjogU3RyaW5nSXRlcmF0b3IpOiBzdHJpbmcge1xuXHRsZXQgdGV4dCA9IFwiXCJcblxuXHRsZXQgbmV4dFxuXHR3aGlsZSAoKG5leHQgPSBpdGVyYXRvci5wZWVrKCkpICYmIC9bYS16QS1aMC05LV9dLy50ZXN0KG5leHQpKSB7XG5cdFx0dGV4dCArPSBuZXZlck51bGwoaXRlcmF0b3IubmV4dCgpLnZhbHVlKVxuXHR9XG5cblx0aWYgKHRleHQgPT09IFwiXCIpIHtcblx0XHR0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXCJjb3VsZCBub3QgcGFyc2UgcHJvcGVydHkgbmFtZTogXCIgKyBpdGVyYXRvci5wZWVrKCkpXG5cdH1cblxuXHRyZXR1cm4gdGV4dFxufVxuXG5jb25zdCBzZWNvbmREdXJhdGlvblBhcnNlcjogUGFyc2VyPFtudW1iZXIsIHN0cmluZ10+ID0gY29tYmluZVBhcnNlcnMobnVtYmVyUGFyc2VyLCBtYWtlQ2hhcmFjdGVyUGFyc2VyKFwiU1wiKSlcbmNvbnN0IG1pbnV0ZUR1cmF0aW9uUGFyc2VyOiBQYXJzZXI8W251bWJlciwgc3RyaW5nXT4gPSBjb21iaW5lUGFyc2VycyhudW1iZXJQYXJzZXIsIG1ha2VDaGFyYWN0ZXJQYXJzZXIoXCJNXCIpKVxuY29uc3QgaG91ckR1cmF0aW9uUGFyc2VyOiBQYXJzZXI8W251bWJlciwgc3RyaW5nXT4gPSBjb21iaW5lUGFyc2VycyhudW1iZXJQYXJzZXIsIG1ha2VDaGFyYWN0ZXJQYXJzZXIoXCJIXCIpKVxudHlwZSBUaW1lRHVyYXRpb24gPSB7XG5cdHR5cGU6IFwidGltZVwiXG5cdGhvdXI/OiBudW1iZXJcblx0bWludXRlPzogbnVtYmVyXG5cdHNlY29uZD86IG51bWJlclxufVxudHlwZSBEYXRlRHVyYXRpb24gPSB7XG5cdHR5cGU6IFwiZGF0ZVwiXG5cdGRheTogbnVtYmVyXG5cdHRpbWU6IFRpbWVEdXJhdGlvbiB8IG51bGxcbn1cbnR5cGUgV2Vla0R1cmF0aW9uID0ge1xuXHR0eXBlOiBcIndlZWtcIlxuXHR3ZWVrOiBudW1iZXJcbn1cbmNvbnN0IGR1cmF0aW9uVGltZVBhcnNlciA9IG1hcFBhcnNlcihcblx0Y29tYmluZVBhcnNlcnMobWFrZUNoYXJhY3RlclBhcnNlcihcIlRcIiksIG1heWJlUGFyc2UoaG91ckR1cmF0aW9uUGFyc2VyKSwgbWF5YmVQYXJzZShtaW51dGVEdXJhdGlvblBhcnNlciksIG1heWJlUGFyc2Uoc2Vjb25kRHVyYXRpb25QYXJzZXIpKSxcblx0KHBhcnNlZCkgPT4ge1xuXHRcdC8vTm90ZTogd2UgcGFyc2UgZm9yIHNlY29uZHMgaW4gY2FzZSB0aGV5IGFyZSB0aGVyZSwgYnV0IGRvIG5vdCBoYXZlIHRoYXQgYXMgYW4gb3B0aW9uLCBzbyB0aGV5IGFyZSBpZ25vcmVkXG5cdFx0bGV0IGhvdXIsIG1pbnV0ZVxuXG5cdFx0Ly8gdGhlIGZpcnN0IGl0ZW0gaW4gcGFyc2VkIGlzIFQgKGlmIHRpbWUgaXMgdGhlcmUpXG5cdFx0aWYgKHBhcnNlZFsxXSkge1xuXHRcdFx0aG91ciA9IHBhcnNlZFsxXVswXVxuXHRcdH1cblx0XHRpZiAocGFyc2VkWzJdKSB7XG5cdFx0XHRtaW51dGUgPSBwYXJzZWRbMl1bMF1cblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aG91cixcblx0XHRcdG1pbnV0ZSxcblx0XHR9XG5cdH0sXG4pXG5jb25zdCBkdXJhdGlvbkRheVBhcnNlcjogUGFyc2VyPFtudW1iZXIsIHN0cmluZ10+ID0gY29tYmluZVBhcnNlcnMobnVtYmVyUGFyc2VyLCBtYWtlQ2hhcmFjdGVyUGFyc2VyKFwiRFwiKSlcbmNvbnN0IGR1cmF0aW9uV2Vla1BhcnNlcjogUGFyc2VyPFtudW1iZXIsIHN0cmluZ10+ID0gY29tYmluZVBhcnNlcnMobnVtYmVyUGFyc2VyLCBtYWtlQ2hhcmFjdGVyUGFyc2VyKFwiV1wiKSlcbmNvbnN0IGR1cmF0aW9uUGFyc2VyID0gbWFwUGFyc2VyKFxuXHRjb21iaW5lUGFyc2Vycyhcblx0XHRtYXliZVBhcnNlKG1ha2VFaXRoZXJQYXJzZXIobWFrZUNoYXJhY3RlclBhcnNlcihcIitcIiksIG1ha2VDaGFyYWN0ZXJQYXJzZXIoXCItXCIpKSksXG5cdFx0bWFrZUNoYXJhY3RlclBhcnNlcihcIlBcIiksXG5cdFx0bWF5YmVQYXJzZShkdXJhdGlvbldlZWtQYXJzZXIpLFxuXHRcdG1heWJlUGFyc2UoZHVyYXRpb25EYXlQYXJzZXIpLFxuXHRcdG1heWJlUGFyc2UoZHVyYXRpb25UaW1lUGFyc2VyKSxcblx0KSxcblx0KHBhcnNlZCkgPT4ge1xuXHRcdGNvbnN0IHBvc2l0aXZlID0gcGFyc2VkWzBdICE9PSBcIi1cIlxuXHRcdGxldCB3ZWVrLCBkYXksIGhvdXIsIG1pbnV0ZVxuXHRcdGlmIChwYXJzZWRbMl0pIHtcblx0XHRcdHdlZWsgPSBwYXJzZWRbMl1bMF1cblx0XHR9XG5cdFx0aWYgKHBhcnNlZFszXSkge1xuXHRcdFx0ZGF5ID0gcGFyc2VkWzNdWzBdXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHBvc2l0aXZlLFxuXHRcdFx0d2Vlayxcblx0XHRcdGRheSxcblx0XHRcdGhvdXI6IHBhcnNlZFs0XT8uaG91cixcblx0XHRcdG1pbnV0ZTogcGFyc2VkWzRdPy5taW51dGUsXG5cdFx0fVxuXHR9LFxuKVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdXJhdGlvbih2YWx1ZTogc3RyaW5nKTogSUNhbER1cmF0aW9uIHtcblx0Y29uc3QgaXRlcmF0b3IgPSBuZXcgU3RyaW5nSXRlcmF0b3IodmFsdWUpXG5cdGNvbnN0IGR1cmF0aW9uID0gZHVyYXRpb25QYXJzZXIoaXRlcmF0b3IpXG5cblx0aWYgKGl0ZXJhdG9yLnBlZWsoKSkge1xuXHRcdHRocm93IG5ldyBQYXJzZXJFcnJvcihcIkNvdWxkIG5vdCBwYXJzZSBkdXJhdGlvbiBjb21wbGV0ZWx5XCIpXG5cdH1cblxuXHRyZXR1cm4gZHVyYXRpb25cbn1cbiIsImltcG9ydCB7IENhbGVuZGFyRXZlbnQsIENhbGVuZGFyR3JvdXBSb290IH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IEFsYXJtSW5mb1RlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGFzc2lnbkV2ZW50SWQsIENhbGVuZGFyRXZlbnRWYWxpZGl0eSwgY2hlY2tFdmVudFZhbGlkaXR5LCBnZXRUaW1lWm9uZSB9IGZyb20gXCIuLi9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgUGFyc2VkQ2FsZW5kYXJEYXRhLCBQYXJzZWRFdmVudCB9IGZyb20gXCIuL0NhbGVuZGFySW1wb3J0ZXIuanNcIlxuaW1wb3J0IHsgZnJlZXplTWFwLCBnZXRGcm9tTWFwLCBncm91cEJ5LCBpbnNlcnRJbnRvU29ydGVkQXJyYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGdlbmVyYXRlRXZlbnRFbGVtZW50SWQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURhdGVXcmFwcGVyIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgcGFyc2VDYWxlbmRhckV2ZW50cywgcGFyc2VJQ2FsZW5kYXIgfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL2V4cG9ydC9DYWxlbmRhclBhcnNlci5qc1wiXG5pbXBvcnQgeyBsYW5nLCB0eXBlIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgYXNzZXJ0VmFsaWRVUkwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzL2Rpc3QvVXRpbHMuanNcIlxuXG5leHBvcnQgZW51bSBFdmVudEltcG9ydFJlamVjdGlvblJlYXNvbiB7XG5cdFByZTE5NzAsXG5cdEludmVyc2VkLFxuXHRJbnZhbGlkRGF0ZSxcblx0RHVwbGljYXRlLFxufVxuXG5leHBvcnQgdHlwZSBFdmVudFdyYXBwZXIgPSB7XG5cdGV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdGFsYXJtczogUmVhZG9ubHlBcnJheTxBbGFybUluZm9UZW1wbGF0ZT5cbn1cblxuLyoqIGNoZWNrIGlmIHRoZSBldmVudCBzaG91bGQgYmUgc2tpcHBlZCBiZWNhdXNlIGl0J3MgaW52YWxpZCBvciBhbHJlYWR5IGltcG9ydGVkLiBpZiBub3QsIGFkZCBpdCB0byB0aGUgbWFwLiAqL1xuZnVuY3Rpb24gc2hvdWxkQmVTa2lwcGVkKGV2ZW50OiBDYWxlbmRhckV2ZW50LCBpbnN0YW5jZUlkZW50aWZpZXJUb0V2ZW50TWFwOiBNYXA8c3RyaW5nLCBDYWxlbmRhckV2ZW50Pik6IEV2ZW50SW1wb3J0UmVqZWN0aW9uUmVhc29uIHwgbnVsbCB7XG5cdGlmICghZXZlbnQudWlkKSB7XG5cdFx0Ly8gc2hvdWxkIG5vdCBoYXBwZW4gYmVjYXVzZSBjYWxlbmRhciBwYXJzZXIgd2lsbCBnZW5lcmF0ZSB1aWRzIGlmIHRoZXkgZG8gbm90IGV4aXN0XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVWlkIGlzIG5vdCBzZXQgZm9yIGltcG9ydGVkIGV2ZW50XCIpXG5cdH1cblxuXHRzd2l0Y2ggKGNoZWNrRXZlbnRWYWxpZGl0eShldmVudCkpIHtcblx0XHRjYXNlIENhbGVuZGFyRXZlbnRWYWxpZGl0eS5JbnZhbGlkQ29udGFpbnNJbnZhbGlkRGF0ZTpcblx0XHRcdHJldHVybiBFdmVudEltcG9ydFJlamVjdGlvblJlYXNvbi5JbnZhbGlkRGF0ZVxuXHRcdGNhc2UgQ2FsZW5kYXJFdmVudFZhbGlkaXR5LkludmFsaWRFbmRCZWZvcmVTdGFydDpcblx0XHRcdHJldHVybiBFdmVudEltcG9ydFJlamVjdGlvblJlYXNvbi5JbnZlcnNlZFxuXHRcdGNhc2UgQ2FsZW5kYXJFdmVudFZhbGlkaXR5LkludmFsaWRQcmUxOTcwOlxuXHRcdFx0cmV0dXJuIEV2ZW50SW1wb3J0UmVqZWN0aW9uUmVhc29uLlByZTE5NzBcblx0fVxuXHRjb25zdCBpbnN0YW5jZUlkZW50aWZpZXIgPSBtYWtlSW5zdGFuY2VJZGVudGlmaWVyKGV2ZW50KVxuXHRpZiAoIWluc3RhbmNlSWRlbnRpZmllclRvRXZlbnRNYXAuaGFzKGluc3RhbmNlSWRlbnRpZmllcikpIHtcblx0XHRpbnN0YW5jZUlkZW50aWZpZXJUb0V2ZW50TWFwLnNldChpbnN0YW5jZUlkZW50aWZpZXIsIGV2ZW50KVxuXHRcdHJldHVybiBudWxsXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIEV2ZW50SW1wb3J0UmVqZWN0aW9uUmVhc29uLkR1cGxpY2F0ZVxuXHR9XG59XG5cbi8qKiB3ZSB0cnkgdG8gZW5mb3JjZSB0aGF0IGVhY2ggY2FsZW5kYXIgb25seSBjb250YWlucyBlYWNoIHVpZCBvbmNlLCBidXQgd2UgbmVlZCB0byB0YWtlIGludG8gY29uc2lkZXJhdGlvblxuICogdGhhdCBhbHRlcmVkIGluc3RhbmNlcyBoYXZlIHRoZSBzYW1lIHVpZCBhcyB0aGVpciBwcm9nZW5pdG9yLiovXG5mdW5jdGlvbiBtYWtlSW5zdGFuY2VJZGVudGlmaWVyKGV2ZW50OiBDYWxlbmRhckV2ZW50KTogc3RyaW5nIHtcblx0cmV0dXJuIGAke2V2ZW50LnVpZH0tJHtldmVudC5yZWN1cnJlbmNlSWQ/LmdldFRpbWUoKSA/PyBcInByb2dlbml0b3JcIn1gXG59XG5cbmV4cG9ydCB0eXBlIFJlamVjdGVkRXZlbnRzID0gTWFwPEV2ZW50SW1wb3J0UmVqZWN0aW9uUmVhc29uLCBBcnJheTxDYWxlbmRhckV2ZW50Pj5cblxuLyoqIHNvcnQgdGhlIHBhcnNlZCBldmVudHMgaW50byB0aGUgb25lcyB3ZSB3YW50IHRvIGNyZWF0ZSBhbmQgdGhlIG9uZXMgd2Ugd2FudCB0byByZWplY3QgKHN0YXRpbmcgYSByZWplY3Rpb24gcmVhc29uKVxuICogd2lsbCBhc3NpZ24gZXZlbnQgaWQgYWNjb3JkaW5nIHRvIHRoZSBjYWxlbmRhckdyb3VwUm9vdCBhbmQgdGhlIGxvbmcvc2hvcnQgZXZlbnQgc3RhdHVzICovXG5leHBvcnQgZnVuY3Rpb24gc29ydE91dFBhcnNlZEV2ZW50cyhcblx0cGFyc2VkRXZlbnRzOiBQYXJzZWRFdmVudFtdLFxuXHRleGlzdGluZ0V2ZW50czogQXJyYXk8Q2FsZW5kYXJFdmVudD4sXG5cdGNhbGVuZGFyR3JvdXBSb290OiBDYWxlbmRhckdyb3VwUm9vdCxcblx0em9uZTogc3RyaW5nLFxuKToge1xuXHRyZWplY3RlZEV2ZW50czogUmVqZWN0ZWRFdmVudHNcblx0ZXZlbnRzRm9yQ3JlYXRpb246IEFycmF5PEV2ZW50V3JhcHBlcj5cbn0ge1xuXHRjb25zdCBpbnN0YW5jZUlkZW50aWZpZXJUb0V2ZW50TWFwID0gbmV3IE1hcCgpXG5cdGZvciAoY29uc3QgZXhpc3RpbmdFdmVudCBvZiBleGlzdGluZ0V2ZW50cykge1xuXHRcdGlmIChleGlzdGluZ0V2ZW50LnVpZCA9PSBudWxsKSBjb250aW51ZVxuXHRcdGluc3RhbmNlSWRlbnRpZmllclRvRXZlbnRNYXAuc2V0KG1ha2VJbnN0YW5jZUlkZW50aWZpZXIoZXhpc3RpbmdFdmVudCksIGV4aXN0aW5nRXZlbnQpXG5cdH1cblxuXHRjb25zdCByZWplY3RlZEV2ZW50czogUmVqZWN0ZWRFdmVudHMgPSBuZXcgTWFwKClcblx0Y29uc3QgZXZlbnRzRm9yQ3JlYXRpb246IEFycmF5PHsgZXZlbnQ6IENhbGVuZGFyRXZlbnQ7IGFsYXJtczogQXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+IH0+ID0gW11cblx0Zm9yIChjb25zdCBbXywgZmxhdFBhcnNlZEV2ZW50c10gb2YgZ3JvdXBCeShwYXJzZWRFdmVudHMsIChlKSA9PiBlLmV2ZW50LnVpZCkpIHtcblx0XHRsZXQgcHJvZ2VuaXRvcjogeyBldmVudDogQ2FsZW5kYXJFdmVudDsgYWxhcm1zOiBBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4gfSB8IG51bGwgPSBudWxsXG5cdFx0bGV0IGFsdGVyZWRJbnN0YW5jZXM6IEFycmF5PHsgZXZlbnQ6IENhbGVuZGFyRXZlbnQ7IGFsYXJtczogQXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+IH0+ID0gW11cblxuXHRcdGZvciAoY29uc3QgeyBldmVudCwgYWxhcm1zIH0gb2YgZmxhdFBhcnNlZEV2ZW50cykge1xuXHRcdFx0aWYgKGZsYXRQYXJzZWRFdmVudHMubGVuZ3RoID4gMSlcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiW0ltcG9ydEV4cG9ydFV0aWxzXSBGb3VuZCBldmVudHMgd2l0aCBzYW1lIHVpZDogZmxhdFBhcnNlZEV2ZW50cyB3aXRoIG1vcmUgdGhhbiBvbmUgZW50cnlcIiwgeyBmbGF0UGFyc2VkRXZlbnRzIH0pXG5cdFx0XHRjb25zdCByZWplY3Rpb25SZWFzb24gPSBzaG91bGRCZVNraXBwZWQoZXZlbnQsIGluc3RhbmNlSWRlbnRpZmllclRvRXZlbnRNYXApXG5cdFx0XHRpZiAocmVqZWN0aW9uUmVhc29uICE9IG51bGwpIHtcblx0XHRcdFx0Z2V0RnJvbU1hcChyZWplY3RlZEV2ZW50cywgcmVqZWN0aW9uUmVhc29uLCAoKSA9PiBbXSkucHVzaChldmVudClcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblxuXHRcdFx0Ly8gaGFzaGVkVWlkIHdpbGwgYmUgc2V0IGxhdGVyIGluIGNhbGVuZGFyRmFjYWRlIHRvIGF2b2lkIGltcG9ydGluZyB0aGUgaGFzaCBmdW5jdGlvbiBoZXJlXG5cdFx0XHRjb25zdCByZXBlYXRSdWxlID0gZXZlbnQucmVwZWF0UnVsZVxuXHRcdFx0ZXZlbnQuX293bmVyR3JvdXAgPSBjYWxlbmRhckdyb3VwUm9vdC5faWRcblxuXHRcdFx0aWYgKHJlcGVhdFJ1bGUgIT0gbnVsbCAmJiByZXBlYXRSdWxlLnRpbWVab25lID09PSBcIlwiKSB7XG5cdFx0XHRcdHJlcGVhdFJ1bGUudGltZVpvbmUgPSBnZXRUaW1lWm9uZSgpXG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGFsYXJtSW5mbyBvZiBhbGFybXMpIHtcblx0XHRcdFx0YWxhcm1JbmZvLmFsYXJtSWRlbnRpZmllciA9IGdlbmVyYXRlRXZlbnRFbGVtZW50SWQoRGF0ZS5ub3coKSlcblx0XHRcdH1cblxuXHRcdFx0YXNzaWduRXZlbnRJZChldmVudCwgem9uZSwgY2FsZW5kYXJHcm91cFJvb3QpXG5cdFx0XHRpZiAoZXZlbnQucmVjdXJyZW5jZUlkID09IG51bGwpIHtcblx0XHRcdFx0Ly8gdGhlIHByb2dlbml0b3IgbXVzdCBiZSBudWxsIGhlcmUgc2luY2Ugd2Ugd291bGQgaGF2ZVxuXHRcdFx0XHQvLyByZWplY3RlZCB0aGUgc2Vjb25kIHVpZC1wcm9nZW5pdG9yIGV2ZW50IGluIHNob3VsZEJlU2tpcHBlZC5cblx0XHRcdFx0cHJvZ2VuaXRvciA9IHsgZXZlbnQsIGFsYXJtcyB9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAocHJvZ2VuaXRvcj8uZXZlbnQucmVwZWF0UnVsZSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0aW5zZXJ0SW50b1NvcnRlZEFycmF5KFxuXHRcdFx0XHRcdFx0Y3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlOiBldmVudC5yZWN1cnJlbmNlSWQgfSksXG5cdFx0XHRcdFx0XHRwcm9nZW5pdG9yLmV2ZW50LnJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlcyxcblx0XHRcdFx0XHRcdChsZWZ0LCByaWdodCkgPT4gbGVmdC5kYXRlLmdldFRpbWUoKSAtIHJpZ2h0LmRhdGUuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0KCkgPT4gdHJ1ZSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH1cblx0XHRcdFx0YWx0ZXJlZEluc3RhbmNlcy5wdXNoKHsgZXZlbnQsIGFsYXJtcyB9KVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAocHJvZ2VuaXRvciAhPSBudWxsKSBldmVudHNGb3JDcmVhdGlvbi5wdXNoKHByb2dlbml0b3IpXG5cdFx0ZXZlbnRzRm9yQ3JlYXRpb24ucHVzaCguLi5hbHRlcmVkSW5zdGFuY2VzKVxuXHR9XG5cblx0cmV0dXJuIHsgcmVqZWN0ZWRFdmVudHMsIGV2ZW50c0ZvckNyZWF0aW9uIH1cbn1cblxuLyoqIGltcG9ydGVyIGludGVybmFscyBleHBvcnRlZCBmb3IgdGVzdGluZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ2FsZW5kYXJTdHJpbmdEYXRhKHZhbHVlOiBzdHJpbmcsIHpvbmU6IHN0cmluZyk6IFBhcnNlZENhbGVuZGFyRGF0YSB7XG5cdGNvbnN0IHRyZWUgPSBwYXJzZUlDYWxlbmRhcih2YWx1ZSlcblx0cmV0dXJuIHBhcnNlQ2FsZW5kYXJFdmVudHModHJlZSwgem9uZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSWNhbChpQ2FsU3RyOiBzdHJpbmcpOiBib29sZWFuIHtcblx0cmV0dXJuIGlDYWxTdHIudHJpbVN0YXJ0KCkuc3BsaXQoL1xccj9cXG4vLCAxKVswXSA9PT0gXCJCRUdJTjpWQ0FMRU5EQVJcIlxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZXJuYWxDYWxlbmRhck5hbWUoaUNhbFN0cjogc3RyaW5nKTogc3RyaW5nIHtcblx0bGV0IGNhbE5hbWUgPSBpQ2FsU3RyLm1hdGNoKC9YLVdSLUNBTE5BTUU6KC4qKVxccj9cXG4vKVxuXHRjb25zdCBuYW1lID0gY2FsTmFtZSA/IGNhbE5hbWVbMV0gOiBpQ2FsU3RyLm1hdGNoKC9QUk9ESUQ6LVxcL1xcLyguKilcXC9cXC8vKT8uWzFdIVxuXHRyZXR1cm4gbmFtZSA/PyBsYW5nLmdldChcIm5vVGl0bGVfbGFiZWxcIilcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gU3luY1N0YXR1cyB7XG5cdEZhaWxlZCA9IFwiRmFpbGVkXCIsXG5cdFN1Y2Nlc3MgPSBcIlN1Y2Nlc3NcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVVJMU3RyaW5nKHVybDogc3RyaW5nKTogVHJhbnNsYXRpb25LZXkgfCBVUkwge1xuXHRjb25zdCBhc3NlcnRSZXN1bHQgPSBhc3NlcnRWYWxpZFVSTCh1cmwpXG5cdGlmICghYXNzZXJ0UmVzdWx0KSByZXR1cm4gXCJpbnZhbGlkVVJMX21zZ1wiXG5cdGlmICghaGFzVmFsaWRQcm90b2NvbChhc3NlcnRSZXN1bHQsIFtcImh0dHBzOlwiXSkpIHJldHVybiBcImludmFsaWRVUkxQcm90b2NvbF9tc2dcIlxuXHRyZXR1cm4gYXNzZXJ0UmVzdWx0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNWYWxpZFByb3RvY29sKHVybDogVVJMLCB2YWxpZFByb3RvY29sczogc3RyaW5nW10pIHtcblx0cmV0dXJuIHZhbGlkUHJvdG9jb2xzLmluY2x1ZGVzKHVybC5wcm90b2NvbClcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQnlSdWxlIHtcblx0QllNSU5VVEUsXG5cdEJZSE9VUixcblx0QllEQVksXG5cdEJZTU9OVEhEQVksXG5cdEJZWUVBUkRBWSxcblx0QllXRUVLTk8sXG5cdEJZTU9OVEgsXG5cdEJZU0VUUE9TLFxuXHRXS1NULFxufVxuXG5leHBvcnQgY29uc3QgQllSVUxFX01BUCA9IGZyZWV6ZU1hcChcblx0bmV3IE1hcChbXG5cdFx0W1wiQllNSU5VVEVcIiwgQnlSdWxlLkJZTUlOVVRFXSxcblx0XHRbXCJCWUhPVVJcIiwgQnlSdWxlLkJZSE9VUl0sXG5cdFx0W1wiQllEQVlcIiwgQnlSdWxlLkJZREFZXSxcblx0XHRbXCJCWU1PTlRIREFZXCIsIEJ5UnVsZS5CWU1PTlRIREFZXSxcblx0XHRbXCJCWVlFQVJEQVlcIiwgQnlSdWxlLkJZWUVBUkRBWV0sXG5cdFx0W1wiQllXRUVLTk9cIiwgQnlSdWxlLkJZV0VFS05PXSxcblx0XHRbXCJCWU1PTlRIXCIsIEJ5UnVsZS5CWU1PTlRIXSxcblx0XHRbXCJCWVNFVFBPU1wiLCBCeVJ1bGUuQllTRVRQT1NdLFxuXHRcdFtcIldLU1RcIiwgQnlSdWxlLldLU1RdLFxuXHRdKSxcbilcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzJCQUVlO0NBQ2QsNkJBQTZCO0NBQzdCLHlCQUF5QjtDQUN6QiwwQkFBMEI7Q0FDMUIsdUJBQXVCO0NBQ3ZCLHNCQUFzQjtDQUN0Qix5QkFBeUI7Q0FDekIsd0JBQXdCO0NBQ3hCLDJCQUEyQjtDQUMzQiwyQkFBMkI7Q0FDM0IsMEJBQTBCO0NBQzFCLDZCQUE2QjtDQUM3QixnQ0FBZ0M7Q0FDaEMsNkJBQTZCO0NBQzdCLDRCQUE0QjtDQUM1Qix3QkFBd0I7Q0FDeEIsdUJBQXVCO0NBQ3ZCLDRCQUE0QjtDQUM1Qix5QkFBeUI7Q0FDekIsOEJBQThCO0NBQzlCLGdDQUFnQztDQUNoQyw0QkFBNEI7Q0FDNUIsMEJBQTBCO0NBQzFCLGdDQUFnQztDQUNoQyxpQ0FBaUM7Q0FDakMsOEJBQThCO0NBQzlCLG1DQUFtQztDQUNuQyxnQ0FBZ0M7Q0FDaEMsa0NBQWtDO0NBQ2xDLGlDQUFpQztDQUNqQyx5QkFBeUI7Q0FDekIsa0NBQWtDO0NBQ2xDLGlDQUFpQztDQUNqQyx1QkFBdUI7Q0FDdkIsc0JBQXNCO0NBQ3RCLDBCQUEwQjtDQUMxQiwyQkFBMkI7Q0FDM0IsOEJBQThCO0NBQzlCLDJCQUEyQjtDQUMzQixrQ0FBa0M7Q0FDbEMsK0JBQStCO0NBQy9CLHlCQUF5QjtDQUN6QixrQ0FBa0M7Q0FDbEMsdUJBQXVCO0NBQ3ZCLDhCQUE4QjtDQUM5QixzQkFBc0I7Q0FDdEIscUJBQXFCO0NBQ3JCLDBCQUEwQjtDQUMxQixxQkFBcUI7Q0FDckIsMkJBQTJCO0NBQzNCLDJCQUEyQjtDQUMzQixxQkFBcUI7Q0FDckIsdUJBQXVCO0NBQ3ZCLDBCQUEwQjtDQUMxQix1QkFBdUI7Q0FDdkIsc0JBQXNCO0NBQ3RCLHdCQUF3QjtDQUN4Qix3QkFBd0I7Q0FDeEIsNkJBQTZCO0NBQzdCLHVCQUF1QjtDQUN2Qix1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