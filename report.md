# Diet Social Proje Raporu

## Teknoloji Yığını (Tech Stack)

### Backend
- **Dil & Framework:** C#, ASP.NET Core Web API
- **Veritabanı:** SQL Server (Entity Framework Core ile)
- **Kimlik Doğrulama:** JWT (JSON Web Token)
- **Otomatik Mapping:** AutoMapper
- **Dokümantasyon:** Swagger
- **Paket Yönetimi:** NuGet

### Frontend
- **Dil & Framework:** TypeScript, React, Next.js
- **Stil:** Tailwind CSS
- **HTTP İstekleri:** Axios
- **Durum Yönetimi:** React Hooks
- **Paket Yönetimi:** npm

### Ortak & Diğer
- **Versiyon Kontrol:** Git
- **Geliştirme Ortamı:** Visual Studio Code
- **Container (isteğe bağlı):** Docker

## 1. Genel Bakış
Diet Social, kullanıcıların diyet günlüklerini, tariflerini ve sosyal etkileşimlerini paylaşabildiği, modern web teknolojileriyle geliştirilmiş bir sosyal platformdur. Proje, hem frontend (Next.js) hem de backend (ASP.NET Core) bileşenlerinden oluşur.

## 1.1. Veritabanı Şeması ve İlişkiler
- Kullanıcılar, gönderiler, yorumlar, tarifler, beğeniler, takip ve bildirimler arasında ilişkiler bulunmaktadır.
- Temel tablolar: User, Post, Comment, Recipe, Like, Follow, Notification
- Örnek ilişki: Bir kullanıcı birden fazla gönderi ve yorum oluşturabilir; bir gönderinin birden fazla yorumu olabilir.
- Entity Framework Core ile migration ve seed desteği vardır.

### ER Diyagramı Açıklaması
- **User**: Kullanıcı bilgilerini tutar. (UserId PK)
- **Post**: Gönderiler. (PostId PK, UserId FK)
- **Comment**: Yorumlar. (CommentId PK, PostId FK, UserId FK)
- **Recipe**: Tarifler. (RecipeId PK, UserId FK)
- **Like**: Gönderi veya yorum beğenileri. (LikeId PK, UserId FK, PostId FK nullable, CommentId FK nullable)
- **Follow**: Takip ilişkisi. (FollowId PK, FollowerId FK, FollowingId FK)
- **Notification**: Bildirimler. (NotificationId PK, UserId FK, Type, RelatedId)

Temel ilişkiler:
- User 1-N Post
- User 1-N Comment
- User 1-N Recipe
- User 1-N Like
- Post 1-N Comment
- Post 1-N Like
- Comment 1-N Like
- User 1-N Notification
- User 1-N Follow (follower/following)

### Migration ve Seed Örneği

```csharp
// Migration örneği (Up metodu)
CreateTable(
    "Users",
    c => new
        {
            UserId = c.Int(nullable: false, identity: true),
            UserName = c.String(),
            Email = c.String(),
            PasswordHash = c.String(),
            // ... diğer alanlar ...
        })
    .PrimaryKey(t => t.UserId);

CreateTable(
    "Posts",
    c => new
        {
            PostId = c.Int(nullable: false, identity: true),
            UserId = c.Int(nullable: false),
            Content = c.String(),
            CreatedAt = c.DateTime(nullable: false),
            // ... diğer alanlar ...
        })
    .PrimaryKey(t => t.PostId)
    .ForeignKey("Users", t => t.UserId, cascadeDelete: true);
// ... diğer tablolar ...
```

```csharp
// Seed örneği
modelBuilder.Entity<User>().HasData(
    new User { UserId = 1, UserName = "demo", Email = "demo@mail.com", PasswordHash = "..." }
);
modelBuilder.Entity<Post>().HasData(
    new Post { PostId = 1, UserId = 1, Content = "İlk gönderi!", CreatedAt = DateTime.Now }
);
// ... diğer seed verileri ...
```

## 1.2. Kullanıcı Rolleri ve Yetkilendirme
- Standart kullanıcı ve admin rolleri desteklenebilir.
- Standart kullanıcılar içerik oluşturabilir, beğenebilir, yorum yapabilir.
- Admin kullanıcılar ek olarak içerik yönetimi ve moderasyon işlemleri yapabilir.
- Yetkilendirme, JWT ve rol bazlı attribute'lar ile sağlanır.

