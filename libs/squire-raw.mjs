// source/node/TreeIterator.ts
var SHOW_ELEMENT = 1;
var SHOW_TEXT = 4;
var SHOW_ELEMENT_OR_TEXT = 5;
var always = () => true;
var TreeIterator = class {
  root;
  currentNode;
  nodeType;
  filter;
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
        if (current === root) {
          break;
        }
        node = current.nextSibling;
        if (!node) {
          current = current.parentNode;
        }
      }
      if (!node) {
        return null;
      }
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
      if (current === root) {
        return null;
      }
      node = current.previousSibling;
      if (node) {
        while (current = node.lastChild) {
          node = current;
        }
      } else {
        node = current.parentNode;
      }
      if (!node) {
        return null;
      }
      if (this.isAcceptableNode(node)) {
        this.currentNode = node;
        return node;
      }
      current = node;
    }
  }
  // Previous node in post-order.
  previousPONode() {
    const root = this.root;
    let current = this.currentNode;
    let node;
    while (true) {
      node = current.lastChild;
      while (!node && current) {
        if (current === root) {
          break;
        }
        node = current.previousSibling;
        if (!node) {
          current = current.parentNode;
        }
      }
      if (!node) {
        return null;
      }
      if (this.isAcceptableNode(node)) {
        this.currentNode = node;
        return node;
      }
      current = node;
    }
  }
};

// source/Constants.ts
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var ZWS = "\u200B";
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

// source/node/Category.ts
var inlineNodeNames = /^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|EL|FN)|EM|FONT|HR|I(?:FRAME|MG|NPUT|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:AMP|MALL|PAN|TR(?:IKE|ONG)|U[BP])?|TIME|U|VAR|WBR)$/;
var leafNodeNames = /* @__PURE__ */ new Set(["BR", "HR", "IFRAME", "IMG", "INPUT"]);
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
    case TEXT_NODE:
      return INLINE;
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      if (cache.has(node)) {
        return cache.get(node);
      }
      break;
    default:
      return UNKNOWN;
  }
  let nodeCategory;
  if (!Array.from(node.childNodes).every(isInline)) {
    nodeCategory = CONTAINER;
  } else if (inlineNodeNames.test(node.nodeName)) {
    nodeCategory = INLINE;
  } else {
    nodeCategory = BLOCK;
  }
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

