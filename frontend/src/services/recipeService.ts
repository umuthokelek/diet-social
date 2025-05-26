import api from './api';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  imageUrl?: string;
  calories?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    displayName: string;
  };
}

export interface RecipeRequest {
  title: string;
  description: string;
  ingredients: string;
  calories?: number;
  image?: File;
}

export const recipeService = {
  async getRecipes(): Promise<Recipe[]> {
    const response = await api.get<Recipe[]>('/Recipe');
    return response.data;
  },

  async getFollowingRecipes(): Promise<Recipe[]> {
    const response = await api.get<Recipe[]>('/Recipe/following');
    return response.data;
  },

  async getRecipe(id: string): Promise<Recipe> {
    const response = await api.get<Recipe>(`/Recipe/${id}`);
    return response.data;
  },

  async createRecipe(data: FormData): Promise<Recipe> {
    const response = await api.post<Recipe>('/Recipe', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateRecipe(id: string, data: FormData): Promise<Recipe> {
    const response = await api.put<Recipe>(`/Recipe/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteRecipe(id: string): Promise<void> {
    await api.delete(`/Recipe/${id}`);
  },
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await api.delete(`/Recipe/${recipeId}`);
};

export async function getRecipesByUserId(userId: string): Promise<Recipe[]> {
  const response = await api.get<Recipe[]>(`/Recipe/user/${userId}`);
  return response.data;
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const response = await api.get<Recipe[]>('/Recipe');
  return response.data;
}

export async function getRecipe(recipeId: string): Promise<Recipe> {
  const response = await api.get<Recipe>(`/Recipe/${recipeId}`);
  return response.data;
}

export async function updateRecipe(recipeId: string, data: FormData): Promise<Recipe> {
  const response = await api.put<Recipe>(`/Recipe/${recipeId}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
} 