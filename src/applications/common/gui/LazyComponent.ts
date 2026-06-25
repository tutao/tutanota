import m, { Children, ClassComponent, CommonAttributes, Vnode } from "mithril"
import { LazyLoaded } from "@tutao/utils"

export interface LazyComponentAttrs<A, C extends ClassComponent<A>> {
	attrs: A & CommonAttributes<A, C>
	loader: () => Promise<Class<C>>
}

/**
 * Render a lazy-loaded component.
 *
 * For now have to explicitly specific generic arguments or it doesn't work. Maybe there's a workaround via a function.
 */
export class LazyComponent<A, C extends ClassComponent<A>> {
	private readonly componentClass: LazyLoaded<Class<C>>

	constructor({ attrs }: Vnode<LazyComponentAttrs<A, C>>) {
		this.componentClass = new LazyLoaded(() => {
			const component = attrs.loader()
			m.redraw()
			return component
		})
		this.componentClass.load()
	}

	view({ attrs }: Vnode<LazyComponentAttrs<A, C>>): Children {
		const component = this.componentClass.getSync()
		if (component != null) {
			return m<A, C>(component satisfies Class<ClassComponent<A>>, attrs.attrs)
		} else {
			return null
		}
	}
}
