import axios from 'axios';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  calories?: number;
  createdAt: string;
  userId: string;
  userDisplayName: string;
}

export interface RecipeRequest {
  title: string;
  description: string;
  ingredients: string;
  calories?: number;
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get<Recipe[]>('http://localhost:5177/api/Recipe', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function getRecipesByUserId(userId: string): Promise<Recipe[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get<Recipe[]>(`http://localhost:5177/api/Recipe/user/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function getRecipe(id: string): Promise<Recipe> {
  const token = localStorage.getItem('token');
  const response = await axios.get<Recipe>(`http://localhost:5177/api/Recipe/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function createRecipe(recipe: RecipeRequest): Promise<Recipe> {
  const token = localStorage.getItem('token');
  const response = await axios.post<Recipe>('http://localhost:5177/api/Recipe', recipe, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function updateRecipe(id: string, recipe: RecipeRequest): Promise<void> {
  const token = localStorage.getItem('token');
  await axios.put(`http://localhost:5177/api/Recipe/${id}`, recipe, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  await axios.delete(`http://localhost:5177/api/Recipe/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
} 