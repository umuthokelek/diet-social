using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;

namespace DietSocial.API.Controllers
{
    public class DietLogController : BaseController
    {
        private readonly ApplicationDbContext _context;

        public DietLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDietLogs()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            var dietLogs = await _context.DietLogs
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new DietLogResponse
                {
                    Id = d.Id,
                    Title = d.Title,
                    Description = d.Description,
                    Calories = d.Calories,
                    CreatedAt = d.CreatedAt,
                    UserDisplayName = user.DisplayName,
                    UserId = user.Id
                })
                .ToListAsync();

            return Ok(dietLogs);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDietLog(CreateDietLogRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { Message = "Title is required" });
            }

            if (request.Title.Length > 100)
            {
                return BadRequest(new { Message = "Title cannot exceed 100 characters" });
            }

            if (request.Calories <= 0)
            {
                return BadRequest(new { Message = "Calories must be greater than 0" });
            }

            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            var dietLog = new DietLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                Calories = request.Calories,
                CreatedAt = DateTime.UtcNow
            };

            _context.DietLogs.Add(dietLog);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDietLogs), new { id = dietLog.Id }, new DietLogResponse
            {
                Id = dietLog.Id,
                Title = dietLog.Title,
                Description = dietLog.Description,
                Calories = dietLog.Calories,
                CreatedAt = dietLog.CreatedAt,
                UserDisplayName = user.DisplayName,
                UserId = user.Id
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDietLog(Guid id, UpdateDietLogRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { Message = "Title is required" });
            }

            if (request.Title.Length > 100)
            {
                return BadRequest(new { Message = "Title cannot exceed 100 characters" });
            }

            if (request.Calories <= 0)
            {
                return BadRequest(new { Message = "Calories must be greater than 0" });
            }

            var userId = GetCurrentUserId();
            var dietLog = await _context.DietLogs.FindAsync(id);
            if (dietLog == null)
            {
                return NotFound(new { Message = "Diet log not found" });
            }

            if (dietLog.UserId != userId)
            {
                return Forbidden();
            }

            dietLog.Title = request.Title.Trim();
            dietLog.Description = request.Description?.Trim();
            dietLog.Calories = request.Calories;

            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);
            return Ok(new DietLogResponse
            {
                Id = dietLog.Id,
                Title = dietLog.Title,
                Description = dietLog.Description,
                Calories = dietLog.Calories,
                CreatedAt = dietLog.CreatedAt,
                UserDisplayName = user!.DisplayName,
                UserId = user.Id
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDietLog(Guid id)
        {
            var userId = GetCurrentUserId();
            var dietLog = await _context.DietLogs.FindAsync(id);
            if (dietLog == null)
            {
                return NotFound(new { Message = "Diet log not found" });
            }

            if (dietLog.UserId != userId)
            {
                return Forbidden();
            }

            _context.DietLogs.Remove(dietLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
} 