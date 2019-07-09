// Declared at the top level to not import it in all places
declare interface Component {
	view(): VirtualElement | VirtualElement[];
}

declare type RouteResolverMatch = {
	onmatch(args: {[string]: string}, requestedPath: string): ?(Component | Promise<Component>);
}

declare type RouteResolverRender = {
	render(vnode: Object): VirtualElement | Array<VirtualElement>;
}

declare type RouteResolver = (RouteResolverMatch & RouteResolverRender) | RouteResolverMatch | RouteResolverRender

declare module 'mithril' {
	declare interface Router {
		(root: HTMLElement, defaultRoute: string, routes: {[string]: Component | RouteResolver}): void;

		set(path: string, data?: ?{[string]: mixed},
		    options?: {replace?: boolean, state?: ?Object, title?: ?string}): void;

		get(): string;

		param(): Object;

		param(key: string): string;

		prefix(prefix: string): void;

		link(vnode: any): Function;
	}

	declare interface Mithril {

		(selector: string | Component, children?: Children): Vnode<any>;

		(selector: string | Component, attributes?: Object, children?: Children): Vnode<any>;

		<Attrs>(component: Class<MComponent<Attrs>>, children?: Children): Vnode<Attrs>;

		<Attrs>(component: Class<MComponent<Attrs>>, attributes?: Attrs, children?: Children): Vnode<Attrs>;

		<Attrs>(component: MComponent<Attrs>, children?: Children): Vnode<Attrs>;

		<Attrs>(component: MComponent<Attrs>, attributes?: Attrs, children?: Children): Vnode<Attrs>;

		route: Router;

		redraw(): void;

		trust(html: string): any;

		withAttr(attrName: string, callback: Function): Function;

		buildQueryString(args: {[string]: any}): string;

		parseQueryString(queryString: string): {[string]: string};

		render(element: HTMLElement, vnodes: Children): void;
	}

	declare export default Mithril;
}

// TODO: think if they should be covariant. They probably should not be because they're not readonly
declare interface Stream<+T> {
	(): T;

	(T): T;

	map<R>(mapper: (T) => R): Stream<R>;

	end: Stream<boolean>;

	// Covariant breaks this
	// of(val?: T): Stream<T>;

	ap<U>(f: Stream<(value: T) => U>): Stream<U>;
}

// Partially taken from DefinitelyTyped
type StreamModule = {
	/** Creates a stream.*/<T>(value?: T): Stream<T>;
	/** Creates a computed stream that reactively updates if any of its upstreams are updated. Combiner accepts streams. */
	combine<T>(combiner: (...streams: any[]) => T, streams: Array<Stream<any>>): Stream<T>;
	/** Creates a computed stream that reactively updates if any of its upstreams are updated. Combiner accepts values. */
	lift<T>(combiner: (...values: any[]) => T, ...streams: Array<Stream<any>>): Stream<T>;
	/** Creates a stream whose value is the array of values from an array of streams. */
	merge(streams: Array<Stream<any>>): Stream<any[]>;
	/** Creates a new stream with the results of calling the function on every incoming stream with and accumulator and the incoming value. */
	scan<T, U>(fn: (acc: U, value: T) => U, acc: U, stream: Stream<T>): Stream<U>;
	/** Takes an array of pairs of streams and scan functions and merges all those streams using the given functions into a single stream. */
	scanMerge<T, U>(pairs: Array<[Stream<T>, (acc: U, value: T) => U]>, acc: U): Stream<U>;
	/** Takes an array of pairs of streams and scan functions and merges all those streams using the given functions into a single stream. */
	scanMerge<U>(pairs: Array<[Stream<any>, (acc: U, value: any) => U]>, acc: U): Stream<U>;
	/** A special value that can be returned to stream callbacks to halt execution of downstreams. */
	+HALT: {||};
}

declare module 'mithril/stream/stream.js' {
	declare export default StreamModule;
}
declare module 'ospec/ospec.js' {
	declare export default any;
}

declare module 'mockery' {
	declare export default any;
}

declare module 'chalk' {

	declare interface Chalk {
		(...args: Array<string>): string,

		red: Chalk,
		green: Chalk,
		blue: Chalk,
		black: Chalk,
		yellow: Chalk,
		magenta: Chalk,
		gray: Chalk,
		white: Chalk,
		cyan: Chalk,

		redBright: Chalk,
		greenBright: Chalk,
		yellowBright: Chalk,
		blueBright: Chalk,
		magentaBright: Chalk,
		cyanBright: Chalk,
		whiteBright: Chalk,


		bgBlack: Chalk,
		bgRed: Chalk,
		bgGreen: Chalk,
		bgYellow: Chalk,
		bgBlue: Chalk,
		bgMagenta: Chalk,
		bgCyan: Chalk,
		bgWhite: Chalk,
		bgBlackBright: Chalk,
		bgRedBright: Chalk,
		bgGreenBright: Chalk,
		bgYellowBright: Chalk,
		bgBlueBright: Chalk,
		bgMagentaBright: Chalk,
		bgCyanBright: Chalk,
		bgWhiteBright: Chalk,

		reset: Chalk,
		bold: Chalk,
		dim: Chalk,
		underline: Chalk,
	}

	//declare var chalk: Chalk;
	declare export default Chalk
}

declare module 'faker' {
	declare var faker: any;
}
declare module 'squire-rte' {
	declare var Squire: any;
}

