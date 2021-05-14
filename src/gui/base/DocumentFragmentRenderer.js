// @flow

export type DocumentFragmentRendererAttrs = {
	fragment: DocumentFragment,

	// Wrapper should have no children because they will be eliminated anyway
	wrapper: Child
}

/**
 * Renders a DocumentFragment, e.g. The output of htmlSanitizer.sanitizeFragment
 */
export class DocumentFragmentRenderer implements MComponent<DocumentFragmentRendererAttrs> {
	_currentlyRendered: ?DocumentFragment = null

	oncreate(vnode: Vnode<DocumentFragmentRendererAttrs>) {
		this._currentlyRendered = vnode.attrs.fragment
		this.replaceFragment(vnode.dom, vnode.attrs.fragment)
	}

	onupdate(vnode: Vnode<DocumentFragmentRendererAttrs>) {
		// Once you append a document fragment to an element, then the document fragment loses all of it's contents,
		// So if we do it again then it will disappear
		if (this._currentlyRendered !== vnode.attrs.fragment) {
			this.replaceFragment(vnode.dom, vnode.attrs.fragment)
		}
	}

	view(vnode: Vnode<DocumentFragmentRendererAttrs>): Children {
		return vnode.attrs.wrapper
	}

	replaceFragment(element: HTMLElement, fragment: DocumentFragment) {
		this._currentlyRendered = fragment
		while (element.firstChild) {
			element.removeChild(element.firstChild)
		}
		element.appendChild(fragment)
	}
}

