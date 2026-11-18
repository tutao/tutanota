import { CompanyEmailSignature, CompanyEmailSignatureTypeRef, User } from "@tutao/entities/sys"
import { idToElementId } from "@tutao/meta"
import { EnvProvider } from "../../../../platform-kit/app-env"
import type { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { getHtmlSanitizer } from "../../../common/misc/HtmlSanitizer"

EnvProvider.assertMainOrNode()

export type CompanyEmailSignatureData = Pick<
	CompanyEmailSignature,
	"name" | "email" | "phoneNumber" | "mobileNumber" | "role" | "department" | "address" | "custom1" | "custom2"
>

export type CompanyEmailSignaturePlaceholder = keyof CompanyEmailSignatureData

const PLACEHOLDER_PATTERN = "\\{(name|role|department|address|email|phoneNumber|mobileNumber|custom1|custom2)\\}"
const PLACEHOLDER_REGEX = new RegExp(PLACEHOLDER_PATTERN, "g")

export function getDefaultCompanyEmailSignatureTemplate(): string {
	return "<div>{name}</div><div>{role}</div><div>{department}</div><div>{address}</div><div>{email}</div><div>{phoneNumber}</div><div>{mobileNumber}</div><div>{custom1}</div><div>{custom2}</div>"
}

function getPlaceholderValues(data: CompanyEmailSignatureData): Record<string, string> {
	return {
		name: data.name?.trim() ?? "",
		email: data.email?.trim() ?? "",
		phoneNumber: data.phoneNumber?.trim() ?? "",
		mobileNumber: data.mobileNumber?.trim() ?? "",
		role: data.role?.trim() ?? "",
		department: data.department?.trim() ?? "",
		address: data.address?.trim() ?? "",
		custom1: data.custom1?.trim() ?? "",
		custom2: data.custom2?.trim() ?? "",
	}
}

export function getUsedCompanyEmailSignatureFields(template: string): ReadonlySet<CompanyEmailSignaturePlaceholder> {
	return new Set(placeholdersIn(template))
}

function placeholdersIn(text: string): CompanyEmailSignaturePlaceholder[] {
	return Array.from(text.matchAll(PLACEHOLDER_REGEX), (match) => match[1]) as CompanyEmailSignaturePlaceholder[]
}

export function fillCompanyEmailSignatureTemplate(template: string, data: CompanyEmailSignatureData): string {
	const placeholderValues = getPlaceholderValues(data)
	return template.replace(PLACEHOLDER_REGEX, (_, key: string) => placeholderValues[key])
}

export function createCompanyEmailSignatureHtml(template: string | null, data: CompanyEmailSignatureData): string | null {
	if (template == null || template.trim() === "") {
		return null
	}
	const filled = fillCompanyEmailSignatureTemplate(template, data)

	return getHtmlSanitizer().sanitizeHTML(filled, { blockExternalContent: false }).html
}

export async function loadCompanyEmailSignatureHtml(entityClient: EntityClient, user: User): Promise<string | null> {
	if (user.companyEmailSignature == null) {
		return null
	}
	const companyEmailSignature = await entityClient.load(CompanyEmailSignatureTypeRef, idToElementId(user.companyEmailSignature))
	return createCompanyEmailSignatureHtml(companyEmailSignature.signatureTemplate, companyEmailSignature)
}
