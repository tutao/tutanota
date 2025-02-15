
//#region libs/mithril.js
function Vnode(tag, key, attrs0, children, text, dom) {
	return {
		tag,
		key,
		attrs: attrs0,
		children,
		text,
		dom,
		domSize: undefined,
		state: undefined,
		events: undefined,
		instance: undefined
	};
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined);
	if (node == null || typeof node === "boolean") return null;
	if (typeof node === "object") return node;
	return Vnode("#", undefined, undefined, String(node), undefined, undefined);
};
Vnode.normalizeChildren = function(input) {
	var children = [];
	if (input.length) {
		var isKeyed = input[0] != null && input[0].key != null;
		for (var i = 1; i < input.length; i++) if ((input[i] != null && input[i].key != null) !== isKeyed) throw new TypeError(isKeyed && (input[i] != null || typeof input[i] === "boolean") ? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole." : "In fragments, vnodes must either all have keys or none have keys.");
		for (var i = 0; i < input.length; i++) children[i] = Vnode.normalize(input[i]);
	}
	return children;
};
var hyperscriptVnode = function() {
	var attrs1 = arguments[this], start = this + 1, children0;
	if (attrs1 == null) attrs1 = {};
else if (typeof attrs1 !== "object" || attrs1.tag != null || Array.isArray(attrs1)) {
		attrs1 = {};
		start = this;
	}
	if (arguments.length === start + 1) {
		children0 = arguments[start];
		if (!Array.isArray(children0)) children0 = [children0];
	} else {
		children0 = [];
		while (start < arguments.length) children0.push(arguments[start++]);
	}
	return Vnode("", attrs1.key, attrs1, children0);
};
var hasOwn = {}.hasOwnProperty;
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
var selectorCache = {};
function isEmpty(object) {
	for (var key in object) if (hasOwn.call(object, key)) return false;
	return true;
}
function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {};
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2];
		if (type === "" && value !== "") tag = value;
else if (type === "#") attrs.id = value;
else if (type === ".") classes.push(value);
else if (match[3][0] === "[") {
			var attrValue = match[6];
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
			if (match[4] === "class") classes.push(attrValue);
else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true;
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ");
	return selectorCache[selector] = {
		tag,
		attrs
	};
}
function execSelector(state, vnode) {
	var attrs = vnode.attrs;
	var hasClass = hasOwn.call(attrs, "class");
	var className = hasClass ? attrs.class : attrs.className;
	vnode.tag = state.tag;
	vnode.attrs = {};
	if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
		var newAttrs = {};
		for (var key in attrs) if (hasOwn.call(attrs, key)) newAttrs[key] = attrs[key];
		attrs = newAttrs;
	}
	for (var key in state.attrs) if (hasOwn.call(state.attrs, key) && key !== "className" && !hasOwn.call(attrs, key)) attrs[key] = state.attrs[key];
	if (className != null || state.attrs.className != null) attrs.className = className != null ? state.attrs.className != null ? String(state.attrs.className) + " " + String(className) : className : state.attrs.className != null ? state.attrs.className : null;
	if (hasClass) attrs.class = null;
	for (var key in attrs) if (hasOwn.call(attrs, key) && key !== "key") {
		vnode.attrs = attrs;
		break;
	}
	return vnode;
}
function hyperscript(selector) {
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") throw Error("The selector must be either a string or a component.");
	var vnode = hyperscriptVnode.apply(1, arguments);
	if (typeof selector === "string") {
		vnode.children = Vnode.normalizeChildren(vnode.children);
		if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode);
	}
	vnode.tag = selector;
	return vnode;
}
hyperscript.trust = function(html) {
	if (html == null) html = "";
	return Vnode("<", undefined, undefined, html, undefined, undefined);
};
hyperscript.fragment = function() {
	var vnode2 = hyperscriptVnode.apply(0, arguments);
	vnode2.tag = "[";
	vnode2.children = Vnode.normalizeChildren(vnode2.children);
	return vnode2;
};
var _13 = function($window) {
	var $doc = $window && $window.document;
	var currentRedraw;
	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	};
	function getNameSpace(vnode3) {
		return vnode3.attrs && vnode3.attrs.xmlns || nameSpace[vnode3.tag];
	}
	function checkState(vnode3, original) {
		if (vnode3.state !== original) throw new Error("'vnode.state' must not be modified.");
	}
	function callHook(vnode3) {
		var original = vnode3.state;
		try {
			return this.apply(original, arguments);
		} finally {
			checkState(vnode3, original);
		}
	}
	function activeElement() {
		try {
			return $doc.activeElement;
		} catch (e) {
			return null;
		}
	}
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode3 = vnodes[i];
			if (vnode3 != null) createNode(parent, vnode3, hooks, ns, nextSibling);
		}
	}
	function createNode(parent, vnode3, hooks, ns, nextSibling) {
		var tag = vnode3.tag;
		if (typeof tag === "string") {
			vnode3.state = {};
			if (vnode3.attrs != null) initLifecycle(vnode3.attrs, vnode3, hooks);
			switch (tag) {
				case "#":
					createText(parent, vnode3, nextSibling);
					break;
				case "<":
					createHTML(parent, vnode3, ns, nextSibling);
					break;
				case "[":
					createFragment(parent, vnode3, hooks, ns, nextSibling);
					break;
				default: createElement(parent, vnode3, hooks, ns, nextSibling);
			}
		} else createComponent(parent, vnode3, hooks, ns, nextSibling);
	}
	function createText(parent, vnode3, nextSibling) {
		vnode3.dom = $doc.createTextNode(vnode3.children);
		insertNode(parent, vnode3.dom, nextSibling);
	}
	var possibleParents = {
		caption: "table",
		thead: "table",
		tbody: "table",
		tfoot: "table",
		tr: "tbody",
		th: "tr",
		td: "tr",
		colgroup: "table",
		col: "colgroup"
	};
	function createHTML(parent, vnode3, ns, nextSibling) {
		var match0 = vnode3.children.match(/^\s*?<(\w+)/im) || [];
		var temp = $doc.createElement(possibleParents[match0[1]] || "div");
		if (ns === "http://www.w3.org/2000/svg") {
			temp.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\">" + vnode3.children + "</svg>";
			temp = temp.firstChild;
		} else temp.innerHTML = vnode3.children;
		vnode3.dom = temp.firstChild;
		vnode3.domSize = temp.childNodes.length;
		vnode3.instance = [];
		var fragment = $doc.createDocumentFragment();
		var child;
		while (child = temp.firstChild) {
			vnode3.instance.push(child);
			fragment.appendChild(child);
		}
		insertNode(parent, fragment, nextSibling);
	}
	function createFragment(parent, vnode3, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment();
		if (vnode3.children != null) {
			var children2 = vnode3.children;
			createNodes(fragment, children2, 0, children2.length, hooks, null, ns);
		}
		vnode3.dom = fragment.firstChild;
		vnode3.domSize = fragment.childNodes.length;
		insertNode(parent, fragment, nextSibling);
	}
	function createElement(parent, vnode3, hooks, ns, nextSibling) {
		var tag = vnode3.tag;
		var attrs2 = vnode3.attrs;
		var is = attrs2 && attrs2.is;
		ns = getNameSpace(vnode3) || ns;
		var element = ns ? is ? $doc.createElementNS(ns, tag, { is }) : $doc.createElementNS(ns, tag) : is ? $doc.createElement(tag, { is }) : $doc.createElement(tag);
		vnode3.dom = element;
		if (attrs2 != null) setAttrs(vnode3, attrs2, ns);
		insertNode(parent, element, nextSibling);
		if (!maybeSetContentEditable(vnode3)) {
			if (vnode3.children != null) {
				var children2 = vnode3.children;
				createNodes(element, children2, 0, children2.length, hooks, null, ns);
				if (vnode3.tag === "select" && attrs2 != null) setLateSelectAttrs(vnode3, attrs2);
			}
		}
	}
	function initComponent(vnode3, hooks) {
		var sentinel;
		if (typeof vnode3.tag.view === "function") {
			vnode3.state = Object.create(vnode3.tag);
			sentinel = vnode3.state.view;
			if (sentinel.$$reentrantLock$$ != null) return;
			sentinel.$$reentrantLock$$ = true;
		} else {
			vnode3.state = void 0;
			sentinel = vnode3.tag;
			if (sentinel.$$reentrantLock$$ != null) return;
			sentinel.$$reentrantLock$$ = true;
			vnode3.state = vnode3.tag.prototype != null && typeof vnode3.tag.prototype.view === "function" ? new vnode3.tag(vnode3) : vnode3.tag(vnode3);
		}
		initLifecycle(vnode3.state, vnode3, hooks);
		if (vnode3.attrs != null) initLifecycle(vnode3.attrs, vnode3, hooks);
		vnode3.instance = Vnode.normalize(callHook.call(vnode3.state.view, vnode3));
		if (vnode3.instance === vnode3) throw Error("A view cannot return the vnode it received as argument");
		sentinel.$$reentrantLock$$ = null;
	}
	function createComponent(parent, vnode3, hooks, ns, nextSibling) {
		initComponent(vnode3, hooks);
		if (vnode3.instance != null) {
			createNode(parent, vnode3.instance, hooks, ns, nextSibling);
			vnode3.dom = vnode3.instance.dom;
			vnode3.domSize = vnode3.dom != null ? vnode3.instance.domSize : 0;
		} else vnode3.domSize = 0;
	}
	/**
	* @param {Element|Fragment} parent - the parent element
	* @param {Vnode[] | null} old - the list of vnodes of the last `render0()` call for
	*                               this part of the tree
	* @param {Vnode[] | null} vnodes - as above, but for the current `render0()` call.
	* @param {Function[]} hooks - an accumulator of post-render0 hooks (oncreate/onupdate)
	* @param {Element | null} nextSibling - the next DOM node if we're dealing with a
	*                                       fragment that is not the last item in its
	*                                       parent
	* @param {'svg' | 'math' | String | null} ns) - the current XML namespace, if any
	* @returns void
	*/
	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return;
else if (old == null || old.length === 0) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns);
else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length);
else {
			var isOldKeyed = old[0] != null && old[0].key != null;
			var isKeyed0 = vnodes[0] != null && vnodes[0].key != null;
			var start = 0, oldStart = 0;
			if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++;
			if (!isKeyed0) while (start < vnodes.length && vnodes[start] == null) start++;
			if (isOldKeyed !== isKeyed0) {
				removeNodes(parent, old, oldStart, old.length);
				createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns);
			} else if (!isKeyed0) {
				var commonLength = old.length < vnodes.length ? old.length : vnodes.length;
				start = start < oldStart ? start : oldStart;
				for (; start < commonLength; start++) {
					o = old[start];
					v = vnodes[start];
					if (o === v || o == null && v == null) continue;
else if (o == null) createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling));
else if (v == null) removeNode(parent, o);
else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns);
				}
				if (old.length > commonLength) removeNodes(parent, old, start, old.length);
				if (vnodes.length > commonLength) createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns);
			} else {
				var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling;
				while (oldEnd >= oldStart && end >= start) {
					oe = old[oldEnd];
					ve = vnodes[end];
					if (oe.key !== ve.key) break;
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns);
					if (ve.dom != null) nextSibling = ve.dom;
					oldEnd--, end--;
				}
				while (oldEnd >= oldStart && end >= start) {
					o = old[oldStart];
					v = vnodes[start];
					if (o.key !== v.key) break;
					oldStart++, start++;
					if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns);
				}
				while (oldEnd >= oldStart && end >= start) {
					if (start === end) break;
					if (o.key !== ve.key || oe.key !== v.key) break;
					topSibling = getNextSibling(old, oldStart, nextSibling);
					moveNodes(parent, oe, topSibling);
					if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns);
					if (++start <= --end) moveNodes(parent, o, nextSibling);
					if (o !== ve) updateNode(parent, o, ve, hooks, nextSibling, ns);
					if (ve.dom != null) nextSibling = ve.dom;
					oldStart++;
					oldEnd--;
					oe = old[oldEnd];
					ve = vnodes[end];
					o = old[oldStart];
					v = vnodes[start];
				}
				while (oldEnd >= oldStart && end >= start) {
					if (oe.key !== ve.key) break;
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns);
					if (ve.dom != null) nextSibling = ve.dom;
					oldEnd--, end--;
					oe = old[oldEnd];
					ve = vnodes[end];
				}
				if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1);
else if (oldStart > oldEnd) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
else {
					var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li = 0, i = 0, pos = 2147483647, matched = 0, map, lisIndices;
					for (i = 0; i < vnodesLength; i++) oldIndices[i] = -1;
					for (i = end; i >= start; i--) {
						if (map == null) map = getKeyMap(old, oldStart, oldEnd + 1);
						ve = vnodes[i];
						var oldIndex = map[ve.key];
						if (oldIndex != null) {
							pos = oldIndex < pos ? oldIndex : -1;
							oldIndices[i - start] = oldIndex;
							oe = old[oldIndex];
							old[oldIndex] = null;
							if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns);
							if (ve.dom != null) nextSibling = ve.dom;
							matched++;
						}
					}
					nextSibling = originalNextSibling;
					if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1);
					if (matched === 0) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
else if (pos === -1) {
						lisIndices = makeLisIndices(oldIndices);
						li = lisIndices.length - 1;
						for (i = end; i >= start; i--) {
							v = vnodes[i];
							if (oldIndices[i - start] === -1) createNode(parent, v, hooks, ns, nextSibling);
else if (lisIndices[li] === i - start) li--;
else moveNodes(parent, v, nextSibling);
							if (v.dom != null) nextSibling = vnodes[i].dom;
						}
					} else for (i = end; i >= start; i--) {
						v = vnodes[i];
						if (oldIndices[i - start] === -1) createNode(parent, v, hooks, ns, nextSibling);
						if (v.dom != null) nextSibling = vnodes[i].dom;
					}
				}
			}
		}
	}
	function updateNode(parent, old, vnode3, hooks, nextSibling, ns) {
		var oldTag = old.tag, tag = vnode3.tag;
		if (oldTag === tag) {
			vnode3.state = old.state;
			vnode3.events = old.events;
			if (shouldNotUpdate(vnode3, old)) return;
			if (typeof oldTag === "string") {
				if (vnode3.attrs != null) updateLifecycle(vnode3.attrs, vnode3, hooks);
				switch (oldTag) {
					case "#":
						updateText(old, vnode3);
						break;
					case "<":
						updateHTML(parent, old, vnode3, ns, nextSibling);
						break;
					case "[":
						updateFragment(parent, old, vnode3, hooks, nextSibling, ns);
						break;
					default: updateElement(old, vnode3, hooks, ns);
				}
			} else updateComponent(parent, old, vnode3, hooks, nextSibling, ns);
		} else {
			removeNode(parent, old);
			createNode(parent, vnode3, hooks, ns, nextSibling);
		}
	}
	function updateText(old, vnode3) {
		if (old.children.toString() !== vnode3.children.toString()) old.dom.nodeValue = vnode3.children;
		vnode3.dom = old.dom;
	}
	function updateHTML(parent, old, vnode3, ns, nextSibling) {
		if (old.children !== vnode3.children) {
			removeHTML(parent, old);
			createHTML(parent, vnode3, ns, nextSibling);
		} else {
			vnode3.dom = old.dom;
			vnode3.domSize = old.domSize;
			vnode3.instance = old.instance;
		}
	}
	function updateFragment(parent, old, vnode3, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode3.children, hooks, nextSibling, ns);
		var domSize = 0, children2 = vnode3.children;
		vnode3.dom = null;
		if (children2 != null) {
			for (var i = 0; i < children2.length; i++) {
				var child = children2[i];
				if (child != null && child.dom != null) {
					if (vnode3.dom == null) vnode3.dom = child.dom;
					domSize += child.domSize || 1;
				}
			}
			if (domSize !== 1) vnode3.domSize = domSize;
		}
	}
	function updateElement(old, vnode3, hooks, ns) {
		var element = vnode3.dom = old.dom;
		ns = getNameSpace(vnode3) || ns;
		if (vnode3.tag === "textarea") {
			if (vnode3.attrs == null) vnode3.attrs = {};
		}
		updateAttrs(vnode3, old.attrs, vnode3.attrs, ns);
		if (!maybeSetContentEditable(vnode3)) updateNodes(element, old.children, vnode3.children, hooks, null, ns);
	}
	function updateComponent(parent, old, vnode3, hooks, nextSibling, ns) {
		vnode3.instance = Vnode.normalize(callHook.call(vnode3.state.view, vnode3));
		if (vnode3.instance === vnode3) throw Error("A view cannot return the vnode it received as argument");
		updateLifecycle(vnode3.state, vnode3, hooks);
		if (vnode3.attrs != null) updateLifecycle(vnode3.attrs, vnode3, hooks);
		if (vnode3.instance != null) {
			if (old.instance == null) createNode(parent, vnode3.instance, hooks, ns, nextSibling);
else updateNode(parent, old.instance, vnode3.instance, hooks, nextSibling, ns);
			vnode3.dom = vnode3.instance.dom;
			vnode3.domSize = vnode3.instance.domSize;
		} else if (old.instance != null) {
			removeNode(parent, old.instance);
			vnode3.dom = undefined;
			vnode3.domSize = 0;
		} else {
			vnode3.dom = old.dom;
			vnode3.domSize = old.domSize;
		}
	}
	function getKeyMap(vnodes, start, end) {
		var map = Object.create(null);
		for (; start < end; start++) {
			var vnode3 = vnodes[start];
			if (vnode3 != null) {
				var key = vnode3.key;
				if (key != null) map[key] = start;
			}
		}
		return map;
	}
	var lisTemp = [];
	function makeLisIndices(a) {
		var result = [0];
		var u = 0, v = 0, i = 0;
		var il = lisTemp.length = a.length;
		for (var i = 0; i < il; i++) lisTemp[i] = a[i];
		for (var i = 0; i < il; ++i) {
			if (a[i] === -1) continue;
			var j = result[result.length - 1];
			if (a[j] < a[i]) {
				lisTemp[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				var c = (u >>> 1) + (v >>> 1) + (u & v & 1);
				if (a[result[c]] < a[i]) u = c + 1;
else v = c;
			}
			if (a[i] < a[result[u]]) {
				if (u > 0) lisTemp[i] = result[u - 1];
				result[u] = i;
			}
		}
		u = result.length;
		v = result[u - 1];
		while (u-- > 0) {
			result[u] = v;
			v = lisTemp[v];
		}
		lisTemp.length = 0;
		return result;
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom;
		return nextSibling;
	}
	function moveNodes(parent, vnode3, nextSibling) {
		var frag = $doc.createDocumentFragment();
		moveChildToFrag(parent, frag, vnode3);
		insertNode(parent, frag, nextSibling);
	}
	function moveChildToFrag(parent, frag, vnode3) {
		while (vnode3.dom != null && vnode3.dom.parentNode === parent) {
			if (typeof vnode3.tag !== "string") {
				vnode3 = vnode3.instance;
				if (vnode3 != null) continue;
			} else if (vnode3.tag === "<") for (var i = 0; i < vnode3.instance.length; i++) frag.appendChild(vnode3.instance[i]);
else if (vnode3.tag !== "[") frag.appendChild(vnode3.dom);
else if (vnode3.children.length === 1) {
				vnode3 = vnode3.children[0];
				if (vnode3 != null) continue;
			} else for (var i = 0; i < vnode3.children.length; i++) {
				var child = vnode3.children[i];
				if (child != null) moveChildToFrag(parent, frag, child);
			}
			break;
		}
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling != null) parent.insertBefore(dom, nextSibling);
else parent.appendChild(dom);
	}
	function maybeSetContentEditable(vnode3) {
		if (vnode3.attrs == null || vnode3.attrs.contenteditable == null && vnode3.attrs.contentEditable == null) return false;
		var children2 = vnode3.children;
		if (children2 != null && children2.length === 1 && children2[0].tag === "<") {
			var content = children2[0].children;
			if (vnode3.dom.innerHTML !== content) vnode3.dom.innerHTML = content;
		} else if (children2 != null && children2.length !== 0) throw new Error("Child node of a contenteditable must be trusted.");
		return true;
	}
	function removeNodes(parent, vnodes, start, end) {
		for (var i = start; i < end; i++) {
			var vnode3 = vnodes[i];
			if (vnode3 != null) removeNode(parent, vnode3);
		}
	}
	function removeNode(parent, vnode3) {
		var mask = 0;
		var original = vnode3.state;
		var stateResult, attrsResult;
		if (typeof vnode3.tag !== "string" && typeof vnode3.state.onbeforeremove === "function") {
			var result = callHook.call(vnode3.state.onbeforeremove, vnode3);
			if (result != null && typeof result.then === "function") {
				mask = 1;
				stateResult = result;
			}
		}
		if (vnode3.attrs && typeof vnode3.attrs.onbeforeremove === "function") {
			var result = callHook.call(vnode3.attrs.onbeforeremove, vnode3);
			if (result != null && typeof result.then === "function") {
				mask |= 2;
				attrsResult = result;
			}
		}
		checkState(vnode3, original);
		if (!mask) {
			onremove(vnode3);
			removeChild(parent, vnode3);
		} else {
			if (stateResult != null) {
				var next = function() {
					if (mask & 1) {
						mask &= 2;
						if (!mask) reallyRemove();
					}
				};
				stateResult.then(next, next);
			}
			if (attrsResult != null) {
				var next = function() {
					if (mask & 2) {
						mask &= 1;
						if (!mask) reallyRemove();
					}
				};
				attrsResult.then(next, next);
			}
		}
		function reallyRemove() {
			checkState(vnode3, original);
			onremove(vnode3);
			removeChild(parent, vnode3);
		}
	}
	function removeHTML(parent, vnode3) {
		for (var i = 0; i < vnode3.instance.length; i++) parent.removeChild(vnode3.instance[i]);
	}
	function removeChild(parent, vnode3) {
		while (vnode3.dom != null && vnode3.dom.parentNode === parent) {
			if (typeof vnode3.tag !== "string") {
				vnode3 = vnode3.instance;
				if (vnode3 != null) continue;
			} else if (vnode3.tag === "<") removeHTML(parent, vnode3);
else {
				if (vnode3.tag !== "[") {
					parent.removeChild(vnode3.dom);
					if (!Array.isArray(vnode3.children)) break;
				}
				if (vnode3.children.length === 1) {
					vnode3 = vnode3.children[0];
					if (vnode3 != null) continue;
				} else for (var i = 0; i < vnode3.children.length; i++) {
					var child = vnode3.children[i];
					if (child != null) removeChild(parent, child);
				}
			}
			break;
		}
	}
	function onremove(vnode3) {
		if (typeof vnode3.tag !== "string" && typeof vnode3.state.onremove === "function") callHook.call(vnode3.state.onremove, vnode3);
		if (vnode3.attrs && typeof vnode3.attrs.onremove === "function") callHook.call(vnode3.attrs.onremove, vnode3);
		if (typeof vnode3.tag !== "string") {
			if (vnode3.instance != null) onremove(vnode3.instance);
		} else {
			var children2 = vnode3.children;
			if (Array.isArray(children2)) for (var i = 0; i < children2.length; i++) {
				var child = children2[i];
				if (child != null) onremove(child);
			}
		}
	}
	function setAttrs(vnode3, attrs2, ns) {
		if (vnode3.tag === "input" && attrs2.type != null) vnode3.dom.setAttribute("type", attrs2.type);
		var isFileInput = attrs2 != null && vnode3.tag === "input" && attrs2.type === "file";
		for (var key in attrs2) setAttr(vnode3, key, null, attrs2[key], ns, isFileInput);
	}
	function setAttr(vnode3, key, old, value, ns, isFileInput) {
		if (key === "key" || key === "is" || value == null || isLifecycleMethod(key) || old === value && !isFormAttribute(vnode3, key) && typeof value !== "object" || key === "type" && vnode3.tag === "input") return;
		if (key[0] === "o" && key[1] === "n") return updateEvent(vnode3, key, value);
		if (key.slice(0, 6) === "xlink:") vnode3.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value);
else if (key === "style") updateStyle(vnode3.dom, old, value);
else if (hasPropertyKey(vnode3, key, ns)) {
			if (key === "value") {
				if ((vnode3.tag === "input" || vnode3.tag === "textarea") && vnode3.dom.value === "" + value && (isFileInput || vnode3.dom === activeElement())) return;
				if (vnode3.tag === "select" && old !== null && vnode3.dom.value === "" + value) return;
				if (vnode3.tag === "option" && old !== null && vnode3.dom.value === "" + value) return;
				if (isFileInput && "" + value !== "") {
					console.error("`value` is read-only on file inputs!");
					return;
				}
			}
			vnode3.dom[key] = value;
		} else if (typeof value === "boolean") if (value) vnode3.dom.setAttribute(key, "");
