namespace DietSocial.API.Models.DTOs;

public class FollowStatusResponse
{
    public bool IsFollowing { get; set; }
    public int FollowerCount { get; set; }
    public int FollowingCount { get; set; }
} 