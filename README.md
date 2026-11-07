# Kalkulator finansów v1.1
Statyczna aplikacja PWA dla Wojciecha Wieczorka. Saldo początkowe, przychody i wydatki netto/brutto, VAT, włączanie pozycji, podsumowanie gotówki brutto i CSV. Dane zapisują się lokalnie.

Uruchomienie: `python3 -m http.server 8767`
Testy: `python3 tests/test_app.py` (Playwright + Chromium).

Kwoty: spacje, przecinek dziesiętny, tys./tyś./k/mln i dodawanie/odejmowanie. Nieobsługiwane mnożenie i dzielenie. Kropka w układzie grup tysięcy (np. 1.234) jest separatorem tysięcy; dla części dziesiętnych preferowany przecinek.

Nie jest rozliczeniem podatkowym. VAT nie jest ponownie odejmowany od salda. Instalacja/offline wymaga pierwszego uruchomienia online; font Inter online, systemowy font awaryjny offline. Emulacja iPhone to Chromium, nie Safari.

Wersja lokalna: nie publikować i nie wypychać na GitHub. Uruchomienie także przez bezpośrednie otwarcie index.html (file://), bez service workera. localStorage dla file:// zależy od przeglądarki.

v1.1: automatyczne grupowanie kwot podczas pisania, format po opuszczeniu pola, kompaktowe pozycje z edycją/usuwaniem i pojedynczy formularz dodawania na sekcję.
