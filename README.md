# Bakery Order Management System

Modern, rol bazli bir pastacilik web sitesi projesi. Proje React tabanli bir vitrin ve yonetim arayuzu ile Express + MongoDB destekli REST API katmanindan olusur.

## Proje Ozeti

Bu proje bir pastacilik firmasinin:

- kurumsal tanitim sayfasini
- urun ve kategori vitrinini
- musteri kayit / giris akislarini
- sepet ve siparis yonetimini
- admin paneli uzerinden operasyon yonetimini

tek repo icinde duzenli bir klasor yapisiyla sunar.

## Teknoloji Yapisi

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Veritabani: MongoDB + Mongoose
- Kimlik Dogrulama: JWT
- Stil: Ozgun modern CSS
- API test yapisi: Vitest + Supertest

## Klasor Mimarisi

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

## Roller ve Yetkiler

### Ziyaretci

- Ana sayfayi goruntuler
- Kategori ve urunleri inceler
- Iletisim bilgilerini gorur
- Sepete ekleyemez
- Siparis veremez

### Musteri

- Kayit olur ve giris yapar
- Uyelikte temel hesap ve teslimat bilgilerini girer
- Fatura bilgilerini siparis olusturma adiminda doldurur
- Urun detaylarini gorur
- Sepete urun ekler
- Sepet gunceller
- Odeme adimindan siparis olusturur
- Kendi siparis durumlarini takip eder

### Yonetici

- Tek giris ekranindan admin hesabi ile giris yapar
- Siparisleri listeler
- Siparis durumunu gunceller
- Musteri ve fatura bilgilerini gorur
- Urun / kategori CRUD islemlerini yapar
- Ana sayfa iletisim bilgilerini yonetir

## MongoDB Modelleri

- `User`
- `Product`
- `Category`
- `Cart`
- `Order`
- `InvoiceInfo`
- `ContactInfo`

## Baslica API Uclari

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

### 1. Ortam dosyalarini hazirla

Kopyalanacak dosyalar:

- `.env.example` -> referans
- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

### 2. Bagimliliklari kur

```bash
cd backend && npm install
cd ../frontend && npm install
```

Isterseniz repo kokunden de ayri ayri calistirabilirsiniz:

```bash
npm run dev:backend
npm run dev:frontend
```

### 3. MongoDB baglantisini ac

Varsayilan baglanti:

```env
MONGO_URI=mongodb://127.0.0.1:27017/bakery_order_management
```

### 3A. Docker ile MongoDB baslat

Projede Docker ile kullanima hazir bir [docker-compose.yml](/Users/ranakaragol/Desktop/bakery-management/bakery-order-management-system/docker-compose.yml:1) dosyasi bulunur.

MongoDB ve yonetim arayuzunu baslatmak icin:

```bash
docker compose up -d
```

Sadece MongoDB baslatmak isterseniz:

```bash
docker compose up -d mongo
```

Durumu kontrol etmek icin:

```bash
docker compose ps
```

MongoDB'yi durdurmak icin:

```bash
docker compose down
```

Veriyi silmeden yeniden baslatmak icin sadece `down` veya `up -d` kullanin. Veritabani verileri `mongo_data` volume icinde saklanir.

Mongo arayuzu isterseniz:

- MongoDB: `mongodb://127.0.0.1:27017`
- Mongo Express: `http://localhost:8081`

### 4. Ornek veri ve admin hesabi yukle

```bash
cd backend
npm run seed
```

Sadece admin kullanicisini eklemek veya guncellemek icin:

```bash
cd backend
npm run seed:admin
```

Varsayilan admin:

- E-posta: `admin@firinatelier.com`
- Sifre: `Admin123!`

## Calistirma

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Frontend varsayilan olarak `http://localhost:5173`, backend ise `http://localhost:5000` uzerinden calisir.

## Docker Ile Tam Yerel Kurulum

1. Docker Desktop'i acin.
2. Repo kokunde `docker compose up -d` calistirin.
3. `backend/.env` icinde `MONGO_URI=mongodb://127.0.0.1:27017/bakery_order_management` oldugunu kontrol edin.
4. Backend'i baslatin:

```bash
cd backend
npm run dev
```

5. Frontend'i baslatin:

```bash
cd frontend
npm run dev
```

6. Ornek veri gerekiyorsa:

```bash
cd backend
npm run seed
```

7. Sadece admin kaydi gerekiyorsa:

```bash
cd backend
npm run seed:admin
```

## Test

Backend API test yapisi hazirdir.

```bash
cd backend
npm test
```

Mevcut ornek test:

- `src/tests/health.test.js`

Bu yapiya auth, cart, order ve admin akislari icin yeni entegrasyon testleri eklenebilir.

## Tasarim Yaklasimi

Arayuz, referans olarak premium pastacilik markalarinin dilini tasiyan ama birebir kopya olmayan ozgun bir gorunume sahiptir:

- yumusak sicak tonlar
- editorial baslik yapisi
- cam efekti yuzeyler
- modern butik marka hissi
- mobil uyumlu responsive duzen

## Sonraki Gelistirme Adimlari

- Gercek odeme entegrasyonu
- Gorsel yukleme servisi
- Siparis filtreleme ve raporlama
- E-posta / SMS bildirimleri
- Docker ve CI/CD ekleme

## GitHub Icin Notlar

- `.gitignore` eklendi
- `frontend` ve `backend` ayrildi
- Ortam degiskenleri ornek dosyalarla ayrildi
- Okunabilir REST mimarisi kuruldu
- Seed ve test yapisi eklendi

Bu repo Visual Studio Code uzerinde rahat gelistirme, parca parca commit atma ve GitHub uzerinden surum takibi icin uygun sekilde duzenlenmistir.
