import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getLocalisedCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"

type Props = {
	data: SupportDialogState
	toCategoryDetail: Thunk
	goToContactSupport: Thunk
}

export class SupportLandingPage implements Component<Props> {
	view({
		attrs: {
			data: { supportData, selectedCategory },
			goToContactSupport,
			toCategoryDetail,
		},
	}: Vnode<Props>): Children {
		return m(
			"",
			{
				style: {
					height: "666px", // FIXME: Find proper responsive height
				},
			},
			m(".h1.text-center.pt", "Find your answers here"),
			m("p.text-center", "We are here to help you with your question or issue."),
			m(
				".pb.pt.flex.col.gap-vpad.fit-height.box-content",
				supportData.categories.map((category) =>
					m(SectionButton, {
						text: getLocalisedCategoryName(category, lang.languageTag),
						onclick: () => {
							selectedCategory(category)
							toCategoryDetail()
						},
					}),
				),
			),
			m(NoSolutionSectionButton, {
				onClick: goToContactSupport,
			}),
		)
	}
}