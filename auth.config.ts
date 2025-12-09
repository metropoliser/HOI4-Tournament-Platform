import type { NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import clickhouse from './app/lib/clickhouse';
import { randomUUID } from 'crypto';

export const authConfig = {
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if Discord user exists in users table
      if (account?.provider === 'discord' && profile) {
        const discordId = profile.id as string;
        const discordUsername = profile.username as string;
        const discordAvatar = profile.image_url as string;

        try {
          // Check if user with this Discord ID exists in the users table
          const existingUserResult = await clickhouse.query({
            query: 'SELECT id, uuid, username, role FROM users WHERE discord_id = {discordId:String} AND discord_id != \'\'',
            query_params: { discordId },
            format: 'JSONEachRow',
          });
          const existingUsers = await existingUserResult.json<any>();

          if (existingUsers.length > 0) {
            // User exists with this Discord ID - allow login
            const existingUser = existingUsers[0];

            // Update Discord username and avatar in case they changed (but keep username independent)
            await clickhouse.command({
              query: `ALTER TABLE users UPDATE
                      discord_username = {discordUsername:String},
                      discord_avatar = {discordAvatar:String},
                      last_active = now()
                      WHERE uuid = {uuid:String}`,
              query_params: {
                discordUsername,
                discordAvatar,
                uuid: existingUser.uuid,
              },
            });

            // Log the sign-in activity
            await clickhouse.command({
              query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
                      VALUES ({id:String}, {userUuid:String}, 'sign_in', {details:String}, '')`,
              query_params: {
                id: randomUUID(),
                userUuid: existingUser.uuid,
                details: `User ${existingUser.username} signed in via Discord`,
              },
            });

            return true; // Allow login
          } else {
            // Check if this is the very first user trying to sign in (bootstrap admin)
            const userCountResult = await clickhouse.query({
              query: 'SELECT count() as count FROM users',
              format: 'JSONEachRow',
            });
            const userCount = await userCountResult.json<any>();
            const isFirstUser = userCount[0].count === 0;

            if (isFirstUser) {
              // Create first admin user automatically
              const userUuid = randomUUID();

              await clickhouse.command({
                query: `INSERT INTO users (id, uuid, username, discord_id, discord_username, discord_avatar, role, whitelisted)
                        VALUES ({id:String}, {uuid:String}, {username:String}, {discordId:String}, {discordUsername:String}, {discordAvatar:String}, 'admin', 1)`,
                query_params: {
                  id: randomUUID(),
                  uuid: userUuid,
                  username: discordUsername,
                  discordId,
                  discordUsername,
                  discordAvatar,
                },
              });

              // Log the sign-in activity
              await clickhouse.command({
                query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
                        VALUES ({id:String}, {userUuid:String}, 'sign_in', {details:String}, '')`,
                query_params: {
                  id: randomUUID(),
                  userUuid: userUuid,
                  details: `First user ${discordUsername} created as admin`,
                },
              });

              return true; // Allow first user
            }

            // Discord ID not found in users table - deny login
            console.log(`Discord user ${discordId} (${discordUsername}) not found in users table - login denied`);
            return false;
          }
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        const discordId = profile.id as string;
        token.discordId = discordId;
        token.discordUsername = profile.username as string;
        token.discordAvatar = profile.image_url as string;

        try {
          // Fetch uuid, role, and username from database
          const result = await clickhouse.query({
            query: 'SELECT uuid, role, username FROM users WHERE discord_id = {discordId:String}',
            query_params: { discordId },
            format: 'JSONEachRow',
          });
          const users = await result.json<any>();

          if (users.length > 0) {
            token.uuid = users[0].uuid;
            token.role = users[0].role;
            token.username = users[0].username;
          } else {
            token.role = 'player';
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          token.role = 'player';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uuid as string; // Use uuid as the public user id
        session.user.name = token.username as string || token.discordUsername as string; // Use username from DB, fallback to Discord username
        session.user.discordUsername = token.discordUsername as string;
        session.user.discordAvatar = token.discordAvatar as string;
        session.user.role = token.role as 'admin' | 'matchmaker' | 'player' | 'spectator';
        // Keep discordId internal only (not exposed to frontend)
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
} satisfies NextAuthConfig;
