# Kasa — kalkulator finansów v1.7
Statyczna PWA dla Wojciecha Wieczorka. Saldo początkowe, przychody i wydatki netto/brutto, VAT, wliczanie pozycji, podsumowanie gotówki brutto, eksport CSV i wielostronicowy PDF z polskimi znakami.

Uruchomienie: `python3 -m http.server 8767`. Można też otworzyć `index.html` przez file://: kalkulator i PDF działają lokalnie, logowanie jest wyłączone i prowadzi do adresu WWW.

## Synchronizacja i logowanie
Projekt aypxpsuzobcjoiquucws; tabela public.kasa_state z RLS została wcześniej utworzona przez właściciela/rodzica. v1.7 nie zmienia bazy ani ustawień Auth. W konfiguracji jest wyłącznie publiczny publishable key. Nie wolno dodawać secret/service_role.

Przycisk Synchronizuj wysyła standardowy magic link. Kliknij „Sign in” w wiadomości; kalkulator otworzy się zalogowany. Opcjonalne wpisanie kodu jest schowane pod „Masz kod? Wpisz go” i wymaga kodu faktycznie zawartego w mailu. Nie trzeba modyfikować szablonów wiadomości ani Site URL.

W Supabase Authentication → URL Configuration → Redirect URLs właściciel dodaje `https://wwieczor-commits.github.io/kalkulator-finansow/**`. Link wysyłany jest z emailRedirectTo ustawionym dokładnie na adres kalkulatora z końcowym `/`.

Używany jest flowType `implicit`, detectSessionInUrl true. Pozwala to odebrać link na innym urządzeniu bez PKCE code_verifier z urządzenia wysyłającego. SDK wczytuje sesję z fragmentu URL; po zakończeniu inicjalizacji usuwamy parametry autoryzacyjne i hash (nie logujemy tokenów). Link jest jednorazowy. Sesja przechowywana jest w lokalnej pamięci przeglądarki. Zaloguj ten sam e-mail na obu urządzeniach.

Na iPhonie link z Mail zwykle otwiera Safari. Sesja Safari nie jest automatycznie przenoszona do aplikacji z ekranu głównego. Najprościej po logowaniu korzystać z kalkulatora w Safari. Nie obiecujemy automatycznego zalogowania PWA ani przenoszenia tokenów między przeglądarkami.

Pierwsze logowanie: jeśli chmura nie ma danych (także gdy istnieje pusty wiersz), dane lokalne są wysyłane. Jeśli oba zestawy mają dane — wymagany wybór, bez cichego nadpisania. Wejście na inne konto z danymi poprzedniego konta również wymaga wyboru. Później nowszy updated_at wygrywa, przy zegarach urządzeń ustawionych automatycznie. Zapis opóźniony 800 ms, porównanie updated_at zabezpiecza równoczesne zapisy. Odświeżanie po focus/online. Offline zapis lokalny i kolejka wysyłania. Wylogowanie nie usuwa danych lokalnych; na współdzielonym urządzeniu następnie Wyczyść.

## PDF i offline
Lokalne jsPDF 2.5.2, AutoTable 3.8.4 i osadzone fonty DejaVu Serif/Sans. Raport ma datę Europe/Warsaw, podsumowanie, tabele z powtarzanymi nagłówkami, sekcję poza sumą i numery stron. Nie jest deklaracją podatkową. VAT nie jest ponownie odejmowany od salda gotówki. Google Fonts w interfejsie mają fonty systemowe awaryjne offline. Service worker buforuje tylko własny origin, nie API Supabase.

## Testy
`python3 tests/test_v17.py`: HTTP i file://, iPhone 13 / laptop, działania kalkulatora i PDF.
`python3 tests/test_sync_v17.py`: mock klienta, dwa urządzenia, wybór danych, debounced save, kolejka offline, cloud-empty safety i wyłączenie logowania file://.
`python3 tests/test_magic_redirect.py`: prawdziwy vendored Supabase SDK + mock API, magic link w nowym kontekście bez PKCE i czyszczenie URL.
`python3 tests/test_pdf.py`: polskie znaki, pozycje poza sumą i 8 stron przy 95 dodatkowych kosztach.

Nie wysyłano realnych maili i nie tworzono kont testowych. Faktyczna dostarczalność maila i ustawienie Redirect URLs wymagają sprawdzenia przez właściciela. iPhone to emulacja Chromium, nie rzeczywisty Safari.
