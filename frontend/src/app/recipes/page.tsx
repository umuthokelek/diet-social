"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllRecipes, deleteRecipe, Recipe } from "@/services/recipeService";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";

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
            setCurrentUserId(userId);
          } catch (err) {
            console.error('Error decoding token:', err);
            setCurrentUserId(null);
          }
        }

        // Load recipes
        const recipesData = await getAllRecipes();
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
        <Button onClick={() => setError(null)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Recipes
        </h1>
        <Link href="/recipes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Recipe
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {recipes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                No recipes yet. Be the first to share your favorite recipe!
              </div>
            </CardContent>
          </Card>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isOwner={isRecipeOwner(recipe.userId)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
} 