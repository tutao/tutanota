declare module 'squire-rte' {
	declare var Squire: any;
}

declare module '@hot' { // hmr, access to previously loaded module
	declare export default any;
	declare export var module: any;
}
// https://soapbox.github.io/linkifyjs/docs/options.html
type LinkifyOptions = {|
	attributes?: Object | (href: string, type: string) => Object,
	target?: string,
	validate?: {
		url: (value: string, type: string) => boolean
	}
|}
declare module 'linkify/html' {
	declare export default function linkifyHtml(html: string, options: LinkifyOptions): string
}

declare module 'qrcode' {
	declare export default any;
}

declare type Squire = any

declare var tutao: {
	currentView: any;
	m: Mithril
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

type $Attrs<+T> = $ReadOnly<T>

// override flowlib to include "hot"
declare var module: {
	exports: any,
	require(id: string): any,
	id: string,
	filename: string,
	loaded: boolean,
	parent: any,
	children: Array<any>,
	builtinModules: Array<string>,
	hot: ?{
		data?: {[string]: mixed},
		dispose: ((data: {[string]: mixed}) => mixed) => void,
		accept: (() => mixed) => void
	},
	...
};