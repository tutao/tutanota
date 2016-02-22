
[![PayPayl](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FF6GG425KEQ3E "Donate once-off to this project using Paypal")
[![npm version](https://badge.fury.io/js/de.appplant.cordova.plugin.badge.svg)](http://badge.fury.io/js/cordova-plugin-badge)
[![Code Climate](https://codeclimate.com/github/katzer/cordova-plugin-badge/badges/gpa.svg)](https://codeclimate.com/github/katzer/cordova-plugin-badge)

Cordova Badge Plugin
====================

The essential purpose of badge numbers is to enable an application to inform its users that it has something for them — for example, unread messages — when the application isn’t running in the foreground.

__Note:__ With v0.7.2 the plugin ID is `cordova-plugin-badge`

<img height="150px" align="right" hspace="19" vspace="12" src="http://4.bp.blogspot.com/-GBwBSN92DvU/UB8Kut7Oz0I/AAAAAAAAJKs/mJgBmj1RKqU/s1600/whatsapp+wp8+10.png"></img>

### How they appear to the user
Users see notifications in the following ways:
- Badging the app’s icon


## Supported Platforms
The current 0.7 branch does support the following platforms:
- __Amazon FireOS__ (<= 0.7.1)
- __Android__ (via [ShortcutBadger][shortcut_badger])
- __Browser__
- __iOS__
- __Windows__
- __WP8__ and __WP8.1 Silverlight__

Find out more informations [here][wiki_platforms] in our wiki.


## Installation
The plugin is installable from source and available on Cordova Plugin Registry and PhoneGap Build.

Find out more informations [here][wiki_installation] in our wiki.


## I want to get a quick overview
All wiki pages contain samples, but for a quick overview the sample section may be the fastest way.

Find out more informations [here][wiki_samples] in our wiki.


## I want to get a deep overview
The plugin allows you to set, get, clear, increase and decrease the badge number. For Android the plugin offers additional configuration flags.

Find out more about how to set, increase or decrease the badge [here][wiki_set].

To get a deep overview we recommend to read about all the topics in this wiki and try out the [Kitchen Sink App][wiki_kitchensink]


## I want to see the plugin in action
The plugin offers a kitchen sink sample app. Check out the cordova project and run the app directly from your command line or preferred IDE.

Find out more informations [here][wiki_kitchensink] in our wiki.


## What's new
We are proud to announce our newest release version 0.7.x. Beside the hard work at the office and at the weekends it contains a lot of goodies, new features and easy to use APIs.

Find out more informations [here][wiki_changelog] in our wiki.


## Sample
The sample demonstrates how to set a fix badge number and how to increase the current badge number.

```javascript
// Set 10 on device ready
document.addEventListener('deviceready', function () {
    cordova.plugins.notification.badge.set(10);
}, false);
```
```javascript
// Increase the badge each time on pause
document.addEventListener('pause', function () {
    cordova.plugins.notification.badge.increase();
}, false);
```

Find out more informations [here][wiki_samples] in our wiki.


## Supporting
Your support is needed. If you use the plugin please support us in order to ensure further development and send us a drop through the donation button.

Thank you!

[![PayPayl](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FF6GG425KEQ3E "Donate once-off to this project using Paypal")


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2016 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[shortcut_badger]: https://github.com/leolin310148/ShortcutBadger
[wiki]: https://github.com/katzer/cordova-plugin-badge/wiki
[wiki_platforms]: https://github.com/katzer/cordova-plugin-badge/wiki/01.-Platforms
[wiki_installation]: https://github.com/katzer/cordova-plugin-badge/wiki/02.-Installation
[wiki_kitchensink]: https://github.com/katzer/cordova-plugin-badge/tree/example
[wiki_set]: https://github.com/katzer/cordova-plugin-badge/wiki/03.-Set-Badge
[wiki_samples]: https://github.com/katzer/cordova-plugin-badge/wiki/07.-Samples
[wiki_changelog]: https://github.com/katzer/cordova-plugin-badge/wiki/08.-Changelog
[apache2_license]: http://opensource.org/licenses/Apache-2.0
