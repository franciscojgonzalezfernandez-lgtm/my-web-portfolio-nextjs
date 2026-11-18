"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import HomeIndicatorSpacer from "./home-indicator-spacer";

type PostComment = {
  user: string;
  text: string;
  likes: number;
  time: string;
};

export type Post = {
  id: string;
  width: number;
  height: number;
  color: string;
  location: string;
  caption: string;
  likes: number;
  commentCount: number;
  date: string;
  comments: PostComment[];
};

type ProfileTab = "posts" | "reels" | "tagged";

export const USERNAME = "asierbayon";
export const PROFILE_URL = "https://www.instagram.com/asierbayon/";
const AVATAR_SRC = "/os/instagram/avatar.webp";
export const THUMB_WIDTH = 480;

export const posts: Post[] = [
  {
    id: "eclipse",
    width: 819,
    height: 1024,
    color: "#372a1c",
    location: "Spain",
    caption:
      "Two minutes of totality. The sky went dark, the birds went quiet and nobody said a word.",
    likes: 4821,
    commentCount: 212,
    date: "August 12",
    comments: [
      { user: "itziar_photo", text: "This is unreal. How did you get the corona so clean?", likes: 48, time: "12w" },
      { user: "mikel_bilbao", text: "Qué pasada tío 🔥🔥", likes: 21, time: "12w" },
      { user: "nora_outdoors", text: "Saving this one forever", likes: 9, time: "12w" },
      { user: "asierbayon", text: "1/250s, a lot of luck and zero clouds 🙏", likes: 14, time: "12w" },
    ],
  },
  {
    id: "ice-jump",
    width: 818,
    height: 1024,
    color: "#625b52",
    location: "Swiss Alps",
    caption: "Floor is lava, but make it glacier.",
    likes: 2967,
    commentCount: 87,
    date: "August 2",
    comments: [
      { user: "jonas_peaks", text: "Please tell me that ice held 😅", likes: 33, time: "13w" },
      { user: "ane_travels", text: "The light on the water!!", likes: 12, time: "13w" },
      { user: "unai_climbs", text: "Iconic pose", likes: 6, time: "13w" },
    ],
  },
  {
    id: "glacier-lake",
    width: 768,
    height: 1024,
    color: "#7f7f7f",
    location: "Swiss Alps",
    caption:
      "Woke up at 4am for this lake. The ice was still cracking when the sun came through.",
    likes: 6104,
    commentCount: 164,
    date: "August 2",
    comments: [
      { user: "swissvibes_daily", text: "Would love to feature this on our page! DM'd you 🇨🇭", likes: 57, time: "13w" },
      { user: "lena_wandert", text: "Looks like another planet", likes: 24, time: "13w" },
      { user: "thomas_zrh", text: "Drone shots hitting different this summer", likes: 11, time: "13w" },
    ],
  },
  {
    id: "matterhorn-cave",
    width: 767,
    height: 1024,
    color: "#547387",
    location: "Zermatt, Switzerland",
    caption: "Found a frame for the Matterhorn. Skis on the shoulder, cold toes, no regrets.",
    likes: 5390,
    commentCount: 143,
    date: "March 9",
    comments: [
      { user: "luca_altitude", text: "That blue ice is insane", likes: 39, time: "35w" },
      { user: "elena_mts", text: "Is this cave still accessible? Need the spot 👀", likes: 18, time: "35w" },
      { user: "asierbayon", text: "It changes every season, ask the guides in Zermatt", likes: 7, time: "35w" },
    ],
  },
  {
    id: "fog-summit",
    width: 819,
    height: 1024,
    color: "#7b7a6f",
    location: "Central Switzerland",
    caption: "Everyone in the valley had a grey Sunday. We had this.",
    likes: 3812,
    commentCount: 96,
    date: "November 17, 2025",
    comments: [
      { user: "marc_alpine", text: "Nebelmeer season is the best season", likes: 26, time: "51w" },
      { user: "sofia_trails", text: "Golden hour on the grass 😍", likes: 10, time: "51w" },
      { user: "maite_go", text: "Me encanta", likes: 4, time: "51w" },
    ],
  },
  {
    id: "seealpsee",
    width: 819,
    height: 1024,
    color: "#6b756f",
    location: "Seealpsee, Appenzell",
    caption: "If you need me, I'll be borrowing this boat.",
    likes: 4433,
    commentCount: 118,
    date: "June 28, 2025",
    comments: [
      { user: "kai_nordic", text: "Postcard levels of perfect", likes: 31, time: "1y" },
      { user: "itziar_photo", text: "The foreground flowers make it", likes: 15, time: "1y" },
      { user: "jonas_peaks", text: "Berggasthaus owes you a commission", likes: 22, time: "1y" },
    ],
  },
  {
    id: "milky-way",
    width: 819,
    height: 1024,
    color: "#403f3b",
    location: "Grindelwald, Switzerland",
    caption: "Stayed up past midnight to watch the core rise over the glacier. Worth every yawn.",
    likes: 3958,
    commentCount: 104,
    date: "June 14, 2025",
    comments: [
      { user: "nora_outdoors", text: "How many seconds of exposure?", likes: 19, time: "1y" },
      { user: "asierbayon", text: "@nora_outdoors 15s at f/1.8, ISO 3200", likes: 12, time: "1y" },
      { user: "thomas_zrh", text: "The detail in the ice 🤯", likes: 8, time: "1y" },
    ],
  },
  {
    id: "lake-ridge",
    width: 682,
    height: 1024,
    color: "#585128",
    location: "Lake Lugano",
    caption: "Sunrise hike, warm grass, a whole lake to myself.",
    likes: 2741,
    commentCount: 63,
    date: "May 31, 2025",
    comments: [
      { user: "luca_altitude", text: "Ticino in spring never misses", likes: 14, time: "1y" },
      { user: "ane_travels", text: "That light 🧡", likes: 7, time: "1y" },
    ],
  },
  {
    id: "larches",
    width: 819,
    height: 1024,
    color: "#837b67",
    location: "Lagh da Saoseo, Graubünden",
    caption: "Larch season. The whole valley turns gold for about ten days a year.",
    likes: 7214,
    commentCount: 231,
    date: "October 19, 2024",
    comments: [
      { user: "swissvibes_daily", text: "One of the prettiest lakes in the country 😍", likes: 64, time: "2y" },
      { user: "elena_mts", text: "The reflection is perfect", likes: 27, time: "2y" },
      { user: "mikel_bilbao", text: "Esto parece pintado", likes: 13, time: "2y" },
      { user: "sofia_trails", text: "Adding to my autumn list", likes: 5, time: "2y" },
    ],
  },
  {
    id: "oeschinensee",
    width: 768,
    height: 1024,
    color: "#8b9881",
    location: "Oeschinensee, Kandersteg",
    caption: "Clouds rolled in, the lake stayed turquoise anyway.",
    likes: 5672,
    commentCount: 152,
    date: "August 3, 2024",
    comments: [
      { user: "lena_wandert", text: "That colour can't be real", likes: 35, time: "2y" },
      { user: "marc_alpine", text: "Did the panorama trail too, so good", likes: 12, time: "2y" },
      { user: "kai_nordic", text: "Moody and perfect", likes: 6, time: "2y" },
    ],
  },
  {
    id: "hut-night",
    width: 819,
    height: 1024,
    color: "#202d3f",
    location: "Swiss Alps",
    caption: "Blue hour at the hut. Dinner at 6, lights out at 10, alarm at 4.",
    likes: 3105,
    commentCount: 74,
    date: "July 20, 2024",
    comments: [
      { user: "unai_climbs", text: "Hut life is the best life", likes: 22, time: "2y" },
      { user: "jonas_peaks", text: "That glacier view from the window though", likes: 9, time: "2y" },
    ],
  },
  {
    id: "kirkjufell",
    width: 682,
    height: 1024,
    color: "#32392d",
    location: "Kirkjufell, Iceland",
    caption: "The most photographed mountain in Iceland, and I still stood there for an hour.",
    likes: 6380,
    commentCount: 187,
    date: "June 22, 2024",
    comments: [
      { user: "ane_travels", text: "The yellow flowers in front 👌", likes: 29, time: "2y" },
      { user: "kai_nordic", text: "Iceland is calling me", likes: 16, time: "2y" },
      { user: "itziar_photo", text: "Love the scale with you on the cliff", likes: 11, time: "2y" },
    ],
  },
  {
    id: "fog-sunset",
    width: 682,
    height: 1024,
    color: "#261b18",
    location: "Switzerland",
    caption: "Tiny human, big sea of clouds.",
    likes: 4217,
    commentCount: 98,
    date: "January 14, 2024",
    comments: [
      { user: "thomas_zrh", text: "Wallpaper material", likes: 18, time: "2y" },
      { user: "maite_go", text: "Qué bonito 😍", likes: 6, time: "2y" },
      { user: "marc_alpine", text: "Those winter inversions are magic", likes: 10, time: "2y" },
    ],
  },
  {
    id: "sea-of-clouds",
    width: 1024,
    height: 682,
    color: "#9b8676",
    location: "Säntis, Switzerland",
    caption: "First light over the Alpstein. Ears frozen, heart full.",
    likes: 3549,
    commentCount: 81,
    date: "December 30, 2023",
    comments: [
      { user: "swissvibes_daily", text: "What a way to close the year", likes: 21, time: "3y" },
      { user: "elena_mts", text: "Those layers of clouds 😮‍💨", likes: 8, time: "3y" },
    ],
  },
  {
    id: "ice-cave",
    width: 1024,
    height: 576,
    color: "#285564",
    location: "Glacier ice cave",
    caption: "Inside the glacier everything is blue and very, very loud when it creaks.",
    likes: 2894,
    commentCount: 69,
    date: "February 11, 2023",
    comments: [
      { user: "luca_altitude", text: "Bucket list", likes: 13, time: "3y" },
      { user: "nora_outdoors", text: "The textures on the ceiling!!", likes: 9, time: "3y" },
    ],
  },
  {
    id: "fanal",
    width: 819,
    height: 1024,
    color: "#8b8776",
    location: "Fanal, Madeira",
    caption: "Fog, 500-year-old laurel trees and absolute silence.",
    likes: 5126,
    commentCount: 139,
    date: "October 8, 2023",
    comments: [
      { user: "sofia_trails", text: "Looks like a fairytale forest", likes: 25, time: "3y" },
      { user: "mikel_bilbao", text: "Madeira 🔝", likes: 11, time: "3y" },
      { user: "ane_travels", text: "Going next month, any tips?", likes: 4, time: "3y" },
      { user: "asierbayon", text: "Go early, the fog is best before 9am", likes: 6, time: "3y" },
    ],
  },
  {
    id: "sea-stack",
    width: 819,
    height: 1024,
    color: "#aaaaaa",
    location: "Ribeira da Janela, Madeira",
    caption: "Black, white and a lot of balancing stones.",
    likes: 2378,
    commentCount: 52,
    date: "October 6, 2023",
    comments: [
      { user: "itziar_photo", text: "B&W suits this place", likes: 14, time: "3y" },
      { user: "unai_climbs", text: "That rock is huge", likes: 3, time: "3y" },
    ],
  },
  {
    id: "glacier-ridge",
    width: 819,
    height: 1024,
    color: "#79838b",
    location: "Aiguille du Midi, Chamonix",
    caption: "Spot the climber.",
    likes: 4689,
    commentCount: 126,
    date: "August 19, 2023",
    comments: [
      { user: "jonas_peaks", text: "Took me way too long to find them", likes: 38, time: "3y" },
      { user: "lena_wandert", text: "This is the scale I needed today", likes: 12, time: "3y" },
      { user: "marc_alpine", text: "Chamonix is something else", likes: 7, time: "3y" },
    ],
  },
  {
    id: "matterhorn-sunrise",
    width: 819,
    height: 1024,
    color: "#8d8377",
    location: "Zermatt, Switzerland",
    caption: "Sunrise behind the Matterhorn with the glacier still asleep.",
    likes: 6957,
    commentCount: 201,
    date: "July 30, 2023",
    comments: [
      { user: "swissvibes_daily", text: "That flare + the curve of the glacier 🤌", likes: 52, time: "3y" },
      { user: "kai_nordic", text: "Absolutely stunning", likes: 17, time: "3y" },
      { user: "maite_go", text: "Increíble", likes: 5, time: "3y" },
    ],
  },
  {
    id: "alpenglow",
    width: 682,
    height: 1024,
    color: "#654852",
    location: "Bernese Oberland",
    caption: "Thirty seconds of pink before it all went blue.",
    likes: 3324,
    commentCount: 77,
    date: "July 2, 2023",
    comments: [
      { user: "elena_mts", text: "Alpenglow hits different", likes: 16, time: "3y" },
      { user: "thomas_zrh", text: "Those colours!!", likes: 6, time: "3y" },
    ],
  },
  {
    id: "ibex",
    width: 576,
    height: 1024,
    color: "#6e7c7c",
    location: "Swiss Alps",
    caption: "He posed. I didn't even have to ask.",
    likes: 5841,
    commentCount: 163,
    date: "June 17, 2023",
    comments: [
      { user: "nora_outdoors", text: "Look at those horns 😳", likes: 27, time: "3y" },
      { user: "luca_altitude", text: "Steinbock modelling career unlocked", likes: 41, time: "3y" },
      { user: "sofia_trails", text: "So majestic", likes: 8, time: "3y" },
    ],
  },
  {
    id: "prayer-flags",
    width: 1024,
    height: 768,
    color: "#66604d",
    location: "Swiss Alps",
    caption: "Morning view from the hut terrace, framed by prayer flags.",
    likes: 2610,
    commentCount: 58,
    date: "June 10, 2023",
    comments: [
      { user: "unai_climbs", text: "Love the framing", likes: 11, time: "3y" },
      { user: "ane_travels", text: "That orange peak 🧡", likes: 5, time: "3y" },
    ],
  },
  {
    id: "plane-wreck",
    width: 818,
    height: 1024,
    color: "#7d7d7d",
    location: "Sólheimasandur, Iceland",
    caption: "Walked 4km of black sand for this. Would do it again.",
    likes: 4078,
    commentCount: 109,
    date: "May 21, 2023",
    comments: [
      { user: "kai_nordic", text: "The walk is longer than people think 😂", likes: 23, time: "3y" },
      { user: "mikel_bilbao", text: "Top Gun vibes", likes: 9, time: "3y" },
      { user: "itziar_photo", text: "Clean edit", likes: 4, time: "3y" },
    ],
  },
  {
    id: "skogafoss",
    width: 819,
    height: 1024,
    color: "#7c7e82",
    location: "Skógafoss, Iceland",
    caption: "Rainbow included, free of charge.",
    likes: 5273,
    commentCount: 134,
    date: "May 18, 2023",
    comments: [
      { user: "lena_wandert", text: "You look so tiny 😮", likes: 30, time: "3y" },
      { user: "jonas_peaks", text: "Did you get soaked?", likes: 12, time: "3y" },
      { user: "asierbayon", text: "Completely 🌊", likes: 8, time: "3y" },
    ],
  },
];

