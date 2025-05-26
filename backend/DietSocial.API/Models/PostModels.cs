using System;

namespace DietSocial.API.Models
{
    public class CreatePostRequest
    {
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    public class UpdatePostRequest
    {
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
} 