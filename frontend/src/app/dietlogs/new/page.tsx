'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormInput from '@/components/FormInput';
import { dietLogsService } from '@/services/dietLogs';
import { authService } from '@/services/auth';

export default function NewDietLogPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    calories: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    title: '',
    calories: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const validateForm = () => {
    const errors = {
      title: '',
      calories: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    const calories = parseInt(formData.calories);
    if (!formData.calories) {
      errors.calories = 'Calories is required';
      isValid = false;
    } else if (isNaN(calories) || calories <= 0) {
      errors.calories = 'Calories must be greater than 0';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await dietLogsService.createDietLog({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        calories: parseInt(formData.calories),
      });
      router.push('/dietlogs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create diet log');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            New Diet Log
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <FormInput
          label="Title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={validationErrors.title}
          required
        />

        <FormInput
          label="Description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <FormInput
          label="Calories"
          type="number"
          min="1"
          value={formData.calories}
          onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
          error={validationErrors.calories}
          required
        />

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dietlogs')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Log'}
          </button>
        </div>
      </form>
    </div>
  );
} 