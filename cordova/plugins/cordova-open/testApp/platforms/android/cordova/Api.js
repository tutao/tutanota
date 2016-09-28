/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var Q = require('q');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');

var CordovaError = require('cordova-common').CordovaError;
var PlatformJson = require('cordova-common').PlatformJson;
var ActionStack = require('cordova-common').ActionStack;
var AndroidProject = require('./lib/AndroidProject');
var PlatformMunger = require('cordova-common').ConfigChanges.PlatformMunger;
var PluginInfoProvider = require('cordova-common').PluginInfoProvider;

var ConsoleLogger = require('./lib/ConsoleLogger');
var pluginHandlers = require('./lib/pluginHandlers');

var PLATFORM = 'android';

/**
 * Class, that acts as abstraction over particular platform. Encapsulates the
 *   platform's properties and methods.
 *
 * Platform that implements own PlatformApi instance _should implement all
 *   prototype methods_ of this class to be fully compatible with cordova-lib.
 *
 * The PlatformApi instance also should define the following field:
 *
 * * platform: String that defines a platform name.
 */
function Api(platform, platformRootDir, events) {
    this.platform = PLATFORM;
    this.root = path.resolve(__dirname, '..');
    this.events = events || ConsoleLogger.get();
    // NOTE: trick to share one EventEmitter instance across all js code
    require('cordova-common').events = this.events;

    this._platformJson = PlatformJson.load(this.root, platform);
    this._pluginInfoProvider = new PluginInfoProvider();
    this._munger = new PlatformMunger(this.platform, this.root, this._platformJson, this._pluginInfoProvider);

    var self = this;

    this.locations = {
        root: self.root,
        www: path.join(self.root, 'assets/www'),
        platformWww: path.join(self.root, 'platform_www'),
        configXml: path.join(self.root, 'res/xml/config.xml'),
        defaultConfigXml: path.join(self.root, 'cordova/defaults.xml'),
        strings: path.join(self.root, 'res/values/strings.xml'),
        manifest: path.join(self.root, 'AndroidManifest.xml'),
        // NOTE: Due to platformApi spec we need to return relative paths here
        cordovaJs: 'bin/templates/project/assets/www/cordova.js',
        cordovaJsSrc: 'cordova-js-src'
    };
}

/**
 * Installs platform to specified directory and creates a platform project.
 *
 * @param  {String}  destination Destination directory, where insatll platform to
 * @param  {ConfigParser}  [config] ConfgiParser instance, used to retrieve
 *   project creation options, such as package id and project name.
 * @param  {Object}  [options]  An options object. The most common options are:
 * @param  {String}  [options.customTemplate]  A path to custom template, that
 *   should override the default one from platform.
 * @param  {Boolean}  [options.link]  Flag that indicates that platform's
 *   sources will be linked to installed platform instead of copying.
 * @param {EventEmitter} [events] An EventEmitter instance that will be used for
 *   logging purposes. If no EventEmitter provided, all events will be logged to
 *   console
 *
 * @return {Promise<PlatformApi>} Promise either fulfilled with PlatformApi
 *   instance or rejected with CordovaError.
 */
Api.createPlatform = function (destination, config, options, events) {
    return require('../../lib/create')
    .create(destination, config, options, events || ConsoleLogger.get())
    .then(function (destination) {
        var PlatformApi = require(path.resolve(destination, 'cordova/Api'));
        return new PlatformApi(PLATFORM, destination, events);
    });
};

/**
 * Updates already installed platform.
 *
 * @param  {String}  destination Destination directory, where platform installed
 * @param  {Object}  [options]  An options object. The most common options are:
 * @param  {String}  [options.customTemplate]  A path to custom template, that
 *   should override the default one from platform.
 * @param  {Boolean}  [options.link]  Flag that indicates that platform's
 *   sources will be linked to installed platform instead of copying.
 * @param {EventEmitter} [events] An EventEmitter instance that will be used for
 *   logging purposes. If no EventEmitter provided, all events will be logged to
 *   console
 *
 * @return {Promise<PlatformApi>} Promise either fulfilled with PlatformApi
 *   instance or rejected with CordovaError.
 */
Api.updatePlatform = function (destination, options, events) {
    return require('../../lib/create')
    .update(destination, options, events || ConsoleLogger.get())
    .then(function (destination) {
        var PlatformApi = require(path.resolve(destination, 'cordova/Api'));
        return new PlatformApi('android', destination, events);
    });
};

