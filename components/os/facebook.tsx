"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import HomeIndicatorSpacer from "./home-indicator-spacer";

type AgeGateStatus = "asking" | "allowed" | "denied";

type FeedComment = {
  author: string;
  text: string;
  time: string;
};

type BasePost = {
  id: string;
  author: string;
  time: string;
  likes: number;
  commentCount: number;
  shares: number;
  comments: FeedComment[];
};

type PostImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type PhotoPost = BasePost & {
  kind: "photo";
  text: string;
  image: PostImage;
};

type MarketplacePost = BasePost & {
  kind: "marketplace";
  title: string;
  price: string;
  condition: string;
  location: string;
  description: string;
  image: PostImage;
};

type FeedPost = PhotoPost | MarketplacePost;

const VIEWER_NAME = "You";

const posts: FeedPost[] = [
  {
    kind: "photo",
    id: "uncle-gary",
    author: "Uncle Gary",
    time: "3h",
    text: "IS THIS REAL??? 😳😳 My neighbor Dennis showed me this at the BBQ and I have not slept since. Somebody who knows computers PLEASE tell me if this is real or not. Sharing just in case. AMEN 🙏🙏",
    image: {
      src: "/os/facebook/trumpet-cat.jpg",
      alt: "A tabby cat standing on its hind legs on a porch, playing a trumpet, while a man walks out of the house behind it",
      width: 336,
      height: 595,
    },
    likes: 47,
    commentCount: 23,
    shares: 112,
    comments: [
      { author: "Linda Henderson", text: "Gary this is AI", time: "2h" },
      { author: "Uncle Gary", text: "Who is AI and how did they get this video", time: "2h" },
      { author: "Barbara Kowalski", text: "Typed AMEN and shared 🙏", time: "1h" },
      { author: "Kevin Gary", text: "dad please stop sharing these", time: "45m" },
    ],
  },
  {
    kind: "marketplace",
    id: "animal-print-couch",
    author: "Darren Mitchell",
    time: "Listed 5h ago",
    title: "Animal print couch set",
    price: "$350",
    condition: "Used – Like new",
    location: "Springfield",
    description:
      "Genuine animal print leather couch set. 2 sofas + matching ottoman. The pattern came like that from the factory. Very rare, you won't find this anywhere else. NO LOWBALLERS, I know what I have. Cash only, pick up only, not helping you load it. Don't ask if it's still available, if the post is up it's available.",
    image: {
      src: "/os/facebook/animal-print-couch.jpg",
      alt: "Two black leather sofas and an ottoman with the leather peeled away into a cracked, animal-print-like pattern",
      width: 750,
      height: 712,
    },
    likes: 9,
    commentCount: 41,
    shares: 6,
    comments: [
      { author: "Sharon Pike", text: "Is this still available?", time: "4h" },
      { author: "Darren Mitchell", text: "Can you read", time: "4h" },
      { author: "Tom Reyes", text: "Would you take $5 and a sandwich", time: "3h" },
      { author: "Darren Mitchell", text: "What kind of sandwich", time: "3h" },
    ],
  },
];

const iconPaths = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />,
  video: (
    <>
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <path d="m17 10 5-3v10l-5-3" />
    </>
  ),
  store: <path d="M3 9 4.5 4h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />,
  groups: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  like: <path d="M7 10v11H3V10Zm0 0 4-7a2.5 2.5 0 0 1 2.5 3L13 10h6a2 2 0 0 1 2 2.3l-1.3 7a2 2 0 0 1-2 1.7H7" />,
  comment: <path d="M21 12a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5A8.5 8.5 0 1 1 21 12Z" />,
  share: <path d="m14 4 7 7-7 7v-4c-5 0-8.5 1.5-11 5 1-5 4-10 11-11Z" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type IconName = keyof typeof iconPaths;

