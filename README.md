# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

* Official website: https://tutanota.com
* Issue and feature tracker: https://tutanota.uservoice.com/forums/237921-general

## WebStorm
Tutanota is built with [WebStorm](https://www.jetbrains.com/webstorm/) from [JetBrains](https://www.jetbrains.com/)

[![WebStorm Logo](logo_WebStorm.png)](https://www.jetbrains.com/webstorm/)

## Building and running your own Tutanota Electron App

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you prefer the auto-update feature, you can use https://app.tutanota.de directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed

Build steps:

1. Clone the repository: `git clone https://github.com/zeeshan595/tutanota.git`
2. Switch into the tutanota directory: `cd tutanota/`
3. Checkout latest release (currently 2.14.4): `git checkout tutanota-release-2.14.4`
4. Run `./build.sh`
5. Switch into the build directory: `cd web/build`
6. You can build for different OS using the following commands:

npm run build_linux
npm run build_mac
npm run build_win

7. You can find the build under `release-builds` folder

## Server templates

Server templates contains working installation instructions. Allows to create a temporary server to test, deploy production servers and fork configurations for customization.

Distribution  | Status
------------- | -------------
[Debian Wheezy] (https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70) | [![Debian Wheezy](https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70/build/1/image)](https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70/builds)
[Debian Jessie] (https://manageacloud.com/configuration/tutanota_debian_jessie) | [![Debian Jessie](https://manageacloud.com/configuration/tutanota_debian_jessie/build/7/image)](https://manageacloud.com/configuration/tutanota_debian_jessie/builds)
[Ubuntu 14.04] (https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404)  | [![Ubuntu 14.04](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404/build/2/image)](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404/builds)
[Ubuntu 14.10] (https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410) | [![Ubuntu 14.10](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410/build/6/image)](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410/builds)
[Ubuntu 15.04] (https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04) | [![Ubuntu 15.04](https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04/build/8/image)](https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04/builds)
[CentOS 6.5] (https://manageacloud.com/configuration/tutanota_email_client) | [![CentOS 6.5](https://manageacloud.com/configuration/tutanota_email_client/build/3/image)](https://manageacloud.com/configuration/tutanota_email_client/builds)
[CentOS 7] (https://manageacloud.com/configuration/tutanota_email_client_centos_7) | [![CentOS 7](https://manageacloud.com/configuration/tutanota_email_client_centos_7/build/5/image)](https://manageacloud.com/configuration/tutanota_email_client_centos_7/builds)



## Tests

We use the following tools for testing:
* Test runner: [Karma](http://karma-runner.github.io/)
* Test framework: [Mocha doc](http://mochajs.org/)
* Assertion framework: [chai.js API doc](http://chaijs.com/api/assert/)
