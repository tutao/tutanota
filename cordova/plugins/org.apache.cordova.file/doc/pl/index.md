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

# org.apache.cordova.file

Ten plugin implementuje API pliku, dzięki czemu dostęp do odczytu i zapisu do plików znajdujących się na urządzeniu.

Ten plugin jest oparty na kilka specyfikacje, w tym: HTML5 File API <http://www.w3.org/TR/FileAPI/>

Katalogi (nieistniejącego już) i System Najnowsze rozszerzenia: <http://www.w3.org/TR/2012/WD-file-system-api-20120417/> , chociaż większość z ten plugin kod został napisany podczas wcześniejszych specyfikacji były aktualne: <http://www.w3.org/TR/2011/WD-file-system-api-20110419/>

To również implementuje specyfikację FileWriter: <http://dev.w3.org/2009/dap/file-system/file-writer.html>

Wykorzystania, prosimy odnieść się do skały HTML5 doskonałe [plików art.][1]

 [1]: http://www.html5rocks.com/en/tutorials/file/filesystem/

Omówienie innych opcji przechowywania odnoszą się do Cordova z [magazynu przewodnik][2].

 [2]: http://cordova.apache.org/docs/en/edge/cordova_storage_storage.md.html

## Instalacji

    cordova plugin add org.apache.cordova.file
    

## Obsługiwane platformy

*   Amazon ogień OS
*   Android
*   Jeżyna 10
*   Firefox OS
*   iOS
*   Windows Phone 7 i 8 *
*   Windows 8 *

* *Nie obsługują te platformy `FileReader.readAsArrayBuffer` , ani `FileWriter.write(blob)` .*

## Gdzie przechowywać pliki

Od v1.2.0 znajdują się adresy URL do katalogów ważne systemu plików. Każdy adres URL jest w formie *file:///path/to/spot/*i mogą być konwertowane na `DirectoryEntry` za pomocą`window.resolveLocalFileSystemURL()`.

