import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/_core/app';

let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createApp();
  }
  
  return app(req, res);
}
