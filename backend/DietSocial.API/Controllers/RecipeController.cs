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
using AutoMapper;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipeController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorageService;

    public RecipeController(ApplicationDbContext context, IMapper mapper, IFileStorageService fileStorageService)
    {
        _context = context;
        _mapper = mapper;
        _fileStorageService = fileStorageService;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateRecipe([FromForm] CreateRecipeRequest request)
    {
        var userId = GetCurrentUserId();

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

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Ingredients = string.Join(",", request.Ingredients),
            ImageUrl = imageUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRecipes), new { id = recipe.Id }, recipe);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeResponse>>> GetRecipes()
    {
        var recipes = await _context.Recipes
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecipeResponse
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                Ingredients = r.Ingredients,
                ImageUrl = r.ImageUrl,
                Calories = r.Calories,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                UserId = r.UserId,
                UserDisplayName = r.User != null ? r.User.DisplayName : "Anonymous",
                User = r.User != null ? new Models.DTOs.UserResponse
                {
                    Id = r.User.Id,
                    DisplayName = r.User.DisplayName,
                    CreatedAt = r.User.CreatedAt
                } : null
            })
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RecipeResponse>>> GetRecipesByUserId(Guid userId)
    {
        var recipes = await _context.Recipes
            .Include(r => r.User)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RecipeResponse
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                Ingredients = r.Ingredients,
                ImageUrl = r.ImageUrl,
                Calories = r.Calories,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                UserId = r.UserId,
                UserDisplayName = r.User != null ? r.User.DisplayName : "Anonymous",
                User = r.User != null ? new Models.DTOs.UserResponse
                {
                    Id = r.User.Id,
                    DisplayName = r.User.DisplayName,
                    CreatedAt = r.User.CreatedAt
                } : null
            })
            .ToListAsync();

        return Ok(recipes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RecipeResponse>> GetRecipe(Guid id)
    {
        var recipe = await _context.Recipes
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (recipe == null)
        {
            return NotFound("Recipe not found");
        }

        var response = new RecipeResponse
        {
            Id = recipe.Id,
            Title = recipe.Title,
            Description = recipe.Description,
            Ingredients = recipe.Ingredients,
            ImageUrl = recipe.ImageUrl,
            Calories = recipe.Calories,
            CreatedAt = recipe.CreatedAt,
            UpdatedAt = recipe.UpdatedAt,
            UserId = recipe.UserId,
            UserDisplayName = recipe.User != null ? recipe.User.DisplayName : "Anonymous",
            User = recipe.User != null ? new Models.DTOs.UserResponse
            {
                Id = recipe.User.Id,
                DisplayName = recipe.User.DisplayName,
                CreatedAt = recipe.User.CreatedAt
            } : null
        };

        return Ok(response);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecipe(Guid id, [FromForm] UpdateRecipeRequest request)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null)
        {
            return NotFound("Recipe not found");
        }

        var userId = GetCurrentUserId();
        if (recipe.UserId != userId)
        {
            return Forbid();
        }

        // Handle image update
        if (request.Image != null)
        {
            try
            {
                // Delete old image if exists
                if (!string.IsNullOrEmpty(recipe.ImageUrl))
                {
                    _fileStorageService.DeleteImage(recipe.ImageUrl);
                }

                // Save new image
                recipe.ImageUrl = await _fileStorageService.SaveImageAsync(request.Image);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
        else if (request.RemoveImage)
        {
            // Delete old image if exists
            if (!string.IsNullOrEmpty(recipe.ImageUrl))
            {
                _fileStorageService.DeleteImage(recipe.ImageUrl);
                recipe.ImageUrl = null;
            }
        }

        recipe.Title = request.Title.Trim();
        recipe.Description = request.Description.Trim();
        recipe.Ingredients = string.Join(",", request.Ingredients);
        recipe.Calories = request.Calories;
        recipe.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return Ok(recipe);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await RecipeExists(id))
            {
                return NotFound();
            }
            throw;
        }
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecipe(Guid id)
    {
        var recipe = await _context.Recipes.FindAsync(id);
        if (recipe == null)
        {
            return NotFound("Recipe not found");
        }

        var userId = GetCurrentUserId();
        if (recipe.UserId != userId)
        {
            return Forbid();
        }

        // Delete associated image if exists
        if (!string.IsNullOrEmpty(recipe.ImageUrl))
        {
            _fileStorageService.DeleteImage(recipe.ImageUrl);
        }

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> RecipeExists(Guid id)
    {
        return await _context.Recipes.AnyAsync(r => r.Id == id);
    }

    public class UpdateRecipeRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Ingredients { get; set; } = new();
        public IFormFile? Image { get; set; }
        public bool RemoveImage { get; set; }
        public int? Calories { get; set; }
    }

    public class CreateRecipeRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Ingredients { get; set; } = new();
        public IFormFile? Image { get; set; }
        public int? Calories { get; set; }
    }
} 