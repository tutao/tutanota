import m from "mithril"
import { CompanyEmailSignature } from "@tutao/entities/sys"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { TextField } from "../../../ui/base/TextField"
import { LegacyTextFieldType } from "../../../ui/base/LegacyTextField"
import { theme } from "../../../ui/theme"
import { Card } from "../../../ui/base/Card"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { Icons } from "../../../ui/base/icons/Icons"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { locator } from "../../common/api/main/CommonLocator"
import {
	CompanyEmailSignatureData,
	CompanyEmailSignaturePlaceholder,
	createCompanyEmailSignatureHtml,
	getUsedCompanyEmailSignatureFields,
} from "../mail/signature/CompanyEmailSignature"
import { px } from "../../../ui/size"
import { getSignaturePreviewHtml } from "../mail/signature/Signature"

const FIELDS: ReadonlyArray<{ placeholder: CompanyEmailSignaturePlaceholder; label: TranslationKey; kind?: "phone" | "multiline" | "link" }> = [
	{ placeholder: "name", label: "name_label" },
	{ placeholder: "email", label: "email_label" },
	{ placeholder: "phoneNumber", label: "phone_label", kind: "phone" },
	{ placeholder: "mobileNumber", label: "mobile_label", kind: "phone" },
	{ placeholder: "role", label: "role_placeholder" },
	{ placeholder: "department", label: "department_placeholder" },
	{ placeholder: "address", label: "address_label", kind: "multiline" },
	{ placeholder: "custom1", label: "customField1_label", kind: "link" },
	{ placeholder: "custom2", label: "customField2_label", kind: "link" },
]

export function showEditCompanyEmailSignatureDialog(companyEmailSignature: CompanyEmailSignature) {
	const usedFields = FIELDS.filter(({ placeholder }) => getUsedCompanyEmailSignatureFields(companyEmailSignature.signatureTemplate).has(placeholder))
	const values = Object.fromEntries(FIELDS.map(({ placeholder }) => [placeholder, companyEmailSignature[placeholder] ?? ""])) as Record<
		CompanyEmailSignaturePlaceholder,
		string
	>

	const dialog = Dialog.showActionDialog({
		title: "companySignature_label",
		type: DialogType.Popup_L,
		child: {
			view: () => [
				m(Card, { classes: ["mt-16"] }, [
					m(".center.pb-8.pt-12", m(Icon, { icon: Icons.PenFilled, size: IconSize.PX32, style: { fill: theme.on_surface_variant } })),
					m(".center.smaller.text-preline.pb-8", lang.getTranslationText("companySignatureUserDetails_msg")),
				]),
				usedFields.map((fieldInfo) =>
					m(TextField, {
						label: fieldInfo.label,
						value: values[fieldInfo.placeholder],
						oninput: (value) => (values[fieldInfo.placeholder] = value),
						type: fieldInfo.kind === "multiline" ? LegacyTextFieldType.Area : LegacyTextFieldType.Text,
						helpLabel: fieldInfo.kind === "link" ? () => lang.getTranslationText("companySignatureLinkHelp_msg") : null,
					}),
				),
				m(
					Card,
					{
						classes: ["mt-16", "scroll"],
						style: {
							minHeight: px(75),
							maxHeight: px(300),
						},
					},
					m.trust(
						getSignaturePreviewHtml(
							createCompanyEmailSignatureHtml(companyEmailSignature.signatureTemplate, values satisfies CompanyEmailSignatureData) ?? "",
						),
					),
				),
				m(
					".flex-end.wrap.mt-24.gap-16",
					m(PrimaryButton, {
						width: "flex",
						label: "save_action",
						onclick: () => {
							for (const { placeholder } of FIELDS) {
								companyEmailSignature[placeholder] = parseMultilineAndUrlToHtml(placeholder, values[placeholder].trim()) || null
							}
							showProgressDialog("pleaseWait_msg", locator.entityClient.update(companyEmailSignature)).then(() => dialog.close)
						},
					}),
				),
			],
		},
		okAction: null,
	})
}

function parseMultilineAndUrlToHtml(placeholder: string, value: string): string {
	if (value === "") {
		return ""
	}

	const url = FIELDS.find((field) => field.placeholder === placeholder)?.kind === "link" ? parseCompanyEmailSignatureUrl(value) : null
	if (url) {
		return `<a target="_blank" rel="noopener noreferrer" href=${url.url}>${url.linkText}</a>`
	}

	return value.split(/\r?\n/).join("<br>")
}

/**
 * Parses links that can be entered for some of the fields: either a plain web address or [text](address).
 * @return null if the value is not a (valid) link
 */
export function parseCompanyEmailSignatureUrl(value: string): { linkText: string; url: string } | null {
	const trimmed = value.trim()
	const markdownUrl = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(trimmed)
	const linkText = markdownUrl ? markdownUrl[1] : trimmed
	let linkAddress = markdownUrl ? markdownUrl[2] : trimmed

	if (/^www\./i.test(linkAddress)) {
		linkAddress = "https://" + linkAddress
	}
	try {
		return { linkText, url: new URL(linkAddress).href }
	} catch (e) {
		return null
	}
}
