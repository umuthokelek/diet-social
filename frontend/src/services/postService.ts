import axios from 'axios';

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userDisplayName: string;
  likeCount: number;
  commentCount: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userDisplayName: string;
}

export interface CreatePostRequest {
  content: string;
}

export async function getAllPosts(): Promise<Post[]> {
  const token = localStorage.getItem('token');
  const response = await axios.get<Post[]>('http://localhost:5177/api/Post', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function getFollowingPosts(): Promise<Post[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }
  const response = await axios.get<Post[]>('http://localhost:5177/api/Post/following', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function createPost(post: CreatePostRequest): Promise<Post> {
  const token = localStorage.getItem('token');
  const response = await axios.post<Post>('http://localhost:5177/api/Post', post, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}

export async function deletePost(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  await axios.delete(`http://localhost:5177/api/Post/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
} 