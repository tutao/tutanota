import { Base64, concat, stringToUtf8Uint8Array, TypeRef, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type {
	DecryptedSearchIndexEntry,
	EncryptedSearchIndexEntry,
	IndexUpdate,
	SearchIndexEntry,
	SearchIndexMetaDataDbRow,
	SearchIndexMetadataEntry,
	SearchIndexMetaDataRow,
} from "./SearchTypes"
import { GroupType } from "../../common/TutanotaConstants"
import { calculateNeededSpaceForNumber, calculateNeededSpaceForNumbers, decodeNumberBlock, decodeNumbers, encodeNumbers } from "./SearchIndexEncoding"
import { typeModels as tutanotaTypeModels } from "../../entities/tutanota/TypeModels"
import type { GroupMembership, User } from "../../entities/sys/TypeRefs.js"
import type { TypeModel } from "../../common/EntityTypes"
import { isTest } from "../../common/Env"
import { aes256EncryptSearchIndexEntry, Aes256Key, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"

export function encryptIndexKeyBase64(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Base64 {
	return uint8ArrayToBase64(encryptIndexKeyUint8Array(key, indexKey, dbIv))
}

export function encryptIndexKeyUint8Array(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Uint8Array {
	return aes256EncryptSearchIndexEntry(key, stringToUtf8Uint8Array(indexKey), dbIv, true).slice(dbIv.length)
}

export function decryptIndexKey(key: Aes256Key, encIndexKey: Uint8Array, dbIv: Uint8Array): string {
	return utf8Uint8ArrayToString(unauthenticatedAesDecrypt(key, concat(dbIv, encIndexKey), true))
}

export function encryptSearchIndexEntry(key: Aes256Key, entry: SearchIndexEntry, encryptedInstanceId: Uint8Array): EncryptedSearchIndexEntry {
	let searchIndexEntryNumberValues = [entry.attribute].concat(entry.positions)
	const neededSpace = calculateNeededSpaceForNumbers(searchIndexEntryNumberValues)
	const block = new Uint8Array(neededSpace)
	encodeNumbers(searchIndexEntryNumberValues, block, 0)
	const encData = aes256EncryptSearchIndexEntry(key, block)
	const resultArray = new Uint8Array(encryptedInstanceId.length + encData.length)
	resultArray.set(encryptedInstanceId)
	resultArray.set(encData, 16)
	return resultArray
}

export function decryptSearchIndexEntry(key: Aes256Key, entry: EncryptedSearchIndexEntry, dbIv: Uint8Array): DecryptedSearchIndexEntry {
	const encId = getIdFromEncSearchIndexEntry(entry)
	let id = decryptIndexKey(key, encId, dbIv)
	const data = unauthenticatedAesDecrypt(key, entry.subarray(16), true)
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

const metaEntryFieldsNumber = 5

export function encryptMetaData(key: Aes256Key, metaData: SearchIndexMetaDataRow): SearchIndexMetaDataDbRow {
	const numbers = new Array(metaData.rows.length * metaEntryFieldsNumber)

	for (let i = 0; i < metaData.rows.length; i++) {
		const entry = metaData.rows[i]
		const offset = i * metaEntryFieldsNumber
		numbers[offset] = entry.app
		numbers[offset + 1] = entry.type
		numbers[offset + 2] = entry.key
		numbers[offset + 3] = entry.size
		numbers[offset + 4] = entry.oldestElementTimestamp
	}

	const numberBlock = new Uint8Array(calculateNeededSpaceForNumbers(numbers))
	encodeNumbers(numbers, numberBlock)
	const encryptedRows = aes256EncryptSearchIndexEntry(key, numberBlock)
	return {
		id: metaData.id,
		word: metaData.word,
		rows: encryptedRows,
	}
}

export function decryptMetaData(key: Aes256Key, encryptedMeta: SearchIndexMetaDataDbRow): SearchIndexMetaDataRow {
	// Initially we write empty data block there. In this case we can't get IV from it and decrypt it
	if (encryptedMeta.rows.length === 0) {
		return {
			id: encryptedMeta.id,
			word: encryptedMeta.word,
			rows: [],
		}
	}

	const numbersBlock = unauthenticatedAesDecrypt(key, encryptedMeta.rows, true)
	const numbers = decodeNumbers(numbersBlock)
	const rows: SearchIndexMetadataEntry[] = []

	for (let i = 0; i < numbers.length; i += metaEntryFieldsNumber) {
		rows.push({
			app: numbers[i],
			type: numbers[i + 1],
			key: numbers[i + 2],
			size: numbers[i + 3],
			oldestElementTimestamp: numbers[i + 4],
		})
	}

	return {
		id: encryptedMeta.id,
		word: encryptedMeta.word,
		rows,
	}
}

export type TypeInfo = {
	appId: number
	typeId: number
	attributeIds: number[]
}
const typeInfos = {
	tutanota: {
		Mail: {
			appId: 1,
			typeId: tutanotaTypeModels.Mail.id,
			attributeIds: getAttributeIds(tutanotaTypeModels.Mail),
		},
		Contact: {
			appId: 1,
			typeId: tutanotaTypeModels.Contact.id,
			attributeIds: getAttributeIds(tutanotaTypeModels.Contact),
		},
	},
}

export function getAttributeIds(model: TypeModel) {
	return Object.keys(model.values)
		.map((name) => model.values[name].id)
		.concat(Object.keys(model.associations).map((name) => model.associations[name].id))
}

export function typeRefToTypeInfo(typeRef: TypeRef<any>): TypeInfo {
	// @ts-ignore
	const app = typeInfos[typeRef.app]

	if (!app) {
		throw new Error("No TypeInfo for app: " + app)
	}

	const typeInfo = app[typeRef.type]

	if (!typeInfo) {
		throw new Error(`No TypeInfo for TypeRef ${typeRef.app} : ${typeRef.type}`)
	}

	return typeInfo
}

export function userIsGlobalAdmin(user: User): boolean {
	return user.memberships.some((m) => m.groupType === GroupType.Admin)
}

export function filterIndexMemberships(user: User): GroupMembership[] {
	return user.memberships.filter(
		(m) => m.groupType === GroupType.Mail || m.groupType === GroupType.Contact || m.groupType === GroupType.Customer || m.groupType === GroupType.Admin,
	)
}

export function filterMailMemberships(user: User): GroupMembership[] {
	return user.memberships.filter((m) => m.groupType === GroupType.Mail)
}

export function _createNewIndexUpdate(typeInfo: TypeInfo): IndexUpdate {
	return {
		typeInfo,
		create: {
			encInstanceIdToElementData: new Map(),
			indexMap: new Map(),
		},
		move: [],
		delete: {
			searchMetaRowToEncInstanceIds: new Map(),
			encInstanceIds: [],
		},
	}
}

export function htmlToText(html: string | null): string {
	if (html == null) return ""
	let text = html.replace(/<[^>]*>?/gm, " ")
	return text.replace(/&[#0-9a-zA-Z]+;/g, (match) => {
		let replacement

		if (match.startsWith("&#")) {
			let charCode = Number(match.substring(2, match.length - 1)) // remove &# and ;

			if (!isNaN(charCode)) {
				replacement = String.fromCharCode(charCode)
			}
		} else {
			// @ts-ignore
			replacement = HTML_ENTITIES[match]
		}

		return replacement ? replacement : match
	})
}

const HTML_ENTITIES = {
	"&nbsp;": " ",
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
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
	return typeof performance === "undefined" ? Date.now() : performance.now() // performance is not available in Safari 10 worker scope
}

export function getIdFromEncSearchIndexEntry(entry: Uint8Array): Uint8Array {
	return entry.subarray(0, 16)
}

export function compareMetaEntriesOldest(left: SearchIndexMetadataEntry, right: SearchIndexMetadataEntry): number {
	return left.oldestElementTimestamp - right.oldestElementTimestamp
}

export function printMeasure(prefix: string, names: string[]) {
	if (!shouldMeasure()) return

	for (let name of names) {
		try {
			performance.clearMeasures(name)
			performance.clearMarks(name + "-end")
			performance.clearMarks(name + "-start")
		} catch (e) {}
	}
}

export function markStart(name: string) {
	shouldMeasure() && performance.mark(name + "-start")
}

export function markEnd(name: string) {
	if (!shouldMeasure()) return

	try {
		performance.mark(name + "-end")
		performance.measure(name, name + "-start", name + "-end")
	} catch (e) {}
}

export function shouldMeasure(): boolean {
	return !env.dist && !isTest()
}
