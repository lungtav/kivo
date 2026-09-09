import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Hash, Users } from "lucide-react";
import { Brand } from "../components/brand/Brand";
import { ApiError } from "../lib/api";
import { clearPendingInvite, setPendingInvite } from "../lib/invite";
import { joinSpaceByCode, previewInvite, type InvitePreview } from "../lib/workspace";

const hasValidAccessToken = () => {
  try {
    const token = localStorage.getItem("kivo_access_token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

const statusCopy: Record<Exclude<InvitePreview["status"], "valid">, { title: string; body: string }> = {
  revoked: { title: "This invite was revoked", body: "The link you're using no longer works. Ask a space admin for a fresh one." },
  expired: { title: "This invite expired", body: "The link you're using has passed its expiry date. Ask a space admin for a fresh one." },
  exhausted: { title: "This invite is used up", body: "The link you're using has reached its maximum number of uses." },
};

export default function JoinSpacePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [authed] = useState(hasValidAccessToken);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setNotFound(true);
      return;
    }
    if (!authed) setPendingInvite(code);
    let active = true;
    void previewInvite(code)
      .then(({ invite }) => { if (active) setPreview(invite); })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.code === "NOT_FOUND") {
          clearPendingInvite();
          setNotFound(true);
        } else {
          setJoinError(cause instanceof Error ? cause.message : "Could not load this invite.");
        }
      });
    return () => { active = false; };
  }, [code, authed]);

  const join = async () => {
    if (!code || !preview) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { result } = await joinSpaceByCode(code);
      clearPendingInvite();
      navigate("/app", { state: { spaceId: result.spaceId } });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "CONFLICT") {
        // already a member — just take them to the space
        clearPendingInvite();
        navigate("/app", { state: { spaceId: preview.space.id } });
        return;
      }
      if (cause instanceof ApiError && (cause.code === "INVITE_REVOKED" || cause.code === "INVITE_EXPIRED" || cause.code === "INVITE_EXHAUSTED")) {
        // invite died between preview and join — refresh the status display
        try {
          const { invite } = await previewInvite(code);
          setPreview(invite);
        } catch {
          // keep the previous preview
        }
      }
      setJoinError(cause instanceof Error ? cause.message : "Could not join this space.");
    } finally {
      setJoining(false);
    }
  };

  const joinPath = code ? `/join/${code}` : "/app";

  return (
    <div className="grid min-h-svh place-items-center bg-background p-5">
      <div className="w-full max-w-sm">
        <Brand />
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {notFound || !code ? (
            <>
              <h1 className="text-lg font-semibold text-foreground">Invalid invite link</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This link doesn't match any space. Check it wasn't cut off when it was shared with you.</p>
              <Link to="/" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Back home</Link>
            </>
          ) : !preview && !joinError ? (
            <>
              <div className="size-12 animate-pulse rounded-2xl bg-muted" />
              <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
            </>
          ) : !preview ? (
            <>
              <h1 className="text-lg font-semibold text-foreground">Couldn't load this invite</h1>
              {joinError && <p role="alert" className="mt-2 text-sm text-red-500">{joinError}</p>}
              <button onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Try again</button>
            </>
          ) : preview.status !== "valid" ? (
            <>
              <SpaceBadge name={preview.space.name} avatarUrl={preview.space.avatar_url} />
              <h1 className="mt-4 text-lg font-semibold text-foreground">{statusCopy[preview.status].title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusCopy[preview.status].body}</p>
              {authed
                ? <button onClick={() => navigate("/app")} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Open Kivo</button>
                : <Link to="/login" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Log in</Link>}
            </>
          ) : (
            <>
              <SpaceBadge name={preview.space.name} avatarUrl={preview.space.avatar_url} />
              <h1 className="mt-4 text-lg font-semibold text-foreground">You've been invited to {preview.space.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Users size={14} /> {preview.memberCount} {preview.memberCount === 1 ? "member" : "members"}{preview.expiresAt ? ` · Expires ${new Date(preview.expiresAt).toLocaleDateString()}` : ""}</p>
              {joinError && <p role="alert" className="mt-3 text-sm text-red-500">{joinError}</p>}
              {authed ? (
                <button disabled={joining} onClick={() => void join()} className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">{joining ? "Joining…" : `Join ${preview.space.name}`}</button>
              ) : (
                <>
                  <Link to="/login" state={{ from: { pathname: joinPath } }} className="mt-5 block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Log in to join</Link>
                  <p className="mt-3 text-center text-sm text-muted-foreground">New to Kivo? <Link to="/register" className="font-semibold text-foreground underline underline-offset-4">Create an account</Link></p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SpaceBadge({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="size-12 rounded-2xl object-cover" />
        : <span className="grid size-12 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">{initials(name)}</span>}
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground"><Hash size={12} /> Space invite</span>
    </span>
  );
}
