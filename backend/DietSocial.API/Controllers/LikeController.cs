using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;
using System.Security.Claims;
using System.Collections.Generic;

namespace DietSocial.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LikeController : BaseController
    {
        private readonly ApplicationDbContext _context;

        public LikeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("{postId}")]
        public async Task<IActionResult> LikePost(Guid postId)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            var post = await _context.Posts
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null)
            {
                return NotFound("Post not found");
            }

            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.UserId == userId && l.PostId == postId);

            if (existingLike != null)
            {
                return BadRequest("You have already liked this post");
            }

            var like = new Like
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Likes.Add(like);

            // Create notification for post owner if it's not the same user
            if (post.UserId != userId)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = post.UserId,
                    Type = "like",
                    Message = $"{user.DisplayName} liked your post",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{postId}")]
        public async Task<IActionResult> RemoveLike(Guid postId)
        {
            var userId = GetCurrentUserId();

            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.UserId == userId && l.PostId == postId);

            if (like == null)
            {
                return NotFound("Like not found");
            }

            _context.Likes.Remove(like);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("count/{postId}")]
        public async Task<IActionResult> GetLikeCount(Guid postId)
        {
            var count = await _context.Likes
                .CountAsync(l => l.PostId == postId);

            return Ok(new { count });
        }

        [HttpGet("hasliked/{postId}")]
        public async Task<IActionResult> HasLiked(Guid postId)
        {
            var userId = GetCurrentUserId();

            var hasLiked = await _context.Likes
                .AnyAsync(l => l.UserId == userId && l.PostId == postId);

            return Ok(new { hasLiked });
        }

        [HttpGet("users/{postId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsersWhoLikedPost(Guid postId)
        {
            // Check if post exists
            var postExists = await _context.Posts.AnyAsync(p => p.Id == postId);
            if (!postExists)
            {
                return NotFound("Post not found");
            }

            var users = await _context.Likes
                .Include(l => l.User)
                .Where(l => l.PostId == postId)
                .Select(l => new { id = l.User.Id, displayName = l.User.DisplayName })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> HasLikedComment(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                if (!commentExists)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                var hasLiked = await _context.CommentLikes.AnyAsync(cl => cl.UserId == userId && cl.CommentId == commentId);
                return Ok(new { hasLiked });
            }
            catch (Exception ex)
            {
                // Log the actual exception for debugging
                Console.WriteLine($"Error in HasLikedComment: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"An error occurred while checking like status: {ex.Message}" });
            }
        }

        [HttpPost("comment/{commentId}")]
        public async Task<IActionResult> LikeComment(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { error = "User not found" });
                }

                // Verify comment exists and get it with user info
                var comment = await _context.Comments
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                // Check if user already liked the comment
                var existingLike = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                if (existingLike != null)
                {
                    return BadRequest(new { error = "You have already liked this comment" });
                }

                // Create the like
                var like = new CommentLike
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CommentId = commentId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CommentLikes.Add(like);

                // Create notification for comment owner if it's not the same user
                if (comment.UserId != userId && comment.User != null)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = comment.UserId,
                        Type = "comment_like",
                        Message = $"{user.DisplayName} liked your comment",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    };

                    _context.Notifications.Add(notification);
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                // Log the actual exception for debugging
                Console.WriteLine($"Error in LikeComment: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"An error occurred while liking the comment: {ex.Message}" });
            }
        }

        [HttpDelete("comment/{commentId}")]
        public async Task<IActionResult> RemoveCommentLike(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == Guid.Empty)
                {
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                if (!commentExists)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                var like = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                if (like == null)
                {
                    return NotFound(new { error = "Like not found" });
                }

                _context.CommentLikes.Remove(like);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the actual exception for debugging
                Console.WriteLine($"Error in RemoveCommentLike: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"An error occurred while removing the like: {ex.Message}" });
            }
        }
    }
} 