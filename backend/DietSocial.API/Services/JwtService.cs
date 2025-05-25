using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DietSocial.API.Models;
using DietSocial.API.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;

namespace DietSocial.API.Services
{
    public class JwtService : IJwtService
    {
        private readonly JwtConfig _jwtConfig;

        public JwtService(IOptions<JwtConfig> jwtConfig)
        {
            if (jwtConfig?.Value == null)
            {
                throw new ArgumentNullException(nameof(jwtConfig), "JWT configuration is not properly registered.");
            }

            _jwtConfig = jwtConfig.Value;
            
            if (string.IsNullOrEmpty(_jwtConfig.Key))
            {
                throw new InvalidOperationException("JWT signing key is not configured. Please check your appsettings.json.");
            }
            
            if (string.IsNullOrEmpty(_jwtConfig.Issuer))
            {
                throw new InvalidOperationException("JWT issuer is not configured. Please check your appsettings.json.");
            }
            
            if (string.IsNullOrEmpty(_jwtConfig.Audience))
            {
                throw new InvalidOperationException("JWT audience is not configured. Please check your appsettings.json.");
            }
        }

        public string GenerateToken(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            if (string.IsNullOrEmpty(_jwtConfig.Key))
            {
                throw new InvalidOperationException("JWT signing key is not configured. Please check your appsettings.json.");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.DisplayName)
            };

            var token = new JwtSecurityToken(
                issuer: _jwtConfig.Issuer,
                audience: _jwtConfig.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_jwtConfig.ExpirationInHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
} 