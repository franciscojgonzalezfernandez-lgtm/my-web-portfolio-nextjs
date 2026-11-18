"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  PROFILE_URL,
  PostImage,
  THUMB_WIDTH,
  USERNAME,
  formatCount,
  fullSrc,
  posts,
  preloadImage,
  thumbHeight,
  thumbSrc,
  type Post,
} from "./instagram";
import HomeIndicatorSpacer from "./home-indicator-spacer";
import { photoIdsInAlbum } from "./photo-library";

type Photo = Post & { takenAt: Date };
type CollectionId = "library" | "favorites" | "me" | "work" | "projects" | "memes";
type LibraryView = "years" | "months" | "all";
type PhotoGroup = { key: string; label: string; photos: Photo[] };
type Collection = { id: CollectionId; label: string; icon: PhotosIconName };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const ZOOM_COLUMNS = [9, 7, 5, 4, 3];
const DEFAULT_ZOOM_LEVEL = 2;
const INITIAL_FAVORITE_IDS = ["portrait-smiling", "telefonica-farewell", "adobe-experience-makers"];

const TAKEN_AT_PATTERN = new RegExp(`^(${MONTH_NAMES.join("|")}) (\\d{1,2})(?:, (\\d{4}))?$`);

const parseTakenAt = (date: string) => {
  const match = TAKEN_AT_PATTERN.exec(date);
  const monthName = match?.[1];
  const dayText = match?.[2];
  if (!monthName || !dayText) return null;
  const month = MONTH_NAMES.indexOf(monthName);
  const day = Number(dayText);
  const year = match[3] ? Number(match[3]) : new Date().getFullYear();
  const takenAt = new Date(year, month, day);
  if (
    takenAt.getFullYear() !== year ||
    takenAt.getMonth() !== month ||
    takenAt.getDate() !== day
  ) {
    return null;
  }
  return takenAt;
};

const photos: Photo[] = posts.flatMap((post) => {
  const takenAt = parseTakenAt(post.date);
  if (!takenAt) return [];
  return [{ ...post, takenAt }];
}).sort((first, second) => first.takenAt.getTime() - second.takenAt.getTime());

const postIds = new Set(posts.map((post) => post.id));
const requirePhotoIds = (ids: readonly string[]) => {
  ids.forEach((id) => {
    if (!postIds.has(id)) throw new Error(`Unknown photo id: ${id}`);
  });
};

const albumPhotoIds: Record<Exclude<CollectionId, "library" | "favorites">, string[]> = {
  me: photoIdsInAlbum("me"),
  work: photoIdsInAlbum("work"),
  projects: photoIdsInAlbum("projects"),
  memes: photoIdsInAlbum("memes"),
};

requirePhotoIds(INITIAL_FAVORITE_IDS);
Object.values(albumPhotoIds).forEach(requirePhotoIds);

const libraryCollections: Collection[] = [
  { id: "library", label: "Library", icon: "library" },
  { id: "favorites", label: "Favorites", icon: "heart" },
];

const albumCollections: Collection[] = [
  { id: "me", label: "Me", icon: "album" },
  { id: "work", label: "Work", icon: "album" },
  { id: "projects", label: "Projects", icon: "album" },
  { id: "memes", label: "Memes", icon: "album" },
];

const allCollections = [...libraryCollections, ...albumCollections];

const libraryViews: { id: LibraryView; label: string }[] = [
  { id: "years", label: "Years" },
  { id: "months", label: "Months" },
  { id: "all", label: "All Photos" },
];

const photosIconPaths = {
  library: (
    <>
      <rect x="3" y="7" width="14" height="14" rx="2" />
      <path d="M7 3h12a2 2 0 0 1 2 2v12" />
      <path d="m3 17 4-4 4 4 2-2 4 4" />
    </>
  ),
  heart: (
    <path d="M12 20.4s-7.6-4.6-9.4-9.3C1.3 7.8 3.4 4.3 7 4.3c2.1 0 3.6 1.2 5 3.1 1.4-1.9 2.9-3.1 5-3.1 3.6 0 5.7 3.5 4.4 6.8-1.8 4.7-9.4 9.3-9.4 9.3Z" />
  ),
  album: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M6 5h12M8.5 2h7" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
} satisfies Record<string, ReactNode>;

