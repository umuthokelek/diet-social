using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;
using System.Security.Claims;

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
    }
} 