else vnode3.dom.removeAttribute(key);
else vnode3.dom.setAttribute(key === "className" ? "class" : key, value);
	}
	function removeAttr(vnode3, key, old, ns) {
		if (key === "key" || key === "is" || old == null || isLifecycleMethod(key)) return;
		if (key[0] === "o" && key[1] === "n") updateEvent(vnode3, key, undefined);
else if (key === "style") updateStyle(vnode3.dom, old, null);
else if (hasPropertyKey(vnode3, key, ns) && key !== "className" && key !== "title" && !(key === "value" && (vnode3.tag === "option" || vnode3.tag === "select" && vnode3.dom.selectedIndex === -1 && vnode3.dom === activeElement())) && !(vnode3.tag === "input" && key === "type")) vnode3.dom[key] = null;
else {
			var nsLastIndex = key.indexOf(":");
			if (nsLastIndex !== -1) key = key.slice(nsLastIndex + 1);
			if (old !== false) vnode3.dom.removeAttribute(key === "className" ? "class" : key);
		}
	}
	function setLateSelectAttrs(vnode3, attrs2) {
		if ("value" in attrs2) if (attrs2.value === null) {
			if (vnode3.dom.selectedIndex !== -1) vnode3.dom.value = null;
		} else {
			var normalized = "" + attrs2.value;
			if (vnode3.dom.value !== normalized || vnode3.dom.selectedIndex === -1) vnode3.dom.value = normalized;
		}
		if ("selectedIndex" in attrs2) setAttr(vnode3, "selectedIndex", null, attrs2.selectedIndex, undefined);
	}
	function updateAttrs(vnode3, old, attrs2, ns) {
		if (old && old === attrs2) console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major");
		if (attrs2 != null) {
			if (vnode3.tag === "input" && attrs2.type != null) vnode3.dom.setAttribute("type", attrs2.type);
			var isFileInput = vnode3.tag === "input" && attrs2.type === "file";
			for (var key in attrs2) setAttr(vnode3, key, old && old[key], attrs2[key], ns, isFileInput);
		}
		var val;
		if (old != null) {
			for (var key in old) if ((val = old[key]) != null && (attrs2 == null || attrs2[key] == null)) removeAttr(vnode3, key, val, ns);
		}
	}
	function isFormAttribute(vnode3, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode3.dom === activeElement() || vnode3.tag === "option" && vnode3.dom.parentNode === $doc.activeElement;
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate";
	}
	function hasPropertyKey(vnode3, key, ns) {
		return ns === undefined && (vnode3.tag.indexOf("-") > -1 || vnode3.attrs != null && vnode3.attrs.is || key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height") && key in vnode3.dom;
	}
	var uppercaseRegex = /[A-Z]/g;
	function toLowerCase(capital) {
		return "-" + capital.toLowerCase();
	}
	function normalizeKey(key) {
		return key[0] === "-" && key[1] === "-" ? key : key === "cssFloat" ? "float" : key.replace(uppercaseRegex, toLowerCase);
	}
	function updateStyle(element, old, style) {
		if (old === style) {} else if (style == null) element.style.cssText = "";
else if (typeof style !== "object") element.style.cssText = style;
else if (old == null || typeof old !== "object") {
			element.style.cssText = "";
			for (var key in style) {
				var value = style[key];
				if (value != null) element.style.setProperty(normalizeKey(key), String(value));
			}
		} else {
			for (var key in style) {
				var value = style[key];
				if (value != null && (value = String(value)) !== String(old[key])) element.style.setProperty(normalizeKey(key), value);
			}
			for (var key in old) if (old[key] != null && style[key] == null) element.style.removeProperty(normalizeKey(key));
		}
	}
	function EventDict() {
		this._ = currentRedraw;
	}
	EventDict.prototype = Object.create(null);
	EventDict.prototype.handleEvent = function(ev) {
		var handler0 = this["on" + ev.type];
		var result;
		if (typeof handler0 === "function") result = handler0.call(ev.currentTarget, ev);
else if (typeof handler0.handleEvent === "function") handler0.handleEvent(ev);
		if (this._ && ev.redraw !== false) (0, this._)();
		if (result === false) {
			ev.preventDefault();
			ev.stopPropagation();
		}
	};
	function updateEvent(vnode3, key, value) {
		if (vnode3.events != null) {
			vnode3.events._ = currentRedraw;
			if (vnode3.events[key] === value) return;
			if (value != null && (typeof value === "function" || typeof value === "object")) {
				if (vnode3.events[key] == null) vnode3.dom.addEventListener(key.slice(2), vnode3.events, false);
				vnode3.events[key] = value;
			} else {
				if (vnode3.events[key] != null) vnode3.dom.removeEventListener(key.slice(2), vnode3.events, false);
				vnode3.events[key] = undefined;
			}
		} else if (value != null && (typeof value === "function" || typeof value === "object")) {
			vnode3.events = new EventDict();
			vnode3.dom.addEventListener(key.slice(2), vnode3.events, false);
			vnode3.events[key] = value;
		}
	}
	function initLifecycle(source, vnode3, hooks) {
		if (typeof source.oninit === "function") callHook.call(source.oninit, vnode3);
		if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode3));
	}
	function updateLifecycle(source, vnode3, hooks) {
		if (typeof source.onupdate === "function") hooks.push(callHook.bind(source.onupdate, vnode3));
	}
	function shouldNotUpdate(vnode3, old) {
		do {
			if (vnode3.attrs != null && typeof vnode3.attrs.onbeforeupdate === "function") {
				var force = callHook.call(vnode3.attrs.onbeforeupdate, vnode3, old);
				if (force !== undefined && !force) break;
			}
			if (typeof vnode3.tag !== "string" && typeof vnode3.state.onbeforeupdate === "function") {
				var force = callHook.call(vnode3.state.onbeforeupdate, vnode3, old);
				if (force !== undefined && !force) break;
			}
			return false;
		} while (false);
		vnode3.dom = old.dom;
		vnode3.domSize = old.domSize;
		vnode3.instance = old.instance;
		vnode3.attrs = old.attrs;
		vnode3.children = old.children;
		vnode3.text = old.text;
		return true;
	}
	var currentDOM;
	return function(dom, vnodes, redraw$1) {
		if (!dom) throw new TypeError("DOM element being rendered to does not exist.");
		if (currentDOM != null && dom.contains(currentDOM)) throw new TypeError("Node is currently being rendered to and thus is locked.");
		var prevRedraw = currentRedraw;
		var prevDOM = currentDOM;
		var hooks = [];
		var active = activeElement();
		var namespace = dom.namespaceURI;
		currentDOM = dom;
		currentRedraw = typeof redraw$1 === "function" ? redraw$1 : undefined;
		try {
			if (dom.vnodes == null) dom.textContent = "";
			vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes]);
			updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace);
			dom.vnodes = vnodes;
			if (active != null && activeElement() !== active && typeof active.focus === "function") active.focus();
			for (var i = 0; i < hooks.length; i++) hooks[i]();
		} finally {
			currentRedraw = prevRedraw;
			currentDOM = prevDOM;
		}
	};
};
var render = _13(typeof window !== "undefined" ? window : null);
var _16 = function(render0, schedule) {
	var subscriptions = [];
	var pending = false;
	var offset = -1;
	function sync() {
		for (offset = 0; offset < subscriptions.length; offset += 2) try {
			render0(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw$1);
		} catch (e) {
			console.error(e);
		}
		offset = -1;
	}
	function redraw$1() {
		if (!pending) {
			pending = true;
			schedule(function() {
				pending = false;
				sync();
			});
		}
	}
	redraw$1.sync = sync;
	function mount(root, component) {
		if (component != null && component.view == null && typeof component !== "function") throw new TypeError("m.mount expects a component, not a vnode.");
		var index = subscriptions.indexOf(root);
		if (index >= 0) {
			subscriptions.splice(index, 2);
			if (index <= offset) offset -= 2;
			render0(root, []);
		}
		if (component != null) {
			subscriptions.push(root, component);
			render0(root, Vnode(component), redraw$1);
		}
	}
	return {
		mount,
		redraw: redraw$1
	};
};
var mountRedraw0 = _16(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null);
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return "";
	var args = [];
	for (var key2 in object) destructure(key2, object[key2]);
	return args.join("&");
	function destructure(key2$1, value1) {
		if (Array.isArray(value1)) for (var i = 0; i < value1.length; i++) destructure(key2$1 + "[" + i + "]", value1[i]);
else if (Object.prototype.toString.call(value1) === "[object Object]") for (var i in value1) destructure(key2$1 + "[" + i + "]", value1[i]);
else args.push(encodeURIComponent(key2$1) + (value1 != null && value1 !== "" ? "=" + encodeURIComponent(value1) : ""));
	}
};
var assign = Object.assign || function(target, source) {
	for (var key3 in source) if (hasOwn.call(source, key3)) target[key3] = source[key3];
};
var buildPathname = function(template, params) {
	if (/:([^\/\.-]+)(\.{3})?:/.test(template)) throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.");
	if (params == null) return template;
	var queryIndex = template.indexOf("?");
	var hashIndex = template.indexOf("#");
	var queryEnd = hashIndex < 0 ? template.length : hashIndex;
	var pathEnd = queryIndex < 0 ? queryEnd : queryIndex;
	var path = template.slice(0, pathEnd);
	var query = {};
	assign(query, params);
	var resolved = path.replace(/:([^\/\.-]+)(\.{3})?/g, function(m4, key1, variadic) {
		delete query[key1];
		if (params[key1] == null) return m4;
		return variadic ? params[key1] : encodeURIComponent(String(params[key1]));
	});
	var newQueryIndex = resolved.indexOf("?");
	var newHashIndex = resolved.indexOf("#");
	var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex;
	var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex;
	var result0 = resolved.slice(0, newPathEnd);
	if (queryIndex >= 0) result0 += template.slice(queryIndex, queryEnd);
	if (newQueryIndex >= 0) result0 += (queryIndex < 0 ? "?" : "&") + resolved.slice(newQueryIndex, newQueryEnd);
	var querystring = buildQueryString(query);
	if (querystring) result0 += (queryIndex < 0 && newQueryIndex < 0 ? "?" : "&") + querystring;
	if (hashIndex >= 0) result0 += template.slice(hashIndex);
	if (newHashIndex >= 0) result0 += (hashIndex < 0 ? "" : "&") + resolved.slice(newHashIndex);
	return result0;
};
var mountRedraw = mountRedraw0;
var m = function m$1() {
	return hyperscript.apply(this, arguments);
};
m.m = hyperscript;
m.trust = hyperscript.trust;
m.fragment = hyperscript.fragment;
m.Fragment = "[";
m.mount = mountRedraw.mount;
var m6 = hyperscript;
function decodeURIComponentSave0(str) {
	try {
		return decodeURIComponent(str);
	} catch (err) {
		return str;
	}
}
var parseQueryString = function(string) {
	if (string === "" || string == null) return {};
	if (string.charAt(0) === "?") string = string.slice(1);
	var entries = string.split("&"), counters = {}, data0 = {};
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=");
		var key5 = decodeURIComponentSave0(entry[0]);
		var value2 = entry.length === 2 ? decodeURIComponentSave0(entry[1]) : "";
		if (value2 === "true") value2 = true;
else if (value2 === "false") value2 = false;
		var levels = key5.split(/\]\[?|\[/);
		var cursor = data0;
		if (key5.indexOf("[") > -1) levels.pop();
		for (var j0 = 0; j0 < levels.length; j0++) {
			var level = levels[j0], nextLevel = levels[j0 + 1];
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
			if (level === "") {
				var key5 = levels.slice(0, j0).join();
				if (counters[key5] == null) counters[key5] = Array.isArray(cursor) ? cursor.length : 0;
				level = counters[key5]++;
			} else if (level === "__proto__") break;
			if (j0 === levels.length - 1) cursor[level] = value2;
else {
				var desc = Object.getOwnPropertyDescriptor(cursor, level);
				if (desc != null) desc = desc.value;
				if (desc == null) cursor[level] = desc = isNumber ? [] : {};
				cursor = desc;
			}
		}
	}
	return data0;
};
var parsePathname = function(url) {
	var queryIndex0 = url.indexOf("?");
	var hashIndex0 = url.indexOf("#");
	var queryEnd0 = hashIndex0 < 0 ? url.length : hashIndex0;
	var pathEnd0 = queryIndex0 < 0 ? queryEnd0 : queryIndex0;
	var path1 = url.slice(0, pathEnd0).replace(/\/{2,}/g, "/");
	if (!path1) path1 = "/";
else {
		if (path1[0] !== "/") path1 = "/" + path1;
		if (path1.length > 1 && path1[path1.length - 1] === "/") path1 = path1.slice(0, -1);
	}
	return {
		path: path1,
		params: queryIndex0 < 0 ? {} : parseQueryString(url.slice(queryIndex0 + 1, queryEnd0))
	};
};
var compileTemplate = function(template) {
	var templateData = parsePathname(template);
	var templateKeys = Object.keys(templateData.params);
	var keys = [];
	var regexp = new RegExp("^" + templateData.path.replace(
		// I escape literal text so people can use things like `:file.:ext` or
		// `:lang-:locale` in routes. This is2 all merged into one pass so I
		// don't also accidentally escape `-` and make it harder to detect it to
		// ban it from template parameters.
		/:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
		function(m7, key6, extra) {
			if (key6 == null) return "\\" + m7;
			keys.push({
				k: key6,
				r: extra === "..."
			});
			if (extra === "...") return "(.*)";
			if (extra === ".") return "([^/]+)\\.";
			return "([^/]+)" + (extra || "");
		}
) + "$");
	return function(data1) {
		for (var i = 0; i < templateKeys.length; i++) if (templateData.params[templateKeys[i]] !== data1.params[templateKeys[i]]) return false;
		if (!keys.length) return regexp.test(data1.path);
		var values = regexp.exec(data1.path);
		if (values == null) return false;
		for (var i = 0; i < keys.length; i++) data1.params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1]);
		return true;
	};
};
var magic = new RegExp("^(?:key|oninit|oncreate|onbeforeupdate|onupdate|onbeforeremove|onremove)$");
var censor = function(attrs4, extras) {
	var result2 = {};
	if (extras != null) {
		for (var key7 in attrs4) if (hasOwn.call(attrs4, key7) && !magic.test(key7) && extras.indexOf(key7) < 0) result2[key7] = attrs4[key7];
	} else for (var key7 in attrs4) if (hasOwn.call(attrs4, key7) && !magic.test(key7)) result2[key7] = attrs4[key7];
	return result2;
};
var sentinel0 = {};
function decodeURIComponentSave(component) {
	try {
		return decodeURIComponent(component);
	} catch (e) {
		return component;
	}
}
var _28 = function($window, mountRedraw00) {
	var callAsync0 = $window == null ? null : typeof $window.setImmediate === "function" ? $window.setImmediate : $window.setTimeout;
	var p = Promise.resolve();
	var scheduled = false;
	var ready = false;
	var state = 0;
	var compiled, fallbackRoute;
	var currentResolver = sentinel0, component, attrs3, currentPath, lastUpdate;
	var RouterRoot = {
		onbeforeupdate: function() {
			state = state ? 2 : 1;
			return !(!state || sentinel0 === currentResolver);
		},
		onremove: function() {
			$window.removeEventListener("popstate", fireAsync, false);
			$window.removeEventListener("hashchange", resolveRoute, false);
		},
		view: function() {
			if (!state || sentinel0 === currentResolver) return;
			var vnode5 = [Vnode(component, attrs3.key, attrs3)];
			if (currentResolver) vnode5 = currentResolver.render(vnode5[0]);
			return vnode5;
		}
	};
	var SKIP = route$1.SKIP = {};
	function resolveRoute() {
		scheduled = false;
		var prefix = $window.location.hash;
		if (route$1.prefix[0] !== "#") {
			prefix = $window.location.search + prefix;
			if (route$1.prefix[0] !== "?") {
				prefix = $window.location.pathname + prefix;
				if (prefix[0] !== "/") prefix = "/" + prefix;
			}
		}
		var path0 = prefix.concat().replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponentSave).slice(route$1.prefix.length);
		var data = parsePathname(path0);
		assign(data.params, $window.history.state);
		function reject(e) {
			console.error(e);
			setPath(fallbackRoute, null, { replace: true });
		}
		loop(0);
		function loop(i) {
			for (; i < compiled.length; i++) if (compiled[i].check(data)) {
				var payload = compiled[i].component;
				var matchedRoute = compiled[i].route;
				var localComp = payload;
				var update = lastUpdate = function(comp) {
					if (update !== lastUpdate) return;
					if (comp === SKIP) return loop(i + 1);
					component = comp != null && (typeof comp.view === "function" || typeof comp === "function") ? comp : "div";
					attrs3 = data.params, currentPath = path0, lastUpdate = null;
					currentResolver = payload.render ? payload : null;
					if (state === 2) mountRedraw00.redraw();
else {
						state = 2;
						mountRedraw00.redraw.sync();
					}
				};
				if (payload.view || typeof payload === "function") {
					payload = {};
					update(localComp);
				} else if (payload.onmatch) p.then(function() {
					return payload.onmatch(data.params, path0, matchedRoute);
				}).then(update, path0 === fallbackRoute ? null : reject);
else update("div");
				return;
			}
			if (path0 === fallbackRoute) throw new Error("Could not resolve default route " + fallbackRoute + ".");
			setPath(fallbackRoute, null, { replace: true });
		}
	}
	function fireAsync() {
		if (!scheduled) {
			scheduled = true;
			callAsync0(resolveRoute);
		}
	}
	function setPath(path0, data, options) {
		path0 = buildPathname(path0, data);
		if (ready) {
			fireAsync();
			var state$1 = options ? options.state : null;
			var title = options ? options.title : null;
			if (options && options.replace) $window.history.replaceState(state$1, title, route$1.prefix + path0);
else $window.history.pushState(state$1, title, route$1.prefix + path0);
		} else $window.location.href = route$1.prefix + path0;
	}
	function route$1(root, defaultRoute, routes) {
		if (!root) throw new TypeError("DOM element being rendered to does not exist.");
		compiled = Object.keys(routes).map(function(route$2) {
			if (route$2[0] !== "/") throw new SyntaxError("Routes must start with a '/'.");
			if (/:([^\/\.-]+)(\.{3})?:/.test(route$2)) throw new SyntaxError("Route parameter names must be separated with either '/', '.', or '-'.");
			return {
				route: route$2,
				component: routes[route$2],
				check: compileTemplate(route$2)
			};
		});
		fallbackRoute = defaultRoute;
		if (defaultRoute != null) {
			var defaultData = parsePathname(defaultRoute);
			if (!compiled.some(function(i) {
				return i.check(defaultData);
			})) throw new ReferenceError("Default route doesn't match any known routes.");
		}
		if (typeof $window.history.pushState === "function") $window.addEventListener("popstate", fireAsync, false);
else if (route$1.prefix[0] === "#") $window.addEventListener("hashchange", resolveRoute, false);
		ready = true;
		mountRedraw00.mount(root, RouterRoot);
		resolveRoute();
	}
	route$1.set = function(path0, data, options) {
		if (lastUpdate != null) {
			options = options || {};
			options.replace = true;
		}
		lastUpdate = null;
		setPath(path0, data, options);
	};
	route$1.get = function() {
		return currentPath;
	};
	route$1.prefix = "#!";
	route$1.Link = { view: function(vnode5) {
		var child0 = m6(vnode5.attrs.selector || "a", censor(vnode5.attrs, [
			"options",
			"params",
			"selector",
			"onclick"
		]), vnode5.children);
		var options, onclick, href;
		if (child0.attrs.disabled = Boolean(child0.attrs.disabled)) {
			child0.attrs.href = null;
			child0.attrs["aria-disabled"] = "true";
		} else {
			options = vnode5.attrs.options;
			onclick = vnode5.attrs.onclick;
			href = buildPathname(child0.attrs.href, vnode5.attrs.params);
			child0.attrs.href = route$1.prefix + href;
			child0.attrs.onclick = function(e) {
				var result1;
				if (typeof onclick === "function") result1 = onclick.call(e.currentTarget, e);
else if (onclick == null || typeof onclick !== "object") {} else if (typeof onclick.handleEvent === "function") onclick.handleEvent(e);
				if (result1 !== false && !e.defaultPrevented && (e.button === 0 || e.which === 0 || e.which === 1) && (!e.currentTarget.target || e.currentTarget.target === "_self") && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
					e.preventDefault();
					e.redraw = false;
					route$1.set(href, null, options);
				}
			};
		}
		return child0;
	} };
	route$1.param = function(key4) {
		return attrs3 && key4 != null ? attrs3[key4] : attrs3;
	};
	return route$1;
};
m.route = _28(typeof window !== "undefined" ? window : null, mountRedraw);
m.render = render;
m.redraw = mountRedraw.redraw;
m.parseQueryString = parseQueryString;
m.buildQueryString = buildQueryString;
m.parsePathname = parsePathname;
m.buildPathname = buildPathname;
m.vnode = Vnode;
m.censor = censor;
var mithril_default = m;
const route = m.route;
const redraw = m.redraw;

