import { __toESM } from "./chunk-chunk.js";
import { BrowserType, client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, defer, numberRange } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { animations, height, opacity } from "./styles-chunk.js";
import { TabIndex } from "./TutanotaConstants-chunk.js";
import { px, size } from "./size-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, DropDownSelector, TextFieldType, createDropdown } from "./Dialog-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { ToggleButton } from "./ToggleButton-chunk.js";
import { htmlSanitizer } from "./HtmlSanitizer-chunk.js";

//#region libs/squire-raw.mjs
var SHOW_ELEMENT = 1;
var SHOW_TEXT = 4;
var SHOW_ELEMENT_OR_TEXT = 5;
var always = () => true;
var TreeIterator = class {
	constructor(root, nodeType, filter) {
		this.root = root;
		this.currentNode = root;
		this.nodeType = nodeType;
		this.filter = filter || always;
	}
	isAcceptableNode(node) {
		const nodeType = node.nodeType;
		const nodeFilterType = nodeType === Node.ELEMENT_NODE ? SHOW_ELEMENT : nodeType === Node.TEXT_NODE ? SHOW_TEXT : 0;
		return !!(nodeFilterType & this.nodeType) && this.filter(node);
	}
	nextNode() {
		const root = this.root;
		let current = this.currentNode;
		let node;
		while (true) {
			node = current.firstChild;
			while (!node && current) {
				if (current === root) break;
				node = current.nextSibling;
				if (!node) current = current.parentNode;
			}
			if (!node) return null;
			if (this.isAcceptableNode(node)) {
				this.currentNode = node;
				return node;
			}
			current = node;
		}
	}
	previousNode() {
		const root = this.root;
		let current = this.currentNode;
		let node;
		while (true) {
			if (current === root) return null;
			node = current.previousSibling;
			if (node) while (current = node.lastChild) node = current;
else node = current.parentNode;
			if (!node) return null;
			if (this.isAcceptableNode(node)) {
				this.currentNode = node;
				return node;
			}
			current = node;
		}
	}
	previousPONode() {
		const root = this.root;
		let current = this.currentNode;
		let node;
		while (true) {
			node = current.lastChild;
			while (!node && current) {
				if (current === root) break;
				node = current.previousSibling;
				if (!node) current = current.parentNode;
			}
			if (!node) return null;
			if (this.isAcceptableNode(node)) {
				this.currentNode = node;
				return node;
			}
			current = node;
		}
	}
};
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var ZWS = "​";
var ua = navigator.userAgent;
var isMac = /Mac OS X/.test(ua);
var isWin = /Windows NT/.test(ua);
var isIOS = /iP(?:ad|hone|od)/.test(ua) || isMac && !!navigator.maxTouchPoints;
var isAndroid = /Android/.test(ua);
var isGecko = /Gecko\//.test(ua);
var isLegacyEdge = /Edge\//.test(ua);
var isWebKit = !isLegacyEdge && /WebKit\//.test(ua);
var ctrlKey = isMac || isIOS ? "Meta-" : "Ctrl-";
var cantFocusEmptyTextNodes = isWebKit;
var supportsInputEvents = "onbeforeinput" in document && "inputType" in new InputEvent("input");
var notWS = /[^ \t\r\n]/;
var indentedNodeAttributes = {
	class: "tutanota_indented",
	style: "margin-left: 40px"
};
var inlineNodeNames = /^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|EL|FN)|EM|FONT|HR|I(?:FRAME|MG|NPUT|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:AMP|MALL|PAN|TR(?:IKE|ONG)|U[BP])?|TIME|U|VAR|WBR)$/;
var leafNodeNames = /* @__PURE__ */ new Set([
	"BR",
	"HR",
	"IFRAME",
	"IMG",
	"INPUT"
]);
var UNKNOWN = 0;
var INLINE = 1;
var BLOCK = 2;
var CONTAINER = 3;
var cache = /* @__PURE__ */ new WeakMap();
var resetNodeCategoryCache = () => {
	cache = /* @__PURE__ */ new WeakMap();
};
var isLeaf = (node) => {
	return leafNodeNames.has(node.nodeName);
};
var getNodeCategory = (node) => {
	switch (node.nodeType) {
		case TEXT_NODE: return INLINE;
		case ELEMENT_NODE:
		case DOCUMENT_FRAGMENT_NODE:
			if (cache.has(node)) return cache.get(node);
			break;
		default: return UNKNOWN;
	}
	let nodeCategory;
	if (!Array.from(node.childNodes).every(isInline)) nodeCategory = CONTAINER;
else if (inlineNodeNames.test(node.nodeName)) nodeCategory = INLINE;
else nodeCategory = BLOCK;
	cache.set(node, nodeCategory);
	return nodeCategory;
};
var isInline = (node) => {
	return getNodeCategory(node) === INLINE;
};
var isBlock = (node) => {
	return getNodeCategory(node) === BLOCK;
};
var isContainer = (node) => {
	return getNodeCategory(node) === CONTAINER;
};
var createElement = (tag, props, children) => {
	const el = document.createElement(tag);
	if (props instanceof Array) {
		children = props;
		props = null;
	}
	if (props) for (const attr in props) {
		const value = props[attr];
		if (value !== void 0) el.setAttribute(attr, value);
	}
	if (children) children.forEach((node) => el.appendChild(node));
	return el;
};
var areAlike = (node, node2) => {
	if (isLeaf(node)) return false;
	if (node.nodeType !== node2.nodeType || node.nodeName !== node2.nodeName) return false;
	if (node instanceof HTMLElement && node2 instanceof HTMLElement) return node.nodeName !== "A" && node.className === node2.className && node.style.cssText === node2.style.cssText;
	return true;
};
var hasTagAttributes = (node, tag, attributes) => {
	if (node.nodeName !== tag) return false;
	for (const attr in attributes) if (!("getAttribute" in node) || node.getAttribute(attr) !== attributes[attr]) return false;
	return true;
};
var getNearest = (node, root, tag, attributes) => {
	while (node && node !== root) {
		if (hasTagAttributes(node, tag, attributes)) return node;
		node = node.parentNode;
	}
	return null;
};
var getNodeBeforeOffset = (node, offset) => {
	let children = node.childNodes;
	while (offset && node instanceof Element) {
		node = children[offset - 1];
		children = node.childNodes;
		offset = children.length;
	}
	return node;
};
var getNodeAfterOffset = (node, offset) => {
	let returnNode = node;
	if (returnNode instanceof Element) {
		const children = returnNode.childNodes;
		if (offset < children.length) returnNode = children[offset];
else {
			while (returnNode && !returnNode.nextSibling) returnNode = returnNode.parentNode;
			if (returnNode) returnNode = returnNode.nextSibling;
		}
	}
	return returnNode;
};
var getLength = (node) => {
	return node instanceof Element || node instanceof DocumentFragment ? node.childNodes.length : node instanceof CharacterData ? node.length : 0;
};
var empty = (node) => {
	const frag = document.createDocumentFragment();
	let child = node.firstChild;
	while (child) {
		frag.appendChild(child);
		child = node.firstChild;
	}
	return frag;
};
var detach = (node) => {
	const parent = node.parentNode;
	if (parent) parent.removeChild(node);
	return node;
};
var replaceWith = (node, node2) => {
	const parent = node.parentNode;
	if (parent) parent.replaceChild(node2, node);
};
var notWSTextNode = (node) => {
	return node instanceof Element ? node.nodeName === "BR" : notWS.test(node.data);
};
var isLineBreak = (br, isLBIfEmptyBlock) => {
	let block = br.parentNode;
	while (isInline(block)) block = block.parentNode;
	const walker = new TreeIterator(block, SHOW_ELEMENT_OR_TEXT, notWSTextNode);
	walker.currentNode = br;
	return !!walker.nextNode() || isLBIfEmptyBlock && !walker.previousNode();
};
var removeZWS = (root, keepNode) => {
	const walker = new TreeIterator(root, SHOW_TEXT);
	let textNode;
	let index;
	while (textNode = walker.nextNode()) while ((index = textNode.data.indexOf(ZWS)) > -1 && (!keepNode || textNode.parentNode !== keepNode)) if (textNode.length === 1) {
		let node = textNode;
		let parent = node.parentNode;
		while (parent) {
			parent.removeChild(node);
			walker.currentNode = parent;
			if (!isInline(parent) || getLength(parent)) break;
			node = parent;
			parent = node.parentNode;
		}
		break;
	} else textNode.deleteData(index, 1);
};
var START_TO_START = 0;
var START_TO_END = 1;
var END_TO_END = 2;
var END_TO_START = 3;
var isNodeContainedInRange = (range, node, partial) => {
	const nodeRange = document.createRange();
	nodeRange.selectNode(node);
	if (partial) {
		const nodeEndBeforeStart = range.compareBoundaryPoints(END_TO_START, nodeRange) > -1;
		const nodeStartAfterEnd = range.compareBoundaryPoints(START_TO_END, nodeRange) < 1;
		return !nodeEndBeforeStart && !nodeStartAfterEnd;
	} else {
		const nodeStartAfterStart = range.compareBoundaryPoints(START_TO_START, nodeRange) < 1;
		const nodeEndBeforeEnd = range.compareBoundaryPoints(END_TO_END, nodeRange) > -1;
		return nodeStartAfterStart && nodeEndBeforeEnd;
	}
};
var moveRangeBoundariesDownTree = (range) => {
	let { startContainer, startOffset, endContainer, endOffset } = range;
	while (!(startContainer instanceof Text)) {
		let child = startContainer.childNodes[startOffset];
		if (!child || isLeaf(child)) {
			if (startOffset) {
				child = startContainer.childNodes[startOffset - 1];
				if (child instanceof Text) {
					let textChild = child;
					let prev;
					while (!textChild.length && (prev = textChild.previousSibling) && prev instanceof Text) {
						textChild.remove();
						textChild = prev;
					}
					startContainer = textChild;
					startOffset = textChild.data.length;
				}
			}
			break;
		}
		startContainer = child;
		startOffset = 0;
	}
	if (endOffset) while (!(endContainer instanceof Text)) {
		const child = endContainer.childNodes[endOffset - 1];
		if (!child || isLeaf(child)) {
			if (child && child.nodeName === "BR" && !isLineBreak(child, false)) {
				endOffset -= 1;
				continue;
			}
			break;
		}
		endContainer = child;
		endOffset = getLength(endContainer);
	}
else while (!(endContainer instanceof Text)) {
		const child = endContainer.firstChild;
		if (!child || isLeaf(child)) break;
		endContainer = child;
	}
	range.setStart(startContainer, startOffset);
	range.setEnd(endContainer, endOffset);
};
var moveRangeBoundariesUpTree = (range, startMax, endMax, root) => {
	let startContainer = range.startContainer;
	let startOffset = range.startOffset;
	let endContainer = range.endContainer;
	let endOffset = range.endOffset;
	let parent;
	if (!startMax) startMax = range.commonAncestorContainer;
	if (!endMax) endMax = startMax;
	while (!startOffset && startContainer !== startMax && startContainer !== root) {
		parent = startContainer.parentNode;
		startOffset = Array.from(parent.childNodes).indexOf(startContainer);
		startContainer = parent;
	}
	while (true) {
		if (endContainer === endMax || endContainer === root) break;
		if (endContainer.nodeType !== TEXT_NODE && endContainer.childNodes[endOffset] && endContainer.childNodes[endOffset].nodeName === "BR" && !isLineBreak(endContainer.childNodes[endOffset], false)) endOffset += 1;
		if (endOffset !== getLength(endContainer)) break;
		parent = endContainer.parentNode;
		endOffset = Array.from(parent.childNodes).indexOf(endContainer) + 1;
		endContainer = parent;
	}
	range.setStart(startContainer, startOffset);
	range.setEnd(endContainer, endOffset);
};
var moveRangeBoundaryOutOf = (range, tag, root) => {
	let parent = getNearest(range.endContainer, root, tag);
	if (parent && (parent = parent.parentNode)) {
		const clone = range.cloneRange();
		moveRangeBoundariesUpTree(clone, parent, parent, root);
		if (clone.endContainer === parent) {
			range.setStart(clone.endContainer, clone.endOffset);
			range.setEnd(clone.endContainer, clone.endOffset);
		}
	}
	return range;
};
var fixCursor = (node) => {
	let fixer = null;
	if (node instanceof Text) return node;
	if (isInline(node)) {
		let child = node.firstChild;
		if (cantFocusEmptyTextNodes) while (child && child instanceof Text && !child.data) {
			node.removeChild(child);
			child = node.firstChild;
		}
		if (!child) if (cantFocusEmptyTextNodes) fixer = document.createTextNode(ZWS);
else fixer = document.createTextNode("");
	} else if ((node instanceof Element || node instanceof DocumentFragment) && !node.querySelector("BR")) {
		fixer = createElement("BR");
		let parent = node;
		let child;
		while ((child = parent.lastElementChild) && !isInline(child)) parent = child;
		node = parent;
	}
	if (fixer) try {
		node.appendChild(fixer);
	} catch (error) {}
	return node;
};
var fixContainer = (container, root, config) => {
	let wrapper = null;
	Array.from(container.childNodes).forEach((child) => {
		const isBR = child.nodeName === "BR";
		if (!isBR && isInline(child)) {
			if (!wrapper) wrapper = createElement(config.blockTag, config.blockAttributes);
			wrapper.appendChild(child);
		} else if (isBR || wrapper) {
			if (!wrapper) wrapper = createElement(config.blockTag, config.blockAttributes);
			fixCursor(wrapper);
			if (isBR) container.replaceChild(wrapper, child);
else container.insertBefore(wrapper, child);
			wrapper = null;
		}
		if (isContainer(child)) fixContainer(child, root, config);
	});
	if (wrapper) container.appendChild(fixCursor(wrapper));
	return container;
};
var split = (node, offset, stopNode, root) => {
	if (node instanceof Text && node !== stopNode) {
		if (typeof offset !== "number") throw new Error("Offset must be a number to split text node!");
		if (!node.parentNode) throw new Error("Cannot split text node with no parent!");
		return split(node.parentNode, node.splitText(offset), stopNode, root);
	}
	let nodeAfterSplit = typeof offset === "number" ? offset < node.childNodes.length ? node.childNodes[offset] : null : offset;
	const parent = node.parentNode;
	if (!parent || node === stopNode || !(node instanceof Element)) return nodeAfterSplit;
	const clone = node.cloneNode(false);
	while (nodeAfterSplit) {
		const next = nodeAfterSplit.nextSibling;
		clone.appendChild(nodeAfterSplit);
		nodeAfterSplit = next;
	}
	if (node instanceof HTMLOListElement && getNearest(node, root, "DIV", indentedNodeAttributes)) clone.start = (+node.start || 1) + node.childNodes.length - 1;
	fixCursor(node);
	fixCursor(clone);
	parent.insertBefore(clone, node.nextSibling);
	return split(parent, clone, stopNode, root);
};
var _mergeInlines = (node, fakeRange) => {
	const children = node.childNodes;
	let l = children.length;
	const frags = [];
	while (l--) {
		const child = children[l];
		const prev = l ? children[l - 1] : null;
		if (prev && isInline(child) && areAlike(child, prev)) {
			if (fakeRange.startContainer === child) {
				fakeRange.startContainer = prev;
				fakeRange.startOffset += getLength(prev);
			}
			if (fakeRange.endContainer === child) {
				fakeRange.endContainer = prev;
				fakeRange.endOffset += getLength(prev);
			}
			if (fakeRange.startContainer === node) {
				if (fakeRange.startOffset > l) fakeRange.startOffset -= 1;
else if (fakeRange.startOffset === l) {
					fakeRange.startContainer = prev;
					fakeRange.startOffset = getLength(prev);
				}
			}
			if (fakeRange.endContainer === node) {
				if (fakeRange.endOffset > l) fakeRange.endOffset -= 1;
else if (fakeRange.endOffset === l) {
					fakeRange.endContainer = prev;
					fakeRange.endOffset = getLength(prev);
				}
			}
			detach(child);
			if (child instanceof Text) prev.appendData(child.data);
else frags.push(empty(child));
		} else if (child instanceof Element) {
			let frag;
			while (frag = frags.pop()) child.appendChild(frag);
			_mergeInlines(child, fakeRange);
		}
	}
};
var mergeInlines = (node, range) => {
	const element = node instanceof Text ? node.parentNode : node;
	if (element instanceof Element) {
		const fakeRange = {
			startContainer: range.startContainer,
			startOffset: range.startOffset,
			endContainer: range.endContainer,
			endOffset: range.endOffset
		};
		_mergeInlines(element, fakeRange);
		range.setStart(fakeRange.startContainer, fakeRange.startOffset);
		range.setEnd(fakeRange.endContainer, fakeRange.endOffset);
	}
};
var mergeWithBlock = (block, next, range, root) => {
	let container = next;
	let parent;
	let offset;
	while ((parent = container.parentNode) && parent !== root && parent instanceof Element && parent.childNodes.length === 1) container = parent;
	detach(container);
	offset = block.childNodes.length;
	const last = block.lastChild;
	if (last && last.nodeName === "BR") {
		block.removeChild(last);
		offset -= 1;
	}
	block.appendChild(empty(next));
	range.setStart(block, offset);
	range.collapse(true);
	mergeInlines(block, range);
};
var mergeContainers = (node, root, config) => {
	const prev = node.previousSibling;
	const first = node.firstChild;
	const isListItem = node.nodeName === "LI";
	if (isListItem && (!first || !/^[OU]L$/.test(first.nodeName))) return;
	if (prev && areAlike(prev, node)) {
		if (!isContainer(prev)) if (isListItem) {
			const block = createElement("DIV");
			block.appendChild(empty(prev));
			prev.appendChild(block);
		} else return;
		detach(node);
		const needsFix = !isContainer(node);
		prev.appendChild(empty(node));
		if (needsFix) fixContainer(prev, root, config);
		if (first) mergeContainers(first, root, config);
	} else if (isListItem) {
		const block = createElement("DIV");
		node.insertBefore(block, first);
		fixCursor(block);
	}
};
var styleToSemantic = {
	"font-weight": {
		regexp: /^bold|^700/i,
		replace() {
			return createElement("B");
		}
	},
	"font-style": {
		regexp: /^italic/i,
		replace() {
			return createElement("I");
		}
	},
	"font-family": {
		regexp: notWS,
		replace(classNames, family) {
			return createElement("SPAN", {
				class: classNames.fontFamily,
				style: "font-family:" + family
			});
		}
	},
	"font-size": {
		regexp: notWS,
		replace(classNames, size$1) {
			return createElement("SPAN", {
				class: classNames.fontSize,
				style: "font-size:" + size$1
			});
		}
	},
	"text-decoration": {
		regexp: /^underline/i,
		replace() {
			return createElement("U");
		}
	}
};
var replaceStyles = (node, _, config) => {
	const style = node.style;
	let newTreeBottom;
	let newTreeTop;
	for (const attr in styleToSemantic) {
		const converter = styleToSemantic[attr];
		const css = style.getPropertyValue(attr);
		if (css && converter.regexp.test(css)) {
			const el = converter.replace(config.classNames, css);
			if (el.nodeName === node.nodeName && el.className === node.className) continue;
			if (!newTreeTop) newTreeTop = el;
			if (newTreeBottom) newTreeBottom.appendChild(el);
			newTreeBottom = el;
			node.style.removeProperty(attr);
		}
	}
	if (newTreeTop && newTreeBottom) {
		newTreeBottom.appendChild(empty(node));
		if (node.style.cssText) node.appendChild(newTreeTop);
else replaceWith(node, newTreeTop);
	}
	return newTreeBottom || node;
};
var replaceWithTag = (tag) => {
	return (node, parent) => {
		const el = createElement(tag);
		const attributes = node.attributes;
		for (let i = 0, l = attributes.length; i < l; i += 1) {
			const attribute = attributes[i];
			el.setAttribute(attribute.name, attribute.value);
		}
		parent.replaceChild(el, node);
		el.appendChild(empty(node));
		return el;
	};
};
var fontSizes = {
	"1": "10",
	"2": "13",
	"3": "16",
	"4": "18",
	"5": "24",
	"6": "32",
	"7": "48"
};
var stylesRewriters = {
	STRONG: replaceWithTag("B"),
	EM: replaceWithTag("I"),
	INS: replaceWithTag("U"),
	STRIKE: replaceWithTag("S"),
	SPAN: replaceStyles,
	FONT: (node, parent, config) => {
		const font = node;
		const face = font.face;
		const size$1 = font.size;
		let color = font.color;
		const classNames = config.classNames;
		let fontSpan;
		let sizeSpan;
		let colorSpan;
		let newTreeBottom;
		let newTreeTop;
		if (face) {
			fontSpan = createElement("SPAN", {
				class: classNames.fontFamily,
				style: "font-family:" + face
			});
			newTreeTop = fontSpan;
			newTreeBottom = fontSpan;
		}
		if (size$1) {
			sizeSpan = createElement("SPAN", {
				class: classNames.fontSize,
				style: "font-size:" + fontSizes[size$1] + "px"
			});
			if (!newTreeTop) newTreeTop = sizeSpan;
			if (newTreeBottom) newTreeBottom.appendChild(sizeSpan);
			newTreeBottom = sizeSpan;
		}
		if (color && /^#?([\dA-F]{3}){1,2}$/i.test(color)) {
			if (color.charAt(0) !== "#") color = "#" + color;
			colorSpan = createElement("SPAN", {
				class: classNames.color,
				style: "color:" + color
			});
			if (!newTreeTop) newTreeTop = colorSpan;
			if (newTreeBottom) newTreeBottom.appendChild(colorSpan);
			newTreeBottom = colorSpan;
		}
		if (!newTreeTop || !newTreeBottom) newTreeTop = newTreeBottom = createElement("SPAN");
		parent.replaceChild(newTreeTop, font);
		newTreeBottom.appendChild(empty(font));
		return newTreeBottom;
	},
	TT: (node, parent, config) => {
		const el = createElement("SPAN", {
			class: config.classNames.fontFamily,
			style: "font-family:menlo,consolas,\"courier new\",monospace"
		});
		parent.replaceChild(el, node);
		el.appendChild(empty(node));
		return el;
	}
};
var allowedBlock = /^(?:A(?:DDRESS|RTICLE|SIDE|UDIO)|BLOCKQUOTE|CAPTION|D(?:[DLT]|IV)|F(?:IGURE|IGCAPTION|OOTER)|H[1-6]|HEADER|L(?:ABEL|EGEND|I)|O(?:L|UTPUT)|P(?:RE)?|SECTION|T(?:ABLE|BODY|D|FOOT|H|HEAD|R)|COL(?:GROUP)?|UL)$/;
var blacklist = /^(?:HEAD|META|STYLE)/;
var cleanTree = (node, config, preserveWS) => {
	const children = node.childNodes;
	let nonInlineParent = node;
	while (isInline(nonInlineParent)) nonInlineParent = nonInlineParent.parentNode;
	const walker = new TreeIterator(nonInlineParent, SHOW_ELEMENT_OR_TEXT);
	for (let i = 0, l = children.length; i < l; i += 1) {
		let child = children[i];
		const nodeName = child.nodeName;
		const rewriter = stylesRewriters[nodeName];
		if (child instanceof HTMLElement) {
			const childLength = child.childNodes.length;
			if (rewriter) child = rewriter(child, node, config);
else if (blacklist.test(nodeName)) {
				node.removeChild(child);
				i -= 1;
				l -= 1;
				continue;
			} else if (!allowedBlock.test(nodeName) && !isInline(child)) {
				i -= 1;
				l += childLength - 1;
				node.replaceChild(empty(child), child);
				continue;
			}
			if (childLength) cleanTree(child, config, preserveWS || nodeName === "PRE");
		} else {
			if (child instanceof Text) {
				let data = child.data;
				const startsWithWS = !notWS.test(data.charAt(0));
				const endsWithWS = !notWS.test(data.charAt(data.length - 1));
				if (preserveWS || !startsWithWS && !endsWithWS) continue;
				if (startsWithWS) {
					walker.currentNode = child;
					let sibling;
					while (sibling = walker.previousPONode()) {
						if (sibling.nodeName === "IMG" || sibling instanceof Text && notWS.test(sibling.data)) break;
						if (!isInline(sibling)) {
							sibling = null;
							break;
						}
					}
					data = data.replace(/^[ \t\r\n]+/g, sibling ? " " : "");
				}
				if (endsWithWS) {
					walker.currentNode = child;
					let sibling;
					while (sibling = walker.nextNode()) {
						if (sibling.nodeName === "IMG" || sibling instanceof Text && notWS.test(sibling.data)) break;
						if (!isInline(sibling)) {
							sibling = null;
							break;
						}
					}
					data = data.replace(/[ \t\r\n]+$/g, sibling ? " " : "");
				}
				if (data) {
					child.data = data;
					continue;
				}
			}
			node.removeChild(child);
			i -= 1;
			l -= 1;
		}
	}
	return node;
};
var removeEmptyInlines = (node) => {
	const children = node.childNodes;
	let l = children.length;
	while (l--) {
		const child = children[l];
		if (child instanceof Element && !isLeaf(child)) {
			removeEmptyInlines(child);
			if (isInline(child) && !child.firstChild) node.removeChild(child);
		} else if (child instanceof Text && !child.data) node.removeChild(child);
	}
};
var cleanupBRs = (node, root, keepForBlankLine, config) => {
	const brs = node.querySelectorAll("BR");
	const brBreaksLine = [];
	let l = brs.length;
	for (let i = 0; i < l; i += 1) brBreaksLine[i] = isLineBreak(brs[i], keepForBlankLine);
	while (l--) {
		const br = brs[l];
		const parent = br.parentNode;
		if (!parent) continue;
		if (!brBreaksLine[l]) detach(br);
else if (!isInline(parent)) fixContainer(parent, root, config);
	}
};
var escapeHTML = (text) => {
	return text.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split("\"").join("&quot;");
};
var getBlockWalker = (node, root) => {
	const walker = new TreeIterator(root, SHOW_ELEMENT, isBlock);
	walker.currentNode = node;
	return walker;
};
var getPreviousBlock = (node, root) => {
	const block = getBlockWalker(node, root).previousNode();
	return block !== root ? block : null;
};
var getNextBlock = (node, root) => {
	const block = getBlockWalker(node, root).nextNode();
	return block !== root ? block : null;
};
var isEmptyBlock = (block) => {
	return !block.textContent && !block.querySelector("IMG");
};
var getStartBlockOfRange = (range, root) => {
	const container = range.startContainer;
	let block;
	if (isInline(container)) block = getPreviousBlock(container, root);
else if (container !== root && container instanceof HTMLElement && isBlock(container)) block = container;
else {
		const node = getNodeBeforeOffset(container, range.startOffset);
		block = getNextBlock(node, root);
	}
	return block && isNodeContainedInRange(range, block, true) ? block : null;
};
var getEndBlockOfRange = (range, root) => {
	const container = range.endContainer;
	let block;
	if (isInline(container)) block = getPreviousBlock(container, root);
else if (container !== root && container instanceof HTMLElement && isBlock(container)) block = container;
else {
		let node = getNodeAfterOffset(container, range.endOffset);
		if (!node || !root.contains(node)) {
			node = root;
			let child;
			while (child = node.lastChild) node = child;
		}
		block = getPreviousBlock(node, root);
	}
	return block && isNodeContainedInRange(range, block, true) ? block : null;
};
var isContent = (node) => {
	return node instanceof Text ? notWS.test(node.data) : node.nodeName === "IMG";
};
var rangeDoesStartAtBlockBoundary = (range, root) => {
	const startContainer = range.startContainer;
	const startOffset = range.startOffset;
	let nodeAfterCursor;
	if (startContainer instanceof Text) {
		const text = startContainer.data;
		for (let i = startOffset; i > 0; i -= 1) if (text.charAt(i - 1) !== ZWS) return false;
		nodeAfterCursor = startContainer;
	} else {
		nodeAfterCursor = getNodeAfterOffset(startContainer, startOffset);
		if (nodeAfterCursor && !root.contains(nodeAfterCursor)) nodeAfterCursor = null;
		if (!nodeAfterCursor) {
			nodeAfterCursor = getNodeBeforeOffset(startContainer, startOffset);
			if (nodeAfterCursor instanceof Text && nodeAfterCursor.length) return false;
		}
	}
	const block = getStartBlockOfRange(range, root);
	if (!block) return false;
	const contentWalker = new TreeIterator(block, SHOW_ELEMENT_OR_TEXT, isContent);
	contentWalker.currentNode = nodeAfterCursor;
	return !contentWalker.previousNode();
};
var rangeDoesEndAtBlockBoundary = (range, root) => {
	const endContainer = range.endContainer;
	const endOffset = range.endOffset;
	let currentNode;
	if (endContainer instanceof Text) {
		const text = endContainer.data;
		const length = text.length;
		for (let i = endOffset; i < length; i += 1) if (text.charAt(i) !== ZWS) return false;
		currentNode = endContainer;
	} else currentNode = getNodeBeforeOffset(endContainer, endOffset);
	const block = getEndBlockOfRange(range, root);
	if (!block) return false;
	const contentWalker = new TreeIterator(block, SHOW_ELEMENT_OR_TEXT, isContent);
	contentWalker.currentNode = currentNode;
	return !contentWalker.nextNode();
};
var expandRangeToBlockBoundaries = (range, root) => {
	const start = getStartBlockOfRange(range, root);
	const end = getEndBlockOfRange(range, root);
	let parent;
	if (start && end) {
		parent = start.parentNode;
		range.setStart(parent, Array.from(parent.childNodes).indexOf(start));
		parent = end.parentNode;
		range.setEnd(parent, Array.from(parent.childNodes).indexOf(end) + 1);
	}
};
function createRange(startContainer, startOffset, endContainer, endOffset) {
	const range = document.createRange();
	range.setStart(startContainer, startOffset);
	if (endContainer && typeof endOffset === "number") range.setEnd(endContainer, endOffset);
else range.setEnd(startContainer, startOffset);
	return range;
}
var insertNodeInRange = (range, node) => {
	let { startContainer, startOffset, endContainer, endOffset } = range;
	let children;
	if (startContainer instanceof Text) {
		const parent = startContainer.parentNode;
		children = parent.childNodes;
		if (startOffset === startContainer.length) {
			startOffset = Array.from(children).indexOf(startContainer) + 1;
			if (range.collapsed) {
				endContainer = parent;
				endOffset = startOffset;
			}
		} else {
			if (startOffset) {
				const afterSplit = startContainer.splitText(startOffset);
				if (endContainer === startContainer) {
					endOffset -= startOffset;
					endContainer = afterSplit;
				} else if (endContainer === parent) endOffset += 1;
				startContainer = afterSplit;
			}
			startOffset = Array.from(children).indexOf(startContainer);
		}
		startContainer = parent;
	} else children = startContainer.childNodes;
	const childCount = children.length;
	if (startOffset === childCount) startContainer.appendChild(node);
else startContainer.insertBefore(node, children[startOffset]);
	if (startContainer === endContainer) endOffset += children.length - childCount;
	range.setStart(startContainer, startOffset);
	range.setEnd(endContainer, endOffset);
};
var extractContentsOfRange = (range, common, root) => {
	const frag = document.createDocumentFragment();
	if (range.collapsed) return frag;
	if (!common) common = range.commonAncestorContainer;
	if (common instanceof Text) common = common.parentNode;
	const startContainer = range.startContainer;
	const startOffset = range.startOffset;
	let endContainer = split(range.endContainer, range.endOffset, common, root);
	let endOffset = 0;
	let node = split(startContainer, startOffset, common, root);
	while (node && node !== endContainer) {
		const next = node.nextSibling;
		frag.appendChild(node);
		node = next;
	}
	if (startContainer instanceof Text && endContainer instanceof Text) {
		startContainer.appendData(endContainer.data);
		detach(endContainer);
		endContainer = startContainer;
		endOffset = startOffset;
	}
	range.setStart(startContainer, startOffset);
	if (endContainer) range.setEnd(endContainer, endOffset);
else range.setEnd(common, common.childNodes.length);
	fixCursor(common);
	return frag;
};
var getAdjacentInlineNode = (iterator, method, node) => {
	iterator.currentNode = node;
	let nextNode;
	while (nextNode = iterator[method]()) {
		if (nextNode instanceof Text || isLeaf(nextNode)) return nextNode;
		if (!isInline(nextNode)) return null;
	}
	return null;
};
var deleteContentsOfRange = (range, root) => {
	const startBlock = getStartBlockOfRange(range, root);
	let endBlock = getEndBlockOfRange(range, root);
	const needsMerge = startBlock !== endBlock;
	if (startBlock && endBlock) {
		moveRangeBoundariesDownTree(range);
		moveRangeBoundariesUpTree(range, startBlock, endBlock, root);
	}
	const frag = extractContentsOfRange(range, null, root);
	moveRangeBoundariesDownTree(range);
	if (needsMerge) {
		endBlock = getEndBlockOfRange(range, root);
		if (startBlock && endBlock && startBlock !== endBlock) mergeWithBlock(startBlock, endBlock, range, root);
	}
	if (startBlock) fixCursor(startBlock);
	const child = root.firstChild;
	if (!child || child.nodeName === "BR") {
		fixCursor(root);
		if (root.firstChild) range.selectNodeContents(root.firstChild);
	}
	range.collapse(true);
	const startContainer = range.startContainer;
	const startOffset = range.startOffset;
	const iterator = new TreeIterator(root, SHOW_ELEMENT_OR_TEXT);
	let afterNode = startContainer;
	let afterOffset = startOffset;
	if (!(afterNode instanceof Text) || afterOffset === afterNode.data.length) {
		afterNode = getAdjacentInlineNode(iterator, "nextNode", afterNode);
		afterOffset = 0;
	}
	let beforeNode = startContainer;
	let beforeOffset = startOffset - 1;
	if (!(beforeNode instanceof Text) || beforeOffset === -1) {
		beforeNode = getAdjacentInlineNode(iterator, "previousPONode", afterNode || (startContainer instanceof Text ? startContainer : startContainer.childNodes[startOffset] || startContainer));
		if (beforeNode instanceof Text) beforeOffset = beforeNode.data.length;
	}
	let node = null;
	let offset = 0;
	if (afterNode instanceof Text && afterNode.data.charAt(afterOffset) === " " && rangeDoesStartAtBlockBoundary(range, root)) {
		node = afterNode;
		offset = afterOffset;
	} else if (beforeNode instanceof Text && beforeNode.data.charAt(beforeOffset) === " ") {
		if (afterNode instanceof Text && afterNode.data.charAt(afterOffset) === " " || rangeDoesEndAtBlockBoundary(range, root)) {
			node = beforeNode;
			offset = beforeOffset;
		}
	}
	if (node) node.replaceData(offset, 1, "\xA0");
	range.setStart(startContainer, startOffset);
	range.collapse(true);
	return frag;
};
var insertTreeFragmentIntoRange = (range, frag, root, config) => {
	const firstInFragIsInline = frag.firstChild && isInline(frag.firstChild);
	let node;
	fixContainer(frag, root, config);
	node = frag;
	while (node = getNextBlock(node, root)) fixCursor(node);
	if (!range.collapsed) deleteContentsOfRange(range, root);
	moveRangeBoundariesDownTree(range);
	range.collapse(false);
	const stopPoint = getNearest(range.endContainer, root, "BLOCKQUOTE") || root;
	let block = getStartBlockOfRange(range, root);
	let blockContentsAfterSplit = null;
	const firstBlockInFrag = getNextBlock(frag, frag);
	const replaceBlock = !firstInFragIsInline && !!block && isEmptyBlock(block);
	if (block && firstBlockInFrag && !replaceBlock && !getNearest(firstBlockInFrag, frag, "PRE") && !getNearest(firstBlockInFrag, frag, "TABLE")) {
		moveRangeBoundariesUpTree(range, block, block, root);
		range.collapse(true);
		let container = range.endContainer;
		let offset = range.endOffset;
		cleanupBRs(block, root, false, config);
		if (isInline(container)) {
			const nodeAfterSplit = split(container, offset, getPreviousBlock(container, root) || root, root);
			container = nodeAfterSplit.parentNode;
			offset = Array.from(container.childNodes).indexOf(nodeAfterSplit);
		}
		if (offset !== getLength(container)) {
			blockContentsAfterSplit = document.createDocumentFragment();
			while (node = container.childNodes[offset]) blockContentsAfterSplit.appendChild(node);
		}
		mergeWithBlock(container, firstBlockInFrag, range, root);
		offset = Array.from(container.parentNode.childNodes).indexOf(container) + 1;
		container = container.parentNode;
		range.setEnd(container, offset);
	}
	if (getLength(frag)) {
		if (replaceBlock && block) {
			range.setEndBefore(block);
			range.collapse(false);
			detach(block);
		}
		moveRangeBoundariesUpTree(range, stopPoint, stopPoint, root);
		let nodeAfterSplit = split(range.endContainer, range.endOffset, stopPoint, root);
		const nodeBeforeSplit = nodeAfterSplit ? nodeAfterSplit.previousSibling : stopPoint.lastChild;
		stopPoint.insertBefore(frag, nodeAfterSplit);
		if (nodeAfterSplit) range.setEndBefore(nodeAfterSplit);
else range.setEnd(stopPoint, getLength(stopPoint));
		block = getEndBlockOfRange(range, root);
		moveRangeBoundariesDownTree(range);
		const container = range.endContainer;
		const offset = range.endOffset;
		if (nodeAfterSplit && isContainer(nodeAfterSplit)) mergeContainers(nodeAfterSplit, root, config);
		nodeAfterSplit = nodeBeforeSplit && nodeBeforeSplit.nextSibling;
		if (nodeAfterSplit && isContainer(nodeAfterSplit)) mergeContainers(nodeAfterSplit, root, config);
		range.setEnd(container, offset);
	}
	if (blockContentsAfterSplit && block) {
		const tempRange = range.cloneRange();
		fixCursor(blockContentsAfterSplit);
		mergeWithBlock(block, blockContentsAfterSplit, tempRange, root);
		range.setEnd(tempRange.endContainer, tempRange.endOffset);
	}
	moveRangeBoundariesDownTree(range);
};
var getTextContentsOfRange = (range) => {
	if (range.collapsed) return "";
	const startContainer = range.startContainer;
	const endContainer = range.endContainer;
	const walker = new TreeIterator(range.commonAncestorContainer, SHOW_ELEMENT_OR_TEXT, (node2) => {
		return isNodeContainedInRange(range, node2, true);
	});
	walker.currentNode = startContainer;
	let node = startContainer;
	let textContent = "";
	let addedTextInBlock = false;
	let value;
	if (!(node instanceof Element) && !(node instanceof Text) || !walker.filter(node)) node = walker.nextNode();
	while (node) {
		if (node instanceof Text) {
			value = node.data;
			if (value && /\S/.test(value)) {
				if (node === endContainer) value = value.slice(0, range.endOffset);
				if (node === startContainer) value = value.slice(range.startOffset);
				textContent += value;
				addedTextInBlock = true;
			}
		} else if (node.nodeName === "BR" || addedTextInBlock && !isInline(node)) {
			textContent += "\n";
			addedTextInBlock = false;
		}
		node = walker.nextNode();
	}
	textContent = textContent.replace(/ /g, " ");
	return textContent;
};
var indexOf = Array.prototype.indexOf;
var extractRangeToClipboard = (event, range, root, removeRangeFromDocument, toCleanHTML, toPlainText, plainTextOnly) => {
	const clipboardData = event.clipboardData;
	if (isLegacyEdge || !clipboardData) return false;
	let text = toPlainText ? "" : getTextContentsOfRange(range);
	const startBlock = getStartBlockOfRange(range, root);
	const endBlock = getEndBlockOfRange(range, root);
	let copyRoot = root;
	if (startBlock === endBlock && startBlock?.contains(range.commonAncestorContainer)) copyRoot = startBlock;
	let contents;
	if (removeRangeFromDocument) contents = deleteContentsOfRange(range, root);
else {
		range = range.cloneRange();
		moveRangeBoundariesDownTree(range);
		moveRangeBoundariesUpTree(range, copyRoot, copyRoot, root);
		contents = range.cloneContents();
	}
	let parent = range.commonAncestorContainer;
	if (parent instanceof Text) parent = parent.parentNode;
	while (parent && parent !== copyRoot) {
		const newContents = parent.cloneNode(false);
		newContents.appendChild(contents);
		contents = newContents;
		parent = parent.parentNode;
	}
	let html;
	if (contents.childNodes.length === 1 && contents.childNodes[0] instanceof Text) {
		text = contents.childNodes[0].data.replace(/ /g, " ");
		plainTextOnly = true;
	} else {
		const node = createElement("DIV");
		node.appendChild(contents);
		html = node.innerHTML;
		if (toCleanHTML) html = toCleanHTML(html);
	}
	if (toPlainText && html !== void 0) text = toPlainText(html);
	if (isWin) text = text.replace(/\r?\n/g, "\r\n");
	if (!plainTextOnly && html && text !== html) clipboardData.setData("text/html", html);
	clipboardData.setData("text/plain", text);
	event.preventDefault();
	return true;
};
var _onCut = function(event) {
	const range = this.getSelection();
	const root = this._root;
	if (range.collapsed) {
		event.preventDefault();
		return;
	}
	this.saveUndoState(range);
	const handled = extractRangeToClipboard(event, range, root, true, this._config.willCutCopy, this._config.toPlainText, false);
	if (!handled) setTimeout(() => {
		try {
			this._ensureBottomLine();
		} catch (error) {
			this._config.didError(error);
		}
	}, 0);
	this.setSelection(range);
};
var _onCopy = function(event) {
	extractRangeToClipboard(event, this.getSelection(), this._root, false, this._config.willCutCopy, this._config.toPlainText, false);
};
var _monitorShiftKey = function(event) {
	this._isShiftDown = event.shiftKey;
};
var _onPaste = function(event) {
	const clipboardData = event.clipboardData;
	const items = clipboardData?.items;
	const choosePlain = this._isShiftDown;
	let hasRTF = false;
	let hasImage = false;
	let plainItem = null;
	let htmlItem = null;
	if (items) {
		let l = items.length;
		while (l--) {
			const item = items[l];
			const type = item.type;
			if (type === "text/html") htmlItem = item;
else if (type === "text/plain" || type === "text/uri-list") plainItem = item;
else if (type === "text/rtf") hasRTF = true;
else if (/^image\/.*/.test(type)) hasImage = true;
		}
		if (hasImage && !(hasRTF && htmlItem)) {
			event.preventDefault();
			this.fireEvent("pasteImage", { clipboardData });
			return;
		}
		if (!isLegacyEdge) {
			event.preventDefault();
			if (htmlItem && (!choosePlain || !plainItem)) htmlItem.getAsString((html) => {
				this.insertHTML(html, true);
			});
else if (plainItem) plainItem.getAsString((text) => {
				let isLink = false;
				const range2 = this.getSelection();
				if (!range2.collapsed && notWS.test(range2.toString())) {
					const match = this.linkRegExp.exec(text);
					isLink = !!match && match[0].length === text.length;
				}
				if (isLink) this.makeLink(text);
else this.insertPlainText(text, true);
			});
			return;
		}
	}
	const types = clipboardData?.types;
	if (!isLegacyEdge && types && (indexOf.call(types, "text/html") > -1 || !isGecko && indexOf.call(types, "text/plain") > -1 && indexOf.call(types, "text/rtf") < 0)) {
		event.preventDefault();
		let data;
		if (!choosePlain && (data = clipboardData.getData("text/html"))) this.insertHTML(data, true);
else if ((data = clipboardData.getData("text/plain")) || (data = clipboardData.getData("text/uri-list"))) this.insertPlainText(data, true);
		return;
	}
	const body = document.body;
	const range = this.getSelection();
	const startContainer = range.startContainer;
	const startOffset = range.startOffset;
	const endContainer = range.endContainer;
	const endOffset = range.endOffset;
	let pasteArea = createElement("DIV", {
		contenteditable: "true",
		style: "position:fixed; overflow:hidden; top:0; right:100%; width:1px; height:1px;"
	});
	body.appendChild(pasteArea);
	range.selectNodeContents(pasteArea);
	this.setSelection(range);
	setTimeout(() => {
		try {
			let html = "";
			let next = pasteArea;
			let first;
			while (pasteArea = next) {
				next = pasteArea.nextSibling;
				detach(pasteArea);
				first = pasteArea.firstChild;
				if (first && first === pasteArea.lastChild && first instanceof HTMLDivElement) pasteArea = first;
				html += pasteArea.innerHTML;
			}
			this.setSelection(createRange(startContainer, startOffset, endContainer, endOffset));
			if (html) this.insertHTML(html, true);
		} catch (error) {
			this._config.didError(error);
		}
	}, 0);
};
var _onDrop = function(event) {
	if (!event.dataTransfer) return;
	const types = event.dataTransfer.types;
	let l = types.length;
	let hasPlain = false;
	let hasHTML = false;
	while (l--) switch (types[l]) {
		case "text/plain":
			hasPlain = true;
			break;
		case "text/html":
			hasHTML = true;
			break;
		default: return;
	}
	if (hasHTML || hasPlain && this.saveUndoState) this.saveUndoState();
};
var Enter = (self, event, range) => {
	event.preventDefault();
	self.splitBlock(event.shiftKey, range);
};
var afterDelete = (self, range) => {
	try {
		if (!range) range = self.getSelection();
		let node = range.startContainer;
		if (node instanceof Text) node = node.parentNode;
		let parent = node;
		while (isInline(parent) && (!parent.textContent || parent.textContent === ZWS)) {
			node = parent;
			parent = node.parentNode;
		}
		if (node !== parent) {
			range.setStart(parent, Array.from(parent.childNodes).indexOf(node));
			range.collapse(true);
			parent.removeChild(node);
			if (!isBlock(parent)) parent = getPreviousBlock(parent, self._root) || self._root;
			fixCursor(parent);
			moveRangeBoundariesDownTree(range);
		}
		if (node === self._root && (node = node.firstChild) && node.nodeName === "BR") detach(node);
		self._ensureBottomLine();
		self.setSelection(range);
		self._updatePath(range, true);
	} catch (error) {
		self._config.didError(error);
	}
};
var detachUneditableNode = (node, root) => {
	let parent;
	while (parent = node.parentNode) {
		if (parent === root || parent.isContentEditable) break;
		node = parent;
	}
	detach(node);
};
var linkifyText = (self, textNode, offset) => {
	if (getNearest(textNode, self._root, "A")) return;
	const data = textNode.data || "";
	const searchFrom = Math.max(data.lastIndexOf(" ", offset - 1), data.lastIndexOf("\xA0", offset - 1)) + 1;
	const searchText = data.slice(searchFrom, offset);
	const match = self.linkRegExp.exec(searchText);
	if (match) {
		const selection = self.getSelection();
		self._docWasChanged();
		self._recordUndoState(selection);
		self._getRangeAndRemoveBookmark(selection);
		const index = searchFrom + match.index;
		const endIndex = index + match[0].length;
		const needsSelectionUpdate = selection.startContainer === textNode;
		const newSelectionOffset = selection.startOffset - endIndex;
		if (index) textNode = textNode.splitText(index);
		const defaultAttributes = self._config.tagAttributes.a;
		const link = createElement("A", Object.assign({ href: match[1] ? /^(?:ht|f)tps?:/i.test(match[1]) ? match[1] : "http://" + match[1] : "mailto:" + match[0] }, defaultAttributes));
		link.textContent = data.slice(index, endIndex);
		textNode.parentNode.insertBefore(link, textNode);
		textNode.data = data.slice(endIndex);
		if (needsSelectionUpdate) {
			selection.setStart(textNode, newSelectionOffset);
			selection.setEnd(textNode, newSelectionOffset);
		}
		self.setSelection(selection);
	}
};
var Backspace = (self, event, range) => {
	const root = self._root;
	self._removeZWS();
	self.saveUndoState(range);
	if (!range.collapsed) {
		event.preventDefault();
		deleteContentsOfRange(range, root);
		afterDelete(self, range);
	} else if (rangeDoesStartAtBlockBoundary(range, root)) {
		event.preventDefault();
		const startBlock = getStartBlockOfRange(range, root);
		if (!startBlock) return;
		let current = startBlock;
		fixContainer(current.parentNode, root, self._config);
		const previous = getPreviousBlock(current, root);
		if (previous) {
			if (!previous.isContentEditable) {
				detachUneditableNode(previous, root);
				return;
			}
			mergeWithBlock(previous, current, range, root);
			current = previous.parentNode;
			while (current !== root && !current.nextSibling) current = current.parentNode;
			if (current !== root && (current = current.nextSibling)) mergeContainers(current, root, self._config);
			self.setSelection(range);
		} else if (current) {
			if (getNearest(current, root, "UL") || getNearest(current, root, "OL")) {
				self.decreaseListLevel(range);
				return;
			} else if (getNearest(current, root, "DIV", indentedNodeAttributes)) {
				self.removeIndentation(range);
				return;
			}
			self.setSelection(range);
			self._updatePath(range, true);
		}
	} else {
		moveRangeBoundariesDownTree(range);
		const text = range.startContainer;
		const offset = range.startOffset;
		const a = text.parentNode;
		if (text instanceof Text && a instanceof HTMLAnchorElement && offset && a.href.includes(text.data)) {
			text.deleteData(offset - 1, 1);
			self.setSelection(range);
			self.removeLink();
			event.preventDefault();
		} else {
			self.setSelection(range);
			setTimeout(() => {
				afterDelete(self);
			}, 0);
		}
	}
};
var Delete = (self, event, range) => {
	const root = self._root;
	let current;
	let next;
	let originalRange;
	let cursorContainer;
	let cursorOffset;
	let nodeAfterCursor;
	self._removeZWS();
	self.saveUndoState(range);
	if (!range.collapsed) {
		event.preventDefault();
		deleteContentsOfRange(range, root);
		afterDelete(self, range);
	} else if (rangeDoesEndAtBlockBoundary(range, root)) {
		event.preventDefault();
		current = getStartBlockOfRange(range, root);
		if (!current) return;
		fixContainer(current.parentNode, root, self._config);
		next = getNextBlock(current, root);
		if (next) {
			if (!next.isContentEditable) {
				detachUneditableNode(next, root);
				return;
			}
			mergeWithBlock(current, next, range, root);
			next = current.parentNode;
			while (next !== root && !next.nextSibling) next = next.parentNode;
			if (next !== root && (next = next.nextSibling)) mergeContainers(next, root, self._config);
			self.setSelection(range);
			self._updatePath(range, true);
		}
	} else {
		originalRange = range.cloneRange();
		moveRangeBoundariesUpTree(range, root, root, root);
		cursorContainer = range.endContainer;
		cursorOffset = range.endOffset;
		if (cursorContainer instanceof Element) {
			nodeAfterCursor = cursorContainer.childNodes[cursorOffset];
			if (nodeAfterCursor && nodeAfterCursor.nodeName === "IMG") {
				event.preventDefault();
				detach(nodeAfterCursor);
				moveRangeBoundariesDownTree(range);
				afterDelete(self, range);
				return;
			}
		}
		self.setSelection(originalRange);
		setTimeout(() => {
			afterDelete(self);
		}, 0);
	}
};
var Tab = (self, event, range) => {
	const root = self._root;
	self._removeZWS();
	if (range.collapsed && rangeDoesStartAtBlockBoundary(range, root)) {
		let node = getStartBlockOfRange(range, root);
		let parent;
		while (parent = node.parentNode) {
			if (parent.nodeName === "UL" || parent.nodeName === "OL") {
				event.preventDefault();
				self.increaseListLevel(range);
				break;
			}
			node = parent;
		}
	}
};
var ShiftTab = (self, event, range) => {
	const root = self._root;
	self._removeZWS();
	if (range.collapsed && rangeDoesStartAtBlockBoundary(range, root)) {
		const node = range.startContainer;
		if (getNearest(node, root, "UL") || getNearest(node, root, "OL")) {
			event.preventDefault();
			self.decreaseListLevel(range);
		}
	}
};
var Space = (self, event, range) => {
	let node;
	const root = self._root;
	self._recordUndoState(range);
	self._getRangeAndRemoveBookmark(range);
	if (!range.collapsed) {
		deleteContentsOfRange(range, root);
		self._ensureBottomLine();
		self.setSelection(range);
		self._updatePath(range, true);
	} else if (rangeDoesEndAtBlockBoundary(range, root)) {
		const block = getStartBlockOfRange(range, root);
		if (block && block.nodeName !== "PRE") {
			const text = block.textContent?.trimEnd().replace(ZWS, "");
			if (text === "*" || text === "1.") {
				event.preventDefault();
				self.insertPlainText(" ", false);
				self._docWasChanged();
				self.saveUndoState(range);
				const walker = new TreeIterator(block, SHOW_TEXT);
				let textNode;
				while (textNode = walker.nextNode()) detach(textNode);
				if (text === "*") self.makeUnorderedList();
else self.makeOrderedList();
				return;
			}
		}
	}
	node = range.endContainer;
	if (range.endOffset === getLength(node)) do 
		if (node.nodeName === "A") {
			range.setStartAfter(node);
			break;
		}
	while (!node.nextSibling && (node = node.parentNode) && node !== root);
	if (self._config.addLinks) {
		const linkRange = range.cloneRange();
		moveRangeBoundariesDownTree(linkRange);
		const textNode = linkRange.startContainer;
		const offset = linkRange.startOffset;
		setTimeout(() => {
			linkifyText(self, textNode, offset);
		}, 0);
	}
	self.setSelection(range);
};
var _onKey = function(event) {
	if (event.defaultPrevented || event.isComposing) return;
	let key = event.key;
	const lastCharacterIndex = key.length - 1;
	const lastCharacter = key.charAt(lastCharacterIndex);
	key = key.substring(0, lastCharacterIndex) + lastCharacter.toLowerCase();
	let modifiers = "";
	if (key !== "Backspace" && key !== "Delete") {
		if (event.altKey) modifiers += "Alt-";
		if (event.ctrlKey) modifiers += "Ctrl-";
		if (event.metaKey) modifiers += "Meta-";
		if (event.shiftKey) modifiers += "Shift-";
	}
	if (isWin && event.shiftKey && key === "Delete") modifiers += "Shift-";
	key = modifiers + key;
	const range = this.getSelection();
	if (this._keyHandlers[key]) this._keyHandlers[key](this, event, range);
else if (!range.collapsed && !event.ctrlKey && !event.metaKey && key.length === 1) {
		this.saveUndoState(range);
		deleteContentsOfRange(range, this._root);
		this._ensureBottomLine();
		this.setSelection(range);
		this._updatePath(range, true);
	}
};
var keyHandlers = {
	"Backspace": Backspace,
	"Delete": Delete,
	"Tab": Tab,
	"Shift-Tab": ShiftTab,
	" ": Space,
	"ArrowLeft"(self) {
		self._removeZWS();
	},
	"ArrowRight"(self, event, range) {
		self._removeZWS();
		const root = self.getRoot();
		if (rangeDoesEndAtBlockBoundary(range, root)) {
			moveRangeBoundariesDownTree(range);
			let node = range.endContainer;
			do 
				if (node.nodeName === "CODE") {
					let next = node.nextSibling;
					if (!(next instanceof Text)) {
						const textNode = document.createTextNode("\xA0");
						node.parentNode.insertBefore(textNode, next);
						next = textNode;
					}
					range.setStart(next, 1);
					self.setSelection(range);
					event.preventDefault();
					break;
				}
			while (!node.nextSibling && (node = node.parentNode) && node !== root);
		}
	}
};
if (!supportsInputEvents) {
	keyHandlers.Enter = Enter;
	keyHandlers["Shift-Enter"] = Enter;
}
if (!isMac && !isIOS) {
	keyHandlers.PageUp = (self) => {
		self.moveCursorToStart();
	};
	keyHandlers.PageDown = (self) => {
		self.moveCursorToEnd();
	};
}
var mapKeyToFormat = (tag, remove) => {
	remove = remove || null;
	return (self, event) => {
		event.preventDefault();
		const range = self.getSelection();
		if (self.hasFormat(tag, null, range)) self.changeFormat(null, { tag }, range);
else self.changeFormat({ tag }, remove, range);
	};
};
keyHandlers[ctrlKey + "b"] = mapKeyToFormat("B");
keyHandlers[ctrlKey + "i"] = mapKeyToFormat("I");
keyHandlers[ctrlKey + "u"] = mapKeyToFormat("U");
keyHandlers[ctrlKey + "Shift-7"] = mapKeyToFormat("S");
keyHandlers[ctrlKey + "Shift-5"] = mapKeyToFormat("SUB", { tag: "SUP" });
keyHandlers[ctrlKey + "Shift-6"] = mapKeyToFormat("SUP", { tag: "SUB" });
keyHandlers[ctrlKey + "Shift-8"] = (self, event) => {
	event.preventDefault();
	const path = self.getPath();
	if (!/(?:^|>)UL/.test(path)) self.makeUnorderedList();
else self.removeList();
};
keyHandlers[ctrlKey + "Shift-9"] = (self, event) => {
	event.preventDefault();
	const path = self.getPath();
	if (!/(?:^|>)OL/.test(path)) self.makeOrderedList();
else self.removeList();
};
keyHandlers[ctrlKey + "["] = (self, event) => {
	event.preventDefault();
	const path = self.getPath();
	if (/(?:^|>)[OU]L/.test(path)) self.decreaseListLevel();
else self.decreaseIndentationLevel();
};
keyHandlers[ctrlKey + "]"] = (self, event) => {
	event.preventDefault();
	const path = self.getPath();
	if (/(?:^|>)[OU]L/.test(path)) self.increaseListLevel();
else self.increaseIndentationLevel();
};
keyHandlers[ctrlKey + "d"] = (self, event) => {
	event.preventDefault();
	self.toggleCode();
};
keyHandlers[ctrlKey + "z"] = (self, event) => {
	event.preventDefault();
	self.undo();
};
keyHandlers[ctrlKey + "y"] = keyHandlers[ctrlKey + "Shift-z"] = (self, event) => {
	event.preventDefault();
	self.redo();
};
var Squire = class {
	constructor(root, config) {
		/**
		* Subscribing to these events won't automatically add a listener to the
		* document node, since these events are fired in a custom manner by the
		* editor code.
		*/
		this.customEvents = /* @__PURE__ */ new Set([
			"pathChange",
			"select",
			"input",
			"pasteImage",
			"undoStateChange"
		]);
		this.startSelectionId = "squire-selection-start";
		this.endSelectionId = "squire-selection-end";
		this.linkRegExp = /\b(?:((?:(?:ht|f)tps?:\/\/|www\d{0,3}[.]|[a-z0-9][a-z0-9.\-]*[.][a-z]{2,}\/)(?:[^\s()<>]+|\([^\s()<>]+\))+(?:[^\s?&`!()\[\]{};:'".,<>«»“”‘’]|\([^\s()<>]+\)))|([\w\-.%+]+@(?:[\w\-]+\.)+[a-z]{2,}\b(?:[?][^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+(?:&[^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+)*)?))/i;
		this.tagAfterSplit = {
			DT: "DD",
			DD: "DT",
			LI: "LI",
			PRE: "PRE"
		};
		this._root = root;
		this._config = this._makeConfig(config);
		this._isFocused = false;
		this._lastSelection = createRange(root, 0);
		this._willRestoreSelection = false;
		this._mayHaveZWS = false;
		this._lastAnchorNode = null;
		this._lastFocusNode = null;
		this._path = "";
		this._events = /* @__PURE__ */ new Map();
		this._undoIndex = -1;
		this._undoStack = [];
		this._undoStackLength = 0;
		this._isInUndoState = false;
		this._ignoreChange = false;
		this._ignoreAllChanges = false;
		this.addEventListener("selectionchange", this._updatePathOnEvent);
		this.addEventListener("blur", this._enableRestoreSelection);
		this.addEventListener("mousedown", this._disableRestoreSelection);
		this.addEventListener("touchstart", this._disableRestoreSelection);
		this.addEventListener("focus", this._restoreSelection);
		this._isShiftDown = false;
		this.addEventListener("cut", _onCut);
		this.addEventListener("copy", _onCopy);
		this.addEventListener("paste", _onPaste);
		this.addEventListener("drop", _onDrop);
		this.addEventListener("keydown", _monitorShiftKey);
		this.addEventListener("keyup", _monitorShiftKey);
		this.addEventListener("keydown", _onKey);
		this._keyHandlers = Object.create(keyHandlers);
		const mutation = new MutationObserver(() => this._docWasChanged());
		mutation.observe(root, {
			childList: true,
			attributes: true,
			characterData: true,
			subtree: true
		});
		this._mutation = mutation;
		root.setAttribute("contenteditable", "true");
		this.addEventListener("beforeinput", this._beforeInput);
		this.setHTML("");
	}
	destroy() {
		this._events.forEach((_, type) => {
			this.removeEventListener(type);
		});
		this._mutation.disconnect();
		this._undoIndex = -1;
		this._undoStack = [];
		this._undoStackLength = 0;
	}
	_makeConfig(userConfig) {
		const config = {
			blockTag: "DIV",
			blockAttributes: null,
			tagAttributes: {},
			classNames: {
				color: "color",
				fontFamily: "font",
				fontSize: "size",
				highlight: "highlight"
			},
			undo: {
				documentSizeThreshold: -1,
				undoLimit: -1
			},
			addLinks: true,
			willCutCopy: null,
			toPlainText: null,
			sanitizeToDOMFragment: (html) => {
				const frag = DOMPurify.sanitize(html, {
					ALLOW_UNKNOWN_PROTOCOLS: true,
					WHOLE_DOCUMENT: false,
					RETURN_DOM: true,
					RETURN_DOM_FRAGMENT: true,
					FORCE_BODY: false
				});
				return frag ? document.importNode(frag, true) : document.createDocumentFragment();
			},
			didError: (error) => console.log(error)
		};
		if (userConfig) {
			Object.assign(config, userConfig);
			config.blockTag = config.blockTag.toUpperCase();
		}
		return config;
	}
	setKeyHandler(key, fn) {
		this._keyHandlers[key] = fn;
		return this;
	}
	_beforeInput(event) {
		switch (event.inputType) {
			case "insertLineBreak":
				event.preventDefault();
				this.splitBlock(true);
				break;
			case "insertParagraph":
				event.preventDefault();
				this.splitBlock(false);
				break;
			case "insertOrderedList":
				event.preventDefault();
				this.makeOrderedList();
				break;
			case "insertUnoderedList":
				event.preventDefault();
				this.makeUnorderedList();
				break;
			case "historyUndo":
				event.preventDefault();
				this.undo();
				break;
			case "historyRedo":
				event.preventDefault();
				this.redo();
				break;
			case "formatBold":
				event.preventDefault();
				this.bold();
				break;
			case "formaItalic":
				event.preventDefault();
				this.italic();
				break;
			case "formatUnderline":
				event.preventDefault();
				this.underline();
				break;
			case "formatStrikeThrough":
				event.preventDefault();
				this.strikethrough();
				break;
			case "formatSuperscript":
				event.preventDefault();
				this.superscript();
				break;
			case "formatSubscript":
				event.preventDefault();
				this.subscript();
				break;
			case "formatJustifyFull":
			case "formatJustifyCenter":
			case "formatJustifyRight":
			case "formatJustifyLeft": {
				event.preventDefault();
				let alignment = event.inputType.slice(13).toLowerCase();
				if (alignment === "full") alignment = "justify";
				this.setTextAlignment(alignment);
				break;
			}
			case "formatRemove":
				event.preventDefault();
				this.removeAllFormatting();
				break;
			case "formatSetBlockTextDirection": {
				event.preventDefault();
				let dir = event.data;
				if (dir === "null") dir = null;
				this.setTextDirection(dir);
				break;
			}
			case "formatBackColor":
				event.preventDefault();
				this.setHighlightColor(event.data);
				break;
			case "formatFontColor":
				event.preventDefault();
				this.setTextColor(event.data);
				break;
			case "formatFontName":
				event.preventDefault();
				this.setFontFace(event.data);
				break;
		}
	}
	handleEvent(event) {
		this.fireEvent(event.type, event);
	}
	fireEvent(type, detail) {
		let handlers = this._events.get(type);
		if (/^(?:focus|blur)/.test(type)) {
			const isFocused = this._root === document.activeElement;
			if (type === "focus") {
				if (!isFocused || this._isFocused) return this;
				this._isFocused = true;
			} else {
				if (isFocused || !this._isFocused) return this;
				this._isFocused = false;
			}
		}
		if (handlers) {
			const event = detail instanceof Event ? detail : new CustomEvent(type, { detail });
			handlers = handlers.slice();
			for (const handler of handlers) try {
				if ("handleEvent" in handler) handler.handleEvent(event);
else handler.call(this, event);
			} catch (error) {
				this._config.didError(error);
			}
		}
		return this;
	}
	addEventListener(type, fn) {
		let handlers = this._events.get(type);
		let target = this._root;
		if (!handlers) {
			handlers = [];
			this._events.set(type, handlers);
			if (!this.customEvents.has(type)) {
				if (type === "selectionchange") target = document;
				target.addEventListener(type, this, true);
			}
		}
		handlers.push(fn);
		return this;
	}
	removeEventListener(type, fn) {
		const handlers = this._events.get(type);
		let target = this._root;
		if (handlers) {
			if (fn) {
				let l = handlers.length;
				while (l--) if (handlers[l] === fn) handlers.splice(l, 1);
			} else handlers.length = 0;
			if (!handlers.length) {
				this._events.delete(type);
				if (!this.customEvents.has(type)) {
					if (type === "selectionchange") target = document;
					target.removeEventListener(type, this, true);
				}
			}
		}
		return this;
	}
	focus() {
		this._root.focus({ preventScroll: true });
		return this;
	}
	blur() {
		this._root.blur();
		return this;
	}
	_enableRestoreSelection() {
		this._willRestoreSelection = true;
	}
	_disableRestoreSelection() {
		this._willRestoreSelection = false;
	}
	_restoreSelection() {
		if (this._willRestoreSelection) this.setSelection(this._lastSelection);
	}
	_removeZWS() {
		if (!this._mayHaveZWS) return;
		removeZWS(this._root);
		this._mayHaveZWS = false;
	}
	_saveRangeToBookmark(range) {
		let startNode = createElement("INPUT", {
			id: this.startSelectionId,
			type: "hidden"
		});
		let endNode = createElement("INPUT", {
			id: this.endSelectionId,
			type: "hidden"
		});
		let temp;
		insertNodeInRange(range, startNode);
		range.collapse(false);
		insertNodeInRange(range, endNode);
		if (startNode.compareDocumentPosition(endNode) & Node.DOCUMENT_POSITION_PRECEDING) {
			startNode.id = this.endSelectionId;
			endNode.id = this.startSelectionId;
			temp = startNode;
			startNode = endNode;
			endNode = temp;
		}
		range.setStartAfter(startNode);
		range.setEndBefore(endNode);
	}
	_getRangeAndRemoveBookmark(range) {
		const root = this._root;
		const start = root.querySelector("#" + this.startSelectionId);
		const end = root.querySelector("#" + this.endSelectionId);
		if (start && end) {
			let startContainer = start.parentNode;
			let endContainer = end.parentNode;
			const startOffset = Array.from(startContainer.childNodes).indexOf(start);
			let endOffset = Array.from(endContainer.childNodes).indexOf(end);
			if (startContainer === endContainer) endOffset -= 1;
			start.remove();
			end.remove();
			if (!range) range = document.createRange();
			range.setStart(startContainer, startOffset);
			range.setEnd(endContainer, endOffset);
			mergeInlines(startContainer, range);
			if (startContainer !== endContainer) mergeInlines(endContainer, range);
			if (range.collapsed) {
				startContainer = range.startContainer;
				if (startContainer instanceof Text) {
					endContainer = startContainer.childNodes[range.startOffset];
					if (!endContainer || !(endContainer instanceof Text)) endContainer = startContainer.childNodes[range.startOffset - 1];
					if (endContainer && endContainer instanceof Text) {
						range.setStart(endContainer, 0);
						range.collapse(true);
					}
				}
			}
		}
		return range || null;
	}
	getSelection() {
		const selection = window.getSelection();
		const root = this._root;
		let range = null;
		if (this._isFocused && selection && selection.rangeCount) {
			range = selection.getRangeAt(0).cloneRange();
			const startContainer = range.startContainer;
			const endContainer = range.endContainer;
			if (startContainer && isLeaf(startContainer)) range.setStartBefore(startContainer);
			if (endContainer && isLeaf(endContainer)) range.setEndBefore(endContainer);
		}
		if (range && root.contains(range.commonAncestorContainer)) this._lastSelection = range;
else {
			range = this._lastSelection;
			if (!document.contains(range.commonAncestorContainer)) range = null;
		}
		if (!range) range = createRange(root.firstElementChild || root, 0);
		return range;
	}
	setSelection(range) {
		this._lastSelection = range;
		if (!this._isFocused) this._enableRestoreSelection();
else {
			const selection = window.getSelection();
			if (selection) if ("setBaseAndExtent" in Selection.prototype) selection.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
else {
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}
		return this;
	}
	_moveCursorTo(toStart) {
		const root = this._root;
		const range = createRange(root, toStart ? 0 : root.childNodes.length);
		moveRangeBoundariesDownTree(range);
		this.setSelection(range);
		return this;
	}
	moveCursorToStart() {
		return this._moveCursorTo(true);
	}
	moveCursorToEnd() {
		return this._moveCursorTo(false);
	}
	getCursorPosition() {
		const range = this.getSelection();
		let rect = range.getBoundingClientRect();
		if (rect && !rect.top) {
			this._ignoreChange = true;
			const node = createElement("SPAN");
			node.textContent = ZWS;
			insertNodeInRange(range, node);
			rect = node.getBoundingClientRect();
			const parent = node.parentNode;
			parent.removeChild(node);
			mergeInlines(parent, range);
		}
		return rect;
	}
	getPath() {
		return this._path;
	}
	_updatePathOnEvent() {
		if (this._isFocused) this._updatePath(this.getSelection());
	}
	_updatePath(range, force) {
		const anchor = range.startContainer;
		const focus = range.endContainer;
		let newPath;
		if (force || anchor !== this._lastAnchorNode || focus !== this._lastFocusNode) {
			this._lastAnchorNode = anchor;
			this._lastFocusNode = focus;
			newPath = anchor && focus ? anchor === focus ? this._getPath(focus) : "(selection)" : "";
			if (this._path !== newPath) {
				this._path = newPath;
				this.fireEvent("pathChange", { path: newPath });
			}
		}
		this.fireEvent(range.collapsed ? "cursor" : "select", { range });
	}
	_getPath(node) {
		const root = this._root;
		const config = this._config;
		let path = "";
		if (node && node !== root) {
			const parent = node.parentNode;
			path = parent ? this._getPath(parent) : "";
			if (node instanceof HTMLElement) {
				const id = node.id;
				const classList = node.classList;
				const classNames = Array.from(classList).sort();
				const dir = node.dir;
				const styleNames = config.classNames;
				path += (path ? ">" : "") + node.nodeName;
				if (id) path += "#" + id;
				if (classNames.length) {
					path += ".";
					path += classNames.join(".");
				}
				if (dir) path += "[dir=" + dir + "]";
				if (classList.contains(styleNames.highlight)) path += "[backgroundColor=" + node.style.backgroundColor.replace(/ /g, "") + "]";
				if (classList.contains(styleNames.color)) path += "[color=" + node.style.color.replace(/ /g, "") + "]";
				if (classList.contains(styleNames.fontFamily)) path += "[fontFamily=" + node.style.fontFamily.replace(/ /g, "") + "]";
				if (classList.contains(styleNames.fontSize)) path += "[fontSize=" + node.style.fontSize + "]";
			}
		}
		return path;
	}
	modifyDocument(modificationFn) {
		const mutation = this._mutation;
		if (mutation) {
			if (mutation.takeRecords().length) this._docWasChanged();
			mutation.disconnect();
		}
		this._ignoreAllChanges = true;
		modificationFn();
		this._ignoreAllChanges = false;
		if (mutation) {
			mutation.observe(this._root, {
				childList: true,
				attributes: true,
				characterData: true,
				subtree: true
			});
			this._ignoreChange = false;
		}
		return this;
	}
	_docWasChanged() {
		resetNodeCategoryCache();
		this._mayHaveZWS = true;
		if (this._ignoreAllChanges) return;
		if (this._ignoreChange) {
			this._ignoreChange = false;
			return;
		}
		if (this._isInUndoState) {
			this._isInUndoState = false;
			this.fireEvent("undoStateChange", {
				canUndo: true,
				canRedo: false
			});
		}
		this.fireEvent("input");
	}
	/**
	* Leaves bookmark.
	*/
	_recordUndoState(range, replace) {
		const isInUndoState = this._isInUndoState;
		if (!isInUndoState || replace) {
			let undoIndex = this._undoIndex + 1;
			const undoStack = this._undoStack;
			const undoConfig = this._config.undo;
			const undoThreshold = undoConfig.documentSizeThreshold;
			const undoLimit = undoConfig.undoLimit;
			if (undoIndex < this._undoStackLength) undoStack.length = this._undoStackLength = undoIndex;
			if (range) this._saveRangeToBookmark(range);
			if (isInUndoState) return this;
			const html = this._getRawHTML();
			if (replace) undoIndex -= 1;
			if (undoThreshold > -1 && html.length * 2 > undoThreshold) {
				if (undoLimit > -1 && undoIndex > undoLimit) {
					undoStack.splice(0, undoIndex - undoLimit);
					undoIndex = undoLimit;
					this._undoStackLength = undoLimit;
				}
			}
			undoStack[undoIndex] = html;
			this._undoIndex = undoIndex;
			this._undoStackLength += 1;
			this._isInUndoState = true;
		}
		return this;
	}
	saveUndoState(range) {
		if (!range) range = this.getSelection();
		this._recordUndoState(range, this._isInUndoState);
		this._getRangeAndRemoveBookmark(range);
		return this;
	}
	undo() {
		if (this._undoIndex !== 0 || !this._isInUndoState) {
			this._recordUndoState(this.getSelection(), false);
			this._undoIndex -= 1;
			this._setRawHTML(this._undoStack[this._undoIndex]);
			const range = this._getRangeAndRemoveBookmark();
			if (range) this.setSelection(range);
			this._isInUndoState = true;
			this.fireEvent("undoStateChange", {
				canUndo: this._undoIndex !== 0,
				canRedo: true
			});
			this.fireEvent("input");
		}
		return this.focus();
	}
	redo() {
		const undoIndex = this._undoIndex;
		const undoStackLength = this._undoStackLength;
		if (undoIndex + 1 < undoStackLength && this._isInUndoState) {
			this._undoIndex += 1;
			this._setRawHTML(this._undoStack[this._undoIndex]);
			const range = this._getRangeAndRemoveBookmark();
			if (range) this.setSelection(range);
			this.fireEvent("undoStateChange", {
				canUndo: true,
				canRedo: undoIndex + 2 < undoStackLength
			});
			this.fireEvent("input");
		}
		return this.focus();
	}
	getRoot() {
		return this._root;
	}
	_getRawHTML() {
		return this._root.innerHTML;
	}
	_setRawHTML(html) {
		const root = this._root;
		root.innerHTML = html;
		let node = root;
		const child = node.firstChild;
		if (!child || child.nodeName === "BR") {
			const block = this.createDefaultBlock();
			if (child) node.replaceChild(block, child);
else node.appendChild(block);
		} else while (node = getNextBlock(node, root)) fixCursor(node);
		this._ignoreChange = true;
		return this;
	}
	getHTML(withBookmark) {
		let range;
		if (withBookmark) {
			range = this.getSelection();
			this._saveRangeToBookmark(range);
		}
		const html = this._getRawHTML().replace(/\u200B/g, "");
		if (withBookmark) this._getRangeAndRemoveBookmark(range);
		return html;
	}
	setHTML(html) {
		const frag = this._config.sanitizeToDOMFragment(html, this);
		const root = this._root;
		cleanTree(frag, this._config);
		cleanupBRs(frag, root, false, this._config);
		fixContainer(frag, root, this._config);
		let node = frag;
		let child = node.firstChild;
		if (!child || child.nodeName === "BR") {
			const block = this.createDefaultBlock();
			if (child) node.replaceChild(block, child);
else node.appendChild(block);
		} else while (node = getNextBlock(node, root)) fixCursor(node);
		this._ignoreChange = true;
		while (child = root.lastChild) root.removeChild(child);
		root.appendChild(frag);
		this._undoIndex = -1;
		this._undoStack.length = 0;
		this._undoStackLength = 0;
		this._isInUndoState = false;
		const range = this._getRangeAndRemoveBookmark() || createRange(root.firstElementChild || root, 0);
		this.saveUndoState(range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this;
	}
	/**
	* Insert HTML at the cursor location. If the selection is not collapsed
	* insertTreeFragmentIntoRange will delete the selection so that it is
	* replaced by the html being inserted.
	*/
	insertHTML(html, isPaste) {
		const config = this._config;
		let frag = config.sanitizeToDOMFragment(html, this);
		const range = this.getSelection();
		this.saveUndoState(range);
		try {
			const root = this._root;
			if (config.addLinks) this.addDetectedLinks(frag, frag);
			cleanTree(frag, this._config);
			cleanupBRs(frag, root, false, this._config);
			removeEmptyInlines(frag);
			frag.normalize();
			let node = frag;
			while (node = getNextBlock(node, frag)) fixCursor(node);
			let doInsert = true;
			if (isPaste) {
				const event = new CustomEvent("willPaste", {
					cancelable: true,
					detail: { fragment: frag }
				});
				this.fireEvent("willPaste", event);
				frag = event.detail.fragment;
				doInsert = !event.defaultPrevented;
			}
			if (doInsert) {
				insertTreeFragmentIntoRange(range, frag, root, config);
				range.collapse(false);
				moveRangeBoundaryOutOf(range, "A", root);
				this._ensureBottomLine();
			}
			this.setSelection(range);
			this._updatePath(range, true);
			if (isPaste) this.focus();
		} catch (error) {
			this._config.didError(error);
		}
		return this;
	}
	insertElement(el, range) {
		if (!range) range = this.getSelection();
		range.collapse(true);
		if (isInline(el)) {
			insertNodeInRange(range, el);
			range.setStartAfter(el);
		} else {
			const root = this._root;
			const startNode = getStartBlockOfRange(range, root);
			let splitNode = startNode || root;
			let nodeAfterSplit = null;
			while (splitNode !== root && !splitNode.nextSibling) splitNode = splitNode.parentNode;
			if (splitNode !== root) {
				const parent = splitNode.parentNode;
				nodeAfterSplit = split(parent, splitNode.nextSibling, root, root);
			}
			if (startNode && isEmptyBlock(startNode)) detach(startNode);
			root.insertBefore(el, nodeAfterSplit);
			const blankLine = this.createDefaultBlock();
			root.insertBefore(blankLine, nodeAfterSplit);
			range.setStart(blankLine, 0);
			range.setEnd(blankLine, 0);
			moveRangeBoundariesDownTree(range);
		}
		this.focus();
		this.setSelection(range);
		this._updatePath(range);
		return this;
	}
	insertImage(src, attributes) {
		const img = createElement("IMG", Object.assign({ src }, attributes));
		this.insertElement(img);
		return img;
	}
	insertPlainText(plainText, isPaste) {
		const range = this.getSelection();
		if (range.collapsed && getNearest(range.startContainer, this._root, "PRE")) {
			const startContainer = range.startContainer;
			let offset = range.startOffset;
			let textNode;
			if (!startContainer || !(startContainer instanceof Text)) {
				const text = document.createTextNode("");
				startContainer.insertBefore(text, startContainer.childNodes[offset]);
				textNode = text;
				offset = 0;
			} else textNode = startContainer;
			let doInsert = true;
			if (isPaste) {
				const event = new CustomEvent("willPaste", {
					cancelable: true,
					detail: { text: plainText }
				});
				this.fireEvent("willPaste", event);
				plainText = event.detail.text;
				doInsert = !event.defaultPrevented;
			}
			if (doInsert) {
				textNode.insertData(offset, plainText);
				range.setStart(textNode, offset + plainText.length);
				range.collapse(true);
			}
			this.setSelection(range);
			return this;
		}
		const lines = plainText.split("\n");
		const config = this._config;
		const tag = config.blockTag;
		const attributes = config.blockAttributes;
		const closeBlock = "</" + tag + ">";
		let openBlock = "<" + tag;
		for (const attr in attributes) openBlock += " " + attr + "=\"" + escapeHTML(attributes[attr]) + "\"";
		openBlock += ">";
		for (let i = 0, l = lines.length; i < l; i += 1) {
			let line = lines[i];
			line = escapeHTML(line).replace(/ (?=(?: |$))/g, "&nbsp;");
			if (i) line = openBlock + (line || "<BR>") + closeBlock;
			lines[i] = line;
		}
		return this.insertHTML(lines.join(""), isPaste);
	}
	getSelectedText(range) {
		return getTextContentsOfRange(range || this.getSelection());
	}
	/**
	* Extracts the font-family and font-size (if any) of the element
	* holding the cursor. If there's a selection, returns an empty object.
	*/
	getFontInfo(range) {
		const fontInfo = {
			color: void 0,
			backgroundColor: void 0,
			fontFamily: void 0,
			fontSize: void 0
		};
		if (!range) range = this.getSelection();
		let seenAttributes = 0;
		let element = range.commonAncestorContainer;
		if (range.collapsed || element instanceof Text) {
			if (element instanceof Text) element = element.parentNode;
			while (seenAttributes < 4 && element) {
				const style = element.style;
				if (style) {
					const color = style.color;
					if (!fontInfo.color && color) {
						fontInfo.color = color;
						seenAttributes += 1;
					}
					const backgroundColor = style.backgroundColor;
					if (!fontInfo.backgroundColor && backgroundColor) {
						fontInfo.backgroundColor = backgroundColor;
						seenAttributes += 1;
					}
					const fontFamily = style.fontFamily;
					if (!fontInfo.fontFamily && fontFamily) {
						fontInfo.fontFamily = fontFamily;
						seenAttributes += 1;
					}
					const fontSize = style.fontSize;
					if (!fontInfo.fontSize && fontSize) {
						fontInfo.fontSize = fontSize;
						seenAttributes += 1;
					}
				}
				element = element.parentNode;
			}
		}
		return fontInfo;
	}
	/**
	* Looks for matching tag and attributes, so won't work if <strong>
	* instead of <b> etc.
	*/
	hasFormat(tag, attributes, range) {
		tag = tag.toUpperCase();
		if (!attributes) attributes = {};
		if (!range) range = this.getSelection();
		if (!range.collapsed && range.startContainer instanceof Text && range.startOffset === range.startContainer.length && range.startContainer.nextSibling) range.setStartBefore(range.startContainer.nextSibling);
		if (!range.collapsed && range.endContainer instanceof Text && range.endOffset === 0 && range.endContainer.previousSibling) range.setEndAfter(range.endContainer.previousSibling);
		const root = this._root;
		const common = range.commonAncestorContainer;
		if (getNearest(common, root, tag, attributes)) return true;
		if (common instanceof Text) return false;
		const walker = new TreeIterator(common, SHOW_TEXT, (node2) => {
			return isNodeContainedInRange(range, node2, true);
		});
		let seenNode = false;
		let node;
		while (node = walker.nextNode()) {
			if (!getNearest(node, root, tag, attributes)) return false;
			seenNode = true;
		}
		return seenNode;
	}
	changeFormat(add, remove, range, partial) {
		if (!range) range = this.getSelection();
		this.saveUndoState(range);
		if (remove) range = this._removeFormat(remove.tag.toUpperCase(), remove.attributes || {}, range, partial);
		if (add) range = this._addFormat(add.tag.toUpperCase(), add.attributes || {}, range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this.focus();
	}
	_addFormat(tag, attributes, range) {
		const root = this._root;
		if (range.collapsed) {
			const el = fixCursor(createElement(tag, attributes));
			insertNodeInRange(range, el);
			const focusNode = el.firstChild || el;
			const focusOffset = focusNode instanceof Text ? focusNode.length : 0;
			range.setStart(focusNode, focusOffset);
			range.collapse(true);
			let block = el;
			while (isInline(block)) block = block.parentNode;
			removeZWS(block, el);
		} else {
			const walker = new TreeIterator(range.commonAncestorContainer, SHOW_ELEMENT_OR_TEXT, (node) => {
				return (node instanceof Text || node.nodeName === "BR" || node.nodeName === "IMG") && isNodeContainedInRange(range, node, true);
			});
			let { startContainer, startOffset, endContainer, endOffset } = range;
			walker.currentNode = startContainer;
			if (!(startContainer instanceof Element) && !(startContainer instanceof Text) || !walker.filter(startContainer)) {
				const next = walker.nextNode();
				if (!next) return range;
				startContainer = next;
				startOffset = 0;
			}
			do {
				let node = walker.currentNode;
				const needsFormat = !getNearest(node, root, tag, attributes);
				if (needsFormat) {
					if (node === endContainer && node.length > endOffset) node.splitText(endOffset);
					if (node === startContainer && startOffset) {
						node = node.splitText(startOffset);
						if (endContainer === startContainer) {
							endContainer = node;
							endOffset -= startOffset;
						} else if (endContainer === startContainer.parentNode) endOffset += 1;
						startContainer = node;
						startOffset = 0;
					}
					const el = createElement(tag, attributes);
					replaceWith(node, el);
					el.appendChild(node);
				}
			} while (walker.nextNode());
			range = createRange(startContainer, startOffset, endContainer, endOffset);
		}
		return range;
	}
	_removeFormat(tag, attributes, range, partial) {
		this._saveRangeToBookmark(range);
		let fixer;
		if (range.collapsed) {
			if (cantFocusEmptyTextNodes) fixer = document.createTextNode(ZWS);
else fixer = document.createTextNode("");
			insertNodeInRange(range, fixer);
		}
		let root = range.commonAncestorContainer;
		while (isInline(root)) root = root.parentNode;
		const startContainer = range.startContainer;
		const startOffset = range.startOffset;
		const endContainer = range.endContainer;
		const endOffset = range.endOffset;
		const toWrap = [];
		const examineNode = (node, exemplar) => {
			if (isNodeContainedInRange(range, node, false)) return;
			let child;
			let next;
			if (!isNodeContainedInRange(range, node, true)) {
				if (!(node instanceof HTMLInputElement) && (!(node instanceof Text) || node.data)) toWrap.push([exemplar, node]);
				return;
			}
			if (node instanceof Text) {
				if (node === endContainer && endOffset !== node.length) toWrap.push([exemplar, node.splitText(endOffset)]);
				if (node === startContainer && startOffset) {
					node.splitText(startOffset);
					toWrap.push([exemplar, node]);
				}
			} else for (child = node.firstChild; child; child = next) {
				next = child.nextSibling;
				examineNode(child, exemplar);
			}
		};
		const formatTags = Array.from(root.getElementsByTagName(tag)).filter((el) => {
			return isNodeContainedInRange(range, el, true) && hasTagAttributes(el, tag, attributes);
		});
		if (!partial) formatTags.forEach((node) => {
			examineNode(node, node);
		});
		toWrap.forEach(([el, node]) => {
			el = el.cloneNode(false);
			replaceWith(node, el);
			el.appendChild(node);
		});
		formatTags.forEach((el) => {
			replaceWith(el, empty(el));
		});
		if (cantFocusEmptyTextNodes && fixer) {
			fixer = fixer.parentNode;
			let block = fixer;
			while (block && isInline(block)) block = block.parentNode;
			if (block) removeZWS(block, fixer);
		}
		this._getRangeAndRemoveBookmark(range);
		if (fixer) range.collapse(false);
		mergeInlines(root, range);
		return range;
	}
	bold() {
		return this.changeFormat({ tag: "B" });
	}
	removeBold() {
		return this.changeFormat(null, { tag: "B" });
	}
	italic() {
		return this.changeFormat({ tag: "I" });
	}
	removeItalic() {
		return this.changeFormat(null, { tag: "I" });
	}
	underline() {
		return this.changeFormat({ tag: "U" });
	}
	removeUnderline() {
		return this.changeFormat(null, { tag: "U" });
	}
	strikethrough() {
		return this.changeFormat({ tag: "S" });
	}
	removeStrikethrough() {
		return this.changeFormat(null, { tag: "S" });
	}
	subscript() {
		return this.changeFormat({ tag: "SUB" }, { tag: "SUP" });
	}
	removeSubscript() {
		return this.changeFormat(null, { tag: "SUB" });
	}
	superscript() {
		return this.changeFormat({ tag: "SUP" }, { tag: "SUB" });
	}
	removeSuperscript() {
		return this.changeFormat(null, { tag: "SUP" });
	}
	makeLink(url, attributes) {
		const range = this.getSelection();
		if (range.collapsed) {
			let protocolEnd = url.indexOf(":") + 1;
			if (protocolEnd) while (url[protocolEnd] === "/") protocolEnd += 1;
			insertNodeInRange(range, document.createTextNode(url.slice(protocolEnd)));
		}
		attributes = Object.assign({ href: url }, this._config.tagAttributes.a, attributes);
		return this.changeFormat({
			tag: "A",
			attributes
		}, { tag: "A" }, range);
	}
	removeLink() {
		return this.changeFormat(null, { tag: "A" }, this.getSelection(), true);
	}
	addDetectedLinks(searchInNode, root) {
		const walker = new TreeIterator(searchInNode, SHOW_TEXT, (node2) => !getNearest(node2, root || this._root, "A"));
		const linkRegExp = this.linkRegExp;
		const defaultAttributes = this._config.tagAttributes.a;
		let node;
		while (node = walker.nextNode()) {
			const parent = node.parentNode;
			let data = node.data;
			let match;
			while (match = linkRegExp.exec(data)) {
				const index = match.index;
				const endIndex = index + match[0].length;
				if (index) parent.insertBefore(document.createTextNode(data.slice(0, index)), node);
				const child = createElement("A", Object.assign({ href: match[1] ? /^(?:ht|f)tps?:/i.test(match[1]) ? match[1] : "http://" + match[1] : "mailto:" + match[0] }, defaultAttributes));
				child.textContent = data.slice(index, endIndex);
				parent.insertBefore(child, node);
				node.data = data = data.slice(endIndex);
			}
		}
		return this;
	}
	setFontFace(name) {
		const className = this._config.classNames.fontFamily;
		return this.changeFormat(name ? {
			tag: "SPAN",
			attributes: {
				class: className,
				style: "font-family: " + name + ", sans-serif;"
			}
		} : null, {
			tag: "SPAN",
			attributes: { class: className }
		});
	}
	setFontSize(size$1) {
		const className = this._config.classNames.fontSize;
		return this.changeFormat(size$1 ? {
			tag: "SPAN",
			attributes: {
				class: className,
				style: "font-size: " + (typeof size$1 === "number" ? size$1 + "px" : size$1)
			}
		} : null, {
			tag: "SPAN",
			attributes: { class: className }
		});
	}
	setTextColor(color) {
		const className = this._config.classNames.color;
		return this.changeFormat(color ? {
			tag: "SPAN",
			attributes: {
				class: className,
				style: "color:" + color
			}
		} : null, {
			tag: "SPAN",
			attributes: { class: className }
		});
	}
	setHighlightColor(color) {
		const className = this._config.classNames.highlight;
		return this.changeFormat(color ? {
			tag: "SPAN",
			attributes: {
				class: className,
				style: "background-color:" + color
			}
		} : null, {
			tag: "SPAN",
			attributes: { class: className }
		});
	}
	_ensureBottomLine() {
		const root = this._root;
		const last = root.lastElementChild;
		if (!last || last.nodeName !== this._config.blockTag || !isBlock(last)) root.appendChild(this.createDefaultBlock());
	}
	createDefaultBlock(children) {
		const config = this._config;
		return fixCursor(createElement(config.blockTag, config.blockAttributes, children));
	}
	splitBlock(lineBreakOnly, range) {
		if (!range) range = this.getSelection();
		const root = this._root;
		let block;
		let parent;
		let node;
		let nodeAfterSplit;
		this._recordUndoState(range);
		this._removeZWS();
		this._getRangeAndRemoveBookmark(range);
		if (!range.collapsed) deleteContentsOfRange(range, root);
		if (this._config.addLinks) {
			moveRangeBoundariesDownTree(range);
			const textNode = range.startContainer;
			const offset2 = range.startOffset;
			setTimeout(() => {
				linkifyText(this, textNode, offset2);
			}, 0);
		}
		block = getStartBlockOfRange(range, root);
		if (block && (parent = getNearest(block, root, "PRE"))) {
			moveRangeBoundariesDownTree(range);
			node = range.startContainer;
			const offset2 = range.startOffset;
			if (!(node instanceof Text)) {
				node = document.createTextNode("");
				parent.insertBefore(node, parent.firstChild);
			}
			if (!lineBreakOnly && node instanceof Text && (node.data.charAt(offset2 - 1) === "\n" || rangeDoesStartAtBlockBoundary(range, root)) && (node.data.charAt(offset2) === "\n" || rangeDoesEndAtBlockBoundary(range, root))) {
				node.deleteData(offset2 && offset2 - 1, offset2 ? 2 : 1);
				nodeAfterSplit = split(node, offset2 && offset2 - 1, root, root);
				node = nodeAfterSplit.previousSibling;
				if (!node.textContent) detach(node);
				node = this.createDefaultBlock();
				nodeAfterSplit.parentNode.insertBefore(node, nodeAfterSplit);
				if (!nodeAfterSplit.textContent) detach(nodeAfterSplit);
				range.setStart(node, 0);
			} else {
				node.insertData(offset2, "\n");
				fixCursor(parent);
				if (node.length === offset2 + 1) range.setStartAfter(node);
else range.setStart(node, offset2 + 1);
			}
			range.collapse(true);
			this.setSelection(range);
			this._updatePath(range, true);
			this._docWasChanged();
			return this;
		}
		if (!block || lineBreakOnly || /^T[HD]$/.test(block.nodeName)) {
			moveRangeBoundaryOutOf(range, "A", root);
			insertNodeInRange(range, createElement("BR"));
			range.collapse(false);
			this.setSelection(range);
			this._updatePath(range, true);
			return this;
		}
		if (parent = getNearest(block, root, "LI")) block = parent;
		if (isEmptyBlock(block)) {
			if (getNearest(block, root, "UL") || getNearest(block, root, "OL")) {
				this.decreaseListLevel(range);
				return this;
			} else if (getNearest(block, root, "DIV", indentedNodeAttributes)) {
				this.removeIndentation(range);
				return this;
			}
		}
		node = range.startContainer;
		const offset = range.startOffset;
		let splitTag = this.tagAfterSplit[block.nodeName];
		nodeAfterSplit = split(node, offset, block.parentNode, this._root);
		const config = this._config;
		let splitProperties = null;
		if (!splitTag) {
			splitTag = config.blockTag;
			splitProperties = config.blockAttributes;
		}
		if (!hasTagAttributes(nodeAfterSplit, splitTag, splitProperties)) {
			block = createElement(splitTag, splitProperties);
			if (nodeAfterSplit.dir) block.dir = nodeAfterSplit.dir;
			replaceWith(nodeAfterSplit, block);
			block.appendChild(empty(nodeAfterSplit));
			nodeAfterSplit = block;
		}
		removeZWS(block);
		removeEmptyInlines(block);
		fixCursor(block);
		while (nodeAfterSplit instanceof Element) {
			let child = nodeAfterSplit.firstChild;
			let next;
			if (nodeAfterSplit.nodeName === "A" && (!nodeAfterSplit.textContent || nodeAfterSplit.textContent === ZWS)) {
				child = document.createTextNode("");
				replaceWith(nodeAfterSplit, child);
				nodeAfterSplit = child;
				break;
			}
			while (child && child instanceof Text && !child.data) {
				next = child.nextSibling;
				if (!next || next.nodeName === "BR") break;
				detach(child);
				child = next;
			}
			if (!child || child.nodeName === "BR" || child instanceof Text) break;
			nodeAfterSplit = child;
		}
		range = createRange(nodeAfterSplit, 0);
		this.setSelection(range);
		this._updatePath(range, true);
		return this;
	}
	forEachBlock(fn, mutates, range) {
		if (!range) range = this.getSelection();
		if (mutates) this.saveUndoState(range);
		const root = this._root;
		let start = getStartBlockOfRange(range, root);
		const end = getEndBlockOfRange(range, root);
		if (start && end) do 
			if (fn(start) || start === end) break;
		while (start = getNextBlock(start, root));
		if (mutates) {
			this.setSelection(range);
			this._updatePath(range, true);
		}
		return this;
	}
	modifyBlocks(modify, range) {
		if (!range) range = this.getSelection();
		this._recordUndoState(range, this._isInUndoState);
		const root = this._root;
		expandRangeToBlockBoundaries(range, root);
		moveRangeBoundariesUpTree(range, root, root, root);
		const frag = extractContentsOfRange(range, root, root);
		if (!range.collapsed) {
			let node = range.endContainer;
			if (node === root) range.collapse(false);
else {
				while (node.parentNode !== root) node = node.parentNode;
				range.setStartBefore(node);
				range.collapse(true);
			}
		}
		insertNodeInRange(range, modify.call(this, frag));
		if (range.endOffset < range.endContainer.childNodes.length) mergeContainers(range.endContainer.childNodes[range.endOffset], root, this._config);
		mergeContainers(range.startContainer.childNodes[range.startOffset], root, this._config);
		this._getRangeAndRemoveBookmark(range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this;
	}
	setTextAlignment(alignment) {
		this.forEachBlock((block) => {
			const className = block.className.split(/\s+/).filter((klass) => {
				return !!klass && !/^align/.test(klass);
			}).join(" ");
			if (alignment) {
				block.className = className + " align-" + alignment;
				block.style.textAlign = alignment;
			} else {
				block.className = className;
				block.style.textAlign = "";
			}
		}, true);
		return this.focus();
	}
	setTextDirection(direction) {
		this.forEachBlock((block) => {
			if (direction) block.dir = direction;
else block.removeAttribute("dir");
		}, true);
		return this.focus();
	}
	_getListSelection(range, root) {
		let list = range.commonAncestorContainer;
		let startLi = range.startContainer;
		let endLi = range.endContainer;
		while (list && list !== root && !/^[OU]L$/.test(list.nodeName)) list = list.parentNode;
		if (!list || list === root) return null;
		if (startLi === list) startLi = startLi.childNodes[range.startOffset];
		if (endLi === list) endLi = endLi.childNodes[range.endOffset];
		while (startLi && startLi.parentNode !== list) startLi = startLi.parentNode;
		while (endLi && endLi.parentNode !== list) endLi = endLi.parentNode;
		return [
			list,
			startLi,
			endLi
		];
	}
	increaseListLevel(range) {
		if (!range) range = this.getSelection();
		const root = this._root;
		const listSelection = this._getListSelection(range, root);
		if (!listSelection) return this.focus();
		let [list, startLi, endLi] = listSelection;
		if (!startLi || startLi === list.firstChild) return this.focus();
		this._recordUndoState(range, this._isInUndoState);
		const type = list.nodeName;
		let newParent = startLi.previousSibling;
		let listAttrs;
		let next;
		if (newParent.nodeName !== type) {
			listAttrs = this._config.tagAttributes[type.toLowerCase()];
			newParent = createElement(type, listAttrs);
			list.insertBefore(newParent, startLi);
		}
		do {
			next = startLi === endLi ? null : startLi.nextSibling;
			newParent.appendChild(startLi);
		} while (startLi = next);
		next = newParent.nextSibling;
		if (next) mergeContainers(next, root, this._config);
		this._getRangeAndRemoveBookmark(range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this.focus();
	}
	decreaseListLevel(range) {
		if (!range) range = this.getSelection();
		const root = this._root;
		const listSelection = this._getListSelection(range, root);
		if (!listSelection) return this.focus();
		let [list, startLi, endLi] = listSelection;
		if (!startLi) startLi = list.firstChild;
		if (!endLi) endLi = list.lastChild;
		this._recordUndoState(range, this._isInUndoState);
		let next;
		let insertBefore = null;
		if (startLi) {
			let newParent = list.parentNode;
			insertBefore = !endLi.nextSibling ? list.nextSibling : split(list, endLi.nextSibling, newParent, root);
			if (newParent !== root && newParent.nodeName === "LI") {
				newParent = newParent.parentNode;
				while (insertBefore) {
					next = insertBefore.nextSibling;
					endLi.appendChild(insertBefore);
					insertBefore = next;
				}
				insertBefore = list.parentNode.nextSibling;
			}
			const makeNotList = !/^[OU]L$/.test(newParent.nodeName);
			do {
				next = startLi === endLi ? null : startLi.nextSibling;
				list.removeChild(startLi);
				if (makeNotList && startLi.nodeName === "LI") startLi = this.createDefaultBlock([empty(startLi)]);
				newParent.insertBefore(startLi, insertBefore);
			} while (startLi = next);
		}
		if (!list.firstChild) detach(list);
		if (insertBefore) mergeContainers(insertBefore, root, this._config);
		this._getRangeAndRemoveBookmark(range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this.focus();
	}
	_makeList(frag, type) {
		const walker = getBlockWalker(frag, this._root);
		const tagAttributes = this._config.tagAttributes;
		const listAttrs = tagAttributes[type.toLowerCase()];
		const listItemAttrs = tagAttributes.li;
		let node;
		while (node = walker.nextNode()) {
			if (node.parentNode instanceof HTMLLIElement) {
				node = node.parentNode;
				walker.currentNode = node.lastChild;
			}
			if (!(node instanceof HTMLLIElement)) {
				const newLi = createElement("LI", listItemAttrs);
				if (node.dir) newLi.dir = node.dir;
				const prev = node.previousSibling;
				if (prev && prev.nodeName === type) {
					prev.appendChild(newLi);
					detach(node);
				} else replaceWith(node, createElement(type, listAttrs, [newLi]));
				newLi.appendChild(empty(node));
				walker.currentNode = newLi;
			} else {
				node = node.parentNode;
				const tag = node.nodeName;
				if (tag !== type && /^[OU]L$/.test(tag)) replaceWith(node, createElement(type, listAttrs, [empty(node)]));
			}
		}
		return frag;
	}
	makeUnorderedList() {
		this.modifyBlocks((frag) => this._makeList(frag, "UL"));
		return this.focus();
	}
	makeOrderedList() {
		this.modifyBlocks((frag) => this._makeList(frag, "OL"));
		return this.focus();
	}
	removeList() {
		this.modifyBlocks((frag) => {
			const lists = frag.querySelectorAll("UL, OL");
			const items = frag.querySelectorAll("LI");
			const root = this._root;
			for (let i = 0, l = lists.length; i < l; i += 1) {
				const list = lists[i];
				const listFrag = empty(list);
				fixContainer(listFrag, root, this._config);
				replaceWith(list, listFrag);
			}
			for (let i = 0, l = items.length; i < l; i += 1) {
				const item = items[i];
				if (isBlock(item)) replaceWith(item, this.createDefaultBlock([empty(item)]));
else {
					fixContainer(item, root, this._config);
					replaceWith(item, empty(item));
				}
			}
			return frag;
		});
		return this.focus();
	}
	increaseIndentationLevel(range) {
		this.modifyBlocks((frag) => createElement("DIV", indentedNodeAttributes, [frag]), range);
		return this.focus();
	}
	decreaseIndentationLevel(range) {
		this.modifyBlocks((frag) => {
			Array.from(frag.querySelectorAll("." + indentedNodeAttributes.class)).filter((el) => {
				return !getNearest(el.parentNode, frag, "DIV", indentedNodeAttributes);
			}).forEach((el) => {
				replaceWith(el, empty(el));
			});
			return frag;
		}, range);
		return this.focus();
	}
	removeIndentation(range) {
		this.modifyBlocks(() => this.createDefaultBlock([createElement("INPUT", {
			id: this.startSelectionId,
			type: "hidden"
		}), createElement("INPUT", {
			id: this.endSelectionId,
			type: "hidden"
		})]), range);
		return this.focus();
	}
	code() {
		const range = this.getSelection();
		if (range.collapsed || isContainer(range.commonAncestorContainer)) {
			this.modifyBlocks((frag) => {
				const root = this._root;
				const output = document.createDocumentFragment();
				const blockWalker = getBlockWalker(frag, root);
				let node;
				while (node = blockWalker.nextNode()) {
					let nodes = node.querySelectorAll("BR");
					const brBreaksLine = [];
					let l = nodes.length;
					for (let i = 0; i < l; i += 1) brBreaksLine[i] = isLineBreak(nodes[i], false);
					while (l--) {
						const br = nodes[l];
						if (!brBreaksLine[l]) detach(br);
else replaceWith(br, document.createTextNode("\n"));
					}
					nodes = node.querySelectorAll("CODE");
					l = nodes.length;
					while (l--) replaceWith(nodes[l], empty(nodes[l]));
					if (output.childNodes.length) output.appendChild(document.createTextNode("\n"));
					output.appendChild(empty(node));
				}
				const textWalker = new TreeIterator(output, SHOW_TEXT);
				while (node = textWalker.nextNode()) node.data = node.data.replace(/ /g, " ");
				output.normalize();
				return fixCursor(createElement("PRE", this._config.tagAttributes.pre, [output]));
			}, range);
			this.focus();
		} else this.changeFormat({
			tag: "CODE",
			attributes: this._config.tagAttributes.code
		}, null, range);
		return this;
	}
	removeCode() {
		const range = this.getSelection();
		const ancestor = range.commonAncestorContainer;
		const inPre = getNearest(ancestor, this._root, "PRE");
		if (inPre) {
			this.modifyBlocks((frag) => {
				const root = this._root;
				const pres = frag.querySelectorAll("PRE");
				let l = pres.length;
				while (l--) {
					const pre = pres[l];
					const walker = new TreeIterator(pre, SHOW_TEXT);
					let node;
					while (node = walker.nextNode()) {
						let value = node.data;
						value = value.replace(/ (?= )/g, "\xA0");
						const contents = document.createDocumentFragment();
						let index;
						while ((index = value.indexOf("\n")) > -1) {
							contents.appendChild(document.createTextNode(value.slice(0, index)));
							contents.appendChild(createElement("BR"));
							value = value.slice(index + 1);
						}
						node.parentNode.insertBefore(contents, node);
						node.data = value;
					}
					fixContainer(pre, root, this._config);
					replaceWith(pre, empty(pre));
				}
				return frag;
			}, range);
			this.focus();
		} else this.changeFormat(null, { tag: "CODE" }, range);
		return this;
	}
	toggleCode() {
		if (this.hasFormat("PRE") || this.hasFormat("CODE")) this.removeCode();
else this.code();
		return this;
	}
	_removeFormatting(root, clean) {
		for (let node = root.firstChild, next; node; node = next) {
			next = node.nextSibling;
			if (isInline(node)) {
				if (node instanceof Text || node.nodeName === "BR" || node.nodeName === "IMG") {
					clean.appendChild(node);
					continue;
				}
			} else if (isBlock(node)) {
				clean.appendChild(this.createDefaultBlock([this._removeFormatting(node, document.createDocumentFragment())]));
				continue;
			}
			this._removeFormatting(node, clean);
		}
		return clean;
	}
	removeAllFormatting(range) {
		if (!range) range = this.getSelection();
		if (range.collapsed) return this.focus();
		const root = this._root;
		let stopNode = range.commonAncestorContainer;
		while (stopNode && !isBlock(stopNode)) stopNode = stopNode.parentNode;
		if (!stopNode) {
			expandRangeToBlockBoundaries(range, root);
			stopNode = root;
		}
		if (stopNode instanceof Text) return this.focus();
		this.saveUndoState(range);
		moveRangeBoundariesUpTree(range, stopNode, stopNode, root);
		const startContainer = range.startContainer;
		let startOffset = range.startOffset;
		const endContainer = range.endContainer;
		let endOffset = range.endOffset;
		const formattedNodes = document.createDocumentFragment();
		const cleanNodes = document.createDocumentFragment();
		const nodeAfterSplit = split(endContainer, endOffset, stopNode, root);
		let nodeInSplit = split(startContainer, startOffset, stopNode, root);
		let nextNode;
		while (nodeInSplit !== nodeAfterSplit) {
			nextNode = nodeInSplit.nextSibling;
			formattedNodes.appendChild(nodeInSplit);
			nodeInSplit = nextNode;
		}
		this._removeFormatting(formattedNodes, cleanNodes);
		cleanNodes.normalize();
		nodeInSplit = cleanNodes.firstChild;
		nextNode = cleanNodes.lastChild;
		if (nodeInSplit) {
			stopNode.insertBefore(cleanNodes, nodeAfterSplit);
			const childNodes = Array.from(stopNode.childNodes);
			startOffset = childNodes.indexOf(nodeInSplit);
			endOffset = nextNode ? childNodes.indexOf(nextNode) + 1 : 0;
		} else if (nodeAfterSplit) {
			const childNodes = Array.from(stopNode.childNodes);
			startOffset = childNodes.indexOf(nodeAfterSplit);
			endOffset = startOffset;
		}
		range.setStart(stopNode, startOffset);
		range.setEnd(stopNode, endOffset);
		mergeInlines(stopNode, range);
		moveRangeBoundariesDownTree(range);
		this.setSelection(range);
		this._updatePath(range, true);
		return this.focus();
	}
};
var Squire_default = Squire;

//#endregion
//#region src/common/gui/editor/Editor.ts
var Editor = class {
	squire;
	initialized = defer();
	domElement = null;
	showOutline = false;
	enabled = true;
	readOnly = false;
	createsLists = true;
	userHasPasted = false;
	styleActions = Object.freeze({
		b: [
			() => this.squire.bold(),
			() => this.squire.removeBold(),
			() => this.styles.b
		],
		i: [
			() => this.squire.italic(),
			() => this.squire.removeItalic(),
			() => this.styles.i
		],
		u: [
			() => this.squire.underline(),
			() => this.squire.removeUnderline(),
			() => this.styles.u
		],
		c: [
			() => this.squire.setFontFace("monospace"),
			() => this.squire.setFontFace(null),
			() => this.styles.c
		],
		a: [
			() => this.makeLink(),
			() => this.squire.removeLink(),
			() => this.styles.a
		]
	});
	styles = {
		b: false,
		i: false,
		u: false,
		c: false,
		a: false,
		alignment: "left",
		listing: null
	};
	/**
	* squire 2.0 removed the isPaste argument from the sanitizeToDomFragment function.
	* since sanitizeToDomFragment is called before squire's willPaste event is fired, we
	* can't have our sanitization strategy depend on the willPaste event.
	*
	* we therefore add our own paste handler to the dom element squire uses and set a
	* flag once we detect a paste and reset it when squire next fires the "input" event.
	*
	* * user pastes
	* * "paste" event on dom sets flag
	* * sanitizeToDomFragment is called by squire
	* * "input" event on squire resets flag.
	*/
	pasteListener = (_) => this.userHasPasted = true;
	constructor(minHeight, sanitizer, staticLineAmount) {
		this.minHeight = minHeight;
		this.sanitizer = sanitizer;
		this.staticLineAmount = staticLineAmount;
		this.onremove = this.onremove.bind(this);
		this.onbeforeupdate = this.onbeforeupdate.bind(this);
		this.view = this.view.bind(this);
	}
	onbeforeupdate() {
		return this.squire == null;
	}
	onremove() {
		this.domElement?.removeEventListener("paste", this.pasteListener);
		if (this.squire) {
			this.squire.destroy();
			this.squire = null;
			this.initialized = defer();
		}
	}
	view() {
		return mithril_default(".selectable", {
			role: "textbox",
			"aria-multiline": "true",
			"data-testid": "text_editor",
			tabindex: TabIndex.Default,
			oncreate: (vnode) => this.initSquire(vnode.dom),
			class: `flex-grow ${this.showOutline ? "" : "hide-outline"}`,
			style: this.staticLineAmount ? {
				"max-height": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
				"min-height:": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
				overflow: "scroll"
			} : this.minHeight ? { "min-height": px(this.minHeight) } : {}
		});
	}
	isEmpty() {
		return !this.squire || this.squire.getHTML() === "<div><br></div>";
	}
	getValue() {
		return this.isEmpty() ? "" : this.squire.getHTML();
	}
	addChangeListener(callback) {
		this.squire.addEventListener("input", callback);
	}
	setMinHeight(minHeight) {
		this.minHeight = minHeight;
		return this;
	}
	setShowOutline(show) {
		this.showOutline = show;
	}
	/**
	* Sets a static amount 'n' of lines the Editor should always render/allow.
	* When using n+1 lines, the editor will instead begin to be scrollable.
	* Currently, this overwrites min-height.
	*/
	setStaticNumberOfLines(numberOfLines) {
		this.staticLineAmount = numberOfLines;
		return this;
	}
	setCreatesLists(createsLists) {
		this.createsLists = createsLists;
		return this;
	}
	initSquire(domElement) {
		this.squire = new Squire_default(domElement, {
			sanitizeToDOMFragment: (html) => this.sanitizer(html, this.userHasPasted),
			blockAttributes: { dir: "auto" }
		});
		this.squire.addEventListener("willPaste", (e) => {
			if (!this.isEnabled()) e.preventDefault();
		});
		this.squire.addEventListener("input", (_) => this.userHasPasted = false);
		domElement.addEventListener("paste", this.pasteListener);
		this.squire.addEventListener("pathChange", () => {
			this.getStylesAtPath();
			mithril_default.redraw();
		});
		this.domElement = domElement;
		this.setEnabled(this.enabled);
		this.initialized.resolve();
	}
	setEnabled(enabled) {
		this.enabled = enabled;
		this.updateContentEditableAttribute();
	}
	setReadOnly(readOnly) {
		this.readOnly = readOnly;
		this.updateContentEditableAttribute();
	}
	isReadOnly() {
		return this.readOnly;
	}
	isEnabled() {
		return this.enabled;
	}
	setHTML(html) {
		this.squire.setHTML(html);
	}
	getHTML() {
		return this.squire.getHTML();
	}
	setStyle(state, style) {
		(state ? this.styleActions[style][0] : this.styleActions[style][1])();
	}
	hasStyle = (style) => this.squire ? this.styleActions[style][2]() : false;
	getStylesAtPath = () => {
		if (!this.squire) return;
		let pathSegments = this.squire.getPath().split(">");
		const ulIndex = pathSegments.lastIndexOf("UL");
		const olIndex = pathSegments.lastIndexOf("OL");
		if (ulIndex === -1) if (olIndex > -1) this.styles.listing = "ol";
else this.styles.listing = null;
else if (olIndex === -1) if (ulIndex > -1) this.styles.listing = "ul";
else this.styles.listing = null;
else if (olIndex > ulIndex) this.styles.listing = "ol";
else this.styles.listing = "ul";
		this.styles.a = pathSegments.includes("A");
		let alignment = pathSegments.find((f) => f.includes("align"));
		if (alignment !== undefined) switch (alignment.split(".")[1].substring(6)) {
			case "left":
				this.styles.alignment = "left";
				break;
			case "right":
				this.styles.alignment = "right";
				break;
			case "center":
				this.styles.alignment = "center";
				break;
			default: this.styles.alignment = "justify";
		}
else this.styles.alignment = "left";
		this.styles.c = pathSegments.some((f) => f.includes("monospace"));
		this.styles.b = this.squire.hasFormat("b");
		this.styles.u = this.squire.hasFormat("u");
		this.styles.i = this.squire.hasFormat("i");
	};
	makeLink() {
		Dialog.showTextInputDialog({
			title: "makeLink_action",
			label: "url_label",
			textFieldType: TextFieldType.Url
		}).then((url) => {
			if (isMailAddress(url, false)) url = "mailto:" + url;
else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:") && !url.startsWith("{")) url = "https://" + url;
			this.squire.makeLink(url);
		});
	}
	insertImage(srcAttr, attrs) {
		return this.squire.insertImage(srcAttr, attrs);
	}
	/**
	* Inserts the given html content at the current cursor position.
	*/
	insertHTML(html) {
		this.squire.insertHTML(html);
	}
	getDOM() {
		return this.squire.getRoot();
	}
	getCursorPosition() {
		return this.squire.getCursorPosition();
	}
	focus() {
		this.squire.focus();
		this.getStylesAtPath();
	}
	isAttached() {
		return this.squire != null;
	}
	getSelectedText() {
		return this.squire.getSelectedText();
	}
	addEventListener(type, handler) {
		this.squire.addEventListener(type, handler);
	}
	setSelection(range) {
		this.squire.setSelection(range);
	}
	/**
	* Convenience function for this.isEnabled() && !this.isReadOnly()
	*/
	isEditable() {
		return this.isEnabled() && !this.isReadOnly();
	}
	updateContentEditableAttribute() {
		if (this.domElement) this.domElement.setAttribute("contenteditable", String(this.isEditable()));
	}
};

//#endregion
//#region src/common/gui/base/RichTextToolbar.ts
var RichTextToolbar = class {
	selectedSize = size.font_size_base;
	constructor({ attrs }) {
		try {
			this.selectedSize = parseInt(attrs.editor.squire.getFontInfo().size.slice(0, -2));
		} catch (e) {
			this.selectedSize = size.font_size_base;
		}
	}
	oncreate(vnode) {
		const dom = vnode.dom;
		dom.style.height = "0";
		animateToolbar(dom, true);
	}
	onbeforeremove(vnode) {
		return animateToolbar(vnode.dom, false);
	}
	view({ attrs }) {
		return mithril_default(".elevated-bg.overflow-hidden", { style: {
			top: "0px",
			position: client.browser === BrowserType.SAFARI ? client.isMacOS ? "-webkit-sticky" : "inherit" : "sticky"
		} }, [mithril_default(".flex-end.wrap.items-center.mb-xs.mt-xs.ml-between-s", this.renderStyleButtons(attrs), this.renderCustomButtons(attrs), this.renderAlignDropDown(attrs), this.renderSizeButtons(attrs), this.renderRemoveFormattingButton(attrs))]);
	}
	renderStyleButtons(attrs) {
		const { editor, imageButtonClickHandler } = attrs;
		return [
			this.renderStyleToggleButton("b", lang.get("formatTextBold_msg") + " (Ctrl + B)", Icons.Bold, editor),
			this.renderStyleToggleButton("i", lang.get("formatTextItalic_msg") + " (Ctrl + I)", Icons.Italic, editor),
			this.renderStyleToggleButton("u", lang.get("formatTextUnderline_msg") + " (Ctrl + U)", Icons.Underline, editor),
			this.renderStyleToggleButton("c", lang.get("formatTextMonospace_msg"), Icons.Code, editor),
			this.renderStyleToggleButton("a", editor.hasStyle("a") ? lang.get("breakLink_action") : lang.get("makeLink_action"), Icons.Link, editor),
			this.renderListToggleButton("ol", lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)", Icons.ListOrdered, editor),
			this.renderListToggleButton("ul", lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)", Icons.ListUnordered, editor),
			imageButtonClickHandler ? mithril_default(IconButton, {
				title: "insertImage_action",
				click: (ev) => imageButtonClickHandler(ev, editor),
				icon: Icons.Picture,
				size: ButtonSize.Compact
			}) : null
		];
	}
	renderStyleToggleButton(style, title, icon, editor) {
		return this.renderToggleButton(lang.makeTranslation(title, title), icon, () => editor.setStyle(!editor.hasStyle(style), style), () => editor.hasStyle(style));
	}
	renderListToggleButton(listing, title, icon, editor) {
		return this.renderToggleButton(lang.makeTranslation(title, title), icon, () => editor.styles.listing === listing ? editor.squire.removeList() : listing === "ul" ? editor.squire.makeUnorderedList() : editor.squire.makeOrderedList(), () => editor.styles.listing === listing);
	}
	renderToggleButton(title, icon, click, isSelected) {
		return mithril_default(ToggleButton, {
			title,
			onToggled: click,
			icon,
			toggled: isSelected(),
			size: ButtonSize.Compact
		});
	}
	renderCustomButtons(attrs) {
		return (attrs.customButtonAttrs ?? []).map((attrs$1) => mithril_default(IconButton, attrs$1));
	}
	renderAlignDropDown(attrs) {
		if (attrs.alignmentEnabled === false) return null;
		const alignButtonAttrs = (alignment, title, icon) => {
			return {
				label: title,
				click: () => {
					attrs.editor.squire.setTextAlignment(alignment);
					setTimeout(() => attrs.editor.squire.focus(), 100);
					mithril_default.redraw();
				},
				icon
			};
		};
		return mithril_default(IconButton, {
			title: "formatTextAlignment_msg",
			icon: this.alignIcon(attrs),
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation();
				createDropdown({
					width: 200,
					lazyButtons: () => [
						alignButtonAttrs("left", "formatTextLeft_msg", Icons.AlignLeft),
						alignButtonAttrs("center", "formatTextCenter_msg", Icons.AlignCenter),
						alignButtonAttrs("right", "formatTextRight_msg", Icons.AlignRight),
						alignButtonAttrs("justify", "formatTextJustify_msg", Icons.AlignJustified)
					]
				})(e, dom);
			}
		});
	}
	alignIcon(attrs) {
		switch (attrs.editor.styles.alignment) {
			case "left": return Icons.AlignLeft;
			case "center": return Icons.AlignCenter;
			case "right": return Icons.AlignRight;
			case "justify": return Icons.AlignJustified;
		}
	}
	renderSizeButtons({ editor }) {
		return mithril_default(IconButton, {
			title: "formatTextFontSize_msg",
			icon: Icons.FontSize,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation();
				createDropdown({ lazyButtons: () => numberRange(8, 144).map((n) => {
					return {
						label: lang.makeTranslation("font_size_" + n, n.toString()),
						click: () => {
							editor.squire.setFontSize(n);
							this.selectedSize = n;
							setTimeout(() => editor.squire.focus(), 100);
							mithril_default.redraw();
						}
					};
				}) })(e, dom);
			}
		});
	}
	renderRemoveFormattingButton(attrs) {
		if (attrs.fontSizeEnabled === false) return null;
		return mithril_default(IconButton, {
			title: "removeFormatting_action",
			icon: Icons.FormatClear,
			click: (e) => {
				e.stopPropagation();
				attrs.editor.squire.removeAllFormatting();
			},
			size: ButtonSize.Compact
		});
	}
};
function animateToolbar(dom, appear) {
	let childHeight = Array.from(dom.children).map((domElement) => domElement.offsetHeight).reduce((current, previous) => Math.max(current, previous), 0);
	return animations.add(dom, [height(appear ? 0 : childHeight, appear ? childHeight : 0), appear ? opacity(0, 1, false) : opacity(1, 0, false)]).then(() => {
		if (appear) dom.style.height = "";
	});
}

//#endregion
//#region src/common/gui/editor/HtmlEditor.ts
var import_stream = __toESM(require_stream(), 1);
let HtmlEditorMode = function(HtmlEditorMode$1) {
	HtmlEditorMode$1["HTML"] = "html";
	HtmlEditorMode$1["WYSIWYG"] = "what you see is what you get";
	return HtmlEditorMode$1;
}({});
const HTML_EDITOR_LINE_HEIGHT = 24;
var HtmlEditor = class {
	editor;
	mode = HtmlEditorMode.WYSIWYG;
	active = false;
	domTextArea = null;
	_showBorders = false;
	minHeight = null;
	placeholderId = null;
	placeholderDomElement = null;
	value = (0, import_stream.default)("");
	htmlMonospace = true;
	modeSwitcherLabel = null;
	toolbarEnabled = false;
	toolbarAttrs = {};
	staticLineAmount = null;
	constructor(label, injections) {
		this.label = label;
		this.injections = injections;
		this.editor = new Editor(null, (html) => htmlSanitizer.sanitizeFragment(html, { blockExternalContent: false }).fragment, null);
		this.view = this.view.bind(this);
		this.initializeEditorListeners();
	}
	view() {
		const modeSwitcherLabel = this.modeSwitcherLabel;
		let borderClasses = this._showBorders ? this.active && this.editor.isEnabled() ? ".editor-border-active.border-radius" : ".editor-border.border-radius." + (modeSwitcherLabel != null ? ".editor-no-top-border" : "") : "";
		const renderedInjections = this.injections?.() ?? null;
		const getPlaceholder = () => !this.active && this.isEmpty() ? mithril_default(".abs.text-ellipsis.noselect.z1.i.pr-s", {
			oncreate: (vnode) => this.placeholderDomElement = vnode.dom,
			onclick: () => this.mode === HtmlEditorMode.WYSIWYG ? assertNotNull(this.editor.domElement).focus() : assertNotNull(this.domTextArea).focus()
		}, this.placeholderId ? lang.get(this.placeholderId) : "") : null;
		return mithril_default(".html-editor" + (this.mode === HtmlEditorMode.WYSIWYG ? ".text-break" : ""), { class: this.editor.isEnabled() ? "" : "disabled" }, [
			modeSwitcherLabel != null ? mithril_default(DropDownSelector, {
				label: modeSwitcherLabel,
				items: [{
					name: lang.get("richText_label"),
					value: HtmlEditorMode.WYSIWYG
				}, {
					name: lang.get("htmlSourceCode_label"),
					value: HtmlEditorMode.HTML
				}],
				selectedValue: this.mode,
				selectionChangedHandler: (mode) => {
					this.mode = mode;
					this.setValue(this.value());
					this.initializeEditorListeners();
				}
			}) : null,
			this.label ? mithril_default(".small.mt-form", lang.getTranslationText(this.label)) : null,
			mithril_default(borderClasses, [getPlaceholder(), this.mode === HtmlEditorMode.WYSIWYG ? mithril_default(".wysiwyg.rel.overflow-hidden.selectable", [this.editor.isEnabled() && (this.toolbarEnabled || renderedInjections) ? [mithril_default(".flex-end.sticky.pb-2", [this.toolbarEnabled ? mithril_default(RichTextToolbar, Object.assign({ editor: this.editor }, this.toolbarAttrs)) : null, renderedInjections]), mithril_default("hr.hr.mb-s")] : null, mithril_default(this.editor, {
				oncreate: () => {
					this.editor.initialized.promise.then(() => this.editor.setHTML(this.value()));
				},
				onremove: () => {
					this.value(this.getValue());
				}
			})]) : mithril_default(".html", mithril_default("textarea.input-area.selectable", {
				oncreate: (vnode) => {
					this.domTextArea = vnode.dom;
					if (!this.isEmpty()) this.domTextArea.value = this.value();
				},
				onfocus: () => this.focus(),
				onblur: () => this.blur(),
				oninput: () => {
					if (this.domTextArea) {
						this.domTextArea.style.height = "0px";
						this.domTextArea.style.height = this.domTextArea.scrollHeight + "px";
					}
				},
				style: this.staticLineAmount ? {
					"max-height": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
					"min-height": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
					overflow: "scroll"
				} : {
					"font-family": this.htmlMonospace ? "monospace" : "inherit",
					"min-height": this.minHeight ? px(this.minHeight) : "initial"
				},
				disabled: !this.editor.isEnabled(),
				readonly: this.editor.isReadOnly()
			}))])
		]);
	}
	initializeEditorListeners() {
		this.editor.initialized.promise.then(() => {
			const dom = assertNotNull(this.editor?.domElement);
			dom.onfocus = () => this.focus();
			dom.onblur = () => this.blur();
		});
	}
	focus() {
		this.active = true;
		mithril_default.redraw();
	}
	blur() {
		this.active = false;
		if (this.mode === HtmlEditorMode.WYSIWYG) this.value(this.editor.getValue());
else this.value(assertNotNull(this.domTextArea).value);
	}
	setModeSwitcher(label) {
		this.modeSwitcherLabel = label;
		return this;
	}
	showBorders() {
		this._showBorders = true;
		return this;
	}
	setMinHeight(height$1) {
		this.minHeight = height$1;
		this.editor.setMinHeight(height$1);
		return this;
	}
	/**
	* Sets a static amount 'n' of lines the Editor should always render/allow.
	* When using n+1 lines, the editor will instead begin to be scrollable.
	* Currently, this overwrites min-height.
	*/
	setStaticNumberOfLines(numberOfLines) {
		this.staticLineAmount = numberOfLines;
		this.editor.setStaticNumberOfLines(numberOfLines);
		return this;
	}
	setPlaceholderId(placeholderId) {
		this.placeholderId = placeholderId;
		return this;
	}
	getValue() {
		if (this.mode === HtmlEditorMode.WYSIWYG) if (this.editor.isAttached()) return this.editor.getHTML();
else return this.value();
else if (this.domTextArea) return htmlSanitizer.sanitizeHTML(this.domTextArea.value, { blockExternalContent: false }).html;
else return this.value();
	}
	/**
	* squire HTML editor usually has some HTML when appearing empty, sometimes we don't want that content.
	*/
	getTrimmedValue() {
		return this.isEmpty() ? "" : this.getValue();
	}
	setValue(html) {
		if (this.mode === HtmlEditorMode.WYSIWYG) this.editor.initialized.promise.then(() => this.editor.setHTML(html));
else if (this.domTextArea) this.domTextArea.value = html;
		this.value(html);
		return this;
	}
	setShowOutline(show) {
		this.editor.setShowOutline(show);
		return this;
	}
	isActive() {
		return this.active;
	}
	isEmpty() {
		return this.value() === "" || new RegExp(/^<div( dir=["'][A-z]*["'])?><br><\/div>$/).test(this.value());
	}
	/** set whether the dialog should be editable.*/
	setEnabled(enabled) {
		this.editor.setEnabled(enabled);
		if (this.domTextArea) this.domTextArea.disabled = !enabled;
		return this;
	}
	setReadOnly(readOnly) {
		this.editor.setReadOnly(readOnly);
		if (this.domTextArea) this.domTextArea.readOnly = readOnly;
		return this;
	}
	setMode(mode) {
		this.mode = mode;
		return this;
	}
	setHtmlMonospace(monospace) {
		this.htmlMonospace = monospace;
		return this;
	}
	/** show the rich text toolbar */
	enableToolbar() {
		this.toolbarEnabled = true;
		return this;
	}
	isToolbarEnabled() {
		return this.toolbarEnabled;
	}
	/** toggle the visibility of the rich text toolbar */
	toggleToolbar() {
		this.toolbarEnabled = !this.toolbarEnabled;
		return this;
	}
	setToolbarOptions(attrs) {
		this.toolbarAttrs = attrs;
		return this;
	}
};

//#endregion
export { Editor, HTML_EDITOR_LINE_HEIGHT, HtmlEditor, HtmlEditorMode, RichTextToolbar, animateToolbar };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHRtbEVkaXRvci1jaHVuay5qcyIsIm5hbWVzIjpbInNpemUiLCJfOiBDbGlwYm9hcmRFdmVudCIsIm1pbkhlaWdodDogbnVtYmVyIHwgbnVsbCIsInNhbml0aXplcjogU2FuaXRpemVyRm4iLCJzdGF0aWNMaW5lQW1vdW50OiBudW1iZXIgfCBudWxsIiwiY2FsbGJhY2s6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkiLCJtaW5IZWlnaHQ6IG51bWJlciIsInNob3c6IGJvb2xlYW4iLCJudW1iZXJPZkxpbmVzOiBudW1iZXIiLCJjcmVhdGVzTGlzdHM6IGJvb2xlYW4iLCJkb21FbGVtZW50OiBIVE1MRWxlbWVudCIsIlNxdWlyZUVkaXRvciIsImh0bWw6IHN0cmluZyIsImU6IFRleHRQYXN0ZUV2ZW50IiwiXzogQ3VzdG9tRXZlbnQ8dm9pZD4iLCJlbmFibGVkOiBib29sZWFuIiwicmVhZE9ubHk6IGJvb2xlYW4iLCJodG1sOiBzdHJpbmcgfCBudWxsIiwic3RhdGU6IGJvb2xlYW4iLCJzdHlsZTogU3R5bGUiLCJwYXRoU2VnbWVudHM6IHN0cmluZ1tdIiwic3JjQXR0cjogc3RyaW5nIiwiYXR0cnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IiwidHlwZTogc3RyaW5nIiwiaGFuZGxlcjogKGFyZzA6IEV2ZW50KSA9PiB2b2lkIiwicmFuZ2U6IFJhbmdlIiwidm5vZGU6IFZub2RlRE9NPGFueT4iLCJhdHRyczogUmljaFRleHRUb29sYmFyQXR0cnMiLCJzdHlsZTogU3R5bGUiLCJ0aXRsZTogc3RyaW5nIiwiaWNvbjogSWNvbnMiLCJlZGl0b3I6IEVkaXRvciIsImxpc3Rpbmc6IExpc3RpbmciLCJ0aXRsZTogTWF5YmVUcmFuc2xhdGlvbiIsImNsaWNrOiAoKSA9PiB2b2lkIiwiaXNTZWxlY3RlZDogKCkgPT4gYm9vbGVhbiIsImF0dHJzIiwiYWxpZ25tZW50OiBBbGlnbm1lbnQiLCJ0aXRsZTogVHJhbnNsYXRpb25LZXkiLCJkb206IEhUTUxFbGVtZW50IiwiYXBwZWFyOiBib29sZWFuIiwiY3VycmVudDogbnVtYmVyIiwicHJldmlvdXM6IG51bWJlciIsIkhUTUxfRURJVE9SX0xJTkVfSEVJR0hUOiBudW1iZXIiLCJsYWJlbD86IE1heWJlVHJhbnNsYXRpb24iLCJpbmplY3Rpb25zPzogKCkgPT4gQ2hpbGRyZW4iLCJtb2RlOiBIdG1sRWRpdG9yTW9kZSIsImxhYmVsOiBNYXliZVRyYW5zbGF0aW9uIiwiaGVpZ2h0OiBudW1iZXIiLCJoZWlnaHQiLCJudW1iZXJPZkxpbmVzOiBudW1iZXIiLCJwbGFjZWhvbGRlcklkOiBUcmFuc2xhdGlvbktleSIsImh0bWw6IHN0cmluZyIsInNob3c6IGJvb2xlYW4iLCJlbmFibGVkOiBib29sZWFuIiwicmVhZE9ubHk6IGJvb2xlYW4iLCJtb25vc3BhY2U6IGJvb2xlYW4iLCJhdHRyczogT21pdDxSaWNoVGV4dFRvb2xiYXJBdHRycywgXCJlZGl0b3JcIj4iXSwic291cmNlcyI6WyIuLi9saWJzL3NxdWlyZS1yYXcubWpzIiwiLi4vc3JjL2NvbW1vbi9ndWkvZWRpdG9yL0VkaXRvci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvUmljaFRleHRUb29sYmFyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvZWRpdG9yL0h0bWxFZGl0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc291cmNlL25vZGUvVHJlZUl0ZXJhdG9yLnRzXG52YXIgU0hPV19FTEVNRU5UID0gMTtcbnZhciBTSE9XX1RFWFQgPSA0O1xudmFyIFNIT1dfRUxFTUVOVF9PUl9URVhUID0gNTtcbnZhciBhbHdheXMgPSAoKSA9PiB0cnVlO1xudmFyIFRyZWVJdGVyYXRvciA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3Iocm9vdCwgbm9kZVR5cGUsIGZpbHRlcikge1xuXHRcdHRoaXMucm9vdCA9IHJvb3Q7XG5cdFx0dGhpcy5jdXJyZW50Tm9kZSA9IHJvb3Q7XG5cdFx0dGhpcy5ub2RlVHlwZSA9IG5vZGVUeXBlO1xuXHRcdHRoaXMuZmlsdGVyID0gZmlsdGVyIHx8IGFsd2F5cztcblx0fVxuXG5cdGlzQWNjZXB0YWJsZU5vZGUobm9kZSkge1xuXHRcdGNvbnN0IG5vZGVUeXBlID0gbm9kZS5ub2RlVHlwZTtcblx0XHRjb25zdCBub2RlRmlsdGVyVHlwZSA9IG5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSA/IFNIT1dfRUxFTUVOVCA6IG5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSA/IFNIT1dfVEVYVCA6IDA7XG5cdFx0cmV0dXJuICEhKG5vZGVGaWx0ZXJUeXBlICYgdGhpcy5ub2RlVHlwZSkgJiYgdGhpcy5maWx0ZXIobm9kZSk7XG5cdH1cblxuXHRuZXh0Tm9kZSgpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5yb290O1xuXHRcdGxldCBjdXJyZW50ID0gdGhpcy5jdXJyZW50Tm9kZTtcblx0XHRsZXQgbm9kZTtcblx0XHR3aGlsZSAodHJ1ZSkge1xuXHRcdFx0bm9kZSA9IGN1cnJlbnQuZmlyc3RDaGlsZDtcblx0XHRcdHdoaWxlICghbm9kZSAmJiBjdXJyZW50KSB7XG5cdFx0XHRcdGlmIChjdXJyZW50ID09PSByb290KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IGN1cnJlbnQubmV4dFNpYmxpbmc7XG5cdFx0XHRcdGlmICghbm9kZSkge1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudE5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghbm9kZSkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzQWNjZXB0YWJsZU5vZGUobm9kZSkpIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50Tm9kZSA9IG5vZGU7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudCA9IG5vZGU7XG5cdFx0fVxuXHR9XG5cblx0cHJldmlvdXNOb2RlKCkge1xuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLnJvb3Q7XG5cdFx0bGV0IGN1cnJlbnQgPSB0aGlzLmN1cnJlbnROb2RlO1xuXHRcdGxldCBub2RlO1xuXHRcdHdoaWxlICh0cnVlKSB7XG5cdFx0XHRpZiAoY3VycmVudCA9PT0gcm9vdCkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdG5vZGUgPSBjdXJyZW50LnByZXZpb3VzU2libGluZztcblx0XHRcdGlmIChub2RlKSB7XG5cdFx0XHRcdHdoaWxlIChjdXJyZW50ID0gbm9kZS5sYXN0Q2hpbGQpIHtcblx0XHRcdFx0XHRub2RlID0gY3VycmVudDtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZSA9IGN1cnJlbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdGlmICghbm9kZSkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzQWNjZXB0YWJsZU5vZGUobm9kZSkpIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50Tm9kZSA9IG5vZGU7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudCA9IG5vZGU7XG5cdFx0fVxuXHR9XG5cblx0Ly8gUHJldmlvdXMgbm9kZSBpbiBwb3N0LW9yZGVyLlxuXHRwcmV2aW91c1BPTm9kZSgpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5yb290O1xuXHRcdGxldCBjdXJyZW50ID0gdGhpcy5jdXJyZW50Tm9kZTtcblx0XHRsZXQgbm9kZTtcblx0XHR3aGlsZSAodHJ1ZSkge1xuXHRcdFx0bm9kZSA9IGN1cnJlbnQubGFzdENoaWxkO1xuXHRcdFx0d2hpbGUgKCFub2RlICYmIGN1cnJlbnQpIHtcblx0XHRcdFx0aWYgKGN1cnJlbnQgPT09IHJvb3QpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gY3VycmVudC5wcmV2aW91c1NpYmxpbmc7XG5cdFx0XHRcdGlmICghbm9kZSkge1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudE5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghbm9kZSkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmlzQWNjZXB0YWJsZU5vZGUobm9kZSkpIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50Tm9kZSA9IG5vZGU7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudCA9IG5vZGU7XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBzb3VyY2UvQ29uc3RhbnRzLnRzXG52YXIgRUxFTUVOVF9OT0RFID0gMTtcbnZhciBURVhUX05PREUgPSAzO1xudmFyIERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSAxMTtcbnZhciBaV1MgPSBcIlxcdTIwMEJcIjtcbnZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG52YXIgaXNNYWMgPSAvTWFjIE9TIFgvLnRlc3QodWEpO1xudmFyIGlzV2luID0gL1dpbmRvd3MgTlQvLnRlc3QodWEpO1xudmFyIGlzSU9TID0gL2lQKD86YWR8aG9uZXxvZCkvLnRlc3QodWEpIHx8IGlzTWFjICYmICEhbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzO1xudmFyIGlzQW5kcm9pZCA9IC9BbmRyb2lkLy50ZXN0KHVhKTtcbnZhciBpc0dlY2tvID0gL0dlY2tvXFwvLy50ZXN0KHVhKTtcbnZhciBpc0xlZ2FjeUVkZ2UgPSAvRWRnZVxcLy8udGVzdCh1YSk7XG52YXIgaXNXZWJLaXQgPSAhaXNMZWdhY3lFZGdlICYmIC9XZWJLaXRcXC8vLnRlc3QodWEpO1xudmFyIGN0cmxLZXkgPSBpc01hYyB8fCBpc0lPUyA/IFwiTWV0YS1cIiA6IFwiQ3RybC1cIjtcbnZhciBjYW50Rm9jdXNFbXB0eVRleHROb2RlcyA9IGlzV2ViS2l0O1xudmFyIHN1cHBvcnRzSW5wdXRFdmVudHMgPSBcIm9uYmVmb3JlaW5wdXRcIiBpbiBkb2N1bWVudCAmJiBcImlucHV0VHlwZVwiIGluIG5ldyBJbnB1dEV2ZW50KFwiaW5wdXRcIik7XG52YXIgbm90V1MgPSAvW14gXFx0XFxyXFxuXS87XG52YXIgaW5kZW50ZWROb2RlQXR0cmlidXRlcyA9IHtcblx0Y2xhc3M6IFwidHV0YW5vdGFfaW5kZW50ZWRcIixcblx0c3R5bGU6IFwibWFyZ2luLWxlZnQ6IDQwcHhcIlxufVxuXG4vLyBzb3VyY2Uvbm9kZS9DYXRlZ29yeS50c1xudmFyIGlubGluZU5vZGVOYW1lcyA9IC9eKD86I3RleHR8QSg/OkJCUnxDUk9OWU0pP3xCKD86UnxEW0lPXSk/fEMoPzpJVEV8T0RFKXxEKD86QVRBfEVMfEZOKXxFTXxGT05UfEhSfEkoPzpGUkFNRXxNR3xOUFVUfE5TKT98S0JEfFF8Uig/OlB8VHxVQlkpfFMoPzpBTVB8TUFMTHxQQU58VFIoPzpJS0V8T05HKXxVW0JQXSk/fFRJTUV8VXxWQVJ8V0JSKSQvO1xudmFyIGxlYWZOb2RlTmFtZXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldChbXCJCUlwiLCBcIkhSXCIsIFwiSUZSQU1FXCIsIFwiSU1HXCIsIFwiSU5QVVRcIl0pO1xudmFyIFVOS05PV04gPSAwO1xudmFyIElOTElORSA9IDE7XG52YXIgQkxPQ0sgPSAyO1xudmFyIENPTlRBSU5FUiA9IDM7XG52YXIgY2FjaGUgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTtcbnZhciByZXNldE5vZGVDYXRlZ29yeUNhY2hlID0gKCkgPT4ge1xuXHRjYWNoZSA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xufTtcbnZhciBpc0xlYWYgPSAobm9kZSkgPT4ge1xuXHRyZXR1cm4gbGVhZk5vZGVOYW1lcy5oYXMobm9kZS5ub2RlTmFtZSk7XG59O1xudmFyIGdldE5vZGVDYXRlZ29yeSA9IChub2RlKSA9PiB7XG5cdHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuXHRcdGNhc2UgVEVYVF9OT0RFOlxuXHRcdFx0cmV0dXJuIElOTElORTtcblx0XHRjYXNlIEVMRU1FTlRfTk9ERTpcblx0XHRjYXNlIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6XG5cdFx0XHRpZiAoY2FjaGUuaGFzKG5vZGUpKSB7XG5cdFx0XHRcdHJldHVybiBjYWNoZS5nZXQobm9kZSk7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIFVOS05PV047XG5cdH1cblx0bGV0IG5vZGVDYXRlZ29yeTtcblx0aWYgKCFBcnJheS5mcm9tKG5vZGUuY2hpbGROb2RlcykuZXZlcnkoaXNJbmxpbmUpKSB7XG5cdFx0bm9kZUNhdGVnb3J5ID0gQ09OVEFJTkVSO1xuXHR9IGVsc2UgaWYgKGlubGluZU5vZGVOYW1lcy50ZXN0KG5vZGUubm9kZU5hbWUpKSB7XG5cdFx0bm9kZUNhdGVnb3J5ID0gSU5MSU5FO1xuXHR9IGVsc2Uge1xuXHRcdG5vZGVDYXRlZ29yeSA9IEJMT0NLO1xuXHR9XG5cdGNhY2hlLnNldChub2RlLCBub2RlQ2F0ZWdvcnkpO1xuXHRyZXR1cm4gbm9kZUNhdGVnb3J5O1xufTtcbnZhciBpc0lubGluZSA9IChub2RlKSA9PiB7XG5cdHJldHVybiBnZXROb2RlQ2F0ZWdvcnkobm9kZSkgPT09IElOTElORTtcbn07XG52YXIgaXNCbG9jayA9IChub2RlKSA9PiB7XG5cdHJldHVybiBnZXROb2RlQ2F0ZWdvcnkobm9kZSkgPT09IEJMT0NLO1xufTtcbnZhciBpc0NvbnRhaW5lciA9IChub2RlKSA9PiB7XG5cdHJldHVybiBnZXROb2RlQ2F0ZWdvcnkobm9kZSkgPT09IENPTlRBSU5FUjtcbn07XG5cbi8vIHNvdXJjZS9ub2RlL05vZGUudHNcbnZhciBjcmVhdGVFbGVtZW50ID0gKHRhZywgcHJvcHMsIGNoaWxkcmVuKSA9PiB7XG5cdGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuXHRpZiAocHJvcHMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdGNoaWxkcmVuID0gcHJvcHM7XG5cdFx0cHJvcHMgPSBudWxsO1xuXHR9XG5cdGlmIChwcm9wcykge1xuXHRcdGZvciAoY29uc3QgYXR0ciBpbiBwcm9wcykge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBwcm9wc1thdHRyXTtcblx0XHRcdGlmICh2YWx1ZSAhPT0gdm9pZCAwKSB7XG5cdFx0XHRcdGVsLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGlmIChjaGlsZHJlbikge1xuXHRcdGNoaWxkcmVuLmZvckVhY2goKG5vZGUpID0+IGVsLmFwcGVuZENoaWxkKG5vZGUpKTtcblx0fVxuXHRyZXR1cm4gZWw7XG59O1xudmFyIGFyZUFsaWtlID0gKG5vZGUsIG5vZGUyKSA9PiB7XG5cdGlmIChpc0xlYWYobm9kZSkpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0aWYgKG5vZGUubm9kZVR5cGUgIT09IG5vZGUyLm5vZGVUeXBlIHx8IG5vZGUubm9kZU5hbWUgIT09IG5vZGUyLm5vZGVOYW1lKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGlmIChub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgbm9kZTIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHRcdHJldHVybiBub2RlLm5vZGVOYW1lICE9PSBcIkFcIiAmJiBub2RlLmNsYXNzTmFtZSA9PT0gbm9kZTIuY2xhc3NOYW1lICYmIG5vZGUuc3R5bGUuY3NzVGV4dCA9PT0gbm9kZTIuc3R5bGUuY3NzVGV4dDtcblx0fVxuXHRyZXR1cm4gdHJ1ZTtcbn07XG52YXIgaGFzVGFnQXR0cmlidXRlcyA9IChub2RlLCB0YWcsIGF0dHJpYnV0ZXMpID0+IHtcblx0aWYgKG5vZGUubm9kZU5hbWUgIT09IHRhZykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRmb3IgKGNvbnN0IGF0dHIgaW4gYXR0cmlidXRlcykge1xuXHRcdGlmICghKFwiZ2V0QXR0cmlidXRlXCIgaW4gbm9kZSkgfHwgbm9kZS5nZXRBdHRyaWJ1dGUoYXR0cikgIT09IGF0dHJpYnV0ZXNbYXR0cl0pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59O1xudmFyIGdldE5lYXJlc3QgPSAobm9kZSwgcm9vdCwgdGFnLCBhdHRyaWJ1dGVzKSA9PiB7XG5cdHdoaWxlIChub2RlICYmIG5vZGUgIT09IHJvb3QpIHtcblx0XHRpZiAoaGFzVGFnQXR0cmlidXRlcyhub2RlLCB0YWcsIGF0dHJpYnV0ZXMpKSB7XG5cdFx0XHRyZXR1cm4gbm9kZTtcblx0XHR9XG5cdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG52YXIgZ2V0Tm9kZUJlZm9yZU9mZnNldCA9IChub2RlLCBvZmZzZXQpID0+IHtcblx0bGV0IGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuXHR3aGlsZSAob2Zmc2V0ICYmIG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG5cdFx0bm9kZSA9IGNoaWxkcmVuW29mZnNldCAtIDFdO1xuXHRcdGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuXHRcdG9mZnNldCA9IGNoaWxkcmVuLmxlbmd0aDtcblx0fVxuXHRyZXR1cm4gbm9kZTtcbn07XG52YXIgZ2V0Tm9kZUFmdGVyT2Zmc2V0ID0gKG5vZGUsIG9mZnNldCkgPT4ge1xuXHRsZXQgcmV0dXJuTm9kZSA9IG5vZGU7XG5cdGlmIChyZXR1cm5Ob2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuXHRcdGNvbnN0IGNoaWxkcmVuID0gcmV0dXJuTm9kZS5jaGlsZE5vZGVzO1xuXHRcdGlmIChvZmZzZXQgPCBjaGlsZHJlbi5sZW5ndGgpIHtcblx0XHRcdHJldHVybk5vZGUgPSBjaGlsZHJlbltvZmZzZXRdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aGlsZSAocmV0dXJuTm9kZSAmJiAhcmV0dXJuTm9kZS5uZXh0U2libGluZykge1xuXHRcdFx0XHRyZXR1cm5Ob2RlID0gcmV0dXJuTm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHJldHVybk5vZGUpIHtcblx0XHRcdFx0cmV0dXJuTm9kZSA9IHJldHVybk5vZGUubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXR1cm5Ob2RlO1xufTtcbnZhciBnZXRMZW5ndGggPSAobm9kZSkgPT4ge1xuXHRyZXR1cm4gbm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQgPyBub2RlLmNoaWxkTm9kZXMubGVuZ3RoIDogbm9kZSBpbnN0YW5jZW9mIENoYXJhY3RlckRhdGEgPyBub2RlLmxlbmd0aCA6IDA7XG59O1xudmFyIGVtcHR5ID0gKG5vZGUpID0+IHtcblx0Y29uc3QgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0bGV0IGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuXHR3aGlsZSAoY2hpbGQpIHtcblx0XHRmcmFnLmFwcGVuZENoaWxkKGNoaWxkKTtcblx0XHRjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDtcblx0fVxuXHRyZXR1cm4gZnJhZztcbn07XG52YXIgZGV0YWNoID0gKG5vZGUpID0+IHtcblx0Y29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXHRpZiAocGFyZW50KSB7XG5cdFx0cGFyZW50LnJlbW92ZUNoaWxkKG5vZGUpO1xuXHR9XG5cdHJldHVybiBub2RlO1xufTtcbnZhciByZXBsYWNlV2l0aCA9IChub2RlLCBub2RlMikgPT4ge1xuXHRjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cdGlmIChwYXJlbnQpIHtcblx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKG5vZGUyLCBub2RlKTtcblx0fVxufTtcblxuLy8gc291cmNlL25vZGUvV2hpdGVzcGFjZS50c1xudmFyIG5vdFdTVGV4dE5vZGUgPSAobm9kZSkgPT4ge1xuXHRyZXR1cm4gbm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgPyBub2RlLm5vZGVOYW1lID09PSBcIkJSXCIgOiAoXG5cdFx0XHQvLyBva2F5IGlmIGRhdGEgaXMgJ3VuZGVmaW5lZCcgaGVyZS5cblx0XHRcdG5vdFdTLnRlc3Qobm9kZS5kYXRhKVxuXHQpO1xufTtcbnZhciBpc0xpbmVCcmVhayA9IChiciwgaXNMQklmRW1wdHlCbG9jaykgPT4ge1xuXHRsZXQgYmxvY2sgPSBici5wYXJlbnROb2RlO1xuXHR3aGlsZSAoaXNJbmxpbmUoYmxvY2spKSB7XG5cdFx0YmxvY2sgPSBibG9jay5wYXJlbnROb2RlO1xuXHR9XG5cdGNvbnN0IHdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoXG5cdFx0XHRibG9jayxcblx0XHRcdFNIT1dfRUxFTUVOVF9PUl9URVhULFxuXHRcdFx0bm90V1NUZXh0Tm9kZVxuXHQpO1xuXHR3YWxrZXIuY3VycmVudE5vZGUgPSBicjtcblx0cmV0dXJuICEhd2Fsa2VyLm5leHROb2RlKCkgfHwgaXNMQklmRW1wdHlCbG9jayAmJiAhd2Fsa2VyLnByZXZpb3VzTm9kZSgpO1xufTtcbnZhciByZW1vdmVaV1MgPSAocm9vdCwga2VlcE5vZGUpID0+IHtcblx0Y29uc3Qgd2Fsa2VyID0gbmV3IFRyZWVJdGVyYXRvcihyb290LCBTSE9XX1RFWFQpO1xuXHRsZXQgdGV4dE5vZGU7XG5cdGxldCBpbmRleDtcblx0d2hpbGUgKHRleHROb2RlID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcblx0XHR3aGlsZSAoKGluZGV4ID0gdGV4dE5vZGUuZGF0YS5pbmRleE9mKFpXUykpID4gLTEgJiYgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVubW9kaWZpZWQtbG9vcC1jb25kaXRpb25cblx0XHQoIWtlZXBOb2RlIHx8IHRleHROb2RlLnBhcmVudE5vZGUgIT09IGtlZXBOb2RlKSkge1xuXHRcdFx0aWYgKHRleHROb2RlLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRsZXQgbm9kZSA9IHRleHROb2RlO1xuXHRcdFx0XHRsZXQgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0XHR3aGlsZSAocGFyZW50KSB7XG5cdFx0XHRcdFx0cGFyZW50LnJlbW92ZUNoaWxkKG5vZGUpO1xuXHRcdFx0XHRcdHdhbGtlci5jdXJyZW50Tm9kZSA9IHBhcmVudDtcblx0XHRcdFx0XHRpZiAoIWlzSW5saW5lKHBhcmVudCkgfHwgZ2V0TGVuZ3RoKHBhcmVudCkpIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRub2RlID0gcGFyZW50O1xuXHRcdFx0XHRcdHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRleHROb2RlLmRlbGV0ZURhdGEoaW5kZXgsIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuLy8gc291cmNlL3JhbmdlL0JvdW5kYXJpZXMudHNcbnZhciBTVEFSVF9UT19TVEFSVCA9IDA7XG52YXIgU1RBUlRfVE9fRU5EID0gMTtcbnZhciBFTkRfVE9fRU5EID0gMjtcbnZhciBFTkRfVE9fU1RBUlQgPSAzO1xudmFyIGlzTm9kZUNvbnRhaW5lZEluUmFuZ2UgPSAocmFuZ2UsIG5vZGUsIHBhcnRpYWwpID0+IHtcblx0Y29uc3Qgbm9kZVJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcblx0bm9kZVJhbmdlLnNlbGVjdE5vZGUobm9kZSk7XG5cdGlmIChwYXJ0aWFsKSB7XG5cdFx0Y29uc3Qgbm9kZUVuZEJlZm9yZVN0YXJ0ID0gcmFuZ2UuY29tcGFyZUJvdW5kYXJ5UG9pbnRzKEVORF9UT19TVEFSVCwgbm9kZVJhbmdlKSA+IC0xO1xuXHRcdGNvbnN0IG5vZGVTdGFydEFmdGVyRW5kID0gcmFuZ2UuY29tcGFyZUJvdW5kYXJ5UG9pbnRzKFNUQVJUX1RPX0VORCwgbm9kZVJhbmdlKSA8IDE7XG5cdFx0cmV0dXJuICFub2RlRW5kQmVmb3JlU3RhcnQgJiYgIW5vZGVTdGFydEFmdGVyRW5kO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IG5vZGVTdGFydEFmdGVyU3RhcnQgPSByYW5nZS5jb21wYXJlQm91bmRhcnlQb2ludHMoU1RBUlRfVE9fU1RBUlQsIG5vZGVSYW5nZSkgPCAxO1xuXHRcdGNvbnN0IG5vZGVFbmRCZWZvcmVFbmQgPSByYW5nZS5jb21wYXJlQm91bmRhcnlQb2ludHMoRU5EX1RPX0VORCwgbm9kZVJhbmdlKSA+IC0xO1xuXHRcdHJldHVybiBub2RlU3RhcnRBZnRlclN0YXJ0ICYmIG5vZGVFbmRCZWZvcmVFbmQ7XG5cdH1cbn07XG52YXIgbW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlID0gKHJhbmdlKSA9PiB7XG5cdGxldCB7c3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0LCBlbmRDb250YWluZXIsIGVuZE9mZnNldH0gPSByYW5nZTtcblx0d2hpbGUgKCEoc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSkge1xuXHRcdGxldCBjaGlsZCA9IHN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXNbc3RhcnRPZmZzZXRdO1xuXHRcdGlmICghY2hpbGQgfHwgaXNMZWFmKGNoaWxkKSkge1xuXHRcdFx0aWYgKHN0YXJ0T2Zmc2V0KSB7XG5cdFx0XHRcdGNoaWxkID0gc3RhcnRDb250YWluZXIuY2hpbGROb2Rlc1tzdGFydE9mZnNldCAtIDFdO1xuXHRcdFx0XHRpZiAoY2hpbGQgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRcdFx0bGV0IHRleHRDaGlsZCA9IGNoaWxkO1xuXHRcdFx0XHRcdGxldCBwcmV2O1xuXHRcdFx0XHRcdHdoaWxlICghdGV4dENoaWxkLmxlbmd0aCAmJiAocHJldiA9IHRleHRDaGlsZC5wcmV2aW91c1NpYmxpbmcpICYmIHByZXYgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRcdFx0XHR0ZXh0Q2hpbGQucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR0ZXh0Q2hpbGQgPSBwcmV2O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzdGFydENvbnRhaW5lciA9IHRleHRDaGlsZDtcblx0XHRcdFx0XHRzdGFydE9mZnNldCA9IHRleHRDaGlsZC5kYXRhLmxlbmd0aDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdHN0YXJ0Q29udGFpbmVyID0gY2hpbGQ7XG5cdFx0c3RhcnRPZmZzZXQgPSAwO1xuXHR9XG5cdGlmIChlbmRPZmZzZXQpIHtcblx0XHR3aGlsZSAoIShlbmRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSkge1xuXHRcdFx0Y29uc3QgY2hpbGQgPSBlbmRDb250YWluZXIuY2hpbGROb2Rlc1tlbmRPZmZzZXQgLSAxXTtcblx0XHRcdGlmICghY2hpbGQgfHwgaXNMZWFmKGNoaWxkKSkge1xuXHRcdFx0XHRpZiAoY2hpbGQgJiYgY2hpbGQubm9kZU5hbWUgPT09IFwiQlJcIiAmJiAhaXNMaW5lQnJlYWsoY2hpbGQsIGZhbHNlKSkge1xuXHRcdFx0XHRcdGVuZE9mZnNldCAtPSAxO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0ZW5kQ29udGFpbmVyID0gY2hpbGQ7XG5cdFx0XHRlbmRPZmZzZXQgPSBnZXRMZW5ndGgoZW5kQ29udGFpbmVyKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0d2hpbGUgKCEoZW5kQ29udGFpbmVyIGluc3RhbmNlb2YgVGV4dCkpIHtcblx0XHRcdGNvbnN0IGNoaWxkID0gZW5kQ29udGFpbmVyLmZpcnN0Q2hpbGQ7XG5cdFx0XHRpZiAoIWNoaWxkIHx8IGlzTGVhZihjaGlsZCkpIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRlbmRDb250YWluZXIgPSBjaGlsZDtcblx0XHR9XG5cdH1cblx0cmFuZ2Uuc2V0U3RhcnQoc3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0KTtcblx0cmFuZ2Uuc2V0RW5kKGVuZENvbnRhaW5lciwgZW5kT2Zmc2V0KTtcbn07XG52YXIgbW92ZVJhbmdlQm91bmRhcmllc1VwVHJlZSA9IChyYW5nZSwgc3RhcnRNYXgsIGVuZE1heCwgcm9vdCkgPT4ge1xuXHRsZXQgc3RhcnRDb250YWluZXIgPSByYW5nZS5zdGFydENvbnRhaW5lcjtcblx0bGV0IHN0YXJ0T2Zmc2V0ID0gcmFuZ2Uuc3RhcnRPZmZzZXQ7XG5cdGxldCBlbmRDb250YWluZXIgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdGxldCBlbmRPZmZzZXQgPSByYW5nZS5lbmRPZmZzZXQ7XG5cdGxldCBwYXJlbnQ7XG5cdGlmICghc3RhcnRNYXgpIHtcblx0XHRzdGFydE1heCA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXHR9XG5cdGlmICghZW5kTWF4KSB7XG5cdFx0ZW5kTWF4ID0gc3RhcnRNYXg7XG5cdH1cblx0d2hpbGUgKCFzdGFydE9mZnNldCAmJiBzdGFydENvbnRhaW5lciAhPT0gc3RhcnRNYXggJiYgc3RhcnRDb250YWluZXIgIT09IHJvb3QpIHtcblx0XHRwYXJlbnQgPSBzdGFydENvbnRhaW5lci5wYXJlbnROb2RlO1xuXHRcdHN0YXJ0T2Zmc2V0ID0gQXJyYXkuZnJvbShwYXJlbnQuY2hpbGROb2RlcykuaW5kZXhPZihcblx0XHRcdFx0c3RhcnRDb250YWluZXJcblx0XHQpO1xuXHRcdHN0YXJ0Q29udGFpbmVyID0gcGFyZW50O1xuXHR9XG5cdHdoaWxlICh0cnVlKSB7XG5cdFx0aWYgKGVuZENvbnRhaW5lciA9PT0gZW5kTWF4IHx8IGVuZENvbnRhaW5lciA9PT0gcm9vdCkge1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGlmIChlbmRDb250YWluZXIubm9kZVR5cGUgIT09IFRFWFRfTk9ERSAmJiBlbmRDb250YWluZXIuY2hpbGROb2Rlc1tlbmRPZmZzZXRdICYmIGVuZENvbnRhaW5lci5jaGlsZE5vZGVzW2VuZE9mZnNldF0ubm9kZU5hbWUgPT09IFwiQlJcIiAmJiAhaXNMaW5lQnJlYWsoZW5kQ29udGFpbmVyLmNoaWxkTm9kZXNbZW5kT2Zmc2V0XSwgZmFsc2UpKSB7XG5cdFx0XHRlbmRPZmZzZXQgKz0gMTtcblx0XHR9XG5cdFx0aWYgKGVuZE9mZnNldCAhPT0gZ2V0TGVuZ3RoKGVuZENvbnRhaW5lcikpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRwYXJlbnQgPSBlbmRDb250YWluZXIucGFyZW50Tm9kZTtcblx0XHRlbmRPZmZzZXQgPSBBcnJheS5mcm9tKHBhcmVudC5jaGlsZE5vZGVzKS5pbmRleE9mKGVuZENvbnRhaW5lcikgKyAxO1xuXHRcdGVuZENvbnRhaW5lciA9IHBhcmVudDtcblx0fVxuXHRyYW5nZS5zZXRTdGFydChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHRyYW5nZS5zZXRFbmQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xufTtcbnZhciBtb3ZlUmFuZ2VCb3VuZGFyeU91dE9mID0gKHJhbmdlLCB0YWcsIHJvb3QpID0+IHtcblx0bGV0IHBhcmVudCA9IGdldE5lYXJlc3QocmFuZ2UuZW5kQ29udGFpbmVyLCByb290LCB0YWcpO1xuXHRpZiAocGFyZW50ICYmIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkpIHtcblx0XHRjb25zdCBjbG9uZSA9IHJhbmdlLmNsb25lUmFuZ2UoKTtcblx0XHRtb3ZlUmFuZ2VCb3VuZGFyaWVzVXBUcmVlKGNsb25lLCBwYXJlbnQsIHBhcmVudCwgcm9vdCk7XG5cdFx0aWYgKGNsb25lLmVuZENvbnRhaW5lciA9PT0gcGFyZW50KSB7XG5cdFx0XHRyYW5nZS5zZXRTdGFydChjbG9uZS5lbmRDb250YWluZXIsIGNsb25lLmVuZE9mZnNldCk7XG5cdFx0XHRyYW5nZS5zZXRFbmQoY2xvbmUuZW5kQ29udGFpbmVyLCBjbG9uZS5lbmRPZmZzZXQpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmFuZ2U7XG59O1xuXG4vLyBzb3VyY2Uvbm9kZS9NZXJnZVNwbGl0LnRzXG52YXIgZml4Q3Vyc29yID0gKG5vZGUpID0+IHtcblx0bGV0IGZpeGVyID0gbnVsbDtcblx0aWYgKG5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0cmV0dXJuIG5vZGU7XG5cdH1cblx0aWYgKGlzSW5saW5lKG5vZGUpKSB7XG5cdFx0bGV0IGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuXHRcdGlmIChjYW50Rm9jdXNFbXB0eVRleHROb2Rlcykge1xuXHRcdFx0d2hpbGUgKGNoaWxkICYmIGNoaWxkIGluc3RhbmNlb2YgVGV4dCAmJiAhY2hpbGQuZGF0YSkge1xuXHRcdFx0XHRub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHRcdFx0Y2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghY2hpbGQpIHtcblx0XHRcdGlmIChjYW50Rm9jdXNFbXB0eVRleHROb2Rlcykge1xuXHRcdFx0XHRmaXhlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFpXUyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmaXhlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmICgobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpICYmICFub2RlLnF1ZXJ5U2VsZWN0b3IoXCJCUlwiKSkge1xuXHRcdGZpeGVyID0gY3JlYXRlRWxlbWVudChcIkJSXCIpO1xuXHRcdGxldCBwYXJlbnQgPSBub2RlO1xuXHRcdGxldCBjaGlsZDtcblx0XHR3aGlsZSAoKGNoaWxkID0gcGFyZW50Lmxhc3RFbGVtZW50Q2hpbGQpICYmICFpc0lubGluZShjaGlsZCkpIHtcblx0XHRcdHBhcmVudCA9IGNoaWxkO1xuXHRcdH1cblx0XHRub2RlID0gcGFyZW50O1xuXHR9XG5cdGlmIChmaXhlcikge1xuXHRcdHRyeSB7XG5cdFx0XHRub2RlLmFwcGVuZENoaWxkKGZpeGVyKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbm9kZTtcbn07XG52YXIgZml4Q29udGFpbmVyID0gKGNvbnRhaW5lciwgcm9vdCwgY29uZmlnKSA9PiB7XG5cdGxldCB3cmFwcGVyID0gbnVsbDtcblx0QXJyYXkuZnJvbShjb250YWluZXIuY2hpbGROb2RlcykuZm9yRWFjaCgoY2hpbGQpID0+IHtcblx0XHRjb25zdCBpc0JSID0gY2hpbGQubm9kZU5hbWUgPT09IFwiQlJcIjtcblx0XHRpZiAoIWlzQlIgJiYgaXNJbmxpbmUoY2hpbGQpKSB7XG5cdFx0XHRpZiAoIXdyYXBwZXIpIHtcblx0XHRcdFx0d3JhcHBlciA9IGNyZWF0ZUVsZW1lbnQoY29uZmlnLmJsb2NrVGFnLCBjb25maWcuYmxvY2tBdHRyaWJ1dGVzKTtcblx0XHRcdH1cblx0XHRcdHdyYXBwZXIuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuXHRcdH0gZWxzZSBpZiAoaXNCUiB8fCB3cmFwcGVyKSB7XG5cdFx0XHRpZiAoIXdyYXBwZXIpIHtcblx0XHRcdFx0d3JhcHBlciA9IGNyZWF0ZUVsZW1lbnQoY29uZmlnLmJsb2NrVGFnLCBjb25maWcuYmxvY2tBdHRyaWJ1dGVzKTtcblx0XHRcdH1cblx0XHRcdGZpeEN1cnNvcih3cmFwcGVyKTtcblx0XHRcdGlmIChpc0JSKSB7XG5cdFx0XHRcdGNvbnRhaW5lci5yZXBsYWNlQ2hpbGQod3JhcHBlciwgY2hpbGQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29udGFpbmVyLmluc2VydEJlZm9yZSh3cmFwcGVyLCBjaGlsZCk7XG5cdFx0XHR9XG5cdFx0XHR3cmFwcGVyID0gbnVsbDtcblx0XHR9XG5cdFx0aWYgKGlzQ29udGFpbmVyKGNoaWxkKSkge1xuXHRcdFx0Zml4Q29udGFpbmVyKGNoaWxkLCByb290LCBjb25maWcpO1xuXHRcdH1cblx0fSk7XG5cdGlmICh3cmFwcGVyKSB7XG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpeEN1cnNvcih3cmFwcGVyKSk7XG5cdH1cblx0cmV0dXJuIGNvbnRhaW5lcjtcbn07XG52YXIgc3BsaXQgPSAobm9kZSwgb2Zmc2V0LCBzdG9wTm9kZSwgcm9vdCkgPT4ge1xuXHRpZiAobm9kZSBpbnN0YW5jZW9mIFRleHQgJiYgbm9kZSAhPT0gc3RvcE5vZGUpIHtcblx0XHRpZiAodHlwZW9mIG9mZnNldCAhPT0gXCJudW1iZXJcIikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiT2Zmc2V0IG11c3QgYmUgYSBudW1iZXIgdG8gc3BsaXQgdGV4dCBub2RlIVwiKTtcblx0XHR9XG5cdFx0aWYgKCFub2RlLnBhcmVudE5vZGUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzcGxpdCB0ZXh0IG5vZGUgd2l0aCBubyBwYXJlbnQhXCIpO1xuXHRcdH1cblx0XHRyZXR1cm4gc3BsaXQobm9kZS5wYXJlbnROb2RlLCBub2RlLnNwbGl0VGV4dChvZmZzZXQpLCBzdG9wTm9kZSwgcm9vdCk7XG5cdH1cblx0bGV0IG5vZGVBZnRlclNwbGl0ID0gdHlwZW9mIG9mZnNldCA9PT0gXCJudW1iZXJcIiA/IG9mZnNldCA8IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPyBub2RlLmNoaWxkTm9kZXNbb2Zmc2V0XSA6IG51bGwgOiBvZmZzZXQ7XG5cdGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblx0aWYgKCFwYXJlbnQgfHwgbm9kZSA9PT0gc3RvcE5vZGUgfHwgIShub2RlIGluc3RhbmNlb2YgRWxlbWVudCkpIHtcblx0XHRyZXR1cm4gbm9kZUFmdGVyU3BsaXQ7XG5cdH1cblx0Y29uc3QgY2xvbmUgPSBub2RlLmNsb25lTm9kZShmYWxzZSk7XG5cdHdoaWxlIChub2RlQWZ0ZXJTcGxpdCkge1xuXHRcdGNvbnN0IG5leHQgPSBub2RlQWZ0ZXJTcGxpdC5uZXh0U2libGluZztcblx0XHRjbG9uZS5hcHBlbmRDaGlsZChub2RlQWZ0ZXJTcGxpdCk7XG5cdFx0bm9kZUFmdGVyU3BsaXQgPSBuZXh0O1xuXHR9XG5cdGlmIChub2RlIGluc3RhbmNlb2YgSFRNTE9MaXN0RWxlbWVudCAmJiBnZXROZWFyZXN0KG5vZGUsIHJvb3QsIFwiRElWXCIsIGluZGVudGVkTm9kZUF0dHJpYnV0ZXMpKSB7XG5cdFx0Y2xvbmUuc3RhcnQgPSAoK25vZGUuc3RhcnQgfHwgMSkgKyBub2RlLmNoaWxkTm9kZXMubGVuZ3RoIC0gMTtcblx0fVxuXHRmaXhDdXJzb3Iobm9kZSk7XG5cdGZpeEN1cnNvcihjbG9uZSk7XG5cdHBhcmVudC5pbnNlcnRCZWZvcmUoY2xvbmUsIG5vZGUubmV4dFNpYmxpbmcpO1xuXHRyZXR1cm4gc3BsaXQocGFyZW50LCBjbG9uZSwgc3RvcE5vZGUsIHJvb3QpO1xufTtcbnZhciBfbWVyZ2VJbmxpbmVzID0gKG5vZGUsIGZha2VSYW5nZSkgPT4ge1xuXHRjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGROb2Rlcztcblx0bGV0IGwgPSBjaGlsZHJlbi5sZW5ndGg7XG5cdGNvbnN0IGZyYWdzID0gW107XG5cdHdoaWxlIChsLS0pIHtcblx0XHRjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2xdO1xuXHRcdGNvbnN0IHByZXYgPSBsID8gY2hpbGRyZW5bbCAtIDFdIDogbnVsbDtcblx0XHRpZiAocHJldiAmJiBpc0lubGluZShjaGlsZCkgJiYgYXJlQWxpa2UoY2hpbGQsIHByZXYpKSB7XG5cdFx0XHRpZiAoZmFrZVJhbmdlLnN0YXJ0Q29udGFpbmVyID09PSBjaGlsZCkge1xuXHRcdFx0XHRmYWtlUmFuZ2Uuc3RhcnRDb250YWluZXIgPSBwcmV2O1xuXHRcdFx0XHRmYWtlUmFuZ2Uuc3RhcnRPZmZzZXQgKz0gZ2V0TGVuZ3RoKHByZXYpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGZha2VSYW5nZS5lbmRDb250YWluZXIgPT09IGNoaWxkKSB7XG5cdFx0XHRcdGZha2VSYW5nZS5lbmRDb250YWluZXIgPSBwcmV2O1xuXHRcdFx0XHRmYWtlUmFuZ2UuZW5kT2Zmc2V0ICs9IGdldExlbmd0aChwcmV2KTtcblx0XHRcdH1cblx0XHRcdGlmIChmYWtlUmFuZ2Uuc3RhcnRDb250YWluZXIgPT09IG5vZGUpIHtcblx0XHRcdFx0aWYgKGZha2VSYW5nZS5zdGFydE9mZnNldCA+IGwpIHtcblx0XHRcdFx0XHRmYWtlUmFuZ2Uuc3RhcnRPZmZzZXQgLT0gMTtcblx0XHRcdFx0fSBlbHNlIGlmIChmYWtlUmFuZ2Uuc3RhcnRPZmZzZXQgPT09IGwpIHtcblx0XHRcdFx0XHRmYWtlUmFuZ2Uuc3RhcnRDb250YWluZXIgPSBwcmV2O1xuXHRcdFx0XHRcdGZha2VSYW5nZS5zdGFydE9mZnNldCA9IGdldExlbmd0aChwcmV2KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGZha2VSYW5nZS5lbmRDb250YWluZXIgPT09IG5vZGUpIHtcblx0XHRcdFx0aWYgKGZha2VSYW5nZS5lbmRPZmZzZXQgPiBsKSB7XG5cdFx0XHRcdFx0ZmFrZVJhbmdlLmVuZE9mZnNldCAtPSAxO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGZha2VSYW5nZS5lbmRPZmZzZXQgPT09IGwpIHtcblx0XHRcdFx0XHRmYWtlUmFuZ2UuZW5kQ29udGFpbmVyID0gcHJldjtcblx0XHRcdFx0XHRmYWtlUmFuZ2UuZW5kT2Zmc2V0ID0gZ2V0TGVuZ3RoKHByZXYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZXRhY2goY2hpbGQpO1xuXHRcdFx0aWYgKGNoaWxkIGluc3RhbmNlb2YgVGV4dCkge1xuXHRcdFx0XHRwcmV2LmFwcGVuZERhdGEoY2hpbGQuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmcmFncy5wdXNoKGVtcHR5KGNoaWxkKSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChjaGlsZCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcblx0XHRcdGxldCBmcmFnO1xuXHRcdFx0d2hpbGUgKGZyYWcgPSBmcmFncy5wb3AoKSkge1xuXHRcdFx0XHRjaGlsZC5hcHBlbmRDaGlsZChmcmFnKTtcblx0XHRcdH1cblx0XHRcdF9tZXJnZUlubGluZXMoY2hpbGQsIGZha2VSYW5nZSk7XG5cdFx0fVxuXHR9XG59O1xudmFyIG1lcmdlSW5saW5lcyA9IChub2RlLCByYW5nZSkgPT4ge1xuXHRjb25zdCBlbGVtZW50ID0gbm9kZSBpbnN0YW5jZW9mIFRleHQgPyBub2RlLnBhcmVudE5vZGUgOiBub2RlO1xuXHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcblx0XHRjb25zdCBmYWtlUmFuZ2UgPSB7XG5cdFx0XHRzdGFydENvbnRhaW5lcjogcmFuZ2Uuc3RhcnRDb250YWluZXIsXG5cdFx0XHRzdGFydE9mZnNldDogcmFuZ2Uuc3RhcnRPZmZzZXQsXG5cdFx0XHRlbmRDb250YWluZXI6IHJhbmdlLmVuZENvbnRhaW5lcixcblx0XHRcdGVuZE9mZnNldDogcmFuZ2UuZW5kT2Zmc2V0XG5cdFx0fTtcblx0XHRfbWVyZ2VJbmxpbmVzKGVsZW1lbnQsIGZha2VSYW5nZSk7XG5cdFx0cmFuZ2Uuc2V0U3RhcnQoZmFrZVJhbmdlLnN0YXJ0Q29udGFpbmVyLCBmYWtlUmFuZ2Uuc3RhcnRPZmZzZXQpO1xuXHRcdHJhbmdlLnNldEVuZChmYWtlUmFuZ2UuZW5kQ29udGFpbmVyLCBmYWtlUmFuZ2UuZW5kT2Zmc2V0KTtcblx0fVxufTtcbnZhciBtZXJnZVdpdGhCbG9jayA9IChibG9jaywgbmV4dCwgcmFuZ2UsIHJvb3QpID0+IHtcblx0bGV0IGNvbnRhaW5lciA9IG5leHQ7XG5cdGxldCBwYXJlbnQ7XG5cdGxldCBvZmZzZXQ7XG5cdHdoaWxlICgocGFyZW50ID0gY29udGFpbmVyLnBhcmVudE5vZGUpICYmIHBhcmVudCAhPT0gcm9vdCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBFbGVtZW50ICYmIHBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSkge1xuXHRcdGNvbnRhaW5lciA9IHBhcmVudDtcblx0fVxuXHRkZXRhY2goY29udGFpbmVyKTtcblx0b2Zmc2V0ID0gYmxvY2suY2hpbGROb2Rlcy5sZW5ndGg7XG5cdGNvbnN0IGxhc3QgPSBibG9jay5sYXN0Q2hpbGQ7XG5cdGlmIChsYXN0ICYmIGxhc3Qubm9kZU5hbWUgPT09IFwiQlJcIikge1xuXHRcdGJsb2NrLnJlbW92ZUNoaWxkKGxhc3QpO1xuXHRcdG9mZnNldCAtPSAxO1xuXHR9XG5cdGJsb2NrLmFwcGVuZENoaWxkKGVtcHR5KG5leHQpKTtcblx0cmFuZ2Uuc2V0U3RhcnQoYmxvY2ssIG9mZnNldCk7XG5cdHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuXHRtZXJnZUlubGluZXMoYmxvY2ssIHJhbmdlKTtcbn07XG52YXIgbWVyZ2VDb250YWluZXJzID0gKG5vZGUsIHJvb3QsIGNvbmZpZykgPT4ge1xuXHRjb25zdCBwcmV2ID0gbm9kZS5wcmV2aW91c1NpYmxpbmc7XG5cdGNvbnN0IGZpcnN0ID0gbm9kZS5maXJzdENoaWxkO1xuXHRjb25zdCBpc0xpc3RJdGVtID0gbm9kZS5ub2RlTmFtZSA9PT0gXCJMSVwiO1xuXHRpZiAoaXNMaXN0SXRlbSAmJiAoIWZpcnN0IHx8ICEvXltPVV1MJC8udGVzdChmaXJzdC5ub2RlTmFtZSkpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChwcmV2ICYmIGFyZUFsaWtlKHByZXYsIG5vZGUpKSB7XG5cdFx0aWYgKCFpc0NvbnRhaW5lcihwcmV2KSkge1xuXHRcdFx0aWYgKGlzTGlzdEl0ZW0pIHtcblx0XHRcdFx0Y29uc3QgYmxvY2sgPSBjcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuXHRcdFx0XHRibG9jay5hcHBlbmRDaGlsZChlbXB0eShwcmV2KSk7XG5cdFx0XHRcdHByZXYuYXBwZW5kQ2hpbGQoYmxvY2spO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRkZXRhY2gobm9kZSk7XG5cdFx0Y29uc3QgbmVlZHNGaXggPSAhaXNDb250YWluZXIobm9kZSk7XG5cdFx0cHJldi5hcHBlbmRDaGlsZChlbXB0eShub2RlKSk7XG5cdFx0aWYgKG5lZWRzRml4KSB7XG5cdFx0XHRmaXhDb250YWluZXIocHJldiwgcm9vdCwgY29uZmlnKTtcblx0XHR9XG5cdFx0aWYgKGZpcnN0KSB7XG5cdFx0XHRtZXJnZUNvbnRhaW5lcnMoZmlyc3QsIHJvb3QsIGNvbmZpZyk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGlzTGlzdEl0ZW0pIHtcblx0XHRjb25zdCBibG9jayA9IGNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG5cdFx0bm9kZS5pbnNlcnRCZWZvcmUoYmxvY2ssIGZpcnN0KTtcblx0XHRmaXhDdXJzb3IoYmxvY2spO1xuXHR9XG59O1xuXG4vLyBzb3VyY2UvQ2xlYW4udHNcbnZhciBzdHlsZVRvU2VtYW50aWMgPSB7XG5cdFwiZm9udC13ZWlnaHRcIjoge1xuXHRcdHJlZ2V4cDogL15ib2xkfF43MDAvaSxcblx0XHRyZXBsYWNlKCkge1xuXHRcdFx0cmV0dXJuIGNyZWF0ZUVsZW1lbnQoXCJCXCIpO1xuXHRcdH1cblx0fSxcblx0XCJmb250LXN0eWxlXCI6IHtcblx0XHRyZWdleHA6IC9eaXRhbGljL2ksXG5cdFx0cmVwbGFjZSgpIHtcblx0XHRcdHJldHVybiBjcmVhdGVFbGVtZW50KFwiSVwiKTtcblx0XHR9XG5cdH0sXG5cdFwiZm9udC1mYW1pbHlcIjoge1xuXHRcdHJlZ2V4cDogbm90V1MsXG5cdFx0cmVwbGFjZShjbGFzc05hbWVzLCBmYW1pbHkpIHtcblx0XHRcdHJldHVybiBjcmVhdGVFbGVtZW50KFwiU1BBTlwiLCB7XG5cdFx0XHRcdGNsYXNzOiBjbGFzc05hbWVzLmZvbnRGYW1pbHksXG5cdFx0XHRcdHN0eWxlOiBcImZvbnQtZmFtaWx5OlwiICsgZmFtaWx5XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdFwiZm9udC1zaXplXCI6IHtcblx0XHRyZWdleHA6IG5vdFdTLFxuXHRcdHJlcGxhY2UoY2xhc3NOYW1lcywgc2l6ZSkge1xuXHRcdFx0cmV0dXJuIGNyZWF0ZUVsZW1lbnQoXCJTUEFOXCIsIHtcblx0XHRcdFx0Y2xhc3M6IGNsYXNzTmFtZXMuZm9udFNpemUsXG5cdFx0XHRcdHN0eWxlOiBcImZvbnQtc2l6ZTpcIiArIHNpemVcblx0XHRcdH0pO1xuXHRcdH1cblx0fSxcblx0XCJ0ZXh0LWRlY29yYXRpb25cIjoge1xuXHRcdHJlZ2V4cDogL151bmRlcmxpbmUvaSxcblx0XHRyZXBsYWNlKCkge1xuXHRcdFx0cmV0dXJuIGNyZWF0ZUVsZW1lbnQoXCJVXCIpO1xuXHRcdH1cblx0fVxufTtcbnZhciByZXBsYWNlU3R5bGVzID0gKG5vZGUsIF8sIGNvbmZpZykgPT4ge1xuXHRjb25zdCBzdHlsZSA9IG5vZGUuc3R5bGU7XG5cdGxldCBuZXdUcmVlQm90dG9tO1xuXHRsZXQgbmV3VHJlZVRvcDtcblx0Zm9yIChjb25zdCBhdHRyIGluIHN0eWxlVG9TZW1hbnRpYykge1xuXHRcdGNvbnN0IGNvbnZlcnRlciA9IHN0eWxlVG9TZW1hbnRpY1thdHRyXTtcblx0XHRjb25zdCBjc3MgPSBzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKGF0dHIpO1xuXHRcdGlmIChjc3MgJiYgY29udmVydGVyLnJlZ2V4cC50ZXN0KGNzcykpIHtcblx0XHRcdGNvbnN0IGVsID0gY29udmVydGVyLnJlcGxhY2UoY29uZmlnLmNsYXNzTmFtZXMsIGNzcyk7XG5cdFx0XHRpZiAoZWwubm9kZU5hbWUgPT09IG5vZGUubm9kZU5hbWUgJiYgZWwuY2xhc3NOYW1lID09PSBub2RlLmNsYXNzTmFtZSkge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdGlmICghbmV3VHJlZVRvcCkge1xuXHRcdFx0XHRuZXdUcmVlVG9wID0gZWw7XG5cdFx0XHR9XG5cdFx0XHRpZiAobmV3VHJlZUJvdHRvbSkge1xuXHRcdFx0XHRuZXdUcmVlQm90dG9tLmFwcGVuZENoaWxkKGVsKTtcblx0XHRcdH1cblx0XHRcdG5ld1RyZWVCb3R0b20gPSBlbDtcblx0XHRcdG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoYXR0cik7XG5cdFx0fVxuXHR9XG5cdGlmIChuZXdUcmVlVG9wICYmIG5ld1RyZWVCb3R0b20pIHtcblx0XHRuZXdUcmVlQm90dG9tLmFwcGVuZENoaWxkKGVtcHR5KG5vZGUpKTtcblx0XHRpZiAobm9kZS5zdHlsZS5jc3NUZXh0KSB7XG5cdFx0XHRub2RlLmFwcGVuZENoaWxkKG5ld1RyZWVUb3ApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXBsYWNlV2l0aChub2RlLCBuZXdUcmVlVG9wKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG5ld1RyZWVCb3R0b20gfHwgbm9kZTtcbn07XG52YXIgcmVwbGFjZVdpdGhUYWcgPSAodGFnKSA9PiB7XG5cdHJldHVybiAobm9kZSwgcGFyZW50KSA9PiB7XG5cdFx0Y29uc3QgZWwgPSBjcmVhdGVFbGVtZW50KHRhZyk7XG5cdFx0Y29uc3QgYXR0cmlidXRlcyA9IG5vZGUuYXR0cmlidXRlcztcblx0XHRmb3IgKGxldCBpID0gMCwgbCA9IGF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG5cdFx0XHRjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2ldO1xuXHRcdFx0ZWwuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lLCBhdHRyaWJ1dGUudmFsdWUpO1xuXHRcdH1cblx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKGVsLCBub2RlKTtcblx0XHRlbC5hcHBlbmRDaGlsZChlbXB0eShub2RlKSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xufTtcbnZhciBmb250U2l6ZXMgPSB7XG5cdFwiMVwiOiBcIjEwXCIsXG5cdFwiMlwiOiBcIjEzXCIsXG5cdFwiM1wiOiBcIjE2XCIsXG5cdFwiNFwiOiBcIjE4XCIsXG5cdFwiNVwiOiBcIjI0XCIsXG5cdFwiNlwiOiBcIjMyXCIsXG5cdFwiN1wiOiBcIjQ4XCJcbn07XG52YXIgc3R5bGVzUmV3cml0ZXJzID0ge1xuXHRTVFJPTkc6IHJlcGxhY2VXaXRoVGFnKFwiQlwiKSxcblx0RU06IHJlcGxhY2VXaXRoVGFnKFwiSVwiKSxcblx0SU5TOiByZXBsYWNlV2l0aFRhZyhcIlVcIiksXG5cdFNUUklLRTogcmVwbGFjZVdpdGhUYWcoXCJTXCIpLFxuXHRTUEFOOiByZXBsYWNlU3R5bGVzLFxuXHRGT05UOiAobm9kZSwgcGFyZW50LCBjb25maWcpID0+IHtcblx0XHRjb25zdCBmb250ID0gbm9kZTtcblx0XHRjb25zdCBmYWNlID0gZm9udC5mYWNlO1xuXHRcdGNvbnN0IHNpemUgPSBmb250LnNpemU7XG5cdFx0bGV0IGNvbG9yID0gZm9udC5jb2xvcjtcblx0XHRjb25zdCBjbGFzc05hbWVzID0gY29uZmlnLmNsYXNzTmFtZXM7XG5cdFx0bGV0IGZvbnRTcGFuO1xuXHRcdGxldCBzaXplU3Bhbjtcblx0XHRsZXQgY29sb3JTcGFuO1xuXHRcdGxldCBuZXdUcmVlQm90dG9tO1xuXHRcdGxldCBuZXdUcmVlVG9wO1xuXHRcdGlmIChmYWNlKSB7XG5cdFx0XHRmb250U3BhbiA9IGNyZWF0ZUVsZW1lbnQoXCJTUEFOXCIsIHtcblx0XHRcdFx0Y2xhc3M6IGNsYXNzTmFtZXMuZm9udEZhbWlseSxcblx0XHRcdFx0c3R5bGU6IFwiZm9udC1mYW1pbHk6XCIgKyBmYWNlXG5cdFx0XHR9KTtcblx0XHRcdG5ld1RyZWVUb3AgPSBmb250U3Bhbjtcblx0XHRcdG5ld1RyZWVCb3R0b20gPSBmb250U3Bhbjtcblx0XHR9XG5cdFx0aWYgKHNpemUpIHtcblx0XHRcdHNpemVTcGFuID0gY3JlYXRlRWxlbWVudChcIlNQQU5cIiwge1xuXHRcdFx0XHRjbGFzczogY2xhc3NOYW1lcy5mb250U2l6ZSxcblx0XHRcdFx0c3R5bGU6IFwiZm9udC1zaXplOlwiICsgZm9udFNpemVzW3NpemVdICsgXCJweFwiXG5cdFx0XHR9KTtcblx0XHRcdGlmICghbmV3VHJlZVRvcCkge1xuXHRcdFx0XHRuZXdUcmVlVG9wID0gc2l6ZVNwYW47XG5cdFx0XHR9XG5cdFx0XHRpZiAobmV3VHJlZUJvdHRvbSkge1xuXHRcdFx0XHRuZXdUcmVlQm90dG9tLmFwcGVuZENoaWxkKHNpemVTcGFuKTtcblx0XHRcdH1cblx0XHRcdG5ld1RyZWVCb3R0b20gPSBzaXplU3Bhbjtcblx0XHR9XG5cdFx0aWYgKGNvbG9yICYmIC9eIz8oW1xcZEEtRl17M30pezEsMn0kL2kudGVzdChjb2xvcikpIHtcblx0XHRcdGlmIChjb2xvci5jaGFyQXQoMCkgIT09IFwiI1wiKSB7XG5cdFx0XHRcdGNvbG9yID0gXCIjXCIgKyBjb2xvcjtcblx0XHRcdH1cblx0XHRcdGNvbG9yU3BhbiA9IGNyZWF0ZUVsZW1lbnQoXCJTUEFOXCIsIHtcblx0XHRcdFx0Y2xhc3M6IGNsYXNzTmFtZXMuY29sb3IsXG5cdFx0XHRcdHN0eWxlOiBcImNvbG9yOlwiICsgY29sb3Jcblx0XHRcdH0pO1xuXHRcdFx0aWYgKCFuZXdUcmVlVG9wKSB7XG5cdFx0XHRcdG5ld1RyZWVUb3AgPSBjb2xvclNwYW47XG5cdFx0XHR9XG5cdFx0XHRpZiAobmV3VHJlZUJvdHRvbSkge1xuXHRcdFx0XHRuZXdUcmVlQm90dG9tLmFwcGVuZENoaWxkKGNvbG9yU3Bhbik7XG5cdFx0XHR9XG5cdFx0XHRuZXdUcmVlQm90dG9tID0gY29sb3JTcGFuO1xuXHRcdH1cblx0XHRpZiAoIW5ld1RyZWVUb3AgfHwgIW5ld1RyZWVCb3R0b20pIHtcblx0XHRcdG5ld1RyZWVUb3AgPSBuZXdUcmVlQm90dG9tID0gY3JlYXRlRWxlbWVudChcIlNQQU5cIik7XG5cdFx0fVxuXHRcdHBhcmVudC5yZXBsYWNlQ2hpbGQobmV3VHJlZVRvcCwgZm9udCk7XG5cdFx0bmV3VHJlZUJvdHRvbS5hcHBlbmRDaGlsZChlbXB0eShmb250KSk7XG5cdFx0cmV0dXJuIG5ld1RyZWVCb3R0b207XG5cdH0sXG5cdFRUOiAobm9kZSwgcGFyZW50LCBjb25maWcpID0+IHtcblx0XHRjb25zdCBlbCA9IGNyZWF0ZUVsZW1lbnQoXCJTUEFOXCIsIHtcblx0XHRcdGNsYXNzOiBjb25maWcuY2xhc3NOYW1lcy5mb250RmFtaWx5LFxuXHRcdFx0c3R5bGU6ICdmb250LWZhbWlseTptZW5sbyxjb25zb2xhcyxcImNvdXJpZXIgbmV3XCIsbW9ub3NwYWNlJ1xuXHRcdH0pO1xuXHRcdHBhcmVudC5yZXBsYWNlQ2hpbGQoZWwsIG5vZGUpO1xuXHRcdGVsLmFwcGVuZENoaWxkKGVtcHR5KG5vZGUpKTtcblx0XHRyZXR1cm4gZWw7XG5cdH1cbn07XG52YXIgYWxsb3dlZEJsb2NrID0gL14oPzpBKD86RERSRVNTfFJUSUNMRXxTSURFfFVESU8pfEJMT0NLUVVPVEV8Q0FQVElPTnxEKD86W0RMVF18SVYpfEYoPzpJR1VSRXxJR0NBUFRJT058T09URVIpfEhbMS02XXxIRUFERVJ8TCg/OkFCRUx8RUdFTkR8SSl8Tyg/Okx8VVRQVVQpfFAoPzpSRSk/fFNFQ1RJT058VCg/OkFCTEV8Qk9EWXxEfEZPT1R8SHxIRUFEfFIpfENPTCg/OkdST1VQKT98VUwpJC87XG52YXIgYmxhY2tsaXN0ID0gL14oPzpIRUFEfE1FVEF8U1RZTEUpLztcbnZhciBjbGVhblRyZWUgPSAobm9kZSwgY29uZmlnLCBwcmVzZXJ2ZVdTKSA9PiB7XG5cdGNvbnN0IGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuXHRsZXQgbm9uSW5saW5lUGFyZW50ID0gbm9kZTtcblx0d2hpbGUgKGlzSW5saW5lKG5vbklubGluZVBhcmVudCkpIHtcblx0XHRub25JbmxpbmVQYXJlbnQgPSBub25JbmxpbmVQYXJlbnQucGFyZW50Tm9kZTtcblx0fVxuXHRjb25zdCB3YWxrZXIgPSBuZXcgVHJlZUl0ZXJhdG9yKFxuXHRcdFx0bm9uSW5saW5lUGFyZW50LFxuXHRcdFx0U0hPV19FTEVNRU5UX09SX1RFWFRcblx0KTtcblx0Zm9yIChsZXQgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcblx0XHRsZXQgY2hpbGQgPSBjaGlsZHJlbltpXTtcblx0XHRjb25zdCBub2RlTmFtZSA9IGNoaWxkLm5vZGVOYW1lO1xuXHRcdGNvbnN0IHJld3JpdGVyID0gc3R5bGVzUmV3cml0ZXJzW25vZGVOYW1lXTtcblx0XHRpZiAoY2hpbGQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHRcdFx0Y29uc3QgY2hpbGRMZW5ndGggPSBjaGlsZC5jaGlsZE5vZGVzLmxlbmd0aDtcblx0XHRcdGlmIChyZXdyaXRlcikge1xuXHRcdFx0XHRjaGlsZCA9IHJld3JpdGVyKGNoaWxkLCBub2RlLCBjb25maWcpO1xuXHRcdFx0fSBlbHNlIGlmIChibGFja2xpc3QudGVzdChub2RlTmFtZSkpIHtcblx0XHRcdFx0bm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG5cdFx0XHRcdGkgLT0gMTtcblx0XHRcdFx0bCAtPSAxO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH0gZWxzZSBpZiAoIWFsbG93ZWRCbG9jay50ZXN0KG5vZGVOYW1lKSAmJiAhaXNJbmxpbmUoY2hpbGQpKSB7XG5cdFx0XHRcdGkgLT0gMTtcblx0XHRcdFx0bCArPSBjaGlsZExlbmd0aCAtIDE7XG5cdFx0XHRcdG5vZGUucmVwbGFjZUNoaWxkKGVtcHR5KGNoaWxkKSwgY2hpbGQpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdGlmIChjaGlsZExlbmd0aCkge1xuXHRcdFx0XHRjbGVhblRyZWUoY2hpbGQsIGNvbmZpZywgcHJlc2VydmVXUyB8fCBub2RlTmFtZSA9PT0gXCJQUkVcIik7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChjaGlsZCBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRcdFx0bGV0IGRhdGEgPSBjaGlsZC5kYXRhO1xuXHRcdFx0XHRjb25zdCBzdGFydHNXaXRoV1MgPSAhbm90V1MudGVzdChkYXRhLmNoYXJBdCgwKSk7XG5cdFx0XHRcdGNvbnN0IGVuZHNXaXRoV1MgPSAhbm90V1MudGVzdChkYXRhLmNoYXJBdChkYXRhLmxlbmd0aCAtIDEpKTtcblx0XHRcdFx0aWYgKHByZXNlcnZlV1MgfHwgIXN0YXJ0c1dpdGhXUyAmJiAhZW5kc1dpdGhXUykge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChzdGFydHNXaXRoV1MpIHtcblx0XHRcdFx0XHR3YWxrZXIuY3VycmVudE5vZGUgPSBjaGlsZDtcblx0XHRcdFx0XHRsZXQgc2libGluZztcblx0XHRcdFx0XHR3aGlsZSAoc2libGluZyA9IHdhbGtlci5wcmV2aW91c1BPTm9kZSgpKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2libGluZy5ub2RlTmFtZSA9PT0gXCJJTUdcIiB8fCBzaWJsaW5nIGluc3RhbmNlb2YgVGV4dCAmJiBub3RXUy50ZXN0KHNpYmxpbmcuZGF0YSkpIHtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoIWlzSW5saW5lKHNpYmxpbmcpKSB7XG5cdFx0XHRcdFx0XHRcdHNpYmxpbmcgPSBudWxsO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSgvXlsgXFx0XFxyXFxuXSsvZywgc2libGluZyA/IFwiIFwiIDogXCJcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVuZHNXaXRoV1MpIHtcblx0XHRcdFx0XHR3YWxrZXIuY3VycmVudE5vZGUgPSBjaGlsZDtcblx0XHRcdFx0XHRsZXQgc2libGluZztcblx0XHRcdFx0XHR3aGlsZSAoc2libGluZyA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2libGluZy5ub2RlTmFtZSA9PT0gXCJJTUdcIiB8fCBzaWJsaW5nIGluc3RhbmNlb2YgVGV4dCAmJiBub3RXUy50ZXN0KHNpYmxpbmcuZGF0YSkpIHtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoIWlzSW5saW5lKHNpYmxpbmcpKSB7XG5cdFx0XHRcdFx0XHRcdHNpYmxpbmcgPSBudWxsO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSgvWyBcXHRcXHJcXG5dKyQvZywgc2libGluZyA/IFwiIFwiIDogXCJcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEpIHtcblx0XHRcdFx0XHRjaGlsZC5kYXRhID0gZGF0YTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0bm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG5cdFx0XHRpIC09IDE7XG5cdFx0XHRsIC09IDE7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBub2RlO1xufTtcbnZhciByZW1vdmVFbXB0eUlubGluZXMgPSAobm9kZSkgPT4ge1xuXHRjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGROb2Rlcztcblx0bGV0IGwgPSBjaGlsZHJlbi5sZW5ndGg7XG5cdHdoaWxlIChsLS0pIHtcblx0XHRjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2xdO1xuXHRcdGlmIChjaGlsZCBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIWlzTGVhZihjaGlsZCkpIHtcblx0XHRcdHJlbW92ZUVtcHR5SW5saW5lcyhjaGlsZCk7XG5cdFx0XHRpZiAoaXNJbmxpbmUoY2hpbGQpICYmICFjaGlsZC5maXJzdENoaWxkKSB7XG5cdFx0XHRcdG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoY2hpbGQgaW5zdGFuY2VvZiBUZXh0ICYmICFjaGlsZC5kYXRhKSB7XG5cdFx0XHRub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHR9XG5cdH1cbn07XG52YXIgY2xlYW51cEJScyA9IChub2RlLCByb290LCBrZWVwRm9yQmxhbmtMaW5lLCBjb25maWcpID0+IHtcblx0Y29uc3QgYnJzID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKFwiQlJcIik7XG5cdGNvbnN0IGJyQnJlYWtzTGluZSA9IFtdO1xuXHRsZXQgbCA9IGJycy5sZW5ndGg7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbDsgaSArPSAxKSB7XG5cdFx0YnJCcmVha3NMaW5lW2ldID0gaXNMaW5lQnJlYWsoYnJzW2ldLCBrZWVwRm9yQmxhbmtMaW5lKTtcblx0fVxuXHR3aGlsZSAobC0tKSB7XG5cdFx0Y29uc3QgYnIgPSBicnNbbF07XG5cdFx0Y29uc3QgcGFyZW50ID0gYnIucGFyZW50Tm9kZTtcblx0XHRpZiAoIXBhcmVudCkge1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXHRcdGlmICghYnJCcmVha3NMaW5lW2xdKSB7XG5cdFx0XHRkZXRhY2goYnIpO1xuXHRcdH0gZWxzZSBpZiAoIWlzSW5saW5lKHBhcmVudCkpIHtcblx0XHRcdGZpeENvbnRhaW5lcihwYXJlbnQsIHJvb3QsIGNvbmZpZyk7XG5cdFx0fVxuXHR9XG59O1xudmFyIGVzY2FwZUhUTUwgPSAodGV4dCkgPT4ge1xuXHRyZXR1cm4gdGV4dC5zcGxpdChcIiZcIikuam9pbihcIiZhbXA7XCIpLnNwbGl0KFwiPFwiKS5qb2luKFwiJmx0O1wiKS5zcGxpdChcIj5cIikuam9pbihcIiZndDtcIikuc3BsaXQoJ1wiJykuam9pbihcIiZxdW90O1wiKTtcbn07XG5cbi8vIHNvdXJjZS9ub2RlL0Jsb2NrLnRzXG52YXIgZ2V0QmxvY2tXYWxrZXIgPSAobm9kZSwgcm9vdCkgPT4ge1xuXHRjb25zdCB3YWxrZXIgPSBuZXcgVHJlZUl0ZXJhdG9yKHJvb3QsIFNIT1dfRUxFTUVOVCwgaXNCbG9jayk7XG5cdHdhbGtlci5jdXJyZW50Tm9kZSA9IG5vZGU7XG5cdHJldHVybiB3YWxrZXI7XG59O1xudmFyIGdldFByZXZpb3VzQmxvY2sgPSAobm9kZSwgcm9vdCkgPT4ge1xuXHRjb25zdCBibG9jayA9IGdldEJsb2NrV2Fsa2VyKG5vZGUsIHJvb3QpLnByZXZpb3VzTm9kZSgpO1xuXHRyZXR1cm4gYmxvY2sgIT09IHJvb3QgPyBibG9jayA6IG51bGw7XG59O1xudmFyIGdldE5leHRCbG9jayA9IChub2RlLCByb290KSA9PiB7XG5cdGNvbnN0IGJsb2NrID0gZ2V0QmxvY2tXYWxrZXIobm9kZSwgcm9vdCkubmV4dE5vZGUoKTtcblx0cmV0dXJuIGJsb2NrICE9PSByb290ID8gYmxvY2sgOiBudWxsO1xufTtcbnZhciBpc0VtcHR5QmxvY2sgPSAoYmxvY2spID0+IHtcblx0cmV0dXJuICFibG9jay50ZXh0Q29udGVudCAmJiAhYmxvY2sucXVlcnlTZWxlY3RvcihcIklNR1wiKTtcbn07XG5cbi8vIHNvdXJjZS9yYW5nZS9CbG9jay50c1xudmFyIGdldFN0YXJ0QmxvY2tPZlJhbmdlID0gKHJhbmdlLCByb290KSA9PiB7XG5cdGNvbnN0IGNvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRsZXQgYmxvY2s7XG5cdGlmIChpc0lubGluZShjb250YWluZXIpKSB7XG5cdFx0YmxvY2sgPSBnZXRQcmV2aW91c0Jsb2NrKGNvbnRhaW5lciwgcm9vdCk7XG5cdH0gZWxzZSBpZiAoY29udGFpbmVyICE9PSByb290ICYmIGNvbnRhaW5lciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIGlzQmxvY2soY29udGFpbmVyKSkge1xuXHRcdGJsb2NrID0gY29udGFpbmVyO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IG5vZGUgPSBnZXROb2RlQmVmb3JlT2Zmc2V0KGNvbnRhaW5lciwgcmFuZ2Uuc3RhcnRPZmZzZXQpO1xuXHRcdGJsb2NrID0gZ2V0TmV4dEJsb2NrKG5vZGUsIHJvb3QpO1xuXHR9XG5cdHJldHVybiBibG9jayAmJiBpc05vZGVDb250YWluZWRJblJhbmdlKHJhbmdlLCBibG9jaywgdHJ1ZSkgPyBibG9jayA6IG51bGw7XG59O1xudmFyIGdldEVuZEJsb2NrT2ZSYW5nZSA9IChyYW5nZSwgcm9vdCkgPT4ge1xuXHRjb25zdCBjb250YWluZXIgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdGxldCBibG9jaztcblx0aWYgKGlzSW5saW5lKGNvbnRhaW5lcikpIHtcblx0XHRibG9jayA9IGdldFByZXZpb3VzQmxvY2soY29udGFpbmVyLCByb290KTtcblx0fSBlbHNlIGlmIChjb250YWluZXIgIT09IHJvb3QgJiYgY29udGFpbmVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgaXNCbG9jayhjb250YWluZXIpKSB7XG5cdFx0YmxvY2sgPSBjb250YWluZXI7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IG5vZGUgPSBnZXROb2RlQWZ0ZXJPZmZzZXQoY29udGFpbmVyLCByYW5nZS5lbmRPZmZzZXQpO1xuXHRcdGlmICghbm9kZSB8fCAhcm9vdC5jb250YWlucyhub2RlKSkge1xuXHRcdFx0bm9kZSA9IHJvb3Q7XG5cdFx0XHRsZXQgY2hpbGQ7XG5cdFx0XHR3aGlsZSAoY2hpbGQgPSBub2RlLmxhc3RDaGlsZCkge1xuXHRcdFx0XHRub2RlID0gY2hpbGQ7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGJsb2NrID0gZ2V0UHJldmlvdXNCbG9jayhub2RlLCByb290KTtcblx0fVxuXHRyZXR1cm4gYmxvY2sgJiYgaXNOb2RlQ29udGFpbmVkSW5SYW5nZShyYW5nZSwgYmxvY2ssIHRydWUpID8gYmxvY2sgOiBudWxsO1xufTtcbnZhciBpc0NvbnRlbnQgPSAobm9kZSkgPT4ge1xuXHRyZXR1cm4gbm9kZSBpbnN0YW5jZW9mIFRleHQgPyBub3RXUy50ZXN0KG5vZGUuZGF0YSkgOiBub2RlLm5vZGVOYW1lID09PSBcIklNR1wiO1xufTtcbnZhciByYW5nZURvZXNTdGFydEF0QmxvY2tCb3VuZGFyeSA9IChyYW5nZSwgcm9vdCkgPT4ge1xuXHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRjb25zdCBzdGFydE9mZnNldCA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRsZXQgbm9kZUFmdGVyQ3Vyc29yO1xuXHRpZiAoc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0Y29uc3QgdGV4dCA9IHN0YXJ0Q29udGFpbmVyLmRhdGE7XG5cdFx0Zm9yIChsZXQgaSA9IHN0YXJ0T2Zmc2V0OyBpID4gMDsgaSAtPSAxKSB7XG5cdFx0XHRpZiAodGV4dC5jaGFyQXQoaSAtIDEpICE9PSBaV1MpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRub2RlQWZ0ZXJDdXJzb3IgPSBzdGFydENvbnRhaW5lcjtcblx0fSBlbHNlIHtcblx0XHRub2RlQWZ0ZXJDdXJzb3IgPSBnZXROb2RlQWZ0ZXJPZmZzZXQoc3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0KTtcblx0XHRpZiAobm9kZUFmdGVyQ3Vyc29yICYmICFyb290LmNvbnRhaW5zKG5vZGVBZnRlckN1cnNvcikpIHtcblx0XHRcdG5vZGVBZnRlckN1cnNvciA9IG51bGw7XG5cdFx0fVxuXHRcdGlmICghbm9kZUFmdGVyQ3Vyc29yKSB7XG5cdFx0XHRub2RlQWZ0ZXJDdXJzb3IgPSBnZXROb2RlQmVmb3JlT2Zmc2V0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCk7XG5cdFx0XHRpZiAobm9kZUFmdGVyQ3Vyc29yIGluc3RhbmNlb2YgVGV4dCAmJiBub2RlQWZ0ZXJDdXJzb3IubGVuZ3RoKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Y29uc3QgYmxvY2sgPSBnZXRTdGFydEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdGlmICghYmxvY2spIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0Y29uc3QgY29udGVudFdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoXG5cdFx0XHRibG9jayxcblx0XHRcdFNIT1dfRUxFTUVOVF9PUl9URVhULFxuXHRcdFx0aXNDb250ZW50XG5cdCk7XG5cdGNvbnRlbnRXYWxrZXIuY3VycmVudE5vZGUgPSBub2RlQWZ0ZXJDdXJzb3I7XG5cdHJldHVybiAhY29udGVudFdhbGtlci5wcmV2aW91c05vZGUoKTtcbn07XG52YXIgcmFuZ2VEb2VzRW5kQXRCbG9ja0JvdW5kYXJ5ID0gKHJhbmdlLCByb290KSA9PiB7XG5cdGNvbnN0IGVuZENvbnRhaW5lciA9IHJhbmdlLmVuZENvbnRhaW5lcjtcblx0Y29uc3QgZW5kT2Zmc2V0ID0gcmFuZ2UuZW5kT2Zmc2V0O1xuXHRsZXQgY3VycmVudE5vZGU7XG5cdGlmIChlbmRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0Y29uc3QgdGV4dCA9IGVuZENvbnRhaW5lci5kYXRhO1xuXHRcdGNvbnN0IGxlbmd0aCA9IHRleHQubGVuZ3RoO1xuXHRcdGZvciAobGV0IGkgPSBlbmRPZmZzZXQ7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKHRleHQuY2hhckF0KGkpICE9PSBaV1MpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRjdXJyZW50Tm9kZSA9IGVuZENvbnRhaW5lcjtcblx0fSBlbHNlIHtcblx0XHRjdXJyZW50Tm9kZSA9IGdldE5vZGVCZWZvcmVPZmZzZXQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xuXHR9XG5cdGNvbnN0IGJsb2NrID0gZ2V0RW5kQmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0aWYgKCFibG9jaykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRjb25zdCBjb250ZW50V2Fsa2VyID0gbmV3IFRyZWVJdGVyYXRvcihcblx0XHRcdGJsb2NrLFxuXHRcdFx0U0hPV19FTEVNRU5UX09SX1RFWFQsXG5cdFx0XHRpc0NvbnRlbnRcblx0KTtcblx0Y29udGVudFdhbGtlci5jdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlO1xuXHRyZXR1cm4gIWNvbnRlbnRXYWxrZXIubmV4dE5vZGUoKTtcbn07XG52YXIgZXhwYW5kUmFuZ2VUb0Jsb2NrQm91bmRhcmllcyA9IChyYW5nZSwgcm9vdCkgPT4ge1xuXHRjb25zdCBzdGFydCA9IGdldFN0YXJ0QmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0Y29uc3QgZW5kID0gZ2V0RW5kQmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0bGV0IHBhcmVudDtcblx0aWYgKHN0YXJ0ICYmIGVuZCkge1xuXHRcdHBhcmVudCA9IHN0YXJ0LnBhcmVudE5vZGU7XG5cdFx0cmFuZ2Uuc2V0U3RhcnQocGFyZW50LCBBcnJheS5mcm9tKHBhcmVudC5jaGlsZE5vZGVzKS5pbmRleE9mKHN0YXJ0KSk7XG5cdFx0cGFyZW50ID0gZW5kLnBhcmVudE5vZGU7XG5cdFx0cmFuZ2Uuc2V0RW5kKHBhcmVudCwgQXJyYXkuZnJvbShwYXJlbnQuY2hpbGROb2RlcykuaW5kZXhPZihlbmQpICsgMSk7XG5cdH1cbn07XG5cbi8vIHNvdXJjZS9yYW5nZS9JbnNlcnREZWxldGUudHNcbmZ1bmN0aW9uIGNyZWF0ZVJhbmdlKHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCwgZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpIHtcblx0Y29uc3QgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuXHRyYW5nZS5zZXRTdGFydChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHRpZiAoZW5kQ29udGFpbmVyICYmIHR5cGVvZiBlbmRPZmZzZXQgPT09IFwibnVtYmVyXCIpIHtcblx0XHRyYW5nZS5zZXRFbmQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xuXHR9IGVsc2Uge1xuXHRcdHJhbmdlLnNldEVuZChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHR9XG5cdHJldHVybiByYW5nZTtcbn1cblxudmFyIGluc2VydE5vZGVJblJhbmdlID0gKHJhbmdlLCBub2RlKSA9PiB7XG5cdGxldCB7c3RhcnRDb250YWluZXIsIHN0YXJ0T2Zmc2V0LCBlbmRDb250YWluZXIsIGVuZE9mZnNldH0gPSByYW5nZTtcblx0bGV0IGNoaWxkcmVuO1xuXHRpZiAoc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0Y29uc3QgcGFyZW50ID0gc3RhcnRDb250YWluZXIucGFyZW50Tm9kZTtcblx0XHRjaGlsZHJlbiA9IHBhcmVudC5jaGlsZE5vZGVzO1xuXHRcdGlmIChzdGFydE9mZnNldCA9PT0gc3RhcnRDb250YWluZXIubGVuZ3RoKSB7XG5cdFx0XHRzdGFydE9mZnNldCA9IEFycmF5LmZyb20oY2hpbGRyZW4pLmluZGV4T2Yoc3RhcnRDb250YWluZXIpICsgMTtcblx0XHRcdGlmIChyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRcdFx0ZW5kQ29udGFpbmVyID0gcGFyZW50O1xuXHRcdFx0XHRlbmRPZmZzZXQgPSBzdGFydE9mZnNldDtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHN0YXJ0T2Zmc2V0KSB7XG5cdFx0XHRcdGNvbnN0IGFmdGVyU3BsaXQgPSBzdGFydENvbnRhaW5lci5zcGxpdFRleHQoc3RhcnRPZmZzZXQpO1xuXHRcdFx0XHRpZiAoZW5kQ29udGFpbmVyID09PSBzdGFydENvbnRhaW5lcikge1xuXHRcdFx0XHRcdGVuZE9mZnNldCAtPSBzdGFydE9mZnNldDtcblx0XHRcdFx0XHRlbmRDb250YWluZXIgPSBhZnRlclNwbGl0O1xuXHRcdFx0XHR9IGVsc2UgaWYgKGVuZENvbnRhaW5lciA9PT0gcGFyZW50KSB7XG5cdFx0XHRcdFx0ZW5kT2Zmc2V0ICs9IDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0c3RhcnRDb250YWluZXIgPSBhZnRlclNwbGl0O1xuXHRcdFx0fVxuXHRcdFx0c3RhcnRPZmZzZXQgPSBBcnJheS5mcm9tKGNoaWxkcmVuKS5pbmRleE9mKFxuXHRcdFx0XHRcdHN0YXJ0Q29udGFpbmVyXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRzdGFydENvbnRhaW5lciA9IHBhcmVudDtcblx0fSBlbHNlIHtcblx0XHRjaGlsZHJlbiA9IHN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXM7XG5cdH1cblx0Y29uc3QgY2hpbGRDb3VudCA9IGNoaWxkcmVuLmxlbmd0aDtcblx0aWYgKHN0YXJ0T2Zmc2V0ID09PSBjaGlsZENvdW50KSB7XG5cdFx0c3RhcnRDb250YWluZXIuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdH0gZWxzZSB7XG5cdFx0c3RhcnRDb250YWluZXIuaW5zZXJ0QmVmb3JlKG5vZGUsIGNoaWxkcmVuW3N0YXJ0T2Zmc2V0XSk7XG5cdH1cblx0aWYgKHN0YXJ0Q29udGFpbmVyID09PSBlbmRDb250YWluZXIpIHtcblx0XHRlbmRPZmZzZXQgKz0gY2hpbGRyZW4ubGVuZ3RoIC0gY2hpbGRDb3VudDtcblx0fVxuXHRyYW5nZS5zZXRTdGFydChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHRyYW5nZS5zZXRFbmQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xufTtcbnZhciBleHRyYWN0Q29udGVudHNPZlJhbmdlID0gKHJhbmdlLCBjb21tb24sIHJvb3QpID0+IHtcblx0Y29uc3QgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0aWYgKHJhbmdlLmNvbGxhcHNlZCkge1xuXHRcdHJldHVybiBmcmFnO1xuXHR9XG5cdGlmICghY29tbW9uKSB7XG5cdFx0Y29tbW9uID0gcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG5cdH1cblx0aWYgKGNvbW1vbiBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRjb21tb24gPSBjb21tb24ucGFyZW50Tm9kZTtcblx0fVxuXHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRjb25zdCBzdGFydE9mZnNldCA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRsZXQgZW5kQ29udGFpbmVyID0gc3BsaXQocmFuZ2UuZW5kQ29udGFpbmVyLCByYW5nZS5lbmRPZmZzZXQsIGNvbW1vbiwgcm9vdCk7XG5cdGxldCBlbmRPZmZzZXQgPSAwO1xuXHRsZXQgbm9kZSA9IHNwbGl0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCwgY29tbW9uLCByb290KTtcblx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZW5kQ29udGFpbmVyKSB7XG5cdFx0Y29uc3QgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG5cdFx0ZnJhZy5hcHBlbmRDaGlsZChub2RlKTtcblx0XHRub2RlID0gbmV4dDtcblx0fVxuXHRpZiAoc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0ICYmIGVuZENvbnRhaW5lciBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRzdGFydENvbnRhaW5lci5hcHBlbmREYXRhKGVuZENvbnRhaW5lci5kYXRhKTtcblx0XHRkZXRhY2goZW5kQ29udGFpbmVyKTtcblx0XHRlbmRDb250YWluZXIgPSBzdGFydENvbnRhaW5lcjtcblx0XHRlbmRPZmZzZXQgPSBzdGFydE9mZnNldDtcblx0fVxuXHRyYW5nZS5zZXRTdGFydChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHRpZiAoZW5kQ29udGFpbmVyKSB7XG5cdFx0cmFuZ2Uuc2V0RW5kKGVuZENvbnRhaW5lciwgZW5kT2Zmc2V0KTtcblx0fSBlbHNlIHtcblx0XHRyYW5nZS5zZXRFbmQoY29tbW9uLCBjb21tb24uY2hpbGROb2Rlcy5sZW5ndGgpO1xuXHR9XG5cdGZpeEN1cnNvcihjb21tb24pO1xuXHRyZXR1cm4gZnJhZztcbn07XG52YXIgZ2V0QWRqYWNlbnRJbmxpbmVOb2RlID0gKGl0ZXJhdG9yLCBtZXRob2QsIG5vZGUpID0+IHtcblx0aXRlcmF0b3IuY3VycmVudE5vZGUgPSBub2RlO1xuXHRsZXQgbmV4dE5vZGU7XG5cdHdoaWxlIChuZXh0Tm9kZSA9IGl0ZXJhdG9yW21ldGhvZF0oKSkge1xuXHRcdGlmIChuZXh0Tm9kZSBpbnN0YW5jZW9mIFRleHQgfHwgaXNMZWFmKG5leHROb2RlKSkge1xuXHRcdFx0cmV0dXJuIG5leHROb2RlO1xuXHRcdH1cblx0XHRpZiAoIWlzSW5saW5lKG5leHROb2RlKSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBudWxsO1xufTtcbnZhciBkZWxldGVDb250ZW50c09mUmFuZ2UgPSAocmFuZ2UsIHJvb3QpID0+IHtcblx0Y29uc3Qgc3RhcnRCbG9jayA9IGdldFN0YXJ0QmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0bGV0IGVuZEJsb2NrID0gZ2V0RW5kQmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0Y29uc3QgbmVlZHNNZXJnZSA9IHN0YXJ0QmxvY2sgIT09IGVuZEJsb2NrO1xuXHRpZiAoc3RhcnRCbG9jayAmJiBlbmRCbG9jaykge1xuXHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc1VwVHJlZShyYW5nZSwgc3RhcnRCbG9jaywgZW5kQmxvY2ssIHJvb3QpO1xuXHR9XG5cdGNvbnN0IGZyYWcgPSBleHRyYWN0Q29udGVudHNPZlJhbmdlKHJhbmdlLCBudWxsLCByb290KTtcblx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0aWYgKG5lZWRzTWVyZ2UpIHtcblx0XHRlbmRCbG9jayA9IGdldEVuZEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0aWYgKHN0YXJ0QmxvY2sgJiYgZW5kQmxvY2sgJiYgc3RhcnRCbG9jayAhPT0gZW5kQmxvY2spIHtcblx0XHRcdG1lcmdlV2l0aEJsb2NrKHN0YXJ0QmxvY2ssIGVuZEJsb2NrLCByYW5nZSwgcm9vdCk7XG5cdFx0fVxuXHR9XG5cdGlmIChzdGFydEJsb2NrKSB7XG5cdFx0Zml4Q3Vyc29yKHN0YXJ0QmxvY2spO1xuXHR9XG5cdGNvbnN0IGNoaWxkID0gcm9vdC5maXJzdENoaWxkO1xuXHRpZiAoIWNoaWxkIHx8IGNoaWxkLm5vZGVOYW1lID09PSBcIkJSXCIpIHtcblx0XHRmaXhDdXJzb3Iocm9vdCk7XG5cdFx0aWYgKHJvb3QuZmlyc3RDaGlsZCkge1xuXHRcdFx0cmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKHJvb3QuZmlyc3RDaGlsZCk7XG5cdFx0fVxuXHR9XG5cdHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuXHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRjb25zdCBzdGFydE9mZnNldCA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRjb25zdCBpdGVyYXRvciA9IG5ldyBUcmVlSXRlcmF0b3Iocm9vdCwgU0hPV19FTEVNRU5UX09SX1RFWFQpO1xuXHRsZXQgYWZ0ZXJOb2RlID0gc3RhcnRDb250YWluZXI7XG5cdGxldCBhZnRlck9mZnNldCA9IHN0YXJ0T2Zmc2V0O1xuXHRpZiAoIShhZnRlck5vZGUgaW5zdGFuY2VvZiBUZXh0KSB8fCBhZnRlck9mZnNldCA9PT0gYWZ0ZXJOb2RlLmRhdGEubGVuZ3RoKSB7XG5cdFx0YWZ0ZXJOb2RlID0gZ2V0QWRqYWNlbnRJbmxpbmVOb2RlKGl0ZXJhdG9yLCBcIm5leHROb2RlXCIsIGFmdGVyTm9kZSk7XG5cdFx0YWZ0ZXJPZmZzZXQgPSAwO1xuXHR9XG5cdGxldCBiZWZvcmVOb2RlID0gc3RhcnRDb250YWluZXI7XG5cdGxldCBiZWZvcmVPZmZzZXQgPSBzdGFydE9mZnNldCAtIDE7XG5cdGlmICghKGJlZm9yZU5vZGUgaW5zdGFuY2VvZiBUZXh0KSB8fCBiZWZvcmVPZmZzZXQgPT09IC0xKSB7XG5cdFx0YmVmb3JlTm9kZSA9IGdldEFkamFjZW50SW5saW5lTm9kZShcblx0XHRcdFx0aXRlcmF0b3IsXG5cdFx0XHRcdFwicHJldmlvdXNQT05vZGVcIixcblx0XHRcdFx0YWZ0ZXJOb2RlIHx8IChzdGFydENvbnRhaW5lciBpbnN0YW5jZW9mIFRleHQgPyBzdGFydENvbnRhaW5lciA6IHN0YXJ0Q29udGFpbmVyLmNoaWxkTm9kZXNbc3RhcnRPZmZzZXRdIHx8IHN0YXJ0Q29udGFpbmVyKVxuXHRcdCk7XG5cdFx0aWYgKGJlZm9yZU5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRiZWZvcmVPZmZzZXQgPSBiZWZvcmVOb2RlLmRhdGEubGVuZ3RoO1xuXHRcdH1cblx0fVxuXHRsZXQgbm9kZSA9IG51bGw7XG5cdGxldCBvZmZzZXQgPSAwO1xuXHRpZiAoYWZ0ZXJOb2RlIGluc3RhbmNlb2YgVGV4dCAmJiBhZnRlck5vZGUuZGF0YS5jaGFyQXQoYWZ0ZXJPZmZzZXQpID09PSBcIiBcIiAmJiByYW5nZURvZXNTdGFydEF0QmxvY2tCb3VuZGFyeShyYW5nZSwgcm9vdCkpIHtcblx0XHRub2RlID0gYWZ0ZXJOb2RlO1xuXHRcdG9mZnNldCA9IGFmdGVyT2Zmc2V0O1xuXHR9IGVsc2UgaWYgKGJlZm9yZU5vZGUgaW5zdGFuY2VvZiBUZXh0ICYmIGJlZm9yZU5vZGUuZGF0YS5jaGFyQXQoYmVmb3JlT2Zmc2V0KSA9PT0gXCIgXCIpIHtcblx0XHRpZiAoYWZ0ZXJOb2RlIGluc3RhbmNlb2YgVGV4dCAmJiBhZnRlck5vZGUuZGF0YS5jaGFyQXQoYWZ0ZXJPZmZzZXQpID09PSBcIiBcIiB8fCByYW5nZURvZXNFbmRBdEJsb2NrQm91bmRhcnkocmFuZ2UsIHJvb3QpKSB7XG5cdFx0XHRub2RlID0gYmVmb3JlTm9kZTtcblx0XHRcdG9mZnNldCA9IGJlZm9yZU9mZnNldDtcblx0XHR9XG5cdH1cblx0aWYgKG5vZGUpIHtcblx0XHRub2RlLnJlcGxhY2VEYXRhKG9mZnNldCwgMSwgXCJcXHhBMFwiKTtcblx0fVxuXHRyYW5nZS5zZXRTdGFydChzdGFydENvbnRhaW5lciwgc3RhcnRPZmZzZXQpO1xuXHRyYW5nZS5jb2xsYXBzZSh0cnVlKTtcblx0cmV0dXJuIGZyYWc7XG59O1xudmFyIGluc2VydFRyZWVGcmFnbWVudEludG9SYW5nZSA9IChyYW5nZSwgZnJhZywgcm9vdCwgY29uZmlnKSA9PiB7XG5cdGNvbnN0IGZpcnN0SW5GcmFnSXNJbmxpbmUgPSBmcmFnLmZpcnN0Q2hpbGQgJiYgaXNJbmxpbmUoZnJhZy5maXJzdENoaWxkKTtcblx0bGV0IG5vZGU7XG5cdGZpeENvbnRhaW5lcihmcmFnLCByb290LCBjb25maWcpO1xuXHRub2RlID0gZnJhZztcblx0d2hpbGUgKG5vZGUgPSBnZXROZXh0QmxvY2sobm9kZSwgcm9vdCkpIHtcblx0XHRmaXhDdXJzb3Iobm9kZSk7XG5cdH1cblx0aWYgKCFyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRkZWxldGVDb250ZW50c09mUmFuZ2UocmFuZ2UsIHJvb3QpO1xuXHR9XG5cdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdHJhbmdlLmNvbGxhcHNlKGZhbHNlKTtcblx0Y29uc3Qgc3RvcFBvaW50ID0gZ2V0TmVhcmVzdChyYW5nZS5lbmRDb250YWluZXIsIHJvb3QsIFwiQkxPQ0tRVU9URVwiKSB8fCByb290O1xuXHRsZXQgYmxvY2sgPSBnZXRTdGFydEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdGxldCBibG9ja0NvbnRlbnRzQWZ0ZXJTcGxpdCA9IG51bGw7XG5cdGNvbnN0IGZpcnN0QmxvY2tJbkZyYWcgPSBnZXROZXh0QmxvY2soZnJhZywgZnJhZyk7XG5cdGNvbnN0IHJlcGxhY2VCbG9jayA9ICFmaXJzdEluRnJhZ0lzSW5saW5lICYmICEhYmxvY2sgJiYgaXNFbXB0eUJsb2NrKGJsb2NrKTtcblx0aWYgKGJsb2NrICYmIGZpcnN0QmxvY2tJbkZyYWcgJiYgIXJlcGxhY2VCbG9jayAmJiAvLyBEb24ndCBtZXJnZSB0YWJsZSBjZWxscyBvciBQUkUgZWxlbWVudHMgaW50byBibG9ja1xuXHRcdFx0IWdldE5lYXJlc3QoZmlyc3RCbG9ja0luRnJhZywgZnJhZywgXCJQUkVcIikgJiYgIWdldE5lYXJlc3QoZmlyc3RCbG9ja0luRnJhZywgZnJhZywgXCJUQUJMRVwiKSkge1xuXHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNVcFRyZWUocmFuZ2UsIGJsb2NrLCBibG9jaywgcm9vdCk7XG5cdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0bGV0IGNvbnRhaW5lciA9IHJhbmdlLmVuZENvbnRhaW5lcjtcblx0XHRsZXQgb2Zmc2V0ID0gcmFuZ2UuZW5kT2Zmc2V0O1xuXHRcdGNsZWFudXBCUnMoYmxvY2ssIHJvb3QsIGZhbHNlLCBjb25maWcpO1xuXHRcdGlmIChpc0lubGluZShjb250YWluZXIpKSB7XG5cdFx0XHRjb25zdCBub2RlQWZ0ZXJTcGxpdCA9IHNwbGl0KFxuXHRcdFx0XHRcdGNvbnRhaW5lcixcblx0XHRcdFx0XHRvZmZzZXQsXG5cdFx0XHRcdFx0Z2V0UHJldmlvdXNCbG9jayhjb250YWluZXIsIHJvb3QpIHx8IHJvb3QsXG5cdFx0XHRcdFx0cm9vdFxuXHRcdFx0KTtcblx0XHRcdGNvbnRhaW5lciA9IG5vZGVBZnRlclNwbGl0LnBhcmVudE5vZGU7XG5cdFx0XHRvZmZzZXQgPSBBcnJheS5mcm9tKGNvbnRhaW5lci5jaGlsZE5vZGVzKS5pbmRleE9mKFxuXHRcdFx0XHRcdG5vZGVBZnRlclNwbGl0XG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoXG5cdFx0XHRcdC8qaXNCbG9jayggY29udGFpbmVyICkgJiYgKi9cblx0XHRcdFx0b2Zmc2V0ICE9PSBnZXRMZW5ndGgoY29udGFpbmVyKVxuXHRcdCkge1xuXHRcdFx0YmxvY2tDb250ZW50c0FmdGVyU3BsaXQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0XHR3aGlsZSAobm9kZSA9IGNvbnRhaW5lci5jaGlsZE5vZGVzW29mZnNldF0pIHtcblx0XHRcdFx0YmxvY2tDb250ZW50c0FmdGVyU3BsaXQuYXBwZW5kQ2hpbGQobm9kZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdG1lcmdlV2l0aEJsb2NrKGNvbnRhaW5lciwgZmlyc3RCbG9ja0luRnJhZywgcmFuZ2UsIHJvb3QpO1xuXHRcdG9mZnNldCA9IEFycmF5LmZyb20oY29udGFpbmVyLnBhcmVudE5vZGUuY2hpbGROb2RlcykuaW5kZXhPZihcblx0XHRcdFx0Y29udGFpbmVyXG5cdFx0KSArIDE7XG5cdFx0Y29udGFpbmVyID0gY29udGFpbmVyLnBhcmVudE5vZGU7XG5cdFx0cmFuZ2Uuc2V0RW5kKGNvbnRhaW5lciwgb2Zmc2V0KTtcblx0fVxuXHRpZiAoZ2V0TGVuZ3RoKGZyYWcpKSB7XG5cdFx0aWYgKHJlcGxhY2VCbG9jayAmJiBibG9jaykge1xuXHRcdFx0cmFuZ2Uuc2V0RW5kQmVmb3JlKGJsb2NrKTtcblx0XHRcdHJhbmdlLmNvbGxhcHNlKGZhbHNlKTtcblx0XHRcdGRldGFjaChibG9jayk7XG5cdFx0fVxuXHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNVcFRyZWUocmFuZ2UsIHN0b3BQb2ludCwgc3RvcFBvaW50LCByb290KTtcblx0XHRsZXQgbm9kZUFmdGVyU3BsaXQgPSBzcGxpdChcblx0XHRcdFx0cmFuZ2UuZW5kQ29udGFpbmVyLFxuXHRcdFx0XHRyYW5nZS5lbmRPZmZzZXQsXG5cdFx0XHRcdHN0b3BQb2ludCxcblx0XHRcdFx0cm9vdFxuXHRcdCk7XG5cdFx0Y29uc3Qgbm9kZUJlZm9yZVNwbGl0ID0gbm9kZUFmdGVyU3BsaXQgPyBub2RlQWZ0ZXJTcGxpdC5wcmV2aW91c1NpYmxpbmcgOiBzdG9wUG9pbnQubGFzdENoaWxkO1xuXHRcdHN0b3BQb2ludC5pbnNlcnRCZWZvcmUoZnJhZywgbm9kZUFmdGVyU3BsaXQpO1xuXHRcdGlmIChub2RlQWZ0ZXJTcGxpdCkge1xuXHRcdFx0cmFuZ2Uuc2V0RW5kQmVmb3JlKG5vZGVBZnRlclNwbGl0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmFuZ2Uuc2V0RW5kKHN0b3BQb2ludCwgZ2V0TGVuZ3RoKHN0b3BQb2ludCkpO1xuXHRcdH1cblx0XHRibG9jayA9IGdldEVuZEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHRjb25zdCBjb250YWluZXIgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gcmFuZ2UuZW5kT2Zmc2V0O1xuXHRcdGlmIChub2RlQWZ0ZXJTcGxpdCAmJiBpc0NvbnRhaW5lcihub2RlQWZ0ZXJTcGxpdCkpIHtcblx0XHRcdG1lcmdlQ29udGFpbmVycyhub2RlQWZ0ZXJTcGxpdCwgcm9vdCwgY29uZmlnKTtcblx0XHR9XG5cdFx0bm9kZUFmdGVyU3BsaXQgPSBub2RlQmVmb3JlU3BsaXQgJiYgbm9kZUJlZm9yZVNwbGl0Lm5leHRTaWJsaW5nO1xuXHRcdGlmIChub2RlQWZ0ZXJTcGxpdCAmJiBpc0NvbnRhaW5lcihub2RlQWZ0ZXJTcGxpdCkpIHtcblx0XHRcdG1lcmdlQ29udGFpbmVycyhub2RlQWZ0ZXJTcGxpdCwgcm9vdCwgY29uZmlnKTtcblx0XHR9XG5cdFx0cmFuZ2Uuc2V0RW5kKGNvbnRhaW5lciwgb2Zmc2V0KTtcblx0fVxuXHRpZiAoYmxvY2tDb250ZW50c0FmdGVyU3BsaXQgJiYgYmxvY2spIHtcblx0XHRjb25zdCB0ZW1wUmFuZ2UgPSByYW5nZS5jbG9uZVJhbmdlKCk7XG5cdFx0Zml4Q3Vyc29yKGJsb2NrQ29udGVudHNBZnRlclNwbGl0KTtcblx0XHRtZXJnZVdpdGhCbG9jayhibG9jaywgYmxvY2tDb250ZW50c0FmdGVyU3BsaXQsIHRlbXBSYW5nZSwgcm9vdCk7XG5cdFx0cmFuZ2Uuc2V0RW5kKHRlbXBSYW5nZS5lbmRDb250YWluZXIsIHRlbXBSYW5nZS5lbmRPZmZzZXQpO1xuXHR9XG5cdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG59O1xuXG4vLyBzb3VyY2UvcmFuZ2UvQ29udGVudHMudHNcbnZhciBnZXRUZXh0Q29udGVudHNPZlJhbmdlID0gKHJhbmdlKSA9PiB7XG5cdGlmIChyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRyZXR1cm4gXCJcIjtcblx0fVxuXHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRjb25zdCBlbmRDb250YWluZXIgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdGNvbnN0IHdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoXG5cdFx0XHRyYW5nZS5jb21tb25BbmNlc3RvckNvbnRhaW5lcixcblx0XHRcdFNIT1dfRUxFTUVOVF9PUl9URVhULFxuXHRcdFx0KG5vZGUyKSA9PiB7XG5cdFx0XHRcdHJldHVybiBpc05vZGVDb250YWluZWRJblJhbmdlKHJhbmdlLCBub2RlMiwgdHJ1ZSk7XG5cdFx0XHR9XG5cdCk7XG5cdHdhbGtlci5jdXJyZW50Tm9kZSA9IHN0YXJ0Q29udGFpbmVyO1xuXHRsZXQgbm9kZSA9IHN0YXJ0Q29udGFpbmVyO1xuXHRsZXQgdGV4dENvbnRlbnQgPSBcIlwiO1xuXHRsZXQgYWRkZWRUZXh0SW5CbG9jayA9IGZhbHNlO1xuXHRsZXQgdmFsdWU7XG5cdGlmICghKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSAmJiAhKG5vZGUgaW5zdGFuY2VvZiBUZXh0KSB8fCAhd2Fsa2VyLmZpbHRlcihub2RlKSkge1xuXHRcdG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKTtcblx0fVxuXHR3aGlsZSAobm9kZSkge1xuXHRcdGlmIChub2RlIGluc3RhbmNlb2YgVGV4dCkge1xuXHRcdFx0dmFsdWUgPSBub2RlLmRhdGE7XG5cdFx0XHRpZiAodmFsdWUgJiYgL1xcUy8udGVzdCh2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKG5vZGUgPT09IGVuZENvbnRhaW5lcikge1xuXHRcdFx0XHRcdHZhbHVlID0gdmFsdWUuc2xpY2UoMCwgcmFuZ2UuZW5kT2Zmc2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobm9kZSA9PT0gc3RhcnRDb250YWluZXIpIHtcblx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnNsaWNlKHJhbmdlLnN0YXJ0T2Zmc2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0ZXh0Q29udGVudCArPSB2YWx1ZTtcblx0XHRcdFx0YWRkZWRUZXh0SW5CbG9jayA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChub2RlLm5vZGVOYW1lID09PSBcIkJSXCIgfHwgYWRkZWRUZXh0SW5CbG9jayAmJiAhaXNJbmxpbmUobm9kZSkpIHtcblx0XHRcdHRleHRDb250ZW50ICs9IFwiXFxuXCI7XG5cdFx0XHRhZGRlZFRleHRJbkJsb2NrID0gZmFsc2U7XG5cdFx0fVxuXHRcdG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKTtcblx0fVxuXHR0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnJlcGxhY2UoL8KgL2csIFwiIFwiKTtcblx0cmV0dXJuIHRleHRDb250ZW50O1xufTtcblxuLy8gc291cmNlL0NsaXBib2FyZC50c1xudmFyIGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZjtcbnZhciBleHRyYWN0UmFuZ2VUb0NsaXBib2FyZCA9IChldmVudCwgcmFuZ2UsIHJvb3QsIHJlbW92ZVJhbmdlRnJvbURvY3VtZW50LCB0b0NsZWFuSFRNTCwgdG9QbGFpblRleHQsIHBsYWluVGV4dE9ubHkpID0+IHtcblx0Y29uc3QgY2xpcGJvYXJkRGF0YSA9IGV2ZW50LmNsaXBib2FyZERhdGE7XG5cdGlmIChpc0xlZ2FjeUVkZ2UgfHwgIWNsaXBib2FyZERhdGEpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0bGV0IHRleHQgPSB0b1BsYWluVGV4dCA/IFwiXCIgOiBnZXRUZXh0Q29udGVudHNPZlJhbmdlKHJhbmdlKTtcblx0Y29uc3Qgc3RhcnRCbG9jayA9IGdldFN0YXJ0QmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0Y29uc3QgZW5kQmxvY2sgPSBnZXRFbmRCbG9ja09mUmFuZ2UocmFuZ2UsIHJvb3QpO1xuXHRsZXQgY29weVJvb3QgPSByb290O1xuXHRpZiAoc3RhcnRCbG9jayA9PT0gZW5kQmxvY2sgJiYgc3RhcnRCbG9jaz8uY29udGFpbnMocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIpKSB7XG5cdFx0Y29weVJvb3QgPSBzdGFydEJsb2NrO1xuXHR9XG5cdGxldCBjb250ZW50cztcblx0aWYgKHJlbW92ZVJhbmdlRnJvbURvY3VtZW50KSB7XG5cdFx0Y29udGVudHMgPSBkZWxldGVDb250ZW50c09mUmFuZ2UocmFuZ2UsIHJvb3QpO1xuXHR9IGVsc2Uge1xuXHRcdHJhbmdlID0gcmFuZ2UuY2xvbmVSYW5nZSgpO1xuXHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc1VwVHJlZShyYW5nZSwgY29weVJvb3QsIGNvcHlSb290LCByb290KTtcblx0XHRjb250ZW50cyA9IHJhbmdlLmNsb25lQ29udGVudHMoKTtcblx0fVxuXHRsZXQgcGFyZW50ID0gcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG5cdGlmIChwYXJlbnQgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG5cdH1cblx0d2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT09IGNvcHlSb290KSB7XG5cdFx0Y29uc3QgbmV3Q29udGVudHMgPSBwYXJlbnQuY2xvbmVOb2RlKGZhbHNlKTtcblx0XHRuZXdDb250ZW50cy5hcHBlbmRDaGlsZChjb250ZW50cyk7XG5cdFx0Y29udGVudHMgPSBuZXdDb250ZW50cztcblx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcblx0fVxuXHRsZXQgaHRtbDtcblx0aWYgKGNvbnRlbnRzLmNoaWxkTm9kZXMubGVuZ3RoID09PSAxICYmIGNvbnRlbnRzLmNoaWxkTm9kZXNbMF0gaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0dGV4dCA9IGNvbnRlbnRzLmNoaWxkTm9kZXNbMF0uZGF0YS5yZXBsYWNlKC/CoC9nLCBcIiBcIik7XG5cdFx0cGxhaW5UZXh0T25seSA9IHRydWU7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3Qgbm9kZSA9IGNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG5cdFx0bm9kZS5hcHBlbmRDaGlsZChjb250ZW50cyk7XG5cdFx0aHRtbCA9IG5vZGUuaW5uZXJIVE1MO1xuXHRcdGlmICh0b0NsZWFuSFRNTCkge1xuXHRcdFx0aHRtbCA9IHRvQ2xlYW5IVE1MKGh0bWwpO1xuXHRcdH1cblx0fVxuXHRpZiAodG9QbGFpblRleHQgJiYgaHRtbCAhPT0gdm9pZCAwKSB7XG5cdFx0dGV4dCA9IHRvUGxhaW5UZXh0KGh0bWwpO1xuXHR9XG5cdGlmIChpc1dpbikge1xuXHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCJcXHJcXG5cIik7XG5cdH1cblx0aWYgKCFwbGFpblRleHRPbmx5ICYmIGh0bWwgJiYgdGV4dCAhPT0gaHRtbCkge1xuXHRcdGNsaXBib2FyZERhdGEuc2V0RGF0YShcInRleHQvaHRtbFwiLCBodG1sKTtcblx0fVxuXHRjbGlwYm9hcmREYXRhLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHRleHQpO1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRyZXR1cm4gdHJ1ZTtcbn07XG52YXIgX29uQ3V0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdGNvbnN0IHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdGlmIChyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHJldHVybjtcblx0fVxuXHR0aGlzLnNhdmVVbmRvU3RhdGUocmFuZ2UpO1xuXHRjb25zdCBoYW5kbGVkID0gZXh0cmFjdFJhbmdlVG9DbGlwYm9hcmQoXG5cdFx0XHRldmVudCxcblx0XHRcdHJhbmdlLFxuXHRcdFx0cm9vdCxcblx0XHRcdHRydWUsXG5cdFx0XHR0aGlzLl9jb25maWcud2lsbEN1dENvcHksXG5cdFx0XHR0aGlzLl9jb25maWcudG9QbGFpblRleHQsXG5cdFx0XHRmYWxzZVxuXHQpO1xuXHRpZiAoIWhhbmRsZWQpIHtcblx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuX2Vuc3VyZUJvdHRvbUxpbmUoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5kaWRFcnJvcihlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSwgMCk7XG5cdH1cblx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xufTtcbnZhciBfb25Db3B5ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdGV4dHJhY3RSYW5nZVRvQ2xpcGJvYXJkKFxuXHRcdFx0ZXZlbnQsXG5cdFx0XHR0aGlzLmdldFNlbGVjdGlvbigpLFxuXHRcdFx0dGhpcy5fcm9vdCxcblx0XHRcdGZhbHNlLFxuXHRcdFx0dGhpcy5fY29uZmlnLndpbGxDdXRDb3B5LFxuXHRcdFx0dGhpcy5fY29uZmlnLnRvUGxhaW5UZXh0LFxuXHRcdFx0ZmFsc2Vcblx0KTtcbn07XG52YXIgX21vbml0b3JTaGlmdEtleSA9IGZ1bmN0aW9uIChldmVudCkge1xuXHR0aGlzLl9pc1NoaWZ0RG93biA9IGV2ZW50LnNoaWZ0S2V5O1xufTtcbnZhciBfb25QYXN0ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuXHRjb25zdCBjbGlwYm9hcmREYXRhID0gZXZlbnQuY2xpcGJvYXJkRGF0YTtcblx0Y29uc3QgaXRlbXMgPSBjbGlwYm9hcmREYXRhPy5pdGVtcztcblx0Y29uc3QgY2hvb3NlUGxhaW4gPSB0aGlzLl9pc1NoaWZ0RG93bjtcblx0bGV0IGhhc1JURiA9IGZhbHNlO1xuXHRsZXQgaGFzSW1hZ2UgPSBmYWxzZTtcblx0bGV0IHBsYWluSXRlbSA9IG51bGw7XG5cdGxldCBodG1sSXRlbSA9IG51bGw7XG5cdGlmIChpdGVtcykge1xuXHRcdGxldCBsID0gaXRlbXMubGVuZ3RoO1xuXHRcdHdoaWxlIChsLS0pIHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBpdGVtc1tsXTtcblx0XHRcdGNvbnN0IHR5cGUgPSBpdGVtLnR5cGU7XG5cdFx0XHRpZiAodHlwZSA9PT0gXCJ0ZXh0L2h0bWxcIikge1xuXHRcdFx0XHRodG1sSXRlbSA9IGl0ZW07XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGUgPT09IFwidGV4dC9wbGFpblwiIHx8IHR5cGUgPT09IFwidGV4dC91cmktbGlzdFwiKSB7XG5cdFx0XHRcdHBsYWluSXRlbSA9IGl0ZW07XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGUgPT09IFwidGV4dC9ydGZcIikge1xuXHRcdFx0XHRoYXNSVEYgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmICgvXmltYWdlXFwvLiovLnRlc3QodHlwZSkpIHtcblx0XHRcdFx0aGFzSW1hZ2UgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoaGFzSW1hZ2UgJiYgIShoYXNSVEYgJiYgaHRtbEl0ZW0pKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5maXJlRXZlbnQoXCJwYXN0ZUltYWdlXCIsIHtcblx0XHRcdFx0Y2xpcGJvYXJkRGF0YVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICghaXNMZWdhY3lFZGdlKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0aWYgKGh0bWxJdGVtICYmICghY2hvb3NlUGxhaW4gfHwgIXBsYWluSXRlbSkpIHtcblx0XHRcdFx0aHRtbEl0ZW0uZ2V0QXNTdHJpbmcoKGh0bWwpID0+IHtcblx0XHRcdFx0XHR0aGlzLmluc2VydEhUTUwoaHRtbCwgdHJ1ZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChwbGFpbkl0ZW0pIHtcblx0XHRcdFx0cGxhaW5JdGVtLmdldEFzU3RyaW5nKCh0ZXh0KSA9PiB7XG5cdFx0XHRcdFx0bGV0IGlzTGluayA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnN0IHJhbmdlMiA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRcdFx0aWYgKCFyYW5nZTIuY29sbGFwc2VkICYmIG5vdFdTLnRlc3QocmFuZ2UyLnRvU3RyaW5nKCkpKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IHRoaXMubGlua1JlZ0V4cC5leGVjKHRleHQpO1xuXHRcdFx0XHRcdFx0aXNMaW5rID0gISFtYXRjaCAmJiBtYXRjaFswXS5sZW5ndGggPT09IHRleHQubGVuZ3RoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoaXNMaW5rKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm1ha2VMaW5rKHRleHQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmluc2VydFBsYWluVGV4dCh0ZXh0LCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXHRjb25zdCB0eXBlcyA9IGNsaXBib2FyZERhdGE/LnR5cGVzO1xuXHRpZiAoIWlzTGVnYWN5RWRnZSAmJiB0eXBlcyAmJiAoaW5kZXhPZi5jYWxsKHR5cGVzLCBcInRleHQvaHRtbFwiKSA+IC0xIHx8ICFpc0dlY2tvICYmIGluZGV4T2YuY2FsbCh0eXBlcywgXCJ0ZXh0L3BsYWluXCIpID4gLTEgJiYgaW5kZXhPZi5jYWxsKHR5cGVzLCBcInRleHQvcnRmXCIpIDwgMCkpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGxldCBkYXRhO1xuXHRcdGlmICghY2hvb3NlUGxhaW4gJiYgKGRhdGEgPSBjbGlwYm9hcmREYXRhLmdldERhdGEoXCJ0ZXh0L2h0bWxcIikpKSB7XG5cdFx0XHR0aGlzLmluc2VydEhUTUwoZGF0YSwgdHJ1ZSk7XG5cdFx0fSBlbHNlIGlmICgoZGF0YSA9IGNsaXBib2FyZERhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIikpIHx8IChkYXRhID0gY2xpcGJvYXJkRGF0YS5nZXREYXRhKFwidGV4dC91cmktbGlzdFwiKSkpIHtcblx0XHRcdHRoaXMuaW5zZXJ0UGxhaW5UZXh0KGRhdGEsIHRydWUpO1xuXHRcdH1cblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cdGNvbnN0IHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0Y29uc3Qgc3RhcnRDb250YWluZXIgPSByYW5nZS5zdGFydENvbnRhaW5lcjtcblx0Y29uc3Qgc3RhcnRPZmZzZXQgPSByYW5nZS5zdGFydE9mZnNldDtcblx0Y29uc3QgZW5kQ29udGFpbmVyID0gcmFuZ2UuZW5kQ29udGFpbmVyO1xuXHRjb25zdCBlbmRPZmZzZXQgPSByYW5nZS5lbmRPZmZzZXQ7XG5cdGxldCBwYXN0ZUFyZWEgPSBjcmVhdGVFbGVtZW50KFwiRElWXCIsIHtcblx0XHRjb250ZW50ZWRpdGFibGU6IFwidHJ1ZVwiLFxuXHRcdHN0eWxlOiBcInBvc2l0aW9uOmZpeGVkOyBvdmVyZmxvdzpoaWRkZW47IHRvcDowOyByaWdodDoxMDAlOyB3aWR0aDoxcHg7IGhlaWdodDoxcHg7XCJcblx0fSk7XG5cdGJvZHkuYXBwZW5kQ2hpbGQocGFzdGVBcmVhKTtcblx0cmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKHBhc3RlQXJlYSk7XG5cdHRoaXMuc2V0U2VsZWN0aW9uKHJhbmdlKTtcblx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGxldCBodG1sID0gXCJcIjtcblx0XHRcdGxldCBuZXh0ID0gcGFzdGVBcmVhO1xuXHRcdFx0bGV0IGZpcnN0O1xuXHRcdFx0d2hpbGUgKHBhc3RlQXJlYSA9IG5leHQpIHtcblx0XHRcdFx0bmV4dCA9IHBhc3RlQXJlYS5uZXh0U2libGluZztcblx0XHRcdFx0ZGV0YWNoKHBhc3RlQXJlYSk7XG5cdFx0XHRcdGZpcnN0ID0gcGFzdGVBcmVhLmZpcnN0Q2hpbGQ7XG5cdFx0XHRcdGlmIChmaXJzdCAmJiBmaXJzdCA9PT0gcGFzdGVBcmVhLmxhc3RDaGlsZCAmJiBmaXJzdCBpbnN0YW5jZW9mIEhUTUxEaXZFbGVtZW50KSB7XG5cdFx0XHRcdFx0cGFzdGVBcmVhID0gZmlyc3Q7XG5cdFx0XHRcdH1cblx0XHRcdFx0aHRtbCArPSBwYXN0ZUFyZWEuaW5uZXJIVE1MO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5zZXRTZWxlY3Rpb24oXG5cdFx0XHRcdFx0Y3JlYXRlUmFuZ2UoXG5cdFx0XHRcdFx0XHRcdHN0YXJ0Q29udGFpbmVyLFxuXHRcdFx0XHRcdFx0XHRzdGFydE9mZnNldCxcblx0XHRcdFx0XHRcdFx0ZW5kQ29udGFpbmVyLFxuXHRcdFx0XHRcdFx0XHRlbmRPZmZzZXRcblx0XHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdFx0aWYgKGh0bWwpIHtcblx0XHRcdFx0dGhpcy5pbnNlcnRIVE1MKGh0bWwsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLl9jb25maWcuZGlkRXJyb3IoZXJyb3IpO1xuXHRcdH1cblx0fSwgMCk7XG59O1xudmFyIF9vbkRyb3AgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblx0aWYgKCFldmVudC5kYXRhVHJhbnNmZXIpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdHlwZXMgPSBldmVudC5kYXRhVHJhbnNmZXIudHlwZXM7XG5cdGxldCBsID0gdHlwZXMubGVuZ3RoO1xuXHRsZXQgaGFzUGxhaW4gPSBmYWxzZTtcblx0bGV0IGhhc0hUTUwgPSBmYWxzZTtcblx0d2hpbGUgKGwtLSkge1xuXHRcdHN3aXRjaCAodHlwZXNbbF0pIHtcblx0XHRcdGNhc2UgXCJ0ZXh0L3BsYWluXCI6XG5cdFx0XHRcdGhhc1BsYWluID0gdHJ1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwidGV4dC9odG1sXCI6XG5cdFx0XHRcdGhhc0hUTUwgPSB0cnVlO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblx0aWYgKGhhc0hUTUwgfHwgaGFzUGxhaW4gJiYgdGhpcy5zYXZlVW5kb1N0YXRlKSB7XG5cdFx0dGhpcy5zYXZlVW5kb1N0YXRlKCk7XG5cdH1cbn07XG5cbi8vIHNvdXJjZS9rZXlib2FyZC9FbnRlci50c1xudmFyIEVudGVyID0gKHNlbGYsIGV2ZW50LCByYW5nZSkgPT4ge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRzZWxmLnNwbGl0QmxvY2soZXZlbnQuc2hpZnRLZXksIHJhbmdlKTtcbn07XG5cbi8vIHNvdXJjZS9rZXlib2FyZC9LZXlIZWxwZXJzLnRzXG52YXIgYWZ0ZXJEZWxldGUgPSAoc2VsZiwgcmFuZ2UpID0+IHtcblx0dHJ5IHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHNlbGYuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGxldCBub2RlID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0aWYgKG5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdH1cblx0XHRsZXQgcGFyZW50ID0gbm9kZTtcblx0XHR3aGlsZSAoaXNJbmxpbmUocGFyZW50KSAmJiAoIXBhcmVudC50ZXh0Q29udGVudCB8fCBwYXJlbnQudGV4dENvbnRlbnQgPT09IFpXUykpIHtcblx0XHRcdG5vZGUgPSBwYXJlbnQ7XG5cdFx0XHRwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0fVxuXHRcdGlmIChub2RlICE9PSBwYXJlbnQpIHtcblx0XHRcdHJhbmdlLnNldFN0YXJ0KFxuXHRcdFx0XHRcdHBhcmVudCxcblx0XHRcdFx0XHRBcnJheS5mcm9tKHBhcmVudC5jaGlsZE5vZGVzKS5pbmRleE9mKG5vZGUpXG5cdFx0XHQpO1xuXHRcdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0XHRwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSk7XG5cdFx0XHRpZiAoIWlzQmxvY2socGFyZW50KSkge1xuXHRcdFx0XHRwYXJlbnQgPSBnZXRQcmV2aW91c0Jsb2NrKHBhcmVudCwgc2VsZi5fcm9vdCkgfHwgc2VsZi5fcm9vdDtcblx0XHRcdH1cblx0XHRcdGZpeEN1cnNvcihwYXJlbnQpO1xuXHRcdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHR9XG5cdFx0aWYgKG5vZGUgPT09IHNlbGYuX3Jvb3QgJiYgKG5vZGUgPSBub2RlLmZpcnN0Q2hpbGQpICYmIG5vZGUubm9kZU5hbWUgPT09IFwiQlJcIikge1xuXHRcdFx0ZGV0YWNoKG5vZGUpO1xuXHRcdH1cblx0XHRzZWxmLl9lbnN1cmVCb3R0b21MaW5lKCk7XG5cdFx0c2VsZi5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdHNlbGYuX3VwZGF0ZVBhdGgocmFuZ2UsIHRydWUpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHNlbGYuX2NvbmZpZy5kaWRFcnJvcihlcnJvcik7XG5cdH1cbn07XG52YXIgZGV0YWNoVW5lZGl0YWJsZU5vZGUgPSAobm9kZSwgcm9vdCkgPT4ge1xuXHRsZXQgcGFyZW50O1xuXHR3aGlsZSAocGFyZW50ID0gbm9kZS5wYXJlbnROb2RlKSB7XG5cdFx0aWYgKHBhcmVudCA9PT0gcm9vdCB8fCBwYXJlbnQuaXNDb250ZW50RWRpdGFibGUpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRub2RlID0gcGFyZW50O1xuXHR9XG5cdGRldGFjaChub2RlKTtcbn07XG52YXIgbGlua2lmeVRleHQgPSAoc2VsZiwgdGV4dE5vZGUsIG9mZnNldCkgPT4ge1xuXHRpZiAoZ2V0TmVhcmVzdCh0ZXh0Tm9kZSwgc2VsZi5fcm9vdCwgXCJBXCIpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IGRhdGEgPSB0ZXh0Tm9kZS5kYXRhIHx8IFwiXCI7XG5cdGNvbnN0IHNlYXJjaEZyb20gPSBNYXRoLm1heChcblx0XHRcdGRhdGEubGFzdEluZGV4T2YoXCIgXCIsIG9mZnNldCAtIDEpLFxuXHRcdFx0ZGF0YS5sYXN0SW5kZXhPZihcIlxceEEwXCIsIG9mZnNldCAtIDEpXG5cdCkgKyAxO1xuXHRjb25zdCBzZWFyY2hUZXh0ID0gZGF0YS5zbGljZShzZWFyY2hGcm9tLCBvZmZzZXQpO1xuXHRjb25zdCBtYXRjaCA9IHNlbGYubGlua1JlZ0V4cC5leGVjKHNlYXJjaFRleHQpO1xuXHRpZiAobWF0Y2gpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSBzZWxmLmdldFNlbGVjdGlvbigpO1xuXHRcdHNlbGYuX2RvY1dhc0NoYW5nZWQoKTtcblx0XHRzZWxmLl9yZWNvcmRVbmRvU3RhdGUoc2VsZWN0aW9uKTtcblx0XHRzZWxmLl9nZXRSYW5nZUFuZFJlbW92ZUJvb2ttYXJrKHNlbGVjdGlvbik7XG5cdFx0Y29uc3QgaW5kZXggPSBzZWFyY2hGcm9tICsgbWF0Y2guaW5kZXg7XG5cdFx0Y29uc3QgZW5kSW5kZXggPSBpbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblx0XHRjb25zdCBuZWVkc1NlbGVjdGlvblVwZGF0ZSA9IHNlbGVjdGlvbi5zdGFydENvbnRhaW5lciA9PT0gdGV4dE5vZGU7XG5cdFx0Y29uc3QgbmV3U2VsZWN0aW9uT2Zmc2V0ID0gc2VsZWN0aW9uLnN0YXJ0T2Zmc2V0IC0gZW5kSW5kZXg7XG5cdFx0aWYgKGluZGV4KSB7XG5cdFx0XHR0ZXh0Tm9kZSA9IHRleHROb2RlLnNwbGl0VGV4dChpbmRleCk7XG5cdFx0fVxuXHRcdGNvbnN0IGRlZmF1bHRBdHRyaWJ1dGVzID0gc2VsZi5fY29uZmlnLnRhZ0F0dHJpYnV0ZXMuYTtcblx0XHRjb25zdCBsaW5rID0gY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XCJBXCIsXG5cdFx0XHRcdE9iamVjdC5hc3NpZ24oXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGhyZWY6IG1hdGNoWzFdID8gL14oPzpodHxmKXRwcz86L2kudGVzdChtYXRjaFsxXSkgPyBtYXRjaFsxXSA6IFwiaHR0cDovL1wiICsgbWF0Y2hbMV0gOiBcIm1haWx0bzpcIiArIG1hdGNoWzBdXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ZGVmYXVsdEF0dHJpYnV0ZXNcblx0XHRcdFx0KVxuXHRcdCk7XG5cdFx0bGluay50ZXh0Q29udGVudCA9IGRhdGEuc2xpY2UoaW5kZXgsIGVuZEluZGV4KTtcblx0XHR0ZXh0Tm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShsaW5rLCB0ZXh0Tm9kZSk7XG5cdFx0dGV4dE5vZGUuZGF0YSA9IGRhdGEuc2xpY2UoZW5kSW5kZXgpO1xuXHRcdGlmIChuZWVkc1NlbGVjdGlvblVwZGF0ZSkge1xuXHRcdFx0c2VsZWN0aW9uLnNldFN0YXJ0KHRleHROb2RlLCBuZXdTZWxlY3Rpb25PZmZzZXQpO1xuXHRcdFx0c2VsZWN0aW9uLnNldEVuZCh0ZXh0Tm9kZSwgbmV3U2VsZWN0aW9uT2Zmc2V0KTtcblx0XHR9XG5cdFx0c2VsZi5zZXRTZWxlY3Rpb24oc2VsZWN0aW9uKTtcblx0fVxufTtcblxuLy8gc291cmNlL2tleWJvYXJkL0JhY2tzcGFjZS50c1xudmFyIEJhY2tzcGFjZSA9IChzZWxmLCBldmVudCwgcmFuZ2UpID0+IHtcblx0Y29uc3Qgcm9vdCA9IHNlbGYuX3Jvb3Q7XG5cdHNlbGYuX3JlbW92ZVpXUygpO1xuXHRzZWxmLnNhdmVVbmRvU3RhdGUocmFuZ2UpO1xuXHRpZiAoIXJhbmdlLmNvbGxhcHNlZCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZGVsZXRlQ29udGVudHNPZlJhbmdlKHJhbmdlLCByb290KTtcblx0XHRhZnRlckRlbGV0ZShzZWxmLCByYW5nZSk7XG5cdH0gZWxzZSBpZiAocmFuZ2VEb2VzU3RhcnRBdEJsb2NrQm91bmRhcnkocmFuZ2UsIHJvb3QpKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRjb25zdCBzdGFydEJsb2NrID0gZ2V0U3RhcnRCbG9ja09mUmFuZ2UocmFuZ2UsIHJvb3QpO1xuXHRcdGlmICghc3RhcnRCbG9jaykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRsZXQgY3VycmVudCA9IHN0YXJ0QmxvY2s7XG5cdFx0Zml4Q29udGFpbmVyKGN1cnJlbnQucGFyZW50Tm9kZSwgcm9vdCwgc2VsZi5fY29uZmlnKTtcblx0XHRjb25zdCBwcmV2aW91cyA9IGdldFByZXZpb3VzQmxvY2soY3VycmVudCwgcm9vdCk7XG5cdFx0aWYgKHByZXZpb3VzKSB7XG5cdFx0XHRpZiAoIXByZXZpb3VzLmlzQ29udGVudEVkaXRhYmxlKSB7XG5cdFx0XHRcdGRldGFjaFVuZWRpdGFibGVOb2RlKHByZXZpb3VzLCByb290KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0bWVyZ2VXaXRoQmxvY2socHJldmlvdXMsIGN1cnJlbnQsIHJhbmdlLCByb290KTtcblx0XHRcdGN1cnJlbnQgPSBwcmV2aW91cy5wYXJlbnROb2RlO1xuXHRcdFx0d2hpbGUgKGN1cnJlbnQgIT09IHJvb3QgJiYgIWN1cnJlbnQubmV4dFNpYmxpbmcpIHtcblx0XHRcdFx0Y3VycmVudCA9IGN1cnJlbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdGlmIChjdXJyZW50ICE9PSByb290ICYmIChjdXJyZW50ID0gY3VycmVudC5uZXh0U2libGluZykpIHtcblx0XHRcdFx0bWVyZ2VDb250YWluZXJzKGN1cnJlbnQsIHJvb3QsIHNlbGYuX2NvbmZpZyk7XG5cdFx0XHR9XG5cdFx0XHRzZWxmLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0fSBlbHNlIGlmIChjdXJyZW50KSB7XG5cdFx0XHRpZiAoZ2V0TmVhcmVzdChjdXJyZW50LCByb290LCBcIlVMXCIpIHx8IGdldE5lYXJlc3QoY3VycmVudCwgcm9vdCwgXCJPTFwiKSkge1xuXHRcdFx0XHRzZWxmLmRlY3JlYXNlTGlzdExldmVsKHJhbmdlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBlbHNlIGlmIChnZXROZWFyZXN0KGN1cnJlbnQsIHJvb3QsIFwiRElWXCIsIGluZGVudGVkTm9kZUF0dHJpYnV0ZXMpKSB7XG5cdFx0XHRcdHNlbGYucmVtb3ZlSW5kZW50YXRpb24ocmFuZ2UpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRzZWxmLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHRzZWxmLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHRjb25zdCB0ZXh0ID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gcmFuZ2Uuc3RhcnRPZmZzZXQ7XG5cdFx0Y29uc3QgYSA9IHRleHQucGFyZW50Tm9kZTtcblx0XHRpZiAodGV4dCBpbnN0YW5jZW9mIFRleHQgJiYgYSBpbnN0YW5jZW9mIEhUTUxBbmNob3JFbGVtZW50ICYmIG9mZnNldCAmJiBhLmhyZWYuaW5jbHVkZXModGV4dC5kYXRhKSkge1xuXHRcdFx0dGV4dC5kZWxldGVEYXRhKG9mZnNldCAtIDEsIDEpO1xuXHRcdFx0c2VsZi5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdFx0c2VsZi5yZW1vdmVMaW5rKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxmLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0YWZ0ZXJEZWxldGUoc2VsZik7XG5cdFx0XHR9LCAwKTtcblx0XHR9XG5cdH1cbn07XG5cbi8vIHNvdXJjZS9rZXlib2FyZC9EZWxldGUudHNcbnZhciBEZWxldGUgPSAoc2VsZiwgZXZlbnQsIHJhbmdlKSA9PiB7XG5cdGNvbnN0IHJvb3QgPSBzZWxmLl9yb290O1xuXHRsZXQgY3VycmVudDtcblx0bGV0IG5leHQ7XG5cdGxldCBvcmlnaW5hbFJhbmdlO1xuXHRsZXQgY3Vyc29yQ29udGFpbmVyO1xuXHRsZXQgY3Vyc29yT2Zmc2V0O1xuXHRsZXQgbm9kZUFmdGVyQ3Vyc29yO1xuXHRzZWxmLl9yZW1vdmVaV1MoKTtcblx0c2VsZi5zYXZlVW5kb1N0YXRlKHJhbmdlKTtcblx0aWYgKCFyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGRlbGV0ZUNvbnRlbnRzT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0YWZ0ZXJEZWxldGUoc2VsZiwgcmFuZ2UpO1xuXHR9IGVsc2UgaWYgKHJhbmdlRG9lc0VuZEF0QmxvY2tCb3VuZGFyeShyYW5nZSwgcm9vdCkpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGN1cnJlbnQgPSBnZXRTdGFydEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0aWYgKCFjdXJyZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGZpeENvbnRhaW5lcihjdXJyZW50LnBhcmVudE5vZGUsIHJvb3QsIHNlbGYuX2NvbmZpZyk7XG5cdFx0bmV4dCA9IGdldE5leHRCbG9jayhjdXJyZW50LCByb290KTtcblx0XHRpZiAobmV4dCkge1xuXHRcdFx0aWYgKCFuZXh0LmlzQ29udGVudEVkaXRhYmxlKSB7XG5cdFx0XHRcdGRldGFjaFVuZWRpdGFibGVOb2RlKG5leHQsIHJvb3QpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRtZXJnZVdpdGhCbG9jayhjdXJyZW50LCBuZXh0LCByYW5nZSwgcm9vdCk7XG5cdFx0XHRuZXh0ID0gY3VycmVudC5wYXJlbnROb2RlO1xuXHRcdFx0d2hpbGUgKG5leHQgIT09IHJvb3QgJiYgIW5leHQubmV4dFNpYmxpbmcpIHtcblx0XHRcdFx0bmV4dCA9IG5leHQucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdGlmIChuZXh0ICE9PSByb290ICYmIChuZXh0ID0gbmV4dC5uZXh0U2libGluZykpIHtcblx0XHRcdFx0bWVyZ2VDb250YWluZXJzKG5leHQsIHJvb3QsIHNlbGYuX2NvbmZpZyk7XG5cdFx0XHR9XG5cdFx0XHRzZWxmLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHRzZWxmLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0b3JpZ2luYWxSYW5nZSA9IHJhbmdlLmNsb25lUmFuZ2UoKTtcblx0XHRtb3ZlUmFuZ2VCb3VuZGFyaWVzVXBUcmVlKHJhbmdlLCByb290LCByb290LCByb290KTtcblx0XHRjdXJzb3JDb250YWluZXIgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdFx0Y3Vyc29yT2Zmc2V0ID0gcmFuZ2UuZW5kT2Zmc2V0O1xuXHRcdGlmIChjdXJzb3JDb250YWluZXIgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG5cdFx0XHRub2RlQWZ0ZXJDdXJzb3IgPSBjdXJzb3JDb250YWluZXIuY2hpbGROb2Rlc1tjdXJzb3JPZmZzZXRdO1xuXHRcdFx0aWYgKG5vZGVBZnRlckN1cnNvciAmJiBub2RlQWZ0ZXJDdXJzb3Iubm9kZU5hbWUgPT09IFwiSU1HXCIpIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0ZGV0YWNoKG5vZGVBZnRlckN1cnNvcik7XG5cdFx0XHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdFx0XHRcdGFmdGVyRGVsZXRlKHNlbGYsIHJhbmdlKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRzZWxmLnNldFNlbGVjdGlvbihvcmlnaW5hbFJhbmdlKTtcblx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGFmdGVyRGVsZXRlKHNlbGYpO1xuXHRcdH0sIDApO1xuXHR9XG59O1xuXG4vLyBzb3VyY2Uva2V5Ym9hcmQvVGFiLnRzXG52YXIgVGFiID0gKHNlbGYsIGV2ZW50LCByYW5nZSkgPT4ge1xuXHRjb25zdCByb290ID0gc2VsZi5fcm9vdDtcblx0c2VsZi5fcmVtb3ZlWldTKCk7XG5cdGlmIChyYW5nZS5jb2xsYXBzZWQgJiYgcmFuZ2VEb2VzU3RhcnRBdEJsb2NrQm91bmRhcnkocmFuZ2UsIHJvb3QpKSB7XG5cdFx0bGV0IG5vZGUgPSBnZXRTdGFydEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0bGV0IHBhcmVudDtcblx0XHR3aGlsZSAocGFyZW50ID0gbm9kZS5wYXJlbnROb2RlKSB7XG5cdFx0XHRpZiAocGFyZW50Lm5vZGVOYW1lID09PSBcIlVMXCIgfHwgcGFyZW50Lm5vZGVOYW1lID09PSBcIk9MXCIpIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0c2VsZi5pbmNyZWFzZUxpc3RMZXZlbChyYW5nZSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IHBhcmVudDtcblx0XHR9XG5cdH1cbn07XG52YXIgU2hpZnRUYWIgPSAoc2VsZiwgZXZlbnQsIHJhbmdlKSA9PiB7XG5cdGNvbnN0IHJvb3QgPSBzZWxmLl9yb290O1xuXHRzZWxmLl9yZW1vdmVaV1MoKTtcblx0aWYgKHJhbmdlLmNvbGxhcHNlZCAmJiByYW5nZURvZXNTdGFydEF0QmxvY2tCb3VuZGFyeShyYW5nZSwgcm9vdCkpIHtcblx0XHRjb25zdCBub2RlID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0aWYgKGdldE5lYXJlc3Qobm9kZSwgcm9vdCwgXCJVTFwiKSB8fCBnZXROZWFyZXN0KG5vZGUsIHJvb3QsIFwiT0xcIikpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmRlY3JlYXNlTGlzdExldmVsKHJhbmdlKTtcblx0XHR9XG5cdH1cbn07XG5cbi8vIHNvdXJjZS9rZXlib2FyZC9TcGFjZS50c1xudmFyIFNwYWNlID0gKHNlbGYsIGV2ZW50LCByYW5nZSkgPT4ge1xuXHRsZXQgbm9kZTtcblx0Y29uc3Qgcm9vdCA9IHNlbGYuX3Jvb3Q7XG5cdHNlbGYuX3JlY29yZFVuZG9TdGF0ZShyYW5nZSk7XG5cdHNlbGYuX2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsocmFuZ2UpO1xuXHRpZiAoIXJhbmdlLmNvbGxhcHNlZCkge1xuXHRcdGRlbGV0ZUNvbnRlbnRzT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0c2VsZi5fZW5zdXJlQm90dG9tTGluZSgpO1xuXHRcdHNlbGYuc2V0U2VsZWN0aW9uKHJhbmdlKTtcblx0XHRzZWxmLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0fSBlbHNlIGlmIChyYW5nZURvZXNFbmRBdEJsb2NrQm91bmRhcnkocmFuZ2UsIHJvb3QpKSB7XG5cdFx0Y29uc3QgYmxvY2sgPSBnZXRTdGFydEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0aWYgKGJsb2NrICYmIGJsb2NrLm5vZGVOYW1lICE9PSBcIlBSRVwiKSB7XG5cdFx0XHRjb25zdCB0ZXh0ID0gYmxvY2sudGV4dENvbnRlbnQ/LnRyaW1FbmQoKS5yZXBsYWNlKFpXUywgXCJcIik7XG5cdFx0XHRpZiAodGV4dCA9PT0gXCIqXCIgfHwgdGV4dCA9PT0gXCIxLlwiKSB7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHNlbGYuaW5zZXJ0UGxhaW5UZXh0KFwiIFwiLCBmYWxzZSk7XG5cdFx0XHRcdHNlbGYuX2RvY1dhc0NoYW5nZWQoKTtcblx0XHRcdFx0c2VsZi5zYXZlVW5kb1N0YXRlKHJhbmdlKTtcblx0XHRcdFx0Y29uc3Qgd2Fsa2VyID0gbmV3IFRyZWVJdGVyYXRvcihibG9jaywgU0hPV19URVhUKTtcblx0XHRcdFx0bGV0IHRleHROb2RlO1xuXHRcdFx0XHR3aGlsZSAodGV4dE5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0XHRcdGRldGFjaCh0ZXh0Tm9kZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRleHQgPT09IFwiKlwiKSB7XG5cdFx0XHRcdFx0c2VsZi5tYWtlVW5vcmRlcmVkTGlzdCgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlbGYubWFrZU9yZGVyZWRMaXN0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRub2RlID0gcmFuZ2UuZW5kQ29udGFpbmVyO1xuXHRpZiAocmFuZ2UuZW5kT2Zmc2V0ID09PSBnZXRMZW5ndGgobm9kZSkpIHtcblx0XHRkbyB7XG5cdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gXCJBXCIpIHtcblx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnRBZnRlcihub2RlKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoIW5vZGUubmV4dFNpYmxpbmcgJiYgKG5vZGUgPSBub2RlLnBhcmVudE5vZGUpICYmIG5vZGUgIT09IHJvb3QpO1xuXHR9XG5cdGlmIChzZWxmLl9jb25maWcuYWRkTGlua3MpIHtcblx0XHRjb25zdCBsaW5rUmFuZ2UgPSByYW5nZS5jbG9uZVJhbmdlKCk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKGxpbmtSYW5nZSk7XG5cdFx0Y29uc3QgdGV4dE5vZGUgPSBsaW5rUmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gbGlua1JhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0bGlua2lmeVRleHQoc2VsZiwgdGV4dE5vZGUsIG9mZnNldCk7XG5cdFx0fSwgMCk7XG5cdH1cblx0c2VsZi5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xufTtcblxuLy8gc291cmNlL2tleWJvYXJkL0tleUhhbmRsZXJzLnRzXG52YXIgX29uS2V5ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkIHx8IGV2ZW50LmlzQ29tcG9zaW5nKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdC8vIHR1dGFvOiB3ZSBuZWVkIHRvIGxvd2VyY2FzZSB0aGUgbGFzdCBsZXR0ZXIgaW4gY2FzZSB0aGUga2V5IGNvbWJvIGNvbnRhaW5zIFwiU2hpZnRcIiBhcyBpdCB3aWxsIGJlIHNldCBhcyB1cHBlcmNhc2UgbGV0dGVyXG5cdC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFzdG1haWwvU3F1aXJlL2lzc3Vlcy80NTdcblx0bGV0IGtleSA9IGV2ZW50LmtleTtcblx0Y29uc3QgbGFzdENoYXJhY3RlckluZGV4ID0ga2V5Lmxlbmd0aCAtIDFcblx0Y29uc3QgbGFzdENoYXJhY3RlciA9IGtleS5jaGFyQXQobGFzdENoYXJhY3RlckluZGV4KVxuXHRrZXkgPSBrZXkuc3Vic3RyaW5nKDAsIGxhc3RDaGFyYWN0ZXJJbmRleCkgKyBsYXN0Q2hhcmFjdGVyLnRvTG93ZXJDYXNlKClcblxuXHRsZXQgbW9kaWZpZXJzID0gXCJcIjtcblx0aWYgKGtleSAhPT0gXCJCYWNrc3BhY2VcIiAmJiBrZXkgIT09IFwiRGVsZXRlXCIpIHtcblx0XHRpZiAoZXZlbnQuYWx0S2V5KSB7XG5cdFx0XHRtb2RpZmllcnMgKz0gXCJBbHQtXCI7XG5cdFx0fVxuXHRcdGlmIChldmVudC5jdHJsS2V5KSB7XG5cdFx0XHRtb2RpZmllcnMgKz0gXCJDdHJsLVwiO1xuXHRcdH1cblx0XHRpZiAoZXZlbnQubWV0YUtleSkge1xuXHRcdFx0bW9kaWZpZXJzICs9IFwiTWV0YS1cIjtcblx0XHR9XG5cdFx0aWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG5cdFx0XHRtb2RpZmllcnMgKz0gXCJTaGlmdC1cIjtcblx0XHR9XG5cdH1cblx0aWYgKGlzV2luICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGtleSA9PT0gXCJEZWxldGVcIikge1xuXHRcdG1vZGlmaWVycyArPSBcIlNoaWZ0LVwiO1xuXHR9XG5cdGtleSA9IG1vZGlmaWVycyArIGtleTtcblx0Y29uc3QgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRpZiAodGhpcy5fa2V5SGFuZGxlcnNba2V5XSkge1xuXHRcdHRoaXMuX2tleUhhbmRsZXJzW2tleV0odGhpcywgZXZlbnQsIHJhbmdlKTtcblx0fSBlbHNlIGlmICghcmFuZ2UuY29sbGFwc2VkICYmICFldmVudC5jdHJsS2V5ICYmICFldmVudC5tZXRhS2V5ICYmIGtleS5sZW5ndGggPT09IDEpIHtcblx0XHR0aGlzLnNhdmVVbmRvU3RhdGUocmFuZ2UpO1xuXHRcdGRlbGV0ZUNvbnRlbnRzT2ZSYW5nZShyYW5nZSwgdGhpcy5fcm9vdCk7XG5cdFx0dGhpcy5fZW5zdXJlQm90dG9tTGluZSgpO1xuXHRcdHRoaXMuc2V0U2VsZWN0aW9uKHJhbmdlKTtcblx0XHR0aGlzLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0fVxufTtcbnZhciBrZXlIYW5kbGVycyA9IHtcblx0XCJCYWNrc3BhY2VcIjogQmFja3NwYWNlLFxuXHRcIkRlbGV0ZVwiOiBEZWxldGUsXG5cdFwiVGFiXCI6IFRhYixcblx0XCJTaGlmdC1UYWJcIjogU2hpZnRUYWIsXG5cdFwiIFwiOiBTcGFjZSxcblx0XCJBcnJvd0xlZnRcIihzZWxmKSB7XG5cdFx0c2VsZi5fcmVtb3ZlWldTKCk7XG5cdH0sXG5cdFwiQXJyb3dSaWdodFwiKHNlbGYsIGV2ZW50LCByYW5nZSkge1xuXHRcdHNlbGYuX3JlbW92ZVpXUygpO1xuXHRcdGNvbnN0IHJvb3QgPSBzZWxmLmdldFJvb3QoKTtcblx0XHRpZiAocmFuZ2VEb2VzRW5kQXRCbG9ja0JvdW5kYXJ5KHJhbmdlLCByb290KSkge1xuXHRcdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHRcdGxldCBub2RlID0gcmFuZ2UuZW5kQ29udGFpbmVyO1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gXCJDT0RFXCIpIHtcblx0XHRcdFx0XHRsZXQgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG5cdFx0XHRcdFx0aWYgKCEobmV4dCBpbnN0YW5jZW9mIFRleHQpKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB0ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXFx4QTBcIik7XG5cdFx0XHRcdFx0XHRub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHROb2RlLCBuZXh0KTtcblx0XHRcdFx0XHRcdG5leHQgPSB0ZXh0Tm9kZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnQobmV4dCwgMSk7XG5cdFx0XHRcdFx0c2VsZi5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKCFub2RlLm5leHRTaWJsaW5nICYmIChub2RlID0gbm9kZS5wYXJlbnROb2RlKSAmJiBub2RlICE9PSByb290KTtcblx0XHR9XG5cdH1cbn07XG5pZiAoIXN1cHBvcnRzSW5wdXRFdmVudHMpIHtcblx0a2V5SGFuZGxlcnMuRW50ZXIgPSBFbnRlcjtcblx0a2V5SGFuZGxlcnNbXCJTaGlmdC1FbnRlclwiXSA9IEVudGVyO1xufVxuaWYgKCFpc01hYyAmJiAhaXNJT1MpIHtcblx0a2V5SGFuZGxlcnMuUGFnZVVwID0gKHNlbGYpID0+IHtcblx0XHRzZWxmLm1vdmVDdXJzb3JUb1N0YXJ0KCk7XG5cdH07XG5cdGtleUhhbmRsZXJzLlBhZ2VEb3duID0gKHNlbGYpID0+IHtcblx0XHRzZWxmLm1vdmVDdXJzb3JUb0VuZCgpO1xuXHR9O1xufVxudmFyIG1hcEtleVRvRm9ybWF0ID0gKHRhZywgcmVtb3ZlKSA9PiB7XG5cdHJlbW92ZSA9IHJlbW92ZSB8fCBudWxsO1xuXHRyZXR1cm4gKHNlbGYsIGV2ZW50KSA9PiB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRjb25zdCByYW5nZSA9IHNlbGYuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0aWYgKHNlbGYuaGFzRm9ybWF0KHRhZywgbnVsbCwgcmFuZ2UpKSB7XG5cdFx0XHRzZWxmLmNoYW5nZUZvcm1hdChudWxsLCB7dGFnfSwgcmFuZ2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxmLmNoYW5nZUZvcm1hdCh7dGFnfSwgcmVtb3ZlLCByYW5nZSk7XG5cdFx0fVxuXHR9O1xufTtcbmtleUhhbmRsZXJzW2N0cmxLZXkgKyBcImJcIl0gPSBtYXBLZXlUb0Zvcm1hdChcIkJcIik7XG5rZXlIYW5kbGVyc1tjdHJsS2V5ICsgXCJpXCJdID0gbWFwS2V5VG9Gb3JtYXQoXCJJXCIpO1xua2V5SGFuZGxlcnNbY3RybEtleSArIFwidVwiXSA9IG1hcEtleVRvRm9ybWF0KFwiVVwiKTtcbmtleUhhbmRsZXJzW2N0cmxLZXkgKyBcIlNoaWZ0LTdcIl0gPSBtYXBLZXlUb0Zvcm1hdChcIlNcIik7XG5rZXlIYW5kbGVyc1tjdHJsS2V5ICsgXCJTaGlmdC01XCJdID0gbWFwS2V5VG9Gb3JtYXQoXCJTVUJcIiwge3RhZzogXCJTVVBcIn0pO1xua2V5SGFuZGxlcnNbY3RybEtleSArIFwiU2hpZnQtNlwiXSA9IG1hcEtleVRvRm9ybWF0KFwiU1VQXCIsIHt0YWc6IFwiU1VCXCJ9KTtcbmtleUhhbmRsZXJzW2N0cmxLZXkgKyBcIlNoaWZ0LThcIl0gPSAoc2VsZiwgZXZlbnQpID0+IHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0Y29uc3QgcGF0aCA9IHNlbGYuZ2V0UGF0aCgpO1xuXHRpZiAoIS8oPzpefD4pVUwvLnRlc3QocGF0aCkpIHtcblx0XHRzZWxmLm1ha2VVbm9yZGVyZWRMaXN0KCk7XG5cdH0gZWxzZSB7XG5cdFx0c2VsZi5yZW1vdmVMaXN0KCk7XG5cdH1cbn07XG5rZXlIYW5kbGVyc1tjdHJsS2V5ICsgXCJTaGlmdC05XCJdID0gKHNlbGYsIGV2ZW50KSA9PiB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdGNvbnN0IHBhdGggPSBzZWxmLmdldFBhdGgoKTtcblx0aWYgKCEvKD86Xnw+KU9MLy50ZXN0KHBhdGgpKSB7XG5cdFx0c2VsZi5tYWtlT3JkZXJlZExpc3QoKTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLnJlbW92ZUxpc3QoKTtcblx0fVxufTtcbmtleUhhbmRsZXJzW2N0cmxLZXkgKyBcIltcIl0gPSAoc2VsZiwgZXZlbnQpID0+IHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0Y29uc3QgcGF0aCA9IHNlbGYuZ2V0UGF0aCgpO1xuXHRpZiAoLyg/Ol58PilbT1VdTC8udGVzdChwYXRoKSkge1xuXHRcdHNlbGYuZGVjcmVhc2VMaXN0TGV2ZWwoKTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLmRlY3JlYXNlSW5kZW50YXRpb25MZXZlbCgpO1xuXHR9XG59O1xua2V5SGFuZGxlcnNbY3RybEtleSArIFwiXVwiXSA9IChzZWxmLCBldmVudCkgPT4ge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRjb25zdCBwYXRoID0gc2VsZi5nZXRQYXRoKCk7XG5cdGlmICgvKD86Xnw+KVtPVV1MLy50ZXN0KHBhdGgpKSB7XG5cdFx0c2VsZi5pbmNyZWFzZUxpc3RMZXZlbCgpO1xuXHR9IGVsc2Uge1xuXHRcdHNlbGYuaW5jcmVhc2VJbmRlbnRhdGlvbkxldmVsKCk7XG5cdH1cbn07XG5rZXlIYW5kbGVyc1tjdHJsS2V5ICsgXCJkXCJdID0gKHNlbGYsIGV2ZW50KSA9PiB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdHNlbGYudG9nZ2xlQ29kZSgpO1xufTtcbmtleUhhbmRsZXJzW2N0cmxLZXkgKyBcInpcIl0gPSAoc2VsZiwgZXZlbnQpID0+IHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0c2VsZi51bmRvKCk7XG59O1xua2V5SGFuZGxlcnNbY3RybEtleSArIFwieVwiXSA9IGtleUhhbmRsZXJzW2N0cmxLZXkgKyBcIlNoaWZ0LXpcIl0gPSAoc2VsZiwgZXZlbnQpID0+IHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0c2VsZi5yZWRvKCk7XG59O1xuXG4vLyBzb3VyY2UvRWRpdG9yLnRzXG52YXIgU3F1aXJlID0gY2xhc3Mge1xuXHRjb25zdHJ1Y3Rvcihyb290LCBjb25maWcpIHtcblx0XHQvKipcblx0XHQgKiBTdWJzY3JpYmluZyB0byB0aGVzZSBldmVudHMgd29uJ3QgYXV0b21hdGljYWxseSBhZGQgYSBsaXN0ZW5lciB0byB0aGVcblx0XHQgKiBkb2N1bWVudCBub2RlLCBzaW5jZSB0aGVzZSBldmVudHMgYXJlIGZpcmVkIGluIGEgY3VzdG9tIG1hbm5lciBieSB0aGVcblx0XHQgKiBlZGl0b3IgY29kZS5cblx0XHQgKi9cblx0XHR0aGlzLmN1c3RvbUV2ZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KFtcblx0XHRcdFwicGF0aENoYW5nZVwiLFxuXHRcdFx0XCJzZWxlY3RcIixcblx0XHRcdFwiaW5wdXRcIixcblx0XHRcdFwicGFzdGVJbWFnZVwiLFxuXHRcdFx0XCJ1bmRvU3RhdGVDaGFuZ2VcIlxuXHRcdF0pO1xuXHRcdC8vIC0tLVxuXHRcdHRoaXMuc3RhcnRTZWxlY3Rpb25JZCA9IFwic3F1aXJlLXNlbGVjdGlvbi1zdGFydFwiO1xuXHRcdHRoaXMuZW5kU2VsZWN0aW9uSWQgPSBcInNxdWlyZS1zZWxlY3Rpb24tZW5kXCI7XG5cdFx0LypcbiAgICBsaW5rUmVnRXhwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgLy8gT25seSBsb29rIG9uIGJvdW5kYXJpZXNcbiAgICAgICAgJ1xcXFxiKD86JyArXG4gICAgICAgIC8vIENhcHR1cmUgZ3JvdXAgMTogVVJMc1xuICAgICAgICAnKCcgK1xuICAgICAgICAgICAgLy8gQWRkIGxpbmtzIHRvIFVSTFNcbiAgICAgICAgICAgIC8vIFN0YXJ0cyB3aXRoOlxuICAgICAgICAgICAgJyg/OicgK1xuICAgICAgICAgICAgICAgIC8vIGh0dHAocyk6Ly8gb3IgZnRwOi8vXG4gICAgICAgICAgICAgICAgJyg/Omh0fGYpdHBzPzpcXFxcL1xcXFwvJyArXG4gICAgICAgICAgICAgICAgLy8gb3JcbiAgICAgICAgICAgICAgICAnfCcgK1xuICAgICAgICAgICAgICAgIC8vIHd3dy5cbiAgICAgICAgICAgICAgICAnd3d3XFxcXGR7MCwzfVsuXScgK1xuICAgICAgICAgICAgICAgIC8vIG9yXG4gICAgICAgICAgICAgICAgJ3wnICtcbiAgICAgICAgICAgICAgICAvLyBmb285MC5jb20vXG4gICAgICAgICAgICAgICAgJ1thLXowLTldW2EtejAtOS5cXFxcLV0qWy5dW2Etel17Mix9XFxcXC8nICtcbiAgICAgICAgICAgICcpJyArXG4gICAgICAgICAgICAvLyBUaGVuIHdlIGdldCBvbmUgb3IgbW9yZTpcbiAgICAgICAgICAgICcoPzonICtcbiAgICAgICAgICAgICAgICAvLyBSdW4gb2Ygbm9uLXNwYWNlcywgbm9uICgpPD5cbiAgICAgICAgICAgICAgICAnW15cXFxccygpPD5dKycgK1xuICAgICAgICAgICAgICAgIC8vIG9yXG4gICAgICAgICAgICAgICAgJ3wnICtcbiAgICAgICAgICAgICAgICAvLyBiYWxhbmNlZCBwYXJlbnRoZXNlcyAob25lIGxldmVsIGRlZXAgb25seSlcbiAgICAgICAgICAgICAgICAnXFxcXChbXlxcXFxzKCk8Pl0rXFxcXCknICtcbiAgICAgICAgICAgICcpKycgK1xuICAgICAgICAgICAgLy8gQW5kIHdlIGZpbmlzaCB3aXRoXG4gICAgICAgICAgICAnKD86JyArXG4gICAgICAgICAgICAgICAgLy8gTm90IGEgc3BhY2Ugb3IgcHVuY3R1YXRpb24gY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgJ1teXFxcXHM/JmAhKClcXFxcW1xcXFxde307OlxcJ1wiLiw8PsKrwrvigJzigJ3igJjigJldJyArXG4gICAgICAgICAgICAgICAgLy8gb3JcbiAgICAgICAgICAgICAgICAnfCcgK1xuICAgICAgICAgICAgICAgIC8vIEJhbGFuY2VkIHBhcmVudGhlc2VzLlxuICAgICAgICAgICAgICAgICdcXFxcKFteXFxcXHMoKTw+XStcXFxcKScgK1xuICAgICAgICAgICAgJyknICtcbiAgICAgICAgLy8gQ2FwdHVyZSBncm91cCAyOiBFbWFpbHNcbiAgICAgICAgJyl8KCcgK1xuICAgICAgICAgICAgLy8gQWRkIGxpbmtzIHRvIGVtYWlsc1xuICAgICAgICAgICAgJ1tcXFxcd1xcXFwtLiUrXStAKD86W1xcXFx3XFxcXC1dK1xcXFwuKStbYS16XXsyLH1cXFxcYicgK1xuICAgICAgICAgICAgLy8gQWxsb3cgcXVlcnkgcGFyYW1ldGVycyBpbiB0aGUgbWFpbHRvOiBzdHlsZVxuICAgICAgICAgICAgJyg/OicgK1xuICAgICAgICAgICAgICAgICdbP11bXiY/XFxcXHNdKz1bXlxcXFxzPyZgISgpXFxcXFtcXFxcXXt9OzpcXCdcIi4sPD7Cq8K74oCc4oCd4oCY4oCZXSsnICtcbiAgICAgICAgICAgICAgICAnKD86JlteJj9cXFxcc10rPVteXFxcXHM/JmAhKClcXFxcW1xcXFxde307OlxcJ1wiLiw8PsKrwrvigJzigJ3igJjigJldKykqJyArXG4gICAgICAgICAgICAnKT8nICtcbiAgICAgICAgJykpJyxcbiAgICAgICAgJ2knXG4gICAgKTtcbiAgICAqL1xuXHRcdHRoaXMubGlua1JlZ0V4cCA9IC9cXGIoPzooKD86KD86aHR8Zil0cHM/OlxcL1xcL3x3d3dcXGR7MCwzfVsuXXxbYS16MC05XVthLXowLTkuXFwtXSpbLl1bYS16XXsyLH1cXC8pKD86W15cXHMoKTw+XSt8XFwoW15cXHMoKTw+XStcXCkpKyg/OlteXFxzPyZgISgpXFxbXFxde307OidcIi4sPD7Cq8K74oCc4oCd4oCY4oCZXXxcXChbXlxccygpPD5dK1xcKSkpfChbXFx3XFwtLiUrXStAKD86W1xcd1xcLV0rXFwuKStbYS16XXsyLH1cXGIoPzpbP11bXiY/XFxzXSs9W15cXHM/JmAhKClcXFtcXF17fTs6J1wiLiw8PsKrwrvigJzigJ3igJjigJldKyg/OiZbXiY/XFxzXSs9W15cXHM/JmAhKClcXFtcXF17fTs6J1wiLiw8PsKrwrvigJzigJ3igJjigJldKykqKT8pKS9pO1xuXHRcdHRoaXMudGFnQWZ0ZXJTcGxpdCA9IHtcblx0XHRcdERUOiBcIkREXCIsXG5cdFx0XHRERDogXCJEVFwiLFxuXHRcdFx0TEk6IFwiTElcIixcblx0XHRcdFBSRTogXCJQUkVcIlxuXHRcdH07XG5cdFx0dGhpcy5fcm9vdCA9IHJvb3Q7XG5cdFx0dGhpcy5fY29uZmlnID0gdGhpcy5fbWFrZUNvbmZpZyhjb25maWcpO1xuXHRcdHRoaXMuX2lzRm9jdXNlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX2xhc3RTZWxlY3Rpb24gPSBjcmVhdGVSYW5nZShyb290LCAwKTtcblx0XHR0aGlzLl93aWxsUmVzdG9yZVNlbGVjdGlvbiA9IGZhbHNlO1xuXHRcdHRoaXMuX21heUhhdmVaV1MgPSBmYWxzZTtcblx0XHR0aGlzLl9sYXN0QW5jaG9yTm9kZSA9IG51bGw7XG5cdFx0dGhpcy5fbGFzdEZvY3VzTm9kZSA9IG51bGw7XG5cdFx0dGhpcy5fcGF0aCA9IFwiXCI7XG5cdFx0dGhpcy5fZXZlbnRzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcblx0XHR0aGlzLl91bmRvSW5kZXggPSAtMTtcblx0XHR0aGlzLl91bmRvU3RhY2sgPSBbXTtcblx0XHR0aGlzLl91bmRvU3RhY2tMZW5ndGggPSAwO1xuXHRcdHRoaXMuX2lzSW5VbmRvU3RhdGUgPSBmYWxzZTtcblx0XHR0aGlzLl9pZ25vcmVDaGFuZ2UgPSBmYWxzZTtcblx0XHR0aGlzLl9pZ25vcmVBbGxDaGFuZ2VzID0gZmFsc2U7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0aW9uY2hhbmdlXCIsIHRoaXMuX3VwZGF0ZVBhdGhPbkV2ZW50KTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIHRoaXMuX2VuYWJsZVJlc3RvcmVTZWxlY3Rpb24pO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLl9kaXNhYmxlUmVzdG9yZVNlbGVjdGlvbik7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLl9kaXNhYmxlUmVzdG9yZVNlbGVjdGlvbik7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgdGhpcy5fcmVzdG9yZVNlbGVjdGlvbik7XG5cdFx0dGhpcy5faXNTaGlmdERvd24gPSBmYWxzZTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJjdXRcIiwgX29uQ3V0KTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb3B5XCIsIF9vbkNvcHkpO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIF9vblBhc3RlKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIF9vbkRyb3ApO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0XCJrZXlkb3duXCIsXG5cdFx0XHRcdF9tb25pdG9yU2hpZnRLZXlcblx0XHQpO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIF9tb25pdG9yU2hpZnRLZXkpO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgX29uS2V5KTtcblx0XHR0aGlzLl9rZXlIYW5kbGVycyA9IE9iamVjdC5jcmVhdGUoa2V5SGFuZGxlcnMpO1xuXHRcdGNvbnN0IG11dGF0aW9uID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gdGhpcy5fZG9jV2FzQ2hhbmdlZCgpKTtcblx0XHRtdXRhdGlvbi5vYnNlcnZlKHJvb3QsIHtcblx0XHRcdGNoaWxkTGlzdDogdHJ1ZSxcblx0XHRcdGF0dHJpYnV0ZXM6IHRydWUsXG5cdFx0XHRjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuXHRcdFx0c3VidHJlZTogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuX211dGF0aW9uID0gbXV0YXRpb247XG5cdFx0cm9vdC5zZXRBdHRyaWJ1dGUoXCJjb250ZW50ZWRpdGFibGVcIiwgXCJ0cnVlXCIpO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcblx0XHRcdFx0XCJiZWZvcmVpbnB1dFwiLFxuXHRcdFx0XHR0aGlzLl9iZWZvcmVJbnB1dFxuXHRcdCk7XG5cdFx0dGhpcy5zZXRIVE1MKFwiXCIpO1xuXHR9XG5cblx0ZGVzdHJveSgpIHtcblx0XHR0aGlzLl9ldmVudHMuZm9yRWFjaCgoXywgdHlwZSkgPT4ge1xuXHRcdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUpO1xuXHRcdH0pO1xuXHRcdHRoaXMuX211dGF0aW9uLmRpc2Nvbm5lY3QoKTtcblx0XHR0aGlzLl91bmRvSW5kZXggPSAtMTtcblx0XHR0aGlzLl91bmRvU3RhY2sgPSBbXTtcblx0XHR0aGlzLl91bmRvU3RhY2tMZW5ndGggPSAwO1xuXHR9XG5cblx0X21ha2VDb25maWcodXNlckNvbmZpZykge1xuXHRcdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRcdGJsb2NrVGFnOiBcIkRJVlwiLFxuXHRcdFx0YmxvY2tBdHRyaWJ1dGVzOiBudWxsLFxuXHRcdFx0dGFnQXR0cmlidXRlczoge30sXG5cdFx0XHRjbGFzc05hbWVzOiB7XG5cdFx0XHRcdGNvbG9yOiBcImNvbG9yXCIsXG5cdFx0XHRcdGZvbnRGYW1pbHk6IFwiZm9udFwiLFxuXHRcdFx0XHRmb250U2l6ZTogXCJzaXplXCIsXG5cdFx0XHRcdGhpZ2hsaWdodDogXCJoaWdobGlnaHRcIlxuXHRcdFx0fSxcblx0XHRcdHVuZG86IHtcblx0XHRcdFx0ZG9jdW1lbnRTaXplVGhyZXNob2xkOiAtMSxcblx0XHRcdFx0Ly8gLTEgbWVhbnMgbm8gdGhyZXNob2xkXG5cdFx0XHRcdHVuZG9MaW1pdDogLTFcblx0XHRcdFx0Ly8gLTEgbWVhbnMgbm8gbGltaXRcblx0XHRcdH0sXG5cdFx0XHRhZGRMaW5rczogdHJ1ZSxcblx0XHRcdHdpbGxDdXRDb3B5OiBudWxsLFxuXHRcdFx0dG9QbGFpblRleHQ6IG51bGwsXG5cdFx0XHRzYW5pdGl6ZVRvRE9NRnJhZ21lbnQ6IChodG1sKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZyYWcgPSBET01QdXJpZnkuc2FuaXRpemUoaHRtbCwge1xuXHRcdFx0XHRcdEFMTE9XX1VOS05PV05fUFJPVE9DT0xTOiB0cnVlLFxuXHRcdFx0XHRcdFdIT0xFX0RPQ1VNRU5UOiBmYWxzZSxcblx0XHRcdFx0XHRSRVRVUk5fRE9NOiB0cnVlLFxuXHRcdFx0XHRcdFJFVFVSTl9ET01fRlJBR01FTlQ6IHRydWUsXG5cdFx0XHRcdFx0Rk9SQ0VfQk9EWTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBmcmFnID8gZG9jdW1lbnQuaW1wb3J0Tm9kZShmcmFnLCB0cnVlKSA6IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdH0sXG5cdFx0XHRkaWRFcnJvcjogKGVycm9yKSA9PiBjb25zb2xlLmxvZyhlcnJvcilcblx0XHR9O1xuXHRcdGlmICh1c2VyQ29uZmlnKSB7XG5cdFx0XHRPYmplY3QuYXNzaWduKGNvbmZpZywgdXNlckNvbmZpZyk7XG5cdFx0XHRjb25maWcuYmxvY2tUYWcgPSBjb25maWcuYmxvY2tUYWcudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNvbmZpZztcblx0fVxuXG5cdHNldEtleUhhbmRsZXIoa2V5LCBmbikge1xuXHRcdHRoaXMuX2tleUhhbmRsZXJzW2tleV0gPSBmbjtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdF9iZWZvcmVJbnB1dChldmVudCkge1xuXHRcdHN3aXRjaCAoZXZlbnQuaW5wdXRUeXBlKSB7XG5cdFx0XHRjYXNlIFwiaW5zZXJ0TGluZUJyZWFrXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMuc3BsaXRCbG9jayh0cnVlKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW5zZXJ0UGFyYWdyYXBoXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMuc3BsaXRCbG9jayhmYWxzZSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImluc2VydE9yZGVyZWRMaXN0XCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMubWFrZU9yZGVyZWRMaXN0KCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImluc2VydFVub2RlcmVkTGlzdFwiOlxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR0aGlzLm1ha2VVbm9yZGVyZWRMaXN0KCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImhpc3RvcnlVbmRvXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMudW5kbygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJoaXN0b3J5UmVkb1wiOlxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR0aGlzLnJlZG8oKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiZm9ybWF0Qm9sZFwiOlxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR0aGlzLmJvbGQoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiZm9ybWFJdGFsaWNcIjpcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0dGhpcy5pdGFsaWMoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiZm9ybWF0VW5kZXJsaW5lXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMudW5kZXJsaW5lKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImZvcm1hdFN0cmlrZVRocm91Z2hcIjpcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0dGhpcy5zdHJpa2V0aHJvdWdoKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImZvcm1hdFN1cGVyc2NyaXB0XCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMuc3VwZXJzY3JpcHQoKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiZm9ybWF0U3Vic2NyaXB0XCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0KCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImZvcm1hdEp1c3RpZnlGdWxsXCI6XG5cdFx0XHRjYXNlIFwiZm9ybWF0SnVzdGlmeUNlbnRlclwiOlxuXHRcdFx0Y2FzZSBcImZvcm1hdEp1c3RpZnlSaWdodFwiOlxuXHRcdFx0Y2FzZSBcImZvcm1hdEp1c3RpZnlMZWZ0XCI6IHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0bGV0IGFsaWdubWVudCA9IGV2ZW50LmlucHV0VHlwZS5zbGljZSgxMykudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0aWYgKGFsaWdubWVudCA9PT0gXCJmdWxsXCIpIHtcblx0XHRcdFx0XHRhbGlnbm1lbnQgPSBcImp1c3RpZnlcIjtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnNldFRleHRBbGlnbm1lbnQoYWxpZ25tZW50KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjYXNlIFwiZm9ybWF0UmVtb3ZlXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlQWxsRm9ybWF0dGluZygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJmb3JtYXRTZXRCbG9ja1RleHREaXJlY3Rpb25cIjoge1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRsZXQgZGlyID0gZXZlbnQuZGF0YTtcblx0XHRcdFx0aWYgKGRpciA9PT0gXCJudWxsXCIpIHtcblx0XHRcdFx0XHRkaXIgPSBudWxsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuc2V0VGV4dERpcmVjdGlvbihkaXIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGNhc2UgXCJmb3JtYXRCYWNrQ29sb3JcIjpcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0dGhpcy5zZXRIaWdobGlnaHRDb2xvcihldmVudC5kYXRhKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiZm9ybWF0Rm9udENvbG9yXCI6XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdHRoaXMuc2V0VGV4dENvbG9yKGV2ZW50LmRhdGEpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJmb3JtYXRGb250TmFtZVwiOlxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR0aGlzLnNldEZvbnRGYWNlKGV2ZW50LmRhdGEpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblxuXHQvLyAtLS0gRXZlbnRzXG5cdGhhbmRsZUV2ZW50KGV2ZW50KSB7XG5cdFx0dGhpcy5maXJlRXZlbnQoZXZlbnQudHlwZSwgZXZlbnQpO1xuXHR9XG5cblx0ZmlyZUV2ZW50KHR5cGUsIGRldGFpbCkge1xuXHRcdGxldCBoYW5kbGVycyA9IHRoaXMuX2V2ZW50cy5nZXQodHlwZSk7XG5cdFx0aWYgKC9eKD86Zm9jdXN8Ymx1cikvLnRlc3QodHlwZSkpIHtcblx0XHRcdGNvbnN0IGlzRm9jdXNlZCA9IHRoaXMuX3Jvb3QgPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cdFx0XHRpZiAodHlwZSA9PT0gXCJmb2N1c1wiKSB7XG5cdFx0XHRcdGlmICghaXNGb2N1c2VkIHx8IHRoaXMuX2lzRm9jdXNlZCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX2lzRm9jdXNlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoaXNGb2N1c2VkIHx8ICF0aGlzLl9pc0ZvY3VzZWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLl9pc0ZvY3VzZWQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGhhbmRsZXJzKSB7XG5cdFx0XHRjb25zdCBldmVudCA9IGRldGFpbCBpbnN0YW5jZW9mIEV2ZW50ID8gZGV0YWlsIDogbmV3IEN1c3RvbUV2ZW50KHR5cGUsIHtcblx0XHRcdFx0ZGV0YWlsXG5cdFx0XHR9KTtcblx0XHRcdGhhbmRsZXJzID0gaGFuZGxlcnMuc2xpY2UoKTtcblx0XHRcdGZvciAoY29uc3QgaGFuZGxlciBvZiBoYW5kbGVycykge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGlmIChcImhhbmRsZUV2ZW50XCIgaW4gaGFuZGxlcikge1xuXHRcdFx0XHRcdFx0aGFuZGxlci5oYW5kbGVFdmVudChldmVudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuX2NvbmZpZy5kaWRFcnJvcihlcnJvcik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRhZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuKSB7XG5cdFx0bGV0IGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzLmdldCh0eXBlKTtcblx0XHRsZXQgdGFyZ2V0ID0gdGhpcy5fcm9vdDtcblx0XHRpZiAoIWhhbmRsZXJzKSB7XG5cdFx0XHRoYW5kbGVycyA9IFtdO1xuXHRcdFx0dGhpcy5fZXZlbnRzLnNldCh0eXBlLCBoYW5kbGVycyk7XG5cdFx0XHRpZiAoIXRoaXMuY3VzdG9tRXZlbnRzLmhhcyh0eXBlKSkge1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gXCJzZWxlY3Rpb25jaGFuZ2VcIikge1xuXHRcdFx0XHRcdHRhcmdldCA9IGRvY3VtZW50O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHRoaXMsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRoYW5kbGVycy5wdXNoKGZuKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdHJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4pIHtcblx0XHRjb25zdCBoYW5kbGVycyA9IHRoaXMuX2V2ZW50cy5nZXQodHlwZSk7XG5cdFx0bGV0IHRhcmdldCA9IHRoaXMuX3Jvb3Q7XG5cdFx0aWYgKGhhbmRsZXJzKSB7XG5cdFx0XHRpZiAoZm4pIHtcblx0XHRcdFx0bGV0IGwgPSBoYW5kbGVycy5sZW5ndGg7XG5cdFx0XHRcdHdoaWxlIChsLS0pIHtcblx0XHRcdFx0XHRpZiAoaGFuZGxlcnNbbF0gPT09IGZuKSB7XG5cdFx0XHRcdFx0XHRoYW5kbGVycy5zcGxpY2UobCwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRoYW5kbGVycy5sZW5ndGggPSAwO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFoYW5kbGVycy5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy5fZXZlbnRzLmRlbGV0ZSh0eXBlKTtcblx0XHRcdFx0aWYgKCF0aGlzLmN1c3RvbUV2ZW50cy5oYXModHlwZSkpIHtcblx0XHRcdFx0XHRpZiAodHlwZSA9PT0gXCJzZWxlY3Rpb25jaGFuZ2VcIikge1xuXHRcdFx0XHRcdFx0dGFyZ2V0ID0gZG9jdW1lbnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIHRoaXMsIHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0Ly8gLS0tIEZvY3VzXG5cdGZvY3VzKCkge1xuXHRcdHRoaXMuX3Jvb3QuZm9jdXMoe3ByZXZlbnRTY3JvbGw6IHRydWV9KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdGJsdXIoKSB7XG5cdFx0dGhpcy5fcm9vdC5ibHVyKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvLyAtLS0gU2VsZWN0aW9uIGFuZCBib29rbWFya2luZ1xuXHRfZW5hYmxlUmVzdG9yZVNlbGVjdGlvbigpIHtcblx0XHR0aGlzLl93aWxsUmVzdG9yZVNlbGVjdGlvbiA9IHRydWU7XG5cdH1cblxuXHRfZGlzYWJsZVJlc3RvcmVTZWxlY3Rpb24oKSB7XG5cdFx0dGhpcy5fd2lsbFJlc3RvcmVTZWxlY3Rpb24gPSBmYWxzZTtcblx0fVxuXG5cdF9yZXN0b3JlU2VsZWN0aW9uKCkge1xuXHRcdGlmICh0aGlzLl93aWxsUmVzdG9yZVNlbGVjdGlvbikge1xuXHRcdFx0dGhpcy5zZXRTZWxlY3Rpb24odGhpcy5fbGFzdFNlbGVjdGlvbik7XG5cdFx0fVxuXHR9XG5cblx0Ly8gLS0tXG5cdF9yZW1vdmVaV1MoKSB7XG5cdFx0aWYgKCF0aGlzLl9tYXlIYXZlWldTKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJlbW92ZVpXUyh0aGlzLl9yb290KTtcblx0XHR0aGlzLl9tYXlIYXZlWldTID0gZmFsc2U7XG5cdH1cblxuXHRfc2F2ZVJhbmdlVG9Cb29rbWFyayhyYW5nZSkge1xuXHRcdGxldCBzdGFydE5vZGUgPSBjcmVhdGVFbGVtZW50KFwiSU5QVVRcIiwge1xuXHRcdFx0aWQ6IHRoaXMuc3RhcnRTZWxlY3Rpb25JZCxcblx0XHRcdHR5cGU6IFwiaGlkZGVuXCJcblx0XHR9KTtcblx0XHRsZXQgZW5kTm9kZSA9IGNyZWF0ZUVsZW1lbnQoXCJJTlBVVFwiLCB7XG5cdFx0XHRpZDogdGhpcy5lbmRTZWxlY3Rpb25JZCxcblx0XHRcdHR5cGU6IFwiaGlkZGVuXCJcblx0XHR9KTtcblx0XHRsZXQgdGVtcDtcblx0XHRpbnNlcnROb2RlSW5SYW5nZShyYW5nZSwgc3RhcnROb2RlKTtcblx0XHRyYW5nZS5jb2xsYXBzZShmYWxzZSk7XG5cdFx0aW5zZXJ0Tm9kZUluUmFuZ2UocmFuZ2UsIGVuZE5vZGUpO1xuXHRcdGlmIChzdGFydE5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24oZW5kTm9kZSkgJiBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX1BSRUNFRElORykge1xuXHRcdFx0c3RhcnROb2RlLmlkID0gdGhpcy5lbmRTZWxlY3Rpb25JZDtcblx0XHRcdGVuZE5vZGUuaWQgPSB0aGlzLnN0YXJ0U2VsZWN0aW9uSWQ7XG5cdFx0XHR0ZW1wID0gc3RhcnROb2RlO1xuXHRcdFx0c3RhcnROb2RlID0gZW5kTm9kZTtcblx0XHRcdGVuZE5vZGUgPSB0ZW1wO1xuXHRcdH1cblx0XHRyYW5nZS5zZXRTdGFydEFmdGVyKHN0YXJ0Tm9kZSk7XG5cdFx0cmFuZ2Uuc2V0RW5kQmVmb3JlKGVuZE5vZGUpO1xuXHR9XG5cblx0X2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsocmFuZ2UpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRjb25zdCBzdGFydCA9IHJvb3QucXVlcnlTZWxlY3RvcihcIiNcIiArIHRoaXMuc3RhcnRTZWxlY3Rpb25JZCk7XG5cdFx0Y29uc3QgZW5kID0gcm9vdC5xdWVyeVNlbGVjdG9yKFwiI1wiICsgdGhpcy5lbmRTZWxlY3Rpb25JZCk7XG5cdFx0aWYgKHN0YXJ0ICYmIGVuZCkge1xuXHRcdFx0bGV0IHN0YXJ0Q29udGFpbmVyID0gc3RhcnQucGFyZW50Tm9kZTtcblx0XHRcdGxldCBlbmRDb250YWluZXIgPSBlbmQucGFyZW50Tm9kZTtcblx0XHRcdGNvbnN0IHN0YXJ0T2Zmc2V0ID0gQXJyYXkuZnJvbShzdGFydENvbnRhaW5lci5jaGlsZE5vZGVzKS5pbmRleE9mKFxuXHRcdFx0XHRcdHN0YXJ0XG5cdFx0XHQpO1xuXHRcdFx0bGV0IGVuZE9mZnNldCA9IEFycmF5LmZyb20oZW5kQ29udGFpbmVyLmNoaWxkTm9kZXMpLmluZGV4T2YoZW5kKTtcblx0XHRcdGlmIChzdGFydENvbnRhaW5lciA9PT0gZW5kQ29udGFpbmVyKSB7XG5cdFx0XHRcdGVuZE9mZnNldCAtPSAxO1xuXHRcdFx0fVxuXHRcdFx0c3RhcnQucmVtb3ZlKCk7XG5cdFx0XHRlbmQucmVtb3ZlKCk7XG5cdFx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRcdHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcblx0XHRcdH1cblx0XHRcdHJhbmdlLnNldFN0YXJ0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCk7XG5cdFx0XHRyYW5nZS5zZXRFbmQoZW5kQ29udGFpbmVyLCBlbmRPZmZzZXQpO1xuXHRcdFx0bWVyZ2VJbmxpbmVzKHN0YXJ0Q29udGFpbmVyLCByYW5nZSk7XG5cdFx0XHRpZiAoc3RhcnRDb250YWluZXIgIT09IGVuZENvbnRhaW5lcikge1xuXHRcdFx0XHRtZXJnZUlubGluZXMoZW5kQ29udGFpbmVyLCByYW5nZSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocmFuZ2UuY29sbGFwc2VkKSB7XG5cdFx0XHRcdHN0YXJ0Q29udGFpbmVyID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0XHRcdGlmIChzdGFydENvbnRhaW5lciBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRcdFx0XHRlbmRDb250YWluZXIgPSBzdGFydENvbnRhaW5lci5jaGlsZE5vZGVzW3JhbmdlLnN0YXJ0T2Zmc2V0XTtcblx0XHRcdFx0XHRpZiAoIWVuZENvbnRhaW5lciB8fCAhKGVuZENvbnRhaW5lciBpbnN0YW5jZW9mIFRleHQpKSB7XG5cdFx0XHRcdFx0XHRlbmRDb250YWluZXIgPSBzdGFydENvbnRhaW5lci5jaGlsZE5vZGVzW3JhbmdlLnN0YXJ0T2Zmc2V0IC0gMV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChlbmRDb250YWluZXIgJiYgZW5kQ29udGFpbmVyIGluc3RhbmNlb2YgVGV4dCkge1xuXHRcdFx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnQoZW5kQ29udGFpbmVyLCAwKTtcblx0XHRcdFx0XHRcdHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcmFuZ2UgfHwgbnVsbDtcblx0fVxuXG5cdGdldFNlbGVjdGlvbigpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0bGV0IHJhbmdlID0gbnVsbDtcblx0XHRpZiAodGhpcy5faXNGb2N1c2VkICYmIHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ucmFuZ2VDb3VudCkge1xuXHRcdFx0cmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jbG9uZVJhbmdlKCk7XG5cdFx0XHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRcdFx0Y29uc3QgZW5kQ29udGFpbmVyID0gcmFuZ2UuZW5kQ29udGFpbmVyO1xuXHRcdFx0aWYgKHN0YXJ0Q29udGFpbmVyICYmIGlzTGVhZihzdGFydENvbnRhaW5lcikpIHtcblx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnRCZWZvcmUoc3RhcnRDb250YWluZXIpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGVuZENvbnRhaW5lciAmJiBpc0xlYWYoZW5kQ29udGFpbmVyKSkge1xuXHRcdFx0XHRyYW5nZS5zZXRFbmRCZWZvcmUoZW5kQ29udGFpbmVyKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKHJhbmdlICYmIHJvb3QuY29udGFpbnMocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIpKSB7XG5cdFx0XHR0aGlzLl9sYXN0U2VsZWN0aW9uID0gcmFuZ2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJhbmdlID0gdGhpcy5fbGFzdFNlbGVjdGlvbjtcblx0XHRcdGlmICghZG9jdW1lbnQuY29udGFpbnMocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIpKSB7XG5cdFx0XHRcdHJhbmdlID0gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCFyYW5nZSkge1xuXHRcdFx0cmFuZ2UgPSBjcmVhdGVSYW5nZShyb290LmZpcnN0RWxlbWVudENoaWxkIHx8IHJvb3QsIDApO1xuXHRcdH1cblx0XHRyZXR1cm4gcmFuZ2U7XG5cdH1cblxuXHRzZXRTZWxlY3Rpb24ocmFuZ2UpIHtcblx0XHR0aGlzLl9sYXN0U2VsZWN0aW9uID0gcmFuZ2U7XG5cdFx0aWYgKCF0aGlzLl9pc0ZvY3VzZWQpIHtcblx0XHRcdHRoaXMuX2VuYWJsZVJlc3RvcmVTZWxlY3Rpb24oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbikge1xuXHRcdFx0XHRpZiAoXCJzZXRCYXNlQW5kRXh0ZW50XCIgaW4gU2VsZWN0aW9uLnByb3RvdHlwZSkge1xuXHRcdFx0XHRcdHNlbGVjdGlvbi5zZXRCYXNlQW5kRXh0ZW50KFxuXHRcdFx0XHRcdFx0XHRyYW5nZS5zdGFydENvbnRhaW5lcixcblx0XHRcdFx0XHRcdFx0cmFuZ2Uuc3RhcnRPZmZzZXQsXG5cdFx0XHRcdFx0XHRcdHJhbmdlLmVuZENvbnRhaW5lcixcblx0XHRcdFx0XHRcdFx0cmFuZ2UuZW5kT2Zmc2V0XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cdFx0XHRcdFx0c2VsZWN0aW9uLmFkZFJhbmdlKHJhbmdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8vIC0tLVxuXHRfbW92ZUN1cnNvclRvKHRvU3RhcnQpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRjb25zdCByYW5nZSA9IGNyZWF0ZVJhbmdlKHJvb3QsIHRvU3RhcnQgPyAwIDogcm9vdC5jaGlsZE5vZGVzLmxlbmd0aCk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRtb3ZlQ3Vyc29yVG9TdGFydCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbW92ZUN1cnNvclRvKHRydWUpO1xuXHR9XG5cblx0bW92ZUN1cnNvclRvRW5kKCkge1xuXHRcdHJldHVybiB0aGlzLl9tb3ZlQ3Vyc29yVG8oZmFsc2UpO1xuXHR9XG5cblx0Ly8gLS0tXG5cdGdldEN1cnNvclBvc2l0aW9uKCkge1xuXHRcdGNvbnN0IHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHRsZXQgcmVjdCA9IHJhbmdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdGlmIChyZWN0ICYmICFyZWN0LnRvcCkge1xuXHRcdFx0dGhpcy5faWdub3JlQ2hhbmdlID0gdHJ1ZTtcblx0XHRcdGNvbnN0IG5vZGUgPSBjcmVhdGVFbGVtZW50KFwiU1BBTlwiKTtcblx0XHRcdG5vZGUudGV4dENvbnRlbnQgPSBaV1M7XG5cdFx0XHRpbnNlcnROb2RlSW5SYW5nZShyYW5nZSwgbm9kZSk7XG5cdFx0XHRyZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdHBhcmVudC5yZW1vdmVDaGlsZChub2RlKTtcblx0XHRcdG1lcmdlSW5saW5lcyhwYXJlbnQsIHJhbmdlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlY3Q7XG5cdH1cblxuXHQvLyAtLS0gUGF0aFxuXHRnZXRQYXRoKCkge1xuXHRcdHJldHVybiB0aGlzLl9wYXRoO1xuXHR9XG5cblx0X3VwZGF0ZVBhdGhPbkV2ZW50KCkge1xuXHRcdGlmICh0aGlzLl9pc0ZvY3VzZWQpIHtcblx0XHRcdHRoaXMuX3VwZGF0ZVBhdGgodGhpcy5nZXRTZWxlY3Rpb24oKSk7XG5cdFx0fVxuXHR9XG5cblx0X3VwZGF0ZVBhdGgocmFuZ2UsIGZvcmNlKSB7XG5cdFx0Y29uc3QgYW5jaG9yID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0Y29uc3QgZm9jdXMgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdFx0bGV0IG5ld1BhdGg7XG5cdFx0aWYgKGZvcmNlIHx8IGFuY2hvciAhPT0gdGhpcy5fbGFzdEFuY2hvck5vZGUgfHwgZm9jdXMgIT09IHRoaXMuX2xhc3RGb2N1c05vZGUpIHtcblx0XHRcdHRoaXMuX2xhc3RBbmNob3JOb2RlID0gYW5jaG9yO1xuXHRcdFx0dGhpcy5fbGFzdEZvY3VzTm9kZSA9IGZvY3VzO1xuXHRcdFx0bmV3UGF0aCA9IGFuY2hvciAmJiBmb2N1cyA/IGFuY2hvciA9PT0gZm9jdXMgPyB0aGlzLl9nZXRQYXRoKGZvY3VzKSA6IFwiKHNlbGVjdGlvbilcIiA6IFwiXCI7XG5cdFx0XHRpZiAodGhpcy5fcGF0aCAhPT0gbmV3UGF0aCkge1xuXHRcdFx0XHR0aGlzLl9wYXRoID0gbmV3UGF0aDtcblx0XHRcdFx0dGhpcy5maXJlRXZlbnQoXCJwYXRoQ2hhbmdlXCIsIHtcblx0XHRcdFx0XHRwYXRoOiBuZXdQYXRoXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmZpcmVFdmVudChyYW5nZS5jb2xsYXBzZWQgPyBcImN1cnNvclwiIDogXCJzZWxlY3RcIiwge1xuXHRcdFx0cmFuZ2Vcblx0XHR9KTtcblx0fVxuXG5cdF9nZXRQYXRoKG5vZGUpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRjb25zdCBjb25maWcgPSB0aGlzLl9jb25maWc7XG5cdFx0bGV0IHBhdGggPSBcIlwiO1xuXHRcdGlmIChub2RlICYmIG5vZGUgIT09IHJvb3QpIHtcblx0XHRcdGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdHBhdGggPSBwYXJlbnQgPyB0aGlzLl9nZXRQYXRoKHBhcmVudCkgOiBcIlwiO1xuXHRcdFx0aWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHRcdFx0XHRjb25zdCBpZCA9IG5vZGUuaWQ7XG5cdFx0XHRcdGNvbnN0IGNsYXNzTGlzdCA9IG5vZGUuY2xhc3NMaXN0O1xuXHRcdFx0XHRjb25zdCBjbGFzc05hbWVzID0gQXJyYXkuZnJvbShjbGFzc0xpc3QpLnNvcnQoKTtcblx0XHRcdFx0Y29uc3QgZGlyID0gbm9kZS5kaXI7XG5cdFx0XHRcdGNvbnN0IHN0eWxlTmFtZXMgPSBjb25maWcuY2xhc3NOYW1lcztcblx0XHRcdFx0cGF0aCArPSAocGF0aCA/IFwiPlwiIDogXCJcIikgKyBub2RlLm5vZGVOYW1lO1xuXHRcdFx0XHRpZiAoaWQpIHtcblx0XHRcdFx0XHRwYXRoICs9IFwiI1wiICsgaWQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGNsYXNzTmFtZXMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0cGF0aCArPSBcIi5cIjtcblx0XHRcdFx0XHRwYXRoICs9IGNsYXNzTmFtZXMuam9pbihcIi5cIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRpcikge1xuXHRcdFx0XHRcdHBhdGggKz0gXCJbZGlyPVwiICsgZGlyICsgXCJdXCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGNsYXNzTGlzdC5jb250YWlucyhzdHlsZU5hbWVzLmhpZ2hsaWdodCkpIHtcblx0XHRcdFx0XHRwYXRoICs9IFwiW2JhY2tncm91bmRDb2xvcj1cIiArIG5vZGUuc3R5bGUuYmFja2dyb3VuZENvbG9yLnJlcGxhY2UoLyAvZywgXCJcIikgKyBcIl1cIjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoY2xhc3NMaXN0LmNvbnRhaW5zKHN0eWxlTmFtZXMuY29sb3IpKSB7XG5cdFx0XHRcdFx0cGF0aCArPSBcIltjb2xvcj1cIiArIG5vZGUuc3R5bGUuY29sb3IucmVwbGFjZSgvIC9nLCBcIlwiKSArIFwiXVwiO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChjbGFzc0xpc3QuY29udGFpbnMoc3R5bGVOYW1lcy5mb250RmFtaWx5KSkge1xuXHRcdFx0XHRcdHBhdGggKz0gXCJbZm9udEZhbWlseT1cIiArIG5vZGUuc3R5bGUuZm9udEZhbWlseS5yZXBsYWNlKC8gL2csIFwiXCIpICsgXCJdXCI7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGNsYXNzTGlzdC5jb250YWlucyhzdHlsZU5hbWVzLmZvbnRTaXplKSkge1xuXHRcdFx0XHRcdHBhdGggKz0gXCJbZm9udFNpemU9XCIgKyBub2RlLnN0eWxlLmZvbnRTaXplICsgXCJdXCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHBhdGg7XG5cdH1cblxuXHQvLyAtLS0gSGlzdG9yeVxuXHRtb2RpZnlEb2N1bWVudChtb2RpZmljYXRpb25Gbikge1xuXHRcdGNvbnN0IG11dGF0aW9uID0gdGhpcy5fbXV0YXRpb247XG5cdFx0aWYgKG11dGF0aW9uKSB7XG5cdFx0XHRpZiAobXV0YXRpb24udGFrZVJlY29yZHMoKS5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy5fZG9jV2FzQ2hhbmdlZCgpO1xuXHRcdFx0fVxuXHRcdFx0bXV0YXRpb24uZGlzY29ubmVjdCgpO1xuXHRcdH1cblx0XHR0aGlzLl9pZ25vcmVBbGxDaGFuZ2VzID0gdHJ1ZTtcblx0XHRtb2RpZmljYXRpb25GbigpO1xuXHRcdHRoaXMuX2lnbm9yZUFsbENoYW5nZXMgPSBmYWxzZTtcblx0XHRpZiAobXV0YXRpb24pIHtcblx0XHRcdG11dGF0aW9uLm9ic2VydmUodGhpcy5fcm9vdCwge1xuXHRcdFx0XHRjaGlsZExpc3Q6IHRydWUsXG5cdFx0XHRcdGF0dHJpYnV0ZXM6IHRydWUsXG5cdFx0XHRcdGNoYXJhY3RlckRhdGE6IHRydWUsXG5cdFx0XHRcdHN1YnRyZWU6IHRydWVcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5faWdub3JlQ2hhbmdlID0gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0X2RvY1dhc0NoYW5nZWQoKSB7XG5cdFx0cmVzZXROb2RlQ2F0ZWdvcnlDYWNoZSgpO1xuXHRcdHRoaXMuX21heUhhdmVaV1MgPSB0cnVlO1xuXHRcdGlmICh0aGlzLl9pZ25vcmVBbGxDaGFuZ2VzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICh0aGlzLl9pZ25vcmVDaGFuZ2UpIHtcblx0XHRcdHRoaXMuX2lnbm9yZUNoYW5nZSA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAodGhpcy5faXNJblVuZG9TdGF0ZSkge1xuXHRcdFx0dGhpcy5faXNJblVuZG9TdGF0ZSA9IGZhbHNlO1xuXHRcdFx0dGhpcy5maXJlRXZlbnQoXCJ1bmRvU3RhdGVDaGFuZ2VcIiwge1xuXHRcdFx0XHRjYW5VbmRvOiB0cnVlLFxuXHRcdFx0XHRjYW5SZWRvOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHRoaXMuZmlyZUV2ZW50KFwiaW5wdXRcIik7XG5cdH1cblxuXHQvKipcblx0ICogTGVhdmVzIGJvb2ttYXJrLlxuXHQgKi9cblx0X3JlY29yZFVuZG9TdGF0ZShyYW5nZSwgcmVwbGFjZSkge1xuXHRcdGNvbnN0IGlzSW5VbmRvU3RhdGUgPSB0aGlzLl9pc0luVW5kb1N0YXRlO1xuXHRcdGlmICghaXNJblVuZG9TdGF0ZSB8fCByZXBsYWNlKSB7XG5cdFx0XHRsZXQgdW5kb0luZGV4ID0gdGhpcy5fdW5kb0luZGV4ICsgMTtcblx0XHRcdGNvbnN0IHVuZG9TdGFjayA9IHRoaXMuX3VuZG9TdGFjaztcblx0XHRcdGNvbnN0IHVuZG9Db25maWcgPSB0aGlzLl9jb25maWcudW5kbztcblx0XHRcdGNvbnN0IHVuZG9UaHJlc2hvbGQgPSB1bmRvQ29uZmlnLmRvY3VtZW50U2l6ZVRocmVzaG9sZDtcblx0XHRcdGNvbnN0IHVuZG9MaW1pdCA9IHVuZG9Db25maWcudW5kb0xpbWl0O1xuXHRcdFx0aWYgKHVuZG9JbmRleCA8IHRoaXMuX3VuZG9TdGFja0xlbmd0aCkge1xuXHRcdFx0XHR1bmRvU3RhY2subGVuZ3RoID0gdGhpcy5fdW5kb1N0YWNrTGVuZ3RoID0gdW5kb0luZGV4O1xuXHRcdFx0fVxuXHRcdFx0aWYgKHJhbmdlKSB7XG5cdFx0XHRcdHRoaXMuX3NhdmVSYW5nZVRvQm9va21hcmsocmFuZ2UpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGlzSW5VbmRvU3RhdGUpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBodG1sID0gdGhpcy5fZ2V0UmF3SFRNTCgpO1xuXHRcdFx0aWYgKHJlcGxhY2UpIHtcblx0XHRcdFx0dW5kb0luZGV4IC09IDE7XG5cdFx0XHR9XG5cdFx0XHRpZiAodW5kb1RocmVzaG9sZCA+IC0xICYmIGh0bWwubGVuZ3RoICogMiA+IHVuZG9UaHJlc2hvbGQpIHtcblx0XHRcdFx0aWYgKHVuZG9MaW1pdCA+IC0xICYmIHVuZG9JbmRleCA+IHVuZG9MaW1pdCkge1xuXHRcdFx0XHRcdHVuZG9TdGFjay5zcGxpY2UoMCwgdW5kb0luZGV4IC0gdW5kb0xpbWl0KTtcblx0XHRcdFx0XHR1bmRvSW5kZXggPSB1bmRvTGltaXQ7XG5cdFx0XHRcdFx0dGhpcy5fdW5kb1N0YWNrTGVuZ3RoID0gdW5kb0xpbWl0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR1bmRvU3RhY2tbdW5kb0luZGV4XSA9IGh0bWw7XG5cdFx0XHR0aGlzLl91bmRvSW5kZXggPSB1bmRvSW5kZXg7XG5cdFx0XHR0aGlzLl91bmRvU3RhY2tMZW5ndGggKz0gMTtcblx0XHRcdHRoaXMuX2lzSW5VbmRvU3RhdGUgPSB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdHNhdmVVbmRvU3RhdGUocmFuZ2UpIHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdHRoaXMuX3JlY29yZFVuZG9TdGF0ZShyYW5nZSwgdGhpcy5faXNJblVuZG9TdGF0ZSk7XG5cdFx0dGhpcy5fZ2V0UmFuZ2VBbmRSZW1vdmVCb29rbWFyayhyYW5nZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHR1bmRvKCkge1xuXHRcdGlmICh0aGlzLl91bmRvSW5kZXggIT09IDAgfHwgIXRoaXMuX2lzSW5VbmRvU3RhdGUpIHtcblx0XHRcdHRoaXMuX3JlY29yZFVuZG9TdGF0ZSh0aGlzLmdldFNlbGVjdGlvbigpLCBmYWxzZSk7XG5cdFx0XHR0aGlzLl91bmRvSW5kZXggLT0gMTtcblx0XHRcdHRoaXMuX3NldFJhd0hUTUwodGhpcy5fdW5kb1N0YWNrW3RoaXMuX3VuZG9JbmRleF0pO1xuXHRcdFx0Y29uc3QgcmFuZ2UgPSB0aGlzLl9nZXRSYW5nZUFuZFJlbW92ZUJvb2ttYXJrKCk7XG5cdFx0XHRpZiAocmFuZ2UpIHtcblx0XHRcdFx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5faXNJblVuZG9TdGF0ZSA9IHRydWU7XG5cdFx0XHR0aGlzLmZpcmVFdmVudChcInVuZG9TdGF0ZUNoYW5nZVwiLCB7XG5cdFx0XHRcdGNhblVuZG86IHRoaXMuX3VuZG9JbmRleCAhPT0gMCxcblx0XHRcdFx0Y2FuUmVkbzogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmZpcmVFdmVudChcImlucHV0XCIpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5mb2N1cygpO1xuXHR9XG5cblx0cmVkbygpIHtcblx0XHRjb25zdCB1bmRvSW5kZXggPSB0aGlzLl91bmRvSW5kZXg7XG5cdFx0Y29uc3QgdW5kb1N0YWNrTGVuZ3RoID0gdGhpcy5fdW5kb1N0YWNrTGVuZ3RoO1xuXHRcdGlmICh1bmRvSW5kZXggKyAxIDwgdW5kb1N0YWNrTGVuZ3RoICYmIHRoaXMuX2lzSW5VbmRvU3RhdGUpIHtcblx0XHRcdHRoaXMuX3VuZG9JbmRleCArPSAxO1xuXHRcdFx0dGhpcy5fc2V0UmF3SFRNTCh0aGlzLl91bmRvU3RhY2tbdGhpcy5fdW5kb0luZGV4XSk7XG5cdFx0XHRjb25zdCByYW5nZSA9IHRoaXMuX2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsoKTtcblx0XHRcdGlmIChyYW5nZSkge1xuXHRcdFx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmZpcmVFdmVudChcInVuZG9TdGF0ZUNoYW5nZVwiLCB7XG5cdFx0XHRcdGNhblVuZG86IHRydWUsXG5cdFx0XHRcdGNhblJlZG86IHVuZG9JbmRleCArIDIgPCB1bmRvU3RhY2tMZW5ndGhcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5maXJlRXZlbnQoXCJpbnB1dFwiKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdC8vIC0tLSBHZXQgYW5kIHNldCBkYXRhXG5cdGdldFJvb3QoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3Jvb3Q7XG5cdH1cblxuXHRfZ2V0UmF3SFRNTCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fcm9vdC5pbm5lckhUTUw7XG5cdH1cblxuXHRfc2V0UmF3SFRNTChodG1sKSB7XG5cdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0cm9vdC5pbm5lckhUTUwgPSBodG1sO1xuXHRcdGxldCBub2RlID0gcm9vdDtcblx0XHRjb25zdCBjaGlsZCA9IG5vZGUuZmlyc3RDaGlsZDtcblx0XHRpZiAoIWNoaWxkIHx8IGNoaWxkLm5vZGVOYW1lID09PSBcIkJSXCIpIHtcblx0XHRcdGNvbnN0IGJsb2NrID0gdGhpcy5jcmVhdGVEZWZhdWx0QmxvY2soKTtcblx0XHRcdGlmIChjaGlsZCkge1xuXHRcdFx0XHRub2RlLnJlcGxhY2VDaGlsZChibG9jaywgY2hpbGQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZS5hcHBlbmRDaGlsZChibG9jayk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHdoaWxlIChub2RlID0gZ2V0TmV4dEJsb2NrKG5vZGUsIHJvb3QpKSB7XG5cdFx0XHRcdGZpeEN1cnNvcihub2RlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5faWdub3JlQ2hhbmdlID0gdHJ1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdGdldEhUTUwod2l0aEJvb2ttYXJrKSB7XG5cdFx0bGV0IHJhbmdlO1xuXHRcdGlmICh3aXRoQm9va21hcmspIHtcblx0XHRcdHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHRcdHRoaXMuX3NhdmVSYW5nZVRvQm9va21hcmsocmFuZ2UpO1xuXHRcdH1cblx0XHRjb25zdCBodG1sID0gdGhpcy5fZ2V0UmF3SFRNTCgpLnJlcGxhY2UoL1xcdTIwMEIvZywgXCJcIik7XG5cdFx0aWYgKHdpdGhCb29rbWFyaykge1xuXHRcdFx0dGhpcy5fZ2V0UmFuZ2VBbmRSZW1vdmVCb29rbWFyayhyYW5nZSk7XG5cdFx0fVxuXHRcdHJldHVybiBodG1sO1xuXHR9XG5cblx0c2V0SFRNTChodG1sKSB7XG5cdFx0Y29uc3QgZnJhZyA9IHRoaXMuX2NvbmZpZy5zYW5pdGl6ZVRvRE9NRnJhZ21lbnQoaHRtbCwgdGhpcyk7XG5cdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0Y2xlYW5UcmVlKGZyYWcsIHRoaXMuX2NvbmZpZyk7XG5cdFx0Y2xlYW51cEJScyhmcmFnLCByb290LCBmYWxzZSwgdGhpcy5fY29uZmlnKTtcblx0XHRmaXhDb250YWluZXIoZnJhZywgcm9vdCwgdGhpcy5fY29uZmlnKTtcblx0XHRsZXQgbm9kZSA9IGZyYWc7XG5cdFx0bGV0IGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuXHRcdGlmICghY2hpbGQgfHwgY2hpbGQubm9kZU5hbWUgPT09IFwiQlJcIikge1xuXHRcdFx0Y29uc3QgYmxvY2sgPSB0aGlzLmNyZWF0ZURlZmF1bHRCbG9jaygpO1xuXHRcdFx0aWYgKGNoaWxkKSB7XG5cdFx0XHRcdG5vZGUucmVwbGFjZUNoaWxkKGJsb2NrLCBjaGlsZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub2RlLmFwcGVuZENoaWxkKGJsb2NrKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0d2hpbGUgKG5vZGUgPSBnZXROZXh0QmxvY2sobm9kZSwgcm9vdCkpIHtcblx0XHRcdFx0Zml4Q3Vyc29yKG5vZGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLl9pZ25vcmVDaGFuZ2UgPSB0cnVlO1xuXHRcdHdoaWxlIChjaGlsZCA9IHJvb3QubGFzdENoaWxkKSB7XG5cdFx0XHRyb290LnJlbW92ZUNoaWxkKGNoaWxkKTtcblx0XHR9XG5cdFx0cm9vdC5hcHBlbmRDaGlsZChmcmFnKTtcblx0XHR0aGlzLl91bmRvSW5kZXggPSAtMTtcblx0XHR0aGlzLl91bmRvU3RhY2subGVuZ3RoID0gMDtcblx0XHR0aGlzLl91bmRvU3RhY2tMZW5ndGggPSAwO1xuXHRcdHRoaXMuX2lzSW5VbmRvU3RhdGUgPSBmYWxzZTtcblx0XHRjb25zdCByYW5nZSA9IHRoaXMuX2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsoKSB8fCBjcmVhdGVSYW5nZShyb290LmZpcnN0RWxlbWVudENoaWxkIHx8IHJvb3QsIDApO1xuXHRcdHRoaXMuc2F2ZVVuZG9TdGF0ZShyYW5nZSk7XG5cdFx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdHRoaXMuX3VwZGF0ZVBhdGgocmFuZ2UsIHRydWUpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIEluc2VydCBIVE1MIGF0IHRoZSBjdXJzb3IgbG9jYXRpb24uIElmIHRoZSBzZWxlY3Rpb24gaXMgbm90IGNvbGxhcHNlZFxuXHQgKiBpbnNlcnRUcmVlRnJhZ21lbnRJbnRvUmFuZ2Ugd2lsbCBkZWxldGUgdGhlIHNlbGVjdGlvbiBzbyB0aGF0IGl0IGlzXG5cdCAqIHJlcGxhY2VkIGJ5IHRoZSBodG1sIGJlaW5nIGluc2VydGVkLlxuXHQgKi9cblx0aW5zZXJ0SFRNTChodG1sLCBpc1Bhc3RlKSB7XG5cdFx0Y29uc3QgY29uZmlnID0gdGhpcy5fY29uZmlnO1xuXHRcdGxldCBmcmFnID0gY29uZmlnLnNhbml0aXplVG9ET01GcmFnbWVudChodG1sLCB0aGlzKTtcblx0XHRjb25zdCByYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0dGhpcy5zYXZlVW5kb1N0YXRlKHJhbmdlKTtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0XHRpZiAoY29uZmlnLmFkZExpbmtzKSB7XG5cdFx0XHRcdHRoaXMuYWRkRGV0ZWN0ZWRMaW5rcyhmcmFnLCBmcmFnKTtcblx0XHRcdH1cblx0XHRcdGNsZWFuVHJlZShmcmFnLCB0aGlzLl9jb25maWcpO1xuXHRcdFx0Y2xlYW51cEJScyhmcmFnLCByb290LCBmYWxzZSwgdGhpcy5fY29uZmlnKTtcblx0XHRcdHJlbW92ZUVtcHR5SW5saW5lcyhmcmFnKTtcblx0XHRcdGZyYWcubm9ybWFsaXplKCk7XG5cdFx0XHRsZXQgbm9kZSA9IGZyYWc7XG5cdFx0XHR3aGlsZSAobm9kZSA9IGdldE5leHRCbG9jayhub2RlLCBmcmFnKSkge1xuXHRcdFx0XHRmaXhDdXJzb3Iobm9kZSk7XG5cdFx0XHR9XG5cdFx0XHRsZXQgZG9JbnNlcnQgPSB0cnVlO1xuXHRcdFx0aWYgKGlzUGFzdGUpIHtcblx0XHRcdFx0Y29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJ3aWxsUGFzdGVcIiwge1xuXHRcdFx0XHRcdGNhbmNlbGFibGU6IHRydWUsXG5cdFx0XHRcdFx0ZGV0YWlsOiB7XG5cdFx0XHRcdFx0XHRmcmFnbWVudDogZnJhZ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdHRoaXMuZmlyZUV2ZW50KFwid2lsbFBhc3RlXCIsIGV2ZW50KTtcblx0XHRcdFx0ZnJhZyA9IGV2ZW50LmRldGFpbC5mcmFnbWVudDtcblx0XHRcdFx0ZG9JbnNlcnQgPSAhZXZlbnQuZGVmYXVsdFByZXZlbnRlZDtcblx0XHRcdH1cblx0XHRcdGlmIChkb0luc2VydCkge1xuXHRcdFx0XHRpbnNlcnRUcmVlRnJhZ21lbnRJbnRvUmFuZ2UocmFuZ2UsIGZyYWcsIHJvb3QsIGNvbmZpZyk7XG5cdFx0XHRcdHJhbmdlLmNvbGxhcHNlKGZhbHNlKTtcblx0XHRcdFx0bW92ZVJhbmdlQm91bmRhcnlPdXRPZihyYW5nZSwgXCJBXCIsIHJvb3QpO1xuXHRcdFx0XHR0aGlzLl9lbnN1cmVCb3R0b21MaW5lKCk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHR0aGlzLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0XHRcdGlmIChpc1Bhc3RlKSB7XG5cdFx0XHRcdHRoaXMuZm9jdXMoKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5fY29uZmlnLmRpZEVycm9yKGVycm9yKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRpbnNlcnRFbGVtZW50KGVsLCByYW5nZSkge1xuXHRcdGlmICghcmFuZ2UpIHtcblx0XHRcdHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHR9XG5cdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0aWYgKGlzSW5saW5lKGVsKSkge1xuXHRcdFx0aW5zZXJ0Tm9kZUluUmFuZ2UocmFuZ2UsIGVsKTtcblx0XHRcdHJhbmdlLnNldFN0YXJ0QWZ0ZXIoZWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRcdGNvbnN0IHN0YXJ0Tm9kZSA9IGdldFN0YXJ0QmxvY2tPZlJhbmdlKFxuXHRcdFx0XHRcdHJhbmdlLFxuXHRcdFx0XHRcdHJvb3Rcblx0XHRcdCk7XG5cdFx0XHRsZXQgc3BsaXROb2RlID0gc3RhcnROb2RlIHx8IHJvb3Q7XG5cdFx0XHRsZXQgbm9kZUFmdGVyU3BsaXQgPSBudWxsO1xuXHRcdFx0d2hpbGUgKHNwbGl0Tm9kZSAhPT0gcm9vdCAmJiAhc3BsaXROb2RlLm5leHRTaWJsaW5nKSB7XG5cdFx0XHRcdHNwbGl0Tm9kZSA9IHNwbGl0Tm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNwbGl0Tm9kZSAhPT0gcm9vdCkge1xuXHRcdFx0XHRjb25zdCBwYXJlbnQgPSBzcGxpdE5vZGUucGFyZW50Tm9kZTtcblx0XHRcdFx0bm9kZUFmdGVyU3BsaXQgPSBzcGxpdChcblx0XHRcdFx0XHRcdHBhcmVudCxcblx0XHRcdFx0XHRcdHNwbGl0Tm9kZS5uZXh0U2libGluZyxcblx0XHRcdFx0XHRcdHJvb3QsXG5cdFx0XHRcdFx0XHRyb290XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc3RhcnROb2RlICYmIGlzRW1wdHlCbG9jayhzdGFydE5vZGUpKSB7XG5cdFx0XHRcdGRldGFjaChzdGFydE5vZGUpO1xuXHRcdFx0fVxuXHRcdFx0cm9vdC5pbnNlcnRCZWZvcmUoZWwsIG5vZGVBZnRlclNwbGl0KTtcblx0XHRcdGNvbnN0IGJsYW5rTGluZSA9IHRoaXMuY3JlYXRlRGVmYXVsdEJsb2NrKCk7XG5cdFx0XHRyb290Lmluc2VydEJlZm9yZShibGFua0xpbmUsIG5vZGVBZnRlclNwbGl0KTtcblx0XHRcdHJhbmdlLnNldFN0YXJ0KGJsYW5rTGluZSwgMCk7XG5cdFx0XHRyYW5nZS5zZXRFbmQoYmxhbmtMaW5lLCAwKTtcblx0XHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdFx0fVxuXHRcdHRoaXMuZm9jdXMoKTtcblx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0dGhpcy5fdXBkYXRlUGF0aChyYW5nZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRpbnNlcnRJbWFnZShzcmMsIGF0dHJpYnV0ZXMpIHtcblx0XHRjb25zdCBpbWcgPSBjcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcIklNR1wiLFxuXHRcdFx0XHRPYmplY3QuYXNzaWduKFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRzcmNcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhdHRyaWJ1dGVzXG5cdFx0XHRcdClcblx0XHQpO1xuXHRcdHRoaXMuaW5zZXJ0RWxlbWVudChpbWcpO1xuXHRcdHJldHVybiBpbWc7XG5cdH1cblxuXHRpbnNlcnRQbGFpblRleHQocGxhaW5UZXh0LCBpc1Bhc3RlKSB7XG5cdFx0Y29uc3QgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRcdGlmIChyYW5nZS5jb2xsYXBzZWQgJiYgZ2V0TmVhcmVzdChyYW5nZS5zdGFydENvbnRhaW5lciwgdGhpcy5fcm9vdCwgXCJQUkVcIikpIHtcblx0XHRcdGNvbnN0IHN0YXJ0Q29udGFpbmVyID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0XHRsZXQgb2Zmc2V0ID0gcmFuZ2Uuc3RhcnRPZmZzZXQ7XG5cdFx0XHRsZXQgdGV4dE5vZGU7XG5cdFx0XHRpZiAoIXN0YXJ0Q29udGFpbmVyIHx8ICEoc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0KSkge1xuXHRcdFx0XHRjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cdFx0XHRcdHN0YXJ0Q29udGFpbmVyLmluc2VydEJlZm9yZShcblx0XHRcdFx0XHRcdHRleHQsXG5cdFx0XHRcdFx0XHRzdGFydENvbnRhaW5lci5jaGlsZE5vZGVzW29mZnNldF1cblx0XHRcdFx0KTtcblx0XHRcdFx0dGV4dE5vZGUgPSB0ZXh0O1xuXHRcdFx0XHRvZmZzZXQgPSAwO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGV4dE5vZGUgPSBzdGFydENvbnRhaW5lcjtcblx0XHRcdH1cblx0XHRcdGxldCBkb0luc2VydCA9IHRydWU7XG5cdFx0XHRpZiAoaXNQYXN0ZSkge1xuXHRcdFx0XHRjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChcIndpbGxQYXN0ZVwiLCB7XG5cdFx0XHRcdFx0Y2FuY2VsYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRkZXRhaWw6IHtcblx0XHRcdFx0XHRcdHRleHQ6IHBsYWluVGV4dFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdHRoaXMuZmlyZUV2ZW50KFwid2lsbFBhc3RlXCIsIGV2ZW50KTtcblx0XHRcdFx0cGxhaW5UZXh0ID0gZXZlbnQuZGV0YWlsLnRleHQ7XG5cdFx0XHRcdGRvSW5zZXJ0ID0gIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZG9JbnNlcnQpIHtcblx0XHRcdFx0dGV4dE5vZGUuaW5zZXJ0RGF0YShvZmZzZXQsIHBsYWluVGV4dCk7XG5cdFx0XHRcdHJhbmdlLnNldFN0YXJ0KHRleHROb2RlLCBvZmZzZXQgKyBwbGFpblRleHQubGVuZ3RoKTtcblx0XHRcdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0Y29uc3QgbGluZXMgPSBwbGFpblRleHQuc3BsaXQoXCJcXG5cIik7XG5cdFx0Y29uc3QgY29uZmlnID0gdGhpcy5fY29uZmlnO1xuXHRcdGNvbnN0IHRhZyA9IGNvbmZpZy5ibG9ja1RhZztcblx0XHRjb25zdCBhdHRyaWJ1dGVzID0gY29uZmlnLmJsb2NrQXR0cmlidXRlcztcblx0XHRjb25zdCBjbG9zZUJsb2NrID0gXCI8L1wiICsgdGFnICsgXCI+XCI7XG5cdFx0bGV0IG9wZW5CbG9jayA9IFwiPFwiICsgdGFnO1xuXHRcdGZvciAoY29uc3QgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG5cdFx0XHRvcGVuQmxvY2sgKz0gXCIgXCIgKyBhdHRyICsgJz1cIicgKyBlc2NhcGVIVE1MKGF0dHJpYnV0ZXNbYXR0cl0pICsgJ1wiJztcblx0XHR9XG5cdFx0b3BlbkJsb2NrICs9IFwiPlwiO1xuXHRcdGZvciAobGV0IGkgPSAwLCBsID0gbGluZXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG5cdFx0XHRsZXQgbGluZSA9IGxpbmVzW2ldO1xuXHRcdFx0bGluZSA9IGVzY2FwZUhUTUwobGluZSkucmVwbGFjZSgvICg/PSg/OiB8JCkpL2csIFwiJm5ic3A7XCIpO1xuXHRcdFx0aWYgKGkpIHtcblx0XHRcdFx0bGluZSA9IG9wZW5CbG9jayArIChsaW5lIHx8IFwiPEJSPlwiKSArIGNsb3NlQmxvY2s7XG5cdFx0XHR9XG5cdFx0XHRsaW5lc1tpXSA9IGxpbmU7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmluc2VydEhUTUwobGluZXMuam9pbihcIlwiKSwgaXNQYXN0ZSk7XG5cdH1cblxuXHRnZXRTZWxlY3RlZFRleHQocmFuZ2UpIHtcblx0XHRyZXR1cm4gZ2V0VGV4dENvbnRlbnRzT2ZSYW5nZShyYW5nZSB8fCB0aGlzLmdldFNlbGVjdGlvbigpKTtcblx0fVxuXG5cdC8vIC0tLSBJbmxpbmUgZm9ybWF0dGluZ1xuXHQvKipcblx0ICogRXh0cmFjdHMgdGhlIGZvbnQtZmFtaWx5IGFuZCBmb250LXNpemUgKGlmIGFueSkgb2YgdGhlIGVsZW1lbnRcblx0ICogaG9sZGluZyB0aGUgY3Vyc29yLiBJZiB0aGVyZSdzIGEgc2VsZWN0aW9uLCByZXR1cm5zIGFuIGVtcHR5IG9iamVjdC5cblx0ICovXG5cdGdldEZvbnRJbmZvKHJhbmdlKSB7XG5cdFx0Y29uc3QgZm9udEluZm8gPSB7XG5cdFx0XHRjb2xvcjogdm9pZCAwLFxuXHRcdFx0YmFja2dyb3VuZENvbG9yOiB2b2lkIDAsXG5cdFx0XHRmb250RmFtaWx5OiB2b2lkIDAsXG5cdFx0XHRmb250U2l6ZTogdm9pZCAwXG5cdFx0fTtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGxldCBzZWVuQXR0cmlidXRlcyA9IDA7XG5cdFx0bGV0IGVsZW1lbnQgPSByYW5nZS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjtcblx0XHRpZiAocmFuZ2UuY29sbGFwc2VkIHx8IGVsZW1lbnQgaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHdoaWxlIChzZWVuQXR0cmlidXRlcyA8IDQgJiYgZWxlbWVudCkge1xuXHRcdFx0XHRjb25zdCBzdHlsZSA9IGVsZW1lbnQuc3R5bGU7XG5cdFx0XHRcdGlmIChzdHlsZSkge1xuXHRcdFx0XHRcdGNvbnN0IGNvbG9yID0gc3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0aWYgKCFmb250SW5mby5jb2xvciAmJiBjb2xvcikge1xuXHRcdFx0XHRcdFx0Zm9udEluZm8uY29sb3IgPSBjb2xvcjtcblx0XHRcdFx0XHRcdHNlZW5BdHRyaWJ1dGVzICs9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnN0IGJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRpZiAoIWZvbnRJbmZvLmJhY2tncm91bmRDb2xvciAmJiBiYWNrZ3JvdW5kQ29sb3IpIHtcblx0XHRcdFx0XHRcdGZvbnRJbmZvLmJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdHNlZW5BdHRyaWJ1dGVzICs9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnN0IGZvbnRGYW1pbHkgPSBzdHlsZS5mb250RmFtaWx5O1xuXHRcdFx0XHRcdGlmICghZm9udEluZm8uZm9udEZhbWlseSAmJiBmb250RmFtaWx5KSB7XG5cdFx0XHRcdFx0XHRmb250SW5mby5mb250RmFtaWx5ID0gZm9udEZhbWlseTtcblx0XHRcdFx0XHRcdHNlZW5BdHRyaWJ1dGVzICs9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnN0IGZvbnRTaXplID0gc3R5bGUuZm9udFNpemU7XG5cdFx0XHRcdFx0aWYgKCFmb250SW5mby5mb250U2l6ZSAmJiBmb250U2l6ZSkge1xuXHRcdFx0XHRcdFx0Zm9udEluZm8uZm9udFNpemUgPSBmb250U2l6ZTtcblx0XHRcdFx0XHRcdHNlZW5BdHRyaWJ1dGVzICs9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmb250SW5mbztcblx0fVxuXG5cdC8qKlxuXHQgKiBMb29rcyBmb3IgbWF0Y2hpbmcgdGFnIGFuZCBhdHRyaWJ1dGVzLCBzbyB3b24ndCB3b3JrIGlmIDxzdHJvbmc+XG5cdCAqIGluc3RlYWQgb2YgPGI+IGV0Yy5cblx0ICovXG5cdGhhc0Zvcm1hdCh0YWcsIGF0dHJpYnV0ZXMsIHJhbmdlKSB7XG5cdFx0dGFnID0gdGFnLnRvVXBwZXJDYXNlKCk7XG5cdFx0aWYgKCFhdHRyaWJ1dGVzKSB7XG5cdFx0XHRhdHRyaWJ1dGVzID0ge307XG5cdFx0fVxuXHRcdGlmICghcmFuZ2UpIHtcblx0XHRcdHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHR9XG5cdFx0aWYgKCFyYW5nZS5jb2xsYXBzZWQgJiYgcmFuZ2Uuc3RhcnRDb250YWluZXIgaW5zdGFuY2VvZiBUZXh0ICYmIHJhbmdlLnN0YXJ0T2Zmc2V0ID09PSByYW5nZS5zdGFydENvbnRhaW5lci5sZW5ndGggJiYgcmFuZ2Uuc3RhcnRDb250YWluZXIubmV4dFNpYmxpbmcpIHtcblx0XHRcdHJhbmdlLnNldFN0YXJ0QmVmb3JlKHJhbmdlLnN0YXJ0Q29udGFpbmVyLm5leHRTaWJsaW5nKTtcblx0XHR9XG5cdFx0aWYgKCFyYW5nZS5jb2xsYXBzZWQgJiYgcmFuZ2UuZW5kQ29udGFpbmVyIGluc3RhbmNlb2YgVGV4dCAmJiByYW5nZS5lbmRPZmZzZXQgPT09IDAgJiYgcmFuZ2UuZW5kQ29udGFpbmVyLnByZXZpb3VzU2libGluZykge1xuXHRcdFx0cmFuZ2Uuc2V0RW5kQWZ0ZXIocmFuZ2UuZW5kQ29udGFpbmVyLnByZXZpb3VzU2libGluZyk7XG5cdFx0fVxuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLl9yb290O1xuXHRcdGNvbnN0IGNvbW1vbiA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXHRcdGlmIChnZXROZWFyZXN0KGNvbW1vbiwgcm9vdCwgdGFnLCBhdHRyaWJ1dGVzKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdGlmIChjb21tb24gaW5zdGFuY2VvZiBUZXh0KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGNvbnN0IHdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoY29tbW9uLCBTSE9XX1RFWFQsIChub2RlMikgPT4ge1xuXHRcdFx0cmV0dXJuIGlzTm9kZUNvbnRhaW5lZEluUmFuZ2UocmFuZ2UsIG5vZGUyLCB0cnVlKTtcblx0XHR9KTtcblx0XHRsZXQgc2Vlbk5vZGUgPSBmYWxzZTtcblx0XHRsZXQgbm9kZTtcblx0XHR3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XG5cdFx0XHRpZiAoIWdldE5lYXJlc3Qobm9kZSwgcm9vdCwgdGFnLCBhdHRyaWJ1dGVzKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRzZWVuTm9kZSA9IHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBzZWVuTm9kZTtcblx0fVxuXG5cdGNoYW5nZUZvcm1hdChhZGQsIHJlbW92ZSwgcmFuZ2UsIHBhcnRpYWwpIHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdHRoaXMuc2F2ZVVuZG9TdGF0ZShyYW5nZSk7XG5cdFx0aWYgKHJlbW92ZSkge1xuXHRcdFx0cmFuZ2UgPSB0aGlzLl9yZW1vdmVGb3JtYXQoXG5cdFx0XHRcdFx0cmVtb3ZlLnRhZy50b1VwcGVyQ2FzZSgpLFxuXHRcdFx0XHRcdHJlbW92ZS5hdHRyaWJ1dGVzIHx8IHt9LFxuXHRcdFx0XHRcdHJhbmdlLFxuXHRcdFx0XHRcdHBhcnRpYWxcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmIChhZGQpIHtcblx0XHRcdHJhbmdlID0gdGhpcy5fYWRkRm9ybWF0KFxuXHRcdFx0XHRcdGFkZC50YWcudG9VcHBlckNhc2UoKSxcblx0XHRcdFx0XHRhZGQuYXR0cmlidXRlcyB8fCB7fSxcblx0XHRcdFx0XHRyYW5nZVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdHRoaXMuX3VwZGF0ZVBhdGgocmFuZ2UsIHRydWUpO1xuXHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdH1cblxuXHRfYWRkRm9ybWF0KHRhZywgYXR0cmlidXRlcywgcmFuZ2UpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRpZiAocmFuZ2UuY29sbGFwc2VkKSB7XG5cdFx0XHRjb25zdCBlbCA9IGZpeEN1cnNvcihjcmVhdGVFbGVtZW50KHRhZywgYXR0cmlidXRlcykpO1xuXHRcdFx0aW5zZXJ0Tm9kZUluUmFuZ2UocmFuZ2UsIGVsKTtcblx0XHRcdGNvbnN0IGZvY3VzTm9kZSA9IGVsLmZpcnN0Q2hpbGQgfHwgZWw7XG5cdFx0XHRjb25zdCBmb2N1c09mZnNldCA9IGZvY3VzTm9kZSBpbnN0YW5jZW9mIFRleHQgPyBmb2N1c05vZGUubGVuZ3RoIDogMDtcblx0XHRcdHJhbmdlLnNldFN0YXJ0KGZvY3VzTm9kZSwgZm9jdXNPZmZzZXQpO1xuXHRcdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0XHRsZXQgYmxvY2sgPSBlbDtcblx0XHRcdHdoaWxlIChpc0lubGluZShibG9jaykpIHtcblx0XHRcdFx0YmxvY2sgPSBibG9jay5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmVtb3ZlWldTKGJsb2NrLCBlbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoXG5cdFx0XHRcdFx0cmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIsXG5cdFx0XHRcdFx0U0hPV19FTEVNRU5UX09SX1RFWFQsXG5cdFx0XHRcdFx0KG5vZGUpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiAobm9kZSBpbnN0YW5jZW9mIFRleHQgfHwgbm9kZS5ub2RlTmFtZSA9PT0gXCJCUlwiIHx8IG5vZGUubm9kZU5hbWUgPT09IFwiSU1HXCIpICYmIGlzTm9kZUNvbnRhaW5lZEluUmFuZ2UocmFuZ2UsIG5vZGUsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdCk7XG5cdFx0XHRsZXQge3N0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCwgZW5kQ29udGFpbmVyLCBlbmRPZmZzZXR9ID0gcmFuZ2U7XG5cdFx0XHR3YWxrZXIuY3VycmVudE5vZGUgPSBzdGFydENvbnRhaW5lcjtcblx0XHRcdGlmICghKHN0YXJ0Q29udGFpbmVyIGluc3RhbmNlb2YgRWxlbWVudCkgJiYgIShzdGFydENvbnRhaW5lciBpbnN0YW5jZW9mIFRleHQpIHx8ICF3YWxrZXIuZmlsdGVyKHN0YXJ0Q29udGFpbmVyKSkge1xuXHRcdFx0XHRjb25zdCBuZXh0ID0gd2Fsa2VyLm5leHROb2RlKCk7XG5cdFx0XHRcdGlmICghbmV4dCkge1xuXHRcdFx0XHRcdHJldHVybiByYW5nZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzdGFydENvbnRhaW5lciA9IG5leHQ7XG5cdFx0XHRcdHN0YXJ0T2Zmc2V0ID0gMDtcblx0XHRcdH1cblx0XHRcdGRvIHtcblx0XHRcdFx0bGV0IG5vZGUgPSB3YWxrZXIuY3VycmVudE5vZGU7XG5cdFx0XHRcdGNvbnN0IG5lZWRzRm9ybWF0ID0gIWdldE5lYXJlc3Qobm9kZSwgcm9vdCwgdGFnLCBhdHRyaWJ1dGVzKTtcblx0XHRcdFx0aWYgKG5lZWRzRm9ybWF0KSB7XG5cdFx0XHRcdFx0aWYgKG5vZGUgPT09IGVuZENvbnRhaW5lciAmJiBub2RlLmxlbmd0aCA+IGVuZE9mZnNldCkge1xuXHRcdFx0XHRcdFx0bm9kZS5zcGxpdFRleHQoZW5kT2Zmc2V0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKG5vZGUgPT09IHN0YXJ0Q29udGFpbmVyICYmIHN0YXJ0T2Zmc2V0KSB7XG5cdFx0XHRcdFx0XHRub2RlID0gbm9kZS5zcGxpdFRleHQoc3RhcnRPZmZzZXQpO1xuXHRcdFx0XHRcdFx0aWYgKGVuZENvbnRhaW5lciA9PT0gc3RhcnRDb250YWluZXIpIHtcblx0XHRcdFx0XHRcdFx0ZW5kQ29udGFpbmVyID0gbm9kZTtcblx0XHRcdFx0XHRcdFx0ZW5kT2Zmc2V0IC09IHN0YXJ0T2Zmc2V0O1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChlbmRDb250YWluZXIgPT09IHN0YXJ0Q29udGFpbmVyLnBhcmVudE5vZGUpIHtcblx0XHRcdFx0XHRcdFx0ZW5kT2Zmc2V0ICs9IDE7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRzdGFydENvbnRhaW5lciA9IG5vZGU7XG5cdFx0XHRcdFx0XHRzdGFydE9mZnNldCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNvbnN0IGVsID0gY3JlYXRlRWxlbWVudCh0YWcsIGF0dHJpYnV0ZXMpO1xuXHRcdFx0XHRcdHJlcGxhY2VXaXRoKG5vZGUsIGVsKTtcblx0XHRcdFx0XHRlbC5hcHBlbmRDaGlsZChub2RlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSB3aGlsZSAod2Fsa2VyLm5leHROb2RlKCkpO1xuXHRcdFx0cmFuZ2UgPSBjcmVhdGVSYW5nZShcblx0XHRcdFx0XHRzdGFydENvbnRhaW5lcixcblx0XHRcdFx0XHRzdGFydE9mZnNldCxcblx0XHRcdFx0XHRlbmRDb250YWluZXIsXG5cdFx0XHRcdFx0ZW5kT2Zmc2V0XG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmFuZ2U7XG5cdH1cblxuXHRfcmVtb3ZlRm9ybWF0KHRhZywgYXR0cmlidXRlcywgcmFuZ2UsIHBhcnRpYWwpIHtcblx0XHR0aGlzLl9zYXZlUmFuZ2VUb0Jvb2ttYXJrKHJhbmdlKTtcblx0XHRsZXQgZml4ZXI7XG5cdFx0aWYgKHJhbmdlLmNvbGxhcHNlZCkge1xuXHRcdFx0aWYgKGNhbnRGb2N1c0VtcHR5VGV4dE5vZGVzKSB7XG5cdFx0XHRcdGZpeGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoWldTKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZpeGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cdFx0XHR9XG5cdFx0XHRpbnNlcnROb2RlSW5SYW5nZShyYW5nZSwgZml4ZXIpO1xuXHRcdH1cblx0XHRsZXQgcm9vdCA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXHRcdHdoaWxlIChpc0lubGluZShyb290KSkge1xuXHRcdFx0cm9vdCA9IHJvb3QucGFyZW50Tm9kZTtcblx0XHR9XG5cdFx0Y29uc3Qgc3RhcnRDb250YWluZXIgPSByYW5nZS5zdGFydENvbnRhaW5lcjtcblx0XHRjb25zdCBzdGFydE9mZnNldCA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRcdGNvbnN0IGVuZENvbnRhaW5lciA9IHJhbmdlLmVuZENvbnRhaW5lcjtcblx0XHRjb25zdCBlbmRPZmZzZXQgPSByYW5nZS5lbmRPZmZzZXQ7XG5cdFx0Y29uc3QgdG9XcmFwID0gW107XG5cdFx0Y29uc3QgZXhhbWluZU5vZGUgPSAobm9kZSwgZXhlbXBsYXIpID0+IHtcblx0XHRcdGlmIChpc05vZGVDb250YWluZWRJblJhbmdlKHJhbmdlLCBub2RlLCBmYWxzZSkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0bGV0IGNoaWxkO1xuXHRcdFx0bGV0IG5leHQ7XG5cdFx0XHRpZiAoIWlzTm9kZUNvbnRhaW5lZEluUmFuZ2UocmFuZ2UsIG5vZGUsIHRydWUpKSB7XG5cdFx0XHRcdGlmICghKG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSAmJiAoIShub2RlIGluc3RhbmNlb2YgVGV4dCkgfHwgbm9kZS5kYXRhKSkge1xuXHRcdFx0XHRcdHRvV3JhcC5wdXNoKFtleGVtcGxhciwgbm9kZV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmIChub2RlIGluc3RhbmNlb2YgVGV4dCkge1xuXHRcdFx0XHRpZiAobm9kZSA9PT0gZW5kQ29udGFpbmVyICYmIGVuZE9mZnNldCAhPT0gbm9kZS5sZW5ndGgpIHtcblx0XHRcdFx0XHR0b1dyYXAucHVzaChbZXhlbXBsYXIsIG5vZGUuc3BsaXRUZXh0KGVuZE9mZnNldCldKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobm9kZSA9PT0gc3RhcnRDb250YWluZXIgJiYgc3RhcnRPZmZzZXQpIHtcblx0XHRcdFx0XHRub2RlLnNwbGl0VGV4dChzdGFydE9mZnNldCk7XG5cdFx0XHRcdFx0dG9XcmFwLnB1c2goW2V4ZW1wbGFyLCBub2RlXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZvciAoY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7IGNoaWxkOyBjaGlsZCA9IG5leHQpIHtcblx0XHRcdFx0XHRuZXh0ID0gY2hpbGQubmV4dFNpYmxpbmc7XG5cdFx0XHRcdFx0ZXhhbWluZU5vZGUoY2hpbGQsIGV4ZW1wbGFyKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y29uc3QgZm9ybWF0VGFncyA9IEFycmF5LmZyb20oXG5cdFx0XHRcdHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKVxuXHRcdCkuZmlsdGVyKChlbCkgPT4ge1xuXHRcdFx0cmV0dXJuIGlzTm9kZUNvbnRhaW5lZEluUmFuZ2UocmFuZ2UsIGVsLCB0cnVlKSAmJiBoYXNUYWdBdHRyaWJ1dGVzKGVsLCB0YWcsIGF0dHJpYnV0ZXMpO1xuXHRcdH0pO1xuXHRcdGlmICghcGFydGlhbCkge1xuXHRcdFx0Zm9ybWF0VGFncy5mb3JFYWNoKChub2RlKSA9PiB7XG5cdFx0XHRcdGV4YW1pbmVOb2RlKG5vZGUsIG5vZGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHRvV3JhcC5mb3JFYWNoKChbZWwsIG5vZGVdKSA9PiB7XG5cdFx0XHRlbCA9IGVsLmNsb25lTm9kZShmYWxzZSk7XG5cdFx0XHRyZXBsYWNlV2l0aChub2RlLCBlbCk7XG5cdFx0XHRlbC5hcHBlbmRDaGlsZChub2RlKTtcblx0XHR9KTtcblx0XHRmb3JtYXRUYWdzLmZvckVhY2goKGVsKSA9PiB7XG5cdFx0XHRyZXBsYWNlV2l0aChlbCwgZW1wdHkoZWwpKTtcblx0XHR9KTtcblx0XHRpZiAoY2FudEZvY3VzRW1wdHlUZXh0Tm9kZXMgJiYgZml4ZXIpIHtcblx0XHRcdGZpeGVyID0gZml4ZXIucGFyZW50Tm9kZTtcblx0XHRcdGxldCBibG9jayA9IGZpeGVyO1xuXHRcdFx0d2hpbGUgKGJsb2NrICYmIGlzSW5saW5lKGJsb2NrKSkge1xuXHRcdFx0XHRibG9jayA9IGJsb2NrLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYmxvY2spIHtcblx0XHRcdFx0cmVtb3ZlWldTKGJsb2NrLCBmaXhlcik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuX2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsocmFuZ2UpO1xuXHRcdGlmIChmaXhlcikge1xuXHRcdFx0cmFuZ2UuY29sbGFwc2UoZmFsc2UpO1xuXHRcdH1cblx0XHRtZXJnZUlubGluZXMocm9vdCwgcmFuZ2UpO1xuXHRcdHJldHVybiByYW5nZTtcblx0fVxuXG5cdC8vIC0tLVxuXHRib2xkKCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdCh7dGFnOiBcIkJcIn0pO1xuXHR9XG5cblx0cmVtb3ZlQm9sZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQobnVsbCwge3RhZzogXCJCXCJ9KTtcblx0fVxuXG5cdGl0YWxpYygpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQoe3RhZzogXCJJXCJ9KTtcblx0fVxuXG5cdHJlbW92ZUl0YWxpYygpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQobnVsbCwge3RhZzogXCJJXCJ9KTtcblx0fVxuXG5cdHVuZGVybGluZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQoe3RhZzogXCJVXCJ9KTtcblx0fVxuXG5cdHJlbW92ZVVuZGVybGluZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQobnVsbCwge3RhZzogXCJVXCJ9KTtcblx0fVxuXG5cdHN0cmlrZXRocm91Z2goKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2hhbmdlRm9ybWF0KHt0YWc6IFwiU1wifSk7XG5cdH1cblxuXHRyZW1vdmVTdHJpa2V0aHJvdWdoKCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChudWxsLCB7dGFnOiBcIlNcIn0pO1xuXHR9XG5cblx0c3Vic2NyaXB0KCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdCh7dGFnOiBcIlNVQlwifSwge3RhZzogXCJTVVBcIn0pO1xuXHR9XG5cblx0cmVtb3ZlU3Vic2NyaXB0KCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChudWxsLCB7dGFnOiBcIlNVQlwifSk7XG5cdH1cblxuXHRzdXBlcnNjcmlwdCgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQoe3RhZzogXCJTVVBcIn0sIHt0YWc6IFwiU1VCXCJ9KTtcblx0fVxuXG5cdHJlbW92ZVN1cGVyc2NyaXB0KCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChudWxsLCB7dGFnOiBcIlNVUFwifSk7XG5cdH1cblxuXHQvLyAtLS1cblx0bWFrZUxpbmsodXJsLCBhdHRyaWJ1dGVzKSB7XG5cdFx0Y29uc3QgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRcdGlmIChyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRcdGxldCBwcm90b2NvbEVuZCA9IHVybC5pbmRleE9mKFwiOlwiKSArIDE7XG5cdFx0XHRpZiAocHJvdG9jb2xFbmQpIHtcblx0XHRcdFx0d2hpbGUgKHVybFtwcm90b2NvbEVuZF0gPT09IFwiL1wiKSB7XG5cdFx0XHRcdFx0cHJvdG9jb2xFbmQgKz0gMTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aW5zZXJ0Tm9kZUluUmFuZ2UoXG5cdFx0XHRcdFx0cmFuZ2UsXG5cdFx0XHRcdFx0ZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodXJsLnNsaWNlKHByb3RvY29sRW5kKSlcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aHJlZjogdXJsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy50YWdBdHRyaWJ1dGVzLmEsXG5cdFx0XHRcdGF0dHJpYnV0ZXNcblx0XHQpO1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogXCJBXCIsXG5cdFx0XHRcdFx0YXR0cmlidXRlc1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGFnOiBcIkFcIlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRyYW5nZVxuXHRcdCk7XG5cdH1cblxuXHRyZW1vdmVMaW5rKCkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogXCJBXCJcblx0XHRcdFx0fSxcblx0XHRcdFx0dGhpcy5nZXRTZWxlY3Rpb24oKSxcblx0XHRcdFx0dHJ1ZVxuXHRcdCk7XG5cdH1cblxuXHRhZGREZXRlY3RlZExpbmtzKHNlYXJjaEluTm9kZSwgcm9vdCkge1xuXHRcdGNvbnN0IHdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3IoXG5cdFx0XHRcdHNlYXJjaEluTm9kZSxcblx0XHRcdFx0U0hPV19URVhULFxuXHRcdFx0XHQobm9kZTIpID0+ICFnZXROZWFyZXN0KG5vZGUyLCByb290IHx8IHRoaXMuX3Jvb3QsIFwiQVwiKVxuXHRcdCk7XG5cdFx0Y29uc3QgbGlua1JlZ0V4cCA9IHRoaXMubGlua1JlZ0V4cDtcblx0XHRjb25zdCBkZWZhdWx0QXR0cmlidXRlcyA9IHRoaXMuX2NvbmZpZy50YWdBdHRyaWJ1dGVzLmE7XG5cdFx0bGV0IG5vZGU7XG5cdFx0d2hpbGUgKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0Y29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0bGV0IGRhdGEgPSBub2RlLmRhdGE7XG5cdFx0XHRsZXQgbWF0Y2g7XG5cdFx0XHR3aGlsZSAobWF0Y2ggPSBsaW5rUmVnRXhwLmV4ZWMoZGF0YSkpIHtcblx0XHRcdFx0Y29uc3QgaW5kZXggPSBtYXRjaC5pbmRleDtcblx0XHRcdFx0Y29uc3QgZW5kSW5kZXggPSBpbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblx0XHRcdFx0aWYgKGluZGV4KSB7XG5cdFx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZShcblx0XHRcdFx0XHRcdFx0ZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YS5zbGljZSgwLCBpbmRleCkpLFxuXHRcdFx0XHRcdFx0XHRub2RlXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBjaGlsZCA9IGNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHRcIkFcIixcblx0XHRcdFx0XHRcdE9iamVjdC5hc3NpZ24oXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0aHJlZjogbWF0Y2hbMV0gPyAvXig/Omh0fGYpdHBzPzovaS50ZXN0KG1hdGNoWzFdKSA/IG1hdGNoWzFdIDogXCJodHRwOi8vXCIgKyBtYXRjaFsxXSA6IFwibWFpbHRvOlwiICsgbWF0Y2hbMF1cblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdGRlZmF1bHRBdHRyaWJ1dGVzXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGNoaWxkLnRleHRDb250ZW50ID0gZGF0YS5zbGljZShpbmRleCwgZW5kSW5kZXgpO1xuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBub2RlKTtcblx0XHRcdFx0bm9kZS5kYXRhID0gZGF0YSA9IGRhdGEuc2xpY2UoZW5kSW5kZXgpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8vIC0tLVxuXHRzZXRGb250RmFjZShuYW1lKSB7XG5cdFx0Y29uc3QgY2xhc3NOYW1lID0gdGhpcy5fY29uZmlnLmNsYXNzTmFtZXMuZm9udEZhbWlseTtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VGb3JtYXQoXG5cdFx0XHRcdG5hbWUgPyB7XG5cdFx0XHRcdFx0dGFnOiBcIlNQQU5cIixcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiB7XG5cdFx0XHRcdFx0XHRjbGFzczogY2xhc3NOYW1lLFxuXHRcdFx0XHRcdFx0c3R5bGU6IFwiZm9udC1mYW1pbHk6IFwiICsgbmFtZSArIFwiLCBzYW5zLXNlcmlmO1wiXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IDogbnVsbCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogXCJTUEFOXCIsXG5cdFx0XHRcdFx0YXR0cmlidXRlczoge2NsYXNzOiBjbGFzc05hbWV9XG5cdFx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblx0c2V0Rm9udFNpemUoc2l6ZSkge1xuXHRcdGNvbnN0IGNsYXNzTmFtZSA9IHRoaXMuX2NvbmZpZy5jbGFzc05hbWVzLmZvbnRTaXplO1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZUZvcm1hdChcblx0XHRcdFx0c2l6ZSA/IHtcblx0XHRcdFx0XHR0YWc6IFwiU1BBTlwiLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IHtcblx0XHRcdFx0XHRcdGNsYXNzOiBjbGFzc05hbWUsXG5cdFx0XHRcdFx0XHRzdHlsZTogXCJmb250LXNpemU6IFwiICsgKHR5cGVvZiBzaXplID09PSBcIm51bWJlclwiID8gc2l6ZSArIFwicHhcIiA6IHNpemUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IDogbnVsbCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogXCJTUEFOXCIsXG5cdFx0XHRcdFx0YXR0cmlidXRlczoge2NsYXNzOiBjbGFzc05hbWV9XG5cdFx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblx0c2V0VGV4dENvbG9yKGNvbG9yKSB7XG5cdFx0Y29uc3QgY2xhc3NOYW1lID0gdGhpcy5fY29uZmlnLmNsYXNzTmFtZXMuY29sb3I7XG5cdFx0cmV0dXJuIHRoaXMuY2hhbmdlRm9ybWF0KFxuXHRcdFx0XHRjb2xvciA/IHtcblx0XHRcdFx0XHR0YWc6IFwiU1BBTlwiLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IHtcblx0XHRcdFx0XHRcdGNsYXNzOiBjbGFzc05hbWUsXG5cdFx0XHRcdFx0XHRzdHlsZTogXCJjb2xvcjpcIiArIGNvbG9yXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IDogbnVsbCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogXCJTUEFOXCIsXG5cdFx0XHRcdFx0YXR0cmlidXRlczoge2NsYXNzOiBjbGFzc05hbWV9XG5cdFx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblx0c2V0SGlnaGxpZ2h0Q29sb3IoY29sb3IpIHtcblx0XHRjb25zdCBjbGFzc05hbWUgPSB0aGlzLl9jb25maWcuY2xhc3NOYW1lcy5oaWdobGlnaHQ7XG5cdFx0cmV0dXJuIHRoaXMuY2hhbmdlRm9ybWF0KFxuXHRcdFx0XHRjb2xvciA/IHtcblx0XHRcdFx0XHR0YWc6IFwiU1BBTlwiLFxuXHRcdFx0XHRcdGF0dHJpYnV0ZXM6IHtcblx0XHRcdFx0XHRcdGNsYXNzOiBjbGFzc05hbWUsXG5cdFx0XHRcdFx0XHRzdHlsZTogXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgY29sb3Jcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gOiBudWxsLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGFnOiBcIlNQQU5cIixcblx0XHRcdFx0XHRhdHRyaWJ1dGVzOiB7Y2xhc3M6IGNsYXNzTmFtZX1cblx0XHRcdFx0fVxuXHRcdCk7XG5cdH1cblxuXHQvLyAtLS0gQmxvY2sgZm9ybWF0dGluZ1xuXHRfZW5zdXJlQm90dG9tTGluZSgpIHtcblx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRjb25zdCBsYXN0ID0gcm9vdC5sYXN0RWxlbWVudENoaWxkO1xuXHRcdGlmICghbGFzdCB8fCBsYXN0Lm5vZGVOYW1lICE9PSB0aGlzLl9jb25maWcuYmxvY2tUYWcgfHwgIWlzQmxvY2sobGFzdCkpIHtcblx0XHRcdHJvb3QuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVEZWZhdWx0QmxvY2soKSk7XG5cdFx0fVxuXHR9XG5cblx0Y3JlYXRlRGVmYXVsdEJsb2NrKGNoaWxkcmVuKSB7XG5cdFx0Y29uc3QgY29uZmlnID0gdGhpcy5fY29uZmlnO1xuXHRcdHJldHVybiBmaXhDdXJzb3IoXG5cdFx0XHRcdGNyZWF0ZUVsZW1lbnQoY29uZmlnLmJsb2NrVGFnLCBjb25maWcuYmxvY2tBdHRyaWJ1dGVzLCBjaGlsZHJlbilcblx0XHQpO1xuXHR9XG5cblx0c3BsaXRCbG9jayhsaW5lQnJlYWtPbmx5LCByYW5nZSkge1xuXHRcdGlmICghcmFuZ2UpIHtcblx0XHRcdHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHR9XG5cdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0bGV0IGJsb2NrO1xuXHRcdGxldCBwYXJlbnQ7XG5cdFx0bGV0IG5vZGU7XG5cdFx0bGV0IG5vZGVBZnRlclNwbGl0O1xuXHRcdHRoaXMuX3JlY29yZFVuZG9TdGF0ZShyYW5nZSk7XG5cdFx0dGhpcy5fcmVtb3ZlWldTKCk7XG5cdFx0dGhpcy5fZ2V0UmFuZ2VBbmRSZW1vdmVCb29rbWFyayhyYW5nZSk7XG5cdFx0aWYgKCFyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRcdGRlbGV0ZUNvbnRlbnRzT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLl9jb25maWcuYWRkTGlua3MpIHtcblx0XHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNEb3duVHJlZShyYW5nZSk7XG5cdFx0XHRjb25zdCB0ZXh0Tm9kZSA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRcdFx0Y29uc3Qgb2Zmc2V0MiA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdGxpbmtpZnlUZXh0KHRoaXMsIHRleHROb2RlLCBvZmZzZXQyKTtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHRibG9jayA9IGdldFN0YXJ0QmxvY2tPZlJhbmdlKHJhbmdlLCByb290KTtcblx0XHRpZiAoYmxvY2sgJiYgKHBhcmVudCA9IGdldE5lYXJlc3QoYmxvY2ssIHJvb3QsIFwiUFJFXCIpKSkge1xuXHRcdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHRcdG5vZGUgPSByYW5nZS5zdGFydENvbnRhaW5lcjtcblx0XHRcdGNvbnN0IG9mZnNldDIgPSByYW5nZS5zdGFydE9mZnNldDtcblx0XHRcdGlmICghKG5vZGUgaW5zdGFuY2VvZiBUZXh0KSkge1xuXHRcdFx0XHRub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cdFx0XHRcdHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50LmZpcnN0Q2hpbGQpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFsaW5lQnJlYWtPbmx5ICYmIG5vZGUgaW5zdGFuY2VvZiBUZXh0ICYmIChub2RlLmRhdGEuY2hhckF0KG9mZnNldDIgLSAxKSA9PT0gXCJcXG5cIiB8fCByYW5nZURvZXNTdGFydEF0QmxvY2tCb3VuZGFyeShyYW5nZSwgcm9vdCkpICYmIChub2RlLmRhdGEuY2hhckF0KG9mZnNldDIpID09PSBcIlxcblwiIHx8IHJhbmdlRG9lc0VuZEF0QmxvY2tCb3VuZGFyeShyYW5nZSwgcm9vdCkpKSB7XG5cdFx0XHRcdG5vZGUuZGVsZXRlRGF0YShvZmZzZXQyICYmIG9mZnNldDIgLSAxLCBvZmZzZXQyID8gMiA6IDEpO1xuXHRcdFx0XHRub2RlQWZ0ZXJTcGxpdCA9IHNwbGl0KFxuXHRcdFx0XHRcdFx0bm9kZSxcblx0XHRcdFx0XHRcdG9mZnNldDIgJiYgb2Zmc2V0MiAtIDEsXG5cdFx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdFx0cm9vdFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRub2RlID0gbm9kZUFmdGVyU3BsaXQucHJldmlvdXNTaWJsaW5nO1xuXHRcdFx0XHRpZiAoIW5vZGUudGV4dENvbnRlbnQpIHtcblx0XHRcdFx0XHRkZXRhY2gobm9kZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IHRoaXMuY3JlYXRlRGVmYXVsdEJsb2NrKCk7XG5cdFx0XHRcdG5vZGVBZnRlclNwbGl0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIG5vZGVBZnRlclNwbGl0KTtcblx0XHRcdFx0aWYgKCFub2RlQWZ0ZXJTcGxpdC50ZXh0Q29udGVudCkge1xuXHRcdFx0XHRcdGRldGFjaChub2RlQWZ0ZXJTcGxpdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnQobm9kZSwgMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub2RlLmluc2VydERhdGEob2Zmc2V0MiwgXCJcXG5cIik7XG5cdFx0XHRcdGZpeEN1cnNvcihwYXJlbnQpO1xuXHRcdFx0XHRpZiAobm9kZS5sZW5ndGggPT09IG9mZnNldDIgKyAxKSB7XG5cdFx0XHRcdFx0cmFuZ2Uuc2V0U3RhcnRBZnRlcihub2RlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyYW5nZS5zZXRTdGFydChub2RlLCBvZmZzZXQyICsgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuXHRcdFx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdFx0dGhpcy5fdXBkYXRlUGF0aChyYW5nZSwgdHJ1ZSk7XG5cdFx0XHR0aGlzLl9kb2NXYXNDaGFuZ2VkKCk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0aWYgKCFibG9jayB8fCBsaW5lQnJlYWtPbmx5IHx8IC9eVFtIRF0kLy50ZXN0KGJsb2NrLm5vZGVOYW1lKSkge1xuXHRcdFx0bW92ZVJhbmdlQm91bmRhcnlPdXRPZihyYW5nZSwgXCJBXCIsIHJvb3QpO1xuXHRcdFx0aW5zZXJ0Tm9kZUluUmFuZ2UocmFuZ2UsIGNyZWF0ZUVsZW1lbnQoXCJCUlwiKSk7XG5cdFx0XHRyYW5nZS5jb2xsYXBzZShmYWxzZSk7XG5cdFx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0XHR0aGlzLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRpZiAocGFyZW50ID0gZ2V0TmVhcmVzdChibG9jaywgcm9vdCwgXCJMSVwiKSkge1xuXHRcdFx0YmxvY2sgPSBwYXJlbnQ7XG5cdFx0fVxuXHRcdGlmIChpc0VtcHR5QmxvY2soYmxvY2spKSB7XG5cdFx0XHRpZiAoZ2V0TmVhcmVzdChibG9jaywgcm9vdCwgXCJVTFwiKSB8fCBnZXROZWFyZXN0KGJsb2NrLCByb290LCBcIk9MXCIpKSB7XG5cdFx0XHRcdHRoaXMuZGVjcmVhc2VMaXN0TGV2ZWwocmFuZ2UpO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0gZWxzZSBpZiAoZ2V0TmVhcmVzdChibG9jaywgcm9vdCwgXCJESVZcIiwgaW5kZW50ZWROb2RlQXR0cmlidXRlcykpIHtcblx0XHRcdFx0dGhpcy5yZW1vdmVJbmRlbnRhdGlvbihyYW5nZSk7XG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRub2RlID0gcmFuZ2Uuc3RhcnRDb250YWluZXI7XG5cdFx0Y29uc3Qgb2Zmc2V0ID0gcmFuZ2Uuc3RhcnRPZmZzZXQ7XG5cdFx0bGV0IHNwbGl0VGFnID0gdGhpcy50YWdBZnRlclNwbGl0W2Jsb2NrLm5vZGVOYW1lXTtcblx0XHRub2RlQWZ0ZXJTcGxpdCA9IHNwbGl0KFxuXHRcdFx0XHRub2RlLFxuXHRcdFx0XHRvZmZzZXQsXG5cdFx0XHRcdGJsb2NrLnBhcmVudE5vZGUsXG5cdFx0XHRcdHRoaXMuX3Jvb3Rcblx0XHQpO1xuXHRcdGNvbnN0IGNvbmZpZyA9IHRoaXMuX2NvbmZpZztcblx0XHRsZXQgc3BsaXRQcm9wZXJ0aWVzID0gbnVsbDtcblx0XHRpZiAoIXNwbGl0VGFnKSB7XG5cdFx0XHRzcGxpdFRhZyA9IGNvbmZpZy5ibG9ja1RhZztcblx0XHRcdHNwbGl0UHJvcGVydGllcyA9IGNvbmZpZy5ibG9ja0F0dHJpYnV0ZXM7XG5cdFx0fVxuXHRcdGlmICghaGFzVGFnQXR0cmlidXRlcyhub2RlQWZ0ZXJTcGxpdCwgc3BsaXRUYWcsIHNwbGl0UHJvcGVydGllcykpIHtcblx0XHRcdGJsb2NrID0gY3JlYXRlRWxlbWVudChzcGxpdFRhZywgc3BsaXRQcm9wZXJ0aWVzKTtcblx0XHRcdGlmIChub2RlQWZ0ZXJTcGxpdC5kaXIpIHtcblx0XHRcdFx0YmxvY2suZGlyID0gbm9kZUFmdGVyU3BsaXQuZGlyO1xuXHRcdFx0fVxuXHRcdFx0cmVwbGFjZVdpdGgobm9kZUFmdGVyU3BsaXQsIGJsb2NrKTtcblx0XHRcdGJsb2NrLmFwcGVuZENoaWxkKGVtcHR5KG5vZGVBZnRlclNwbGl0KSk7XG5cdFx0XHRub2RlQWZ0ZXJTcGxpdCA9IGJsb2NrO1xuXHRcdH1cblx0XHRyZW1vdmVaV1MoYmxvY2spO1xuXHRcdHJlbW92ZUVtcHR5SW5saW5lcyhibG9jayk7XG5cdFx0Zml4Q3Vyc29yKGJsb2NrKTtcblx0XHR3aGlsZSAobm9kZUFmdGVyU3BsaXQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG5cdFx0XHRsZXQgY2hpbGQgPSBub2RlQWZ0ZXJTcGxpdC5maXJzdENoaWxkO1xuXHRcdFx0bGV0IG5leHQ7XG5cdFx0XHRpZiAobm9kZUFmdGVyU3BsaXQubm9kZU5hbWUgPT09IFwiQVwiICYmICghbm9kZUFmdGVyU3BsaXQudGV4dENvbnRlbnQgfHwgbm9kZUFmdGVyU3BsaXQudGV4dENvbnRlbnQgPT09IFpXUykpIHtcblx0XHRcdFx0Y2hpbGQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblx0XHRcdFx0cmVwbGFjZVdpdGgobm9kZUFmdGVyU3BsaXQsIGNoaWxkKTtcblx0XHRcdFx0bm9kZUFmdGVyU3BsaXQgPSBjaGlsZDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR3aGlsZSAoY2hpbGQgJiYgY2hpbGQgaW5zdGFuY2VvZiBUZXh0ICYmICFjaGlsZC5kYXRhKSB7XG5cdFx0XHRcdG5leHQgPSBjaGlsZC5uZXh0U2libGluZztcblx0XHRcdFx0aWYgKCFuZXh0IHx8IG5leHQubm9kZU5hbWUgPT09IFwiQlJcIikge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRldGFjaChjaGlsZCk7XG5cdFx0XHRcdGNoaWxkID0gbmV4dDtcblx0XHRcdH1cblx0XHRcdGlmICghY2hpbGQgfHwgY2hpbGQubm9kZU5hbWUgPT09IFwiQlJcIiB8fCBjaGlsZCBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRub2RlQWZ0ZXJTcGxpdCA9IGNoaWxkO1xuXHRcdH1cblx0XHRyYW5nZSA9IGNyZWF0ZVJhbmdlKG5vZGVBZnRlclNwbGl0LCAwKTtcblx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0dGhpcy5fdXBkYXRlUGF0aChyYW5nZSwgdHJ1ZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRmb3JFYWNoQmxvY2soZm4sIG11dGF0ZXMsIHJhbmdlKSB7XG5cdFx0aWYgKCFyYW5nZSkge1xuXHRcdFx0cmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRcdH1cblx0XHRpZiAobXV0YXRlcykge1xuXHRcdFx0dGhpcy5zYXZlVW5kb1N0YXRlKHJhbmdlKTtcblx0XHR9XG5cdFx0Y29uc3Qgcm9vdCA9IHRoaXMuX3Jvb3Q7XG5cdFx0bGV0IHN0YXJ0ID0gZ2V0U3RhcnRCbG9ja09mUmFuZ2UocmFuZ2UsIHJvb3QpO1xuXHRcdGNvbnN0IGVuZCA9IGdldEVuZEJsb2NrT2ZSYW5nZShyYW5nZSwgcm9vdCk7XG5cdFx0aWYgKHN0YXJ0ICYmIGVuZCkge1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAoZm4oc3RhcnQpIHx8IHN0YXJ0ID09PSBlbmQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fSB3aGlsZSAoc3RhcnQgPSBnZXROZXh0QmxvY2soc3RhcnQsIHJvb3QpKTtcblx0XHR9XG5cdFx0aWYgKG11dGF0ZXMpIHtcblx0XHRcdHRoaXMuc2V0U2VsZWN0aW9uKHJhbmdlKTtcblx0XHRcdHRoaXMuX3VwZGF0ZVBhdGgocmFuZ2UsIHRydWUpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdG1vZGlmeUJsb2Nrcyhtb2RpZnksIHJhbmdlKSB7XG5cdFx0aWYgKCFyYW5nZSkge1xuXHRcdFx0cmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRcdH1cblx0XHR0aGlzLl9yZWNvcmRVbmRvU3RhdGUocmFuZ2UsIHRoaXMuX2lzSW5VbmRvU3RhdGUpO1xuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLl9yb290O1xuXHRcdGV4cGFuZFJhbmdlVG9CbG9ja0JvdW5kYXJpZXMocmFuZ2UsIHJvb3QpO1xuXHRcdG1vdmVSYW5nZUJvdW5kYXJpZXNVcFRyZWUocmFuZ2UsIHJvb3QsIHJvb3QsIHJvb3QpO1xuXHRcdGNvbnN0IGZyYWcgPSBleHRyYWN0Q29udGVudHNPZlJhbmdlKHJhbmdlLCByb290LCByb290KTtcblx0XHRpZiAoIXJhbmdlLmNvbGxhcHNlZCkge1xuXHRcdFx0bGV0IG5vZGUgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdFx0XHRpZiAobm9kZSA9PT0gcm9vdCkge1xuXHRcdFx0XHRyYW5nZS5jb2xsYXBzZShmYWxzZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3aGlsZSAobm9kZS5wYXJlbnROb2RlICE9PSByb290KSB7XG5cdFx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyYW5nZS5zZXRTdGFydEJlZm9yZShub2RlKTtcblx0XHRcdFx0cmFuZ2UuY29sbGFwc2UodHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGluc2VydE5vZGVJblJhbmdlKHJhbmdlLCBtb2RpZnkuY2FsbCh0aGlzLCBmcmFnKSk7XG5cdFx0aWYgKHJhbmdlLmVuZE9mZnNldCA8IHJhbmdlLmVuZENvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCkge1xuXHRcdFx0bWVyZ2VDb250YWluZXJzKFxuXHRcdFx0XHRcdHJhbmdlLmVuZENvbnRhaW5lci5jaGlsZE5vZGVzW3JhbmdlLmVuZE9mZnNldF0sXG5cdFx0XHRcdFx0cm9vdCxcblx0XHRcdFx0XHR0aGlzLl9jb25maWdcblx0XHRcdCk7XG5cdFx0fVxuXHRcdG1lcmdlQ29udGFpbmVycyhcblx0XHRcdFx0cmFuZ2Uuc3RhcnRDb250YWluZXIuY2hpbGROb2Rlc1tyYW5nZS5zdGFydE9mZnNldF0sXG5cdFx0XHRcdHJvb3QsXG5cdFx0XHRcdHRoaXMuX2NvbmZpZ1xuXHRcdCk7XG5cdFx0dGhpcy5fZ2V0UmFuZ2VBbmRSZW1vdmVCb29rbWFyayhyYW5nZSk7XG5cdFx0dGhpcy5zZXRTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdHRoaXMuX3VwZGF0ZVBhdGgocmFuZ2UsIHRydWUpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0Ly8gLS0tXG5cdHNldFRleHRBbGlnbm1lbnQoYWxpZ25tZW50KSB7XG5cdFx0dGhpcy5mb3JFYWNoQmxvY2soKGJsb2NrKSA9PiB7XG5cdFx0XHRjb25zdCBjbGFzc05hbWUgPSBibG9jay5jbGFzc05hbWUuc3BsaXQoL1xccysvKS5maWx0ZXIoKGtsYXNzKSA9PiB7XG5cdFx0XHRcdHJldHVybiAhIWtsYXNzICYmICEvXmFsaWduLy50ZXN0KGtsYXNzKTtcblx0XHRcdH0pLmpvaW4oXCIgXCIpO1xuXHRcdFx0aWYgKGFsaWdubWVudCkge1xuXHRcdFx0XHRibG9jay5jbGFzc05hbWUgPSBjbGFzc05hbWUgKyBcIiBhbGlnbi1cIiArIGFsaWdubWVudDtcblx0XHRcdFx0YmxvY2suc3R5bGUudGV4dEFsaWduID0gYWxpZ25tZW50O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YmxvY2suY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuXHRcdFx0XHRibG9jay5zdHlsZS50ZXh0QWxpZ24gPSBcIlwiO1xuXHRcdFx0fVxuXHRcdH0sIHRydWUpO1xuXHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdH1cblxuXHRzZXRUZXh0RGlyZWN0aW9uKGRpcmVjdGlvbikge1xuXHRcdHRoaXMuZm9yRWFjaEJsb2NrKChibG9jaykgPT4ge1xuXHRcdFx0aWYgKGRpcmVjdGlvbikge1xuXHRcdFx0XHRibG9jay5kaXIgPSBkaXJlY3Rpb247XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRibG9jay5yZW1vdmVBdHRyaWJ1dGUoXCJkaXJcIik7XG5cdFx0XHR9XG5cdFx0fSwgdHJ1ZSk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdC8vIC0tLVxuXHRfZ2V0TGlzdFNlbGVjdGlvbihyYW5nZSwgcm9vdCkge1xuXHRcdGxldCBsaXN0ID0gcmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG5cdFx0bGV0IHN0YXJ0TGkgPSByYW5nZS5zdGFydENvbnRhaW5lcjtcblx0XHRsZXQgZW5kTGkgPSByYW5nZS5lbmRDb250YWluZXI7XG5cdFx0d2hpbGUgKGxpc3QgJiYgbGlzdCAhPT0gcm9vdCAmJiAhL15bT1VdTCQvLnRlc3QobGlzdC5ub2RlTmFtZSkpIHtcblx0XHRcdGxpc3QgPSBsaXN0LnBhcmVudE5vZGU7XG5cdFx0fVxuXHRcdGlmICghbGlzdCB8fCBsaXN0ID09PSByb290KSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYgKHN0YXJ0TGkgPT09IGxpc3QpIHtcblx0XHRcdHN0YXJ0TGkgPSBzdGFydExpLmNoaWxkTm9kZXNbcmFuZ2Uuc3RhcnRPZmZzZXRdO1xuXHRcdH1cblx0XHRpZiAoZW5kTGkgPT09IGxpc3QpIHtcblx0XHRcdGVuZExpID0gZW5kTGkuY2hpbGROb2Rlc1tyYW5nZS5lbmRPZmZzZXRdO1xuXHRcdH1cblx0XHR3aGlsZSAoc3RhcnRMaSAmJiBzdGFydExpLnBhcmVudE5vZGUgIT09IGxpc3QpIHtcblx0XHRcdHN0YXJ0TGkgPSBzdGFydExpLnBhcmVudE5vZGU7XG5cdFx0fVxuXHRcdHdoaWxlIChlbmRMaSAmJiBlbmRMaS5wYXJlbnROb2RlICE9PSBsaXN0KSB7XG5cdFx0XHRlbmRMaSA9IGVuZExpLnBhcmVudE5vZGU7XG5cdFx0fVxuXHRcdHJldHVybiBbbGlzdCwgc3RhcnRMaSwgZW5kTGldO1xuXHR9XG5cblx0aW5jcmVhc2VMaXN0TGV2ZWwocmFuZ2UpIHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLl9yb290O1xuXHRcdGNvbnN0IGxpc3RTZWxlY3Rpb24gPSB0aGlzLl9nZXRMaXN0U2VsZWN0aW9uKHJhbmdlLCByb290KTtcblx0XHRpZiAoIWxpc3RTZWxlY3Rpb24pIHtcblx0XHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdFx0fVxuXHRcdGxldCBbbGlzdCwgc3RhcnRMaSwgZW5kTGldID0gbGlzdFNlbGVjdGlvbjtcblx0XHRpZiAoIXN0YXJ0TGkgfHwgc3RhcnRMaSA9PT0gbGlzdC5maXJzdENoaWxkKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5mb2N1cygpO1xuXHRcdH1cblx0XHR0aGlzLl9yZWNvcmRVbmRvU3RhdGUocmFuZ2UsIHRoaXMuX2lzSW5VbmRvU3RhdGUpO1xuXHRcdGNvbnN0IHR5cGUgPSBsaXN0Lm5vZGVOYW1lO1xuXHRcdGxldCBuZXdQYXJlbnQgPSBzdGFydExpLnByZXZpb3VzU2libGluZztcblx0XHRsZXQgbGlzdEF0dHJzO1xuXHRcdGxldCBuZXh0O1xuXHRcdGlmIChuZXdQYXJlbnQubm9kZU5hbWUgIT09IHR5cGUpIHtcblx0XHRcdGxpc3RBdHRycyA9IHRoaXMuX2NvbmZpZy50YWdBdHRyaWJ1dGVzW3R5cGUudG9Mb3dlckNhc2UoKV07XG5cdFx0XHRuZXdQYXJlbnQgPSBjcmVhdGVFbGVtZW50KHR5cGUsIGxpc3RBdHRycyk7XG5cdFx0XHRsaXN0Lmluc2VydEJlZm9yZShuZXdQYXJlbnQsIHN0YXJ0TGkpO1xuXHRcdH1cblx0XHRkbyB7XG5cdFx0XHRuZXh0ID0gc3RhcnRMaSA9PT0gZW5kTGkgPyBudWxsIDogc3RhcnRMaS5uZXh0U2libGluZztcblx0XHRcdG5ld1BhcmVudC5hcHBlbmRDaGlsZChzdGFydExpKTtcblx0XHR9IHdoaWxlIChzdGFydExpID0gbmV4dCk7XG5cdFx0bmV4dCA9IG5ld1BhcmVudC5uZXh0U2libGluZztcblx0XHRpZiAobmV4dCkge1xuXHRcdFx0bWVyZ2VDb250YWluZXJzKG5leHQsIHJvb3QsIHRoaXMuX2NvbmZpZyk7XG5cdFx0fVxuXHRcdHRoaXMuX2dldFJhbmdlQW5kUmVtb3ZlQm9va21hcmsocmFuZ2UpO1xuXHRcdHRoaXMuc2V0U2VsZWN0aW9uKHJhbmdlKTtcblx0XHR0aGlzLl91cGRhdGVQYXRoKHJhbmdlLCB0cnVlKTtcblx0XHRyZXR1cm4gdGhpcy5mb2N1cygpO1xuXHR9XG5cblx0ZGVjcmVhc2VMaXN0TGV2ZWwocmFuZ2UpIHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLl9yb290O1xuXHRcdGNvbnN0IGxpc3RTZWxlY3Rpb24gPSB0aGlzLl9nZXRMaXN0U2VsZWN0aW9uKHJhbmdlLCByb290KTtcblx0XHRpZiAoIWxpc3RTZWxlY3Rpb24pIHtcblx0XHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdFx0fVxuXHRcdGxldCBbbGlzdCwgc3RhcnRMaSwgZW5kTGldID0gbGlzdFNlbGVjdGlvbjtcblx0XHRpZiAoIXN0YXJ0TGkpIHtcblx0XHRcdHN0YXJ0TGkgPSBsaXN0LmZpcnN0Q2hpbGQ7XG5cdFx0fVxuXHRcdGlmICghZW5kTGkpIHtcblx0XHRcdGVuZExpID0gbGlzdC5sYXN0Q2hpbGQ7XG5cdFx0fVxuXHRcdHRoaXMuX3JlY29yZFVuZG9TdGF0ZShyYW5nZSwgdGhpcy5faXNJblVuZG9TdGF0ZSk7XG5cdFx0bGV0IG5leHQ7XG5cdFx0bGV0IGluc2VydEJlZm9yZSA9IG51bGw7XG5cdFx0aWYgKHN0YXJ0TGkpIHtcblx0XHRcdGxldCBuZXdQYXJlbnQgPSBsaXN0LnBhcmVudE5vZGU7XG5cdFx0XHRpbnNlcnRCZWZvcmUgPSAhZW5kTGkubmV4dFNpYmxpbmcgPyBsaXN0Lm5leHRTaWJsaW5nIDogc3BsaXQobGlzdCwgZW5kTGkubmV4dFNpYmxpbmcsIG5ld1BhcmVudCwgcm9vdCk7XG5cdFx0XHRpZiAobmV3UGFyZW50ICE9PSByb290ICYmIG5ld1BhcmVudC5ub2RlTmFtZSA9PT0gXCJMSVwiKSB7XG5cdFx0XHRcdG5ld1BhcmVudCA9IG5ld1BhcmVudC5wYXJlbnROb2RlO1xuXHRcdFx0XHR3aGlsZSAoaW5zZXJ0QmVmb3JlKSB7XG5cdFx0XHRcdFx0bmV4dCA9IGluc2VydEJlZm9yZS5uZXh0U2libGluZztcblx0XHRcdFx0XHRlbmRMaS5hcHBlbmRDaGlsZChpbnNlcnRCZWZvcmUpO1xuXHRcdFx0XHRcdGluc2VydEJlZm9yZSA9IG5leHQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aW5zZXJ0QmVmb3JlID0gbGlzdC5wYXJlbnROb2RlLm5leHRTaWJsaW5nO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgbWFrZU5vdExpc3QgPSAhL15bT1VdTCQvLnRlc3QobmV3UGFyZW50Lm5vZGVOYW1lKTtcblx0XHRcdGRvIHtcblx0XHRcdFx0bmV4dCA9IHN0YXJ0TGkgPT09IGVuZExpID8gbnVsbCA6IHN0YXJ0TGkubmV4dFNpYmxpbmc7XG5cdFx0XHRcdGxpc3QucmVtb3ZlQ2hpbGQoc3RhcnRMaSk7XG5cdFx0XHRcdGlmIChtYWtlTm90TGlzdCAmJiBzdGFydExpLm5vZGVOYW1lID09PSBcIkxJXCIpIHtcblx0XHRcdFx0XHRzdGFydExpID0gdGhpcy5jcmVhdGVEZWZhdWx0QmxvY2soW2VtcHR5KHN0YXJ0TGkpXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bmV3UGFyZW50Lmluc2VydEJlZm9yZShzdGFydExpLCBpbnNlcnRCZWZvcmUpO1xuXHRcdFx0fSB3aGlsZSAoc3RhcnRMaSA9IG5leHQpO1xuXHRcdH1cblx0XHRpZiAoIWxpc3QuZmlyc3RDaGlsZCkge1xuXHRcdFx0ZGV0YWNoKGxpc3QpO1xuXHRcdH1cblx0XHRpZiAoaW5zZXJ0QmVmb3JlKSB7XG5cdFx0XHRtZXJnZUNvbnRhaW5lcnMoaW5zZXJ0QmVmb3JlLCByb290LCB0aGlzLl9jb25maWcpO1xuXHRcdH1cblx0XHR0aGlzLl9nZXRSYW5nZUFuZFJlbW92ZUJvb2ttYXJrKHJhbmdlKTtcblx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0dGhpcy5fdXBkYXRlUGF0aChyYW5nZSwgdHJ1ZSk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdF9tYWtlTGlzdChmcmFnLCB0eXBlKSB7XG5cdFx0Y29uc3Qgd2Fsa2VyID0gZ2V0QmxvY2tXYWxrZXIoZnJhZywgdGhpcy5fcm9vdCk7XG5cdFx0Y29uc3QgdGFnQXR0cmlidXRlcyA9IHRoaXMuX2NvbmZpZy50YWdBdHRyaWJ1dGVzO1xuXHRcdGNvbnN0IGxpc3RBdHRycyA9IHRhZ0F0dHJpYnV0ZXNbdHlwZS50b0xvd2VyQ2FzZSgpXTtcblx0XHRjb25zdCBsaXN0SXRlbUF0dHJzID0gdGFnQXR0cmlidXRlcy5saTtcblx0XHRsZXQgbm9kZTtcblx0XHR3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpKSB7XG5cdFx0XHRpZiAobm9kZS5wYXJlbnROb2RlIGluc3RhbmNlb2YgSFRNTExJRWxlbWVudCkge1xuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0XHR3YWxrZXIuY3VycmVudE5vZGUgPSBub2RlLmxhc3RDaGlsZDtcblx0XHRcdH1cblx0XHRcdGlmICghKG5vZGUgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50KSkge1xuXHRcdFx0XHRjb25zdCBuZXdMaSA9IGNyZWF0ZUVsZW1lbnQoXCJMSVwiLCBsaXN0SXRlbUF0dHJzKTtcblx0XHRcdFx0aWYgKG5vZGUuZGlyKSB7XG5cdFx0XHRcdFx0bmV3TGkuZGlyID0gbm9kZS5kaXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgcHJldiA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xuXHRcdFx0XHRpZiAocHJldiAmJiBwcmV2Lm5vZGVOYW1lID09PSB0eXBlKSB7XG5cdFx0XHRcdFx0cHJldi5hcHBlbmRDaGlsZChuZXdMaSk7XG5cdFx0XHRcdFx0ZGV0YWNoKG5vZGUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlcGxhY2VXaXRoKG5vZGUsIGNyZWF0ZUVsZW1lbnQodHlwZSwgbGlzdEF0dHJzLCBbbmV3TGldKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0bmV3TGkuYXBwZW5kQ2hpbGQoZW1wdHkobm9kZSkpO1xuXHRcdFx0XHR3YWxrZXIuY3VycmVudE5vZGUgPSBuZXdMaTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHRcdGNvbnN0IHRhZyA9IG5vZGUubm9kZU5hbWU7XG5cdFx0XHRcdGlmICh0YWcgIT09IHR5cGUgJiYgL15bT1VdTCQvLnRlc3QodGFnKSkge1xuXHRcdFx0XHRcdHJlcGxhY2VXaXRoKFxuXHRcdFx0XHRcdFx0XHRub2RlLFxuXHRcdFx0XHRcdFx0XHRjcmVhdGVFbGVtZW50KHR5cGUsIGxpc3RBdHRycywgW2VtcHR5KG5vZGUpXSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmcmFnO1xuXHR9XG5cblx0bWFrZVVub3JkZXJlZExpc3QoKSB7XG5cdFx0dGhpcy5tb2RpZnlCbG9ja3MoKGZyYWcpID0+IHRoaXMuX21ha2VMaXN0KGZyYWcsIFwiVUxcIikpO1xuXHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdH1cblxuXHRtYWtlT3JkZXJlZExpc3QoKSB7XG5cdFx0dGhpcy5tb2RpZnlCbG9ja3MoKGZyYWcpID0+IHRoaXMuX21ha2VMaXN0KGZyYWcsIFwiT0xcIikpO1xuXHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdH1cblxuXHRyZW1vdmVMaXN0KCkge1xuXHRcdHRoaXMubW9kaWZ5QmxvY2tzKChmcmFnKSA9PiB7XG5cdFx0XHRjb25zdCBsaXN0cyA9IGZyYWcucXVlcnlTZWxlY3RvckFsbChcIlVMLCBPTFwiKTtcblx0XHRcdGNvbnN0IGl0ZW1zID0gZnJhZy5xdWVyeVNlbGVjdG9yQWxsKFwiTElcIik7XG5cdFx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRcdGZvciAobGV0IGkgPSAwLCBsID0gbGlzdHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG5cdFx0XHRcdGNvbnN0IGxpc3QgPSBsaXN0c1tpXTtcblx0XHRcdFx0Y29uc3QgbGlzdEZyYWcgPSBlbXB0eShsaXN0KTtcblx0XHRcdFx0Zml4Q29udGFpbmVyKGxpc3RGcmFnLCByb290LCB0aGlzLl9jb25maWcpO1xuXHRcdFx0XHRyZXBsYWNlV2l0aChsaXN0LCBsaXN0RnJhZyk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGxldCBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuXHRcdFx0XHRjb25zdCBpdGVtID0gaXRlbXNbaV07XG5cdFx0XHRcdGlmIChpc0Jsb2NrKGl0ZW0pKSB7XG5cdFx0XHRcdFx0cmVwbGFjZVdpdGgoaXRlbSwgdGhpcy5jcmVhdGVEZWZhdWx0QmxvY2soW2VtcHR5KGl0ZW0pXSkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZpeENvbnRhaW5lcihpdGVtLCByb290LCB0aGlzLl9jb25maWcpO1xuXHRcdFx0XHRcdHJlcGxhY2VXaXRoKGl0ZW0sIGVtcHR5KGl0ZW0pKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZyYWc7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdC8vIC0tLVxuXHRpbmNyZWFzZUluZGVudGF0aW9uTGV2ZWwocmFuZ2UpIHtcblx0XHR0aGlzLm1vZGlmeUJsb2Nrcyhcblx0XHRcdChmcmFnKSA9PiBjcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcIkRJVlwiLFxuXHRcdFx0XHRpbmRlbnRlZE5vZGVBdHRyaWJ1dGVzLFxuXHRcdFx0XHRbZnJhZ11cblx0XHRcdCksXG5cdFx0XHRyYW5nZVxuXHRcdCk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdGRlY3JlYXNlSW5kZW50YXRpb25MZXZlbChyYW5nZSkge1xuXHRcdHRoaXMubW9kaWZ5QmxvY2tzKChmcmFnKSA9PiB7XG5cdFx0XHRBcnJheS5mcm9tKGZyYWcucXVlcnlTZWxlY3RvckFsbChcIi5cIiArIGluZGVudGVkTm9kZUF0dHJpYnV0ZXMuY2xhc3MpKS5maWx0ZXIoKGVsKSA9PiB7XG5cdFx0XHRcdHJldHVybiAhZ2V0TmVhcmVzdChlbC5wYXJlbnROb2RlLCBmcmFnLCBcIkRJVlwiLCBpbmRlbnRlZE5vZGVBdHRyaWJ1dGVzKTtcblx0XHRcdH0pLmZvckVhY2goKGVsKSA9PiB7XG5cdFx0XHRcdHJlcGxhY2VXaXRoKGVsLCBlbXB0eShlbCkpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gZnJhZztcblx0XHR9LCByYW5nZSk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxuXG5cdHJlbW92ZUluZGVudGF0aW9uKHJhbmdlKSB7XG5cdFx0dGhpcy5tb2RpZnlCbG9ja3MoXG5cdFx0XHRcdCgpID0+IHRoaXMuY3JlYXRlRGVmYXVsdEJsb2NrKFtcblx0XHRcdFx0XHRjcmVhdGVFbGVtZW50KFwiSU5QVVRcIiwge1xuXHRcdFx0XHRcdFx0aWQ6IHRoaXMuc3RhcnRTZWxlY3Rpb25JZCxcblx0XHRcdFx0XHRcdHR5cGU6IFwiaGlkZGVuXCJcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRjcmVhdGVFbGVtZW50KFwiSU5QVVRcIiwge1xuXHRcdFx0XHRcdFx0aWQ6IHRoaXMuZW5kU2VsZWN0aW9uSWQsXG5cdFx0XHRcdFx0XHR0eXBlOiBcImhpZGRlblwiXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XSksXG5cdFx0XHRcdHJhbmdlXG5cdFx0KTtcblx0XHRyZXR1cm4gdGhpcy5mb2N1cygpO1xuXHR9XG5cblx0Ly8gLS0tXG5cdGNvZGUoKSB7XG5cdFx0Y29uc3QgcmFuZ2UgPSB0aGlzLmdldFNlbGVjdGlvbigpO1xuXHRcdGlmIChyYW5nZS5jb2xsYXBzZWQgfHwgaXNDb250YWluZXIocmFuZ2UuY29tbW9uQW5jZXN0b3JDb250YWluZXIpKSB7XG5cdFx0XHR0aGlzLm1vZGlmeUJsb2NrcygoZnJhZykgPT4ge1xuXHRcdFx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRcdFx0Y29uc3Qgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHRjb25zdCBibG9ja1dhbGtlciA9IGdldEJsb2NrV2Fsa2VyKGZyYWcsIHJvb3QpO1xuXHRcdFx0XHRsZXQgbm9kZTtcblx0XHRcdFx0d2hpbGUgKG5vZGUgPSBibG9ja1dhbGtlci5uZXh0Tm9kZSgpKSB7XG5cdFx0XHRcdFx0bGV0IG5vZGVzID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKFwiQlJcIik7XG5cdFx0XHRcdFx0Y29uc3QgYnJCcmVha3NMaW5lID0gW107XG5cdFx0XHRcdFx0bGV0IGwgPSBub2Rlcy5sZW5ndGg7XG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsOyBpICs9IDEpIHtcblx0XHRcdFx0XHRcdGJyQnJlYWtzTGluZVtpXSA9IGlzTGluZUJyZWFrKG5vZGVzW2ldLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHdoaWxlIChsLS0pIHtcblx0XHRcdFx0XHRcdGNvbnN0IGJyID0gbm9kZXNbbF07XG5cdFx0XHRcdFx0XHRpZiAoIWJyQnJlYWtzTGluZVtsXSkge1xuXHRcdFx0XHRcdFx0XHRkZXRhY2goYnIpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmVwbGFjZVdpdGgoYnIsIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXFxuXCIpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bm9kZXMgPSBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoXCJDT0RFXCIpO1xuXHRcdFx0XHRcdGwgPSBub2Rlcy5sZW5ndGg7XG5cdFx0XHRcdFx0d2hpbGUgKGwtLSkge1xuXHRcdFx0XHRcdFx0cmVwbGFjZVdpdGgobm9kZXNbbF0sIGVtcHR5KG5vZGVzW2xdKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChvdXRwdXQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdG91dHB1dC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlxcblwiKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG91dHB1dC5hcHBlbmRDaGlsZChlbXB0eShub2RlKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgdGV4dFdhbGtlciA9IG5ldyBUcmVlSXRlcmF0b3Iob3V0cHV0LCBTSE9XX1RFWFQpO1xuXHRcdFx0XHR3aGlsZSAobm9kZSA9IHRleHRXYWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0XHRcdG5vZGUuZGF0YSA9IG5vZGUuZGF0YS5yZXBsYWNlKC/CoC9nLCBcIiBcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0b3V0cHV0Lm5vcm1hbGl6ZSgpO1xuXHRcdFx0XHRyZXR1cm4gZml4Q3Vyc29yKFxuXHRcdFx0XHRcdFx0Y3JlYXRlRWxlbWVudChcIlBSRVwiLCB0aGlzLl9jb25maWcudGFnQXR0cmlidXRlcy5wcmUsIFtcblx0XHRcdFx0XHRcdFx0b3V0cHV0XG5cdFx0XHRcdFx0XHRdKVxuXHRcdFx0XHQpO1xuXHRcdFx0fSwgcmFuZ2UpO1xuXHRcdFx0dGhpcy5mb2N1cygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNoYW5nZUZvcm1hdChcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0YWc6IFwiQ09ERVwiLFxuXHRcdFx0XHRcdFx0YXR0cmlidXRlczogdGhpcy5fY29uZmlnLnRhZ0F0dHJpYnV0ZXMuY29kZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bnVsbCxcblx0XHRcdFx0XHRyYW5nZVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRyZW1vdmVDb2RlKCkge1xuXHRcdGNvbnN0IHJhbmdlID0gdGhpcy5nZXRTZWxlY3Rpb24oKTtcblx0XHRjb25zdCBhbmNlc3RvciA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXHRcdGNvbnN0IGluUHJlID0gZ2V0TmVhcmVzdChhbmNlc3RvciwgdGhpcy5fcm9vdCwgXCJQUkVcIik7XG5cdFx0aWYgKGluUHJlKSB7XG5cdFx0XHR0aGlzLm1vZGlmeUJsb2NrcygoZnJhZykgPT4ge1xuXHRcdFx0XHRjb25zdCByb290ID0gdGhpcy5fcm9vdDtcblx0XHRcdFx0Y29uc3QgcHJlcyA9IGZyYWcucXVlcnlTZWxlY3RvckFsbChcIlBSRVwiKTtcblx0XHRcdFx0bGV0IGwgPSBwcmVzLmxlbmd0aDtcblx0XHRcdFx0d2hpbGUgKGwtLSkge1xuXHRcdFx0XHRcdGNvbnN0IHByZSA9IHByZXNbbF07XG5cdFx0XHRcdFx0Y29uc3Qgd2Fsa2VyID0gbmV3IFRyZWVJdGVyYXRvcihwcmUsIFNIT1dfVEVYVCk7XG5cdFx0XHRcdFx0bGV0IG5vZGU7XG5cdFx0XHRcdFx0d2hpbGUgKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0XHRcdFx0bGV0IHZhbHVlID0gbm9kZS5kYXRhO1xuXHRcdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC8gKD89ICkvZywgXCJcXHhBMFwiKTtcblx0XHRcdFx0XHRcdGNvbnN0IGNvbnRlbnRzID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHRcdFx0bGV0IGluZGV4O1xuXHRcdFx0XHRcdFx0d2hpbGUgKChpbmRleCA9IHZhbHVlLmluZGV4T2YoXCJcXG5cIikpID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0Y29udGVudHMuYXBwZW5kQ2hpbGQoXG5cdFx0XHRcdFx0XHRcdFx0XHRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZS5zbGljZSgwLCBpbmRleCkpXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdGNvbnRlbnRzLmFwcGVuZENoaWxkKGNyZWF0ZUVsZW1lbnQoXCJCUlwiKSk7XG5cdFx0XHRcdFx0XHRcdHZhbHVlID0gdmFsdWUuc2xpY2UoaW5kZXggKyAxKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY29udGVudHMsIG5vZGUpO1xuXHRcdFx0XHRcdFx0bm9kZS5kYXRhID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGZpeENvbnRhaW5lcihwcmUsIHJvb3QsIHRoaXMuX2NvbmZpZyk7XG5cdFx0XHRcdFx0cmVwbGFjZVdpdGgocHJlLCBlbXB0eShwcmUpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZnJhZztcblx0XHRcdH0sIHJhbmdlKTtcblx0XHRcdHRoaXMuZm9jdXMoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jaGFuZ2VGb3JtYXQobnVsbCwge3RhZzogXCJDT0RFXCJ9LCByYW5nZSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0dG9nZ2xlQ29kZSgpIHtcblx0XHRpZiAodGhpcy5oYXNGb3JtYXQoXCJQUkVcIikgfHwgdGhpcy5oYXNGb3JtYXQoXCJDT0RFXCIpKSB7XG5cdFx0XHR0aGlzLnJlbW92ZUNvZGUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jb2RlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0Ly8gLS0tXG5cdF9yZW1vdmVGb3JtYXR0aW5nKHJvb3QsIGNsZWFuKSB7XG5cdFx0Zm9yIChsZXQgbm9kZSA9IHJvb3QuZmlyc3RDaGlsZCwgbmV4dDsgbm9kZTsgbm9kZSA9IG5leHQpIHtcblx0XHRcdG5leHQgPSBub2RlLm5leHRTaWJsaW5nO1xuXHRcdFx0aWYgKGlzSW5saW5lKG5vZGUpKSB7XG5cdFx0XHRcdGlmIChub2RlIGluc3RhbmNlb2YgVGV4dCB8fCBub2RlLm5vZGVOYW1lID09PSBcIkJSXCIgfHwgbm9kZS5ub2RlTmFtZSA9PT0gXCJJTUdcIikge1xuXHRcdFx0XHRcdGNsZWFuLmFwcGVuZENoaWxkKG5vZGUpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzQmxvY2sobm9kZSkpIHtcblx0XHRcdFx0Y2xlYW4uYXBwZW5kQ2hpbGQoXG5cdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZURlZmF1bHRCbG9jayhbXG5cdFx0XHRcdFx0XHRcdHRoaXMuX3JlbW92ZUZvcm1hdHRpbmcoXG5cdFx0XHRcdFx0XHRcdFx0XHRub2RlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdF0pXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5fcmVtb3ZlRm9ybWF0dGluZyhub2RlLCBjbGVhbik7XG5cdFx0fVxuXHRcdHJldHVybiBjbGVhbjtcblx0fVxuXG5cdHJlbW92ZUFsbEZvcm1hdHRpbmcocmFuZ2UpIHtcblx0XHRpZiAoIXJhbmdlKSB7XG5cdFx0XHRyYW5nZSA9IHRoaXMuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0fVxuXHRcdGlmIChyYW5nZS5jb2xsYXBzZWQpIHtcblx0XHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHJvb3QgPSB0aGlzLl9yb290O1xuXHRcdGxldCBzdG9wTm9kZSA9IHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuXHRcdHdoaWxlIChzdG9wTm9kZSAmJiAhaXNCbG9jayhzdG9wTm9kZSkpIHtcblx0XHRcdHN0b3BOb2RlID0gc3RvcE5vZGUucGFyZW50Tm9kZTtcblx0XHR9XG5cdFx0aWYgKCFzdG9wTm9kZSkge1xuXHRcdFx0ZXhwYW5kUmFuZ2VUb0Jsb2NrQm91bmRhcmllcyhyYW5nZSwgcm9vdCk7XG5cdFx0XHRzdG9wTm9kZSA9IHJvb3Q7XG5cdFx0fVxuXHRcdGlmIChzdG9wTm9kZSBpbnN0YW5jZW9mIFRleHQpIHtcblx0XHRcdHJldHVybiB0aGlzLmZvY3VzKCk7XG5cdFx0fVxuXHRcdHRoaXMuc2F2ZVVuZG9TdGF0ZShyYW5nZSk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc1VwVHJlZShyYW5nZSwgc3RvcE5vZGUsIHN0b3BOb2RlLCByb290KTtcblx0XHRjb25zdCBzdGFydENvbnRhaW5lciA9IHJhbmdlLnN0YXJ0Q29udGFpbmVyO1xuXHRcdGxldCBzdGFydE9mZnNldCA9IHJhbmdlLnN0YXJ0T2Zmc2V0O1xuXHRcdGNvbnN0IGVuZENvbnRhaW5lciA9IHJhbmdlLmVuZENvbnRhaW5lcjtcblx0XHRsZXQgZW5kT2Zmc2V0ID0gcmFuZ2UuZW5kT2Zmc2V0O1xuXHRcdGNvbnN0IGZvcm1hdHRlZE5vZGVzID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdGNvbnN0IGNsZWFuTm9kZXMgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0Y29uc3Qgbm9kZUFmdGVyU3BsaXQgPSBzcGxpdChlbmRDb250YWluZXIsIGVuZE9mZnNldCwgc3RvcE5vZGUsIHJvb3QpO1xuXHRcdGxldCBub2RlSW5TcGxpdCA9IHNwbGl0KHN0YXJ0Q29udGFpbmVyLCBzdGFydE9mZnNldCwgc3RvcE5vZGUsIHJvb3QpO1xuXHRcdGxldCBuZXh0Tm9kZTtcblx0XHR3aGlsZSAobm9kZUluU3BsaXQgIT09IG5vZGVBZnRlclNwbGl0KSB7XG5cdFx0XHRuZXh0Tm9kZSA9IG5vZGVJblNwbGl0Lm5leHRTaWJsaW5nO1xuXHRcdFx0Zm9ybWF0dGVkTm9kZXMuYXBwZW5kQ2hpbGQobm9kZUluU3BsaXQpO1xuXHRcdFx0bm9kZUluU3BsaXQgPSBuZXh0Tm9kZTtcblx0XHR9XG5cdFx0dGhpcy5fcmVtb3ZlRm9ybWF0dGluZyhmb3JtYXR0ZWROb2RlcywgY2xlYW5Ob2Rlcyk7XG5cdFx0Y2xlYW5Ob2Rlcy5ub3JtYWxpemUoKTtcblx0XHRub2RlSW5TcGxpdCA9IGNsZWFuTm9kZXMuZmlyc3RDaGlsZDtcblx0XHRuZXh0Tm9kZSA9IGNsZWFuTm9kZXMubGFzdENoaWxkO1xuXHRcdGlmIChub2RlSW5TcGxpdCkge1xuXHRcdFx0c3RvcE5vZGUuaW5zZXJ0QmVmb3JlKGNsZWFuTm9kZXMsIG5vZGVBZnRlclNwbGl0KTtcblx0XHRcdGNvbnN0IGNoaWxkTm9kZXMgPSBBcnJheS5mcm9tKHN0b3BOb2RlLmNoaWxkTm9kZXMpO1xuXHRcdFx0c3RhcnRPZmZzZXQgPSBjaGlsZE5vZGVzLmluZGV4T2Yobm9kZUluU3BsaXQpO1xuXHRcdFx0ZW5kT2Zmc2V0ID0gbmV4dE5vZGUgPyBjaGlsZE5vZGVzLmluZGV4T2YobmV4dE5vZGUpICsgMSA6IDA7XG5cdFx0fSBlbHNlIGlmIChub2RlQWZ0ZXJTcGxpdCkge1xuXHRcdFx0Y29uc3QgY2hpbGROb2RlcyA9IEFycmF5LmZyb20oc3RvcE5vZGUuY2hpbGROb2Rlcyk7XG5cdFx0XHRzdGFydE9mZnNldCA9IGNoaWxkTm9kZXMuaW5kZXhPZihub2RlQWZ0ZXJTcGxpdCk7XG5cdFx0XHRlbmRPZmZzZXQgPSBzdGFydE9mZnNldDtcblx0XHR9XG5cdFx0cmFuZ2Uuc2V0U3RhcnQoc3RvcE5vZGUsIHN0YXJ0T2Zmc2V0KTtcblx0XHRyYW5nZS5zZXRFbmQoc3RvcE5vZGUsIGVuZE9mZnNldCk7XG5cdFx0bWVyZ2VJbmxpbmVzKHN0b3BOb2RlLCByYW5nZSk7XG5cdFx0bW92ZVJhbmdlQm91bmRhcmllc0Rvd25UcmVlKHJhbmdlKTtcblx0XHR0aGlzLnNldFNlbGVjdGlvbihyYW5nZSk7XG5cdFx0dGhpcy5fdXBkYXRlUGF0aChyYW5nZSwgdHJ1ZSk7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXMoKTtcblx0fVxufTtcblxuLy8gc291cmNlL1NxdWlyZS50c1xudmFyIFNxdWlyZV9kZWZhdWx0ID0gU3F1aXJlO1xuZXhwb3J0IHtcblx0U3F1aXJlX2RlZmF1bHQgYXMgZGVmYXVsdFxufTtcbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgU3F1aXJlRWRpdG9yIGZyb20gXCJzcXVpcmUtcnRlXCJcbmltcG9ydCB7IGRlZmVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBweCB9IGZyb20gXCIuLi9zaXplXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBpc01haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uL21pc2MvRm9ybWF0VmFsaWRhdG9yXCJcbmltcG9ydCB7IFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBIVE1MX0VESVRPUl9MSU5FX0hFSUdIVCB9IGZyb20gXCIuL0h0bWxFZGl0b3IuanNcIlxuaW1wb3J0IHR5cGUgeyBJbWFnZUhhbmRsZXIgfSBmcm9tIFwiLi4vLi4vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcblxudHlwZSBTYW5pdGl6ZXJGbiA9IChodG1sOiBzdHJpbmcsIGlzUGFzdGU6IGJvb2xlYW4pID0+IERvY3VtZW50RnJhZ21lbnRcbmV4cG9ydCB0eXBlIEltYWdlUGFzdGVFdmVudCA9IEN1c3RvbUV2ZW50PHsgY2xpcGJvYXJkRGF0YTogRGF0YVRyYW5zZmVyIH0+XG5leHBvcnQgdHlwZSBUZXh0UGFzdGVFdmVudCA9IEN1c3RvbUV2ZW50PHsgZnJhZ21lbnQ6IERvY3VtZW50RnJhZ21lbnQgfT5cbmV4cG9ydCB0eXBlIFN0eWxlID0gXCJiXCIgfCBcImlcIiB8IFwidVwiIHwgXCJjXCIgfCBcImFcIlxuZXhwb3J0IHR5cGUgQWxpZ25tZW50ID0gXCJsZWZ0XCIgfCBcImNlbnRlclwiIHwgXCJyaWdodFwiIHwgXCJqdXN0aWZ5XCJcbmV4cG9ydCB0eXBlIExpc3RpbmcgPSBcIm9sXCIgfCBcInVsXCJcbnR5cGUgU3R5bGVzID0ge1xuXHRba2V5IGluIFN0eWxlXTogYm9vbGVhblxufSAmIHtcblx0YWxpZ25tZW50OiBBbGlnbm1lbnRcblx0bGlzdGluZzogTGlzdGluZyB8IG51bGxcbn1cblxuZXhwb3J0IGNsYXNzIEVkaXRvciBpbXBsZW1lbnRzIEltYWdlSGFuZGxlciwgQ29tcG9uZW50IHtcblx0c3F1aXJlOiBTcXVpcmVFZGl0b3IgfCBudWxsXG5cdGluaXRpYWxpemVkID0gZGVmZXI8dm9pZD4oKVxuXHRkb21FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgc2hvd091dGxpbmUgPSBmYWxzZVxuXHRwcml2YXRlIGVuYWJsZWQgPSB0cnVlXG5cdHByaXZhdGUgcmVhZE9ubHkgPSBmYWxzZVxuXHRwcml2YXRlIGNyZWF0ZXNMaXN0cyA9IHRydWVcblx0cHJpdmF0ZSB1c2VySGFzUGFzdGVkID0gZmFsc2Vcblx0cHJpdmF0ZSBzdHlsZUFjdGlvbnMgPSBPYmplY3QuZnJlZXplKHtcblx0XHRiOiBbKCkgPT4gdGhpcy5zcXVpcmUuYm9sZCgpLCAoKSA9PiB0aGlzLnNxdWlyZS5yZW1vdmVCb2xkKCksICgpID0+IHRoaXMuc3R5bGVzLmJdLFxuXHRcdGk6IFsoKSA9PiB0aGlzLnNxdWlyZS5pdGFsaWMoKSwgKCkgPT4gdGhpcy5zcXVpcmUucmVtb3ZlSXRhbGljKCksICgpID0+IHRoaXMuc3R5bGVzLmldLFxuXHRcdHU6IFsoKSA9PiB0aGlzLnNxdWlyZS51bmRlcmxpbmUoKSwgKCkgPT4gdGhpcy5zcXVpcmUucmVtb3ZlVW5kZXJsaW5lKCksICgpID0+IHRoaXMuc3R5bGVzLnVdLFxuXHRcdGM6IFsoKSA9PiB0aGlzLnNxdWlyZS5zZXRGb250RmFjZShcIm1vbm9zcGFjZVwiKSwgKCkgPT4gdGhpcy5zcXVpcmUuc2V0Rm9udEZhY2UobnVsbCksICgpID0+IHRoaXMuc3R5bGVzLmNdLFxuXHRcdGE6IFsoKSA9PiB0aGlzLm1ha2VMaW5rKCksICgpID0+IHRoaXMuc3F1aXJlLnJlbW92ZUxpbmsoKSwgKCkgPT4gdGhpcy5zdHlsZXMuYV0sXG5cdH0gYXMgY29uc3QpXG5cblx0c3R5bGVzOiBTdHlsZXMgPSB7XG5cdFx0YjogZmFsc2UsXG5cdFx0aTogZmFsc2UsXG5cdFx0dTogZmFsc2UsXG5cdFx0YzogZmFsc2UsXG5cdFx0YTogZmFsc2UsXG5cdFx0YWxpZ25tZW50OiBcImxlZnRcIixcblx0XHRsaXN0aW5nOiBudWxsLFxuXHR9XG5cblx0LyoqXG5cdCAqIHNxdWlyZSAyLjAgcmVtb3ZlZCB0aGUgaXNQYXN0ZSBhcmd1bWVudCBmcm9tIHRoZSBzYW5pdGl6ZVRvRG9tRnJhZ21lbnQgZnVuY3Rpb24uXG5cdCAqIHNpbmNlIHNhbml0aXplVG9Eb21GcmFnbWVudCBpcyBjYWxsZWQgYmVmb3JlIHNxdWlyZSdzIHdpbGxQYXN0ZSBldmVudCBpcyBmaXJlZCwgd2Vcblx0ICogY2FuJ3QgaGF2ZSBvdXIgc2FuaXRpemF0aW9uIHN0cmF0ZWd5IGRlcGVuZCBvbiB0aGUgd2lsbFBhc3RlIGV2ZW50LlxuXHQgKlxuXHQgKiB3ZSB0aGVyZWZvcmUgYWRkIG91ciBvd24gcGFzdGUgaGFuZGxlciB0byB0aGUgZG9tIGVsZW1lbnQgc3F1aXJlIHVzZXMgYW5kIHNldCBhXG5cdCAqIGZsYWcgb25jZSB3ZSBkZXRlY3QgYSBwYXN0ZSBhbmQgcmVzZXQgaXQgd2hlbiBzcXVpcmUgbmV4dCBmaXJlcyB0aGUgXCJpbnB1dFwiIGV2ZW50LlxuXHQgKlxuXHQgKiAqIHVzZXIgcGFzdGVzXG5cdCAqICogXCJwYXN0ZVwiIGV2ZW50IG9uIGRvbSBzZXRzIGZsYWdcblx0ICogKiBzYW5pdGl6ZVRvRG9tRnJhZ21lbnQgaXMgY2FsbGVkIGJ5IHNxdWlyZVxuXHQgKiAqIFwiaW5wdXRcIiBldmVudCBvbiBzcXVpcmUgcmVzZXRzIGZsYWcuXG5cdCAqL1xuXHRwcml2YXRlIHBhc3RlTGlzdGVuZXI6IChlOiBDbGlwYm9hcmRFdmVudCkgPT4gdm9pZCA9IChfOiBDbGlwYm9hcmRFdmVudCkgPT4gKHRoaXMudXNlckhhc1Bhc3RlZCA9IHRydWUpXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSBtaW5IZWlnaHQ6IG51bWJlciB8IG51bGwsIHByaXZhdGUgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbiwgcHJpdmF0ZSBzdGF0aWNMaW5lQW1vdW50OiBudW1iZXIgfCBudWxsKSB7XG5cdFx0dGhpcy5vbnJlbW92ZSA9IHRoaXMub25yZW1vdmUuYmluZCh0aGlzKVxuXHRcdHRoaXMub25iZWZvcmV1cGRhdGUgPSB0aGlzLm9uYmVmb3JldXBkYXRlLmJpbmQodGhpcylcblx0XHR0aGlzLnZpZXcgPSB0aGlzLnZpZXcuYmluZCh0aGlzKVxuXHR9XG5cblx0b25iZWZvcmV1cGRhdGUoKTogYm9vbGVhbiB7XG5cdFx0Ly8gZG8gbm90IHVwZGF0ZSB0aGUgZG9tIHBhcnQgbWFuYWdlZCBieSBzcXVpcmVcblx0XHRyZXR1cm4gdGhpcy5zcXVpcmUgPT0gbnVsbFxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0dGhpcy5kb21FbGVtZW50Py5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgdGhpcy5wYXN0ZUxpc3RlbmVyKVxuXHRcdGlmICh0aGlzLnNxdWlyZSkge1xuXHRcdFx0dGhpcy5zcXVpcmUuZGVzdHJveSgpXG5cblx0XHRcdHRoaXMuc3F1aXJlID0gbnVsbFxuXHRcdFx0dGhpcy5pbml0aWFsaXplZCA9IGRlZmVyKClcblx0XHR9XG5cdH1cblxuXHR2aWV3KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5zZWxlY3RhYmxlXCIsIHtcblx0XHRcdHJvbGU6IFwidGV4dGJveFwiLFxuXHRcdFx0XCJhcmlhLW11bHRpbGluZVwiOiBcInRydWVcIixcblx0XHRcdFwiZGF0YS10ZXN0aWRcIjogXCJ0ZXh0X2VkaXRvclwiLFxuXHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LkRlZmF1bHQsXG5cdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB0aGlzLmluaXRTcXVpcmUodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KSxcblx0XHRcdGNsYXNzOiBgZmxleC1ncm93ICR7dGhpcy5zaG93T3V0bGluZSA/IFwiXCIgOiBcImhpZGUtb3V0bGluZVwifWAsXG5cdFx0XHRzdHlsZTogdGhpcy5zdGF0aWNMaW5lQW1vdW50XG5cdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XCJtYXgtaGVpZ2h0XCI6IHB4KHRoaXMuc3RhdGljTGluZUFtb3VudCAqIEhUTUxfRURJVE9SX0xJTkVfSEVJR0hUKSxcblx0XHRcdFx0XHRcdFwibWluLWhlaWdodDpcIjogcHgodGhpcy5zdGF0aWNMaW5lQW1vdW50ICogSFRNTF9FRElUT1JfTElORV9IRUlHSFQpLFxuXHRcdFx0XHRcdFx0b3ZlcmZsb3c6IFwic2Nyb2xsXCIsXG5cdFx0XHRcdCAgfVxuXHRcdFx0XHQ6IHRoaXMubWluSGVpZ2h0XG5cdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XCJtaW4taGVpZ2h0XCI6IHB4KHRoaXMubWluSGVpZ2h0KSxcblx0XHRcdFx0ICB9XG5cdFx0XHRcdDoge30sXG5cdFx0fSlcblx0fVxuXG5cdGlzRW1wdHkoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuICF0aGlzLnNxdWlyZSB8fCB0aGlzLnNxdWlyZS5nZXRIVE1MKCkgPT09IFwiPGRpdj48YnI+PC9kaXY+XCJcblx0fVxuXG5cdGdldFZhbHVlKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuaXNFbXB0eSgpID8gXCJcIiA6IHRoaXMuc3F1aXJlLmdldEhUTUwoKVxuXHR9XG5cblx0YWRkQ2hhbmdlTGlzdGVuZXIoY2FsbGJhY2s6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBhbnkpIHtcblx0XHR0aGlzLnNxdWlyZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgY2FsbGJhY2spXG5cdH1cblxuXHRzZXRNaW5IZWlnaHQobWluSGVpZ2h0OiBudW1iZXIpOiBFZGl0b3Ige1xuXHRcdHRoaXMubWluSGVpZ2h0ID0gbWluSGVpZ2h0XG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHNldFNob3dPdXRsaW5lKHNob3c6IGJvb2xlYW4pIHtcblx0XHR0aGlzLnNob3dPdXRsaW5lID0gc2hvd1xuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgYSBzdGF0aWMgYW1vdW50ICduJyBvZiBsaW5lcyB0aGUgRWRpdG9yIHNob3VsZCBhbHdheXMgcmVuZGVyL2FsbG93LlxuXHQgKiBXaGVuIHVzaW5nIG4rMSBsaW5lcywgdGhlIGVkaXRvciB3aWxsIGluc3RlYWQgYmVnaW4gdG8gYmUgc2Nyb2xsYWJsZS5cblx0ICogQ3VycmVudGx5LCB0aGlzIG92ZXJ3cml0ZXMgbWluLWhlaWdodC5cblx0ICovXG5cdHNldFN0YXRpY051bWJlck9mTGluZXMobnVtYmVyT2ZMaW5lczogbnVtYmVyKTogRWRpdG9yIHtcblx0XHR0aGlzLnN0YXRpY0xpbmVBbW91bnQgPSBudW1iZXJPZkxpbmVzXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHNldENyZWF0ZXNMaXN0cyhjcmVhdGVzTGlzdHM6IGJvb2xlYW4pOiBFZGl0b3Ige1xuXHRcdHRoaXMuY3JlYXRlc0xpc3RzID0gY3JlYXRlc0xpc3RzXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdGluaXRTcXVpcmUoZG9tRWxlbWVudDogSFRNTEVsZW1lbnQpIHtcblx0XHR0aGlzLnNxdWlyZSA9IG5ldyBTcXVpcmVFZGl0b3IoZG9tRWxlbWVudCwge1xuXHRcdFx0c2FuaXRpemVUb0RPTUZyYWdtZW50OiAoaHRtbDogc3RyaW5nKSA9PiB0aGlzLnNhbml0aXplcihodG1sLCB0aGlzLnVzZXJIYXNQYXN0ZWQpLFxuXHRcdFx0YmxvY2tBdHRyaWJ1dGVzOiB7XG5cdFx0XHRcdGRpcjogXCJhdXRvXCIsXG5cdFx0XHR9LFxuXHRcdH0pXG5cblx0XHQvLyBTdXBwcmVzcyBwYXN0ZSBldmVudHMgaWYgcGFzdGluZyB3aGlsZSBkaXNhYmxlZFxuXHRcdHRoaXMuc3F1aXJlLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aWxsUGFzdGVcIiwgKGU6IFRleHRQYXN0ZUV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMuaXNFbmFibGVkKCkpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHRoaXMuc3F1aXJlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoXzogQ3VzdG9tRXZlbnQ8dm9pZD4pID0+ICh0aGlzLnVzZXJIYXNQYXN0ZWQgPSBmYWxzZSkpXG5cdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgdGhpcy5wYXN0ZUxpc3RlbmVyKVxuXG5cdFx0dGhpcy5zcXVpcmUuYWRkRXZlbnRMaXN0ZW5lcihcInBhdGhDaGFuZ2VcIiwgKCkgPT4ge1xuXHRcdFx0dGhpcy5nZXRTdHlsZXNBdFBhdGgoKVxuXHRcdFx0bS5yZWRyYXcoKSAvLyBhbGxvdyByaWNodGV4dHRvb2xiYXIgdG8gcmVkcmF3IGVsZW1lbnRzXG5cdFx0fSlcblxuXHRcdHRoaXMuZG9tRWxlbWVudCA9IGRvbUVsZW1lbnRcblx0XHQvLyB0aGUgX2VkaXRvciBtaWdodCBoYXZlIGJlZW4gZGlzYWJsZWQgYmVmb3JlIHRoZSBkb20gZWxlbWVudCB3YXMgdGhlcmVcblx0XHR0aGlzLnNldEVuYWJsZWQodGhpcy5lbmFibGVkKVxuXHRcdHRoaXMuaW5pdGlhbGl6ZWQucmVzb2x2ZSgpXG5cdH1cblxuXHRzZXRFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcblx0XHR0aGlzLmVuYWJsZWQgPSBlbmFibGVkXG5cdFx0dGhpcy51cGRhdGVDb250ZW50RWRpdGFibGVBdHRyaWJ1dGUoKVxuXHR9XG5cblx0c2V0UmVhZE9ubHkocmVhZE9ubHk6IGJvb2xlYW4pIHtcblx0XHR0aGlzLnJlYWRPbmx5ID0gcmVhZE9ubHlcblx0XHR0aGlzLnVwZGF0ZUNvbnRlbnRFZGl0YWJsZUF0dHJpYnV0ZSgpXG5cdH1cblxuXHRpc1JlYWRPbmx5KCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnJlYWRPbmx5XG5cdH1cblxuXHRpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuZW5hYmxlZFxuXHR9XG5cblx0c2V0SFRNTChodG1sOiBzdHJpbmcgfCBudWxsKSB7XG5cdFx0dGhpcy5zcXVpcmUuc2V0SFRNTChodG1sKVxuXHR9XG5cblx0Z2V0SFRNTCgpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLnNxdWlyZS5nZXRIVE1MKClcblx0fVxuXG5cdHNldFN0eWxlKHN0YXRlOiBib29sZWFuLCBzdHlsZTogU3R5bGUpIHtcblx0XHQ7KHN0YXRlID8gdGhpcy5zdHlsZUFjdGlvbnNbc3R5bGVdWzBdIDogdGhpcy5zdHlsZUFjdGlvbnNbc3R5bGVdWzFdKSgpXG5cdH1cblxuXHRoYXNTdHlsZTogKGFyZzA6IFN0eWxlKSA9PiBib29sZWFuID0gKHN0eWxlKSA9PiAodGhpcy5zcXVpcmUgPyB0aGlzLnN0eWxlQWN0aW9uc1tzdHlsZV1bMl0oKSA6IGZhbHNlKVxuXHRnZXRTdHlsZXNBdFBhdGg6ICgpID0+IHZvaWQgPSAoKSA9PiB7XG5cdFx0aWYgKCF0aGlzLnNxdWlyZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0bGV0IHBhdGhTZWdtZW50czogc3RyaW5nW10gPSB0aGlzLnNxdWlyZS5nZXRQYXRoKCkuc3BsaXQoXCI+XCIpXG5cblx0XHQvLyBsaXN0c1xuXHRcdGNvbnN0IHVsSW5kZXggPSBwYXRoU2VnbWVudHMubGFzdEluZGV4T2YoXCJVTFwiKVxuXHRcdGNvbnN0IG9sSW5kZXggPSBwYXRoU2VnbWVudHMubGFzdEluZGV4T2YoXCJPTFwiKVxuXG5cdFx0aWYgKHVsSW5kZXggPT09IC0xKSB7XG5cdFx0XHRpZiAob2xJbmRleCA+IC0xKSB7XG5cdFx0XHRcdHRoaXMuc3R5bGVzLmxpc3RpbmcgPSBcIm9sXCJcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc3R5bGVzLmxpc3RpbmcgPSBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChvbEluZGV4ID09PSAtMSkge1xuXHRcdFx0aWYgKHVsSW5kZXggPiAtMSkge1xuXHRcdFx0XHR0aGlzLnN0eWxlcy5saXN0aW5nID0gXCJ1bFwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnN0eWxlcy5saXN0aW5nID0gbnVsbFxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAob2xJbmRleCA+IHVsSW5kZXgpIHtcblx0XHRcdHRoaXMuc3R5bGVzLmxpc3RpbmcgPSBcIm9sXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zdHlsZXMubGlzdGluZyA9IFwidWxcIlxuXHRcdH1cblxuXHRcdC8vbGlua3Ncblx0XHR0aGlzLnN0eWxlcy5hID0gcGF0aFNlZ21lbnRzLmluY2x1ZGVzKFwiQVwiKVxuXHRcdC8vIGFsaWdubWVudFxuXHRcdGxldCBhbGlnbm1lbnQgPSBwYXRoU2VnbWVudHMuZmluZCgoZikgPT4gZi5pbmNsdWRlcyhcImFsaWduXCIpKVxuXG5cdFx0aWYgKGFsaWdubWVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRzd2l0Y2ggKGFsaWdubWVudC5zcGxpdChcIi5cIilbMV0uc3Vic3RyaW5nKDYpKSB7XG5cdFx0XHRcdGNhc2UgXCJsZWZ0XCI6XG5cdFx0XHRcdFx0dGhpcy5zdHlsZXMuYWxpZ25tZW50ID0gXCJsZWZ0XCJcblx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHRcdGNhc2UgXCJyaWdodFwiOlxuXHRcdFx0XHRcdHRoaXMuc3R5bGVzLmFsaWdubWVudCA9IFwicmlnaHRcIlxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBcImNlbnRlclwiOlxuXHRcdFx0XHRcdHRoaXMuc3R5bGVzLmFsaWdubWVudCA9IFwiY2VudGVyXCJcblx0XHRcdFx0XHRicmVha1xuXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0dGhpcy5zdHlsZXMuYWxpZ25tZW50ID0gXCJqdXN0aWZ5XCJcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zdHlsZXMuYWxpZ25tZW50ID0gXCJsZWZ0XCJcblx0XHR9XG5cblx0XHQvLyBmb250XG5cdFx0dGhpcy5zdHlsZXMuYyA9IHBhdGhTZWdtZW50cy5zb21lKChmKSA9PiBmLmluY2x1ZGVzKFwibW9ub3NwYWNlXCIpKVxuXHRcdC8vIGRlY29yYXRpb25zXG5cdFx0dGhpcy5zdHlsZXMuYiA9IHRoaXMuc3F1aXJlLmhhc0Zvcm1hdChcImJcIilcblx0XHR0aGlzLnN0eWxlcy51ID0gdGhpcy5zcXVpcmUuaGFzRm9ybWF0KFwidVwiKVxuXHRcdHRoaXMuc3R5bGVzLmkgPSB0aGlzLnNxdWlyZS5oYXNGb3JtYXQoXCJpXCIpXG5cdH1cblxuXHRtYWtlTGluaygpIHtcblx0XHREaWFsb2cuc2hvd1RleHRJbnB1dERpYWxvZyh7XG5cdFx0XHR0aXRsZTogXCJtYWtlTGlua19hY3Rpb25cIixcblx0XHRcdGxhYmVsOiBcInVybF9sYWJlbFwiLFxuXHRcdFx0dGV4dEZpZWxkVHlwZTogVGV4dEZpZWxkVHlwZS5VcmwsXG5cdFx0fSkudGhlbigodXJsKSA9PiB7XG5cdFx0XHRpZiAoaXNNYWlsQWRkcmVzcyh1cmwsIGZhbHNlKSkge1xuXHRcdFx0XHR1cmwgPSBcIm1haWx0bzpcIiArIHVybFxuXHRcdFx0fSBlbHNlIGlmICghdXJsLnN0YXJ0c1dpdGgoXCJodHRwOi8vXCIpICYmICF1cmwuc3RhcnRzV2l0aChcImh0dHBzOi8vXCIpICYmICF1cmwuc3RhcnRzV2l0aChcIm1haWx0bzpcIikgJiYgIXVybC5zdGFydHNXaXRoKFwie1wiKSkge1xuXHRcdFx0XHR1cmwgPSBcImh0dHBzOi8vXCIgKyB1cmxcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zcXVpcmUubWFrZUxpbmsodXJsKVxuXHRcdH0pXG5cdH1cblxuXHRpbnNlcnRJbWFnZShzcmNBdHRyOiBzdHJpbmcsIGF0dHJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IEhUTUxFbGVtZW50IHtcblx0XHRyZXR1cm4gdGhpcy5zcXVpcmUuaW5zZXJ0SW1hZ2Uoc3JjQXR0ciwgYXR0cnMpXG5cdH1cblxuXHQvKipcblx0ICogSW5zZXJ0cyB0aGUgZ2l2ZW4gaHRtbCBjb250ZW50IGF0IHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbi5cblx0ICovXG5cdGluc2VydEhUTUwoaHRtbDogc3RyaW5nKSB7XG5cdFx0dGhpcy5zcXVpcmUuaW5zZXJ0SFRNTChodG1sKVxuXHR9XG5cblx0Z2V0RE9NKCk6IEhUTUxFbGVtZW50IHtcblx0XHRyZXR1cm4gdGhpcy5zcXVpcmUuZ2V0Um9vdCgpXG5cdH1cblxuXHRnZXRDdXJzb3JQb3NpdGlvbigpOiBDbGllbnRSZWN0IHtcblx0XHRyZXR1cm4gdGhpcy5zcXVpcmUuZ2V0Q3Vyc29yUG9zaXRpb24oKVxuXHR9XG5cblx0Zm9jdXMoKTogdm9pZCB7XG5cdFx0dGhpcy5zcXVpcmUuZm9jdXMoKVxuXG5cdFx0dGhpcy5nZXRTdHlsZXNBdFBhdGgoKVxuXHR9XG5cblx0aXNBdHRhY2hlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5zcXVpcmUgIT0gbnVsbFxuXHR9XG5cblx0Z2V0U2VsZWN0ZWRUZXh0KCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuc3F1aXJlLmdldFNlbGVjdGVkVGV4dCgpXG5cdH1cblxuXHRhZGRFdmVudExpc3RlbmVyKHR5cGU6IHN0cmluZywgaGFuZGxlcjogKGFyZzA6IEV2ZW50KSA9PiB2b2lkKSB7XG5cdFx0dGhpcy5zcXVpcmUuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKVxuXHR9XG5cblx0c2V0U2VsZWN0aW9uKHJhbmdlOiBSYW5nZSkge1xuXHRcdHRoaXMuc3F1aXJlLnNldFNlbGVjdGlvbihyYW5nZSlcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgdGhpcy5pc0VuYWJsZWQoKSAmJiAhdGhpcy5pc1JlYWRPbmx5KClcblx0ICovXG5cdGlzRWRpdGFibGUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuaXNFbmFibGVkKCkgJiYgIXRoaXMuaXNSZWFkT25seSgpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZUNvbnRlbnRFZGl0YWJsZUF0dHJpYnV0ZSgpIHtcblx0XHRpZiAodGhpcy5kb21FbGVtZW50KSB7XG5cdFx0XHR0aGlzLmRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKFwiY29udGVudGVkaXRhYmxlXCIsIFN0cmluZyh0aGlzLmlzRWRpdGFibGUoKSkpXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuL2ljb25zL0ljb25zXCJcbmltcG9ydCB0eXBlIHsgRWRpdG9yLCBMaXN0aW5nLCBTdHlsZSB9IGZyb20gXCIuLi9lZGl0b3IvRWRpdG9yXCJcbmltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCIuLi9lZGl0b3IvRWRpdG9yXCJcbmltcG9ydCB7IG51bWJlclJhbmdlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBzaXplIH0gZnJvbSBcIi4uL3NpemVcIlxuaW1wb3J0IHsgY3JlYXRlRHJvcGRvd24sIERyb3Bkb3duQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSwgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGFuaW1hdGlvbnMsIGhlaWdodCwgb3BhY2l0eSB9IGZyb20gXCIuLi9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBCcm93c2VyVHlwZSB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudENvbnN0YW50c1wiXG5pbXBvcnQgeyBUb2dnbGVCdXR0b24gfSBmcm9tIFwiLi9idXR0b25zL1RvZ2dsZUJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uLCBJY29uQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJ1dHRvblNpemUgfSBmcm9tIFwiLi9CdXR0b25TaXplLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBSaWNoVGV4dFRvb2xiYXJBdHRycyB7XG5cdGVkaXRvcjogRWRpdG9yXG5cdGltYWdlQnV0dG9uQ2xpY2tIYW5kbGVyPzogKChldjogRXZlbnQsIGVkaXRvcjogRWRpdG9yKSA9PiB1bmtub3duKSB8IG51bGxcblx0YWxpZ25tZW50RW5hYmxlZD86IGJvb2xlYW5cblx0Zm9udFNpemVFbmFibGVkPzogYm9vbGVhblxuXHRjdXN0b21CdXR0b25BdHRycz86IEFycmF5PEljb25CdXR0b25BdHRycz5cbn1cblxuZXhwb3J0IGNsYXNzIFJpY2hUZXh0VG9vbGJhciBpbXBsZW1lbnRzIENvbXBvbmVudDxSaWNoVGV4dFRvb2xiYXJBdHRycz4ge1xuXHRzZWxlY3RlZFNpemUgPSBzaXplLmZvbnRfc2l6ZV9iYXNlXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxSaWNoVGV4dFRvb2xiYXJBdHRycz4pIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5zZWxlY3RlZFNpemUgPSBwYXJzZUludChhdHRycy5lZGl0b3Iuc3F1aXJlLmdldEZvbnRJbmZvKCkuc2l6ZS5zbGljZSgwLCAtMikpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5zZWxlY3RlZFNpemUgPSBzaXplLmZvbnRfc2l6ZV9iYXNlXG5cdFx0fVxuXHR9XG5cblx0b25jcmVhdGUodm5vZGU6IFZub2RlRE9NPGFueT4pOiB2b2lkIHtcblx0XHRjb25zdCBkb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRkb20uc3R5bGUuaGVpZ2h0ID0gXCIwXCJcblx0XHRhbmltYXRlVG9vbGJhcihkb20sIHRydWUpXG5cdH1cblxuXHRvbmJlZm9yZXJlbW92ZSh2bm9kZTogVm5vZGVET008YW55Pik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBhbmltYXRlVG9vbGJhcih2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIGZhbHNlKVxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPFJpY2hUZXh0VG9vbGJhckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmVsZXZhdGVkLWJnLm92ZXJmbG93LWhpZGRlblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHRvcDogXCIwcHhcIixcblx0XHRcdFx0XHRwb3NpdGlvbjpcblx0XHRcdFx0XHRcdGNsaWVudC5icm93c2VyID09PSBCcm93c2VyVHlwZS5TQUZBUklcblx0XHRcdFx0XHRcdFx0PyBjbGllbnQuaXNNYWNPU1xuXHRcdFx0XHRcdFx0XHRcdD8gXCItd2Via2l0LXN0aWNreVwiIC8vIHNhZmFyaSBvbiBtYWNvc1xuXHRcdFx0XHRcdFx0XHRcdDogXCJpbmhlcml0XCIgLy8gc3RpY2t5IGNoYW5nZXMgdGhlIHJlbmRlcmluZyBvcmRlciBvbiBpT1Ncblx0XHRcdFx0XHRcdFx0OiBcInN0aWNreVwiLCAvLyBub3JtYWwgYnJvd3NlcnNcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC1lbmQud3JhcC5pdGVtcy1jZW50ZXIubWIteHMubXQteHMubWwtYmV0d2Vlbi1zXCIsXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJTdHlsZUJ1dHRvbnMoYXR0cnMpLFxuXHRcdFx0XHRcdHRoaXMucmVuZGVyQ3VzdG9tQnV0dG9ucyhhdHRycyksXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJBbGlnbkRyb3BEb3duKGF0dHJzKSxcblx0XHRcdFx0XHR0aGlzLnJlbmRlclNpemVCdXR0b25zKGF0dHJzKSxcblx0XHRcdFx0XHR0aGlzLnJlbmRlclJlbW92ZUZvcm1hdHRpbmdCdXR0b24oYXR0cnMpLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0eWxlQnV0dG9ucyhhdHRyczogUmljaFRleHRUb29sYmFyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBlZGl0b3IsIGltYWdlQnV0dG9uQ2xpY2tIYW5kbGVyIH0gPSBhdHRyc1xuXG5cdFx0cmV0dXJuIFtcblx0XHRcdHRoaXMucmVuZGVyU3R5bGVUb2dnbGVCdXR0b24oXCJiXCIsIGxhbmcuZ2V0KFwiZm9ybWF0VGV4dEJvbGRfbXNnXCIpICsgXCIgKEN0cmwgKyBCKVwiLCBJY29ucy5Cb2xkLCBlZGl0b3IpLFxuXHRcdFx0dGhpcy5yZW5kZXJTdHlsZVRvZ2dsZUJ1dHRvbihcImlcIiwgbGFuZy5nZXQoXCJmb3JtYXRUZXh0SXRhbGljX21zZ1wiKSArIFwiIChDdHJsICsgSSlcIiwgSWNvbnMuSXRhbGljLCBlZGl0b3IpLFxuXHRcdFx0dGhpcy5yZW5kZXJTdHlsZVRvZ2dsZUJ1dHRvbihcInVcIiwgbGFuZy5nZXQoXCJmb3JtYXRUZXh0VW5kZXJsaW5lX21zZ1wiKSArIFwiIChDdHJsICsgVSlcIiwgSWNvbnMuVW5kZXJsaW5lLCBlZGl0b3IpLFxuXHRcdFx0dGhpcy5yZW5kZXJTdHlsZVRvZ2dsZUJ1dHRvbihcImNcIiwgbGFuZy5nZXQoXCJmb3JtYXRUZXh0TW9ub3NwYWNlX21zZ1wiKSwgSWNvbnMuQ29kZSwgZWRpdG9yKSxcblx0XHRcdHRoaXMucmVuZGVyU3R5bGVUb2dnbGVCdXR0b24oXCJhXCIsIGVkaXRvci5oYXNTdHlsZShcImFcIikgPyBsYW5nLmdldChcImJyZWFrTGlua19hY3Rpb25cIikgOiBsYW5nLmdldChcIm1ha2VMaW5rX2FjdGlvblwiKSwgSWNvbnMuTGluaywgZWRpdG9yKSxcblx0XHRcdHRoaXMucmVuZGVyTGlzdFRvZ2dsZUJ1dHRvbihcIm9sXCIsIGxhbmcuZ2V0KFwiZm9ybWF0VGV4dE9sX21zZ1wiKSArIFwiIChDdHJsICsgU2hpZnQgKyA5KVwiLCBJY29ucy5MaXN0T3JkZXJlZCwgZWRpdG9yKSxcblx0XHRcdHRoaXMucmVuZGVyTGlzdFRvZ2dsZUJ1dHRvbihcInVsXCIsIGxhbmcuZ2V0KFwiZm9ybWF0VGV4dFVsX21zZ1wiKSArIFwiIChDdHJsICsgU2hpZnQgKyA4KVwiLCBJY29ucy5MaXN0VW5vcmRlcmVkLCBlZGl0b3IpLFxuXHRcdFx0aW1hZ2VCdXR0b25DbGlja0hhbmRsZXJcblx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdHRpdGxlOiBcImluc2VydEltYWdlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IChldikgPT4gaW1hZ2VCdXR0b25DbGlja0hhbmRsZXIoZXYsIGVkaXRvciksXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5QaWN0dXJlLFxuXHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0eWxlVG9nZ2xlQnV0dG9uKHN0eWxlOiBTdHlsZSwgdGl0bGU6IHN0cmluZywgaWNvbjogSWNvbnMsIGVkaXRvcjogRWRpdG9yKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiB0aGlzLnJlbmRlclRvZ2dsZUJ1dHRvbihcblx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKHRpdGxlLCB0aXRsZSksXG5cdFx0XHRpY29uLFxuXHRcdFx0KCkgPT4gZWRpdG9yLnNldFN0eWxlKCFlZGl0b3IuaGFzU3R5bGUoc3R5bGUpLCBzdHlsZSksXG5cdFx0XHQoKSA9PiBlZGl0b3IuaGFzU3R5bGUoc3R5bGUpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGlzdFRvZ2dsZUJ1dHRvbihsaXN0aW5nOiBMaXN0aW5nLCB0aXRsZTogc3RyaW5nLCBpY29uOiBJY29ucywgZWRpdG9yOiBFZGl0b3IpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyVG9nZ2xlQnV0dG9uKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24odGl0bGUsIHRpdGxlKSxcblx0XHRcdGljb24sXG5cdFx0XHQoKSA9PlxuXHRcdFx0XHRlZGl0b3Iuc3R5bGVzLmxpc3RpbmcgPT09IGxpc3Rpbmdcblx0XHRcdFx0XHQ/IGVkaXRvci5zcXVpcmUucmVtb3ZlTGlzdCgpXG5cdFx0XHRcdFx0OiBsaXN0aW5nID09PSBcInVsXCJcblx0XHRcdFx0XHQ/IGVkaXRvci5zcXVpcmUubWFrZVVub3JkZXJlZExpc3QoKVxuXHRcdFx0XHRcdDogZWRpdG9yLnNxdWlyZS5tYWtlT3JkZXJlZExpc3QoKSxcblx0XHRcdCgpID0+IGVkaXRvci5zdHlsZXMubGlzdGluZyA9PT0gbGlzdGluZyxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRvZ2dsZUJ1dHRvbih0aXRsZTogTWF5YmVUcmFuc2xhdGlvbiwgaWNvbjogSWNvbnMsIGNsaWNrOiAoKSA9PiB2b2lkLCBpc1NlbGVjdGVkOiAoKSA9PiBib29sZWFuKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFRvZ2dsZUJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IHRpdGxlLFxuXHRcdFx0b25Ub2dnbGVkOiBjbGljayxcblx0XHRcdGljb246IGljb24sXG5cdFx0XHR0b2dnbGVkOiBpc1NlbGVjdGVkKCksXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ3VzdG9tQnV0dG9ucyhhdHRyczogUmljaFRleHRUb29sYmFyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIChhdHRycy5jdXN0b21CdXR0b25BdHRycyA/PyBbXSkubWFwKChhdHRycykgPT4gbShJY29uQnV0dG9uLCBhdHRycykpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFsaWduRHJvcERvd24oYXR0cnM6IFJpY2hUZXh0VG9vbGJhckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGlmIChhdHRycy5hbGlnbm1lbnRFbmFibGVkID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRjb25zdCBhbGlnbkJ1dHRvbkF0dHJzID0gKGFsaWdubWVudDogQWxpZ25tZW50LCB0aXRsZTogVHJhbnNsYXRpb25LZXksIGljb246IEljb25zKTogRHJvcGRvd25CdXR0b25BdHRycyA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRsYWJlbDogdGl0bGUsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0YXR0cnMuZWRpdG9yLnNxdWlyZS5zZXRUZXh0QWxpZ25tZW50KGFsaWdubWVudClcblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IGF0dHJzLmVkaXRvci5zcXVpcmUuZm9jdXMoKSwgMTAwKSAvLyBibHVyIGZvciB0aGUgZWRpdG9yIGlzIGZpcmVkIGFmdGVyIHRoZSBoYW5kbGVyIGZvciBzb21lIHJlYXNvblxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fSxcblx0XHRcdFx0aWNvbjogaWNvbixcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHQvLyBsYWJlbDogKCkgPT4gXCLilrxcIixcblx0XHRcdHRpdGxlOiBcImZvcm1hdFRleHRBbGlnbm1lbnRfbXNnXCIsXG5cdFx0XHRpY29uOiB0aGlzLmFsaWduSWNvbihhdHRycyksXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRjbGljazogKGUsIGRvbSkgPT4ge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdGNyZWF0ZURyb3Bkb3duKHtcblx0XHRcdFx0XHR3aWR0aDogMjAwLFxuXHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PiBbXG5cdFx0XHRcdFx0XHRhbGlnbkJ1dHRvbkF0dHJzKFwibGVmdFwiLCBcImZvcm1hdFRleHRMZWZ0X21zZ1wiLCBJY29ucy5BbGlnbkxlZnQpLFxuXHRcdFx0XHRcdFx0YWxpZ25CdXR0b25BdHRycyhcImNlbnRlclwiLCBcImZvcm1hdFRleHRDZW50ZXJfbXNnXCIsIEljb25zLkFsaWduQ2VudGVyKSxcblx0XHRcdFx0XHRcdGFsaWduQnV0dG9uQXR0cnMoXCJyaWdodFwiLCBcImZvcm1hdFRleHRSaWdodF9tc2dcIiwgSWNvbnMuQWxpZ25SaWdodCksXG5cdFx0XHRcdFx0XHRhbGlnbkJ1dHRvbkF0dHJzKFwianVzdGlmeVwiLCBcImZvcm1hdFRleHRKdXN0aWZ5X21zZ1wiLCBJY29ucy5BbGlnbkp1c3RpZmllZCksXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSkoZSwgZG9tKVxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhbGlnbkljb24oYXR0cnM6IFJpY2hUZXh0VG9vbGJhckF0dHJzKSB7XG5cdFx0c3dpdGNoIChhdHRycy5lZGl0b3Iuc3R5bGVzLmFsaWdubWVudCkge1xuXHRcdFx0Y2FzZSBcImxlZnRcIjpcblx0XHRcdFx0cmV0dXJuIEljb25zLkFsaWduTGVmdFxuXG5cdFx0XHRjYXNlIFwiY2VudGVyXCI6XG5cdFx0XHRcdHJldHVybiBJY29ucy5BbGlnbkNlbnRlclxuXG5cdFx0XHRjYXNlIFwicmlnaHRcIjpcblx0XHRcdFx0cmV0dXJuIEljb25zLkFsaWduUmlnaHRcblxuXHRcdFx0Y2FzZSBcImp1c3RpZnlcIjpcblx0XHRcdFx0cmV0dXJuIEljb25zLkFsaWduSnVzdGlmaWVkXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTaXplQnV0dG9ucyh7IGVkaXRvciB9OiBSaWNoVGV4dFRvb2xiYXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJmb3JtYXRUZXh0Rm9udFNpemVfbXNnXCIsXG5cdFx0XHRpY29uOiBJY29ucy5Gb250U2l6ZSxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdGNsaWNrOiAoZSwgZG9tKSA9PiB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0Y3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PlxuXHRcdFx0XHRcdFx0bnVtYmVyUmFuZ2UoOCwgMTQ0KS5tYXAoKG4pID0+IHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJmb250X3NpemVfXCIgKyBuLCBuLnRvU3RyaW5nKCkpLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlZGl0b3Iuc3F1aXJlLnNldEZvbnRTaXplKG4pXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnNlbGVjdGVkU2l6ZSA9IG5cblx0XHRcdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gZWRpdG9yLnNxdWlyZS5mb2N1cygpLCAxMDApIC8vIGJsdXIgZm9yIHRoZSBlZGl0b3IgaXMgZmlyZWQgYWZ0ZXIgdGhlIGhhbmRsZXIgZm9yIHNvbWUgcmVhc29uXG5cdFx0XHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0pKGUsIGRvbSlcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUmVtb3ZlRm9ybWF0dGluZ0J1dHRvbihhdHRyczogUmljaFRleHRUb29sYmFyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKGF0dHJzLmZvbnRTaXplRW5hYmxlZCA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwicmVtb3ZlRm9ybWF0dGluZ19hY3Rpb25cIixcblx0XHRcdGljb246IEljb25zLkZvcm1hdENsZWFyLFxuXHRcdFx0Y2xpY2s6IChlKSA9PiB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0YXR0cnMuZWRpdG9yLnNxdWlyZS5yZW1vdmVBbGxGb3JtYXR0aW5nKClcblx0XHRcdH0sXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYW5pbWF0ZVRvb2xiYXIoZG9tOiBIVE1MRWxlbWVudCwgYXBwZWFyOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGxldCBjaGlsZEhlaWdodCA9IEFycmF5LmZyb20oZG9tLmNoaWxkcmVuKVxuXHRcdC5tYXAoKGRvbUVsZW1lbnQpID0+IChkb21FbGVtZW50IGFzIEhUTUxFbGVtZW50KS5vZmZzZXRIZWlnaHQpXG5cdFx0LnJlZHVjZSgoY3VycmVudDogbnVtYmVyLCBwcmV2aW91czogbnVtYmVyKSA9PiBNYXRoLm1heChjdXJyZW50LCBwcmV2aW91cyksIDApXG5cdHJldHVybiBhbmltYXRpb25zLmFkZChkb20sIFtoZWlnaHQoYXBwZWFyID8gMCA6IGNoaWxkSGVpZ2h0LCBhcHBlYXIgPyBjaGlsZEhlaWdodCA6IDApLCBhcHBlYXIgPyBvcGFjaXR5KDAsIDEsIGZhbHNlKSA6IG9wYWNpdHkoMSwgMCwgZmFsc2UpXSkudGhlbigoKSA9PiB7XG5cdFx0aWYgKGFwcGVhcikge1xuXHRcdFx0ZG9tLnN0eWxlLmhlaWdodCA9IFwiXCJcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50IH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4vRWRpdG9yLmpzXCJcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vc2l6ZVwiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uL21pc2MvSHRtbFNhbml0aXplclwiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBEcm9wRG93blNlbGVjdG9yIH0gZnJvbSBcIi4uL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBSaWNoVGV4dFRvb2xiYXIsIFJpY2hUZXh0VG9vbGJhckF0dHJzIH0gZnJvbSBcIi4uL2Jhc2UvUmljaFRleHRUb29sYmFyLmpzXCJcblxuZXhwb3J0IGVudW0gSHRtbEVkaXRvck1vZGUge1xuXHRIVE1MID0gXCJodG1sXCIsXG5cdFdZU0lXWUcgPSBcIndoYXQgeW91IHNlZSBpcyB3aGF0IHlvdSBnZXRcIixcbn1cblxuZXhwb3J0IGNvbnN0IEhUTUxfRURJVE9SX0xJTkVfSEVJR0hUOiBudW1iZXIgPSAyNCAvLyBIZWlnaHQgcmVxdWlyZWQgZm9yIG9uZSBsaW5lIGluIHRoZSBIVE1MIGVkaXRvclxuXG5leHBvcnQgY2xhc3MgSHRtbEVkaXRvciBpbXBsZW1lbnRzIENvbXBvbmVudCB7XG5cdGVkaXRvcjogRWRpdG9yXG5cdHByaXZhdGUgbW9kZSA9IEh0bWxFZGl0b3JNb2RlLldZU0lXWUdcblx0cHJpdmF0ZSBhY3RpdmUgPSBmYWxzZVxuXHRwcml2YXRlIGRvbVRleHRBcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBfc2hvd0JvcmRlcnMgPSBmYWxzZVxuXHRwcml2YXRlIG1pbkhlaWdodDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBwbGFjZWhvbGRlcklkOiBUcmFuc2xhdGlvbktleSB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcGxhY2Vob2xkZXJEb21FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgdmFsdWUgPSBzdHJlYW0oXCJcIilcblx0cHJpdmF0ZSBodG1sTW9ub3NwYWNlID0gdHJ1ZVxuXHRwcml2YXRlIG1vZGVTd2l0Y2hlckxhYmVsOiBNYXliZVRyYW5zbGF0aW9uIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSB0b29sYmFyRW5hYmxlZCA9IGZhbHNlXG5cdHByaXZhdGUgdG9vbGJhckF0dHJzOiBPbWl0PFJpY2hUZXh0VG9vbGJhckF0dHJzLCBcImVkaXRvclwiPiA9IHt9XG5cdHByaXZhdGUgc3RhdGljTGluZUFtb3VudDogbnVtYmVyIHwgbnVsbCA9IG51bGwgLy8gU3RhdGljIGFtb3VudCBvZiBsaW5lcyB0aGUgZWRpdG9yIHNoYWxsIGFsbG93IGF0IGFsbCB0aW1lc1xuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgbGFiZWw/OiBNYXliZVRyYW5zbGF0aW9uLCBwcml2YXRlIHJlYWRvbmx5IGluamVjdGlvbnM/OiAoKSA9PiBDaGlsZHJlbikge1xuXHRcdHRoaXMuZWRpdG9yID0gbmV3IEVkaXRvcihudWxsLCAoaHRtbCkgPT4gaHRtbFNhbml0aXplci5zYW5pdGl6ZUZyYWdtZW50KGh0bWwsIHsgYmxvY2tFeHRlcm5hbENvbnRlbnQ6IGZhbHNlIH0pLmZyYWdtZW50LCBudWxsKVxuXHRcdHRoaXMudmlldyA9IHRoaXMudmlldy5iaW5kKHRoaXMpXG5cdFx0dGhpcy5pbml0aWFsaXplRWRpdG9yTGlzdGVuZXJzKClcblx0fVxuXG5cdHZpZXcoKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IG1vZGVTd2l0Y2hlckxhYmVsID0gdGhpcy5tb2RlU3dpdGNoZXJMYWJlbFxuXHRcdGxldCBib3JkZXJDbGFzc2VzID0gdGhpcy5fc2hvd0JvcmRlcnNcblx0XHRcdD8gdGhpcy5hY3RpdmUgJiYgdGhpcy5lZGl0b3IuaXNFbmFibGVkKClcblx0XHRcdFx0PyBcIi5lZGl0b3ItYm9yZGVyLWFjdGl2ZS5ib3JkZXItcmFkaXVzXCJcblx0XHRcdFx0OiBcIi5lZGl0b3ItYm9yZGVyLmJvcmRlci1yYWRpdXMuXCIgKyAobW9kZVN3aXRjaGVyTGFiZWwgIT0gbnVsbCA/IFwiLmVkaXRvci1uby10b3AtYm9yZGVyXCIgOiBcIlwiKVxuXHRcdFx0OiBcIlwiXG5cblx0XHRjb25zdCByZW5kZXJlZEluamVjdGlvbnMgPSB0aGlzLmluamVjdGlvbnM/LigpID8/IG51bGxcblxuXHRcdGNvbnN0IGdldFBsYWNlaG9sZGVyID0gKCkgPT5cblx0XHRcdCF0aGlzLmFjdGl2ZSAmJiB0aGlzLmlzRW1wdHkoKVxuXHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcIi5hYnMudGV4dC1lbGxpcHNpcy5ub3NlbGVjdC56MS5pLnByLXNcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4gKHRoaXMucGxhY2Vob2xkZXJEb21FbGVtZW50ID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KSxcblx0XHRcdFx0XHRcdFx0b25jbGljazogKCkgPT5cblx0XHRcdFx0XHRcdFx0XHR0aGlzLm1vZGUgPT09IEh0bWxFZGl0b3JNb2RlLldZU0lXWUcgPyBhc3NlcnROb3ROdWxsKHRoaXMuZWRpdG9yLmRvbUVsZW1lbnQpLmZvY3VzKCkgOiBhc3NlcnROb3ROdWxsKHRoaXMuZG9tVGV4dEFyZWEpLmZvY3VzKCksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dGhpcy5wbGFjZWhvbGRlcklkID8gbGFuZy5nZXQodGhpcy5wbGFjZWhvbGRlcklkKSA6IFwiXCIsXG5cdFx0XHRcdCAgKVxuXHRcdFx0XHQ6IG51bGxcblxuXHRcdHJldHVybiBtKFwiLmh0bWwtZWRpdG9yXCIgKyAodGhpcy5tb2RlID09PSBIdG1sRWRpdG9yTW9kZS5XWVNJV1lHID8gXCIudGV4dC1icmVha1wiIDogXCJcIiksIHsgY2xhc3M6IHRoaXMuZWRpdG9yLmlzRW5hYmxlZCgpID8gXCJcIiA6IFwiZGlzYWJsZWRcIiB9LCBbXG5cdFx0XHRtb2RlU3dpdGNoZXJMYWJlbCAhPSBudWxsXG5cdFx0XHRcdD8gbShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogbW9kZVN3aXRjaGVyTGFiZWwsXG5cdFx0XHRcdFx0XHRpdGVtczogW1xuXHRcdFx0XHRcdFx0XHR7IG5hbWU6IGxhbmcuZ2V0KFwicmljaFRleHRfbGFiZWxcIiksIHZhbHVlOiBIdG1sRWRpdG9yTW9kZS5XWVNJV1lHIH0sXG5cdFx0XHRcdFx0XHRcdHsgbmFtZTogbGFuZy5nZXQoXCJodG1sU291cmNlQ29kZV9sYWJlbFwiKSwgdmFsdWU6IEh0bWxFZGl0b3JNb2RlLkhUTUwgfSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlOiB0aGlzLm1vZGUsXG5cdFx0XHRcdFx0XHRzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlcjogKG1vZGU6IEh0bWxFZGl0b3JNb2RlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMubW9kZSA9IG1vZGVcblx0XHRcdFx0XHRcdFx0dGhpcy5zZXRWYWx1ZSh0aGlzLnZhbHVlKCkpXG5cdFx0XHRcdFx0XHRcdHRoaXMuaW5pdGlhbGl6ZUVkaXRvckxpc3RlbmVycygpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRcdHRoaXMubGFiZWwgPyBtKFwiLnNtYWxsLm10LWZvcm1cIiwgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQodGhpcy5sYWJlbCkpIDogbnVsbCxcblx0XHRcdG0oYm9yZGVyQ2xhc3NlcywgW1xuXHRcdFx0XHRnZXRQbGFjZWhvbGRlcigpLFxuXHRcdFx0XHR0aGlzLm1vZGUgPT09IEh0bWxFZGl0b3JNb2RlLldZU0lXWUdcblx0XHRcdFx0XHQ/IG0oXCIud3lzaXd5Zy5yZWwub3ZlcmZsb3ctaGlkZGVuLnNlbGVjdGFibGVcIiwgW1xuXHRcdFx0XHRcdFx0XHR0aGlzLmVkaXRvci5pc0VuYWJsZWQoKSAmJiAodGhpcy50b29sYmFyRW5hYmxlZCB8fCByZW5kZXJlZEluamVjdGlvbnMpXG5cdFx0XHRcdFx0XHRcdFx0PyBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG0oXCIuZmxleC1lbmQuc3RpY2t5LnBiLTJcIiwgW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudG9vbGJhckVuYWJsZWQgPyBtKFJpY2hUZXh0VG9vbGJhciwgT2JqZWN0LmFzc2lnbih7IGVkaXRvcjogdGhpcy5lZGl0b3IgfSwgdGhpcy50b29sYmFyQXR0cnMpKSA6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVuZGVyZWRJbmplY3Rpb25zLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bShcImhyLmhyLm1iLXNcIiksXG5cdFx0XHRcdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0XHRtKHRoaXMuZWRpdG9yLCB7XG5cdFx0XHRcdFx0XHRcdFx0b25jcmVhdGU6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZWRpdG9yLmluaXRpYWxpemVkLnByb21pc2UudGhlbigoKSA9PiB0aGlzLmVkaXRvci5zZXRIVE1MKHRoaXMudmFsdWUoKSkpXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRvbnJlbW92ZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52YWx1ZSh0aGlzLmdldFZhbHVlKCkpXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0ICBdKVxuXHRcdFx0XHRcdDogbShcblx0XHRcdFx0XHRcdFx0XCIuaHRtbFwiLFxuXHRcdFx0XHRcdFx0XHRtKFwidGV4dGFyZWEuaW5wdXQtYXJlYS5zZWxlY3RhYmxlXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmRvbVRleHRBcmVhID0gdm5vZGUuZG9tIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnRcblx0XHRcdFx0XHRcdFx0XHRcdGlmICghdGhpcy5pc0VtcHR5KCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21UZXh0QXJlYS52YWx1ZSA9IHRoaXMudmFsdWUoKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0b25mb2N1czogKCkgPT4gdGhpcy5mb2N1cygpLFxuXHRcdFx0XHRcdFx0XHRcdG9uYmx1cjogKCkgPT4gdGhpcy5ibHVyKCksXG5cdFx0XHRcdFx0XHRcdFx0b25pbnB1dDogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZG9tVGV4dEFyZWEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21UZXh0QXJlYS5zdHlsZS5oZWlnaHQgPSBcIjBweFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZG9tVGV4dEFyZWEuc3R5bGUuaGVpZ2h0ID0gdGhpcy5kb21UZXh0QXJlYS5zY3JvbGxIZWlnaHQgKyBcInB4XCJcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB0aGlzLnN0YXRpY0xpbmVBbW91bnRcblx0XHRcdFx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwibWF4LWhlaWdodFwiOiBweCh0aGlzLnN0YXRpY0xpbmVBbW91bnQgKiBIVE1MX0VESVRPUl9MSU5FX0hFSUdIVCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJtaW4taGVpZ2h0XCI6IHB4KHRoaXMuc3RhdGljTGluZUFtb3VudCAqIEhUTUxfRURJVE9SX0xJTkVfSEVJR0hUKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRvdmVyZmxvdzogXCJzY3JvbGxcIixcblx0XHRcdFx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0XHRcdFx0OiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJmb250LWZhbWlseVwiOiB0aGlzLmh0bWxNb25vc3BhY2UgPyBcIm1vbm9zcGFjZVwiIDogXCJpbmhlcml0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJtaW4taGVpZ2h0XCI6IHRoaXMubWluSGVpZ2h0ID8gcHgodGhpcy5taW5IZWlnaHQpIDogXCJpbml0aWFsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHQgIH0sXG5cdFx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ6ICF0aGlzLmVkaXRvci5pc0VuYWJsZWQoKSxcblx0XHRcdFx0XHRcdFx0XHRyZWFkb25seTogdGhpcy5lZGl0b3IuaXNSZWFkT25seSgpLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQgICksXG5cdFx0XHRdKSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBpbml0aWFsaXplRWRpdG9yTGlzdGVuZXJzKCkge1xuXHRcdHRoaXMuZWRpdG9yLmluaXRpYWxpemVkLnByb21pc2UudGhlbigoKSA9PiB7XG5cdFx0XHRjb25zdCBkb20gPSBhc3NlcnROb3ROdWxsKHRoaXMuZWRpdG9yPy5kb21FbGVtZW50KVxuXHRcdFx0ZG9tLm9uZm9jdXMgPSAoKSA9PiB0aGlzLmZvY3VzKClcblx0XHRcdGRvbS5vbmJsdXIgPSAoKSA9PiB0aGlzLmJsdXIoKVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGZvY3VzKCkge1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZVxuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdHByaXZhdGUgYmx1cigpIHtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlXG5cdFx0aWYgKHRoaXMubW9kZSA9PT0gSHRtbEVkaXRvck1vZGUuV1lTSVdZRykge1xuXHRcdFx0dGhpcy52YWx1ZSh0aGlzLmVkaXRvci5nZXRWYWx1ZSgpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZhbHVlKGFzc2VydE5vdE51bGwodGhpcy5kb21UZXh0QXJlYSkudmFsdWUpXG5cdFx0fVxuXHR9XG5cblx0c2V0TW9kZVN3aXRjaGVyKGxhYmVsOiBNYXliZVRyYW5zbGF0aW9uKTogdGhpcyB7XG5cdFx0dGhpcy5tb2RlU3dpdGNoZXJMYWJlbCA9IGxhYmVsXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHNob3dCb3JkZXJzKCk6IEh0bWxFZGl0b3Ige1xuXHRcdHRoaXMuX3Nob3dCb3JkZXJzID0gdHJ1ZVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRzZXRNaW5IZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBIdG1sRWRpdG9yIHtcblx0XHR0aGlzLm1pbkhlaWdodCA9IGhlaWdodFxuXHRcdHRoaXMuZWRpdG9yLnNldE1pbkhlaWdodChoZWlnaHQpXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXRzIGEgc3RhdGljIGFtb3VudCAnbicgb2YgbGluZXMgdGhlIEVkaXRvciBzaG91bGQgYWx3YXlzIHJlbmRlci9hbGxvdy5cblx0ICogV2hlbiB1c2luZyBuKzEgbGluZXMsIHRoZSBlZGl0b3Igd2lsbCBpbnN0ZWFkIGJlZ2luIHRvIGJlIHNjcm9sbGFibGUuXG5cdCAqIEN1cnJlbnRseSwgdGhpcyBvdmVyd3JpdGVzIG1pbi1oZWlnaHQuXG5cdCAqL1xuXHRzZXRTdGF0aWNOdW1iZXJPZkxpbmVzKG51bWJlck9mTGluZXM6IG51bWJlcik6IEh0bWxFZGl0b3Ige1xuXHRcdHRoaXMuc3RhdGljTGluZUFtb3VudCA9IG51bWJlck9mTGluZXNcblx0XHR0aGlzLmVkaXRvci5zZXRTdGF0aWNOdW1iZXJPZkxpbmVzKG51bWJlck9mTGluZXMpXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHNldFBsYWNlaG9sZGVySWQocGxhY2Vob2xkZXJJZDogVHJhbnNsYXRpb25LZXkpOiBIdG1sRWRpdG9yIHtcblx0XHR0aGlzLnBsYWNlaG9sZGVySWQgPSBwbGFjZWhvbGRlcklkXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdGdldFZhbHVlKCk6IHN0cmluZyB7XG5cdFx0aWYgKHRoaXMubW9kZSA9PT0gSHRtbEVkaXRvck1vZGUuV1lTSVdZRykge1xuXHRcdFx0aWYgKHRoaXMuZWRpdG9yLmlzQXR0YWNoZWQoKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5lZGl0b3IuZ2V0SFRNTCgpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy52YWx1ZSgpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICh0aGlzLmRvbVRleHRBcmVhKSB7XG5cdFx0XHRcdHJldHVybiBodG1sU2FuaXRpemVyLnNhbml0aXplSFRNTCh0aGlzLmRvbVRleHRBcmVhLnZhbHVlLCB7IGJsb2NrRXh0ZXJuYWxDb250ZW50OiBmYWxzZSB9KS5odG1sXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy52YWx1ZSgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIHNxdWlyZSBIVE1MIGVkaXRvciB1c3VhbGx5IGhhcyBzb21lIEhUTUwgd2hlbiBhcHBlYXJpbmcgZW1wdHksIHNvbWV0aW1lcyB3ZSBkb24ndCB3YW50IHRoYXQgY29udGVudC5cblx0ICovXG5cdGdldFRyaW1tZWRWYWx1ZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLmlzRW1wdHkoKSA/IFwiXCIgOiB0aGlzLmdldFZhbHVlKClcblx0fVxuXG5cdHNldFZhbHVlKGh0bWw6IHN0cmluZyk6IEh0bWxFZGl0b3Ige1xuXHRcdGlmICh0aGlzLm1vZGUgPT09IEh0bWxFZGl0b3JNb2RlLldZU0lXWUcpIHtcblx0XHRcdHRoaXMuZWRpdG9yLmluaXRpYWxpemVkLnByb21pc2UudGhlbigoKSA9PiB0aGlzLmVkaXRvci5zZXRIVE1MKGh0bWwpKVxuXHRcdH0gZWxzZSBpZiAodGhpcy5kb21UZXh0QXJlYSkge1xuXHRcdFx0dGhpcy5kb21UZXh0QXJlYS52YWx1ZSA9IGh0bWxcblx0XHR9XG5cdFx0dGhpcy52YWx1ZShodG1sKVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRzZXRTaG93T3V0bGluZShzaG93OiBib29sZWFuKSB7XG5cdFx0dGhpcy5lZGl0b3Iuc2V0U2hvd091dGxpbmUoc2hvdylcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0aXNBY3RpdmUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuYWN0aXZlXG5cdH1cblxuXHRpc0VtcHR5KCk6IGJvb2xlYW4ge1xuXHRcdC8vIGVpdGhlciBub3RoaW5nIG9yIGRlZmF1bHQgc3F1aXJlIGNvbnRlbnRcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSgpID09PSBcIlwiIHx8IG5ldyBSZWdFeHAoL148ZGl2KCBkaXI9W1wiJ11bQS16XSpbXCInXSk/Pjxicj48XFwvZGl2PiQvKS50ZXN0KHRoaXMudmFsdWUoKSlcblx0fVxuXG5cdC8qKiBzZXQgd2hldGhlciB0aGUgZGlhbG9nIHNob3VsZCBiZSBlZGl0YWJsZS4qL1xuXHRzZXRFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pOiBIdG1sRWRpdG9yIHtcblx0XHR0aGlzLmVkaXRvci5zZXRFbmFibGVkKGVuYWJsZWQpXG5cdFx0aWYgKHRoaXMuZG9tVGV4dEFyZWEpIHtcblx0XHRcdHRoaXMuZG9tVGV4dEFyZWEuZGlzYWJsZWQgPSAhZW5hYmxlZFxuXHRcdH1cblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0c2V0UmVhZE9ubHkocmVhZE9ubHk6IGJvb2xlYW4pOiB0aGlzIHtcblx0XHR0aGlzLmVkaXRvci5zZXRSZWFkT25seShyZWFkT25seSlcblx0XHRpZiAodGhpcy5kb21UZXh0QXJlYSkge1xuXHRcdFx0dGhpcy5kb21UZXh0QXJlYS5yZWFkT25seSA9IHJlYWRPbmx5XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRzZXRNb2RlKG1vZGU6IEh0bWxFZGl0b3JNb2RlKTogSHRtbEVkaXRvciB7XG5cdFx0dGhpcy5tb2RlID0gbW9kZVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRzZXRIdG1sTW9ub3NwYWNlKG1vbm9zcGFjZTogYm9vbGVhbik6IEh0bWxFZGl0b3Ige1xuXHRcdHRoaXMuaHRtbE1vbm9zcGFjZSA9IG1vbm9zcGFjZVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHQvKiogc2hvdyB0aGUgcmljaCB0ZXh0IHRvb2xiYXIgKi9cblx0ZW5hYmxlVG9vbGJhcigpOiB0aGlzIHtcblx0XHR0aGlzLnRvb2xiYXJFbmFibGVkID0gdHJ1ZVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRpc1Rvb2xiYXJFbmFibGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnRvb2xiYXJFbmFibGVkXG5cdH1cblxuXHQvKiogdG9nZ2xlIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSByaWNoIHRleHQgdG9vbGJhciAqL1xuXHR0b2dnbGVUb29sYmFyKCk6IHRoaXMge1xuXHRcdHRoaXMudG9vbGJhckVuYWJsZWQgPSAhdGhpcy50b29sYmFyRW5hYmxlZFxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRzZXRUb29sYmFyT3B0aW9ucyhhdHRyczogT21pdDxSaWNoVGV4dFRvb2xiYXJBdHRycywgXCJlZGl0b3JcIj4pOiB0aGlzIHtcblx0XHR0aGlzLnRvb2xiYXJBdHRycyA9IGF0dHJzXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLElBQUksZUFBZTtBQUNuQixJQUFJLFlBQVk7QUFDaEIsSUFBSSx1QkFBdUI7QUFDM0IsSUFBSSxTQUFTLE1BQU07QUFDbkIsSUFBSSxlQUFlLE1BQU07Q0FDeEIsWUFBWSxNQUFNLFVBQVUsUUFBUTtBQUNuQyxPQUFLLE9BQU87QUFDWixPQUFLLGNBQWM7QUFDbkIsT0FBSyxXQUFXO0FBQ2hCLE9BQUssU0FBUyxVQUFVO0NBQ3hCO0NBRUQsaUJBQWlCLE1BQU07RUFDdEIsTUFBTSxXQUFXLEtBQUs7RUFDdEIsTUFBTSxpQkFBaUIsYUFBYSxLQUFLLGVBQWUsZUFBZSxhQUFhLEtBQUssWUFBWSxZQUFZO0FBQ2pILFlBQVUsaUJBQWlCLEtBQUssYUFBYSxLQUFLLE9BQU8sS0FBSztDQUM5RDtDQUVELFdBQVc7RUFDVixNQUFNLE9BQU8sS0FBSztFQUNsQixJQUFJLFVBQVUsS0FBSztFQUNuQixJQUFJO0FBQ0osU0FBTyxNQUFNO0FBQ1osVUFBTyxRQUFRO0FBQ2YsV0FBUSxRQUFRLFNBQVM7QUFDeEIsUUFBSSxZQUFZLEtBQ2Y7QUFFRCxXQUFPLFFBQVE7QUFDZixTQUFLLEtBQ0osV0FBVSxRQUFRO0dBRW5CO0FBQ0QsUUFBSyxLQUNKLFFBQU87QUFFUixPQUFJLEtBQUssaUJBQWlCLEtBQUssRUFBRTtBQUNoQyxTQUFLLGNBQWM7QUFDbkIsV0FBTztH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