import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_app/map")({
  component: MapPage,
})

function MapPage() {
  return (
    <main className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Live user locations on a Google Map. Coming soon — needs Google Maps
            API key + the `location.publish` / `location.list` oRPC procedures
            (planned for a separate phase).
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
