// @flow

/**
 * Little helper to create your components from pure functions. No need to return objects, no need to define classes, no fear of shooting
 * yourself in the foot with object components.
 */
export function pureComponent<T>(factory: (T, Children) => Children): MComponent<T> {
	return {
		view(vnode: Vnode<T>): Children {
			return factory(vnode.attrs, vnode.children)
		}
	}
}