//#endregion
export { buildQueryString, mithril_default, parseQueryString, redraw, route };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWl0aHJpbC1jaHVuay5qcyIsIm5hbWVzIjpbInJlZHJhdyIsImtleTIiLCJtIiwicm91dGUiLCJzdGF0ZSJdLCJzb3VyY2VzIjpbIi4uL2xpYnMvbWl0aHJpbC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gaXZrOiBwYXRjaGVkIHRvIGZpeCBlYXJseSBjb25zb2xlIGJpbmRpbmdcbi8vLyBpdms6IHBhdGNoZWQgdG8gcmVtb3ZlIHByb21pc2UgcG9seWZpbGwgYW5kIG0ucmVxdWVzdFxuLy8vIGl2azogbWFkZSBlc20gbW9kdWxlXG5cbmZ1bmN0aW9uIFZub2RlKHRhZywga2V5LCBhdHRyczAsIGNoaWxkcmVuLCB0ZXh0LCBkb20pIHtcblx0cmV0dXJuIHt0YWc6IHRhZywga2V5OiBrZXksIGF0dHJzOiBhdHRyczAsIGNoaWxkcmVuOiBjaGlsZHJlbiwgdGV4dDogdGV4dCwgZG9tOiBkb20sIGRvbVNpemU6IHVuZGVmaW5lZCwgc3RhdGU6IHVuZGVmaW5lZCwgZXZlbnRzOiB1bmRlZmluZWQsIGluc3RhbmNlOiB1bmRlZmluZWR9XG5cdH1cblZub2RlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSByZXR1cm4gVm5vZGUoXCJbXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBWbm9kZS5ub3JtYWxpemVDaGlsZHJlbihub2RlKSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cdGlmIChub2RlID09IG51bGwgfHwgdHlwZW9mIG5vZGUgPT09IFwiYm9vbGVhblwiKSByZXR1cm4gbnVsbFxuXHRpZiAodHlwZW9mIG5vZGUgPT09IFwib2JqZWN0XCIpIHJldHVybiBub2RlXG5cdHJldHVybiBWbm9kZShcIiNcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFN0cmluZyhub2RlKSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG5Wbm9kZS5ub3JtYWxpemVDaGlsZHJlbiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXVxuXHRpZiAoaW5wdXQubGVuZ3RoKSB7XG5cdFx0dmFyIGlzS2V5ZWQgPSBpbnB1dFswXSAhPSBudWxsICYmIGlucHV0WzBdLmtleSAhPSBudWxsXG5cdFx0Ly8gTm90ZTogdGhpcyBpcyBhICp2ZXJ5KiBwZXJmLXNlbnNpdGl2ZSBjaGVjay5cblx0XHQvLyBGdW4gZmFjdDogbWVyZ2luZyB0aGUgbG9vcCBsaWtlIHRoaXMgaXMgc29tZWhvdyBmYXN0ZXIgdGhhbiBzcGxpdHRpbmdcblx0XHQvLyBpdCwgbm90aWNlYWJseSBzby5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoKGlucHV0W2ldICE9IG51bGwgJiYgaW5wdXRbaV0ua2V5ICE9IG51bGwpICE9PSBpc0tleWVkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXG5cdFx0XHRcdFx0aXNLZXllZCAmJiAoaW5wdXRbaV0gIT0gbnVsbCB8fCB0eXBlb2YgaW5wdXRbaV0gPT09IFwiYm9vbGVhblwiKVxuXHRcdFx0XHRcdFx0PyBcIkluIGZyYWdtZW50cywgdm5vZGVzIG11c3QgZWl0aGVyIGFsbCBoYXZlIGtleXMgb3Igbm9uZSBoYXZlIGtleXMuIFlvdSBtYXkgd2lzaCB0byBjb25zaWRlciB1c2luZyBhbiBleHBsaWNpdCBrZXllZCBlbXB0eSBmcmFnbWVudCwgbS5mcmFnbWVudCh7a2V5OiAuLi59KSwgaW5zdGVhZCBvZiBhIGhvbGUuXCJcblx0XHRcdFx0XHRcdDogXCJJbiBmcmFnbWVudHMsIHZub2RlcyBtdXN0IGVpdGhlciBhbGwgaGF2ZSBrZXlzIG9yIG5vbmUgaGF2ZSBrZXlzLlwiXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y2hpbGRyZW5baV0gPSBWbm9kZS5ub3JtYWxpemUoaW5wdXRbaV0pXG5cdFx0fVxuXHR9XG5cdHJldHVybiBjaGlsZHJlblxufVxuLy8gQ2FsbCB2aWEgYGh5cGVyc2NyaXB0Vm5vZGUwLmFwcGx5KHN0YXJ0T2Zmc2V0LCBhcmd1bWVudHMpYFxuLy9cbi8vIFRoZSByZWFzb24gSSBkbyBpdCB0aGlzIHdheSwgZm9yd2FyZGluZyB0aGUgYXJndW1lbnRzIGFuZCBwYXNzaW5nIHRoZSBzdGFydFxuLy8gb2Zmc2V0IGluIGB0aGlzYCwgaXMgc28gSSBkb24ndCBoYXZlIHRvIGNyZWF0ZSBhIHRlbXBvcmFyeSBhcnJheSBpbiBhXG4vLyBwZXJmb3JtYW5jZS1jcml0aWNhbCBwYXRoLlxuLy9cbi8vIEluIG5hdGl2ZSBFUzYsIEknZCBpbnN0ZWFkIGFkZCBhIGZpbmFsIGAuLi5hcmdzYCBwYXJhbWV0ZXIgdG8gdGhlXG4vLyBgaHlwZXJzY3JpcHQwYCBhbmQgYGZyYWdtZW50YCBmYWN0b3JpZXMgYW5kIGRlZmluZSB0aGlzIGFzXG4vLyBgaHlwZXJzY3JpcHRWbm9kZTAoLi4uYXJncylgLCBzaW5jZSBtb2Rlcm4gZW5naW5lcyBkbyBvcHRpbWl6ZSB0aGF0IGF3YXkuIEJ1dFxuLy8gRVM1ICh3aGF0IE1pdGhyaWwuanMgcmVxdWlyZXMgdGhhbmtzIHRvIElFIHN1cHBvcnQpIGRvZXNuJ3QgZ2l2ZSBtZSB0aGF0IGx1eHVyeSxcbi8vIGFuZCBlbmdpbmVzIGFyZW4ndCBuZWFybHkgaW50ZWxsaWdlbnQgZW5vdWdoIHRvIGRvIGVpdGhlciBvZiB0aGVzZTpcbi8vXG4vLyAxLiBFbGlkZSB0aGUgYWxsb2NhdGlvbiBmb3IgYFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKWAgd2hlbiBpdCdzIHBhc3NlZCB0b1xuLy8gICAgYW5vdGhlciBmdW5jdGlvbiBvbmx5IHRvIGJlIGluZGV4ZWQuXG4vLyAyLiBFbGlkZSBhbiBgYXJndW1lbnRzYCBhbGxvY2F0aW9uIHdoZW4gaXQncyBwYXNzZWQgdG8gYW55IGZ1bmN0aW9uIG90aGVyXG4vLyAgICB0aGFuIGBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHlgIG9yIGBSZWZsZWN0LmFwcGx5YC5cbi8vXG4vLyBJbiBFUzYsIGl0J2QgcHJvYmFibHkgbG9vayBjbG9zZXIgdG8gdGhpcyAoSSdkIG5lZWQgdG8gcHJvZmlsZSBpdCwgdGhvdWdoKTpcbi8vIHZhciBoeXBlcnNjcmlwdFZub2RlID0gZnVuY3Rpb24oYXR0cnMxLCAuLi5jaGlsZHJlbjApIHtcbi8vICAgICBpZiAoYXR0cnMxID09IG51bGwgfHwgdHlwZW9mIGF0dHJzMSA9PT0gXCJvYmplY3RcIiAmJiBhdHRyczEudGFnID09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkoYXR0cnMxKSkge1xuLy8gICAgICAgICBpZiAoY2hpbGRyZW4wLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGNoaWxkcmVuMFswXSkpIGNoaWxkcmVuMCA9IGNoaWxkcmVuMFswXVxuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIGNoaWxkcmVuMCA9IGNoaWxkcmVuMC5sZW5ndGggPT09IDAgJiYgQXJyYXkuaXNBcnJheShhdHRyczEpID8gYXR0cnMxIDogW2F0dHJzMSwgLi4uY2hpbGRyZW4wXVxuLy8gICAgICAgICBhdHRyczEgPSB1bmRlZmluZWRcbi8vICAgICB9XG4vL1xuLy8gICAgIGlmIChhdHRyczEgPT0gbnVsbCkgYXR0cnMxID0ge31cbi8vICAgICByZXR1cm4gVm5vZGUoXCJcIiwgYXR0cnMxLmtleSwgYXR0cnMxLCBjaGlsZHJlbjApXG4vLyB9XG52YXIgaHlwZXJzY3JpcHRWbm9kZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGF0dHJzMSA9IGFyZ3VtZW50c1t0aGlzXSwgc3RhcnQgPSB0aGlzICsgMSwgY2hpbGRyZW4wXG5cdGlmIChhdHRyczEgPT0gbnVsbCkge1xuXHRcdGF0dHJzMSA9IHt9XG5cdH0gZWxzZSBpZiAodHlwZW9mIGF0dHJzMSAhPT0gXCJvYmplY3RcIiB8fCBhdHRyczEudGFnICE9IG51bGwgfHwgQXJyYXkuaXNBcnJheShhdHRyczEpKSB7XG5cdFx0YXR0cnMxID0ge31cblx0XHRzdGFydCA9IHRoaXNcblx0fVxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gc3RhcnQgKyAxKSB7XG5cdFx0Y2hpbGRyZW4wID0gYXJndW1lbnRzW3N0YXJ0XVxuXHRcdGlmICghQXJyYXkuaXNBcnJheShjaGlsZHJlbjApKSBjaGlsZHJlbjAgPSBbY2hpbGRyZW4wXVxuXHR9IGVsc2Uge1xuXHRcdGNoaWxkcmVuMCA9IFtdXG5cdFx0d2hpbGUgKHN0YXJ0IDwgYXJndW1lbnRzLmxlbmd0aCkgY2hpbGRyZW4wLnB1c2goYXJndW1lbnRzW3N0YXJ0KytdKVxuXHR9XG5cdHJldHVybiBWbm9kZShcIlwiLCBhdHRyczEua2V5LCBhdHRyczEsIGNoaWxkcmVuMClcbn1cbi8vIFRoaXMgZXhpc3RzIHNvIEknbTEgb25seSBzYXZpbmcgaXQgb25jZS5cbnZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eVxudmFyIHNlbGVjdG9yUGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsoLis/KSg/Olxccyo9XFxzKihcInwnfCkoKD86XFxcXFtcIidcXF1dfC4pKj8pXFw1KT9cXF0pL2dcbnZhciBzZWxlY3RvckNhY2hlID0ge31cblxuZnVuY3Rpb24gaXNFbXB0eShvYmplY3QpIHtcblx0Zm9yICh2YXIga2V5IGluIG9iamVjdCkgaWYgKGhhc093bi5jYWxsKG9iamVjdCwga2V5KSkgcmV0dXJuIGZhbHNlXG5cdHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVTZWxlY3RvcihzZWxlY3Rvcikge1xuXHR2YXIgbWF0Y2gsIHRhZyA9IFwiZGl2XCIsIGNsYXNzZXMgPSBbXSwgYXR0cnMgPSB7fVxuXHR3aGlsZSAobWF0Y2ggPSBzZWxlY3RvclBhcnNlci5leGVjKHNlbGVjdG9yKSkge1xuXHRcdHZhciB0eXBlID0gbWF0Y2hbMV0sIHZhbHVlID0gbWF0Y2hbMl1cblx0XHRpZiAodHlwZSA9PT0gXCJcIiAmJiB2YWx1ZSAhPT0gXCJcIikgdGFnID0gdmFsdWVcblx0XHRlbHNlIGlmICh0eXBlID09PSBcIiNcIikgYXR0cnMuaWQgPSB2YWx1ZVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09IFwiLlwiKSBjbGFzc2VzLnB1c2godmFsdWUpXG5cdFx0ZWxzZSBpZiAobWF0Y2hbM11bMF0gPT09IFwiW1wiKSB7XG5cdFx0XHR2YXIgYXR0clZhbHVlID0gbWF0Y2hbNl1cblx0XHRcdGlmIChhdHRyVmFsdWUpIGF0dHJWYWx1ZSA9IGF0dHJWYWx1ZS5yZXBsYWNlKC9cXFxcKFtcIiddKS9nLCBcIiQxXCIpLnJlcGxhY2UoL1xcXFxcXFxcL2csIFwiXFxcXFwiKVxuXHRcdFx0aWYgKG1hdGNoWzRdID09PSBcImNsYXNzXCIpIGNsYXNzZXMucHVzaChhdHRyVmFsdWUpXG5cdFx0XHRlbHNlIGF0dHJzW21hdGNoWzRdXSA9IGF0dHJWYWx1ZSA9PT0gXCJcIiA/IGF0dHJWYWx1ZSA6IGF0dHJWYWx1ZSB8fCB0cnVlXG5cdFx0fVxuXHR9XG5cdGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIGF0dHJzLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbihcIiBcIilcblx0cmV0dXJuIHNlbGVjdG9yQ2FjaGVbc2VsZWN0b3JdID0ge3RhZzogdGFnLCBhdHRyczogYXR0cnN9XG59XG5cbmZ1bmN0aW9uIGV4ZWNTZWxlY3RvcihzdGF0ZSwgdm5vZGUpIHtcblx0dmFyIGF0dHJzID0gdm5vZGUuYXR0cnNcblx0dmFyIGhhc0NsYXNzID0gaGFzT3duLmNhbGwoYXR0cnMsIFwiY2xhc3NcIilcblx0dmFyIGNsYXNzTmFtZSA9IGhhc0NsYXNzID8gYXR0cnMuY2xhc3MgOiBhdHRycy5jbGFzc05hbWVcblx0dm5vZGUudGFnID0gc3RhdGUudGFnXG5cdHZub2RlLmF0dHJzID0ge31cblx0aWYgKCFpc0VtcHR5KHN0YXRlLmF0dHJzKSAmJiAhaXNFbXB0eShhdHRycykpIHtcblx0XHR2YXIgbmV3QXR0cnMgPSB7fVxuXHRcdGZvciAodmFyIGtleSBpbiBhdHRycykge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKGF0dHJzLCBrZXkpKSBuZXdBdHRyc1trZXldID0gYXR0cnNba2V5XVxuXHRcdH1cblx0XHRhdHRycyA9IG5ld0F0dHJzXG5cdH1cblx0Zm9yICh2YXIga2V5IGluIHN0YXRlLmF0dHJzKSB7XG5cdFx0aWYgKGhhc093bi5jYWxsKHN0YXRlLmF0dHJzLCBrZXkpICYmIGtleSAhPT0gXCJjbGFzc05hbWVcIiAmJiAhaGFzT3duLmNhbGwoYXR0cnMsIGtleSkpIHtcblx0XHRcdGF0dHJzW2tleV0gPSBzdGF0ZS5hdHRyc1trZXldXG5cdFx0fVxuXHR9XG5cdGlmIChjbGFzc05hbWUgIT0gbnVsbCB8fCBzdGF0ZS5hdHRycy5jbGFzc05hbWUgIT0gbnVsbCkgYXR0cnMuY2xhc3NOYW1lID1cblx0XHRcdGNsYXNzTmFtZSAhPSBudWxsXG5cdFx0XHRcdD8gc3RhdGUuYXR0cnMuY2xhc3NOYW1lICE9IG51bGxcblx0XHRcdFx0XHQ/IFN0cmluZyhzdGF0ZS5hdHRycy5jbGFzc05hbWUpICsgXCIgXCIgKyBTdHJpbmcoY2xhc3NOYW1lKVxuXHRcdFx0XHRcdDogY2xhc3NOYW1lXG5cdFx0XHRcdDogc3RhdGUuYXR0cnMuY2xhc3NOYW1lICE9IG51bGxcblx0XHRcdFx0XHQ/IHN0YXRlLmF0dHJzLmNsYXNzTmFtZVxuXHRcdFx0XHRcdDogbnVsbFxuXHRpZiAoaGFzQ2xhc3MpIGF0dHJzLmNsYXNzID0gbnVsbFxuXHRmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcblx0XHRpZiAoaGFzT3duLmNhbGwoYXR0cnMsIGtleSkgJiYga2V5ICE9PSBcImtleVwiKSB7XG5cdFx0XHR2bm9kZS5hdHRycyA9IGF0dHJzXG5cdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdm5vZGVcbn1cblxuZnVuY3Rpb24gaHlwZXJzY3JpcHQoc2VsZWN0b3IpIHtcblx0aWYgKHNlbGVjdG9yID09IG51bGwgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiBzZWxlY3RvciAhPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBzZWxlY3Rvci52aWV3ICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHR0aHJvdyBFcnJvcihcIlRoZSBzZWxlY3RvciBtdXN0IGJlIGVpdGhlciBhIHN0cmluZyBvciBhIGNvbXBvbmVudC5cIik7XG5cdH1cblx0dmFyIHZub2RlID0gaHlwZXJzY3JpcHRWbm9kZS5hcHBseSgxLCBhcmd1bWVudHMpXG5cdGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIpIHtcblx0XHR2bm9kZS5jaGlsZHJlbiA9IFZub2RlLm5vcm1hbGl6ZUNoaWxkcmVuKHZub2RlLmNoaWxkcmVuKVxuXHRcdGlmIChzZWxlY3RvciAhPT0gXCJbXCIpIHJldHVybiBleGVjU2VsZWN0b3Ioc2VsZWN0b3JDYWNoZVtzZWxlY3Rvcl0gfHwgY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKSwgdm5vZGUpXG5cdH1cblx0dm5vZGUudGFnID0gc2VsZWN0b3Jcblx0cmV0dXJuIHZub2RlXG59XG5cbmh5cGVyc2NyaXB0LnRydXN0ID0gZnVuY3Rpb24gKGh0bWwpIHtcblx0aWYgKGh0bWwgPT0gbnVsbCkgaHRtbCA9IFwiXCJcblx0cmV0dXJuIFZub2RlKFwiPFwiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgaHRtbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG5oeXBlcnNjcmlwdC5mcmFnbWVudCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHZub2RlMiA9IGh5cGVyc2NyaXB0Vm5vZGUuYXBwbHkoMCwgYXJndW1lbnRzKVxuXHR2bm9kZTIudGFnID0gXCJbXCJcblx0dm5vZGUyLmNoaWxkcmVuID0gVm5vZGUubm9ybWFsaXplQ2hpbGRyZW4odm5vZGUyLmNoaWxkcmVuKVxuXHRyZXR1cm4gdm5vZGUyXG59XG4vKiBnbG9iYWwgd2luZG93ICovXG52YXIgXzEzID0gZnVuY3Rpb24gKCR3aW5kb3cpIHtcblx0dmFyICRkb2MgPSAkd2luZG93ICYmICR3aW5kb3cuZG9jdW1lbnRcblx0dmFyIGN1cnJlbnRSZWRyYXdcblx0dmFyIG5hbWVTcGFjZSA9IHtcblx0XHRzdmc6IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcblx0XHRtYXRoOiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIlxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0TmFtZVNwYWNlKHZub2RlMykge1xuXHRcdHJldHVybiB2bm9kZTMuYXR0cnMgJiYgdm5vZGUzLmF0dHJzLnhtbG5zIHx8IG5hbWVTcGFjZVt2bm9kZTMudGFnXVxuXHR9XG5cblx0Ly9zYW5pdHkgY2hlY2sgdG8gZGlzY291cmFnZSBwZW9wbGUgZnJvbSBkb2luZyBgdm5vZGUzLnN0YXRlID0gLi4uYFxuXHRmdW5jdGlvbiBjaGVja1N0YXRlKHZub2RlMywgb3JpZ2luYWwpIHtcblx0XHRpZiAodm5vZGUzLnN0YXRlICE9PSBvcmlnaW5hbCkgdGhyb3cgbmV3IEVycm9yKFwiJ3Zub2RlLnN0YXRlJyBtdXN0IG5vdCBiZSBtb2RpZmllZC5cIilcblx0fVxuXG5cdC8vTm90ZTogdGhlIGhvb2sgaXMgcGFzc2VkIGFzIHRoZSBgdGhpc2AgYXJndW1lbnQgdG8gYWxsb3cgcHJveHlpbmcgdGhlXG5cdC8vYXJndW1lbnRzIHdpdGhvdXQgcmVxdWlyaW5nIGEgZnVsbCBhcnJheSBhbGxvY2F0aW9uIHRvIGRvIHNvLiBJdCBhbHNvXG5cdC8vdGFrZXMgYWR2YW50YWdlIG9mIHRoZSBmYWN0IHRoZSBjdXJyZW50IGB2bm9kZTNgIGlzIHRoZSBmaXJzdCBhcmd1bWVudCBpblxuXHQvL2FsbCBsaWZlY3ljbGUgbWV0aG9kcy5cblx0ZnVuY3Rpb24gY2FsbEhvb2sodm5vZGUzKSB7XG5cdFx0dmFyIG9yaWdpbmFsID0gdm5vZGUzLnN0YXRlXG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiB0aGlzLmFwcGx5KG9yaWdpbmFsLCBhcmd1bWVudHMpXG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGNoZWNrU3RhdGUodm5vZGUzLCBvcmlnaW5hbClcblx0XHR9XG5cdH1cblxuXHQvLyBJRTExIChhdCBsZWFzdCkgdGhyb3dzIGFuIFVuc3BlY2lmaWVkRXJyb3Igd2hlbiBhY2Nlc3NpbmcgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCB3aGVuXG5cdC8vIGluc2lkZSBhbiBpZnJhbWUuIENhdGNoIGFuZCBzd2FsbG93IHRoaXMgZXJyb3IsIGFuZCBoZWF2eS1oYW5kaWRseSByZXR1cm4gbnVsbC5cblx0ZnVuY3Rpb24gYWN0aXZlRWxlbWVudCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuICRkb2MuYWN0aXZlRWxlbWVudFxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0Ly9jcmVhdGVcblx0ZnVuY3Rpb24gY3JlYXRlTm9kZXMocGFyZW50LCB2bm9kZXMsIHN0YXJ0LCBlbmQsIGhvb2tzLCBuZXh0U2libGluZywgbnMpIHtcblx0XHRmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuXHRcdFx0dmFyIHZub2RlMyA9IHZub2Rlc1tpXVxuXHRcdFx0aWYgKHZub2RlMyAhPSBudWxsKSB7XG5cdFx0XHRcdGNyZWF0ZU5vZGUocGFyZW50LCB2bm9kZTMsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gY3JlYXRlTm9kZShwYXJlbnQsIHZub2RlMywgaG9va3MsIG5zLCBuZXh0U2libGluZykge1xuXHRcdHZhciB0YWcgPSB2bm9kZTMudGFnXG5cdFx0aWYgKHR5cGVvZiB0YWcgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHZub2RlMy5zdGF0ZSA9IHt9XG5cdFx0XHRpZiAodm5vZGUzLmF0dHJzICE9IG51bGwpIGluaXRMaWZlY3ljbGUodm5vZGUzLmF0dHJzLCB2bm9kZTMsIGhvb2tzKVxuXHRcdFx0c3dpdGNoICh0YWcpIHtcblx0XHRcdFx0Y2FzZSBcIiNcIjpcblx0XHRcdFx0XHRjcmVhdGVUZXh0KHBhcmVudCwgdm5vZGUzLCBuZXh0U2libGluZyk7XG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBcIjxcIjpcblx0XHRcdFx0XHRjcmVhdGVIVE1MKHBhcmVudCwgdm5vZGUzLCBucywgbmV4dFNpYmxpbmcpO1xuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgXCJbXCI6XG5cdFx0XHRcdFx0Y3JlYXRlRnJhZ21lbnQocGFyZW50LCB2bm9kZTMsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpO1xuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0Y3JlYXRlRWxlbWVudChwYXJlbnQsIHZub2RlMywgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSBjcmVhdGVDb21wb25lbnQocGFyZW50LCB2bm9kZTMsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVUZXh0KHBhcmVudCwgdm5vZGUzLCBuZXh0U2libGluZykge1xuXHRcdHZub2RlMy5kb20gPSAkZG9jLmNyZWF0ZVRleHROb2RlKHZub2RlMy5jaGlsZHJlbilcblx0XHRpbnNlcnROb2RlKHBhcmVudCwgdm5vZGUzLmRvbSwgbmV4dFNpYmxpbmcpXG5cdH1cblxuXHR2YXIgcG9zc2libGVQYXJlbnRzID0ge1xuXHRcdGNhcHRpb246IFwidGFibGVcIixcblx0XHR0aGVhZDogXCJ0YWJsZVwiLFxuXHRcdHRib2R5OiBcInRhYmxlXCIsXG5cdFx0dGZvb3Q6IFwidGFibGVcIixcblx0XHR0cjogXCJ0Ym9keVwiLFxuXHRcdHRoOiBcInRyXCIsXG5cdFx0dGQ6IFwidHJcIixcblx0XHRjb2xncm91cDogXCJ0YWJsZVwiLFxuXHRcdGNvbDogXCJjb2xncm91cFwiXG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVIVE1MKHBhcmVudCwgdm5vZGUzLCBucywgbmV4dFNpYmxpbmcpIHtcblx0XHR2YXIgbWF0Y2gwID0gdm5vZGUzLmNoaWxkcmVuLm1hdGNoKC9eXFxzKj88KFxcdyspL2ltKSB8fCBbXVxuXHRcdC8vIG5vdCB1c2luZyB0aGUgcHJvcGVyIHBhcmVudCBtYWtlcyB0aGUgY2hpbGQgZWxlbWVudChzKSB2YW5pc2guXG5cdFx0Ly8gICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0Ly8gICAgIGRpdi5pbm5lckhUTUwgPSBcIjx0ZD5pPC90ZD48dGQ+ajwvdGQ+XCJcblx0XHQvLyAgICAgY29uc29sZS5sb2coZGl2LmlubmVySFRNTClcblx0XHQvLyAtLT4gXCJpalwiLCBubyA8dGQ+IGluIHNpZ2h0LlxuXHRcdHZhciB0ZW1wID0gJGRvYy5jcmVhdGVFbGVtZW50KHBvc3NpYmxlUGFyZW50c1ttYXRjaDBbMV1dIHx8IFwiZGl2XCIpXG5cdFx0aWYgKG5zID09PSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIpIHtcblx0XHRcdHRlbXAuaW5uZXJIVE1MID0gXCI8c3ZnIHhtbG5zPVxcXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1xcXCI+XCIgKyB2bm9kZTMuY2hpbGRyZW4gKyBcIjwvc3ZnPlwiXG5cdFx0XHR0ZW1wID0gdGVtcC5maXJzdENoaWxkXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRlbXAuaW5uZXJIVE1MID0gdm5vZGUzLmNoaWxkcmVuXG5cdFx0fVxuXHRcdHZub2RlMy5kb20gPSB0ZW1wLmZpcnN0Q2hpbGRcblx0XHR2bm9kZTMuZG9tU2l6ZSA9IHRlbXAuY2hpbGROb2Rlcy5sZW5ndGhcblx0XHQvLyBDYXB0dXJlIG5vZGVzIHRvIHJlbW92ZSwgc28gd2UgZG9uJ3QgY29uZnVzZSB0aGVtLlxuXHRcdHZub2RlMy5pbnN0YW5jZSA9IFtdXG5cdFx0dmFyIGZyYWdtZW50ID0gJGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcblx0XHR2YXIgY2hpbGRcblx0XHR3aGlsZSAoY2hpbGQgPSB0ZW1wLmZpcnN0Q2hpbGQpIHtcblx0XHRcdHZub2RlMy5pbnN0YW5jZS5wdXNoKGNoaWxkKVxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG5cdFx0fVxuXHRcdGluc2VydE5vZGUocGFyZW50LCBmcmFnbWVudCwgbmV4dFNpYmxpbmcpXG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVGcmFnbWVudChwYXJlbnQsIHZub2RlMywgaG9va3MsIG5zLCBuZXh0U2libGluZykge1xuXHRcdHZhciBmcmFnbWVudCA9ICRkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdFx0aWYgKHZub2RlMy5jaGlsZHJlbiAhPSBudWxsKSB7XG5cdFx0XHR2YXIgY2hpbGRyZW4yID0gdm5vZGUzLmNoaWxkcmVuXG5cdFx0XHRjcmVhdGVOb2RlcyhmcmFnbWVudCwgY2hpbGRyZW4yLCAwLCBjaGlsZHJlbjIubGVuZ3RoLCBob29rcywgbnVsbCwgbnMpXG5cdFx0fVxuXHRcdHZub2RlMy5kb20gPSBmcmFnbWVudC5maXJzdENoaWxkXG5cdFx0dm5vZGUzLmRvbVNpemUgPSBmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aFxuXHRcdGluc2VydE5vZGUocGFyZW50LCBmcmFnbWVudCwgbmV4dFNpYmxpbmcpXG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHBhcmVudCwgdm5vZGUzLCBob29rcywgbnMsIG5leHRTaWJsaW5nKSB7XG5cdFx0dmFyIHRhZyA9IHZub2RlMy50YWdcblx0XHR2YXIgYXR0cnMyID0gdm5vZGUzLmF0dHJzXG5cdFx0dmFyIGlzID0gYXR0cnMyICYmIGF0dHJzMi5pc1xuXHRcdG5zID0gZ2V0TmFtZVNwYWNlKHZub2RlMykgfHwgbnNcblx0XHR2YXIgZWxlbWVudCA9IG5zID9cblx0XHRcdGlzID8gJGRvYy5jcmVhdGVFbGVtZW50TlMobnMsIHRhZywge2lzOiBpc30pIDogJGRvYy5jcmVhdGVFbGVtZW50TlMobnMsIHRhZykgOlxuXHRcdFx0aXMgPyAkZG9jLmNyZWF0ZUVsZW1lbnQodGFnLCB7aXM6IGlzfSkgOiAkZG9jLmNyZWF0ZUVsZW1lbnQodGFnKVxuXHRcdHZub2RlMy5kb20gPSBlbGVtZW50XG5cdFx0aWYgKGF0dHJzMiAhPSBudWxsKSB7XG5cdFx0XHRzZXRBdHRycyh2bm9kZTMsIGF0dHJzMiwgbnMpXG5cdFx0fVxuXHRcdGluc2VydE5vZGUocGFyZW50LCBlbGVtZW50LCBuZXh0U2libGluZylcblx0XHRpZiAoIW1heWJlU2V0Q29udGVudEVkaXRhYmxlKHZub2RlMykpIHtcblx0XHRcdGlmICh2bm9kZTMuY2hpbGRyZW4gIT0gbnVsbCkge1xuXHRcdFx0XHR2YXIgY2hpbGRyZW4yID0gdm5vZGUzLmNoaWxkcmVuXG5cdFx0XHRcdGNyZWF0ZU5vZGVzKGVsZW1lbnQsIGNoaWxkcmVuMiwgMCwgY2hpbGRyZW4yLmxlbmd0aCwgaG9va3MsIG51bGwsIG5zKVxuXHRcdFx0XHRpZiAodm5vZGUzLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBhdHRyczIgIT0gbnVsbCkgc2V0TGF0ZVNlbGVjdEF0dHJzKHZub2RlMywgYXR0cnMyKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGluaXRDb21wb25lbnQodm5vZGUzLCBob29rcykge1xuXHRcdHZhciBzZW50aW5lbFxuXHRcdGlmICh0eXBlb2Ygdm5vZGUzLnRhZy52aWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHZub2RlMy5zdGF0ZSA9IE9iamVjdC5jcmVhdGUodm5vZGUzLnRhZylcblx0XHRcdHNlbnRpbmVsID0gdm5vZGUzLnN0YXRlLnZpZXdcblx0XHRcdGlmIChzZW50aW5lbC4kJHJlZW50cmFudExvY2skJCAhPSBudWxsKSByZXR1cm5cblx0XHRcdHNlbnRpbmVsLiQkcmVlbnRyYW50TG9jayQkID0gdHJ1ZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2bm9kZTMuc3RhdGUgPSB2b2lkIDBcblx0XHRcdHNlbnRpbmVsID0gdm5vZGUzLnRhZ1xuXHRcdFx0aWYgKHNlbnRpbmVsLiQkcmVlbnRyYW50TG9jayQkICE9IG51bGwpIHJldHVyblxuXHRcdFx0c2VudGluZWwuJCRyZWVudHJhbnRMb2NrJCQgPSB0cnVlXG5cdFx0XHR2bm9kZTMuc3RhdGUgPSAodm5vZGUzLnRhZy5wcm90b3R5cGUgIT0gbnVsbCAmJiB0eXBlb2Ygdm5vZGUzLnRhZy5wcm90b3R5cGUudmlldyA9PT0gXCJmdW5jdGlvblwiKSA/IG5ldyB2bm9kZTMudGFnKHZub2RlMykgOiB2bm9kZTMudGFnKHZub2RlMylcblx0XHR9XG5cdFx0aW5pdExpZmVjeWNsZSh2bm9kZTMuc3RhdGUsIHZub2RlMywgaG9va3MpXG5cdFx0aWYgKHZub2RlMy5hdHRycyAhPSBudWxsKSBpbml0TGlmZWN5Y2xlKHZub2RlMy5hdHRycywgdm5vZGUzLCBob29rcylcblx0XHR2bm9kZTMuaW5zdGFuY2UgPSBWbm9kZS5ub3JtYWxpemUoY2FsbEhvb2suY2FsbCh2bm9kZTMuc3RhdGUudmlldywgdm5vZGUzKSlcblx0XHRpZiAodm5vZGUzLmluc3RhbmNlID09PSB2bm9kZTMpIHRocm93IEVycm9yKFwiQSB2aWV3IGNhbm5vdCByZXR1cm4gdGhlIHZub2RlIGl0IHJlY2VpdmVkIGFzIGFyZ3VtZW50XCIpXG5cdFx0c2VudGluZWwuJCRyZWVudHJhbnRMb2NrJCQgPSBudWxsXG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVDb21wb25lbnQocGFyZW50LCB2bm9kZTMsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpIHtcblx0XHRpbml0Q29tcG9uZW50KHZub2RlMywgaG9va3MpXG5cdFx0aWYgKHZub2RlMy5pbnN0YW5jZSAhPSBudWxsKSB7XG5cdFx0XHRjcmVhdGVOb2RlKHBhcmVudCwgdm5vZGUzLmluc3RhbmNlLCBob29rcywgbnMsIG5leHRTaWJsaW5nKVxuXHRcdFx0dm5vZGUzLmRvbSA9IHZub2RlMy5pbnN0YW5jZS5kb21cblx0XHRcdHZub2RlMy5kb21TaXplID0gdm5vZGUzLmRvbSAhPSBudWxsID8gdm5vZGUzLmluc3RhbmNlLmRvbVNpemUgOiAwXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZub2RlMy5kb21TaXplID0gMFxuXHRcdH1cblx0fVxuXG5cdC8vdXBkYXRlXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR8RnJhZ21lbnR9IHBhcmVudCAtIHRoZSBwYXJlbnQgZWxlbWVudFxuXHQgKiBAcGFyYW0ge1Zub2RlW10gfCBudWxsfSBvbGQgLSB0aGUgbGlzdCBvZiB2bm9kZXMgb2YgdGhlIGxhc3QgYHJlbmRlcjAoKWAgY2FsbCBmb3Jcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyBwYXJ0IG9mIHRoZSB0cmVlXG5cdCAqIEBwYXJhbSB7Vm5vZGVbXSB8IG51bGx9IHZub2RlcyAtIGFzIGFib3ZlLCBidXQgZm9yIHRoZSBjdXJyZW50IGByZW5kZXIwKClgIGNhbGwuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gaG9va3MgLSBhbiBhY2N1bXVsYXRvciBvZiBwb3N0LXJlbmRlcjAgaG9va3MgKG9uY3JlYXRlL29udXBkYXRlKVxuXHQgKiBAcGFyYW0ge0VsZW1lbnQgfCBudWxsfSBuZXh0U2libGluZyAtIHRoZSBuZXh0IERPTSBub2RlIGlmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgdGhhdCBpcyBub3QgdGhlIGxhc3QgaXRlbSBpbiBpdHNcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRcblx0ICogQHBhcmFtIHsnc3ZnJyB8ICdtYXRoJyB8IFN0cmluZyB8IG51bGx9IG5zKSAtIHRoZSBjdXJyZW50IFhNTCBuYW1lc3BhY2UsIGlmIGFueVxuXHQgKiBAcmV0dXJucyB2b2lkXG5cdCAqL1xuXHQvLyBUaGlzIGZ1bmN0aW9uIGRpZmZzIGFuZCBwYXRjaGVzIGxpc3RzIG9mIHZub2RlcywgYm90aCBrZXllZCBhbmQgdW5rZXllZC5cblx0Ly9cblx0Ly8gV2Ugd2lsbDpcblx0Ly9cblx0Ly8gMS4gZGVzY3JpYmUgaXRzIGdlbmVyYWwgc3RydWN0dXJlXG5cdC8vIDIuIGZvY3VzIG9uIHRoZSBkaWZmIGFsZ29yaXRobSBvcHRpbWl6YXRpb25zXG5cdC8vIDMuIGRpc2N1c3MgRE9NIG5vZGUgb3BlcmF0aW9ucy5cblx0Ly8gIyMgT3ZlcnZpZXc6XG5cdC8vXG5cdC8vIFRoZSB1cGRhdGVOb2RlcygpIGZ1bmN0aW9uOlxuXHQvLyAtIGRlYWxzIHdpdGggdHJpdmlhbCBjYXNlc1xuXHQvLyAtIGRldGVybWluZXMgd2hldGhlciB0aGUgbGlzdHMgYXJlIGtleWVkIG9yIHVua2V5ZWQgYmFzZWQgb24gdGhlIGZpcnN0IG5vbi1udWxsIG5vZGVcblx0Ly8gICBvZiBlYWNoIGxpc3QuXG5cdC8vIC0gZGlmZnMgdGhlbSBhbmQgcGF0Y2hlcyB0aGUgRE9NIGlmIG5lZWRlZCAodGhhdCdzIHRoZSBicnVudCBvZiB0aGUgY29kZSlcblx0Ly8gLSBtYW5hZ2VzIHRoZSBsZWZ0b3ZlcnM6IGFmdGVyIGRpZmZpbmcsIGFyZSB0aGVyZTpcblx0Ly8gICAtIG9sZCBub2RlcyBsZWZ0IHRvIHJlbW92ZT9cblx0Ly8gXHQgLSBuZXcgbm9kZXMgdG8gaW5zZXJ0P1xuXHQvLyBcdCBkZWFsIHdpdGggdGhlbSFcblx0Ly9cblx0Ly8gVGhlIGxpc3RzIGFyZSBvbmx5IGl0ZXJhdGVkIG92ZXIgb25jZSwgd2l0aCBhbiBleGNlcHRpb24gZm9yIHRoZSBub2RlcyBpbiBgb2xkYCB0aGF0XG5cdC8vIGFyZSB2aXNpdGVkIGluIHRoZSBmb3VydGggcGFydCBvZiB0aGUgZGlmZiBhbmQgaW4gdGhlIGByZW1vdmVOb2Rlc2AgbG9vcC5cblx0Ly8gIyMgRGlmZmluZ1xuXHQvL1xuXHQvLyBSZWFkaW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9sb2NhbHZvaWQvaXZpL2Jsb2IvZGRjMDlkMDZhYmFlZjQ1MjQ4ZTYxMzNmNzA0MGQwMGQzYzZiZTg1My9wYWNrYWdlcy9pdmkvc3JjL3Zkb20vaW1wbGVtZW50YXRpb24udHMjTDYxNy1MODM3XG5cdC8vIG1heSBiZSBnb29kIGZvciBjb250ZXh0IG9uIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZS1iYXNlZCBsb2dpYyBmb3IgbW92aW5nIG5vZGVzLlxuXHQvL1xuXHQvLyBJbiBvcmRlciB0byBkaWZmIGtleWVkIGxpc3RzLCBvbmUgaGFzIHRvXG5cdC8vXG5cdC8vIDEpIG1hdGNoMCBub2RlcyBpbiBib3RoIGxpc3RzLCBwZXIga2V5LCBhbmQgdXBkYXRlIHRoZW0gYWNjb3JkaW5nbHlcblx0Ly8gMikgY3JlYXRlIHRoZSBub2RlcyBwcmVzZW50IGluIHRoZSBuZXcgbGlzdCwgYnV0IGFic2VudCBpbiB0aGUgb2xkIG9uZVxuXHQvLyAzKSByZW1vdmUgdGhlIG5vZGVzIHByZXNlbnQgaW4gdGhlIG9sZCBsaXN0LCBidXQgYWJzZW50IGluIHRoZSBuZXcgb25lXG5cdC8vIDQpIGZpZ3VyZSBvdXQgd2hhdCBub2RlcyBpbiAxKSB0byBtb3ZlIGluIG9yZGVyIHRvIG1pbmltaXplIHRoZSBET00gb3BlcmF0aW9ucy5cblx0Ly9cblx0Ly8gVG8gYWNoaWV2ZSAxKSBvbmUgY2FuIGNyZWF0ZSBhIGRpY3Rpb25hcnkgb2Yga2V5cyA9PiBpbmRleCAoZm9yIHRoZSBvbGQgbGlzdCksIHRoZW4wIGl0ZXJhdGVcblx0Ly8gb3ZlciB0aGUgbmV3IGxpc3QgYW5kIGZvciBlYWNoIG5ldyB2bm9kZTMsIGZpbmQgdGhlIGNvcnJlc3BvbmRpbmcgdm5vZGUzIGluIHRoZSBvbGQgbGlzdCB1c2luZ1xuXHQvLyB0aGUgbWFwLlxuXHQvLyAyKSBpcyBhY2hpZXZlZCBpbiB0aGUgc2FtZSBzdGVwOiBpZiBhIG5ldyBub2RlIGhhcyBubyBjb3JyZXNwb25kaW5nIGVudHJ5IGluIHRoZSBtYXAsIGl0IGlzIG5ld1xuXHQvLyBhbmQgbXVzdCBiZSBjcmVhdGVkLlxuXHQvLyBGb3IgdGhlIHJlbW92YWxzLCB3ZSBhY3R1YWxseSByZW1vdmUgdGhlIG5vZGVzIHRoYXQgaGF2ZSBiZWVuIHVwZGF0ZWQgZnJvbSB0aGUgb2xkIGxpc3QuXG5cdC8vIFRoZSBub2RlcyB0aGF0IHJlbWFpbiBpbiB0aGF0IGxpc3QgYWZ0ZXIgMSkgYW5kIDIpIGhhdmUgYmVlbiBwZXJmb3JtZWQgY2FuIGJlIHNhZmVseSByZW1vdmVkLlxuXHQvLyBUaGUgZm91cnRoIHN0ZXAgaXMgYSBiaXQgbW9yZSBjb21wbGV4IGFuZCByZWxpZXMgb24gdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSAoTElTKVxuXHQvLyBhbGdvcml0aG0uXG5cdC8vXG5cdC8vIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UgaXMgdGhlIGxpc3Qgb2Ygbm9kZXMgdGhhdCBjYW4gcmVtYWluIGluIHBsYWNlLiBJbWFnaW5lIGdvaW5nXG5cdC8vIGZyb20gYDEsMiwzLDQsNWAgdG8gYDQsNSwxLDIsM2Agd2hlcmUgdGhlIG51bWJlcnMgYXJlIG5vdCBuZWNlc3NhcmlseSB0aGUga2V5cywgYnV0IHRoZSBpbmRpY2VzXG5cdC8vIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGtleWVkIG5vZGVzIGluIHRoZSBvbGQgbGlzdCAoa2V5ZWQgbm9kZXMgYGUsZCxjLGIsYWAgPT4gYGIsYSxlLGQsY2Agd291bGRcblx0Ly8gIG1hdGNoMCB0aGUgYWJvdmUgbGlzdHMsIGZvciBleGFtcGxlKS5cblx0Ly9cblx0Ly8gSW4gdGhlcmUgYXJlIHR3byBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlczogYDQsNWAgYW5kIGAxLDIsM2AsIHRoZSBsYXR0ZXIgYmVpbmcgdGhlIGxvbmdlc3QuIFdlXG5cdC8vIGNhbiB1cGRhdGUgdGhvc2Ugbm9kZXMgd2l0aG91dCBtb3ZpbmcgdGhlbSwgYW5kIG9ubHkgY2FsbCBgaW5zZXJ0Tm9kZWAgb24gYDRgIGFuZCBgNWAuXG5cdC8vXG5cdC8vIEBsb2NhbHZvaWQgYWRhcHRlZCB0aGUgYWxnbyB0byBhbHNvIHN1cHBvcnQgbm9kZSBkZWxldGlvbnMgYW5kIGluc2VydGlvbnMgKHRoZSBgbGlzYCBpcyBhY3R1YWxseVxuXHQvLyB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlICpvZiBvbGQgbm9kZXMgc3RpbGwgcHJlc2VudCBpbiB0aGUgbmV3IGxpc3QqKS5cblx0Ly9cblx0Ly8gSXQgaXMgYSBnZW5lcmFsIGFsZ29yaXRobSB0aGF0IGlzIGZpcmVwcm9vZiBpbiBhbGwgY2lyY3Vtc3RhbmNlcywgYnV0IGl0IHJlcXVpcmVzIHRoZSBhbGxvY2F0aW9uXG5cdC8vIGFuZCB0aGUgY29uc3RydWN0aW9uIG9mIGEgYGtleSA9PiBvbGRJbmRleGAgbWFwLCBhbmQgdGhyZWUgYXJyYXlzIChvbmUgd2l0aCBgbmV3SW5kZXggPT4gb2xkSW5kZXhgLFxuXHQvLyB0aGUgYExJU2AgYW5kIGEgdGVtcG9yYXJ5IG9uZSB0byBjcmVhdGUgdGhlIExJUykuXG5cdC8vXG5cdC8vIFNvIHdlIGNoZWF0IHdoZXJlIHdlIGNhbjogaWYgdGhlIHRhaWxzIG9mIHRoZSBsaXN0cyBhcmUgaWRlbnRpY2FsLCB0aGV5IGFyZSBndWFyYW50ZWVkIHRvIGJlIHBhcnQgb2Zcblx0Ly8gdGhlIExJUyBhbmQgY2FuIGJlIHVwZGF0ZWQgd2l0aG91dCBtb3ZpbmcgdGhlbS5cblx0Ly9cblx0Ly8gSWYgdHdvIG5vZGVzIGFyZSBzd2FwcGVkLCB0aGV5IGFyZSBndWFyYW50ZWVkIG5vdCB0byBiZSBwYXJ0IG9mIHRoZSBMSVMsIGFuZCBtdXN0IGJlIG1vdmVkICh3aXRoXG5cdC8vIHRoZSBleGNlcHRpb24gb2YgdGhlIGxhc3Qgbm9kZSBpZiB0aGUgbGlzdCBpcyBmdWxseSByZXZlcnNlZCkuXG5cdC8vXG5cdC8vICMjIEZpbmRpbmcgdGhlIG5leHQgc2libGluZy5cblx0Ly9cblx0Ly8gYHVwZGF0ZU5vZGUoKWAgYW5kIGBjcmVhdGVOb2RlKClgIGV4cGVjdCBhIG5leHRTaWJsaW5nIHBhcmFtZXRlciB0byBwZXJmb3JtIERPTSBvcGVyYXRpb25zLlxuXHQvLyBXaGVuIHRoZSBsaXN0IGlzIGJlaW5nIHRyYXZlcnNlZCB0b3AtZG93biwgYXQgYW55IGluZGV4LCB0aGUgRE9NIG5vZGVzIHVwIHRvIHRoZSBwcmV2aW91c1xuXHQvLyB2bm9kZTMgcmVmbGVjdCB0aGUgY29udGVudCBvZiB0aGUgbmV3IGxpc3QsIHdoZXJlYXMgdGhlIHJlc3Qgb2YgdGhlIERPTSBub2RlcyByZWZsZWN0IHRoZSBvbGRcblx0Ly8gbGlzdC4gVGhlIG5leHQgc2libGluZyBtdXN0IGJlIGxvb2tlZCBmb3IgaW4gdGhlIG9sZCBsaXN0IHVzaW5nIGBnZXROZXh0U2libGluZyguLi4gb2xkU3RhcnQgKyAxIC4uLilgLlxuXHQvL1xuXHQvLyBJbiB0aGUgb3RoZXIgc2NlbmFyaW9zIChzd2FwcywgdXB3YXJkcyB0cmF2ZXJzYWwsIG1hcC1iYXNlZCBkaWZmKSxcblx0Ly8gdGhlIG5ldyB2bm9kZXMgbGlzdCBpcyB0cmF2ZXJzZWQgdXB3YXJkcy4gVGhlIERPTSBub2RlcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBsaXN0IHJlZmxlY3QgdGhlXG5cdC8vIGJvdHRvbSBwYXJ0IG9mIHRoZSBuZXcgdm5vZGVzIGxpc3QsIGFuZCB3ZSBjYW4gdXNlIHRoZSBgdi5kb21gICB2YWx1ZSBvZiB0aGUgcHJldmlvdXMgbm9kZVxuXHQvLyBhcyB0aGUgbmV4dCBzaWJsaW5nIChjYWNoZWQgaW4gdGhlIGBuZXh0U2libGluZ2AgdmFyaWFibGUpLlxuXHQvLyAjIyBET00gbm9kZSBtb3Zlc1xuXHQvL1xuXHQvLyBJbiBtb3N0IHNjZW5hcmlvcyBgdXBkYXRlTm9kZSgpYCBhbmQgYGNyZWF0ZU5vZGUoKWAgcGVyZm9ybSB0aGUgRE9NIG9wZXJhdGlvbnMuIEhvd2V2ZXIsXG5cdC8vIHRoaXMgaXMgbm90IHRoZSBjYXNlIGlmIHRoZSBub2RlIG1vdmVkIChzZWNvbmQgYW5kIGZvdXJ0aCBwYXJ0IG9mIHRoZSBkaWZmIGFsZ28pLiBXZSBtb3ZlXG5cdC8vIHRoZSBvbGQgRE9NIG5vZGVzIGJlZm9yZSB1cGRhdGVOb2RlIHJ1bnMwIGJlY2F1c2UgaXQgZW5hYmxlcyB1cyB0byB1c2UgdGhlIGNhY2hlZCBgbmV4dFNpYmxpbmdgXG5cdC8vIHZhcmlhYmxlIHJhdGhlciB0aGFuIGZldGNoaW5nIGl0IHVzaW5nIGBnZXROZXh0U2libGluZygpYC5cblx0Ly9cblx0Ly8gVGhlIGZvdXJ0aCBwYXJ0IG9mIHRoZSBkaWZmIGN1cnJlbnRseSBpbnNlcnRzIG5vZGVzIHVuY29uZGl0aW9uYWxseSwgbGVhZGluZyB0byBpc3N1ZXNcblx0Ly8gbGlrZSAjMTc5MSBhbmQgIzE5OTkuIFdlIG5lZWQgdG8gYmUgc21hcnRlciBhYm91dCB0aG9zZSBzaXR1YXRpb25zIHdoZXJlIGFkamFzY2VudCBvbGRcblx0Ly8gbm9kZXMgcmVtYWluIHRvZ2V0aGVyIGluIHRoZSBuZXcgbGlzdCBpbiBhIHdheSB0aGF0IGlzbid0IGNvdmVyZWQgYnkgcGFydHMgb25lIGFuZFxuXHQvLyB0aHJlZSBvZiB0aGUgZGlmZiBhbGdvLlxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlcyhwYXJlbnQsIG9sZCwgdm5vZGVzLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKSB7XG5cdFx0aWYgKG9sZCA9PT0gdm5vZGVzIHx8IG9sZCA9PSBudWxsICYmIHZub2RlcyA9PSBudWxsKSByZXR1cm5cblx0XHRlbHNlIGlmIChvbGQgPT0gbnVsbCB8fCBvbGQubGVuZ3RoID09PSAwKSBjcmVhdGVOb2RlcyhwYXJlbnQsIHZub2RlcywgMCwgdm5vZGVzLmxlbmd0aCwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHRlbHNlIGlmICh2bm9kZXMgPT0gbnVsbCB8fCB2bm9kZXMubGVuZ3RoID09PSAwKSByZW1vdmVOb2RlcyhwYXJlbnQsIG9sZCwgMCwgb2xkLmxlbmd0aClcblx0XHRlbHNlIHtcblx0XHRcdHZhciBpc09sZEtleWVkID0gb2xkWzBdICE9IG51bGwgJiYgb2xkWzBdLmtleSAhPSBudWxsXG5cdFx0XHR2YXIgaXNLZXllZDAgPSB2bm9kZXNbMF0gIT0gbnVsbCAmJiB2bm9kZXNbMF0ua2V5ICE9IG51bGxcblx0XHRcdHZhciBzdGFydCA9IDAsIG9sZFN0YXJ0ID0gMFxuXHRcdFx0aWYgKCFpc09sZEtleWVkKSB3aGlsZSAob2xkU3RhcnQgPCBvbGQubGVuZ3RoICYmIG9sZFtvbGRTdGFydF0gPT0gbnVsbCkgb2xkU3RhcnQrK1xuXHRcdFx0aWYgKCFpc0tleWVkMCkgd2hpbGUgKHN0YXJ0IDwgdm5vZGVzLmxlbmd0aCAmJiB2bm9kZXNbc3RhcnRdID09IG51bGwpIHN0YXJ0Kytcblx0XHRcdGlmIChpc09sZEtleWVkICE9PSBpc0tleWVkMCkge1xuXHRcdFx0XHRyZW1vdmVOb2RlcyhwYXJlbnQsIG9sZCwgb2xkU3RhcnQsIG9sZC5sZW5ndGgpXG5cdFx0XHRcdGNyZWF0ZU5vZGVzKHBhcmVudCwgdm5vZGVzLCBzdGFydCwgdm5vZGVzLmxlbmd0aCwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHRcdH0gZWxzZSBpZiAoIWlzS2V5ZWQwKSB7XG5cdFx0XHRcdC8vIERvbid0IGluZGV4IHBhc3QgdGhlIGVuZCBvZiBlaXRoZXIgbGlzdCAoY2F1c2VzIGRlb3B0cykuXG5cdFx0XHRcdHZhciBjb21tb25MZW5ndGggPSBvbGQubGVuZ3RoIDwgdm5vZGVzLmxlbmd0aCA/IG9sZC5sZW5ndGggOiB2bm9kZXMubGVuZ3RoXG5cdFx0XHRcdC8vIFJld2luZCBpZiBuZWNlc3NhcnkgdG8gdGhlIGZpcnN0IG5vbi1udWxsIGluZGV4IG9uIGVpdGhlciBzaWRlLlxuXHRcdFx0XHQvLyBXZSBjb3VsZCBhbHRlcm5hdGl2ZWx5IGVpdGhlciBleHBsaWNpdGx5IGNyZWF0ZSBvciByZW1vdmUgbm9kZXMgd2hlbiBgc3RhcnQgIT09IG9sZFN0YXJ0YFxuXHRcdFx0XHQvLyBidXQgdGhhdCB3b3VsZCBiZSBvcHRpbWl6aW5nIGZvciBzcGFyc2UgbGlzdHMgd2hpY2ggYXJlIG1vcmUgcmFyZSB0aGFuIGRlbnNlIG9uZXMuXG5cdFx0XHRcdHN0YXJ0ID0gc3RhcnQgPCBvbGRTdGFydCA/IHN0YXJ0IDogb2xkU3RhcnRcblx0XHRcdFx0Zm9yICg7IHN0YXJ0IDwgY29tbW9uTGVuZ3RoOyBzdGFydCsrKSB7XG5cdFx0XHRcdFx0byA9IG9sZFtzdGFydF1cblx0XHRcdFx0XHR2ID0gdm5vZGVzW3N0YXJ0XVxuXHRcdFx0XHRcdGlmIChvID09PSB2IHx8IG8gPT0gbnVsbCAmJiB2ID09IG51bGwpIGNvbnRpbnVlXG5cdFx0XHRcdFx0ZWxzZSBpZiAobyA9PSBudWxsKSBjcmVhdGVOb2RlKHBhcmVudCwgdiwgaG9va3MsIG5zLCBnZXROZXh0U2libGluZyhvbGQsIHN0YXJ0ICsgMSwgbmV4dFNpYmxpbmcpKVxuXHRcdFx0XHRcdGVsc2UgaWYgKHYgPT0gbnVsbCkgcmVtb3ZlTm9kZShwYXJlbnQsIG8pXG5cdFx0XHRcdFx0ZWxzZSB1cGRhdGVOb2RlKHBhcmVudCwgbywgdiwgaG9va3MsIGdldE5leHRTaWJsaW5nKG9sZCwgc3RhcnQgKyAxLCBuZXh0U2libGluZyksIG5zKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChvbGQubGVuZ3RoID4gY29tbW9uTGVuZ3RoKSByZW1vdmVOb2RlcyhwYXJlbnQsIG9sZCwgc3RhcnQsIG9sZC5sZW5ndGgpXG5cdFx0XHRcdGlmICh2bm9kZXMubGVuZ3RoID4gY29tbW9uTGVuZ3RoKSBjcmVhdGVOb2RlcyhwYXJlbnQsIHZub2Rlcywgc3RhcnQsIHZub2Rlcy5sZW5ndGgsIGhvb2tzLCBuZXh0U2libGluZywgbnMpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBrZXllZCBkaWZmXG5cdFx0XHRcdHZhciBvbGRFbmQgPSBvbGQubGVuZ3RoIC0gMSwgZW5kID0gdm5vZGVzLmxlbmd0aCAtIDEsIG1hcCwgbywgdiwgb2UsIHZlLCB0b3BTaWJsaW5nXG5cdFx0XHRcdC8vIGJvdHRvbS11cFxuXHRcdFx0XHR3aGlsZSAob2xkRW5kID49IG9sZFN0YXJ0ICYmIGVuZCA+PSBzdGFydCkge1xuXHRcdFx0XHRcdG9lID0gb2xkW29sZEVuZF1cblx0XHRcdFx0XHR2ZSA9IHZub2Rlc1tlbmRdXG5cdFx0XHRcdFx0aWYgKG9lLmtleSAhPT0gdmUua2V5KSBicmVha1xuXHRcdFx0XHRcdGlmIChvZSAhPT0gdmUpIHVwZGF0ZU5vZGUocGFyZW50LCBvZSwgdmUsIGhvb2tzLCBuZXh0U2libGluZywgbnMpXG5cdFx0XHRcdFx0aWYgKHZlLmRvbSAhPSBudWxsKSBuZXh0U2libGluZyA9IHZlLmRvbVxuXHRcdFx0XHRcdG9sZEVuZC0tLCBlbmQtLVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHRvcC1kb3duXG5cdFx0XHRcdHdoaWxlIChvbGRFbmQgPj0gb2xkU3RhcnQgJiYgZW5kID49IHN0YXJ0KSB7XG5cdFx0XHRcdFx0byA9IG9sZFtvbGRTdGFydF1cblx0XHRcdFx0XHR2ID0gdm5vZGVzW3N0YXJ0XVxuXHRcdFx0XHRcdGlmIChvLmtleSAhPT0gdi5rZXkpIGJyZWFrXG5cdFx0XHRcdFx0b2xkU3RhcnQrKywgc3RhcnQrK1xuXHRcdFx0XHRcdGlmIChvICE9PSB2KSB1cGRhdGVOb2RlKHBhcmVudCwgbywgdiwgaG9va3MsIGdldE5leHRTaWJsaW5nKG9sZCwgb2xkU3RhcnQsIG5leHRTaWJsaW5nKSwgbnMpXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gc3dhcHMgYW5kIGxpc3QgcmV2ZXJzYWxzXG5cdFx0XHRcdHdoaWxlIChvbGRFbmQgPj0gb2xkU3RhcnQgJiYgZW5kID49IHN0YXJ0KSB7XG5cdFx0XHRcdFx0aWYgKHN0YXJ0ID09PSBlbmQpIGJyZWFrXG5cdFx0XHRcdFx0aWYgKG8ua2V5ICE9PSB2ZS5rZXkgfHwgb2Uua2V5ICE9PSB2LmtleSkgYnJlYWtcblx0XHRcdFx0XHR0b3BTaWJsaW5nID0gZ2V0TmV4dFNpYmxpbmcob2xkLCBvbGRTdGFydCwgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0bW92ZU5vZGVzKHBhcmVudCwgb2UsIHRvcFNpYmxpbmcpXG5cdFx0XHRcdFx0aWYgKG9lICE9PSB2KSB1cGRhdGVOb2RlKHBhcmVudCwgb2UsIHYsIGhvb2tzLCB0b3BTaWJsaW5nLCBucylcblx0XHRcdFx0XHRpZiAoKytzdGFydCA8PSAtLWVuZCkgbW92ZU5vZGVzKHBhcmVudCwgbywgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0aWYgKG8gIT09IHZlKSB1cGRhdGVOb2RlKHBhcmVudCwgbywgdmUsIGhvb2tzLCBuZXh0U2libGluZywgbnMpXG5cdFx0XHRcdFx0aWYgKHZlLmRvbSAhPSBudWxsKSBuZXh0U2libGluZyA9IHZlLmRvbVxuXHRcdFx0XHRcdG9sZFN0YXJ0Kys7XG5cdFx0XHRcdFx0b2xkRW5kLS1cblx0XHRcdFx0XHRvZSA9IG9sZFtvbGRFbmRdXG5cdFx0XHRcdFx0dmUgPSB2bm9kZXNbZW5kXVxuXHRcdFx0XHRcdG8gPSBvbGRbb2xkU3RhcnRdXG5cdFx0XHRcdFx0diA9IHZub2Rlc1tzdGFydF1cblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBib3R0b20gdXAgb25jZSBhZ2FpblxuXHRcdFx0XHR3aGlsZSAob2xkRW5kID49IG9sZFN0YXJ0ICYmIGVuZCA+PSBzdGFydCkge1xuXHRcdFx0XHRcdGlmIChvZS5rZXkgIT09IHZlLmtleSkgYnJlYWtcblx0XHRcdFx0XHRpZiAob2UgIT09IHZlKSB1cGRhdGVOb2RlKHBhcmVudCwgb2UsIHZlLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdFx0XHRcdGlmICh2ZS5kb20gIT0gbnVsbCkgbmV4dFNpYmxpbmcgPSB2ZS5kb21cblx0XHRcdFx0XHRvbGRFbmQtLSwgZW5kLS1cblx0XHRcdFx0XHRvZSA9IG9sZFtvbGRFbmRdXG5cdFx0XHRcdFx0dmUgPSB2bm9kZXNbZW5kXVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChzdGFydCA+IGVuZCkgcmVtb3ZlTm9kZXMocGFyZW50LCBvbGQsIG9sZFN0YXJ0LCBvbGRFbmQgKyAxKVxuXHRcdFx0XHRlbHNlIGlmIChvbGRTdGFydCA+IG9sZEVuZCkgY3JlYXRlTm9kZXMocGFyZW50LCB2bm9kZXMsIHN0YXJ0LCBlbmQgKyAxLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHQvLyBpbnNwaXJlZCBieSBpdmkgaHR0cHM6Ly9naXRodWIuY29tL2l2aWpzL2l2aS8gYnkgQm9yaXMgS2F1bFxuXHRcdFx0XHRcdHZhciBvcmlnaW5hbE5leHRTaWJsaW5nID0gbmV4dFNpYmxpbmcsIHZub2Rlc0xlbmd0aCA9IGVuZCAtIHN0YXJ0ICsgMSwgb2xkSW5kaWNlcyA9IG5ldyBBcnJheSh2bm9kZXNMZW5ndGgpLCBsaSA9IDAsIGkgPSAwLFxuXHRcdFx0XHRcdFx0cG9zID0gMjE0NzQ4MzY0NywgbWF0Y2hlZCA9IDAsIG1hcCwgbGlzSW5kaWNlc1xuXHRcdFx0XHRcdGZvciAoaSA9IDA7IGkgPCB2bm9kZXNMZW5ndGg7IGkrKykgb2xkSW5kaWNlc1tpXSA9IC0xXG5cdFx0XHRcdFx0Zm9yIChpID0gZW5kOyBpID49IHN0YXJ0OyBpLS0pIHtcblx0XHRcdFx0XHRcdGlmIChtYXAgPT0gbnVsbCkgbWFwID0gZ2V0S2V5TWFwKG9sZCwgb2xkU3RhcnQsIG9sZEVuZCArIDEpXG5cdFx0XHRcdFx0XHR2ZSA9IHZub2Rlc1tpXVxuXHRcdFx0XHRcdFx0dmFyIG9sZEluZGV4ID0gbWFwW3ZlLmtleV1cblx0XHRcdFx0XHRcdGlmIChvbGRJbmRleCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHBvcyA9IChvbGRJbmRleCA8IHBvcykgPyBvbGRJbmRleCA6IC0xIC8vIGJlY29tZXMgLTEgaWYgbm9kZXMgd2VyZSByZS1vcmRlcmVkXG5cdFx0XHRcdFx0XHRcdG9sZEluZGljZXNbaSAtIHN0YXJ0XSA9IG9sZEluZGV4XG5cdFx0XHRcdFx0XHRcdG9lID0gb2xkW29sZEluZGV4XVxuXHRcdFx0XHRcdFx0XHRvbGRbb2xkSW5kZXhdID0gbnVsbFxuXHRcdFx0XHRcdFx0XHRpZiAob2UgIT09IHZlKSB1cGRhdGVOb2RlKHBhcmVudCwgb2UsIHZlLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdFx0XHRcdFx0XHRpZiAodmUuZG9tICE9IG51bGwpIG5leHRTaWJsaW5nID0gdmUuZG9tXG5cdFx0XHRcdFx0XHRcdG1hdGNoZWQrK1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRuZXh0U2libGluZyA9IG9yaWdpbmFsTmV4dFNpYmxpbmdcblx0XHRcdFx0XHRpZiAobWF0Y2hlZCAhPT0gb2xkRW5kIC0gb2xkU3RhcnQgKyAxKSByZW1vdmVOb2RlcyhwYXJlbnQsIG9sZCwgb2xkU3RhcnQsIG9sZEVuZCArIDEpXG5cdFx0XHRcdFx0aWYgKG1hdGNoZWQgPT09IDApIGNyZWF0ZU5vZGVzKHBhcmVudCwgdm5vZGVzLCBzdGFydCwgZW5kICsgMSwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChwb3MgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdC8vIHRoZSBpbmRpY2VzIG9mIHRoZSBpbmRpY2VzIG9mIHRoZSBpdGVtcyB0aGF0IGFyZSBwYXJ0IG9mIHRoZVxuXHRcdFx0XHRcdFx0XHQvLyBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UgaW4gdGhlIG9sZEluZGljZXMgbGlzdFxuXHRcdFx0XHRcdFx0XHRsaXNJbmRpY2VzID0gbWFrZUxpc0luZGljZXMob2xkSW5kaWNlcylcblx0XHRcdFx0XHRcdFx0bGkgPSBsaXNJbmRpY2VzLmxlbmd0aCAtIDFcblx0XHRcdFx0XHRcdFx0Zm9yIChpID0gZW5kOyBpID49IHN0YXJ0OyBpLS0pIHtcblx0XHRcdFx0XHRcdFx0XHR2ID0gdm5vZGVzW2ldXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG9sZEluZGljZXNbaS1zdGFydF0gPT09IC0xKSBjcmVhdGVOb2RlKHBhcmVudCwgdiwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChsaXNJbmRpY2VzW2xpXSA9PT0gaSAtIHN0YXJ0KSBsaS0tXG5cdFx0XHRcdFx0XHRcdFx0XHRlbHNlIG1vdmVOb2RlcyhwYXJlbnQsIHYsIG5leHRTaWJsaW5nKVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRpZiAodi5kb20gIT0gbnVsbCkgbmV4dFNpYmxpbmcgPSB2bm9kZXNbaV0uZG9tXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGZvciAoaSA9IGVuZDsgaSA+PSBzdGFydDsgaS0tKSB7XG5cdFx0XHRcdFx0XHRcdFx0diA9IHZub2Rlc1tpXVxuXHRcdFx0XHRcdFx0XHRcdGlmIChvbGRJbmRpY2VzW2kgLSBzdGFydF0gPT09IC0xKSBjcmVhdGVOb2RlKHBhcmVudCwgdiwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdFx0XHRcdFx0XHRpZiAodi5kb20gIT0gbnVsbCkgbmV4dFNpYmxpbmcgPSB2bm9kZXNbaV0uZG9tXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlKHBhcmVudCwgb2xkLCB2bm9kZTMsIGhvb2tzLCBuZXh0U2libGluZywgbnMpIHtcblx0XHR2YXIgb2xkVGFnID0gb2xkLnRhZywgdGFnID0gdm5vZGUzLnRhZ1xuXHRcdGlmIChvbGRUYWcgPT09IHRhZykge1xuXHRcdFx0dm5vZGUzLnN0YXRlID0gb2xkLnN0YXRlXG5cdFx0XHR2bm9kZTMuZXZlbnRzID0gb2xkLmV2ZW50c1xuXHRcdFx0aWYgKHNob3VsZE5vdFVwZGF0ZSh2bm9kZTMsIG9sZCkpIHJldHVyblxuXHRcdFx0aWYgKHR5cGVvZiBvbGRUYWcgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0aWYgKHZub2RlMy5hdHRycyAhPSBudWxsKSB7XG5cdFx0XHRcdFx0dXBkYXRlTGlmZWN5Y2xlKHZub2RlMy5hdHRycywgdm5vZGUzLCBob29rcylcblx0XHRcdFx0fVxuXHRcdFx0XHRzd2l0Y2ggKG9sZFRhZykge1xuXHRcdFx0XHRcdGNhc2UgXCIjXCI6XG5cdFx0XHRcdFx0XHR1cGRhdGVUZXh0KG9sZCwgdm5vZGUzKTtcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSBcIjxcIjpcblx0XHRcdFx0XHRcdHVwZGF0ZUhUTUwocGFyZW50LCBvbGQsIHZub2RlMywgbnMsIG5leHRTaWJsaW5nKTtcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSBcIltcIjpcblx0XHRcdFx0XHRcdHVwZGF0ZUZyYWdtZW50KHBhcmVudCwgb2xkLCB2bm9kZTMsIGhvb2tzLCBuZXh0U2libGluZywgbnMpO1xuXHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0dXBkYXRlRWxlbWVudChvbGQsIHZub2RlMywgaG9va3MsIG5zKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHVwZGF0ZUNvbXBvbmVudChwYXJlbnQsIG9sZCwgdm5vZGUzLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlbW92ZU5vZGUocGFyZW50LCBvbGQpXG5cdFx0XHRjcmVhdGVOb2RlKHBhcmVudCwgdm5vZGUzLCBob29rcywgbnMsIG5leHRTaWJsaW5nKVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVRleHQob2xkLCB2bm9kZTMpIHtcblx0XHRpZiAob2xkLmNoaWxkcmVuLnRvU3RyaW5nKCkgIT09IHZub2RlMy5jaGlsZHJlbi50b1N0cmluZygpKSB7XG5cdFx0XHRvbGQuZG9tLm5vZGVWYWx1ZSA9IHZub2RlMy5jaGlsZHJlblxuXHRcdH1cblx0XHR2bm9kZTMuZG9tID0gb2xkLmRvbVxuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlSFRNTChwYXJlbnQsIG9sZCwgdm5vZGUzLCBucywgbmV4dFNpYmxpbmcpIHtcblx0XHRpZiAob2xkLmNoaWxkcmVuICE9PSB2bm9kZTMuY2hpbGRyZW4pIHtcblx0XHRcdHJlbW92ZUhUTUwocGFyZW50LCBvbGQpXG5cdFx0XHRjcmVhdGVIVE1MKHBhcmVudCwgdm5vZGUzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZub2RlMy5kb20gPSBvbGQuZG9tXG5cdFx0XHR2bm9kZTMuZG9tU2l6ZSA9IG9sZC5kb21TaXplXG5cdFx0XHR2bm9kZTMuaW5zdGFuY2UgPSBvbGQuaW5zdGFuY2Vcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVGcmFnbWVudChwYXJlbnQsIG9sZCwgdm5vZGUzLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKSB7XG5cdFx0dXBkYXRlTm9kZXMocGFyZW50LCBvbGQuY2hpbGRyZW4sIHZub2RlMy5jaGlsZHJlbiwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHR2YXIgZG9tU2l6ZSA9IDAsIGNoaWxkcmVuMiA9IHZub2RlMy5jaGlsZHJlblxuXHRcdHZub2RlMy5kb20gPSBudWxsXG5cdFx0aWYgKGNoaWxkcmVuMiAhPSBudWxsKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuMi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgY2hpbGQgPSBjaGlsZHJlbjJbaV1cblx0XHRcdFx0aWYgKGNoaWxkICE9IG51bGwgJiYgY2hpbGQuZG9tICE9IG51bGwpIHtcblx0XHRcdFx0XHRpZiAodm5vZGUzLmRvbSA9PSBudWxsKSB2bm9kZTMuZG9tID0gY2hpbGQuZG9tXG5cdFx0XHRcdFx0ZG9tU2l6ZSArPSBjaGlsZC5kb21TaXplIHx8IDFcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGRvbVNpemUgIT09IDEpIHZub2RlMy5kb21TaXplID0gZG9tU2l6ZVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQob2xkLCB2bm9kZTMsIGhvb2tzLCBucykge1xuXHRcdHZhciBlbGVtZW50ID0gdm5vZGUzLmRvbSA9IG9sZC5kb21cblx0XHRucyA9IGdldE5hbWVTcGFjZSh2bm9kZTMpIHx8IG5zXG5cdFx0aWYgKHZub2RlMy50YWcgPT09IFwidGV4dGFyZWFcIikge1xuXHRcdFx0aWYgKHZub2RlMy5hdHRycyA9PSBudWxsKSB2bm9kZTMuYXR0cnMgPSB7fVxuXHRcdH1cblx0XHR1cGRhdGVBdHRycyh2bm9kZTMsIG9sZC5hdHRycywgdm5vZGUzLmF0dHJzLCBucylcblx0XHRpZiAoIW1heWJlU2V0Q29udGVudEVkaXRhYmxlKHZub2RlMykpIHtcblx0XHRcdHVwZGF0ZU5vZGVzKGVsZW1lbnQsIG9sZC5jaGlsZHJlbiwgdm5vZGUzLmNoaWxkcmVuLCBob29rcywgbnVsbCwgbnMpXG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlQ29tcG9uZW50KHBhcmVudCwgb2xkLCB2bm9kZTMsIGhvb2tzLCBuZXh0U2libGluZywgbnMpIHtcblx0XHR2bm9kZTMuaW5zdGFuY2UgPSBWbm9kZS5ub3JtYWxpemUoY2FsbEhvb2suY2FsbCh2bm9kZTMuc3RhdGUudmlldywgdm5vZGUzKSlcblx0XHRpZiAodm5vZGUzLmluc3RhbmNlID09PSB2bm9kZTMpIHRocm93IEVycm9yKFwiQSB2aWV3IGNhbm5vdCByZXR1cm4gdGhlIHZub2RlIGl0IHJlY2VpdmVkIGFzIGFyZ3VtZW50XCIpXG5cdFx0dXBkYXRlTGlmZWN5Y2xlKHZub2RlMy5zdGF0ZSwgdm5vZGUzLCBob29rcylcblx0XHRpZiAodm5vZGUzLmF0dHJzICE9IG51bGwpIHVwZGF0ZUxpZmVjeWNsZSh2bm9kZTMuYXR0cnMsIHZub2RlMywgaG9va3MpXG5cdFx0aWYgKHZub2RlMy5pbnN0YW5jZSAhPSBudWxsKSB7XG5cdFx0XHRpZiAob2xkLmluc3RhbmNlID09IG51bGwpIGNyZWF0ZU5vZGUocGFyZW50LCB2bm9kZTMuaW5zdGFuY2UsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0XHRlbHNlIHVwZGF0ZU5vZGUocGFyZW50LCBvbGQuaW5zdGFuY2UsIHZub2RlMy5pbnN0YW5jZSwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHRcdHZub2RlMy5kb20gPSB2bm9kZTMuaW5zdGFuY2UuZG9tXG5cdFx0XHR2bm9kZTMuZG9tU2l6ZSA9IHZub2RlMy5pbnN0YW5jZS5kb21TaXplXG5cdFx0fSBlbHNlIGlmIChvbGQuaW5zdGFuY2UgIT0gbnVsbCkge1xuXHRcdFx0cmVtb3ZlTm9kZShwYXJlbnQsIG9sZC5pbnN0YW5jZSlcblx0XHRcdHZub2RlMy5kb20gPSB1bmRlZmluZWRcblx0XHRcdHZub2RlMy5kb21TaXplID0gMFxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2bm9kZTMuZG9tID0gb2xkLmRvbVxuXHRcdFx0dm5vZGUzLmRvbVNpemUgPSBvbGQuZG9tU2l6ZVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEtleU1hcCh2bm9kZXMsIHN0YXJ0LCBlbmQpIHtcblx0XHR2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXHRcdGZvciAoOyBzdGFydCA8IGVuZDsgc3RhcnQrKykge1xuXHRcdFx0dmFyIHZub2RlMyA9IHZub2Rlc1tzdGFydF1cblx0XHRcdGlmICh2bm9kZTMgIT0gbnVsbCkge1xuXHRcdFx0XHR2YXIga2V5ID0gdm5vZGUzLmtleVxuXHRcdFx0XHRpZiAoa2V5ICE9IG51bGwpIG1hcFtrZXldID0gc3RhcnRcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG1hcFxuXHR9XG5cblx0Ly8gTGlmdGVkIGZyb20gaXZpIGh0dHBzOi8vZ2l0aHViLmNvbS9pdmlqcy9pdmkvXG5cdC8vIHRha2VzIGEgbGlzdCBvZiB1bmlxdWUgbnVtYmVycyAoLTEgaXMgc3BlY2lhbCBhbmQgY2FuXG5cdC8vIG9jY3VyIG11bHRpcGxlIHRpbWVzKSBhbmQgcmV0dXJucyBhbiBhcnJheSB3aXRoIHRoZSBpbmRpY2VzXG5cdC8vIG9mIHRoZSBpdGVtcyB0aGF0IGFyZSBwYXJ0IG9mIHRoZSBsb25nZXN0IGluY3JlYXNpbmdcblx0Ly8gc3Vic2VxdWVuY2Vcblx0dmFyIGxpc1RlbXAgPSBbXVxuXG5cdGZ1bmN0aW9uIG1ha2VMaXNJbmRpY2VzKGEpIHtcblx0XHR2YXIgcmVzdWx0ID0gWzBdXG5cdFx0dmFyIHUgPSAwLCB2ID0gMCwgaSA9IDBcblx0XHR2YXIgaWwgPSBsaXNUZW1wLmxlbmd0aCA9IGEubGVuZ3RoXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBpbDsgaSsrKSBsaXNUZW1wW2ldID0gYVtpXVxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaWw7ICsraSkge1xuXHRcdFx0aWYgKGFbaV0gPT09IC0xKSBjb250aW51ZVxuXHRcdFx0dmFyIGogPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdXG5cdFx0XHRpZiAoYVtqXSA8IGFbaV0pIHtcblx0XHRcdFx0bGlzVGVtcFtpXSA9IGpcblx0XHRcdFx0cmVzdWx0LnB1c2goaSlcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblx0XHRcdHUgPSAwXG5cdFx0XHR2ID0gcmVzdWx0Lmxlbmd0aCAtIDFcblx0XHRcdHdoaWxlICh1IDwgdikge1xuXHRcdFx0XHQvLyBGYXN0IGludGVnZXIgYXZlcmFnZSB3aXRob3V0IG92ZXJmbG93LlxuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZVxuXHRcdFx0XHR2YXIgYyA9ICh1ID4+PiAxKSArICh2ID4+PiAxKSArICh1ICYgdiAmIDEpXG5cdFx0XHRcdGlmIChhW3Jlc3VsdFtjXV0gPCBhW2ldKSB7XG5cdFx0XHRcdFx0dSA9IGMgKyAxXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0diA9IGNcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGFbaV0gPCBhW3Jlc3VsdFt1XV0pIHtcblx0XHRcdFx0aWYgKHUgPiAwKSBsaXNUZW1wW2ldID0gcmVzdWx0W3UgLSAxXVxuXHRcdFx0XHRyZXN1bHRbdV0gPSBpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHUgPSByZXN1bHQubGVuZ3RoXG5cdFx0diA9IHJlc3VsdFt1IC0gMV1cblx0XHR3aGlsZSAodS0tID4gMCkge1xuXHRcdFx0cmVzdWx0W3VdID0gdlxuXHRcdFx0diA9IGxpc1RlbXBbdl1cblx0XHR9XG5cdFx0bGlzVGVtcC5sZW5ndGggPSAwXG5cdFx0cmV0dXJuIHJlc3VsdFxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0TmV4dFNpYmxpbmcodm5vZGVzLCBpLCBuZXh0U2libGluZykge1xuXHRcdGZvciAoOyBpIDwgdm5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodm5vZGVzW2ldICE9IG51bGwgJiYgdm5vZGVzW2ldLmRvbSAhPSBudWxsKSByZXR1cm4gdm5vZGVzW2ldLmRvbVxuXHRcdH1cblx0XHRyZXR1cm4gbmV4dFNpYmxpbmdcblx0fVxuXG5cdC8vIFRoaXMgY292ZXJzIGEgcmVhbGx5IHNwZWNpZmljIGVkZ2UgY2FzZTpcblx0Ly8gLSBQYXJlbnQgbm9kZSBpcyBrZXllZCBhbmQgY29udGFpbnMgY2hpbGRcblx0Ly8gLSBDaGlsZCBpcyByZW1vdmVkLCByZXR1cm5zIHVucmVzb2x2ZWQgcHJvbWlzZTAgaW4gYG9uYmVmb3JlcmVtb3ZlYFxuXHQvLyAtIFBhcmVudCBub2RlIGlzIG1vdmVkIGluIGtleWVkIGRpZmZcblx0Ly8gLSBSZW1haW5pbmcgY2hpbGRyZW4yIHN0aWxsIG5lZWQgbW92ZWQgYXBwcm9wcmlhdGVseVxuXHQvL1xuXHQvLyBJZGVhbGx5LCBJJ2QgdHJhY2sgcmVtb3ZlZCBub2RlcyBhcyB3ZWxsLCBidXQgdGhhdCBpbnRyb2R1Y2VzIGEgbG90IG1vcmVcblx0Ly8gY29tcGxleGl0eSBhbmQgSSdtMiBub3QgZXhhY3RseSBpbnRlcmVzdGVkIGluIGRvaW5nIHRoYXQuXG5cdGZ1bmN0aW9uIG1vdmVOb2RlcyhwYXJlbnQsIHZub2RlMywgbmV4dFNpYmxpbmcpIHtcblx0XHR2YXIgZnJhZyA9ICRkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdFx0bW92ZUNoaWxkVG9GcmFnKHBhcmVudCwgZnJhZywgdm5vZGUzKVxuXHRcdGluc2VydE5vZGUocGFyZW50LCBmcmFnLCBuZXh0U2libGluZylcblx0fVxuXG5cdGZ1bmN0aW9uIG1vdmVDaGlsZFRvRnJhZyhwYXJlbnQsIGZyYWcsIHZub2RlMykge1xuXHRcdC8vIERvZGdlIHRoZSByZWN1cnNpb24gb3ZlcmhlYWQgaW4gYSBmZXcgb2YgdGhlIG1vc3QgY29tbW9uIGNhc2VzLlxuXHRcdHdoaWxlICh2bm9kZTMuZG9tICE9IG51bGwgJiYgdm5vZGUzLmRvbS5wYXJlbnROb2RlID09PSBwYXJlbnQpIHtcblx0XHRcdGlmICh0eXBlb2Ygdm5vZGUzLnRhZyAhPT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHR2bm9kZTMgPSB2bm9kZTMuaW5zdGFuY2Vcblx0XHRcdFx0aWYgKHZub2RlMyAhPSBudWxsKSBjb250aW51ZVxuXHRcdFx0fSBlbHNlIGlmICh2bm9kZTMudGFnID09PSBcIjxcIikge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZub2RlMy5pbnN0YW5jZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGZyYWcuYXBwZW5kQ2hpbGQodm5vZGUzLmluc3RhbmNlW2ldKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHZub2RlMy50YWcgIT09IFwiW1wiKSB7XG5cdFx0XHRcdC8vIERvbid0IHJlY3Vyc2UgZm9yIHRleHQgbm9kZXMgKm9yKiBlbGVtZW50cywganVzdCBmcmFnbWVudHNcblx0XHRcdFx0ZnJhZy5hcHBlbmRDaGlsZCh2bm9kZTMuZG9tKVxuXHRcdFx0fSBlbHNlIGlmICh2bm9kZTMuY2hpbGRyZW4ubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdHZub2RlMyA9IHZub2RlMy5jaGlsZHJlblswXVxuXHRcdFx0XHRpZiAodm5vZGUzICE9IG51bGwpIGNvbnRpbnVlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZub2RlMy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBjaGlsZCA9IHZub2RlMy5jaGlsZHJlbltpXVxuXHRcdFx0XHRcdGlmIChjaGlsZCAhPSBudWxsKSBtb3ZlQ2hpbGRUb0ZyYWcocGFyZW50LCBmcmFnLCBjaGlsZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0YnJlYWtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNlcnROb2RlKHBhcmVudCwgZG9tLCBuZXh0U2libGluZykge1xuXHRcdGlmIChuZXh0U2libGluZyAhPSBudWxsKSBwYXJlbnQuaW5zZXJ0QmVmb3JlKGRvbSwgbmV4dFNpYmxpbmcpXG5cdFx0ZWxzZSBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9tKVxuXHRcdH1cblx0ZnVuY3Rpb24gbWF5YmVTZXRDb250ZW50RWRpdGFibGUodm5vZGUzKSB7XG5cdFx0aWYgKHZub2RlMy5hdHRycyA9PSBudWxsIHx8IChcblx0XHRcdHZub2RlMy5hdHRycy5jb250ZW50ZWRpdGFibGUgPT0gbnVsbCAmJiAvLyBhdHRyaWJ1dGVcblx0XHRcdHZub2RlMy5hdHRycy5jb250ZW50RWRpdGFibGUgPT0gbnVsbCAvLyBwcm9wZXJ0eVxuXHRcdCkpIHJldHVybiBmYWxzZVxuXHRcdHZhciBjaGlsZHJlbjIgPSB2bm9kZTMuY2hpbGRyZW5cblx0XHRpZiAoY2hpbGRyZW4yICE9IG51bGwgJiYgY2hpbGRyZW4yLmxlbmd0aCA9PT0gMSAmJiBjaGlsZHJlbjJbMF0udGFnID09PSBcIjxcIikge1xuXHRcdFx0dmFyIGNvbnRlbnQgPSBjaGlsZHJlbjJbMF0uY2hpbGRyZW5cblx0XHRcdGlmICh2bm9kZTMuZG9tLmlubmVySFRNTCAhPT0gY29udGVudCkgdm5vZGUzLmRvbS5pbm5lckhUTUwgPSBjb250ZW50XG5cdFx0fSBlbHNlIGlmIChjaGlsZHJlbjIgIT0gbnVsbCAmJiBjaGlsZHJlbjIubGVuZ3RoICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJDaGlsZCBub2RlIG9mIGEgY29udGVudGVkaXRhYmxlIG11c3QgYmUgdHJ1c3RlZC5cIilcblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG5cblx0Ly9yZW1vdmVcblx0ZnVuY3Rpb24gcmVtb3ZlTm9kZXMocGFyZW50LCB2bm9kZXMsIHN0YXJ0LCBlbmQpIHtcblx0XHRmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuXHRcdFx0dmFyIHZub2RlMyA9IHZub2Rlc1tpXVxuXHRcdFx0aWYgKHZub2RlMyAhPSBudWxsKSByZW1vdmVOb2RlKHBhcmVudCwgdm5vZGUzKVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlbW92ZU5vZGUocGFyZW50LCB2bm9kZTMpIHtcblx0XHR2YXIgbWFzayA9IDBcblx0XHR2YXIgb3JpZ2luYWwgPSB2bm9kZTMuc3RhdGVcblx0XHR2YXIgc3RhdGVSZXN1bHQsIGF0dHJzUmVzdWx0XG5cdFx0aWYgKHR5cGVvZiB2bm9kZTMudGFnICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiB2bm9kZTMuc3RhdGUub25iZWZvcmVyZW1vdmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dmFyIHJlc3VsdCA9IGNhbGxIb29rLmNhbGwodm5vZGUzLnN0YXRlLm9uYmVmb3JlcmVtb3ZlLCB2bm9kZTMpXG5cdFx0XHRpZiAocmVzdWx0ICE9IG51bGwgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0bWFzayA9IDFcblx0XHRcdFx0c3RhdGVSZXN1bHQgPSByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKHZub2RlMy5hdHRycyAmJiB0eXBlb2Ygdm5vZGUzLmF0dHJzLm9uYmVmb3JlcmVtb3ZlID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHZhciByZXN1bHQgPSBjYWxsSG9vay5jYWxsKHZub2RlMy5hdHRycy5vbmJlZm9yZXJlbW92ZSwgdm5vZGUzKVxuXHRcdFx0aWYgKHJlc3VsdCAhPSBudWxsICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG5cdFx0XHRcdG1hc2sgfD0gMlxuXHRcdFx0XHRhdHRyc1Jlc3VsdCA9IHJlc3VsdFxuXHRcdFx0fVxuXHRcdH1cblx0XHRjaGVja1N0YXRlKHZub2RlMywgb3JpZ2luYWwpXG5cdFx0Ly8gSWYgd2UgY2FuLCB0cnkgdG8gZmFzdC1wYXRoIGl0IGFuZCBhdm9pZCBhbGwgdGhlIG92ZXJoZWFkIG9mIGF3YWl0aW5nXG5cdFx0aWYgKCFtYXNrKSB7XG5cdFx0XHRvbnJlbW92ZSh2bm9kZTMpXG5cdFx0XHRyZW1vdmVDaGlsZChwYXJlbnQsIHZub2RlMylcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHN0YXRlUmVzdWx0ICE9IG51bGwpIHtcblx0XHRcdFx0dmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2Vcblx0XHRcdFx0XHRpZiAobWFzayAmIDEpIHtcblx0XHRcdFx0XHRcdG1hc2sgJj0gMjtcblx0XHRcdFx0XHRcdGlmICghbWFzaykgcmVhbGx5UmVtb3ZlKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0c3RhdGVSZXN1bHQudGhlbihuZXh0LCBuZXh0KVxuXHRcdFx0fVxuXHRcdFx0aWYgKGF0dHJzUmVzdWx0ICE9IG51bGwpIHtcblx0XHRcdFx0dmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2Vcblx0XHRcdFx0XHRpZiAobWFzayAmIDIpIHtcblx0XHRcdFx0XHRcdG1hc2sgJj0gMTtcblx0XHRcdFx0XHRcdGlmICghbWFzaykgcmVhbGx5UmVtb3ZlKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0YXR0cnNSZXN1bHQudGhlbihuZXh0LCBuZXh0KVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHJlYWxseVJlbW92ZSgpIHtcblx0XHRcdGNoZWNrU3RhdGUodm5vZGUzLCBvcmlnaW5hbClcblx0XHRcdG9ucmVtb3ZlKHZub2RlMylcblx0XHRcdHJlbW92ZUNoaWxkKHBhcmVudCwgdm5vZGUzKVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlbW92ZUhUTUwocGFyZW50LCB2bm9kZTMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZub2RlMy5pbnN0YW5jZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0cGFyZW50LnJlbW92ZUNoaWxkKHZub2RlMy5pbnN0YW5jZVtpXSlcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiByZW1vdmVDaGlsZChwYXJlbnQsIHZub2RlMykge1xuXHRcdC8vIERvZGdlIHRoZSByZWN1cnNpb24gb3ZlcmhlYWQgaW4gYSBmZXcgb2YgdGhlIG1vc3QgY29tbW9uIGNhc2VzLlxuXHRcdHdoaWxlICh2bm9kZTMuZG9tICE9IG51bGwgJiYgdm5vZGUzLmRvbS5wYXJlbnROb2RlID09PSBwYXJlbnQpIHtcblx0XHRcdGlmICh0eXBlb2Ygdm5vZGUzLnRhZyAhPT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHR2bm9kZTMgPSB2bm9kZTMuaW5zdGFuY2Vcblx0XHRcdFx0aWYgKHZub2RlMyAhPSBudWxsKSBjb250aW51ZVxuXHRcdFx0fSBlbHNlIGlmICh2bm9kZTMudGFnID09PSBcIjxcIikge1xuXHRcdFx0XHRyZW1vdmVIVE1MKHBhcmVudCwgdm5vZGUzKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHZub2RlMy50YWcgIT09IFwiW1wiKSB7XG5cdFx0XHRcdFx0cGFyZW50LnJlbW92ZUNoaWxkKHZub2RlMy5kb20pXG5cdFx0XHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHZub2RlMy5jaGlsZHJlbikpIGJyZWFrXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHZub2RlMy5jaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHR2bm9kZTMgPSB2bm9kZTMuY2hpbGRyZW5bMF1cblx0XHRcdFx0XHRpZiAodm5vZGUzICE9IG51bGwpIGNvbnRpbnVlXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB2bm9kZTMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHZhciBjaGlsZCA9IHZub2RlMy5jaGlsZHJlbltpXVxuXHRcdFx0XHRcdFx0aWYgKGNoaWxkICE9IG51bGwpIHJlbW92ZUNoaWxkKHBhcmVudCwgY2hpbGQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG9ucmVtb3ZlKHZub2RlMykge1xuXHRcdGlmICh0eXBlb2Ygdm5vZGUzLnRhZyAhPT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygdm5vZGUzLnN0YXRlLm9ucmVtb3ZlID09PSBcImZ1bmN0aW9uXCIpIGNhbGxIb29rLmNhbGwodm5vZGUzLnN0YXRlLm9ucmVtb3ZlLCB2bm9kZTMpXG5cdFx0aWYgKHZub2RlMy5hdHRycyAmJiB0eXBlb2Ygdm5vZGUzLmF0dHJzLm9ucmVtb3ZlID09PSBcImZ1bmN0aW9uXCIpIGNhbGxIb29rLmNhbGwodm5vZGUzLmF0dHJzLm9ucmVtb3ZlLCB2bm9kZTMpXG5cdFx0aWYgKHR5cGVvZiB2bm9kZTMudGFnICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRpZiAodm5vZGUzLmluc3RhbmNlICE9IG51bGwpIG9ucmVtb3ZlKHZub2RlMy5pbnN0YW5jZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGNoaWxkcmVuMiA9IHZub2RlMy5jaGlsZHJlblxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4yKSkge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuMi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBjaGlsZCA9IGNoaWxkcmVuMltpXVxuXHRcdFx0XHRcdGlmIChjaGlsZCAhPSBudWxsKSBvbnJlbW92ZShjaGlsZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vYXR0cnMyXG5cdGZ1bmN0aW9uIHNldEF0dHJzKHZub2RlMywgYXR0cnMyLCBucykge1xuXHRcdC8vIElmIHlvdSBhc3NpZ24gYW4gaW5wdXQgdHlwZTAgdGhhdCBpcyBub3Qgc3VwcG9ydGVkIGJ5IElFIDExIHdpdGggYW4gYXNzaWdubWVudCBleHByZXNzaW9uLCBhbiBlcnJvciB3aWxsIG9jY3VyLlxuXHRcdC8vXG5cdFx0Ly8gQWxzbywgdGhlIERPTSBkb2VzIHRoaW5ncyB0byBpbnB1dHMgYmFzZWQgb24gdGhlIHZhbHVlLCBzbyBpdCBuZWVkcyBzZXQgZmlyc3QuXG5cdFx0Ly8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vTWl0aHJpbEpTL21pdGhyaWwuanMvaXNzdWVzLzI2MjJcblx0XHRpZiAodm5vZGUzLnRhZyA9PT0gXCJpbnB1dFwiICYmIGF0dHJzMi50eXBlICE9IG51bGwpIHZub2RlMy5kb20uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBhdHRyczIudHlwZSlcblx0XHR2YXIgaXNGaWxlSW5wdXQgPSBhdHRyczIgIT0gbnVsbCAmJiB2bm9kZTMudGFnID09PSBcImlucHV0XCIgJiYgYXR0cnMyLnR5cGUgPT09IFwiZmlsZVwiXG5cdFx0Zm9yICh2YXIga2V5IGluIGF0dHJzMikge1xuXHRcdFx0c2V0QXR0cih2bm9kZTMsIGtleSwgbnVsbCwgYXR0cnMyW2tleV0sIG5zLCBpc0ZpbGVJbnB1dClcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRBdHRyKHZub2RlMywga2V5LCBvbGQsIHZhbHVlLCBucywgaXNGaWxlSW5wdXQpIHtcblx0XHRpZiAoa2V5ID09PSBcImtleVwiIHx8IGtleSA9PT0gXCJpc1wiIHx8IHZhbHVlID09IG51bGwgfHwgaXNMaWZlY3ljbGVNZXRob2Qoa2V5KSB8fCAob2xkID09PSB2YWx1ZSAmJiAhaXNGb3JtQXR0cmlidXRlKHZub2RlMywga2V5KSkgJiYgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8IGtleSA9PT0gXCJ0eXBlXCIgJiYgdm5vZGUzLnRhZyA9PT0gXCJpbnB1dFwiKSByZXR1cm5cblx0XHRpZiAoa2V5WzBdID09PSBcIm9cIiAmJiBrZXlbMV0gPT09IFwiblwiKSByZXR1cm4gdXBkYXRlRXZlbnQodm5vZGUzLCBrZXksIHZhbHVlKVxuXHRcdGlmIChrZXkuc2xpY2UoMCwgNikgPT09IFwieGxpbms6XCIpIHZub2RlMy5kb20uc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIGtleS5zbGljZSg2KSwgdmFsdWUpXG5cdFx0ZWxzZSBpZiAoa2V5ID09PSBcInN0eWxlXCIpIHVwZGF0ZVN0eWxlKHZub2RlMy5kb20sIG9sZCwgdmFsdWUpXG5cdFx0ZWxzZSBpZiAoaGFzUHJvcGVydHlLZXkodm5vZGUzLCBrZXksIG5zKSkge1xuXHRcdFx0aWYgKGtleSA9PT0gXCJ2YWx1ZVwiKSB7XG5cdFx0XHRcdC8vIE9ubHkgZG8gdGhlIGNvZXJjaW9uIGlmIHdlJ3JlIGFjdHVhbGx5IGdvaW5nIHRvIGNoZWNrIHRoZSB2YWx1ZS5cblx0XHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8taW1wbGljaXQtY29lcmNpb24gKi9cblx0XHRcdFx0Ly9zZXR0aW5nIGlucHV0W3ZhbHVlXSB0byBzYW1lIHZhbHVlIGJ5IHR5cGluZyBvbiBmb2N1c2VkIGVsZW1lbnQgbW92ZXMgY3Vyc29yIHRvIGVuZCBpbiBDaHJvbWVcblx0XHRcdFx0Ly9zZXR0aW5nIGlucHV0W3R5cGUwPWZpbGVdW3ZhbHVlXSB0byBzYW1lIHZhbHVlIGNhdXNlcyBhbiBlcnJvciB0byBiZSBnZW5lcmF0ZWQgaWYgaXQncyBub24tZW1wdHlcblx0XHRcdFx0aWYgKCh2bm9kZTMudGFnID09PSBcImlucHV0XCIgfHwgdm5vZGUzLnRhZyA9PT0gXCJ0ZXh0YXJlYVwiKSAmJiB2bm9kZTMuZG9tLnZhbHVlID09PSBcIlwiICsgdmFsdWUgJiYgKGlzRmlsZUlucHV0IHx8IHZub2RlMy5kb20gPT09IGFjdGl2ZUVsZW1lbnQoKSkpIHJldHVyblxuXHRcdFx0XHQvL3NldHRpbmcgc2VsZWN0W3ZhbHVlXSB0byBzYW1lIHZhbHVlIHdoaWxlIGhhdmluZyBzZWxlY3Qgb3BlbiBibGlua3Mgc2VsZWN0IGRyb3Bkb3duIGluIENocm9tZVxuXHRcdFx0XHRpZiAodm5vZGUzLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBvbGQgIT09IG51bGwgJiYgdm5vZGUzLmRvbS52YWx1ZSA9PT0gXCJcIiArIHZhbHVlKSByZXR1cm5cblx0XHRcdFx0Ly9zZXR0aW5nIG9wdGlvblt2YWx1ZV0gdG8gc2FtZSB2YWx1ZSB3aGlsZSBoYXZpbmcgc2VsZWN0IG9wZW4gYmxpbmtzIHNlbGVjdCBkcm9wZG93biBpbiBDaHJvbWVcblx0XHRcdFx0aWYgKHZub2RlMy50YWcgPT09IFwib3B0aW9uXCIgJiYgb2xkICE9PSBudWxsICYmIHZub2RlMy5kb20udmFsdWUgPT09IFwiXCIgKyB2YWx1ZSkgcmV0dXJuXG5cdFx0XHRcdC8vc2V0dGluZyBpbnB1dFt0eXBlMD1maWxlXVt2YWx1ZV0gdG8gZGlmZmVyZW50IHZhbHVlIGlzIGFuIGVycm9yIGlmIGl0J3Mgbm9uLWVtcHR5XG5cdFx0XHRcdC8vIE5vdCBpZGVhbCwgYnV0IGl0IGF0IGxlYXN0IHdvcmtzIGFyb3VuZCB0aGUgbW9zdCBjb21tb24gc291cmNlIG9mIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgZm9yIG5vdy5cblx0XHRcdFx0aWYgKGlzRmlsZUlucHV0ICYmIFwiXCIgKyB2YWx1ZSAhPT0gXCJcIikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJgdmFsdWVgIGlzIHJlYWQtb25seSBvbiBmaWxlIGlucHV0cyFcIik7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblx0XHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1pbXBsaWNpdC1jb2VyY2lvbiAqL1xuXHRcdFx0fVxuXHRcdFx0dm5vZGUzLmRvbVtrZXldID0gdmFsdWVcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIpIHtcblx0XHRcdFx0aWYgKHZhbHVlKSB2bm9kZTMuZG9tLnNldEF0dHJpYnV0ZShrZXksIFwiXCIpXG5cdFx0XHRcdGVsc2Ugdm5vZGUzLmRvbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuXHRcdFx0XHR9XG5cdFx0XHRlbHNlIHZub2RlMy5kb20uc2V0QXR0cmlidXRlKGtleSA9PT0gXCJjbGFzc05hbWVcIiA/IFwiY2xhc3NcIiA6IGtleSwgdmFsdWUpXG5cdFx0XHR9XG5cdFx0fVxuXHRmdW5jdGlvbiByZW1vdmVBdHRyKHZub2RlMywga2V5LCBvbGQsIG5zKSB7XG5cdFx0aWYgKGtleSA9PT0gXCJrZXlcIiB8fCBrZXkgPT09IFwiaXNcIiB8fCBvbGQgPT0gbnVsbCB8fCBpc0xpZmVjeWNsZU1ldGhvZChrZXkpKSByZXR1cm5cblx0XHRpZiAoa2V5WzBdID09PSBcIm9cIiAmJiBrZXlbMV0gPT09IFwiblwiKSB1cGRhdGVFdmVudCh2bm9kZTMsIGtleSwgdW5kZWZpbmVkKVxuXHRcdGVsc2UgaWYgKGtleSA9PT0gXCJzdHlsZVwiKSB1cGRhdGVTdHlsZSh2bm9kZTMuZG9tLCBvbGQsIG51bGwpXG5cdFx0ZWxzZSBpZiAoXG5cdFx0XHRoYXNQcm9wZXJ0eUtleSh2bm9kZTMsIGtleSwgbnMpXG5cdFx0XHQmJiBrZXkgIT09IFwiY2xhc3NOYW1lXCJcblx0XHRcdCYmIGtleSAhPT0gXCJ0aXRsZVwiIC8vIGNyZWF0ZXMgXCJudWxsXCIgYXMgdGl0bGVcblx0XHRcdCYmICEoa2V5ID09PSBcInZhbHVlXCIgJiYgKFxuXHRcdFx0XHR2bm9kZTMudGFnID09PSBcIm9wdGlvblwiXG5cdFx0XHRcdHx8IHZub2RlMy50YWcgPT09IFwic2VsZWN0XCIgJiYgdm5vZGUzLmRvbS5zZWxlY3RlZEluZGV4ID09PSAtMSAmJiB2bm9kZTMuZG9tID09PSBhY3RpdmVFbGVtZW50KClcblx0XHRcdCkpXG5cdFx0XHQmJiAhKHZub2RlMy50YWcgPT09IFwiaW5wdXRcIiAmJiBrZXkgPT09IFwidHlwZVwiKVxuXHRcdCkge1xuXHRcdFx0dm5vZGUzLmRvbVtrZXldID0gbnVsbFxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgbnNMYXN0SW5kZXggPSBrZXkuaW5kZXhPZihcIjpcIilcblx0XHRcdGlmIChuc0xhc3RJbmRleCAhPT0gLTEpIGtleSA9IGtleS5zbGljZShuc0xhc3RJbmRleCArIDEpXG5cdFx0XHRpZiAob2xkICE9PSBmYWxzZSkgdm5vZGUzLmRvbS5yZW1vdmVBdHRyaWJ1dGUoa2V5ID09PSBcImNsYXNzTmFtZVwiID8gXCJjbGFzc1wiIDoga2V5KVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNldExhdGVTZWxlY3RBdHRycyh2bm9kZTMsIGF0dHJzMikge1xuXHRcdGlmIChcInZhbHVlXCIgaW4gYXR0cnMyKSB7XG5cdFx0XHRpZiAoYXR0cnMyLnZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRcdGlmICh2bm9kZTMuZG9tLnNlbGVjdGVkSW5kZXggIT09IC0xKSB2bm9kZTMuZG9tLnZhbHVlID0gbnVsbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIG5vcm1hbGl6ZWQgPSBcIlwiICsgYXR0cnMyLnZhbHVlIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW1wbGljaXQtY29lcmNpb25cblx0XHRcdFx0aWYgKHZub2RlMy5kb20udmFsdWUgIT09IG5vcm1hbGl6ZWQgfHwgdm5vZGUzLmRvbS5zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuXHRcdFx0XHRcdHZub2RlMy5kb20udmFsdWUgPSBub3JtYWxpemVkXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKFwic2VsZWN0ZWRJbmRleFwiIGluIGF0dHJzMikgc2V0QXR0cih2bm9kZTMsIFwic2VsZWN0ZWRJbmRleFwiLCBudWxsLCBhdHRyczIuc2VsZWN0ZWRJbmRleCwgdW5kZWZpbmVkKVxuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlQXR0cnModm5vZGUzLCBvbGQsIGF0dHJzMiwgbnMpIHtcblx0XHRpZiAob2xkICYmIG9sZCA9PT0gYXR0cnMyKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oXCJEb24ndCByZXVzZSBhdHRycyBvYmplY3QsIHVzZSBuZXcgb2JqZWN0IGZvciBldmVyeSByZWRyYXcsIHRoaXMgd2lsbCB0aHJvdyBpbiBuZXh0IG1ham9yXCIpXG5cdFx0fVxuXHRcdGlmIChhdHRyczIgIT0gbnVsbCkge1xuXHRcdFx0Ly8gSWYgeW91IGFzc2lnbiBhbiBpbnB1dCB0eXBlMCB0aGF0IGlzIG5vdCBzdXBwb3J0ZWQgYnkgSUUgMTEgd2l0aCBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24sIGFuIGVycm9yIHdpbGwgb2NjdXIuXG5cdFx0XHQvL1xuXHRcdFx0Ly8gQWxzbywgdGhlIERPTSBkb2VzIHRoaW5ncyB0byBpbnB1dHMgYmFzZWQgb24gdGhlIHZhbHVlLCBzbyBpdCBuZWVkcyBzZXQgZmlyc3QuXG5cdFx0XHQvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9NaXRocmlsSlMvbWl0aHJpbC5qcy9pc3N1ZXMvMjYyMlxuXHRcdFx0aWYgKHZub2RlMy50YWcgPT09IFwiaW5wdXRcIiAmJiBhdHRyczIudHlwZSAhPSBudWxsKSB2bm9kZTMuZG9tLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgYXR0cnMyLnR5cGUpXG5cdFx0XHR2YXIgaXNGaWxlSW5wdXQgPSB2bm9kZTMudGFnID09PSBcImlucHV0XCIgJiYgYXR0cnMyLnR5cGUgPT09IFwiZmlsZVwiXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gYXR0cnMyKSB7XG5cdFx0XHRcdHNldEF0dHIodm5vZGUzLCBrZXksIG9sZCAmJiBvbGRba2V5XSwgYXR0cnMyW2tleV0sIG5zLCBpc0ZpbGVJbnB1dClcblx0XHRcdH1cblx0XHR9XG5cdFx0dmFyIHZhbFxuXHRcdGlmIChvbGQgIT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIG9sZCkge1xuXHRcdFx0XHRpZiAoKCh2YWwgPSBvbGRba2V5XSkgIT0gbnVsbCkgJiYgKGF0dHJzMiA9PSBudWxsIHx8IGF0dHJzMltrZXldID09IG51bGwpKSB7XG5cdFx0XHRcdFx0cmVtb3ZlQXR0cih2bm9kZTMsIGtleSwgdmFsLCBucylcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGlzRm9ybUF0dHJpYnV0ZSh2bm9kZTMsIGF0dHIpIHtcblx0XHRyZXR1cm4gYXR0ciA9PT0gXCJ2YWx1ZVwiIHx8IGF0dHIgPT09IFwiY2hlY2tlZFwiIHx8IGF0dHIgPT09IFwic2VsZWN0ZWRJbmRleFwiIHx8IGF0dHIgPT09IFwic2VsZWN0ZWRcIiAmJiB2bm9kZTMuZG9tID09PSBhY3RpdmVFbGVtZW50KCkgfHwgdm5vZGUzLnRhZ1xuXHRcdFx0PT09IFwib3B0aW9uXCIgJiYgdm5vZGUzLmRvbS5wYXJlbnROb2RlID09PSAkZG9jLmFjdGl2ZUVsZW1lbnRcblx0fVxuXG5cdGZ1bmN0aW9uIGlzTGlmZWN5Y2xlTWV0aG9kKGF0dHIpIHtcblx0XHRyZXR1cm4gYXR0ciA9PT0gXCJvbmluaXRcIiB8fCBhdHRyID09PSBcIm9uY3JlYXRlXCIgfHwgYXR0ciA9PT0gXCJvbnVwZGF0ZVwiIHx8IGF0dHIgPT09IFwib25yZW1vdmVcIiB8fCBhdHRyID09PSBcIm9uYmVmb3JlcmVtb3ZlXCIgfHwgYXR0ciA9PT0gXCJvbmJlZm9yZXVwZGF0ZVwiXG5cdH1cblxuXHRmdW5jdGlvbiBoYXNQcm9wZXJ0eUtleSh2bm9kZTMsIGtleSwgbnMpIHtcblx0XHQvLyBGaWx0ZXIgb3V0IG5hbWVzcGFjZWQga2V5c1xuXHRcdHJldHVybiBucyA9PT0gdW5kZWZpbmVkICYmIChcblx0XHRcdC8vIElmIGl0J3MgYSBjdXN0b20gZWxlbWVudCwganVzdCBrZWVwIGl0LlxuXHRcdFx0dm5vZGUzLnRhZy5pbmRleE9mKFwiLVwiKSA+IC0xIHx8IHZub2RlMy5hdHRycyAhPSBudWxsICYmIHZub2RlMy5hdHRycy5pcyB8fFxuXHRcdFx0Ly8gSWYgaXQncyBhIG5vcm1hbCBlbGVtZW50LCBsZXQncyB0cnkgdG8gYXZvaWQgYSBmZXcgYnJvd3NlciBidWdzLlxuXHRcdFx0a2V5ICE9PSBcImhyZWZcIiAmJiBrZXkgIT09IFwibGlzdFwiICYmIGtleSAhPT0gXCJmb3JtXCIgJiYga2V5ICE9PSBcIndpZHRoXCIgJiYga2V5ICE9PSBcImhlaWdodFwiLy8gJiYga2V5ICE9PSBcInR5cGVcIlxuXHRcdFx0Ly8gRGVmZXIgdGhlIHByb3BlcnR5IGNoZWNrIHVudGlsICphZnRlciogd2UgY2hlY2sgZXZlcnl0aGluZy5cblx0XHQpICYmIGtleSBpbiB2bm9kZTMuZG9tXG5cdH1cblxuXHQvL3N0eWxlXG5cdHZhciB1cHBlcmNhc2VSZWdleCA9IC9bQS1aXS9nXG5cblx0ZnVuY3Rpb24gdG9Mb3dlckNhc2UoY2FwaXRhbCkgeyByZXR1cm4gXCItXCIgKyBjYXBpdGFsLnRvTG93ZXJDYXNlKCkgfVxuXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZUtleShrZXkpIHtcblx0XHRyZXR1cm4ga2V5WzBdID09PSBcIi1cIiAmJiBrZXlbMV0gPT09IFwiLVwiID8ga2V5IDpcblx0XHRcdGtleSA9PT0gXCJjc3NGbG9hdFwiID8gXCJmbG9hdFwiIDpcblx0XHRcdFx0a2V5LnJlcGxhY2UodXBwZXJjYXNlUmVnZXgsIHRvTG93ZXJDYXNlKVxuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlU3R5bGUoZWxlbWVudCwgb2xkLCBzdHlsZSkge1xuXHRcdGlmIChvbGQgPT09IHN0eWxlKSB7XG5cdFx0XHQvLyBTdHlsZXMgYXJlIGVxdWl2YWxlbnQsIGRvIG5vdGhpbmcuXG5cdFx0fSBlbHNlIGlmIChzdHlsZSA9PSBudWxsKSB7XG5cdFx0XHQvLyBOZXcgc3R5bGUgaXMgbWlzc2luZywganVzdCBjbGVhciBpdC5cblx0XHRcdGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IFwiXCJcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBzdHlsZSAhPT0gXCJvYmplY3RcIikge1xuXHRcdFx0Ly8gTmV3IHN0eWxlIGlzIGEgc3RyaW5nLCBsZXQgZW5naW5lIGRlYWwgd2l0aCBwYXRjaGluZy5cblx0XHRcdGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHN0eWxlXG5cdFx0fSBlbHNlIGlmIChvbGQgPT0gbnVsbCB8fCB0eXBlb2Ygb2xkICE9PSBcIm9iamVjdFwiKSB7XG5cdFx0XHQvLyBgb2xkYCBpcyBtaXNzaW5nIG9yIGEgc3RyaW5nLCBgc3R5bGVgIGlzIGFuIG9iamVjdC5cblx0XHRcdGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IFwiXCJcblx0XHRcdC8vIEFkZCBuZXcgc3R5bGUgcHJvcGVydGllc1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHN0eWxlKSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IHN0eWxlW2tleV1cblx0XHRcdFx0aWYgKHZhbHVlICE9IG51bGwpIGVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkobm9ybWFsaXplS2V5KGtleSksIFN0cmluZyh2YWx1ZSkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEJvdGggb2xkICYgbmV3IGFyZSAoZGlmZmVyZW50KSBvYmplY3RzLlxuXHRcdFx0Ly8gVXBkYXRlIHN0eWxlIHByb3BlcnRpZXMgdGhhdCBoYXZlIGNoYW5nZWRcblx0XHRcdGZvciAodmFyIGtleSBpbiBzdHlsZSkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBzdHlsZVtrZXldXG5cdFx0XHRcdGlmICh2YWx1ZSAhPSBudWxsICYmICh2YWx1ZSA9IFN0cmluZyh2YWx1ZSkpICE9PSBTdHJpbmcob2xkW2tleV0pKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShub3JtYWxpemVLZXkoa2V5KSwgdmFsdWUpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vIFJlbW92ZSBzdHlsZSBwcm9wZXJ0aWVzIHRoYXQgbm8gbG9uZ2VyIGV4aXN0XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gb2xkKSB7XG5cdFx0XHRcdGlmIChvbGRba2V5XSAhPSBudWxsICYmIHN0eWxlW2tleV0gPT0gbnVsbCkge1xuXHRcdFx0XHRcdGVsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkobm9ybWFsaXplS2V5KGtleSkpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBIZXJlJ3MgYW4gZXhwbGFuYXRpb24gb2YgaG93IHRoaXMgd29ya3M6XG5cdC8vIDEuIFRoZSBldmVudCBuYW1lcyBhcmUgYWx3YXlzIChieSBkZXNpZ24pIHByZWZpeGVkIGJ5IGBvbmAuXG5cdC8vIDIuIFRoZSBFdmVudExpc3RlbmVyIGludGVyZmFjZSBhY2NlcHRzIGVpdGhlciBhIGZ1bmN0aW9uIG9yIGFuIG9iamVjdFxuXHQvLyAgICB3aXRoIGEgYGhhbmRsZUV2ZW50YCBtZXRob2QuXG5cdC8vIDMuIFRoZSBvYmplY3QgZG9lcyBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYCwgdG8gYXZvaWRcblx0Ly8gICAgYW55IHBvdGVudGlhbCBpbnRlcmZlcmVuY2Ugd2l0aCB0aGF0IChlLmcuIHNldHRlcnMpLlxuXHQvLyA0LiBUaGUgZXZlbnQgbmFtZSBpcyByZW1hcHBlZCB0byB0aGUgaGFuZGxlcjAgYmVmb3JlIGNhbGxpbmcgaXQuXG5cdC8vIDUuIEluIGZ1bmN0aW9uLWJhc2VkIGV2ZW50IGhhbmRsZXJzLCBgZXYudGFyZ2V0ID09PSB0aGlzYC4gV2UgcmVwbGljYXRlXG5cdC8vICAgIHRoYXQgYmVsb3cuXG5cdC8vIDYuIEluIGZ1bmN0aW9uLWJhc2VkIGV2ZW50IGhhbmRsZXJzLCBgcmV0dXJuIGZhbHNlYCBwcmV2ZW50cyB0aGUgZGVmYXVsdFxuXHQvLyAgICBhY3Rpb24gYW5kIHN0b3BzIGV2ZW50IHByb3BhZ2F0aW9uLiBXZSByZXBsaWNhdGUgdGhhdCBiZWxvdy5cblx0ZnVuY3Rpb24gRXZlbnREaWN0KCkge1xuXHRcdC8vIFNhdmUgdGhpcywgc28gdGhlIGN1cnJlbnQgcmVkcmF3IGlzIGNvcnJlY3RseSB0cmFja2VkLlxuXHRcdHRoaXMuXyA9IGN1cnJlbnRSZWRyYXdcblx0fVxuXG5cdEV2ZW50RGljdC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cdEV2ZW50RGljdC5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZXYpIHtcblx0XHR2YXIgaGFuZGxlcjAgPSB0aGlzW1wib25cIiArIGV2LnR5cGVdXG5cdFx0dmFyIHJlc3VsdFxuXHRcdGlmICh0eXBlb2YgaGFuZGxlcjAgPT09IFwiZnVuY3Rpb25cIikgcmVzdWx0ID0gaGFuZGxlcjAuY2FsbChldi5jdXJyZW50VGFyZ2V0LCBldilcblx0XHRlbHNlIGlmICh0eXBlb2YgaGFuZGxlcjAuaGFuZGxlRXZlbnQgPT09IFwiZnVuY3Rpb25cIikgaGFuZGxlcjAuaGFuZGxlRXZlbnQoZXYpXG5cdFx0aWYgKHRoaXMuXyAmJiBldi5yZWRyYXcgIT09IGZhbHNlKSAoMCwgdGhpcy5fKSgpXG5cdFx0aWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcblx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcblx0XHRcdGV2LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0fVxuXHR9XG5cblx0Ly9ldmVudFxuXHRmdW5jdGlvbiB1cGRhdGVFdmVudCh2bm9kZTMsIGtleSwgdmFsdWUpIHtcblx0XHRpZiAodm5vZGUzLmV2ZW50cyAhPSBudWxsKSB7XG5cdFx0XHR2bm9kZTMuZXZlbnRzLl8gPSBjdXJyZW50UmVkcmF3XG5cdFx0XHRpZiAodm5vZGUzLmV2ZW50c1trZXldID09PSB2YWx1ZSkgcmV0dXJuXG5cdFx0XHRpZiAodmFsdWUgIT0gbnVsbCAmJiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSkge1xuXHRcdFx0XHRpZiAodm5vZGUzLmV2ZW50c1trZXldID09IG51bGwpIHZub2RlMy5kb20uYWRkRXZlbnRMaXN0ZW5lcihrZXkuc2xpY2UoMiksIHZub2RlMy5ldmVudHMsIGZhbHNlKVxuXHRcdFx0XHR2bm9kZTMuZXZlbnRzW2tleV0gPSB2YWx1ZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHZub2RlMy5ldmVudHNba2V5XSAhPSBudWxsKSB2bm9kZTMuZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIoa2V5LnNsaWNlKDIpLCB2bm9kZTMuZXZlbnRzLCBmYWxzZSlcblx0XHRcdFx0dm5vZGUzLmV2ZW50c1trZXldID0gdW5kZWZpbmVkXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSAhPSBudWxsICYmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpKSB7XG5cdFx0XHR2bm9kZTMuZXZlbnRzID0gbmV3IEV2ZW50RGljdCgpXG5cdFx0XHR2bm9kZTMuZG9tLmFkZEV2ZW50TGlzdGVuZXIoa2V5LnNsaWNlKDIpLCB2bm9kZTMuZXZlbnRzLCBmYWxzZSlcblx0XHRcdHZub2RlMy5ldmVudHNba2V5XSA9IHZhbHVlXG5cdFx0fVxuXHR9XG5cblx0Ly9saWZlY3ljbGVcblx0ZnVuY3Rpb24gaW5pdExpZmVjeWNsZShzb3VyY2UsIHZub2RlMywgaG9va3MpIHtcblx0XHRpZiAodHlwZW9mIHNvdXJjZS5vbmluaXQgPT09IFwiZnVuY3Rpb25cIikgY2FsbEhvb2suY2FsbChzb3VyY2Uub25pbml0LCB2bm9kZTMpXG5cdFx0aWYgKHR5cGVvZiBzb3VyY2Uub25jcmVhdGUgPT09IFwiZnVuY3Rpb25cIikgaG9va3MucHVzaChjYWxsSG9vay5iaW5kKHNvdXJjZS5vbmNyZWF0ZSwgdm5vZGUzKSlcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUxpZmVjeWNsZShzb3VyY2UsIHZub2RlMywgaG9va3MpIHtcblx0XHRpZiAodHlwZW9mIHNvdXJjZS5vbnVwZGF0ZSA9PT0gXCJmdW5jdGlvblwiKSBob29rcy5wdXNoKGNhbGxIb29rLmJpbmQoc291cmNlLm9udXBkYXRlLCB2bm9kZTMpKVxuXHR9XG5cblx0ZnVuY3Rpb24gc2hvdWxkTm90VXBkYXRlKHZub2RlMywgb2xkKSB7XG5cdFx0ZG8ge1xuXHRcdFx0aWYgKHZub2RlMy5hdHRycyAhPSBudWxsICYmIHR5cGVvZiB2bm9kZTMuYXR0cnMub25iZWZvcmV1cGRhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHR2YXIgZm9yY2UgPSBjYWxsSG9vay5jYWxsKHZub2RlMy5hdHRycy5vbmJlZm9yZXVwZGF0ZSwgdm5vZGUzLCBvbGQpXG5cdFx0XHRcdGlmIChmb3JjZSAhPT0gdW5kZWZpbmVkICYmICFmb3JjZSkgYnJlYWtcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2Ygdm5vZGUzLnRhZyAhPT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygdm5vZGUzLnN0YXRlLm9uYmVmb3JldXBkYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0dmFyIGZvcmNlID0gY2FsbEhvb2suY2FsbCh2bm9kZTMuc3RhdGUub25iZWZvcmV1cGRhdGUsIHZub2RlMywgb2xkKVxuXHRcdFx0XHRpZiAoZm9yY2UgIT09IHVuZGVmaW5lZCAmJiAhZm9yY2UpIGJyZWFrXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9IHdoaWxlIChmYWxzZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG5cdFx0dm5vZGUzLmRvbSA9IG9sZC5kb21cblx0XHR2bm9kZTMuZG9tU2l6ZSA9IG9sZC5kb21TaXplXG5cdFx0dm5vZGUzLmluc3RhbmNlID0gb2xkLmluc3RhbmNlXG5cdFx0Ly8gT25lIHdvdWxkIHRoaW5rIGhhdmluZyB0aGUgYWN0dWFsIGxhdGVzdCBhdHRyaWJ1dGVzIHdvdWxkIGJlIGlkZWFsLFxuXHRcdC8vIGJ1dCBpdCBkb2Vzbid0IGxldCB1cyBwcm9wZXJseSBkaWZmIGJhc2VkIG9uIG91ciBjdXJyZW50IGludGVybmFsXG5cdFx0Ly8gcmVwcmVzZW50YXRpb24uIFdlIGhhdmUgdG8gc2F2ZSBub3Qgb25seSB0aGUgb2xkIERPTSBpbmZvLCBidXQgYWxzb1xuXHRcdC8vIHRoZSBhdHRyaWJ1dGVzIHVzZWQgdG8gY3JlYXRlIGl0LCBhcyB3ZSBkaWZmICp0aGF0Kiwgbm90IGFnYWluc3QgdGhlXG5cdFx0Ly8gRE9NIGRpcmVjdGx5ICh3aXRoIGEgZmV3IGV4Y2VwdGlvbnMgaW4gYHNldEF0dHJgKS4gQW5kLCBvZiBjb3Vyc2UsIHdlXG5cdFx0Ly8gbmVlZCB0byBzYXZlIHRoZSBjaGlsZHJlbjIgYW5kIHRleHQgYXMgdGhleSBhcmUgY29uY2VwdHVhbGx5IG5vdFxuXHRcdC8vIHVubGlrZSBzcGVjaWFsIFwiYXR0cmlidXRlc1wiIGludGVybmFsbHkuXG5cdFx0dm5vZGUzLmF0dHJzID0gb2xkLmF0dHJzXG5cdFx0dm5vZGUzLmNoaWxkcmVuID0gb2xkLmNoaWxkcmVuXG5cdFx0dm5vZGUzLnRleHQgPSBvbGQudGV4dFxuXHRcdHJldHVybiB0cnVlXG5cdH1cblxuXHR2YXIgY3VycmVudERPTVxuXHRyZXR1cm4gZnVuY3Rpb24gKGRvbSwgdm5vZGVzLCByZWRyYXcpIHtcblx0XHRpZiAoIWRvbSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRPTSBlbGVtZW50IGJlaW5nIHJlbmRlcmVkIHRvIGRvZXMgbm90IGV4aXN0LlwiKVxuXHRcdGlmIChjdXJyZW50RE9NICE9IG51bGwgJiYgZG9tLmNvbnRhaW5zKGN1cnJlbnRET00pKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiTm9kZSBpcyBjdXJyZW50bHkgYmVpbmcgcmVuZGVyZWQgdG8gYW5kIHRodXMgaXMgbG9ja2VkLlwiKVxuXHRcdH1cblx0XHR2YXIgcHJldlJlZHJhdyA9IGN1cnJlbnRSZWRyYXdcblx0XHR2YXIgcHJldkRPTSA9IGN1cnJlbnRET01cblx0XHR2YXIgaG9va3MgPSBbXVxuXHRcdHZhciBhY3RpdmUgPSBhY3RpdmVFbGVtZW50KClcblx0XHR2YXIgbmFtZXNwYWNlID0gZG9tLm5hbWVzcGFjZVVSSVxuXHRcdGN1cnJlbnRET00gPSBkb21cblx0XHRjdXJyZW50UmVkcmF3ID0gdHlwZW9mIHJlZHJhdyA9PT0gXCJmdW5jdGlvblwiID8gcmVkcmF3IDogdW5kZWZpbmVkXG5cdFx0dHJ5IHtcblx0XHRcdC8vIEZpcnN0IHRpbWUgcmVuZGVyaW5nIGludG8gYSBub2RlIGNsZWFycyBpdCBvdXRcblx0XHRcdGlmIChkb20udm5vZGVzID09IG51bGwpIGRvbS50ZXh0Q29udGVudCA9IFwiXCJcblx0XHRcdHZub2RlcyA9IFZub2RlLm5vcm1hbGl6ZUNoaWxkcmVuKEFycmF5LmlzQXJyYXkodm5vZGVzKSA/IHZub2RlcyA6IFt2bm9kZXNdKVxuXHRcdFx0dXBkYXRlTm9kZXMoZG9tLCBkb20udm5vZGVzLCB2bm9kZXMsIGhvb2tzLCBudWxsLCBuYW1lc3BhY2UgPT09IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiID8gdW5kZWZpbmVkIDogbmFtZXNwYWNlKVxuXHRcdFx0ZG9tLnZub2RlcyA9IHZub2Rlc1xuXHRcdFx0Ly8gYGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRgIGNhbiByZXR1cm4gbnVsbDogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW50ZXJhY3Rpb24uaHRtbCNkb20tZG9jdW1lbnQtYWN0aXZlZWxlbWVudFxuXHRcdFx0aWYgKGFjdGl2ZSAhPSBudWxsICYmIGFjdGl2ZUVsZW1lbnQoKSAhPT0gYWN0aXZlICYmIHR5cGVvZiBhY3RpdmUuZm9jdXMgPT09IFwiZnVuY3Rpb25cIikgYWN0aXZlLmZvY3VzKClcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaG9va3MubGVuZ3RoOyBpKyspIGhvb2tzW2ldKClcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Y3VycmVudFJlZHJhdyA9IHByZXZSZWRyYXdcblx0XHRcdGN1cnJlbnRET00gPSBwcmV2RE9NXG5cdFx0fVxuXHR9XG59XG52YXIgcmVuZGVyID0gXzEzKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBudWxsKVxudmFyIF8xNiA9IGZ1bmN0aW9uIChyZW5kZXIwLCBzY2hlZHVsZSkge1xuXHR2YXIgc3Vic2NyaXB0aW9ucyA9IFtdXG5cdHZhciBwZW5kaW5nID0gZmFsc2Vcblx0dmFyIG9mZnNldCA9IC0xXG5cblx0ZnVuY3Rpb24gc3luYygpIHtcblx0XHRmb3IgKG9mZnNldCA9IDA7IG9mZnNldCA8IHN1YnNjcmlwdGlvbnMubGVuZ3RoOyBvZmZzZXQgKz0gMikge1xuXHRcdFx0dHJ5IHsgcmVuZGVyMChzdWJzY3JpcHRpb25zW29mZnNldF0sIFZub2RlKHN1YnNjcmlwdGlvbnNbb2Zmc2V0ICsgMV0pLCByZWRyYXcpIH1cblx0XHRcdGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuXHRcdH1cblx0XHRvZmZzZXQgPSAtMVxuXHR9XG5cblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xuXHRcdGlmICghcGVuZGluZykge1xuXHRcdFx0cGVuZGluZyA9IHRydWVcblx0XHRcdHNjaGVkdWxlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0cGVuZGluZyA9IGZhbHNlXG5cdFx0XHRcdHN5bmMoKVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRyZWRyYXcuc3luYyA9IHN5bmNcblxuXHRmdW5jdGlvbiBtb3VudChyb290LCBjb21wb25lbnQpIHtcblx0XHRpZiAoY29tcG9uZW50ICE9IG51bGwgJiYgY29tcG9uZW50LnZpZXcgPT0gbnVsbCAmJiB0eXBlb2YgY29tcG9uZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJtLm1vdW50IGV4cGVjdHMgYSBjb21wb25lbnQsIG5vdCBhIHZub2RlLlwiKVxuXHRcdH1cblx0XHR2YXIgaW5kZXggPSBzdWJzY3JpcHRpb25zLmluZGV4T2Yocm9vdClcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0c3Vic2NyaXB0aW9ucy5zcGxpY2UoaW5kZXgsIDIpXG5cdFx0XHRpZiAoaW5kZXggPD0gb2Zmc2V0KSBvZmZzZXQgLT0gMlxuXHRcdFx0cmVuZGVyMChyb290LCBbXSlcblx0XHR9XG5cdFx0aWYgKGNvbXBvbmVudCAhPSBudWxsKSB7XG5cdFx0XHRzdWJzY3JpcHRpb25zLnB1c2gocm9vdCwgY29tcG9uZW50KVxuXHRcdFx0cmVuZGVyMChyb290LCBWbm9kZShjb21wb25lbnQpLCByZWRyYXcpXG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHttb3VudDogbW91bnQsIHJlZHJhdzogcmVkcmF3fVxufVxudmFyIG1vdW50UmVkcmF3MCA9IF8xNihyZW5kZXIsIHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09IFwidW5kZWZpbmVkXCIgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgOiBudWxsKVxuIGV4cG9ydCB2YXIgYnVpbGRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcblx0aWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpICE9PSBcIltvYmplY3QgT2JqZWN0XVwiKSByZXR1cm4gXCJcIlxuXHR2YXIgYXJncyA9IFtdXG5cdGZvciAodmFyIGtleTIgaW4gb2JqZWN0KSB7XG5cdFx0ZGVzdHJ1Y3R1cmUoa2V5Miwgb2JqZWN0W2tleTJdKVxuXHR9XG5cdHJldHVybiBhcmdzLmpvaW4oXCImXCIpXG5cblx0ZnVuY3Rpb24gZGVzdHJ1Y3R1cmUoa2V5MiwgdmFsdWUxKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUxKSkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZTEubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZGVzdHJ1Y3R1cmUoa2V5MiArIFwiW1wiICsgaSArIFwiXVwiLCB2YWx1ZTFbaV0pXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUxKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuXHRcdFx0Zm9yICh2YXIgaSBpbiB2YWx1ZTEpIHtcblx0XHRcdFx0ZGVzdHJ1Y3R1cmUoa2V5MiArIFwiW1wiICsgaSArIFwiXVwiLCB2YWx1ZTFbaV0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2UgYXJncy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkyKSArICh2YWx1ZTEgIT0gbnVsbCAmJiB2YWx1ZTEgIT09IFwiXCIgPyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZTEpIDogXCJcIikpXG5cdH1cbn1cbi8vIFRoaXMgZXhpc3RzIHNvIEknbTUgb25seSBzYXZpbmcgaXQgb25jZS5cbnZhciBhc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHRmb3IgKHZhciBrZXkzIGluIHNvdXJjZSkge1xuXHRcdGlmIChoYXNPd24uY2FsbChzb3VyY2UsIGtleTMpKSB0YXJnZXRba2V5M10gPSBzb3VyY2Vba2V5M11cblx0fVxufVxuLy8gUmV0dXJucyBgcGF0aGAgZnJvbSBgdGVtcGxhdGVgICsgYHBhcmFtc2BcbnZhciBidWlsZFBhdGhuYW1lID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBwYXJhbXMpIHtcblx0aWYgKCgvOihbXlxcL1xcLi1dKykoXFwuezN9KT86LykudGVzdCh0ZW1wbGF0ZSkpIHtcblx0XHR0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJUZW1wbGF0ZSBwYXJhbWV0ZXIgbmFtZXMgbXVzdCBiZSBzZXBhcmF0ZWQgYnkgZWl0aGVyIGEgJy8nLCAnLScsIG9yICcuJy5cIilcblx0fVxuXHRpZiAocGFyYW1zID09IG51bGwpIHJldHVybiB0ZW1wbGF0ZVxuXHR2YXIgcXVlcnlJbmRleCA9IHRlbXBsYXRlLmluZGV4T2YoXCI/XCIpXG5cdHZhciBoYXNoSW5kZXggPSB0ZW1wbGF0ZS5pbmRleE9mKFwiI1wiKVxuXHR2YXIgcXVlcnlFbmQgPSBoYXNoSW5kZXggPCAwID8gdGVtcGxhdGUubGVuZ3RoIDogaGFzaEluZGV4XG5cdHZhciBwYXRoRW5kID0gcXVlcnlJbmRleCA8IDAgPyBxdWVyeUVuZCA6IHF1ZXJ5SW5kZXhcblx0dmFyIHBhdGggPSB0ZW1wbGF0ZS5zbGljZSgwLCBwYXRoRW5kKVxuXHR2YXIgcXVlcnkgPSB7fVxuXHRhc3NpZ24ocXVlcnksIHBhcmFtcylcblx0dmFyIHJlc29sdmVkID0gcGF0aC5yZXBsYWNlKC86KFteXFwvXFwuLV0rKShcXC57M30pPy9nLCBmdW5jdGlvbiAobTQsIGtleTEsIHZhcmlhZGljKSB7XG5cdFx0ZGVsZXRlIHF1ZXJ5W2tleTFdXG5cdFx0Ly8gSWYgbm8gc3VjaCBwYXJhbWV0ZXIgZXhpc3RzLCBkb24ndCBpbnRlcnBvbGF0ZSBpdC5cblx0XHRpZiAocGFyYW1zW2tleTFdID09IG51bGwpIHJldHVybiBtNFxuXHRcdC8vIEVzY2FwZSBub3JtYWwgcGFyYW1ldGVycywgYnV0IG5vdCB2YXJpYWRpYyBvbmVzLlxuXHRcdHJldHVybiB2YXJpYWRpYyA/IHBhcmFtc1trZXkxXSA6IGVuY29kZVVSSUNvbXBvbmVudChTdHJpbmcocGFyYW1zW2tleTFdKSlcblx0fSlcblx0Ly8gSW4gY2FzZSB0aGUgdGVtcGxhdGUgc3Vic3RpdHV0aW9uIGFkZHMgbmV3IHF1ZXJ5L2hhc2ggcGFyYW1ldGVycy5cblx0dmFyIG5ld1F1ZXJ5SW5kZXggPSByZXNvbHZlZC5pbmRleE9mKFwiP1wiKVxuXHR2YXIgbmV3SGFzaEluZGV4ID0gcmVzb2x2ZWQuaW5kZXhPZihcIiNcIilcblx0dmFyIG5ld1F1ZXJ5RW5kID0gbmV3SGFzaEluZGV4IDwgMCA/IHJlc29sdmVkLmxlbmd0aCA6IG5ld0hhc2hJbmRleFxuXHR2YXIgbmV3UGF0aEVuZCA9IG5ld1F1ZXJ5SW5kZXggPCAwID8gbmV3UXVlcnlFbmQgOiBuZXdRdWVyeUluZGV4XG5cdHZhciByZXN1bHQwID0gcmVzb2x2ZWQuc2xpY2UoMCwgbmV3UGF0aEVuZClcblx0aWYgKHF1ZXJ5SW5kZXggPj0gMCkgcmVzdWx0MCArPSB0ZW1wbGF0ZS5zbGljZShxdWVyeUluZGV4LCBxdWVyeUVuZClcblx0aWYgKG5ld1F1ZXJ5SW5kZXggPj0gMCkgcmVzdWx0MCArPSAocXVlcnlJbmRleCA8IDAgPyBcIj9cIiA6IFwiJlwiKSArIHJlc29sdmVkLnNsaWNlKG5ld1F1ZXJ5SW5kZXgsIG5ld1F1ZXJ5RW5kKVxuXHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKHF1ZXJ5KVxuXHRpZiAocXVlcnlzdHJpbmcpIHJlc3VsdDAgKz0gKHF1ZXJ5SW5kZXggPCAwICYmIG5ld1F1ZXJ5SW5kZXggPCAwID8gXCI/XCIgOiBcIiZcIikgKyBxdWVyeXN0cmluZ1xuXHRpZiAoaGFzaEluZGV4ID49IDApIHJlc3VsdDAgKz0gdGVtcGxhdGUuc2xpY2UoaGFzaEluZGV4KVxuXHRpZiAobmV3SGFzaEluZGV4ID49IDApIHJlc3VsdDAgKz0gKGhhc2hJbmRleCA8IDAgPyBcIlwiIDogXCImXCIpICsgcmVzb2x2ZWQuc2xpY2UobmV3SGFzaEluZGV4KVxuXHRyZXR1cm4gcmVzdWx0MFxufVxudmFyIG1vdW50UmVkcmF3ID0gbW91bnRSZWRyYXcwXG52YXIgbSA9IGZ1bmN0aW9uIG0oKSB7IHJldHVybiBoeXBlcnNjcmlwdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIH1cbm0ubSA9IGh5cGVyc2NyaXB0XG5tLnRydXN0ID0gaHlwZXJzY3JpcHQudHJ1c3Rcbm0uZnJhZ21lbnQgPSBoeXBlcnNjcmlwdC5mcmFnbWVudFxubS5GcmFnbWVudCA9IFwiW1wiXG5tLm1vdW50ID0gbW91bnRSZWRyYXcubW91bnRcbnZhciBtNiA9IGh5cGVyc2NyaXB0XG5cbmZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFNhdmUwKHN0cikge1xuXHR0cnkge1xuXHRcdHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRyZXR1cm4gc3RyXG5cdH1cbn1cblxuZXhwb3J0IHZhciBwYXJzZVF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKHN0cmluZykge1xuXHRpZiAoc3RyaW5nID09PSBcIlwiIHx8IHN0cmluZyA9PSBudWxsKSByZXR1cm4ge31cblx0aWYgKHN0cmluZy5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHJpbmcgPSBzdHJpbmcuc2xpY2UoMSlcblx0dmFyIGVudHJpZXMgPSBzdHJpbmcuc3BsaXQoXCImXCIpLCBjb3VudGVycyA9IHt9LCBkYXRhMCA9IHt9XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBlbnRyeSA9IGVudHJpZXNbaV0uc3BsaXQoXCI9XCIpXG5cdFx0dmFyIGtleTUgPSBkZWNvZGVVUklDb21wb25lbnRTYXZlMChlbnRyeVswXSlcblx0XHR2YXIgdmFsdWUyID0gZW50cnkubGVuZ3RoID09PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50U2F2ZTAoZW50cnlbMV0pIDogXCJcIlxuXHRcdGlmICh2YWx1ZTIgPT09IFwidHJ1ZVwiKSB2YWx1ZTIgPSB0cnVlXG5cdFx0ZWxzZSBpZiAodmFsdWUyID09PSBcImZhbHNlXCIpIHZhbHVlMiA9IGZhbHNlXG5cdFx0dmFyIGxldmVscyA9IGtleTUuc3BsaXQoL1xcXVxcWz98XFxbLylcblx0XHR2YXIgY3Vyc29yID0gZGF0YTBcblx0XHRpZiAoa2V5NS5pbmRleE9mKFwiW1wiKSA+IC0xKSBsZXZlbHMucG9wKClcblx0XHRmb3IgKHZhciBqMCA9IDA7IGowIDwgbGV2ZWxzLmxlbmd0aDsgajArKykge1xuXHRcdFx0dmFyIGxldmVsID0gbGV2ZWxzW2owXSwgbmV4dExldmVsID0gbGV2ZWxzW2owICsgMV1cblx0XHRcdHZhciBpc051bWJlciA9IG5leHRMZXZlbCA9PSBcIlwiIHx8ICFpc05hTihwYXJzZUludChuZXh0TGV2ZWwsIDEwKSlcblx0XHRcdGlmIChsZXZlbCA9PT0gXCJcIikge1xuXHRcdFx0XHR2YXIga2V5NSA9IGxldmVscy5zbGljZSgwLCBqMCkuam9pbigpXG5cdFx0XHRcdGlmIChjb3VudGVyc1trZXk1XSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0Y291bnRlcnNba2V5NV0gPSBBcnJheS5pc0FycmF5KGN1cnNvcikgPyBjdXJzb3IubGVuZ3RoIDogMFxuXHRcdFx0XHR9XG5cdFx0XHRcdGxldmVsID0gY291bnRlcnNba2V5NV0rK1xuXHRcdFx0fVxuXHRcdFx0Ly8gRGlzYWxsb3cgZGlyZWN0IHByb3RvdHlwZSBwb2xsdXRpb25cblx0XHRcdGVsc2UgaWYgKGxldmVsID09PSBcIl9fcHJvdG9fX1wiKSBicmVha1xuXHRcdFx0aWYgKGowID09PSBsZXZlbHMubGVuZ3RoIC0gMSkgY3Vyc29yW2xldmVsXSA9IHZhbHVlMlxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIFJlYWQgb3duIHByb3BlcnRpZXMgZXhjbHVzaXZlbHkgdG8gZGlzYWxsb3cgaW5kaXJlY3Rcblx0XHRcdFx0Ly8gcHJvdG90eXBlIHBvbGx1dGlvblxuXHRcdFx0XHR2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoY3Vyc29yLCBsZXZlbClcblx0XHRcdFx0aWYgKGRlc2MgIT0gbnVsbCkgZGVzYyA9IGRlc2MudmFsdWVcblx0XHRcdFx0aWYgKGRlc2MgPT0gbnVsbCkgY3Vyc29yW2xldmVsXSA9IGRlc2MgPSBpc051bWJlciA/IFtdIDoge31cblx0XHRcdFx0Y3Vyc29yID0gZGVzY1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gZGF0YTBcbn1cbi8vIFJldHVybnMgYHtwYXRoMSwgcGFyYW1zfWAgZnJvbSBgdXJsYFxudmFyIHBhcnNlUGF0aG5hbWUgPSBmdW5jdGlvbiAodXJsKSB7XG5cdHZhciBxdWVyeUluZGV4MCA9IHVybC5pbmRleE9mKFwiP1wiKVxuXHR2YXIgaGFzaEluZGV4MCA9IHVybC5pbmRleE9mKFwiI1wiKVxuXHR2YXIgcXVlcnlFbmQwID0gaGFzaEluZGV4MCA8IDAgPyB1cmwubGVuZ3RoIDogaGFzaEluZGV4MFxuXHR2YXIgcGF0aEVuZDAgPSBxdWVyeUluZGV4MCA8IDAgPyBxdWVyeUVuZDAgOiBxdWVyeUluZGV4MFxuXHR2YXIgcGF0aDEgPSB1cmwuc2xpY2UoMCwgcGF0aEVuZDApLnJlcGxhY2UoL1xcL3syLH0vZywgXCIvXCIpXG5cdGlmICghcGF0aDEpIHBhdGgxID0gXCIvXCJcblx0ZWxzZSB7XG5cdFx0aWYgKHBhdGgxWzBdICE9PSBcIi9cIikgcGF0aDEgPSBcIi9cIiArIHBhdGgxXG5cdFx0aWYgKHBhdGgxLmxlbmd0aCA+IDEgJiYgcGF0aDFbcGF0aDEubGVuZ3RoIC0gMV0gPT09IFwiL1wiKSBwYXRoMSA9IHBhdGgxLnNsaWNlKDAsIC0xKVxuXHR9XG5cdHJldHVybiB7XG5cdFx0cGF0aDogcGF0aDEsXG5cdFx0cGFyYW1zOiBxdWVyeUluZGV4MCA8IDBcblx0XHRcdD8ge31cblx0XHRcdDogcGFyc2VRdWVyeVN0cmluZyh1cmwuc2xpY2UocXVlcnlJbmRleDAgKyAxLCBxdWVyeUVuZDApKSxcblx0fVxufVxuLy8gQ29tcGlsZXMgYSB0ZW1wbGF0ZSBpbnRvIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHJlc29sdmVkMCBwYXRoMiAod2l0aG91dCBxdWVyeTBcbi8vIHN0cmluZ3MpIGFuZCByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSB0ZW1wbGF0ZSBwYXJhbWV0ZXJzIHdpdGggdGhlaXJcbi8vIHBhcnNlZCB2YWx1ZXMuIFRoaXMgZXhwZWN0cyB0aGUgaW5wdXQgb2YgdGhlIGNvbXBpbGVkMCB0ZW1wbGF0ZSB0byBiZSB0aGVcbi8vIG91dHB1dCBvZiBgcGFyc2VQYXRobmFtZWAuIE5vdGUgdGhhdCBpdCBkb2VzICpub3QqIHJlbW92ZSBxdWVyeTAgcGFyYW1ldGVyc1xuLy8gc3BlY2lmaWVkIGluIHRoZSB0ZW1wbGF0ZS5cbnZhciBjb21waWxlVGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGUpIHtcblx0dmFyIHRlbXBsYXRlRGF0YSA9IHBhcnNlUGF0aG5hbWUodGVtcGxhdGUpXG5cdHZhciB0ZW1wbGF0ZUtleXMgPSBPYmplY3Qua2V5cyh0ZW1wbGF0ZURhdGEucGFyYW1zKVxuXHR2YXIga2V5cyA9IFtdXG5cdHZhciByZWdleHAgPSBuZXcgUmVnRXhwKFwiXlwiICsgdGVtcGxhdGVEYXRhLnBhdGgucmVwbGFjZShcblx0XHQvLyBJIGVzY2FwZSBsaXRlcmFsIHRleHQgc28gcGVvcGxlIGNhbiB1c2UgdGhpbmdzIGxpa2UgYDpmaWxlLjpleHRgIG9yXG5cdFx0Ly8gYDpsYW5nLTpsb2NhbGVgIGluIHJvdXRlcy4gVGhpcyBpczIgYWxsIG1lcmdlZCBpbnRvIG9uZSBwYXNzIHNvIElcblx0XHQvLyBkb24ndCBhbHNvIGFjY2lkZW50YWxseSBlc2NhcGUgYC1gIGFuZCBtYWtlIGl0IGhhcmRlciB0byBkZXRlY3QgaXQgdG9cblx0XHQvLyBiYW4gaXQgZnJvbSB0ZW1wbGF0ZSBwYXJhbWV0ZXJzLlxuXHRcdC86KFteXFwvLi1dKykoXFwuezN9fFxcLig/IVxcLil8LSk/fFtcXFxcXiQqKy4oKXxcXFtcXF17fV0vZyxcblx0XHRmdW5jdGlvbiAobTcsIGtleTYsIGV4dHJhKSB7XG5cdFx0XHRpZiAoa2V5NiA9PSBudWxsKSByZXR1cm4gXCJcXFxcXCIgKyBtN1xuXHRcdFx0a2V5cy5wdXNoKHtrOiBrZXk2LCByOiBleHRyYSA9PT0gXCIuLi5cIn0pXG5cdFx0XHRpZiAoZXh0cmEgPT09IFwiLi4uXCIpIHJldHVybiBcIiguKilcIlxuXHRcdFx0aWYgKGV4dHJhID09PSBcIi5cIikgcmV0dXJuIFwiKFteL10rKVxcXFwuXCJcblx0XHRcdHJldHVybiBcIihbXi9dKylcIiArIChleHRyYSB8fCBcIlwiKVxuXHRcdH1cblx0KSArIFwiJFwiKVxuXHRyZXR1cm4gZnVuY3Rpb24gKGRhdGExKSB7XG5cdFx0Ly8gRmlyc3QsIGNoZWNrIHRoZSBwYXJhbXMuIFVzdWFsbHksIHRoZXJlIGlzbid0IGFueSwgYW5kIGl0J3MganVzdFxuXHRcdC8vIGNoZWNraW5nIGEgc3RhdGljIHNldC5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRlbXBsYXRlS2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHRlbXBsYXRlRGF0YS5wYXJhbXNbdGVtcGxhdGVLZXlzW2ldXSAhPT0gZGF0YTEucGFyYW1zW3RlbXBsYXRlS2V5c1tpXV0pIHJldHVybiBmYWxzZVxuXHRcdH1cblx0XHQvLyBJZiBubyBpbnRlcnBvbGF0aW9ucyBleGlzdCwgbGV0J3Mgc2tpcCBhbGwgdGhlIGNlcmVtb255XG5cdFx0aWYgKCFrZXlzLmxlbmd0aCkgcmV0dXJuIHJlZ2V4cC50ZXN0KGRhdGExLnBhdGgpXG5cdFx0dmFyIHZhbHVlcyA9IHJlZ2V4cC5leGVjKGRhdGExLnBhdGgpXG5cdFx0aWYgKHZhbHVlcyA9PSBudWxsKSByZXR1cm4gZmFsc2Vcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGRhdGExLnBhcmFtc1trZXlzW2ldLmtdID0ga2V5c1tpXS5yID8gdmFsdWVzW2kgKyAxXSA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbaSArIDFdKVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG59XG4vLyBOb3RlOiB0aGlzIGlzMyBtaWxkbHkgcGVyZi1zZW5zaXRpdmUuXG4vL1xuLy8gSXQgZG9lcyAqbm90KiB1c2UgYGRlbGV0ZWAgLSBkeW5hbWljIGBkZWxldGVgcyB1c3VhbGx5IGNhdXNlIG9iamVjdHMgdG8gYmFpbFxuLy8gb3V0IGludG8gZGljdGlvbmFyeSBtb2RlIGFuZCBqdXN0IGdlbmVyYWxseSBjYXVzZSBhIGJ1bmNoIG9mIG9wdGltaXphdGlvblxuLy8gaXNzdWVzIHdpdGhpbiBlbmdpbmVzLlxuLy9cbi8vIElkZWFsbHksIEkgd291bGQndmUgcHJlZmVycmVkIHRvIGRvIHRoaXMsIGlmIGl0IHdlcmVuJ3QgZm9yIHRoZSBvcHRpbWl6YXRpb25cbi8vIGlzc3Vlczpcbi8vXG4vLyBgYGBqc1xuLy8gY29uc3QgaGFzT3duID0gaGFzT3duXG4vLyBjb25zdCBtYWdpYyA9IFtcbi8vICAgICBcImtleVwiLCBcIm9uaW5pdFwiLCBcIm9uY3JlYXRlXCIsIFwib25iZWZvcmV1cGRhdGVcIiwgXCJvbnVwZGF0ZVwiLFxuLy8gICAgIFwib25iZWZvcmVyZW1vdmVcIiwgXCJvbnJlbW92ZVwiLFxuLy8gXVxuLy8gdmFyIGNlbnNvciA9IChhdHRyczQsIGV4dHJhcykgPT4ge1xuLy8gICAgIGNvbnN0IHJlc3VsdDIgPSBPYmplY3QuYXNzaWduMChPYmplY3QuY3JlYXRlKG51bGwpLCBhdHRyczQpXG4vLyAgICAgZm9yIChjb25zdCBrZXk3IG9mIG1hZ2ljKSBkZWxldGUgcmVzdWx0MltrZXk3XVxuLy8gICAgIGlmIChleHRyYXMgIT0gbnVsbCkgZm9yIChjb25zdCBrZXk3IG9mIGV4dHJhcykgZGVsZXRlIHJlc3VsdDJba2V5N11cbi8vICAgICByZXR1cm4gcmVzdWx0MlxuLy8gfVxuLy8gYGBgXG4vLyBXb3JkcyBpbiBSZWdFeHAgbGl0ZXJhbHMgYXJlIHNvbWV0aW1lcyBtYW5nbGVkIGluY29ycmVjdGx5IGJ5IHRoZSBpbnRlcm5hbCBidW5kbGVyLCBzbyB1c2UgUmVnRXhwKCkuXG52YXIgbWFnaWMgPSBuZXcgUmVnRXhwKFwiXig/OmtleXxvbmluaXR8b25jcmVhdGV8b25iZWZvcmV1cGRhdGV8b251cGRhdGV8b25iZWZvcmVyZW1vdmV8b25yZW1vdmUpJFwiKVxudmFyIGNlbnNvciA9IGZ1bmN0aW9uIChhdHRyczQsIGV4dHJhcykge1xuXHR2YXIgcmVzdWx0MiA9IHt9XG5cdGlmIChleHRyYXMgIT0gbnVsbCkge1xuXHRcdGZvciAodmFyIGtleTcgaW4gYXR0cnM0KSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoYXR0cnM0LCBrZXk3KSAmJiAhbWFnaWMudGVzdChrZXk3KSAmJiBleHRyYXMuaW5kZXhPZihrZXk3KSA8IDApIHtcblx0XHRcdFx0cmVzdWx0MltrZXk3XSA9IGF0dHJzNFtrZXk3XVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKHZhciBrZXk3IGluIGF0dHJzNCkge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKGF0dHJzNCwga2V5NykgJiYgIW1hZ2ljLnRlc3Qoa2V5NykpIHtcblx0XHRcdFx0cmVzdWx0MltrZXk3XSA9IGF0dHJzNFtrZXk3XVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0MlxufVxudmFyIHNlbnRpbmVsMCA9IHt9XG5cbmZ1bmN0aW9uIGRlY29kZVVSSUNvbXBvbmVudFNhdmUoY29tcG9uZW50KSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChjb21wb25lbnQpXG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gY29tcG9uZW50XG5cdH1cbn1cblxudmFyIF8yOCA9IGZ1bmN0aW9uICgkd2luZG93LCBtb3VudFJlZHJhdzAwKSB7XG5cdHZhciBjYWxsQXN5bmMwID0gJHdpbmRvdyA9PSBudWxsXG5cdFx0Ly8gSW4gY2FzZSBNaXRocmlsLmpzJyBsb2FkZWQgZ2xvYmFsbHkgd2l0aG91dCB0aGUgRE9NLCBsZXQncyBub3QgYnJlYWtcblx0XHQ/IG51bGxcblx0XHQ6IHR5cGVvZiAkd2luZG93LnNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gJHdpbmRvdy5zZXRJbW1lZGlhdGUgOiAkd2luZG93LnNldFRpbWVvdXRcblx0dmFyIHAgPSBQcm9taXNlLnJlc29sdmUoKVxuXHR2YXIgc2NoZWR1bGVkID0gZmFsc2Vcblx0Ly8gc3RhdGUgPT09IDA6IGluaXRcblx0Ly8gc3RhdGUgPT09IDE6IHNjaGVkdWxlZFxuXHQvLyBzdGF0ZSA9PT0gMjogZG9uZVxuXHR2YXIgcmVhZHkgPSBmYWxzZVxuXHR2YXIgc3RhdGUgPSAwXG5cdHZhciBjb21waWxlZCwgZmFsbGJhY2tSb3V0ZVxuXHR2YXIgY3VycmVudFJlc29sdmVyID0gc2VudGluZWwwLCBjb21wb25lbnQsIGF0dHJzMywgY3VycmVudFBhdGgsIGxhc3RVcGRhdGVcblx0dmFyIFJvdXRlclJvb3QgPSB7XG5cdFx0b25iZWZvcmV1cGRhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHN0YXRlID0gc3RhdGUgPyAyIDogMVxuXHRcdFx0cmV0dXJuICEoIXN0YXRlIHx8IHNlbnRpbmVsMCA9PT0gY3VycmVudFJlc29sdmVyKVxuXHRcdH0sXG5cdFx0b25yZW1vdmU6IGZ1bmN0aW9uICgpIHtcblx0XHRcdCR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsIGZpcmVBc3luYywgZmFsc2UpXG5cdFx0XHQkd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsIHJlc29sdmVSb3V0ZSwgZmFsc2UpXG5cdFx0fSxcblx0XHR2aWV3OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIXN0YXRlIHx8IHNlbnRpbmVsMCA9PT0gY3VycmVudFJlc29sdmVyKSByZXR1cm5cblx0XHRcdC8vIFdyYXAgaW4gYSBmcmFnbWVudDAgdG8gcHJlc2VydmUgZXhpc3Rpbmcga2V5NCBzZW1hbnRpY3Ncblx0XHRcdHZhciB2bm9kZTUgPSBbVm5vZGUoY29tcG9uZW50LCBhdHRyczMua2V5LCBhdHRyczMpXVxuXHRcdFx0aWYgKGN1cnJlbnRSZXNvbHZlcikgdm5vZGU1ID0gY3VycmVudFJlc29sdmVyLnJlbmRlcih2bm9kZTVbMF0pXG5cdFx0XHRyZXR1cm4gdm5vZGU1XG5cdFx0fSxcblx0fVxuXHR2YXIgU0tJUCA9IHJvdXRlLlNLSVAgPSB7fVxuXG5cdGZ1bmN0aW9uIHJlc29sdmVSb3V0ZSgpIHtcblx0XHRzY2hlZHVsZWQgPSBmYWxzZVxuXHRcdC8vIENvbnNpZGVyIHRoZSBwYXRobmFtZSBob2xpc3RpY2FsbHkuIFRoZSBwcmVmaXggbWlnaHQgZXZlbiBiZSBpbnZhbGlkLFxuXHRcdC8vIGJ1dCB0aGF0J3Mgbm90IG91ciBwcm9ibGVtLlxuXHRcdHZhciBwcmVmaXggPSAkd2luZG93LmxvY2F0aW9uLmhhc2hcblx0XHRpZiAocm91dGUucHJlZml4WzBdICE9PSBcIiNcIikge1xuXHRcdFx0cHJlZml4ID0gJHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyBwcmVmaXhcblx0XHRcdGlmIChyb3V0ZS5wcmVmaXhbMF0gIT09IFwiP1wiKSB7XG5cdFx0XHRcdHByZWZpeCA9ICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBwcmVmaXhcblx0XHRcdFx0aWYgKHByZWZpeFswXSAhPT0gXCIvXCIpIHByZWZpeCA9IFwiL1wiICsgcHJlZml4XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIFRoaXMgc2VlbWluZ2x5IHVzZWxlc3MgYC5jb25jYXQoKWAgc3BlZWRzIHVwIHRoZSB0ZXN0cyBxdWl0ZSBhIGJpdCxcblx0XHQvLyBzaW5jZSB0aGUgcmVwcmVzZW50YXRpb24gaXMxIGNvbnNpc3RlbnRseSBhIHJlbGF0aXZlbHkgcG9vcmx5XG5cdFx0Ly8gb3B0aW1pemVkIGNvbnMgc3RyaW5nLlxuXHRcdHZhciBwYXRoMCA9IHByZWZpeC5jb25jYXQoKVxuXHRcdFx0XHRcdFx0ICAucmVwbGFjZSgvKD86JVthLWY4OV1bYS1mMC05XSkrL2dpbSwgZGVjb2RlVVJJQ29tcG9uZW50U2F2ZSlcblx0XHRcdFx0XHRcdCAgLnNsaWNlKHJvdXRlLnByZWZpeC5sZW5ndGgpXG5cdFx0dmFyIGRhdGEgPSBwYXJzZVBhdGhuYW1lKHBhdGgwKVxuXHRcdGFzc2lnbihkYXRhLnBhcmFtcywgJHdpbmRvdy5oaXN0b3J5LnN0YXRlKVxuXG5cdFx0ZnVuY3Rpb24gcmVqZWN0KGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSlcblx0XHRcdHNldFBhdGgoZmFsbGJhY2tSb3V0ZSwgbnVsbCwge3JlcGxhY2U6IHRydWV9KVxuXHRcdH1cblxuXHRcdGxvb3AoMClcblxuXHRcdGZ1bmN0aW9uIGxvb3AoaSkge1xuXHRcdFx0Ly8gc3RhdGUgPT09IDA6IGluaXRcblx0XHRcdC8vIHN0YXRlID09PSAxOiBzY2hlZHVsZWRcblx0XHRcdC8vIHN0YXRlID09PSAyOiBkb25lXG5cdFx0XHRmb3IgKDsgaSA8IGNvbXBpbGVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChjb21waWxlZFtpXS5jaGVjayhkYXRhKSkge1xuXHRcdFx0XHRcdHZhciBwYXlsb2FkID0gY29tcGlsZWRbaV0uY29tcG9uZW50XG5cdFx0XHRcdFx0dmFyIG1hdGNoZWRSb3V0ZSA9IGNvbXBpbGVkW2ldLnJvdXRlXG5cdFx0XHRcdFx0dmFyIGxvY2FsQ29tcCA9IHBheWxvYWRcblx0XHRcdFx0XHR2YXIgdXBkYXRlID0gbGFzdFVwZGF0ZSA9IGZ1bmN0aW9uIChjb21wKSB7XG5cdFx0XHRcdFx0XHRpZiAodXBkYXRlICE9PSBsYXN0VXBkYXRlKSByZXR1cm5cblx0XHRcdFx0XHRcdGlmIChjb21wID09PSBTS0lQKSByZXR1cm4gbG9vcChpICsgMSlcblx0XHRcdFx0XHRcdGNvbXBvbmVudCA9IGNvbXAgIT0gbnVsbCAmJiAodHlwZW9mIGNvbXAudmlldyA9PT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBjb21wID09PSBcImZ1bmN0aW9uXCIpID8gY29tcCA6IFwiZGl2XCJcblx0XHRcdFx0XHRcdGF0dHJzMyA9IGRhdGEucGFyYW1zLCBjdXJyZW50UGF0aCA9IHBhdGgwLCBsYXN0VXBkYXRlID0gbnVsbFxuXHRcdFx0XHRcdFx0Y3VycmVudFJlc29sdmVyID0gcGF5bG9hZC5yZW5kZXIgPyBwYXlsb2FkIDogbnVsbFxuXHRcdFx0XHRcdFx0aWYgKHN0YXRlID09PSAyKSBtb3VudFJlZHJhdzAwLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0c3RhdGUgPSAyXG5cdFx0XHRcdFx0XHRcdG1vdW50UmVkcmF3MDAucmVkcmF3LnN5bmMoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBUaGVyZSdzIG5vIHVuZGVyc3RhdGluZyBob3cgbXVjaCBJICp3aXNoKiBJIGNvdWxkXG5cdFx0XHRcdFx0Ly8gdXNlIGBhc3luY2AvYGF3YWl0YCBoZXJlLi4uXG5cdFx0XHRcdFx0aWYgKHBheWxvYWQudmlldyB8fCB0eXBlb2YgcGF5bG9hZCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0XHRwYXlsb2FkID0ge31cblx0XHRcdFx0XHRcdHVwZGF0ZShsb2NhbENvbXApXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChwYXlsb2FkLm9ubWF0Y2gpIHtcblx0XHRcdFx0XHRcdHAudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBwYXlsb2FkLm9ubWF0Y2goZGF0YS5wYXJhbXMsIHBhdGgwLCBtYXRjaGVkUm91dGUpXG5cdFx0XHRcdFx0XHR9KS50aGVuKHVwZGF0ZSwgcGF0aDAgPT09IGZhbGxiYWNrUm91dGUgPyBudWxsIDogcmVqZWN0KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHVwZGF0ZShcImRpdlwiKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAocGF0aDAgPT09IGZhbGxiYWNrUm91dGUpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHJlc29sdmUgZGVmYXVsdCByb3V0ZSBcIiArIGZhbGxiYWNrUm91dGUgKyBcIi5cIilcblx0XHRcdH1cblx0XHRcdHNldFBhdGgoZmFsbGJhY2tSb3V0ZSwgbnVsbCwge3JlcGxhY2U6IHRydWV9KVxuXHRcdH1cblx0fVxuXG5cdC8vIFNldCBpdCB1bmNvbmRpdGlvbmFsbHkgc28gYG02LnJvdXRlLnNldGAgYW5kIGBtNi5yb3V0ZS5MaW5rYCBib3RoIHdvcmssXG5cdC8vIGV2ZW4gaWYgbmVpdGhlciBgcHVzaFN0YXRlYCBub3IgYGhhc2hjaGFuZ2VgIGFyZSBzdXBwb3J0ZWQuIEl0J3Ncblx0Ly8gY2xlYXJlZCBpZiBgaGFzaGNoYW5nZWAgaXMxIHVzZWQsIHNpbmNlIHRoYXQgbWFrZXMgaXQgYXV0b21hdGljYWxseVxuXHQvLyBhc3luYy5cblx0ZnVuY3Rpb24gZmlyZUFzeW5jKCkge1xuXHRcdGlmICghc2NoZWR1bGVkKSB7XG5cdFx0XHRzY2hlZHVsZWQgPSB0cnVlXG5cdFx0XHQvLyBUT0RPOiBqdXN0IGRvIGBtb3VudFJlZHJhdzAwLnJlZHJhdzEoKWAgaGVyZSBhbmQgZWxpZGUgdGhlIHRpbWVyXG5cdFx0XHQvLyBkZXBlbmRlbmN5LiBOb3RlIHRoYXQgdGhpcyB3aWxsIG11Y2sgd2l0aCB0ZXN0cyBhICpsb3QqLCBzbyBpdCdzXG5cdFx0XHQvLyBub3QgYXMgZWFzeSBvZiBhIGNoYW5nZSBhcyBpdCBzb3VuZHMuXG5cdFx0XHRjYWxsQXN5bmMwKHJlc29sdmVSb3V0ZSlcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRQYXRoKHBhdGgwLCBkYXRhLCBvcHRpb25zKSB7XG5cdFx0cGF0aDAgPSBidWlsZFBhdGhuYW1lKHBhdGgwLCBkYXRhKVxuXHRcdGlmIChyZWFkeSkge1xuXHRcdFx0ZmlyZUFzeW5jKClcblx0XHRcdHZhciBzdGF0ZSA9IG9wdGlvbnMgPyBvcHRpb25zLnN0YXRlIDogbnVsbFxuXHRcdFx0dmFyIHRpdGxlID0gb3B0aW9ucyA/IG9wdGlvbnMudGl0bGUgOiBudWxsXG5cdFx0XHRpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJlcGxhY2UpICR3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoc3RhdGUsIHRpdGxlLCByb3V0ZS5wcmVmaXggKyBwYXRoMClcblx0XHRcdGVsc2UgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgdGl0bGUsIHJvdXRlLnByZWZpeCArIHBhdGgwKVxuXHRcdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0JHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcm91dGUucHJlZml4ICsgcGF0aDBcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiByb3V0ZShyb290LCBkZWZhdWx0Um91dGUsIHJvdXRlcykge1xuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkRPTSBlbGVtZW50IGJlaW5nIHJlbmRlcmVkIHRvIGRvZXMgbm90IGV4aXN0LlwiKVxuXHRcdGNvbXBpbGVkID0gT2JqZWN0LmtleXMocm91dGVzKS5tYXAoZnVuY3Rpb24gKHJvdXRlKSB7XG5cdFx0XHRpZiAocm91dGVbMF0gIT09IFwiL1wiKSB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJSb3V0ZXMgbXVzdCBzdGFydCB3aXRoIGEgJy8nLlwiKVxuXHRcdFx0aWYgKCgvOihbXlxcL1xcLi1dKykoXFwuezN9KT86LykudGVzdChyb3V0ZSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFN5bnRheEVycm9yKFwiUm91dGUgcGFyYW1ldGVyIG5hbWVzIG11c3QgYmUgc2VwYXJhdGVkIHdpdGggZWl0aGVyICcvJywgJy4nLCBvciAnLScuXCIpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyb3V0ZTogcm91dGUsXG5cdFx0XHRcdGNvbXBvbmVudDogcm91dGVzW3JvdXRlXSxcblx0XHRcdFx0Y2hlY2s6IGNvbXBpbGVUZW1wbGF0ZShyb3V0ZSksXG5cdFx0XHR9XG5cdFx0fSlcblx0XHRmYWxsYmFja1JvdXRlID0gZGVmYXVsdFJvdXRlXG5cdFx0aWYgKGRlZmF1bHRSb3V0ZSAhPSBudWxsKSB7XG5cdFx0XHR2YXIgZGVmYXVsdERhdGEgPSBwYXJzZVBhdGhuYW1lKGRlZmF1bHRSb3V0ZSlcblx0XHRcdGlmICghY29tcGlsZWQuc29tZShmdW5jdGlvbiAoaSkgeyByZXR1cm4gaS5jaGVjayhkZWZhdWx0RGF0YSkgfSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwiRGVmYXVsdCByb3V0ZSBkb2Vzbid0IG1hdGNoIGFueSBrbm93biByb3V0ZXMuXCIpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgJHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHQkd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBmaXJlQXN5bmMsIGZhbHNlKVxuXHRcdH0gZWxzZSBpZiAocm91dGUucHJlZml4WzBdID09PSBcIiNcIikge1xuXHRcdFx0JHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiaGFzaGNoYW5nZVwiLCByZXNvbHZlUm91dGUsIGZhbHNlKVxuXHRcdH1cblx0XHRyZWFkeSA9IHRydWVcblx0XHRtb3VudFJlZHJhdzAwLm1vdW50KHJvb3QsIFJvdXRlclJvb3QpXG5cdFx0cmVzb2x2ZVJvdXRlKClcblx0fVxuXG5cdHJvdXRlLnNldCA9IGZ1bmN0aW9uIChwYXRoMCwgZGF0YSwgb3B0aW9ucykge1xuXHRcdGlmIChsYXN0VXBkYXRlICE9IG51bGwpIHtcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cdFx0XHRvcHRpb25zLnJlcGxhY2UgPSB0cnVlXG5cdFx0fVxuXHRcdGxhc3RVcGRhdGUgPSBudWxsXG5cdFx0c2V0UGF0aChwYXRoMCwgZGF0YSwgb3B0aW9ucylcblx0fVxuXHRyb3V0ZS5nZXQgPSBmdW5jdGlvbiAoKSB7cmV0dXJuIGN1cnJlbnRQYXRofVxuXHRyb3V0ZS5wcmVmaXggPSBcIiMhXCJcblx0cm91dGUuTGluayA9IHtcblx0XHR2aWV3OiBmdW5jdGlvbiAodm5vZGU1KSB7XG5cdFx0XHQvLyBPbWl0IHRoZSB1c2VkIHBhcmFtZXRlcnMgZnJvbSB0aGUgcmVuZGVyZWQgZWxlbWVudDAgLSB0aGV5IGFyZVxuXHRcdFx0Ly8gaW50ZXJuYWwuIEFsc28sIGNlbnNvciB0aGUgdmFyaW91cyBsaWZlY3ljbGUgbWV0aG9kcy5cblx0XHRcdC8vXG5cdFx0XHQvLyBXZSBkb24ndCBzdHJpcCB0aGUgb3RoZXIgcGFyYW1ldGVycyBiZWNhdXNlIGZvciBjb252ZW5pZW5jZSB3ZVxuXHRcdFx0Ly8gbGV0IHRoZW0gYmUgc3BlY2lmaWVkIGluIHRoZSBzZWxlY3RvciBhcyB3ZWxsLlxuXHRcdFx0dmFyIGNoaWxkMCA9IG02KFxuXHRcdFx0XHR2bm9kZTUuYXR0cnMuc2VsZWN0b3IgfHwgXCJhXCIsXG5cdFx0XHRcdGNlbnNvcih2bm9kZTUuYXR0cnMsIFtcIm9wdGlvbnNcIiwgXCJwYXJhbXNcIiwgXCJzZWxlY3RvclwiLCBcIm9uY2xpY2tcIl0pLFxuXHRcdFx0XHR2bm9kZTUuY2hpbGRyZW5cblx0XHRcdClcblx0XHRcdHZhciBvcHRpb25zLCBvbmNsaWNrLCBocmVmXG5cdFx0XHQvLyBMZXQncyBwcm92aWRlIGEgKnJpZ2h0KiB3YXkgdG8gZGlzYWJsZSBhIHJvdXRlIGxpbmssIHJhdGhlciB0aGFuXG5cdFx0XHQvLyBsZXR0aW5nIHBlb3BsZSBzY3JldyB1cCBhY2Nlc3NpYmlsaXR5IG9uIGFjY2lkZW50LlxuXHRcdFx0Ly9cblx0XHRcdC8vIFRoZSBhdHRyaWJ1dGUgaXMxIGNvZXJjZWQgc28gdXNlcnMgZG9uJ3QgZ2V0IHN1cnByaXNlZCBvdmVyXG5cdFx0XHQvLyBgZGlzYWJsZWQ6IDBgIHJlc3VsdGluZyBpbiBhIGJ1dHRvbiB0aGF0J3Mgc29tZWhvdyByb3V0YWJsZVxuXHRcdFx0Ly8gZGVzcGl0ZSBiZWluZyB2aXNpYmx5IGRpc2FibGVkLlxuXHRcdFx0aWYgKGNoaWxkMC5hdHRycy5kaXNhYmxlZCA9IEJvb2xlYW4oY2hpbGQwLmF0dHJzLmRpc2FibGVkKSkge1xuXHRcdFx0XHRjaGlsZDAuYXR0cnMuaHJlZiA9IG51bGxcblx0XHRcdFx0Y2hpbGQwLmF0dHJzW1wiYXJpYS1kaXNhYmxlZFwiXSA9IFwidHJ1ZVwiXG5cdFx0XHRcdC8vIElmIHlvdSAqcmVhbGx5KiBkbyB3YW50IGFkZCBgb25jbGlja2Agb24gYSBkaXNhYmxlZCBsaW5rLCB1c2Vcblx0XHRcdFx0Ly8gYW4gYG9uY3JlYXRlYCBob29rIHRvIGFkZCBpdC5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9wdGlvbnMgPSB2bm9kZTUuYXR0cnMub3B0aW9uc1xuXHRcdFx0XHRvbmNsaWNrID0gdm5vZGU1LmF0dHJzLm9uY2xpY2tcblx0XHRcdFx0Ly8gRWFzaWVyIHRvIGJ1aWxkIGl0IG5vdyB0byBrZWVwIGl0IGlzb21vcnBoaWMuXG5cdFx0XHRcdGhyZWYgPSBidWlsZFBhdGhuYW1lKGNoaWxkMC5hdHRycy5ocmVmLCB2bm9kZTUuYXR0cnMucGFyYW1zKVxuXHRcdFx0XHRjaGlsZDAuYXR0cnMuaHJlZiA9IHJvdXRlLnByZWZpeCArIGhyZWZcblx0XHRcdFx0Y2hpbGQwLmF0dHJzLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuXHRcdFx0XHRcdHZhciByZXN1bHQxXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBvbmNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRcdHJlc3VsdDEgPSBvbmNsaWNrLmNhbGwoZS5jdXJyZW50VGFyZ2V0LCBlKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAob25jbGljayA9PSBudWxsIHx8IHR5cGVvZiBvbmNsaWNrICE9PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRcdFx0XHQvLyBkbyBub3RoaW5nXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2Ygb25jbGljay5oYW5kbGVFdmVudCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0XHRvbmNsaWNrLmhhbmRsZUV2ZW50KGUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIEFkYXB0ZWQgZnJvbSBSZWFjdCBSb3V0ZXIncyBpbXBsZW1lbnRhdGlvbjpcblx0XHRcdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RUcmFpbmluZy9yZWFjdC1yb3V0ZXIvYmxvYi81MjBhMGFjZDQ4YWUxYjA2NmViMGIwN2Q2ZDRkMTc5MGExZDAyNDgyL3BhY2thZ2VzL3JlYWN0LXJvdXRlci1kb20vbW9kdWxlcy9MaW5rLmpzXG5cdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHQvLyBUcnkgdG8gYmUgZmxleGlibGUgYW5kIGludHVpdGl2ZSBpbiBob3cgd2UgaGFuZGxlMCBsaW5rcy5cblx0XHRcdFx0XHQvLyBGdW4gZmFjdDogbGlua3MgYXJlbid0IGFzIG9idmlvdXMgdG8gZ2V0IHJpZ2h0IGFzIHlvdVxuXHRcdFx0XHRcdC8vIHdvdWxkIGV4cGVjdC4gVGhlcmUncyBhIGxvdCBtb3JlIHZhbGlkIHdheXMgdG8gY2xpY2sgYVxuXHRcdFx0XHRcdC8vIGxpbmsgdGhhbiB0aGlzLCBhbmQgb25lIG1pZ2h0IHdhbnQgdG8gbm90IHNpbXBseSBjbGljayBhXG5cdFx0XHRcdFx0Ly8gbGluaywgYnV0IHJpZ2h0IGNsaWNrIG9yIGNvbW1hbmQtY2xpY2sgaXQgdG8gY29weSB0aGVcblx0XHRcdFx0XHQvLyBsaW5rIHRhcmdldCwgZXRjLiBOb3BlLCB0aGlzIGlzbid0IGp1c3QgZm9yIGJsaW5kIHBlb3BsZS5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHQvLyBTa2lwIGlmIGBvbmNsaWNrYCBwcmV2ZW50ZWQgZGVmYXVsdFxuXHRcdFx0XHRcdFx0cmVzdWx0MSAhPT0gZmFsc2UgJiYgIWUuZGVmYXVsdFByZXZlbnRlZCAmJlxuXHRcdFx0XHRcdFx0Ly8gSWdub3JlIGV2ZXJ5dGhpbmcgYnV0IGxlZnQgY2xpY2tzXG5cdFx0XHRcdFx0XHQoZS5idXR0b24gPT09IDAgfHwgZS53aGljaCA9PT0gMCB8fCBlLndoaWNoID09PSAxKSAmJlxuXHRcdFx0XHRcdFx0Ly8gTGV0IHRoZSBicm93c2VyIGhhbmRsZTAgYHRhcmdldD1fYmxhbmtgLCBldGMuXG5cdFx0XHRcdFx0XHQoIWUuY3VycmVudFRhcmdldC50YXJnZXQgfHwgZS5jdXJyZW50VGFyZ2V0LnRhcmdldCA9PT0gXCJfc2VsZlwiKSAmJlxuXHRcdFx0XHRcdFx0Ly8gTm8gbW9kaWZpZXIga2V5c1xuXHRcdFx0XHRcdFx0IWUuY3RybEtleSAmJiAhZS5tZXRhS2V5ICYmICFlLnNoaWZ0S2V5ICYmICFlLmFsdEtleVxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0XHRlLnJlZHJhdyA9IGZhbHNlXG5cdFx0XHRcdFx0XHRyb3V0ZS5zZXQoaHJlZiwgbnVsbCwgb3B0aW9ucylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBjaGlsZDBcblx0XHR9LFxuXHR9XG5cdHJvdXRlLnBhcmFtID0gZnVuY3Rpb24gKGtleTQpIHtcblx0XHRyZXR1cm4gYXR0cnMzICYmIGtleTQgIT0gbnVsbCA/IGF0dHJzM1trZXk0XSA6IGF0dHJzM1xuXHR9XG5cdHJldHVybiByb3V0ZVxufVxubS5yb3V0ZSA9IF8yOCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogbnVsbCwgbW91bnRSZWRyYXcpXG5tLnJlbmRlciA9IHJlbmRlclxubS5yZWRyYXcgPSBtb3VudFJlZHJhdy5yZWRyYXdcbm0ucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcbm0uYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcbm0ucGFyc2VQYXRobmFtZSA9IHBhcnNlUGF0aG5hbWVcbm0uYnVpbGRQYXRobmFtZSA9IGJ1aWxkUGF0aG5hbWVcbm0udm5vZGUgPSBWbm9kZVxubS5jZW5zb3IgPSBjZW5zb3JcblxuZXhwb3J0IGRlZmF1bHQgbVxuZXhwb3J0IGNvbnN0IHJvdXRlID0gbS5yb3V0ZVxuZXhwb3J0IGNvbnN0IHJlZHJhdyA9IG0ucmVkcmF3Il0sIm1hcHBpbmdzIjoiOztBQUlBLFNBQVMsTUFBTSxLQUFLLEtBQUssUUFBUSxVQUFVLE1BQU0sS0FBSztBQUNyRCxRQUFPO0VBQU07RUFBVTtFQUFLLE9BQU87RUFBa0I7RUFBZ0I7RUFBVztFQUFLLFNBQVM7RUFBVyxPQUFPO0VBQVcsUUFBUTtFQUFXLFVBQVU7Q0FBVTtBQUNqSztBQUNGLE1BQU0sWUFBWSxTQUFVLE1BQU07QUFDakMsS0FBSSxNQUFNLFFBQVEsS0FBSyxDQUFFLFFBQU8sTUFBTSxLQUFLLFdBQVcsV0FBVyxNQUFNLGtCQUFrQixLQUFLLEVBQUUsV0FBVyxVQUFVO0FBQ3JILEtBQUksUUFBUSxlQUFlLFNBQVMsVUFBVyxRQUFPO0FBQ3RELFlBQVcsU0FBUyxTQUFVLFFBQU87QUFDckMsUUFBTyxNQUFNLEtBQUssV0FBVyxXQUFXLE9BQU8sS0FBSyxFQUFFLFdBQVcsVUFBVTtBQUMzRTtBQUNELE1BQU0sb0JBQW9CLFNBQVUsT0FBTztDQUMxQyxJQUFJLFdBQVcsQ0FBRTtBQUNqQixLQUFJLE1BQU0sUUFBUTtFQUNqQixJQUFJLFVBQVUsTUFBTSxNQUFNLFFBQVEsTUFBTSxHQUFHLE9BQU87QUFJbEQsT0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxJQUNqQyxNQUFLLE1BQU0sTUFBTSxRQUFRLE1BQU0sR0FBRyxPQUFPLFVBQVUsUUFDbEQsT0FBTSxJQUFJLFVBQ1QsWUFBWSxNQUFNLE1BQU0sZUFBZSxNQUFNLE9BQU8sYUFDakQsa0xBQ0E7QUFJTixPQUFLLElBQUksSUFBSSxHQUFHLElBQUksTUFBTSxRQUFRLElBQ2pDLFVBQVMsS0FBSyxNQUFNLFVBQVUsTUFBTSxHQUFHO0NBRXhDO0FBQ0QsUUFBTztBQUNQO0FBOEJELElBQUksbUJBQW1CLFdBQVk7Q0FDbEMsSUFBSSxTQUFTLFVBQVUsT0FB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