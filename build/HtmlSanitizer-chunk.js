import { __commonJS, __toESM } from "./chunk-chunk.js";
import { downcast, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import { ReplacementImage } from "./Icons-chunk.js";
import { encodeSVG } from "./Dialog-chunk.js";

//#region libs/purify.js
var require_purify = __commonJS({ "libs/purify.js"(exports, module) {
	/*! @license DOMPurify 3.2.4 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.4/LICENSE */
	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.DOMPurify = factory());
	})(exports, function() {
		"use strict";
		const { entries, setPrototypeOf, isFrozen, getPrototypeOf, getOwnPropertyDescriptor } = Object;
		let { freeze, seal, create } = Object;
		let { apply, construct } = typeof Reflect !== "undefined" && Reflect;
		if (!freeze) freeze = function freeze$1(x) {
			return x;
		};
		if (!seal) seal = function seal$1(x) {
			return x;
		};
		if (!apply) apply = function apply$1(fun, thisValue, args) {
			return fun.apply(thisValue, args);
		};
		if (!construct) construct = function construct$1(Func, args) {
			return new Func(...args);
		};
		const arrayForEach = unapply(Array.prototype.forEach);
		const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
		const arrayPop = unapply(Array.prototype.pop);
		const arrayPush = unapply(Array.prototype.push);
		const arraySplice = unapply(Array.prototype.splice);
		const stringToLowerCase = unapply(String.prototype.toLowerCase);
		const stringToString = unapply(String.prototype.toString);
		const stringMatch = unapply(String.prototype.match);
		const stringReplace = unapply(String.prototype.replace);
		const stringIndexOf = unapply(String.prototype.indexOf);
		const stringTrim = unapply(String.prototype.trim);
		const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
		const regExpTest = unapply(RegExp.prototype.test);
		const typeErrorCreate = unconstruct(TypeError);
		/**
		* Creates a new function that calls the given function with a specified thisArg and arguments.
		*
		* @param func - The function to be wrapped and called.
		* @returns A new function that calls the given function with a specified thisArg and arguments.
		*/
		function unapply(func) {
			return function(thisArg) {
				for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
				return apply(func, thisArg, args);
			};
		}
		/**
		* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
		*
		* @param func - The constructor function to be wrapped and called.
		* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
		*/
		function unconstruct(func) {
			return function() {
				for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
				return construct(func, args);
			};
		}
		/**
		* Add properties to a lookup table
		*
		* @param set - The set to which elements will be added.
		* @param array - The array containing elements to be added to the set.
		* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
		* @returns The modified set with added elements.
		*/
		function addToSet(set, array) {
			let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
			if (setPrototypeOf) setPrototypeOf(set, null);
			let l = array.length;
			while (l--) {
				let element = array[l];
				if (typeof element === "string") {
					const lcElement = transformCaseFunc(element);
					if (lcElement !== element) {
						if (!isFrozen(array)) array[l] = lcElement;
						element = lcElement;
					}
				}
				set[element] = true;
			}
			return set;
		}
		/**
		* Clean up an array to harden against CSPP
		*
		* @param array - The array to be cleaned.
		* @returns The cleaned version of the array
		*/
		function cleanArray(array) {
			for (let index = 0; index < array.length; index++) {
				const isPropertyExist = objectHasOwnProperty(array, index);
				if (!isPropertyExist) array[index] = null;
			}
			return array;
		}
		/**
		* Shallow clone an object
		*
		* @param object - The object to be cloned.
		* @returns A new object that copies the original.
		*/
		function clone(object) {
			const newObject = create(null);
			for (const [property, value] of entries(object)) {
				const isPropertyExist = objectHasOwnProperty(object, property);
				if (isPropertyExist) if (Array.isArray(value)) newObject[property] = cleanArray(value);
else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
else newObject[property] = value;
			}
			return newObject;
		}
		/**
		* This method automatically checks if the prop is function or getter and behaves accordingly.
		*
		* @param object - The object to look up the getter function in its prototype chain.
		* @param prop - The property name for which to find the getter function.
		* @returns The getter function found in the prototype chain or a fallback function.
		*/
		function lookupGetter(object, prop) {
			while (object !== null) {
				const desc = getOwnPropertyDescriptor(object, prop);
				if (desc) {
					if (desc.get) return unapply(desc.get);
					if (typeof desc.value === "function") return unapply(desc.value);
				}
				object = getPrototypeOf(object);
			}
			function fallbackValue() {
				return null;
			}
			return fallbackValue;
		}
		const html$1 = freeze([
			"a",
			"abbr",
			"acronym",
			"address",
			"area",
			"article",
			"aside",
			"audio",
			"b",
			"bdi",
			"bdo",
			"big",
			"blink",
			"blockquote",
			"body",
			"br",
			"button",
			"canvas",
			"caption",
			"center",
			"cite",
			"code",
			"col",
			"colgroup",
			"content",
			"data",
			"datalist",
			"dd",
			"decorator",
			"del",
			"details",
			"dfn",
			"dialog",
			"dir",
			"div",
			"dl",
			"dt",
			"element",
			"em",
			"fieldset",
			"figcaption",
			"figure",
			"font",
			"footer",
			"form",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"head",
			"header",
			"hgroup",
			"hr",
			"html",
			"i",
			"img",
			"input",
			"ins",
			"kbd",
			"label",
			"legend",
			"li",
			"main",
			"map",
			"mark",
			"marquee",
			"menu",
			"menuitem",
			"meter",
			"nav",
			"nobr",
			"ol",
			"optgroup",
			"option",
			"output",
			"p",
			"picture",
			"pre",
			"progress",
			"q",
			"rp",
			"rt",
			"ruby",
			"s",
			"samp",
			"section",
			"select",
			"shadow",
			"small",
			"source",
			"spacer",
			"span",
			"strike",
			"strong",
			"style",
			"sub",
			"summary",
			"sup",
			"table",
			"tbody",
			"td",
			"template",
			"textarea",
			"tfoot",
			"th",
			"thead",
			"time",
			"tr",
			"track",
			"tt",
			"u",
			"ul",
			"var",
			"video",
			"wbr"
		]);
		const svg$1 = freeze([
			"svg",
			"a",
			"altglyph",
			"altglyphdef",
			"altglyphitem",
			"animatecolor",
			"animatemotion",
			"animatetransform",
			"circle",
			"clippath",
			"defs",
			"desc",
			"ellipse",
			"filter",
			"font",
			"g",
			"glyph",
			"glyphref",
			"hkern",
			"image",
			"line",
			"lineargradient",
			"marker",
			"mask",
			"metadata",
			"mpath",
			"path",
			"pattern",
			"polygon",
			"polyline",
			"radialgradient",
			"rect",
			"stop",
			"style",
			"switch",
			"symbol",
			"text",
			"textpath",
			"title",
			"tref",
			"tspan",
			"view",
			"vkern"
		]);
		const svgFilters = freeze([
			"feBlend",
			"feColorMatrix",
			"feComponentTransfer",
			"feComposite",
			"feConvolveMatrix",
			"feDiffuseLighting",
			"feDisplacementMap",
			"feDistantLight",
			"feDropShadow",
			"feFlood",
			"feFuncA",
			"feFuncB",
			"feFuncG",
			"feFuncR",
			"feGaussianBlur",
			"feImage",
			"feMerge",
			"feMergeNode",
			"feMorphology",
			"feOffset",
			"fePointLight",
			"feSpecularLighting",
			"feSpotLight",
			"feTile",
			"feTurbulence"
		]);
		const svgDisallowed = freeze([
			"animate",
			"color-profile",
			"cursor",
			"discard",
			"font-face",
			"font-face-format",
			"font-face-name",
			"font-face-src",
			"font-face-uri",
			"foreignobject",
			"hatch",
			"hatchpath",
			"mesh",
			"meshgradient",
			"meshpatch",
			"meshrow",
			"missing-glyph",
			"script",
			"set",
			"solidcolor",
			"unknown",
			"use"
		]);
		const mathMl$1 = freeze([
			"math",
			"menclose",
			"merror",
			"mfenced",
			"mfrac",
			"mglyph",
			"mi",
			"mlabeledtr",
			"mmultiscripts",
			"mn",
			"mo",
			"mover",
			"mpadded",
			"mphantom",
			"mroot",
			"mrow",
			"ms",
			"mspace",
			"msqrt",
			"mstyle",
			"msub",
			"msup",
			"msubsup",
			"mtable",
			"mtd",
			"mtext",
			"mtr",
			"munder",
			"munderover",
			"mprescripts"
		]);
		const mathMlDisallowed = freeze([
			"maction",
			"maligngroup",
			"malignmark",
			"mlongdiv",
			"mscarries",
			"mscarry",
			"msgroup",
			"mstack",
			"msline",
			"msrow",
			"semantics",
			"annotation",
			"annotation-xml",
			"mprescripts",
			"none"
		]);
		const text = freeze(["#text"]);
		const html = freeze([
			"accept",
			"action",
			"align",
			"alt",
			"autocapitalize",
			"autocomplete",
			"autopictureinpicture",
			"autoplay",
			"background",
			"bgcolor",
			"border",
			"capture",
			"cellpadding",
			"cellspacing",
			"checked",
			"cite",
			"class",
			"clear",
			"color",
			"cols",
			"colspan",
			"controls",
			"controlslist",
			"coords",
			"crossorigin",
			"datetime",
			"decoding",
			"default",
			"dir",
			"disabled",
			"disablepictureinpicture",
			"disableremoteplayback",
			"download",
			"draggable",
			"enctype",
			"enterkeyhint",
			"face",
			"for",
			"headers",
			"height",
			"hidden",
			"high",
			"href",
			"hreflang",
			"id",
			"inputmode",
			"integrity",
			"ismap",
			"kind",
			"label",
			"lang",
			"list",
			"loading",
			"loop",
			"low",
			"max",
			"maxlength",
			"media",
			"method",
			"min",
			"minlength",
			"multiple",
			"muted",
			"name",
			"nonce",
			"noshade",
			"novalidate",
			"nowrap",
			"open",
			"optimum",
			"pattern",
			"placeholder",
			"playsinline",
			"popover",
			"popovertarget",
			"popovertargetaction",
			"poster",
			"preload",
			"pubdate",
			"radiogroup",
			"readonly",
			"rel",
			"required",
			"rev",
			"reversed",
			"role",
			"rows",
			"rowspan",
			"spellcheck",
			"scope",
			"selected",
			"shape",
			"size",
			"sizes",
			"span",
			"srclang",
			"start",
			"src",
			"srcset",
			"step",
			"style",
			"summary",
			"tabindex",
			"title",
			"translate",
			"type",
			"usemap",
			"valign",
			"value",
			"width",
			"wrap",
			"xmlns",
			"slot"
		]);
		const svg = freeze([
			"accent-height",
			"accumulate",
			"additive",
			"alignment-baseline",
			"amplitude",
			"ascent",
			"attributename",
			"attributetype",
			"azimuth",
			"basefrequency",
			"baseline-shift",
			"begin",
			"bias",
			"by",
			"class",
			"clip",
			"clippathunits",
			"clip-path",
			"clip-rule",
			"color",
			"color-interpolation",
			"color-interpolation-filters",
			"color-profile",
			"color-rendering",
			"cx",
			"cy",
			"d",
			"dx",
			"dy",
			"diffuseconstant",
			"direction",
			"display",
			"divisor",
			"dur",
			"edgemode",
			"elevation",
			"end",
			"exponent",
			"fill",
			"fill-opacity",
			"fill-rule",
			"filter",
			"filterunits",
			"flood-color",
			"flood-opacity",
			"font-family",
			"font-size",
			"font-size-adjust",
			"font-stretch",
			"font-style",
			"font-variant",
			"font-weight",
			"fx",
			"fy",
			"g1",
			"g2",
			"glyph-name",
			"glyphref",
			"gradientunits",
			"gradienttransform",
			"height",
			"href",
			"id",
			"image-rendering",
			"in",
			"in2",
			"intercept",
			"k",
			"k1",
			"k2",
			"k3",
			"k4",
			"kerning",
			"keypoints",
			"keysplines",
			"keytimes",
			"lang",
			"lengthadjust",
			"letter-spacing",
			"kernelmatrix",
			"kernelunitlength",
			"lighting-color",
			"local",
			"marker-end",
			"marker-mid",
			"marker-start",
			"markerheight",
			"markerunits",
			"markerwidth",
			"maskcontentunits",
			"maskunits",
			"max",
			"mask",
			"media",
			"method",
			"mode",
			"min",
			"name",
			"numoctaves",
			"offset",
			"operator",
			"opacity",
			"order",
			"orient",
			"orientation",
			"origin",
			"overflow",
			"paint-order",
			"path",
			"pathlength",
			"patterncontentunits",
			"patterntransform",
			"patternunits",
			"points",
			"preservealpha",
			"preserveaspectratio",
			"primitiveunits",
			"r",
			"rx",
			"ry",
			"radius",
			"refx",
			"refy",
			"repeatcount",
			"repeatdur",
			"restart",
			"result",
			"rotate",
			"scale",
			"seed",
			"shape-rendering",
			"slope",
			"specularconstant",
			"specularexponent",
			"spreadmethod",
			"startoffset",
			"stddeviation",
			"stitchtiles",
			"stop-color",
			"stop-opacity",
			"stroke-dasharray",
			"stroke-dashoffset",
			"stroke-linecap",
			"stroke-linejoin",
			"stroke-miterlimit",
			"stroke-opacity",
			"stroke",
			"stroke-width",
			"style",
			"surfacescale",
			"systemlanguage",
			"tabindex",
			"tablevalues",
			"targetx",
			"targety",
			"transform",
			"transform-origin",
			"text-anchor",
			"text-decoration",
			"text-rendering",
			"textlength",
			"type",
			"u1",
			"u2",
			"unicode",
			"values",
			"viewbox",
			"visibility",
			"version",
			"vert-adv-y",
			"vert-origin-x",
			"vert-origin-y",
			"width",
			"word-spacing",
			"wrap",
			"writing-mode",
			"xchannelselector",
			"ychannelselector",
			"x",
			"x1",
			"x2",
			"xmlns",
			"y",
			"y1",
			"y2",
			"z",
			"zoomandpan"
		]);
		const mathMl = freeze([
			"accent",
			"accentunder",
			"align",
			"bevelled",
			"close",
			"columnsalign",
			"columnlines",
			"columnspan",
			"denomalign",
			"depth",
			"dir",
			"display",
			"displaystyle",
			"encoding",
			"fence",
			"frame",
			"height",
			"href",
			"id",
			"largeop",
			"length",
			"linethickness",
			"lspace",
			"lquote",
			"mathbackground",
			"mathcolor",
			"mathsize",
			"mathvariant",
			"maxsize",
			"minsize",
			"movablelimits",
			"notation",
			"numalign",
			"open",
			"rowalign",
			"rowlines",
			"rowspacing",
			"rowspan",
			"rspace",
			"rquote",
			"scriptlevel",
			"scriptminsize",
			"scriptsizemultiplier",
			"selection",
			"separator",
			"separators",
			"stretchy",
			"subscriptshift",
			"supscriptshift",
			"symmetric",
			"voffset",
			"width",
			"xmlns"
		]);
		const xml = freeze([
			"xlink:href",
			"xml:id",
			"xlink:title",
			"xml:space",
			"xmlns:xlink"
		]);
		const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
		const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
		const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
		const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
		const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
		const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
		const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
		const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
		const DOCTYPE_NAME = seal(/^html$/i);
		const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
		var EXPRESSIONS = /*#__PURE__*/ Object.freeze({
			__proto__: null,
			ARIA_ATTR,
			ATTR_WHITESPACE,
			CUSTOM_ELEMENT,
			DATA_ATTR,
			DOCTYPE_NAME,
			ERB_EXPR,
			IS_ALLOWED_URI,
			IS_SCRIPT_OR_DATA,
			MUSTACHE_EXPR,
			TMPLIT_EXPR
		});
		const NODE_TYPE = {
			element: 1,
			attribute: 2,
			text: 3,
			cdataSection: 4,
			entityReference: 5,
			entityNode: 6,
			progressingInstruction: 7,
			comment: 8,
			document: 9,
			documentType: 10,
			documentFragment: 11,
			notation: 12
		};
		const getGlobal = function getGlobal$1() {
			return typeof window === "undefined" ? null : window;
		};
		/**
		* Creates a no-op policy for internal use only.
		* Don't export this function outside this module!
		* @param trustedTypes The policy factory.
		* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
		* @return The policy created (or null, if Trusted Types
		* are not supported or creating the policy failed).
		*/
		const _createTrustedTypesPolicy = function _createTrustedTypesPolicy$1(trustedTypes, purifyHostElement) {
			if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
			let suffix = null;
			const ATTR_NAME = "data-tt-policy-suffix";
			if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
			const policyName = "dompurify" + (suffix ? "#" + suffix : "");
			try {
				return trustedTypes.createPolicy(policyName, {
					createHTML(html$2) {
						return html$2;
					},
					createScriptURL(scriptUrl) {
						return scriptUrl;
					}
				});
			} catch (_) {
				console.warn("TrustedTypes policy " + policyName + " could not be created.");
				return null;
			}
		};
		const _createHooksMap = function _createHooksMap$1() {
			return {
				afterSanitizeAttributes: [],
				afterSanitizeElements: [],
				afterSanitizeShadowDOM: [],
				beforeSanitizeAttributes: [],
				beforeSanitizeElements: [],
				beforeSanitizeShadowDOM: [],
				uponSanitizeAttribute: [],
				uponSanitizeElement: [],
				uponSanitizeShadowNode: []
			};
		};
		function createDOMPurify() {
			let window$1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
			const DOMPurify$1 = (root) => createDOMPurify(root);
			DOMPurify$1.version = "3.2.4";
			DOMPurify$1.removed = [];
			if (!window$1 || !window$1.document || window$1.document.nodeType !== NODE_TYPE.document || !window$1.Element) {
				DOMPurify$1.isSupported = false;
				return DOMPurify$1;
			}
			let { document } = window$1;
			const originalDocument = document;
			const currentScript = originalDocument.currentScript;
			const { DocumentFragment, HTMLTemplateElement, Node, Element, NodeFilter, NamedNodeMap = window$1.NamedNodeMap || window$1.MozNamedAttrMap, HTMLFormElement, DOMParser: DOMParser$1, trustedTypes } = window$1;
			const ElementPrototype = Element.prototype;
			const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
			const remove = lookupGetter(ElementPrototype, "remove");
			const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
			const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
			const getParentNode = lookupGetter(ElementPrototype, "parentNode");
			if (typeof HTMLTemplateElement === "function") {
				const template = document.createElement("template");
				if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
			}
			let trustedTypesPolicy;
			let emptyHTML = "";
			const { implementation, createNodeIterator, createDocumentFragment, getElementsByTagName } = document;
			const { importNode } = originalDocument;
			let hooks = _createHooksMap();
			/**
			* Expose whether this browser supports running the full DOMPurify.
			*/
			DOMPurify$1.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== undefined;
			const { MUSTACHE_EXPR: MUSTACHE_EXPR$1, ERB_EXPR: ERB_EXPR$1, TMPLIT_EXPR: TMPLIT_EXPR$1, DATA_ATTR: DATA_ATTR$1, ARIA_ATTR: ARIA_ATTR$1, IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA$1, ATTR_WHITESPACE: ATTR_WHITESPACE$1, CUSTOM_ELEMENT: CUSTOM_ELEMENT$1 } = EXPRESSIONS;
			let { IS_ALLOWED_URI: IS_ALLOWED_URI$1 } = EXPRESSIONS;
			/**
			* We consider the elements and attributes below to be safe. Ideally
			* don't add any new ones but feel free to remove unwanted ones.
			*/
			let ALLOWED_TAGS = null;
			const DEFAULT_ALLOWED_TAGS = addToSet({}, [
				...html$1,
				...svg$1,
				...svgFilters,
				...mathMl$1,
				...text
			]);
			let ALLOWED_ATTR = null;
			const DEFAULT_ALLOWED_ATTR = addToSet({}, [
				...html,
				...svg,
				...mathMl,
				...xml
			]);
			let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
				tagNameCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				},
				attributeNameCheck: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: null
				},
				allowCustomizedBuiltInElements: {
					writable: true,
					configurable: false,
					enumerable: true,
					value: false
				}
			}));
			let FORBID_TAGS$1 = null;
			let FORBID_ATTR = null;
			let ALLOW_ARIA_ATTR = true;
			let ALLOW_DATA_ATTR = true;
			let ALLOW_UNKNOWN_PROTOCOLS = false;
			let ALLOW_SELF_CLOSE_IN_ATTR = true;
			let SAFE_FOR_TEMPLATES = false;
			let SAFE_FOR_XML = true;
			let WHOLE_DOCUMENT = false;
			let SET_CONFIG = false;
			let FORCE_BODY = false;
			let RETURN_DOM = false;
			let RETURN_DOM_FRAGMENT = false;
			let RETURN_TRUSTED_TYPE = false;
			let SANITIZE_DOM = true;
			let SANITIZE_NAMED_PROPS = false;
			const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
			let KEEP_CONTENT = true;
			let IN_PLACE = false;
			let USE_PROFILES = {};
			let FORBID_CONTENTS = null;
			const DEFAULT_FORBID_CONTENTS = addToSet({}, [
				"annotation-xml",
				"audio",
				"colgroup",
				"desc",
				"foreignobject",
				"head",
				"iframe",
				"math",
				"mi",
				"mn",
				"mo",
				"ms",
				"mtext",
				"noembed",
				"noframes",
				"noscript",
				"plaintext",
				"script",
				"style",
				"svg",
				"template",
				"thead",
				"title",
				"video",
				"xmp"
			]);
			let DATA_URI_TAGS = null;
			const DEFAULT_DATA_URI_TAGS = addToSet({}, [
				"audio",
				"video",
				"img",
				"source",
				"image",
				"track"
			]);
			let URI_SAFE_ATTRIBUTES = null;
			const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
				"alt",
				"class",
				"for",
				"id",
				"label",
				"name",
				"pattern",
				"placeholder",
				"role",
				"summary",
				"title",
				"value",
				"style",
				"xmlns"
			]);
			const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
			const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
			const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
			let NAMESPACE = HTML_NAMESPACE;
			let IS_EMPTY_INPUT = false;
			let ALLOWED_NAMESPACES = null;
			const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
				MATHML_NAMESPACE,
				SVG_NAMESPACE,
				HTML_NAMESPACE
			], stringToString);
			let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, [
				"mi",
				"mo",
				"mn",
				"ms",
				"mtext"
			]);
			let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
			const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
				"title",
				"style",
				"font",
				"a",
				"script"
			]);
			let PARSER_MEDIA_TYPE = null;
			const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
			const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
			let transformCaseFunc = null;
			let CONFIG = null;
			const formElement = document.createElement("form");
			const isRegexOrFunction = function isRegexOrFunction$1(testValue) {
				return testValue instanceof RegExp || testValue instanceof Function;
			};
			/**
			* _parseConfig
			*
			* @param cfg optional config literal
			*/
			const _parseConfig = function _parseConfig$1() {
				let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
				if (CONFIG && CONFIG === cfg) return;
				if (!cfg || typeof cfg !== "object") cfg = {};
				cfg = clone(cfg);
				PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
				transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
				ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
				ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
				ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
				URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
				DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
				FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
				FORBID_TAGS$1 = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : {};
				FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : {};
				USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
				ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
				ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
				ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
				ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
				SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
				SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
				WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
				RETURN_DOM = cfg.RETURN_DOM || false;
				RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
				RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
				FORCE_BODY = cfg.FORCE_BODY || false;
				SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
				SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
				KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
				IN_PLACE = cfg.IN_PLACE || false;
				IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
				NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
				MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
				HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
				CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
				if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
				if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
				if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
				if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
				if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
				if (USE_PROFILES) {
					ALLOWED_TAGS = addToSet({}, text);
					ALLOWED_ATTR = [];
					if (USE_PROFILES.html === true) {
						addToSet(ALLOWED_TAGS, html$1);
						addToSet(ALLOWED_ATTR, html);
					}
					if (USE_PROFILES.svg === true) {
						addToSet(ALLOWED_TAGS, svg$1);
						addToSet(ALLOWED_ATTR, svg);
						addToSet(ALLOWED_ATTR, xml);
					}
					if (USE_PROFILES.svgFilters === true) {
						addToSet(ALLOWED_TAGS, svgFilters);
						addToSet(ALLOWED_ATTR, svg);
						addToSet(ALLOWED_ATTR, xml);
					}
					if (USE_PROFILES.mathMl === true) {
						addToSet(ALLOWED_TAGS, mathMl$1);
						addToSet(ALLOWED_ATTR, mathMl);
						addToSet(ALLOWED_ATTR, xml);
					}
				}
				if (cfg.ADD_TAGS) {
					if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
					addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
				}
				if (cfg.ADD_ATTR) {
					if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
					addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
				}
				if (cfg.ADD_URI_SAFE_ATTR) addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
				if (cfg.FORBID_CONTENTS) {
					if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
					addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
				}
				if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
				if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
					"html",
					"head",
					"body"
				]);
				if (ALLOWED_TAGS.table) {
					addToSet(ALLOWED_TAGS, ["tbody"]);
					delete FORBID_TAGS$1.tbody;
				}
				if (cfg.TRUSTED_TYPES_POLICY) {
					if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
					if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
					trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
					emptyHTML = trustedTypesPolicy.createHTML("");
				} else {
					if (trustedTypesPolicy === undefined) trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
					if (trustedTypesPolicy !== null && typeof emptyHTML === "string") emptyHTML = trustedTypesPolicy.createHTML("");
				}
				if (freeze) freeze(cfg);
				CONFIG = cfg;
			};
			const ALL_SVG_TAGS = addToSet({}, [
				...svg$1,
				...svgFilters,
				...svgDisallowed
			]);
			const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
			/**
			* @param element a DOM element whose namespace is being checked
			* @returns Return false if the element has a
			*  namespace that a spec-compliant parser would never
			*  return. Return true otherwise.
			*/
			const _checkValidNamespace = function _checkValidNamespace$1(element) {
				let parent = getParentNode(element);
				if (!parent || !parent.tagName) parent = {
					namespaceURI: NAMESPACE,
					tagName: "template"
				};
				const tagName = stringToLowerCase(element.tagName);
				const parentTagName = stringToLowerCase(parent.tagName);
				if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
				if (element.namespaceURI === SVG_NAMESPACE) {
					if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
					if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
					return Boolean(ALL_SVG_TAGS[tagName]);
				}
				if (element.namespaceURI === MATHML_NAMESPACE) {
					if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
					if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
					return Boolean(ALL_MATHML_TAGS[tagName]);
				}
				if (element.namespaceURI === HTML_NAMESPACE) {
					if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
					if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
					return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
				}
				if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
				return false;
			};
			/**
			* _forceRemove
			*
			* @param node a DOM node
			*/
			const _forceRemove = function _forceRemove$1(node) {
				arrayPush(DOMPurify$1.removed, { element: node });
				try {
					getParentNode(node).removeChild(node);
				} catch (_) {
					remove(node);
				}
			};
			/**
			* _removeAttribute
			*
			* @param name an Attribute name
			* @param element a DOM node
			*/
			const _removeAttribute = function _removeAttribute$1(name, element) {
				try {
					arrayPush(DOMPurify$1.removed, {
						attribute: element.getAttributeNode(name),
						from: element
					});
				} catch (_) {
					arrayPush(DOMPurify$1.removed, {
						attribute: null,
						from: element
					});
				}
				element.removeAttribute(name);
				if (name === "is") if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
					_forceRemove(element);
				} catch (_) {}
