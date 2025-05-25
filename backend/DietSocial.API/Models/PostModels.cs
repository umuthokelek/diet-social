using System;

namespace DietSocial.API.Models
{
    public class CreatePostRequest
    {
        public string Content { get; set; } = string.Empty;
    }

    public class UpdatePostRequest
    {
        public string Content { get; set; } = string.Empty;
    }

    public class PostResponse
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string UserDisplayName { get; set; } = string.Empty;
        public Guid UserId { get; set; }
    }
} 