export const messages = {
  notFound: {
    code: "404",
    title: "Page not found.",
    subtitle: "The page you're looking for may have moved or no longer exists.",
    home: "Back to home",
  },
  navigation: {
    labels: {
      home: "Home",
      about: "About",
      portfolio: "Portfolio",
      videos: "Videos",
      contact: "Contact",
    },
    primaryLabel: "Primary navigation",
    homeLinkLabel: "Go to home page",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
  },
  footer: {
    socialMediaLabel: "Social media",
    emailLinkLabel: "Email",
    emailAddressLabel: (email: string) => `Email ${email}`,
    copyright: (year: number, name: string) => `© ${year} ${name}`,
    platforms: {
      instagram: "Instagram",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      youtube: "YouTube",
      pinterest: "Pinterest",
      tumblr: "Tumblr",
      flickr: "Flickr",
    },
  },
  consent: {
    cookieSettings: "Cookie Settings",
    closeSettings: "Close settings without saving",
    description:
      "Necessary storage remembers your choices for six months. Optional services stay off until you allow them.",
    analytics: "Analytics",
    analyticsDescription:
      "Allow Google Analytics to measure visits and page views. Advertising features are disabled.",
    youtube: "YouTube videos",
    youtubeDescription:
      "Allow embedded YouTube content and its associated data processing by Google, using youtube-nocookie.com. The Home background video loads independently of this setting.",
    save: "Save preferences",
    legal: "Privacy and cookies",
    bannerLabel: "Optional cookies and videos",
    title: "Your privacy choices",
    bannerDescription:
      "Analytics and content videos are off until you choose. The Home YouTube background loads independently. We use necessary storage to remember your preferences for six months.",
    acceptAll: "Accept all",
    rejectOptional: "Reject optional",
    settings: "Settings",
    storageError:
      "Preferences could not be stored. Your choices apply to this visit only.",
  },
  youtube: {
    title: "YouTube video",
    coverAlt: (title: string) => `Cover for ${title}`,
    blocked:
      "YouTube is blocked. Allowing playback enables YouTube content and its associated data processing by Google.",
    allowAndPlay: "Allow YouTube and play",
    watch: "Watch on YouTube",
  },
  themePreview: {
    eyebrow: "Development theme preview",
    title: "Typography and controls",
    description:
      "Preview of the semantic theme tokens used by the application.",
    link: "Text link",
    primaryAction: "Primary action",
    secondaryAction: "Secondary action",
    surfaceTitle: "Surface and border",
    surfaceDescription:
      "Supporting text uses the muted foreground token on a white surface.",
    invertedTitle: "Inverted section",
    invertedDescription:
      "Black sections use the primary surface and its accessible foreground.",
  },
  preview: {
    name: "STUDIO PORTFOLIO",
    description: "A flexible home for selected work.",
  },
  bookingCta: {
    heading: "Have a project in mind?",
    action: "Contact for booking",
  },
  portfolio: {
    filtersLabel: "Filter portfolio photos",
    allFilter: "All",
    noItems: "No portfolio photos have been published yet.",
    noFilteredItems: "No photos match this tag.",
    photosCount: "portfolio photos",
    photosCountLabel: (count: number) => `${count} portfolio photos`,
    openPhotoLabel: (description: string) =>
      `View photo: ${description || "View photo"}`,
    unavailable: "Portfolio photos are temporarily unavailable.",
    openPhoto: "View photo",
    lightboxLabel: "Portfolio photo viewer",
    closePhoto: "Close photo viewer",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
  },
  home: {
    videoTitle: "Background video",
  },
  pages: {
    legal: "Privacy and cookies",
    comingSoon: "Coming soon.",
    about: "About",
    cv: "CV",
    portfolio: "Portfolio",
    videos: "Videos",
    contact: "Contact",
    project: "Project",
    unavailable: "This page is currently unavailable.",
  },
} as const;
