using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DietSocial.API.Models;

public class Follow
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid FollowerId { get; set; }

    [Required]
    public Guid FollowingId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("FollowerId")]
    public User Follower { get; set; } = default!;

    [ForeignKey("FollowingId")]
    public User Following { get; set; } = default!;
} 