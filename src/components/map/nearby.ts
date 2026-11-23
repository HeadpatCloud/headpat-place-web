import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { client, orpc } from "@/lib/orpc";

// How often the map refetches who's around and, while you are visible,
// refreshes your own cell. Cells are 1 to 5 km wide, so minutes are plenty.
export const NEARBY_REFRESH_MS = 2 * 60 * 1000;

export class GeolocationError extends Error {
	constructor(readonly reason: "unsupported" | "denied" | "unavailable") {
		super(reason);
	}
}

/** One position fix from the browser. The exact value only goes to the API,
 *  which snaps it to a grid cell before storing anything. */
export function currentPosition(): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			reject(new GeolocationError("unsupported"));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
			(e) =>
				reject(
					new GeolocationError(
						e.code === e.PERMISSION_DENIED ? "denied" : "unavailable",
					),
				),
			{ enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 20000 },
		);
	});
}

export function useNearbyStatus(enabled: boolean) {
	return useQuery({
		...orpc.nearby.status.queryOptions({ input: {} }),
		enabled,
	});
}

export function useNearbyList(enabled: boolean) {
	return useQuery({
		...orpc.nearby.list.queryOptions({ input: {} }),
		enabled,
		refetchInterval: NEARBY_REFRESH_MS,
	});
}

export function useInvalidateNearby() {
	const qc = useQueryClient();
	return () =>
		Promise.all([
			qc.invalidateQueries({ queryKey: orpc.nearby.status.key() }),
			qc.invalidateQueries({ queryKey: orpc.nearby.list.key() }),
		]);
}

/** While the map is open and you are visible, keep your cell fresh. Silent on
 *  failure: the last cell simply stays until it goes stale or expires. */
export function useRefreshOwnCell(visible: boolean) {
	useEffect(() => {
		if (!visible) return;
		let cancelled = false;
		const tick = () => {
			currentPosition()
				.then((pos) => {
					if (!cancelled) return client.nearby.updatePosition(pos);
				})
				.catch(() => {});
		};
		tick();
		const id = setInterval(tick, NEARBY_REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [visible]);
}
