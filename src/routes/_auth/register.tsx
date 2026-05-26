import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";

export const Route = createFileRoute("/_auth/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const result = await signUp.email({ email, password, name });
		if (result.error) {
			setError(result.error.message ?? "Sign up failed");
			return;
		}
		navigate({ to: "/" });
	}

	return (
		<form
			onSubmit={onSubmit}
			style={{ padding: "2rem", maxWidth: 400, margin: "0 auto" }}
		>
			<h2>Register</h2>
			<label>
				Name
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</label>
			<label>
				Email
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</label>
			<label>
				Password
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					minLength={8}
				/>
			</label>
			{error && <p style={{ color: "tomato" }}>{error}</p>}
			<button type="submit">Create account</button>
		</form>
	);
}
