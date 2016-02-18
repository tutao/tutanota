# ISSUES

- [Read the docs](#readthedocs)
- [Search the issues](#searchtheissues)
- [Opening a new issue](#openinganewissue)
  - [Provide details](#providedetails)
  - [An example issue](#anexampleissue)
- [Voting on an issue](#votingonanewissue)

The following tips are for users of this plugin who want to get help.

## Read the docs

I'll be the first to admit that the docs are not perfect but start here at the [README](https://github.com/phonegap/phonegap-plugin-push/blob/master/README.md) to see if your problem is documented. If it isn't continue on but if you do get an answer then consider sending a documentation pull request.

## Search the issues

Your question may have already been answered. Make sure you search at least the repo's [issues](https://github.com/phonegap/phonegap-plugin-push/issues) before you create a new one.

## Opening a new issue

If you have searched the issues and haven't found anything that resembles your problem then follow these guidelines in creating a new issue.

### Provide details

Give as many details as possible. Issues without many details will be more difficult to debug and will encounter delays.

Select a concise, informative title for the issue. Here's a good article on writing [subject lines](https://www.nngroup.com/articles/microcontent-how-to-write-headlines-page-titles-and-subject-lines/).

Include the following at a minimum:
_ what version number of plugin are you using?
- which platform and version you are testing on? iOS 9.0, Android 5.0, etc.
- a detailed description of your problem. Including:
  - steps to reproduce
  - expected result
  - actual result
- how you are sending the push data to the device, including an example payload

You may also want to include:
- some sample code that illustrates the problem.
- logs taken while the problem was reproduced.
- screenshots!

If the code or logs are huge, let's say over 20 lines please think about using a web service like [Gist](https://gist.github.com/) or [Pastebin](http://pastebin.com/).

### An example issue

**The wrong way**

*Title:* This plugin does not work for me

*Details:* Please fix quickly as my business depends on this plugin.

**The right way**

*Title:* Registration event never received on Samsung Galaxy S running Android 2.3

*Details:* I'm using version 1.5.2 of this plugin on my Samsung Galaxy S5 device which runs Android 4.4. I never receiving the `registration` event in my application when I expect it to return a value I can send to my push service. 

You can see the code I'm using in this gist: [https://gist.github.com/macdonst/191f74ac75b6802c047d](https://gist.github.com/macdonst/191f74ac75b6802c047d)

And an output of the logs when trying to run the app are in this gist: [https://gist.github.com/macdonst/47549150c299080c455c](https://gist.github.com/macdonst/47549150c299080c455c)

Please point me in the right direction.

*Response:*

Thanks for the detailed logs and example code by looking them over I'm sure of what your problem is. If you look at line [334](https://gist.github.com/macdonst/47549150c299080c455c#file-logcat-txt-L334) of your logcat you will see that it complains that:

```
I/chromium(11669): [INFO:CONSOLE(54)] "Uncaught ReferenceError: PushNotification is not defined", source: file:///android_asset/www/js/index.js (54)
```

This leads me to line [4](https://gist.github.com/macdonst/191f74ac75b6802c047d#file-app-js-L4) of your code where you are initializing push before you get the `deviceready` event. Like all Cordova API's you have to wait until you receive the `deviceready` event before you initialize Push.  

Check out [https://github.com/phonegap/phonegap-plugin-push/blob/20f489a90cf519f962fd957700f92115f142594b/example/www/js/index.js](https://github.com/phonegap/phonegap-plugin-push/blob/20f489a90cf519f962fd957700f92115f142594b/example/www/js/index.js) for an example of how to wait for `deviceready`.

## Voting on an issue

Did you know you can vote on issues in the phonegap-plugin-push repository? If you install the [ZenHub](https://chrome.google.com/webstore/detail/zenhub-for-github/ogcgkffhplmphkaahpmffcafajaocjbd) Chrome Extension you will be able to +1 issues to indicate how popular they are to the community. It's a way better way for the contributors to keep track of important issues.