declare type SanitizeConfigBase = {
	SAFE_FOR_JQUERY?: boolean,
	SAFE_FOR_TEMPLATES?: boolean,
	ALLOWED_TAGS?: Array<string>,
	ALLOWED_ATTR?: Array<string>,
	USE_PROFILES?: {
		html?: boolean,
		svg?: boolean,
		svgFilters?: boolean,
		mathMl?: boolean
	},
	FORBID_TAGS?: Array<string>,
	FORBID_ATTR?: Array<string>,
	ADD_TAGS?: Array<string>,
	ALLOW_DATA_ATTR?: boolean,
	ALLOW_UNKNOWN_PROTOCOLS?: boolean,
	ALLOWED_URI_REGEXP?: RegExp,
	RETURN_DOM_IMPORT?: boolean,
	WHOLE_DOCUMENT?: boolean,
	SANITIZE_DOM?: boolean,
	KEEP_CONTENT?: boolean,
	FORCE_BODY?: boolean,
}

declare type SanitizeConfig = SanitizeConfigBase & {RETURN_DOM?: boolean} & {RETURN_DOM_FRAGMENT?: boolean}

type DOMPurifyHooks =
	| "beforeSanitizeElements"
	| "uponSanitizeElement"
	| "afterSanitizeElements"
	| "beforeSanitizeAttributes"
	| "uponSanitizeAttribute"
	| "afterSanitizeAttributes"
	| "beforeSanitizeShadowDOM"
	| "uponSanitizeShadowNode"
	| "afterSanitizeShadowDOM"

declare interface IDOMPurify {
	sanitize(html: string | HTMLElement, options: SanitizeConfigBase & {RETURN_DOM_FRAGMENT: true}): DocumentFragment;

	sanitize(html: string | HTMLElement, options: SanitizeConfigBase & {RETURN_DOM: true}): HTMLElement;

	sanitize(html: string | HTMLElement, options?: SanitizeConfigBase): string;

	addHook(hook: DOMPurifyHooks, (node: HTMLElement, data: Object, config: SanitizeConfig) => HTMLElement): void;

	isSupported: boolean;
}

declare module 'dompurify' {
	declare export default IDOMPurify;
}
declare module '@hot' { // hmr, access to previously loaded module
	declare export default any;
	declare export var module: any;
}
declare module 'autolinker' {
	declare export default function link(string, Object): any;
}
declare module 'qrcode' {
	declare export default any;
}

declare module 'chalk' {
	declare export default any;
}

declare type Squire = any

declare var tutao: {
	currentView: any;
}

declare class ContactFindOptions { // cordova contact plugin
	filter: string,
	multiple: boolean,
	fields: string[],
	desiredFields: string[]
}

interface Attributes {

	[key: string]: any;
}

interface Lifecycle<Attrs> {
	// The oninit hook is called before a vnode is touched by the virtual DOM engine.
	+oninit?: (vnode: Vnode<Attrs>) => any;
	// The oncreate hook is called after a DOM element is created and attached to the document.
	+oncreate?: (vnode: VnodeDOM<Attrs>) => any;
	// The onbeforeupdate hook is called before a vnode is diffed in a update.
	+onbeforeremove?: (vnode: VnodeDOM<Attrs>) => Promise<any> | void;
	// The onremove hook is called before a DOM element is removed from the document.
	+onremove?: (vnode: VnodeDOM<Attrs>) => any;
	// The onbeforeremove hook is called before a DOM element is detached from the document. If a Promise is returned, Mithril only detaches the DOM element after the promise completes.
	+onbeforeupdate?: (vnode: Vnode<Attrs>, old: VnodeDOM<Attrs>) => boolean | void;
	// The onupdate hook is called after a DOM element is updated, while attached to the document.
	+onupdate?: (vnode: VnodeDOM<Attrs>) => any;
}

type LifecycleAttrs<T> = T & Lifecycle<T>

type $Attrs<T> = $ReadOnly<$Exact<T>>

interface MComponent<Attrs> extends Lifecycle<Attrs> {
	/** Creates a view out of virtual elements. */
	view(vnode: Vnode<Attrs>): ?Children;
}

export type Child = Vnode<any> | string | number | boolean | null;
export type ChildArray = Array<Children>;
export type Children = Child | ChildArray;

export interface Vnode<Attrs> extends Lifecycle<Attrs> {
	attrs: Attrs,
	children: Children,
	dom: HTMLElement,
}

export interface VnodeDOM<Attrs> extends Vnode<Attrs> {
	attrs: Attrs,
	dom: HTMLElement,
}


// Notification backported from the future version of Flow
// https://github.com/facebook/flow/commit/b67c4e9adf7239433222eaa0ddc52ab4dac5502f
type NotificationPermission = 'default' | 'denied' | 'granted';
type NotificationDirection = 'auto' | 'ltr' | 'rtl';
type VibratePattern = number | Array<number>;
type NotificationAction = {action: string, title: string, icon?: string};
type NotificationOptions = {
	dir?: NotificationDirection,
	lang?: string,
	body?: string,
	tag?: string,
	image?: string,
	icon?: string,
	badge?: string,
	sound?: string,
	vibrate?: VibratePattern,
	timestamp?: number,
	renotify?: boolean,
	silent?: boolean,
	requireInteraction?: boolean,
	data?: ?any,
	actions?: Array<NotificationAction>
};

declare class Notification extends EventTarget {
	constructor(title: string, options?: NotificationOptions): void;
	static permission: NotificationPermission;
	static requestPermission(
		callback?: (perm: NotificationPermission) => mixed
	): Promise<NotificationPermission>;
	static maxActions: number;
	onclick: (evt: Event) => any;
	onerror: (evt: Event) => any;
	title: string;
	dir: NotificationDirection;
	lang: string;
	body: string;
	tag: string;
	image: string;
	icon: string;
	badge: string;
	sound: string;
	vibrate: Array<number>;
	timestamp: number;
	renotify: boolean;
	silent: boolean;
	requireInteraction: boolean;
	data: any;
	actions: Array<NotificationAction>;
	close(): void;
}
