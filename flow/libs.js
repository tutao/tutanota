declare module 'mithril' {
	declare var exports: Mithril;
}
declare module 'mithril/stream/stream.js' {
	declare var exports: any;
}
declare module 'ospec/ospec.js' {
	declare var exports: any;
}
declare module 'faker' {
	declare var faker: any;
}
declare module 'squire-rte' {
	declare var Squire: any;
}
declare module 'dompurify' {
	declare var exports: any;
}
declare module '@hot' { // hmr, access to previously loaded module
	declare var exports: any;
}
declare module 'autolinker' {
	declare var exports: any;
}
declare module 'qrcode' {
	declare var exports: any;
}

declare type Squire = any

declare class Cordova {
	platformId: string;
	exec : Function;
}

declare var cordova: Cordova;


declare class ContactFindOptions { // cordova contact plugin
	filter:string,
	multiple:boolean,
	fields: string[],
	desiredFields: string[]
}

/*
 *The Contact object represents a user's contact. Contacts can be created, stored, or removed from the device contacts database.
 *Contacts can also be retrieved (individually or in bulk) from the database by invoking the navigator.contacts.find method.
 *NOTE: Not all of the contact fields listed above are supported on every device platform. Please check each platform's Quirks section for details.
 */
type CordovaContact = {
	id:string,
	displayName: string,
	name: CordovaContactName,
	nickname: string,
	phoneNumbers: CordovaContactField[],
	emails: CordovaContactField[],
	addresses: CordovaContactAddress[],
	ims:  CordovaContactField[],
	organizations:CordovaContactOrganization[],
	birthday:Date,
	note: string,
	photos: CordovaContactField[],
	categories: CordovaContactField[],
	urls: CordovaContactField[]
}

type CordovaContactName = {
	formatted: string,
	familyName: string,
	givenName: string,
	middleName: string,
	honorificPrefix: string,
	honorificSuffix: string
}
type CordovaContactField = {
	value:string,
	type:string,
	pref:boolean
}
type CordovaContactAddress = {}
type CordovaContactOrganization = {}

var PushNotification: any;


// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/mithril/index.d.ts

interface Mithril {

	(selector: string|Component): Vnode<any>;
	(selector: string|Component, children?: Children): Vnode<any>;
	(selector: string|Component, attributes?: Object, children?: Children): Vnode<any>;
	<Attrs>(component: Class<MComponent<Attrs>>, attributes?: Attrs): Vnode<Attrs>;
	<Attrs>(component: MComponent<Attrs>): Vnode<Attrs>;

	route: {
		set(path: string):void;
		get():string;
		param():Object;
		link(vnode: any):Function;
	};
	redraw():void;
	trust(html: string):any;
	withAttr(attrName: string, callback: Function) : Function;
}

interface Attributes {

	[key: string]: any;
}

interface Lifecycle<Attrs> {
	// The oninit hook is called before a vnode is touched by the virtual DOM engine.
	+oninit?:(vnode: Vnode<Attrs>)=> any;
	// The oncreate hook is called after a DOM element is created and attached to the document.
	+oncreate?: (vnode: VnodeDOM<Attrs>) => any;
	// The onbeforeupdate hook is called before a vnode is diffed in a update.
	+onbeforeremove?: (vnode: VnodeDOM<Attrs>) => Promise<any> | void;
	// The onupdate hook is called after a DOM element is updated, while attached to the document.
	+onremove?:(vnode: VnodeDOM<Attrs>) => any;
	// The onbeforeremove hook is called before a DOM element is detached from the document. If a Promise is returned, Mithril only detaches the DOM element after the promise completes.
	+onbeforeupdate?:(vnode: Vnode<Attrs>, old: VnodeDOM<Attrs>) => boolean | void;
	// The onremove hook is called before a DOM element is removed from the document.
	+onupdate?:(vnode: VnodeDOM<Attrs>)=> any;
}

interface MComponent<Attrs> extends Lifecycle<Attrs> {
	/** Creates a view out of virtual elements. */
	view(vnode: Vnode<Attrs>): Children | null | void;
}

type Child = Vnode<any> | string | number | boolean | null;
type ChildArray = Array<Children>;
type Children = Child | ChildArray;

interface Vnode<Attrs> extends Lifecycle<Attrs> {
	attrs:Attrs,
}

interface VnodeDOM<Attrs> extends Vnode<Attrs> {
	attrs:Attrs,
	dom: HTMLElement,
}

type IconAttrs = {
	icon: SVG,
	class?: string,
	large?: boolean,
	style?: Object,
}