using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DietSocial.API.Models;

public class Recipe
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Ingredients { get; set; } = string.Empty;

    public int? Calories { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid UserId { get; set; }

    // Navigation property
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
} 