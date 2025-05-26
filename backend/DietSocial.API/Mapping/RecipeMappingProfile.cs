using AutoMapper;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;

namespace DietSocial.API.Mapping;

public class RecipeMappingProfile : Profile
{
    public RecipeMappingProfile()
    {
        CreateMap<Recipe, RecipeResponse>()
            .ForMember(dest => dest.UserDisplayName, opt => opt.MapFrom(src => src.User != null ? src.User.DisplayName : "Anonymous"))
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User != null ? new Models.DTOs.UserResponse
            {
                Id = src.User.Id,
                DisplayName = src.User.DisplayName,
                CreatedAt = src.User.CreatedAt
            } : null));

        CreateMap<RecipeRequest, Recipe>();
    }
} 