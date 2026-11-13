import m, { Children, Component, Vnode } from "mithril"
import { CompanySignature } from "@tutao/entities/sys"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../../ui/base/icons/Icons"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { LegacyTextField } from "../../../../ui/base/LegacyTextField"
import { IconButton } from "../../../../ui/base/IconButton"
import { attachDropdown } from "../../../../ui/base/Dropdown"

export type CompanySignatureSettingsAttrs = {
	companySignature: CompanySignature | null
	onAddCompanySignature: () => unknown
	onEditCompanySignature: (companySignature: CompanySignature) => unknown
	onRemoveCompanySignature: () => unknown
}

export class CompanySignatureSettings implements Component<CompanySignatureSettingsAttrs> {
	view({ attrs }: Vnode<CompanySignatureSettingsAttrs>): Children {
		const { companySignature, onAddCompanySignature, onEditCompanySignature, onRemoveCompanySignature } = attrs
		return m(LegacyTextField, {
			label: "companySignature_label",
			value: companySignature ? lang.getTranslationText("companySignature_label") : lang.getTranslationText("emptyString_msg"),
			isReadOnly: true,
			injectionsRight: () =>
				companySignature
					? m(
							IconButton,
							attachDropdown({
								mainButtonAttrs: {
									label: "edit_action",
									icon: Icons.More,
									size: ButtonSize.Compact,
								},
								childAttrs: async () => [
									{
										label: "edit_action",
										icon: Icons.PenFilled,
										size: ButtonSize.Compact,
										click: () => onEditCompanySignature(companySignature),
									},
									{
										label: "remove_action",
										icon: Icons.TrashFilled,
										size: ButtonSize.Compact,
										click: () => onRemoveCompanySignature(),
									},
								],
							}),
						)
					: [
							m(IconButton, {
								label: "edit_action",
								icon: Icons.Plus,
								size: ButtonSize.Compact,
								click: () => onAddCompanySignature(),
							}),
						],
		})
	}
}
