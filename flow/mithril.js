// @flow
type $Promisable<+T> = Promise<T> | T;
// Declared at the top level to not import it in all places
interface MComponent<-Attrs> extends Lifecycle<Attrs> {
	/** Creates a view out of virtual elements. */
	view(vnode: Vnode<Attrs>): Children;
}

export type Child = Vnode<any> | string | number | boolean | null;
export type ChildArray = Array<Children>;
export type Children = Child | ChildArray;

export interface Vnode<Attrs> extends Lifecycle<Attrs> {
	attrs: Attrs,
	children: ChildArray,
	dom: HTMLElement,
}

export interface VnodeDOM<Attrs> extends Vnode<Attrs> {
	attrs: Attrs,
	dom: HTMLElement,
}

declare type QueryValue = string | boolean | Array<QueryValue>

/** Top-level components accept route and query parameters as attrs */
type TopLevelComponentAttrs = {[string]: QueryValue}

declare type RouteResolverMatch = {
	onmatch(args: {[string]: QueryValue}, requestedPath: string): $Promisable<?MComponent<TopLevelComponentAttrs>>;
}

declare type RouteResolverRender = {
	render(vnode: Vnode<TopLevelComponentAttrs>): Children | Array<Children>;
}

declare type RouteResolver = (RouteResolverMatch & RouteResolverRender) | RouteResolverMatch | RouteResolverRender

/**
 * mithril component lifecycle methods: https://mithril.js.org/lifecycle-methods.html
 */
interface Lifecycle<Attrs> {
	// The oninit hook is called before a vnode is touched by the virtual DOM engine.
	+oninit?: (vnode: Vnode<Attrs>) => void;
	// The oncreate hook is called after a DOM element is created and attached to the document.
	+oncreate?: (vnode: VnodeDOM<Attrs>) => void;
	// The onbeforeremove hook is called before a DOM element is detached from the document.
	// If a Promise is returned, Mithril only detaches the DOM element after the promise completes.
	+onbeforeremove?: (vnode: VnodeDOM<Attrs>) => void | Promise<void>;
	// The onremove hook is called before a DOM element is removed from the document.
	+onremove?: (vnode: VnodeDOM<Attrs>) => void;
	// The onbeforeupdate hook is called before a vnode is diffed in a update.
	// if it returns false, Mithril prevents a diff from happening to the vnode,
	// and consequently to the vnode's children.
	+onbeforeupdate?: (vnode: Vnode<Attrs>, old: VnodeDOM<Attrs>) => boolean | void;
	// The onupdate hook is called after a DOM element is updated, while attached to the document.
	+onupdate?: (vnode: VnodeDOM<Attrs>) => void;
}

type LifecycleAttrs<T> = T & Lifecycle<T>

type Attrs = $ReadOnly<{[?string]: any}>

type QueryParams = {[string]: QueryValue}

declare interface Router {
	(root: HTMLElement, defaultRoute: string, routes: {[string]: MComponent<TopLevelComponentAttrs> | RouteResolver}): void;

	set(path: string, data?: ?{[string]: mixed},
	    options?: {replace?: boolean, state?: ?Object, title?: ?string}): void;

	get(): string;

	param(): Object;

	param(key: string): string;

	prefix: string;

	Link: MComponent<any>;
}

interface Redraw {
	(): void;

	sync(): void;
}

declare interface Mithril {
	// We would like to write a definition which allows omitting Attrs if all keys are optional
	(component: string | MComponent<void> | Class<MComponent<void>>, children?: Children): Vnode<any>;

	<AttrsT: Attrs>(
		component: string | Class<MComponent<AttrsT>> | MComponent<AttrsT>,
		attributes: AttrsT,
		children?: Children
	): Vnode<any>;

	route: Router;

	redraw: Redraw;

	fragment<Attrs: $ReadOnly<{[?string]: any}>>(attributes: Attrs, children?: Children): Vnode<any>;

	trust(html: string): Vnode<void>;

	withAttr(attrName: string, callback: Function): Function;

	buildQueryString(args: QueryParams): string;

	parseQueryString(queryString: string): QueryParams;

	mount(element: HTMLElement, MComponent<void> | Class<MComponent<void>> | null): void;

	render(element: HTMLElement, vnodes: Children): void;
}

declare module 'mithril' {
	declare interface Router {
		(root: HTMLElement, defaultRoute: string, routes: {[string]: MComponent<mixed> | RouteResolver}): void;

		set(path: string, data?: ?{[string]: mixed},
		    options?: {replace?: boolean, state?: ?Object, title?: ?string}): void;

		get(): string;

		param(): Object;

		param(key: string): string;

		prefix: string;

		Link: MComponent<mixed>;
	}

	declare export default Mithril;
}
