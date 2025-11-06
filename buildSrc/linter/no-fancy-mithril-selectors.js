export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "RULE THE WORLD",
		},
		fixable: "code",
		schema: [], // no options
	},
	create: function (context) {
		return {
			ReturnStatement: function (node) {
				// context.report({
				// 	node,
				// 	message: "never return plx",
				// })
			},
			// callback functions
		}
	},
}