## 1.3. API Yanıt ve Hata Formatları
- Başarılı yanıt örneği:
```json
{
  "success": true,
  "data": { ... }
}
```
- Hatalı yanıt örneği:
```json
{
  "success": false,
  "error": "Açıklama"
}
```
- Standart HTTP durum kodları kullanılır (200, 400, 401, 404, 500 vb.)

## 1.4. Önemli Akış Diyagramları
- Kullanıcı kayıt/giriş akışı:
  1. Kullanıcı kayıt formunu doldurur.
  2. Backend, kullanıcıyı oluşturur ve JWT döner.
  3. Kullanıcı girişte kimlik bilgilerini gönderir, doğrulama sonrası JWT alır.
- Gönderi oluşturma ve beğeni akışı:
  1. Kullanıcı gönderi oluşturur.
  2. Diğer kullanıcılar gönderiyi görebilir ve beğenebilir.
  3. Beğeni işlemi backend'e iletilir ve ilgili kayıtlara eklenir.
- Yorum ekleme akışı:
  1. Kullanıcı bir gönderiye yorum ekler.
  2. Backend, yorumu kaydeder ve ilgili gönderiye ilişkilendirir.
  3. Gönderi sahibi ve ilgili kullanıcılar bildirim alır.
- Takip etme/çıkma akışı:
  1. Kullanıcı başka bir kullanıcıyı takip eder veya takibi bırakır.
  2. Backend, takip ilişkisini günceller.
  3. Takip edilen kullanıcıya bildirim gönderilir.
- Bildirim görüntüleme akışı:
  1. Kullanıcı bildirim ikonuna tıklar.
  2. Backend'den okunmamış bildirimler çekilir.
  3. Kullanıcı bildirimleri okur ve okundu olarak işaretlenir.

## 1.5. Performans ve Güvenlik Önlemleri
- Rate limiting ve brute-force koruması için middleware desteği eklenebilir.
- Input validation ile zararlı veri girişleri engellenir.
- CORS ayarları ile güvenli API erişimi sağlanır.
- XSS/CSRF korumaları frontend ve backend'de uygulanır.
- Dosya yüklemelerinde dosya türü ve boyut kontrolü yapılır.

## 1.6. Test Stratejisi
- Backend için unit ve integration testleri (ör. xUnit, NUnit)
- Frontend için component ve e2e testleri (ör. Jest, React Testing Library, Cypress)
- Otomatik testler için CI/CD entegrasyonu önerilir.

## 1.8. Uluslararasılaştırma (i18n) ve Erişilebilirlik
- Çoklu dil desteği eklenebilir (örn. i18next, react-intl)
- Erişilebilirlik için ARIA etiketleri ve klavye navigasyonu sağlanır.

## 1.9. Gelecek Geliştirme Planları
- Mobil uygulama entegrasyonu
- Gelişmiş bildirim sistemi (push notification)
- Rol bazlı yönetim paneli
- Daha fazla sosyal etkileşim (yorumlara yanıt, paylaşım vb.)

## 1.10. Kod Standartları
- Backend için C# kodlarında Microsoft C# Coding Conventions ve .NET naming conventions uygulanır.
- Frontend için Airbnb JavaScript/TypeScript Style Guide ve Prettier kullanılır.
- Dosya ve klasör isimlendirmelerinde tutarlılık ve anlamlılık gözetilir.
- Fonksiyonlar tek bir sorumluluğa sahip olacak şekilde yazılır.
- Yorum satırları ve dokümantasyon (XML/JSdoc) ile kod okunabilirliği artırılır.
- Commit mesajlarında Conventional Commits standardı kullanılır.

## 1.11. Frontend Component Mimarisi
- **Atomic Design** prensipleriyle component hiyerarşisi:
  - **Atoms:** Temel UI elemanları (Button, Input, Icon)
  - **Molecules:** Birden fazla atomun birleşimi (FormInput, LikeButton)
  - **Organisms:** Kompleks bileşenler (PostCard, CommentSection)
  - **Templates:** Sayfa düzenleri (Layout)
  - **Pages:** Route edilen ana sayfalar (login, feed, profile)
- Componentler `src/components/` altında gruplanır ve tekrar kullanılabilirlik ön plandadır.
- State yönetimi için React Hooks ve context kullanılır.
- UI mantığı ile veri mantığı ayrıştırılır (container/presentational separation).

