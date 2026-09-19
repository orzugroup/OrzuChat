export type ProfilePrivacy = {
  show_username: boolean;
  show_avatar: boolean;
  show_banner: boolean;
  show_phone: boolean;
  show_last_seen: boolean;
  show_read_receipts: boolean;
  block_screen_capture: boolean;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url?: string | null;
  phone: string | null;
  last_seen_at: string | null;
} & Partial<ProfilePrivacy>;

export type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  phone: string | null;
  last_seen_at: string | null;
  show_read_receipts?: boolean;
};

export type UserContact = {
  contact_id: string;
  device_name: string | null;
  created_at: string;
  profiles: Profile | null;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  title: string | null;
  created_by: string;
  last_message_at: string | null;
  created_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  profiles: Profile;
};

export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'file' | 'system';

export type Attachment = {
  id: string;
  message_id: string;
  bucket: string;
  path: string;
  mime: string;
  size_bytes: number | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments: Attachment[];
  /** Client-side only: true when `body` was decrypted from an E2E payload. */
  encrypted?: boolean;
  /** Client-side only: payload could not be decrypted with the current device key. */
  undecryptable?: boolean;
};

export type CallKind = 'audio' | 'video';
export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | 'busy';

export type Call = {
  id: string;
  conversation_id: string | null;
  caller_id: string;
  callee_id: string;
  kind: CallKind;
  status: CallStatus;
  room_name: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type CallSession = {
  call: Call;
  token: string;
  livekit_url: string;
};
