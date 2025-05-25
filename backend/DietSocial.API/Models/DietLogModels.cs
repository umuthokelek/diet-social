using System;

namespace DietSocial.API.Models
{
    public class CreateDietLogRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Calories { get; set; }
    }

    public class UpdateDietLogRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Calories { get; set; }
    }

    public class DietLogResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Calories { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserDisplayName { get; set; } = string.Empty;
        public Guid UserId { get; set; }
    }
} 