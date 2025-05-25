using System;

namespace DietSocial.API.Models.DTOs;

public class UserResponse
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
} 