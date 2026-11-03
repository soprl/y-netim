# Ya Yönet Ya Devret

Türkiye ve Avrupa haritasında geçen, TypeScript ile yazılmış mobil siyasi simülasyon. Sürüm: **2.6.0**.

## 2.6.0 ile gelenler

- Harita içinde sürükleme, iki parmakla veya tekerlekle 1–5× yakınlaştırma; +, − ve sıfırlama düğmeleri. Diğer ekranların kaydırması değişmez. Ok tuşları haritayı kaydırır, +/− yakınlaştırır, 0 sıfırlar.
- Silahlı hareketler için iki renk, desen ve simgeden oluşan kaydedilebilir bayrak. Silah desteği 15 kişisel para ve 1 eylem karşılığında +10 silah gücü; malzeme desteği 10 para ve 1 eylem karşılığında +20 stok sağlar. Her destek türü dönem başına bir kez alınır. Devlet başkanları başka ülkelerdeki hareketleri 20 hazine ve 1 eylemle destekleyebilir; devletleşmemiş harekete destek diplomatik ilişkiyi 8 düşürür. Her aktif kontrol mücadelesi döneminde 5 malzeme ve 1 silah gücü tüketilir; malzeme güç kaybını azaltır.
- Bölge ekranındaki “Vali ata” üç adayın liderlik gücünü gösterir. Onaylanan atama 1 eylem harcar; iptal ücretsizdir.
- Parti kurmadan bağımsız milletvekili adaylığı: 10 kişisel para ve 1 eylem. Başarı yerel destek, tanınırlık, hitabet ve kampanyaya bağlıdır; her başarılı aday bir sandalye kazanır. Bağımsızlar bir partiye dönüştürülmez, toplam 100 sandalye korunur. Yeniden seçilemeyen vekil görevini kaybeder; adaylıktan çekilmek ve vekillikten ayrılmak mümkündür.
- Bölge ekranında yerel halk buluşmaları: 5 kişisel para ve 1 eylem; yalnızca ziyaret edilen bölgenin desteği artar. Aynı yere yeniden gitmek için 2 dönem beklenir. Kalabalığın karşılaması yerel desteğe göre açıklanır. Bu sürüm mevcut oyun bölgelerini kullanır; 81 il haritası içermez.
- Haritada yabancı ülkeyi seçip Rapor/Emirler → Ülke yönetimi üzerinden önce himaye anlaşması, ardından üç adaydan ülke valisi atama. Ülkeyi bölmek gerekmez. Atama 20 hazine ve 1 eylem; hedefte istikrar −8. Ayrı hazine ve sınırlar korunur; bağlı yönetimin genel seçimleri bağlılık kaldırılana kadar durur.
- Başkent dışındaki kendi bölgeni 30 hazine ve 1 eylemle bağlı devlete dönüştürme. Ayrı yönetim ve mevcut himaye katkısı; dönem başına bir kez yönetici atama, savunma desteği, vergi veya dış politika talimatı ve bağlılığı kaldırma. Bağlı devletler yeni bağlı devlet kuramaz. Gerçek ülkelerin mevcut statüsü otomatik değiştirilmez.

Bu maliyetler ve denge katsayıları ilk oynanış hipotezleridir; farklı stratejilerle uzun süreli denge testi henüz yapılmadı.

## 2.5.2 ile gelenler

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

# Tarayıcı açmadan yeni mekanik ve harita olay testleri:
npm run build && npm run test:model
```

Testler TypeScript kontrolünü, derlemeyi ve Chromium'da oynanış/ekran kontrollerini çalıştırır. Sistem Chromium'u yoksa önce `npx playwright install chromium` çalıştırılabilir. Farklı bir tarayıcı dosyası için `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` kullanılabilir.

## Kaynak geçmişi

GitHub'daki başlangıç deposu yalnızca README içeriyordu. Uygulamanın temeli, Vercel'deki `dpl_5XkPLoxptoBHpfh4Q9hW9MuEDvMn` yayınından alınan 26 dosyalık **2.5.0** kaynak kopyasıdır. Dosya özetleri ve derlenen JavaScript, HTML ve service worker canlı sürümle doğrulanmıştır.

Yayın kaynaklarında bulunmayan `tsconfig.contracts.json` ve `tests/smoke.py` dosyalarına yapılan eski komut başvuruları kaldırılmış; mevcut kaynaklara yönelik Playwright kontrolleri eklenmiştir. 2.5.2 eski kayıtları açar; yeni yatırım ve gazete alanları eksikse varsayılan değerlerle eklenir.

