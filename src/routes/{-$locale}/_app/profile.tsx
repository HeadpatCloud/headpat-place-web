import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

// Convenience redirect: /profile → /user/<myProfileUrl>
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/{-$locale}/_app/profile")({
	head: pageHead("nav.myprofile", "/profile", { noindex: true }),
	component: MyProfileRedirect,
});

function MyProfileRedirect() {
	const t = useTranslations("miscPages");
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const me = useQuery({
		...orpc.profile.me.queryOptions({ input: undefined }),
		enabled: !!session?.user,
	});
	useEffect(() => {
		if (isPending) return;
		if (!session?.user) {
			navigate({
				to: "/login" as never,
				search: { ref: "profile" } as never,
				replace: true,
			});
		} else if (me.data?.profileUrl) {
			navigate({ to: `/user/${me.data.profileUrl}` as never, replace: true });
		}
	}, [isPending, session, me.data, navigate]);
	return <p className="text-muted-foreground p-4">{t("redirecting")}</p>;
}
