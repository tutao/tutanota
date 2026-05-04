import m, { Child, ClassComponent, Vnode } from "mithril"
import { theme } from "../theme.js"

interface SkeletonAttrs {
	style: Pick<CSSStyleDeclaration, "width" | "height"> & Partial<Pick<CSSStyleDeclaration, "backgroundColor">>
}

/**
 * A loading placeholder component that displays an animated shimmer effect.
 *
 * Should be used to create a more complex skeleton that resembles your piece of UI
 *
 * There are helper css classes defined for that: "skeleton-bg-1", "skeleton-bg-2",
 * "skeleton-border-1"
 */
export class Skeleton implements ClassComponent<SkeletonAttrs> {
	view({ attrs }: Vnode<SkeletonAttrs>): Child {
		return m(".skeleton.loading.rel.overflow-hidden.border-radius", {
			style: { backgroundColor: theme.surface_container_high, ...attrs.style },
		} satisfies SkeletonAttrs)
	}
}
