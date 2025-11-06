export default {
	meta: {
		type: "problem",
		docs: {
			description: "ensures valid mithril selectors",
		},
		fixable: "code",
		schema: [], // no options
	},
	create: function (context) {
		return {
			CallExpression: function (node) {
				if (!isMithrilCall(node)) return
				// context.report({
				// 	node,
				// 	message: "never return plx",
				// })
			},
			// callback functions
		}
	},
}

function isMithrilCall(node) {
	const callee = node.callee
	const firstArg = node.arguments[0]
	// this _will_ have false positives unless we implement some resolution to figure out where "m" is defined.
	return callee.type === "Identifier" && callee.name === "m" && firstArg != null
}

function checkMithrilCall(context, node) {
	const callee = node.callee
	const firstArg = node.arguments[0]
}