// source/node/Node.ts
var createElement = (tag, props, children) => {
  const el = document.createElement(tag);
  if (props instanceof Array) {
    children = props;
    props = null;
  }
  if (props) {
    for (const attr in props) {
      const value = props[attr];
      if (value !== void 0) {
        el.setAttribute(attr, value);
      }
    }
  }
  if (children) {
    children.forEach((node) => el.appendChild(node));
  }
  return el;
};
var areAlike = (node, node2) => {
  if (isLeaf(node)) {
    return false;
  }
  if (node.nodeType !== node2.nodeType || node.nodeName !== node2.nodeName) {
    return false;
  }
  if (node instanceof HTMLElement && node2 instanceof HTMLElement) {
    return node.nodeName !== "A" && node.className === node2.className && node.style.cssText === node2.style.cssText;
  }
  return true;
};
var hasTagAttributes = (node, tag, attributes) => {
  if (node.nodeName !== tag) {
    return false;
  }
  for (const attr in attributes) {
    if (!("getAttribute" in node) || node.getAttribute(attr) !== attributes[attr]) {
      return false;
    }
  }
  return true;
};
var getNearest = (node, root, tag, attributes) => {
  while (node && node !== root) {
    if (hasTagAttributes(node, tag, attributes)) {
      return node;
    }
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
    if (offset < children.length) {
      returnNode = children[offset];
    } else {
      while (returnNode && !returnNode.nextSibling) {
        returnNode = returnNode.parentNode;
      }
      if (returnNode) {
        returnNode = returnNode.nextSibling;
      }
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
  if (parent) {
    parent.removeChild(node);
  }
  return node;
};
var replaceWith = (node, node2) => {
  const parent = node.parentNode;
  if (parent) {
    parent.replaceChild(node2, node);
  }
};

// source/node/Whitespace.ts
var notWSTextNode = (node) => {
  return node instanceof Element ? node.nodeName === "BR" : (
    // okay if data is 'undefined' here.
    notWS.test(node.data)
  );
};
var isLineBreak = (br, isLBIfEmptyBlock) => {
  let block = br.parentNode;
  while (isInline(block)) {
    block = block.parentNode;
  }
  const walker = new TreeIterator(
    block,
    SHOW_ELEMENT_OR_TEXT,
    notWSTextNode
  );
  walker.currentNode = br;
  return !!walker.nextNode() || isLBIfEmptyBlock && !walker.previousNode();
};
var removeZWS = (root, keepNode) => {
  const walker = new TreeIterator(root, SHOW_TEXT);
  let textNode;
  let index;
  while (textNode = walker.nextNode()) {
    while ((index = textNode.data.indexOf(ZWS)) > -1 && // eslint-disable-next-line no-unmodified-loop-condition
    (!keepNode || textNode.parentNode !== keepNode)) {
      if (textNode.length === 1) {
        let node = textNode;
        let parent = node.parentNode;
        while (parent) {
          parent.removeChild(node);
          walker.currentNode = parent;
          if (!isInline(parent) || getLength(parent)) {
            break;
          }
          node = parent;
          parent = node.parentNode;
        }
        break;
      } else {
        textNode.deleteData(index, 1);
      }
    }
  }
};

// source/range/Boundaries.ts
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
  if (endOffset) {
    while (!(endContainer instanceof Text)) {
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
  } else {
    while (!(endContainer instanceof Text)) {
      const child = endContainer.firstChild;
      if (!child || isLeaf(child)) {
        break;
      }
      endContainer = child;
    }
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
  if (!startMax) {
    startMax = range.commonAncestorContainer;
  }
  if (!endMax) {
    endMax = startMax;
  }
  while (!startOffset && startContainer !== startMax && startContainer !== root) {
    parent = startContainer.parentNode;
    startOffset = Array.from(parent.childNodes).indexOf(
      startContainer
    );
    startContainer = parent;
  }
  while (true) {
    if (endContainer === endMax || endContainer === root) {
      break;
    }
    if (endContainer.nodeType !== TEXT_NODE && endContainer.childNodes[endOffset] && endContainer.childNodes[endOffset].nodeName === "BR" && !isLineBreak(endContainer.childNodes[endOffset], false)) {
      endOffset += 1;
    }
    if (endOffset !== getLength(endContainer)) {
      break;
    }
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

// source/node/MergeSplit.ts
var fixCursor = (node) => {
  let fixer = null;
  if (node instanceof Text) {
    return node;
  }
  if (isInline(node)) {
    let child = node.firstChild;
    if (cantFocusEmptyTextNodes) {
      while (child && child instanceof Text && !child.data) {
        node.removeChild(child);
        child = node.firstChild;
      }
    }
    if (!child) {
      if (cantFocusEmptyTextNodes) {
        fixer = document.createTextNode(ZWS);
      } else {
        fixer = document.createTextNode("");
      }
    }
  } else if (node instanceof Element && !node.querySelector("BR")) {
    fixer = createElement("BR");
    let parent = node;
    let child;
    while ((child = parent.lastElementChild) && !isInline(child)) {
      parent = child;
    }
  }
  if (fixer) {
    try {
      node.appendChild(fixer);
    } catch (error) {
    }
  }
  return node;
};
var fixContainer = (container, root) => {
  let wrapper = null;
  Array.from(container.childNodes).forEach((child) => {
    const isBR = child.nodeName === "BR";
    if (!isBR && isInline(child)) {
      if (!wrapper) {
        wrapper = createElement("DIV");
      }
      wrapper.appendChild(child);
    } else if (isBR || wrapper) {
      if (!wrapper) {
        wrapper = createElement("DIV");
      }
      fixCursor(wrapper);
      if (isBR) {
        container.replaceChild(wrapper, child);
      } else {
        container.insertBefore(wrapper, child);
      }
      wrapper = null;
    }
    if (isContainer(child)) {
      fixContainer(child, root);
    }
  });
  if (wrapper) {
    container.appendChild(fixCursor(wrapper));
  }
  return container;
};
var split = (node, offset, stopNode, root) => {
  if (node instanceof Text && node !== stopNode) {
    if (typeof offset !== "number") {
      throw new Error("Offset must be a number to split text node!");
    }
    if (!node.parentNode) {
      throw new Error("Cannot split text node with no parent!");
    }
    return split(node.parentNode, node.splitText(offset), stopNode, root);
  }
  let nodeAfterSplit = typeof offset === "number" ? offset < node.childNodes.length ? node.childNodes[offset] : null : offset;
  const parent = node.parentNode;
  if (!parent || node === stopNode || !(node instanceof Element)) {
    return nodeAfterSplit;
  }
  const clone = node.cloneNode(false);
  while (nodeAfterSplit) {
    const next = nodeAfterSplit.nextSibling;
    clone.appendChild(nodeAfterSplit);
    nodeAfterSplit = next;
  }
  if (node instanceof HTMLOListElement && getNearest(node, root, "BLOCKQUOTE")) {
    clone.start = (+node.start || 1) + node.childNodes.length - 1;
  }
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
        if (fakeRange.startOffset > l) {
          fakeRange.startOffset -= 1;
        } else if (fakeRange.startOffset === l) {
          fakeRange.startContainer = prev;
          fakeRange.startOffset = getLength(prev);
        }
      }
      if (fakeRange.endContainer === node) {
        if (fakeRange.endOffset > l) {
          fakeRange.endOffset -= 1;
        } else if (fakeRange.endOffset === l) {
          fakeRange.endContainer = prev;
          fakeRange.endOffset = getLength(prev);
        }
      }
      detach(child);
      if (child instanceof Text) {
        prev.appendData(child.data);
      } else {
        frags.push(empty(child));
      }
    } else if (child instanceof Element) {
      let frag;
      while (frag = frags.pop()) {
        child.appendChild(frag);
      }
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
  while ((parent = container.parentNode) && parent !== root && parent instanceof Element && parent.childNodes.length === 1) {
    container = parent;
  }
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
var mergeContainers = (node, root) => {
  const prev = node.previousSibling;
  const first = node.firstChild;
  const isListItem = node.nodeName === "LI";
  if (isListItem && (!first || !/^[OU]L$/.test(first.nodeName))) {
    return;
  }
  if (prev && areAlike(prev, node)) {
    if (!isContainer(prev)) {
      if (isListItem) {
        const block = createElement("DIV");
        block.appendChild(empty(prev));
        prev.appendChild(block);
      } else {
        return;
      }
    }
    detach(node);
    const needsFix = !isContainer(node);
    prev.appendChild(empty(node));
    if (needsFix) {
      fixContainer(prev, root);
    }
    if (first) {
      mergeContainers(first, root);
    }
  } else if (isListItem) {
    const block = createElement("DIV");
    node.insertBefore(block, first);
    fixCursor(block);
  }
};

// source/Clean.ts
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
    replace(classNames, size) {
      return createElement("SPAN", {
        class: classNames.fontSize,
        style: "font-size:" + size
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
      if (el.nodeName === node.nodeName && el.className === node.className) {
        continue;
      }
      if (!newTreeTop) {
        newTreeTop = el;
      }
      if (newTreeBottom) {
        newTreeBottom.appendChild(el);
      }
      newTreeBottom = el;
      node.style.removeProperty(attr);
    }
  }
  if (newTreeTop && newTreeBottom) {
    newTreeBottom.appendChild(empty(node));
    if (node.style.cssText) {
      node.appendChild(newTreeTop);
    } else {
      replaceWith(node, newTreeTop);
    }
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
    const size = font.size;
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
    if (size) {
      sizeSpan = createElement("SPAN", {
        class: classNames.fontSize,
        style: "font-size:" + fontSizes[size] + "px"
      });
      if (!newTreeTop) {
        newTreeTop = sizeSpan;
      }
      if (newTreeBottom) {
        newTreeBottom.appendChild(sizeSpan);
      }
      newTreeBottom = sizeSpan;
    }
    if (color && /^#?([\dA-F]{3}){1,2}$/i.test(color)) {
      if (color.charAt(0) !== "#") {
        color = "#" + color;
      }
      colorSpan = createElement("SPAN", {
        class: classNames.color,
        style: "color:" + color
      });
      if (!newTreeTop) {
        newTreeTop = colorSpan;
      }
      if (newTreeBottom) {
        newTreeBottom.appendChild(colorSpan);
      }
      newTreeBottom = colorSpan;
    }
    if (!newTreeTop || !newTreeBottom) {
      newTreeTop = newTreeBottom = createElement("SPAN");
    }
    parent.replaceChild(newTreeTop, font);
    newTreeBottom.appendChild(empty(font));
    return newTreeBottom;
  },
  TT: (node, parent, config) => {
    const el = createElement("SPAN", {
      class: config.classNames.fontFamily,
      style: 'font-family:menlo,consolas,"courier new",monospace'
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
  while (isInline(nonInlineParent)) {
    nonInlineParent = nonInlineParent.parentNode;
  }
  const walker = new TreeIterator(
    nonInlineParent,
    SHOW_ELEMENT_OR_TEXT
  );
  for (let i = 0, l = children.length; i < l; i += 1) {
    let child = children[i];
    const nodeName = child.nodeName;
    const rewriter = stylesRewriters[nodeName];
    if (child instanceof HTMLElement) {
      const childLength = child.childNodes.length;
      if (rewriter) {
        child = rewriter(child, node, config);
      } else if (blacklist.test(nodeName)) {
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
      if (childLength) {
        cleanTree(child, config, preserveWS || nodeName === "PRE");
      }
    } else {
      if (child instanceof Text) {
        let data = child.data;
        const startsWithWS = !notWS.test(data.charAt(0));
        const endsWithWS = !notWS.test(data.charAt(data.length - 1));
        if (preserveWS || !startsWithWS && !endsWithWS) {
          continue;
        }
        if (startsWithWS) {
          walker.currentNode = child;
          let sibling;
          while (sibling = walker.previousPONode()) {
            if (sibling.nodeName === "IMG" || sibling instanceof Text && notWS.test(sibling.data)) {
              break;
            }
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
            if (sibling.nodeName === "IMG" || sibling instanceof Text && notWS.test(sibling.data)) {
              break;
            }
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
      if (isInline(child) && !child.firstChild) {
        node.removeChild(child);
      }
    } else if (child instanceof Text && !child.data) {
      node.removeChild(child);
    }
  }
};
var cleanupBRs = (node, root, keepForBlankLine) => {
  const brs = node.querySelectorAll("BR");
  const brBreaksLine = [];
  let l = brs.length;
  for (let i = 0; i < l; i += 1) {
    brBreaksLine[i] = isLineBreak(brs[i], keepForBlankLine);
  }
  while (l--) {
    const br = brs[l];
    const parent = br.parentNode;
    if (!parent) {
      continue;
    }
    if (!brBreaksLine[l]) {
      detach(br);
    } else if (!isInline(parent)) {
      fixContainer(parent, root);
    }
  }
};
var escapeHTML = (text) => {
  return text.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;");
};

// source/node/Block.ts
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

// source/range/Block.ts
var getStartBlockOfRange = (range, root) => {
  const container = range.startContainer;
  let block;
  if (isInline(container)) {
    block = getPreviousBlock(container, root);
  } else if (container !== root && container instanceof HTMLElement && isBlock(container)) {
    block = container;
  } else {
    const node = getNodeBeforeOffset(container, range.startOffset);
    block = getNextBlock(node, root);
  }
  return block && isNodeContainedInRange(range, block, true) ? block : null;
};
var getEndBlockOfRange = (range, root) => {
  const container = range.endContainer;
  let block;
  if (isInline(container)) {
    block = getPreviousBlock(container, root);
  } else if (container !== root && container instanceof HTMLElement && isBlock(container)) {
    block = container;
  } else {
    let node = getNodeAfterOffset(container, range.endOffset);
    if (!node || !root.contains(node)) {
      node = root;
      let child;
      while (child = node.lastChild) {
        node = child;
      }
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
    if (startOffset) {
      return false;
    }
    nodeAfterCursor = startContainer;
  } else {
    nodeAfterCursor = getNodeAfterOffset(startContainer, startOffset);
    if (nodeAfterCursor && !root.contains(nodeAfterCursor)) {
      nodeAfterCursor = null;
    }
    if (!nodeAfterCursor) {
      nodeAfterCursor = getNodeBeforeOffset(startContainer, startOffset);
      if (nodeAfterCursor instanceof Text && nodeAfterCursor.length) {
        return false;
      }
    }
  }
  const block = getStartBlockOfRange(range, root);
  if (!block) {
    return false;
  }
  const contentWalker = new TreeIterator(
    block,
    SHOW_ELEMENT_OR_TEXT,
    isContent
  );
  contentWalker.currentNode = nodeAfterCursor;
  return !contentWalker.previousNode();
};
var rangeDoesEndAtBlockBoundary = (range, root) => {
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;
  let currentNode;
  if (endContainer instanceof Text) {
    const length = endContainer.data.length;
    if (length && endOffset < length) {
      return false;
    }
    currentNode = endContainer;
  } else {
    currentNode = getNodeBeforeOffset(endContainer, endOffset);
  }
  const block = getEndBlockOfRange(range, root);
  if (!block) {
    return false;
  }
  const contentWalker = new TreeIterator(
    block,
    SHOW_ELEMENT_OR_TEXT,
    isContent
  );
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

// source/range/InsertDelete.ts
function createRange(startContainer, startOffset, endContainer, endOffset) {
  const range = document.createRange();
  range.setStart(startContainer, startOffset);
  if (endContainer && typeof endOffset === "number") {
    range.setEnd(endContainer, endOffset);
  } else {
    range.setEnd(startContainer, startOffset);
  }
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
        } else if (endContainer === parent) {
          endOffset += 1;
        }
        startContainer = afterSplit;
      }
      startOffset = Array.from(children).indexOf(
        startContainer
      );
    }
    startContainer = parent;
  } else {
    children = startContainer.childNodes;
  }
  const childCount = children.length;
  if (startOffset === childCount) {
    startContainer.appendChild(node);
  } else {
    startContainer.insertBefore(node, children[startOffset]);
  }
  if (startContainer === endContainer) {
    endOffset += children.length - childCount;
  }
  range.setStart(startContainer, startOffset);
  range.setEnd(endContainer, endOffset);
};
var extractContentsOfRange = (range, common, root) => {
  const frag = document.createDocumentFragment();
  if (range.collapsed) {
    return frag;
  }
  if (!common) {
    common = range.commonAncestorContainer;
  }
  if (common instanceof Text) {
    common = common.parentNode;
  }
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
  if (endContainer) {
    range.setEnd(endContainer, endOffset);
  } else {
    range.setEnd(common, common.childNodes.length);
  }
  fixCursor(common);
  return frag;
};
var getAdjacentInlineNode = (iterator, method, node) => {
  iterator.currentNode = node;
  let nextNode;
  while (nextNode = iterator[method]()) {
    if (nextNode instanceof Text || isLeaf(nextNode)) {
      return nextNode;
    }
    if (!isInline(nextNode)) {
      return null;
    }
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
    if (startBlock && endBlock && startBlock !== endBlock) {
      mergeWithBlock(startBlock, endBlock, range, root);
    }
  }
  if (startBlock) {
    fixCursor(startBlock);
  }
  const child = root.firstChild;
  if (!child || child.nodeName === "BR") {
    fixCursor(root);
    if (root.firstChild) {
      range.selectNodeContents(root.firstChild);
    }
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
    beforeNode = getAdjacentInlineNode(
      iterator,
      "previousPONode",
      afterNode || (startContainer instanceof Text ? startContainer : startContainer.childNodes[startOffset] || startContainer)
    );
    if (beforeNode instanceof Text) {
      beforeOffset = beforeNode.data.length;
    }
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
  if (node) {
    node.replaceData(offset, 1, "\xA0");
  }
  range.setStart(startContainer, startOffset);
  range.collapse(true);
  return frag;
};
var insertTreeFragmentIntoRange = (range, frag, root) => {
  const firstInFragIsInline = frag.firstChild && isInline(frag.firstChild);
  let node;
  fixContainer(frag, root);
  node = frag;
  while (node = getNextBlock(node, root)) {
    fixCursor(node);
  }
  if (!range.collapsed) {
    deleteContentsOfRange(range, root);
  }
  moveRangeBoundariesDownTree(range);
  range.collapse(false);
  const stopPoint = getNearest(range.endContainer, root, "BLOCKQUOTE") || root;
  let block = getStartBlockOfRange(range, root);
  let blockContentsAfterSplit = null;
  const firstBlockInFrag = getNextBlock(frag, frag);
  const replaceBlock = !firstInFragIsInline && !!block && isEmptyBlock(block);
  if (block && firstBlockInFrag && !replaceBlock && // Don't merge table cells or PRE elements into block
  !getNearest(firstBlockInFrag, frag, "PRE") && !getNearest(firstBlockInFrag, frag, "TABLE")) {
    moveRangeBoundariesUpTree(range, block, block, root);
    range.collapse(true);
    let container = range.endContainer;
    let offset = range.endOffset;
    cleanupBRs(block, root, false);
    if (isInline(container)) {
      const nodeAfterSplit = split(
        container,
        offset,
        getPreviousBlock(container, root) || root,
        root
      );
      container = nodeAfterSplit.parentNode;
      offset = Array.from(container.childNodes).indexOf(
        nodeAfterSplit
      );
    }
    if (
      /*isBlock( container ) && */
      offset !== getLength(container)
    ) {
      blockContentsAfterSplit = document.createDocumentFragment();
      while (node = container.childNodes[offset]) {
        blockContentsAfterSplit.appendChild(node);
      }
    }
    mergeWithBlock(container, firstBlockInFrag, range, root);
    offset = Array.from(container.parentNode.childNodes).indexOf(
      container
    ) + 1;
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
    let nodeAfterSplit = split(
      range.endContainer,
      range.endOffset,
      stopPoint,
      root
    );
    const nodeBeforeSplit = nodeAfterSplit ? nodeAfterSplit.previousSibling : stopPoint.lastChild;
    stopPoint.insertBefore(frag, nodeAfterSplit);
    if (nodeAfterSplit) {
      range.setEndBefore(nodeAfterSplit);
    } else {
      range.setEnd(stopPoint, getLength(stopPoint));
    }
    block = getEndBlockOfRange(range, root);
    moveRangeBoundariesDownTree(range);
    const container = range.endContainer;
    const offset = range.endOffset;
    if (nodeAfterSplit && isContainer(nodeAfterSplit)) {
      mergeContainers(nodeAfterSplit, root);
    }
    nodeAfterSplit = nodeBeforeSplit && nodeBeforeSplit.nextSibling;
    if (nodeAfterSplit && isContainer(nodeAfterSplit)) {
      mergeContainers(nodeAfterSplit, root);
    }
    range.setEnd(container, offset);
  }
  if (blockContentsAfterSplit && block) {
    const tempRange = range.cloneRange();
    mergeWithBlock(block, blockContentsAfterSplit, tempRange, root);
    range.setEnd(tempRange.endContainer, tempRange.endOffset);
  }
  moveRangeBoundariesDownTree(range);
};

// source/Clipboard.ts
var indexOf = Array.prototype.indexOf;
var setClipboardData = (event, contents, root, toCleanHTML, toPlainText, plainTextOnly) => {
  const clipboardData = event.clipboardData;
  const body = document.body;
  const node = createElement("DIV");
  let html;
  let text;
  if (contents.childNodes.length === 1 && contents.childNodes[0] instanceof Text) {
    text = contents.childNodes[0].data.replace(/ /g, " ");
    plainTextOnly = true;
  } else {
    node.appendChild(contents);
    html = node.innerHTML;
    if (toCleanHTML) {
      html = toCleanHTML(html);
    }
  }
  if (text !== void 0) {
  } else if (toPlainText && html !== void 0) {
    text = toPlainText(html);
  } else {
    cleanupBRs(node, root, true);
    node.setAttribute(
      "style",
      "position:fixed;overflow:hidden;bottom:100%;right:100%;"
    );
    body.appendChild(node);
    text = node.innerText || node.textContent;
    text = text.replace(/ /g, " ");
    body.removeChild(node);
  }
  if (isWin) {
    text = text.replace(/\r?\n/g, "\r\n");
  }
  if (!plainTextOnly && html && text !== html) {
    clipboardData.setData("text/html", html);
  }
  clipboardData.setData("text/plain", text);
  event.preventDefault();
};
var extractRangeToClipboard = (event, range, root, removeRangeFromDocument, toCleanHTML, toPlainText, plainTextOnly) => {
  if (!isLegacyEdge && event.clipboardData) {
    const startBlock = getStartBlockOfRange(range, root);
    const endBlock = getEndBlockOfRange(range, root);
    let copyRoot = root;
    if (startBlock === endBlock && startBlock?.contains(range.commonAncestorContainer)) {
      copyRoot = startBlock;
    }
    let contents;
    if (removeRangeFromDocument) {
      contents = deleteContentsOfRange(range, root);
    } else {
      range = range.cloneRange();
      moveRangeBoundariesDownTree(range);
      moveRangeBoundariesUpTree(range, copyRoot, copyRoot, root);
      contents = range.cloneContents();
    }
    let parent = range.commonAncestorContainer;
    if (parent instanceof Text) {
      parent = parent.parentNode;
    }
    while (parent && parent !== copyRoot) {
      const newContents = parent.cloneNode(false);
      newContents.appendChild(contents);
      contents = newContents;
      parent = parent.parentNode;
    }
    setClipboardData(
      event,
      contents,
      root,
      toCleanHTML,
      toPlainText,
      plainTextOnly
    );
    return true;
  }
  return false;
};
var _onCut = function(event) {
  const range = this.getSelection();
  const root = this._root;
  if (range.collapsed) {
    event.preventDefault();
    return;
  }
  this.saveUndoState(range);
  const handled = extractRangeToClipboard(
    event,
    range,
    root,
    true,
    this._config.willCutCopy,
    null,
    false
  );
  if (!handled) {
    setTimeout(() => {
      try {
        this._ensureBottomLine();
      } catch (error) {
        this._config.didError(error);
      }
    }, 0);
  }
  this.setSelection(range);
};
var _onCopy = function(event) {
  extractRangeToClipboard(
    event,
    this.getSelection(),
    this._root,
    false,
    this._config.willCutCopy,
    null,
    false
  );
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
      if (type === "text/html") {
        htmlItem = item;
      } else if (type === "text/plain" || type === "text/uri-list") {
        plainItem = item;
      } else if (type === "text/rtf") {
        hasRTF = true;
      } else if (/^image\/.*/.test(type)) {
        hasImage = true;
      }
    }
    if (hasImage && !(hasRTF && htmlItem)) {
      event.preventDefault();
      this.fireEvent("pasteImage", {
        clipboardData
      });
      return;
    }
    if (!isLegacyEdge) {
      event.preventDefault();
      if (htmlItem && (!choosePlain || !plainItem)) {
        htmlItem.getAsString((html) => {
          this.insertHTML(html, true);
        });
      } else if (plainItem) {
        plainItem.getAsString((text) => {
          let isLink = false;
          const range2 = this.getSelection();
          if (!range2.collapsed && notWS.test(range2.toString())) {
            const match = this.linkRegExp.exec(text);
            isLink = !!match && match[0].length === text.length;
          }
          if (isLink) {
            this.makeLink(text);
          } else {
            this.insertPlainText(text, true);
          }
        });
      }
      return;
    }
  }
  const types = clipboardData?.types;
  if (!isLegacyEdge && types && (indexOf.call(types, "text/html") > -1 || !isGecko && indexOf.call(types, "text/plain") > -1 && indexOf.call(types, "text/rtf") < 0)) {
    event.preventDefault();
    let data;
    if (!choosePlain && (data = clipboardData.getData("text/html"))) {
      this.insertHTML(data, true);
    } else if ((data = clipboardData.getData("text/plain")) || (data = clipboardData.getData("text/uri-list"))) {
      this.insertPlainText(data, true);
    }
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
        if (first && first === pasteArea.lastChild && first instanceof HTMLDivElement) {
          pasteArea = first;
        }
        html += pasteArea.innerHTML;
      }
      this.setSelection(
        createRange(
          startContainer,
          startOffset,
          endContainer,
          endOffset
        )
      );
      if (html) {
        this.insertHTML(html, true);
      }
    } catch (error) {
      this._config.didError(error);
    }
  }, 0);
};
var _onDrop = function(event) {
  if (!event.dataTransfer) {
    return;
  }
  const types = event.dataTransfer.types;
  let l = types.length;
  let hasPlain = false;
  let hasHTML = false;
  while (l--) {
    switch (types[l]) {
      case "text/plain":
        hasPlain = true;
        break;
      case "text/html":
        hasHTML = true;
        break;
      default:
        return;
    }
  }
  if (hasHTML || hasPlain && this.saveUndoState) {
    this.saveUndoState();
  }
};

// source/keyboard/Enter.ts
var Enter = (self, event, range) => {
  event.preventDefault();
  self.splitBlock(event.shiftKey, range);
};

// source/keyboard/KeyHelpers.ts
var afterDelete = (self, range) => {
  try {
    if (!range) {
      range = self.getSelection();
    }
    let node = range.startContainer;
    if (node instanceof Text) {
      node = node.parentNode;
    }
    let parent = node;
    while (isInline(parent) && (!parent.textContent || parent.textContent === ZWS)) {
      node = parent;
      parent = node.parentNode;
    }
    if (node !== parent) {
      range.setStart(
        parent,
        Array.from(parent.childNodes).indexOf(node)
      );
      range.collapse(true);
      parent.removeChild(node);
      if (!isBlock(parent)) {
        parent = getPreviousBlock(parent, self._root) || self._root;
      }
      fixCursor(parent);
      moveRangeBoundariesDownTree(range);
    }
    if (node === self._root && (node = node.firstChild) && node.nodeName === "BR") {
      detach(node);
    }
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
    if (parent === root || parent.isContentEditable) {
      break;
    }
    node = parent;
  }
  detach(node);
};
var linkifyText = (self, textNode, offset) => {
  if (getNearest(textNode, self._root, "A")) {
    return;
  }
  const data = textNode.data || "";
  const searchFrom = Math.max(
    data.lastIndexOf(" ", offset - 1),
    data.lastIndexOf("\xA0", offset - 1)
  ) + 1;
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
    if (index) {
      textNode = textNode.splitText(index);
    }
    const defaultAttributes = self._config.tagAttributes.a;
    const link = createElement(
      "A",
      Object.assign(
        {
          href: match[1] ? /^(?:ht|f)tps?:/i.test(match[1]) ? match[1] : "http://" + match[1] : "mailto:" + match[0]
        },
        defaultAttributes
      )
    );
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

// source/keyboard/Backspace.ts
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
    if (!startBlock) {
      return;
    }
    let current = startBlock;
    fixContainer(current.parentNode, root);
    const previous = getPreviousBlock(current, root);
    if (previous) {
      if (!previous.isContentEditable) {
        detachUneditableNode(previous, root);
        return;
      }
      mergeWithBlock(previous, current, range, root);
      current = previous.parentNode;
      while (current !== root && !current.nextSibling) {
        current = current.parentNode;
      }
      if (current !== root && (current = current.nextSibling)) {
        mergeContainers(current, root);
      }
      self.setSelection(range);
    } else if (current) {
      if (getNearest(current, root, "UL") || getNearest(current, root, "OL")) {
        self.decreaseListLevel(range);
        return;
      } else if (getNearest(current, root, "BLOCKQUOTE")) {
        self.removeQuote(range);
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

// source/keyboard/Delete.ts
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
    if (!current) {
      return;
    }
    fixContainer(current.parentNode, root);
    next = getNextBlock(current, root);
    if (next) {
      if (!next.isContentEditable) {
        detachUneditableNode(next, root);
        return;
      }
      mergeWithBlock(current, next, range, root);
      next = current.parentNode;
      while (next !== root && !next.nextSibling) {
        next = next.parentNode;
      }
      if (next !== root && (next = next.nextSibling)) {
        mergeContainers(next, root);
      }
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

// source/keyboard/Tab.ts
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

// source/keyboard/Space.ts
var Space = (self, _, range) => {
  let node;
  const root = self._root;
  self._recordUndoState(range);
  self._getRangeAndRemoveBookmark(range);
  if (!range.collapsed) {
    deleteContentsOfRange(range, root);
    self._ensureBottomLine();
    self.setSelection(range);
    self._updatePath(range, true);
  }
  node = range.endContainer;
  if (range.endOffset === getLength(node)) {
    do {
      if (node.nodeName === "A") {
        range.setStartAfter(node);
        break;
      }
    } while (!node.nextSibling && (node = node.parentNode) && node !== root);
  }
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

// source/keyboard/KeyHandlers.ts
var keys = {
  8: "Backspace",
  9: "Tab",
  13: "Enter",
  27: "Escape",
  32: "Space",
  33: "PageUp",
  34: "PageDown",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  46: "Delete",
  191: "/",
  219: "[",
  220: "\\",
  221: "]"
};
var _onKey = function(event) {
  const code = event.keyCode;
  let key = keys[code];
  let modifiers = "";
  const range = this.getSelection();
  if (event.defaultPrevented) {
    return;
  }
  if (!key) {
    key = String.fromCharCode(code).toLowerCase();
    if (!/^[A-Za-z0-9]$/.test(key)) {
      key = "";
    }
  }
  if (111 < code && code < 124) {
    key = "F" + (code - 111);
  }
  if (key !== "Backspace" && key !== "Delete") {
    if (event.altKey) {
      modifiers += "Alt-";
    }
    if (event.ctrlKey) {
      modifiers += "Ctrl-";
    }
    if (event.metaKey) {
      modifiers += "Meta-";
    }
    if (event.shiftKey) {
      modifiers += "Shift-";
    }
  }
  if (isWin && event.shiftKey && key === "Delete") {
    modifiers += "Shift-";
  }
  key = modifiers + key;
  if (this._keyHandlers[key]) {
    this._keyHandlers[key](this, event, range);
  } else if (!range.collapsed && // !event.isComposing stops us from blatting Kana-Kanji conversion in
  // Safari
  !event.isComposing && !event.ctrlKey && !event.metaKey && (event.key || key).length === 1) {
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
  "Space": Space,
  "ArrowLeft"(self) {
    self._removeZWS();
  },
  "ArrowRight"(self, event, range) {
    self._removeZWS();
    const root = self.getRoot();
    if (rangeDoesEndAtBlockBoundary(range, root)) {
      moveRangeBoundariesDownTree(range);
      let node = range.endContainer;
      do {
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
      } while (!node.nextSibling && (node = node.parentNode) && node !== root);
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
    if (self.hasFormat(tag, null, range)) {
      self.changeFormat(null, { tag }, range);
    } else {
      self.changeFormat({ tag }, remove, range);
    }
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
  if (!/(?:^|>)UL/.test(path)) {
    self.makeUnorderedList();
  } else {
    self.removeList();
  }
};
keyHandlers[ctrlKey + "Shift-9"] = (self, event) => {
  event.preventDefault();
  const path = self.getPath();
  if (!/(?:^|>)OL/.test(path)) {
    self.makeOrderedList();
  } else {
    self.removeList();
  }
};
keyHandlers[ctrlKey + "["] = (self, event) => {
  event.preventDefault();
  const path = self.getPath();
  if (/(?:^|>)BLOCKQUOTE/.test(path) || !/(?:^|>)[OU]L/.test(path)) {
    self.decreaseQuoteLevel();
  } else {
    self.decreaseListLevel();
  }
};
keyHandlers[ctrlKey + "]"] = (self, event) => {
  event.preventDefault();
  const path = self.getPath();
  if (/(?:^|>)BLOCKQUOTE/.test(path) || !/(?:^|>)[OU]L/.test(path)) {
    self.increaseQuoteLevel();
  } else {
    self.increaseListLevel();
  }
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

// source/Editor.ts
var Squire = class {
  _root;
  _config;
  _isFocused;
  _lastSelection;
  _willRestoreSelection;
  _mayHaveZWS;
  _lastAnchorNode;
  _lastFocusNode;
  _path;
  _events;
  _undoIndex;
  _undoStack;
  _undoStackLength;
  _isInUndoState;
  _ignoreChange;
  _ignoreAllChanges;
  _isShiftDown;
  _keyHandlers;
  _mutation;
  constructor(root, config) {
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
    this.addEventListener(
      "keydown",
      _monitorShiftKey
    );
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
    try {
      document.execCommand("enableObjectResizing", false, "false");
      document.execCommand("enableInlineTableEditing", false, "false");
    } catch (_) {
    }
    this.addEventListener(
      "beforeinput",
      this._beforeInput
    );
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
        // -1 means no threshold
        undoLimit: -1
        // -1 means no limit
      },
      addLinks: true,
      willCutCopy: null,
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
      case "insertText":
        if (isAndroid && event.data && event.data.includes("\n")) {
          event.preventDefault();
        }
        break;
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
        if (alignment === "full") {
          alignment = "justify";
        }
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
        if (dir === "null") {
          dir = null;
        }
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
  // --- Events
  handleEvent(event) {
    this.fireEvent(event.type, event);
  }
  fireEvent(type, detail) {
    let handlers = this._events.get(type);
    if (/^(?:focus|blur)/.test(type)) {
      const isFocused = this._root === document.activeElement;
      if (type === "focus") {
        if (!isFocused || this._isFocused) {
          return this;
        }
        this._isFocused = true;
      } else {
        if (isFocused || !this._isFocused) {
          return this;
        }
        this._isFocused = false;
      }
    }
    if (handlers) {
      const event = detail instanceof Event ? detail : new CustomEvent(type, {
        detail
      });
      handlers = handlers.slice();
      for (const handler of handlers) {
        try {
          if ("handleEvent" in handler) {
            handler.handleEvent(event);
          } else {
            handler.call(this, event);
          }
        } catch (error) {
          this._config.didError(error);
        }
      }
    }
    return this;
  }
  /**
   * Subscribing to these events won't automatically add a listener to the
   * document node, since these events are fired in a custom manner by the
   * editor code.
   */
  customEvents = /* @__PURE__ */ new Set([
    "pathChange",
    "select",
    "input",
    "pasteImage",
    "undoStateChange"
  ]);
  addEventListener(type, fn) {
    let handlers = this._events.get(type);
    let target = this._root;
    if (!handlers) {
      handlers = [];
      this._events.set(type, handlers);
      if (!this.customEvents.has(type)) {
        if (type === "selectionchange") {
          target = document;
        }
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
        while (l--) {
          if (handlers[l] === fn) {
            handlers.splice(l, 1);
          }
        }
      } else {
        handlers.length = 0;
      }
      if (!handlers.length) {
        this._events.delete(type);
        if (!this.customEvents.has(type)) {
          if (type === "selectionchange") {
            target = document;
          }
          target.removeEventListener(type, this, true);
        }
      }
    }
    return this;
  }
  // --- Focus
  focus() {
    this._root.focus({ preventScroll: true });
    return this;
  }
  blur() {
    this._root.blur();
    return this;
  }
  // --- Selection and bookmarking
  _enableRestoreSelection() {
    this._willRestoreSelection = true;
  }
  _disableRestoreSelection() {
    this._willRestoreSelection = false;
  }
  _restoreSelection() {
    if (this._willRestoreSelection) {
      this.setSelection(this._lastSelection);
    }
  }
  // ---
  _removeZWS() {
    if (!this._mayHaveZWS) {
      return;
    }
    removeZWS(this._root);
    this._mayHaveZWS = false;
  }
  // ---
  startSelectionId = "squire-selection-start";
  endSelectionId = "squire-selection-end";
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
      const startOffset = Array.from(startContainer.childNodes).indexOf(
        start
      );
      let endOffset = Array.from(endContainer.childNodes).indexOf(end);
      if (startContainer === endContainer) {
        endOffset -= 1;
      }
      start.remove();
      end.remove();
      if (!range) {
        range = document.createRange();
      }
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      mergeInlines(startContainer, range);
      if (startContainer !== endContainer) {
        mergeInlines(endContainer, range);
      }
      if (range.collapsed) {
        startContainer = range.startContainer;
        if (startContainer instanceof Text) {
          endContainer = startContainer.childNodes[range.startOffset];
          if (!endContainer || !(endContainer instanceof Text)) {
            endContainer = startContainer.childNodes[range.startOffset - 1];
          }
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
      if (startContainer && isLeaf(startContainer)) {
        range.setStartBefore(startContainer);
      }
      if (endContainer && isLeaf(endContainer)) {
        range.setEndBefore(endContainer);
      }
    }
    if (range && root.contains(range.commonAncestorContainer)) {
      this._lastSelection = range;
    } else {
      range = this._lastSelection;
      if (!document.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    if (!range) {
      range = createRange(root.firstElementChild || root, 0);
    }
    return range;
  }
  setSelection(range) {
    this._lastSelection = range;
    if (!this._isFocused) {
      this._enableRestoreSelection();
    } else {
      const selection = window.getSelection();
      if (selection) {
        if ("setBaseAndExtent" in Selection.prototype) {
          selection.setBaseAndExtent(
            range.startContainer,
            range.startOffset,
            range.endContainer,
            range.endOffset
          );
        } else {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    return this;
  }
  // ---
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
  // ---
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
  // --- Path
  getPath() {
    return this._path;
  }
  _updatePathOnEvent() {
    if (this._isFocused) {
      this._updatePath(this.getSelection());
    }
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
        this.fireEvent("pathChange", {
          path: newPath
        });
      }
    }
    this.fireEvent(range.collapsed ? "cursor" : "select", {
      range
    });
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
        if (id) {
          path += "#" + id;
        }
        if (classNames.length) {
          path += ".";
          path += classNames.join(".");
        }
        if (dir) {
          path += "[dir=" + dir + "]";
        }
        if (classList.contains(styleNames.highlight)) {
          path += "[backgroundColor=" + node.style.backgroundColor.replace(/ /g, "") + "]";
        }
        if (classList.contains(styleNames.color)) {
          path += "[color=" + node.style.color.replace(/ /g, "") + "]";
        }
        if (classList.contains(styleNames.fontFamily)) {
          path += "[fontFamily=" + node.style.fontFamily.replace(/ /g, "") + "]";
        }
        if (classList.contains(styleNames.fontSize)) {
          path += "[fontSize=" + node.style.fontSize + "]";
        }
      }
    }
    return path;
  }
  // --- History
  modifyDocument(modificationFn) {
    const mutation = this._mutation;
    if (mutation) {
      if (mutation.takeRecords().length) {
        this._docWasChanged();
      }
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
    if (this._ignoreAllChanges) {
      return;
    }
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
    if (!this._isInUndoState || replace) {
      let undoIndex = this._undoIndex;
      const undoStack = this._undoStack;
      const undoConfig = this._config.undo;
      const undoThreshold = undoConfig.documentSizeThreshold;
      const undoLimit = undoConfig.undoLimit;
      if (!replace) {
        undoIndex += 1;
      }
      if (undoIndex < this._undoStackLength) {
        undoStack.length = this._undoStackLength = undoIndex;
      }
      if (range) {
        this._saveRangeToBookmark(range);
      }
      const html = this._getRawHTML();
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
    if (!range) {
      range = this.getSelection();
    }
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
      if (range) {
        this.setSelection(range);
      }
      this._isInUndoState = true;
      this.fireEvent("undoStateChange", {
        canUndo: this._undoIndex !== 0,
        canRedo: true
      });
      this.fireEvent("input");
    }
    return this;
  }
  redo() {
    const undoIndex = this._undoIndex;
    const undoStackLength = this._undoStackLength;
    if (undoIndex + 1 < undoStackLength && this._isInUndoState) {
      this._undoIndex += 1;
      this._setRawHTML(this._undoStack[this._undoIndex]);
      const range = this._getRangeAndRemoveBookmark();
      if (range) {
        this.setSelection(range);
      }
      this.fireEvent("undoStateChange", {
        canUndo: true,
        canRedo: undoIndex + 2 < undoStackLength
      });
      this.fireEvent("input");
    }
    return this;
  }
  // --- Get and set data
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
      if (child) {
        node.replaceChild(block, child);
      } else {
        node.appendChild(block);
      }
    } else {
      while (node = getNextBlock(node, root)) {
        fixCursor(node);
      }
    }
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
    if (withBookmark) {
      this._getRangeAndRemoveBookmark(range);
    }
    return html;
  }
  setHTML(html) {
    const frag = this._config.sanitizeToDOMFragment(html, this);
    const root = this._root;
    cleanTree(frag, this._config);
    cleanupBRs(frag, root, false);
    fixContainer(frag, root);
    let node = frag;
    let child = node.firstChild;
    if (!child || child.nodeName === "BR") {
      const block = this.createDefaultBlock();
      if (child) {
        node.replaceChild(block, child);
      } else {
        node.appendChild(block);
      }
    } else {
      while (node = getNextBlock(node, root)) {
        fixCursor(node);
      }
    }
    this._ignoreChange = true;
    while (child = root.lastChild) {
      root.removeChild(child);
    }
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
      if (config.addLinks) {
        this.addDetectedLinks(frag, frag);
      }
      cleanTree(frag, this._config);
      cleanupBRs(frag, root, false);
      removeEmptyInlines(frag);
      frag.normalize();
      let node = frag;
      while (node = getNextBlock(node, frag)) {
        fixCursor(node);
      }
      let doInsert = true;
      if (isPaste) {
        const event = new CustomEvent("willPaste", {
          detail: {
            fragment: frag
          }
        });
        this.fireEvent("willPaste", event);
        frag = event.detail.fragment;
        doInsert = !event.defaultPrevented;
      }
      if (doInsert) {
        insertTreeFragmentIntoRange(range, frag, root);
        range.collapse(false);
        moveRangeBoundaryOutOf(range, "A", root);
        this._ensureBottomLine();
      }
      this.setSelection(range);
      this._updatePath(range, true);
      if (isPaste) {
        this.focus();
      }
    } catch (error) {
      this._config.didError(error);
    }
    return this;
  }
  insertElement(el, range) {
    if (!range) {
      range = this.getSelection();
    }
    range.collapse(true);
    if (isInline(el)) {
      insertNodeInRange(range, el);
      range.setStartAfter(el);
    } else {
      const root = this._root;
      const startNode = getStartBlockOfRange(
        range,
        root
      );
      let splitNode = startNode || root;
      let nodeAfterSplit = null;
      while (splitNode !== root && !splitNode.nextSibling) {
        splitNode = splitNode.parentNode;
      }
      if (splitNode !== root) {
        const parent = splitNode.parentNode;
        nodeAfterSplit = split(
          parent,
          splitNode.nextSibling,
          root,
          root
        );
      }
      if (startNode && isEmptyBlock(startNode)) {
        detach(startNode);
      }
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
    const img = createElement(
      "IMG",
      Object.assign(
        {
          src
        },
        attributes
      )
    );
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
        startContainer.insertBefore(
          text,
          startContainer.childNodes[offset]
        );
        textNode = text;
        offset = 0;
      } else {
        textNode = startContainer;
      }
      let doInsert = true;
      if (isPaste) {
        const event = new CustomEvent("willPaste", {
          detail: {
            text: plainText
          }
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
    for (const attr in attributes) {
      openBlock += " " + attr + '="' + escapeHTML(attributes[attr]) + '"';
    }
    openBlock += ">";
    for (let i = 0, l = lines.length; i < l; i += 1) {
      let line = lines[i];
      line = escapeHTML(line).replace(/ (?=(?: |$))/g, "&nbsp;");
      if (i) {
        line = openBlock + (line || "<BR>") + closeBlock;
      }
      lines[i] = line;
    }
    return this.insertHTML(lines.join(""), isPaste);
  }
  getSelectedText() {
    const range = this.getSelection();
    if (range.collapsed) {
      return "";
    }
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const walker = new TreeIterator(
      range.commonAncestorContainer,
      SHOW_ELEMENT_OR_TEXT,
      (node2) => {
        return isNodeContainedInRange(range, node2, true);
      }
    );
    walker.currentNode = startContainer;
    let node = startContainer;
    let textContent = "";
    let addedTextInBlock = false;
    let value;
    if (!(node instanceof Element) && !(node instanceof Text) || !walker.filter(node)) {
      node = walker.nextNode();
    }
    while (node) {
      if (node instanceof Text) {
        value = node.data;
        if (value && /\S/.test(value)) {
          if (node === endContainer) {
            value = value.slice(0, range.endOffset);
          }
          if (node === startContainer) {
            value = value.slice(range.startOffset);
          }
          textContent += value;
          addedTextInBlock = true;
        }
      } else if (node.nodeName === "BR" || addedTextInBlock && !isInline(node)) {
        textContent += "\n";
        addedTextInBlock = false;
      }
      node = walker.nextNode();
    }
    return textContent;
  }
  // --- Inline formatting
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
    if (!range) {
      range = this.getSelection();
    }
    let seenAttributes = 0;
    let element = range.commonAncestorContainer;
    if (range.collapsed || element instanceof Text) {
      if (element instanceof Text) {
        element = element.parentNode;
      }
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
    if (!attributes) {
      attributes = {};
    }
    if (!range) {
      range = this.getSelection();
    }
    if (!range.collapsed && range.startContainer instanceof Text && range.startOffset === range.startContainer.length && range.startContainer.nextSibling) {
      range.setStartBefore(range.startContainer.nextSibling);
    }
    if (!range.collapsed && range.endContainer instanceof Text && range.endOffset === 0 && range.endContainer.previousSibling) {
      range.setEndAfter(range.endContainer.previousSibling);
    }
    const root = this._root;
    const common = range.commonAncestorContainer;
    if (getNearest(common, root, tag, attributes)) {
      return true;
    }
    if (common instanceof Text) {
      return false;
    }
    const walker = new TreeIterator(common, SHOW_TEXT, (node2) => {
      return isNodeContainedInRange(range, node2, true);
    });
    let seenNode = false;
    let node;
    while (node = walker.nextNode()) {
      if (!getNearest(node, root, tag, attributes)) {
        return false;
      }
      seenNode = true;
    }
    return seenNode;
  }
  changeFormat(add, remove, range, partial) {
    if (!range) {
      range = this.getSelection();
    }
    this.saveUndoState(range);
    if (remove) {
      range = this._removeFormat(
        remove.tag.toUpperCase(),
        remove.attributes || {},
        range,
        partial
      );
    }
    if (add) {
      range = this._addFormat(
        add.tag.toUpperCase(),
        add.attributes || {},
        range
      );
    }
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
      while (isInline(block)) {
        block = block.parentNode;
      }
      removeZWS(block, el);
    } else {
      const walker = new TreeIterator(
        range.commonAncestorContainer,
        SHOW_ELEMENT_OR_TEXT,
        (node) => {
          return (node instanceof Text || node.nodeName === "BR" || node.nodeName === "IMG") && isNodeContainedInRange(range, node, true);
        }
      );
      let { startContainer, startOffset, endContainer, endOffset } = range;
      walker.currentNode = startContainer;
      if (!(startContainer instanceof Element) && !(startContainer instanceof Text) || !walker.filter(startContainer)) {
        const next = walker.nextNode();
        if (!next) {
          return range;
        }
        startContainer = next;
        startOffset = 0;
      }
      do {
        let node = walker.currentNode;
        const needsFormat = !getNearest(node, root, tag, attributes);
        if (needsFormat) {
          if (node === endContainer && node.length > endOffset) {
            node.splitText(endOffset);
          }
          if (node === startContainer && startOffset) {
            node = node.splitText(startOffset);
            if (endContainer === startContainer) {
              endContainer = node;
              endOffset -= startOffset;
            } else if (endContainer === startContainer.parentNode) {
              endOffset += 1;
            }
            startContainer = node;
            startOffset = 0;
          }
          const el = createElement(tag, attributes);
          replaceWith(node, el);
          el.appendChild(node);
        }
      } while (walker.nextNode());
      range = createRange(
        startContainer,
        startOffset,
        endContainer,
        endOffset
      );
    }
    return range;
  }
  _removeFormat(tag, attributes, range, partial) {
    this._saveRangeToBookmark(range);
    let fixer;
    if (range.collapsed) {
      if (cantFocusEmptyTextNodes) {
        fixer = document.createTextNode(ZWS);
      } else {
        fixer = document.createTextNode("");
      }
      insertNodeInRange(range, fixer);
    }
    let root = range.commonAncestorContainer;
    while (isInline(root)) {
      root = root.parentNode;
    }
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    const toWrap = [];
    const examineNode = (node, exemplar) => {
      if (isNodeContainedInRange(range, node, false)) {
        return;
      }
      let child;
      let next;
      if (!isNodeContainedInRange(range, node, true)) {
        if (!(node instanceof HTMLInputElement) && (!(node instanceof Text) || node.data)) {
          toWrap.push([exemplar, node]);
        }
        return;
      }
      if (node instanceof Text) {
        if (node === endContainer && endOffset !== node.length) {
          toWrap.push([exemplar, node.splitText(endOffset)]);
        }
        if (node === startContainer && startOffset) {
          node.splitText(startOffset);
          toWrap.push([exemplar, node]);
        }
      } else {
        for (child = node.firstChild; child; child = next) {
          next = child.nextSibling;
          examineNode(child, exemplar);
        }
      }
    };
    const formatTags = Array.from(
      root.getElementsByTagName(tag)
    ).filter((el) => {
      return isNodeContainedInRange(range, el, true) && hasTagAttributes(el, tag, attributes);
    });
    if (!partial) {
      formatTags.forEach((node) => {
        examineNode(node, node);
      });
    }
    toWrap.forEach(([el, node]) => {
      el = el.cloneNode(false);
      replaceWith(node, el);
      el.appendChild(node);
    });
    formatTags.forEach((el) => {
      replaceWith(el, empty(el));
    });
    this._getRangeAndRemoveBookmark(range);
    if (fixer) {
      range.collapse(false);
    }
    mergeInlines(root, range);
    return range;
  }
  // ---
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
  // ---
  makeLink(url, attributes) {
    const range = this.getSelection();
    if (range.collapsed) {
      let protocolEnd = url.indexOf(":") + 1;
      if (protocolEnd) {
        while (url[protocolEnd] === "/") {
          protocolEnd += 1;
        }
      }
      insertNodeInRange(
        range,
        document.createTextNode(url.slice(protocolEnd))
      );
    }
    attributes = Object.assign(
      {
        href: url
      },
      this._config.tagAttributes.a,
      attributes
    );
    return this.changeFormat(
      {
        tag: "A",
        attributes
      },
      {
        tag: "A"
      },
      range
    );
  }
  removeLink() {
    return this.changeFormat(
      null,
      {
        tag: "A"
      },
      this.getSelection(),
      true
    );
  }
  /*
  linkRegExp = new RegExp(
      // Only look on boundaries
      '\\b(?:' +
      // Capture group 1: URLs
      '(' +
          // Add links to URLS
          // Starts with:
          '(?:' +
              // http(s):// or ftp://
              '(?:ht|f)tps?:\\/\\/' +
              // or
              '|' +
              // www.
              'www\\d{0,3}[.]' +
              // or
              '|' +
              // foo90.com/
              '[a-z0-9][a-z0-9.\\-]*[.][a-z]{2,}\\/' +
          ')' +
          // Then we get one or more:
          '(?:' +
              // Run of non-spaces, non ()<>
              '[^\\s()<>]+' +
              // or
              '|' +
              // balanced parentheses (one level deep only)
              '\\([^\\s()<>]+\\)' +
          ')+' +
          // And we finish with
          '(?:' +
              // Not a space or punctuation character
              '[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]' +
              // or
              '|' +
              // Balanced parentheses.
              '\\([^\\s()<>]+\\)' +
          ')' +
      // Capture group 2: Emails
      ')|(' +
          // Add links to emails
          '[\\w\\-.%+]+@(?:[\\w\\-]+\\.)+[a-z]{2,}\\b' +
          // Allow query parameters in the mailto: style
          '(?:' +
              '[?][^&?\\s]+=[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]+' +
              '(?:&[^&?\\s]+=[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]+)*' +
          ')?' +
      '))',
      'i'
  );
  */
  linkRegExp = /\b(?:((?:(?:ht|f)tps?:\/\/|www\d{0,3}[.]|[a-z0-9][a-z0-9.\-]*[.][a-z]{2,}\/)(?:[^\s()<>]+|\([^\s()<>]+\))+(?:[^\s?&`!()\[\]{};:'".,<>«»“”‘’]|\([^\s()<>]+\)))|([\w\-.%+]+@(?:[\w\-]+\.)+[a-z]{2,}\b(?:[?][^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+(?:&[^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+)*)?))/i;
  addDetectedLinks(searchInNode, root) {
    const walker = new TreeIterator(
      searchInNode,
      SHOW_TEXT,
      (node2) => !getNearest(node2, root || this._root, "A")
    );
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
        if (index) {
          parent.insertBefore(
            document.createTextNode(data.slice(0, index)),
            node
          );
        }
        const child = createElement(
          "A",
          Object.assign(
            {
              href: match[1] ? /^(?:ht|f)tps?:/i.test(match[1]) ? match[1] : "http://" + match[1] : "mailto:" + match[0]
            },
            defaultAttributes
          )
        );
        child.textContent = data.slice(index, endIndex);
        parent.insertBefore(child, node);
        node.data = data = data.slice(endIndex);
      }
    }
    return this;
  }
  // ---
  setFontFace(name) {
    const className = this._config.classNames.fontFamily;
    return this.changeFormat(
      name ? {
        tag: "SPAN",
        attributes: {
          class: className,
          style: "font-family: " + name + ", sans-serif;"
        }
      } : null,
      {
        tag: "SPAN",
        attributes: { class: className }
      }
    );
  }
  setFontSize(size) {
    const className = this._config.classNames.fontSize;
    return this.changeFormat(
      size ? {
        tag: "SPAN",
        attributes: {
          class: className,
          style: "font-size: " + (typeof size === "number" ? size + "px" : size)
        }
      } : null,
      {
        tag: "SPAN",
        attributes: { class: className }
      }
    );
  }
  setTextColor(color) {
    const className = this._config.classNames.color;
    return this.changeFormat(
      color ? {
        tag: "SPAN",
        attributes: {
          class: className,
          style: "color:" + color
        }
      } : null,
      {
        tag: "SPAN",
        attributes: { class: className }
      }
    );
  }
  setHighlightColor(color) {
    const className = this._config.classNames.highlight;
    return this.changeFormat(
      color ? {
        tag: "SPAN",
        attributes: {
          class: className,
          style: "background-color:" + color
        }
      } : null,
      {
        tag: "SPAN",
        attributes: { class: className }
      }
    );
  }
  // --- Block formatting
  _ensureBottomLine() {
    const root = this._root;
    const last = root.lastElementChild;
    if (!last || last.nodeName !== this._config.blockTag || !isBlock(last)) {
      root.appendChild(this.createDefaultBlock());
    }
  }
  createDefaultBlock(children) {
    const config = this._config;
    return fixCursor(
      createElement(config.blockTag, config.blockAttributes, children)
    );
  }
  tagAfterSplit = {
    DT: "DD",
    DD: "DT",
    LI: "LI",
    PRE: "PRE"
  };
  splitBlock(lineBreakOnly, range) {
    if (!range) {
      range = this.getSelection();
    }
    const root = this._root;
    let block;
    let parent;
    let node;
    let nodeAfterSplit;
    this._recordUndoState(range);
    this._removeZWS();
    this._getRangeAndRemoveBookmark(range);
    if (!range.collapsed) {
      deleteContentsOfRange(range, root);
    }
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
        nodeAfterSplit = split(
          node,
          offset2 && offset2 - 1,
          root,
          root
        );
        node = nodeAfterSplit.previousSibling;
        if (!node.textContent) {
          detach(node);
        }
        node = this.createDefaultBlock();
        nodeAfterSplit.parentNode.insertBefore(node, nodeAfterSplit);
        if (!nodeAfterSplit.textContent) {
          detach(nodeAfterSplit);
        }
        range.setStart(node, 0);
      } else {
        node.insertData(offset2, "\n");
        fixCursor(parent);
        if (node.length === offset2 + 1) {
          range.setStartAfter(node);
        } else {
          range.setStart(node, offset2 + 1);
        }
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
    if (parent = getNearest(block, root, "LI")) {
      block = parent;
    }
    if (isEmptyBlock(block)) {
      if (getNearest(block, root, "UL") || getNearest(block, root, "OL")) {
        this.decreaseListLevel(range);
        return this;
      } else if (getNearest(block, root, "BLOCKQUOTE")) {
        this.removeQuote(range);
        return this;
      }
    }
    node = range.startContainer;
    const offset = range.startOffset;
    let splitTag = this.tagAfterSplit[block.nodeName];
    nodeAfterSplit = split(
      node,
      offset,
      block.parentNode,
      this._root
    );
    const config = this._config;
    let splitProperties = null;
    if (!splitTag) {
      splitTag = config.blockTag;
      splitProperties = config.blockAttributes;
    }
    if (!hasTagAttributes(nodeAfterSplit, splitTag, splitProperties)) {
      block = createElement(splitTag, splitProperties);
      if (nodeAfterSplit.dir) {
        block.dir = nodeAfterSplit.dir;
      }
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
        if (!next || next.nodeName === "BR") {
          break;
        }
        detach(child);
        child = next;
      }
      if (!child || child.nodeName === "BR" || child instanceof Text) {
        break;
      }
      nodeAfterSplit = child;
    }
    range = createRange(nodeAfterSplit, 0);
    this.setSelection(range);
    this._updatePath(range, true);
    return this;
  }
  forEachBlock(fn, mutates, range) {
    if (!range) {
      range = this.getSelection();
    }
    if (mutates) {
      this.saveUndoState(range);
    }
    const root = this._root;
    let start = getStartBlockOfRange(range, root);
    const end = getEndBlockOfRange(range, root);
    if (start && end) {
      do {
        if (fn(start) || start === end) {
          break;
        }
      } while (start = getNextBlock(start, root));
    }
    if (mutates) {
      this.setSelection(range);
      this._updatePath(range, true);
    }
    return this;
  }
  modifyBlocks(modify, range) {
    if (!range) {
      range = this.getSelection();
    }
    this._recordUndoState(range, this._isInUndoState);
    const root = this._root;
    expandRangeToBlockBoundaries(range, root);
    moveRangeBoundariesUpTree(range, root, root, root);
    const frag = extractContentsOfRange(range, root, root);
    if (!range.collapsed) {
      let node = range.endContainer;
      if (node === root) {
        range.collapse(false);
      } else {
        while (node.parentNode !== root) {
          node = node.parentNode;
        }
        range.setStartBefore(node);
        range.collapse(true);
      }
    }
    insertNodeInRange(range, modify.call(this, frag));
    if (range.endOffset < range.endContainer.childNodes.length) {
      mergeContainers(
        range.endContainer.childNodes[range.endOffset],
        root
      );
    }
    mergeContainers(
      range.startContainer.childNodes[range.startOffset],
      root
    );
    this._getRangeAndRemoveBookmark(range);
    this.setSelection(range);
    this._updatePath(range, true);
    return this;
  }
  // ---
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
      if (direction) {
        block.dir = direction;
      } else {
        block.removeAttribute("dir");
      }
    }, true);
    return this.focus();
  }
  // ---
  _getListSelection(range, root) {
    let list = range.commonAncestorContainer;
    let startLi = range.startContainer;
    let endLi = range.endContainer;
    while (list && list !== root && !/^[OU]L$/.test(list.nodeName)) {
      list = list.parentNode;
    }
    if (!list || list === root) {
      return null;
    }
    if (startLi === list) {
      startLi = startLi.childNodes[range.startOffset];
    }
    if (endLi === list) {
      endLi = endLi.childNodes[range.endOffset];
    }
    while (startLi && startLi.parentNode !== list) {
      startLi = startLi.parentNode;
    }
    while (endLi && endLi.parentNode !== list) {
      endLi = endLi.parentNode;
    }
    return [list, startLi, endLi];
  }
  increaseListLevel(range) {
    if (!range) {
      range = this.getSelection();
    }
    const root = this._root;
    const listSelection = this._getListSelection(range, root);
    if (!listSelection) {
      return this.focus();
    }
    let [list, startLi, endLi] = listSelection;
    if (!startLi || startLi === list.firstChild) {
      return this.focus();
    }
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
    if (next) {
      mergeContainers(next, root);
    }
    this._getRangeAndRemoveBookmark(range);
    this.setSelection(range);
    this._updatePath(range, true);
    return this.focus();
  }
  decreaseListLevel(range) {
    if (!range) {
      range = this.getSelection();
    }
    const root = this._root;
    const listSelection = this._getListSelection(range, root);
    if (!listSelection) {
      return this.focus();
    }
    let [list, startLi, endLi] = listSelection;
    if (!startLi) {
      startLi = list.firstChild;
    }
    if (!endLi) {
      endLi = list.lastChild;
    }
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
        if (makeNotList && startLi.nodeName === "LI") {
          startLi = this.createDefaultBlock([empty(startLi)]);
        }
        newParent.insertBefore(startLi, insertBefore);
      } while (startLi = next);
    }
    if (!list.firstChild) {
      detach(list);
    }
    if (insertBefore) {
      mergeContainers(insertBefore, root);
    }
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
        if (node.dir) {
          newLi.dir = node.dir;
        }
        const prev = node.previousSibling;
        if (prev && prev.nodeName === type) {
          prev.appendChild(newLi);
          detach(node);
        } else {
          replaceWith(node, createElement(type, listAttrs, [newLi]));
        }
        newLi.appendChild(empty(node));
        walker.currentNode = newLi;
      } else {
        node = node.parentNode;
        const tag = node.nodeName;
        if (tag !== type && /^[OU]L$/.test(tag)) {
          replaceWith(
            node,
            createElement(type, listAttrs, [empty(node)])
          );
        }
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
        fixContainer(listFrag, root);
        replaceWith(list, listFrag);
      }
      for (let i = 0, l = items.length; i < l; i += 1) {
        const item = items[i];
        if (isBlock(item)) {
          replaceWith(item, this.createDefaultBlock([empty(item)]));
        } else {
          fixContainer(item, root);
          replaceWith(item, empty(item));
        }
      }
      return frag;
    });
    return this.focus();
  }
  // ---
  increaseQuoteLevel(range) {
    this.modifyBlocks(
      (frag) => createElement(
        "BLOCKQUOTE",
        this._config.tagAttributes.blockquote,
        [frag]
      ),
      range
    );
    return this.focus();
  }
  decreaseQuoteLevel(range) {
    this.modifyBlocks((frag) => {
      Array.from(frag.querySelectorAll("blockquote")).filter((el) => {
        return !getNearest(el.parentNode, frag, "BLOCKQUOTE");
      }).forEach((el) => {
        replaceWith(el, empty(el));
      });
      return frag;
    }, range);
    return this.focus();
  }
  removeQuote(range) {
    this.modifyBlocks(
      () => this.createDefaultBlock([
        createElement("INPUT", {
          id: this.startSelectionId,
          type: "hidden"
        }),
        createElement("INPUT", {
          id: this.endSelectionId,
          type: "hidden"
        })
      ]),
      range
    );
    return this.focus();
  }
  // ---
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
          for (let i = 0; i < l; i += 1) {
            brBreaksLine[i] = isLineBreak(nodes[i], false);
          }
          while (l--) {
            const br = nodes[l];
            if (!brBreaksLine[l]) {
              detach(br);
            } else {
              replaceWith(br, document.createTextNode("\n"));
            }
          }
          nodes = node.querySelectorAll("CODE");
          l = nodes.length;
          while (l--) {
            replaceWith(nodes[l], empty(nodes[l]));
          }
          if (output.childNodes.length) {
            output.appendChild(document.createTextNode("\n"));
          }
          output.appendChild(empty(node));
        }
        const textWalker = new TreeIterator(output, SHOW_TEXT);
        while (node = textWalker.nextNode()) {
          node.data = node.data.replace(/ /g, " ");
        }
        output.normalize();
        return fixCursor(
          createElement("PRE", this._config.tagAttributes.pre, [
            output
          ])
        );
      }, range);
      this.focus();
    } else {
      this.changeFormat(
        {
          tag: "CODE",
          attributes: this._config.tagAttributes.code
        },
        null,
        range
      );
    }
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
              contents.appendChild(
                document.createTextNode(value.slice(0, index))
              );
              contents.appendChild(createElement("BR"));
              value = value.slice(index + 1);
            }
            node.parentNode.insertBefore(contents, node);
            node.data = value;
          }
          fixContainer(pre, root);
          replaceWith(pre, empty(pre));
        }
        return frag;
      }, range);
      this.focus();
    } else {
      this.changeFormat(null, { tag: "CODE" }, range);
    }
    return this;
  }
  toggleCode() {
    if (this.hasFormat("PRE") || this.hasFormat("CODE")) {
      this.removeCode();
    } else {
      this.code();
    }
    return this;
  }
  // ---
  _removeFormatting(root, clean) {
    for (let node = root.firstChild, next; node; node = next) {
      next = node.nextSibling;
      if (isInline(node)) {
        if (node instanceof Text || node.nodeName === "BR" || node.nodeName === "IMG") {
          clean.appendChild(node);
          continue;
        }
      } else if (isBlock(node)) {
        clean.appendChild(
          this.createDefaultBlock([
            this._removeFormatting(
              node,
              document.createDocumentFragment()
            )
          ])
        );
        continue;
      }
      this._removeFormatting(node, clean);
    }
    return clean;
  }
  removeAllFormatting(range) {
    if (!range) {
      range = this.getSelection();
    }
    if (range.collapsed) {
      return this.focus();
    }
    const root = this._root;
    let stopNode = range.commonAncestorContainer;
    while (stopNode && !isBlock(stopNode)) {
      stopNode = stopNode.parentNode;
    }
    if (!stopNode) {
      expandRangeToBlockBoundaries(range, root);
      stopNode = root;
    }
    if (stopNode instanceof Text) {
      return this.focus();
    }
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

// source/Squire.ts
var Squire_default = Squire;
export {
  Squire_default as default
};
