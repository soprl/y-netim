# Dünya krizleri · 2.8.0

## Oyun amacı

Dünya, oyuncunun eylemlerinden bağımsız biçimde krizler üretir. Her kriz dış politika fırsatı, risk veya askeri yönetim tercihi sunar. Tek bir kriz aynı anda açılır; seçim yapılana kadar dönem ilerlemez.

## Olay türleri

| Olay | Oluşan durum | Oyuncu kararları | Temel sonuç |
|---|---|---|---|
| Bağımsızlık ilanı | Bir bölge ayrılır ve yeni devlet kurulur | Tarafı destekle, arabuluculuk yap, askeri yönetimle bastır, komşuysan harekât başlat, tarafsız kal | Yeni devlet tanınabilir, eski devlete katılabilir veya askeri müdahaleye uğrayabilir |
| Taht kavgası | Lider ölür, iki aday yönetim için yarışır | Adaylardan birini destekle, arabuluculuk yap, askeri yönetimle bastır, tarafsız kal | Adaylardan biri lider olur veya ordu yönetime geçer |
| Ülke bölünmesi | Birden fazla bölge yeni bir ülke oluşturur | Tarafı destekle, arabuluculuk yap, askeri yönetimle bastır, komşuysan harekât başlat, tarafsız kal | Yeni devlet sürer, tekrar birleşir veya askeri çatışma başlar |

## Kaynaklar ve denge varsayımları

- Kriz kontrolü her 3 dönemde bir, %32 olasılıkla denenir; açık kriz varken yeni kriz çıkmaz. Bu sıklık ilk sürüm ayarıdır `[PLACEHOLDER: oyun testiyle ayarlanacak]`.
- Devlet desteği 12 hazine, arabuluculuk 15 hazine, askeri müdahale 30 hazine ve 10 ordu, sınır harekâtı 25 hazine ve en az 20 ordudur.
- Karakter modunda siyasi destek 10 kişisel para, arabuluculuk 5 kişisel paradır.
- Askeri yönetim istikrarı yükseltir; baskı ve yönetim desteği bedeli doğurur. Harekât, mevcut savaş ve ilerleyen operasyon sistemine bağlanır.

## Kenar durumları

- Ayrılabilecek başkent veya son bölge bulunmayan ülkeler bağımsızlık/bölünme adayı olmaz.
- Lider ölümü krizi oyuncunun yönettiği ülkeyi hedef almaz; oyuncu mevcut karakterini kaybetmez.
- Oyuncu sınır komşusu değilse toprak kazanma harekâtı seçeneği kapalı kalır.
- Kriz kayıtları eski kayıtlarla uyumludur; yeni kayıt alanları ilk yüklemede varsayılan değer alır.