else try {
					element.setAttribute(name, "");
				} catch (_) {}
			};
			/**
			* _initDocument
			*
			* @param dirty - a string of dirty markup
			* @return a DOM, filled with the dirty markup
			*/
			const _initDocument = function _initDocument$1(dirty) {
				let doc = null;
				let leadingWhitespace = null;
				if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
else {
					const matches = stringMatch(dirty, /^[\r\n\t ]+/);
					leadingWhitespace = matches && matches[0];
				}
				if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
				const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
				if (NAMESPACE === HTML_NAMESPACE) try {
					doc = new DOMParser$1().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
				} catch (_) {}
				if (!doc || !doc.documentElement) {
					doc = implementation.createDocument(NAMESPACE, "template", null);
					try {
						doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
					} catch (_) {}
				}
				const body = doc.body || doc.documentElement;
				if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
				if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
				return WHOLE_DOCUMENT ? doc.documentElement : body;
			};
			/**
			* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
			*
			* @param root The root element or node to start traversing on.
			* @return The created NodeIterator
			*/
			const _createNodeIterator = function _createNodeIterator$1(root) {
				return createNodeIterator.call(
					root.ownerDocument || root,
					root,
					// eslint-disable-next-line no-bitwise
					NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
					null
);
			};
			/**
			* _isClobbered
			*
			* @param element element to check for clobbering attacks
			* @return true if clobbered, false if safe
			*/
			const _isClobbered = function _isClobbered$1(element) {
				return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
			};
			/**
			* Checks whether the given object is a DOM node.
			*
			* @param value object to check whether it's a DOM node
			* @return true is object is a DOM node
			*/
			const _isNode = function _isNode$1(value) {
				return typeof Node === "function" && value instanceof Node;
			};
			function _executeHooks(hooks$1, currentNode, data) {
				arrayForEach(hooks$1, (hook) => {
					hook.call(DOMPurify$1, currentNode, data, CONFIG);
				});
			}
			/**
			* _sanitizeElements
			*
			* @protect nodeName
			* @protect textContent
			* @protect removeChild
			* @param currentNode to check for permission to exist
			* @return true if node was killed, false if left alive
			*/
			const _sanitizeElements = function _sanitizeElements$1(currentNode) {
				let content = null;
				_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
				if (_isClobbered(currentNode)) {
					_forceRemove(currentNode);
					return true;
				}
				const tagName = transformCaseFunc(currentNode.nodeName);
				_executeHooks(hooks.uponSanitizeElement, currentNode, {
					tagName,
					allowedTags: ALLOWED_TAGS
				});
				if (currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w]/g, currentNode.innerHTML) && regExpTest(/<[/\w]/g, currentNode.textContent)) {
					_forceRemove(currentNode);
					return true;
				}
				if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
					_forceRemove(currentNode);
					return true;
				}
				if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
					_forceRemove(currentNode);
					return true;
				}
				if (!ALLOWED_TAGS[tagName] || FORBID_TAGS$1[tagName]) {
					if (!FORBID_TAGS$1[tagName] && _isBasicCustomElement(tagName)) {
						if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
						if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) return false;
					}
					if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
						const parentNode = getParentNode(currentNode) || currentNode.parentNode;
						const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
						if (childNodes && parentNode) {
							const childCount = childNodes.length;
							for (let i = childCount - 1; i >= 0; --i) {
								const childClone = cloneNode(childNodes[i], true);
								childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
								parentNode.insertBefore(childClone, getNextSibling(currentNode));
							}
						}
					}
					_forceRemove(currentNode);
					return true;
				}
				if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
					_forceRemove(currentNode);
					return true;
				}
				if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
					_forceRemove(currentNode);
					return true;
				}
				if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
					content = currentNode.textContent;
					arrayForEach([
						MUSTACHE_EXPR$1,
						ERB_EXPR$1,
						TMPLIT_EXPR$1
					], (expr) => {
						content = stringReplace(content, expr, " ");
					});
					if (currentNode.textContent !== content) {
						arrayPush(DOMPurify$1.removed, { element: currentNode.cloneNode() });
						currentNode.textContent = content;
					}
				}
				_executeHooks(hooks.afterSanitizeElements, currentNode, null);
				return false;
			};
			/**
			* _isValidAttribute
			*
			* @param lcTag Lowercase tag name of containing element.
			* @param lcName Lowercase attribute name.
			* @param value Attribute value.
			* @return Returns true if `value` is valid, otherwise false.
			*/
			const _isValidAttribute = function _isValidAttribute$1(lcTag, lcName, value) {
				if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
				if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR$1, lcName));
else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName));
else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) if (_isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName)) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value)));
else return false;
else if (URI_SAFE_ATTRIBUTES[lcName]);
else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, "")));
else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]);
else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, "")));
else if (value) return false;
else;
				return true;
			};
			/**
			* _isBasicCustomElement
			* checks if at least one dash is included in tagName, and it's not the first char
			* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
			*
			* @param tagName name of the tag of the node to sanitize
			* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
			*/
			const _isBasicCustomElement = function _isBasicCustomElement$1(tagName) {
				return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT$1);
			};
			/**
			* _sanitizeAttributes
			*
			* @protect attributes
			* @protect nodeName
			* @protect removeAttribute
			* @protect setAttribute
			*
			* @param currentNode to sanitize
			*/
			const _sanitizeAttributes = function _sanitizeAttributes$1(currentNode) {
				_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
				const { attributes } = currentNode;
				if (!attributes || _isClobbered(currentNode)) return;
				const hookEvent = {
					attrName: "",
					attrValue: "",
					keepAttr: true,
					allowedAttributes: ALLOWED_ATTR,
					forceKeepAttr: undefined
				};
				let l = attributes.length;
				while (l--) {
					const attr = attributes[l];
					const { name, namespaceURI, value: attrValue } = attr;
					const lcName = transformCaseFunc(name);
					let value = name === "value" ? attrValue : stringTrim(attrValue);
					hookEvent.attrName = lcName;
					hookEvent.attrValue = value;
					hookEvent.keepAttr = true;
					hookEvent.forceKeepAttr = undefined;
					_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
					value = hookEvent.attrValue;
					if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
						_removeAttribute(name, currentNode);
						value = SANITIZE_NAMED_PROPS_PREFIX + value;
					}
					if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title)/i, value)) {
						_removeAttribute(name, currentNode);
						continue;
					}
					if (hookEvent.forceKeepAttr) continue;
					_removeAttribute(name, currentNode);
					if (!hookEvent.keepAttr) continue;
					if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
						_removeAttribute(name, currentNode);
						continue;
					}
					if (SAFE_FOR_TEMPLATES) arrayForEach([
						MUSTACHE_EXPR$1,
						ERB_EXPR$1,
						TMPLIT_EXPR$1
					], (expr) => {
						value = stringReplace(value, expr, " ");
					});
					const lcTag = transformCaseFunc(currentNode.nodeName);
					if (!_isValidAttribute(lcTag, lcName, value)) continue;
					if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") if (namespaceURI);
else switch (trustedTypes.getAttributeType(lcTag, lcName)) {
						case "TrustedHTML": {
							value = trustedTypesPolicy.createHTML(value);
							break;
						}
						case "TrustedScriptURL": {
							value = trustedTypesPolicy.createScriptURL(value);
							break;
						}
					}
					try {
						if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
else currentNode.setAttribute(name, value);
						if (_isClobbered(currentNode)) _forceRemove(currentNode);
else arrayPop(DOMPurify$1.removed);
					} catch (_) {}
				}
				_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
			};
			/**
			* _sanitizeShadowDOM
			*
			* @param fragment to iterate over recursively
			*/
			const _sanitizeShadowDOM = function _sanitizeShadowDOM$1(fragment) {
				let shadowNode = null;
				const shadowIterator = _createNodeIterator(fragment);
				_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
				while (shadowNode = shadowIterator.nextNode()) {
					_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
					_sanitizeElements(shadowNode);
					_sanitizeAttributes(shadowNode);
					if (shadowNode.content instanceof DocumentFragment) _sanitizeShadowDOM$1(shadowNode.content);
				}
				_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
			};
			DOMPurify$1.sanitize = function(dirty) {
				let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
				let body = null;
				let importedNode = null;
				let currentNode = null;
				let returnNode = null;
				IS_EMPTY_INPUT = !dirty;
				if (IS_EMPTY_INPUT) dirty = "<!-->";
				if (typeof dirty !== "string" && !_isNode(dirty)) if (typeof dirty.toString === "function") {
					dirty = dirty.toString();
					if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
				} else throw typeErrorCreate("toString is not a function");
				if (!DOMPurify$1.isSupported) return dirty;
				if (!SET_CONFIG) _parseConfig(cfg);
				DOMPurify$1.removed = [];
				if (typeof dirty === "string") IN_PLACE = false;
				if (IN_PLACE) {
					if (dirty.nodeName) {
						const tagName = transformCaseFunc(dirty.nodeName);
						if (!ALLOWED_TAGS[tagName] || FORBID_TAGS$1[tagName]) throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
					}
				} else if (dirty instanceof Node) {
					body = _initDocument("<!---->");
					importedNode = body.ownerDocument.importNode(dirty, true);
					if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
else if (importedNode.nodeName === "HTML") body = importedNode;
else body.appendChild(importedNode);
				} else {
					if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
					body = _initDocument(dirty);
					if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
				}
				if (body && FORCE_BODY) _forceRemove(body.firstChild);
				const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
				while (currentNode = nodeIterator.nextNode()) {
					_sanitizeElements(currentNode);
					_sanitizeAttributes(currentNode);
					if (currentNode.content instanceof DocumentFragment) _sanitizeShadowDOM(currentNode.content);
				}
				if (IN_PLACE) return dirty;
				if (RETURN_DOM) {
					if (RETURN_DOM_FRAGMENT) {
						returnNode = createDocumentFragment.call(body.ownerDocument);
						while (body.firstChild) returnNode.appendChild(body.firstChild);
					} else returnNode = body;
					if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
					return returnNode;
				}
				let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
				if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
				if (SAFE_FOR_TEMPLATES) arrayForEach([
					MUSTACHE_EXPR$1,
					ERB_EXPR$1,
					TMPLIT_EXPR$1
				], (expr) => {
					serializedHTML = stringReplace(serializedHTML, expr, " ");
				});
				return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
			};
			DOMPurify$1.setConfig = function() {
				let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
				_parseConfig(cfg);
				SET_CONFIG = true;
			};
			DOMPurify$1.clearConfig = function() {
				CONFIG = null;
				SET_CONFIG = false;
			};
			DOMPurify$1.isValidAttribute = function(tag, attr, value) {
				if (!CONFIG) _parseConfig({});
				const lcTag = transformCaseFunc(tag);
				const lcName = transformCaseFunc(attr);
				return _isValidAttribute(lcTag, lcName, value);
			};
			DOMPurify$1.addHook = function(entryPoint, hookFunction) {
				if (typeof hookFunction !== "function") return;
				arrayPush(hooks[entryPoint], hookFunction);
			};
			DOMPurify$1.removeHook = function(entryPoint, hookFunction) {
				if (hookFunction !== undefined) {
					const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
					return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
				}
				return arrayPop(hooks[entryPoint]);
			};
			DOMPurify$1.removeHooks = function(entryPoint) {
				hooks[entryPoint] = [];
			};
			DOMPurify$1.removeAllHooks = function() {
				hooks = _createHooksMap();
			};
			return DOMPurify$1;
		}
		var purify = createDOMPurify();
		return purify;
	});
} });

