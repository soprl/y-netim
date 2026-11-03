# Ya Yönet Ya Devret

Türkiye ve Avrupa haritasında geçen, TypeScript ile yazılmış mobil siyasi simülasyon. Yerel sürüm: **2.5.2**.

## Bu sürümde

- Eğitim ve altyapı programları birkaç dönemde ilerler. Eğitim: 40 başlangıç + üç dönem 6 ödenek (toplam 58); altyapı: 40 başlangıç + iki dönem 8 ödenek (toplam 56). Ödenek yetmezse ilerleme bekler. Programlar yatırım takviminden durdurulabilir; kazanılmış etkiler ve harcanmış para korunur.
- Gazetenin “Ne değişti, neden?” bölümünde doğrudan kararlar, vergi etkisi, savaş yorgunluğu ve proje ödemeleri ölçülen değişimlerle açıklanır. Dönem içindeki anlık etkiler de toplama katılır.

## 2.5.1 ile gelenler

- Rakip partiler, oyuncu başkan olsa da iki dönemde bir kampanya yapar. Her uygun parti kendi kasasından 8 harcar, en fazla 5 kampanya gücü kazanır; yapay zekâ kampanya sınırı 30'dur. Oyuncunun aday veya kurucu olduğu parti elle yönetilir. Aidat ve teşkilat giderleri bütün partilerde işler.
- Devlet ve Karakter ekranlarında günlük kararlar ilk kartta görünür. İkincil bilgiler açılır panellere alınmıştır; açılan paneller karar sonrasında da açık kalır.
- Kişisel destek, karakterin bölgesel tabanının nüfusa göre ortalamasıdır. Yönetim desteği mevcut yönetime duyulan memnuniyettir. Karttaki bilgi düğmesi farkı açıklar; gazete ve bölge etiketleri de ayrılmıştır.

## Çalıştırma

Node.js 22 veya üzeri gerekir.

```sh
npm ci
npm run check
npm run build
node tests/server.mjs
```

Yerel oyun: `http://127.0.0.1:4173`. Yayınlanacak statik dosyalar `dist/` dizininde üretilir.

```sh
npm test
```

Testler TypeScript kontrolünü, derlemeyi ve Chromium'da oynanış/ekran kontrollerini çalıştırır. Sistem Chromium'u yoksa önce `npx playwright install chromium` çalıştırılabilir. Farklı bir tarayıcı dosyası için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` kullanılabilir.

## Kaynak geçmişi

GitHub'daki başlangıç deposu yalnızca README içeriyordu. Uygulamanın temeli, Vercel'deki `dpl_5XkPLoxptoBHpfh4Q9hW9MuEDvMn` yayınından alınan 26 dosyalık **2.5.0** kaynak kopyasıdır. Dosya özetleri ve derlenen JavaScript, HTML ve service worker canlı sürümle doğrulanmıştır.

Yayın kaynaklarında bulunmayan `tsconfig.contracts.json` ve `tests/smoke.py` dosyalarına yapılan eski komut başvuruları kaldırılmış; mevcut kaynaklara yönelik Playwright kontrolleri eklenmiştir. 2.5.2 eski kayıtları açar; yeni yatırım ve gazete alanları eksikse varsayılan değerlerle eklenir.
