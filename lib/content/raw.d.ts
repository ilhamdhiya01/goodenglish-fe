/* eslint-disable @typescript-eslint/no-explicit-any -- the content packs are untyped JS data (see raw/*.js); typing them is phase-2 work when content moves to the database. */
declare module "*.js" {
  const load: (w: Record<string, any>) => void;
  export default load;
}
