"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipe, RecipeRequest } from "@/services/recipeService";

export default function NewRecipePage() {
  const [form, setForm] = useState<RecipeRequest>({
    title: "",
    description: "",
    ingredients: "",
    calories: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createRecipe(form);
      router.push("/recipes");
    } catch (err) {
      setError("Failed to create recipe. Please try again.");
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
            rows={2}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Calories</label>
          <input
            type="text"
            name="calories"
            value={form.calories}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Recipe"}
        </button>
      </form>
    </div>
  );
} 