const profileTabs: { id: ProfileTab; label: string; icon: IconName }[] = [
  { id: "posts", label: "Posts", icon: "grid" },
  { id: "reels", label: "Reels", icon: "reels" },
  { id: "tagged", label: "Tagged", icon: "tagged" },
];

const iconPaths = {
  heart: (
    <path d="M12 20.4s-7.6-4.6-9.4-9.3C1.3 7.8 3.4 4.3 7 4.3c2.1 0 3.6 1.2 5 3.1 1.4-1.9 2.9-3.1 5-3.1 3.6 0 5.7 3.5 4.4 6.8-1.8 4.7-9.4 9.3-9.4 9.3Z" />
  ),
  comment: <path d="M20.66 17.01a10 10 0 1 0-3.59 3.61L22 22Z" />,
  share: (
    <>
      <path d="M22 3 9.22 10.08" />
      <path d="M11.7 20.33 22 3H2l7.22 7.08Z" />
    </>
  ),
  bookmark: <path d="M20 21 12 13.44 4 21V3h16Z" />,
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M9.02 3v18M14.99 3v18M21 9.02H3M21 14.99H3" />
    </>
  ),
  reels: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M3 8.5h18M8.5 3l3 5.5M14.5 3l3 5.5M10 12v5l4.5-2.5Z" />
    </>
  ),
  tagged: (
    <>
      <path d="M10.2 3.8 12 2l1.8 1.8a1.6 1.6 0 0 0 1.12.46h5.26A1.82 1.82 0 0 1 22 6.08v14.1A1.82 1.82 0 0 1 20.18 22H3.82A1.82 1.82 0 0 1 2 20.18V6.08a1.82 1.82 0 0 1 1.82-1.82h5.26a1.6 1.6 0 0 0 1.12-.46Z" />
      <circle cx="12" cy="10.5" r="3.5" />
      <path d="M18.6 22v-.6a3.95 3.95 0 0 0-3.95-3.95H9.5a3.95 3.95 0 0 0-3.95 3.95v.6" />
    </>
  ),
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type IconName = keyof typeof iconPaths;

