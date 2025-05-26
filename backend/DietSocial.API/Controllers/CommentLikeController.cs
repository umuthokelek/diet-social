using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;

namespace DietSocial.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CommentLikeController : BaseController
    {
        private readonly ApplicationDbContext _context;

        public CommentLikeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("{commentId}")]
        public async Task<IActionResult> LikeComment(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"[LikeComment] UserId from GetCurrentUserId: {userId}");

                if (userId == Guid.Empty)
                {
                    Console.WriteLine("[LikeComment] UserId is empty, returning Unauthorized");
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                var user = await _context.Users.FindAsync(userId);
                Console.WriteLine($"[LikeComment] User found: {user != null}");

                if (user == null)
                {
                    Console.WriteLine($"[LikeComment] User {userId} not found");
                    return Unauthorized(new { error = "User not found" });
                }

                // Verify comment exists and get it with user info
                var comment = await _context.Comments
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                Console.WriteLine($"[LikeComment] Comment found: {comment != null}");
                Console.WriteLine($"[LikeComment] Comment.User found: {comment?.User != null}");

                if (comment == null)
                {
                    Console.WriteLine($"[LikeComment] Comment {commentId} not found");
                    return NotFound(new { error = "Comment not found" });
                }

                // Check if user already liked the comment
                var existingLike = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                Console.WriteLine($"[LikeComment] Existing like found: {existingLike != null}");

                if (existingLike != null)
                {
                    Console.WriteLine($"[LikeComment] User {userId} already liked comment {commentId}");
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
                Console.WriteLine($"[LikeComment] Created new like with ID: {like.Id}");

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
                    Console.WriteLine($"[LikeComment] Created notification for user {comment.UserId}");
                }

                await _context.SaveChangesAsync();
                Console.WriteLine("[LikeComment] Successfully saved changes");
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LikeComment] Error occurred:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception Message: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner Exception Stack Trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, new { error = $"An error occurred while liking the comment: {ex.Message}" });
            }
        }

        [HttpDelete("{commentId}")]
        public async Task<IActionResult> RemoveLike(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"[RemoveLike] UserId from GetCurrentUserId: {userId}");

                if (userId == Guid.Empty)
                {
                    Console.WriteLine("[RemoveLike] UserId is empty, returning Unauthorized");
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                Console.WriteLine($"[RemoveLike] Comment exists check: {commentExists}");

                if (!commentExists)
                {
                    Console.WriteLine($"[RemoveLike] Comment {commentId} not found");
                    return NotFound(new { error = "Comment not found" });
                }

                var like = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                Console.WriteLine($"[RemoveLike] Like found: {like != null}");

                if (like == null)
                {
                    Console.WriteLine($"[RemoveLike] Like not found for user {userId} and comment {commentId}");
                    return NotFound(new { error = "Like not found" });
                }

                _context.CommentLikes.Remove(like);
                await _context.SaveChangesAsync();
                Console.WriteLine("[RemoveLike] Successfully removed like and saved changes");
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RemoveLike] Error occurred:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception Message: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner Exception Stack Trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, new { error = $"An error occurred while removing the like: {ex.Message}" });
            }
        }

        [HttpGet("count/{commentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLikeCount(Guid commentId)
        {
            try
            {
                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                if (!commentExists)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                var count = await _context.CommentLikes
                    .CountAsync(cl => cl.CommentId == commentId);

                return Ok(new { count });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetLikeCount] Error occurred:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"An error occurred while getting like count: {ex.Message}" });
            }
        }

        [HttpGet("hasliked/{commentId}")]
        public async Task<IActionResult> HasLiked(Guid commentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"[HasLiked] UserId from GetCurrentUserId: {userId}");

                if (userId == Guid.Empty)
                {
                    Console.WriteLine("[HasLiked] UserId is empty, returning Unauthorized");
                    return Unauthorized(new { error = "User is not authenticated" });
                }

                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                Console.WriteLine($"[HasLiked] Comment exists check: {commentExists}");

                if (!commentExists)
                {
                    Console.WriteLine($"[HasLiked] Comment {commentId} not found");
                    return NotFound(new { error = "Comment not found" });
                }

                var hasLiked = await _context.CommentLikes.AnyAsync(cl => cl.UserId == userId && cl.CommentId == commentId);
                Console.WriteLine($"[HasLiked] User {userId} has liked comment {commentId}: {hasLiked}");

                return Ok(new { hasLiked });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[HasLiked] Error occurred:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception Message: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner Exception Stack Trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, new { error = $"An error occurred while checking like status: {ex.Message}" });
            }
        }

        [HttpGet("users/{commentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsersWhoLikedComment(Guid commentId)
        {
            try
            {
                // Verify comment exists
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == commentId);
                if (!commentExists)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                var users = await _context.CommentLikes
                    .Include(cl => cl.User)
                    .Where(cl => cl.CommentId == commentId)
                    .Select(cl => new { id = cl.User.Id, displayName = cl.User.DisplayName })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetUsersWhoLikedComment] Error occurred:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"An error occurred while getting users who liked: {ex.Message}" });
            }
        }
    }
} 