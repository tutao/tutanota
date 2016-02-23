<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->

# cordova-plugin-file

[![Build Status](https://travis-ci.org/apache/cordova-plugin-file.svg)](https://travis-ci.org/apache/cordova-plugin-file)

이 플러그인은 장치에 있는 파일에 대 한 읽기/쓰기 액세스를 허용 하는 파일 API를 구현 합니다.

이 플러그인을 포함 한 몇 가지 사양에 따라: HTML5 파일 API는 <http://www.w3.org/TR/FileAPI/>

(지금은 없어진) 디렉터리와 시스템 확장 최신: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> 플러그인 코드의 대부분은 때 이전 사양 작성 되었습니다 있지만 현재는: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

그것은 또한 FileWriter 사양 구현: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

사용을 참조 하십시오 HTML5 바위 ' 우수한 [파일 시스템 문서.](http://www.html5rocks.com/en/tutorials/file/filesystem/)

다른 저장소 옵션에 대 한 개요, 코르도바의 [저장소 가이드](http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html) 를 참조합니다.

이 플러그인 글로벌 `cordova.file` 개체를 정의합니다.

전역 범위에 있지만 그것은 불가능까지 `deviceready` 이벤트 후.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(cordova.file);
    }
    

## 설치

    cordova plugin add cordova-plugin-file
    

## 지원 되는 플랫폼

  * 아마존 화재 운영 체제
  * 안 드 로이드
  * 블랙베리 10
  * Firefox 운영 체제
  * iOS
  * Windows Phone 7과 8 *
  * 윈도우 8 *
  * Windows*
  * 브라우저

\* *These platforms do not support `FileReader.readAsArrayBuffer` nor `FileWriter.write(blob)`.*

## 파일을 저장할 위치를

V1.2.0, 현재 중요 한 파일 시스템 디렉터리에 Url도 제공 됩니다. 각 URL 형태 *file:///path/to/spot/* 이며 `DirectoryEntry` `window.resolveLocalFileSystemURL()`를 사용 하 여 변환할 수 있습니다..

  * `cordova.file.applicationDirectory`-읽기 전용 디렉터리는 응용 프로그램을 설치 합니다. (*iOS*, *안 드 로이드*, *블랙베리 10*)

  * `cordova.file.applicationStorageDirectory`응용 프로그램의 샌드박스;의 루트 디렉터리 iOS에이 위치에는 읽기 전용 (특정 하위 디렉토리만 [같은 `/Documents` ]은 읽기 / 쓰기). 포함 된 모든 데이터는 응용 프로그램에 전용. ( *iOS*, *안 드 로이드*, *블랙베리 10*)

  * `cordova.file.dataDirectory`-내부 메모리를 사용 하 여 응용 프로그램의 샌드박스 내에서 영구 및 개인 데이터 스토리지 (안 드 로이드, 외부 메모리를 사용 해야 하는 경우 사용 하 여 `.externalDataDirectory` ). IOS에이 디렉터리 iCloud와 동기화 되지 되 (를 사용 하 여 `.syncedDataDirectory` ). (*iOS*, *안 드 로이드*, *블랙베리 10*)

  * `cordova.file.cacheDirectory`-디렉터리 캐시 데이터 파일 또는 모든 파일을 당신의 app를 다시 쉽게 만들 수 있습니다. 운영 체제 장치 저장소 부족 하면 이러한 파일을 삭제할 수 있습니다, 그리고 그럼에도 불구 하 고, 애플 리 케이 션 여기에 파일을 삭제 하려면 운영 체제에 의존 하지 말아야 합니다. (*iOS*, *안 드 로이드*, *블랙베리 10*)

  * `cordova.file.externalApplicationStorageDirectory`-응용 프로그램 외부 저장 공간입니다. (*안 드 로이드*)

  * `cordova.file.externalDataDirectory`-외부 저장소에 응용 프로그램 특정 데이터 파일을 넣어 어디. (*안 드 로이드*)

  * `cordova.file.externalCacheDirectory`외부 저장소에 응용 프로그램 캐시입니다. (*안 드 로이드*)

  * `cordova.file.externalRootDirectory`-외부 저장 (SD 카드) 루트입니다. (*안 드 로이드*, *블랙베리 10*)

  * `cordova.file.tempDirectory`-운영 체제에서 지울 수 있습니다 임시 디렉터리 것입니다. 이 디렉터리;를 운영 체제에 의존 하지 마십시오 귀하의 응용 프로그램 항상 해당 하는 경우 파일을 제거 해야 합니다. (*iOS*)

  * `cordova.file.syncedDataDirectory`-(ICloud)를 예를 들어 동기화 해야 하는 응용 프로그램 관련 파일을 보유 하 고 있습니다. (*iOS*)

  * `cordova.file.documentsDirectory`-파일 애플 리 케이 션, 하지만 그 개인은 다른 응용 프로그램 (예: Office 파일)에 의미입니다. (*iOS*)

  * `cordova.file.sharedDirectory`-모든 응용 프로그램 (*블랙베리 10* 에 전세계적으로 사용 가능한 파일)

## 파일 시스템 레이아웃

하지만 구현 세부 사항을 기술적으로 `cordova.file.*` 속성 실제 장치에 실제 경로에 매핑하는 방법을 아는 것이 매우 유용할 수 있습니다.

### iOS 파일 시스템 레이아웃

| 장치 경로                                          | `cordova.file.*`            | `iosExtraFileSystems` | r/w? |   영구?    |    OS 지웁니다    | 동기화 | 개인 |
|:---------------------------------------------- |:--------------------------- |:--------------------- |:----:|:--------:|:-------------:|:---:|:--:|
| `/ var/모바일/응용 프로그램/< UUID > /`           | applicationStorageDirectory | -                     |  r   |   N/A    |      N/A      | N/A | 예  |
| &nbsp;&nbsp;&nbsp;`appname.app/`               | applicationDirectory        | 번들                    |  r   |   N/A    |      N/A      | N/A | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`www/`     | -                           | -                     |  r   |   N/A    |      N/A      | N/A | 예  |
| &nbsp;&nbsp;&nbsp;`Documents/`                 | documentsDirectory          | 문서                    | r/w  |    예     |      없음       |  예  | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | -                           | 문서 nosync             | r/w  |    예     |      없음       | 없음  | 예  |
| &nbsp;&nbsp;&nbsp;`Library`                    | -                           | 라이브러리                 | r/w  |    예     |      없음       | 그래? | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`NoCloud/` | dataDirectory               | 라이브러리 nosync          | r/w  |    예     |      없음       | 없음  | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Cloud/`   | syncedDataDirectory         | -                     | r/w  |    예     |      없음       |  예  | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Caches/`  | cacheDirectory              | 캐시                    | r/w  |   예 *    | Yes**\* | 없음  | 예  |
| &nbsp;&nbsp;&nbsp;`tmp/`                       | tempDirectory               | -                     | r/w  | No** | Yes**\* | 없음  | 예  |

\ * 파일 응용 프로그램 다시 시작 및 업그레이드, 유지 하지만 때마다 OS 욕망이 디렉터리를 지울 수 있습니다. 앱 삭제 될 수 있습니다 모든 콘텐츠를 다시 만들 수 있어야 합니다.

** 파일 응용 프로그램 다시 시작에서 지속 될 수 있습니다 하지만이 동작에 의존 하지 마십시오. 파일 여러 업데이트를 보장 하지 않습니다. 때 해당 앱이이 디렉터리에서 파일을 제거 해야, 이러한 파일을 제거할 때 (또는 경우에도) 운영 체제 보증 하지 않습니다으로.

**\ * OS 그것이 필요를 느낀다 언제 든 지이 디렉터리의 내용을 취소 수 있습니다 하지만 이것에 의존 하지 마십시오. 이 디렉터리를 응용 프로그램에 대 한 적절 한 선택을 취소 해야 합니다.

### 안 드 로이드 파일 시스템 레이아웃

| 장치 경로                                            | `cordova.file.*`                    | `AndroidExtraFileSystems` | r/w? | 영구? | OS 지웁니다  | 개인 |
|:------------------------------------------------ |:----------------------------------- |:------------------------- |:----:|:---:|:--------:|:--:|
| `file:///android_asset/`                         | applicationDirectory                |                           |  r   | N/A |   N/A    | 예  |
| `/data/데이터/< app id > /`                   | applicationStorageDirectory         | -                         | r/w  | N/A |   N/A    | 예  |
| &nbsp;&nbsp;&nbsp;`cache`                        | cacheDirectory                      | 캐시                        | r/w  |  예  |  예\*   | 예  |
| &nbsp;&nbsp;&nbsp;`files`                        | dataDirectory                       | 파일                        | r/w  |  예  |    없음    | 예  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`Documents`  |                                     | 문서                        | r/w  |  예  |    없음    | 예  |
| `< sdcard > /`                             | externalRootDirectory               | sdcard                    | r/w  |  예  |    없음    | 없음 |
| &nbsp;&nbsp;&nbsp;`Android/data/<app-id>/` | externalApplicationStorageDirectory | -                         | r/w  |  예  |    없음    | 없음 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`cache`      | externalCacheDirectry               | 외부 캐시                     | r/w  |  예  | 없음** | 없음 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`files`      | externalDataDirectory               | 파일 외부                     | r/w  |  예  |    없음    | 없음 |

\ * 운영 체제 정기적으로이 디렉터리 삭제 수 있지만이 동작에 의존 하지 마십시오. 이 응용 프로그램이 디렉터리의 내용을 취소 합니다. 사용자 수동으로 캐시 제거 해야,이 디렉터리의 내용은 제거 됩니다.

** 운영 체제 자동으로;이 디렉터리를 삭제 하지 않습니다 내용을 직접 관리에 대 한 책임이 있습니다. 사용자 수동으로 캐시 제거 합니다, 디렉터리의 내용은 제거 됩니다.

**참고**: 외부 저장소를 탑재할 수 없는 경우 `cordova.file.external*` 속성은 `null`.

### 블랙베리 10 파일 시스템 레이아웃

| 장치 경로                                                       | `cordova.file.*`            | r/w? | 영구? | OS 지웁니다 | 개인 |
|:----------------------------------------------------------- |:--------------------------- |:----:|:---:|:-------:|:--:|
| `file:///accounts/1000/appdata/ < app id > /`         | applicationStorageDirectory |  r   | N/A |   N/A   | 예  |
| &nbsp;&nbsp;&nbsp;`app/native`                              | applicationDirectory        |  r   | N/A |   N/A   | 예  |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/temporary/local__0`  | cacheDirectory              | r/w  | 없음  |    예    | 예  |
| &nbsp;&nbsp;&nbsp;`data/webviews/webfs/persistent/local__0` | dataDirectory               | r/w  |  예  |   없음    | 예  |
| `file:///accounts/1000/removable/sdcard`                    | externalRemovableDirectory  | r/w  |  예  |   없음    | 없음 |
| `file:///accounts/1000/shared`                              | sharedDirectory             | r/w  |  예  |   없음    | 없음 |

*참고*: 모든 경로 /accounts/1000-enterprise를 기준으로 응용 프로그램 경계를 작동 하도록 배포 될 때.

## 안 드 로이드 단점

### 안 드 로이드 영구 저장 위치

안 드 로이드 장치에 영구 파일을 저장할 여러 유효한 위치가 있다. 다양 한 가능성의 광범위 한 토론에 대 한 [이 페이지](http://developer.android.com/guide/topics/data/data-storage.html)를 참조 하십시오.

플러그인의 이전 버전을 시작할 때, 장치는 SD 카드 (또는 해당 스토리지 파티션) 탑재 했다 주장 하는 여부에 따라 임시 및 영구 파일의 위치를 선택 합니다. SD 카드 마운트, 또는 큰 내부 스토리지 파티션에 사용할 수 있었습니다 (같은 넥서스 장치에) 그 후에 영구 파일 공간의 루트에 저장 됩니다. 이 모든 코르 도우 바 애플 리 케이 션 카드에 모두 사용할 수 있는 파일을 볼 수 있는 의미 합니다.

SD 카드는 사용할 수 있는 경우 이전 버전에서 데이터 저장 `/data/data/<packageId>`는 서로 다른 애플 리 케이 션을 분리 하지만 여전히 원인 데이터를 사용자 간에 공유할 수 있습니다.

그것은 지금 내부 파일 저장 위치 또는 응용 프로그램의 `config.xml` 파일에 기본 설정으로 이전 논리를 사용 하 여 파일을 저장할 것인지를 선택할 수 있습니다. 이렇게 하려면 `config.xml`에이 두 줄 중 하나를 추가:

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

이 줄이 없으면 파일 플러그인은 기본적으로 `Compatibility`을 사용 합니다. 기본 태그,이 이러한 값 중 하나가 아닌 경우에 응용 프로그램이 시작 되지 않습니다.

이전 (사전 1.0)을 사용 하는 경우 응용 프로그램 사용자에 게 발송 되었다 이전,이 플러그인의 버전 영구 파일 시스템에 저장 된 파일은 그리고 `Compatibility` 환경 설정을 설정 해야 합니다. "내부"의 위치 전환 그들의 응용 프로그램을 업그레이드 기존 사용자의 그들의 장치에 따라 그들의 이전에 저장 된 파일에 액세스할 수 수 있다는 뜻입니다.

경우 응용 프로그램은 새로운, 또는 이전 영구 파일 시스템에 파일을 저장, `Internal` 설정은 일반적으로 권장 됩니다.

### /Android_asset에 대 한 느린 재귀 작업

자산 디렉터리를 나열 하는 것은 안 드 로이드에 정말 느리다입니다. 속도 높일 수 있습니다 하지만, 안 드 로이드 프로젝트의 루트에 `src/android/build-extras.gradle` 를 추가 하 여 최대 (cordova-android@4.0.0 필요 이상).

## iOS 단점

  * `cordova.file.applicationStorageDirectory`읽기 전용; 루트 디렉터리 내에서 파일을 저장 하려고에 실패 합니다. 다른 중 하나를 사용 하 여 `cordova.file.*` iOS에 대해 정의 된 속성 (만 `applicationDirectory` 와 `applicationStorageDirectory` 는 읽기 전용).
  * `FileReader.readAsText(blob, encoding)` 
      * `encoding`매개 변수는 지원 되지 않습니다, 및 효과에 항상 u t F-8 인코딩을 합니다.

### iOS 영구 저장소 위치

IOS 디바이스에 영구 파일을 저장할 두 개의 유효한 위치가 있다: 문서 디렉터리 및 라이브러리 디렉터리. 플러그인의 이전 버전은 오직 문서 디렉토리에 영구 파일을 저장. 이 부작용 보다는 아니었다 수시로 특히 많은 작은 파일을 처리 하는 응용 프로그램에 대 한 의도, iTunes에 표시 모든 응용 프로그램 파일을 만드는 디렉터리의 용도 내보내기에 대 한 완전 한 문서를 생산 했다.

그것은 지금 문서 또는 응용 프로그램의 `config.xml` 파일에 기본 설정으로 라이브러리 디렉토리에 파일을 저장할 것인지를 선택할 수 있습니다. 이렇게 하려면 `config.xml`에이 두 줄 중 하나를 추가:

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

이 줄이 없으면 파일 플러그인은 기본적으로 `Compatibility`을 사용 합니다. 기본 태그,이 이러한 값 중 하나가 아닌 경우에 응용 프로그램이 시작 되지 않습니다.

이전 (사전 1.0)을 사용 하는 경우 응용 프로그램 사용자에 게 발송 되었다 이전,이 플러그인의 버전 영구 파일 시스템에 저장 된 파일은 그리고 `Compatibility` 환경 설정을 설정 해야 합니다. `Library`에 위치를 스위칭 기존 사용자에 게 응용 프로그램을 업그레이 드의 그들의 이전에 저장 된 파일에 액세스할 수 것을 의미할 것입니다.

경우 응용 프로그램은 새로운, 또는 이전 영구 파일 시스템에 파일을 저장, `Library` 설정은 일반적으로 권장 됩니다.

## 파이어 폭스 OS 단점

파일 시스템 API Firefox 운영 체제에서 기본적으로 지원 하지 및 indexedDB 위에 심으로 구현 됩니다.

  * 비어 있지 않은 디렉터리를 제거할 때 실패 하지 않습니다.
  * 디렉터리에 대 한 메타 데이터를 지원 하지 않습니다.
  * 메서드 `copyTo` 및 `moveTo` 디렉터리를 지원 하지 않습니다

다음 데이터 경로 지원 됩니다: * `applicationDirectory`-`xhr`를 사용 하 여 로컬 파일을 응용 프로그램 패키지를 가져옵니다. * `dataDirectory`-영구 응용 프로그램 특정 데이터 파일에 대 한. * `cacheDirectory`-응용 프로그램 다시 시작 해야 하는 캐시 된 파일 (애플 리 케이 션은 여기에 파일을 삭제 하려면 운영 체제에 의존 하지 말아야).

## 브라우저 만지면

### 일반적인 단점 및 설명

  * 각 브라우저는 샌드박스 자체 파일 시스템을 사용합니다. IE와 파이어 폭스 기반으로 IndexedDB를 사용합니다. 모든 브라우저는 경로에서 디렉터리 구분 기호로 슬래시를 사용합니다.
  * 디렉터리 항목을 연속적으로 만들 수 있다. 예를 들어 전화 `fs.root.getDirectory ('dir1/dir2 ', {create:true}, successCallback, errorCallback)` d i r 1 존재 하지 않은 경우 실패 합니다.
  * 플러그인 응용 프로그램 처음 시작할 영구 저장소를 사용 하 여 사용자 권한을 요청 합니다. 
  * 플러그인 지원 `cdvfile://localhost` (로컬 리소스)만. 즉, 외부 리소스는 `cdvfile`를 통해 지원 되지 않습니다..
  * 플러그인 ["파일 시스템 API 8.3 명명 제한"을](http://www.w3.org/TR/2011/WD-file-system-api-20110419/#naming-restrictions) 수행 하지 않습니다..
  * Blob 및 파일 ' `close` 함수는 지원 되지 않습니다.
  * `FileSaver` 및 `BlobBuilder`는이 플러그 접속식에 의해 지원 되지 않습니다 그리고 명세서를 필요가 없습니다.
  * 플러그인 `requestAllFileSystems`를 지원 하지 않습니다. 이 함수는 또한 사양에 빠진.
  * 사용 하는 경우 디렉터리에서 항목 제거 되지 것입니다 `create: true` 기존 디렉터리에 대 한 플래그.
  * 생성자를 통해 생성 된 파일은 지원 되지 않습니다. Entry.file 메서드를 대신 사용 해야 합니다.
  * 각 브라우저 blob URL 참조에 대 한 그것의 자신의 형태를 사용합니다.
  * `readAsDataURL` 기능을 지원 하지만 크롬에서 mediatype 항목 이름 확장명에 따라 달라 집니다, 그리고 mediatype IE에는 항상 빈 (`텍스트 일반` 사양에 따라 동일), 파이어 폭스에서 mediatype은 항상 `응용 프로그램/8 진수 스트림`. 예를 들어, 콘텐츠는 `abcdefg` 다음 파이어 폭스 반환 `데이터: 응용 프로그램 / 8 진수 스트림; base64, YWJjZGVmZw = =`, 즉 반환 `데이터:; base64, YWJjZGVmZw = =`, 반환 크롬 `데이터: < 항목 이름의 확장에 따라 mediatype >; base64, YWJjZGVmZw = =`.
  * `toInternalURL` 양식 `file:///persistent/path/to/entry` (파이어 폭스, 인터넷 익스플로러)에서 경로 반환합니다. 크롬 양식 `cdvfile://localhost/persistent/file`에 경로 반환합니다..

### 크롬 특수

  * 크롬 파일 시스템 장치 준비 이벤트 후 즉시 준비 되지 않습니다. 문제를 해결 하려면 `filePluginIsReady` 이벤트를 구독할 수 있습니다. 예를 들어: 

```javascript
window.addEventListener('filePluginIsReady', function(){ console.log('File plugin is ready');}, false);
```

`Window.isFilePluginReadyRaised` 함수를 사용 하 여 이벤트가 이미 발생 여부를 확인할 수 있습니다. -window.requestFileSystem 임시 및 영구 파일 시스템 할당량 크롬에 제한 되지 않습니다. -크롬에서 영구 저장소를 증가 하려면 `window.initPersistentFileSystem` 메서드를 호출 해야 합니다. 영구 저장소 할당량은 기본적으로 5 메가바이트입니다. -크롬 필요 `-허용-파일-액세스-에서-파일` `file:///` 프로토콜을 통해 지원 API 인수를 실행 합니다. -플래그를 사용 하면 `파일` 개체 하지 변경할 수 `{create:true}` 때 기존 `항목`. -행사 `cancelable` 속성이로 설정 된 크롬에서. 이 [사양](http://dev.w3.org/2009/dap/file-system/file-writer.html) 대조적 이다. -크롬에서 `toURL` 함수 반환 합니다 `파일 시스템:`-응용 프로그램 호스트에 따라 경로 앞에. 예를 들어, `filesystem:file:///persistent/somefile.txt`, `filesystem:http://localhost:8080/persistent/somefile.txt`. -`toURL` 함수 결과 디렉터리 항목의 경우에 후행 슬래시를 포함 하지 않습니다. 크롬 하지만 제대로 붙여 슬래시 url이 포함 된 디렉터리 해결합니다. -`resolveLocalFileSystemURL` 메서드 인바운드 `url`을 `파일 시스템` 접두사가 필요 합니다. 예를 들어, `url` 매개 변수 `resolveLocalFileSystemURL`에 대 한 안 드 로이드에서 양식 `file:///persistent/somefile.txt` 반대로 양식 `filesystem:file:///persistent/somefile.txt`에 있어야 합니다. -사용 되지 않는 `toNativeURL` 함수는 지원 되지 않습니다 및 stub에는 없습니다. -`setMetadata` 함수는 규격에 명시 되지 않은 및 지원 되지 않습니다. -INVALID_MODIFICATION_ERR (코드: 9) 대신 throw 됩니다 SYNTAX_ERR(code: 8) 비 existant 파일 시스템의 요청에. -INVALID_MODIFICATION_ERR (코드: 9) 대신 throw 됩니다 PATH_EXISTS_ERR(code: 12) 독점적으로 파일 또는 디렉터리를 만들 려,는 이미 존재 합니다. -INVALID_MODIFICATION_ERR (코드: 9) 대신 throw 됩니다 NO_MODIFICATION_ALLOWED_ERR(code: 6) 루트 파일 시스템에 removeRecursively을 호출 하려고 합니다. -INVALID_MODIFICATION_ERR (코드: 9) 대신 throw 됩니다 NOT_FOUND_ERR(code: 1) moveTo 디렉터리 존재 하지 않는 것을 시도에.

### IndexedDB 기반 구현이 특수 (파이어 폭스와 IE)

  * `.` `.`는 지원 되지 않습니다.
  * IE `file:///`를 지원 하지 않습니다-모드; 호스트 모드 지원된 (http://localhost:xxxx)입니다.
  * 파이어 폭스 파일 시스템 크기 제한 이지만 각 50MB 확장 사용자 권한을 요청 합니다. IE10 최대 10 mb 결합 AppCache 및 IndexedDB 묻는 사이트 당 250 mb의 최대 최대 증가 될 수 있도록 하려는 경우 해당 수준에 충돌 한 번 메시지를 표시 하지 않고 파일 시스템의 구현에 사용을 허용 한다. 그래서 `size` 매개 변수 `requestFileSystem` 함수에 대 한 파이어 폭스와 IE에서 파일 시스템 영향을 주지 않습니다.
  * `readAsBinaryString` 함수 사양에 명시 되지 않은 IE에서 지원 되지 않으며 stub에는 없습니다.
  * `file.type`은 항상 null입니다.
  * 하지 항목 삭제 된 DirectoryEntry 인스턴스의 콜백 결과 사용 하 여 만들어야 합니다. 그렇지 않으면, '교수형 항목'을 얻을 것 이다.
  * 그냥 작성 된 파일을 읽을 수 있는이 파일의 새 인스턴스를 얻으려면 해야 합니다.
  * `setMetadata` 함수는 사양에 명시 되지 않은 지원 `modificationTime` 필드 변경에만 해당 합니다. 
  * `copyTo` 및 `moveTo` 함수는 디렉터리를 지원 하지 않습니다.
  * 디렉터리 메타 데이터는 지원 되지 않습니다.
  * 둘 다 Entry.remove와 directoryEntry.removeRecursively 비어 있지 않은 디렉터리를 제거할 때 실패 하지 않습니다-디렉터리 제거 되는 대신 내용을 함께 청소.
  * `abort` 및 `truncate` 함수 지원 되지 않습니다.
  * 진행 이벤트가 발생 하지 합니다. 예를 들어,이 처리기 하지 실행 됩니다.

```javascript
writer.onprogress = function() { /*commands*/ };
```

## 업그레이드 노트

이 플러그인의 v1.0.0에 게시 된 사양에 맞춰 더 많은 것 `FileEntry` 및 `DirectoryEntry` 구조 변경 되었습니다.

플러그인의 이전 (pre-1.0.0) 버전 장치 절대 파일 위치 `Entry` 개체의 `fullPath` 속성에 저장 됩니다. 이러한 경로 일반적으로 같습니다.

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

이러한 경로 `항목` 개체의 `toURL()` 메서드에서 반환 했다.

V1.0.0, `fullPath` 속성은 *HTML 파일 시스템의 루트에 상대적인* 파일의 경로를. 그래서, 위의 경로 지금 둘 다의 `fullPath`와 `FileEntry` 개체에 의해 표현 될 것 이다

    /path/to/file
    

응용 프로그램 작동 장치 절대 경로, 이전 `항목` 개체의 `fullPath` 속성을 통해 그 경로 검색 하는 경우에, 당신은 대신 `entry.toURL()`를 사용 하 여 코드를 업데이트 해야 합니다.

대 한 뒤 호환성, `resolveLocalFileSystemURL()` 메서드는 장치-절대-경로 수락 하 고 그 파일 중 `TEMPORARY` 또는 `PERSISTENT` 파일 시스템 내에서 존재 하는 경우, 해당 `Entry` 개체를 반환 합니다.

이 특히 이전 장치 절대 경로 사용 하는 파일 전송 플러그인에 문제가 있다 (그리고 아직도 그들을 받아들일 수.) 그것은 `entry.toURL()`와 `entry.fullPath`를 대체 확인 장치에 파일을 사용 하는 플러그인을 지 고 그래서 파일 시스템 Url와 함께 제대로 작동 하려면 업데이트 되었습니다.

V1.1.0에 `toURL()`의 반환 값 (\[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394) 참조)로 바뀌었다 'file://' 절대 URL을 반환. 가능 하다 면. 보장 하는 ' cdvfile:'-URL `toInternalURL()`를 지금 사용할 수 있습니다. 이 메서드 이제 양식의 파일 Url을 반환 합니다.

    cdvfile://localhost/persistent/path/to/file
    

어떤 파일을 고유 하 게 식별 하려면 사용할 수 있습니다.

## 오류 코드 및 의미의 목록

오류가 throw 됩니다 때 다음 코드 중 하나가 사용 됩니다.

| 코드 | 상수                            |
| --:|:----------------------------- |
|  1 | `NOT_FOUND_ERR`               |
|  2 | `SECURITY_ERR`                |
|  3 | `ABORT_ERR`                   |
|  4 | `NOT_READABLE_ERR`            |
|  5 | `ENCODING_ERR`                |
|  6 | `NO_MODIFICATION_ALLOWED_ERR` |
|  7 | `INVALID_STATE_ERR`           |
|  8 | `SYNTAX_ERR`                  |
|  9 | `INVALID_MODIFICATION_ERR`    |
| 10 | `QUOTA_EXCEEDED_ERR`          |
| 11 | `TYPE_MISMATCH_ERR`           |
| 12 | `PATH_EXISTS_ERR`             |

## (선택 사항) 플러그인 구성

사용 가능한 파일 시스템의 집합 플랫폼 당 구성된 될 수 있습니다. IOS와 안 드 로이드를 인식 한 <preference> `config.xml` 설치 될 파일 시스템 이름에 태그. 기본적으로 모든 파일 시스템 루트 사용할 수 있습니다.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### 안 드 로이드

  * `files`: 응용 프로그램의 내부 파일 저장 디렉토리
  * `files-external`: 응용 프로그램의 외부 파일 저장 디렉토리
  * `sdcard`: 글로벌 외부 파일 저장 디렉토리 (이것은 SD 카드의 루트 설치 된 경우). 이것을 사용 하려면 `android.permission.WRITE_EXTERNAL_STORAGE` 권한이 있어야 합니다.
  * `cache`: 응용 프로그램의 내부 캐시 디렉터리
  * `cache-external`: 응용 프로그램의 외부 캐시 디렉터리
  * `root`: 전체 장치 파일 시스템

안 드 로이드는 또한 "파일" 파일 시스템 내에서 "/ 문서 /" 하위 디렉토리를 나타내는 "문서" 라는 특별 한 파일을 지원 합니다.

### iOS

  * `library`: 응용 프로그램의 라이브러리 디렉터리
  * `documents`: 응용 프로그램의 문서 디렉토리
  * `cache`: 응용 프로그램의 캐시 디렉터리
  * `bundle`: 응용 프로그램의 번들; (읽기 전용) 디스크에 응용 프로그램 자체의 위치
  * `root`: 전체 장치 파일 시스템

기본적으로 라이브러리 및 문서 디렉토리 iCloud에 동기화 할 수 있습니다. 또한 2 개의 추가적인 파일 시스템, `library-nosync` 및 `documents-nosync`, 내 특별 한 동기화 되지 않은 디렉터리를 대표 하는 요청할 수 있습니다는 `/Library` 또는 `/Documents` 파일 시스템.