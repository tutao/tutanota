import m, {Children, ClassComponent, CommonAttributes, Hyperscript, Vnode} from "mithril"

type InstanceOfClass<C extends Class<unknown>> = C extends Class<infer T> ? T : never

interface GenericRenderer {
	<Attrs>(
		component: Class<ClassComponent<Attrs>>,
		attributes: Attrs & CommonAttributes<Attrs, InstanceOfClass<typeof component>>,
		...args: Children[]
	): Vnode<Attrs, InstanceOfClass<typeof component>>;
}

/** Little helper to help with inference. Only takes class components and only takes attributes as a generic parameter*/
export const gm: GenericRenderer = m