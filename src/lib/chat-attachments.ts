import { client } from "@/lib/orpc";

function makeFileId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export type UploadedAttachment = {
	key: string;
	mimeType: string;
	name: string;
	size: number;
};

// Upload one file as a chat attachment scoped to `scopeId` (conversationId or
// channelId). Returns the stored key + metadata for rendering.
export async function uploadAttachment(
	scopeId: string,
	file: File,
): Promise<UploadedAttachment> {
	const fileId = makeFileId();
	const contentType = file.type || "application/octet-stream";
	const { uploadUrl, key } = await client.storage.attachmentUploadInit({
		scopeId,
		fileId,
		contentType,
	});
	const put = await fetch(uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": contentType },
		body: file,
	});
	if (!put.ok) throw new Error(`Upload failed (${put.status})`);
	const res = await client.storage.attachmentFinalize({ scopeId, fileId });
	return {
		key,
		mimeType: res.mimeType ?? contentType,
		name: file.name,
		size: file.size,
	};
}
