using DietSocial.API.Models;

namespace DietSocial.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
} 