type PhotosIconName = keyof typeof photosIconPaths;

const PhotosIcon = ({
  name,
  className = "size-5",
  isFilled = false,
}: {
  name: PhotosIconName;
  className?: string;
  isFilled?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={isFilled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {photosIconPaths[name]}
  </svg>
);

const dayFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const shortMonthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

const formatDay = (date: Date) => dayFormatter.format(date);

const formatDateRange = (items: Photo[]) => {
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) {
    return "";
  }
  const start = shortMonthFormatter.format(first.takenAt);
  const end = shortMonthFormatter.format(last.takenAt);
  if (start === end) {
    return start;
  }
  return `${start} – ${end}`;
};

const formatPhotoCount = (count: number) => `${formatCount(count)} ${count === 1 ? "Photo" : "Photos"}`;

const groupPhotos = (items: Photo[], keyOf: (photo: Photo) => string, labelOf: (photo: Photo) => string) =>
  items.reduce<PhotoGroup[]>((groups, photo) => {
    const key = keyOf(photo);
    const lastGroup = groups.at(-1);
    if (lastGroup?.key === key) {
      lastGroup.photos.push(photo);
      return groups;
    }
    groups.push({ key, label: labelOf(photo), photos: [photo] });
    return groups;
  }, []);

const yearGroups = groupPhotos(
  photos,
  (photo) => String(photo.takenAt.getFullYear()),
  (photo) => String(photo.takenAt.getFullYear()),
);

const monthGroups = groupPhotos(
  photos,
  (photo) => `${photo.takenAt.getFullYear()}-${photo.takenAt.getMonth()}`,
  (photo) => monthFormatter.format(photo.takenAt),
);

const describePlaces = (items: Photo[]) => {
  const places = [...new Set(items.map((photo) => photo.location.split(",")[0]))];
  const shownPlaces = places.slice(0, 2).join(", ");
  const hiddenCount = places.length - 2;
  if (hiddenCount <= 0) {
    return shownPlaces;
  }
  return `${shownPlaces} & ${hiddenCount} more`;
};

const photosInCollection = (collectionId: CollectionId, favoriteIds: Set<string>) => {
  if (collectionId === "library") {
    return photos;
  }
  if (collectionId === "favorites") {
    return photos.filter((photo) => favoriteIds.has(photo.id));
  }
  const albumIds = albumPhotoIds[collectionId];
  return photos.filter((photo) => albumIds.includes(photo.id));
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a84ff]";

const SidebarSection = ({
  title,
  collections,
  activeCollectionId,
  onSelect,
}: {
  title: string;
  collections: Collection[];
  activeCollectionId: CollectionId;
  onSelect: (collectionId: CollectionId) => void;
}) => (
  <div>
    <h3 className="px-2 pb-1 text-[11px] font-semibold text-[#8a8986]">{title}</h3>
    <ul>
      {collections.map((collection) => {
        const isActive = collection.id === activeCollectionId;
        const itemClassName = isActive ? "bg-black/[0.09]" : "hover:bg-black/[0.04]";
        return (
          <li key={collection.id}>
            <button
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(collection.id)}
              className={`${itemClassName} ${focusRing} flex h-7 w-full cursor-default items-center gap-2 rounded-md px-2 text-left text-[13px] text-[#232323]`}
            >
              <PhotosIcon name={collection.icon} className="size-4 shrink-0 text-[#0a84ff]" />
              <span className="truncate">{collection.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);

type SegmentedControlVariant = "toolbar" | "floating";

const segmentedControlStyles: Record<
  SegmentedControlVariant,
  { group: string; segment: string; active: string; inactive: string }
> = {
  toolbar: {
    group: "hidden rounded-lg bg-black/[0.06] p-0.5 @2xl:flex",
    segment: "h-6 rounded-md px-2.5 text-xs font-medium",
    active: "bg-white text-[#1d1d1f] shadow-sm",
    inactive: "text-[#555] hover:text-[#1d1d1f]",
  },
  floating: {
    group:
      "absolute bottom-[calc(var(--safe-area-bottom,0px)+12px)] left-1/2 z-[5] flex -translate-x-1/2 rounded-full bg-[#f2f2f7]/75 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.06] backdrop-blur-xl backdrop-saturate-150 @2xl:hidden",
    segment: "h-8 rounded-full px-4 text-[13px] font-semibold",
    active: "bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
    inactive: "text-[#3c3c43]/75",
  },
};

const SegmentedControl = ({
  variant,
  activeView,
  onSelect,
}: {
  variant: SegmentedControlVariant;
  activeView: LibraryView;
  onSelect: (view: LibraryView) => void;
}) => (
  <div aria-label="Library view" role="group" className={segmentedControlStyles[variant].group}>
    {libraryViews.map((libraryView) => {
      const isActive = libraryView.id === activeView;
      const styles = segmentedControlStyles[variant];
      const stateClassName = isActive ? styles.active : styles.inactive;
      return (
        <button
          key={libraryView.id}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(libraryView.id)}
          className={`${styles.segment} ${stateClassName} ${focusRing} cursor-default whitespace-nowrap transition-colors`}
        >
          {libraryView.label}
        </button>
      );
    })}
  </div>
);

const ZoomSlider = ({ zoomLevel, onChange }: { zoomLevel: number; onChange: (zoomLevel: number) => void }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <label className="hidden items-center gap-1.5 text-[#8a8986] @2xl:flex">
      <PhotosIcon name="photo" className="size-3" />
      <input
        type="range"
        min={0}
        max={ZOOM_COLUMNS.length - 1}
        step={1}
        value={zoomLevel}
        onChange={handleChange}
        aria-label="Zoom"
        className="w-24 cursor-default accent-[#0a84ff]"
      />
      <PhotosIcon name="photo" className="size-4" />
    </label>
  );
};

const PhotoTile = ({
  photo,
  isFavorite,
  onOpen,
}: {
  photo: Photo;
  isFavorite: boolean;
  onOpen: (photoId: string) => void;
}) => {
  const handlePreload = () => {
    preloadImage(fullSrc(photo.id));
  };

  return (
    <button
      type="button"
      data-photo-id={photo.id}
      aria-label={`${photo.location}, ${formatDay(photo.takenAt)}`}
      onClick={() => onOpen(photo.id)}
      onPointerEnter={handlePreload}
      onFocus={handlePreload}
      className="relative block aspect-square cursor-default overflow-hidden focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#0a84ff]"
      style={{ backgroundColor: photo.color }}
    >
      <img
        src={thumbSrc(photo.id)}
        alt=""
        width={THUMB_WIDTH}
        height={thumbHeight(photo)}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover"
      />
      {isFavorite && (
        <PhotosIcon
          name="heart"
          isFilled
          className="absolute bottom-1 left-1 size-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        />
      )}
    </button>
  );
};

const GroupCard = ({
  group,
  isLarge,
  onOpen,
}: {
  group: PhotoGroup;
  isLarge: boolean;
  onOpen: (group: PhotoGroup) => void;
}) => {
  const cover = group.photos.at(-1);
  if (!cover) {
    return null;
  }
  const cardClassName = isLarge ? "aspect-[16/9]" : "aspect-[4/3]";
  const labelClassName = isLarge ? "text-3xl" : "text-xl";

  return (
    <button
      type="button"
      aria-label={`Show ${group.label}, ${formatPhotoCount(group.photos.length)}`}
      onClick={() => onOpen(group)}
      className={`${cardClassName} ${focusRing} group relative block w-full cursor-default overflow-hidden rounded-xl shadow-sm`}
      style={{ backgroundColor: cover.color }}
    >
      <img
        src={thumbSrc(cover.id)}
        alt=""
        width={THUMB_WIDTH}
        height={thumbHeight(cover)}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-linear-to-b from-black/50 via-black/5 to-transparent" />
      <span className="absolute top-3 left-4 right-4 text-left text-white">
        <span className={`${labelClassName} block font-bold tracking-tight`}>{group.label}</span>
        <span className="block truncate text-xs font-medium text-white/85">{describePlaces(group.photos)}</span>
      </span>
      <span className="absolute right-3 bottom-3 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
        {formatPhotoCount(group.photos.length)}
      </span>
    </button>
  );
};

const LibraryFooter = ({ count }: { count: number }) => (
  <footer className="py-6 text-center text-xs text-[#8a8986]">
    <p className="font-semibold text-[#555]">{formatPhotoCount(count)}</p>
    <p className="mt-0.5">
      More on{" "}
      <a
        href={PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open @${USERNAME} on YouTube, opens in a new tab`}
        className={`${focusRing} rounded-sm text-[#0a84ff] hover:underline`}
      >
        @{USERNAME}
      </a>{" "}
      on YouTube
    </p>
  </footer>
);

const EmptyFavorites = () => (
  <div className="grid h-full place-content-center justify-items-center gap-2 p-10 text-center">
    <PhotosIcon name="heart" className="size-12 text-[#c7c7cc]" />
    <p className="text-lg font-semibold text-[#1d1d1f]">No Favorites</p>
    <p className="max-w-60 text-sm text-[#8a8986]">Open a photo and tap the heart to add it here.</p>
  </div>
);

const ToolbarButton = ({
  label,
  isPressed,
  onClick,
  children,
}: {
  label: string;
  isPressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={isPressed}
    onClick={onClick}
    className={`${focusRing} grid size-8 shrink-0 cursor-default place-items-center rounded-md text-[#555] hover:bg-black/[0.06] active:bg-black/10`}
  >
    {children}
  </button>
);

type PhotoViewerProps = {
  photo: Photo;
  previousPhoto?: Photo;
  nextPhoto?: Photo;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onShowPhoto: (photoId: string) => void;
};

const PhotoViewer = ({
  photo,
  previousPhoto,
  nextPhoto,
  isFavorite,
  onToggleFavorite,
  onClose,
  onShowPhoto,
}: PhotoViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    viewerRef.current?.focus();
  }, []);

  useEffect(() => {
    [previousPhoto, nextPhoto].forEach((neighbour) => {
      if (!neighbour) {
        return;
      }
      preloadImage(fullSrc(neighbour.id));
    });
  }, [previousPhoto, nextPhoto]);

  const handleShowPrevious = () => {
    if (!previousPhoto) {
      return;
    }
    onShowPhoto(previousPhoto.id);
  };

  const handleShowNext = () => {
    if (!nextPhoto) {
      return;
    }
    onShowPhoto(nextPhoto.id);
  };

  const handleToggleInfo = () => {
    setIsInfoOpen((value) => !value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "ArrowLeft") {
      handleShowPrevious();
      return;
    }
    if (event.key === "ArrowRight") {
      handleShowNext();
      return;
    }
    if (event.key === ".") {
      onToggleFavorite();
    }
  };

  const favoriteClassName = isFavorite ? "text-[#ff375f]" : "";
  const navButtonClassName = `${focusRing} absolute top-1/2 z-10 grid size-9 -translate-y-1/2 cursor-default place-items-center rounded-full bg-white/80 text-[#1d1d1f] opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100`;
  const details = [
    { label: "Date", value: formatDay(photo.takenAt) },
    { label: "Location", value: photo.location },
    { label: "Dimensions", value: `${photo.width} × ${photo.height}` },
  ];

  return (
    <div
      ref={viewerRef}
      role="region"
      aria-label={`Photo: ${photo.location}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-10 flex flex-col bg-white pb-[var(--safe-area-bottom,0px)] outline-none"
    >
      <header className="flex h-[52px] shrink-0 items-center gap-1 bg-white px-2 @2xl:border-b @2xl:border-[#e3e2df] @2xl:bg-[#f6f5f2] @2xl:px-3">
        <ToolbarButton label="Back to photos" onClick={onClose}>
          <PhotosIcon name="chevronLeft" className="size-5" />
        </ToolbarButton>
        <div className="min-w-0 flex-1 px-1 leading-tight">
          <p className="truncate text-[13px] font-semibold text-[#1d1d1f]">{photo.location}</p>
          <p className="truncate text-[11px] text-[#8a8986]">{formatDay(photo.takenAt)}</p>
        </div>
        <ToolbarButton
          label={isFavorite ? "Unfavorite" : "Favorite"}
          isPressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <PhotosIcon name="heart" isFilled={isFavorite} className={`${favoriteClassName} size-5`} />
        </ToolbarButton>
        <ToolbarButton label="Info" isPressed={isInfoOpen} onClick={handleToggleInfo}>
          <PhotosIcon name="info" className="size-5" />
        </ToolbarButton>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="group relative min-w-0 flex-1">
          <PostImage key={photo.id} post={photo} onDoubleClick={onToggleFavorite} className="bg-white" />
          {previousPhoto && (
            <button type="button" aria-label="Previous photo" onClick={handleShowPrevious} className={`${navButtonClassName} left-3`}>
              <PhotosIcon name="chevronLeft" className="size-4" />
            </button>
          )}
          {nextPhoto && (
            <button type="button" aria-label="Next photo" onClick={handleShowNext} className={`${navButtonClassName} right-3`}>
              <PhotosIcon name="chevronRight" className="size-4" />
            </button>
          )}
        </div>

        {isInfoOpen && (
          <aside
            aria-label="Photo info"
            className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-2xl border-t border-[#e3e2df] bg-white/95 p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl @3xl:static @3xl:max-h-none @3xl:w-[260px] @3xl:rounded-none @3xl:border-t-0 @3xl:border-l @3xl:shadow-none"
          >
            <p className="text-sm leading-5 text-[#1d1d1f] select-text">{photo.caption}</p>
            <dl className="mt-4 divide-y divide-[#ecebe8] text-xs">
              {details.map((detail) => (
                <div key={detail.label} className="flex justify-between gap-4 py-2">
                  <dt className="text-[#8a8986]">{detail.label}</dt>
                  <dd className="text-right text-[#1d1d1f]">{detail.value}</dd>
                </div>
              ))}
            </dl>
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Javi's YouTube channel, opens in a new tab"
              className={`${focusRing} mt-4 inline-block rounded-sm text-xs font-medium text-[#0a84ff] hover:underline`}
            >
              More on YouTube
            </a>
          </aside>
        )}
      </div>
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

export default function PhotosApp() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollPhotoIdRef = useRef<string | null>(null);
  const [collectionId, setCollectionId] = useState<CollectionId>("library");
  const [libraryView, setLibraryView] = useState<LibraryView>("all");
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(INITIAL_FAVORITE_IDS));
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);

  const isLibrary = collectionId === "library";
  const activeView = isLibrary ? libraryView : "all";
  const visiblePhotos = photosInCollection(collectionId, favoriteIds);
  const activeCollection = allCollections.find((collection) => collection.id === collectionId) ?? allCollections[0];
  const openPhoto = photos.find((photo) => photo.id === openPhotoId);
  const openPhotoIndex = visiblePhotos.findIndex((photo) => photo.id === openPhotoId);
  const subtitle = isLibrary ? formatDateRange(visiblePhotos) : formatPhotoCount(visiblePhotos.length);
  const scrollAreaClassName = isLibrary ? "pb-20 @2xl:pb-0" : "";

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {
      return;
    }
    const pendingPhotoId = pendingScrollPhotoIdRef.current;
    pendingScrollPhotoIdRef.current = null;
    const pendingTile = pendingPhotoId ? scroller.querySelector(`[data-photo-id="${pendingPhotoId}"]`) : null;
    if (pendingTile) {
      pendingTile.scrollIntoView({ block: "start" });
      return;
    }
    scroller.scrollTop = scroller.scrollHeight;
  }, [collectionId, activeView]);

  const handleSelectCollection = (nextCollectionId: CollectionId) => {
    setOpenPhotoId(null);
    setCollectionId(nextCollectionId);
  };

  const handleOpenGroup = (group: PhotoGroup) => {
    pendingScrollPhotoIdRef.current = group.photos[0]?.id ?? null;
    setLibraryView("all");
  };

  const handleOpenPhoto = (photoId: string) => {
    setOpenPhotoId(photoId);
  };

  const handleClosePhoto = () => {
    const closedPhotoId = openPhotoId;
    setOpenPhotoId(null);
    requestAnimationFrame(() => {
      const tile = scrollRef.current?.querySelector<HTMLElement>(`[data-photo-id="${closedPhotoId}"]`);
      tile?.focus();
    });
  };

  const handleToggleFavorite = (photoId: string) => {
    setFavoriteIds((current) => toggleInSet(current, photoId));
  };

  const renderContent = () => {
    if (collectionId === "favorites" && visiblePhotos.length === 0) {
      return <EmptyFavorites />;
    }
    if (activeView === "years") {
      return (
        <div className="grid gap-4 p-4 @3xl:grid-cols-2 @3xl:gap-5 @3xl:p-5">
          {yearGroups.map((group) => (
            <GroupCard key={group.key} group={group} isLarge onOpen={handleOpenGroup} />
          ))}
        </div>
      );
    }
    if (activeView === "months") {
      return (
        <div className="grid grid-cols-2 gap-3 p-4 @3xl:grid-cols-3 @3xl:gap-4 @3xl:p-5">
          {monthGroups.map((group) => (
            <GroupCard key={group.key} group={group} isLarge={false} onOpen={handleOpenGroup} />
          ))}
        </div>
      );
    }
    return (
      <>
        <div
          className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-0.5 @2xl:grid-cols-[repeat(var(--photo-columns),minmax(0,1fr))]"
          style={{ "--photo-columns": ZOOM_COLUMNS[zoomLevel] } as CSSProperties}
        >
          {visiblePhotos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} isFavorite={favoriteIds.has(photo.id)} onOpen={handleOpenPhoto} />
          ))}
        </div>
        <LibraryFooter count={visiblePhotos.length} />
      </>
    );
  };

  return (
    <div className="photos-app @container flex min-h-0 min-w-0 flex-1 bg-white text-[#1d1d1f] select-none">
      <nav
        aria-label="Photos sidebar"
        className="hidden w-[196px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-[#d4d3cf] bg-[#edebe7] px-2.5 py-4 @2xl:flex"
      >
        <SidebarSection
          title="Photos"
          collections={libraryCollections}
          activeCollectionId={collectionId}
          onSelect={handleSelectCollection}
        />
        <SidebarSection
          title="Albums"
          collections={albumCollections}
          activeCollectionId={collectionId}
          onSelect={handleSelectCollection}
        />
      </nav>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-x-4 bg-white px-4 pt-4 @2xl:min-h-[52px] @2xl:border-b @2xl:border-[#e3e2df] @2xl:bg-[#f6f5f2] @2xl:py-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[30px] leading-9 font-bold tracking-tight @2xl:text-[15px] @2xl:leading-tight @2xl:tracking-normal">
              {activeCollection.label}
            </h2>
            <p className="truncate text-[13px] font-medium text-[#8e8e93] @2xl:text-[11px] @2xl:leading-tight @2xl:font-normal @2xl:text-[#8a8986]">
              {subtitle}
            </p>
          </div>
          {isLibrary && <SegmentedControl variant="toolbar" activeView={libraryView} onSelect={setLibraryView} />}
          {activeView === "all" && <ZoomSlider zoomLevel={zoomLevel} onChange={setZoomLevel} />}
        </header>

        <ul
          aria-label="Collections"
          className="flex shrink-0 gap-2 overflow-x-auto border-b border-black/[0.06] bg-white px-4 pt-3 pb-3 [scrollbar-width:none] @2xl:hidden"
        >
          {allCollections.map((collection) => {
            const isActive = collection.id === collectionId;
            const chipClassName = isActive
              ? "bg-[#0a84ff] text-white shadow-[0_2px_6px_rgba(10,132,255,0.35)]"
              : "bg-[#767680]/[0.12] text-[#1d1d1f] active:bg-[#767680]/20";
            return (
              <li key={collection.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleSelectCollection(collection.id)}
                  className={`${chipClassName} ${focusRing} h-[30px] rounded-full px-3.5 text-[13px] font-semibold transition-colors`}
                >
                  {collection.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div ref={scrollRef} className={`${scrollAreaClassName} min-h-0 flex-1 overflow-y-auto overscroll-contain`}>
          {renderContent()}
          <HomeIndicatorSpacer />
        </div>

        {isLibrary && <SegmentedControl variant="floating" activeView={libraryView} onSelect={setLibraryView} />}

        {openPhoto && (
          <PhotoViewer
            photo={openPhoto}
            previousPhoto={visiblePhotos[openPhotoIndex - 1]}
            nextPhoto={openPhotoIndex === -1 ? undefined : visiblePhotos[openPhotoIndex + 1]}
            isFavorite={favoriteIds.has(openPhoto.id)}
            onToggleFavorite={() => handleToggleFavorite(openPhoto.id)}
            onClose={handleClosePhoto}
            onShowPhoto={handleOpenPhoto}
          />
        )}
      </main>
    </div>
  );
}
