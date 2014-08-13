# Tutanota
========

Tutanota is the end-to-end encrypted mail client that enables you to communicate securely with anyone.

## Building and running your own Tutanota web client

If you do not trust us and want to make sure that your reviewed code is the same that gets executed when running Tutanota, you can build your own Tutanota client and run it locally.
Remember that you have to update your tutanota client on your own. Just use [https://app.tutanota.de] directly, if you need the more comfortable auto-updating feature.

Pre-requisites:
# An up-to-date version of git is installed
# An up-to-date version of node js is installed

Build steps:
# Checkout the repository: `clone https://github.com/tutao/tutanota.git`
# Switch into the web directory: `cd tutanota/web`
# Build Tutanota: `gulp distProd`
# Switch into the build directory: `cd build`
# Open the index.html with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument "--allow-file-access-from-files".

## Building the apps

TODO describe how to build the apps

## Tests

We use the following tools for testing:
* Test runner: [Karma](http://karma-runner.github.io/)
* Test framework: [Mocha doc](http://chaijs.com/api/assert/)
* Assertion framework: [chai.js API doc](http://chaijs.com/api/assert/)