/**
 * Gets a CordovaPlatform object, that represents the platform structure.
 *
 * @return  {CordovaPlatform}  A structure that contains the description of
 *   platform's file structure and other properties of platform.
 */
Api.prototype.getPlatformInfo = function () {
    var result = {};
    result.locations = this.locations;
    result.root = this.root;
    result.name = this.platform;
    result.version = require('./version');
    result.projectConfig = this._config;

    return result;
};

/**
 * Updates installed platform with provided www assets and new app
 *   configuration. This method is required for CLI workflow and will be called
 *   each time before build, so the changes, made to app configuration and www
 *   code, will be applied to platform.
 *
 * @param {CordovaProject} cordovaProject A CordovaProject instance, that defines a
 *   project structure and configuration, that should be applied to platform
 *   (contains project's www location and ConfigParser instance for project's
 *   config).
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.prepare = function (cordovaProject) {
    return require('./lib/prepare').prepare.call(this, cordovaProject);
};

/**
 * Installs a new plugin into platform. This method only copies non-www files
 *   (sources, libs, etc.) to platform. It also doesn't resolves the
 *   dependencies of plugin. Both of handling of www files, such as assets and
 *   js-files and resolving dependencies are the responsibility of caller.
 *
 * @param  {PluginInfo}  plugin  A PluginInfo instance that represents plugin
 *   that will be installed.
 * @param  {Object}  installOptions  An options object. Possible options below:
 * @param  {Boolean}  installOptions.link: Flag that specifies that plugin
 *   sources will be symlinked to app's directory instead of copying (if
 *   possible).
 * @param  {Object}  installOptions.variables  An object that represents
 *   variables that will be used to install plugin. See more details on plugin
 *   variables in documentation:
 *   https://cordova.apache.org/docs/en/4.0.0/plugin_ref_spec.md.html
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.addPlugin = function (plugin, installOptions) {

    if (!plugin || plugin.constructor.name !== 'PluginInfo')
        return Q.reject(new CordovaError('The parameter is incorrect. The first parameter to addPlugin should be a PluginInfo instance'));

    installOptions = installOptions || {};
    installOptions.variables = installOptions.variables || {};

    var self = this;
    var actions = new ActionStack();
    var project = AndroidProject.getProjectFile(this.root);

    // gather all files needs to be handled during install
    plugin.getFilesAndFrameworks(this.platform)
        .concat(plugin.getAssets(this.platform))
        .concat(plugin.getJsModules(this.platform))
    .forEach(function(item) {
        actions.push(actions.createAction(
            pluginHandlers.getInstaller(item.itemType), [item, plugin, project, installOptions],
            pluginHandlers.getUninstaller(item.itemType), [item, plugin, project, installOptions]));
    });

    // run through the action stack
    return actions.process(this.platform)
    .then(function () {
        if (project) {
            project.write();
        }

        // Add PACKAGE_NAME variable into vars
        if (!installOptions.variables.PACKAGE_NAME) {
            installOptions.variables.PACKAGE_NAME = project.getPackageName();
        }

        self._munger
            // Ignore passed `is_top_level` option since platform itself doesn't know
            // anything about managing dependencies - it's responsibility of caller.
            .add_plugin_changes(plugin, installOptions.variables, /*is_top_level=*/true, /*should_increment=*/true)
            .save_all();

        var targetDir = installOptions.usePlatformWww ?
            self.locations.platformWww :
            self.locations.www;

        self._addModulesInfo(plugin, targetDir);
    });
};

/**
 * Removes an installed plugin from platform.
 *
 * Since method accepts PluginInfo instance as input parameter instead of plugin
 *   id, caller shoud take care of managing/storing PluginInfo instances for
 *   future uninstalls.
 *
 * @param  {PluginInfo}  plugin  A PluginInfo instance that represents plugin
 *   that will be installed.
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError instance.
 */
