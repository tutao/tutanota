import { AccountDeletionPageState } from "../DeleteAccountDialogNew"
import m, { Children, Component, Vnode } from "mithril"
import { TitleSection } from "../../../gui/TitleSection"
import { Icons } from "../../../gui/base/icons/Icons"
import { SecondaryButton } from "../../../gui/base/buttons/VariantButtons"
import { lang } from "../../../misc/LanguageViewModel"

type ReuseMailLandingPageAttrs = {
	data: AccountDeletionPageState
	goToMailTakeoverPage: () => void
	goToPasswordEntryPage: () => void
}

export class ReuseMailLandingPage implements Component<ReuseMailLandingPageAttrs> {
	view({ attrs: { goToMailTakeoverPage, goToPasswordEntryPage } }: Vnode<ReuseMailLandingPageAttrs>): Children {
		return m(".pt-16.pb-16.plr-8.normal-font-size", [
			m(TitleSection, {
				icon: Icons.QuestionmarkFilled,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslation("reuseMailAddressQuestion_msg").text),
			}),
			m(".flex.row.gap-8.justify-center.pt-16", [
				m(SecondaryButton, {
					label: "yes_label",
					class: "flex-grow",
					onclick: () => goToMailTakeoverPage(),
					icon: Icons.SuccessFilled,
				}),
				m(SecondaryButton, {
					label: "no_label",
					class: "flex-grow",
					onclick: () => goToPasswordEntryPage(),
					icon: Icons.FailureFilled,
				}),
			]),
		])
	}
}
