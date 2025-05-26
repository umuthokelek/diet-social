import React from 'react';
import Link from 'next/link';
import { Recipe } from '@/services/recipeService';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecipeCardProps {
  recipe: Recipe;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export default function RecipeCard({ recipe, isOwner, onDelete }: RecipeCardProps) {
  const displayName = recipe.user?.displayName ?? "Anonymous";
  const userInitial = displayName.charAt(0).toUpperCase();
  const imageUrl = getImageUrl(recipe.imageUrl);
  
  // Log the constructed image URL for verification
  console.log('RecipeCard image URL:', imageUrl);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/profile/${recipe.userId}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {displayName}
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
          {isOwner && (
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
                      onClick={() => onDelete?.(recipe.id)}
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
        {imageUrl && (
          <div className="relative w-full aspect-video mb-4">
            <img
              src={imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
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
  );
} 