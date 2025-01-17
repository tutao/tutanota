import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getLocalisedCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { px } from "../../gui/size.js"

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
		const defaultHeight = 666
		return m(
			"",
			{
				style: {
					height: px(defaultHeight),
					// height: px(styles.bodyHeight > defaultHeight ? defaultHeight : styles.bodyHeight),
				},
			},
			m(".h4.pt", "Find your answers here"),
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
