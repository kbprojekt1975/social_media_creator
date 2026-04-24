# Modele Sztucznej Inteligencji (LLM / Generative AI)

Ten dokument opisuje modele sztucznej inteligencji, z których korzysta aplikacja Social Media Creator, ich główne przeznaczenie oraz sposób komunikacji z nimi.

Wszystkie modele w systemie pochodzą z ekosystemu **Google AI Studio (Gemini API)**.

---

## 1. Gemini 2.5 Flash Lite
**(ID w kodzie: `gemini-2.5-flash-lite`)**

Jest to główny model tekstowy aplikacji ("koń roboczy"). Ze względu na to, że wersja Flash Lite jest niezwykle szybka, tania i świetnie radzi sobie z rozumowaniem oraz podążaniem za instrukcjami, aplikacja używa go do niemal każdej operacji związanej z tekstem. 

Komunikacja z modelem odbywa się za pomocą oficjalnego SDK Google (`@google/generative-ai`).

**Główne zastosowania:**
*   **Orkiestracja i Planowanie (`generatePostPlan`)**: Tworzenie logicznych założeń posta na podstawie tematu oraz pisanie technicznego promptu w języku angielskim dla innych modeli.
*   **Generowanie Treści (`generatePost`)**: Właściwe pisanie postów w języku polskim z zachowaniem reguł danej platformy (LinkedIn, Facebook, itd.) i tonu.
*   **Tłumaczenia i Konwersja (`translateToTechnicalPrompt`, `generateVisualPrompt`)**: Przekształcanie pomysłu na wpis w wysoce opisowy prompt wizualny w języku angielskim, który posłuży do wygenerowania grafiki lub wideo.
*   **Kreator Kampanii (`generateCampaignPlan` itp.)**: Tworzenie rozbudowanych strategii marketingowych, rozbijanie ich na pojedyncze wpisy z wyliczeniem dat i formatów.
*   **Poprawki (Refine)**: Przyjmowanie poleceń od użytkownika (np. "zrób ten tekst bardziej zabawnym") i błyskawiczne modyfikowanie poprzednich wyników.

---

## 2. Gemini 3.1 Flash Image (Nano Banana)
**(ID w kodzie: `models/gemini-3.1-flash-image-preview`)**

Najnowszy model wizualny od Google, zoptymalizowany pod kątem szybkiego generowania bardzo fotorealistycznych i kreatywnych grafik. Komunikacja odbywa się bezpośrednio przez REST API Google AI Studio. W interfejsie często określany jako "Nano Banana".

**Główne zastosowania:**
*   **Text-to-Image (`generateNanoBananaImage`)**: Generowanie grafik promocyjnych, zdjęć produktowych lub abstrakcyjnych teł bezpośrednio na podstawie angielskiego opisu przygotowanego przez model tekstowy.
*   **Image-to-Image (Refine)**: W Edytorze Wizualnym model ten potrafi przyjąć już wygenerowaną grafikę jako obraz referencyjny i na podstawie nowej instrukcji tekstowej nanieść poprawki lub zmienić styl.

---

## 3. Veo 3.1 Lite
**(ID w kodzie: `models/veo-3.1-lite-generate-preview`)**

Zaawansowany model wideo od Google. Z uwagi na dużą zasobochłonność, komunikacja z nim odbywa się przez REST API z wykorzystaniem metody asynchronicznej (tzw. `predictLongRunning`). Oznacza to, że aplikacja najpierw zleca zadanie do chmury, otrzymuje ID operacji, a następnie regularnie odpytuje serwer, czy klip wideo jest już gotowy.

**Główne zastosowania:**
*   **Generowanie Wideo (`generateVeoVideo`)**: Tworzenie krótkich (standardowo ok. 6 sekund) klipów wideo, np. na TikTok, Reels czy YouTube Shorts.
*   **Image-to-Video**: Model potrafi przyjąć grafikę (np. wygenerowaną chwilę wcześniej przez Nano Banana) i nadać jej ruch (animację) na podstawie promptu. Zapewnia to ogromną spójność kampanii – można najpierw wygenerować idealne zdjęcie produktu, a potem je ożywić.
