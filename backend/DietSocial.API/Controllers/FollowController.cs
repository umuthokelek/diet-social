using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowController : BaseController
{
    private readonly ApplicationDbContext _context;

    public FollowController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("{followedUserId}")]
    public async Task<IActionResult> FollowUser(Guid followedUserId)
    {
        var followerId = GetCurrentUserId();
        if (followerId == followedUserId)
        {
            return BadRequest("You cannot follow yourself");
        }

        var existingFollow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedUserId);

        if (existingFollow != null)
        {
            return BadRequest("You are already following this user");
        }

        var follower = await _context.Users.FindAsync(followerId);
        if (follower == null)
        {
            return NotFound("Follower not found");
        }

        var follow = new Follow
        {
            FollowerId = followerId,
            FollowedId = followedUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Follows.Add(follow);

        // Create notification for the followed user
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = followedUserId,
            Type = "follow",
            Message = $"{follower.DisplayName} started following you",
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("{followedUserId}")]
    public async Task<IActionResult> UnfollowUser(Guid followedUserId)
    {
        var followerId = GetCurrentUserId();
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedUserId);

        if (follow == null)
        {
            return BadRequest("You are not following this user");
        }

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("Followers/{userId}")]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetFollowers(Guid userId)
    {
        var followers = await _context.Follows
            .Where(f => f.FollowedId == userId)
            .Include(f => f.Follower)
            .Select(f => new UserResponse
            {
                Id = f.Follower!.Id,
                DisplayName = f.Follower.DisplayName
            })
            .ToListAsync();

        return Ok(followers);
    }

    [HttpGet("Following/{userId}")]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetFollowing(Guid userId)
    {
        var following = await _context.Follows
            .Where(f => f.FollowerId == userId)
            .Include(f => f.Followed)
            .Select(f => new UserResponse
            {
                Id = f.Followed!.Id,
                DisplayName = f.Followed.DisplayName
            })
            .ToListAsync();

        return Ok(following);
    }

    [HttpGet("Status/{userId}")]
    public async Task<ActionResult<FollowStatusResponse>> GetFollowStatus(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        var isFollowing = await _context.Follows
            .AnyAsync(f => f.FollowerId == currentUserId && f.FollowedId == userId);

        var followerCount = await _context.Follows
            .CountAsync(f => f.FollowedId == userId);

        var followingCount = await _context.Follows
            .CountAsync(f => f.FollowerId == userId);

        return Ok(new FollowStatusResponse
        {
            IsFollowing = isFollowing,
            FollowerCount = followerCount,
            FollowingCount = followingCount
        });
    }
} 