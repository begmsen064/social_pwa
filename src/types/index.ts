export interface User {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  total_points: number;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string;
  location?: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  price: number; // Premium content fiyatı (0 = ücretsiz, 10/20/30/40 = ücretli)
  created_at: string;
  updated_at: string;
  user?: User;
  media?: PostMedia[];
  is_liked?: boolean;
  is_disliked?: boolean;
  is_purchased?: boolean; // Kullanıcı bu premium içeriği satın aldı mı?
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  order_index: number;
  thumbnail_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  type: 'like' | 'dislike';
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'purchase';
  post_id?: string;
  comment_id?: string;
  is_read: boolean;
  created_at: string;
  actor?: User;
  post?: Post;
}

export interface UserStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export interface PointAction {
  id: string;
  user_id: string;
  points: number;
  action_type: 'post' | 'like' | 'comment' | 'follower' | 'bonus';
  reference_id?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user: User;
  rank: number;
  total_points: number;
}

export interface PostPurchase {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  created_at: string;
}
