import { Link, createFileRoute } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";

export const Route = createFileRoute("/")({
	component: Landing,
});

function Landing() {
	const { data, isPending } = useSession();

	return (
		<main style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
			<h1>headpat.place</h1>
			{isPending ? (
				<p>loading…</p>
			) : data?.user ? (
				<>
					<p>Signed in as {data.user.email}</p>
					<p>id: {data.user.id}</p>
				</>
			) : (
				<p>
					<Link to="/login">login</Link> · <Link to="/register">register</Link>
				</p>
			)}
		</main>
	);
}
