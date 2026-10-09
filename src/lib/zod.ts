import { z } from "zod";

// The CSP forbids eval, so skip zod's JIT parser instead of letting it probe
// for it and trip a violation on every page that parses a schema.
z.config({ jitless: true });

export { z };
