# Kasa — kalkulator finansów v1.4
Statyczna aplikacja PWA dla Wojciecha Wieczorka. Saldo początkowe, przychody i wydatki netto/brutto, VAT, włączanie pozycji, podsumowanie gotówki brutto i CSV. Dane zapisują się lokalnie.

Uruchomienie: `python3 -m http.server 8767`
Testy: `python3 tests/test_app.py` (Playwright + Chromium).

Kwoty: spacje, przecinek dziesiętny, tys./tyś./k/mln i dodawanie/odejmowanie. Nieobsługiwane mnożenie i dzielenie. Kropka w układzie grup tysięcy (np. 1.234) jest separatorem tysięcy; dla części dziesiętnych preferowany przecinek.

Nie jest rozliczeniem podatkowym. VAT nie jest ponownie odejmowany od salda. Instalacja/offline wymaga pierwszego uruchomienia online; font Inter online, systemowy font awaryjny offline. Emulacja iPhone to Chromium, nie Safari.

Aplikacja działa lokalnie i na GitHub Pages. Uruchomienie także przez bezpośrednie otwarcie index.html (file://), bez service workera. localStorage dla file:// zależy od przeglądarki.

v1.2: automatyczne grupowanie kwot podczas pisania, format po opuszczeniu pola, kompaktowe pozycje z edycją/usuwaniem i pojedynczy formularz dodawania na sekcję.

v1.2: formularze nad listami, najnowsze pozycje pierwsze, ciemna sekcja wydatków, czytelne wiersze i sumy sekcji.

v1.3: mniejszy interfejs, kontener 1040 px, ciaśniejsze formularze i wiersze oraz niższe podsumowanie; pola mobilne mają minimum 16 px.

v1.4: ciepłe kremowe tło, szeryfowa typografia, wspólny formularz wpisów, zielone przychody i bordowe wydatki, kompaktowe saldo w nagłówku. Testy bieżącego interfejsu: `python3 tests/test_v14.py`.
