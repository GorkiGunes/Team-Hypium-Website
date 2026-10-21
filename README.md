# Hypium Admin Dashboard — başlangıç paketi

Bu paket mevcut ana siteyi değiştirmeden `admin/` altında bir yönetim arayüzü ve Cloudflare Pages Functions API'si ekler. Renkler Hypium sitesinde kullanılan palete göre ayarlanmıştır: `#00304d`, `#004870`, `#6fa8ce`, `#ffb300`, `#f3f8fb`.

## İçerik modülleri

- Duyurular
- Site yazıları ve haberler
- Sosyal sorumluluk projeleri
- Galeri kayıtları
- Takım üyeleri

Kayıtlar D1'de ortak tutulur; `created_by` ve `updated_by` alanları hangi yetkilinin işlem yaptığını kaydeder. Görsel yükleme R2 üzerinden yapılır.

## 1. Dosyaları GitHub'a ekleme

ZIP'i açın ve içindeki `admin/`, `functions/`, `public-integration/` klasörleri ile `schema.sql` dosyasını mevcut deponuzun kök dizinine kopyalayın. Ana sitenin `index.html`, CSS ve JavaScript dosyalarının üzerine yazmayın. Depoda aynı isimli `functions/` dizini varsa birleştirerek ekleyin; üzerine körlemesine yazmayın.

## 2. D1 veritabanı oluşturma

Cloudflare Dashboard → Workers & Pages → D1 SQL Database bölümünde `hypium-admin-db` adında bir veritabanı oluşturun. D1 Console'da bu paketteki `schema.sql` içeriğini çalıştırın. Pages projesinin Settings → Bindings bölümünde D1 database binding adı `DB` olacak şekilde bağlayın. Ardından yeniden deploy edin.

## 3. Üç kişiye ayrı ve güvenli erişim

Cloudflare Zero Trust → Access → Applications bölümünde uygulama oluşturun. Site alan adınızda hem `/admin/*` hem de `/api/admin/*` yollarını koruyun (gerekirse iki ayrı self-hosted application/policy tanımlayın). Allow policy'de sadece üç yetkili e-posta adresine izin verin. API, Access tarafından doğrulanmış `Cf-Access-Authenticated-User-Email` başlığını kontrol eder; Access korumasını API yollarından kaldırmayın.

Pages projesi Settings → Variables and Secrets bölümünde `ADMIN_EMAILS` adlı değişken ekleyin. Değer, üç e-posta adresinin virgülle ayrılmış hali olmalı. Örnek biçim: `yetkili1@example.com,yetkili2@example.com,yetkili3@example.com`. Gerçek adreslerinizi buraya girin; bu örnek adresleri kullanmayın.

Her yetkili kendi kimlik sağlayıcısıyla (ör. kendi e-posta hesabı) giriş yapar. Bu paket ayrı bir parola veritabanı kurmaz; kimlik doğrulamasını Cloudflare Access'e bırakır. Böylece şifreler bu projede tutulmaz.

## 4. Görsel yükleme (R2)

Cloudflare R2'de bir bucket oluşturun. Pages Settings → Bindings bölümünde R2 bucket binding adını `MEDIA` yapın. Yüklenen görsellerin tarayıcıdan görüntülenebilmesi için bucket'ı uygun bir özel alan adı üzerinden yayınlayın ve `MEDIA_PUBLIC_BASE_URL` değişkenine bu HTTPS taban adresini yazın (ör. `https://media.example.com`). Bucket'ı herkese açık yapmadan önce erişim ve gizlilik gereksinimlerinizi değerlendirin. Gizli erişim gerekiyorsa imzalı URL yaklaşımı eklenmelidir.

## 5. Ana siteyle duyuru entegrasyonu

Dashboard ve public API aynı Cloudflare Pages projesi ile aynı D1 veritabanını kullanır. Ana sayfanın duyuruları gösterebilmesi için:

1. `public-integration/` klasörünü repo köküne ekleyin.
2. Ana sayfa ve Impact sayfaları dahil, duyurunun görünmesini istediğiniz her HTML sayfasında `</body>` etiketinden hemen önce şu satırı ekleyin:

   `<script src="/public-integration/announcements.js" defer></script>`

3. `functions/api/public/announcements.js` dosyası `/api/public/announcements` adresinde yalnızca yayınlanmış duyuruları okur. Yönetim API'sinden ayrıdır ve yazma işlemi kabul etmez.
4. Duyuru yayınlandığında site açılışında ilk okunmamış duyuru gösterilir. Pencere kapatılınca duyuru listede ve bildirim çanında erişilebilir kalır. Okundu bilgisi ziyaretçinin tarayıcısında tutulur.

Bu widget mevcut sayfanın HTML/CSS dosyalarını otomatik değiştirmez; script satırı mevcut sayfalara bir kez eklenmelidir. Çok dilli `impact-en.html`, `impact-de.html` ve `impact-fr.html` sayfalarına da eklemeyi unutmayın.

## 6. Deploy ve test

1. GitHub'a commit/push yapın ve Cloudflare Pages deploy'unun tamamlanmasını bekleyin.
2. Önce yetkisiz bir tarayıcıyla `/admin/` ve `/api/admin/items` yollarının engellendiğini doğrulayın.
3. İzinli hesapla `/admin/` adresini açın; taslak duyuru oluşturun, düzenleyin ve silin.
4. İkinci yetkiliyle giriş yapıp aynı kaydın göründüğünü doğrulayın.
5. Görsel yükleme, 8 MB sınırı ve dosya türü kontrollerini test edin.

## Bilinen kapsam sınırları

- Duyuru public endpoint ve arayüz bileşeni pakete eklidir; çalışması için script satırını ana site sayfalarına eklemek ve Cloudflare deploy etmek gerekir. Impact içeriklerinin canlı sayfalara bağlanması ayrı bir entegrasyon adımıdır.
- Görsel URL'si R2 public domain ayarına bağlıdır. `MEDIA_PUBLIC_BASE_URL` doğru ayarlanmadan görsel bağlantısı üretilemez.
- Bu başlangıç kodu mevcut deponuzda canlı olarak test edilmemiştir. Deploy öncesi önce preview ortamında doğrulayın.
- İçerik gövdesi düz metindir; HTML olarak çalıştırılmamalıdır.
