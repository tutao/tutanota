/*
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
package org.apache.cordova;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;

//import android.content.Context;
//import android.webkit.WebView;

/**
 * This class represents a service entry object.
 */
public class PluginEntry {

    /**
     * The name of the service that this plugin implements
     */
    public String service = "";

    /**
     * The plugin class name that implements the service.
     */
    public String pluginClass = "";

    /**
     * The plugin object.
     * Plugin objects are only created when they are called from JavaScript.  (see PluginManager.exec)
     * The exception is if the onload flag is set, then they are created when PluginManager is initialized.
     */
    public CordovaPlugin plugin = null;

    /**
     * Flag that indicates the plugin object should be created when PluginManager is initialized.
     */
    public boolean onload = false;

    /**
     * Constructor
     *
     * @param service               The name of the service
     * @param pluginClass           The plugin class name
     * @param onload                Create plugin object when HTML page is loaded
     */
    public PluginEntry(String service, String pluginClass, boolean onload) {
        this.service = service;
        this.pluginClass = pluginClass;
        this.onload = onload;
    }

    /**
     * Alternate constructor
     *
     * @param service               The name of the service
     * @param plugin                The plugin associated with this entry
     */
    public PluginEntry(String service, CordovaPlugin plugin) {
        this.service = service;
        this.plugin = plugin;
        this.pluginClass = plugin.getClass().getName();
        this.onload = false;
    }

    /**
     * Create plugin object.
     * If plugin is already created, then just return it.
     *
     * @return                      The plugin object
     */
    public CordovaPlugin createPlugin(CordovaWebView webView, CordovaInterface ctx) {
        if (this.plugin != null) {
            return this.plugin;
        }
        try {
            @SuppressWarnings("rawtypes")
            Class c = getClassByName(this.pluginClass);
            if (isCordovaPlugin(c)) {
                this.plugin = (CordovaPlugin) c.newInstance();
                this.plugin.initialize(ctx, webView);
                return plugin;
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error adding plugin " + this.pluginClass + ".");
        }
        return null;
    }

    /**
     * Get the class.
     *
     * @param clazz
     * @return a reference to the named class
     * @throws ClassNotFoundException
     */
    @SuppressWarnings("rawtypes")
    private Class getClassByName(final String clazz) throws ClassNotFoundException {
        Class c = null;
        if ((clazz != null) && !("".equals(clazz))) {
            c = Class.forName(clazz);
        }
        return c;
    }

    /**
     * Returns whether the given class extends CordovaPlugin.
     */
    @SuppressWarnings("rawtypes")
    private boolean isCordovaPlugin(Class c) {
        if (c != null) {
            return org.apache.cordova.CordovaPlugin.class.isAssignableFrom(c);
        }
        return false;
    }
}