Api.prototype.removePlugin = function (plugin, uninstallOptions) {

    if (!plugin || plugin.constructor.name !== 'PluginInfo')
        return Q.reject(new CordovaError('The parameter is incorrect. The first parameter to addPlugin should be a PluginInfo instance'));

    var self = this;
    var actions = new ActionStack();
    var project = AndroidProject.getProjectFile(this.root);

    // queue up plugin files
    plugin.getFilesAndFrameworks(this.platform)
        .concat(plugin.getAssets(this.platform))
        .concat(plugin.getJsModules(this.platform))
    .forEach(function(item) {
        actions.push(actions.createAction(
            pluginHandlers.getUninstaller(item.itemType), [item, plugin, project, uninstallOptions],
            pluginHandlers.getInstaller(item.itemType), [item, plugin, project, uninstallOptions]));
    });

    // run through the action stack
    return actions.process(this.platform)
    .then(function() {
        if (project) {
            project.write();
        }

        self._munger
            // Ignore passed `is_top_level` option since platform itself doesn't know
            // anything about managing dependencies - it's responsibility of caller.
            .remove_plugin_changes(plugin, /*is_top_level=*/true)
            .save_all();

        var targetDir = uninstallOptions.usePlatformWww ?
            self.locations.platformWww :
            self.locations.www;

        self._removeModulesInfo(plugin, targetDir);
    });
};

/**
 * Builds an application package for current platform.
 *
 * @param  {Object}  buildOptions  A build options. This object's structure is
 *   highly depends on platform's specific. The most common options are:
 * @param  {Boolean}  buildOptions.debug  Indicates that packages should be
 *   built with debug configuration. This is set to true by default unless the
 *   'release' option is not specified.
 * @param  {Boolean}  buildOptions.release  Indicates that packages should be
 *   built with release configuration. If not set to true, debug configuration
 *   will be used.
 * @param   {Boolean}  buildOptions.device  Specifies that built app is intended
 *   to run on device
 * @param   {Boolean}  buildOptions.emulator: Specifies that built app is
 *   intended to run on emulator
 * @param   {String}  buildOptions.target  Specifies the device id that will be
 *   used to run built application.
 * @param   {Boolean}  buildOptions.nobuild  Indicates that this should be a
 *   dry-run call, so no build artifacts will be produced.
 * @param   {String[]}  buildOptions.archs  Specifies chip architectures which
 *   app packages should be built for. List of valid architectures is depends on
 *   platform.
 * @param   {String}  buildOptions.buildConfig  The path to build configuration
 *   file. The format of this file is depends on platform.
 * @param   {String[]} buildOptions.argv Raw array of command-line arguments,
 *   passed to `build` command. The purpose of this property is to pass a
 *   platform-specific arguments, and eventually let platform define own
 *   arguments processing logic.
 *
 * @return {Promise<Object[]>} A promise either fulfilled with an array of build
 *   artifacts (application packages) if package was built successfully,
 *   or rejected with CordovaError. The resultant build artifact objects is not
 *   strictly typed and may conatin arbitrary set of fields as in sample below.
 *
 *     {
 *         architecture: 'x86',
 *         buildType: 'debug',
 *         path: '/path/to/build',
 *         type: 'app'
 *     }
 *
 * The return value in most cases will contain only one item but in some cases
 *   there could be multiple items in output array, e.g. when multiple
 *   arhcitectures is specified.
 */
Api.prototype.build = function (buildOptions) {
    var self = this;
    return require('./lib/check_reqs').run()
    .then(function () {
        return require('./lib/build').run.call(self, buildOptions);
    })
    .then(function (buildResults) {
        // Cast build result to array of build artifacts
        return buildResults.apkPaths.map(function (apkPath) {
            return {
                buildType: buildResults.buildType,
                buildMethod: buildResults.buildMethod,
                path: apkPath,
                type: 'apk'
            };
        });
    });
};

/**
 * Builds an application package for current platform and runs it on
 *   specified/default device. If no 'device'/'emulator'/'target' options are
 *   specified, then tries to run app on default device if connected, otherwise
 *   runs the app on emulator.
 *
 * @param   {Object}  runOptions  An options object. The structure is the same
 *   as for build options.
 *
 * @return {Promise} A promise either fulfilled if package was built and ran
 *   successfully, or rejected with CordovaError.
 */
Api.prototype.run = function(runOptions) {
    var self = this;
    return require('./lib/check_reqs').run()
    .then(function () {
        return require('./lib/run').run.call(self, runOptions);
    });
};

/**
 * Cleans out the build artifacts from platform's directory.
 *
 * @return  {Promise}  Return a promise either fulfilled, or rejected with
 *   CordovaError.
 */
