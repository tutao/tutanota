import m, { Children, Component, Vnode } from "mithril"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"

type Props = { closeDialog: () => void }

export class SupportRequestSentDialog implements Component<Props> {
	view({ attrs: { closeDialog } }: Vnode<Props>): Children {
		return m(
			".pb-m.pt-m",
			m(
				"",
				m("h1.center", "We got you covered!"),
				m("p.h4.center.m-0", "lorem ipsum dolor sit amet"),
				m(
					".mt-l.mb-l",
					{},
					m("img.pb.block.full-width.height-100p", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/other.png`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
					}),
				),
				m(
					".center-h.pb",
					{
						style: {
							width: "200px",
						},
					},
					m(LoginButton, {
						label: () => "Nice!",
						onclick: closeDialog,
					}),
				),
			),
		)
	}
}