const Icon = ({ name, className = "size-5" }: { name: IconName; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {iconPaths[name]}
  </svg>
);

const FacebookLogo = ({ className = "size-10" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#0866ff" />
    <svg x="12" y="8" width="16" height="32" viewBox="0 0 320 512">
      <path
        fill="#fff"
        d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
      />
    </svg>
  </svg>
);

const avatarHue = (name: string) =>
  [...name].reduce((sum, character) => sum + character.charCodeAt(0) * 7, 0) % 360;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

const Avatar = ({ name, className = "size-10" }: { name: string; className?: string }) => (
  <span
    aria-hidden="true"
    className={`${className} grid shrink-0 place-items-center rounded-full text-sm font-semibold text-white uppercase`}
    style={{ background: `hsl(${avatarHue(name)} 45% 50%)` }}
  >
    {initialsOf(name)}
  </span>
);

const formatCount = (value: number) => value.toLocaleString("en-US");

const navItems: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Home" },
  { icon: "video", label: "Video" },
  { icon: "store", label: "Marketplace" },
  { icon: "groups", label: "Groups" },
];

const TopBar = () => (
  <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
    <FacebookLogo />
    <span className="hidden h-10 w-60 items-center gap-2 rounded-full bg-[#f0f2f5] px-3 text-[15px] text-[#65676b] @3xl:flex">
      <Icon name="search" className="size-4" />
      Search Facebook
    </span>
    <nav aria-label="Facebook sections" className="mx-auto flex h-full">
      {navItems.map((item) => {
        const isActive = item.label === "Home";
        const itemClassName = isActive
          ? "border-[#0866ff] text-[#0866ff]"
          : "border-transparent text-[#65676b]";
        return (
          <span
            key={item.label}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`${itemClassName} grid h-full w-16 place-items-center border-b-[3px] @2xl:w-24`}
          >
            <Icon name={item.icon} className="size-6" />
            <span className="sr-only">{item.label}</span>
          </span>
        );
      })}
    </nav>
    <Avatar name="Javi González" className="size-10" />
  </header>
);

const PostPhoto = ({ image }: { image: PostImage }) => (
  <div className="flex justify-center bg-black">
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      decoding="async"
      draggable={false}
      className="max-h-[560px] w-auto max-w-full object-contain"
    />
  </div>
);

const MarketplaceListing = ({ post }: { post: MarketplacePost }) => {
  const [isMessageSent, setIsMessageSent] = useState(false);

  const handleMessageSeller = () => {
    setIsMessageSent(true);
  };

  return (
    <div className="border-y border-[#e4e6eb]">
      <PostPhoto image={post.image} />
      <div className="space-y-1 px-4 py-3">
        <p className="text-xl font-bold text-[#050505]">{post.price}</p>
        <p className="text-[17px] leading-6 font-semibold text-[#050505]">{post.title}</p>
        <p className="flex items-center gap-1 text-[13px] text-[#65676b]">
          <Icon name="pin" className="size-3.5" />
          {post.location} · {post.condition}
        </p>
        <p className="pt-1 text-[15px] leading-5 text-[#050505]">{post.description}</p>
        <button
          type="button"
          onClick={handleMessageSeller}
          disabled={isMessageSent}
          className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0866ff] text-[15px] font-semibold text-white transition-colors hover:bg-[#0759e0] disabled:cursor-default disabled:bg-[#e4e6eb] disabled:text-[#65676b]"
        >
          <Icon name="send" className="size-4" />
          {isMessageSent ? "Sent: “Is this still available?”" : "Message seller"}
        </button>
      </div>
    </div>
  );
};

