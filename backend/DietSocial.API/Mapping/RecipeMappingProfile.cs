using AutoMapper;
using DietSocial.API.Models;
using DietSocial.API.Models.DTOs;

namespace DietSocial.API.Mapping;

public class RecipeMappingProfile : Profile
{
    public RecipeMappingProfile()
    {
        CreateMap<Recipe, RecipeResponse>()
            .ForMember(dest => dest.UserDisplayName, opt => opt.MapFrom(src => src.User!.DisplayName))
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));

        CreateMap<RecipeRequest, Recipe>();
    }
} 