import { ConversationPage } from "../../../components/ChatWorkspace";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const [{ conversationId }, query] = await Promise.all([params, searchParams]);
  const initialSource = query.source === "report" ? "report" : "general";
  return <ConversationPage id={conversationId} initialSource={initialSource} />;
}
