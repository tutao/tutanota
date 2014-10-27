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

#include <QQuickItem>

#include "splashscreen.h"
#include <cordova.h>

#define SPLASHSCREEN_STATE_NAME "splashscreen"

Splashscreen::Splashscreen(Cordova *cordova): CPlugin(cordova) {
}

void Splashscreen::show(int, int) {
    m_cordova->rootObject()->setProperty("splashscreenPath", m_cordova->getSplashscreenPath());

    m_cordova->pushViewState(SPLASHSCREEN_STATE_NAME);
}

void Splashscreen::hide(int, int) {
    m_cordova->popViewState(SPLASHSCREEN_STATE_NAME);
}
