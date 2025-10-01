import { create } from 'zustand';
import type { Post } from '../types';

interface PostState {
  posts: Post[];
  selectedPost: Post | null;
  loading: boolean;
  hasMore: boolean;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  setSelectedPost: (post: Post | null) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  selectedPost: null,
  loading: false,
  hasMore: true,

  setPosts: (posts) => set({ posts }),

  addPost: (post) => set((state) => ({ 
    posts: [post, ...state.posts] 
  })),

  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId ? { ...post, ...updates } : post
    ),
  })),

  removePost: (postId) => set((state) => ({
    posts: state.posts.filter((post) => post.id !== postId),
  })),

  setSelectedPost: (post) => set({ selectedPost: post }),

  setLoading: (loading) => set({ loading }),

  setHasMore: (hasMore) => set({ hasMore }),
}));