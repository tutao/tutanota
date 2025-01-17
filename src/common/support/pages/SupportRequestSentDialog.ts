import m, { Children, Component } from "mithril"
import { Card } from "../../gui/base/Card.js"

export class SupportRequestSentDialog implements Component {
	view(): Children {
		return m(
			".pt-ml",
			m(
				Card,
				{ rootElementType: "div" },
				m(
					"",
					m("h1.center.pb-s.pt-s", "We received your request!"),
					m("p.h4.center.m-0", "We got you covered and you'll soon hear back from us."),
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
