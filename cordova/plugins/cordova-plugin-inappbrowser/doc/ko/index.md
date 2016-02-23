<!---
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
-->

# cordova-plugin-inappbrowser

이 플러그인 `코르도바를 호출할 때 표시 하는 웹 브라우저 보기를 제공 합니다.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

`코르도바입니다.InAppBrowser.open()` 함수 `window.open ()` 함수에 대 한 대체품 정의 됩니다. 기존의 `window.open ()` 호출 window.open을 대체 하 여 InAppBrowser 윈도우를 사용할 수 있습니다.

    window.open = cordova.InAppBrowser.open;
    

InAppBrowser 창 표준 웹 브라우저 처럼 동작 및 코르도바 Api에 액세스할 수 없습니다. 이 이유는 InAppBrowser는 것이 좋습니다는 주요 코르도바 webview로 로드 하는 대신 제 3 자 (신뢰할 수 없는) 콘텐츠를 로드 해야 할 경우. InAppBrowser는 허용 될 수도 시스템 브라우저에서 링크를 여는.

사용자에 대 한 자체 GUI 컨트롤에서 기본적으로 제공 된 InAppBrowser (뒤로, 앞으로, 완료).

대 한 뒤 호환성,이 플러그인도 `window.open` 후크. 그러나, `window.open`의 플러그인 설치 후크를 가질 수 있습니다 의도 하지 않은 부작용 (특히 경우이 플러그인이 다른 플러그인 종속성 으로만 포함). `window.open` 후크 주요 릴리스에서 제거 됩니다. 후크 플러그인에서 제거 될 때까지 애플 리 케이 션 수 있습니다 수동으로 기본 동작을 복원 하 게 됩니다.

    delete window.open // Reverts the call back to it's prototype's default
    

`window.open` 전역 범위에 있지만 InAppBrowser 제공 되지 않습니다 때까지 `deviceready` 이벤트 후.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## 설치

    cordova plugin add cordova-plugin-inappbrowser
    

InAppBrowser를 통해가 서 당신의 애플 리 케이 션에서 모든 페이지를 로드 하려는 경우 초기화 하는 동안 `window.open` 간단 하 게 연결할 수 있습니다. 예를 들어:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

새 `InAppBrowser` 인스턴스, 현재 브라우저 인스턴스 또는 시스템 브라우저에서 URL을 엽니다.

    var ref = cordova.InAppBrowser.open(url, target, options);
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창. *(InAppBrowser)*

*   **url**: *(문자열)를*로드 하는 URL. 전화 `encodeURI()` 이 경우에는 URL 유니코드 문자를 포함 합니다.

*   **대상**: 대상 URL, 기본적으로 선택적 매개 변수를 로드 하는 `_self` . *(문자열)*
    
    *   `_self`: URL 화이트 리스트에 있으면 코르도바 WebView에서 열리고, 그렇지 않으면 열에`InAppBrowser`.
    *   `_blank`: 준공에`InAppBrowser`.
    *   `_system`: 시스템의 웹 브라우저에서 엽니다.

*   **옵션**: 옵션은 `InAppBrowser` . 선택적, 디폴트에: `location=yes` . *(문자열)*
    
    `options`문자열 텅 빈 어떤 스페이스 포함 해서는 안 그리고 쉼표 각 기능의 이름/값 쌍을 구분 합니다. 기능 이름은 대/소문자입니다. 모든 플랫폼 지원 아래 값:
    
    *   **위치**: 설정 `yes` 또는 `no` 설정 하는 `InAppBrowser` 의 위치 표시줄 켜거나 끕니다.
    
    안 드 로이드만:
    
    *   **숨겨진**: 설정 `yes` 브라우저를 만들 페이지를 로드 하면, 하지만 그것을 보여주지. Loadstop 이벤트는 로드가 완료 되 면 발생 합니다. 생략 하거나 설정 `no` (기본값) 브라우저 열고 정상적으로 로드 해야 합니다.
    *   **clearcache**: 설정 `yes` 브라우저를 쿠키 캐시 삭제 하기 전에 새 창이 열립니다
    *   **clearsessioncache**: 설정 `yes` 세션 쿠키 캐시를 삭제 하기 전에 새 창이 열립니다
    
    iOS만:
    
    *   **closebuttoncaption**: **수행** 하는 단추의 캡션으로 사용할 문자열을 설정 합니다. 참고 직접이 값을 지역화 해야 합니다.
    *   **disallowoverscroll**: 설정 `yes` 또는 `no` (기본값은 `no` ). 회전 온/오프 UIWebViewBounce 속성입니다.
    *   **숨겨진**: 설정 `yes` 브라우저를 만들 페이지를 로드 하면, 하지만 그것을 보여주지. Loadstop 이벤트는 로드가 완료 되 면 발생 합니다. 생략 하거나 설정 `no` (기본값) 브라우저 열고 정상적으로 로드 해야 합니다.
    *   **clearcache**: 설정 `yes` 브라우저를 쿠키 캐시 삭제 하기 전에 새 창이 열립니다
    *   **clearsessioncache**: 설정 `yes` 세션 쿠키 캐시를 삭제 하기 전에 새 창이 열립니다
    *   **도구 모음**: 설정 `yes` 또는 `no` InAppBrowser (기본값:에 대 한 도구 모음 온 / 오프를 돌기 위하여`yes`)
    *   **enableViewportScale**: 설정 `yes` 또는 `no` 뷰포트 메타 태그 (기본값:를 통해 확장을 방지 하기 위해`no`).
    *   **mediaPlaybackRequiresUserAction**: 설정 `yes` 또는 `no` HTML5 오디오 또는 비디오 자동 재생 (기본값에서에서 방지 하기 위해`no`).
    *   **allowInlineMediaPlayback**: 설정 `yes` 또는 `no` 인라인 HTML5 미디어 재생, 장치 전용 재생 인터페이스 보다는 브라우저 창 내에서 표시할 수 있도록 합니다. HTML의 `video` 요소가 포함 되어야 합니다는 `webkit-playsinline` 특성 (기본값:`no`)
    *   **keyboardDisplayRequiresUserAction**: 설정 `yes` 또는 `no` 양식 요소는 자바 스크립트를 통해 포커스를 받을 때 키보드를 열고 `focus()` 전화 (기본값:`yes`).
    *   **suppressesIncrementalRendering**: 설정 `yes` 또는 `no` (기본값을 렌더링 하기 전에 모든 새로운 보기 콘텐츠를 받을 때까지 기다려야`no`).
    *   **presentationstyle**: 설정 `pagesheet` , `formsheet` 또는 `fullscreen` [프레 젠 테이 션 스타일][1] (기본값을 설정 하려면`fullscreen`).
    *   **transitionstyle**: 설정 `fliphorizontal` , `crossdissolve` 또는 `coververtical` [전환 스타일][2] (기본값을 설정 하려면`coververtical`).
    *   **toolbarposition**: 설정 `top` 또는 `bottom` (기본값은 `bottom` ). 위쪽 또는 아래쪽 창에 도구 모음을 발생 합니다.
    
    Windows에만 해당:
    
    *   **숨겨진**: 설정 `yes` 브라우저를 만들 페이지를 로드 하면, 하지만 그것을 보여주지. Loadstop 이벤트는 로드가 완료 되 면 발생 합니다. 생략 하거나 설정 `no` (기본값) 브라우저 열고 정상적으로 로드 해야 합니다.

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   블랙베리 10
*   Firefox 운영 체제
*   iOS
*   윈도우 8과 8.1
*   Windows Phone 7과 8

### 예를 들어

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### 파이어 폭스 OS 단점

플러그인 어떤 디자인을 적용 하지 않는 경우 열 일부 CSS의 규칙을 추가할 필요가 있다 `target='_blank'`. 이 같이 규칙

     css
    .inAppBrowserWrap {
      background-color: rgba(0,0,0,0.75);
      color: rgba(235,235,235,1.0);
    }
    .inAppBrowserWrap menu {
      overflow: auto;
      list-style-type: none;
      padding-left: 0;
    }
    .inAppBrowserWrap menu li {
      font-size: 25px;
      height: 25px;
      float: left;
      margin: 0 10px;
      padding: 3px 10px;
      text-decoration: none;
      color: #ccc;
      display: block;
      background: rgba(30,30,30,0.50);
    }
    .inAppBrowserWrap menu li.disabled {
        color: #777;
    }
    

## InAppBrowser

`Cordova에 대 한 호출에서 반환 하는 개체.InAppBrowser.open`.

### 메서드

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> 이벤트에 대 한 수신기를 추가 합니다`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창 *(InAppBrowser)*

