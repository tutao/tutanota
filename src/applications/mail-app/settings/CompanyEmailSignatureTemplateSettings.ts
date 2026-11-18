import m, { Children, Component, Vnode } from "mithril"
import { CompanyEmailSignatureTemplate } from "@tutao/entities/sys"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { LegacyTextField } from "../../../ui/base/LegacyTextField"
import { IconButton } from "../../../ui/base/IconButton"

export type CompanyEmailSignatureTemplateSettingsAttrs = {
	companyEmailSignatureTemplate: CompanyEmailSignatureTemplate | null
	onAddCompanyEmailSignatureTemplate: () => unknown
	onEditCompanyEmailSignatureTemplate: (companyEmailSignatureTemplate: CompanyEmailSignatureTemplate) => unknown
	onRemoveCompanyEmailSignatureTemplate: () => unknown
}

export class CompanyEmailSignatureTemplateSettings implements Component<CompanyEmailSignatureTemplateSettingsAttrs> {
	view({ attrs }: Vnode<CompanyEmailSignatureTemplateSettingsAttrs>): Children {
		const {
			companyEmailSignatureTemplate,
			onAddCompanyEmailSignatureTemplate,
			onEditCompanyEmailSignatureTemplate,
			onRemoveCompanyEmailSignatureTemplate,
		} = attrs
		return m("", [
			m(".h4.mt-32", lang.getTranslationText("companySignature_label")),
			m(LegacyTextField, {
				label: "emptyString_msg",
				value: companyEmailSignatureTemplate ? lang.getTranslationText("companySignatureEnabled_label") : lang.getTranslationText("emptyString_msg"),
				isReadOnly: true,
				injectionsRight: () =>
					companyEmailSignatureTemplate
						? [
								m(IconButton, {
									label: "edit_action",
									icon: Icons.PenFilled,
									size: ButtonSize.Compact,
									click: () => onEditCompanyEmailSignatureTemplate(companyEmailSignatureTemplate),
								}),
								m(IconButton, {
									label: "remove_action",
									icon: Icons.TrashFilled,
									size: ButtonSize.Compact,
									click: () => onRemoveCompanyEmailSignatureTemplate(),
								}),
							]
						: [
								m(IconButton, {
									label: "add_action",
									icon: Icons.Plus,
									size: ButtonSize.Compact,
									click: () => onAddCompanyEmailSignatureTemplate(),
								}),
							],
			}),
		])
	}
}
