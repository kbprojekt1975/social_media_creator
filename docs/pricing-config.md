# Konfiguracja Cennika (Firestore: `config/pricing`)

Ten plik dokumentuje wszystkie zmienne konfiguracyjne odpowiedzialne za ekonomię i system kredytów (tokenów) w aplikacji Social Media Creator. Zmiana tych wartości w panelu Firebase (Firestore) natychmiast wpływa na działanie całej aplikacji, bez konieczności modyfikowania kodu źródłowego.

## Waluta w aplikacji
Główną i jedyną walutą w aplikacji są **Tokeny** (często nazywane kredytami). Wszystkie poniższe wartości są wyrażone w tych jednostkach.

---

### Koszty Generowania Treści

*   **`POST_COST`** (domyślnie: `5000`)
    *   **Za co odpowiada:** Koszt wygenerowania pojedynczego tekstu posta (np. na LinkedIn, Twittera, Facebooka) przez model AI. To najtańsza operacja w systemie.

*   **`IMAGE_COST`** (domyślnie: `105000`)
    *   **Za co odpowiada:** Koszt wygenerowania jednego obrazu (grafiki) przez model wizualny (Nano Banana / Gemini Image). Znacznie wyższy koszt niż tekst ze względu na większe zużycie zasobów AI.

*   **`VIDEO_COST`** (domyślnie: `1100000`)
    *   **Za co odpowiada:** Koszt wygenerowania jednego klipu wideo przez model Veo 3.1 Lite. To najdroższa pojedyncza operacja w systemie, ponieważ generowanie wideo wymaga ogromnej mocy obliczeniowej (operacja typu Long Running).

*   **`GIF_COST`** (domyślnie: `350000`)
    *   **Za co odpowiada:** Koszt stworzenia animacji GIF. Plasuje się cenowo pomiędzy zwykłym obrazem a pełnym filmem wideo.

*   **`CAMPAIGN_COST`** (domyślnie: `25000`)
    *   **Za co odpowiada:** Koszt stworzenia kompletnej strategii kampanii reklamowej w zakładce "Planowanie Kampanii". Kampania to wieloetapowe zapytanie do AI, stąd wyższy koszt niż pojedynczy post, ale niższy niż generowanie mediów.

*   **`REFINE_COST`** (domyślnie: `5000`)
    *   **Za co odpowiada:** Koszt wykonania tzw. "poprawki" (Refine). Pobierany, gdy użytkownik prosi asystenta o zmianę już wygenerowanego tekstu posta lub zmodyfikowanie promptu (opisu) do wygenerowania grafiki.

---

### Ustawienia Systemowe i Przyznawanie Tokenów

*   **`TOKENS_PER_PLN`** (domyślnie: `1000000`)
    *   **Za co odpowiada:** Globalny mnożnik wartości pieniądza. Określa, ile tokenów reprezentuje 1 PLN (polski złoty). Jest to zmienna bazowa przydatna przy dodawaniu nowych paczek w sklepie (np. paczka za 10 zł przydzieli użytkownikowi `10 * TOKENS_PER_PLN`).

*   **`MIN_TOKENS_FOR_GEN`** (domyślnie: `1000`)
    *   **Za co odpowiada:** "Zabezpieczenie techniczne". Jest to absolutne minimum tokenów, jakie użytkownik musi posiadać na koncie, aby w ogóle móc kliknąć jakikolwiek przycisk generowania. Zapobiega to sytuacjom brzegowym (np. zejściu z saldem mocno na minus w przypadku nagłego wygenerowania wielu rzeczy na raz w różnych zakładkach).

*   **`CREDIT_RATIO`** (domyślnie: `0.2`)
    *   **Za co odpowiada:** Zmienna pomocnicza, wykorzystywana (głównie historycznie) do wizualnego skalowania paska postępu w niektórych miejscach interfejsu lub do starych przeliczeń rynkowych. Wpływa na to, jak aplikacja "tłumaczy" surowe miliony tokenów na liczby czytelne dla ludzkiego oka w starszych komponentach.

---

### Nowo dodane zmienne (Do pełnej kontroli)
*(Pojawią się w bazie automatycznie przy pierwszej rejestracji/zakupie lub możesz dodać je ręcznie jako typ Number)*

*   **`WELCOME_TOKENS`** (domyślnie: `50000`)
    *   **Za co odpowiada:** Budżet powitalny. Ilość darmowych kredytów, którą każdy nowy użytkownik otrzymuje automatycznie w sekundzie, gdy założy u Ciebie konto (np. logując się przez Google). Pozwala na wygenerowanie około 10 darmowych postów tekstowych na zachętę.

*   **`SUBSCRIPTION_TOKENS`** (domyślnie: `10000000` - 10 milionów)
    *   **Za co odpowiada:** Pula tokenów przyznawana automatycznie z chwilą wykupienia płatnego planu miesięcznego (np. pakietu za 50 zł). 10 milionów starcza orientacyjnie na: 60 postów, 40 grafik i ok. 5 filmów wideo. Zmieniając tę wartość, decydujesz o wielkości pakietu, jaki kupują klienci.
