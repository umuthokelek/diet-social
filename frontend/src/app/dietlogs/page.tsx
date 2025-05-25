'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DietLog, dietLogsService } from '@/services/dietLogs';
import { authService } from '@/services/auth';

export default function DietLogsPage() {
  const router = useRouter();
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchDietLogs = async () => {
      try {
        const logs = await dietLogsService.getDietLogs();
        setDietLogs(logs);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch diet logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDietLogs();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Diet Logs</h1>
        <Link
          href="/dietlogs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Log
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {dietLogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No diet logs found. Start by adding your first log!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dietLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">{log.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {log.description && (
                  <p className="text-sm text-gray-600 mb-4">{log.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {log.calories} calories
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 