using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using DietSocial.API.Extensions;
using System.Security.Claims;

namespace DietSocial.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        [ApiExplorerSettings(IgnoreApi = true)]
        protected new UnauthorizedResult Unauthorized()
        {
            return base.Unauthorized();
        }

        protected UnauthorizedObjectResult UnauthorizedWith<T>(T value)
        {
            return new UnauthorizedObjectResult(value);
        }

        protected Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new System.InvalidOperationException("User ID not found in claims");
            }
            return Guid.Parse(userIdClaim.Value);
        }

        protected string GetCurrentUserEmail()
        {
            return User.GetUserEmail();
        }

        protected IActionResult Forbidden()
        {
            return StatusCode(403, new { Message = "You don't have permission to access this resource" });
        }
    }
} 