import m, { Children, Component, Vnode } from "mithril"
import { Styles } from "../../../ui/styles.js"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { DynamicColorSvg } from "../../../ui/base/DynamicColorSvg.js"

export interface SetupLeavingUserSurveyPageAttrs {
	closeAction: () => void
	skipAction: () => void
	nextButtonLabel: TranslationKey
	nextButtonEnabled: boolean
	image: string
	imageStyle?: Record<string, any>
	mainMessage: TranslationKey
	secondaryMessage: TranslationKey
}

export class SetupLeavingUserSurveyPage implements Component<SetupLeavingUserSurveyPageAttrs> {
	view(vnode: Vnode<SetupLeavingUserSurveyPageAttrs>): Children {
		return m("#leaving-user-survey-dialog.flex-center", [
			m(
				".flex.flex-column.max-width-m.pt-16.pb-16.plr-24",
				{
					style: {
						minHeight: Styles.get().isDesktopLayout() ? "920px" : "",
						minWidth: Styles.get().isDesktopLayout() ? "450px" : "360px",
					},
				},
				[
					m(
						".mb-16",
						{
							style: {
								width: "330px",
								alignSelf: "center",
								...vnode.attrs.imageStyle,
							},
						},
						m(
							".block.full-width.height-100p",
							m(DynamicColorSvg, {
								path: `/images/leaving-wizard/${vnode.attrs.image}.svg`,
							}),
						),
					),
					m("h3.center.b", lang.get(vnode.attrs.mainMessage)),
					m(".center.pb-24.pt-16", lang.get(vnode.attrs.secondaryMessage)),
					vnode.children,
					m(
						".full-width.flex.col.gap-8.pt-16",
						{
							style: {
								// positions the button at the very bottom of the flex wrapper box for consistency
								margin: Styles.get().isDesktopLayout() ? "auto 0 0 0" : "16px 0 0 0",
							},
						},
						m(PrimaryButton, {
							label: vnode.attrs.nextButtonLabel,
							onclick: () => vnode.attrs.closeAction(),
							class: !vnode.attrs.nextButtonEnabled ? "no-hover disabled-button" : "",
							disabled: !vnode.attrs.nextButtonEnabled,
						}),
						m(SecondaryButton, {
							label: "skip_action",
							onclick: () => vnode.attrs.skipAction(),
						}),
					),
					m(".mt-8.small", lang.get("cancellationConfirmation_msg")),
				],
			),
		])
	}
}