*   `cordova.file.applicationDirectory`-Tylko do odczytu katalogu gdzie jest zainstalowana aplikacja. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.applicationStorageDirectory`-Katalogu obszaru izolowanego aplikacji; na iOS to miejsce jest tylko do odczytu (ale podkatalogów określonego [jak `/Documents` ] są odczytu i zapisu). Wszystkie dane zawarte w jest prywatną do aplikacji. ( *iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.dataDirectory`-Trwałe i prywatne dane magazynowanie w izolowanym aplikacji przy użyciu pamięci wewnętrznej (na Android, jeśli trzeba użyć zewnętrznej pamięci, należy użyć `.externalDataDirectory` ). Na iOS, Katalog ten nie jest zsynchronizowane z iCloud (za pomocą `.syncedDataDirectory` ). (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.cacheDirectory`-Katalog dla plików buforowanych danych lub pliki, które aplikacji ponownie można łatwo tworzyć. System operacyjny może usunąć te pliki, gdy urządzenie działa niski na przechowywanie, niemniej jednak aplikacje nie powinny polegać na OS, aby usunąć pliki tutaj. (*iOS*, *Android*, *BlackBerry 10*)

*   `cordova.file.externalApplicationStorageDirectory`-Stosowania przestrzeni na zewnętrznej pamięci masowej. (*Android*)

*   `cordova.file.externalDataDirectory`-Gdzie umieścić pliki danych specyficznych dla aplikacji na zewnętrznej pamięci masowej. (*Android*)

*   `cordova.file.externalCacheDirectory`-Pamięci podręcznej aplikacji na zewnętrznej pamięci masowej. (*Android*)

*   `cordova.file.externalRootDirectory`-Korzeń zewnętrznej pamięci masowej (karty SD). (*Android*, *BlackBerry 10*)

*   `cordova.file.tempDirectory`-Temp katalogu systemu operacyjnego można wyczyścić w będzie. Nie należy polegać na OS wobec usunąć ten katalog; aplikacji należy zawsze usunąć pliki jako obowiązujące. (*iOS*)

*   `cordova.file.syncedDataDirectory`-Posiada pliki specyficzne dla aplikacji, które powinny być zsynchronizowane (np. do iCloud). (*iOS*)

*   `cordova.file.documentsDirectory`-Pliki prywatne do aplikacji, ale że mają znaczenie dla innych aplikacji (np. plików pakietu Office). (*iOS*)

*   `cordova.file.sharedDirectory`-Pliki dostępne na całym świecie do wszystkich aplikacji (*BlackBerry 10*)

## Plik System układy

Chociaż technicznie implementacyjnym, może być bardzo przydatne wiedzieć, jak `cordova.file.*` Właściwości mapy fizycznej ścieżki na prawdziwe urządzenie.

### iOS układ systemu plików

| Ścieżka urządzenia                           | `Cordova.File.*`            | `iosExtraFileSystems` | r/w? | trwałe? |  Czyści OS  | Synchronizacja | prywatne |
|:-------------------------------------------- |:--------------------------- |:--------------------- |:----:|:-------:|:-----------:|:--------------:|:--------:|
| `/ var/mobile/Applications/< UUID > /` | applicationStorageDirectory | -                     |  r   |  N/D!   |    N/D!     |      N/D!      |   Tak    |
|    `appname.app/`                            | applicationDirectory        | pakiet                |  r   |  N/D!   |    N/D!     |      N/D!      |   Tak    |
|       `www/`                                 | -                           | -                     |  r   |  N/D!   |    N/D!     |      N/D!      |   Tak    |
|    `Documents/`                              | documentsDirectory          | dokumenty             | r/w  |   Tak   |     Nr      |      Tak       |   Tak    |
|       `NoCloud/`                             | -                           | dokumenty nosync      | r/w  |   Tak   |     Nr      |       Nr       |   Tak    |
|    `Library`                                 | -                           | Biblioteka            | r/w  |   Tak   |     Nr      |      Tak?      |   Tak    |
|       `NoCloud/`                             | dataDirectory               | Biblioteka nosync     | r/w  |   Tak   |     Nr      |       Nr       |   Tak    |
|       `Cloud/`                               | syncedDataDirectory         | -                     | r/w  |   Tak   |     Nr      |      Tak       |   Tak    |
|       `Caches/`                              | cacheDirectory              | pamięci podręcznej    | r/w  |  Tak *  | Tak \* * *| |       Nr       |   Tak    |
|    `tmp/`                                    | tempDirectory               | -                     | r/w  | Nie * * | Tak \* * *| |       Nr       |   Tak    |

* Pliki utrzymywały aplikacja zostanie ponownie uruchomiony i uaktualnienia, ale w tym katalogu mogą być rozliczone, gdy OS pragnienia. Aplikacji powinny być w stanie odtworzyć zawartość, która może być usunięta.

* * Plików może utrzymywać się po ponownym uruchomieniu aplikacji, ale nie opierają się na tym zachowaniu. Pliki nie są gwarantowane w aktualizacji. Aplikacji należy usunąć pliki z tego katalogu, gdy ma to zastosowanie, ponieważ system operacyjny nie gwarantuje Kiedy (lub nawet jeśli) te pliki zostaną usunięte.

\* * *| System operacyjny może wyczyścić zawartość w tym katalogu, gdy czuje, że jest to konieczne, ale nie powoływać się na to. Należy wyczyścić ten katalog jako odpowiednie dla aplikacji.

### Układ systemu Android plików

| Ścieżka urządzenia                      | `Cordova.File.*`                    | `AndroidExtraFileSystems`       | r/w? | trwałe? | Czyści OS | prywatne |
|:--------------------------------------- |:----------------------------------- |:------------------------------- |:----:|:-------:|:---------:|:--------:|
| `file:///android_asset/`                | applicationDirectory                |                                 |  r   |  N/D!   |   N/D!    |   Tak    |
| `/Data/danych/< Aplikacja id > /` | applicationStorageDirectory         | -                               | r/w  |  N/D!   |   N/D!    |   Tak    |
|    `cache`                              | cacheDirectory                      | pamięci podręcznej              | r/w  |   Tak   |   Tak *   |   Tak    |
|    `files`                              | dataDirectory                       | pliki                           | r/w  |   Tak   |    Nr     |   Tak    |
|       `Documents`                       |                                     | dokumenty                       | r/w  |   Tak   |    Nr     |   Tak    |
| `< sdcard > /`                    | externalRootDirectory               | sdcard                          | r/w  |   Tak   |    Nr     |    Nr    |
|    `Android/data/<app-id>/`       | externalApplicationStorageDirectory | -                               | r/w  |   Tak   |    Nr     |    Nr    |
|       `cache`                           | externalCacheDirectry               | zewnętrznych pamięci podręcznej | r/w  |   Tak   |  Nie * *  |    Nr    |
|       `files`                           | externalDataDirectory               | zewnętrznych plików             | r/w  |   Tak   |    Nr     |    Nr    |

* System operacyjny może okresowo usunąć ten katalog, ale nie opierają się na tym zachowaniu. Wyczyść zawartość tego katalogu jako odpowiednie dla danej aplikacji. Należy użytkownik przeczyścić pamięć podręczną ręcznie, zawartość w tym katalogu są usuwane.

* * System operacyjny nie usunąć ten katalog automatycznie; Jesteś odpowiedzialny za zarządzanie zawartość siebie. Należy użytkownik przeczyścić pamięć podręczną ręcznie, zawartość katalogu są usuwane.

**Uwaga**: Jeśli nie mogą być montowane pamięci masowej, `cordova.file.external*` Właściwości są`null`.

### Układ systemu plików blackBerry 10

| Ścieżka urządzenia                                        | `Cordova.File.*`            | r/w? | trwałe? | Czyści OS | prywatne |
|:--------------------------------------------------------- |:--------------------------- |:----:|:-------:|:---------:|:--------:|
| `file:///accounts/1000/AppData/ < id aplikacji > /` | applicationStorageDirectory |  r   |  N/D!   |   N/D!    |   Tak    |
|    `app/native`                                           | applicationDirectory        |  r   |  N/D!   |   N/D!    |   Tak    |
|    `data/webviews/webfs/temporary/local__0`               | cacheDirectory              | r/w  |   Nr    |    Tak    |   Tak    |
|    `data/webviews/webfs/persistent/local__0`              | dataDirectory               | r/w  |   Tak   |    Nr     |   Tak    |
| `file:///accounts/1000/Removable/sdcard`                  | externalRemovableDirectory  | r/w  |   Tak   |    Nr     |    Nr    |
| `file:///accounts/1000/Shared`                            | sharedDirectory             | r/w  |   Tak   |    Nr     |    Nr    |

*Uwaga*: gdy aplikacja jest rozmieszczana do pracy obwodu, wszystkie ścieżki są względne do /accounts/1000-enterprise.

## Android dziwactwa

### Lokalizacja przechowywania trwałych Android

Istnieje wiele prawidłowe lokalizacje do przechowywania trwałych plików na telefonie z systemem Android. Zobacz [tę stronę][3] do szerokiej dyskusji o różnych możliwościach.

 [3]: http://developer.android.com/guide/topics/data/data-storage.html

Poprzednie wersje pluginu wybrać lokalizację plików tymczasowych i trwałe podczas uruchamiania, czy urządzenie twierdził, że karta SD (lub równoważne magazynowanie podzia³) był montowany w oparciu. Czy karta SD została zamontowana, czy duży wewnętrzny magazynowanie podzia³ był dostępny (takie jak na Nexus urządzenia,) a następnie trwałe pliki będą przechowywane w katalogu głównego tego miejsca. Oznaczało to, że wszystkie aplikacje Cordova może Zobacz wszystkie pliki dostępne na karcie.

Jeśli karta SD nie był dostępny, a następnie poprzednie wersje będzie przechowywać dane w `/data/data/<packageId>` , która izoluje aplikacje od siebie, ale nadal może spowodować danych, które mają być współużytkowane przez użytkowników.

Teraz jest możliwe, aby zdecydować, czy do przechowywania plików w lokalizacji magazynu plików, lub przy użyciu poprzedniej logiki, z preferencją w aplikacji `config.xml` pliku. Aby to zrobić, należy dodać jeden z tych dwóch linii do `config.xml` :

    <preference name="AndroidPersistentFileLocation" value="Internal" />
    
    <preference name="AndroidPersistentFileLocation" value="Compatibility" />
    

Bez tej linii, użyje pliku plugin `Compatibility` jako domyślny. Jeśli znacznik preferencji jest obecny i to nie jedną z tych wartości, aplikacja nie zostanie uruchomiona.

Jeśli aplikacja wcześniej zostało wysłane do użytkowników, przy użyciu starszych (pre-1.0) wersję tego pluginu oraz pliki przechowywane w trwałych plików, a następnie należy ustawić preferencje `Compatibility` . Przełączania lokalizacji do "Wewnętrznego" oznacza, że istniejących użytkowników, którzy ich aplikacja może być niesłabnący wobec dostęp ich wcześniej zapisane pliki, w zależności od ich urządzenie.

Jeśli aplikacja jest nowy, lub nigdy wcześniej przechowywane pliki w trwałych plików, a następnie `Internal` ustawienie jest zwykle zalecane.

## iOS dziwactwa

*   `cordova.file.applicationStorageDirectory`jest tylko do odczytu; próby przechowywania plików w katalogu głównym zakończy się niepowodzeniem. Użyj jednego z innych `cordova.file.*` właściwości zdefiniowane dla iOS (tylko `applicationDirectory` i `applicationStorageDirectory` są tylko do odczytu).
*   `FileReader.readAsText(blob, encoding)` 
    *   `encoding`Parametr nie jest obsługiwana, i kodowanie UTF-8 jest zawsze w efekcie.

### iOS lokalizacja przechowywania trwałych

Istnieją dwa ważne miejsca trwałe pliki na urządzenia iOS: katalogu dokumentów i katalogu biblioteki. Poprzednie wersje pluginu tylko kiedykolwiek przechowywane trwałe pliki w katalogu dokumentów. To miał ten efekt uboczny od rozpoznawalności wszystkie pliki aplikacji w iTunes, który był często niezamierzone, zwłaszcza dla aplikacji, które obsługują wiele małych plików, zamiast produkuje kompletne dokumenty do wywozu, który jest przeznaczenie katalogu.

Teraz jest możliwe, aby zdecydować, czy do przechowywania danych w dokumentach lub katalogu biblioteki, z preferencją w aplikacji `config.xml` pliku. Aby to zrobić, należy dodać jeden z tych dwóch linii do `config.xml` :

    <preference name="iosPersistentFileLocation" value="Library" />
    
    <preference name="iosPersistentFileLocation" value="Compatibility" />
    

Bez tej linii, użyje pliku plugin `Compatibility` jako domyślny. Jeśli znacznik preferencji jest obecny i to nie jedną z tych wartości, aplikacja nie zostanie uruchomiona.

Jeśli aplikacja wcześniej zostało wysłane do użytkowników, przy użyciu starszych (pre-1.0) wersję tego pluginu oraz pliki przechowywane w trwałych plików, a następnie należy ustawić preferencje `Compatibility` . Przełączania lokalizacji `Library` oznaczałoby, że istniejących użytkowników, którzy ich aplikacja będzie niesłabnący wobec dostęp ich wcześniej zapisane pliki.

Jeśli aplikacja jest nowy, lub nigdy wcześniej przechowywane pliki w trwałych plików, a następnie `Library` ustawienie jest zwykle zalecane.

## Firefox OS dziwactwa

API systemu plików nie jest obsługiwany macierzyście przez Firefox OS i jest zaimplementowany jako podkładki na indexedDB.

*   Nie usuwając niepuste katalogi
*   Nie obsługuje metadane dla katalogów
*   Metody `copyTo` i `moveTo` nie obsługuje katalogi

Obsługiwane są następujące ścieżki danych: * `applicationDirectory` -używa `xhr` Aby uzyskać lokalne pliki, które są pakowane z aplikacji. * `dataDirectory` - Na trwałe dane specyficzne dla aplikacji pliki. * `cacheDirectory` -Buforowane pliki, które powinny przetrwać ponowne uruchomienie aplikacji (aplikacje nie powinny polegać na OS, aby usunąć pliki tutaj).

## Uaktualniania notatek

W v1.0.0 ten plugin `FileEntry` i `DirectoryEntry` struktur zmieniły się, aby być bardziej zgodnie z opublikowaną specyfikacją.

Poprzednie wersje (pre-1.0.0) plugin przechowywane urządzenia bezwzględna plik lokalizacja w `fullPath` Właściwość `Entry` obiektów. Te ścieżki zazwyczaj będzie wyglądać

    /var/mobile/Applications/<application UUID>/Documents/path/to/file  (iOS)
    /storage/emulated/0/path/to/file                                    (Android)
    

Te ścieżki również zostały zwrócone przez `toURL()` Metoda `Entry` obiektów.

Z v1.0.0 `fullPath` atrybut jest ścieżką do pliku, *względem katalogu głównego systemu plików HTML*. Tak, powyżej ścieżki będzie teraz zarówno reprezentowana przez `FileEntry` obiekt z `fullPath` z

    /path/to/file
    

Jeśli aplikacja działa z ścieżki bezwzględnej urządzeń, i możesz wcześniej źródło tych ścieżek za pomocą `fullPath` Właściwość `Entry` obiektów, a następnie należy zaktualizować kod, aby użyć `entry.toURL()` zamiast.

Do tyłu zgodności, `resolveLocalFileSystemURL()` Metoda akceptuje pomysł ścieżka bezwzględna i zwróci `Entry` obiektu odpowiadającego mu, tak długo, jak ten plik istnieje w albo `TEMPORARY` lub `PERSISTENT` plików.

To szczególnie został problem z pluginem transferu plików, które poprzednio używane ścieżki bezwzględnej urządzeń (i wciąż można je przyjąć). To został zaktualizowany, aby działać poprawnie z adresów URL plików, więc wymiana `entry.fullPath` z `entry.toURL()` powinno rozwiązać wszelkie problemy dostawanie ten plugin do pracy z plików w pamięci urządzenia.

W v1.1.0 wartość zwracana z `toURL()` został zmieniony (patrz \[CB-6394\] (https://issues.apache.org/jira/browse/CB-6394)) zwraca adres URL absolutnej "file://". wszędzie tam, gdzie jest to możliwe. Aby zapewnić ' cdvfile:'-URL można użyć `toInternalURL()` teraz. Ta metoda zwróci teraz adresy URL plików formularza

    cdvfile://localhost/persistent/path/to/file
    

który służy do jednoznacznej identyfikacji pliku.

## Wykaz kodów błędów i ich znaczenie

Gdy błąd jest generowany, jeden z następujących kodów będzie służyć.

| Kod | Stała                         |
| ---:|:----------------------------- |
|   1 | `NOT_FOUND_ERR`               |
|   2 | `SECURITY_ERR`                |
|   3 | `ABORT_ERR`                   |
|   4 | `NOT_READABLE_ERR`            |
|   5 | `ENCODING_ERR`                |
|   6 | `NO_MODIFICATION_ALLOWED_ERR` |
|   7 | `INVALID_STATE_ERR`           |
|   8 | `SYNTAX_ERR`                  |
|   9 | `INVALID_MODIFICATION_ERR`    |
|  10 | `QUOTA_EXCEEDED_ERR`          |
|  11 | `TYPE_MISMATCH_ERR`           |
|  12 | `PATH_EXISTS_ERR`             |

## Konfigurowanie wtyczka (opcjonalny)

Zestaw dostępnych plików może być skonfigurowany na platformie. Zarówno iOS i Android <preference> uchwyt w `config.xml` które nazwy plików do instalacji. Domyślnie włączone są wszystkie korzenie systemu plików.

    <preference name="iosExtraFilesystems" value="library,library-nosync,documents,documents-nosync,cache,bundle,root" />
    <preference name="AndroidExtraFilesystems" value="files,files-external,documents,sdcard,cache,cache-external,root" />
    

### Android

*   `files`: Katalog plików aplikacja
*   `files-external`: Katalog aplikacji zewnętrznych plików
*   `sdcard`: Globalny plik zewnętrzny magazyn katalogu (to jest głównym karty SD, jeśli jedna jest zainstalowana). Musisz mieć `android.permission.WRITE_EXTERNAL_STORAGE` uprawnienie do korzystania z tego.
*   `cache`: Katalogu stosowanie wewnętrznej pamięci podręcznej
*   `cache-external`: Katalog aplikacji zewnętrznych pamięci podręcznej
*   `root`: Całe urządzenie systemu plików

Android obsługuje również specjalnych plików o nazwie "dokumenty", który reprezentuje podkatalog "/ dokumenty /" w ramach systemu plików "pliki".

### iOS

*   `library`: Katalog biblioteki aplikacji
*   `documents`: Katalog dokumentów wniosek
*   `cache`: W katalogu pamięci podręcznej aplikacja
*   `bundle`: Pakiet aplikacji; Lokalizacja aplikacji na dysku (tylko do odczytu)
*   `root`: Całe urządzenie systemu plików

Domyślnie katalogi biblioteki i dokumenty mogą być synchronizowane iCloud. Można również zażądać dwóch dodatkowych plików, `library-nosync` i `documents-nosync` , które stanowią specjalny katalog nie zsynchronizowane w `/Library` lub `/Documents` systemu plików.