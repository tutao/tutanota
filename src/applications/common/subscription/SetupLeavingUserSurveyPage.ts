import m, { Children, Component, Vnode } from "mithril"
import { Styles } from "../../../ui/styles.js"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { DynamicColorSvg } from "../../../ui/base/DynamicColorSvg.js"

export interface SetupLeavingUserSurveyPageAttrs {
	closeAction: () => void
	nextButtonLabel: TranslationKey
	nextButtonEnabled: boolean
	image: string
	imageStyle?: Record<string, any>
	mainMessage: TranslationKey
	secondaryMessage: TranslationKey
}

export class SetupLeavingUserSurveyPage implements Component<SetupLeavingUserSurveyPageAttrs> {
	view(vnode: Vnode<SetupLeavingUserSurveyPageAttrs>): Children {
		return m("#leaving-user-survey-dialog.pt-16.flex-center", [
			m(
				".flex.flex-column.max-width-m.pt-16.pb-16.plr-24",
				{
					style: {
						minHeight: Styles.get().isDesktopLayout() ? "850px" : "",
						minWidth: Styles.get().isDesktopLayout() ? "450px" : "360px",
					},
				},
				[
					m(
						".mb-16",
						{
							style: {
								height: Styles.get().isDesktopLayout() ? "360px" : "",
								...vnode.attrs.imageStyle,
							},
						},
						m(
							".pb-16.block.full-width.height-100p",
							m(DynamicColorSvg, {
								path: `/images/leaving-wizard/${vnode.attrs.image}.svg`,
							}),
						),
					),
					m("h3.center.b", lang.get(vnode.attrs.mainMessage)),
					m(
						"p.center",
						{
							style: {
								height: Styles.get().isDesktopLayout() ? "45px" : "77.5px",
							},
						},
						lang.get(vnode.attrs.secondaryMessage),
					),
					vnode.children,
					m(
						".full-width",
						{
							style: {
								margin: Styles.get().isDesktopLayout() ? "auto 0 0 0" : "16px 0 0 0", // positions the button at the very bottom of the flex wrapper box for consistency
							},
						},
						m(PrimaryButton, {
							label: vnode.attrs.nextButtonLabel,
							onclick: () => vnode.attrs.closeAction(),
							class: vnode.attrs.nextButtonEnabled ? "no-hover disabled-button" : "",
							disabled: vnode.attrs.nextButtonEnabled,
						}),
					),
				],
			),
		])
	}
}
