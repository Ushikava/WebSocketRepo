import type { TranslationKeys } from './en';

const ru: Record<TranslationKeys, string> = {
  // Navbar
  searchPlaceholder: 'Поиск авторов, тегов, настроений...',
  notifications: 'Уведомления',
  upload: 'Загрузить',
  logIn: 'Войти',
  logout: 'Выйти',
  profile: 'Профиль',
  myVideos: 'Мои видео',
  settings: 'Настройки',

  // Sidebar
  navForYou: 'Для вас',
  navTrending: 'В тренде',
  navFollowing: 'Подписки',
  navRandom: 'Случайное',
  navMyLikes: 'Мои лайки',
  navHistory: 'История',
  explore: 'Обзор',

  // AuthPromptDialog
  pleaseSignIn: 'Войдите в аккаунт',
  authPromptBody: 'Для этого действия нужно войти в аккаунт. Создайте аккаунт или войдите, чтобы продолжить.',
  cancel: 'Отмена',
  signIn: 'Войти',
  register: 'Зарегистрироваться',

  // VideoFeed / VideoList
  deleteVideo: 'Удалить видео',
  noVideosYet: 'Видео пока нет',
  uploadFirstVideo: 'Загрузить первое видео',
  videoNotFound: 'Видео не найдено',
  loadMore: 'Загрузить ещё',
  noMoreVideos: 'Видео закончились, но вы всегда можете добавить новое!',

  // UFlowProfilePage
  userNotFound: 'Пользователь не найден',
  profileVideos: 'Видео',
  profileViews: 'Просмотры',
  profileLikes: 'Лайки',

  // UploadDialog
  uploadVideo: 'Загрузка видео',
  uploadSuccess: 'Видео успешно загружено!',
  clickToSelect: 'Нажмите, чтобы выбрать файл',
  fileTypes: 'MP4, WebM, MOV, AVI',
  videoTitle: 'Название',
  videoTitlePlaceholder: 'Введите название видео...',
  uploadError: 'Ошибка загрузки',
  serverError: 'Ошибка соединения с сервером',

  // Settings popover
  settingsTitle: 'Настройки',
  languageLabel: 'Язык',
  darkModeLabel: 'Тёмная тема',

  // UFlowSettingsPage
  profileSettings: 'Настройки профиля',
  settingsProfileImages: 'Изображения профиля',
  settingsAvatar: 'Аватар',
  settingsBanner: 'Баннер профиля',
  settingsAccount: 'Аккаунт',
  settingsNewUsername: 'Новый никнейм',
  settingsPassword: 'Смена пароля',
  settingsCurrentPassword: 'Текущий пароль',
  settingsNewPassword: 'Новый пароль',
  settingsSave: 'Сохранить',
  settingsSaved: 'Сохранено!',
  settingsClickToChange: 'Нажмите для изменения',

  // VideoAuthPage
  loginTab: 'Войти',
  registerTab: 'Регистрация',
  username: 'Никнейм',
  email: 'Email',
  password: 'Пароль',
  confirmPassword: 'Подтвердите пароль',
  loginButton: 'Войти',
  registerButton: 'Зарегистрироваться',
  loginError: 'Ошибка входа',
  registerError: 'Ошибка регистрации',
  connectionError: 'Ошибка соединения с сервером',
  passwordMismatch: 'Пароли не совпадают',
};

export default ru;
