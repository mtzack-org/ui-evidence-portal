import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

function allowedUsers() {
  return new Set(
    (process.env.ALLOWED_GITHUB_USERS ?? "")
      .split(",")
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function isOrganizationMember(accessToken: string, login: string) {
  if (allowedUsers().has(login.toLowerCase())) return true;
  const organization = process.env.GITHUB_ORG ?? "mtzack-org";
  const response = await fetch(
    `https://api.github.com/user/memberships/orgs/${encodeURIComponent(organization)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return false;
  const membership = (await response.json()) as { state?: string };
  return membership.state === "active";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "development-only-ui-evidence-secret"
      : undefined),
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    GitHub({
      authorization: { params: { scope: "read:user user:email read:org" } },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      const login = typeof profile?.login === "string" ? profile.login : "";
      return Boolean(
        account?.access_token &&
          login &&
          (await isOrganizationMember(account.access_token, login)),
      );
    },
    jwt({ token, profile }) {
      if (typeof profile?.login === "string") token.login = profile.login;
      return token;
    },
    session({ session, token }) {
      session.user.login = typeof token.login === "string" ? token.login : "";
      return session;
    },
  },
});
