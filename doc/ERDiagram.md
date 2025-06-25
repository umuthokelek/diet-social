# ER Diyagramı ve Veritabanı İlişkileri

## Temel Tablolar ve İlişkiler
- Kullanıcılar, gönderiler, yorumlar, tarifler, beğeniler, takip ve bildirimler arasında ilişkiler bulunmaktadır.
- Temel tablolar: User, Post, Comment, Recipe, Like, Follow, Notification
- Örnek ilişki: Bir kullanıcı birden fazla gönderi ve yorum oluşturabilir; bir gönderinin birden fazla yorumu olabilir.
- Entity Framework Core ile migration ve seed desteği vardır.

## ER Diyagramı Açıklaması
- **User**: Kullanıcı bilgilerini tutar. (UserId PK)
- **Post**: Gönderiler. (PostId PK, UserId FK)
- **Comment**: Yorumlar. (CommentId PK, PostId FK, UserId FK)
- **Recipe**: Tarifler. (RecipeId PK, UserId FK)
- **Like**: Gönderi veya yorum beğenileri. (LikeId PK, UserId FK, PostId FK nullable, CommentId FK nullable)
- **Follow**: Takip ilişkisi. (FollowId PK, FollowerId FK, FollowingId FK)
- **Notification**: Bildirimler. (NotificationId PK, UserId FK, Type, RelatedId)

### Temel İlişkiler
- User 1-N Post
- User 1-N Comment
- User 1-N Recipe
- User 1-N Like
- Post 1-N Comment
- Post 1-N Like
- Comment 1-N Like
- User 1-N Notification
- User 1-N Follow (follower/following)

## Migration ve Seed Örneği

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