const Icon = ({
  name,
  className = "size-6",
  isFilled = false,
}: {
  name: IconName;
  className?: string;
  isFilled?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={isFilled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {iconPaths[name]}
  </svg>
);

export const thumbSrc = (postId: string) => `/os/instagram/${postId}-thumb.webp`;
export const fullSrc = (postId: string) => `/os/instagram/${postId}.webp`;
export const thumbHeight = (post: Post) =>
  Math.round((THUMB_WIDTH * post.height) / post.width);
export const formatCount = (value: number) => value.toLocaleString("en-US");
const shareCount = (post: Post) => Math.round(post.likes / 24);

const ActionCount = ({ value }: { value: number }) => (
  <span className="text-sm font-semibold @3xl:hidden">{formatCount(value)}</span>
);

const preloadedSources = new Set<string>();
export const preloadImage = (src: string) => {
  if (preloadedSources.has(src)) {
    return;
  }
  preloadedSources.add(src);
  const image = new Image();
  image.decoding = "async";
  image.src = src;
};

const avatarHue = (handle: string) =>
  [...handle].reduce((sum, character) => sum + character.charCodeAt(0) * 7, 0) %
  360;

const UserAvatar = ({ handle, className = "size-8" }: { handle: string; className?: string }) => {
  if (handle === USERNAME) {
    return (
      <img
        src={AVATAR_SRC}
        alt=""
        width={160}
        height={160}
        decoding="async"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-full text-xs font-semibold text-white uppercase`}
      style={{ background: `hsl(${avatarHue(handle)} 45% 52%)` }}
    >
      {handle[0]}
    </span>
  );
};

const ProfileActions = ({
  isFollowing,
  onToggleFollow,
  className,
}: {
  isFollowing: boolean;
  onToggleFollow: () => void;
  className: string;
}) => {
  const followClassName = isFollowing
    ? "bg-[#363636] text-[#f5f5f5] hover:bg-[#262626]"
    : "bg-[#0095f6] text-white hover:bg-[#1877f2]";

  return (
    <div className={`${className} gap-2`}>
      <button
        type="button"
        aria-pressed={isFollowing}
        onClick={onToggleFollow}
        className={`${followClassName} h-8 flex-1 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors @2xl:flex-none`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
      <a
        href={PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message asierbayon on Instagram, opens in a new tab"
        className="grid h-8 flex-1 place-items-center rounded-lg bg-[#363636] px-4 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-[#262626] @2xl:flex-none"
      >
        Message
      </a>
    </div>
  );
};

const ProfileBio = ({ className }: { className: string }) => (
  <div className={`${className} text-sm leading-[18px]`}>
    <p className="text-[#a8a8a8]">Unprofessional account</p>
    <p className="mt-2">Probably in the mountains</p>
    <p>Based in Switzerland</p>
  </div>
);

const ProfileStats = ({ className }: { className: string }) => {
  const stats = [
    { label: "posts", value: formatCount(posts.length) },
    { label: "followers", value: formatCount(9100) },
    { label: "following", value: formatCount(1400) },
  ];

  return (
    <ul className={`${className} text-sm`}>
      {stats.map((stat) => (
        <li key={stat.label}>
          <span className="font-semibold">{stat.value}</span> {stat.label}
        </li>
      ))}
    </ul>
  );
};

const PostTile = ({
  post,
  likes,
  commentCount,
  onOpen,
}: {
  post: Post;
  likes: number;
  commentCount: number;
  onOpen: (postId: string) => void;
}) => {
  const handlePreload = () => {
    preloadImage(fullSrc(post.id));
  };

  return (
    <button
      type="button"
      aria-label={`Open post: ${post.caption}`}
      onClick={() => onOpen(post.id)}
      onPointerEnter={handlePreload}
      onFocus={handlePreload}
      className="group relative block aspect-3/4 cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0095f6]"
      style={{ backgroundColor: post.color }}
    >
      <img
        src={thumbSrc(post.id)}
        alt=""
        width={THUMB_WIDTH}
        height={thumbHeight(post)}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover"
      />
      <span className="absolute inset-0 hidden items-center justify-center gap-5 bg-black/30 text-base font-bold text-white group-hover:flex group-focus-visible:flex">
        <span className="flex items-center gap-1.5">
          <Icon name="heart" isFilled className="size-5" />
          {formatCount(likes)}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="comment" isFilled className="size-5" />
          {formatCount(commentCount)}
        </span>
      </span>
    </button>
  );
};

export const PostImage = ({
  post,
  onDoubleClick,
  className = "bg-black",
  fitClassName = "object-contain",
}: {
  post: Post;
  onDoubleClick?: () => void;
  className?: string;
  fitClassName?: string;
}) => {
  const fullImageRef = useRef<HTMLImageElement>(null);
  const [isFullLoaded, setIsFullLoaded] = useState(false);

  useEffect(() => {
    if (!fullImageRef.current?.complete) {
      return;
    }
    setIsFullLoaded(true);
  }, []);

  return (
    <div className={`${className} absolute inset-0`} onDoubleClick={onDoubleClick}>
      <img
        src={thumbSrc(post.id)}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
        className={`${fitClassName} absolute inset-0 size-full`}
      />
      <img
        ref={fullImageRef}
        src={fullSrc(post.id)}
        alt={`${post.caption} — ${post.location}`}
        width={post.width}
        height={post.height}
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onLoad={() => setIsFullLoaded(true)}
        className={`${fitClassName} absolute inset-0 size-full transition-opacity duration-300 ${isFullLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

const CommentRow = ({
  comment,
  isLiked,
  onToggleLike,
}: {
  comment: PostComment;
  isLiked: boolean;
  onToggleLike: () => void;
}) => {
  const likes = comment.likes + Number(isLiked);
  const likeClassName = isLiked ? "text-[#ff3040]" : "text-[#a8a8a8] hover:text-[#737373]";

  return (
    <li className="flex items-start gap-3">
      <span className="hidden @3xl:block">
        <UserAvatar handle={comment.user} />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-[18px]">
        <p className="break-words">
          <span className="mr-1 font-semibold">{comment.user}</span>
          {comment.text}
        </p>
        <p className="mt-1.5 hidden gap-3 text-xs text-[#a8a8a8] @3xl:flex">
          <span>{comment.time}</span>
          {likes > 0 && (
            <span className="font-semibold">
              {formatCount(likes)} {likes === 1 ? "like" : "likes"}
            </span>
          )}
          <span className="font-semibold">Reply</span>
        </p>
      </div>
      <button
        type="button"
        aria-label={isLiked ? `Unlike comment by ${comment.user}` : `Like comment by ${comment.user}`}
        aria-pressed={isLiked}
        onClick={onToggleLike}
        className={`${likeClassName} mt-0.5 cursor-pointer @3xl:mt-1`}
      >
        <Icon name="heart" isFilled={isLiked} className="size-3" />
      </button>
    </li>
  );
};

type PostViewerProps = {
  post: Post;
  position: number;
  comments: PostComment[];
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  likedCommentKeys: Set<string>;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLike: () => void;
  onLike: () => void;
  onToggleSave: () => void;
  onToggleCommentLike: (commentKey: string) => void;
  onAddComment: (text: string) => void;
};

const PostViewer = ({
  post,
  position,
  comments,
  commentCount,
  isLiked,
  isSaved,
  likedCommentKeys,
  onClose,
  onPrevious,
  onNext,
  onToggleLike,
  onLike,
  onToggleSave,
  onToggleCommentLike,
  onAddComment,
}: PostViewerProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLLIElement>(null);
  const [draft, setDraft] = useState("");
  const [burstKey, setBurstKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const hasPrevious = position > 0;
  const hasNext = position < posts.length - 1;
  const likes = post.likes + Number(isLiked);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const neighbours = [posts[position - 1], posts[position + 1]];
    neighbours.forEach((neighbour) => {
      if (!neighbour) {
        return;
      }
      preloadImage(fullSrc(neighbour.id));
    });
  }, [position]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    if (event.key === "ArrowLeft" && hasPrevious) {
      onPrevious();
      return;
    }
    if (event.key === "ArrowRight" && hasNext) {
      onNext();
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    onClose();
  };

  const handleImageDoubleClick = () => {
    onLike();
    if (shouldReduceMotion) {
      return;
    }
    setBurstKey((key) => key + 1);
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    onAddComment(text);
    setDraft("");
    requestAnimationFrame(() => {
      commentsEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  };

  const handleFocusComment = () => {
    commentInputRef.current?.focus();
  };

  const handleShare = () => {
    void navigator.clipboard?.writeText(PROFILE_URL);
  };

  const likeClassName = isLiked ? "text-[#ff3040]" : "hover:text-[#a8a8a8]";
  const navButtonClassName =
    "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/85 text-[#0c1014] shadow-md transition hover:bg-white";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Post by ${USERNAME}: ${post.caption}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 outline-none @3xl:px-14 @3xl:py-8"
    >
      <button
        type="button"
        aria-label="Close post"
        onClick={onClose}
        className="absolute top-3 right-3 z-30 hidden size-9 cursor-pointer place-items-center rounded-full text-white transition hover:bg-black/60 @3xl:grid"
      >
        <Icon name="close" className="size-6" />
      </button>

      <article className="flex size-full max-w-[1080px] flex-col overflow-y-auto overscroll-contain bg-black @3xl:flex-row @3xl:overflow-hidden @3xl:rounded-[4px] @3xl:border @3xl:border-[#262626]">
        <header className="sticky top-0 z-20 grid h-11 shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-[#262626] bg-black @3xl:hidden">
          <button
            type="button"
            aria-label="Back to profile"
            onClick={onClose}
            className="grid size-11 cursor-pointer place-items-center"
          >
            <Icon name="chevronLeft" className="size-6" />
          </button>
          <div className="text-center leading-tight">
            <p className="text-[11px] font-semibold tracking-wide text-[#a8a8a8] uppercase">{USERNAME}</p>
            <h2 className="text-base font-bold">Posts</h2>
          </div>
        </header>

        <div className="relative aspect-4/5 w-full shrink-0 bg-black @max-3xl:order-2 @3xl:aspect-auto @3xl:w-auto @3xl:flex-1">
          <PostImage
            key={post.id}
            post={post}
            onDoubleClick={handleImageDoubleClick}
            fitClassName="object-cover @3xl:object-contain"
          />
          <AnimatePresence>
            {burstKey > 0 && (
              <motion.span
                key={burstKey}
                className="pointer-events-none absolute inset-0 grid place-items-center text-white drop-shadow-lg"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.15, 1, 1] }}
                transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1] }}
                onAnimationComplete={() => setBurstKey(0)}
              >
                <Icon name="heart" isFilled className="size-24" />
              </motion.span>
            )}
          </AnimatePresence>
          {hasPrevious && (
            <button type="button" aria-label="Previous post" onClick={onPrevious} className={`${navButtonClassName} left-3`}>
              <Icon name="chevronLeft" className="size-4" />
            </button>
          )}
          {hasNext && (
            <button type="button" aria-label="Next post" onClick={onNext} className={`${navButtonClassName} right-3`}>
              <Icon name="chevronRight" className="size-4" />
            </button>
          )}
        </div>

        <div className="contents @3xl:flex @3xl:min-h-0 @3xl:w-[340px] @3xl:flex-none @3xl:flex-col @3xl:border-l @3xl:border-[#262626]">
          <header className="flex items-center gap-3 px-4 py-3 @max-3xl:order-1 @3xl:border-b @3xl:border-[#262626]">
            <UserAvatar handle={USERNAME} className="size-8" />
            <div className="min-w-0 flex-1 text-sm leading-[18px]">
              <p className="font-semibold">{USERNAME}</p>
              <p className="truncate text-xs text-[#a8a8a8]">{post.location}</p>
            </div>
            <Icon name="more" className="size-5" />
          </header>

          <ul className="space-y-1.5 px-4 pt-2.5 @max-3xl:order-5 @3xl:min-h-0 @3xl:flex-1 @3xl:space-y-4 @3xl:overflow-y-auto @3xl:overscroll-contain @3xl:py-4">
            <li className="flex items-start gap-3">
              <span className="hidden @3xl:block">
                <UserAvatar handle={USERNAME} />
              </span>
              <div className="min-w-0 flex-1 text-sm leading-[18px]">
                <p className="break-words">
                  <span className="mr-1 font-semibold">{USERNAME}</span>
                  {post.caption}
                </p>
                <p className="mt-1.5 hidden text-xs text-[#a8a8a8] @3xl:block">{post.date}</p>
              </div>
            </li>
            {comments.map((comment, index) => {
              const commentKey = `${post.id}:${index}`;
              return (
                <CommentRow
                  key={commentKey}
                  comment={comment}
                  isLiked={likedCommentKeys.has(commentKey)}
                  onToggleLike={() => onToggleCommentLike(commentKey)}
                />
              );
            })}
            <li ref={commentsEndRef} aria-hidden="true" />
          </ul>

          <footer className="contents @3xl:block @3xl:border-t @3xl:border-[#262626]">
            <div className="flex items-center gap-4 px-4 pt-2.5 @max-3xl:order-3">
              <button
                type="button"
                aria-label={isLiked ? "Unlike post" : "Like post"}
                aria-pressed={isLiked}
                onClick={onToggleLike}
                className="flex cursor-pointer items-center gap-1.5 transition-transform active:scale-90"
              >
                <Icon name="heart" isFilled={isLiked} className={`${likeClassName} size-6`} />
                <ActionCount value={likes} />
              </button>
              <button
                type="button"
                aria-label="Comment on post"
                onClick={handleFocusComment}
                className="flex cursor-pointer items-center gap-1.5 hover:text-[#a8a8a8]"
              >
                <Icon name="comment" />
                <ActionCount value={commentCount} />
              </button>
              <button
                type="button"
                aria-label="Copy profile link"
                onClick={handleShare}
                className="flex cursor-pointer items-center gap-1.5 hover:text-[#a8a8a8]"
              >
                <Icon name="share" />
                <ActionCount value={shareCount(post)} />
              </button>
              <button
                type="button"
                aria-label={isSaved ? "Remove from saved" : "Save post"}
                aria-pressed={isSaved}
                onClick={onToggleSave}
                className="ml-auto cursor-pointer hover:text-[#a8a8a8]"
              >
                <Icon name="bookmark" isFilled={isSaved} />
              </button>
            </div>
            <p className="px-4 pt-2 text-sm font-semibold @max-3xl:hidden">{formatCount(likes)} likes</p>
            <p className="px-4 pt-2 pb-3 text-xs text-[#a8a8a8] @max-3xl:order-6 @3xl:pt-0.5 @3xl:text-[10px] @3xl:tracking-wide @3xl:uppercase">
              {post.date}
            </p>
            <form
              onSubmit={handleSubmitComment}
              className="flex items-center gap-3 border-t border-[#262626] px-4 py-2.5 @max-3xl:order-7"
            >
              <input
                ref={commentInputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                aria-label="Add a comment"
                placeholder="Add a comment…"
                maxLength={300}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a8a8a8]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="cursor-pointer text-sm font-semibold text-[#0095f6] hover:text-[#e0f1ff] disabled:cursor-default disabled:opacity-40 disabled:hover:text-[#0095f6]"
              >
                Post
              </button>
            </form>
            <div className="order-8 @3xl:hidden">
              <HomeIndicatorSpacer />
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
};

const toggleInSet = (current: Set<string>, value: string) => {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
    return next;
  }
  next.add(value);
  return next;
};

export default function InstagramProfile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(() => new Set());
  const [likedCommentKeys, setLikedCommentKeys] = useState<Set<string>>(() => new Set());
  const [addedComments, setAddedComments] = useState<Record<string, PostComment[]>>({});

  const openPostIndex = posts.findIndex((post) => post.id === openPostId);
  const openPost = posts[openPostIndex];

  const commentsFor = (postId: string, baseComments: PostComment[]) => [
    ...baseComments,
    ...(addedComments[postId] ?? []),
  ];
  const commentCountFor = (post: Post) =>
    post.commentCount + (addedComments[post.id]?.length ?? 0);

  const handleOpenPost = (postId: string) => {
    setOpenPostId(postId);
  };
  const handleClosePost = () => {
    setOpenPostId(null);
  };
  const handleShowAdjacentPost = (step: number) => {
    const nextPost = posts[openPostIndex + step];
    if (!nextPost) {
      return;
    }
    setOpenPostId(nextPost.id);
  };
  const handleToggleLike = (postId: string) => {
    setLikedPostIds((current) => toggleInSet(current, postId));
  };
  const handleLike = (postId: string) => {
    setLikedPostIds((current) => new Set(current).add(postId));
  };
  const handleToggleSave = (postId: string) => {
    setSavedPostIds((current) => toggleInSet(current, postId));
  };
  const handleToggleCommentLike = (commentKey: string) => {
    setLikedCommentKeys((current) => toggleInSet(current, commentKey));
  };
  const handleAddComment = (postId: string, text: string) => {
    const comment: PostComment = { user: USERNAME, text, likes: 0, time: "now" };
    setAddedComments((current) => ({
      ...current,
      [postId]: [...(current[postId] ?? []), comment],
    }));
  };
  const handleToggleFollow = () => {
    setIsFollowing((value) => !value);
  };

  return (
    <div className="instagram-app @container relative flex min-h-0 flex-1 flex-col bg-black text-[#f5f5f5] select-text [color-scheme:dark]">
      <header className="flex h-11 shrink-0 items-center justify-center border-b border-[#262626] px-4 min-[701px]:hidden">
        <h1 className="truncate text-base font-bold">{USERNAME}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[935px] px-4 pt-5 pb-10 @2xl:px-5 @2xl:pt-8">
          <header className="flex items-center gap-6 @2xl:items-start @2xl:gap-16 @2xl:px-10">
            <UserAvatar handle={USERNAME} className="size-[86px] @2xl:size-[150px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <h2 className="hidden text-xl leading-6 font-normal min-[701px]:block">{USERNAME}</h2>
                <ProfileActions isFollowing={isFollowing} onToggleFollow={handleToggleFollow} className="hidden @2xl:flex" />
              </div>
              <p className="text-sm leading-[18px] font-semibold @2xl:mt-4 @2xl:text-base">Asier Bayón</p>
              <ProfileStats className="mt-2 flex gap-5 @2xl:mt-3 @2xl:gap-10 @2xl:text-base" />
              <ProfileBio className="mt-5 hidden @2xl:block" />
            </div>
          </header>
          <ProfileBio className="mt-4 @2xl:hidden" />
          <ProfileActions isFollowing={isFollowing} onToggleFollow={handleToggleFollow} className="mt-4 flex @2xl:hidden" />

          <div role="tablist" aria-label="Profile content" className="mt-6 flex justify-center gap-14 border-t border-[#262626] @2xl:mt-10">
            {profileTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              const tabClassName = isActive ? "border-[#f5f5f5] text-[#f5f5f5]" : "border-transparent text-[#a8a8a8]";
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tabClassName} -mt-px flex h-14 cursor-pointer items-center gap-2 border-t text-sm font-semibold tracking-[0.1em] uppercase`}
                >
                  <Icon name={tab.icon} className="size-6 @md:size-4" />
                  <span className="hidden @md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "posts" && (
            <div role="tabpanel" aria-label="Posts" className="grid grid-cols-3 gap-0.5 @2xl:gap-1">
              {posts.map((post) => (
                <PostTile
                  key={post.id}
                  post={post}
                  likes={post.likes + Number(likedPostIds.has(post.id))}
                  commentCount={commentCountFor(post)}
                  onOpen={handleOpenPost}
                />
              ))}
            </div>
          )}
          {activeTab !== "posts" && (
            <div role="tabpanel" aria-label={activeTab} className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="grid size-16 place-items-center rounded-full border-2 border-[#f5f5f5]">
                <Icon name={activeTab === "reels" ? "reels" : "tagged"} className="size-8" />
              </span>
              <p className="text-2xl font-extrabold">{activeTab === "reels" ? "No reels yet" : "No photos of you"}</p>
              <p className="max-w-xs text-sm text-[#a8a8a8]">
                {activeTab === "reels"
                  ? "Too busy hiking to edit videos. Check the posts instead."
                  : "When people tag asierbayon in photos, they'll appear here."}
              </p>
            </div>
          )}
        </div>
        <HomeIndicatorSpacer />
      </div>

      {openPost && (
        <PostViewer
          post={openPost}
          position={openPostIndex}
          comments={commentsFor(openPost.id, openPost.comments)}
          commentCount={commentCountFor(openPost)}
          isLiked={likedPostIds.has(openPost.id)}
          isSaved={savedPostIds.has(openPost.id)}
          likedCommentKeys={likedCommentKeys}
          onClose={handleClosePost}
          onPrevious={() => handleShowAdjacentPost(-1)}
          onNext={() => handleShowAdjacentPost(1)}
          onToggleLike={() => handleToggleLike(openPost.id)}
          onLike={() => handleLike(openPost.id)}
          onToggleSave={() => handleToggleSave(openPost.id)}
          onToggleCommentLike={handleToggleCommentLike}
          onAddComment={(text) => handleAddComment(openPost.id, text)}
        />
      )}
    </div>
  );
}
