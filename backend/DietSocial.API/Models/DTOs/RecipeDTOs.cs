using System;
using System.ComponentModel.DataAnnotations;

namespace DietSocial.API.Models.DTOs;

public class RecipeRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Ingredients { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public int? Calories { get; set; }
}

public class RecipeResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Ingredients { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? Calories { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public UserResponse? User { get; set; }
} 