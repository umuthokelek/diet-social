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
    public Guid FollowedId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    [ForeignKey("FollowerId")]
    public User? Follower { get; set; }

    [ForeignKey("FollowedId")]
    public User? Followed { get; set; }
} 