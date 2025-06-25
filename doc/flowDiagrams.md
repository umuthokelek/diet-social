# Önemli Akış Diyagramları

## Kullanıcı kayıt/giriş akışı
1. Kullanıcı kayıt formunu doldurur.
2. Backend, kullanıcıyı oluşturur ve JWT döner.
3. Kullanıcı girişte kimlik bilgilerini gönderir, doğrulama sonrası JWT alır.

## Gönderi oluşturma ve beğeni akışı
1. Kullanıcı gönderi oluşturur.
2. Diğer kullanıcılar gönderiyi görebilir ve beğenebilir.
3. Beğeni işlemi backend'e iletilir ve ilgili kayıtlara eklenir.

## Yorum ekleme akışı
1. Kullanıcı bir gönderiye yorum ekler.
2. Backend, yorumu kaydeder ve ilgili gönderiye ilişkilendirir.
3. Gönderi sahibi ve ilgili kullanıcılar bildirim alır.

## Takip etme/çıkma akışı
1. Kullanıcı başka bir kullanıcıyı takip eder veya takibi bırakır.
2. Backend, takip ilişkisini günceller.
3. Takip edilen kullanıcıya bildirim gönderilir.

## Bildirim görüntüleme akışı
1. Kullanıcı bildirim ikonuna tıklar.
2. Backend'den okunmamış bildirimler çekilir.
3. Kullanıcı bildirimleri okur ve okundu olarak işaretlenir.
