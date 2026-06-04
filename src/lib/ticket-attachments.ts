import { client } from "@/lib/orpc";

export const TICKET_ATTACH_MIME = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"application/pdf",
	"text/plain",
] as const;

export const TICKET_ATTACH_ACCEPT = TICKET_ATTACH_MIME.join(",");
export const MAX_TICKET_ATTACHMENTS = 6;

export function isAllowedTicketFile(file: File): boolean {
	return (TICKET_ATTACH_MIME as readonly string[]).includes(file.type);
}

function makeFileId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export type UploadedTicketAttachment = {
	key: string;
	mimeType: string;
	name: string;
	size: number;
};

export async function uploadTicketAttachment(
	ticketId: string,
	file: File,
): Promise<UploadedTicketAttachment> {
	const fileId = makeFileId();
	const contentType = file.type || "application/octet-stream";
	const { uploadUrl, key } = await client.ticket.attachmentInit({
		ticketId,
		fileId,
		contentType,
	});
	const put = await fetch(uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": contentType },
		body: file,
	});
	if (!put.ok) throw new Error(`Upload failed (${put.status})`);
	const res = await client.ticket.attachmentFinalize({ ticketId, fileId });
	return {
		key,
		mimeType: res.mimeType ?? contentType,
		name: file.name,
		size: file.size,
	};
}
