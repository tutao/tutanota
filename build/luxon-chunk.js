
//#region libs/luxon.js
var LuxonError = class extends Error {};
var InvalidDateTimeError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid DateTime: ${reason.toMessage()}`);
	}
};
var InvalidIntervalError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid Interval: ${reason.toMessage()}`);
	}
};
var InvalidDurationError = class extends LuxonError {
	constructor(reason) {
		super(`Invalid Duration: ${reason.toMessage()}`);
	}
};
var ConflictingSpecificationError = class extends LuxonError {};
var InvalidUnitError = class extends LuxonError {
	constructor(unit) {
		super(`Invalid unit ${unit}`);
	}
};
var InvalidArgumentError = class extends LuxonError {};
var ZoneIsAbstractError = class extends LuxonError {
	constructor() {
		super("Zone is an abstract class");
	}
};
/**
* @private
*/
const n = "numeric", s = "short", l = "long";
const DATE_SHORT = {
	year: n,
	month: n,
	day: n
};
const DATE_MED = {
	year: n,
	month: s,
	day: n
};
const DATE_MED_WITH_WEEKDAY = {
	year: n,
	month: s,
	day: n,
	weekday: s
};
const DATE_FULL = {
	year: n,
	month: l,
	day: n
};
const DATE_HUGE = {
	year: n,
	month: l,
	day: n,
	weekday: l
};
const TIME_SIMPLE = {
	hour: n,
	minute: n
};
const TIME_WITH_SECONDS = {
	hour: n,
	minute: n,
	second: n
};
const TIME_WITH_SHORT_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	timeZoneName: s
};
const TIME_WITH_LONG_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	timeZoneName: l
};
const TIME_24_SIMPLE = {
	hour: n,
	minute: n,
	hourCycle: "h23"
};
const TIME_24_WITH_SECONDS = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23"
};
const TIME_24_WITH_SHORT_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23",
	timeZoneName: s
};
const TIME_24_WITH_LONG_OFFSET = {
	hour: n,
	minute: n,
	second: n,
	hourCycle: "h23",
	timeZoneName: l
};
const DATETIME_SHORT = {
	year: n,
	month: n,
	day: n,
	hour: n,
	minute: n
};
const DATETIME_SHORT_WITH_SECONDS = {
	year: n,
	month: n,
	day: n,
	hour: n,
	minute: n,
	second: n
};
const DATETIME_MED = {
	year: n,
	month: s,
	day: n,
	hour: n,
	minute: n
};
const DATETIME_MED_WITH_SECONDS = {
	year: n,
	month: s,
	day: n,
	hour: n,
	minute: n,
	second: n
};
const DATETIME_MED_WITH_WEEKDAY = {
	year: n,
	month: s,
	day: n,
	weekday: s,
	hour: n,
	minute: n
};
const DATETIME_FULL = {
	year: n,
	month: l,
	day: n,
	hour: n,
	minute: n,
	timeZoneName: s
};
const DATETIME_FULL_WITH_SECONDS = {
	year: n,
	month: l,
	day: n,
	hour: n,
	minute: n,
	second: n,
	timeZoneName: s
};
const DATETIME_HUGE = {
	year: n,
	month: l,
	day: n,
	weekday: l,
	hour: n,
	minute: n,
	timeZoneName: l
};
const DATETIME_HUGE_WITH_SECONDS = {
	year: n,
	month: l,
	day: n,
	weekday: l,
	hour: n,
	minute: n,
	second: n,
	timeZoneName: l
};
var Zone = class {
	/**
	* The type of zone
	* @abstract
	* @type {string}
	*/
	get type() {
		throw new ZoneIsAbstractError();
	}
	/**
	* The name of this zone.
	* @abstract
	* @type {string}
	*/
	get name() {
		throw new ZoneIsAbstractError();
	}
	get ianaName() {
		return this.name;
	}
	/**
	* Returns whether the offset is known to be fixed for the whole year.
	* @abstract
	* @type {boolean}
	*/
	get isUniversal() {
		throw new ZoneIsAbstractError();
	}
	/**
	* Returns the offset's common name (such as EST) at the specified timestamp
	* @abstract
	* @param {number} ts - Epoch milliseconds for which to get the name
	* @param {Object} opts - Options to affect the format
	* @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
	* @param {string} opts.locale - What locale to return the offset name in.
	* @return {string}
	*/
	offsetName(ts, opts) {
		throw new ZoneIsAbstractError();
	}
	/**
	* Returns the offset's value as a string
	* @abstract
	* @param {number} ts - Epoch milliseconds for which to get the offset
	* @param {string} format - What style of offset to return.
	*                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
	* @return {string}
	*/
	formatOffset(ts, format) {
		throw new ZoneIsAbstractError();
	}
	/**
	* Return the offset in minutes for this zone at the specified timestamp.
	* @abstract
	* @param {number} ts - Epoch milliseconds for which to compute the offset
	* @return {number}
	*/
	offset(ts) {
		throw new ZoneIsAbstractError();
	}
	/**
	* Return whether this Zone is equal to another zone
	* @abstract
	* @param {Zone} otherZone - the zone to compare
	* @return {boolean}
	*/
	equals(otherZone) {
		throw new ZoneIsAbstractError();
	}
	/**
	* Return whether this Zone is valid.
	* @abstract
	* @type {boolean}
	*/
	get isValid() {
		throw new ZoneIsAbstractError();
	}
};
let singleton$1 = null;
var SystemZone = class SystemZone extends Zone {
	/**
	* Get a singleton instance of the local zone
	* @return {SystemZone}
	*/
	static get instance() {
		if (singleton$1 === null) singleton$1 = new SystemZone();
		return singleton$1;
	}
	/** @override **/
	get type() {
		return "system";
	}
	/** @override **/
	get name() {
		return new Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
	/** @override **/
	get isUniversal() {
		return false;
	}
	/** @override **/
	offsetName(ts, { format, locale }) {
		return parseZoneInfo(ts, format, locale);
	}
	/** @override **/
	formatOffset(ts, format) {
		return formatOffset(this.offset(ts), format);
	}
	/** @override **/
	offset(ts) {
		return -new Date(ts).getTimezoneOffset();
	}
	/** @override **/
	equals(otherZone) {
		return otherZone.type === "system";
	}
	/** @override **/
	get isValid() {
		return true;
	}
};
let dtfCache = {};
function makeDTF(zone) {
	if (!dtfCache[zone]) dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
		hour12: false,
		timeZone: zone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		era: "short"
	});
	return dtfCache[zone];
}
const typeToPos = {
	year: 0,
	month: 1,
	day: 2,
	era: 3,
	hour: 4,
	minute: 5,
	second: 6
};
function hackyOffset(dtf, date) {
	const formatted = dtf.format(date).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
	return [
		fYear,
		fMonth,
		fDay,
		fadOrBc,
		fHour,
		fMinute,
		fSecond
	];
}
function partsOffset(dtf, date) {
	const formatted = dtf.formatToParts(date);
	const filled = [];
	for (let i = 0; i < formatted.length; i++) {
		const { type, value } = formatted[i];
		const pos = typeToPos[type];
		if (type === "era") filled[pos] = value;
else if (!isUndefined(pos)) filled[pos] = parseInt(value, 10);
	}
	return filled;
}
let ianaZoneCache = {};
var IANAZone = class IANAZone extends Zone {
	/**
	* @param {string} name - Zone name
	* @return {IANAZone}
	*/
	static create(name) {
		if (!ianaZoneCache[name]) ianaZoneCache[name] = new IANAZone(name);
		return ianaZoneCache[name];
	}
	/**
	* Reset local caches. Should only be necessary in testing scenarios.
	* @return {void}
	*/
	static resetCache() {
		ianaZoneCache = {};
		dtfCache = {};
	}
	/**
	* Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
	* @param {string} s - The string to check validity on
	* @example IANAZone.isValidSpecifier("America/New_York") //=> true
	* @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
	* @deprecated This method returns false for some valid IANA names. Use isValidZone instead.
	* @return {boolean}
	*/
	static isValidSpecifier(s$1) {
		return this.isValidZone(s$1);
	}
	/**
	* Returns whether the provided string identifies a real zone
	* @param {string} zone - The string to check
	* @example IANAZone.isValidZone("America/New_York") //=> true
	* @example IANAZone.isValidZone("Fantasia/Castle") //=> false
	* @example IANAZone.isValidZone("Sport~~blorp") //=> false
	* @return {boolean}
	*/
	static isValidZone(zone) {
		if (!zone) return false;
		try {
			new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
			return true;
		} catch (e) {
			return false;
		}
	}
	constructor(name) {
		super();
		/** @private **/
		this.zoneName = name;
		/** @private **/
		this.valid = IANAZone.isValidZone(name);
	}
	/** @override **/
	get type() {
		return "iana";
	}
	/** @override **/
	get name() {
		return this.zoneName;
	}
	/** @override **/
	get isUniversal() {
		return false;
	}
	/** @override **/
	offsetName(ts, { format, locale }) {
		return parseZoneInfo(ts, format, locale, this.name);
	}
	/** @override **/
	formatOffset(ts, format) {
		return formatOffset(this.offset(ts), format);
	}
	/** @override **/
	offset(ts) {
		const date = new Date(ts);
		if (isNaN(date)) return NaN;
		const dtf = makeDTF(this.name);
		let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date);
		if (adOrBc === "BC") year = -Math.abs(year) + 1;
		const adjustedHour = hour === 24 ? 0 : hour;
		const asUTC = objToLocalTS({
			year,
			month,
			day,
			hour: adjustedHour,
			minute,
			second,
			millisecond: 0
		});
		let asTS = +date;
		const over = asTS % 1e3;
		asTS -= over >= 0 ? over : 1e3 + over;
		return (asUTC - asTS) / 6e4;
	}
	/** @override **/
	equals(otherZone) {
		return otherZone.type === "iana" && otherZone.name === this.name;
	}
	/** @override **/
	get isValid() {
		return this.valid;
	}
};
let intlLFCache = {};
function getCachedLF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let dtf = intlLFCache[key];
	if (!dtf) {
		dtf = new Intl.ListFormat(locString, opts);
		intlLFCache[key] = dtf;
	}
	return dtf;
}
let intlDTCache = {};
function getCachedDTF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let dtf = intlDTCache[key];
	if (!dtf) {
		dtf = new Intl.DateTimeFormat(locString, opts);
		intlDTCache[key] = dtf;
	}
	return dtf;
}
let intlNumCache = {};
function getCachedINF(locString, opts = {}) {
	const key = JSON.stringify([locString, opts]);
	let inf = intlNumCache[key];
	if (!inf) {
		inf = new Intl.NumberFormat(locString, opts);
		intlNumCache[key] = inf;
	}
	return inf;
}
let intlRelCache = {};
function getCachedRTF(locString, opts = {}) {
	const { base,...cacheKeyOpts } = opts;
	const key = JSON.stringify([locString, cacheKeyOpts]);
	let inf = intlRelCache[key];
	if (!inf) {
		inf = new Intl.RelativeTimeFormat(locString, opts);
		intlRelCache[key] = inf;
	}
	return inf;
}
let sysLocaleCache = null;
function systemLocale() {
	if (sysLocaleCache) return sysLocaleCache;
else {
		sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
		return sysLocaleCache;
	}
}
let weekInfoCache = {};
function getCachedWeekInfo(locString) {
	let data = weekInfoCache[locString];
	if (!data) {
		const locale = new Intl.Locale(locString);
		data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
		weekInfoCache[locString] = data;
	}
	return data;
}
function parseLocaleString(localeStr) {
	const xIndex = localeStr.indexOf("-x-");
	if (xIndex !== -1) localeStr = localeStr.substring(0, xIndex);
	const uIndex = localeStr.indexOf("-u-");
	if (uIndex === -1) return [localeStr];
else {
		let options;
		let selectedStr;
		try {
			options = getCachedDTF(localeStr).resolvedOptions();
			selectedStr = localeStr;
		} catch (e) {
			const smaller = localeStr.substring(0, uIndex);
			options = getCachedDTF(smaller).resolvedOptions();
			selectedStr = smaller;
		}
		const { numberingSystem, calendar } = options;
		return [
			selectedStr,
			numberingSystem,
			calendar
		];
	}
}
function intlConfigString(localeStr, numberingSystem, outputCalendar) {
	if (outputCalendar || numberingSystem) {
		if (!localeStr.includes("-u-")) localeStr += "-u";
		if (outputCalendar) localeStr += `-ca-${outputCalendar}`;
		if (numberingSystem) localeStr += `-nu-${numberingSystem}`;
		return localeStr;
	} else return localeStr;
}
function mapMonths(f) {
	const ms = [];
	for (let i = 1; i <= 12; i++) {
		const dt = DateTime.utc(2009, i, 1);
		ms.push(f(dt));
	}
	return ms;
}
function mapWeekdays(f) {
	const ms = [];
	for (let i = 1; i <= 7; i++) {
		const dt = DateTime.utc(2016, 11, 13 + i);
		ms.push(f(dt));
	}
	return ms;
}
function listStuff(loc, length, englishFn, intlFn) {
	const mode = loc.listingMode();
	if (mode === "error") return null;
else if (mode === "en") return englishFn(length);
else return intlFn(length);
}
function supportsFastNumbers(loc) {
	if (loc.numberingSystem && loc.numberingSystem !== "latn") return false;
else return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || new Intl.DateTimeFormat(loc.intl).resolvedOptions().numberingSystem === "latn";
}
var PolyNumberFormatter = class {
	constructor(intl, forceSimple, opts) {
		this.padTo = opts.padTo || 0;
		this.floor = opts.floor || false;
		const { padTo, floor,...otherOpts } = opts;
		if (!forceSimple || Object.keys(otherOpts).length > 0) {
			const intlOpts = {
				useGrouping: false,
				...opts
			};
			if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
			this.inf = getCachedINF(intl, intlOpts);
		}
	}
	format(i) {
		if (this.inf) {
			const fixed = this.floor ? Math.floor(i) : i;
			return this.inf.format(fixed);
		} else {
			const fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
			return padStart(fixed, this.padTo);
		}
	}
};
var PolyDateFormatter = class {
	constructor(dt, intl, opts) {
		this.opts = opts;
		this.originalZone = undefined;
		let z = undefined;
		if (this.opts.timeZone) this.dt = dt;
else if (dt.zone.type === "fixed") {
			const gmtOffset = -1 * (dt.offset / 60);
			const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
			if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
				z = offsetZ;
				this.dt = dt;
			} else {
				z = "UTC";
				this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({ minutes: dt.offset });
				this.originalZone = dt.zone;
			}
		} else if (dt.zone.type === "system") this.dt = dt;
else if (dt.zone.type === "iana") {
			this.dt = dt;
			z = dt.zone.name;
		} else {
			z = "UTC";
			this.dt = dt.setZone("UTC").plus({ minutes: dt.offset });
			this.originalZone = dt.zone;
		}
		const intlOpts = { ...this.opts };
		intlOpts.timeZone = intlOpts.timeZone || z;
		this.dtf = getCachedDTF(intl, intlOpts);
	}
	format() {
		if (this.originalZone) return this.formatToParts().map(({ value }) => value).join("");
		return this.dtf.format(this.dt.toJSDate());
	}
	formatToParts() {
		const parts = this.dtf.formatToParts(this.dt.toJSDate());
		if (this.originalZone) return parts.map((part) => {
			if (part.type === "timeZoneName") {
				const offsetName = this.originalZone.offsetName(this.dt.ts, {
					locale: this.dt.locale,
					format: this.opts.timeZoneName
				});
				return {
					...part,
					value: offsetName
				};
			} else return part;
		});
		return parts;
	}
	resolvedOptions() {
		return this.dtf.resolvedOptions();
	}
};
var PolyRelFormatter = class {
	constructor(intl, isEnglish, opts) {
		this.opts = {
			style: "long",
			...opts
		};
		if (!isEnglish && hasRelative()) this.rtf = getCachedRTF(intl, opts);
	}
	format(count, unit) {
		if (this.rtf) return this.rtf.format(count, unit);
else return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
	}
	formatToParts(count, unit) {
		if (this.rtf) return this.rtf.formatToParts(count, unit);
else return [];
	}
};
const fallbackWeekSettings = {
	firstDay: 1,
	minimalDays: 4,
	weekend: [6, 7]
};
var Locale = class Locale {
	static fromOpts(opts) {
		return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.weekSettings, opts.defaultToEN);
	}
	static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
		const specifiedLocale = locale || Settings.defaultLocale;
		const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
		const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
		const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
		const weekSettingsR = validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
		return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
	}
	static resetCache() {
		sysLocaleCache = null;
		intlDTCache = {};
		intlNumCache = {};
		intlRelCache = {};
	}
	static fromObject({ locale, numberingSystem, outputCalendar, weekSettings } = {}) {
		return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
	}
	constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
		const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
		this.locale = parsedLocale;
		this.numberingSystem = numbering || parsedNumberingSystem || null;
		this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
		this.weekSettings = weekSettings;
		this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
		this.weekdaysCache = {
			format: {},
			standalone: {}
		};
		this.monthsCache = {
			format: {},
			standalone: {}
		};
		this.meridiemCache = null;
		this.eraCache = {};
		this.specifiedLocale = specifiedLocale;
		this.fastNumbersCached = null;
	}
	get fastNumbers() {
		if (this.fastNumbersCached == null) this.fastNumbersCached = supportsFastNumbers(this);
		return this.fastNumbersCached;
	}
	listingMode() {
		const isActuallyEn = this.isEnglish();
		const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
		return isActuallyEn && hasNoWeirdness ? "en" : "intl";
	}
	clone(alts) {
		if (!alts || Object.getOwnPropertyNames(alts).length === 0) return this;
else return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, validateWeekSettings(alts.weekSettings) || this.weekSettings, alts.defaultToEN || false);
	}
	redefaultToEN(alts = {}) {
		return this.clone({
			...alts,
			defaultToEN: true
		});
	}
	redefaultToSystem(alts = {}) {
		return this.clone({
			...alts,
			defaultToEN: false
		});
	}
	months(length, format = false) {
		return listStuff(this, length, months, () => {
			const intl = format ? {
				month: length,
				day: "numeric"
			} : { month: length }, formatStr = format ? "format" : "standalone";
			if (!this.monthsCache[formatStr][length]) this.monthsCache[formatStr][length] = mapMonths((dt) => this.extract(dt, intl, "month"));
			return this.monthsCache[formatStr][length];
		});
	}
	weekdays(length, format = false) {
		return listStuff(this, length, weekdays, () => {
			const intl = format ? {
				weekday: length,
				year: "numeric",
				month: "long",
				day: "numeric"
			} : { weekday: length }, formatStr = format ? "format" : "standalone";
			if (!this.weekdaysCache[formatStr][length]) this.weekdaysCache[formatStr][length] = mapWeekdays((dt) => this.extract(dt, intl, "weekday"));
			return this.weekdaysCache[formatStr][length];
		});
	}
	meridiems() {
		return listStuff(this, undefined, () => meridiems, () => {
			if (!this.meridiemCache) {
				const intl = {
					hour: "numeric",
					hourCycle: "h12"
				};
				this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map((dt) => this.extract(dt, intl, "dayperiod"));
			}
			return this.meridiemCache;
		});
	}
	eras(length) {
		return listStuff(this, length, eras, () => {
			const intl = { era: length };
			if (!this.eraCache[length]) this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt) => this.extract(dt, intl, "era"));
			return this.eraCache[length];
		});
	}
	extract(dt, intlOpts, field) {
		const df = this.dtFormatter(dt, intlOpts), results = df.formatToParts(), matching = results.find((m) => m.type.toLowerCase() === field);
		return matching ? matching.value : null;
	}
	numberFormatter(opts = {}) {
		return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
	}
	dtFormatter(dt, intlOpts = {}) {
		return new PolyDateFormatter(dt, this.intl, intlOpts);
	}
	relFormatter(opts = {}) {
		return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
	}
	listFormatter(opts = {}) {
		return getCachedLF(this.intl, opts);
	}
	isEnglish() {
		return this.locale === "en" || this.locale.toLowerCase() === "en-us" || new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us");
	}
	getWeekSettings() {
		if (this.weekSettings) return this.weekSettings;
else if (!hasLocaleWeekInfo()) return fallbackWeekSettings;
else return getCachedWeekInfo(this.locale);
	}
	getStartOfWeek() {
		return this.getWeekSettings().firstDay;
	}
	getMinDaysInFirstWeek() {
		return this.getWeekSettings().minimalDays;
	}
	getWeekendDays() {
		return this.getWeekSettings().weekend;
	}
	equals(other) {
		return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
	}
};
let singleton = null;
var FixedOffsetZone = class FixedOffsetZone extends Zone {
	/**
	* Get a singleton instance of UTC
	* @return {FixedOffsetZone}
	*/
	static get utcInstance() {
		if (singleton === null) singleton = new FixedOffsetZone(0);
		return singleton;
	}
	/**
	* Get an instance with a specified offset
	* @param {number} offset - The offset in minutes
	* @return {FixedOffsetZone}
	*/
	static instance(offset$1) {
		return offset$1 === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset$1);
	}
	/**
	* Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
	* @param {string} s - The offset string to parse
	* @example FixedOffsetZone.parseSpecifier("UTC+6")
	* @example FixedOffsetZone.parseSpecifier("UTC+06")
	* @example FixedOffsetZone.parseSpecifier("UTC-6:00")
	* @return {FixedOffsetZone}
	*/
	static parseSpecifier(s$1) {
		if (s$1) {
			const r = s$1.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
			if (r) return new FixedOffsetZone(signedOffset(r[1], r[2]));
		}
		return null;
	}
	constructor(offset$1) {
		super();
		/** @private **/
		this.fixed = offset$1;
	}
	/** @override **/
	get type() {
		return "fixed";
	}
	/** @override **/
	get name() {
		return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
	}
	get ianaName() {
		if (this.fixed === 0) return "Etc/UTC";
else return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
	}
	/** @override **/
	offsetName() {
		return this.name;
	}
	/** @override **/
	formatOffset(ts, format) {
		return formatOffset(this.fixed, format);
	}
	/** @override **/
	get isUniversal() {
		return true;
	}
	/** @override **/
	offset() {
		return this.fixed;
	}
	/** @override **/
	equals(otherZone) {
		return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
	}
	/** @override **/
	get isValid() {
		return true;
	}
};
var InvalidZone = class extends Zone {
	constructor(zoneName) {
		super();
		/**  @private */
		this.zoneName = zoneName;
	}
	/** @override **/
	get type() {
		return "invalid";
	}
	/** @override **/
	get name() {
		return this.zoneName;
	}
	/** @override **/
	get isUniversal() {
		return false;
	}
	/** @override **/
	offsetName() {
		return null;
	}
	/** @override **/
	formatOffset() {
		return "";
	}
	/** @override **/
	offset() {
		return NaN;
	}
	/** @override **/
	equals() {
		return false;
	}
	/** @override **/
	get isValid() {
		return false;
	}
};
/**
* @private
*/
function normalizeZone(input, defaultZone$1) {
	if (isUndefined(input) || input === null) return defaultZone$1;
else if (input instanceof Zone) return input;
else if (isString(input)) {
		const lowered = input.toLowerCase();
		if (lowered === "default") return defaultZone$1;
else if (lowered === "local" || lowered === "system") return SystemZone.instance;
else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
	} else if (isNumber(input)) return FixedOffsetZone.instance(input);
else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") return input;
else return new InvalidZone(input);
}
let now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
var Settings = class {
	/**
	* Get the callback for returning the current timestamp.
	* @type {function}
	*/
	static get now() {
		return now;
	}
	/**
	* Set the callback for returning the current timestamp.
	* The function should return a number, which will be interpreted as an Epoch millisecond count
	* @type {function}
	* @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
	* @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
	*/
	static set now(n$1) {
		now = n$1;
	}
	/**
	* Set the default time zone to create DateTimes in. Does not affect existing instances.
	* Use the value "system" to reset this value to the system's time zone.
	* @type {string}
	*/
	static set defaultZone(zone) {
		defaultZone = zone;
	}
	/**
	* Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
	* The default value is the system's time zone (the one set on the machine that runs this code).
	* @type {Zone}
	*/
	static get defaultZone() {
		return normalizeZone(defaultZone, SystemZone.instance);
	}
	/**
	* Get the default locale to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static get defaultLocale() {
		return defaultLocale;
	}
	/**
	* Set the default locale to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static set defaultLocale(locale) {
		defaultLocale = locale;
	}
	/**
	* Get the default numbering system to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static get defaultNumberingSystem() {
		return defaultNumberingSystem;
	}
	/**
	* Set the default numbering system to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static set defaultNumberingSystem(numberingSystem) {
		defaultNumberingSystem = numberingSystem;
	}
	/**
	* Get the default output calendar to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static get defaultOutputCalendar() {
		return defaultOutputCalendar;
	}
	/**
	* Set the default output calendar to create DateTimes with. Does not affect existing instances.
	* @type {string}
	*/
	static set defaultOutputCalendar(outputCalendar) {
		defaultOutputCalendar = outputCalendar;
	}
	/**
	* @typedef {Object} WeekSettings
	* @property {number} firstDay
	* @property {number} minimalDays
	* @property {number[]} weekend
	*/
	/**
	* @return {WeekSettings|null}
	*/
	static get defaultWeekSettings() {
		return defaultWeekSettings;
	}
	/**
	* Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
	* how many days are required in the first week of a year.
	* Does not affect existing instances.
	*
	* @param {WeekSettings|null} weekSettings
	*/
	static set defaultWeekSettings(weekSettings) {
		defaultWeekSettings = validateWeekSettings(weekSettings);
	}
	/**
	* Get the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
	* @type {number}
	*/
	static get twoDigitCutoffYear() {
		return twoDigitCutoffYear;
	}
	/**
	* Set the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
	* @type {number}
	* @example Settings.twoDigitCutoffYear = 0 // cut-off year is 0, so all 'yy' are interpreted as current century
	* @example Settings.twoDigitCutoffYear = 50 // '49' -> 1949; '50' -> 2050
	* @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
	* @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
	*/
	static set twoDigitCutoffYear(cutoffYear) {
		twoDigitCutoffYear = cutoffYear % 100;
	}
	/**
	* Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
	* @type {boolean}
	*/
	static get throwOnInvalid() {
		return throwOnInvalid;
	}
	/**
	* Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
	* @type {boolean}
	*/
	static set throwOnInvalid(t) {
		throwOnInvalid = t;
	}
	/**
	* Reset Luxon's global caches. Should only be necessary in testing scenarios.
	* @return {void}
	*/
	static resetCaches() {
		Locale.resetCache();
		IANAZone.resetCache();
	}
};
var Invalid = class {
	constructor(reason, explanation) {
		this.reason = reason;
		this.explanation = explanation;
	}
	toMessage() {
		if (this.explanation) return `${this.reason}: ${this.explanation}`;
else return this.reason;
	}
};
const nonLeapLadder = [
	0,
	31,
	59,
	90,
	120,
	151,
	181,
	212,
	243,
	273,
	304,
	334
], leapLadder = [
	0,
	31,
	60,
	91,
	121,
	152,
	182,
	213,
	244,
	274,
	305,
	335
];
function unitOutOfRange(unit, value) {
	return new Invalid("unit out of range", `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);
}
function dayOfWeek(year, month, day) {
	const d = new Date(Date.UTC(year, month - 1, day));
	if (year < 100 && year >= 0) d.setUTCFullYear(d.getUTCFullYear() - 1900);
	const js = d.getUTCDay();
	return js === 0 ? 7 : js;
}
function computeOrdinal(year, month, day) {
	return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
	const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i) => i < ordinal), day = ordinal - table[month0];
	return {
		month: month0 + 1,
		day
	};
}
function isoWeekdayToLocal(isoWeekday, startOfWeek) {
	return (isoWeekday - startOfWeek + 7) % 7 + 1;
}
/**
* @private
*/
function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const { year, month, day } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
	let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
	if (weekNumber < 1) {
		weekYear = year - 1;
		weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
	} else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
		weekYear = year + 1;
		weekNumber = 1;
	} else weekYear = year;
	return {
		weekYear,
		weekNumber,
		weekday,
		...timeObject(gregObj)
	};
}
function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const { weekYear, weekNumber, weekday } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
	let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
	if (ordinal < 1) {
		year = weekYear - 1;
		ordinal += daysInYear(year);
	} else if (ordinal > yearInDays) {
		year = weekYear + 1;
		ordinal -= daysInYear(weekYear);
	} else year = weekYear;
	const { month, day } = uncomputeOrdinal(year, ordinal);
	return {
		year,
		month,
		day,
		...timeObject(weekData)
	};
}
function gregorianToOrdinal(gregData) {
	const { year, month, day } = gregData;
	const ordinal = computeOrdinal(year, month, day);
	return {
		year,
		ordinal,
		...timeObject(gregData)
	};
}
function ordinalToGregorian(ordinalData) {
	const { year, ordinal } = ordinalData;
	const { month, day } = uncomputeOrdinal(year, ordinal);
	return {
		year,
		month,
		day,
		...timeObject(ordinalData)
	};
}
/**
* Check if local week units like localWeekday are used in obj.
* If so, validates that they are not mixed with ISO week units and then copies them to the normal week unit properties.
* Modifies obj in-place!
* @param obj the object values
*/
function usesLocalWeekValues(obj, loc) {
	const hasLocaleWeekData = !isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear);
	if (hasLocaleWeekData) {
		const hasIsoWeekData = !isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear);
		if (hasIsoWeekData) throw new ConflictingSpecificationError("Cannot mix locale-based week fields with ISO-based week fields");
		if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
		if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
		if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
		delete obj.localWeekday;
		delete obj.localWeekNumber;
		delete obj.localWeekYear;
		return {
			minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
			startOfWeek: loc.getStartOfWeek()
		};
	} else return {
		minDaysInFirstWeek: 4,
		startOfWeek: 1
	};
}
function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)), validWeekday = integerBetween(obj.weekday, 1, 7);
	if (!validYear) return unitOutOfRange("weekYear", obj.weekYear);
else if (!validWeek) return unitOutOfRange("week", obj.weekNumber);
else if (!validWeekday) return unitOutOfRange("weekday", obj.weekday);
else return false;
}
function hasInvalidOrdinalData(obj) {
	const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
	if (!validYear) return unitOutOfRange("year", obj.year);
else if (!validOrdinal) return unitOutOfRange("ordinal", obj.ordinal);
else return false;
}
function hasInvalidGregorianData(obj) {
	const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
	if (!validYear) return unitOutOfRange("year", obj.year);
else if (!validMonth) return unitOutOfRange("month", obj.month);
else if (!validDay) return unitOutOfRange("day", obj.day);
else return false;
}
function hasInvalidTimeData(obj) {
	const { hour, minute, second, millisecond } = obj;
	const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
	if (!validHour) return unitOutOfRange("hour", hour);
else if (!validMinute) return unitOutOfRange("minute", minute);
else if (!validSecond) return unitOutOfRange("second", second);
else if (!validMillisecond) return unitOutOfRange("millisecond", millisecond);
else return false;
}
/**
* @private
*/
function isUndefined(o) {
	return typeof o === "undefined";
}
function isNumber(o) {
	return typeof o === "number";
}
function isInteger(o) {
	return typeof o === "number" && o % 1 === 0;
}
function isString(o) {
	return typeof o === "string";
}
function isDate(o) {
	return Object.prototype.toString.call(o) === "[object Date]";
}
function hasRelative() {
	try {
		return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
	} catch (e) {
		return false;
	}
}
function hasLocaleWeekInfo() {
	try {
		return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
	} catch (e) {
		return false;
	}
}
function maybeArray(thing) {
	return Array.isArray(thing) ? thing : [thing];
}
function bestBy(arr, by, compare) {
	if (arr.length === 0) return undefined;
	return arr.reduce((best, next) => {
		const pair = [by(next), next];
		if (!best) return pair;
else if (compare(best[0], pair[0]) === best[0]) return best;
else return pair;
	}, null)[1];
}
function pick(obj, keys) {
	return keys.reduce((a, k) => {
		a[k] = obj[k];
		return a;
	}, {});
}
function hasOwnProperty(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}
function validateWeekSettings(settings) {
	if (settings == null) return null;
else if (typeof settings !== "object") throw new InvalidArgumentError("Week settings must be an object");
else {
		if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v) => !integerBetween(v, 1, 7))) throw new InvalidArgumentError("Invalid week settings");
		return {
			firstDay: settings.firstDay,
			minimalDays: settings.minimalDays,
			weekend: Array.from(settings.weekend)
		};
	}
}
function integerBetween(thing, bottom, top) {
	return isInteger(thing) && thing >= bottom && thing <= top;
}
function floorMod(x, n$1) {
	return x - n$1 * Math.floor(x / n$1);
}
function padStart(input, n$1 = 2) {
	const isNeg = input < 0;
	let padded;
	if (isNeg) padded = "-" + ("" + -input).padStart(n$1, "0");
else padded = ("" + input).padStart(n$1, "0");
	return padded;
}
function parseInteger(string) {
	if (isUndefined(string) || string === null || string === "") return undefined;
else return parseInt(string, 10);
}
function parseFloating(string) {
	if (isUndefined(string) || string === null || string === "") return undefined;
else return parseFloat(string);
}
function parseMillis(fraction) {
	if (isUndefined(fraction) || fraction === null || fraction === "") return undefined;
else {
		const f = parseFloat("0." + fraction) * 1e3;
		return Math.floor(f);
	}
}
function roundTo(number, digits, towardZero = false) {
	const factor = 10 ** digits, rounder = towardZero ? Math.trunc : Math.round;
	return rounder(number * factor) / factor;
}
function isLeapYear(year) {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function daysInYear(year) {
	return isLeapYear(year) ? 366 : 365;
}
function daysInMonth(year, month) {
	const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
	if (modMonth === 2) return isLeapYear(modYear) ? 29 : 28;
else return [
		31,
		null,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	][modMonth - 1];
}
function objToLocalTS(obj) {
	let d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
	if (obj.year < 100 && obj.year >= 0) {
		d = new Date(d);
		d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
	}
	return +d;
}
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
	const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
	return -fwdlw + minDaysInFirstWeek - 1;
}
function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
	const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
	const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
	return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}
function untruncateYear(year) {
	if (year > 99) return year;
else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
}
function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
	const date = new Date(ts), intlOpts = {
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	};
	if (timeZone) intlOpts.timeZone = timeZone;
	const modified = {
		timeZoneName: offsetFormat,
		...intlOpts
	};
	const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date).find((m) => m.type.toLowerCase() === "timezonename");
	return parsed ? parsed.value : null;
}
function signedOffset(offHourStr, offMinuteStr) {
	let offHour = parseInt(offHourStr, 10);
	if (Number.isNaN(offHour)) offHour = 0;
	const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
	return offHour * 60 + offMinSigned;
}
function asNumber(value) {
	const numericValue = Number(value);
	if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue)) throw new InvalidArgumentError(`Invalid unit value ${value}`);
	return numericValue;
}
function normalizeObject(obj, normalizer) {
	const normalized = {};
	for (const u in obj) if (hasOwnProperty(obj, u)) {
		const v = obj[u];
		if (v === undefined || v === null) continue;
		normalized[normalizer(u)] = asNumber(v);
	}
	return normalized;
}
function formatOffset(offset$1, format) {
	const hours = Math.trunc(Math.abs(offset$1 / 60)), minutes = Math.trunc(Math.abs(offset$1 % 60)), sign = offset$1 >= 0 ? "+" : "-";
	switch (format) {
		case "short": return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
		case "narrow": return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
		case "techie": return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
		default: throw new RangeError(`Value format ${format} is out of range for property format`);
	}
}
function timeObject(obj) {
	return pick(obj, [
		"hour",
		"minute",
		"second",
		"millisecond"
	]);
}
/**
* @private
*/
const monthsLong = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
const monthsShort = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
const monthsNarrow = [
	"J",
	"F",
	"M",
	"A",
	"M",
	"J",
	"J",
	"A",
	"S",
	"O",
	"N",
	"D"
];
function months(length) {
	switch (length) {
		case "narrow": return [...monthsNarrow];
		case "short": return [...monthsShort];
		case "long": return [...monthsLong];
		case "numeric": return [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"11",
			"12"
		];
		case "2-digit": return [
			"01",
			"02",
			"03",
			"04",
			"05",
			"06",
			"07",
			"08",
			"09",
			"10",
			"11",
			"12"
		];
		default: return null;
	}
}
const weekdaysLong = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday"
];
const weekdaysShort = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];
const weekdaysNarrow = [
	"M",
	"T",
	"W",
	"T",
	"F",
	"S",
	"S"
];
function weekdays(length) {
	switch (length) {
		case "narrow": return [...weekdaysNarrow];
		case "short": return [...weekdaysShort];
		case "long": return [...weekdaysLong];
		case "numeric": return [
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7"
		];
		default: return null;
	}
}
const meridiems = ["AM", "PM"];
const erasLong = ["Before Christ", "Anno Domini"];
const erasShort = ["BC", "AD"];
const erasNarrow = ["B", "A"];
function eras(length) {
	switch (length) {
		case "narrow": return [...erasNarrow];
		case "short": return [...erasShort];
		case "long": return [...erasLong];
		default: return null;
	}
}
function meridiemForDateTime(dt) {
	return meridiems[dt.hour < 12 ? 0 : 1];
}
function weekdayForDateTime(dt, length) {
	return weekdays(length)[dt.weekday - 1];
}
function monthForDateTime(dt, length) {
	return months(length)[dt.month - 1];
}
function eraForDateTime(dt, length) {
	return eras(length)[dt.year < 0 ? 0 : 1];
}
function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
	const units = {
		years: ["year", "yr."],
		quarters: ["quarter", "qtr."],
		months: ["month", "mo."],
		weeks: ["week", "wk."],
		days: [
			"day",
			"day",
			"days"
		],
		hours: ["hour", "hr."],
		minutes: ["minute", "min."],
		seconds: ["second", "sec."]
	};
	const lastable = [
		"hours",
		"minutes",
		"seconds"
	].indexOf(unit) === -1;
	if (numeric === "auto" && lastable) {
		const isDay = unit === "days";
		switch (count) {
			case 1: return isDay ? "tomorrow" : `next ${units[unit][0]}`;
			case -1: return isDay ? "yesterday" : `last ${units[unit][0]}`;
			case 0: return isDay ? "today" : `this ${units[unit][0]}`;
		}
	}
	const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
	return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}
function stringifyTokens(splits, tokenToString) {
	let s$1 = "";
	for (const token of splits) if (token.literal) s$1 += token.val;
else s$1 += tokenToString(token.val);
	return s$1;
}
const macroTokenToFormatOpts = {
	D: DATE_SHORT,
	DD: DATE_MED,
	DDD: DATE_FULL,
	DDDD: DATE_HUGE,
	t: TIME_SIMPLE,
	tt: TIME_WITH_SECONDS,
	ttt: TIME_WITH_SHORT_OFFSET,
	tttt: TIME_WITH_LONG_OFFSET,
	T: TIME_24_SIMPLE,
	TT: TIME_24_WITH_SECONDS,
	TTT: TIME_24_WITH_SHORT_OFFSET,
	TTTT: TIME_24_WITH_LONG_OFFSET,
	f: DATETIME_SHORT,
	ff: DATETIME_MED,
	fff: DATETIME_FULL,
	ffff: DATETIME_HUGE,
	F: DATETIME_SHORT_WITH_SECONDS,
	FF: DATETIME_MED_WITH_SECONDS,
	FFF: DATETIME_FULL_WITH_SECONDS,
	FFFF: DATETIME_HUGE_WITH_SECONDS
};
var Formatter = class Formatter {
	static create(locale, opts = {}) {
		return new Formatter(locale, opts);
	}
	static parseFormat(fmt) {
		let current = null, currentFull = "", bracketed = false;
		const splits = [];
		for (let i = 0; i < fmt.length; i++) {
			const c = fmt.charAt(i);
			if (c === "'") {
				if (currentFull.length > 0) splits.push({
					literal: bracketed || /^\s+$/.test(currentFull),
					val: currentFull
				});
				current = null;
				currentFull = "";
				bracketed = !bracketed;
			} else if (bracketed) currentFull += c;
else if (c === current) currentFull += c;
else {
				if (currentFull.length > 0) splits.push({
					literal: /^\s+$/.test(currentFull),
					val: currentFull
				});
				currentFull = c;
				current = c;
			}
		}
		if (currentFull.length > 0) splits.push({
			literal: bracketed || /^\s+$/.test(currentFull),
			val: currentFull
		});
		return splits;
	}
	static macroTokenToFormatOpts(token) {
		return macroTokenToFormatOpts[token];
	}
	constructor(locale, formatOpts) {
		this.opts = formatOpts;
		this.loc = locale;
		this.systemLoc = null;
	}
	formatWithSystemDefault(dt, opts) {
		if (this.systemLoc === null) this.systemLoc = this.loc.redefaultToSystem();
		const df = this.systemLoc.dtFormatter(dt, {
			...this.opts,
			...opts
		});
		return df.format();
	}
	dtFormatter(dt, opts = {}) {
		return this.loc.dtFormatter(dt, {
			...this.opts,
			...opts
		});
	}
	formatDateTime(dt, opts) {
		return this.dtFormatter(dt, opts).format();
	}
	formatDateTimeParts(dt, opts) {
		return this.dtFormatter(dt, opts).formatToParts();
	}
	formatInterval(interval, opts) {
		const df = this.dtFormatter(interval.start, opts);
		return df.dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
	}
	resolvedOptions(dt, opts) {
		return this.dtFormatter(dt, opts).resolvedOptions();
	}
	num(n$1, p = 0) {
		if (this.opts.forceSimple) return padStart(n$1, p);
		const opts = { ...this.opts };
		if (p > 0) opts.padTo = p;
		return this.loc.numberFormatter(opts).format(n$1);
	}
	formatDateTimeFromString(dt, fmt) {
		const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string = (opts, extract) => this.loc.extract(dt, opts, extract), formatOffset$1 = (opts) => {
			if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) return "Z";
			return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
		}, meridiem = () => knownEnglish ? meridiemForDateTime(dt) : string({
			hour: "numeric",
			hourCycle: "h12"
		}, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt, length) : string(standalone ? { month: length } : {
			month: length,
			day: "numeric"
		}, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt, length) : string(standalone ? { weekday: length } : {
			weekday: length,
			month: "long",
			day: "numeric"
		}, "weekday"), maybeMacro = (token) => {
			const formatOpts = Formatter.macroTokenToFormatOpts(token);
			if (formatOpts) return this.formatWithSystemDefault(dt, formatOpts);
else return token;
		}, era = (length) => knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, "era"), tokenToString = (token) => {
			switch (token) {
				case "S": return this.num(dt.millisecond);
				case "u":
				case "SSS": return this.num(dt.millisecond, 3);
				case "s": return this.num(dt.second);
				case "ss": return this.num(dt.second, 2);
				case "uu": return this.num(Math.floor(dt.millisecond / 10), 2);
				case "uuu": return this.num(Math.floor(dt.millisecond / 100));
				case "m": return this.num(dt.minute);
				case "mm": return this.num(dt.minute, 2);
				case "h": return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
				case "hh": return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
				case "H": return this.num(dt.hour);
				case "HH": return this.num(dt.hour, 2);
				case "Z": return formatOffset$1({
					format: "narrow",
					allowZ: this.opts.allowZ
				});
				case "ZZ": return formatOffset$1({
					format: "short",
					allowZ: this.opts.allowZ
				});
				case "ZZZ": return formatOffset$1({
					format: "techie",
					allowZ: this.opts.allowZ
				});
				case "ZZZZ": return dt.zone.offsetName(dt.ts, {
					format: "short",
					locale: this.loc.locale
				});
				case "ZZZZZ": return dt.zone.offsetName(dt.ts, {
					format: "long",
					locale: this.loc.locale
				});
				case "z": return dt.zoneName;
				case "a": return meridiem();
				case "d": return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt.day);
				case "dd": return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt.day, 2);
				case "c": return this.num(dt.weekday);
				case "ccc": return weekday("short", true);
				case "cccc": return weekday("long", true);
				case "ccccc": return weekday("narrow", true);
				case "E": return this.num(dt.weekday);
				case "EEE": return weekday("short", false);
				case "EEEE": return weekday("long", false);
				case "EEEEE": return weekday("narrow", false);
				case "L": return useDateTimeFormatter ? string({
					month: "numeric",
					day: "numeric"
				}, "month") : this.num(dt.month);
				case "LL": return useDateTimeFormatter ? string({
					month: "2-digit",
					day: "numeric"
				}, "month") : this.num(dt.month, 2);
				case "LLL": return month("short", true);
				case "LLLL": return month("long", true);
				case "LLLLL": return month("narrow", true);
				case "M": return useDateTimeFormatter ? string({ month: "numeric" }, "month") : this.num(dt.month);
				case "MM": return useDateTimeFormatter ? string({ month: "2-digit" }, "month") : this.num(dt.month, 2);
				case "MMM": return month("short", false);
				case "MMMM": return month("long", false);
				case "MMMMM": return month("narrow", false);
				case "y": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year);
				case "yy": return useDateTimeFormatter ? string({ year: "2-digit" }, "year") : this.num(dt.year.toString().slice(-2), 2);
				case "yyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 4);
				case "yyyyyy": return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 6);
				case "G": return era("short");
				case "GG": return era("long");
				case "GGGGG": return era("narrow");
				case "kk": return this.num(dt.weekYear.toString().slice(-2), 2);
				case "kkkk": return this.num(dt.weekYear, 4);
				case "W": return this.num(dt.weekNumber);
				case "WW": return this.num(dt.weekNumber, 2);
				case "n": return this.num(dt.localWeekNumber);
				case "nn": return this.num(dt.localWeekNumber, 2);
				case "ii": return this.num(dt.localWeekYear.toString().slice(-2), 2);
				case "iiii": return this.num(dt.localWeekYear, 4);
				case "o": return this.num(dt.ordinal);
				case "ooo": return this.num(dt.ordinal, 3);
				case "q": return this.num(dt.quarter);
				case "qq": return this.num(dt.quarter, 2);
				case "X": return this.num(Math.floor(dt.ts / 1e3));
				case "x": return this.num(dt.ts);
				default: return maybeMacro(token);
			}
		};
		return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
	}
	formatDurationFromString(dur, fmt) {
		const tokenToField = (token) => {
			switch (token[0]) {
				case "S": return "millisecond";
				case "s": return "second";
				case "m": return "minute";
				case "h": return "hour";
				case "d": return "day";
				case "w": return "week";
				case "M": return "month";
				case "y": return "year";
				default: return null;
			}
		}, tokenToString = (lildur) => (token) => {
			const mapped = tokenToField(token);
			if (mapped) return this.num(lildur.get(mapped), token.length);
else return token;
		}, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce((found, { literal, val }) => literal ? found : found.concat(val), []), collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t));
		return stringifyTokens(tokens, tokenToString(collapsed));
	}
};
const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function combineRegexes(...regexes) {
	const full = regexes.reduce((f, r) => f + r.source, "");
	return RegExp(`^${full}$`);
}
function combineExtractors(...extractors) {
	return (m) => extractors.reduce(([mergedVals, mergedZone, cursor], ex) => {
		const [val, zone, next] = ex(m, cursor);
		return [
			{
				...mergedVals,
				...val
			},
			zone || mergedZone,
			next
		];
	}, [
		{},
		null,
		1
	]).slice(0, 2);
}
function parse(s$1, ...patterns) {
	if (s$1 == null) return [null, null];
	for (const [regex, extractor] of patterns) {
		const m = regex.exec(s$1);
		if (m) return extractor(m);
	}
	return [null, null];
}
function simpleParse(...keys) {
	return (match$1, cursor) => {
		const ret = {};
		let i;
		for (i = 0; i < keys.length; i++) ret[keys[i]] = parseInteger(match$1[cursor + i]);
		return [
			ret,
			null,
			cursor + i
		];
	};
}
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
const sqlTimeRegex = RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function int(match$1, pos, fallback) {
	const m = match$1[pos];
	return isUndefined(m) ? fallback : parseInteger(m);
}
function extractISOYmd(match$1, cursor) {
	const item = {
		year: int(match$1, cursor),
		month: int(match$1, cursor + 1, 1),
		day: int(match$1, cursor + 2, 1)
	};
	return [
		item,
		null,
		cursor + 3
	];
}
function extractISOTime(match$1, cursor) {
	const item = {
		hours: int(match$1, cursor, 0),
		minutes: int(match$1, cursor + 1, 0),
		seconds: int(match$1, cursor + 2, 0),
		milliseconds: parseMillis(match$1[cursor + 3])
	};
	return [
		item,
		null,
		cursor + 4
	];
}
function extractISOOffset(match$1, cursor) {
	const local = !match$1[cursor] && !match$1[cursor + 1], fullOffset = signedOffset(match$1[cursor + 1], match$1[cursor + 2]), zone = local ? null : FixedOffsetZone.instance(fullOffset);
	return [
		{},
		zone,
		cursor + 3
	];
}
function extractIANAZone(match$1, cursor) {
	const zone = match$1[cursor] ? IANAZone.create(match$1[cursor]) : null;
	return [
		{},
		zone,
		cursor + 1
	];
}
const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
const isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function extractISODuration(match$1) {
	const [s$1, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match$1;
	const hasNegativePrefix = s$1[0] === "-";
	const negativeSeconds = secondStr && secondStr[0] === "-";
	const maybeNegate = (num, force = false) => num !== undefined && (force || num && hasNegativePrefix) ? -num : num;
	return [{
		years: maybeNegate(parseFloating(yearStr)),
		months: maybeNegate(parseFloating(monthStr)),
		weeks: maybeNegate(parseFloating(weekStr)),
		days: maybeNegate(parseFloating(dayStr)),
		hours: maybeNegate(parseFloating(hourStr)),
		minutes: maybeNegate(parseFloating(minuteStr)),
		seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
		milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
	}];
}
const obsOffsets = {
	GMT: 0,
	EDT: -240,
	EST: -300,
	CDT: -300,
	CST: -360,
	MDT: -360,
	MST: -420,
	PDT: -420,
	PST: -480
};
function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
	const result = {
		year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
		month: monthsShort.indexOf(monthStr) + 1,
		day: parseInteger(dayStr),
		hour: parseInteger(hourStr),
		minute: parseInteger(minuteStr)
	};
	if (secondStr) result.second = parseInteger(secondStr);
	if (weekdayStr) result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
	return result;
}
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(match$1) {
	const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr, obsOffset, milOffset, offHourStr, offMinuteStr] = match$1, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
	let offset$1;
	if (obsOffset) offset$1 = obsOffsets[obsOffset];
else if (milOffset) offset$1 = 0;
else offset$1 = signedOffset(offHourStr, offMinuteStr);
	return [result, new FixedOffsetZone(offset$1)];
}
function preprocessRFC2822(s$1) {
	return s$1.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(match$1) {
	const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match$1, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
	return [result, FixedOffsetZone.utcInstance];
}
function extractASCII(match$1) {
	const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match$1, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
	return [result, FixedOffsetZone.utcInstance];
}
const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
const extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOOrdinalDateAndTime = combineExtractors(extractISOOrdinalData, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseISODate(s$1) {
	return parse(s$1, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
}
function parseRFC2822Date(s$1) {
	return parse(preprocessRFC2822(s$1), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(s$1) {
	return parse(s$1, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}
function parseISODuration(s$1) {
	return parse(s$1, [isoDuration, extractISODuration]);
}
const extractISOTimeOnly = combineExtractors(extractISOTime);
function parseISOTimeOnly(s$1) {
	return parse(s$1, [isoTimeOnly, extractISOTimeOnly]);
}
const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
const extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseSQL(s$1) {
	return parse(s$1, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
}
const INVALID$2 = "Invalid Duration";
const lowOrderMatrix = {
	weeks: {
		days: 7,
		hours: 168,
		minutes: 10080,
		seconds: 604800,
		milliseconds: 6048e5
	},
	days: {
		hours: 24,
		minutes: 1440,
		seconds: 86400,
		milliseconds: 864e5
	},
	hours: {
		minutes: 60,
		seconds: 3600,
		milliseconds: 36e5
	},
	minutes: {
		seconds: 60,
		milliseconds: 6e4
	},
	seconds: { milliseconds: 1e3 }
}, casualMatrix = {
	years: {
		quarters: 4,
		months: 12,
		weeks: 52,
		days: 365,
		hours: 8760,
		minutes: 525600,
		seconds: 31536e3,
		milliseconds: 31536e6
	},
	quarters: {
		months: 3,
		weeks: 13,
		days: 91,
		hours: 2184,
		minutes: 131040,
		seconds: 7862400,
		milliseconds: 78624e5
	},
	months: {
		weeks: 4,
		days: 30,
		hours: 720,
		minutes: 43200,
		seconds: 2592e3,
		milliseconds: 2592e6
	},
	...lowOrderMatrix
}, daysInYearAccurate = 365.2425, daysInMonthAccurate = 30.436875, accurateMatrix = {
	years: {
		quarters: 4,
		months: 12,
		weeks: daysInYearAccurate / 7,
		days: daysInYearAccurate,
		hours: daysInYearAccurate * 24,
		minutes: daysInYearAccurate * 24 * 60,
		seconds: daysInYearAccurate * 24 * 60 * 60,
		milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
	},
	quarters: {
		months: 3,
		weeks: daysInYearAccurate / 28,
		days: daysInYearAccurate / 4,
		hours: daysInYearAccurate * 24 / 4,
		minutes: daysInYearAccurate * 24 * 60 / 4,
		seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
		milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
	},
	months: {
		weeks: daysInMonthAccurate / 7,
		days: daysInMonthAccurate,
		hours: daysInMonthAccurate * 24,
		minutes: daysInMonthAccurate * 24 * 60,
		seconds: daysInMonthAccurate * 24 * 60 * 60,
		milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
	},
	...lowOrderMatrix
};
const orderedUnits$1 = [
	"years",
	"quarters",
	"months",
	"weeks",
	"days",
	"hours",
	"minutes",
	"seconds",
	"milliseconds"
];
const reverseUnits = orderedUnits$1.slice(0).reverse();
function clone$1(dur, alts, clear = false) {
	const conf = {
		values: clear ? alts.values : {
			...dur.values,
			...alts.values || {}
		},
		loc: dur.loc.clone(alts.loc),
		conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
		matrix: alts.matrix || dur.matrix
	};
	return new Duration(conf);
}
function durationToMillis(matrix, vals) {
	let sum = vals.milliseconds ?? 0;
	for (const unit of reverseUnits.slice(1)) if (vals[unit]) sum += vals[unit] * matrix[unit]["milliseconds"];
	return sum;
}
function normalizeValues(matrix, vals) {
	const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
	orderedUnits$1.reduceRight((previous, current) => {
		if (!isUndefined(vals[current])) {
			if (previous) {
				const previousVal = vals[previous] * factor;
				const conv = matrix[current][previous];
				const rollUp = Math.floor(previousVal / conv);
				vals[current] += rollUp * factor;
				vals[previous] -= rollUp * conv * factor;
			}
			return current;
		} else return previous;
	}, null);
	orderedUnits$1.reduce((previous, current) => {
		if (!isUndefined(vals[current])) {
			if (previous) {
				const fraction = vals[previous] % 1;
				vals[previous] -= fraction;
				vals[current] += fraction * matrix[previous][current];
			}
			return current;
		} else return previous;
	}, null);
}
function removeZeroes(vals) {
	const newVals = {};
	for (const [key, value] of Object.entries(vals)) if (value !== 0) newVals[key] = value;
	return newVals;
}
var Duration = class Duration {
	/**
	* @private
	*/
	constructor(config) {
		const accurate = config.conversionAccuracy === "longterm" || false;
		let matrix = accurate ? accurateMatrix : casualMatrix;
		if (config.matrix) matrix = config.matrix;
		/**
		* @access private
		*/
		this.values = config.values;
		/**
		* @access private
		*/
		this.loc = config.loc || Locale.create();
		/**
		* @access private
		*/
		this.conversionAccuracy = accurate ? "longterm" : "casual";
		/**
		* @access private
		*/
		this.invalid = config.invalid || null;
		/**
		* @access private
		*/
		this.matrix = matrix;
		/**
		* @access private
		*/
		this.isLuxonDuration = true;
	}
	/**
	* Create Duration from a number of milliseconds.
	* @param {number} count of milliseconds
	* @param {Object} opts - options for parsing
	* @param {string} [opts.locale='en-US'] - the locale to use
	* @param {string} opts.numberingSystem - the numbering system to use
	* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
	* @return {Duration}
	*/
	static fromMillis(count, opts) {
		return Duration.fromObject({ milliseconds: count }, opts);
	}
	/**
	* Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
	* If this object is empty then a zero milliseconds duration is returned.
	* @param {Object} obj - the object to create the DateTime from
	* @param {number} obj.years
	* @param {number} obj.quarters
	* @param {number} obj.months
	* @param {number} obj.weeks
	* @param {number} obj.days
	* @param {number} obj.hours
	* @param {number} obj.minutes
	* @param {number} obj.seconds
	* @param {number} obj.milliseconds
	* @param {Object} [opts=[]] - options for creating this Duration
	* @param {string} [opts.locale='en-US'] - the locale to use
	* @param {string} opts.numberingSystem - the numbering system to use
	* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
	* @param {string} [opts.matrix=Object] - the custom conversion system to use
	* @return {Duration}
	*/
	static fromObject(obj, opts = {}) {
		if (obj == null || typeof obj !== "object") throw new InvalidArgumentError(`Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`);
		return new Duration({
			values: normalizeObject(obj, Duration.normalizeUnit),
			loc: Locale.fromObject(opts),
			conversionAccuracy: opts.conversionAccuracy,
			matrix: opts.matrix
		});
	}
	/**
	* Create a Duration from DurationLike.
	*
	* @param {Object | number | Duration} durationLike
	* One of:
	* - object with keys like 'years' and 'hours'.
	* - number representing milliseconds
	* - Duration instance
	* @return {Duration}
	*/
	static fromDurationLike(durationLike) {
		if (isNumber(durationLike)) return Duration.fromMillis(durationLike);
else if (Duration.isDuration(durationLike)) return durationLike;
else if (typeof durationLike === "object") return Duration.fromObject(durationLike);
else throw new InvalidArgumentError(`Unknown duration argument ${durationLike} of type ${typeof durationLike}`);
	}
	/**
	* Create a Duration from an ISO 8601 duration string.
	* @param {string} text - text to parse
	* @param {Object} opts - options for parsing
	* @param {string} [opts.locale='en-US'] - the locale to use
	* @param {string} opts.numberingSystem - the numbering system to use
	* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
	* @param {string} [opts.matrix=Object] - the preset conversion system to use
	* @see https://en.wikipedia.org/wiki/ISO_8601#Durations
	* @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
	* @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
	* @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
	* @return {Duration}
	*/
	static fromISO(text, opts) {
		const [parsed] = parseISODuration(text);
		if (parsed) return Duration.fromObject(parsed, opts);
else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	/**
	* Create a Duration from an ISO 8601 time string.
	* @param {string} text - text to parse
	* @param {Object} opts - options for parsing
	* @param {string} [opts.locale='en-US'] - the locale to use
	* @param {string} opts.numberingSystem - the numbering system to use
	* @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
	* @param {string} [opts.matrix=Object] - the conversion system to use
	* @see https://en.wikipedia.org/wiki/ISO_8601#Times
	* @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
	* @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
	* @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
	* @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
	* @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
	* @return {Duration}
	*/
	static fromISOTime(text, opts) {
		const [parsed] = parseISOTimeOnly(text);
		if (parsed) return Duration.fromObject(parsed, opts);
else return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	/**
	* Create an invalid Duration.
	* @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
	* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
	* @return {Duration}
	*/
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidDurationError(invalid);
else return new Duration({ invalid });
	}
	/**
	* @private
	*/
	static normalizeUnit(unit) {
		const normalized = {
			year: "years",
			years: "years",
			quarter: "quarters",
			quarters: "quarters",
			month: "months",
			months: "months",
			week: "weeks",
			weeks: "weeks",
			day: "days",
			days: "days",
			hour: "hours",
			hours: "hours",
			minute: "minutes",
			minutes: "minutes",
			second: "seconds",
			seconds: "seconds",
			millisecond: "milliseconds",
			milliseconds: "milliseconds"
		}[unit ? unit.toLowerCase() : unit];
		if (!normalized) throw new InvalidUnitError(unit);
		return normalized;
	}
	/**
	* Check if an object is a Duration. Works across context boundaries
	* @param {object} o
	* @return {boolean}
	*/
	static isDuration(o) {
		return o && o.isLuxonDuration || false;
	}
	/**
	* Get  the locale of a Duration, such 'en-GB'
	* @type {string}
	*/
	get locale() {
		return this.isValid ? this.loc.locale : null;
	}
	/**
	* Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
	*
	* @type {string}
	*/
	get numberingSystem() {
		return this.isValid ? this.loc.numberingSystem : null;
	}
	/**
	* Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
	* * `S` for milliseconds
	* * `s` for seconds
	* * `m` for minutes
	* * `h` for hours
	* * `d` for days
	* * `w` for weeks
	* * `M` for months
	* * `y` for years
	* Notes:
	* * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
	* * Tokens can be escaped by wrapping with single quotes.
	* * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
	* @param {string} fmt - the format string
	* @param {Object} opts - options
	* @param {boolean} [opts.floor=true] - floor numerical values
	* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
	* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
	* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
	* @return {string}
	*/
	toFormat(fmt, opts = {}) {
		const fmtOpts = {
			...opts,
			floor: opts.round !== false && opts.floor !== false
		};
		return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
	}
	/**
	* Returns a string representation of a Duration with all units included.
	* To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
	* @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
	* @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
	* @example
	* ```js
	* var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
	* dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
	* dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
	* dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
	* ```
	*/
	toHuman(opts = {}) {
		if (!this.isValid) return INVALID$2;
		const l$1 = orderedUnits$1.map((unit) => {
			const val = this.values[unit];
			if (isUndefined(val)) return null;
			return this.loc.numberFormatter({
				style: "unit",
				unitDisplay: "long",
				...opts,
				unit: unit.slice(0, -1)
			}).format(val);
		}).filter((n$1) => n$1);
		return this.loc.listFormatter({
			type: "conjunction",
			style: opts.listStyle || "narrow",
			...opts
		}).format(l$1);
	}
	/**
	* Returns a JavaScript object with this Duration's values.
	* @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
	* @return {Object}
	*/
	toObject() {
		if (!this.isValid) return {};
		return { ...this.values };
	}
	/**
	* Returns an ISO 8601-compliant string representation of this Duration.
	* @see https://en.wikipedia.org/wiki/ISO_8601#Durations
	* @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
	* @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
	* @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
	* @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
	* @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
	* @return {string}
	*/
	toISO() {
		if (!this.isValid) return null;
		let s$1 = "P";
		if (this.years !== 0) s$1 += this.years + "Y";
		if (this.months !== 0 || this.quarters !== 0) s$1 += this.months + this.quarters * 3 + "M";
		if (this.weeks !== 0) s$1 += this.weeks + "W";
		if (this.days !== 0) s$1 += this.days + "D";
		if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) s$1 += "T";
		if (this.hours !== 0) s$1 += this.hours + "H";
		if (this.minutes !== 0) s$1 += this.minutes + "M";
		if (this.seconds !== 0 || this.milliseconds !== 0) s$1 += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
		if (s$1 === "P") s$1 += "T0S";
		return s$1;
	}
	/**
	* Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
	* Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
	* @see https://en.wikipedia.org/wiki/ISO_8601#Times
	* @param {Object} opts - options
	* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
	* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
	* @param {boolean} [opts.includePrefix=false] - include the `T` prefix
	* @param {string} [opts.format='extended'] - choose between the basic and extended format
	* @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
	* @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
	* @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
	* @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
	* @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
	* @return {string}
	*/
	toISOTime(opts = {}) {
		if (!this.isValid) return null;
		const millis = this.toMillis();
		if (millis < 0 || millis >= 864e5) return null;
		opts = {
			suppressMilliseconds: false,
			suppressSeconds: false,
			includePrefix: false,
			format: "extended",
			...opts,
			includeOffset: false
		};
		const dateTime = DateTime.fromMillis(millis, { zone: "UTC" });
		return dateTime.toISOTime(opts);
	}
	/**
	* Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
	* @return {string}
	*/
	toJSON() {
		return this.toISO();
	}
	/**
	* Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
	* @return {string}
	*/
	toString() {
		return this.toISO();
	}
	/**
	* Returns a string representation of this Duration appropriate for the REPL.
	* @return {string}
	*/
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `Duration { values: ${JSON.stringify(this.values)} }`;
else return `Duration { Invalid, reason: ${this.invalidReason} }`;
	}
	/**
	* Returns an milliseconds value of this Duration.
	* @return {number}
	*/
	toMillis() {
		if (!this.isValid) return NaN;
		return durationToMillis(this.matrix, this.values);
	}
	/**
	* Returns an milliseconds value of this Duration. Alias of {@link toMillis}
	* @return {number}
	*/
	valueOf() {
		return this.toMillis();
	}
	/**
	* Make this Duration longer by the specified amount. Return a newly-constructed Duration.
	* @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
	* @return {Duration}
	*/
	plus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration), result = {};
		for (const k of orderedUnits$1) if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) result[k] = dur.get(k) + this.get(k);
		return clone$1(this, { values: result }, true);
	}
	/**
	* Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
	* @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
	* @return {Duration}
	*/
	minus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration);
		return this.plus(dur.negate());
	}
	/**
	* Scale this Duration by the specified amount. Return a newly-constructed Duration.
	* @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
	* @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
	* @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
	* @return {Duration}
	*/
	mapUnits(fn) {
		if (!this.isValid) return this;
		const result = {};
		for (const k of Object.keys(this.values)) result[k] = asNumber(fn(this.values[k], k));
		return clone$1(this, { values: result }, true);
	}
	/**
	* Get the value of unit.
	* @param {string} unit - a unit such as 'minute' or 'day'
	* @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
	* @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
	* @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
	* @return {number}
	*/
	get(unit) {
		return this[Duration.normalizeUnit(unit)];
	}
	/**
	* "Set" the values of specified units. Return a newly-constructed Duration.
	* @param {Object} values - a mapping of units to numbers
	* @example dur.set({ years: 2017 })
	* @example dur.set({ hours: 8, minutes: 30 })
	* @return {Duration}
	*/
	set(values) {
		if (!this.isValid) return this;
		const mixed = {
			...this.values,
			...normalizeObject(values, Duration.normalizeUnit)
		};
		return clone$1(this, { values: mixed });
	}
	/**
	* "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
	* @example dur.reconfigure({ locale: 'en-GB' })
	* @return {Duration}
	*/
	reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
		const loc = this.loc.clone({
			locale,
			numberingSystem
		});
		const opts = {
			loc,
			matrix,
			conversionAccuracy
		};
		return clone$1(this, opts);
	}
	/**
	* Return the length of the duration in the specified unit.
	* @param {string} unit - a unit such as 'minutes' or 'days'
	* @example Duration.fromObject({years: 1}).as('days') //=> 365
	* @example Duration.fromObject({years: 1}).as('months') //=> 12
	* @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
	* @return {number}
	*/
	as(unit) {
		return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
	}
	/**
	* Reduce this Duration to its canonical representation in its current units.
	* Assuming the overall value of the Duration is positive, this means:
	* - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
	* - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
	*   the overall value would be negative, see third example)
	* - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
	*
	* If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
	* @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
	* @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
	* @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
	* @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
	* @return {Duration}
	*/
	normalize() {
		if (!this.isValid) return this;
		const vals = this.toObject();
		normalizeValues(this.matrix, vals);
		return clone$1(this, { values: vals }, true);
	}
	/**
	* Rescale units to its largest representation
	* @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
	* @return {Duration}
	*/
	rescale() {
		if (!this.isValid) return this;
		const vals = removeZeroes(this.normalize().shiftToAll().toObject());
		return clone$1(this, { values: vals }, true);
	}
	/**
	* Convert this Duration into its representation in a different set of units.
	* @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
	* @return {Duration}
	*/
	shiftTo(...units) {
		if (!this.isValid) return this;
		if (units.length === 0) return this;
		units = units.map((u) => Duration.normalizeUnit(u));
		const built = {}, accumulated = {}, vals = this.toObject();
		let lastUnit;
		for (const k of orderedUnits$1) if (units.indexOf(k) >= 0) {
			lastUnit = k;
			let own = 0;
			for (const ak in accumulated) {
				own += this.matrix[ak][k] * accumulated[ak];
				accumulated[ak] = 0;
			}
			if (isNumber(vals[k])) own += vals[k];
			const i = Math.trunc(own);
			built[k] = i;
			accumulated[k] = (own * 1e3 - i * 1e3) / 1e3;
		} else if (isNumber(vals[k])) accumulated[k] = vals[k];
		for (const key in accumulated) if (accumulated[key] !== 0) built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
		normalizeValues(this.matrix, built);
		return clone$1(this, { values: built }, true);
	}
	/**
	* Shift this Duration to all available units.
	* Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
	* @return {Duration}
	*/
	shiftToAll() {
		if (!this.isValid) return this;
		return this.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds");
	}
	/**
	* Return the negative of this Duration.
	* @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
	* @return {Duration}
	*/
	negate() {
		if (!this.isValid) return this;
		const negated = {};
		for (const k of Object.keys(this.values)) negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
		return clone$1(this, { values: negated }, true);
	}
	/**
	* Get the years.
	* @type {number}
	*/
	get years() {
		return this.isValid ? this.values.years || 0 : NaN;
	}
	/**
	* Get the quarters.
	* @type {number}
	*/
	get quarters() {
		return this.isValid ? this.values.quarters || 0 : NaN;
	}
	/**
	* Get the months.
	* @type {number}
	*/
	get months() {
		return this.isValid ? this.values.months || 0 : NaN;
	}
	/**
	* Get the weeks
	* @type {number}
	*/
	get weeks() {
		return this.isValid ? this.values.weeks || 0 : NaN;
	}
	/**
	* Get the days.
	* @type {number}
	*/
	get days() {
		return this.isValid ? this.values.days || 0 : NaN;
	}
	/**
	* Get the hours.
	* @type {number}
	*/
	get hours() {
		return this.isValid ? this.values.hours || 0 : NaN;
	}
	/**
	* Get the minutes.
	* @type {number}
	*/
	get minutes() {
		return this.isValid ? this.values.minutes || 0 : NaN;
	}
	/**
	* Get the seconds.
	* @return {number}
	*/
	get seconds() {
		return this.isValid ? this.values.seconds || 0 : NaN;
	}
	/**
	* Get the milliseconds.
	* @return {number}
	*/
	get milliseconds() {
		return this.isValid ? this.values.milliseconds || 0 : NaN;
	}
	/**
	* Returns whether the Duration is invalid. Invalid durations are returned by diff operations
	* on invalid DateTimes or Intervals.
	* @return {boolean}
	*/
	get isValid() {
		return this.invalid === null;
	}
	/**
	* Returns an error code if this Duration became invalid, or null if the Duration is valid
	* @return {string}
	*/
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	/**
	* Returns an explanation of why this Duration became invalid, or null if the Duration is valid
	* @type {string}
	*/
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	/**
	* Equality check
	* Two Durations are equal iff they have the same units and the same values for each unit.
	* @param {Duration} other
	* @return {boolean}
	*/
	equals(other) {
		if (!this.isValid || !other.isValid) return false;
		if (!this.loc.equals(other.loc)) return false;
		function eq(v1, v2) {
			if (v1 === undefined || v1 === 0) return v2 === undefined || v2 === 0;
			return v1 === v2;
		}
		for (const u of orderedUnits$1) if (!eq(this.values[u], other.values[u])) return false;
		return true;
	}
};
const INVALID$1 = "Invalid Interval";
function validateStartEnd(start, end) {
	if (!start || !start.isValid) return Interval.invalid("missing or invalid start");
else if (!end || !end.isValid) return Interval.invalid("missing or invalid end");
else if (end < start) return Interval.invalid("end before start", `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`);
else return null;
}
var Interval = class Interval {
	/**
	* @private
	*/
	constructor(config) {
		/**
		* @access private
		*/
		this.s = config.start;
		/**
		* @access private
		*/
		this.e = config.end;
		/**
		* @access private
		*/
		this.invalid = config.invalid || null;
		/**
		* @access private
		*/
		this.isLuxonInterval = true;
	}
	/**
	* Create an invalid Interval.
	* @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
	* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
	* @return {Interval}
	*/
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidIntervalError(invalid);
else return new Interval({ invalid });
	}
	/**
	* Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
	* @param {DateTime|Date|Object} start
	* @param {DateTime|Date|Object} end
	* @return {Interval}
	*/
	static fromDateTimes(start, end) {
		const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
		const validateError = validateStartEnd(builtStart, builtEnd);
		if (validateError == null) return new Interval({
			start: builtStart,
			end: builtEnd
		});
else return validateError;
	}
	/**
	* Create an Interval from a start DateTime and a Duration to extend to.
	* @param {DateTime|Date|Object} start
	* @param {Duration|Object|number} duration - the length of the Interval.
	* @return {Interval}
	*/
	static after(start, duration) {
		const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(start);
		return Interval.fromDateTimes(dt, dt.plus(dur));
	}
	/**
	* Create an Interval from an end DateTime and a Duration to extend backwards to.
	* @param {DateTime|Date|Object} end
	* @param {Duration|Object|number} duration - the length of the Interval.
	* @return {Interval}
	*/
	static before(end, duration) {
		const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(end);
		return Interval.fromDateTimes(dt.minus(dur), dt);
	}
	/**
	* Create an Interval from an ISO 8601 string.
	* Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
	* @param {string} text - the ISO string to parse
	* @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
	* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
	* @return {Interval}
	*/
	static fromISO(text, opts) {
		const [s$1, e] = (text || "").split("/", 2);
		if (s$1 && e) {
			let start, startIsValid;
			try {
				start = DateTime.fromISO(s$1, opts);
				startIsValid = start.isValid;
			} catch (e$1) {
				startIsValid = false;
			}
			let end, endIsValid;
			try {
				end = DateTime.fromISO(e, opts);
				endIsValid = end.isValid;
			} catch (e$1) {
				endIsValid = false;
			}
			if (startIsValid && endIsValid) return Interval.fromDateTimes(start, end);
			if (startIsValid) {
				const dur = Duration.fromISO(e, opts);
				if (dur.isValid) return Interval.after(start, dur);
			} else if (endIsValid) {
				const dur = Duration.fromISO(s$1, opts);
				if (dur.isValid) return Interval.before(end, dur);
			}
		}
		return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
	}
	/**
	* Check if an object is an Interval. Works across context boundaries
	* @param {object} o
	* @return {boolean}
	*/
	static isInterval(o) {
		return o && o.isLuxonInterval || false;
	}
	/**
	* Returns the start of the Interval
	* @type {DateTime}
	*/
	get start() {
		return this.isValid ? this.s : null;
	}
	/**
	* Returns the end of the Interval
	* @type {DateTime}
	*/
	get end() {
		return this.isValid ? this.e : null;
	}
	/**
	* Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
	* @type {boolean}
	*/
	get isValid() {
		return this.invalidReason === null;
	}
	/**
	* Returns an error code if this Interval is invalid, or null if the Interval is valid
	* @type {string}
	*/
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	/**
	* Returns an explanation of why this Interval became invalid, or null if the Interval is valid
	* @type {string}
	*/
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	/**
	* Returns the length of the Interval in the specified unit.
	* @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
	* @return {number}
	*/
	length(unit = "milliseconds") {
		return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
	}
	/**
	* Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
	* Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
	* asks 'what dates are included in this interval?', not 'how many days long is this interval?'
	* @param {string} [unit='milliseconds'] - the unit of time to count.
	* @param {Object} opts - options
	* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
	* @return {number}
	*/
	count(unit = "milliseconds", opts) {
		if (!this.isValid) return NaN;
		const start = this.start.startOf(unit, opts);
		let end;
		if (opts?.useLocaleWeeks) end = this.end.reconfigure({ locale: start.locale });
else end = this.end;
		end = end.startOf(unit, opts);
		return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
	}
	/**
	* Returns whether this Interval's start and end are both in the same unit of time
	* @param {string} unit - the unit of time to check sameness on
	* @return {boolean}
	*/
	hasSame(unit) {
		return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
	}
	/**
	* Return whether this Interval has the same start and end DateTimes.
	* @return {boolean}
	*/
	isEmpty() {
		return this.s.valueOf() === this.e.valueOf();
	}
	/**
	* Return whether this Interval's start is after the specified DateTime.
	* @param {DateTime} dateTime
	* @return {boolean}
	*/
	isAfter(dateTime) {
		if (!this.isValid) return false;
		return this.s > dateTime;
	}
	/**
	* Return whether this Interval's end is before the specified DateTime.
	* @param {DateTime} dateTime
	* @return {boolean}
	*/
	isBefore(dateTime) {
		if (!this.isValid) return false;
		return this.e <= dateTime;
	}
	/**
	* Return whether this Interval contains the specified DateTime.
	* @param {DateTime} dateTime
	* @return {boolean}
	*/
	contains(dateTime) {
		if (!this.isValid) return false;
		return this.s <= dateTime && this.e > dateTime;
	}
	/**
	* "Sets" the start and/or end dates. Returns a newly-constructed Interval.
	* @param {Object} values - the values to set
	* @param {DateTime} values.start - the starting DateTime
	* @param {DateTime} values.end - the ending DateTime
	* @return {Interval}
	*/
	set({ start, end } = {}) {
		if (!this.isValid) return this;
		return Interval.fromDateTimes(start || this.s, end || this.e);
	}
	/**
	* Split this Interval at each of the specified DateTimes
	* @param {...DateTime} dateTimes - the unit of time to count.
	* @return {Array}
	*/
	splitAt(...dateTimes) {
		if (!this.isValid) return [];
		const sorted = dateTimes.map(friendlyDateTime).filter((d) => this.contains(d)).sort((a, b) => a.toMillis() - b.toMillis()), results = [];
		let { s: s$1 } = this, i = 0;
		while (s$1 < this.e) {
			const added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
			results.push(Interval.fromDateTimes(s$1, next));
			s$1 = next;
			i += 1;
		}
		return results;
	}
	/**
	* Split this Interval into smaller Intervals, each of the specified length.
	* Left over time is grouped into a smaller interval
	* @param {Duration|Object|number} duration - The length of each resulting interval.
	* @return {Array}
	*/
	splitBy(duration) {
		const dur = Duration.fromDurationLike(duration);
		if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) return [];
		let { s: s$1 } = this, idx = 1, next;
		const results = [];
		while (s$1 < this.e) {
			const added = this.start.plus(dur.mapUnits((x) => x * idx));
			next = +added > +this.e ? this.e : added;
			results.push(Interval.fromDateTimes(s$1, next));
			s$1 = next;
			idx += 1;
		}
		return results;
	}
	/**
	* Split this Interval into the specified number of smaller intervals.
	* @param {number} numberOfParts - The number of Intervals to divide the Interval into.
	* @return {Array}
	*/
	divideEqually(numberOfParts) {
		if (!this.isValid) return [];
		return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
	}
	/**
	* Return whether this Interval overlaps with the specified Interval
	* @param {Interval} other
	* @return {boolean}
	*/
	overlaps(other) {
		return this.e > other.s && this.s < other.e;
	}
	/**
	* Return whether this Interval's end is adjacent to the specified Interval's start.
	* @param {Interval} other
	* @return {boolean}
	*/
	abutsStart(other) {
		if (!this.isValid) return false;
		return +this.e === +other.s;
	}
	/**
	* Return whether this Interval's start is adjacent to the specified Interval's end.
	* @param {Interval} other
	* @return {boolean}
	*/
	abutsEnd(other) {
		if (!this.isValid) return false;
		return +other.e === +this.s;
	}
	/**
	* Return whether this Interval engulfs the start and end of the specified Interval.
	* @param {Interval} other
	* @return {boolean}
	*/
	engulfs(other) {
		if (!this.isValid) return false;
		return this.s <= other.s && this.e >= other.e;
	}
	/**
	* Return whether this Interval has the same start and end as the specified Interval.
	* @param {Interval} other
	* @return {boolean}
	*/
	equals(other) {
		if (!this.isValid || !other.isValid) return false;
		return this.s.equals(other.s) && this.e.equals(other.e);
	}
	/**
	* Return an Interval representing the intersection of this Interval and the specified Interval.
	* Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
	* Returns null if the intersection is empty, meaning, the intervals don't intersect.
	* @param {Interval} other
	* @return {Interval}
	*/
	intersection(other) {
		if (!this.isValid) return this;
		const s$1 = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
		if (s$1 >= e) return null;
else return Interval.fromDateTimes(s$1, e);
	}
	/**
	* Return an Interval representing the union of this Interval and the specified Interval.
	* Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
	* @param {Interval} other
	* @return {Interval}
	*/
	union(other) {
		if (!this.isValid) return this;
		const s$1 = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
		return Interval.fromDateTimes(s$1, e);
	}
	/**
	* Merge an array of Intervals into a equivalent minimal set of Intervals.
	* Combines overlapping and adjacent Intervals.
	* @param {Array} intervals
	* @return {Array}
	*/
	static merge(intervals) {
		const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(([sofar, current], item) => {
			if (!current) return [sofar, item];
else if (current.overlaps(item) || current.abutsStart(item)) return [sofar, current.union(item)];
else return [sofar.concat([current]), item];
		}, [[], null]);
		if (final) found.push(final);
		return found;
	}
	/**
	* Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
	* @param {Array} intervals
	* @return {Array}
	*/
	static xor(intervals) {
		let start = null, currentCount = 0;
		const results = [], ends = intervals.map((i) => [{
			time: i.s,
			type: "s"
		}, {
			time: i.e,
			type: "e"
		}]), flattened = Array.prototype.concat(...ends), arr = flattened.sort((a, b) => a.time - b.time);
		for (const i of arr) {
			currentCount += i.type === "s" ? 1 : -1;
			if (currentCount === 1) start = i.time;
else {
				if (start && +start !== +i.time) results.push(Interval.fromDateTimes(start, i.time));
				start = null;
			}
		}
		return Interval.merge(results);
	}
	/**
	* Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
	* @param {...Interval} intervals
	* @return {Array}
	*/
	difference(...intervals) {
		return Interval.xor([this].concat(intervals)).map((i) => this.intersection(i)).filter((i) => i && !i.isEmpty());
	}
	/**
	* Returns a string representation of this Interval appropriate for debugging.
	* @return {string}
	*/
	toString() {
		if (!this.isValid) return INVALID$1;
		return `[${this.s.toISO()} – ${this.e.toISO()})`;
	}
	/**
	* Returns a string representation of this Interval appropriate for the REPL.
	* @return {string}
	*/
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
else return `Interval { Invalid, reason: ${this.invalidReason} }`;
	}
	/**
	* Returns a localized string representing this Interval. Accepts the same options as the
	* Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
	* {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
	* is browser-specific, but in general it will return an appropriate representation of the
	* Interval in the assigned locale. Defaults to the system's locale if no locale has been
	* specified.
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
	* @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
	* Intl.DateTimeFormat constructor options.
	* @param {Object} opts - Options to override the configuration of the start DateTime.
	* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
	* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
	* @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
	* @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
	* @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
	* @return {string}
	*/
	toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
		return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
	}
	/**
	* Returns an ISO 8601-compliant string representation of this Interval.
	* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
	* @param {Object} opts - The same options as {@link DateTime#toISO}
	* @return {string}
	*/
	toISO(opts) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
	}
	/**
	* Returns an ISO 8601-compliant string representation of date of this Interval.
	* The time components are ignored.
	* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
	* @return {string}
	*/
	toISODate() {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISODate()}/${this.e.toISODate()}`;
	}
	/**
	* Returns an ISO 8601-compliant string representation of time of this Interval.
	* The date components are ignored.
	* @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
	* @param {Object} opts - The same options as {@link DateTime#toISO}
	* @return {string}
	*/
	toISOTime(opts) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
	}
	/**
	* Returns a string representation of this Interval formatted according to the specified format
	* string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
	* formatting tool.
	* @param {string} dateFormat - The format string. This string formats the start and end time.
	* See {@link DateTime#toFormat} for details.
	* @param {Object} opts - Options.
	* @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
	* representations.
	* @return {string}
	*/
	toFormat(dateFormat, { separator = " – " } = {}) {
		if (!this.isValid) return INVALID$1;
		return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
	}
	/**
	* Return a Duration representing the time spanned by this interval.
	* @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
	* @param {Object} opts - options that affect the creation of the Duration
	* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
	* @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
	* @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
	* @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
	* @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
	* @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
	* @return {Duration}
	*/
	toDuration(unit, opts) {
		if (!this.isValid) return Duration.invalid(this.invalidReason);
		return this.e.diff(this.s, unit, opts);
	}
	/**
	* Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
	* @param {function} mapFn
	* @return {Interval}
	* @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
	* @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
	*/
	mapEndpoints(mapFn) {
		return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
	}
};
var Info = class {
	/**
	* Return whether the specified zone contains a DST.
	* @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
	* @return {boolean}
	*/
	static hasDST(zone = Settings.defaultZone) {
		const proto = DateTime.now().setZone(zone).set({ month: 12 });
		return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
	}
	/**
	* Return whether the specified zone is a valid IANA specifier.
	* @param {string} zone - Zone to check
	* @return {boolean}
	*/
	static isValidIANAZone(zone) {
		return IANAZone.isValidZone(zone);
	}
	/**
	* Converts the input into a {@link Zone} instance.
	*
	* * If `input` is already a Zone instance, it is returned unchanged.
	* * If `input` is a string containing a valid time zone name, a Zone instance
	*   with that name is returned.
	* * If `input` is a string that doesn't refer to a known time zone, a Zone
	*   instance with {@link Zone#isValid} == false is returned.
	* * If `input is a number, a Zone instance with the specified fixed offset
	*   in minutes is returned.
	* * If `input` is `null` or `undefined`, the default zone is returned.
	* @param {string|Zone|number} [input] - the value to be converted
	* @return {Zone}
	*/
	static normalizeZone(input) {
		return normalizeZone(input, Settings.defaultZone);
	}
	/**
	* Get the weekday on which the week starts according to the given locale.
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @returns {number} the start of the week, 1 for Monday through 7 for Sunday
	*/
	static getStartOfWeek({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getStartOfWeek();
	}
	/**
	* Get the minimum number of days necessary in a week before it is considered part of the next year according
	* to the given locale.
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @returns {number}
	*/
	static getMinimumDaysInFirstWeek({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
	}
	/**
	* Get the weekdays, which are considered the weekend according to the given locale
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
	*/
	static getWeekendWeekdays({ locale = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale)).getWeekendDays().slice();
	}
	/**
	* Return an array of standalone month names.
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
	* @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.numberingSystem=null] - the numbering system
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @param {string} [opts.outputCalendar='gregory'] - the calendar
	* @example Info.months()[0] //=> 'January'
	* @example Info.months('short')[0] //=> 'Jan'
	* @example Info.months('numeric')[0] //=> '1'
	* @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
	* @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
	* @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
	* @return {Array}
	*/
	static months(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
	}
	/**
	* Return an array of format month names.
	* Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
	* changes the string.
	* See {@link Info#months}
	* @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.numberingSystem=null] - the numbering system
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @param {string} [opts.outputCalendar='gregory'] - the calendar
	* @return {Array}
	*/
	static monthsFormat(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
	}
	/**
	* Return an array of standalone week names.
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
	* @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @param {string} [opts.numberingSystem=null] - the numbering system
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @example Info.weekdays()[0] //=> 'Monday'
	* @example Info.weekdays('short')[0] //=> 'Mon'
	* @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
	* @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
	* @return {Array}
	*/
	static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
	}
	/**
	* Return an array of format week names.
	* Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
	* changes the string.
	* See {@link Info#weekdays}
	* @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
	* @param {Object} opts - options
	* @param {string} [opts.locale=null] - the locale code
	* @param {string} [opts.numberingSystem=null] - the numbering system
	* @param {string} [opts.locObj=null] - an existing locale object to use
	* @return {Array}
	*/
	static weekdaysFormat(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
		return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
	}
	/**
	* Return an array of meridiems.
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @example Info.meridiems() //=> [ 'AM', 'PM' ]
	* @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
	* @return {Array}
	*/
	static meridiems({ locale = null } = {}) {
		return Locale.create(locale).meridiems();
	}
	/**
	* Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
	* @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
	* @param {Object} opts - options
	* @param {string} [opts.locale] - the locale code
	* @example Info.eras() //=> [ 'BC', 'AD' ]
	* @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
	* @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
	* @return {Array}
	*/
	static eras(length = "short", { locale = null } = {}) {
		return Locale.create(locale, null, "gregory").eras(length);
	}
	/**
	* Return the set of available features in this environment.
	* Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
	* Keys:
	* * `relative`: whether this environment supports relative time formatting
	* * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
	* @example Info.features() //=> { relative: false, localeWeek: true }
	* @return {Object}
	*/
	static features() {
		return {
			relative: hasRelative(),
			localeWeek: hasLocaleWeekInfo()
		};
	}
};
function dayDiff(earlier, later) {
	const utcDayStart = (dt) => dt.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(), ms = utcDayStart(later) - utcDayStart(earlier);
	return Math.floor(Duration.fromMillis(ms).as("days"));
}
function highOrderDiffs(cursor, later, units) {
	const differs = [
		["years", (a, b) => b.year - a.year],
		["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
		["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
		["weeks", (a, b) => {
			const days = dayDiff(a, b);
			return (days - days % 7) / 7;
		}],
		["days", dayDiff]
	];
	const results = {};
	const earlier = cursor;
	let lowestOrder, highWater;
	for (const [unit, differ] of differs) if (units.indexOf(unit) >= 0) {
		lowestOrder = unit;
		results[unit] = differ(cursor, later);
		highWater = earlier.plus(results);
		if (highWater > later) {
			results[unit]--;
			cursor = earlier.plus(results);
			if (cursor > later) {
				highWater = cursor;
				results[unit]--;
				cursor = earlier.plus(results);
			}
		} else cursor = highWater;
	}
	return [
		cursor,
		results,
		highWater,
		lowestOrder
	];
}
function diff(earlier, later, units, opts) {
	let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
	const remainingMillis = later - cursor;
	const lowerOrderUnits = units.filter((u) => [
		"hours",
		"minutes",
		"seconds",
		"milliseconds"
	].indexOf(u) >= 0);
	if (lowerOrderUnits.length === 0) {
		if (highWater < later) highWater = cursor.plus({ [lowestOrder]: 1 });
		if (highWater !== cursor) results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
	}
	const duration = Duration.fromObject(results, opts);
	if (lowerOrderUnits.length > 0) return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
else return duration;
}
const numberingSystems = {
	arab: "[٠-٩]",
	arabext: "[۰-۹]",
	bali: "[᭐-᭙]",
	beng: "[০-৯]",
	deva: "[०-९]",
	fullwide: "[０-９]",
	gujr: "[૦-૯]",
	hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
	khmr: "[០-៩]",
	knda: "[೦-೯]",
	laoo: "[໐-໙]",
	limb: "[᥆-᥏]",
	mlym: "[൦-൯]",
	mong: "[᠐-᠙]",
	mymr: "[၀-၉]",
	orya: "[୦-୯]",
	tamldec: "[௦-௯]",
	telu: "[౦-౯]",
	thai: "[๐-๙]",
	tibt: "[༠-༩]",
	latn: "\\d"
};
const numberingSystemsUTF16 = {
	arab: [1632, 1641],
	arabext: [1776, 1785],
	bali: [6992, 7001],
	beng: [2534, 2543],
	deva: [2406, 2415],
	fullwide: [65296, 65303],
	gujr: [2790, 2799],
	khmr: [6112, 6121],
	knda: [3302, 3311],
	laoo: [3792, 3801],
	limb: [6470, 6479],
	mlym: [3430, 3439],
	mong: [6160, 6169],
	mymr: [4160, 4169],
	orya: [2918, 2927],
	tamldec: [3046, 3055],
	telu: [3174, 3183],
	thai: [3664, 3673],
	tibt: [3872, 3881]
};
const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
function parseDigits(str) {
	let value = parseInt(str, 10);
	if (isNaN(value)) {
		value = "";
		for (let i = 0; i < str.length; i++) {
			const code = str.charCodeAt(i);
			if (str[i].search(numberingSystems.hanidec) !== -1) value += hanidecChars.indexOf(str[i]);
else for (const key in numberingSystemsUTF16) {
				const [min, max] = numberingSystemsUTF16[key];
				if (code >= min && code <= max) value += code - min;
			}
		}
		return parseInt(value, 10);
	} else return value;
}
function digitRegex({ numberingSystem }, append = "") {
	return new RegExp(`${numberingSystems[numberingSystem || "latn"]}${append}`);
}
const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
function intUnit(regex, post = (i) => i) {
	return {
		regex,
		deser: ([s$1]) => post(parseDigits(s$1))
	};
}
const NBSP = String.fromCharCode(160);
const spaceOrNBSP = `[ ${NBSP}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
function fixListRegex(s$1) {
	return s$1.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}
function stripInsensitivities(s$1) {
	return s$1.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
}
function oneOf(strings, startIndex) {
	if (strings === null) return null;
else return {
		regex: RegExp(strings.map(fixListRegex).join("|")),
		deser: ([s$1]) => strings.findIndex((i) => stripInsensitivities(s$1) === stripInsensitivities(i)) + startIndex
	};
}
function offset(regex, groups) {
	return {
		regex,
		deser: ([, h, m]) => signedOffset(h, m),
		groups
	};
}
function simple(regex) {
	return {
		regex,
		deser: ([s$1]) => s$1
	};
}
function escapeToken(value) {
	return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
/**
* @param token
* @param {Locale} loc
*/
function unitForToken(token, loc) {
	const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t) => ({
		regex: RegExp(escapeToken(t.val)),
		deser: ([s$1]) => s$1,
		literal: true
	}), unitate = (t) => {
		if (token.literal) return literal(t);
		switch (t.val) {
			case "G": return oneOf(loc.eras("short"), 0);
			case "GG": return oneOf(loc.eras("long"), 0);
			case "y": return intUnit(oneToSix);
			case "yy": return intUnit(twoToFour, untruncateYear);
			case "yyyy": return intUnit(four);
			case "yyyyy": return intUnit(fourToSix);
			case "yyyyyy": return intUnit(six);
			case "M": return intUnit(oneOrTwo);
			case "MM": return intUnit(two);
			case "MMM": return oneOf(loc.months("short", true), 1);
			case "MMMM": return oneOf(loc.months("long", true), 1);
			case "L": return intUnit(oneOrTwo);
			case "LL": return intUnit(two);
			case "LLL": return oneOf(loc.months("short", false), 1);
			case "LLLL": return oneOf(loc.months("long", false), 1);
			case "d": return intUnit(oneOrTwo);
			case "dd": return intUnit(two);
			case "o": return intUnit(oneToThree);
			case "ooo": return intUnit(three);
			case "HH": return intUnit(two);
			case "H": return intUnit(oneOrTwo);
			case "hh": return intUnit(two);
			case "h": return intUnit(oneOrTwo);
			case "mm": return intUnit(two);
			case "m": return intUnit(oneOrTwo);
			case "q": return intUnit(oneOrTwo);
			case "qq": return intUnit(two);
			case "s": return intUnit(oneOrTwo);
			case "ss": return intUnit(two);
			case "S": return intUnit(oneToThree);
			case "SSS": return intUnit(three);
			case "u": return simple(oneToNine);
			case "uu": return simple(oneOrTwo);
			case "uuu": return intUnit(one);
			case "a": return oneOf(loc.meridiems(), 0);
			case "kkkk": return intUnit(four);
			case "kk": return intUnit(twoToFour, untruncateYear);
			case "W": return intUnit(oneOrTwo);
			case "WW": return intUnit(two);
			case "E":
			case "c": return intUnit(one);
			case "EEE": return oneOf(loc.weekdays("short", false), 1);
			case "EEEE": return oneOf(loc.weekdays("long", false), 1);
			case "ccc": return oneOf(loc.weekdays("short", true), 1);
			case "cccc": return oneOf(loc.weekdays("long", true), 1);
			case "Z":
			case "ZZ": return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
			case "ZZZ": return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
			case "z": return simple(/[a-z_+-/]{1,256}?/i);
			case " ": return simple(/[^\S\n\r]/);
			default: return literal(t);
		}
	};
	const unit = unitate(token) || { invalidReason: MISSING_FTP };
	unit.token = token;
	return unit;
}
const partTypeStyleToTokenVal = {
	year: {
		"2-digit": "yy",
		numeric: "yyyyy"
	},
	month: {
		numeric: "M",
		"2-digit": "MM",
		short: "MMM",
		long: "MMMM"
	},
	day: {
		numeric: "d",
		"2-digit": "dd"
	},
	weekday: {
		short: "EEE",
		long: "EEEE"
	},
	dayperiod: "a",
	dayPeriod: "a",
	hour12: {
		numeric: "h",
		"2-digit": "hh"
	},
	hour24: {
		numeric: "H",
		"2-digit": "HH"
	},
	minute: {
		numeric: "m",
		"2-digit": "mm"
	},
	second: {
		numeric: "s",
		"2-digit": "ss"
	},
	timeZoneName: {
		long: "ZZZZZ",
		short: "ZZZ"
	}
};
function tokenForPart(part, formatOpts, resolvedOpts) {
	const { type, value } = part;
	if (type === "literal") {
		const isSpace = /^\s+$/.test(value);
		return {
			literal: !isSpace,
			val: isSpace ? " " : value
		};
	}
	const style = formatOpts[type];
	let actualType = type;
	if (type === "hour") if (formatOpts.hour12 != null) actualType = formatOpts.hour12 ? "hour12" : "hour24";
else if (formatOpts.hourCycle != null) if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") actualType = "hour12";
else actualType = "hour24";
else actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
	let val = partTypeStyleToTokenVal[actualType];
	if (typeof val === "object") val = val[style];
	if (val) return {
		literal: false,
		val
	};
	return undefined;
}
function buildRegex(units) {
	const re = units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
	return [`^${re}$`, units];
}
function match(input, regex, handlers) {
	const matches = input.match(regex);
	if (matches) {
		const all = {};
		let matchIndex = 1;
		for (const i in handlers) if (hasOwnProperty(handlers, i)) {
			const h = handlers[i], groups = h.groups ? h.groups + 1 : 1;
			if (!h.literal && h.token) all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
			matchIndex += groups;
		}
		return [matches, all];
	} else return [matches, {}];
}
function dateTimeFromMatches(matches) {
	const toField = (token) => {
		switch (token) {
			case "S": return "millisecond";
			case "s": return "second";
			case "m": return "minute";
			case "h":
			case "H": return "hour";
			case "d": return "day";
			case "o": return "ordinal";
			case "L":
			case "M": return "month";
			case "y": return "year";
			case "E":
			case "c": return "weekday";
			case "W": return "weekNumber";
			case "k": return "weekYear";
			case "q": return "quarter";
			default: return null;
		}
	};
	let zone = null;
	let specificOffset;
	if (!isUndefined(matches.z)) zone = IANAZone.create(matches.z);
	if (!isUndefined(matches.Z)) {
		if (!zone) zone = new FixedOffsetZone(matches.Z);
		specificOffset = matches.Z;
	}
	if (!isUndefined(matches.q)) matches.M = (matches.q - 1) * 3 + 1;
	if (!isUndefined(matches.h)) {
		if (matches.h < 12 && matches.a === 1) matches.h += 12;
else if (matches.h === 12 && matches.a === 0) matches.h = 0;
	}
	if (matches.G === 0 && matches.y) matches.y = -matches.y;
	if (!isUndefined(matches.u)) matches.S = parseMillis(matches.u);
	const vals = Object.keys(matches).reduce((r, k) => {
		const f = toField(k);
		if (f) r[f] = matches[k];
		return r;
	}, {});
	return [
		vals,
		zone,
		specificOffset
	];
}
let dummyDateTimeCache = null;
function getDummyDateTime() {
	if (!dummyDateTimeCache) dummyDateTimeCache = DateTime.fromMillis(1555555555555);
	return dummyDateTimeCache;
}
function maybeExpandMacroToken(token, locale) {
	if (token.literal) return token;
	const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
	const tokens = formatOptsToTokens(formatOpts, locale);
	if (tokens == null || tokens.includes(undefined)) return token;
	return tokens;
}
function expandMacroTokens(tokens, locale) {
	return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
}
/**
* @private
*/
function explainFromTokens(locale, input, format) {
	const tokens = expandMacroTokens(Formatter.parseFormat(format), locale), units = tokens.map((t) => unitForToken(t, locale)), disqualifyingUnit = units.find((t) => t.invalidReason);
	if (disqualifyingUnit) return {
		input,
		tokens,
		invalidReason: disqualifyingUnit.invalidReason
	};
else {
		const [regexString, handlers] = buildRegex(units), regex = RegExp(regexString, "i"), [rawMatches, matches] = match(input, regex, handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [
			null,
			null,
			undefined
		];
		if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");
		return {
			input,
			tokens,
			regex,
			rawMatches,
			matches,
			result,
			zone,
			specificOffset
		};
	}
}
function parseFromTokens(locale, input, format) {
	const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
	return [
		result,
		zone,
		specificOffset,
		invalidReason
	];
}
function formatOptsToTokens(formatOpts, locale) {
	if (!formatOpts) return null;
	const formatter = Formatter.create(locale, formatOpts);
	const df = formatter.dtFormatter(getDummyDateTime());
	const parts = df.formatToParts();
	const resolvedOpts = df.resolvedOptions();
	return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
}
const INVALID = "Invalid DateTime";
const MAX_DATE = 864e13;
function unsupportedZone(zone) {
	return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}
/**
* @param {DateTime} dt
*/
function possiblyCachedWeekData(dt) {
	if (dt.weekData === null) dt.weekData = gregorianToWeek(dt.c);
	return dt.weekData;
}
/**
* @param {DateTime} dt
*/
function possiblyCachedLocalWeekData(dt) {
	if (dt.localWeekData === null) dt.localWeekData = gregorianToWeek(dt.c, dt.loc.getMinDaysInFirstWeek(), dt.loc.getStartOfWeek());
	return dt.localWeekData;
}
function clone(inst, alts) {
	const current = {
		ts: inst.ts,
		zone: inst.zone,
		c: inst.c,
		o: inst.o,
		loc: inst.loc,
		invalid: inst.invalid
	};
	return new DateTime({
		...current,
		...alts,
		old: current
	});
}
function fixOffset(localTS, o, tz) {
	let utcGuess = localTS - o * 60 * 1e3;
	const o2 = tz.offset(utcGuess);
	if (o === o2) return [utcGuess, o];
	utcGuess -= (o2 - o) * 60 * 1e3;
	const o3 = tz.offset(utcGuess);
	if (o2 === o3) return [utcGuess, o2];
	return [localTS - Math.min(o2, o3) * 60 * 1e3, Math.max(o2, o3)];
}
function tsToObj(ts, offset$1) {
	ts += offset$1 * 60 * 1e3;
	const d = new Date(ts);
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		day: d.getUTCDate(),
		hour: d.getUTCHours(),
		minute: d.getUTCMinutes(),
		second: d.getUTCSeconds(),
		millisecond: d.getUTCMilliseconds()
	};
}
function objToTS(obj, offset$1, zone) {
	return fixOffset(objToLocalTS(obj), offset$1, zone);
}
function adjustTime(inst, dur) {
	const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = {
		...inst.c,
		year,
		month,
		day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
	}, millisToAdd = Duration.fromObject({
		years: dur.years - Math.trunc(dur.years),
		quarters: dur.quarters - Math.trunc(dur.quarters),
		months: dur.months - Math.trunc(dur.months),
		weeks: dur.weeks - Math.trunc(dur.weeks),
		days: dur.days - Math.trunc(dur.days),
		hours: dur.hours,
		minutes: dur.minutes,
		seconds: dur.seconds,
		milliseconds: dur.milliseconds
	}).as("milliseconds"), localTS = objToLocalTS(c);
	let [ts, o] = fixOffset(localTS, oPre, inst.zone);
	if (millisToAdd !== 0) {
		ts += millisToAdd;
		o = inst.zone.offset(ts);
	}
	return {
		ts,
		o
	};
}
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
	const { setZone, zone } = opts;
	if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
		const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
			...opts,
			zone: interpretationZone,
			specificOffset
		});
		return setZone ? inst : inst.setZone(zone);
	} else return DateTime.invalid(new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`));
}
function toTechFormat(dt, format, allowZ = true) {
	return dt.isValid ? Formatter.create(Locale.create("en-US"), {
		allowZ,
		forceSimple: true
	}).formatDateTimeFromString(dt, format) : null;
}
function toISODate(o, extended) {
	const longFormat = o.c.year > 9999 || o.c.year < 0;
	let c = "";
	if (longFormat && o.c.year >= 0) c += "+";
	c += padStart(o.c.year, longFormat ? 6 : 4);
	if (extended) {
		c += "-";
		c += padStart(o.c.month);
		c += "-";
		c += padStart(o.c.day);
	} else {
		c += padStart(o.c.month);
		c += padStart(o.c.day);
	}
	return c;
}
function toISOTime(o, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone) {
	let c = padStart(o.c.hour);
	if (extended) {
		c += ":";
		c += padStart(o.c.minute);
		if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) c += ":";
	} else c += padStart(o.c.minute);
	if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
		c += padStart(o.c.second);
		if (o.c.millisecond !== 0 || !suppressMilliseconds) {
			c += ".";
			c += padStart(o.c.millisecond, 3);
		}
	}
	if (includeOffset) if (o.isOffsetFixed && o.offset === 0 && !extendedZone) c += "Z";
else if (o.o < 0) {
		c += "-";
		c += padStart(Math.trunc(-o.o / 60));
		c += ":";
		c += padStart(Math.trunc(-o.o % 60));
	} else {
		c += "+";
		c += padStart(Math.trunc(o.o / 60));
		c += ":";
		c += padStart(Math.trunc(o.o % 60));
	}
	if (extendedZone) c += "[" + o.zone.ianaName + "]";
	return c;
}
const defaultUnitValues = {
	month: 1,
	day: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
}, defaultWeekUnitValues = {
	weekNumber: 1,
	weekday: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
}, defaultOrdinalUnitValues = {
	ordinal: 1,
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0
};
const orderedUnits = [
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
	"millisecond"
], orderedWeekUnits = [
	"weekYear",
	"weekNumber",
	"weekday",
	"hour",
	"minute",
	"second",
	"millisecond"
], orderedOrdinalUnits = [
	"year",
	"ordinal",
	"hour",
	"minute",
	"second",
	"millisecond"
];
function normalizeUnit(unit) {
	const normalized = {
		year: "year",
		years: "year",
		month: "month",
		months: "month",
		day: "day",
		days: "day",
		hour: "hour",
		hours: "hour",
		minute: "minute",
		minutes: "minute",
		quarter: "quarter",
		quarters: "quarter",
		second: "second",
		seconds: "second",
		millisecond: "millisecond",
		milliseconds: "millisecond",
		weekday: "weekday",
		weekdays: "weekday",
		weeknumber: "weekNumber",
		weeksnumber: "weekNumber",
		weeknumbers: "weekNumber",
		weekyear: "weekYear",
		weekyears: "weekYear",
		ordinal: "ordinal"
	}[unit.toLowerCase()];
	if (!normalized) throw new InvalidUnitError(unit);
	return normalized;
}
function normalizeUnitWithLocalWeeks(unit) {
	switch (unit.toLowerCase()) {
		case "localweekday":
		case "localweekdays": return "localWeekday";
		case "localweeknumber":
		case "localweeknumbers": return "localWeekNumber";
		case "localweekyear":
		case "localweekyears": return "localWeekYear";
		default: return normalizeUnit(unit);
	}
}
function quickDT(obj, opts) {
	const zone = normalizeZone(opts.zone, Settings.defaultZone), loc = Locale.fromObject(opts), tsNow = Settings.now();
	let ts, o;
	if (!isUndefined(obj.year)) {
		for (const u of orderedUnits) if (isUndefined(obj[u])) obj[u] = defaultUnitValues[u];
		const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
		if (invalid) return DateTime.invalid(invalid);
		const offsetProvis = zone.offset(tsNow);
		[ts, o] = objToTS(obj, offsetProvis, zone);
	} else ts = tsNow;
	return new DateTime({
		ts,
		zone,
		loc,
		o
	});
}
function diffRelative(start, end, opts) {
	const round = isUndefined(opts.round) ? true : opts.round, format = (c, unit) => {
		c = roundTo(c, round || opts.calendary ? 0 : 2, true);
		const formatter = end.loc.clone(opts).relFormatter(opts);
		return formatter.format(c, unit);
	}, differ = (unit) => {
		if (opts.calendary) if (!end.hasSame(start, unit)) return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
else return 0;
else return end.diff(start, unit).get(unit);
	};
	if (opts.unit) return format(differ(opts.unit), opts.unit);
	for (const unit of opts.units) {
		const count = differ(unit);
		if (Math.abs(count) >= 1) return format(count, unit);
	}
	return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}
function lastOpts(argList) {
	let opts = {}, args;
	if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
		opts = argList[argList.length - 1];
		args = Array.from(argList).slice(0, argList.length - 1);
	} else args = Array.from(argList);
	return [opts, args];
}
var DateTime = class DateTime {
	/**
	* @access private
	*/
	constructor(config) {
		const zone = config.zone || Settings.defaultZone;
		let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
		/**
		* @access private
		*/
		this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
		let c = null, o = null;
		if (!invalid) {
			const unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);
			if (unchanged) [c, o] = [config.old.c, config.old.o];
else {
				const ot = zone.offset(this.ts);
				c = tsToObj(this.ts, ot);
				invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
				c = invalid ? null : c;
				o = invalid ? null : ot;
			}
		}
		/**
		* @access private
		*/
		this._zone = zone;
		/**
		* @access private
		*/
		this.loc = config.loc || Locale.create();
		/**
		* @access private
		*/
		this.invalid = invalid;
		/**
		* @access private
		*/
		this.weekData = null;
		/**
		* @access private
		*/
		this.localWeekData = null;
		/**
		* @access private
		*/
		this.c = c;
		/**
		* @access private
		*/
		this.o = o;
		/**
		* @access private
		*/
		this.isLuxonDateTime = true;
	}
	/**
	* Create a DateTime for the current instant, in the system's time zone.
	*
	* Use Settings to override these default values if needed.
	* @example DateTime.now().toISO() //~> now in the ISO format
	* @return {DateTime}
	*/
	static now() {
		return new DateTime({});
	}
	/**
	* Create a local DateTime
	* @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
	* @param {number} [month=1] - The month, 1-indexed
	* @param {number} [day=1] - The day of the month, 1-indexed
	* @param {number} [hour=0] - The hour of the day, in 24-hour time
	* @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
	* @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
	* @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
	* @example DateTime.local()                                  //~> now
	* @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
	* @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
	* @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
	* @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
	* @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
	* @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
	* @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
	* @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
	* @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
	* @return {DateTime}
	*/
	static local() {
		const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
		return quickDT({
			year,
			month,
			day,
			hour,
			minute,
			second,
			millisecond
		}, opts);
	}
	/**
	* Create a DateTime in UTC
	* @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
	* @param {number} [month=1] - The month, 1-indexed
	* @param {number} [day=1] - The day of the month
	* @param {number} [hour=0] - The hour of the day, in 24-hour time
	* @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
	* @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
	* @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
	* @param {Object} options - configuration options for the DateTime
	* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
	* @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
	* @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
	* @example DateTime.utc()                                              //~> now
	* @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
	* @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
	* @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
	* @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
	* @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
	* @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
	* @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
	* @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
	* @return {DateTime}
	*/
	static utc() {
		const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
		opts.zone = FixedOffsetZone.utcInstance;
		return quickDT({
			year,
			month,
			day,
			hour,
			minute,
			second,
			millisecond
		}, opts);
	}
	/**
	* Create a DateTime from a JavaScript Date object. Uses the default zone.
	* @param {Date} date - a JavaScript Date object
	* @param {Object} options - configuration options for the DateTime
	* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
	* @return {DateTime}
	*/
	static fromJSDate(date, options = {}) {
		const ts = isDate(date) ? date.valueOf() : NaN;
		if (Number.isNaN(ts)) return DateTime.invalid("invalid input");
		const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
		if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
		return new DateTime({
			ts,
			zone: zoneToUse,
			loc: Locale.fromObject(options)
		});
	}
	/**
	* Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
	* @param {number} milliseconds - a number of milliseconds since 1970 UTC
	* @param {Object} options - configuration options for the DateTime
	* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
	* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
	* @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
	* @return {DateTime}
	*/
	static fromMillis(milliseconds, options = {}) {
		if (!isNumber(milliseconds)) throw new InvalidArgumentError(`fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`);
else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) return DateTime.invalid("Timestamp out of range");
else return new DateTime({
			ts: milliseconds,
			zone: normalizeZone(options.zone, Settings.defaultZone),
			loc: Locale.fromObject(options)
		});
	}
	/**
	* Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
	* @param {number} seconds - a number of seconds since 1970 UTC
	* @param {Object} options - configuration options for the DateTime
	* @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
	* @param {string} [options.locale] - a locale to set on the resulting DateTime instance
	* @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
	* @return {DateTime}
	*/
	static fromSeconds(seconds, options = {}) {
		if (!isNumber(seconds)) throw new InvalidArgumentError("fromSeconds requires a numerical input");
else return new DateTime({
			ts: seconds * 1e3,
			zone: normalizeZone(options.zone, Settings.defaultZone),
			loc: Locale.fromObject(options)
		});
	}
	/**
	* Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
	* @param {Object} obj - the object to create the DateTime from
	* @param {number} obj.year - a year, such as 1987
	* @param {number} obj.month - a month, 1-12
	* @param {number} obj.day - a day of the month, 1-31, depending on the month
	* @param {number} obj.ordinal - day of the year, 1-365 or 366
	* @param {number} obj.weekYear - an ISO week year
	* @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
	* @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
	* @param {number} obj.localWeekYear - a week year, according to the locale
	* @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
	* @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
	* @param {number} obj.hour - hour of the day, 0-23
	* @param {number} obj.minute - minute of the hour, 0-59
	* @param {number} obj.second - second of the minute, 0-59
	* @param {number} obj.millisecond - millisecond of the second, 0-999
	* @param {Object} opts - options for creating this DateTime
	* @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
	* @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
	* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
	* @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
	* @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
	* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
	* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
	* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
	* @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
	* @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
	* @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
	* @return {DateTime}
	*/
	static fromObject(obj, opts = {}) {
		obj = obj || {};
		const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
		if (!zoneToUse.isValid) return DateTime.invalid(unsupportedZone(zoneToUse));
		const loc = Locale.fromObject(opts);
		const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
		const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
		const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
		if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
		if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
		const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
		let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
		if (useWeekData) {
			units = orderedWeekUnits;
			defaultValues = defaultWeekUnitValues;
			objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
		} else if (containsOrdinal) {
			units = orderedOrdinalUnits;
			defaultValues = defaultOrdinalUnitValues;
			objNow = gregorianToOrdinal(objNow);
		} else {
			units = orderedUnits;
			defaultValues = defaultUnitValues;
		}
		let foundFirst = false;
		for (const u of units) {
			const v = normalized[u];
			if (!isUndefined(v)) foundFirst = true;
else if (foundFirst) normalized[u] = defaultValues[u];
else normalized[u] = objNow[u];
		}
		const higherOrderInvalid = useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized), invalid = higherOrderInvalid || hasInvalidTimeData(normalized);
		if (invalid) return DateTime.invalid(invalid);
		const gregorian = useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, [tsFinal, offsetFinal] = objToTS(gregorian, offsetProvis, zoneToUse), inst = new DateTime({
			ts: tsFinal,
			zone: zoneToUse,
			o: offsetFinal,
			loc
		});
		if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) return DateTime.invalid("mismatched weekday", `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`);
		return inst;
	}
	/**
	* Create a DateTime from an ISO 8601 string
	* @param {string} text - the ISO string
	* @param {Object} opts - options to affect the creation
	* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
	* @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
	* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
	* @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
	* @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
	* @example DateTime.fromISO('2016-05-25T09:08:34.123')
	* @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
	* @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
	* @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
	* @example DateTime.fromISO('2016-W05-4')
	* @return {DateTime}
	*/
	static fromISO(text, opts = {}) {
		const [vals, parsedZone] = parseISODate(text);
		return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
	}
	/**
	* Create a DateTime from an RFC 2822 string
	* @param {string} text - the RFC 2822 string
	* @param {Object} opts - options to affect the creation
	* @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
	* @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
	* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
	* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
	* @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
	* @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
	* @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
	* @return {DateTime}
	*/
	static fromRFC2822(text, opts = {}) {
		const [vals, parsedZone] = parseRFC2822Date(text);
		return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
	}
	/**
	* Create a DateTime from an HTTP header date
	* @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
	* @param {string} text - the HTTP header date
	* @param {Object} opts - options to affect the creation
	* @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
	* @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
	* @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
	* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
	* @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
	* @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
	* @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
	* @return {DateTime}
	*/
	static fromHTTP(text, opts = {}) {
		const [vals, parsedZone] = parseHTTPDate(text);
		return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
	}
	/**
	* Create a DateTime from an input string and format string.
	* Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
	* @param {string} text - the string to parse
	* @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
	* @param {Object} opts - options to affect the creation
	* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
	* @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
	* @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
	* @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
	* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @return {DateTime}
	*/
	static fromFormat(text, fmt, opts = {}) {
		if (isUndefined(text) || isUndefined(fmt)) throw new InvalidArgumentError("fromFormat requires an input string and a format");
		const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		}), [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
		if (invalid) return DateTime.invalid(invalid);
else return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
	}
	/**
	* @deprecated use fromFormat instead
	*/
	static fromString(text, fmt, opts = {}) {
		return DateTime.fromFormat(text, fmt, opts);
	}
	/**
	* Create a DateTime from a SQL date, time, or datetime
	* Defaults to en-US if no locale has been specified, regardless of the system's locale
	* @param {string} text - the string to parse
	* @param {Object} opts - options to affect the creation
	* @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
	* @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
	* @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
	* @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
	* @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
	* @example DateTime.fromSQL('2017-05-15')
	* @example DateTime.fromSQL('2017-05-15 09:12:34')
	* @example DateTime.fromSQL('2017-05-15 09:12:34.342')
	* @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
	* @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
	* @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
	* @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
	* @example DateTime.fromSQL('09:12:34.342')
	* @return {DateTime}
	*/
	static fromSQL(text, opts = {}) {
		const [vals, parsedZone] = parseSQL(text);
		return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
	}
	/**
	* Create an invalid DateTime.
	* @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
	* @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
	* @return {DateTime}
	*/
	static invalid(reason, explanation = null) {
		if (!reason) throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
		const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
		if (Settings.throwOnInvalid) throw new InvalidDateTimeError(invalid);
else return new DateTime({ invalid });
	}
	/**
	* Check if an object is an instance of DateTime. Works across context boundaries
	* @param {object} o
	* @return {boolean}
	*/
	static isDateTime(o) {
		return o && o.isLuxonDateTime || false;
	}
	/**
	* Produce the format string for a set of options
	* @param formatOpts
	* @param localeOpts
	* @returns {string}
	*/
	static parseFormatForOpts(formatOpts, localeOpts = {}) {
		const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
		return !tokenList ? null : tokenList.map((t) => t ? t.val : null).join("");
	}
	/**
	* Produce the the fully expanded format token for the locale
	* Does NOT quote characters, so quoted tokens will not round trip correctly
	* @param fmt
	* @param localeOpts
	* @returns {string}
	*/
	static expandFormat(fmt, localeOpts = {}) {
		const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
		return expanded.map((t) => t.val).join("");
	}
	/**
	* Get the value of unit.
	* @param {string} unit - a unit such as 'minute' or 'day'
	* @example DateTime.local(2017, 7, 4).get('month'); //=> 7
	* @example DateTime.local(2017, 7, 4).get('day'); //=> 4
	* @return {number}
	*/
	get(unit) {
		return this[unit];
	}
	/**
	* Returns whether the DateTime is valid. Invalid DateTimes occur when:
	* * The DateTime was created from invalid calendar information, such as the 13th month or February 30
	* * The DateTime was created by an operation on another invalid date
	* @type {boolean}
	*/
	get isValid() {
		return this.invalid === null;
	}
	/**
	* Returns an error code if this DateTime is invalid, or null if the DateTime is valid
	* @type {string}
	*/
	get invalidReason() {
		return this.invalid ? this.invalid.reason : null;
	}
	/**
	* Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
	* @type {string}
	*/
	get invalidExplanation() {
		return this.invalid ? this.invalid.explanation : null;
	}
	/**
	* Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
	*
	* @type {string}
	*/
	get locale() {
		return this.isValid ? this.loc.locale : null;
	}
	/**
	* Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
	*
	* @type {string}
	*/
	get numberingSystem() {
		return this.isValid ? this.loc.numberingSystem : null;
	}
	/**
	* Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
	*
	* @type {string}
	*/
	get outputCalendar() {
		return this.isValid ? this.loc.outputCalendar : null;
	}
	/**
	* Get the time zone associated with this DateTime.
	* @type {Zone}
	*/
	get zone() {
		return this._zone;
	}
	/**
	* Get the name of the time zone.
	* @type {string}
	*/
	get zoneName() {
		return this.isValid ? this.zone.name : null;
	}
	/**
	* Get the year
	* @example DateTime.local(2017, 5, 25).year //=> 2017
	* @type {number}
	*/
	get year() {
		return this.isValid ? this.c.year : NaN;
	}
	/**
	* Get the quarter
	* @example DateTime.local(2017, 5, 25).quarter //=> 2
	* @type {number}
	*/
	get quarter() {
		return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
	}
	/**
	* Get the month (1-12).
	* @example DateTime.local(2017, 5, 25).month //=> 5
	* @type {number}
	*/
	get month() {
		return this.isValid ? this.c.month : NaN;
	}
	/**
	* Get the day of the month (1-30ish).
	* @example DateTime.local(2017, 5, 25).day //=> 25
	* @type {number}
	*/
	get day() {
		return this.isValid ? this.c.day : NaN;
	}
	/**
	* Get the hour of the day (0-23).
	* @example DateTime.local(2017, 5, 25, 9).hour //=> 9
	* @type {number}
	*/
	get hour() {
		return this.isValid ? this.c.hour : NaN;
	}
	/**
	* Get the minute of the hour (0-59).
	* @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
	* @type {number}
	*/
	get minute() {
		return this.isValid ? this.c.minute : NaN;
	}
	/**
	* Get the second of the minute (0-59).
	* @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
	* @type {number}
	*/
	get second() {
		return this.isValid ? this.c.second : NaN;
	}
	/**
	* Get the millisecond of the second (0-999).
	* @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
	* @type {number}
	*/
	get millisecond() {
		return this.isValid ? this.c.millisecond : NaN;
	}
	/**
	* Get the week year
	* @see https://en.wikipedia.org/wiki/ISO_week_date
	* @example DateTime.local(2014, 12, 31).weekYear //=> 2015
	* @type {number}
	*/
	get weekYear() {
		return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
	}
	/**
	* Get the week number of the week year (1-52ish).
	* @see https://en.wikipedia.org/wiki/ISO_week_date
	* @example DateTime.local(2017, 5, 25).weekNumber //=> 21
	* @type {number}
	*/
	get weekNumber() {
		return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
	}
	/**
	* Get the day of the week.
	* 1 is Monday and 7 is Sunday
	* @see https://en.wikipedia.org/wiki/ISO_week_date
	* @example DateTime.local(2014, 11, 31).weekday //=> 4
	* @type {number}
	*/
	get weekday() {
		return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
	}
	/**
	* Returns true if this date is on a weekend according to the locale, false otherwise
	* @returns {boolean}
	*/
	get isWeekend() {
		return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
	}
	/**
	* Get the day of the week according to the locale.
	* 1 is the first day of the week and 7 is the last day of the week.
	* If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
	* @returns {number}
	*/
	get localWeekday() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
	}
	/**
	* Get the week number of the week year according to the locale. Different locales assign week numbers differently,
	* because the week can start on different days of the week (see localWeekday) and because a different number of days
	* is required for a week to count as the first week of a year.
	* @returns {number}
	*/
	get localWeekNumber() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
	}
	/**
	* Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
	* differently, see localWeekNumber.
	* @returns {number}
	*/
	get localWeekYear() {
		return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
	}
	/**
	* Get the ordinal (meaning the day of the year)
	* @example DateTime.local(2017, 5, 25).ordinal //=> 145
	* @type {number|DateTime}
	*/
	get ordinal() {
		return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
	}
	/**
	* Get the human readable short month name, such as 'Oct'.
	* Defaults to the system's locale if no locale has been specified
	* @example DateTime.local(2017, 10, 30).monthShort //=> Oct
	* @type {string}
	*/
	get monthShort() {
		return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
	}
	/**
	* Get the human readable long month name, such as 'October'.
	* Defaults to the system's locale if no locale has been specified
	* @example DateTime.local(2017, 10, 30).monthLong //=> October
	* @type {string}
	*/
	get monthLong() {
		return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
	}
	/**
	* Get the human readable short weekday, such as 'Mon'.
	* Defaults to the system's locale if no locale has been specified
	* @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
	* @type {string}
	*/
	get weekdayShort() {
		return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
	}
	/**
	* Get the human readable long weekday, such as 'Monday'.
	* Defaults to the system's locale if no locale has been specified
	* @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
	* @type {string}
	*/
	get weekdayLong() {
		return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
	}
	/**
	* Get the UTC offset of this DateTime in minutes
	* @example DateTime.now().offset //=> -240
	* @example DateTime.utc().offset //=> 0
	* @type {number}
	*/
	get offset() {
		return this.isValid ? +this.o : NaN;
	}
	/**
	* Get the short human name for the zone's current offset, for example "EST" or "EDT".
	* Defaults to the system's locale if no locale has been specified
	* @type {string}
	*/
	get offsetNameShort() {
		if (this.isValid) return this.zone.offsetName(this.ts, {
			format: "short",
			locale: this.locale
		});
else return null;
	}
	/**
	* Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
	* Defaults to the system's locale if no locale has been specified
	* @type {string}
	*/
	get offsetNameLong() {
		if (this.isValid) return this.zone.offsetName(this.ts, {
			format: "long",
			locale: this.locale
		});
else return null;
	}
	/**
	* Get whether this zone's offset ever changes, as in a DST.
	* @type {boolean}
	*/
	get isOffsetFixed() {
		return this.isValid ? this.zone.isUniversal : null;
	}
	/**
	* Get whether the DateTime is in a DST.
	* @type {boolean}
	*/
	get isInDST() {
		if (this.isOffsetFixed) return false;
else return this.offset > this.set({
			month: 1,
			day: 1
		}).offset || this.offset > this.set({ month: 5 }).offset;
	}
	/**
	* Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
	* in this DateTime's zone. During DST changes local time can be ambiguous, for example
	* `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
	* This method will return both possible DateTimes if this DateTime's local time is ambiguous.
	* @returns {DateTime[]}
	*/
	getPossibleOffsets() {
		if (!this.isValid || this.isOffsetFixed) return [this];
		const dayMs = 864e5;
		const minuteMs = 6e4;
		const localTS = objToLocalTS(this.c);
		const oEarlier = this.zone.offset(localTS - dayMs);
		const oLater = this.zone.offset(localTS + dayMs);
		const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
		const o2 = this.zone.offset(localTS - oLater * minuteMs);
		if (o1 === o2) return [this];
		const ts1 = localTS - o1 * minuteMs;
		const ts2 = localTS - o2 * minuteMs;
		const c1 = tsToObj(ts1, o1);
		const c2 = tsToObj(ts2, o2);
		if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) return [clone(this, { ts: ts1 }), clone(this, { ts: ts2 })];
		return [this];
	}
	/**
	* Returns true if this DateTime is in a leap year, false otherwise
	* @example DateTime.local(2016).isInLeapYear //=> true
	* @example DateTime.local(2013).isInLeapYear //=> false
	* @type {boolean}
	*/
	get isInLeapYear() {
		return isLeapYear(this.year);
	}
	/**
	* Returns the number of days in this DateTime's month
	* @example DateTime.local(2016, 2).daysInMonth //=> 29
	* @example DateTime.local(2016, 3).daysInMonth //=> 31
	* @type {number}
	*/
	get daysInMonth() {
		return daysInMonth(this.year, this.month);
	}
	/**
	* Returns the number of days in this DateTime's year
	* @example DateTime.local(2016).daysInYear //=> 366
	* @example DateTime.local(2013).daysInYear //=> 365
	* @type {number}
	*/
	get daysInYear() {
		return this.isValid ? daysInYear(this.year) : NaN;
	}
	/**
	* Returns the number of weeks in this DateTime's year
	* @see https://en.wikipedia.org/wiki/ISO_week_date
	* @example DateTime.local(2004).weeksInWeekYear //=> 53
	* @example DateTime.local(2013).weeksInWeekYear //=> 52
	* @type {number}
	*/
	get weeksInWeekYear() {
		return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
	}
	/**
	* Returns the number of weeks in this DateTime's local week year
	* @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
	* @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
	* @type {number}
	*/
	get weeksInLocalWeekYear() {
		return this.isValid ? weeksInWeekYear(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
	}
	/**
	* Returns the resolved Intl options for this DateTime.
	* This is useful in understanding the behavior of formatting methods
	* @param {Object} opts - the same options as toLocaleString
	* @return {Object}
	*/
	resolvedLocaleOptions(opts = {}) {
		const { locale, numberingSystem, calendar } = Formatter.create(this.loc.clone(opts), opts).resolvedOptions(this);
		return {
			locale,
			numberingSystem,
			outputCalendar: calendar
		};
	}
	/**
	* "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
	*
	* Equivalent to {@link DateTime#setZone}('utc')
	* @param {number} [offset=0] - optionally, an offset from UTC in minutes
	* @param {Object} [opts={}] - options to pass to `setZone()`
	* @return {DateTime}
	*/
	toUTC(offset$1 = 0, opts = {}) {
		return this.setZone(FixedOffsetZone.instance(offset$1), opts);
	}
	/**
	* "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
	*
	* Equivalent to `setZone('local')`
	* @return {DateTime}
	*/
	toLocal() {
		return this.setZone(Settings.defaultZone);
	}
	/**
	* "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
	*
	* By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
	* @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
	* @param {Object} opts - options
	* @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
	* @return {DateTime}
	*/
	setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
		zone = normalizeZone(zone, Settings.defaultZone);
		if (zone.equals(this.zone)) return this;
else if (!zone.isValid) return DateTime.invalid(unsupportedZone(zone));
else {
			let newTS = this.ts;
			if (keepLocalTime || keepCalendarTime) {
				const offsetGuess = zone.offset(this.ts);
				const asObj = this.toObject();
				[newTS] = objToTS(asObj, offsetGuess, zone);
			}
			return clone(this, {
				ts: newTS,
				zone
			});
		}
	}
	/**
	* "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
	* @param {Object} properties - the properties to set
	* @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
	* @return {DateTime}
	*/
	reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
		const loc = this.loc.clone({
			locale,
			numberingSystem,
			outputCalendar
		});
		return clone(this, { loc });
	}
	/**
	* "Set" the locale. Returns a newly-constructed DateTime.
	* Just a convenient alias for reconfigure({ locale })
	* @example DateTime.local(2017, 5, 25).setLocale('en-GB')
	* @return {DateTime}
	*/
	setLocale(locale) {
		return this.reconfigure({ locale });
	}
	/**
	* "Set" the values of specified units. Returns a newly-constructed DateTime.
	* You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
	*
	* This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
	* They cannot be mixed with ISO-week units like `weekday`.
	* @param {Object} values - a mapping of units to numbers
	* @example dt.set({ year: 2017 })
	* @example dt.set({ hour: 8, minute: 30 })
	* @example dt.set({ weekday: 5 })
	* @example dt.set({ year: 2005, ordinal: 234 })
	* @return {DateTime}
	*/
	set(values) {
		if (!this.isValid) return this;
		const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
		const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
		const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
		if ((containsGregor || containsOrdinal) && definiteWeekDef) throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
		if (containsGregorMD && containsOrdinal) throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
		let mixed;
		if (settingWeekStuff) mixed = weekToGregorian({
			...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek),
			...normalized
		}, minDaysInFirstWeek, startOfWeek);
else if (!isUndefined(normalized.ordinal)) mixed = ordinalToGregorian({
			...gregorianToOrdinal(this.c),
			...normalized
		});
else {
			mixed = {
				...this.toObject(),
				...normalized
			};
			if (isUndefined(normalized.day)) mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
		}
		const [ts, o] = objToTS(mixed, this.o, this.zone);
		return clone(this, {
			ts,
			o
		});
	}
	/**
	* Add a period of time to this DateTime and return the resulting DateTime
	*
	* Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
	* @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
	* @example DateTime.now().plus(123) //~> in 123 milliseconds
	* @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
	* @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
	* @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
	* @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
	* @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
	* @return {DateTime}
	*/
	plus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration);
		return clone(this, adjustTime(this, dur));
	}
	/**
	* Subtract a period of time to this DateTime and return the resulting DateTime
	* See {@link DateTime#plus}
	* @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
	@return {DateTime}
	*/
	minus(duration) {
		if (!this.isValid) return this;
		const dur = Duration.fromDurationLike(duration).negate();
		return clone(this, adjustTime(this, dur));
	}
	/**
	* "Set" this DateTime to the beginning of a unit of time.
	* @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
	* @param {Object} opts - options
	* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
	* @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
	* @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
	* @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
	* @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
	* @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
	* @return {DateTime}
	*/
	startOf(unit, { useLocaleWeeks = false } = {}) {
		if (!this.isValid) return this;
		const o = {}, normalizedUnit = Duration.normalizeUnit(unit);
		switch (normalizedUnit) {
			case "years": o.month = 1;
			case "quarters":
			case "months": o.day = 1;
			case "weeks":
			case "days": o.hour = 0;
			case "hours": o.minute = 0;
			case "minutes": o.second = 0;
			case "seconds":
				o.millisecond = 0;
				break;
		}
		if (normalizedUnit === "weeks") if (useLocaleWeeks) {
			const startOfWeek = this.loc.getStartOfWeek();
			const { weekday } = this;
			if (weekday < startOfWeek) o.weekNumber = this.weekNumber - 1;
			o.weekday = startOfWeek;
		} else o.weekday = 1;
		if (normalizedUnit === "quarters") {
			const q = Math.ceil(this.month / 3);
			o.month = (q - 1) * 3 + 1;
		}
		return this.set(o);
	}
	/**
	* "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
	* @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
	* @param {Object} opts - options
	* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
	* @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
	* @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
	* @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
	* @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
	* @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
	* @return {DateTime}
	*/
	endOf(unit, opts) {
		return this.isValid ? this.plus({ [unit]: 1 }).startOf(unit, opts).minus(1) : this;
	}
	/**
	* Returns a string representation of this DateTime formatted according to the specified format string.
	* **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
	* Defaults to en-US if no locale has been specified, regardless of the system's locale.
	* @param {string} fmt - the format string
	* @param {Object} opts - opts to override the configuration options on this DateTime
	* @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
	* @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
	* @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
	* @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
	* @return {string}
	*/
	toFormat(fmt, opts = {}) {
		return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
	}
	/**
	* Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
	* The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
	* of the DateTime in the assigned locale.
	* Defaults to the system's locale if no locale has been specified
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
	* @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
	* @param {Object} opts - opts to override the configuration options on this DateTime
	* @example DateTime.now().toLocaleString(); //=> 4/20/2017
	* @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
	* @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
	* @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
	* @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
	* @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
	* @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
	* @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
	* @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
	* @return {string}
	*/
	toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
		return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
	}
	/**
	* Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
	* Defaults to the system's locale if no locale has been specified
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
	* @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
	* @example DateTime.now().toLocaleParts(); //=> [
	*                                   //=>   { type: 'day', value: '25' },
	*                                   //=>   { type: 'literal', value: '/' },
	*                                   //=>   { type: 'month', value: '05' },
	*                                   //=>   { type: 'literal', value: '/' },
	*                                   //=>   { type: 'year', value: '1982' }
	*                                   //=> ]
	*/
	toLocaleParts(opts = {}) {
		return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
	}
	/**
	* Returns an ISO 8601-compliant string representation of this DateTime
	* @param {Object} opts - options
	* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
	* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
	* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
	* @param {boolean} [opts.extendedZone=false] - add the time zone format extension
	* @param {string} [opts.format='extended'] - choose between the basic and extended format
	* @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
	* @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
	* @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
	* @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
	* @return {string}
	*/
	toISO({ format = "extended", suppressSeconds = false, suppressMilliseconds = false, includeOffset = true, extendedZone = false } = {}) {
		if (!this.isValid) return null;
		const ext = format === "extended";
		let c = toISODate(this, ext);
		c += "T";
		c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
		return c;
	}
	/**
	* Returns an ISO 8601-compliant string representation of this DateTime's date component
	* @param {Object} opts - options
	* @param {string} [opts.format='extended'] - choose between the basic and extended format
	* @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
	* @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
	* @return {string}
	*/
	toISODate({ format = "extended" } = {}) {
		if (!this.isValid) return null;
		return toISODate(this, format === "extended");
	}
	/**
	* Returns an ISO 8601-compliant string representation of this DateTime's week date
	* @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
	* @return {string}
	*/
	toISOWeekDate() {
		return toTechFormat(this, "kkkk-'W'WW-c");
	}
	/**
	* Returns an ISO 8601-compliant string representation of this DateTime's time component
	* @param {Object} opts - options
	* @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
	* @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
	* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
	* @param {boolean} [opts.extendedZone=true] - add the time zone format extension
	* @param {boolean} [opts.includePrefix=false] - include the `T` prefix
	* @param {string} [opts.format='extended'] - choose between the basic and extended format
	* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
	* @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
	* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
	* @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
	* @return {string}
	*/
	toISOTime({ suppressMilliseconds = false, suppressSeconds = false, includeOffset = true, includePrefix = false, extendedZone = false, format = "extended" } = {}) {
		if (!this.isValid) return null;
		let c = includePrefix ? "T" : "";
		return c + toISOTime(this, format === "extended", suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
	}
	/**
	* Returns an RFC 2822-compatible string representation of this DateTime
	* @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
	* @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
	* @return {string}
	*/
	toRFC2822() {
		return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
	}
	/**
	* Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
	* Specifically, the string conforms to RFC 1123.
	* @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
	* @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
	* @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
	* @return {string}
	*/
	toHTTP() {
		return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
	}
	/**
	* Returns a string representation of this DateTime appropriate for use in SQL Date
	* @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
	* @return {string}
	*/
	toSQLDate() {
		if (!this.isValid) return null;
		return toISODate(this, true);
	}
	/**
	* Returns a string representation of this DateTime appropriate for use in SQL Time
	* @param {Object} opts - options
	* @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
	* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
	* @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
	* @example DateTime.utc().toSQL() //=> '05:15:16.345'
	* @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
	* @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
	* @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
	* @return {string}
	*/
	toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
		let fmt = "HH:mm:ss.SSS";
		if (includeZone || includeOffset) {
			if (includeOffsetSpace) fmt += " ";
			if (includeZone) fmt += "z";
else if (includeOffset) fmt += "ZZ";
		}
		return toTechFormat(this, fmt, true);
	}
	/**
	* Returns a string representation of this DateTime appropriate for use in SQL DateTime
	* @param {Object} opts - options
	* @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
	* @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
	* @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
	* @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
	* @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
	* @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
	* @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
	* @return {string}
	*/
	toSQL(opts = {}) {
		if (!this.isValid) return null;
		return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
	}
	/**
	* Returns a string representation of this DateTime appropriate for debugging
	* @return {string}
	*/
	toString() {
		return this.isValid ? this.toISO() : INVALID;
	}
	/**
	* Returns a string representation of this DateTime appropriate for the REPL.
	* @return {string}
	*/
	[Symbol.for("nodejs.util.inspect.custom")]() {
		if (this.isValid) return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
else return `DateTime { Invalid, reason: ${this.invalidReason} }`;
	}
	/**
	* Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
	* @return {number}
	*/
	valueOf() {
		return this.toMillis();
	}
	/**
	* Returns the epoch milliseconds of this DateTime.
	* @return {number}
	*/
	toMillis() {
		return this.isValid ? this.ts : NaN;
	}
	/**
	* Returns the epoch seconds of this DateTime.
	* @return {number}
	*/
	toSeconds() {
		return this.isValid ? this.ts / 1e3 : NaN;
	}
	/**
	* Returns the epoch seconds (as a whole number) of this DateTime.
	* @return {number}
	*/
	toUnixInteger() {
		return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
	}
	/**
	* Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
	* @return {string}
	*/
	toJSON() {
		return this.toISO();
	}
	/**
	* Returns a BSON serializable equivalent to this DateTime.
	* @return {Date}
	*/
	toBSON() {
		return this.toJSDate();
	}
	/**
	* Returns a JavaScript object with this DateTime's year, month, day, and so on.
	* @param opts - options for generating the object
	* @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
	* @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
	* @return {Object}
	*/
	toObject(opts = {}) {
		if (!this.isValid) return {};
		const base = { ...this.c };
		if (opts.includeConfig) {
			base.outputCalendar = this.outputCalendar;
			base.numberingSystem = this.loc.numberingSystem;
			base.locale = this.loc.locale;
		}
		return base;
	}
	/**
	* Returns a JavaScript Date equivalent to this DateTime.
	* @return {Date}
	*/
	toJSDate() {
		return new Date(this.isValid ? this.ts : NaN);
	}
	/**
	* Return the difference between two DateTimes as a Duration.
	* @param {DateTime} otherDateTime - the DateTime to compare this one to
	* @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
	* @param {Object} opts - options that affect the creation of the Duration
	* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
	* @example
	* var i1 = DateTime.fromISO('1982-05-25T09:45'),
	*     i2 = DateTime.fromISO('1983-10-14T10:30');
	* i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
	* i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
	* i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
	* i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
	* @return {Duration}
	*/
	diff(otherDateTime, unit = "milliseconds", opts = {}) {
		if (!this.isValid || !otherDateTime.isValid) return Duration.invalid("created by diffing an invalid DateTime");
		const durOpts = {
			locale: this.locale,
			numberingSystem: this.numberingSystem,
			...opts
		};
		const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), earlier = otherIsLater ? this : otherDateTime, later = otherIsLater ? otherDateTime : this, diffed = diff(earlier, later, units, durOpts);
		return otherIsLater ? diffed.negate() : diffed;
	}
	/**
	* Return the difference between this DateTime and right now.
	* See {@link DateTime#diff}
	* @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
	* @param {Object} opts - options that affect the creation of the Duration
	* @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
	* @return {Duration}
	*/
	diffNow(unit = "milliseconds", opts = {}) {
		return this.diff(DateTime.now(), unit, opts);
	}
	/**
	* Return an Interval spanning between this DateTime and another DateTime
	* @param {DateTime} otherDateTime - the other end point of the Interval
	* @return {Interval}
	*/
	until(otherDateTime) {
		return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
	}
	/**
	* Return whether this DateTime is in the same unit of time as another DateTime.
	* Higher-order units must also be identical for this function to return `true`.
	* Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
	* @param {DateTime} otherDateTime - the other DateTime
	* @param {string} unit - the unit of time to check sameness on
	* @param {Object} opts - options
	* @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
	* @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
	* @return {boolean}
	*/
	hasSame(otherDateTime, unit, opts) {
		if (!this.isValid) return false;
		const inputMs = otherDateTime.valueOf();
		const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
		return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
	}
	/**
	* Equality check
	* Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
	* To compare just the millisecond values, use `+dt1 === +dt2`.
	* @param {DateTime} other - the other DateTime
	* @return {boolean}
	*/
	equals(other) {
		return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
	}
	/**
	* Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
	* platform supports Intl.RelativeTimeFormat. Rounds down by default.
	* @param {Object} options - options that affect the output
	* @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
	* @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
	* @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
	* @param {boolean} [options.round=true] - whether to round the numbers in the output.
	* @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
	* @param {string} options.locale - override the locale of this DateTime
	* @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
	* @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
	* @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
	* @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
	* @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
	* @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
	* @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
	*/
	toRelative(options = {}) {
		if (!this.isValid) return null;
		const base = options.base || DateTime.fromObject({}, { zone: this.zone }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
		let units = [
			"years",
			"months",
			"days",
			"hours",
			"minutes",
			"seconds"
		];
		let unit = options.unit;
		if (Array.isArray(options.unit)) {
			units = options.unit;
			unit = undefined;
		}
		return diffRelative(base, this.plus(padding), {
			...options,
			numeric: "always",
			units,
			unit
		});
	}
	/**
	* Returns a string representation of this date relative to today, such as "yesterday" or "next month".
	* Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
	* @param {Object} options - options that affect the output
	* @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
	* @param {string} options.locale - override the locale of this DateTime
	* @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
	* @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
	* @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
	* @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
	* @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
	* @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
	*/
	toRelativeCalendar(options = {}) {
		if (!this.isValid) return null;
		return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
			...options,
			numeric: "auto",
			units: [
				"years",
				"months",
				"days"
			],
			calendary: true
		});
	}
	/**
	* Return the min of several date times
	* @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
	* @return {DateTime} the min DateTime, or undefined if called with no argument
	*/
	static min(...dateTimes) {
		if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("min requires all arguments be DateTimes");
		return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
	}
	/**
	* Return the max of several date times
	* @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
	* @return {DateTime} the max DateTime, or undefined if called with no argument
	*/
	static max(...dateTimes) {
		if (!dateTimes.every(DateTime.isDateTime)) throw new InvalidArgumentError("max requires all arguments be DateTimes");
		return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
	}
	/**
	* Explain how a string would be parsed by fromFormat()
	* @param {string} text - the string to parse
	* @param {string} fmt - the format the string is expected to be in (see description)
	* @param {Object} options - options taken by fromFormat()
	* @return {Object}
	*/
	static fromFormatExplain(text, fmt, options = {}) {
		const { locale = null, numberingSystem = null } = options, localeToUse = Locale.fromOpts({
			locale,
			numberingSystem,
			defaultToEN: true
		});
		return explainFromTokens(localeToUse, text, fmt);
	}
	/**
	* @deprecated use fromFormatExplain instead
	*/
	static fromStringExplain(text, fmt, options = {}) {
		return DateTime.fromFormatExplain(text, fmt, options);
	}
	/**
	* {@link DateTime#toLocaleString} format like 10/14/1983
	* @type {Object}
	*/
	static get DATE_SHORT() {
		return DATE_SHORT;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
	* @type {Object}
	*/
	static get DATE_MED() {
		return DATE_MED;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
	* @type {Object}
	*/
	static get DATE_MED_WITH_WEEKDAY() {
		return DATE_MED_WITH_WEEKDAY;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'October 14, 1983'
	* @type {Object}
	*/
	static get DATE_FULL() {
		return DATE_FULL;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
	* @type {Object}
	*/
	static get DATE_HUGE() {
		return DATE_HUGE;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get TIME_SIMPLE() {
		return TIME_SIMPLE;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get TIME_WITH_SECONDS() {
		return TIME_WITH_SECONDS;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get TIME_WITH_SHORT_OFFSET() {
		return TIME_WITH_SHORT_OFFSET;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get TIME_WITH_LONG_OFFSET() {
		return TIME_WITH_LONG_OFFSET;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
	* @type {Object}
	*/
	static get TIME_24_SIMPLE() {
		return TIME_24_SIMPLE;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
	* @type {Object}
	*/
	static get TIME_24_WITH_SECONDS() {
		return TIME_24_WITH_SECONDS;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
	* @type {Object}
	*/
	static get TIME_24_WITH_SHORT_OFFSET() {
		return TIME_24_WITH_SHORT_OFFSET;
	}
	/**
	* {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
	* @type {Object}
	*/
	static get TIME_24_WITH_LONG_OFFSET() {
		return TIME_24_WITH_LONG_OFFSET;
	}
	/**
	* {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_SHORT() {
		return DATETIME_SHORT;
	}
	/**
	* {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_SHORT_WITH_SECONDS() {
		return DATETIME_SHORT_WITH_SECONDS;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_MED() {
		return DATETIME_MED;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_MED_WITH_SECONDS() {
		return DATETIME_MED_WITH_SECONDS;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_MED_WITH_WEEKDAY() {
		return DATETIME_MED_WITH_WEEKDAY;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_FULL() {
		return DATETIME_FULL;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_FULL_WITH_SECONDS() {
		return DATETIME_FULL_WITH_SECONDS;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_HUGE() {
		return DATETIME_HUGE;
	}
	/**
	* {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
	* @type {Object}
	*/
	static get DATETIME_HUGE_WITH_SECONDS() {
		return DATETIME_HUGE_WITH_SECONDS;
	}
};
/**
* @private
*/
function friendlyDateTime(dateTimeish) {
	if (DateTime.isDateTime(dateTimeish)) return dateTimeish;
else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) return DateTime.fromJSDate(dateTimeish);
else if (dateTimeish && typeof dateTimeish === "object") return DateTime.fromObject(dateTimeish);
else throw new InvalidArgumentError(`Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`);
}

//#endregion
export { DateTime, Duration, FixedOffsetZone, IANAZone, Interval };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHV4b24tY2h1bmsuanMiLCJuYW1lcyI6WyJzIiwib2Zmc2V0IiwiZGVmYXVsdFpvbmUiLCJuIiwiZm9ybWF0T2Zmc2V0IiwibWF0Y2giLCJsIiwiZSJdLCJzb3VyY2VzIjpbIi4uL2xpYnMvbHV4b24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGhlc2UgYXJlbid0IHJlYWxseSBwcml2YXRlLCBidXQgbm9yIGFyZSB0aGV5IHJlYWxseSB1c2VmdWwgdG8gZG9jdW1lbnRcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBMdXhvbkVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBJbnZhbGlkRGF0ZVRpbWVFcnJvciBleHRlbmRzIEx1eG9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBEYXRlVGltZTogJHtyZWFzb24udG9NZXNzYWdlKCl9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBJbnZhbGlkSW50ZXJ2YWxFcnJvciBleHRlbmRzIEx1eG9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBJbnRlcnZhbDogJHtyZWFzb24udG9NZXNzYWdlKCl9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBJbnZhbGlkRHVyYXRpb25FcnJvciBleHRlbmRzIEx1eG9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBEdXJhdGlvbjogJHtyZWFzb24udG9NZXNzYWdlKCl9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBDb25mbGljdGluZ1NwZWNpZmljYXRpb25FcnJvciBleHRlbmRzIEx1eG9uRXJyb3Ige31cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBJbnZhbGlkVW5pdEVycm9yIGV4dGVuZHMgTHV4b25FcnJvciB7XG4gIGNvbnN0cnVjdG9yKHVuaXQpIHtcbiAgICBzdXBlcihgSW52YWxpZCB1bml0ICR7dW5pdH1gKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIEludmFsaWRBcmd1bWVudEVycm9yIGV4dGVuZHMgTHV4b25FcnJvciB7fVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFpvbmVJc0Fic3RyYWN0RXJyb3IgZXh0ZW5kcyBMdXhvbkVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJab25lIGlzIGFuIGFic3RyYWN0IGNsYXNzXCIpO1xuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuXG5jb25zdCBuID0gXCJudW1lcmljXCIsXG4gIHMgPSBcInNob3J0XCIsXG4gIGwgPSBcImxvbmdcIjtcblxuY29uc3QgREFURV9TSE9SVCA9IHtcbiAgeWVhcjogbixcbiAgbW9udGg6IG4sXG4gIGRheTogbixcbn07XG5cbmNvbnN0IERBVEVfTUVEID0ge1xuICB5ZWFyOiBuLFxuICBtb250aDogcyxcbiAgZGF5OiBuLFxufTtcblxuY29uc3QgREFURV9NRURfV0lUSF9XRUVLREFZID0ge1xuICB5ZWFyOiBuLFxuICBtb250aDogcyxcbiAgZGF5OiBuLFxuICB3ZWVrZGF5OiBzLFxufTtcblxuY29uc3QgREFURV9GVUxMID0ge1xuICB5ZWFyOiBuLFxuICBtb250aDogbCxcbiAgZGF5OiBuLFxufTtcblxuY29uc3QgREFURV9IVUdFID0ge1xuICB5ZWFyOiBuLFxuICBtb250aDogbCxcbiAgZGF5OiBuLFxuICB3ZWVrZGF5OiBsLFxufTtcblxuY29uc3QgVElNRV9TSU1QTEUgPSB7XG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbn07XG5cbmNvbnN0IFRJTUVfV0lUSF9TRUNPTkRTID0ge1xuICBob3VyOiBuLFxuICBtaW51dGU6IG4sXG4gIHNlY29uZDogbixcbn07XG5cbmNvbnN0IFRJTUVfV0lUSF9TSE9SVF9PRkZTRVQgPSB7XG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgc2Vjb25kOiBuLFxuICB0aW1lWm9uZU5hbWU6IHMsXG59O1xuXG5jb25zdCBUSU1FX1dJVEhfTE9OR19PRkZTRVQgPSB7XG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgc2Vjb25kOiBuLFxuICB0aW1lWm9uZU5hbWU6IGwsXG59O1xuXG5jb25zdCBUSU1FXzI0X1NJTVBMRSA9IHtcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICBob3VyQ3ljbGU6IFwiaDIzXCIsXG59O1xuXG5jb25zdCBUSU1FXzI0X1dJVEhfU0VDT05EUyA9IHtcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICBzZWNvbmQ6IG4sXG4gIGhvdXJDeWNsZTogXCJoMjNcIixcbn07XG5cbmNvbnN0IFRJTUVfMjRfV0lUSF9TSE9SVF9PRkZTRVQgPSB7XG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgc2Vjb25kOiBuLFxuICBob3VyQ3ljbGU6IFwiaDIzXCIsXG4gIHRpbWVab25lTmFtZTogcyxcbn07XG5cbmNvbnN0IFRJTUVfMjRfV0lUSF9MT05HX09GRlNFVCA9IHtcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICBzZWNvbmQ6IG4sXG4gIGhvdXJDeWNsZTogXCJoMjNcIixcbiAgdGltZVpvbmVOYW1lOiBsLFxufTtcblxuY29uc3QgREFURVRJTUVfU0hPUlQgPSB7XG4gIHllYXI6IG4sXG4gIG1vbnRoOiBuLFxuICBkYXk6IG4sXG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbn07XG5cbmNvbnN0IERBVEVUSU1FX1NIT1JUX1dJVEhfU0VDT05EUyA9IHtcbiAgeWVhcjogbixcbiAgbW9udGg6IG4sXG4gIGRheTogbixcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICBzZWNvbmQ6IG4sXG59O1xuXG5jb25zdCBEQVRFVElNRV9NRUQgPSB7XG4gIHllYXI6IG4sXG4gIG1vbnRoOiBzLFxuICBkYXk6IG4sXG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbn07XG5cbmNvbnN0IERBVEVUSU1FX01FRF9XSVRIX1NFQ09ORFMgPSB7XG4gIHllYXI6IG4sXG4gIG1vbnRoOiBzLFxuICBkYXk6IG4sXG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgc2Vjb25kOiBuLFxufTtcblxuY29uc3QgREFURVRJTUVfTUVEX1dJVEhfV0VFS0RBWSA9IHtcbiAgeWVhcjogbixcbiAgbW9udGg6IHMsXG4gIGRheTogbixcbiAgd2Vla2RheTogcyxcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxufTtcblxuY29uc3QgREFURVRJTUVfRlVMTCA9IHtcbiAgeWVhcjogbixcbiAgbW9udGg6IGwsXG4gIGRheTogbixcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICB0aW1lWm9uZU5hbWU6IHMsXG59O1xuXG5jb25zdCBEQVRFVElNRV9GVUxMX1dJVEhfU0VDT05EUyA9IHtcbiAgeWVhcjogbixcbiAgbW9udGg6IGwsXG4gIGRheTogbixcbiAgaG91cjogbixcbiAgbWludXRlOiBuLFxuICBzZWNvbmQ6IG4sXG4gIHRpbWVab25lTmFtZTogcyxcbn07XG5cbmNvbnN0IERBVEVUSU1FX0hVR0UgPSB7XG4gIHllYXI6IG4sXG4gIG1vbnRoOiBsLFxuICBkYXk6IG4sXG4gIHdlZWtkYXk6IGwsXG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgdGltZVpvbmVOYW1lOiBsLFxufTtcblxuY29uc3QgREFURVRJTUVfSFVHRV9XSVRIX1NFQ09ORFMgPSB7XG4gIHllYXI6IG4sXG4gIG1vbnRoOiBsLFxuICBkYXk6IG4sXG4gIHdlZWtkYXk6IGwsXG4gIGhvdXI6IG4sXG4gIG1pbnV0ZTogbixcbiAgc2Vjb25kOiBuLFxuICB0aW1lWm9uZU5hbWU6IGwsXG59O1xuXG4vKipcbiAqIEBpbnRlcmZhY2VcbiAqL1xuY2xhc3MgWm9uZSB7XG4gIC8qKlxuICAgKiBUaGUgdHlwZSBvZiB6b25lXG4gICAqIEBhYnN0cmFjdFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IHR5cGUoKSB7XG4gICAgdGhyb3cgbmV3IFpvbmVJc0Fic3RyYWN0RXJyb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGlzIHpvbmUuXG4gICAqIEBhYnN0cmFjdFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IG5hbWUoKSB7XG4gICAgdGhyb3cgbmV3IFpvbmVJc0Fic3RyYWN0RXJyb3IoKTtcbiAgfVxuXG4gIGdldCBpYW5hTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgb2Zmc2V0IGlzIGtub3duIHRvIGJlIGZpeGVkIGZvciB0aGUgd2hvbGUgeWVhci5cbiAgICogQGFic3RyYWN0XG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGlzVW5pdmVyc2FsKCkge1xuICAgIHRocm93IG5ldyBab25lSXNBYnN0cmFjdEVycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb2Zmc2V0J3MgY29tbW9uIG5hbWUgKHN1Y2ggYXMgRVNUKSBhdCB0aGUgc3BlY2lmaWVkIHRpbWVzdGFtcFxuICAgKiBAYWJzdHJhY3RcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRzIC0gRXBvY2ggbWlsbGlzZWNvbmRzIGZvciB3aGljaCB0byBnZXQgdGhlIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBPcHRpb25zIHRvIGFmZmVjdCB0aGUgZm9ybWF0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLmZvcm1hdCAtIFdoYXQgc3R5bGUgb2Ygb2Zmc2V0IHRvIHJldHVybi4gQWNjZXB0cyAnbG9uZycgb3IgJ3Nob3J0Jy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMubG9jYWxlIC0gV2hhdCBsb2NhbGUgdG8gcmV0dXJuIHRoZSBvZmZzZXQgbmFtZSBpbi5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgb2Zmc2V0TmFtZSh0cywgb3B0cykge1xuICAgIHRocm93IG5ldyBab25lSXNBYnN0cmFjdEVycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb2Zmc2V0J3MgdmFsdWUgYXMgYSBzdHJpbmdcbiAgICogQGFic3RyYWN0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0cyAtIEVwb2NoIG1pbGxpc2Vjb25kcyBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBvZmZzZXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdCAtIFdoYXQgc3R5bGUgb2Ygb2Zmc2V0IHRvIHJldHVybi5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIEFjY2VwdHMgJ25hcnJvdycsICdzaG9ydCcsIG9yICd0ZWNoaWUnLiBSZXR1cm5pbmcgJys2JywgJyswNjowMCcsIG9yICcrMDYwMCcgcmVzcGVjdGl2ZWx5XG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIGZvcm1hdE9mZnNldCh0cywgZm9ybWF0KSB7XG4gICAgdGhyb3cgbmV3IFpvbmVJc0Fic3RyYWN0RXJyb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIG9mZnNldCBpbiBtaW51dGVzIGZvciB0aGlzIHpvbmUgYXQgdGhlIHNwZWNpZmllZCB0aW1lc3RhbXAuXG4gICAqIEBhYnN0cmFjdFxuICAgKiBAcGFyYW0ge251bWJlcn0gdHMgLSBFcG9jaCBtaWxsaXNlY29uZHMgZm9yIHdoaWNoIHRvIGNvbXB1dGUgdGhlIG9mZnNldFxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBvZmZzZXQodHMpIHtcbiAgICB0aHJvdyBuZXcgWm9uZUlzQWJzdHJhY3RFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgWm9uZSBpcyBlcXVhbCB0byBhbm90aGVyIHpvbmVcbiAgICogQGFic3RyYWN0XG4gICAqIEBwYXJhbSB7Wm9uZX0gb3RoZXJab25lIC0gdGhlIHpvbmUgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgZXF1YWxzKG90aGVyWm9uZSkge1xuICAgIHRocm93IG5ldyBab25lSXNBYnN0cmFjdEVycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBab25lIGlzIHZhbGlkLlxuICAgKiBAYWJzdHJhY3RcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICBnZXQgaXNWYWxpZCgpIHtcbiAgICB0aHJvdyBuZXcgWm9uZUlzQWJzdHJhY3RFcnJvcigpO1xuICB9XG59XG5cbmxldCBzaW5nbGV0b24kMSA9IG51bGw7XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgbG9jYWwgem9uZSBmb3IgdGhpcyBKYXZhU2NyaXB0IGVudmlyb25tZW50LlxuICogQGltcGxlbWVudHMge1pvbmV9XG4gKi9cbmNsYXNzIFN5c3RlbVpvbmUgZXh0ZW5kcyBab25lIHtcbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgbG9jYWwgem9uZVxuICAgKiBAcmV0dXJuIHtTeXN0ZW1ab25lfVxuICAgKi9cbiAgc3RhdGljIGdldCBpbnN0YW5jZSgpIHtcbiAgICBpZiAoc2luZ2xldG9uJDEgPT09IG51bGwpIHtcbiAgICAgIHNpbmdsZXRvbiQxID0gbmV3IFN5c3RlbVpvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNpbmdsZXRvbiQxO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZ2V0IHR5cGUoKSB7XG4gICAgcmV0dXJuIFwic3lzdGVtXCI7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS50aW1lWm9uZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBpc1VuaXZlcnNhbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBvZmZzZXROYW1lKHRzLCB7IGZvcm1hdCwgbG9jYWxlIH0pIHtcbiAgICByZXR1cm4gcGFyc2Vab25lSW5mbyh0cywgZm9ybWF0LCBsb2NhbGUpO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZm9ybWF0T2Zmc2V0KHRzLCBmb3JtYXQpIHtcbiAgICByZXR1cm4gZm9ybWF0T2Zmc2V0KHRoaXMub2Zmc2V0KHRzKSwgZm9ybWF0KTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIG9mZnNldCh0cykge1xuICAgIHJldHVybiAtbmV3IERhdGUodHMpLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBlcXVhbHMob3RoZXJab25lKSB7XG4gICAgcmV0dXJuIG90aGVyWm9uZS50eXBlID09PSBcInN5c3RlbVwiO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxubGV0IGR0ZkNhY2hlID0ge307XG5mdW5jdGlvbiBtYWtlRFRGKHpvbmUpIHtcbiAgaWYgKCFkdGZDYWNoZVt6b25lXSkge1xuICAgIGR0ZkNhY2hlW3pvbmVdID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoXCJlbi1VU1wiLCB7XG4gICAgICBob3VyMTI6IGZhbHNlLFxuICAgICAgdGltZVpvbmU6IHpvbmUsXG4gICAgICB5ZWFyOiBcIm51bWVyaWNcIixcbiAgICAgIG1vbnRoOiBcIjItZGlnaXRcIixcbiAgICAgIGRheTogXCIyLWRpZ2l0XCIsXG4gICAgICBob3VyOiBcIjItZGlnaXRcIixcbiAgICAgIG1pbnV0ZTogXCIyLWRpZ2l0XCIsXG4gICAgICBzZWNvbmQ6IFwiMi1kaWdpdFwiLFxuICAgICAgZXJhOiBcInNob3J0XCIsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGR0ZkNhY2hlW3pvbmVdO1xufVxuXG5jb25zdCB0eXBlVG9Qb3MgPSB7XG4gIHllYXI6IDAsXG4gIG1vbnRoOiAxLFxuICBkYXk6IDIsXG4gIGVyYTogMyxcbiAgaG91cjogNCxcbiAgbWludXRlOiA1LFxuICBzZWNvbmQ6IDYsXG59O1xuXG5mdW5jdGlvbiBoYWNreU9mZnNldChkdGYsIGRhdGUpIHtcbiAgY29uc3QgZm9ybWF0dGVkID0gZHRmLmZvcm1hdChkYXRlKS5yZXBsYWNlKC9cXHUyMDBFL2csIFwiXCIpLFxuICAgIHBhcnNlZCA9IC8oXFxkKylcXC8oXFxkKylcXC8oXFxkKykgKEFEfEJDKSw/IChcXGQrKTooXFxkKyk6KFxcZCspLy5leGVjKGZvcm1hdHRlZCksXG4gICAgWywgZk1vbnRoLCBmRGF5LCBmWWVhciwgZmFkT3JCYywgZkhvdXIsIGZNaW51dGUsIGZTZWNvbmRdID0gcGFyc2VkO1xuICByZXR1cm4gW2ZZZWFyLCBmTW9udGgsIGZEYXksIGZhZE9yQmMsIGZIb3VyLCBmTWludXRlLCBmU2Vjb25kXTtcbn1cblxuZnVuY3Rpb24gcGFydHNPZmZzZXQoZHRmLCBkYXRlKSB7XG4gIGNvbnN0IGZvcm1hdHRlZCA9IGR0Zi5mb3JtYXRUb1BhcnRzKGRhdGUpO1xuICBjb25zdCBmaWxsZWQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmb3JtYXR0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB7IHR5cGUsIHZhbHVlIH0gPSBmb3JtYXR0ZWRbaV07XG4gICAgY29uc3QgcG9zID0gdHlwZVRvUG9zW3R5cGVdO1xuXG4gICAgaWYgKHR5cGUgPT09IFwiZXJhXCIpIHtcbiAgICAgIGZpbGxlZFtwb3NdID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmICghaXNVbmRlZmluZWQocG9zKSkge1xuICAgICAgZmlsbGVkW3Bvc10gPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmlsbGVkO1xufVxuXG5sZXQgaWFuYVpvbmVDYWNoZSA9IHt9O1xuLyoqXG4gKiBBIHpvbmUgaWRlbnRpZmllZCBieSBhbiBJQU5BIGlkZW50aWZpZXIsIGxpa2UgQW1lcmljYS9OZXdfWW9ya1xuICogQGltcGxlbWVudHMge1pvbmV9XG4gKi9cbmNsYXNzIElBTkFab25lIGV4dGVuZHMgWm9uZSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFpvbmUgbmFtZVxuICAgKiBAcmV0dXJuIHtJQU5BWm9uZX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUobmFtZSkge1xuICAgIGlmICghaWFuYVpvbmVDYWNoZVtuYW1lXSkge1xuICAgICAgaWFuYVpvbmVDYWNoZVtuYW1lXSA9IG5ldyBJQU5BWm9uZShuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGlhbmFab25lQ2FjaGVbbmFtZV07XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgbG9jYWwgY2FjaGVzLiBTaG91bGQgb25seSBiZSBuZWNlc3NhcnkgaW4gdGVzdGluZyBzY2VuYXJpb3MuXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICBzdGF0aWMgcmVzZXRDYWNoZSgpIHtcbiAgICBpYW5hWm9uZUNhY2hlID0ge307XG4gICAgZHRmQ2FjaGUgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHN0cmluZyBpcyBhIHZhbGlkIHNwZWNpZmllci4gVGhpcyBvbmx5IGNoZWNrcyB0aGUgc3RyaW5nJ3MgZm9ybWF0LCBub3QgdGhhdCB0aGUgc3BlY2lmaWVyIGlkZW50aWZpZXMgYSBrbm93biB6b25lOyBzZWUgaXNWYWxpZFpvbmUgZm9yIHRoYXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzIC0gVGhlIHN0cmluZyB0byBjaGVjayB2YWxpZGl0eSBvblxuICAgKiBAZXhhbXBsZSBJQU5BWm9uZS5pc1ZhbGlkU3BlY2lmaWVyKFwiQW1lcmljYS9OZXdfWW9ya1wiKSAvLz0+IHRydWVcbiAgICogQGV4YW1wbGUgSUFOQVpvbmUuaXNWYWxpZFNwZWNpZmllcihcIlNwb3J0fn5ibG9ycFwiKSAvLz0+IGZhbHNlXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgbWV0aG9kIHJldHVybnMgZmFsc2UgZm9yIHNvbWUgdmFsaWQgSUFOQSBuYW1lcy4gVXNlIGlzVmFsaWRab25lIGluc3RlYWQuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgaXNWYWxpZFNwZWNpZmllcihzKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZFpvbmUocyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHJpbmcgaWRlbnRpZmllcyBhIHJlYWwgem9uZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gem9uZSAtIFRoZSBzdHJpbmcgdG8gY2hlY2tcbiAgICogQGV4YW1wbGUgSUFOQVpvbmUuaXNWYWxpZFpvbmUoXCJBbWVyaWNhL05ld19Zb3JrXCIpIC8vPT4gdHJ1ZVxuICAgKiBAZXhhbXBsZSBJQU5BWm9uZS5pc1ZhbGlkWm9uZShcIkZhbnRhc2lhL0Nhc3RsZVwiKSAvLz0+IGZhbHNlXG4gICAqIEBleGFtcGxlIElBTkFab25lLmlzVmFsaWRab25lKFwiU3BvcnR+fmJsb3JwXCIpIC8vPT4gZmFsc2VcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIHN0YXRpYyBpc1ZhbGlkWm9uZSh6b25lKSB7XG4gICAgaWYgKCF6b25lKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBuZXcgSW50bC5EYXRlVGltZUZvcm1hdChcImVuLVVTXCIsIHsgdGltZVpvbmU6IHpvbmUgfSkuZm9ybWF0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKCk7XG4gICAgLyoqIEBwcml2YXRlICoqL1xuICAgIHRoaXMuem9uZU5hbWUgPSBuYW1lO1xuICAgIC8qKiBAcHJpdmF0ZSAqKi9cbiAgICB0aGlzLnZhbGlkID0gSUFOQVpvbmUuaXNWYWxpZFpvbmUobmFtZSk7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBnZXQgdHlwZSgpIHtcbiAgICByZXR1cm4gXCJpYW5hXCI7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy56b25lTmFtZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBpc1VuaXZlcnNhbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBvZmZzZXROYW1lKHRzLCB7IGZvcm1hdCwgbG9jYWxlIH0pIHtcbiAgICByZXR1cm4gcGFyc2Vab25lSW5mbyh0cywgZm9ybWF0LCBsb2NhbGUsIHRoaXMubmFtZSk7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBmb3JtYXRPZmZzZXQodHMsIGZvcm1hdCkge1xuICAgIHJldHVybiBmb3JtYXRPZmZzZXQodGhpcy5vZmZzZXQodHMpLCBmb3JtYXQpO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgb2Zmc2V0KHRzKSB7XG4gICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHRzKTtcblxuICAgIGlmIChpc05hTihkYXRlKSkgcmV0dXJuIE5hTjtcblxuICAgIGNvbnN0IGR0ZiA9IG1ha2VEVEYodGhpcy5uYW1lKTtcbiAgICBsZXQgW3llYXIsIG1vbnRoLCBkYXksIGFkT3JCYywgaG91ciwgbWludXRlLCBzZWNvbmRdID0gZHRmLmZvcm1hdFRvUGFydHNcbiAgICAgID8gcGFydHNPZmZzZXQoZHRmLCBkYXRlKVxuICAgICAgOiBoYWNreU9mZnNldChkdGYsIGRhdGUpO1xuXG4gICAgaWYgKGFkT3JCYyA9PT0gXCJCQ1wiKSB7XG4gICAgICB5ZWFyID0gLU1hdGguYWJzKHllYXIpICsgMTtcbiAgICB9XG5cbiAgICAvLyBiZWNhdXNlIHdlJ3JlIHVzaW5nIGhvdXIxMiBhbmQgaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MTAyNTU2NCZjYW49MiZxPSUyMjI0JTNBMDAlMjIlMjBkYXRldGltZWZvcm1hdFxuICAgIGNvbnN0IGFkanVzdGVkSG91ciA9IGhvdXIgPT09IDI0ID8gMCA6IGhvdXI7XG5cbiAgICBjb25zdCBhc1VUQyA9IG9ialRvTG9jYWxUUyh7XG4gICAgICB5ZWFyLFxuICAgICAgbW9udGgsXG4gICAgICBkYXksXG4gICAgICBob3VyOiBhZGp1c3RlZEhvdXIsXG4gICAgICBtaW51dGUsXG4gICAgICBzZWNvbmQsXG4gICAgICBtaWxsaXNlY29uZDogMCxcbiAgICB9KTtcblxuICAgIGxldCBhc1RTID0gK2RhdGU7XG4gICAgY29uc3Qgb3ZlciA9IGFzVFMgJSAxMDAwO1xuICAgIGFzVFMgLT0gb3ZlciA+PSAwID8gb3ZlciA6IDEwMDAgKyBvdmVyO1xuICAgIHJldHVybiAoYXNVVEMgLSBhc1RTKSAvICg2MCAqIDEwMDApO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZXF1YWxzKG90aGVyWm9uZSkge1xuICAgIHJldHVybiBvdGhlclpvbmUudHlwZSA9PT0gXCJpYW5hXCIgJiYgb3RoZXJab25lLm5hbWUgPT09IHRoaXMubmFtZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiB0aGlzLnZhbGlkO1xuICB9XG59XG5cbi8vIHRvZG8gLSByZW1hcCBjYWNoaW5nXG5cbmxldCBpbnRsTEZDYWNoZSA9IHt9O1xuZnVuY3Rpb24gZ2V0Q2FjaGVkTEYobG9jU3RyaW5nLCBvcHRzID0ge30pIHtcbiAgY29uc3Qga2V5ID0gSlNPTi5zdHJpbmdpZnkoW2xvY1N0cmluZywgb3B0c10pO1xuICBsZXQgZHRmID0gaW50bExGQ2FjaGVba2V5XTtcbiAgaWYgKCFkdGYpIHtcbiAgICBkdGYgPSBuZXcgSW50bC5MaXN0Rm9ybWF0KGxvY1N0cmluZywgb3B0cyk7XG4gICAgaW50bExGQ2FjaGVba2V5XSA9IGR0ZjtcbiAgfVxuICByZXR1cm4gZHRmO1xufVxuXG5sZXQgaW50bERUQ2FjaGUgPSB7fTtcbmZ1bmN0aW9uIGdldENhY2hlZERURihsb2NTdHJpbmcsIG9wdHMgPSB7fSkge1xuICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeShbbG9jU3RyaW5nLCBvcHRzXSk7XG4gIGxldCBkdGYgPSBpbnRsRFRDYWNoZVtrZXldO1xuICBpZiAoIWR0Zikge1xuICAgIGR0ZiA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KGxvY1N0cmluZywgb3B0cyk7XG4gICAgaW50bERUQ2FjaGVba2V5XSA9IGR0ZjtcbiAgfVxuICByZXR1cm4gZHRmO1xufVxuXG5sZXQgaW50bE51bUNhY2hlID0ge307XG5mdW5jdGlvbiBnZXRDYWNoZWRJTkYobG9jU3RyaW5nLCBvcHRzID0ge30pIHtcbiAgY29uc3Qga2V5ID0gSlNPTi5zdHJpbmdpZnkoW2xvY1N0cmluZywgb3B0c10pO1xuICBsZXQgaW5mID0gaW50bE51bUNhY2hlW2tleV07XG4gIGlmICghaW5mKSB7XG4gICAgaW5mID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KGxvY1N0cmluZywgb3B0cyk7XG4gICAgaW50bE51bUNhY2hlW2tleV0gPSBpbmY7XG4gIH1cbiAgcmV0dXJuIGluZjtcbn1cblxubGV0IGludGxSZWxDYWNoZSA9IHt9O1xuZnVuY3Rpb24gZ2V0Q2FjaGVkUlRGKGxvY1N0cmluZywgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IHsgYmFzZSwgLi4uY2FjaGVLZXlPcHRzIH0gPSBvcHRzOyAvLyBleGNsdWRlIGBiYXNlYCBmcm9tIHRoZSBvcHRpb25zXG4gIGNvbnN0IGtleSA9IEpTT04uc3RyaW5naWZ5KFtsb2NTdHJpbmcsIGNhY2hlS2V5T3B0c10pO1xuICBsZXQgaW5mID0gaW50bFJlbENhY2hlW2tleV07XG4gIGlmICghaW5mKSB7XG4gICAgaW5mID0gbmV3IEludGwuUmVsYXRpdmVUaW1lRm9ybWF0KGxvY1N0cmluZywgb3B0cyk7XG4gICAgaW50bFJlbENhY2hlW2tleV0gPSBpbmY7XG4gIH1cbiAgcmV0dXJuIGluZjtcbn1cblxubGV0IHN5c0xvY2FsZUNhY2hlID0gbnVsbDtcbmZ1bmN0aW9uIHN5c3RlbUxvY2FsZSgpIHtcbiAgaWYgKHN5c0xvY2FsZUNhY2hlKSB7XG4gICAgcmV0dXJuIHN5c0xvY2FsZUNhY2hlO1xuICB9IGVsc2Uge1xuICAgIHN5c0xvY2FsZUNhY2hlID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoKS5yZXNvbHZlZE9wdGlvbnMoKS5sb2NhbGU7XG4gICAgcmV0dXJuIHN5c0xvY2FsZUNhY2hlO1xuICB9XG59XG5cbmxldCB3ZWVrSW5mb0NhY2hlID0ge307XG5mdW5jdGlvbiBnZXRDYWNoZWRXZWVrSW5mbyhsb2NTdHJpbmcpIHtcbiAgbGV0IGRhdGEgPSB3ZWVrSW5mb0NhY2hlW2xvY1N0cmluZ107XG4gIGlmICghZGF0YSkge1xuICAgIGNvbnN0IGxvY2FsZSA9IG5ldyBJbnRsLkxvY2FsZShsb2NTdHJpbmcpO1xuICAgIC8vIGJyb3dzZXJzIGN1cnJlbnRseSBpbXBsZW1lbnQgdGhpcyBhcyBhIHByb3BlcnR5LCBidXQgc3BlYyBzYXlzIGl0IHNob3VsZCBiZSBhIGdldHRlciBmdW5jdGlvblxuICAgIGRhdGEgPSBcImdldFdlZWtJbmZvXCIgaW4gbG9jYWxlID8gbG9jYWxlLmdldFdlZWtJbmZvKCkgOiBsb2NhbGUud2Vla0luZm87XG4gICAgd2Vla0luZm9DYWNoZVtsb2NTdHJpbmddID0gZGF0YTtcbiAgfVxuICByZXR1cm4gZGF0YTtcbn1cblxuZnVuY3Rpb24gcGFyc2VMb2NhbGVTdHJpbmcobG9jYWxlU3RyKSB7XG4gIC8vIEkgcmVhbGx5IHdhbnQgdG8gYXZvaWQgd3JpdGluZyBhIEJDUCA0NyBwYXJzZXJcbiAgLy8gc2VlLCBlLmcuIGh0dHBzOi8vZ2l0aHViLmNvbS93b29vcm0vYmNwLTQ3XG4gIC8vIEluc3RlYWQsIHdlJ2xsIGRvIHRoaXM6XG5cbiAgLy8gYSkgaWYgdGhlIHN0cmluZyBoYXMgbm8gLXUgZXh0ZW5zaW9ucywganVzdCBsZWF2ZSBpdCBhbG9uZVxuICAvLyBiKSBpZiBpdCBkb2VzLCB1c2UgSW50bCB0byByZXNvbHZlIGV2ZXJ5dGhpbmdcbiAgLy8gYykgaWYgSW50bCBmYWlscywgdHJ5IGFnYWluIHdpdGhvdXQgdGhlIC11XG5cbiAgLy8gcHJpdmF0ZSBzdWJ0YWdzIGFuZCB1bmljb2RlIHN1YnRhZ3MgaGF2ZSBvcmRlcmluZyByZXF1aXJlbWVudHMsXG4gIC8vIGFuZCB3ZSdyZSBub3QgcHJvcGVybHkgcGFyc2luZyB0aGlzLCBzbyBqdXN0IHN0cmlwIG91dCB0aGVcbiAgLy8gcHJpdmF0ZSBvbmVzIGlmIHRoZXkgZXhpc3QuXG4gIGNvbnN0IHhJbmRleCA9IGxvY2FsZVN0ci5pbmRleE9mKFwiLXgtXCIpO1xuICBpZiAoeEluZGV4ICE9PSAtMSkge1xuICAgIGxvY2FsZVN0ciA9IGxvY2FsZVN0ci5zdWJzdHJpbmcoMCwgeEluZGV4KTtcbiAgfVxuXG4gIGNvbnN0IHVJbmRleCA9IGxvY2FsZVN0ci5pbmRleE9mKFwiLXUtXCIpO1xuICBpZiAodUluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBbbG9jYWxlU3RyXTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgb3B0aW9ucztcbiAgICBsZXQgc2VsZWN0ZWRTdHI7XG4gICAgdHJ5IHtcbiAgICAgIG9wdGlvbnMgPSBnZXRDYWNoZWREVEYobG9jYWxlU3RyKS5yZXNvbHZlZE9wdGlvbnMoKTtcbiAgICAgIHNlbGVjdGVkU3RyID0gbG9jYWxlU3RyO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnN0IHNtYWxsZXIgPSBsb2NhbGVTdHIuc3Vic3RyaW5nKDAsIHVJbmRleCk7XG4gICAgICBvcHRpb25zID0gZ2V0Q2FjaGVkRFRGKHNtYWxsZXIpLnJlc29sdmVkT3B0aW9ucygpO1xuICAgICAgc2VsZWN0ZWRTdHIgPSBzbWFsbGVyO1xuICAgIH1cblxuICAgIGNvbnN0IHsgbnVtYmVyaW5nU3lzdGVtLCBjYWxlbmRhciB9ID0gb3B0aW9ucztcbiAgICByZXR1cm4gW3NlbGVjdGVkU3RyLCBudW1iZXJpbmdTeXN0ZW0sIGNhbGVuZGFyXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnRsQ29uZmlnU3RyaW5nKGxvY2FsZVN0ciwgbnVtYmVyaW5nU3lzdGVtLCBvdXRwdXRDYWxlbmRhcikge1xuICBpZiAob3V0cHV0Q2FsZW5kYXIgfHwgbnVtYmVyaW5nU3lzdGVtKSB7XG4gICAgaWYgKCFsb2NhbGVTdHIuaW5jbHVkZXMoXCItdS1cIikpIHtcbiAgICAgIGxvY2FsZVN0ciArPSBcIi11XCI7XG4gICAgfVxuXG4gICAgaWYgKG91dHB1dENhbGVuZGFyKSB7XG4gICAgICBsb2NhbGVTdHIgKz0gYC1jYS0ke291dHB1dENhbGVuZGFyfWA7XG4gICAgfVxuXG4gICAgaWYgKG51bWJlcmluZ1N5c3RlbSkge1xuICAgICAgbG9jYWxlU3RyICs9IGAtbnUtJHtudW1iZXJpbmdTeXN0ZW19YDtcbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsZVN0cjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbG9jYWxlU3RyO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcE1vbnRocyhmKSB7XG4gIGNvbnN0IG1zID0gW107XG4gIGZvciAobGV0IGkgPSAxOyBpIDw9IDEyOyBpKyspIHtcbiAgICBjb25zdCBkdCA9IERhdGVUaW1lLnV0YygyMDA5LCBpLCAxKTtcbiAgICBtcy5wdXNoKGYoZHQpKTtcbiAgfVxuICByZXR1cm4gbXM7XG59XG5cbmZ1bmN0aW9uIG1hcFdlZWtkYXlzKGYpIHtcbiAgY29uc3QgbXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gNzsgaSsrKSB7XG4gICAgY29uc3QgZHQgPSBEYXRlVGltZS51dGMoMjAxNiwgMTEsIDEzICsgaSk7XG4gICAgbXMucHVzaChmKGR0KSk7XG4gIH1cbiAgcmV0dXJuIG1zO1xufVxuXG5mdW5jdGlvbiBsaXN0U3R1ZmYobG9jLCBsZW5ndGgsIGVuZ2xpc2hGbiwgaW50bEZuKSB7XG4gIGNvbnN0IG1vZGUgPSBsb2MubGlzdGluZ01vZGUoKTtcblxuICBpZiAobW9kZSA9PT0gXCJlcnJvclwiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAobW9kZSA9PT0gXCJlblwiKSB7XG4gICAgcmV0dXJuIGVuZ2xpc2hGbihsZW5ndGgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpbnRsRm4obGVuZ3RoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdXBwb3J0c0Zhc3ROdW1iZXJzKGxvYykge1xuICBpZiAobG9jLm51bWJlcmluZ1N5c3RlbSAmJiBsb2MubnVtYmVyaW5nU3lzdGVtICE9PSBcImxhdG5cIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKFxuICAgICAgbG9jLm51bWJlcmluZ1N5c3RlbSA9PT0gXCJsYXRuXCIgfHxcbiAgICAgICFsb2MubG9jYWxlIHx8XG4gICAgICBsb2MubG9jYWxlLnN0YXJ0c1dpdGgoXCJlblwiKSB8fFxuICAgICAgbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQobG9jLmludGwpLnJlc29sdmVkT3B0aW9ucygpLm51bWJlcmluZ1N5c3RlbSA9PT0gXCJsYXRuXCJcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuXG5jbGFzcyBQb2x5TnVtYmVyRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3IoaW50bCwgZm9yY2VTaW1wbGUsIG9wdHMpIHtcbiAgICB0aGlzLnBhZFRvID0gb3B0cy5wYWRUbyB8fCAwO1xuICAgIHRoaXMuZmxvb3IgPSBvcHRzLmZsb29yIHx8IGZhbHNlO1xuXG4gICAgY29uc3QgeyBwYWRUbywgZmxvb3IsIC4uLm90aGVyT3B0cyB9ID0gb3B0cztcblxuICAgIGlmICghZm9yY2VTaW1wbGUgfHwgT2JqZWN0LmtleXMob3RoZXJPcHRzKS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBpbnRsT3B0cyA9IHsgdXNlR3JvdXBpbmc6IGZhbHNlLCAuLi5vcHRzIH07XG4gICAgICBpZiAob3B0cy5wYWRUbyA+IDApIGludGxPcHRzLm1pbmltdW1JbnRlZ2VyRGlnaXRzID0gb3B0cy5wYWRUbztcbiAgICAgIHRoaXMuaW5mID0gZ2V0Q2FjaGVkSU5GKGludGwsIGludGxPcHRzKTtcbiAgICB9XG4gIH1cblxuICBmb3JtYXQoaSkge1xuICAgIGlmICh0aGlzLmluZikge1xuICAgICAgY29uc3QgZml4ZWQgPSB0aGlzLmZsb29yID8gTWF0aC5mbG9vcihpKSA6IGk7XG4gICAgICByZXR1cm4gdGhpcy5pbmYuZm9ybWF0KGZpeGVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdG8gbWF0Y2ggdGhlIGJyb3dzZXIncyBudW1iZXJmb3JtYXR0ZXIgZGVmYXVsdHNcbiAgICAgIGNvbnN0IGZpeGVkID0gdGhpcy5mbG9vciA/IE1hdGguZmxvb3IoaSkgOiByb3VuZFRvKGksIDMpO1xuICAgICAgcmV0dXJuIHBhZFN0YXJ0KGZpeGVkLCB0aGlzLnBhZFRvKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNsYXNzIFBvbHlEYXRlRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3IoZHQsIGludGwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgIHRoaXMub3JpZ2luYWxab25lID0gdW5kZWZpbmVkO1xuXG4gICAgbGV0IHogPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMub3B0cy50aW1lWm9uZSkge1xuICAgICAgLy8gRG9uJ3QgYXBwbHkgYW55IHdvcmthcm91bmRzIGlmIGEgdGltZVpvbmUgaXMgZXhwbGljaXRseSBwcm92aWRlZCBpbiBvcHRzXG4gICAgICB0aGlzLmR0ID0gZHQ7XG4gICAgfSBlbHNlIGlmIChkdC56b25lLnR5cGUgPT09IFwiZml4ZWRcIikge1xuICAgICAgLy8gVVRDLTggb3IgRXRjL1VUQy04IGFyZSBub3QgcGFydCBvZiB0emRhdGEsIG9ubHkgRXRjL0dNVCs4IGFuZCB0aGUgbGlrZS5cbiAgICAgIC8vIFRoYXQgaXMgd2h5IGZpeGVkLW9mZnNldCBUWiBpcyBzZXQgdG8gdGhhdCB1bmxlc3MgaXQgaXM6XG4gICAgICAvLyAxLiBSZXByZXNlbnRpbmcgb2Zmc2V0IDAgd2hlbiBVVEMgaXMgdXNlZCB0byBtYWludGFpbiBwcmV2aW91cyBiZWhhdmlvciBhbmQgZG9lcyBub3QgYmVjb21lIEdNVC5cbiAgICAgIC8vIDIuIFVuc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyOlxuICAgICAgLy8gICAgLSBzb21lIGRvIG5vdCBzdXBwb3J0IEV0Yy9cbiAgICAgIC8vICAgIC0gPCBFdGMvR01ULTE0LCA+IEV0Yy9HTVQrMTIsIGFuZCAzMC1taW51dGUgb3IgNDUtbWludXRlIG9mZnNldHMgYXJlIG5vdCBwYXJ0IG9mIHR6ZGF0YVxuICAgICAgY29uc3QgZ210T2Zmc2V0ID0gLTEgKiAoZHQub2Zmc2V0IC8gNjApO1xuICAgICAgY29uc3Qgb2Zmc2V0WiA9IGdtdE9mZnNldCA+PSAwID8gYEV0Yy9HTVQrJHtnbXRPZmZzZXR9YCA6IGBFdGMvR01UJHtnbXRPZmZzZXR9YDtcbiAgICAgIGlmIChkdC5vZmZzZXQgIT09IDAgJiYgSUFOQVpvbmUuY3JlYXRlKG9mZnNldFopLnZhbGlkKSB7XG4gICAgICAgIHogPSBvZmZzZXRaO1xuICAgICAgICB0aGlzLmR0ID0gZHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOb3QgYWxsIGZpeGVkLW9mZnNldCB6b25lcyBsaWtlIEV0Yy8rNDozMCBhcmUgcHJlc2VudCBpbiB0emRhdGEgc29cbiAgICAgICAgLy8gd2UgbWFudWFsbHkgYXBwbHkgdGhlIG9mZnNldCBhbmQgc3Vic3RpdHV0ZSB0aGUgem9uZSBhcyBuZWVkZWQuXG4gICAgICAgIHogPSBcIlVUQ1wiO1xuICAgICAgICB0aGlzLmR0ID0gZHQub2Zmc2V0ID09PSAwID8gZHQgOiBkdC5zZXRab25lKFwiVVRDXCIpLnBsdXMoeyBtaW51dGVzOiBkdC5vZmZzZXQgfSk7XG4gICAgICAgIHRoaXMub3JpZ2luYWxab25lID0gZHQuem9uZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGR0LnpvbmUudHlwZSA9PT0gXCJzeXN0ZW1cIikge1xuICAgICAgdGhpcy5kdCA9IGR0O1xuICAgIH0gZWxzZSBpZiAoZHQuem9uZS50eXBlID09PSBcImlhbmFcIikge1xuICAgICAgdGhpcy5kdCA9IGR0O1xuICAgICAgeiA9IGR0LnpvbmUubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ3VzdG9tIHpvbmVzIGNhbiBoYXZlIGFueSBvZmZzZXQgLyBvZmZzZXROYW1lIHNvIHdlIGp1c3QgbWFudWFsbHlcbiAgICAgIC8vIGFwcGx5IHRoZSBvZmZzZXQgYW5kIHN1YnN0aXR1dGUgdGhlIHpvbmUgYXMgbmVlZGVkLlxuICAgICAgeiA9IFwiVVRDXCI7XG4gICAgICB0aGlzLmR0ID0gZHQuc2V0Wm9uZShcIlVUQ1wiKS5wbHVzKHsgbWludXRlczogZHQub2Zmc2V0IH0pO1xuICAgICAgdGhpcy5vcmlnaW5hbFpvbmUgPSBkdC56b25lO1xuICAgIH1cblxuICAgIGNvbnN0IGludGxPcHRzID0geyAuLi50aGlzLm9wdHMgfTtcbiAgICBpbnRsT3B0cy50aW1lWm9uZSA9IGludGxPcHRzLnRpbWVab25lIHx8IHo7XG4gICAgdGhpcy5kdGYgPSBnZXRDYWNoZWREVEYoaW50bCwgaW50bE9wdHMpO1xuICB9XG5cbiAgZm9ybWF0KCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsWm9uZSkge1xuICAgICAgLy8gSWYgd2UgaGF2ZSB0byBzdWJzdGl0dXRlIGluIHRoZSBhY3R1YWwgem9uZSBuYW1lLCB3ZSBoYXZlIHRvIHVzZVxuICAgICAgLy8gZm9ybWF0VG9QYXJ0cyBzbyB0aGF0IHRoZSB0aW1lem9uZSBjYW4gYmUgcmVwbGFjZWQuXG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXRUb1BhcnRzKClcbiAgICAgICAgLm1hcCgoeyB2YWx1ZSB9KSA9PiB2YWx1ZSlcbiAgICAgICAgLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmR0Zi5mb3JtYXQodGhpcy5kdC50b0pTRGF0ZSgpKTtcbiAgfVxuXG4gIGZvcm1hdFRvUGFydHMoKSB7XG4gICAgY29uc3QgcGFydHMgPSB0aGlzLmR0Zi5mb3JtYXRUb1BhcnRzKHRoaXMuZHQudG9KU0RhdGUoKSk7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxab25lKSB7XG4gICAgICByZXR1cm4gcGFydHMubWFwKChwYXJ0KSA9PiB7XG4gICAgICAgIGlmIChwYXJ0LnR5cGUgPT09IFwidGltZVpvbmVOYW1lXCIpIHtcbiAgICAgICAgICBjb25zdCBvZmZzZXROYW1lID0gdGhpcy5vcmlnaW5hbFpvbmUub2Zmc2V0TmFtZSh0aGlzLmR0LnRzLCB7XG4gICAgICAgICAgICBsb2NhbGU6IHRoaXMuZHQubG9jYWxlLFxuICAgICAgICAgICAgZm9ybWF0OiB0aGlzLm9wdHMudGltZVpvbmVOYW1lLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5wYXJ0LFxuICAgICAgICAgICAgdmFsdWU6IG9mZnNldE5hbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcGFydDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwYXJ0cztcbiAgfVxuXG4gIHJlc29sdmVkT3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5kdGYucmVzb2x2ZWRPcHRpb25zKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBQb2x5UmVsRm9ybWF0dGVyIHtcbiAgY29uc3RydWN0b3IoaW50bCwgaXNFbmdsaXNoLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0geyBzdHlsZTogXCJsb25nXCIsIC4uLm9wdHMgfTtcbiAgICBpZiAoIWlzRW5nbGlzaCAmJiBoYXNSZWxhdGl2ZSgpKSB7XG4gICAgICB0aGlzLnJ0ZiA9IGdldENhY2hlZFJURihpbnRsLCBvcHRzKTtcbiAgICB9XG4gIH1cblxuICBmb3JtYXQoY291bnQsIHVuaXQpIHtcbiAgICBpZiAodGhpcy5ydGYpIHtcbiAgICAgIHJldHVybiB0aGlzLnJ0Zi5mb3JtYXQoY291bnQsIHVuaXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZm9ybWF0UmVsYXRpdmVUaW1lKHVuaXQsIGNvdW50LCB0aGlzLm9wdHMubnVtZXJpYywgdGhpcy5vcHRzLnN0eWxlICE9PSBcImxvbmdcIik7XG4gICAgfVxuICB9XG5cbiAgZm9ybWF0VG9QYXJ0cyhjb3VudCwgdW5pdCkge1xuICAgIGlmICh0aGlzLnJ0Zikge1xuICAgICAgcmV0dXJuIHRoaXMucnRmLmZvcm1hdFRvUGFydHMoY291bnQsIHVuaXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGZhbGxiYWNrV2Vla1NldHRpbmdzID0ge1xuICBmaXJzdERheTogMSxcbiAgbWluaW1hbERheXM6IDQsXG4gIHdlZWtlbmQ6IFs2LCA3XSxcbn07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuXG5jbGFzcyBMb2NhbGUge1xuICBzdGF0aWMgZnJvbU9wdHMob3B0cykge1xuICAgIHJldHVybiBMb2NhbGUuY3JlYXRlKFxuICAgICAgb3B0cy5sb2NhbGUsXG4gICAgICBvcHRzLm51bWJlcmluZ1N5c3RlbSxcbiAgICAgIG9wdHMub3V0cHV0Q2FsZW5kYXIsXG4gICAgICBvcHRzLndlZWtTZXR0aW5ncyxcbiAgICAgIG9wdHMuZGVmYXVsdFRvRU5cbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZShsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgb3V0cHV0Q2FsZW5kYXIsIHdlZWtTZXR0aW5ncywgZGVmYXVsdFRvRU4gPSBmYWxzZSkge1xuICAgIGNvbnN0IHNwZWNpZmllZExvY2FsZSA9IGxvY2FsZSB8fCBTZXR0aW5ncy5kZWZhdWx0TG9jYWxlO1xuICAgIC8vIHRoZSBzeXN0ZW0gbG9jYWxlIGlzIHVzZWZ1bCBmb3IgaHVtYW4gcmVhZGFibGUgc3RyaW5ncyBidXQgYW5ub3lpbmcgZm9yIHBhcnNpbmcvZm9ybWF0dGluZyBrbm93biBmb3JtYXRzXG4gICAgY29uc3QgbG9jYWxlUiA9IHNwZWNpZmllZExvY2FsZSB8fCAoZGVmYXVsdFRvRU4gPyBcImVuLVVTXCIgOiBzeXN0ZW1Mb2NhbGUoKSk7XG4gICAgY29uc3QgbnVtYmVyaW5nU3lzdGVtUiA9IG51bWJlcmluZ1N5c3RlbSB8fCBTZXR0aW5ncy5kZWZhdWx0TnVtYmVyaW5nU3lzdGVtO1xuICAgIGNvbnN0IG91dHB1dENhbGVuZGFyUiA9IG91dHB1dENhbGVuZGFyIHx8IFNldHRpbmdzLmRlZmF1bHRPdXRwdXRDYWxlbmRhcjtcbiAgICBjb25zdCB3ZWVrU2V0dGluZ3NSID0gdmFsaWRhdGVXZWVrU2V0dGluZ3Mod2Vla1NldHRpbmdzKSB8fCBTZXR0aW5ncy5kZWZhdWx0V2Vla1NldHRpbmdzO1xuICAgIHJldHVybiBuZXcgTG9jYWxlKGxvY2FsZVIsIG51bWJlcmluZ1N5c3RlbVIsIG91dHB1dENhbGVuZGFyUiwgd2Vla1NldHRpbmdzUiwgc3BlY2lmaWVkTG9jYWxlKTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldENhY2hlKCkge1xuICAgIHN5c0xvY2FsZUNhY2hlID0gbnVsbDtcbiAgICBpbnRsRFRDYWNoZSA9IHt9O1xuICAgIGludGxOdW1DYWNoZSA9IHt9O1xuICAgIGludGxSZWxDYWNoZSA9IHt9O1xuICB9XG5cbiAgc3RhdGljIGZyb21PYmplY3QoeyBsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgb3V0cHV0Q2FsZW5kYXIsIHdlZWtTZXR0aW5ncyB9ID0ge30pIHtcbiAgICByZXR1cm4gTG9jYWxlLmNyZWF0ZShsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgb3V0cHV0Q2FsZW5kYXIsIHdlZWtTZXR0aW5ncyk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihsb2NhbGUsIG51bWJlcmluZywgb3V0cHV0Q2FsZW5kYXIsIHdlZWtTZXR0aW5ncywgc3BlY2lmaWVkTG9jYWxlKSB7XG4gICAgY29uc3QgW3BhcnNlZExvY2FsZSwgcGFyc2VkTnVtYmVyaW5nU3lzdGVtLCBwYXJzZWRPdXRwdXRDYWxlbmRhcl0gPSBwYXJzZUxvY2FsZVN0cmluZyhsb2NhbGUpO1xuXG4gICAgdGhpcy5sb2NhbGUgPSBwYXJzZWRMb2NhbGU7XG4gICAgdGhpcy5udW1iZXJpbmdTeXN0ZW0gPSBudW1iZXJpbmcgfHwgcGFyc2VkTnVtYmVyaW5nU3lzdGVtIHx8IG51bGw7XG4gICAgdGhpcy5vdXRwdXRDYWxlbmRhciA9IG91dHB1dENhbGVuZGFyIHx8IHBhcnNlZE91dHB1dENhbGVuZGFyIHx8IG51bGw7XG4gICAgdGhpcy53ZWVrU2V0dGluZ3MgPSB3ZWVrU2V0dGluZ3M7XG4gICAgdGhpcy5pbnRsID0gaW50bENvbmZpZ1N0cmluZyh0aGlzLmxvY2FsZSwgdGhpcy5udW1iZXJpbmdTeXN0ZW0sIHRoaXMub3V0cHV0Q2FsZW5kYXIpO1xuXG4gICAgdGhpcy53ZWVrZGF5c0NhY2hlID0geyBmb3JtYXQ6IHt9LCBzdGFuZGFsb25lOiB7fSB9O1xuICAgIHRoaXMubW9udGhzQ2FjaGUgPSB7IGZvcm1hdDoge30sIHN0YW5kYWxvbmU6IHt9IH07XG4gICAgdGhpcy5tZXJpZGllbUNhY2hlID0gbnVsbDtcbiAgICB0aGlzLmVyYUNhY2hlID0ge307XG5cbiAgICB0aGlzLnNwZWNpZmllZExvY2FsZSA9IHNwZWNpZmllZExvY2FsZTtcbiAgICB0aGlzLmZhc3ROdW1iZXJzQ2FjaGVkID0gbnVsbDtcbiAgfVxuXG4gIGdldCBmYXN0TnVtYmVycygpIHtcbiAgICBpZiAodGhpcy5mYXN0TnVtYmVyc0NhY2hlZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLmZhc3ROdW1iZXJzQ2FjaGVkID0gc3VwcG9ydHNGYXN0TnVtYmVycyh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5mYXN0TnVtYmVyc0NhY2hlZDtcbiAgfVxuXG4gIGxpc3RpbmdNb2RlKCkge1xuICAgIGNvbnN0IGlzQWN0dWFsbHlFbiA9IHRoaXMuaXNFbmdsaXNoKCk7XG4gICAgY29uc3QgaGFzTm9XZWlyZG5lc3MgPVxuICAgICAgKHRoaXMubnVtYmVyaW5nU3lzdGVtID09PSBudWxsIHx8IHRoaXMubnVtYmVyaW5nU3lzdGVtID09PSBcImxhdG5cIikgJiZcbiAgICAgICh0aGlzLm91dHB1dENhbGVuZGFyID09PSBudWxsIHx8IHRoaXMub3V0cHV0Q2FsZW5kYXIgPT09IFwiZ3JlZ29yeVwiKTtcbiAgICByZXR1cm4gaXNBY3R1YWxseUVuICYmIGhhc05vV2VpcmRuZXNzID8gXCJlblwiIDogXCJpbnRsXCI7XG4gIH1cblxuICBjbG9uZShhbHRzKSB7XG4gICAgaWYgKCFhbHRzIHx8IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFsdHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBMb2NhbGUuY3JlYXRlKFxuICAgICAgICBhbHRzLmxvY2FsZSB8fCB0aGlzLnNwZWNpZmllZExvY2FsZSxcbiAgICAgICAgYWx0cy5udW1iZXJpbmdTeXN0ZW0gfHwgdGhpcy5udW1iZXJpbmdTeXN0ZW0sXG4gICAgICAgIGFsdHMub3V0cHV0Q2FsZW5kYXIgfHwgdGhpcy5vdXRwdXRDYWxlbmRhcixcbiAgICAgICAgdmFsaWRhdGVXZWVrU2V0dGluZ3MoYWx0cy53ZWVrU2V0dGluZ3MpIHx8IHRoaXMud2Vla1NldHRpbmdzLFxuICAgICAgICBhbHRzLmRlZmF1bHRUb0VOIHx8IGZhbHNlXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHJlZGVmYXVsdFRvRU4oYWx0cyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoeyAuLi5hbHRzLCBkZWZhdWx0VG9FTjogdHJ1ZSB9KTtcbiAgfVxuXG4gIHJlZGVmYXVsdFRvU3lzdGVtKGFsdHMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLmNsb25lKHsgLi4uYWx0cywgZGVmYXVsdFRvRU46IGZhbHNlIH0pO1xuICB9XG5cbiAgbW9udGhzKGxlbmd0aCwgZm9ybWF0ID0gZmFsc2UpIHtcbiAgICByZXR1cm4gbGlzdFN0dWZmKHRoaXMsIGxlbmd0aCwgbW9udGhzLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbnRsID0gZm9ybWF0ID8geyBtb250aDogbGVuZ3RoLCBkYXk6IFwibnVtZXJpY1wiIH0gOiB7IG1vbnRoOiBsZW5ndGggfSxcbiAgICAgICAgZm9ybWF0U3RyID0gZm9ybWF0ID8gXCJmb3JtYXRcIiA6IFwic3RhbmRhbG9uZVwiO1xuICAgICAgaWYgKCF0aGlzLm1vbnRoc0NhY2hlW2Zvcm1hdFN0cl1bbGVuZ3RoXSkge1xuICAgICAgICB0aGlzLm1vbnRoc0NhY2hlW2Zvcm1hdFN0cl1bbGVuZ3RoXSA9IG1hcE1vbnRocygoZHQpID0+IHRoaXMuZXh0cmFjdChkdCwgaW50bCwgXCJtb250aFwiKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tb250aHNDYWNoZVtmb3JtYXRTdHJdW2xlbmd0aF07XG4gICAgfSk7XG4gIH1cblxuICB3ZWVrZGF5cyhsZW5ndGgsIGZvcm1hdCA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIGxpc3RTdHVmZih0aGlzLCBsZW5ndGgsIHdlZWtkYXlzLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbnRsID0gZm9ybWF0XG4gICAgICAgICAgPyB7IHdlZWtkYXk6IGxlbmd0aCwgeWVhcjogXCJudW1lcmljXCIsIG1vbnRoOiBcImxvbmdcIiwgZGF5OiBcIm51bWVyaWNcIiB9XG4gICAgICAgICAgOiB7IHdlZWtkYXk6IGxlbmd0aCB9LFxuICAgICAgICBmb3JtYXRTdHIgPSBmb3JtYXQgPyBcImZvcm1hdFwiIDogXCJzdGFuZGFsb25lXCI7XG4gICAgICBpZiAoIXRoaXMud2Vla2RheXNDYWNoZVtmb3JtYXRTdHJdW2xlbmd0aF0pIHtcbiAgICAgICAgdGhpcy53ZWVrZGF5c0NhY2hlW2Zvcm1hdFN0cl1bbGVuZ3RoXSA9IG1hcFdlZWtkYXlzKChkdCkgPT5cbiAgICAgICAgICB0aGlzLmV4dHJhY3QoZHQsIGludGwsIFwid2Vla2RheVwiKVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMud2Vla2RheXNDYWNoZVtmb3JtYXRTdHJdW2xlbmd0aF07XG4gICAgfSk7XG4gIH1cblxuICBtZXJpZGllbXMoKSB7XG4gICAgcmV0dXJuIGxpc3RTdHVmZihcbiAgICAgIHRoaXMsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICAoKSA9PiBtZXJpZGllbXMsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIC8vIEluIHRoZW9yeSB0aGVyZSBjb3VsZCBiZSBhcmliaXRyYXJ5IGRheSBwZXJpb2RzLiBXZSdyZSBnb25uYSBhc3N1bWUgdGhlcmUgYXJlIGV4YWN0bHkgdHdvXG4gICAgICAgIC8vIGZvciBBTSBhbmQgUE0uIFRoaXMgaXMgcHJvYmFibHkgd3JvbmcsIGJ1dCBpdCdzIG1ha2VzIHBhcnNpbmcgd2F5IGVhc2llci5cbiAgICAgICAgaWYgKCF0aGlzLm1lcmlkaWVtQ2FjaGUpIHtcbiAgICAgICAgICBjb25zdCBpbnRsID0geyBob3VyOiBcIm51bWVyaWNcIiwgaG91ckN5Y2xlOiBcImgxMlwiIH07XG4gICAgICAgICAgdGhpcy5tZXJpZGllbUNhY2hlID0gW0RhdGVUaW1lLnV0YygyMDE2LCAxMSwgMTMsIDkpLCBEYXRlVGltZS51dGMoMjAxNiwgMTEsIDEzLCAxOSldLm1hcChcbiAgICAgICAgICAgIChkdCkgPT4gdGhpcy5leHRyYWN0KGR0LCBpbnRsLCBcImRheXBlcmlvZFwiKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5tZXJpZGllbUNhY2hlO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBlcmFzKGxlbmd0aCkge1xuICAgIHJldHVybiBsaXN0U3R1ZmYodGhpcywgbGVuZ3RoLCBlcmFzLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbnRsID0geyBlcmE6IGxlbmd0aCB9O1xuXG4gICAgICAvLyBUaGlzIGlzIHByb2JsZW1hdGljLiBEaWZmZXJlbnQgY2FsZW5kYXJzIGFyZSBnb2luZyB0byBkZWZpbmUgZXJhcyB0b3RhbGx5IGRpZmZlcmVudGx5LiBXaGF0IEkgbmVlZCBpcyB0aGUgbWluaW11bSBzZXQgb2YgZGF0ZXNcbiAgICAgIC8vIHRvIGRlZmluaXRlbHkgZW51bWVyYXRlIHRoZW0uXG4gICAgICBpZiAoIXRoaXMuZXJhQ2FjaGVbbGVuZ3RoXSkge1xuICAgICAgICB0aGlzLmVyYUNhY2hlW2xlbmd0aF0gPSBbRGF0ZVRpbWUudXRjKC00MCwgMSwgMSksIERhdGVUaW1lLnV0YygyMDE3LCAxLCAxKV0ubWFwKChkdCkgPT5cbiAgICAgICAgICB0aGlzLmV4dHJhY3QoZHQsIGludGwsIFwiZXJhXCIpXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmVyYUNhY2hlW2xlbmd0aF07XG4gICAgfSk7XG4gIH1cblxuICBleHRyYWN0KGR0LCBpbnRsT3B0cywgZmllbGQpIHtcbiAgICBjb25zdCBkZiA9IHRoaXMuZHRGb3JtYXR0ZXIoZHQsIGludGxPcHRzKSxcbiAgICAgIHJlc3VsdHMgPSBkZi5mb3JtYXRUb1BhcnRzKCksXG4gICAgICBtYXRjaGluZyA9IHJlc3VsdHMuZmluZCgobSkgPT4gbS50eXBlLnRvTG93ZXJDYXNlKCkgPT09IGZpZWxkKTtcbiAgICByZXR1cm4gbWF0Y2hpbmcgPyBtYXRjaGluZy52YWx1ZSA6IG51bGw7XG4gIH1cblxuICBudW1iZXJGb3JtYXR0ZXIob3B0cyA9IHt9KSB7XG4gICAgLy8gdGhpcyBmb3JjZXNpbXBsZSBvcHRpb24gaXMgbmV2ZXIgdXNlZCAodGhlIG9ubHkgY2FsbGVyIHNob3J0LWNpcmN1aXRzIG9uIGl0LCBidXQgaXQgc2VlbXMgc2FmZXIgdG8gbGVhdmUpXG4gICAgLy8gKGluIGNvbnRyYXN0LCB0aGUgcmVzdCBvZiB0aGUgY29uZGl0aW9uIGlzIHVzZWQgaGVhdmlseSlcbiAgICByZXR1cm4gbmV3IFBvbHlOdW1iZXJGb3JtYXR0ZXIodGhpcy5pbnRsLCBvcHRzLmZvcmNlU2ltcGxlIHx8IHRoaXMuZmFzdE51bWJlcnMsIG9wdHMpO1xuICB9XG5cbiAgZHRGb3JtYXR0ZXIoZHQsIGludGxPcHRzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFBvbHlEYXRlRm9ybWF0dGVyKGR0LCB0aGlzLmludGwsIGludGxPcHRzKTtcbiAgfVxuXG4gIHJlbEZvcm1hdHRlcihvcHRzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFBvbHlSZWxGb3JtYXR0ZXIodGhpcy5pbnRsLCB0aGlzLmlzRW5nbGlzaCgpLCBvcHRzKTtcbiAgfVxuXG4gIGxpc3RGb3JtYXR0ZXIob3B0cyA9IHt9KSB7XG4gICAgcmV0dXJuIGdldENhY2hlZExGKHRoaXMuaW50bCwgb3B0cyk7XG4gIH1cblxuICBpc0VuZ2xpc2goKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMubG9jYWxlID09PSBcImVuXCIgfHxcbiAgICAgIHRoaXMubG9jYWxlLnRvTG93ZXJDYXNlKCkgPT09IFwiZW4tdXNcIiB8fFxuICAgICAgbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGhpcy5pbnRsKS5yZXNvbHZlZE9wdGlvbnMoKS5sb2NhbGUuc3RhcnRzV2l0aChcImVuLXVzXCIpXG4gICAgKTtcbiAgfVxuXG4gIGdldFdlZWtTZXR0aW5ncygpIHtcbiAgICBpZiAodGhpcy53ZWVrU2V0dGluZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLndlZWtTZXR0aW5ncztcbiAgICB9IGVsc2UgaWYgKCFoYXNMb2NhbGVXZWVrSW5mbygpKSB7XG4gICAgICByZXR1cm4gZmFsbGJhY2tXZWVrU2V0dGluZ3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZXRDYWNoZWRXZWVrSW5mbyh0aGlzLmxvY2FsZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0U3RhcnRPZldlZWsoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0V2Vla1NldHRpbmdzKCkuZmlyc3REYXk7XG4gIH1cblxuICBnZXRNaW5EYXlzSW5GaXJzdFdlZWsoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0V2Vla1NldHRpbmdzKCkubWluaW1hbERheXM7XG4gIH1cblxuICBnZXRXZWVrZW5kRGF5cygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRXZWVrU2V0dGluZ3MoKS53ZWVrZW5kO1xuICB9XG5cbiAgZXF1YWxzKG90aGVyKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMubG9jYWxlID09PSBvdGhlci5sb2NhbGUgJiZcbiAgICAgIHRoaXMubnVtYmVyaW5nU3lzdGVtID09PSBvdGhlci5udW1iZXJpbmdTeXN0ZW0gJiZcbiAgICAgIHRoaXMub3V0cHV0Q2FsZW5kYXIgPT09IG90aGVyLm91dHB1dENhbGVuZGFyXG4gICAgKTtcbiAgfVxufVxuXG5sZXQgc2luZ2xldG9uID0gbnVsbDtcblxuLyoqXG4gKiBBIHpvbmUgd2l0aCBhIGZpeGVkIG9mZnNldCAobWVhbmluZyBubyBEU1QpXG4gKiBAaW1wbGVtZW50cyB7Wm9uZX1cbiAqL1xuY2xhc3MgRml4ZWRPZmZzZXRab25lIGV4dGVuZHMgWm9uZSB7XG4gIC8qKlxuICAgKiBHZXQgYSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgVVRDXG4gICAqIEByZXR1cm4ge0ZpeGVkT2Zmc2V0Wm9uZX1cbiAgICovXG4gIHN0YXRpYyBnZXQgdXRjSW5zdGFuY2UoKSB7XG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbCkge1xuICAgICAgc2luZ2xldG9uID0gbmV3IEZpeGVkT2Zmc2V0Wm9uZSgwKTtcbiAgICB9XG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gaW5zdGFuY2Ugd2l0aCBhIHNwZWNpZmllZCBvZmZzZXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCAtIFRoZSBvZmZzZXQgaW4gbWludXRlc1xuICAgKiBAcmV0dXJuIHtGaXhlZE9mZnNldFpvbmV9XG4gICAqL1xuICBzdGF0aWMgaW5zdGFuY2Uob2Zmc2V0KSB7XG4gICAgcmV0dXJuIG9mZnNldCA9PT0gMCA/IEZpeGVkT2Zmc2V0Wm9uZS51dGNJbnN0YW5jZSA6IG5ldyBGaXhlZE9mZnNldFpvbmUob2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gaW5zdGFuY2Ugb2YgRml4ZWRPZmZzZXRab25lIGZyb20gYSBVVEMgb2Zmc2V0IHN0cmluZywgbGlrZSBcIlVUQys2XCJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHMgLSBUaGUgb2Zmc2V0IHN0cmluZyB0byBwYXJzZVxuICAgKiBAZXhhbXBsZSBGaXhlZE9mZnNldFpvbmUucGFyc2VTcGVjaWZpZXIoXCJVVEMrNlwiKVxuICAgKiBAZXhhbXBsZSBGaXhlZE9mZnNldFpvbmUucGFyc2VTcGVjaWZpZXIoXCJVVEMrMDZcIilcbiAgICogQGV4YW1wbGUgRml4ZWRPZmZzZXRab25lLnBhcnNlU3BlY2lmaWVyKFwiVVRDLTY6MDBcIilcbiAgICogQHJldHVybiB7Rml4ZWRPZmZzZXRab25lfVxuICAgKi9cbiAgc3RhdGljIHBhcnNlU3BlY2lmaWVyKHMpIHtcbiAgICBpZiAocykge1xuICAgICAgY29uc3QgciA9IHMubWF0Y2goL151dGMoPzooWystXVxcZHsxLDJ9KSg/OjooXFxkezJ9KSk/KT8kL2kpO1xuICAgICAgaWYgKHIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGaXhlZE9mZnNldFpvbmUoc2lnbmVkT2Zmc2V0KHJbMV0sIHJbMl0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihvZmZzZXQpIHtcbiAgICBzdXBlcigpO1xuICAgIC8qKiBAcHJpdmF0ZSAqKi9cbiAgICB0aGlzLmZpeGVkID0gb2Zmc2V0O1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZ2V0IHR5cGUoKSB7XG4gICAgcmV0dXJuIFwiZml4ZWRcIjtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmZpeGVkID09PSAwID8gXCJVVENcIiA6IGBVVEMke2Zvcm1hdE9mZnNldCh0aGlzLmZpeGVkLCBcIm5hcnJvd1wiKX1gO1xuICB9XG5cbiAgZ2V0IGlhbmFOYW1lKCkge1xuICAgIGlmICh0aGlzLmZpeGVkID09PSAwKSB7XG4gICAgICByZXR1cm4gXCJFdGMvVVRDXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgRXRjL0dNVCR7Zm9ybWF0T2Zmc2V0KC10aGlzLmZpeGVkLCBcIm5hcnJvd1wiKX1gO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIG9mZnNldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGZvcm1hdE9mZnNldCh0cywgZm9ybWF0KSB7XG4gICAgcmV0dXJuIGZvcm1hdE9mZnNldCh0aGlzLmZpeGVkLCBmb3JtYXQpO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZ2V0IGlzVW5pdmVyc2FsKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgb2Zmc2V0KCkge1xuICAgIHJldHVybiB0aGlzLmZpeGVkO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZXF1YWxzKG90aGVyWm9uZSkge1xuICAgIHJldHVybiBvdGhlclpvbmUudHlwZSA9PT0gXCJmaXhlZFwiICYmIG90aGVyWm9uZS5maXhlZCA9PT0gdGhpcy5maXhlZDtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSB6b25lIHRoYXQgZmFpbGVkIHRvIHBhcnNlLiBZb3Ugc2hvdWxkIG5ldmVyIG5lZWQgdG8gaW5zdGFudGlhdGUgdGhpcy5cbiAqIEBpbXBsZW1lbnRzIHtab25lfVxuICovXG5jbGFzcyBJbnZhbGlkWm9uZSBleHRlbmRzIFpvbmUge1xuICBjb25zdHJ1Y3Rvcih6b25lTmFtZSkge1xuICAgIHN1cGVyKCk7XG4gICAgLyoqICBAcHJpdmF0ZSAqL1xuICAgIHRoaXMuem9uZU5hbWUgPSB6b25lTmFtZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCB0eXBlKCkge1xuICAgIHJldHVybiBcImludmFsaWRcIjtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnpvbmVOYW1lO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqKi9cbiAgZ2V0IGlzVW5pdmVyc2FsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIG9mZnNldE5hbWUoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBmb3JtYXRPZmZzZXQoKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBvZmZzZXQoKSB7XG4gICAgcmV0dXJuIE5hTjtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKiovXG4gIGVxdWFscygpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICoqL1xuICBnZXQgaXNWYWxpZCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVpvbmUoaW5wdXQsIGRlZmF1bHRab25lKSB7XG4gIGlmIChpc1VuZGVmaW5lZChpbnB1dCkgfHwgaW5wdXQgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmYXVsdFpvbmU7XG4gIH0gZWxzZSBpZiAoaW5wdXQgaW5zdGFuY2VvZiBab25lKSB7XG4gICAgcmV0dXJuIGlucHV0O1xuICB9IGVsc2UgaWYgKGlzU3RyaW5nKGlucHV0KSkge1xuICAgIGNvbnN0IGxvd2VyZWQgPSBpbnB1dC50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChsb3dlcmVkID09PSBcImRlZmF1bHRcIikgcmV0dXJuIGRlZmF1bHRab25lO1xuICAgIGVsc2UgaWYgKGxvd2VyZWQgPT09IFwibG9jYWxcIiB8fCBsb3dlcmVkID09PSBcInN5c3RlbVwiKSByZXR1cm4gU3lzdGVtWm9uZS5pbnN0YW5jZTtcbiAgICBlbHNlIGlmIChsb3dlcmVkID09PSBcInV0Y1wiIHx8IGxvd2VyZWQgPT09IFwiZ210XCIpIHJldHVybiBGaXhlZE9mZnNldFpvbmUudXRjSW5zdGFuY2U7XG4gICAgZWxzZSByZXR1cm4gRml4ZWRPZmZzZXRab25lLnBhcnNlU3BlY2lmaWVyKGxvd2VyZWQpIHx8IElBTkFab25lLmNyZWF0ZShpbnB1dCk7XG4gIH0gZWxzZSBpZiAoaXNOdW1iZXIoaW5wdXQpKSB7XG4gICAgcmV0dXJuIEZpeGVkT2Zmc2V0Wm9uZS5pbnN0YW5jZShpbnB1dCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSBcIm9iamVjdFwiICYmIFwib2Zmc2V0XCIgaW4gaW5wdXQgJiYgdHlwZW9mIGlucHV0Lm9mZnNldCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gVGhpcyBpcyBkdW1iLCBidXQgdGhlIGluc3RhbmNlb2YgY2hlY2sgYWJvdmUgZG9lc24ndCBzZWVtIHRvIHJlYWxseSB3b3JrXG4gICAgLy8gc28gd2UncmUgZHVjayBjaGVja2luZyBpdFxuICAgIHJldHVybiBpbnB1dDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEludmFsaWRab25lKGlucHV0KTtcbiAgfVxufVxuXG5sZXQgbm93ID0gKCkgPT4gRGF0ZS5ub3coKSxcbiAgZGVmYXVsdFpvbmUgPSBcInN5c3RlbVwiLFxuICBkZWZhdWx0TG9jYWxlID0gbnVsbCxcbiAgZGVmYXVsdE51bWJlcmluZ1N5c3RlbSA9IG51bGwsXG4gIGRlZmF1bHRPdXRwdXRDYWxlbmRhciA9IG51bGwsXG4gIHR3b0RpZ2l0Q3V0b2ZmWWVhciA9IDYwLFxuICB0aHJvd09uSW52YWxpZCxcbiAgZGVmYXVsdFdlZWtTZXR0aW5ncyA9IG51bGw7XG5cbi8qKlxuICogU2V0dGluZ3MgY29udGFpbnMgc3RhdGljIGdldHRlcnMgYW5kIHNldHRlcnMgdGhhdCBjb250cm9sIEx1eG9uJ3Mgb3ZlcmFsbCBiZWhhdmlvci4gTHV4b24gaXMgYSBzaW1wbGUgbGlicmFyeSB3aXRoIGZldyBvcHRpb25zLCBidXQgdGhlIG9uZXMgaXQgZG9lcyBoYXZlIGxpdmUgaGVyZS5cbiAqL1xuY2xhc3MgU2V0dGluZ3Mge1xuICAvKipcbiAgICogR2V0IHRoZSBjYWxsYmFjayBmb3IgcmV0dXJuaW5nIHRoZSBjdXJyZW50IHRpbWVzdGFtcC5cbiAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgKi9cbiAgc3RhdGljIGdldCBub3coKSB7XG4gICAgcmV0dXJuIG5vdztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNhbGxiYWNrIGZvciByZXR1cm5pbmcgdGhlIGN1cnJlbnQgdGltZXN0YW1wLlxuICAgKiBUaGUgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhIG51bWJlciwgd2hpY2ggd2lsbCBiZSBpbnRlcnByZXRlZCBhcyBhbiBFcG9jaCBtaWxsaXNlY29uZCBjb3VudFxuICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAqIEBleGFtcGxlIFNldHRpbmdzLm5vdyA9ICgpID0+IERhdGUubm93KCkgKyAzMDAwIC8vIHByZXRlbmQgaXQgaXMgMyBzZWNvbmRzIGluIHRoZSBmdXR1cmVcbiAgICogQGV4YW1wbGUgU2V0dGluZ3Mubm93ID0gKCkgPT4gMCAvLyBhbHdheXMgcHJldGVuZCBpdCdzIEphbiAxLCAxOTcwIGF0IG1pZG5pZ2h0IGluIFVUQyB0aW1lXG4gICAqL1xuICBzdGF0aWMgc2V0IG5vdyhuKSB7XG4gICAgbm93ID0gbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgdGltZSB6b25lIHRvIGNyZWF0ZSBEYXRlVGltZXMgaW4uIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqIFVzZSB0aGUgdmFsdWUgXCJzeXN0ZW1cIiB0byByZXNldCB0aGlzIHZhbHVlIHRvIHRoZSBzeXN0ZW0ncyB0aW1lIHpvbmUuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBzdGF0aWMgc2V0IGRlZmF1bHRab25lKHpvbmUpIHtcbiAgICBkZWZhdWx0Wm9uZSA9IHpvbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IHRpbWUgem9uZSBvYmplY3QgY3VycmVudGx5IHVzZWQgdG8gY3JlYXRlIERhdGVUaW1lcy4gRG9lcyBub3QgYWZmZWN0IGV4aXN0aW5nIGluc3RhbmNlcy5cbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgaXMgdGhlIHN5c3RlbSdzIHRpbWUgem9uZSAodGhlIG9uZSBzZXQgb24gdGhlIG1hY2hpbmUgdGhhdCBydW5zIHRoaXMgY29kZSkuXG4gICAqIEB0eXBlIHtab25lfVxuICAgKi9cbiAgc3RhdGljIGdldCBkZWZhdWx0Wm9uZSgpIHtcbiAgICByZXR1cm4gbm9ybWFsaXplWm9uZShkZWZhdWx0Wm9uZSwgU3lzdGVtWm9uZS5pbnN0YW5jZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IGxvY2FsZSB0byBjcmVhdGUgRGF0ZVRpbWVzIHdpdGguIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBzdGF0aWMgZ2V0IGRlZmF1bHRMb2NhbGUoKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRMb2NhbGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IGxvY2FsZSB0byBjcmVhdGUgRGF0ZVRpbWVzIHdpdGguIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBzdGF0aWMgc2V0IGRlZmF1bHRMb2NhbGUobG9jYWxlKSB7XG4gICAgZGVmYXVsdExvY2FsZSA9IGxvY2FsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlZmF1bHQgbnVtYmVyaW5nIHN5c3RlbSB0byBjcmVhdGUgRGF0ZVRpbWVzIHdpdGguIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBzdGF0aWMgZ2V0IGRlZmF1bHROdW1iZXJpbmdTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIGRlZmF1bHROdW1iZXJpbmdTeXN0ZW07XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IG51bWJlcmluZyBzeXN0ZW0gdG8gY3JlYXRlIERhdGVUaW1lcyB3aXRoLiBEb2VzIG5vdCBhZmZlY3QgZXhpc3RpbmcgaW5zdGFuY2VzLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgc3RhdGljIHNldCBkZWZhdWx0TnVtYmVyaW5nU3lzdGVtKG51bWJlcmluZ1N5c3RlbSkge1xuICAgIGRlZmF1bHROdW1iZXJpbmdTeXN0ZW0gPSBudW1iZXJpbmdTeXN0ZW07XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IG91dHB1dCBjYWxlbmRhciB0byBjcmVhdGUgRGF0ZVRpbWVzIHdpdGguIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBzdGF0aWMgZ2V0IGRlZmF1bHRPdXRwdXRDYWxlbmRhcigpIHtcbiAgICByZXR1cm4gZGVmYXVsdE91dHB1dENhbGVuZGFyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgZGVmYXVsdCBvdXRwdXQgY2FsZW5kYXIgdG8gY3JlYXRlIERhdGVUaW1lcyB3aXRoLiBEb2VzIG5vdCBhZmZlY3QgZXhpc3RpbmcgaW5zdGFuY2VzLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgc3RhdGljIHNldCBkZWZhdWx0T3V0cHV0Q2FsZW5kYXIob3V0cHV0Q2FsZW5kYXIpIHtcbiAgICBkZWZhdWx0T3V0cHV0Q2FsZW5kYXIgPSBvdXRwdXRDYWxlbmRhcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBXZWVrU2V0dGluZ3NcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IGZpcnN0RGF5XG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBtaW5pbWFsRGF5c1xuICAgKiBAcHJvcGVydHkge251bWJlcltdfSB3ZWVrZW5kXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtXZWVrU2V0dGluZ3N8bnVsbH1cbiAgICovXG4gIHN0YXRpYyBnZXQgZGVmYXVsdFdlZWtTZXR0aW5ncygpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdlZWtTZXR0aW5ncztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyB0aGUgZGVmYXVsdCBsb2NhbGUgd2VlayBzZXR0aW5ncywgaS5lLiB0aGUgc3RhcnQgb2YgdGhlIHdlZWssIHRoZSB3ZWVrZW5kIGFuZFxuICAgKiBob3cgbWFueSBkYXlzIGFyZSByZXF1aXJlZCBpbiB0aGUgZmlyc3Qgd2VlayBvZiBhIHllYXIuXG4gICAqIERvZXMgbm90IGFmZmVjdCBleGlzdGluZyBpbnN0YW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7V2Vla1NldHRpbmdzfG51bGx9IHdlZWtTZXR0aW5nc1xuICAgKi9cbiAgc3RhdGljIHNldCBkZWZhdWx0V2Vla1NldHRpbmdzKHdlZWtTZXR0aW5ncykge1xuICAgIGRlZmF1bHRXZWVrU2V0dGluZ3MgPSB2YWxpZGF0ZVdlZWtTZXR0aW5ncyh3ZWVrU2V0dGluZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3V0b2ZmIHllYXIgYWZ0ZXIgd2hpY2ggYSBzdHJpbmcgZW5jb2RpbmcgYSB5ZWFyIGFzIHR3byBkaWdpdHMgaXMgaW50ZXJwcmV0ZWQgdG8gb2NjdXIgaW4gdGhlIGN1cnJlbnQgY2VudHVyeS5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHN0YXRpYyBnZXQgdHdvRGlnaXRDdXRvZmZZZWFyKCkge1xuICAgIHJldHVybiB0d29EaWdpdEN1dG9mZlllYXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjdXRvZmYgeWVhciBhZnRlciB3aGljaCBhIHN0cmluZyBlbmNvZGluZyBhIHllYXIgYXMgdHdvIGRpZ2l0cyBpcyBpbnRlcnByZXRlZCB0byBvY2N1ciBpbiB0aGUgY3VycmVudCBjZW50dXJ5LlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKiBAZXhhbXBsZSBTZXR0aW5ncy50d29EaWdpdEN1dG9mZlllYXIgPSAwIC8vIGN1dC1vZmYgeWVhciBpcyAwLCBzbyBhbGwgJ3l5JyBhcmUgaW50ZXJwcmV0ZWQgYXMgY3VycmVudCBjZW50dXJ5XG4gICAqIEBleGFtcGxlIFNldHRpbmdzLnR3b0RpZ2l0Q3V0b2ZmWWVhciA9IDUwIC8vICc0OScgLT4gMTk0OTsgJzUwJyAtPiAyMDUwXG4gICAqIEBleGFtcGxlIFNldHRpbmdzLnR3b0RpZ2l0Q3V0b2ZmWWVhciA9IDE5NTAgLy8gaW50ZXJwcmV0ZWQgYXMgNTBcbiAgICogQGV4YW1wbGUgU2V0dGluZ3MudHdvRGlnaXRDdXRvZmZZZWFyID0gMjA1MCAvLyBBTFNPIGludGVycHJldGVkIGFzIDUwXG4gICAqL1xuICBzdGF0aWMgc2V0IHR3b0RpZ2l0Q3V0b2ZmWWVhcihjdXRvZmZZZWFyKSB7XG4gICAgdHdvRGlnaXRDdXRvZmZZZWFyID0gY3V0b2ZmWWVhciAlIDEwMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciBMdXhvbiB3aWxsIHRocm93IHdoZW4gaXQgZW5jb3VudGVycyBpbnZhbGlkIERhdGVUaW1lcywgRHVyYXRpb25zLCBvciBJbnRlcnZhbHNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgZ2V0IHRocm93T25JbnZhbGlkKCkge1xuICAgIHJldHVybiB0aHJvd09uSW52YWxpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciBMdXhvbiB3aWxsIHRocm93IHdoZW4gaXQgZW5jb3VudGVycyBpbnZhbGlkIERhdGVUaW1lcywgRHVyYXRpb25zLCBvciBJbnRlcnZhbHNcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgc2V0IHRocm93T25JbnZhbGlkKHQpIHtcbiAgICB0aHJvd09uSW52YWxpZCA9IHQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgTHV4b24ncyBnbG9iYWwgY2FjaGVzLiBTaG91bGQgb25seSBiZSBuZWNlc3NhcnkgaW4gdGVzdGluZyBzY2VuYXJpb3MuXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICBzdGF0aWMgcmVzZXRDYWNoZXMoKSB7XG4gICAgTG9jYWxlLnJlc2V0Q2FjaGUoKTtcbiAgICBJQU5BWm9uZS5yZXNldENhY2hlKCk7XG4gIH1cbn1cblxuY2xhc3MgSW52YWxpZCB7XG4gIGNvbnN0cnVjdG9yKHJlYXNvbiwgZXhwbGFuYXRpb24pIHtcbiAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICB0aGlzLmV4cGxhbmF0aW9uID0gZXhwbGFuYXRpb247XG4gIH1cblxuICB0b01lc3NhZ2UoKSB7XG4gICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLnJlYXNvbn06ICR7dGhpcy5leHBsYW5hdGlvbn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWFzb247XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IG5vbkxlYXBMYWRkZXIgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdLFxuICBsZWFwTGFkZGVyID0gWzAsIDMxLCA2MCwgOTEsIDEyMSwgMTUyLCAxODIsIDIxMywgMjQ0LCAyNzQsIDMwNSwgMzM1XTtcblxuZnVuY3Rpb24gdW5pdE91dE9mUmFuZ2UodW5pdCwgdmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBJbnZhbGlkKFxuICAgIFwidW5pdCBvdXQgb2YgcmFuZ2VcIixcbiAgICBgeW91IHNwZWNpZmllZCAke3ZhbHVlfSAob2YgdHlwZSAke3R5cGVvZiB2YWx1ZX0pIGFzIGEgJHt1bml0fSwgd2hpY2ggaXMgaW52YWxpZGBcbiAgKTtcbn1cblxuZnVuY3Rpb24gZGF5T2ZXZWVrKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoIC0gMSwgZGF5KSk7XG5cbiAgaWYgKHllYXIgPCAxMDAgJiYgeWVhciA+PSAwKSB7XG4gICAgZC5zZXRVVENGdWxsWWVhcihkLmdldFVUQ0Z1bGxZZWFyKCkgLSAxOTAwKTtcbiAgfVxuXG4gIGNvbnN0IGpzID0gZC5nZXRVVENEYXkoKTtcblxuICByZXR1cm4ganMgPT09IDAgPyA3IDoganM7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVPcmRpbmFsKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgcmV0dXJuIGRheSArIChpc0xlYXBZZWFyKHllYXIpID8gbGVhcExhZGRlciA6IG5vbkxlYXBMYWRkZXIpW21vbnRoIC0gMV07XG59XG5cbmZ1bmN0aW9uIHVuY29tcHV0ZU9yZGluYWwoeWVhciwgb3JkaW5hbCkge1xuICBjb25zdCB0YWJsZSA9IGlzTGVhcFllYXIoeWVhcikgPyBsZWFwTGFkZGVyIDogbm9uTGVhcExhZGRlcixcbiAgICBtb250aDAgPSB0YWJsZS5maW5kSW5kZXgoKGkpID0+IGkgPCBvcmRpbmFsKSxcbiAgICBkYXkgPSBvcmRpbmFsIC0gdGFibGVbbW9udGgwXTtcbiAgcmV0dXJuIHsgbW9udGg6IG1vbnRoMCArIDEsIGRheSB9O1xufVxuXG5mdW5jdGlvbiBpc29XZWVrZGF5VG9Mb2NhbChpc29XZWVrZGF5LCBzdGFydE9mV2Vlaykge1xuICByZXR1cm4gKChpc29XZWVrZGF5IC0gc3RhcnRPZldlZWsgKyA3KSAlIDcpICsgMTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdyZWdvcmlhblRvV2VlayhncmVnT2JqLCBtaW5EYXlzSW5GaXJzdFdlZWsgPSA0LCBzdGFydE9mV2VlayA9IDEpIHtcbiAgY29uc3QgeyB5ZWFyLCBtb250aCwgZGF5IH0gPSBncmVnT2JqLFxuICAgIG9yZGluYWwgPSBjb21wdXRlT3JkaW5hbCh5ZWFyLCBtb250aCwgZGF5KSxcbiAgICB3ZWVrZGF5ID0gaXNvV2Vla2RheVRvTG9jYWwoZGF5T2ZXZWVrKHllYXIsIG1vbnRoLCBkYXkpLCBzdGFydE9mV2Vlayk7XG5cbiAgbGV0IHdlZWtOdW1iZXIgPSBNYXRoLmZsb29yKChvcmRpbmFsIC0gd2Vla2RheSArIDE0IC0gbWluRGF5c0luRmlyc3RXZWVrKSAvIDcpLFxuICAgIHdlZWtZZWFyO1xuXG4gIGlmICh3ZWVrTnVtYmVyIDwgMSkge1xuICAgIHdlZWtZZWFyID0geWVhciAtIDE7XG4gICAgd2Vla051bWJlciA9IHdlZWtzSW5XZWVrWWVhcih3ZWVrWWVhciwgbWluRGF5c0luRmlyc3RXZWVrLCBzdGFydE9mV2Vlayk7XG4gIH0gZWxzZSBpZiAod2Vla051bWJlciA+IHdlZWtzSW5XZWVrWWVhcih5ZWFyLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKSkge1xuICAgIHdlZWtZZWFyID0geWVhciArIDE7XG4gICAgd2Vla051bWJlciA9IDE7XG4gIH0gZWxzZSB7XG4gICAgd2Vla1llYXIgPSB5ZWFyO1xuICB9XG5cbiAgcmV0dXJuIHsgd2Vla1llYXIsIHdlZWtOdW1iZXIsIHdlZWtkYXksIC4uLnRpbWVPYmplY3QoZ3JlZ09iaikgfTtcbn1cblxuZnVuY3Rpb24gd2Vla1RvR3JlZ29yaWFuKHdlZWtEYXRhLCBtaW5EYXlzSW5GaXJzdFdlZWsgPSA0LCBzdGFydE9mV2VlayA9IDEpIHtcbiAgY29uc3QgeyB3ZWVrWWVhciwgd2Vla051bWJlciwgd2Vla2RheSB9ID0gd2Vla0RhdGEsXG4gICAgd2Vla2RheU9mSmFuNCA9IGlzb1dlZWtkYXlUb0xvY2FsKGRheU9mV2Vlayh3ZWVrWWVhciwgMSwgbWluRGF5c0luRmlyc3RXZWVrKSwgc3RhcnRPZldlZWspLFxuICAgIHllYXJJbkRheXMgPSBkYXlzSW5ZZWFyKHdlZWtZZWFyKTtcblxuICBsZXQgb3JkaW5hbCA9IHdlZWtOdW1iZXIgKiA3ICsgd2Vla2RheSAtIHdlZWtkYXlPZkphbjQgLSA3ICsgbWluRGF5c0luRmlyc3RXZWVrLFxuICAgIHllYXI7XG5cbiAgaWYgKG9yZGluYWwgPCAxKSB7XG4gICAgeWVhciA9IHdlZWtZZWFyIC0gMTtcbiAgICBvcmRpbmFsICs9IGRheXNJblllYXIoeWVhcik7XG4gIH0gZWxzZSBpZiAob3JkaW5hbCA+IHllYXJJbkRheXMpIHtcbiAgICB5ZWFyID0gd2Vla1llYXIgKyAxO1xuICAgIG9yZGluYWwgLT0gZGF5c0luWWVhcih3ZWVrWWVhcik7XG4gIH0gZWxzZSB7XG4gICAgeWVhciA9IHdlZWtZZWFyO1xuICB9XG5cbiAgY29uc3QgeyBtb250aCwgZGF5IH0gPSB1bmNvbXB1dGVPcmRpbmFsKHllYXIsIG9yZGluYWwpO1xuICByZXR1cm4geyB5ZWFyLCBtb250aCwgZGF5LCAuLi50aW1lT2JqZWN0KHdlZWtEYXRhKSB9O1xufVxuXG5mdW5jdGlvbiBncmVnb3JpYW5Ub09yZGluYWwoZ3JlZ0RhdGEpIHtcbiAgY29uc3QgeyB5ZWFyLCBtb250aCwgZGF5IH0gPSBncmVnRGF0YTtcbiAgY29uc3Qgb3JkaW5hbCA9IGNvbXB1dGVPcmRpbmFsKHllYXIsIG1vbnRoLCBkYXkpO1xuICByZXR1cm4geyB5ZWFyLCBvcmRpbmFsLCAuLi50aW1lT2JqZWN0KGdyZWdEYXRhKSB9O1xufVxuXG5mdW5jdGlvbiBvcmRpbmFsVG9HcmVnb3JpYW4ob3JkaW5hbERhdGEpIHtcbiAgY29uc3QgeyB5ZWFyLCBvcmRpbmFsIH0gPSBvcmRpbmFsRGF0YTtcbiAgY29uc3QgeyBtb250aCwgZGF5IH0gPSB1bmNvbXB1dGVPcmRpbmFsKHllYXIsIG9yZGluYWwpO1xuICByZXR1cm4geyB5ZWFyLCBtb250aCwgZGF5LCAuLi50aW1lT2JqZWN0KG9yZGluYWxEYXRhKSB9O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGxvY2FsIHdlZWsgdW5pdHMgbGlrZSBsb2NhbFdlZWtkYXkgYXJlIHVzZWQgaW4gb2JqLlxuICogSWYgc28sIHZhbGlkYXRlcyB0aGF0IHRoZXkgYXJlIG5vdCBtaXhlZCB3aXRoIElTTyB3ZWVrIHVuaXRzIGFuZCB0aGVuIGNvcGllcyB0aGVtIHRvIHRoZSBub3JtYWwgd2VlayB1bml0IHByb3BlcnRpZXMuXG4gKiBNb2RpZmllcyBvYmogaW4tcGxhY2UhXG4gKiBAcGFyYW0gb2JqIHRoZSBvYmplY3QgdmFsdWVzXG4gKi9cbmZ1bmN0aW9uIHVzZXNMb2NhbFdlZWtWYWx1ZXMob2JqLCBsb2MpIHtcbiAgY29uc3QgaGFzTG9jYWxlV2Vla0RhdGEgPVxuICAgICFpc1VuZGVmaW5lZChvYmoubG9jYWxXZWVrZGF5KSB8fFxuICAgICFpc1VuZGVmaW5lZChvYmoubG9jYWxXZWVrTnVtYmVyKSB8fFxuICAgICFpc1VuZGVmaW5lZChvYmoubG9jYWxXZWVrWWVhcik7XG4gIGlmIChoYXNMb2NhbGVXZWVrRGF0YSkge1xuICAgIGNvbnN0IGhhc0lzb1dlZWtEYXRhID1cbiAgICAgICFpc1VuZGVmaW5lZChvYmoud2Vla2RheSkgfHwgIWlzVW5kZWZpbmVkKG9iai53ZWVrTnVtYmVyKSB8fCAhaXNVbmRlZmluZWQob2JqLndlZWtZZWFyKTtcblxuICAgIGlmIChoYXNJc29XZWVrRGF0YSkge1xuICAgICAgdGhyb3cgbmV3IENvbmZsaWN0aW5nU3BlY2lmaWNhdGlvbkVycm9yKFxuICAgICAgICBcIkNhbm5vdCBtaXggbG9jYWxlLWJhc2VkIHdlZWsgZmllbGRzIHdpdGggSVNPLWJhc2VkIHdlZWsgZmllbGRzXCJcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQob2JqLmxvY2FsV2Vla2RheSkpIG9iai53ZWVrZGF5ID0gb2JqLmxvY2FsV2Vla2RheTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKG9iai5sb2NhbFdlZWtOdW1iZXIpKSBvYmoud2Vla051bWJlciA9IG9iai5sb2NhbFdlZWtOdW1iZXI7XG4gICAgaWYgKCFpc1VuZGVmaW5lZChvYmoubG9jYWxXZWVrWWVhcikpIG9iai53ZWVrWWVhciA9IG9iai5sb2NhbFdlZWtZZWFyO1xuICAgIGRlbGV0ZSBvYmoubG9jYWxXZWVrZGF5O1xuICAgIGRlbGV0ZSBvYmoubG9jYWxXZWVrTnVtYmVyO1xuICAgIGRlbGV0ZSBvYmoubG9jYWxXZWVrWWVhcjtcbiAgICByZXR1cm4ge1xuICAgICAgbWluRGF5c0luRmlyc3RXZWVrOiBsb2MuZ2V0TWluRGF5c0luRmlyc3RXZWVrKCksXG4gICAgICBzdGFydE9mV2VlazogbG9jLmdldFN0YXJ0T2ZXZWVrKCksXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4geyBtaW5EYXlzSW5GaXJzdFdlZWs6IDQsIHN0YXJ0T2ZXZWVrOiAxIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzSW52YWxpZFdlZWtEYXRhKG9iaiwgbWluRGF5c0luRmlyc3RXZWVrID0gNCwgc3RhcnRPZldlZWsgPSAxKSB7XG4gIGNvbnN0IHZhbGlkWWVhciA9IGlzSW50ZWdlcihvYmoud2Vla1llYXIpLFxuICAgIHZhbGlkV2VlayA9IGludGVnZXJCZXR3ZWVuKFxuICAgICAgb2JqLndlZWtOdW1iZXIsXG4gICAgICAxLFxuICAgICAgd2Vla3NJbldlZWtZZWFyKG9iai53ZWVrWWVhciwgbWluRGF5c0luRmlyc3RXZWVrLCBzdGFydE9mV2VlaylcbiAgICApLFxuICAgIHZhbGlkV2Vla2RheSA9IGludGVnZXJCZXR3ZWVuKG9iai53ZWVrZGF5LCAxLCA3KTtcblxuICBpZiAoIXZhbGlkWWVhcikge1xuICAgIHJldHVybiB1bml0T3V0T2ZSYW5nZShcIndlZWtZZWFyXCIsIG9iai53ZWVrWWVhcik7XG4gIH0gZWxzZSBpZiAoIXZhbGlkV2Vlaykge1xuICAgIHJldHVybiB1bml0T3V0T2ZSYW5nZShcIndlZWtcIiwgb2JqLndlZWtOdW1iZXIpO1xuICB9IGVsc2UgaWYgKCF2YWxpZFdlZWtkYXkpIHtcbiAgICByZXR1cm4gdW5pdE91dE9mUmFuZ2UoXCJ3ZWVrZGF5XCIsIG9iai53ZWVrZGF5KTtcbiAgfSBlbHNlIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaGFzSW52YWxpZE9yZGluYWxEYXRhKG9iaikge1xuICBjb25zdCB2YWxpZFllYXIgPSBpc0ludGVnZXIob2JqLnllYXIpLFxuICAgIHZhbGlkT3JkaW5hbCA9IGludGVnZXJCZXR3ZWVuKG9iai5vcmRpbmFsLCAxLCBkYXlzSW5ZZWFyKG9iai55ZWFyKSk7XG5cbiAgaWYgKCF2YWxpZFllYXIpIHtcbiAgICByZXR1cm4gdW5pdE91dE9mUmFuZ2UoXCJ5ZWFyXCIsIG9iai55ZWFyKTtcbiAgfSBlbHNlIGlmICghdmFsaWRPcmRpbmFsKSB7XG4gICAgcmV0dXJuIHVuaXRPdXRPZlJhbmdlKFwib3JkaW5hbFwiLCBvYmoub3JkaW5hbCk7XG4gIH0gZWxzZSByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGhhc0ludmFsaWRHcmVnb3JpYW5EYXRhKG9iaikge1xuICBjb25zdCB2YWxpZFllYXIgPSBpc0ludGVnZXIob2JqLnllYXIpLFxuICAgIHZhbGlkTW9udGggPSBpbnRlZ2VyQmV0d2VlbihvYmoubW9udGgsIDEsIDEyKSxcbiAgICB2YWxpZERheSA9IGludGVnZXJCZXR3ZWVuKG9iai5kYXksIDEsIGRheXNJbk1vbnRoKG9iai55ZWFyLCBvYmoubW9udGgpKTtcblxuICBpZiAoIXZhbGlkWWVhcikge1xuICAgIHJldHVybiB1bml0T3V0T2ZSYW5nZShcInllYXJcIiwgb2JqLnllYXIpO1xuICB9IGVsc2UgaWYgKCF2YWxpZE1vbnRoKSB7XG4gICAgcmV0dXJuIHVuaXRPdXRPZlJhbmdlKFwibW9udGhcIiwgb2JqLm1vbnRoKTtcbiAgfSBlbHNlIGlmICghdmFsaWREYXkpIHtcbiAgICByZXR1cm4gdW5pdE91dE9mUmFuZ2UoXCJkYXlcIiwgb2JqLmRheSk7XG4gIH0gZWxzZSByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGhhc0ludmFsaWRUaW1lRGF0YShvYmopIHtcbiAgY29uc3QgeyBob3VyLCBtaW51dGUsIHNlY29uZCwgbWlsbGlzZWNvbmQgfSA9IG9iajtcbiAgY29uc3QgdmFsaWRIb3VyID1cbiAgICAgIGludGVnZXJCZXR3ZWVuKGhvdXIsIDAsIDIzKSB8fFxuICAgICAgKGhvdXIgPT09IDI0ICYmIG1pbnV0ZSA9PT0gMCAmJiBzZWNvbmQgPT09IDAgJiYgbWlsbGlzZWNvbmQgPT09IDApLFxuICAgIHZhbGlkTWludXRlID0gaW50ZWdlckJldHdlZW4obWludXRlLCAwLCA1OSksXG4gICAgdmFsaWRTZWNvbmQgPSBpbnRlZ2VyQmV0d2VlbihzZWNvbmQsIDAsIDU5KSxcbiAgICB2YWxpZE1pbGxpc2Vjb25kID0gaW50ZWdlckJldHdlZW4obWlsbGlzZWNvbmQsIDAsIDk5OSk7XG5cbiAgaWYgKCF2YWxpZEhvdXIpIHtcbiAgICByZXR1cm4gdW5pdE91dE9mUmFuZ2UoXCJob3VyXCIsIGhvdXIpO1xuICB9IGVsc2UgaWYgKCF2YWxpZE1pbnV0ZSkge1xuICAgIHJldHVybiB1bml0T3V0T2ZSYW5nZShcIm1pbnV0ZVwiLCBtaW51dGUpO1xuICB9IGVsc2UgaWYgKCF2YWxpZFNlY29uZCkge1xuICAgIHJldHVybiB1bml0T3V0T2ZSYW5nZShcInNlY29uZFwiLCBzZWNvbmQpO1xuICB9IGVsc2UgaWYgKCF2YWxpZE1pbGxpc2Vjb25kKSB7XG4gICAgcmV0dXJuIHVuaXRPdXRPZlJhbmdlKFwibWlsbGlzZWNvbmRcIiwgbWlsbGlzZWNvbmQpO1xuICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xufVxuXG4vKlxuICBUaGlzIGlzIGp1c3QgYSBqdW5rIGRyYXdlciwgY29udGFpbmluZyBhbnl0aGluZyB1c2VkIGFjcm9zcyBtdWx0aXBsZSBjbGFzc2VzLlxuICBCZWNhdXNlIEx1eG9uIGlzIHNtYWxsKGlzaCksIHRoaXMgc2hvdWxkIHN0YXkgc21hbGwgYW5kIHdlIHdvbid0IHdvcnJ5IGFib3V0IHNwbGl0dGluZ1xuICBpdCB1cCBpbnRvLCBzYXksIHBhcnNpbmdVdGlsLmpzIGFuZCBiYXNpY1V0aWwuanMgYW5kIHNvIG9uLiBCdXQgdGhleSBhcmUgZGl2aWRlZCB1cCBieSBmZWF0dXJlIGFyZWEuXG4qL1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKi9cblxuLy8gVFlQRVNcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQobykge1xuICByZXR1cm4gdHlwZW9mIG8gPT09IFwidW5kZWZpbmVkXCI7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKG8pIHtcbiAgcmV0dXJuIHR5cGVvZiBvID09PSBcIm51bWJlclwiO1xufVxuXG5mdW5jdGlvbiBpc0ludGVnZXIobykge1xuICByZXR1cm4gdHlwZW9mIG8gPT09IFwibnVtYmVyXCIgJiYgbyAlIDEgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKG8pIHtcbiAgcmV0dXJuIHR5cGVvZiBvID09PSBcInN0cmluZ1wiO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pID09PSBcIltvYmplY3QgRGF0ZV1cIjtcbn1cblxuLy8gQ0FQQUJJTElUSUVTXG5cbmZ1bmN0aW9uIGhhc1JlbGF0aXZlKCkge1xuICB0cnkge1xuICAgIHJldHVybiB0eXBlb2YgSW50bCAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhIUludGwuUmVsYXRpdmVUaW1lRm9ybWF0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc0xvY2FsZVdlZWtJbmZvKCkge1xuICB0cnkge1xuICAgIHJldHVybiAoXG4gICAgICB0eXBlb2YgSW50bCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgISFJbnRsLkxvY2FsZSAmJlxuICAgICAgKFwid2Vla0luZm9cIiBpbiBJbnRsLkxvY2FsZS5wcm90b3R5cGUgfHwgXCJnZXRXZWVrSW5mb1wiIGluIEludGwuTG9jYWxlLnByb3RvdHlwZSlcbiAgICApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIE9CSkVDVFMgQU5EIEFSUkFZU1xuXG5mdW5jdGlvbiBtYXliZUFycmF5KHRoaW5nKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHRoaW5nKSA/IHRoaW5nIDogW3RoaW5nXTtcbn1cblxuZnVuY3Rpb24gYmVzdEJ5KGFyciwgYnksIGNvbXBhcmUpIHtcbiAgaWYgKGFyci5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiBhcnIucmVkdWNlKChiZXN0LCBuZXh0KSA9PiB7XG4gICAgY29uc3QgcGFpciA9IFtieShuZXh0KSwgbmV4dF07XG4gICAgaWYgKCFiZXN0KSB7XG4gICAgICByZXR1cm4gcGFpcjtcbiAgICB9IGVsc2UgaWYgKGNvbXBhcmUoYmVzdFswXSwgcGFpclswXSkgPT09IGJlc3RbMF0pIHtcbiAgICAgIHJldHVybiBiZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGFpcjtcbiAgICB9XG4gIH0sIG51bGwpWzFdO1xufVxuXG5mdW5jdGlvbiBwaWNrKG9iaiwga2V5cykge1xuICByZXR1cm4ga2V5cy5yZWR1Y2UoKGEsIGspID0+IHtcbiAgICBhW2tdID0gb2JqW2tdO1xuICAgIHJldHVybiBhO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlV2Vla1NldHRpbmdzKHNldHRpbmdzKSB7XG4gIGlmIChzZXR0aW5ncyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNldHRpbmdzICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudEVycm9yKFwiV2VlayBzZXR0aW5ncyBtdXN0IGJlIGFuIG9iamVjdFwiKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoXG4gICAgICAhaW50ZWdlckJldHdlZW4oc2V0dGluZ3MuZmlyc3REYXksIDEsIDcpIHx8XG4gICAgICAhaW50ZWdlckJldHdlZW4oc2V0dGluZ3MubWluaW1hbERheXMsIDEsIDcpIHx8XG4gICAgICAhQXJyYXkuaXNBcnJheShzZXR0aW5ncy53ZWVrZW5kKSB8fFxuICAgICAgc2V0dGluZ3Mud2Vla2VuZC5zb21lKCh2KSA9PiAhaW50ZWdlckJldHdlZW4odiwgMSwgNykpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXCJJbnZhbGlkIHdlZWsgc2V0dGluZ3NcIik7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmaXJzdERheTogc2V0dGluZ3MuZmlyc3REYXksXG4gICAgICBtaW5pbWFsRGF5czogc2V0dGluZ3MubWluaW1hbERheXMsXG4gICAgICB3ZWVrZW5kOiBBcnJheS5mcm9tKHNldHRpbmdzLndlZWtlbmQpLFxuICAgIH07XG4gIH1cbn1cblxuLy8gTlVNQkVSUyBBTkQgU1RSSU5HU1xuXG5mdW5jdGlvbiBpbnRlZ2VyQmV0d2Vlbih0aGluZywgYm90dG9tLCB0b3ApIHtcbiAgcmV0dXJuIGlzSW50ZWdlcih0aGluZykgJiYgdGhpbmcgPj0gYm90dG9tICYmIHRoaW5nIDw9IHRvcDtcbn1cblxuLy8geCAlIG4gYnV0IHRha2VzIHRoZSBzaWduIG9mIG4gaW5zdGVhZCBvZiB4XG5mdW5jdGlvbiBmbG9vck1vZCh4LCBuKSB7XG4gIHJldHVybiB4IC0gbiAqIE1hdGguZmxvb3IoeCAvIG4pO1xufVxuXG5mdW5jdGlvbiBwYWRTdGFydChpbnB1dCwgbiA9IDIpIHtcbiAgY29uc3QgaXNOZWcgPSBpbnB1dCA8IDA7XG4gIGxldCBwYWRkZWQ7XG4gIGlmIChpc05lZykge1xuICAgIHBhZGRlZCA9IFwiLVwiICsgKFwiXCIgKyAtaW5wdXQpLnBhZFN0YXJ0KG4sIFwiMFwiKTtcbiAgfSBlbHNlIHtcbiAgICBwYWRkZWQgPSAoXCJcIiArIGlucHV0KS5wYWRTdGFydChuLCBcIjBcIik7XG4gIH1cbiAgcmV0dXJuIHBhZGRlZDtcbn1cblxuZnVuY3Rpb24gcGFyc2VJbnRlZ2VyKHN0cmluZykge1xuICBpZiAoaXNVbmRlZmluZWQoc3RyaW5nKSB8fCBzdHJpbmcgPT09IG51bGwgfHwgc3RyaW5nID09PSBcIlwiKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGFyc2VJbnQoc3RyaW5nLCAxMCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VGbG9hdGluZyhzdHJpbmcpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHN0cmluZykgfHwgc3RyaW5nID09PSBudWxsIHx8IHN0cmluZyA9PT0gXCJcIikge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoc3RyaW5nKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZU1pbGxpcyhmcmFjdGlvbikge1xuICAvLyBSZXR1cm4gdW5kZWZpbmVkIChpbnN0ZWFkIG9mIDApIGluIHRoZXNlIGNhc2VzLCB3aGVyZSBmcmFjdGlvbiBpcyBub3Qgc2V0XG4gIGlmIChpc1VuZGVmaW5lZChmcmFjdGlvbikgfHwgZnJhY3Rpb24gPT09IG51bGwgfHwgZnJhY3Rpb24gPT09IFwiXCIpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGYgPSBwYXJzZUZsb2F0KFwiMC5cIiArIGZyYWN0aW9uKSAqIDEwMDA7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRpZ2l0cywgdG93YXJkWmVybyA9IGZhbHNlKSB7XG4gIGNvbnN0IGZhY3RvciA9IDEwICoqIGRpZ2l0cyxcbiAgICByb3VuZGVyID0gdG93YXJkWmVybyA/IE1hdGgudHJ1bmMgOiBNYXRoLnJvdW5kO1xuICByZXR1cm4gcm91bmRlcihudW1iZXIgKiBmYWN0b3IpIC8gZmFjdG9yO1xufVxuXG4vLyBEQVRFIEJBU0lDU1xuXG5mdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgcmV0dXJuIHllYXIgJSA0ID09PSAwICYmICh5ZWFyICUgMTAwICE9PSAwIHx8IHllYXIgJSA0MDAgPT09IDApO1xufVxuXG5mdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcbiAgcmV0dXJuIGlzTGVhcFllYXIoeWVhcikgPyAzNjYgOiAzNjU7XG59XG5cbmZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gIGNvbnN0IG1vZE1vbnRoID0gZmxvb3JNb2QobW9udGggLSAxLCAxMikgKyAxLFxuICAgIG1vZFllYXIgPSB5ZWFyICsgKG1vbnRoIC0gbW9kTW9udGgpIC8gMTI7XG5cbiAgaWYgKG1vZE1vbnRoID09PSAyKSB7XG4gICAgcmV0dXJuIGlzTGVhcFllYXIobW9kWWVhcikgPyAyOSA6IDI4O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbMzEsIG51bGwsIDMxLCAzMCwgMzEsIDMwLCAzMSwgMzEsIDMwLCAzMSwgMzAsIDMxXVttb2RNb250aCAtIDFdO1xuICB9XG59XG5cbi8vIGNvbnZlcnQgYSBjYWxlbmRhciBvYmplY3QgdG8gYSBsb2NhbCB0aW1lc3RhbXAgKGVwb2NoLCBidXQgd2l0aCB0aGUgb2Zmc2V0IGJha2VkIGluKVxuZnVuY3Rpb24gb2JqVG9Mb2NhbFRTKG9iaikge1xuICBsZXQgZCA9IERhdGUuVVRDKFxuICAgIG9iai55ZWFyLFxuICAgIG9iai5tb250aCAtIDEsXG4gICAgb2JqLmRheSxcbiAgICBvYmouaG91cixcbiAgICBvYmoubWludXRlLFxuICAgIG9iai5zZWNvbmQsXG4gICAgb2JqLm1pbGxpc2Vjb25kXG4gICk7XG5cbiAgLy8gZm9yIGxlZ2FjeSByZWFzb25zLCB5ZWFycyBiZXR3ZWVuIDAgYW5kIDk5IGFyZSBpbnRlcnByZXRlZCBhcyAxOVhYOyByZXZlcnQgdGhhdFxuICBpZiAob2JqLnllYXIgPCAxMDAgJiYgb2JqLnllYXIgPj0gMCkge1xuICAgIGQgPSBuZXcgRGF0ZShkKTtcbiAgICAvLyBzZXQgdGhlIG1vbnRoIGFuZCBkYXkgYWdhaW4sIHRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgeWVhciAyMDAwIGlzIGEgbGVhcCB5ZWFyLCBidXQgeWVhciAxMDAgaXMgbm90XG4gICAgLy8gc28gaWYgb2JqLnllYXIgaXMgaW4gOTksIGJ1dCBvYmouZGF5IG1ha2VzIGl0IHJvbGwgb3ZlciBpbnRvIHllYXIgMTAwLFxuICAgIC8vIHRoZSBjYWxjdWxhdGlvbnMgZG9uZSBieSBEYXRlLlVUQyBhcmUgdXNpbmcgeWVhciAyMDAwIC0gd2hpY2ggaXMgaW5jb3JyZWN0XG4gICAgZC5zZXRVVENGdWxsWWVhcihvYmoueWVhciwgb2JqLm1vbnRoIC0gMSwgb2JqLmRheSk7XG4gIH1cbiAgcmV0dXJuICtkO1xufVxuXG4vLyBhZGFwdGVkIGZyb20gbW9tZW50LmpzOiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9ibG9iLzAwMGFjMTgwMGU2MjBmNzcwZjRlYjMxYjVhZTkwOGY2MTY3YjBhYjIvc3JjL2xpYi91bml0cy93ZWVrLWNhbGVuZGFyLXV0aWxzLmpzXG5mdW5jdGlvbiBmaXJzdFdlZWtPZmZzZXQoeWVhciwgbWluRGF5c0luRmlyc3RXZWVrLCBzdGFydE9mV2Vlaykge1xuICBjb25zdCBmd2RsdyA9IGlzb1dlZWtkYXlUb0xvY2FsKGRheU9mV2Vlayh5ZWFyLCAxLCBtaW5EYXlzSW5GaXJzdFdlZWspLCBzdGFydE9mV2Vlayk7XG4gIHJldHVybiAtZndkbHcgKyBtaW5EYXlzSW5GaXJzdFdlZWsgLSAxO1xufVxuXG5mdW5jdGlvbiB3ZWVrc0luV2Vla1llYXIod2Vla1llYXIsIG1pbkRheXNJbkZpcnN0V2VlayA9IDQsIHN0YXJ0T2ZXZWVrID0gMSkge1xuICBjb25zdCB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHdlZWtZZWFyLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKTtcbiAgY29uc3Qgd2Vla09mZnNldE5leHQgPSBmaXJzdFdlZWtPZmZzZXQod2Vla1llYXIgKyAxLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKTtcbiAgcmV0dXJuIChkYXlzSW5ZZWFyKHdlZWtZZWFyKSAtIHdlZWtPZmZzZXQgKyB3ZWVrT2Zmc2V0TmV4dCkgLyA3O1xufVxuXG5mdW5jdGlvbiB1bnRydW5jYXRlWWVhcih5ZWFyKSB7XG4gIGlmICh5ZWFyID4gOTkpIHtcbiAgICByZXR1cm4geWVhcjtcbiAgfSBlbHNlIHJldHVybiB5ZWFyID4gU2V0dGluZ3MudHdvRGlnaXRDdXRvZmZZZWFyID8gMTkwMCArIHllYXIgOiAyMDAwICsgeWVhcjtcbn1cblxuLy8gUEFSU0lOR1xuXG5mdW5jdGlvbiBwYXJzZVpvbmVJbmZvKHRzLCBvZmZzZXRGb3JtYXQsIGxvY2FsZSwgdGltZVpvbmUgPSBudWxsKSB7XG4gIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh0cyksXG4gICAgaW50bE9wdHMgPSB7XG4gICAgICBob3VyQ3ljbGU6IFwiaDIzXCIsXG4gICAgICB5ZWFyOiBcIm51bWVyaWNcIixcbiAgICAgIG1vbnRoOiBcIjItZGlnaXRcIixcbiAgICAgIGRheTogXCIyLWRpZ2l0XCIsXG4gICAgICBob3VyOiBcIjItZGlnaXRcIixcbiAgICAgIG1pbnV0ZTogXCIyLWRpZ2l0XCIsXG4gICAgfTtcblxuICBpZiAodGltZVpvbmUpIHtcbiAgICBpbnRsT3B0cy50aW1lWm9uZSA9IHRpbWVab25lO1xuICB9XG5cbiAgY29uc3QgbW9kaWZpZWQgPSB7IHRpbWVab25lTmFtZTogb2Zmc2V0Rm9ybWF0LCAuLi5pbnRsT3B0cyB9O1xuXG4gIGNvbnN0IHBhcnNlZCA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KGxvY2FsZSwgbW9kaWZpZWQpXG4gICAgLmZvcm1hdFRvUGFydHMoZGF0ZSlcbiAgICAuZmluZCgobSkgPT4gbS50eXBlLnRvTG93ZXJDYXNlKCkgPT09IFwidGltZXpvbmVuYW1lXCIpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnZhbHVlIDogbnVsbDtcbn1cblxuLy8gc2lnbmVkT2Zmc2V0KCctNScsICczMCcpIC0+IC0zMzBcbmZ1bmN0aW9uIHNpZ25lZE9mZnNldChvZmZIb3VyU3RyLCBvZmZNaW51dGVTdHIpIHtcbiAgbGV0IG9mZkhvdXIgPSBwYXJzZUludChvZmZIb3VyU3RyLCAxMCk7XG5cbiAgLy8gZG9uJ3QgfHwgdGhpcyBiZWNhdXNlIHdlIHdhbnQgdG8gcHJlc2VydmUgLTBcbiAgaWYgKE51bWJlci5pc05hTihvZmZIb3VyKSkge1xuICAgIG9mZkhvdXIgPSAwO1xuICB9XG5cbiAgY29uc3Qgb2ZmTWluID0gcGFyc2VJbnQob2ZmTWludXRlU3RyLCAxMCkgfHwgMCxcbiAgICBvZmZNaW5TaWduZWQgPSBvZmZIb3VyIDwgMCB8fCBPYmplY3QuaXMob2ZmSG91ciwgLTApID8gLW9mZk1pbiA6IG9mZk1pbjtcbiAgcmV0dXJuIG9mZkhvdXIgKiA2MCArIG9mZk1pblNpZ25lZDtcbn1cblxuLy8gQ09FUkNJT05cblxuZnVuY3Rpb24gYXNOdW1iZXIodmFsdWUpIHtcbiAgY29uc3QgbnVtZXJpY1ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgfHwgdmFsdWUgPT09IFwiXCIgfHwgTnVtYmVyLmlzTmFOKG51bWVyaWNWYWx1ZSkpXG4gICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudEVycm9yKGBJbnZhbGlkIHVuaXQgdmFsdWUgJHt2YWx1ZX1gKTtcbiAgcmV0dXJuIG51bWVyaWNWYWx1ZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT2JqZWN0KG9iaiwgbm9ybWFsaXplcikge1xuICBjb25zdCBub3JtYWxpemVkID0ge307XG4gIGZvciAoY29uc3QgdSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkob2JqLCB1KSkge1xuICAgICAgY29uc3QgdiA9IG9ialt1XTtcbiAgICAgIGlmICh2ID09PSB1bmRlZmluZWQgfHwgdiA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICBub3JtYWxpemVkW25vcm1hbGl6ZXIodSldID0gYXNOdW1iZXIodik7XG4gICAgfVxuICB9XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRPZmZzZXQob2Zmc2V0LCBmb3JtYXQpIHtcbiAgY29uc3QgaG91cnMgPSBNYXRoLnRydW5jKE1hdGguYWJzKG9mZnNldCAvIDYwKSksXG4gICAgbWludXRlcyA9IE1hdGgudHJ1bmMoTWF0aC5hYnMob2Zmc2V0ICUgNjApKSxcbiAgICBzaWduID0gb2Zmc2V0ID49IDAgPyBcIitcIiA6IFwiLVwiO1xuXG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgY2FzZSBcInNob3J0XCI6XG4gICAgICByZXR1cm4gYCR7c2lnbn0ke3BhZFN0YXJ0KGhvdXJzLCAyKX06JHtwYWRTdGFydChtaW51dGVzLCAyKX1gO1xuICAgIGNhc2UgXCJuYXJyb3dcIjpcbiAgICAgIHJldHVybiBgJHtzaWdufSR7aG91cnN9JHttaW51dGVzID4gMCA/IGA6JHttaW51dGVzfWAgOiBcIlwifWA7XG4gICAgY2FzZSBcInRlY2hpZVwiOlxuICAgICAgcmV0dXJuIGAke3NpZ259JHtwYWRTdGFydChob3VycywgMil9JHtwYWRTdGFydChtaW51dGVzLCAyKX1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVmFsdWUgZm9ybWF0ICR7Zm9ybWF0fSBpcyBvdXQgb2YgcmFuZ2UgZm9yIHByb3BlcnR5IGZvcm1hdGApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRpbWVPYmplY3Qob2JqKSB7XG4gIHJldHVybiBwaWNrKG9iaiwgW1wiaG91clwiLCBcIm1pbnV0ZVwiLCBcInNlY29uZFwiLCBcIm1pbGxpc2Vjb25kXCJdKTtcbn1cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNvbnN0IG1vbnRoc0xvbmcgPSBbXG4gIFwiSmFudWFyeVwiLFxuICBcIkZlYnJ1YXJ5XCIsXG4gIFwiTWFyY2hcIixcbiAgXCJBcHJpbFwiLFxuICBcIk1heVwiLFxuICBcIkp1bmVcIixcbiAgXCJKdWx5XCIsXG4gIFwiQXVndXN0XCIsXG4gIFwiU2VwdGVtYmVyXCIsXG4gIFwiT2N0b2JlclwiLFxuICBcIk5vdmVtYmVyXCIsXG4gIFwiRGVjZW1iZXJcIixcbl07XG5cbmNvbnN0IG1vbnRoc1Nob3J0ID0gW1xuICBcIkphblwiLFxuICBcIkZlYlwiLFxuICBcIk1hclwiLFxuICBcIkFwclwiLFxuICBcIk1heVwiLFxuICBcIkp1blwiLFxuICBcIkp1bFwiLFxuICBcIkF1Z1wiLFxuICBcIlNlcFwiLFxuICBcIk9jdFwiLFxuICBcIk5vdlwiLFxuICBcIkRlY1wiLFxuXTtcblxuY29uc3QgbW9udGhzTmFycm93ID0gW1wiSlwiLCBcIkZcIiwgXCJNXCIsIFwiQVwiLCBcIk1cIiwgXCJKXCIsIFwiSlwiLCBcIkFcIiwgXCJTXCIsIFwiT1wiLCBcIk5cIiwgXCJEXCJdO1xuXG5mdW5jdGlvbiBtb250aHMobGVuZ3RoKSB7XG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSBcIm5hcnJvd1wiOlxuICAgICAgcmV0dXJuIFsuLi5tb250aHNOYXJyb3ddO1xuICAgIGNhc2UgXCJzaG9ydFwiOlxuICAgICAgcmV0dXJuIFsuLi5tb250aHNTaG9ydF07XG4gICAgY2FzZSBcImxvbmdcIjpcbiAgICAgIHJldHVybiBbLi4ubW9udGhzTG9uZ107XG4gICAgY2FzZSBcIm51bWVyaWNcIjpcbiAgICAgIHJldHVybiBbXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiLCBcIjZcIiwgXCI3XCIsIFwiOFwiLCBcIjlcIiwgXCIxMFwiLCBcIjExXCIsIFwiMTJcIl07XG4gICAgY2FzZSBcIjItZGlnaXRcIjpcbiAgICAgIHJldHVybiBbXCIwMVwiLCBcIjAyXCIsIFwiMDNcIiwgXCIwNFwiLCBcIjA1XCIsIFwiMDZcIiwgXCIwN1wiLCBcIjA4XCIsIFwiMDlcIiwgXCIxMFwiLCBcIjExXCIsIFwiMTJcIl07XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmNvbnN0IHdlZWtkYXlzTG9uZyA9IFtcbiAgXCJNb25kYXlcIixcbiAgXCJUdWVzZGF5XCIsXG4gIFwiV2VkbmVzZGF5XCIsXG4gIFwiVGh1cnNkYXlcIixcbiAgXCJGcmlkYXlcIixcbiAgXCJTYXR1cmRheVwiLFxuICBcIlN1bmRheVwiLFxuXTtcblxuY29uc3Qgd2Vla2RheXNTaG9ydCA9IFtcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiLCBcIlN1blwiXTtcblxuY29uc3Qgd2Vla2RheXNOYXJyb3cgPSBbXCJNXCIsIFwiVFwiLCBcIldcIiwgXCJUXCIsIFwiRlwiLCBcIlNcIiwgXCJTXCJdO1xuXG5mdW5jdGlvbiB3ZWVrZGF5cyhsZW5ndGgpIHtcbiAgc3dpdGNoIChsZW5ndGgpIHtcbiAgICBjYXNlIFwibmFycm93XCI6XG4gICAgICByZXR1cm4gWy4uLndlZWtkYXlzTmFycm93XTtcbiAgICBjYXNlIFwic2hvcnRcIjpcbiAgICAgIHJldHVybiBbLi4ud2Vla2RheXNTaG9ydF07XG4gICAgY2FzZSBcImxvbmdcIjpcbiAgICAgIHJldHVybiBbLi4ud2Vla2RheXNMb25nXTtcbiAgICBjYXNlIFwibnVtZXJpY1wiOlxuICAgICAgcmV0dXJuIFtcIjFcIiwgXCIyXCIsIFwiM1wiLCBcIjRcIiwgXCI1XCIsIFwiNlwiLCBcIjdcIl07XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmNvbnN0IG1lcmlkaWVtcyA9IFtcIkFNXCIsIFwiUE1cIl07XG5cbmNvbnN0IGVyYXNMb25nID0gW1wiQmVmb3JlIENocmlzdFwiLCBcIkFubm8gRG9taW5pXCJdO1xuXG5jb25zdCBlcmFzU2hvcnQgPSBbXCJCQ1wiLCBcIkFEXCJdO1xuXG5jb25zdCBlcmFzTmFycm93ID0gW1wiQlwiLCBcIkFcIl07XG5cbmZ1bmN0aW9uIGVyYXMobGVuZ3RoKSB7XG4gIHN3aXRjaCAobGVuZ3RoKSB7XG4gICAgY2FzZSBcIm5hcnJvd1wiOlxuICAgICAgcmV0dXJuIFsuLi5lcmFzTmFycm93XTtcbiAgICBjYXNlIFwic2hvcnRcIjpcbiAgICAgIHJldHVybiBbLi4uZXJhc1Nob3J0XTtcbiAgICBjYXNlIFwibG9uZ1wiOlxuICAgICAgcmV0dXJuIFsuLi5lcmFzTG9uZ107XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1lcmlkaWVtRm9yRGF0ZVRpbWUoZHQpIHtcbiAgcmV0dXJuIG1lcmlkaWVtc1tkdC5ob3VyIDwgMTIgPyAwIDogMV07XG59XG5cbmZ1bmN0aW9uIHdlZWtkYXlGb3JEYXRlVGltZShkdCwgbGVuZ3RoKSB7XG4gIHJldHVybiB3ZWVrZGF5cyhsZW5ndGgpW2R0LndlZWtkYXkgLSAxXTtcbn1cblxuZnVuY3Rpb24gbW9udGhGb3JEYXRlVGltZShkdCwgbGVuZ3RoKSB7XG4gIHJldHVybiBtb250aHMobGVuZ3RoKVtkdC5tb250aCAtIDFdO1xufVxuXG5mdW5jdGlvbiBlcmFGb3JEYXRlVGltZShkdCwgbGVuZ3RoKSB7XG4gIHJldHVybiBlcmFzKGxlbmd0aClbZHQueWVhciA8IDAgPyAwIDogMV07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFJlbGF0aXZlVGltZSh1bml0LCBjb3VudCwgbnVtZXJpYyA9IFwiYWx3YXlzXCIsIG5hcnJvdyA9IGZhbHNlKSB7XG4gIGNvbnN0IHVuaXRzID0ge1xuICAgIHllYXJzOiBbXCJ5ZWFyXCIsIFwieXIuXCJdLFxuICAgIHF1YXJ0ZXJzOiBbXCJxdWFydGVyXCIsIFwicXRyLlwiXSxcbiAgICBtb250aHM6IFtcIm1vbnRoXCIsIFwibW8uXCJdLFxuICAgIHdlZWtzOiBbXCJ3ZWVrXCIsIFwid2suXCJdLFxuICAgIGRheXM6IFtcImRheVwiLCBcImRheVwiLCBcImRheXNcIl0sXG4gICAgaG91cnM6IFtcImhvdXJcIiwgXCJoci5cIl0sXG4gICAgbWludXRlczogW1wibWludXRlXCIsIFwibWluLlwiXSxcbiAgICBzZWNvbmRzOiBbXCJzZWNvbmRcIiwgXCJzZWMuXCJdLFxuICB9O1xuXG4gIGNvbnN0IGxhc3RhYmxlID0gW1wiaG91cnNcIiwgXCJtaW51dGVzXCIsIFwic2Vjb25kc1wiXS5pbmRleE9mKHVuaXQpID09PSAtMTtcblxuICBpZiAobnVtZXJpYyA9PT0gXCJhdXRvXCIgJiYgbGFzdGFibGUpIHtcbiAgICBjb25zdCBpc0RheSA9IHVuaXQgPT09IFwiZGF5c1wiO1xuICAgIHN3aXRjaCAoY291bnQpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIGlzRGF5ID8gXCJ0b21vcnJvd1wiIDogYG5leHQgJHt1bml0c1t1bml0XVswXX1gO1xuICAgICAgY2FzZSAtMTpcbiAgICAgICAgcmV0dXJuIGlzRGF5ID8gXCJ5ZXN0ZXJkYXlcIiA6IGBsYXN0ICR7dW5pdHNbdW5pdF1bMF19YDtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcmV0dXJuIGlzRGF5ID8gXCJ0b2RheVwiIDogYHRoaXMgJHt1bml0c1t1bml0XVswXX1gO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzSW5QYXN0ID0gT2JqZWN0LmlzKGNvdW50LCAtMCkgfHwgY291bnQgPCAwLFxuICAgIGZtdFZhbHVlID0gTWF0aC5hYnMoY291bnQpLFxuICAgIHNpbmd1bGFyID0gZm10VmFsdWUgPT09IDEsXG4gICAgbGlsVW5pdHMgPSB1bml0c1t1bml0XSxcbiAgICBmbXRVbml0ID0gbmFycm93XG4gICAgICA/IHNpbmd1bGFyXG4gICAgICAgID8gbGlsVW5pdHNbMV1cbiAgICAgICAgOiBsaWxVbml0c1syXSB8fCBsaWxVbml0c1sxXVxuICAgICAgOiBzaW5ndWxhclxuICAgICAgPyB1bml0c1t1bml0XVswXVxuICAgICAgOiB1bml0O1xuICByZXR1cm4gaXNJblBhc3QgPyBgJHtmbXRWYWx1ZX0gJHtmbXRVbml0fSBhZ29gIDogYGluICR7Zm10VmFsdWV9ICR7Zm10VW5pdH1gO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlUb2tlbnMoc3BsaXRzLCB0b2tlblRvU3RyaW5nKSB7XG4gIGxldCBzID0gXCJcIjtcbiAgZm9yIChjb25zdCB0b2tlbiBvZiBzcGxpdHMpIHtcbiAgICBpZiAodG9rZW4ubGl0ZXJhbCkge1xuICAgICAgcyArPSB0b2tlbi52YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMgKz0gdG9rZW5Ub1N0cmluZyh0b2tlbi52YWwpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcztcbn1cblxuY29uc3QgbWFjcm9Ub2tlblRvRm9ybWF0T3B0cyA9IHtcbiAgRDogREFURV9TSE9SVCxcbiAgREQ6IERBVEVfTUVELFxuICBEREQ6IERBVEVfRlVMTCxcbiAgRERERDogREFURV9IVUdFLFxuICB0OiBUSU1FX1NJTVBMRSxcbiAgdHQ6IFRJTUVfV0lUSF9TRUNPTkRTLFxuICB0dHQ6IFRJTUVfV0lUSF9TSE9SVF9PRkZTRVQsXG4gIHR0dHQ6IFRJTUVfV0lUSF9MT05HX09GRlNFVCxcbiAgVDogVElNRV8yNF9TSU1QTEUsXG4gIFRUOiBUSU1FXzI0X1dJVEhfU0VDT05EUyxcbiAgVFRUOiBUSU1FXzI0X1dJVEhfU0hPUlRfT0ZGU0VULFxuICBUVFRUOiBUSU1FXzI0X1dJVEhfTE9OR19PRkZTRVQsXG4gIGY6IERBVEVUSU1FX1NIT1JULFxuICBmZjogREFURVRJTUVfTUVELFxuICBmZmY6IERBVEVUSU1FX0ZVTEwsXG4gIGZmZmY6IERBVEVUSU1FX0hVR0UsXG4gIEY6IERBVEVUSU1FX1NIT1JUX1dJVEhfU0VDT05EUyxcbiAgRkY6IERBVEVUSU1FX01FRF9XSVRIX1NFQ09ORFMsXG4gIEZGRjogREFURVRJTUVfRlVMTF9XSVRIX1NFQ09ORFMsXG4gIEZGRkY6IERBVEVUSU1FX0hVR0VfV0lUSF9TRUNPTkRTLFxufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5cbmNsYXNzIEZvcm1hdHRlciB7XG4gIHN0YXRpYyBjcmVhdGUobG9jYWxlLCBvcHRzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IEZvcm1hdHRlcihsb2NhbGUsIG9wdHMpO1xuICB9XG5cbiAgc3RhdGljIHBhcnNlRm9ybWF0KGZtdCkge1xuICAgIC8vIHdoaXRlLXNwYWNlIGlzIGFsd2F5cyBjb25zaWRlcmVkIGEgbGl0ZXJhbCBpbiB1c2VyLXByb3ZpZGVkIGZvcm1hdHNcbiAgICAvLyB0aGUgXCIgXCIgdG9rZW4gaGFzIGEgc3BlY2lhbCBtZWFuaW5nIChzZWUgdW5pdEZvclRva2VuKVxuXG4gICAgbGV0IGN1cnJlbnQgPSBudWxsLFxuICAgICAgY3VycmVudEZ1bGwgPSBcIlwiLFxuICAgICAgYnJhY2tldGVkID0gZmFsc2U7XG4gICAgY29uc3Qgc3BsaXRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGMgPSBmbXQuY2hhckF0KGkpO1xuICAgICAgaWYgKGMgPT09IFwiJ1wiKSB7XG4gICAgICAgIGlmIChjdXJyZW50RnVsbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc3BsaXRzLnB1c2goeyBsaXRlcmFsOiBicmFja2V0ZWQgfHwgL15cXHMrJC8udGVzdChjdXJyZW50RnVsbCksIHZhbDogY3VycmVudEZ1bGwgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudCA9IG51bGw7XG4gICAgICAgIGN1cnJlbnRGdWxsID0gXCJcIjtcbiAgICAgICAgYnJhY2tldGVkID0gIWJyYWNrZXRlZDtcbiAgICAgIH0gZWxzZSBpZiAoYnJhY2tldGVkKSB7XG4gICAgICAgIGN1cnJlbnRGdWxsICs9IGM7XG4gICAgICB9IGVsc2UgaWYgKGMgPT09IGN1cnJlbnQpIHtcbiAgICAgICAgY3VycmVudEZ1bGwgKz0gYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyZW50RnVsbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc3BsaXRzLnB1c2goeyBsaXRlcmFsOiAvXlxccyskLy50ZXN0KGN1cnJlbnRGdWxsKSwgdmFsOiBjdXJyZW50RnVsbCB9KTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50RnVsbCA9IGM7XG4gICAgICAgIGN1cnJlbnQgPSBjO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjdXJyZW50RnVsbC5sZW5ndGggPiAwKSB7XG4gICAgICBzcGxpdHMucHVzaCh7IGxpdGVyYWw6IGJyYWNrZXRlZCB8fCAvXlxccyskLy50ZXN0KGN1cnJlbnRGdWxsKSwgdmFsOiBjdXJyZW50RnVsbCB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3BsaXRzO1xuICB9XG5cbiAgc3RhdGljIG1hY3JvVG9rZW5Ub0Zvcm1hdE9wdHModG9rZW4pIHtcbiAgICByZXR1cm4gbWFjcm9Ub2tlblRvRm9ybWF0T3B0c1t0b2tlbl07XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihsb2NhbGUsIGZvcm1hdE9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSBmb3JtYXRPcHRzO1xuICAgIHRoaXMubG9jID0gbG9jYWxlO1xuICAgIHRoaXMuc3lzdGVtTG9jID0gbnVsbDtcbiAgfVxuXG4gIGZvcm1hdFdpdGhTeXN0ZW1EZWZhdWx0KGR0LCBvcHRzKSB7XG4gICAgaWYgKHRoaXMuc3lzdGVtTG9jID09PSBudWxsKSB7XG4gICAgICB0aGlzLnN5c3RlbUxvYyA9IHRoaXMubG9jLnJlZGVmYXVsdFRvU3lzdGVtKCk7XG4gICAgfVxuICAgIGNvbnN0IGRmID0gdGhpcy5zeXN0ZW1Mb2MuZHRGb3JtYXR0ZXIoZHQsIHsgLi4udGhpcy5vcHRzLCAuLi5vcHRzIH0pO1xuICAgIHJldHVybiBkZi5mb3JtYXQoKTtcbiAgfVxuXG4gIGR0Rm9ybWF0dGVyKGR0LCBvcHRzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5sb2MuZHRGb3JtYXR0ZXIoZHQsIHsgLi4udGhpcy5vcHRzLCAuLi5vcHRzIH0pO1xuICB9XG5cbiAgZm9ybWF0RGF0ZVRpbWUoZHQsIG9wdHMpIHtcbiAgICByZXR1cm4gdGhpcy5kdEZvcm1hdHRlcihkdCwgb3B0cykuZm9ybWF0KCk7XG4gIH1cblxuICBmb3JtYXREYXRlVGltZVBhcnRzKGR0LCBvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXMuZHRGb3JtYXR0ZXIoZHQsIG9wdHMpLmZvcm1hdFRvUGFydHMoKTtcbiAgfVxuXG4gIGZvcm1hdEludGVydmFsKGludGVydmFsLCBvcHRzKSB7XG4gICAgY29uc3QgZGYgPSB0aGlzLmR0Rm9ybWF0dGVyKGludGVydmFsLnN0YXJ0LCBvcHRzKTtcbiAgICByZXR1cm4gZGYuZHRmLmZvcm1hdFJhbmdlKGludGVydmFsLnN0YXJ0LnRvSlNEYXRlKCksIGludGVydmFsLmVuZC50b0pTRGF0ZSgpKTtcbiAgfVxuXG4gIHJlc29sdmVkT3B0aW9ucyhkdCwgb3B0cykge1xuICAgIHJldHVybiB0aGlzLmR0Rm9ybWF0dGVyKGR0LCBvcHRzKS5yZXNvbHZlZE9wdGlvbnMoKTtcbiAgfVxuXG4gIG51bShuLCBwID0gMCkge1xuICAgIC8vIHdlIGdldCBzb21lIHBlcmYgb3V0IG9mIGRvaW5nIHRoaXMgaGVyZSwgYW5ub3lpbmdseVxuICAgIGlmICh0aGlzLm9wdHMuZm9yY2VTaW1wbGUpIHtcbiAgICAgIHJldHVybiBwYWRTdGFydChuLCBwKTtcbiAgICB9XG5cbiAgICBjb25zdCBvcHRzID0geyAuLi50aGlzLm9wdHMgfTtcblxuICAgIGlmIChwID4gMCkge1xuICAgICAgb3B0cy5wYWRUbyA9IHA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubG9jLm51bWJlckZvcm1hdHRlcihvcHRzKS5mb3JtYXQobik7XG4gIH1cblxuICBmb3JtYXREYXRlVGltZUZyb21TdHJpbmcoZHQsIGZtdCkge1xuICAgIGNvbnN0IGtub3duRW5nbGlzaCA9IHRoaXMubG9jLmxpc3RpbmdNb2RlKCkgPT09IFwiZW5cIixcbiAgICAgIHVzZURhdGVUaW1lRm9ybWF0dGVyID0gdGhpcy5sb2Mub3V0cHV0Q2FsZW5kYXIgJiYgdGhpcy5sb2Mub3V0cHV0Q2FsZW5kYXIgIT09IFwiZ3JlZ29yeVwiLFxuICAgICAgc3RyaW5nID0gKG9wdHMsIGV4dHJhY3QpID0+IHRoaXMubG9jLmV4dHJhY3QoZHQsIG9wdHMsIGV4dHJhY3QpLFxuICAgICAgZm9ybWF0T2Zmc2V0ID0gKG9wdHMpID0+IHtcbiAgICAgICAgaWYgKGR0LmlzT2Zmc2V0Rml4ZWQgJiYgZHQub2Zmc2V0ID09PSAwICYmIG9wdHMuYWxsb3daKSB7XG4gICAgICAgICAgcmV0dXJuIFwiWlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGR0LmlzVmFsaWQgPyBkdC56b25lLmZvcm1hdE9mZnNldChkdC50cywgb3B0cy5mb3JtYXQpIDogXCJcIjtcbiAgICAgIH0sXG4gICAgICBtZXJpZGllbSA9ICgpID0+XG4gICAgICAgIGtub3duRW5nbGlzaFxuICAgICAgICAgID8gbWVyaWRpZW1Gb3JEYXRlVGltZShkdClcbiAgICAgICAgICA6IHN0cmluZyh7IGhvdXI6IFwibnVtZXJpY1wiLCBob3VyQ3ljbGU6IFwiaDEyXCIgfSwgXCJkYXlwZXJpb2RcIiksXG4gICAgICBtb250aCA9IChsZW5ndGgsIHN0YW5kYWxvbmUpID0+XG4gICAgICAgIGtub3duRW5nbGlzaFxuICAgICAgICAgID8gbW9udGhGb3JEYXRlVGltZShkdCwgbGVuZ3RoKVxuICAgICAgICAgIDogc3RyaW5nKHN0YW5kYWxvbmUgPyB7IG1vbnRoOiBsZW5ndGggfSA6IHsgbW9udGg6IGxlbmd0aCwgZGF5OiBcIm51bWVyaWNcIiB9LCBcIm1vbnRoXCIpLFxuICAgICAgd2Vla2RheSA9IChsZW5ndGgsIHN0YW5kYWxvbmUpID0+XG4gICAgICAgIGtub3duRW5nbGlzaFxuICAgICAgICAgID8gd2Vla2RheUZvckRhdGVUaW1lKGR0LCBsZW5ndGgpXG4gICAgICAgICAgOiBzdHJpbmcoXG4gICAgICAgICAgICAgIHN0YW5kYWxvbmUgPyB7IHdlZWtkYXk6IGxlbmd0aCB9IDogeyB3ZWVrZGF5OiBsZW5ndGgsIG1vbnRoOiBcImxvbmdcIiwgZGF5OiBcIm51bWVyaWNcIiB9LFxuICAgICAgICAgICAgICBcIndlZWtkYXlcIlxuICAgICAgICAgICAgKSxcbiAgICAgIG1heWJlTWFjcm8gPSAodG9rZW4pID0+IHtcbiAgICAgICAgY29uc3QgZm9ybWF0T3B0cyA9IEZvcm1hdHRlci5tYWNyb1Rva2VuVG9Gb3JtYXRPcHRzKHRva2VuKTtcbiAgICAgICAgaWYgKGZvcm1hdE9wdHMpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXRXaXRoU3lzdGVtRGVmYXVsdChkdCwgZm9ybWF0T3B0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZXJhID0gKGxlbmd0aCkgPT5cbiAgICAgICAga25vd25FbmdsaXNoID8gZXJhRm9yRGF0ZVRpbWUoZHQsIGxlbmd0aCkgOiBzdHJpbmcoeyBlcmE6IGxlbmd0aCB9LCBcImVyYVwiKSxcbiAgICAgIHRva2VuVG9TdHJpbmcgPSAodG9rZW4pID0+IHtcbiAgICAgICAgLy8gV2hlcmUgcG9zc2libGU6IGh0dHBzOi8vY2xkci51bmljb2RlLm9yZy90cmFuc2xhdGlvbi9kYXRlLXRpbWUvZGF0ZS10aW1lLXN5bWJvbHNcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgIC8vIG1zXG4gICAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5taWxsaXNlY29uZCk7XG4gICAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgY2FzZSBcIlNTU1wiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0Lm1pbGxpc2Vjb25kLCAzKTtcbiAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5zZWNvbmQpO1xuICAgICAgICAgIGNhc2UgXCJzc1wiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0LnNlY29uZCwgMik7XG4gICAgICAgICAgLy8gZnJhY3Rpb25hbCBzZWNvbmRzXG4gICAgICAgICAgY2FzZSBcInV1XCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oTWF0aC5mbG9vcihkdC5taWxsaXNlY29uZCAvIDEwKSwgMik7XG4gICAgICAgICAgY2FzZSBcInV1dVwiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKE1hdGguZmxvb3IoZHQubWlsbGlzZWNvbmQgLyAxMDApKTtcbiAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgY2FzZSBcIm1cIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5taW51dGUpO1xuICAgICAgICAgIGNhc2UgXCJtbVwiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0Lm1pbnV0ZSwgMik7XG4gICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0LmhvdXIgJSAxMiA9PT0gMCA/IDEyIDogZHQuaG91ciAlIDEyKTtcbiAgICAgICAgICBjYXNlIFwiaGhcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5ob3VyICUgMTIgPT09IDAgPyAxMiA6IGR0LmhvdXIgJSAxMiwgMik7XG4gICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5ob3VyKTtcbiAgICAgICAgICBjYXNlIFwiSEhcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5ob3VyLCAyKTtcbiAgICAgICAgICAvLyBvZmZzZXRcbiAgICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICAgICAgLy8gbGlrZSArNlxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE9mZnNldCh7IGZvcm1hdDogXCJuYXJyb3dcIiwgYWxsb3daOiB0aGlzLm9wdHMuYWxsb3daIH0pO1xuICAgICAgICAgIGNhc2UgXCJaWlwiOlxuICAgICAgICAgICAgLy8gbGlrZSArMDY6MDBcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRPZmZzZXQoeyBmb3JtYXQ6IFwic2hvcnRcIiwgYWxsb3daOiB0aGlzLm9wdHMuYWxsb3daIH0pO1xuICAgICAgICAgIGNhc2UgXCJaWlpcIjpcbiAgICAgICAgICAgIC8vIGxpa2UgKzA2MDBcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRPZmZzZXQoeyBmb3JtYXQ6IFwidGVjaGllXCIsIGFsbG93WjogdGhpcy5vcHRzLmFsbG93WiB9KTtcbiAgICAgICAgICBjYXNlIFwiWlpaWlwiOlxuICAgICAgICAgICAgLy8gbGlrZSBFU1RcbiAgICAgICAgICAgIHJldHVybiBkdC56b25lLm9mZnNldE5hbWUoZHQudHMsIHsgZm9ybWF0OiBcInNob3J0XCIsIGxvY2FsZTogdGhpcy5sb2MubG9jYWxlIH0pO1xuICAgICAgICAgIGNhc2UgXCJaWlpaWlwiOlxuICAgICAgICAgICAgLy8gbGlrZSBFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcbiAgICAgICAgICAgIHJldHVybiBkdC56b25lLm9mZnNldE5hbWUoZHQudHMsIHsgZm9ybWF0OiBcImxvbmdcIiwgbG9jYWxlOiB0aGlzLmxvYy5sb2NhbGUgfSk7XG4gICAgICAgICAgLy8gem9uZVxuICAgICAgICAgIGNhc2UgXCJ6XCI6XG4gICAgICAgICAgICAvLyBsaWtlIEFtZXJpY2EvTmV3X1lvcmtcbiAgICAgICAgICAgIHJldHVybiBkdC56b25lTmFtZTtcbiAgICAgICAgICAvLyBtZXJpZGllbXNcbiAgICAgICAgICBjYXNlIFwiYVwiOlxuICAgICAgICAgICAgcmV0dXJuIG1lcmlkaWVtKCk7XG4gICAgICAgICAgLy8gZGF0ZXNcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgcmV0dXJuIHVzZURhdGVUaW1lRm9ybWF0dGVyID8gc3RyaW5nKHsgZGF5OiBcIm51bWVyaWNcIiB9LCBcImRheVwiKSA6IHRoaXMubnVtKGR0LmRheSk7XG4gICAgICAgICAgY2FzZSBcImRkXCI6XG4gICAgICAgICAgICByZXR1cm4gdXNlRGF0ZVRpbWVGb3JtYXR0ZXIgPyBzdHJpbmcoeyBkYXk6IFwiMi1kaWdpdFwiIH0sIFwiZGF5XCIpIDogdGhpcy5udW0oZHQuZGF5LCAyKTtcbiAgICAgICAgICAvLyB3ZWVrZGF5cyAtIHN0YW5kYWxvbmVcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgLy8gbGlrZSAxXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla2RheSk7XG4gICAgICAgICAgY2FzZSBcImNjY1wiOlxuICAgICAgICAgICAgLy8gbGlrZSAnVHVlcydcbiAgICAgICAgICAgIHJldHVybiB3ZWVrZGF5KFwic2hvcnRcIiwgdHJ1ZSk7XG4gICAgICAgICAgY2FzZSBcImNjY2NcIjpcbiAgICAgICAgICAgIC8vIGxpa2UgJ1R1ZXNkYXknXG4gICAgICAgICAgICByZXR1cm4gd2Vla2RheShcImxvbmdcIiwgdHJ1ZSk7XG4gICAgICAgICAgY2FzZSBcImNjY2NjXCI6XG4gICAgICAgICAgICAvLyBsaWtlICdUJ1xuICAgICAgICAgICAgcmV0dXJuIHdlZWtkYXkoXCJuYXJyb3dcIiwgdHJ1ZSk7XG4gICAgICAgICAgLy8gd2Vla2RheXMgLSBmb3JtYXRcbiAgICAgICAgICBjYXNlIFwiRVwiOlxuICAgICAgICAgICAgLy8gbGlrZSAxXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla2RheSk7XG4gICAgICAgICAgY2FzZSBcIkVFRVwiOlxuICAgICAgICAgICAgLy8gbGlrZSAnVHVlcydcbiAgICAgICAgICAgIHJldHVybiB3ZWVrZGF5KFwic2hvcnRcIiwgZmFsc2UpO1xuICAgICAgICAgIGNhc2UgXCJFRUVFXCI6XG4gICAgICAgICAgICAvLyBsaWtlICdUdWVzZGF5J1xuICAgICAgICAgICAgcmV0dXJuIHdlZWtkYXkoXCJsb25nXCIsIGZhbHNlKTtcbiAgICAgICAgICBjYXNlIFwiRUVFRUVcIjpcbiAgICAgICAgICAgIC8vIGxpa2UgJ1QnXG4gICAgICAgICAgICByZXR1cm4gd2Vla2RheShcIm5hcnJvd1wiLCBmYWxzZSk7XG4gICAgICAgICAgLy8gbW9udGhzIC0gc3RhbmRhbG9uZVxuICAgICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgICAvLyBsaWtlIDFcbiAgICAgICAgICAgIHJldHVybiB1c2VEYXRlVGltZUZvcm1hdHRlclxuICAgICAgICAgICAgICA/IHN0cmluZyh7IG1vbnRoOiBcIm51bWVyaWNcIiwgZGF5OiBcIm51bWVyaWNcIiB9LCBcIm1vbnRoXCIpXG4gICAgICAgICAgICAgIDogdGhpcy5udW0oZHQubW9udGgpO1xuICAgICAgICAgIGNhc2UgXCJMTFwiOlxuICAgICAgICAgICAgLy8gbGlrZSAwMSwgZG9lc24ndCBzZWVtIHRvIHdvcmtcbiAgICAgICAgICAgIHJldHVybiB1c2VEYXRlVGltZUZvcm1hdHRlclxuICAgICAgICAgICAgICA/IHN0cmluZyh7IG1vbnRoOiBcIjItZGlnaXRcIiwgZGF5OiBcIm51bWVyaWNcIiB9LCBcIm1vbnRoXCIpXG4gICAgICAgICAgICAgIDogdGhpcy5udW0oZHQubW9udGgsIDIpO1xuICAgICAgICAgIGNhc2UgXCJMTExcIjpcbiAgICAgICAgICAgIC8vIGxpa2UgSmFuXG4gICAgICAgICAgICByZXR1cm4gbW9udGgoXCJzaG9ydFwiLCB0cnVlKTtcbiAgICAgICAgICBjYXNlIFwiTExMTFwiOlxuICAgICAgICAgICAgLy8gbGlrZSBKYW51YXJ5XG4gICAgICAgICAgICByZXR1cm4gbW9udGgoXCJsb25nXCIsIHRydWUpO1xuICAgICAgICAgIGNhc2UgXCJMTExMTFwiOlxuICAgICAgICAgICAgLy8gbGlrZSBKXG4gICAgICAgICAgICByZXR1cm4gbW9udGgoXCJuYXJyb3dcIiwgdHJ1ZSk7XG4gICAgICAgICAgLy8gbW9udGhzIC0gZm9ybWF0XG4gICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgIC8vIGxpa2UgMVxuICAgICAgICAgICAgcmV0dXJuIHVzZURhdGVUaW1lRm9ybWF0dGVyXG4gICAgICAgICAgICAgID8gc3RyaW5nKHsgbW9udGg6IFwibnVtZXJpY1wiIH0sIFwibW9udGhcIilcbiAgICAgICAgICAgICAgOiB0aGlzLm51bShkdC5tb250aCk7XG4gICAgICAgICAgY2FzZSBcIk1NXCI6XG4gICAgICAgICAgICAvLyBsaWtlIDAxXG4gICAgICAgICAgICByZXR1cm4gdXNlRGF0ZVRpbWVGb3JtYXR0ZXJcbiAgICAgICAgICAgICAgPyBzdHJpbmcoeyBtb250aDogXCIyLWRpZ2l0XCIgfSwgXCJtb250aFwiKVxuICAgICAgICAgICAgICA6IHRoaXMubnVtKGR0Lm1vbnRoLCAyKTtcbiAgICAgICAgICBjYXNlIFwiTU1NXCI6XG4gICAgICAgICAgICAvLyBsaWtlIEphblxuICAgICAgICAgICAgcmV0dXJuIG1vbnRoKFwic2hvcnRcIiwgZmFsc2UpO1xuICAgICAgICAgIGNhc2UgXCJNTU1NXCI6XG4gICAgICAgICAgICAvLyBsaWtlIEphbnVhcnlcbiAgICAgICAgICAgIHJldHVybiBtb250aChcImxvbmdcIiwgZmFsc2UpO1xuICAgICAgICAgIGNhc2UgXCJNTU1NTVwiOlxuICAgICAgICAgICAgLy8gbGlrZSBKXG4gICAgICAgICAgICByZXR1cm4gbW9udGgoXCJuYXJyb3dcIiwgZmFsc2UpO1xuICAgICAgICAgIC8vIHllYXJzXG4gICAgICAgICAgY2FzZSBcInlcIjpcbiAgICAgICAgICAgIC8vIGxpa2UgMjAxNFxuICAgICAgICAgICAgcmV0dXJuIHVzZURhdGVUaW1lRm9ybWF0dGVyID8gc3RyaW5nKHsgeWVhcjogXCJudW1lcmljXCIgfSwgXCJ5ZWFyXCIpIDogdGhpcy5udW0oZHQueWVhcik7XG4gICAgICAgICAgY2FzZSBcInl5XCI6XG4gICAgICAgICAgICAvLyBsaWtlIDE0XG4gICAgICAgICAgICByZXR1cm4gdXNlRGF0ZVRpbWVGb3JtYXR0ZXJcbiAgICAgICAgICAgICAgPyBzdHJpbmcoeyB5ZWFyOiBcIjItZGlnaXRcIiB9LCBcInllYXJcIilcbiAgICAgICAgICAgICAgOiB0aGlzLm51bShkdC55ZWFyLnRvU3RyaW5nKCkuc2xpY2UoLTIpLCAyKTtcbiAgICAgICAgICBjYXNlIFwieXl5eVwiOlxuICAgICAgICAgICAgLy8gbGlrZSAwMDEyXG4gICAgICAgICAgICByZXR1cm4gdXNlRGF0ZVRpbWVGb3JtYXR0ZXJcbiAgICAgICAgICAgICAgPyBzdHJpbmcoeyB5ZWFyOiBcIm51bWVyaWNcIiB9LCBcInllYXJcIilcbiAgICAgICAgICAgICAgOiB0aGlzLm51bShkdC55ZWFyLCA0KTtcbiAgICAgICAgICBjYXNlIFwieXl5eXl5XCI6XG4gICAgICAgICAgICAvLyBsaWtlIDAwMDAxMlxuICAgICAgICAgICAgcmV0dXJuIHVzZURhdGVUaW1lRm9ybWF0dGVyXG4gICAgICAgICAgICAgID8gc3RyaW5nKHsgeWVhcjogXCJudW1lcmljXCIgfSwgXCJ5ZWFyXCIpXG4gICAgICAgICAgICAgIDogdGhpcy5udW0oZHQueWVhciwgNik7XG4gICAgICAgICAgLy8gZXJhc1xuICAgICAgICAgIGNhc2UgXCJHXCI6XG4gICAgICAgICAgICAvLyBsaWtlIEFEXG4gICAgICAgICAgICByZXR1cm4gZXJhKFwic2hvcnRcIik7XG4gICAgICAgICAgY2FzZSBcIkdHXCI6XG4gICAgICAgICAgICAvLyBsaWtlIEFubm8gRG9taW5pXG4gICAgICAgICAgICByZXR1cm4gZXJhKFwibG9uZ1wiKTtcbiAgICAgICAgICBjYXNlIFwiR0dHR0dcIjpcbiAgICAgICAgICAgIHJldHVybiBlcmEoXCJuYXJyb3dcIik7XG4gICAgICAgICAgY2FzZSBcImtrXCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla1llYXIudG9TdHJpbmcoKS5zbGljZSgtMiksIDIpO1xuICAgICAgICAgIGNhc2UgXCJra2trXCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla1llYXIsIDQpO1xuICAgICAgICAgIGNhc2UgXCJXXCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla051bWJlcik7XG4gICAgICAgICAgY2FzZSBcIldXXCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQud2Vla051bWJlciwgMik7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5sb2NhbFdlZWtOdW1iZXIpO1xuICAgICAgICAgIGNhc2UgXCJublwiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0LmxvY2FsV2Vla051bWJlciwgMik7XG4gICAgICAgICAgY2FzZSBcImlpXCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQubG9jYWxXZWVrWWVhci50b1N0cmluZygpLnNsaWNlKC0yKSwgMik7XG4gICAgICAgICAgY2FzZSBcImlpaWlcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5sb2NhbFdlZWtZZWFyLCA0KTtcbiAgICAgICAgICBjYXNlIFwib1wiOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGR0Lm9yZGluYWwpO1xuICAgICAgICAgIGNhc2UgXCJvb29cIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShkdC5vcmRpbmFsLCAzKTtcbiAgICAgICAgICBjYXNlIFwicVwiOlxuICAgICAgICAgICAgLy8gbGlrZSAxXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQucXVhcnRlcik7XG4gICAgICAgICAgY2FzZSBcInFxXCI6XG4gICAgICAgICAgICAvLyBsaWtlIDAxXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQucXVhcnRlciwgMik7XG4gICAgICAgICAgY2FzZSBcIlhcIjpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm51bShNYXRoLmZsb29yKGR0LnRzIC8gMTAwMCkpO1xuICAgICAgICAgIGNhc2UgXCJ4XCI6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5udW0oZHQudHMpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gbWF5YmVNYWNybyh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICByZXR1cm4gc3RyaW5naWZ5VG9rZW5zKEZvcm1hdHRlci5wYXJzZUZvcm1hdChmbXQpLCB0b2tlblRvU3RyaW5nKTtcbiAgfVxuXG4gIGZvcm1hdER1cmF0aW9uRnJvbVN0cmluZyhkdXIsIGZtdCkge1xuICAgIGNvbnN0IHRva2VuVG9GaWVsZCA9ICh0b2tlbikgPT4ge1xuICAgICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgICAgIHJldHVybiBcIm1pbGxpc2Vjb25kXCI7XG4gICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgIHJldHVybiBcInNlY29uZFwiO1xuICAgICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJtaW51dGVcIjtcbiAgICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICAgICAgcmV0dXJuIFwiaG91clwiO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJkYXlcIjtcbiAgICAgICAgICBjYXNlIFwid1wiOlxuICAgICAgICAgICAgcmV0dXJuIFwid2Vla1wiO1xuICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJtb250aFwiO1xuICAgICAgICAgIGNhc2UgXCJ5XCI6XG4gICAgICAgICAgICByZXR1cm4gXCJ5ZWFyXCI7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdG9rZW5Ub1N0cmluZyA9IChsaWxkdXIpID0+ICh0b2tlbikgPT4ge1xuICAgICAgICBjb25zdCBtYXBwZWQgPSB0b2tlblRvRmllbGQodG9rZW4pO1xuICAgICAgICBpZiAobWFwcGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubnVtKGxpbGR1ci5nZXQobWFwcGVkKSwgdG9rZW4ubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB0b2tlbnMgPSBGb3JtYXR0ZXIucGFyc2VGb3JtYXQoZm10KSxcbiAgICAgIHJlYWxUb2tlbnMgPSB0b2tlbnMucmVkdWNlKFxuICAgICAgICAoZm91bmQsIHsgbGl0ZXJhbCwgdmFsIH0pID0+IChsaXRlcmFsID8gZm91bmQgOiBmb3VuZC5jb25jYXQodmFsKSksXG4gICAgICAgIFtdXG4gICAgICApLFxuICAgICAgY29sbGFwc2VkID0gZHVyLnNoaWZ0VG8oLi4ucmVhbFRva2Vucy5tYXAodG9rZW5Ub0ZpZWxkKS5maWx0ZXIoKHQpID0+IHQpKTtcbiAgICByZXR1cm4gc3RyaW5naWZ5VG9rZW5zKHRva2VucywgdG9rZW5Ub1N0cmluZyhjb2xsYXBzZWQpKTtcbiAgfVxufVxuXG4vKlxuICogVGhpcyBmaWxlIGhhbmRsZXMgcGFyc2luZyBmb3Igd2VsbC1zcGVjaWZpZWQgZm9ybWF0cy4gSGVyZSdzIGhvdyBpdCB3b3JrczpcbiAqIFR3byB0aGluZ3MgZ28gaW50byBwYXJzaW5nOiBhIHJlZ2V4IHRvIG1hdGNoIHdpdGggYW5kIGFuIGV4dHJhY3RvciB0byB0YWtlIGFwYXJ0IHRoZSBncm91cHMgaW4gdGhlIG1hdGNoLlxuICogQW4gZXh0cmFjdG9yIGlzIGp1c3QgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgcmVnZXggbWF0Y2ggYXJyYXkgYW5kIHJldHVybnMgYSB7IHllYXI6IC4uLiwgbW9udGg6IC4uLiB9IG9iamVjdFxuICogcGFyc2UoKSBkb2VzIHRoZSB3b3JrIG9mIGV4ZWN1dGluZyB0aGUgcmVnZXggYW5kIGFwcGx5aW5nIHRoZSBleHRyYWN0b3IuIEl0IHRha2VzIG11bHRpcGxlIHJlZ2V4L2V4dHJhY3RvciBwYWlycyB0byB0cnkgaW4gc2VxdWVuY2UuXG4gKiBFeHRyYWN0b3JzIGNhbiB0YWtlIGEgXCJjdXJzb3JcIiByZXByZXNlbnRpbmcgdGhlIG9mZnNldCBpbiB0aGUgbWF0Y2ggdG8gbG9vayBhdC4gVGhpcyBtYWtlcyBpdCBlYXN5IHRvIGNvbWJpbmUgZXh0cmFjdG9ycy5cbiAqIGNvbWJpbmVFeHRyYWN0b3JzKCkgZG9lcyB0aGUgd29yayBvZiBjb21iaW5pbmcgdGhlbSwga2VlcGluZyB0cmFjayBvZiB0aGUgY3Vyc29yIHRocm91Z2ggbXVsdGlwbGUgZXh0cmFjdGlvbnMuXG4gKiBTb21lIGV4dHJhY3Rpb25zIGFyZSBzdXBlciBkdW1iIGFuZCBzaW1wbGVQYXJzZSBhbmQgZnJvbVN0cmluZ3MgaGVscCBEUlkgdGhlbS5cbiAqL1xuXG5jb25zdCBpYW5hUmVnZXggPSAvW0EtWmEtel8rLV17MSwyNTZ9KD86Oj9cXC9bQS1aYS16MC05XystXXsxLDI1Nn0oPzpcXC9bQS1aYS16MC05XystXXsxLDI1Nn0pPyk/LztcblxuZnVuY3Rpb24gY29tYmluZVJlZ2V4ZXMoLi4ucmVnZXhlcykge1xuICBjb25zdCBmdWxsID0gcmVnZXhlcy5yZWR1Y2UoKGYsIHIpID0+IGYgKyByLnNvdXJjZSwgXCJcIik7XG4gIHJldHVybiBSZWdFeHAoYF4ke2Z1bGx9JGApO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lRXh0cmFjdG9ycyguLi5leHRyYWN0b3JzKSB7XG4gIHJldHVybiAobSkgPT5cbiAgICBleHRyYWN0b3JzXG4gICAgICAucmVkdWNlKFxuICAgICAgICAoW21lcmdlZFZhbHMsIG1lcmdlZFpvbmUsIGN1cnNvcl0sIGV4KSA9PiB7XG4gICAgICAgICAgY29uc3QgW3ZhbCwgem9uZSwgbmV4dF0gPSBleChtLCBjdXJzb3IpO1xuICAgICAgICAgIHJldHVybiBbeyAuLi5tZXJnZWRWYWxzLCAuLi52YWwgfSwgem9uZSB8fCBtZXJnZWRab25lLCBuZXh0XTtcbiAgICAgICAgfSxcbiAgICAgICAgW3t9LCBudWxsLCAxXVxuICAgICAgKVxuICAgICAgLnNsaWNlKDAsIDIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZShzLCAuLi5wYXR0ZXJucykge1xuICBpZiAocyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtudWxsLCBudWxsXTtcbiAgfVxuXG4gIGZvciAoY29uc3QgW3JlZ2V4LCBleHRyYWN0b3JdIG9mIHBhdHRlcm5zKSB7XG4gICAgY29uc3QgbSA9IHJlZ2V4LmV4ZWMocyk7XG4gICAgaWYgKG0pIHtcbiAgICAgIHJldHVybiBleHRyYWN0b3IobSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBbbnVsbCwgbnVsbF07XG59XG5cbmZ1bmN0aW9uIHNpbXBsZVBhcnNlKC4uLmtleXMpIHtcbiAgcmV0dXJuIChtYXRjaCwgY3Vyc29yKSA9PiB7XG4gICAgY29uc3QgcmV0ID0ge307XG4gICAgbGV0IGk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2tleXNbaV1dID0gcGFyc2VJbnRlZ2VyKG1hdGNoW2N1cnNvciArIGldKTtcbiAgICB9XG4gICAgcmV0dXJuIFtyZXQsIG51bGwsIGN1cnNvciArIGldO1xuICB9O1xufVxuXG4vLyBJU08gYW5kIFNRTCBwYXJzaW5nXG5jb25zdCBvZmZzZXRSZWdleCA9IC8oPzooWil8KFsrLV1cXGRcXGQpKD86Oj8oXFxkXFxkKSk/KS87XG5jb25zdCBpc29FeHRlbmRlZFpvbmUgPSBgKD86JHtvZmZzZXRSZWdleC5zb3VyY2V9Pyg/OlxcXFxbKCR7aWFuYVJlZ2V4LnNvdXJjZX0pXFxcXF0pPyk/YDtcbmNvbnN0IGlzb1RpbWVCYXNlUmVnZXggPSAvKFxcZFxcZCkoPzo6PyhcXGRcXGQpKD86Oj8oXFxkXFxkKSg/OlsuLF0oXFxkezEsMzB9KSk/KT8pPy87XG5jb25zdCBpc29UaW1lUmVnZXggPSBSZWdFeHAoYCR7aXNvVGltZUJhc2VSZWdleC5zb3VyY2V9JHtpc29FeHRlbmRlZFpvbmV9YCk7XG5jb25zdCBpc29UaW1lRXh0ZW5zaW9uUmVnZXggPSBSZWdFeHAoYCg/OlQke2lzb1RpbWVSZWdleC5zb3VyY2V9KT9gKTtcbmNvbnN0IGlzb1ltZFJlZ2V4ID0gLyhbKy1dXFxkezZ9fFxcZHs0fSkoPzotPyhcXGRcXGQpKD86LT8oXFxkXFxkKSk/KT8vO1xuY29uc3QgaXNvV2Vla1JlZ2V4ID0gLyhcXGR7NH0pLT9XKFxcZFxcZCkoPzotPyhcXGQpKT8vO1xuY29uc3QgaXNvT3JkaW5hbFJlZ2V4ID0gLyhcXGR7NH0pLT8oXFxkezN9KS87XG5jb25zdCBleHRyYWN0SVNPV2Vla0RhdGEgPSBzaW1wbGVQYXJzZShcIndlZWtZZWFyXCIsIFwid2Vla051bWJlclwiLCBcIndlZWtEYXlcIik7XG5jb25zdCBleHRyYWN0SVNPT3JkaW5hbERhdGEgPSBzaW1wbGVQYXJzZShcInllYXJcIiwgXCJvcmRpbmFsXCIpO1xuY29uc3Qgc3FsWW1kUmVnZXggPSAvKFxcZHs0fSktKFxcZFxcZCktKFxcZFxcZCkvOyAvLyBkdW1iZWQtZG93biB2ZXJzaW9uIG9mIHRoZSBJU08gb25lXG5jb25zdCBzcWxUaW1lUmVnZXggPSBSZWdFeHAoXG4gIGAke2lzb1RpbWVCYXNlUmVnZXguc291cmNlfSA/KD86JHtvZmZzZXRSZWdleC5zb3VyY2V9fCgke2lhbmFSZWdleC5zb3VyY2V9KSk/YFxuKTtcbmNvbnN0IHNxbFRpbWVFeHRlbnNpb25SZWdleCA9IFJlZ0V4cChgKD86ICR7c3FsVGltZVJlZ2V4LnNvdXJjZX0pP2ApO1xuXG5mdW5jdGlvbiBpbnQobWF0Y2gsIHBvcywgZmFsbGJhY2spIHtcbiAgY29uc3QgbSA9IG1hdGNoW3Bvc107XG4gIHJldHVybiBpc1VuZGVmaW5lZChtKSA/IGZhbGxiYWNrIDogcGFyc2VJbnRlZ2VyKG0pO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SVNPWW1kKG1hdGNoLCBjdXJzb3IpIHtcbiAgY29uc3QgaXRlbSA9IHtcbiAgICB5ZWFyOiBpbnQobWF0Y2gsIGN1cnNvciksXG4gICAgbW9udGg6IGludChtYXRjaCwgY3Vyc29yICsgMSwgMSksXG4gICAgZGF5OiBpbnQobWF0Y2gsIGN1cnNvciArIDIsIDEpLFxuICB9O1xuXG4gIHJldHVybiBbaXRlbSwgbnVsbCwgY3Vyc29yICsgM107XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RJU09UaW1lKG1hdGNoLCBjdXJzb3IpIHtcbiAgY29uc3QgaXRlbSA9IHtcbiAgICBob3VyczogaW50KG1hdGNoLCBjdXJzb3IsIDApLFxuICAgIG1pbnV0ZXM6IGludChtYXRjaCwgY3Vyc29yICsgMSwgMCksXG4gICAgc2Vjb25kczogaW50KG1hdGNoLCBjdXJzb3IgKyAyLCAwKSxcbiAgICBtaWxsaXNlY29uZHM6IHBhcnNlTWlsbGlzKG1hdGNoW2N1cnNvciArIDNdKSxcbiAgfTtcblxuICByZXR1cm4gW2l0ZW0sIG51bGwsIGN1cnNvciArIDRdO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SVNPT2Zmc2V0KG1hdGNoLCBjdXJzb3IpIHtcbiAgY29uc3QgbG9jYWwgPSAhbWF0Y2hbY3Vyc29yXSAmJiAhbWF0Y2hbY3Vyc29yICsgMV0sXG4gICAgZnVsbE9mZnNldCA9IHNpZ25lZE9mZnNldChtYXRjaFtjdXJzb3IgKyAxXSwgbWF0Y2hbY3Vyc29yICsgMl0pLFxuICAgIHpvbmUgPSBsb2NhbCA/IG51bGwgOiBGaXhlZE9mZnNldFpvbmUuaW5zdGFuY2UoZnVsbE9mZnNldCk7XG4gIHJldHVybiBbe30sIHpvbmUsIGN1cnNvciArIDNdO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0SUFOQVpvbmUobWF0Y2gsIGN1cnNvcikge1xuICBjb25zdCB6b25lID0gbWF0Y2hbY3Vyc29yXSA/IElBTkFab25lLmNyZWF0ZShtYXRjaFtjdXJzb3JdKSA6IG51bGw7XG4gIHJldHVybiBbe30sIHpvbmUsIGN1cnNvciArIDFdO1xufVxuXG4vLyBJU08gdGltZSBwYXJzaW5nXG5cbmNvbnN0IGlzb1RpbWVPbmx5ID0gUmVnRXhwKGBeVD8ke2lzb1RpbWVCYXNlUmVnZXguc291cmNlfSRgKTtcblxuLy8gSVNPIGR1cmF0aW9uIHBhcnNpbmdcblxuY29uc3QgaXNvRHVyYXRpb24gPVxuICAvXi0/UCg/Oig/OigtP1xcZHsxLDIwfSg/OlxcLlxcZHsxLDIwfSk/KVkpPyg/OigtP1xcZHsxLDIwfSg/OlxcLlxcZHsxLDIwfSk/KU0pPyg/OigtP1xcZHsxLDIwfSg/OlxcLlxcZHsxLDIwfSk/KVcpPyg/OigtP1xcZHsxLDIwfSg/OlxcLlxcZHsxLDIwfSk/KUQpPyg/OlQoPzooLT9cXGR7MSwyMH0oPzpcXC5cXGR7MSwyMH0pPylIKT8oPzooLT9cXGR7MSwyMH0oPzpcXC5cXGR7MSwyMH0pPylNKT8oPzooLT9cXGR7MSwyMH0pKD86Wy4sXSgtP1xcZHsxLDIwfSkpP1MpPyk/KSQvO1xuXG5mdW5jdGlvbiBleHRyYWN0SVNPRHVyYXRpb24obWF0Y2gpIHtcbiAgY29uc3QgW3MsIHllYXJTdHIsIG1vbnRoU3RyLCB3ZWVrU3RyLCBkYXlTdHIsIGhvdXJTdHIsIG1pbnV0ZVN0ciwgc2Vjb25kU3RyLCBtaWxsaXNlY29uZHNTdHJdID1cbiAgICBtYXRjaDtcblxuICBjb25zdCBoYXNOZWdhdGl2ZVByZWZpeCA9IHNbMF0gPT09IFwiLVwiO1xuICBjb25zdCBuZWdhdGl2ZVNlY29uZHMgPSBzZWNvbmRTdHIgJiYgc2Vjb25kU3RyWzBdID09PSBcIi1cIjtcblxuICBjb25zdCBtYXliZU5lZ2F0ZSA9IChudW0sIGZvcmNlID0gZmFsc2UpID0+XG4gICAgbnVtICE9PSB1bmRlZmluZWQgJiYgKGZvcmNlIHx8IChudW0gJiYgaGFzTmVnYXRpdmVQcmVmaXgpKSA/IC1udW0gOiBudW07XG5cbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICB5ZWFyczogbWF5YmVOZWdhdGUocGFyc2VGbG9hdGluZyh5ZWFyU3RyKSksXG4gICAgICBtb250aHM6IG1heWJlTmVnYXRlKHBhcnNlRmxvYXRpbmcobW9udGhTdHIpKSxcbiAgICAgIHdlZWtzOiBtYXliZU5lZ2F0ZShwYXJzZUZsb2F0aW5nKHdlZWtTdHIpKSxcbiAgICAgIGRheXM6IG1heWJlTmVnYXRlKHBhcnNlRmxvYXRpbmcoZGF5U3RyKSksXG4gICAgICBob3VyczogbWF5YmVOZWdhdGUocGFyc2VGbG9hdGluZyhob3VyU3RyKSksXG4gICAgICBtaW51dGVzOiBtYXliZU5lZ2F0ZShwYXJzZUZsb2F0aW5nKG1pbnV0ZVN0cikpLFxuICAgICAgc2Vjb25kczogbWF5YmVOZWdhdGUocGFyc2VGbG9hdGluZyhzZWNvbmRTdHIpLCBzZWNvbmRTdHIgPT09IFwiLTBcIiksXG4gICAgICBtaWxsaXNlY29uZHM6IG1heWJlTmVnYXRlKHBhcnNlTWlsbGlzKG1pbGxpc2Vjb25kc1N0ciksIG5lZ2F0aXZlU2Vjb25kcyksXG4gICAgfSxcbiAgXTtcbn1cblxuLy8gVGhlc2UgYXJlIGEgbGl0dGxlIGJyYWluZGVhZC4gRURUICpzaG91bGQqIHRlbGwgdXMgdGhhdCB3ZSdyZSBpbiwgc2F5LCBBbWVyaWNhL05ld19Zb3JrXG4vLyBhbmQgbm90IGp1c3QgdGhhdCB3ZSdyZSBpbiAtMjQwICpyaWdodCBub3cqLiBCdXQgc2luY2UgSSBkb24ndCB0aGluayB0aGVzZSBhcmUgdXNlZCB0aGF0IG9mdGVuXG4vLyBJJ20ganVzdCBnb2luZyB0byBpZ25vcmUgdGhhdFxuY29uc3Qgb2JzT2Zmc2V0cyA9IHtcbiAgR01UOiAwLFxuICBFRFQ6IC00ICogNjAsXG4gIEVTVDogLTUgKiA2MCxcbiAgQ0RUOiAtNSAqIDYwLFxuICBDU1Q6IC02ICogNjAsXG4gIE1EVDogLTYgKiA2MCxcbiAgTVNUOiAtNyAqIDYwLFxuICBQRFQ6IC03ICogNjAsXG4gIFBTVDogLTggKiA2MCxcbn07XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmdzKHdlZWtkYXlTdHIsIHllYXJTdHIsIG1vbnRoU3RyLCBkYXlTdHIsIGhvdXJTdHIsIG1pbnV0ZVN0ciwgc2Vjb25kU3RyKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICB5ZWFyOiB5ZWFyU3RyLmxlbmd0aCA9PT0gMiA/IHVudHJ1bmNhdGVZZWFyKHBhcnNlSW50ZWdlcih5ZWFyU3RyKSkgOiBwYXJzZUludGVnZXIoeWVhclN0ciksXG4gICAgbW9udGg6IG1vbnRoc1Nob3J0LmluZGV4T2YobW9udGhTdHIpICsgMSxcbiAgICBkYXk6IHBhcnNlSW50ZWdlcihkYXlTdHIpLFxuICAgIGhvdXI6IHBhcnNlSW50ZWdlcihob3VyU3RyKSxcbiAgICBtaW51dGU6IHBhcnNlSW50ZWdlcihtaW51dGVTdHIpLFxuICB9O1xuXG4gIGlmIChzZWNvbmRTdHIpIHJlc3VsdC5zZWNvbmQgPSBwYXJzZUludGVnZXIoc2Vjb25kU3RyKTtcbiAgaWYgKHdlZWtkYXlTdHIpIHtcbiAgICByZXN1bHQud2Vla2RheSA9XG4gICAgICB3ZWVrZGF5U3RyLmxlbmd0aCA+IDNcbiAgICAgICAgPyB3ZWVrZGF5c0xvbmcuaW5kZXhPZih3ZWVrZGF5U3RyKSArIDFcbiAgICAgICAgOiB3ZWVrZGF5c1Nob3J0LmluZGV4T2Yod2Vla2RheVN0cikgKyAxO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gUkZDIDI4MjIvNTMyMlxuY29uc3QgcmZjMjgyMiA9XG4gIC9eKD86KE1vbnxUdWV8V2VkfFRodXxGcml8U2F0fFN1biksXFxzKT8oXFxkezEsMn0pXFxzKEphbnxGZWJ8TWFyfEFwcnxNYXl8SnVufEp1bHxBdWd8U2VwfE9jdHxOb3Z8RGVjKVxccyhcXGR7Miw0fSlcXHMoXFxkXFxkKTooXFxkXFxkKSg/OjooXFxkXFxkKSk/XFxzKD86KFVUfEdNVHxbRUNNUF1bU0RdVCl8KFtael0pfCg/OihbKy1dXFxkXFxkKShcXGRcXGQpKSkkLztcblxuZnVuY3Rpb24gZXh0cmFjdFJGQzI4MjIobWF0Y2gpIHtcbiAgY29uc3QgW1xuICAgICAgLFxuICAgICAgd2Vla2RheVN0cixcbiAgICAgIGRheVN0cixcbiAgICAgIG1vbnRoU3RyLFxuICAgICAgeWVhclN0cixcbiAgICAgIGhvdXJTdHIsXG4gICAgICBtaW51dGVTdHIsXG4gICAgICBzZWNvbmRTdHIsXG4gICAgICBvYnNPZmZzZXQsXG4gICAgICBtaWxPZmZzZXQsXG4gICAgICBvZmZIb3VyU3RyLFxuICAgICAgb2ZmTWludXRlU3RyLFxuICAgIF0gPSBtYXRjaCxcbiAgICByZXN1bHQgPSBmcm9tU3RyaW5ncyh3ZWVrZGF5U3RyLCB5ZWFyU3RyLCBtb250aFN0ciwgZGF5U3RyLCBob3VyU3RyLCBtaW51dGVTdHIsIHNlY29uZFN0cik7XG5cbiAgbGV0IG9mZnNldDtcbiAgaWYgKG9ic09mZnNldCkge1xuICAgIG9mZnNldCA9IG9ic09mZnNldHNbb2JzT2Zmc2V0XTtcbiAgfSBlbHNlIGlmIChtaWxPZmZzZXQpIHtcbiAgICBvZmZzZXQgPSAwO1xuICB9IGVsc2Uge1xuICAgIG9mZnNldCA9IHNpZ25lZE9mZnNldChvZmZIb3VyU3RyLCBvZmZNaW51dGVTdHIpO1xuICB9XG5cbiAgcmV0dXJuIFtyZXN1bHQsIG5ldyBGaXhlZE9mZnNldFpvbmUob2Zmc2V0KV07XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NSRkMyODIyKHMpIHtcbiAgLy8gUmVtb3ZlIGNvbW1lbnRzIGFuZCBmb2xkaW5nIHdoaXRlc3BhY2UgYW5kIHJlcGxhY2UgbXVsdGlwbGUtc3BhY2VzIHdpdGggYSBzaW5nbGUgc3BhY2VcbiAgcmV0dXJuIHNcbiAgICAucmVwbGFjZSgvXFwoW14oKV0qXFwpfFtcXG5cXHRdL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC8oXFxzXFxzKykvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuLy8gaHR0cCBkYXRlXG5cbmNvbnN0IHJmYzExMjMgPVxuICAgIC9eKE1vbnxUdWV8V2VkfFRodXxGcml8U2F0fFN1biksIChcXGRcXGQpIChKYW58RmVifE1hcnxBcHJ8TWF5fEp1bnxKdWx8QXVnfFNlcHxPY3R8Tm92fERlYykgKFxcZHs0fSkgKFxcZFxcZCk6KFxcZFxcZCk6KFxcZFxcZCkgR01UJC8sXG4gIHJmYzg1MCA9XG4gICAgL14oTW9uZGF5fFR1ZXNkYXl8V2VkbmVzZGF5fFRodXJzZGF5fEZyaWRheXxTYXR1cmRheXxTdW5kYXkpLCAoXFxkXFxkKS0oSmFufEZlYnxNYXJ8QXByfE1heXxKdW58SnVsfEF1Z3xTZXB8T2N0fE5vdnxEZWMpLShcXGRcXGQpIChcXGRcXGQpOihcXGRcXGQpOihcXGRcXGQpIEdNVCQvLFxuICBhc2NpaSA9XG4gICAgL14oTW9ufFR1ZXxXZWR8VGh1fEZyaXxTYXR8U3VuKSAoSmFufEZlYnxNYXJ8QXByfE1heXxKdW58SnVsfEF1Z3xTZXB8T2N0fE5vdnxEZWMpICggXFxkfFxcZFxcZCkgKFxcZFxcZCk6KFxcZFxcZCk6KFxcZFxcZCkgKFxcZHs0fSkkLztcblxuZnVuY3Rpb24gZXh0cmFjdFJGQzExMjNPcjg1MChtYXRjaCkge1xuICBjb25zdCBbLCB3ZWVrZGF5U3RyLCBkYXlTdHIsIG1vbnRoU3RyLCB5ZWFyU3RyLCBob3VyU3RyLCBtaW51dGVTdHIsIHNlY29uZFN0cl0gPSBtYXRjaCxcbiAgICByZXN1bHQgPSBmcm9tU3RyaW5ncyh3ZWVrZGF5U3RyLCB5ZWFyU3RyLCBtb250aFN0ciwgZGF5U3RyLCBob3VyU3RyLCBtaW51dGVTdHIsIHNlY29uZFN0cik7XG4gIHJldHVybiBbcmVzdWx0LCBGaXhlZE9mZnNldFpvbmUudXRjSW5zdGFuY2VdO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0QVNDSUkobWF0Y2gpIHtcbiAgY29uc3QgWywgd2Vla2RheVN0ciwgbW9udGhTdHIsIGRheVN0ciwgaG91clN0ciwgbWludXRlU3RyLCBzZWNvbmRTdHIsIHllYXJTdHJdID0gbWF0Y2gsXG4gICAgcmVzdWx0ID0gZnJvbVN0cmluZ3Mod2Vla2RheVN0ciwgeWVhclN0ciwgbW9udGhTdHIsIGRheVN0ciwgaG91clN0ciwgbWludXRlU3RyLCBzZWNvbmRTdHIpO1xuICByZXR1cm4gW3Jlc3VsdCwgRml4ZWRPZmZzZXRab25lLnV0Y0luc3RhbmNlXTtcbn1cblxuY29uc3QgaXNvWW1kV2l0aFRpbWVFeHRlbnNpb25SZWdleCA9IGNvbWJpbmVSZWdleGVzKGlzb1ltZFJlZ2V4LCBpc29UaW1lRXh0ZW5zaW9uUmVnZXgpO1xuY29uc3QgaXNvV2Vla1dpdGhUaW1lRXh0ZW5zaW9uUmVnZXggPSBjb21iaW5lUmVnZXhlcyhpc29XZWVrUmVnZXgsIGlzb1RpbWVFeHRlbnNpb25SZWdleCk7XG5jb25zdCBpc29PcmRpbmFsV2l0aFRpbWVFeHRlbnNpb25SZWdleCA9IGNvbWJpbmVSZWdleGVzKGlzb09yZGluYWxSZWdleCwgaXNvVGltZUV4dGVuc2lvblJlZ2V4KTtcbmNvbnN0IGlzb1RpbWVDb21iaW5lZFJlZ2V4ID0gY29tYmluZVJlZ2V4ZXMoaXNvVGltZVJlZ2V4KTtcblxuY29uc3QgZXh0cmFjdElTT1ltZFRpbWVBbmRPZmZzZXQgPSBjb21iaW5lRXh0cmFjdG9ycyhcbiAgZXh0cmFjdElTT1ltZCxcbiAgZXh0cmFjdElTT1RpbWUsXG4gIGV4dHJhY3RJU09PZmZzZXQsXG4gIGV4dHJhY3RJQU5BWm9uZVxuKTtcbmNvbnN0IGV4dHJhY3RJU09XZWVrVGltZUFuZE9mZnNldCA9IGNvbWJpbmVFeHRyYWN0b3JzKFxuICBleHRyYWN0SVNPV2Vla0RhdGEsXG4gIGV4dHJhY3RJU09UaW1lLFxuICBleHRyYWN0SVNPT2Zmc2V0LFxuICBleHRyYWN0SUFOQVpvbmVcbik7XG5jb25zdCBleHRyYWN0SVNPT3JkaW5hbERhdGVBbmRUaW1lID0gY29tYmluZUV4dHJhY3RvcnMoXG4gIGV4dHJhY3RJU09PcmRpbmFsRGF0YSxcbiAgZXh0cmFjdElTT1RpbWUsXG4gIGV4dHJhY3RJU09PZmZzZXQsXG4gIGV4dHJhY3RJQU5BWm9uZVxuKTtcbmNvbnN0IGV4dHJhY3RJU09UaW1lQW5kT2Zmc2V0ID0gY29tYmluZUV4dHJhY3RvcnMoXG4gIGV4dHJhY3RJU09UaW1lLFxuICBleHRyYWN0SVNPT2Zmc2V0LFxuICBleHRyYWN0SUFOQVpvbmVcbik7XG5cbi8qXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlSVNPRGF0ZShzKSB7XG4gIHJldHVybiBwYXJzZShcbiAgICBzLFxuICAgIFtpc29ZbWRXaXRoVGltZUV4dGVuc2lvblJlZ2V4LCBleHRyYWN0SVNPWW1kVGltZUFuZE9mZnNldF0sXG4gICAgW2lzb1dlZWtXaXRoVGltZUV4dGVuc2lvblJlZ2V4LCBleHRyYWN0SVNPV2Vla1RpbWVBbmRPZmZzZXRdLFxuICAgIFtpc29PcmRpbmFsV2l0aFRpbWVFeHRlbnNpb25SZWdleCwgZXh0cmFjdElTT09yZGluYWxEYXRlQW5kVGltZV0sXG4gICAgW2lzb1RpbWVDb21iaW5lZFJlZ2V4LCBleHRyYWN0SVNPVGltZUFuZE9mZnNldF1cbiAgKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VSRkMyODIyRGF0ZShzKSB7XG4gIHJldHVybiBwYXJzZShwcmVwcm9jZXNzUkZDMjgyMihzKSwgW3JmYzI4MjIsIGV4dHJhY3RSRkMyODIyXSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSFRUUERhdGUocykge1xuICByZXR1cm4gcGFyc2UoXG4gICAgcyxcbiAgICBbcmZjMTEyMywgZXh0cmFjdFJGQzExMjNPcjg1MF0sXG4gICAgW3JmYzg1MCwgZXh0cmFjdFJGQzExMjNPcjg1MF0sXG4gICAgW2FzY2lpLCBleHRyYWN0QVNDSUldXG4gICk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSVNPRHVyYXRpb24ocykge1xuICByZXR1cm4gcGFyc2UocywgW2lzb0R1cmF0aW9uLCBleHRyYWN0SVNPRHVyYXRpb25dKTtcbn1cblxuY29uc3QgZXh0cmFjdElTT1RpbWVPbmx5ID0gY29tYmluZUV4dHJhY3RvcnMoZXh0cmFjdElTT1RpbWUpO1xuXG5mdW5jdGlvbiBwYXJzZUlTT1RpbWVPbmx5KHMpIHtcbiAgcmV0dXJuIHBhcnNlKHMsIFtpc29UaW1lT25seSwgZXh0cmFjdElTT1RpbWVPbmx5XSk7XG59XG5cbmNvbnN0IHNxbFltZFdpdGhUaW1lRXh0ZW5zaW9uUmVnZXggPSBjb21iaW5lUmVnZXhlcyhzcWxZbWRSZWdleCwgc3FsVGltZUV4dGVuc2lvblJlZ2V4KTtcbmNvbnN0IHNxbFRpbWVDb21iaW5lZFJlZ2V4ID0gY29tYmluZVJlZ2V4ZXMoc3FsVGltZVJlZ2V4KTtcblxuY29uc3QgZXh0cmFjdElTT1RpbWVPZmZzZXRBbmRJQU5BWm9uZSA9IGNvbWJpbmVFeHRyYWN0b3JzKFxuICBleHRyYWN0SVNPVGltZSxcbiAgZXh0cmFjdElTT09mZnNldCxcbiAgZXh0cmFjdElBTkFab25lXG4pO1xuXG5mdW5jdGlvbiBwYXJzZVNRTChzKSB7XG4gIHJldHVybiBwYXJzZShcbiAgICBzLFxuICAgIFtzcWxZbWRXaXRoVGltZUV4dGVuc2lvblJlZ2V4LCBleHRyYWN0SVNPWW1kVGltZUFuZE9mZnNldF0sXG4gICAgW3NxbFRpbWVDb21iaW5lZFJlZ2V4LCBleHRyYWN0SVNPVGltZU9mZnNldEFuZElBTkFab25lXVxuICApO1xufVxuXG5jb25zdCBJTlZBTElEJDIgPSBcIkludmFsaWQgRHVyYXRpb25cIjtcblxuLy8gdW5pdCBjb252ZXJzaW9uIGNvbnN0YW50c1xuY29uc3QgbG93T3JkZXJNYXRyaXggPSB7XG4gICAgd2Vla3M6IHtcbiAgICAgIGRheXM6IDcsXG4gICAgICBob3VyczogNyAqIDI0LFxuICAgICAgbWludXRlczogNyAqIDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiA3ICogMjQgKiA2MCAqIDYwLFxuICAgICAgbWlsbGlzZWNvbmRzOiA3ICogMjQgKiA2MCAqIDYwICogMTAwMCxcbiAgICB9LFxuICAgIGRheXM6IHtcbiAgICAgIGhvdXJzOiAyNCxcbiAgICAgIG1pbnV0ZXM6IDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiAyNCAqIDYwICogNjAsXG4gICAgICBtaWxsaXNlY29uZHM6IDI0ICogNjAgKiA2MCAqIDEwMDAsXG4gICAgfSxcbiAgICBob3VyczogeyBtaW51dGVzOiA2MCwgc2Vjb25kczogNjAgKiA2MCwgbWlsbGlzZWNvbmRzOiA2MCAqIDYwICogMTAwMCB9LFxuICAgIG1pbnV0ZXM6IHsgc2Vjb25kczogNjAsIG1pbGxpc2Vjb25kczogNjAgKiAxMDAwIH0sXG4gICAgc2Vjb25kczogeyBtaWxsaXNlY29uZHM6IDEwMDAgfSxcbiAgfSxcbiAgY2FzdWFsTWF0cml4ID0ge1xuICAgIHllYXJzOiB7XG4gICAgICBxdWFydGVyczogNCxcbiAgICAgIG1vbnRoczogMTIsXG4gICAgICB3ZWVrczogNTIsXG4gICAgICBkYXlzOiAzNjUsXG4gICAgICBob3VyczogMzY1ICogMjQsXG4gICAgICBtaW51dGVzOiAzNjUgKiAyNCAqIDYwLFxuICAgICAgc2Vjb25kczogMzY1ICogMjQgKiA2MCAqIDYwLFxuICAgICAgbWlsbGlzZWNvbmRzOiAzNjUgKiAyNCAqIDYwICogNjAgKiAxMDAwLFxuICAgIH0sXG4gICAgcXVhcnRlcnM6IHtcbiAgICAgIG1vbnRoczogMyxcbiAgICAgIHdlZWtzOiAxMyxcbiAgICAgIGRheXM6IDkxLFxuICAgICAgaG91cnM6IDkxICogMjQsXG4gICAgICBtaW51dGVzOiA5MSAqIDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiA5MSAqIDI0ICogNjAgKiA2MCxcbiAgICAgIG1pbGxpc2Vjb25kczogOTEgKiAyNCAqIDYwICogNjAgKiAxMDAwLFxuICAgIH0sXG4gICAgbW9udGhzOiB7XG4gICAgICB3ZWVrczogNCxcbiAgICAgIGRheXM6IDMwLFxuICAgICAgaG91cnM6IDMwICogMjQsXG4gICAgICBtaW51dGVzOiAzMCAqIDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiAzMCAqIDI0ICogNjAgKiA2MCxcbiAgICAgIG1pbGxpc2Vjb25kczogMzAgKiAyNCAqIDYwICogNjAgKiAxMDAwLFxuICAgIH0sXG5cbiAgICAuLi5sb3dPcmRlck1hdHJpeCxcbiAgfSxcbiAgZGF5c0luWWVhckFjY3VyYXRlID0gMTQ2MDk3LjAgLyA0MDAsXG4gIGRheXNJbk1vbnRoQWNjdXJhdGUgPSAxNDYwOTcuMCAvIDQ4MDAsXG4gIGFjY3VyYXRlTWF0cml4ID0ge1xuICAgIHllYXJzOiB7XG4gICAgICBxdWFydGVyczogNCxcbiAgICAgIG1vbnRoczogMTIsXG4gICAgICB3ZWVrczogZGF5c0luWWVhckFjY3VyYXRlIC8gNyxcbiAgICAgIGRheXM6IGRheXNJblllYXJBY2N1cmF0ZSxcbiAgICAgIGhvdXJzOiBkYXlzSW5ZZWFyQWNjdXJhdGUgKiAyNCxcbiAgICAgIG1pbnV0ZXM6IGRheXNJblllYXJBY2N1cmF0ZSAqIDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiBkYXlzSW5ZZWFyQWNjdXJhdGUgKiAyNCAqIDYwICogNjAsXG4gICAgICBtaWxsaXNlY29uZHM6IGRheXNJblllYXJBY2N1cmF0ZSAqIDI0ICogNjAgKiA2MCAqIDEwMDAsXG4gICAgfSxcbiAgICBxdWFydGVyczoge1xuICAgICAgbW9udGhzOiAzLFxuICAgICAgd2Vla3M6IGRheXNJblllYXJBY2N1cmF0ZSAvIDI4LFxuICAgICAgZGF5czogZGF5c0luWWVhckFjY3VyYXRlIC8gNCxcbiAgICAgIGhvdXJzOiAoZGF5c0luWWVhckFjY3VyYXRlICogMjQpIC8gNCxcbiAgICAgIG1pbnV0ZXM6IChkYXlzSW5ZZWFyQWNjdXJhdGUgKiAyNCAqIDYwKSAvIDQsXG4gICAgICBzZWNvbmRzOiAoZGF5c0luWWVhckFjY3VyYXRlICogMjQgKiA2MCAqIDYwKSAvIDQsXG4gICAgICBtaWxsaXNlY29uZHM6IChkYXlzSW5ZZWFyQWNjdXJhdGUgKiAyNCAqIDYwICogNjAgKiAxMDAwKSAvIDQsXG4gICAgfSxcbiAgICBtb250aHM6IHtcbiAgICAgIHdlZWtzOiBkYXlzSW5Nb250aEFjY3VyYXRlIC8gNyxcbiAgICAgIGRheXM6IGRheXNJbk1vbnRoQWNjdXJhdGUsXG4gICAgICBob3VyczogZGF5c0luTW9udGhBY2N1cmF0ZSAqIDI0LFxuICAgICAgbWludXRlczogZGF5c0luTW9udGhBY2N1cmF0ZSAqIDI0ICogNjAsXG4gICAgICBzZWNvbmRzOiBkYXlzSW5Nb250aEFjY3VyYXRlICogMjQgKiA2MCAqIDYwLFxuICAgICAgbWlsbGlzZWNvbmRzOiBkYXlzSW5Nb250aEFjY3VyYXRlICogMjQgKiA2MCAqIDYwICogMTAwMCxcbiAgICB9LFxuICAgIC4uLmxvd09yZGVyTWF0cml4LFxuICB9O1xuXG4vLyB1bml0cyBvcmRlcmVkIGJ5IHNpemVcbmNvbnN0IG9yZGVyZWRVbml0cyQxID0gW1xuICBcInllYXJzXCIsXG4gIFwicXVhcnRlcnNcIixcbiAgXCJtb250aHNcIixcbiAgXCJ3ZWVrc1wiLFxuICBcImRheXNcIixcbiAgXCJob3Vyc1wiLFxuICBcIm1pbnV0ZXNcIixcbiAgXCJzZWNvbmRzXCIsXG4gIFwibWlsbGlzZWNvbmRzXCIsXG5dO1xuXG5jb25zdCByZXZlcnNlVW5pdHMgPSBvcmRlcmVkVW5pdHMkMS5zbGljZSgwKS5yZXZlcnNlKCk7XG5cbi8vIGNsb25lIHJlYWxseSBtZWFucyBcImNyZWF0ZSBhbm90aGVyIGluc3RhbmNlIGp1c3QgbGlrZSB0aGlzIG9uZSwgYnV0IHdpdGggdGhlc2UgY2hhbmdlc1wiXG5mdW5jdGlvbiBjbG9uZSQxKGR1ciwgYWx0cywgY2xlYXIgPSBmYWxzZSkge1xuICAvLyBkZWVwIG1lcmdlIGZvciB2YWxzXG4gIGNvbnN0IGNvbmYgPSB7XG4gICAgdmFsdWVzOiBjbGVhciA/IGFsdHMudmFsdWVzIDogeyAuLi5kdXIudmFsdWVzLCAuLi4oYWx0cy52YWx1ZXMgfHwge30pIH0sXG4gICAgbG9jOiBkdXIubG9jLmNsb25lKGFsdHMubG9jKSxcbiAgICBjb252ZXJzaW9uQWNjdXJhY3k6IGFsdHMuY29udmVyc2lvbkFjY3VyYWN5IHx8IGR1ci5jb252ZXJzaW9uQWNjdXJhY3ksXG4gICAgbWF0cml4OiBhbHRzLm1hdHJpeCB8fCBkdXIubWF0cml4LFxuICB9O1xuICByZXR1cm4gbmV3IER1cmF0aW9uKGNvbmYpO1xufVxuXG5mdW5jdGlvbiBkdXJhdGlvblRvTWlsbGlzKG1hdHJpeCwgdmFscykge1xuICBsZXQgc3VtID0gdmFscy5taWxsaXNlY29uZHMgPz8gMDtcbiAgZm9yIChjb25zdCB1bml0IG9mIHJldmVyc2VVbml0cy5zbGljZSgxKSkge1xuICAgIGlmICh2YWxzW3VuaXRdKSB7XG4gICAgICBzdW0gKz0gdmFsc1t1bml0XSAqIG1hdHJpeFt1bml0XVtcIm1pbGxpc2Vjb25kc1wiXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN1bTtcbn1cblxuLy8gTkI6IG11dGF0ZXMgcGFyYW1ldGVyc1xuZnVuY3Rpb24gbm9ybWFsaXplVmFsdWVzKG1hdHJpeCwgdmFscykge1xuICAvLyB0aGUgbG9naWMgYmVsb3cgYXNzdW1lcyB0aGUgb3ZlcmFsbCB2YWx1ZSBvZiB0aGUgZHVyYXRpb24gaXMgcG9zaXRpdmVcbiAgLy8gaWYgdGhpcyBpcyBub3QgdGhlIGNhc2UsIGZhY3RvciBpcyB1c2VkIHRvIG1ha2UgaXQgc29cbiAgY29uc3QgZmFjdG9yID0gZHVyYXRpb25Ub01pbGxpcyhtYXRyaXgsIHZhbHMpIDwgMCA/IC0xIDogMTtcblxuICBvcmRlcmVkVW5pdHMkMS5yZWR1Y2VSaWdodCgocHJldmlvdXMsIGN1cnJlbnQpID0+IHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHZhbHNbY3VycmVudF0pKSB7XG4gICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNWYWwgPSB2YWxzW3ByZXZpb3VzXSAqIGZhY3RvcjtcbiAgICAgICAgY29uc3QgY29udiA9IG1hdHJpeFtjdXJyZW50XVtwcmV2aW91c107XG5cbiAgICAgICAgLy8gaWYgKHByZXZpb3VzVmFsIDwgMCk6XG4gICAgICAgIC8vIGxvd2VyIG9yZGVyIHVuaXQgaXMgbmVnYXRpdmUgKGUuZy4geyB5ZWFyczogMiwgZGF5czogLTIgfSlcbiAgICAgICAgLy8gbm9ybWFsaXplIHRoaXMgYnkgcmVkdWNpbmcgdGhlIGhpZ2hlciBvcmRlciB1bml0IGJ5IHRoZSBhcHByb3ByaWF0ZSBhbW91bnRcbiAgICAgICAgLy8gYW5kIGluY3JlYXNpbmcgdGhlIGxvd2VyIG9yZGVyIHVuaXRcbiAgICAgICAgLy8gdGhpcyBjYW4gbmV2ZXIgbWFrZSB0aGUgaGlnaGVyIG9yZGVyIHVuaXQgbmVnYXRpdmUsIGJlY2F1c2UgdGhpcyBmdW5jdGlvbiBvbmx5IG9wZXJhdGVzXG4gICAgICAgIC8vIG9uIHBvc2l0aXZlIGR1cmF0aW9ucywgc28gdGhlIGFtb3VudCBvZiB0aW1lIHJlcHJlc2VudGVkIGJ5IHRoZSBsb3dlciBvcmRlciB1bml0IGNhbm5vdFxuICAgICAgICAvLyBiZSBsYXJnZXIgdGhhbiB0aGUgaGlnaGVyIG9yZGVyIHVuaXRcbiAgICAgICAgLy8gZWxzZTpcbiAgICAgICAgLy8gbG93ZXIgb3JkZXIgdW5pdCBpcyBwb3NpdGl2ZSAoZS5nLiB7IHllYXJzOiAyLCBkYXlzOiA0NTAgfSBvciB7IHllYXJzOiAtMiwgZGF5czogNDUwIH0pXG4gICAgICAgIC8vIGluIHRoaXMgY2FzZSB3ZSBhdHRlbXB0IHRvIGNvbnZlcnQgYXMgbXVjaCBhcyBwb3NzaWJsZSBmcm9tIHRoZSBsb3dlciBvcmRlciB1bml0IGludG9cbiAgICAgICAgLy8gdGhlIGhpZ2hlciBvcmRlciBvbmVcbiAgICAgICAgLy9cbiAgICAgICAgLy8gTWF0aC5mbG9vciB0YWtlcyBjYXJlIG9mIGJvdGggb2YgdGhlc2UgY2FzZXMsIHJvdW5kaW5nIGF3YXkgZnJvbSAwXG4gICAgICAgIC8vIGlmIHByZXZpb3VzVmFsIDwgMCBpdCBtYWtlcyB0aGUgYWJzb2x1dGUgdmFsdWUgbGFyZ2VyXG4gICAgICAgIC8vIGlmIHByZXZpb3VzVmFsID49IGl0IG1ha2VzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBzbWFsbGVyXG4gICAgICAgIGNvbnN0IHJvbGxVcCA9IE1hdGguZmxvb3IocHJldmlvdXNWYWwgLyBjb252KTtcbiAgICAgICAgdmFsc1tjdXJyZW50XSArPSByb2xsVXAgKiBmYWN0b3I7XG4gICAgICAgIHZhbHNbcHJldmlvdXNdIC09IHJvbGxVcCAqIGNvbnYgKiBmYWN0b3I7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByZXZpb3VzO1xuICAgIH1cbiAgfSwgbnVsbCk7XG5cbiAgLy8gdHJ5IHRvIGNvbnZlcnQgYW55IGRlY2ltYWxzIGludG8gc21hbGxlciB1bml0cyBpZiBwb3NzaWJsZVxuICAvLyBmb3IgZXhhbXBsZSBmb3IgeyB5ZWFyczogMi41LCBkYXlzOiAwLCBzZWNvbmRzOiAwIH0gd2Ugd2FudCB0byBnZXQgeyB5ZWFyczogMiwgZGF5czogMTgyLCBob3VyczogMTIgfVxuICBvcmRlcmVkVW5pdHMkMS5yZWR1Y2UoKHByZXZpb3VzLCBjdXJyZW50KSA9PiB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh2YWxzW2N1cnJlbnRdKSkge1xuICAgICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgIGNvbnN0IGZyYWN0aW9uID0gdmFsc1twcmV2aW91c10gJSAxO1xuICAgICAgICB2YWxzW3ByZXZpb3VzXSAtPSBmcmFjdGlvbjtcbiAgICAgICAgdmFsc1tjdXJyZW50XSArPSBmcmFjdGlvbiAqIG1hdHJpeFtwcmV2aW91c11bY3VycmVudF07XG4gICAgICB9XG4gICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByZXZpb3VzO1xuICAgIH1cbiAgfSwgbnVsbCk7XG59XG5cbi8vIFJlbW92ZSBhbGwgcHJvcGVydGllcyB3aXRoIGEgdmFsdWUgb2YgMCBmcm9tIGFuIG9iamVjdFxuZnVuY3Rpb24gcmVtb3ZlWmVyb2VzKHZhbHMpIHtcbiAgY29uc3QgbmV3VmFscyA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YWxzKSkge1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgbmV3VmFsc1trZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdWYWxzO1xufVxuXG4vKipcbiAqIEEgRHVyYXRpb24gb2JqZWN0IHJlcHJlc2VudHMgYSBwZXJpb2Qgb2YgdGltZSwgbGlrZSBcIjIgbW9udGhzXCIgb3IgXCIxIGRheSwgMSBob3VyXCIuIENvbmNlcHR1YWxseSwgaXQncyBqdXN0IGEgbWFwIG9mIHVuaXRzIHRvIHRoZWlyIHF1YW50aXRpZXMsIGFjY29tcGFuaWVkIGJ5IHNvbWUgYWRkaXRpb25hbCBjb25maWd1cmF0aW9uIGFuZCBtZXRob2RzIGZvciBjcmVhdGluZywgcGFyc2luZywgaW50ZXJyb2dhdGluZywgdHJhbnNmb3JtaW5nLCBhbmQgZm9ybWF0dGluZyB0aGVtLiBUaGV5IGNhbiBiZSB1c2VkIG9uIHRoZWlyIG93biBvciBpbiBjb25qdW5jdGlvbiB3aXRoIG90aGVyIEx1eG9uIHR5cGVzOyBmb3IgZXhhbXBsZSwgeW91IGNhbiB1c2Uge0BsaW5rIERhdGVUaW1lI3BsdXN9IHRvIGFkZCBhIER1cmF0aW9uIG9iamVjdCB0byBhIERhdGVUaW1lLCBwcm9kdWNpbmcgYW5vdGhlciBEYXRlVGltZS5cbiAqXG4gKiBIZXJlIGlzIGEgYnJpZWYgb3ZlcnZpZXcgb2YgY29tbW9ubHkgdXNlZCBtZXRob2RzIGFuZCBnZXR0ZXJzIGluIER1cmF0aW9uOlxuICpcbiAqICogKipDcmVhdGlvbioqIFRvIGNyZWF0ZSBhIER1cmF0aW9uLCB1c2Uge0BsaW5rIER1cmF0aW9uLmZyb21NaWxsaXN9LCB7QGxpbmsgRHVyYXRpb24uZnJvbU9iamVjdH0sIG9yIHtAbGluayBEdXJhdGlvbi5mcm9tSVNPfS5cbiAqICogKipVbml0IHZhbHVlcyoqIFNlZSB0aGUge0BsaW5rIER1cmF0aW9uI3llYXJzfSwge0BsaW5rIER1cmF0aW9uI21vbnRoc30sIHtAbGluayBEdXJhdGlvbiN3ZWVrc30sIHtAbGluayBEdXJhdGlvbiNkYXlzfSwge0BsaW5rIER1cmF0aW9uI2hvdXJzfSwge0BsaW5rIER1cmF0aW9uI21pbnV0ZXN9LCB7QGxpbmsgRHVyYXRpb24jc2Vjb25kc30sIHtAbGluayBEdXJhdGlvbiNtaWxsaXNlY29uZHN9IGFjY2Vzc29ycy5cbiAqICogKipDb25maWd1cmF0aW9uKiogU2VlICB7QGxpbmsgRHVyYXRpb24jbG9jYWxlfSBhbmQge0BsaW5rIER1cmF0aW9uI251bWJlcmluZ1N5c3RlbX0gYWNjZXNzb3JzLlxuICogKiAqKlRyYW5zZm9ybWF0aW9uKiogVG8gY3JlYXRlIG5ldyBEdXJhdGlvbnMgb3V0IG9mIG9sZCBvbmVzIHVzZSB7QGxpbmsgRHVyYXRpb24jcGx1c30sIHtAbGluayBEdXJhdGlvbiNtaW51c30sIHtAbGluayBEdXJhdGlvbiNub3JtYWxpemV9LCB7QGxpbmsgRHVyYXRpb24jc2V0fSwge0BsaW5rIER1cmF0aW9uI3JlY29uZmlndXJlfSwge0BsaW5rIER1cmF0aW9uI3NoaWZ0VG99LCBhbmQge0BsaW5rIER1cmF0aW9uI25lZ2F0ZX0uXG4gKiAqICoqT3V0cHV0KiogVG8gY29udmVydCB0aGUgRHVyYXRpb24gaW50byBvdGhlciByZXByZXNlbnRhdGlvbnMsIHNlZSB7QGxpbmsgRHVyYXRpb24jYXN9LCB7QGxpbmsgRHVyYXRpb24jdG9JU099LCB7QGxpbmsgRHVyYXRpb24jdG9Gb3JtYXR9LCBhbmQge0BsaW5rIER1cmF0aW9uI3RvSlNPTn1cbiAqXG4gKiBUaGVyZSdzIGFyZSBtb3JlIG1ldGhvZHMgZG9jdW1lbnRlZCBiZWxvdy4gSW4gYWRkaXRpb24sIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHN1YnRsZXIgdG9waWNzIGxpa2UgaW50ZXJuYXRpb25hbGl6YXRpb24gYW5kIHZhbGlkaXR5LCBzZWUgdGhlIGV4dGVybmFsIGRvY3VtZW50YXRpb24uXG4gKi9cbmNsYXNzIER1cmF0aW9uIHtcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBjb25zdCBhY2N1cmF0ZSA9IGNvbmZpZy5jb252ZXJzaW9uQWNjdXJhY3kgPT09IFwibG9uZ3Rlcm1cIiB8fCBmYWxzZTtcbiAgICBsZXQgbWF0cml4ID0gYWNjdXJhdGUgPyBhY2N1cmF0ZU1hdHJpeCA6IGNhc3VhbE1hdHJpeDtcblxuICAgIGlmIChjb25maWcubWF0cml4KSB7XG4gICAgICBtYXRyaXggPSBjb25maWcubWF0cml4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMudmFsdWVzID0gY29uZmlnLnZhbHVlcztcbiAgICAvKipcbiAgICAgKiBAYWNjZXNzIHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLmxvYyA9IGNvbmZpZy5sb2MgfHwgTG9jYWxlLmNyZWF0ZSgpO1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuY29udmVyc2lvbkFjY3VyYWN5ID0gYWNjdXJhdGUgPyBcImxvbmd0ZXJtXCIgOiBcImNhc3VhbFwiO1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuaW52YWxpZCA9IGNvbmZpZy5pbnZhbGlkIHx8IG51bGw7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5tYXRyaXggPSBtYXRyaXg7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5pc0x1eG9uRHVyYXRpb24gPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBEdXJhdGlvbiBmcm9tIGEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IG9mIG1pbGxpc2Vjb25kc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgZm9yIHBhcnNpbmdcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nZW4tVVMnXSAtIHRoZSBsb2NhbGUgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLm51bWJlcmluZ1N5c3RlbSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuY29udmVyc2lvbkFjY3VyYWN5PSdjYXN1YWwnXSAtIHRoZSBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBzdGF0aWMgZnJvbU1pbGxpcyhjb3VudCwgb3B0cykge1xuICAgIHJldHVybiBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgbWlsbGlzZWNvbmRzOiBjb3VudCB9LCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEdXJhdGlvbiBmcm9tIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2l0aCBrZXlzIGxpa2UgJ3llYXJzJyBhbmQgJ2hvdXJzJy5cbiAgICogSWYgdGhpcyBvYmplY3QgaXMgZW1wdHkgdGhlbiBhIHplcm8gbWlsbGlzZWNvbmRzIGR1cmF0aW9uIGlzIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gdGhlIG9iamVjdCB0byBjcmVhdGUgdGhlIERhdGVUaW1lIGZyb21cbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai55ZWFyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gb2JqLnF1YXJ0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvYmoubW9udGhzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvYmoud2Vla3NcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5kYXlzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvYmouaG91cnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5taW51dGVzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvYmouc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gb2JqLm1pbGxpc2Vjb25kc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdHM9W11dIC0gb3B0aW9ucyBmb3IgY3JlYXRpbmcgdGhpcyBEdXJhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlPSdlbi1VUyddIC0gdGhlIGxvY2FsZSB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMubnVtYmVyaW5nU3lzdGVtIC0gdGhlIG51bWJlcmluZyBzeXN0ZW0gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5jb252ZXJzaW9uQWNjdXJhY3k9J2Nhc3VhbCddIC0gdGhlIHByZXNldCBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLm1hdHJpeD1PYmplY3RdIC0gdGhlIGN1c3RvbSBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBzdGF0aWMgZnJvbU9iamVjdChvYmosIG9wdHMgPSB7fSkge1xuICAgIGlmIChvYmogPT0gbnVsbCB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXG4gICAgICAgIGBEdXJhdGlvbi5mcm9tT2JqZWN0OiBhcmd1bWVudCBleHBlY3RlZCB0byBiZSBhbiBvYmplY3QsIGdvdCAke1xuICAgICAgICAgIG9iaiA9PT0gbnVsbCA/IFwibnVsbFwiIDogdHlwZW9mIG9ialxuICAgICAgICB9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IER1cmF0aW9uKHtcbiAgICAgIHZhbHVlczogbm9ybWFsaXplT2JqZWN0KG9iaiwgRHVyYXRpb24ubm9ybWFsaXplVW5pdCksXG4gICAgICBsb2M6IExvY2FsZS5mcm9tT2JqZWN0KG9wdHMpLFxuICAgICAgY29udmVyc2lvbkFjY3VyYWN5OiBvcHRzLmNvbnZlcnNpb25BY2N1cmFjeSxcbiAgICAgIG1hdHJpeDogb3B0cy5tYXRyaXgsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRHVyYXRpb24gZnJvbSBEdXJhdGlvbkxpa2UuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0IHwgbnVtYmVyIHwgRHVyYXRpb259IGR1cmF0aW9uTGlrZVxuICAgKiBPbmUgb2Y6XG4gICAqIC0gb2JqZWN0IHdpdGgga2V5cyBsaWtlICd5ZWFycycgYW5kICdob3VycycuXG4gICAqIC0gbnVtYmVyIHJlcHJlc2VudGluZyBtaWxsaXNlY29uZHNcbiAgICogLSBEdXJhdGlvbiBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHN0YXRpYyBmcm9tRHVyYXRpb25MaWtlKGR1cmF0aW9uTGlrZSkge1xuICAgIGlmIChpc051bWJlcihkdXJhdGlvbkxpa2UpKSB7XG4gICAgICByZXR1cm4gRHVyYXRpb24uZnJvbU1pbGxpcyhkdXJhdGlvbkxpa2UpO1xuICAgIH0gZWxzZSBpZiAoRHVyYXRpb24uaXNEdXJhdGlvbihkdXJhdGlvbkxpa2UpKSB7XG4gICAgICByZXR1cm4gZHVyYXRpb25MaWtlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGR1cmF0aW9uTGlrZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIER1cmF0aW9uLmZyb21PYmplY3QoZHVyYXRpb25MaWtlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudEVycm9yKFxuICAgICAgICBgVW5rbm93biBkdXJhdGlvbiBhcmd1bWVudCAke2R1cmF0aW9uTGlrZX0gb2YgdHlwZSAke3R5cGVvZiBkdXJhdGlvbkxpa2V9YFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRHVyYXRpb24gZnJvbSBhbiBJU08gODYwMSBkdXJhdGlvbiBzdHJpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gdGV4dCB0byBwYXJzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgZm9yIHBhcnNpbmdcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nZW4tVVMnXSAtIHRoZSBsb2NhbGUgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLm51bWJlcmluZ1N5c3RlbSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuY29udmVyc2lvbkFjY3VyYWN5PSdjYXN1YWwnXSAtIHRoZSBwcmVzZXQgY29udmVyc2lvbiBzeXN0ZW0gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5tYXRyaXg9T2JqZWN0XSAtIHRoZSBwcmVzZXQgY29udmVyc2lvbiBzeXN0ZW0gdG8gdXNlXG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPXzg2MDEjRHVyYXRpb25zXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21JU08oJ1AzWTZNMVc0RFQxMkgzME01UycpLnRvT2JqZWN0KCkgLy89PiB7IHllYXJzOiAzLCBtb250aHM6IDYsIHdlZWtzOiAxLCBkYXlzOiA0LCBob3VyczogMTIsIG1pbnV0ZXM6IDMwLCBzZWNvbmRzOiA1IH1cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbUlTTygnUFQyM0gnKS50b09iamVjdCgpIC8vPT4geyBob3VyczogMjMgfVxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tSVNPKCdQNVkzTScpLnRvT2JqZWN0KCkgLy89PiB7IHllYXJzOiA1LCBtb250aHM6IDMgfVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHN0YXRpYyBmcm9tSVNPKHRleHQsIG9wdHMpIHtcbiAgICBjb25zdCBbcGFyc2VkXSA9IHBhcnNlSVNPRHVyYXRpb24odGV4dCk7XG4gICAgaWYgKHBhcnNlZCkge1xuICAgICAgcmV0dXJuIER1cmF0aW9uLmZyb21PYmplY3QocGFyc2VkLCBvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIER1cmF0aW9uLmludmFsaWQoXCJ1bnBhcnNhYmxlXCIsIGB0aGUgaW5wdXQgXCIke3RleHR9XCIgY2FuJ3QgYmUgcGFyc2VkIGFzIElTTyA4NjAxYCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIER1cmF0aW9uIGZyb20gYW4gSVNPIDg2MDEgdGltZSBzdHJpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gdGV4dCB0byBwYXJzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgZm9yIHBhcnNpbmdcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nZW4tVVMnXSAtIHRoZSBsb2NhbGUgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLm51bWJlcmluZ1N5c3RlbSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuY29udmVyc2lvbkFjY3VyYWN5PSdjYXN1YWwnXSAtIHRoZSBwcmVzZXQgY29udmVyc2lvbiBzeXN0ZW0gdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5tYXRyaXg9T2JqZWN0XSAtIHRoZSBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fODYwMSNUaW1lc1xuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tSVNPVGltZSgnMTE6MjI6MzMuNDQ0JykudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDExLCBtaW51dGVzOiAyMiwgc2Vjb25kczogMzMsIG1pbGxpc2Vjb25kczogNDQ0IH1cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbUlTT1RpbWUoJzExOjAwJykudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDExLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwIH1cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbUlTT1RpbWUoJ1QxMTowMCcpLnRvT2JqZWN0KCkgLy89PiB7IGhvdXJzOiAxMSwgbWludXRlczogMCwgc2Vjb25kczogMCB9XG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21JU09UaW1lKCcxMTAwJykudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDExLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwIH1cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbUlTT1RpbWUoJ1QxMTAwJykudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDExLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwIH1cbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBzdGF0aWMgZnJvbUlTT1RpbWUodGV4dCwgb3B0cykge1xuICAgIGNvbnN0IFtwYXJzZWRdID0gcGFyc2VJU09UaW1lT25seSh0ZXh0KTtcbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICByZXR1cm4gRHVyYXRpb24uZnJvbU9iamVjdChwYXJzZWQsIG9wdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gRHVyYXRpb24uaW52YWxpZChcInVucGFyc2FibGVcIiwgYHRoZSBpbnB1dCBcIiR7dGV4dH1cIiBjYW4ndCBiZSBwYXJzZWQgYXMgSVNPIDg2MDFgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGludmFsaWQgRHVyYXRpb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb24gLSBzaW1wbGUgc3RyaW5nIG9mIHdoeSB0aGlzIGRhdGV0aW1lIGlzIGludmFsaWQuIFNob3VsZCBub3QgY29udGFpbiBwYXJhbWV0ZXJzIG9yIGFueXRoaW5nIGVsc2UgZGF0YS1kZXBlbmRlbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtleHBsYW5hdGlvbj1udWxsXSAtIGxvbmdlciBleHBsYW5hdGlvbiwgbWF5IGluY2x1ZGUgcGFyYW1ldGVycyBhbmQgb3RoZXIgdXNlZnVsIGRlYnVnZ2luZyBpbmZvcm1hdGlvblxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHN0YXRpYyBpbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24gPSBudWxsKSB7XG4gICAgaWYgKCFyZWFzb24pIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnRFcnJvcihcIm5lZWQgdG8gc3BlY2lmeSBhIHJlYXNvbiB0aGUgRHVyYXRpb24gaXMgaW52YWxpZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZhbGlkID0gcmVhc29uIGluc3RhbmNlb2YgSW52YWxpZCA/IHJlYXNvbiA6IG5ldyBJbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24pO1xuXG4gICAgaWYgKFNldHRpbmdzLnRocm93T25JbnZhbGlkKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZER1cmF0aW9uRXJyb3IoaW52YWxpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgRHVyYXRpb24oeyBpbnZhbGlkIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZVVuaXQodW5pdCkge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB7XG4gICAgICB5ZWFyOiBcInllYXJzXCIsXG4gICAgICB5ZWFyczogXCJ5ZWFyc1wiLFxuICAgICAgcXVhcnRlcjogXCJxdWFydGVyc1wiLFxuICAgICAgcXVhcnRlcnM6IFwicXVhcnRlcnNcIixcbiAgICAgIG1vbnRoOiBcIm1vbnRoc1wiLFxuICAgICAgbW9udGhzOiBcIm1vbnRoc1wiLFxuICAgICAgd2VlazogXCJ3ZWVrc1wiLFxuICAgICAgd2Vla3M6IFwid2Vla3NcIixcbiAgICAgIGRheTogXCJkYXlzXCIsXG4gICAgICBkYXlzOiBcImRheXNcIixcbiAgICAgIGhvdXI6IFwiaG91cnNcIixcbiAgICAgIGhvdXJzOiBcImhvdXJzXCIsXG4gICAgICBtaW51dGU6IFwibWludXRlc1wiLFxuICAgICAgbWludXRlczogXCJtaW51dGVzXCIsXG4gICAgICBzZWNvbmQ6IFwic2Vjb25kc1wiLFxuICAgICAgc2Vjb25kczogXCJzZWNvbmRzXCIsXG4gICAgICBtaWxsaXNlY29uZDogXCJtaWxsaXNlY29uZHNcIixcbiAgICAgIG1pbGxpc2Vjb25kczogXCJtaWxsaXNlY29uZHNcIixcbiAgICB9W3VuaXQgPyB1bml0LnRvTG93ZXJDYXNlKCkgOiB1bml0XTtcblxuICAgIGlmICghbm9ybWFsaXplZCkgdGhyb3cgbmV3IEludmFsaWRVbml0RXJyb3IodW5pdCk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgYSBEdXJhdGlvbi4gV29ya3MgYWNyb3NzIGNvbnRleHQgYm91bmRhcmllc1xuICAgKiBAcGFyYW0ge29iamVjdH0gb1xuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgc3RhdGljIGlzRHVyYXRpb24obykge1xuICAgIHJldHVybiAobyAmJiBvLmlzTHV4b25EdXJhdGlvbikgfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0ICB0aGUgbG9jYWxlIG9mIGEgRHVyYXRpb24sIHN1Y2ggJ2VuLUdCJ1xuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IGxvY2FsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy5sb2MubG9jYWxlIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlcmluZyBzeXN0ZW0gb2YgYSBEdXJhdGlvbiwgc3VjaCAnYmVuZycuIFRoZSBudW1iZXJpbmcgc3lzdGVtIGlzIHVzZWQgd2hlbiBmb3JtYXR0aW5nIHRoZSBEdXJhdGlvblxuICAgKlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IG51bWJlcmluZ1N5c3RlbSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy5sb2MubnVtYmVyaW5nU3lzdGVtIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRHVyYXRpb24gZm9ybWF0dGVkIGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkIGZvcm1hdCBzdHJpbmcuIFlvdSBtYXkgdXNlIHRoZXNlIHRva2VuczpcbiAgICogKiBgU2AgZm9yIG1pbGxpc2Vjb25kc1xuICAgKiAqIGBzYCBmb3Igc2Vjb25kc1xuICAgKiAqIGBtYCBmb3IgbWludXRlc1xuICAgKiAqIGBoYCBmb3IgaG91cnNcbiAgICogKiBgZGAgZm9yIGRheXNcbiAgICogKiBgd2AgZm9yIHdlZWtzXG4gICAqICogYE1gIGZvciBtb250aHNcbiAgICogKiBgeWAgZm9yIHllYXJzXG4gICAqIE5vdGVzOlxuICAgKiAqIEFkZCBwYWRkaW5nIGJ5IHJlcGVhdGluZyB0aGUgdG9rZW4sIGUuZy4gXCJ5eVwiIHBhZHMgdGhlIHllYXJzIHRvIHR3byBkaWdpdHMsIFwiaGhoaFwiIHBhZHMgdGhlIGhvdXJzIG91dCB0byBmb3VyIGRpZ2l0c1xuICAgKiAqIFRva2VucyBjYW4gYmUgZXNjYXBlZCBieSB3cmFwcGluZyB3aXRoIHNpbmdsZSBxdW90ZXMuXG4gICAqICogVGhlIGR1cmF0aW9uIHdpbGwgYmUgY29udmVydGVkIHRvIHRoZSBzZXQgb2YgdW5pdHMgaW4gdGhlIGZvcm1hdCBzdHJpbmcgdXNpbmcge0BsaW5rIER1cmF0aW9uI3NoaWZ0VG99IGFuZCB0aGUgRHVyYXRpb25zJ3MgY29udmVyc2lvbiBhY2N1cmFjeSBzZXR0aW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm10IC0gdGhlIGZvcm1hdCBzdHJpbmdcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuZmxvb3I9dHJ1ZV0gLSBmbG9vciBudW1lcmljYWwgdmFsdWVzXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3QoeyB5ZWFyczogMSwgZGF5czogNiwgc2Vjb25kczogMiB9KS50b0Zvcm1hdChcInkgZCBzXCIpIC8vPT4gXCIxIDYgMlwiXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3QoeyB5ZWFyczogMSwgZGF5czogNiwgc2Vjb25kczogMiB9KS50b0Zvcm1hdChcInl5IGRkIHNzc1wiKSAvLz0+IFwiMDEgMDYgMDAyXCJcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IHllYXJzOiAxLCBkYXlzOiA2LCBzZWNvbmRzOiAyIH0pLnRvRm9ybWF0KFwiTSBTXCIpIC8vPT4gXCIxMiA1MTg0MDIwMDBcIlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0Zvcm1hdChmbXQsIG9wdHMgPSB7fSkge1xuICAgIC8vIHJldmVyc2UtY29tcGF0IHNpbmNlIDEuMjsgd2UgYWx3YXlzIHJvdW5kIGRvd24gbm93LCBuZXZlciB1cCwgYW5kIHdlIGRvIGl0IGJ5IGRlZmF1bHRcbiAgICBjb25zdCBmbXRPcHRzID0ge1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGZsb29yOiBvcHRzLnJvdW5kICE9PSBmYWxzZSAmJiBvcHRzLmZsb29yICE9PSBmYWxzZSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWRcbiAgICAgID8gRm9ybWF0dGVyLmNyZWF0ZSh0aGlzLmxvYywgZm10T3B0cykuZm9ybWF0RHVyYXRpb25Gcm9tU3RyaW5nKHRoaXMsIGZtdClcbiAgICAgIDogSU5WQUxJRCQyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBEdXJhdGlvbiB3aXRoIGFsbCB1bml0cyBpbmNsdWRlZC5cbiAgICogVG8gbW9kaWZ5IGl0cyBiZWhhdmlvciwgdXNlIGBsaXN0U3R5bGVgIGFuZCBhbnkgSW50bC5OdW1iZXJGb3JtYXQgb3B0aW9uLCB0aG91Z2ggYHVuaXREaXNwbGF5YCBpcyBlc3BlY2lhbGx5IHJlbGV2YW50LlxuICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0ludGwvTnVtYmVyRm9ybWF0L051bWJlckZvcm1hdCNvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gRm9ybWF0dGluZyBvcHRpb25zLiBBY2NlcHRzIHRoZSBzYW1lIGtleXMgYXMgdGhlIG9wdGlvbnMgcGFyYW1ldGVyIG9mIHRoZSBuYXRpdmUgYEludGwuTnVtYmVyRm9ybWF0YCBjb25zdHJ1Y3RvciwgYXMgd2VsbCBhcyBgbGlzdFN0eWxlYC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxpc3RTdHlsZT0nbmFycm93J10gLSBIb3cgdG8gZm9ybWF0IHRoZSBtZXJnZWQgbGlzdC4gQ29ycmVzcG9uZHMgdG8gdGhlIGBzdHlsZWAgcHJvcGVydHkgb2YgdGhlIG9wdGlvbnMgcGFyYW1ldGVyIG9mIHRoZSBuYXRpdmUgYEludGwuTGlzdEZvcm1hdGAgY29uc3RydWN0b3IuXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYGpzXG4gICAqIHZhciBkdXIgPSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgZGF5czogMSwgaG91cnM6IDUsIG1pbnV0ZXM6IDYgfSlcbiAgICogZHVyLnRvSHVtYW4oKSAvLz0+ICcxIGRheSwgNSBob3VycywgNiBtaW51dGVzJ1xuICAgKiBkdXIudG9IdW1hbih7IGxpc3RTdHlsZTogXCJsb25nXCIgfSkgLy89PiAnMSBkYXksIDUgaG91cnMsIGFuZCA2IG1pbnV0ZXMnXG4gICAqIGR1ci50b0h1bWFuKHsgdW5pdERpc3BsYXk6IFwic2hvcnRcIiB9KSAvLz0+ICcxIGRheSwgNSBociwgNiBtaW4nXG4gICAqIGBgYFxuICAgKi9cbiAgdG9IdW1hbihvcHRzID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIElOVkFMSUQkMjtcblxuICAgIGNvbnN0IGwgPSBvcmRlcmVkVW5pdHMkMVxuICAgICAgLm1hcCgodW5pdCkgPT4ge1xuICAgICAgICBjb25zdCB2YWwgPSB0aGlzLnZhbHVlc1t1bml0XTtcbiAgICAgICAgaWYgKGlzVW5kZWZpbmVkKHZhbCkpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5sb2NcbiAgICAgICAgICAubnVtYmVyRm9ybWF0dGVyKHsgc3R5bGU6IFwidW5pdFwiLCB1bml0RGlzcGxheTogXCJsb25nXCIsIC4uLm9wdHMsIHVuaXQ6IHVuaXQuc2xpY2UoMCwgLTEpIH0pXG4gICAgICAgICAgLmZvcm1hdCh2YWwpO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoKG4pID0+IG4pO1xuXG4gICAgcmV0dXJuIHRoaXMubG9jXG4gICAgICAubGlzdEZvcm1hdHRlcih7IHR5cGU6IFwiY29uanVuY3Rpb25cIiwgc3R5bGU6IG9wdHMubGlzdFN0eWxlIHx8IFwibmFycm93XCIsIC4uLm9wdHMgfSlcbiAgICAgIC5mb3JtYXQobCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEphdmFTY3JpcHQgb2JqZWN0IHdpdGggdGhpcyBEdXJhdGlvbidzIHZhbHVlcy5cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IHllYXJzOiAxLCBkYXlzOiA2LCBzZWNvbmRzOiAyIH0pLnRvT2JqZWN0KCkgLy89PiB7IHllYXJzOiAxLCBkYXlzOiA2LCBzZWNvbmRzOiAyIH1cbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgdG9PYmplY3QoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB7fTtcbiAgICByZXR1cm4geyAuLi50aGlzLnZhbHVlcyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSVNPIDg2MDEtY29tcGxpYW50IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIER1cmF0aW9uLlxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT184NjAxI0R1cmF0aW9uc1xuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgeWVhcnM6IDMsIHNlY29uZHM6IDQ1IH0pLnRvSVNPKCkgLy89PiAnUDNZVDQ1UydcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IG1vbnRoczogNCwgc2Vjb25kczogNDUgfSkudG9JU08oKSAvLz0+ICdQNE1UNDVTJ1xuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgbW9udGhzOiA1IH0pLnRvSVNPKCkgLy89PiAnUDVNJ1xuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgbWludXRlczogNSB9KS50b0lTTygpIC8vPT4gJ1BUNU0nXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3QoeyBtaWxsaXNlY29uZHM6IDYgfSkudG9JU08oKSAvLz0+ICdQVDAuMDA2UydcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9JU08oKSB7XG4gICAgLy8gd2UgY291bGQgdXNlIHRoZSBmb3JtYXR0ZXIsIGJ1dCB0aGlzIGlzIGFuIGVhc2llciB3YXkgdG8gZ2V0IHRoZSBtaW5pbXVtIHN0cmluZ1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBzID0gXCJQXCI7XG4gICAgaWYgKHRoaXMueWVhcnMgIT09IDApIHMgKz0gdGhpcy55ZWFycyArIFwiWVwiO1xuICAgIGlmICh0aGlzLm1vbnRocyAhPT0gMCB8fCB0aGlzLnF1YXJ0ZXJzICE9PSAwKSBzICs9IHRoaXMubW9udGhzICsgdGhpcy5xdWFydGVycyAqIDMgKyBcIk1cIjtcbiAgICBpZiAodGhpcy53ZWVrcyAhPT0gMCkgcyArPSB0aGlzLndlZWtzICsgXCJXXCI7XG4gICAgaWYgKHRoaXMuZGF5cyAhPT0gMCkgcyArPSB0aGlzLmRheXMgKyBcIkRcIjtcbiAgICBpZiAodGhpcy5ob3VycyAhPT0gMCB8fCB0aGlzLm1pbnV0ZXMgIT09IDAgfHwgdGhpcy5zZWNvbmRzICE9PSAwIHx8IHRoaXMubWlsbGlzZWNvbmRzICE9PSAwKVxuICAgICAgcyArPSBcIlRcIjtcbiAgICBpZiAodGhpcy5ob3VycyAhPT0gMCkgcyArPSB0aGlzLmhvdXJzICsgXCJIXCI7XG4gICAgaWYgKHRoaXMubWludXRlcyAhPT0gMCkgcyArPSB0aGlzLm1pbnV0ZXMgKyBcIk1cIjtcbiAgICBpZiAodGhpcy5zZWNvbmRzICE9PSAwIHx8IHRoaXMubWlsbGlzZWNvbmRzICE9PSAwKVxuICAgICAgLy8gdGhpcyB3aWxsIGhhbmRsZSBcImZsb2F0aW5nIHBvaW50IG1hZG5lc3NcIiBieSByZW1vdmluZyBleHRyYSBkZWNpbWFsIHBsYWNlc1xuICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTg4MDA0L2lzLWZsb2F0aW5nLXBvaW50LW1hdGgtYnJva2VuXG4gICAgICBzICs9IHJvdW5kVG8odGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwLCAzKSArIFwiU1wiO1xuICAgIGlmIChzID09PSBcIlBcIikgcyArPSBcIlQwU1wiO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSVNPIDg2MDEtY29tcGxpYW50IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIER1cmF0aW9uLCBmb3JtYXR0ZWQgYXMgYSB0aW1lIG9mIGRheS5cbiAgICogTm90ZSB0aGF0IHRoaXMgd2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgZHVyYXRpb24gaXMgaW52YWxpZCwgbmVnYXRpdmUsIG9yIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiAyNCBob3Vycy5cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fODYwMSNUaW1lc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zdXBwcmVzc01pbGxpc2Vjb25kcz1mYWxzZV0gLSBleGNsdWRlIG1pbGxpc2Vjb25kcyBmcm9tIHRoZSBmb3JtYXQgaWYgdGhleSdyZSAwXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuc3VwcHJlc3NTZWNvbmRzPWZhbHNlXSAtIGV4Y2x1ZGUgc2Vjb25kcyBmcm9tIHRoZSBmb3JtYXQgaWYgdGhleSdyZSAwXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZVByZWZpeD1mYWxzZV0gLSBpbmNsdWRlIHRoZSBgVGAgcHJlZml4XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5mb3JtYXQ9J2V4dGVuZGVkJ10gLSBjaG9vc2UgYmV0d2VlbiB0aGUgYmFzaWMgYW5kIGV4dGVuZGVkIGZvcm1hdFxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDExIH0pLnRvSVNPVGltZSgpIC8vPT4gJzExOjAwOjAwLjAwMCdcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IGhvdXJzOiAxMSB9KS50b0lTT1RpbWUoeyBzdXBwcmVzc01pbGxpc2Vjb25kczogdHJ1ZSB9KSAvLz0+ICcxMTowMDowMCdcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IGhvdXJzOiAxMSB9KS50b0lTT1RpbWUoeyBzdXBwcmVzc1NlY29uZHM6IHRydWUgfSkgLy89PiAnMTE6MDAnXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3QoeyBob3VyczogMTEgfSkudG9JU09UaW1lKHsgaW5jbHVkZVByZWZpeDogdHJ1ZSB9KSAvLz0+ICdUMTE6MDA6MDAuMDAwJ1xuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDExIH0pLnRvSVNPVGltZSh7IGZvcm1hdDogJ2Jhc2ljJyB9KSAvLz0+ICcxMTAwMDAuMDAwJ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0lTT1RpbWUob3B0cyA9IHt9KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgbWlsbGlzID0gdGhpcy50b01pbGxpcygpO1xuICAgIGlmIChtaWxsaXMgPCAwIHx8IG1pbGxpcyA+PSA4NjQwMDAwMCkgcmV0dXJuIG51bGw7XG5cbiAgICBvcHRzID0ge1xuICAgICAgc3VwcHJlc3NNaWxsaXNlY29uZHM6IGZhbHNlLFxuICAgICAgc3VwcHJlc3NTZWNvbmRzOiBmYWxzZSxcbiAgICAgIGluY2x1ZGVQcmVmaXg6IGZhbHNlLFxuICAgICAgZm9ybWF0OiBcImV4dGVuZGVkXCIsXG4gICAgICAuLi5vcHRzLFxuICAgICAgaW5jbHVkZU9mZnNldDogZmFsc2UsXG4gICAgfTtcblxuICAgIGNvbnN0IGRhdGVUaW1lID0gRGF0ZVRpbWUuZnJvbU1pbGxpcyhtaWxsaXMsIHsgem9uZTogXCJVVENcIiB9KTtcbiAgICByZXR1cm4gZGF0ZVRpbWUudG9JU09UaW1lKG9wdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSVNPIDg2MDEgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEdXJhdGlvbiBhcHByb3ByaWF0ZSBmb3IgdXNlIGluIEpTT04uXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gdGhpcy50b0lTTygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSVNPIDg2MDEgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEdXJhdGlvbiBhcHByb3ByaWF0ZSBmb3IgdXNlIGluIGRlYnVnZ2luZy5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9JU08oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRHVyYXRpb24gYXBwcm9wcmlhdGUgZm9yIHRoZSBSRVBMLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICBbU3ltYm9sLmZvcihcIm5vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tXCIpXSgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gYER1cmF0aW9uIHsgdmFsdWVzOiAke0pTT04uc3RyaW5naWZ5KHRoaXMudmFsdWVzKX0gfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgRHVyYXRpb24geyBJbnZhbGlkLCByZWFzb246ICR7dGhpcy5pbnZhbGlkUmVhc29ufSB9YDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBtaWxsaXNlY29uZHMgdmFsdWUgb2YgdGhpcyBEdXJhdGlvbi5cbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgdG9NaWxsaXMoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiBOYU47XG5cbiAgICByZXR1cm4gZHVyYXRpb25Ub01pbGxpcyh0aGlzLm1hdHJpeCwgdGhpcy52YWx1ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gbWlsbGlzZWNvbmRzIHZhbHVlIG9mIHRoaXMgRHVyYXRpb24uIEFsaWFzIG9mIHtAbGluayB0b01pbGxpc31cbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgdmFsdWVPZigpIHtcbiAgICByZXR1cm4gdGhpcy50b01pbGxpcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgdGhpcyBEdXJhdGlvbiBsb25nZXIgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuIFJldHVybiBhIG5ld2x5LWNvbnN0cnVjdGVkIER1cmF0aW9uLlxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufE9iamVjdHxudW1iZXJ9IGR1cmF0aW9uIC0gVGhlIGFtb3VudCB0byBhZGQuIEVpdGhlciBhIEx1eG9uIER1cmF0aW9uLCBhIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIHRoZSBvYmplY3QgYXJndW1lbnQgdG8gRHVyYXRpb24uZnJvbU9iamVjdCgpXG4gICAqIEByZXR1cm4ge0R1cmF0aW9ufVxuICAgKi9cbiAgcGx1cyhkdXJhdGlvbikge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gdGhpcztcblxuICAgIGNvbnN0IGR1ciA9IER1cmF0aW9uLmZyb21EdXJhdGlvbkxpa2UoZHVyYXRpb24pLFxuICAgICAgcmVzdWx0ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGsgb2Ygb3JkZXJlZFVuaXRzJDEpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eShkdXIudmFsdWVzLCBrKSB8fCBoYXNPd25Qcm9wZXJ0eSh0aGlzLnZhbHVlcywgaykpIHtcbiAgICAgICAgcmVzdWx0W2tdID0gZHVyLmdldChrKSArIHRoaXMuZ2V0KGspO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjbG9uZSQxKHRoaXMsIHsgdmFsdWVzOiByZXN1bHQgfSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSB0aGlzIER1cmF0aW9uIHNob3J0ZXIgYnkgdGhlIHNwZWNpZmllZCBhbW91bnQuIFJldHVybiBhIG5ld2x5LWNvbnN0cnVjdGVkIER1cmF0aW9uLlxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufE9iamVjdHxudW1iZXJ9IGR1cmF0aW9uIC0gVGhlIGFtb3VudCB0byBzdWJ0cmFjdC4gRWl0aGVyIGEgTHV4b24gRHVyYXRpb24sIGEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgdGhlIG9iamVjdCBhcmd1bWVudCB0byBEdXJhdGlvbi5mcm9tT2JqZWN0KClcbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBtaW51cyhkdXJhdGlvbikge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gdGhpcztcblxuICAgIGNvbnN0IGR1ciA9IER1cmF0aW9uLmZyb21EdXJhdGlvbkxpa2UoZHVyYXRpb24pO1xuICAgIHJldHVybiB0aGlzLnBsdXMoZHVyLm5lZ2F0ZSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FsZSB0aGlzIER1cmF0aW9uIGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50LiBSZXR1cm4gYSBuZXdseS1jb25zdHJ1Y3RlZCBEdXJhdGlvbi5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gLSBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgdG8gZWFjaCB1bml0LiBBcml0eSBpcyAxIG9yIDI6IHRoZSB2YWx1ZSBvZiB0aGUgdW5pdCBhbmQsIG9wdGlvbmFsbHksIHRoZSB1bml0IG5hbWUuIE11c3QgcmV0dXJuIGEgbnVtYmVyLlxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDEsIG1pbnV0ZXM6IDMwIH0pLm1hcFVuaXRzKHggPT4geCAqIDIpIC8vPT4geyBob3VyczogMiwgbWludXRlczogNjAgfVxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDEsIG1pbnV0ZXM6IDMwIH0pLm1hcFVuaXRzKCh4LCB1KSA9PiB1ID09PSBcImhvdXJzXCIgPyB4ICogMiA6IHgpIC8vPT4geyBob3VyczogMiwgbWludXRlczogMzAgfVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIG1hcFVuaXRzKGZuKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyh0aGlzLnZhbHVlcykpIHtcbiAgICAgIHJlc3VsdFtrXSA9IGFzTnVtYmVyKGZuKHRoaXMudmFsdWVzW2tdLCBrKSk7XG4gICAgfVxuICAgIHJldHVybiBjbG9uZSQxKHRoaXMsIHsgdmFsdWVzOiByZXN1bHQgfSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB2YWx1ZSBvZiB1bml0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIGEgdW5pdCBzdWNoIGFzICdtaW51dGUnIG9yICdkYXknXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3Qoe3llYXJzOiAyLCBkYXlzOiAzfSkuZ2V0KCd5ZWFycycpIC8vPT4gMlxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHt5ZWFyczogMiwgZGF5czogM30pLmdldCgnbW9udGhzJykgLy89PiAwXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3Qoe3llYXJzOiAyLCBkYXlzOiAzfSkuZ2V0KCdkYXlzJykgLy89PiAzXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGdldCh1bml0KSB7XG4gICAgcmV0dXJuIHRoaXNbRHVyYXRpb24ubm9ybWFsaXplVW5pdCh1bml0KV07XG4gIH1cblxuICAvKipcbiAgICogXCJTZXRcIiB0aGUgdmFsdWVzIG9mIHNwZWNpZmllZCB1bml0cy4gUmV0dXJuIGEgbmV3bHktY29uc3RydWN0ZWQgRHVyYXRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgLSBhIG1hcHBpbmcgb2YgdW5pdHMgdG8gbnVtYmVyc1xuICAgKiBAZXhhbXBsZSBkdXIuc2V0KHsgeWVhcnM6IDIwMTcgfSlcbiAgICogQGV4YW1wbGUgZHVyLnNldCh7IGhvdXJzOiA4LCBtaW51dGVzOiAzMCB9KVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHNldCh2YWx1ZXMpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG5cbiAgICBjb25zdCBtaXhlZCA9IHsgLi4udGhpcy52YWx1ZXMsIC4uLm5vcm1hbGl6ZU9iamVjdCh2YWx1ZXMsIER1cmF0aW9uLm5vcm1hbGl6ZVVuaXQpIH07XG4gICAgcmV0dXJuIGNsb25lJDEodGhpcywgeyB2YWx1ZXM6IG1peGVkIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiU2V0XCIgdGhlIGxvY2FsZSBhbmQvb3IgbnVtYmVyaW5nU3lzdGVtLiAgUmV0dXJucyBhIG5ld2x5LWNvbnN0cnVjdGVkIER1cmF0aW9uLlxuICAgKiBAZXhhbXBsZSBkdXIucmVjb25maWd1cmUoeyBsb2NhbGU6ICdlbi1HQicgfSlcbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICByZWNvbmZpZ3VyZSh7IGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBjb252ZXJzaW9uQWNjdXJhY3ksIG1hdHJpeCB9ID0ge30pIHtcbiAgICBjb25zdCBsb2MgPSB0aGlzLmxvYy5jbG9uZSh7IGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtIH0pO1xuICAgIGNvbnN0IG9wdHMgPSB7IGxvYywgbWF0cml4LCBjb252ZXJzaW9uQWNjdXJhY3kgfTtcbiAgICByZXR1cm4gY2xvbmUkMSh0aGlzLCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGxlbmd0aCBvZiB0aGUgZHVyYXRpb24gaW4gdGhlIHNwZWNpZmllZCB1bml0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIGEgdW5pdCBzdWNoIGFzICdtaW51dGVzJyBvciAnZGF5cydcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7eWVhcnM6IDF9KS5hcygnZGF5cycpIC8vPT4gMzY1XG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3Qoe3llYXJzOiAxfSkuYXMoJ21vbnRocycpIC8vPT4gMTJcbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7aG91cnM6IDYwfSkuYXMoJ2RheXMnKSAvLz0+IDIuNVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBhcyh1bml0KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuc2hpZnRUbyh1bml0KS5nZXQodW5pdCkgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogUmVkdWNlIHRoaXMgRHVyYXRpb24gdG8gaXRzIGNhbm9uaWNhbCByZXByZXNlbnRhdGlvbiBpbiBpdHMgY3VycmVudCB1bml0cy5cbiAgICogQXNzdW1pbmcgdGhlIG92ZXJhbGwgdmFsdWUgb2YgdGhlIER1cmF0aW9uIGlzIHBvc2l0aXZlLCB0aGlzIG1lYW5zOlxuICAgKiAtIGV4Y2Vzc2l2ZSB2YWx1ZXMgZm9yIGxvd2VyLW9yZGVyIHVuaXRzIGFyZSBjb252ZXJ0ZWQgdG8gaGlnaGVyLW9yZGVyIHVuaXRzIChpZiBwb3NzaWJsZSwgc2VlIGZpcnN0IGFuZCBzZWNvbmQgZXhhbXBsZSlcbiAgICogLSBuZWdhdGl2ZSBsb3dlci1vcmRlciB1bml0cyBhcmUgY29udmVydGVkIHRvIGhpZ2hlciBvcmRlciB1bml0cyAodGhlcmUgbXVzdCBiZSBzdWNoIGEgaGlnaGVyIG9yZGVyIHVuaXQsIG90aGVyd2lzZVxuICAgKiAgIHRoZSBvdmVyYWxsIHZhbHVlIHdvdWxkIGJlIG5lZ2F0aXZlLCBzZWUgdGhpcmQgZXhhbXBsZSlcbiAgICogLSBmcmFjdGlvbmFsIHZhbHVlcyBmb3IgaGlnaGVyLW9yZGVyIHVuaXRzIGFyZSBjb252ZXJ0ZWQgdG8gbG93ZXItb3JkZXIgdW5pdHMgKGlmIHBvc3NpYmxlLCBzZWUgZm91cnRoIGV4YW1wbGUpXG4gICAqXG4gICAqIElmIHRoZSBvdmVyYWxsIHZhbHVlIGlzIG5lZ2F0aXZlLCB0aGUgcmVzdWx0IG9mIHRoaXMgbWV0aG9kIGlzIGVxdWl2YWxlbnQgdG8gYHRoaXMubmVnYXRlKCkubm9ybWFsaXplKCkubmVnYXRlKClgLlxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgeWVhcnM6IDIsIGRheXM6IDUwMDAgfSkubm9ybWFsaXplKCkudG9PYmplY3QoKSAvLz0+IHsgeWVhcnM6IDE1LCBkYXlzOiAyNTUgfVxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgZGF5czogNTAwMCB9KS5ub3JtYWxpemUoKS50b09iamVjdCgpIC8vPT4geyBkYXlzOiA1MDAwIH1cbiAgICogQGV4YW1wbGUgRHVyYXRpb24uZnJvbU9iamVjdCh7IGhvdXJzOiAxMiwgbWludXRlczogLTQ1IH0pLm5vcm1hbGl6ZSgpLnRvT2JqZWN0KCkgLy89PiB7IGhvdXJzOiAxMSwgbWludXRlczogMTUgfVxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgeWVhcnM6IDIuNSwgZGF5czogMCwgaG91cnM6IDAgfSkubm9ybWFsaXplKCkudG9PYmplY3QoKSAvLz0+IHsgeWVhcnM6IDIsIGRheXM6IDE4MiwgaG91cnM6IDEyIH1cbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBub3JtYWxpemUoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB0aGlzO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnRvT2JqZWN0KCk7XG4gICAgbm9ybWFsaXplVmFsdWVzKHRoaXMubWF0cml4LCB2YWxzKTtcbiAgICByZXR1cm4gY2xvbmUkMSh0aGlzLCB7IHZhbHVlczogdmFscyB9LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNjYWxlIHVuaXRzIHRvIGl0cyBsYXJnZXN0IHJlcHJlc2VudGF0aW9uXG4gICAqIEBleGFtcGxlIER1cmF0aW9uLmZyb21PYmplY3QoeyBtaWxsaXNlY29uZHM6IDkwMDAwIH0pLnJlc2NhbGUoKS50b09iamVjdCgpIC8vPT4geyBtaW51dGVzOiAxLCBzZWNvbmRzOiAzMCB9XG4gICAqIEByZXR1cm4ge0R1cmF0aW9ufVxuICAgKi9cbiAgcmVzY2FsZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG4gICAgY29uc3QgdmFscyA9IHJlbW92ZVplcm9lcyh0aGlzLm5vcm1hbGl6ZSgpLnNoaWZ0VG9BbGwoKS50b09iamVjdCgpKTtcbiAgICByZXR1cm4gY2xvbmUkMSh0aGlzLCB7IHZhbHVlczogdmFscyB9LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoaXMgRHVyYXRpb24gaW50byBpdHMgcmVwcmVzZW50YXRpb24gaW4gYSBkaWZmZXJlbnQgc2V0IG9mIHVuaXRzLlxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDEsIHNlY29uZHM6IDMwIH0pLnNoaWZ0VG8oJ21pbnV0ZXMnLCAnbWlsbGlzZWNvbmRzJykudG9PYmplY3QoKSAvLz0+IHsgbWludXRlczogNjAsIG1pbGxpc2Vjb25kczogMzAwMDAgfVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHNoaWZ0VG8oLi4udW5pdHMpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAodW5pdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB1bml0cyA9IHVuaXRzLm1hcCgodSkgPT4gRHVyYXRpb24ubm9ybWFsaXplVW5pdCh1KSk7XG5cbiAgICBjb25zdCBidWlsdCA9IHt9LFxuICAgICAgYWNjdW11bGF0ZWQgPSB7fSxcbiAgICAgIHZhbHMgPSB0aGlzLnRvT2JqZWN0KCk7XG4gICAgbGV0IGxhc3RVbml0O1xuXG4gICAgZm9yIChjb25zdCBrIG9mIG9yZGVyZWRVbml0cyQxKSB7XG4gICAgICBpZiAodW5pdHMuaW5kZXhPZihrKSA+PSAwKSB7XG4gICAgICAgIGxhc3RVbml0ID0gaztcblxuICAgICAgICBsZXQgb3duID0gMDtcblxuICAgICAgICAvLyBhbnl0aGluZyB3ZSBoYXZlbid0IGJvaWxlZCBkb3duIHlldCBzaG91bGQgZ2V0IGJvaWxlZCB0byB0aGlzIHVuaXRcbiAgICAgICAgZm9yIChjb25zdCBhayBpbiBhY2N1bXVsYXRlZCkge1xuICAgICAgICAgIG93biArPSB0aGlzLm1hdHJpeFtha11ba10gKiBhY2N1bXVsYXRlZFtha107XG4gICAgICAgICAgYWNjdW11bGF0ZWRbYWtdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBsdXMgYW55dGhpbmcgdGhhdCdzIGFscmVhZHkgaW4gdGhpcyB1bml0XG4gICAgICAgIGlmIChpc051bWJlcih2YWxzW2tdKSkge1xuICAgICAgICAgIG93biArPSB2YWxzW2tdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gb25seSBrZWVwIHRoZSBpbnRlZ2VyIHBhcnQgZm9yIG5vdyBpbiB0aGUgaG9wZXMgb2YgcHV0dGluZyBhbnkgZGVjaW1hbCBwYXJ0XG4gICAgICAgIC8vIGludG8gYSBzbWFsbGVyIHVuaXQgbGF0ZXJcbiAgICAgICAgY29uc3QgaSA9IE1hdGgudHJ1bmMob3duKTtcbiAgICAgICAgYnVpbHRba10gPSBpO1xuICAgICAgICBhY2N1bXVsYXRlZFtrXSA9IChvd24gKiAxMDAwIC0gaSAqIDEwMDApIC8gMTAwMDtcblxuICAgICAgICAvLyBvdGhlcndpc2UsIGtlZXAgaXQgaW4gdGhlIHdpbmdzIHRvIGJvaWwgaXQgbGF0ZXJcbiAgICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIodmFsc1trXSkpIHtcbiAgICAgICAgYWNjdW11bGF0ZWRba10gPSB2YWxzW2tdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFueXRoaW5nIGxlZnRvdmVyIGJlY29tZXMgdGhlIGRlY2ltYWwgZm9yIHRoZSBsYXN0IHVuaXRcbiAgICAvLyBsYXN0VW5pdCBtdXN0IGJlIGRlZmluZWQgc2luY2UgdW5pdHMgaXMgbm90IGVtcHR5XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYWNjdW11bGF0ZWQpIHtcbiAgICAgIGlmIChhY2N1bXVsYXRlZFtrZXldICE9PSAwKSB7XG4gICAgICAgIGJ1aWx0W2xhc3RVbml0XSArPVxuICAgICAgICAgIGtleSA9PT0gbGFzdFVuaXQgPyBhY2N1bXVsYXRlZFtrZXldIDogYWNjdW11bGF0ZWRba2V5XSAvIHRoaXMubWF0cml4W2xhc3RVbml0XVtrZXldO1xuICAgICAgfVxuICAgIH1cblxuICAgIG5vcm1hbGl6ZVZhbHVlcyh0aGlzLm1hdHJpeCwgYnVpbHQpO1xuICAgIHJldHVybiBjbG9uZSQxKHRoaXMsIHsgdmFsdWVzOiBidWlsdCB9LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaGlmdCB0aGlzIER1cmF0aW9uIHRvIGFsbCBhdmFpbGFibGUgdW5pdHMuXG4gICAqIFNhbWUgYXMgc2hpZnRUbyhcInllYXJzXCIsIFwibW9udGhzXCIsIFwid2Vla3NcIiwgXCJkYXlzXCIsIFwiaG91cnNcIiwgXCJtaW51dGVzXCIsIFwic2Vjb25kc1wiLCBcIm1pbGxpc2Vjb25kc1wiKVxuICAgKiBAcmV0dXJuIHtEdXJhdGlvbn1cbiAgICovXG4gIHNoaWZ0VG9BbGwoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB0aGlzO1xuICAgIHJldHVybiB0aGlzLnNoaWZ0VG8oXG4gICAgICBcInllYXJzXCIsXG4gICAgICBcIm1vbnRoc1wiLFxuICAgICAgXCJ3ZWVrc1wiLFxuICAgICAgXCJkYXlzXCIsXG4gICAgICBcImhvdXJzXCIsXG4gICAgICBcIm1pbnV0ZXNcIixcbiAgICAgIFwic2Vjb25kc1wiLFxuICAgICAgXCJtaWxsaXNlY29uZHNcIlxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBuZWdhdGl2ZSBvZiB0aGlzIER1cmF0aW9uLlxuICAgKiBAZXhhbXBsZSBEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDEsIHNlY29uZHM6IDMwIH0pLm5lZ2F0ZSgpLnRvT2JqZWN0KCkgLy89PiB7IGhvdXJzOiAtMSwgc2Vjb25kczogLTMwIH1cbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBuZWdhdGUoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB0aGlzO1xuICAgIGNvbnN0IG5lZ2F0ZWQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXModGhpcy52YWx1ZXMpKSB7XG4gICAgICBuZWdhdGVkW2tdID0gdGhpcy52YWx1ZXNba10gPT09IDAgPyAwIDogLXRoaXMudmFsdWVzW2tdO1xuICAgIH1cbiAgICByZXR1cm4gY2xvbmUkMSh0aGlzLCB7IHZhbHVlczogbmVnYXRlZCB9LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHllYXJzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHllYXJzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnZhbHVlcy55ZWFycyB8fCAwIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcXVhcnRlcnMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgcXVhcnRlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMudmFsdWVzLnF1YXJ0ZXJzIHx8IDAgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtb250aHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbW9udGhzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnZhbHVlcy5tb250aHMgfHwgMCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdlZWtzXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgd2Vla3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMudmFsdWVzLndlZWtzIHx8IDAgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkYXlzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IGRheXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMudmFsdWVzLmRheXMgfHwgMCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGhvdXJzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IGhvdXJzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnZhbHVlcy5ob3VycyB8fCAwIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWludXRlcy5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBtaW51dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnZhbHVlcy5taW51dGVzIHx8IDAgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZWNvbmRzLlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgc2Vjb25kcygpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy52YWx1ZXMuc2Vjb25kcyB8fCAwIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWlsbGlzZWNvbmRzLlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbWlsbGlzZWNvbmRzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnZhbHVlcy5taWxsaXNlY29uZHMgfHwgMCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIER1cmF0aW9uIGlzIGludmFsaWQuIEludmFsaWQgZHVyYXRpb25zIGFyZSByZXR1cm5lZCBieSBkaWZmIG9wZXJhdGlvbnNcbiAgICogb24gaW52YWxpZCBEYXRlVGltZXMgb3IgSW50ZXJ2YWxzLlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52YWxpZCA9PT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGVycm9yIGNvZGUgaWYgdGhpcyBEdXJhdGlvbiBiZWNhbWUgaW52YWxpZCwgb3IgbnVsbCBpZiB0aGUgRHVyYXRpb24gaXMgdmFsaWRcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IGludmFsaWRSZWFzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52YWxpZCA/IHRoaXMuaW52YWxpZC5yZWFzb24gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gZXhwbGFuYXRpb24gb2Ygd2h5IHRoaXMgRHVyYXRpb24gYmVjYW1lIGludmFsaWQsIG9yIG51bGwgaWYgdGhlIER1cmF0aW9uIGlzIHZhbGlkXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgaW52YWxpZEV4cGxhbmF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmludmFsaWQgPyB0aGlzLmludmFsaWQuZXhwbGFuYXRpb24gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEVxdWFsaXR5IGNoZWNrXG4gICAqIFR3byBEdXJhdGlvbnMgYXJlIGVxdWFsIGlmZiB0aGV5IGhhdmUgdGhlIHNhbWUgdW5pdHMgYW5kIHRoZSBzYW1lIHZhbHVlcyBmb3IgZWFjaCB1bml0LlxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufSBvdGhlclxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgZXF1YWxzKG90aGVyKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQgfHwgIW90aGVyLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubG9jLmVxdWFscyhvdGhlci5sb2MpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXEodjEsIHYyKSB7XG4gICAgICAvLyBDb25zaWRlciAwIGFuZCB1bmRlZmluZWQgYXMgZXF1YWxcbiAgICAgIGlmICh2MSA9PT0gdW5kZWZpbmVkIHx8IHYxID09PSAwKSByZXR1cm4gdjIgPT09IHVuZGVmaW5lZCB8fCB2MiA9PT0gMDtcbiAgICAgIHJldHVybiB2MSA9PT0gdjI7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB1IG9mIG9yZGVyZWRVbml0cyQxKSB7XG4gICAgICBpZiAoIWVxKHRoaXMudmFsdWVzW3VdLCBvdGhlci52YWx1ZXNbdV0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuY29uc3QgSU5WQUxJRCQxID0gXCJJbnZhbGlkIEludGVydmFsXCI7XG5cbi8vIGNoZWNrcyBpZiB0aGUgc3RhcnQgaXMgZXF1YWwgdG8gb3IgYmVmb3JlIHRoZSBlbmRcbmZ1bmN0aW9uIHZhbGlkYXRlU3RhcnRFbmQoc3RhcnQsIGVuZCkge1xuICBpZiAoIXN0YXJ0IHx8ICFzdGFydC5pc1ZhbGlkKSB7XG4gICAgcmV0dXJuIEludGVydmFsLmludmFsaWQoXCJtaXNzaW5nIG9yIGludmFsaWQgc3RhcnRcIik7XG4gIH0gZWxzZSBpZiAoIWVuZCB8fCAhZW5kLmlzVmFsaWQpIHtcbiAgICByZXR1cm4gSW50ZXJ2YWwuaW52YWxpZChcIm1pc3Npbmcgb3IgaW52YWxpZCBlbmRcIik7XG4gIH0gZWxzZSBpZiAoZW5kIDwgc3RhcnQpIHtcbiAgICByZXR1cm4gSW50ZXJ2YWwuaW52YWxpZChcbiAgICAgIFwiZW5kIGJlZm9yZSBzdGFydFwiLFxuICAgICAgYFRoZSBlbmQgb2YgYW4gaW50ZXJ2YWwgbXVzdCBiZSBhZnRlciBpdHMgc3RhcnQsIGJ1dCB5b3UgaGFkIHN0YXJ0PSR7c3RhcnQudG9JU08oKX0gYW5kIGVuZD0ke2VuZC50b0lTTygpfWBcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQW4gSW50ZXJ2YWwgb2JqZWN0IHJlcHJlc2VudHMgYSBoYWxmLW9wZW4gaW50ZXJ2YWwgb2YgdGltZSwgd2hlcmUgZWFjaCBlbmRwb2ludCBpcyBhIHtAbGluayBEYXRlVGltZX0uIENvbmNlcHR1YWxseSwgaXQncyBhIGNvbnRhaW5lciBmb3IgdGhvc2UgdHdvIGVuZHBvaW50cywgYWNjb21wYW5pZWQgYnkgbWV0aG9kcyBmb3IgY3JlYXRpbmcsIHBhcnNpbmcsIGludGVycm9nYXRpbmcsIGNvbXBhcmluZywgdHJhbnNmb3JtaW5nLCBhbmQgZm9ybWF0dGluZyB0aGVtLlxuICpcbiAqIEhlcmUgaXMgYSBicmllZiBvdmVydmlldyBvZiB0aGUgbW9zdCBjb21tb25seSB1c2VkIG1ldGhvZHMgYW5kIGdldHRlcnMgaW4gSW50ZXJ2YWw6XG4gKlxuICogKiAqKkNyZWF0aW9uKiogVG8gY3JlYXRlIGFuIEludGVydmFsLCB1c2Uge0BsaW5rIEludGVydmFsLmZyb21EYXRlVGltZXN9LCB7QGxpbmsgSW50ZXJ2YWwuYWZ0ZXJ9LCB7QGxpbmsgSW50ZXJ2YWwuYmVmb3JlfSwgb3Ige0BsaW5rIEludGVydmFsLmZyb21JU099LlxuICogKiAqKkFjY2Vzc29ycyoqIFVzZSB7QGxpbmsgSW50ZXJ2YWwjc3RhcnR9IGFuZCB7QGxpbmsgSW50ZXJ2YWwjZW5kfSB0byBnZXQgdGhlIHN0YXJ0IGFuZCBlbmQuXG4gKiAqICoqSW50ZXJyb2dhdGlvbioqIFRvIGFuYWx5emUgdGhlIEludGVydmFsLCB1c2Uge0BsaW5rIEludGVydmFsI2NvdW50fSwge0BsaW5rIEludGVydmFsI2xlbmd0aH0sIHtAbGluayBJbnRlcnZhbCNoYXNTYW1lfSwge0BsaW5rIEludGVydmFsI2NvbnRhaW5zfSwge0BsaW5rIEludGVydmFsI2lzQWZ0ZXJ9LCBvciB7QGxpbmsgSW50ZXJ2YWwjaXNCZWZvcmV9LlxuICogKiAqKlRyYW5zZm9ybWF0aW9uKiogVG8gY3JlYXRlIG90aGVyIEludGVydmFscyBvdXQgb2YgdGhpcyBvbmUsIHVzZSB7QGxpbmsgSW50ZXJ2YWwjc2V0fSwge0BsaW5rIEludGVydmFsI3NwbGl0QXR9LCB7QGxpbmsgSW50ZXJ2YWwjc3BsaXRCeX0sIHtAbGluayBJbnRlcnZhbCNkaXZpZGVFcXVhbGx5fSwge0BsaW5rIEludGVydmFsLm1lcmdlfSwge0BsaW5rIEludGVydmFsLnhvcn0sIHtAbGluayBJbnRlcnZhbCN1bmlvbn0sIHtAbGluayBJbnRlcnZhbCNpbnRlcnNlY3Rpb259LCBvciB7QGxpbmsgSW50ZXJ2YWwjZGlmZmVyZW5jZX0uXG4gKiAqICoqQ29tcGFyaXNvbioqIFRvIGNvbXBhcmUgdGhpcyBJbnRlcnZhbCB0byBhbm90aGVyIG9uZSwgdXNlIHtAbGluayBJbnRlcnZhbCNlcXVhbHN9LCB7QGxpbmsgSW50ZXJ2YWwjb3ZlcmxhcHN9LCB7QGxpbmsgSW50ZXJ2YWwjYWJ1dHNTdGFydH0sIHtAbGluayBJbnRlcnZhbCNhYnV0c0VuZH0sIHtAbGluayBJbnRlcnZhbCNlbmd1bGZzfVxuICogKiAqKk91dHB1dCoqIFRvIGNvbnZlcnQgdGhlIEludGVydmFsIGludG8gb3RoZXIgcmVwcmVzZW50YXRpb25zLCBzZWUge0BsaW5rIEludGVydmFsI3RvU3RyaW5nfSwge0BsaW5rIEludGVydmFsI3RvTG9jYWxlU3RyaW5nfSwge0BsaW5rIEludGVydmFsI3RvSVNPfSwge0BsaW5rIEludGVydmFsI3RvSVNPRGF0ZX0sIHtAbGluayBJbnRlcnZhbCN0b0lTT1RpbWV9LCB7QGxpbmsgSW50ZXJ2YWwjdG9Gb3JtYXR9LCBhbmQge0BsaW5rIEludGVydmFsI3RvRHVyYXRpb259LlxuICovXG5jbGFzcyBJbnRlcnZhbCB7XG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5zID0gY29uZmlnLnN0YXJ0O1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuZSA9IGNvbmZpZy5lbmQ7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5pbnZhbGlkID0gY29uZmlnLmludmFsaWQgfHwgbnVsbDtcbiAgICAvKipcbiAgICAgKiBAYWNjZXNzIHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLmlzTHV4b25JbnRlcnZhbCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGludmFsaWQgSW50ZXJ2YWwuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb24gLSBzaW1wbGUgc3RyaW5nIG9mIHdoeSB0aGlzIEludGVydmFsIGlzIGludmFsaWQuIFNob3VsZCBub3QgY29udGFpbiBwYXJhbWV0ZXJzIG9yIGFueXRoaW5nIGVsc2UgZGF0YS1kZXBlbmRlbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtleHBsYW5hdGlvbj1udWxsXSAtIGxvbmdlciBleHBsYW5hdGlvbiwgbWF5IGluY2x1ZGUgcGFyYW1ldGVycyBhbmQgb3RoZXIgdXNlZnVsIGRlYnVnZ2luZyBpbmZvcm1hdGlvblxuICAgKiBAcmV0dXJuIHtJbnRlcnZhbH1cbiAgICovXG4gIHN0YXRpYyBpbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24gPSBudWxsKSB7XG4gICAgaWYgKCFyZWFzb24pIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnRFcnJvcihcIm5lZWQgdG8gc3BlY2lmeSBhIHJlYXNvbiB0aGUgSW50ZXJ2YWwgaXMgaW52YWxpZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZhbGlkID0gcmVhc29uIGluc3RhbmNlb2YgSW52YWxpZCA/IHJlYXNvbiA6IG5ldyBJbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24pO1xuXG4gICAgaWYgKFNldHRpbmdzLnRocm93T25JbnZhbGlkKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEludGVydmFsRXJyb3IoaW52YWxpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgSW50ZXJ2YWwoeyBpbnZhbGlkIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gSW50ZXJ2YWwgZnJvbSBhIHN0YXJ0IERhdGVUaW1lIGFuZCBhbiBlbmQgRGF0ZVRpbWUuIEluY2x1c2l2ZSBvZiB0aGUgc3RhcnQgYnV0IG5vdCB0aGUgZW5kLlxuICAgKiBAcGFyYW0ge0RhdGVUaW1lfERhdGV8T2JqZWN0fSBzdGFydFxuICAgKiBAcGFyYW0ge0RhdGVUaW1lfERhdGV8T2JqZWN0fSBlbmRcbiAgICogQHJldHVybiB7SW50ZXJ2YWx9XG4gICAqL1xuICBzdGF0aWMgZnJvbURhdGVUaW1lcyhzdGFydCwgZW5kKSB7XG4gICAgY29uc3QgYnVpbHRTdGFydCA9IGZyaWVuZGx5RGF0ZVRpbWUoc3RhcnQpLFxuICAgICAgYnVpbHRFbmQgPSBmcmllbmRseURhdGVUaW1lKGVuZCk7XG5cbiAgICBjb25zdCB2YWxpZGF0ZUVycm9yID0gdmFsaWRhdGVTdGFydEVuZChidWlsdFN0YXJ0LCBidWlsdEVuZCk7XG5cbiAgICBpZiAodmFsaWRhdGVFcnJvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbmV3IEludGVydmFsKHtcbiAgICAgICAgc3RhcnQ6IGJ1aWx0U3RhcnQsXG4gICAgICAgIGVuZDogYnVpbHRFbmQsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZhbGlkYXRlRXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBJbnRlcnZhbCBmcm9tIGEgc3RhcnQgRGF0ZVRpbWUgYW5kIGEgRHVyYXRpb24gdG8gZXh0ZW5kIHRvLlxuICAgKiBAcGFyYW0ge0RhdGVUaW1lfERhdGV8T2JqZWN0fSBzdGFydFxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufE9iamVjdHxudW1iZXJ9IGR1cmF0aW9uIC0gdGhlIGxlbmd0aCBvZiB0aGUgSW50ZXJ2YWwuXG4gICAqIEByZXR1cm4ge0ludGVydmFsfVxuICAgKi9cbiAgc3RhdGljIGFmdGVyKHN0YXJ0LCBkdXJhdGlvbikge1xuICAgIGNvbnN0IGR1ciA9IER1cmF0aW9uLmZyb21EdXJhdGlvbkxpa2UoZHVyYXRpb24pLFxuICAgICAgZHQgPSBmcmllbmRseURhdGVUaW1lKHN0YXJ0KTtcbiAgICByZXR1cm4gSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhkdCwgZHQucGx1cyhkdXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gSW50ZXJ2YWwgZnJvbSBhbiBlbmQgRGF0ZVRpbWUgYW5kIGEgRHVyYXRpb24gdG8gZXh0ZW5kIGJhY2t3YXJkcyB0by5cbiAgICogQHBhcmFtIHtEYXRlVGltZXxEYXRlfE9iamVjdH0gZW5kXG4gICAqIEBwYXJhbSB7RHVyYXRpb258T2JqZWN0fG51bWJlcn0gZHVyYXRpb24gLSB0aGUgbGVuZ3RoIG9mIHRoZSBJbnRlcnZhbC5cbiAgICogQHJldHVybiB7SW50ZXJ2YWx9XG4gICAqL1xuICBzdGF0aWMgYmVmb3JlKGVuZCwgZHVyYXRpb24pIHtcbiAgICBjb25zdCBkdXIgPSBEdXJhdGlvbi5mcm9tRHVyYXRpb25MaWtlKGR1cmF0aW9uKSxcbiAgICAgIGR0ID0gZnJpZW5kbHlEYXRlVGltZShlbmQpO1xuICAgIHJldHVybiBJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKGR0Lm1pbnVzKGR1ciksIGR0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gSW50ZXJ2YWwgZnJvbSBhbiBJU08gODYwMSBzdHJpbmcuXG4gICAqIEFjY2VwdHMgYDxzdGFydD4vPGVuZD5gLCBgPHN0YXJ0Pi88ZHVyYXRpb24+YCwgYW5kIGA8ZHVyYXRpb24+LzxlbmQ+YCBmb3JtYXRzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIHRoZSBJU08gc3RyaW5nIHRvIHBhcnNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0c10gLSBvcHRpb25zIHRvIHBhc3Mge0BsaW5rIERhdGVUaW1lI2Zyb21JU099IGFuZCBvcHRpb25hbGx5IHtAbGluayBEdXJhdGlvbiNmcm9tSVNPfVxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT184NjAxI1RpbWVfaW50ZXJ2YWxzXG4gICAqIEByZXR1cm4ge0ludGVydmFsfVxuICAgKi9cbiAgc3RhdGljIGZyb21JU08odGV4dCwgb3B0cykge1xuICAgIGNvbnN0IFtzLCBlXSA9ICh0ZXh0IHx8IFwiXCIpLnNwbGl0KFwiL1wiLCAyKTtcbiAgICBpZiAocyAmJiBlKSB7XG4gICAgICBsZXQgc3RhcnQsIHN0YXJ0SXNWYWxpZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHN0YXJ0ID0gRGF0ZVRpbWUuZnJvbUlTTyhzLCBvcHRzKTtcbiAgICAgICAgc3RhcnRJc1ZhbGlkID0gc3RhcnQuaXNWYWxpZDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc3RhcnRJc1ZhbGlkID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGxldCBlbmQsIGVuZElzVmFsaWQ7XG4gICAgICB0cnkge1xuICAgICAgICBlbmQgPSBEYXRlVGltZS5mcm9tSVNPKGUsIG9wdHMpO1xuICAgICAgICBlbmRJc1ZhbGlkID0gZW5kLmlzVmFsaWQ7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVuZElzVmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXJ0SXNWYWxpZCAmJiBlbmRJc1ZhbGlkKSB7XG4gICAgICAgIHJldHVybiBJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKHN0YXJ0LCBlbmQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RhcnRJc1ZhbGlkKSB7XG4gICAgICAgIGNvbnN0IGR1ciA9IER1cmF0aW9uLmZyb21JU08oZSwgb3B0cyk7XG4gICAgICAgIGlmIChkdXIuaXNWYWxpZCkge1xuICAgICAgICAgIHJldHVybiBJbnRlcnZhbC5hZnRlcihzdGFydCwgZHVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbmRJc1ZhbGlkKSB7XG4gICAgICAgIGNvbnN0IGR1ciA9IER1cmF0aW9uLmZyb21JU08ocywgb3B0cyk7XG4gICAgICAgIGlmIChkdXIuaXNWYWxpZCkge1xuICAgICAgICAgIHJldHVybiBJbnRlcnZhbC5iZWZvcmUoZW5kLCBkdXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBJbnRlcnZhbC5pbnZhbGlkKFwidW5wYXJzYWJsZVwiLCBgdGhlIGlucHV0IFwiJHt0ZXh0fVwiIGNhbid0IGJlIHBhcnNlZCBhcyBJU08gODYwMWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIG9iamVjdCBpcyBhbiBJbnRlcnZhbC4gV29ya3MgYWNyb3NzIGNvbnRleHQgYm91bmRhcmllc1xuICAgKiBAcGFyYW0ge29iamVjdH0gb1xuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgc3RhdGljIGlzSW50ZXJ2YWwobykge1xuICAgIHJldHVybiAobyAmJiBvLmlzTHV4b25JbnRlcnZhbCkgfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RhcnQgb2YgdGhlIEludGVydmFsXG4gICAqIEB0eXBlIHtEYXRlVGltZX1cbiAgICovXG4gIGdldCBzdGFydCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy5zIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlbmQgb2YgdGhlIEludGVydmFsXG4gICAqIEB0eXBlIHtEYXRlVGltZX1cbiAgICovXG4gIGdldCBlbmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuZSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBlbmQgaXMgYXQgbGVhc3QgaXRzIHN0YXJ0LCBtZWFuaW5nIHRoYXQgdGhlIEludGVydmFsIGlzbid0ICdiYWNrd2FyZHMnLlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiB0aGlzLmludmFsaWRSZWFzb24gPT09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBlcnJvciBjb2RlIGlmIHRoaXMgSW50ZXJ2YWwgaXMgaW52YWxpZCwgb3IgbnVsbCBpZiB0aGUgSW50ZXJ2YWwgaXMgdmFsaWRcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBpbnZhbGlkUmVhc29uKCkge1xuICAgIHJldHVybiB0aGlzLmludmFsaWQgPyB0aGlzLmludmFsaWQucmVhc29uIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGV4cGxhbmF0aW9uIG9mIHdoeSB0aGlzIEludGVydmFsIGJlY2FtZSBpbnZhbGlkLCBvciBudWxsIGlmIHRoZSBJbnRlcnZhbCBpcyB2YWxpZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IGludmFsaWRFeHBsYW5hdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZhbGlkID8gdGhpcy5pbnZhbGlkLmV4cGxhbmF0aW9uIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIEludGVydmFsIGluIHRoZSBzcGVjaWZpZWQgdW5pdC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuaXQgLSB0aGUgdW5pdCAoc3VjaCBhcyAnaG91cnMnIG9yICdkYXlzJykgdG8gcmV0dXJuIHRoZSBsZW5ndGggaW4uXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIGxlbmd0aCh1bml0ID0gXCJtaWxsaXNlY29uZHNcIikge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnRvRHVyYXRpb24oLi4uW3VuaXRdKS5nZXQodW5pdCkgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY291bnQgb2YgbWludXRlcywgaG91cnMsIGRheXMsIG1vbnRocywgb3IgeWVhcnMgaW5jbHVkZWQgaW4gdGhlIEludGVydmFsLCBldmVuIGluIHBhcnQuXG4gICAqIFVubGlrZSB7QGxpbmsgSW50ZXJ2YWwjbGVuZ3RofSB0aGlzIGNvdW50cyBzZWN0aW9ucyBvZiB0aGUgY2FsZW5kYXIsIG5vdCBwZXJpb2RzIG9mIHRpbWUsIGUuZy4gc3BlY2lmeWluZyAnZGF5J1xuICAgKiBhc2tzICd3aGF0IGRhdGVzIGFyZSBpbmNsdWRlZCBpbiB0aGlzIGludGVydmFsPycsIG5vdCAnaG93IG1hbnkgZGF5cyBsb25nIGlzIHRoaXMgaW50ZXJ2YWw/J1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VuaXQ9J21pbGxpc2Vjb25kcyddIC0gdGhlIHVuaXQgb2YgdGltZSB0byBjb3VudC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMudXNlTG9jYWxlV2Vla3M9ZmFsc2VdIC0gSWYgdHJ1ZSwgdXNlIHdlZWtzIGJhc2VkIG9uIHRoZSBsb2NhbGUsIGkuZS4gdXNlIHRoZSBsb2NhbGUtZGVwZW5kZW50IHN0YXJ0IG9mIHRoZSB3ZWVrOyB0aGlzIG9wZXJhdGlvbiB3aWxsIGFsd2F5cyB1c2UgdGhlIGxvY2FsZSBvZiB0aGUgc3RhcnQgRGF0ZVRpbWVcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgY291bnQodW5pdCA9IFwibWlsbGlzZWNvbmRzXCIsIG9wdHMpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIE5hTjtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnQuc3RhcnRPZih1bml0LCBvcHRzKTtcbiAgICBsZXQgZW5kO1xuICAgIGlmIChvcHRzPy51c2VMb2NhbGVXZWVrcykge1xuICAgICAgZW5kID0gdGhpcy5lbmQucmVjb25maWd1cmUoeyBsb2NhbGU6IHN0YXJ0LmxvY2FsZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW5kID0gdGhpcy5lbmQ7XG4gICAgfVxuICAgIGVuZCA9IGVuZC5zdGFydE9mKHVuaXQsIG9wdHMpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKGVuZC5kaWZmKHN0YXJ0LCB1bml0KS5nZXQodW5pdCkpICsgKGVuZC52YWx1ZU9mKCkgIT09IHRoaXMuZW5kLnZhbHVlT2YoKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBzdGFydCBhbmQgZW5kIGFyZSBib3RoIGluIHRoZSBzYW1lIHVuaXQgb2YgdGltZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIHRoZSB1bml0IG9mIHRpbWUgdG8gY2hlY2sgc2FtZW5lc3Mgb25cbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGhhc1NhbWUodW5pdCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLmlzRW1wdHkoKSB8fCB0aGlzLmUubWludXMoMSkuaGFzU2FtZSh0aGlzLnMsIHVuaXQpIDogZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBJbnRlcnZhbCBoYXMgdGhlIHNhbWUgc3RhcnQgYW5kIGVuZCBEYXRlVGltZXMuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0VtcHR5KCkge1xuICAgIHJldHVybiB0aGlzLnMudmFsdWVPZigpID09PSB0aGlzLmUudmFsdWVPZigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBzdGFydCBpcyBhZnRlciB0aGUgc3BlY2lmaWVkIERhdGVUaW1lLlxuICAgKiBAcGFyYW0ge0RhdGVUaW1lfSBkYXRlVGltZVxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgaXNBZnRlcihkYXRlVGltZSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMucyA+IGRhdGVUaW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBlbmQgaXMgYmVmb3JlIHRoZSBzcGVjaWZpZWQgRGF0ZVRpbWUuXG4gICAqIEBwYXJhbSB7RGF0ZVRpbWV9IGRhdGVUaW1lXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBpc0JlZm9yZShkYXRlVGltZSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMuZSA8PSBkYXRlVGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIEludGVydmFsIGNvbnRhaW5zIHRoZSBzcGVjaWZpZWQgRGF0ZVRpbWUuXG4gICAqIEBwYXJhbSB7RGF0ZVRpbWV9IGRhdGVUaW1lXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBjb250YWlucyhkYXRlVGltZSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMucyA8PSBkYXRlVGltZSAmJiB0aGlzLmUgPiBkYXRlVGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcIlNldHNcIiB0aGUgc3RhcnQgYW5kL29yIGVuZCBkYXRlcy4gUmV0dXJucyBhIG5ld2x5LWNvbnN0cnVjdGVkIEludGVydmFsLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIC0gdGhlIHZhbHVlcyB0byBzZXRcbiAgICogQHBhcmFtIHtEYXRlVGltZX0gdmFsdWVzLnN0YXJ0IC0gdGhlIHN0YXJ0aW5nIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7RGF0ZVRpbWV9IHZhbHVlcy5lbmQgLSB0aGUgZW5kaW5nIERhdGVUaW1lXG4gICAqIEByZXR1cm4ge0ludGVydmFsfVxuICAgKi9cbiAgc2V0KHsgc3RhcnQsIGVuZCB9ID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG4gICAgcmV0dXJuIEludGVydmFsLmZyb21EYXRlVGltZXMoc3RhcnQgfHwgdGhpcy5zLCBlbmQgfHwgdGhpcy5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTcGxpdCB0aGlzIEludGVydmFsIGF0IGVhY2ggb2YgdGhlIHNwZWNpZmllZCBEYXRlVGltZXNcbiAgICogQHBhcmFtIHsuLi5EYXRlVGltZX0gZGF0ZVRpbWVzIC0gdGhlIHVuaXQgb2YgdGltZSB0byBjb3VudC5cbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzcGxpdEF0KC4uLmRhdGVUaW1lcykge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gW107XG4gICAgY29uc3Qgc29ydGVkID0gZGF0ZVRpbWVzXG4gICAgICAgIC5tYXAoZnJpZW5kbHlEYXRlVGltZSlcbiAgICAgICAgLmZpbHRlcigoZCkgPT4gdGhpcy5jb250YWlucyhkKSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEudG9NaWxsaXMoKSAtIGIudG9NaWxsaXMoKSksXG4gICAgICByZXN1bHRzID0gW107XG4gICAgbGV0IHsgcyB9ID0gdGhpcyxcbiAgICAgIGkgPSAwO1xuXG4gICAgd2hpbGUgKHMgPCB0aGlzLmUpIHtcbiAgICAgIGNvbnN0IGFkZGVkID0gc29ydGVkW2ldIHx8IHRoaXMuZSxcbiAgICAgICAgbmV4dCA9ICthZGRlZCA+ICt0aGlzLmUgPyB0aGlzLmUgOiBhZGRlZDtcbiAgICAgIHJlc3VsdHMucHVzaChJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKHMsIG5leHQpKTtcbiAgICAgIHMgPSBuZXh0O1xuICAgICAgaSArPSAxO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNwbGl0IHRoaXMgSW50ZXJ2YWwgaW50byBzbWFsbGVyIEludGVydmFscywgZWFjaCBvZiB0aGUgc3BlY2lmaWVkIGxlbmd0aC5cbiAgICogTGVmdCBvdmVyIHRpbWUgaXMgZ3JvdXBlZCBpbnRvIGEgc21hbGxlciBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufE9iamVjdHxudW1iZXJ9IGR1cmF0aW9uIC0gVGhlIGxlbmd0aCBvZiBlYWNoIHJlc3VsdGluZyBpbnRlcnZhbC5cbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzcGxpdEJ5KGR1cmF0aW9uKSB7XG4gICAgY29uc3QgZHVyID0gRHVyYXRpb24uZnJvbUR1cmF0aW9uTGlrZShkdXJhdGlvbik7XG5cbiAgICBpZiAoIXRoaXMuaXNWYWxpZCB8fCAhZHVyLmlzVmFsaWQgfHwgZHVyLmFzKFwibWlsbGlzZWNvbmRzXCIpID09PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgbGV0IHsgcyB9ID0gdGhpcyxcbiAgICAgIGlkeCA9IDEsXG4gICAgICBuZXh0O1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIHdoaWxlIChzIDwgdGhpcy5lKSB7XG4gICAgICBjb25zdCBhZGRlZCA9IHRoaXMuc3RhcnQucGx1cyhkdXIubWFwVW5pdHMoKHgpID0+IHggKiBpZHgpKTtcbiAgICAgIG5leHQgPSArYWRkZWQgPiArdGhpcy5lID8gdGhpcy5lIDogYWRkZWQ7XG4gICAgICByZXN1bHRzLnB1c2goSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhzLCBuZXh0KSk7XG4gICAgICBzID0gbmV4dDtcbiAgICAgIGlkeCArPSAxO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNwbGl0IHRoaXMgSW50ZXJ2YWwgaW50byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBzbWFsbGVyIGludGVydmFscy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IG51bWJlck9mUGFydHMgLSBUaGUgbnVtYmVyIG9mIEludGVydmFscyB0byBkaXZpZGUgdGhlIEludGVydmFsIGludG8uXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgZGl2aWRlRXF1YWxseShudW1iZXJPZlBhcnRzKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gdGhpcy5zcGxpdEJ5KHRoaXMubGVuZ3RoKCkgLyBudW1iZXJPZlBhcnRzKS5zbGljZSgwLCBudW1iZXJPZlBhcnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIEludGVydmFsIG92ZXJsYXBzIHdpdGggdGhlIHNwZWNpZmllZCBJbnRlcnZhbFxuICAgKiBAcGFyYW0ge0ludGVydmFsfSBvdGhlclxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgb3ZlcmxhcHMob3RoZXIpIHtcbiAgICByZXR1cm4gdGhpcy5lID4gb3RoZXIucyAmJiB0aGlzLnMgPCBvdGhlci5lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBlbmQgaXMgYWRqYWNlbnQgdG8gdGhlIHNwZWNpZmllZCBJbnRlcnZhbCdzIHN0YXJ0LlxuICAgKiBAcGFyYW0ge0ludGVydmFsfSBvdGhlclxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgYWJ1dHNTdGFydChvdGhlcikge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuICt0aGlzLmUgPT09ICtvdGhlci5zO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoaXMgSW50ZXJ2YWwncyBzdGFydCBpcyBhZGphY2VudCB0byB0aGUgc3BlY2lmaWVkIEludGVydmFsJ3MgZW5kLlxuICAgKiBAcGFyYW0ge0ludGVydmFsfSBvdGhlclxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgYWJ1dHNFbmQob3RoZXIpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiArb3RoZXIuZSA9PT0gK3RoaXMucztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIEludGVydmFsIGVuZ3VsZnMgdGhlIHN0YXJ0IGFuZCBlbmQgb2YgdGhlIHNwZWNpZmllZCBJbnRlcnZhbC5cbiAgICogQHBhcmFtIHtJbnRlcnZhbH0gb3RoZXJcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGVuZ3VsZnMob3RoZXIpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0aGlzLnMgPD0gb3RoZXIucyAmJiB0aGlzLmUgPj0gb3RoZXIuZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGlzIEludGVydmFsIGhhcyB0aGUgc2FtZSBzdGFydCBhbmQgZW5kIGFzIHRoZSBzcGVjaWZpZWQgSW50ZXJ2YWwuXG4gICAqIEBwYXJhbSB7SW50ZXJ2YWx9IG90aGVyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBlcXVhbHMob3RoZXIpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCB8fCAhb3RoZXIuaXNWYWxpZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnMuZXF1YWxzKG90aGVyLnMpICYmIHRoaXMuZS5lcXVhbHMob3RoZXIuZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFuIEludGVydmFsIHJlcHJlc2VudGluZyB0aGUgaW50ZXJzZWN0aW9uIG9mIHRoaXMgSW50ZXJ2YWwgYW5kIHRoZSBzcGVjaWZpZWQgSW50ZXJ2YWwuXG4gICAqIFNwZWNpZmljYWxseSwgdGhlIHJlc3VsdGluZyBJbnRlcnZhbCBoYXMgdGhlIG1heGltdW0gc3RhcnQgdGltZSBhbmQgdGhlIG1pbmltdW0gZW5kIHRpbWUgb2YgdGhlIHR3byBJbnRlcnZhbHMuXG4gICAqIFJldHVybnMgbnVsbCBpZiB0aGUgaW50ZXJzZWN0aW9uIGlzIGVtcHR5LCBtZWFuaW5nLCB0aGUgaW50ZXJ2YWxzIGRvbid0IGludGVyc2VjdC5cbiAgICogQHBhcmFtIHtJbnRlcnZhbH0gb3RoZXJcbiAgICogQHJldHVybiB7SW50ZXJ2YWx9XG4gICAqL1xuICBpbnRlcnNlY3Rpb24ob3RoZXIpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG4gICAgY29uc3QgcyA9IHRoaXMucyA+IG90aGVyLnMgPyB0aGlzLnMgOiBvdGhlci5zLFxuICAgICAgZSA9IHRoaXMuZSA8IG90aGVyLmUgPyB0aGlzLmUgOiBvdGhlci5lO1xuXG4gICAgaWYgKHMgPj0gZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKHMsIGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gSW50ZXJ2YWwgcmVwcmVzZW50aW5nIHRoZSB1bmlvbiBvZiB0aGlzIEludGVydmFsIGFuZCB0aGUgc3BlY2lmaWVkIEludGVydmFsLlxuICAgKiBTcGVjaWZpY2FsbHksIHRoZSByZXN1bHRpbmcgSW50ZXJ2YWwgaGFzIHRoZSBtaW5pbXVtIHN0YXJ0IHRpbWUgYW5kIHRoZSBtYXhpbXVtIGVuZCB0aW1lIG9mIHRoZSB0d28gSW50ZXJ2YWxzLlxuICAgKiBAcGFyYW0ge0ludGVydmFsfSBvdGhlclxuICAgKiBAcmV0dXJuIHtJbnRlcnZhbH1cbiAgICovXG4gIHVuaW9uKG90aGVyKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiB0aGlzO1xuICAgIGNvbnN0IHMgPSB0aGlzLnMgPCBvdGhlci5zID8gdGhpcy5zIDogb3RoZXIucyxcbiAgICAgIGUgPSB0aGlzLmUgPiBvdGhlci5lID8gdGhpcy5lIDogb3RoZXIuZTtcbiAgICByZXR1cm4gSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhzLCBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXJnZSBhbiBhcnJheSBvZiBJbnRlcnZhbHMgaW50byBhIGVxdWl2YWxlbnQgbWluaW1hbCBzZXQgb2YgSW50ZXJ2YWxzLlxuICAgKiBDb21iaW5lcyBvdmVybGFwcGluZyBhbmQgYWRqYWNlbnQgSW50ZXJ2YWxzLlxuICAgKiBAcGFyYW0ge0FycmF5fSBpbnRlcnZhbHNcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzdGF0aWMgbWVyZ2UoaW50ZXJ2YWxzKSB7XG4gICAgY29uc3QgW2ZvdW5kLCBmaW5hbF0gPSBpbnRlcnZhbHNcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnMgLSBiLnMpXG4gICAgICAucmVkdWNlKFxuICAgICAgICAoW3NvZmFyLCBjdXJyZW50XSwgaXRlbSkgPT4ge1xuICAgICAgICAgIGlmICghY3VycmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIFtzb2ZhciwgaXRlbV07XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Lm92ZXJsYXBzKGl0ZW0pIHx8IGN1cnJlbnQuYWJ1dHNTdGFydChpdGVtKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtzb2ZhciwgY3VycmVudC51bmlvbihpdGVtKV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbc29mYXIuY29uY2F0KFtjdXJyZW50XSksIGl0ZW1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgW1tdLCBudWxsXVxuICAgICAgKTtcbiAgICBpZiAoZmluYWwpIHtcbiAgICAgIGZvdW5kLnB1c2goZmluYWwpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIEludGVydmFscyByZXByZXNlbnRpbmcgdGhlIHNwYW5zIG9mIHRpbWUgdGhhdCBvbmx5IGFwcGVhciBpbiBvbmUgb2YgdGhlIHNwZWNpZmllZCBJbnRlcnZhbHMuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGludGVydmFsc1xuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyB4b3IoaW50ZXJ2YWxzKSB7XG4gICAgbGV0IHN0YXJ0ID0gbnVsbCxcbiAgICAgIGN1cnJlbnRDb3VudCA9IDA7XG4gICAgY29uc3QgcmVzdWx0cyA9IFtdLFxuICAgICAgZW5kcyA9IGludGVydmFscy5tYXAoKGkpID0+IFtcbiAgICAgICAgeyB0aW1lOiBpLnMsIHR5cGU6IFwic1wiIH0sXG4gICAgICAgIHsgdGltZTogaS5lLCB0eXBlOiBcImVcIiB9LFxuICAgICAgXSksXG4gICAgICBmbGF0dGVuZWQgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0KC4uLmVuZHMpLFxuICAgICAgYXJyID0gZmxhdHRlbmVkLnNvcnQoKGEsIGIpID0+IGEudGltZSAtIGIudGltZSk7XG5cbiAgICBmb3IgKGNvbnN0IGkgb2YgYXJyKSB7XG4gICAgICBjdXJyZW50Q291bnQgKz0gaS50eXBlID09PSBcInNcIiA/IDEgOiAtMTtcblxuICAgICAgaWYgKGN1cnJlbnRDb3VudCA9PT0gMSkge1xuICAgICAgICBzdGFydCA9IGkudGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzdGFydCAmJiArc3RhcnQgIT09ICtpLnRpbWUpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhzdGFydCwgaS50aW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGFydCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEludGVydmFsLm1lcmdlKHJlc3VsdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhbiBJbnRlcnZhbCByZXByZXNlbnRpbmcgdGhlIHNwYW4gb2YgdGltZSBpbiB0aGlzIEludGVydmFsIHRoYXQgZG9lc24ndCBvdmVybGFwIHdpdGggYW55IG9mIHRoZSBzcGVjaWZpZWQgSW50ZXJ2YWxzLlxuICAgKiBAcGFyYW0gey4uLkludGVydmFsfSBpbnRlcnZhbHNcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBkaWZmZXJlbmNlKC4uLmludGVydmFscykge1xuICAgIHJldHVybiBJbnRlcnZhbC54b3IoW3RoaXNdLmNvbmNhdChpbnRlcnZhbHMpKVxuICAgICAgLm1hcCgoaSkgPT4gdGhpcy5pbnRlcnNlY3Rpb24oaSkpXG4gICAgICAuZmlsdGVyKChpKSA9PiBpICYmICFpLmlzRW1wdHkoKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIEludGVydmFsIGFwcHJvcHJpYXRlIGZvciBkZWJ1Z2dpbmcuXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gSU5WQUxJRCQxO1xuICAgIHJldHVybiBgWyR7dGhpcy5zLnRvSVNPKCl9IOKAkyAke3RoaXMuZS50b0lTTygpfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBJbnRlcnZhbCBhcHByb3ByaWF0ZSBmb3IgdGhlIFJFUEwuXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKCkge1xuICAgIGlmICh0aGlzLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBgSW50ZXJ2YWwgeyBzdGFydDogJHt0aGlzLnMudG9JU08oKX0sIGVuZDogJHt0aGlzLmUudG9JU08oKX0gfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBgSW50ZXJ2YWwgeyBJbnZhbGlkLCByZWFzb246ICR7dGhpcy5pbnZhbGlkUmVhc29ufSB9YDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGxvY2FsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoaXMgSW50ZXJ2YWwuIEFjY2VwdHMgdGhlIHNhbWUgb3B0aW9ucyBhcyB0aGVcbiAgICogSW50bC5EYXRlVGltZUZvcm1hdCBjb25zdHJ1Y3RvciBhbmQgYW55IHByZXNldHMgZGVmaW5lZCBieSBMdXhvbiwgc3VjaCBhc1xuICAgKiB7QGxpbmsgRGF0ZVRpbWUuREFURV9GVUxMfSBvciB7QGxpbmsgRGF0ZVRpbWUuVElNRV9TSU1QTEV9LiBUaGUgZXhhY3QgYmVoYXZpb3Igb2YgdGhpcyBtZXRob2RcbiAgICogaXMgYnJvd3Nlci1zcGVjaWZpYywgYnV0IGluIGdlbmVyYWwgaXQgd2lsbCByZXR1cm4gYW4gYXBwcm9wcmlhdGUgcmVwcmVzZW50YXRpb24gb2YgdGhlXG4gICAqIEludGVydmFsIGluIHRoZSBhc3NpZ25lZCBsb2NhbGUuIERlZmF1bHRzIHRvIHRoZSBzeXN0ZW0ncyBsb2NhbGUgaWYgbm8gbG9jYWxlIGhhcyBiZWVuXG4gICAqIHNwZWNpZmllZC5cbiAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9EYXRlVGltZUZvcm1hdFxuICAgKiBAcGFyYW0ge09iamVjdH0gW2Zvcm1hdE9wdHM9RGF0ZVRpbWUuREFURV9TSE9SVF0gLSBFaXRoZXIgYSBEYXRlVGltZSBwcmVzZXQgb3JcbiAgICogSW50bC5EYXRlVGltZUZvcm1hdCBjb25zdHJ1Y3RvciBvcHRpb25zLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIE9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHN0YXJ0IERhdGVUaW1lLlxuICAgKiBAZXhhbXBsZSBJbnRlcnZhbC5mcm9tSVNPKCcyMDIyLTExLTA3VDA5OjAwWi8yMDIyLTExLTA4VDA5OjAwWicpLnRvTG9jYWxlU3RyaW5nKCk7IC8vPT4gMTEvNy8yMDIyIOKAkyAxMS84LzIwMjJcbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbUlTTygnMjAyMi0xMS0wN1QwOTowMFovMjAyMi0xMS0wOFQwOTowMFonKS50b0xvY2FsZVN0cmluZyhEYXRlVGltZS5EQVRFX0ZVTEwpOyAvLz0+IE5vdmVtYmVyIDcg4oCTIDgsIDIwMjJcbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbUlTTygnMjAyMi0xMS0wN1QwOTowMFovMjAyMi0xMS0wOFQwOTowMFonKS50b0xvY2FsZVN0cmluZyhEYXRlVGltZS5EQVRFX0ZVTEwsIHsgbG9jYWxlOiAnZnItRlInIH0pOyAvLz0+IDfigJM4IG5vdmVtYnJlIDIwMjJcbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbUlTTygnMjAyMi0xMS0wN1QxNzowMFovMjAyMi0xMS0wN1QxOTowMFonKS50b0xvY2FsZVN0cmluZyhEYXRlVGltZS5USU1FX1NJTVBMRSk7IC8vPT4gNjowMCDigJMgODowMCBQTVxuICAgKiBAZXhhbXBsZSBJbnRlcnZhbC5mcm9tSVNPKCcyMDIyLTExLTA3VDE3OjAwWi8yMDIyLTExLTA3VDE5OjAwWicpLnRvTG9jYWxlU3RyaW5nKHsgd2Vla2RheTogJ3Nob3J0JywgbW9udGg6ICdzaG9ydCcsIGRheTogJzItZGlnaXQnLCBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pOyAvLz0+IE1vbiwgTm92IDA3LCA2OjAwIOKAkyA4OjAwIHBcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9Mb2NhbGVTdHJpbmcoZm9ybWF0T3B0cyA9IERBVEVfU0hPUlQsIG9wdHMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWRcbiAgICAgID8gRm9ybWF0dGVyLmNyZWF0ZSh0aGlzLnMubG9jLmNsb25lKG9wdHMpLCBmb3JtYXRPcHRzKS5mb3JtYXRJbnRlcnZhbCh0aGlzKVxuICAgICAgOiBJTlZBTElEJDE7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBJU08gODYwMS1jb21wbGlhbnQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgSW50ZXJ2YWwuXG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPXzg2MDEjVGltZV9pbnRlcnZhbHNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBUaGUgc2FtZSBvcHRpb25zIGFzIHtAbGluayBEYXRlVGltZSN0b0lTT31cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9JU08ob3B0cykge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gSU5WQUxJRCQxO1xuICAgIHJldHVybiBgJHt0aGlzLnMudG9JU08ob3B0cyl9LyR7dGhpcy5lLnRvSVNPKG9wdHMpfWA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBJU08gODYwMS1jb21wbGlhbnQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGRhdGUgb2YgdGhpcyBJbnRlcnZhbC5cbiAgICogVGhlIHRpbWUgY29tcG9uZW50cyBhcmUgaWdub3JlZC5cbiAgICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fODYwMSNUaW1lX2ludGVydmFsc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0lTT0RhdGUoKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiBJTlZBTElEJDE7XG4gICAgcmV0dXJuIGAke3RoaXMucy50b0lTT0RhdGUoKX0vJHt0aGlzLmUudG9JU09EYXRlKCl9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIElTTyA4NjAxLWNvbXBsaWFudCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGltZSBvZiB0aGlzIEludGVydmFsLlxuICAgKiBUaGUgZGF0ZSBjb21wb25lbnRzIGFyZSBpZ25vcmVkLlxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT184NjAxI1RpbWVfaW50ZXJ2YWxzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gVGhlIHNhbWUgb3B0aW9ucyBhcyB7QGxpbmsgRGF0ZVRpbWUjdG9JU099XG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSVNPVGltZShvcHRzKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHJldHVybiBJTlZBTElEJDE7XG4gICAgcmV0dXJuIGAke3RoaXMucy50b0lTT1RpbWUob3B0cyl9LyR7dGhpcy5lLnRvSVNPVGltZShvcHRzKX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBJbnRlcnZhbCBmb3JtYXR0ZWQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgZm9ybWF0XG4gICAqIHN0cmluZy4gKipZb3UgbWF5IG5vdCB3YW50IHRoaXMuKiogU2VlIHtAbGluayBJbnRlcnZhbCN0b0xvY2FsZVN0cmluZ30gZm9yIGEgbW9yZSBmbGV4aWJsZVxuICAgKiBmb3JtYXR0aW5nIHRvb2wuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlRm9ybWF0IC0gVGhlIGZvcm1hdCBzdHJpbmcuIFRoaXMgc3RyaW5nIGZvcm1hdHMgdGhlIHN0YXJ0IGFuZCBlbmQgdGltZS5cbiAgICogU2VlIHtAbGluayBEYXRlVGltZSN0b0Zvcm1hdH0gZm9yIGRldGFpbHMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gT3B0aW9ucy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLnNlcGFyYXRvciA9ICAnIOKAkyAnXSAtIEEgc2VwYXJhdG9yIHRvIHBsYWNlIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmRcbiAgICogcmVwcmVzZW50YXRpb25zLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0Zvcm1hdChkYXRlRm9ybWF0LCB7IHNlcGFyYXRvciA9IFwiIOKAkyBcIiB9ID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIElOVkFMSUQkMTtcbiAgICByZXR1cm4gYCR7dGhpcy5zLnRvRm9ybWF0KGRhdGVGb3JtYXQpfSR7c2VwYXJhdG9yfSR7dGhpcy5lLnRvRm9ybWF0KGRhdGVGb3JtYXQpfWA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgRHVyYXRpb24gcmVwcmVzZW50aW5nIHRoZSB0aW1lIHNwYW5uZWQgYnkgdGhpcyBpbnRlcnZhbC5cbiAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IFt1bml0PVsnbWlsbGlzZWNvbmRzJ11dIC0gdGhlIHVuaXQgb3IgdW5pdHMgKHN1Y2ggYXMgJ2hvdXJzJyBvciAnZGF5cycpIHRvIGluY2x1ZGUgaW4gdGhlIGR1cmF0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgdGhhdCBhZmZlY3QgdGhlIGNyZWF0aW9uIG9mIHRoZSBEdXJhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuY29udmVyc2lvbkFjY3VyYWN5PSdjYXN1YWwnXSAtIHRoZSBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhkdDEsIGR0MikudG9EdXJhdGlvbigpLnRvT2JqZWN0KCkgLy89PiB7IG1pbGxpc2Vjb25kczogODg0ODkyNTcgfVxuICAgKiBAZXhhbXBsZSBJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKGR0MSwgZHQyKS50b0R1cmF0aW9uKCdkYXlzJykudG9PYmplY3QoKSAvLz0+IHsgZGF5czogMS4wMjQxODEyMTUyNzc3Nzc4IH1cbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhkdDEsIGR0MikudG9EdXJhdGlvbihbJ2hvdXJzJywgJ21pbnV0ZXMnXSkudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDI0LCBtaW51dGVzOiAzNC44MjA5NSB9XG4gICAqIEBleGFtcGxlIEludGVydmFsLmZyb21EYXRlVGltZXMoZHQxLCBkdDIpLnRvRHVyYXRpb24oWydob3VycycsICdtaW51dGVzJywgJ3NlY29uZHMnXSkudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDI0LCBtaW51dGVzOiAzNCwgc2Vjb25kczogNDkuMjU3IH1cbiAgICogQGV4YW1wbGUgSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyhkdDEsIGR0MikudG9EdXJhdGlvbignc2Vjb25kcycpLnRvT2JqZWN0KCkgLy89PiB7IHNlY29uZHM6IDg4NDg5LjI1NyB9XG4gICAqIEByZXR1cm4ge0R1cmF0aW9ufVxuICAgKi9cbiAgdG9EdXJhdGlvbih1bml0LCBvcHRzKSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBEdXJhdGlvbi5pbnZhbGlkKHRoaXMuaW52YWxpZFJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmUuZGlmZih0aGlzLnMsIHVuaXQsIG9wdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBtYXBGbiBvbiB0aGUgaW50ZXJ2YWwgc3RhcnQgYW5kIGVuZCwgcmV0dXJuaW5nIGEgbmV3IEludGVydmFsIGZyb20gdGhlIHJlc3VsdGluZyBEYXRlVGltZXNcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwRm5cbiAgICogQHJldHVybiB7SW50ZXJ2YWx9XG4gICAqIEBleGFtcGxlIEludGVydmFsLmZyb21EYXRlVGltZXMoZHQxLCBkdDIpLm1hcEVuZHBvaW50cyhlbmRwb2ludCA9PiBlbmRwb2ludC50b1VUQygpKVxuICAgKiBAZXhhbXBsZSBJbnRlcnZhbC5mcm9tRGF0ZVRpbWVzKGR0MSwgZHQyKS5tYXBFbmRwb2ludHMoZW5kcG9pbnQgPT4gZW5kcG9pbnQucGx1cyh7IGhvdXJzOiAyIH0pKVxuICAgKi9cbiAgbWFwRW5kcG9pbnRzKG1hcEZuKSB7XG4gICAgcmV0dXJuIEludGVydmFsLmZyb21EYXRlVGltZXMobWFwRm4odGhpcy5zKSwgbWFwRm4odGhpcy5lKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgSW5mbyBjbGFzcyBjb250YWlucyBzdGF0aWMgbWV0aG9kcyBmb3IgcmV0cmlldmluZyBnZW5lcmFsIHRpbWUgYW5kIGRhdGUgcmVsYXRlZCBkYXRhLiBGb3IgZXhhbXBsZSwgaXQgaGFzIG1ldGhvZHMgZm9yIGZpbmRpbmcgb3V0IGlmIGEgdGltZSB6b25lIGhhcyBhIERTVCwgZm9yIGxpc3RpbmcgdGhlIG1vbnRocyBpbiBhbnkgc3VwcG9ydGVkIGxvY2FsZSwgYW5kIGZvciBkaXNjb3ZlcmluZyB3aGljaCBvZiBMdXhvbiBmZWF0dXJlcyBhcmUgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50LlxuICovXG5jbGFzcyBJbmZvIHtcbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgem9uZSBjb250YWlucyBhIERTVC5cbiAgICogQHBhcmFtIHtzdHJpbmd8Wm9uZX0gW3pvbmU9J2xvY2FsJ10gLSBab25lIHRvIGNoZWNrLiBEZWZhdWx0cyB0byB0aGUgZW52aXJvbm1lbnQncyBsb2NhbCB6b25lLlxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgc3RhdGljIGhhc0RTVCh6b25lID0gU2V0dGluZ3MuZGVmYXVsdFpvbmUpIHtcbiAgICBjb25zdCBwcm90byA9IERhdGVUaW1lLm5vdygpLnNldFpvbmUoem9uZSkuc2V0KHsgbW9udGg6IDEyIH0pO1xuXG4gICAgcmV0dXJuICF6b25lLmlzVW5pdmVyc2FsICYmIHByb3RvLm9mZnNldCAhPT0gcHJvdG8uc2V0KHsgbW9udGg6IDYgfSkub2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgem9uZSBpcyBhIHZhbGlkIElBTkEgc3BlY2lmaWVyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gem9uZSAtIFpvbmUgdG8gY2hlY2tcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIHN0YXRpYyBpc1ZhbGlkSUFOQVpvbmUoem9uZSkge1xuICAgIHJldHVybiBJQU5BWm9uZS5pc1ZhbGlkWm9uZSh6b25lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgaW5wdXQgaW50byBhIHtAbGluayBab25lfSBpbnN0YW5jZS5cbiAgICpcbiAgICogKiBJZiBgaW5wdXRgIGlzIGFscmVhZHkgYSBab25lIGluc3RhbmNlLCBpdCBpcyByZXR1cm5lZCB1bmNoYW5nZWQuXG4gICAqICogSWYgYGlucHV0YCBpcyBhIHN0cmluZyBjb250YWluaW5nIGEgdmFsaWQgdGltZSB6b25lIG5hbWUsIGEgWm9uZSBpbnN0YW5jZVxuICAgKiAgIHdpdGggdGhhdCBuYW1lIGlzIHJldHVybmVkLlxuICAgKiAqIElmIGBpbnB1dGAgaXMgYSBzdHJpbmcgdGhhdCBkb2Vzbid0IHJlZmVyIHRvIGEga25vd24gdGltZSB6b25lLCBhIFpvbmVcbiAgICogICBpbnN0YW5jZSB3aXRoIHtAbGluayBab25lI2lzVmFsaWR9ID09IGZhbHNlIGlzIHJldHVybmVkLlxuICAgKiAqIElmIGBpbnB1dCBpcyBhIG51bWJlciwgYSBab25lIGluc3RhbmNlIHdpdGggdGhlIHNwZWNpZmllZCBmaXhlZCBvZmZzZXRcbiAgICogICBpbiBtaW51dGVzIGlzIHJldHVybmVkLlxuICAgKiAqIElmIGBpbnB1dGAgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCB0aGUgZGVmYXVsdCB6b25lIGlzIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ3xab25lfG51bWJlcn0gW2lucHV0XSAtIHRoZSB2YWx1ZSB0byBiZSBjb252ZXJ0ZWRcbiAgICogQHJldHVybiB7Wm9uZX1cbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemVab25lKGlucHV0KSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVpvbmUoaW5wdXQsIFNldHRpbmdzLmRlZmF1bHRab25lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdlZWtkYXkgb24gd2hpY2ggdGhlIHdlZWsgc3RhcnRzIGFjY29yZGluZyB0byB0aGUgZ2l2ZW4gbG9jYWxlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZV0gLSB0aGUgbG9jYWxlIGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY09iaj1udWxsXSAtIGFuIGV4aXN0aW5nIGxvY2FsZSBvYmplY3QgdG8gdXNlXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBzdGFydCBvZiB0aGUgd2VlaywgMSBmb3IgTW9uZGF5IHRocm91Z2ggNyBmb3IgU3VuZGF5XG4gICAqL1xuICBzdGF0aWMgZ2V0U3RhcnRPZldlZWsoeyBsb2NhbGUgPSBudWxsLCBsb2NPYmogPSBudWxsIH0gPSB7fSkge1xuICAgIHJldHVybiAobG9jT2JqIHx8IExvY2FsZS5jcmVhdGUobG9jYWxlKSkuZ2V0U3RhcnRPZldlZWsoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGRheXMgbmVjZXNzYXJ5IGluIGEgd2VlayBiZWZvcmUgaXQgaXMgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBuZXh0IHllYXIgYWNjb3JkaW5nXG4gICAqIHRvIHRoZSBnaXZlbiBsb2NhbGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlXSAtIHRoZSBsb2NhbGUgY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jT2JqPW51bGxdIC0gYW4gZXhpc3RpbmcgbG9jYWxlIG9iamVjdCB0byB1c2VcbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIHN0YXRpYyBnZXRNaW5pbXVtRGF5c0luRmlyc3RXZWVrKHsgbG9jYWxlID0gbnVsbCwgbG9jT2JqID0gbnVsbCB9ID0ge30pIHtcbiAgICByZXR1cm4gKGxvY09iaiB8fCBMb2NhbGUuY3JlYXRlKGxvY2FsZSkpLmdldE1pbkRheXNJbkZpcnN0V2VlaygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgd2Vla2RheXMsIHdoaWNoIGFyZSBjb25zaWRlcmVkIHRoZSB3ZWVrZW5kIGFjY29yZGluZyB0byB0aGUgZ2l2ZW4gbG9jYWxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlXSAtIHRoZSBsb2NhbGUgY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jT2JqPW51bGxdIC0gYW4gZXhpc3RpbmcgbG9jYWxlIG9iamVjdCB0byB1c2VcbiAgICogQHJldHVybnMge251bWJlcltdfSBhbiBhcnJheSBvZiB3ZWVrZGF5cywgMSBmb3IgTW9uZGF5IHRocm91Z2ggNyBmb3IgU3VuZGF5XG4gICAqL1xuICBzdGF0aWMgZ2V0V2Vla2VuZFdlZWtkYXlzKHsgbG9jYWxlID0gbnVsbCwgbG9jT2JqID0gbnVsbCB9ID0ge30pIHtcbiAgICAvLyBjb3B5IHRoZSBhcnJheSwgYmVjYXVzZSB3ZSBjYWNoZSBpdCBpbnRlcm5hbGx5XG4gICAgcmV0dXJuIChsb2NPYmogfHwgTG9jYWxlLmNyZWF0ZShsb2NhbGUpKS5nZXRXZWVrZW5kRGF5cygpLnNsaWNlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIHN0YW5kYWxvbmUgbW9udGggbmFtZXMuXG4gICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZVRpbWVGb3JtYXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsZW5ndGg9J2xvbmcnXSAtIHRoZSBsZW5ndGggb2YgdGhlIG1vbnRoIHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIFwibnVtZXJpY1wiLCBcIjItZGlnaXRcIiwgXCJuYXJyb3dcIiwgXCJzaG9ydFwiLCBcImxvbmdcIlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZV0gLSB0aGUgbG9jYWxlIGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLm51bWJlcmluZ1N5c3RlbT1udWxsXSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5sb2NPYmo9bnVsbF0gLSBhbiBleGlzdGluZyBsb2NhbGUgb2JqZWN0IHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMub3V0cHV0Q2FsZW5kYXI9J2dyZWdvcnknXSAtIHRoZSBjYWxlbmRhclxuICAgKiBAZXhhbXBsZSBJbmZvLm1vbnRocygpWzBdIC8vPT4gJ0phbnVhcnknXG4gICAqIEBleGFtcGxlIEluZm8ubW9udGhzKCdzaG9ydCcpWzBdIC8vPT4gJ0phbidcbiAgICogQGV4YW1wbGUgSW5mby5tb250aHMoJ251bWVyaWMnKVswXSAvLz0+ICcxJ1xuICAgKiBAZXhhbXBsZSBJbmZvLm1vbnRocygnc2hvcnQnLCB7IGxvY2FsZTogJ2ZyLUNBJyB9IClbMF0gLy89PiAnamFudi4nXG4gICAqIEBleGFtcGxlIEluZm8ubW9udGhzKCdudW1lcmljJywgeyBsb2NhbGU6ICdhcicgfSlbMF0gLy89PiAn2aEnXG4gICAqIEBleGFtcGxlIEluZm8ubW9udGhzKCdsb25nJywgeyBvdXRwdXRDYWxlbmRhcjogJ2lzbGFtaWMnIH0pWzBdIC8vPT4gJ1JhYmnKuyBJJ1xuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyBtb250aHMoXG4gICAgbGVuZ3RoID0gXCJsb25nXCIsXG4gICAgeyBsb2NhbGUgPSBudWxsLCBudW1iZXJpbmdTeXN0ZW0gPSBudWxsLCBsb2NPYmogPSBudWxsLCBvdXRwdXRDYWxlbmRhciA9IFwiZ3JlZ29yeVwiIH0gPSB7fVxuICApIHtcbiAgICByZXR1cm4gKGxvY09iaiB8fCBMb2NhbGUuY3JlYXRlKGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBvdXRwdXRDYWxlbmRhcikpLm1vbnRocyhsZW5ndGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhbiBhcnJheSBvZiBmb3JtYXQgbW9udGggbmFtZXMuXG4gICAqIEZvcm1hdCBtb250aHMgZGlmZmVyIGZyb20gc3RhbmRhbG9uZSBtb250aHMgaW4gdGhhdCB0aGV5J3JlIG1lYW50IHRvIGFwcGVhciBuZXh0IHRvIHRoZSBkYXkgb2YgdGhlIG1vbnRoLiBJbiBzb21lIGxhbmd1YWdlcywgdGhhdFxuICAgKiBjaGFuZ2VzIHRoZSBzdHJpbmcuXG4gICAqIFNlZSB7QGxpbmsgSW5mbyNtb250aHN9XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGVuZ3RoPSdsb25nJ10gLSB0aGUgbGVuZ3RoIG9mIHRoZSBtb250aCByZXByZXNlbnRhdGlvbiwgc3VjaCBhcyBcIm51bWVyaWNcIiwgXCIyLWRpZ2l0XCIsIFwibmFycm93XCIsIFwic2hvcnRcIiwgXCJsb25nXCJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5sb2NhbGVdIC0gdGhlIGxvY2FsZSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5udW1iZXJpbmdTeXN0ZW09bnVsbF0gLSB0aGUgbnVtYmVyaW5nIHN5c3RlbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jT2JqPW51bGxdIC0gYW4gZXhpc3RpbmcgbG9jYWxlIG9iamVjdCB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLm91dHB1dENhbGVuZGFyPSdncmVnb3J5J10gLSB0aGUgY2FsZW5kYXJcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzdGF0aWMgbW9udGhzRm9ybWF0KFxuICAgIGxlbmd0aCA9IFwibG9uZ1wiLFxuICAgIHsgbG9jYWxlID0gbnVsbCwgbnVtYmVyaW5nU3lzdGVtID0gbnVsbCwgbG9jT2JqID0gbnVsbCwgb3V0cHV0Q2FsZW5kYXIgPSBcImdyZWdvcnlcIiB9ID0ge31cbiAgKSB7XG4gICAgcmV0dXJuIChsb2NPYmogfHwgTG9jYWxlLmNyZWF0ZShsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgb3V0cHV0Q2FsZW5kYXIpKS5tb250aHMobGVuZ3RoLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gYXJyYXkgb2Ygc3RhbmRhbG9uZSB3ZWVrIG5hbWVzLlxuICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGVUaW1lRm9ybWF0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGVuZ3RoPSdsb25nJ10gLSB0aGUgbGVuZ3RoIG9mIHRoZSB3ZWVrZGF5IHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIFwibmFycm93XCIsIFwic2hvcnRcIiwgXCJsb25nXCIuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlXSAtIHRoZSBsb2NhbGUgY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubnVtYmVyaW5nU3lzdGVtPW51bGxdIC0gdGhlIG51bWJlcmluZyBzeXN0ZW1cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY09iaj1udWxsXSAtIGFuIGV4aXN0aW5nIGxvY2FsZSBvYmplY3QgdG8gdXNlXG4gICAqIEBleGFtcGxlIEluZm8ud2Vla2RheXMoKVswXSAvLz0+ICdNb25kYXknXG4gICAqIEBleGFtcGxlIEluZm8ud2Vla2RheXMoJ3Nob3J0JylbMF0gLy89PiAnTW9uJ1xuICAgKiBAZXhhbXBsZSBJbmZvLndlZWtkYXlzKCdzaG9ydCcsIHsgbG9jYWxlOiAnZnItQ0EnIH0pWzBdIC8vPT4gJ2x1bi4nXG4gICAqIEBleGFtcGxlIEluZm8ud2Vla2RheXMoJ3Nob3J0JywgeyBsb2NhbGU6ICdhcicgfSlbMF0gLy89PiAn2KfZhNin2KvZhtmK2YYnXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cbiAgc3RhdGljIHdlZWtkYXlzKGxlbmd0aCA9IFwibG9uZ1wiLCB7IGxvY2FsZSA9IG51bGwsIG51bWJlcmluZ1N5c3RlbSA9IG51bGwsIGxvY09iaiA9IG51bGwgfSA9IHt9KSB7XG4gICAgcmV0dXJuIChsb2NPYmogfHwgTG9jYWxlLmNyZWF0ZShsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgbnVsbCkpLndlZWtkYXlzKGxlbmd0aCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIGZvcm1hdCB3ZWVrIG5hbWVzLlxuICAgKiBGb3JtYXQgd2Vla2RheXMgZGlmZmVyIGZyb20gc3RhbmRhbG9uZSB3ZWVrZGF5cyBpbiB0aGF0IHRoZXkncmUgbWVhbnQgdG8gYXBwZWFyIG5leHQgdG8gbW9yZSBkYXRlIGluZm9ybWF0aW9uLiBJbiBzb21lIGxhbmd1YWdlcywgdGhhdFxuICAgKiBjaGFuZ2VzIHRoZSBzdHJpbmcuXG4gICAqIFNlZSB7QGxpbmsgSW5mbyN3ZWVrZGF5c31cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsZW5ndGg9J2xvbmcnXSAtIHRoZSBsZW5ndGggb2YgdGhlIG1vbnRoIHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIFwibmFycm93XCIsIFwic2hvcnRcIiwgXCJsb25nXCIuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlPW51bGxdIC0gdGhlIGxvY2FsZSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5udW1iZXJpbmdTeXN0ZW09bnVsbF0gLSB0aGUgbnVtYmVyaW5nIHN5c3RlbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jT2JqPW51bGxdIC0gYW4gZXhpc3RpbmcgbG9jYWxlIG9iamVjdCB0byB1c2VcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBzdGF0aWMgd2Vla2RheXNGb3JtYXQoXG4gICAgbGVuZ3RoID0gXCJsb25nXCIsXG4gICAgeyBsb2NhbGUgPSBudWxsLCBudW1iZXJpbmdTeXN0ZW0gPSBudWxsLCBsb2NPYmogPSBudWxsIH0gPSB7fVxuICApIHtcbiAgICByZXR1cm4gKGxvY09iaiB8fCBMb2NhbGUuY3JlYXRlKGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBudWxsKSkud2Vla2RheXMobGVuZ3RoLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gYXJyYXkgb2YgbWVyaWRpZW1zLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZV0gLSB0aGUgbG9jYWxlIGNvZGVcbiAgICogQGV4YW1wbGUgSW5mby5tZXJpZGllbXMoKSAvLz0+IFsgJ0FNJywgJ1BNJyBdXG4gICAqIEBleGFtcGxlIEluZm8ubWVyaWRpZW1zKHsgbG9jYWxlOiAnbXknIH0pIC8vPT4gWyAn4YCU4YC24YCU4YCA4YC6JywgJ+GAiuGAlOGAsScgXVxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyBtZXJpZGllbXMoeyBsb2NhbGUgPSBudWxsIH0gPSB7fSkge1xuICAgIHJldHVybiBMb2NhbGUuY3JlYXRlKGxvY2FsZSkubWVyaWRpZW1zKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIGVyYXMsIHN1Y2ggYXMgWydCQycsICdBRCddLiBUaGUgbG9jYWxlIGNhbiBiZSBzcGVjaWZpZWQsIGJ1dCB0aGUgY2FsZW5kYXIgc3lzdGVtIGlzIGFsd2F5cyBHcmVnb3JpYW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGVuZ3RoPSdzaG9ydCddIC0gdGhlIGxlbmd0aCBvZiB0aGUgZXJhIHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIFwic2hvcnRcIiBvciBcImxvbmdcIi5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5sb2NhbGVdIC0gdGhlIGxvY2FsZSBjb2RlXG4gICAqIEBleGFtcGxlIEluZm8uZXJhcygpIC8vPT4gWyAnQkMnLCAnQUQnIF1cbiAgICogQGV4YW1wbGUgSW5mby5lcmFzKCdsb25nJykgLy89PiBbICdCZWZvcmUgQ2hyaXN0JywgJ0Fubm8gRG9taW5pJyBdXG4gICAqIEBleGFtcGxlIEluZm8uZXJhcygnbG9uZycsIHsgbG9jYWxlOiAnZnInIH0pIC8vPT4gWyAnYXZhbnQgSsOpc3VzLUNocmlzdCcsICdhcHLDqHMgSsOpc3VzLUNocmlzdCcgXVxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG4gIHN0YXRpYyBlcmFzKGxlbmd0aCA9IFwic2hvcnRcIiwgeyBsb2NhbGUgPSBudWxsIH0gPSB7fSkge1xuICAgIHJldHVybiBMb2NhbGUuY3JlYXRlKGxvY2FsZSwgbnVsbCwgXCJncmVnb3J5XCIpLmVyYXMobGVuZ3RoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHNldCBvZiBhdmFpbGFibGUgZmVhdHVyZXMgaW4gdGhpcyBlbnZpcm9ubWVudC5cbiAgICogU29tZSBmZWF0dXJlcyBvZiBMdXhvbiBhcmUgbm90IGF2YWlsYWJsZSBpbiBhbGwgZW52aXJvbm1lbnRzLiBGb3IgZXhhbXBsZSwgb24gb2xkZXIgYnJvd3NlcnMsIHJlbGF0aXZlIHRpbWUgZm9ybWF0dGluZyBzdXBwb3J0IGlzIG5vdCBhdmFpbGFibGUuIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgaWYgdGhhdCdzIHRoZSBjYXNlLlxuICAgKiBLZXlzOlxuICAgKiAqIGByZWxhdGl2ZWA6IHdoZXRoZXIgdGhpcyBlbnZpcm9ubWVudCBzdXBwb3J0cyByZWxhdGl2ZSB0aW1lIGZvcm1hdHRpbmdcbiAgICogKiBgbG9jYWxlV2Vla2A6IHdoZXRoZXIgdGhpcyBlbnZpcm9ubWVudCBzdXBwb3J0cyBkaWZmZXJlbnQgd2Vla2RheXMgZm9yIHRoZSBzdGFydCBvZiB0aGUgd2VlayBiYXNlZCBvbiB0aGUgbG9jYWxlXG4gICAqIEBleGFtcGxlIEluZm8uZmVhdHVyZXMoKSAvLz0+IHsgcmVsYXRpdmU6IGZhbHNlLCBsb2NhbGVXZWVrOiB0cnVlIH1cbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGZlYXR1cmVzKCkge1xuICAgIHJldHVybiB7IHJlbGF0aXZlOiBoYXNSZWxhdGl2ZSgpLCBsb2NhbGVXZWVrOiBoYXNMb2NhbGVXZWVrSW5mbygpIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZGF5RGlmZihlYXJsaWVyLCBsYXRlcikge1xuICBjb25zdCB1dGNEYXlTdGFydCA9IChkdCkgPT4gZHQudG9VVEMoMCwgeyBrZWVwTG9jYWxUaW1lOiB0cnVlIH0pLnN0YXJ0T2YoXCJkYXlcIikudmFsdWVPZigpLFxuICAgIG1zID0gdXRjRGF5U3RhcnQobGF0ZXIpIC0gdXRjRGF5U3RhcnQoZWFybGllcik7XG4gIHJldHVybiBNYXRoLmZsb29yKER1cmF0aW9uLmZyb21NaWxsaXMobXMpLmFzKFwiZGF5c1wiKSk7XG59XG5cbmZ1bmN0aW9uIGhpZ2hPcmRlckRpZmZzKGN1cnNvciwgbGF0ZXIsIHVuaXRzKSB7XG4gIGNvbnN0IGRpZmZlcnMgPSBbXG4gICAgW1wieWVhcnNcIiwgKGEsIGIpID0+IGIueWVhciAtIGEueWVhcl0sXG4gICAgW1wicXVhcnRlcnNcIiwgKGEsIGIpID0+IGIucXVhcnRlciAtIGEucXVhcnRlciArIChiLnllYXIgLSBhLnllYXIpICogNF0sXG4gICAgW1wibW9udGhzXCIsIChhLCBiKSA9PiBiLm1vbnRoIC0gYS5tb250aCArIChiLnllYXIgLSBhLnllYXIpICogMTJdLFxuICAgIFtcbiAgICAgIFwid2Vla3NcIixcbiAgICAgIChhLCBiKSA9PiB7XG4gICAgICAgIGNvbnN0IGRheXMgPSBkYXlEaWZmKGEsIGIpO1xuICAgICAgICByZXR1cm4gKGRheXMgLSAoZGF5cyAlIDcpKSAvIDc7XG4gICAgICB9LFxuICAgIF0sXG4gICAgW1wiZGF5c1wiLCBkYXlEaWZmXSxcbiAgXTtcblxuICBjb25zdCByZXN1bHRzID0ge307XG4gIGNvbnN0IGVhcmxpZXIgPSBjdXJzb3I7XG4gIGxldCBsb3dlc3RPcmRlciwgaGlnaFdhdGVyO1xuXG4gIC8qIFRoaXMgbG9vcCB0cmllcyB0byBkaWZmIHVzaW5nIGxhcmdlciB1bml0cyBmaXJzdC5cbiAgICAgSWYgd2Ugb3ZlcnNob290LCB3ZSBiYWNrdHJhY2sgYW5kIHRyeSB0aGUgbmV4dCBzbWFsbGVyIHVuaXQuXG4gICAgIFwiY3Vyc29yXCIgc3RhcnRzIG91dCBhdCB0aGUgZWFybGllciB0aW1lc3RhbXAgYW5kIG1vdmVzIGNsb3NlciBhbmQgY2xvc2VyIHRvIFwibGF0ZXJcIlxuICAgICBhcyB3ZSB1c2Ugc21hbGxlciBhbmQgc21hbGxlciB1bml0cy5cbiAgICAgaGlnaFdhdGVyIGtlZXBzIHRyYWNrIG9mIHdoZXJlIHdlIHdvdWxkIGJlIGlmIHdlIGFkZGVkIG9uZSBtb3JlIG9mIHRoZSBzbWFsbGVzdCB1bml0LFxuICAgICB0aGlzIGlzIHVzZWQgbGF0ZXIgdG8gcG90ZW50aWFsbHkgY29udmVydCBhbnkgZGlmZmVyZW5jZSBzbWFsbGVyIHRoYW4gdGhlIHNtYWxsZXN0IGhpZ2hlciBvcmRlciB1bml0XG4gICAgIGludG8gYSBmcmFjdGlvbiBvZiB0aGF0IHNtYWxsZXN0IGhpZ2hlciBvcmRlciB1bml0XG4gICovXG4gIGZvciAoY29uc3QgW3VuaXQsIGRpZmZlcl0gb2YgZGlmZmVycykge1xuICAgIGlmICh1bml0cy5pbmRleE9mKHVuaXQpID49IDApIHtcbiAgICAgIGxvd2VzdE9yZGVyID0gdW5pdDtcblxuICAgICAgcmVzdWx0c1t1bml0XSA9IGRpZmZlcihjdXJzb3IsIGxhdGVyKTtcbiAgICAgIGhpZ2hXYXRlciA9IGVhcmxpZXIucGx1cyhyZXN1bHRzKTtcblxuICAgICAgaWYgKGhpZ2hXYXRlciA+IGxhdGVyKSB7XG4gICAgICAgIC8vIHdlIG92ZXJzaG90IHRoZSBlbmQgcG9pbnQsIGJhY2t0cmFjayBjdXJzb3IgYnkgMVxuICAgICAgICByZXN1bHRzW3VuaXRdLS07XG4gICAgICAgIGN1cnNvciA9IGVhcmxpZXIucGx1cyhyZXN1bHRzKTtcblxuICAgICAgICAvLyBpZiB3ZSBhcmUgc3RpbGwgb3ZlcnNob290aW5nIG5vdywgd2UgbmVlZCB0byBiYWNrdHJhY2sgYWdhaW5cbiAgICAgICAgLy8gdGhpcyBoYXBwZW5zIGluIGNlcnRhaW4gc2l0dWF0aW9ucyB3aGVuIGRpZmZpbmcgdGltZXMgaW4gZGlmZmVyZW50IHpvbmVzLFxuICAgICAgICAvLyBiZWNhdXNlIHRoaXMgY2FsY3VsYXRpb24gaWdub3JlcyB0aW1lIHpvbmVzXG4gICAgICAgIGlmIChjdXJzb3IgPiBsYXRlcikge1xuICAgICAgICAgIC8vIGtlZXAgdGhlIFwib3ZlcnNob3QgYnkgMVwiIGFyb3VuZCBhcyBoaWdoV2F0ZXJcbiAgICAgICAgICBoaWdoV2F0ZXIgPSBjdXJzb3I7XG4gICAgICAgICAgLy8gYmFja3RyYWNrIGN1cnNvciBieSAxXG4gICAgICAgICAgcmVzdWx0c1t1bml0XS0tO1xuICAgICAgICAgIGN1cnNvciA9IGVhcmxpZXIucGx1cyhyZXN1bHRzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3Vyc29yID0gaGlnaFdhdGVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbY3Vyc29yLCByZXN1bHRzLCBoaWdoV2F0ZXIsIGxvd2VzdE9yZGVyXTtcbn1cblxuZnVuY3Rpb24gZGlmZiAoZWFybGllciwgbGF0ZXIsIHVuaXRzLCBvcHRzKSB7XG4gIGxldCBbY3Vyc29yLCByZXN1bHRzLCBoaWdoV2F0ZXIsIGxvd2VzdE9yZGVyXSA9IGhpZ2hPcmRlckRpZmZzKGVhcmxpZXIsIGxhdGVyLCB1bml0cyk7XG5cbiAgY29uc3QgcmVtYWluaW5nTWlsbGlzID0gbGF0ZXIgLSBjdXJzb3I7XG5cbiAgY29uc3QgbG93ZXJPcmRlclVuaXRzID0gdW5pdHMuZmlsdGVyKFxuICAgICh1KSA9PiBbXCJob3Vyc1wiLCBcIm1pbnV0ZXNcIiwgXCJzZWNvbmRzXCIsIFwibWlsbGlzZWNvbmRzXCJdLmluZGV4T2YodSkgPj0gMFxuICApO1xuXG4gIGlmIChsb3dlck9yZGVyVW5pdHMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGhpZ2hXYXRlciA8IGxhdGVyKSB7XG4gICAgICBoaWdoV2F0ZXIgPSBjdXJzb3IucGx1cyh7IFtsb3dlc3RPcmRlcl06IDEgfSk7XG4gICAgfVxuXG4gICAgaWYgKGhpZ2hXYXRlciAhPT0gY3Vyc29yKSB7XG4gICAgICByZXN1bHRzW2xvd2VzdE9yZGVyXSA9IChyZXN1bHRzW2xvd2VzdE9yZGVyXSB8fCAwKSArIHJlbWFpbmluZ01pbGxpcyAvIChoaWdoV2F0ZXIgLSBjdXJzb3IpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGR1cmF0aW9uID0gRHVyYXRpb24uZnJvbU9iamVjdChyZXN1bHRzLCBvcHRzKTtcblxuICBpZiAobG93ZXJPcmRlclVuaXRzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gRHVyYXRpb24uZnJvbU1pbGxpcyhyZW1haW5pbmdNaWxsaXMsIG9wdHMpXG4gICAgICAuc2hpZnRUbyguLi5sb3dlck9yZGVyVW5pdHMpXG4gICAgICAucGx1cyhkdXJhdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGR1cmF0aW9uO1xuICB9XG59XG5cbmNvbnN0IG51bWJlcmluZ1N5c3RlbXMgPSB7XG4gIGFyYWI6IFwiW1xcdTA2NjAtXFx1MDY2OV1cIixcbiAgYXJhYmV4dDogXCJbXFx1MDZGMC1cXHUwNkY5XVwiLFxuICBiYWxpOiBcIltcXHUxQjUwLVxcdTFCNTldXCIsXG4gIGJlbmc6IFwiW1xcdTA5RTYtXFx1MDlFRl1cIixcbiAgZGV2YTogXCJbXFx1MDk2Ni1cXHUwOTZGXVwiLFxuICBmdWxsd2lkZTogXCJbXFx1RkYxMC1cXHVGRjE5XVwiLFxuICBndWpyOiBcIltcXHUwQUU2LVxcdTBBRUZdXCIsXG4gIGhhbmlkZWM6IFwiW+OAh3zkuIB85LqMfOS4iXzlm5t85LqUfOWFrXzkuIN85YWrfOS5nV1cIixcbiAga2htcjogXCJbXFx1MTdFMC1cXHUxN0U5XVwiLFxuICBrbmRhOiBcIltcXHUwQ0U2LVxcdTBDRUZdXCIsXG4gIGxhb286IFwiW1xcdTBFRDAtXFx1MEVEOV1cIixcbiAgbGltYjogXCJbXFx1MTk0Ni1cXHUxOTRGXVwiLFxuICBtbHltOiBcIltcXHUwRDY2LVxcdTBENkZdXCIsXG4gIG1vbmc6IFwiW1xcdTE4MTAtXFx1MTgxOV1cIixcbiAgbXltcjogXCJbXFx1MTA0MC1cXHUxMDQ5XVwiLFxuICBvcnlhOiBcIltcXHUwQjY2LVxcdTBCNkZdXCIsXG4gIHRhbWxkZWM6IFwiW1xcdTBCRTYtXFx1MEJFRl1cIixcbiAgdGVsdTogXCJbXFx1MEM2Ni1cXHUwQzZGXVwiLFxuICB0aGFpOiBcIltcXHUwRTUwLVxcdTBFNTldXCIsXG4gIHRpYnQ6IFwiW1xcdTBGMjAtXFx1MEYyOV1cIixcbiAgbGF0bjogXCJcXFxcZFwiLFxufTtcblxuY29uc3QgbnVtYmVyaW5nU3lzdGVtc1VURjE2ID0ge1xuICBhcmFiOiBbMTYzMiwgMTY0MV0sXG4gIGFyYWJleHQ6IFsxNzc2LCAxNzg1XSxcbiAgYmFsaTogWzY5OTIsIDcwMDFdLFxuICBiZW5nOiBbMjUzNCwgMjU0M10sXG4gIGRldmE6IFsyNDA2LCAyNDE1XSxcbiAgZnVsbHdpZGU6IFs2NTI5NiwgNjUzMDNdLFxuICBndWpyOiBbMjc5MCwgMjc5OV0sXG4gIGtobXI6IFs2MTEyLCA2MTIxXSxcbiAga25kYTogWzMzMDIsIDMzMTFdLFxuICBsYW9vOiBbMzc5MiwgMzgwMV0sXG4gIGxpbWI6IFs2NDcwLCA2NDc5XSxcbiAgbWx5bTogWzM0MzAsIDM0MzldLFxuICBtb25nOiBbNjE2MCwgNjE2OV0sXG4gIG15bXI6IFs0MTYwLCA0MTY5XSxcbiAgb3J5YTogWzI5MTgsIDI5MjddLFxuICB0YW1sZGVjOiBbMzA0NiwgMzA1NV0sXG4gIHRlbHU6IFszMTc0LCAzMTgzXSxcbiAgdGhhaTogWzM2NjQsIDM2NzNdLFxuICB0aWJ0OiBbMzg3MiwgMzg4MV0sXG59O1xuXG5jb25zdCBoYW5pZGVjQ2hhcnMgPSBudW1iZXJpbmdTeXN0ZW1zLmhhbmlkZWMucmVwbGFjZSgvW1xcW3xcXF1dL2csIFwiXCIpLnNwbGl0KFwiXCIpO1xuXG5mdW5jdGlvbiBwYXJzZURpZ2l0cyhzdHIpIHtcbiAgbGV0IHZhbHVlID0gcGFyc2VJbnQoc3RyLCAxMCk7XG4gIGlmIChpc05hTih2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcblxuICAgICAgaWYgKHN0cltpXS5zZWFyY2gobnVtYmVyaW5nU3lzdGVtcy5oYW5pZGVjKSAhPT0gLTEpIHtcbiAgICAgICAgdmFsdWUgKz0gaGFuaWRlY0NoYXJzLmluZGV4T2Yoc3RyW2ldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG51bWJlcmluZ1N5c3RlbXNVVEYxNikge1xuICAgICAgICAgIGNvbnN0IFttaW4sIG1heF0gPSBudW1iZXJpbmdTeXN0ZW1zVVRGMTZba2V5XTtcbiAgICAgICAgICBpZiAoY29kZSA+PSBtaW4gJiYgY29kZSA8PSBtYXgpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGNvZGUgLSBtaW47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaWdpdFJlZ2V4KHsgbnVtYmVyaW5nU3lzdGVtIH0sIGFwcGVuZCA9IFwiXCIpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoYCR7bnVtYmVyaW5nU3lzdGVtc1tudW1iZXJpbmdTeXN0ZW0gfHwgXCJsYXRuXCJdfSR7YXBwZW5kfWApO1xufVxuXG5jb25zdCBNSVNTSU5HX0ZUUCA9IFwibWlzc2luZyBJbnRsLkRhdGVUaW1lRm9ybWF0LmZvcm1hdFRvUGFydHMgc3VwcG9ydFwiO1xuXG5mdW5jdGlvbiBpbnRVbml0KHJlZ2V4LCBwb3N0ID0gKGkpID0+IGkpIHtcbiAgcmV0dXJuIHsgcmVnZXgsIGRlc2VyOiAoW3NdKSA9PiBwb3N0KHBhcnNlRGlnaXRzKHMpKSB9O1xufVxuXG5jb25zdCBOQlNQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgxNjApO1xuY29uc3Qgc3BhY2VPck5CU1AgPSBgWyAke05CU1B9XWA7XG5jb25zdCBzcGFjZU9yTkJTUFJlZ0V4cCA9IG5ldyBSZWdFeHAoc3BhY2VPck5CU1AsIFwiZ1wiKTtcblxuZnVuY3Rpb24gZml4TGlzdFJlZ2V4KHMpIHtcbiAgLy8gbWFrZSBkb3RzIG9wdGlvbmFsIGFuZCBhbHNvIG1ha2UgdGhlbSBsaXRlcmFsXG4gIC8vIG1ha2Ugc3BhY2UgYW5kIG5vbiBicmVha2FibGUgc3BhY2UgY2hhcmFjdGVycyBpbnRlcmNoYW5nZWFibGVcbiAgcmV0dXJuIHMucmVwbGFjZSgvXFwuL2csIFwiXFxcXC4/XCIpLnJlcGxhY2Uoc3BhY2VPck5CU1BSZWdFeHAsIHNwYWNlT3JOQlNQKTtcbn1cblxuZnVuY3Rpb24gc3RyaXBJbnNlbnNpdGl2aXRpZXMocykge1xuICByZXR1cm4gc1xuICAgIC5yZXBsYWNlKC9cXC4vZywgXCJcIikgLy8gaWdub3JlIGRvdHMgdGhhdCB3ZXJlIG1hZGUgb3B0aW9uYWxcbiAgICAucmVwbGFjZShzcGFjZU9yTkJTUFJlZ0V4cCwgXCIgXCIpIC8vIGludGVyY2hhbmdlIHNwYWNlIGFuZCBuYnNwXG4gICAgLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIG9uZU9mKHN0cmluZ3MsIHN0YXJ0SW5kZXgpIHtcbiAgaWYgKHN0cmluZ3MgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVnZXg6IFJlZ0V4cChzdHJpbmdzLm1hcChmaXhMaXN0UmVnZXgpLmpvaW4oXCJ8XCIpKSxcbiAgICAgIGRlc2VyOiAoW3NdKSA9PlxuICAgICAgICBzdHJpbmdzLmZpbmRJbmRleCgoaSkgPT4gc3RyaXBJbnNlbnNpdGl2aXRpZXMocykgPT09IHN0cmlwSW5zZW5zaXRpdml0aWVzKGkpKSArIHN0YXJ0SW5kZXgsXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvZmZzZXQocmVnZXgsIGdyb3Vwcykge1xuICByZXR1cm4geyByZWdleCwgZGVzZXI6IChbLCBoLCBtXSkgPT4gc2lnbmVkT2Zmc2V0KGgsIG0pLCBncm91cHMgfTtcbn1cblxuZnVuY3Rpb24gc2ltcGxlKHJlZ2V4KSB7XG4gIHJldHVybiB7IHJlZ2V4LCBkZXNlcjogKFtzXSkgPT4gcyB9O1xufVxuXG5mdW5jdGlvbiBlc2NhcGVUb2tlbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW1xcLVxcW1xcXXt9KCkqKz8uLFxcXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB0b2tlblxuICogQHBhcmFtIHtMb2NhbGV9IGxvY1xuICovXG5mdW5jdGlvbiB1bml0Rm9yVG9rZW4odG9rZW4sIGxvYykge1xuICBjb25zdCBvbmUgPSBkaWdpdFJlZ2V4KGxvYyksXG4gICAgdHdvID0gZGlnaXRSZWdleChsb2MsIFwiezJ9XCIpLFxuICAgIHRocmVlID0gZGlnaXRSZWdleChsb2MsIFwiezN9XCIpLFxuICAgIGZvdXIgPSBkaWdpdFJlZ2V4KGxvYywgXCJ7NH1cIiksXG4gICAgc2l4ID0gZGlnaXRSZWdleChsb2MsIFwiezZ9XCIpLFxuICAgIG9uZU9yVHdvID0gZGlnaXRSZWdleChsb2MsIFwiezEsMn1cIiksXG4gICAgb25lVG9UaHJlZSA9IGRpZ2l0UmVnZXgobG9jLCBcInsxLDN9XCIpLFxuICAgIG9uZVRvU2l4ID0gZGlnaXRSZWdleChsb2MsIFwiezEsNn1cIiksXG4gICAgb25lVG9OaW5lID0gZGlnaXRSZWdleChsb2MsIFwiezEsOX1cIiksXG4gICAgdHdvVG9Gb3VyID0gZGlnaXRSZWdleChsb2MsIFwiezIsNH1cIiksXG4gICAgZm91clRvU2l4ID0gZGlnaXRSZWdleChsb2MsIFwiezQsNn1cIiksXG4gICAgbGl0ZXJhbCA9ICh0KSA9PiAoeyByZWdleDogUmVnRXhwKGVzY2FwZVRva2VuKHQudmFsKSksIGRlc2VyOiAoW3NdKSA9PiBzLCBsaXRlcmFsOiB0cnVlIH0pLFxuICAgIHVuaXRhdGUgPSAodCkgPT4ge1xuICAgICAgaWYgKHRva2VuLmxpdGVyYWwpIHtcbiAgICAgICAgcmV0dXJuIGxpdGVyYWwodCk7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHQudmFsKSB7XG4gICAgICAgIC8vIGVyYVxuICAgICAgICBjYXNlIFwiR1wiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2MuZXJhcyhcInNob3J0XCIpLCAwKTtcbiAgICAgICAgY2FzZSBcIkdHXCI6XG4gICAgICAgICAgcmV0dXJuIG9uZU9mKGxvYy5lcmFzKFwibG9uZ1wiKSwgMCk7XG4gICAgICAgIC8vIHllYXJzXG4gICAgICAgIGNhc2UgXCJ5XCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQob25lVG9TaXgpO1xuICAgICAgICBjYXNlIFwieXlcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdCh0d29Ub0ZvdXIsIHVudHJ1bmNhdGVZZWFyKTtcbiAgICAgICAgY2FzZSBcInl5eXlcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdChmb3VyKTtcbiAgICAgICAgY2FzZSBcInl5eXl5XCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQoZm91clRvU2l4KTtcbiAgICAgICAgY2FzZSBcInl5eXl5eVwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KHNpeCk7XG4gICAgICAgIC8vIG1vbnRoc1xuICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KG9uZU9yVHdvKTtcbiAgICAgICAgY2FzZSBcIk1NXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQodHdvKTtcbiAgICAgICAgY2FzZSBcIk1NTVwiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2MubW9udGhzKFwic2hvcnRcIiwgdHJ1ZSksIDEpO1xuICAgICAgICBjYXNlIFwiTU1NTVwiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2MubW9udGhzKFwibG9uZ1wiLCB0cnVlKSwgMSk7XG4gICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQob25lT3JUd28pO1xuICAgICAgICBjYXNlIFwiTExcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdCh0d28pO1xuICAgICAgICBjYXNlIFwiTExMXCI6XG4gICAgICAgICAgcmV0dXJuIG9uZU9mKGxvYy5tb250aHMoXCJzaG9ydFwiLCBmYWxzZSksIDEpO1xuICAgICAgICBjYXNlIFwiTExMTFwiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2MubW9udGhzKFwibG9uZ1wiLCBmYWxzZSksIDEpO1xuICAgICAgICAvLyBkYXRlc1xuICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KG9uZU9yVHdvKTtcbiAgICAgICAgY2FzZSBcImRkXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQodHdvKTtcbiAgICAgICAgLy8gb3JkaW5hbHNcbiAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdChvbmVUb1RocmVlKTtcbiAgICAgICAgY2FzZSBcIm9vb1wiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KHRocmVlKTtcbiAgICAgICAgLy8gdGltZVxuICAgICAgICBjYXNlIFwiSEhcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdCh0d28pO1xuICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KG9uZU9yVHdvKTtcbiAgICAgICAgY2FzZSBcImhoXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQodHdvKTtcbiAgICAgICAgY2FzZSBcImhcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdChvbmVPclR3byk7XG4gICAgICAgIGNhc2UgXCJtbVwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KHR3byk7XG4gICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQob25lT3JUd28pO1xuICAgICAgICBjYXNlIFwicVwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KG9uZU9yVHdvKTtcbiAgICAgICAgY2FzZSBcInFxXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQodHdvKTtcbiAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdChvbmVPclR3byk7XG4gICAgICAgIGNhc2UgXCJzc1wiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KHR3byk7XG4gICAgICAgIGNhc2UgXCJTXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQob25lVG9UaHJlZSk7XG4gICAgICAgIGNhc2UgXCJTU1NcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdCh0aHJlZSk7XG4gICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgcmV0dXJuIHNpbXBsZShvbmVUb05pbmUpO1xuICAgICAgICBjYXNlIFwidXVcIjpcbiAgICAgICAgICByZXR1cm4gc2ltcGxlKG9uZU9yVHdvKTtcbiAgICAgICAgY2FzZSBcInV1dVwiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KG9uZSk7XG4gICAgICAgIC8vIG1lcmlkaWVtXG4gICAgICAgIGNhc2UgXCJhXCI6XG4gICAgICAgICAgcmV0dXJuIG9uZU9mKGxvYy5tZXJpZGllbXMoKSwgMCk7XG4gICAgICAgIC8vIHdlZWtZZWFyIChrKVxuICAgICAgICBjYXNlIFwia2tra1wiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KGZvdXIpO1xuICAgICAgICBjYXNlIFwia2tcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdCh0d29Ub0ZvdXIsIHVudHJ1bmNhdGVZZWFyKTtcbiAgICAgICAgLy8gd2Vla051bWJlciAoVylcbiAgICAgICAgY2FzZSBcIldcIjpcbiAgICAgICAgICByZXR1cm4gaW50VW5pdChvbmVPclR3byk7XG4gICAgICAgIGNhc2UgXCJXV1wiOlxuICAgICAgICAgIHJldHVybiBpbnRVbml0KHR3byk7XG4gICAgICAgIC8vIHdlZWtkYXlzXG4gICAgICAgIGNhc2UgXCJFXCI6XG4gICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgcmV0dXJuIGludFVuaXQob25lKTtcbiAgICAgICAgY2FzZSBcIkVFRVwiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2Mud2Vla2RheXMoXCJzaG9ydFwiLCBmYWxzZSksIDEpO1xuICAgICAgICBjYXNlIFwiRUVFRVwiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2Mud2Vla2RheXMoXCJsb25nXCIsIGZhbHNlKSwgMSk7XG4gICAgICAgIGNhc2UgXCJjY2NcIjpcbiAgICAgICAgICByZXR1cm4gb25lT2YobG9jLndlZWtkYXlzKFwic2hvcnRcIiwgdHJ1ZSksIDEpO1xuICAgICAgICBjYXNlIFwiY2NjY1wiOlxuICAgICAgICAgIHJldHVybiBvbmVPZihsb2Mud2Vla2RheXMoXCJsb25nXCIsIHRydWUpLCAxKTtcbiAgICAgICAgLy8gb2Zmc2V0L3pvbmVcbiAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgY2FzZSBcIlpaXCI6XG4gICAgICAgICAgcmV0dXJuIG9mZnNldChuZXcgUmVnRXhwKGAoWystXSR7b25lT3JUd28uc291cmNlfSkoPzo6KCR7dHdvLnNvdXJjZX0pKT9gKSwgMik7XG4gICAgICAgIGNhc2UgXCJaWlpcIjpcbiAgICAgICAgICByZXR1cm4gb2Zmc2V0KG5ldyBSZWdFeHAoYChbKy1dJHtvbmVPclR3by5zb3VyY2V9KSgke3R3by5zb3VyY2V9KT9gKSwgMik7XG4gICAgICAgIC8vIHdlIGRvbid0IHN1cHBvcnQgWlpaWiAoUFNUKSBvciBaWlpaWiAoUGFjaWZpYyBTdGFuZGFyZCBUaW1lKSBpbiBwYXJzaW5nXG4gICAgICAgIC8vIGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhbnkgd2F5IHRvIGZpZ3VyZSBvdXQgd2hhdCB0aGV5IGFyZVxuICAgICAgICBjYXNlIFwielwiOlxuICAgICAgICAgIHJldHVybiBzaW1wbGUoL1thLXpfKy0vXXsxLDI1Nn0/L2kpO1xuICAgICAgICAvLyB0aGlzIHNwZWNpYWwtY2FzZSBcInRva2VuXCIgcmVwcmVzZW50cyBhIHBsYWNlIHdoZXJlIGEgbWFjcm8tdG9rZW4gZXhwYW5kZWQgaW50byBhIHdoaXRlLXNwYWNlIGxpdGVyYWxcbiAgICAgICAgLy8gaW4gdGhpcyBjYXNlIHdlIGFjY2VwdCBhbnkgbm9uLW5ld2xpbmUgd2hpdGUtc3BhY2VcbiAgICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgICByZXR1cm4gc2ltcGxlKC9bXlxcU1xcblxccl0vKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbGl0ZXJhbCh0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gIGNvbnN0IHVuaXQgPSB1bml0YXRlKHRva2VuKSB8fCB7XG4gICAgaW52YWxpZFJlYXNvbjogTUlTU0lOR19GVFAsXG4gIH07XG5cbiAgdW5pdC50b2tlbiA9IHRva2VuO1xuXG4gIHJldHVybiB1bml0O1xufVxuXG5jb25zdCBwYXJ0VHlwZVN0eWxlVG9Ub2tlblZhbCA9IHtcbiAgeWVhcjoge1xuICAgIFwiMi1kaWdpdFwiOiBcInl5XCIsXG4gICAgbnVtZXJpYzogXCJ5eXl5eVwiLFxuICB9LFxuICBtb250aDoge1xuICAgIG51bWVyaWM6IFwiTVwiLFxuICAgIFwiMi1kaWdpdFwiOiBcIk1NXCIsXG4gICAgc2hvcnQ6IFwiTU1NXCIsXG4gICAgbG9uZzogXCJNTU1NXCIsXG4gIH0sXG4gIGRheToge1xuICAgIG51bWVyaWM6IFwiZFwiLFxuICAgIFwiMi1kaWdpdFwiOiBcImRkXCIsXG4gIH0sXG4gIHdlZWtkYXk6IHtcbiAgICBzaG9ydDogXCJFRUVcIixcbiAgICBsb25nOiBcIkVFRUVcIixcbiAgfSxcbiAgZGF5cGVyaW9kOiBcImFcIixcbiAgZGF5UGVyaW9kOiBcImFcIixcbiAgaG91cjEyOiB7XG4gICAgbnVtZXJpYzogXCJoXCIsXG4gICAgXCIyLWRpZ2l0XCI6IFwiaGhcIixcbiAgfSxcbiAgaG91cjI0OiB7XG4gICAgbnVtZXJpYzogXCJIXCIsXG4gICAgXCIyLWRpZ2l0XCI6IFwiSEhcIixcbiAgfSxcbiAgbWludXRlOiB7XG4gICAgbnVtZXJpYzogXCJtXCIsXG4gICAgXCIyLWRpZ2l0XCI6IFwibW1cIixcbiAgfSxcbiAgc2Vjb25kOiB7XG4gICAgbnVtZXJpYzogXCJzXCIsXG4gICAgXCIyLWRpZ2l0XCI6IFwic3NcIixcbiAgfSxcbiAgdGltZVpvbmVOYW1lOiB7XG4gICAgbG9uZzogXCJaWlpaWlwiLFxuICAgIHNob3J0OiBcIlpaWlwiLFxuICB9LFxufTtcblxuZnVuY3Rpb24gdG9rZW5Gb3JQYXJ0KHBhcnQsIGZvcm1hdE9wdHMsIHJlc29sdmVkT3B0cykge1xuICBjb25zdCB7IHR5cGUsIHZhbHVlIH0gPSBwYXJ0O1xuXG4gIGlmICh0eXBlID09PSBcImxpdGVyYWxcIikge1xuICAgIGNvbnN0IGlzU3BhY2UgPSAvXlxccyskLy50ZXN0KHZhbHVlKTtcbiAgICByZXR1cm4ge1xuICAgICAgbGl0ZXJhbDogIWlzU3BhY2UsXG4gICAgICB2YWw6IGlzU3BhY2UgPyBcIiBcIiA6IHZhbHVlLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBzdHlsZSA9IGZvcm1hdE9wdHNbdHlwZV07XG5cbiAgLy8gVGhlIHVzZXIgbWlnaHQgaGF2ZSBleHBsaWNpdGx5IHNwZWNpZmllZCBob3VyMTIgb3IgaG91ckN5Y2xlXG4gIC8vIGlmIHNvLCByZXNwZWN0IHRoZWlyIGRlY2lzaW9uXG4gIC8vIGlmIG5vdCwgcmVmZXIgYmFjayB0byB0aGUgcmVzb2x2ZWRPcHRzLCB3aGljaCBhcmUgYmFzZWQgb24gdGhlIGxvY2FsZVxuICBsZXQgYWN0dWFsVHlwZSA9IHR5cGU7XG4gIGlmICh0eXBlID09PSBcImhvdXJcIikge1xuICAgIGlmIChmb3JtYXRPcHRzLmhvdXIxMiAhPSBudWxsKSB7XG4gICAgICBhY3R1YWxUeXBlID0gZm9ybWF0T3B0cy5ob3VyMTIgPyBcImhvdXIxMlwiIDogXCJob3VyMjRcIjtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdE9wdHMuaG91ckN5Y2xlICE9IG51bGwpIHtcbiAgICAgIGlmIChmb3JtYXRPcHRzLmhvdXJDeWNsZSA9PT0gXCJoMTFcIiB8fCBmb3JtYXRPcHRzLmhvdXJDeWNsZSA9PT0gXCJoMTJcIikge1xuICAgICAgICBhY3R1YWxUeXBlID0gXCJob3VyMTJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdHVhbFR5cGUgPSBcImhvdXIyNFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyB0b2tlbnMgb25seSBkaWZmZXJlbnRpYXRlIGJldHdlZW4gMjQgaG91cnMgb3Igbm90LFxuICAgICAgLy8gc28gd2UgZG8gbm90IG5lZWQgdG8gY2hlY2sgaG91ckN5Y2xlIGhlcmUsIHdoaWNoIGlzIGxlc3Mgc3VwcG9ydGVkIGFueXdheXNcbiAgICAgIGFjdHVhbFR5cGUgPSByZXNvbHZlZE9wdHMuaG91cjEyID8gXCJob3VyMTJcIiA6IFwiaG91cjI0XCI7XG4gICAgfVxuICB9XG4gIGxldCB2YWwgPSBwYXJ0VHlwZVN0eWxlVG9Ub2tlblZhbFthY3R1YWxUeXBlXTtcbiAgaWYgKHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICB2YWwgPSB2YWxbc3R5bGVdO1xuICB9XG5cbiAgaWYgKHZhbCkge1xuICAgIHJldHVybiB7XG4gICAgICBsaXRlcmFsOiBmYWxzZSxcbiAgICAgIHZhbCxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gYnVpbGRSZWdleCh1bml0cykge1xuICBjb25zdCByZSA9IHVuaXRzLm1hcCgodSkgPT4gdS5yZWdleCkucmVkdWNlKChmLCByKSA9PiBgJHtmfSgke3Iuc291cmNlfSlgLCBcIlwiKTtcbiAgcmV0dXJuIFtgXiR7cmV9JGAsIHVuaXRzXTtcbn1cblxuZnVuY3Rpb24gbWF0Y2goaW5wdXQsIHJlZ2V4LCBoYW5kbGVycykge1xuICBjb25zdCBtYXRjaGVzID0gaW5wdXQubWF0Y2gocmVnZXgpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgY29uc3QgYWxsID0ge307XG4gICAgbGV0IG1hdGNoSW5kZXggPSAxO1xuICAgIGZvciAoY29uc3QgaSBpbiBoYW5kbGVycykge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5KGhhbmRsZXJzLCBpKSkge1xuICAgICAgICBjb25zdCBoID0gaGFuZGxlcnNbaV0sXG4gICAgICAgICAgZ3JvdXBzID0gaC5ncm91cHMgPyBoLmdyb3VwcyArIDEgOiAxO1xuICAgICAgICBpZiAoIWgubGl0ZXJhbCAmJiBoLnRva2VuKSB7XG4gICAgICAgICAgYWxsW2gudG9rZW4udmFsWzBdXSA9IGguZGVzZXIobWF0Y2hlcy5zbGljZShtYXRjaEluZGV4LCBtYXRjaEluZGV4ICsgZ3JvdXBzKSk7XG4gICAgICAgIH1cbiAgICAgICAgbWF0Y2hJbmRleCArPSBncm91cHM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbbWF0Y2hlcywgYWxsXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW21hdGNoZXMsIHt9XTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkYXRlVGltZUZyb21NYXRjaGVzKG1hdGNoZXMpIHtcbiAgY29uc3QgdG9GaWVsZCA9ICh0b2tlbikgPT4ge1xuICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgIGNhc2UgXCJTXCI6XG4gICAgICAgIHJldHVybiBcIm1pbGxpc2Vjb25kXCI7XG4gICAgICBjYXNlIFwic1wiOlxuICAgICAgICByZXR1cm4gXCJzZWNvbmRcIjtcbiAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgIHJldHVybiBcIm1pbnV0ZVwiO1xuICAgICAgY2FzZSBcImhcIjpcbiAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgIHJldHVybiBcImhvdXJcIjtcbiAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgIHJldHVybiBcImRheVwiO1xuICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgcmV0dXJuIFwib3JkaW5hbFwiO1xuICAgICAgY2FzZSBcIkxcIjpcbiAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgIHJldHVybiBcIm1vbnRoXCI7XG4gICAgICBjYXNlIFwieVwiOlxuICAgICAgICByZXR1cm4gXCJ5ZWFyXCI7XG4gICAgICBjYXNlIFwiRVwiOlxuICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgcmV0dXJuIFwid2Vla2RheVwiO1xuICAgICAgY2FzZSBcIldcIjpcbiAgICAgICAgcmV0dXJuIFwid2Vla051bWJlclwiO1xuICAgICAgY2FzZSBcImtcIjpcbiAgICAgICAgcmV0dXJuIFwid2Vla1llYXJcIjtcbiAgICAgIGNhc2UgXCJxXCI6XG4gICAgICAgIHJldHVybiBcInF1YXJ0ZXJcIjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuICBsZXQgem9uZSA9IG51bGw7XG4gIGxldCBzcGVjaWZpY09mZnNldDtcbiAgaWYgKCFpc1VuZGVmaW5lZChtYXRjaGVzLnopKSB7XG4gICAgem9uZSA9IElBTkFab25lLmNyZWF0ZShtYXRjaGVzLnopO1xuICB9XG5cbiAgaWYgKCFpc1VuZGVmaW5lZChtYXRjaGVzLlopKSB7XG4gICAgaWYgKCF6b25lKSB7XG4gICAgICB6b25lID0gbmV3IEZpeGVkT2Zmc2V0Wm9uZShtYXRjaGVzLlopO1xuICAgIH1cbiAgICBzcGVjaWZpY09mZnNldCA9IG1hdGNoZXMuWjtcbiAgfVxuXG4gIGlmICghaXNVbmRlZmluZWQobWF0Y2hlcy5xKSkge1xuICAgIG1hdGNoZXMuTSA9IChtYXRjaGVzLnEgLSAxKSAqIDMgKyAxO1xuICB9XG5cbiAgaWYgKCFpc1VuZGVmaW5lZChtYXRjaGVzLmgpKSB7XG4gICAgaWYgKG1hdGNoZXMuaCA8IDEyICYmIG1hdGNoZXMuYSA9PT0gMSkge1xuICAgICAgbWF0Y2hlcy5oICs9IDEyO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hlcy5oID09PSAxMiAmJiBtYXRjaGVzLmEgPT09IDApIHtcbiAgICAgIG1hdGNoZXMuaCA9IDA7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1hdGNoZXMuRyA9PT0gMCAmJiBtYXRjaGVzLnkpIHtcbiAgICBtYXRjaGVzLnkgPSAtbWF0Y2hlcy55O1xuICB9XG5cbiAgaWYgKCFpc1VuZGVmaW5lZChtYXRjaGVzLnUpKSB7XG4gICAgbWF0Y2hlcy5TID0gcGFyc2VNaWxsaXMobWF0Y2hlcy51KTtcbiAgfVxuXG4gIGNvbnN0IHZhbHMgPSBPYmplY3Qua2V5cyhtYXRjaGVzKS5yZWR1Y2UoKHIsIGspID0+IHtcbiAgICBjb25zdCBmID0gdG9GaWVsZChrKTtcbiAgICBpZiAoZikge1xuICAgICAgcltmXSA9IG1hdGNoZXNba107XG4gICAgfVxuXG4gICAgcmV0dXJuIHI7XG4gIH0sIHt9KTtcblxuICByZXR1cm4gW3ZhbHMsIHpvbmUsIHNwZWNpZmljT2Zmc2V0XTtcbn1cblxubGV0IGR1bW15RGF0ZVRpbWVDYWNoZSA9IG51bGw7XG5cbmZ1bmN0aW9uIGdldER1bW15RGF0ZVRpbWUoKSB7XG4gIGlmICghZHVtbXlEYXRlVGltZUNhY2hlKSB7XG4gICAgZHVtbXlEYXRlVGltZUNhY2hlID0gRGF0ZVRpbWUuZnJvbU1pbGxpcygxNTU1NTU1NTU1NTU1KTtcbiAgfVxuXG4gIHJldHVybiBkdW1teURhdGVUaW1lQ2FjaGU7XG59XG5cbmZ1bmN0aW9uIG1heWJlRXhwYW5kTWFjcm9Ub2tlbih0b2tlbiwgbG9jYWxlKSB7XG4gIGlmICh0b2tlbi5saXRlcmFsKSB7XG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgY29uc3QgZm9ybWF0T3B0cyA9IEZvcm1hdHRlci5tYWNyb1Rva2VuVG9Gb3JtYXRPcHRzKHRva2VuLnZhbCk7XG4gIGNvbnN0IHRva2VucyA9IGZvcm1hdE9wdHNUb1Rva2Vucyhmb3JtYXRPcHRzLCBsb2NhbGUpO1xuXG4gIGlmICh0b2tlbnMgPT0gbnVsbCB8fCB0b2tlbnMuaW5jbHVkZXModW5kZWZpbmVkKSkge1xuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIHJldHVybiB0b2tlbnM7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZE1hY3JvVG9rZW5zKHRva2VucywgbG9jYWxlKSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0KC4uLnRva2Vucy5tYXAoKHQpID0+IG1heWJlRXhwYW5kTWFjcm9Ub2tlbih0LCBsb2NhbGUpKSk7XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBleHBsYWluRnJvbVRva2Vucyhsb2NhbGUsIGlucHV0LCBmb3JtYXQpIHtcbiAgY29uc3QgdG9rZW5zID0gZXhwYW5kTWFjcm9Ub2tlbnMoRm9ybWF0dGVyLnBhcnNlRm9ybWF0KGZvcm1hdCksIGxvY2FsZSksXG4gICAgdW5pdHMgPSB0b2tlbnMubWFwKCh0KSA9PiB1bml0Rm9yVG9rZW4odCwgbG9jYWxlKSksXG4gICAgZGlzcXVhbGlmeWluZ1VuaXQgPSB1bml0cy5maW5kKCh0KSA9PiB0LmludmFsaWRSZWFzb24pO1xuXG4gIGlmIChkaXNxdWFsaWZ5aW5nVW5pdCkge1xuICAgIHJldHVybiB7IGlucHV0LCB0b2tlbnMsIGludmFsaWRSZWFzb246IGRpc3F1YWxpZnlpbmdVbml0LmludmFsaWRSZWFzb24gfTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBbcmVnZXhTdHJpbmcsIGhhbmRsZXJzXSA9IGJ1aWxkUmVnZXgodW5pdHMpLFxuICAgICAgcmVnZXggPSBSZWdFeHAocmVnZXhTdHJpbmcsIFwiaVwiKSxcbiAgICAgIFtyYXdNYXRjaGVzLCBtYXRjaGVzXSA9IG1hdGNoKGlucHV0LCByZWdleCwgaGFuZGxlcnMpLFxuICAgICAgW3Jlc3VsdCwgem9uZSwgc3BlY2lmaWNPZmZzZXRdID0gbWF0Y2hlc1xuICAgICAgICA/IGRhdGVUaW1lRnJvbU1hdGNoZXMobWF0Y2hlcylcbiAgICAgICAgOiBbbnVsbCwgbnVsbCwgdW5kZWZpbmVkXTtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkobWF0Y2hlcywgXCJhXCIpICYmIGhhc093blByb3BlcnR5KG1hdGNoZXMsIFwiSFwiKSkge1xuICAgICAgdGhyb3cgbmV3IENvbmZsaWN0aW5nU3BlY2lmaWNhdGlvbkVycm9yKFxuICAgICAgICBcIkNhbid0IGluY2x1ZGUgbWVyaWRpZW0gd2hlbiBzcGVjaWZ5aW5nIDI0LWhvdXIgZm9ybWF0XCJcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB7IGlucHV0LCB0b2tlbnMsIHJlZ2V4LCByYXdNYXRjaGVzLCBtYXRjaGVzLCByZXN1bHQsIHpvbmUsIHNwZWNpZmljT2Zmc2V0IH07XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VGcm9tVG9rZW5zKGxvY2FsZSwgaW5wdXQsIGZvcm1hdCkge1xuICBjb25zdCB7IHJlc3VsdCwgem9uZSwgc3BlY2lmaWNPZmZzZXQsIGludmFsaWRSZWFzb24gfSA9IGV4cGxhaW5Gcm9tVG9rZW5zKGxvY2FsZSwgaW5wdXQsIGZvcm1hdCk7XG4gIHJldHVybiBbcmVzdWx0LCB6b25lLCBzcGVjaWZpY09mZnNldCwgaW52YWxpZFJlYXNvbl07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE9wdHNUb1Rva2Vucyhmb3JtYXRPcHRzLCBsb2NhbGUpIHtcbiAgaWYgKCFmb3JtYXRPcHRzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmb3JtYXR0ZXIgPSBGb3JtYXR0ZXIuY3JlYXRlKGxvY2FsZSwgZm9ybWF0T3B0cyk7XG4gIGNvbnN0IGRmID0gZm9ybWF0dGVyLmR0Rm9ybWF0dGVyKGdldER1bW15RGF0ZVRpbWUoKSk7XG4gIGNvbnN0IHBhcnRzID0gZGYuZm9ybWF0VG9QYXJ0cygpO1xuICBjb25zdCByZXNvbHZlZE9wdHMgPSBkZi5yZXNvbHZlZE9wdGlvbnMoKTtcbiAgcmV0dXJuIHBhcnRzLm1hcCgocCkgPT4gdG9rZW5Gb3JQYXJ0KHAsIGZvcm1hdE9wdHMsIHJlc29sdmVkT3B0cykpO1xufVxuXG5jb25zdCBJTlZBTElEID0gXCJJbnZhbGlkIERhdGVUaW1lXCI7XG5jb25zdCBNQVhfREFURSA9IDguNjRlMTU7XG5cbmZ1bmN0aW9uIHVuc3VwcG9ydGVkWm9uZSh6b25lKSB7XG4gIHJldHVybiBuZXcgSW52YWxpZChcInVuc3VwcG9ydGVkIHpvbmVcIiwgYHRoZSB6b25lIFwiJHt6b25lLm5hbWV9XCIgaXMgbm90IHN1cHBvcnRlZGApO1xufVxuXG4vLyB3ZSBjYWNoZSB3ZWVrIGRhdGEgb24gdGhlIERUIG9iamVjdCBhbmQgdGhpcyBpbnRlcm1lZGlhdGVzIHRoZSBjYWNoZVxuLyoqXG4gKiBAcGFyYW0ge0RhdGVUaW1lfSBkdFxuICovXG5mdW5jdGlvbiBwb3NzaWJseUNhY2hlZFdlZWtEYXRhKGR0KSB7XG4gIGlmIChkdC53ZWVrRGF0YSA9PT0gbnVsbCkge1xuICAgIGR0LndlZWtEYXRhID0gZ3JlZ29yaWFuVG9XZWVrKGR0LmMpO1xuICB9XG4gIHJldHVybiBkdC53ZWVrRGF0YTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RhdGVUaW1lfSBkdFxuICovXG5mdW5jdGlvbiBwb3NzaWJseUNhY2hlZExvY2FsV2Vla0RhdGEoZHQpIHtcbiAgaWYgKGR0LmxvY2FsV2Vla0RhdGEgPT09IG51bGwpIHtcbiAgICBkdC5sb2NhbFdlZWtEYXRhID0gZ3JlZ29yaWFuVG9XZWVrKFxuICAgICAgZHQuYyxcbiAgICAgIGR0LmxvYy5nZXRNaW5EYXlzSW5GaXJzdFdlZWsoKSxcbiAgICAgIGR0LmxvYy5nZXRTdGFydE9mV2VlaygpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gZHQubG9jYWxXZWVrRGF0YTtcbn1cblxuLy8gY2xvbmUgcmVhbGx5IG1lYW5zLCBcIm1ha2UgYSBuZXcgb2JqZWN0IHdpdGggdGhlc2UgbW9kaWZpY2F0aW9uc1wiLiBhbGwgXCJzZXR0ZXJzXCIgcmVhbGx5IHVzZSB0aGlzXG4vLyB0byBjcmVhdGUgYSBuZXcgb2JqZWN0IHdoaWxlIG9ubHkgY2hhbmdpbmcgc29tZSBvZiB0aGUgcHJvcGVydGllc1xuZnVuY3Rpb24gY2xvbmUoaW5zdCwgYWx0cykge1xuICBjb25zdCBjdXJyZW50ID0ge1xuICAgIHRzOiBpbnN0LnRzLFxuICAgIHpvbmU6IGluc3Quem9uZSxcbiAgICBjOiBpbnN0LmMsXG4gICAgbzogaW5zdC5vLFxuICAgIGxvYzogaW5zdC5sb2MsXG4gICAgaW52YWxpZDogaW5zdC5pbnZhbGlkLFxuICB9O1xuICByZXR1cm4gbmV3IERhdGVUaW1lKHsgLi4uY3VycmVudCwgLi4uYWx0cywgb2xkOiBjdXJyZW50IH0pO1xufVxuXG4vLyBmaW5kIHRoZSByaWdodCBvZmZzZXQgYSBnaXZlbiBsb2NhbCB0aW1lLiBUaGUgbyBpbnB1dCBpcyBvdXIgZ3Vlc3MsIHdoaWNoIGRldGVybWluZXMgd2hpY2hcbi8vIG9mZnNldCB3ZSdsbCBwaWNrIGluIGFtYmlndW91cyBjYXNlcyAoZS5nLiB0aGVyZSBhcmUgdHdvIDMgQU1zIGIvYyBGYWxsYmFjayBEU1QpXG5mdW5jdGlvbiBmaXhPZmZzZXQobG9jYWxUUywgbywgdHopIHtcbiAgLy8gT3VyIFVUQyB0aW1lIGlzIGp1c3QgYSBndWVzcyBiZWNhdXNlIG91ciBvZmZzZXQgaXMganVzdCBhIGd1ZXNzXG4gIGxldCB1dGNHdWVzcyA9IGxvY2FsVFMgLSBvICogNjAgKiAxMDAwO1xuXG4gIC8vIFRlc3Qgd2hldGhlciB0aGUgem9uZSBtYXRjaGVzIHRoZSBvZmZzZXQgZm9yIHRoaXMgdHNcbiAgY29uc3QgbzIgPSB0ei5vZmZzZXQodXRjR3Vlc3MpO1xuXG4gIC8vIElmIHNvLCBvZmZzZXQgZGlkbid0IGNoYW5nZSBhbmQgd2UncmUgZG9uZVxuICBpZiAobyA9PT0gbzIpIHtcbiAgICByZXR1cm4gW3V0Y0d1ZXNzLCBvXTtcbiAgfVxuXG4gIC8vIElmIG5vdCwgY2hhbmdlIHRoZSB0cyBieSB0aGUgZGlmZmVyZW5jZSBpbiB0aGUgb2Zmc2V0XG4gIHV0Y0d1ZXNzIC09IChvMiAtIG8pICogNjAgKiAxMDAwO1xuXG4gIC8vIElmIHRoYXQgZ2l2ZXMgdXMgdGhlIGxvY2FsIHRpbWUgd2Ugd2FudCwgd2UncmUgZG9uZVxuICBjb25zdCBvMyA9IHR6Lm9mZnNldCh1dGNHdWVzcyk7XG4gIGlmIChvMiA9PT0gbzMpIHtcbiAgICByZXR1cm4gW3V0Y0d1ZXNzLCBvMl07XG4gIH1cblxuICAvLyBJZiBpdCdzIGRpZmZlcmVudCwgd2UncmUgaW4gYSBob2xlIHRpbWUuIFRoZSBvZmZzZXQgaGFzIGNoYW5nZWQsIGJ1dCB0aGUgd2UgZG9uJ3QgYWRqdXN0IHRoZSB0aW1lXG4gIHJldHVybiBbbG9jYWxUUyAtIE1hdGgubWluKG8yLCBvMykgKiA2MCAqIDEwMDAsIE1hdGgubWF4KG8yLCBvMyldO1xufVxuXG4vLyBjb252ZXJ0IGFuIGVwb2NoIHRpbWVzdGFtcCBpbnRvIGEgY2FsZW5kYXIgb2JqZWN0IHdpdGggdGhlIGdpdmVuIG9mZnNldFxuZnVuY3Rpb24gdHNUb09iaih0cywgb2Zmc2V0KSB7XG4gIHRzICs9IG9mZnNldCAqIDYwICogMTAwMDtcblxuICBjb25zdCBkID0gbmV3IERhdGUodHMpO1xuXG4gIHJldHVybiB7XG4gICAgeWVhcjogZC5nZXRVVENGdWxsWWVhcigpLFxuICAgIG1vbnRoOiBkLmdldFVUQ01vbnRoKCkgKyAxLFxuICAgIGRheTogZC5nZXRVVENEYXRlKCksXG4gICAgaG91cjogZC5nZXRVVENIb3VycygpLFxuICAgIG1pbnV0ZTogZC5nZXRVVENNaW51dGVzKCksXG4gICAgc2Vjb25kOiBkLmdldFVUQ1NlY29uZHMoKSxcbiAgICBtaWxsaXNlY29uZDogZC5nZXRVVENNaWxsaXNlY29uZHMoKSxcbiAgfTtcbn1cblxuLy8gY29udmVydCBhIGNhbGVuZGFyIG9iamVjdCB0byBhIGVwb2NoIHRpbWVzdGFtcFxuZnVuY3Rpb24gb2JqVG9UUyhvYmosIG9mZnNldCwgem9uZSkge1xuICByZXR1cm4gZml4T2Zmc2V0KG9ialRvTG9jYWxUUyhvYmopLCBvZmZzZXQsIHpvbmUpO1xufVxuXG4vLyBjcmVhdGUgYSBuZXcgRFQgaW5zdGFuY2UgYnkgYWRkaW5nIGEgZHVyYXRpb24sIGFkanVzdGluZyBmb3IgRFNUc1xuZnVuY3Rpb24gYWRqdXN0VGltZShpbnN0LCBkdXIpIHtcbiAgY29uc3Qgb1ByZSA9IGluc3QubyxcbiAgICB5ZWFyID0gaW5zdC5jLnllYXIgKyBNYXRoLnRydW5jKGR1ci55ZWFycyksXG4gICAgbW9udGggPSBpbnN0LmMubW9udGggKyBNYXRoLnRydW5jKGR1ci5tb250aHMpICsgTWF0aC50cnVuYyhkdXIucXVhcnRlcnMpICogMyxcbiAgICBjID0ge1xuICAgICAgLi4uaW5zdC5jLFxuICAgICAgeWVhcixcbiAgICAgIG1vbnRoLFxuICAgICAgZGF5OlxuICAgICAgICBNYXRoLm1pbihpbnN0LmMuZGF5LCBkYXlzSW5Nb250aCh5ZWFyLCBtb250aCkpICtcbiAgICAgICAgTWF0aC50cnVuYyhkdXIuZGF5cykgK1xuICAgICAgICBNYXRoLnRydW5jKGR1ci53ZWVrcykgKiA3LFxuICAgIH0sXG4gICAgbWlsbGlzVG9BZGQgPSBEdXJhdGlvbi5mcm9tT2JqZWN0KHtcbiAgICAgIHllYXJzOiBkdXIueWVhcnMgLSBNYXRoLnRydW5jKGR1ci55ZWFycyksXG4gICAgICBxdWFydGVyczogZHVyLnF1YXJ0ZXJzIC0gTWF0aC50cnVuYyhkdXIucXVhcnRlcnMpLFxuICAgICAgbW9udGhzOiBkdXIubW9udGhzIC0gTWF0aC50cnVuYyhkdXIubW9udGhzKSxcbiAgICAgIHdlZWtzOiBkdXIud2Vla3MgLSBNYXRoLnRydW5jKGR1ci53ZWVrcyksXG4gICAgICBkYXlzOiBkdXIuZGF5cyAtIE1hdGgudHJ1bmMoZHVyLmRheXMpLFxuICAgICAgaG91cnM6IGR1ci5ob3VycyxcbiAgICAgIG1pbnV0ZXM6IGR1ci5taW51dGVzLFxuICAgICAgc2Vjb25kczogZHVyLnNlY29uZHMsXG4gICAgICBtaWxsaXNlY29uZHM6IGR1ci5taWxsaXNlY29uZHMsXG4gICAgfSkuYXMoXCJtaWxsaXNlY29uZHNcIiksXG4gICAgbG9jYWxUUyA9IG9ialRvTG9jYWxUUyhjKTtcblxuICBsZXQgW3RzLCBvXSA9IGZpeE9mZnNldChsb2NhbFRTLCBvUHJlLCBpbnN0LnpvbmUpO1xuXG4gIGlmIChtaWxsaXNUb0FkZCAhPT0gMCkge1xuICAgIHRzICs9IG1pbGxpc1RvQWRkO1xuICAgIC8vIHRoYXQgY291bGQgaGF2ZSBjaGFuZ2VkIHRoZSBvZmZzZXQgYnkgZ29pbmcgb3ZlciBhIERTVCwgYnV0IHdlIHdhbnQgdG8ga2VlcCB0aGUgdHMgdGhlIHNhbWVcbiAgICBvID0gaW5zdC56b25lLm9mZnNldCh0cyk7XG4gIH1cblxuICByZXR1cm4geyB0cywgbyB9O1xufVxuXG4vLyBoZWxwZXIgdXNlZnVsIGluIHR1cm5pbmcgdGhlIHJlc3VsdHMgb2YgcGFyc2luZyBpbnRvIHJlYWwgZGF0ZXNcbi8vIGJ5IGhhbmRsaW5nIHRoZSB6b25lIG9wdGlvbnNcbmZ1bmN0aW9uIHBhcnNlRGF0YVRvRGF0ZVRpbWUocGFyc2VkLCBwYXJzZWRab25lLCBvcHRzLCBmb3JtYXQsIHRleHQsIHNwZWNpZmljT2Zmc2V0KSB7XG4gIGNvbnN0IHsgc2V0Wm9uZSwgem9uZSB9ID0gb3B0cztcbiAgaWYgKChwYXJzZWQgJiYgT2JqZWN0LmtleXMocGFyc2VkKS5sZW5ndGggIT09IDApIHx8IHBhcnNlZFpvbmUpIHtcbiAgICBjb25zdCBpbnRlcnByZXRhdGlvblpvbmUgPSBwYXJzZWRab25lIHx8IHpvbmUsXG4gICAgICBpbnN0ID0gRGF0ZVRpbWUuZnJvbU9iamVjdChwYXJzZWQsIHtcbiAgICAgICAgLi4ub3B0cyxcbiAgICAgICAgem9uZTogaW50ZXJwcmV0YXRpb25ab25lLFxuICAgICAgICBzcGVjaWZpY09mZnNldCxcbiAgICAgIH0pO1xuICAgIHJldHVybiBzZXRab25lID8gaW5zdCA6IGluc3Quc2V0Wm9uZSh6b25lKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gRGF0ZVRpbWUuaW52YWxpZChcbiAgICAgIG5ldyBJbnZhbGlkKFwidW5wYXJzYWJsZVwiLCBgdGhlIGlucHV0IFwiJHt0ZXh0fVwiIGNhbid0IGJlIHBhcnNlZCBhcyAke2Zvcm1hdH1gKVxuICAgICk7XG4gIH1cbn1cblxuLy8gaWYgeW91IHdhbnQgdG8gb3V0cHV0IGEgdGVjaG5pY2FsIGZvcm1hdCAoZS5nLiBSRkMgMjgyMiksIHRoaXMgaGVscGVyXG4vLyBoZWxwcyBoYW5kbGUgdGhlIGRldGFpbHNcbmZ1bmN0aW9uIHRvVGVjaEZvcm1hdChkdCwgZm9ybWF0LCBhbGxvd1ogPSB0cnVlKSB7XG4gIHJldHVybiBkdC5pc1ZhbGlkXG4gICAgPyBGb3JtYXR0ZXIuY3JlYXRlKExvY2FsZS5jcmVhdGUoXCJlbi1VU1wiKSwge1xuICAgICAgICBhbGxvd1osXG4gICAgICAgIGZvcmNlU2ltcGxlOiB0cnVlLFxuICAgICAgfSkuZm9ybWF0RGF0ZVRpbWVGcm9tU3RyaW5nKGR0LCBmb3JtYXQpXG4gICAgOiBudWxsO1xufVxuXG5mdW5jdGlvbiB0b0lTT0RhdGUobywgZXh0ZW5kZWQpIHtcbiAgY29uc3QgbG9uZ0Zvcm1hdCA9IG8uYy55ZWFyID4gOTk5OSB8fCBvLmMueWVhciA8IDA7XG4gIGxldCBjID0gXCJcIjtcbiAgaWYgKGxvbmdGb3JtYXQgJiYgby5jLnllYXIgPj0gMCkgYyArPSBcIitcIjtcbiAgYyArPSBwYWRTdGFydChvLmMueWVhciwgbG9uZ0Zvcm1hdCA/IDYgOiA0KTtcblxuICBpZiAoZXh0ZW5kZWQpIHtcbiAgICBjICs9IFwiLVwiO1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLm1vbnRoKTtcbiAgICBjICs9IFwiLVwiO1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLmRheSk7XG4gIH0gZWxzZSB7XG4gICAgYyArPSBwYWRTdGFydChvLmMubW9udGgpO1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLmRheSk7XG4gIH1cbiAgcmV0dXJuIGM7XG59XG5cbmZ1bmN0aW9uIHRvSVNPVGltZShcbiAgbyxcbiAgZXh0ZW5kZWQsXG4gIHN1cHByZXNzU2Vjb25kcyxcbiAgc3VwcHJlc3NNaWxsaXNlY29uZHMsXG4gIGluY2x1ZGVPZmZzZXQsXG4gIGV4dGVuZGVkWm9uZVxuKSB7XG4gIGxldCBjID0gcGFkU3RhcnQoby5jLmhvdXIpO1xuICBpZiAoZXh0ZW5kZWQpIHtcbiAgICBjICs9IFwiOlwiO1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLm1pbnV0ZSk7XG4gICAgaWYgKG8uYy5taWxsaXNlY29uZCAhPT0gMCB8fCBvLmMuc2Vjb25kICE9PSAwIHx8ICFzdXBwcmVzc1NlY29uZHMpIHtcbiAgICAgIGMgKz0gXCI6XCI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLm1pbnV0ZSk7XG4gIH1cblxuICBpZiAoby5jLm1pbGxpc2Vjb25kICE9PSAwIHx8IG8uYy5zZWNvbmQgIT09IDAgfHwgIXN1cHByZXNzU2Vjb25kcykge1xuICAgIGMgKz0gcGFkU3RhcnQoby5jLnNlY29uZCk7XG5cbiAgICBpZiAoby5jLm1pbGxpc2Vjb25kICE9PSAwIHx8ICFzdXBwcmVzc01pbGxpc2Vjb25kcykge1xuICAgICAgYyArPSBcIi5cIjtcbiAgICAgIGMgKz0gcGFkU3RhcnQoby5jLm1pbGxpc2Vjb25kLCAzKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaW5jbHVkZU9mZnNldCkge1xuICAgIGlmIChvLmlzT2Zmc2V0Rml4ZWQgJiYgby5vZmZzZXQgPT09IDAgJiYgIWV4dGVuZGVkWm9uZSkge1xuICAgICAgYyArPSBcIlpcIjtcbiAgICB9IGVsc2UgaWYgKG8ubyA8IDApIHtcbiAgICAgIGMgKz0gXCItXCI7XG4gICAgICBjICs9IHBhZFN0YXJ0KE1hdGgudHJ1bmMoLW8ubyAvIDYwKSk7XG4gICAgICBjICs9IFwiOlwiO1xuICAgICAgYyArPSBwYWRTdGFydChNYXRoLnRydW5jKC1vLm8gJSA2MCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjICs9IFwiK1wiO1xuICAgICAgYyArPSBwYWRTdGFydChNYXRoLnRydW5jKG8ubyAvIDYwKSk7XG4gICAgICBjICs9IFwiOlwiO1xuICAgICAgYyArPSBwYWRTdGFydChNYXRoLnRydW5jKG8ubyAlIDYwKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4dGVuZGVkWm9uZSkge1xuICAgIGMgKz0gXCJbXCIgKyBvLnpvbmUuaWFuYU5hbWUgKyBcIl1cIjtcbiAgfVxuICByZXR1cm4gYztcbn1cblxuLy8gZGVmYXVsdHMgZm9yIHVuc3BlY2lmaWVkIHVuaXRzIGluIHRoZSBzdXBwb3J0ZWQgY2FsZW5kYXJzXG5jb25zdCBkZWZhdWx0VW5pdFZhbHVlcyA9IHtcbiAgICBtb250aDogMSxcbiAgICBkYXk6IDEsXG4gICAgaG91cjogMCxcbiAgICBtaW51dGU6IDAsXG4gICAgc2Vjb25kOiAwLFxuICAgIG1pbGxpc2Vjb25kOiAwLFxuICB9LFxuICBkZWZhdWx0V2Vla1VuaXRWYWx1ZXMgPSB7XG4gICAgd2Vla051bWJlcjogMSxcbiAgICB3ZWVrZGF5OiAxLFxuICAgIGhvdXI6IDAsXG4gICAgbWludXRlOiAwLFxuICAgIHNlY29uZDogMCxcbiAgICBtaWxsaXNlY29uZDogMCxcbiAgfSxcbiAgZGVmYXVsdE9yZGluYWxVbml0VmFsdWVzID0ge1xuICAgIG9yZGluYWw6IDEsXG4gICAgaG91cjogMCxcbiAgICBtaW51dGU6IDAsXG4gICAgc2Vjb25kOiAwLFxuICAgIG1pbGxpc2Vjb25kOiAwLFxuICB9O1xuXG4vLyBVbml0cyBpbiB0aGUgc3VwcG9ydGVkIGNhbGVuZGFycywgc29ydGVkIGJ5IGJpZ25lc3NcbmNvbnN0IG9yZGVyZWRVbml0cyA9IFtcInllYXJcIiwgXCJtb250aFwiLCBcImRheVwiLCBcImhvdXJcIiwgXCJtaW51dGVcIiwgXCJzZWNvbmRcIiwgXCJtaWxsaXNlY29uZFwiXSxcbiAgb3JkZXJlZFdlZWtVbml0cyA9IFtcbiAgICBcIndlZWtZZWFyXCIsXG4gICAgXCJ3ZWVrTnVtYmVyXCIsXG4gICAgXCJ3ZWVrZGF5XCIsXG4gICAgXCJob3VyXCIsXG4gICAgXCJtaW51dGVcIixcbiAgICBcInNlY29uZFwiLFxuICAgIFwibWlsbGlzZWNvbmRcIixcbiAgXSxcbiAgb3JkZXJlZE9yZGluYWxVbml0cyA9IFtcInllYXJcIiwgXCJvcmRpbmFsXCIsIFwiaG91clwiLCBcIm1pbnV0ZVwiLCBcInNlY29uZFwiLCBcIm1pbGxpc2Vjb25kXCJdO1xuXG4vLyBzdGFuZGFyZGl6ZSBjYXNlIGFuZCBwbHVyYWxpdHkgaW4gdW5pdHNcbmZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXQodW5pdCkge1xuICBjb25zdCBub3JtYWxpemVkID0ge1xuICAgIHllYXI6IFwieWVhclwiLFxuICAgIHllYXJzOiBcInllYXJcIixcbiAgICBtb250aDogXCJtb250aFwiLFxuICAgIG1vbnRoczogXCJtb250aFwiLFxuICAgIGRheTogXCJkYXlcIixcbiAgICBkYXlzOiBcImRheVwiLFxuICAgIGhvdXI6IFwiaG91clwiLFxuICAgIGhvdXJzOiBcImhvdXJcIixcbiAgICBtaW51dGU6IFwibWludXRlXCIsXG4gICAgbWludXRlczogXCJtaW51dGVcIixcbiAgICBxdWFydGVyOiBcInF1YXJ0ZXJcIixcbiAgICBxdWFydGVyczogXCJxdWFydGVyXCIsXG4gICAgc2Vjb25kOiBcInNlY29uZFwiLFxuICAgIHNlY29uZHM6IFwic2Vjb25kXCIsXG4gICAgbWlsbGlzZWNvbmQ6IFwibWlsbGlzZWNvbmRcIixcbiAgICBtaWxsaXNlY29uZHM6IFwibWlsbGlzZWNvbmRcIixcbiAgICB3ZWVrZGF5OiBcIndlZWtkYXlcIixcbiAgICB3ZWVrZGF5czogXCJ3ZWVrZGF5XCIsXG4gICAgd2Vla251bWJlcjogXCJ3ZWVrTnVtYmVyXCIsXG4gICAgd2Vla3NudW1iZXI6IFwid2Vla051bWJlclwiLFxuICAgIHdlZWtudW1iZXJzOiBcIndlZWtOdW1iZXJcIixcbiAgICB3ZWVreWVhcjogXCJ3ZWVrWWVhclwiLFxuICAgIHdlZWt5ZWFyczogXCJ3ZWVrWWVhclwiLFxuICAgIG9yZGluYWw6IFwib3JkaW5hbFwiLFxuICB9W3VuaXQudG9Mb3dlckNhc2UoKV07XG5cbiAgaWYgKCFub3JtYWxpemVkKSB0aHJvdyBuZXcgSW52YWxpZFVuaXRFcnJvcih1bml0KTtcblxuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVW5pdFdpdGhMb2NhbFdlZWtzKHVuaXQpIHtcbiAgc3dpdGNoICh1bml0LnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlIFwibG9jYWx3ZWVrZGF5XCI6XG4gICAgY2FzZSBcImxvY2Fsd2Vla2RheXNcIjpcbiAgICAgIHJldHVybiBcImxvY2FsV2Vla2RheVwiO1xuICAgIGNhc2UgXCJsb2NhbHdlZWtudW1iZXJcIjpcbiAgICBjYXNlIFwibG9jYWx3ZWVrbnVtYmVyc1wiOlxuICAgICAgcmV0dXJuIFwibG9jYWxXZWVrTnVtYmVyXCI7XG4gICAgY2FzZSBcImxvY2Fsd2Vla3llYXJcIjpcbiAgICBjYXNlIFwibG9jYWx3ZWVreWVhcnNcIjpcbiAgICAgIHJldHVybiBcImxvY2FsV2Vla1llYXJcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVVuaXQodW5pdCk7XG4gIH1cbn1cblxuLy8gdGhpcyBpcyBhIGR1bWJlZCBkb3duIHZlcnNpb24gb2YgZnJvbU9iamVjdCgpIHRoYXQgcnVucyBhYm91dCA2MCUgZmFzdGVyXG4vLyBidXQgZG9lc24ndCBkbyBhbnkgdmFsaWRhdGlvbiwgbWFrZXMgYSBidW5jaCBvZiBhc3N1bXB0aW9ucyBhYm91dCB3aGF0IHVuaXRzXG4vLyBhcmUgcHJlc2VudCwgYW5kIHNvIG9uLlxuZnVuY3Rpb24gcXVpY2tEVChvYmosIG9wdHMpIHtcbiAgY29uc3Qgem9uZSA9IG5vcm1hbGl6ZVpvbmUob3B0cy56b25lLCBTZXR0aW5ncy5kZWZhdWx0Wm9uZSksXG4gICAgbG9jID0gTG9jYWxlLmZyb21PYmplY3Qob3B0cyksXG4gICAgdHNOb3cgPSBTZXR0aW5ncy5ub3coKTtcblxuICBsZXQgdHMsIG87XG5cbiAgLy8gYXNzdW1lIHdlIGhhdmUgdGhlIGhpZ2hlci1vcmRlciB1bml0c1xuICBpZiAoIWlzVW5kZWZpbmVkKG9iai55ZWFyKSkge1xuICAgIGZvciAoY29uc3QgdSBvZiBvcmRlcmVkVW5pdHMpIHtcbiAgICAgIGlmIChpc1VuZGVmaW5lZChvYmpbdV0pKSB7XG4gICAgICAgIG9ialt1XSA9IGRlZmF1bHRVbml0VmFsdWVzW3VdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGludmFsaWQgPSBoYXNJbnZhbGlkR3JlZ29yaWFuRGF0YShvYmopIHx8IGhhc0ludmFsaWRUaW1lRGF0YShvYmopO1xuICAgIGlmIChpbnZhbGlkKSB7XG4gICAgICByZXR1cm4gRGF0ZVRpbWUuaW52YWxpZChpbnZhbGlkKTtcbiAgICB9XG5cbiAgICBjb25zdCBvZmZzZXRQcm92aXMgPSB6b25lLm9mZnNldCh0c05vdyk7XG4gICAgW3RzLCBvXSA9IG9ialRvVFMob2JqLCBvZmZzZXRQcm92aXMsIHpvbmUpO1xuICB9IGVsc2Uge1xuICAgIHRzID0gdHNOb3c7XG4gIH1cblxuICByZXR1cm4gbmV3IERhdGVUaW1lKHsgdHMsIHpvbmUsIGxvYywgbyB9KTtcbn1cblxuZnVuY3Rpb24gZGlmZlJlbGF0aXZlKHN0YXJ0LCBlbmQsIG9wdHMpIHtcbiAgY29uc3Qgcm91bmQgPSBpc1VuZGVmaW5lZChvcHRzLnJvdW5kKSA/IHRydWUgOiBvcHRzLnJvdW5kLFxuICAgIGZvcm1hdCA9IChjLCB1bml0KSA9PiB7XG4gICAgICBjID0gcm91bmRUbyhjLCByb3VuZCB8fCBvcHRzLmNhbGVuZGFyeSA/IDAgOiAyLCB0cnVlKTtcbiAgICAgIGNvbnN0IGZvcm1hdHRlciA9IGVuZC5sb2MuY2xvbmUob3B0cykucmVsRm9ybWF0dGVyKG9wdHMpO1xuICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQoYywgdW5pdCk7XG4gICAgfSxcbiAgICBkaWZmZXIgPSAodW5pdCkgPT4ge1xuICAgICAgaWYgKG9wdHMuY2FsZW5kYXJ5KSB7XG4gICAgICAgIGlmICghZW5kLmhhc1NhbWUoc3RhcnQsIHVuaXQpKSB7XG4gICAgICAgICAgcmV0dXJuIGVuZC5zdGFydE9mKHVuaXQpLmRpZmYoc3RhcnQuc3RhcnRPZih1bml0KSwgdW5pdCkuZ2V0KHVuaXQpO1xuICAgICAgICB9IGVsc2UgcmV0dXJuIDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW5kLmRpZmYoc3RhcnQsIHVuaXQpLmdldCh1bml0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gIGlmIChvcHRzLnVuaXQpIHtcbiAgICByZXR1cm4gZm9ybWF0KGRpZmZlcihvcHRzLnVuaXQpLCBvcHRzLnVuaXQpO1xuICB9XG5cbiAgZm9yIChjb25zdCB1bml0IG9mIG9wdHMudW5pdHMpIHtcbiAgICBjb25zdCBjb3VudCA9IGRpZmZlcih1bml0KTtcbiAgICBpZiAoTWF0aC5hYnMoY291bnQpID49IDEpIHtcbiAgICAgIHJldHVybiBmb3JtYXQoY291bnQsIHVuaXQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm9ybWF0KHN0YXJ0ID4gZW5kID8gLTAgOiAwLCBvcHRzLnVuaXRzW29wdHMudW5pdHMubGVuZ3RoIC0gMV0pO1xufVxuXG5mdW5jdGlvbiBsYXN0T3B0cyhhcmdMaXN0KSB7XG4gIGxldCBvcHRzID0ge30sXG4gICAgYXJncztcbiAgaWYgKGFyZ0xpc3QubGVuZ3RoID4gMCAmJiB0eXBlb2YgYXJnTGlzdFthcmdMaXN0Lmxlbmd0aCAtIDFdID09PSBcIm9iamVjdFwiKSB7XG4gICAgb3B0cyA9IGFyZ0xpc3RbYXJnTGlzdC5sZW5ndGggLSAxXTtcbiAgICBhcmdzID0gQXJyYXkuZnJvbShhcmdMaXN0KS5zbGljZSgwLCBhcmdMaXN0Lmxlbmd0aCAtIDEpO1xuICB9IGVsc2Uge1xuICAgIGFyZ3MgPSBBcnJheS5mcm9tKGFyZ0xpc3QpO1xuICB9XG4gIHJldHVybiBbb3B0cywgYXJnc107XG59XG5cbi8qKlxuICogQSBEYXRlVGltZSBpcyBhbiBpbW11dGFibGUgZGF0YSBzdHJ1Y3R1cmUgcmVwcmVzZW50aW5nIGEgc3BlY2lmaWMgZGF0ZSBhbmQgdGltZSBhbmQgYWNjb21wYW55aW5nIG1ldGhvZHMuIEl0IGNvbnRhaW5zIGNsYXNzIGFuZCBpbnN0YW5jZSBtZXRob2RzIGZvciBjcmVhdGluZywgcGFyc2luZywgaW50ZXJyb2dhdGluZywgdHJhbnNmb3JtaW5nLCBhbmQgZm9ybWF0dGluZyB0aGVtLlxuICpcbiAqIEEgRGF0ZVRpbWUgY29tcHJpc2VzIG9mOlxuICogKiBBIHRpbWVzdGFtcC4gRWFjaCBEYXRlVGltZSBpbnN0YW5jZSByZWZlcnMgdG8gYSBzcGVjaWZpYyBtaWxsaXNlY29uZCBvZiB0aGUgVW5peCBlcG9jaC5cbiAqICogQSB0aW1lIHpvbmUuIEVhY2ggaW5zdGFuY2UgaXMgY29uc2lkZXJlZCBpbiB0aGUgY29udGV4dCBvZiBhIHNwZWNpZmljIHpvbmUgKGJ5IGRlZmF1bHQgdGhlIGxvY2FsIHN5c3RlbSdzIHpvbmUpLlxuICogKiBDb25maWd1cmF0aW9uIHByb3BlcnRpZXMgdGhhdCBlZmZlY3QgaG93IG91dHB1dCBzdHJpbmdzIGFyZSBmb3JtYXR0ZWQsIHN1Y2ggYXMgYGxvY2FsZWAsIGBudW1iZXJpbmdTeXN0ZW1gLCBhbmQgYG91dHB1dENhbGVuZGFyYC5cbiAqXG4gKiBIZXJlIGlzIGEgYnJpZWYgb3ZlcnZpZXcgb2YgdGhlIG1vc3QgY29tbW9ubHkgdXNlZCBmdW5jdGlvbmFsaXR5IGl0IHByb3ZpZGVzOlxuICpcbiAqICogKipDcmVhdGlvbioqOiBUbyBjcmVhdGUgYSBEYXRlVGltZSBmcm9tIGl0cyBjb21wb25lbnRzLCB1c2Ugb25lIG9mIGl0cyBmYWN0b3J5IGNsYXNzIG1ldGhvZHM6IHtAbGluayBEYXRlVGltZS5sb2NhbH0sIHtAbGluayBEYXRlVGltZS51dGN9LCBhbmQgKG1vc3QgZmxleGlibHkpIHtAbGluayBEYXRlVGltZS5mcm9tT2JqZWN0fS4gVG8gY3JlYXRlIG9uZSBmcm9tIGEgc3RhbmRhcmQgc3RyaW5nIGZvcm1hdCwgdXNlIHtAbGluayBEYXRlVGltZS5mcm9tSVNPfSwge0BsaW5rIERhdGVUaW1lLmZyb21IVFRQfSwgYW5kIHtAbGluayBEYXRlVGltZS5mcm9tUkZDMjgyMn0uIFRvIGNyZWF0ZSBvbmUgZnJvbSBhIGN1c3RvbSBzdHJpbmcgZm9ybWF0LCB1c2Uge0BsaW5rIERhdGVUaW1lLmZyb21Gb3JtYXR9LiBUbyBjcmVhdGUgb25lIGZyb20gYSBuYXRpdmUgSlMgZGF0ZSwgdXNlIHtAbGluayBEYXRlVGltZS5mcm9tSlNEYXRlfS5cbiAqICogKipHcmVnb3JpYW4gY2FsZW5kYXIgYW5kIHRpbWUqKjogVG8gZXhhbWluZSB0aGUgR3JlZ29yaWFuIHByb3BlcnRpZXMgb2YgYSBEYXRlVGltZSBpbmRpdmlkdWFsbHkgKGkuZSBhcyBvcHBvc2VkIHRvIGNvbGxlY3RpdmVseSB0aHJvdWdoIHtAbGluayBEYXRlVGltZSN0b09iamVjdH0pLCB1c2UgdGhlIHtAbGluayBEYXRlVGltZSN5ZWFyfSwge0BsaW5rIERhdGVUaW1lI21vbnRofSxcbiAqIHtAbGluayBEYXRlVGltZSNkYXl9LCB7QGxpbmsgRGF0ZVRpbWUjaG91cn0sIHtAbGluayBEYXRlVGltZSNtaW51dGV9LCB7QGxpbmsgRGF0ZVRpbWUjc2Vjb25kfSwge0BsaW5rIERhdGVUaW1lI21pbGxpc2Vjb25kfSBhY2Nlc3NvcnMuXG4gKiAqICoqV2VlayBjYWxlbmRhcioqOiBGb3IgSVNPIHdlZWsgY2FsZW5kYXIgYXR0cmlidXRlcywgc2VlIHRoZSB7QGxpbmsgRGF0ZVRpbWUjd2Vla1llYXJ9LCB7QGxpbmsgRGF0ZVRpbWUjd2Vla051bWJlcn0sIGFuZCB7QGxpbmsgRGF0ZVRpbWUjd2Vla2RheX0gYWNjZXNzb3JzLlxuICogKiAqKkNvbmZpZ3VyYXRpb24qKiBTZWUgdGhlIHtAbGluayBEYXRlVGltZSNsb2NhbGV9IGFuZCB7QGxpbmsgRGF0ZVRpbWUjbnVtYmVyaW5nU3lzdGVtfSBhY2Nlc3NvcnMuXG4gKiAqICoqVHJhbnNmb3JtYXRpb24qKjogVG8gdHJhbnNmb3JtIHRoZSBEYXRlVGltZSBpbnRvIG90aGVyIERhdGVUaW1lcywgdXNlIHtAbGluayBEYXRlVGltZSNzZXR9LCB7QGxpbmsgRGF0ZVRpbWUjcmVjb25maWd1cmV9LCB7QGxpbmsgRGF0ZVRpbWUjc2V0Wm9uZX0sIHtAbGluayBEYXRlVGltZSNzZXRMb2NhbGV9LCB7QGxpbmsgRGF0ZVRpbWUucGx1c30sIHtAbGluayBEYXRlVGltZSNtaW51c30sIHtAbGluayBEYXRlVGltZSNlbmRPZn0sIHtAbGluayBEYXRlVGltZSNzdGFydE9mfSwge0BsaW5rIERhdGVUaW1lI3RvVVRDfSwgYW5kIHtAbGluayBEYXRlVGltZSN0b0xvY2FsfS5cbiAqICogKipPdXRwdXQqKjogVG8gY29udmVydCB0aGUgRGF0ZVRpbWUgdG8gb3RoZXIgcmVwcmVzZW50YXRpb25zLCB1c2UgdGhlIHtAbGluayBEYXRlVGltZSN0b1JlbGF0aXZlfSwge0BsaW5rIERhdGVUaW1lI3RvUmVsYXRpdmVDYWxlbmRhcn0sIHtAbGluayBEYXRlVGltZSN0b0pTT059LCB7QGxpbmsgRGF0ZVRpbWUjdG9JU099LCB7QGxpbmsgRGF0ZVRpbWUjdG9IVFRQfSwge0BsaW5rIERhdGVUaW1lI3RvT2JqZWN0fSwge0BsaW5rIERhdGVUaW1lI3RvUkZDMjgyMn0sIHtAbGluayBEYXRlVGltZSN0b1N0cmluZ30sIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30sIHtAbGluayBEYXRlVGltZSN0b0Zvcm1hdH0sIHtAbGluayBEYXRlVGltZSN0b01pbGxpc30gYW5kIHtAbGluayBEYXRlVGltZSN0b0pTRGF0ZX0uXG4gKlxuICogVGhlcmUncyBwbGVudHkgb3RoZXJzIGRvY3VtZW50ZWQgYmVsb3cuIEluIGFkZGl0aW9uLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBzdWJ0bGVyIHRvcGljcyBsaWtlIGludGVybmF0aW9uYWxpemF0aW9uLCB0aW1lIHpvbmVzLCBhbHRlcm5hdGl2ZSBjYWxlbmRhcnMsIHZhbGlkaXR5LCBhbmQgc28gb24sIHNlZSB0aGUgZXh0ZXJuYWwgZG9jdW1lbnRhdGlvbi5cbiAqL1xuY2xhc3MgRGF0ZVRpbWUge1xuICAvKipcbiAgICogQGFjY2VzcyBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBjb25zdCB6b25lID0gY29uZmlnLnpvbmUgfHwgU2V0dGluZ3MuZGVmYXVsdFpvbmU7XG5cbiAgICBsZXQgaW52YWxpZCA9XG4gICAgICBjb25maWcuaW52YWxpZCB8fFxuICAgICAgKE51bWJlci5pc05hTihjb25maWcudHMpID8gbmV3IEludmFsaWQoXCJpbnZhbGlkIGlucHV0XCIpIDogbnVsbCkgfHxcbiAgICAgICghem9uZS5pc1ZhbGlkID8gdW5zdXBwb3J0ZWRab25lKHpvbmUpIDogbnVsbCk7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy50cyA9IGlzVW5kZWZpbmVkKGNvbmZpZy50cykgPyBTZXR0aW5ncy5ub3coKSA6IGNvbmZpZy50cztcblxuICAgIGxldCBjID0gbnVsbCxcbiAgICAgIG8gPSBudWxsO1xuICAgIGlmICghaW52YWxpZCkge1xuICAgICAgY29uc3QgdW5jaGFuZ2VkID0gY29uZmlnLm9sZCAmJiBjb25maWcub2xkLnRzID09PSB0aGlzLnRzICYmIGNvbmZpZy5vbGQuem9uZS5lcXVhbHMoem9uZSk7XG5cbiAgICAgIGlmICh1bmNoYW5nZWQpIHtcbiAgICAgICAgW2MsIG9dID0gW2NvbmZpZy5vbGQuYywgY29uZmlnLm9sZC5vXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG90ID0gem9uZS5vZmZzZXQodGhpcy50cyk7XG4gICAgICAgIGMgPSB0c1RvT2JqKHRoaXMudHMsIG90KTtcbiAgICAgICAgaW52YWxpZCA9IE51bWJlci5pc05hTihjLnllYXIpID8gbmV3IEludmFsaWQoXCJpbnZhbGlkIGlucHV0XCIpIDogbnVsbDtcbiAgICAgICAgYyA9IGludmFsaWQgPyBudWxsIDogYztcbiAgICAgICAgbyA9IGludmFsaWQgPyBudWxsIDogb3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5fem9uZSA9IHpvbmU7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5sb2MgPSBjb25maWcubG9jIHx8IExvY2FsZS5jcmVhdGUoKTtcbiAgICAvKipcbiAgICAgKiBAYWNjZXNzIHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLmludmFsaWQgPSBpbnZhbGlkO1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMud2Vla0RhdGEgPSBudWxsO1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMubG9jYWxXZWVrRGF0YSA9IG51bGw7XG4gICAgLyoqXG4gICAgICogQGFjY2VzcyBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5jID0gYztcbiAgICAvKipcbiAgICAgKiBAYWNjZXNzIHByaXZhdGVcbiAgICAgKi9cbiAgICB0aGlzLm8gPSBvO1xuICAgIC8qKlxuICAgICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuaXNMdXhvbkRhdGVUaW1lID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIENPTlNUUlVDVFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEYXRlVGltZSBmb3IgdGhlIGN1cnJlbnQgaW5zdGFudCwgaW4gdGhlIHN5c3RlbSdzIHRpbWUgem9uZS5cbiAgICpcbiAgICogVXNlIFNldHRpbmdzIHRvIG92ZXJyaWRlIHRoZXNlIGRlZmF1bHQgdmFsdWVzIGlmIG5lZWRlZC5cbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9JU08oKSAvL34+IG5vdyBpbiB0aGUgSVNPIGZvcm1hdFxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlVGltZSh7fSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbG9jYWwgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt5ZWFyXSAtIFRoZSBjYWxlbmRhciB5ZWFyLiBJZiBvbWl0dGVkIChhcyBpbiwgY2FsbCBgbG9jYWwoKWAgd2l0aCBubyBhcmd1bWVudHMpLCB0aGUgY3VycmVudCB0aW1lIHdpbGwgYmUgdXNlZFxuICAgKiBAcGFyYW0ge251bWJlcn0gW21vbnRoPTFdIC0gVGhlIG1vbnRoLCAxLWluZGV4ZWRcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtkYXk9MV0gLSBUaGUgZGF5IG9mIHRoZSBtb250aCwgMS1pbmRleGVkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbaG91cj0wXSAtIFRoZSBob3VyIG9mIHRoZSBkYXksIGluIDI0LWhvdXIgdGltZVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21pbnV0ZT0wXSAtIFRoZSBtaW51dGUgb2YgdGhlIGhvdXIsIG1lYW5pbmcgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCA1OVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3NlY29uZD0wXSAtIFRoZSBzZWNvbmQgb2YgdGhlIG1pbnV0ZSwgbWVhbmluZyBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDU5XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWlsbGlzZWNvbmQ9MF0gLSBUaGUgbWlsbGlzZWNvbmQgb2YgdGhlIHNlY29uZCwgbWVhbmluZyBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDk5OVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfj4gbm93XG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKHsgem9uZTogXCJBbWVyaWNhL05ld19Zb3JrXCIgfSkgICAgICAvL34+IG5vdywgaW4gVVMgZWFzdCBjb2FzdCB0aW1lXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAxLTAxVDAwOjAwOjAwXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDMpICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAzLTAxVDAwOjAwOjAwXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDMsIDEyLCB7IGxvY2FsZTogXCJmclwiIH0pICAgICAvL34+IDIwMTctMDMtMTJUMDA6MDA6MDAsIHdpdGggYSBGcmVuY2ggbG9jYWxlXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDMsIDEyLCA1KSAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAzLTEyVDA1OjAwOjAwXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDMsIDEyLCA1LCB7IHpvbmU6IFwidXRjXCIgfSkgICAvL34+IDIwMTctMDMtMTJUMDU6MDA6MDAsIGluIFVUQ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAzLCAxMiwgNSwgNDUpICAgICAgICAgICAgICAgIC8vfj4gMjAxNy0wMy0xMlQwNTo0NTowMFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAzLCAxMiwgNSwgNDUsIDEwKSAgICAgICAgICAgIC8vfj4gMjAxNy0wMy0xMlQwNTo0NToxMFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAzLCAxMiwgNSwgNDUsIDEwLCA3NjUpICAgICAgIC8vfj4gMjAxNy0wMy0xMlQwNTo0NToxMC43NjVcbiAgICogQHJldHVybiB7RGF0ZVRpbWV9XG4gICAqL1xuICBzdGF0aWMgbG9jYWwoKSB7XG4gICAgY29uc3QgW29wdHMsIGFyZ3NdID0gbGFzdE9wdHMoYXJndW1lbnRzKSxcbiAgICAgIFt5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgbWlsbGlzZWNvbmRdID0gYXJncztcbiAgICByZXR1cm4gcXVpY2tEVCh7IHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZCB9LCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEYXRlVGltZSBpbiBVVENcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt5ZWFyXSAtIFRoZSBjYWxlbmRhciB5ZWFyLiBJZiBvbWl0dGVkIChhcyBpbiwgY2FsbCBgdXRjKClgIHdpdGggbm8gYXJndW1lbnRzKSwgdGhlIGN1cnJlbnQgdGltZSB3aWxsIGJlIHVzZWRcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttb250aD0xXSAtIFRoZSBtb250aCwgMS1pbmRleGVkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZGF5PTFdIC0gVGhlIGRheSBvZiB0aGUgbW9udGhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtob3VyPTBdIC0gVGhlIGhvdXIgb2YgdGhlIGRheSwgaW4gMjQtaG91ciB0aW1lXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWludXRlPTBdIC0gVGhlIG1pbnV0ZSBvZiB0aGUgaG91ciwgbWVhbmluZyBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDU5XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc2Vjb25kPTBdIC0gVGhlIHNlY29uZCBvZiB0aGUgbWludXRlLCBtZWFuaW5nIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgNTlcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttaWxsaXNlY29uZD0wXSAtIFRoZSBtaWxsaXNlY29uZCBvZiB0aGUgc2Vjb25kLCBtZWFuaW5nIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgOTk5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmxvY2FsZV0gLSBhIGxvY2FsZSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMub3V0cHV0Q2FsZW5kYXJdIC0gdGhlIG91dHB1dCBjYWxlbmRhciB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubnVtYmVyaW5nU3lzdGVtXSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfj4gbm93XG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygyMDE3KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfj4gMjAxNy0wMS0wMVQwMDowMDowMFpcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTcsIDMpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAzLTAxVDAwOjAwOjAwWlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMjAxNywgMywgMTIpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL34+IDIwMTctMDMtMTJUMDA6MDA6MDBaXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygyMDE3LCAzLCAxMiwgNSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vfj4gMjAxNy0wMy0xMlQwNTowMDowMFpcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTcsIDMsIDEyLCA1LCA0NSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAzLTEyVDA1OjQ1OjAwWlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMjAxNywgMywgMTIsIDUsIDQ1LCB7IGxvY2FsZTogXCJmclwiIH0pICAgICAgICAgIC8vfj4gMjAxNy0wMy0xMlQwNTo0NTowMFogd2l0aCBhIEZyZW5jaCBsb2NhbGVcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTcsIDMsIDEyLCA1LCA0NSwgMTApICAgICAgICAgICAgICAgICAgICAgICAgLy9+PiAyMDE3LTAzLTEyVDA1OjQ1OjEwWlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMjAxNywgMywgMTIsIDUsIDQ1LCAxMCwgNzY1LCB7IGxvY2FsZTogXCJmclwiIH0pIC8vfj4gMjAxNy0wMy0xMlQwNTo0NToxMC43NjVaIHdpdGggYSBGcmVuY2ggbG9jYWxlXG4gICAqIEByZXR1cm4ge0RhdGVUaW1lfVxuICAgKi9cbiAgc3RhdGljIHV0YygpIHtcbiAgICBjb25zdCBbb3B0cywgYXJnc10gPSBsYXN0T3B0cyhhcmd1bWVudHMpLFxuICAgICAgW3llYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF0gPSBhcmdzO1xuXG4gICAgb3B0cy56b25lID0gRml4ZWRPZmZzZXRab25lLnV0Y0luc3RhbmNlO1xuICAgIHJldHVybiBxdWlja0RUKHsgeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kIH0sIG9wdHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERhdGVUaW1lIGZyb20gYSBKYXZhU2NyaXB0IERhdGUgb2JqZWN0LiBVc2VzIHRoZSBkZWZhdWx0IHpvbmUuXG4gICAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSAtIGEgSmF2YVNjcmlwdCBEYXRlIG9iamVjdFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRpb25zLnpvbmU9J2xvY2FsJ10gLSB0aGUgem9uZSB0byBwbGFjZSB0aGUgRGF0ZVRpbWUgaW50b1xuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tSlNEYXRlKGRhdGUsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHRzID0gaXNEYXRlKGRhdGUpID8gZGF0ZS52YWx1ZU9mKCkgOiBOYU47XG4gICAgaWYgKE51bWJlci5pc05hTih0cykpIHtcbiAgICAgIHJldHVybiBEYXRlVGltZS5pbnZhbGlkKFwiaW52YWxpZCBpbnB1dFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB6b25lVG9Vc2UgPSBub3JtYWxpemVab25lKG9wdGlvbnMuem9uZSwgU2V0dGluZ3MuZGVmYXVsdFpvbmUpO1xuICAgIGlmICghem9uZVRvVXNlLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBEYXRlVGltZS5pbnZhbGlkKHVuc3VwcG9ydGVkWm9uZSh6b25lVG9Vc2UpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IERhdGVUaW1lKHtcbiAgICAgIHRzOiB0cyxcbiAgICAgIHpvbmU6IHpvbmVUb1VzZSxcbiAgICAgIGxvYzogTG9jYWxlLmZyb21PYmplY3Qob3B0aW9ucyksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRGF0ZVRpbWUgZnJvbSBhIG51bWJlciBvZiBtaWxsaXNlY29uZHMgc2luY2UgdGhlIGVwb2NoIChtZWFuaW5nIHNpbmNlIDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuIFVzZXMgdGhlIGRlZmF1bHQgem9uZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbGxpc2Vjb25kcyAtIGEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBzaW5jZSAxOTcwIFVUQ1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRpb25zLnpvbmU9J2xvY2FsJ10gLSB0aGUgem9uZSB0byBwbGFjZSB0aGUgRGF0ZVRpbWUgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubG9jYWxlXSAtIGEgbG9jYWxlIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm91dHB1dENhbGVuZGFyIC0gdGhlIG91dHB1dCBjYWxlbmRhciB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5udW1iZXJpbmdTeXN0ZW0gLSB0aGUgbnVtYmVyaW5nIHN5c3RlbSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tTWlsbGlzKG1pbGxpc2Vjb25kcywgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKCFpc051bWJlcihtaWxsaXNlY29uZHMpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXG4gICAgICAgIGBmcm9tTWlsbGlzIHJlcXVpcmVzIGEgbnVtZXJpY2FsIGlucHV0LCBidXQgcmVjZWl2ZWQgYSAke3R5cGVvZiBtaWxsaXNlY29uZHN9IHdpdGggdmFsdWUgJHttaWxsaXNlY29uZHN9YFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKG1pbGxpc2Vjb25kcyA8IC1NQVhfREFURSB8fCBtaWxsaXNlY29uZHMgPiBNQVhfREFURSkge1xuICAgICAgLy8gdGhpcyBpc24ndCBwZXJmZWN0IGJlY2F1c2UgYmVjYXVzZSB3ZSBjYW4gc3RpbGwgZW5kIHVwIG91dCBvZiByYW5nZSBiZWNhdXNlIG9mIGFkZGl0aW9uYWwgc2hpZnRpbmcsIGJ1dCBpdCdzIGEgc3RhcnRcbiAgICAgIHJldHVybiBEYXRlVGltZS5pbnZhbGlkKFwiVGltZXN0YW1wIG91dCBvZiByYW5nZVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlVGltZSh7XG4gICAgICAgIHRzOiBtaWxsaXNlY29uZHMsXG4gICAgICAgIHpvbmU6IG5vcm1hbGl6ZVpvbmUob3B0aW9ucy56b25lLCBTZXR0aW5ncy5kZWZhdWx0Wm9uZSksXG4gICAgICAgIGxvYzogTG9jYWxlLmZyb21PYmplY3Qob3B0aW9ucyksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRGF0ZVRpbWUgZnJvbSBhIG51bWJlciBvZiBzZWNvbmRzIHNpbmNlIHRoZSBlcG9jaCAobWVhbmluZyBzaW5jZSAxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLiBVc2VzIHRoZSBkZWZhdWx0IHpvbmUuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzZWNvbmRzIC0gYSBudW1iZXIgb2Ygc2Vjb25kcyBzaW5jZSAxOTcwIFVUQ1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRpb25zLnpvbmU9J2xvY2FsJ10gLSB0aGUgem9uZSB0byBwbGFjZSB0aGUgRGF0ZVRpbWUgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubG9jYWxlXSAtIGEgbG9jYWxlIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm91dHB1dENhbGVuZGFyIC0gdGhlIG91dHB1dCBjYWxlbmRhciB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5udW1iZXJpbmdTeXN0ZW0gLSB0aGUgbnVtYmVyaW5nIHN5c3RlbSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tU2Vjb25kcyhzZWNvbmRzLCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIWlzTnVtYmVyKHNlY29uZHMpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXCJmcm9tU2Vjb25kcyByZXF1aXJlcyBhIG51bWVyaWNhbCBpbnB1dFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlVGltZSh7XG4gICAgICAgIHRzOiBzZWNvbmRzICogMTAwMCxcbiAgICAgICAgem9uZTogbm9ybWFsaXplWm9uZShvcHRpb25zLnpvbmUsIFNldHRpbmdzLmRlZmF1bHRab25lKSxcbiAgICAgICAgbG9jOiBMb2NhbGUuZnJvbU9iamVjdChvcHRpb25zKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEYXRlVGltZSBmcm9tIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2l0aCBrZXlzIGxpa2UgJ3llYXInIGFuZCAnaG91cicgd2l0aCByZWFzb25hYmxlIGRlZmF1bHRzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gdGhlIG9iamVjdCB0byBjcmVhdGUgdGhlIERhdGVUaW1lIGZyb21cbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai55ZWFyIC0gYSB5ZWFyLCBzdWNoIGFzIDE5ODdcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5tb250aCAtIGEgbW9udGgsIDEtMTJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5kYXkgLSBhIGRheSBvZiB0aGUgbW9udGgsIDEtMzEsIGRlcGVuZGluZyBvbiB0aGUgbW9udGhcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5vcmRpbmFsIC0gZGF5IG9mIHRoZSB5ZWFyLCAxLTM2NSBvciAzNjZcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai53ZWVrWWVhciAtIGFuIElTTyB3ZWVrIHllYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai53ZWVrTnVtYmVyIC0gYW4gSVNPIHdlZWsgbnVtYmVyLCBiZXR3ZWVuIDEgYW5kIDUyIG9yIDUzLCBkZXBlbmRpbmcgb24gdGhlIHllYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai53ZWVrZGF5IC0gYW4gSVNPIHdlZWtkYXksIDEtNywgd2hlcmUgMSBpcyBNb25kYXkgYW5kIDcgaXMgU3VuZGF5XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvYmoubG9jYWxXZWVrWWVhciAtIGEgd2VlayB5ZWFyLCBhY2NvcmRpbmcgdG8gdGhlIGxvY2FsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gb2JqLmxvY2FsV2Vla051bWJlciAtIGEgd2VlayBudW1iZXIsIGJldHdlZW4gMSBhbmQgNTIgb3IgNTMsIGRlcGVuZGluZyBvbiB0aGUgeWVhciwgYWNjb3JkaW5nIHRvIHRoZSBsb2NhbGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5sb2NhbFdlZWtkYXkgLSBhIHdlZWtkYXksIDEtNywgd2hlcmUgMSBpcyB0aGUgZmlyc3QgYW5kIDcgaXMgdGhlIGxhc3QgZGF5IG9mIHRoZSB3ZWVrLCBhY2NvcmRpbmcgdG8gdGhlIGxvY2FsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gb2JqLmhvdXIgLSBob3VyIG9mIHRoZSBkYXksIDAtMjNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5taW51dGUgLSBtaW51dGUgb2YgdGhlIGhvdXIsIDAtNTlcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9iai5zZWNvbmQgLSBzZWNvbmQgb2YgdGhlIG1pbnV0ZSwgMC01OVxuICAgKiBAcGFyYW0ge251bWJlcn0gb2JqLm1pbGxpc2Vjb25kIC0gbWlsbGlzZWNvbmQgb2YgdGhlIHNlY29uZCwgMC05OTlcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zIGZvciBjcmVhdGluZyB0aGlzIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRzLnpvbmU9J2xvY2FsJ10gLSBpbnRlcnByZXQgdGhlIG51bWJlcnMgaW4gdGhlIGNvbnRleHQgb2YgYSBwYXJ0aWN1bGFyIHpvbmUuIENhbiB0YWtlIGFueSB2YWx1ZSB0YWtlbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gc2V0Wm9uZSgpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5sb2NhbGU9J3N5c3RlbVxcJ3MgbG9jYWxlJ10gLSBhIGxvY2FsZSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5vdXRwdXRDYWxlbmRhciAtIHRoZSBvdXRwdXQgY2FsZW5kYXIgdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMubnVtYmVyaW5nU3lzdGVtIC0gdGhlIG51bWJlcmluZyBzeXN0ZW0gdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbU9iamVjdCh7IHllYXI6IDE5ODIsIG1vbnRoOiA1LCBkYXk6IDI1fSkudG9JU09EYXRlKCkgLy89PiAnMTk4Mi0wNS0yNSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbU9iamVjdCh7IHllYXI6IDE5ODIgfSkudG9JU09EYXRlKCkgLy89PiAnMTk4Mi0wMS0wMSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbU9iamVjdCh7IGhvdXI6IDEwLCBtaW51dGU6IDI2LCBzZWNvbmQ6IDYgfSkgLy9+PiB0b2RheSBhdCAxMDoyNjowNlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tT2JqZWN0KHsgaG91cjogMTAsIG1pbnV0ZTogMjYsIHNlY29uZDogNiB9LCB7IHpvbmU6ICd1dGMnIH0pLFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tT2JqZWN0KHsgaG91cjogMTAsIG1pbnV0ZTogMjYsIHNlY29uZDogNiB9LCB7IHpvbmU6ICdsb2NhbCcgfSlcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbU9iamVjdCh7IGhvdXI6IDEwLCBtaW51dGU6IDI2LCBzZWNvbmQ6IDYgfSwgeyB6b25lOiAnQW1lcmljYS9OZXdfWW9yaycgfSlcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbU9iamVjdCh7IHdlZWtZZWFyOiAyMDE2LCB3ZWVrTnVtYmVyOiAyLCB3ZWVrZGF5OiAzIH0pLnRvSVNPRGF0ZSgpIC8vPT4gJzIwMTYtMDEtMTMnXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21PYmplY3QoeyBsb2NhbFdlZWtZZWFyOiAyMDIyLCBsb2NhbFdlZWtOdW1iZXI6IDEsIGxvY2FsV2Vla2RheTogMSB9LCB7IGxvY2FsZTogXCJlbi1VU1wiIH0pLnRvSVNPRGF0ZSgpIC8vPT4gJzIwMjEtMTItMjYnXG4gICAqIEByZXR1cm4ge0RhdGVUaW1lfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYmplY3Qob2JqLCBvcHRzID0ge30pIHtcbiAgICBvYmogPSBvYmogfHwge307XG4gICAgY29uc3Qgem9uZVRvVXNlID0gbm9ybWFsaXplWm9uZShvcHRzLnpvbmUsIFNldHRpbmdzLmRlZmF1bHRab25lKTtcbiAgICBpZiAoIXpvbmVUb1VzZS5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gRGF0ZVRpbWUuaW52YWxpZCh1bnN1cHBvcnRlZFpvbmUoem9uZVRvVXNlKSk7XG4gICAgfVxuXG4gICAgY29uc3QgbG9jID0gTG9jYWxlLmZyb21PYmplY3Qob3B0cyk7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZU9iamVjdChvYmosIG5vcm1hbGl6ZVVuaXRXaXRoTG9jYWxXZWVrcyk7XG4gICAgY29uc3QgeyBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrIH0gPSB1c2VzTG9jYWxXZWVrVmFsdWVzKG5vcm1hbGl6ZWQsIGxvYyk7XG5cbiAgICBjb25zdCB0c05vdyA9IFNldHRpbmdzLm5vdygpLFxuICAgICAgb2Zmc2V0UHJvdmlzID0gIWlzVW5kZWZpbmVkKG9wdHMuc3BlY2lmaWNPZmZzZXQpXG4gICAgICAgID8gb3B0cy5zcGVjaWZpY09mZnNldFxuICAgICAgICA6IHpvbmVUb1VzZS5vZmZzZXQodHNOb3cpLFxuICAgICAgY29udGFpbnNPcmRpbmFsID0gIWlzVW5kZWZpbmVkKG5vcm1hbGl6ZWQub3JkaW5hbCksXG4gICAgICBjb250YWluc0dyZWdvclllYXIgPSAhaXNVbmRlZmluZWQobm9ybWFsaXplZC55ZWFyKSxcbiAgICAgIGNvbnRhaW5zR3JlZ29yTUQgPSAhaXNVbmRlZmluZWQobm9ybWFsaXplZC5tb250aCkgfHwgIWlzVW5kZWZpbmVkKG5vcm1hbGl6ZWQuZGF5KSxcbiAgICAgIGNvbnRhaW5zR3JlZ29yID0gY29udGFpbnNHcmVnb3JZZWFyIHx8IGNvbnRhaW5zR3JlZ29yTUQsXG4gICAgICBkZWZpbml0ZVdlZWtEZWYgPSBub3JtYWxpemVkLndlZWtZZWFyIHx8IG5vcm1hbGl6ZWQud2Vla051bWJlcjtcblxuICAgIC8vIGNhc2VzOlxuICAgIC8vIGp1c3QgYSB3ZWVrZGF5IC0+IHRoaXMgd2VlaydzIGluc3RhbmNlIG9mIHRoYXQgd2Vla2RheSwgbm8gd29ycmllc1xuICAgIC8vIChncmVnb3JpYW4gZGF0YSBvciBvcmRpbmFsKSArICh3ZWVrWWVhciBvciB3ZWVrTnVtYmVyKSAtPiBlcnJvclxuICAgIC8vIChncmVnb3JpYW4gbW9udGggb3IgZGF5KSArIG9yZGluYWwgLT4gZXJyb3JcbiAgICAvLyBvdGhlcndpc2UganVzdCB1c2Ugd2Vla3Mgb3Igb3JkaW5hbHMgb3IgZ3JlZ29yaWFuLCBkZXBlbmRpbmcgb24gd2hhdCdzIHNwZWNpZmllZFxuXG4gICAgaWYgKChjb250YWluc0dyZWdvciB8fCBjb250YWluc09yZGluYWwpICYmIGRlZmluaXRlV2Vla0RlZikge1xuICAgICAgdGhyb3cgbmV3IENvbmZsaWN0aW5nU3BlY2lmaWNhdGlvbkVycm9yKFxuICAgICAgICBcIkNhbid0IG1peCB3ZWVrWWVhci93ZWVrTnVtYmVyIHVuaXRzIHdpdGggeWVhci9tb250aC9kYXkgb3Igb3JkaW5hbHNcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoY29udGFpbnNHcmVnb3JNRCAmJiBjb250YWluc09yZGluYWwpIHtcbiAgICAgIHRocm93IG5ldyBDb25mbGljdGluZ1NwZWNpZmljYXRpb25FcnJvcihcIkNhbid0IG1peCBvcmRpbmFsIGRhdGVzIHdpdGggbW9udGgvZGF5XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZVdlZWtEYXRhID0gZGVmaW5pdGVXZWVrRGVmIHx8IChub3JtYWxpemVkLndlZWtkYXkgJiYgIWNvbnRhaW5zR3JlZ29yKTtcblxuICAgIC8vIGNvbmZpZ3VyZSBvdXJzZWx2ZXMgdG8gZGVhbCB3aXRoIGdyZWdvcmlhbiBkYXRlcyBvciB3ZWVrIHN0dWZmXG4gICAgbGV0IHVuaXRzLFxuICAgICAgZGVmYXVsdFZhbHVlcyxcbiAgICAgIG9iak5vdyA9IHRzVG9PYmoodHNOb3csIG9mZnNldFByb3Zpcyk7XG4gICAgaWYgKHVzZVdlZWtEYXRhKSB7XG4gICAgICB1bml0cyA9IG9yZGVyZWRXZWVrVW5pdHM7XG4gICAgICBkZWZhdWx0VmFsdWVzID0gZGVmYXVsdFdlZWtVbml0VmFsdWVzO1xuICAgICAgb2JqTm93ID0gZ3JlZ29yaWFuVG9XZWVrKG9iak5vdywgbWluRGF5c0luRmlyc3RXZWVrLCBzdGFydE9mV2Vlayk7XG4gICAgfSBlbHNlIGlmIChjb250YWluc09yZGluYWwpIHtcbiAgICAgIHVuaXRzID0gb3JkZXJlZE9yZGluYWxVbml0cztcbiAgICAgIGRlZmF1bHRWYWx1ZXMgPSBkZWZhdWx0T3JkaW5hbFVuaXRWYWx1ZXM7XG4gICAgICBvYmpOb3cgPSBncmVnb3JpYW5Ub09yZGluYWwob2JqTm93KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdW5pdHMgPSBvcmRlcmVkVW5pdHM7XG4gICAgICBkZWZhdWx0VmFsdWVzID0gZGVmYXVsdFVuaXRWYWx1ZXM7XG4gICAgfVxuXG4gICAgLy8gc2V0IGRlZmF1bHQgdmFsdWVzIGZvciBtaXNzaW5nIHN0dWZmXG4gICAgbGV0IGZvdW5kRmlyc3QgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IHUgb2YgdW5pdHMpIHtcbiAgICAgIGNvbnN0IHYgPSBub3JtYWxpemVkW3VdO1xuICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2KSkge1xuICAgICAgICBmb3VuZEZpcnN0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZm91bmRGaXJzdCkge1xuICAgICAgICBub3JtYWxpemVkW3VdID0gZGVmYXVsdFZhbHVlc1t1XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vcm1hbGl6ZWRbdV0gPSBvYmpOb3dbdV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbWFrZSBzdXJlIHRoZSB2YWx1ZXMgd2UgaGF2ZSBhcmUgaW4gcmFuZ2VcbiAgICBjb25zdCBoaWdoZXJPcmRlckludmFsaWQgPSB1c2VXZWVrRGF0YVxuICAgICAgICA/IGhhc0ludmFsaWRXZWVrRGF0YShub3JtYWxpemVkLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKVxuICAgICAgICA6IGNvbnRhaW5zT3JkaW5hbFxuICAgICAgICA/IGhhc0ludmFsaWRPcmRpbmFsRGF0YShub3JtYWxpemVkKVxuICAgICAgICA6IGhhc0ludmFsaWRHcmVnb3JpYW5EYXRhKG5vcm1hbGl6ZWQpLFxuICAgICAgaW52YWxpZCA9IGhpZ2hlck9yZGVySW52YWxpZCB8fCBoYXNJbnZhbGlkVGltZURhdGEobm9ybWFsaXplZCk7XG5cbiAgICBpZiAoaW52YWxpZCkge1xuICAgICAgcmV0dXJuIERhdGVUaW1lLmludmFsaWQoaW52YWxpZCk7XG4gICAgfVxuXG4gICAgLy8gY29tcHV0ZSB0aGUgYWN0dWFsIHRpbWVcbiAgICBjb25zdCBncmVnb3JpYW4gPSB1c2VXZWVrRGF0YVxuICAgICAgICA/IHdlZWtUb0dyZWdvcmlhbihub3JtYWxpemVkLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKVxuICAgICAgICA6IGNvbnRhaW5zT3JkaW5hbFxuICAgICAgICA/IG9yZGluYWxUb0dyZWdvcmlhbihub3JtYWxpemVkKVxuICAgICAgICA6IG5vcm1hbGl6ZWQsXG4gICAgICBbdHNGaW5hbCwgb2Zmc2V0RmluYWxdID0gb2JqVG9UUyhncmVnb3JpYW4sIG9mZnNldFByb3Zpcywgem9uZVRvVXNlKSxcbiAgICAgIGluc3QgPSBuZXcgRGF0ZVRpbWUoe1xuICAgICAgICB0czogdHNGaW5hbCxcbiAgICAgICAgem9uZTogem9uZVRvVXNlLFxuICAgICAgICBvOiBvZmZzZXRGaW5hbCxcbiAgICAgICAgbG9jLFxuICAgICAgfSk7XG5cbiAgICAvLyBncmVnb3JpYW4gZGF0YSArIHdlZWtkYXkgc2VydmVzIG9ubHkgdG8gdmFsaWRhdGVcbiAgICBpZiAobm9ybWFsaXplZC53ZWVrZGF5ICYmIGNvbnRhaW5zR3JlZ29yICYmIG9iai53ZWVrZGF5ICE9PSBpbnN0LndlZWtkYXkpIHtcbiAgICAgIHJldHVybiBEYXRlVGltZS5pbnZhbGlkKFxuICAgICAgICBcIm1pc21hdGNoZWQgd2Vla2RheVwiLFxuICAgICAgICBgeW91IGNhbid0IHNwZWNpZnkgYm90aCBhIHdlZWtkYXkgb2YgJHtub3JtYWxpemVkLndlZWtkYXl9IGFuZCBhIGRhdGUgb2YgJHtpbnN0LnRvSVNPKCl9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEYXRlVGltZSBmcm9tIGFuIElTTyA4NjAxIHN0cmluZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIHRoZSBJU08gc3RyaW5nXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9ucyB0byBhZmZlY3QgdGhlIGNyZWF0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRzLnpvbmU9J2xvY2FsJ10gLSB1c2UgdGhpcyB6b25lIGlmIG5vIG9mZnNldCBpcyBzcGVjaWZpZWQgaW4gdGhlIGlucHV0IHN0cmluZyBpdHNlbGYuIFdpbGwgYWxzbyBjb252ZXJ0IHRoZSB0aW1lIHRvIHRoaXMgem9uZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnNldFpvbmU9ZmFsc2VdIC0gb3ZlcnJpZGUgdGhlIHpvbmUgd2l0aCBhIGZpeGVkLW9mZnNldCB6b25lIHNwZWNpZmllZCBpbiB0aGUgc3RyaW5nIGl0c2VsZiwgaWYgaXQgc3BlY2lmaWVzIG9uZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlPSdzeXN0ZW0ncyBsb2NhbGUnXSAtIGEgbG9jYWxlIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5vdXRwdXRDYWxlbmRhcl0gLSB0aGUgb3V0cHV0IGNhbGVuZGFyIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5udW1iZXJpbmdTeXN0ZW1dIC0gdGhlIG51bWJlcmluZyBzeXN0ZW0gdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbUlTTygnMjAxNi0wNS0yNVQwOTowODozNC4xMjMnKVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tSVNPKCcyMDE2LTA1LTI1VDA5OjA4OjM0LjEyMyswNjowMCcpXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21JU08oJzIwMTYtMDUtMjVUMDk6MDg6MzQuMTIzKzA2OjAwJywge3NldFpvbmU6IHRydWV9KVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tSVNPKCcyMDE2LTA1LTI1VDA5OjA4OjM0LjEyMycsIHt6b25lOiAndXRjJ30pXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21JU08oJzIwMTYtVzA1LTQnKVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tSVNPKHRleHQsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IFt2YWxzLCBwYXJzZWRab25lXSA9IHBhcnNlSVNPRGF0ZSh0ZXh0KTtcbiAgICByZXR1cm4gcGFyc2VEYXRhVG9EYXRlVGltZSh2YWxzLCBwYXJzZWRab25lLCBvcHRzLCBcIklTTyA4NjAxXCIsIHRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIERhdGVUaW1lIGZyb20gYW4gUkZDIDI4MjIgc3RyaW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gdGhlIFJGQyAyODIyIHN0cmluZ1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgdG8gYWZmZWN0IHRoZSBjcmVhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ3xab25lfSBbb3B0cy56b25lPSdsb2NhbCddIC0gY29udmVydCB0aGUgdGltZSB0byB0aGlzIHpvbmUuIFNpbmNlIHRoZSBvZmZzZXQgaXMgYWx3YXlzIHNwZWNpZmllZCBpbiB0aGUgc3RyaW5nIGl0c2VsZiwgdGhpcyBoYXMgbm8gZWZmZWN0IG9uIHRoZSBpbnRlcnByZXRhdGlvbiBvZiBzdHJpbmcsIG1lcmVseSB0aGUgem9uZSB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGlzIGV4cHJlc3NlZCBpbi5cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zZXRab25lPWZhbHNlXSAtIG92ZXJyaWRlIHRoZSB6b25lIHdpdGggYSBmaXhlZC1vZmZzZXQgem9uZSBzcGVjaWZpZWQgaW4gdGhlIHN0cmluZyBpdHNlbGYsIGlmIGl0IHNwZWNpZmllcyBvbmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nc3lzdGVtJ3MgbG9jYWxlJ10gLSBhIGxvY2FsZSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5vdXRwdXRDYWxlbmRhciAtIHRoZSBvdXRwdXQgY2FsZW5kYXIgdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMubnVtYmVyaW5nU3lzdGVtIC0gdGhlIG51bWJlcmluZyBzeXN0ZW0gdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbVJGQzI4MjIoJzI1IE5vdiAyMDE2IDEzOjIzOjEyIEdNVCcpXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21SRkMyODIyKCdGcmksIDI1IE5vdiAyMDE2IDEzOjIzOjEyICswNjAwJylcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbVJGQzI4MjIoJzI1IE5vdiAyMDE2IDEzOjIzIFonKVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tUkZDMjgyMih0ZXh0LCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBbdmFscywgcGFyc2VkWm9uZV0gPSBwYXJzZVJGQzI4MjJEYXRlKHRleHQpO1xuICAgIHJldHVybiBwYXJzZURhdGFUb0RhdGVUaW1lKHZhbHMsIHBhcnNlZFpvbmUsIG9wdHMsIFwiUkZDIDI4MjJcIiwgdGV4dCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRGF0ZVRpbWUgZnJvbSBhbiBIVFRQIGhlYWRlciBkYXRlXG4gICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1Byb3RvY29scy9yZmMyNjE2L3JmYzI2MTYtc2VjMy5odG1sI3NlYzMuMy4xXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gdGhlIEhUVFAgaGVhZGVyIGRhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zIHRvIGFmZmVjdCB0aGUgY3JlYXRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd8Wm9uZX0gW29wdHMuem9uZT0nbG9jYWwnXSAtIGNvbnZlcnQgdGhlIHRpbWUgdG8gdGhpcyB6b25lLiBTaW5jZSBIVFRQIGRhdGVzIGFyZSBhbHdheXMgaW4gVVRDLCB0aGlzIGhhcyBubyBlZmZlY3Qgb24gdGhlIGludGVycHJldGF0aW9uIG9mIHN0cmluZywgbWVyZWx5IHRoZSB6b25lIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaXMgZXhwcmVzc2VkIGluLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnNldFpvbmU9ZmFsc2VdIC0gb3ZlcnJpZGUgdGhlIHpvbmUgd2l0aCB0aGUgZml4ZWQtb2Zmc2V0IHpvbmUgc3BlY2lmaWVkIGluIHRoZSBzdHJpbmcuIEZvciBIVFRQIGRhdGVzLCB0aGlzIGlzIGFsd2F5cyBVVEMsIHNvIHRoaXMgb3B0aW9uIGlzIGVxdWl2YWxlbnQgdG8gc2V0dGluZyB0aGUgYHpvbmVgIG9wdGlvbiB0byAndXRjJywgYnV0IHRoaXMgb3B0aW9uIGlzIGluY2x1ZGVkIGZvciBjb25zaXN0ZW5jeSB3aXRoIHNpbWlsYXIgbWV0aG9kcy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nc3lzdGVtJ3MgbG9jYWxlJ10gLSBhIGxvY2FsZSB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5vdXRwdXRDYWxlbmRhciAtIHRoZSBvdXRwdXQgY2FsZW5kYXIgdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMubnVtYmVyaW5nU3lzdGVtIC0gdGhlIG51bWJlcmluZyBzeXN0ZW0gdG8gc2V0IG9uIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgaW5zdGFuY2VcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbUhUVFAoJ1N1biwgMDYgTm92IDE5OTQgMDg6NDk6MzcgR01UJylcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbUhUVFAoJ1N1bmRheSwgMDYtTm92LTk0IDA4OjQ5OjM3IEdNVCcpXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21IVFRQKCdTdW4gTm92ICA2IDA4OjQ5OjM3IDE5OTQnKVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tSFRUUCh0ZXh0LCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBbdmFscywgcGFyc2VkWm9uZV0gPSBwYXJzZUhUVFBEYXRlKHRleHQpO1xuICAgIHJldHVybiBwYXJzZURhdGFUb0RhdGVUaW1lKHZhbHMsIHBhcnNlZFpvbmUsIG9wdHMsIFwiSFRUUFwiLCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBEYXRlVGltZSBmcm9tIGFuIGlucHV0IHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZy5cbiAgICogRGVmYXVsdHMgdG8gZW4tVVMgaWYgbm8gbG9jYWxlIGhhcyBiZWVuIHNwZWNpZmllZCwgcmVnYXJkbGVzcyBvZiB0aGUgc3lzdGVtJ3MgbG9jYWxlLiBGb3IgYSB0YWJsZSBvZiB0b2tlbnMgYW5kIHRoZWlyIGludGVycHJldGF0aW9ucywgc2VlIFtoZXJlXShodHRwczovL21vbWVudC5naXRodWIuaW8vbHV4b24vIy9wYXJzaW5nP2lkPXRhYmxlLW9mLXRva2VucykuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gdGhlIHN0cmluZyB0byBwYXJzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm10IC0gdGhlIGZvcm1hdCB0aGUgc3RyaW5nIGlzIGV4cGVjdGVkIHRvIGJlIGluIChzZWUgdGhlIGxpbmsgYmVsb3cgZm9yIHRoZSBmb3JtYXRzKVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgdG8gYWZmZWN0IHRoZSBjcmVhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ3xab25lfSBbb3B0cy56b25lPSdsb2NhbCddIC0gdXNlIHRoaXMgem9uZSBpZiBubyBvZmZzZXQgaXMgc3BlY2lmaWVkIGluIHRoZSBpbnB1dCBzdHJpbmcgaXRzZWxmLiBXaWxsIGFsc28gY29udmVydCB0aGUgRGF0ZVRpbWUgdG8gdGhpcyB6b25lXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuc2V0Wm9uZT1mYWxzZV0gLSBvdmVycmlkZSB0aGUgem9uZSB3aXRoIGEgem9uZSBzcGVjaWZpZWQgaW4gdGhlIHN0cmluZyBpdHNlbGYsIGlmIGl0IHNwZWNpZmllcyBvbmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmxvY2FsZT0nZW4tVVMnXSAtIGEgbG9jYWxlIHN0cmluZyB0byB1c2Ugd2hlbiBwYXJzaW5nLiBXaWxsIGFsc28gc2V0IHRoZSBEYXRlVGltZSB0byB0aGlzIGxvY2FsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5udW1iZXJpbmdTeXN0ZW0gLSB0aGUgbnVtYmVyaW5nIHN5c3RlbSB0byB1c2Ugd2hlbiBwYXJzaW5nLiBXaWxsIGFsc28gc2V0IHRoZSByZXN1bHRpbmcgRGF0ZVRpbWUgdG8gdGhpcyBudW1iZXJpbmcgc3lzdGVtXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLm91dHB1dENhbGVuZGFyIC0gdGhlIG91dHB1dCBjYWxlbmRhciB0byBzZXQgb24gdGhlIHJlc3VsdGluZyBEYXRlVGltZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBmcm9tRm9ybWF0KHRleHQsIGZtdCwgb3B0cyA9IHt9KSB7XG4gICAgaWYgKGlzVW5kZWZpbmVkKHRleHQpIHx8IGlzVW5kZWZpbmVkKGZtdCkpIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnRFcnJvcihcImZyb21Gb3JtYXQgcmVxdWlyZXMgYW4gaW5wdXQgc3RyaW5nIGFuZCBhIGZvcm1hdFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGxvY2FsZSA9IG51bGwsIG51bWJlcmluZ1N5c3RlbSA9IG51bGwgfSA9IG9wdHMsXG4gICAgICBsb2NhbGVUb1VzZSA9IExvY2FsZS5mcm9tT3B0cyh7XG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgbnVtYmVyaW5nU3lzdGVtLFxuICAgICAgICBkZWZhdWx0VG9FTjogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgW3ZhbHMsIHBhcnNlZFpvbmUsIHNwZWNpZmljT2Zmc2V0LCBpbnZhbGlkXSA9IHBhcnNlRnJvbVRva2Vucyhsb2NhbGVUb1VzZSwgdGV4dCwgZm10KTtcbiAgICBpZiAoaW52YWxpZCkge1xuICAgICAgcmV0dXJuIERhdGVUaW1lLmludmFsaWQoaW52YWxpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJzZURhdGFUb0RhdGVUaW1lKHZhbHMsIHBhcnNlZFpvbmUsIG9wdHMsIGBmb3JtYXQgJHtmbXR9YCwgdGV4dCwgc3BlY2lmaWNPZmZzZXQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCB1c2UgZnJvbUZvcm1hdCBpbnN0ZWFkXG4gICAqL1xuICBzdGF0aWMgZnJvbVN0cmluZyh0ZXh0LCBmbXQsIG9wdHMgPSB7fSkge1xuICAgIHJldHVybiBEYXRlVGltZS5mcm9tRm9ybWF0KHRleHQsIGZtdCwgb3B0cyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgRGF0ZVRpbWUgZnJvbSBhIFNRTCBkYXRlLCB0aW1lLCBvciBkYXRldGltZVxuICAgKiBEZWZhdWx0cyB0byBlbi1VUyBpZiBubyBsb2NhbGUgaGFzIGJlZW4gc3BlY2lmaWVkLCByZWdhcmRsZXNzIG9mIHRoZSBzeXN0ZW0ncyBsb2NhbGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSB0aGUgc3RyaW5nIHRvIHBhcnNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9ucyB0byBhZmZlY3QgdGhlIGNyZWF0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfFpvbmV9IFtvcHRzLnpvbmU9J2xvY2FsJ10gLSB1c2UgdGhpcyB6b25lIGlmIG5vIG9mZnNldCBpcyBzcGVjaWZpZWQgaW4gdGhlIGlucHV0IHN0cmluZyBpdHNlbGYuIFdpbGwgYWxzbyBjb252ZXJ0IHRoZSBEYXRlVGltZSB0byB0aGlzIHpvbmVcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zZXRab25lPWZhbHNlXSAtIG92ZXJyaWRlIHRoZSB6b25lIHdpdGggYSB6b25lIHNwZWNpZmllZCBpbiB0aGUgc3RyaW5nIGl0c2VsZiwgaWYgaXQgc3BlY2lmaWVzIG9uZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMubG9jYWxlPSdlbi1VUyddIC0gYSBsb2NhbGUgc3RyaW5nIHRvIHVzZSB3aGVuIHBhcnNpbmcuIFdpbGwgYWxzbyBzZXQgdGhlIERhdGVUaW1lIHRvIHRoaXMgbG9jYWxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLm51bWJlcmluZ1N5c3RlbSAtIHRoZSBudW1iZXJpbmcgc3lzdGVtIHRvIHVzZSB3aGVuIHBhcnNpbmcuIFdpbGwgYWxzbyBzZXQgdGhlIHJlc3VsdGluZyBEYXRlVGltZSB0byB0aGlzIG51bWJlcmluZyBzeXN0ZW1cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMub3V0cHV0Q2FsZW5kYXIgLSB0aGUgb3V0cHV0IGNhbGVuZGFyIHRvIHNldCBvbiB0aGUgcmVzdWx0aW5nIERhdGVUaW1lIGluc3RhbmNlXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21TUUwoJzIwMTctMDUtMTUnKVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tU1FMKCcyMDE3LTA1LTE1IDA5OjEyOjM0JylcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbVNRTCgnMjAxNy0wNS0xNSAwOToxMjozNC4zNDInKVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tU1FMKCcyMDE3LTA1LTE1IDA5OjEyOjM0LjM0MiswNjowMCcpXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21TUUwoJzIwMTctMDUtMTUgMDk6MTI6MzQuMzQyIEFtZXJpY2EvTG9zX0FuZ2VsZXMnKVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5mcm9tU1FMKCcyMDE3LTA1LTE1IDA5OjEyOjM0LjM0MiBBbWVyaWNhL0xvc19BbmdlbGVzJywgeyBzZXRab25lOiB0cnVlIH0pXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmZyb21TUUwoJzIwMTctMDUtMTUgMDk6MTI6MzQuMzQyJywgeyB6b25lOiAnQW1lcmljYS9Mb3NfQW5nZWxlcycgfSlcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUuZnJvbVNRTCgnMDk6MTI6MzQuMzQyJylcbiAgICogQHJldHVybiB7RGF0ZVRpbWV9XG4gICAqL1xuICBzdGF0aWMgZnJvbVNRTCh0ZXh0LCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBbdmFscywgcGFyc2VkWm9uZV0gPSBwYXJzZVNRTCh0ZXh0KTtcbiAgICByZXR1cm4gcGFyc2VEYXRhVG9EYXRlVGltZSh2YWxzLCBwYXJzZWRab25lLCBvcHRzLCBcIlNRTFwiLCB0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gaW52YWxpZCBEYXRlVGltZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlYXNvbiAtIHNpbXBsZSBzdHJpbmcgb2Ygd2h5IHRoaXMgRGF0ZVRpbWUgaXMgaW52YWxpZC4gU2hvdWxkIG5vdCBjb250YWluIHBhcmFtZXRlcnMgb3IgYW55dGhpbmcgZWxzZSBkYXRhLWRlcGVuZGVudC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtleHBsYW5hdGlvbj1udWxsXSAtIGxvbmdlciBleHBsYW5hdGlvbiwgbWF5IGluY2x1ZGUgcGFyYW1ldGVycyBhbmQgb3RoZXIgdXNlZnVsIGRlYnVnZ2luZyBpbmZvcm1hdGlvblxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXRpYyBpbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24gPSBudWxsKSB7XG4gICAgaWYgKCFyZWFzb24pIHtcbiAgICAgIHRocm93IG5ldyBJbnZhbGlkQXJndW1lbnRFcnJvcihcIm5lZWQgdG8gc3BlY2lmeSBhIHJlYXNvbiB0aGUgRGF0ZVRpbWUgaXMgaW52YWxpZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZhbGlkID0gcmVhc29uIGluc3RhbmNlb2YgSW52YWxpZCA/IHJlYXNvbiA6IG5ldyBJbnZhbGlkKHJlYXNvbiwgZXhwbGFuYXRpb24pO1xuXG4gICAgaWYgKFNldHRpbmdzLnRocm93T25JbnZhbGlkKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZERhdGVUaW1lRXJyb3IoaW52YWxpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZVRpbWUoeyBpbnZhbGlkIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgYW4gaW5zdGFuY2Ugb2YgRGF0ZVRpbWUuIFdvcmtzIGFjcm9zcyBjb250ZXh0IGJvdW5kYXJpZXNcbiAgICogQHBhcmFtIHtvYmplY3R9IG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIHN0YXRpYyBpc0RhdGVUaW1lKG8pIHtcbiAgICByZXR1cm4gKG8gJiYgby5pc0x1eG9uRGF0ZVRpbWUpIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2R1Y2UgdGhlIGZvcm1hdCBzdHJpbmcgZm9yIGEgc2V0IG9mIG9wdGlvbnNcbiAgICogQHBhcmFtIGZvcm1hdE9wdHNcbiAgICogQHBhcmFtIGxvY2FsZU9wdHNcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIHN0YXRpYyBwYXJzZUZvcm1hdEZvck9wdHMoZm9ybWF0T3B0cywgbG9jYWxlT3B0cyA9IHt9KSB7XG4gICAgY29uc3QgdG9rZW5MaXN0ID0gZm9ybWF0T3B0c1RvVG9rZW5zKGZvcm1hdE9wdHMsIExvY2FsZS5mcm9tT2JqZWN0KGxvY2FsZU9wdHMpKTtcbiAgICByZXR1cm4gIXRva2VuTGlzdCA/IG51bGwgOiB0b2tlbkxpc3QubWFwKCh0KSA9PiAodCA/IHQudmFsIDogbnVsbCkpLmpvaW4oXCJcIik7XG4gIH1cblxuICAvKipcbiAgICogUHJvZHVjZSB0aGUgdGhlIGZ1bGx5IGV4cGFuZGVkIGZvcm1hdCB0b2tlbiBmb3IgdGhlIGxvY2FsZVxuICAgKiBEb2VzIE5PVCBxdW90ZSBjaGFyYWN0ZXJzLCBzbyBxdW90ZWQgdG9rZW5zIHdpbGwgbm90IHJvdW5kIHRyaXAgY29ycmVjdGx5XG4gICAqIEBwYXJhbSBmbXRcbiAgICogQHBhcmFtIGxvY2FsZU9wdHNcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIHN0YXRpYyBleHBhbmRGb3JtYXQoZm10LCBsb2NhbGVPcHRzID0ge30pIHtcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZE1hY3JvVG9rZW5zKEZvcm1hdHRlci5wYXJzZUZvcm1hdChmbXQpLCBMb2NhbGUuZnJvbU9iamVjdChsb2NhbGVPcHRzKSk7XG4gICAgcmV0dXJuIGV4cGFuZGVkLm1hcCgodCkgPT4gdC52YWwpLmpvaW4oXCJcIik7XG4gIH1cblxuICAvLyBJTkZPXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdmFsdWUgb2YgdW5pdC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuaXQgLSBhIHVuaXQgc3VjaCBhcyAnbWludXRlJyBvciAnZGF5J1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA3LCA0KS5nZXQoJ21vbnRoJyk7IC8vPT4gN1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA3LCA0KS5nZXQoJ2RheScpOyAvLz0+IDRcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0KHVuaXQpIHtcbiAgICByZXR1cm4gdGhpc1t1bml0XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIERhdGVUaW1lIGlzIHZhbGlkLiBJbnZhbGlkIERhdGVUaW1lcyBvY2N1ciB3aGVuOlxuICAgKiAqIFRoZSBEYXRlVGltZSB3YXMgY3JlYXRlZCBmcm9tIGludmFsaWQgY2FsZW5kYXIgaW5mb3JtYXRpb24sIHN1Y2ggYXMgdGhlIDEzdGggbW9udGggb3IgRmVicnVhcnkgMzBcbiAgICogKiBUaGUgRGF0ZVRpbWUgd2FzIGNyZWF0ZWQgYnkgYW4gb3BlcmF0aW9uIG9uIGFub3RoZXIgaW52YWxpZCBkYXRlXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52YWxpZCA9PT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGVycm9yIGNvZGUgaWYgdGhpcyBEYXRlVGltZSBpcyBpbnZhbGlkLCBvciBudWxsIGlmIHRoZSBEYXRlVGltZSBpcyB2YWxpZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IGludmFsaWRSZWFzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52YWxpZCA/IHRoaXMuaW52YWxpZC5yZWFzb24gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gZXhwbGFuYXRpb24gb2Ygd2h5IHRoaXMgRGF0ZVRpbWUgYmVjYW1lIGludmFsaWQsIG9yIG51bGwgaWYgdGhlIERhdGVUaW1lIGlzIHZhbGlkXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgaW52YWxpZEV4cGxhbmF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmludmFsaWQgPyB0aGlzLmludmFsaWQuZXhwbGFuYXRpb24gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbG9jYWxlIG9mIGEgRGF0ZVRpbWUsIHN1Y2ggJ2VuLUdCJy4gVGhlIGxvY2FsZSBpcyB1c2VkIHdoZW4gZm9ybWF0dGluZyB0aGUgRGF0ZVRpbWVcbiAgICpcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBsb2NhbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMubG9jLmxvY2FsZSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXJpbmcgc3lzdGVtIG9mIGEgRGF0ZVRpbWUsIHN1Y2ggJ2JlbmcnLiBUaGUgbnVtYmVyaW5nIHN5c3RlbSBpcyB1c2VkIHdoZW4gZm9ybWF0dGluZyB0aGUgRGF0ZVRpbWVcbiAgICpcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBudW1iZXJpbmdTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMubG9jLm51bWJlcmluZ1N5c3RlbSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvdXRwdXQgY2FsZW5kYXIgb2YgYSBEYXRlVGltZSwgc3VjaCAnaXNsYW1pYycuIFRoZSBvdXRwdXQgY2FsZW5kYXIgaXMgdXNlZCB3aGVuIGZvcm1hdHRpbmcgdGhlIERhdGVUaW1lXG4gICAqXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgb3V0cHV0Q2FsZW5kYXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMubG9jLm91dHB1dENhbGVuZGFyIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRpbWUgem9uZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBEYXRlVGltZS5cbiAgICogQHR5cGUge1pvbmV9XG4gICAqL1xuICBnZXQgem9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fem9uZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5hbWUgb2YgdGhlIHRpbWUgem9uZS5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCB6b25lTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gdGhpcy56b25lLm5hbWUgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgeWVhclxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkueWVhciAvLz0+IDIwMTdcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCB5ZWFyKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLmMueWVhciA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHF1YXJ0ZXJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNywgNSwgMjUpLnF1YXJ0ZXIgLy89PiAyXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgcXVhcnRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gTWF0aC5jZWlsKHRoaXMuYy5tb250aCAvIDMpIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbW9udGggKDEtMTIpLlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkubW9udGggLy89PiA1XG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbW9udGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuYy5tb250aCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRheSBvZiB0aGUgbW9udGggKDEtMzBpc2gpLlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkuZGF5IC8vPT4gMjVcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBkYXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuYy5kYXkgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBob3VyIG9mIHRoZSBkYXkgKDAtMjMpLlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSwgOSkuaG91ciAvLz0+IDlcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBob3VyKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLmMuaG91ciA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1pbnV0ZSBvZiB0aGUgaG91ciAoMC01OSkuXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDUsIDI1LCA5LCAzMCkubWludXRlIC8vPT4gMzBcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBtaW51dGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuYy5taW51dGUgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZWNvbmQgb2YgdGhlIG1pbnV0ZSAoMC01OSkuXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTcsIDUsIDI1LCA5LCAzMCwgNTIpLnNlY29uZCAvLz0+IDUyXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgc2Vjb25kKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLmMuc2Vjb25kIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWlsbGlzZWNvbmQgb2YgdGhlIHNlY29uZCAoMC05OTkpLlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSwgOSwgMzAsIDUyLCA2NTQpLm1pbGxpc2Vjb25kIC8vPT4gNjU0XG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbWlsbGlzZWNvbmQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuYy5taWxsaXNlY29uZCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdlZWsgeWVhclxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGVcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMTIsIDMxKS53ZWVrWWVhciAvLz0+IDIwMTVcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCB3ZWVrWWVhcigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gcG9zc2libHlDYWNoZWRXZWVrRGF0YSh0aGlzKS53ZWVrWWVhciA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdlZWsgbnVtYmVyIG9mIHRoZSB3ZWVrIHllYXIgKDEtNTJpc2gpLlxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGVcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNywgNSwgMjUpLndlZWtOdW1iZXIgLy89PiAyMVxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHdlZWtOdW1iZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHBvc3NpYmx5Q2FjaGVkV2Vla0RhdGEodGhpcykud2Vla051bWJlciA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRheSBvZiB0aGUgd2Vlay5cbiAgICogMSBpcyBNb25kYXkgYW5kIDcgaXMgU3VuZGF5XG4gICAqIEBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE0LCAxMSwgMzEpLndlZWtkYXkgLy89PiA0XG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgd2Vla2RheSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gcG9zc2libHlDYWNoZWRXZWVrRGF0YSh0aGlzKS53ZWVrZGF5IDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGlzIGRhdGUgaXMgb24gYSB3ZWVrZW5kIGFjY29yZGluZyB0byB0aGUgbG9jYWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBnZXQgaXNXZWVrZW5kKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgJiYgdGhpcy5sb2MuZ2V0V2Vla2VuZERheXMoKS5pbmNsdWRlcyh0aGlzLndlZWtkYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGF5IG9mIHRoZSB3ZWVrIGFjY29yZGluZyB0byB0aGUgbG9jYWxlLlxuICAgKiAxIGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsgYW5kIDcgaXMgdGhlIGxhc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgKiBJZiB0aGUgbG9jYWxlIGFzc2lnbnMgU3VuZGF5IGFzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWssIHRoZW4gYSBkYXRlIHdoaWNoIGlzIGEgU3VuZGF5IHdpbGwgcmV0dXJuIDEsXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbG9jYWxXZWVrZGF5KCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyBwb3NzaWJseUNhY2hlZExvY2FsV2Vla0RhdGEodGhpcykud2Vla2RheSA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdlZWsgbnVtYmVyIG9mIHRoZSB3ZWVrIHllYXIgYWNjb3JkaW5nIHRvIHRoZSBsb2NhbGUuIERpZmZlcmVudCBsb2NhbGVzIGFzc2lnbiB3ZWVrIG51bWJlcnMgZGlmZmVyZW50bHksXG4gICAqIGJlY2F1c2UgdGhlIHdlZWsgY2FuIHN0YXJ0IG9uIGRpZmZlcmVudCBkYXlzIG9mIHRoZSB3ZWVrIChzZWUgbG9jYWxXZWVrZGF5KSBhbmQgYmVjYXVzZSBhIGRpZmZlcmVudCBudW1iZXIgb2YgZGF5c1xuICAgKiBpcyByZXF1aXJlZCBmb3IgYSB3ZWVrIHRvIGNvdW50IGFzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgeWVhci5cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGdldCBsb2NhbFdlZWtOdW1iZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHBvc3NpYmx5Q2FjaGVkTG9jYWxXZWVrRGF0YSh0aGlzKS53ZWVrTnVtYmVyIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgd2VlayB5ZWFyIGFjY29yZGluZyB0byB0aGUgbG9jYWxlLiBEaWZmZXJlbnQgbG9jYWxlcyBhc3NpZ24gd2VlayBudW1iZXJzIChhbmQgdGhlcmVmb3Igd2VlayB5ZWFycylcbiAgICogZGlmZmVyZW50bHksIHNlZSBsb2NhbFdlZWtOdW1iZXIuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgbG9jYWxXZWVrWWVhcigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gcG9zc2libHlDYWNoZWRMb2NhbFdlZWtEYXRhKHRoaXMpLndlZWtZZWFyIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgb3JkaW5hbCAobWVhbmluZyB0aGUgZGF5IG9mIHRoZSB5ZWFyKVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkub3JkaW5hbCAvLz0+IDE0NVxuICAgKiBAdHlwZSB7bnVtYmVyfERhdGVUaW1lfVxuICAgKi9cbiAgZ2V0IG9yZGluYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IGdyZWdvcmlhblRvT3JkaW5hbCh0aGlzLmMpLm9yZGluYWwgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBodW1hbiByZWFkYWJsZSBzaG9ydCBtb250aCBuYW1lLCBzdWNoIGFzICdPY3QnLlxuICAgKiBEZWZhdWx0cyB0byB0aGUgc3lzdGVtJ3MgbG9jYWxlIGlmIG5vIGxvY2FsZSBoYXMgYmVlbiBzcGVjaWZpZWRcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNywgMTAsIDMwKS5tb250aFNob3J0IC8vPT4gT2N0XG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgbW9udGhTaG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gSW5mby5tb250aHMoXCJzaG9ydFwiLCB7IGxvY09iajogdGhpcy5sb2MgfSlbdGhpcy5tb250aCAtIDFdIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGh1bWFuIHJlYWRhYmxlIGxvbmcgbW9udGggbmFtZSwgc3VjaCBhcyAnT2N0b2JlcicuXG4gICAqIERlZmF1bHRzIHRvIHRoZSBzeXN0ZW0ncyBsb2NhbGUgaWYgbm8gbG9jYWxlIGhhcyBiZWVuIHNwZWNpZmllZFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAxMCwgMzApLm1vbnRoTG9uZyAvLz0+IE9jdG9iZXJcbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIGdldCBtb250aExvbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IEluZm8ubW9udGhzKFwibG9uZ1wiLCB7IGxvY09iajogdGhpcy5sb2MgfSlbdGhpcy5tb250aCAtIDFdIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGh1bWFuIHJlYWRhYmxlIHNob3J0IHdlZWtkYXksIHN1Y2ggYXMgJ01vbicuXG4gICAqIERlZmF1bHRzIHRvIHRoZSBzeXN0ZW0ncyBsb2NhbGUgaWYgbm8gbG9jYWxlIGhhcyBiZWVuIHNwZWNpZmllZFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAxMCwgMzApLndlZWtkYXlTaG9ydCAvLz0+IE1vblxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IHdlZWtkYXlTaG9ydCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gSW5mby53ZWVrZGF5cyhcInNob3J0XCIsIHsgbG9jT2JqOiB0aGlzLmxvYyB9KVt0aGlzLndlZWtkYXkgLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBodW1hbiByZWFkYWJsZSBsb25nIHdlZWtkYXksIHN1Y2ggYXMgJ01vbmRheScuXG4gICAqIERlZmF1bHRzIHRvIHRoZSBzeXN0ZW0ncyBsb2NhbGUgaWYgbm8gbG9jYWxlIGhhcyBiZWVuIHNwZWNpZmllZFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCAxMCwgMzApLndlZWtkYXlMb25nIC8vPT4gTW9uZGF5XG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgd2Vla2RheUxvbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IEluZm8ud2Vla2RheXMoXCJsb25nXCIsIHsgbG9jT2JqOiB0aGlzLmxvYyB9KVt0aGlzLndlZWtkYXkgLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBVVEMgb2Zmc2V0IG9mIHRoaXMgRGF0ZVRpbWUgaW4gbWludXRlc1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5vZmZzZXQgLy89PiAtMjQwXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygpLm9mZnNldCAvLz0+IDBcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCBvZmZzZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/ICt0aGlzLm8gOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzaG9ydCBodW1hbiBuYW1lIGZvciB0aGUgem9uZSdzIGN1cnJlbnQgb2Zmc2V0LCBmb3IgZXhhbXBsZSBcIkVTVFwiIG9yIFwiRURUXCIuXG4gICAqIERlZmF1bHRzIHRvIHRoZSBzeXN0ZW0ncyBsb2NhbGUgaWYgbm8gbG9jYWxlIGhhcyBiZWVuIHNwZWNpZmllZFxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgZ2V0IG9mZnNldE5hbWVTaG9ydCgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gdGhpcy56b25lLm9mZnNldE5hbWUodGhpcy50cywge1xuICAgICAgICBmb3JtYXQ6IFwic2hvcnRcIixcbiAgICAgICAgbG9jYWxlOiB0aGlzLmxvY2FsZSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsb25nIGh1bWFuIG5hbWUgZm9yIHRoZSB6b25lJ3MgY3VycmVudCBvZmZzZXQsIGZvciBleGFtcGxlIFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCIgb3IgXCJFYXN0ZXJuIERheWxpZ2h0IFRpbWVcIi5cbiAgICogRGVmYXVsdHMgdG8gdGhlIHN5c3RlbSdzIGxvY2FsZSBpZiBubyBsb2NhbGUgaGFzIGJlZW4gc3BlY2lmaWVkXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICBnZXQgb2Zmc2V0TmFtZUxvbmcoKSB7XG4gICAgaWYgKHRoaXMuaXNWYWxpZCkge1xuICAgICAgcmV0dXJuIHRoaXMuem9uZS5vZmZzZXROYW1lKHRoaXMudHMsIHtcbiAgICAgICAgZm9ybWF0OiBcImxvbmdcIixcbiAgICAgICAgbG9jYWxlOiB0aGlzLmxvY2FsZSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhpcyB6b25lJ3Mgb2Zmc2V0IGV2ZXIgY2hhbmdlcywgYXMgaW4gYSBEU1QuXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGlzT2Zmc2V0Rml4ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHRoaXMuem9uZS5pc1VuaXZlcnNhbCA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhlIERhdGVUaW1lIGlzIGluIGEgRFNULlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIGdldCBpc0luRFNUKCkge1xuICAgIGlmICh0aGlzLmlzT2Zmc2V0Rml4ZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy5vZmZzZXQgPiB0aGlzLnNldCh7IG1vbnRoOiAxLCBkYXk6IDEgfSkub2Zmc2V0IHx8XG4gICAgICAgIHRoaXMub2Zmc2V0ID4gdGhpcy5zZXQoeyBtb250aDogNSB9KS5vZmZzZXRcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aG9zZSBEYXRlVGltZXMgd2hpY2ggaGF2ZSB0aGUgc2FtZSBsb2NhbCB0aW1lIGFzIHRoaXMgRGF0ZVRpbWUsIGJ1dCBhIGRpZmZlcmVudCBvZmZzZXQgZnJvbSBVVENcbiAgICogaW4gdGhpcyBEYXRlVGltZSdzIHpvbmUuIER1cmluZyBEU1QgY2hhbmdlcyBsb2NhbCB0aW1lIGNhbiBiZSBhbWJpZ3VvdXMsIGZvciBleGFtcGxlXG4gICAqIGAyMDIzLTEwLTI5VDAyOjMwOjAwYCBpbiBgRXVyb3BlL0JlcmxpbmAgY2FuIGhhdmUgb2Zmc2V0IGArMDE6MDBgIG9yIGArMDI6MDBgLlxuICAgKiBUaGlzIG1ldGhvZCB3aWxsIHJldHVybiBib3RoIHBvc3NpYmxlIERhdGVUaW1lcyBpZiB0aGlzIERhdGVUaW1lJ3MgbG9jYWwgdGltZSBpcyBhbWJpZ3VvdXMuXG4gICAqIEByZXR1cm5zIHtEYXRlVGltZVtdfVxuICAgKi9cbiAgZ2V0UG9zc2libGVPZmZzZXRzKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkIHx8IHRoaXMuaXNPZmZzZXRGaXhlZCkge1xuICAgICAgcmV0dXJuIFt0aGlzXTtcbiAgICB9XG4gICAgY29uc3QgZGF5TXMgPSA4NjQwMDAwMDtcbiAgICBjb25zdCBtaW51dGVNcyA9IDYwMDAwO1xuICAgIGNvbnN0IGxvY2FsVFMgPSBvYmpUb0xvY2FsVFModGhpcy5jKTtcbiAgICBjb25zdCBvRWFybGllciA9IHRoaXMuem9uZS5vZmZzZXQobG9jYWxUUyAtIGRheU1zKTtcbiAgICBjb25zdCBvTGF0ZXIgPSB0aGlzLnpvbmUub2Zmc2V0KGxvY2FsVFMgKyBkYXlNcyk7XG5cbiAgICBjb25zdCBvMSA9IHRoaXMuem9uZS5vZmZzZXQobG9jYWxUUyAtIG9FYXJsaWVyICogbWludXRlTXMpO1xuICAgIGNvbnN0IG8yID0gdGhpcy56b25lLm9mZnNldChsb2NhbFRTIC0gb0xhdGVyICogbWludXRlTXMpO1xuICAgIGlmIChvMSA9PT0gbzIpIHtcbiAgICAgIHJldHVybiBbdGhpc107XG4gICAgfVxuICAgIGNvbnN0IHRzMSA9IGxvY2FsVFMgLSBvMSAqIG1pbnV0ZU1zO1xuICAgIGNvbnN0IHRzMiA9IGxvY2FsVFMgLSBvMiAqIG1pbnV0ZU1zO1xuICAgIGNvbnN0IGMxID0gdHNUb09iaih0czEsIG8xKTtcbiAgICBjb25zdCBjMiA9IHRzVG9PYmoodHMyLCBvMik7XG4gICAgaWYgKFxuICAgICAgYzEuaG91ciA9PT0gYzIuaG91ciAmJlxuICAgICAgYzEubWludXRlID09PSBjMi5taW51dGUgJiZcbiAgICAgIGMxLnNlY29uZCA9PT0gYzIuc2Vjb25kICYmXG4gICAgICBjMS5taWxsaXNlY29uZCA9PT0gYzIubWlsbGlzZWNvbmRcbiAgICApIHtcbiAgICAgIHJldHVybiBbY2xvbmUodGhpcywgeyB0czogdHMxIH0pLCBjbG9uZSh0aGlzLCB7IHRzOiB0czIgfSldO1xuICAgIH1cbiAgICByZXR1cm4gW3RoaXNdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGlzIERhdGVUaW1lIGlzIGluIGEgbGVhcCB5ZWFyLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNikuaXNJbkxlYXBZZWFyIC8vPT4gdHJ1ZVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDEzKS5pc0luTGVhcFllYXIgLy89PiBmYWxzZVxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIGdldCBpc0luTGVhcFllYXIoKSB7XG4gICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZGF5cyBpbiB0aGlzIERhdGVUaW1lJ3MgbW9udGhcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNiwgMikuZGF5c0luTW9udGggLy89PiAyOVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE2LCAzKS5kYXlzSW5Nb250aCAvLz0+IDMxXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgZGF5c0luTW9udGgoKSB7XG4gICAgcmV0dXJuIGRheXNJbk1vbnRoKHRoaXMueWVhciwgdGhpcy5tb250aCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGRheXMgaW4gdGhpcyBEYXRlVGltZSdzIHllYXJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNikuZGF5c0luWWVhciAvLz0+IDM2NlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDEzKS5kYXlzSW5ZZWFyIC8vPT4gMzY1XG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgZGF5c0luWWVhcigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gZGF5c0luWWVhcih0aGlzLnllYXIpIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiB3ZWVrcyBpbiB0aGlzIERhdGVUaW1lJ3MgeWVhclxuICAgKiBAc2VlIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGVcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAwNCkud2Vla3NJbldlZWtZZWFyIC8vPT4gNTNcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxMykud2Vla3NJbldlZWtZZWFyIC8vPT4gNTJcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIGdldCB3ZWVrc0luV2Vla1llYXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCA/IHdlZWtzSW5XZWVrWWVhcih0aGlzLndlZWtZZWFyKSA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2Ygd2Vla3MgaW4gdGhpcyBEYXRlVGltZSdzIGxvY2FsIHdlZWsgeWVhclxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDIwLCA2LCB7bG9jYWxlOiAnZW4tVVMnfSkud2Vla3NJbkxvY2FsV2Vla1llYXIgLy89PiA1MlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDIwLCA2LCB7bG9jYWxlOiAnZGUtREUnfSkud2Vla3NJbkxvY2FsV2Vla1llYXIgLy89PiA1M1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0IHdlZWtzSW5Mb2NhbFdlZWtZZWFyKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWRcbiAgICAgID8gd2Vla3NJbldlZWtZZWFyKFxuICAgICAgICAgIHRoaXMubG9jYWxXZWVrWWVhcixcbiAgICAgICAgICB0aGlzLmxvYy5nZXRNaW5EYXlzSW5GaXJzdFdlZWsoKSxcbiAgICAgICAgICB0aGlzLmxvYy5nZXRTdGFydE9mV2VlaygpXG4gICAgICAgIClcbiAgICAgIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHJlc29sdmVkIEludGwgb3B0aW9ucyBmb3IgdGhpcyBEYXRlVGltZS5cbiAgICogVGhpcyBpcyB1c2VmdWwgaW4gdW5kZXJzdGFuZGluZyB0aGUgYmVoYXZpb3Igb2YgZm9ybWF0dGluZyBtZXRob2RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gdGhlIHNhbWUgb3B0aW9ucyBhcyB0b0xvY2FsZVN0cmluZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICByZXNvbHZlZExvY2FsZU9wdGlvbnMob3B0cyA9IHt9KSB7XG4gICAgY29uc3QgeyBsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgY2FsZW5kYXIgfSA9IEZvcm1hdHRlci5jcmVhdGUoXG4gICAgICB0aGlzLmxvYy5jbG9uZShvcHRzKSxcbiAgICAgIG9wdHNcbiAgICApLnJlc29sdmVkT3B0aW9ucyh0aGlzKTtcbiAgICByZXR1cm4geyBsb2NhbGUsIG51bWJlcmluZ1N5c3RlbSwgb3V0cHV0Q2FsZW5kYXI6IGNhbGVuZGFyIH07XG4gIH1cblxuICAvLyBUUkFOU0ZPUk1cblxuICAvKipcbiAgICogXCJTZXRcIiB0aGUgRGF0ZVRpbWUncyB6b25lIHRvIFVUQy4gUmV0dXJucyBhIG5ld2x5LWNvbnN0cnVjdGVkIERhdGVUaW1lLlxuICAgKlxuICAgKiBFcXVpdmFsZW50IHRvIHtAbGluayBEYXRlVGltZSNzZXRab25lfSgndXRjJylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvZmZzZXQ9MF0gLSBvcHRpb25hbGx5LCBhbiBvZmZzZXQgZnJvbSBVVEMgaW4gbWludXRlc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdHM9e31dIC0gb3B0aW9ucyB0byBwYXNzIHRvIGBzZXRab25lKClgXG4gICAqIEByZXR1cm4ge0RhdGVUaW1lfVxuICAgKi9cbiAgdG9VVEMob2Zmc2V0ID0gMCwgb3B0cyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Wm9uZShGaXhlZE9mZnNldFpvbmUuaW5zdGFuY2Uob2Zmc2V0KSwgb3B0cyk7XG4gIH1cblxuICAvKipcbiAgICogXCJTZXRcIiB0aGUgRGF0ZVRpbWUncyB6b25lIHRvIHRoZSBob3N0J3MgbG9jYWwgem9uZS4gUmV0dXJucyBhIG5ld2x5LWNvbnN0cnVjdGVkIERhdGVUaW1lLlxuICAgKlxuICAgKiBFcXVpdmFsZW50IHRvIGBzZXRab25lKCdsb2NhbCcpYFxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHRvTG9jYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Wm9uZShTZXR0aW5ncy5kZWZhdWx0Wm9uZSk7XG4gIH1cblxuICAvKipcbiAgICogXCJTZXRcIiB0aGUgRGF0ZVRpbWUncyB6b25lIHRvIHNwZWNpZmllZCB6b25lLiBSZXR1cm5zIGEgbmV3bHktY29uc3RydWN0ZWQgRGF0ZVRpbWUuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSBzZXR0ZXIga2VlcHMgdGhlIHVuZGVybHlpbmcgdGltZSB0aGUgc2FtZSAoYXMgaW4sIHRoZSBzYW1lIHRpbWVzdGFtcCksIGJ1dCB0aGUgbmV3IGluc3RhbmNlIHdpbGwgcmVwb3J0IGRpZmZlcmVudCBsb2NhbCB0aW1lcyBhbmQgY29uc2lkZXIgRFNUcyB3aGVuIG1ha2luZyBjb21wdXRhdGlvbnMsIGFzIHdpdGgge0BsaW5rIERhdGVUaW1lI3BsdXN9LiBZb3UgbWF5IHdpc2ggdG8gdXNlIHtAbGluayBEYXRlVGltZSN0b0xvY2FsfSBhbmQge0BsaW5rIERhdGVUaW1lI3RvVVRDfSB3aGljaCBwcm92aWRlIHNpbXBsZSBjb252ZW5pZW5jZSB3cmFwcGVycyBmb3IgY29tbW9ubHkgdXNlZCB6b25lcy5cbiAgICogQHBhcmFtIHtzdHJpbmd8Wm9uZX0gW3pvbmU9J2xvY2FsJ10gLSBhIHpvbmUgaWRlbnRpZmllci4gQXMgYSBzdHJpbmcsIHRoYXQgY2FuIGJlIGFueSBJQU5BIHpvbmUgc3VwcG9ydGVkIGJ5IHRoZSBob3N0IGVudmlyb25tZW50LCBvciBhIGZpeGVkLW9mZnNldCBuYW1lIG9mIHRoZSBmb3JtICdVVEMrMycsIG9yIHRoZSBzdHJpbmdzICdsb2NhbCcgb3IgJ3V0YycuIFlvdSBtYXkgYWxzbyBzdXBwbHkgYW4gaW5zdGFuY2Ugb2YgYSB7QGxpbmsgRGF0ZVRpbWUjWm9uZX0gY2xhc3MuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLmtlZXBMb2NhbFRpbWU9ZmFsc2VdIC0gSWYgdHJ1ZSwgYWRqdXN0IHRoZSB1bmRlcmx5aW5nIHRpbWUgc28gdGhhdCB0aGUgbG9jYWwgdGltZSBzdGF5cyB0aGUgc2FtZSwgYnV0IGluIHRoZSB0YXJnZXQgem9uZS4gWW91IHNob3VsZCByYXJlbHkgbmVlZCB0aGlzLlxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHNldFpvbmUoem9uZSwgeyBrZWVwTG9jYWxUaW1lID0gZmFsc2UsIGtlZXBDYWxlbmRhclRpbWUgPSBmYWxzZSB9ID0ge30pIHtcbiAgICB6b25lID0gbm9ybWFsaXplWm9uZSh6b25lLCBTZXR0aW5ncy5kZWZhdWx0Wm9uZSk7XG4gICAgaWYgKHpvbmUuZXF1YWxzKHRoaXMuem9uZSkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSBpZiAoIXpvbmUuaXNWYWxpZCkge1xuICAgICAgcmV0dXJuIERhdGVUaW1lLmludmFsaWQodW5zdXBwb3J0ZWRab25lKHpvbmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG5ld1RTID0gdGhpcy50cztcbiAgICAgIGlmIChrZWVwTG9jYWxUaW1lIHx8IGtlZXBDYWxlbmRhclRpbWUpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0R3Vlc3MgPSB6b25lLm9mZnNldCh0aGlzLnRzKTtcbiAgICAgICAgY29uc3QgYXNPYmogPSB0aGlzLnRvT2JqZWN0KCk7XG4gICAgICAgIFtuZXdUU10gPSBvYmpUb1RTKGFzT2JqLCBvZmZzZXRHdWVzcywgem9uZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2xvbmUodGhpcywgeyB0czogbmV3VFMsIHpvbmUgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFwiU2V0XCIgdGhlIGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBvciBvdXRwdXRDYWxlbmRhci4gUmV0dXJucyBhIG5ld2x5LWNvbnN0cnVjdGVkIERhdGVUaW1lLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcHJvcGVydGllcyAtIHRoZSBwcm9wZXJ0aWVzIHRvIHNldFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkucmVjb25maWd1cmUoeyBsb2NhbGU6ICdlbi1HQicgfSlcbiAgICogQHJldHVybiB7RGF0ZVRpbWV9XG4gICAqL1xuICByZWNvbmZpZ3VyZSh7IGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBvdXRwdXRDYWxlbmRhciB9ID0ge30pIHtcbiAgICBjb25zdCBsb2MgPSB0aGlzLmxvYy5jbG9uZSh7IGxvY2FsZSwgbnVtYmVyaW5nU3lzdGVtLCBvdXRwdXRDYWxlbmRhciB9KTtcbiAgICByZXR1cm4gY2xvbmUodGhpcywgeyBsb2MgfSk7XG4gIH1cblxuICAvKipcbiAgICogXCJTZXRcIiB0aGUgbG9jYWxlLiBSZXR1cm5zIGEgbmV3bHktY29uc3RydWN0ZWQgRGF0ZVRpbWUuXG4gICAqIEp1c3QgYSBjb252ZW5pZW50IGFsaWFzIGZvciByZWNvbmZpZ3VyZSh7IGxvY2FsZSB9KVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE3LCA1LCAyNSkuc2V0TG9jYWxlKCdlbi1HQicpXG4gICAqIEByZXR1cm4ge0RhdGVUaW1lfVxuICAgKi9cbiAgc2V0TG9jYWxlKGxvY2FsZSkge1xuICAgIHJldHVybiB0aGlzLnJlY29uZmlndXJlKHsgbG9jYWxlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiU2V0XCIgdGhlIHZhbHVlcyBvZiBzcGVjaWZpZWQgdW5pdHMuIFJldHVybnMgYSBuZXdseS1jb25zdHJ1Y3RlZCBEYXRlVGltZS5cbiAgICogWW91IGNhbiBvbmx5IHNldCB1bml0cyB3aXRoIHRoaXMgbWV0aG9kOyBmb3IgXCJzZXR0aW5nXCIgbWV0YWRhdGEsIHNlZSB7QGxpbmsgRGF0ZVRpbWUjcmVjb25maWd1cmV9IGFuZCB7QGxpbmsgRGF0ZVRpbWUjc2V0Wm9uZX0uXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGFsc28gc3VwcG9ydHMgc2V0dGluZyBsb2NhbGUtYmFzZWQgd2VlayB1bml0cywgaS5lLiBgbG9jYWxXZWVrZGF5YCwgYGxvY2FsV2Vla051bWJlcmAgYW5kIGBsb2NhbFdlZWtZZWFyYC5cbiAgICogVGhleSBjYW5ub3QgYmUgbWl4ZWQgd2l0aCBJU08td2VlayB1bml0cyBsaWtlIGB3ZWVrZGF5YC5cbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlcyAtIGEgbWFwcGluZyBvZiB1bml0cyB0byBudW1iZXJzXG4gICAqIEBleGFtcGxlIGR0LnNldCh7IHllYXI6IDIwMTcgfSlcbiAgICogQGV4YW1wbGUgZHQuc2V0KHsgaG91cjogOCwgbWludXRlOiAzMCB9KVxuICAgKiBAZXhhbXBsZSBkdC5zZXQoeyB3ZWVrZGF5OiA1IH0pXG4gICAqIEBleGFtcGxlIGR0LnNldCh7IHllYXI6IDIwMDUsIG9yZGluYWw6IDIzNCB9KVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHNldCh2YWx1ZXMpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG5cbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplT2JqZWN0KHZhbHVlcywgbm9ybWFsaXplVW5pdFdpdGhMb2NhbFdlZWtzKTtcbiAgICBjb25zdCB7IG1pbkRheXNJbkZpcnN0V2Vlaywgc3RhcnRPZldlZWsgfSA9IHVzZXNMb2NhbFdlZWtWYWx1ZXMobm9ybWFsaXplZCwgdGhpcy5sb2MpO1xuXG4gICAgY29uc3Qgc2V0dGluZ1dlZWtTdHVmZiA9XG4gICAgICAgICFpc1VuZGVmaW5lZChub3JtYWxpemVkLndlZWtZZWFyKSB8fFxuICAgICAgICAhaXNVbmRlZmluZWQobm9ybWFsaXplZC53ZWVrTnVtYmVyKSB8fFxuICAgICAgICAhaXNVbmRlZmluZWQobm9ybWFsaXplZC53ZWVrZGF5KSxcbiAgICAgIGNvbnRhaW5zT3JkaW5hbCA9ICFpc1VuZGVmaW5lZChub3JtYWxpemVkLm9yZGluYWwpLFxuICAgICAgY29udGFpbnNHcmVnb3JZZWFyID0gIWlzVW5kZWZpbmVkKG5vcm1hbGl6ZWQueWVhciksXG4gICAgICBjb250YWluc0dyZWdvck1EID0gIWlzVW5kZWZpbmVkKG5vcm1hbGl6ZWQubW9udGgpIHx8ICFpc1VuZGVmaW5lZChub3JtYWxpemVkLmRheSksXG4gICAgICBjb250YWluc0dyZWdvciA9IGNvbnRhaW5zR3JlZ29yWWVhciB8fCBjb250YWluc0dyZWdvck1ELFxuICAgICAgZGVmaW5pdGVXZWVrRGVmID0gbm9ybWFsaXplZC53ZWVrWWVhciB8fCBub3JtYWxpemVkLndlZWtOdW1iZXI7XG5cbiAgICBpZiAoKGNvbnRhaW5zR3JlZ29yIHx8IGNvbnRhaW5zT3JkaW5hbCkgJiYgZGVmaW5pdGVXZWVrRGVmKSB7XG4gICAgICB0aHJvdyBuZXcgQ29uZmxpY3RpbmdTcGVjaWZpY2F0aW9uRXJyb3IoXG4gICAgICAgIFwiQ2FuJ3QgbWl4IHdlZWtZZWFyL3dlZWtOdW1iZXIgdW5pdHMgd2l0aCB5ZWFyL21vbnRoL2RheSBvciBvcmRpbmFsc1wiXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChjb250YWluc0dyZWdvck1EICYmIGNvbnRhaW5zT3JkaW5hbCkge1xuICAgICAgdGhyb3cgbmV3IENvbmZsaWN0aW5nU3BlY2lmaWNhdGlvbkVycm9yKFwiQ2FuJ3QgbWl4IG9yZGluYWwgZGF0ZXMgd2l0aCBtb250aC9kYXlcIik7XG4gICAgfVxuXG4gICAgbGV0IG1peGVkO1xuICAgIGlmIChzZXR0aW5nV2Vla1N0dWZmKSB7XG4gICAgICBtaXhlZCA9IHdlZWtUb0dyZWdvcmlhbihcbiAgICAgICAgeyAuLi5ncmVnb3JpYW5Ub1dlZWsodGhpcy5jLCBtaW5EYXlzSW5GaXJzdFdlZWssIHN0YXJ0T2ZXZWVrKSwgLi4ubm9ybWFsaXplZCB9LFxuICAgICAgICBtaW5EYXlzSW5GaXJzdFdlZWssXG4gICAgICAgIHN0YXJ0T2ZXZWVrXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoIWlzVW5kZWZpbmVkKG5vcm1hbGl6ZWQub3JkaW5hbCkpIHtcbiAgICAgIG1peGVkID0gb3JkaW5hbFRvR3JlZ29yaWFuKHsgLi4uZ3JlZ29yaWFuVG9PcmRpbmFsKHRoaXMuYyksIC4uLm5vcm1hbGl6ZWQgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1peGVkID0geyAuLi50aGlzLnRvT2JqZWN0KCksIC4uLm5vcm1hbGl6ZWQgfTtcblxuICAgICAgLy8gaWYgd2UgZGlkbid0IHNldCB0aGUgZGF5IGJ1dCB3ZSBlbmRlZCB1cCBvbiBhbiBvdmVyZmxvdyBkYXRlLFxuICAgICAgLy8gdXNlIHRoZSBsYXN0IGRheSBvZiB0aGUgcmlnaHQgbW9udGhcbiAgICAgIGlmIChpc1VuZGVmaW5lZChub3JtYWxpemVkLmRheSkpIHtcbiAgICAgICAgbWl4ZWQuZGF5ID0gTWF0aC5taW4oZGF5c0luTW9udGgobWl4ZWQueWVhciwgbWl4ZWQubW9udGgpLCBtaXhlZC5kYXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IFt0cywgb10gPSBvYmpUb1RTKG1peGVkLCB0aGlzLm8sIHRoaXMuem9uZSk7XG4gICAgcmV0dXJuIGNsb25lKHRoaXMsIHsgdHMsIG8gfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgcGVyaW9kIG9mIHRpbWUgdG8gdGhpcyBEYXRlVGltZSBhbmQgcmV0dXJuIHRoZSByZXN1bHRpbmcgRGF0ZVRpbWVcbiAgICpcbiAgICogQWRkaW5nIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBvciBtaWxsaXNlY29uZHMgaW5jcmVhc2VzIHRoZSB0aW1lc3RhbXAgYnkgdGhlIHJpZ2h0IG51bWJlciBvZiBtaWxsaXNlY29uZHMuIEFkZGluZyBkYXlzLCBtb250aHMsIG9yIHllYXJzIHNoaWZ0cyB0aGUgY2FsZW5kYXIsIGFjY291bnRpbmcgZm9yIERTVHMgYW5kIGxlYXAgeWVhcnMgYWxvbmcgdGhlIHdheS4gVGh1cywgYGR0LnBsdXMoeyBob3VyczogMjQgfSlgIG1heSByZXN1bHQgaW4gYSBkaWZmZXJlbnQgdGltZSB0aGFuIGBkdC5wbHVzKHsgZGF5czogMSB9KWAgaWYgdGhlcmUncyBhIERTVCBzaGlmdCBpbiBiZXR3ZWVuLlxuICAgKiBAcGFyYW0ge0R1cmF0aW9ufE9iamVjdHxudW1iZXJ9IGR1cmF0aW9uIC0gVGhlIGFtb3VudCB0byBhZGQuIEVpdGhlciBhIEx1eG9uIER1cmF0aW9uLCBhIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIHRoZSBvYmplY3QgYXJndW1lbnQgdG8gRHVyYXRpb24uZnJvbU9iamVjdCgpXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnBsdXMoMTIzKSAvL34+IGluIDEyMyBtaWxsaXNlY29uZHNcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkucGx1cyh7IG1pbnV0ZXM6IDE1IH0pIC8vfj4gaW4gMTUgbWludXRlc1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5wbHVzKHsgZGF5czogMSB9KSAvL34+IHRoaXMgdGltZSB0b21vcnJvd1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5wbHVzKHsgZGF5czogLTEgfSkgLy9+PiB0aGlzIHRpbWUgeWVzdGVyZGF5XG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnBsdXMoeyBob3VyczogMywgbWludXRlczogMTMgfSkgLy9+PiBpbiAzIGhyLCAxMyBtaW5cbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkucGx1cyhEdXJhdGlvbi5mcm9tT2JqZWN0KHsgaG91cnM6IDMsIG1pbnV0ZXM6IDEzIH0pKSAvL34+IGluIDMgaHIsIDEzIG1pblxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHBsdXMoZHVyYXRpb24pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIHRoaXM7XG4gICAgY29uc3QgZHVyID0gRHVyYXRpb24uZnJvbUR1cmF0aW9uTGlrZShkdXJhdGlvbik7XG4gICAgcmV0dXJuIGNsb25lKHRoaXMsIGFkanVzdFRpbWUodGhpcywgZHVyKSk7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3QgYSBwZXJpb2Qgb2YgdGltZSB0byB0aGlzIERhdGVUaW1lIGFuZCByZXR1cm4gdGhlIHJlc3VsdGluZyBEYXRlVGltZVxuICAgKiBTZWUge0BsaW5rIERhdGVUaW1lI3BsdXN9XG4gICAqIEBwYXJhbSB7RHVyYXRpb258T2JqZWN0fG51bWJlcn0gZHVyYXRpb24gLSBUaGUgYW1vdW50IHRvIHN1YnRyYWN0LiBFaXRoZXIgYSBMdXhvbiBEdXJhdGlvbiwgYSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCB0aGUgb2JqZWN0IGFyZ3VtZW50IHRvIER1cmF0aW9uLmZyb21PYmplY3QoKVxuICAgQHJldHVybiB7RGF0ZVRpbWV9XG4gICAqL1xuICBtaW51cyhkdXJhdGlvbikge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gdGhpcztcbiAgICBjb25zdCBkdXIgPSBEdXJhdGlvbi5mcm9tRHVyYXRpb25MaWtlKGR1cmF0aW9uKS5uZWdhdGUoKTtcbiAgICByZXR1cm4gY2xvbmUodGhpcywgYWRqdXN0VGltZSh0aGlzLCBkdXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcIlNldFwiIHRoaXMgRGF0ZVRpbWUgdG8gdGhlIGJlZ2lubmluZyBvZiBhIHVuaXQgb2YgdGltZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuaXQgLSBUaGUgdW5pdCB0byBnbyB0byB0aGUgYmVnaW5uaW5nIG9mLiBDYW4gYmUgJ3llYXInLCAncXVhcnRlcicsICdtb250aCcsICd3ZWVrJywgJ2RheScsICdob3VyJywgJ21pbnV0ZScsICdzZWNvbmQnLCBvciAnbWlsbGlzZWNvbmQnLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy51c2VMb2NhbGVXZWVrcz1mYWxzZV0gLSBJZiB0cnVlLCB1c2Ugd2Vla3MgYmFzZWQgb24gdGhlIGxvY2FsZSwgaS5lLiB1c2UgdGhlIGxvY2FsZS1kZXBlbmRlbnQgc3RhcnQgb2YgdGhlIHdlZWtcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMywgMykuc3RhcnRPZignbW9udGgnKS50b0lTT0RhdGUoKTsgLy89PiAnMjAxNC0wMy0wMSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMywgMykuc3RhcnRPZigneWVhcicpLnRvSVNPRGF0ZSgpOyAvLz0+ICcyMDE0LTAxLTAxJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE0LCAzLCAzKS5zdGFydE9mKCd3ZWVrJykudG9JU09EYXRlKCk7IC8vPT4gJzIwMTQtMDMtMDMnLCB3ZWVrcyBhbHdheXMgc3RhcnQgb24gTW9uZGF5c1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE0LCAzLCAzLCA1LCAzMCkuc3RhcnRPZignZGF5JykudG9JU09UaW1lKCk7IC8vPT4gJzAwOjAwLjAwMC0wNTowMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMywgMywgNSwgMzApLnN0YXJ0T2YoJ2hvdXInKS50b0lTT1RpbWUoKTsgLy89PiAnMDU6MDA6MDAuMDAwLTA1OjAwJ1xuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIHN0YXJ0T2YodW5pdCwgeyB1c2VMb2NhbGVXZWVrcyA9IGZhbHNlIH0gPSB7fSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gdGhpcztcblxuICAgIGNvbnN0IG8gPSB7fSxcbiAgICAgIG5vcm1hbGl6ZWRVbml0ID0gRHVyYXRpb24ubm9ybWFsaXplVW5pdCh1bml0KTtcbiAgICBzd2l0Y2ggKG5vcm1hbGl6ZWRVbml0KSB7XG4gICAgICBjYXNlIFwieWVhcnNcIjpcbiAgICAgICAgby5tb250aCA9IDE7XG4gICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIFwicXVhcnRlcnNcIjpcbiAgICAgIGNhc2UgXCJtb250aHNcIjpcbiAgICAgICAgby5kYXkgPSAxO1xuICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSBcIndlZWtzXCI6XG4gICAgICBjYXNlIFwiZGF5c1wiOlxuICAgICAgICBvLmhvdXIgPSAwO1xuICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSBcImhvdXJzXCI6XG4gICAgICAgIG8ubWludXRlID0gMDtcbiAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgXCJtaW51dGVzXCI6XG4gICAgICAgIG8uc2Vjb25kID0gMDtcbiAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgXCJzZWNvbmRzXCI6XG4gICAgICAgIG8ubWlsbGlzZWNvbmQgPSAwO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIG5vIGRlZmF1bHQsIGludmFsaWQgdW5pdHMgdGhyb3cgaW4gbm9ybWFsaXplVW5pdCgpXG4gICAgfVxuXG4gICAgaWYgKG5vcm1hbGl6ZWRVbml0ID09PSBcIndlZWtzXCIpIHtcbiAgICAgIGlmICh1c2VMb2NhbGVXZWVrcykge1xuICAgICAgICBjb25zdCBzdGFydE9mV2VlayA9IHRoaXMubG9jLmdldFN0YXJ0T2ZXZWVrKCk7XG4gICAgICAgIGNvbnN0IHsgd2Vla2RheSB9ID0gdGhpcztcbiAgICAgICAgaWYgKHdlZWtkYXkgPCBzdGFydE9mV2Vlaykge1xuICAgICAgICAgIG8ud2Vla051bWJlciA9IHRoaXMud2Vla051bWJlciAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgby53ZWVrZGF5ID0gc3RhcnRPZldlZWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvLndlZWtkYXkgPSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub3JtYWxpemVkVW5pdCA9PT0gXCJxdWFydGVyc1wiKSB7XG4gICAgICBjb25zdCBxID0gTWF0aC5jZWlsKHRoaXMubW9udGggLyAzKTtcbiAgICAgIG8ubW9udGggPSAocSAtIDEpICogMyArIDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc2V0KG8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiU2V0XCIgdGhpcyBEYXRlVGltZSB0byB0aGUgZW5kIChtZWFuaW5nIHRoZSBsYXN0IG1pbGxpc2Vjb25kKSBvZiBhIHVuaXQgb2YgdGltZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pdCAtIFRoZSB1bml0IHRvIGdvIHRvIHRoZSBlbmQgb2YuIENhbiBiZSAneWVhcicsICdxdWFydGVyJywgJ21vbnRoJywgJ3dlZWsnLCAnZGF5JywgJ2hvdXInLCAnbWludXRlJywgJ3NlY29uZCcsIG9yICdtaWxsaXNlY29uZCcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnVzZUxvY2FsZVdlZWtzPWZhbHNlXSAtIElmIHRydWUsIHVzZSB3ZWVrcyBiYXNlZCBvbiB0aGUgbG9jYWxlLCBpLmUuIHVzZSB0aGUgbG9jYWxlLWRlcGVuZGVudCBzdGFydCBvZiB0aGUgd2Vla1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5sb2NhbCgyMDE0LCAzLCAzKS5lbmRPZignbW9udGgnKS50b0lTTygpOyAvLz0+ICcyMDE0LTAzLTMxVDIzOjU5OjU5Ljk5OS0wNTowMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMywgMykuZW5kT2YoJ3llYXInKS50b0lTTygpOyAvLz0+ICcyMDE0LTEyLTMxVDIzOjU5OjU5Ljk5OS0wNTowMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgMywgMykuZW5kT2YoJ3dlZWsnKS50b0lTTygpOyAvLyA9PiAnMjAxNC0wMy0wOVQyMzo1OTo1OS45OTktMDU6MDAnLCB3ZWVrcyBzdGFydCBvbiBNb25kYXlzXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTQsIDMsIDMsIDUsIDMwKS5lbmRPZignZGF5JykudG9JU08oKTsgLy89PiAnMjAxNC0wMy0wM1QyMzo1OTo1OS45OTktMDU6MDAnXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTQsIDMsIDMsIDUsIDMwKS5lbmRPZignaG91cicpLnRvSVNPKCk7IC8vPT4gJzIwMTQtMDMtMDNUMDU6NTk6NTkuOTk5LTA1OjAwJ1xuICAgKiBAcmV0dXJuIHtEYXRlVGltZX1cbiAgICovXG4gIGVuZE9mKHVuaXQsIG9wdHMpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkXG4gICAgICA/IHRoaXMucGx1cyh7IFt1bml0XTogMSB9KVxuICAgICAgICAgIC5zdGFydE9mKHVuaXQsIG9wdHMpXG4gICAgICAgICAgLm1pbnVzKDEpXG4gICAgICA6IHRoaXM7XG4gIH1cblxuICAvLyBPVVRQVVRcblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIERhdGVUaW1lIGZvcm1hdHRlZCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCBmb3JtYXQgc3RyaW5nLlxuICAgKiAqKllvdSBtYXkgbm90IHdhbnQgdGhpcy4qKiBTZWUge0BsaW5rIERhdGVUaW1lI3RvTG9jYWxlU3RyaW5nfSBmb3IgYSBtb3JlIGZsZXhpYmxlIGZvcm1hdHRpbmcgdG9vbC4gRm9yIGEgdGFibGUgb2YgdG9rZW5zIGFuZCB0aGVpciBpbnRlcnByZXRhdGlvbnMsIHNlZSBbaGVyZV0oaHR0cHM6Ly9tb21lbnQuZ2l0aHViLmlvL2x1eG9uLyMvZm9ybWF0dGluZz9pZD10YWJsZS1vZi10b2tlbnMpLlxuICAgKiBEZWZhdWx0cyB0byBlbi1VUyBpZiBubyBsb2NhbGUgaGFzIGJlZW4gc3BlY2lmaWVkLCByZWdhcmRsZXNzIG9mIHRoZSBzeXN0ZW0ncyBsb2NhbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmbXQgLSB0aGUgZm9ybWF0IHN0cmluZ1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdHMgdG8gb3ZlcnJpZGUgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBvbiB0aGlzIERhdGVUaW1lXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnRvRm9ybWF0KCd5eXl5IExMTCBkZCcpIC8vPT4gJzIwMTcgQXByIDIyJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5zZXRMb2NhbGUoJ2ZyJykudG9Gb3JtYXQoJ3l5eXkgTExMIGRkJykgLy89PiAnMjAxNyBhdnIuIDIyJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0Zvcm1hdCgneXl5eSBMTEwgZGQnLCB7IGxvY2FsZTogXCJmclwiIH0pIC8vPT4gJzIwMTcgYXZyLiAyMidcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Gb3JtYXQoXCJISCAnaG91cnMgYW5kJyBtbSAnbWludXRlcydcIikgLy89PiAnMjAgaG91cnMgYW5kIDU1IG1pbnV0ZXMnXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvRm9ybWF0KGZtdCwgb3B0cyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZFxuICAgICAgPyBGb3JtYXR0ZXIuY3JlYXRlKHRoaXMubG9jLnJlZGVmYXVsdFRvRU4ob3B0cykpLmZvcm1hdERhdGVUaW1lRnJvbVN0cmluZyh0aGlzLCBmbXQpXG4gICAgICA6IElOVkFMSUQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGxvY2FsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoaXMgZGF0ZS4gQWNjZXB0cyB0aGUgc2FtZSBvcHRpb25zIGFzIHRoZSBJbnRsLkRhdGVUaW1lRm9ybWF0IGNvbnN0cnVjdG9yIGFuZCBhbnkgcHJlc2V0cyBkZWZpbmVkIGJ5IEx1eG9uLCBzdWNoIGFzIGBEYXRlVGltZS5EQVRFX0ZVTExgIG9yIGBEYXRlVGltZS5USU1FX1NJTVBMRWAuXG4gICAqIFRoZSBleGFjdCBiZWhhdmlvciBvZiB0aGlzIG1ldGhvZCBpcyBicm93c2VyLXNwZWNpZmljLCBidXQgaW4gZ2VuZXJhbCBpdCB3aWxsIHJldHVybiBhbiBhcHByb3ByaWF0ZSByZXByZXNlbnRhdGlvblxuICAgKiBvZiB0aGUgRGF0ZVRpbWUgaW4gdGhlIGFzc2lnbmVkIGxvY2FsZS5cbiAgICogRGVmYXVsdHMgdG8gdGhlIHN5c3RlbSdzIGxvY2FsZSBpZiBubyBsb2NhbGUgaGFzIGJlZW4gc3BlY2lmaWVkXG4gICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZVRpbWVGb3JtYXRcbiAgICogQHBhcmFtIGZvcm1hdE9wdHMge09iamVjdH0gLSBJbnRsLkRhdGVUaW1lRm9ybWF0IGNvbnN0cnVjdG9yIG9wdGlvbnMgYW5kIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdHMgdG8gb3ZlcnJpZGUgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBvbiB0aGlzIERhdGVUaW1lXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnRvTG9jYWxlU3RyaW5nKCk7IC8vPT4gNC8yMC8yMDE3XG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnNldExvY2FsZSgnZW4tZ2InKS50b0xvY2FsZVN0cmluZygpOyAvLz0+ICcyMC8wNC8yMDE3J1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0xvY2FsZVN0cmluZyhEYXRlVGltZS5EQVRFX0ZVTEwpOyAvLz0+ICdBcHJpbCAyMCwgMjAxNydcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Mb2NhbGVTdHJpbmcoRGF0ZVRpbWUuREFURV9GVUxMLCB7IGxvY2FsZTogJ2ZyJyB9KTsgLy89PiAnMjggYW/Du3QgMjAyMidcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Mb2NhbGVTdHJpbmcoRGF0ZVRpbWUuVElNRV9TSU1QTEUpOyAvLz0+ICcxMTozMiBBTSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Mb2NhbGVTdHJpbmcoRGF0ZVRpbWUuREFURVRJTUVfU0hPUlQpOyAvLz0+ICc0LzIwLzIwMTcsIDExOjMyIEFNJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0xvY2FsZVN0cmluZyh7IHdlZWtkYXk6ICdsb25nJywgbW9udGg6ICdsb25nJywgZGF5OiAnMi1kaWdpdCcgfSk7IC8vPT4gJ1RodXJzZGF5LCBBcHJpbCAyMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Mb2NhbGVTdHJpbmcoeyB3ZWVrZGF5OiAnc2hvcnQnLCBtb250aDogJ3Nob3J0JywgZGF5OiAnMi1kaWdpdCcsIGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSk7IC8vPT4gJ1RodSwgQXByIDIwLCAxMToyNyBBTSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9Mb2NhbGVTdHJpbmcoeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnLCBob3VyQ3ljbGU6ICdoMjMnIH0pOyAvLz0+ICcxMTozMidcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9Mb2NhbGVTdHJpbmcoZm9ybWF0T3B0cyA9IERBVEVfU0hPUlQsIG9wdHMgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWRcbiAgICAgID8gRm9ybWF0dGVyLmNyZWF0ZSh0aGlzLmxvYy5jbG9uZShvcHRzKSwgZm9ybWF0T3B0cykuZm9ybWF0RGF0ZVRpbWUodGhpcylcbiAgICAgIDogSU5WQUxJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGZvcm1hdCBcInBhcnRzXCIsIG1lYW5pbmcgaW5kaXZpZHVhbCB0b2tlbnMgYWxvbmcgd2l0aCBtZXRhZGF0YS4gVGhpcyBpcyBhbGxvd3MgY2FsbGVycyB0byBwb3N0LXByb2Nlc3MgaW5kaXZpZHVhbCBzZWN0aW9ucyBvZiB0aGUgZm9ybWF0dGVkIG91dHB1dC5cbiAgICogRGVmYXVsdHMgdG8gdGhlIHN5c3RlbSdzIGxvY2FsZSBpZiBubyBsb2NhbGUgaGFzIGJlZW4gc3BlY2lmaWVkXG4gICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZVRpbWVGb3JtYXQvZm9ybWF0VG9QYXJ0c1xuICAgKiBAcGFyYW0gb3B0cyB7T2JqZWN0fSAtIEludGwuRGF0ZVRpbWVGb3JtYXQgY29uc3RydWN0b3Igb3B0aW9ucywgc2FtZSBhcyBgdG9Mb2NhbGVTdHJpbmdgLlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0xvY2FsZVBhcnRzKCk7IC8vPT4gW1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy89PiAgIHsgdHlwZTogJ2RheScsIHZhbHVlOiAnMjUnIH0sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLz0+ICAgeyB0eXBlOiAnbGl0ZXJhbCcsIHZhbHVlOiAnLycgfSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vPT4gICB7IHR5cGU6ICdtb250aCcsIHZhbHVlOiAnMDUnIH0sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLz0+ICAgeyB0eXBlOiAnbGl0ZXJhbCcsIHZhbHVlOiAnLycgfSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vPT4gICB7IHR5cGU6ICd5ZWFyJywgdmFsdWU6ICcxOTgyJyB9XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLz0+IF1cbiAgICovXG4gIHRvTG9jYWxlUGFydHMob3B0cyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZFxuICAgICAgPyBGb3JtYXR0ZXIuY3JlYXRlKHRoaXMubG9jLmNsb25lKG9wdHMpLCBvcHRzKS5mb3JtYXREYXRlVGltZVBhcnRzKHRoaXMpXG4gICAgICA6IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gSVNPIDg2MDEtY29tcGxpYW50IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnN1cHByZXNzTWlsbGlzZWNvbmRzPWZhbHNlXSAtIGV4Y2x1ZGUgbWlsbGlzZWNvbmRzIGZyb20gdGhlIGZvcm1hdCBpZiB0aGV5J3JlIDBcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zdXBwcmVzc1NlY29uZHM9ZmFsc2VdIC0gZXhjbHVkZSBzZWNvbmRzIGZyb20gdGhlIGZvcm1hdCBpZiB0aGV5J3JlIDBcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5pbmNsdWRlT2Zmc2V0PXRydWVdIC0gaW5jbHVkZSB0aGUgb2Zmc2V0LCBzdWNoIGFzICdaJyBvciAnLTA0OjAwJ1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLmV4dGVuZGVkWm9uZT1mYWxzZV0gLSBhZGQgdGhlIHRpbWUgem9uZSBmb3JtYXQgZXh0ZW5zaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5mb3JtYXQ9J2V4dGVuZGVkJ10gLSBjaG9vc2UgYmV0d2VlbiB0aGUgYmFzaWMgYW5kIGV4dGVuZGVkIGZvcm1hdFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMTk4MywgNSwgMjUpLnRvSVNPKCkgLy89PiAnMTk4Mi0wNS0yNVQwMDowMDowMC4wMDBaJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0lTTygpIC8vPT4gJzIwMTctMDQtMjJUMjA6NDc6MDUuMzM1LTA0OjAwJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0lTTyh7IGluY2x1ZGVPZmZzZXQ6IGZhbHNlIH0pIC8vPT4gJzIwMTctMDQtMjJUMjA6NDc6MDUuMzM1J1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b0lTTyh7IGZvcm1hdDogJ2Jhc2ljJyB9KSAvLz0+ICcyMDE3MDQyMlQyMDQ3MDUuMzM1LTA0MDAnXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSVNPKHtcbiAgICBmb3JtYXQgPSBcImV4dGVuZGVkXCIsXG4gICAgc3VwcHJlc3NTZWNvbmRzID0gZmFsc2UsXG4gICAgc3VwcHJlc3NNaWxsaXNlY29uZHMgPSBmYWxzZSxcbiAgICBpbmNsdWRlT2Zmc2V0ID0gdHJ1ZSxcbiAgICBleHRlbmRlZFpvbmUgPSBmYWxzZSxcbiAgfSA9IHt9KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dCA9IGZvcm1hdCA9PT0gXCJleHRlbmRlZFwiO1xuXG4gICAgbGV0IGMgPSB0b0lTT0RhdGUodGhpcywgZXh0KTtcbiAgICBjICs9IFwiVFwiO1xuICAgIGMgKz0gdG9JU09UaW1lKHRoaXMsIGV4dCwgc3VwcHJlc3NTZWNvbmRzLCBzdXBwcmVzc01pbGxpc2Vjb25kcywgaW5jbHVkZU9mZnNldCwgZXh0ZW5kZWRab25lKTtcbiAgICByZXR1cm4gYztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIElTTyA4NjAxLWNvbXBsaWFudCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZSdzIGRhdGUgY29tcG9uZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuZm9ybWF0PSdleHRlbmRlZCddIC0gY2hvb3NlIGJldHdlZW4gdGhlIGJhc2ljIGFuZCBleHRlbmRlZCBmb3JtYXRcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDE5ODIsIDUsIDI1KS50b0lTT0RhdGUoKSAvLz0+ICcxOTgyLTA1LTI1J1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMTk4MiwgNSwgMjUpLnRvSVNPRGF0ZSh7IGZvcm1hdDogJ2Jhc2ljJyB9KSAvLz0+ICcxOTgyMDUyNSdcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9JU09EYXRlKHsgZm9ybWF0ID0gXCJleHRlbmRlZFwiIH0gPSB7fSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9JU09EYXRlKHRoaXMsIGZvcm1hdCA9PT0gXCJleHRlbmRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIElTTyA4NjAxLWNvbXBsaWFudCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZSdzIHdlZWsgZGF0ZVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMTk4MiwgNSwgMjUpLnRvSVNPV2Vla0RhdGUoKSAvLz0+ICcxOTgyLVcyMS0yJ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0lTT1dlZWtEYXRlKCkge1xuICAgIHJldHVybiB0b1RlY2hGb3JtYXQodGhpcywgXCJra2trLSdXJ1dXLWNcIik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBJU08gODYwMS1jb21wbGlhbnQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRGF0ZVRpbWUncyB0aW1lIGNvbXBvbmVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5zdXBwcmVzc01pbGxpc2Vjb25kcz1mYWxzZV0gLSBleGNsdWRlIG1pbGxpc2Vjb25kcyBmcm9tIHRoZSBmb3JtYXQgaWYgdGhleSdyZSAwXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuc3VwcHJlc3NTZWNvbmRzPWZhbHNlXSAtIGV4Y2x1ZGUgc2Vjb25kcyBmcm9tIHRoZSBmb3JtYXQgaWYgdGhleSdyZSAwXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZU9mZnNldD10cnVlXSAtIGluY2x1ZGUgdGhlIG9mZnNldCwgc3VjaCBhcyAnWicgb3IgJy0wNDowMCdcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5leHRlbmRlZFpvbmU9dHJ1ZV0gLSBhZGQgdGhlIHRpbWUgem9uZSBmb3JtYXQgZXh0ZW5zaW9uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZVByZWZpeD1mYWxzZV0gLSBpbmNsdWRlIHRoZSBgVGAgcHJlZml4XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0cy5mb3JtYXQ9J2V4dGVuZGVkJ10gLSBjaG9vc2UgYmV0d2VlbiB0aGUgYmFzaWMgYW5kIGV4dGVuZGVkIGZvcm1hdFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoKS5zZXQoeyBob3VyOiA3LCBtaW51dGU6IDM0IH0pLnRvSVNPVGltZSgpIC8vPT4gJzA3OjM0OjE5LjM2MVonXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygpLnNldCh7IGhvdXI6IDcsIG1pbnV0ZTogMzQsIHNlY29uZHM6IDAsIG1pbGxpc2Vjb25kczogMCB9KS50b0lTT1RpbWUoeyBzdXBwcmVzc1NlY29uZHM6IHRydWUgfSkgLy89PiAnMDc6MzRaJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoKS5zZXQoeyBob3VyOiA3LCBtaW51dGU6IDM0IH0pLnRvSVNPVGltZSh7IGZvcm1hdDogJ2Jhc2ljJyB9KSAvLz0+ICcwNzM0MTkuMzYxWidcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKCkuc2V0KHsgaG91cjogNywgbWludXRlOiAzNCB9KS50b0lTT1RpbWUoeyBpbmNsdWRlUHJlZml4OiB0cnVlIH0pIC8vPT4gJ1QwNzozNDoxOS4zNjFaJ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b0lTT1RpbWUoe1xuICAgIHN1cHByZXNzTWlsbGlzZWNvbmRzID0gZmFsc2UsXG4gICAgc3VwcHJlc3NTZWNvbmRzID0gZmFsc2UsXG4gICAgaW5jbHVkZU9mZnNldCA9IHRydWUsXG4gICAgaW5jbHVkZVByZWZpeCA9IGZhbHNlLFxuICAgIGV4dGVuZGVkWm9uZSA9IGZhbHNlLFxuICAgIGZvcm1hdCA9IFwiZXh0ZW5kZWRcIixcbiAgfSA9IHt9KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBjID0gaW5jbHVkZVByZWZpeCA/IFwiVFwiIDogXCJcIjtcbiAgICByZXR1cm4gKFxuICAgICAgYyArXG4gICAgICB0b0lTT1RpbWUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGZvcm1hdCA9PT0gXCJleHRlbmRlZFwiLFxuICAgICAgICBzdXBwcmVzc1NlY29uZHMsXG4gICAgICAgIHN1cHByZXNzTWlsbGlzZWNvbmRzLFxuICAgICAgICBpbmNsdWRlT2Zmc2V0LFxuICAgICAgICBleHRlbmRlZFpvbmVcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gUkZDIDI4MjItY29tcGF0aWJsZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZVxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoMjAxNCwgNywgMTMpLnRvUkZDMjgyMigpIC8vPT4gJ1N1biwgMTMgSnVsIDIwMTQgMDA6MDA6MDAgKzAwMDAnXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTQsIDcsIDEzKS50b1JGQzI4MjIoKSAvLz0+ICdTdW4sIDEzIEp1bCAyMDE0IDAwOjAwOjAwIC0wNDAwJ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuICB0b1JGQzI4MjIoKSB7XG4gICAgcmV0dXJuIHRvVGVjaEZvcm1hdCh0aGlzLCBcIkVFRSwgZGQgTExMIHl5eXkgSEg6bW06c3MgWlpaXCIsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRGF0ZVRpbWUgYXBwcm9wcmlhdGUgZm9yIHVzZSBpbiBIVFRQIGhlYWRlcnMuIFRoZSBvdXRwdXQgaXMgYWx3YXlzIGV4cHJlc3NlZCBpbiBHTVQuXG4gICAqIFNwZWNpZmljYWxseSwgdGhlIHN0cmluZyBjb25mb3JtcyB0byBSRkMgMTEyMy5cbiAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvUHJvdG9jb2xzL3JmYzI2MTYvcmZjMjYxNi1zZWMzLmh0bWwjc2VjMy4zLjFcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTQsIDcsIDEzKS50b0hUVFAoKSAvLz0+ICdTdW4sIDEzIEp1bCAyMDE0IDAwOjAwOjAwIEdNVCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTQsIDcsIDEzLCAxOSkudG9IVFRQKCkgLy89PiAnU3VuLCAxMyBKdWwgMjAxNCAxOTowMDowMCBHTVQnXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvSFRUUCgpIHtcbiAgICByZXR1cm4gdG9UZWNoRm9ybWF0KHRoaXMudG9VVEMoKSwgXCJFRUUsIGRkIExMTCB5eXl5IEhIOm1tOnNzICdHTVQnXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZSBhcHByb3ByaWF0ZSBmb3IgdXNlIGluIFNRTCBEYXRlXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLnV0YygyMDE0LCA3LCAxMykudG9TUUxEYXRlKCkgLy89PiAnMjAxNC0wNy0xMydcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9TUUxEYXRlKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRvSVNPRGF0ZSh0aGlzLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRGF0ZVRpbWUgYXBwcm9wcmlhdGUgZm9yIHVzZSBpbiBTUUwgVGltZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5pbmNsdWRlWm9uZT1mYWxzZV0gLSBpbmNsdWRlIHRoZSB6b25lLCBzdWNoIGFzICdBbWVyaWNhL05ld19Zb3JrJy4gT3ZlcnJpZGVzIGluY2x1ZGVPZmZzZXQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZU9mZnNldD10cnVlXSAtIGluY2x1ZGUgdGhlIG9mZnNldCwgc3VjaCBhcyAnWicgb3IgJy0wNDowMCdcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5pbmNsdWRlT2Zmc2V0U3BhY2U9dHJ1ZV0gLSBpbmNsdWRlIHRoZSBzcGFjZSBiZXR3ZWVuIHRoZSB0aW1lIGFuZCB0aGUgb2Zmc2V0LCBzdWNoIGFzICcwNToxNToxNi4zNDUgLTA0OjAwJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS51dGMoKS50b1NRTCgpIC8vPT4gJzA1OjE1OjE2LjM0NSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9TUUwoKSAvLz0+ICcwNToxNToxNi4zNDUgLTA0OjAwJ1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS50b1NRTCh7IGluY2x1ZGVPZmZzZXQ6IGZhbHNlIH0pIC8vPT4gJzA1OjE1OjE2LjM0NSdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkudG9TUUwoeyBpbmNsdWRlWm9uZTogZmFsc2UgfSkgLy89PiAnMDU6MTU6MTYuMzQ1IEFtZXJpY2EvTmV3X1lvcmsnXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvU1FMVGltZSh7IGluY2x1ZGVPZmZzZXQgPSB0cnVlLCBpbmNsdWRlWm9uZSA9IGZhbHNlLCBpbmNsdWRlT2Zmc2V0U3BhY2UgPSB0cnVlIH0gPSB7fSkge1xuICAgIGxldCBmbXQgPSBcIkhIOm1tOnNzLlNTU1wiO1xuXG4gICAgaWYgKGluY2x1ZGVab25lIHx8IGluY2x1ZGVPZmZzZXQpIHtcbiAgICAgIGlmIChpbmNsdWRlT2Zmc2V0U3BhY2UpIHtcbiAgICAgICAgZm10ICs9IFwiIFwiO1xuICAgICAgfVxuICAgICAgaWYgKGluY2x1ZGVab25lKSB7XG4gICAgICAgIGZtdCArPSBcInpcIjtcbiAgICAgIH0gZWxzZSBpZiAoaW5jbHVkZU9mZnNldCkge1xuICAgICAgICBmbXQgKz0gXCJaWlwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0b1RlY2hGb3JtYXQodGhpcywgZm10LCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgRGF0ZVRpbWUgYXBwcm9wcmlhdGUgZm9yIHVzZSBpbiBTUUwgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZVpvbmU9ZmFsc2VdIC0gaW5jbHVkZSB0aGUgem9uZSwgc3VjaCBhcyAnQW1lcmljYS9OZXdfWW9yaycuIE92ZXJyaWRlcyBpbmNsdWRlT2Zmc2V0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLmluY2x1ZGVPZmZzZXQ9dHJ1ZV0gLSBpbmNsdWRlIHRoZSBvZmZzZXQsIHN1Y2ggYXMgJ1onIG9yICctMDQ6MDAnXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZU9mZnNldFNwYWNlPXRydWVdIC0gaW5jbHVkZSB0aGUgc3BhY2UgYmV0d2VlbiB0aGUgdGltZSBhbmQgdGhlIG9mZnNldCwgc3VjaCBhcyAnMDU6MTU6MTYuMzQ1IC0wNDowMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUudXRjKDIwMTQsIDcsIDEzKS50b1NRTCgpIC8vPT4gJzIwMTQtMDctMTMgMDA6MDA6MDAuMDAwIFonXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTQsIDcsIDEzKS50b1NRTCgpIC8vPT4gJzIwMTQtMDctMTMgMDA6MDA6MDAuMDAwIC0wNDowMCdcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubG9jYWwoMjAxNCwgNywgMTMpLnRvU1FMKHsgaW5jbHVkZU9mZnNldDogZmFsc2UgfSkgLy89PiAnMjAxNC0wNy0xMyAwMDowMDowMC4wMDAnXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLmxvY2FsKDIwMTQsIDcsIDEzKS50b1NRTCh7IGluY2x1ZGVab25lOiB0cnVlIH0pIC8vPT4gJzIwMTQtMDctMTMgMDA6MDA6MDAuMDAwIEFtZXJpY2EvTmV3X1lvcmsnXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvU1FMKG9wdHMgPSB7fSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCR7dGhpcy50b1NRTERhdGUoKX0gJHt0aGlzLnRvU1FMVGltZShvcHRzKX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZSBhcHByb3ByaWF0ZSBmb3IgZGVidWdnaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnRvSVNPKCkgOiBJTlZBTElEO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBEYXRlVGltZSBhcHByb3ByaWF0ZSBmb3IgdGhlIFJFUEwuXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKCkge1xuICAgIGlmICh0aGlzLmlzVmFsaWQpIHtcbiAgICAgIHJldHVybiBgRGF0ZVRpbWUgeyB0czogJHt0aGlzLnRvSVNPKCl9LCB6b25lOiAke3RoaXMuem9uZS5uYW1lfSwgbG9jYWxlOiAke3RoaXMubG9jYWxlfSB9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGBEYXRlVGltZSB7IEludmFsaWQsIHJlYXNvbjogJHt0aGlzLmludmFsaWRSZWFzb259IH1gO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlcG9jaCBtaWxsaXNlY29uZHMgb2YgdGhpcyBEYXRlVGltZS4gQWxpYXMgb2Yge0BsaW5rIERhdGVUaW1lI3RvTWlsbGlzfVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICB2YWx1ZU9mKCkge1xuICAgIHJldHVybiB0aGlzLnRvTWlsbGlzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZXBvY2ggbWlsbGlzZWNvbmRzIG9mIHRoaXMgRGF0ZVRpbWUuXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHRvTWlsbGlzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnRzIDogTmFOO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGVwb2NoIHNlY29uZHMgb2YgdGhpcyBEYXRlVGltZS5cbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgdG9TZWNvbmRzKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQgPyB0aGlzLnRzIC8gMTAwMCA6IE5hTjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBlcG9jaCBzZWNvbmRzIChhcyBhIHdob2xlIG51bWJlcikgb2YgdGhpcyBEYXRlVGltZS5cbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgdG9Vbml4SW50ZWdlcigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gTWF0aC5mbG9vcih0aGlzLnRzIC8gMTAwMCkgOiBOYU47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBJU08gODYwMSByZXByZXNlbnRhdGlvbiBvZiB0aGlzIERhdGVUaW1lIGFwcHJvcHJpYXRlIGZvciB1c2UgaW4gSlNPTi5cbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB0aGlzLnRvSVNPKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEJTT04gc2VyaWFsaXphYmxlIGVxdWl2YWxlbnQgdG8gdGhpcyBEYXRlVGltZS5cbiAgICogQHJldHVybiB7RGF0ZX1cbiAgICovXG4gIHRvQlNPTigpIHtcbiAgICByZXR1cm4gdGhpcy50b0pTRGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aXRoIHRoaXMgRGF0ZVRpbWUncyB5ZWFyLCBtb250aCwgZGF5LCBhbmQgc28gb24uXG4gICAqIEBwYXJhbSBvcHRzIC0gb3B0aW9ucyBmb3IgZ2VuZXJhdGluZyB0aGUgb2JqZWN0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuaW5jbHVkZUNvbmZpZz1mYWxzZV0gLSBpbmNsdWRlIGNvbmZpZ3VyYXRpb24gYXR0cmlidXRlcyBpbiB0aGUgb3V0cHV0XG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLnRvT2JqZWN0KCkgLy89PiB7IHllYXI6IDIwMTcsIG1vbnRoOiA0LCBkYXk6IDIyLCBob3VyOiAyMCwgbWludXRlOiA0OSwgc2Vjb25kOiA0MiwgbWlsbGlzZWNvbmQ6IDI2OCB9XG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIHRvT2JqZWN0KG9wdHMgPSB7fSkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4ge307XG5cbiAgICBjb25zdCBiYXNlID0geyAuLi50aGlzLmMgfTtcblxuICAgIGlmIChvcHRzLmluY2x1ZGVDb25maWcpIHtcbiAgICAgIGJhc2Uub3V0cHV0Q2FsZW5kYXIgPSB0aGlzLm91dHB1dENhbGVuZGFyO1xuICAgICAgYmFzZS5udW1iZXJpbmdTeXN0ZW0gPSB0aGlzLmxvYy5udW1iZXJpbmdTeXN0ZW07XG4gICAgICBiYXNlLmxvY2FsZSA9IHRoaXMubG9jLmxvY2FsZTtcbiAgICB9XG4gICAgcmV0dXJuIGJhc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEphdmFTY3JpcHQgRGF0ZSBlcXVpdmFsZW50IHRvIHRoaXMgRGF0ZVRpbWUuXG4gICAqIEByZXR1cm4ge0RhdGV9XG4gICAqL1xuICB0b0pTRGF0ZSgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUodGhpcy5pc1ZhbGlkID8gdGhpcy50cyA6IE5hTik7XG4gIH1cblxuICAvLyBDT01QQVJFXG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHR3byBEYXRlVGltZXMgYXMgYSBEdXJhdGlvbi5cbiAgICogQHBhcmFtIHtEYXRlVGltZX0gb3RoZXJEYXRlVGltZSAtIHRoZSBEYXRlVGltZSB0byBjb21wYXJlIHRoaXMgb25lIHRvXG4gICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBbdW5pdD1bJ21pbGxpc2Vjb25kcyddXSAtIHRoZSB1bml0IG9yIGFycmF5IG9mIHVuaXRzIChzdWNoIGFzICdob3Vycycgb3IgJ2RheXMnKSB0byBpbmNsdWRlIGluIHRoZSBkdXJhdGlvbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zIHRoYXQgYWZmZWN0IHRoZSBjcmVhdGlvbiBvZiB0aGUgRHVyYXRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRzLmNvbnZlcnNpb25BY2N1cmFjeT0nY2FzdWFsJ10gLSB0aGUgY29udmVyc2lvbiBzeXN0ZW0gdG8gdXNlXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBpMSA9IERhdGVUaW1lLmZyb21JU08oJzE5ODItMDUtMjVUMDk6NDUnKSxcbiAgICogICAgIGkyID0gRGF0ZVRpbWUuZnJvbUlTTygnMTk4My0xMC0xNFQxMDozMCcpO1xuICAgKiBpMi5kaWZmKGkxKS50b09iamVjdCgpIC8vPT4geyBtaWxsaXNlY29uZHM6IDQzODA3NTAwMDAwIH1cbiAgICogaTIuZGlmZihpMSwgJ2hvdXJzJykudG9PYmplY3QoKSAvLz0+IHsgaG91cnM6IDEyMTY4Ljc1IH1cbiAgICogaTIuZGlmZihpMSwgWydtb250aHMnLCAnZGF5cyddKS50b09iamVjdCgpIC8vPT4geyBtb250aHM6IDE2LCBkYXlzOiAxOS4wMzEyNSB9XG4gICAqIGkyLmRpZmYoaTEsIFsnbW9udGhzJywgJ2RheXMnLCAnaG91cnMnXSkudG9PYmplY3QoKSAvLz0+IHsgbW9udGhzOiAxNiwgZGF5czogMTksIGhvdXJzOiAwLjc1IH1cbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBkaWZmKG90aGVyRGF0ZVRpbWUsIHVuaXQgPSBcIm1pbGxpc2Vjb25kc1wiLCBvcHRzID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCB8fCAhb3RoZXJEYXRlVGltZS5pc1ZhbGlkKSB7XG4gICAgICByZXR1cm4gRHVyYXRpb24uaW52YWxpZChcImNyZWF0ZWQgYnkgZGlmZmluZyBhbiBpbnZhbGlkIERhdGVUaW1lXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGR1ck9wdHMgPSB7IGxvY2FsZTogdGhpcy5sb2NhbGUsIG51bWJlcmluZ1N5c3RlbTogdGhpcy5udW1iZXJpbmdTeXN0ZW0sIC4uLm9wdHMgfTtcblxuICAgIGNvbnN0IHVuaXRzID0gbWF5YmVBcnJheSh1bml0KS5tYXAoRHVyYXRpb24ubm9ybWFsaXplVW5pdCksXG4gICAgICBvdGhlcklzTGF0ZXIgPSBvdGhlckRhdGVUaW1lLnZhbHVlT2YoKSA+IHRoaXMudmFsdWVPZigpLFxuICAgICAgZWFybGllciA9IG90aGVySXNMYXRlciA/IHRoaXMgOiBvdGhlckRhdGVUaW1lLFxuICAgICAgbGF0ZXIgPSBvdGhlcklzTGF0ZXIgPyBvdGhlckRhdGVUaW1lIDogdGhpcyxcbiAgICAgIGRpZmZlZCA9IGRpZmYoZWFybGllciwgbGF0ZXIsIHVuaXRzLCBkdXJPcHRzKTtcblxuICAgIHJldHVybiBvdGhlcklzTGF0ZXIgPyBkaWZmZWQubmVnYXRlKCkgOiBkaWZmZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBEYXRlVGltZSBhbmQgcmlnaHQgbm93LlxuICAgKiBTZWUge0BsaW5rIERhdGVUaW1lI2RpZmZ9XG4gICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBbdW5pdD1bJ21pbGxpc2Vjb25kcyddXSAtIHRoZSB1bml0IG9yIHVuaXRzIHVuaXRzIChzdWNoIGFzICdob3Vycycgb3IgJ2RheXMnKSB0byBpbmNsdWRlIGluIHRoZSBkdXJhdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnMgdGhhdCBhZmZlY3QgdGhlIGNyZWF0aW9uIG9mIHRoZSBEdXJhdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuY29udmVyc2lvbkFjY3VyYWN5PSdjYXN1YWwnXSAtIHRoZSBjb252ZXJzaW9uIHN5c3RlbSB0byB1c2VcbiAgICogQHJldHVybiB7RHVyYXRpb259XG4gICAqL1xuICBkaWZmTm93KHVuaXQgPSBcIm1pbGxpc2Vjb25kc1wiLCBvcHRzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5kaWZmKERhdGVUaW1lLm5vdygpLCB1bml0LCBvcHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYW4gSW50ZXJ2YWwgc3Bhbm5pbmcgYmV0d2VlbiB0aGlzIERhdGVUaW1lIGFuZCBhbm90aGVyIERhdGVUaW1lXG4gICAqIEBwYXJhbSB7RGF0ZVRpbWV9IG90aGVyRGF0ZVRpbWUgLSB0aGUgb3RoZXIgZW5kIHBvaW50IG9mIHRoZSBJbnRlcnZhbFxuICAgKiBAcmV0dXJuIHtJbnRlcnZhbH1cbiAgICovXG4gIHVudGlsKG90aGVyRGF0ZVRpbWUpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkID8gSW50ZXJ2YWwuZnJvbURhdGVUaW1lcyh0aGlzLCBvdGhlckRhdGVUaW1lKSA6IHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhpcyBEYXRlVGltZSBpcyBpbiB0aGUgc2FtZSB1bml0IG9mIHRpbWUgYXMgYW5vdGhlciBEYXRlVGltZS5cbiAgICogSGlnaGVyLW9yZGVyIHVuaXRzIG11c3QgYWxzbyBiZSBpZGVudGljYWwgZm9yIHRoaXMgZnVuY3Rpb24gdG8gcmV0dXJuIGB0cnVlYC5cbiAgICogTm90ZSB0aGF0IHRpbWUgem9uZXMgYXJlICoqaWdub3JlZCoqIGluIHRoaXMgY29tcGFyaXNvbiwgd2hpY2ggY29tcGFyZXMgdGhlICoqbG9jYWwqKiBjYWxlbmRhciB0aW1lLiBVc2Uge0BsaW5rIERhdGVUaW1lI3NldFpvbmV9IHRvIGNvbnZlcnQgb25lIG9mIHRoZSBkYXRlcyBpZiBuZWVkZWQuXG4gICAqIEBwYXJhbSB7RGF0ZVRpbWV9IG90aGVyRGF0ZVRpbWUgLSB0aGUgb3RoZXIgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuaXQgLSB0aGUgdW5pdCBvZiB0aW1lIHRvIGNoZWNrIHNhbWVuZXNzIG9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnVzZUxvY2FsZVdlZWtzPWZhbHNlXSAtIElmIHRydWUsIHVzZSB3ZWVrcyBiYXNlZCBvbiB0aGUgbG9jYWxlLCBpLmUuIHVzZSB0aGUgbG9jYWxlLWRlcGVuZGVudCBzdGFydCBvZiB0aGUgd2Vlazsgb25seSB0aGUgbG9jYWxlIG9mIHRoaXMgRGF0ZVRpbWUgaXMgdXNlZFxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5oYXNTYW1lKG90aGVyRFQsICdkYXknKTsgLy9+PiB0cnVlIGlmIG90aGVyRFQgaXMgaW4gdGhlIHNhbWUgY3VycmVudCBjYWxlbmRhciBkYXlcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGhhc1NhbWUob3RoZXJEYXRlVGltZSwgdW5pdCwgb3B0cykge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBpbnB1dE1zID0gb3RoZXJEYXRlVGltZS52YWx1ZU9mKCk7XG4gICAgY29uc3QgYWRqdXN0ZWRUb1pvbmUgPSB0aGlzLnNldFpvbmUob3RoZXJEYXRlVGltZS56b25lLCB7IGtlZXBMb2NhbFRpbWU6IHRydWUgfSk7XG4gICAgcmV0dXJuIChcbiAgICAgIGFkanVzdGVkVG9ab25lLnN0YXJ0T2YodW5pdCwgb3B0cykgPD0gaW5wdXRNcyAmJiBpbnB1dE1zIDw9IGFkanVzdGVkVG9ab25lLmVuZE9mKHVuaXQsIG9wdHMpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFcXVhbGl0eSBjaGVja1xuICAgKiBUd28gRGF0ZVRpbWVzIGFyZSBlcXVhbCBpZiBhbmQgb25seSBpZiB0aGV5IHJlcHJlc2VudCB0aGUgc2FtZSBtaWxsaXNlY29uZCwgaGF2ZSB0aGUgc2FtZSB6b25lIGFuZCBsb2NhdGlvbiwgYW5kIGFyZSBib3RoIHZhbGlkLlxuICAgKiBUbyBjb21wYXJlIGp1c3QgdGhlIG1pbGxpc2Vjb25kIHZhbHVlcywgdXNlIGArZHQxID09PSArZHQyYC5cbiAgICogQHBhcmFtIHtEYXRlVGltZX0gb3RoZXIgLSB0aGUgb3RoZXIgRGF0ZVRpbWVcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGVxdWFscyhvdGhlcikge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLmlzVmFsaWQgJiZcbiAgICAgIG90aGVyLmlzVmFsaWQgJiZcbiAgICAgIHRoaXMudmFsdWVPZigpID09PSBvdGhlci52YWx1ZU9mKCkgJiZcbiAgICAgIHRoaXMuem9uZS5lcXVhbHMob3RoZXIuem9uZSkgJiZcbiAgICAgIHRoaXMubG9jLmVxdWFscyhvdGhlci5sb2MpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdGhpcyB0aW1lIHJlbGF0aXZlIHRvIG5vdywgc3VjaCBhcyBcImluIHR3byBkYXlzXCIuIENhbiBvbmx5IGludGVybmF0aW9uYWxpemUgaWYgeW91clxuICAgKiBwbGF0Zm9ybSBzdXBwb3J0cyBJbnRsLlJlbGF0aXZlVGltZUZvcm1hdC4gUm91bmRzIGRvd24gYnkgZGVmYXVsdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25zIHRoYXQgYWZmZWN0IHRoZSBvdXRwdXRcbiAgICogQHBhcmFtIHtEYXRlVGltZX0gW29wdGlvbnMuYmFzZT1EYXRlVGltZS5ub3coKV0gLSB0aGUgRGF0ZVRpbWUgdG8gdXNlIGFzIHRoZSBiYXNpcyB0byB3aGljaCB0aGlzIHRpbWUgaXMgY29tcGFyZWQuIERlZmF1bHRzIHRvIG5vdy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0eWxlPVwibG9uZ1wiXSAtIHRoZSBzdHlsZSBvZiB1bml0cywgbXVzdCBiZSBcImxvbmdcIiwgXCJzaG9ydFwiLCBvciBcIm5hcnJvd1wiXG4gICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBvcHRpb25zLnVuaXQgLSB1c2UgYSBzcGVjaWZpYyB1bml0IG9yIGFycmF5IG9mIHVuaXRzOyBpZiBvbWl0dGVkLCBvciBhbiBhcnJheSwgdGhlIG1ldGhvZCB3aWxsIHBpY2sgdGhlIGJlc3QgdW5pdC4gVXNlIGFuIGFycmF5IG9yIG9uZSBvZiBcInllYXJzXCIsIFwicXVhcnRlcnNcIiwgXCJtb250aHNcIiwgXCJ3ZWVrc1wiLCBcImRheXNcIiwgXCJob3Vyc1wiLCBcIm1pbnV0ZXNcIiwgb3IgXCJzZWNvbmRzXCJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yb3VuZD10cnVlXSAtIHdoZXRoZXIgdG8gcm91bmQgdGhlIG51bWJlcnMgaW4gdGhlIG91dHB1dC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnBhZGRpbmc9MF0gLSBwYWRkaW5nIGluIG1pbGxpc2Vjb25kcy4gVGhpcyBhbGxvd3MgeW91IHRvIHJvdW5kIHVwIHRoZSByZXN1bHQgaWYgaXQgZml0cyBpbnNpZGUgdGhlIHRocmVzaG9sZC4gRG9uJ3QgdXNlIGluIGNvbWJpbmF0aW9uIHdpdGgge3JvdW5kOiBmYWxzZX0gYmVjYXVzZSB0aGUgZGVjaW1hbCBvdXRwdXQgd2lsbCBpbmNsdWRlIHRoZSBwYWRkaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5sb2NhbGUgLSBvdmVycmlkZSB0aGUgbG9jYWxlIG9mIHRoaXMgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMubnVtYmVyaW5nU3lzdGVtIC0gb3ZlcnJpZGUgdGhlIG51bWJlcmluZ1N5c3RlbSBvZiB0aGlzIERhdGVUaW1lLiBUaGUgSW50bCBzeXN0ZW0gbWF5IGNob29zZSBub3QgdG8gaG9ub3IgdGhpc1xuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5wbHVzKHsgZGF5czogMSB9KS50b1JlbGF0aXZlKCkgLy89PiBcImluIDEgZGF5XCJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkuc2V0TG9jYWxlKFwiZXNcIikudG9SZWxhdGl2ZSh7IGRheXM6IDEgfSkgLy89PiBcImRlbnRybyBkZSAxIGTDrWFcIlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5wbHVzKHsgZGF5czogMSB9KS50b1JlbGF0aXZlKHsgbG9jYWxlOiBcImZyXCIgfSkgLy89PiBcImRhbnMgMjMgaGV1cmVzXCJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkubWludXMoeyBkYXlzOiAyIH0pLnRvUmVsYXRpdmUoKSAvLz0+IFwiMiBkYXlzIGFnb1wiXG4gICAqIEBleGFtcGxlIERhdGVUaW1lLm5vdygpLm1pbnVzKHsgZGF5czogMiB9KS50b1JlbGF0aXZlKHsgdW5pdDogXCJob3Vyc1wiIH0pIC8vPT4gXCI0OCBob3VycyBhZ29cIlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5taW51cyh7IGhvdXJzOiAzNiB9KS50b1JlbGF0aXZlKHsgcm91bmQ6IGZhbHNlIH0pIC8vPT4gXCIxLjUgZGF5cyBhZ29cIlxuICAgKi9cbiAgdG9SZWxhdGl2ZShvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgYmFzZSA9IG9wdGlvbnMuYmFzZSB8fCBEYXRlVGltZS5mcm9tT2JqZWN0KHt9LCB7IHpvbmU6IHRoaXMuem9uZSB9KSxcbiAgICAgIHBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmcgPyAodGhpcyA8IGJhc2UgPyAtb3B0aW9ucy5wYWRkaW5nIDogb3B0aW9ucy5wYWRkaW5nKSA6IDA7XG4gICAgbGV0IHVuaXRzID0gW1wieWVhcnNcIiwgXCJtb250aHNcIiwgXCJkYXlzXCIsIFwiaG91cnNcIiwgXCJtaW51dGVzXCIsIFwic2Vjb25kc1wiXTtcbiAgICBsZXQgdW5pdCA9IG9wdGlvbnMudW5pdDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnVuaXQpKSB7XG4gICAgICB1bml0cyA9IG9wdGlvbnMudW5pdDtcbiAgICAgIHVuaXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBkaWZmUmVsYXRpdmUoYmFzZSwgdGhpcy5wbHVzKHBhZGRpbmcpLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbnVtZXJpYzogXCJhbHdheXNcIixcbiAgICAgIHVuaXRzLFxuICAgICAgdW5pdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgZGF0ZSByZWxhdGl2ZSB0byB0b2RheSwgc3VjaCBhcyBcInllc3RlcmRheVwiIG9yIFwibmV4dCBtb250aFwiLlxuICAgKiBPbmx5IGludGVybmF0aW9uYWxpemVzIG9uIHBsYXRmb3JtcyB0aGF0IHN1cHBvcnRzIEludGwuUmVsYXRpdmVUaW1lRm9ybWF0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgdGhhdCBhZmZlY3QgdGhlIG91dHB1dFxuICAgKiBAcGFyYW0ge0RhdGVUaW1lfSBbb3B0aW9ucy5iYXNlPURhdGVUaW1lLm5vdygpXSAtIHRoZSBEYXRlVGltZSB0byB1c2UgYXMgdGhlIGJhc2lzIHRvIHdoaWNoIHRoaXMgdGltZSBpcyBjb21wYXJlZC4gRGVmYXVsdHMgdG8gbm93LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5sb2NhbGUgLSBvdmVycmlkZSB0aGUgbG9jYWxlIG9mIHRoaXMgRGF0ZVRpbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbnMudW5pdCAtIHVzZSBhIHNwZWNpZmljIHVuaXQ7IGlmIG9taXR0ZWQsIHRoZSBtZXRob2Qgd2lsbCBwaWNrIHRoZSB1bml0LiBVc2Ugb25lIG9mIFwieWVhcnNcIiwgXCJxdWFydGVyc1wiLCBcIm1vbnRoc1wiLCBcIndlZWtzXCIsIG9yIFwiZGF5c1wiXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLm51bWJlcmluZ1N5c3RlbSAtIG92ZXJyaWRlIHRoZSBudW1iZXJpbmdTeXN0ZW0gb2YgdGhpcyBEYXRlVGltZS4gVGhlIEludGwgc3lzdGVtIG1heSBjaG9vc2Ugbm90IHRvIGhvbm9yIHRoaXNcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkucGx1cyh7IGRheXM6IDEgfSkudG9SZWxhdGl2ZUNhbGVuZGFyKCkgLy89PiBcInRvbW9ycm93XCJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkuc2V0TG9jYWxlKFwiZXNcIikucGx1cyh7IGRheXM6IDEgfSkudG9SZWxhdGl2ZSgpIC8vPT4gXCJcIm1hw7FhbmFcIlxuICAgKiBAZXhhbXBsZSBEYXRlVGltZS5ub3coKS5wbHVzKHsgZGF5czogMSB9KS50b1JlbGF0aXZlQ2FsZW5kYXIoeyBsb2NhbGU6IFwiZnJcIiB9KSAvLz0+IFwiZGVtYWluXCJcbiAgICogQGV4YW1wbGUgRGF0ZVRpbWUubm93KCkubWludXMoeyBkYXlzOiAyIH0pLnRvUmVsYXRpdmVDYWxlbmRhcigpIC8vPT4gXCIyIGRheXMgYWdvXCJcbiAgICovXG4gIHRvUmVsYXRpdmVDYWxlbmRhcihvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4gZGlmZlJlbGF0aXZlKG9wdGlvbnMuYmFzZSB8fCBEYXRlVGltZS5mcm9tT2JqZWN0KHt9LCB7IHpvbmU6IHRoaXMuem9uZSB9KSwgdGhpcywge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIG51bWVyaWM6IFwiYXV0b1wiLFxuICAgICAgdW5pdHM6IFtcInllYXJzXCIsIFwibW9udGhzXCIsIFwiZGF5c1wiXSxcbiAgICAgIGNhbGVuZGFyeTogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIG1pbiBvZiBzZXZlcmFsIGRhdGUgdGltZXNcbiAgICogQHBhcmFtIHsuLi5EYXRlVGltZX0gZGF0ZVRpbWVzIC0gdGhlIERhdGVUaW1lcyBmcm9tIHdoaWNoIHRvIGNob29zZSB0aGUgbWluaW11bVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX0gdGhlIG1pbiBEYXRlVGltZSwgb3IgdW5kZWZpbmVkIGlmIGNhbGxlZCB3aXRoIG5vIGFyZ3VtZW50XG4gICAqL1xuICBzdGF0aWMgbWluKC4uLmRhdGVUaW1lcykge1xuICAgIGlmICghZGF0ZVRpbWVzLmV2ZXJ5KERhdGVUaW1lLmlzRGF0ZVRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXCJtaW4gcmVxdWlyZXMgYWxsIGFyZ3VtZW50cyBiZSBEYXRlVGltZXNcIik7XG4gICAgfVxuICAgIHJldHVybiBiZXN0QnkoZGF0ZVRpbWVzLCAoaSkgPT4gaS52YWx1ZU9mKCksIE1hdGgubWluKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIG1heCBvZiBzZXZlcmFsIGRhdGUgdGltZXNcbiAgICogQHBhcmFtIHsuLi5EYXRlVGltZX0gZGF0ZVRpbWVzIC0gdGhlIERhdGVUaW1lcyBmcm9tIHdoaWNoIHRvIGNob29zZSB0aGUgbWF4aW11bVxuICAgKiBAcmV0dXJuIHtEYXRlVGltZX0gdGhlIG1heCBEYXRlVGltZSwgb3IgdW5kZWZpbmVkIGlmIGNhbGxlZCB3aXRoIG5vIGFyZ3VtZW50XG4gICAqL1xuICBzdGF0aWMgbWF4KC4uLmRhdGVUaW1lcykge1xuICAgIGlmICghZGF0ZVRpbWVzLmV2ZXJ5KERhdGVUaW1lLmlzRGF0ZVRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXCJtYXggcmVxdWlyZXMgYWxsIGFyZ3VtZW50cyBiZSBEYXRlVGltZXNcIik7XG4gICAgfVxuICAgIHJldHVybiBiZXN0QnkoZGF0ZVRpbWVzLCAoaSkgPT4gaS52YWx1ZU9mKCksIE1hdGgubWF4KTtcbiAgfVxuXG4gIC8vIE1JU0NcblxuICAvKipcbiAgICogRXhwbGFpbiBob3cgYSBzdHJpbmcgd291bGQgYmUgcGFyc2VkIGJ5IGZyb21Gb3JtYXQoKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIHRoZSBzdHJpbmcgdG8gcGFyc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZtdCAtIHRoZSBmb3JtYXQgdGhlIHN0cmluZyBpcyBleHBlY3RlZCB0byBiZSBpbiAoc2VlIGRlc2NyaXB0aW9uKVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgdGFrZW4gYnkgZnJvbUZvcm1hdCgpXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBmcm9tRm9ybWF0RXhwbGFpbih0ZXh0LCBmbXQsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHsgbG9jYWxlID0gbnVsbCwgbnVtYmVyaW5nU3lzdGVtID0gbnVsbCB9ID0gb3B0aW9ucyxcbiAgICAgIGxvY2FsZVRvVXNlID0gTG9jYWxlLmZyb21PcHRzKHtcbiAgICAgICAgbG9jYWxlLFxuICAgICAgICBudW1iZXJpbmdTeXN0ZW0sXG4gICAgICAgIGRlZmF1bHRUb0VOOiB0cnVlLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGV4cGxhaW5Gcm9tVG9rZW5zKGxvY2FsZVRvVXNlLCB0ZXh0LCBmbXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIHVzZSBmcm9tRm9ybWF0RXhwbGFpbiBpbnN0ZWFkXG4gICAqL1xuICBzdGF0aWMgZnJvbVN0cmluZ0V4cGxhaW4odGV4dCwgZm10LCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gRGF0ZVRpbWUuZnJvbUZvcm1hdEV4cGxhaW4odGV4dCwgZm10LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vIEZPUk1BVCBQUkVTRVRTXG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgMTAvMTQvMTk4M1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFX1NIT1JUKCkge1xuICAgIHJldHVybiBEQVRFX1NIT1JUO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJ09jdCAxNCwgMTk4MydcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgREFURV9NRUQoKSB7XG4gICAgcmV0dXJuIERBVEVfTUVEO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJ0ZyaSwgT2N0IDE0LCAxOTgzJ1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFX01FRF9XSVRIX1dFRUtEQVkoKSB7XG4gICAgcmV0dXJuIERBVEVfTUVEX1dJVEhfV0VFS0RBWTtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICdPY3RvYmVyIDE0LCAxOTgzJ1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFX0ZVTEwoKSB7XG4gICAgcmV0dXJuIERBVEVfRlVMTDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICdUdWVzZGF5LCBPY3RvYmVyIDE0LCAxOTgzJ1xuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFX0hVR0UoKSB7XG4gICAgcmV0dXJuIERBVEVfSFVHRTtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICcwOTozMCBBTScuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FX1NJTVBMRSgpIHtcbiAgICByZXR1cm4gVElNRV9TSU1QTEU7XG4gIH1cblxuICAvKipcbiAgICoge0BsaW5rIERhdGVUaW1lI3RvTG9jYWxlU3RyaW5nfSBmb3JtYXQgbGlrZSAnMDk6MzA6MjMgQU0nLiBPbmx5IDEyLWhvdXIgaWYgdGhlIGxvY2FsZSBpcy5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgVElNRV9XSVRIX1NFQ09ORFMoKSB7XG4gICAgcmV0dXJuIFRJTUVfV0lUSF9TRUNPTkRTO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJzA5OjMwOjIzIEFNIEVEVCcuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FX1dJVEhfU0hPUlRfT0ZGU0VUKCkge1xuICAgIHJldHVybiBUSU1FX1dJVEhfU0hPUlRfT0ZGU0VUO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJzA5OjMwOjIzIEFNIEVhc3Rlcm4gRGF5bGlnaHQgVGltZScuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FX1dJVEhfTE9OR19PRkZTRVQoKSB7XG4gICAgcmV0dXJuIFRJTUVfV0lUSF9MT05HX09GRlNFVDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICcwOTozMCcsIGFsd2F5cyAyNC1ob3VyLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FXzI0X1NJTVBMRSgpIHtcbiAgICByZXR1cm4gVElNRV8yNF9TSU1QTEU7XG4gIH1cblxuICAvKipcbiAgICoge0BsaW5rIERhdGVUaW1lI3RvTG9jYWxlU3RyaW5nfSBmb3JtYXQgbGlrZSAnMDk6MzA6MjMnLCBhbHdheXMgMjQtaG91ci5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgVElNRV8yNF9XSVRIX1NFQ09ORFMoKSB7XG4gICAgcmV0dXJuIFRJTUVfMjRfV0lUSF9TRUNPTkRTO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJzA5OjMwOjIzIEVEVCcsIGFsd2F5cyAyNC1ob3VyLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FXzI0X1dJVEhfU0hPUlRfT0ZGU0VUKCkge1xuICAgIHJldHVybiBUSU1FXzI0X1dJVEhfU0hPUlRfT0ZGU0VUO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJzA5OjMwOjIzIEVhc3Rlcm4gRGF5bGlnaHQgVGltZScsIGFsd2F5cyAyNC1ob3VyLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBUSU1FXzI0X1dJVEhfTE9OR19PRkZTRVQoKSB7XG4gICAgcmV0dXJuIFRJTUVfMjRfV0lUSF9MT05HX09GRlNFVDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICcxMC8xNC8xOTgzLCA5OjMwIEFNJy4gT25seSAxMi1ob3VyIGlmIHRoZSBsb2NhbGUgaXMuXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEVUSU1FX1NIT1JUKCkge1xuICAgIHJldHVybiBEQVRFVElNRV9TSE9SVDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICcxMC8xNC8xOTgzLCA5OjMwOjMzIEFNJy4gT25seSAxMi1ob3VyIGlmIHRoZSBsb2NhbGUgaXMuXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEVUSU1FX1NIT1JUX1dJVEhfU0VDT05EUygpIHtcbiAgICByZXR1cm4gREFURVRJTUVfU0hPUlRfV0lUSF9TRUNPTkRTO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJ09jdCAxNCwgMTk4MywgOTozMCBBTScuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFVElNRV9NRUQoKSB7XG4gICAgcmV0dXJuIERBVEVUSU1FX01FRDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICdPY3QgMTQsIDE5ODMsIDk6MzA6MzMgQU0nLiBPbmx5IDEyLWhvdXIgaWYgdGhlIGxvY2FsZSBpcy5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgREFURVRJTUVfTUVEX1dJVEhfU0VDT05EUygpIHtcbiAgICByZXR1cm4gREFURVRJTUVfTUVEX1dJVEhfU0VDT05EUztcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICdGcmksIDE0IE9jdCAxOTgzLCA5OjMwIEFNJy4gT25seSAxMi1ob3VyIGlmIHRoZSBsb2NhbGUgaXMuXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICBzdGF0aWMgZ2V0IERBVEVUSU1FX01FRF9XSVRIX1dFRUtEQVkoKSB7XG4gICAgcmV0dXJuIERBVEVUSU1FX01FRF9XSVRIX1dFRUtEQVk7XG4gIH1cblxuICAvKipcbiAgICoge0BsaW5rIERhdGVUaW1lI3RvTG9jYWxlU3RyaW5nfSBmb3JtYXQgbGlrZSAnT2N0b2JlciAxNCwgMTk4MywgOTozMCBBTSBFRFQnLiBPbmx5IDEyLWhvdXIgaWYgdGhlIGxvY2FsZSBpcy5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgREFURVRJTUVfRlVMTCgpIHtcbiAgICByZXR1cm4gREFURVRJTUVfRlVMTDtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGxpbmsgRGF0ZVRpbWUjdG9Mb2NhbGVTdHJpbmd9IGZvcm1hdCBsaWtlICdPY3RvYmVyIDE0LCAxOTgzLCA5OjMwOjMzIEFNIEVEVCcuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFVElNRV9GVUxMX1dJVEhfU0VDT05EUygpIHtcbiAgICByZXR1cm4gREFURVRJTUVfRlVMTF9XSVRIX1NFQ09ORFM7XG4gIH1cblxuICAvKipcbiAgICoge0BsaW5rIERhdGVUaW1lI3RvTG9jYWxlU3RyaW5nfSBmb3JtYXQgbGlrZSAnRnJpZGF5LCBPY3RvYmVyIDE0LCAxOTgzLCA5OjMwIEFNIEVhc3Rlcm4gRGF5bGlnaHQgVGltZScuIE9ubHkgMTItaG91ciBpZiB0aGUgbG9jYWxlIGlzLlxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgc3RhdGljIGdldCBEQVRFVElNRV9IVUdFKCkge1xuICAgIHJldHVybiBEQVRFVElNRV9IVUdFO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAbGluayBEYXRlVGltZSN0b0xvY2FsZVN0cmluZ30gZm9ybWF0IGxpa2UgJ0ZyaWRheSwgT2N0b2JlciAxNCwgMTk4MywgOTozMDozMyBBTSBFYXN0ZXJuIERheWxpZ2h0IFRpbWUnLiBPbmx5IDEyLWhvdXIgaWYgdGhlIGxvY2FsZSBpcy5cbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgREFURVRJTUVfSFVHRV9XSVRIX1NFQ09ORFMoKSB7XG4gICAgcmV0dXJuIERBVEVUSU1FX0hVR0VfV0lUSF9TRUNPTkRTO1xuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZnJpZW5kbHlEYXRlVGltZShkYXRlVGltZWlzaCkge1xuICBpZiAoRGF0ZVRpbWUuaXNEYXRlVGltZShkYXRlVGltZWlzaCkpIHtcbiAgICByZXR1cm4gZGF0ZVRpbWVpc2g7XG4gIH0gZWxzZSBpZiAoZGF0ZVRpbWVpc2ggJiYgZGF0ZVRpbWVpc2gudmFsdWVPZiAmJiBpc051bWJlcihkYXRlVGltZWlzaC52YWx1ZU9mKCkpKSB7XG4gICAgcmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZVRpbWVpc2gpO1xuICB9IGVsc2UgaWYgKGRhdGVUaW1laXNoICYmIHR5cGVvZiBkYXRlVGltZWlzaCA9PT0gXCJvYmplY3RcIikge1xuICAgIHJldHVybiBEYXRlVGltZS5mcm9tT2JqZWN0KGRhdGVUaW1laXNoKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50RXJyb3IoXG4gICAgICBgVW5rbm93biBkYXRldGltZSBhcmd1bWVudDogJHtkYXRlVGltZWlzaH0sIG9mIHR5cGUgJHt0eXBlb2YgZGF0ZVRpbWVpc2h9YFxuICAgICk7XG4gIH1cbn1cblxuY29uc3QgVkVSU0lPTiA9IFwiMy40LjRcIjtcblxuZXhwb3J0IHsgRGF0ZVRpbWUsIER1cmF0aW9uLCBGaXhlZE9mZnNldFpvbmUsIElBTkFab25lLCBJbmZvLCBJbnRlcnZhbCwgSW52YWxpZFpvbmUsIFNldHRpbmdzLCBTeXN0ZW1ab25lLCBWRVJTSU9OLCBab25lIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1sdXhvbi5qcy5tYXBcbiJdLCJtYXBwaW5ncyI6Ijs7SUFLTSxhQUFOLGNBQXlCLE1BQU0sQ0FBRTtJQUszQix1QkFBTixjQUFtQyxXQUFXO0NBQzVDLFlBQVksUUFBUTtBQUNsQixTQUFPLG9CQUFvQixPQUFPLFdBQVcsQ0FBQyxFQUFFO0NBQ2pEO0FBQ0Y7SUFLSyx1QkFBTixjQUFtQyxXQUFXO0NBQzVDLFlBQVksUUFBUTtBQUNsQixTQUFPLG9CQUFvQixPQUFPLFdBQVcsQ0FBQyxFQUFFO0NBQ2pEO0FBQ0Y7SUFLSyx1QkFBTixjQUFtQyxXQUFXO0NBQzVDLFlBQVksUUFBUTtBQUNsQixTQUFPLG9CQUFvQixPQUFPLFdBQVcsQ0FBQyxFQUFFO0NBQ2pEO0FBQ0Y7SUFLSyxnQ0FBTixjQUE0QyxXQUFXLENBQUU7SUFLbkQsbUJBQU4sY0FBK0IsV0FBVztDQUN4QyxZQUFZLE1BQU07QUFDaEIsU0FBTyxl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cEMsUUFBSyxLQUNILFFBQU8sTUFBTSxJQUFJLEtBQUssT0FBTyxFQUFFLEVBQUU7QUFFbkMsUUFBSyxJQUNILFFBQU8sUUFBUSxTQUFTO0FBQzFCLFFBQUssS0FDSCxRQUFPLFFBQVEsV0FBVyxlQUFlO0FBQzNDLFFBQUssT0FDSCxRQUFPLFFBQVEsS0FBSztBQUN0QixRQUFLLFFBQ0gsUUFBTyxRQUFRLFVBQVU7QUFDM0IsUUFBSyxTQUNILFFBQU8sUUFBUSxJQUFJO0FBRXJCLFFBQUssSUFDSCxRQUFPLFFBQVEsU0FBUztBQUMxQixRQUFLLEtBQ0gsUUFBTyxRQUFRLElBQUk7QUFDckIsUUFBSyxNQUNILFFBQU8sTUFBTSxJQUFJLE9BQU8sU0FBUyxLQUFLLEVBQUUsRUFBRTtBQUM1QyxRQUFLLE9BQ0gsUUFBTyxNQUFNLElBQUksT0FBTyxRQUFRLEtBQUssRUFBRSxFQUFFO0FBQzNDLFFBQUssSUFDSCxRQUFPLFFBQVEsU0FBUztBQUMxQixRQUFLLEtBQ0gsUUFBTyxRQUFRLElBQUk7QUFDckIsUUFBSyxNQUNILFFBQU8sTUFBTSxJQUFJLE9BQU8sU0FBUyxNQUFNLEVBQUUsRUFBRTtBQUM3QyxRQUFLLE9BQ0gsUUFBTyxNQUFNLElBQUksT0FBTyxRQUFRLE1BQU0sRUFBRSxFQUFFO0FBRTVDLFFBQUssSUFDSCxRQUFPLFFBQVEsU0FBUztBQUMxQixRQUFLLEtBQ0gsUUFBTyxRQUFRLElBQUk7QUFFckIsUUFBSyxJQUNILFFBQU8sUUFBUSxXQUFXO0FBQzVCLFFBQUssTUFDSCxRQUFPLFFBQVEsTUFBTTtBQUV2QixRQUFLLEtBQ0gsUUFBTyxRQUFRLElBQUk7QUFDckIsUUFBSyxJQUNILFFBQU8sUUFBUSxTQUFTO0FBQzFCLFFBQUssS0FDSCxRQUFPLFFBQVEsSUFBSTtBQUNyQixRQUFLLElBQ0gsUUFBTyxRQUFRLFNBQVM7QUFDMUIsUUFBSyxLQUNILFFBQU8sUUFBUSxJQUFJO0FBQ3JCLFFBQUssSUFDSCxRQUFPLFFBQVEsU0FBUztBQUMxQixRQUFLLElBQ0gsUUFBTyxRQUFRLFNBQVM7QUFD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