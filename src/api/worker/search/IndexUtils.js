//@flow
import {stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {concat} from "../../common/utils/ArrayUtils"
import {random} from "../crypto/Randomizer"
import type {EncryptedSearchIndexEntry, EncryptedSearchIndexMetaDataRow, IndexUpdate, SearchIndexEntry, SearchIndexMetaDataRow} from "./SearchTypes"
import {GroupType} from "../../common/TutanotaConstants"
import {noOp} from "../../common/utils/Utils"
import {calculateNeededSpaceForNumber, decodeNumberBlock, decodeNumbers, encodeNumberBlock, encodeNumbers} from "./SearchIndexEncoding"

export function encryptIndexKeyBase64(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Base64 {
	return uint8ArrayToBase64(aes256Encrypt(key, stringToUtf8Uint8Array(indexKey), dbIv, true, false)
		.slice(dbIv.length))
}

export function encryptIndexKeyUint8Array(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Uint8Array {
	return aes256Encrypt(key, stringToUtf8Uint8Array(indexKey), dbIv, true, false).slice(dbIv.length)
}

export function encryptSearchIndexEntry(key: Aes256Key, entry: SearchIndexEntry, encryptedInstanceId: Uint8Array): EncryptedSearchIndexEntry {
	const neededSpace = calculateNeededSpaceForNumber(entry.attribute)
		+ entry.positions.reduce((acc, position) => acc + calculateNeededSpaceForNumber(position), 0)
	const block = new Uint8Array(neededSpace)
	let offset = 0
	offset += encodeNumberBlock(entry.attribute, block, offset)
	encodeNumbers(entry.positions, block, offset)

	const encData = aes256Encrypt(key, block, random.generateRandomData(IV_BYTE_LENGTH), true, false)

	const resultArray = new Uint8Array(encryptedInstanceId.length + encData.length)
	resultArray.set(encryptedInstanceId)
	resultArray.set(encData, 16)
	return resultArray
}

export function decryptSearchIndexEntry(key: Aes256Key, entry: EncryptedSearchIndexEntry, dbIv: Uint8Array): SearchIndexEntry {
	const encId = getIdFromEncSearchIndexEntry(entry)
	let id = utf8Uint8ArrayToString(aes256Decrypt(key, concat(dbIv, encId), true, false))
	const data = aes256Decrypt(key, entry.subarray(16), true, false)
	let offset = 0
	const attribute = decodeNumberBlock(data, offset)
	offset += calculateNeededSpaceForNumber(attribute)
	const positions = decodeNumbers(data, offset)

	return {
		id: id,
		encId,
		attribute,
		positions,
	}
}

export function encryptMetaData(key: Aes256Key, metaData: SearchIndexMetaDataRow): EncryptedSearchIndexMetaDataRow {
	const numbers = new Array(metaData.rows.length * 4)
	for (let i = 0; i < metaData.rows.length; i += 4) {
		const entry = metaData.rows[i]
		numbers[i] = entry.app
		numbers[i + 1] = entry.type
		numbers[i + 2] = entry.key
		numbers[i + 3] = entry.size
	}
	const spaceForRows = numbers.reduce((acc, n) => acc + calculateNeededSpaceForNumber(n), 0)
	const numberBlock = new Uint8Array(spaceForRows)
	encodeNumbers(numbers, numberBlock)
	const encryptedRows = aes256Encrypt(key, numberBlock, random.generateRandomData(IV_BYTE_LENGTH), true, false)
	return {id: metaData.id, word: metaData.word, rows: encryptedRows}
}

export function decryptMetaData(key: Aes256Key, encryptedMeta: EncryptedSearchIndexMetaDataRow): SearchIndexMetaDataRow {
	const numbersBlock = aes256Decrypt(key, encryptedMeta.rows, true, false)
	const numbers = decodeNumbers(numbersBlock)
	const rows = []
	for (let i = 0; i < numbers.length; i += 4) {
		rows.push({app: numbers[i], type: numbers[i + 1], key: numbers[i + 2], size: numbers[i + 3]})
	}
	return {id: encryptedMeta.id, word: encryptedMeta.word, rows}
}

export function getAppId(typeRef: TypeRef<any>): number {
	if (typeRef.app === "sys") {
		return 0
	} else if (typeRef.app === "tutanota") {
		return 1
	}
	throw new Error("non indexed application " + typeRef.app)
}

export function userIsLocalOrGlobalAdmin(user: User): boolean {
	return user.memberships.find(m => m.groupType === GroupType.Admin || m.groupType === GroupType.LocalAdmin) != null
}

export function userIsGlobalAdmin(user: User): boolean {
	return user.memberships.find(m => m.groupType === GroupType.Admin) != null
}

export function filterIndexMemberships(user: User): GroupMembership[] {
	return user.memberships.filter(m => m.groupType === GroupType.Mail || m.groupType === GroupType.Contact
		|| m.groupType === GroupType.Customer || m.groupType === GroupType.Admin)
}

export function filterMailMemberships(user: User): GroupMembership[] {
	return user.memberships.filter(m => m.groupType === GroupType.Mail)
}

export function byteLength(str: ?string) {
	if (str == null) return 0
	// returns the byte length of an utf8 string
	var s = str.length;
	for (var i = str.length - 1; i >= 0; i--) {
		var code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) {
			s++;
		} else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
}

export function _createNewIndexUpdate(groupId: Id): IndexUpdate {
	return {
		groupId,
		batchId: null,
		indexTimestamp: null,
		create: {
			encInstanceIdToElementData: new Map(),
			indexMap: new Map(),
		},
		move: [],
		delete: {searchIndexRowToEncInstanceIds: new Map(), encInstanceIds: []},
	}
}

export function htmlToText(html: ?string): string {
	if (html == null) return ""
	let text = html.replace(/<[^>]*>?/gm, " ")
	return text.replace(/&[#0-9a-zA-Z]+;/g, (match) => {
		let replacement
		if (match.startsWith("&#")) {
			let charCode = match.substring(2, match.length - 1) // remove &# and ;
			if (!isNaN(charCode)) {
				replacement = String.fromCharCode(Number(charCode))
			}
		} else {
			replacement = HTML_ENTITIES[match]
		}
		return replacement ? replacement : match;
	})
}

const HTML_ENTITIES = {
	"&nbsp;": " ",
	"&amp;": "&",
	"&lt;": '<',
	"&gt;": '>',
	"&Agrave;": "À",
	"&Aacute;": "Á",
	"&Acirc;": "Â",
	"&Atilde;": "Ã",
	"&Auml;": "Ä",
	"&Aring;": "Å",
	"&AElig;": "Æ",
	"&Ccedil;": "Ç",
	"&Egrave;": "È",
	"&Eacute;": "É",
	"&Ecirc;": "Ê",
	"&Euml;": "Ë",
	"&Igrave;": "Ì",
	"&Iacute;": "Í",
	"&Icirc;": "Î",
	"&Iuml;": "Ï",
	"&ETH;": "Ð",
	"&Ntilde;": "Ñ",
	"&Ograve;": "Ò",
	"&Oacute;": "Ó",
	"&Ocirc;": "Ô",
	"&Otilde;": "Õ",
	"&Ouml;": "Ö",
	"&Oslash;": "Ø",
	"&Ugrave;": "Ù",
	"&Uacute;": "Ú",
	"&Ucirc;": "Û",
	"&Uuml;": "Ü",
	"&Yacute;": "Ý",
	"&THORN;": "Þ",
	"&szlig;": "ß",
	"&agrave;": "à",
	"&aacute;": "á",
	"&acirc;": "â",
	"&atilde;": "ã",
	"&auml;": "ä",
	"&aring;": "å",
	"&aelig;": "æ",
	"&ccedil;": "ç",
	"&egrave;": "è",
	"&eacute;": "é",
	"&ecirc;": "ê",
	"&euml;": "ë",
	"&igrave;": "ì",
	"&iacute;": "í",
	"&icirc;": "î",
	"&iuml;": "ï",
	"&eth;": "ð",
	"&ntilde;": "ñ",
	"&ograve;": "ò",
	"&oacute;": "ó",
	"&ocirc;": "ô",
	"&otilde;": "õ",
	"&ouml;": "ö",
	"&oslash;": "ø",
	"&ugrave;": "ù",
	"&uacute;": "ú",
	"&ucirc;": "û",
	"&uuml;": "ü",
	"&yacute;": "ý",
	"&thorn;": "þ",
	"&yuml;": "ÿ",
	"&Alpha;": "Α",
	"&Beta;": "Β",
	"&Gamma;": "Γ",
	"&Delta;": "Δ",
	"&Epsilon;": "Ε",
	"&Zeta;": "Ζ",
	"&Eta;": "Η",
	"&Theta;": "Θ",
	"&Iota;": "Ι",
	"&Kappa;": "Κ",
	"&Lambda;": "Λ",
	"&Mu;": "Μ",
	"&Nu;": "Ν",
	"&Xi;": "Ξ",
	"&Omicron;": "Ο",
	"&Pi;": "Π",
	"&Rho;": "Ρ",
	"&Sigma;": "Σ",
	"&Tau;": "Τ",
	"&Upsilon;": "Υ",
	"&Phi;": "Φ",
	"&Chi;": "Χ",
	"&Psi;": "Ψ",
	"&Omega;": "Ω",
	"&alpha;": "α",
	"&beta;": "β",
	"&gamma;": "γ",
	"&delta;": "δ",
	"&epsilon;": "ε",
	"&zeta;": "ζ",
	"&eta;": "η",
	"&theta;": "θ",
	"&iota;": "ι",
	"&kappa;": "κ",
	"&lambda;": "λ",
	"&mu;": "μ",
	"&nu;": "ν",
	"&xi;": "ξ",
	"&omicron;": "ο",
	"&pi;": "π",
	"&rho;": "ρ",
	"&sigmaf;": "ς",
	"&sigma;": "σ",
	"&tau;": "τ",
	"&upsilon;": "υ",
	"&phi;": "φ",
	"&chi;": "χ",
	"&psi;": "ψ",
	"&omega;": "ω",
	"&thetasym;": "ϑ",
	"&upsih;": "ϒ",
	"&piv;": "ϖ",
}


export function getPerformanceTimestamp(): number {
	return typeof performance === "undefined" ? Date.now() : performance.now()  // performance is not available in Safari 10 worker scope
}


export const timeStart: (string) => void =
	typeof self !== "undefined" && console.time ? console.time.bind(console) : noOp
export const timeEnd: (string) => void =
	typeof self !== "undefined" && console.timeEnd ? console.timeEnd.bind(console) : noOp

export function getIdFromEncSearchIndexEntry(entry: Uint8Array): Uint8Array {
	return entry.subarray(0, 16)
}