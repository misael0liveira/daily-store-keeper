// Supabase generated types are currently maintained by the project.
// Client activation uses the runtime table query in AuthGate.

export type ClientCodeRow = {
  id: string;
  code: string;
  device_id: string | null;
  active: boolean;
  activated_at: string | null;
};
