import { Global, Module } from '@nestjs/common';
import { google } from 'googleapis';

export const GoogleOAuth2Client = 'GOOGLE_OAUTH2_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: GoogleOAuth2Client,
      useFactory: async () => {
        const clientId = process.env.YT_CLIENT_ID!;
        const clientSecret = process.env.YT_CLIENT_SECRET!;
        const refreshToken = process.env.YT_REFRESH_TOKEN!;
        const oauth2Client = new google.auth.OAuth2({ clientId, clientSecret, redirectUri: 'urn:ietf:wg:oauth:2.0:oob' });
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        return oauth2Client;
      },
    },
  ],
  exports: [GoogleOAuth2Client],
})
export class GoogleModule {}
