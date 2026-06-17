export type OutgoingMessage = {
	tempId: string;
	body: string;
	attachments: string[];
	createdAt: number;
	status: "sending" | "failed";
};

export function addOutgoing(
	list: OutgoingMessage[],
	msg: OutgoingMessage,
): OutgoingMessage[] {
	return [...list, msg];
}

export function setOutgoingStatus(
	list: OutgoingMessage[],
	tempId: string,
	status: OutgoingMessage["status"],
): OutgoingMessage[] {
	return list.map((m) => (m.tempId === tempId ? { ...m, status } : m));
}

export function removeOutgoing(
	list: OutgoingMessage[],
	tempId: string,
): OutgoingMessage[] {
	return list.filter((m) => m.tempId !== tempId);
}
