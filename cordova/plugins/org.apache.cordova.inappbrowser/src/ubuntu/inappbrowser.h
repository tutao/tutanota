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
#ifndef INAPPBROWSER_H
#define INAPPBROWSER_H

#include <QtCore>
#include <cplugin.h>

class Inappbrowser: public CPlugin {
    Q_OBJECT
public:
    Inappbrowser(Cordova *cordova);

    virtual const QString fullName() override {
        return Inappbrowser::fullID();
    }

    virtual const QString shortName() override {
        return "InAppBrowser";
    }

    static const QString fullID() {
        return "InAppBrowser";
    }

public slots:
    void open(int cb, int, const QString &url, const QString &windowName, const QString &windowFeatures);
    void show(int, int);
    void close(int, int);
    void injectStyleFile(int cb, int, const QString&, bool);
    void injectStyleCode(int cb, int, const QString&, bool);
    void injectScriptFile(int cb, int, const QString&, bool);
    void injectScriptCode(int cb, int, const QString&, bool);

    void loadFinished(int status);

private:
    int _eventCb;
};

#endif
