using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DietSocial.API.Services;

namespace DietSocial.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageController : BaseController
{
    private readonly IFileStorageService _fileStorageService;

    public ImageController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<ActionResult<string>> UploadImage(IFormFile file)
    {
        try
        {
            var imageUrl = await _fileStorageService.SaveImageAsync(file);
            return Ok(new { imageUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while uploading the image." });
        }
    }

    [HttpDelete("{fileName}")]
    [Authorize]
    public IActionResult DeleteImage(string fileName)
    {
        try
        {
            _fileStorageService.DeleteImage(fileName);
            return NoContent();
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the image." });
        }
    }
} 