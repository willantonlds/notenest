export const sidCookie = (response: Response) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith('notenest.sid='))!
    .split(';')[0];

export const sessionId = (cookie: string) =>
  decodeURIComponent(cookie.split('=')[1]).split('.')[0].replace(/^s:/, '');

export const cookieHeader = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
