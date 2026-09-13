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
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          created_by: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_url?: string | null;
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
    };
    Views: Record<never, never>;
    Functions: {
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