*   **eventname**: *(문자열)를* 수신 하도록 이벤트
    
    *   **loadstart**: 이벤트 발생 때는 `InAppBrowser` URL 로드를 시작 합니다.
    *   **loadstop**: 이벤트가 발생 시기는 `InAppBrowser` URL 로드 완료.
    *   **loaderror**: 이벤트 발생 때는 `InAppBrowser` URL을 로드할 때 오류가 발생 합니다.
    *   **종료**: 이벤트가 발생 시기는 `InAppBrowser` 창이 닫힙니다.

*   **콜백**: 이벤트가 발생 될 때 실행 되는 함수. 함수는 전달 된 `InAppBrowserEvent` 개체를 매개 변수로 합니다.

### InAppBrowserEvent 속성

*   **유형**: eventname, 중 `loadstart` , `loadstop` , `loaderror` , 또는 `exit` . *(문자열)*

*   **url**: URL 로드 된. *(문자열)*

*   **코드**: 오류 코드의 경우에만 `loaderror` . *(수)*

*   **메시지**: 오류 메시지의 경우에만 `loaderror` . *(문자열)*

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   iOS
*   윈도우 8과 8.1
*   Windows Phone 7과 8

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> 이벤트에 대 한 수신기를 제거 합니다`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창. *(InAppBrowser)*

*   **eventname**: 이벤트 수신 대기를 중지 합니다. *(문자열)*
    
    *   **loadstart**: 이벤트 발생 때는 `InAppBrowser` URL 로드를 시작 합니다.
    *   **loadstop**: 이벤트가 발생 시기는 `InAppBrowser` URL 로드 완료.
    *   **loaderror**: 이벤트 발생 때는 `InAppBrowser` URL 로드 오류가 발생 합니다.
    *   **종료**: 이벤트가 발생 시기는 `InAppBrowser` 창이 닫힙니다.

*   **콜백**: 이벤트가 발생 하면 실행할 함수. 함수는 전달 된 `InAppBrowserEvent` 개체.

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   iOS
*   윈도우 8과 8.1
*   Windows Phone 7과 8

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> 종료는 `InAppBrowser` 창.

    ref.close();
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창 *(InAppBrowser)*

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   Firefox 운영 체제
*   iOS
*   윈도우 8과 8.1
*   Windows Phone 7과 8

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> 숨겨진 열은 한 InAppBrowser 창을 표시 합니다. 전화는 InAppBrowser가 이미 보이는 경우는 효과가 없습니다.

    ref.show();
    

*   **ref**: InAppBrowser 창 (참조`InAppBrowser`)

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   iOS
*   윈도우 8과 8.1

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> 에 자바 스크립트 코드를 삽입는 `InAppBrowser` 창

    ref.executeScript(details, callback);
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창. *(InAppBrowser)*

*   **injectDetails**: 스크립트 실행의 세부 사항 중 하나를 지정 하는 `file` 또는 `code` 키. *(개체)*
    
    *   **파일**: 삽입 하는 스크립트의 URL.
    *   **코드**: 스크립트 텍스트를 삽입 합니다.

*   **콜백**: 자바 스크립트 코드를 주입 후 실행 기능.
    
    *   삽입 된 스크립트 유형의 경우 `code` , 스크립트의 반환 값은 단일 매개 변수는 콜백 실행에 싸여 있는 `Array` . 여러 줄 스크립트에 대 한 마지막 문 또는 평가 마지막 식의 반환 값입니다.

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   iOS
*   윈도우 8과 8.1

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> 주사로 CSS는 `InAppBrowser` 창.

    ref.insertCSS(details, callback);
    

*   **심판**:에 대 한 참조는 `InAppBrowser` 창 *(InAppBrowser)*

*   **injectDetails**: 스크립트 실행의 세부 사항 중 하나를 지정 하는 `file` 또는 `code` 키. *(개체)*
    
    *   **파일**: 삽입 하는 스타일 시트의 URL.
    *   **코드**: 삽입 하는 스타일 시트의 텍스트.

*   **콜백**: CSS 주입 후 실행 기능.

### 지원 되는 플랫폼

*   아마존 화재 운영 체제
*   안 드 로이드
*   iOS

### 빠른 예제

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });
