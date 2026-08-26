export type Country = string;
export type AvailabilityStatus = "available" | "in_process" | "placed" | "paused" | "stale";
export type ApplicationStage =
  | "received"
  | "screening"
  | "interview"
  | "offer"
  | "contract_signed"
  | "rejected";

export type StatBucket = { key: string; count: number };
export type DistrictBucket = StatBucket & { province: string | null };

export interface ApplicantStats {
  total_workers: number;
  total_applications: number;
  by_gender: StatBucket[];
  by_age_band: StatBucket[];
  by_province: StatBucket[];
  by_district: DistrictBucket[];
  by_availability: StatBucket[];
  by_country_interest: StatBucket[];
  by_stage: StatBucket[];
}

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          description: string;
          country_focus: Country[];
          established_year: number | null;
          contact_person: string | null;
          contact_phone: string | null;
          name_en: string | null;
          address: string | null;
          email: string | null;
          line_id: string | null;
          license_no: string | null;
          license_expiry: string | null;
          director: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          country_focus?: Country[];
          established_year?: number | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          name_en?: string | null;
          address?: string | null;
          email?: string | null;
          line_id?: string | null;
          license_no?: string | null;
          license_expiry?: string | null;
          director?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          member_id: string;
          title: string;
          country: Country;
          category: string;
          salary_range: string;
          description: string;
          requirements: string[];
          quota: number;
          posted_at: string;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          title: string;
          country: Country;
          category?: string;
          salary_range?: string;
          description?: string;
          requirements?: string[];
          quota?: number;
          status?: "open" | "closed";
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "jobs_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      worker_profiles: {
        Row: {
          id: string;
          name: string;
          gender: "male" | "female";
          phone: string;
          dob: string;
          perm_village: string;
          perm_district: string;
          perm_province: string;
          cur_village: string;
          cur_district: string;
          cur_province: string;
          preferred_countries: Country[];
          availability_status: AvailabilityStatus;
          status_updated_at: string;
          status_updated_by: string;
          last_confirmed_at: string;
          custom_fields: Record<string, string | number | boolean | string[]>;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          gender?: "male" | "female";
          phone: string;
          dob: string;
          perm_village?: string;
          perm_district?: string;
          perm_province?: string;
          cur_village?: string;
          cur_district?: string;
          cur_province?: string;
          preferred_countries?: Country[];
          custom_fields?: Record<string, string | number | boolean | string[]>;
        };
        Update: Partial<Database["public"]["Tables"]["worker_profiles"]["Insert"]> & {
          availability_status?: AvailabilityStatus;
          status_updated_at?: string;
          status_updated_by?: string;
          last_confirmed_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          worker_id: string;
          job_id: string;
          country: Country;
          stage: ApplicationStage;
          documents: Record<string, boolean>;
          submitted_at: string;
          interview_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          job_id: string;
          country: Country;
          documents?: Record<string, boolean>;
        };
        Update: {
          stage?: ApplicationStage;
          country?: Country;
          documents?: Record<string, boolean>;
          interview_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          id: string;
          worker_id: string;
          country: Country;
          company_name: string;
          position: string;
          start_date: string | null;
          contract_end_date: string | null;
          source: "jobdd" | "outside";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          country: Country;
          company_name?: string;
          position?: string;
          start_date?: string | null;
          contract_end_date?: string | null;
          source?: "jobdd" | "outside";
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["placements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "placements_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_logs: {
        Row: {
          id: string;
          worker_id: string;
          staff_name: string;
          contacted_at: string;
          channel: "phone" | "whatsapp" | "sms" | "in_person";
          result: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          staff_name: string;
          channel?: "phone" | "whatsapp" | "sms" | "in_person";
          result: string;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contact_logs_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      country_requirements: {
        Row: {
          id: string;
          country: Country;
          doc_type: string;
          required: boolean;
          note: string | null;
        };
        Insert: {
          id?: string;
          country: Country;
          doc_type: string;
          required?: boolean;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["country_requirements"]["Insert"]>;
        Relationships: [];
      };
      countries: {
        Row: {
          code: string;
          label: string;
          min_age: number;
          max_age: number;
          sort_order: number;
          route: string | null;
          note: string | null;
          accent_color: string;
          created_at: string;
        };
        Insert: {
          code: string;
          label: string;
          min_age?: number;
          max_age?: number;
          sort_order?: number;
          route?: string | null;
          note?: string | null;
          accent_color?: string;
        };
        Update: Partial<Database["public"]["Tables"]["countries"]["Insert"]>;
        Relationships: [];
      };
      job_categories: {
        Row: {
          id: string;
          country: string;
          name: string;
          code: string;
          is_open: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          country: string;
          name: string;
          code?: string;
          is_open?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["job_categories"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "job_categories_country_fkey";
            columns: ["country"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["code"];
          },
        ];
      };
      job_category_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          needs_review: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          needs_review?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["job_category_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "job_category_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "job_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          role: "staff" | "super_admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          email?: string | null;
          role?: "staff" | "super_admin";
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      member_users: {
        Row: {
          id: string;
          user_id: string;
          member_id: string;
          name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          member_id: string;
          name?: string;
          email?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["member_users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "member_users_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      application_events: {
        Row: {
          id: string;
          application_id: string;
          staff_id: string | null;
          staff_name: string;
          action: string;
          detail: string | null;
          actor_type: "staff" | "member";
          member_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          staff_id?: string | null;
          staff_name: string;
          action: string;
          detail?: string | null;
          actor_type?: "staff" | "member";
          member_id?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      form_fields: {
        Row: {
          id: string;
          field_key: string;
          label: string;
          field_type: "text" | "textarea" | "number" | "date" | "select" | "multiselect" | "checkbox";
          options: string[];
          required: boolean;
          sort_order: number;
          is_builtin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_key: string;
          label: string;
          field_type?: "text" | "textarea" | "number" | "date" | "select" | "multiselect" | "checkbox";
          options?: string[];
          required?: boolean;
          sort_order?: number;
          is_builtin?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["form_fields"]["Insert"]>;
        Relationships: [];
      };
      worker_files: {
        Row: {
          id: string;
          worker_id: string;
          doc_type: string;
          file_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          description: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          doc_type: string;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          description?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "worker_files_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "worker_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: boolean;
          org_name_lo: string;
          org_name_en: string;
          org_abbreviation: string;
          phone: string;
          hotline: string;
          facebook_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          interview_message_template: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          org_name_lo?: string;
          org_name_en?: string;
          org_abbreviation?: string;
          phone?: string;
          hotline?: string;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          youtube_url?: string | null;
          interview_message_template?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_status: {
        Args: { p_phone: string };
        Returns: {
          worker: Database["public"]["Tables"]["worker_profiles"]["Row"];
          applications: {
            id: string;
            stage: ApplicationStage;
            country: Country;
            submitted_at: string;
            job_title: string;
          }[];
        } | null;
      };
      set_my_status: {
        Args: { p_phone: string; p_status: AvailabilityStatus };
        Returns: boolean;
      };
      get_public_stats: {
        Args: Record<string, never>;
        Returns: { available_workers: number; open_jobs: number; members: number };
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_applicant_stats: {
        Args: Record<string, never>;
        Returns: ApplicantStats;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      add_staff_by_email: {
        Args: { p_email: string; p_name: string; p_role: string };
        Returns: undefined;
      };
      remove_staff: {
        Args: { p_staff_id: string };
        Returns: undefined;
      };
      is_member_user: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      my_member_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      add_member_user_by_email: {
        Args: { p_email: string; p_member_id: string; p_name: string };
        Returns: undefined;
      };
      remove_member_user: {
        Args: { p_id: string };
        Returns: undefined;
      };
    };
  };
}
