
//#region packages/tutanota-utils/dist/TypeRef.js
var TypeRef = class {
	app;
	type;
	/**
	* Field that is never set. Used to make two TypeRefs incompatible (they are structurally compared otherwise).
	* Cannot be private.
	*/
	phantom = null;
	constructor(app, type) {
		this.app = app;
		this.type = type;
		Object.freeze(this);
	}
	/**
	* breaks when the object passes worker barrier
	*/
	toString() {
		return `[TypeRef ${this.app} ${this.type}]`;
	}
};
function getTypeId(typeRef) {
	return typeRef.app + "/" + typeRef.type;
}
function isSameTypeRefByAttr(typeRef, app, typeName) {
	return typeRef.app === app && typeRef.type === typeName;
}
function isSameTypeRef(typeRef1, typeRef2) {
	return isSameTypeRefByAttr(typeRef1, typeRef2.app, typeRef2.type);
}

//#endregion
//#region packages/tutanota-utils/dist/Utils.js
function freshVersioned(object) {
	return {
		object,
		version: 0
	};
}
function defer() {
	let ret = {};
	ret.promise = new Promise((resolve, reject) => {
		ret.resolve = resolve;
		ret.reject = reject;
	});
	return ret;
}
async function asyncFind(array, finder) {
	for (let i = 0; i < array.length; i++) {
		const item = array[i];
		if (await finder(item, i, array.length)) return item;
	}
	return null;
}
function neverNull(object) {
	return object;
}
function assertNotNull(value, message = "null") {
	if (value == null) throw new Error("AssertNotNull failed : " + message);
	return value;
}
function assertNonNull(value, message = "null") {
	if (value == null) throw new Error("AssertNonNull failed: " + message);
}
function isNotNull(t) {
	return t != null;
}
function assert(assertion, message) {
	if (!resolveMaybeLazy(assertion)) throw new Error(`Assertion failed: ${message}`);
}
function downcast(object) {
	return object;
}
function clone(instance) {
	if (instance instanceof Uint8Array) return downcast(instance.slice());
else if (instance instanceof Array) return downcast(instance.map((i) => clone(i)));
else if (instance instanceof Date) return new Date(instance.getTime());
else if (instance instanceof TypeRef) return instance;
else if (instance instanceof Object) {
		const copy = Object.create(Object.getPrototypeOf(instance) || null);
		Object.assign(copy, instance);
		for (let key of Object.keys(copy)) copy[key] = clone(copy[key]);
		return copy;
	} else return instance;
}
function lazyMemoized(source) {
	let cached = false;
	let value;
	return () => {
		if (cached) return value;
else {
			cached = true;
			return value = source();
		}
	};
}
function makeSingleUse(fn) {
	let called = false;
	return (arg) => {
		if (!called) {
			called = true;
			fn(arg);
		}
	};
}
function memoized(fn) {
	let lastArg;
	let lastResult;
	let didCache = false;
	return (arg) => {
		if (!didCache || arg !== lastArg) {
			lastArg = arg;
			didCache = true;
			lastResult = fn(arg);
		}
		return lastResult;
	};
}
function memoizedWithHiddenArgument(argumentProvider, computationFunction) {
	const memoizedComputation = memoized(computationFunction);
	return () => memoizedComputation(argumentProvider());
}
function identity(t) {
	return t;
}
function noOp() {}
function debounce(timeout, toThrottle) {
	let timeoutId;
	let toInvoke;
	return downcast((...args) => {
		if (timeoutId) clearTimeout(timeoutId);
		toInvoke = toThrottle.bind(null, ...args);
		timeoutId = setTimeout(toInvoke, timeout);
	});
}
function debounceStart(timeout, toThrottle) {
	let timeoutId;
	let lastInvoked = 0;
	return downcast((...args) => {
		if (Date.now() - lastInvoked < timeout) {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				timeoutId = null;
				toThrottle.apply(null, args);
			}, timeout);
		} else toThrottle.apply(null, args);
		lastInvoked = Date.now();
	});
}
function throttle(periodMs, toThrottle) {
	let lastArgs = null;
	return (...args) => {
		if (lastArgs) return;
else setTimeout(() => {
			try {
				toThrottle.apply(null, args);
			} finally {
				lastArgs = null;
			}
		}, periodMs);
	};
}
function randomIntFromInterval(min$1, max$1) {
	return Math.floor(Math.random() * (max$1 - min$1 + 1) + min$1);
}
function errorToString(error) {
	let errorString = error.name ? error.name : "?";
	if (error.message) errorString += `\n Error message: ${error.message}`;
	if (error.stack) errorString += `\nStacktrace: \n${error.stack}`;
	return errorString;
}
function objectEntries(object) {
	return downcast(Object.entries(object));
}
function deepEqual(a, b) {
	if (a === b) return true;
	if (xor(a === null, b === null) || xor(a === undefined, b === undefined)) return false;
	if (typeof a === "object" && typeof b === "object") {
		const aIsArgs = isArguments(a), bIsArgs = isArguments(b);
		if (a.length === b.length && (a instanceof Array && b instanceof Array || aIsArgs && bIsArgs)) {
			const aKeys = Object.getOwnPropertyNames(a), bKeys = Object.getOwnPropertyNames(b);
			if (aKeys.length !== bKeys.length) return false;
			for (let i = 0; i < aKeys.length; i++) if (!hasOwn.call(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false;
			return true;
		}
		if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
		if (a instanceof Map && b instanceof Map) {
			for (const key of a.keys()) if (!b.has(key) || !deepEqual(a.get(key), b.get(key))) return false;
			for (const key of b.keys()) if (!a.has(key)) return false;
			return true;
		}
		if (a instanceof Object && b instanceof Object && !aIsArgs && !bIsArgs) {
			for (let i in a) if (!(i in b) || !deepEqual(a[i], b[i])) return false;
			for (let i in b) if (!(i in a)) return false;
			return true;
		}
		if (typeof Buffer === "function" && a instanceof Buffer && b instanceof Buffer) {
			for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
			return true;
		}
		if (a.valueOf() === b.valueOf()) return true;
	}
	return false;
}
function xor(a, b) {
	const aBool = !!a;
	const bBool = !!b;
	return aBool && !bBool || bBool && !aBool;
}
function isArguments(a) {
	if ("callee" in a) {
		for (let i in a) if (i === "callee") return false;
		return true;
	}
}
const hasOwn = {}.hasOwnProperty;
function freezeMap(myMap) {
	function mapSet(key, value) {
		throw new Error("Can't add property " + key + ", map is not extensible");
	}
	function mapDelete(key) {
		throw new Error("Can't delete property " + key + ", map is frozen");
	}
	function mapClear() {
		throw new Error("Can't clear map, map is frozen");
	}
	const anyMap = downcast(myMap);
	anyMap.set = mapSet;
	anyMap.delete = mapDelete;
	anyMap.clear = mapClear;
	Object.freeze(anyMap);
	return anyMap;
}
function addressDomain(senderAddress) {
	return senderAddress.slice(senderAddress.lastIndexOf("@") + 1);
}
function typedKeys(obj) {
	return downcast(Object.keys(obj));
}
function typedEntries(obj) {
	return downcast(Object.entries(obj));
}
function typedValues(obj) {
	return downcast(Object.values(obj));
}
function resolveMaybeLazy(maybe) {
	return typeof maybe === "function" ? maybe() : maybe;
}
function getAsLazy(maybe) {
	return typeof maybe === "function" ? downcast(maybe) : () => maybe;
}
function mapLazily(maybe, mapping) {
	return () => mapping(resolveMaybeLazy(maybe));
}
function filterInt(value) {
	if (/^\d+$/.test(value)) return parseInt(value, 10);
else return NaN;
}
function insideRect(point, rect) {
	return point.x >= rect.left && point.x < rect.right && point.y >= rect.top && point.y < rect.bottom;
}
function mapNullable(val, action) {
	if (val != null) {
		const result = action(val);
		if (result != null) return result;
	}
	return null;
}
function mapObject(mapper, obj) {
	const newObj = {};
	for (const key of Object.keys(obj)) {
		const typedKey = key;
		newObj[typedKey] = mapper(obj[typedKey]);
	}
	return newObj;
}
var BoundedExecutor = class {
	maxParallelJobs;
	runningJobsCount = 0;
	currentJob = Promise.resolve();
	constructor(maxParallelJobs) {
		this.maxParallelJobs = maxParallelJobs;
	}
	async run(job) {
		while (this.runningJobsCount === this.maxParallelJobs) await this.currentJob;
		this.runningJobsCount++;
		try {
			const jobResult = job();
			this.currentJob = jobResult.catch(noOp);
			return await jobResult;
		} finally {
			this.runningJobsCount--;
		}
	}
};
function assertValidURL(url) {
	try {
		return new URL(url);
	} catch (e) {
		return false;
	}
}

//#endregion
//#region packages/tutanota-utils/dist/MapUtils.js
function mergeMaps(maps) {
	return maps.reduce((mergedMap, map) => {
		for (const [key, value] of map.entries()) if (mergedMap.has(key)) neverNull(mergedMap.get(key)).push(value);
else mergedMap.set(key, [value]);
		return mergedMap;
	}, new Map());
}
function getFromMap(map, key, byDefault) {
	let value = map.get(key);
	if (!value) {
		value = byDefault();
		map.set(key, value);
	}
	return value;
}
function mapMap(map, mapper) {
	const resultMap = new Map();
	for (const [key, oldValue] of map) {
		const newValue = mapper(oldValue);
		resultMap.set(key, newValue);
	}
	return resultMap;
}

//#endregion
//#region packages/tutanota-utils/dist/ArrayUtils.js
function concat(...arrays) {
	let length = arrays.reduce((previous, current) => previous + current.length, 0);
	let result = new Uint8Array(length);
	let index = 0;
	for (const array of arrays) {
		result.set(array, index);
		index += array.length;
	}
	return result;
}
function numberRange(min$1, max$1) {
	return [...Array(max$1 + 1).keys()].slice(min$1);
}
function arrayEquals(a1, a2) {
	if (a1 === a2) return true;
	if (a1.length === a2.length) {
		for (let i = 0; i < a1.length; i++) if (a1[i] !== a2[i]) return false;
		return true;
	}
	return false;
}
function arrayEqualsWithPredicate(a1, a2, predicate) {
	if (a1.length === a2.length) {
		for (let i = 0; i < a1.length; i++) if (!predicate(a1[i], a2[i])) return false;
		return true;
	}
	return false;
}
function arrayHash(array) {
	let hash = 0;
	hash |= 0;
	for (let i = 0; i < array.length; i++) {
		hash = (hash << 5) - hash + array[i];
		hash |= 0;
	}
	return hash;
}
function remove(theArray, elementToRemove) {
	let i = theArray.indexOf(elementToRemove);
	if (i !== -1) {
		theArray.splice(i, 1);
		return true;
	} else return false;
}
function clear(theArray) {
	theArray.length = 0;
}
function findAll(theArray, finder) {
	const found = [];
	for (let element of theArray) if (finder(element)) found.push(element);
	return found;
}
function findAndRemove(theArray, finder) {
	const index = theArray.findIndex(finder);
	if (index !== -1) {
		theArray.splice(index, 1);
		return true;
	} else return false;
}
function findAllAndRemove(theArray, finder, startIndex = 0) {
	let removedElement = false;
	for (let i = theArray.length - 1; i >= startIndex; i--) if (finder(theArray[i])) {
		theArray.splice(i, 1);
		removedElement = true;
	}
	return removedElement;
}
function mapAndFilterNull(array, mapper) {
	const resultList = [];
	for (const item of array) {
		const resultItem = mapper(item);
		if (resultItem != null) resultList.push(resultItem);
	}
	return resultList;
}
function filterNull(array) {
	return downcast(array.filter((item) => item != null));
}
function last(theArray) {
	return theArray[theArray.length - 1];
}
function isEmpty(array) {
	return array.length === 0;
}
function isNotEmpty(array) {
	return array.length != 0;
}
function lastThrow(array) {
	if (isEmpty(array)) throw new RangeError("Array is empty");
	return neverNull(last(array));
}
function getFirstOrThrow(array) {
	if (isEmpty(array)) throw new RangeError("Array is empty");
	return array[0];
}
function first(array) {
	return array[0] || null;
}
function findLast(array, predicate) {
	const index = findLastIndex(array, predicate);
	if (index !== -1) return array[index];
	return null;
}
function findLastIndex(array, predicate) {
	for (let i = array.length - 1; i >= 0; i--) if (predicate(array[i])) return i;
	return -1;
}
function contains(theArray, elementToCheck) {
	return theArray.indexOf(elementToCheck) !== -1;
}
function count(theArray, pred) {
	return theArray.reduce((acc, next) => pred(next) ? ++acc : acc, 0);
}
function addAll(array, elements) {
	array.push(...elements);
}
function groupByAndMapUniquely(iterable, discriminator, mapper) {
	const map = new Map();
	for (let el of iterable) {
		const key = discriminator(el);
		getFromMap(map, key, () => new Set()).add(mapper(el));
	}
	return map;
}
function groupByAndMap(iterable, discriminator, mapper) {
	const map = new Map();
	for (const el of iterable) {
		const key = discriminator(el);
		getFromMap(map, key, () => []).push(mapper(el));
	}
	return map;
}
function groupBy(iterable, discriminator) {
	return groupByAndMap(iterable, discriminator, identity);
}
function collectToMap(iterable, keyExtractor) {
	const map = new Map();
	for (const el of iterable) {
		const key = keyExtractor(el);
		if (map.has(key)) throw new Error(`The elements of iterable are not unique, duplicated key: ${key}`);
		map.set(key, el);
	}
	return map;
}
function splitInChunks(chunkSize, array) {
	return downcast(_chunk(chunkSize, array));
}
function splitUint8ArrayInChunks(chunkSize, array) {
	return downcast(_chunk(chunkSize, array));
}
function _chunk(chunkSize, array) {
	if (chunkSize < 1) return [];
	let chunkNum = 0;
	const chunks = [];
	let end;
	do {
		let start = chunkNum * chunkSize;
		end = start + chunkSize;
		chunks[chunkNum] = array.slice(start, end);
		chunkNum++;
	} while (end < array.length);
	return chunks;
}
function flatMap(array, mapper) {
	const result = [];
	for (const item of array) {
		const mapped = mapper(item);
		result.push(...mapped);
	}
	return result;
}
function insertIntoSortedArray(element, array, comparator, replaceIf = () => false) {
	let i = 0;
	while (i < array.length) {
		const compareResult = comparator(array[i], element);
		if (compareResult === 0 && replaceIf(element, array[i])) {
			array.splice(i, 1, element);
			return;
		} else if (compareResult <= 0) i++;
else break;
	}
	array.splice(i, 0, element);
}
function deduplicate(arr, comp = (a, b) => a === b) {
	const deduplicated = [];
	for (const a of arr) {
		const isDuplicate = deduplicated.some((b) => comp(a, b));
		if (!isDuplicate) deduplicated.push(a);
	}
	return deduplicated;
}
function binarySearch(array, element, compareFn) {
	let m = 0;
	let n = array.length - 1;
	while (m <= n) {
		const k = n + m >> 1;
		const cmp = compareFn(element, array[k]);
		if (cmp > 0) m = k + 1;
else if (cmp < 0) n = k - 1;
else return k;
	}
	return -m - 1;
}
function lastIndex(array) {
	if (array.length === 0) return 0;
else return array.length - 1;
}
function difference(array1, array2, compare$1 = (a, b) => a === b) {
	return array1.filter((element1) => !array2.some((element2) => compare$1(element1, element2)));
}
function symmetricDifference(set1, set2) {
	const diff = new Set();
	for (const el of set1) if (!set2.has(el)) diff.add(el);
	for (const el of set2) if (!set1.has(el)) diff.add(el);
	return diff;
}
function partition(array, predicate) {
	const left = [];
	const right = [];
	for (let item of array) if (predicate(item)) left.push(item);
else right.push(item);
	return [left, right];
}
async function partitionAsync(array, predicate) {
	const left = [];
	const right = [];
	for (let item of array) if (await predicate(item)) left.push(item);
else right.push(item);
	return [left, right];
}
function compare(first$1, second) {
	if (first$1.length > second.length) return 1;
else if (first$1.length < second.length) return -1;
	for (let i = 0; i < first$1.length; i++) {
		const a = first$1[i];
		const b = second[i];
		if (a > b) return 1;
else if (a < b) return -1;
	}
	return 0;
}

//#endregion
//#region packages/tutanota-utils/dist/AsyncResult.js
var AsyncResult = class {
	_state;
	constructor(promise) {
		this._state = pending(promise);
		promise.then((result) => this._state = complete(result)).catch((error) => this._state = failure(error));
	}
	state() {
		return this._state;
	}
};
function pending(promise) {
	return {
		status: "pending",
		promise
	};
}
function complete(result) {
	return {
		status: "complete",
		result
	};
}
function failure(error) {
	return {
		status: "failure",
		error
	};
}

//#endregion
//#region packages/tutanota-utils/dist/CollectionUtils.js
function intersection(set1, set2) {
	return new Set(Array.from(set1).filter((item) => set2.has(item)));
}
function setEquals(set1, set2) {
	if (set1.size !== set2.size) return false;
	for (let item of set1) if (!set2.has(item)) return false;
	return true;
}
function setMap(set, mapper) {
	const result = new Set();
	for (const item of set) result.add(mapper(item));
	return result;
}
function setAddAll(set, toAdd) {
	for (const item of toAdd) set.add(item);
}
function findBy(collection, selector) {
	for (const item of collection) if (selector(item)) return item;
	return null;
}
function mapWith(map, key, value) {
	const newMap = new Map(map);
	newMap.set(key, value);
	return newMap;
}
function mapWithout(map, key) {
	const newMap = new Map(map);
	newMap.delete(key);
	return newMap;
}
function trisectingDiff(before, after) {
	const kept = [];
	const added = [];
	const deleted = [];
	const beforeScratch = new Map(before);
	const afterScratch = new Map(after);
	for (const [k, v] of beforeScratch.entries()) {
		beforeScratch.delete(k);
		if (afterScratch.has(k)) {
			afterScratch.delete(k);
			kept.push(v);
		} else deleted.push(v);
	}
	for (const v of afterScratch.values()) added.push(v);
	return {
		kept,
		added,
		deleted
	};
}

//#endregion
//#region packages/tutanota-utils/dist/DateUtils.js
const DAY_IN_MILLIS = 864e5;
const YEAR_IN_MILLIS = DAY_IN_MILLIS * 365;
const TIMESTAMP_ZERO_YEAR = 0;
function getStartOfNextDay(date) {
	let d = new Date(date.getTime());
	d.setDate(date.getDate() + 1);
	d.setHours(0, 0, 0, 0);
	return d;
}
function getEndOfDay(date) {
	let d = new Date(date.getTime());
	d.setHours(23, 59, 59, 999);
	return d;
}
function getStartOfDay(date) {
	return getHourOfDay(date, 0);
}
function getHourOfDay(date, hour) {
	let d = new Date(date.getTime());
	d.setHours(hour, 0, 0, 0);
	return d;
}
function isToday(date) {
	return new Date().toDateString() === date.toDateString();
}
function isSameDay(date1, date2) {
	return date1.toDateString() === date2.toDateString();
}
function getDayShifted(date, days) {
	return new Date(date.getTime() + days * DAY_IN_MILLIS);
}
function incrementDate(date, byValue) {
	date.setDate(date.getDate() + byValue);
	return date;
}
function incrementMonth(d, byValue) {
	const date = new Date(d);
	date.setMonth(date.getMonth() + byValue);
	return date;
}
function isSameDayOfDate(date1, date2) {
	return !date1 && !date2 || date1 != null && date2 != null && date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}
function formatSortableDate(date) {
	const month = ("0" + (date.getMonth() + 1)).slice(-2);
	const day = ("0" + date.getDate()).slice(-2);
	return `${date.getFullYear()}-${month}-${day}`;
}
function formatSortableDateTime(date) {
	const hours = ("0" + date.getHours()).slice(-2);
	const minutes = ("0" + date.getMinutes()).slice(-2);
	const seconds = ("0" + date.getSeconds()).slice(-2);
	return `${formatSortableDate(date)}-${hours}h${minutes}m${seconds}s`;
}
function sortableTimestamp() {
	return formatSortableDateTime(new Date());
}
function isValidDate(date) {
	return !isNaN(date.getTime());
}
function millisToDays(millis) {
	return millis / DAY_IN_MILLIS;
}
function daysToMillis(days) {
	return days * DAY_IN_MILLIS;
}

//#endregion
//#region packages/tutanota-utils/dist/Encoding.js
function uint8ArrayToArrayBuffer(uint8Array) {
	if (uint8Array.byteLength === uint8Array.buffer.byteLength) return uint8Array.buffer;
else return new Uint8Array(uint8Array).buffer;
}
function hexToBase64(hex) {
	return uint8ArrayToBase64(hexToUint8Array(hex));
}
function base64ToBase64Url(base64) {
	let base64url = base64.replace(/\+/g, "-");
	base64url = base64url.replace(/\//g, "_");
	base64url = base64url.replace(/=/g, "");
	return base64url;
}
function makeLookup(str) {
	const lookup = {};
	for (let i = 0; i < str.length; i++) lookup[str.charAt(i)] = i;
	return lookup;
}
const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64Lookup = makeLookup(base64Alphabet);
const base64extAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
const base64ExtLookup = makeLookup(base64extAlphabet);
function base64ToBase64Ext(base64) {
	base64 = base64.replace(/=/g, "");
	let base64ext = "";
	for (let i = 0; i < base64.length; i++) {
		const index = base64Lookup[base64.charAt(i)];
		base64ext += base64extAlphabet[index];
	}
	return base64ext;
}
function base64ExtToBase64(base64ext) {
	let base64 = "";
	for (let i = 0; i < base64ext.length; i++) {
		const index = base64ExtLookup[base64ext.charAt(i)];
		base64 += base64Alphabet[index];
	}
	let padding;
	if (base64.length % 4 === 2) padding = "==";
else if (base64.length % 4 === 3) padding = "=";
else padding = "";
	return base64 + padding;
}
function base64UrlToBase64(base64url) {
	let base64 = base64url.replace(/-/g, "+");
	base64 = base64.replace(/_/g, "/");
	let nbrOfRemainingChars = base64.length % 4;
	if (nbrOfRemainingChars === 0) return base64;
else if (nbrOfRemainingChars === 2) return base64 + "==";
else if (nbrOfRemainingChars === 3) return base64 + "=";
	throw new Error("Illegal base64 string.");
}
function _stringToUtf8Uint8ArrayLegacy(string) {
	let fixedString;
	try {
		fixedString = encodeURIComponent(string);
	} catch (e) {
		fixedString = encodeURIComponent(_replaceLoneSurrogates(string));
	}
	let utf8 = unescape(fixedString);
	let uint8Array = new Uint8Array(utf8.length);
	for (let i = 0; i < utf8.length; i++) uint8Array[i] = utf8.charCodeAt(i);
	return uint8Array;
}
const REPLACEMENT_CHAR = "�";
function _replaceLoneSurrogates(s) {
	if (s == null) return "";
	let result = [];
	for (let i = 0; i < s.length; i++) {
		let code = s.charCodeAt(i);
		let char = s.charAt(i);
		if (55296 <= code && code <= 56319) if (s.length === i) result.push(REPLACEMENT_CHAR);
else {
			let next = s.charCodeAt(i + 1);
			if (56320 <= next && next <= 57343) {
				result.push(char);
				result.push(s.charAt(i + 1));
				i++;
			} else result.push(REPLACEMENT_CHAR);
		}
else if (56320 <= code && code <= 57343) result.push(REPLACEMENT_CHAR);
else result.push(char);
	}
	return result.join("");
}
const encoder = typeof TextEncoder == "function" ? new TextEncoder() : { encode: _stringToUtf8Uint8ArrayLegacy };
const decoder = typeof TextDecoder == "function" ? new TextDecoder() : { decode: _utf8Uint8ArrayToStringLegacy };
function stringToUtf8Uint8Array(string) {
	return encoder.encode(string);
}
function _utf8Uint8ArrayToStringLegacy(uint8Array) {
	let stringArray = [];
	stringArray.length = uint8Array.length;
	for (let i = 0; i < uint8Array.length; i++) stringArray[i] = String.fromCharCode(uint8Array[i]);
	return decodeURIComponent(escape(stringArray.join("")));
}
function utf8Uint8ArrayToString(uint8Array) {
	return decoder.decode(uint8Array);
}
function hexToUint8Array(hex) {
	let bufView = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bufView.byteLength; i++) bufView[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	return bufView;
}
const hexDigits = "0123456789abcdef";
function uint8ArrayToHex(uint8Array) {
	let hex = "";
	for (let i = 0; i < uint8Array.byteLength; i++) {
		let value = uint8Array[i];
		hex += hexDigits[value >> 4] + hexDigits[value & 15];
	}
	return hex;
}
function uint8ArrayToBase64(bytes) {
	if (bytes.length < 512) return btoa(String.fromCharCode(...bytes));
	let binary = "";
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}
function int8ArrayToBase64(bytes) {
	let converted = new Uint8Array(bytes);
	return uint8ArrayToBase64(converted);
}
function base64ToUint8Array(base64) {
	if (base64.length % 4 !== 0) throw new Error(`invalid base64 length: ${base64} (${base64.length})`);
	const binaryString = atob(base64);
	const result = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) result[i] = binaryString.charCodeAt(i);
	return result;
}
function uint8ArrayToString(charset, bytes) {
	const decoder$1 = new TextDecoder(charset);
	return decoder$1.decode(bytes);
}
function decodeQuotedPrintable(charset, input) {
	return input.replace(/[\t\x20]$/gm, "").replace(/=(?:\r\n?|\n|$)/g, "").replace(/(=([a-fA-F0-9]{2}))+/g, (match) => {
		const hexValues = match.split(/=/);
		hexValues.shift();
		const intArray = hexValues.map((char) => parseInt(char, 16));
		const bytes = Uint8Array.from(intArray);
		return uint8ArrayToString(charset, bytes);
	});
}
function decodeBase64(charset, input) {
	return uint8ArrayToString(charset, base64ToUint8Array(input));
}
function stringToBase64(str) {
	return uint8ArrayToBase64(stringToUtf8Uint8Array(str));
}
function byteArraysToBytes(byteArrays) {
	const totalBytesLength = byteArrays.reduce((acc, element) => acc + element.length, 0);
	const encodingOverhead = byteArrays.length * 2;
	const encodedByteArrays = new Uint8Array(encodingOverhead + totalBytesLength);
	let index = 0;
	for (const byteArray of byteArrays) {
		if (byteArray.length > MAX_ENCODED_BYTES_LENGTH) throw new Error("byte array is to long for encoding");
		index = writeByteArray(encodedByteArrays, byteArray, index);
	}
	return encodedByteArrays;
}
function bytesToByteArrays(encodedByteArrays, expectedByteArrays) {
	const byteArrays = new Array();
	let index = 0;
	while (index < encodedByteArrays.length) {
		const readResult = readByteArray(encodedByteArrays, index);
		byteArrays.push(readResult.byteArray);
		index = readResult.index;
	}
	if (byteArrays.length != expectedByteArrays) throw new Error("invalid amount of key parameters. Expected: " + expectedByteArrays + " actual:" + byteArrays.length);
	return byteArrays;
}
const BYTE_ARRAY_LENGTH_FIELD_SIZE = 2;
const MAX_ENCODED_BYTES_LENGTH = 65535;
function writeByteArray(result, byteArray, index) {
	writeShort(result, byteArray.length, index);
	index += BYTE_ARRAY_LENGTH_FIELD_SIZE;
	result.set(byteArray, index);
	index += byteArray.length;
	return index;
}
function readByteArray(encoded, index) {
	const length = readShort(encoded, index);
	index += BYTE_ARRAY_LENGTH_FIELD_SIZE;
	const byteArray = encoded.slice(index, length + index);
	index += length;
	if (byteArray.length != length) throw new Error("cannot read encoded byte array at pos:" + index + " expected bytes:" + length + " read bytes:" + byteArray.length);
	return {
		index,
		byteArray
	};
}
function writeShort(array, value, index) {
	array[index] = (value & 65280) >> 8;
	array[index + 1] = (value & 255) >> 0;
}
function readShort(array, index) {
	const bytes = array.subarray(index, index + BYTE_ARRAY_LENGTH_FIELD_SIZE);
	let n = 0;
	for (const byte of bytes.values()) n = n << 8 | byte;
	return n;
}

//#endregion
//#region packages/tutanota-utils/dist/LazyLoaded.js
var LazyLoaded = class {
	loadFunction;
	defaultValue;
	state = { state: "not_loaded" };
	/**
	* @param loadFunction The function that actually loads the object as soon as getAsync() is called the first time.
	* @param defaultValue The value that shall be returned by getSync() or getLoaded() as long as the object is not loaded yet.
	*/
	constructor(loadFunction, defaultValue = null) {
		this.loadFunction = loadFunction;
		this.defaultValue = defaultValue;
	}
	load() {
		this.getAsync();
		return this;
	}
	isLoaded() {
		return this.state.state === "loaded";
	}
	isLoadedOrLoading() {
		return this.state.state === "loaded" || this.state.state === "loading";
	}
	/**
	* Loads the object if it is not loaded yet. May be called in parallel and takes care that the load function is only called once.
	*/
	getAsync() {
		switch (this.state.state) {
			case "not_loaded": {
				const loadingPromise = this.loadFunction().then((value) => {
					this.state = {
						state: "loaded",
						value
					};
					return value;
				}, (e) => {
					this.state = { state: "not_loaded" };
					throw e;
				});
				this.state = {
					state: "loading",
					promise: loadingPromise
				};
				return loadingPromise;
			}
			case "loading": return this.state.promise;
			case "loaded": return Promise.resolve(this.state.value);
		}
	}
	/**
	* Returns null if the object is not loaded yet.
	*/
	getSync() {
		return this.state.state === "loaded" ? this.state.value : this.defaultValue;
	}
	/**
	* Only call this function if you know that the object is already loaded.
	*/
	getLoaded() {
		if (this.state.state === "loaded") return this.state.value;
else throw new Error("Not loaded!");
	}
	/**
	* Removes the currently loaded object, so it will be loaded again with the next getAsync() call. Does not set any default value.
	*/
	reset() {
		this.state = { state: "not_loaded" };
		this.defaultValue = null;
	}
	/**
	* Loads the object again and replaces the current one
	*/
	async reload() {
		this.state = { state: "not_loaded" };
		return this.getAsync();
	}
};

//#endregion
//#region packages/tutanota-utils/dist/PromiseMap.js
async function pMap(iterable, mapper, options = {}) {
	const { concurrency = 1 } = options;
	return new Promise((resolve, reject) => {
		if (typeof mapper !== "function") throw new TypeError("Mapper function is required");
		if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
		const result = [];
		const errors = [];
		const iterator = iterable[Symbol.iterator]();
		let isRejected = false;
		let isIterableDone = false;
		let resolvingCount = 0;
		let currentIndex = 0;
		const next = () => {
			if (isRejected) return;
			const nextItem = iterator.next();
			const index = currentIndex;
			currentIndex++;
			if (nextItem.done) {
				isIterableDone = true;
				if (resolvingCount === 0) resolve(result);
				return;
			}
			resolvingCount++;
			(async () => {
				try {
					const element = await nextItem.value;
					result[index] = await mapper(element, index);
					resolvingCount--;
					next();
				} catch (error) {
					isRejected = true;
					reject(error);
				}
			})();
		};
		for (let index = 0; index < concurrency; index++) {
			next();
			if (isIterableDone) break;
		}
	});
}

//#endregion
//#region packages/tutanota-utils/dist/PromiseUtils.js
function mapInCallContext(values, callback) {
	return new PromisableWrapper(_mapInCallContext(values, callback, 0, []));
}
function _mapInCallContext(values, callback, index, acc) {
	if (index >= values.length) return acc;
	let mappedValue = callback(values[index], index);
	if (mappedValue instanceof Promise) return mappedValue.then((v) => {
		acc.push(v);
		return _mapInCallContext(values, callback, index + 1, acc);
	});
else {
		acc.push(mappedValue);
		return _mapInCallContext(values, callback, index + 1, acc);
	}
}
function mapNoFallback(values, callback, options) {
	return PromisableWrapper.from(pMap(values, callback, options));
}
function promiseMapCompat(useMapInCallContext) {
	return useMapInCallContext ? mapInCallContext : mapNoFallback;
}
function flatWrapper(value) {
	return value instanceof PromisableWrapper ? value.value : value;
}
var PromisableWrapper = class PromisableWrapper {
	static from(value) {
		return new PromisableWrapper(value);
	}
	value;
	constructor(value) {
		this.value = value instanceof Promise ? value.then(flatWrapper) : flatWrapper(value);
	}
	thenOrApply(onFulfill, onReject) {
		if (this.value instanceof Promise) {
			const v = this.value.then(onFulfill, onReject);
			return new PromisableWrapper(v);
		} else try {
			return new PromisableWrapper(onFulfill(this.value));
		} catch (e) {
			if (onReject) return new PromisableWrapper(onReject(e));
			throw e;
		}
	}
	toPromise() {
		return Promise.resolve(this.value);
	}
};
function delay(ms) {
	if (Number.isNaN(ms) || ms < 0) throw new Error(`Invalid delay: ${ms}`);
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
function ofClass(cls, catcher) {
	return async (e) => {
		if (e instanceof cls) return catcher(e);
else throw e;
	};
}
async function promiseFilter(iterable, filter) {
	let index = 0;
	const result = [];
	for (let item of iterable) {
		if (await filter(item, index)) result.push(item);
		index++;
	}
	return result;
}
function settledThen(promise, handler) {
	return promise.then(handler, handler);
}

//#endregion
//#region packages/tutanota-utils/dist/SortedArray.js
/**
* Compared based on the type's natural ordering
*/
function numberCompare(a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}
var SortedArray = class SortedArray {
	contents;
	compareFn;
	constructor(contents, compareFn) {
		this.contents = contents;
		this.compareFn = compareFn;
	}
	static fromNumbers(array) {
		return SortedArray.from(array, numberCompare);
	}
	static empty(compareFn) {
		return new SortedArray([], compareFn);
	}
	static from(array, compareFn) {
		const list = new SortedArray([], compareFn);
		list.insertAll(array);
		return list;
	}
	get length() {
		return this.contents.length;
	}
	get array() {
		return this.contents;
	}
	get(index) {
		return this.contents[index];
	}
	insertAll(array) {
		this.contents.push(...array);
		this.contents.sort(this.compareFn);
	}
	insert(item) {
		insertIntoSortedArray(item, this.contents, this.compareFn);
	}
	removeFirst(finder) {
		return findAndRemove(this.contents, finder);
	}
};

//#endregion
//#region packages/tutanota-utils/dist/StringUtils.js
function pad(num, size) {
	let s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}
function startsWith(string, substring) {
	return string.startsWith(substring);
}
function capitalizeFirstLetter(str) {
	return str[0].toUpperCase() + str.toLowerCase().slice(1);
}
function endsWith(string, substring) {
	return string.endsWith(substring);
}
function lazyStringValue(valueOrLazy) {
	return typeof valueOrLazy === "function" ? valueOrLazy() : valueOrLazy;
}
function repeat(value, length) {
	let result = "";
	for (let i = 0; i < length; i++) result += value;
	return result;
}
function cleanMatch(s1, s2) {
	return s1.toLowerCase().trim() === s2.toLowerCase().trim();
}
const NBSP = "\xA0";
function toLowerCase(str) {
	return str.toLowerCase();
}
function localeCompare(a, b) {
	return a.localeCompare(b);
}
function byteLength(str) {
	if (str == null) return 0;
	let s = str.length;
	for (let i = str.length - 1; i >= 0; i--) {
		const code = str.charCodeAt(i);
		if (code > 127 && code <= 2047) s++;
else if (code > 2047 && code <= 65535) s += 2;
		if (code >= 56320 && code <= 57343) i--;
	}
	return s;
}

//#endregion
//#region packages/tutanota-utils/dist/WebAssembly.js
function callWebAssemblyFunctionWithArguments(func, exports, ...args) {
	const argsToPass = [];
	const toFree = [];
	const toClear = [];
	const toOverwrite = [];
	try {
		for (const arg of args) if (arg === null) argsToPass.push(0);
else if (typeof arg === "number") argsToPass.push(arg);
else if (typeof arg === "boolean") argsToPass.push(arg ? 1 : 0);
else if (typeof arg === "string") {
			const s = allocateStringCopy(arg, exports, toFree);
			try {
				toClear.push(s);
				argsToPass.push(s.byteOffset);
				toFree.push(s.byteOffset);
			} catch (e) {
				exports.free(s.byteOffset);
				throw e;
			}
		} else if (arg instanceof MutableUint8Array) {
			const inputOutput = arg.uint8ArrayInputOutput;
			let arrayInWASM;
			if (inputOutput instanceof SecureFreeUint8Array) arrayInWASM = allocateSecureArrayCopy(inputOutput.uint8ArrayInput, exports, toFree, toClear);
else arrayInWASM = allocateArrayCopy(inputOutput, exports, toFree);
			toOverwrite.push({
				arrayInWASM,
				originalBufferYouPassedIn: arg
			});
			argsToPass.push(arrayInWASM.byteOffset);
		} else if (arg instanceof SecureFreeUint8Array) {
			const arrayInWASM = allocateSecureArrayCopy(arg.uint8ArrayInput, exports, toFree, toClear);
			argsToPass.push(arrayInWASM.byteOffset);
		} else if (arg instanceof Uint8Array || arg instanceof Int8Array) {
			const arrayInWASM = allocateArrayCopy(arg, exports, toFree);
			argsToPass.push(arrayInWASM.byteOffset);
		} else throw new Error(`passed an unhandled argument type ${typeof arg}`);
		return func(...argsToPass);
	} finally {
		for (const f of toOverwrite) {
			const inputOutput = f.originalBufferYouPassedIn.uint8ArrayInputOutput;
			if (inputOutput instanceof SecureFreeUint8Array) inputOutput.uint8ArrayInput.set(f.arrayInWASM);
else inputOutput.set(f.arrayInWASM);
		}
		for (const f of toClear) f.fill(0);
		for (const f of toFree) exports.free(f);
	}
}
function allocateBuffer(length, exports) {
	const memory = exports.memory;
	const ptr = exports.malloc(length);
	if (ptr === 0) throw new Error("malloc failed to allocate memory for string");
	try {
		return new Uint8Array(memory.buffer, ptr, length);
	} catch (e) {
		exports.free(ptr);
		throw e;
	}
}
var MutableUint8Array = class {
	uint8ArrayInputOutput;
	constructor(uint8ArrayInputOutput) {
		this.uint8ArrayInputOutput = uint8ArrayInputOutput;
	}
};
var SecureFreeUint8Array = class {
	uint8ArrayInput;
	constructor(uint8ArrayInput) {
		this.uint8ArrayInput = uint8ArrayInput;
	}
};
function mutableSecureFree(array) {
	return new MutableUint8Array(new SecureFreeUint8Array(array));
}
function secureFree(array) {
	return new SecureFreeUint8Array(array);
}
function allocateStringCopy(str, exports, toFree) {
	const strBytes = stringToUtf8Uint8Array(str);
	const allocationAmount = strBytes.length + 1;
	let buf = allocateBuffer(allocationAmount, exports);
	try {
		buf.set(strBytes);
		buf[buf.length - 1] = 0;
		toFree.push(buf.byteOffset);
		return buf;
	} catch (e) {
		exports.free(buf.byteOffset);
		throw e;
	}
}
function allocateArrayCopy(arr, exports, toFree) {
	const allocationAmount = arr.length;
	let buf = allocateBuffer(allocationAmount, exports);
	try {
		buf.set(arr);
		toFree.push(buf.byteOffset);
		return buf;
	} catch (e) {
		exports.free(buf.byteOffset);
		throw e;
	}
}
function allocateSecureArrayCopy(arr, exports, toFree, toClear) {
	const arrayInWASM = allocateArrayCopy(arr, exports, toFree);
	try {
		toClear.push(arrayInWASM);
	} catch (e) {
		arrayInWASM.fill(0);
		throw e;
	}
	return arrayInWASM;
}

//#endregion
//#region packages/tutanota-utils/dist/MathUtils.js
function mod(n, m) {
	return (n % m + m) % m;
}
function clamp(value, min$1, max$1) {
	return Math.max(min$1, Math.min(value, max$1));
}

//#endregion
//#region packages/tutanota-utils/dist/Csv.js
function renderCsv(header, rows, separator = ";") {
	const escapeColumn = (column) => {
		if (!column.includes(separator) && !column.includes("\n") && !column.includes("\"")) return column;
		return `"${column.replaceAll("\"", "\"\"")}"`;
	};
	return [header].concat(rows).map((row) => row.map(escapeColumn).join(separator)).join("\n");
}

//#endregion
//#region packages/tutanota-utils/dist/Tokenizer.js
function tokenize(text) {
	if (text == null) return [];
	let currentWord = [];
	let words = [];
	for (let i = 0; i < text.length; i++) {
		let currentChar = text.charAt(i);
		if (isEndOfWord(currentChar)) {
			addCurrentWord(currentWord, words);
			currentWord = [];
		} else currentWord.push(currentChar);
	}
	addCurrentWord(currentWord, words);
	return words;
}
function addCurrentWord(currentWord, words) {
	while (currentWord.length > 0 && currentWord[0] === "'") currentWord.shift();
	while (currentWord.length > 0 && currentWord[currentWord.length - 1] === "'") currentWord.pop();
	if (currentWord.length > 0) words.push(currentWord.join("").toLowerCase());
}
function isEndOfWord(char) {
	switch (char) {
		case " ":
		case "\n":
		case "\r":
		case "	":
		case "\v":
		case "\f":
		case ".":
		case ",":
		case ":":
		case ";":
		case "!":
		case "?":
		case "&":
		case "\"":
		case "<":
		case ">":
		case "-":
		case "+":
		case "=":
		case "(":
		case ")":
		case "[":
		case "]":
		case "{":
		case "}":
		case "/":
		case "\\":
		case "^":
		case "_":
		case "`":
		case "~":
		case "|":
		case "@": return true;
		default: return false;
	}
}

//#endregion
export { AsyncResult, BoundedExecutor, DAY_IN_MILLIS, LazyLoaded, NBSP, PromisableWrapper, SortedArray, TIMESTAMP_ZERO_YEAR, TypeRef, YEAR_IN_MILLIS, addAll, addressDomain, arrayEquals, arrayEqualsWithPredicate, arrayHash, assert, assertNonNull, assertNotNull, assertValidURL, asyncFind, base64ExtToBase64, base64ToBase64Ext, base64ToBase64Url, base64ToUint8Array, base64UrlToBase64, binarySearch, byteArraysToBytes, byteLength, bytesToByteArrays, callWebAssemblyFunctionWithArguments, capitalizeFirstLetter, clamp, cleanMatch, clear, clone, collectToMap, compare, concat, contains, count, daysToMillis, debounce, debounceStart, decodeBase64, decodeQuotedPrintable, deduplicate, deepEqual, defer, delay, difference, downcast, endsWith, errorToString, filterInt, filterNull, findAll, findAllAndRemove, findAndRemove, findBy, findLast, findLastIndex, first, flatMap, formatSortableDate, formatSortableDateTime, freezeMap, freshVersioned, getAsLazy, getDayShifted, getEndOfDay, getFirstOrThrow, getFromMap, getStartOfDay, getStartOfNextDay, getTypeId, groupBy, groupByAndMap, groupByAndMapUniquely, hexToBase64, hexToUint8Array, identity, incrementDate, incrementMonth, insertIntoSortedArray, insideRect, int8ArrayToBase64, intersection, isEmpty, isNotEmpty, isNotNull, isSameDay, isSameDayOfDate, isSameTypeRef, isSameTypeRefByAttr, isToday, isValidDate, last, lastIndex, lastThrow, lazyMemoized, lazyStringValue, localeCompare, makeSingleUse, mapAndFilterNull, mapLazily, mapMap, mapNullable, mapObject, mapWith, mapWithout, memoized, memoizedWithHiddenArgument, mergeMaps, millisToDays, mod, mutableSecureFree, neverNull, noOp, numberRange, objectEntries, ofClass, pMap, pad, partition, partitionAsync, promiseFilter, promiseMapCompat, randomIntFromInterval, remove, renderCsv, repeat, resolveMaybeLazy, secureFree, setAddAll, setEquals, setMap, settledThen, sortableTimestamp, splitInChunks, splitUint8ArrayInChunks, startsWith, stringToBase64, stringToUtf8Uint8Array, symmetricDifference, throttle, toLowerCase, tokenize, trisectingDiff, typedEntries, typedKeys, typedValues, uint8ArrayToArrayBuffer, uint8ArrayToBase64, uint8ArrayToHex, uint8ArrayToString, utf8Uint8ArrayToString };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzdDItY2h1bmsuanMiLCJuYW1lcyI6WyJtaW4iLCJtYXgiLCJtaW4iLCJtYXgiLCJjb21wYXJlIiwiZmlyc3QiLCJkZWNvZGVyIiwibWluIiwibWF4Il0sInNvdXJjZXMiOlsiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXRpbHMvZGlzdC9UeXBlUmVmLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXRpbHMvZGlzdC9VdGlscy5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLXV0aWxzL2Rpc3QvTWFwVXRpbHMuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L0FycmF5VXRpbHMuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L0FzeW5jUmVzdWx0LmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXRpbHMvZGlzdC9Db2xsZWN0aW9uVXRpbHMuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L0RhdGVVdGlscy5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLXV0aWxzL2Rpc3QvRW5jb2RpbmcuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L0xhenlMb2FkZWQuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L1Byb21pc2VNYXAuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L1Byb21pc2VVdGlscy5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLXV0aWxzL2Rpc3QvU29ydGVkQXJyYXkuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L1N0cmluZ1V0aWxzLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXRpbHMvZGlzdC9XZWJBc3NlbWJseS5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLXV0aWxzL2Rpc3QvTWF0aFV0aWxzLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtdXRpbHMvZGlzdC9Dc3YuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS11dGlscy9kaXN0L1Rva2VuaXplci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFQgc2hvdWxkIGJlIHJlc3RyaWN0ZWQgdG8gRW50aXR5LlxuICovXG5leHBvcnQgY2xhc3MgVHlwZVJlZiB7XG4gICAgYXBwO1xuICAgIHR5cGU7XG4gICAgLyoqXG4gICAgICogRmllbGQgdGhhdCBpcyBuZXZlciBzZXQuIFVzZWQgdG8gbWFrZSB0d28gVHlwZVJlZnMgaW5jb21wYXRpYmxlICh0aGV5IGFyZSBzdHJ1Y3R1cmFsbHkgY29tcGFyZWQgb3RoZXJ3aXNlKS5cbiAgICAgKiBDYW5ub3QgYmUgcHJpdmF0ZS5cbiAgICAgKi9cbiAgICBwaGFudG9tID0gbnVsbDtcbiAgICBjb25zdHJ1Y3RvcihhcHAsIHR5cGUpIHtcbiAgICAgICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIE9iamVjdC5mcmVlemUodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIGJyZWFrcyB3aGVuIHRoZSBvYmplY3QgcGFzc2VzIHdvcmtlciBiYXJyaWVyXG4gICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBgW1R5cGVSZWYgJHt0aGlzLmFwcH0gJHt0aGlzLnR5cGV9XWA7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGVJZCh0eXBlUmVmKSB7XG4gICAgcmV0dXJuIHR5cGVSZWYuYXBwICsgXCIvXCIgKyB0eXBlUmVmLnR5cGU7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNTYW1lVHlwZVJlZkJ5QXR0cih0eXBlUmVmLCBhcHAsIHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIHR5cGVSZWYuYXBwID09PSBhcHAgJiYgdHlwZVJlZi50eXBlID09PSB0eXBlTmFtZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVUeXBlUmVmKHR5cGVSZWYxLCB0eXBlUmVmMikge1xuICAgIHJldHVybiBpc1NhbWVUeXBlUmVmQnlBdHRyKHR5cGVSZWYxLCB0eXBlUmVmMi5hcHAsIHR5cGVSZWYyLnR5cGUpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZVR5cGVSZWZOdWxsYWJsZSh0eXBlUmVmMSwgdHlwZVJlZjIpIHtcbiAgICByZXR1cm4gKHR5cGVSZWYxID09IG51bGwgJiYgdHlwZVJlZjIgPT0gbnVsbCkgfHwgKHR5cGVSZWYxICE9IG51bGwgJiYgdHlwZVJlZjIgIT09IG51bGwgJiYgaXNTYW1lVHlwZVJlZih0eXBlUmVmMSwgdHlwZVJlZjIpKTtcbn1cbiIsImltcG9ydCB7IFR5cGVSZWYgfSBmcm9tIFwiLi9UeXBlUmVmLmpzXCI7XG4vKipcbiAqIENyZWF0ZSBhIHZlcnNpb25lZCBvYmplY3Qgd2l0aCB2ZXJzaW9uIDBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyZXNoVmVyc2lvbmVkKG9iamVjdCkge1xuICAgIHJldHVybiB7IG9iamVjdCwgdmVyc2lvbjogMCB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIGxldCByZXQgPSB7fTtcbiAgICByZXQucHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcmV0LnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICByZXQucmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVmZXJXaXRoSGFuZGxlcihoYW5kbGVyKSB7XG4gICAgY29uc3QgZGVmZXJyZWQgPSB7fTtcbiAgICBkZWZlcnJlZC5wcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0ID0gcmVqZWN0O1xuICAgIH0pLnRoZW4oaGFuZGxlcik7XG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzeW5jRmluZChhcnJheSwgZmluZGVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpdGVtID0gYXJyYXlbaV07XG4gICAgICAgIGlmIChhd2FpdCBmaW5kZXIoaXRlbSwgaSwgYXJyYXkubGVuZ3RoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXN5bmNGaW5kQW5kTWFwKGFycmF5LCBmaW5kZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBhcnJheVtpXTtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gYXdhaXQgZmluZGVyKGl0ZW0sIGksIGFycmF5Lmxlbmd0aCk7XG4gICAgICAgIGlmIChtYXBwZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG4vKipcbiAqIENhbGxzIGFuIGV4ZWN1dG9yIGZ1bmN0aW9uIGZvciBzbGljZXMgb2YgbmJyT2ZFbGVtZW50c0luR3JvdXAgaXRlbXMgb2YgdGhlIGdpdmVuIGFycmF5IHVudGlsIHRoZSBleGVjdXRvciBmdW5jdGlvbiByZXR1cm5zIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluR3JvdXBzKGFycmF5LCBuYnJPZkVsZW1lbnRzSW5Hcm91cCwgZXhlY3V0b3IpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICBsZXQgbmV4dFNsaWNlID0gTWF0aC5taW4oYXJyYXkubGVuZ3RoLCBuYnJPZkVsZW1lbnRzSW5Hcm91cCk7XG4gICAgICAgIHJldHVybiBleGVjdXRvcihhcnJheS5zbGljZSgwLCBuZXh0U2xpY2UpKS50aGVuKChkb0NvbnRpbnVlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9Db250aW51ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlSW5Hcm91cHMoYXJyYXkuc2xpY2UobmV4dFNsaWNlKSwgbmJyT2ZFbGVtZW50c0luR3JvdXAsIGV4ZWN1dG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIG5ldmVyTnVsbChvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xufVxuLyoqXG4gKiByZXR1cm5zIGl0cyBhcmd1bWVudCBpZiBpdCBpcyBub3QgbnVsbCwgdGhyb3dzIG90aGVyd2lzZS5cbiAqIEBwYXJhbSB2YWx1ZSB0aGUgdmFsdWUgdG8gY2hlY2tcbiAqIEBwYXJhbSBtZXNzYWdlIG9wdGlvbmFsIGVycm9yIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdE51bGwodmFsdWUsIG1lc3NhZ2UgPSBcIm51bGxcIikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFzc2VydE5vdE51bGwgZmFpbGVkIDogXCIgKyBtZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuLyoqXG4gKiBhc3NlcnRpb24gZnVuY3Rpb24gdGhhdCBvbmx5IHJldHVybnMgaWYgdGhlIGFyZ3VtZW50IGlzIG5vbi1udWxsXG4gKiAoYWN0cyBhcyBhIHR5cGUgZ3VhcmQpXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHZhbHVlIHRvIGNoZWNrXG4gKiBAcGFyYW0gbWVzc2FnZSBvcHRpb25hbCBlcnJvciBtZXNzYWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb25OdWxsKHZhbHVlLCBtZXNzYWdlID0gXCJudWxsXCIpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnROb25OdWxsIGZhaWxlZDogXCIgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gaXNOb3ROdWxsKHQpIHtcbiAgICByZXR1cm4gdCAhPSBudWxsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydChhc3NlcnRpb24sIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXJlc29sdmVNYXliZUxhenkoYXNzZXJ0aW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2VydGlvbiBmYWlsZWQ6ICR7bWVzc2FnZX1gKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZG93bmNhc3Qob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZShpbnN0YW5jZSkge1xuICAgIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGRvd25jYXN0KGluc3RhbmNlLnNsaWNlKCkpO1xuICAgIH1cbiAgICBlbHNlIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHJldHVybiBkb3duY2FzdChpbnN0YW5jZS5tYXAoKGkpID0+IGNsb25lKGkpKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoaW5zdGFuY2UuZ2V0VGltZSgpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaW5zdGFuY2UgaW5zdGFuY2VvZiBUeXBlUmVmKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaW5zdGFuY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgLy8gQ2FuIG9ubHkgcGFzcyBudWxsIG9yIE9iamVjdCwgY2Fubm90IHBhc3MgdW5kZWZpbmVkXG4gICAgICAgIGNvbnN0IGNvcHkgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnN0YW5jZSkgfHwgbnVsbCk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY29weSwgaW5zdGFuY2UpO1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29weSkpIHtcbiAgICAgICAgICAgIGNvcHlba2V5XSA9IGNsb25lKGNvcHlba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxufVxuLyoqXG4gKiBGdW5jdGlvbiB3aGljaCBhY2NlcHRzIGFub3RoZXIgZnVuY3Rpb24uIE9uIGZpcnN0IGludm9jYXRpb25cbiAqIG9mIHRoaXMgcmVzdWx0aW5nIGZ1bmN0aW9uIHJlc3VsdCB3aWxsIGJlIHJlbWVtYmVyZWQgYW5kIHJldHVybmVkXG4gKiBvbiBjb25zZXF1ZW50IGludm9jYXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGF6eU1lbW9pemVkKHNvdXJjZSkge1xuICAgIC8vIFVzaW5nIHNlcGFyYXRlIHZhcmlhYmxlIGZvciB0cmFja2luZyBiZWNhdXNlIHZhbHVlIGNhbiBiZSB1bmRlZmluZWQgYW5kIHdlIHdhbnQgdG8gdGhlIGZ1bmN0aW9uIGNhbGwgb25seSBvbmNlXG4gICAgbGV0IGNhY2hlZCA9IGZhbHNlO1xuICAgIGxldCB2YWx1ZTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuICh2YWx1ZSA9IHNvdXJjZSgpKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIGFjY2VwdCBhIGZ1bmN0aW9uIHRha2luZyBleGFjdGx5IG9uZSBhcmd1bWVudCBhbmQgcmV0dXJuaW5nIG5vdGhpbmcgYW5kIHJldHVybiBhIHZlcnNpb24gb2YgaXRcbiAqIHRoYXQgd2lsbCBjYWxsIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBvbiB0aGUgZmlyc3QgY2FsbCBhbmQgaWdub3JlIGFueSBmdXJ0aGVyIGNhbGxzLlxuICogQHBhcmFtIGZuIGEgZnVuY3Rpb24gdGFraW5nIG9uZSBhcmd1bWVudCBhbmQgcmV0dXJuaW5nIG5vdGhpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VTaW5nbGVVc2UoZm4pIHtcbiAgICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIChhcmcpID0+IHtcbiAgICAgICAgaWYgKCFjYWxsZWQpIHtcbiAgICAgICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBmbihhcmcpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbi8qKlxuICogUmV0dXJucyBhIGNhY2hlZCB2ZXJzaW9uIG9mIHtAcGFyYW0gZm59LlxuICogQ2FjaGVkIGZ1bmN0aW9uIGNoZWNrcyB0aGF0IGFyZ3VtZW50IGlzIHRoZSBzYW1lICh3aXRoID09PSkgYW5kIGlmIGl0IGlzIHRoZW4gaXQgcmV0dXJucyB0aGUgY2FjaGVkIHJlc3VsdC5cbiAqIElmIHRoZSBjYWNoZWQgYXJndW1lbnQgaGFzIGNoYW5nZWQgdGhlbiB7QHBhcmFtIGZufSB3aWxsIGJlIGNhbGxlZCB3aXRoIG5ldyBhcmd1bWVudCBhbmQgcmVzdWx0IHdpbGwgYmUgY2FjaGVkIGFnYWluLlxuICogT25seSByZW1lbWJlcnMgdGhlIGxhc3QgYXJndW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZW1vaXplZChmbikge1xuICAgIGxldCBsYXN0QXJnO1xuICAgIGxldCBsYXN0UmVzdWx0O1xuICAgIGxldCBkaWRDYWNoZSA9IGZhbHNlO1xuICAgIHJldHVybiAoYXJnKSA9PiB7XG4gICAgICAgIGlmICghZGlkQ2FjaGUgfHwgYXJnICE9PSBsYXN0QXJnKSB7XG4gICAgICAgICAgICBsYXN0QXJnID0gYXJnO1xuICAgICAgICAgICAgZGlkQ2FjaGUgPSB0cnVlO1xuICAgICAgICAgICAgbGFzdFJlc3VsdCA9IGZuKGFyZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhc3RSZXN1bHQ7XG4gICAgfTtcbn1cbi8qKlxuICogTGlrZSB7QGxpbmsgbWVtb2l6ZWR9IGJ1dCB0aGUgYXJndW1lbnQgaXMgcGFzc2VkIGluIHZpYSB7QHBhcmFtIGFyZ3VtZW50UHJvdmlkZXJ9LlxuICogVXNlZnVsIGZvciB0aGUgY2FzZXMgd2hlcmUgd2Ugd2FudCB0byBrZWVwIG9ubHkgb25lIGZpZWxkIGFyb3VuZCBlLmcuIGZvciBsYXp5IGdldHRlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lbW9pemVkV2l0aEhpZGRlbkFyZ3VtZW50KGFyZ3VtZW50UHJvdmlkZXIsIGNvbXB1dGF0aW9uRnVuY3Rpb24pIHtcbiAgICBjb25zdCBtZW1vaXplZENvbXB1dGF0aW9uID0gbWVtb2l6ZWQoY29tcHV0YXRpb25GdW5jdGlvbik7XG4gICAgcmV0dXJuICgpID0+IG1lbW9pemVkQ29tcHV0YXRpb24oYXJndW1lbnRQcm92aWRlcigpKTtcbn1cbi8qKlxuICogRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB3aGF0IHdhcyBwYXNzZWQgaW50byBpdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpdHkodCkge1xuICAgIHJldHVybiB0O1xufVxuLyoqXG4gKiBGdW5jdGlvbiB3aGljaCBkb2VzIG5vdGhpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub09wKCkgeyB9XG4vKipcbiAqIFJldHVybiBhIGZ1bmN0aW9uLCB3aGljaCBleGVjdXRlZCB7QHBhcmFtIHRvVGhyb3R0bGV9IG9ubHkgYWZ0ZXIgaXQgaXMgbm90IGludm9rZWQgZm9yIHtAcGFyYW0gdGltZW91dH0gbXMuXG4gKiBFeGVjdXRlcyBmdW5jdGlvbiB3aXRoIHRoZSBsYXN0IHBhc3NlZCBhcmd1bWVudHNcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2UodGltZW91dCwgdG9UaHJvdHRsZSkge1xuICAgIGxldCB0aW1lb3V0SWQ7XG4gICAgbGV0IHRvSW52b2tlO1xuICAgIHJldHVybiBkb3duY2FzdCgoLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAodGltZW91dElkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgfVxuICAgICAgICB0b0ludm9rZSA9IHRvVGhyb3R0bGUuYmluZChudWxsLCAuLi5hcmdzKTtcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCh0b0ludm9rZSwgdGltZW91dCk7XG4gICAgfSk7XG59XG4vKipcbiAqIFJldHVybnMgYSBkZWJvdW5jZWQgZnVuY3Rpb24uIFdoZW4gaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUsIHdpbGwganVzdCBpbnZva2VcbiAqIHtAcGFyYW0gdG9UaHJvdHRsZX0uIE9uIHN1YnNlcXVlbnQgaW52b2NhdGlvbnMgaXQgd2lsbCBlaXRoZXIgaW52b2tlIGl0IHJpZ2h0IGF3YXlcbiAqIChpZiB7QHBhcmFtIHRpbWVvdXR9IGhhcyBwYXNzZWQpIG9yIHdpbGwgc2NoZWR1bGUgaXQgdG8gYmUgcnVuIGFmdGVyIHtAcGFyYW0gdGltZW91dH0uXG4gKiBTbyB0aGUgZmlyc3QgYW5kIHRoZSBsYXN0IGludm9jYXRpb25zIGluIGEgc2VyaWVzIG9mIGludm9jYXRpb25zIGFsd2F5cyB0YWtlIHBsYWNlXG4gKiBidXQgb25lcyBpbiB0aGUgbWlkZGxlICh3aGljaCBoYXBwZW4gdG9vIG9mdGVuKSBhcmUgZGlzY2FyZGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2VTdGFydCh0aW1lb3V0LCB0b1Rocm90dGxlKSB7XG4gICAgbGV0IHRpbWVvdXRJZDtcbiAgICBsZXQgbGFzdEludm9rZWQgPSAwO1xuICAgIHJldHVybiBkb3duY2FzdCgoLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIGxhc3RJbnZva2VkIDwgdGltZW91dCkge1xuICAgICAgICAgICAgaWYgKHRpbWVvdXRJZClcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRpbWVvdXRJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdG9UaHJvdHRsZS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdG9UaHJvdHRsZS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0SW52b2tlZCA9IERhdGUubm93KCk7XG4gICAgfSk7XG59XG4vKipcbiAqIFJldHVybnMgYSB0aHJvdHRsZWQgZnVuY3Rpb24uIFdoZW4gaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUgd2lsbCBzY2hlZHVsZSB7QHBhcmFtIHRvVGhyb3R0bGV9XG4gKiB0byBiZSBjYWxsZWQgYWZ0ZXIge0BwYXJhbSBwZXJpb2RNc30uIE9uIHN1YnNlcXVlbnQgaW52b2NhdGlvbnMgYmVmb3JlIHtAcGFyYW0gcGVyaW9kTXN9IGFtb3VudCBvZlxuICogdGltZSBwYXNzZXMgaXQgd2lsbCByZXBsYWNlIHRoZSBhcmd1bWVudHMgZm9yIHRoZSBzY2hlZHVsZWQgY2FsbCAod2l0aG91dCByZXNjaGVkdWxpbmcpLiBBZnRlclxuICoge0BwYXJhbSBwZXJpb2R9IGFtb3VudCBvZiB0aW1lIHBhc3NlcyBpdCB3aWxsIGZpbmFsbHkgY2FsbCB7QHBhcmFtIHRvVGhyb3R0bGV9IHdpdGggdGhlIGFyZ3VtZW50c1xuICogb2YgdGhlIGxhc3QgY2FsbC4gTmV3IGNhbGxzIGFmdGVyIHRoYXQgd2lsbCBiZWhhdmUgbGlrZSBkZXNjcmliZWQgaW4gdGhlIGJlZ2lubmluZy5cbiAqXG4gKiBUaGlzIG1ha2VzIHN1cmUgdGhhdCB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkIG5vdCBtb3JlIG9mdGVuIGJ1dCBhbHNvIGF0IG1vc3QgYWZ0ZXIge0BwYXJhbSBwZXJpb2RNc31cbiAqIGFtb3VudCBvZiB0aW1lLiBVbmxpa2Uge0BsaW5rIGRlYm91bmNlfSwgaXQgd2lsbCBnZXQgY2FsbGVkIGFmdGVyIHtAcGFyYW0gcGVyaW9kTXN9IGV2ZW4gaWYgaXRcbiAqIGlzIGJlaW5nIGNhbGxlZCByZXBlYXRlZGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3R0bGUocGVyaW9kTXMsIHRvVGhyb3R0bGUpIHtcbiAgICBsZXQgbGFzdEFyZ3MgPSBudWxsO1xuICAgIHJldHVybiAoKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgaWYgKGxhc3RBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0b1Rocm90dGxlLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdEFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHBlcmlvZE1zKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbUludEZyb21JbnRlcnZhbChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yVG9TdHJpbmcoZXJyb3IpIHtcbiAgICBsZXQgZXJyb3JTdHJpbmcgPSBlcnJvci5uYW1lID8gZXJyb3IubmFtZSA6IFwiP1wiO1xuICAgIGlmIChlcnJvci5tZXNzYWdlKSB7XG4gICAgICAgIGVycm9yU3RyaW5nICs9IGBcXG4gRXJyb3IgbWVzc2FnZTogJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgfVxuICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICAvLyB0aGUgZXJyb3IgaWQgaXMgaW5jbHVkZWQgaW4gdGhlIHN0YWNrdHJhY2VcbiAgICAgICAgZXJyb3JTdHJpbmcgKz0gYFxcblN0YWNrdHJhY2U6IFxcbiR7ZXJyb3Iuc3RhY2t9YDtcbiAgICB9XG4gICAgcmV0dXJuIGVycm9yU3RyaW5nO1xufVxuLyoqXG4gKiBMaWtlIHtAbGluayBPYmplY3QuZW50cmllc30gYnV0IHByZXNlcnZlcyB0aGUgdHlwZSBvZiB0aGUga2V5IGFuZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0RW50cmllcyhvYmplY3QpIHtcbiAgICByZXR1cm4gZG93bmNhc3QoT2JqZWN0LmVudHJpZXMob2JqZWN0KSk7XG59XG4vKipcbiAqIG1vZGlmaWVkIGRlZXBFcXVhbHMgZnJvbSBvc3BlYyBpcyBvbmx5IG5lZWRlZCBhcyBsb25nIGFzIHdlIHVzZSBjdXN0b20gY2xhc3NlcyAoVHlwZVJlZikgYW5kIERhdGUgaXMgbm90IHByb3Blcmx5IGhhbmRsZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZXBFcXVhbChhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICh4b3IoYSA9PT0gbnVsbCwgYiA9PT0gbnVsbCkgfHwgeG9yKGEgPT09IHVuZGVmaW5lZCwgYiA9PT0gdW5kZWZpbmVkKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBjb25zdCBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSksIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgICAgICAgaWYgKGEubGVuZ3RoID09PSBiLmxlbmd0aCAmJiAoKGEgaW5zdGFuY2VvZiBBcnJheSAmJiBiIGluc3RhbmNlb2YgQXJyYXkpIHx8IChhSXNBcmdzICYmIGJJc0FyZ3MpKSkge1xuICAgICAgICAgICAgY29uc3QgYUtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhKSwgYktleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhiKTtcbiAgICAgICAgICAgIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChiLCBhS2V5c1tpXSkgfHwgIWRlZXBFcXVhbChhW2FLZXlzW2ldXSwgYlthS2V5c1tpXV0pKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgICAgICAgICByZXR1cm4gYS5nZXRUaW1lKCkgPT09IGIuZ2V0VGltZSgpO1xuICAgICAgICAvLyBmb3IgKGxldCAuLiBpbiAuLikgZG9lc24ndCB3b3JrIHdpdGggbWFwc1xuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIE1hcCAmJiBiIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBhLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmICghYi5oYXMoa2V5KSB8fCAhZGVlcEVxdWFsKGEuZ2V0KGtleSksIGIuZ2V0KGtleSkpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBiLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGlmICghYS5oYXMoa2V5KSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBPYmplY3QgJiYgYiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhYUlzQXJncyAmJiAhYklzQXJncykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSBpbiBhKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoaSBpbiBiKSB8fCAhZGVlcEVxdWFsKGFbaV0sIGJbaV0pKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpIGluIGIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShpIGluIGEpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBAdHMtaWdub3JlOiB3ZSB3b3VsZCBuZWVkIHRvIGluY2x1ZGUgYWxsIEB0eXBlcy9ub2RlIGZvciB0aGlzIHRvIHdvcmsgb3IgaW1wb3J0IGl0IGV4cGxpY2l0bHkuIFNob3VsZCBwcm9iYWJseSBiZSByZXdyaXR0ZW4gZm9yIGFsbCB0eXBlZCBhcnJheXMuXG4gICAgICAgIGlmICh0eXBlb2YgQnVmZmVyID09PSBcImZ1bmN0aW9uXCIgJiYgYSBpbnN0YW5jZW9mIEJ1ZmZlciAmJiBiIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiB4b3IoYSwgYikge1xuICAgIGNvbnN0IGFCb29sID0gISFhO1xuICAgIGNvbnN0IGJCb29sID0gISFiO1xuICAgIHJldHVybiAoYUJvb2wgJiYgIWJCb29sKSB8fCAoYkJvb2wgJiYgIWFCb29sKTtcbn1cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKGEpIHtcbiAgICBpZiAoXCJjYWxsZWVcIiBpbiBhKSB7XG4gICAgICAgIGZvciAobGV0IGkgaW4gYSlcbiAgICAgICAgICAgIGlmIChpID09PSBcImNhbGxlZVwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuY29uc3QgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHk7XG4vKipcbiAqIHJldHVybnMgYW4gYXJyYXkgb2YgdG9wLWxldmVsIHByb3BlcnRpZXMgdGhhdCBhcmUgaW4gYm90aCBvYmpBIGFuZCBvYmpCLCBidXQgZGlmZmVyIGluIHZhbHVlXG4gKiBkb2VzIG5vdCBoYW5kbGUgZnVuY3Rpb25zIG9yIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAqIHRyZWF0cyB1bmRlZmluZWQgYW5kIG51bGwgYXMgZXF1YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoYW5nZWRQcm9wcyhvYmpBLCBvYmpCKSB7XG4gICAgaWYgKG9iakEgPT0gbnVsbCB8fCBvYmpCID09IG51bGwgfHwgb2JqQSA9PT0gb2JqQilcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmpBKVxuICAgICAgICAuZmlsdGVyKChrKSA9PiBPYmplY3Qua2V5cyhvYmpCKS5pbmNsdWRlcyhrKSlcbiAgICAgICAgLmZpbHRlcigoaykgPT4gIVtudWxsLCB1bmRlZmluZWRdLmluY2x1ZGVzKG9iakFba10pIHx8ICFbbnVsbCwgdW5kZWZpbmVkXS5pbmNsdWRlcyhvYmpCW2tdKSlcbiAgICAgICAgLmZpbHRlcigoaykgPT4gIWRlZXBFcXVhbChvYmpBW2tdLCBvYmpCW2tdKSk7XG59XG4vKipcbiAqIERpc2FsbG93IHNldCwgZGVsZXRlIGFuZCBjbGVhciBvbiBNYXAuXG4gKiBJbXBvcnRhbnQ6IEl0IGlzICpub3QqIGEgZGVlcCBmcmVlemUuXG4gKiBAcGFyYW0gbXlNYXBcbiAqIEByZXR1cm4ge3Vua25vd259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcmVlemVNYXAobXlNYXApIHtcbiAgICBmdW5jdGlvbiBtYXBTZXQoa2V5LCB2YWx1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBhZGQgcHJvcGVydHkgXCIgKyBrZXkgKyBcIiwgbWFwIGlzIG5vdCBleHRlbnNpYmxlXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXBEZWxldGUoa2V5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGRlbGV0ZSBwcm9wZXJ0eSBcIiArIGtleSArIFwiLCBtYXAgaXMgZnJvemVuXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXBDbGVhcigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgY2xlYXIgbWFwLCBtYXAgaXMgZnJvemVuXCIpO1xuICAgIH1cbiAgICBjb25zdCBhbnlNYXAgPSBkb3duY2FzdChteU1hcCk7XG4gICAgYW55TWFwLnNldCA9IG1hcFNldDtcbiAgICBhbnlNYXAuZGVsZXRlID0gbWFwRGVsZXRlO1xuICAgIGFueU1hcC5jbGVhciA9IG1hcENsZWFyO1xuICAgIE9iamVjdC5mcmVlemUoYW55TWFwKTtcbiAgICByZXR1cm4gYW55TWFwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGFkZHJlc3NEb21haW4oc2VuZGVyQWRkcmVzcykge1xuICAgIHJldHVybiBzZW5kZXJBZGRyZXNzLnNsaWNlKHNlbmRlckFkZHJlc3MubGFzdEluZGV4T2YoXCJAXCIpICsgMSk7XG59XG4vKipcbiAqIElnbm9yZXMgdGhlIGZhY3QgdGhhdCBPYmplY3Qua2V5cyByZXR1cm5zIGFsc28gbm90IG93bmVkIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0eXBlZEtleXMob2JqKSB7XG4gICAgcmV0dXJuIGRvd25jYXN0KE9iamVjdC5rZXlzKG9iaikpO1xufVxuLyoqXG4gKiBJZ25vcmVzIHRoZSBmYWN0IHRoYXQgT2JqZWN0LmtleXMgcmV0dXJucyBhbHNvIG5vdCBvd25lZCBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHlwZWRFbnRyaWVzKG9iaikge1xuICAgIHJldHVybiBkb3duY2FzdChPYmplY3QuZW50cmllcyhvYmopKTtcbn1cbi8qKlxuICogSWdub3JlcyB0aGUgZmFjdCB0aGF0IE9iamVjdC5rZXlzIHJldHVybnMgYWxzbyBub3Qgb3duZWQgcHJvcGVydGllcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR5cGVkVmFsdWVzKG9iaikge1xuICAgIHJldHVybiBkb3duY2FzdChPYmplY3QudmFsdWVzKG9iaikpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVNYXliZUxhenkobWF5YmUpIHtcbiAgICByZXR1cm4gdHlwZW9mIG1heWJlID09PSBcImZ1bmN0aW9uXCIgPyBtYXliZSgpIDogbWF5YmU7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNMYXp5KG1heWJlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBtYXliZSA9PT0gXCJmdW5jdGlvblwiID8gZG93bmNhc3QobWF5YmUpIDogKCkgPT4gbWF5YmU7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwTGF6aWx5KG1heWJlLCBtYXBwaW5nKSB7XG4gICAgcmV0dXJuICgpID0+IG1hcHBpbmcocmVzb2x2ZU1heWJlTGF6eShtYXliZSkpO1xufVxuLyoqXG4gKiBTdHJpY3RlciB2ZXJzaW9uIG9mIHBhcnNlSW50KCkgZnJvbSBNRE4uIHBhcnNlSW50KCkgYWxsb3dzIHNvbWUgYXJiaXRyYXJ5IGNoYXJhY3RlcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLlxuICogUmV0dXJucyBOYU4gaW4gY2FzZSB0aGVyZSdzIGFueXRoaW5nIG5vbi1udW1iZXIgaW4gdGhlIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckludCh2YWx1ZSkge1xuICAgIGlmICgvXlxcZCskLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGluc2lkZVJlY3QocG9pbnQsIHJlY3QpIHtcbiAgICByZXR1cm4gcG9pbnQueCA+PSByZWN0LmxlZnQgJiYgcG9pbnQueCA8IHJlY3QucmlnaHQgJiYgcG9pbnQueSA+PSByZWN0LnRvcCAmJiBwb2ludC55IDwgcmVjdC5ib3R0b207XG59XG4vKipcbiAqIElmIHZhbCBpcyBub24gbnVsbCwgcmV0dXJucyB0aGUgcmVzdWx0IG9mIHZhbCBwYXNzZWQgdG8gYWN0aW9uLCBlbHNlIG51bGxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcE51bGxhYmxlKHZhbCwgYWN0aW9uKSB7XG4gICAgaWYgKHZhbCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGFjdGlvbih2YWwpO1xuICAgICAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwT2JqZWN0KG1hcHBlciwgb2JqKSB7XG4gICAgY29uc3QgbmV3T2JqID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuICAgICAgICBjb25zdCB0eXBlZEtleSA9IGtleTtcbiAgICAgICAgbmV3T2JqW3R5cGVkS2V5XSA9IG1hcHBlcihvYmpbdHlwZWRLZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld09iajtcbn1cbi8qKlxuICogUnVuIGpvYnMgd2l0aCBkZWZpbmVkIG1heCBwYXJhbGxlbGlzbS5cbiAqL1xuZXhwb3J0IGNsYXNzIEJvdW5kZWRFeGVjdXRvciB7XG4gICAgbWF4UGFyYWxsZWxKb2JzO1xuICAgIHJ1bm5pbmdKb2JzQ291bnQgPSAwO1xuICAgIGN1cnJlbnRKb2IgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICBjb25zdHJ1Y3RvcihtYXhQYXJhbGxlbEpvYnMpIHtcbiAgICAgICAgdGhpcy5tYXhQYXJhbGxlbEpvYnMgPSBtYXhQYXJhbGxlbEpvYnM7XG4gICAgfVxuICAgIGFzeW5jIHJ1bihqb2IpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMucnVubmluZ0pvYnNDb3VudCA9PT0gdGhpcy5tYXhQYXJhbGxlbEpvYnMpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY3VycmVudEpvYjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bm5pbmdKb2JzQ291bnQrKztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGpvYlJlc3VsdCA9IGpvYigpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Sm9iID0gam9iUmVzdWx0LmNhdGNoKG5vT3ApO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGpvYlJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZ0pvYnNDb3VudC0tO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFZhbGlkVVJMKHVybCkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgVVJMKHVybCk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBuZXZlck51bGwgfSBmcm9tIFwiLi9VdGlscy5qc1wiO1xuLyoqXG4gKiBNZXJnZXMgbXVsdGlwbGUgbWFwcyBpbnRvIGEgc2luZ2xlIG1hcCB3aXRoIGxpc3RzIG9mIHZhbHVlcy5cbiAqIEBwYXJhbSBtYXBzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZU1hcHMobWFwcykge1xuICAgIHJldHVybiBtYXBzLnJlZHVjZSgobWVyZ2VkTWFwLCBtYXApID0+IHtcbiAgICAgICAgLy8gbWVyZ2Ugc2FtZSBrZXkgb2YgbXVsdGlwbGUgYXR0cmlidXRlc1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBtYXAuZW50cmllcygpKSB7XG4gICAgICAgICAgICBpZiAobWVyZ2VkTWFwLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgbmV2ZXJOdWxsKG1lcmdlZE1hcC5nZXQoa2V5KSkucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRNYXAuc2V0KGtleSwgW3ZhbHVlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lcmdlZE1hcDtcbiAgICB9LCBuZXcgTWFwKCkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyb21NYXAobWFwLCBrZXksIGJ5RGVmYXVsdCkge1xuICAgIGxldCB2YWx1ZSA9IG1hcC5nZXQoa2V5KTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHZhbHVlID0gYnlEZWZhdWx0KCk7XG4gICAgICAgIG1hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbi8qKiBDcmVhdGVzIGEgbmV3IG1hcCB3aXRoIGtleSBhbmQgdmFsdWUgYWRkZWQgdG8ge0BwYXJhbSBtYXB9LiBJdCBpcyBsaWtlIHNldCgpIGJ1dCBmb3IgaW1tdXRhYmxlIG1hcC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRNYXBFbnRyeShtYXAsIGtleSwgdmFsdWUpIHtcbiAgICBjb25zdCBuZXdNYXAgPSBuZXcgTWFwKG1hcCk7XG4gICAgbmV3TWFwLnNldChrZXksIHZhbHVlKTtcbiAgICByZXR1cm4gbmV3TWFwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZU1hcEVudHJ5KG1hcCwga2V5KSB7XG4gICAgY29uc3QgbmV3TWFwID0gbmV3IE1hcChtYXApO1xuICAgIG5ld01hcC5kZWxldGUoa2V5KTtcbiAgICByZXR1cm4gbmV3TWFwO1xufVxuLyoqXG4gKiBDb252ZXJ0IHZhbHVlcyBvZiB7QHBhcmFtIG1hcH0gdXNpbmcge0BwYXJhbSBtYXBwZXJ9IGxpa2Uge0BsaW5rIEFycmF5LnByb3RvdHlwZS5tYXB9LFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwTWFwKG1hcCwgbWFwcGVyKSB7XG4gICAgY29uc3QgcmVzdWx0TWFwID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgW2tleSwgb2xkVmFsdWVdIG9mIG1hcCkge1xuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IG1hcHBlcihvbGRWYWx1ZSk7XG4gICAgICAgIHJlc3VsdE1hcC5zZXQoa2V5LCBuZXdWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRNYXA7XG59XG4iLCJpbXBvcnQgeyBkb3duY2FzdCwgaWRlbnRpdHksIG5ldmVyTnVsbCB9IGZyb20gXCIuL1V0aWxzLmpzXCI7XG5pbXBvcnQgeyBnZXRGcm9tTWFwIH0gZnJvbSBcIi4vTWFwVXRpbHMuanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBjb25jYXQoLi4uYXJyYXlzKSB7XG4gICAgbGV0IGxlbmd0aCA9IGFycmF5cy5yZWR1Y2UoKHByZXZpb3VzLCBjdXJyZW50KSA9PiBwcmV2aW91cyArIGN1cnJlbnQubGVuZ3RoLCAwKTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIGZvciAoY29uc3QgYXJyYXkgb2YgYXJyYXlzKSB7XG4gICAgICAgIHJlc3VsdC5zZXQoYXJyYXksIGluZGV4KTtcbiAgICAgICAgaW5kZXggKz0gYXJyYXkubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLyoqXG4gKiBDcmVhdGUgYW4gYXJyYXkgZmlsbGVkIHdpdGggdGhlIG51bWJlcnMgbWluLi5tYXggKGluY2x1c2l2ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG51bWJlclJhbmdlKG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIFsuLi5BcnJheShtYXggKyAxKS5rZXlzKCldLnNsaWNlKG1pbik7XG59XG4vKipcbiAqIENvbXBhcmVzIHR3byBhcnJheXMgZm9yIGVxdWFsaXR5IGJhc2VkIG9uID09PS5cbiAqIEBwYXJhbSB7QXJyYXl9IGExIFRoZSBmaXJzdCBhcnJheS5cbiAqIEBwYXJhbSB7QXJyYXl9IGEyIFRoZSBzZWNvbmQgYXJyYXkuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBhcnJheXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogSXQgaXMgdmFsaWQgdG8gY29tcGFyZSBVaW50OEFycmF5IHRvIEFycmF5PFQ+LCBkb24ndCByZXN0cmljdCBpdCB0byBiZSBvbmUgdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlFcXVhbHMoYTEsIGEyKSB7XG4gICAgaWYgKGExID09PSBhMikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGExLmxlbmd0aCA9PT0gYTIubGVuZ3RoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYTEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhMVtpXSAhPT0gYTJbaV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbi8qKlxuICogQ29tcGFyZXMgdHdvIGFycmF5cyBmb3IgZXF1YWxpdHkgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIEBwYXJhbSBhMVxuICogQHBhcmFtIGEyXG4gKiBAcGFyYW0gcHJlZGljYXRlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5RXF1YWxzV2l0aFByZWRpY2F0ZShhMSwgYTIsIHByZWRpY2F0ZSkge1xuICAgIGlmIChhMS5sZW5ndGggPT09IGEyLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGExLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXByZWRpY2F0ZShhMVtpXSwgYTJbaV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gYXJyYXlIYXNoKGFycmF5KSB7XG4gICAgbGV0IGhhc2ggPSAwO1xuICAgIGhhc2ggfD0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhhc2ggPSAoaGFzaCA8PCA1KSAtIGhhc2ggKyBhcnJheVtpXTtcbiAgICAgICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG59XG4vKipcbiAqIFJlbW92ZSB0aGUgZWxlbWVudCBmcm9tIHRoZUFycmF5IGlmIGl0IGlzIGNvbnRhaW5lZCBpbiB0aGUgYXJyYXkuXG4gKiBAcGFyYW0gdGhlQXJyYXkgVGhlIGFycmF5IHRvIHJlbW92ZSB0aGUgZWxlbWVudCBmcm9tLlxuICogQHBhcmFtIGVsZW1lbnRUb1JlbW92ZSBUaGUgZWxlbWVudCB0byByZW1vdmUgZnJvbSB0aGUgYXJyYXkuXG4gKiBAcmV0dXJuIFRydWUgaWYgdGhlIGVsZW1lbnQgd2FzIHJlbW92ZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZSh0aGVBcnJheSwgZWxlbWVudFRvUmVtb3ZlKSB7XG4gICAgbGV0IGkgPSB0aGVBcnJheS5pbmRleE9mKGVsZW1lbnRUb1JlbW92ZSk7XG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgIHRoZUFycmF5LnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLyoqXG4gKiB0cnVuY2F0ZXMgdGhlIGFycmF5IGFuZCBkaXNjYXJkcyBhbGwgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyKHRoZUFycmF5KSB7XG4gICAgdGhlQXJyYXkubGVuZ3RoID0gMDtcbn1cbi8qKlxuICogRmluZCBhbGwgaXRlbXMgaW4gYW4gYXJyYXkgdGhhdCBwYXNzIHRoZSBnaXZlbiBwcmVkaWNhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGwodGhlQXJyYXksIGZpbmRlcikge1xuICAgIGNvbnN0IGZvdW5kID0gW107XG4gICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGVBcnJheSkge1xuICAgICAgICBpZiAoZmluZGVyKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICBmb3VuZC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbn1cbi8qKlxuICogQHBhcmFtIHRoZUFycmF5XG4gKiBAcGFyYW0gZmluZGVyXG4gKiBAcmV0dXJuIHtib29sZWFufSBpZiB0aGUgZWxlbWVudCB3YXMgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbmRSZW1vdmUodGhlQXJyYXksIGZpbmRlcikge1xuICAgIGNvbnN0IGluZGV4ID0gdGhlQXJyYXkuZmluZEluZGV4KGZpbmRlcik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICB0aGVBcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4vKiogZmluZCBhbGwgbWF0Y2hlcyBpbnNpZGUgYW4gYXJyYXkgYW5kIHJlbW92ZSB0aGVtLiByZXR1cm5zIHRydWUgaWYgYW55IGluc3RhbmNlcyB3ZXJlIHJlbW92ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEFsbEFuZFJlbW92ZSh0aGVBcnJheSwgZmluZGVyLCBzdGFydEluZGV4ID0gMCkge1xuICAgIGxldCByZW1vdmVkRWxlbWVudCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSB0aGVBcnJheS5sZW5ndGggLSAxOyBpID49IHN0YXJ0SW5kZXg7IGktLSkge1xuICAgICAgICBpZiAoZmluZGVyKHRoZUFycmF5W2ldKSkge1xuICAgICAgICAgICAgdGhlQXJyYXkuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmVtb3ZlZEVsZW1lbnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVkRWxlbWVudDtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlKHRoZUFycmF5LCBvbGRFbGVtZW50LCBuZXdFbGVtZW50KSB7XG4gICAgbGV0IGkgPSB0aGVBcnJheS5pbmRleE9mKG9sZEVsZW1lbnQpO1xuICAgIGlmIChpICE9PSAtMSkge1xuICAgICAgICB0aGVBcnJheS5zcGxpY2UoaSwgMSwgbmV3RWxlbWVudCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbi8qKlxuICogU2FtZSBhcyBmaWx0ZXJNYXAgaW4gc29tZSBsYW5ndWFnZXMuIEFwcGx5IG1hcHBlciBhbmQgdGhlbiBvbmx5IGluY2x1ZGUgbm9uLW51bGxhYmxlIGl0ZW1zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwQW5kRmlsdGVyTnVsbChhcnJheSwgbWFwcGVyKSB7XG4gICAgY29uc3QgcmVzdWx0TGlzdCA9IFtdO1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBhcnJheSkge1xuICAgICAgICBjb25zdCByZXN1bHRJdGVtID0gbWFwcGVyKGl0ZW0pO1xuICAgICAgICBpZiAocmVzdWx0SXRlbSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHRMaXN0LnB1c2gocmVzdWx0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdExpc3Q7XG59XG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTnVsbChhcnJheSkge1xuICAgIHJldHVybiBkb3duY2FzdChhcnJheS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0gIT0gbnVsbCkpO1xufVxuLyoqXG4gKiBQcm92aWRlcyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBnaXZlbiBhcnJheS5cbiAqIEBwYXJhbSB0aGVBcnJheSBUaGUgYXJyYXkuXG4gKiBAcmV0dXJuIFRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFzdCh0aGVBcnJheSkge1xuICAgIHJldHVybiB0aGVBcnJheVt0aGVBcnJheS5sZW5ndGggLSAxXTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5KGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5Lmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc05vdEVtcHR5KGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5Lmxlbmd0aCAhPSAwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGxhc3RUaHJvdyhhcnJheSkge1xuICAgIGlmIChpc0VtcHR5KGFycmF5KSkge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkFycmF5IGlzIGVtcHR5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gbmV2ZXJOdWxsKGxhc3QoYXJyYXkpKTtcbn1cbi8qKlxuICogZ2V0IGZpcnN0IGl0ZW0gb3IgdGhyb3cgaWYgdGhlcmUgaXMgbm9uZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rmlyc3RPclRocm93KGFycmF5KSB7XG4gICAgaWYgKGlzRW1wdHkoYXJyYXkpKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiQXJyYXkgaXMgZW1wdHlcIik7XG4gICAgfVxuICAgIHJldHVybiBhcnJheVswXTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmaXJzdChhcnJheSkge1xuICAgIHJldHVybiBhcnJheVswXSB8fCBudWxsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRMYXN0KGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICBjb25zdCBpbmRleCA9IGZpbmRMYXN0SW5kZXgoYXJyYXksIHByZWRpY2F0ZSk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTGFzdEluZGV4KGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICBmb3IgKGxldCBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhcnJheVtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb250YWlucyh0aGVBcnJheSwgZWxlbWVudFRvQ2hlY2spIHtcbiAgICByZXR1cm4gdGhlQXJyYXkuaW5kZXhPZihlbGVtZW50VG9DaGVjaykgIT09IC0xO1xufVxuLyoqXG4gKiBjb3VudCBob3cgbWFueSBvZiB0aGUgaXRlbXMgaW4ge0BwYXJhbSB0aGVBcnJheX0gcmV0dXJuIHRydWUgd2hlbiBwYXNzZWQgdG8gdGhlIHByZWRpY2F0ZSB7QHBhcmFtIHByZWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3VudCh0aGVBcnJheSwgcHJlZCkge1xuICAgIHJldHVybiB0aGVBcnJheS5yZWR1Y2UoKGFjYywgbmV4dCkgPT4gKHByZWQobmV4dCkgPyArK2FjYyA6IGFjYyksIDApO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGFkZEFsbChhcnJheSwgZWxlbWVudHMpIHtcbiAgICBhcnJheS5wdXNoKC4uLmVsZW1lbnRzKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVBbGwoYXJyYXksIGVsZW1lbnRzKSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICAgIHJlbW92ZShhcnJheSwgZWxlbWVudCk7XG4gICAgfVxufVxuLyoqXG4gKiBHcm91cCBhbiBhcnJheSBiYXNlZCBvbiB0aGUgZ2l2ZW4gZGlzY3JpbWluYXRvciwgYnV0IGVhY2ggZ3JvdXAgd2lsbCBoYXZlIG9ubHkgdW5pcXVlIGl0ZW1zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncm91cEJ5QW5kTWFwVW5pcXVlbHkoaXRlcmFibGUsIGRpc2NyaW1pbmF0b3IsIG1hcHBlcikge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBlbCBvZiBpdGVyYWJsZSkge1xuICAgICAgICBjb25zdCBrZXkgPSBkaXNjcmltaW5hdG9yKGVsKTtcbiAgICAgICAgZ2V0RnJvbU1hcChtYXAsIGtleSwgKCkgPT4gbmV3IFNldCgpKS5hZGQobWFwcGVyKGVsKSk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG59XG4vKipcbiAqIGNvbnZlcnQgYW4gQXJyYXkgb2YgVCdzIGludG8gYSBNYXAgb2YgQXJyYXlzIG9mIEUncyBieVxuICogKiBncm91cGluZyB0aGVtIGJhc2VkIG9uIGEgZGlzY3JpbWluYXRvclxuICogKiBtYXBwaW5nIHRoZW0gZnJvbSBUIHRvIEVcbiAqIEBwYXJhbSBpdGVyYWJsZSB0aGUgYXJyYXkgdG8gc3BsaXQgaW50byBncm91cHNcbiAqIEBwYXJhbSBkaXNjcmltaW5hdG9yIGEgZnVuY3Rpb24gdGhhdCBwcm9kdWNlcyB0aGUga2V5cyB0byBncm91cCB0aGUgZWxlbWVudHMgYnlcbiAqIEBwYXJhbSBtYXBwZXIgYSBmdW5jdGlvbiB0aGF0IG1hcHMgdGhlIGFycmF5IGVsZW1lbnRzIGJlZm9yZSB0aGV5IGdldCBhZGRlZCB0byB0aGUgZ3JvdXBcbiAqIEByZXR1cm5zIHtNYXA8UiwgQXJyYXk8RT4+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXBCeUFuZE1hcChpdGVyYWJsZSwgZGlzY3JpbWluYXRvciwgbWFwcGVyKSB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgZWwgb2YgaXRlcmFibGUpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZGlzY3JpbWluYXRvcihlbCk7XG4gICAgICAgIGdldEZyb21NYXAobWFwLCBrZXksICgpID0+IFtdKS5wdXNoKG1hcHBlcihlbCkpO1xuICAgIH1cbiAgICByZXR1cm4gbWFwO1xufVxuLyoqXG4gKiBHcm91cCBhcnJheSBlbGVtZW50cyBiYXNlZCBvbiBrZXlzIHByb2R1Y2VkIGJ5IGEgZGlzY3JpbWluYXRvclxuICogQHBhcmFtIGl0ZXJhYmxlIHRoZSBhcnJheSB0byBzcGxpdCBpbnRvIGdyb3Vwc1xuICogQHBhcmFtIGRpc2NyaW1pbmF0b3IgYSBmdW5jdGlvbiB0aGF0IHByb2R1Y2VzIHRoZSBrZXlzIHRvIGdyb3VwIHRoZSBlbGVtZW50cyBieVxuICogQHJldHVybnMge05vZGVKUy5HbG9iYWwuTWFwPFIsIEFycmF5PFQ+Pn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3VwQnkoaXRlcmFibGUsIGRpc2NyaW1pbmF0b3IpIHtcbiAgICByZXR1cm4gZ3JvdXBCeUFuZE1hcChpdGVyYWJsZSwgZGlzY3JpbWluYXRvciwgaWRlbnRpdHkpO1xufVxuLyoqXG4gKiBDb2xsZWN0IGFuIGl0ZXJhYmxlIGludG8gYSBtYXAgYmFzZWQgb24ge0BwYXJhbSBrZXlFeHRyYWN0b3J9LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFRvTWFwKGl0ZXJhYmxlLCBrZXlFeHRyYWN0b3IpIHtcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChjb25zdCBlbCBvZiBpdGVyYWJsZSkge1xuICAgICAgICBjb25zdCBrZXkgPSBrZXlFeHRyYWN0b3IoZWwpO1xuICAgICAgICBpZiAobWFwLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBlbGVtZW50cyBvZiBpdGVyYWJsZSBhcmUgbm90IHVuaXF1ZSwgZHVwbGljYXRlZCBrZXk6ICR7a2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIG1hcC5zZXQoa2V5LCBlbCk7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG59XG4vKipcbiAqIHNwbGl0IGFuIGFycmF5IGludG8gY2h1bmtzIG9mIGEgZ2l2ZW4gc2l6ZS5cbiAqIHRoZSBsYXN0IGNodW5rIHdpbGwgYmUgc21hbGxlciBpZiB0aGVyZSBhcmUgbGVzcyB0aGFuIGNodW5rU2l6ZSBlbGVtZW50cyBsZWZ0LlxuICogQHBhcmFtIGNodW5rU2l6ZVxuICogQHBhcmFtIGFycmF5XG4gKiBAcmV0dXJucyB7QXJyYXk8QXJyYXk8VD4+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRJbkNodW5rcyhjaHVua1NpemUsIGFycmF5KSB7XG4gICAgcmV0dXJuIGRvd25jYXN0KF9jaHVuayhjaHVua1NpemUsIGFycmF5KSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3BsaXRVaW50OEFycmF5SW5DaHVua3MoY2h1bmtTaXplLCBhcnJheSkge1xuICAgIHJldHVybiBkb3duY2FzdChfY2h1bmsoY2h1bmtTaXplLCBhcnJheSkpO1xufVxuZnVuY3Rpb24gX2NodW5rKGNodW5rU2l6ZSwgYXJyYXkpIHtcbiAgICBpZiAoY2h1bmtTaXplIDwgMSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGxldCBjaHVua051bSA9IDA7XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgbGV0IGVuZDtcbiAgICBkbyB7XG4gICAgICAgIGxldCBzdGFydCA9IGNodW5rTnVtICogY2h1bmtTaXplO1xuICAgICAgICBlbmQgPSBzdGFydCArIGNodW5rU2l6ZTtcbiAgICAgICAgY2h1bmtzW2NodW5rTnVtXSA9IGFycmF5LnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgICBjaHVua051bSsrO1xuICAgIH0gd2hpbGUgKGVuZCA8IGFycmF5Lmxlbmd0aCk7XG4gICAgcmV0dXJuIGNodW5rcztcbn1cbi8qKlxuICogTWFwcyBhbiBhcnJheSBpbnRvIGEgbmVzdGVkIGFycmF5IGFuZCB0aGVuIGZsYXR0ZW5zIGl0XG4gKiBAcGFyYW0gYXJyYXlcbiAqIEBwYXJhbSBtYXBwZXJcbiAqIEByZXR1cm5zIHtUfCpbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXRNYXAoYXJyYXksIG1hcHBlcikge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBhcnJheSkge1xuICAgICAgICBjb25zdCBtYXBwZWQgPSBtYXBwZXIoaXRlbSk7XG4gICAgICAgIHJlc3VsdC5wdXNoKC4uLm1hcHBlZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG4vKipcbiAqIEluc2VydHMgZWxlbWVudCBpbnRvIHRoZSBzb3J0ZWQgYXJyYXkuIFdpbGwgZmluZCA8Yj50aGUgbGFzdDwvYj4gbWF0Y2hpbmcgcG9zaXRpb24uXG4gKiBNaWdodCBhZGQgb3IgcmVwbGFjZSBlbGVtZW50IGJhc2VkIG9uIHtAcGFyYW0gcmVwbGFjZUlmfSBpZGVudGl0eSBjaGVjay5cbiAqIEVxdWFsaXR5IHBlciB7QHBhcmFtIGNvbXBhcmF0b3J9IGlzIHByZWNvbmRpdGlvbiBmb3IgcmVwbGFjZW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudCB0byBwbGFjZVxuICogQHBhcmFtIGFycmF5IHdoZXJlIGVsZW1lbnQgc2hvdWxkIGJlIHBsYWNlZFxuICogQHBhcmFtIGNvbXBhcmF0b3IgZm9yIHNvcnRpbmdcbiAqIEBwYXJhbSByZXBsYWNlSWYgaWRlbnRpdHkgY29tcGFyaXNvbiBmb3IgcmVwbGFjZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEludG9Tb3J0ZWRBcnJheShlbGVtZW50LCBhcnJheSwgY29tcGFyYXRvciwgcmVwbGFjZUlmID0gKCkgPT4gZmFsc2UpIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgY29tcGFyZVJlc3VsdCA9IGNvbXBhcmF0b3IoYXJyYXlbaV0sIGVsZW1lbnQpO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGZvciByZXBsYWNlbWVudCBmb3IgZWFjaCBlbGVtZW50IHRoYXQgaXMgZXF1YWwgb3Igd2UgbWlnaHQgbWlzcyBpdFxuICAgICAgICBpZiAoY29tcGFyZVJlc3VsdCA9PT0gMCAmJiByZXBsYWNlSWYoZWxlbWVudCwgYXJyYXlbaV0pKSB7XG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaSwgMSwgZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29tcGFyZVJlc3VsdCA8PSAwKSB7XG4gICAgICAgICAgICAvLyBXZSBjb250aW51ZSBzZWFyY2hpbmcgdW50aWwgdGhlIGxhc3Qgc3VpdGFibGUgcG9zaXRpb25cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFRoaXMgYWxzbyBoYW5kbGVzIGVtcHR5IGFycmF5XG4gICAgYXJyYXkuc3BsaWNlKGksIDAsIGVsZW1lbnQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHppcChhcnIxLCBhcnIyKSB7XG4gICAgY29uc3QgemlwcGVkID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihhcnIxLmxlbmd0aCwgYXJyMi5sZW5ndGgpOyBpKyspIHtcbiAgICAgICAgemlwcGVkLnB1c2goW2FycjFbaV0sIGFycjJbaV1dKTtcbiAgICB9XG4gICAgcmV0dXJuIHppcHBlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWR1cGxpY2F0ZShhcnIsIGNvbXAgPSAoYSwgYikgPT4gYSA9PT0gYikge1xuICAgIGNvbnN0IGRlZHVwbGljYXRlZCA9IFtdO1xuICAgIGZvciAoY29uc3QgYSBvZiBhcnIpIHtcbiAgICAgICAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cGxpY2F0ZWQuc29tZSgoYikgPT4gY29tcChhLCBiKSk7XG4gICAgICAgIGlmICghaXNEdXBsaWNhdGUpIHtcbiAgICAgICAgICAgIGRlZHVwbGljYXRlZC5wdXNoKGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWR1cGxpY2F0ZWQ7XG59XG4vKipcbiAqIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvYXJ5emhvdi9wa2ZzdDU1MC9cbiAqIEJpbmFyeSBzZWFyY2ggaW4gSmF2YVNjcmlwdC5cbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIGEgc29ydGVkIGFycmF5IG9yICgtbi0xKSB3aGVyZSBuIGlzIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHRoZSBuZXcgZWxlbWVudC5cbiAqIFBhcmFtZXRlcnM6XG4gKiAgICAgYXJyYXkgLSBBIHNvcnRlZCBhcnJheVxuICogICAgIGVsZW1lbnQgLSBBbiBlbGVtZW50IHRvIHNlYXJjaCBmb3JcbiAqICAgICBjb21wYXJlRm4gLSBBIGNvbXBhcmF0b3IgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiB0YWtlcyB0d28gYXJndW1lbnRzOiAoYSwgYikgYW5kIHJldHVybnM6XG4gKiAgICAgICAgYSBuZWdhdGl2ZSBudW1iZXIgIGlmIGEgaXMgbGVzcyB0aGFuIGI7XG4gKiAgICAgICAgMCBpZiBhIGlzIGVxdWFsIHRvIGI7XG4gKiAgICAgICAgYSBwb3NpdGl2ZSBudW1iZXIgb2YgYSBpcyBncmVhdGVyIHRoYW4gYi5cbiAqIFRoZSBhcnJheSBtYXkgY29udGFpbiBkdXBsaWNhdGUgZWxlbWVudHMuIElmIHRoZXJlIGFyZSBtb3JlIHRoYW4gb25lIGVxdWFsIGVsZW1lbnRzIGluIHRoZSBhcnJheSxcbiAqIHRoZSByZXR1cm5lZCB2YWx1ZSBjYW4gYmUgdGhlIGluZGV4IG9mIGFueSBvbmUgb2YgdGhlIGVxdWFsIGVsZW1lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluYXJ5U2VhcmNoKGFycmF5LCBlbGVtZW50LCBjb21wYXJlRm4pIHtcbiAgICBsZXQgbSA9IDA7XG4gICAgbGV0IG4gPSBhcnJheS5sZW5ndGggLSAxO1xuICAgIHdoaWxlIChtIDw9IG4pIHtcbiAgICAgICAgY29uc3QgayA9IChuICsgbSkgPj4gMTtcbiAgICAgICAgY29uc3QgY21wID0gY29tcGFyZUZuKGVsZW1lbnQsIGFycmF5W2tdKTtcbiAgICAgICAgaWYgKGNtcCA+IDApIHtcbiAgICAgICAgICAgIG0gPSBrICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjbXAgPCAwKSB7XG4gICAgICAgICAgICBuID0gayAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLW0gLSAxO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGxhc3RJbmRleChhcnJheSkge1xuICAgIGlmIChhcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICB9XG59XG4vKipcbiAqIEFsbCBvZiB0aGUgZWxlbWVudHMgaW4gYWxsIG9mIHRoZSBhcmd1bWVudHMgY29tYmluZWQsIGFuZCBkZWR1cGxpY2F0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuaW9uKC4uLml0ZXJhYmxlcykge1xuICAgIHJldHVybiBuZXcgU2V0KC4uLml0ZXJhYmxlcy5tYXAoKGl0ZXJhYmxlKSA9PiBBcnJheS5mcm9tKGl0ZXJhYmxlKSkpO1xufVxuLyoqXG4gKiByZXR1cm4gYSBuZXcgYXJyYXkgY29udGFpbmluZyBldmVyeSBpdGVtIGZyb20gYXJyYXkxIHRoYXQgaXNuJ3QgaW4gYXJyYXkyXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIGFycmF5MVxuICogQHBhcmFtIGFycmF5MlxuICogQHBhcmFtIGNvbXBhcmUgeyhsOiBULCByOiBUKSA9PiBib29sZWFufSBjb21wYXJlIGl0ZW1zIGluIHRoZSBhcnJheSBmb3IgZXF1YWxpdHlcbiAqIEByZXR1cm5zIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZlcmVuY2UoYXJyYXkxLCBhcnJheTIsIGNvbXBhcmUgPSAoYSwgYikgPT4gYSA9PT0gYikge1xuICAgIHJldHVybiBhcnJheTEuZmlsdGVyKChlbGVtZW50MSkgPT4gIWFycmF5Mi5zb21lKChlbGVtZW50MikgPT4gY29tcGFyZShlbGVtZW50MSwgZWxlbWVudDIpKSk7XG59XG4vKipcbiAqIFJldHVybnMgYSBzZXQgd2l0aCBlbGVtZW50cyB0aGF0IGFyZSAqbm90KiBpbiBib3RoIHNldHMuXG4gKlxuICoge2EsIGIsIGN9IOKWsyB7YiwgYywgZH0gPT0ge2EsIGR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzeW1tZXRyaWNEaWZmZXJlbmNlKHNldDEsIHNldDIpIHtcbiAgICBjb25zdCBkaWZmID0gbmV3IFNldCgpO1xuICAgIGZvciAoY29uc3QgZWwgb2Ygc2V0MSkge1xuICAgICAgICBpZiAoIXNldDIuaGFzKGVsKSkge1xuICAgICAgICAgICAgZGlmZi5hZGQoZWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWwgb2Ygc2V0Mikge1xuICAgICAgICBpZiAoIXNldDEuaGFzKGVsKSkge1xuICAgICAgICAgICAgZGlmZi5hZGQoZWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaWZmO1xufVxuLy8gdGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBzaWduYXR1cmUgYW5kIGlzIG5vdCB2aXNpYmxlIGZyb20gdGhlIG91dHNpZGVcbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aXRpb24oYXJyYXksIHByZWRpY2F0ZSkge1xuICAgIGNvbnN0IGxlZnQgPSBbXTtcbiAgICBjb25zdCByaWdodCA9IFtdO1xuICAgIGZvciAobGV0IGl0ZW0gb2YgYXJyYXkpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShpdGVtKSkge1xuICAgICAgICAgICAgbGVmdC5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW2xlZnQsIHJpZ2h0XTtcbn1cbi8qKlxuICogTGlrZSB7QGxpbmsgcGFydGl0aW9ufSwgYnV0IGFzeW5jIGFuZCBvbmx5IGZvciBUTCA9IFRSLlxuICogUmVqZWN0cyBpZiBhbnkgb2YgdGhlIHByZWRpY2F0ZXMgcmVqZWN0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFydGl0aW9uQXN5bmMoYXJyYXksIHByZWRpY2F0ZSkge1xuICAgIGNvbnN0IGxlZnQgPSBbXTtcbiAgICBjb25zdCByaWdodCA9IFtdO1xuICAgIGZvciAobGV0IGl0ZW0gb2YgYXJyYXkpIHtcbiAgICAgICAgaWYgKGF3YWl0IHByZWRpY2F0ZShpdGVtKSkge1xuICAgICAgICAgICAgbGVmdC5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmlnaHQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW2xlZnQsIHJpZ2h0XTtcbn1cbi8qKlxuICogQ3JlYXRlIGFuIGFycmF5IHdpdGggbiBlbGVtZW50cyBieSBjYWxsaW5nIHRoZSBwcm92aWRlZCBmYWN0b3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheU9mKG4sIGZhY3RvcnkpIHtcbiAgICByZXR1cm4gbnVtYmVyUmFuZ2UoMCwgbiAtIDEpLm1hcChmYWN0b3J5KTtcbn1cbi8qKlxuICogRGVzdHJveSBjb250ZW50cyBvZiB0aGUgYnl0ZSBhcnJheXMgcGFzc2VkLiBVc2VmdWwgZm9yIHB1cmdpbmcgdW53YW50ZWQgbWVtb3J5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gemVyb091dCguLi5hcnJheXMpIHtcbiAgICBmb3IgKGNvbnN0IGEgb2YgYXJyYXlzKSB7XG4gICAgICAgIGEuZmlsbCgwKTtcbiAgICB9XG59XG4vKipcbiAqIEByZXR1cm4gMSBpZiBmaXJzdCBpcyBiaWdnZXIgdGhhbiBzZWNvbmQsIC0xIGlmIHNlY29uZCBpcyBiaWdnZXIgdGhhbiBmaXJzdCBhbmQgMCBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmUoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmIChmaXJzdC5sZW5ndGggPiBzZWNvbmQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBlbHNlIGlmIChmaXJzdC5sZW5ndGggPCBzZWNvbmQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBhID0gZmlyc3RbaV07XG4gICAgICAgIGNvbnN0IGIgPSBzZWNvbmRbaV07XG4gICAgICAgIGlmIChhID4gYikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cbiIsIi8qKlxuICogUmVwcmVzZW50cyBhIHJlc291cmNlIHRoYXQgaXMgZWl0aGVyIG5vdCByZWFkeSwgcmVhZHksIG9yIGVycm9yXG4gKiBTb3J0IG9mIGZpbGxzIGEgc2ltaWxhciByb2xlIHRvIExhenlMb2FkZWQsIHVzYWdlIGlzIG1vcmUgdmVyYm9zZSBidXQgYWxzbyBtb3JlIHR5cGVzYWZlLiBtYXliZSB0aGlzIHNob3VsZCBiZSByZWNvbmNpbGVkLlxuICovXG5leHBvcnQgY2xhc3MgQXN5bmNSZXN1bHQge1xuICAgIF9zdGF0ZTtcbiAgICBjb25zdHJ1Y3Rvcihwcm9taXNlKSB7XG4gICAgICAgIHRoaXMuX3N0YXRlID0gcGVuZGluZyhwcm9taXNlKTtcbiAgICAgICAgcHJvbWlzZS50aGVuKChyZXN1bHQpID0+ICh0aGlzLl9zdGF0ZSA9IGNvbXBsZXRlKHJlc3VsdCkpKS5jYXRjaCgoZXJyb3IpID0+ICh0aGlzLl9zdGF0ZSA9IGZhaWx1cmUoZXJyb3IpKSk7XG4gICAgfVxuICAgIHN0YXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgfVxufVxuZnVuY3Rpb24gcGVuZGluZyhwcm9taXNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiBcInBlbmRpbmdcIixcbiAgICAgICAgcHJvbWlzZSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY29tcGxldGUocmVzdWx0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlXCIsXG4gICAgICAgIHJlc3VsdCxcbiAgICB9O1xufVxuZnVuY3Rpb24gZmFpbHVyZShlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogXCJmYWlsdXJlXCIsXG4gICAgICAgIGVycm9yLFxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBpZGVudGl0eSB9IGZyb20gXCIuL1V0aWxzLmpzXCI7XG4vKipcbiAqIEV2ZXJ5dGhpbmcgdGhhdCBpcyBpbiBib3RoIGFycmF5MSBhbmQgYXJyYXkyXG4gKiBUaGlzIGlzIGEgbmFpdmUgaW1wbGVtZW50YXRpb24sIGRvbid0IHVzZSBpdCBvbiBsYXJnZSBpbnB1dHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVyc2VjdGlvbihzZXQxLCBzZXQyKSB7XG4gICAgcmV0dXJuIG5ldyBTZXQoQXJyYXkuZnJvbShzZXQxKS5maWx0ZXIoKGl0ZW0pID0+IHNldDIuaGFzKGl0ZW0pKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0RXF1YWxzKHNldDEsIHNldDIpIHtcbiAgICBpZiAoc2V0MS5zaXplICE9PSBzZXQyLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKGxldCBpdGVtIG9mIHNldDEpIHtcbiAgICAgICAgaWYgKCFzZXQyLmhhcyhpdGVtKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcChzZXQsIG1hcHBlcikge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2V0KSB7XG4gICAgICAgIHJlc3VsdC5hZGQobWFwcGVyKGl0ZW0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtaW4oc2V0KSB7XG4gICAgcmV0dXJuIG1pbkJ5KHNldCwgaWRlbnRpdHkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1pbkJ5KGNvbGxlY3Rpb24sIHNlbGVjdG9yKSB7XG4gICAgbGV0IG1pbiA9IG51bGw7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzZWxlY3RvcihpdGVtKTtcbiAgICAgICAgaWYgKG1pbiA9PSBudWxsIHx8IHZhbHVlIDwgbWluLnZhbHVlKSB7XG4gICAgICAgICAgICBtaW4gPSB7IGl0ZW0sIHZhbHVlIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1pbiA/IG1pbi5pdGVtIDogbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXgoc2V0KSB7XG4gICAgcmV0dXJuIG1heEJ5KHNldCwgaWRlbnRpdHkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1heEJ5KGNvbGxlY3Rpb24sIHNlbGVjdG9yKSB7XG4gICAgbGV0IG1heCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzZWxlY3RvcihpdGVtKTtcbiAgICAgICAgaWYgKG1heCA9PSBudWxsIHx8IHZhbHVlID4gbWF4LnZhbHVlKSB7XG4gICAgICAgICAgICBtYXggPSB7IGl0ZW0sIHZhbHVlIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1heCA/IG1heC5pdGVtIDogbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRBZGRBbGwoc2V0LCB0b0FkZCkge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiB0b0FkZCkge1xuICAgICAgICBzZXQuYWRkKGl0ZW0pO1xuICAgIH1cbn1cbi8qKlxuICogUmV0dXJucyBhbiBlbGVtZW50IG9mIHRoZSB7QHBhcmFtIGNvbGxlY3Rpb259IGlmIGl0IHNhdGlzZmllcyB7QHBhcmFtIHNlbGVjdG9yfSBvciB7QGNvZGUgbnVsbH0gb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEJ5KGNvbGxlY3Rpb24sIHNlbGVjdG9yKSB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgaWYgKHNlbGVjdG9yKGl0ZW0pKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXBXaXRoKG1hcCwga2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IG5ld01hcCA9IG5ldyBNYXAobWFwKTtcbiAgICBuZXdNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgIHJldHVybiBuZXdNYXA7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwV2l0aG91dChtYXAsIGtleSkge1xuICAgIGNvbnN0IG5ld01hcCA9IG5ldyBNYXAobWFwKTtcbiAgICBuZXdNYXAuZGVsZXRlKGtleSk7XG4gICAgcmV0dXJuIG5ld01hcDtcbn1cbi8qKlxuICogZGlmZiB0d28gbWFwcyBieSBrZXlzXG4gKiBAcGFyYW0gYmVmb3JlIHRoZSBtYXAgdGhhdCdzIGNvbnNpZGVyZWQgdGhlIG9sZCBjb250ZW50c1xuICogQHBhcmFtIGFmdGVyIHRoZSBtYXAgdGhhdCdzIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBjb250ZW50cy5cbiAqIEByZXR1cm5zIGFycmF5cyBjb250YWluaW5nIHRoZSBrZXB0LCBhZGRlZCwgYW5kIGRlbGV0ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpc2VjdGluZ0RpZmYoYmVmb3JlLCBhZnRlcikge1xuICAgIGNvbnN0IGtlcHQgPSBbXTtcbiAgICBjb25zdCBhZGRlZCA9IFtdO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBbXTtcbiAgICBjb25zdCBiZWZvcmVTY3JhdGNoID0gbmV3IE1hcChiZWZvcmUpO1xuICAgIGNvbnN0IGFmdGVyU2NyYXRjaCA9IG5ldyBNYXAoYWZ0ZXIpO1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIGJlZm9yZVNjcmF0Y2guZW50cmllcygpKSB7XG4gICAgICAgIGJlZm9yZVNjcmF0Y2guZGVsZXRlKGspO1xuICAgICAgICBpZiAoYWZ0ZXJTY3JhdGNoLmhhcyhrKSkge1xuICAgICAgICAgICAgYWZ0ZXJTY3JhdGNoLmRlbGV0ZShrKTtcbiAgICAgICAgICAgIGtlcHQucHVzaCh2KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZWQucHVzaCh2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHYgb2YgYWZ0ZXJTY3JhdGNoLnZhbHVlcygpKSB7XG4gICAgICAgIGFkZGVkLnB1c2godik7XG4gICAgfVxuICAgIHJldHVybiB7IGtlcHQsIGFkZGVkLCBkZWxldGVkIH07XG59XG4iLCIvKipcbiAqIEBmaWxlIERhdGVVdGlscyB3aGljaCBkbyBub3QgdXNlIEx1eG9uLiBVc2VkIGluIHdvcmtlciBhcyB3ZWxsIGFzIGluIGNsaWVudCBwYXJ0cy5cbiAqIEFzIGZ1bmN0aW9ucyBoZXJlIGRvIG5vdCB1c2UgTHV4b24gaXQgY2Fubm90IGJlIHVzZWQgZm9yIGNhbGN1bGF0aW5nIHRoaW5ncyBpbiBkaWZmZXJlbnQgdGltZSB6b25lcywgdGhleVxuICogYXJlIGRlcGVuZGVudCBvbiB0aGUgc3lzdGVtIHRpbWUgem9uZS5cbiAqL1xuZXhwb3J0IGNvbnN0IERBWV9JTl9NSUxMSVMgPSAxMDAwICogNjAgKiA2MCAqIDI0O1xuZXhwb3J0IGNvbnN0IFlFQVJfSU5fTUlMTElTID0gREFZX0lOX01JTExJUyAqIDM2NTtcbi8qKlxuICogZGF0ZXMgZnJvbSBiZWZvcmUgMTk3MCBoYXZlIG5lZ2F0aXZlIHRpbWVzdGFtcHMgYW5kIGFyZSBjdXJyZW50bHkgY29uc2lkZXJlZCBlZGdlIGNhc2VzXG4gKi9cbmV4cG9ydCBjb25zdCBUSU1FU1RBTVBfWkVST19ZRUFSID0gMDtcbi8qKlxuICogUHJvdmlkZXMgYSBkYXRlIHJlcHJlc2VudGluZyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IGRheSBvZiB0aGUgZ2l2ZW4gZGF0ZSBpbiBsb2NhbCB0aW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RhcnRPZk5leHREYXkoZGF0ZSkge1xuICAgIGxldCBkID0gbmV3IERhdGUoZGF0ZS5nZXRUaW1lKCkpO1xuICAgIGQuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDEpO1xuICAgIGQuc2V0SG91cnMoMCwgMCwgMCwgMCk7IC8vIHNldHMgdGhlIGJlZ2lubmluZyBvZiB0aGUgZGF5IGluIGxvY2FsIHRpbWVcbiAgICByZXR1cm4gZDtcbn1cbi8qKlxuICogUHJvdmlkZXMgYSBkYXRlIHJlcHJlc2VudGluZyB0aGUgZW5kIG9mIHRoZSBnaXZlbiBkYXRlIGluIGxvY2FsIHRpbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmRPZkRheShkYXRlKSB7XG4gICAgbGV0IGQgPSBuZXcgRGF0ZShkYXRlLmdldFRpbWUoKSk7XG4gICAgZC5zZXRIb3VycygyMywgNTksIDU5LCA5OTkpO1xuICAgIHJldHVybiBkO1xufVxuLyoqXG4gKiBQcm92aWRlcyBhIGRhdGUgcmVwcmVzZW50aW5nIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGdpdmVuIGRhdGUgaW4gbG9jYWwgdGltZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXJ0T2ZEYXkoZGF0ZSkge1xuICAgIHJldHVybiBnZXRIb3VyT2ZEYXkoZGF0ZSwgMCk7XG59XG4vKipcbiAqIFByb3ZpZGVzIGEgZGF0ZSByZXByZXNlbnRpbmcgdGhlIGRheSBvZiB0aGUgZ2l2ZW4gZGF0ZSBhdCB0aGUgZ2l2ZW4gaG91ciBpbiBsb2NhbCB0aW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG91ck9mRGF5KGRhdGUsIGhvdXIpIHtcbiAgICBsZXQgZCA9IG5ldyBEYXRlKGRhdGUuZ2V0VGltZSgpKTtcbiAgICBkLnNldEhvdXJzKGhvdXIsIDAsIDAsIDApO1xuICAgIHJldHVybiBkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RhcnRPZkRheShkYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUuZ2V0SG91cnMoKSA9PT0gMCAmJiBkYXRlLmdldE1pbnV0ZXMoKSA9PT0gMDtcbn1cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBkYXRlIGlzIHRvZGF5IGluIGxvY2FsIHRpbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1RvZGF5KGRhdGUpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0RhdGVTdHJpbmcoKSA9PT0gZGF0ZS50b0RhdGVTdHJpbmcoKTtcbn1cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBkYXRlcyByZXByZXNlbnQgdGhlIHNhbWUgZGF5ICh0aW1lIG9mIGRheSBpcyBpZ25vcmVkKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZURheShkYXRlMSwgZGF0ZTIpIHtcbiAgICByZXR1cm4gZGF0ZTEudG9EYXRlU3RyaW5nKCkgPT09IGRhdGUyLnRvRGF0ZVN0cmluZygpO1xufVxuLyoqXG4gKiBDcmVhdGVzIG5ldyBkYXRlIGluIHdpdGgge0BwYXJhbSBkYXlzfSBhZGRlZCB0byBpdCBhcyBpZiB0aGUgZGF5cyBhcmUganVzdCBmaXhlZFxuICogcGVyaW9kcyBvZiB0aW1lIGFuZCBhcmUgbm90IHN1YmplY3QgdG8gZGF5bGlnaHQgc2F2aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF5U2hpZnRlZChkYXRlLCBkYXlzKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGUuZ2V0VGltZSgpICsgZGF5cyAqIERBWV9JTl9NSUxMSVMpO1xufVxuLyoqXG4gKiBJbmNyZW1lbnQgdGhlIGRhdGUgaW4gcGxhY2UgYW5kIHJldHVybiBpdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50RGF0ZShkYXRlLCBieVZhbHVlKSB7XG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgYnlWYWx1ZSk7XG4gICAgcmV0dXJuIGRhdGU7XG59XG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50TW9udGgoZCwgYnlWYWx1ZSkge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShkKTtcbiAgICBkYXRlLnNldE1vbnRoKGRhdGUuZ2V0TW9udGgoKSArIGJ5VmFsdWUpO1xuICAgIHJldHVybiBkYXRlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZURheU9mRGF0ZShkYXRlMSwgZGF0ZTIpIHtcbiAgICByZXR1cm4gKCghZGF0ZTEgJiYgIWRhdGUyKSB8fFxuICAgICAgICAoZGF0ZTEgIT0gbnVsbCAmJlxuICAgICAgICAgICAgZGF0ZTIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgZGF0ZTEuZ2V0RnVsbFllYXIoKSA9PT0gZGF0ZTIuZ2V0RnVsbFllYXIoKSAmJlxuICAgICAgICAgICAgZGF0ZTEuZ2V0TW9udGgoKSA9PT0gZGF0ZTIuZ2V0TW9udGgoKSAmJlxuICAgICAgICAgICAgZGF0ZTEuZ2V0RGF0ZSgpID09PSBkYXRlMi5nZXREYXRlKCkpKTtcbn1cbi8qKlxuICogRm9ybWF0cyBhcyB5eXl5LW1tLWRkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTb3J0YWJsZURhdGUoZGF0ZSkge1xuICAgIGNvbnN0IG1vbnRoID0gKFwiMFwiICsgKGRhdGUuZ2V0TW9udGgoKSArIDEpKS5zbGljZSgtMik7XG4gICAgY29uc3QgZGF5ID0gKFwiMFwiICsgZGF0ZS5nZXREYXRlKCkpLnNsaWNlKC0yKTtcbiAgICByZXR1cm4gYCR7ZGF0ZS5nZXRGdWxsWWVhcigpfS0ke21vbnRofS0ke2RheX1gO1xufVxuLyoqXG4gKiBGb3JtYXRzIGFzIHl5eXktbW0tZGQtPGhoPmgtPG1tPm0tPHNzPlxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U29ydGFibGVEYXRlVGltZShkYXRlKSB7XG4gICAgY29uc3QgaG91cnMgPSAoXCIwXCIgKyBkYXRlLmdldEhvdXJzKCkpLnNsaWNlKC0yKTtcbiAgICBjb25zdCBtaW51dGVzID0gKFwiMFwiICsgZGF0ZS5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKTtcbiAgICBjb25zdCBzZWNvbmRzID0gKFwiMFwiICsgZGF0ZS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKTtcbiAgICByZXR1cm4gYCR7Zm9ybWF0U29ydGFibGVEYXRlKGRhdGUpfS0ke2hvdXJzfWgke21pbnV0ZXN9bSR7c2Vjb25kc31zYDtcbn1cbi8qKlxuICogQHJldHVybnMge3N0cmluZ30gc29ydGFibGVEYXRlVGltZSBvZiB0aGUgY3VycmVudCB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzb3J0YWJsZVRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gZm9ybWF0U29ydGFibGVEYXRlVGltZShuZXcgRGF0ZSgpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkRGF0ZShkYXRlKSB7XG4gICAgcmV0dXJuICFpc05hTihkYXRlLmdldFRpbWUoKSk7XG59XG4vKipcbiAqIG5vdCBpbnRlcmVzdGVkIGluIGFueSBmYW5jeSBjYWxlbmRhciBlZGdlIGNhc2VzLCBvbmx5IHVzZSB0aGlzIHdoZXJlIGFwcHJveGltYXRpb24gaXMgb2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pbGxpc1RvRGF5cyhtaWxsaXMpIHtcbiAgICByZXR1cm4gbWlsbGlzIC8gREFZX0lOX01JTExJUztcbn1cbmV4cG9ydCBmdW5jdGlvbiBkYXlzVG9NaWxsaXMoZGF5cykge1xuICAgIHJldHVybiBkYXlzICogREFZX0lOX01JTExJUztcbn1cbiIsIi8vIFRPRE8gcmVuYW1lIG1ldGhvZHMgYWNjb3JkaW5nIHRvIHRoZWlyIEpBVkEgY291bnRlcnBhcnRzIChlLmcuIFVpbnQ4QXJyYXkgPT0gYnl0ZXMsIFV0ZjhVaW50OEFycmF5ID09IGJ5dGVzLi4uKVxuZXhwb3J0IGZ1bmN0aW9uIHVpbnQ4QXJyYXlUb0FycmF5QnVmZmVyKHVpbnQ4QXJyYXkpIHtcbiAgICBpZiAodWludDhBcnJheS5ieXRlTGVuZ3RoID09PSB1aW50OEFycmF5LmJ1ZmZlci5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB1aW50OEFycmF5LmJ1ZmZlcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh1aW50OEFycmF5KS5idWZmZXI7IC8vIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSB3aXRoIHRoZSBjb3JyZWN0IGxlbmd0aCwgaWYgdWludDhBcnJheSBpcyBvbmx5IGEgRGF0YVZpZXcgb24gYSBsb25nZXIgQXJyYXkuYnVmZmVyXG4gICAgfVxufVxuLyoqXG4gKiBDb252ZXJ0cyBhIGhleCBjb2RlZCBzdHJpbmcgaW50byBhIGJhc2U2NCBjb2RlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIGhleCBBIGhleCBlbmNvZGVkIHN0cmluZy5cbiAqIEByZXR1cm4gQSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoZXhUb0Jhc2U2NChoZXgpIHtcbiAgICByZXR1cm4gdWludDhBcnJheVRvQmFzZTY0KGhleFRvVWludDhBcnJheShoZXgpKTtcbn1cbi8qKlxuICogQ29udmVydHMgYSBiYXNlNjQgY29kZWQgc3RyaW5nIGludG8gYSBoZXggY29kZWQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBiYXNlNjQgQSBiYXNlNjQgZW5jb2RlZCBzdHJpbmcuXG4gKiBAcmV0dXJuIEEgaGV4IGVuY29kZWQgc3RyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0VG9IZXgoYmFzZTY0KSB7XG4gICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0hleChiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0KSk7XG59XG4vKipcbiAqIENvbnZlcnRzIGEgYmFzZTY0IHN0cmluZyB0byBhIHVybC1jb25mb3JtIGJhc2U2NCBzdHJpbmcuIFRoaXMgaXMgdXNlZCBmb3JcbiAqIGJhc2U2NCBjb2RlZCB1cmwgcGFyYW1ldGVycy5cbiAqXG4gKiBAcGFyYW0gYmFzZTY0IFRoZSBiYXNlNjQgc3RyaW5nLlxuICogQHJldHVybiBUaGUgYmFzZTY0dXJsIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NFRvQmFzZTY0VXJsKGJhc2U2NCkge1xuICAgIGxldCBiYXNlNjR1cmwgPSBiYXNlNjQucmVwbGFjZSgvXFwrL2csIFwiLVwiKTtcbiAgICBiYXNlNjR1cmwgPSBiYXNlNjR1cmwucmVwbGFjZSgvXFwvL2csIFwiX1wiKTtcbiAgICBiYXNlNjR1cmwgPSBiYXNlNjR1cmwucmVwbGFjZSgvPS9nLCBcIlwiKTtcbiAgICByZXR1cm4gYmFzZTY0dXJsO1xufVxuZnVuY3Rpb24gbWFrZUxvb2t1cChzdHIpIHtcbiAgICBjb25zdCBsb29rdXAgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBsb29rdXBbc3RyLmNoYXJBdChpKV0gPSBpO1xuICAgIH1cbiAgICByZXR1cm4gbG9va3VwO1xufVxuY29uc3QgYmFzZTY0QWxwaGFiZXQgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcbmNvbnN0IGJhc2U2NExvb2t1cCA9IG1ha2VMb29rdXAoYmFzZTY0QWxwaGFiZXQpO1xuY29uc3QgYmFzZTY0ZXh0QWxwaGFiZXQgPSBcIi0wMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpfYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcbmNvbnN0IGJhc2U2NEV4dExvb2t1cCA9IG1ha2VMb29rdXAoYmFzZTY0ZXh0QWxwaGFiZXQpO1xuLyoqXG4gKiBDb252ZXJ0cyBhIGJhc2U2NCBzdHJpbmcgdG8gYSBiYXNlNjRleHQgc3RyaW5nLiBCYXNlNjRleHQgdXNlcyBhbm90aGVyIGNoYXJhY3RlciBzZXQgdGhhbiBiYXNlNjQgaW4gb3JkZXIgdG8gbWFrZSBpdCBzb3J0YWJsZS5cbiAqXG4gKlxuICogQHBhcmFtIGJhc2U2NCBUaGUgYmFzZTY0IHN0cmluZy5cbiAqIEByZXR1cm4gVGhlIGJhc2U2NEV4dCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb0Jhc2U2NEV4dChiYXNlNjQpIHtcbiAgICBiYXNlNjQgPSBiYXNlNjQucmVwbGFjZSgvPS9nLCBcIlwiKTtcbiAgICBsZXQgYmFzZTY0ZXh0ID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJhc2U2NC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IGJhc2U2NExvb2t1cFtiYXNlNjQuY2hhckF0KGkpXTtcbiAgICAgICAgYmFzZTY0ZXh0ICs9IGJhc2U2NGV4dEFscGhhYmV0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIGJhc2U2NGV4dDtcbn1cbi8qKlxuICogQ29udmVydHMgYSBCYXNlNjRFeHQgc3RyaW5nIHRvIGEgQmFzZTY0IHN0cmluZyBhbmQgYXBwZW5kcyB0aGUgcGFkZGluZyBpZiBuZWVkZWQuXG4gKiBAcGFyYW0gYmFzZTY0ZXh0IFRoZSBiYXNlNjRFeHQgc3RyaW5nXG4gKiBAcmV0dXJucyBUaGUgYmFzZTY0IHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0RXh0VG9CYXNlNjQoYmFzZTY0ZXh0KSB7XG4gICAgbGV0IGJhc2U2NCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiYXNlNjRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBiYXNlNjRFeHRMb29rdXBbYmFzZTY0ZXh0LmNoYXJBdChpKV07XG4gICAgICAgIGJhc2U2NCArPSBiYXNlNjRBbHBoYWJldFtpbmRleF07XG4gICAgfVxuICAgIGxldCBwYWRkaW5nO1xuICAgIGlmIChiYXNlNjQubGVuZ3RoICUgNCA9PT0gMikge1xuICAgICAgICBwYWRkaW5nID0gXCI9PVwiO1xuICAgIH1cbiAgICBlbHNlIGlmIChiYXNlNjQubGVuZ3RoICUgNCA9PT0gMykge1xuICAgICAgICBwYWRkaW5nID0gXCI9XCI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBwYWRkaW5nID0gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGJhc2U2NCArIHBhZGRpbmc7XG59XG4vKipcbiAqIENvbnZlcnRzIGEgYmFzZTY0IHVybCBzdHJpbmcgdG8gYSBcIm5vcm1hbFwiIGJhc2U2NCBzdHJpbmcuIFRoaXMgaXMgdXNlZCBmb3JcbiAqIGJhc2U2NCBjb2RlZCB1cmwgcGFyYW1ldGVycy5cbiAqXG4gKiBAcGFyYW0gYmFzZTY0dXJsIFRoZSBiYXNlNjQgdXJsIHN0cmluZy5cbiAqIEByZXR1cm4gVGhlIGJhc2U2NCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRVcmxUb0Jhc2U2NChiYXNlNjR1cmwpIHtcbiAgICBsZXQgYmFzZTY0ID0gYmFzZTY0dXJsLnJlcGxhY2UoLy0vZywgXCIrXCIpO1xuICAgIGJhc2U2NCA9IGJhc2U2NC5yZXBsYWNlKC9fL2csIFwiL1wiKTtcbiAgICBsZXQgbmJyT2ZSZW1haW5pbmdDaGFycyA9IGJhc2U2NC5sZW5ndGggJSA0O1xuICAgIGlmIChuYnJPZlJlbWFpbmluZ0NoYXJzID09PSAwKSB7XG4gICAgICAgIHJldHVybiBiYXNlNjQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5ick9mUmVtYWluaW5nQ2hhcnMgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGJhc2U2NCArIFwiPT1cIjtcbiAgICB9XG4gICAgZWxzZSBpZiAobmJyT2ZSZW1haW5pbmdDaGFycyA9PT0gMykge1xuICAgICAgICByZXR1cm4gYmFzZTY0ICsgXCI9XCI7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgYmFzZTY0IHN0cmluZy5cIik7XG59XG4vLyBqdXN0IGZvciBlZGdlLCBhcyBpdCBkb2VzIG5vdCBzdXBwb3J0IFRleHRFbmNvZGVyIHlldFxuZXhwb3J0IGZ1bmN0aW9uIF9zdHJpbmdUb1V0ZjhVaW50OEFycmF5TGVnYWN5KHN0cmluZykge1xuICAgIGxldCBmaXhlZFN0cmluZztcbiAgICB0cnkge1xuICAgICAgICBmaXhlZFN0cmluZyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmcpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBmaXhlZFN0cmluZyA9IGVuY29kZVVSSUNvbXBvbmVudChfcmVwbGFjZUxvbmVTdXJyb2dhdGVzKHN0cmluZykpOyAvLyB3ZSBmaWx0ZXIgbG9uZSBzdXJyb2dhdGVzIGFzIHRyaWdnZXIgVVJJRXJyb3JzLCBvdGhlcndpc2UgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vdHV0YW8vdHV0YW5vdGEvaXNzdWVzLzYxOClcbiAgICB9XG4gICAgbGV0IHV0ZjggPSB1bmVzY2FwZShmaXhlZFN0cmluZyk7XG4gICAgbGV0IHVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheSh1dGY4Lmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dGY4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHVpbnQ4QXJyYXlbaV0gPSB1dGY4LmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiB1aW50OEFycmF5O1xufVxuY29uc3QgUkVQTEFDRU1FTlRfQ0hBUiA9IFwiXFx1RkZGRFwiO1xuZXhwb3J0IGZ1bmN0aW9uIF9yZXBsYWNlTG9uZVN1cnJvZ2F0ZXMocykge1xuICAgIGlmIChzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNvZGUgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGxldCBjaGFyID0gcy5jaGFyQXQoaSk7XG4gICAgICAgIGlmICgweGQ4MDAgPD0gY29kZSAmJiBjb2RlIDw9IDB4ZGJmZikge1xuICAgICAgICAgICAgaWYgKHMubGVuZ3RoID09PSBpKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBoaWdoIHN1cnJvZ2F0ZSB3aXRob3V0IGZvbGxvd2luZyBsb3cgc3Vycm9nYXRlXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goUkVQTEFDRU1FTlRfQ0hBUik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IHMuY2hhckNvZGVBdChpICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKDB4ZGMwMCA8PSBuZXh0ICYmIG5leHQgPD0gMHhkZmZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoYXIpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzLmNoYXJBdChpICsgMSkpO1xuICAgICAgICAgICAgICAgICAgICBpKys7IC8vIHZhbGlkIGhpZ2ggYW5kIGxvdyBzdXJyb2dhdGUsIHNraXAgbmV4dCBsb3cgc3Vycm9nYXRlIGNoZWNrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChSRVBMQUNFTUVOVF9DSEFSKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoMHhkYzAwIDw9IGNvZGUgJiYgY29kZSA8PSAweGRmZmYpIHtcbiAgICAgICAgICAgIC8vIHJlcGxhY2UgbG93IHN1cnJvZ2F0ZSB3aXRob3V0IHByZWNlZGluZyBoaWdoIHN1cnJvZ2F0ZVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goUkVQTEFDRU1FTlRfQ0hBUik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChjaGFyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oXCJcIik7XG59XG5jb25zdCBlbmNvZGVyID0gdHlwZW9mIFRleHRFbmNvZGVyID09IFwiZnVuY3Rpb25cIlxuICAgID8gbmV3IFRleHRFbmNvZGVyKClcbiAgICA6IHtcbiAgICAgICAgZW5jb2RlOiBfc3RyaW5nVG9VdGY4VWludDhBcnJheUxlZ2FjeSxcbiAgICB9O1xuY29uc3QgZGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2RlciA9PSBcImZ1bmN0aW9uXCJcbiAgICA/IG5ldyBUZXh0RGVjb2RlcigpXG4gICAgOiB7XG4gICAgICAgIGRlY29kZTogX3V0ZjhVaW50OEFycmF5VG9TdHJpbmdMZWdhY3ksXG4gICAgfTtcbi8qKlxuICogQ29udmVydHMgYSBzdHJpbmcgdG8gYSBVaW50OEFycmF5IGNvbnRhaW5pbmcgYSBVVEYtOCBzdHJpbmcgZGF0YS5cbiAqXG4gKiBAcGFyYW0gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm4gVGhlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9VdGY4VWludDhBcnJheShzdHJpbmcpIHtcbiAgICByZXR1cm4gZW5jb2Rlci5lbmNvZGUoc3RyaW5nKTtcbn1cbi8vIGp1c3QgZm9yIGVkZ2UsIGFzIGl0IGRvZXMgbm90IHN1cHBvcnQgVGV4dERlY29kZXIgeWV0XG5leHBvcnQgZnVuY3Rpb24gX3V0ZjhVaW50OEFycmF5VG9TdHJpbmdMZWdhY3kodWludDhBcnJheSkge1xuICAgIGxldCBzdHJpbmdBcnJheSA9IFtdO1xuICAgIHN0cmluZ0FycmF5Lmxlbmd0aCA9IHVpbnQ4QXJyYXkubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWludDhBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdHJpbmdBcnJheVtpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUodWludDhBcnJheVtpXSk7XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKHN0cmluZ0FycmF5LmpvaW4oXCJcIikpKTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gVWludDhBcnJheSBjb250YWluaW5nIFVURi04IHN0cmluZyBkYXRhIGludG8gYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHVpbnQ4QXJyYXkgVGhlIFVpbnQ4QXJyYXkuXG4gKiBAcmV0dXJuIFRoZSBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1dGY4VWludDhBcnJheVRvU3RyaW5nKHVpbnQ4QXJyYXkpIHtcbiAgICByZXR1cm4gZGVjb2Rlci5kZWNvZGUodWludDhBcnJheSk7XG59XG5leHBvcnQgZnVuY3Rpb24gaGV4VG9VaW50OEFycmF5KGhleCkge1xuICAgIGxldCBidWZWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoaGV4Lmxlbmd0aCAvIDIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmVmlldy5ieXRlTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYnVmVmlld1tpXSA9IHBhcnNlSW50KGhleC5zdWJzdHJpbmcoaSAqIDIsIGkgKiAyICsgMiksIDE2KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZlZpZXc7XG59XG5jb25zdCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9IZXgodWludDhBcnJheSkge1xuICAgIGxldCBoZXggPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWludDhBcnJheS5ieXRlTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbHVlID0gdWludDhBcnJheVtpXTtcbiAgICAgICAgaGV4ICs9IGhleERpZ2l0c1t2YWx1ZSA+PiA0XSArIGhleERpZ2l0c1t2YWx1ZSAmIDE1XTtcbiAgICB9XG4gICAgcmV0dXJuIGhleDtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gVWludDhBcnJheSB0byBhIEJhc2U2NCBlbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gYnl0ZXMgVGhlIGJ5dGVzIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJuIFRoZSBCYXNlNjQgZW5jb2RlZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9CYXNlNjQoYnl0ZXMpIHtcbiAgICBpZiAoYnl0ZXMubGVuZ3RoIDwgNTEyKSB7XG4gICAgICAgIC8vIEFwcGx5IGZhaWxzIG9uIGJpZyBhcnJheXMgZmFpcmx5IG9mdGVuLiBXZSB0cmllZCBpdCB3aXRoIDYwMDAwIGJ1dCBpZiB5b3UncmUgYWxyZWFkeVxuICAgICAgICAvLyBkZWVwIGluIHRoZSBzdGFjayB0aGFuIHdlIGNhbm5vdCBhbGxvY2F0ZSBzdWNoIGEgYmlnIGFyZ3VtZW50IGFycmF5LlxuICAgICAgICByZXR1cm4gYnRvYShTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLmJ5dGVzKSk7XG4gICAgfVxuICAgIGxldCBiaW5hcnkgPSBcIlwiO1xuICAgIGNvbnN0IGxlbiA9IGJ5dGVzLmJ5dGVMZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBiaW5hcnkgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBidG9hKGJpbmFyeSk7XG59XG5leHBvcnQgZnVuY3Rpb24gaW50OEFycmF5VG9CYXNlNjQoYnl0ZXMpIHtcbiAgICAvLyBWYWx1ZXMgMCB0byAxMjcgYXJlIHRoZSBzYW1lIGZvciBzaWduZWQgYW5kIHVuc2lnbmVkIGJ5dGVzXG4gICAgLy8gYW5kIC0xMjggdG8gLTEgYXJlIG1hcHBlZCB0byB0aGUgc2FtZSBjaGFycyBhcyAxMjggdG8gMjU1LlxuICAgIGxldCBjb252ZXJ0ZWQgPSBuZXcgVWludDhBcnJheShieXRlcyk7XG4gICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0Jhc2U2NChjb252ZXJ0ZWQpO1xufVxuLyoqXG4gKiBDb252ZXJ0cyBhIGJhc2U2NCBlbmNvZGVkIHN0cmluZyB0byBhIFVpbnQ4QXJyYXkuXG4gKlxuICogQHBhcmFtIGJhc2U2NCBUaGUgQmFzZTY0IGVuY29kZWQgc3RyaW5nLlxuICogQHJldHVybiBUaGUgYnl0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb1VpbnQ4QXJyYXkoYmFzZTY0KSB7XG4gICAgaWYgKGJhc2U2NC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBiYXNlNjQgbGVuZ3RoOiAke2Jhc2U2NH0gKCR7YmFzZTY0Lmxlbmd0aH0pYCk7XG4gICAgfVxuICAgIGNvbnN0IGJpbmFyeVN0cmluZyA9IGF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShiaW5hcnlTdHJpbmcubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmFyeVN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHRbaV0gPSBiaW5hcnlTdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogQ29udmVydHMgYSBVaW50OEFycmF5IGNvbnRhaW5pbmcgc3RyaW5nIGRhdGEgaW50byBhIHN0cmluZywgZ2l2ZW4gdGhlIGNoYXJzZXQgdGhlIGRhdGEgaXMgaW4uXG4gKiBAcGFyYW0gY2hhcnNldCBUaGUgY2hhcnNldC4gTXVzdCBiZSBzdXBwb3J0ZWQgYnkgVGV4dERlY29kZXIuXG4gKiBAcGFyYW0gYnl0ZXMgVGhlIHN0cmluZyBkYXRhXG4gKiBAdHJob3dzIFJhbmdlRXJyb3IgaWYgdGhlIGNoYXJzZXQgaXMgbm90IHN1cHBvcnRlZFxuICogQHJldHVybiBUaGUgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9TdHJpbmcoY2hhcnNldCwgYnl0ZXMpIHtcbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKGNoYXJzZXQpO1xuICAgIHJldHVybiBkZWNvZGVyLmRlY29kZShieXRlcyk7XG59XG4vKipcbiAqIERlY29kZXMgYSBxdW90ZWQtcHJpbnRhYmxlIHBpZWNlIG9mIHRleHQgaW4gYSBnaXZlbiBjaGFyc2V0LlxuICogVGhpcyB3YXMgY29waWVkIGFuZCBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRoaWFzYnluZW5zL3F1b3RlZC1wcmludGFibGUvYmxvYi9tYXN0ZXIvc3JjL3F1b3RlZC1wcmludGFibGUuanMgKE1JVCBsaWNlbnNlZClcbiAqXG4gKiBAcGFyYW0gY2hhcnNldCBNdXN0IGJlIHN1cHBvcnRlZCBieSBUZXh0RW5jb2RlclxuICogQHBhcmFtIGlucHV0IFRoZSBlbmNvZGVkIHRleHRcbiAqIEB0aHJvd3MgUmFuZ2VFcnJvciBpZiB0aGUgY2hhcnNldCBpcyBub3Qgc3VwcG9ydGVkXG4gKiBAcmV0dXJucyBUaGUgdGV4dCBhcyBhIEphdmFTY3JpcHQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVRdW90ZWRQcmludGFibGUoY2hhcnNldCwgaW5wdXQpIHtcbiAgICByZXR1cm4gKGlucHV0IC8vIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyMDQ1I3NlY3Rpb24tNi43LCBydWxlIDM6XG4gICAgICAgIC8vIOKAnFRoZXJlZm9yZSwgd2hlbiBkZWNvZGluZyBhIGBRdW90ZWQtUHJpbnRhYmxlYCBib2R5LCBhbnkgdHJhaWxpbmcgd2hpdGVcbiAgICAgICAgLy8gc3BhY2Ugb24gYSBsaW5lIG11c3QgYmUgZGVsZXRlZCwgYXMgaXQgd2lsbCBuZWNlc3NhcmlseSBoYXZlIGJlZW4gYWRkZWRcbiAgICAgICAgLy8gYnkgaW50ZXJtZWRpYXRlIHRyYW5zcG9ydCBhZ2VudHMu4oCdXG4gICAgICAgIC5yZXBsYWNlKC9bXFx0XFx4MjBdJC9nbSwgXCJcIikgLy8gUmVtb3ZlIGhhcmQgbGluZSBicmVha3MgcHJlY2VkZWQgYnkgYD1gLiBQcm9wZXIgYFF1b3RlZC1QcmludGFibGVgLVxuICAgICAgICAvLyBlbmNvZGVkIGRhdGEgb25seSBjb250YWlucyBDUkxGIGxpbmUgIGVuZGluZ3MsIGJ1dCBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgICAvLyByZWFzb25zIHdlIHN1cHBvcnQgc2VwYXJhdGUgQ1IgYW5kIExGIHRvby5cbiAgICAgICAgLnJlcGxhY2UoLz0oPzpcXHJcXG4/fFxcbnwkKS9nLCBcIlwiKSAvLyBEZWNvZGUgZXNjYXBlIHNlcXVlbmNlcyBvZiB0aGUgZm9ybSBgPVhYYCB3aGVyZSBgWFhgIGlzIGFueVxuICAgICAgICAvLyBjb21iaW5hdGlvbiBvZiB0d28gaGV4aWRlY2ltYWwgZGlnaXRzLiBGb3Igb3B0aW1hbCBjb21wYXRpYmlsaXR5LFxuICAgICAgICAvLyBsb3dlcmNhc2UgaGV4YWRlY2ltYWwgZGlnaXRzIGFyZSBzdXBwb3J0ZWQgYXMgd2VsbC4gU2VlXG4gICAgICAgIC8vIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyMDQ1I3NlY3Rpb24tNi43LCBub3RlIDEuXG4gICAgICAgIC5yZXBsYWNlKC8oPShbYS1mQS1GMC05XXsyfSkpKy9nLCAobWF0Y2gpID0+IHtcbiAgICAgICAgY29uc3QgaGV4VmFsdWVzID0gbWF0Y2guc3BsaXQoLz0vKTtcbiAgICAgICAgLy8gc3BsaXR0aW5nIG9uICc9JyBpcyBjb252ZW5pZW50LCBidXQgYWRkcyBhbiBlbXB0eSBzdHJpbmcgYXQgdGhlIHN0YXJ0IGR1ZSB0byB0aGUgZmlyc3QgYnl0ZVxuICAgICAgICBoZXhWYWx1ZXMuc2hpZnQoKTtcbiAgICAgICAgY29uc3QgaW50QXJyYXkgPSBoZXhWYWx1ZXMubWFwKChjaGFyKSA9PiBwYXJzZUludChjaGFyLCAxNikpO1xuICAgICAgICBjb25zdCBieXRlcyA9IFVpbnQ4QXJyYXkuZnJvbShpbnRBcnJheSk7XG4gICAgICAgIHJldHVybiB1aW50OEFycmF5VG9TdHJpbmcoY2hhcnNldCwgYnl0ZXMpO1xuICAgIH0pKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVCYXNlNjQoY2hhcnNldCwgaW5wdXQpIHtcbiAgICByZXR1cm4gdWludDhBcnJheVRvU3RyaW5nKGNoYXJzZXQsIGJhc2U2NFRvVWludDhBcnJheShpbnB1dCkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQmFzZTY0KHN0cikge1xuICAgIHJldHVybiB1aW50OEFycmF5VG9CYXNlNjQoc3RyaW5nVG9VdGY4VWludDhBcnJheShzdHIpKTtcbn1cbi8qKlxuICogRW5jb2RlcyBhIHZhcmlhYmxlIG51bWJlciBvZiBieXRlIGFycmF5cyBhcyBhIHNpbmdsZSBieXRlIGFycmF5LiBGb3JtYXQ6XG4gKiBzaG9ydChsZW5ndGggb2YgYnl0ZUFycmF5WzBdKSB8IGJ5dGVBcnJheVswXSB8IC4uLiB8IHNob3J0KGxlbmd0aCBvZiBieXRlQXJyYXlbbl0pIHwgYnl0ZUFycmF5W25dXG4gKlxuICogQHJldHVybiBlbmNvZGVkIGJ5dGUgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVBcnJheXNUb0J5dGVzKGJ5dGVBcnJheXMpIHtcbiAgICBjb25zdCB0b3RhbEJ5dGVzTGVuZ3RoID0gYnl0ZUFycmF5cy5yZWR1Y2UoKGFjYywgZWxlbWVudCkgPT4gYWNjICsgZWxlbWVudC5sZW5ndGgsIDApO1xuICAgIGNvbnN0IGVuY29kaW5nT3ZlcmhlYWQgPSBieXRlQXJyYXlzLmxlbmd0aCAqIDI7IC8vIHR3byBieXRlIGxlbmd0aCBvdmVyaGVhZCBmb3IgZWFjaCBieXRlIGFycmF5XG4gICAgY29uc3QgZW5jb2RlZEJ5dGVBcnJheXMgPSBuZXcgVWludDhBcnJheShlbmNvZGluZ092ZXJoZWFkICsgdG90YWxCeXRlc0xlbmd0aCk7XG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBmb3IgKGNvbnN0IGJ5dGVBcnJheSBvZiBieXRlQXJyYXlzKSB7XG4gICAgICAgIGlmIChieXRlQXJyYXkubGVuZ3RoID4gTUFYX0VOQ09ERURfQllURVNfTEVOR1RIKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJieXRlIGFycmF5IGlzIHRvIGxvbmcgZm9yIGVuY29kaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4ID0gd3JpdGVCeXRlQXJyYXkoZW5jb2RlZEJ5dGVBcnJheXMsIGJ5dGVBcnJheSwgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gZW5jb2RlZEJ5dGVBcnJheXM7XG59XG4vKipcbiAqIERlY29kZXMgYSBieXRlIGFycmF5IGVuY29kZWQgYnkgI2J5dGVBcnJheXNUb0J5dGVzLlxuICpcbiAqIEByZXR1cm4gbGlzdCBvZiBieXRlIGFycmF5c1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0J5dGVBcnJheXMoZW5jb2RlZEJ5dGVBcnJheXMsIGV4cGVjdGVkQnl0ZUFycmF5cykge1xuICAgIGNvbnN0IGJ5dGVBcnJheXMgPSBuZXcgQXJyYXkoKTtcbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIHdoaWxlIChpbmRleCA8IGVuY29kZWRCeXRlQXJyYXlzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCByZWFkUmVzdWx0ID0gcmVhZEJ5dGVBcnJheShlbmNvZGVkQnl0ZUFycmF5cywgaW5kZXgpO1xuICAgICAgICBieXRlQXJyYXlzLnB1c2gocmVhZFJlc3VsdC5ieXRlQXJyYXkpO1xuICAgICAgICBpbmRleCA9IHJlYWRSZXN1bHQuaW5kZXg7XG4gICAgfVxuICAgIGlmIChieXRlQXJyYXlzLmxlbmd0aCAhPSBleHBlY3RlZEJ5dGVBcnJheXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhbW91bnQgb2Yga2V5IHBhcmFtZXRlcnMuIEV4cGVjdGVkOiBcIiArIGV4cGVjdGVkQnl0ZUFycmF5cyArIFwiIGFjdHVhbDpcIiArIGJ5dGVBcnJheXMubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ5dGVBcnJheXM7XG59XG4vLyBTaXplIG9mIHRoZSBsZW5ndGggZmllbGQgZm9yIGVuY29kZWQgYnl0ZSBhcnJheXNcbmNvbnN0IEJZVEVfQVJSQVlfTEVOR1RIX0ZJRUxEX1NJWkUgPSAyO1xuY29uc3QgTUFYX0VOQ09ERURfQllURVNfTEVOR1RIID0gNjU1MzU7XG5mdW5jdGlvbiB3cml0ZUJ5dGVBcnJheShyZXN1bHQsIGJ5dGVBcnJheSwgaW5kZXgpIHtcbiAgICB3cml0ZVNob3J0KHJlc3VsdCwgYnl0ZUFycmF5Lmxlbmd0aCwgaW5kZXgpO1xuICAgIGluZGV4ICs9IEJZVEVfQVJSQVlfTEVOR1RIX0ZJRUxEX1NJWkU7XG4gICAgcmVzdWx0LnNldChieXRlQXJyYXksIGluZGV4KTtcbiAgICBpbmRleCArPSBieXRlQXJyYXkubGVuZ3RoO1xuICAgIHJldHVybiBpbmRleDtcbn1cbmZ1bmN0aW9uIHJlYWRCeXRlQXJyYXkoZW5jb2RlZCwgaW5kZXgpIHtcbiAgICBjb25zdCBsZW5ndGggPSByZWFkU2hvcnQoZW5jb2RlZCwgaW5kZXgpO1xuICAgIGluZGV4ICs9IEJZVEVfQVJSQVlfTEVOR1RIX0ZJRUxEX1NJWkU7XG4gICAgY29uc3QgYnl0ZUFycmF5ID0gZW5jb2RlZC5zbGljZShpbmRleCwgbGVuZ3RoICsgaW5kZXgpO1xuICAgIGluZGV4ICs9IGxlbmd0aDtcbiAgICBpZiAoYnl0ZUFycmF5Lmxlbmd0aCAhPSBsZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IHJlYWQgZW5jb2RlZCBieXRlIGFycmF5IGF0IHBvczpcIiArIGluZGV4ICsgXCIgZXhwZWN0ZWQgYnl0ZXM6XCIgKyBsZW5ndGggKyBcIiByZWFkIGJ5dGVzOlwiICsgYnl0ZUFycmF5Lmxlbmd0aCk7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4LCBieXRlQXJyYXkgfTtcbn1cbmZ1bmN0aW9uIHdyaXRlU2hvcnQoYXJyYXksIHZhbHVlLCBpbmRleCkge1xuICAgIGFycmF5W2luZGV4XSA9ICh2YWx1ZSAmIDB4MDAwMGZmMDApID4+IDg7XG4gICAgYXJyYXlbaW5kZXggKyAxXSA9ICh2YWx1ZSAmIDB4MDAwMDAwZmYpID4+IDA7XG59XG5mdW5jdGlvbiByZWFkU2hvcnQoYXJyYXksIGluZGV4KSB7XG4gICAgY29uc3QgYnl0ZXMgPSBhcnJheS5zdWJhcnJheShpbmRleCwgaW5kZXggKyBCWVRFX0FSUkFZX0xFTkdUSF9GSUVMRF9TSVpFKTtcbiAgICBsZXQgbiA9IDA7XG4gICAgZm9yIChjb25zdCBieXRlIG9mIGJ5dGVzLnZhbHVlcygpKSB7XG4gICAgICAgIG4gPSAobiA8PCA4KSB8IGJ5dGU7XG4gICAgfVxuICAgIHJldHVybiBuO1xufVxuIiwiLyoqXG4gKiBBIHdyYXBwZXIgZm9yIGFuIG9iamVjdCB0aGF0IHNoYWxsIGJlIGxhenkgbG9hZGVkIGFzeW5jaHJvbm91c2x5LiBJZiBsb2FkaW5nIHRoZSBvYmplY3QgaXMgdHJpZ2dlcmVkIGluIHBhcmFsbGVsIChnZXRBc3luYygpKSB0aGUgb2JqZWN0IGlzIGFjdHVhbGx5IG9ubHkgbG9hZGVkIG9uY2UgYnV0IHJldHVybmVkIHRvIGFsbCBjYWxscyBvZiBnZXRBc3luYygpLlxuICogSWYgdGhlIG9iamVjdCB3YXMgbG9hZGVkIG9uY2UgaXQgaXMgbm90IGxvYWRlZCBhZ2Fpbi5cbiAqL1xuZXhwb3J0IGNsYXNzIExhenlMb2FkZWQge1xuICAgIGxvYWRGdW5jdGlvbjtcbiAgICBkZWZhdWx0VmFsdWU7XG4gICAgc3RhdGUgPSB7IHN0YXRlOiBcIm5vdF9sb2FkZWRcIiB9O1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSBsb2FkRnVuY3Rpb24gVGhlIGZ1bmN0aW9uIHRoYXQgYWN0dWFsbHkgbG9hZHMgdGhlIG9iamVjdCBhcyBzb29uIGFzIGdldEFzeW5jKCkgaXMgY2FsbGVkIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqIEBwYXJhbSBkZWZhdWx0VmFsdWUgVGhlIHZhbHVlIHRoYXQgc2hhbGwgYmUgcmV0dXJuZWQgYnkgZ2V0U3luYygpIG9yIGdldExvYWRlZCgpIGFzIGxvbmcgYXMgdGhlIG9iamVjdCBpcyBub3QgbG9hZGVkIHlldC5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihsb2FkRnVuY3Rpb24sIGRlZmF1bHRWYWx1ZSA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5sb2FkRnVuY3Rpb24gPSBsb2FkRnVuY3Rpb247XG4gICAgICAgIHRoaXMuZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgICBsb2FkKCkge1xuICAgICAgICB0aGlzLmdldEFzeW5jKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpc0xvYWRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuc3RhdGUgPT09IFwibG9hZGVkXCI7XG4gICAgfVxuICAgIGlzTG9hZGVkT3JMb2FkaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGF0ZSA9PT0gXCJsb2FkZWRcIiB8fCB0aGlzLnN0YXRlLnN0YXRlID09PSBcImxvYWRpbmdcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhlIG9iamVjdCBpZiBpdCBpcyBub3QgbG9hZGVkIHlldC4gTWF5IGJlIGNhbGxlZCBpbiBwYXJhbGxlbCBhbmQgdGFrZXMgY2FyZSB0aGF0IHRoZSBsb2FkIGZ1bmN0aW9uIGlzIG9ubHkgY2FsbGVkIG9uY2UuXG4gICAgICovXG4gICAgZ2V0QXN5bmMoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5zdGF0ZS5zdGF0ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm5vdF9sb2FkZWRcIjoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRpbmdQcm9taXNlID0gdGhpcy5sb2FkRnVuY3Rpb24oKS50aGVuKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0geyBzdGF0ZTogXCJsb2FkZWRcIiwgdmFsdWUgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH0sIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB7IHN0YXRlOiBcIm5vdF9sb2FkZWRcIiB9O1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB7IHN0YXRlOiBcImxvYWRpbmdcIiwgcHJvbWlzZTogbG9hZGluZ1Byb21pc2UgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGluZ1Byb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwibG9hZGluZ1wiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnByb21pc2U7XG4gICAgICAgICAgICBjYXNlIFwibG9hZGVkXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0YXRlLnZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIG51bGwgaWYgdGhlIG9iamVjdCBpcyBub3QgbG9hZGVkIHlldC5cbiAgICAgKi9cbiAgICBnZXRTeW5jKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGF0ZSA9PT0gXCJsb2FkZWRcIiA/IHRoaXMuc3RhdGUudmFsdWUgOiB0aGlzLmRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT25seSBjYWxsIHRoaXMgZnVuY3Rpb24gaWYgeW91IGtub3cgdGhhdCB0aGUgb2JqZWN0IGlzIGFscmVhZHkgbG9hZGVkLlxuICAgICAqL1xuICAgIGdldExvYWRlZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc3RhdGUgPT09IFwibG9hZGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGxvYWRlZCFcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgY3VycmVudGx5IGxvYWRlZCBvYmplY3QsIHNvIGl0IHdpbGwgYmUgbG9hZGVkIGFnYWluIHdpdGggdGhlIG5leHQgZ2V0QXN5bmMoKSBjYWxsLiBEb2VzIG5vdCBzZXQgYW55IGRlZmF1bHQgdmFsdWUuXG4gICAgICovXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7IHN0YXRlOiBcIm5vdF9sb2FkZWRcIiB9O1xuICAgICAgICB0aGlzLmRlZmF1bHRWYWx1ZSA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoZSBvYmplY3QgYWdhaW4gYW5kIHJlcGxhY2VzIHRoZSBjdXJyZW50IG9uZVxuICAgICAqL1xuICAgIGFzeW5jIHJlbG9hZCgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHsgc3RhdGU6IFwibm90X2xvYWRlZFwiIH07XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFzeW5jKCk7XG4gICAgfVxufVxuIiwiLyoqXG4gICAgQHBhcmFtIGl0ZXJhYmxlIC0gSXRlcmF0ZWQgb3ZlciBjb25jdXJyZW50bHkgaW4gdGhlIGBtYXBwZXJgIGZ1bmN0aW9uLlxuICAgIEBwYXJhbSBtYXBwZXIgLSBGdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgZm9yIGV2ZXJ5IGl0ZW0gaW4gYGlucHV0YC4gRXhwZWN0ZWQgdG8gcmV0dXJuIGEgYFByb21pc2VgIG9yIHZhbHVlLlxuICAgIEBwYXJhbSBvcHRpb25zXG4gICAgQHJldHVybnMgQSBgUHJvbWlzZWAgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgcHJvbWlzZXMgaW4gYGlucHV0YCBhbmQgb25lcyByZXR1cm5lZCBmcm9tIGBtYXBwZXJgIGFyZSBmdWxmaWxsZWQsIG9yIHJlamVjdHMgaWYgYW55IG9mIHRoZSBwcm9taXNlcyByZWplY3QuIFRoZSBmdWxmaWxsZWQgdmFsdWUgaXMgYW4gYEFycmF5YCBvZiB0aGUgZnVsZmlsbGVkIHZhbHVlcyByZXR1cm5lZCBmcm9tIGBtYXBwZXJgIGluIGBpbnB1dGAgb3JkZXIuXG4gICAgQGV4YW1wbGVcbiAgICBgYGBcbiAgICBpbXBvcnQgcE1hcCBmcm9tICdwLW1hcCc7XG4gICAgaW1wb3J0IGdvdCBmcm9tICdnb3QnO1xuICAgIGNvbnN0IHNpdGVzID0gW1xuICAgICAgICBnZXRXZWJzaXRlRnJvbVVzZXJuYW1lKCdzaW5kcmVzb3JodXMnKSwgLy89PiBQcm9taXNlXG4gICAgICAgICdodHRwczovL2F2YWpzLmRldicsXG4gICAgICAgICdodHRwczovL2dpdGh1Yi5jb20nXG4gICAgXTtcbiAgICBjb25zdCBtYXBwZXIgPSBhc3luYyBzaXRlID0+IHtcbiAgICAgICAgY29uc3Qge3JlcXVlc3RVcmx9ID0gYXdhaXQgZ290LmhlYWQoc2l0ZSk7XG4gICAgICAgIHJldHVybiByZXF1ZXN0VXJsO1xuICAgIH07XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcE1hcChzaXRlcywgbWFwcGVyLCB7Y29uY3VycmVuY3k6IDJ9KTtcbiAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgIC8vPT4gWydodHRwczovL3NpbmRyZXNvcmh1cy5jb20vJywgJ2h0dHBzOi8vYXZhanMuZGV2LycsICdodHRwczovL2dpdGh1Yi5jb20vJ11cbiAgICBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBNYXAoaXRlcmFibGUsIG1hcHBlciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgeyBjb25jdXJyZW5jeSA9IDEgfSA9IG9wdGlvbnM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXBwZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk1hcHBlciBmdW5jdGlvbiBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISgoTnVtYmVyLmlzU2FmZUludGVnZXIoY29uY3VycmVuY3kpIHx8IGNvbmN1cnJlbmN5ID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpICYmIGNvbmN1cnJlbmN5ID49IDEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCBcXGBjb25jdXJyZW5jeVxcYCB0byBiZSBhbiBpbnRlZ2VyIGZyb20gMSBhbmQgdXAgb3IgXFxgSW5maW5pdHlcXGAsIGdvdCBcXGAke2NvbmN1cnJlbmN5fVxcYCAoJHt0eXBlb2YgY29uY3VycmVuY3l9KWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcbiAgICAgICAgY29uc3QgaXRlcmF0b3IgPSBpdGVyYWJsZVtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gICAgICAgIGxldCBpc1JlamVjdGVkID0gZmFsc2U7XG4gICAgICAgIGxldCBpc0l0ZXJhYmxlRG9uZSA9IGZhbHNlO1xuICAgICAgICBsZXQgcmVzb2x2aW5nQ291bnQgPSAwO1xuICAgICAgICBsZXQgY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgbmV4dCA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChpc1JlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV4dEl0ZW0gPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCsrO1xuICAgICAgICAgICAgaWYgKG5leHRJdGVtLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBpc0l0ZXJhYmxlRG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKHJlc29sdmluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2aW5nQ291bnQrKztcbiAgICAgICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGF3YWl0IG5leHRJdGVtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gYXdhaXQgbWFwcGVyKGVsZW1lbnQsIGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2aW5nQ291bnQtLTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNSZWplY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmN1cnJlbmN5OyBpbmRleCsrKSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICBpZiAoaXNJdGVyYWJsZURvbmUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuIiwiaW1wb3J0IHsgcE1hcCBhcyBwcm9taXNlTWFwIH0gZnJvbSBcIi4vUHJvbWlzZU1hcC5qc1wiO1xuLyoqXG4gKiBNYXAgYXJyYXkgb2YgdmFsdWVzIHRvIHByb21pc2Ugb2YgYXJyYXlzIG9yIGFycmF5LiBNYXBwZXIgZnVuY3Rpb24gbWF5IHJldHVybiBwcm9taXNlIG9yIHZhbHVlLiBJZiB2YWx1ZSBpcyByZXR1cm5lZCxcbiAqIHdlIGF2b2lkIHByb21pc2Ugc2NoZWR1bGluZy5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCB0byBydW4gdGhlIHdob2xlIG9wZXJhdGlvbiBpbiBvbmUgbWljcm90YXNrIChlLmcuIGtlZXAgSW5kZXhlZERCIHRyYW5zYWN0aW9uIGFjdGl2ZSwgd2hpY2ggaXMgY2xvc2VkIGluXG4gKiBzb21lIGJyb3dzZXJzIChlLmcuIFNhZmFyaSkgd2hlbiBldmVudCBsb29wIGl0ZXJhdGlvbiBlbmRzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcEluQ2FsbENvbnRleHQodmFsdWVzLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzYWJsZVdyYXBwZXIoX21hcEluQ2FsbENvbnRleHQodmFsdWVzLCBjYWxsYmFjaywgMCwgW10pKTtcbn1cbmZ1bmN0aW9uIF9tYXBJbkNhbGxDb250ZXh0KHZhbHVlcywgY2FsbGJhY2ssIGluZGV4LCBhY2MpIHtcbiAgICBpZiAoaW5kZXggPj0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH1cbiAgICBsZXQgbWFwcGVkVmFsdWUgPSBjYWxsYmFjayh2YWx1ZXNbaW5kZXhdLCBpbmRleCk7XG4gICAgaWYgKG1hcHBlZFZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gbWFwcGVkVmFsdWUudGhlbigodikgPT4ge1xuICAgICAgICAgICAgYWNjLnB1c2godik7XG4gICAgICAgICAgICByZXR1cm4gX21hcEluQ2FsbENvbnRleHQodmFsdWVzLCBjYWxsYmFjaywgaW5kZXggKyAxLCBhY2MpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFjYy5wdXNoKG1hcHBlZFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIF9tYXBJbkNhbGxDb250ZXh0KHZhbHVlcywgY2FsbGJhY2ssIGluZGV4ICsgMSwgYWNjKTtcbiAgICB9XG59XG5leHBvcnQgeyBwTWFwIGFzIHByb21pc2VNYXAgfSBmcm9tIFwiLi9Qcm9taXNlTWFwLmpzXCI7XG5mdW5jdGlvbiBtYXBOb0ZhbGxiYWNrKHZhbHVlcywgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gUHJvbWlzYWJsZVdyYXBwZXIuZnJvbShwcm9taXNlTWFwKHZhbHVlcywgY2FsbGJhY2ssIG9wdGlvbnMpKTtcbn1cbi8qKiBGYWN0b3J5IGZ1bmN0aW9uIHdoaWNoIGdpdmVzIHlvdSBhY2sgcHJvbWlzZU1hcCBpbXBsZW1lbnRhdGlvbi4ge0BzZWUgbWFwSW5DYWxsQ29udGV4dH0gZm9yIHdoYXQgaXQgbWVhbnMuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvbWlzZU1hcENvbXBhdCh1c2VNYXBJbkNhbGxDb250ZXh0KSB7XG4gICAgcmV0dXJuIHVzZU1hcEluQ2FsbENvbnRleHQgPyBtYXBJbkNhbGxDb250ZXh0IDogbWFwTm9GYWxsYmFjaztcbn1cbmZ1bmN0aW9uIGZsYXRXcmFwcGVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzYWJsZVdyYXBwZXIgPyB2YWx1ZS52YWx1ZSA6IHZhbHVlO1xufVxuLy8gSXQga2luZGEgaW1wbGVtZW50cyAndGhlbmFibGUnIHByb3RvY29sIHNvIHlvdSBjYW4gZnJlZWx5IHBhc3MgaXQgYXJvdW5kIGFzIGEgZ2VuZXJpYyBwcm9taXNlXG5leHBvcnQgY2xhc3MgUHJvbWlzYWJsZVdyYXBwZXIge1xuICAgIHN0YXRpYyBmcm9tKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzYWJsZVdyYXBwZXIodmFsdWUpO1xuICAgIH1cbiAgICB2YWx1ZTtcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlID8gdmFsdWUudGhlbihmbGF0V3JhcHBlcikgOiBmbGF0V3JhcHBlcih2YWx1ZSk7XG4gICAgfVxuICAgIHRoZW5PckFwcGx5KG9uRnVsZmlsbCwgb25SZWplY3QpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICBjb25zdCB2ID0gdGhpcy52YWx1ZS50aGVuKG9uRnVsZmlsbCwgb25SZWplY3QpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNhYmxlV3JhcHBlcih2KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNhYmxlV3JhcHBlcihvbkZ1bGZpbGwodGhpcy52YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAob25SZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNhYmxlV3JhcHBlcihvblJlamVjdChlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9Qcm9taXNlKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMudmFsdWUpO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWxheShtcykge1xuICAgIGlmIChOdW1iZXIuaXNOYU4obXMpIHx8IG1zIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGVsYXk6ICR7bXN9YCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKTtcbiAgICB9KTtcbn1cbi8qKlxuICogUGFzcyB0byBQcm9taXNlLnRoZW4gdG8gcGVyZm9ybSBhbiBhY3Rpb24gd2hpbGUgZm9yd2FyZGluZyBvbiB0aGUgcmVzdWx0XG4gKiBAcGFyYW0gYWN0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0YXAoYWN0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBhY3Rpb24odmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbn1cbi8qKlxuICogSGVscGVyIHV0aWxpdHkgaW50ZW5kZWQgdG8gYmUgdXNlZCB3aXRoIHR5cGVkIGV4Y2VwdGlvbnMgYW5kIC5jYXRjaCgpIG1ldGhvZCBvZiBwcm9taXNlIGxpa2Ugc286XG4gKlxuICogYGBganNcbiAqICBjbGFzcyBTcGVjaWZpY0Vycm9yIGV4dGVuZHMgRXJyb3Ige31cbiAqXG4gKiAgUHJvbWlzZS5yZWplY3QobmV3IFNwZWNpZmljRXJyb3IoKSlcbiAqICAgICAgLmNhdGNoKG9mQ2xhc3MoU3BlY2lmaWNFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwic29tZSBlcnJvclwiLCBlKSkpXG4gKiAgICAgIC5jYXRjaCgoZSkgPT4gY29uc29sZS5sb2coXCJnZW5lcmljIGVycm9yXCIsIGUpKVxuICogYGBgXG4gKlxuICogQHBhcmFtIGNscyBDbGFzcyB3aGljaCB3aWxsIGJlIGNhdWdodFxuICogQHBhcmFtIGNhdGNoZXIgdG8gaGFuZGxlIG9ubHkgZXJyb3JzIG9mIHR5cGUgY2xzXG4gKiBAcmV0dXJucyBoYW5kbGVyIHdoaWNoIGVpdGhlciBmb3J3YXJkcyB0byBjYXRjaGVyIG9yIHJldGhyb3dzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvZkNsYXNzKGNscywgY2F0Y2hlcikge1xuICAgIHJldHVybiBhc3luYyAoZSkgPT4ge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIGNscykge1xuICAgICAgICAgICAgcmV0dXJuIGNhdGNoZXIoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBJdCdzIG9rYXkgdG8gcmV0aHJvdyBiZWNhdXNlOlxuICAgICAgICAgICAgLy8gMS4gSXQgcHJlc2VydmVzIHRoZSBvcmlnaW5hbCBzdGFja3RyYWNlXG4gICAgICAgICAgICAvLyAyLiBCZWNhdXNlIG9mIDEuIGl0IGlzIG5vdCB0aGF0IGV4cGVuc2l2ZVxuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEZpbHRlciBpdGVyYWJsZS4gSnVzdCBsaWtlIEFycmF5LnByb3RvdHlwZS5maWx0ZXIgYnV0IGNhbGxiYWNrIGNhbiByZXR1cm4gcHJvbWlzZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb21pc2VGaWx0ZXIoaXRlcmFibGUsIGZpbHRlcikge1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgZm9yIChsZXQgaXRlbSBvZiBpdGVyYWJsZSkge1xuICAgICAgICBpZiAoYXdhaXQgZmlsdGVyKGl0ZW0sIGluZGV4KSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbi8qKiBDYWxsIHRoZSBoYW5kbGVyIGZvciBib3RoIHJlc29sdXRpb24gYW5kIHJlamVjdGlvbi4gVW5saWtlIGZpbmFsbHkoKSB3aWxsIG5vdCBwcm9wYWdhdGUgdGhlIGVycm9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHRsZWRUaGVuKHByb21pc2UsIGhhbmRsZXIpIHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKGhhbmRsZXIsIGhhbmRsZXIpO1xufVxuIiwiaW1wb3J0IHsgZmluZEFuZFJlbW92ZSwgaW5zZXJ0SW50b1NvcnRlZEFycmF5IH0gZnJvbSBcIi4vQXJyYXlVdGlscy5qc1wiO1xuLyoqXG4gKiBDb21wYXJlZCBiYXNlZCBvbiB0aGUgdHlwZSdzIG5hdHVyYWwgb3JkZXJpbmdcbiAqL1xuZnVuY3Rpb24gbnVtYmVyQ29tcGFyZShhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xufVxuLyoqXG4gKiBBbiBhcnJheSB0aGF0IGtlZXBzIGl0c2VsZiBzb3J0ZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFNvcnRlZEFycmF5IHtcbiAgICBjb250ZW50cztcbiAgICBjb21wYXJlRm47XG4gICAgY29uc3RydWN0b3IoY29udGVudHMsIGNvbXBhcmVGbikge1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gY29udGVudHM7XG4gICAgICAgIHRoaXMuY29tcGFyZUZuID0gY29tcGFyZUZuO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbU51bWJlcnMoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIFNvcnRlZEFycmF5LmZyb20oYXJyYXksIG51bWJlckNvbXBhcmUpO1xuICAgIH1cbiAgICBzdGF0aWMgZW1wdHkoY29tcGFyZUZuKSB7XG4gICAgICAgIHJldHVybiBuZXcgU29ydGVkQXJyYXkoW10sIGNvbXBhcmVGbik7XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tKGFycmF5LCBjb21wYXJlRm4pIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IG5ldyBTb3J0ZWRBcnJheShbXSwgY29tcGFyZUZuKTtcbiAgICAgICAgbGlzdC5pbnNlcnRBbGwoYXJyYXkpO1xuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG4gICAgZ2V0IGxlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudHMubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgYXJyYXkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRzO1xuICAgIH1cbiAgICBnZXQoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudHNbaW5kZXhdO1xuICAgIH1cbiAgICBpbnNlcnRBbGwoYXJyYXkpIHtcbiAgICAgICAgdGhpcy5jb250ZW50cy5wdXNoKC4uLmFycmF5KTtcbiAgICAgICAgdGhpcy5jb250ZW50cy5zb3J0KHRoaXMuY29tcGFyZUZuKTtcbiAgICB9XG4gICAgaW5zZXJ0KGl0ZW0pIHtcbiAgICAgICAgaW5zZXJ0SW50b1NvcnRlZEFycmF5KGl0ZW0sIHRoaXMuY29udGVudHMsIHRoaXMuY29tcGFyZUZuKTtcbiAgICB9XG4gICAgcmVtb3ZlRmlyc3QoZmluZGVyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQW5kUmVtb3ZlKHRoaXMuY29udGVudHMsIGZpbmRlcik7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHdoaWNoIGNvbnRhaW5zIHRoZSBnaXZlbiBudW1iZXIgcGFkZGVkIHdpdGggMHMuXG4gKiBAcGFyYW0gbnVtIFRoZSBudW1iZXIgdG8gcGFkLlxuICogQHBhcmFtIHNpemUgVGhlIG51bWJlciBvZiByZXN1bHRpbmcgZGlnaXRzLlxuICogQHJldHVybiBUaGUgcGFkZGVkIG51bWJlciBhcyBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYWQobnVtLCBzaXplKSB7XG4gICAgbGV0IHMgPSBudW0gKyBcIlwiO1xuICAgIHdoaWxlIChzLmxlbmd0aCA8IHNpemUpXG4gICAgICAgIHMgPSBcIjBcIiArIHM7XG4gICAgcmV0dXJuIHM7XG59XG4vKipcbiAqIENoZWNrcyBpZiBhIHN0cmluZyBzdGFydHMgd2l0aCBhbm90aGVyIHN0cmluZy5cbiAqIEBwYXJhbSBzdHJpbmcgVGhlIHN0cmluZyB0byB0ZXN0LlxuICogQHBhcmFtIHN1YnN0cmluZyBJZiB0aGUgb3RoZXIgc3RyaW5nIGJlZ2lucyB3aXRoIHRoaXMgb25lLCB3ZSByZXR1cm4gdHJ1ZS5cbiAqIEByZXR1cm4gVHJ1ZSBpZiBzdHJpbmcgYmVnaW5zIHdpdGggc3Vic3RyaW5nLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydHNXaXRoKHN0cmluZywgc3Vic3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5zdGFydHNXaXRoKHN1YnN0cmluZyk7XG59XG4vKipcbiAqIHVwcGVyY2FzZSB0aGUgZmlyc3QgbGV0dGVyIG9mIGEgc3RyaW5nLCBsb3dlcmNhc2UgdGhlIHJlc3RcbiAqIEBwYXJhbSBzdHIgc3RyaW5nIHRvIHRyYW5zZm9ybVxuICogQHJldHVybnMge3N0cmluZ30gc3RyIGluIGxvd2VyY2FzZSB3aXRoIGZpcnN0IGxldHRlciBDYXBpdGFsaXplZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cikge1xuICAgIHJldHVybiBzdHJbMF0udG9VcHBlckNhc2UoKSArIHN0ci50b0xvd2VyQ2FzZSgpLnNsaWNlKDEpO1xufVxuLyoqXG4gKiBDaGVja3MgaWYgYSBzdHJpbmcgZW5kcyB3aXRoIGFub3RoZXIgc3RyaW5nLlxuICogQHBhcmFtIHN0cmluZyBUaGUgc3RyaW5nIHRvIHRlc3QuXG4gKiBAcGFyYW0gc3Vic3RyaW5nIElmIHRoZSBvdGhlciBzdHJpbmcgZW5kcyB3aXRoIHRoaXMgb25lLCB3ZSByZXR1cm4gdHJ1ZS5cbiAqIEByZXR1cm4gVHJ1ZSBpZiBzdHJpbmcgZW5kcyB3aXRoIHN1YnN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5kc1dpdGgoc3RyaW5nLCBzdWJzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLmVuZHNXaXRoKHN1YnN0cmluZyk7XG59XG5leHBvcnQgZnVuY3Rpb24gbGF6eVN0cmluZ1ZhbHVlKHZhbHVlT3JMYXp5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZU9yTGF6eSA9PT0gXCJmdW5jdGlvblwiID8gdmFsdWVPckxhenkoKSA6IHZhbHVlT3JMYXp5O1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdCh2YWx1ZSwgbGVuZ3RoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnQgZnVuY3Rpb24gY2xlYW5NYXRjaChzMSwgczIpIHtcbiAgICByZXR1cm4gczEudG9Mb3dlckNhc2UoKS50cmltKCkgPT09IHMyLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xufVxuLyoqXG4gKiBOb24tYnJlYWtpbmcgc3BhY2UgY2hhcmFjdGVyXG4gKi9cbmV4cG9ydCBjb25zdCBOQlNQID0gXCJcXHUwMEEwXCI7XG4vKipcbiAqIHNwbGl0IGEgc3RyaW5nIGF0IGEgZ2l2ZW4gaW5kZXhcbiAqIEBwYXJhbSBzdHJcbiAqIEBwYXJhbSBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRBdChzdHIsIGluZGV4KSB7XG4gICAgcmV0dXJuIFtzdHIuc3Vic3RyaW5nKDAsIGluZGV4KSwgc3RyLnN1YnN0cmluZyhpbmRleCldO1xufVxuLyoqXG4gKiBXcmFwcGVyIGFyb3VuZCBTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlLCBuaWNlIGZvciBjYWxscyB0byBBcnJheS5wcm90b3R5cGUubWFwXG4gKiBAcGFyYW0gc3RyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0xvd2VyQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG59XG4vKipcbiAqIFdyYXBwZXIgYXJvdW5kIFN0cmluZy5wcm90b3R5cGUubG9jYWxlQ29tcGFyZSwgZm9yIHBhc3NpbmcgdG8gQXJyYXkucHJvdG90eXBlLnNvcnRcbiAqIEBwYXJhbSBhXG4gKiBAcGFyYW0gYlxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsZUNvbXBhcmUoYSwgYikge1xuICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYik7XG59XG5leHBvcnQgZnVuY3Rpb24gYnl0ZUxlbmd0aChzdHIpIHtcbiAgICBpZiAoc3RyID09IG51bGwpXG4gICAgICAgIHJldHVybiAwO1xuICAgIC8vIHJldHVybnMgdGhlIGJ5dGUgbGVuZ3RoIG9mIGFuIHV0Zjggc3RyaW5nXG4gICAgbGV0IHMgPSBzdHIubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSBzdHIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgY29uc3QgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBpZiAoY29kZSA+IDB4N2YgJiYgY29kZSA8PSAweDdmZikge1xuICAgICAgICAgICAgcysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNvZGUgPiAweDdmZiAmJiBjb2RlIDw9IDB4ZmZmZilcbiAgICAgICAgICAgIHMgKz0gMjtcbiAgICAgICAgaWYgKGNvZGUgPj0gMHhkYzAwICYmIGNvZGUgPD0gMHhkZmZmKVxuICAgICAgICAgICAgaS0tOyAvL3RyYWlsIHN1cnJvZ2F0ZVxuICAgIH1cbiAgICByZXR1cm4gcztcbn1cbiIsImltcG9ydCB7IHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkgfSBmcm9tIFwiLi9FbmNvZGluZy5qc1wiO1xuLyoqXG4gKiBDYWxsIHRoZSBXZWJBc3NlbWJseSBmdW5jdGlvbiB3aXRoIHRoZSBnaXZlbiBhcmd1bWVudHMuXG4gKlxuICogQXV0b21hdGljYWxseSBhbGxvY2F0ZXMgc3RyaW5ncyBhbmQgYnVmZmVycyBhbmQgZnJlZXMgdGhlbSB3aGlsZSBwYXNzaW5nIGJvb2xlYW5zIGFuZCBudW1iZXJzIGFzLWlzLlxuICpcbiAqIEBwYXJhbSBmdW5jIGZ1bmN0aW9uIHRvIGNhbGxcbiAqIEBwYXJhbSBleHBvcnRzIFdBU00gbW9kdWxlIGluc3RhbmNlJ3MgZXhwb3J0c1xuICogQHBhcmFtIGFyZ3MgYXJndW1lbnRzIHRvIHBhc3NcbiAqXG4gKiBAcmV0dXJuIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxXZWJBc3NlbWJseUZ1bmN0aW9uV2l0aEFyZ3VtZW50cyhmdW5jLCBleHBvcnRzLCAuLi5hcmdzKSB7XG4gICAgY29uc3QgYXJnc1RvUGFzcyA9IFtdO1xuICAgIGNvbnN0IHRvRnJlZSA9IFtdO1xuICAgIGNvbnN0IHRvQ2xlYXIgPSBbXTtcbiAgICBjb25zdCB0b092ZXJ3cml0ZSA9IFtdO1xuICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgYXJnIG9mIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmcgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBgTlVMTGAgaW4gQyBpcyBlcXVhbCB0byAwXG4gICAgICAgICAgICAgICAgYXJnc1RvUGFzcy5wdXNoKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIC8vIFRoZXNlIGNhbiBiZSBwYXNzZWQgYXMtaXNcbiAgICAgICAgICAgICAgICBhcmdzVG9QYXNzLnB1c2goYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCB0byBudW1iZXJcbiAgICAgICAgICAgICAgICBhcmdzVG9QYXNzLnB1c2goYXJnID8gMSA6IDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIC8vIFN0cmluZ3MgcmVxdWlyZSBudWxsIHRlcm1pbmF0aW9uIGFuZCBjb3B5aW5nLCBzbyB3ZSBkbyB0aGlzIGhlcmVcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gYWxsb2NhdGVTdHJpbmdDb3B5KGFyZywgZXhwb3J0cywgdG9GcmVlKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0b0NsZWFyLnB1c2gocyk7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NUb1Bhc3MucHVzaChzLmJ5dGVPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICB0b0ZyZWUucHVzaChzLmJ5dGVPZmZzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmZyZWUocy5ieXRlT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBNdXRhYmxlVWludDhBcnJheSkge1xuICAgICAgICAgICAgICAgIC8vIFVud3JhcCB0byBnZXQgb3VyIG9yaWdpbmFsIGJ1ZmZlciBiYWNrXG4gICAgICAgICAgICAgICAgY29uc3QgaW5wdXRPdXRwdXQgPSBhcmcudWludDhBcnJheUlucHV0T3V0cHV0O1xuICAgICAgICAgICAgICAgIGxldCBhcnJheUluV0FTTTtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXRPdXRwdXQgaW5zdGFuY2VvZiBTZWN1cmVGcmVlVWludDhBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBhcnJheUluV0FTTSA9IGFsbG9jYXRlU2VjdXJlQXJyYXlDb3B5KGlucHV0T3V0cHV0LnVpbnQ4QXJyYXlJbnB1dCwgZXhwb3J0cywgdG9GcmVlLCB0b0NsZWFyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFycmF5SW5XQVNNID0gYWxsb2NhdGVBcnJheUNvcHkoaW5wdXRPdXRwdXQsIGV4cG9ydHMsIHRvRnJlZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRvT3ZlcndyaXRlLnB1c2goeyBhcnJheUluV0FTTTogYXJyYXlJbldBU00sIG9yaWdpbmFsQnVmZmVyWW91UGFzc2VkSW46IGFyZyB9KTtcbiAgICAgICAgICAgICAgICBhcmdzVG9QYXNzLnB1c2goYXJyYXlJbldBU00uYnl0ZU9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBTZWN1cmVGcmVlVWludDhBcnJheSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFycmF5SW5XQVNNID0gYWxsb2NhdGVTZWN1cmVBcnJheUNvcHkoYXJnLnVpbnQ4QXJyYXlJbnB1dCwgZXhwb3J0cywgdG9GcmVlLCB0b0NsZWFyKTtcbiAgICAgICAgICAgICAgICBhcmdzVG9QYXNzLnB1c2goYXJyYXlJbldBU00uYnl0ZU9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IGFyZyBpbnN0YW5jZW9mIEludDhBcnJheSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFycmF5SW5XQVNNID0gYWxsb2NhdGVBcnJheUNvcHkoYXJnLCBleHBvcnRzLCB0b0ZyZWUpO1xuICAgICAgICAgICAgICAgIGFyZ3NUb1Bhc3MucHVzaChhcnJheUluV0FTTS5ieXRlT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFzc2VkIGFuIHVuaGFuZGxlZCBhcmd1bWVudCB0eXBlICR7dHlwZW9mIGFyZ31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuYyguLi5hcmdzVG9QYXNzKTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIC8vIEZpcnN0IGNvcHkgYmFjayBpbiB0aGUgY29udGVudHMgZnJvbSB0aGUgV0FTTSBtZW1vcnkgdG8gSmF2YVNjcmlwdFxuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgdG9PdmVyd3JpdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0T3V0cHV0ID0gZi5vcmlnaW5hbEJ1ZmZlcllvdVBhc3NlZEluLnVpbnQ4QXJyYXlJbnB1dE91dHB1dDtcbiAgICAgICAgICAgIGlmIChpbnB1dE91dHB1dCBpbnN0YW5jZW9mIFNlY3VyZUZyZWVVaW50OEFycmF5KSB7XG4gICAgICAgICAgICAgICAgaW5wdXRPdXRwdXQudWludDhBcnJheUlucHV0LnNldChmLmFycmF5SW5XQVNNKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlucHV0T3V0cHV0LnNldChmLmFycmF5SW5XQVNNKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgc2VjdXJlIGZyZWUgYnVmZmVyc1xuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgdG9DbGVhcikge1xuICAgICAgICAgICAgZi5maWxsKDApO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZpbmFsbHkgZnJlZVxuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgdG9GcmVlKSB7XG4gICAgICAgICAgICBleHBvcnRzLmZyZWUoZik7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIEFsbG9jYXRlIG1lbW9yeSBvbiB0aGUgaGVhcCBvZiB0aGUgV2ViQXNzZW1ibHkgaW5zdGFuY2UuXG4gKlxuICogQmUgc3VyZSB0byBjYWxsIGBmcmVlYCBvbiB0aGUgYnl0ZU9mZnNldCB3aGVuIHlvdSBhcmUgZG9uZSFcbiAqXG4gKiBAcGFyYW0gbGVuZ3RoIGxlbmd0aCBvZiBkYXRhIHRvIGFsbG9jYXRlXG4gKiBAcGFyYW0gZXhwb3J0cyBXQVNNIG1vZHVsZSBpbnN0YW5jZSdzIGV4cG9ydHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jYXRlQnVmZmVyKGxlbmd0aCwgZXhwb3J0cykge1xuICAgIGNvbnN0IG1lbW9yeSA9IGV4cG9ydHMubWVtb3J5O1xuICAgIGNvbnN0IHB0ciA9IGV4cG9ydHMubWFsbG9jKGxlbmd0aCk7XG4gICAgaWYgKHB0ciA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJtYWxsb2MgZmFpbGVkIHRvIGFsbG9jYXRlIG1lbW9yeSBmb3Igc3RyaW5nXCIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobWVtb3J5LmJ1ZmZlciwgcHRyLCBsZW5ndGgpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBleHBvcnRzLmZyZWUocHRyKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG59XG4vKipcbiAqIFdyYXBwZXIgdG8gYmUgcGFzc2VkIHRvIGEgV2ViQXNzZW1ibHkgZnVuY3Rpb24uXG4gKlxuICogVGhlIGNvbnRlbnRzIG9mIHRoZSBhcnJheSB3aWxsIGJlIHVwZGF0ZWQgd2hlbiB0aGUgZnVuY3Rpb24gZmluaXNoZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlVWludDhBcnJheSB7XG4gICAgdWludDhBcnJheUlucHV0T3V0cHV0O1xuICAgIGNvbnN0cnVjdG9yKHVpbnQ4QXJyYXlJbnB1dE91dHB1dCkge1xuICAgICAgICB0aGlzLnVpbnQ4QXJyYXlJbnB1dE91dHB1dCA9IHVpbnQ4QXJyYXlJbnB1dE91dHB1dDtcbiAgICB9XG59XG4vKipcbiAqIFdyYXBwZXIgdG8gYmUgcGFzc2VkIHRvIGEgV2ViQXNzZW1ibHkgZnVuY3Rpb24uXG4gKlxuICogVGhlIGNvcHkgYWxsb2NhdGVkIG9uIHRoZSBWTSB3aWxsIGJlIGZpbGxlZCB3aXRoIHplcm8gYnl0ZXMuIFRoaXMgaXMgc2xvd2VyLCBidXQgaXQgd2lsbCBlbnN1cmUgdGhhdCBpdHMgY29udGVudHMgd29uJ3QgbGluZ2VyIGFmdGVyIGJlaW5nIGZyZWVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgYnVmZmVyIHBvaW50ZWQgdG8gYnkgdWludDhBcnJheUlucHV0IGlzICpub3QqIHplcm9lZCBvdXQgYXV0b21hdGljYWxseSwgYXMgaXQgaXMgbm90IGEgZGVlcCBjb3B5LCBzbyByZW1lbWJlciB0byB6ZXJvIG91dCB0aGUgb3JpZ2luYWwgYnVmZmVyXG4gKiB3aGVuIHlvdSBhcmUgZG9uZSB3aXRoIGl0LCB0b28hXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWN1cmVGcmVlVWludDhBcnJheSB7XG4gICAgdWludDhBcnJheUlucHV0O1xuICAgIGNvbnN0cnVjdG9yKHVpbnQ4QXJyYXlJbnB1dCkge1xuICAgICAgICB0aGlzLnVpbnQ4QXJyYXlJbnB1dCA9IHVpbnQ4QXJyYXlJbnB1dDtcbiAgICB9XG59XG4vKipcbiAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciB3cmFwcGluZyBhbiBhcnJheSBhcyBhIE11dGFibGVVaW50OEFycmF5LlxuICpcbiAqIERhdGEgZnJvbSB0aGUgV0FTTSBtb2R1bGUgd2lsbCBiZSBjb3BpZWQgYmFjayB0byB0aGUgYXJyYXkgb25jZSBmaW5pc2hlZC5cbiAqIEBwYXJhbSBhcnJheSBhcnJheSB0byB3cmFwXG4gKiBAcmV0dXJuIHdyYXBwZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG11dGFibGUoYXJyYXkpIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVVaW50OEFycmF5KGFycmF5KTtcbn1cbi8qKlxuICogQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIHdyYXBwaW5nIGFuIGFycmF5IGFzIGEgTXV0YWJsZVVpbnQ4QXJyYXkgYW5kIFNlY3VyZUZyZWVVaW50OEFycmF5LlxuICpcbiAqIERhdGEgZnJvbSB0aGUgV0FTTSBtb2R1bGUgd2lsbCBiZSBjb3BpZWQgYmFjayB0byB0aGUgYXJyYXkgb25jZSBmaW5pc2hlZCwgYW5kIHRoZW4gaXQgd2lsbCBiZSBlcmFzZWQgZnJvbSB0aGUgbW9kdWxlLlxuICogQHBhcmFtIGFycmF5IGFycmF5IHRvIHdyYXBcbiAqIEByZXR1cm4gd3JhcHBlclxuICovXG5leHBvcnQgZnVuY3Rpb24gbXV0YWJsZVNlY3VyZUZyZWUoYXJyYXkpIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVVaW50OEFycmF5KG5ldyBTZWN1cmVGcmVlVWludDhBcnJheShhcnJheSkpO1xufVxuLyoqXG4gKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3Igd3JhcHBpbmcgYW4gYXJyYXkgYXMgYSBNdXRhYmxlVWludDhBcnJheSBhbmQgU2VjdXJlRnJlZVVpbnQ4QXJyYXkuXG4gKlxuICogRGF0YSBmcm9tIHRoZSBXQVNNIG1vZHVsZSB3aWxsIGJlIGVyYXNlZCBvbmNlIGZpbmlzaGVkLlxuICogQHBhcmFtIGFycmF5IGFycmF5IHRvIHdyYXBcbiAqIEByZXR1cm4gd3JhcHBlclxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VjdXJlRnJlZShhcnJheSkge1xuICAgIHJldHVybiBuZXcgU2VjdXJlRnJlZVVpbnQ4QXJyYXkoYXJyYXkpO1xufVxuZnVuY3Rpb24gYWxsb2NhdGVTdHJpbmdDb3B5KHN0ciwgZXhwb3J0cywgdG9GcmVlKSB7XG4gICAgY29uc3Qgc3RyQnl0ZXMgPSBzdHJpbmdUb1V0ZjhVaW50OEFycmF5KHN0cik7XG4gICAgY29uc3QgYWxsb2NhdGlvbkFtb3VudCA9IHN0ckJ5dGVzLmxlbmd0aCArIDE7XG4gICAgbGV0IGJ1ZiA9IGFsbG9jYXRlQnVmZmVyKGFsbG9jYXRpb25BbW91bnQsIGV4cG9ydHMpO1xuICAgIHRyeSB7XG4gICAgICAgIGJ1Zi5zZXQoc3RyQnl0ZXMpO1xuICAgICAgICBidWZbYnVmLmxlbmd0aCAtIDFdID0gMDsgLy8gbnVsbCB0ZXJtaW5hdGUgYWZ0ZXIgc3RyaW5nIGRhdGFcbiAgICAgICAgdG9GcmVlLnB1c2goYnVmLmJ5dGVPZmZzZXQpO1xuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBleHBvcnRzLmZyZWUoYnVmLmJ5dGVPZmZzZXQpO1xuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFsbG9jYXRlQXJyYXlDb3B5KGFyciwgZXhwb3J0cywgdG9GcmVlKSB7XG4gICAgY29uc3QgYWxsb2NhdGlvbkFtb3VudCA9IGFyci5sZW5ndGg7XG4gICAgbGV0IGJ1ZiA9IGFsbG9jYXRlQnVmZmVyKGFsbG9jYXRpb25BbW91bnQsIGV4cG9ydHMpO1xuICAgIHRyeSB7XG4gICAgICAgIGJ1Zi5zZXQoYXJyKTtcbiAgICAgICAgdG9GcmVlLnB1c2goYnVmLmJ5dGVPZmZzZXQpO1xuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBleHBvcnRzLmZyZWUoYnVmLmJ5dGVPZmZzZXQpO1xuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFsbG9jYXRlU2VjdXJlQXJyYXlDb3B5KGFyciwgZXhwb3J0cywgdG9GcmVlLCB0b0NsZWFyKSB7XG4gICAgY29uc3QgYXJyYXlJbldBU00gPSBhbGxvY2F0ZUFycmF5Q29weShhcnIsIGV4cG9ydHMsIHRvRnJlZSk7XG4gICAgdHJ5IHtcbiAgICAgICAgdG9DbGVhci5wdXNoKGFycmF5SW5XQVNNKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gb24gdGhlIG9mZiBjaGFuY2UgdGhhdCBwdXNoIGZhaWxzLCB3ZSBkb24ndCB3YW50IHRoZSBidWZmZXIgdG8gbGluZ2VyIGluIG1lbW9yeVxuICAgICAgICBhcnJheUluV0FTTS5maWxsKDApO1xuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbldBU007XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gbW9kKG4sIG0pIHtcbiAgICByZXR1cm4gKChuICUgbSkgKyBtKSAlIG07XG59XG4vKipcbiAqIENsYW1wIHZhbHVlIHRvIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKHZhbHVlLCBtYXgpKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiByZW5kZXJDc3YoaGVhZGVyLCByb3dzLCBzZXBhcmF0b3IgPSBcIjtcIikge1xuICAgIC8vIGZpZWxkcyBjb250YWluaW5nIG5ld2xpbmVzLCBkb3VibGUgcXVvdGVzIG9yIHRoZSBzZXBhcmF0b3IgbmVlZCB0byBiZSBlc2NhcGVkXG4gICAgLy8gYnkgd3JhcHBpbmcgdGhlIHdob2xlIGZpZWxkIGluIGRvdWJsZSBxdW90ZXMsIGFuZCB0aGVuIGR1cGxpY2F0aW5nIGFueSBkb3VibGUgcXVvdGVzIGluIHRoZSBmaWVsZFxuICAgIGNvbnN0IGVzY2FwZUNvbHVtbiA9IChjb2x1bW4pID0+IHtcbiAgICAgICAgaWYgKCFjb2x1bW4uaW5jbHVkZXMoc2VwYXJhdG9yKSAmJiAhY29sdW1uLmluY2x1ZGVzKFwiXFxuXCIpICYmICFjb2x1bW4uaW5jbHVkZXMoJ1wiJykpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGBcIiR7Y29sdW1uLnJlcGxhY2VBbGwoJ1wiJywgJ1wiXCInKX1cImA7XG4gICAgfTtcbiAgICByZXR1cm4gW2hlYWRlcl1cbiAgICAgICAgLmNvbmNhdChyb3dzKVxuICAgICAgICAubWFwKChyb3cpID0+IHJvdy5tYXAoZXNjYXBlQ29sdW1uKS5qb2luKHNlcGFyYXRvcikpXG4gICAgICAgIC5qb2luKFwiXFxuXCIpO1xufVxuIiwiLyoqXG4gKiByZXR1cm4gYSBsaXN0IG9mIHdvcmRzIGNvbnRhaW5lZCBpbiBhIHRleHQsIGxvd2VyY2FzZWQuXG4gKiBAcGFyYW0gdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemUodGV4dCkge1xuICAgIGlmICh0ZXh0ID09IG51bGwpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICBsZXQgY3VycmVudFdvcmQgPSBbXTtcbiAgICBsZXQgd29yZHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGN1cnJlbnRDaGFyID0gdGV4dC5jaGFyQXQoaSk7XG4gICAgICAgIGlmIChpc0VuZE9mV29yZChjdXJyZW50Q2hhcikpIHtcbiAgICAgICAgICAgIGFkZEN1cnJlbnRXb3JkKGN1cnJlbnRXb3JkLCB3b3Jkcyk7XG4gICAgICAgICAgICBjdXJyZW50V29yZCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudFdvcmQucHVzaChjdXJyZW50Q2hhcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYWRkQ3VycmVudFdvcmQoY3VycmVudFdvcmQsIHdvcmRzKTtcbiAgICByZXR1cm4gd29yZHM7XG59XG5mdW5jdGlvbiBhZGRDdXJyZW50V29yZChjdXJyZW50V29yZCwgd29yZHMpIHtcbiAgICB3aGlsZSAoY3VycmVudFdvcmQubGVuZ3RoID4gMCAmJiBjdXJyZW50V29yZFswXSA9PT0gXCInXCIpIHtcbiAgICAgICAgY3VycmVudFdvcmQuc2hpZnQoKTtcbiAgICB9XG4gICAgd2hpbGUgKGN1cnJlbnRXb3JkLmxlbmd0aCA+IDAgJiYgY3VycmVudFdvcmRbY3VycmVudFdvcmQubGVuZ3RoIC0gMV0gPT09IFwiJ1wiKSB7XG4gICAgICAgIGN1cnJlbnRXb3JkLnBvcCgpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFdvcmQubGVuZ3RoID4gMCkge1xuICAgICAgICB3b3Jkcy5wdXNoKGN1cnJlbnRXb3JkLmpvaW4oXCJcIikudG9Mb3dlckNhc2UoKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNFbmRPZldvcmQoY2hhcikge1xuICAgIHN3aXRjaCAoY2hhcikge1xuICAgICAgICBjYXNlIFwiIFwiOlxuICAgICAgICBjYXNlIFwiXFxuXCI6XG4gICAgICAgIGNhc2UgXCJcXHJcIjpcbiAgICAgICAgY2FzZSBcIlxcdFwiOlxuICAgICAgICBjYXNlIFwiXFx4MEJcIjpcbiAgICAgICAgY2FzZSBcIlxcZlwiOlxuICAgICAgICBjYXNlIFwiLlwiOlxuICAgICAgICBjYXNlIFwiLFwiOlxuICAgICAgICBjYXNlIFwiOlwiOlxuICAgICAgICBjYXNlIFwiO1wiOlxuICAgICAgICBjYXNlIFwiIVwiOlxuICAgICAgICBjYXNlIFwiP1wiOlxuICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICBjYXNlICdcIic6XG4gICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgIGNhc2UgXCIpXCI6XG4gICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgIGNhc2UgXCJdXCI6XG4gICAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIGNhc2UgXCJ9XCI6XG4gICAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgIGNhc2UgXCJeXCI6XG4gICAgICAgIGNhc2UgXCJfXCI6XG4gICAgICAgIGNhc2UgXCJgXCI6XG4gICAgICAgIGNhc2UgXCJ+XCI6XG4gICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgIGNhc2UgXCJAXCI6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iXSwibWFwcGluZ3MiOiI7O0lBR2EsVUFBTixNQUFjO0NBQ2pCO0NBQ0E7Ozs7O0NBS0EsVUFBVTtDQUNWLFlBQVksS0FBSyxNQUFNO0FBQ25CLE9BQUssTUFBTTtBQUNYLE9BQUssT0FBTztBQUNaLFNBQU8sT0FBTyxLQUFLO0NBQ3RCOzs7O0NBSUQsV0FBVztBQUNQLFVBQVEsV0FBVyxLQUFLLElBQUksR0FBRyxLQUFLLEtBQUs7Q0FDNUM7QUFDSjtBQUNNLFNBQVMsVUFBVSxTQUFTO0FBQy9CLFFBQU8sUUFBUSxNQUFNLE1BQU0sUUFBUTtBQUN0QztBQUNNLFNBQVMsb0JBQW9CLFNBQVMsS0FBSyxVQUFVO0FBQ3hELFFBQU8sUUFBUSxRQUFRLE9BQU8sUUFBUSxTQUFTO0FBQ2xEO0FBQ00sU0FBUyxjQUFjLFVBQVUsVUFBVTtBQUM5QyxRQUFPLG9CQUFvQixVQUFVLFNBQVMsS0FBSyxTQUFTLEtBQUs7QUFDcEU7Ozs7QUMzQk0sU0FBUyxlQUFlLFFBQVE7QUFDbkMsUUFBTztFQUFFO0VBQVEsU0FBUztDQUFHO0FBQ2hDO0FBQ00sU0FBUyxRQUFRO0NBQ3BCLElBQUksTUFBTSxDQUFFO0FBQ1osS0FBSSxVQUFVLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUMzQyxNQUFJLFVBQVU7QUFDZCxNQUFJLFNBQVM7Q0FDaEI7QUFDRCxRQUFP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QUFPLFNBQVMsS0FBSSxDQUM5RSxRQUFPO0FBRVgsVUFBUSxHQUFHLE9BQU8sV0FBVyxNQUFLLE9BQUssQ0FBQztDQUMzQztBQUNELFFBQU8sQ0FBQyxNQUFPLEVBQ1YsT0FBTyxLQUFLLENBQ1osSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLGFBQWEsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUNuRCxLQUFLLEtBQUs7QUFDbEI7Ozs7QUNUTSxTQUFTLFNBQVMsTUFBTTtBQUMzQixLQUFJLFFBQVEsS0FDUixRQUFPLENBQUU7Q0FDYixJQUFJLGNBQWMsQ0FBRTtDQUNwQixJQUFJLFFBQVEsQ0FBRTtBQUNkLE1BQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsS0FBSztFQUNsQyxJQUFJLGNBQWMsS0FBSyxPQUFPLEVBQUU7QUFDaEMsTUFBSSxZQUFZLFlBQVksRUFBRTtBQUMxQixrQkFBZSxhQUFhLE1BQU07QUFDbEMsaUJBQWMsQ0FBRTtFQUNuQixNQUVHLGFBQVksS0FBSyxZQUFZO0NBRXBDO0FBQ0QsZ0JBQWUsYUFBYSxNQUFNO0FBQ2xDLFFBQU87QUFDVjtBQUNELFNBQVMsZUFBZSxhQUFhLE9BQU87QUFDeEMsUUFBTyxZQUFZLFNBQVMsS0FBSyxZQUFZLE9BQU8sSUFDaEQsYUFBWSxPQUFPO0FBRXZCLFFBQU8sWUFBWSxTQUFTLEtBQUssWUFBWSxZQUFZLFNBQVMsT0FBTyxJQUNyRSxhQUFZLEtBQUs7QUFFckIsS0FBSSxZQUFZLFNBQVMsRUFDckIsT0FBTSxLQUFLLFlBQVksS0FBSyxHQUFHLENBQUMsYUFBYSxDQUFDO0FBRXJEO0FBQ0QsU0FBUyxZQUFZLE1BQU07QUFDdkIsU0FBUSxNQUFSO0FBQ0ksT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLO0FBQ0wsT0FBSztBQUNMLE9BQUs7QUFDTCxPQUFLLElBQ0QsUUFBTztBQUNYLFVBQ0ksUUFBTztDQUNkO0FBQ0oifQ==