//#endregion
//#region src/common/misc/HtmlSanitizer.ts
var import_purify = __toESM(require_purify(), 1);
const PREVENT_EXTERNAL_IMAGE_LOADING_ICON = encodeSVG(ReplacementImage);
const EXTERNAL_CONTENT_ATTRS = Object.freeze([
	"src",
	"poster",
	"srcset",
	"background",
	"draft-src",
	"draft-srcset",
	"draft-xlink:href",
	"draft-href",
	"xlink:href",
	"href"
]);
const DRAFT_ATTRIBUTES = [
	"draft-src",
	"draft-srcset",
	"draft-xlink:href",
	"draft-href"
];
const DEFAULT_CONFIG_EXTRA = Object.freeze({
	blockExternalContent: true,
	allowRelativeLinks: false,
	usePlaceholderForInlineImages: true
});
/** Allowing additional HTML attributes */
const ADD_ATTR = Object.freeze([
	"target",
	"controls",
	"cid",
	"draft-src",
	"draft-srcset"
]);
/** These must be safe for URI-like values */
const ADD_URI_SAFE_ATTR = Object.freeze(["poster"]);
/** Complete disallow some HTML tags. */
const FORBID_TAGS = Object.freeze(["style"]);
/** restricts the allowed protocols to some standard ones + our tutatemplate protocol that allows the knowledge base to link to email templates. */
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|tutatemplate):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;
const HTML_CONFIG = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	ALLOWED_URI_REGEXP
});
const SVG_CONFIG = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	NAMESPACE: "http://www.w3.org/2000/svg"
});
const FRAGMENT_CONFIG = Object.freeze({
	ADD_ATTR: ADD_ATTR.slice(),
	ADD_URI_SAFE_ATTR: ADD_URI_SAFE_ATTR.slice(),
	FORBID_TAGS: FORBID_TAGS.slice(),
	RETURN_DOM_FRAGMENT: true,
	ALLOWED_URI_REGEXP
});
var HtmlSanitizer = class {
	externalContent;
	inlineImageCids;
	links;
	purifier;
	constructor() {
		if (import_purify.default.isSupported) {
			this.purifier = import_purify.default;
			this.purifier.addHook("afterSanitizeAttributes", this.afterSanitizeAttributes.bind(this));
		}
	}
	/**
	* Sanitizes the given html. Returns as HTML
	*/
	sanitizeHTML(html, configExtra) {
		const config = this.init(HTML_CONFIG, configExtra ?? {});
		const cleanHtml = this.purifier.sanitize(html, config);
		return {
			html: cleanHtml,
			blockedExternalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links
		};
	}
	/**
	* Sanitizes the given SVG. Returns as SVG
	*/
	sanitizeSVG(svg, configExtra) {
		const config = this.init(SVG_CONFIG, configExtra ?? {});
		const cleanSvg = this.purifier.sanitize(svg, config);
		return {
			html: cleanSvg,
			blockedExternalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links
		};
	}
	/**
	* inline images are attachments that are rendered as part of an <img> tag with a blob URL in the
	* mail body when it's displayed
	*
	* svg images can contain malicious code, so we need to sanitize them before we display them.
	* DOMPurify can do that, but can't handle the xml declaration at the start of well-formed svg documents.
	*
	* 1. parse the document as xml
	* 2. strip the declaration
	* 3. sanitize
	* 4. add the declaration back on
	*
	* NOTE: currently, we only allow UTF-8 inline SVG.
	* NOTE: SVG with incompatible encodings will be replaced with an empty file.
	*
	* @param dirtyFile the svg DataFile as received in the mail
	* @returns clean a sanitized svg document as a DataFile
	*/
	sanitizeInlineAttachment(dirtyFile) {
		if (dirtyFile.mimeType === "image/svg+xml") {
			let cleanedData = Uint8Array.from([]);
			try {
				const dirtySVG = utf8Uint8ArrayToString(dirtyFile.data);
				const parser = new DOMParser();
				const dirtyTree = parser.parseFromString(dirtySVG, "image/svg+xml");
				const errs = dirtyTree.getElementsByTagName("parsererror");
				if (errs.length === 0) {
					const svgElement = dirtyTree.getElementsByTagName("svg")[0];
					if (svgElement != null) {
						const config = this.init(SVG_CONFIG, {});
						const cleanText = this.purifier.sanitize(svgElement.outerHTML, config);
						cleanedData = stringToUtf8Uint8Array("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n" + cleanText);
					}
				} else console.log("svg sanitization failed, possibly due to wrong input encoding.");
			} catch (e) {
				console.log("svg sanitization failed");
			}
			dirtyFile.data = cleanedData;
		}
		return dirtyFile;
	}
	/**
	* Sanitizes given HTML. Returns a DocumentFragment instead of an HTML string
	*/
	sanitizeFragment(html, configExtra) {
		const config = this.init(FRAGMENT_CONFIG, configExtra ?? {});
		const cleanFragment = this.purifier.sanitize(html, config);
		return {
			fragment: cleanFragment,
			blockedExternalContent: this.externalContent,
			inlineImageCids: this.inlineImageCids,
			links: this.links
		};
	}
	init(config, configExtra) {
		this.externalContent = 0;
		this.inlineImageCids = [];
		this.links = [];
		return Object.assign({}, config, DEFAULT_CONFIG_EXTRA, configExtra);
	}
	afterSanitizeAttributes(currentNode, data, config) {
		const typedConfig = config;
		let allowedClasses = [
			"tutanota_indented",
			"tutanota_quote",
			"MsoListParagraph",
			"MsoListParagraphCxSpFirst",
			"MsoListParagraphCxSpMiddle",
			"MsoListParagraphCxSpLast"
		];
		if (currentNode.classList) {
			let cl = currentNode.classList;
			for (let i = cl.length - 1; i >= 0; i--) {
				const item = cl.item(i);
				if (item && allowedClasses.indexOf(item) === -1) cl.remove(item);
			}
		}
		this.replaceAttributes(currentNode, typedConfig);
		this.processLink(currentNode, typedConfig);
		return currentNode;
	}
	replaceAttributes(htmlNode, config) {
		if (htmlNode.tagName === "IMG") htmlNode.style.maxWidth = "100%";
		if (htmlNode.attributes) this.replaceAttributeValue(htmlNode, config);
		if (htmlNode.style) {
			if (config.blockExternalContent) {
				if (htmlNode.style.backgroundImage) {
					this.replaceStyleImage(htmlNode, "backgroundImage", false);
					htmlNode.style.backgroundRepeat = "no-repeat";
				}
				if (htmlNode.style.listStyleImage) this.replaceStyleImage(htmlNode, "listStyleImage", true);
				if (htmlNode.style.content) this.replaceStyleImage(htmlNode, "content", true);
				if (htmlNode.style.cursor) this.removeStyleImage(htmlNode, "cursor");
				if (htmlNode.style.filter) this.removeStyleImage(htmlNode, "filter");
				if (htmlNode.style.borderImageSource) this.removeStyleImage(htmlNode, "border-image-source");
				if (htmlNode.style.maskImage || htmlNode.style.webkitMaskImage) {
					this.removeStyleImage(htmlNode, "mask-image");
					this.removeStyleImage(htmlNode, "-webkit-mask-image");
				}
				if (htmlNode.style.shapeOutside) this.removeStyleImage(htmlNode, "shape-outside");
			}
			if (htmlNode.style.position) htmlNode.style.removeProperty("position");
		}
	}
	replaceAttributeValue(htmlNode, config) {
		const nodeName = htmlNode.tagName.toLowerCase();
		for (const attrName of EXTERNAL_CONTENT_ATTRS) {
			let attribute = htmlNode.attributes.getNamedItem(attrName);
			if (attribute) {
				if (config.usePlaceholderForInlineImages && attribute.value.startsWith("cid:")) {
					const cid = attribute.value.substring(4);
					this.inlineImageCids.push(cid);
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON;
					htmlNode.setAttribute("cid", cid);
					htmlNode.classList.add("tutanota-placeholder");
				} else if (config.blockExternalContent && attribute.name === "srcset") {
					this.externalContent++;
					htmlNode.setAttribute("draft-srcset", attribute.value);
					htmlNode.removeAttribute("srcset");
					htmlNode.setAttribute("src", PREVENT_EXTERNAL_IMAGE_LOADING_ICON);
					htmlNode.style.maxWidth = "100px";
				} else if (config.blockExternalContent && !attribute.value.startsWith("data:") && !attribute.value.startsWith("cid:") && !attribute.name.startsWith("draft-") && !(nodeName === "a") && !(nodeName === "area") && !(nodeName === "base") && !(nodeName === "link")) {
					this.externalContent++;
					htmlNode.setAttribute("draft-" + attribute.name, attribute.value);
					attribute.value = PREVENT_EXTERNAL_IMAGE_LOADING_ICON;
					htmlNode.attributes.setNamedItem(attribute);
					htmlNode.style.maxWidth = "100px";
				} else if (!config.blockExternalContent && DRAFT_ATTRIBUTES.includes(attribute.name)) if (attribute.name === "draft-src") {
					htmlNode.setAttribute("src", attribute.value);
					htmlNode.removeAttribute(attribute.name);
				} else if (attribute.name === "draft-href" || attribute.name === "draft-xlink:href") {
					const hrefTag = attribute.name === "draft-href" ? "href" : "xlink:href";
					htmlNode.setAttribute(hrefTag, attribute.value);
					htmlNode.removeAttribute(attribute.name);
				} else {
					htmlNode.setAttribute("srcset", attribute.value);
					htmlNode.removeAttribute(attribute.name);
				}
			}
		}
	}
	/** NB! {@param cssStyleAttributeName} is a *CSS* name ("border-image-source" as opposed to "borderImageSource"). */
	removeStyleImage(htmlNode, cssStyleAttributeName) {
		let value = htmlNode.style.getPropertyValue(cssStyleAttributeName);
		if (value.match(/url\(/)) {
			this.externalContent++;
			htmlNode.style.removeProperty(cssStyleAttributeName);
		}
	}
	/** {@param styleAttributeName} is a JS name for the style */
	replaceStyleImage(htmlNode, styleAttributeName, limitWidth) {
		let value = htmlNode.style[styleAttributeName];
		if (value.includes("url(") && value.match(/url\(/g)?.length !== value.match(/url\(["']?data:/g)?.length) {
			this.externalContent++;
			htmlNode.style[styleAttributeName] = `url("${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}")`;
			if (limitWidth) htmlNode.style.maxWidth = "100px";
		}
	}
	processLink(currentNode, config) {
		if (currentNode.tagName && (currentNode.tagName.toLowerCase() === "a" || currentNode.tagName.toLowerCase() === "area" || currentNode.tagName.toLowerCase() === "form")) {
			const href = currentNode.getAttribute("href");
			if (href) this.links.push(currentNode);
			if (config.allowRelativeLinks || !href || isAllowedLink(href)) {
				currentNode.setAttribute("rel", "noopener noreferrer");
				currentNode.setAttribute("target", "_blank");
			} else if (href.trim() === "{link}") {
				downcast(currentNode).href = "{link}";
				currentNode.setAttribute("rel", "noopener noreferrer");
				currentNode.setAttribute("target", "_blank");
			} else {
				console.log("Relative/invalid URL", currentNode, href);
				downcast(currentNode).href = "javascript:void(0)";
			}
		}
	}
};
function isAllowedLink(link) {
	try {
		return new URL(link).protocol !== "file:";
	} catch (e) {
		return false;
	}
}
const htmlSanitizer = new HtmlSanitizer();

//#endregion
export { HtmlSanitizer, PREVENT_EXTERNAL_IMAGE_LOADING_ICON, htmlSanitizer };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHRtbFNhbml0aXplci1jaHVuay5qcyIsIm5hbWVzIjpbImZyZWV6ZSIsInNlYWwiLCJhcHBseSIsImNvbnN0cnVjdCIsImdldEdsb2JhbCIsIl9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kiLCJodG1sIiwiX2NyZWF0ZUhvb2tzTWFwIiwid2luZG93IiwiRE9NUHVyaWZ5IiwiRk9SQklEX1RBR1MiLCJpc1JlZ2V4T3JGdW5jdGlvbiIsIl9wYXJzZUNvbmZpZyIsIl9jaGVja1ZhbGlkTmFtZXNwYWNlIiwiX2ZvcmNlUmVtb3ZlIiwiX3JlbW92ZUF0dHJpYnV0ZSIsIl9pbml0RG9jdW1lbnQiLCJET01QYXJzZXIiLCJfY3JlYXRlTm9kZUl0ZXJhdG9yIiwiX2lzQ2xvYmJlcmVkIiwiX2lzTm9kZSIsImhvb2tzIiwiX3Nhbml0aXplRWxlbWVudHMiLCJNVVNUQUNIRV9FWFBSIiwiRVJCX0VYUFIiLCJUTVBMSVRfRVhQUiIsIl9pc1ZhbGlkQXR0cmlidXRlIiwiREFUQV9BVFRSIiwiQVJJQV9BVFRSIiwiQVRUUl9XSElURVNQQUNFIiwiSVNfU0NSSVBUX09SX0RBVEEiLCJfaXNCYXNpY0N1c3RvbUVsZW1lbnQiLCJDVVNUT01fRUxFTUVOVCIsIl9zYW5pdGl6ZUF0dHJpYnV0ZXMiLCJfc2FuaXRpemVTaGFkb3dET00iLCJQUkVWRU5UX0VYVEVSTkFMX0lNQUdFX0xPQURJTkdfSUNPTjogc3RyaW5nIiwiREVGQVVMVF9DT05GSUdfRVhUUkE6IFNhbml0aXplQ29uZmlnRXh0cmEiLCJIVE1MX0NPTkZJRzogQ29uZmlnICYgeyBSRVRVUk5fRE9NX0ZSQUdNRU5UPzogdW5kZWZpbmVkOyBSRVRVUk5fRE9NPzogdW5kZWZpbmVkIH0iLCJTVkdfQ09ORklHOiBDb25maWcgJiB7IFJFVFVSTl9ET01fRlJBR01FTlQ/OiB1bmRlZmluZWQ7IFJFVFVSTl9ET00/OiB1bmRlZmluZWQgfSIsIkZSQUdNRU5UX0NPTkZJRzogQ29uZmlnICYgeyBSRVRVUk5fRE9NX0ZSQUdNRU5UOiB0cnVlIH0iLCJET01QdXJpZnkiLCJodG1sOiBzdHJpbmciLCJjb25maWdFeHRyYT86IFBhcnRpYWw8U2FuaXRpemVDb25maWdFeHRyYT4iLCJzdmc6IHN0cmluZyIsImRpcnR5RmlsZTogRGF0YUZpbGUiLCJjb25maWc6IFQiLCJjb25maWdFeHRyYTogUGFydGlhbDxTYW5pdGl6ZUNvbmZpZ0V4dHJhPiIsImN1cnJlbnROb2RlOiBFbGVtZW50IiwiZGF0YTogbnVsbCIsImNvbmZpZzogQ29uZmlnIiwiaHRtbE5vZGU6IEhUTUxFbGVtZW50IiwiY29uZmlnOiBTYW5pdGl6ZUNvbmZpZyIsImNzc1N0eWxlQXR0cmlidXRlTmFtZTogc3RyaW5nIiwic3R5bGVBdHRyaWJ1dGVOYW1lOiBzdHJpbmciLCJsaW1pdFdpZHRoOiBib29sZWFuIiwidmFsdWU6IHN0cmluZyIsImN1cnJlbnROb2RlOiBIVE1MRWxlbWVudCIsImxpbms6IHN0cmluZyIsImh0bWxTYW5pdGl6ZXI6IEh0bWxTYW5pdGl6ZXIiXSwic291cmNlcyI6WyIuLi9saWJzL3B1cmlmeS5qcyIsIi4uL3NyYy9jb21tb24vbWlzYy9IdG1sU2FuaXRpemVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISBAbGljZW5zZSBET01QdXJpZnkgMy4yLjQgfCAoYykgQ3VyZTUzIGFuZCBvdGhlciBjb250cmlidXRvcnMgfCBSZWxlYXNlZCB1bmRlciB0aGUgQXBhY2hlIGxpY2Vuc2UgMi4wIGFuZCBNb3ppbGxhIFB1YmxpYyBMaWNlbnNlIDIuMCB8IGdpdGh1Yi5jb20vY3VyZTUzL0RPTVB1cmlmeS9ibG9iLzMuMi40L0xJQ0VOU0UgKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAoZ2xvYmFsID0gdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcyA6IGdsb2JhbCB8fCBzZWxmLCBnbG9iYWwuRE9NUHVyaWZ5ID0gZmFjdG9yeSgpKTtcbn0pKHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICBjb25zdCB7XG4gICAgZW50cmllcyxcbiAgICBzZXRQcm90b3R5cGVPZixcbiAgICBpc0Zyb3plbixcbiAgICBnZXRQcm90b3R5cGVPZixcbiAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JcbiAgfSA9IE9iamVjdDtcbiAgbGV0IHtcbiAgICBmcmVlemUsXG4gICAgc2VhbCxcbiAgICBjcmVhdGVcbiAgfSA9IE9iamVjdDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tbXV0YWJsZS1leHBvcnRzXG4gIGxldCB7XG4gICAgYXBwbHksXG4gICAgY29uc3RydWN0XG4gIH0gPSB0eXBlb2YgUmVmbGVjdCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVmbGVjdDtcbiAgaWYgKCFmcmVlemUpIHtcbiAgICBmcmVlemUgPSBmdW5jdGlvbiBmcmVlemUoeCkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgfVxuICBpZiAoIXNlYWwpIHtcbiAgICBzZWFsID0gZnVuY3Rpb24gc2VhbCh4KSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9O1xuICB9XG4gIGlmICghYXBwbHkpIHtcbiAgICBhcHBseSA9IGZ1bmN0aW9uIGFwcGx5KGZ1biwgdGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICByZXR1cm4gZnVuLmFwcGx5KHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgfTtcbiAgfVxuICBpZiAoIWNvbnN0cnVjdCkge1xuICAgIGNvbnN0cnVjdCA9IGZ1bmN0aW9uIGNvbnN0cnVjdChGdW5jLCBhcmdzKSB7XG4gICAgICByZXR1cm4gbmV3IEZ1bmMoLi4uYXJncyk7XG4gICAgfTtcbiAgfVxuICBjb25zdCBhcnJheUZvckVhY2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKTtcbiAgY29uc3QgYXJyYXlMYXN0SW5kZXhPZiA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mKTtcbiAgY29uc3QgYXJyYXlQb3AgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wb3ApO1xuICBjb25zdCBhcnJheVB1c2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbiAgY29uc3QgYXJyYXlTcGxpY2UgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xuICBjb25zdCBzdHJpbmdUb0xvd2VyQ2FzZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50b0xvd2VyQ2FzZSk7XG4gIGNvbnN0IHN0cmluZ1RvU3RyaW5nID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nKTtcbiAgY29uc3Qgc3RyaW5nTWF0Y2ggPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUubWF0Y2gpO1xuICBjb25zdCBzdHJpbmdSZXBsYWNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnJlcGxhY2UpO1xuICBjb25zdCBzdHJpbmdJbmRleE9mID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLmluZGV4T2YpO1xuICBjb25zdCBzdHJpbmdUcmltID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRyaW0pO1xuICBjb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuYXBwbHkoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG4gIGNvbnN0IHJlZ0V4cFRlc3QgPSB1bmFwcGx5KFJlZ0V4cC5wcm90b3R5cGUudGVzdCk7XG4gIGNvbnN0IHR5cGVFcnJvckNyZWF0ZSA9IHVuY29uc3RydWN0KFR5cGVFcnJvcik7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGFuZCBjYWxsZWQuXG4gICAqIEByZXR1cm5zIEEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICAgKi9cbiAgZnVuY3Rpb24gdW5hcHBseShmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzQXJnKSB7XG4gICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpO1xuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBmdW5jIC0gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGJlIHdyYXBwZWQgYW5kIGNhbGxlZC5cbiAgICogQHJldHVybnMgQSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gICAqL1xuICBmdW5jdGlvbiB1bmNvbnN0cnVjdChmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICB9XG4gICAgICByZXR1cm4gY29uc3RydWN0KGZ1bmMsIGFyZ3MpO1xuICAgIH07XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBwcm9wZXJ0aWVzIHRvIGEgbG9va3VwIHRhYmxlXG4gICAqXG4gICAqIEBwYXJhbSBzZXQgLSBUaGUgc2V0IHRvIHdoaWNoIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIGVsZW1lbnRzIHRvIGJlIGFkZGVkIHRvIHRoZSBzZXQuXG4gICAqIEBwYXJhbSB0cmFuc2Zvcm1DYXNlRnVuYyAtIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSB0aGUgY2FzZSBvZiBlYWNoIGVsZW1lbnQgYmVmb3JlIGFkZGluZyB0byB0aGUgc2V0LlxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgc2V0IHdpdGggYWRkZWQgZWxlbWVudHMuXG4gICAqL1xuICBmdW5jdGlvbiBhZGRUb1NldChzZXQsIGFycmF5KSB7XG4gICAgbGV0IHRyYW5zZm9ybUNhc2VGdW5jID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgICBpZiAoc2V0UHJvdG90eXBlT2YpIHtcbiAgICAgIC8vIE1ha2UgJ2luJyBhbmQgdHJ1dGh5IGNoZWNrcyBsaWtlIEJvb2xlYW4oc2V0LmNvbnN0cnVjdG9yKVxuICAgICAgLy8gaW5kZXBlbmRlbnQgb2YgYW55IHByb3BlcnRpZXMgZGVmaW5lZCBvbiBPYmplY3QucHJvdG90eXBlLlxuICAgICAgLy8gUHJldmVudCBwcm90b3R5cGUgc2V0dGVycyBmcm9tIGludGVyY2VwdGluZyBzZXQgYXMgYSB0aGlzIHZhbHVlLlxuICAgICAgc2V0UHJvdG90eXBlT2Yoc2V0LCBudWxsKTtcbiAgICB9XG4gICAgbGV0IGwgPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgbGV0IGVsZW1lbnQgPSBhcnJheVtsXTtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbGNFbGVtZW50ID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZWxlbWVudCk7XG4gICAgICAgIGlmIChsY0VsZW1lbnQgIT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBDb25maWcgcHJlc2V0cyAoZS5nLiB0YWdzLmpzLCBhdHRycy5qcykgYXJlIGltbXV0YWJsZS5cbiAgICAgICAgICBpZiAoIWlzRnJvemVuKGFycmF5KSkge1xuICAgICAgICAgICAgYXJyYXlbbF0gPSBsY0VsZW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsZW1lbnQgPSBsY0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldFtlbGVtZW50XSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBzZXQ7XG4gIH1cbiAgLyoqXG4gICAqIENsZWFuIHVwIGFuIGFycmF5IHRvIGhhcmRlbiBhZ2FpbnN0IENTUFBcbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IHRvIGJlIGNsZWFuZWQuXG4gICAqIEByZXR1cm5zIFRoZSBjbGVhbmVkIHZlcnNpb24gb2YgdGhlIGFycmF5XG4gICAqL1xuICBmdW5jdGlvbiBjbGVhbkFycmF5KGFycmF5KSB7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGFycmF5Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgaXNQcm9wZXJ0eUV4aXN0ID0gb2JqZWN0SGFzT3duUHJvcGVydHkoYXJyYXksIGluZGV4KTtcbiAgICAgIGlmICghaXNQcm9wZXJ0eUV4aXN0KSB7XG4gICAgICAgIGFycmF5W2luZGV4XSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfVxuICAvKipcbiAgICogU2hhbGxvdyBjbG9uZSBhbiBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gYmUgY2xvbmVkLlxuICAgKiBAcmV0dXJucyBBIG5ldyBvYmplY3QgdGhhdCBjb3BpZXMgdGhlIG9yaWdpbmFsLlxuICAgKi9cbiAgZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gICAgY29uc3QgbmV3T2JqZWN0ID0gY3JlYXRlKG51bGwpO1xuICAgIGZvciAoY29uc3QgW3Byb3BlcnR5LCB2YWx1ZV0gb2YgZW50cmllcyhvYmplY3QpKSB7XG4gICAgICBjb25zdCBpc1Byb3BlcnR5RXhpc3QgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KTtcbiAgICAgIGlmIChpc1Byb3BlcnR5RXhpc3QpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IGNsZWFuQXJyYXkodmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBjbG9uZSh2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXdPYmplY3Q7XG4gIH1cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGF1dG9tYXRpY2FsbHkgY2hlY2tzIGlmIHRoZSBwcm9wIGlzIGZ1bmN0aW9uIG9yIGdldHRlciBhbmQgYmVoYXZlcyBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gbG9vayB1cCB0aGUgZ2V0dGVyIGZ1bmN0aW9uIGluIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gICAqIEBwYXJhbSBwcm9wIC0gVGhlIHByb3BlcnR5IG5hbWUgZm9yIHdoaWNoIHRvIGZpbmQgdGhlIGdldHRlciBmdW5jdGlvbi5cbiAgICogQHJldHVybnMgVGhlIGdldHRlciBmdW5jdGlvbiBmb3VuZCBpbiB0aGUgcHJvdG90eXBlIGNoYWluIG9yIGEgZmFsbGJhY2sgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBsb29rdXBHZXR0ZXIob2JqZWN0LCBwcm9wKSB7XG4gICAgd2hpbGUgKG9iamVjdCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3ApO1xuICAgICAgaWYgKGRlc2MpIHtcbiAgICAgICAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy5nZXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZGVzYy52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJldHVybiB1bmFwcGx5KGRlc2MudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvYmplY3QgPSBnZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmYWxsYmFja1ZhbHVlKCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBmYWxsYmFja1ZhbHVlO1xuICB9XG5cbiAgY29uc3QgaHRtbCQxID0gZnJlZXplKFsnYScsICdhYmJyJywgJ2Fjcm9ueW0nLCAnYWRkcmVzcycsICdhcmVhJywgJ2FydGljbGUnLCAnYXNpZGUnLCAnYXVkaW8nLCAnYicsICdiZGknLCAnYmRvJywgJ2JpZycsICdibGluaycsICdibG9ja3F1b3RlJywgJ2JvZHknLCAnYnInLCAnYnV0dG9uJywgJ2NhbnZhcycsICdjYXB0aW9uJywgJ2NlbnRlcicsICdjaXRlJywgJ2NvZGUnLCAnY29sJywgJ2NvbGdyb3VwJywgJ2NvbnRlbnQnLCAnZGF0YScsICdkYXRhbGlzdCcsICdkZCcsICdkZWNvcmF0b3InLCAnZGVsJywgJ2RldGFpbHMnLCAnZGZuJywgJ2RpYWxvZycsICdkaXInLCAnZGl2JywgJ2RsJywgJ2R0JywgJ2VsZW1lbnQnLCAnZW0nLCAnZmllbGRzZXQnLCAnZmlnY2FwdGlvbicsICdmaWd1cmUnLCAnZm9udCcsICdmb290ZXInLCAnZm9ybScsICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNicsICdoZWFkJywgJ2hlYWRlcicsICdoZ3JvdXAnLCAnaHInLCAnaHRtbCcsICdpJywgJ2ltZycsICdpbnB1dCcsICdpbnMnLCAna2JkJywgJ2xhYmVsJywgJ2xlZ2VuZCcsICdsaScsICdtYWluJywgJ21hcCcsICdtYXJrJywgJ21hcnF1ZWUnLCAnbWVudScsICdtZW51aXRlbScsICdtZXRlcicsICduYXYnLCAnbm9icicsICdvbCcsICdvcHRncm91cCcsICdvcHRpb24nLCAnb3V0cHV0JywgJ3AnLCAncGljdHVyZScsICdwcmUnLCAncHJvZ3Jlc3MnLCAncScsICdycCcsICdydCcsICdydWJ5JywgJ3MnLCAnc2FtcCcsICdzZWN0aW9uJywgJ3NlbGVjdCcsICdzaGFkb3cnLCAnc21hbGwnLCAnc291cmNlJywgJ3NwYWNlcicsICdzcGFuJywgJ3N0cmlrZScsICdzdHJvbmcnLCAnc3R5bGUnLCAnc3ViJywgJ3N1bW1hcnknLCAnc3VwJywgJ3RhYmxlJywgJ3Rib2R5JywgJ3RkJywgJ3RlbXBsYXRlJywgJ3RleHRhcmVhJywgJ3Rmb290JywgJ3RoJywgJ3RoZWFkJywgJ3RpbWUnLCAndHInLCAndHJhY2snLCAndHQnLCAndScsICd1bCcsICd2YXInLCAndmlkZW8nLCAnd2JyJ10pO1xuICBjb25zdCBzdmckMSA9IGZyZWV6ZShbJ3N2ZycsICdhJywgJ2FsdGdseXBoJywgJ2FsdGdseXBoZGVmJywgJ2FsdGdseXBoaXRlbScsICdhbmltYXRlY29sb3InLCAnYW5pbWF0ZW1vdGlvbicsICdhbmltYXRldHJhbnNmb3JtJywgJ2NpcmNsZScsICdjbGlwcGF0aCcsICdkZWZzJywgJ2Rlc2MnLCAnZWxsaXBzZScsICdmaWx0ZXInLCAnZm9udCcsICdnJywgJ2dseXBoJywgJ2dseXBocmVmJywgJ2hrZXJuJywgJ2ltYWdlJywgJ2xpbmUnLCAnbGluZWFyZ3JhZGllbnQnLCAnbWFya2VyJywgJ21hc2snLCAnbWV0YWRhdGEnLCAnbXBhdGgnLCAncGF0aCcsICdwYXR0ZXJuJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmFkaWFsZ3JhZGllbnQnLCAncmVjdCcsICdzdG9wJywgJ3N0eWxlJywgJ3N3aXRjaCcsICdzeW1ib2wnLCAndGV4dCcsICd0ZXh0cGF0aCcsICd0aXRsZScsICd0cmVmJywgJ3RzcGFuJywgJ3ZpZXcnLCAndmtlcm4nXSk7XG4gIGNvbnN0IHN2Z0ZpbHRlcnMgPSBmcmVlemUoWydmZUJsZW5kJywgJ2ZlQ29sb3JNYXRyaXgnLCAnZmVDb21wb25lbnRUcmFuc2ZlcicsICdmZUNvbXBvc2l0ZScsICdmZUNvbnZvbHZlTWF0cml4JywgJ2ZlRGlmZnVzZUxpZ2h0aW5nJywgJ2ZlRGlzcGxhY2VtZW50TWFwJywgJ2ZlRGlzdGFudExpZ2h0JywgJ2ZlRHJvcFNoYWRvdycsICdmZUZsb29kJywgJ2ZlRnVuY0EnLCAnZmVGdW5jQicsICdmZUZ1bmNHJywgJ2ZlRnVuY1InLCAnZmVHYXVzc2lhbkJsdXInLCAnZmVJbWFnZScsICdmZU1lcmdlJywgJ2ZlTWVyZ2VOb2RlJywgJ2ZlTW9ycGhvbG9neScsICdmZU9mZnNldCcsICdmZVBvaW50TGlnaHQnLCAnZmVTcGVjdWxhckxpZ2h0aW5nJywgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsICdmZVR1cmJ1bGVuY2UnXSk7XG4gIC8vIExpc3Qgb2YgU1ZHIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FsbG93ZWQgYnkgZGVmYXVsdC5cbiAgLy8gV2Ugc3RpbGwgbmVlZCB0byBrbm93IHRoZW0gc28gdGhhdCB3ZSBjYW4gZG8gbmFtZXNwYWNlXG4gIC8vIGNoZWNrcyBwcm9wZXJseSBpbiBjYXNlIG9uZSB3YW50cyB0byBhZGQgdGhlbSB0b1xuICAvLyBhbGxvdy1saXN0LlxuICBjb25zdCBzdmdEaXNhbGxvd2VkID0gZnJlZXplKFsnYW5pbWF0ZScsICdjb2xvci1wcm9maWxlJywgJ2N1cnNvcicsICdkaXNjYXJkJywgJ2ZvbnQtZmFjZScsICdmb250LWZhY2UtZm9ybWF0JywgJ2ZvbnQtZmFjZS1uYW1lJywgJ2ZvbnQtZmFjZS1zcmMnLCAnZm9udC1mYWNlLXVyaScsICdmb3JlaWdub2JqZWN0JywgJ2hhdGNoJywgJ2hhdGNocGF0aCcsICdtZXNoJywgJ21lc2hncmFkaWVudCcsICdtZXNocGF0Y2gnLCAnbWVzaHJvdycsICdtaXNzaW5nLWdseXBoJywgJ3NjcmlwdCcsICdzZXQnLCAnc29saWRjb2xvcicsICd1bmtub3duJywgJ3VzZSddKTtcbiAgY29uc3QgbWF0aE1sJDEgPSBmcmVlemUoWydtYXRoJywgJ21lbmNsb3NlJywgJ21lcnJvcicsICdtZmVuY2VkJywgJ21mcmFjJywgJ21nbHlwaCcsICdtaScsICdtbGFiZWxlZHRyJywgJ21tdWx0aXNjcmlwdHMnLCAnbW4nLCAnbW8nLCAnbW92ZXInLCAnbXBhZGRlZCcsICdtcGhhbnRvbScsICdtcm9vdCcsICdtcm93JywgJ21zJywgJ21zcGFjZScsICdtc3FydCcsICdtc3R5bGUnLCAnbXN1YicsICdtc3VwJywgJ21zdWJzdXAnLCAnbXRhYmxlJywgJ210ZCcsICdtdGV4dCcsICdtdHInLCAnbXVuZGVyJywgJ211bmRlcm92ZXInLCAnbXByZXNjcmlwdHMnXSk7XG4gIC8vIFNpbWlsYXJseSB0byBTVkcsIHdlIHdhbnQgdG8ga25vdyBhbGwgTWF0aE1MIGVsZW1lbnRzLFxuICAvLyBldmVuIHRob3NlIHRoYXQgd2UgZGlzYWxsb3cgYnkgZGVmYXVsdC5cbiAgY29uc3QgbWF0aE1sRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ21hY3Rpb24nLCAnbWFsaWduZ3JvdXAnLCAnbWFsaWdubWFyaycsICdtbG9uZ2RpdicsICdtc2NhcnJpZXMnLCAnbXNjYXJyeScsICdtc2dyb3VwJywgJ21zdGFjaycsICdtc2xpbmUnLCAnbXNyb3cnLCAnc2VtYW50aWNzJywgJ2Fubm90YXRpb24nLCAnYW5ub3RhdGlvbi14bWwnLCAnbXByZXNjcmlwdHMnLCAnbm9uZSddKTtcbiAgY29uc3QgdGV4dCA9IGZyZWV6ZShbJyN0ZXh0J10pO1xuXG4gIGNvbnN0IGh0bWwgPSBmcmVlemUoWydhY2NlcHQnLCAnYWN0aW9uJywgJ2FsaWduJywgJ2FsdCcsICdhdXRvY2FwaXRhbGl6ZScsICdhdXRvY29tcGxldGUnLCAnYXV0b3BpY3R1cmVpbnBpY3R1cmUnLCAnYXV0b3BsYXknLCAnYmFja2dyb3VuZCcsICdiZ2NvbG9yJywgJ2JvcmRlcicsICdjYXB0dXJlJywgJ2NlbGxwYWRkaW5nJywgJ2NlbGxzcGFjaW5nJywgJ2NoZWNrZWQnLCAnY2l0ZScsICdjbGFzcycsICdjbGVhcicsICdjb2xvcicsICdjb2xzJywgJ2NvbHNwYW4nLCAnY29udHJvbHMnLCAnY29udHJvbHNsaXN0JywgJ2Nvb3JkcycsICdjcm9zc29yaWdpbicsICdkYXRldGltZScsICdkZWNvZGluZycsICdkZWZhdWx0JywgJ2RpcicsICdkaXNhYmxlZCcsICdkaXNhYmxlcGljdHVyZWlucGljdHVyZScsICdkaXNhYmxlcmVtb3RlcGxheWJhY2snLCAnZG93bmxvYWQnLCAnZHJhZ2dhYmxlJywgJ2VuY3R5cGUnLCAnZW50ZXJrZXloaW50JywgJ2ZhY2UnLCAnZm9yJywgJ2hlYWRlcnMnLCAnaGVpZ2h0JywgJ2hpZGRlbicsICdoaWdoJywgJ2hyZWYnLCAnaHJlZmxhbmcnLCAnaWQnLCAnaW5wdXRtb2RlJywgJ2ludGVncml0eScsICdpc21hcCcsICdraW5kJywgJ2xhYmVsJywgJ2xhbmcnLCAnbGlzdCcsICdsb2FkaW5nJywgJ2xvb3AnLCAnbG93JywgJ21heCcsICdtYXhsZW5ndGgnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21pbicsICdtaW5sZW5ndGgnLCAnbXVsdGlwbGUnLCAnbXV0ZWQnLCAnbmFtZScsICdub25jZScsICdub3NoYWRlJywgJ25vdmFsaWRhdGUnLCAnbm93cmFwJywgJ29wZW4nLCAnb3B0aW11bScsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3BsYXlzaW5saW5lJywgJ3BvcG92ZXInLCAncG9wb3ZlcnRhcmdldCcsICdwb3BvdmVydGFyZ2V0YWN0aW9uJywgJ3Bvc3RlcicsICdwcmVsb2FkJywgJ3B1YmRhdGUnLCAncmFkaW9ncm91cCcsICdyZWFkb25seScsICdyZWwnLCAncmVxdWlyZWQnLCAncmV2JywgJ3JldmVyc2VkJywgJ3JvbGUnLCAncm93cycsICdyb3dzcGFuJywgJ3NwZWxsY2hlY2snLCAnc2NvcGUnLCAnc2VsZWN0ZWQnLCAnc2hhcGUnLCAnc2l6ZScsICdzaXplcycsICdzcGFuJywgJ3NyY2xhbmcnLCAnc3RhcnQnLCAnc3JjJywgJ3NyY3NldCcsICdzdGVwJywgJ3N0eWxlJywgJ3N1bW1hcnknLCAndGFiaW5kZXgnLCAndGl0bGUnLCAndHJhbnNsYXRlJywgJ3R5cGUnLCAndXNlbWFwJywgJ3ZhbGlnbicsICd2YWx1ZScsICd3aWR0aCcsICd3cmFwJywgJ3htbG5zJywgJ3Nsb3QnXSk7XG4gIGNvbnN0IHN2ZyA9IGZyZWV6ZShbJ2FjY2VudC1oZWlnaHQnLCAnYWNjdW11bGF0ZScsICdhZGRpdGl2ZScsICdhbGlnbm1lbnQtYmFzZWxpbmUnLCAnYW1wbGl0dWRlJywgJ2FzY2VudCcsICdhdHRyaWJ1dGVuYW1lJywgJ2F0dHJpYnV0ZXR5cGUnLCAnYXppbXV0aCcsICdiYXNlZnJlcXVlbmN5JywgJ2Jhc2VsaW5lLXNoaWZ0JywgJ2JlZ2luJywgJ2JpYXMnLCAnYnknLCAnY2xhc3MnLCAnY2xpcCcsICdjbGlwcGF0aHVuaXRzJywgJ2NsaXAtcGF0aCcsICdjbGlwLXJ1bGUnLCAnY29sb3InLCAnY29sb3ItaW50ZXJwb2xhdGlvbicsICdjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMnLCAnY29sb3ItcHJvZmlsZScsICdjb2xvci1yZW5kZXJpbmcnLCAnY3gnLCAnY3knLCAnZCcsICdkeCcsICdkeScsICdkaWZmdXNlY29uc3RhbnQnLCAnZGlyZWN0aW9uJywgJ2Rpc3BsYXknLCAnZGl2aXNvcicsICdkdXInLCAnZWRnZW1vZGUnLCAnZWxldmF0aW9uJywgJ2VuZCcsICdleHBvbmVudCcsICdmaWxsJywgJ2ZpbGwtb3BhY2l0eScsICdmaWxsLXJ1bGUnLCAnZmlsdGVyJywgJ2ZpbHRlcnVuaXRzJywgJ2Zsb29kLWNvbG9yJywgJ2Zsb29kLW9wYWNpdHknLCAnZm9udC1mYW1pbHknLCAnZm9udC1zaXplJywgJ2ZvbnQtc2l6ZS1hZGp1c3QnLCAnZm9udC1zdHJldGNoJywgJ2ZvbnQtc3R5bGUnLCAnZm9udC12YXJpYW50JywgJ2ZvbnQtd2VpZ2h0JywgJ2Z4JywgJ2Z5JywgJ2cxJywgJ2cyJywgJ2dseXBoLW5hbWUnLCAnZ2x5cGhyZWYnLCAnZ3JhZGllbnR1bml0cycsICdncmFkaWVudHRyYW5zZm9ybScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdpbWFnZS1yZW5kZXJpbmcnLCAnaW4nLCAnaW4yJywgJ2ludGVyY2VwdCcsICdrJywgJ2sxJywgJ2syJywgJ2szJywgJ2s0JywgJ2tlcm5pbmcnLCAna2V5cG9pbnRzJywgJ2tleXNwbGluZXMnLCAna2V5dGltZXMnLCAnbGFuZycsICdsZW5ndGhhZGp1c3QnLCAnbGV0dGVyLXNwYWNpbmcnLCAna2VybmVsbWF0cml4JywgJ2tlcm5lbHVuaXRsZW5ndGgnLCAnbGlnaHRpbmctY29sb3InLCAnbG9jYWwnLCAnbWFya2VyLWVuZCcsICdtYXJrZXItbWlkJywgJ21hcmtlci1zdGFydCcsICdtYXJrZXJoZWlnaHQnLCAnbWFya2VydW5pdHMnLCAnbWFya2Vyd2lkdGgnLCAnbWFza2NvbnRlbnR1bml0cycsICdtYXNrdW5pdHMnLCAnbWF4JywgJ21hc2snLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21vZGUnLCAnbWluJywgJ25hbWUnLCAnbnVtb2N0YXZlcycsICdvZmZzZXQnLCAnb3BlcmF0b3InLCAnb3BhY2l0eScsICdvcmRlcicsICdvcmllbnQnLCAnb3JpZW50YXRpb24nLCAnb3JpZ2luJywgJ292ZXJmbG93JywgJ3BhaW50LW9yZGVyJywgJ3BhdGgnLCAncGF0aGxlbmd0aCcsICdwYXR0ZXJuY29udGVudHVuaXRzJywgJ3BhdHRlcm50cmFuc2Zvcm0nLCAncGF0dGVybnVuaXRzJywgJ3BvaW50cycsICdwcmVzZXJ2ZWFscGhhJywgJ3ByZXNlcnZlYXNwZWN0cmF0aW8nLCAncHJpbWl0aXZldW5pdHMnLCAncicsICdyeCcsICdyeScsICdyYWRpdXMnLCAncmVmeCcsICdyZWZ5JywgJ3JlcGVhdGNvdW50JywgJ3JlcGVhdGR1cicsICdyZXN0YXJ0JywgJ3Jlc3VsdCcsICdyb3RhdGUnLCAnc2NhbGUnLCAnc2VlZCcsICdzaGFwZS1yZW5kZXJpbmcnLCAnc2xvcGUnLCAnc3BlY3VsYXJjb25zdGFudCcsICdzcGVjdWxhcmV4cG9uZW50JywgJ3NwcmVhZG1ldGhvZCcsICdzdGFydG9mZnNldCcsICdzdGRkZXZpYXRpb24nLCAnc3RpdGNodGlsZXMnLCAnc3RvcC1jb2xvcicsICdzdG9wLW9wYWNpdHknLCAnc3Ryb2tlLWRhc2hhcnJheScsICdzdHJva2UtZGFzaG9mZnNldCcsICdzdHJva2UtbGluZWNhcCcsICdzdHJva2UtbGluZWpvaW4nLCAnc3Ryb2tlLW1pdGVybGltaXQnLCAnc3Ryb2tlLW9wYWNpdHknLCAnc3Ryb2tlJywgJ3N0cm9rZS13aWR0aCcsICdzdHlsZScsICdzdXJmYWNlc2NhbGUnLCAnc3lzdGVtbGFuZ3VhZ2UnLCAndGFiaW5kZXgnLCAndGFibGV2YWx1ZXMnLCAndGFyZ2V0eCcsICd0YXJnZXR5JywgJ3RyYW5zZm9ybScsICd0cmFuc2Zvcm0tb3JpZ2luJywgJ3RleHQtYW5jaG9yJywgJ3RleHQtZGVjb3JhdGlvbicsICd0ZXh0LXJlbmRlcmluZycsICd0ZXh0bGVuZ3RoJywgJ3R5cGUnLCAndTEnLCAndTInLCAndW5pY29kZScsICd2YWx1ZXMnLCAndmlld2JveCcsICd2aXNpYmlsaXR5JywgJ3ZlcnNpb24nLCAndmVydC1hZHYteScsICd2ZXJ0LW9yaWdpbi14JywgJ3ZlcnQtb3JpZ2luLXknLCAnd2lkdGgnLCAnd29yZC1zcGFjaW5nJywgJ3dyYXAnLCAnd3JpdGluZy1tb2RlJywgJ3hjaGFubmVsc2VsZWN0b3InLCAneWNoYW5uZWxzZWxlY3RvcicsICd4JywgJ3gxJywgJ3gyJywgJ3htbG5zJywgJ3knLCAneTEnLCAneTInLCAneicsICd6b29tYW5kcGFuJ10pO1xuICBjb25zdCBtYXRoTWwgPSBmcmVlemUoWydhY2NlbnQnLCAnYWNjZW50dW5kZXInLCAnYWxpZ24nLCAnYmV2ZWxsZWQnLCAnY2xvc2UnLCAnY29sdW1uc2FsaWduJywgJ2NvbHVtbmxpbmVzJywgJ2NvbHVtbnNwYW4nLCAnZGVub21hbGlnbicsICdkZXB0aCcsICdkaXInLCAnZGlzcGxheScsICdkaXNwbGF5c3R5bGUnLCAnZW5jb2RpbmcnLCAnZmVuY2UnLCAnZnJhbWUnLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnbGFyZ2VvcCcsICdsZW5ndGgnLCAnbGluZXRoaWNrbmVzcycsICdsc3BhY2UnLCAnbHF1b3RlJywgJ21hdGhiYWNrZ3JvdW5kJywgJ21hdGhjb2xvcicsICdtYXRoc2l6ZScsICdtYXRodmFyaWFudCcsICdtYXhzaXplJywgJ21pbnNpemUnLCAnbW92YWJsZWxpbWl0cycsICdub3RhdGlvbicsICdudW1hbGlnbicsICdvcGVuJywgJ3Jvd2FsaWduJywgJ3Jvd2xpbmVzJywgJ3Jvd3NwYWNpbmcnLCAncm93c3BhbicsICdyc3BhY2UnLCAncnF1b3RlJywgJ3NjcmlwdGxldmVsJywgJ3NjcmlwdG1pbnNpemUnLCAnc2NyaXB0c2l6ZW11bHRpcGxpZXInLCAnc2VsZWN0aW9uJywgJ3NlcGFyYXRvcicsICdzZXBhcmF0b3JzJywgJ3N0cmV0Y2h5JywgJ3N1YnNjcmlwdHNoaWZ0JywgJ3N1cHNjcmlwdHNoaWZ0JywgJ3N5bW1ldHJpYycsICd2b2Zmc2V0JywgJ3dpZHRoJywgJ3htbG5zJ10pO1xuICBjb25zdCB4bWwgPSBmcmVlemUoWyd4bGluazpocmVmJywgJ3htbDppZCcsICd4bGluazp0aXRsZScsICd4bWw6c3BhY2UnLCAneG1sbnM6eGxpbmsnXSk7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG4gIGNvbnN0IE1VU1RBQ0hFX0VYUFIgPSBzZWFsKC9cXHtcXHtbXFx3XFxXXSp8W1xcd1xcV10qXFx9XFx9L2dtKTsgLy8gU3BlY2lmeSB0ZW1wbGF0ZSBkZXRlY3Rpb24gcmVnZXggZm9yIFNBRkVfRk9SX1RFTVBMQVRFUyBtb2RlXG4gIGNvbnN0IEVSQl9FWFBSID0gc2VhbCgvPCVbXFx3XFxXXSp8W1xcd1xcV10qJT4vZ20pO1xuICBjb25zdCBUTVBMSVRfRVhQUiA9IHNlYWwoL1xcJFxce1tcXHdcXFddKi9nbSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbiAgY29uc3QgREFUQV9BVFRSID0gc2VhbCgvXmRhdGEtW1xcLVxcdy5cXHUwMEI3LVxcdUZGRkZdKyQvKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuICBjb25zdCBBUklBX0FUVFIgPSBzZWFsKC9eYXJpYS1bXFwtXFx3XSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbiAgY29uc3QgSVNfQUxMT1dFRF9VUkkgPSBzZWFsKC9eKD86KD86KD86ZnxodCl0cHM/fG1haWx0b3x0ZWx8Y2FsbHRvfHNtc3xjaWR8eG1wcCk6fFteYS16XXxbYS16Ky5cXC1dKyg/OlteYS16Ky5cXC06XXwkKSkvaSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4gICk7XG4gIGNvbnN0IElTX1NDUklQVF9PUl9EQVRBID0gc2VhbCgvXig/OlxcdytzY3JpcHR8ZGF0YSk6L2kpO1xuICBjb25zdCBBVFRSX1dISVRFU1BBQ0UgPSBzZWFsKC9bXFx1MDAwMC1cXHUwMDIwXFx1MDBBMFxcdTE2ODBcXHUxODBFXFx1MjAwMC1cXHUyMDI5XFx1MjA1RlxcdTMwMDBdL2cgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICk7XG4gIGNvbnN0IERPQ1RZUEVfTkFNRSA9IHNlYWwoL15odG1sJC9pKTtcbiAgY29uc3QgQ1VTVE9NX0VMRU1FTlQgPSBzZWFsKC9eW2Etel1bLlxcd10qKC1bLlxcd10rKSskL2kpO1xuXG4gIHZhciBFWFBSRVNTSU9OUyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgICBfX3Byb3RvX186IG51bGwsXG4gICAgQVJJQV9BVFRSOiBBUklBX0FUVFIsXG4gICAgQVRUUl9XSElURVNQQUNFOiBBVFRSX1dISVRFU1BBQ0UsXG4gICAgQ1VTVE9NX0VMRU1FTlQ6IENVU1RPTV9FTEVNRU5ULFxuICAgIERBVEFfQVRUUjogREFUQV9BVFRSLFxuICAgIERPQ1RZUEVfTkFNRTogRE9DVFlQRV9OQU1FLFxuICAgIEVSQl9FWFBSOiBFUkJfRVhQUixcbiAgICBJU19BTExPV0VEX1VSSTogSVNfQUxMT1dFRF9VUkksXG4gICAgSVNfU0NSSVBUX09SX0RBVEE6IElTX1NDUklQVF9PUl9EQVRBLFxuICAgIE1VU1RBQ0hFX0VYUFI6IE1VU1RBQ0hFX0VYUFIsXG4gICAgVE1QTElUX0VYUFI6IFRNUExJVF9FWFBSXG4gIH0pO1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9pbmRlbnQgKi9cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGVcbiAgY29uc3QgTk9ERV9UWVBFID0ge1xuICAgIGVsZW1lbnQ6IDEsXG4gICAgYXR0cmlidXRlOiAyLFxuICAgIHRleHQ6IDMsXG4gICAgY2RhdGFTZWN0aW9uOiA0LFxuICAgIGVudGl0eVJlZmVyZW5jZTogNSxcbiAgICAvLyBEZXByZWNhdGVkXG4gICAgZW50aXR5Tm9kZTogNixcbiAgICAvLyBEZXByZWNhdGVkXG4gICAgcHJvZ3Jlc3NpbmdJbnN0cnVjdGlvbjogNyxcbiAgICBjb21tZW50OiA4LFxuICAgIGRvY3VtZW50OiA5LFxuICAgIGRvY3VtZW50VHlwZTogMTAsXG4gICAgZG9jdW1lbnRGcmFnbWVudDogMTEsXG4gICAgbm90YXRpb246IDEyIC8vIERlcHJlY2F0ZWRcbiAgfTtcbiAgY29uc3QgZ2V0R2xvYmFsID0gZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiB3aW5kb3c7XG4gIH07XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbm8tb3AgcG9saWN5IGZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAgICogRG9uJ3QgZXhwb3J0IHRoaXMgZnVuY3Rpb24gb3V0c2lkZSB0aGlzIG1vZHVsZSFcbiAgICogQHBhcmFtIHRydXN0ZWRUeXBlcyBUaGUgcG9saWN5IGZhY3RvcnkuXG4gICAqIEBwYXJhbSBwdXJpZnlIb3N0RWxlbWVudCBUaGUgU2NyaXB0IGVsZW1lbnQgdXNlZCB0byBsb2FkIERPTVB1cmlmeSAodG8gZGV0ZXJtaW5lIHBvbGljeSBuYW1lIHN1ZmZpeCkuXG4gICAqIEByZXR1cm4gVGhlIHBvbGljeSBjcmVhdGVkIChvciBudWxsLCBpZiBUcnVzdGVkIFR5cGVzXG4gICAqIGFyZSBub3Qgc3VwcG9ydGVkIG9yIGNyZWF0aW5nIHRoZSBwb2xpY3kgZmFpbGVkKS5cbiAgICovXG4gIGNvbnN0IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kgPSBmdW5jdGlvbiBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgcHVyaWZ5SG9zdEVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIHRydXN0ZWRUeXBlcyAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvLyBBbGxvdyB0aGUgY2FsbGVycyB0byBjb250cm9sIHRoZSB1bmlxdWUgcG9saWN5IG5hbWVcbiAgICAvLyBieSBhZGRpbmcgYSBkYXRhLXR0LXBvbGljeS1zdWZmaXggdG8gdGhlIHNjcmlwdCBlbGVtZW50IHdpdGggdGhlIERPTVB1cmlmeS5cbiAgICAvLyBQb2xpY3kgY3JlYXRpb24gd2l0aCBkdXBsaWNhdGUgbmFtZXMgdGhyb3dzIGluIFRydXN0ZWQgVHlwZXMuXG4gICAgbGV0IHN1ZmZpeCA9IG51bGw7XG4gICAgY29uc3QgQVRUUl9OQU1FID0gJ2RhdGEtdHQtcG9saWN5LXN1ZmZpeCc7XG4gICAgaWYgKHB1cmlmeUhvc3RFbGVtZW50ICYmIHB1cmlmeUhvc3RFbGVtZW50Lmhhc0F0dHJpYnV0ZShBVFRSX05BTUUpKSB7XG4gICAgICBzdWZmaXggPSBwdXJpZnlIb3N0RWxlbWVudC5nZXRBdHRyaWJ1dGUoQVRUUl9OQU1FKTtcbiAgICB9XG4gICAgY29uc3QgcG9saWN5TmFtZSA9ICdkb21wdXJpZnknICsgKHN1ZmZpeCA/ICcjJyArIHN1ZmZpeCA6ICcnKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kocG9saWN5TmFtZSwge1xuICAgICAgICBjcmVhdGVIVE1MKGh0bWwpIHtcbiAgICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlU2NyaXB0VVJMKHNjcmlwdFVybCkge1xuICAgICAgICAgIHJldHVybiBzY3JpcHRVcmw7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIC8vIFBvbGljeSBjcmVhdGlvbiBmYWlsZWQgKG1vc3QgbGlrZWx5IGFub3RoZXIgRE9NUHVyaWZ5IHNjcmlwdCBoYXNcbiAgICAgIC8vIGFscmVhZHkgcnVuKS4gU2tpcCBjcmVhdGluZyB0aGUgcG9saWN5LCBhcyB0aGlzIHdpbGwgb25seSBjYXVzZSBlcnJvcnNcbiAgICAgIC8vIGlmIFRUIGFyZSBlbmZvcmNlZC5cbiAgICAgIGNvbnNvbGUud2FybignVHJ1c3RlZFR5cGVzIHBvbGljeSAnICsgcG9saWN5TmFtZSArICcgY291bGQgbm90IGJlIGNyZWF0ZWQuJyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG4gIGNvbnN0IF9jcmVhdGVIb29rc01hcCA9IGZ1bmN0aW9uIF9jcmVhdGVIb29rc01hcCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXM6IFtdLFxuICAgICAgYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzOiBbXSxcbiAgICAgIGFmdGVyU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgICAgYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzOiBbXSxcbiAgICAgIGJlZm9yZVNhbml0aXplRWxlbWVudHM6IFtdLFxuICAgICAgYmVmb3JlU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgICAgdXBvblNhbml0aXplQXR0cmlidXRlOiBbXSxcbiAgICAgIHVwb25TYW5pdGl6ZUVsZW1lbnQ6IFtdLFxuICAgICAgdXBvblNhbml0aXplU2hhZG93Tm9kZTogW11cbiAgICB9O1xuICB9O1xuICBmdW5jdGlvbiBjcmVhdGVET01QdXJpZnkoKSB7XG4gICAgbGV0IHdpbmRvdyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZ2V0R2xvYmFsKCk7XG4gICAgY29uc3QgRE9NUHVyaWZ5ID0gcm9vdCA9PiBjcmVhdGVET01QdXJpZnkocm9vdCk7XG4gICAgRE9NUHVyaWZ5LnZlcnNpb24gPSAnMy4yLjQnO1xuICAgIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gICAgaWYgKCF3aW5kb3cgfHwgIXdpbmRvdy5kb2N1bWVudCB8fCB3aW5kb3cuZG9jdW1lbnQubm9kZVR5cGUgIT09IE5PREVfVFlQRS5kb2N1bWVudCB8fCAhd2luZG93LkVsZW1lbnQpIHtcbiAgICAgIC8vIE5vdCBydW5uaW5nIGluIGEgYnJvd3NlciwgcHJvdmlkZSBhIGZhY3RvcnkgZnVuY3Rpb25cbiAgICAgIC8vIHNvIHRoYXQgeW91IGNhbiBwYXNzIHlvdXIgb3duIFdpbmRvd1xuICAgICAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gRE9NUHVyaWZ5O1xuICAgIH1cbiAgICBsZXQge1xuICAgICAgZG9jdW1lbnRcbiAgICB9ID0gd2luZG93O1xuICAgIGNvbnN0IG9yaWdpbmFsRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICBjb25zdCBjdXJyZW50U2NyaXB0ID0gb3JpZ2luYWxEb2N1bWVudC5jdXJyZW50U2NyaXB0O1xuICAgIGNvbnN0IHtcbiAgICAgIERvY3VtZW50RnJhZ21lbnQsXG4gICAgICBIVE1MVGVtcGxhdGVFbGVtZW50LFxuICAgICAgTm9kZSxcbiAgICAgIEVsZW1lbnQsXG4gICAgICBOb2RlRmlsdGVyLFxuICAgICAgTmFtZWROb2RlTWFwID0gd2luZG93Lk5hbWVkTm9kZU1hcCB8fCB3aW5kb3cuTW96TmFtZWRBdHRyTWFwLFxuICAgICAgSFRNTEZvcm1FbGVtZW50LFxuICAgICAgRE9NUGFyc2VyLFxuICAgICAgdHJ1c3RlZFR5cGVzXG4gICAgfSA9IHdpbmRvdztcbiAgICBjb25zdCBFbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgY29uc3QgY2xvbmVOb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjbG9uZU5vZGUnKTtcbiAgICBjb25zdCByZW1vdmUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3JlbW92ZScpO1xuICAgIGNvbnN0IGdldE5leHRTaWJsaW5nID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICduZXh0U2libGluZycpO1xuICAgIGNvbnN0IGdldENoaWxkTm9kZXMgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2NoaWxkTm9kZXMnKTtcbiAgICBjb25zdCBnZXRQYXJlbnROb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdwYXJlbnROb2RlJyk7XG4gICAgLy8gQXMgcGVyIGlzc3VlICM0NywgdGhlIHdlYi1jb21wb25lbnRzIHJlZ2lzdHJ5IGlzIGluaGVyaXRlZCBieSBhXG4gICAgLy8gbmV3IGRvY3VtZW50IGNyZWF0ZWQgdmlhIGNyZWF0ZUhUTUxEb2N1bWVudC4gQXMgcGVyIHRoZSBzcGVjXG4gICAgLy8gKGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9jdXN0b20vI2NyZWF0aW5nLWFuZC1wYXNzaW5nLXJlZ2lzdHJpZXMpXG4gICAgLy8gYSBuZXcgZW1wdHkgcmVnaXN0cnkgaXMgdXNlZCB3aGVuIGNyZWF0aW5nIGEgdGVtcGxhdGUgY29udGVudHMgb3duZXJcbiAgICAvLyBkb2N1bWVudCwgc28gd2UgdXNlIHRoYXQgYXMgb3VyIHBhcmVudCBkb2N1bWVudCB0byBlbnN1cmUgbm90aGluZ1xuICAgIC8vIGlzIGluaGVyaXRlZC5cbiAgICBpZiAodHlwZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgIGlmICh0ZW1wbGF0ZS5jb250ZW50ICYmIHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgICBkb2N1bWVudCA9IHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHRydXN0ZWRUeXBlc1BvbGljeTtcbiAgICBsZXQgZW1wdHlIVE1MID0gJyc7XG4gICAgY29uc3Qge1xuICAgICAgaW1wbGVtZW50YXRpb24sXG4gICAgICBjcmVhdGVOb2RlSXRlcmF0b3IsXG4gICAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50LFxuICAgICAgZ2V0RWxlbWVudHNCeVRhZ05hbWVcbiAgICB9ID0gZG9jdW1lbnQ7XG4gICAgY29uc3Qge1xuICAgICAgaW1wb3J0Tm9kZVxuICAgIH0gPSBvcmlnaW5hbERvY3VtZW50O1xuICAgIGxldCBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICAgIC8qKlxuICAgICAqIEV4cG9zZSB3aGV0aGVyIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBydW5uaW5nIHRoZSBmdWxsIERPTVB1cmlmeS5cbiAgICAgKi9cbiAgICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSB0eXBlb2YgZW50cmllcyA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0UGFyZW50Tm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpbXBsZW1lbnRhdGlvbiAmJiBpbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQgIT09IHVuZGVmaW5lZDtcbiAgICBjb25zdCB7XG4gICAgICBNVVNUQUNIRV9FWFBSLFxuICAgICAgRVJCX0VYUFIsXG4gICAgICBUTVBMSVRfRVhQUixcbiAgICAgIERBVEFfQVRUUixcbiAgICAgIEFSSUFfQVRUUixcbiAgICAgIElTX1NDUklQVF9PUl9EQVRBLFxuICAgICAgQVRUUl9XSElURVNQQUNFLFxuICAgICAgQ1VTVE9NX0VMRU1FTlRcbiAgICB9ID0gRVhQUkVTU0lPTlM7XG4gICAgbGV0IHtcbiAgICAgIElTX0FMTE9XRURfVVJJOiBJU19BTExPV0VEX1VSSSQxXG4gICAgfSA9IEVYUFJFU1NJT05TO1xuICAgIC8qKlxuICAgICAqIFdlIGNvbnNpZGVyIHRoZSBlbGVtZW50cyBhbmQgYXR0cmlidXRlcyBiZWxvdyB0byBiZSBzYWZlLiBJZGVhbGx5XG4gICAgICogZG9uJ3QgYWRkIGFueSBuZXcgb25lcyBidXQgZmVlbCBmcmVlIHRvIHJlbW92ZSB1bndhbnRlZCBvbmVzLlxuICAgICAqL1xuICAgIC8qIGFsbG93ZWQgZWxlbWVudCBuYW1lcyAqL1xuICAgIGxldCBBTExPV0VEX1RBR1MgPSBudWxsO1xuICAgIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5odG1sJDEsIC4uLnN2ZyQxLCAuLi5zdmdGaWx0ZXJzLCAuLi5tYXRoTWwkMSwgLi4udGV4dF0pO1xuICAgIC8qIEFsbG93ZWQgYXR0cmlidXRlIG5hbWVzICovXG4gICAgbGV0IEFMTE9XRURfQVRUUiA9IG51bGw7XG4gICAgY29uc3QgREVGQVVMVF9BTExPV0VEX0FUVFIgPSBhZGRUb1NldCh7fSwgWy4uLmh0bWwsIC4uLnN2ZywgLi4ubWF0aE1sLCAuLi54bWxdKTtcbiAgICAvKlxuICAgICAqIENvbmZpZ3VyZSBob3cgRE9NUHVyaWZ5IHNob3VsZCBoYW5kbGUgY3VzdG9tIGVsZW1lbnRzIGFuZCB0aGVpciBhdHRyaWJ1dGVzIGFzIHdlbGwgYXMgY3VzdG9taXplZCBidWlsdC1pbiBlbGVtZW50cy5cbiAgICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSB0YWdOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGN1c3RvbSBlbGVtZW50cylcbiAgICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSBhdHRyaWJ1dGVOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGF0dHJpYnV0ZXMgbm90IG9uIHRoZSBhbGxvdyBsaXN0KVxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzIGFsbG93IGN1c3RvbSBlbGVtZW50cyBkZXJpdmVkIGZyb20gYnVpbHQtaW5zIGlmIHRoZXkgcGFzcyBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2suIERlZmF1bHQ6IGBmYWxzZWAuXG4gICAgICovXG4gICAgbGV0IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HID0gT2JqZWN0LnNlYWwoY3JlYXRlKG51bGwsIHtcbiAgICAgIHRhZ05hbWVDaGVjazoge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IG51bGxcbiAgICAgIH0sXG4gICAgICBhdHRyaWJ1dGVOYW1lQ2hlY2s6IHtcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBudWxsXG4gICAgICB9LFxuICAgICAgYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzOiB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogZmFsc2VcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgLyogRXhwbGljaXRseSBmb3JiaWRkZW4gdGFncyAob3ZlcnJpZGVzIEFMTE9XRURfVEFHUy9BRERfVEFHUykgKi9cbiAgICBsZXQgRk9SQklEX1RBR1MgPSBudWxsO1xuICAgIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIGF0dHJpYnV0ZXMgKG92ZXJyaWRlcyBBTExPV0VEX0FUVFIvQUREX0FUVFIpICovXG4gICAgbGV0IEZPUkJJRF9BVFRSID0gbnVsbDtcbiAgICAvKiBEZWNpZGUgaWYgQVJJQSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gICAgbGV0IEFMTE9XX0FSSUFfQVRUUiA9IHRydWU7XG4gICAgLyogRGVjaWRlIGlmIGN1c3RvbSBkYXRhIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgICBsZXQgQUxMT1dfREFUQV9BVFRSID0gdHJ1ZTtcbiAgICAvKiBEZWNpZGUgaWYgdW5rbm93biBwcm90b2NvbHMgYXJlIG9rYXkgKi9cbiAgICBsZXQgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBmYWxzZTtcbiAgICAvKiBEZWNpZGUgaWYgc2VsZi1jbG9zaW5nIHRhZ3MgaW4gYXR0cmlidXRlcyBhcmUgYWxsb3dlZC5cbiAgICAgKiBVc3VhbGx5IHJlbW92ZWQgZHVlIHRvIGEgbVhTUyBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gICAgbGV0IEFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiA9IHRydWU7XG4gICAgLyogT3V0cHV0IHNob3VsZCBiZSBzYWZlIGZvciBjb21tb24gdGVtcGxhdGUgZW5naW5lcy5cbiAgICAgKiBUaGlzIG1lYW5zLCBET01QdXJpZnkgcmVtb3ZlcyBkYXRhIGF0dHJpYnV0ZXMsIG11c3RhY2hlcyBhbmQgRVJCXG4gICAgICovXG4gICAgbGV0IFNBRkVfRk9SX1RFTVBMQVRFUyA9IGZhbHNlO1xuICAgIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBldmVuIGZvciBYTUwgdXNlZCB3aXRoaW4gSFRNTCBhbmQgYWxpa2UuXG4gICAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgY29tbWVudHMgd2hlbiBjb250YWluaW5nIHJpc2t5IGNvbnRlbnQuXG4gICAgICovXG4gICAgbGV0IFNBRkVfRk9SX1hNTCA9IHRydWU7XG4gICAgLyogRGVjaWRlIGlmIGRvY3VtZW50IHdpdGggPGh0bWw+Li4uIHNob3VsZCBiZSByZXR1cm5lZCAqL1xuICAgIGxldCBXSE9MRV9ET0NVTUVOVCA9IGZhbHNlO1xuICAgIC8qIFRyYWNrIHdoZXRoZXIgY29uZmlnIGlzIGFscmVhZHkgc2V0IG9uIHRoaXMgaW5zdGFuY2Ugb2YgRE9NUHVyaWZ5LiAqL1xuICAgIGxldCBTRVRfQ09ORklHID0gZmFsc2U7XG4gICAgLyogRGVjaWRlIGlmIGFsbCBlbGVtZW50cyAoZS5nLiBzdHlsZSwgc2NyaXB0KSBtdXN0IGJlIGNoaWxkcmVuIG9mXG4gICAgICogZG9jdW1lbnQuYm9keS4gQnkgZGVmYXVsdCwgYnJvd3NlcnMgbWlnaHQgbW92ZSB0aGVtIHRvIGRvY3VtZW50LmhlYWQgKi9cbiAgICBsZXQgRk9SQ0VfQk9EWSA9IGZhbHNlO1xuICAgIC8qIERlY2lkZSBpZiBhIERPTSBgSFRNTEJvZHlFbGVtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAgICogc3RyaW5nIChvciBhIFRydXN0ZWRIVE1MIG9iamVjdCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBzdXBwb3J0ZWQpLlxuICAgICAqIElmIGBXSE9MRV9ET0NVTUVOVGAgaXMgZW5hYmxlZCBhIGBIVE1MSHRtbEVsZW1lbnRgIHdpbGwgYmUgcmV0dXJuZWQgaW5zdGVhZFxuICAgICAqL1xuICAgIGxldCBSRVRVUk5fRE9NID0gZmFsc2U7XG4gICAgLyogRGVjaWRlIGlmIGEgRE9NIGBEb2N1bWVudEZyYWdtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAgICogc3RyaW5nICAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKSAqL1xuICAgIGxldCBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gZmFsc2U7XG4gICAgLyogVHJ5IHRvIHJldHVybiBhIFRydXN0ZWQgVHlwZSBvYmplY3QgaW5zdGVhZCBvZiBhIHN0cmluZywgcmV0dXJuIGEgc3RyaW5nIGluXG4gICAgICogY2FzZSBUcnVzdGVkIFR5cGVzIGFyZSBub3Qgc3VwcG9ydGVkICAqL1xuICAgIGxldCBSRVRVUk5fVFJVU1RFRF9UWVBFID0gZmFsc2U7XG4gICAgLyogT3V0cHV0IHNob3VsZCBiZSBmcmVlIGZyb20gRE9NIGNsb2JiZXJpbmcgYXR0YWNrcz9cbiAgICAgKiBUaGlzIHNhbml0aXplcyBtYXJrdXBzIG5hbWVkIHdpdGggY29sbGlkaW5nLCBjbG9iYmVyYWJsZSBidWlsdC1pbiBET00gQVBJcy5cbiAgICAgKi9cbiAgICBsZXQgU0FOSVRJWkVfRE9NID0gdHJ1ZTtcbiAgICAvKiBBY2hpZXZlIGZ1bGwgRE9NIENsb2JiZXJpbmcgcHJvdGVjdGlvbiBieSBpc29sYXRpbmcgdGhlIG5hbWVzcGFjZSBvZiBuYW1lZFxuICAgICAqIHByb3BlcnRpZXMgYW5kIEpTIHZhcmlhYmxlcywgbWl0aWdhdGluZyBhdHRhY2tzIHRoYXQgYWJ1c2UgdGhlIEhUTUwvRE9NIHNwZWMgcnVsZXMuXG4gICAgICpcbiAgICAgKiBIVE1ML0RPTSBzcGVjIHJ1bGVzIHRoYXQgZW5hYmxlIERPTSBDbG9iYmVyaW5nOlxuICAgICAqICAgLSBOYW1lZCBBY2Nlc3Mgb24gV2luZG93ICjCpzcuMy4zKVxuICAgICAqICAgLSBET00gVHJlZSBBY2Nlc3NvcnMgKMKnMy4xLjUpXG4gICAgICogICAtIEZvcm0gRWxlbWVudCBQYXJlbnQtQ2hpbGQgUmVsYXRpb25zICjCpzQuMTAuMylcbiAgICAgKiAgIC0gSWZyYW1lIHNyY2RvYyAvIE5lc3RlZCBXaW5kb3dQcm94aWVzICjCpzQuOC41KVxuICAgICAqICAgLSBIVE1MQ29sbGVjdGlvbiAowqc0LjIuMTAuMilcbiAgICAgKlxuICAgICAqIE5hbWVzcGFjZSBpc29sYXRpb24gaXMgaW1wbGVtZW50ZWQgYnkgcHJlZml4aW5nIGBpZGAgYW5kIGBuYW1lYCBhdHRyaWJ1dGVzXG4gICAgICogd2l0aCBhIGNvbnN0YW50IHN0cmluZywgaS5lLiwgYHVzZXItY29udGVudC1gXG4gICAgICovXG4gICAgbGV0IFNBTklUSVpFX05BTUVEX1BST1BTID0gZmFsc2U7XG4gICAgY29uc3QgU0FOSVRJWkVfTkFNRURfUFJPUFNfUFJFRklYID0gJ3VzZXItY29udGVudC0nO1xuICAgIC8qIEtlZXAgZWxlbWVudCBjb250ZW50IHdoZW4gcmVtb3ZpbmcgZWxlbWVudD8gKi9cbiAgICBsZXQgS0VFUF9DT05URU5UID0gdHJ1ZTtcbiAgICAvKiBJZiBhIGBOb2RlYCBpcyBwYXNzZWQgdG8gc2FuaXRpemUoKSwgdGhlbiBwZXJmb3JtcyBzYW5pdGl6YXRpb24gaW4tcGxhY2UgaW5zdGVhZFxuICAgICAqIG9mIGltcG9ydGluZyBpdCBpbnRvIGEgbmV3IERvY3VtZW50IGFuZCByZXR1cm5pbmcgYSBzYW5pdGl6ZWQgY29weSAqL1xuICAgIGxldCBJTl9QTEFDRSA9IGZhbHNlO1xuICAgIC8qIEFsbG93IHVzYWdlIG9mIHByb2ZpbGVzIGxpa2UgaHRtbCwgc3ZnIGFuZCBtYXRoTWwgKi9cbiAgICBsZXQgVVNFX1BST0ZJTEVTID0ge307XG4gICAgLyogVGFncyB0byBpZ25vcmUgY29udGVudCBvZiB3aGVuIEtFRVBfQ09OVEVOVCBpcyB0cnVlICovXG4gICAgbGV0IEZPUkJJRF9DT05URU5UUyA9IG51bGw7XG4gICAgY29uc3QgREVGQVVMVF9GT1JCSURfQ09OVEVOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCcsICdhdWRpbycsICdjb2xncm91cCcsICdkZXNjJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGVhZCcsICdpZnJhbWUnLCAnbWF0aCcsICdtaScsICdtbicsICdtbycsICdtcycsICdtdGV4dCcsICdub2VtYmVkJywgJ25vZnJhbWVzJywgJ25vc2NyaXB0JywgJ3BsYWludGV4dCcsICdzY3JpcHQnLCAnc3R5bGUnLCAnc3ZnJywgJ3RlbXBsYXRlJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3ZpZGVvJywgJ3htcCddKTtcbiAgICAvKiBUYWdzIHRoYXQgYXJlIHNhZmUgZm9yIGRhdGE6IFVSSXMgKi9cbiAgICBsZXQgREFUQV9VUklfVEFHUyA9IG51bGw7XG4gICAgY29uc3QgREVGQVVMVF9EQVRBX1VSSV9UQUdTID0gYWRkVG9TZXQoe30sIFsnYXVkaW8nLCAndmlkZW8nLCAnaW1nJywgJ3NvdXJjZScsICdpbWFnZScsICd0cmFjayddKTtcbiAgICAvKiBBdHRyaWJ1dGVzIHNhZmUgZm9yIHZhbHVlcyBsaWtlIFwiamF2YXNjcmlwdDpcIiAqL1xuICAgIGxldCBVUklfU0FGRV9BVFRSSUJVVEVTID0gbnVsbDtcbiAgICBjb25zdCBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMgPSBhZGRUb1NldCh7fSwgWydhbHQnLCAnY2xhc3MnLCAnZm9yJywgJ2lkJywgJ2xhYmVsJywgJ25hbWUnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdyb2xlJywgJ3N1bW1hcnknLCAndGl0bGUnLCAndmFsdWUnLCAnc3R5bGUnLCAneG1sbnMnXSk7XG4gICAgY29uc3QgTUFUSE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MJztcbiAgICBjb25zdCBTVkdfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICBjb25zdCBIVE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcbiAgICAvKiBEb2N1bWVudCBuYW1lc3BhY2UgKi9cbiAgICBsZXQgTkFNRVNQQUNFID0gSFRNTF9OQU1FU1BBQ0U7XG4gICAgbGV0IElTX0VNUFRZX0lOUFVUID0gZmFsc2U7XG4gICAgLyogQWxsb3dlZCBYSFRNTCtYTUwgbmFtZXNwYWNlcyAqL1xuICAgIGxldCBBTExPV0VEX05BTUVTUEFDRVMgPSBudWxsO1xuICAgIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9OQU1FU1BBQ0VTID0gYWRkVG9TZXQoe30sIFtNQVRITUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFLCBIVE1MX05BTUVTUEFDRV0sIHN0cmluZ1RvU3RyaW5nKTtcbiAgICBsZXQgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnbWknLCAnbW8nLCAnbW4nLCAnbXMnLCAnbXRleHQnXSk7XG4gICAgbGV0IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnYW5ub3RhdGlvbi14bWwnXSk7XG4gICAgLy8gQ2VydGFpbiBlbGVtZW50cyBhcmUgYWxsb3dlZCBpbiBib3RoIFNWRyBhbmQgSFRNTFxuICAgIC8vIG5hbWVzcGFjZS4gV2UgbmVlZCB0byBzcGVjaWZ5IHRoZW0gZXhwbGljaXRseVxuICAgIC8vIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgZXJyb25lb3VzbHkgZGVsZXRlZCBmcm9tXG4gICAgLy8gSFRNTCBuYW1lc3BhY2UuXG4gICAgY29uc3QgQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UUyA9IGFkZFRvU2V0KHt9LCBbJ3RpdGxlJywgJ3N0eWxlJywgJ2ZvbnQnLCAnYScsICdzY3JpcHQnXSk7XG4gICAgLyogUGFyc2luZyBvZiBzdHJpY3QgWEhUTUwgZG9jdW1lbnRzICovXG4gICAgbGV0IFBBUlNFUl9NRURJQV9UWVBFID0gbnVsbDtcbiAgICBjb25zdCBTVVBQT1JURURfUEFSU0VSX01FRElBX1RZUEVTID0gWydhcHBsaWNhdGlvbi94aHRtbCt4bWwnLCAndGV4dC9odG1sJ107XG4gICAgY29uc3QgREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA9ICd0ZXh0L2h0bWwnO1xuICAgIGxldCB0cmFuc2Zvcm1DYXNlRnVuYyA9IG51bGw7XG4gICAgLyogS2VlcCBhIHJlZmVyZW5jZSB0byBjb25maWcgdG8gcGFzcyB0byBob29rcyAqL1xuICAgIGxldCBDT05GSUcgPSBudWxsO1xuICAgIC8qIElkZWFsbHksIGRvIG5vdCB0b3VjaCBhbnl0aGluZyBiZWxvdyB0aGlzIGxpbmUgKi9cbiAgICAvKiBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fICovXG4gICAgY29uc3QgZm9ybUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgY29uc3QgaXNSZWdleE9yRnVuY3Rpb24gPSBmdW5jdGlvbiBpc1JlZ2V4T3JGdW5jdGlvbih0ZXN0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0ZXN0VmFsdWUgaW5zdGFuY2VvZiBSZWdFeHAgfHwgdGVzdFZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb247XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBfcGFyc2VDb25maWdcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjZmcgb3B0aW9uYWwgY29uZmlnIGxpdGVyYWxcbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIGNvbnN0IF9wYXJzZUNvbmZpZyA9IGZ1bmN0aW9uIF9wYXJzZUNvbmZpZygpIHtcbiAgICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgICAgaWYgKENPTkZJRyAmJiBDT05GSUcgPT09IGNmZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSB0YW1wZXJpbmcgKi9cbiAgICAgIGlmICghY2ZnIHx8IHR5cGVvZiBjZmcgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNmZyA9IHt9O1xuICAgICAgfVxuICAgICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gcHJvdG90eXBlIHBvbGx1dGlvbiAqL1xuICAgICAgY2ZnID0gY2xvbmUoY2ZnKTtcbiAgICAgIFBBUlNFUl9NRURJQV9UWVBFID1cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1pbmNsdWRlc1xuICAgICAgU1VQUE9SVEVEX1BBUlNFUl9NRURJQV9UWVBFUy5pbmRleE9mKGNmZy5QQVJTRVJfTUVESUFfVFlQRSkgPT09IC0xID8gREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA6IGNmZy5QQVJTRVJfTUVESUFfVFlQRTtcbiAgICAgIC8vIEhUTUwgdGFncyBhbmQgYXR0cmlidXRlcyBhcmUgbm90IGNhc2Utc2Vuc2l0aXZlLCBjb252ZXJ0aW5nIHRvIGxvd2VyY2FzZS4gS2VlcGluZyBYSFRNTCBhcyBpcy5cbiAgICAgIHRyYW5zZm9ybUNhc2VGdW5jID0gUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnID8gc3RyaW5nVG9TdHJpbmcgOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgICAgIC8qIFNldCBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICAgIEFMTE9XRURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfVEFHUycpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfQUxMT1dFRF9UQUdTO1xuICAgICAgQUxMT1dFRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9BVFRSJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9BTExPV0VEX0FUVFI7XG4gICAgICBBTExPV0VEX05BTUVTUEFDRVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX05BTUVTUEFDRVMnKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9OQU1FU1BBQ0VTLCBzdHJpbmdUb1N0cmluZykgOiBERUZBVUxUX0FMTE9XRURfTkFNRVNQQUNFUztcbiAgICAgIFVSSV9TQUZFX0FUVFJJQlVURVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBRERfVVJJX1NBRkVfQVRUUicpID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTKSwgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVM7XG4gICAgICBEQVRBX1VSSV9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUREX0RBVEFfVVJJX1RBR1MnKSA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfREFUQV9VUklfVEFHUyksIGNmZy5BRERfREFUQV9VUklfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9EQVRBX1VSSV9UQUdTO1xuICAgICAgRk9SQklEX0NPTlRFTlRTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0NPTlRFTlRTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9GT1JCSURfQ09OVEVOVFM7XG4gICAgICBGT1JCSURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9UQUdTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiB7fTtcbiAgICAgIEZPUkJJRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0FUVFInKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IHt9O1xuICAgICAgVVNFX1BST0ZJTEVTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnVVNFX1BST0ZJTEVTJykgPyBjZmcuVVNFX1BST0ZJTEVTIDogZmFsc2U7XG4gICAgICBBTExPV19BUklBX0FUVFIgPSBjZmcuQUxMT1dfQVJJQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBBTExPV19EQVRBX0FUVFIgPSBjZmcuQUxMT1dfREFUQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBBTExPV19VTktOT1dOX1BST1RPQ09MUyA9IGNmZy5BTExPV19VTktOT1dOX1BST1RPQ09MUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSID0gY2ZnLkFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgU0FGRV9GT1JfVEVNUExBVEVTID0gY2ZnLlNBRkVfRk9SX1RFTVBMQVRFUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgU0FGRV9GT1JfWE1MID0gY2ZnLlNBRkVfRk9SX1hNTCAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgV0hPTEVfRE9DVU1FTlQgPSBjZmcuV0hPTEVfRE9DVU1FTlQgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFJFVFVSTl9ET00gPSBjZmcuUkVUVVJOX0RPTSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGNmZy5SRVRVUk5fRE9NX0ZSQUdNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBSRVRVUk5fVFJVU1RFRF9UWVBFID0gY2ZnLlJFVFVSTl9UUlVTVEVEX1RZUEUgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIEZPUkNFX0JPRFkgPSBjZmcuRk9SQ0VfQk9EWSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgU0FOSVRJWkVfRE9NID0gY2ZnLlNBTklUSVpFX0RPTSAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgU0FOSVRJWkVfTkFNRURfUFJPUFMgPSBjZmcuU0FOSVRJWkVfTkFNRURfUFJPUFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIEtFRVBfQ09OVEVOVCA9IGNmZy5LRUVQX0NPTlRFTlQgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICAgIElOX1BMQUNFID0gY2ZnLklOX1BMQUNFIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBJU19BTExPV0VEX1VSSSQxID0gY2ZnLkFMTE9XRURfVVJJX1JFR0VYUCB8fCBJU19BTExPV0VEX1VSSTtcbiAgICAgIE5BTUVTUEFDRSA9IGNmZy5OQU1FU1BBQ0UgfHwgSFRNTF9OQU1FU1BBQ0U7XG4gICAgICBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBjZmcuTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTIHx8IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUztcbiAgICAgIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gY2ZnLkhUTUxfSU5URUdSQVRJT05fUE9JTlRTIHx8IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTO1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgfHwge307XG4gICAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2spKSB7XG4gICAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2s7XG4gICAgICB9XG4gICAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2spKSB7XG4gICAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2s7XG4gICAgICB9XG4gICAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIHR5cGVvZiBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cztcbiAgICAgIH1cbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgQUxMT1dfREFUQV9BVFRSID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICBSRVRVUk5fRE9NID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIFBhcnNlIHByb2ZpbGUgaW5mbyAqL1xuICAgICAgaWYgKFVTRV9QUk9GSUxFUykge1xuICAgICAgICBBTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgdGV4dCk7XG4gICAgICAgIEFMTE9XRURfQVRUUiA9IFtdO1xuICAgICAgICBpZiAoVVNFX1BST0ZJTEVTLmh0bWwgPT09IHRydWUpIHtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGh0bWwkMSk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBodG1sKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2ZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnJDEpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnKTtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFVTRV9QUk9GSUxFUy5zdmdGaWx0ZXJzID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmdGaWx0ZXJzKTtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2Zyk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChVU0VfUFJPRklMRVMubWF0aE1sID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBtYXRoTWwkMSk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBtYXRoTWwpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogTWVyZ2UgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgICBpZiAoY2ZnLkFERF9UQUdTKSB7XG4gICAgICAgIGlmIChBTExPV0VEX1RBR1MgPT09IERFRkFVTFRfQUxMT1dFRF9UQUdTKSB7XG4gICAgICAgICAgQUxMT1dFRF9UQUdTID0gY2xvbmUoQUxMT1dFRF9UQUdTKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGNmZy5BRERfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgICAgfVxuICAgICAgaWYgKGNmZy5BRERfQVRUUikge1xuICAgICAgICBpZiAoQUxMT1dFRF9BVFRSID09PSBERUZBVUxUX0FMTE9XRURfQVRUUikge1xuICAgICAgICAgIEFMTE9XRURfQVRUUiA9IGNsb25lKEFMTE9XRURfQVRUUik7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBjZmcuQUREX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICAgIH1cbiAgICAgIGlmIChjZmcuQUREX1VSSV9TQUZFX0FUVFIpIHtcbiAgICAgICAgYWRkVG9TZXQoVVJJX1NBRkVfQVRUUklCVVRFUywgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgICBpZiAoY2ZnLkZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoRk9SQklEX0NPTlRFTlRTLCBjZmcuRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgICAvKiBBZGQgI3RleHQgaW4gY2FzZSBLRUVQX0NPTlRFTlQgaXMgc2V0IHRvIHRydWUgKi9cbiAgICAgIGlmIChLRUVQX0NPTlRFTlQpIHtcbiAgICAgICAgQUxMT1dFRF9UQUdTWycjdGV4dCddID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIEFkZCBodG1sLCBoZWFkIGFuZCBib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIFdIT0xFX0RPQ1VNRU5UIGlzIHRydWUgKi9cbiAgICAgIGlmIChXSE9MRV9ET0NVTUVOVCkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsnaHRtbCcsICdoZWFkJywgJ2JvZHknXSk7XG4gICAgICB9XG4gICAgICAvKiBBZGQgdGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgdGFibGVzIGFyZSBwZXJtaXR0ZWQsIHNlZSAjMjg2LCAjMzY1ICovXG4gICAgICBpZiAoQUxMT1dFRF9UQUdTLnRhYmxlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWyd0Ym9keSddKTtcbiAgICAgICAgZGVsZXRlIEZPUkJJRF9UQUdTLnRib2R5O1xuICAgICAgfVxuICAgICAgaWYgKGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWSkge1xuICAgICAgICBpZiAodHlwZW9mIGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWS5jcmVhdGVIVE1MICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdUUlVTVEVEX1RZUEVTX1BPTElDWSBjb25maWd1cmF0aW9uIG9wdGlvbiBtdXN0IHByb3ZpZGUgYSBcImNyZWF0ZUhUTUxcIiBob29rLicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZLmNyZWF0ZVNjcmlwdFVSTCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnVFJVU1RFRF9UWVBFU19QT0xJQ1kgY29uZmlndXJhdGlvbiBvcHRpb24gbXVzdCBwcm92aWRlIGEgXCJjcmVhdGVTY3JpcHRVUkxcIiBob29rLicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE92ZXJ3cml0ZSBleGlzdGluZyBUcnVzdGVkVHlwZXMgcG9saWN5LlxuICAgICAgICB0cnVzdGVkVHlwZXNQb2xpY3kgPSBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1k7XG4gICAgICAgIC8vIFNpZ24gbG9jYWwgdmFyaWFibGVzIHJlcXVpcmVkIGJ5IGBzYW5pdGl6ZWAuXG4gICAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFVuaW5pdGlhbGl6ZWQgcG9saWN5LCBhdHRlbXB0IHRvIGluaXRpYWxpemUgdGhlIGludGVybmFsIGRvbXB1cmlmeSBwb2xpY3kuXG4gICAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRydXN0ZWRUeXBlc1BvbGljeSA9IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBjdXJyZW50U2NyaXB0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBjcmVhdGluZyB0aGUgaW50ZXJuYWwgcG9saWN5IHN1Y2NlZWRlZCBzaWduIGludGVybmFsIHZhcmlhYmxlcy5cbiAgICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAhPT0gbnVsbCAmJiB0eXBlb2YgZW1wdHlIVE1MID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBmdXJ0aGVyIG1hbmlwdWxhdGlvbiBvZiBjb25maWd1cmF0aW9uLlxuICAgICAgLy8gTm90IGF2YWlsYWJsZSBpbiBJRTgsIFNhZmFyaSA1LCBldGMuXG4gICAgICBpZiAoZnJlZXplKSB7XG4gICAgICAgIGZyZWV6ZShjZmcpO1xuICAgICAgfVxuICAgICAgQ09ORklHID0gY2ZnO1xuICAgIH07XG4gICAgLyogS2VlcCB0cmFjayBvZiBhbGwgcG9zc2libGUgU1ZHIGFuZCBNYXRoTUwgdGFnc1xuICAgICAqIHNvIHRoYXQgd2UgY2FuIHBlcmZvcm0gdGhlIG5hbWVzcGFjZSBjaGVja3NcbiAgICAgKiBjb3JyZWN0bHkuICovXG4gICAgY29uc3QgQUxMX1NWR19UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5zdmckMSwgLi4uc3ZnRmlsdGVycywgLi4uc3ZnRGlzYWxsb3dlZF0pO1xuICAgIGNvbnN0IEFMTF9NQVRITUxfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4ubWF0aE1sJDEsIC4uLm1hdGhNbERpc2FsbG93ZWRdKTtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBhIERPTSBlbGVtZW50IHdob3NlIG5hbWVzcGFjZSBpcyBiZWluZyBjaGVja2VkXG4gICAgICogQHJldHVybnMgUmV0dXJuIGZhbHNlIGlmIHRoZSBlbGVtZW50IGhhcyBhXG4gICAgICogIG5hbWVzcGFjZSB0aGF0IGEgc3BlYy1jb21wbGlhbnQgcGFyc2VyIHdvdWxkIG5ldmVyXG4gICAgICogIHJldHVybi4gUmV0dXJuIHRydWUgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIGNvbnN0IF9jaGVja1ZhbGlkTmFtZXNwYWNlID0gZnVuY3Rpb24gX2NoZWNrVmFsaWROYW1lc3BhY2UoZWxlbWVudCkge1xuICAgICAgbGV0IHBhcmVudCA9IGdldFBhcmVudE5vZGUoZWxlbWVudCk7XG4gICAgICAvLyBJbiBKU0RPTSwgaWYgd2UncmUgaW5zaWRlIHNoYWRvdyBET00sIHRoZW4gcGFyZW50Tm9kZVxuICAgICAgLy8gY2FuIGJlIG51bGwuIFdlIGp1c3Qgc2ltdWxhdGUgcGFyZW50IGluIHRoaXMgY2FzZS5cbiAgICAgIGlmICghcGFyZW50IHx8ICFwYXJlbnQudGFnTmFtZSkge1xuICAgICAgICBwYXJlbnQgPSB7XG4gICAgICAgICAgbmFtZXNwYWNlVVJJOiBOQU1FU1BBQ0UsXG4gICAgICAgICAgdGFnTmFtZTogJ3RlbXBsYXRlJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgdGFnTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKGVsZW1lbnQudGFnTmFtZSk7XG4gICAgICBjb25zdCBwYXJlbnRUYWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UocGFyZW50LnRhZ05hbWUpO1xuICAgICAgaWYgKCFBTExPV0VEX05BTUVTUEFDRVNbZWxlbWVudC5uYW1lc3BhY2VVUkldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gU1ZHXG4gICAgICAgIC8vIGlzIHZpYSA8c3ZnPi4gSWYgaXQgaGFwcGVucyB2aWEgYW55IG90aGVyIHRhZywgdGhlblxuICAgICAgICAvLyBpdCBzaG91bGQgYmUga2lsbGVkLlxuICAgICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2Zyc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIE1hdGhNTCB0byBTVkcgaXMgdmlhYFxuICAgICAgICAvLyBzdmcgaWYgcGFyZW50IGlzIGVpdGhlciA8YW5ub3RhdGlvbi14bWw+IG9yIE1hdGhNTFxuICAgICAgICAvLyB0ZXh0IGludGVncmF0aW9uIHBvaW50cy5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2ZycgJiYgKHBhcmVudFRhZ05hbWUgPT09ICdhbm5vdGF0aW9uLXhtbCcgfHwgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXZSBvbmx5IGFsbG93IGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgaW4gU1ZHXG4gICAgICAgIC8vIHNwZWMuIEFsbCBvdGhlcnMgYXJlIGRpc2FsbG93ZWQgaW4gU1ZHIG5hbWVzcGFjZS5cbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gTWF0aE1MXG4gICAgICAgIC8vIGlzIHZpYSA8bWF0aD4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gU1ZHIHRvIE1hdGhNTCBpcyB2aWFcbiAgICAgICAgLy8gPG1hdGg+IGFuZCBIVE1MIGludGVncmF0aW9uIHBvaW50c1xuICAgICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnbWF0aCcgJiYgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIE1hdGhNTFxuICAgICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIE1hdGhNTCBuYW1lc3BhY2UuXG4gICAgICAgIHJldHVybiBCb29sZWFuKEFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSk7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gSFRNTCBpcyB2aWFcbiAgICAgICAgLy8gSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHMsIGFuZCBmcm9tIE1hdGhNTCB0byBIVE1MXG4gICAgICAgIC8vIGlzIHZpYSBNYXRoTUwgdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UgJiYgIUhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFICYmICFNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2UgZGlzYWxsb3cgdGFncyB0aGF0IGFyZSBzcGVjaWZpYyBmb3IgTWF0aE1MXG4gICAgICAgIC8vIG9yIFNWRyBhbmQgc2hvdWxkIG5ldmVyIGFwcGVhciBpbiBIVE1MIG5hbWVzcGFjZVxuICAgICAgICByZXR1cm4gIUFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSAmJiAoQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UU1t0YWdOYW1lXSB8fCAhQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICAgIH1cbiAgICAgIC8vIEZvciBYSFRNTCBhbmQgWE1MIGRvY3VtZW50cyB0aGF0IHN1cHBvcnQgY3VzdG9tIG5hbWVzcGFjZXNcbiAgICAgIGlmIChQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgJiYgQUxMT1dFRF9OQU1FU1BBQ0VTW2VsZW1lbnQubmFtZXNwYWNlVVJJXSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBjb2RlIHNob3VsZCBuZXZlciByZWFjaCB0aGlzIHBsYWNlICh0aGlzIG1lYW5zXG4gICAgICAvLyB0aGF0IHRoZSBlbGVtZW50IHNvbWVob3cgZ290IG5hbWVzcGFjZSB0aGF0IGlzIG5vdFxuICAgICAgLy8gSFRNTCwgU1ZHLCBNYXRoTUwgb3IgYWxsb3dlZCB2aWEgQUxMT1dFRF9OQU1FU1BBQ0VTKS5cbiAgICAgIC8vIFJldHVybiBmYWxzZSBqdXN0IGluIGNhc2UuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBfZm9yY2VSZW1vdmVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBub2RlIGEgRE9NIG5vZGVcbiAgICAgKi9cbiAgICBjb25zdCBfZm9yY2VSZW1vdmUgPSBmdW5jdGlvbiBfZm9yY2VSZW1vdmUobm9kZSkge1xuICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgIGVsZW1lbnQ6IG5vZGVcbiAgICAgIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLXJlbW92ZVxuICAgICAgICBnZXRQYXJlbnROb2RlKG5vZGUpLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICByZW1vdmUobm9kZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBfcmVtb3ZlQXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBhbiBBdHRyaWJ1dGUgbmFtZVxuICAgICAqIEBwYXJhbSBlbGVtZW50IGEgRE9NIG5vZGVcbiAgICAgKi9cbiAgICBjb25zdCBfcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBlbGVtZW50KSB7XG4gICAgICB0cnkge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlTm9kZShuYW1lKSxcbiAgICAgICAgICBmcm9tOiBlbGVtZW50XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGU6IG51bGwsXG4gICAgICAgICAgZnJvbTogZWxlbWVudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgLy8gV2Ugdm9pZCBhdHRyaWJ1dGUgdmFsdWVzIGZvciB1bnJlbW92YWJsZSBcImlzXCIgYXR0cmlidXRlc1xuICAgICAgaWYgKG5hbWUgPT09ICdpcycpIHtcbiAgICAgICAgaWYgKFJFVFVSTl9ET00gfHwgUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBfZm9yY2VSZW1vdmUoZWxlbWVudCk7XG4gICAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgJycpO1xuICAgICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIF9pbml0RG9jdW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBkaXJ0eSAtIGEgc3RyaW5nIG9mIGRpcnR5IG1hcmt1cFxuICAgICAqIEByZXR1cm4gYSBET00sIGZpbGxlZCB3aXRoIHRoZSBkaXJ0eSBtYXJrdXBcbiAgICAgKi9cbiAgICBjb25zdCBfaW5pdERvY3VtZW50ID0gZnVuY3Rpb24gX2luaXREb2N1bWVudChkaXJ0eSkge1xuICAgICAgLyogQ3JlYXRlIGEgSFRNTCBkb2N1bWVudCAqL1xuICAgICAgbGV0IGRvYyA9IG51bGw7XG4gICAgICBsZXQgbGVhZGluZ1doaXRlc3BhY2UgPSBudWxsO1xuICAgICAgaWYgKEZPUkNFX0JPRFkpIHtcbiAgICAgICAgZGlydHkgPSAnPHJlbW92ZT48L3JlbW92ZT4nICsgZGlydHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBJZiBGT1JDRV9CT0RZIGlzbid0IHVzZWQsIGxlYWRpbmcgd2hpdGVzcGFjZSBuZWVkcyB0byBiZSBwcmVzZXJ2ZWQgbWFudWFsbHkgKi9cbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHN0cmluZ01hdGNoKGRpcnR5LCAvXltcXHJcXG5cXHQgXSsvKTtcbiAgICAgICAgbGVhZGluZ1doaXRlc3BhY2UgPSBtYXRjaGVzICYmIG1hdGNoZXNbMF07XG4gICAgICB9XG4gICAgICBpZiAoUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnICYmIE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgLy8gUm9vdCBvZiBYSFRNTCBkb2MgbXVzdCBjb250YWluIHhtbG5zIGRlY2xhcmF0aW9uIChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3hodG1sMS9ub3JtYXRpdmUuaHRtbCNzdHJpY3QpXG4gICAgICAgIGRpcnR5ID0gJzxodG1sIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiPjxoZWFkPjwvaGVhZD48Ym9keT4nICsgZGlydHkgKyAnPC9ib2R5PjwvaHRtbD4nO1xuICAgICAgfVxuICAgICAgY29uc3QgZGlydHlQYXlsb2FkID0gdHJ1c3RlZFR5cGVzUG9saWN5ID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgICAvKlxuICAgICAgICogVXNlIHRoZSBET01QYXJzZXIgQVBJIGJ5IGRlZmF1bHQsIGZhbGxiYWNrIGxhdGVyIGlmIG5lZWRzIGJlXG4gICAgICAgKiBET01QYXJzZXIgbm90IHdvcmsgZm9yIHN2ZyB3aGVuIGhhcyBtdWx0aXBsZSByb290IGVsZW1lbnQuXG4gICAgICAgKi9cbiAgICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhkaXJ0eVBheWxvYWQsIFBBUlNFUl9NRURJQV9UWVBFKTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH1cbiAgICAgIC8qIFVzZSBjcmVhdGVIVE1MRG9jdW1lbnQgaW4gY2FzZSBET01QYXJzZXIgaXMgbm90IGF2YWlsYWJsZSAqL1xuICAgICAgaWYgKCFkb2MgfHwgIWRvYy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgZG9jID0gaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoTkFNRVNQQUNFLCAndGVtcGxhdGUnLCBudWxsKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkb2MuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IElTX0VNUFRZX0lOUFVUID8gZW1wdHlIVE1MIDogZGlydHlQYXlsb2FkO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgLy8gU3ludGF4IGVycm9yIGlmIGRpcnR5UGF5bG9hZCBpcyBpbnZhbGlkIHhtbFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBib2R5ID0gZG9jLmJvZHkgfHwgZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICAgIGlmIChkaXJ0eSAmJiBsZWFkaW5nV2hpdGVzcGFjZSkge1xuICAgICAgICBib2R5Lmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZWFkaW5nV2hpdGVzcGFjZSksIGJvZHkuY2hpbGROb2Rlc1swXSB8fCBudWxsKTtcbiAgICAgIH1cbiAgICAgIC8qIFdvcmsgb24gd2hvbGUgZG9jdW1lbnQgb3IganVzdCBpdHMgYm9keSAqL1xuICAgICAgaWYgKE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIGdldEVsZW1lbnRzQnlUYWdOYW1lLmNhbGwoZG9jLCBXSE9MRV9ET0NVTUVOVCA/ICdodG1sJyA6ICdib2R5JylbMF07XG4gICAgICB9XG4gICAgICByZXR1cm4gV0hPTEVfRE9DVU1FTlQgPyBkb2MuZG9jdW1lbnRFbGVtZW50IDogYm9keTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBOb2RlSXRlcmF0b3Igb2JqZWN0IHRoYXQgeW91IGNhbiB1c2UgdG8gdHJhdmVyc2UgZmlsdGVyZWQgbGlzdHMgb2Ygbm9kZXMgb3IgZWxlbWVudHMgaW4gYSBkb2N1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290IFRoZSByb290IGVsZW1lbnQgb3Igbm9kZSB0byBzdGFydCB0cmF2ZXJzaW5nIG9uLlxuICAgICAqIEByZXR1cm4gVGhlIGNyZWF0ZWQgTm9kZUl0ZXJhdG9yXG4gICAgICovXG4gICAgY29uc3QgX2NyZWF0ZU5vZGVJdGVyYXRvciA9IGZ1bmN0aW9uIF9jcmVhdGVOb2RlSXRlcmF0b3Iocm9vdCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZU5vZGVJdGVyYXRvci5jYWxsKHJvb3Qub3duZXJEb2N1bWVudCB8fCByb290LCByb290LFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICAgIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UIHwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfVEVYVCB8IE5vZGVGaWx0ZXIuU0hPV19QUk9DRVNTSU5HX0lOU1RSVUNUSU9OIHwgTm9kZUZpbHRlci5TSE9XX0NEQVRBX1NFQ1RJT04sIG51bGwpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogX2lzQ2xvYmJlcmVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGNoZWNrIGZvciBjbG9iYmVyaW5nIGF0dGFja3NcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgY2xvYmJlcmVkLCBmYWxzZSBpZiBzYWZlXG4gICAgICovXG4gICAgY29uc3QgX2lzQ2xvYmJlcmVkID0gZnVuY3Rpb24gX2lzQ2xvYmJlcmVkKGVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50ICYmICh0eXBlb2YgZWxlbWVudC5ub2RlTmFtZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQudGV4dENvbnRlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50LnJlbW92ZUNoaWxkICE9PSAnZnVuY3Rpb24nIHx8ICEoZWxlbWVudC5hdHRyaWJ1dGVzIGluc3RhbmNlb2YgTmFtZWROb2RlTWFwKSB8fCB0eXBlb2YgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQuc2V0QXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lm5hbWVzcGFjZVVSSSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQuaW5zZXJ0QmVmb3JlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lmhhc0NoaWxkTm9kZXMgIT09ICdmdW5jdGlvbicpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIERPTSBub2RlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZhbHVlIG9iamVjdCB0byBjaGVjayB3aGV0aGVyIGl0J3MgYSBET00gbm9kZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpcyBvYmplY3QgaXMgYSBET00gbm9kZVxuICAgICAqL1xuICAgIGNvbnN0IF9pc05vZGUgPSBmdW5jdGlvbiBfaXNOb2RlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBOb2RlO1xuICAgIH07XG4gICAgZnVuY3Rpb24gX2V4ZWN1dGVIb29rcyhob29rcywgY3VycmVudE5vZGUsIGRhdGEpIHtcbiAgICAgIGFycmF5Rm9yRWFjaChob29rcywgaG9vayA9PiB7XG4gICAgICAgIGhvb2suY2FsbChET01QdXJpZnksIGN1cnJlbnROb2RlLCBkYXRhLCBDT05GSUcpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIF9zYW5pdGl6ZUVsZW1lbnRzXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgICAqIEBwcm90ZWN0IHRleHRDb250ZW50XG4gICAgICogQHByb3RlY3QgcmVtb3ZlQ2hpbGRcbiAgICAgKiBAcGFyYW0gY3VycmVudE5vZGUgdG8gY2hlY2sgZm9yIHBlcm1pc3Npb24gdG8gZXhpc3RcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgbm9kZSB3YXMga2lsbGVkLCBmYWxzZSBpZiBsZWZ0IGFsaXZlXG4gICAgICovXG4gICAgY29uc3QgX3Nhbml0aXplRWxlbWVudHMgPSBmdW5jdGlvbiBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSkge1xuICAgICAgbGV0IGNvbnRlbnQgPSBudWxsO1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZUVsZW1lbnRzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgICAvKiBDaGVjayBpZiBlbGVtZW50IGlzIGNsb2JiZXJlZCBvciBjYW4gY2xvYmJlciAqL1xuICAgICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICAvKiBOb3cgbGV0J3MgY2hlY2sgdGhlIGVsZW1lbnQncyB0eXBlIGFuZCBuYW1lICovXG4gICAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVFbGVtZW50LCBjdXJyZW50Tm9kZSwge1xuICAgICAgICB0YWdOYW1lLFxuICAgICAgICBhbGxvd2VkVGFnczogQUxMT1dFRF9UQUdTXG4gICAgICB9KTtcbiAgICAgIC8qIERldGVjdCBtWFNTIGF0dGVtcHRzIGFidXNpbmcgbmFtZXNwYWNlIGNvbmZ1c2lvbiAqL1xuICAgICAgaWYgKGN1cnJlbnROb2RlLmhhc0NoaWxkTm9kZXMoKSAmJiAhX2lzTm9kZShjdXJyZW50Tm9kZS5maXJzdEVsZW1lbnRDaGlsZCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3XS9nLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpICYmIHJlZ0V4cFRlc3QoLzxbL1xcd10vZywgY3VycmVudE5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgLyogUmVtb3ZlIGFueSBvY2N1cnJlbmNlIG9mIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb25zICovXG4gICAgICBpZiAoY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5wcm9ncmVzc2luZ0luc3RydWN0aW9uKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgLyogUmVtb3ZlIGFueSBraW5kIG9mIHBvc3NpYmx5IGhhcm1mdWwgY29tbWVudHMgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5jb21tZW50ICYmIHJlZ0V4cFRlc3QoLzxbL1xcd10vZywgY3VycmVudE5vZGUuZGF0YSkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICAvKiBSZW1vdmUgZWxlbWVudCBpZiBhbnl0aGluZyBmb3JiaWRzIGl0cyBwcmVzZW5jZSAqL1xuICAgICAgaWYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pIHtcbiAgICAgICAgLyogQ2hlY2sgaWYgd2UgaGF2ZSBhIGN1c3RvbSBlbGVtZW50IHRvIGhhbmRsZSAqL1xuICAgICAgICBpZiAoIUZPUkJJRF9UQUdTW3RhZ05hbWVdICYmIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCh0YWdOYW1lKSkge1xuICAgICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIHRhZ05hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sodGFnTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLyogS2VlcCBjb250ZW50IGV4Y2VwdCBmb3IgYmFkLWxpc3RlZCBlbGVtZW50cyAqL1xuICAgICAgICBpZiAoS0VFUF9DT05URU5UICYmICFGT1JCSURfQ09OVEVOVFNbdGFnTmFtZV0pIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50Tm9kZShjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICBjb25zdCBjaGlsZE5vZGVzID0gZ2V0Q2hpbGROb2RlcyhjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgICBpZiAoY2hpbGROb2RlcyAmJiBwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZENvdW50ID0gY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2hpbGRDb3VudCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNoaWxkQ2xvbmUgPSBjbG9uZU5vZGUoY2hpbGROb2Rlc1tpXSwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGNoaWxkQ2xvbmUuX19yZW1vdmFsQ291bnQgPSAoY3VycmVudE5vZGUuX19yZW1vdmFsQ291bnQgfHwgMCkgKyAxO1xuICAgICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjaGlsZENsb25lLCBnZXROZXh0U2libGluZyhjdXJyZW50Tm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIENoZWNrIHdoZXRoZXIgZWxlbWVudCBoYXMgYSB2YWxpZCBuYW1lc3BhY2UgKi9cbiAgICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIV9jaGVja1ZhbGlkTmFtZXNwYWNlKGN1cnJlbnROb2RlKSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIE1ha2Ugc3VyZSB0aGF0IG9sZGVyIGJyb3dzZXJzIGRvbid0IGdldCBmYWxsYmFjay10YWcgbVhTUyAqL1xuICAgICAgaWYgKCh0YWdOYW1lID09PSAnbm9zY3JpcHQnIHx8IHRhZ05hbWUgPT09ICdub2VtYmVkJyB8fCB0YWdOYW1lID09PSAnbm9mcmFtZXMnKSAmJiByZWdFeHBUZXN0KC88XFwvbm8oc2NyaXB0fGVtYmVkfGZyYW1lcykvaSwgY3VycmVudE5vZGUuaW5uZXJIVE1MKSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8qIFNhbml0aXplIGVsZW1lbnQgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUudGV4dCkge1xuICAgICAgICAvKiBHZXQgdGhlIGVsZW1lbnQncyB0ZXh0IGNvbnRlbnQgKi9cbiAgICAgICAgY29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xuICAgICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICAgIGNvbnRlbnQgPSBzdHJpbmdSZXBsYWNlKGNvbnRlbnQsIGV4cHIsICcgJyk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQgIT09IGNvbnRlbnQpIHtcbiAgICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IGN1cnJlbnROb2RlLmNsb25lTm9kZSgpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY3VycmVudE5vZGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVFbGVtZW50cywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogX2lzVmFsaWRBdHRyaWJ1dGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsY1RhZyBMb3dlcmNhc2UgdGFnIG5hbWUgb2YgY29udGFpbmluZyBlbGVtZW50LlxuICAgICAqIEBwYXJhbSBsY05hbWUgTG93ZXJjYXNlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBBdHRyaWJ1dGUgdmFsdWUuXG4gICAgICogQHJldHVybiBSZXR1cm5zIHRydWUgaWYgYHZhbHVlYCBpcyB2YWxpZCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgICAqL1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gICAgY29uc3QgX2lzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkge1xuICAgICAgLyogTWFrZSBzdXJlIGF0dHJpYnV0ZSBjYW5ub3QgY2xvYmJlciAqL1xuICAgICAgaWYgKFNBTklUSVpFX0RPTSAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSAmJiAodmFsdWUgaW4gZG9jdW1lbnQgfHwgdmFsdWUgaW4gZm9ybUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qIEFsbG93IHZhbGlkIGRhdGEtKiBhdHRyaWJ1dGVzOiBBdCBsZWFzdCBvbmUgY2hhcmFjdGVyIGFmdGVyIFwiLVwiXG4gICAgICAgICAgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2VtYmVkZGluZy1jdXN0b20tbm9uLXZpc2libGUtZGF0YS13aXRoLXRoZS1kYXRhLSotYXR0cmlidXRlcylcbiAgICAgICAgICBYTUwtY29tcGF0aWJsZSAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5mcmFzdHJ1Y3R1cmUuaHRtbCN4bWwtY29tcGF0aWJsZSBhbmQgaHR0cDovL3d3dy53My5vcmcvVFIveG1sLyNkMGU4MDQpXG4gICAgICAgICAgV2UgZG9uJ3QgbmVlZCB0byBjaGVjayB0aGUgdmFsdWU7IGl0J3MgYWx3YXlzIFVSSSBzYWZlLiAqL1xuICAgICAgaWYgKEFMTE9XX0RBVEFfQVRUUiAmJiAhRk9SQklEX0FUVFJbbGNOYW1lXSAmJiByZWdFeHBUZXN0KERBVEFfQVRUUiwgbGNOYW1lKSkgOyBlbHNlIGlmIChBTExPV19BUklBX0FUVFIgJiYgcmVnRXhwVGVzdChBUklBX0FUVFIsIGxjTmFtZSkpIDsgZWxzZSBpZiAoIUFMTE9XRURfQVRUUltsY05hbWVdIHx8IEZPUkJJRF9BVFRSW2xjTmFtZV0pIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAvLyBGaXJzdCBjb25kaXRpb24gZG9lcyBhIHZlcnkgYmFzaWMgY2hlY2sgaWYgYSkgaXQncyBiYXNpY2FsbHkgYSB2YWxpZCBjdXN0b20gZWxlbWVudCB0YWduYW1lIEFORFxuICAgICAgICAvLyBiKSBpZiB0aGUgdGFnTmFtZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVja1xuICAgICAgICAvLyBhbmQgYykgaWYgdGhlIGF0dHJpYnV0ZSBuYW1lIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrXG4gICAgICAgIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudChsY1RhZykgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgbGNUYWcpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayhsY1RhZykpICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2ssIGxjTmFtZSkgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrKGxjTmFtZSkpIHx8XG4gICAgICAgIC8vIEFsdGVybmF0aXZlLCBzZWNvbmQgY29uZGl0aW9uIGNoZWNrcyBpZiBpdCdzIGFuIGBpc2AtYXR0cmlidXRlLCBBTkRcbiAgICAgICAgLy8gdGhlIHZhbHVlIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrXG4gICAgICAgIGxjTmFtZSA9PT0gJ2lzJyAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgdmFsdWUpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayh2YWx1ZSkpKSA7IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvKiBDaGVjayB2YWx1ZSBpcyBzYWZlLiBGaXJzdCwgaXMgYXR0ciBpbmVydD8gSWYgc28sIGlzIHNhZmUgKi9cbiAgICAgIH0gZWxzZSBpZiAoVVJJX1NBRkVfQVRUUklCVVRFU1tsY05hbWVdKSA7IGVsc2UgaWYgKHJlZ0V4cFRlc3QoSVNfQUxMT1dFRF9VUkkkMSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFLCAnJykpKSA7IGVsc2UgaWYgKChsY05hbWUgPT09ICdzcmMnIHx8IGxjTmFtZSA9PT0gJ3hsaW5rOmhyZWYnIHx8IGxjTmFtZSA9PT0gJ2hyZWYnKSAmJiBsY1RhZyAhPT0gJ3NjcmlwdCcgJiYgc3RyaW5nSW5kZXhPZih2YWx1ZSwgJ2RhdGE6JykgPT09IDAgJiYgREFUQV9VUklfVEFHU1tsY1RhZ10pIDsgZWxzZSBpZiAoQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgJiYgIXJlZ0V4cFRlc3QoSVNfU0NSSVBUX09SX0RBVEEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSwgJycpKSkgOyBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2UgO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBfaXNCYXNpY0N1c3RvbUVsZW1lbnRcbiAgICAgKiBjaGVja3MgaWYgYXQgbGVhc3Qgb25lIGRhc2ggaXMgaW5jbHVkZWQgaW4gdGFnTmFtZSwgYW5kIGl0J3Mgbm90IHRoZSBmaXJzdCBjaGFyXG4gICAgICogZm9yIG1vcmUgc29waGlzdGljYXRlZCBjaGVja2luZyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy92YWxpZGF0ZS1lbGVtZW50LW5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YWdOYW1lIG5hbWUgb2YgdGhlIHRhZyBvZiB0aGUgbm9kZSB0byBzYW5pdGl6ZVxuICAgICAqIEByZXR1cm5zIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGFnIG5hbWUgbWVldHMgdGhlIGJhc2ljIGNyaXRlcmlhIGZvciBhIGN1c3RvbSBlbGVtZW50LCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICovXG4gICAgY29uc3QgX2lzQmFzaWNDdXN0b21FbGVtZW50ID0gZnVuY3Rpb24gX2lzQmFzaWNDdXN0b21FbGVtZW50KHRhZ05hbWUpIHtcbiAgICAgIHJldHVybiB0YWdOYW1lICE9PSAnYW5ub3RhdGlvbi14bWwnICYmIHN0cmluZ01hdGNoKHRhZ05hbWUsIENVU1RPTV9FTEVNRU5UKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIF9zYW5pdGl6ZUF0dHJpYnV0ZXNcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgICAqIEBwcm90ZWN0IHJlbW92ZUF0dHJpYnV0ZVxuICAgICAqIEBwcm90ZWN0IHNldEF0dHJpYnV0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGN1cnJlbnROb2RlIHRvIHNhbml0aXplXG4gICAgICovXG4gICAgY29uc3QgX3Nhbml0aXplQXR0cmlidXRlcyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpIHtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGF0dHJpYnV0ZXNcbiAgICAgIH0gPSBjdXJyZW50Tm9kZTtcbiAgICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYXR0cmlidXRlczsgaWYgbm90IHdlIG1pZ2h0IGhhdmUgYSB0ZXh0IG5vZGUgKi9cbiAgICAgIGlmICghYXR0cmlidXRlcyB8fCBfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhvb2tFdmVudCA9IHtcbiAgICAgICAgYXR0ck5hbWU6ICcnLFxuICAgICAgICBhdHRyVmFsdWU6ICcnLFxuICAgICAgICBrZWVwQXR0cjogdHJ1ZSxcbiAgICAgICAgYWxsb3dlZEF0dHJpYnV0ZXM6IEFMTE9XRURfQVRUUixcbiAgICAgICAgZm9yY2VLZWVwQXR0cjogdW5kZWZpbmVkXG4gICAgICB9O1xuICAgICAgbGV0IGwgPSBhdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAgIC8qIEdvIGJhY2t3YXJkcyBvdmVyIGFsbCBhdHRyaWJ1dGVzOyBzYWZlbHkgcmVtb3ZlIGJhZCBvbmVzICovXG4gICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2xdO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBuYW1lc3BhY2VVUkksXG4gICAgICAgICAgdmFsdWU6IGF0dHJWYWx1ZVxuICAgICAgICB9ID0gYXR0cjtcbiAgICAgICAgY29uc3QgbGNOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMobmFtZSk7XG4gICAgICAgIGxldCB2YWx1ZSA9IG5hbWUgPT09ICd2YWx1ZScgPyBhdHRyVmFsdWUgOiBzdHJpbmdUcmltKGF0dHJWYWx1ZSk7XG4gICAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgICAgaG9va0V2ZW50LmF0dHJOYW1lID0gbGNOYW1lO1xuICAgICAgICBob29rRXZlbnQuYXR0clZhbHVlID0gdmFsdWU7XG4gICAgICAgIGhvb2tFdmVudC5rZWVwQXR0ciA9IHRydWU7XG4gICAgICAgIGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyID0gdW5kZWZpbmVkOyAvLyBBbGxvd3MgZGV2ZWxvcGVycyB0byBzZWUgdGhpcyBpcyBhIHByb3BlcnR5IHRoZXkgY2FuIHNldFxuICAgICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZUF0dHJpYnV0ZSwgY3VycmVudE5vZGUsIGhvb2tFdmVudCk7XG4gICAgICAgIHZhbHVlID0gaG9va0V2ZW50LmF0dHJWYWx1ZTtcbiAgICAgICAgLyogRnVsbCBET00gQ2xvYmJlcmluZyBwcm90ZWN0aW9uIHZpYSBuYW1lc3BhY2UgaXNvbGF0aW9uLFxuICAgICAgICAgKiBQcmVmaXggaWQgYW5kIG5hbWUgYXR0cmlidXRlcyB3aXRoIGB1c2VyLWNvbnRlbnQtYFxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKFNBTklUSVpFX05BTUVEX1BST1BTICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpKSB7XG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGlzIHZhbHVlXG4gICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgLy8gUHJlZml4IHRoZSB2YWx1ZSBhbmQgbGF0ZXIgcmUtY3JlYXRlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc2FuaXRpemVkIHZhbHVlXG4gICAgICAgICAgdmFsdWUgPSBTQU5JVElaRV9OQU1FRF9QUk9QU19QUkVGSVggKyB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIHdpdGggY29tbWVudHMgaW5zaWRlIGF0dHJpYnV0ZXMgKi9cbiAgICAgICAgaWYgKFNBRkVfRk9SX1hNTCAmJiByZWdFeHBUZXN0KC8oKC0tIT98XSk+KXw8XFwvKHN0eWxlfHRpdGxlKS9pLCB2YWx1ZSkpIHtcbiAgICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgICAgaWYgKGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLyogUmVtb3ZlIGF0dHJpYnV0ZSAqL1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICAgIGlmICghaG9va0V2ZW50LmtlZXBBdHRyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gICAgICAgIGlmICghQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSICYmIHJlZ0V4cFRlc3QoL1xcLz4vaSwgdmFsdWUpKSB7XG4gICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLyogU2FuaXRpemUgYXR0cmlidXRlIGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgICAgIHZhbHVlID0gc3RyaW5nUmVwbGFjZSh2YWx1ZSwgZXhwciwgJyAnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvKiBJcyBgdmFsdWVgIHZhbGlkIGZvciB0aGlzIGF0dHJpYnV0ZT8gKi9cbiAgICAgICAgY29uc3QgbGNUYWcgPSB0cmFuc2Zvcm1DYXNlRnVuYyhjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG4gICAgICAgIGlmICghX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgLyogSGFuZGxlIGF0dHJpYnV0ZXMgdGhhdCByZXF1aXJlIFRydXN0ZWQgVHlwZXMgKi9cbiAgICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzLmdldEF0dHJpYnV0ZVR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlVVJJKSA7IGVsc2Uge1xuICAgICAgICAgICAgc3dpdGNoICh0cnVzdGVkVHlwZXMuZ2V0QXR0cmlidXRlVHlwZShsY1RhZywgbGNOYW1lKSkge1xuICAgICAgICAgICAgICBjYXNlICdUcnVzdGVkSFRNTCc6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNhc2UgJ1RydXN0ZWRTY3JpcHRVUkwnOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZVNjcmlwdFVSTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qIEhhbmRsZSBpbnZhbGlkIGRhdGEtKiBhdHRyaWJ1dGUgc2V0IGJ5IHRyeS1jYXRjaGluZyBpdCAqL1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiBGYWxsYmFjayB0byBzZXRBdHRyaWJ1dGUoKSBmb3IgYnJvd3Nlci11bnJlY29nbml6ZWQgbmFtZXNwYWNlcyBlLmcuIFwieC1zY2hlbWFcIi4gKi9cbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheVBvcChET01QdXJpZnkucmVtb3ZlZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfVxuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplQXR0cmlidXRlcywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogX3Nhbml0aXplU2hhZG93RE9NXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZnJhZ21lbnQgdG8gaXRlcmF0ZSBvdmVyIHJlY3Vyc2l2ZWx5XG4gICAgICovXG4gICAgY29uc3QgX3Nhbml0aXplU2hhZG93RE9NID0gZnVuY3Rpb24gX3Nhbml0aXplU2hhZG93RE9NKGZyYWdtZW50KSB7XG4gICAgICBsZXQgc2hhZG93Tm9kZSA9IG51bGw7XG4gICAgICBjb25zdCBzaGFkb3dJdGVyYXRvciA9IF9jcmVhdGVOb2RlSXRlcmF0b3IoZnJhZ21lbnQpO1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTSwgZnJhZ21lbnQsIG51bGwpO1xuICAgICAgd2hpbGUgKHNoYWRvd05vZGUgPSBzaGFkb3dJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVTaGFkb3dOb2RlLCBzaGFkb3dOb2RlLCBudWxsKTtcbiAgICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgICAgX3Nhbml0aXplRWxlbWVudHMoc2hhZG93Tm9kZSk7XG4gICAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMgbmV4dCAqL1xuICAgICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKHNoYWRvd05vZGUpO1xuICAgICAgICAvKiBEZWVwIHNoYWRvdyBET00gZGV0ZWN0ZWQgKi9cbiAgICAgICAgaWYgKHNoYWRvd05vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oc2hhZG93Tm9kZS5jb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplU2hhZG93RE9NLCBmcmFnbWVudCwgbnVsbCk7XG4gICAgfTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIERPTVB1cmlmeS5zYW5pdGl6ZSA9IGZ1bmN0aW9uIChkaXJ0eSkge1xuICAgICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICBsZXQgYm9keSA9IG51bGw7XG4gICAgICBsZXQgaW1wb3J0ZWROb2RlID0gbnVsbDtcbiAgICAgIGxldCBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBsZXQgcmV0dXJuTm9kZSA9IG51bGw7XG4gICAgICAvKiBNYWtlIHN1cmUgd2UgaGF2ZSBhIHN0cmluZyB0byBzYW5pdGl6ZS5cbiAgICAgICAgRE8gTk9UIHJldHVybiBlYXJseSwgYXMgdGhpcyB3aWxsIHJldHVybiB0aGUgd3JvbmcgdHlwZSBpZlxuICAgICAgICB0aGUgdXNlciBoYXMgcmVxdWVzdGVkIGEgRE9NIG9iamVjdCByYXRoZXIgdGhhbiBhIHN0cmluZyAqL1xuICAgICAgSVNfRU1QVFlfSU5QVVQgPSAhZGlydHk7XG4gICAgICBpZiAoSVNfRU1QVFlfSU5QVVQpIHtcbiAgICAgICAgZGlydHkgPSAnPCEtLT4nO1xuICAgICAgfVxuICAgICAgLyogU3RyaW5naWZ5LCBpbiBjYXNlIGRpcnR5IGlzIGFuIG9iamVjdCAqL1xuICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycgJiYgIV9pc05vZGUoZGlydHkpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGlydHkudG9TdHJpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBkaXJ0eSA9IGRpcnR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnZGlydHkgaXMgbm90IGEgc3RyaW5nLCBhYm9ydGluZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3RvU3RyaW5nIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIFJldHVybiBkaXJ0eSBIVE1MIGlmIERPTVB1cmlmeSBjYW5ub3QgcnVuICovXG4gICAgICBpZiAoIURPTVB1cmlmeS5pc1N1cHBvcnRlZCkge1xuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgICB9XG4gICAgICAvKiBBc3NpZ24gY29uZmlnIHZhcnMgKi9cbiAgICAgIGlmICghU0VUX0NPTkZJRykge1xuICAgICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICAgIH1cbiAgICAgIC8qIENsZWFuIHVwIHJlbW92ZWQgZWxlbWVudHMgKi9cbiAgICAgIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gICAgICAvKiBDaGVjayBpZiBkaXJ0eSBpcyBjb3JyZWN0bHkgdHlwZWQgZm9yIElOX1BMQUNFICovXG4gICAgICBpZiAodHlwZW9mIGRpcnR5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBJTl9QTEFDRSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKElOX1BMQUNFKSB7XG4gICAgICAgIC8qIERvIHNvbWUgZWFybHkgcHJlLXNhbml0aXphdGlvbiB0byBhdm9pZCB1bnNhZmUgcm9vdCBub2RlcyAqL1xuICAgICAgICBpZiAoZGlydHkubm9kZU5hbWUpIHtcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZGlydHkubm9kZU5hbWUpO1xuICAgICAgICAgIGlmICghQUxMT1dFRF9UQUdTW3RhZ05hbWVdIHx8IEZPUkJJRF9UQUdTW3RhZ05hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3Jvb3Qgbm9kZSBpcyBmb3JiaWRkZW4gYW5kIGNhbm5vdCBiZSBzYW5pdGl6ZWQgaW4tcGxhY2UnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGlydHkgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIC8qIElmIGRpcnR5IGlzIGEgRE9NIGVsZW1lbnQsIGFwcGVuZCB0byBhbiBlbXB0eSBkb2N1bWVudCB0byBhdm9pZFxuICAgICAgICAgICBlbGVtZW50cyBiZWluZyBzdHJpcHBlZCBieSB0aGUgcGFyc2VyICovXG4gICAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KCc8IS0tLS0+Jyk7XG4gICAgICAgIGltcG9ydGVkTm9kZSA9IGJvZHkub3duZXJEb2N1bWVudC5pbXBvcnROb2RlKGRpcnR5LCB0cnVlKTtcbiAgICAgICAgaWYgKGltcG9ydGVkTm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLmVsZW1lbnQgJiYgaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgICAvKiBOb2RlIGlzIGFscmVhZHkgYSBib2R5LCB1c2UgYXMgaXMgKi9cbiAgICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChpbXBvcnRlZE5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBFeGl0IGRpcmVjdGx5IGlmIHdlIGhhdmUgbm90aGluZyB0byBkbyAqL1xuICAgICAgICBpZiAoIVJFVFVSTl9ET00gJiYgIVNBRkVfRk9SX1RFTVBMQVRFUyAmJiAhV0hPTEVfRE9DVU1FTlQgJiZcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgICAgIGRpcnR5LmluZGV4T2YoJzwnKSA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAgICAgfVxuICAgICAgICAvKiBJbml0aWFsaXplIHRoZSBkb2N1bWVudCB0byB3b3JrIG9uICovXG4gICAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KGRpcnR5KTtcbiAgICAgICAgLyogQ2hlY2sgd2UgaGF2ZSBhIERPTSBub2RlIGZyb20gdGhlIGRhdGEgKi9cbiAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgcmV0dXJuIFJFVFVSTl9ET00gPyBudWxsIDogUkVUVVJOX1RSVVNURURfVFlQRSA/IGVtcHR5SFRNTCA6ICcnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBSZW1vdmUgZmlyc3QgZWxlbWVudCBub2RlIChvdXJzKSBpZiBGT1JDRV9CT0RZIGlzIHNldCAqL1xuICAgICAgaWYgKGJvZHkgJiYgRk9SQ0VfQk9EWSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoYm9keS5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICAgIC8qIEdldCBub2RlIGl0ZXJhdG9yICovXG4gICAgICBjb25zdCBub2RlSXRlcmF0b3IgPSBfY3JlYXRlTm9kZUl0ZXJhdG9yKElOX1BMQUNFID8gZGlydHkgOiBib2R5KTtcbiAgICAgIC8qIE5vdyBzdGFydCBpdGVyYXRpbmcgb3ZlciB0aGUgY3JlYXRlZCBkb2N1bWVudCAqL1xuICAgICAgd2hpbGUgKGN1cnJlbnROb2RlID0gbm9kZUl0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgICAgX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpO1xuICAgICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzIG5leHQgKi9cbiAgICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSk7XG4gICAgICAgIC8qIFNoYWRvdyBET00gZGV0ZWN0ZWQsIHNhbml0aXplIGl0ICovXG4gICAgICAgIGlmIChjdXJyZW50Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShjdXJyZW50Tm9kZS5jb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogSWYgd2Ugc2FuaXRpemVkIGBkaXJ0eWAgaW4tcGxhY2UsIHJldHVybiBpdC4gKi9cbiAgICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgICB9XG4gICAgICAvKiBSZXR1cm4gc2FuaXRpemVkIHN0cmluZyBvciBET00gKi9cbiAgICAgIGlmIChSRVRVUk5fRE9NKSB7XG4gICAgICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQuY2FsbChib2R5Lm93bmVyRG9jdW1lbnQpO1xuICAgICAgICAgIHdoaWxlIChib2R5LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1hcHBlbmRcbiAgICAgICAgICAgIHJldHVybk5vZGUuYXBwZW5kQ2hpbGQoYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGJvZHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFMTE9XRURfQVRUUi5zaGFkb3dyb290IHx8IEFMTE9XRURfQVRUUi5zaGFkb3dyb290bW9kZSkge1xuICAgICAgICAgIC8qXG4gICAgICAgICAgICBBZG9wdE5vZGUoKSBpcyBub3QgdXNlZCBiZWNhdXNlIGludGVybmFsIHN0YXRlIGlzIG5vdCByZXNldFxuICAgICAgICAgICAgKGUuZy4gdGhlIHBhc3QgbmFtZXMgbWFwIG9mIGEgSFRNTEZvcm1FbGVtZW50KSwgdGhpcyBpcyBzYWZlXG4gICAgICAgICAgICBpbiB0aGVvcnkgYnV0IHdlIHdvdWxkIHJhdGhlciBub3QgcmlzayBhbm90aGVyIGF0dGFjayB2ZWN0b3IuXG4gICAgICAgICAgICBUaGUgc3RhdGUgdGhhdCBpcyBjbG9uZWQgYnkgaW1wb3J0Tm9kZSgpIGlzIGV4cGxpY2l0bHkgZGVmaW5lZFxuICAgICAgICAgICAgYnkgdGhlIHNwZWNzLlxuICAgICAgICAgICovXG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGltcG9ydE5vZGUuY2FsbChvcmlnaW5hbERvY3VtZW50LCByZXR1cm5Ob2RlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dXJuTm9kZTtcbiAgICAgIH1cbiAgICAgIGxldCBzZXJpYWxpemVkSFRNTCA9IFdIT0xFX0RPQ1VNRU5UID8gYm9keS5vdXRlckhUTUwgOiBib2R5LmlubmVySFRNTDtcbiAgICAgIC8qIFNlcmlhbGl6ZSBkb2N0eXBlIGlmIGFsbG93ZWQgKi9cbiAgICAgIGlmIChXSE9MRV9ET0NVTUVOVCAmJiBBTExPV0VEX1RBR1NbJyFkb2N0eXBlJ10gJiYgYm9keS5vd25lckRvY3VtZW50ICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUgJiYgcmVnRXhwVGVzdChET0NUWVBFX05BTUUsIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUpKSB7XG4gICAgICAgIHNlcmlhbGl6ZWRIVE1MID0gJzwhRE9DVFlQRSAnICsgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSArICc+XFxuJyArIHNlcmlhbGl6ZWRIVE1MO1xuICAgICAgfVxuICAgICAgLyogU2FuaXRpemUgZmluYWwgc3RyaW5nIHRlbXBsYXRlLXNhZmUgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgICBzZXJpYWxpemVkSFRNTCA9IHN0cmluZ1JlcGxhY2Uoc2VyaWFsaXplZEhUTUwsIGV4cHIsICcgJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoc2VyaWFsaXplZEhUTUwpIDogc2VyaWFsaXplZEhUTUw7XG4gICAgfTtcbiAgICBET01QdXJpZnkuc2V0Q29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICAgIFNFVF9DT05GSUcgPSB0cnVlO1xuICAgIH07XG4gICAgRE9NUHVyaWZ5LmNsZWFyQ29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgICAgQ09ORklHID0gbnVsbDtcbiAgICAgIFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgICB9O1xuICAgIERPTVB1cmlmeS5pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gKHRhZywgYXR0ciwgdmFsdWUpIHtcbiAgICAgIC8qIEluaXRpYWxpemUgc2hhcmVkIGNvbmZpZyB2YXJzIGlmIG5lY2Vzc2FyeS4gKi9cbiAgICAgIGlmICghQ09ORklHKSB7XG4gICAgICAgIF9wYXJzZUNvbmZpZyh7fSk7XG4gICAgICB9XG4gICAgICBjb25zdCBsY1RhZyA9IHRyYW5zZm9ybUNhc2VGdW5jKHRhZyk7XG4gICAgICBjb25zdCBsY05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhhdHRyKTtcbiAgICAgIHJldHVybiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSk7XG4gICAgfTtcbiAgICBET01QdXJpZnkuYWRkSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFycmF5UHVzaChob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgICB9O1xuICAgIERPTVB1cmlmeS5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgICAgaWYgKGhvb2tGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gYXJyYXlMYXN0SW5kZXhPZihob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIGluZGV4ID09PSAtMSA/IHVuZGVmaW5lZCA6IGFycmF5U3BsaWNlKGhvb2tzW2VudHJ5UG9pbnRdLCBpbmRleCwgMSlbMF07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyYXlQb3AoaG9va3NbZW50cnlQb2ludF0pO1xuICAgIH07XG4gICAgRE9NUHVyaWZ5LnJlbW92ZUhvb2tzID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQpIHtcbiAgICAgIGhvb2tzW2VudHJ5UG9pbnRdID0gW107XG4gICAgfTtcbiAgICBET01QdXJpZnkucmVtb3ZlQWxsSG9va3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICAgIH07XG4gICAgcmV0dXJuIERPTVB1cmlmeTtcbiAgfVxuICB2YXIgcHVyaWZ5ID0gY3JlYXRlRE9NUHVyaWZ5KCk7XG5cbiAgcmV0dXJuIHB1cmlmeTtcblxufSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHVyaWZ5LmpzLm1hcFxuIiwiaW1wb3J0IHsgUmVwbGFjZW1lbnRJbWFnZSB9IGZyb20gXCIuLi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBkb3duY2FzdCwgc3RyaW5nVG9VdGY4VWludDhBcnJheSwgdXRmOFVpbnQ4QXJyYXlUb1N0cmluZyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRGF0YUZpbGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9EYXRhRmlsZVwiXG5pbXBvcnQgeyBlbmNvZGVTVkcgfSBmcm9tIFwiLi4vZ3VpL2Jhc2UvR3VpVXRpbHMuanNcIlxuaW1wb3J0IERPTVB1cmlmeSwgeyBDb25maWcgfSBmcm9tIFwiZG9tcHVyaWZ5XCJcblxuLyoqIERhdGEgdXJsIGZvciBhbiBTVkcgaW1hZ2UgdGhhdCB3aWxsIGJlIHNob3duIGluIHBsYWNlIG9mIGV4dGVybmFsIGNvbnRlbnQuICovXG5leHBvcnQgY29uc3QgUFJFVkVOVF9FWFRFUk5BTF9JTUFHRV9MT0FESU5HX0lDT046IHN0cmluZyA9IGVuY29kZVNWRyhSZXBsYWNlbWVudEltYWdlKVxuXG4vLyBiYWNrZ3JvdW5kIGF0dHJpYnV0ZSBpcyBkZXByZWNhdGVkIGJ1dCBzdGlsbCB1c2VkIGluIGNvbW1vbiBicm93c2Vyc1xuY29uc3QgRVhURVJOQUxfQ09OVEVOVF9BVFRSUyA9IE9iamVjdC5mcmVlemUoW1xuXHRcInNyY1wiLFxuXHRcInBvc3RlclwiLFxuXHRcInNyY3NldFwiLFxuXHRcImJhY2tncm91bmRcIixcblx0XCJkcmFmdC1zcmNcIixcblx0XCJkcmFmdC1zcmNzZXRcIixcblx0XCJkcmFmdC14bGluazpocmVmXCIsXG5cdFwiZHJhZnQtaHJlZlwiLFxuXHRcInhsaW5rOmhyZWZcIixcblx0XCJocmVmXCIsXG5dKVxuXG5jb25zdCBEUkFGVF9BVFRSSUJVVEVTID0gW1wiZHJhZnQtc3JjXCIsIFwiZHJhZnQtc3Jjc2V0XCIsIFwiZHJhZnQteGxpbms6aHJlZlwiLCBcImRyYWZ0LWhyZWZcIl1cblxudHlwZSBTYW5pdGl6ZUNvbmZpZ0V4dHJhID0ge1xuXHRibG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhblxuXHRhbGxvd1JlbGF0aXZlTGlua3M6IGJvb2xlYW5cblx0dXNlUGxhY2Vob2xkZXJGb3JJbmxpbmVJbWFnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgREVGQVVMVF9DT05GSUdfRVhUUkE6IFNhbml0aXplQ29uZmlnRXh0cmEgPSBPYmplY3QuZnJlZXplKHtcblx0YmxvY2tFeHRlcm5hbENvbnRlbnQ6IHRydWUsXG5cdGFsbG93UmVsYXRpdmVMaW5rczogZmFsc2UsXG5cdHVzZVBsYWNlaG9sZGVyRm9ySW5saW5lSW1hZ2VzOiB0cnVlLFxufSlcblxuLyoqIFJlc3VsdCBvZiBzYW5pdGl6YXRpb24gb3BlcmF0aW9uIHdpdGggcmVzdWx0IGluIGEgc3RyaW5nIGZvcm0gKi9cbmV4cG9ydCB0eXBlIFNhbml0aXplZEhUTUwgPSB7XG5cdC8qKiBDbGVhbiBIVE1MIHRleHQgKi9cblx0aHRtbDogc3RyaW5nXG5cdC8qKiBOdW1iZXIgb2YgYmxvY2tlZCBleHRlcm5hbCBjb250ZW50IHRoYXQgd2FzIGVuY291bnRlcmVkICovXG5cdGJsb2NrZWRFeHRlcm5hbENvbnRlbnQ6IG51bWJlclxuXHQvKiogQ29sbGVjdGVkIGNpZDogVVJMcywgbm9ybWFsbHkgdXNlZCBmb3IgaW5saW5lIGNvbnRlbnQgKi9cblx0aW5saW5lSW1hZ2VDaWRzOiBBcnJheTxzdHJpbmc+XG5cdC8qKiBDb2xsZWN0ZWQgaHJlZiBsaW5rIGVsZW1lbnRzICovXG5cdGxpbmtzOiBBcnJheTxIVE1MRWxlbWVudD5cbn1cblxudHlwZSBTYW5pdGl6ZUNvbmZpZyA9IFNhbml0aXplQ29uZmlnRXh0cmEgJiBDb25maWdcblxuZXhwb3J0IHR5cGUgTGluayA9IEhUTUxFbGVtZW50XG5cbi8qKiBSZXN1bHQgb2Ygc2FuaXRpemF0aW9uIG9wZXJhdGlvbiB3aXRoIHJlc3VsdCBpbiBhIGZvcm0gb2YgYSBEb2N1bWVudEZyYWdtZW50ICovXG5leHBvcnQgdHlwZSBTYW5pdGl6ZWRGcmFnbWVudCA9IHtcblx0LyoqIENsZWFuIEhUTUwgZnJhZ21lbnQgKi9cblx0ZnJhZ21lbnQ6IERvY3VtZW50RnJhZ21lbnRcblx0LyoqIE51bWJlciBvZiBibG9ja2VkIGV4dGVybmFsIGNvbnRlbnQgdGhhdCB3YXMgZW5jb3VudGVyZWQgKi9cblx0YmxvY2tlZEV4dGVybmFsQ29udGVudDogbnVtYmVyXG5cdC8qKiBDb2xsZWN0ZWQgY2lkOiBVUkxzLCBub3JtYWxseSB1c2VkIGZvciBpbmxpbmUgY29udGVudCAqL1xuXHRpbmxpbmVJbWFnZUNpZHM6IEFycmF5PHN0cmluZz5cblx0LyoqIENvbGxlY3RlZCBocmVmIGxpbmsgZWxlbWVudHMgKi9cblx0bGlua3M6IEFycmF5PExpbms+XG59XG5cbi8qKiBBbGxvd2luZyBhZGRpdGlvbmFsIEhUTUwgYXR0cmlidXRlcyAqL1xuY29uc3QgQUREX0FUVFIgPSBPYmplY3QuZnJlZXplKFtcblx0Ly8gZm9yIHRhcmdldD1fYmxhbmtcblx0XCJ0YXJnZXRcIixcblx0Ly8gZm9yIGF1ZGlvIGVsZW1lbnRcblx0XCJjb250cm9sc1wiLFxuXHQvLyBmb3IgZW1iZWRkZWQgaW1hZ2VzXG5cdFwiY2lkXCIsXG5cdC8vIHRvIHBlcnNpc3Qgbm90IGxvYWRlZCBpbWFnZXNcblx0XCJkcmFmdC1zcmNcIixcblx0XCJkcmFmdC1zcmNzZXRcIixcbl0gYXMgY29uc3QpXG5cbi8qKiBUaGVzZSBtdXN0IGJlIHNhZmUgZm9yIFVSSS1saWtlIHZhbHVlcyAqL1xuY29uc3QgQUREX1VSSV9TQUZFX0FUVFIgPSBPYmplY3QuZnJlZXplKFtcblx0Ly8gZm9yIHZpZGVvIGVsZW1lbnRcblx0XCJwb3N0ZXJcIixcbl0gYXMgY29uc3QpXG5cbi8qKiBDb21wbGV0ZSBkaXNhbGxvdyBzb21lIEhUTUwgdGFncy4gKi9cbmNvbnN0IEZPUkJJRF9UQUdTID0gT2JqZWN0LmZyZWV6ZShbXG5cdC8vIHByZXZlbnQgbG9hZGluZyBvZiBleHRlcm5hbCBzdHlsZXNoZWV0cyBhbmQgZm9udHMgYnkgYmxvY2tpbmcgdGhlIHdob2xlIDxzdHlsZT4gdGFnXG5cdFwic3R5bGVcIixcbl0gYXMgY29uc3QpXG5cbi8qKiByZXN0cmljdHMgdGhlIGFsbG93ZWQgcHJvdG9jb2xzIHRvIHNvbWUgc3RhbmRhcmQgb25lcyArIG91ciB0dXRhdGVtcGxhdGUgcHJvdG9jb2wgdGhhdCBhbGxvd3MgdGhlIGtub3dsZWRnZSBiYXNlIHRvIGxpbmsgdG8gZW1haWwgdGVtcGxhdGVzLiAqL1xuY29uc3QgQUxMT1dFRF9VUklfUkVHRVhQID0gL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98Y2lkfHhtcHB8dHV0YXRlbXBsYXRlKTp8W15hLXpdfFthLXorLi1dKyg/OlteYS16Ky5cXC06XXwkKSkvaVxuXG5jb25zdCBIVE1MX0NPTkZJRzogQ29uZmlnICYgeyBSRVRVUk5fRE9NX0ZSQUdNRU5UPzogdW5kZWZpbmVkOyBSRVRVUk5fRE9NPzogdW5kZWZpbmVkIH0gPSBPYmplY3QuZnJlZXplKHtcblx0QUREX0FUVFI6IEFERF9BVFRSLnNsaWNlKCksXG5cdEFERF9VUklfU0FGRV9BVFRSOiBBRERfVVJJX1NBRkVfQVRUUi5zbGljZSgpLFxuXHRGT1JCSURfVEFHUzogRk9SQklEX1RBR1Muc2xpY2UoKSxcblx0QUxMT1dFRF9VUklfUkVHRVhQLFxufSBhcyBjb25zdClcbmNvbnN0IFNWR19DT05GSUc6IENvbmZpZyAmIHsgUkVUVVJOX0RPTV9GUkFHTUVOVD86IHVuZGVmaW5lZDsgUkVUVVJOX0RPTT86IHVuZGVmaW5lZCB9ID0gT2JqZWN0LmZyZWV6ZSh7XG5cdEFERF9BVFRSOiBBRERfQVRUUi5zbGljZSgpLFxuXHRBRERfVVJJX1NBRkVfQVRUUjogQUREX1VSSV9TQUZFX0FUVFIuc2xpY2UoKSxcblx0Rk9SQklEX1RBR1M6IEZPUkJJRF9UQUdTLnNsaWNlKCksXG5cdE5BTUVTUEFDRTogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxufSBhcyBjb25zdClcbmNvbnN0IEZSQUdNRU5UX0NPTkZJRzogQ29uZmlnICYgeyBSRVRVUk5fRE9NX0ZSQUdNRU5UOiB0cnVlIH0gPSBPYmplY3QuZnJlZXplKHtcblx0QUREX0FUVFI6IEFERF9BVFRSLnNsaWNlKCksXG5cdEFERF9VUklfU0FGRV9BVFRSOiBBRERfVVJJX1NBRkVfQVRUUi5zbGljZSgpLFxuXHRGT1JCSURfVEFHUzogRk9SQklEX1RBR1Muc2xpY2UoKSxcblx0UkVUVVJOX0RPTV9GUkFHTUVOVDogdHJ1ZSxcblx0QUxMT1dFRF9VUklfUkVHRVhQLFxufSBhcyBjb25zdClcblxudHlwZSBCYXNlQ29uZmlnID0gdHlwZW9mIEhUTUxfQ09ORklHIHwgdHlwZW9mIFNWR19DT05GSUcgfCB0eXBlb2YgRlJBR01FTlRfQ09ORklHXG5cbi8qKiBDbGFzcyB0byBwcmUtcHJvY2VzcyBIVE1ML1NWRyBjb250ZW50LiAqL1xuZXhwb3J0IGNsYXNzIEh0bWxTYW5pdGl6ZXIge1xuXHRwcml2YXRlIGV4dGVybmFsQ29udGVudCE6IG51bWJlclxuXHRwcml2YXRlIGlubGluZUltYWdlQ2lkcyE6IEFycmF5PHN0cmluZz5cblx0cHJpdmF0ZSBsaW5rcyE6IEFycmF5PExpbms+XG5cdHByaXZhdGUgcHVyaWZpZXIhOiB0eXBlb2YgRE9NUHVyaWZ5XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0aWYgKERPTVB1cmlmeS5pc1N1cHBvcnRlZCkge1xuXHRcdFx0dGhpcy5wdXJpZmllciA9IERPTVB1cmlmeVxuXHRcdFx0Ly8gRG8gY2hhbmdlcyBpbiBhZnRlclNhbml0aXplQXR0cmlidXRlcyBhbmQgbm90IGFmdGVyU2FuaXRpemVFbGVtZW50cyBzbyB0aGF0IGltYWdlcyBhcmUgbm90IHJlbW92ZWQgYWdhaW4gYmVjYXVzZSBvZiB0aGUgU1ZHcy5cblx0XHRcdHRoaXMucHVyaWZpZXIuYWRkSG9vayhcImFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzXCIsIHRoaXMuYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXMuYmluZCh0aGlzKSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU2FuaXRpemVzIHRoZSBnaXZlbiBodG1sLiBSZXR1cm5zIGFzIEhUTUxcblx0ICovXG5cdHNhbml0aXplSFRNTChodG1sOiBzdHJpbmcsIGNvbmZpZ0V4dHJhPzogUGFydGlhbDxTYW5pdGl6ZUNvbmZpZ0V4dHJhPik6IFNhbml0aXplZEhUTUwge1xuXHRcdGNvbnN0IGNvbmZpZyA9IHRoaXMuaW5pdChIVE1MX0NPTkZJRywgY29uZmlnRXh0cmEgPz8ge30pXG5cdFx0Y29uc3QgY2xlYW5IdG1sID0gdGhpcy5wdXJpZmllci5zYW5pdGl6ZShodG1sLCBjb25maWcpXG5cdFx0cmV0dXJuIHtcblx0XHRcdGh0bWw6IGNsZWFuSHRtbCxcblx0XHRcdGJsb2NrZWRFeHRlcm5hbENvbnRlbnQ6IHRoaXMuZXh0ZXJuYWxDb250ZW50LFxuXHRcdFx0aW5saW5lSW1hZ2VDaWRzOiB0aGlzLmlubGluZUltYWdlQ2lkcyxcblx0XHRcdGxpbmtzOiB0aGlzLmxpbmtzLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBTYW5pdGl6ZXMgdGhlIGdpdmVuIFNWRy4gUmV0dXJucyBhcyBTVkdcblx0ICovXG5cdHNhbml0aXplU1ZHKHN2Zzogc3RyaW5nLCBjb25maWdFeHRyYT86IFBhcnRpYWw8U2FuaXRpemVDb25maWdFeHRyYT4pOiBTYW5pdGl6ZWRIVE1MIHtcblx0XHRjb25zdCBjb25maWcgPSB0aGlzLmluaXQoU1ZHX0NPTkZJRywgY29uZmlnRXh0cmEgPz8ge30pXG5cdFx0Y29uc3QgY2xlYW5TdmcgPSB0aGlzLnB1cmlmaWVyLnNhbml0aXplKHN2ZywgY29uZmlnKVxuXHRcdHJldHVybiB7XG5cdFx0XHRodG1sOiBjbGVhblN2Zyxcblx0XHRcdGJsb2NrZWRFeHRlcm5hbENvbnRlbnQ6IHRoaXMuZXh0ZXJuYWxDb250ZW50LFxuXHRcdFx0aW5saW5lSW1hZ2VDaWRzOiB0aGlzLmlubGluZUltYWdlQ2lkcyxcblx0XHRcdGxpbmtzOiB0aGlzLmxpbmtzLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBpbmxpbmUgaW1hZ2VzIGFyZSBhdHRhY2htZW50cyB0aGF0IGFyZSByZW5kZXJlZCBhcyBwYXJ0IG9mIGFuIDxpbWc+IHRhZyB3aXRoIGEgYmxvYiBVUkwgaW4gdGhlXG5cdCAqIG1haWwgYm9keSB3aGVuIGl0J3MgZGlzcGxheWVkXG5cdCAqXG5cdCAqIHN2ZyBpbWFnZXMgY2FuIGNvbnRhaW4gbWFsaWNpb3VzIGNvZGUsIHNvIHdlIG5lZWQgdG8gc2FuaXRpemUgdGhlbSBiZWZvcmUgd2UgZGlzcGxheSB0aGVtLlxuXHQgKiBET01QdXJpZnkgY2FuIGRvIHRoYXQsIGJ1dCBjYW4ndCBoYW5kbGUgdGhlIHhtbCBkZWNsYXJhdGlvbiBhdCB0aGUgc3RhcnQgb2Ygd2VsbC1mb3JtZWQgc3ZnIGRvY3VtZW50cy5cblx0ICpcblx0ICogMS4gcGFyc2UgdGhlIGRvY3VtZW50IGFzIHhtbFxuXHQgKiAyLiBzdHJpcCB0aGUgZGVjbGFyYXRpb25cblx0ICogMy4gc2FuaXRpemVcblx0ICogNC4gYWRkIHRoZSBkZWNsYXJhdGlvbiBiYWNrIG9uXG5cdCAqXG5cdCAqIE5PVEU6IGN1cnJlbnRseSwgd2Ugb25seSBhbGxvdyBVVEYtOCBpbmxpbmUgU1ZHLlxuXHQgKiBOT1RFOiBTVkcgd2l0aCBpbmNvbXBhdGlibGUgZW5jb2RpbmdzIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhbiBlbXB0eSBmaWxlLlxuXHQgKlxuXHQgKiBAcGFyYW0gZGlydHlGaWxlIHRoZSBzdmcgRGF0YUZpbGUgYXMgcmVjZWl2ZWQgaW4gdGhlIG1haWxcblx0ICogQHJldHVybnMgY2xlYW4gYSBzYW5pdGl6ZWQgc3ZnIGRvY3VtZW50IGFzIGEgRGF0YUZpbGVcblx0ICovXG5cdHNhbml0aXplSW5saW5lQXR0YWNobWVudChkaXJ0eUZpbGU6IERhdGFGaWxlKTogRGF0YUZpbGUge1xuXHRcdGlmIChkaXJ0eUZpbGUubWltZVR5cGUgPT09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XG5cdFx0XHRsZXQgY2xlYW5lZERhdGEgPSBVaW50OEFycmF5LmZyb20oW10pXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBkaXJ0eVNWRyA9IHV0ZjhVaW50OEFycmF5VG9TdHJpbmcoZGlydHlGaWxlLmRhdGEpXG5cdFx0XHRcdGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKVxuXHRcdFx0XHRjb25zdCBkaXJ0eVRyZWUgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKGRpcnR5U1ZHLCBcImltYWdlL3N2Zyt4bWxcIilcblx0XHRcdFx0Y29uc3QgZXJycyA9IGRpcnR5VHJlZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcnNlcmVycm9yXCIpXG5cdFx0XHRcdGlmIChlcnJzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnN0IHN2Z0VsZW1lbnQgPSBkaXJ0eVRyZWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdmdcIilbMF1cblx0XHRcdFx0XHRpZiAoc3ZnRWxlbWVudCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjb25maWcgPSB0aGlzLmluaXQoU1ZHX0NPTkZJRywge30pXG5cdFx0XHRcdFx0XHRjb25zdCBjbGVhblRleHQgPSB0aGlzLnB1cmlmaWVyLnNhbml0aXplKHN2Z0VsZW1lbnQub3V0ZXJIVE1MLCBjb25maWcpXG5cdFx0XHRcdFx0XHRjbGVhbmVkRGF0YSA9IHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkoJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCIgc3RhbmRhbG9uZT1cIm5vXCI/PlxcbicgKyBjbGVhblRleHQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwic3ZnIHNhbml0aXphdGlvbiBmYWlsZWQsIHBvc3NpYmx5IGR1ZSB0byB3cm9uZyBpbnB1dCBlbmNvZGluZy5cIilcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInN2ZyBzYW5pdGl6YXRpb24gZmFpbGVkXCIpXG5cdFx0XHR9XG5cdFx0XHRkaXJ0eUZpbGUuZGF0YSA9IGNsZWFuZWREYXRhXG5cdFx0fVxuXHRcdHJldHVybiBkaXJ0eUZpbGVcblx0fVxuXG5cdC8qKlxuXHQgKiBTYW5pdGl6ZXMgZ2l2ZW4gSFRNTC4gUmV0dXJucyBhIERvY3VtZW50RnJhZ21lbnQgaW5zdGVhZCBvZiBhbiBIVE1MIHN0cmluZ1xuXHQgKi9cblx0c2FuaXRpemVGcmFnbWVudChodG1sOiBzdHJpbmcsIGNvbmZpZ0V4dHJhPzogUGFydGlhbDxTYW5pdGl6ZUNvbmZpZ0V4dHJhPik6IFNhbml0aXplZEZyYWdtZW50IHtcblx0XHRjb25zdCBjb25maWcgPSB0aGlzLmluaXQoRlJBR01FTlRfQ09ORklHLCBjb25maWdFeHRyYSA/PyB7fSlcblx0XHRjb25zdCBjbGVhbkZyYWdtZW50ID0gdGhpcy5wdXJpZmllci5zYW5pdGl6ZShodG1sLCBjb25maWcpXG5cdFx0cmV0dXJuIHtcblx0XHRcdGZyYWdtZW50OiBjbGVhbkZyYWdtZW50LFxuXHRcdFx0YmxvY2tlZEV4dGVybmFsQ29udGVudDogdGhpcy5leHRlcm5hbENvbnRlbnQsXG5cdFx0XHRpbmxpbmVJbWFnZUNpZHM6IHRoaXMuaW5saW5lSW1hZ2VDaWRzLFxuXHRcdFx0bGlua3M6IHRoaXMubGlua3MsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBpbml0PFQgZXh0ZW5kcyBCYXNlQ29uZmlnPihjb25maWc6IFQsIGNvbmZpZ0V4dHJhOiBQYXJ0aWFsPFNhbml0aXplQ29uZmlnRXh0cmE+KTogU2FuaXRpemVDb25maWdFeHRyYSAmIFQge1xuXHRcdHRoaXMuZXh0ZXJuYWxDb250ZW50ID0gMFxuXHRcdHRoaXMuaW5saW5lSW1hZ2VDaWRzID0gW11cblx0XHR0aGlzLmxpbmtzID0gW11cblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnLCBERUZBVUxUX0NPTkZJR19FWFRSQSwgY29uZmlnRXh0cmEpXG5cdH1cblxuXHRwcml2YXRlIGFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlOiBFbGVtZW50LCBkYXRhOiBudWxsLCBjb25maWc6IENvbmZpZykge1xuXHRcdGNvbnN0IHR5cGVkQ29uZmlnID0gY29uZmlnIGFzIFNhbml0aXplQ29uZmlnXG5cdFx0Ly8gcmVtb3ZlIGN1c3RvbSBjc3MgY2xhc3NlcyBhcyB3ZSBkbyBub3QgYWxsb3cgc3R5bGUgZGVmaW5pdGlvbnMuIGN1c3RvbSBjc3MgY2xhc3NlcyBjYW4gYmUgaW4gY29uZmxpY3QgdG8gb3VyIHNlbGYgZGVmaW5lZCBjbGFzc2VzLlxuXHRcdC8vIGp1c3QgYWxsb3cgb3VyIG93biBcInR1dGFub3RhX3F1b3RlXCIgY2xhc3MgYW5kIE1zb0xpc3RQYXJhZ3JhcGggY2xhc3NlcyBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIE91dGxvb2sgMjAxMC8yMDEzIGVtYWlscy4gc2VlIG1haW4tc3R5bGVzLmpzXG5cdFx0bGV0IGFsbG93ZWRDbGFzc2VzID0gW1xuXHRcdFx0XCJ0dXRhbm90YV9pbmRlbnRlZFwiLFxuXHRcdFx0XCJ0dXRhbm90YV9xdW90ZVwiLFxuXHRcdFx0XCJNc29MaXN0UGFyYWdyYXBoXCIsXG5cdFx0XHRcIk1zb0xpc3RQYXJhZ3JhcGhDeFNwRmlyc3RcIixcblx0XHRcdFwiTXNvTGlzdFBhcmFncmFwaEN4U3BNaWRkbGVcIixcblx0XHRcdFwiTXNvTGlzdFBhcmFncmFwaEN4U3BMYXN0XCIsXG5cdFx0XVxuXG5cdFx0aWYgKGN1cnJlbnROb2RlLmNsYXNzTGlzdCkge1xuXHRcdFx0bGV0IGNsID0gY3VycmVudE5vZGUuY2xhc3NMaXN0XG5cblx0XHRcdGZvciAobGV0IGkgPSBjbC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRjb25zdCBpdGVtID0gY2wuaXRlbShpKVxuXG5cdFx0XHRcdGlmIChpdGVtICYmIGFsbG93ZWRDbGFzc2VzLmluZGV4T2YoaXRlbSkgPT09IC0xKSB7XG5cdFx0XHRcdFx0Y2wucmVtb3ZlKGl0ZW0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnJlcGxhY2VBdHRyaWJ1dGVzKGN1cnJlbnROb2RlIGFzIEhUTUxFbGVtZW50LCB0eXBlZENvbmZpZylcblxuXHRcdHRoaXMucHJvY2Vzc0xpbmsoY3VycmVudE5vZGUgYXMgSFRNTEVsZW1lbnQsIHR5cGVkQ29uZmlnKVxuXG5cdFx0cmV0dXJuIGN1cnJlbnROb2RlXG5cdH1cblxuXHRwcml2YXRlIHJlcGxhY2VBdHRyaWJ1dGVzKGh0bWxOb2RlOiBIVE1MRWxlbWVudCwgY29uZmlnOiBTYW5pdGl6ZUNvbmZpZykge1xuXHRcdC8vIERvbid0IGFsbG93IGlubGluZSBpbWFnZXMgdG8gaGF2ZSBhIGJpZ2dlciB3aWR0aCB0aGFuIHRoZSBlbWFpbCBpdHNlbGZcblx0XHQvLyBPdGhlcndpc2UgdGhpcyB3b3VsZCBsZWFkIHRvIHdlaXJkIHJlbmRlcmluZyB3aXRoIHZlcnkgbGFyZ2UgaW1hZ2VzIGFuZCBwaW5jaCB6b29tXG5cdFx0Ly8gVGhlIG9yZGVyIG9mIHRoZSByZXBsYWNlbWVudCBzaG91bGQgbm90IGJlIGNoYW5nZWQgc2luY2UgbWF4V2lkdGg9MTAwJSBpcyByZXBsYWNlZCB3aXRoIDEwMHB4IGluIGNhc2Ugb2Zcblx0XHQvLyBwbGFjZWhvbGRlciBpbWFnZXMgZnVydGhlciBiZWxvdyBpbiB0aGUgY29kZVxuXHRcdGlmIChodG1sTm9kZS50YWdOYW1lID09PSBcIklNR1wiKSB7XG5cdFx0XHRodG1sTm9kZS5zdHlsZS5tYXhXaWR0aCA9IFwiMTAwJVwiXG5cdFx0fVxuXG5cdFx0aWYgKGh0bWxOb2RlLmF0dHJpYnV0ZXMpIHtcblx0XHRcdHRoaXMucmVwbGFjZUF0dHJpYnV0ZVZhbHVlKGh0bWxOb2RlLCBjb25maWcpXG5cdFx0fVxuXG5cdFx0aWYgKGh0bWxOb2RlLnN0eWxlKSB7XG5cdFx0XHRpZiAoY29uZmlnLmJsb2NrRXh0ZXJuYWxDb250ZW50KSB7XG5cdFx0XHRcdC8vIGZvciBhIGRlY2VudCB0YWJsZSBvZiB3aGVyZSA8aW1hZ2U+IENTUyB0eXBlIGNhbiBvY2N1ciBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL2ltYWdlXG5cdFx0XHRcdGlmIChodG1sTm9kZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UpIHtcblx0XHRcdFx0XHR0aGlzLnJlcGxhY2VTdHlsZUltYWdlKGh0bWxOb2RlLCBcImJhY2tncm91bmRJbWFnZVwiLCBmYWxzZSlcblxuXHRcdFx0XHRcdGh0bWxOb2RlLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSBcIm5vLXJlcGVhdFwiXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaHRtbE5vZGUuc3R5bGUubGlzdFN0eWxlSW1hZ2UpIHtcblx0XHRcdFx0XHR0aGlzLnJlcGxhY2VTdHlsZUltYWdlKGh0bWxOb2RlLCBcImxpc3RTdHlsZUltYWdlXCIsIHRydWUpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaHRtbE5vZGUuc3R5bGUuY29udGVudCkge1xuXHRcdFx0XHRcdHRoaXMucmVwbGFjZVN0eWxlSW1hZ2UoaHRtbE5vZGUsIFwiY29udGVudFwiLCB0cnVlKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGh0bWxOb2RlLnN0eWxlLmN1cnNvcikge1xuXHRcdFx0XHRcdHRoaXMucmVtb3ZlU3R5bGVJbWFnZShodG1sTm9kZSwgXCJjdXJzb3JcIilcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChodG1sTm9kZS5zdHlsZS5maWx0ZXIpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZVN0eWxlSW1hZ2UoaHRtbE5vZGUsIFwiZmlsdGVyXCIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaHRtbE5vZGUuc3R5bGUuYm9yZGVySW1hZ2VTb3VyY2UpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZVN0eWxlSW1hZ2UoaHRtbE5vZGUsIFwiYm9yZGVyLWltYWdlLXNvdXJjZVwiKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGh0bWxOb2RlLnN0eWxlLm1hc2tJbWFnZSB8fCBodG1sTm9kZS5zdHlsZS53ZWJraXRNYXNrSW1hZ2UpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZVN0eWxlSW1hZ2UoaHRtbE5vZGUsIFwibWFzay1pbWFnZVwiKVxuXHRcdFx0XHRcdHRoaXMucmVtb3ZlU3R5bGVJbWFnZShodG1sTm9kZSwgXCItd2Via2l0LW1hc2staW1hZ2VcIilcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChodG1sTm9kZS5zdHlsZS5zaGFwZU91dHNpZGUpIHtcblx0XHRcdFx0XHR0aGlzLnJlbW92ZVN0eWxlSW1hZ2UoaHRtbE5vZGUsIFwic2hhcGUtb3V0c2lkZVwiKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIERpc2FsbG93IHBvc2l0aW9uIGJlY2F1c2UgeW91IGNhbiBkbyBiYWQgdGhpbmdzIHdpdGggaXQgYW5kIGl0IGFsc28gbWVzc2VzIHVwIGxheW91dFxuXHRcdFx0Ly8gRG8gdGhpcyB1bmNvbmRpdGlvbmFsbHksIGluZGVwZW5kZW50IGZyb20gdGhlIGV4dGVybmFsIGNvbnRlbnQgYmxvY2tpbmcuXG5cdFx0XHRpZiAoaHRtbE5vZGUuc3R5bGUucG9zaXRpb24pIHtcblx0XHRcdFx0aHRtbE5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCJwb3NpdGlvblwiKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVwbGFjZUF0dHJpYnV0ZVZhbHVlKGh0bWxOb2RlOiBIVE1MRWxlbWVudCwgY29uZmlnOiBTYW5pdGl6ZUNvbmZpZykge1xuXHRcdGNvbnN0IG5vZGVOYW1lID0gaHRtbE5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG5cblx0XHRmb3IgKGNvbnN0IGF0dHJOYW1lIG9mIEVYVEVSTkFMX0NPTlRFTlRfQVRUUlMpIHtcblx0XHRcdGxldCBhdHRyaWJ1dGUgPSBodG1sTm9kZS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShhdHRyTmFtZSlcblxuXHRcdFx0aWYgKGF0dHJpYnV0ZSkge1xuXHRcdFx0XHRpZiAoY29uZmlnLnVzZVBsYWNlaG9sZGVyRm9ySW5saW5lSW1hZ2VzICYmIGF0dHJpYnV0ZS52YWx1ZS5zdGFydHNXaXRoKFwiY2lkOlwiKSkge1xuXHRcdFx0XHRcdC8vIHJlcGxhY2UgZW1iZWRkZWQgaW1hZ2Ugd2l0aCBsb2NhbCBpbWFnZSB1bnRpbCB0aGUgZW1iZWRkZWQgaW1hZ2UgaXMgbG9hZGVkIGFuZCByZWFkeSB0byBiZSBzaG93bi5cblx0XHRcdFx0XHRjb25zdCBjaWQgPSBhdHRyaWJ1dGUudmFsdWUuc3Vic3RyaW5nKDQpXG5cblx0XHRcdFx0XHR0aGlzLmlubGluZUltYWdlQ2lkcy5wdXNoKGNpZClcblxuXHRcdFx0XHRcdGF0dHJpYnV0ZS52YWx1ZSA9IFBSRVZFTlRfRVhURVJOQUxfSU1BR0VfTE9BRElOR19JQ09OXG5cdFx0XHRcdFx0aHRtbE5vZGUuc2V0QXR0cmlidXRlKFwiY2lkXCIsIGNpZClcblx0XHRcdFx0XHRodG1sTm9kZS5jbGFzc0xpc3QuYWRkKFwidHV0YW5vdGEtcGxhY2Vob2xkZXJcIilcblx0XHRcdFx0fSBlbHNlIGlmIChjb25maWcuYmxvY2tFeHRlcm5hbENvbnRlbnQgJiYgYXR0cmlidXRlLm5hbWUgPT09IFwic3Jjc2V0XCIpIHtcblx0XHRcdFx0XHR0aGlzLmV4dGVybmFsQ29udGVudCsrXG5cblx0XHRcdFx0XHRodG1sTm9kZS5zZXRBdHRyaWJ1dGUoXCJkcmFmdC1zcmNzZXRcIiwgYXR0cmlidXRlLnZhbHVlKVxuXHRcdFx0XHRcdGh0bWxOb2RlLnJlbW92ZUF0dHJpYnV0ZShcInNyY3NldFwiKVxuXHRcdFx0XHRcdGh0bWxOb2RlLnNldEF0dHJpYnV0ZShcInNyY1wiLCBQUkVWRU5UX0VYVEVSTkFMX0lNQUdFX0xPQURJTkdfSUNPTilcblx0XHRcdFx0XHRodG1sTm9kZS5zdHlsZS5tYXhXaWR0aCA9IFwiMTAwcHhcIlxuXHRcdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRcdGNvbmZpZy5ibG9ja0V4dGVybmFsQ29udGVudCAmJlxuXHRcdFx0XHRcdCFhdHRyaWJ1dGUudmFsdWUuc3RhcnRzV2l0aChcImRhdGE6XCIpICYmXG5cdFx0XHRcdFx0IWF0dHJpYnV0ZS52YWx1ZS5zdGFydHNXaXRoKFwiY2lkOlwiKSAmJlxuXHRcdFx0XHRcdCFhdHRyaWJ1dGUubmFtZS5zdGFydHNXaXRoKFwiZHJhZnQtXCIpICYmXG5cdFx0XHRcdFx0IShub2RlTmFtZSA9PT0gXCJhXCIpICYmXG5cdFx0XHRcdFx0IShub2RlTmFtZSA9PT0gXCJhcmVhXCIpICYmXG5cdFx0XHRcdFx0IShub2RlTmFtZSA9PT0gXCJiYXNlXCIpICYmXG5cdFx0XHRcdFx0IShub2RlTmFtZSA9PT0gXCJsaW5rXCIpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdC8vIFNpbmNlIHdlIGFyZSBibG9ja2luZyBocmVmIG5vdyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBhdHRyIGlzbid0XG5cdFx0XHRcdFx0Ly8gYmVpbmcgdXNlZCBieSBhIHZhbGlkIHRhZyAoYSwgYXJlYSwgYmFzZSwgbGluaylcblx0XHRcdFx0XHR0aGlzLmV4dGVybmFsQ29udGVudCsrXG5cblx0XHRcdFx0XHRodG1sTm9kZS5zZXRBdHRyaWJ1dGUoXCJkcmFmdC1cIiArIGF0dHJpYnV0ZS5uYW1lLCBhdHRyaWJ1dGUudmFsdWUpXG5cdFx0XHRcdFx0YXR0cmlidXRlLnZhbHVlID0gUFJFVkVOVF9FWFRFUk5BTF9JTUFHRV9MT0FESU5HX0lDT05cblx0XHRcdFx0XHRodG1sTm9kZS5hdHRyaWJ1dGVzLnNldE5hbWVkSXRlbShhdHRyaWJ1dGUpXG5cdFx0XHRcdFx0aHRtbE5vZGUuc3R5bGUubWF4V2lkdGggPSBcIjEwMHB4XCJcblx0XHRcdFx0fSBlbHNlIGlmICghY29uZmlnLmJsb2NrRXh0ZXJuYWxDb250ZW50ICYmIERSQUZUX0FUVFJJQlVURVMuaW5jbHVkZXMoYXR0cmlidXRlLm5hbWUpKSB7XG5cdFx0XHRcdFx0aWYgKGF0dHJpYnV0ZS5uYW1lID09PSBcImRyYWZ0LXNyY1wiKSB7XG5cdFx0XHRcdFx0XHRodG1sTm9kZS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgYXR0cmlidXRlLnZhbHVlKVxuXHRcdFx0XHRcdFx0aHRtbE5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoYXR0cmlidXRlLm5hbWUgPT09IFwiZHJhZnQtaHJlZlwiIHx8IGF0dHJpYnV0ZS5uYW1lID09PSBcImRyYWZ0LXhsaW5rOmhyZWZcIikge1xuXHRcdFx0XHRcdFx0Y29uc3QgaHJlZlRhZyA9IGF0dHJpYnV0ZS5uYW1lID09PSBcImRyYWZ0LWhyZWZcIiA/IFwiaHJlZlwiIDogXCJ4bGluazpocmVmXCJcblx0XHRcdFx0XHRcdGh0bWxOb2RlLnNldEF0dHJpYnV0ZShocmVmVGFnLCBhdHRyaWJ1dGUudmFsdWUpXG5cdFx0XHRcdFx0XHRodG1sTm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGh0bWxOb2RlLnNldEF0dHJpYnV0ZShcInNyY3NldFwiLCBhdHRyaWJ1dGUudmFsdWUpXG5cdFx0XHRcdFx0XHRodG1sTm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqIE5CISB7QHBhcmFtIGNzc1N0eWxlQXR0cmlidXRlTmFtZX0gaXMgYSAqQ1NTKiBuYW1lIChcImJvcmRlci1pbWFnZS1zb3VyY2VcIiBhcyBvcHBvc2VkIHRvIFwiYm9yZGVySW1hZ2VTb3VyY2VcIikuICovXG5cdHByaXZhdGUgcmVtb3ZlU3R5bGVJbWFnZShodG1sTm9kZTogSFRNTEVsZW1lbnQsIGNzc1N0eWxlQXR0cmlidXRlTmFtZTogc3RyaW5nKSB7XG5cdFx0bGV0IHZhbHVlID0gaHRtbE5vZGUuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShjc3NTdHlsZUF0dHJpYnV0ZU5hbWUpXG5cblx0XHRpZiAodmFsdWUubWF0Y2goL3VybFxcKC8pKSB7XG5cdFx0XHR0aGlzLmV4dGVybmFsQ29udGVudCsrXG5cblx0XHRcdGh0bWxOb2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KGNzc1N0eWxlQXR0cmlidXRlTmFtZSlcblx0XHR9XG5cdH1cblxuXHQvKioge0BwYXJhbSBzdHlsZUF0dHJpYnV0ZU5hbWV9IGlzIGEgSlMgbmFtZSBmb3IgdGhlIHN0eWxlICovXG5cdHByaXZhdGUgcmVwbGFjZVN0eWxlSW1hZ2UoaHRtbE5vZGU6IEhUTUxFbGVtZW50LCBzdHlsZUF0dHJpYnV0ZU5hbWU6IHN0cmluZywgbGltaXRXaWR0aDogYm9vbGVhbikge1xuXHRcdGxldCB2YWx1ZTogc3RyaW5nID0gKGh0bWxOb2RlLnN0eWxlIGFzIGFueSlbc3R5bGVBdHRyaWJ1dGVOYW1lXVxuXG5cdFx0Ly8gaWYgdGhlcmUncyBhIGB1cmwoYCBhbnl3aGVyZSBpbiB0aGUgdmFsdWUgYW5kIGlmICp0aGUgd2hvbGUqIHZhbHVlIGlzIG5vdCBqdXN0IGRhdGEgVVJMIHRoZW4gcmVwbGFjZSB0aGUgd2hvbGUgdmFsdWUgd2l0aCByZXBsYWNlbWVudCBVUkxcblx0XHQvLyBzZWUgdGVzdHMgZm9yIHRyZWFjaGVyb3VzIGV4YW1wbGUgYnV0IGFsc29cblx0XHQvL1xuXHRcdC8vIGBgYGNzc1xuXHRcdC8vIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudChcblx0XHQvLyAgICAgdG8gYm90dG9tLFxuXHRcdC8vICAgICByZ2JhKDI1NSwgMjU1LCAwLCAwLjUpLFxuXHRcdC8vICAgICByZ2JhKDAsIDAsIDI1NSwgMC41KVxuXHRcdC8vICAgKSwgdXJsKFwiY2F0ZnJvbnQucG5nXCIpO1xuXHRcdC8vIGBgYFxuXHRcdC8vIGluIHRoaXMgY2FzZSBiYWNrZ3JvdW5kLWltYWdlIGNhbiBoYXZlIG11bHRpcGxlIHZhbHVlcyBidXQgaXQncyBzYWZlIHRvIGp1c3QgYmxvY2sgdGhlIHdob2xlIHRoaW5nXG5cdFx0Ly9cblx0XHQvLyBzb21lIGV4YW1wbGVzIHdoZXJlIGl0IGNhbiBiZSBpbnNpZGUgYSBzaW5nbGUgPGltYWdlPiB2YWx1ZTpcblx0XHQvL1xuXHRcdC8vIGNyb3NzLWZhZGUoMjAlIHVybCh0d2VudHkucG5nKSwgdXJsKGVpZ2h0eS5wbmcpKVxuXHRcdC8vIGltYWdlLXNldCgndGVzdC5qcGcnIDF4LCAndGVzdC0yeC5qcGcnIDJ4KVxuXHRcdGlmICh2YWx1ZS5pbmNsdWRlcyhcInVybChcIikgJiYgdmFsdWUubWF0Y2goL3VybFxcKC9nKT8ubGVuZ3RoICE9PSB2YWx1ZS5tYXRjaCgvdXJsXFwoW1wiJ10/ZGF0YTovZyk/Lmxlbmd0aCkge1xuXHRcdFx0dGhpcy5leHRlcm5hbENvbnRlbnQrK1xuXHRcdFx0OyhodG1sTm9kZS5zdHlsZSBhcyBhbnkpW3N0eWxlQXR0cmlidXRlTmFtZV0gPSBgdXJsKFwiJHtQUkVWRU5UX0VYVEVSTkFMX0lNQUdFX0xPQURJTkdfSUNPTn1cIilgXG5cblx0XHRcdGlmIChsaW1pdFdpZHRoKSB7XG5cdFx0XHRcdGh0bWxOb2RlLnN0eWxlLm1heFdpZHRoID0gXCIxMDBweFwiXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBwcm9jZXNzTGluayhjdXJyZW50Tm9kZTogSFRNTEVsZW1lbnQsIGNvbmZpZzogU2FuaXRpemVDb25maWcpIHtcblx0XHQvLyBzZXQgdGFyZ2V0PVwiX2JsYW5rXCIgZm9yIGFsbCBsaW5rc1xuXHRcdC8vIGNvbGxlY3QgdGhlbVxuXHRcdGlmIChcblx0XHRcdGN1cnJlbnROb2RlLnRhZ05hbWUgJiZcblx0XHRcdChjdXJyZW50Tm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiYVwiIHx8IGN1cnJlbnROb2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJhcmVhXCIgfHwgY3VycmVudE5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImZvcm1cIilcblx0XHQpIHtcblx0XHRcdGNvbnN0IGhyZWYgPSBjdXJyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpXG5cdFx0XHRpZiAoaHJlZikgdGhpcy5saW5rcy5wdXNoKGN1cnJlbnROb2RlKVxuXG5cdFx0XHRpZiAoY29uZmlnLmFsbG93UmVsYXRpdmVMaW5rcyB8fCAhaHJlZiB8fCBpc0FsbG93ZWRMaW5rKGhyZWYpKSB7XG5cdFx0XHRcdGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShcInJlbFwiLCBcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIilcblx0XHRcdFx0Y3VycmVudE5vZGUuc2V0QXR0cmlidXRlKFwidGFyZ2V0XCIsIFwiX2JsYW5rXCIpXG5cdFx0XHR9IGVsc2UgaWYgKGhyZWYudHJpbSgpID09PSBcIntsaW5rfVwiKSB7XG5cdFx0XHRcdC8vIG5vdGlmaWNhdGlvbiBtYWlsIHRlbXBsYXRlXG5cdFx0XHRcdGRvd25jYXN0KGN1cnJlbnROb2RlKS5ocmVmID0gXCJ7bGlua31cIlxuXHRcdFx0XHRjdXJyZW50Tm9kZS5zZXRBdHRyaWJ1dGUoXCJyZWxcIiwgXCJub29wZW5lciBub3JlZmVycmVyXCIpXG5cdFx0XHRcdGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShcInRhcmdldFwiLCBcIl9ibGFua1wiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJSZWxhdGl2ZS9pbnZhbGlkIFVSTFwiLCBjdXJyZW50Tm9kZSwgaHJlZilcblx0XHRcdFx0ZG93bmNhc3QoY3VycmVudE5vZGUpLmhyZWYgPSBcImphdmFzY3JpcHQ6dm9pZCgwKVwiXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGlzQWxsb3dlZExpbmsobGluazogc3RyaW5nKTogYm9vbGVhbiB7XG5cdHRyeSB7XG5cdFx0Ly8gV2UgY3JlYXRlIFVSTCB3aXRob3V0IGV4cGxpY2l0IGJhc2UgKHNlY29uZCBhcmd1bWVudCkuIEl0IGlzIGFuIGVycm9yIGZvciByZWxhdGl2ZSBsaW5rc1xuXHRcdHJldHVybiBuZXcgVVJMKGxpbmspLnByb3RvY29sICE9PSBcImZpbGU6XCJcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBodG1sU2FuaXRpemVyOiBIdG1sU2FuaXRpemVyID0gbmV3IEh0bWxTYW5pdGl6ZXIoKVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUVBLEVBQUMsU0FBVSxRQUFRLFNBQVM7QUFDMUIsU0FBTyxZQUFZLG1CQUFtQixXQUFXLGNBQWMsT0FBTyxVQUFVLFNBQVMsVUFDbEYsV0FBVyxjQUFjLE9BQU8sTUFBTSxPQUFPLFFBQVEsSUFDM0QsZ0JBQWdCLGVBQWUsY0FBYyxhQUFhLFVBQVUsTUFBTSxPQUFPLFlBQVksU0FBUztDQUN4RyxZQUFTLFdBQVk7QUFBRTtFQUV0QixNQUFNLEVBQ0osU0FDQSxnQkFDQSxVQUNBLGdCQUNBLDBCQUNELEdBQUc7RUFDSixJQUFJLEVBQ0YsUUFDQSxNQUNBLFFBQ0QsR0FBRztFQUNKLElBQUksRUFDRixPQUNBLFdBQ0QsVUFBVSxZQUFZLGVBQWU7QUFDdEMsT0FBSyxPQUNILFVBQVMsU0FBU0EsU0FBTyxHQUFHO0FBQzFCLFVBQU87RUFDUjtBQUVILE9BQUssS0FDSCxRQUFPLFNBQVNDLE9BQUssR0FBRztBQUN0QixVQUFPO0VB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