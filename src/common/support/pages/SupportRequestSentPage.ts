import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../gui/base/Card.js"
import { lang } from "../../misc/LanguageViewModel.js"

type SupportRequestSentPageAttrs = {}

export class SupportRequestSentPage implements Component<SupportRequestSentPageAttrs> {
	view(vnode: Vnode<SupportRequestSentPageAttrs>): Children {
		return m(
			".pt.pb",
			m(
				Card,
				m(
					"",
					m(".h4.center.pb-s.pt-s", lang.get("supportRequestReceived_title")),
					m("p.center.m-0", lang.get("supportRequestReceived_msg")),
					m(
						".mt-l.mb-s",
						{},
						m("img.pb.block.full-width.height-100p", {
							src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/other.png`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
				),
			),
		)
	}
}
