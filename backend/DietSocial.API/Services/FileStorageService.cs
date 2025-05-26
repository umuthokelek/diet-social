using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace DietSocial.API.Services;

public interface IFileStorageService
{
    Task<string> SaveImageAsync(IFormFile file);
    void DeleteImage(string fileName);
}

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private const string ImagesFolder = "images";
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif" };
    private const int MaxFileSizeInMB = 5;

    public FileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No file was uploaded.");
        }

        // Validate file size (5MB max)
        if (file.Length > MaxFileSizeInMB * 1024 * 1024)
        {
            throw new ArgumentException($"File size exceeds the maximum limit of {MaxFileSizeInMB}MB.");
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new ArgumentException("Invalid file type. Only .jpg, .jpeg, .png, and .gif files are allowed.");
        }

        // Create images directory if it doesn't exist
        var imagesPath = Path.Combine(_environment.WebRootPath, ImagesFolder);
        if (!Directory.Exists(imagesPath))
        {
            Directory.CreateDirectory(imagesPath);
        }

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(imagesPath, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return only the filename without any path
        return fileName;
    }

    public void DeleteImage(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
        {
            return;
        }

        // Clean the filename by removing any path prefixes
        var cleanFileName = fileName
            .Replace("/", "")
            .Replace("\\", "")
            .Replace("images/", "")
            .Replace("api/images/", "");

        var filePath = Path.Combine(_environment.WebRootPath, ImagesFolder, cleanFileName);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
} 