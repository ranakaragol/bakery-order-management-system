# Bakery Order Management System

Modern, rol bazlı bir pastacılık web sitesi projesi. Bu sürümde vitrin ve seed verileri Paşalı Patiserrie kataloğuna göre güncellendi. Proje React tabanlı bir vitrin ve yönetim arayüzü ile Express + MongoDB destekli REST API katmanından oluşur.

## Proje Özeti

Bu proje bir pastacılık firmasının:

- kurumsal tanıtım sayfasını
- ürün ve kategori vitrinini
- müşteri kayıt / giriş akışlarını
- sepet ve sipariş yönetimini
- admin paneli üzerinden operasyon yönetimini

tek repo içinde düzenli bir klasör yapısıyla sunar.

## Teknoloji Yapısı

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Veritabani: MongoDB + Mongoose
- Kimlik Dogrulama: JWT
- Stil: Ozgun modern CSS
- API test yapisi: Vitest + Supertest

## Klasör Mimarisi

```text
bakery-order-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── validators/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── guards/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Paşalı Katalog Entegrasyonu

### Asset Yolları

- Logo: `frontend/public/assets/branding/pasali-patiserrie-logo.jpeg`
- Fiyat listesi görseli: `frontend/public/assets/documents/pasali-fiyat-listesi.jpeg`
- Gramaj listesi görseli: `frontend/public/assets/documents/pasali-gramaj-listesi.jpeg`
- Katalog PDF: `frontend/public/assets/documents/pasali-urun-katalogu.pdf`
- Normalize edilmiş ürün görselleri ve manifest: `frontend/public/assets/products/pasali-catalog/`
- Orijinal kaynak paket: `pasali_urun_fotograflari/`

### Ürün Verisinin Yönetimi

- Merkezi katalog kaynağı: `shared/pasaliCatalogData.js`
- Frontend katalog adaptörü: `frontend/src/data/pasaliCatalog.js`
- Backend seed adaptörü: `backend/src/data/pasaliCatalog.js`
- Normalize edilmiş manifest kopyası: `frontend/public/assets/products/pasali-catalog/urun_manifest.normalized.json`

### Kategoriler

- Pastalar
- Ekler
- Petifür
- Marki
- Rulo
- Cup Tatlılar
- Cheesecake
- Tepsi Tatlıları

### Veri Modeli Notu

- Ürünler `id`, `name`, `category`, `image`, `price`, `displayPrice`, `unit`, `weight`, `portion`, `storageCondition`, `shelfLife`, `description`, `catalogPage` alanlarıyla tutulur.
- Fiyat listesinde olmayan ürünler sistemde `price: null` ve `displayPrice: "Fiyat sorunuz"` ile gösterilir.
- Tepsi bazlı ürünlerde ürün kartlarında `Tekli satış bulunmamaktadır` notu yer alır.
- Gramaj bilgileri referans görsele göre güncellendi: ekler `1200 gr`, mozaik `2000 gr`, süt burger `1200 gr`, marki/rulo/Şirozbek/tartolet/İbiza `1500 gr`, Lancop `1000 gr`.

## Roller ve Yetkiler

### Ziyaretçi

- Ana sayfayı görüntüler
- Kategori ve ürünleri inceler
- İletişim bilgilerini görür
- Sepete ekleyemez
- Sipariş veremez

### Müşteri

- Kayıt olur ve giriş yapar
- Üyelikte temel hesap ve teslimat bilgilerini girer
- Fatura bilgilerini sipariş oluşturma adımında doldurur
- Ürün detaylarını görür
- Sepete ürün ekler
- Sepeti günceller
- Ödeme adımından sipariş oluşturur
- Kendi sipariş durumlarını takip eder

### Yönetici

- Tek giriş ekranından admin hesabı ile giriş yapar
- Siparişleri listeler
- Sipariş durumunu günceller
- Müşteri ve fatura bilgilerini görür
- Ürün / kategori CRUD işlemlerini yapar
- Ana sayfa iletişim bilgilerini yönetir

## MongoDB Modelleri

- `User`
- `Product`
- `Category`
- `Cart`
- `Order`
- `InvoiceInfo`
- `ContactInfo`

## Başlıca API Uçları

### Public

- `GET /api/health`
- `GET /api/public/home`
- `GET /api/public/contact`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:id`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Customer

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders/:id`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/customers`
- `GET /api/admin/customers/:id`
- `GET /api/admin/contact`
- `PUT /api/admin/contact`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

## Kurulum

### 1. Ortam dosyalarını hazırla

Kopyalanacak dosyalar:

- `.env.example` -> referans
- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

### 2. Bağımlılıkları kur

```bash
cd backend && npm install
cd ../frontend && npm install
```

İsterseniz repo kökünden de ayrı ayrı çalıştırabilirsiniz:

```bash
npm run dev:backend
npm run dev:frontend
```

Tek komutla güvenli geliştirme başlangıcı için:

```bash
npm run dev
```

### 3. MongoDB bağlantısını aç

Varsayılan bağlantı:

```env
MONGO_URI=mongodb://127.0.0.1:27017/bakery_order_management
```

### 3A. Docker ile MongoDB başlat

Projede Docker ile kullanıma hazır bir [docker-compose.yml](/Users/ranakaragol/Desktop/bakery-management/bakery-order-management-system/docker-compose.yml:1) dosyası bulunur.

MongoDB ve yönetim arayüzünü başlatmak için:

```bash
docker compose up -d
```

Sadece MongoDB başlatmak isterseniz:

```bash
docker compose up -d mongo
```

