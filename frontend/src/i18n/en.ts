const en = {
  // Navbar
  searchPlaceholder: 'Search creators, tags, moods...',
  notifications: 'Notifications',
  upload: 'Upload',
  logIn: 'Log In',
  logout: 'Logout',
  profile: 'Profile',
  myVideos: 'My Videos',
  settings: 'Settings',

  // Sidebar
  navForYou: 'For You',
  navTrending: 'Trending',
  navFollowing: 'Following',
  navRandom: 'Random',
  navMyLikes: 'My Likes',
  navHistory: 'History',
  explore: 'Explore',

  // AuthPromptDialog
  pleaseSignIn: 'Please, sign in',
  authPromptBody: 'You need to be logged in to do this. Create an account or sign in to continue.',
  cancel: 'Cancel',
  signIn: 'Sign In',
  register: 'Register',

  // VideoFeed / VideoList
  noVideosYet: 'No videos yet',
  uploadFirstVideo: 'Upload first video',
  videoNotFound: 'Video not found',
  loadMore: 'Load more',

  // UploadDialog
  uploadVideo: 'Upload Video',
  uploadSuccess: 'Video uploaded successfully!',
  clickToSelect: 'Click to select a file',
  fileTypes: 'MP4, WebM, MOV, AVI',
  videoTitle: 'Title',
  videoTitlePlaceholder: 'Enter video title...',
  uploadError: 'Upload error',
  serverError: 'Server connection error',

  // Settings popover
  settingsTitle: 'Settings',
  languageLabel: 'Language',
  darkModeLabel: 'Dark mode',

  // VideoAuthPage
  loginTab: 'Sign In',
  registerTab: 'Register',
  username: 'Nickname',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm password',
  loginButton: 'Sign In',
  registerButton: 'Register',
  loginError: 'Login error',
  registerError: 'Registration error',
  connectionError: 'Server connection error',
  passwordMismatch: 'Passwords do not match',
} as const;

export type TranslationKeys = keyof typeof en;
export default en;
