# Yapılandırma

## appsettings.json
- Veritabanı bağlantı dizesi
- JWT ayarları

Örnek:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DietSocial;User Id=...;Password=...;"
  },
  "Jwt": {
    "Key": "...",
    "Issuer": "...",
    "Audience": "..."
  }
}
```

## Statik Dosyalar
- `wwwroot/images` klasörü resimler için gereklidir.
