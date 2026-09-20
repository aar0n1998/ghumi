/**
 * Database types.
 *
 * CLAUDE.md asks for these to be generated rather than hand-written. Once the
 * Supabase CLI is installed and the project is linked, regenerate with:
 *
 *   npx supabase gen types typescript --linked > lib/database.types.ts
 *
 * Until then this file is maintained by hand alongside
 * `supabase/migrations/`. If you change the schema, change both.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GroupRole = 'owner' | 'member';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          /** `YYYY-MM-DD`. Null until the trip has dates. */
          starts_on: string | null;
          ends_on: string | null;
          location: string | null;
          /** Records intent only — see migration 0004. No policy reads it yet. */
          is_public: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          created_by: string;
          starts_on?: string | null;
          ends_on?: string | null;
          location?: string | null;
          is_public?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_url?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          location?: string | null;
          is_public?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
        };
        Update: {
          role?: GroupRole;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_availability: {
        Row: {
          group_id: string;
          user_id: string;
          starts_on: string;
          ends_on: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          starts_on: string;
          ends_on: string;
        };
        Update: {
          starts_on?: string;
          ends_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_availability_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_availability_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_group: {
        Args: {
          p_title: string;
          p_description?: string | null;
          p_cover_url?: string | null;
          p_starts_on?: string | null;
          p_ends_on?: string | null;
          p_location?: string | null;
          p_is_public?: boolean;
        };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          invite_code: string;
          starts_on: string | null;
          ends_on: string | null;
          location: string | null;
          is_public: boolean;
          created_at: string;
        }[];
      };
      get_group_preview: {
        Args: { p_invite_code: string };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          member_count: number;
          host_name: string | null;
          created_at: string;
          already_member: boolean;
          starts_on: string | null;
          ends_on: string | null;
          location: string | null;
        }[];
      };
      join_group: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      regenerate_invite_code: {
        Args: { p_group_id: string };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
