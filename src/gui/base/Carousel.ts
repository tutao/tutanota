import m, { Children, Component, Vnode } from "mithril"
import { CalendarSwipeHandler } from "./CalendarSwipeHandler.js"

type Slide = { label: string; element: Children }

interface CarouselAttrs {
	label: string
	slides: Slide[]
	style?: Record<string, any>
	onSwipe: (isNext: boolean) => void
}

export class Carousel implements Component<CarouselAttrs> {
	private containerDom: HTMLElement | null = null
	private swipeHandler: CalendarSwipeHandler | null = null

	view(vnode: Vnode<CarouselAttrs>): Children {
		const attrs = vnode.attrs
		return m(
			"section.flex-space-around.column-gap-s",
			{
				role: "group",
				"aria-roledescription": "carousel",
				"aria-label": attrs.label,
				style: attrs.style,
				oncreate: (swiperNode) => {
					this.containerDom = swiperNode.dom as HTMLElement
					this.swipeHandler = new CalendarSwipeHandler(this.containerDom, (isNext: boolean) => attrs.onSwipe(isNext))
					this.swipeHandler.attach()
				},
			},
			attrs.slides.map((slide) => renderSlide(slide)),
		)
	}
}

function renderSlide(slide: Slide): Children {
	return m(
		"",
		{
			role: "group",
			"aria-role": "slide",
			"aria-label": slide.label,
		},
		slide.element,
	)
}
