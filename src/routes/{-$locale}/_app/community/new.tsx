import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import InputField from "@/components/fields/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/community/new")({
	component: NewCommunityPage,
});

const schema = z.object({
	name: z.string().min(1).max(120),
	description: z.string().max(2000).optional(),
});

function NewCommunityPage() {
	const t = useTranslations("communityPages");
	const tc = useTranslations("common");
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", description: "" },
	});
	const createMut = useMutation({
		mutationFn: async (v: z.infer<typeof schema>) => client.community.create(v),
		onSuccess: (c) => {
			toast.success(t("communityCreated"));
			navigate({ to: `/community/${c.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<main className="mx-auto max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>{t("createCommunityTitle")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
							className="space-y-4"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<InputField
										label={t("nameLabel")}
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<InputField
										label={t("descriptionLabel")}
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<Button type="submit" disabled={createMut.isPending}>
								{tc("create")}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</main>
	);
}
