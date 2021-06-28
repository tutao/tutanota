# Tutanota Build Tools
## Synopsis
The easiest way to use the build tools, is to set up a build server using `BuildServerClient.js`:

	import {BuildServerClient} from "./buildSrc/BuildServerClient.js"

	const buildServerClient = new BuildServerClient()

	buildServerClient.buildWithServer({
		forceRestart: true,
		builder: path.resolve("./buildSrc/Builder.js"),
		watchFolders: opts.watch ? [path.resolve("src")] : null,
		buildOpts: {clean: true},
		webRoot: path.resolve(('../build')),
		spaRedirect: true,
	})
	.then(
		console.log("Build finished")
	)
	.catch(
		console.log("Build failed")
	)

You also need to provide a builder with an appropriate `build()` function:

	export async function build({clean}, {devServerPort, watchFolders}, log) {
		// Build specific parameter passed from buildWithServer()
		if (clean) {
			doClean()
		}
		// use the provided log method to appenend to build server log file and print to STDOUT
		log("Starting build")
		return generateBundles()
	}

## Components

### Build Server
The build server (`BuildServer.js`) provides all functionality to build our code. This includes running a local devServer,
watching for changes in source code and re-triggering builds. It can be used programatically from javascript code and
invoked via the commandline (using `BuildServerStarter.js`).
#### Dev Server, Single Page Applications and Hot Module Replacement
If you speficy a `devServerPort` and `webRoot`, the BuildServer will start a devServer listening on `devServerPort`
serving `webRoot`. If you enable `spaRedirect` the devServer will set a route to catch any requests and redirect them to
the site's base URL appending the originally requested URL as a query parameter. The latter can be used to serve Single
Page Applications (SPAs).
If you define `watchFolders` with the build server, any changes files within the watched folders will trigger a rebuild
of the affected bundles. Any changes will be propagated to the devServer using Hot Module Replacement (HMR).
### Build Server Factory

The build server factory provides a simplified programmatic interface for starting a build server instance in a new
operating system process. It provides some IPC handling and should be the preferred way of starting a build server.

### Build Server Client

Build server client uses the build server factory to bootstrap a build server when required, takes care of connection
handling and forwards build commands to the build server. Using this class in your `Makefile.js` or build script is the
recommended way of interacting with the build server.

### Builders
The build server makes little assumption about what is built and how. The logic to execute the actual build process
must be provided by the client in form of a _Builder_. Every Builder must have a `build()` function that takes three
arguments:
1. Build parameters: An object containing arbitrary data. If you need to pass any data from your Makefile to your
your builder, you can pass an object to the build server client's `buildWithServer()` method. This object will be passed
through to the Builder without the build server or other components in the build chain making any assumptions about its
content.
2. Server parameters: Contains the build server's configuration parameters. You probably won't need it.
3. Log method: Log method provided by the build server. The builder can use this method to append to the build server's
log file. If using the whole build toolchain including build server client, any messages passed to the log method will
also be printed to `STDOUT` of the client process, i.e. your Makefile.