"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, BotIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/elevenlabs/conversation";
import { ConversationBar } from "@/components/elevenlabs/conversation-bar";
import { Message, MessageContent } from "@/components/elevenlabs/message";

import { Response } from "@/components/elevenlabs/response";
import { useUserProfile } from "@/lib/contexts/user-profile-context";
import { PostCallDialog } from "@/components/practice/post-call-dialog";

const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function VoiceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const userProfile = useUserProfile();

  return (
    <div className="relative mx-auto h-full w-full">
      <Card className="flex h-full w-full flex-col gap-0 overflow-hidden rounded-md shadow-none bg-transparent p-0">
        <CardContent className="relative flex-1 overflow-hidden p-0">
          <Conversation className="absolute inset-0  overflow-hidden pb-24">
            <ConversationContent className="flex min-w-0 flex-col gap-2 p-6 h-full">
              {messages.length === 0 ? (
                <ConversationEmptyState description="Roleplay Agent" />
              ) : (
                messages.map((message, index) => {
                  return (
                    <div key={index} className="flex w-full flex-col gap-0">
                      <Message from={message.role}>
                        <MessageContent
                          variant="flat"
                          className="max-w-full min-w-0 text-base"
                        >
                          <Response className="w-auto wrap-anywhere whitespace-pre-wrap">
                            {message.content}
                          </Response>
                        </MessageContent>
                        {message.role === "assistant" && (
                          <div className="size-6 shrink-0 self-end overflow-hidden">
                            <BotIcon className="size-full" strokeWidth={1} />
                          </div>
                        )}
                      </Message>
                      {message.role === "assistant" && (
                        <div className="flex items-center">
                          <Button
                            className={cn(
                              "text-muted-foreground hover:text-foreground hover:bg-transparent bg-transparent"
                            )}
                            size="icon-sm"
                            type="button"
                            variant="default"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              setCopiedIndex(index);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                          >
                            {copiedIndex === index ? (
                              <CheckIcon className="size-4" />
                            ) : (
                              <CopyIcon className="size-4" />
                            )}
                            <span className="sr-only">
                              {copiedIndex === index ? "Copied!" : "Copy"}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </ConversationContent>
            <ConversationScrollButton className="bottom-[100px]" />
          </Conversation>
          <div className="absolute right-0 bottom-0 left-0 flex justify-center">
            <ConversationBar
              className="w-full max-w-2xl"
              agentId={DEFAULT_AGENT_ID}
              userName={userProfile?.username}
              userId={userProfile?.id}
              onConnect={() => setMessages([])}
              onDisconnect={() => {
                setMessages([]);
                setShowDialog(true);
              }}
              onSendMessage={(message) => {
                const userMessage: ChatMessage = {
                  role: "user",
                  content: message,
                };
                setMessages((prev) => [...prev, userMessage]);
              }}
              onMessage={(message) => {
                const newMessage: ChatMessage = {
                  role: message.source === "user" ? "user" : "assistant",
                  content: message.message,
                };
                setMessages((prev) => [...prev, newMessage]);
              }}
              onError={(error) => console.error("Conversation error:", error)}
            />
          </div>
        </CardContent>
      </Card>
      <PostCallDialog
        open={showDialog}
        userId={userProfile?.id || null}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
