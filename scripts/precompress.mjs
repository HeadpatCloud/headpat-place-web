import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const root = join(import.meta.dirname, "..", "dist", "client");
const compressible = /\.(js|mjs|css|html|json|svg|xml|txt|webmanifest|map)$/;

function walk(dir) {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

let before = 0;
let after = 0;
for (const file of walk(root)) {
	if (!compressible.test(file) || file.endsWith(".br") || file.endsWith(".gz")) continue;
	const buf = readFileSync(file);
	if (buf.length < 1024) continue;
	const br = brotliCompressSync(buf, {
		params: {
			[constants.BROTLI_PARAM_QUALITY]: 11,
			[constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
		},
	});
	writeFileSync(`${file}.br`, br);
	writeFileSync(`${file}.gz`, gzipSync(buf, { level: 9 }));
	before += buf.length;
	after += br.length;
}
console.log(`precompressed ${(before / 1024) | 0} KB -> ${(after / 1024) | 0} KB (br)`);
