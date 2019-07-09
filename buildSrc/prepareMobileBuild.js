const fs = require("fs")
const glob = require("glob")

function prepareFiles(buildType) {
	console.log("prepare mobile build for build type", buildType)
	let prefix
	switch (buildType) {
		case "dist":
			prefix = "build/dist/"
			break
		case "build":
			prefix = "build/"
			break
		default:
			throw new Error("Unknown build type " + buildType)
	}

	const imagesPath = prefix + "images"
	if (fs.existsSync(imagesPath)) {
		const imageFiles = glob.sync(prefix + "images/*")
		for (let file of imageFiles) {
			console.log("unlinking ", file)
			fs.unlinkSync(file)
		}
		fs.rmdirSync(imagesPath)
		console.log("rm ", imagesPath)
	} else {
		console.log("No folder at", imagesPath)
	}

	const maps = glob.sync(prefix + "*.js.map")
	for (let file of maps) {
		console.log("unlinking ", file)
		fs.unlinkSync(file)
	}
	const indexHtmlPath = prefix + "index.html"
	if (fs.existsSync(indexHtmlPath)) {
		fs.unlinkSync(indexHtmlPath)
		console.log("rm ", indexHtmlPath)
	} else {
		console.log("no file at", indexHtmlPath)
	}
}

module.exports = prepareFiles

if (require.main === module) {
	prepareFiles(process.argv[2])
}
