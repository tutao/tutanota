<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# Cordova Plugin Test Framework

The `cordova-plugin-test-framework` plugin does two things:

1. [Defines the interface for cordova plugins to write tests](#interface)
2. [Provides a test harness for actually running those tests](#harness)

Tests run directly inside existing cordova projects, so you can rapidly switch between testing and development.  You can also be sure that your test suite is testing the exact versions of plugins and platforms that your app is using.

# TLDR; Try it

1. Use your existing cordova app, or create a new one.
2. Plugins bundle their tests using a nested plugin in a `/tests` directory. To make this interesting, add some of these plugins and their respective tests.  Here are a few examples:

        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-device.git
        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-device.git#:/tests
		
        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-device-motion.git
        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-device-motion.git#:/tests
		
        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-geolocation.git
        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-geolocation#:/tests

3. Follow the docs for [Setting up the test harness](#harness).


<a name="interface" />
## Writing Plugin Tests

### Where do tests live?

Add a directory named `tests` to the root of your plugin. Within this directory, create a nested `plugin.xml` for the tests plugin. It should have a plugin id with the form `plugin-id-tests` (e.g. the `cordova-plugin-device` plugin has the nested id `cordova-plugin-device-tests`) and should contain a `<js-module>` named `tests`. E.g:

```
<js-module src="tests/tests.js" name="tests">
</js-module>
```

For example, the `cordova-plugin-device` plugin has this nested [`plugin.xml`](https://github.com/apache/cordova-plugin-device/blob/master/tests/plugin.xml).

The `cordova-plugin-test-framework` plugin will automatically find all `tests` modules across all plugins for which the nested tests plugin is installed.

### Defining Auto Tests

Simply export a function named `defineAutoTests`, which (gasp!) defines your auto-tests when run.  Use the [`jasmine-2.0`](http://jasmine.github.io/2.0/introduction.html) format.  E.g.:

```
exports.defineAutoTests = function() {

  describe('awesome tests', function() {
    it('do something sync', function() {
      expect(1).toBe(1);
      ...
    });

    it('do something async', function(done) {
      setTimeout(function() {
        expect(1).toBe(1);
        ...
        done();
      }, 100);
    });
  });

  describe('more awesome tests', function() {
    ...
  });

};
```

Note: Your tests will automatically be labeled with your plugin id, so do not prefix your test descriptions.


### Defining Manual Tests

Simply export a function named `defineManualTests`, which (gasp!) defines your manual-tests when run.  Manual tests do *not* use jasmine-2.0, and success/failure results are not officially reported in any standard way.  Instead, create buttons to run arbitrary javascript when clicked, and display output to user using `console` or by manipulating a provided DOM element. E.g.:

```
exports.defineManualTests = function(contentEl, createActionButton) {

  createActionButton('Simple Test', function() {
    console.log(JSON.stringify(foo, null, '\t'));
  });

  createActionButton('Complex Test', function() {
    contentEl.innerHTML = ...;
  });

};
```

Note: Your tests will automatically be labeled with your plugin id, so do not prefix your test descriptions.


<a name="example">
### Example

See: [`cordova-plugin-device` tests](https://github.com/apache/cordova-plugin-device/blob/master/tests/tests.js).

<a name="harness" />
## Running Plugin Tests

1. Use your existing cordova app, or create a new one.
2. Add this plugin:

        cordova plugin add http://git-wip-us.apache.org/repos/asf/cordova-plugin-test-framework.git

3. Change the start page in `config.xml` with `<content src="cdvtests/index.html" />` or navigate to `cdvtests/index.html` from within your app.
4. Thats it!


## FAQ

* Q: Should I add `cordova-plugin-test-framework` as a `<dependency>` of my plugin?
  * A: No.  The end-user should decide if they want to install the test framework, not your plugin (most users won't).

* Q: What do I do if my plugin tests must have very large assets?
  * A: Don't bundle those assets with your plugin.  If you can, have your tests fail gracefully if those assets don't don't exist (perhaps log a warning, perhaps fail a single asset-checking test, and skip the rest).  Then, ideally download those assets automatically into local storage the first time tests run.  Or create a manual test step to download and install assets.  As a final alternative, split those test assets into a separate plugin, and instruct users to install that plugin to run your full test suite.

* Q: Should I ship my app with the test framework plugin installed?
  * A: Not likely.  If you want, you can.  Then your app could even embed a link to the test page (`cdvtests/index.html`) from a help section of your app, to give end users a way to run your test suite out in the feild.  That may help diagnose causes of issues within your app.  Maybe.
