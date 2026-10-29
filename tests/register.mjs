// Lets Node run the TypeScript sources directly: registers the "@/..." path alias.
import { register } from 'node:module';

register('./loader.mjs', import.meta.url);
