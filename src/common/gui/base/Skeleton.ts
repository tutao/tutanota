import m, { Child, ClassComponent, Vnode } from "mithril"

interface SkeletonAttrs {
	style?: Partial<Pick<CSSStyleDeclaration, "width" | "height">>
}

export class Skeleton implements ClassComponent<SkeletonAttrs> {
	view({ attrs }: Vnode<SkeletonAttrs>): Child {
		return m(".skeleton.loading.rel.overflow-hidden.border-radius.navigation-menu-bg", {
			style: attrs.style,
		} satisfies SkeletonAttrs)
	}
}