## 1.12. Kullanıcı Senaryoları (User Stories)
- **Kayıt ve Giriş:**
  - Kullanıcı e-posta ve şifre ile kayıt olur, ardından giriş yapar ve JWT ile oturum açar.
- **Gönderi Paylaşımı:**
  - Kullanıcı yeni bir gönderi oluşturur, görsel ekleyebilir ve paylaşır.
- **Tarif Ekleme:**
  - Kullanıcı kendi tarifini ekler, malzeme ve adım bilgilerini girer.
- **Beğeni ve Yorum:**
  - Kullanıcı gönderilere ve yorumlara beğeni bırakabilir, yorum ekleyebilir.
- **Takip:**
  - Kullanıcı başka bir kullanıcıyı takip edebilir veya takibi bırakabilir.
- **Bildirimler:**
  - Kullanıcı, kendisiyle ilgili etkileşimler için bildirim alır ve okundu olarak işaretleyebilir.
- **Profil Düzenleme:**
  - Kullanıcı profil bilgilerini ve profil fotoğrafını güncelleyebilir.

## 1.13. API Endpoint Detay Tablosu (Güncel ve Genişletilmiş)

| Yöntem | URL                                 | Açıklama                              | Parametreler             | Yetki         |
|--------|-------------------------------------|---------------------------------------|--------------------------|---------------|
| POST   | /api/auth/register                  | Kullanıcı kaydı                       | email, password          | Herkes        |
| POST   | /api/auth/login                     | Kullanıcı girişi                      | email, password          | Herkes        |
| GET    | /api/posts                          | Tüm gönderileri listele               | -                        | Girişli       |
| GET    | /api/posts/{id}                     | Gönderi detayını getir                | id                       | Girişli       |
| POST   | /api/posts                          | Yeni gönderi oluştur                  | content, image           | Girişli       |
| DELETE | /api/posts/{id}                     | Gönderi sil                           | id                       | Sahibi/Admin  |
| GET    | /api/posts/following                | Takip edilenlerin gönderileri         | -                        | Girişli       |
| POST   | /api/comments                       | Yoruma ekle                           | postId, content          | Girişli       |
| GET    | /api/comments/post/{postId}         | Gönderinin yorumlarını listele        | postId                   | Girişli       |
| PUT    | /api/comments/{id}                  | Yorumu güncelle                       | id, content              | Sahibi        |
| DELETE | /api/comments/{id}                  | Yorumu sil                            | id                       | Sahibi/Admin  |
| POST   | /api/likes/{postId}                 | Gönderiye beğeni ekle                 | postId                   | Girişli       |
| DELETE | /api/likes/{postId}                 | Gönderiden beğeni kaldır              | postId                   | Girişli       |
| POST   | /api/commentlikes/{commentId}       | Yoruma beğeni ekle                    | commentId                | Girişli       |
| DELETE | /api/commentlikes/{commentId}       | Yorumdan beğeni kaldır                | commentId                | Girişli       |
| POST   | /api/follow/{followingUserId}       | Kullanıcıyı takip et                  | followingUserId          | Girişli       |
| DELETE | /api/follow/{followingUserId}       | Takipten çık                          | followingUserId          | Girişli       |
| GET    | /api/notifications                  | Bildirimleri listele                  | -                        | Girişli       |
| POST   | /api/notifications/mark-read        | Bildirimleri okundu olarak işaretle   | notificationIds          | Girişli       |
| GET    | /api/profile/{userId}               | Profil görüntüle                      | userId                   | Girişli       |
| GET    | /api/recipes                        | Tüm tarifleri listele                 | -                        | Girişli       |
| GET    | /api/recipes/{id}                   | Tarif detayını getir                   | id                       | Girişli       |
| GET    | /api/recipes/user/{userId}          | Kullanıcının tariflerini listele      | userId                   | Girişli       |
| POST   | /api/recipes                        | Yeni tarif oluştur                    | title, description, ...  | Girişli       |
| DELETE | /api/recipes/{id}                   | Tarifi sil                            | id                       | Sahibi/Admin  |

