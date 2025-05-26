"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { recipeService } from "@/services/recipeService";
import ImageUpload from "@/components/ImageUpload";

export default function NewRecipePage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    calories: undefined as number | undefined,
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'calories' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!form.title.trim()) {
        throw new Error("Title is required");
      }
      if (!form.description.trim()) {
        throw new Error("Description is required");
      }
      if (!form.ingredients.trim()) {
        throw new Error("Ingredients are required");
      }
      if (form.calories !== undefined && form.calories <= 0) {
        throw new Error("Calories must be greater than 0");
      }

      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('ingredients', form.ingredients.trim());
      if (form.calories) {
        formData.append('calories', form.calories.toString());
      }
      if (image) {
        formData.append('image', image);
      }

      await recipeService.createRecipe(formData);
      router.push("/recipes");
    } catch (err: any) {
      console.error('Error creating recipe:', err);
      if (err?.response?.status === 401) {
        setError("Please sign in to create recipes.");
        router.push('/login');
      } else {
        setError(err.message || "Failed to create recipe. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <div className="relative">
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={200}
              className="w-full border rounded px-3 py-2 pr-10"
              placeholder="Enter recipe title"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <ImageUpload onImageSelect={setImage} />
            </div>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            maxLength={2000}
            rows={3}
            className="w-full border rounded px-3 py-2"
            placeholder="Describe your recipe"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ingredients</label>
          <textarea
            name="ingredients"
            value={form.ingredients}
            onChange={handleChange}
            required
            maxLength={2000}
            rows={3}
            className="w-full border rounded px-3 py-2"
            placeholder="List the ingredients (one per line)"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Calories</label>
          <input
            type="number"
            name="calories"
            value={form.calories || ''}
            onChange={handleChange}
            min="0"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter calories (optional)"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Recipe"}
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