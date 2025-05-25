"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getRecipe, updateRecipe, Recipe, RecipeRequest } from "@/services/recipeService";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [form, setForm] = useState<RecipeRequest>({
    title: "",
    description: "",
    ingredients: "",
    calories: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current userId from JWT
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found in localStorage');
          router.push('/login');
          return;
        }

        let userId: string;
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
          console.log('Decoded userId from token:', userId);
          setCurrentUserId(userId);
        } catch (err) {
          console.error('Error decoding token:', err);
          setCurrentUserId(null);
          router.push('/login');
          return;
        }

        // Load recipe
        const recipeData = await getRecipe(id);
        console.log('Loaded recipe:', recipeData);
        console.log('Recipe userId:', recipeData.userId);
        console.log('Current userId:', userId);
        console.log('Ownership check:', recipeData.userId === userId);

        // Check ownership
        if (recipeData.userId !== userId) {
          console.log('Permission denied: User does not own this recipe');
          setError("You don't have permission to edit this recipe.");
          setLoading(false);
          return;
        }

        setRecipe(recipeData);
        setForm({
          title: recipeData.title,
          description: recipeData.description,
          ingredients: recipeData.ingredients,
          calories: recipeData.calories,
        });
      } catch (err: any) {
        console.error('Error loading recipe:', err);
        if (err?.response?.status === 404) {
          setError("Recipe not found.");
        } else if (err?.response?.status === 403) {
          setError("You don't have permission to edit this recipe.");
        } else {
          setError("Failed to load recipe. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'calories' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateRecipe(id, form);
      router.push("/recipes");
    } catch (err: any) {
      console.error('Error updating recipe:', err);
      if (err?.response?.status === 403) {
        setError("You don't have permission to edit this recipe.");
      } else if (err?.response?.status === 401) {
        setError("Please sign in to edit recipes.");
        router.push('/login');
      } else {
        setError("Failed to update recipe. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push("/recipes")}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Recipes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ingredients</label>
          <textarea
            name="ingredients"
            value={form.ingredients}
            onChange={handleChange}
            required
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Calories</label>
          <input
            type="number"
            name="calories"
            value={form.calories || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recipes")}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 