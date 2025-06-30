!function (e, t) {
	"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = e || self).esquery = t()
}(this, (function () {
	"use strict";

	function getIsSymbolFn(t) {
		return (getIsSymbolFn = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
			return typeof e
		} : function (e) {
			return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
		})(t)
	}

	function isIterableDestruct(e, t) {
		return function (e) {
			if (Array.isArray(e)) return e
		}(e) || function (e, t) {
			var r = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
			if (null != r) {
				var n, o, a, i, s = [], u = !0, l = !1;
				try {
					if (a = (r = r.call(e)).next, 0 === t) {
						if (Object(r) !== r) return;
						u = !1
					} else for (; !(u = (n = a.call(r)).done) && (s.push(n.value), s.length !== t); u = !0) ;
				} catch (e) {
					l = !0, o = e
				} finally {
					try {
						if (!u && null != r.return && (i = r.return(), Object(i) !== i)) return
					} finally {
						if (l) throw o
					}
				}
				return s
			}
		}(e, t) || testSomeKindOfObj(e, t) || function () {
			throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
		}()
	}

	function spreadIterable(e) {
		return function (e) {
			if (Array.isArray(e)) return arrayCopy(e)
		}(e) || function (e) {
			if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e)
		}(e) || testSomeKindOfObj(e) || function () {
			throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
		}()
	}

	function testSomeKindOfObj(e, t) {
		if (e) {
			if ("string" == typeof e) return arrayCopy(e, t);
			var r = Object.prototype.toString.call(e).slice(8, -1);
			return "Object" === r && e.constructor && (r = e.constructor.name), "Map" === r || "Set" === r ? Array.from(e) : "Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? arrayCopy(e, t) : void 0
		}
	}

	function arrayCopy(e, t) {
		(null == t || t > e.length) && (t = e.length);
		for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
		return n
	}

	"undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self && self;

	function prepareExports(e, t) {
		return e(t = {exports: {}}, t.exports), t.exports
	}

	var estraverse = prepareExports((function (e, t) {
		!function e(estraverseExports) {
			var objWithAllExpr, VisitorOption, VisitorKeys, breakSignal, skipSignal, removeSignal;

			function deepCopy(e) {
				var t, r, n = {};
				for (t in e) e.hasOwnProperty(t) && (r = e[t], n[t] = "object" == typeof r && null !== r ? deepCopy(r) : r);
				return n
			}

			function ClassWithParentAndKey(e, t) {
				this.parent = e, this.key = t
			}

			function Context(e, t, r, n) {
				this.node = e, this.path = t, this.wrap = r, this.ref = n
			}

			function Parser() {
			}

			function isNonNullableObject(e) {
				return null != e && ("object" == typeof e && "string" == typeof e.type)
			}

			function objExprOrPatternWithProperties(e, t) {
				return (e === objWithAllExpr.ObjectExpression || e === objWithAllExpr.ObjectPattern) && "properties" === t
			}

			function nodeContaienrsEqual(e, t) {
				for (var r = e.length - 1; r >= 0; --r) if (e[r].node === t) return !0;
				return !1
			}

			function doTraverse(e, t) {
				return (new Parser).traverse(e, t)
			}

			function extendCommentRange(eWithRange, arr) {
				var r;
				return r = function (arr, cb) {
					var r, n, o, a;
					for (n = arr.length, o = 0; n;) cb(arr[a = o + (r = n >>> 1)]) ? n = r : (o = a + 1, n -= r + 1);
					return o
				}(arr, (function (t) {
					return t.range[0] > eWithRange.range[0]
				})), eWithRange.extendedRange = [eWithRange.range[0], eWithRange.range[1]], r !== arr.length && (eWithRange.extendedRange[1] = arr[r].range[0]), (r -= 1) >= 0 && (eWithRange.extendedRange[0] = arr[r].range[1]), eWithRange
			}

			return objWithAllExpr = {
				AssignmentExpression: "AssignmentExpression",
				AssignmentPattern: "AssignmentPattern",
				ArrayExpression: "ArrayExpression",
				ArrayPattern: "ArrayPattern",
				ArrowFunctionExpression: "ArrowFunctionExpression",
				AwaitExpression: "AwaitExpression",
				BlockStatement: "BlockStatement",
				BinaryExpression: "BinaryExpression",
				BreakStatement: "BreakStatement",
				CallExpression: "CallExpression",
				CatchClause: "CatchClause",
				ChainExpression: "ChainExpression",
				ClassBody: "ClassBody",
				ClassDeclaration: "ClassDeclaration",
				ClassExpression: "ClassExpression",
				ComprehensionBlock: "ComprehensionBlock",
				ComprehensionExpression: "ComprehensionExpression",
				ConditionalExpression: "ConditionalExpression",
				ContinueStatement: "ContinueStatement",
				DebuggerStatement: "DebuggerStatement",
				DirectiveStatement: "DirectiveStatement",
				DoWhileStatement: "DoWhileStatement",
				EmptyStatement: "EmptyStatement",
				ExportAllDeclaration: "ExportAllDeclaration",
				ExportDefaultDeclaration: "ExportDefaultDeclaration",
				ExportNamedDeclaration: "ExportNamedDeclaration",
				ExportSpecifier: "ExportSpecifier",
				ExpressionStatement: "ExpressionStatement",
				ForStatement: "ForStatement",
				ForInStatement: "ForInStatement",
				ForOfStatement: "ForOfStatement",
				FunctionDeclaration: "FunctionDeclaration",
				FunctionExpression: "FunctionExpression",
				GeneratorExpression: "GeneratorExpression",
				Identifier: "Identifier",
				IfStatement: "IfStatement",
				ImportExpression: "ImportExpression",
				ImportDeclaration: "ImportDeclaration",
				ImportDefaultSpecifier: "ImportDefaultSpecifier",
				ImportNamespaceSpecifier: "ImportNamespaceSpecifier",
				ImportSpecifier: "ImportSpecifier",
				Literal: "Literal",
				LabeledStatement: "LabeledStatement",
				LogicalExpression: "LogicalExpression",
				MemberExpression: "MemberExpression",
				MetaProperty: "MetaProperty",
				MethodDefinition: "MethodDefinition",
				ModuleSpecifier: "ModuleSpecifier",
				NewExpression: "NewExpression",
				ObjectExpression: "ObjectExpression",
				ObjectPattern: "ObjectPattern",
				PrivateIdentifier: "PrivateIdentifier",
				Program: "Program",
				Property: "Property",
				PropertyDefinition: "PropertyDefinition",
				RestElement: "RestElement",
				ReturnStatement: "ReturnStatement",
				SequenceExpression: "SequenceExpression",
				SpreadElement: "SpreadElement",
				Super: "Super",
				SwitchStatement: "SwitchStatement",
				SwitchCase: "SwitchCase",
				TaggedTemplateExpression: "TaggedTemplateExpression",
				TemplateElement: "TemplateElement",
				TemplateLiteral: "TemplateLiteral",
				ThisExpression: "ThisExpression",
				ThrowStatement: "ThrowStatement",
				TryStatement: "TryStatement",
				UnaryExpression: "UnaryExpression",
				UpdateExpression: "UpdateExpression",
				VariableDeclaration: "VariableDeclaration",
				VariableDeclarator: "VariableDeclarator",
				WhileStatement: "WhileStatement",
				WithStatement: "WithStatement",
				YieldExpression: "YieldExpression"
			}, VisitorKeys = {
				AssignmentExpression: ["left", "right"],
				AssignmentPattern: ["left", "right"],
				ArrayExpression: ["elements"],
				ArrayPattern: ["elements"],
				ArrowFunctionExpression: ["params", "body"],
				AwaitExpression: ["argument"],
				BlockStatement: ["body"],
				BinaryExpression: ["left", "right"],
				BreakStatement: ["label"],
				CallExpression: ["callee", "arguments"],
				CatchClause: ["param", "body"],
				ChainExpression: ["expression"],
				ClassBody: ["body"],
				ClassDeclaration: ["id", "superClass", "body"],
				ClassExpression: ["id", "superClass", "body"],
				ComprehensionBlock: ["left", "right"],
				ComprehensionExpression: ["blocks", "filter", "body"],
				ConditionalExpression: ["test", "consequent", "alternate"],
				ContinueStatement: ["label"],
				DebuggerStatement: [],
				DirectiveStatement: [],
				DoWhileStatement: ["body", "test"],
				EmptyStatement: [],
				ExportAllDeclaration: ["source"],
				ExportDefaultDeclaration: ["declaration"],
				ExportNamedDeclaration: ["declaration", "specifiers", "source"],
				ExportSpecifier: ["exported", "local"],
				ExpressionStatement: ["expression"],
				ForStatement: ["init", "test", "update", "body"],
				ForInStatement: ["left", "right", "body"],
				ForOfStatement: ["left", "right", "body"],
				FunctionDeclaration: ["id", "params", "body"],
				FunctionExpression: ["id", "params", "body"],
				GeneratorExpression: ["blocks", "filter", "body"],
				Identifier: [],
				IfStatement: ["test", "consequent", "alternate"],
				ImportExpression: ["source"],
				ImportDeclaration: ["specifiers", "source"],
				ImportDefaultSpecifier: ["local"],
				ImportNamespaceSpecifier: ["local"],
				ImportSpecifier: ["imported", "local"],
				Literal: [],
				LabeledStatement: ["label", "body"],
				LogicalExpression: ["left", "right"],
				MemberExpression: ["object", "property"],
				MetaProperty: ["meta", "property"],
				MethodDefinition: ["key", "value"],
				ModuleSpecifier: [],
				NewExpression: ["callee", "arguments"],
				ObjectExpression: ["properties"],
				ObjectPattern: ["properties"],
				PrivateIdentifier: [],
				Program: ["body"],
				Property: ["key", "value"],
				PropertyDefinition: ["key", "value"],
				RestElement: ["argument"],
				ReturnStatement: ["argument"],
				SequenceExpression: ["expressions"],
				SpreadElement: ["argument"],
				Super: [],
				SwitchStatement: ["discriminant", "cases"],
				SwitchCase: ["test", "consequent"],
				TaggedTemplateExpression: ["tag", "quasi"],
				TemplateElement: [],
				TemplateLiteral: ["quasis", "expressions"],
				ThisExpression: [],
				ThrowStatement: ["argument"],
				TryStatement: ["block", "handler", "finalizer"],
				UnaryExpression: ["argument"],
				UpdateExpression: ["argument"],
				VariableDeclaration: ["declarations"],
				VariableDeclarator: ["id", "init"],
				WhileStatement: ["test", "body"],
				WithStatement: ["object", "body"],
				YieldExpression: ["argument"]
			}, VisitorOption = {
				Break: breakSignal = {},
				Skip: skipSignal = {},
				Remove: removeSignal = {}
			}, ClassWithParentAndKey.prototype.replace = function (e) {
				this.parent[this.key] = e
			}, ClassWithParentAndKey.prototype.remove = function () {
				return Array.isArray(this.parent) ? (this.parent.splice(this.key, 1), !0) : (this.replace(null), !1)
			}, Parser.prototype.path = function () {
				var e, t, r, n, o;

				function pushToArrays(e, t) {
					if (Array.isArray(t)) for (r = 0, n = t.length; r < n; ++r) e.push(t[r]); else e.push(t)
				}

				if (!this.__current.path) return null;
				for (o = [], e = 2, t = this.__leavelist.length; e < t; ++e) pushToArrays(o, this.__leavelist[e].path);
				return pushToArrays(o, this.__current.path), o
			}, Parser.prototype.type = function () {
				return this.current().type || this.__current.wrap
			}, Parser.prototype.parents = function () {
				var e, t, r;
				for (r = [], e = 1, t = this.__leavelist.length; e < t; ++e) r.push(this.__leavelist[e].node);
				return r
			}, Parser.prototype.current = function () {
				return this.__current.node
			}, Parser.prototype.__execute = function (e, t) {
				var r, n;
				return n = void 0, r = this.__current, this.__current = t, this.__state = null, e && (n = e.call(this, t.node, this.__leavelist[this.__leavelist.length - 1].node)), this.__current = r, n
			}, Parser.prototype.notify = function (e) {
				this.__state = e
			}, Parser.prototype.skip = function () {
				this.notify(skipSignal)
			}, Parser.prototype.break = function () {
				this.notify(breakSignal)
			}, Parser.prototype.remove = function () {
				this.notify(removeSignal)
			}, Parser.prototype.__initialize = function (rootArg, visitorArg) {
				this.visitor = visitorArg, this.root = rootArg, this.__worklist = [], this.__leavelist = [], this.__current = null, this.__state = null, this.__fallback = null, "iteration" === visitorArg.fallback ? this.__fallback = Object.keys : "function" == typeof visitorArg.fallback && (this.__fallback = visitorArg.fallback), this.__keys = VisitorKeys, visitorArg.keys && (this.__keys = Object.assign(Object.create(this.__keys), visitorArg.keys))
			}, Parser.prototype.traverse = function (rootArg, visitorArg) {
				var workList, n, objWithNode, node, nodeType, l, key, keysLen, nodePartIdx, keys, nodePart, work;
				for (this.__initialize(rootArg, visitorArg), work = {}, workList = this.__worklist, n = this.__leavelist, workList.push(new Context(rootArg, null, null, null)), n.push(new Context(null, null, null, null)); workList.length;) if ((objWithNode = workList.pop()) !== work) {
					if (objWithNode.node) {
						if (l = this.__execute(visitorArg.enter, objWithNode), this.__state === breakSignal || l === breakSignal) return;
						if (workList.push(work), n.push(objWithNode), this.__state === skipSignal || l === skipSignal) continue;
						if (nodeType = (node = objWithNode.node).type || objWithNode.wrap, !(keys = this.__keys[nodeType])) {
							if (!this.__fallback) throw new Error("Unknown node type " + nodeType + ".");
							keys = this.__fallback(node)
						}
						for (keysLen = keys.length; (keysLen -= 1) >= 0;) if (nodePart = node[key = keys[keysLen]]) if (Array.isArray(nodePart)) {
							for (nodePartIdx = nodePart.length; (nodePartIdx -= 1) >= 0;) if (nodePart[nodePartIdx] && !nodeContaienrsEqual(n, nodePart[nodePartIdx])) {
								if (objExprOrPatternWithProperties(nodeType, keys[keysLen])) objWithNode = new Context(nodePart[nodePartIdx], [key, nodePartIdx], "Property", null); else {
									if (!isNonNullableObject(nodePart[nodePartIdx])) continue;
									objWithNode = new Context(nodePart[nodePartIdx], [key, nodePartIdx], null, null)
								}
								workList.push(objWithNode)
							}
						} else if (isNonNullableObject(nodePart)) {
							if (nodeContaienrsEqual(n, nodePart)) continue;
							workList.push(new Context(nodePart, key, null, null))
						}
					}
				} else if (objWithNode = n.pop(), l = this.__execute(visitorArg.leave, objWithNode), this.__state === breakSignal || l === breakSignal) return
			}, Parser.prototype.replace = function (rootArg, visitorArg) {
				var workList, leaveList, node, nodeType, nodeFromExec, context, keysLen, nodePartIdx, keys, nodePart, work, A, key;

				function b(objWithRef) {
					var rLen, n, o, a;
					if (objWithRef.ref.remove()) for (n = objWithRef.ref.key, a = objWithRef.ref.parent, rLen = workList.length; rLen--;) if ((o = workList[rLen]).ref && o.ref.parent === a) {
						if (o.ref.key < n) break;
						--o.ref.key
					}
				}

				for (this.__initialize(rootArg, visitorArg), work = {}, workList = this.__worklist, leaveList = this.__leavelist, context = new Context(rootArg, null, null, new ClassWithParentAndKey(A = {root: rootArg}, "root")), workList.push(context), leaveList.push(context); workList.length;) if ((context = workList.pop()) !== work) {
					if (void 0 !== (nodeFromExec = this.__execute(visitorArg.enter, context)) && nodeFromExec !== breakSignal && nodeFromExec !== skipSignal && nodeFromExec !== removeSignal && (context.ref.replace(nodeFromExec), context.node = nodeFromExec), this.__state !== removeSignal && nodeFromExec !== removeSignal || (b(context), context.node = null), this.__state === breakSignal || nodeFromExec === breakSignal) return A.root;
					if ((node = context.node) && (workList.push(work), leaveList.push(context), this.__state !== skipSignal && nodeFromExec !== skipSignal)) {
						if (nodeType = node.type || context.wrap, !(keys = this.__keys[nodeType])) {
							if (!this.__fallback) throw new Error("Unknown node type " + nodeType + ".");
							keys = this.__fallback(node)
						}
						for (keysLen = keys.length; (keysLen -= 1) >= 0;) if (nodePart = node[key = keys[keysLen]]) if (Array.isArray(nodePart)) {
							for (nodePartIdx = nodePart.length; (nodePartIdx -= 1) >= 0;) if (nodePart[nodePartIdx]) {
								if (objExprOrPatternWithProperties(nodeType, keys[keysLen])) context = new Context(nodePart[nodePartIdx], [key, nodePartIdx], "Property", new ClassWithParentAndKey(nodePart, nodePartIdx)); else {
									if (!isNonNullableObject(nodePart[nodePartIdx])) continue;
									context = new Context(nodePart[nodePartIdx], [key, nodePartIdx], null, new ClassWithParentAndKey(nodePart, nodePartIdx))
								}
								workList.push(context)
							}
						} else isNonNullableObject(nodePart) && workList.push(new Context(nodePart, key, null, new ClassWithParentAndKey(node, key)))
					}
				} else if (context = leaveList.pop(), void 0 !== (nodeFromExec = this.__execute(visitorArg.leave, context)) && nodeFromExec !== breakSignal && nodeFromExec !== skipSignal && nodeFromExec !== removeSignal && context.ref.replace(nodeFromExec), this.__state !== removeSignal && nodeFromExec !== removeSignal || b(context), this.__state === breakSignal || nodeFromExec === breakSignal) return A.root;
				return A.root
			}, estraverseExports.Syntax = objWithAllExpr, estraverseExports.traverse = doTraverse, estraverseExports.replace = function (e, t) {
				return (new Parser).replace(e, t)
			}, estraverseExports.attachComments = function (tree, providedComments, tokens) {
				var comment, len, i, cursor, comments = [];
				if (!tree.range) throw new Error("attachComments needs range information");
				if (!tokens.length) {
					if (providedComments.length) {
						for (i = 0, len = providedComments.length; i < len; i += 1) (comment = deepCopy(providedComments[i])).extendedRange = [0, tree.range[0]], comments.push(comment);
						tree.leadingComments = comments
					}
					return tree
				}
				for (i = 0, len = providedComments.length; i < len; i += 1) comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
				return cursor = 0, doTraverse(tree, {
					enter: function (node) {
						for (var comment; cursor < comments.length && !((comment = comments[cursor]).extendedRange[1] > node.range[0]);) comment.extendedRange[1] === node.range[0] ? (node.leadingComments || (node.leadingComments = []), node.leadingComments.push(comment), comments.splice(cursor, 1)) : cursor += 1;
						return cursor === comments.length ? VisitorOption.Break : comments[cursor].extendedRange[0] > node.range[1] ? VisitorOption.Skip : void 0
					}
				}), cursor = 0, doTraverse(tree, {
					leave: function (node) {
						for (var comment; cursor < comments.length && (comment = comments[cursor], !(node.range[1] < comment.extendedRange[0]));) node.range[1] === comment.extendedRange[0] ? (node.trailingComments || (node.trailingComments = []), node.trailingComments.push(comment), comments.splice(cursor, 1)) : cursor += 1;
						return cursor === comments.length ? VisitorOption.Break : comments[cursor].extendedRange[0] > node.range[1] ? VisitorOption.Skip : void 0
					}
				}), tree
			}, estraverseExports.VisitorKeys = VisitorKeys, estraverseExports.VisitorOption = VisitorOption, estraverseExports.Controller = Parser, estraverseExports.cloneEnvironment = function () {
				return e({})
			}, estraverseExports
		}(t)
	})), s = prepareExports((function (e) {
		e.exports && (e.exports = function () {
			function peg$SyntaxError(messageg, exprected, found, location) {
				this.message = messageg, this.expected = exprected, this.found = found, this.location = location, this.name = "SyntaxError", "function" == typeof Error.captureStackTrace && Error.captureStackTrace(this, peg$SyntaxError)
			}

			return function peg$subclass(child, parent) {
				function ctor() {
					this.constructor = child
				}

				ctor.prototype = parent.prototype, child.prototype = new ctor
			}(peg$SyntaxError, Error), peg$SyntaxError.buildMessage = function (expected, found) {
				var DESCRIBE_EXPECTATION_FNS = {
					literal: function (e) {
						return '"' + literalEscape(e.text) + '"'
					}, class: function (e) {
						var t, r = "";
						for (t = 0; t < e.parts.length; t++) r += e.parts[t] instanceof Array ? classEscape(e.parts[t][0]) + "-" + classEscape(e.parts[t][1]) : classEscape(e.parts[t]);
						return "[" + (e.inverted ? "^" : "") + r + "]"
					}, any: function (e) {
						return "any character"
					}, end: function (e) {
						return "end of input"
					}, other: function (e) {
						return e.description
					}
				};

				function hex(e) {
					return e.charCodeAt(0).toString(16).toUpperCase()
				}

				function literalEscape(e) {
					return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (function (e) {
						return "\\x0" + hex(e)
					})).replace(/[\x10-\x1F\x7F-\x9F]/g, (function (e) {
						return "\\x" + hex(e)
					}))
				}

				function classEscape(e) {
					return e.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (function (e) {
						return "\\x0" + hex(e)
					})).replace(/[\x10-\x1F\x7F-\x9F]/g, (function (e) {
						return "\\x" + hex(e)
					}))
				}

				return "Expected " + function describeExpected(expected) {
					var t, n, o, descriptions = new Array(expected.length);
					for (t = 0; t < expected.length; t++) descriptions[t] = (o = expected[t], DESCRIBE_EXPECTATION_FNS[o.type](o));
					if (descriptions.sort(), descriptions.length > 0) {
						for (t = 1, n = 1; t < descriptions.length; t++) descriptions[t - 1] !== descriptions[t] && (descriptions[n] = descriptions[t], n++);
						descriptions.length = n
					}
					switch (descriptions.length) {
						case 1:
							return descriptions[0];
						case 2:
							return descriptions[0] + " or " + descriptions[1];
						default:
							return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1]
					}
				}(expected) + " but " + function describeFound(e) {
					return e ? '"' + literalEscape(e) + '"' : "end of input"
				}(found) + " found."
			}, {
				SyntaxError: peg$SyntaxError, parse: function peg$parse(input, options) {
					options = void 0 !== options ? options : {};
					var n, o, a, i, pegFAILED = {}, peg$startRuleFunctions = {start: peg$parseStart}, peg$startRuleFunction = peg$parseStart,
						peg$c3_space = peg$literalExpectation(" ", !1), peg$c4_punctuation = /^[^ [\],():#!=><~+.]/,
						peg$c5 = peg$classExpectation([" ", "[", "]", ",", "(", ")", ":", "#", "!", "=", ">", "<", "~", "+", "."], !0, !1),
						peg$c7_ge = peg$literalExpectation(">", !1), pef$c8_tilde = peg$literalExpectation("~", !1),
						peg$c13_plus = peg$literalExpectation("+", !1), peg$c17_comma = peg$literalExpectation(",", !1), peg$c19 = function (e, t) {
							return [e].concat(t.map((function (e) {
								return e[3]
							})))
						}, peg$c22_bang = peg$literalExpectation("!", !1), pegc22_star = peg$literalExpectation("*", !1),
						peg$29_hash = peg$literalExpectation("#", !1), peg$c32_openSqr = peg$literalExpectation("[", !1),
						peg$c33_closeSql = peg$literalExpectation("]", !1), peg$c41 = /^[><!]/, peg$c42_leGe = peg$classExpectation([">", "<", "!"], !1, !1),
						pegEq = peg$literalExpectation("=", !1), peg$c40_prefeq = function (e) {
							return (e || "") + "="
						}, peg$c41 = /^[><]/, peg$c42 = peg$classExpectation([">", "<"], !1, !1), peg$c44_dot = peg$literalExpectation(".", !1),
						peg$c46 = function (e, t, r) {
							return {type: "attribute", name: e, operator: t, value: r}
						}, peg_dquote = peg$literalExpectation('"', !1), peg_ecapedDquoteRegex = /^[^\\"]/,
						pegDquoteClass = peg$classExpectation(["\\", '"'], !0, !1), peg_escapedDquote = peg$literalExpectation("\\", !1),
						peg$anyExpectations = {type: "any"}, peg$c55 = function (e, t) {
							return e + t
						}, peg$c56 = function (e) {
							return {
								type: "literal", value: (t = e.join(""), t.replace(/\\(.)/g, (function (e, t) {
									switch (t) {
										case"b":
											return "\b";
										case"f":
											return "\f";
										case"n":
											return "\n";
										case"r":
											return "\r";
										case"t":
											return "\t";
										case"v":
											return "\v";
										default:
											return t
									}
								})))
							};
							var t
						}, peg_quote = peg$literalExpectation("'", !1), peg$c59 = /^[^\\']/, peg_quotes = peg$classExpectation(["\\", "'"], !0, !1),
						peg_digitsRegex = /^[0-9]/, peg_digits = peg$classExpectation([["0", "9"]], !1, !1), peg_type = peg$literalExpectation("type(", !1),
						peg_closingParenRegggex = /^[^ )]/, peg_spaceOrParent = peg$classExpectation([" ", ")"], !0, !1),
						pegClosingParen = peg$literalExpectation(")", !1), peg_imsuRegex = /^[imsu]/,
						peg_imsu = peg$classExpectation(["i", "m", "s", "u"], !1, !1), peg_dollar = peg$literalExpectation("/", !1),
						peg_slashRegegx = /^[^\/]/, peg_clash = peg$classExpectation(["/"], !0, !1), peg_not = peg$literalExpectation(":not(", !1),
						peg_matches = peg$literalExpectation(":matches(", !1), peg_has = peg$literalExpectation(":has(", !1),
						peg_first_child = peg$literalExpectation(":first-child", !1),
						peg_last_child = peg$literalExpectation(":last-child", !1), peg_nth_child = peg$literalExpectation(":nth-child(", !1),
						peg_last_child = peg$literalExpectation(":nth-last-child(", !1), peg_colon = peg$literalExpectation(":", !1), peg$currentPos = 0,
						peg$detailsCache = [{line: 1, column: 1}], peg$savedPos = 0, peg$maxFailsExpected = [], peg$resultsCache = {};
					if ("startRule" in options) {
						if (!(options.startRule in peg$startRuleFunctions)) throw new Error("Can't start parsing from rule \"" + options.startRule + '".');
						peg$startRuleFunction = peg$startRuleFunctions[options.startRule]
					}

					function peg$literalExpectation(e, t) {
						return {type: "literal", text: e, ignoreCase: t}
					}

					function peg$classExpectation(e, t, r) {
						return {type: "class", parts: e, inverted: t, ignoreCase: r}
					}

					function peg$computePosDetails(e) {
						var r, n = peg$detailsCache[e];
						if (n) return n;
						for (r = e - 1; !peg$detailsCache[r];) r--;
						for (n = {
							line: (n = peg$detailsCache[r]).line,
							column: n.column
						}; r < e;) 10 === input.charCodeAt(r) ? (n.line++, n.column = 1) : n.column++, r++;
						return peg$detailsCache[e] = n, n
					}

					function peg$computeLocation(startPos, endPos) {
						var r = peg$computePosDetails(startPos), n = peg$computePosDetails(endPos);
						return {start: {offset: startPos, line: r.line, column: r.column}, end: {offset: endPos, line: n.line, column: n.column}}
					}

					function peg$fail(e) {
						peg$currentPos < peg$savedPos || (peg$currentPos > peg$savedPos && (peg$savedPos = peg$currentPos, peg$maxFailsExpected = []), peg$maxFailsExpected.push(e))
					}

					function peg$parseStart() {
						var s0, s1, s2, ss, key = 32 * peg$currentPos + 0, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, (s1 = peg$parse_()) !== pegFAILED && (s2 = peg$parseSelectors()) !== pegFAILED && peg$parse_() !== pegFAILED
								? s0 = s1 = 1 === (ss = s2).length
									? ss[0]
									: {
										type: "matches",
										selectors: ss
									}
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, (s1 = peg$parse_()) !== pegFAILED && (s1 = void 0), s0 = s1), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)
					}

					function peg$parse_() {
						var s0, s1, key = 32 * peg$currentPos + 1, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						for (s0 = [], 32 === input.charCodeAt(peg$currentPos)
							? (s1 = " ", peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg$c3_space)); s1 !== pegFAILED;) s0.push(s1), 32 === input.charCodeAt(peg$currentPos)
							? (s1 = " ", peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg$c3_space));
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parseIdentifierName() {
						var s0, s1, s2, key = 32 * peg$currentPos + 2, cache = peg$resultsCache[key];
						if (cache) return peg$currentPos = cache.nextPos, cache.result;
						if (s1 = [], peg$c4_punctuation.test(input.charAt(peg$currentPos))
							? (s2 = input.charAt(peg$currentPos), peg$currentPos++)
							: (s2 = pegFAILED, peg$fail(peg$c5)), s2 !== pegFAILED) for (; s2 !== pegFAILED;) s1.push(s2), peg$c4_punctuation.test(input.charAt(peg$currentPos)) ?
							(s2 = input.charAt(peg$currentPos), peg$currentPos++)
							: (s2 = pegFAILED, peg$fail(peg$c5));
						else s1 = pegFAILED;
						return s1 !== pegFAILED && (s1 = s1.join("")), s0 = s1, peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parseBinaryOp() {
						var s0, s1, s2, key = 32 * peg$currentPos + 3, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, (s1 = peg$parse_()) !== pegFAILED
								? (62 === input.charCodeAt(peg$currentPos)
									? (s2 = ">", peg$currentPos++)
									: (s2 = pegFAILED, peg$fail(peg$c7_ge)), s2 !== pegFAILED && peg$parse_() !== pegFAILED
									? s0 = s1 = "child"
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, (s1 = peg$parse_()) !== pegFAILED
								? (126 === input.charCodeAt(peg$currentPos)
									? (s2 = "~", peg$currentPos++)
									: (s2 = pegFAILED, peg$fail(pef$c8_tilde)), s2 !== pegFAILED && peg$parse_() !== pegFAILED
									? s0 = s1 = "sibling"
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, (s1 = peg$parse_()) !== pegFAILED
								? (43 === input.charCodeAt(peg$currentPos)
									? (s2 = "+", peg$currentPos++)
									: (s2 = pegFAILED, peg$fail(peg$c13_plus)), s2 !== pegFAILED && peg$parse_() !== pegFAILED
									? s0 = s1 = "adjacent"
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, 32 === input.charCodeAt(peg$currentPos) ? (s1 = " ", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg$c3_space)), s1 !== pegFAILED && (s2 = peg$parse_()) !== pegFAILED
								? s0 = s1 = "descendant"
								: (peg$currentPos = s0, s0 = pegFAILED)))), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)
					}

					function peg$parseSelectors() {
						var s0, s1, positions, pos, s4, s5, s6, s7, key = 32 * peg$currentPos + 5, cache = peg$resultsCache[key];
						if (cache) return peg$currentPos = cache.nextPos, cache.result;
						if (s0 = peg$currentPos, (s1 = peg$parseselector()) !== pegFAILED) {
							for (positions = [], pos = peg$currentPos, (s4 = peg$parse_()) !== pegFAILED
								? (44 === input.charCodeAt(peg$currentPos)
									? (s5 = ",", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c17_comma)), s5 !== pegFAILED && (s6 = peg$parse_()) !== pegFAILED && (s7 = peg$parseselector()) !== pegFAILED
									? pos = s4 = [s4, s5, s6, s7]
									: (peg$currentPos = pos, pos = pegFAILED))
								: (peg$currentPos = pos, pos = pegFAILED); pos !== pegFAILED;) positions.push(pos), pos = peg$currentPos, (s4 = peg$parse_()) !== pegFAILED
								? (44 === input.charCodeAt(peg$currentPos)
									? (s5 = ",", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c17_comma)), s5 !== pegFAILED && (s6 = peg$parse_()) !== pegFAILED && (s7 = peg$parseselector()) !== pegFAILED
									? pos = s4 = [s4, s5, s6, s7]
									: (peg$currentPos = pos, pos = pegFAILED))
								: (peg$currentPos = pos, pos = pegFAILED);
							positions !== pegFAILED ? s0 = s1 = peg$c19(s1, positions) : (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parsehasSelector() {
						var s0, s1, s2, op, s, key = 32 * peg$currentPos + 6, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, (s1 = peg$parseBinaryOp()) === pegFAILED && (s1 = null), s1 !== pegFAILED && (s2 = peg$parseselector()) !== pegFAILED ? (s = s2, s0 = s1 = (op = s1) ? {
									type: op,
									left: {type: "exactNode"},
									right: s
								} : s)
								: (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0)
					}

					function peg$parseselector() {
						var s0, s1, s2, s3, s4, s5, i, key = 32 * peg$currentPos + 7, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, (s1 = peg$parseSequence()) !== pegFAILED) {
							for (s2 = [], s3 = peg$currentPos, (s4 = peg$parseBinaryOp()) !== pegFAILED && (s5 = peg$parseSequence()) !== pegFAILED
								? s3 = s4 = [s4, s5]
								: (peg$currentPos = s3, s3 = pegFAILED); s3 !== pegFAILED;) s2.push(s3), s3 = peg$currentPos, (s4 = peg$parseBinaryOp()) !== pegFAILED && (s5 = peg$parseSequence()) !== pegFAILED
								? s3 = s4 = [s4, s5] : (peg$currentPos = s3, s3 = pegFAILED);
							s2 !== pegFAILED ? (i = s1, s0 = s1 = s2.reduce((function (e, t) {
								return {type: t[0], left: e, right: t[1]}
							}), i)) : (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parseSequence() {
						var s0, s1, s2, s3, subject, as, b, key = 32 * peg$currentPos + 8, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, 33 === input.charCodeAt(peg$currentPos) ? (s1 = "!", peg$currentPos++) : (s1 = pegFAILED, peg$fail(peg$c22_bang)), s1 === pegFAILED && (s1 = null), s1 !== pegFAILED) {
							if (s2 = [], (s3 = peg$parseatom()) !== pegFAILED) for (; s3 !== pegFAILED;) s2.push(s3), s3 = peg$parseatom(); else s2 = pegFAILED;
							s2 !== pegFAILED ? (subject = s1, b = 1 === (as = s2).length ? as[0] : {
								type: "compound",
								selectors: as
							}, subject && (b.subject = !0), s0 = s1 = b) : (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parseWildcard() {
						var s0, s1, key = 32 * peg$currentPos + 10, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (42 === input.charCodeAt(peg$currentPos)
								? (s1 = "*", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(pegc22_star)), s1 !== pegFAILED && (s1 = {
								type: "wildcard",
								value: s1
							}), s0 = s1, peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0)
					}

					function peg$parseidentifier() {
						var s0, s1, s2, key = 32 * peg$currentPos + 11, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, 35 === input.charCodeAt(peg$currentPos)
								? (s1 = "#", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg$29_hash)), s1 === pegFAILED && (s1 = null), s1 !== pegFAILED && (s2 = peg$parseIdentifierName()) !== pegFAILED
								? s0 = s1 = {
									type: "identifier",
									value: s2
								}
								: (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0)

					}

					function peg$parseattrEqOps() {
						var s0, s1, s2, key = 32 * peg$currentPos + 14, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, 33 === input.charCodeAt(peg$currentPos)
								? (s1 = "!", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg$c22_bang)), s1 === pegFAILED && (s1 = null), s1 !== pegFAILED
								? (61 === input.charCodeAt(peg$currentPos)
									? (s2 = "=", peg$currentPos++)
									: (s2 = pegFAILED, peg$fail(pegEq)), s2 !== pegFAILED
									? (s1 = peg$c40_prefeq(s1), s0 = s1) : (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)

					}

					function peg$parsetype() {
						var s0, s1, s2, s3, s4, key = 32 * peg$currentPos + 20, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, "type(" === input.substr(peg$currentPos, 5)
							? (s1 = "type(", peg$currentPos += 5)
							: (s1 = pegFAILED, peg$fail(peg_type)), s1 !== pegFAILED) if (peg$parse_() !== pegFAILED) {
							if (s2 = [], peg_closingParenRegggex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_spaceOrParent)), s3 !== pegFAILED) for (; s3 !== pegFAILED;) s2.push(s3), peg_closingParenRegggex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_spaceOrParent));
							else s2 = pegFAILED;
							s2 !== pegFAILED && (s3 = peg$parse_()) !== pegFAILED
								? (41 === input.charCodeAt(peg$currentPos)
									? (s4 = ")", peg$currentPos++)
									: (s4 = pegFAILED, peg$fail(pegClosingParen)), s4 !== pegFAILED
									? (s1 = {
										type: "type",
										value: s2.join("")
									}, s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED; else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parseflags() {
						var s0, s1, key = 32 * peg$currentPos + 21, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = [], peg_imsuRegex.test(input.charAt(peg$currentPos))
							? (s1 = input.charAt(peg$currentPos), peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg_imsu)), s1 !== pegFAILED)
							for (; s1 !== pegFAILED;) s0.push(s1), peg_imsuRegex.test(input.charAt(peg$currentPos))
								? (s1 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg_imsu));
						else s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parseregex() {
						var s0, s1, d, s3, s4, flgs, key = 32 * peg$currentPos + 22, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, 47 === input.charCodeAt(peg$currentPos)
							? (s1 = "/", peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg_dollar)), s1 !== pegFAILED) {
							if (d = [], peg_slashRegegx.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_clash)), s3 !== pegFAILED) for (; s3 !== pegFAILED;) d.push(s3), peg_slashRegegx.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_clash));
							else d = pegFAILED;
							d !== pegFAILED ? (47 === input.charCodeAt(peg$currentPos)
									? (s3 = "/", peg$currentPos++)
									: (s3 = pegFAILED, peg$fail(peg_dollar)), s3 !== pegFAILED
									? ((s4 = peg$parseflags()) === pegFAILED && (s4 = null), s4 !== pegFAILED ? (flgs = s4, s1 = {
											type: "regexp",
											value: new RegExp(d.join(""), flgs ? flgs.join("") : "")
										}, s0 = s1)
										: (peg$currentPos = s0, s0 = pegFAILED))
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$$parseattrOps() {
						var s0, s1, s2, key = 32 * peg$currentPos + 13, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, peg$c41.test(input.charAt(peg$currentPos))
								? (s1 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg$c42_leGe)), s1 === pegFAILED && (s1 = null), s1 !== pegFAILED
								? (61 === input.charCodeAt(peg$currentPos)
									? (s2 = "=", peg$currentPos++)
									: (s2 = pegFAILED, peg$fail(pegEq)), s2 !== pegFAILED
									? (s1 = peg$c40_prefeq(s1), s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (peg$c41.test(input.charAt(peg$currentPos))
								? (s0 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s0 = pegFAILED, peg$fail(peg$c42))), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)

					}

					function peg$parsestring() {
						var s0, s1, s2, s3, s4, s5, key = 32 * peg$currentPos + 17, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, 34 === input.charCodeAt(peg$currentPos)
							? (s1 = '"', peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg_dquote)), s1 !== pegFAILED) {
							for (s2 = [], peg_ecapedDquoteRegex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(pegDquoteClass)), s3 === pegFAILED && (s3 = peg$currentPos, 92 === input.charCodeAt(peg$currentPos)
								? (s4 = "\\", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg_escapedDquote)), s4 !== pegFAILED
								? (input.length > peg$currentPos
									? (s5 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$anyExpectations)), s5 !== pegFAILED ?
									(s4 = peg$c55(s4, s5), s3 = s4)
									: (peg$currentPos = s3, s3 = pegFAILED))
								: (peg$currentPos = s3, s3 = pegFAILED)); s3 !== pegFAILED;) s2.push(s3), peg_ecapedDquoteRegex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(pegDquoteClass)), s3 === pegFAILED && (s3 = peg$currentPos, 92 === input.charCodeAt(peg$currentPos)
								? (s4 = "\\", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg_escapedDquote)), s4 !== pegFAILED
								? (input.length > peg$currentPos
									? (s5 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$anyExpectations)), s5 !== pegFAILED ?
									(s4 = peg$c55(s4, s5), s3 = s4)
									: (peg$currentPos = s3, s3 = pegFAILED))
								: (peg$currentPos = s3, s3 = pegFAILED));
							s2 !== pegFAILED
								? (34 === input.charCodeAt(peg$currentPos)
									? (s3 = '"', peg$currentPos++)
									: (s3 = pegFAILED, peg$fail(peg_dquote)), s3 !== pegFAILED
									? (s1 = peg$c56(s2), s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						if (s0 === pegFAILED) if (s0 = peg$currentPos, 39 === input.charCodeAt(peg$currentPos)
							? (s1 = "'", peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg_quote)), s1 !== pegFAILED) {
							for (s2 = [], peg$c59.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_quotes)), s3 === pegFAILED && (s3 = peg$currentPos, 92 === input.charCodeAt(peg$currentPos)
								? (s4 = "\\", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg_escapedDquote)), s4 !== pegFAILED
								? (input.length > peg$currentPos
									? (s5 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$anyExpectations)), s5 !== pegFAILED ? (s4 = peg$c55(s4, s5), s3 = s4)
									: (peg$currentPos = s3, s3 = pegFAILED))
								: (peg$currentPos = s3, s3 = pegFAILED)); s3 !== pegFAILED;) s2.push(s3), peg$c59.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_quotes)), s3 === pegFAILED && (s3 = peg$currentPos, 92 === input.charCodeAt(peg$currentPos)
								? (s4 = "\\", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg_escapedDquote)), s4 !== pegFAILED
								? (input.length > peg$currentPos
									? (s5 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$anyExpectations)), s5 !== pegFAILED ?
									s4 = peg$c55(s4, s5), s3 = s4)
								: (peg$currentPos = s3, s3 = pegFAILED))
						:
							(peg$currentPos = s3, s3 = pegFAILED)
						)
							;
							s2 !== pegFAILED
								? (39 === input.charCodeAt(peg$currentPos)
									? (s3 = "'", peg$currentPos++)
									: (s3 = pegFAILED, peg$fail(peg_quote)), s3 !== pegFAILED
									? (s1 = peg$c56(s2), s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parsenumber() {
						var s0, s1, s2, s3, a, b, leadingDecimals, key = 32 * peg$currentPos + 18, cache = peg$resultsCache[key];
						if (cache) return peg$currentPos = cache.nextPos, cache.result;
						for (s0 = peg$currentPos, s1 = peg$currentPos, s2 = [], peg_digitsRegex.test(input.charAt(peg$currentPos))
							? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
							: (s3 = pegFAILED, peg$fail(peg_digits)); s3 !== pegFAILED;) s2.push(s3), peg_digitsRegex.test(input.charAt(peg$currentPos))
							? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
							: (s3 = pegFAILED, peg$fail(peg_digits));
						if (s2 !== pegFAILED ? (46 === input.charCodeAt(peg$currentPos)
								? (s3 = ".", peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg$c44_dot)), s3 !== pegFAILED
								? s1 = s2 = [s2, s3]
								: (peg$currentPos = s1, s1 = pegFAILED))
							: (peg$currentPos = s1, s1 = pegFAILED), s1 === pegFAILED && (s1 = null), s1 !== pegFAILED) {
							if (s2 = [], peg_digitsRegex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_digits)), s3 !== pegFAILED) for (; s3 !== pegFAILED;) s2.push(s3), peg_digitsRegex.test(input.charAt(peg$currentPos))
								? (s3 = input.charAt(peg$currentPos), peg$currentPos++)
								: (s3 = pegFAILED, peg$fail(peg_digits)); else s2 = pegFAILED;
							s2 !== pegFAILED ? (b = s2, leadingDecimals = (a = s1) ? [].concat.apply([], a).join("") : "", s1 = {
								type: "literal",
								value: parseFloat(leadingDecimals + b.join(""))
							}, s0 = s1) : (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parsepath() {
						var s0, s1, key = 32 * peg$currentPos + 19, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: ((s1 = peg$parseIdentifierName()) !== pegFAILED && (s1 = {
								type: "literal",
								value: s1
							}), s0 = s1, peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)

					}

					function peg$parseattrValue() {
						var s0, s1, s3, s5, key = 32 * peg$currentPos + 16, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, (s1 = peg$parseattrName()) !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$parseattrEqOps()) !== pegFAILED && peg$parse_() !== pegFAILED
								? ((s5 = peg$parsetype()) === pegFAILED && (s5 = peg$parseregex()), s5 !== pegFAILED
									? (s1 = peg$c46(s1, s3, s5), s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, (s1 = peg$parseattrName()) !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$$parseattrOps()) !== pegFAILED && peg$parse_() !== pegFAILED
								? ((s5 = peg$parsestring()) === pegFAILED && (s5 = peg$parsenumber()) === pegFAILED && (s5 = peg$parsepath()), s5 !== pegFAILED
									? (s1 = peg$c46(s1, s3, s5), s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), s0 === pegFAILED && (s0 = peg$currentPos, (s1 = peg$parseattrName()) !== pegFAILED && (s1 = {
								type: "attribute",
								name: s1
							}), s0 = s1)),
								peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0)
					}

					function peg$parseattr() {
						var s0, s1, s3, s5, key = 32 * peg$currentPos + 12, cached = peg$resultsCache[key];
						return cached ? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, 91 === input.charCodeAt(peg$currentPos)
								? (s1 = "[", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg$c32_openSqr)), s1 !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$parseattrValue()) !== pegFAILED && peg$parse_() !== pegFAILED
								? (93 === input.charCodeAt(peg$currentPos)
									? (s5 = "]", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c33_closeSql)), s5 !== pegFAILED
									? s0 = s1 = s3
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED),
								peg$resultsCache[key] = {
									nextPos: peg$currentPos,
									result: s0
								}, s0)
					}

					function peg$parsefield() {
						var s0, s1, s2, s3, s4, s5, s6, i, key = 32 * peg$currentPos + 23, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, 46 === input.charCodeAt(peg$currentPos)
							? (s1 = ".", peg$currentPos++)
							: (s1 = pegFAILED, peg$fail(peg$c44_dot)), s1 !== pegFAILED)
							if ((s2 = peg$parseIdentifierName()) !== pegFAILED) {
								for (s3 = [], s4 = peg$currentPos, 46 === input.charCodeAt(peg$currentPos) ? (s5 = ".", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c44_dot)),
										 s5 !== pegFAILED && (s6 = peg$parseIdentifierName()) !== pegFAILED
											 ? s4 = s5 = [s5, s6]
											 : (peg$currentPos = s4, s4 = pegFAILED); s4 !== pegFAILED;)
									s3.push(s4), s4 = peg$currentPos,
										46 === input.charCodeAt(peg$currentPos)
											? (s5 = ".", peg$currentPos++)
											: (s5 = pegFAILED, peg$fail(peg$c44_dot)), s5 !== pegFAILED && (s6 = peg$parseIdentifierName()) !== pegFAILED
										? s4 = s5 = [s5, s6]
										: (peg$currentPos = s4, s4 = pegFAILED);
								s3 !== pegFAILED
									? (i = s2, s1 = {
										type: "field", name: s3.reduce((function (memo, p) {
											return memo + p[0] + p[1]
										}), i)
									}, s0 = s1)
									: (peg$currentPos = s0, s0 = pegFAILED)
							} else peg$currentPos = s0, s0 = pegFAILED; else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parsenegation() {
						var s0, s1, s3, s5, key = 32 * peg$currentPos + 24, cache = peg$resultsCache[key];
						return cache ?
							(peg$currentPos = cache.nextPos, cache.result)
							: (s0 = peg$currentPos, ":not(" === input.substr(peg$currentPos, 5)
								? (s1 = ":not(", peg$currentPos += 5)
								: (s1 = pegFAILED, peg$fail(peg_not)), s1 !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$parseSelectors()) !== pegFAILED && peg$parse_() !== pegFAILED
								? (41 === input.charCodeAt(peg$currentPos)
									? (s5 = ")", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(pegClosingParen)), s5 !== pegFAILED
									? s0 = s1 = {
										type: "not",
										selectors: s3
									}
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)

					}

					function peg$parsematches() {
						var s0, s1, s3, s5, key = 32 * peg$currentPos + 25, cached = peg$resultsCache[key];
						return cached ? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, ":matches(" === input.substr(peg$currentPos, 9)
								? (s1 = ":matches(", peg$currentPos += 9)
								: (s1 = pegFAILED, peg$fail(peg_matches)), s1 !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$parseSelectors()) !== pegFAILED && peg$parse_() !== pegFAILED
								? (41 === input.charCodeAt(peg$currentPos) ? (s5 = ")", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(pegClosingParen)), s5 !== pegFAILED ? s0 = s1 = {
									type: "matches",
									selectors: s3
								} : (peg$currentPos = s0, s0 = pegFAILED)) : (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)

					}

					function peg$parseHasSelectors() {
						var s0, s1, s2, s3, s4, s5, s6, s7, key = 32 * peg$currentPos + 4, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, (s1 = peg$parsehasSelector()) !== pegFAILED) {
							for (s2 = [], s3 = peg$currentPos, (s4 = peg$parse_()) !== pegFAILED ? (44 === input.charCodeAt(peg$currentPos)
									? (s5 = ",", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c17_comma)), s5 !== pegFAILED && (s6 = peg$parse_()) !== pegFAILED && (s7 = peg$parsehasSelector()) !== pegFAILED
									? s3 = s4 = [s4, s5, s6, s7]
									: (peg$currentPos = s3, s3 = pegFAILED))
								: (peg$currentPos = s3, s3 = pegFAILED); s3 !== pegFAILED;) s2.push(s3), s3 = peg$currentPos, (s4 = peg$parse_()) !== pegFAILED
								? (44 === input.charCodeAt(peg$currentPos)
									? (s5 = ",", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(peg$c17_comma)), s5 !== pegFAILED && (s6 = peg$parse_()) !== pegFAILED && (s7 = peg$parsehasSelector()) !== pegFAILED
									? s3 = s4 = [s4, s5, s6, s7]
									: (peg$currentPos = s3, s3 = pegFAILED))
								: (peg$currentPos = s3, s3 = pegFAILED);
							s2 !== pegFAILED
								? s0 = s1 = peg$c19(s1, s2)
								: (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function peg$parseHas() {
						var s0, s1, s3, s5, key = 32 * peg$currentPos + 26, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, ":has(" === input.substr(peg$currentPos, 5)
								? (s1 = ":has(", peg$currentPos += 5)
								: (s1 = pegFAILED, peg$fail(peg_has)), s1 !== pegFAILED && peg$parse_() !== pegFAILED && (s3 = peg$parseHasSelectors()) !== pegFAILED && peg$parse_() !== pegFAILED
								? (41 === input.charCodeAt(peg$currentPos)
									? (s5 = ")", peg$currentPos++)
									: (s5 = pegFAILED, peg$fail(pegClosingParen)), s5 !== pegFAILED
									? s0 = s1 = {
										type: "has",
										selectors: s3
									}
									: (peg$currentPos = s0, s0 = pegFAILED))
								: (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)
					}

					function peg$parseFirstChild() {
						var s0, s1, key = 32 * peg$currentPos + 27, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (":first-child" === input.substr(peg$currentPos, 12)
								? (s1 = ":first-child", peg$currentPos += 12)
								: (s1 = pegFAILED, peg$fail(peg_first_child)), s1 !== pegFAILED && (s1 = nth(1)), s0 = s1,
								peg$resultsCache[key] = {
									nextPos: peg$currentPos,
									result: s0
								}, s0)
					}

					function peg$parseLastChild() {
						var s0, s1, key = 32 * peg$currentPos + 28, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (":last-child" === input.substr(peg$currentPos, 11)
								? (s1 = ":last-child", peg$currentPos += 11)
								: (s1 = pegFAILED, peg$fail(peg_last_child)), s1 !== pegFAILED && (s1 = nthLast(1)), s0 = s1,
								peg$resultsCache[key] = {
									nextPos: peg$currentPos,
									result: s0
								}, s0)
					}

					function peg$parsenthChild() {
						var s0, s1, s3, s4, a, key = 32 * peg$currentPos + 29, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, ":nth-child(" === input.substr(peg$currentPos, 11)
							? (s1 = ":nth-child(", peg$currentPos += 11)
							: (s1 = pegFAILED, peg$fail(peg_nth_child)), s1 !== pegFAILED)
							if (peg$parse_() !== pegFAILED) {
								if (s3 = [], peg_digitsRegex.test(input.charAt(peg$currentPos))
									? (s4 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s4 = pegFAILED, peg$fail(peg_digits)), s4 !== pegFAILED)
									for (; s4 !== pegFAILED;) s3.push(s4), peg_digitsRegex.test(input.charAt(peg$currentPos))
										? (s4 = input.charAt(peg$currentPos), peg$currentPos++)
										: (s4 = pegFAILED, peg$fail(peg_digits)); else s3 = pegFAILED;
								s3 !== pegFAILED && (s4 = peg$parse_()) !== pegFAILED
									? (41 === input.charCodeAt(peg$currentPos)
										? (a = ")", peg$currentPos++)
										: (a = pegFAILED, peg$fail(pegClosingParen)), a !== pegFAILED
										? (s1 = nth(parseInt(s3.join(""), 10)), s0 = s1)
										: (peg$currentPos = s0, s0 = pegFAILED))
									: (peg$currentPos = s0, s0 = pegFAILED)
							} else peg$currentPos = s0, s0 = pegFAILED; else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parsenthLastChild() {
						var s0, s1, s3, s4, s5, key = 32 * peg$currentPos + 30, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, ":nth-last-child(" === input.substr(peg$currentPos, 16)
							? (s1 = ":nth-last-child(", peg$currentPos += 16)
							: (s1 = pegFAILED, peg$fail(peg_last_child)), s1 !== pegFAILED)
							if (peg$parse_() !== pegFAILED) {
								if (s3 = [], peg_digitsRegex.test(input.charAt(peg$currentPos))
									? (s4 = input.charAt(peg$currentPos), peg$currentPos++)
									: (s4 = pegFAILED, peg$fail(peg_digits)), s4 !== pegFAILED)
									for (; s4 !== pegFAILED;) s3.push(s4), peg_digitsRegex.test(input.charAt(peg$currentPos))
										? (s4 = input.charAt(peg$currentPos), peg$currentPos++)
										: (s4 = pegFAILED, peg$fail(peg_digits));
								else s3 = pegFAILED;
								s3 !== pegFAILED && (s4 = peg$parse_()) !== pegFAILED
									? (41 === input.charCodeAt(peg$currentPos)
										? (s5 = ")", peg$currentPos++)
										: (s5 = pegFAILED, peg$fail(pegClosingParen)), s5 !== pegFAILED
										? (s1 = nthLast(parseInt(s3.join(""), 10)), s0 = s1)
										: (peg$currentPos = s0, s0 = pegFAILED))
									: (peg$currentPos = s0, s0 = pegFAILED)
							} else peg$currentPos = s0, s0 = pegFAILED; else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0

					}

					function peg$parseclass() {
						var s0, s1, n, key = 32 * peg$currentPos + 31, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: (s0 = peg$currentPos, 58 === input.charCodeAt(peg$currentPos)
								? (s1 = ":", peg$currentPos++)
								: (s1 = pegFAILED, peg$fail(peg_colon)), s1 !== pegFAILED && (n = peg$parseIdentifierName()) !== pegFAILED
								? s0 = s1 = {
									type: "class",
									name: n
								} : (peg$currentPos = s0, s0 = pegFAILED), peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0)

					}

					function peg$parseatom() {
						var s0, key = 32 * peg$currentPos + 9, cached = peg$resultsCache[key];
						return cached
							? (peg$currentPos = cached.nextPos, cached.result)
							: ((s0 = peg$parseWildcard()) === pegFAILED && (s0 = peg$parseidentifier()) === pegFAILED && (s0 = peg$parseattr()) === pegFAILED && (s0 = peg$parsefield()) === pegFAILED && (s0 = peg$parsenegation()) === pegFAILED && (s0 = peg$parsematches()) === pegFAILED && (s0 = peg$parseHas()) === pegFAILED && (s0 = peg$parseFirstChild()) === pegFAILED && (s0 = peg$parseLastChild()) === pegFAILED && (s0 = peg$parsenthChild()) === pegFAILED && (s0 = peg$parsenthLastChild()) === pegFAILED && (s0 = peg$parseclass()), peg$resultsCache[key] = {
								nextPos: peg$currentPos,
								result: s0
							}, s0)
					}

					function peg$parseattrName() {
						var s0, s1, s2, s3, s4, s5, a, as, key = 32 * peg$currentPos + 15, cached = peg$resultsCache[key];
						if (cached) return peg$currentPos = cached.nextPos, cached.result;
						if (s0 = peg$currentPos, (s1 = peg$parseIdentifierName()) !== pegFAILED) {
							for (s2 = [], s3 = peg$currentPos, 46 === input.charCodeAt(peg$currentPos)
								? (s4 = ".", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg$c44_dot)), s4 !== pegFAILED && (s5 = peg$parseIdentifierName()) !== pegFAILED
								? s3 = s4 = [s4, s5]
								: (peg$currentPos = s3, s3 = pegFAILED); s3 !== pegFAILED;) s2.push(s3), s3 = peg$currentPos, 46 === input.charCodeAt(peg$currentPos)
								? (s4 = ".", peg$currentPos++)
								: (s4 = pegFAILED, peg$fail(peg$c44_dot)), s4 !== pegFAILED && (s5 = peg$parseIdentifierName()) !== pegFAILED
								? s3 = s4 = [s4, s5]
								: (peg$currentPos = s3, s3 = pegFAILED);
							s2 !== pegFAILED ? (a = s1, as = s2, s0 = s1 = [].concat.apply([a], as).join("")) : (peg$currentPos = s0, s0 = pegFAILED)
						} else peg$currentPos = s0, s0 = pegFAILED;
						return peg$resultsCache[key] = {nextPos: peg$currentPos, result: s0}, s0
					}

					function nth(e) {
						return {type: "nth-child", index: {type: "literal", value: e}}
					}

					function nthLast(e) {
						return {type: "nth-last-child", index: {type: "literal", value: e}}
					}

					if ((n = peg$startRuleFunction()) !== pegFAILED && peg$currentPos === input.length) return n;
					throw n !== pegFAILED && peg$currentPos < input.length && peg$fail({type: "end"}), o = peg$maxFailsExpected, a = peg$savedPos < input.length
						? input.charAt(peg$savedPos)
						: null, i = peg$savedPos < input.length
						? peg$computeLocation(peg$savedPos, peg$savedPos + 1)
						: peg$computeLocation(peg$savedPos, peg$savedPos), new peg$SyntaxError(peg$SyntaxError.buildMessage(o, a), o, a, i)
				}
			}
		}())
	}));

	function getPath(obj, keys) {
		for (var r = 0; r < keys.length; ++r) {
			if (null == obj) return obj;
			obj = obj[keys[r]]
		}
		return obj
	}

	var WEKMAP_CACHE = "function" == typeof WeakMap ? new WeakMap : null;

	function getMatcher(selector) {
		if (null == selector) return function () {
			return true
		};
		if (null != WEKMAP_CACHE) {
			var matcher = WEKMAP_CACHE.get(selector);
			return null != matcher || (matcher = generateMatcher(selector), WEKMAP_CACHE.set(selector, matcher)), matcher
		}
		return generateMatcher(selector)
	}

	function generateMatcher(selector) {
		switch (selector.type) {
			case"wildcard":
				return function () {
					return !0
				};
			case"identifier":
				var r = selector.value.toLowerCase();
				return function (node, ancestry, options) {
					var o = options && options.nodeTypeKey || "type";
					return r === node[o].toLowerCase()
				};
			case"exactNode":
				return function (node, ancestry) {
					return 0 === ancestry.length
				};
			case"field":
				var path = selector.name.split(".");
				return function (node, ancestry) {
					return function inPath$1(node, ancestor, path, fromPathIndex) {
						for (var current = ancestor, i = fromPathIndex; i < path.length; ++i) {
							if (null == current) return !1;
							var field = current[path[i]];
							if (Array.isArray(field)) {
								for (var u = 0; u < field.length; ++u) if (e(node, field[u], path, i + 1)) return !0;
								return !1
							}
							current = field
						}
						return node === current
					}(node, ancestry[path.length - 1], path, 0)
				};
			case"matches":
				var matchers = selector.selectors.map(getMatcher);
				return function (node, ancestry, options) {
					for (var n = 0; n < matchers.length; ++n) if (matchers[n](node, ancestry, options)) return !0;
					return !1
				};
			case"compound":
				var matchers = selector.selectors.map(getMatcher);
				return function (node, ancestry, options) {
					for (var n = 0; n < matchers.length; ++n) if (!matchers[n](node, ancestry, options)) return !1;
					return !0
				};
			case"not":
				var compound = selector.selectors.map(getMatcher);
				return function (node, ancestry, options) {
					for (var n = 0; n < compound.length; ++n) if (compound[n](node, ancestry, options)) return !1;
					return !0
				};
			case"has":
				var matchers = selector.selectors.map(getMatcher);
				return function (node, ancestry, options) {
					var result = !1, a = [];
					return estraverse.traverse(node, {
						enter: function (node, parent) {
							null != parent && a.unshift(parent);
							for (var a = 0; a < matchers.length; ++a) if (matchers[a](node, a, options)) return result = !0, void this.break()
						}, leave: function () {
							a.shift()
						}, keys: options && options.visitorKeys, fallback: options && options.fallback || "iteration"
					}), result
				};
			case"child":
				var left = getMatcher(selector.left), right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					return !!(ancestry.length > 0 && right(node, ancestry, options)) && left(ancestry[0], ancestry.slice(1), options)
				};
			case"descendant":
				var left = getMatcher(selector.left), right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					if (right(node, ancestry, options)) for (var n = 0, o = t.length; n < o; ++n) if (left(ancestry[n], ancestry.slice(n + 1), options)) return !0;
					return !1
				};
			case"attribute":
				var path = selector.name.split(".");
				switch (selector.operator) {
					case void 0:
						return function (e) {
							return null != getPath(e, path)
						};
					case"=":
						switch (selector.value.type) {
							case"regexp":
								return function (e) {
									var r = getPath(e, path);
									return "string" == typeof r && selector.value.value.test(r)
								};
							case"literal":
								var literal = "".concat(selector.value.value);
								return function (node) {
									return literal === "".concat(getPath(node, path))
								};
							case"type":
								return function (node) {
									return selector.value.value === getIsSymbolFn(getPath(node, path))
								}
						}
						throw new Error("Unknown selector value type: ".concat(selector.value.type));
					case"!=":
						switch (selector.value.type) {
							case"regexp":
								return function (node) {
									return !selector.value.value.test(getPath(node, path))
								};
							case"literal":
								var literal = "".concat(selector.value.value);
								return function (node) {
									return literal !== "".concat(getPath(node, path))
								};
							case"type":
								return function (node) {
									return selector.value.value !== getIsSymbolFn(getPath(node, path))
								}
						}
						throw new Error("Unknown selector value type: ".concat(selector.value.type));
					case"<=":
						return function (node) {
							return getPath(node, path) <= selector.value.value
						};
					case"<":
						return function (node) {
							return getPath(node, path) < selector.value.value
						};
					case">":
						return function (node) {
							return getPath(node, path) > selector.value.value
						};
					case">=":
						return function (node) {
							return getPath(node, path) >= selector.value.value
						}
				}
				throw new Error("Unknown operator: ".concat(selector.operator));
			case"sibling":
				var left = getMatcher(selector.left), right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					return right(node, ancestry, options) && sibling(node, left, ancestry, "LEFT_SIDE", options) || selector.left.subject && left(node, ancestry, options) && sibling(node, right, ancestry, "RIGHT_SIDE", options)
				};
			case"adjacent":
				var left = getMatcher(selector.left), right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					return right(node, ancestry, options) && adjacent(node, left, ancestry, "LEFT_SIDE", options) || selector.right.subject && left(node, ancestry, options) && adjacent(node, right, ancestry, "RIGHT_SIDE", options)
				};
			case"nth-child":
				var nth = selector.index.value, right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					return right(node, ancestry, options) && nthChild(node, ancestry, nth, options)
				};
			case"nth-last-child":
				var nth = -selector.index.value, right = getMatcher(selector.right);
				return function (node, ancestry, options) {
					return right(node, ancestry, options) && nthChild(node, ancestry, nth, options)
				};
			case"class":
				var name = selector.name.toLowerCase();
				return function (node, ancestry, options) {
					if (options && options.matchClass) return options.matchClass(selector.name, node, ancestry);
					if (options && options.nodeTypeKey) return !1;
					switch (name) {
						case"statement":
							if ("Statement" === node.type.slice(-9)) return !0;
						case"declaration":
							return "Declaration" === node.type.slice(-11);
						case"pattern":
							if ("Pattern" === node.type.slice(-7)) return !0;
						case"expression":
							return "Expression" === node.type.slice(-10) || "Literal" === node.type.slice(-7) || "Identifier" === node.type && (0 === ancestry.length || "MetaProperty" !== ancestry[0].type) || "MetaProperty" === node.type;
						case"function":
							return "FunctionDeclaration" === node.type || "FunctionExpression" === node.type || "ArrowFunctionExpression" === node.type
					}
					throw new Error("Unknown class name: ".concat(selector.name))
				}
		}
		throw new Error("Unknown selector type: ".concat(selector.type))
	}

	function getVisitorKeys(node, options) {
		var nodeTypeKey = options && options.nodeTypeKey || "type", nodeType = node[nodeTypeKey];
		return options && options.visitorKeys && options.visitorKeys[nodeType] ? options.visitorKeys[nodeType] : estraverse.VisitorKeys[nodeType] ? estraverse.VisitorKeys[nodeType] : options && "function" == typeof options.fallback ? options.fallback(node) : Object.keys(node).filter((function (key) {
			return key !== nodeTypeKey
		}))
	}

	function isNode(node, options) {
		var n = options && options.nodeTypeKey || "type";
		return null !== node && "object" === getIsSymbolFn(node) && "string" == typeof node[n]
	}

	function sibling(node, matcher, ancestry, side, options) {
		var parent = isIterableDestruct(ancestry, 1)[0];
		if (!parent) return !1;
		for (var keys = getVisitorKeys(parent, options), u = 0; u < keys.length; ++u) {
			var listProp = parent[keys[u]];
			if (Array.isArray(listProp)) {
				var startIndex = listProp.indexOf(node);
				if (startIndex < 0) continue;
				var lowerBound = void 0, upperBound = void 0;
				"LEFT_SIDE" === side ? (lowerBound = 0, upperBound = startIndex) : (lowerBound = startIndex + 1, upperBound = listProp.length);
				for (var d = lowerBound; d < upperBound; ++d) if (isNode(listProp[d], options) && matcher(listProp[d], ancestry, options)) return !0
			}
		}
		return !1
	}

	function adjacent(node, matcher, ancestry, side, options) {
		var parent = isIterableDestruct(ancestry, 1)[0];
		if (!parent) return !1;
		for (var s = getVisitorKeys(parent, options), u = 0; u < s.length; ++u) {
			var listProp = parent[s[u]];
			if (Array.isArray(listProp)) {
				var idx = idx.indexOf(node);
				if (idx < 0) continue;
				if ("LEFT_SIDE" === side && idx > 0 && isNode(idx[idx - 1], options) && matcher(idx[idx - 1], ancestry, options)) return !0;
				if ("RIGHT_SIDE" === side && idx < idx.length - 1 && isNode(idx[idx + 1], options) && matcher(idx[idx + 1], ancestry, options)) return !0
			}
		}
		return !1
	}

	function nthChild(e, r, n, o) {
		if (0 === n) return !1;
		var a = isIterableDestruct(r, 1)[0];
		if (!a) return !1;
		for (var i = getVisitorKeys(a, o), s = 0; s < i.length; ++s) {
			var u = a[i[s]];
			if (Array.isArray(u)) {
				var l = n < 0 ? u.length + n : n - 1;
				if (l >= 0 && l < u.length && u[l] === e) return !0
			}
		}
		return !1
	}

	function traverse(ast, selector, visitor, options) {
		if (selector) {
			var ancestry = [], matcher = getMatcher(selector), allSubjects = function t(n, o) {
				if (null == n || "object" != getIsSymbolFn(n)) return [];
				null == o && (o = n);
				for (var a = n.subject ? [o] : [], i = Object.keys(n), s = 0; s < i.length; ++s) {
					var u = i[s], l = n[u];
					a.push.apply(a, spreadIterable(t(l, "left" === u ? l : o)))
				}
				return a
			}(selector).map(getMatcher);
			estraverse.traverse(ast, {
				enter: function (node, parent) {
					if (null != parent && ancestry.unshift(parent), matcher(node, ancestry, options)) if (allSubjects.length) for (var r = 0, n = allSubjects.length; r < n; ++r) {
						allSubjects[r](node, ancestry, options) && visitor(node, parent, ancestry);
						for (var i = 0, c = ancestry.length; i < c; ++i) {
							var succeedingAncestry = ancestry.slice(i + 1);
							allSubjects[r](ancestry[i], succeedingAncestry, options) && visitor(ancestry[i], parent, succeedingAncestry)
						}
					} else visitor(node, parent, ancestry)
				}, leave: function () {
					ancestry.shift()
				}, keys: options && options.visitorKeys, fallback: options && options.fallback || "iteration"
			})
		}
	}

	function match(ast, selector, options) {
		var results = [];
		return traverse(ast, selector, (function (e) {
			results.push(e)
		}), options), results
	}

	function parse(selector) {
		return s.parse(selector)
	}

	function query(ast, selector, options) {
		return match(ast, parse(selector), options)
	}

	return query.parse = parse, query.match = match, query.traverse = traverse, query.matches = function (node, selector, ancestry, options) {
		return !selector || !!node && (ancestry || (ancestry = []), getMatcher(selector)(node, ancestry, options))
	}, query.query = query, query
}));
//# sourceMappingURL=esquery.min.js.map
