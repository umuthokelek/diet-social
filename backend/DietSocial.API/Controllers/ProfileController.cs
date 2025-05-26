using System;
using System.Threading.Tasks;
using DietSocial.API.Data;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfileController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<ProfileResponse>> GetUserProfile(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Posts)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound("User not found");
        }

        var posts = await _context.Posts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PostResponse
            {
                Id = p.Id,
                Content = p.Content,
                CreatedAt = p.CreatedAt,
                UserId = p.UserId,
                UserDisplayName = p.User.DisplayName,
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count
            })
            .ToListAsync();

        return Ok(new ProfileResponse
        {
            UserId = user.Id,
            DisplayName = user.DisplayName,
            PostCount = posts.Count,
            Posts = posts
        });
    }
}

public class ProfileResponse
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int PostCount { get; set; }
    public List<DietSocial.API.Models.DTOs.PostResponse> Posts { get; set; } = new();
} 