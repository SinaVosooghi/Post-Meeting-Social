declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXTAUTH_URL?: string;
    NEXTAUTH_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    LINKEDIN_CLIENT_ID?: string;
    LINKEDIN_CLIENT_SECRET?: string;
    RECALL_AI_API_KEY?: string;
    OPENAI_API_KEY?: string;
  }
}
