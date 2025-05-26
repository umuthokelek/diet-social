using System;

namespace DietSocial.API.Models.DTOs
{
    public class PostResponse
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid UserId { get; set; }
        public string UserDisplayName { get; set; } = string.Empty;
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
    }
} 