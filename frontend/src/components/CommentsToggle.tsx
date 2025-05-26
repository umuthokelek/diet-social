import React, { useState } from 'react';
import CommentSection from './CommentSection';

interface CommentsToggleProps {
  postId: string;
}

const CommentsToggle: React.FC<CommentsToggleProps> = ({ postId }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mt-2">
      <button
        className="text-xs text-blue-600 hover:underline focus:outline-none"
        onClick={() => setShow(v => !v)}
      >
        {show ? 'Hide Comments' : 'Show Comments'}
      </button>
      {show && (
        <div className="mt-2">
          <CommentSection postId={postId} />
        </div>
      )}
    </div>
  );
};

export default CommentsToggle; 