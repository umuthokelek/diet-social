# API Endpoint Detay Tablosu

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
