import m, { Children, ClassComponent, CommonAttributes, Vnode } from "mithril"
import { LazyLoaded } from "@tutao/utils"

export interface LazyComponentAttrs<A, C extends ClassComponent<A>> {
	attrs: A & CommonAttributes<A, C>
	loader: () => Promise<Class<C>>
}

/** For now have to explicitly specific generic arguments or it doesn't work. Maybe there's a workaround via a function. */
export class LazyComponent<A, C extends ClassComponent<A>> {
	private readonly instance: LazyLoaded<Class<C>>

	constructor({ attrs }: Vnode<LazyComponentAttrs<A, C>>) {
		this.instance = new LazyLoaded(() => {
			const component = attrs.loader()
			m.redraw()
			return component
		})
		this.instance.load()
	}

	view({ attrs }: Vnode<LazyComponentAttrs<A, C>>): Children {
		const component = this.instance.getSync()
		if (component != null) {
			return m<A, C>(component satisfies Class<ClassComponent<A>>, attrs.attrs)
		} else {
			return null
		}
	}
}
