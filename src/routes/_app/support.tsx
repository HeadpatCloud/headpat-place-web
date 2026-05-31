import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/support")({
	component: SupportPage,
})

const categories = ["general", "account", "technical", "report", "other"] as const
const priorities = ["low", "normal", "high"] as const

function SupportPage() {
	const qc = useQueryClient()
	const [selected, setSelected] = useState<string | null>(null)

	const [subject, setSubject] = useState("")
	const [category, setCategory] = useState<(typeof categories)[number]>("general")
	const [priority, setPriority] = useState<(typeof priorities)[number]>("normal")
	const [body, setBody] = useState("")

	const tickets = useQuery(orpc.ticket.myList.queryOptions({ input: undefined }))

	const create = useMutation({
		mutationFn: () =>
			client.ticket.create({ subject: subject.trim(), body: body.trim(), category, priority }),
		onSuccess: (t) => {
			setSubject("")
			setCategory("general")
			setPriority("normal")
			setBody("")
			qc.invalidateQueries({ queryKey: orpc.ticket.myList.queryKey({ input: undefined }) })
			setSelected(t.id)
		},
		onError: (e: Error) => toast.error(e.message),
	})

	function submitTicket() {
		if (!subject.trim()) {
			toast.error("Enter a subject first.")
			return
		}
		if (!body.trim()) {
			toast.error("Enter a message first.")
			return
		}
		create.mutate()
	}

	return (
		<div className="space-y-6">
			<h3 className="text-2xl font-extrabold tracking-tight">Help &amp; support</h3>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Contact us</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div>
						<span className="font-medium">Discord</span>
						<p className="text-black/80 dark:text-white/80">
							For real-time help and chat with the community, join us on{" "}
							<a className="text-link hover:text-link/80" href="https://discord.gg/EaQTEKRg2A">
								https://discord.gg/EaQTEKRg2A
							</a>
							.
						</p>
					</div>
					<div>
						<span className="font-medium">E-Mail</span>
						<p className="text-black/80 dark:text-white/80">
							Drop us a line at{" "}
							<a className="text-link hover:text-link/80" href="mailto:help@headpat.place">
								help@headpat.place
							</a>
							.
						</p>
					</div>
					<div>
						<span className="font-medium">GitHub</span>
						<p className="text-black/80 dark:text-white/80">
							File bugs and contribute at{" "}
							<a className="text-link hover:text-link/80" href="https://github.com/headpatcloud">
								https://github.com/headpatcloud
							</a>
							.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Open a ticket</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						placeholder="Subject"
					/>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Select
							value={category}
							onValueChange={(v) => setCategory(v as (typeof categories)[number])}
						>
							<SelectTrigger className="sm:w-1/2">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={priority}
							onValueChange={(v) => setPriority(v as (typeof priorities)[number])}
						>
							<SelectTrigger className="sm:w-1/2">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								{priorities.map((p) => (
									<SelectItem key={p} value={p}>
										{p}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Describe your issue"
						className="min-h-[120px]"
					/>
					<Button
						disabled={create.isPending}
						onClick={submitTicket}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Submit ticket
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Your tickets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{tickets.isLoading ? (
						<p className="text-muted-foreground text-sm">Loading…</p>
					) : (tickets.data ?? []).length === 0 ? (
						<p className="text-muted-foreground text-sm">You have no tickets yet.</p>
					) : (
						(tickets.data ?? []).map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setSelected(t.id)}
								className={`card-hover flex w-full flex-col gap-1 rounded-lg border p-3 text-left ${
									selected === t.id ? "border-primary" : ""
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="font-semibold">{t.subject}</span>
									<Badge variant={t.status === "open" ? "default" : "secondary"}>
										{t.status}
									</Badge>
								</div>
								<span className="text-muted-foreground text-xs">
									{t.category} · {t.priority} · {new Date(t.createdAt).toLocaleDateString()}
								</span>
							</button>
						))
					)}
				</CardContent>
			</Card>

			{selected ? <Thread ticketId={selected} /> : null}
		</div>
	)
}

function Thread({ ticketId }: { ticketId: string }) {
	const qc = useQueryClient()
	const [reply, setReply] = useState("")
	const ticket = useQuery(orpc.ticket.get.queryOptions({ input: { ticketId } }))

	const send = useMutation({
		mutationFn: () => client.ticket.reply({ ticketId, body: reply.trim() }),
		onSuccess: () => {
			setReply("")
			qc.invalidateQueries({ queryKey: orpc.ticket.get.queryKey({ input: { ticketId } }) })
			qc.invalidateQueries({ queryKey: orpc.ticket.myList.queryKey({ input: undefined }) })
		},
		onError: (e: Error) => toast.error(e.message),
	})

	function submitReply() {
		if (!reply.trim()) {
			toast.error("Enter a reply first.")
			return
		}
		send.mutate()
	}

	if (ticket.isLoading) {
		return (
			<Card>
				<CardContent className="p-6 text-muted-foreground text-sm">Loading…</CardContent>
			</Card>
		)
	}
	if (!ticket.data) return null

	const isClosed = ticket.data.status === "closed"

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{ticket.data.subject}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					{ticket.data.messages.map((m) => (
						<div
							key={m.id}
							className={`flex ${m.isStaff ? "justify-start" : "justify-end"}`}
						>
							<div
								className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
									m.isStaff
										? "bg-muted text-foreground"
										: "bg-primary text-primary-foreground"
								}`}
							>
								<div className="mb-1 text-xs opacity-70">
									{m.isStaff ? "Staff" : "You"} · {new Date(m.createdAt).toLocaleString()}
								</div>
								<p className="whitespace-pre-wrap">{m.body}</p>
							</div>
						</div>
					))}
				</div>

				{isClosed ? (
					<p className="text-muted-foreground text-sm">This ticket is closed.</p>
				) : (
					<div className="space-y-2">
						<Textarea
							value={reply}
							onChange={(e) => setReply(e.target.value)}
							placeholder="Write a reply"
						/>
						<Button
							disabled={send.isPending}
							onClick={submitReply}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Send
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
