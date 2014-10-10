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

const char EXIT_EVENT[] = "'exit'";
const char LOADSTART_EVENT[] = "'loadstart'";
const char LOADSTOP_EVENT[] = "'loadstop'";
const char LOADERROR_EVENT[] = "'loaderror'";

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

void Inappbrowser::injectStyleFile(int, int, const QString&, bool) {
    // TODO:
    qCritical() << "unimplemented " << __PRETTY_FUNCTION__;
}

void Inappbrowser::injectStyleCode(int, int, const QString&, bool) {
    // TODO:
    qCritical() << "unimplemented " << __PRETTY_FUNCTION__;
}

void Inappbrowser::injectScriptFile(int, int, const QString&, bool) {
    // TODO:
    qCritical() << "unimplemented " << __PRETTY_FUNCTION__;
}

void Inappbrowser::injectScriptCode(int, int, const QString&, bool) {
    // TODO:
    qCritical() << "unimplemented " << __PRETTY_FUNCTION__;
}

void Inappbrowser::loadFinished(int status) {
    if (status == 2) {
        this->callbackWithoutRemove(_eventCb, LOADERROR_EVENT);
    }
    if (status == 0) {
        this->callbackWithoutRemove(_eventCb, LOADSTART_EVENT);
    }
    if (status == 3) {
        this->callbackWithoutRemove(_eventCb, LOADSTOP_EVENT);
    }
}
