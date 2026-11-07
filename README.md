# Kasa — kalkulator finansów v1.6
Statyczna aplikacja PWA dla Wojciecha Wieczorka. Saldo początkowe, przychody i wydatki netto/brutto, VAT, włączanie pozycji, podsumowanie gotówki brutto i CSV. Dane zapisują się lokalnie.

Uruchomienie: `python3 -m http.server 8767`
Testy: `python3 tests/test_app.py` (Playwright + Chromium).

Kwoty: spacje, przecinek dziesiętny, tys./tyś./k/mln i dodawanie/odejmowanie. Nieobsługiwane mnożenie i dzielenie. Kropka w układzie grup tysięcy (np. 1.234) jest separatorem tysięcy; dla części dziesiętnych preferowany przecinek.

Nie jest rozliczeniem podatkowym. VAT nie jest ponownie odejmowany od salda. Instalacja/offline wymaga pierwszego uruchomienia online; font Inter online, systemowy font awaryjny offline. Emulacja iPhone to Chromium, nie Safari.

Aplikacja działa lokalnie i na GitHub Pages. Uruchomienie także przez bezpośrednie otwarcie index.html (file://), bez service workera. localStorage dla file:// zależy od przeglądarki.

v1.2: automatyczne grupowanie kwot podczas pisania, format po opuszczeniu pola, kompaktowe pozycje z edycją/usuwaniem i pojedynczy formularz dodawania na sekcję.

v1.2: formularze nad listami, najnowsze pozycje pierwsze, ciemna sekcja wydatków, czytelne wiersze i sumy sekcji.

v1.3: mniejszy interfejs, kontener 1040 px, ciaśniejsze formularze i wiersze oraz niższe podsumowanie; pola mobilne mają minimum 16 px.

v1.6: ciepłe kremowe tło, szeryfowa typografia, wspólny formularz wpisów, zielone przychody i bordowe wydatki, kompaktowe saldo w nagłówku. Testy bieżącego interfejsu: `python3 tests/test_v14.py`.

v1.6: raport A4 PDF (jsPDF 2.5.2 + AutoTable 3.8.4), fonty DejaVu Serif/Sans z lokalnie osadzonymi polskimi znakami, podsumowanie, tabele wielostronicowe, pozycje poza sumą. Przycisk zapisuje PDF; dla przeglądarek bez atrybutu download otwiera PDF w nowej karcie. Ikony Kasa SVG/PNG i Apple touch. Testy bieżące: tests/test_v15.py.

Dodatki v1.6: zielona ikona portfela (Apple/PWA/maskable), znacznie niższy formularz Nowy wpis. Raport przetestowany offline przez file://, także przy 95 dodatkowych wydatkach (8 stron, powtarzane nagłówki). Safari nie testowano na rzeczywistym urządzeniu.


## v1.6 — synchronizacja (przygotowana lokalnie, aktywacja oczekuje)
Projekt: aypxpsuzobcjoiquucws. Wyłącznie publiczny publishable key w sync-config.js; nigdy service_role. Nie zmieniano ani nie czytano danych istniejących tabel (sprawy, settings, invoices). Nie dotykano projektu BikeRc.

Proponowany nowy obiekt z RLS: docs/kasa-state-proposed.sql. SQL NIE został wykonany — wymaga zgody właściciela na dokładną zmianę. Po wykonaniu należy ponownie uruchomić security advisors i sprawdzić dostęp dwóch użytkowników. Bieżący advisor wskazuje tylko wcześniejsze wyłączone leaked password protection (nie zmieniano).

Logowanie kodem e-mail: Supabase → Authentication → Email Templates → Magic Link i Confirm signup: dodaj `<p>Twój kod logowania: {{ .Token }}</p>`. Zachowaj pozostałą treść szablonów. Kod jest weryfikowany w aplikacji bez przekierowania, również przez file://. Nie trzeba zmieniać Site URL ani listy redirectów. W zależności od ograniczeń domyślnego mailera wymagane SMTP dla adresów poza zespołem projektu. Nie wysyłano prawdziwych maili ani nie tworzono kont testowych. Sesje są lokalne dla przeglądarki/origin; na iPhonie i Macu trzeba zalogować ten sam e-mail.

Pierwsze logowanie przy dwóch zestawach danych wymaga wyboru; później nowszy updated_at wygrywa, nie sklejamy list. Zapisy są opóźnione 800 ms i chronione przed równoczesną zmianą przez porównanie updated_at. Offline zmiany czekają lokalnie. Zegar urządzenia wpływa na wybór nowszej wersji — urządzenia powinny mieć automatyczny czas. Wylogowanie zachowuje lokalne dane; na współdzielonym urządzeniu po wylogowaniu użyj Wyczyść. Wchodząc na inne konto, istniejące dane nie są automatycznie przesyłane.

Testy: tests/test_sync.py (mock dwóch urządzeń, bez realnego API), tests/test_v16.py (UI/PDF HTTP i file://), tests/test_pdf.py. Faktyczne RLS i dostarczanie e-mail wymagają testu po aktywacji tabeli/szablonów. Wersji 1.6 nie opublikowano, aby nie udawać gotowej synchronizacji przed aktywacją backendu.
