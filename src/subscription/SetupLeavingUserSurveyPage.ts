import m, { Children, Component, Vnode } from "mithril"
import { styles } from "../gui/styles.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"

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
		return m("#leaving-user-survey-dialog.pt.flex-center", [
			m(
				".flex.flex-column.max-width-m.pt.pb.plr-l",
				{
					style: {
						minHeight: styles.isDesktopLayout() ? "850px" : "",
						minWidth: styles.isDesktopLayout() ? "450px" : "360px",
					},
				},
				[
					m(
						".mb",
						{
							style: {
								height: styles.isDesktopLayout() ? "360px" : "",
								...vnode.attrs.imageStyle,
							},
						},
						m("img.pb.block.full-width.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/${vnode.attrs.image}.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
					m("h3.center.b", lang.get(vnode.attrs.mainMessage)),
					m(
						"p.center",
						{
							style: {
								height: styles.isDesktopLayout() ? "45px" : "77.5px",
							},
						},
						lang.get(vnode.attrs.secondaryMessage),
					),
					vnode.children,
					m(
						".full-width",
						{
							style: {
								margin: styles.isDesktopLayout() ? "auto 0 0 0" : "16px 0 0 0", // positions the button at the very bottom of the flex wrapper box for consistency
							},
						},
						m(LoginButton, {
							label: vnode.attrs.nextButtonLabel,
							onclick: () => vnode.attrs.closeAction(),
							class: vnode.attrs.nextButtonEnabled ? "no-hover button-bg" : "",
							disabled: vnode.attrs.nextButtonEnabled,
						}),
					),
				],
			),
		])
	}
}
