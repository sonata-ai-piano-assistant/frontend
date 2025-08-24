export interface IUser {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  signupDate: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  oauthAccounts: any[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export type MidiNote = { note: number; velocity: number; time: number; noteName?: string };
export interface ILesson {
  title: string;
  description?: string;
}

export interface IPerformance {
  _id?: string;
  startedAt: Date;
  endedAt?: Date;
  section: "intro" | "verse" | "chorus" | "bridge" | "outro";
  midiNotes: MidiNote[];
  user: string; // ObjectId as string
  session: string; // ObjectId as string
  feedback?: {
    score?: number;
    comments?: string;
    details?: any; // for any extra analysis data
  };
}

export interface IReference {
  _id: string;
  name: string;
  sections: {
    intro: MidiNote[];
    verse: MidiNote[];
    chorus: MidiNote[];
    bridge: MidiNote[];
    outro: MidiNote[];
  };
}

export interface IThreadMessage {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string | null;
  thread_id: string;
  run_id: string | null;
  role: string;
  content: {
    type: string;
    text: {
      value: string;
      annotations: any[];
    };
  }[];
  attachments: any[];
  metadata: Record<string, any>;
}

export interface ISubscription {
  _id: string;
  stripeSubscriptionId: string;
  __v: number;
  createdAt: string;
  plan: string;
  status: string;
  user: string;
  currentPeriodEnd: string;
}

export interface ISession {
  _id: string;
  user: string; // ObjectId as string
  reference: string; // ObjectId as string
  startedAt: Date;
  endedAt?: Date;
  status: "active" | "ended" | "cancelled";
}