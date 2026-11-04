# Bağımsız vekilden hükümete — 2.6.1

Oyuncu, seçimle kazandığı tek bağımsız sandalyesinden başlayıp kişisel birikimini kullanarak mevcut parti vekillerini destek grubuna alır. Bu, yalnızca oyun içindeki kurmaca bir mekaniktir. İktidar hedefi 100 sandalyede 51 destektir.

Karakter ve İktidar/Devlet ekranlarında kalan kişisel para, destek, her kaynak partinin kalan vekilleri ve 1/5/10 vekillik tekliflerin toplam bedeli gösterilir. Satın alma kesin sonuç verir; kaynak partinin güncel sandalyesi destek grubuna aktarılır. Geçmiş seçim sonucu değiştirilmez. Her işlem kaydedilir.

| Ayar | İlk değer | Gerekçe |
|---|---|---|
| Vekil başı taban bedel | 4 para [PLACEHOLDER] | Küçük kişisel birikimle tek destek alınabilsin. |
| İktidar partisi farkı | +3 [PLACEHOLDER] | Görevdeki hükümetin desteğini ayırmak daha pahalı olsun. |
| Parti liderinin etkisi | hitabet / 40, aşağı yuvarla [PLACEHOLDER] | Güçlü lider etrafındaki desteğin maliyeti artsın. |
| Destek grubu büyümesi | her 20 destekte +1 [PLACEHOLDER] | Son vekiller başlangıçtakilerden pahalı olsun. |
| İşlem bedeli | 1 eylem [PLACEHOLDER] | Para kazanma ile destek alma arasında tercih olsun. |
| Teklif büyüklükleri | 1, 5, 10 [PLACEHOLDER] | Kısıtlı bütçe ve büyük birikim için aynı akış kullanılabilsin. |
| Hükümet kurma | 1 eylem, istikrar −5 [PLACEHOLDER] | İktidar devrinin kısa dönem maliyeti olsun. |
| Anlaşma süresi | Sonraki genel seçime kadar | Tek ödeme kalıcı ve seçimsiz iktidar sağlamasın. |

Bütün fiyatlar ilk denge hipotezleridir. Uzun süreli ekonomi dengelemesi yapılmadı. Örneğin hitabeti 60 olan muhalefet liderinden, sıfırdan başlayarak beş kez 10 destek almak toplam 290 para tutar; kendi sandalyesiyle 51'e ulaşılır. Bu örnek aynı grupta yeterli vekil bulunduğunu varsayar.

Yetersiz para/eylem, hapis, açık olay, vekil olmama, geçersiz teklif ve kaynakta yetersiz sandalye durumlarında kaynak harcanmaz. Başka ülkenin hazinesi veya kamu hazinesi kullanılmaz. Bir sonraki genel seçimde satın alınan destek sıfırlanır. Ölüm, görevden ayrılma veya temsil ilişkisinin kopması halinde eski partilere destek geri döner. İktidara gelmek oyuncuyu bir partiye dönüştürmez; kendi bağımsız sandalyesi dönem sonuna kadar korunur.

Kabul ölçütleri: 50 destek hükümet kuramaz; 51 kurar. Kaynak partiler + bağımsız sandalyeler + destek grubu 100'ü aşamaz. Aynı destek iki kez sayılmaz. Hükümet devrinden sonra tam dönem ilerletme, kayıt yükleme ve sonraki genel seçim çalışmalıdır. Bunlar derlenmiş motor testleriyle kontrol edilir; gerçek tarayıcı doğrulaması bu ortamda kısıtlıdır.
