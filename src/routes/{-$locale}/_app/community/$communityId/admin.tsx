import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AvatarBannerUpload } from "@/components/AvatarBannerUpload";
import InputField from "@/components/fields/InputField";
import { UserCard } from "@/components/UserCard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute(
	"/{-$locale}/_app/community/$communityId/admin",
)({
	component: AdminPage,
});

const updateSchema = z.object({
	name: z.string().min(1).max(120).optional(),
	description: z.string().max(2000).optional(),
});

function AdminPage() {
	const t = useTranslations("communityPages");
	const tc = useTranslations("common");
	const { communityId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const community = useQuery(
		orpc.community.byId.queryOptions({ input: { communityId } }),
	);
	const role = useQuery(
		orpc.community.myRoleIn.queryOptions({ input: { communityId } }),
	);
	const members = useQuery(
		orpc.community.listMembers.queryOptions({ input: { communityId } }),
	);

	const form = useForm<z.infer<typeof updateSchema>>({
		resolver: zodResolver(updateSchema),
		defaultValues: { name: "", description: "" },
	});

	useEffect(() => {
		if (community.data) {
			form.reset({
				name: community.data.name,
				description: community.data.description ?? "",
			});
		}
	}, [community.data, form]);

	const updateMut = useMutation({
		mutationFn: async (v: z.infer<typeof updateSchema>) =>
			client.community.update({ communityId, ...v }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.community.byId.queryKey({ input: { communityId } }),
			});
			toast.success(t("saved"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const deleteMut = useMutation({
		mutationFn: async () => client.community.delete({ communityId }),
		onSuccess: () => {
			toast.success(t("communityDeleted"));
			navigate({ to: "/community" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (community.isPending)
		return <p className="p-4 text-muted-foreground">{t("loading")}</p>;
	if (!community.data) return <p className="p-4">{t("communityNotFound")}</p>;
	if (role.data?.role !== "owner" && role.data?.role !== "admin") {
		return <p className="p-4">{t("noPermission")}</p>;
	}

	return (
		<main className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("branding")}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-8">
					<AvatarBannerUpload
						kind="community-avatar"
						currentFileId={community.data.avatarFileId}
						label={t("changeAvatar")}
						onUploaded={async (fileId) => {
							await client.community.update({
								communityId,
								avatarFileId: fileId,
							});
							qc.invalidateQueries({
								queryKey: orpc.community.byId.queryKey({
									input: { communityId },
								}),
							});
						}}
					/>
					<AvatarBannerUpload
						kind="community-banner"
						currentFileId={community.data.bannerFileId}
						label={t("changeBanner")}
						onUploaded={async (fileId) => {
							await client.community.update({
								communityId,
								bannerFileId: fileId,
							});
							qc.invalidateQueries({
								queryKey: orpc.community.byId.queryKey({
									input: { communityId },
								}),
							});
						}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("editCommunityTitle")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((v) => updateMut.mutate(v))}
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
							<Button type="submit" disabled={updateMut.isPending}>
								{tc("save")}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("membersAndRoles")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{(members.data?.items ?? []).map((m) => (
							<UserCard
								key={m.userId}
								user={m}
								trailing={
									<span className="text-xs text-muted-foreground capitalize">
										{m.role}
									</span>
								}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{role.data.role === "owner" ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("dangerZone")}</CardTitle>
					</CardHeader>
					<CardContent>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive">{t("deleteCommunity")}</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogTitle>
									{t("deleteCommunityConfirmTitle")}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{t("deleteCommunityConfirmDescription")}
								</AlertDialogDescription>
								<AlertDialogFooter>
									<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
									<AlertDialogAction asChild>
										<Button
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
											onClick={() => deleteMut.mutate()}
										>
											{tc("delete")}
										</Button>
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</CardContent>
				</Card>
			) : null}
		</main>
	);
}
