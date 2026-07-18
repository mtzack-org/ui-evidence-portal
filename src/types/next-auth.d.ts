import "next-auth";

declare module "next-auth" {
  interface User {
    login: string;
  }

  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    login?: string;
  }
}
