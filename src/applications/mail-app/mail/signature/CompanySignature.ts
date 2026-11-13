import { CompanySignatureTemplate, CompanySignatureTemplateTypeRef, TutanotaProperties } from "@tutao/entities/tutanota"
import { idToElementId } from "@tutao/meta"
import { EnvProvider } from "../../../../platform-kit/app-env"
import type { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { getHtmlSanitizer } from "../../../common/misc/HtmlSanitizer"

EnvProvider.assertMainOrNode()

export type CompanySignatureData = Pick<CompanySignatureTemplate, "name" | "email" | "phoneNumber" | "role" | "department">

const ELEMENT_NODE = 1
const SHOW_TEXT = 4
const PLACEHOLDER_REGEX = /\{(name|email|phone|role|department)\}/g
const BLOCK_ELEMENTS = new Set(["P", "DIV", "LI", "TR", "TD", "TH", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "UL", "OL", "TABLE", "TBODY"])

export function getDefaultCompanySignatureTemplate(): string {
	return "<div>{name}</div><div>{role}</div><div>{department}</div><div>{email}</div><div>{phone}</div>"
}

function getPlaceholderValues(data: CompanySignatureData): Record<string, string> {
	return {
		name: data.name?.trim() ?? "",
		email: data.email?.trim() ?? "",
		phone: data.phoneNumber?.trim() ?? "",
		role: data.role?.trim() ?? "",
		department: data.department?.trim() ?? "",
	}
}

function placeholdersIn(text: string): string[] {
	return Array.from(text.matchAll(PLACEHOLDER_REGEX), (match) => match[1])
}

function isBlockElement(node: Node): node is HTMLElement {
	return node.nodeType === ELEMENT_NODE && BLOCK_ELEMENTS.has((node as Element).tagName)
}

/**
 * Remove the line the text node is part of. A line is either a block element (e.g. <div>{phone}</div>) or the content between two <br> inside of one.
 */
function removeLineOf(textNode: Node, root: HTMLElement, values: Record<string, string>) {
	// find the block containing the line, and the direct child of it that contains the text node
	let child: Node = textNode
	while (child.parentNode !== root && !isBlockElement(child.parentNode!)) {
		child = child.parentNode!
	}
	const block = child.parentNode as HTMLElement

	const isBreak = (node: Node | null) => node != null && node.nodeName === "BR"
	let start = child
	while (start.previousSibling != null && !isBreak(start.previousSibling)) {
		start = start.previousSibling
	}
	let end = child
	while (end.nextSibling != null && !isBreak(end.nextSibling)) {
		end = end.nextSibling
	}
	const line: Node[] = []
	for (let node: Node | null = start; node != null; node = node.nextSibling) {
		line.push(node)
		if (node === end) break
	}

	// only remove the line if there is nothing left in it that would be filled in
	const placeholders = placeholdersIn(line.map((node) => node.textContent ?? "").join(""))
	if (placeholders.some((placeholder) => values[placeholder] !== "")) {
		return
	}

	const coversBlock = line[0] === block.firstChild && line[line.length - 1] === block.lastChild
	if (block !== root && coversBlock) {
		block.remove()
		return
	}
	const trailingBreak = isBreak(end.nextSibling) ? end.nextSibling : isBreak(start.previousSibling) ? start.previousSibling : null
	line.forEach((node) => node.parentNode?.removeChild(node))
	trailingBreak?.parentNode?.removeChild(trailingBreak)
}

/**
 * Replaces the placeholders of the template with the data of the user. Lines whose placeholders are all empty are removed. Values are inserted as text
 * and never interpreted as html.
 */
export function fillCompanySignatureTemplate(template: string, data: CompanySignatureData): string {
	const values = getPlaceholderValues(data)
	const root = document.createElement("div")
	root.innerHTML = template

	const textNodes: Text[] = []
	const walker = document.createTreeWalker(root, SHOW_TEXT)
	for (let node = walker.nextNode(); node != null; node = walker.nextNode()) {
		if (placeholdersIn(node.textContent ?? "").length > 0) {
			textNodes.push(node as Text)
		}
	}
	for (const textNode of textNodes) {
		// might have been removed together with another line
		if (root.contains(textNode) && placeholdersIn(textNode.textContent ?? "").some((placeholder) => values[placeholder] === "")) {
			removeLineOf(textNode, root, values)
		}
	}

	const replace = (text: string) => text.replace(PLACEHOLDER_REGEX, (_, key: string) => values[key])
	const replaceWalker = document.createTreeWalker(root, SHOW_TEXT)
	for (let node = replaceWalker.nextNode(); node != null; node = replaceWalker.nextNode()) {
		node.textContent = replace(node.textContent ?? "")
	}
	for (const element of Array.from(root.querySelectorAll("*"))) {
		for (const attribute of Array.from(element.attributes)) {
			if (placeholdersIn(attribute.value).length > 0) {
				element.setAttribute(attribute.name, replace(attribute.value))
			}
		}
	}
	return root.innerHTML
}

export function createCompanySignatureHtml(template: string | null, data: CompanySignatureData): string | null {
	if (template == null || template.trim() === "") {
		return null
	}
	const filled = fillCompanySignatureTemplate(template, data)

	return getHtmlSanitizer().sanitizeHTML(filled, { blockExternalContent: false }).html
}

export async function loadCompanySignatureHtml(entityClient: EntityClient, props: TutanotaProperties): Promise<string | null> {
	if (props.companySignatureTemplate == null) {
		return null
	}
	const template = await entityClient.load(CompanySignatureTemplateTypeRef, idToElementId(props.companySignatureTemplate))
	return createCompanySignatureHtml(template.signatureTemplate, template)
}
