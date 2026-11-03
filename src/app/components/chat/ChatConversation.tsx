import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Phone,
  PhoneOff,
  Send,
  UserRound,
  Video,
  PhoneIncoming,
  Check,
  X,
  Mic,
  VideoOff,
  MicOff,
} from "lucide-react";
import ProfileModal from "@/app/components/profile/ProfileModal";
import { supabase } from "@/app/lib/supabase";
import {
  endCallRequest,
  fetchIncomingCallRequest,
  fetchMessages,
  fetchPendingCallRequest,
  isImageMessage,
  isVideoMessage,
  sendCallRequest,
  sendMediaMessage,
  sendTextMessage,
  updateCallStatus,
  uploadChatMedia,
  validateMediaFile,
  type CallStatus,
  type ChatContext,
  type ChatMessage,
} from "@/app/lib/chat";

type ChatConversationProps = {
  context: ChatContext;
  scopeId: string;
  loginId: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
};

type CallPhase = "idle" | "waiting" | "active" | "incoming";

type CallState = {
  phase: CallPhase;
  type: "audio" | "video";
  messageId: string | null;
  seconds: number;
  incomingMessage: ChatMessage | null;
};

export default function ChatConversation({
  context,
  scopeId,
  loginId,
  title,
  subtitle,
  onBack,
}: ChatConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLoginId, setSelectedLoginId] = useState<string | null>(null);
  const [call, setCall] = useState<CallState>({
    phase: "idle",
    type: "audio",
    messageId: null,
    seconds: 0,
    incomingMessage: null,
  });
  const [showCallPicker, setShowCallPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(() => {
    fetchMessages(context, scopeId)
      .then(setMessages)
      .catch((err: Error) => setError(err.message));
  }, [context, scopeId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSending(true);
    setError(null);
    try {
      await sendTextMessage(context, scopeId, loginId, trimmed);
      setText("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const fileError = validateMediaFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadChatMedia(context, scopeId, loginId, file);
      await sendMediaMessage(context, scopeId, loginId, file, url);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  // Start outgoing call request
  const startCallRequest = async (type: "audio" | "video") => {
    setShowCallPicker(false);
    setError(null);
    try {
      const msgId = await sendCallRequest(context, scopeId, loginId, type);
      setCall({ phase: "waiting", type, messageId: msgId, seconds: 0, incomingMessage: null });
      await reload();
      // Poll for response
      pollRef.current = setInterval(async () => {
        if (!msgId) return;
        const { data, error: fetchError } = await supabase
          .from("chat_messages")
          .select("call_status")
          .eq("id", msgId)
          .maybeSingle();
        if (!fetchError && data) {
          const status = (data as { call_status: CallStatus }).call_status;
          if (status === "accepted") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setCall((prev) => ({ ...prev, phase: "active", seconds: 0 }));
            callTimerRef.current = setInterval(() => {
              setCall((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
            }, 1000);
          } else if (status === "rejected" || status === "cancelled") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setCall({
              phase: "idle",
              type: "audio",
              messageId: null,
              seconds: 0,
              incomingMessage: null,
            });
            reload();
          }
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通話申し込みに失敗しました");
    }
  };

  // Cancel an outgoing call request (from waiting screen)
  const cancelCallRequest = async () => {
    if (call.messageId) {
      try {
        await updateCallStatus(call.messageId, "cancelled");
      } catch {
        /* ignore */
      }
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setCall({ phase: "idle", type: "audio", messageId: null, seconds: 0, incomingMessage: null });
    reload();
  };

  // End an active call
  const endActiveCall = async () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (call.messageId) {
      try {
        await endCallRequest(call.messageId, call.seconds);
      } catch {
        /* ignore */
      }
    }
    setCall({ phase: "idle", type: "audio", messageId: null, seconds: 0, incomingMessage: null });
    reload();
  };

  // Toggle audio/video during active call
  const toggleCallType = () => {
    setCall((prev) => ({ ...prev, type: prev.type === "audio" ? "video" : "audio" }));
  };

  // Incoming call: accept
  const acceptIncomingCall = async () => {
    if (!call.incomingMessage) return;
    try {
      await updateCallStatus(call.incomingMessage.id, "accepted");
      setCall((prev) => ({
        ...prev,
        phase: "active",
        seconds: 0,
        messageId: prev.incomingMessage?.id ?? null,
      }));
      callTimerRef.current = setInterval(() => {
        setCall((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "通話を受諾できませんでした");
    }
  };

  // Incoming call: reject
  const rejectIncomingCall = async () => {
    if (!call.incomingMessage) return;
    try {
      await updateCallStatus(call.incomingMessage.id, "rejected");
    } catch {
      /* ignore */
    }
    setCall({ phase: "idle", type: "audio", messageId: null, seconds: 0, incomingMessage: null });
    reload();
  };

  // Poll for incoming call requests (when idle)
  useEffect(() => {
    if (call.phase !== "idle") return;
    const incomingPoll = setInterval(async () => {
      const incoming = await fetchIncomingCallRequest(context, scopeId, loginId);
      if (incoming) {
        setCall((prev) => ({
          ...prev,
          phase: "incoming",
          incomingMessage: incoming,
          type: incoming.callType ?? "audio",
        }));
      }
    }, 2000);
    return () => clearInterval(incomingPoll);
  }, [call.phase, context, scopeId, loginId]);

  // Check for existing pending call request on mount
  useEffect(() => {
    fetchPendingCallRequest(context, scopeId, loginId).then((pending) => {
      if (pending) {
        setCall((prev) => ({
          ...prev,
          phase: "waiting",
          messageId: pending.id,
          type: pending.callType ?? "audio",
          seconds: 0,
        }));
        // Start polling for response
        pollRef.current = setInterval(async () => {
          const { data, error: fetchError } = await supabase
            .from("chat_messages")
            .select("call_status")
            .eq("id", pending.id)
            .maybeSingle();
          if (!fetchError && data) {
            const status = (data as { call_status: CallStatus }).call_status;
            if (status === "accepted") {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
              setCall((prev) => ({ ...prev, phase: "active", seconds: 0 }));
              callTimerRef.current = setInterval(() => {
                setCall((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
              }, 1000);
            } else if (status === "rejected" || status === "cancelled") {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
              setCall({
                phase: "idle",
                type: "audio",
                messageId: null,
                seconds: 0,
                incomingMessage: null,
              });
              reload();
            }
          }
        }, 1500);
      }
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-screen-in flex min-h-screen flex-col bg-sky-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => title && setSelectedLoginId(title)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-bold text-slate-900">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </button>
        <button
          type="button"
          onClick={() => setShowCallPicker(true)}
          aria-label="通話"
          className="flex h-9 w-9 items-center justify-center rounded-full text-cyan-600 hover:bg-cyan-50 active:scale-95"
        >
          <Phone className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">まだメッセージがありません</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.senderLoginId === loginId}
                onOpenProfile={(id) => setSelectedLoginId(id)}
              />
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="写真・動画を送信"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={handleFileChange}
          />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="メッセージを入力"
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={isSending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>

      {/* Call type picker */}
      {showCallPicker && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setShowCallPicker(false)}
        >
          <div
            className="animate-sheet-in rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-base font-bold text-slate-900">通話の種類</h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => startCallRequest("audio")}
                className="flex flex-col items-center gap-2 rounded-2xl bg-sky-50 p-6 transition hover:bg-sky-100 active:scale-95"
              >
                <Phone className="h-8 w-8 text-cyan-600" />
                <span className="text-sm font-bold text-slate-900">音声通話</span>
              </button>
              <button
                type="button"
                onClick={() => startCallRequest("video")}
                className="flex flex-col items-center gap-2 rounded-2xl bg-sky-50 p-6 transition hover:bg-sky-100 active:scale-95"
              >
                <Video className="h-8 w-8 text-cyan-600" />
                <span className="text-sm font-bold text-slate-900">ビデオ通話</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowCallPicker(false)}
              className="mt-4 w-full rounded-2xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Waiting for call response */}
      {call.phase === "waiting" && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur">
          <p className="text-lg font-bold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-300">通話申し込み中…</p>
          <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/30">
            <Phone className="h-10 w-10 animate-pulse text-white" />
          </div>
          <p className="mt-3 text-xs text-slate-400">相手の返答を待っています</p>
          <button
            type="button"
            onClick={cancelCallRequest}
            className="mt-10 flex items-center gap-2 rounded-2xl bg-rose-600 px-8 py-3.5 font-bold text-white shadow-lg active:scale-95"
          >
            <PhoneOff className="h-5 w-5" />
            キャンセル
          </button>
        </div>
      )}

      {/* Incoming call request */}
      {call.phase === "incoming" && call.incomingMessage && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur">
          <PhoneIncoming className="h-10 w-10 text-cyan-400" />
          <p className="mt-4 text-lg font-bold text-white">{call.incomingMessage.senderName}</p>
          <p className="mt-1 text-sm text-slate-300">
            から{call.type === "video" ? "ビデオ通話" : "音声通話"}の申し込み
          </p>
          <div className="mt-10 flex gap-6">
            <button
              type="button"
              onClick={rejectIncomingCall}
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg active:scale-95">
                <X className="h-7 w-7" />
              </span>
              <span className="text-xs font-bold text-rose-400">拒否</span>
            </button>
            <button
              type="button"
              onClick={acceptIncomingCall}
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg active:scale-95">
                <Check className="h-7 w-7" />
              </span>
              <span className="text-xs font-bold text-emerald-400">受諾</span>
            </button>
          </div>
        </div>
      )}

      {/* Active call */}
      {call.phase === "active" && (
        <CallOverlay
          type={call.type}
          title={title}
          seconds={call.seconds}
          onToggleType={toggleCallType}
          onEnd={endActiveCall}
        />
      )}

      {selectedLoginId && (
        <ProfileModal loginId={selectedLoginId} onClose={() => setSelectedLoginId(null)} />
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isOwn,
  onOpenProfile,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onOpenProfile: (loginId: string) => void;
}) {
  // Call-related messages
  if (msg.callType && msg.callStatus) {
    let label = "";
    if (msg.callStatus === "request") {
      label = `${msg.senderName} が${msg.callType === "video" ? "ビデオ通話" : "音声通話"}を申し込みました`;
    } else if (msg.callStatus === "accepted") {
      label = `${msg.senderName} の通話申し込みが受諾されました`;
    } else if (msg.callStatus === "rejected") {
      label = `${msg.senderName} の通話申し込みが拒否されました`;
    } else if (msg.callStatus === "cancelled") {
      label = `${msg.senderName} の通話申し込みがキャンセルされました`;
    } else if (msg.callStatus === "ended") {
      label = `${msg.callType === "video" ? "ビデオ通話" : "音声通話"}終了 ・ ${msg.senderName}${msg.callDurationSec !== null ? ` (${formatDuration(msg.callDurationSec)})` : ""}`;
    }
    return (
      <li className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-4 py-2 text-center text-xs text-slate-700">
          {label}
        </span>
      </li>
    );
  }
  if (msg.callType) {
    return (
      <li className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-4 py-2 text-xs text-slate-700">
          {msg.callType === "video" ? "ビデオ通話" : "音声通話"} ・ {msg.senderName}{" "}
          が通話を終了しました
          {msg.callDurationSec !== null ? ` (${formatDuration(msg.callDurationSec)})` : ""}
        </span>
      </li>
    );
  }
  return (
    <li className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
      {!isOwn && (
        <button
          type="button"
          onClick={() => onOpenProfile(msg.senderLoginId)}
          className="flex items-center gap-1.5"
        >
          <Avatar name={msg.senderName} imageUrl={msg.senderAvatarUrl} />
          <span className="text-xs font-semibold text-slate-700">{msg.senderName}</span>
        </button>
      )}
      <div
        className={`max-w-[80%] overflow-hidden rounded-2xl ${isOwn ? "bg-cyan-500 text-white" : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"}`}
      >
        {msg.mediaUrl && isImageMessage(msg.mediaType) && (
          <img src={msg.mediaUrl} alt="" className="max-h-60 w-full object-cover" />
        )}
        {msg.mediaUrl && isVideoMessage(msg.mediaType) && (
          <video src={msg.mediaUrl} controls className="max-h-60 w-full object-cover" />
        )}
        {msg.body && (
          <p className="whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed">
            {msg.body}
          </p>
        )}
      </div>
      <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
    </li>
  );
}

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-200 text-cyan-800">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : name ? (
        <span className="text-[10px] font-bold">{Array.from(name)[0]}</span>
      ) : (
        <UserRound className="h-3 w-3" />
      )}
    </span>
  );
}

function CallOverlay({
  type,
  title,
  seconds,
  onToggleType,
  onEnd,
}: {
  type: "audio" | "video";
  title: string;
  seconds: number;
  onToggleType: () => void;
  onEnd: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur">
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-300">
        {type === "video" ? "ビデオ通話中" : "音声通話中"}
      </p>
      <p className="mt-6 text-4xl font-bold tabular-nums text-white">{formatDuration(seconds)}</p>
      <div className="mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/30">
        {type === "video" && !videoOff ? (
          <Video className="h-10 w-10 text-white" />
        ) : (
          <Phone className="h-10 w-10 text-white" />
        )}
      </div>

      {/* Toggle audio/video */}
      <button
        type="button"
        onClick={onToggleType}
        className="mt-6 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
      >
        {type === "video" ? "音声通話に切り替え" : "ビデオ通話に切り替え"}
      </button>

      {/* Mute / video off controls */}
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${muted ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        {type === "video" && (
          <button
            type="button"
            onClick={() => setVideoOff((v) => !v)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${videoOff ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}
          >
            {videoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onEnd}
        className="mt-12 flex items-center gap-2 rounded-2xl bg-rose-600 px-8 py-3.5 font-bold text-white shadow-lg active:scale-95"
      >
        <PhoneOff className="h-5 w-5" />
        通話を終了
      </button>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