Api.prototype.clean = function(cleanOptions) {
    var self = this;
    return require('./lib/check_reqs').run()
    .then(function () {
        return require('./lib/build').runClean.call(self, cleanOptions);
    });
};

/**
 * Performs a requirements check for current platform. Each platform defines its
 *   own set of requirements, which should be resolved before platform can be
 *   built successfully.
 *
 * @return  {Promise<Requirement[]>}  Promise, resolved with set of Requirement
 *   objects for current platform.
 */
Api.prototype.requirements = function() {
    return require('./lib/check_reqs').check_all();
};

module.exports = Api;

/**
 * Removes the specified modules from list of installed modules and updates
 *   platform_json and cordova_plugins.js on disk.
 *
 * @param   {PluginInfo}  plugin  PluginInfo instance for plugin, which modules
 *   needs to be added.
 * @param   {String}  targetDir  The directory, where updated cordova_plugins.js
 *   should be written to.
 */
Api.prototype._addModulesInfo = function(plugin, targetDir) {
    var installedModules = this._platformJson.root.modules || [];

    var installedPaths = installedModules.map(function (installedModule) {
        return installedModule.file;
    });

    var modulesToInstall = plugin.getJsModules(this.platform)
    .filter(function (moduleToInstall) {
        return installedPaths.indexOf(moduleToInstall.file) === -1;
    }).map(function (moduleToInstall) {
        var moduleName = plugin.id + '.' + ( moduleToInstall.name || moduleToInstall.src.match(/([^\/]+)\.js/)[1] );
        var obj = {
            file: ['plugins', plugin.id, moduleToInstall.src].join('/'),
            id: moduleName
        };
        if (moduleToInstall.clobbers.length > 0) {
            obj.clobbers = moduleToInstall.clobbers.map(function(o) { return o.target; });
        }
        if (moduleToInstall.merges.length > 0) {
            obj.merges = moduleToInstall.merges.map(function(o) { return o.target; });
        }
        if (moduleToInstall.runs) {
            obj.runs = true;
        }

        return obj;
    });

    this._platformJson.root.modules = installedModules.concat(modulesToInstall);
    this._writePluginModules(targetDir);
    this._platformJson.save();
};

/**
 * Removes the specified modules from list of installed modules and updates
 *   platform_json and cordova_plugins.js on disk.
 *
 * @param   {PluginInfo}  plugin  PluginInfo instance for plugin, which modules
 *   needs to be removed.
 * @param   {String}  targetDir  The directory, where updated cordova_plugins.js
 *   should be written to.
 */
Api.prototype._removeModulesInfo = function(plugin, targetDir) {
    var installedModules = this._platformJson.root.modules || [];
    var modulesToRemove = plugin.getJsModules(this.platform)
    .map(function (jsModule) {
        return  ['plugins', plugin.id, jsModule.src].join('/');
    });

    var updatedModules = installedModules
    .filter(function (installedModule) {
        return (modulesToRemove.indexOf(installedModule.file) === -1);
    });

    this._platformJson.root.modules = updatedModules;
    this._writePluginModules(targetDir);
    this._platformJson.save();
};

/**
 * Fetches all installed modules, generates cordova_plugins contents and writes
 *   it to file.
 *
 * @param   {String}  targetDir  Directory, where write cordova_plugins.js to.
 *   Ususally it is either <platform>/www or <platform>/platform_www
 *   directories.
 */
Api.prototype._writePluginModules = function (targetDir) {
    var self = this;
    // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
    var final_contents = 'cordova.define(\'cordova/plugin_list\', function(require, exports, module) {\n';
    final_contents += 'module.exports = ' + JSON.stringify(this._platformJson.root.modules, null, '    ') + ';\n';
    final_contents += 'module.exports.metadata = \n';
    final_contents += '// TOP OF METADATA\n';

    var pluginMetadata = Object.keys(this._platformJson.root.installed_plugins)
    .reduce(function (metadata, plugin) {
        metadata[plugin] = self._platformJson.root.installed_plugins[plugin].version;
        return metadata;
    }, {});

    final_contents += JSON.stringify(pluginMetadata, null, 4) + '\n';
    final_contents += '// BOTTOM OF METADATA\n';
    final_contents += '});'; // Close cordova.define.

    shell.mkdir('-p', targetDir);
    fs.writeFileSync(path.join(targetDir, 'cordova_plugins.js'), final_contents, 'utf-8');
};
