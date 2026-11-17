import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json(
    {
      status: "ok",
      service: "utd-site-fe",
      apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://api.universaltooldepot.lk",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
