Keyboard
======

The `cordova.plugins.Keyboard` object provides functions to make interacting with the keyboard easier, and fires events to indicate that the keyboard will hide/show.

    cordova plugin add ionic-plugin-keyboard

Methods
-------

- ~~cordova.plugins.Keyboard.hideKeyboardAccessoryBar~~ (**removed in 2.0, see below**)
- cordova.plugins.Keyboard.close
- cordova.plugins.Keyboard.disableScroll
- cordova.plugins.Keyboard.show

Properties
--------

- cordova.plugins.Keyboard.isVisible

Events
--------

These events are fired on the window.

- native.keyboardshow
  * A number `keyboardHeight` is given on the event object, which is the pixel height of the keyboard.
- native.keyboardhide


# API reference

~~Keyboard.hideKeyboardAccessoryBar~~
=================

**NOTE: This method started causing apps to be rejected from the App Store, so has been removed until a workaround is found.**

Hide the keyboard accessory bar with the next, previous and done buttons.

    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);

Supported Platforms
-------------------

- iOS


Keyboard.close
=================

Close the keyboard if it is open.

    cordova.plugins.Keyboard.close();

Supported Platforms
-------------------

- iOS, Android, Blackberry 10, Windows


Keyboard.disableScroll
=================

Disable native scrolling, useful if you are using JavaScript to scroll

    cordova.plugins.Keyboard.disableScroll(true);
    cordova.plugins.Keyboard.disableScroll(false);

Supported Platforms
-------------------

- iOS, Windows

Keyboard.show
=================

Force keyboard to be shown. This typically helps if autofocus on a text element does not pop up the keyboard automatically

    cordova.plugins.Keyboard.show();

Supported Platforms

- Android, Blackberry 10, Windows

native.keyboardshow
=================

This event fires when the keyboard will be shown

    window.addEventListener('native.keyboardshow', keyboardShowHandler);

    function keyboardShowHandler(e){
        alert('Keyboard height is: ' + e.keyboardHeight);
    }

Properties
-----------

keyboardHeight: the height of the keyboard in pixels


Supported Platforms
-------------------

- iOS, Android, Blackberry 10, Windows


native.keyboardhide
=================

This event fires when the keyboard will hide

    window.addEventListener('native.keyboardhide', keyboardHideHandler);

    function keyboardHideHandler(e){
        alert('Goodnight, sweet prince');
    }

Properties
-----------

None

Supported Platforms
-------------------

- iOS, Android, Blackberry 10, Windows
