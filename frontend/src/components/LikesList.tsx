import React, { useEffect, useState } from 'react';
import api from '@/services/api';

interface LikeUser {
  id: string;
  displayName: string;
}

interface LikesListProps {
  postId: string;
}

const LikesList: React.FC<LikesListProps> = ({ postId }) => {
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    setError(null);
    api.get<LikeUser[]>(`/Like/users/${postId}`)
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load likes'))
      .then(() => setLoading(false));
  }, [show, postId]);

  return (
    <div className="mt-2">
      <button
        className="text-xs text-blue-600 hover:underline focus:outline-none"
        onClick={() => setShow(v => !v)}
      >
        {show ? 'Hide Likes' : 'Show Likes'}
      </button>
      {show && (
        <div className="mt-1">
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
          {!loading && !error && users.length > 0 && (
            <span className="text-xs text-gray-700">
              {users.slice(0, 3).map(u => u.displayName).join(', ')}
              {users.length > 3 && ` +${users.length - 3} more`}
            </span>
          )}
          {!loading && !error && users.length === 0 && (
            <span className="text-xs text-gray-400">No likes yet</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LikesList; 