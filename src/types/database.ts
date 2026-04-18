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
          role: 'admin' | 'manager' | 'viewer' | 'artist' | 'agent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'admin' | 'manager' | 'viewer' | 'artist' | 'agent'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'viewer' | 'artist' | 'agent'
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          talent_buyer: string | null
          booking_email: string | null
          typical_genres: string | null
          sell_radius: string | null
          other_shows: Json | null
          intel: Json | null
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
          talent_buyer?: string | null
          booking_email?: string | null
          typical_genres?: string | null
          sell_radius?: string | null
          other_shows?: Json | null
          intel?: Json | null
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
          talent_buyer?: string | null
          booking_email?: string | null
          typical_genres?: string | null
          sell_radius?: string | null
          other_shows?: Json | null
          intel?: Json | null
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
      contacts: {
        Row: {
          id: string
          name: string
          company: string | null
          email: string | null
          phone: string | null
          city: string | null
          state: string | null
          region: string | null
          market_type: 'club' | 'festival' | 'bar' | 'venue' | 'agency' | 'other' | null
          pitch_status: 'not_contacted' | 'drafted' | 'sent' | 'responded' | 'booked' | null
          notes: string | null
          last_pitched_at: string | null
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
          state?: string | null
          region?: string | null
          market_type?: 'club' | 'festival' | 'bar' | 'venue' | 'agency' | 'other' | null
          pitch_status?: 'not_contacted' | 'drafted' | 'sent' | 'responded' | 'booked' | null
          notes?: string | null
          last_pitched_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          city?: string | null
          state?: string | null
          region?: string | null
          market_type?: 'club' | 'festival' | 'bar' | 'venue' | 'agency' | 'other' | null
          pitch_status?: 'not_contacted' | 'drafted' | 'sent' | 'responded' | 'booked' | null
          notes?: string | null
          last_pitched_at?: string | null
        }
        Relationships: []
      }
      catalog: {
        Row: {
          id: string
          artist_id: string
          title: string
          type: string
          bucket: 'released_full' | 'soundcloud_only' | 'unreleased_collab' | 'wip' | 'vault'
          release_date: string | null
          isrc: string | null
          upc: string | null
          distributor: string | null
          streams: number | null
          spotify_track_id: string | null
          notes: string | null
          artwork_url: string | null
          streaming_url: string | null
          collaborators: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          type?: string
          bucket?: 'released_full' | 'soundcloud_only' | 'unreleased_collab' | 'wip' | 'vault'
          release_date?: string | null
          isrc?: string | null
          upc?: string | null
          distributor?: string | null
          streams?: number | null
          spotify_track_id?: string | null
          notes?: string | null
          artwork_url?: string | null
          streaming_url?: string | null
          collaborators?: string | null
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          type?: string
          bucket?: 'released_full' | 'soundcloud_only' | 'unreleased_collab' | 'wip' | 'vault'
          release_date?: string | null
          isrc?: string | null
          upc?: string | null
          distributor?: string | null
          streams?: number | null
          spotify_track_id?: string | null
          notes?: string | null
          artwork_url?: string | null
          streaming_url?: string | null
          collaborators?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          artist_id: string | null
          assigned_to: string | null
          title: string
          description: string | null
          type: 'show' | 'release' | 'promo' | 'general'
          status: 'todo' | 'in_progress' | 'done'
          due_date: string | null
          deal_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id?: string | null
          assigned_to?: string | null
          title: string
          description?: string | null
          type?: 'show' | 'release' | 'promo' | 'general'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          deal_id?: string | null
          created_by: string
        }
        Update: {
          id?: string
          artist_id?: string | null
          assigned_to?: string | null
          title?: string
          description?: string | null
          type?: 'show' | 'release' | 'promo' | 'general'
          status?: 'todo' | 'in_progress' | 'done'
          due_date?: string | null
          deal_id?: string | null
          created_by?: string
        }
        Relationships: []
      }
      artist_members: {
        Row: {
          id: string
          artist_id: string
          user_id: string | null
          email: string
          name: string
          role: 'admin' | 'artist' | 'agent'
          created_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          user_id?: string | null
          email: string
          name: string
          role: 'admin' | 'artist' | 'agent'
        }
        Update: {
          id?: string
          artist_id?: string
          user_id?: string | null
          email?: string
          name?: string
          role?: 'admin' | 'artist' | 'agent'
        }
        Relationships: []
      }
      deal_threads: {
        Row: {
          id: string
          deal_id: string
          type: 'offer' | 'marketing' | 'advance' | 'contract'
          subject: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          type: 'offer' | 'marketing' | 'advance' | 'contract'
          subject?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          type?: 'offer' | 'marketing' | 'advance' | 'contract'
          subject?: string | null
        }
        Relationships: []
      }
      deal_messages: {
        Row: {
          id: string
          thread_id: string
          sender_name: string
          sender_email: string | null
          direction: 'inbound' | 'outbound' | 'internal'
          body: string
          gmail_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_name: string
          sender_email?: string | null
          direction: 'inbound' | 'outbound' | 'internal'
          body: string
          gmail_message_id?: string | null
        }
        Update: {
          id?: string
          thread_id?: string
          sender_name?: string
          sender_email?: string | null
          direction?: 'inbound' | 'outbound' | 'internal'
          body?: string
          gmail_message_id?: string | null
        }
        Relationships: []
      }
      deal_attachments: {
        Row: {
          id: string
          deal_id: string
          thread_id: string | null
          filename: string
          mime_type: string
          storage_path: string
          parsed_data: Json | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          thread_id?: string | null
          filename: string
          mime_type: string
          storage_path: string
          parsed_data?: Json | null
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          thread_id?: string | null
          filename?: string
          mime_type?: string
          storage_path?: string
          parsed_data?: Json | null
          uploaded_by?: string | null
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
      user_role: 'admin' | 'manager' | 'viewer' | 'artist' | 'agent'
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
export type CatalogTrack = Database['public']['Tables']['catalog']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type ArtistMember = Database['public']['Tables']['artist_members']['Row']
export type DealThread = Database['public']['Tables']['deal_threads']['Row']
export type DealMessage = Database['public']['Tables']['deal_messages']['Row']
export type DealAttachment = Database['public']['Tables']['deal_attachments']['Row']
