import { CompanyEmailSignatureTemplate, CompanyEmailSignatureTemplateTypeRef, CustomerGroupRoot } from "@tutao/entities/sys"
import { CompanyEmailSignatureValues, TutanotaProperties } from "@tutao/entities/tutanota"
import { idToElementId } from "@tutao/meta"
import { ofClass } from "@tutao/utils"
import { NotFoundError } from "../../../../platform-kit/rest-client/error"
import { EnvProvider } from "../../../../platform-kit/app-env"
import type { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { getHtmlSanitizer } from "../../../common/misc/HtmlSanitizer"

EnvProvider.assertMainOrNode()

export type CompanyEmailSignatureData = Pick<
	CompanyEmailSignatureValues,
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

export function createCompanyEmailSignatureHtml(template: string | null, data: CompanyEmailSignatureData | null): string | null {
	if (template == null || template.trim() === "" || data === null) {
		return null
	}
	const filled = fillCompanyEmailSignatureTemplate(template, data)

	return getHtmlSanitizer().sanitizeHTML(filled, { blockExternalContent: false }).html
}

export async function loadCompanyEmailSignatureTemplate(
	entityClient: EntityClient,
	customerGroupRoot: CustomerGroupRoot | null,
): Promise<CompanyEmailSignatureTemplate | null> {
	if (customerGroupRoot?.companyEmailSignatureTemplate == null) {
		return null
	}
	return await entityClient
		.load(CompanyEmailSignatureTemplateTypeRef, idToElementId(customerGroupRoot.companyEmailSignatureTemplate))
		.catch(ofClass(NotFoundError, () => null))
}

export async function loadCompanyEmailSignatureHtml(
	entityClient: EntityClient,
	customerGroupRoot: CustomerGroupRoot | null,
	props: TutanotaProperties,
): Promise<string | null> {
	const template = await loadCompanyEmailSignatureTemplate(entityClient, customerGroupRoot)
	return template != null ? createCompanyEmailSignatureHtml(template.signatureTemplate, props.companyEmailSignatureValues) : null
}
