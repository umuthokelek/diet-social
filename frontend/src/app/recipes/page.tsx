"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllRecipes, deleteRecipe, Recipe } from "@/services/recipeService";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current userId from JWT
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode<JwtPayload>(token);
            const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            console.log('Current user ID:', userId);
            setCurrentUserId(userId);
          } catch (err) {
            console.error('Error decoding token:', err);
            setCurrentUserId(null);
          }
        }

        // Load recipes
        const recipesData = await getAllRecipes();
        console.log('Loaded recipes:', recipesData);
        setRecipes(recipesData);
      } catch (err) {
        console.error('Error loading recipes:', err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      await deleteRecipe(id);
      setRecipes(recipes.filter(recipe => recipe.id !== id));
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      if (err?.response?.status === 403) {
        setError("You don't have permission to delete this recipe.");
      } else if (err?.response?.status === 401) {
        setError("Please sign in to delete recipes.");
        router.push('/login');
      } else {
        setError("Failed to delete recipe. Please try again.");
      }
    }
  };

  const isRecipeOwner = (recipeUserId: string) => {
    return currentUserId === recipeUserId;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => setError(null)}
          className="text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Link
          href="/recipes/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Recipe
        </Link>
      </div>

      <div className="space-y-8">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{recipe.title}</h2>
                <p className="text-gray-600 mb-4">By {recipe.userDisplayName}</p>
              </div>
              {isRecipeOwner(recipe.userId) && (
                <div className="flex gap-2">
                  <Link
                    href={`/recipes/edit/${recipe.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-1">Ingredients</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{recipe.ingredients}</p>
              </div>

              {recipe.calories && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Nutrition</h3>
                  <p className="text-gray-700">Calories: {recipe.calories} kcal</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Created: {new Date(recipe.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 