const PostCard = ({ post }: { post: FeedPost }) => {
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [addedComments, setAddedComments] = useState<FeedComment[]>([]);
  const [draft, setDraft] = useState("");

  const likes = post.likes + Number(isLiked);
  const shares = post.shares + Number(isShared);
  const comments = [...post.comments, ...addedComments];
  const commentCount = post.commentCount + addedComments.length;
  const likeClassName = isLiked ? "text-[#0866ff]" : "text-[#65676b]";
  const shareClassName = isShared ? "text-[#0866ff]" : "text-[#65676b]";
  const actionClassName =
    "flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md text-[15px] font-semibold transition-colors hover:bg-[#f2f2f2]";

  const handleToggleLike = () => {
    setIsLiked((value) => !value);
  };

  const handleToggleShare = () => {
    setIsShared((value) => !value);
  };

  const handleFocusComment = () => {
    commentInputRef.current?.focus();
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    setAddedComments((current) => [...current, { author: VIEWER_NAME, text, time: "Just now" }]);
    setDraft("");
  };

  return (
    <article
      aria-label={`Post by ${post.author}`}
      className="overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] @xl:rounded-lg"
    >
      <header className="flex items-center gap-2 px-4 pt-3">
        <Avatar name={post.author} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-5 font-semibold text-[#050505]">{post.author}</p>
          <p className="flex items-center gap-1 text-[13px] text-[#65676b]">
            {post.time}
            {post.kind === "marketplace" && <span>in Marketplace</span>}
            <span aria-hidden="true">·</span>
            <Icon name="globe" className="size-3" />
            <span className="sr-only">Public</span>
          </p>
        </div>
        <span className="text-[#65676b]">
          <Icon name="more" />
        </span>
      </header>

      {post.kind === "photo" && (
        <>
          <p className="px-4 pt-3 pb-3 text-[15px] leading-5 text-[#050505]">{post.text}</p>
          <PostPhoto image={post.image} />
        </>
      )}
      {post.kind === "marketplace" && (
        <div className="pt-3">
          <MarketplaceListing post={post} />
        </div>
      )}

      <div className="mx-4 flex items-center justify-between border-b border-[#ced0d4] py-2.5 text-[15px] text-[#65676b]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="flex -space-x-1 text-[11px]">
            <span className="grid size-[18px] place-items-center rounded-full bg-[#0866ff] ring-2 ring-white">👍</span>
            <span className="grid size-[18px] place-items-center rounded-full bg-[#f33e58] ring-2 ring-white">❤️</span>
            <span className="grid size-[18px] place-items-center rounded-full bg-[#f7b125] ring-2 ring-white">😮</span>
          </span>
          {formatCount(likes)}
        </span>
        <span>
          {formatCount(commentCount)} comments · {formatCount(shares)} shares
        </span>
      </div>

      <div className="mx-4 flex gap-1 border-b border-[#ced0d4] py-1">
        <button
          type="button"
          aria-pressed={isLiked}
          aria-label={isLiked ? `Unlike ${post.author}'s post` : `Like ${post.author}'s post`}
          onClick={handleToggleLike}
          className={`${actionClassName} ${likeClassName}`}
        >
          <Icon name="like" />
          Like
        </button>
        <button
          type="button"
          aria-label={`Comment on ${post.author}'s post`}
          onClick={handleFocusComment}
          className={`${actionClassName} text-[#65676b]`}
        >
          <Icon name="comment" />
          Comment
        </button>
        <button
          type="button"
          aria-pressed={isShared}
          aria-label={isShared ? `Undo sharing ${post.author}'s post` : `Share ${post.author}'s post`}
          onClick={handleToggleShare}
          className={`${actionClassName} ${shareClassName}`}
        >
          <Icon name="share" />
          {isShared ? "Shared" : "Share"}
        </button>
      </div>

      <ul aria-label="Comments" className="space-y-2 px-4 pt-3">
        {comments.map((comment, index) => (
          <li key={`${comment.author}-${index}`} className="flex items-start gap-2">
            <Avatar name={comment.author} className="size-8" />
            <div className="min-w-0">
              <div className="rounded-2xl bg-[#f0f2f5] px-3 py-2">
                <p className="text-[13px] leading-4 font-semibold text-[#050505]">{comment.author}</p>
                <p className="text-[15px] leading-5 break-words text-[#050505]">{comment.text}</p>
              </div>
              <p className="flex gap-3 px-3 pt-0.5 text-xs text-[#65676b]">
                <span>{comment.time}</span>
                <span className="font-semibold">Like</span>
                <span className="font-semibold">Reply</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmitComment} className="flex items-center gap-2 px-4 pt-2 pb-3">
        <Avatar name="Javi González" className="size-8" />
        <input
          ref={commentInputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`Write a comment on ${post.author}'s post`}
          placeholder="Write a comment…"
          maxLength={300}
          className="h-9 min-w-0 flex-1 rounded-full bg-[#f0f2f5] px-3 text-[15px] text-[#050505] outline-none placeholder:text-[#65676b] focus-visible:ring-2 focus-visible:ring-[#0866ff]"
        />
      </form>
    </article>
  );
};

const EndOfFeed = () => (
  <section
    aria-label="End of feed"
    className="flex flex-col items-center gap-2 bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.2)] @xl:rounded-lg"
  >
    <span className="grid size-14 place-items-center rounded-full bg-[#e7f3ff] text-[#0866ff]">
      <Icon name="check" className="size-7" />
    </span>
    <h2 className="text-xl font-bold text-[#050505]">You&apos;re all caught up</h2>
    <p className="max-w-xs text-[15px] text-[#65676b]">You&apos;ve seen all posts. Go call your uncle.</p>
  </section>
);

const Feed = () => (
  <main className="mx-auto flex w-full max-w-[590px] flex-col gap-4 py-4 @xl:px-4">
    {posts.map((post) => (
      <PostCard key={post.id} post={post} />
    ))}
    <EndOfFeed />
  </main>
);

const AgeGateModal = ({ onAnswer }: { onAnswer: (isOver50: boolean) => void }) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    onAnswer(true);
  };

  const handleDecline = () => {
    onAnswer(false);
  };

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#f0f2f5]/70 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="facebook-age-gate-title"
        aria-describedby="facebook-age-gate-description"
        className="w-full max-w-[400px] overflow-hidden rounded-lg bg-white shadow-[0_12px_28px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)]"
      >
        <div className="flex flex-col items-center gap-3 border-b border-[#e4e6eb] px-6 pt-6 pb-5 text-center">
          <FacebookLogo className="size-14" />
          <h2 id="facebook-age-gate-title" className="text-xl font-bold text-[#050505]">
            Are you over 50 years old?
          </h2>
          <p id="facebook-age-gate-description" className="text-[15px] text-[#65676b]">
            Some posts in this feed are only meant for a very specific generation.
          </p>
        </div>
        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={handleDecline}
            className="h-10 flex-1 cursor-pointer rounded-md bg-[#e4e6eb] text-[15px] font-semibold text-[#050505] transition-colors hover:bg-[#d8dadf]"
          >
            No
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className="h-10 flex-1 cursor-pointer rounded-md bg-[#0866ff] text-[15px] font-semibold text-white transition-colors hover:bg-[#0759e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866ff]"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

const NotAllowedScreen = ({ onOverride }: { onOverride: () => void }) => (
  <section
    aria-labelledby="facebook-not-allowed-title"
    className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center"
  >
    <span className="grid size-24 place-items-center rounded-full bg-white text-[#65676b] shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
      <Icon name="lock" className="size-11" />
    </span>
    <h2 id="facebook-not-allowed-title" className="mt-2 text-2xl font-bold text-[#050505]">
      You&apos;re not allowed here
    </h2>
    <p className="max-w-sm text-[17px] leading-6 text-[#65676b]">
      This feed is only available to people over 50. Please come back in a few decades.
    </p>
    <button
      type="button"
      onClick={onOverride}
      className="mt-3 h-10 cursor-pointer rounded-md bg-[#0866ff] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0759e0]"
    >
      I&apos;m actually over 50
    </button>
  </section>
);

// Outlives the component so reopening the window doesn't ask again.
let rememberedAgeGateStatus: AgeGateStatus = "asking";

export default function FacebookFeed() {
  const [ageGateStatus, setAgeGateStatus] = useState<AgeGateStatus>(rememberedAgeGateStatus);
  const isAsking = ageGateStatus === "asking";
  const feedClassName = isAsking ? "pointer-events-none blur-sm" : "";

  const updateAgeGateStatus = (status: AgeGateStatus) => {
    rememberedAgeGateStatus = status;
    setAgeGateStatus(status);
  };

  const handleAgeAnswer = (isOver50: boolean) => {
    if (isOver50) {
      updateAgeGateStatus("allowed");
      return;
    }
    updateAgeGateStatus("denied");
  };

  const handleOverride = () => {
    updateAgeGateStatus("allowed");
  };

  return (
    <div className="facebook-app @container relative flex min-h-0 flex-1 flex-col bg-[#f0f2f5] font-[system-ui,-apple-system,Helvetica,Arial,sans-serif] text-[#050505] select-text [color-scheme:light]">
      <TopBar />
      {ageGateStatus === "denied" && <NotAllowedScreen onOverride={handleOverride} />}
      {ageGateStatus !== "denied" && (
        <div
          inert={isAsking}
          aria-hidden={isAsking}
          className={`${feedClassName} min-h-0 flex-1 overflow-y-auto overscroll-contain`}
        >
          <Feed />
          <HomeIndicatorSpacer />
        </div>
      )}
      {isAsking && <AgeGateModal onAnswer={handleAgeAnswer} />}
    </div>
  );
}
