/**
 * Google, Facebook and Instagram sign-in / connect. Each provider exchanges an authorization
 * code for a profile. Without app credentials, development uses MockOAuth.
 */
export type OAuthKind = 'google' | 'fb' | 'ig' | 'tiktok';

export interface OAuthProfile {
  externalId: string;
  name: string;
  email: string | null;
  /** The provider has confirmed the person controls this address: only then may it match an account. */
  emailVerified?: boolean;
  photoUrl?: string | null;
  accessToken: string;
}

export interface OAuthProvider {
  authorizeUrl(state: string, redirectUri: string): string;
  exchange(code: string, redirectUri: string): Promise<OAuthProfile>;
  /** External ids of friends who also use the app, where the provider exposes that. */
  friendIds(accessToken: string): Promise<string[]>;
}

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`oauth ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

/**
 * Sign in with Google (OpenID Connect, authorization code flow). The code is exchanged
 * server-to-server over TLS, so the profile comes straight from Google's userinfo endpoint.
 */
export class GoogleOAuth implements OAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const p = new URLSearchParams({
      client_id: this.clientId, redirect_uri: redirectUri, response_type: 'code', state,
      scope: 'openid email profile', prompt: 'select_account', access_type: 'online', include_granted_scopes: 'true',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }

  async exchange(code: string, redirectUri: string): Promise<OAuthProfile> {
    const body = new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code });
    const token = await getJson('https://oauth2.googleapis.com/token', { method: 'POST', body });
    const me = await getJson('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token}` } });
    return {
      externalId: String(me.sub), name: me.name ?? me.given_name ?? '', email: me.email ?? null,
      emailVerified: me.email_verified === true, photoUrl: me.picture ?? null, accessToken: token.access_token,
    };
  }

  /** Google exposes no friend graph. */
  async friendIds(): Promise<string[]> {
    return [];
  }
}

export class FacebookOAuth implements OAuthProvider {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly graph = 'https://graph.facebook.com/v21.0';

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const p = new URLSearchParams({ client_id: this.appId, redirect_uri: redirectUri, state, scope: 'public_profile,email,user_friends' });
    return `https://www.facebook.com/v21.0/dialog/oauth?${p}`;
  }

  async exchange(code: string, redirectUri: string): Promise<OAuthProfile> {
    const p = new URLSearchParams({ client_id: this.appId, client_secret: this.appSecret, redirect_uri: redirectUri, code });
    const token = await getJson(`${this.graph}/oauth/access_token?${p}`);
    const me = await getJson(`${this.graph}/me?fields=id,name,email&access_token=${encodeURIComponent(token.access_token)}`);
    return { externalId: String(me.id), name: me.name ?? '', email: me.email ?? null, accessToken: token.access_token };
  }

  async friendIds(accessToken: string): Promise<string[]> {
    const ids: string[] = [];
    let url: string | null = `${this.graph}/me/friends?limit=500&access_token=${encodeURIComponent(accessToken)}`;
    while (url && ids.length < 5000) {
      const page: any = await getJson(url);
      for (const f of page.data ?? []) ids.push(String(f.id));
      url = page.paging?.next ?? null;
    }
    return ids;
  }
}

export class InstagramOAuth implements OAuthProvider {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const p = new URLSearchParams({ client_id: this.appId, redirect_uri: redirectUri, state, response_type: 'code', scope: 'instagram_business_basic' });
    return `https://www.instagram.com/oauth/authorize?${p}`;
  }

  async exchange(code: string, redirectUri: string): Promise<OAuthProfile> {
    const body = new URLSearchParams({ client_id: this.appId, client_secret: this.appSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code });
    const token = await getJson('https://api.instagram.com/oauth/access_token', { method: 'POST', body });
    const me = await getJson(`https://graph.instagram.com/me?fields=user_id,username&access_token=${encodeURIComponent(token.access_token)}`);
    return { externalId: String(me.user_id ?? token.user_id), name: me.username ?? '', email: null, accessToken: token.access_token };
  }

  /** Instagram does not expose a friend graph. */
  async friendIds(): Promise<string[]> {
    return [];
  }
}

/**
 * Development stand-in. Authorize redirects straight back with a code of the form
 * `mock:<externalId>:<name>`; friends are whatever `mock:` ids were passed as the token.
 */
/**
 * TikTok's Login Kit (phase 17): an authorization code, a token, then the person's open id, name
 * and picture. TikTok gives no email, so an account made this way is found by its open id only.
 */
export class TikTokOAuth implements OAuthProvider {
  private readonly clientKey: string;
  private readonly clientSecret: string;

  constructor(clientKey: string, clientSecret: string) {
    this.clientKey = clientKey;
    this.clientSecret = clientSecret;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const p = new URLSearchParams({ client_key: this.clientKey, scope: 'user.info.basic', response_type: 'code', redirect_uri: redirectUri, state });
    return `https://www.tiktok.com/v2/auth/authorize/?${p}`;
  }

  async exchange(code: string, redirectUri: string): Promise<OAuthProfile> {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key: this.clientKey, client_secret: this.clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const token = await res.json().catch(() => ({})) as { access_token?: string; open_id?: string; error?: string; error_description?: string };
    if (!res.ok || !token.access_token) throw new Error(`tiktok token ${res.status}${token.error ? ` (${token.error}: ${token.error_description ?? ''})` : ''}`);
    const me = await getJson('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', { headers: { authorization: `Bearer ${token.access_token}` } }) as { data?: { user?: { open_id?: string; display_name?: string; avatar_url?: string } } };
    const user = me.data?.user ?? {};
    const externalId = user.open_id ?? token.open_id;
    if (!externalId) throw new Error('tiktok: no open id');
    return { externalId: String(externalId), name: user.display_name ?? '', email: null, photoUrl: user.avatar_url ?? null, accessToken: token.access_token };
  }

  /** TikTok exposes no friend graph. */
  async friendIds(): Promise<string[]> {
    return [];
  }
}

export class MockOAuth implements OAuthProvider {
  private readonly provider: OAuthKind;

  constructor(provider: OAuthKind) {
    this.provider = provider;
  }

  authorizeUrl(state: string, redirectUri: string) {
    const u = new URL(redirectUri);
    u.searchParams.set('state', state);
    u.searchParams.set('code', `mock:${this.provider}-demo:Minh Anh`);
    return u.toString();
  }

  async exchange(code: string): Promise<OAuthProfile> {
    const m = /^mock:([^:]+):(.*)$/.exec(code);
    if (!m) throw new Error('invalid mock code');
    // A Google account always comes with a confirmed Gmail address.
    const email = this.provider === 'google' ? `${m[1].replace(/[^a-z0-9.]/gi, '.')}@gmail.com` : null;
    return { externalId: m[1], name: m[2] || 'Minh Anh', email, emailVerified: !!email, photoUrl: null, accessToken: `mock-token:${m[1]}` };
  }

  async friendIds(): Promise<string[]> {
    return [];
  }
}
