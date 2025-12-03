export type UserRole = 'participant' | 'judge' | 'admin'

export interface Profile {
  id: string
  username: string
  avatar_url?: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Contest {
  id: string
  name: string
  description: string
  upload_start_at: string
  upload_end_at: string
  vote_start_at: string
  vote_end_at: string
  result_publish_at?: string
  max_photos_per_user: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  order_idx: number
}

export interface Photo {
  id: string
  contest_id: string
  user_id: string
  title: string
  description: string
  author_name: string
  image_url: string
  thumbnail_url?: string
  file_size: number
  width?: number
  height?: number
  status: 'public' | 'hidden' | 'blocked'
  created_at: string
  updated_at: string
  is_deleted: boolean
  
  // 关联数据
  profiles?: Profile
  categories?: Category[]
  like_count?: number
  comment_count?: number
  avg_score?: number
}

export interface Like {
  id: number
  photo_id: string
  user_id: string
  created_at: string
  ip_address?: string
}

export interface Comment {
  id: number
  photo_id: string
  user_id: string
  content: string
  created_at: string
  is_deleted: boolean
  
  // 关联数据
  profiles?: Profile
}

export interface JudgeScore {
  id: number
  contest_id: string
  photo_id: string
  judge_id: string
  score: number
  comment?: string
  created_at: string
}
