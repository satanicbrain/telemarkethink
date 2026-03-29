export async function GET() {
  return Response.json({
    ok: true,
    service: "telemarkethink",
    time: new Date().toISOString(),
  });
}