Durumu kontrol etmek için:

```bash
docker compose ps
```

MongoDB'yi durdurmak için:

```bash
docker compose down
```

Veriyi silmeden yeniden başlatmak için sadece `down` veya `up -d` kullanın. Veritabanı verileri `mongo_data` volume içinde saklanır.

Mongo arayüzü isterseniz:

- MongoDB: `mongodb://127.0.0.1:27017`
- Mongo Express: `http://localhost:8081`

MongoDB'nin gerçekten ayakta olduğunu doğrulamak için:

```bash
npm run dev:status
```

veya:

```bash
lsof -nP -iTCP:27017 -sTCP:LISTEN
docker compose ps
```

### 4. Örnek veri ve admin hesabı yükle

```bash
cd backend
npm run seed
```

Sadece admin kullanıcısını eklemek veya güncellemek için:

```bash
cd backend
npm run seed:admin
```

Varsayılan admin:

- E-posta: `admin@pasalipatiserrie.com`
- Şifre: `Admin123!`

## Çalıştırma

### Onerilen gelistirme baslangici

Gunluk gelistirmede onerilen komut repo kokunden calistirilan asagidaki script'tir:

```bash
npm run dev
```

Bu script:

- backend'i `npm run dev` ile dosya izleyen `nodemon` akisinda baslatir
- frontend'i `127.0.0.1:5173` uzerinde baslatir
- `5001` veya `5173` portu doluysa sessizce mevcut surece baglanmaz, anlasilir hata verip durur

Gunluk gelistirmede `npm run start:backend` kullanmayin. Bu komut dosya izleme yapmaz; yalnizca production benzeri veya tek seferlik backend calistirma ihtiyaclari icin uygundur.

### Backend

```bash
cd backend
npm run dev
```

veya repo kokunden:

```bash
npm run dev:backend
```

### Frontend

```bash
cd frontend
npm run dev
```

veya repo kokunden:

```bash
npm run dev:frontend
```

Frontend varsayılan olarak `http://localhost:5173`, backend ise `http://127.0.0.1:5001` üzerinden çalışır.

### Servis durumu ve surum kontrolu

Calisan servisleri ve backend health bilgisini gormek icin:

```bash
npm run dev:status
```

Bu script su noktalari kontrol eder:

- MongoDB `127.0.0.1:27017`
- Backend `127.0.0.1:5001`
- Frontend `127.0.0.1:5173`
- Backend health response'u

Backend'in guncel gelistirme sureciyle calistigini dogrulamak icin:

```bash
curl http://127.0.0.1:5001/api/health
```

Health response'unda su alanlar bulunur:

- `status`
- `service`
- `version`
- `startedAt`
- `runtime.lifecycle`

Dogru gelistirme akisinda backend `npm run dev` ile basladiysa `runtime.lifecycle` alani `dev` olmali. `start` veya `direct-node` goruyorsaniz backend gunluk gelistirme icin yanlis sekilde baslatilmis olabilir.

### Durdurma ve yeniden baslatma

Repo kokunden `npm run dev` ile baslattiysaniz:

```bash
Ctrl + C
```

Acik portlari ve ilgili surecleri incelemek icin:

```bash
lsof -nP -iTCP:5001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:27017 -sTCP:LISTEN
```

Ilgili PID'yi gordukten sonra sureci durdurun:

```bash
kill <PID>
```

Guvenli yeniden baslatma akisi:

1. `npm run dev:status` ile port ve servis durumunu kontrol edin.
2. Gerekirse sadece ilgili sureci manuel olarak durdurun.
3. Repo kokunde `npm run dev` komutunu yeniden calistirin.

## Docker ile Tam Yerel Kurulum

1. Docker Desktop'ı açın.
2. Repo kökünde `docker compose up -d` çalıştırın.
3. `backend/.env` içinde `MONGO_URI=mongodb://127.0.0.1:27017/bakery_order_management` olduğunu kontrol edin.
4. Backend'i başlatın:

```bash
cd backend
npm run dev
```

5. Frontend'i başlatın:

```bash
cd frontend
npm run dev
```

6. Örnek veri gerekiyorsa:

```bash
cd backend
npm run seed
```

7. Sadece admin kaydı gerekiyorsa:

```bash
cd backend
npm run seed:admin
```

## Test

Backend API test yapısı hazırdır.

```bash
cd backend
npm test
```

Mevcut ornek test:

- `src/tests/health.test.js`

Bu yapıya auth, cart, order ve admin akışları için yeni entegrasyon testleri eklenebilir.

## Tasarım Yaklaşımı

Arayüz, Paşalı katalog yapısını bozmadan daha kurumsal bir yöne çekildi:

- koyu bordo ana renk
- krem ve açık tonlu arka planlar
- daha düzenli katalog kartları
- logo destekli header ve footer
- mobil uyumlu responsive düzen

## Sonraki Geliştirme Adımları

- Gerçek ödeme entegrasyonu
- Görsel yükleme servisi
- Sipariş filtreleme ve raporlama
- E-posta / SMS bildirimleri
- Docker ve CI/CD ekleme

## GitHub İçin Notlar

- `.gitignore` eklendi
- `frontend` ve `backend` ayrıldı
- Ortam değişkenleri örnek dosyalarla ayrıldı
- Okunabilir REST mimarisi kuruldu
- Seed ve test yapısı eklendi

Bu repo Visual Studio Code üzerinde rahat geliştirme, parça parça commit atma ve GitHub üzerinden sürüm takibi için uygun şekilde düzenlenmiştir.
