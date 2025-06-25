# Frontend Component Mimarisi

- **Atomic Design** prensipleriyle component hiyerarşisi:
  - **Atoms:** Temel UI elemanları (Button, Input, Icon)
  - **Molecules:** Birden fazla atomun birleşimi (FormInput, LikeButton)
  - **Organisms:** Kompleks bileşenler (PostCard, CommentSection)
  - **Templates:** Sayfa düzenleri (Layout)
  - **Pages:** Route edilen ana sayfalar (login, feed, profile)
- Componentler `src/components/` altında gruplanır ve tekrar kullanılabilirlik ön plandadır.
- State yönetimi için React Hooks ve context kullanılır.
- UI mantığı ile veri mantığı ayrıştırılır (container/presentational separation).
