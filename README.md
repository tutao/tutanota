# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

Official website: https://tutanota.de

## Building and running your own Tutanota web client

Now you can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you want the auto-update feature, you can use https://app.tutanota.de directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed

Build steps:

1. Checkout the repository: `clone https://github.com/tutao/tutanota.git`
2. Switch into the web directory: `cd tutanota/web`
3. Install dependencies: `npm install`
4. Build Tutanota: `gulp dist`
5. Switch into the build directory: `cd build`
6. Open the index.html with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument `--allow-file-access-from-files`.

## Server templates
Server templates contains working installation instructions. Allows to create a temporary server to test, deploy production servers and fork configurations for customization.
 - [Debian Wheezy] (https://manageacloud.com/cookbook/tutanota_email_client_debian_wheezy_70)
 - [Ubuntu 14.04] (https://manageacloud.com/cookbook/tutanota_email_client_ubuntu_trusty_tahr_1404)
 - [Amazon Linux] (https://manageacloud.com/cookbook/tutanota_email_client_amazon_2014032)
 - [CentOS 6.5] (https://manageacloud.com/cookbook/tutanota_email_client)
 - [CentOS 7] (https://manageacloud.com/cookbook/tutanota_email_client_centos_7)

## Tests

We use the following tools for testing:
* Test runner: [Karma](http://karma-runner.github.io/)
* Test framework: [Mocha doc](http://chaijs.com/api/assert/)
* Assertion framework: [chai.js API doc](http://chaijs.com/api/assert/)
