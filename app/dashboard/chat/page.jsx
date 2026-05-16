import ChatBot from "@/components/ChatBot";
import StatementImport from "@/components/StatementImport";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">AI assistant</h1>
      <ChatBot />
      <StatementImport />
    </div>
  );
}
