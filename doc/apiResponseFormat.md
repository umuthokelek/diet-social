# API Yanıt ve Hata Formatları

## Başarılı Yanıt Örneği
```json
{
  "success": true,
  "data": { ... }
}
```

## Hatalı Yanıt Örneği
```json
{
  "success": false,
  "error": "Açıklama"
}
```

- Standart HTTP durum kodları kullanılır (200, 400, 401, 404, 500 vb.)
