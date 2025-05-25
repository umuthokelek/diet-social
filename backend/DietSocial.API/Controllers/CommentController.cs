using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using DietSocial.API.Data;
using DietSocial.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Extensions;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentController : BaseController
{
    private readonly ApplicationDbContext _context;

    public CommentController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("post/{postId}")]
    public async Task<ActionResult<IEnumerable<CommentResponse>>> GetCommentsForPost(Guid postId)
    {
        var comments = await _context.Comments
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentResponse
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                UserId = c.UserId,
                UserDisplayName = c.User.DisplayName,
                PostId = c.PostId
            })
            .ToListAsync();

        return Ok(comments);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<CommentResponse>> CreateComment([FromBody] CreateCommentRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return new UnauthorizedResult();
        }

        var post = await _context.Posts
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.PostId);

        if (post == null)
        {
            return NotFound("Post not found");
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = request.PostId,
            UserId = userId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);

        // Create notification for post owner if it's not the same user
        if (post.UserId != userId)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = post.UserId,
                Type = "comment",
                Message = $"{user.DisplayName} commented on your post",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();

        return Ok(new CommentResponse
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            User = new UserResponse
            {
                Id = user.Id,
                DisplayName = user.DisplayName
            }
        });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateComment(Guid id, CommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Comment content cannot be empty");
        }

        if (request.Content.Length > 500)
        {
            return BadRequest("Comment content cannot exceed 500 characters");
        }

        var userId = GetCurrentUserId();
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null)
        {
            return NotFound("Comment not found");
        }

        if (comment.UserId != userId)
        {
            return Forbid();
        }

        comment.Content = request.Content;
        comment.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CommentExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var userId = GetCurrentUserId();
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null)
        {
            return NotFound("Comment not found");
        }

        if (comment.UserId != userId)
        {
            return Forbid();
        }

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool CommentExists(Guid id)
    {
        return _context.Comments.Any(e => e.Id == id);
    }
}

public class CommentRequest
{
    public string Content { get; set; } = string.Empty;
    public Guid PostId { get; set; }
}

public class CommentResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid UserId { get; set; }
    public string UserDisplayName { get; set; } = string.Empty;
    public Guid PostId { get; set; }
    public UserResponse? User { get; set; }
}

public class CreateCommentRequest
{
    public string Content { get; set; } = string.Empty;
    public Guid PostId { get; set; }
}

public class UserResponse
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
} 