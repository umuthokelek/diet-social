using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DietSocial.API.Data;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;
using AutoMapper;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipeController : BaseController
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public RecipeController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<RecipeResponse>> CreateRecipe(RecipeRequest request)
    {
        var userId = GetCurrentUserId();
        var recipe = _mapper.Map<Recipe>(request);
        recipe.Id = Guid.NewGuid();
        recipe.UserId = userId;
        recipe.CreatedAt = DateTime.UtcNow;
        recipe.UpdatedAt = DateTime.UtcNow;

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();

        var response = _mapper.Map<RecipeResponse>(recipe);
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeResponse>>> GetRecipes()
    {
        var recipes = await _context.Recipes
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => _mapper.Map<RecipeResponse>(r))
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
            .Select(r => _mapper.Map<RecipeResponse>(r))
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

        var response = _mapper.Map<RecipeResponse>(recipe);
        return Ok(response);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateRecipe(Guid id, RecipeRequest request)
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

        _mapper.Map(request, recipe);
        recipe.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await RecipeExists(id))
            {
                return NotFound("Recipe not found");
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
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

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> RecipeExists(Guid id)
    {
        return await _context.Recipes.AnyAsync(r => r.Id == id);
    }
} 