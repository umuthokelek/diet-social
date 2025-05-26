using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;
using DietSocial.API.Extensions;
using DietSocial.API.Services;

namespace DietSocial.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostController : BaseController
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorageService;

        public PostController(ApplicationDbContext context, IFileStorageService fileStorageService)
        {
            _context = context;
            _fileStorageService = fileStorageService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPosts()
        {
            var posts = await _context.Posts
                .Include(p => p.User)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostResponse
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    UserDisplayName = p.User!.DisplayName,
                    UserId = p.UserId,
                    LikeCount = p.Likes.Count,
                    CommentCount = p.Comments.Count
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpGet("following")]
        [Authorize]
        public async Task<IActionResult> GetFollowingPosts()
        {
            var userId = GetCurrentUserId();
            var followingIds = await _context.Follows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            var posts = await _context.Posts
                .Include(p => p.User)
                .Where(p => followingIds.Contains(p.UserId))
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostResponse
                {
                    Id = p.Id,
                    Content = p.Content,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    UserDisplayName = p.User!.DisplayName,
                    UserId = p.UserId,
                    LikeCount = p.Likes.Count,
                    CommentCount = p.Comments.Count
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<PostResponse>> GetPost(Guid id)
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .Include(p => p.Comments)
                .Include(p => p.Likes)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (post == null)
            {
                return NotFound();
            }

            return Ok(new PostResponse
            {
                Id = post.Id,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                UserId = post.UserId,
                UserDisplayName = post.User!.DisplayName,
                LikeCount = post.Likes.Count,
                CommentCount = post.Comments.Count
            });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { Message = "Content cannot be empty" });
            }

            if (request.Content.Length > 500)
            {
                return BadRequest(new { Message = "Content cannot exceed 500 characters" });
            }

            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            string? imageUrl = null;
            if (request.Image != null)
            {
                try
                {
                    imageUrl = await _fileStorageService.SaveImageAsync(request.Image);
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { Message = ex.Message });
                }
            }

            var post = new Post
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                Content = request.Content.Trim(),
                ImageUrl = imageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPosts), new { id = post.Id }, post);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(Guid id, [FromForm] UpdatePostRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { Message = "Content cannot be empty" });
            }

            if (request.Content.Length > 500)
            {
                return BadRequest(new { Message = "Content cannot exceed 500 characters" });
            }

            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var post = await _context.Posts.FindAsync(id);
            if (post == null)
            {
                return NotFound();
            }

            if (post.UserId != userId.Value)
            {
                return Forbid();
            }

            // Handle image update
            if (request.Image != null)
            {
                try
                {
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(post.ImageUrl))
                    {
                        _fileStorageService.DeleteImage(post.ImageUrl);
                    }

                    // Save new image
                    post.ImageUrl = await _fileStorageService.SaveImageAsync(request.Image);
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { Message = ex.Message });
                }
            }
            else if (request.RemoveImage)
            {
                // Delete old image if exists
                if (!string.IsNullOrEmpty(post.ImageUrl))
                {
                    _fileStorageService.DeleteImage(post.ImageUrl);
                    post.ImageUrl = null;
                }
            }

            post.Content = request.Content.Trim();
            post.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(post);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PostExists(id))
                {
                    return NotFound();
                }
                throw;
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            var userId = User.GetUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var post = await _context.Posts.FindAsync(id);
            if (post == null)
            {
                return NotFound();
            }

            if (post.UserId != userId.Value)
            {
                return Forbid();
            }

            // Delete associated image if exists
            if (!string.IsNullOrEmpty(post.ImageUrl))
            {
                _fileStorageService.DeleteImage(post.ImageUrl);
            }

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PostExists(Guid id)
        {
            return _context.Posts.Any(e => e.Id == id);
        }
    }

    public class UpdatePostRequest
    {
        public string Content { get; set; } = string.Empty;
        public IFormFile? Image { get; set; }
        public bool RemoveImage { get; set; }
    }

    public class CreatePostRequest
    {
        public string Content { get; set; } = string.Empty;
        public IFormFile? Image { get; set; }
    }
} 