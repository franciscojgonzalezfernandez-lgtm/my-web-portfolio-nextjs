// Ends a scroll area so its last item clears the iOS home indicator while the area itself scrolls behind it.
const HomeIndicatorSpacer = () => <div aria-hidden="true" className="h-[var(--safe-area-bottom,0px)] shrink-0" />;

export default HomeIndicatorSpacer;
