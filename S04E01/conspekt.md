###TREŚĆ ZADANIA:

Centrala posiada uszkodzone zdjęcia odzyskane z aparatu cyfrowego. Istnieje szansa, że na niektórych z nich jest Barbara. Nie wiemy, jak wygląda Barbara. Możesz na żywo porozmawiać z automatem działającym w centrali. Automat nie jest zbyt sprytny, ale może Ci pomóc w poprawieniu jakości zdjęć i w naprawianiu ich. Twoim zadaniem jest przygotowanie rysopisu Barbary.

Automat może dla Ciebie poprawić posiadane zdjęcia. Obsługuje on kilka narzędzi:

naprawa zdjęcia zawierającego szumy/glitche

rozjaśnienie fotografii

przyciemnienie fotografii

Oto polecenia, które rozpoznaje automat:

REPAIR NAZWA_PLIKU

DARKEN NAZWA_PLIKU

BRIGHTEN NAZWA_PLIKU

Gdy będziesz mieć już pewność co do wyglądu Barbary, przygotuj jej rysopis w języku polskim. Uwzględnij wszystkie szczegóły ze zdjęć, które pomogą nam ją rozpoznać.

Zadanie nazywa się photos.

API do obróbki zdjęć działa w sposób opisany poniżej i słucha jak zawsze na /report

{
 "task":"photos",
 "apikey":"TWÓJ KLUCZ API",
 "answer":"START"
}


Słowem “START” rozpoczynasz rozmowę z automatem. Przedstawi Ci on cztery fotografie. Niekoniecznie wszystkie z nich przedstawiają Barbarę i nie wszystkie z nich zawierają istotne dla nas szczegóły. Wydaj automatowi polecenia, mówiąc, na którym zdjęciu powinien wykonać jaką operację.

Co należy zrobić w zadaniu?

Wyślij do zadania o nazwie “photos” pole “answer” ustawione na “START” (tylko to jedno słowo). Pamiętaj o przesłaniu swojego klucza API. To zapytanie wygląda dokładnie tak, jak przy każdym innym zgłaszaniu odpowiedzi.

W odpowiedzi na zapytanie, automat podzieli się z Tobą czterema zdjęciami odzyskanymi z uszkodzonego aparatu cyfrowego. Automat nie wie, co one przedstawiają. Na pewno na którymś, a może nawet na wszystkich jest Barbara.

Poinstruuj automat, jak należy poprawić te zdjęcia. Możesz wysyłać polecenia np: DARKEN IMG_1234.PNG

Automat odpowiada w języku naturalnym, zwracając nieustrukturyzowane dane. Czasami to będzie URL do zdjęcia, a czasami opis tego, jak to zdjęcie zdobyć.

Jeśli już wiesz, jak wygląda Barbara, przygotuj jej rysopis i wyślij go w polu “answer” do centrali jako zadanie “photos”. 

Jeśli eksperci pracujący w centrali potwierdzą, że rysopis jest wystarczający, to w odpowiedzi otrzymasz flagę.

UWAGA: każde poprawne polecenie wydane do automatu kończy się kodem ZERO i zwrotką “200 OK”. Nie oznacza to jednak, że zadanie jest zaliczone, a jedynie znaczy tyle, że poprawnie udało Ci się porozmawiać z automatem.

Format finalnej odpowiedzi na zadanie:

{
    "task": "photos",
    "apikey": "1111-11-11-11-1111",
    "answer": "tekstowy dokładny rysopis Barbary"
}

🧅 HINT 🧅: jeśli chcesz oszczędzić tokeny w tym zadaniu, to każde z dostarczonych zdjęć posiada wersję o 50% mniejszą. Wystarczy dopisać do nazwy pliku sufix “-small”, czyli zamiast IMG_123.PNG możesz operować na IMG_123-small.PNG. Pamiętaj, że na fotkach o niższej rozdzielczości, rozpoznawanie elementów może być trudniejsze dla modeli LLM.


###PROPONOWANE ROZWIĄZANIE

//inicjalizacja zapytania funkcją start()
//później odpowiedź od API jest automatycznie przekazywana do agenta

// <prompt1>

// analizowanie zdjęcia: jakie poprawki należy wprowadzić 
// zwrócić akcje do wykonania dla zdjęcia 
// JSON {_thinking: "", filename: "", action: ""}

//toolkit:
// REPAIR NAZWA_PLIKU
// DARKEN NAZWA_PLIKU
// BRIGHTEN NAZWA_PLIKU

// agent powinien analizować czy na którym z podanych zdjęć jest Barbara
// jeśli nie da się tego stwierdzić: wprowadzić poprawki do zdjęć
// jeśli zdjęcie jest gotowe: flaga readyToDescribe: true
// isBarbara: true


// <prompt2>
// przekazać zdjęcia, gdzie readyToDescribe i isBarbara === true
// drugi agent przygotowuje rysopis

//jeśli rysopis jest ready: wysyłanie zapytania


//TODO:

// przeanalizować projekt TODO
// na podstawie działania tej aplikacji pomoc w zaprojektowaniu agenta do rozpozwania zdjęć
// przygotowanie założeń do promptów
// wygenerować prompty na podstawie metapromptu
// wygenerowanie kodu aplikacji