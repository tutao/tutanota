/*
 *
 * Copyright 2013 Canonical Ltd.
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

#include <QQuickView>
#include <QQuickItem>

#include "inappbrowser.h"
#include <cordova.h>

Inappbrowser::Inappbrowser(Cordova *cordova): CPlugin(cordova), _eventCb(0) {
}

const char code[] = "\
var component;                                                          \
function createObject() {                                               \
    component = Qt.createComponent(%1);                                 \
    if (component.status == Component.Ready)                            \
        finishCreation();                                               \
    else                                                                \
        component.statusChanged.connect(finishCreation);                \
}                                                                       \
function finishCreation() {                                             \
    CordovaWrapper.global.inappbrowser = component.createObject(root,   \
        {root: root, cordova: cordova, url1: %2});                      \
}                                                                       \
createObject()";

const char EXIT_EVENT[] = "{type: 'exit'}";
const char LOADSTART_EVENT[] = "{type: 'loadstart'}";
const char LOADSTOP_EVENT[] = "{type: 'loadstop'}";
const char LOADERROR_EVENT[] = "{type: 'loaderror'}";

void Inappbrowser::open(int cb, int, const QString &url, const QString &, const QString &) {
    assert(_eventCb == 0);

    _eventCb = cb;

    QString path = m_cordova->get_app_dir() + "/../qml/InAppBrowser.qml";
    QString qml = QString(code)
      .arg(CordovaInternal::format(path)).arg(CordovaInternal::format(url));
    m_cordova->execQML(qml);
}

void Inappbrowser::show(int, int) {
    m_cordova->execQML("CordovaWrapper.global.inappbrowser.visible = true");
}

void Inappbrowser::close(int, int) {
    m_cordova->execQML("CordovaWrapper.global.inappbrowser.destroy()");
    this->callbackWithoutRemove(_eventCb, EXIT_EVENT);
    _eventCb = 0;
}

void Inappbrowser::injectStyleFile(int scId, int ecId, const QString& src, bool b) {
    QString code("(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %1; d.head.appendChild(c);})(document)");
    code = code.arg(CordovaInternal::format(src));

    injectScriptCode(scId, ecId, code, b);
}

void Inappbrowser::injectStyleCode(int scId, int ecId, const QString& src, bool b) {
    QString code("(function(d) { var c = d.createElement('style'); c.innerHTML = %1; d.body.appendChild(c); })(document)");
    code = code.arg(CordovaInternal::format(src));

    injectScriptCode(scId, ecId, code, b);
}

void Inappbrowser::injectScriptFile(int scId, int ecId, const QString& src, bool b) {
    QString code("(function(d) { var c = d.createElement('script'); c.src = %1; d.body.appendChild(c);})(document)");
    code = code.arg(CordovaInternal::format(src));

    injectScriptCode(scId, ecId, code, b);
}

void Inappbrowser::injectScriptCode(int scId, int, const QString& code, bool) {
    m_cordova->execQML(QString("CordovaWrapper.global.inappbrowser.executeJS(%2, %1)").arg(CordovaInternal::format(code)).arg(scId));
}

void Inappbrowser::loadFinished(bool status) {
    if (!status) {
        this->callbackWithoutRemove(_eventCb, LOADSTOP_EVENT);
    } else {
        this->callbackWithoutRemove(_eventCb, LOADSTART_EVENT);
    }
}