> Notlar:
> - Tüm endpointler için JWT ile kimlik doğrulama gereklidir (aksi belirtilmedikçe).
> - Parametreler ve path'ler controller'lardaki gerçek isimlerle uyumlu hale getirildi.
> - Yorum güncelleme, tarif silme, takipten çıkma, bildirim okundu işaretleme gibi ek endpointler eklendi.
> - Frontend route yapısı Next.js 13+ ile `app/` dizini üzerinden çalışıyor, `pages/` kullanılmıyor.

## 2. Proje Yapısı

```
root/
├── backend/
│   ├── DietSocial.API/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Data/
│   │   ├── Mapping/
│   │   ├── Configuration/
│   │   ├── wwwroot/
│   │   └── ...
│   └── docs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── ...
│   └── public/
└── README.md
```

## 3. Backend (ASP.NET Core)

### 3.1. Temel Bileşenler
- **Controllers/**: API uç noktalarını yöneten denetleyiciler (ör. AuthController, PostController)
- **Models/**: Veri modelleri ve DTO'lar (ör. User, Post, Comment, Recipe)
- **Services/**: İş mantığı ve yardımcı servisler (ör. JwtService, FileStorageService)
- **Data/**: Entity Framework DbContext ve veritabanı işlemleri
- **Mapping/**: AutoMapper profilleri
- **Configuration/**: JWT ve diğer yapılandırma sınıfları
- **wwwroot/**: Statik dosyalar (ör. yüklenen resimler)

### 3.2. Başlıca API Uç Noktaları
- `/api/auth`: Kimlik doğrulama (kayıt, giriş, token yenileme)
- `/api/posts`: Gönderi oluşturma, listeleme, silme
- `/api/comments`: Yorum ekleme, silme, listeleme
- `/api/recipes`: Tarif ekleme, görüntüleme
- `/api/profile`: Profil görüntüleme ve güncelleme
- `/api/notifications`: Bildirimler
- `/api/follow`: Takip/Çıkar işlemleri

### 3.3. Güvenlik
- JWT tabanlı kimlik doğrulama
- Yetkilendirme attribute'ları ile endpoint koruması
- Şifrelerin hashlenmesi

### 3.4. Yapılandırma
- `appsettings.json` ile veritabanı ve JWT ayarları
- Ortam değişkenleri desteği

### 3.5. Test ve Geliştirme
- Swagger ile API dokümantasyonu ve test
- Katmanlı mimari ile sürdürülebilirlik

## 4. Frontend (Next.js & TypeScript)

### 4.1. Temel Bileşenler
- **components/**: UI bileşenleri (ör. PostCard, CommentSection, LikeButton)
- **services/**: API ile iletişim sağlayan servisler (ör. auth, posts, comments)
- **hooks/**: React custom hook'ları (ör. useAuth)
- **pages/app/**: Sayfa ve route yapısı (ör. login, register, feed, profile, recipes)
- **public/**: Statik dosyalar (ikonlar, görseller)

### 4.2. Özellikler
- Kullanıcı kaydı ve girişi
- Diyet günlüğü ve tarif paylaşımı
- Gönderilere ve yorumlara beğeni
- Takip sistemi
- Bildirimler
- Modern ve responsive arayüz (Tailwind CSS)

### 4.3. Güvenlik ve Yetkilendirme
- JWT token ile oturum yönetimi
- ProtectedRoute ile korumalı sayfalar

### 4.4. Entegrasyon
- Backend API ile RESTful iletişim
- Axios ile HTTP istekleri

## 5. Kurulum ve Çalıştırma

### 5.1. Backend
1. `cd backend/DietSocial.API`
2. `dotnet restore`
3. `dotnet run`

### 5.2. Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 6. Geliştirici Notları
- Kodlar modüler ve okunabilir olacak şekilde yazılmıştır.
- Katmanlı mimari ve SOLID prensipleri gözetilmiştir.
- API endpointleri Swagger ile belgelenmiştir.
- Frontend'de reusable component yapısı benimsenmiştir.

## 7. Katkı Sağlama
1. Fork oluşturun.
2. Yeni bir dal açın.
3. Değişikliklerinizi commit edin.
4. Pull request gönderin.

## 8. Lisans
MIT

---

Bu rapor, Diet Social projesinin mimarisini, işlevselliğini ve geliştirme süreçlerini detaylı şekilde özetlemektedir. Daha fazla bilgi için ilgili klasörlerdeki dokümantasyon dosyalarına başvurabilirsiniz.
