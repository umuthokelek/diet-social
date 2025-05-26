"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllRecipes, deleteRecipe, Recipe } from "@/services/recipeService";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
            <Card key={recipe.id}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {recipe.userDisplayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/profile/${recipe.userId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {recipe.userDisplayName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(recipe.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {isRecipeOwner(recipe.userId) && (
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/recipes/edit/${recipe.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Edit recipe</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(recipe.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete recipe</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{recipe.title}</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ingredients</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{recipe.ingredients}</p>
                </div>

                {recipe.calories && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Nutrition</h3>
                      <Badge className="text-sm bg-gray-100 text-gray-700">
                        {recipe.calories} calories
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 