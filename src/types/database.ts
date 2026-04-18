export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'manager' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'admin' | 'manager' | 'viewer'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'viewer'
        }
        Relationships: []
      }
      artists: {
        Row: {
          id: string
          name: string
          stage_name: string | null
          email: string | null
          phone: string | null
          genre: string | null
          spotify_artist_id: string | null
          spotify_access_token: string | null
          spotify_refresh_token: string | null
          spotify_token_expires_at: string | null
          manager_id: string
          status: 'active' | 'inactive' | 'pending'
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          stage_name?: string | null
          email?: string | null
          phone?: string | null
          genre?: string | null
          spotify_artist_id?: string | null
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          spotify_token_expires_at?: string | null
          manager_id: string
          status?: 'active' | 'inactive' | 'pending'
          bio?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          stage_name?: string | null
          email?: string | null
          phone?: string | null
          genre?: string | null
          spotify_artist_id?: string | null
          spotify_access_token?: string | null
          spotify_refresh_token?: string | null
          spotify_token_expires_at?: string | null
          manager_id?: string
          status?: 'active' | 'inactive' | 'pending'
          bio?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: string
          artist_id: string
          venue_id: string | null
          promoter_id: string | null
          title: string
          show_date: string | null
          offer_amount: number | null
          deal_points: Json | null
          status: 'inquiry' | 'offer' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled'
          source_email_id: string | null
          gmail_draft_id: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          venue_id?: string | null
          promoter_id?: string | null
          title: string
          show_date?: string | null
          offer_amount?: number | null
          deal_points?: Json | null
          status?: 'inquiry' | 'offer' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled'
          source_email_id?: string | null
          gmail_draft_id?: string | null
          notes?: string | null
          created_by: string
        }
        Update: {
          id?: string
          artist_id?: string
          venue_id?: string | null
          promoter_id?: string | null
          title?: string
          show_date?: string | null
          offer_amount?: number | null
          deal_points?: Json | null
          status?: 'inquiry' | 'offer' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled'
          source_email_id?: string | null
          gmail_draft_id?: string | null
          notes?: string | null
          created_by?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          id: string
          name: string
          city: string | null
          state: string | null
          country: string
          capacity: number | null
          contact_name: string | null
          contact_email: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          state?: string | null
          country?: string
          capacity?: number | null
          contact_name?: string | null
          contact_email?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          state?: string | null
          country?: string
          capacity?: number | null
          contact_name?: string | null
          contact_email?: string | null
          website?: string | null
        }
        Relationships: []
      }
      promoters: {
        Row: {
          id: string
          name: string
          company: string | null
          email: string | null
          phone: string | null
          city: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          city?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          city?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          id: string
          user_id: string
          email: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          deal_id: string
          artist_id: string
          title: string
          status: 'draft' | 'sent' | 'signed' | 'voided'
          content: string | null
          signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          artist_id: string
          title: string
          status?: 'draft' | 'sent' | 'signed' | 'voided'
          content?: string | null
          signed_at?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          artist_id?: string
          title?: string
          status?: 'draft' | 'sent' | 'signed' | 'voided'
          content?: string | null
          signed_at?: string | null
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          id: string
          user_id: string
          artist_id: string | null
          messages: Json
          context: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artist_id?: string | null
          messages: Json
          context?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          artist_id?: string | null
          messages?: Json
          context?: Json | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'manager' | 'viewer'
      deal_status: 'inquiry' | 'offer' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled'
      artist_status: 'active' | 'inactive' | 'pending'
      contract_status: 'draft' | 'sent' | 'signed' | 'voided'
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Artist = Database['public']['Tables']['artists']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type Venue = Database['public']['Tables']['venues']['Row']
export type Promoter = Database['public']['Tables']['promoters']['Row']
export type GmailConnection = Database['public']['Tables']['gmail_connections']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type AgentConversation = Database['public']['Tables']['agent_conversations']['Row']
