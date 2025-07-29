import m, { Child, ClassComponent, Vnode } from "mithril"
import { theme } from "../theme.js"

interface SkeletonAttrs {
	style?: Partial<Pick<CSSStyleDeclaration, "width" | "height" | "backgroundColor">>
}

export class Skeleton implements ClassComponent<SkeletonAttrs> {
	view({ attrs }: Vnode<SkeletonAttrs>): Child {
		return m(".skeleton.loading.rel.overflow-hidden.border-radius", {
			style: { backgroundColor: theme.surface_container_high, ...attrs.style },
		} satisfies SkeletonAttrs)
	}
}
