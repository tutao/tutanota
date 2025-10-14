import { isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import type { IndexUpdate, SearchIndexMetadataEntry, SearchRestriction } from "../../worker/search/SearchTypes"
import { FULL_INDEXED_TIMESTAMP, GroupType, NOTHING_INDEXED_TIMESTAMP } from "../TutanotaConstants"
import { typeModels as tutanotaTypeModels } from "../../entities/tutanota/TypeModels"
import type { GroupMembership, User } from "../../entities/sys/TypeRefs.js"
import type { TypeModel } from "../EntityTypes"
import { isTest } from "../Env"
import { ContactTypeRef, MailTypeRef } from "../../entities/tutanota/TypeRefs"

export type TypeInfo = {
	appId: number
	typeId: number
	attributeIds: number[]
}

const MailTypeId = MailTypeRef.typeId
const ContactTypeId = ContactTypeRef.typeId
const typeInfos: Map<string, Map<number, any>> = new Map([
	[
		"tutanota",
		new Map([
			[
				MailTypeRef.typeId,
				{
					appId: 1,
					typeId: MailTypeId,
					attributeIds: getAttributeIds(tutanotaTypeModels[MailTypeId]),
				},
			],
			[
				ContactTypeRef.typeId,
				{
					appId: 1,
					typeId: ContactTypeId,
					attributeIds: getAttributeIds(tutanotaTypeModels[ContactTypeId]),
				},
			],
		]),
	],
])

export function getAttributeIds(model: TypeModel) {
	return Object.keys(model.values).map(Number).concat(Object.keys(model.associations).map(Number))
}

export function typeRefToTypeInfo(typeRef: TypeRef<any>): TypeInfo {
	// @ts-ignore
	const app = typeInfos.get(typeRef.app)

	if (!app) {
		throw new Error("No TypeInfo for app: " + typeRef.app)
	}

	const typeInfo = app.get(typeRef.typeId)

	if (!typeInfo) {
		throw new Error(`No TypeInfo for TypeRef ${typeRef.toString()}`)
	}

	return typeInfo
}

export function userIsGlobalAdmin(user: User): boolean {
	return user.memberships.some((m) => m.groupType === GroupType.Admin)
}

export function filterIndexMemberships(user: User): GroupMembership[] {
	return user.memberships.filter(({ groupType }) => groupType === GroupType.Mail || groupType === GroupType.Contact)
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

// Removes most html tags from a text.
// NOTE: This function is not covering all edge-cases.
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

/**
 * Evaluate the function and return the number of milliseconds it took.
 * @param fn function to evaluate
 * @return milliseconds it took for `await fn()` to complete
 */
export async function benchmarkFunction(fn: () => void | Promise<void>): Promise<number> {
	const start = getPerformanceTimestamp()
	await fn()
	const end = getPerformanceTimestamp()
	return end - start
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
		} catch (e) {
			/* empty */
		}
	}
}

export function markStart(name: string) {
	if (shouldMeasure()) performance.mark(name + "-start")
}

export function markEnd(name: string) {
	if (!shouldMeasure()) return

	try {
		performance.mark(name + "-end")
		performance.measure(name, name + "-start", name + "-end")
	} catch (e) {
		/* empty */
	}
}

export function shouldMeasure(): boolean {
	return !env.dist && !isTest()
}

export function getSearchEndTimestamp(currentMailIndexTimestamp: number, restriction: SearchRestriction): number {
	if (restriction.end) {
		return restriction.end
	} else if (isSameTypeRef(MailTypeRef, restriction.type)) {
		return currentMailIndexTimestamp === NOTHING_INDEXED_TIMESTAMP ? Date.now() : currentMailIndexTimestamp
	} else {
		return FULL_INDEXED_TIMESTAMP
	}
}
