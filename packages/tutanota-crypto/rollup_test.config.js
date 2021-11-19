import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
	external: ["ospec"],
	input: 'test/Suite.js',
	plugins: [
		babel({babelHelpers: 'bundled'}),
		nodeResolve({
			preferBuiltins: true,
		}),
		commonjs({
			transformMixedEsModules: true,
		}),
	],
	output: [
		{
			dir: 'build/test',
			format: 'es',
			sourcemap: true,
			// dont preserve module structure or we get errors when trying to run
			preserveModules: false,
			exports: "named"
		},
	],
	treeshake: false,
}