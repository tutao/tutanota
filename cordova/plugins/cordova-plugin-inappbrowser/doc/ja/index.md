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

このプラグインは `コルドバを呼び出すときに表示される web ブラウザーのビューを提供します。InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    

`コルドバ。InAppBrowser.open()` `window.open()` 関数との交換を定義する関数。 既存の `window.open()` 呼び出しは、window.open を置き換えることによって InAppBrowser ウィンドウを使用できます。

    window.open = cordova.InAppBrowser.open;
    

InAppBrowser ウィンドウは標準的な web ブラウザーのように動作し、コルドバ Api にアクセスできません。 この理由から、InAppBrowser お勧めする場合はメインのコルドバの webview を読み込むのではなくサード パーティ (信頼されていない) コンテンツをロードする必要があります。 InAppBrowser、ホワイト リストの対象ではないも、システムのブラウザーでリンクを開くです。

InAppBrowser を提供しますデフォルトで GUI コントロール (戻る、進む、行う)。

後方互換性、このプラグインは、また `window.open` をフックのため。 ただし、`window.open` のプラグイン インストール フックを持つことができます意図しない副作用 （特に場合は、このプラグインは別のプラグインの依存関係としてのみ含まれています)。 `window.open` のフックは、将来のメジャー リリースで削除されます。 プラグインから、フックが削除されるまでアプリはデフォルトの動作を手動で復元できます。

    delete window.open // Reverts the call back to it's prototype's default
    

`window.open` はグローバル スコープでは、InAppBrowser は、`deviceready` イベントの後まで利用できません。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log("window.open works well");
    }
    

## インストール

    cordova plugin add cordova-plugin-inappbrowser
    

InAppBrowser を通過するアプリですべてのページの読み込みをする場合は初期化中に `window.open` を単にフックできます。たとえば。

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }
    

## cordova.InAppBrowser.open

新しい `InAppBrowser` インスタンスを現在のブラウザー インスタンスまたはシステムのブラウザーで URL を開きます。

    var ref = cordova.InAppBrowser.open(url, target, options);
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ。*(InAppBrowser)*

*   **url**: *(文字列)*をロードする URL。電話 `encodeURI()` 場合は、この上の URL は Unicode 文字を含みます。

*   **ターゲット**: ターゲット URL は、既定値は、省略可能なパラメーターをロードするを `_self` 。*(文字列)*
    
    *   `_self`: コルドバ WebView URL がホワイト リストにある場合で開きます、それ以外の場合で開きます、`InAppBrowser`.
    *   `_blank`: で開きます、`InAppBrowser`.
    *   `_system`: システムの web ブラウザーで開きます。

*   **オプション**: おぷしょん、 `InAppBrowser` 。省略可能にする: `location=yes` 。*(文字列)*
    
    `options`文字列にはする必要があります任意の空白スペースが含まれていないと、各機能の名前と値のペアをコンマで区切る必要があります。 機能名では大文字小文字を区別します。 以下の値をサポートするプラットフォーム。
    
    *   **場所**： に設定 `yes` または `no` を有効にする、 `InAppBrowser` の場所バー オンまたはオフにします。
    
    アンドロイドのみ：
    
    *   **非表示**: 設定 `yes` ブラウザーを作成して、ページの読み込みが表示されません。 Loadstop イベントは、読み込みが完了すると発生します。 省略するか設定 `no` (既定値) を開くし、通常読み込みブラウザーを持っています。
    *   **clearcache**: に設定されている `yes` 、ブラウザーのクッキー キャッシュ クリア新しいウィンドウが開く前に
    *   **clearsessioncache**： に設定されている `yes` はセッション cookie のキャッシュをオフにすると、新しいウィンドウが開く前に
    
    iOS のみ:
    
    *   **closebuttoncaption**: [**完了**] ボタンのキャプションとして使用する文字列に設定します。自分でこの値をローカライズする必要があることに注意してください。
    *   **disallowoverscroll**： に設定されている `yes` または `no` (既定値は `no` )。/UIWebViewBounce プロパティをオフにします。
    *   **非表示**: 設定 `yes` ブラウザーを作成して、ページの読み込みが表示されません。 Loadstop イベントは、読み込みが完了すると発生します。 省略するか設定 `no` (既定値) を開くし、通常読み込みブラウザーを持っています。
    *   **clearcache**: に設定されている `yes` 、ブラウザーのクッキー キャッシュ クリア新しいウィンドウが開く前に
    *   **clearsessioncache**： に設定されている `yes` はセッション cookie のキャッシュをオフにすると、新しいウィンドウが開く前に
    *   **ツールバー**: に設定されている `yes` または `no` InAppBrowser (デフォルトのツールバーのオンまたはオフを有効にするには`yes`)
    *   **enableViewportScale**： に設定されている `yes` または `no` を (デフォルトではメタタグを介してスケーリング ビューポートを防ぐために`no`).
    *   **mediaPlaybackRequiresUserAction**： に設定されている `yes` または `no` を HTML5 オーディオまたはビデオを自動再生 （初期設定から防ぐために`no`).
    *   **allowInlineMediaPlayback**： に設定されている `yes` または `no` ラインで HTML5 メディア再生には、デバイス固有再生インターフェイスではなく、ブラウザー ウィンドウ内に表示するようにします。 HTML の `video` 要素を含める必要がありますまた、 `webkit-playsinline` 属性 (デフォルトは`no`)
    *   **keyboardDisplayRequiresUserAction**： に設定されている `yes` または `no` をフォーム要素の JavaScript を介してフォーカスを受け取るときに、キーボードを開く `focus()` コール （デフォルトは`yes`).
    *   **suppressesIncrementalRendering**： に設定されている `yes` または `no` (デフォルトでは表示される前にビューのすべての新しいコンテンツを受信するまで待機するには`no`).
    *   **presentationstyle**： に設定されている `pagesheet` 、 `formsheet` または `fullscreen` (デフォルトでは、[プレゼンテーション スタイル][1]を設定するには`fullscreen`).
    *   **transitionstyle**： に設定されている `fliphorizontal` 、 `crossdissolve` または `coververtical` (デフォルトでは、[トランジションのスタイル][2]を設定するには`coververtical`).
    *   **toolbarposition**： に設定されている `top` または `bottom` (既定値は `bottom` )。上部またはウィンドウの下部にツールバーが発生します。
    
    Windows のみ：
    
    *   **非表示**: 設定 `yes` ブラウザーを作成して、ページの読み込みが表示されません。 Loadstop イベントは、読み込みが完了すると発生します。 省略するか設定 `no` (既定値) を開くし、通常読み込みブラウザーを持っています。

 [1]: http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle
 [2]: http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   ブラックベリー 10
*   Firefox の OS
*   iOS
*   Windows 8 および 8.1
*   Windows Phone 7 と 8

### 例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');
    

### Firefox OS 癖

開かれた場合にいくつかの CSS ルールを追加する必要があるプラグインは任意のデザインを適用しないと `target ='_blank'`。これらのような規則になります。

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

`コルドバへの呼び出しから返されるオブジェクト。InAppBrowser.open`.

### メソッド

*   addEventListener
*   removeEventListener
*   close
*   show
*   executeScript
*   insertCSS

## addEventListener

> イベントのリスナーを追加します、`InAppBrowser`.

    ref.addEventListener(eventname, callback);
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ*(InAppBrowser)*

*   **eventname**: *(文字列)*をリッスンするイベント
    
    *   ****： イベントが発生するとき、 `InAppBrowser` の URL の読み込みが開始します。
    *   **loadstop**： イベントが発生するとき、 `InAppBrowser` URL の読み込みが完了します。
    *   **loaderror**： イベントが発生するとき、 `InAppBrowser` URL の読み込みでエラーが発生します。
    *   **終了**: イベントが発生するとき、 `InAppBrowser` ウィンドウが閉じられます。

*   **コールバック**: イベントが発生したときに実行される関数。関数に渡されますが、 `InAppBrowserEvent` オブジェクトをパラメーターとして。

### InAppBrowserEvent プロパティ

*   **タイプ**: eventname どちらか `loadstart` 、 `loadstop` 、 `loaderror` 、または `exit` 。*(文字列)*

*   **url**: URL が読み込まれました。*(文字列)*

*   **コード**: の場合にのみ、エラー コード `loaderror` 。*(数)*

*   **メッセージ**: の場合にのみ、エラー メッセージ `loaderror` 。*(文字列)*

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   iOS
*   Windows 8 および 8.1
*   Windows Phone 7 と 8

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });
    

## removeEventListener

> イベントのリスナーを削除します、`InAppBrowser`.

    ref.removeEventListener(eventname, callback);
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ。*(InAppBrowser)*

*   **eventname**: イベントのリッスンを停止します。*(文字列)*
    
    *   ****： イベントが発生するとき、 `InAppBrowser` の URL の読み込みが開始します。
    *   **loadstop**： イベントが発生するとき、 `InAppBrowser` URL の読み込みが完了します。
    *   **loaderror**： イベントが発生するとき、 `InAppBrowser` URL の読み込みエラーが発生します。
    *   **終了**: イベントが発生するとき、 `InAppBrowser` ウィンドウが閉じられます。

*   **コールバック**: イベントが発生するときに実行する関数。関数に渡されますが、 `InAppBrowserEvent` オブジェクト。

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   iOS
*   Windows 8 および 8.1
*   Windows Phone 7 と 8

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);
    

## close

> 閉じる、 `InAppBrowser` ウィンドウ。

    ref.close();
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ*(InAppBrowser)*

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   Firefox の OS
*   iOS
*   Windows 8 および 8.1
*   Windows Phone 7 と 8

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.close();
    

## show

> 隠された開かれた InAppBrowser ウィンドウが表示されます。この関数を呼び出すは影響しません、InAppBrowser が既に表示されている場合。

    ref.show();
    

*   **ref**: InAppBrowser ウィンドウ (への参照`InAppBrowser`)

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   iOS
*   Windows 8 および 8.1

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();
    

## executeScript

> JavaScript コードに挿入します、 `InAppBrowser` ウィンドウ

    ref.executeScript(details, callback);
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ。*(InAppBrowser)*

*   **injectDetails**： 詳細を実行するスクリプトのいずれかを指定する、 `file` または `code` キー。*(オブジェクト)*
    
    *   **ファイル**： スクリプトの URL を注入します。
    *   **コード**: スクリプトのテキストを挿入します。

*   **コールバック**: JavaScript コードを注入した後に実行される関数。
    
    *   挿入されたスクリプトが型の場合 `code` 、スクリプトの戻り値は、1 つのパラメーターでコールバックを実行するのに包まれて、 `Array` 。 マルチライン スクリプトについては、最後のステートメントでは、または評価した最後の式の戻り値です。

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   iOS
*   Windows 8 および 8.1

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });
    

## insertCSS

> CSS に注入する、 `InAppBrowser` ウィンドウ。

    ref.insertCSS(details, callback);
    

*   **ref**: への参照を `InAppBrowser` ウィンドウ*(InAppBrowser)*

*   **injectDetails**： 詳細を実行するスクリプトのいずれかを指定する、 `file` または `code` キー。*(オブジェクト)*
    
    *   **ファイル**: 注入するスタイル シートの URL。
    *   **コード**: 注入するスタイル シートのテキスト。

*   **コールバック**: CSS の注入後に実行される関数。

### サポートされているプラットフォーム

*   アマゾン火 OS
*   アンドロイド
*   iOS

### 簡単な例

    var ref = cordova.InAppBrowser.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });
