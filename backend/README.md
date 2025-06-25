# Diet Social Backend Dokümantasyonu

Bu doküman, Diet Social projesinin backend (sunucu tarafı) API'sinin kurulumunu, yapılandırmasını ve temel kullanımını açıklar.

## İçerik
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [Çalıştırma](#çalıştırma)
- [Dizin Yapısı](#dizin-yapısı)
- [API Uç Noktaları](#api-uç-noktaları)
- [Katkı Sağlama](#katkı-sağlama)

## Kurulum

1. `backend/DietSocial.API` dizinine gidin:
   ```bash
   cd backend/DietSocial.API
   ```
2. NuGet paketlerini yükleyin:
   ```bash
   dotnet restore
   ```

## Yapılandırma

- `appsettings.json` dosyasında veritabanı bağlantı dizesi ve JWT ayarlarını yapılandırın.
- Gerekirse `wwwroot/images` klasörünü oluşturun.

## Çalıştırma

Projeyi başlatmak için:
```bash
   dotnet run
```

## Dizin Yapısı
- **Controllers/**: API uç noktalarını yöneten denetleyiciler
- **Models/**: Veri modelleri ve DTO'lar
- **Services/**: Servis katmanı ve yardımcı sınıflar
- **Data/**: DbContext ve veritabanı işlemleri
- **Mapping/**: AutoMapper profilleri
- **Configuration/**: Yapılandırma sınıfları
- **wwwroot/**: Statik dosyalar (ör. resimler)

## API Uç Noktaları
Başlıca uç noktalar:
- `/api/auth` - Kimlik doğrulama işlemleri
- `/api/posts` - Gönderiler
- `/api/comments` - Yorumlar
- `/api/recipes` - Tarifler
- `/api/profile` - Profil işlemleri
- `/api/notifications` - Bildirimler

Detaylı uç nokta dokümantasyonu için Swagger arayüzünü kullanabilirsiniz (proje çalışırken `/swagger` adresinde).

## Katkı Sağlama
Katkıda bulunmak için fork oluşturup pull request gönderebilirsiniz.

## Lisans
MIT
