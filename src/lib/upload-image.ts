import { client } from "@/lib/orpc";

type Kind = "avatar" | "gallery";

function makeFileId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

/** Uploads one image straight to storage and returns its new fileId. Same
 *  flow as AvatarBannerUpload: presign, PUT, finalize (builds the variants). */
export async function uploadImage(kind: Kind, file: File): Promise<string> {
	const fileId = makeFileId();
	const contentType = file.type || "application/octet-stream";
	const { uploadUrl } = await client.storage.uploadInit({
		kind,
		fileId,
		contentType,
	});
	const put = await fetch(uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": contentType },
		body: file,
	});
	if (!put.ok) throw new Error(`upload failed: ${put.status}`);
	await client.storage.finalize({ kind, fileId });
	return fileId;
}
