# Kasa — kalkulator finansów v1.5
Statyczna aplikacja PWA dla Wojciecha Wieczorka. Saldo początkowe, przychody i wydatki netto/brutto, VAT, włączanie pozycji, podsumowanie gotówki brutto i CSV. Dane zapisują się lokalnie.

Uruchomienie: `python3 -m http.server 8767`
Testy: `python3 tests/test_app.py` (Playwright + Chromium).

Kwoty: spacje, przecinek dziesiętny, tys./tyś./k/mln i dodawanie/odejmowanie. Nieobsługiwane mnożenie i dzielenie. Kropka w układzie grup tysięcy (np. 1.234) jest separatorem tysięcy; dla części dziesiętnych preferowany przecinek.

Nie jest rozliczeniem podatkowym. VAT nie jest ponownie odejmowany od salda. Instalacja/offline wymaga pierwszego uruchomienia online; font Inter online, systemowy font awaryjny offline. Emulacja iPhone to Chromium, nie Safari.

Aplikacja działa lokalnie i na GitHub Pages. Uruchomienie także przez bezpośrednie otwarcie index.html (file://), bez service workera. localStorage dla file:// zależy od przeglądarki.

v1.2: automatyczne grupowanie kwot podczas pisania, format po opuszczeniu pola, kompaktowe pozycje z edycją/usuwaniem i pojedynczy formularz dodawania na sekcję.

v1.2: formularze nad listami, najnowsze pozycje pierwsze, ciemna sekcja wydatków, czytelne wiersze i sumy sekcji.

v1.3: mniejszy interfejs, kontener 1040 px, ciaśniejsze formularze i wiersze oraz niższe podsumowanie; pola mobilne mają minimum 16 px.

v1.5: ciepłe kremowe tło, szeryfowa typografia, wspólny formularz wpisów, zielone przychody i bordowe wydatki, kompaktowe saldo w nagłówku. Testy bieżącego interfejsu: `python3 tests/test_v14.py`.

v1.5: raport A4 PDF (jsPDF 2.5.2 + AutoTable 3.8.4), fonty DejaVu Serif/Sans z lokalnie osadzonymi polskimi znakami, podsumowanie, tabele wielostronicowe, pozycje poza sumą. Przycisk zapisuje PDF; dla przeglądarek bez atrybutu download otwiera PDF w nowej karcie. Ikony Kasa SVG/PNG i Apple touch. Testy bieżące: tests/test_v15.py.

Dodatki v1.5: zielona ikona portfela (Apple/PWA/maskable), znacznie niższy formularz Nowy wpis. Raport przetestowany offline przez file://, także przy 95 dodatkowych wydatkach (8 stron, powtarzane nagłówki). Safari nie testowano na rzeczywistym urządzeniu.

v1.9: niższy, kremowy półprzezroczysty pasek podsumowania, mniejsza kwota z zielonym/bordowym kolorem; odstęp pod treścią automatycznie odpowiada wysokości paska. Bez zmian formatu danych/localStorage.
